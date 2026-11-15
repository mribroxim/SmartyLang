import { mergeHearts, normalizeHearts } from '../src/lib/hearts/hearts.ts';
import { mergeDailyProgress } from '../src/lib/bites/dailyRewards.ts';
import { normalizeProgressDocument, mergeRoomProgress, mergeQuestProgress } from './progressCompatibility.ts';
import { mergePilot } from '../src/lib/unitOnePilot/model.ts';

/** Preserve newer heart actions and daily claims when another device writes progress. */
export function mergeProgressData(previous: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  previous = normalizeProgressDocument(previous);
  incoming = normalizeProgressDocument(incoming);
  const next = { ...previous, ...incoming };
  if (incoming.beginner_unit_one_pilot_v1) next.beginner_unit_one_pilot_v1 = mergePilot(previous.beginner_unit_one_pilot_v1, incoming.beginner_unit_one_pilot_v1);
  if (incoming.room2) next.room2 = mergeRoomProgress(previous.room2, incoming.room2);
  if (incoming.pantry && Number(previous.pantry?.updatedAt || 0) > Number(incoming.pantry.updatedAt || 0)) next.pantry = previous.pantry;
  if (incoming.smarty_quests_v1) next.smarty_quests_v1 = mergeQuestProgress(previous.smarty_quests_v1, incoming.smarty_quests_v1);
  if (incoming.section_jumps_v1) {
    const jumps = { ...(previous.section_jumps_v1 || {}) };
    for (const [lang, idx] of Object.entries(incoming.section_jumps_v1)) if (/^[a-z]{2}$/.test(lang) && Number.isInteger(idx) && Number(idx) >= 0 && Number(idx) < 5) jumps[lang] = Math.max(Number(jumps[lang] ?? -1), Number(idx));
    next.section_jumps_v1 = jumps;
  }
  if (incoming.hearts !== undefined) next.hearts = mergeHearts(normalizeHearts(previous.hearts), normalizeHearts(incoming.hearts));
  if (incoming.todayBites && typeof incoming.todayBites === 'object' && !Array.isArray(incoming.todayBites)) {
    next.todayBites = mergeDailyProgress(previous.todayBites || {}, incoming.todayBites);
  }
  return next;
}
