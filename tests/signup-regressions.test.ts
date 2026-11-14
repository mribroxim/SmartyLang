import { afterEach, expect, test, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { OAuth2Client } from 'google-auth-library';

vi.mock('../server/db.ts', () => ({ query: vi.fn(async () => ({ rows: [], rowCount: 1 })), withTransaction: vi.fn() }));
import { installSecurity } from '../server/security';
import { googleAuthUrl, loginGoogleUser, registerUser, requireUser } from '../server/auth';
import { query } from '../server/db';

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.clearAllMocks(); });

test('Google cross-site return reaches state validation while foreign API writes remain blocked', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('APP_URL', 'https://smartylang.com');
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID', 'test-client');
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET', 'test-secret');
  const exchange = vi.spyOn(OAuth2Client.prototype, 'getToken');
  const app = express();
  installSecurity(app);
  app.get('/api/auth/google/callback', async (req, res) => {
    try { await loginGoogleUser(req, res, 'test-code', 'wrong-state'); res.sendStatus(200); }
    catch (error: any) { res.status(error.status || 500).json({ error: error.message }); }
  });
  app.all('/api/data', (_req, res) => res.sendStatus(200));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const callback = await fetch(base + '/api/auth/google/callback', { headers: { 'Sec-Fetch-Site': 'cross-site' } });
    expect(callback.status).toBe(400);
    expect(await callback.json()).toEqual({ error: 'Invalid Google sign-in state' });
    expect(exchange).not.toHaveBeenCalled();
    for (const [method, headers] of [
      ['POST', { Origin: 'https://foreign.example' }],
      ['POST', { 'Sec-Fetch-Site': 'cross-site' }],
      ['GET', { 'Sec-Fetch-Site': 'cross-site' }],
    ] as const) expect((await fetch(base + '/api/data', { method, headers })).status).toBe(403);
    expect((await fetch(base + '/api/data', { method: 'POST', headers: { Origin: 'https://smartylang.com' } })).status).toBe(200);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('Google sign-in starts before the onboarding age question and retains its state cookie', () => {
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID', 'test-client');
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET', 'test-secret');
  const res = { setHeader: vi.fn() };
  const url = new URL(googleAuthUrl({ headers: {}, secure: true } as any, res as any));
  const cookie = String(res.setHeader.mock.calls[0][1]);
  expect(url.searchParams.get('state')).toBeTruthy();
  expect(cookie).toContain(url.searchParams.get('state'));
  expect(cookie).toContain('HttpOnly; SameSite=Lax; Secure');
});

test('email signup enters onboarding without granting learning access before age consent', async () => {
  const res = { setHeader: vi.fn() };
  const user = await registerUser({ headers: {}, secure: false, get: () => undefined } as any, res as any, { email: 'onboarding@example.test', password: 'test-only-password' });
  expect(user.role).toBe('student');
  expect(user.profile.agePolicyVersion).toBeUndefined();
  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('smarty_session='));
  vi.mocked(query).mockImplementation(async (sql: string) => ({ rows: sql.includes('JOIN app_users') ? [{ uid: user.uid, email: user.email, display_name: 'Learner', role: 'student', profile: {}, disabled: false }] : [], rowCount: 1 }) as any);
  const req = { headers: { cookie: 'smarty_session=test-session' } } as any;
  await expect(requireUser(req)).rejects.toMatchObject({ status: 403, message: 'Age check required' });
  await expect(requireUser(req, true)).resolves.toMatchObject({ uid: user.uid });
});
