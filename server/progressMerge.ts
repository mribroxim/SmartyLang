import { mergeHearts, normalizeHearts } from '../src/lib/hearts/hearts.ts';
import { mergeDailyProgress } from '../src/lib/bites/dailyRewards.ts';

/** Preserve newer heart actions and daily claims when another device writes progress. */
export function mergeProgressData(previous: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const next = { ...previous, ...incoming };
  if (incoming.hearts !== undefined) next.hearts = mergeHearts(normalizeHearts(previous.hearts), normalizeHearts(incoming.hearts));
  if (incoming.todayBites && typeof incoming.todayBites === 'object' && !Array.isArray(incoming.todayBites)) {
    next.todayBites = mergeDailyProgress(previous.todayBites || {}, incoming.todayBites);
  }
  return next;
}
