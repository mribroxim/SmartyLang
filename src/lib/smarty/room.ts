/**
 * Smarty's room: which bed, desk, chair, shelves, window and rug are placed.
 * Every piece is a drawing in public/room/<category>/<name>.webp. The first
 * piece of each kind is free; the rest cost coins. Owned + placed pieces sync
 * in the progress document like hearts and the pantry.
 */
import { useSyncExternalStore } from 'react';
import { getStorageUid, scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';

export * from './roomModel';
import { defaultRoom, normalizeRoom, place, itemById, ITEMS, SLOT_CATEGORY, type RoomState, type Slot } from './roomModel';

// ── store ───────────────────────────────────────────────────────────────

export const ROOM_KEY = 'smarty_room_v2';
let owner: string | null | undefined;
let current = defaultRoom();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function ensureLoaded() {
  const uid = getStorageUid();
  if (owner === uid) return;
  owner = uid;
  try { current = normalizeRoom(JSON.parse(localStorage.getItem(scopedKey(ROOM_KEY)) || 'null')); }
  catch { current = defaultRoom(); }
}
function commit(next: RoomState) { current = next; writeScopedJSON(ROOM_KEY, current); emit(); }

export function getRoom() { ensureLoaded(); return current; }
export function placeItem(slot: Slot, id: string) { ensureLoaded(); commit(place(current, slot, id)); }
/** Buy with coins (spendCoins deducts and returns false if short), then place it. */
export function buyItem(slot: Slot, id: string, spendCoins: (n: number) => boolean): boolean {
  ensureLoaded();
  const item = itemById(id);
  if (!item || item.category !== SLOT_CATEGORY[slot] || current.owned.includes(id)) return false;
  if (item.price > 0 && !spendCoins(item.price)) return false;
  commit(place({ ...current, owned: [...current.owned, id] }, slot, id));
  return true;
}

export function subscribeRoom(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const useRoom = () => useSyncExternalStore(subscribeRoom, getRoom, getRoom);

registerSyncedStore({
  key: 'room2',
  snapshot: () => { ensureLoaded(); return current.updatedAt ? current : undefined; },
  apply: (remote) => {
    ensureLoaded();
    const r = normalizeRoom(remote);
    // Newer layout wins, but never lose something either device bought.
    const owned = Array.from(new Set([...current.owned, ...r.owned]));
    const next = r.updatedAt > current.updatedAt ? { ...r, owned } : { ...current, owned };
    if (JSON.stringify(next) !== JSON.stringify(current)) commit(next);
  },
  subscribe: subscribeRoom,
});

/** Unit milestone gift: the cheapest piece not owned yet (null when everything is owned). */
export function grantGift(): ReturnType<typeof itemById> | null {
  ensureLoaded();
  const gift = ITEMS.filter((i) => !current.owned.includes(i.id)).sort((a, b) => a.price - b.price || a.id.localeCompare(b.id))[0];
  if (!gift) return null;
  commit({ ...current, owned: [...current.owned, gift.id], updatedAt: Math.max(Date.now(), current.updatedAt + 1) });
  return gift;
}
