import type { Express } from 'express';
import crypto from 'node:crypto';
import { requireUser, requireRecentAuthentication, clearSession } from './auth.ts';
import { query, withTransaction } from './db.ts';

export function registerAccountData(app: Express): void {
  app.get('/api/account/export', async (req, res) => {
    try {
      const user = await requireUser(req, true);
      const records: Record<string, unknown> = { profile: user.profile };
      for (const table of ['user_progress', 'user_vocab', 'completions', 'lesson_unlocks', 'user_writing', 'student_summaries', 'notifications']) records[table] = (await query(`SELECT * FROM ${table} WHERE user_uid = $1`, [user.uid])).rows;
      records.activity = (await query('SELECT data FROM student_activity WHERE student_uid = $1', [user.uid])).rows;
      records.submissions = (await query('SELECT data FROM submissions WHERE student_uid = $1', [user.uid])).rows;
      records.classes = (await query('SELECT c.id, c.data FROM classes c JOIN class_members m ON c.id = m.class_id WHERE m.user_uid = $1', [user.uid])).rows;
      res.setHeader('Content-Disposition', 'attachment; filename="smartylang-data.json"');
      return res.json({ exportedAt: new Date().toISOString(), ...records });
    } catch { return res.status(401).json({ error: 'Sign in required' }); }
  });
  app.delete('/api/account', async (req, res) => {
    try {
      const user = await requireUser(req, true);
      if (String(req.body?.email || '').toLowerCase() !== user.email.toLowerCase()) return res.status(400).json({ error: 'Email confirmation required' });
      await requireRecentAuthentication(req, user.uid, String(req.body?.password || ''));
      if (user.profile.dodoSubscriptionId && !user.profile.planCancelAt && user.profile.planExpiresAt > Date.now()) return res.status(409).json({ error: 'Cancel active billing first' });
      await withTransaction(async tx => {
        await tx.query("UPDATE app_users SET profile = profile || '{\"plan\":null,\"sponsoredBy\":null}'::jsonb WHERE profile->>'sponsoredBy' = $1", [user.uid]);
        await tx.query('DELETE FROM smarty_max_invites WHERE sponsor_uid = $1 OR invitee_uid = $1 OR lower(invitee_email) = lower($2)', [user.uid, user.email]);
        await tx.query('DELETE FROM announcements WHERE author_uid = $1 OR (target_type = \'class\' AND target_id IN (SELECT id FROM classes WHERE teacher_uid = $1))', [user.uid]);
        await tx.query('DELETE FROM classes WHERE teacher_uid = $1', [user.uid]);
        await tx.query("UPDATE payments SET uid = NULL, data = jsonb_build_object('transactionId', data->'transactionId', 'amountUSD', data->'amountUSD', 'status', data->'status') WHERE uid = $1", [user.uid]);
        await tx.query('DELETE FROM audit_log WHERE actor_uid = $1 OR data->>\'targetUid\' = $1', [user.uid]);
        await tx.query('DELETE FROM legacy_firestore_documents WHERE path LIKE $1', [`users/${user.uid}/%`]);
        await tx.query('DELETE FROM legacy_firestore_documents WHERE path = $1', [`users/${user.uid}`]);
        await tx.query('INSERT INTO account_deletions (uid_hash) VALUES ($1) ON CONFLICT DO NOTHING', [crypto.createHash('sha256').update(user.uid).digest('hex')]);
        await tx.query('DELETE FROM app_users WHERE uid = $1', [user.uid]);
      });
      await clearSession(req, res);
      return res.json({ deleted: true });
    } catch (error: any) { return res.status(error.status || 503).json({ error: 'Account deletion could not be completed' }); }
  });
}
