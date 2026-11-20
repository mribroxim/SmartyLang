import { describe, test, expect } from 'vitest';
import { biteXp } from '../src/lib/bites/xp';
import { ITEMS, defaultRoom, normalizeRoom, place, buyItem, getRoom } from '../src/lib/smarty/room';
import { emptyPantry, stockFood, feed, normalizePantry, FRIDGE_MAX_EACH, liveFeedStreak, dayKey, activeBoost } from '../src/lib/smarty/pantry';
import { FOODS, foodById, rollBoost, BOOST_MINUTES } from '../src/lib/smarty/food';
describe('coin sources', () => {
  test('lesson bites pay 5–10 coins; daily and refine pay 3; heart practice pays nothing', () => {
    expect(biteXp('learn', 70, false).coins).toBe(5);
    expect(biteXp('learn', 90, false).coins).toBe(7);
    expect(biteXp('mission', 100, true).coins).toBe(10);
    for (const accuracy of [0, 79, 100]) expect(biteXp('today', accuracy, accuracy === 100)).toEqual({ xp: 15, coins: 3 });
    expect(biteXp('refine', 100, true).coins).toBe(3);
  });
  test('test and Practice reward boundaries', () => {
    expect(biteXp('meet', 90, false, true)).toEqual({ xp: 15, coins: 22 });
    expect(biteXp('read', 100, true, true)).toEqual({ xp: 20, coins: 30 });
    expect(biteXp('section-test', 79, false).coins).toBe(0);
    expect(biteXp('section-test', 80, false).coins).toBe(25);
    expect(biteXp('practice', 89, false)).toEqual({ xp: 15, coins: 10 });
    expect(biteXp('practice', 90, false)).toEqual({ xp: 20, coins: 15 });
    expect(biteXp('heart-practice', 100, true).coins).toBe(0);
  });
});
test('room drops invalid/unowned/wrong-category placements and nonfinite timestamps', () => {
  const room = normalizeRoom({ owned: ['bed.paw', 'bad', 'bed.paw'], bed: 'bed.paw', desk: 'bed.paw', updatedAt: Infinity });
  expect(room.bed).toBe('bed.paw'); expect(room.desk).toBe(defaultRoom().desk); expect(room.updatedAt).toBe(0);
  expect(room.owned.filter(id => id === 'bed.paw')).toHaveLength(1);
  expect(place(defaultRoom(), 'bed', 'bed.paw')).toEqual(defaultRoom());
});
test('buyItem charges once, refuses insufficient funds, and places only in matching slots', () => {
  let balance = 100, calls = 0;
  const spend = (price: number) => { calls++; if (balance < price) return false; balance -= price; return true; };
  expect(buyItem('desk', 'bed.paw', spend)).toBe(false);
  expect(buyItem('bed', 'bed.paw', () => false)).toBe(false);
  expect(buyItem('bed', 'bed.paw', spend)).toBe(true);
  expect(getRoom().bed).toBe('bed.paw'); expect(balance).toBe(70);
  expect(buyItem('bed', 'bed.paw', spend)).toBe(false); expect(calls).toBe(1);
  expect(ITEMS.every(item => item.price >= 0)).toBe(true);
});
test('bought food fills the fridge up to its cap; old bowl meals become kibble', () => {
  const one = stockFood(emptyPantry(), 'salmon', 1)!;
  expect(one.foods.salmon).toBe(1);
  expect(one.today.bought).toBe(1);
  expect(stockFood({ ...emptyPantry(), foods: { salmon: FRIDGE_MAX_EACH } }, 'salmon')).toBeNull();
  expect(stockFood(emptyPantry(), 'ghost')).toBeNull();
  expect(normalizePantry({ pieces: 3, meals: 2 }).foods.kibble).toBe(2);
});
test('feeding streak survives normalization, same-day meals, and consecutive days', () => {
  const now = new Date(2026, 10, 14, 12).getTime();
  const first = feed({ ...emptyPantry(), foods: { kibble: 3 } }, 'kibble', now)!;
  expect(first.foods.kibble).toBe(2);
  const restored = normalizePantry(first); expect(restored.lastFedDay).toBe(dayKey(now));
  expect(feed(restored, 'kibble', now + 1000)!.feedStreak).toBe(1);
  expect(feed(restored, 'kibble', now + 86_400_000)!.feedStreak).toBe(2);
  expect(liveFeedStreak(restored, now + 2 * 86_400_000)).toBe(0);
  expect(feed(emptyPantry(), 'kibble')).toBeNull();
});
test('lucky food boosts: pricier food is luckier, and boosts expire', () => {
  const salmon = foodById('salmon')!; const kibble = foodById('kibble')!;
  expect(rollBoost(kibble, 0, () => 0.5)).toBeNull();
  const b = rollBoost(salmon, 0, () => 0.1)!;
  expect(b.kind).toBe('xp'); expect(b.mult).toBe(3); expect(b.until).toBe(BOOST_MINUTES * 60_000);
  expect(activeBoost({ ...emptyPantry(), boost: b }, b.until - 1)).toEqual(b);
  expect(activeBoost({ ...emptyPantry(), boost: b }, b.until)).toBeNull();
  expect(FOODS).toHaveLength(30);
});
