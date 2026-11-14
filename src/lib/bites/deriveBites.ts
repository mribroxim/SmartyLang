/**
 * Splits one lesson (passage + 10–16 words) into 5–6 bites of 3–5 minutes.
 * Together the bites cover all 12 lesson exercise types, so "lesson complete"
 * keeps its meaning. Pure + deterministic (same lesson → same bites).
 */
import type { ReadingText } from '../reading-logic';
import type { BiteDef, BiteKind, BiteStep } from './types';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Seeded pick of n items (stable for a given seed). */
export function seededPick<T>(items: T[], n: number, seed: string): T[] {
  const arr = [...items];
  let x = hash(seed) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

export function lessonWords(text: ReadingText): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of text.vocabulary || []) {
    const w = (v.word || '').trim().toLowerCase();
    if (w && !seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

export function deriveBites(text: ReadingText): BiteDef[] {
  const words = lessonWords(text);
  const half = words.length >= 9 ? Math.min(8, Math.ceil(words.length / 2)) : words.length;
  const w1 = words.slice(0, half);
  const w2 = words.slice(half, half + 8);
  const hasB = words.length >= 9;
  const id = text.id;
  const pick = (n: number, salt: string) => seededPick(words, n, `${id}:${salt}`);

  const plan: [BiteKind, BiteStep[], number][] = [];
  plan.push(['meet', [
    { kind: 'vocab-intro', words: w1 },
    { kind: 'definition-quiz', words: w1 },
    { kind: 'word-match', words: w1 },
  ], 3]);
  if (hasB) {
    plan.push(['meet', [
      { kind: 'vocab-intro', words: w2 },
      { kind: 'definition-quiz', words: w2 },
      { kind: 'listening-match', words: w2 },
    ], 3]);
  }
  plan.push(['read', [{ kind: 'read-aloud' }], Math.max(2, Math.round((text.targetSeconds || 120) / 60) + 1)]);
  const wordSteps: BiteStep[] = [
    { kind: 'word-scramble', words: pick(5, 'scramble') },
    { kind: 'true-false-quiz', words: pick(5, 'tf') },
    { kind: 'spelling-practice', words: pick(4, 'spell') },
  ];
  if (!hasB) wordSteps.push({ kind: 'listening-match', words: pick(5, 'listen') });
  plan.push(['words', wordSteps, 4]);
  plan.push(['sentences', [
    { kind: 'sentence-reorder', maxItems: 4 },
    { kind: 'cloze', maxItems: 5 },
    { kind: 'comprehension', maxItems: 4 },
  ], 4]);
  plan.push(['listen-speak', [
    { kind: 'pronunciation', words: pick(5, 'say') },
    { kind: 'audio-dictation', maxItems: 3, sentenceOffset: 0 },
    { kind: 'read-back-shadowing', maxItems: 3, sentenceOffset: 3 },
  ], 4]);

  return plan.map(([kind, steps, est], index) => ({
    id: `${id}#${index}`,
    passageId: id,
    index,
    kind,
    steps,
    estMinutes: est,
    costsHearts: kind !== 'read',
  }));
}
