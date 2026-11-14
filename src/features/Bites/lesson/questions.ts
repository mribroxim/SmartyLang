/**
 * Builds lesson questions for one bite step from its words / passage.
 * Pure (apart from Math.random) so a step's questions are made once and kept.
 */
import type { BiteStep } from '../../../lib/bites/types';
import type { ContentLang } from '../../../lib/contentLang';
import type { ReadingText } from '../../../lib/reading-logic';
import { generateClozeItems, generateComprehensionQuestions } from '../../Lessons/generators';

export type Question =
  /** prompt: word = meaning of a word, audio = pick what you hear, cloze = fill the ______ in `show`, text = a question about the story. */
  | { type: 'choice'; id: string; word: string; prompt: 'word' | 'audio' | 'cloze' | 'text'; show: string; options: string[]; answer: string }
  | { type: 'tf'; id: string; word: string; def: string; answer: boolean }
  | { type: 'tiles'; id: string; word: string; mode: 'letters' | 'words'; hint: string; audio?: string; tiles: string[]; answer: string[] }
  /** sentence = graded word by word (dictation), audio-only prompt. */
  | { type: 'type'; id: string; word: string; hint: string; answer: string; sentence?: boolean }
  | { type: 'speak'; id: string; word: string; target: string; mode: 'word' | 'sentence' }
  | { type: 'pairs'; id: string; pairs: { word: string; def: string }[] };

/** Step kinds the lesson engine renders natively. */
export const NATIVE_KINDS = new Set<BiteStep['kind']>([
  'definition-quiz', 'true-false-quiz', 'listening-match', 'word-scramble', 'sentence-reorder', 'spelling-practice', 'word-match',
  'cloze', 'comprehension', 'audio-dictation', 'pronunciation', 'read-back-shadowing',
]);

/** Steps graded by speech recognition (never cost hearts; can be skipped). */
export const SPEECH_KINDS = new Set<BiteStep['kind']>(['pronunciation', 'read-back-shadowing']);

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

/** Filler meanings when a bite has too few words for 4 options. */
const FILLER = ['To move quickly', 'A place to live', 'Very small', 'To feel happy', 'A kind of food', 'Not easy'];

function distractors(pool: string[], answer: string, n: number): string[] {
  const seen = new Set([answer.toLowerCase()]);
  const out: string[] = [];
  for (const d of shuffle(pool)) {
    const k = d.toLowerCase();
    if (!d || seen.has(k)) continue;
    seen.add(k); out.push(d);
    if (out.length === n) return out;
  }
  for (const f of FILLER) { if (out.length === n) break; if (!seen.has(f.toLowerCase())) out.push(f); }
  return out;
}

/** Mid-sentence gaps: lowercase option capitals ("Name" → "name") so the case gives nothing away. Keeps "I" and acronyms. */
function caseForGap(blanked: string, w: string): string {
  const startsSentence = !blanked.split('______')[0].trim() || /[.!?]\s*$/.test(blanked.split('______')[0]);
  if (startsSentence || w === 'I' || /^\p{Lu}{2,}/u.test(w)) return w;
  return w.charAt(0).toLowerCase() + w.slice(1);
}

/**
 * Sentences for dictation / read-back from \`offset\`: prefer 3–16 words (one-word
 * lines like "Hello!" make weak items), wrap around, fall back to anything.
 */
function pickSentences(all: string[], offset: number, n: number): string[] {
  if (!all.length) return [];
  const start = offset < all.length ? offset : 0;
  const ordered = [...all.slice(start), ...all.slice(0, start)];
  const words = (s: string) => s.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  const good = ordered.filter((s) => words(s) >= 3 && words(s) <= 16);
  return (good.length ? good : ordered).slice(0, n);
}

/** Words around a ______ gap (how much context the learner gets). */
const contextWords = (blanked: string) => blanked.replace('______', ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;

export interface BuildInput {
  step: BiteStep;
  /** word → meaning for this step's words. */
  defs: Record<string, string>;
  /** Wider pool of meanings (whole passage) for wrong options. */
  meaningPool: string[];
  /** Wider pool of words for wrong options. */
  wordPool: string[];
  sentences: string[];
  /** Passage + language, for story-based steps (cloze, comprehension). */
  text?: ReadingText;
  lang?: ContentLang;
}

export function buildQuestions({ step, defs, meaningPool, wordPool, sentences, text, lang }: BuildInput): Question[] {
  const words = Object.keys(defs).filter((w) => defs[w]);
  const order = shuffle(words);
  switch (step.kind) {
    case 'definition-quiz':
      return order.map((w) => ({
        type: 'choice', id: w, word: w, prompt: 'word', show: w,
        answer: defs[w], options: shuffle([defs[w], ...distractors([...words.map((x) => defs[x]), ...meaningPool], defs[w], 3)]),
      }));
    case 'listening-match':
      return order.map((w) => ({
        type: 'choice', id: w, word: w, prompt: 'audio', show: w,
        answer: w, options: shuffle([w, ...distractors([...words, ...wordPool], w, 3)]),
      }));
    case 'true-false-quiz':
      return order.map((w) => {
        const other = shuffle(words.filter((x) => x !== w && defs[x] !== defs[w]))[0];
        return Math.random() < 0.5 || !other
          ? { type: 'tf', id: w, word: w, def: defs[w], answer: true }
          : { type: 'tf', id: w, word: w, def: defs[other], answer: false };
      });
    case 'word-scramble':
      return order.filter((w) => w.length >= 2).map((w) => {
        const letters = [...w];
        let tiles = shuffle(letters);
        for (let k = 0; k < 4 && tiles.join('') === w && w.length > 2; k++) tiles = shuffle(letters);
        return { type: 'tiles', id: w, word: w, mode: 'letters', hint: defs[w], tiles, answer: letters };
      });
    case 'spelling-practice':
      return order.map((w) => ({ type: 'type', id: w, word: w, hint: defs[w], answer: w }));
    case 'sentence-reorder': {
      const list = sentences
        .map((s) => s.trim())
        .filter((s) => { const n = s.split(/\s+/).length; return n >= 3 && n <= 14; })
        .slice(0, step.maxItems ?? 4);
      const extra = shuffle(wordPool.filter((w) => /^[\p{L}'’-]+$/u.test(w))).slice(0, 8);
      return list.map((s, i) => {
        const answer = s.split(/\s+/);
        const lower = new Set(answer.map((x) => x.toLowerCase().replace(/[^\p{L}'’-]/gu, '')));
        const decoys = extra.filter((w) => !lower.has(w.toLowerCase())).slice(0, answer.length > 8 ? 1 : 2);
        return { type: 'tiles', id: String(i), word: s, mode: 'words', hint: '', audio: s, tiles: shuffle([...answer, ...decoys]), answer };
      });
    }
    case 'word-match': {
      const pairs = order.slice(0, 5).map((w) => ({ word: w, def: defs[w] }));
      return pairs.length >= 2 ? [{ type: 'pairs', id: 'pairs', pairs }] : [];
    }
    case 'cloze': {
      if (!text || !lang) return [];
      const vocabWords = (text.vocabulary || []).map((v) => v.word);
      // Generate extra, then keep gaps with at least two words of context around them.
      const items = generateClozeItems(text.text, text.vocabulary || [], lang, (step.maxItems ?? 5) + 6, text.format);
      const good = items.filter((it) => contextWords(it.blanked) >= 2);
      return (good.length ? good : items)
        .slice(0, step.maxItems ?? 5)
        .map((it, i) => {
          const answer = caseForGap(it.blanked, it.answer);
          const options = [answer, ...distractors([...vocabWords, ...wordPool].map((w) => caseForGap(it.blanked, w)), answer, 3)];
          return { type: 'choice', id: `cloze-${i}`, word: it.word, prompt: 'cloze', show: it.blanked, answer, options: shuffle(options) };
        });
    }
    case 'comprehension': {
      if (!text || !lang) return [];
      const out: Question[] = [];
      for (const q of generateComprehensionQuestions(text.text, text.vocabulary || [], lang, text.id, (step.maxItems ?? 4) + 4, text.format)) {
        if (new Set(q.options.map((o) => o.toLowerCase())).size !== q.options.length) continue;
        const m = q.prompt.match(/“(.*)”/);
        const answer = q.options[q.correctIndex];
        if (m) {
          // Fill-the-gap question: skip gaps with too little context.
          if (contextWords(m[1]) < 2) continue;
          const opts = q.options.map((o) => caseForGap(m[1], o));
          if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) continue;
          out.push({ type: 'choice', id: q.id, word: q.focusWord ?? answer, prompt: 'cloze', show: m[1], options: opts, answer: caseForGap(m[1], answer) });
        } else {
          out.push({ type: 'choice', id: q.id, word: q.focusWord ?? '', prompt: 'text', show: '', options: q.options, answer });
        }
        if (out.length >= (step.maxItems ?? 4)) break;
      }
      return out;
    }
    case 'audio-dictation':
      return pickSentences(sentences, step.sentenceOffset ?? 0, step.maxItems ?? 3)
        .map((s, i) => ({ type: 'type', id: `dict-${i}`, word: s, hint: '', answer: s, sentence: true }));
    case 'pronunciation':
      return shuffle(step.words?.length ? step.words : words).slice(0, step.maxItems ?? 5).map((w) => ({ type: 'speak', id: `say-${w}`, word: w, target: w, mode: 'word' }));
    case 'read-back-shadowing':
      return pickSentences(sentences, step.sentenceOffset ?? 0, step.maxItems ?? 3)
        .map((s, i) => ({ type: 'speak', id: `shadow-${i}`, word: s, target: s, mode: 'sentence' }));
    default:
      return [];
  }
}

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[’]/g, "'").replace(/[^\p{L}\p{M}\p{N}' ]/gu, '').replace(/\s+/g, ' ').trim();

/** Is a typed answer right? Allows one typo on longer words; `close` = right with a typo. */
export function gradeTyped(typed: string, answer: string): { ok: boolean; close: boolean } {
  const a = norm(typed), b = norm(answer);
  if (a === b) return { ok: true, close: false };
  if (b.length >= 5 && editDistance(a, b) === 1) return { ok: true, close: true };
  return { ok: false, close: false };
}

export function sameTiles(picked: string[], answer: string[]): boolean {
  return norm(picked.join(' ')) === norm(answer.join(' ')) || norm(picked.join('')) === norm(answer.join(''));
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
