import type { Level, ReadingText } from './reading-logic';
import type { ContentLang } from './contentLang';
import { isLessonExercisesComplete, loadLessonUnlock } from './lessonProgress';
import { unitDisplayName } from './unitNames';
import { isV2 } from './lessons/v2';

export const LESSONS_PER_UNIT = 10;

export interface LessonUnit {
  id: string;
  index: number;
  /** Number shown to the learner (v2 courses may start at Unit 0). */
  number: number;
  /** Display label, e.g. "Unit 1" */
  title: string;
  /** Theme hint from the first lesson in the unit */
  subtitle: string;
  lessonIds: string[];
  lessons: ReadingText[];
}

/**
 * Lesson ranges per unit: v2 courses say which unit each lesson belongs to
 * (units vary in length); older content is grouped in tens.
 */
export function unitRanges(texts: ReadingText[]): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (let i = 0; i < texts.length;) {
    const first = texts[i];
    let end = i + 1;
    if (isV2(first)) {
      while (isV2(texts[end]) && (texts[end] as typeof first).v2.unit === first.v2.unit) end++;
    } else {
      while (end < texts.length && end < i + LESSONS_PER_UNIT && !isV2(texts[end])) end++;
    }
    out.push({ start: i, end });
    i = end;
  }
  return out;
}

/** Which unit (0-based) a lesson position belongs to. */
export function unitIndexOf(texts: ReadingText[], index: number): number {
  return unitRanges(texts).findIndex((r) => index >= r.start && index < r.end);
}

export function buildLessonUnits(texts: ReadingText[], level: Level): LessonUnit[] {
  const units: LessonUnit[] = [];
  for (const [unitIndex, r] of unitRanges(texts).entries()) {
    const chunk = texts.slice(r.start, r.end);
    if (!chunk.length) continue;
    units.push({
      id: `${level.toLowerCase().replace(/\s+/g, '-')}-unit-${unitIndex + 1}`,
      index: unitIndex,
      // v2 courses carry their own unit titles and numbers.
      number: isV2(chunk[0]) ? chunk[0].v2.unit : unitIndex + 1,
      title: isV2(chunk[0]) ? (chunk[0].unitName || unitDisplayName(level, unitIndex)) : unitDisplayName(level, unitIndex),
      subtitle: `Unit ${isV2(chunk[0]) ? chunk[0].v2.unit : unitIndex + 1} · ${chunk[0].title}`,
      lessonIds: chunk.map((t) => t.id),
      lessons: chunk,
    });
  }
  return units;
}

export function isLessonComplete(lang: ContentLang, lessonId: string): boolean {
  return isLessonExercisesComplete(loadLessonUnlock(lang, lessonId));
}

/** All lessons in a level are open — no sequential gating. */
export function isLessonUnlockedInOrder(
  _lang: ContentLang,
  _orderedIds: string[],
  _lessonIndex: number,
): boolean {
  return true;
}

/** All units in a level are open — no sequential gating. */
export function isUnitUnlocked(
  _lang: ContentLang,
  _units: LessonUnit[],
  _unitIndex: number,
): boolean {
  return true;
}

export function unitProgress(
  lang: ContentLang,
  unit: LessonUnit,
): { complete: number; total: number } {
  const complete = unit.lessonIds.filter((id) => isLessonComplete(lang, id)).length;
  return { complete, total: unit.lessonIds.length };
}

export function findNextLesson(
  lang: ContentLang,
  texts: ReadingText[],
): { index: number; text: ReadingText; unitIndex: number } | null {
  const orderedIds = texts.map((t) => t.id);
  for (let i = 0; i < texts.length; i++) {
    if (!isLessonComplete(lang, texts[i].id) && isLessonUnlockedInOrder(lang, orderedIds, i)) {
      return {
        index: i,
        text: texts[i],
        unitIndex: unitIndexOf(texts, i),
      };
    }
  }
  return null;
}

export function lessonIndexInLevel(texts: ReadingText[], lessonId: string): number {
  return texts.findIndex((t) => t.id === lessonId);
}
