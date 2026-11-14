import { apiRequest } from './selfHostedApi';
import type { Plan, PlanId } from './plans';

let configuredCache: boolean | null = null;

export async function isPaymentsConfigured(): Promise<boolean> {
  if (configuredCache !== null) return configuredCache;
  try {
    const res = await apiRequest<{ configured: boolean }>('/api/payments/status');
    configuredCache = !!res.configured;
  } catch {
    configuredCache = false;
  }
  return configuredCache;
}

export interface PlanCheckoutInput {
  planId: PlanId;
  seats: number;
  languages: number;
  amountUSD: number;
}

export interface SeatsCheckoutInput {
  planId: PlanId;
  additionalSeats: number;
  newSeats: number;
  amountUSD: number;
}

async function startCheckout(body: Record<string, unknown>): Promise<void> {
  const res = await apiRequest<{ checkoutUrl: string }>('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.checkoutUrl) throw new Error('Checkout URL was not returned.');
  window.location.href = res.checkoutUrl;
}

export async function startPlanCheckout(plan: Plan, input: PlanCheckoutInput): Promise<void> {
  await startCheckout({
    kind: 'plan',
    planId: input.planId,
    seats: input.seats,
    languages: input.languages,
    amountUSD: input.amountUSD,
    description: `SmartyLang — ${plan.name} (${input.seats} seat${input.seats === 1 ? '' : 's'}, ${input.languages} language${input.languages === 1 ? '' : 's'})`,
  });
}

export async function startSeatsCheckout(plan: Plan, input: SeatsCheckoutInput): Promise<void> {
  await startCheckout({
    kind: 'seats',
    planId: input.planId,
    additionalSeats: input.additionalSeats,
    newSeats: input.newSeats,
    amountUSD: input.amountUSD,
    description: `SmartyLang — ${plan.name} +${input.additionalSeats} seat${input.additionalSeats === 1 ? '' : 's'}`,
  });
}

export type CancelReason = 'price' | 'not-using' | 'features' | 'technical' | 'break' | 'other';

/** Cancel Smarty Max: it stays on until the paid period ends. Returns the updated profile. */
export async function cancelMax(reason?: CancelReason): Promise<Record<string, any>> {
  const res = await apiRequest<{ profile: Record<string, any> }>('/api/payments/cancel', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.profile;
}

/** Undo a cancellation before the plan ends. */
export async function resumeMax(): Promise<Record<string, any>> {
  const res = await apiRequest<{ profile: Record<string, any> }>('/api/payments/resume', { method: 'POST', body: '{}' });
  return res.profile;
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** End of the current paid period (mirrors the server): admin expiry, else 30-day months from the start. */
export function maxPaidThrough(profile: { planExpiresAt?: number | null; planStartedAt?: number } | null | undefined, now = Date.now()): number {
  if (profile?.planExpiresAt && profile.planExpiresAt > 0) return profile.planExpiresAt;
  const start = profile?.planStartedAt ?? now;
  if (start > now) return start + MONTH_MS;
  return start + (Math.floor((now - start) / MONTH_MS) + 1) * MONTH_MS;
}
