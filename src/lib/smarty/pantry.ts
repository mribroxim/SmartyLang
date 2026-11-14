/**
 * Smarty's pantry: every finished bite earns one piece of a fish (tail → body →
 * fins → head). Four pieces make a meal; the learner feeds meals to Smarty on
 * their profile for bonus XP. Synced in the progress document like hearts.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';

export const FISH_PARTS = ['tail', 'body', 'fins', 'head'] as const;
export type FishPart = (typeof FISH_PARTS)[number];
export const PIECES_PER_MEAL = FISH_PARTS.length;
/** Meals waiting in the bowl (more bites keep filling pieces but don't add meals). */
export const MAX_READY_MEALS = 5;
export const MEAL_XP = 25;
export const MEAL_COINS = 10;
const HOUR = 3_600_000;

export interface PantryState {
  /** Pieces of the fish being built (0–3). */
  pieces: number;
  /** Complete meals ready to feed. */
  meals: number;
  /** Meals Smarty has eaten, ever. */
  eaten: number;
  /** Pieces ever collected. */
  totalPieces: number;
  lastFedAt: number | null;
  /** Days in a row Smarty was fed, and the local day of the last meal (YYYY-MM-DD). */
  feedStreak: number;
  lastFedDay: string | null;
  updatedAt: number;
}

export const emptyPantry = (): PantryState => ({ pieces: 0, meals: 0, eaten: 0, totalPieces: 0, lastFedAt: null, feedStreak: 0, lastFedDay: null, updatedAt: 0 });

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const n = (v: unknown, max = Number.MAX_SAFE_INTEGER) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

export function normalizePantry(raw: unknown): PantryState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    pieces: n(r.pieces, PIECES_PER_MEAL - 1),
    meals: n(r.meals, MAX_READY_MEALS),
    eaten: n(r.eaten),
    totalPieces: n(r.totalPieces),
    lastFedAt: typeof r.lastFedAt === 'number' ? r.lastFedAt : null,
    feedStreak: n(r.feedStreak),
    lastFedDay: typeof r.lastFedDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastFedDay) ? r.lastFedDay : null,
    updatedAt: n(r.updatedAt),
  };
}

/** Pure: add one piece. Returns the new state, which part was added, and whether it completed a meal. */
export function addPiece(s: PantryState, now = Date.now()): { state: PantryState; part: FishPart; mealCompleted: boolean } {
  const part = FISH_PARTS[s.pieces];
  const filled = s.pieces + 1;
  const mealCompleted = filled >= PIECES_PER_MEAL;
  // A full bowl still builds the next fish, but it only becomes a meal once there is room.
  const room = s.meals < MAX_READY_MEALS;
  const state: PantryState = {
    ...s,
    pieces: mealCompleted ? (room ? 0 : PIECES_PER_MEAL - 1) : filled,
    meals: mealCompleted && room ? s.meals + 1 : s.meals,
    totalPieces: s.totalPieces + 1,
    updatedAt: Math.max(now, s.updatedAt + 1),
  };
  return { state, part, mealCompleted: mealCompleted && room };
}

/** Pure: feed one meal. Returns null if the bowl is empty. */
export function feed(s: PantryState, now = Date.now()): PantryState | null {
  if (s.meals <= 0) return null;
  const today = dayKey(now);
  const yesterday = dayKey(now - 86_400_000);
  const feedStreak = s.lastFedDay === today ? Math.max(1, s.feedStreak) : s.lastFedDay === yesterday ? s.feedStreak + 1 : 1;
  return { ...s, meals: s.meals - 1, eaten: s.eaten + 1, lastFedAt: now, feedStreak, lastFedDay: today, updatedAt: Math.max(now, s.updatedAt + 1) };
}

/** Belly 0–100: full right after a meal, empties over ~2 days. */
export function belly(s: PantryState, now = Date.now()): number {
  if (!s.lastFedAt) return 0;
  return Math.max(0, Math.round(100 - ((now - s.lastFedAt) / HOUR) * 2));
}

export type Hunger = 'full' | 'peckish' | 'hungry';
export function hunger(s: PantryState, now = Date.now()): Hunger {
  const b = belly(s, now);
  return b >= 60 ? 'full' : b >= 25 ? 'peckish' : 'hungry';
}

/** Two devices: newer change wins (pieces are earned per bite, so the newer record is a superset in practice). */
export function mergePantry(a: PantryState, b: PantryState): PantryState {
  return b.updatedAt > a.updatedAt ? b : a;
}

// ── store ───────────────────────────────────────────────────────────────

export const PANTRY_KEY = 'smarty_pantry_v1';
let owner: string | null | undefined;
let current = emptyPantry();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function ensureLoaded() {
  const uid = getStorageUid();
  if (owner === uid) return;
  owner = uid;
  try { current = normalizePantry(JSON.parse(localStorage.getItem(scopedKey(PANTRY_KEY)) || 'null')); }
  catch { current = emptyPantry(); }
}

function commit(next: PantryState) {
  current = next;
  writeScopedJSON(PANTRY_KEY, current);
  emit();
}

export function getPantry(): PantryState {
  ensureLoaded();
  return current;
}

/** A bite was finished: add the next fish piece. */
export function earnFishPiece(): { part: FishPart; mealCompleted: boolean; state: PantryState } {
  ensureLoaded();
  const r = addPiece(current);
  commit(r.state);
  return r;
}

/** Feed Smarty one meal. Returns false if there is nothing to feed. */
export function feedSmarty(): boolean {
  ensureLoaded();
  const next = feed(current);
  if (!next) return false;
  commit(next);
  return true;
}

export function subscribePantry(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const usePantry = () => useSyncExternalStore(subscribePantry, getPantry, getPantry);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== scopedKey(PANTRY_KEY) || !e.newValue) return;
    ensureLoaded();
    try { const next = mergePantry(current, normalizePantry(JSON.parse(e.newValue))); if (next !== current) { current = next; emit(); } } catch { /* bad cache */ }
  });
}

registerSyncedStore({
  key: 'pantry',
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: (remote) => {
    ensureLoaded();
    const next = mergePantry(current, normalizePantry(remote));
    if (next !== current) commit(next);
  },
  subscribe: subscribePantry,
});

// ── Smarty's level: he grows as he eats ─────────────────────────────────

export const MEALS_PER_LEVEL = 5;
export const LEVEL_TITLES = ['kitten', 'little', 'clever', 'big', 'chonky', 'legend'] as const;
export type LevelTitle = (typeof LEVEL_TITLES)[number];

/** Level from meals eaten (5 meals per level), with progress to the next. */
export function smartyLevel(eaten: number): { level: number; title: LevelTitle; into: number; need: number; scale: number } {
  const level = Math.floor(eaten / MEALS_PER_LEVEL) + 1;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return { level, title, into: eaten % MEALS_PER_LEVEL, need: MEALS_PER_LEVEL, scale: 1 + Math.min(level - 1, 5) * 0.04 };
}

/** Feeding streak as shown today: it breaks if yesterday was skipped. */
export function liveFeedStreak(s: PantryState, now = Date.now()): number {
  if (!s.lastFedDay) return 0;
  return s.lastFedDay === dayKey(now) || s.lastFedDay === dayKey(now - 86_400_000) ? s.feedStreak : 0;
}
export const fedToday = (s: PantryState, now = Date.now()) => s.lastFedDay === dayKey(now);

/** Room decorations Smarty unlocks as he levels up. */
export const DECOR = [
  { id: 'plant', level: 2 },
  { id: 'frame', level: 3 },
  { id: 'rug', level: 4 },
  { id: 'lamp', level: 5 },
  { id: 'shelf', level: 6 },
] as const;
export type DecorId = (typeof DECOR)[number]['id'];
