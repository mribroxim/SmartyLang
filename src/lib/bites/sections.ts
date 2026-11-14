/**
 * Sections = the five CEFR levels, shown one after another on the path.
 * A section is open when it's at or below the placement level, when the
 * section before it is finished, or after passing its jump test.
 */
import type { Level, ReadingText } from '../reading-logic';
import { readScopedJSON, writeScopedJSON } from '../userStorage';
import { lessonBiteState } from './biteProgress';
import { registerSyncedStore } from '../syncedStores';

export const SECTIONS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
/** Score needed on a jump test to open the section. */
export const SECTION_PASS = 80;

const KEY = 'section_jumps_v1';
type Jumps = Record<string, number>; // lang -> highest section index opened by a test
const listeners = new Set<() => void>();
export function normalizeJumps(raw: unknown): Jumps {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([lang, idx]) => /^[a-z]{2}$/.test(lang) && Number.isInteger(idx) && Number(idx) >= 0 && Number(idx) < SECTIONS.length)) as Jumps;
}
export function mergeJumps(a: Jumps, b: Jumps): Jumps {
  const out = { ...a };
  for (const [lang, idx] of Object.entries(b)) out[lang] = Math.max(out[lang] ?? -1, idx);
  return out;
}

export function passedJumpIndex(lang: string): number {
  return normalizeJumps(readScopedJSON(KEY, {}))[lang] ?? -1;
}

export function passSectionTest(lang: string, level: Level) {
  const idx = SECTIONS.indexOf(level);
  const all = readScopedJSON<Jumps>(KEY, {});
  if (idx > (all[lang] ?? -1)) { writeScopedJSON(KEY, { ...all, [lang]: idx }); listeners.forEach(fn => fn()); }
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

registerSyncedStore({ key: KEY, snapshot: () => normalizeJumps(readScopedJSON(KEY, {})), apply: raw => { writeScopedJSON(KEY, mergeJumps(normalizeJumps(readScopedJSON(KEY, {})), normalizeJumps(raw))); }, subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn); }; } });
