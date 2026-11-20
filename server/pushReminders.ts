import type { Express } from 'express';
import { createRequire } from 'node:module';
import { requireUser } from './auth.ts';
import { query } from './db.ts';
import { rateLimit } from './security.ts';

const require = createRequire(import.meta.url);

export function registerPushReminders(app: Express): () => void {
  const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY;
  const contact = process.env.PUSH_VAPID_CONTACT;
  if (!publicKey || !privateKey || !contact) return () => {};
  const webPush = require('web-push');
  webPush.setVapidDetails(contact, publicKey, privateKey);

  app.get('/api/push/config', (_req, res) => { res.json({ publicKey }); });
  app.post('/api/push/reminder', rateLimit(25, 60_000), async (req, res) => {
    try {
      const user = await requireUser(req);
      const { endpoint, keys, time, timezone } = req.body || {};
      if (typeof endpoint !== 'string' || endpoint.length > 2048) return res.sendStatus(400);
      const url = URL.parse(endpoint);
      const allowedHosts = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', 'wns2-par02p.notify.windows.com'];
      if (!url || url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.includes(url.hostname)) return res.sendStatus(400);
      if (time === null) {
        await query('DELETE FROM push_reminders WHERE endpoint=$1 AND uid=$2', [endpoint, user.uid]);
        return res.sendStatus(204);
      }
      if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || typeof timezone !== 'string' || timezone.length > 80 ||
          !/^[\w-]{87}$/.test(keys?.p256dh || '') || !/^[\w-]{22}$/.test(keys?.auth || '')) return res.sendStatus(400);
      try { new Intl.DateTimeFormat('en', { timeZone: timezone }); } catch { return res.sendStatus(400); }
      await query(`INSERT INTO push_reminders(endpoint, uid, keys, timezone, local_time)
        VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(endpoint) DO UPDATE SET uid=EXCLUDED.uid, keys=EXCLUDED.keys, timezone=EXCLUDED.timezone,
          local_time=EXCLUDED.local_time, last_day=CASE WHEN push_reminders.uid=EXCLUDED.uid THEN push_reminders.last_day ELSE NULL END`,
      [endpoint, user.uid, JSON.stringify(keys), timezone, time]);
      return res.sendStatus(204);
    } catch (error: any) { return res.sendStatus(error.status || 503); }
  });

  let active = false;
  async function tick() {
    if (active) return;
    active = true;
    try {
      const { rows } = await query(`WITH due AS (
        SELECT p.endpoint, (now() AT TIME ZONE p.timezone)::date AS day FROM push_reminders p
        JOIN app_users u ON u.uid=p.uid WHERE NOT u.disabled
          AND p.last_day IS DISTINCT FROM (now() AT TIME ZONE p.timezone)::date
          AND NOT EXISTS (
            SELECT 1 FROM user_progress progress WHERE progress.user_uid=p.uid
              AND progress.data #>> '{dailyGoal,date}' = ((now() AT TIME ZONE p.timezone)::date)::text
              AND COALESCE(progress.data #>> '{dailyGoal,xpEarned}', '0') ~ '^[1-9][0-9]*$'
          )
          AND (now() AT TIME ZONE p.timezone)::time >= p.local_time::time
          AND (now() AT TIME ZONE p.timezone)::time - p.local_time::time < interval '20 minutes'
        LIMIT 50 FOR UPDATE OF p SKIP LOCKED
      )
      UPDATE push_reminders p SET last_day=due.day FROM due WHERE p.endpoint=due.endpoint
      RETURNING p.endpoint,p.keys`);
      await Promise.all(rows.map(async ({ endpoint, keys }) => {
        try { await webPush.sendNotification({ endpoint, keys }, '{}', { TTL: 600, timeout: 8000 }); }
        catch (error: any) {
          if ([404, 410].includes(error.statusCode)) await query('DELETE FROM push_reminders WHERE endpoint=$1', [endpoint]);
        }
      }));
    } catch { console.error('[push] Reminder delivery check failed'); }
    finally { active = false; }
  }
  return () => { const timer = setInterval(() => void tick(), 45_000); timer.unref(); };
}
