/**
 * Smarty preferences: how lively the mascot is, sounds, vibration,
 * seasonal surprises, what to call the learner and the daily goal.
 * Stored per user in localStorage and synced as `smartyPrefs` in progress.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, readScopedJSON, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';

export type Liveliness = 'lively' | 'calm' | 'off';
export type DailyMinutes = 5 | 10 | 15 | 20;

export interface SmartyPrefs {
  v: 1;
  liveliness: Liveliness;
  sound: boolean;
  haptics: boolean;
  seasonal: boolean;
  preferredName?: string;
  dailyMinutes: DailyMinutes;
  /** 'HH:MM' local time for the daily reminder. */
  reminderTime?: string;
  updatedAt: number;
}

const KEY = 'smarty_prefs_v1';
const LEGACY_MASCOT_KEY = 'smarty.mascot';

export const DEFAULT_PREFS: SmartyPrefs = {
  v: 1, liveliness: 'lively', sound: true, haptics: true, seasonal: true, dailyMinutes: 10, updatedAt: 0,
};

function normalize(raw: unknown): SmartyPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SmartyPrefs>;
  const live: Liveliness = r.liveliness === 'calm' || r.liveliness === 'off' ? r.liveliness : 'lively';
  const mins = [5, 10, 15, 20].includes(Number(r.dailyMinutes)) ? (Number(r.dailyMinutes) as DailyMinutes) : 10;
  return {
    v: 1,
    liveliness: live,
    sound: r.sound !== false,
    haptics: r.haptics !== false,
    seasonal: r.seasonal !== false,
    preferredName: typeof r.preferredName === 'string' && r.preferredName.trim() ? r.preferredName.trim().slice(0, 40) : undefined,
    dailyMinutes: mins,
    reminderTime: typeof r.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(r.reminderTime) ? r.reminderTime : undefined,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
  };
}

let loadedFor: string | null | undefined;
let current: SmartyPrefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();

function ensureLoaded() {
  const uid = getStorageUid();
  if (loadedFor === uid) return;
  loadedFor = uid;
  const stored = readScopedJSON<unknown>(KEY, null);
  if (stored) {
    current = normalize(stored);
  } else {
    // Migrate the old on/off mascot switch.
    let legacyOff = false;
    try { legacyOff = localStorage.getItem(LEGACY_MASCOT_KEY) === 'off'; } catch { /* ignore */ }
    current = { ...DEFAULT_PREFS, liveliness: legacyOff ? 'off' : 'lively' };
  }
}

function emit() { listeners.forEach((fn) => fn()); }

export function getPrefs(): SmartyPrefs {
  ensureLoaded();
  return current;
}

export function setPrefs(patch: Partial<Omit<SmartyPrefs, 'v' | 'updatedAt'>>) {
  ensureLoaded();
  current = normalize({ ...current, ...patch, updatedAt: Date.now() });
  writeScopedJSON(KEY, current);
  emit();
}

export function subscribePrefs(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useSmartyPrefs(): SmartyPrefs {
  return useSyncExternalStore(subscribePrefs, getPrefs, getPrefs);
}

registerSyncedStore({
  key: 'smartyPrefs',
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: (remote) => {
    ensureLoaded();
    const r = normalize(remote);
    if (r.updatedAt > current.updatedAt) {
      current = r;
      writeScopedJSON(KEY, current);
      emit();
    }
  },
  subscribe: subscribePrefs,
});
