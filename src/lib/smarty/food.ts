/**
 * Food for Smarty's mini-fridge: bought with coins, fed for XP. Pricier food
 * gives more XP and a better chance of a lucky boost (double XP or double
 * coins for a while). Drawings live in public/room/food/<id>.webp.
 */
export type FoodTier = 1 | 2 | 3;
export interface Food { id: string; tier: FoodTier; price: number; xp: number; src: string }

const TIERS: Record<FoodTier, { price: number; xp: number; luck: number }> = {
  1: { price: 8, xp: 15, luck: 0.12 },
  2: { price: 15, xp: 25, luck: 0.22 },
  3: { price: 25, xp: 40, luck: 0.35 },
};

const LIST: [string, FoodTier][] = [
  ['kibble', 1], ['oats', 1], ['pumpkin', 1], ['sweet-potato', 1], ['cat-grass', 1], ['lentils', 1], ['blueberries', 1], ['seaweed', 1], ['tofu', 1], ['milk', 1],
  ['egg', 2], ['quail-egg', 2], ['yogurt', 2], ['cottage-cheese', 2], ['cheese', 2], ['canned-food', 2], ['pate', 2], ['chicken', 2], ['turkey', 2], ['sardines', 2], ['dried-fish', 2], ['catnip', 2],
  ['white-fish', 3], ['shrimp', 3], ['beef', 3], ['liver', 3], ['hearts', 3], ['tuna', 3], ['fish-oil', 3], ['salmon', 3],
];

export const FOODS: Food[] = LIST.map(([id, tier]) => ({ id, tier, price: TIERS[tier].price, xp: TIERS[tier].xp, src: `/room/food/${id}.webp` }));
export const foodById = (id: string) => FOODS.find((f) => f.id === id);
export const luckFor = (tier: FoodTier) => TIERS[tier].luck;

/** A lucky boost: XP or coins multiplied until `until`. */
export interface Boost { kind: 'xp' | 'coins'; mult: number; until: number }
export const BOOST_MINUTES = 15;

/** Pure: roll a boost after eating (rand injectable for tests). */
export function rollBoost(food: Food, now = Date.now(), rand = Math.random): Boost | null {
  if (rand() >= luckFor(food.tier)) return null;
  const kind = rand() < 0.5 ? 'xp' : 'coins';
  const mult = food.tier === 3 && rand() < 0.3 ? 3 : 2;
  return { kind, mult, until: now + BOOST_MINUTES * 60_000 };
}
