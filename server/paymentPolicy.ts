import { getPlan, computeMonthlyUSD, normalizePlanId } from '../src/lib/plans.ts';
type Json = Record<string, any>;
export function priceProduct(plan: string, seats: number, languages: number): string {
  const catalog = JSON.parse(process.env.DODO_PAYMENTS_PRICE_CATALOG || '{}');
  if (catalog[`${plan}:${seats}:${languages}`]) return String(catalog[`${plan}:${seats}:${languages}`]);
  if (languages !== 1) return '';
  if (plan === 'smarty-max' && seats === 1) return process.env.DODO_PAYMENTS_PRODUCT_ID_MAX || process.env.DODO_PAYMENTS_PRODUCT_ID || '';
  if (plan === 'business' && seats === 5) return process.env.DODO_PAYMENTS_PRODUCT_ID_BUSINESS || '';
  return '';
}
export function checkoutQuote(body: Json, profile: Json = {}) {
  const planId = normalizePlanId(String(body.planId || ''));
  const plan = planId && getPlan(planId);
  if (!plan) throw Object.assign(new Error('Unknown plan'), { status: 400 });
  const kind = body.kind || 'plan';
  const additionalSeats = Number(body.additionalSeats || 0);
  const languages = Number(kind === 'seats' ? profile.planLanguages || 1 : body.languages ?? 1);
  const seats = kind === 'seats' ? Number(profile.planSeats || 0) + additionalSeats : planId === 'smarty-max' ? 1 : Number(body.seats ?? 5);
  if (!['plan', 'seats'].includes(kind) || !Number.isSafeInteger(languages) || languages < 1 || languages > 29 || !Number.isSafeInteger(seats) || seats < (planId === 'business' ? 5 : 1) || seats > 1000) throw Object.assign(new Error('Invalid plan options'), { status: 400 });
  if (kind === 'seats' && (planId !== 'business' || profile.plan !== 'business' || !profile.dodoSubscriptionId || !Number.isSafeInteger(additionalSeats) || additionalSeats < 1)) throw Object.assign(new Error('An active business subscription is required'), { status: 403 });
  return { planId, kind, seats, languages, additionalSeats, amountUSD: computeMonthlyUSD(plan, seats, languages), productId: priceProduct(planId, seats, languages) };
}
