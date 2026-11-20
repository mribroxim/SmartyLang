import { expect, test } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateLessons, normalizeTarget, formatIssue, canBuildTarget } from '../scripts/content/validate-lessons.mjs';

const unitPath = fileURLToPath(new URL('./fixtures/unit-01.json', import.meta.url));
const validatorPath = fileURLToPath(new URL('../scripts/content/validate-lessons.mjs', import.meta.url));
const readUnit = () => JSON.parse(fs.readFileSync(unitPath, 'utf8'));
const messages = (unit: unknown) => validateLessons(unit).map(formatIssue).join('\n');

test('the ported ten-lesson unit validates and the documented CLI exits zero', () => {
  expect(validateLessons(readUnit())).toEqual([]);
  const cli = spawnSync(process.execPath, [validatorPath, unitPath], { encoding: 'utf8' });
  expect(cli.status, cli.stderr).toBe(0);
  expect(cli.stdout).toContain('10 lesson(s)');
});

function morphologyFixture() {
  const refs = ['morph.cat', 'morph.be', 'morph.hello', 'morph.goodbye'];
  const choice = (id: string, answer: string, options: string[], itemIds: string[]) => ({ id, kind: 'choice', prompt: 'Choose the phrase for this scene.', answer, options, itemIds, explanation: 'Use the phrase shown on the teaching card.' });
  return {
    id: 'en.morph.l01', section: 'beginner', unit: 1, lesson: 1, title: 'Cats are here', canDo: 'Recognise a cat and greet a friend.', scenario: 'Smarty and Mia see fictional cats.',
    items: [
      { id: refs[0], text: 'cat', kind: 'word', forms: ['cats'], example: 'Cats are here.' },
      { id: refs[1], text: 'is here', kind: 'pattern', forms: ['are here'], example: 'Smarty is here.' },
      { id: refs[2], text: 'Hello', kind: 'word', example: 'Hello, Smarty!' },
      { id: refs[3], text: 'Goodbye', kind: 'word', example: 'Goodbye, Mia!' },
    ],
    practice: [
      choice('morph.p1', 'cats', ['cats', 'Hello', 'Goodbye'], [refs[0]]),
      choice('morph.p2', 'is here', ['is here', 'Hello', 'Goodbye'], [refs[1]]),
      choice('morph.p3', 'Hello', ['Hello', 'Goodbye', 'cat'], [refs[2]]),
      choice('morph.p4', 'Goodbye', ['Goodbye', 'Hello', 'cat'], [refs[3]]),
      { id: 'morph.p5', kind: 'speak', prompt: 'Say the phrase.', text: 'Cats are here.', answer: 'Cats are here.', itemIds: [refs[0], refs[1]], explanation: 'Cats is the plural form of cat.' },
      { id: 'morph.p6', kind: 'build', prompt: 'Build the phrase.', answer: 'Smarty is here.', tiles: ['here.', 'Smarty', 'is', 'cat'], itemIds: [refs[1]], explanation: 'Keep is between Smarty and here.' },
      { id: 'morph.p7', kind: 'listen', prompt: 'Listen to the greeting.', audio: 'Hello, Smarty!', answer: 'Hello, Smarty!', options: ['Hello, Smarty!', 'Goodbye, Smarty!', 'Hello, Mia!'], itemIds: [refs[2]], explanation: 'The greeting is addressed to Smarty.' },
      { id: 'morph.p8', kind: 'fill', prompt: 'Complete the phrase.', text: 'Smarty ___ here.', answer: 'is', itemIds: [refs[1]], explanation: 'Use is for Smarty.' },
    ],
    story: {
      lines: [{ speaker: 'Smarty', text: 'Cats are here.' }, { speaker: 'Mia', text: 'Hello, Smarty!' }, { speaker: 'Sam', text: 'Goodbye, Smarty!' }, { speaker: 'Smarty', text: 'Smarty is here.' }],
      questions: [choice('morph.q1', 'Smarty', ['Smarty', 'Mia', 'Sam'], [refs[0]]), choice('morph.q2', 'Mia', ['Mia', 'Sam', 'Smarty'], [refs[2]]), choice('morph.q3', 'Sam', ['Sam', 'Mia', 'Smarty'], [refs[3]])],
    },
    mission: { setup: 'Greet Smarty, then leave politely.', turns: [
      { smarty: 'Hello, Mia!', accept: ['^hello smarty$', '^hello$'], example: 'Hello, Smarty!', hint: 'Give a greeting back.', itemIds: [refs[2]] },
      { smarty: 'Goodbye, Mia!', accept: ['^goodbye smarty$', '^goodbye$'], example: 'Goodbye, Smarty!', hint: 'End the conversation.', itemIds: [refs[3]] },
    ] }, recycle: [],
  };
}

test('accepts an explicitly taught inflected form and whitelisted proper names', () => {
  expect(validateLessons(morphologyFixture())).toEqual([]);
  const withoutForm = morphologyFixture();
  delete (withoutForm.items[0] as any).forms;
  expect(messages(withoutForm)).toContain('untaught token(s): cats');
});
test('contracts case, punctuation and apostrophe variants without guessing morphology', () => {
  expect(normalizeTarget('I’M Sam!')).toBe('i am sam');
  expect(normalizeTarget("What's your name?")).toBe('what is your name');
  expect(normalizeTarget('cats')).not.toBe(normalizeTarget('cat'));
});
test('untaught words: errors where the learner answers, glossed warnings where they only read', () => {
  const unit = readUnit(); unit.lessons[0].story.lines[0].text = 'Hello, dragon!';
  expect(messages(unit)).toContain('warning: en.beginner.u01.l01 $.lessons[0].story.lines[0].text: not taught yet (the app will gloss them): dragon');
  const answer = readUnit(); answer.lessons[0].practice[0].options[1] = 'Hello, dragon!';
  expect(messages(answer)).toContain('en.beginner.u01.l01 $.lessons[0].practice[0].options[1]: untaught token(s): dragon');
});
test('capitalization does not turn an unknown word into an allowed proper name', () => {
  const unit = readUnit(); unit.lessons[0].practice[0].options[1] = 'Hello, Unknownperson!';
  expect(messages(unit)).toContain('untaught token(s): unknownperson');
});
test('rejects a task without explanatory feedback', () => {
  const unit = readUnit(); delete unit.lessons[0].practice[0].explanation;
  expect(messages(unit)).toContain('$.lessons[0].practice[0].explanation: is required');
});
test('one accepted pattern is enough, but the example must match it', () => {
  const unit = readUnit(); unit.lessons[0].mission.turns[0].accept = ['^hello$'];
  expect(messages(unit)).toContain('$.lessons[0].mission.turns[0].example: does not match any accept pattern');
  unit.lessons[0].mission.turns[0].accept = [unit.lessons[0].mission.turns[0].accept[0], '^hello(?: smarty)?$'];
  expect(messages(unit)).not.toContain('mission.turns[0].example');
});
test('does not accept later vocabulary, even if it exists elsewhere in the file', () => {
  const unit = readUnit(); unit.lessons[0].mission.turns[0].example = 'I am a student.';
  expect(messages(unit)).toContain('untaught token(s): i, am, a, student');
});
test('rejects unknown/forward recycle references and insufficient interleaving', () => {
  const forward = readUnit(); forward.lessons[0].recycle = [forward.lessons[1].items[0].id];
  expect(messages(forward)).toContain('must exist in an earlier lesson');
  const noReview = readUnit(); const lesson = noReview.lessons[2];
  lesson.practice.forEach((task: any) => { task.itemIds = [lesson.items[0].id]; });
  expect(messages(noReview)).toContain('tasks reference recycled items; need at least 3 (30%)');
});
test('rejects options with fewer than two actual distractors', () => {
  const unit = readUnit(); const task = unit.lessons[0].practice[0]; task.answers = task.options.slice(0, 2); delete task.answer;
  expect(messages(unit)).toContain('at least two distinct distractors');
});
test('rejects a build task that cannot assemble its answer and invalid mission regexes', () => {
  const unit = readUnit(); unit.lessons[0].practice[2].tiles = ['Hello', 'Mia'];
  expect(messages(unit)).toContain('cannot build accepted answer');
  const regex = readUnit(); regex.lessons[0].mission.turns[0].accept[0] = '^($';
  expect(messages(regex)).toContain('invalid regular expression');
});
test('rejects unsafe patterns and examples outside the accepted pattern set', () => {
  const unsafe = readUnit(); unsafe.lessons[0].mission.turns[0].accept[0] = '^(?=hello).*$';
  expect(messages(unsafe)).toContain('use anchored patterns (^…$) without lookarounds or backreferences');
  const unanchored = readUnit(); unanchored.lessons[0].mission.turns[0].accept[0] = 'hello';
  expect(messages(unanchored)).toContain('use anchored patterns');
  const unmatched = readUnit(); unmatched.lessons[0].mission.turns[0].example = 'Goodbye, Smarty!';
  expect(messages(unmatched)).toContain('does not match any accept pattern');
});
test('rejects unexpected schema fields and excessive new-item load', () => {
  const extra = readUnit(); extra.lessons[0].meaning = 'An English dictionary definition';
  expect(messages(extra)).toContain('$.lessons[0].meaning: unknown property');
  const tooFew = readUnit(); tooFew.lessons[0].items.splice(1);
  expect(messages(tooFew)).toContain('warning: en.beginner.u01.l01 $.lessons[0].items: 1 new items; 3–6 is typical');
});
test('review lessons teach nothing new; exposure words are B1+ only', () => {
  const review = readUnit(); review.lessons[0].type = 'review';
  expect(messages(review)).toContain('review lessons teach no new items');
  const exposed = readUnit(); exposed.lessons[0].exposure = [{ text: 'umbrella' }];
  expect(messages(exposed)).toContain('exposure words are for B1 and above');
});
test('whole tiles are respected, including repeated words and contraction equivalents', () => {
  expect(canBuildTarget('My name is Mia.', ['is Mia.', 'My name'])).toBe(true);
  expect(canBuildTarget('Name my is Mia.', ['is Mia.', 'My name'])).toBe(false);
  expect(canBuildTarget('Hi, hi, Smarty!', ['Hi', 'Smarty'])).toBe(false);
  expect(canBuildTarget('I am Sam.', ["I'm", 'Sam.'])).toBe(true);
});
test('rejects normalized duplicate options and overly long target sentences', () => {
  const duplicate = readUnit(); duplicate.lessons[0].practice[0].options[1] = 'HELLO SMARTY';
  expect(messages(duplicate)).toContain('options must remain distinct');
  const long = readUnit(); long.lessons[0].story.lines[0].text = Array(13).fill('Hello').join(' ');
  expect(messages(long)).toContain('sentence exceeds 12 target tokens');
});
test('rejects an excessive story even when each line is a short taught sentence', () => {
  const unit = readUnit(); unit.lessons[0].story.lines = Array.from({ length: 16 }, () => ({ speaker: 'Smarty', text: 'Hello, Mia! Hi, Sam! Goodbye, Ben!' }));
  expect(messages(unit)).toContain('story exceeds 60 target tokens');
});
test('open replies with repetition are allowed; backreferences are not', () => {
  const open = readUnit(); open.lessons[0].mission.turns[0].accept.push('^hello(?: [a-z]+){1,4}$');
  expect(messages(open)).not.toContain('mission.turns[0].accept[');
  const back = readUnit(); back.lessons[0].mission.turns[0].accept[0] = String.raw`^(hello) \1$`;
  expect(messages(back)).toContain('without lookarounds or backreferences');
});
test('reply variants match patterns written without apostrophes or hyphens', () => {
  const unit = readUnit(); unit.lessons[0].mission.turns[0].accept = ['^hello smartys$'];
  unit.lessons[0].mission.turns[0].example = "Hello Smarty's!";
  expect(messages(unit)).not.toContain('does not match any accept pattern');
});
test('the fully worked documentation lesson is the actual first ported lesson', () => {
  const spec = fs.readFileSync(new URL('../docs/CONTENT-SPEC.md', import.meta.url), 'utf8');
  const example = JSON.parse(spec.match(/```json\n([\s\S]*?)\n```/)![1]);
  expect(example).toEqual(readUnit().lessons[0]);
  expect(validateLessons(example)).toEqual([]);
});
