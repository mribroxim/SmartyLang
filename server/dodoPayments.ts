import crypto from 'node:crypto';
import type { Request } from 'express';
import { query } from './db.ts';
import { checkoutQuote, priceProduct } from './paymentPolicy.ts';
import { getProfile, updateProfile } from './auth.ts';

type Json = Record<string, any>;

export interface DodoPayment {
  payment_id: string;
  status: string;
  total_amount: number;
  currency?: string;
  subscription_id?: string;
  created_at?: string;
  metadata?: Record<string, string>;
  customer?: { email?: string; name?: string };
}

function normalizePlanId(planId: string): string {
  if (planId === 'smarty-max') return 'smarty-max';
  if (planId === 'business' || planId === 'teacher' || planId === 'organization') return 'business';
  return planId;
}

function productIdForPlan(planId: string): string {
  const normalized = normalizePlanId(planId);
  if (normalized === 'smarty-max') {
    return String(process.env.DODO_PAYMENTS_PRODUCT_ID_MAX || process.env.DODO_PAYMENTS_PRODUCT_ID || '');
  }
  if (normalized === 'business') {
    return String(process.env.DODO_PAYMENTS_PRODUCT_ID_BUSINESS || '');
  }
  return '';
}

export function isDodoConfigured(): boolean {
  return !!process.env.DODO_PAYMENTS_API_KEY
    && !!process.env.DODO_PAYMENTS_WEBHOOK_SECRET
    && !!productIdForPlan('smarty-max')
    && !!productIdForPlan('business');
}

function apiBase(): string {
  const env = String(process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode');
  if (!['live_mode', 'test_mode'].includes(env)) throw new Error('Invalid payment environment');
  return env === 'test_mode' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
}

function appBaseUrl(): string {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function dodoRequest<T = Json>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = String(process.env.DODO_PAYMENTS_API_KEY || '');
  if (!apiKey) throw Object.assign(new Error('Dodo Payments is not configured.'), { status: 503 });

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = `Payment provider unavailable (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : 400 });
  }
  return payload as T;
}

export async function createCheckoutSession(input: {
  planId: string;
  amountUSD: number;
  description: string;
  customerEmail?: string;
  customerName?: string;
  metadata: Record<string, string>;
  profile?: Json;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const normalizedPlanId = normalizePlanId(input.planId);
  const quote = checkoutQuote(input.metadata, input.profile);
  const productId = quote.productId;
  if (!productId) {
    throw Object.assign(new Error(`No Dodo product configured for plan: ${normalizedPlanId}`), { status: 503 });
  }

  if (quote.kind === 'seats') {
    const id = String(input.profile?.dodoSubscriptionId || '');
    const current = await dodoRequest(`/subscriptions/${encodeURIComponent(id)}`);
    if (current.metadata?.uid !== input.metadata.uid || current.status !== 'active') throw Object.assign(new Error('Subscription account mismatch'), { status: 403 });
    const changed = await dodoRequest(`/subscriptions/${encodeURIComponent(id)}/change-plan`, { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1, proration_billing_mode: 'prorated_immediately', collect_via_payment_link: true, on_payment_failure: 'prevent_change', metadata: input.metadata }) });
    if (!changed.payment_link) throw Object.assign(new Error('Billing change needs support'), { status: 502 });
    return { checkoutUrl: changed.payment_link, sessionId: changed.payment_id || '' };
  }

  const session = await dodoRequest<{ checkout_url?: string; session_id?: string }>('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: input.customerEmail || undefined,
        name: input.customerName || undefined,
      },
      return_url: `${appBaseUrl()}/?payment=success`,
      metadata: {
        ...input.metadata,
        planId: normalizedPlanId,
        productId,
        amountUSD: String(input.amountUSD),
        description: input.description,
      },
    }),
  });

  if (!session.checkout_url) {
    throw Object.assign(new Error('Dodo Payments did not return a checkout URL.'), { status: 502 });
  }
  return { checkoutUrl: session.checkout_url, sessionId: String(session.session_id || '') };
}

export async function retrievePayment(paymentId: string): Promise<DodoPayment> {
  return dodoRequest<DodoPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

function webhookSecretBytes(): Buffer | null {
  const raw = String(process.env.DODO_PAYMENTS_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_KEY || '');
  if (!raw) return null;
  const stripped = raw.startsWith('whsec_') ? raw.slice('whsec_'.length) : raw;
  return Buffer.from(stripped, 'base64');
}

export function verifyWebhookSignature(rawBody: string, req: Request, now = Date.now()): boolean {
  const secret = webhookSecretBytes();
  if (!secret) return false;

  const msgId = String(req.headers['webhook-id'] || '');
  const msgTimestamp = String(req.headers['webhook-timestamp'] || '');
  const msgSignature = String(req.headers['webhook-signature'] || '');
  if (!msgId || !msgTimestamp || !msgSignature) return false;
  if (!/^\d+$/.test(msgTimestamp) || Math.abs(now / 1000 - Number(msgTimestamp)) > 300) return false;

  const signed = `${msgId}.${msgTimestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('base64');
  const signatures = msgSignature.split(' ');
  return signatures.some((versioned) => {
    const [version, sig] = versioned.split(',');
    if (version !== 'v1' || !sig) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

function planRole(planId: string): string {
  return normalizePlanId(planId) === 'business' ? 'business' : 'student';
}

export function pendingFromMetadata(meta: Record<string, string>, paymentId: string): Json {
  const kind = meta.kind || 'plan';
  const planId = normalizePlanId(meta.planId || '');
  if (!planId) throw Object.assign(new Error('Payment metadata is missing planId.'), { status: 400 });
  const seats = Number(meta.seats);
  const languages = Number(meta.languages);
  if (!meta.uid || !['smarty-max', 'business'].includes(planId) || !Number.isSafeInteger(seats) || !Number.isSafeInteger(languages) || seats < 1 || languages < 1 || meta.productId !== priceProduct(planId, seats, languages)) throw Object.assign(new Error('Payment metadata is invalid'), { status: 403 });

  const base: Json = {
    uid: meta.uid,
    email: meta.email || '',
    displayName: meta.displayName || '',
    planId,
    amountUSD: Number(meta.amountUSD || 0),
    transactionId: paymentId,
    status: 'completed',
    paidAt: Date.now(),
  };

  return {
    ...base,
    seats: Number(meta.seats || 0),
    languages: Number(meta.languages || 1),
  };
}

function assertPaymentSucceeded(payment: DodoPayment): void {
  if (payment.status !== 'succeeded') {
    throw Object.assign(new Error(`Payment is not completed (status: ${payment.status}).`), { status: 409 });
  }
}

function assertPaymentMatches(payment: DodoPayment, pending: Json): void {
  const metaUid = payment.metadata?.uid;
  if (metaUid && pending.uid && metaUid !== pending.uid) {
    throw Object.assign(new Error('Payment account mismatch.'), { status: 403 });
  }

  if (process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode') return;

  const amountUSD = Number(pending.amountUSD || payment.metadata?.amountUSD || 0);
  const expectedCents = Math.round(amountUSD * 100);
  if (expectedCents > 0 && payment.total_amount < expectedCents) {
    throw Object.assign(new Error('Payment amount does not match the checkout.'), { status: 403 });
  }
}

export async function fulfillPayment(uid: string, pending: Json, paymentId: string): Promise<Json> {
  const dodoPayment = await retrievePayment(paymentId);
  assertPaymentSucceeded(dodoPayment);
  // Always derive entitlement from provider metadata, ignoring client claims.
  pending = pendingFromMetadata(dodoPayment.metadata || {}, paymentId);
  if (pending.uid !== uid || !dodoPayment.subscription_id) throw Object.assign(new Error('Payment account or subscription mismatch'), { status: 403 });
  const profile = await syncSubscription(dodoPayment.subscription_id, uid);

  const payment: Json = {
    ...pending,
    uid,
    planId: normalizePlanId(String(pending.planId || '')),
    transactionId: paymentId,
    status: 'completed',
    paidAt: Number.isFinite(Date.parse(dodoPayment.created_at || '')) ? Date.parse(dodoPayment.created_at) : Date.now(),
  };
  const id = `dodo_${paymentId}`;
  await query(
    `INSERT INTO payments (id, uid, paid_at, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [id, uid, payment.paidAt, JSON.stringify(payment)],
  );

  return profile;
}

export async function fulfillPaymentFromWebhook(paymentId: string): Promise<void> {
  const dodoPayment = await retrievePayment(paymentId);
  assertPaymentSucceeded(dodoPayment);
  const meta = dodoPayment.metadata || {};
  const uid = meta.uid;
  if (!uid) return;
  if (!(await getProfile(uid))) return; // Deleted accounts must never be recreated by a webhook.

  const pending = pendingFromMetadata(meta, paymentId);
  await fulfillPayment(uid, pending, paymentId);
}

export async function syncSubscription(id: string, expectedUid?: string): Promise<Json> {
  // Old or reordered webhook bodies cannot restore access: fetch current state.
  const sub = await dodoRequest(`/subscriptions/${encodeURIComponent(id)}`);
  const data = pendingFromMetadata(sub.metadata || {}, id);
  if ((expectedUid && data.uid !== expectedUid) || sub.product_id !== sub.metadata?.productId) throw Object.assign(new Error('Subscription account mismatch'), { status: 403 });
  const expiry = Date.parse(sub.next_billing_date);
  if (!Number.isFinite(expiry)) throw Object.assign(new Error('Subscription period missing'), { status: 502 });
  const active = ['active', 'past_due'].includes(sub.status);
  const created = Date.parse(sub.created_at || '') || 0;
  const patch = { plan: data.planId, planSeats: data.seats, planLanguages: data.languages, planStartedAt: created, dodoSubscriptionId: id, dodoStatus: sub.status, planExpiresAt: active ? expiry : Math.min(expiry, Date.now()), planCancelAt: sub.cancel_at_next_billing_date ? expiry : null, planCancelledAt: sub.cancel_at_next_billing_date ? Date.now() : null, role: data.planId === 'business' && active ? 'business' : 'student' };
  await query('UPDATE app_users SET role = CASE WHEN role IN (\'admin\', \'content-manager\') THEN role ELSE $2 END, profile = profile || $3::jsonb WHERE uid = $1 AND (profile->>\'dodoSubscriptionId\' IS NULL OR profile->>\'dodoSubscriptionId\' = $4 OR COALESCE((profile->>\'planStartedAt\')::bigint, 0) < $5)', [data.uid, patch.role, JSON.stringify(patch), id, created]);
  return (await getProfile(data.uid)) || {};
}

export async function changeCancellation(uid: string, id: string, cancel: boolean): Promise<Json> {
  const sub = await dodoRequest(`/subscriptions/${encodeURIComponent(id)}`);
  if (sub.metadata?.uid !== uid || !['active', 'past_due'].includes(sub.status) || Date.parse(sub.next_billing_date) <= Date.now()) throw Object.assign(new Error('Subscription is not active for this account'), { status: 409 });
  await dodoRequest(`/subscriptions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ cancel_at_next_billing_date: cancel }) });
  return syncSubscription(id, uid);
}
