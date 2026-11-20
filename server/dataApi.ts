import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { databaseConfigured, query, withTransaction } from './db.ts';
import {
  getProfile,
  requireRole,
  requireUser,
  updateProfile,
  type AuthUser,
} from './auth.ts';
import { confirmDodoPayment } from './paymentsApi.ts';
import { mergeProgressData } from './progressMerge.ts';
import { normalizeProgressDocument } from './progressCompatibility.ts';

type Json = Record<string, any>;

function newId(prefix = ''): string {
  return `${prefix}${crypto.randomBytes(12).toString('hex')}`;
}

function cleanObject(value: any): any {
  if (Array.isArray(value)) return value.map(cleanObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, cleanObject(v)]));
}

function errorWithStatus(message: string, status = 400): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

/** Which business account an org.* call acts on: the caller, or any business when an admin names one. */
function orgOwnerUid(user: AuthUser, args: Json): string {
  const owner = user.role === 'admin' && args.organizationId ? String(args.organizationId) : user.uid;
  if (user.role !== 'admin' && owner !== user.uid) throw errorWithStatus('Organization access denied', 403);
  return owner;
}

function selfOrRole(user: AuthUser, uid: string, roles: string[] = ['admin']): void {
  if (user.uid !== uid) requireRole(user, roles);
}

function profileFromRow(row: any): Json {
  const profile = row.profile || row.data || {};
  return {
    ...profile,
    uid: row.uid,
    email: row.email,
    role: row.role === 'content-manager' ? 'student' : row.role,
    displayName: row.display_name || profile.displayName || row.email?.split('@')[0] || 'Learner',
    photoURL: row.photo_url ?? profile.photoURL ?? null,
    createdAt: Number(row.created_at ?? profile.createdAt ?? 0),
    suspended: row.disabled ?? profile.suspended ?? false,
  };
}

function classFromRow(row: any, studentUids?: string[]): Json {
  return {
    ...(row.data || {}),
    id: row.id,
    teacherUid: row.teacher_uid,
    ...(row.organization_id ? { organizationId: row.organization_id } : {}),
    studentUids: studentUids || [],
  };
}

async function listClassMembers(classId: string): Promise<string[]> {
  const result = await query<{ user_uid: string }>(
    'SELECT user_uid FROM class_members WHERE class_id = $1 ORDER BY joined_at',
    [classId],
  );
  return result.rows.map((row) => row.user_uid);
}

async function getClass(classId: string): Promise<Json | null> {
  const result = await query('SELECT id, teacher_uid, organization_id, data FROM classes WHERE id = $1', [classId]);
  if (!result.rows[0]) return null;
  return classFromRow(result.rows[0], await listClassMembers(classId));
}

/** True when `user` is a business account that owns the teacher (teacher profile.organizationId === user.uid). */
async function ownsTeacher(user: AuthUser, teacherUid: string): Promise<boolean> {
  if (user.role !== 'business' && user.role !== 'organization') return false;
  const found = await query("SELECT 1 FROM app_users WHERE uid = $1 AND role = 'teacher' AND profile->>'organizationId' = $2 LIMIT 1", [teacherUid, user.uid]);
  return !!found.rowCount;
}

async function requireClassAccess(user: AuthUser, classId: string, write = false): Promise<Json> {
  const cls = await getClass(classId);
  if (!cls) throw errorWithStatus('Class not found', 404);
  if (user.role === 'admin' || cls.teacherUid === user.uid) return cls;
  if (!write && await ownsTeacher(user, cls.teacherUid)) return cls;
  if (!write && cls.studentUids.includes(user.uid)) return cls;
  throw errorWithStatus('Class access denied', 403);
}

async function requireStudentAccess(user: AuthUser, uid: string): Promise<void> {
  if (user.uid === uid || user.role === 'admin') return;
  requireRole(user, ['educator']);
  const found = await query(
    `SELECT 1 FROM class_members m JOIN classes c ON c.id = m.class_id
      WHERE m.user_uid = $1 AND (c.teacher_uid = $2 OR c.teacher_uid IN (
        SELECT uid FROM app_users WHERE role = 'teacher' AND profile->>'organizationId' = $2 AND $3 IN ('business', 'organization')))
      LIMIT 1`,
    [uid, user.uid, user.role],
  );
  if (!found.rowCount) throw errorWithStatus('Student access denied', 403);
}

async function requireAssignmentAccess(user: AuthUser, id: string, write = false): Promise<Json> {
  const found = await query('SELECT class_id, data FROM assignments WHERE id = $1', [id]);
  if (!found.rows[0]) throw errorWithStatus('Assignment not found', 404);
  await requireClassAccess(user, found.rows[0].class_id, write);
  return found.rows[0];
}

async function addNotificationInternal(uid: string, notification: Json): Promise<void> {
  const id = notification.id || newId('notif_');
  const data: Json = { ...notification, id };
  await query(
    `INSERT INTO notifications (id, user_uid, created_at, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_uid, id) DO UPDATE SET data = EXCLUDED.data, created_at = EXCLUDED.created_at`,
    [id, uid, Number(data.createdAt || Date.now()), JSON.stringify(data)],
  );
}

async function addAuditInternal(user: AuthUser, entry: Json): Promise<void> {
  const id = entry.id || newId('audit_');
  await query(
    `INSERT INTO audit_log (id, actor_uid, timestamp, data) VALUES ($1, $2, $3, $4)`,
    [id, user.uid, Number(entry.timestamp || Date.now()), JSON.stringify({ ...entry, id })],
  );
}

async function acceptPendingInvites(user: AuthUser): Promise<void> {
  const pending = await query<{ id: string; sponsor_uid: string; data: Json }>(
    `SELECT id, sponsor_uid, data FROM smarty_max_invites
      WHERE lower(invitee_email) = lower($1) AND status = 'pending' AND COALESCE(data->>'kind', 'max') <> 'teacher'
      ORDER BY created_at ASC`,
    [user.email],
  );
  if (!pending.rows.length) return;
  let first = pending.rows[0];
  const eligible = [];
  for (const invite of pending.rows) {
    const sponsor = await getProfile(invite.sponsor_uid);
    if (sponsor && ['business', 'admin'].includes(sponsor.role) && !(typeof sponsor.planExpiresAt === 'number' && sponsor.planExpiresAt <= Date.now())) eligible.push(invite);
  }
  if (!eligible.length) return;
  first = eligible[0];
  await withTransaction(async (tx) => {
    await tx.query(
      `UPDATE smarty_max_invites
          SET status = 'accepted', invitee_uid = $1,
              data = data || $2::jsonb
        WHERE id = $3 AND status = 'pending'`,
      [user.uid, JSON.stringify({ status: 'accepted', inviteeUid: user.uid, acceptedAt: Date.now() }), first.id],
    );
    await tx.query(
      `UPDATE app_users
          SET profile = profile || $2::jsonb
        WHERE uid = $1`,
      [user.uid, JSON.stringify({ plan: 'smarty-max', sponsoredBy: first.sponsor_uid, planStartedAt: Date.now() })],
    );
  });
  await addNotificationInternal(user.uid, {
    type: 'announcement',
    title: 'SmartyLang Max activated!',
    message: `${first.data?.sponsorName || 'Your sponsor'} gifted you SmartyLang Max access. All features are unlocked!`,
    read: false,
    createdAt: Date.now(),
  });
}

/** A business can invite someone before they have an account; they become its teacher on first sign-in. */
async function acceptPendingTeacherInvites(user: AuthUser): Promise<void> {
  if (!user.email) return;
  const pending = await query<{ id: string; sponsor_uid: string; data: Json }>(
    `SELECT id, sponsor_uid, data FROM smarty_max_invites
      WHERE lower(invitee_email) = lower($1) AND status = 'pending' AND data->>'kind' = 'teacher'
      ORDER BY created_at ASC`,
    [user.email],
  );
  if (!pending.rows.length) return;
  const me = await getProfile(user.uid);
  if (!me || !['student', 'teacher'].includes(me.role) || me.organizationId) return;
  for (const invite of pending.rows) {
    const sponsor = await getProfile(invite.sponsor_uid);
    if (!sponsor || !['business', 'admin'].includes(sponsor.role)) continue;
    await withTransaction(async (tx) => {
      await tx.query(`UPDATE app_users SET role = 'teacher', profile = profile || $2::jsonb WHERE uid = $1`, [user.uid, JSON.stringify({ role: 'teacher', organizationId: invite.sponsor_uid })]);
      await tx.query(
        `UPDATE smarty_max_invites SET status = 'accepted', invitee_uid = $1, data = data || $2::jsonb WHERE id = $3`,
        [user.uid, JSON.stringify({ status: 'accepted', inviteeUid: user.uid, acceptedAt: Date.now() }), invite.id],
      );
    });
    await addNotificationInternal(user.uid, {
      type: 'announcement', title: 'You are now a teacher', message: `${invite.data?.sponsorName || 'A school'} added you as a teacher. You can create classes now.`, read: false, createdAt: Date.now(),
    });
    return;
  }
}

async function handleAction(user: AuthUser, body: Json): Promise<any> {
  const action = String(body?.action || '');
  const args = body?.args || {};

  switch (action) {
    case 'profile.get': {
      selfOrRole(user, String(args.uid || user.uid));
      return getProfile(String(args.uid || user.uid));
    }
    case 'profile.ensure': {
      const existing = await getProfile(user.uid);
      if (existing) {
        await acceptPendingInvites(user);
        await acceptPendingTeacherInvites(user);
        return getProfile(user.uid);
      }
      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role || 'student',
        createdAt: Date.now(),
      };
      const created = await updateProfile(user.uid, profile);
      await acceptPendingInvites(user);
      await acceptPendingTeacherInvites(user);
      return getProfile(user.uid) || created;
    }
    case 'profile.update':
      selfOrRole(user, String(args.uid));
      {
        const patch = cleanObject(args.patch || {});
        if (user.uid !== String(args.uid) && user.role !== 'admin') throw errorWithStatus('Not your account', 403);
        if (user.role !== 'admin') {
          const allowed = new Set(['displayName', 'photoURL', 'startingLevel', 'learningGoal', 'onboardingCompletedAt', 'dailyMinutes']);
          if (Object.keys(patch).some((key) => !allowed.has(key))) throw errorWithStatus('Profile field cannot be changed here', 403);
        }
        if ('dailyMinutes' in patch && ![5, 10, 15, 20].includes(patch.dailyMinutes)) throw errorWithStatus('Invalid daily goal', 400);
        return updateProfile(String(args.uid), patch);
      }
    case 'profile.list': {
      requireRole(user, ['admin']);
      const result = await query('SELECT uid, email, display_name, photo_url, role, profile, created_at, disabled FROM app_users ORDER BY created_at DESC');
      return result.rows.map(profileFromRow);
    }
    case 'profile.role': {
      requireRole(user, ['admin']);
      if (!['student', 'teacher', 'business', 'admin'].includes(args.role)) throw errorWithStatus('Invalid account role', 400);
      if (String(args.uid) === user.uid && args.role !== 'admin') throw errorWithStatus('Admins cannot change their own role.', 403);
      const result = await query(
        `UPDATE app_users SET role = $2, profile = profile || $3::jsonb
          WHERE uid = $1 RETURNING uid, email, display_name, photo_url, role, profile`,
        [String(args.uid), String(args.role), JSON.stringify({ role: args.role })],
      );
      if (!result.rows[0]) throw errorWithStatus('User not found', 404);
      await addAuditInternal(user, { action: 'role_changed', targetUid: args.uid, details: { newRole: args.role } });
      return null;
    }
    case 'profile.teacher': {
      // Teacher accounts are free and self-serve: a learner can switch it on or off.
      // Business and admin roles are managed elsewhere and never change here.
      if (!['student', 'teacher'].includes(user.role)) throw errorWithStatus('This account type cannot change to teacher.', 403);
      const role = args.enabled ? 'teacher' : 'student';
      await query(`UPDATE app_users SET role = $2, profile = profile || $3::jsonb WHERE uid = $1`, [user.uid, role, JSON.stringify({ role })]);
      await addAuditInternal(user, { action: 'role_changed', targetUid: user.uid, details: { newRole: role, selfServe: true } });
      return { role };
    }
    case 'profile.plan': {
      requireRole(user, ['admin']);
      const plan = args.plan == null ? null : String(args.plan);
      // An admin plan change replaces any self-serve cancellation.
      const patch: Json = { plan, planStartedAt: Date.now(), planCancelAt: null, planCancelledAt: null, planCancelReason: null };
      if (plan === null) {
        patch.plan = null;
        patch.planStartedAt = null;
        patch.planSeats = null;
        patch.planLanguages = null;
        patch.planExpiresAt = null;
        patch.sponsoredBy = null;
        patch.role = 'student';
      } else {
        if (args.opts?.seats !== undefined) patch.planSeats = args.opts.seats;
        if (args.opts?.languages !== undefined) patch.planLanguages = args.opts.languages;
        if (args.opts?.expiresAt !== undefined) patch.planExpiresAt = args.opts.expiresAt;
        patch.role = (plan === 'business' || plan === 'teacher' || plan === 'organization') ? 'business' : 'student';
      }
      await updateProfile(String(args.uid), patch);
      await query('UPDATE app_users SET role = $2 WHERE uid = $1', [String(args.uid), patch.role]);
      await addAuditInternal(user, { action: 'plan_changed', targetUid: args.uid, details: { newPlan: plan } });
      return null;
    }
    case 'profile.organization':
      requireRole(user, ['admin']);
      return null;
    case 'profile.suspend':
      requireRole(user, ['admin']);
      await query('UPDATE app_users SET disabled = $2, profile = profile || $3::jsonb WHERE uid = $1', [
        String(args.uid), Boolean(args.suspended), JSON.stringify({ suspended: Boolean(args.suspended) }),
      ]);
      await addAuditInternal(user, {
        action: args.suspended ? 'user_suspended' : 'user_unsuspended',
        targetUid: args.uid,
        details: { suspended: Boolean(args.suspended) },
      });
      return null;

    case 'progress.get': {
      selfOrRole(user, String(args.uid || user.uid));
      const result = await query('SELECT data FROM user_progress WHERE user_uid = $1', [String(args.uid || user.uid)]);
      return result.rows[0]?.data ? normalizeProgressDocument(result.rows[0].data) : null;
    }
    case 'progress.set': {
      selfOrRole(user, String(args.uid || user.uid));
      const uid = String(args.uid || user.uid);
      const incoming = cleanObject(args.data || {});
      await withTransaction(async tx => {
        await tx.query('INSERT INTO user_progress (user_uid, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (user_uid) DO NOTHING', [uid, '{}', Date.now()]);
        const previous = await tx.query('SELECT data FROM user_progress WHERE user_uid = $1 FOR UPDATE', [uid]);
        const next = mergeProgressData(previous.rows[0]?.data || {}, incoming);
        await tx.query('UPDATE user_progress SET data = $2, updated_at = $3 WHERE user_uid = $1', [uid, JSON.stringify(next), Date.now()]);
      });
      return null;
    }
    case 'vocab.list': {
      selfOrRole(user, String(args.uid || user.uid));
      const result = await query('SELECT word, data FROM user_vocab WHERE user_uid = $1 AND lang = $2', [
        String(args.uid || user.uid), String(args.lang || 'en'),
      ]);
      return Object.fromEntries(result.rows.map((row) => [row.word, row.data]));
    }
    case 'vocab.upsert':
      selfOrRole(user, String(args.uid || user.uid));
      await query(
        `INSERT INTO user_vocab (user_uid, lang, word, data, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_uid, lang, word) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [String(args.uid || user.uid), String(args.lang || 'en'), String(args.word), JSON.stringify(cleanObject(args.data || {})), Date.now()],
      );
      return null;
    case 'vocab.sync': {
      const uid = String(args.uid || user.uid);
      selfOrRole(user, uid);
      const upserts = args.upserts, deletes = args.deletes;
      if (!Array.isArray(upserts) || !Array.isArray(deletes) || upserts.length + deletes.length > 100) throw errorWithStatus('Vocabulary batch must contain at most 100 changes');
      const validWord = (word: unknown) => typeof word === 'string' && word.trim().length > 0 && word.length <= 500;
      if (upserts.some(entry => !entry || !validWord(entry.word) || !entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) || deletes.some(word => !validWord(word))) throw errorWithStatus('Invalid vocabulary entry');
      const words = [...upserts.map(entry => entry.word), ...deletes];
      if (new Set(words).size !== words.length) throw errorWithStatus('Vocabulary batch contains duplicate words');
      const lang = String(args.lang || 'en');
      await withTransaction(async tx => {
        if (upserts.length) await tx.query(
          `INSERT INTO user_vocab (user_uid, lang, word, data, updated_at)
           SELECT $1, $2, entry.word, entry.data, $3 FROM jsonb_to_recordset($4::jsonb) AS entry(word text, data jsonb)
           ON CONFLICT (user_uid, lang, word) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [uid, lang, Date.now(), JSON.stringify(cleanObject(upserts))],
        );
        if (deletes.length) await tx.query('DELETE FROM user_vocab WHERE user_uid = $1 AND lang = $2 AND word = ANY($3::text[])', [uid, lang, deletes]);
      });
      return null;
    }
    case 'vocab.delete':
      selfOrRole(user, String(args.uid || user.uid));
      await query('DELETE FROM user_vocab WHERE user_uid = $1 AND lang = $2 AND word = $3', [
        String(args.uid || user.uid), String(args.lang || 'en'), String(args.word),
      ]);
      return null;
    case 'completions.list': {
      selfOrRole(user, String(args.uid || user.uid));
      const result = await query('SELECT id, data FROM completions WHERE user_uid = $1 ORDER BY timestamp DESC LIMIT $2', [
        String(args.uid || user.uid), Math.min(Number(args.limit || 200), 500),
      ]);
      return result.rows.map((row) => ({ id: row.id, ...row.data }));
    }
    case 'completions.upsert':
      selfOrRole(user, String(args.uid || user.uid));
      await query(
        `INSERT INTO completions (user_uid, id, timestamp, data) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_uid, id) DO UPDATE SET timestamp = EXCLUDED.timestamp, data = EXCLUDED.data`,
        [String(args.uid || user.uid), String(args.record.id), Number(args.record.timestamp || Date.now()), JSON.stringify(cleanObject(args.record))],
      );
      return null;
    case 'lesson.list': {
      selfOrRole(user, String(args.uid || user.uid));
      const result = await query('SELECT lang, passage_id, data FROM lesson_unlocks WHERE user_uid = $1', [String(args.uid || user.uid)]);
      return result.rows.map((row) => ({ ...row.data, lang: row.lang, passageId: row.passage_id }));
    }
    case 'lesson.upsert':
      selfOrRole(user, String(args.uid || user.uid));
      await query(
        `INSERT INTO lesson_unlocks (user_uid, lang, passage_id, data, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_uid, lang, passage_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [String(args.uid || user.uid), String(args.lang), String(args.passageId), JSON.stringify(cleanObject(args.data || {})), Date.now()],
      );
      return null;
    case 'summary.get': {
      await requireStudentAccess(user, String(args.uid || user.uid));
      const result = await query('SELECT data FROM student_summaries WHERE user_uid = $1', [String(args.uid || user.uid)]);
      return result.rows[0] ? { uid: args.uid, ...result.rows[0].data } : null;
    }
    case 'summary.list': {
      requireRole(user, ['admin', 'educator']);
      const ids = Array.isArray(args.uids) ? args.uids.map(String) : [];
      if (user.role !== 'admin') {
        if (!ids.length) {
          const members = await query('SELECT DISTINCT m.user_uid FROM class_members m JOIN classes c ON c.id = m.class_id WHERE c.teacher_uid = $1', [user.uid]);
          ids.push(...members.rows.map(row => row.user_uid));
          if (!ids.length) return [];
        }
        for (const uid of ids) await requireStudentAccess(user, uid);
      }
      const result = ids.length
        ? await query('SELECT user_uid, data FROM student_summaries WHERE user_uid = ANY($1::text[])', [ids])
        : await query('SELECT user_uid, data FROM student_summaries');
      return result.rows.map((row) => ({ uid: row.user_uid, ...row.data }));
    }
    case 'summary.update':
      selfOrRole(user, String(args.uid || user.uid));
      await query(
        `INSERT INTO student_summaries (user_uid, data, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (user_uid) DO UPDATE SET data = student_summaries.data || EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [String(args.uid || user.uid), JSON.stringify(cleanObject(args.data || {})), Date.now()],
      );
      return null;
    case 'summary.global': {
      // Old 10-tier league names are folded into the current five.
      const LEGACY: Record<string, string[]> = { Gold: ['Sapphire', 'Platinum'], Emerald: ['Pearl', 'Ruby', 'Amethyst'], Diamond: ['Obsidian'] };
      const ids = [String(args.leagueId), ...(LEGACY[String(args.leagueId)] ?? [])];
      const result = await query(`SELECT s.user_uid, s.data FROM student_summaries s
        JOIN app_users u ON u.uid=s.user_uid AND NOT u.disabled
        WHERE s.data->>'league' = ANY($1) AND (s.data->>'weekKey'=$2 OR s.user_uid=$3)`, [ids, String(args.weekKey), user.uid]);
      return result.rows
        .map((row) => ({ uid: row.user_uid, displayName: row.data.displayName, weekKey: row.data.weekKey, weeklyXp: row.data.weekKey === args.weekKey ? row.data.weeklyXp : 0, league: String(args.leagueId) }))
        .sort((a, b) => Number(b.weeklyXp || 0) - Number(a.weeklyXp || 0))
        .slice(0, Math.min(Number(args.max || 50), 100));
    }
    case 'summary.circle': {
      if (args.scope === 'students') {
        requireRole(user, ['student']);
        const { rows } = await query(`SELECT u.uid, u.display_name, s.data->>'weeklyXp' AS xp
          FROM student_summaries s JOIN app_users u ON u.uid = s.user_uid
          WHERE NOT u.disabled AND u.role = 'student' AND s.data->>'weekKey' = $1
            AND EXISTS (SELECT 1 FROM class_members m WHERE m.user_uid = u.uid)
          ORDER BY CASE WHEN s.data->>'weeklyXp' ~ '^[0-9]{1,10}$' THEN (s.data->>'weeklyXp')::bigint ELSE 0 END DESC, u.uid
          LIMIT 50`, [String(args.weekKey)]);
        return rows.map(row => ({ uid: row.uid, displayName: row.display_name, weeklyXp: Number(row.xp) || 0, weekKey: args.weekKey }));
      }
      let ids: string[];
      if (args.scope === 'class') {
        const cls = await requireClassAccess(user, String(args.classId || ''));
        ids = cls.studentUids;
      } else if (args.scope === 'friends') {
        const { rows } = await query(`SELECT CASE WHEN first_uid=$1 THEN second_uid ELSE first_uid END AS uid
          FROM friendships WHERE accepted AND $1 IN (first_uid, second_uid)`, [user.uid]);
        if (!rows.length) return [];
        ids = [user.uid, ...rows.map(row => row.uid)];
      } else throw errorWithStatus('Invalid leaderboard scope', 400);
      const { rows } = await query(`SELECT u.uid, u.display_name, s.data FROM app_users u
        LEFT JOIN student_summaries s ON s.user_uid=u.uid WHERE NOT u.disabled AND u.uid=ANY($1::text[])`, [ids]);
      return rows.map(row => ({ uid: row.uid, displayName: row.display_name, weeklyXp: row.data?.weeklyXp, weekKey: row.data?.weekKey }));
    }

    case 'class.board': {
      // Class ranking: homework performance plus live-game results, the same for everyone in the class.
      const cls = await requireClassAccess(user, String(args.classId || ''));
      const members = await query(`SELECT u.uid, u.display_name FROM app_users u WHERE u.uid = ANY($1::text[]) AND NOT u.disabled`, [cls.studentUids]);
      const assignments = await query('SELECT id FROM assignments WHERE class_id = $1', [cls.id]);
      const ids = assignments.rows.map(row => row.id);
      const subs = ids.length ? await query(`SELECT student_uid, data FROM submissions WHERE assignment_id = ANY($1::text[]) AND completed_at IS NOT NULL`, [ids]) : { rows: [] as any[] };
      const stats = new Map<string, { done: number; scored: number; sum: number }>();
      for (const row of subs.rows) {
        const entry = stats.get(row.student_uid) || { done: 0, scored: 0, sum: 0 };
        entry.done++;
        const score = Number(row.data?.score ?? row.data?.accuracy);
        if (Number.isFinite(score)) { entry.scored++; entry.sum += Math.max(0, Math.min(100, score)); }
        stats.set(row.student_uid, entry);
      }
      const live = await query<{ uid: string; total: string; games: string }>(
        'SELECT uid, SUM(score) AS total, COUNT(*) AS games FROM live_game_results WHERE class_id = $1 GROUP BY uid', [cls.id]);
      const liveBy = new Map<string, { points: number; games: number }>(live.rows.map(row => [row.uid, { points: Number(row.total) || 0, games: Number(row.games) || 0 }]));
      return {
        classId: cls.id, className: cls.name || '', totalHomework: ids.length,
        rows: members.rows.map(row => {
          const entry = stats.get(row.uid) || { done: 0, scored: 0, sum: 0 };
          const accuracy = entry.scored ? Math.round(entry.sum / entry.scored) : 0;
          const game = liveBy.get(row.uid) || { points: 0, games: 0 };
          return { uid: row.uid, displayName: row.display_name, homeworkDone: entry.done, accuracy, gamePoints: game.points, gamesPlayed: game.games, points: entry.done * 10 + Math.round(entry.sum / 10) + Math.round(game.points / 100) };
        }),
      };
    }
    case 'class.create': {
      requireRole(user, ['educator', 'admin']);
      if (user.uid !== args.teacherUid && user.role !== 'admin') throw errorWithStatus('Not your account', 403);
      if (args.organizationId && args.organizationId !== user.uid && user.role !== 'admin') throw errorWithStatus('Organization access denied', 403);
      const id = newId('class_');
      const data = cleanObject({
        name: String(args.name || '').trim(),
        description: args.description || undefined,
        inviteCode: String(args.inviteCode || newId('').slice(0, 6).toUpperCase()),
        studentUids: [],
        createdAt: Date.now(),
      });
      await query('INSERT INTO classes (id, teacher_uid, organization_id, created_at, data) VALUES ($1, $2, $3, $4, $5)', [
        id, String(args.teacherUid), args.organizationId || null, data.createdAt, JSON.stringify(data),
      ]);
      await addAuditInternal(user, { action: 'class_created', details: { classId: id, name: data.name } });
      return id;
    }
    case 'class.list': {
      const kind = String(args.kind || 'teacher');
      let result;
      if (kind === 'teacher') {
        selfOrRole(user, String(args.uid), ['admin']);
        result = await query('SELECT id, teacher_uid, organization_id, data FROM classes WHERE teacher_uid = $1', [String(args.uid)]);
      } else if (kind === 'organization') {
        selfOrRole(user, String(args.organizationId), ['admin']);
        result = await query('SELECT id, teacher_uid, organization_id, data FROM classes WHERE organization_id = $1', [String(args.organizationId)]);
      } else {
        selfOrRole(user, String(args.uid), ['admin']);
        result = await query(
          'SELECT c.id, c.teacher_uid, c.organization_id, c.data FROM classes c JOIN class_members m ON m.class_id = c.id WHERE m.user_uid = $1',
          [String(args.uid)],
        );
      }
      return Promise.all(result.rows.map(async (row) => classFromRow(row, await listClassMembers(row.id))));
    }
    case 'class.roster': {
      requireRole(user, ['educator', 'admin']);
      const classId = String(args.classId);
      await requireClassAccess(user, classId, true);
      const { rows } = await query(`SELECT u.uid, u.display_name AS name, u.disabled FROM class_members m
        JOIN app_users u ON u.uid = m.user_uid WHERE m.class_id = $1 ORDER BY lower(u.display_name), u.uid`, [classId]);
      return rows;
    }
    case 'class.join': {
      selfOrRole(user, String(args.studentUid));
      const result = await query('SELECT id, teacher_uid, organization_id, data FROM classes WHERE upper(data->>\'inviteCode\') = $1 LIMIT 1', [
        String(args.code || '').trim().toUpperCase(),
      ]);
      const row = result.rows[0];
      if (!row) throw errorWithStatus('Class not found. Check the invite code.', 404);
      const members = await listClassMembers(row.id);
      if (members.includes(String(args.studentUid))) throw errorWithStatus("You're already in this class.", 409);
      await query('INSERT INTO class_members (class_id, user_uid) VALUES ($1, $2)', [row.id, String(args.studentUid)]);
      const cls = classFromRow(row, [...members, String(args.studentUid)]);
      await addNotificationInternal(String(args.studentUid), {
        type: 'class_join', title: 'Joined a class!', message: `You joined "${cls.name}". Good luck!`, read: false, createdAt: Date.now(),
      });
      return cls;
    }
    case 'class.remove':
      requireRole(user, ['educator', 'admin']);
      await query(
        `DELETE FROM class_members WHERE class_id = $1
         AND user_uid = $2
         AND (EXISTS (SELECT 1 FROM classes WHERE id = $1 AND teacher_uid = $3) OR $4 = 'admin')`,
        [String(args.classId), String(args.studentUid), user.uid, user.role],
      );
      return null;
    case 'class.delete':
      requireRole(user, ['educator', 'admin']);
      await query('DELETE FROM classes WHERE id = $1 AND (teacher_uid = $2 OR $3 = \'admin\')', [String(args.classId), user.uid, user.role]);
      return null;
    case 'class.update':
      requireRole(user, ['educator', 'admin']);
      await query(
        `UPDATE classes SET data = data || $2::jsonb
          WHERE id = $1 AND (teacher_uid = $3 OR $4 = 'admin')`,
        [String(args.classId), JSON.stringify(cleanObject(args.updates || {})), user.uid, user.role],
      );
      return null;
    case 'class.regenerate': {
      requireRole(user, ['educator', 'admin']);
      const code = newId('').slice(0, 6).toUpperCase();
      await query('UPDATE classes SET data = data || $2::jsonb WHERE id = $1 AND (teacher_uid = $3 OR $4 = \'admin\')', [
        String(args.classId), JSON.stringify({ inviteCode: code }), user.uid, user.role,
      ]);
      return code;
    }

    case 'invite.usage': {
      selfOrRole(user, String(args.sponsorUid));
      const rows = await query('SELECT id, sponsor_uid, invitee_uid, invitee_email, status, created_at, data FROM smarty_max_invites WHERE sponsor_uid = $1 AND COALESCE(data->>\'kind\', \'max\') <> \'teacher\' ORDER BY created_at DESC', [String(args.sponsorUid)]);
      const invitations = rows.rows.map((row) => ({ id: row.id, ...row.data }));
      const active = invitations.filter((item) => item.status !== 'revoked');
      return {
        total: active.length,
        pending: active.filter((item) => item.status === 'pending').length,
        accepted: active.filter((item) => item.status === 'accepted').length,
        invitations,
      };
    }
    case 'invite.create': {
      return withTransaction(async tx => {
      const query: typeof import('./db.ts').query = tx.query.bind(tx);
      const updateProfile = async (uid: string, patch: Json) => tx.query('UPDATE app_users SET profile = profile || $2::jsonb WHERE uid = $1', [uid, JSON.stringify(patch)]);
      const addNotificationInternal = async (uid: string, notification: Json) => {
        const id = newId('notif_');
        await tx.query('INSERT INTO notifications (id, user_uid, created_at, data) VALUES ($1, $2, $3, $4)', [id, uid, Date.now(), JSON.stringify({ ...notification, id })]);
      };
      if (user.uid !== String(args.sponsorUid)) requireRole(user, ['admin']);
      if (!['admin', 'business', 'organization'].includes(user.role)) throw errorWithStatus('Only business accounts can invite seat users.', 403);
      const email = String(args.inviteeEmail || '').trim().toLowerCase();
      if (email === user.email.toLowerCase()) throw errorWithStatus('You cannot invite your own account', 400);
      const sponsor = (await tx.query('SELECT role, profile FROM app_users WHERE uid = $1 FOR UPDATE', [String(args.sponsorUid)])).rows[0];
      const quota = Number(sponsor?.profile?.planSeats || 0);
      const used = Number((await tx.query("SELECT COUNT(*)::int AS n FROM smarty_max_invites WHERE sponsor_uid = $1 AND status <> 'revoked' AND COALESCE(data->>'kind', 'max') <> 'teacher'", [String(args.sponsorUid)])).rows[0].n);
      const expired = sponsor?.profile?.planExpiresAt && Date.now() >= sponsor.profile.planExpiresAt;
      if (sponsor?.role !== 'admin' && (expired || sponsor?.profile?.plan !== 'business' || !Number.isSafeInteger(quota) || used >= quota)) throw errorWithStatus('No paid seats available', 403);
      if (!email) throw errorWithStatus('Email is required.');
      const duplicate = await query('SELECT 1 FROM smarty_max_invites WHERE sponsor_uid = $1 AND lower(invitee_email) = $2 AND status <> \'revoked\' AND COALESCE(data->>\'kind\', \'max\') <> \'teacher\' LIMIT 1', [String(args.sponsorUid), email]);
      if (duplicate.rowCount) throw errorWithStatus('This email has already been invited.', 409);
      const account = await query<{ uid: string }>('SELECT uid FROM app_users WHERE lower(email) = $1 LIMIT 1', [email]);
      const inviteeUid = account.rows[0]?.uid || null;
      const now = Date.now();
      const id = newId('invite_');
      const data = {
        id,
        sponsorUid: args.sponsorUid,
        sponsorName: args.sponsorName,
        sponsorRole: args.sponsorRole,
        inviteeEmail: email,
        ...(inviteeUid ? { inviteeUid, acceptedAt: now, status: 'accepted' } : { status: 'pending' }),
        createdAt: now,
      };
      await query('INSERT INTO smarty_max_invites (id, sponsor_uid, invitee_uid, invitee_email, status, created_at, data) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
        id, String(args.sponsorUid), inviteeUid, email, data.status, now, JSON.stringify(data),
      ]);
      if (inviteeUid) {
        await updateProfile(inviteeUid, { plan: 'smarty-max', sponsoredBy: args.sponsorUid, planStartedAt: now });
        await addNotificationInternal(inviteeUid, {
          type: 'announcement', title: 'SmartyLang Max activated!', message: `${args.sponsorName} gifted you SmartyLang Max access. All features are unlocked!`, read: false, createdAt: now,
        });
      }
      return { status: data.status, invitation: data };
      });
    }
    case 'invite.revoke': {
      const result = await query<{ sponsor_uid: string; invitee_uid: string | null; data: Json }>('SELECT sponsor_uid, invitee_uid, data FROM smarty_max_invites WHERE id = $1', [String(args.invitationId)]);
      const row = result.rows[0];
      if (!row) return null;
      selfOrRole(user, row.sponsor_uid);
      await query('UPDATE smarty_max_invites SET status = \'revoked\', data = data || $2::jsonb WHERE id = $1', [String(args.invitationId), JSON.stringify({ status: 'revoked', revokedAt: Date.now() })]);
      if (row.invitee_uid) {
        const profile = await getProfile(row.invitee_uid);
        if (profile?.sponsoredBy === row.sponsor_uid && profile.plan === 'smarty-max') {
          await updateProfile(row.invitee_uid, { plan: null, sponsoredBy: null, planStartedAt: null });
        }
      }
      return null;
    }

    case 'assignment.create': {
      requireRole(user, ['educator', 'admin']);
      const id = newId('assignment_');
      const data = cleanObject({ ...args.data, id });
      const cls = await requireClassAccess(user, String(data.classId), true);
      if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 160) throw errorWithStatus('Enter an assignment title of up to 160 characters.');
      data.teacherUid = user.uid;
      data.createdAt = Date.now();
      await withTransaction(async tx => {
        await tx.query('INSERT INTO assignments (id, class_id, teacher_uid, created_at, data) VALUES ($1, $2, $3, $4, $5)',
          [id, data.classId, data.teacherUid, data.createdAt, JSON.stringify(data)]);
        const notice = { id: newId('notif_'), type: 'assignment', title: 'New Assignment!',
          message: `"${data.title}" has been assigned to your class.`, read: false, createdAt: data.createdAt, link: 'classes' };
        await tx.query(`INSERT INTO notifications (id, user_uid, created_at, data)
          SELECT $2, user_uid, $3, $4 FROM class_members WHERE class_id = $1`,
          [cls.id, notice.id, notice.createdAt, JSON.stringify(notice)]);
      });
      return id;
    }
    case 'assignment.list': {
      const classIds = Array.isArray(args.classIds) ? args.classIds.map(String) : [String(args.classId)];
      const includeCounts = args.includeSubmissionCounts === true;
      if (includeCounts) requireRole(user, ['educator', 'admin']);
      for (const classId of classIds) await requireClassAccess(user, classId, includeCounts);
      if (includeCounts) {
        const { rows } = await query(`SELECT a.id, a.data, COUNT(s.completed_at)::int AS submission_count
          FROM assignments a LEFT JOIN submissions s ON s.assignment_id = a.id
          WHERE a.class_id = ANY($1::text[]) GROUP BY a.id ORDER BY a.created_at DESC`, [classIds]);
        return rows.map(row => ({ ...row.data, id: row.id, submissionCount: row.submission_count }));
      }
      const result = await query('SELECT id, data FROM assignments WHERE class_id = ANY($1::text[]) ORDER BY created_at DESC', [classIds]);
      return result.rows.map((row) => ({ id: row.id, ...row.data }));
    }
    case 'assignment.start': {
      const assignmentId = String(args.assignmentId);
      const assignment = await requireAssignmentAccess(user, assignmentId);
      const cls = await requireClassAccess(user, assignment.class_id);
      if (!cls.studentUids.includes(user.uid)) throw errorWithStatus('Student not in class', 403);
      await query(`INSERT INTO submissions (assignment_id, student_uid, data, completed_at) VALUES ($1,$2,$3,NULL)
        ON CONFLICT (assignment_id, student_uid) DO UPDATE SET data = EXCLUDED.data || submissions.data
        WHERE submissions.completed_at IS NULL`,
      [assignmentId, user.uid, JSON.stringify({ studentUid: user.uid, startedAt: Date.now() })]);
      return null;
    }
    case 'assignment.submit':
      selfOrRole(user, String(args.submission.studentUid));
      await requireAssignmentAccess(user, String(args.assignmentId));
      if (Object.keys(args.submission || {}).some(key => /grade|feedback|teacher/i.test(key))) throw errorWithStatus('Grading fields are teacher-only', 403);
      await query(
        `INSERT INTO submissions (assignment_id, student_uid, data, completed_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, student_uid) DO UPDATE SET data = submissions.data || EXCLUDED.data, completed_at = EXCLUDED.completed_at`,
        [String(args.assignmentId), String(args.submission.studentUid), JSON.stringify(cleanObject(args.submission)), Number(args.submission.completedAt || Date.now())],
      );
      return null;
    case 'assignment.updateSubmission':
      requireRole(user, ['educator', 'admin']);
      {
        const assignment = await requireAssignmentAccess(user, String(args.assignmentId), true);
        const cls = await requireClassAccess(user, assignment.class_id, true);
        if (!cls.studentUids.includes(String(args.studentUid))) throw errorWithStatus('Student not in class', 403);
      }
      await query(
        `INSERT INTO submissions (assignment_id, student_uid, data, completed_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, student_uid) DO UPDATE SET data = submissions.data || EXCLUDED.data`,
        [String(args.assignmentId), String(args.studentUid), JSON.stringify(cleanObject(args.updates || {})), args.updates?.completedAt || null],
      );
      return null;
    case 'assignment.submissions': {
      requireRole(user, ['educator', 'admin']);
      await requireAssignmentAccess(user, String(args.assignmentId), true);
      const result = await query(`SELECT s.data, s.student_uid, s.completed_at, u.display_name
        FROM submissions s JOIN app_users u ON u.uid = s.student_uid
        WHERE s.assignment_id = $1 AND s.completed_at IS NOT NULL ORDER BY s.completed_at DESC`, [String(args.assignmentId)]);
      return result.rows.map(row => ({ ...row.data, studentUid: row.student_uid, completedAt: Number(row.completed_at),
        studentName: row.display_name || row.data.studentName }));
    }
    case 'assignment.studentSubmissions': {
      selfOrRole(user, String(args.studentUid));
      const ids = Array.isArray(args.assignmentIds) ? args.assignmentIds.map(String) : [];
      const result = await query('SELECT assignment_id, data, completed_at FROM submissions WHERE student_uid = $1 AND assignment_id = ANY($2::text[])', [
        String(args.studentUid), ids,
      ]);
      return Object.fromEntries(result.rows.map((row) => [row.assignment_id, { ...row.data, completedAt: row.completed_at == null ? undefined : Number(row.completed_at) }]));
    }
    case 'assignment.delete':
      requireRole(user, ['educator', 'admin']);
      await query('DELETE FROM assignments WHERE id = $1 AND (teacher_uid = $2 OR $3 = \'admin\')', [String(args.assignmentId), user.uid, user.role]);
      return null;

    case 'notification.add':
      requireRole(user, ['admin', 'educator']);
      await requireStudentAccess(user, String(args.uid));
      await addNotificationInternal(String(args.uid), args.notification || {});
      return null;
    case 'notification.list':
      selfOrRole(user, String(args.uid));
      return (await query('SELECT data FROM notifications WHERE user_uid = $1 ORDER BY created_at DESC LIMIT $2', [
        String(args.uid), Math.min(Number(args.limit || 20), 100),
      ])).rows.map((row) => row.data);
    case 'notification.read':
      selfOrRole(user, String(args.uid));
      await query('UPDATE notifications SET data = data || \'{"read":true}\'::jsonb WHERE user_uid = $1 AND id = $2', [String(args.uid), String(args.id)]);
      return null;
    case 'notification.readAll':
      selfOrRole(user, String(args.uid));
      await query('UPDATE notifications SET data = data || \'{"read":true}\'::jsonb WHERE user_uid = $1', [String(args.uid)]);
      return null;

    case 'announcement.create': {
      requireRole(user, ['educator', 'admin']);
      const data = cleanObject(args.data || {});
      if (data.targetType === 'class') await requireClassAccess(user, String(data.targetId), true);
      else requireRole(user, ['admin']);
      const id = newId('announcement_');
      await query('INSERT INTO announcements (id, author_uid, target_type, target_id, created_at, data) VALUES ($1, $2, $3, $4, $5, $6)', [
        id, user.uid, data.targetType, data.targetId || null, Number(data.createdAt || Date.now()), JSON.stringify({ ...data, id }),
      ]);
      if (data.targetType === 'class' && data.targetId) {
        const cls = await getClass(data.targetId);
        await Promise.all((cls?.studentUids || []).map((uid) => addNotificationInternal(uid, {
          type: 'announcement', title: data.title, message: `${data.authorName}: ${data.message}`, read: false, createdAt: Date.now(),
        })));
      }
      return id;
    }
    case 'announcement.list': {
      if (args.targetType === 'class' && args.targetId) await requireClassAccess(user, String(args.targetId));
      else if (!args.targetType) requireRole(user, ['admin']);
      else if (args.targetType !== 'global') throw errorWithStatus('Announcement access denied', 403);
      const result = await query(
        args.targetType && args.targetId
          ? 'SELECT data FROM announcements WHERE target_type = $1 AND target_id = $2 ORDER BY created_at DESC LIMIT 50'
          : args.targetType === 'global' ? "SELECT data FROM announcements WHERE target_type = 'global' ORDER BY created_at DESC LIMIT 50" : 'SELECT data FROM announcements ORDER BY created_at DESC LIMIT 50',
        args.targetType && args.targetId ? [String(args.targetType), String(args.targetId)] : [],
      );
      return result.rows.map((row) => row.data);
    }
    case 'audit.add':
      await addAuditInternal(user, args.entry || {});
      return null;
    case 'audit.page': {
      requireRole(user, ['admin']);
      const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 200);
      const offset = Math.max(Number(args.offset) || 0, 0);
      const where: string[] = [];
      const params: any[] = [];
      if (args.action) { params.push(String(args.action)); where.push(`l.data->>'action' = $${params.length}`); }
      if (args.search) {
        params.push(`%${String(args.search).trim().toLowerCase().replace(/[%_\\]/g, '\\$&')}%`);
        where.push(`(lower(a.email) LIKE $${params.length} OR lower(a.display_name) LIKE $${params.length} OR lower(t.email) LIKE $${params.length} OR lower(t.display_name) LIKE $${params.length} OR l.actor_uid = ${'$' + (params.length + 1)} OR l.data->>'targetUid' = ${'$' + (params.length + 1)})`);
        params.push(String(args.search).trim());
      }
      const from = `FROM audit_log l LEFT JOIN app_users a ON a.uid = l.actor_uid LEFT JOIN app_users t ON t.uid = l.data->>'targetUid'`;
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows, total, actions] = await Promise.all([
        query(`SELECT l.data, l.actor_uid, l.timestamp, a.email AS actor_email, a.display_name AS actor_name, t.email AS target_email, t.display_name AS target_name ${from} ${clause} ORDER BY l.timestamp DESC LIMIT ${limit} OFFSET ${offset}`, params),
        query(`SELECT COUNT(*)::int AS n ${from} ${clause}`, params),
        query(`SELECT DISTINCT data->>'action' AS action FROM audit_log WHERE data->>'action' IS NOT NULL ORDER BY 1`),
      ]);
      return {
        total: total.rows[0].n,
        actions: actions.rows.map((row) => row.action),
        entries: rows.rows.map((row) => ({
          ...row.data, actorUid: row.actor_uid, actorEmail: row.actor_email || '', actorName: row.actor_name || '',
          targetEmail: row.target_email || '', targetName: row.target_name || '', timestamp: Number(row.timestamp),
        })),
      };
    }
    case 'audit.list':
      requireRole(user, ['admin']);
      return (await query('SELECT data FROM audit_log ORDER BY timestamp DESC LIMIT $1', [Math.min(Number(args.limit || 100), 500)])).rows.map((row) => row.data);
    case 'org.teachers': {
      requireRole(user, ['business', 'admin']);
      const owner = orgOwnerUid(user, args);
      const [teachers, invites] = await Promise.all([
        query(`SELECT uid, email, display_name, disabled, created_at FROM app_users WHERE role = 'teacher' AND profile->>'organizationId' = $1 ORDER BY lower(display_name), uid`, [owner]),
        query(`SELECT id, invitee_email, created_at FROM smarty_max_invites WHERE sponsor_uid = $1 AND status = 'pending' AND data->>'kind' = 'teacher' ORDER BY created_at DESC`, [owner]),
      ]);
      const uids = teachers.rows.map((row) => row.uid);
      const classRows = uids.length
        ? await query(`SELECT c.id, c.teacher_uid, c.data->>'name' AS name, (SELECT COUNT(*)::int FROM class_members m WHERE m.class_id = c.id) AS students FROM classes c WHERE c.teacher_uid = ANY($1::text[]) ORDER BY c.created_at`, [uids])
        : { rows: [] as any[] };
      return {
        teachers: teachers.rows.map((row) => {
          const classes = classRows.rows.filter((c) => c.teacher_uid === row.uid).map((c) => ({ id: c.id, name: c.name || 'Class', studentCount: c.students }));
          return {
            uid: row.uid, email: row.email, displayName: row.display_name, suspended: !!row.disabled, joinedAt: Number(row.created_at || 0),
            classes, classCount: classes.length, studentCount: classes.reduce((sum, c) => sum + c.studentCount, 0),
          };
        }),
        pending: invites.rows.map((row) => ({ id: row.id, email: row.invitee_email, createdAt: Number(row.created_at) })),
      };
    }
    case 'org.addTeacher': {
      requireRole(user, ['business', 'admin']);
      const owner = orgOwnerUid(user, args);
      const email = String(args.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw errorWithStatus('Enter a valid email address.', 400);
      if (email === String(user.email || '').toLowerCase()) throw errorWithStatus('You cannot add your own account.', 400);
      return withTransaction(async (tx) => {
        const sponsor = (await tx.query('SELECT profile FROM app_users WHERE uid = $1', [owner])).rows[0];
        const sponsorName = sponsor?.profile?.displayName || user.displayName || 'Your school';
        const account = (await tx.query('SELECT uid, role, profile FROM app_users WHERE lower(email) = $1 FOR UPDATE', [email])).rows[0];
        const now = Date.now();
        if (account) {
          if (account.role === 'admin' || account.role === 'business' || account.role === 'organization') throw errorWithStatus('This account type cannot be added as a teacher.', 409);
          if (account.profile?.organizationId === owner) throw errorWithStatus('This teacher is already on your team.', 409);
          if (account.profile?.organizationId) throw errorWithStatus('This teacher already belongs to another school.', 409);
          await tx.query(`UPDATE app_users SET role = 'teacher', profile = profile || $2::jsonb WHERE uid = $1`, [account.uid, JSON.stringify({ role: 'teacher', organizationId: owner })]);
          await tx.query('INSERT INTO notifications (id, user_uid, created_at, data) VALUES ($1, $2, $3, $4)', [
            newId('notif_'), account.uid, now, JSON.stringify({ type: 'announcement', title: 'You are now a teacher', message: `${sponsorName} added you as a teacher. You can create classes now.`, read: false, createdAt: now }),
          ]);
          await tx.query('INSERT INTO audit_log (id, actor_uid, timestamp, data) VALUES ($1, $2, $3, $4)', [newId('audit_'), user.uid, now, JSON.stringify({ action: 'org_teacher_added', targetUid: account.uid, details: { organizationId: owner } })]);
          return { status: 'added', uid: account.uid };
        }
        const dup = await tx.query(`SELECT 1 FROM smarty_max_invites WHERE sponsor_uid = $1 AND lower(invitee_email) = $2 AND status = 'pending' AND data->>'kind' = 'teacher' LIMIT 1`, [owner, email]);
        if (dup.rowCount) throw errorWithStatus('This email has already been invited.', 409);
        const id = newId('tinvite_');
        const data = { id, kind: 'teacher', sponsorUid: owner, sponsorName, inviteeEmail: email, status: 'pending', createdAt: now };
        await tx.query('INSERT INTO smarty_max_invites (id, sponsor_uid, invitee_uid, invitee_email, status, created_at, data) VALUES ($1, $2, NULL, $3, $4, $5, $6)', [id, owner, email, 'pending', now, JSON.stringify(data)]);
        await tx.query('INSERT INTO audit_log (id, actor_uid, timestamp, data) VALUES ($1, $2, $3, $4)', [newId('audit_'), user.uid, now, JSON.stringify({ action: 'org_teacher_invited', details: { organizationId: owner, email } })]);
        return { status: 'invited', inviteId: id };
      });
    }
    case 'org.removeTeacher': {
      requireRole(user, ['business', 'admin']);
      const owner = orgOwnerUid(user, args);
      if (args.inviteId) {
        const res = await query(`UPDATE smarty_max_invites SET status = 'revoked', data = data || $3::jsonb WHERE id = $1 AND sponsor_uid = $2 AND data->>'kind' = 'teacher' AND status = 'pending'`, [String(args.inviteId), owner, JSON.stringify({ status: 'revoked', revokedAt: Date.now() })]);
        if (!res.rowCount) throw errorWithStatus('Invite not found', 404);
        return null;
      }
      const uid = String(args.uid || '');
      const res = await query(
        `UPDATE app_users SET role = 'student', profile = (profile - 'organizationId') || '{"role":"student"}'::jsonb
          WHERE uid = $1 AND role = 'teacher' AND profile->>'organizationId' = $2 RETURNING uid`,
        [uid, owner],
      );
      if (!res.rowCount) throw errorWithStatus('Teacher not found on your team.', 404);
      await query('UPDATE classes SET organization_id = NULL WHERE teacher_uid = $1 AND organization_id = $2', [uid, owner]);
      await addAuditInternal(user, { action: 'org_teacher_removed', targetUid: uid, details: { organizationId: owner } });
      return null;
    }
    case 'stats.platform': {
      requireRole(user, ['admin']);
      const [profiles, classes, assignments] = await Promise.all([
        query('SELECT role, disabled FROM app_users'),
        query('SELECT COUNT(*)::int AS count FROM classes'),
        query('SELECT COUNT(*)::int AS count FROM assignments'),
      ]);
      const counts: Json = { student: 0, business: 0, teacher: 0, organization: 0, admin: 0, suspended: 0 };
      profiles.rows.forEach((row) => { counts[row.role] = (counts[row.role] || 0) + 1; if (row.disabled) counts.suspended += 1; });
      const businessAccounts = (counts.business || 0) + (counts.teacher || 0) + (counts.organization || 0);
      return {
        totalUsers: profiles.rowCount, students: counts.student, business: businessAccounts,
        admins: counts.admin, suspended: counts.suspended, totalClasses: classes.rows[0].count, totalAssignments: assignments.rows[0].count,
      };
    }

    case 'cms.get':
      if (!user) throw errorWithStatus('Sign in required', 401);
      return (await query('SELECT data FROM cms_content WHERE doc_id = $1', [String(args.docId)])).rows[0]?.data || null;
    case 'activity.add': {
      selfOrRole(user, String(args.uid || user.uid));
      const data = cleanObject({ ...(args.record || {}), studentUid: user.uid, timestamp: args.record?.timestamp || Date.now() });
      await query('INSERT INTO student_activity (id, student_uid, timestamp, data) VALUES ($1, $2, $3, $4)', [
        newId('activity_'), user.uid, data.timestamp, JSON.stringify(data),
      ]);
      return null;
    }
    case 'activity.list': {
      requireRole(user, ['admin', 'educator']);
      await requireStudentAccess(user, String(args.studentUid));
      return (await query('SELECT data FROM student_activity WHERE student_uid = $1 ORDER BY timestamp DESC LIMIT $2', [
        String(args.studentUid), Math.min(Number(args.limit || 100), 500),
      ])).rows.map((row) => row.data);
    }
    case 'teacher.studentDetail': {
      // One student's full history for their teacher: paged completions, plus (first page) saved words, problem words and activity.
      requireRole(user, ['admin', 'educator']);
      const studentUid = String(args.studentUid || '');
      if (!studentUid) throw errorWithStatus('Student required');
      await requireStudentAccess(user, studentUid);
      const limit = Math.min(Math.max(Number(args.limit || 50), 1), 100);
      const before = Number(args.before) > 0 ? Number(args.before) : null;
      const rows = (await query(
        'SELECT id, data, timestamp FROM completions WHERE user_uid = $1 AND ($2::bigint IS NULL OR timestamp < $2::bigint) ORDER BY timestamp DESC LIMIT $3',
        [studentUid, before, limit + 1],
      )).rows;
      const completions = rows.slice(0, limit).map((row) => ({ id: row.id, ...row.data, timestamp: Number(row.timestamp) }));
      const out: Json = { completions, hasMore: rows.length > limit };
      if (before === null) {
        const who = (await query('SELECT display_name FROM app_users WHERE uid = $1', [studentUid])).rows[0];
        const vocab = (await query('SELECT word, data FROM user_vocab WHERE user_uid = $1 ORDER BY updated_at DESC LIMIT 1000', [studentUid])).rows
          .map((row) => ({ word: row.word, definition: row.data?.definition ?? '', lang: row.data?.lang, nextReviewDate: row.data?.srs?.nextReviewDate ?? null, lapses: row.data?.lapses ?? 0, timestamp: row.data?.timestamp ?? null }));
        const prog = (await query(`SELECT data->'readmaster_problem_words' AS pw FROM user_progress WHERE user_uid = $1`, [studentUid])).rows[0]?.pw;
        const problemWords = prog && typeof prog === 'object' ? Object.entries(prog as Json).map(([word, v]: [string, any]) => ({ word, count: Number(v?.count || 1), lastMissed: Number(v?.lastMissed || 0) })).slice(0, 500) : [];
        const summary = (await query('SELECT data FROM student_summaries WHERE user_uid = $1', [studentUid])).rows[0]?.data ?? null;
        const activity = (await query('SELECT data FROM student_activity WHERE student_uid = $1 ORDER BY timestamp DESC LIMIT 100', [studentUid])).rows.map((row) => row.data);
        Object.assign(out, { name: who?.display_name || '', vocab, problemWords, summary, activity });
      }
      return out;
    }
    case 'teacher.classInsights': {
      // Compact per-student behaviour for a class, used to recommend words. The client aggregates.
      requireRole(user, ['admin', 'educator']);
      const classId = String(args.classId || '');
      await requireClassAccess(user, classId, true);
      const uids = (await listClassMembers(classId)).slice(0, 60);
      if (!uids.length) return { students: [], completions: [], vocab: [], problem: [] };
      const since = Date.now() - 90 * 86_400_000;
      const names = (await query('SELECT uid, display_name FROM app_users WHERE uid = ANY($1::text[])', [uids])).rows;
      const comp = (await query(
        'SELECT user_uid, timestamp, data FROM completions WHERE user_uid = ANY($1::text[]) AND timestamp > $2 ORDER BY timestamp DESC LIMIT 4000',
        [uids, since],
      )).rows.map((row) => ({
        uid: row.user_uid, timestamp: Number(row.timestamp), type: row.data?.type,
        mistakes: Array.isArray(row.data?.data?.mistakes) ? row.data.data.mistakes.slice(0, 30).map(String) : [],
        correct: Array.isArray(row.data?.data?.correctWords) ? row.data.data.correctWords.slice(0, 30).map(String) : [],
      }));
      const vocab = (await query('SELECT user_uid, word, data FROM user_vocab WHERE user_uid = ANY($1::text[]) LIMIT 20000', [uids])).rows
        .map((row) => ({ uid: row.user_uid, word: row.word, nextReviewDate: row.data?.srs?.nextReviewDate ?? null, lapses: Number(row.data?.lapses || 0) }));
      const problem = (await query(`SELECT user_uid, data->'readmaster_problem_words' AS pw FROM user_progress WHERE user_uid = ANY($1::text[])`, [uids])).rows
        .flatMap((row) => row.pw && typeof row.pw === 'object'
          ? Object.entries(row.pw as Json).slice(0, 300).map(([word, v]: [string, any]) => ({ uid: row.user_uid, word, count: Number(v?.count || 1), lastMissed: Number(v?.lastMissed || 0) })) : []);
      return { students: names.map((row) => ({ uid: row.uid, name: row.display_name || '' })), completions: comp, vocab, problem };
    }
    case 'payment.record': {
      requireRole(user, ['admin']);
      const id = newId('payment_');
      const data = cleanObject({ ...args.record, id });
      await query('INSERT INTO payments (id, uid, paid_at, data) VALUES ($1, $2, $3, $4)', [id, data.uid, data.paidAt || Date.now(), JSON.stringify(data)]);
      return id;
    }
    case 'payment.confirm': {
      const paymentId = String(args.paymentId || args.transactionId || '');
      return confirmDodoPayment(user, cleanObject(args.payment || {}), paymentId);
    }
    case 'payment.list':
      requireRole(user, ['admin']);
      return (await query('SELECT data FROM payments ORDER BY paid_at DESC LIMIT $1', [Math.min(Number(args.limit || 200), 500)])).rows.map((row) => row.data);
    default:
      throw errorWithStatus(`Unknown data action: ${action}`, 404);
  }
}

export function registerDataApi(app: Express): void {
  app.post('/api/data', async (req: Request, res: Response) => {
    if (!databaseConfigured) {
      res.status(503).json({ error: 'Database is not configured' });
      return;
    }
    try {
      const user = await requireUser(req, ['profile.get', 'profile.ensure'].includes(req.body?.action));
      const result = await handleAction(user, req.body || {});
      res.json({ result });
    } catch (error: any) {
      const status = Number(error?.status || 500);
      if (status >= 500) console.error('[api/data]', error);
      res.status(status).json({ error: error?.message || 'Request failed' });
    }
  });
}
