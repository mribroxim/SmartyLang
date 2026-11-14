export type Category = 'bed' | 'desk' | 'chair' | 'shelf' | 'window' | 'rug';
/** Places in the room. Two shelves share the shelf catalogue. */
export type Slot = 'bed' | 'desk' | 'chair' | 'shelf1' | 'shelf2' | 'window' | 'rug';
export const SLOT_CATEGORY: Record<Slot, Category> = { bed: 'bed', desk: 'desk', chair: 'chair', shelf1: 'shelf', shelf2: 'shelf', window: 'window', rug: 'rug' };

const NAMES: Record<Category, string[]> = {
  bed: ['cat-ears', 'paw', 'house', 'bookcase', 'cloud-moon', 'music', 'cloud', 'neon', 'canopy', 'cat-cave'],
  desk: ['notebook', 'study', 'coffee', 'laptop', 'gamer', 'night', 'pegboard', 'cozy', 'artist', 'lucky'],
  chair: ['black', 'paw', 'white', 'stripe', 'gingham', 'plaid', 'fluffy', 'cloud', 'stitch', 'paw-ears'],
  shelf: ['books-camera', 'trailing', 'lucky-cat', 'globe', 'clock', 'moon-cat', 'lantern', 'photo', 'sleepy', 'butterfly',
    'moonlamp', 'fairy', 'atlas', 'snapshot', 'dreamy', 'vines', 'starlight', 'explorer', 'hexagon', 'cloud'],
  window: ['curtain', 'stars', 'shutters', 'blinds', 'nook', 'arch-vine', 'blind-rain', 'storm', 'vine', 'fairy-lights'],
  rug: ['fluffy', 'cloud', 'paw', 'black-paw', 'moon', 'saturn', 'book', 'cat-face', 'checker', 'checker-wave'],
};

export interface RoomItem { id: string; category: Category; name: string; price: number; src: string }

/** Price climbs gently through each catalogue; the first of each kind is free. */
const priceFor = (i: number) => (i === 0 ? 0 : 30 + 10 * ((i - 1) % 6));

export const ITEMS: RoomItem[] = (Object.keys(NAMES) as Category[]).flatMap((category) =>
  NAMES[category].map((name, i) => ({ id: `${category}.${name}`, category, name, price: priceFor(i), src: `/room/${category}/${name}.webp` })));

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
export const itemsFor = (category: Category) => ITEMS.filter((i) => i.category === category);

export type RoomState = Record<Slot, string> & { owned: string[]; updatedAt: number };

const FREE = ITEMS.filter((i) => i.price === 0).map((i) => i.id);
const DEFAULTS: Record<Slot, string> = {
  bed: 'bed.cat-ears', desk: 'desk.notebook', chair: 'chair.black', shelf1: 'shelf.trailing', shelf2: 'shelf.books-camera',
  window: 'window.curtain', rug: 'rug.fluffy',
};
const SLOTS = Object.keys(DEFAULTS) as Slot[];
// The second shelf starts as a free gift too, so the room isn't bare.
const STARTER = Array.from(new Set([...FREE, ...Object.values(DEFAULTS)]));
export const defaultRoom = (): RoomState => ({ ...DEFAULTS, owned: [...STARTER], updatedAt: 0 });

export function normalizeRoom(raw: unknown): RoomState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const owned = Array.from(new Set([...STARTER, ...(Array.isArray(r.owned) ? r.owned.filter((x): x is string => typeof x === 'string' && !!itemById(x)) : [])]));
  const out = { owned, updatedAt: typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt) ? Math.max(0, r.updatedAt) : 0 } as RoomState;
  for (const slot of SLOTS) {
    const v = r[slot];
    out[slot] = typeof v === 'string' && itemById(v)?.category === SLOT_CATEGORY[slot] && owned.includes(v) ? v : DEFAULTS[slot];
  }
  return out;
}

/** Pure: place an owned piece in a slot. */
export function place(s: RoomState, slot: Slot, id: string, now = Date.now()): RoomState {
  const item = itemById(id);
  if (!item || item.category !== SLOT_CATEGORY[slot] || !s.owned.includes(id)) return s;
  return { ...s, [slot]: id, updatedAt: Math.max(now, s.updatedAt + 1) };
}

