import { useSyncExternalStore } from 'react';
import { readScopedJSON, writeScopedJSON } from './userStorage';
import { registerSyncedStore } from './syncedStores';
import { applyPracticeScores, mergePracticeMastery, type PracticeMastery } from './personalizedPractice';
import type { StepScore } from './bites/session';

const KEY = 'practice_mastery_v1';
const listeners = new Set<() => void>();
let revision = 0;
const emit = () => { revision++; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const loadPracticeMastery = () => readScopedJSON<PracticeMastery>(KEY, {});
export function usePracticeMastery() {
  useSyncExternalStore(subscribe, () => revision, () => revision);
  return loadPracticeMastery();
}
export function recordPracticeScores(lang: string, scores: StepScore[]) {
  const before = loadPracticeMastery();
  const after = applyPracticeScores(before, lang, scores);
  if (JSON.stringify(before) !== JSON.stringify(after)) { writeScopedJSON(KEY, after); emit(); }
}
registerSyncedStore({
  key: KEY,
  snapshot: loadPracticeMastery,
  apply: remote => {
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return;
    const before = loadPracticeMastery(), after = mergePracticeMastery(before, remote as PracticeMastery);
    if (JSON.stringify(before) !== JSON.stringify(after)) { writeScopedJSON(KEY, after); emit(); }
  },
  subscribe,
});
