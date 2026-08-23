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
  basePriceUSD: number;          // monthly base price (0 for org — seats only)
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  // Seat economics
  includedSeats?: number;        // free seats included in base plan
  extraSeatPriceUSD?: number;    // price per additional seat per month
  minSeats?: number;             // minimum total seats (for organization)
  allowsStaffInvites?: boolean;  // organization can invite teachers
  // Learning-language economics (UI language is always free)
  includedLanguages?: number;           // learning languages included (default 1)
  /** Flat $ per extra learning language (SmartyLang Max). */
  extraLearningLanguageUSD?: number;
  /** $ per seat × extra learning language (Teacher / Organization). */
  extraLanguagePerSeatUSD?: number;
}

// USD → UZS approx rate. Keep this in one place so it's easy to update.
const USD_TO_UZS_RATE = 12500;

export const PLANS: Plan[] = [
  {
    id: 'smarty-max',
    name: 'SmartyLang Max',
    basePriceUSD: 12.99,
    description: 'Full access for one learning language',
    features: [
      '1 learning language included (UI free in all 29)',
      'Extra learning languages: $8.99 / mo each',
      'Unlimited AI Writing & Speaking checks',
      'All reading & listening passages',
      'Interactive stories & exercises',
      'Spaced-repetition vocabulary system',
      'Real-time reading feedback',
    ],
    badge: 'Most Popular',
    popular: true,
    includedLanguages: 1,
    extraLearningLanguageUSD: 8.99,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    basePriceUSD: 65,
    description: 'Run classes — 5 seats & 1 class language included',
    features: [
      'Everything in SmartyLang Max',
      '5 student seats included',
      '1 learning language for the class',
      'Extra seats: $8.99 / seat / month',
      'Extra languages: $4.99 × seats / month',
      'Assign tasks & monitor progress',
      'Class-level analytics dashboard',
    ],
    includedSeats: 5,
    extraSeatPriceUSD: 8.99,
    includedLanguages: 1,
    extraLanguagePerSeatUSD: 4.99,
  },
  {
    id: 'organization',
    name: 'Organization',
    basePriceUSD: 0,
    description: 'Schools, academies and language centers',
    features: [
      'Everything in the Teacher plan',
      'Student seats: $8.99 / seat / month',
      '1 learning language included org-wide',
      'Extra languages: $4.99 × seats / month',
      'Minimum 20 seats — add any amount above that',
      'Invite unlimited staff as teachers',
      'Organization-wide analytics',
      'Bulk student onboarding',
    ],
    includedSeats: 0,
    extraSeatPriceUSD: 8.99,
    minSeats: 20,
    allowsStaffInvites: true,
    includedLanguages: 1,
    extraLanguagePerSeatUSD: 4.99,
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find(p => p.id === id);
}

/**
 * Monthly price (USD).
 *
 * Max:     12.99 + 8.99 × max(0, languages − 1)
 * Teacher: 65 + 8.99 × max(0, seats − 5) + 4.99 × seats × max(0, languages − 1)
 * Org:     8.99 × seats + 4.99 × seats × max(0, languages − 1)
 */
export function computeMonthlyUSD(plan: Plan, seats: number, languages = 1): number {
  const langs = Math.max(1, Math.floor(languages));
  const includedLangs = plan.includedLanguages ?? 1;
  const extraLangs = Math.max(0, langs - includedLangs);

  let total = 0;
  if (plan.id === 'organization') {
    const n = Math.max(plan.minSeats ?? 0, seats);
    total = (plan.extraSeatPriceUSD ?? 0) * n;
    if (plan.extraLanguagePerSeatUSD) {
      total += extraLangs * n * plan.extraLanguagePerSeatUSD;
    }
    return round2(total);
  }

  const included = plan.includedSeats ?? 0;
  const seatCount = Math.max(included, seats);
  const extraSeats = Math.max(0, seatCount - included);
  total = plan.basePriceUSD + extraSeats * (plan.extraSeatPriceUSD ?? 0);

  if (plan.extraLanguagePerSeatUSD) {
    total += extraLangs * seatCount * plan.extraLanguagePerSeatUSD;
  } else if (plan.extraLearningLanguageUSD) {
    total += extraLangs * plan.extraLearningLanguageUSD;
  }
  return round2(total);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeMonthlyUZSTiyin(plan: Plan, seats: number, languages = 1): number {
  const usd = computeMonthlyUSD(plan, seats, languages);
  return Math.round(usd * USD_TO_UZS_RATE) * 100;
}

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

export function redirectToAtmos(plan: Plan, seats: number, accountId: string, languages = 1) {
  if (!isAtmosConfigured()) {
    throw new Error('ATMOS is not configured. Set VITE_ATMOS_MERCHANT_ID and VITE_ATMOS_STORE_ID.');
  }

  const amountTiyin = computeMonthlyUZSTiyin(plan, seats, languages);
  const langNote = languages > 1 ? `, ${languages} languages` : ', 1 language';

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
    description: `SmartyLang — ${plan.name} (${seats} seat${seats === 1 ? '' : 's'}${langNote})`,
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

/** Per-seat add-on cost in USD for N additional seats (same language count). */
export function computeSeatAddOnUSD(plan: Plan, additionalSeats: number): number {
  return round2(Math.max(0, additionalSeats) * (plan.extraSeatPriceUSD ?? 0));
}

export function computeSeatAddOnUZSTiyin(plan: Plan, additionalSeats: number): number {
  return Math.round(computeSeatAddOnUSD(plan, additionalSeats) * USD_TO_UZS_RATE) * 100;
}

/**
 * Cost to add `extraLanguages` learning languages on an active plan
 * (Teacher/Org: $4.99 × seats × langs; Max: $8.99 × langs).
 */
export function computeLanguageAddOnUSD(plan: Plan, seats: number, extraLanguages: number): number {
  const n = Math.max(0, extraLanguages);
  if (n === 0) return 0;
  if (plan.extraLanguagePerSeatUSD) {
    return round2(n * Math.max(1, seats) * plan.extraLanguagePerSeatUSD);
  }
  if (plan.extraLearningLanguageUSD) {
    return round2(n * plan.extraLearningLanguageUSD);
  }
  return 0;
}

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
    description: `SmartyLang — ${plan.name} +${additionalSeats} seat${additionalSeats === 1 ? '' : 's'}`,
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
