import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initialQueue, isRetryable, requeueMissed, variantForRetry, monotoneProgress, MAX_RETRIES } from '../src/features/Bites/lesson/retryQueue';
import type { Question } from '../src/features/Bites/lesson/questions';

test('a missed question returns a few questions later, or at the end when few remain', () => {
  const q = initialQueue(6);
  const a = requeueMissed(q, 0);
  assert.deepEqual(a.map((i) => `${i.qi}.${i.attempt}`), ['0.0', '1.0', '2.0', '3.0', '0.1', '4.0', '5.0']);
  const b = requeueMissed(q, 4);
  assert.deepEqual(b.map((i) => `${i.qi}.${i.attempt}`).slice(-2), ['5.0', '4.1']);
});

test('retries are capped so the step cannot loop forever', () => {
  let queue = initialQueue(1);
  let idx = 0;
  let asked = 0;
  while (idx < queue.length) {
    asked++;
    queue = requeueMissed(queue, idx); // always wrong
    idx++;
    assert.ok(asked < 20);
  }
  assert.equal(asked, MAX_RETRIES + 1);
  const capped = [{ qi: 0, attempt: MAX_RETRIES }];
  assert.equal(requeueMissed(capped, 0), capped);
});

test('speaking and match-pairs are never re-asked', () => {
  assert.equal(isRetryable({ type: 'speak' }), false);
  assert.equal(isRetryable({ type: 'pairs' }), false);
  assert.equal(isRetryable({ type: 'choice' }), true);
  assert.equal(isRetryable({ type: 'tiles' }), true);
});

test('a retried question reorders options but keeps the answer', () => {
  const q: Question = { type: 'choice', id: 'x', word: 'cat', prompt: 'word', show: 'cat', options: ['a', 'b', 'c', 'd'], answer: 'c' };
  for (let i = 0; i < 20; i++) {
    const v = variantForRetry(q) as Extract<Question, { type: 'choice' }>;
    assert.deepEqual([...v.options].sort(), ['a', 'b', 'c', 'd']);
    assert.notDeepEqual(v.options, q.options);
    assert.equal(v.answer, 'c');
  }
  const t: Question = { type: 'tiles', id: 't', word: '', mode: 'words', hint: '', tiles: ['I', 'am', 'Sam'], answer: ['I', 'am', 'Sam'] };
  const tv = variantForRetry(t) as Extract<Question, { type: 'tiles' }>;
  assert.notDeepEqual(tv.tiles, t.tiles);
  assert.deepEqual(tv.answer, t.answer);
  const tf: Question = { type: 'tf', id: 'f', word: 'w', def: 'd', answer: true };
  assert.equal(variantForRetry(tf), tf);
});

test('progress never goes backwards and stays within 0..1', () => {
  assert.equal(monotoneProgress(0.8, 0.7), 0.8);
  assert.equal(monotoneProgress(0.5, 0.6), 0.6);
  assert.equal(monotoneProgress(0.5, 3), 1);
});
