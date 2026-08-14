// ATMOS Payment integration helper
// ATMOS is an Uzbek payment processor (https://atmos.uz)
// For production, the create/pre-apply/apply transaction flow must run on a server
// (the merchant secret cannot be exposed in the frontend).
// This module provides a client-side helper to redirect the user to ATMOS's
// hosted checkout form, which is the simplest integration that works without a backend.

export type PlanId = 'smarty-max' | 'teacher' | 'organization';

export interface Plan {
  id: PlanId;
  name: string;
  basePriceUSD: number;          // monthly base price
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  // Seat economics
  includedSeats?: number;        // free seats included in base plan
  extraSeatPriceUSD?: number;    // price per additional seat per month
  minSeats?: number;             // minimum total seats (for organization)
  allowsStaffInvites?: boolean;  // organization can invite teachers
}

// USD → UZS approx rate. Keep this in one place so it's easy to update.
const USD_TO_UZS_RATE = 12500;

export const PLANS: Plan[] = [
  {
    id: 'smarty-max',
    name: 'Smarty Max',
    basePriceUSD: 19.99,
    description: 'Full access for serious learners',
    features: [
      'Unlimited AI Writing & Speaking checks',
      'All reading & listening passages',
      'Interactive stories & exercises',
      'Spaced-repetition vocabulary system',
      'Pronunciation scoring with feedback',
      'Priority response time',
    ],
    badge: 'Most Popular',
    popular: true,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    basePriceUSD: 99,
    description: 'Run classes for up to 5 students included',
    features: [
      'Everything in Smarty Max',
      '5 student seats included',
      'Additional seats: $12.99 / student / month',
      'Assign tasks & monitor progress',
      'Class-level analytics dashboard',
      'Direct teacher support',
    ],
    includedSeats: 5,
    extraSeatPriceUSD: 12.99,
  },
  {
    id: 'organization',
    name: 'Organization',
    basePriceUSD: 0, // Org pays per-seat; no base fee on top of seats
    description: 'Schools, academies and language centers',
    features: [
      'Everything in the Teacher plan',
      'Student seats: $12.99 / seat / month',
      'Minimum 30 seats — add any amount above that',
      'Invite unlimited staff as teachers',
      'Organization-wide analytics',
      'Bulk student onboarding',
      'Priority enterprise support',
    ],
    includedSeats: 0,
    extraSeatPriceUSD: 12.99,
    minSeats: 30,
    allowsStaffInvites: true,
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find(p => p.id === id);
}

/**
 * Compute the total monthly price (USD) for a plan with a given seat count.
 * Seat count = total student seats the buyer wants.
 */
export function computeMonthlyUSD(plan: Plan, seats: number): number {
  const included = plan.includedSeats ?? 0;
  const extra = Math.max(0, seats - included);
  const extraPrice = (plan.extraSeatPriceUSD ?? 0) * extra;
  return plan.basePriceUSD + extraPrice;
}

export function computeMonthlyUZSTiyin(plan: Plan, seats: number): number {
  const usd = computeMonthlyUSD(plan, seats);
  // ATMOS uses tiyin (100 tiyin = 1 so'm)
  return Math.round(usd * USD_TO_UZS_RATE) * 100;
}

// ATMOS merchant config — fill these in via env vars at build time
const ATMOS_CONFIG = {
  merchantId: (import.meta as any).env?.VITE_ATMOS_MERCHANT_ID || '',
  storeId: (import.meta as any).env?.VITE_ATMOS_STORE_ID || '',
  formUrl: (import.meta as any).env?.VITE_ATMOS_FORM_URL || 'https://checkout.pays.uz/atmos/payment-form',
  successUrl: (import.meta as any).env?.VITE_ATMOS_SUCCESS_URL || (typeof window !== 'undefined' ? window.location.origin + '/?payment=success' : ''),
  cancelUrl: (import.meta as any).env?.VITE_ATMOS_CANCEL_URL || (typeof window !== 'undefined' ? window.location.origin + '/?payment=cancel' : ''),
};

export function isAtmosConfigured(): boolean {
  return !!ATMOS_CONFIG.merchantId && !!ATMOS_CONFIG.storeId;
}

/**
 * Submit a POST to ATMOS's hosted checkout form.
 */
export function redirectToAtmos(plan: Plan, seats: number, accountId: string) {
  if (!isAtmosConfigured()) {
    throw new Error('ATMOS is not configured. Set VITE_ATMOS_MERCHANT_ID and VITE_ATMOS_STORE_ID.');
  }

  const amountTiyin = computeMonthlyUZSTiyin(plan, seats);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = ATMOS_CONFIG.formUrl;
  form.target = '_self';
  form.style.display = 'none';

  const fields: Record<string, string> = {
    merchant_id: ATMOS_CONFIG.merchantId,
    store_id: ATMOS_CONFIG.storeId,
    amount: String(amountTiyin),
    account: accountId,
    lang: 'en',
    description: `Smarty English — ${plan.name} (${seats} seat${seats === 1 ? '' : 's'})`,
    redirect_url: ATMOS_CONFIG.successUrl,
    cancel_url: ATMOS_CONFIG.cancelUrl,
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export function formatUZS(amountInTiyin: number): string {
  const soums = amountInTiyin / 100;
  return new Intl.NumberFormat('en-US').format(soums) + " so'm";
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// ─── Seat Add-Ons ──────────────────────────────────────────────────────────
//
// When a Teacher / Organization already owns a plan and just wants more seats,
// they don't need to re-buy the base plan — just the per-seat add-on. These
// helpers compute the price and submit a one-off seat-add charge to ATMOS.

/** Compute the per-seat add-on cost in USD for N additional seats. */
export function computeSeatAddOnUSD(plan: Plan, additionalSeats: number): number {
  return Math.max(0, additionalSeats) * (plan.extraSeatPriceUSD ?? 0);
}

/** Same value, in tiyin (so'm × 100) for ATMOS. */
export function computeSeatAddOnUZSTiyin(plan: Plan, additionalSeats: number): number {
  return Math.round(computeSeatAddOnUSD(plan, additionalSeats) * USD_TO_UZS_RATE) * 100;
}

/**
 * Redirect the user to ATMOS to pay for `additionalSeats` extra seats on an
 * already-active plan. After ATMOS redirects back to /?payment=success, the
 * app's success handler reads sessionStorage and increments the user's
 * planSeats by `additionalSeats`.
 */
export function redirectToAtmosForSeats(plan: Plan, additionalSeats: number, accountId: string) {
  if (!isAtmosConfigured()) {
    throw new Error('ATMOS is not configured. Set VITE_ATMOS_MERCHANT_ID and VITE_ATMOS_STORE_ID.');
  }
  if (additionalSeats <= 0) throw new Error('Pick at least 1 additional seat.');

  const amountTiyin = computeSeatAddOnUZSTiyin(plan, additionalSeats);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = ATMOS_CONFIG.formUrl;
  form.target = '_self';
  form.style.display = 'none';

  const fields: Record<string, string> = {
    merchant_id: ATMOS_CONFIG.merchantId,
    store_id: ATMOS_CONFIG.storeId,
    amount: String(amountTiyin),
    account: accountId,
    lang: 'en',
    description: `Smarty English — ${plan.name} +${additionalSeats} seat${additionalSeats === 1 ? '' : 's'}`,
    redirect_url: ATMOS_CONFIG.successUrl,
    cancel_url: ATMOS_CONFIG.cancelUrl,
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
