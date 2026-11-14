import type { BiteKind } from './types';

/**
 * XP per finished bite: 10 base (+5 at ≥90%, +5 perfect); Today's bite 15.
 * Coins come only from tests and feeding Smarty: a unit test (the last lesson
 * of a unit) pays 15 (+5 perfect), a passed section jump test 25, a Practice
 * session 10 (15 at ≥90%).
 */
export function biteXp(kind: BiteKind, accuracy: number, perfect: boolean, unitTest = false): { xp: number; coins: number } {
  if (kind === 'today') return { xp: 15, coins: 0 };
  if (kind === 'section-test') return { xp: 25, coins: accuracy >= 80 ? 25 : 0 };
  if (kind === 'practice') return { xp: accuracy >= 90 ? 20 : 15, coins: accuracy >= 90 ? 15 : 10 };
  let xp = kind === 'heart-practice' ? 5 : 10;
  if (kind !== 'heart-practice') {
    if (accuracy >= 90) xp += 5;
    if (perfect) xp += 5;
  }
  return { xp, coins: unitTest ? 15 + (perfect ? 5 : 0) : 0 };
}

/** Daily goal in XP for a goal in minutes (≈ one bite per 5 minutes ≈ 15 XP). */
export function goalXpForMinutes(minutes: number): number {
  return Math.max(15, Math.round((minutes / 5) * 15));
}
