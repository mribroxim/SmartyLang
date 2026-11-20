import { test } from 'vitest';
import assert from 'node:assert/strict';
import { advance, newItem, isDusty, efficiency, mergeItems, normalizeItems, DAY, type WorkItem } from '../src/lib/workshop/model';
import { applyEvidence, backfillItems, evidenceFor } from '../src/lib/workshop/store';
import { PHASES, deliver, liveCounts, nextGoal, phaseProgress, mergeDelivered, targetsFor, roomOpen, currentPhase, type Delivered } from '../src/lib/house/phases';
import { deriveBites, missionTurns } from '../src/lib/bites/deriveBites';
import type { ReadingText } from '../src/lib/reading-logic';

const T0 = new Date(2026, 10, 1, 10).getTime();
const at = (days: number, hours = 0) => T0 + days * DAY + hours * 3_600_000;
const run = (steps: [Parameters<typeof advance>[1], boolean, number][], start: WorkItem = newItem(0, T0)) =>
  steps.reduce((it, [e, ok, now]) => advance(it, e, ok, now), start);

test('items climb Found → Recognised → Recalled → Used with matching evidence', () => {
  const it = run([['see', true, at(0)], ['recognise', true, at(0)], ['recall', true, at(0)], ['use', true, at(0)]]);
  assert.equal(it.stage, 4);
  assert.equal(it.usedAt, at(0));
  assert.equal(run([['see', true, at(0)]]).stage, 1);
  // Recognising never jumps past Recognised.
  assert.equal(run([['recognise', true, at(0)], ['recognise', true, at(0)]]).stage, 2);
});

test('Mastered via 3 recalls on 2 distinct days — no week-long wall', () => {
  const used = run([['recognise', true, at(0)], ['use', true, at(0)]]);
  const sameDay = run([['review', true, at(1)], ['recall', true, at(1, 1)], ['use', true, at(1, 2)]], used);
  assert.equal(sameDay.stage, 4, 'three recalls on one day are not enough');
  // Dusty freeze must not block a learner who refines: review first on day 2.
  const twoDays = run([['review', true, at(1)], ['recall', true, at(1, 1)], ['review', true, at(2)]], used);
  assert.equal(twoDays.stage, 5);
});

test('Mastered via a passed review ≥7 days after Used', () => {
  const used = run([['recognise', true, at(0)], ['use', true, at(0)]]);
  assert.equal(advance(used, 'review', true, at(7)).stage, 5);
  assert.equal(advance(used, 'review', true, at(6)).stage, 4);
});

test('use evidence comes from missions, speaking and building alike', () => {
  for (const kind of ['mission-reply', 'pronunciation', 'read-back-shadowing'] as const) assert.equal(evidenceFor(kind), 'use');
  assert.equal(evidenceFor('sentence-reorder'), 'recall');
  assert.equal(evidenceFor('definition-quiz'), 'recognise');
  assert.equal(evidenceFor('word-review'), 'review');
});

test('dusty items freeze until refined and only a failed review costs a stage', () => {
  const rec = run([['recognise', true, at(0)], ['recall', true, at(0)]]);
  assert.equal(isDusty(rec, at(0)), false);
  assert.equal(isDusty(rec, at(2)), true);
  const frozen = advance(rec, 'use', true, at(2));
  assert.equal(frozen.stage, 3, 'dusty: no advancing outside a review');
  const refined = advance(rec, 'review', true, at(2));
  assert.equal(isDusty(refined, at(2)), false);
  const advanced = advance(refined, 'use', true, at(2, 1));
  assert.equal(advanced.stage, 4);
  assert.equal(advance(rec, 'recall', false, at(2)).stage, 3, 'a wrong answer outside review keeps the stage');
  assert.equal(advance(rec, 'review', false, at(2)).stage, 2, 'a failed review drops one stage');
  assert.equal(advance(newItem(0, T0), 'review', false, at(0)).stage, 0);
});

test('efficiency counts dusty share of active items', () => {
  const fresh = run([['recognise', true, at(0)]]);
  assert.equal(efficiency({ a: fresh, b: fresh }, at(0)), 100);
  assert.equal(efficiency({ a: fresh, b: advance(fresh, 'review', true, at(5)) }, at(3)), 50);
});

test('applyEvidence ignores wrong answers on unseen words and reports moves', () => {
  const r = applyEvidence({}, { correct: ['Hello', 'name'], wrong: ['name', 'ghost'] }, 'recognise', 0, at(0));
  assert.deepEqual(Object.keys(r.items).sort(), ['hello']);
  assert.deepEqual(r.moved, [{ word: 'hello', from: 0, to: 2 }]);
});

test('sync merge keeps the further-refined copy and pools days', () => {
  const a = run([['recognise', true, at(0)], ['use', true, at(0)], ['review', true, at(1)]]);
  const b = run([['recognise', true, at(0)]]);
  const merged = mergeItems({ w: b }, { w: a });
  assert.equal(merged.w.stage, 4);
  assert.deepEqual(mergeItems({ w: a }, { w: b }).w, merged.w);
  assert.deepEqual(normalizeItems({ ' W ': a, bad: { stage: 9 } }), { w: a });
});

test('backfill is idempotent and never lowers a stage', () => {
  const lessons = [{ words: ['Hello', 'name'], sec: 0, best: 90 }, { words: ['bag'], sec: 0, best: 60 }, { words: ['later'], sec: 0, best: null }];
  const once = backfillItems({}, lessons, at(0));
  assert.equal(once.hello.stage, 3);
  assert.equal(once.bag.stage, 2);
  assert.equal(once.later, undefined);
  assert.deepEqual(backfillItems(once, lessons, at(0)), once);
  const used = { hello: run([['recognise', true, at(0)], ['use', true, at(0)]]) };
  assert.equal(backfillItems(used, lessons, at(1)).hello.stage, 4);
});

test('house deliveries are high-water marks and never drop', () => {
  const bedroom = PHASES.find((p) => p.id === 'bedroom')!;
  const items = { a: run([['recall', true, at(0)]]), b: run([['recall', true, at(0)]]) };
  let d: Delivered = deliver({}, 'en', bedroom, liveCounts(items, ['a', 'b', 'c'], 1), 10);
  assert.equal(d.en!.bedroom!.recalled, 2);
  // A failed review drops a word back — the bar stays.
  const dropped = { a: advance(items.a, 'review', false, at(3)), b: items.b };
  d = deliver(d, 'en', bedroom, liveCounts(dropped, ['a', 'b', 'c'], 1), 10);
  assert.equal(d.en!.bedroom!.recalled, 2);
  assert.equal(phaseProgress(d, 'en', bedroom).done, false);
  assert.deepEqual(mergeDelivered({}, d), d);
  const goal = nextGoal(d, 'en')!;
  assert.equal(goal.phase, 'bedroom');
  assert.ok(goal.left > 0);
});

test('every unit has a room; targets scale with the unit and mastery stays small', () => {
  assert.deepEqual(PHASES.slice(0, 4).map((p) => p.id), ['doorstep', 'bedroom', 'living-room', 'kitchen']);
  assert.equal(PHASES.filter((p) => p.sec === 0).length, 12);
  const t = targetsFor(45);
  assert.deepEqual(t, { lessons: 10, recalled: 32, used: 18, mastered: 9 });
  const kitchen = PHASES.find((p) => p.id === 'kitchen')!;
  assert.equal(roomOpen({}, 'en', PHASES[0]), true);
  assert.equal(roomOpen({}, 'en', kitchen), false);
  assert.equal(roomOpen({ en: { kitchen: { lessons: 1 } } }, 'en', kitchen), true);
  // A course without Unit 0 starts building at its first delivered room.
  assert.equal(currentPhase({ en: { bedroom: { lessons: 2 } } }, 'en').id, 'bedroom');
});

const lesson = (n: number, text = 'Anna: Hello! What is your name?\nBen: My name is Ben.\nAnna: Nice to meet you, Ben.\nBen: Nice to meet you too.'): ReadingText => ({
  id: 'b-test', title: 'Test', targetSeconds: 60, text,
  vocabulary: Array.from({ length: n }, (_, i) => ({ word: `word${i}`, definition: `Meaning ${i}` })),
});

test('published lessons keep their original five or six bites', () => {
  assert.deepEqual(deriveBites(lesson(10)).map((d) => d.kind), ['meet', 'meet', 'read', 'words', 'sentences', 'listen-speak']);
  assert.equal(deriveBites(lesson(6)).length, 5);
});

test('mission turns pair a partner line with the reply from the dialogue', () => {
  const turns = missionTurns(lesson(4).text, 3, 'seed');
  assert.ok(turns.length >= 2);
  assert.ok(turns.every((t) => t.cue.speaker && t.reply));
  assert.equal(turns[0].cue.speaker, 'Anna');
  assert.equal(turns[0].reply, 'My name is Ben.');
});

import { acceptsReply, normalizeReply } from '../src/lib/lessons/v2';
test('mission replies: patterns or a short reply using the target item', () => {
  assert.equal(normalizeReply("I'm Sam!"), 'i am sam');
  assert.equal(acceptsReply('My name is Sam.', ['^my name is sam$']), true);
  assert.equal(acceptsReply('Hello! Nice to meet you.', ['^hello mother$'], ['Hello']), true);
  assert.equal(acceptsReply('Goodbye.', ['^hello mother$'], ['Hello']), false);
  assert.equal(acceptsReply('othello', [], ['Hello']), false);
});

import { pcmToWav, estimateTimepoints } from '../server/geminiTts';
test('Gemini PCM is wrapped as a playable WAV; read-along timings are estimated in order', () => {
  const wav = pcmToWav(Buffer.alloc(48000));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(40), 48000);
  const tp = estimateTimepoints(wav, ['hello', 'my', 'friend']);
  assert.deepEqual(tp.map((t) => t.index), [0, 1, 2]);
  assert.ok(tp[0].timeSeconds < tp[1].timeSeconds && tp[1].timeSeconds < tp[2].timeSeconds && tp[2].timeSeconds < 1);
});
