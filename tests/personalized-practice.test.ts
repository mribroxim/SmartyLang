import { expect, test } from 'vitest';
import { isFreeLearningRoute, canUseBites } from '../src/lib/access';
import { practicePools } from '../src/lib/practicePools';
import { applyPracticeScores, mergePracticeMastery, personalizedSteps, selectPracticeWords, type PracticeMastery } from '../src/lib/personalizedPractice';
import { loadPracticeMastery, recordPracticeScores } from '../src/lib/practiceMastery';
import { setStorageUid } from '../src/lib/userStorage';
import type { ReadingText } from '../src/lib/reading-logic';

test('a free learner can access vocabulary and Practice while Daily Review stays gated', () => {
  const free = { uid: 'free', displayName: 'Free learner', role: 'student', email: 'free@example.test', createdAt: 1 } as const;
  expect(canUseBites(free)).toBe(true);
  expect(isFreeLearningRoute('vocabulary', [])).toBe(true);
  expect(isFreeLearningRoute('practice', [])).toBe(true);
  expect(isFreeLearningRoute('lessons', ['today'])).toBe(false);
  expect(isFreeLearningRoute('exercises', [])).toBe(false);
});

test('review prioritizes overdue words, including learned words with a practice schedule', () => {
  const selected = selectPracticeWords('review', ['future', 'new', 'due', 'learned'], {
    future: { srs: { nextReviewDate: 9000 } }, due: { srs: { nextReviewDate: 100 } },
  }, { learned: { schedule: { at: 1, nextReviewDate: 50, interval: 1, repetition: 1, easeFactor: 2.5 } } }, {}, 'test', 1000, 4);
  expect(selected.slice(0, 2).sort()).toEqual(['due', 'learned']);
  expect(selected.at(-1)).toBe('future');
});

test('personalization keeps urgent mistakes first and rotates equally ranked words by session', () => {
  const pool = Array.from({ length: 30 }, (_, index) => `word${index}`);
  const a = selectPracticeWords('mistakes', pool, {}, {}, { word8: { count: 10 } }, 'one');
  const b = selectPracticeWords('mistakes', pool, {}, {}, { word8: { count: 10 } }, 'two');
  expect(a[0]).toBe('word8'); expect(b[0]).toBe('word8');
  expect(a).not.toEqual(b); expect(new Set(a).size).toBe(a.length);
});

test('resolved historical mistakes stop crowding out current weaknesses', () => {
  const strong = { recognition: { correct: 10, wrong: 0, at: 1 }, recall: { correct: 10, wrong: 0, at: 1 } };
  expect(selectPracticeWords('mistakes', ['old', 'current'], {}, { old: strong }, { old: { count: 30 }, current: { count: 1 } }, 'test')[0]).toBe('current');
});

test('sessions teach recognition before delayed recall and use stronger recall for familiar words', () => {
  const words = ['one', 'two', 'three', 'four', 'five', 'six'];
  const first = personalizedSteps('review', words, {});
  expect(first).toHaveLength(10);
  expect(first.slice(0, 6).every(step => step.kind === 'definition-quiz')).toBe(true);
  expect(first.slice(6).every(step => step.kind === 'word-scramble')).toBe(true);
  expect(first.flatMap(step => step.words!)).toEqual([...words, ...words.slice(0, 4)]);
  const skilled = Object.fromEntries(words.map(word => [word, { recognition: { correct: 4, wrong: 0, at: 1 }, recall: { correct: 4, wrong: 0, at: 1 } }]));
  expect(personalizedSteps('review', words, skilled).some(step => step.kind === 'spelling-practice')).toBe(true);
  expect(personalizedSteps('listening', words, {}).filter(step => step.kind === 'listening-match')).toHaveLength(6);
  expect(personalizedSteps('speaking', words, {}).filter(step => step.kind === 'pronunciation')).toHaveLength(6);
});

test('review schedule includes unsaved learned words, and retries never erase first-attempt mistakes', () => {
  const result = applyPracticeScores({}, 'en', [
    { kind: 'definition-quiz', percent: 100, correctWords: ['apple'], mistakes: [] },
    { kind: 'spelling-practice', percent: 0, correctWords: [], mistakes: ['apple'] },
    { kind: 'definition-quiz', percent: 100, correctWords: ['apple'], mistakes: [], retry: true },
    { kind: 'pronunciation', percent: 0, correctWords: [], mistakes: ['banana'], skipped: true },
  ], 1000);
  expect(result.en.apple.recognition?.correct).toBe(1);
  expect(result.en.apple.recall?.wrong).toBe(1);
  expect(result.en.apple.schedule?.repetition).toBe(0);
  expect(result.en.apple.schedule?.nextReviewDate).toBe(1000 + 86_400_000);
  expect(result.en.banana).toBeUndefined();
  expect(result.fr).toBeUndefined();
});

test('saved and studied lesson words are eligible; unseen lessons and other languages are excluded', () => {
  const lessons = [
    { id: 'learned', vocabulary: [{ word: 'hello', definition: 'hi' }] },
    { id: 'future', vocabulary: [{ word: 'unseen', definition: 'future word' }] },
  ] as ReadingText[];
  const pools = practicePools(lessons, { saved: { definition: 'saved', lang: 'en' }, foreign: { definition: 'foreign', lang: 'fr' } }, {}, new Map(['hello', 'unseen', 'saved', 'foreign'].map(word => [word, word])), {}, 1000, { learned: { vocabPassed: true } } as any, 'en');
  expect(pools.review).toContain('hello'); expect(pools.review).toContain('saved');
  expect(pools.review).not.toContain('unseen'); expect(pools.review).not.toContain('foreign');
});

test('skill state merges newest values, stays bounded and is isolated across accounts and languages', () => {
  const before: PracticeMastery = { en: { apple: { recall: { correct: 3, wrong: 0, at: 100 } } } };
  expect(mergePracticeMastery(before, { en: { apple: { recall: { correct: 0, wrong: 1, at: 10 } } } }).en.apple.recall?.correct).toBe(3);
  const many = { en: Object.fromEntries(Array.from({ length: 400 }, (_, index) => [`word${index}`, { recall: { correct: 1, wrong: 0, at: index } }])) };
  expect(Object.keys(mergePracticeMastery({}, many).en)).toHaveLength(300);
  setStorageUid('practice-one');
  recordPracticeScores('en', [{ kind: 'listening-match', percent: 100, correctWords: ['apple'], mistakes: [] }]);
  expect(loadPracticeMastery().en.apple.listening?.correct).toBe(1);
  setStorageUid('practice-two'); expect(loadPracticeMastery()).toEqual({});
});
