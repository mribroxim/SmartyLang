import { describe, expect, test } from 'vitest';
import { ALL_TASKS, PILOT_SESSIONS, sessionTasks } from '../src/lib/unitOnePilot/content';
import { acceptsReply, checkTask, mergePilot, normalizePilot } from '../src/lib/unitOnePilot/model';
import { mergeProgressData } from '../server/progressMerge';
import { readScopedJSON } from '../src/lib/userStorage';
import { setStorageUid } from '../src/lib/userStorage';
import { completePilot, PILOT_PROGRESS_KEY } from '../src/lib/unitOnePilot/progress';
import { isFreeLearningRoute } from '../src/lib/access';
import { isFocusRoute } from '../src/lib/chrome';

test('the pilot is ten authored, short sessions with unique activities and valid answers', () => {
  expect(PILOT_SESSIONS).toHaveLength(10);
  const ids = PILOT_SESSIONS.flatMap(s => s.tasks.map(t => t.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const s of PILOT_SESSIONS) {
    expect(s.minutes).toBeLessThanOrEqual(4);
    expect(s.goal).toBeTruthy();
    expect(sessionTasks(s).length).toBeGreaterThanOrEqual(5);
    for (const task of s.tasks) {
      expect(task.explanation).toBeTruthy();
      if (task.kind === 'choice') {
        expect(new Set(task.options).size).toBe(task.options.length);
        expect(task.options.filter(o => o === task.answer)).toHaveLength(1);
        expect(checkTask(task, task.answer)).toBe(true);
        for (const option of task.options.filter(o => o !== task.answer)) expect(checkTask(task, option)).toBe(false);
      }
      if (task.kind === 'reply') expect(checkTask(task, task.example)).toBe(true);
      if (task.kind === 'build') for (const answer of task.answers) {
        expect(checkTask(task, answer)).toBe(true);
        const remaining = [...task.tiles];
        for (const token of answer.split(' ')) { expect(remaining).toContain(token); remaining.splice(remaining.indexOf(token), 1); }
      }
    }
  }
});
describe('open replies accept valid alternatives and reject the wrong communication pattern', () => {
  test.each(['My name is Sam.', "I'm Mia", 'Hello! I am Ana.', 'Hi, my name’s O’Neil.', 'I’m 李明.'])('%s is an introduction', value => expect(acceptsReply(value, 'introduction')).toBe(true));
  test.each(['Sam', 'My name', 'I from Brazil', 'I am from Brazil', 'I are Sam', '<script>'])('%s is not a complete introduction', value => expect(acceptsReply(value, 'introduction')).toBe(false));
  test.each(["I'm from Uzbekistan.", 'I am from São Paulo.', 'Hello! I’m from New Zealand.', 'I am from Côte d’Ivoire.'])('%s is an origin reply', value => expect(acceptsReply(value, 'origin')).toBe(true));
  test('questions accept contractions, punctuation and case', () => {
    expect(acceptsReply('WHAT IS YOUR NAME?', 'ask-name')).toBe(true);
    expect(acceptsReply('What’s your name?', 'ask-name')).toBe(true);
    expect(acceptsReply('Where are you from?', 'ask-origin')).toBe(true);
    expect(acceptsReply('Where you from?', 'ask-origin')).toBe(false);
    expect(acceptsReply('What is my name?', 'ask-name')).toBe(false);
  });
});
test('personal review starts with real missed activities and uses a balanced fallback', () => {
  const repair = PILOT_SESSIONS.find(s => s.id === 'repair')!;
  const tasks = sessionTasks(repair, ['from-gap', 'from-gap', 'unknown', 'hello-learn']);
  expect(tasks[0]).toEqual(ALL_TASKS.get('from-gap'));
  expect(tasks).toHaveLength(6);
  expect(new Set(tasks.map(t => t.id)).size).toBe(6);
  expect(tasks.every(t => t.kind !== 'teach')).toBe(true);
});
test('merge preserves different sessions and best scores across devices', () => {
  const a = { hello: { completedAt: 100, best: 100, missed: [] }, name: { completedAt: 150, best: 80, missed: ['name-own'] } };
  const b = { hello: { completedAt: 200, best: 75, missed: ['hello-start'] } };
  const merged = mergePilot(a, b);
  expect(merged.hello).toEqual({ completedAt: 200, best: 100, missed: ['hello-start'] });
  expect(merged.name).toEqual(a.name);
  expect(mergeProgressData({ beginner_unit_one_pilot_v1: a, xp: 20 }, { beginner_unit_one_pilot_v1: b }).beginner_unit_one_pilot_v1).toEqual(merged);
  expect(normalizePilot({ fake: { completedAt: 1, best: 100 }, hello: { completedAt: -1, best: 100 } })).toEqual({});
});
test('pilot progress stays separate from original unlocks and between accounts', () => {
  setStorageUid('pilot-one'); completePilot('hello', 80, ['hello-start']);
  expect(readScopedJSON<any>(PILOT_PROGRESS_KEY, {}).hello.best).toBe(80);
  expect(readScopedJSON('readmaster_lesson_unlock_en_1', null)).toBeNull();
  setStorageUid('pilot-two'); expect(readScopedJSON(PILOT_PROGRESS_KEY, {})).toEqual({});
});
test('free learners can open the pilot and it uses the focused lesson layout', () => {
  expect(isFreeLearningRoute('lessons', ['unit-one', 'mission'])).toBe(true);
  expect(isFocusRoute('lessons', ['unit-one'])).toBe(true);
});
