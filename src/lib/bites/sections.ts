/**
 * Sections = the five CEFR levels, shown one after another on the path.
 * A section is open when it's at or below the placement level, when the
 * section before it is finished, or after passing its jump test.
 */
import type { Level, ReadingText } from '../reading-logic';
import { readScopedJSON, writeScopedJSON } from '../userStorage';
import { lessonBiteState } from './biteProgress';

export const SECTIONS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
/** Score needed on a jump test to open the section. */
export const SECTION_PASS = 80;

const KEY = 'section_jumps_v1';
type Jumps = Record<string, number>; // lang -> highest section index opened by a test

export function passedJumpIndex(lang: string): number {
  return readScopedJSON<Jumps>(KEY, {})[lang] ?? -1;
}

export function passSectionTest(lang: string, level: Level) {
  const idx = SECTIONS.indexOf(level);
  const all = readScopedJSON<Jumps>(KEY, {});
  if (idx > (all[lang] ?? -1)) writeScopedJSON(KEY, { ...all, [lang]: idx });
}

export function sectionComplete(lang: string, texts: ReadingText[]): boolean {
  return texts.length > 0 && texts.every((tx) => lessonBiteState(lang as never, tx).complete);
}

export function isSectionOpen(lang: string, level: Level, textsByLevel: Record<Level, ReadingText[]>, startingLevel?: Level): boolean {
  const idx = SECTIONS.indexOf(level);
  if (idx <= 0) return true;
  if (startingLevel && idx <= SECTIONS.indexOf(startingLevel)) return true;
  if (idx <= passedJumpIndex(lang)) return true;
  return sectionComplete(lang, textsByLevel[SECTIONS[idx - 1]] || []);
}
