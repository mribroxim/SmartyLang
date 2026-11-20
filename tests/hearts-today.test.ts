import { test, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { emptyHearts, regen, lose, gain, nextHeartIn, mergeHearts, chargeFirstAttempt, HEART_REGEN_MS, MAX_HEARTS } from '../src/lib/hearts/hearts';
import { initializeHearts, getHearts, loseHeart, purchaseHeartRefill } from '../src/lib/hearts/heartsStore';
import { mergeProgressData } from '../server/progressMerge';
import { deriveDailySession, deriveHeartPractice, getDailySession, completeDailySession, dailyCompletion, mergeDailyProgress, type ReviewVocab } from '../src/lib/bites/dailySession';
import { loadBiteSession, saveBiteSession, clearBiteSession } from '../src/lib/bites/session';
import { deriveBites } from '../src/lib/bites/deriveBites';
import { setStorageUid } from '../src/lib/userStorage';
import { applySyncedStores, syncedSnapshot } from '../src/lib/syncedStores';
import { isFreeLearningRoute, canUseBites, hasUnlimitedHearts, isPreviewMode } from '../src/lib/access';
import { isStreakAtRisk, reminderDue, ensureLocalReminder, localReminders, markLocalReminderRead } from '../src/lib/smarty/reminders';
import { biteXp } from '../src/lib/bites/xp';
import { applySrsFromResult } from '../src/lib/srs';
import type { ReadingText, Level } from '../src/lib/reading-logic';

const storage = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
let user = 0;
beforeEach(() => { storage.clear(); setStorageUid(`test-hearts-today-${++user}`); });
const start = 1_800_000_000_000;
const tx = (prefix: string, count = 12): ReadingText => ({ id: prefix, title: prefix, text: 'A short lesson.', targetSeconds: 60, vocabulary: Array.from({ length: count }, (_, i) => ({ word: `${prefix}${i}`, definition: `${prefix} definition ${i}` })) });
const levels = (texts: ReadingText[]): Record<Level, ReadingText[]> => ({ Beginner: texts, Elementary: [], 'Pre-Intermediate': [], Intermediate: [], Advanced: [] });

test('hearts regenerate exactly on each four-hour boundary and cap at five', () => {
  let state = { ...emptyHearts(), updatedAt: start };
  state = lose(state, start);
  state = lose(state, start + 1000);
  assert.equal(state.count, 3);
  assert.equal(state.regenAt, start + HEART_REGEN_MS);
  assert.equal(regen(state, start + HEART_REGEN_MS - 1).count, 3);
  assert.equal(regen(state, start + HEART_REGEN_MS).count, 4);
  assert.equal(regen(state, start + 2 * HEART_REGEN_MS).count, 5);
  assert.equal(regen(state, start + 100 * HEART_REGEN_MS).regenAt, null);
  assert.equal(nextHeartIn(state, start + 1000), HEART_REGEN_MS - 1000);
  assert.equal(regen(state, start + HEART_REGEN_MS).updatedAt, state.updatedAt);
});

test('three grace mistakes are free; the fourth starts heart regeneration', () => {
  let state = { ...emptyHearts(), grace: 3, updatedAt: start };
  for (let i = 0; i < 3; i++) state = lose(state, start + i);
  assert.equal(state.count, MAX_HEARTS);
  assert.equal(state.grace, 0);
  assert.equal(state.regenAt, null);
  state = lose(state, start + 3);
  assert.equal(state.count, 4);
  assert.equal(state.regenAt, start + 3 + HEART_REGEN_MS);
});

test('practice gains preserve a pending refill timer and full refills clear it', () => {
  const state = { ...emptyHearts(), count: 0, regenAt: start + HEART_REGEN_MS, updatedAt: start };
  assert.equal(gain(state, 1, start + 100).count, 1);
  assert.equal(gain(state, 1, start + 100).regenAt, state.regenAt);
  assert.equal(gain(state, 5, start + 100).count, 5);
  assert.equal(gain(state, 5, start + 100).regenAt, null);
  assert.equal(lose(state, start + 100).count, 0);
  assert.equal(state.count, 0);
});

test('cloud merge uses action time and equal timestamps resolve conservatively', () => {
  const old = { ...emptyHearts(), count: 1, regenAt: start + HEART_REGEN_MS, updatedAt: start };
  const fresh = { ...old, count: 0, updatedAt: start + 1000 };
  assert.equal(mergeHearts(old, fresh), fresh);
  assert.equal(mergeHearts(fresh, old), fresh);
  assert.equal(mergeHearts({ ...fresh, count: 3 }, fresh).count, 0);
  assert.equal(mergeHearts(regen(old, start + 6 * HEART_REGEN_MS), fresh), fresh);
});

test('store restores the newer device state and isolates learner accounts', () => {
  initializeHearts(false);
  const stamp = getHearts().updatedAt;
  applySyncedStores({ hearts: { v: 1, count: 2, grace: 0, regenAt: stamp + HEART_REGEN_MS, updatedAt: stamp + 1 } });
  assert.equal(getHearts().count, 2);
  applySyncedStores({ hearts: { v: 1, count: 5, grace: 3, regenAt: null, updatedAt: stamp - 1 } });
  assert.equal(getHearts().count, 2);
  assert.equal((syncedSnapshot().hearts as any).count, 2);
  setStorageUid('another-learner');
  initializeHearts(true);
  assert.equal(getHearts().count, 5);
  assert.equal(getHearts().grace, 3);
  assert.equal(loseHeart(), true);
  assert.equal(getHearts().count, 5);
});

test('wrong first attempts charge once; corrected answers, retries, and resource errors do not', () => {
  const tried = new Set<string>();
  assert.equal(chargeFirstAttempt(tried, 'word-a', false), true);
  assert.equal(chargeFirstAttempt(tried, 'word-a', false), false);
  assert.equal(chargeFirstAttempt(tried, 'word-a', true), false);
  assert.equal(chargeFirstAttempt(tried, 'word-b', true), false);
  assert.equal(chargeFirstAttempt(tried, 'word-b', false), false);
  assert.equal(chargeFirstAttempt(tried, 'retry-word', false, true), false);
  assert.equal(chargeFirstAttempt(tried, undefined, false), false);
});

test('coin refills charge exactly 120 once and never charge at full hearts', () => {
  initializeHearts(false);
  let coins = 240;
  const spend = (cost: number) => { if (coins < cost) return false; coins -= cost; return true; };
  assert.equal(purchaseHeartRefill(spend), false);
  assert.equal(coins, 240);
  loseHeart();
  assert.equal(purchaseHeartRefill(() => false), false);
  assert.equal(getHearts().count, 4);
  assert.equal(purchaseHeartRefill(spend), true);
  assert.equal(coins, 120);
  assert.equal(purchaseHeartRefill(spend), false);
  assert.equal(coins, 120);
});

test('server progress merges retain newer hearts and existing daily reward claims', () => {
  const key = '2026-11-13:en';
  const previous = { xp: 100, hearts: { ...emptyHearts(), count: 1, updatedAt: start + 100, regenAt: start + HEART_REGEN_MS }, todayBites: { [key]: { completedAt: start, best: 90, xpAwarded: true, heartAwarded: true } }, other: 'keep' };
  const incoming = { xp: 110, hearts: { ...emptyHearts(), updatedAt: start }, todayBites: { [key]: { completedAt: start - 1, best: 60, xpAwarded: false, heartAwarded: false } } };
  const next = mergeProgressData(previous, incoming);
  assert.equal(next.hearts.count, 1);
  assert.equal(next.todayBites[key].xpAwarded, true);
  assert.equal(next.todayBites[key].heartAwarded, true);
  assert.equal(next.todayBites[key].best, 90);
  assert.equal(next.xp, 110);
  assert.equal(next.other, 'keep');
  assert.equal(previous.xp, 100);
});

test('free learners can reach Practice, Workshop, and path tests while Daily Review is premium', () => {
  const free = { role: 'student', plan: null } as any;
  assert.equal(canUseBites(free), true);
  assert.equal(canUseBites(null), false);
  for (const path of [[], ['path'], ['bite', 'en', 'a', '0'], ['refine'], ['assessment'], ['hearts', 'practice']]) assert.equal(isFreeLearningRoute('lessons', path), true);
  for (const path of [['today'], ['levels'], ['library'], ['certificate']]) assert.equal(isFreeLearningRoute('lessons', path), false);
  assert.equal(isFreeLearningRoute('practice', []), true);
  assert.equal(isFreeLearningRoute('practice', ['path']), false);
  assert.equal(hasUnlimitedHearts({ ...free, plan: 'smarty-max' }), true);
  assert.equal(hasUnlimitedHearts({ ...free, role: 'admin' }), true);
  assert.equal(isPreviewMode({ ...free, role: 'business' }), true);
  assert.equal(hasUnlimitedHearts({ ...free, role: 'business' }), false);
});

test('daily selection is deterministic and mixes missed and due words', () => {
  const lesson = tx('new');
  const other = tx('missed');
  const vocab: ReviewVocab = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`review${i}`, { definition: `Review ${i}`, lang: 'en', srs: { nextReviewDate: start - 1000 } }]));
  const input = { lang: 'en' as const, date: '2026-11-13', nextText: lesson, texts: [lesson, other], vocab, missed: other.vocabulary.map(v => v.word), now: start };
  const session = deriveDailySession(input);
  assert.deepEqual(session, deriveDailySession(input));
  assert.equal(session.items.length, 8);
  assert.equal(new Set(session.items.map(item => item.word)).size, 8);
  assert.equal(session.items.filter(item => item.source === 'new').length, 0);
  assert.equal(session.items.filter(item => item.source === 'review').length, 4);
  assert.equal(session.items.filter(item => item.source === 'missed').length, 4);
});

test('daily review waits for the learner to have words to review', () => {
  const lesson = tx('new');
  const result = deriveDailySession({ lang: 'en', date: '2026-11-13', nextText: lesson, texts: [lesson], vocab: {}, missed: [], now: start });
  assert.equal(result.items.length, 0);
});

test('cached daily content survives changes to SRS/path and rotates on the next local date', () => {
  const clock = new Date(2026, 10, 13, 10).getTime();
  const texts = levels([tx('first')]);
  const vocab = { known: { definition: 'Known', srs: { nextReviewDate: clock - 1000 } } };
  const a = getDailySession('en', 'Beginner', texts, vocab, {}, clock)!;
  const b = getDailySession('en', 'Beginner', levels([tx('changed')]), vocab, {}, clock)!;
  assert.deepEqual(b, a);
  const nextDay = getDailySession('en', 'Beginner', texts, vocab, {}, clock + 86400000)!;
  assert.notEqual(nextDay.date, a.date);
  setStorageUid('other-daily-learner');
  assert.equal(getDailySession('en', 'Beginner', levels([tx('other')]), vocab, {}, clock)!.passageId, 'other');
});

test('daily XP is awarded once and a successful replay can earn its one heart', () => {
  assert.deepEqual(completeDailySession('en', '2026-11-13', 60), { xp: true, heart: false });
  assert.deepEqual(completeDailySession('en', '2026-11-13', 90), { xp: false, heart: true });
  assert.deepEqual(completeDailySession('en', '2026-11-13', 100), { xp: false, heart: false });
  assert.equal(dailyCompletion('en', '2026-11-13')!.best, 100);
  assert.deepEqual(biteXp('today', 100, true), { xp: 15, coins: 3 });
  assert.deepEqual(completeDailySession('en', '2026-11-14', 80), { xp: true, heart: true });
});

test('daily completion sync merges reward claims and best results', () => {
  const key = '2026-11-13:en';
  const merged = mergeDailyProgress({ [key]: { completedAt: start, best: 60, xpAwarded: true, heartAwarded: false } }, { [key]: { completedAt: start + 1, best: 90, xpAwarded: false, heartAwarded: true } });
  assert.equal(merged[key].xpAwarded, true);
  assert.equal(merged[key].heartAwarded, true);
  assert.equal(merged[key].best, 90);
  applySyncedStores({ todayBites: merged });
  assert.deepEqual(completeDailySession('en', '2026-11-13', 100), { xp: false, heart: false });
});

test('daily review advances SRS dates while preserving the cached word selection', () => {
  const now = Date.now();
  const vocab = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`due${i}`, { definition: `Due ${i}`, srs: { interval: 0, repetition: 0, easeFactor: 2.5, nextReviewDate: now - 1000 } }]));
  const lesson = tx('new');
  const first = getDailySession('en', 'Beginner', levels([lesson]), vocab, {}, now)!;
  const next = applySrsFromResult(vocab, { correctWords: first.items.map(item => item.word), mistakes: [] });
  assert.equal(Object.values(next).filter(word => word.srs.nextReviewDate <= now).length, 0);
  assert.deepEqual(getDailySession('en', 'Beginner', levels([lesson]), next, {}, now), first);
});

test('heart practice always has six items and prioritizes missed words', () => {
  const lesson = tx('word');
  const practice = deriveHeartPractice('en', [lesson], {}, ['word2', 'word3'], 'seed');
  assert.equal(practice.length, 6);
  assert.deepEqual(new Set(practice.slice(0, 2).map(item => item.word)), new Set(['word2', 'word3']));
  assert.deepEqual(practice, deriveHeartPractice('en', [lesson], {}, ['word2', 'word3'], 'seed'));
  assert.equal(deriveHeartPractice('en', [tx('only', 1)], {}, [], 'seed').length, 6);
});

test('heart practice and Today snapshots do not overwrite a paused path bite', () => {
  const def = deriveBites(tx('path'))[0];
  saveBiteSession('en', def, def.steps, 1, [{ kind: 'vocab-intro', percent: 100, mistakes: [], correctWords: [] }], 2000, { 1: ['path0'] }, { hadWrong: true, mistakes: ['path0'] });
  const practice = { ...def, id: 'heart-practice:test', kind: 'heart-practice' as const };
  saveBiteSession('en', practice, practice.steps, 0, [], 500);
  assert.equal(loadBiteSession('en', def)!.index, 1);
  assert.deepEqual(loadBiteSession('en', def)!.answered, { 1: ['path0'] });
  assert.equal(loadBiteSession('en', def)!.answerHistory!.hadWrong, true);
  clearBiteSession('en', practice);
  assert.equal(loadBiteSession('en', def)!.index, 1);
});

test('streak risk and reminder timing use the local clock and local notifications deduplicate', () => {
  assert.equal(isStreakAtRisk(7, 0, new Date(2026, 10, 13, 17, 59)), false);
  assert.equal(isStreakAtRisk(7, 0, new Date(2026, 10, 13, 18)), true);
  assert.equal(isStreakAtRisk(7, 15, new Date(2026, 10, 13, 19)), false);
  assert.equal(reminderDue('18:30', false, new Date(2026, 10, 13, 18, 29)), false);
  assert.equal(reminderDue('18:30', false, new Date(2026, 10, 13, 18, 30)), true);
  assert.equal(reminderDue('18:30', true, new Date(2026, 10, 13, 19)), false);
  assert.equal(reminderDue('99:99', false, new Date(2026, 10, 13, 19)), false);
  const now = new Date(2026, 10, 13, 19);
  const row = ensureLocalReminder('daily', now);
  ensureLocalReminder('daily', now);
  assert.equal(localReminders().length, 1);
  markLocalReminderRead(row.id);
  assert.equal(localReminders()[0].read, true);
});
