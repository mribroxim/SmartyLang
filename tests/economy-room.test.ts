import { describe, test, expect } from 'vitest';
import { biteXp } from '../src/lib/bites/xp';
import { ITEMS, defaultRoom, normalizeRoom, place, buyItem, getRoom } from '../src/lib/smarty/room';
import { emptyPantry, addPiece, feed, normalizePantry, MAX_READY_MEALS, liveFeedStreak, dayKey } from '../src/lib/smarty/pantry';
describe('coin sources', () => {
  test('ordinary and daily bites do not mint coins', () => {
    for (const accuracy of [0, 79, 80, 89, 90, 100]) {
      expect(biteXp('meet', accuracy, accuracy === 100).coins).toBe(0);
      expect(biteXp('today', accuracy, accuracy === 100)).toEqual({ xp: 15, coins: 0 });
    }
  });
  test('test and Practice reward boundaries', () => {
    expect(biteXp('meet', 90, false, true)).toEqual({ xp: 15, coins: 15 });
    expect(biteXp('read', 100, true, true)).toEqual({ xp: 20, coins: 20 });
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
test('four pieces make a meal; a full bowl cannot grow past its cap', () => {
  let pantry = emptyPantry();
  for (let i = 0; i < 4; i++) pantry = addPiece(pantry, i + 1).state;
  expect(pantry.meals).toBe(1); expect(pantry.pieces).toBe(0);
  pantry.meals = MAX_READY_MEALS; pantry.pieces = 3;
  const full = addPiece(pantry); expect(full.mealCompleted).toBe(false); expect(full.state.meals).toBe(MAX_READY_MEALS); expect(full.state.pieces).toBe(3);
});
test('feeding streak survives normalization, same-day meals, and consecutive days', () => {
  const now = new Date(2026, 10, 14, 12).getTime();
  const first = feed({ ...emptyPantry(), meals: 3 }, now)!;
  const restored = normalizePantry(first); expect(restored.lastFedDay).toBe(dayKey(now));
  expect(feed(restored, now + 1000)!.feedStreak).toBe(1);
  expect(feed(restored, now + 86_400_000)!.feedStreak).toBe(2);
  expect(liveFeedStreak(restored, now + 2 * 86_400_000)).toBe(0);
  expect(feed(emptyPantry())).toBeNull();
});
