import express, { type Express, type Request, type Response } from 'express';
import { getProfile, requireUser, updateProfile } from './auth.ts';
import { checkoutQuote } from './paymentPolicy.ts';
import { query } from './db.ts';

/** Students in a class run by a (free) teacher account get this much off Smarty Max. */
const TEACHER_DISCOUNT = 0.1;
async function hasTeacherDiscount(uid: string): Promise<boolean> {
  const found = await query(
    `SELECT 1 FROM class_members m JOIN classes c ON c.id = m.class_id JOIN app_users t ON t.uid = c.teacher_uid
      WHERE m.user_uid = $1 AND t.role = 'teacher' LIMIT 1`, [uid]);
  return !!found.rowCount;
}
import {
  createCheckoutSession,
  fulfillPayment,
  fulfillPaymentFromWebhook,
  isDodoConfigured,
  pendingFromMetadata,
  retrievePayment,
  verifyWebhookSignature,
  syncSubscription,
  changeCancellation,
} from './dodoPayments.ts';

function errorStatus(error: any, fallback = 500): number {
  return Number(error?.status || fallback);
}

export function registerPaymentsWebhook(app: Express): void {
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
      if (!verifyWebhookSignature(rawBody, req)) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }

      const event = JSON.parse(rawBody);
      const type = String(event?.type || '');
      const paymentId = String(event?.data?.payment_id || '');
      if (type === 'payment.succeeded' && paymentId) {
        await fulfillPaymentFromWebhook(paymentId);
      }
      if (type.startsWith('subscription.') && event?.data?.subscription_id) await syncSubscription(String(event.data.subscription_id));
      return res.json({ received: true });
    } catch (error: any) {
      const status = errorStatus(error);
      if (status >= 500) console.error('[api/payments/webhook]', error);
      return res.status(status).json({ error: error?.message || 'Webhook processing failed.' });
    }
  });
}

export function registerPaymentsApi(app: Express): void {
  app.get('/api/payments/status', (_req, res) => {
    res.json({ configured: isDodoConfigured() });
  });

  app.get('/api/payments/teacher-discount', async (req, res) => {
    try {
      const user = await requireUser(req);
      const eligible = await hasTeacherDiscount(user.uid);
      return res.json({ eligible, percent: eligible ? Math.round(TEACHER_DISCOUNT * 100) : 0 });
    } catch (error: any) {
      return res.status(errorStatus(error)).json({ error: error?.message || 'Failed' });
    }
  });

  app.post('/api/payments/checkout', async (req, res) => {
    try {
      const user = await requireUser(req);
      if (!isDodoConfigured()) {
        return res.status(503).json({ error: 'Payments are not configured yet.' });
      }

      const body = req.body || {};
      const quote = checkoutQuote(body, user.profile);
      const { kind, planId } = quote;
      // Teacher discount: Smarty Max only, applied through a Dodo discount code set in the dashboard.
      const discountCode = planId === 'smarty-max' && kind !== 'seats' && process.env.DODO_TEACHER_DISCOUNT_CODE?.trim() && await hasTeacherDiscount(user.uid)
        ? process.env.DODO_TEACHER_DISCOUNT_CODE.trim() : undefined;
      const amountUSD = discountCode ? Math.round(quote.amountUSD * (1 - TEACHER_DISCOUNT) * 100) / 100 : quote.amountUSD;
      const description = `SmartyLang — ${planId}`;

      if (!planId || !Number.isFinite(amountUSD) || amountUSD <= 0) {
        return res.status(400).json({ error: 'Invalid checkout request.' });
      }

      const metadata: Record<string, string> = {
        kind,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email || 'User',
        planId,
        amountUSD: String(amountUSD),
      };

      if (kind === 'seats') {
        metadata.additionalSeats = String(quote.additionalSeats);
      }
      metadata.seats = String(quote.seats);
      metadata.languages = String(quote.languages);
      metadata.productId = quote.productId;

      const session = await createCheckoutSession({
        planId,
        amountUSD,
        description,
        customerEmail: user.email || undefined,
        customerName: user.displayName || user.email || undefined,
        metadata: discountCode ? { ...metadata, teacherDiscount: String(TEACHER_DISCOUNT) } : metadata,
        profile: user.profile,
        discountCode,
      });

      return res.json({ checkoutUrl: session.checkoutUrl, sessionId: session.sessionId });
    } catch (error: any) {
      const status = errorStatus(error);
      if (status >= 500) console.error('[api/payments/checkout]', error);
      return res.status(status).json({ error: error?.message || 'Failed to create checkout session.' });
    }
  });
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const CANCEL_REASONS = new Set(['price', 'not-using', 'features', 'technical', 'break', 'other']);

/** When the paid period ends: an admin-set expiry, else 30 days after the plan started (rolled forward to the current month). */
export function paidThrough(profile: Record<string, any>, now = Date.now()): number {
  if (typeof profile.planExpiresAt === 'number' && profile.planExpiresAt > 0) return profile.planExpiresAt;
  const start = typeof profile.planStartedAt === 'number' ? profile.planStartedAt : now;
  if (start > now) return start + MONTH_MS;
  const months = Math.floor((now - start) / MONTH_MS) + 1;
  return start + months * MONTH_MS;
}

/** Self-serve Smarty Max cancel / resume. Business plans are managed by an admin. */
export function registerSubscriptionApi(app: Express): void {
  app.post('/api/payments/cancel', async (req, res) => {
    try {
      const user = await requireUser(req);
      const profile = (await getProfile(user.uid)) || {};
      if (profile.plan !== 'smarty-max' || user.role === 'admin') {
        return res.status(400).json({ error: 'Only an individual Smarty Max plan can be cancelled here.' });
      }
      if (profile.sponsoredBy) {
        return res.status(400).json({ error: 'This Smarty Max was gifted to you. Ask the person who invited you to change it.' });
      }
      const reason = CANCEL_REASONS.has(String(req.body?.reason)) ? String(req.body.reason) : null;
      const now = Date.now();
      if (profile.dodoSubscriptionId) {
        const next = await changeCancellation(user.uid, profile.dodoSubscriptionId, true);
        return res.json({ profile: next });
      }
      const next = await updateProfile(user.uid, {
        planCancelAt: profile.planCancelAt && profile.planCancelAt > now ? profile.planCancelAt : paidThrough(profile, now),
        planCancelledAt: now,
        planCancelReason: reason,
      });
      return res.json({ profile: next });
    } catch (error: any) {
      const status = errorStatus(error);
      if (status >= 500) console.error('[api/payments/cancel]', error);
      return res.status(status).json({ error: error?.message || 'Could not cancel.' });
    }
  });

  app.post('/api/payments/resume', async (req, res) => {
    try {
      const user = await requireUser(req);
      const profile = (await getProfile(user.uid)) || {};
      if (profile.plan !== 'smarty-max' || !profile.planCancelAt) {
        return res.status(400).json({ error: 'Nothing to resume.' });
      }
      if (profile.planCancelAt <= Date.now()) {
        return res.status(409).json({ error: 'This plan has already ended. Subscribe again to get Smarty Max back.' });
      }
      if (profile.dodoSubscriptionId) return res.json({ profile: await changeCancellation(user.uid, profile.dodoSubscriptionId, false) });
      const next = await updateProfile(user.uid, { planCancelAt: null, planCancelledAt: null, planCancelReason: null });
      return res.json({ profile: next });
    } catch (error: any) {
      const status = errorStatus(error);
      if (status >= 500) console.error('[api/payments/resume]', error);
      return res.status(status).json({ error: error?.message || 'Could not resume.' });
    }
  });
}

export async function confirmDodoPayment(
  user: { uid: string },
  pending: Record<string, any>,
  paymentId: string,
): Promise<any> {
  if (!isDodoConfigured()) {
    throw Object.assign(new Error('Payment confirmation is not configured.'), { status: 503 });
  }
  if (!paymentId) {
    throw Object.assign(new Error('Missing payment id.'), { status: 400 });
  }
  if (pending?.uid && user.uid !== String(pending.uid)) {
    throw Object.assign(new Error('Payment account mismatch.'), { status: 403 });
  }

  let effective: Record<string, any> = { ...pending, uid: user.uid };
  if (!effective.planId) {
    const dodoPayment = await retrievePayment(paymentId);
    const meta = dodoPayment.metadata || {};
    if (meta.uid && meta.uid !== user.uid) {
      throw Object.assign(new Error('Payment account mismatch.'), { status: 403 });
    }
    effective = { ...pendingFromMetadata(meta, paymentId), uid: user.uid };
  }

  return fulfillPayment(user.uid, effective, paymentId);
}
