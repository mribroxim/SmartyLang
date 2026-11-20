/**
 * Splits one lesson (passage + its words) into four 3–5 minute bites.
 * Pure + deterministic (same lesson + same recycle list → same bites).
 */
import type { ReadingText } from '../reading-logic';
import type { BiteDef, BiteKind, BiteStep } from './types';
import { isV2, type V2Text } from '../lessons/v2';

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

/**
 * The published lesson plan: meet the words (one or two bites), read the
 * passage, word practice, sentences, listen & speak. v2 course lessons use
 * their own plan (deriveV2Bites). `recycle` only applies to v2 lessons.
 */
export function deriveBites(text: ReadingText, recycle: string[] = []): BiteDef[] {
  if (isV2(text)) return deriveV2Bites(text, recycle);
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

export interface DialogueLine { speaker: string; text: string }

/** "Anna: Hello!" lines of a dialogue passage (empty for narrative texts). */
export function dialogueLines(raw: string): DialogueLine[] {
  const out: DialogueLine[] = [];
  for (const line of raw.split(/\n+/)) {
    const m = line.match(/^\s*([^:\n]{1,24}):\s*(.+?)\s*$/u);
    if (m && /\p{L}/u.test(m[2])) out.push({ speaker: m[1].trim(), text: m[2] });
  }
  return out.length >= 3 ? out : [];
}

/** Turns to answer in a mission: a partner line, then the reply the learner builds. */
export function missionTurns(raw: string, n: number, seed: string): { cue: DialogueLine; reply: string }[] {
  const lines = dialogueLines(raw);
  const turns: { cue: DialogueLine; reply: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const len = lines[i].text.split(/\s+/).length;
    if (lines[i].speaker !== lines[i - 1].speaker && len >= 2 && len <= 12) turns.push({ cue: lines[i - 1], reply: lines[i].text });
  }
  if (turns.length) return seededPick(turns, n, seed).sort((a, b) => lines.indexOf(a.cue) - lines.indexOf(b.cue));
  // Narrative text: continue the story one sentence at a time.
  const sentences = raw.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(Boolean);
  const pairs: { cue: DialogueLine; reply: string }[] = [];
  for (let i = 1; i < sentences.length; i++) {
    const len = sentences[i].split(/\s+/).length;
    if (len >= 3 && len <= 12) pairs.push({ cue: { speaker: '', text: sentences[i - 1] }, reply: sentences[i] });
  }
  return seededPick(pairs, n, seed);
}

/**
 * v2 lessons (authored content), same four bites:
 *  1 Learn    – narrated teach cards in pairs, each pair checked at once, then match
 *  2 Practice – the authored tasks: recognise first (choose, listen, match), then produce (build, fill, speak)
 *  3 Scene    – the short dialogue, then its questions
 *  4 Mission  – reply to Smarty in your own words
 */
function deriveV2Bites(text: V2Text, recycle: string[]): BiteDef[] {
  const words = lessonWords(text);
  const id = text.id;
  const own = new Set(words);
  const older = [...new Set(recycle.map((w) => w.trim().toLowerCase()))].filter((w) => w && !own.has(w)).slice(0, 3);
  const learn: BiteStep[] = [];
  for (let i = 0; i < words.length; i += 2) {
    const group = words.slice(i, i + 2);
    learn.push({ kind: 'teach', words: group });
    learn.push({ kind: 'definition-quiz', words: words.slice(0, i + group.length).slice(-3) });
  }
  if (words.length >= 3) learn.push({ kind: 'word-match', words });
  const drill: BiteStep[] = [{ kind: 'v2-recognise' }, { kind: 'v2-produce' }];
  if (older.length >= 2) drill.push({ kind: 'word-review', words: older, free: true });
  // Review lessons teach nothing new: they start straight at practice.
  const plan: [BiteKind, BiteStep[], number, boolean][] = [
    ...(learn.length ? [['learn', learn, 3, false] as [BiteKind, BiteStep[], number, boolean]] : []),
    ['drill', drill, 4, true],
    ['story', [{ kind: 'scene' }, { kind: 'v2-scene-quiz' }], 2, true],
    ['mission', [{ kind: 'mission-reply' }], 2, true],
  ];
  return plan.map(([kind, steps, est, costsHearts], index) => ({ id: `${id}#${index}`, passageId: id, index, kind, steps, estMinutes: est, costsHearts }));
}
