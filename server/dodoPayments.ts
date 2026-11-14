import crypto from 'node:crypto';
import type { Request } from 'express';
import { query } from './db.ts';
import { getProfile, updateProfile } from './auth.ts';

type Json = Record<string, any>;

export interface DodoPayment {
  payment_id: string;
  status: string;
  total_amount: number;
  currency?: string;
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
    && !!productIdForPlan('smarty-max')
    && !!productIdForPlan('business');
}

function apiBase(): string {
  const env = String(process.env.DODO_PAYMENTS_ENVIRONMENT || 'live_mode');
  return env === 'test_mode' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
}

function appBaseUrl(): string {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function dodoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = String(process.env.DODO_PAYMENTS_API_KEY || '');
  if (!apiKey) throw Object.assign(new Error('Dodo Payments is not configured.'), { status: 503 });

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
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
    const message = payload?.message || payload?.error || `Dodo Payments request failed (${response.status})`;
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
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const normalizedPlanId = normalizePlanId(input.planId);
  const productId = productIdForPlan(normalizedPlanId);
  if (!productId) {
    throw Object.assign(new Error(`No Dodo product configured for plan: ${normalizedPlanId}`), { status: 503 });
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
      cancel_url: `${appBaseUrl()}/?payment=cancel`,
      redirect_immediately: true,
      metadata: {
        ...input.metadata,
        planId: normalizedPlanId,
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

export function verifyWebhookSignature(rawBody: string, req: Request): boolean {
  const secret = webhookSecretBytes();
  if (!secret) return false;

  const msgId = String(req.headers['webhook-id'] || '');
  const msgTimestamp = String(req.headers['webhook-timestamp'] || '');
  const msgSignature = String(req.headers['webhook-signature'] || '');
  if (!msgId || !msgTimestamp || !msgSignature) return false;

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

  if (kind === 'seats') {
    return {
      ...base,
      type: 'seats',
      additionalSeats: Number(meta.additionalSeats || 0),
      newSeats: Number(meta.newSeats || 0),
      seats: Number(meta.additionalSeats || 0),
    };
  }

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
  assertPaymentMatches(dodoPayment, pending);

  const payment: Json = {
    ...pending,
    uid,
    planId: normalizePlanId(String(pending.planId || '')),
    transactionId: paymentId,
    status: 'completed',
    paidAt: Date.now(),
  };
  const id = `dodo_${paymentId}`;
  await query(
    `INSERT INTO payments (id, uid, paid_at, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [id, uid, payment.paidAt, JSON.stringify(payment)],
  );

  const patch = {
    plan: payment.planId,
    planSeats: payment.type === 'seats' ? payment.newSeats : payment.seats,
    planLanguages: payment.languages ?? 1,
    planStartedAt: payment.paidAt,
    role: planRole(String(payment.planId)),
    // A new purchase undoes any earlier cancellation.
    planCancelAt: null,
    planCancelledAt: null,
    planCancelReason: null,
  };
  await updateProfile(uid, patch);
  await query('UPDATE app_users SET role = $2 WHERE uid = $1', [uid, patch.role]);
  return getProfile(uid);
}

export async function fulfillPaymentFromWebhook(paymentId: string): Promise<void> {
  const dodoPayment = await retrievePayment(paymentId);
  assertPaymentSucceeded(dodoPayment);
  const meta = dodoPayment.metadata || {};
  const uid = meta.uid;
  if (!uid) return;

  const pending = pendingFromMetadata(meta, paymentId);
  assertPaymentMatches(dodoPayment, pending);
  await fulfillPayment(uid, pending, paymentId);
}
