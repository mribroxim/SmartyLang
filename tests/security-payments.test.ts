import { test, expect, vi, afterEach } from 'vitest';
import crypto from 'node:crypto';
vi.mock('../server/db.ts', () => ({ databaseConfigured: true, query: vi.fn(async () => ({ rows: [], rowCount: 1 })), withTransaction: vi.fn(async fn => fn({ query: vi.fn(async () => ({ rows: [], rowCount: 1 })) })) }));
vi.mock('../server/auth.ts', () => ({ getProfile: vi.fn(async () => ({ uid: 'owner', plan: 'smarty-max' })), updateProfile: vi.fn(), requireUser: vi.fn(), requireRole: vi.fn(), getSessionUser: vi.fn() }));
import { demoLoginEnabled } from '../server/security';
import { checkoutQuote } from '../server/paymentPolicy';
import { verifyWebhookSignature, fulfillPayment } from '../server/dodoPayments';
import { query } from '../server/db';
import { ageAt } from '../server/ageSafety';
import { paidPlanEnded } from '../src/lib/entitlements';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
test('production demo login cannot be enabled with its environment flag', () => {
  expect(demoLoginEnabled({ NODE_ENV: 'production', DEMO_LOGIN: '1' })).toBe(false);
  expect(demoLoginEnabled({ NODE_ENV: 'development', DEMO_LOGIN: '1' })).toBe(true);
  expect(demoLoginEnabled({ NODE_ENV: 'development' })).toBe(false);
});
test('checkout ignores client prices, validates counts, and computes paid options on the server', () => {
  expect(checkoutQuote({ planId: 'smarty-max', amountUSD: 0.01, seats: 999, languages: 1 }).amountUSD).toBe(13);
  expect(checkoutQuote({ planId: 'business', seats: 7, languages: 2 }).amountUSD).toBe(118);
  expect(() => checkoutQuote({ planId: 'admin' })).toThrow();
  expect(() => checkoutQuote({ planId: 'business', seats: -1 })).toThrow();
  expect(() => checkoutQuote({ planId: 'smarty-max', languages: 1.5 })).toThrow();
  expect(() => checkoutQuote({ planId: 'business', kind: 'seats', additionalSeats: 10 })).toThrow();
});
test('webhooks accept valid raw payloads and reject mutation, stale and future timestamps', () => {
  vi.stubEnv('DODO_PAYMENTS_WEBHOOK_SECRET', 'whsec_' + Buffer.from('release-test-webhook-secret').toString('base64'));
  const now = 1_800_000_000_000, timestamp = String(now / 1000), body = '{"type":"payment.succeeded"}';
  const signature = crypto.createHmac('sha256', Buffer.from('release-test-webhook-secret')).update(`evt.${timestamp}.${body}`).digest('base64');
  const req = { headers: { 'webhook-id': 'evt', 'webhook-timestamp': timestamp, 'webhook-signature': `v1,${signature}` } } as any;
  expect(verifyWebhookSignature(body, req, now)).toBe(true);
  expect(verifyWebhookSignature(body + ' ', req, now)).toBe(false);
  expect(verifyWebhookSignature(body, req, now + 301_000)).toBe(false);
  expect(verifyWebhookSignature(body, req, now - 301_000)).toBe(false);
});
test('payment confirmation cannot promote a client-selected plan or another account', async () => {
  vi.stubEnv('DODO_PAYMENTS_API_KEY', 'test-key'); vi.stubEnv('DODO_PAYMENTS_ENVIRONMENT', 'test_mode'); vi.stubEnv('DODO_PAYMENTS_PRODUCT_ID_MAX', 'prod-max');
  const metadata = { uid: 'owner', planId: 'smarty-max', seats: '1', languages: '1', productId: 'prod-max', amountUSD: '12.99' };
  const fetcher = vi.fn(async (url: string) => ({ ok: true, json: async () => String(url).includes('/subscriptions/') ? { product_id: 'prod-max', status: 'active', next_billing_date: '2030-01-01T00:00:00Z', metadata } : { status: 'succeeded', subscription_id: 'sub-owned', metadata } }));
  vi.stubGlobal('fetch', fetcher);
  await expect(fulfillPayment('attacker', { uid: 'attacker', planId: 'business', seats: 1000, amountUSD: 0.01 }, 'pay-owned')).rejects.toMatchObject({ status: 403 });
  await fulfillPayment('owner', { planId: 'business', seats: 1000 }, 'pay-owned');
  const update = vi.mocked(query).mock.calls.find(([sql]) => sql.startsWith('UPDATE app_users SET role'));
  expect(JSON.parse(String(update?.[1]?.[2])).plan).toBe('smarty-max');
});
test('age boundaries handle birthdays, invalid calendar dates and future dates', () => {
  const now = new Date('2026-11-14T12:00:00Z');
  expect(ageAt(2010, 11, 14, now)).toBe(16); expect(ageAt(2010, 11, 15, now)).toBe(15);
  expect(ageAt(2024, 2, 30, now)).toBe(-1); expect(ageAt(2028, 1, 1, now)).toBe(-1);
  expect(paidPlanEnded({ planExpiresAt: 100 }, 100)).toBe(true);
  expect(paidPlanEnded({ planCancelAt: 100 }, 99)).toBe(false);
});
