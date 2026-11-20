/**
 * Smarty's pantry: the learner buys meals with coins (earned in lessons) and
 * feeds them to Smarty for XP; a fed-every-day streak and his level grow with
 * it. Synced in the progress document like hearts.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { FOODS, foodById, rollBoost, type Boost } from './food';

/** Meals waiting in the bowl (more bites keep filling pieces but don't add meals). */
export const MAX_READY_MEALS = 5;
export const MEAL_XP = 25;
/** Coins for one meal in Smarty's bowl. */
export const MEAL_PRICE = 10;

export interface PantryState {
  /** Legacy (fish pieces); always 0 now. */
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
  /** Food in the mini-fridge: id → how many. */
  foods: Record<string, number>;
  /** Active lucky boost from food (XP or coins multiplied for a while). */
  boost: Boost | null;
  /** Today's counters for quests: meals fed and food bought (reset each day). */
  today: { day: string; fed: number; bought: number };
  updatedAt: number;
}

export const emptyPantry = (): PantryState => ({ pieces: 0, meals: 0, eaten: 0, totalPieces: 0, lastFedAt: null, feedStreak: 0, lastFedDay: null, foods: {}, boost: null, today: { day: '', fed: 0, bought: 0 }, updatedAt: 0 });

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const n = (v: unknown, max = Number.MAX_SAFE_INTEGER) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

export function normalizePantry(raw: unknown): PantryState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const foods: Record<string, number> = {};
  if (r.foods && typeof r.foods === 'object') for (const [id, c] of Object.entries(r.foods as Record<string, unknown>)) { const k = n(c, 99); if (k && foodById(id)) foods[id] = k; }
  // Meals left in the old bowl become kibble in the fridge.
  const legacyMeals = n(r.meals, MAX_READY_MEALS);
  if (legacyMeals && !r.foods) foods.kibble = (foods.kibble ?? 0) + legacyMeals;
  const b = r.boost as Partial<Boost> | null | undefined;
  const boost = b && (b.kind === 'xp' || b.kind === 'coins') && typeof b.until === 'number' && typeof b.mult === 'number' ? { kind: b.kind, mult: Math.max(1, Math.min(3, b.mult)), until: b.until } : null;
  const td = (r.today && typeof r.today === 'object' ? r.today : {}) as Record<string, unknown>;
  return {
    pieces: 0,
    meals: 0,
    foods,
    boost,
    today: { day: typeof td.day === 'string' ? td.day : '', fed: n(td.fed), bought: n(td.bought) },
    eaten: n(r.eaten),
    totalPieces: n(r.totalPieces),
    lastFedAt: typeof r.lastFedAt === 'number' ? r.lastFedAt : null,
    feedStreak: n(r.feedStreak),
    lastFedDay: typeof r.lastFedDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastFedDay) ? r.lastFedDay : null,
    updatedAt: n(r.updatedAt),
  };
}

const todayOf = (s: PantryState, now: number) => (s.today.day === dayKey(now) ? s.today : { day: dayKey(now), fed: 0, bought: 0 });

/** Most of one food the fridge holds. */
export const FRIDGE_MAX_EACH = 9;

/** Pure: put one bought food in the fridge. Returns null when that shelf is full or the food is unknown. */
export function stockFood(s: PantryState, id: string, now = Date.now()): PantryState | null {
  if (!foodById(id) || (s.foods[id] ?? 0) >= FRIDGE_MAX_EACH) return null;
  const t = todayOf(s, now);
  return { ...s, foods: { ...s.foods, [id]: (s.foods[id] ?? 0) + 1 }, today: { ...t, bought: t.bought + 1 }, updatedAt: Math.max(now, s.updatedAt + 1) };
}

/** Pure: feed one food from the fridge. Returns null if there is none. */
export function feed(s: PantryState, id: string, now = Date.now()): PantryState | null {
  if (!s.foods[id]) return null;
  const today = dayKey(now);
  const yesterday = dayKey(now - 86_400_000);
  const feedStreak = s.lastFedDay === today ? Math.max(1, s.feedStreak) : s.lastFedDay === yesterday ? s.feedStreak + 1 : 1;
  const foods = { ...s.foods, [id]: s.foods[id] - 1 };
  if (!foods[id]) delete foods[id];
  const t = todayOf(s, now);
  return { ...s, foods, eaten: s.eaten + 1, lastFedAt: now, feedStreak, lastFedDay: today, today: { ...t, fed: t.fed + 1 }, updatedAt: Math.max(now, s.updatedAt + 1) };
}

/** The boost still running, if any. */
export const activeBoost = (s: PantryState, now = Date.now()): Boost | null => (s.boost && s.boost.until > now ? s.boost : null);
/** Today's quest counters. */
export const todayCounts = (s: PantryState, now = Date.now()) => todayOf(s, now);
export const foodCount = (s: PantryState) => Object.values(s.foods).reduce((a, b) => a + b, 0);

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

/** Buy one food with coins (spend returns false when short). */
export function buyFood(id: string, spend: (coins: number) => boolean): boolean {
  ensureLoaded();
  const food = foodById(id);
  const next = food && stockFood(current, id);
  if (!food || !next || !spend(food.price)) return false;
  commit(next);
  return true;
}

/** Feed Smarty one food. Returns its XP and any lucky boost it started, or null if there is none. */
export function feedSmarty(id: string, rand = Math.random): { xp: number; boost: Boost | null } | null {
  ensureLoaded();
  const food = foodById(id);
  const fed = food && feed(current, id);
  if (!food || !fed) return null;
  const now = Date.now();
  // A new boost only replaces one that is not running.
  const rolled = activeBoost(current, now) ? null : rollBoost(food, now, rand);
  commit(rolled ? { ...fed, boost: rolled } : fed);
  return { xp: food.xp, boost: rolled };
}

/** Grant food or a boost as a reward (quests). */
export function giveFood(id: string, count = 1): void {
  ensureLoaded();
  if (!foodById(id)) return;
  commit({ ...current, foods: { ...current.foods, [id]: Math.min(FRIDGE_MAX_EACH, (current.foods[id] ?? 0) + count) }, updatedAt: Math.max(Date.now(), current.updatedAt + 1) });
}
export function giveBoost(boost: Boost): void {
  ensureLoaded();
  commit({ ...current, boost, updatedAt: Math.max(Date.now(), current.updatedAt + 1) });
}
/** Multiplier for XP or coins right now (1 when no boost). */
export function boostMult(kind: Boost['kind']): number {
  const b = activeBoost(getPantry());
  return b && b.kind === kind ? b.mult : 1;
}
export { FOODS };

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
