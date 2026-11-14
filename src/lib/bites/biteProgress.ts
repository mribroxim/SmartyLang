/**
 * Bite progress on top of the existing LessonUnlock records. No migration:
 * a bite counts as done if it was recorded, or if the learner already passed
 * every exercise in it under the old 12-step flow.
 */
import type { ContentLang } from '../contentLang';
import type { ReadingText } from '../reading-logic';
import {
  LESSON_PASS_THRESHOLD,
  loadLessonUnlock,
  isLessonExercisesComplete,
  updateLessonUnlock,
  type LessonUnlock,
} from '../lessonProgress';
import { deriveBites } from './deriveBites';
import type { BiteDef, BiteRecord, BiteResult } from './types';
import type { StepScore } from './session';

export function recordBiteStep(lang: ContentLang, passageId: string, score: StepScore): LessonUnlock {
  if (score.skipped) return loadLessonUnlock(lang, passageId);
  const patch: Partial<LessonUnlock> = { missedWords: score.mistakes };
  if (score.kind === 'vocab-intro') patch.vocabPassed = true;
  else if (score.kind === 'read-aloud') patch.readingBest = score.percent;
  else {
    patch.exerciseBest = { [score.kind]: score.percent };
    if (score.kind === 'definition-quiz' && !score.retry) patch.vocabQuizScore = score.percent;
  }
  return updateLessonUnlock(lang, passageId, patch);
}

export function recordBiteCompletion(lang: ContentLang, result: BiteResult): LessonUnlock {
  const { def } = result;
  const prev = loadLessonUnlock(lang, def.passageId).bites?.[def.index];
  return updateLessonUnlock(lang, def.passageId, {
    bites: { [def.index]: {
      best: Math.max(prev?.best ?? 0, result.accuracy),
      completedAt: Date.now(),
      perfect: prev?.perfect || result.perfect,
      attempts: (prev?.attempts ?? 0) + 1,
    } },
    missedWords: result.mistakes,
  });
}

export function biteDone(unlock: LessonUnlock, def: BiteDef): boolean {
  if (unlock.bites?.[def.index]?.completedAt) return true;
  return def.steps.every((s) => {
    if (s.kind === 'vocab-intro') return unlock.vocabPassed;
    if (s.kind === 'read-aloud') return unlock.readingBest != null;
    return (unlock.exerciseBest[s.kind] ?? 0) >= LESSON_PASS_THRESHOLD;
  });
}

export function biteBest(unlock: LessonUnlock, def: BiteDef): number | null {
  const rec: BiteRecord | undefined = unlock.bites?.[def.index];
  if (rec) return rec.best;
  if (!biteDone(unlock, def)) return null;
  const scores = def.steps.filter(s => s.kind !== 'vocab-intro').map(s =>
    s.kind === 'read-aloud' ? unlock.readingBest ?? 0 : unlock.exerciseBest[s.kind] ?? 0);
  return scores.length ? Math.min(...scores) : 100;
}

export interface LessonBiteState {
  defs: BiteDef[];
  done: boolean[];
  doneCount: number;
  total: number;
  /** Index of the next bite to take (first not done), or -1 when all done. */
  next: number;
  complete: boolean;
  /** All bites at ≥80% (or legacy all-exercises passed). */
  mastered: boolean;
}

export function lessonBiteState(lang: ContentLang, text: ReadingText): LessonBiteState {
  const unlock = loadLessonUnlock(lang, text.id);
  const defs = deriveBites(text);
  const done = defs.map((d) => biteDone(unlock, d));
  const doneCount = done.filter(Boolean).length;
  const next = done.findIndex((d) => !d);
  const mastered = isLessonExercisesComplete(unlock) ||
    defs.every((d) => (biteBest(unlock, d) ?? 0) >= LESSON_PASS_THRESHOLD);
  return { defs, done, doneCount, total: defs.length, next, complete: next === -1, mastered };
}

/** First lesson in order that still has an unfinished bite. */
export function findCurrentLesson(lang: ContentLang, texts: ReadingText[]): { index: number; text: ReadingText; bite: number } | null {
  for (let i = 0; i < texts.length; i++) {
    const st = lessonBiteState(lang, texts[i]);
    if (!st.complete) return { index: i, text: texts[i], bite: st.next };
  }
  return null;
}
