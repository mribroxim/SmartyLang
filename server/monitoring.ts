import crypto from 'node:crypto';
import type { Express, ErrorRequestHandler } from 'express';
import { requireUser } from './auth.ts';
import { query } from './db.ts';
import { rateLimit } from './security.ts';

export function installMonitoring(app: Express): void {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) return next();
    const requestId = crypto.randomUUID(), start = Date.now();
    res.setHeader('X-Request-ID', requestId);
    res.on('finish', () => {
      const route = req.route?.path || (req.path.startsWith('/api/') ? '/api/unknown' : '/app');
      // No bodies, queries, cookies, identities or IP addresses.
      console.log(JSON.stringify({ event: 'http_request', requestId, method: req.method, route, status: res.statusCode, ms: Date.now() - start }));
      if (res.statusCode >= 500) void recordError('server', `${res.statusCode}:${route}`, requestId);
    });
    next();
  });
  app.post('/api/monitor', rateLimit(10, 60_000), async (req, res) => {
    try {
      await requireUser(req);
      const kind = ['render', 'unhandled', 'promise'].includes(req.body?.kind) ? req.body.kind : 'unhandled';
      // Store only a fixed error class and source position. Arbitrary messages,
      // stack traces and learner content are never accepted by this endpoint.
      const position = /^\d{1,7}:\d{1,7}$/.test(req.body?.position || '') ? req.body.position : 'unknown';
      await recordError('client', `${kind}:${position}`, String(res.getHeader('X-Request-ID')));
      return res.sendStatus(204);
    } catch { return res.sendStatus(204); }
  });
  app.get('/api/monitor/errors', async (req, res) => {
    try {
      const user = await requireUser(req);
      if (user.role !== 'admin') return res.sendStatus(403);
      return res.json((await query('SELECT * FROM application_errors ORDER BY last_seen DESC LIMIT 100')).rows);
    } catch { return res.sendStatus(401); }
  });
}
async function recordError(source: string, code: string, requestId: string) {
  try { await query(`INSERT INTO application_errors (fingerprint, source, code, request_id) VALUES ($1, $2, $3, $4)
    ON CONFLICT (fingerprint) DO UPDATE SET hits = application_errors.hits + 1, last_seen = NOW(), request_id = EXCLUDED.request_id`, [crypto.createHash('sha256').update(`${source}:${code}`).digest('hex'), source, code, requestId]); }
  catch { console.error(JSON.stringify({ event: 'error_recording_unavailable', requestId })); }
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(JSON.stringify({ event: 'request_failed', requestId: res.getHeader('X-Request-ID'), type: error?.name || 'Error' }));
  if (!res.headersSent) res.status(Number(error?.status) || 500).json({ error: 'Request could not be completed' });
};
