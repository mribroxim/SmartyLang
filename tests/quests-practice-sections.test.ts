import { test, expect } from 'vitest';
import { questsFor } from '../src/lib/quests';
import { practicePools } from '../src/lib/practicePools';
import { SECTIONS, SECTION_PASS, passSectionTest, passedJumpIndex, isSectionOpen } from '../src/lib/bites/sections';
import type { ReadingText } from '../src/lib/reading-logic';
test('daily quests are stable, unique, varied and exclude Max tasks for free users', () => {
  const observed = new Set<string>();
  for (let day = 1; day <= 28; day++) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    const free = questsFor(date, false), max = questsFor(date, true);
    expect(free).toEqual(questsFor(date, false)); expect(free).toHaveLength(3); expect(new Set(free.map(q => q.id)).size).toBe(3);
    expect(free.every(q => !q.max)).toBe(true); max.forEach(q => observed.add(q.id));
  }
  expect(observed.size).toBe(8);
});
test('Practice prioritizes mistakes and due reviews, excludes unavailable words and phrases from spelling', () => {
  const saved = { APPLE: { srs: { nextReviewDate: 10 }, timestamp: 1 }, banana: { srs: { nextReviewDate: 100 }, timestamp: 2 }, 'good day': { timestamp: 3 }, unknown: {} };
  const catalog = new Map(['apple', 'banana', 'good day'].map(word => [word, {}]));
  const pools = practicePools([{ id: 'lesson' } as ReadingText], saved, { banana: { count: 5 }, missing: { count: 9 } }, catalog, { lesson: ['APPLE', 'banana'] }, 50);
  expect(pools.mistakes).toEqual(['banana', 'apple']); expect(pools.review[0]).toBe('apple');
  expect(pools.listening).toContain('good day'); expect(pools.spell).not.toContain('good day'); expect(pools.listening).not.toContain('unknown');
  expect(practicePools([], {}, {}, new Map(), {}).mistakes).toEqual([]);
});
test('section unlocks are monotonic and respect placement and jump tests', () => {
  const levels = Object.fromEntries(SECTIONS.map(level => [level, []])) as any;
  expect(SECTION_PASS).toBe(80); expect(isSectionOpen('en', 'Beginner', levels)).toBe(true);
  expect(isSectionOpen('en', 'Elementary', levels)).toBe(false);
  expect(isSectionOpen('en', 'Intermediate', levels, 'Intermediate')).toBe(true);
  passSectionTest('en', 'Intermediate'); passSectionTest('en', 'Elementary');
  expect(passedJumpIndex('en')).toBe(3); expect(passedJumpIndex('fr')).toBe(-1);
  expect(isSectionOpen('en', 'Advanced', levels)).toBe(false);
});
