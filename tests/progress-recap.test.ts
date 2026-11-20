import { describe, expect, it } from 'vitest';
import {
  canDoFromUnits, compareWeeks, deltaPct, heatLevel, heatmap, recapDue, recapWeek, statsForWeek, weekId, weekStart, wordTotals, youCan,
} from '../src/lib/progress/recap';
import { estimateTimepoints, progressToWordIndex, tokenDurationWeight, trailingPause, wordIndexFromTimepoints } from '../src/lib/progress/readAlong';
import type { CompletionRecord } from '../src/lib/completions';

// Wednesday 2026-11-18 12:00 local
const NOW = new Date(2026, 10, 18, 12, 0, 0);
const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const bite = (ts: number, data: Record<string, unknown> = {}): CompletionRecord => ({ id: `${ts}${Math.random()}`, type: 'lesson-bite', timestamp: ts, data });

describe('weeks', () => {
  it('starts on Monday local', () => {
    expect(new Date(weekStart(NOW)).getDay()).toBe(1);
    expect(new Date(weekStart(NOW)).getDate()).toBe(16);
    expect(new Date(weekStart(NOW, 1)).getDate()).toBe(9);
    expect(new Date(weekStart(new Date(2026, 10, 22, 23, 59))).getDate()).toBe(16); // Sunday
  });

  const completions = [
    bite(at(2026, 11, 17), { xp: 20, ms: 120_000, passageId: 'a', correctWords: ['Cat', 'dog'] }),
    bite(at(2026, 11, 18), { xp: 10, ms: 60_000, passageId: 'b', correctWords: ['cat', 'bird'] }),
    bite(at(2026, 11, 10), { xp: 5, ms: 30_000, passageId: 'a', correctWords: ['cat'] }),
    { id: 'x', type: 'dictation', timestamp: at(2026, 11, 12), data: {} } as CompletionRecord,
  ];

  it('computes this vs last week', () => {
    const { thisWeek, lastWeek } = compareWeeks({ completions }, NOW);
    expect(thisWeek).toEqual({ xp: 30, bites: 2, lessons: 2, minutes: 3, words: 2, daysActive: 2 });
    expect(lastWeek.xp).toBe(5);
    expect(lastWeek.daysActive).toBe(2);
  });

  it('counts words first seen in the window only', () => {
    const s = statsForWeek({ completions }, weekStart(NOW));
    // cat was seen last week, so this week's new words are dog and bird
    expect(s.words).toBe(2);
  });

  it('counts newly saved vocab and ignores old saves', () => {
    const s = statsForWeek({ completions: [], vocab: { fresh: { timestamp: at(2026, 11, 17) }, old: { timestamp: at(2026, 10, 1) }, none: {} } }, weekStart(NOW));
    expect(s.words).toBe(1);
  });

  it('recap covers the previous full week', () => {
    const r = recapWeek({ completions }, NOW);
    expect(r.stats.xp).toBe(5);
    expect(new Date(r.from).getDate()).toBe(9);
  });

  it('deltaPct', () => {
    expect(deltaPct(15, 10)).toBe(50);
    expect(deltaPct(5, 10)).toBe(-50);
    expect(deltaPct(5, 0)).toBeNull();
  });
});

describe('totals, heatmap, can-do', () => {
  it('counts learned and mastered words', () => {
    expect(wordTotals({ cat: { stage: 5 }, dog: { stage: 2 }, bird: { stage: 1 } }, { Dog: {}, fish: {} })).toEqual({ learned: 3, mastered: 1 });
  });

  it('builds 5 weeks of 7 days with counts and future flags', () => {
    const h = heatmap([bite(at(2026, 11, 18)), bite(at(2026, 11, 18)), bite(at(2026, 10, 20))], NOW);
    expect(h).toHaveLength(5);
    expect(h.every((r) => r.length === 7)).toBe(true);
    const flat = h.flat();
    expect(flat.find((d) => d.key === '2026-11-18')?.count).toBe(2);
    expect(flat.find((d) => d.key === '2026-10-20')?.count).toBe(1);
    expect(flat.find((d) => d.key === '2026-11-19')?.future).toBe(true);
    expect(h[0][0].key).toBe('2026-10-19');
    expect([0, 1, 3, 6].map(heatLevel)).toEqual([0, 1, 2, 3]);
  });

  it('lists can-do lines for finished lessons only', () => {
    const units = [
      { title: 'Hello & Me', lessons: [{ id: 'b1', languageGoal: 'I can introduce myself.' }, { id: 'b2', languageGoal: 'Say where you are from' }] },
      { title: 'Home', lessons: [{ id: 'b3', languageGoal: 'Name rooms' }] },
    ];
    const out = canDoFromUnits(units, (id) => id === 'b1');
    expect(out).toEqual([{ unitKey: '0', title: 'Hello & Me', items: ['I can introduce myself.'] }]);
    expect(youCan('I can introduce myself.')).toBe('You can introduce yourself');
    expect(youCan('Say where you are from')).toBe('You can say where you are from');
  });
});

describe('weekly recap gate', () => {
  it('shows once per week', () => {
    expect(recapDue(null, NOW)).toBe(true);
    expect(recapDue(weekId(NOW), NOW)).toBe(false);
    expect(recapDue(weekId(NOW), new Date(2026, 10, 23, 9))).toBe(true); // next Monday
    expect(recapDue(weekId(NOW), new Date(2026, 10, 22, 22))).toBe(false); // Sunday, same week
  });
});

describe('read-along timing', () => {
  const words = 'Hello, my name is Anna. I live in London!'.split(' ');

  it('weighs pauses after punctuation and long words', () => {
    expect(trailingPause('Anna.')).toBeGreaterThan(trailingPause('Hello,'));
    expect(trailingPause('Hello')).toBe(0);
    expect(tokenDurationWeight('beautiful', 'en')).toBeGreaterThan(tokenDurationWeight('cat', 'en'));
    expect(tokenDurationWeight('Anna.', 'en')).toBeGreaterThan(tokenDurationWeight('Anna', 'en'));
  });

  it('maps progress to words monotonically from first to last', () => {
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const i = progressToWordIndex(words, p, 'en');
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
    expect(progressToWordIndex(words, 0, 'en')).toBe(0);
    expect(progressToWordIndex(words, 1, 'en')).toBe(words.length - 1);
    expect(progressToWordIndex([], 0.5, 'en')).toBe(0);
  });

  it('estimates timepoints that span the clip and look up by time', () => {
    const tps = estimateTimepoints(words, 6, 'en');
    expect(tps).toHaveLength(words.length);
    expect(tps[0].timeSeconds).toBe(0);
    expect(tps[tps.length - 1].timeSeconds).toBeLessThan(6);
    expect(wordIndexFromTimepoints(tps, 0, words.length)).toBe(0);
    expect(wordIndexFromTimepoints(tps, 5.99, words.length)).toBe(words.length - 1);
    expect(wordIndexFromTimepoints(tps, tps[3].timeSeconds + 0.01, words.length)).toBe(3);
    expect(wordIndexFromTimepoints([], 1, 5)).toBe(0);
  });
});
