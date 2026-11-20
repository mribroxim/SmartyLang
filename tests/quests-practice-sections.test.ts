import { test, expect } from 'vitest';
import { questsFor, QUEST_POOL } from '../src/lib/quests';
import { practicePools } from '../src/lib/practicePools';
import { SECTIONS, SECTION_PASS, passSectionTest, passedJumpIndex, isSectionOpen } from '../src/lib/bites/sections';
import type { ReadingText } from '../src/lib/reading-logic';
import { assessPath } from '../src/lib/bites/pathAssessments';
import { ASSESSMENT_SCORES } from '../src/lib/bites/assessmentScores';
import { buildLessonUnits } from '../src/lib/lessonUnits';
import type { LessonBiteState } from '../src/lib/bites/biteProgress';
import { lessonToText } from '../src/lib/lessons/v2';
import { writeScopedJSON } from '../src/lib/userStorage';
import { mergeProgressData } from '../server/progressMerge';
test('daily quests are stable, unique, varied and exclude Max tasks for free users', () => {
  const observed = new Set<string>();
  for (let day = 0; day < 120; day++) {
    const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
    const free = questsFor(date, false), max = questsFor(date, true);
    expect(free).toEqual(questsFor(date, false)); expect(free).toHaveLength(3); expect(new Set(free.map(q => q.id)).size).toBe(3); expect(new Set(max.map(q => q.metric)).size).toBe(3);
    expect(free.every(q => !q.max)).toBe(true); max.forEach(q => observed.add(q.id));
  }
  expect(observed.size).toBe(QUEST_POOL.length);
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

test('the path uses an authored unit exam, opens the next unit at 80%, and keeps the best synced score', () => {
  const task = (suffix: string, unit: number, type: 'lesson' | 'review' | 'test' = 'lesson') => lessonToText({
    id: `en.beginner.u${unit}.${suffix}`, section: 'beginner', type, unit, lesson: 1, title: suffix,
    canDo: '', scenario: '', items: [], practice: [], story: { lines: [], questions: [] }, mission: { setup: '', turns: [] }, recycle: [],
  }, `Unit ${unit}`);
  const texts = [task('one', 1), task('two', 1), task('three', 1), task('review', 1, 'review'), task('four', 1), task('exam', 1, 'test'), task('one', 2)];
  const units = buildLessonUnits(texts, 'Beginner');
  const states = new Map(texts.map((text, i) => [text.id, { doneCount: i < 5 ? 1 : 0, complete: i < 5 } as LessonBiteState]));
  const initial = assessPath('en', units, states);
  expect(initial[0].checkpoints[0].lessons.map(lesson => lesson.title)).toEqual(['one', 'two', 'three']);
  expect(initial[0].exam.authored?.v2.type).toBe('test');
  expect(initial[0].exam.ready).toBe(true);
  expect(initial[1].open).toBe(false);
  const id = `en:${initial[0].exam.id}`;
  writeScopedJSON(ASSESSMENT_SCORES, { [id]: 79 });
  expect(assessPath('en', units, states)[1].open).toBe(false);
  const scores = mergeProgressData({ [ASSESSMENT_SCORES]: { [id]: 80 } }, { [ASSESSMENT_SCORES]: { [id]: 70 } })[ASSESSMENT_SCORES];
  expect(scores[id]).toBe(80);
  writeScopedJSON(ASSESSMENT_SCORES, scores);
  expect(assessPath('en', units, states)[1].open).toBe(true);
});
