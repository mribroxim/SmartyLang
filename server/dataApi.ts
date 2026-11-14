import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { databaseConfigured, query, withTransaction } from './db.ts';
import {
  getProfile,
  getSessionUser,
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

function selfOrRole(user: AuthUser, uid: string, roles: string[] = ['admin']): void {
  if (user.uid !== uid) requireRole(user, roles);
}

function profileFromRow(row: any): Json {
  return { ...(row.profile || row.data || {}), uid: row.uid, email: row.email, role: row.role };
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

async function requireClassAccess(user: AuthUser, classId: string, write = false): Promise<Json> {
  const cls = await getClass(classId);
  if (!cls) throw errorWithStatus('Class not found', 404);
  if (user.role === 'admin' || cls.teacherUid === user.uid) return cls;
  if (!write && cls.studentUids.includes(user.uid)) return cls;
  throw errorWithStatus('Class access denied', 403);
}

async function requireStudentAccess(user: AuthUser, uid: string): Promise<void> {
  if (user.uid === uid || user.role === 'admin') return;
  requireRole(user, ['business']);
  const found = await query('SELECT 1 FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.user_uid = $1 AND c.teacher_uid = $2 LIMIT 1', [uid, user.uid]);
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
      WHERE lower(invitee_email) = lower($1) AND status = 'pending'
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
      const result = await query('SELECT uid, email, display_name, photo_url, role, profile FROM app_users ORDER BY created_at DESC');
      return result.rows.map(profileFromRow);
    }
    case 'profile.role': {
      requireRole(user, ['admin']);
      if (args.role === 'admin') throw errorWithStatus('Admin role is reserved.', 403);
      const result = await query(
        `UPDATE app_users SET role = $2, profile = profile || $3::jsonb
          WHERE uid = $1 RETURNING uid, email, display_name, photo_url, role, profile`,
        [String(args.uid), String(args.role), JSON.stringify({ role: args.role })],
      );
      if (!result.rows[0]) throw errorWithStatus('User not found', 404);
      await addAuditInternal(user, { action: 'role_changed', targetUid: args.uid, details: { newRole: args.role } });
      return null;
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
      requireRole(user, ['admin', 'business']);
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
      const result = await query('SELECT user_uid, data FROM student_summaries WHERE data->>\'league\' = ANY($1)', [ids]);
      return result.rows
        .map((row) => ({ uid: row.user_uid, displayName: row.data.displayName, weeklyXp: row.data.weeklyXp, league: String(args.leagueId) }))
        .sort((a, b) => Number(b.weeklyXp || 0) - Number(a.weeklyXp || 0))
        .slice(0, Math.min(Number(args.max || 50), 100));
    }

    case 'class.create': {
      requireRole(user, ['business', 'admin']);
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
      requireRole(user, ['business', 'admin']);
      await query(
        `DELETE FROM class_members WHERE class_id = $1
         AND user_uid = $2
         AND (EXISTS (SELECT 1 FROM classes WHERE id = $1 AND teacher_uid = $3) OR $4 = 'admin')`,
        [String(args.classId), String(args.studentUid), user.uid, user.role],
      );
      return null;
    case 'class.delete':
      requireRole(user, ['business', 'admin']);
      await query('DELETE FROM classes WHERE id = $1 AND (teacher_uid = $2 OR $3 = \'admin\')', [String(args.classId), user.uid, user.role]);
      return null;
    case 'class.update':
      requireRole(user, ['business', 'admin']);
      await query(
        `UPDATE classes SET data = data || $2::jsonb
          WHERE id = $1 AND (teacher_uid = $3 OR $4 = 'admin')`,
        [String(args.classId), JSON.stringify(cleanObject(args.updates || {})), user.uid, user.role],
      );
      return null;
    case 'class.regenerate': {
      requireRole(user, ['business', 'admin']);
      const code = newId('').slice(0, 6).toUpperCase();
      await query('UPDATE classes SET data = data || $2::jsonb WHERE id = $1 AND (teacher_uid = $3 OR $4 = \'admin\')', [
        String(args.classId), JSON.stringify({ inviteCode: code }), user.uid, user.role,
      ]);
      return code;
    }

    case 'invite.usage': {
      selfOrRole(user, String(args.sponsorUid));
      const rows = await query('SELECT id, sponsor_uid, invitee_uid, invitee_email, status, created_at, data FROM smarty_max_invites WHERE sponsor_uid = $1 ORDER BY created_at DESC', [String(args.sponsorUid)]);
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
      if (!['admin', 'business', 'teacher', 'organization'].includes(user.role)) throw errorWithStatus('Only sponsors can invite users.', 403);
      const email = String(args.inviteeEmail || '').trim().toLowerCase();
      if (email === user.email.toLowerCase()) throw errorWithStatus('You cannot invite your own account', 400);
      const sponsor = (await tx.query('SELECT role, profile FROM app_users WHERE uid = $1 FOR UPDATE', [String(args.sponsorUid)])).rows[0];
      const quota = Number(sponsor?.profile?.planSeats || 0);
      const used = Number((await tx.query("SELECT COUNT(*)::int AS n FROM smarty_max_invites WHERE sponsor_uid = $1 AND status <> 'revoked'", [String(args.sponsorUid)])).rows[0].n);
      const expired = sponsor?.profile?.planExpiresAt && Date.now() >= sponsor.profile.planExpiresAt;
      if (sponsor?.role !== 'admin' && (expired || sponsor?.profile?.plan !== 'business' || !Number.isSafeInteger(quota) || used >= quota)) throw errorWithStatus('No paid seats available', 403);
      if (!email) throw errorWithStatus('Email is required.');
      const duplicate = await query('SELECT 1 FROM smarty_max_invites WHERE sponsor_uid = $1 AND lower(invitee_email) = $2 AND status <> \'revoked\' LIMIT 1', [String(args.sponsorUid), email]);
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
      requireRole(user, ['business', 'admin']);
      const id = newId('assignment_');
      const data = cleanObject({ ...args.data, id });
      await requireClassAccess(user, String(data.classId), true);
      data.teacherUid = user.uid;
      await query('INSERT INTO assignments (id, class_id, teacher_uid, created_at, data) VALUES ($1, $2, $3, $4, $5)', [
        id, data.classId, data.teacherUid, Number(data.createdAt || Date.now()), JSON.stringify(data),
      ]);
      const cls = await getClass(data.classId);
      await Promise.all((cls?.studentUids || []).map((uid) => addNotificationInternal(uid, {
        type: 'assignment', title: 'New Assignment!', message: `"${data.title}" has been assigned to your class.`, read: false, createdAt: Date.now(), link: 'assignments',
      })));
      return id;
    }
    case 'assignment.list': {
      const classIds = Array.isArray(args.classIds) ? args.classIds.map(String) : [String(args.classId)];
      for (const classId of classIds) await requireClassAccess(user, classId);
      const result = await query('SELECT id, data FROM assignments WHERE class_id = ANY($1::text[]) ORDER BY created_at DESC', [classIds]);
      return result.rows.map((row) => ({ id: row.id, ...row.data }));
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
      requireRole(user, ['business', 'admin']);
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
      requireRole(user, ['business', 'admin']);
      await requireAssignmentAccess(user, String(args.assignmentId), true);
      const result = await query('SELECT data FROM submissions WHERE assignment_id = $1', [String(args.assignmentId)]);
      return result.rows.map((row) => row.data);
    }
    case 'assignment.studentSubmissions': {
      selfOrRole(user, String(args.studentUid));
      const ids = Array.isArray(args.assignmentIds) ? args.assignmentIds.map(String) : [];
      const result = await query('SELECT assignment_id, data FROM submissions WHERE student_uid = $1 AND assignment_id = ANY($2::text[])', [
        String(args.studentUid), ids,
      ]);
      return Object.fromEntries(result.rows.map((row) => [row.assignment_id, row.data]));
    }
    case 'assignment.delete':
      requireRole(user, ['business', 'admin']);
      await query('DELETE FROM assignments WHERE id = $1 AND (teacher_uid = $2 OR $3 = \'admin\')', [String(args.assignmentId), user.uid, user.role]);
      return null;

    case 'notification.add':
      requireRole(user, ['admin', 'business']);
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
      requireRole(user, ['business', 'admin']);
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
    case 'audit.list':
      requireRole(user, ['admin']);
      return (await query('SELECT data FROM audit_log ORDER BY timestamp DESC LIMIT $1', [Math.min(Number(args.limit || 100), 500)])).rows.map((row) => row.data);
    case 'stats.platform': {
      requireRole(user, ['admin']);
      const [profiles, classes, assignments] = await Promise.all([
        query('SELECT role, disabled FROM app_users'),
        query('SELECT COUNT(*)::int AS count FROM classes'),
        query('SELECT COUNT(*)::int AS count FROM assignments'),
      ]);
      const counts: Json = { student: 0, business: 0, teacher: 0, organization: 0, admin: 0, 'content-manager': 0, suspended: 0 };
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
    case 'cms.set':
      requireRole(user, ['admin', 'content-manager']);
      await query(
        `INSERT INTO cms_content (doc_id, updated_at, data) VALUES ($1, $2, $3)
         ON CONFLICT (doc_id) DO UPDATE SET updated_at = EXCLUDED.updated_at, data = EXCLUDED.data`,
        [String(args.docId), Date.now(), JSON.stringify(cleanObject(args.data || {}))],
      );
      return null;
    case 'cms.delete':
      requireRole(user, ['admin', 'content-manager']);
      await query('DELETE FROM cms_content WHERE doc_id = $1', [String(args.docId)]);
      return null;
    case 'vocabMiss.list':
      requireRole(user, ['admin', 'content-manager']);
      return (await query('SELECT data FROM vocab_misses ORDER BY count DESC LIMIT $1', [Math.min(Number(args.limit || 80), 500)])).rows.map((row) => row.data);
    case 'vocabMiss.review':
      requireRole(user, ['admin', 'content-manager']);
      await query('UPDATE vocab_misses SET data = data || $2::jsonb WHERE id = $1', [String(args.id), JSON.stringify({ reviewed: true, reviewedAt: Date.now() })]);
      return null;

    case 'activity.add': {
      selfOrRole(user, String(args.uid || user.uid));
      const data = cleanObject({ ...(args.record || {}), studentUid: user.uid, timestamp: args.record?.timestamp || Date.now() });
      await query('INSERT INTO student_activity (id, student_uid, timestamp, data) VALUES ($1, $2, $3, $4)', [
        newId('activity_'), user.uid, data.timestamp, JSON.stringify(data),
      ]);
      return null;
    }
    case 'activity.list': {
      requireRole(user, ['admin', 'business']);
      await requireStudentAccess(user, String(args.studentUid));
      return (await query('SELECT data FROM student_activity WHERE student_uid = $1 ORDER BY timestamp DESC LIMIT $2', [
        String(args.studentUid), Math.min(Number(args.limit || 100), 500),
      ])).rows.map((row) => row.data);
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
