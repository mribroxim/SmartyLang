import type { Level, ReadingText } from './reading-logic';
import type { ContentLang } from './contentLang';
import { isLessonExercisesComplete, loadLessonUnlock } from './lessonProgress';
import { unitDisplayName } from './unitNames';

export const LESSONS_PER_UNIT = 10;

export interface LessonUnit {
  id: string;
  index: number;
  /** Display label, e.g. "Unit 1" */
  title: string;
  /** Theme hint from the first lesson in the unit */
  subtitle: string;
  lessonIds: string[];
  lessons: ReadingText[];
}

export function buildLessonUnits(texts: ReadingText[], level: Level): LessonUnit[] {
  const units: LessonUnit[] = [];
  for (let i = 0; i < texts.length; i += LESSONS_PER_UNIT) {
    const chunk = texts.slice(i, i + LESSONS_PER_UNIT);
    if (!chunk.length) continue;
    const unitIndex = Math.floor(i / LESSONS_PER_UNIT);
    units.push({
      id: `${level.toLowerCase().replace(/\s+/g, '-')}-unit-${unitIndex + 1}`,
      index: unitIndex,
      title: unitDisplayName(level, unitIndex),
      subtitle: `Unit ${unitIndex + 1} · ${chunk[0].title}`,
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
        unitIndex: Math.floor(i / LESSONS_PER_UNIT),
      };
    }
  }
  return null;
}

export function lessonIndexInLevel(texts: ReadingText[], lessonId: string): number {
  return texts.findIndex((t) => t.id === lessonId);
}
