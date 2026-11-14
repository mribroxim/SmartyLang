import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { deriveBites, seededPick } from '../src/lib/bites/deriveBites';
import { biteDone, biteBest, lessonBiteState, recordBiteCompletion, recordBiteStep } from '../src/lib/bites/biteProgress';
import { biteXp, goalXpForMinutes } from '../src/lib/bites/xp';
import { resultPercent } from '../src/lib/bites/result';
import { loadBiteSession, saveBiteSession, clearBiteSession, type StepScore } from '../src/lib/bites/session';
import { LESSON_EXERCISE_TYPES, loadLessonUnlock, mergeLessonUnlocks, updateLessonUnlock, registerMasteredCheck, checkLevelCertificateEligibility } from '../src/lib/lessonProgress';
import { defaultPathFor, parseHash, toHash } from '../src/lib/appRoute';
import { shouldShowChrome } from '../src/lib/chrome';
import { emptyHabit, applyXpToHabit } from '../src/lib/habitEngine';
import { applySrsFromResult, type SRSData } from '../src/lib/srs';
import { setStorageUid } from '../src/lib/userStorage';
import type { ReadingText } from '../src/lib/reading-logic';

const storage = new Map<string, string>();
Object.assign(globalThis, { localStorage: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });

const text = (n = 12): ReadingText => ({
  id: 'lesson/test', title: 'Test lesson', targetSeconds: 120,
  text: 'One sentence. Two sentences. Three sentences. Four sentences.',
  vocabulary: Array.from({ length: n }, (_, i) => ({ word: `word${i}`, definition: `Meaning ${i}` })),
});

beforeEach(() => { storage.clear(); setStorageUid(null); registerMasteredCheck(null); });

test('bite plans cover all 12 exercise types and split words only at nine or more', () => {
  for (const count of [8, 9, 12, 16]) {
    const defs = deriveBites(text(count));
    assert.equal(defs.length, count >= 9 ? 6 : 5);
    assert.deepEqual(new Set(defs.flatMap(d => d.steps.map(s => s.kind)).filter(k => LESSON_EXERCISE_TYPES.includes(k as any))), new Set(LESSON_EXERCISE_TYPES));
    const introduced = defs.flatMap(d => d.steps.filter(s => s.kind === 'vocab-intro').flatMap(s => s.words!));
    assert.equal(introduced.length, count);
    assert.equal(new Set(introduced).size, count);
  }
});

test('word selections are deterministic and do not change the source', () => {
  const source = Array.from({ length: 20 }, (_, i) => i);
  assert.deepEqual(seededPick(source, 5, 'lesson'), seededPick(source, 5, 'lesson'));
  assert.equal(new Set(seededPick(source, 5, 'lesson')).size, 5);
  assert.deepEqual(source, Array.from({ length: 20 }, (_, i) => i));
});

test('legacy finished lessons appear finished on the path', () => {
  const tx = text();
  updateLessonUnlock('en', tx.id, { vocabPassed: true, readingBest: 95, exerciseBest: Object.fromEntries(LESSON_EXERCISE_TYPES.map(k => [k, 80])) });
  const state = lessonBiteState('en', tx);
  assert.equal(state.doneCount, 6);
  assert.equal(state.complete, true);
  assert.equal(state.mastered, true);
});

test('read attempts count as done but keep their real accuracy for mastery', () => {
  const def = deriveBites(text()).find(d => d.kind === 'read')!;
  const unlock = updateLessonUnlock('en', def.passageId, { readingBest: 35 });
  assert.equal(biteDone(unlock, def), true);
  assert.equal(biteBest(unlock, def), 35);
});

test('bite replays keep the best accuracy and count attempts without losing other bites', () => {
  const defs = deriveBites(text());
  const finish = (index: number, accuracy: number) => recordBiteCompletion('en', {
    def: defs[index], accuracy, perfect: accuracy === 100, correctWords: [], mistakes: [], recovered: false, ms: 1000,
  });
  finish(0, 100); finish(1, 90); finish(0, 40);
  const unlock = loadLessonUnlock('en', text().id);
  assert.equal(unlock.bites![0].best, 100);
  assert.equal(unlock.bites![0].attempts, 2);
  assert.equal(unlock.bites![0].perfect, true);
  assert.equal(unlock.bites![1].best, 90);
});

test('completed steps update legacy scores; skips cannot unlock an exercise', () => {
  recordBiteStep('en', text().id, { kind: 'definition-quiz', percent: 90, mistakes: ['word0'], correctWords: ['word1'] });
  recordBiteStep('en', text().id, { kind: 'definition-quiz', percent: 50, mistakes: [], correctWords: [] });
  recordBiteStep('en', text().id, { kind: 'pronunciation', percent: 100, mistakes: [], correctWords: [], skipped: true });
  const unlock = loadLessonUnlock('en', text().id);
  assert.equal(unlock.exerciseBest['definition-quiz'], 90);
  assert.equal(unlock.vocabPassed, true);
  assert.equal(unlock.exerciseBest.pronunciation, undefined);
  assert.deepEqual(unlock.missedWords, ['word0']);
});

test('cloud merge retains local bites, remote bites, best scores and missed words', () => {
  const empty = loadLessonUnlock('en', text().id);
  const local = { ...empty, readingBest: 95, exerciseBest: { cloze: 95 }, missedWords: ['a'], bites: { 0: { best: 100, attempts: 2, completedAt: 200, perfect: true } } };
  const remote = { ...empty, readingBest: 40, exerciseBest: { cloze: 80 }, missedWords: ['b'], bites: { 0: { best: 80, attempts: 1, completedAt: 100 }, 1: { best: 90, attempts: 1, completedAt: 300 } } };
  const merged = mergeLessonUnlocks(local, remote);
  assert.equal(merged.readingBest, 95);
  assert.equal(merged.exerciseBest.cloze, 95);
  assert.equal(merged.bites![0].best, 100);
  assert.equal(merged.bites![0].attempts, 2);
  assert.equal(merged.bites![1].best, 90);
  assert.deepEqual(merged.missedWords, ['a', 'b']);
  assert.deepEqual(local.missedWords, ['a']);
});

test('certificate checks accept a fully mastered bite path and reject an unfinished one', () => {
  const tx = text();
  registerMasteredCheck((lang, id) => id === tx.id && lessonBiteState(lang, tx).mastered);
  const defs = deriveBites(tx);
  const finish = (index: number) => recordBiteCompletion('en', { def: defs[index], accuracy: 90, perfect: false, correctWords: [], mistakes: [], recovered: false, ms: 1000 });
  for (let i = 0; i < defs.length - 1; i++) finish(i);
  assert.equal(checkLevelCertificateEligibility('en', [tx.id]), false);
  finish(defs.length - 1);
  assert.equal(checkLevelCertificateEligibility('en', [tx.id]), true);
});

test('path XP and coins scale with accuracy; daily goals match minutes', () => {
  assert.deepEqual(biteXp('meet', 70, false), { xp: 10, coins: 5 });
  assert.deepEqual(biteXp('meet', 90, false), { xp: 15, coins: 8 });
  assert.deepEqual(biteXp('read', 100, true), { xp: 20, coins: 10 });
  assert.deepEqual([5, 10, 15, 20].map(goalXpForMinutes), [15, 30, 45, 60]);
});

test('applying XP is pure, advances daily and weekly totals, and ticks the streak once', () => {
  const original = emptyHabit();
  const first = applyXpToHabit(original, 20, 45);
  assert.equal(original.dailyGoal.xpEarned, 0);
  assert.equal(first.habit.weeklyXp, 20);
  assert.equal(first.streakTicked, true);
  assert.equal(first.goalJustCompleted, false);
  const second = applyXpToHabit(first.habit, 25, 45);
  assert.equal(first.habit.dailyGoal.xpEarned, 20);
  assert.equal(second.habit.dailyGoal.xpEarned, 45);
  assert.equal(second.habit.weeklyXp, 45);
  assert.equal(second.habit.globalStreak.current, 1);
  assert.equal(second.streakTicked, false);
  assert.equal(second.goalJustCompleted, true);
});

test('SRS reviews duplicates once and keeps missed first attempts due for review', () => {
  const original: Record<'cat' | 'dog', { definition: string; srs?: SRSData }> = { cat: { definition: 'cat' }, dog: { definition: 'dog' } };
  const next = applySrsFromResult(original, { correctWords: ['CAT', 'cat', 'dog', 'dog'], mistakes: ['cat', 'cat'] });
  assert.equal(next.cat.srs!.repetition, 0);
  assert.equal(next.dog.srs!.repetition, 1);
  assert.equal('srs' in original.cat, false);
  assert.equal(applySrsFromResult(original, { correctWords: ['unknown'] }), original);
});

test('resume snapshots preserve completed steps, isolate accounts/languages and reject changed content', () => {
  setStorageUid('learner-a');
  const def = deriveBites(text())[0];
  const scores: StepScore[] = [{ kind: 'vocab-intro', percent: 100, mistakes: [], correctWords: [] }];
  saveBiteSession('en', def, def.steps, 1, scores, 40000);
  assert.equal(loadBiteSession('en', def)?.index, 1);
  assert.equal(loadBiteSession('en', def)?.elapsed, 40000);
  assert.equal(loadBiteSession('ru', def), null);
  assert.equal(loadBiteSession('en', { ...def, steps: [] }), null);
  setStorageUid('learner-b');
  assert.equal(loadBiteSession('en', def), null);
  setStorageUid('learner-a');
  clearBiteSession('en', def);
  assert.equal(loadBiteSession('en', def), null);
});

test('resume supports a retry queue and rejects malformed progress', () => {
  const def = deriveBites(text())[0];
  const scores: StepScore[] = def.steps.map(s => ({ kind: s.kind, percent: 50, mistakes: ['word0'], correctWords: [] }));
  const steps = [...def.steps, { kind: 'definition-quiz' as const, retry: true, words: ['word0'] }];
  saveBiteSession('en', def, steps, 3, scores, 50000);
  assert.equal(loadBiteSession('en', def)?.steps[3].retry, true);
  saveBiteSession('en', def, steps, 100, [], 50000);
  assert.equal(loadBiteSession('en', def), null);
});

test('Learn defaults to Path, encoded bite links round trip, and bites hide chrome', () => {
  assert.deepEqual(defaultPathFor('lessons'), ['path']);
  const route = { tab: 'lessons' as const, path: ['bite', 'en', 'lesson/test', '0'] };
  assert.deepEqual(parseHash(toHash(route)), route);
  assert.deepEqual(parseHash(toHash(route) + '?smartyDate=2026-10-31'), route);
  assert.equal(shouldShowChrome({ signedIn: true, hasProfile: true, needsOnboarding: false, tab: 'lessons', path: ['path'] }), true);
  assert.equal(shouldShowChrome({ signedIn: true, hasProfile: true, needsOnboarding: false, ...route }), false);
  assert.equal(resultPercent({ score: 3, total: 4 }), 75);
});
