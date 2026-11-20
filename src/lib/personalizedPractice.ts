import type { BiteStep, StepKind } from './bites/types';
import type { StepScore } from './bites/session';
import type { PracticeMode } from './practicePools';
import { calculateSM2, type SRSData } from './srs.ts';

export type PracticeSkill = 'recognition' | 'recall' | 'listening' | 'speaking';
export type SkillScore = { correct: number; wrong: number; at: number };
export type WordSkills = Partial<Record<PracticeSkill, SkillScore>> & { schedule?: SRSData & { at: number } };
export type PracticeMastery = Record<string, Record<string, WordSkills>>;
const normalize = (word: string) => word.trim().toLowerCase();
const skills: PracticeSkill[] = ['recognition', 'recall', 'listening', 'speaking'];
function seededOrder(values: string[], seed: string): string[] {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    state = Math.imul(state ^ (state >>> 16), 2246822507);
    const other = (state >>> 0) % (index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function practiceSkill(kind: StepKind): PracticeSkill {
  if (kind === 'listening-match' || kind === 'audio-dictation') return 'listening';
  if (kind === 'pronunciation' || kind === 'read-back-shadowing') return 'speaking';
  if (kind === 'spelling-practice' || kind === 'word-scramble' || kind === 'sentence-reorder') return 'recall';
  return 'recognition';
}

/** Keep the latest result for each skill across devices, with bounded sync size. */
export function mergePracticeMastery(a: PracticeMastery = {}, b: PracticeMastery = {}): PracticeMastery {
  const merged: PracticeMastery = {};
  for (const source of [a, b]) for (const [lang, words] of Object.entries(source || {})) {
    if (!/^[a-z]{2}$/.test(lang) || !words || typeof words !== 'object' || Array.isArray(words)) continue;
    for (const [raw, scores] of Object.entries(words)) {
      const word = normalize(raw);
      if (!word || !scores || typeof scores !== 'object') continue;
      for (const skill of skills) {
        const score = scores[skill];
        if (!score || !Number.isFinite(score.at) || !Number.isFinite(score.correct) || !Number.isFinite(score.wrong) || score.correct < 0 || score.wrong < 0) continue;
        const target = merged[lang] ??= {};
        const item = target[word] ??= {};
        if (!item[skill] || score.at >= item[skill]!.at) item[skill] = { correct: score.correct, wrong: score.wrong, at: score.at };
      }
      const schedule = scores.schedule;
      if (schedule && [schedule.at, schedule.nextReviewDate, schedule.interval, schedule.repetition, schedule.easeFactor].every(Number.isFinite) && schedule.interval >= 0 && schedule.repetition >= 0 && schedule.easeFactor >= 1.3) {
        const item = (merged[lang] ??= {})[word] ??= {};
        if (!item.schedule || schedule.at >= item.schedule.at) item.schedule = { ...schedule };
      }
    }
  }
  const recent = Object.entries(merged).flatMap(([lang, words]) => Object.entries(words).map(([word, scores]) => ({ lang, word, scores, at: Math.max(...Object.values(scores).map(value => value!.at)) })))
    .sort((left, right) => right.at - left.at).slice(0, 300);
  const result: PracticeMastery = {};
  for (const entry of recent) (result[entry.lang] ??= {})[entry.word] = entry.scores;
  return result;
}

/** Retries support learning, but never erase the original mistake from the schedule. */
export function applyPracticeScores(previous: PracticeMastery, lang: string, scores: StepScore[], now = Date.now()): PracticeMastery {
  const next: PracticeMastery = { [lang]: {} };
  const reviewed = new Set<string>(), missed = new Set<string>();
  for (const score of scores) {
    if (score.retry || score.skipped) continue;
    const skill = practiceSkill(score.kind);
    const wrong = new Set(score.mistakes.map(normalize));
    const correct = new Set(score.correctWords.map(normalize));
    for (const word of new Set([...wrong, ...correct])) {
      if (!word) continue;
      reviewed.add(word);
      if (wrong.has(word)) missed.add(word);
      const item = next[lang][word] ??= {};
      const old = item[skill] || previous[lang]?.[word]?.[skill] || { correct: 0, wrong: 0, at: 0 };
      item[skill] = { correct: old.correct + (wrong.has(word) ? 0 : 1), wrong: old.wrong + (wrong.has(word) ? 1 : 0), at: now };
    }
  }
  for (const word of reviewed) next[lang][word].schedule = { ...calculateSM2(missed.has(word) ? 1 : 4, previous[lang]?.[word]?.schedule, now), at: now };
  return mergePracticeMastery(previous, next);
}

const need = (score?: SkillScore) => !score ? 2 : (score.wrong + 1) / (score.correct + 1);

/** Pick urgent items first; vary equal-priority items each session, never the live deck. */
export function selectPracticeWords(mode: PracticeMode, pool: string[], vocab: Record<string, { srs?: { nextReviewDate: number } }>, mastery: Record<string, WordSkills>, mistakes: Record<string, { count: number }>, seed: string, now = Date.now(), size = 6): string[] {
  const values = new Map(Object.entries(vocab).map(([word, value]) => [normalize(word), value]));
  const skill: PracticeSkill = mode === 'listening' ? 'listening' : mode === 'speaking' ? 'speaking' : 'recall';
  const mixed = seededOrder([...new Set(pool.map(normalize))], seed);
  const priority = (word: string) => {
    const dates = [values.get(word)?.srs?.nextReviewDate, mastery[word]?.schedule?.nextReviewDate].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const due = dates.length ? Math.min(...dates) : undefined;
    const overdue = due != null && due <= now ? 5 + Math.min(5, (now - due) / 86_400_000) : due == null ? 3 : 0;
    const weakness = need(mastery[word]?.[skill]);
    const resolved = need(mastery[word]?.recognition) < 0.5 && need(mastery[word]?.recall) < 0.5;
    return mode === 'mistakes' ? (mistakes[word]?.count || 0) * (resolved ? 0.1 : 10) + weakness
      : mode === 'review' ? overdue * 10 + weakness
      : weakness * 10 + overdue;
  };
  return mixed.sort((a, b) => priority(b) - priority(a)).slice(0, size);
}

/** Short, interleaved recognition → guided recall → independent recall sessions. */
export function personalizedSteps(mode: PracticeMode, words: string[], mastery: Record<string, WordSkills>): BiteStep[] {
  if (!words.length) return [];
  const steps: BiteStep[] = [];
  const choose = (word: string, second: boolean): StepKind => {
    const scores = mastery[word] || {};
    if (mode === 'speaking') return second ? 'listening-match' : 'pronunciation';
    if (mode === 'listening') return second ? 'word-scramble' : 'listening-match';
    if (mode === 'translate') return 'definition-quiz';
    if (mode === 'truefalse') return 'true-false-quiz';
    if (mode === 'scramble') return 'word-scramble';
    if (mode === 'spell') return 'spelling-practice';
    const familiar = (scores.recognition?.correct || 0) > (scores.recognition?.wrong || 0) + 1;
    if (!second && !familiar) return 'definition-quiz';
    if (!second && need(scores.listening) >= need(scores.recall)) return 'listening-match';
    const independent = (scores.recall?.correct || 0) > (scores.recall?.wrong || 0) + 1;
    return independent ? 'spelling-practice' : 'word-scramble';
  };
  if (mode === 'match') return [{ kind: 'word-match', words: words.slice(0, 5) }];
  for (const word of words) steps.push({ kind: choose(word, false), words: [word] });
  // Delayed retrieval: revisit the first words after several different questions.
  const target = Math.min(10, words.length * 2);
  for (let index = 0; steps.length < target; index++) {
    const word = words[index % words.length];
    steps.push({ kind: choose(word, true), words: [word] });
  }
  return steps;
}
