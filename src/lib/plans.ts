export type PlanId = 'smarty-max' | 'business';

export interface Plan {
  id: PlanId;
  name: string;
  basePriceUSD: number;
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  includedSeats?: number;
  minSeats?: number;
  extraSeatPriceUSD?: number;
  includedLanguages?: number;
  extraLearningLanguageUSD?: number;
  extraLanguagePerSeatUSD?: number;
}

const USD_TO_UZS_RATE = 12500;

export const PLANS: Plan[] = [
  {
    id: 'smarty-max',
    name: 'SmartyLang Max',
    basePriceUSD: 12.99,
    description: 'Full access for one learning language',
    features: [
      '1 learning language included (UI free in all 29)',
      'Extra learning languages: $9 / mo each',
      'Unlimited AI Writing & Speaking checks',
      'All reading & listening passages',
      'Interactive stories & exercises',
      'Spaced-repetition vocabulary system',
      'Real-time reading feedback',
    ],
    badge: 'Most Popular',
    popular: true,
    includedLanguages: 1,
    extraLearningLanguageUSD: 9,
  },
  {
    id: 'business',
    name: 'SmartyLang Business',
    basePriceUSD: 65,
    description: 'Run classes — 5 seats & 1 class language included',
    features: [
      'Everything in SmartyLang Max',
      '5 student seats included',
      '1 learning language for the class',
      'Extra seats: $9 / seat / month',
      'Extra languages: $5 × seats / month',
      'Assign tasks & monitor progress',
      'Class-level analytics dashboard',
    ],
    includedSeats: 5,
    extraSeatPriceUSD: 9,
    includedLanguages: 1,
    extraLanguagePerSeatUSD: 5,
  },
];

/** Map legacy plan ids from older checkouts/profiles. */
export function normalizePlanId(id: string | null | undefined): PlanId | null {
  if (id === 'smarty-max') return 'smarty-max';
  if (id === 'business' || id === 'teacher' || id === 'organization') return 'business';
  return null;
}

export function getPlan(id: PlanId | string): Plan | undefined {
  const normalized = normalizePlanId(id);
  return normalized ? PLANS.find(p => p.id === normalized) : undefined;
}

export function computeMonthlyUSD(plan: Plan, seats: number, languages = 1): number {
  const langs = Math.max(1, Math.floor(languages));
  const includedLangs = plan.includedLanguages ?? 1;
  const extraLangs = Math.max(0, langs - includedLangs);

  const included = plan.includedSeats ?? 0;
  const seatCount = Math.max(included, seats);
  const extraSeats = Math.max(0, seatCount - included);
  let total = plan.basePriceUSD + extraSeats * (plan.extraSeatPriceUSD ?? 0);

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

export function formatUZS(amountInTiyin: number): string {
  const soums = amountInTiyin / 100;
  return new Intl.NumberFormat('en-US').format(soums) + " so'm";
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function computeSeatAddOnUSD(plan: Plan, additionalSeats: number): number {
  return round2(Math.max(0, additionalSeats) * (plan.extraSeatPriceUSD ?? 0));
}

export function computeSeatAddOnUZSTiyin(plan: Plan, additionalSeats: number): number {
  return Math.round(computeSeatAddOnUSD(plan, additionalSeats) * USD_TO_UZS_RATE) * 100;
}

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

export function usdToCents(amountUSD: number): number {
  return Math.round(round2(amountUSD) * 100);
}

export function planDisplayName(planId: PlanId | string): string {
  const plan = getPlan(planId);
  if (plan) return plan.name;
  if (normalizePlanId(planId) === 'smarty-max') return 'SmartyLang Max';
  return 'SmartyLang Business';
}
