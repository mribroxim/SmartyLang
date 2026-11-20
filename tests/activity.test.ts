import { describe, expect, it } from 'vitest';
import { buildTimeline, countByFilter, filterTimeline, groupByDay, kindOfCompletion, missedWords, summarize } from '../src/lib/activity/model';
import { recommendWords, type ClassInsights } from '../src/lib/activity/recommend';

const day = 86_400_000;
const T = new Date(2026, 5, 10, 12).getTime();

describe('activity model', () => {
  const rows = [
    { id: 'a', type: 'lesson-bite', timestamp: T, title: 'Bite 1', accuracy: 80, data: { xp: 10, ms: 60000, mistakes: ['cat', 'dog'], correctWords: ['sun'] } },
    { id: 'b', type: 'speaking', timestamp: T - 1000, title: 'Talk' },
    { id: 'c', type: 'exercise', timestamp: T - day, data: { exerciseType: 'memory-match', xp: 5 } },
    { id: 'd', type: 'exercise', timestamp: T - day - 10, data: { exerciseType: 'flashcards' } },
    { id: 'a', type: 'lesson-bite', timestamp: T },
  ];
  it('classifies kinds', () => {
    expect(kindOfCompletion('lesson-bite')).toBe('lessons');
    expect(kindOfCompletion('shadowing')).toBe('speaking');
    expect(kindOfCompletion('exercise', { exerciseType: 'memory-match' })).toBe('games');
    expect(kindOfCompletion('exercise', { exerciseType: 'flashcards' })).toBe('practice');
  });
  it('dedupes, sorts, filters and counts', () => {
    const items = buildTimeline(rows);
    expect(items).toHaveLength(4);
    expect(items[0].id).toBe('a');
    expect(countByFilter(items)).toMatchObject({ all: 4, lessons: 1, speaking: 1, games: 1, practice: 1 });
    expect(filterTimeline(items, 'games').map((i) => i.id)).toEqual(['c']);
  });
  it('adds only activity events completions do not cover', () => {
    const items = buildTimeline([], [{ type: 'vocabulary_add', timestamp: T, details: [{ word: 'apple' }] }, { type: 'exercise', timestamp: T }]);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('apple');
  });
  it('groups by day and summarizes', () => {
    const items = buildTimeline(rows);
    const groups = groupByDay(items);
    expect(groups.map((g) => g.items.length)).toEqual([2, 2]);
    expect(groups[0].xp).toBe(10);
    const s = summarize(items);
    expect(s).toMatchObject({ sessions: 4, xp: 15, minutes: 1, activeDays: 2, mistakes: 2, avgAccuracy: 80 });
  });
  it('merges missed words with the problem list', () => {
    const out = missedWords(buildTimeline(rows), [{ word: 'Cat', count: 4, lastMissed: 5 }, { word: 'egg', count: 2, lastMissed: 9 }]);
    expect(out[0]).toMatchObject({ word: 'cat', count: 4 });
    expect(out.map((m) => m.word)).toContain('egg');
  });
});

describe('recommendWords', () => {
  const insights: ClassInsights = {
    students: [{ uid: 'u1', name: 'A' }, { uid: 'u2', name: 'B' }, { uid: 'u3', name: 'C' }, { uid: 'u4', name: 'D' }],
    completions: [
      { uid: 'u1', timestamp: 1, mistakes: ['Apple', 'pear'], correct: ['sun'] },
      { uid: 'u2', timestamp: 1, mistakes: ['apple'], correct: [] },
      { uid: 'u3', timestamp: 1, mistakes: ['apple'], correct: ['sun'] },
      { uid: 'zz', timestamp: 1, mistakes: ['outsider'], correct: [] },
    ],
    vocab: [{ uid: 'u1', word: 'plum', nextReviewDate: 5, lapses: 0 }, { uid: 'u2', word: 'plum', nextReviewDate: null, lapses: 2 }, { uid: 'u3', word: 'fig', nextReviewDate: 9e12, lapses: 0 }],
    problem: [{ uid: 'u1', word: 'pear', count: 3, lastMissed: 1 }],
  };
  it('ranks most missed words first with reasons', () => {
    const recs = recommendWords(insights, { now: 100, levelWords: ['sun', 'table', 'chair', 'fig'] });
    expect(recs[0].word).toBe('apple');
    expect(recs[0].reasons[0]).toMatchObject({ kind: 'missed', students: 3, total: 4, times: 3 });
    expect(recs.find((r) => r.word === 'pear')?.reasons[0]).toMatchObject({ times: 3 });
    expect(recs.find((r) => r.word === 'plum')?.primary).toBe('due');
    expect(recs.find((r) => r.word === 'outsider')).toBeUndefined();
  });
  it('suggests unmet level words but not ones most students know', () => {
    const words = recommendWords(insights, { now: 100, levelWords: ['sun', 'table', 'fig'] }).filter((r) => r.primary === 'new').map((r) => r.word);
    expect(words).toContain('table');
    expect(words).not.toContain('sun');
  });
  it('works for a single student', () => {
    const recs = recommendWords(insights, { now: 100, studentUid: 'u2' });
    expect(recs.map((r) => r.word).sort()).toEqual(['apple', 'plum']);
    expect(recs.find((r) => r.word === 'apple')?.reasons[0].total).toBe(1);
  });
  it('returns nothing for an empty class', () => {
    expect(recommendWords({ students: [], completions: [], vocab: [], problem: [] })).toEqual([]);
  });
});
