import type { Express, Request, Response, NextFunction } from 'express';
import { requireUser } from './auth.ts';
import { query } from './db.ts';

export function demoLoginEnabled(env = process.env): boolean {
  return env.NODE_ENV !== 'production' && env.DEMO_LOGIN === '1';
}

export function installSecurity(app: Express): void {
  app.disable('x-powered-by');
  // Set this only for the proxy directly in front of the application.
  app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
  const production = process.env.NODE_ENV === 'production';
  const origin = new URL(process.env.APP_URL || 'http://localhost:3000').origin;
  const origins = new Set([origin]);
  if (!production) for (const value of (process.env.DEV_ALLOWED_ORIGINS || '').split(',').filter(Boolean)) {
    const extra = new URL(value).origin;
    if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(extra)) throw new Error('Extra development origins must be loopback URLs');
    origins.add(extra);
  }
  if (production && !origin.startsWith('https://')) throw new Error('Production APP_URL must use HTTPS');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (production) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
    }
    if (!req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.vary('Origin');
    const requestOrigin = req.get('origin');
    // OAuth returns as a cross-site top-level GET. Its handler validates the
    // unpredictable state against the HttpOnly cookie before exchanging a code.
    const oauthReturn = req.method === 'GET' && req.path === '/api/auth/google/callback' && !requestOrigin;
    if ((requestOrigin && !origins.has(requestOrigin)) || (!requestOrigin && req.get('sec-fetch-site') === 'cross-site' && !oauthReturn)) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    if (requestOrigin && origins.has(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.sendStatus(204);
    }
    next();
  });
  app.use('/api/auth', rateLimit(20, 10 * 60_000));
  app.use('/api', rateLimit(300, 60_000));
}

/** Bounded local IP limiter. Shared AI quotas below also cover multiple replicas. */
export function rateLimit(max: number, windowMs: number) {
  const buckets = new Map<string, { start: number; count: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (now - value.start >= windowMs) buckets.delete(key);
    const key = req.ip || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 10_000) return res.status(429).json({ error: 'Please try again later' });
      bucket = { start: now, count: 0 }; buckets.set(key, bucket);
    }
    if (++bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.start + windowMs - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

export async function providerAuth(req: Request, res: Response, next: NextFunction) {
  try { await requireUser(req); next(); }
  catch (error: any) { res.status(error.status || 503).json({ error: 'Sign in required' }); }
}

export async function reserveAiRequest(uid: string, action: string): Promise<void> {
  if (!['smarty-talk', 'buddy-turn', 'check-writing', 'check-speaking'].includes(action)) {
    throw Object.assign(new Error('Unknown AI action'), { status: 400 });
  }
  // A request budget is deliberately conservative and never refunded on failure.
  // Set the provider's hard key credit limit as the actual USD spending boundary.
  const dailyCap = Number(process.env.AI_DAILY_REQUEST_CAP || 1000);
  if (!Number.isSafeInteger(dailyCap) || dailyCap < 1) throw Object.assign(new Error('AI budget unavailable'), { status: 503 });
  const slot = Math.floor(Date.now() / 600_000);
  const window = await query(`INSERT INTO ai_usage (bucket, hits) VALUES ($1, 1)
    ON CONFLICT (bucket) DO UPDATE SET hits = ai_usage.hits + 1 WHERE ai_usage.hits < 30 RETURNING hits`, [`user:${uid}:${slot}`]);
  if (!window.rowCount) throw Object.assign(new Error('Too many AI requests. Try again later.'), { status: 429 });
  const day = new Date().toISOString().slice(0, 10);
  const budget = await query(`INSERT INTO ai_usage (bucket, hits) VALUES ($1, 1)
    ON CONFLICT (bucket) DO UPDATE SET hits = ai_usage.hits + 1 WHERE ai_usage.hits < $2 RETURNING hits`, [`day:${day}`, dailyCap]);
  if (!budget.rowCount) {
    console.warn(JSON.stringify({ event: 'ai_budget_exhausted', day }));
    throw Object.assign(new Error('AI is resting. Please try again tomorrow.'), { status: 429 });
  }
  if (Number(budget.rows[0].hits) === Math.ceil(dailyCap * 0.8)) console.warn(JSON.stringify({ event: 'ai_budget_80_percent', day }));
}
