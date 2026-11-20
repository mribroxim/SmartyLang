import type { BiteKind } from './types';

/**
 * XP per finished bite: 10 base (+5 at ≥90%, +5 perfect); Today's bite 15.
 * Coins pay for Smarty's food and furniture: every lesson bite pays 5 (+2 at
 * ≥90%, +3 perfect), the first unit exam pass adds 15 (+5
 * perfect), Today's bite and Refine 3, a passed section jump test 25, a
 * Practice session 10 (15 at ≥90%). Heart practice pays nothing.
 */
export function biteXp(kind: BiteKind, accuracy: number, perfect: boolean, unitTest = false): { xp: number; coins: number } {
  if (kind === 'today') return { xp: 15, coins: 3 };
  if (kind === 'section-test') return { xp: 25, coins: accuracy >= 80 ? 25 : 0 };
  if (kind === 'practice') return { xp: accuracy >= 90 ? 20 : 15, coins: accuracy >= 90 ? 15 : 10 };
  if (kind === 'heart-practice') return { xp: 5, coins: 0 };
  let xp = 10;
  if (accuracy >= 90) xp += 5;
  if (perfect) xp += 5;
  if (kind === 'refine') return { xp, coins: 3 };
  const coins = 5 + (accuracy >= 90 ? 2 : 0) + (perfect ? 3 : 0) + (unitTest ? 15 + (perfect ? 5 : 0) : 0);
  return { xp, coins };
}

/** Daily goal in XP for a goal in minutes (≈ one bite per 5 minutes ≈ 15 XP). */
export function goalXpForMinutes(minutes: number): number {
  return Math.max(15, Math.round((minutes / 5) * 15));
}
