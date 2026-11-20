/**
 * Glue between lesson bites and the workshop/house: records each graded step,
 * remembers which words moved up during the current bite, and refreshes the
 * house deliveries + unit milestones when a bite ends.
 */
import type { Level, ReadingText } from '../reading-logic';
import type { StepScore } from '../bites/session';
import { lessonWords } from '../bites/deriveBites';
import { lessonBiteState } from '../bites/biteProgress';
import { unitRanges } from '../lessonUnits';
import { loadLessonUnlock, isLessonExercisesComplete } from '../lessonProgress';
import type { ContentLang } from '../contentLang';
import { recordWorkshop, workshopItems, backfillWorkshop, SECTION_LEVELS } from './store';
import { refineQueue, type Stage } from './model';
import { syncHouse, getHouse, type RoomStat } from '../house/store';
import { PHASES } from '../house/phases';
import { nextGoal, type NextGoal } from '../house/phases';
import { grantGift } from '../smarty/room';

export interface StageMove { word: string; from: Stage; to: Stage }
export interface WorkshopAward { moved: StageMove[]; goal: NextGoal | null; gifts: string[] }

let moves: StageMove[] = [];

export function sectionOf(textsByLevel: Record<Level, ReadingText[]>, passageId: string): number {
  const i = SECTION_LEVELS.findIndex((lvl) => (textsByLevel[lvl] || []).some((tx) => tx.id === passageId));
  return Math.max(0, i);
}

/** Keep only the best (highest) move per word. */
function addMoves(list: StageMove[]) {
  for (const m of list) {
    const prev = moves.find((x) => x.word === m.word);
    if (!prev) moves.push(m); else prev.to = Math.max(prev.to, m.to) as Stage;
  }
}

export function startWorkshopBite() { moves = []; }

/** One graded step of a lesson bite. Only lesson words (and words already in the workshop) are tracked. */
export function recordLessonStep(lang: ContentLang, text: ReadingText, sec: number, score: StepScore) {
  if (score.skipped) return;
  const own = new Set(lessonWords(text));
  const known = workshopItems(lang);
  const keep = (w: string) => { const k = w.trim().toLowerCase(); return own.has(k) || !!known[k]; };
  let correct = score.correctWords.filter(keep);
  // Passing a mission puts every word of the lesson to use (rule: Used has several sources).
  if (score.kind === 'mission-reply' && score.percent >= 60) correct = [...own];
  addMoves(recordWorkshop(lang, score.kind, { correct, wrong: score.mistakes.filter(keep) }, sec));
}

/**
 * One stat per unit that has a room: the unit's words and finished lessons.
 * Stops at the first unit not started, so it stays cheap on long courses.
 */
export function roomStats(lang: ContentLang, textsByLevel: Record<Level, ReadingText[]>): RoomStat[] {
  const out: RoomStat[] = [];
  for (const ph of PHASES) {
    const level = textsByLevel[SECTION_LEVELS[ph.sec]] || [];
    // A room belongs to the unit with its number (courses may start at Unit 0 or 1).
    const ranges = unitRanges(level);
    const byNumber = ranges.find((x) => (level[x.start] as { v2?: { unit: number } }).v2?.unit === ph.unit);
    const r = byNumber ?? (level.length && !(level[0] as { v2?: unknown }).v2 ? ranges[ph.unit - 1] : undefined);
    const texts = r ? level.slice(r.start, r.end) : [];
    if (!texts.length) continue;
    const lessonsDone = texts.filter((tx) => lessonBiteState(lang, tx).complete).length;
    out.push({ id: ph.id, words: texts.flatMap((tx) => lessonWords(tx)), lessonsDone });
    if (!lessonsDone) break;
  }
  return out;
}

/** End of a bite: refresh the house, hand out unit gifts, and report what moved. */
export function finishWorkshopBite(lang: ContentLang, textsByLevel: Record<Level, ReadingText[]>): WorkshopAward {
  const fresh = syncHouse(lang, workshopItems(lang), roomStats(lang, textsByLevel));
  const gifts: string[] = [];
  for (let i = 0; i < fresh; i++) { const g = grantGift(); if (g) gifts.push(g.id); }
  const award = { moved: [...moves].sort((a, b) => b.to - a.to), goal: nextGoal(getHouse().delivered, lang), gifts };
  moves = [];
  return award;
}

/** Older words to mix into a lesson's Practice bite: dusty/due first. */
export function recycleFor(lang: ContentLang, text: ReadingText): string[] {
  const own = new Set(lessonWords(text));
  return refineQueue(workshopItems(lang), Date.now(), 12).filter((w) => !own.has(w)).slice(0, 4);
}

/** One-time import of progress made before the workshop, then a house refresh. */
export function prepareWorkshop(lang: ContentLang, textsByLevel: Record<Level, ReadingText[]>) {
  backfillWorkshop(lang, textsByLevel, (tx) => {
    const st = lessonBiteState(lang, tx);
    if (!st.complete) return null;
    const unlock = loadLessonUnlock(lang, tx.id);
    if (isLessonExercisesComplete(unlock) || st.mastered) return 100;
    const bests = Object.values(unlock.bites ?? {}).map((b) => b.best);
    return bests.length ? Math.min(...bests) : 60;
  });
  syncHouse(lang, workshopItems(lang), roomStats(lang, textsByLevel));
}

/** A review session (Today's bite, Refine): only words already in the workshop move. */
export function recordReviewStep(lang: ContentLang, score: StepScore) {
  if (score.skipped) return;
  const known = workshopItems(lang);
  const keep = (w: string) => !!known[w.trim().toLowerCase()];
  addMoves(recordWorkshop(lang, score.kind, { correct: score.correctWords.filter(keep), wrong: score.mistakes.filter(keep) }, 0));
}

/** End of a review session: report moves and the next house delivery (no unit check needed). */
export function finishReview(lang: ContentLang, textsByLevel: Record<Level, ReadingText[]>): WorkshopAward {
  return finishWorkshopBite(lang, textsByLevel);
}
