import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { emptyHearts, gain, lose, mergeHearts, normalizeHearts, regen, MAX_HEARTS, HEART_REFILL_COST, type HeartsState } from './hearts';
import { emitSmarty } from '../smarty/bus';
import { playSound } from '../audio';

export const HEARTS_KEY = 'smarty_hearts_v1';
let owner: string | null | undefined;
let current = emptyHearts();
let cached = current;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

function ensureLoaded() {
  const uid = getStorageUid();
  if (owner === uid) return;
  owner = uid;
  try { current = normalizeHearts(JSON.parse(localStorage.getItem(scopedKey(HEARTS_KEY)) || 'null')); }
  catch { current = emptyHearts(); }
  cached = current;
}

function commit(next: HeartsState) {
  current = next;
  writeScopedJSON(HEARTS_KEY, current);
  emit();
}

export function initializeHearts(brandNew: boolean) {
  ensureLoaded();
  if (!current.updatedAt) commit({ ...current, grace: brandNew ? 3 : 0, updatedAt: Date.now() });
}

export function getHearts(): HeartsState {
  ensureLoaded();
  const next = regen(current);
  if (cached.count !== next.count || cached.grace !== next.grace || cached.updatedAt !== next.updatedAt || cached.regenAt !== next.regenAt) cached = next;
  return cached;
}

export function loseHeart(): boolean {
  ensureLoaded();
  const before = getHearts();
  if (before.count === 0) return false;
  const next = lose(current, Math.max(Date.now(), current.updatedAt + 1));
  commit(next);
  if (next.count < before.count) {
    emitSmarty({ type: 'hearts.lost', left: next.count });
    playSound('heart-lost');
    if (!next.count) emitSmarty({ type: 'hearts.empty' });
  }
  return next.count > 0;
}

export function gainHearts(amount = 1): number {
  ensureLoaded();
  const before = getHearts().count;
  const next = gain(current, amount, Math.max(Date.now(), current.updatedAt + 1));
  commit(next);
  const earned = next.count - before;
  if (earned > 0) { emitSmarty({ type: 'hearts.refill', n: earned }); playSound('heart-refill'); }
  return earned;
}

export function purchaseHeartRefill(spendCoins: (amount: number) => boolean): boolean {
  if (getHearts().count >= MAX_HEARTS || !spendCoins(HEART_REFILL_COST)) return false;
  gainHearts(MAX_HEARTS);
  return true;
}

export function subscribeHearts(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const useHearts = () => useSyncExternalStore(subscribeHearts, getHearts, getHearts);

if (typeof window !== 'undefined') {
  window.setInterval(emit, 30_000);
  window.addEventListener('focus', emit);
  window.addEventListener('storage', e => {
    if (e.key !== scopedKey(HEARTS_KEY) || !e.newValue) return;
    ensureLoaded();
    try { current = mergeHearts(current, normalizeHearts(JSON.parse(e.newValue))); emit(); } catch { /* Invalid cache. */ }
  });
}

registerSyncedStore({
  key: 'hearts',
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: remote => {
    ensureLoaded();
    const next = mergeHearts(current, normalizeHearts(remote));
    if (next !== current) commit(next);
  },
  subscribe: subscribeHearts,
});
