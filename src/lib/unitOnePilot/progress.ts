import { useSyncExternalStore } from 'react';
import { readScopedJSON, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { mergePilot, normalizePilot, type PilotProgress } from './model';
export const PILOT_PROGRESS_KEY = 'beginner_unit_one_pilot_v1';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const snapshot = () => JSON.stringify(normalizePilot(readScopedJSON(PILOT_PROGRESS_KEY, {})));
export function usePilotProgress(): PilotProgress { return JSON.parse(useSyncExternalStore(subscribe, snapshot, () => '{}')); }
export function completePilot(id: string, best: number, missed: string[]) {
  const next = mergePilot(readScopedJSON(PILOT_PROGRESS_KEY, {}), { [id]: { completedAt: Date.now(), best, missed } });
  writeScopedJSON(PILOT_PROGRESS_KEY, next); emit();
}
registerSyncedStore({ key: PILOT_PROGRESS_KEY, snapshot: () => normalizePilot(readScopedJSON(PILOT_PROGRESS_KEY, {})), apply: raw => { writeScopedJSON(PILOT_PROGRESS_KEY, mergePilot(readScopedJSON(PILOT_PROGRESS_KEY, {}), raw)); emit(); }, subscribe });
