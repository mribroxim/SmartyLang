/**
 * House store (`house_v1`): delivered amounts per phase + unit milestones
 * already rewarded. Synced like the room.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { PHASES, LESSONS_PER_ROOM, deliver, liveCounts, normalizeDelivered, mergeDelivered, type Delivered } from './phases';
import type { WorkshopItems } from '../workshop/model';

export const HOUSE_KEY = 'house_v1';
export interface HouseState { delivered: Delivered; milestones: Record<string, number>; updatedAt: number }
const empty = (): HouseState => ({ delivered: {}, milestones: {}, updatedAt: 0 });

export function normalizeHouse(raw: unknown): HouseState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty();
  const r = raw as Record<string, unknown>;
  const milestones: Record<string, number> = {};
  if (r.milestones && typeof r.milestones === 'object') {
    for (const [lang, v] of Object.entries(r.milestones as Record<string, unknown>)) {
      if (/^[a-z]{2}$/.test(lang) && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 50) milestones[lang] = v;
    }
  }
  return { delivered: normalizeDelivered(r.delivered), milestones, updatedAt: typeof r.updatedAt === 'number' && r.updatedAt > 0 ? r.updatedAt : 0 };
}

export function mergeHouse(a: HouseState, b: HouseState): HouseState {
  const milestones = { ...a.milestones };
  for (const [lang, v] of Object.entries(b.milestones)) milestones[lang] = Math.max(milestones[lang] ?? 0, v);
  return { delivered: mergeDelivered(a.delivered, b.delivered), milestones, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

let owner: string | null | undefined;
let current = empty();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function ensureLoaded() {
  const uid = getStorageUid();
  if (owner === uid) return;
  owner = uid;
  try { current = normalizeHouse(JSON.parse(localStorage.getItem(scopedKey(HOUSE_KEY)) || 'null')); }
  catch { current = empty(); }
}
function commit(next: HouseState) { current = { ...next, updatedAt: Date.now() }; writeScopedJSON(HOUSE_KEY, current); emit(); }

export function getHouse(): HouseState { ensureLoaded(); return current; }

/** What one unit has taught and how far the learner got: feeds its room. */
export interface RoomStat { id: string; words: string[]; lessonsDone: number }

/**
 * Deliver the workshop's current counts into every unit's room.
 * Returns how many new unit milestones (finished units) were reached.
 */
export function syncHouse(lang: string, items: WorkshopItems, stats: RoomStat[]): number {
  ensureLoaded();
  let delivered = current.delivered;
  for (const st of stats) {
    const ph = PHASES.find((p) => p.id === st.id);
    if (ph && (st.lessonsDone > 0 || current.delivered[lang]?.[ph.id])) delivered = deliver(delivered, lang, ph, liveCounts(items, st.words, st.lessonsDone), st.words.length);
  }
  const totalUnits = stats.filter((s) => s.lessonsDone >= LESSONS_PER_ROOM).length;
  const claimed = current.milestones[lang];
  // First sync only records the baseline: no flood of rewards for past units.
  const fresh = claimed == null ? 0 : Math.max(0, totalUnits - claimed);
  const milestones = claimed == null || totalUnits > claimed ? { ...current.milestones, [lang]: Math.max(claimed ?? 0, totalUnits) } : current.milestones;
  if (delivered !== current.delivered || milestones !== current.milestones) commit({ ...current, delivered, milestones });
  return fresh;
}

export function subscribeHouse(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const useHouse = () => useSyncExternalStore(subscribeHouse, getHouse, getHouse);

registerSyncedStore({
  key: HOUSE_KEY,
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: (remote) => {
    ensureLoaded();
    const next = mergeHouse(current, normalizeHouse(remote));
    if (JSON.stringify(next) !== JSON.stringify(current)) { current = next; writeScopedJSON(HOUSE_KEY, current); emit(); }
  },
  subscribe: subscribeHouse,
});
