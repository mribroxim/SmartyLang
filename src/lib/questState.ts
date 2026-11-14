import { useSyncExternalStore } from 'react';
import { QUEST_POOL } from './quests';
import { getStorageUid, readScopedJSON, writeScopedJSON } from './userStorage';
import { registerSyncedStore } from './syncedStores';
export const QUEST_KEY = 'smarty_quests_v1';
export type QuestState = { date: string; claimed: string[]; talked: number };
export function normalizeQuests(raw: any): QuestState {
  return { date: typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : '', claimed: [...new Set<string>((Array.isArray(raw?.claimed) ? raw.claimed : []).filter(id => QUEST_POOL.some(q => q.id === id)))], talked: Number.isFinite(raw?.talked) ? Math.max(0, Math.floor(raw.talked)) : 0 };
}
export function mergeQuests(a: QuestState, b: QuestState): QuestState {
  if (a.date !== b.date) return a.date > b.date ? a : b;
  return { date: a.date, claimed: [...new Set([...a.claimed, ...b.claimed])], talked: Math.max(a.talked, b.talked) };
}
let owner: string | null | undefined;
let current = normalizeQuests(null);
const listeners = new Set<() => void>();
export function getQuests(): QuestState {
  if (owner !== getStorageUid()) { owner = getStorageUid(); current = normalizeQuests(readScopedJSON(QUEST_KEY, null)); }
  return current;
}
export function saveQuests(state: QuestState) { current = normalizeQuests(state); writeScopedJSON(QUEST_KEY, current); listeners.forEach(fn => fn()); }
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useQuests = () => useSyncExternalStore(subscribe, getQuests, getQuests);
registerSyncedStore({ key: QUEST_KEY, snapshot: () => getQuests().date ? getQuests() : undefined, apply: raw => { const next = mergeQuests(getQuests(), normalizeQuests(raw)); if (JSON.stringify(next) !== JSON.stringify(current)) saveQuests(next); }, subscribe });
