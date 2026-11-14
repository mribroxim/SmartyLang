export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000;
export const HEART_REFILL_COST = 120;

export interface HeartsState {
  v: 1;
  count: number;
  /** Time the next heart is earned; null while full. */
  regenAt: number | null;
  grace: number;
  updatedAt: number;
}

export function emptyHearts(): HeartsState {
  return { v: 1, count: MAX_HEARTS, regenAt: null, grace: 0, updatedAt: 0 };
}

export function normalizeHearts(value: unknown): HeartsState {
  const r = (value && typeof value === 'object' ? value : {}) as Partial<HeartsState>;
  const count = Number.isFinite(r.count) ? Math.max(0, Math.min(MAX_HEARTS, Math.floor(r.count!))) : MAX_HEARTS;
  const updatedAt = Number.isFinite(r.updatedAt) ? Math.max(0, r.updatedAt!) : 0;
  return {
    v: 1, count, updatedAt,
    regenAt: count === MAX_HEARTS ? null : Number.isFinite(r.regenAt) && r.regenAt! > 0 ? r.regenAt! : updatedAt + HEART_REGEN_MS,
    grace: Number.isFinite(r.grace) ? Math.max(0, Math.min(3, Math.floor(r.grace!))) : 0,
  };
}

/** Time-derived regeneration does not change updatedAt: real user actions win cloud merges. */
export function regen(state: HeartsState, now = Date.now()): HeartsState {
  if (state.count >= MAX_HEARTS || state.regenAt == null || now < state.regenAt) return state;
  const earned = Math.floor((now - state.regenAt) / HEART_REGEN_MS) + 1;
  const count = Math.min(MAX_HEARTS, state.count + earned);
  return { ...state, count, regenAt: count === MAX_HEARTS ? null : state.regenAt + earned * HEART_REGEN_MS };
}

export function lose(state: HeartsState, now = Date.now()): HeartsState {
  const s = regen(state, now);
  if (s.grace > 0) return { ...s, grace: s.grace - 1, updatedAt: now };
  if (s.count === 0) return s;
  return { ...s, count: s.count - 1, regenAt: s.regenAt ?? now + HEART_REGEN_MS, updatedAt: now };
}

export function gain(state: HeartsState, amount = 1, now = Date.now()): HeartsState {
  const s = regen(state, now);
  const count = Math.min(MAX_HEARTS, s.count + Math.max(0, Math.floor(amount)));
  return { ...s, count, regenAt: count === MAX_HEARTS ? null : s.regenAt, updatedAt: now };
}

export function nextHeartIn(state: HeartsState, now = Date.now()): number | null {
  const s = regen(state, now);
  return s.regenAt == null ? null : Math.max(0, s.regenAt - now);
}

/** Newer action wins. Equal timestamps resolve conservatively and deterministically. */
export function mergeHearts(local: HeartsState, remote: HeartsState): HeartsState {
  if (local.updatedAt !== remote.updatedAt) return local.updatedAt > remote.updatedAt ? local : remote;
  if (local.count !== remote.count) return local.count < remote.count ? local : remote;
  if (local.grace !== remote.grace) return local.grace < remote.grace ? local : remote;
  return (local.regenAt ?? 0) >= (remote.regenAt ?? 0) ? local : remote;
}

/** A question can cost at most one heart, and only on its first graded attempt. */
export function chargeFirstAttempt(answered: Set<string>, questionId: string | undefined, correct: boolean, retry = false): boolean {
  if (!questionId || retry || answered.has(questionId)) return false;
  answered.add(questionId);
  return !correct;
}
