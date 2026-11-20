/**
 * Lesson content v2 (content/<lang>/<section>/unit-*.json, bundled into
 * public/data/course/<lang>-<section>.json): small, step-by-step lessons with
 * teach cards, authored practice, a short scene and a mission.
 *
 * The app's path, progress and workshop all run on ReadingText, so each v2
 * lesson becomes a ReadingText that carries the original under `v2`. It keeps
 * the old lesson id for its position (b1…b100), so existing progress stays.
 */
import type { Level, ReadingText } from '../reading-logic';

export interface V2Image { id: string; describe: string }
export interface V2Item { id: string; text: string; kind: 'word' | 'phrase' | 'pattern'; forms?: string[]; example: string; note?: string; image?: V2Image }
interface TaskBase { id: string; kind: string; prompt: string; explanation: string; itemIds: string[]; answer?: string; answers?: string[] }
export type V2Task =
  | (TaskBase & { kind: 'choice'; options: string[] })
  | (TaskBase & { kind: 'listen'; audio: string; options: string[] })
  | (TaskBase & { kind: 'build'; tiles: string[] })
  | (TaskBase & { kind: 'fill'; text: string; options?: string[] })
  | (TaskBase & { kind: 'match'; pairs: { left: string; right: string }[] })
  | (TaskBase & { kind: 'speak'; text: string });
export interface V2Turn { smarty: string; accept: string[]; example: string; hint: string; itemIds: string[] }
export interface V2Lesson {
  id: string; section: string; unit: number; lesson: number; title: string; canDo: string; scenario: string;
  items: V2Item[];
  grammar?: { title: string; explanation: string; examples: string[] };
  practice: V2Task[];
  story: { hook?: string; lines: { speaker: string; text: string }[]; questions: V2Task[]; image?: V2Image };
  mission: { setup: string; turns: V2Turn[]; image?: V2Image };
  recycle: string[];
  type?: 'lesson' | 'review' | 'test';
  /** B1+: words met glossed in the scene (not tested). */
  exposure?: { text: string; gloss?: string }[];
}
export interface V2Course { lang: string; section: string; version: number; units: { unit: number; title: string; room?: string; lessons: V2Lesson[] }[] }

export type V2Text = ReadingText & { v2: V2Lesson };
export const isV2 = (t: ReadingText | undefined | null): t is V2Text => !!t && !!(t as V2Text).v2;

export const LEVEL_OF_SECTION: Record<string, Level> = { beginner: 'Beginner', elementary: 'Elementary', 'pre-intermediate': 'Pre-Intermediate', intermediate: 'Intermediate', advanced: 'Advanced' };

/** Picture files are language-neutral: one set serves every course. */
export const wordImage = (id: string) => `/img/words/${id}.png`;
export const sceneImage = (id: string) => `/img/scenes/${id}.png`;

/** One v2 lesson as a ReadingText. `fallbackId` keeps the old lesson's id at the same position. */
export function lessonToText(lesson: V2Lesson, unitTitle: string, fallbackId?: string): V2Text {
  return {
    id: fallbackId || lesson.id,
    title: lesson.title,
    text: lesson.story.lines.map((l) => `${l.speaker}: ${l.text}`).join('\n'),
    targetSeconds: Math.max(20, lesson.story.lines.length * 6),
    vocabulary: lesson.items.map((i) => ({ word: i.text, definition: i.note || i.example })),
    languageGoal: lesson.canDo,
    communicationGoal: lesson.scenario,
    unit: lesson.unit,
    unitName: unitTitle,
    format: 'dialogue',
    v2: lesson,
  };
}

/**
 * Replace a level's lessons with the course's, position by position (unit u
 * lesson l → index (u-1)*10 + l-1). Positions the course doesn't cover yet keep
 * the old lesson, so a partly written course still works.
 */
export function applyCourse(old: ReadingText[], course: V2Course): ReadingText[] {
  // Units can have any number of lessons: lessons take positions in course order.
  const lessons = [...course.units].sort((a, b) => a.unit - b.unit).flatMap((u) => u.lessons.map((l) => ({ l, title: u.title })));
  const out = lessons.map(({ l, title }, at) => lessonToText(l, title, old[at]?.id));
  // A partly written course keeps the old lessons after its last written one.
  return out.length >= old.length ? out : [...out, ...old.slice(out.length)];
}

/** Items by id across the whole course (recycled items come from earlier lessons). */
export function courseItems(course: V2Course): Map<string, V2Item> {
  return new Map(course.units.flatMap((u) => u.lessons.flatMap((l) => l.items.map((i) => [i.id, i] as const))));
}

const ITEMS = new Map<string, V2Item>();
/** Loaded courses register their items so lessons can look up recycled ones. */
export function rememberCourse(course: V2Course) { for (const [id, item] of courseItems(course)) ITEMS.set(id, item); }
export const itemById = (id: string): V2Item | undefined => ITEMS.get(id);

/** "i'm" → "i am", punctuation out. Must stay identical to `tokens()` in scripts/content/validate-lessons.mjs, which checks mission examples. */
const CONTRACTIONS: Record<string, string> = { "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "what's": 'what is', "where's": 'where is', "name's": 'name is', "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "aren't": 'are not', "can't": 'can not', "i've": 'i have', "i'll": 'i will' };
const FR_ELISION = /^(l|d|j|m|t|s|c|n|qu|jusqu|lorsqu|puisqu)'(.+)$/u;
export function normalizeReply(text: string, lang = 'en'): string {
  let s = text.normalize('NFKC').toLowerCase().replace(/[’‘ʼʻ`]/g, "'");
  if (lang === 'ar') s = s.replace(/[ً-ٰٟـ]/gu, '').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي');
  if (lang === 'zh') return (s.match(/\p{Script=Han}|[a-z0-9üāáǎàēéěèīíǐìōóǒòūúǔù]+/gu) || []).join(' ');
  const words = s.match(/[\p{L}\p{M}\p{N}]+(?:'[\p{L}\p{M}\p{N}]+)*/gu) || [];
  return words.flatMap((w) => {
    if (lang === 'en' && CONTRACTIONS[w]) return CONTRACTIONS[w].split(' ');
    const el = lang === 'fr' ? w.match(FR_ELISION) : null;
    return el ? [`${el[1]}'`, el[2]] : [w];
  }).join(' ');
}

/**
 * Does a typed mission reply work? Either it matches one of the turn's
 * patterns, or it's a short reply that uses one of the turn's target items
 * (so "Hello! Nice to meet you." passes a "say hello" turn).
 */
/** Same variants as replyVariants() in the content checker: normal, apostrophes/hyphens dropped ("oclock", "lets"), or spaced ("t shirt"). */
export function replyVariants(reply: string, lang = 'en'): string[] {
  const raw = reply.normalize('NFKC').toLowerCase().replace(/[’‘ʼʻ`]/g, "'");
  const clean = (s: string) => s.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  return [...new Set([normalizeReply(reply, lang), clean(raw.replace(/(\p{L})['-](\p{L})/gu, '$1$2')), clean(raw.replace(/[-']/g, ' '))])];
}

export function acceptsReply(reply: string, accept: string[], keys: string[] = [], lang = 'en'): boolean {
  const text = normalizeReply(reply, lang);
  if (!text || text.length > 200) return false;
  const variants = replyVariants(reply, lang);
  if (accept.some((p) => { try { const re = new RegExp(p, 'iu'); return variants.some((v) => re.test(v)); } catch { return false; } })) return true;
  const padded = ` ${text} `;
  return text.split(' ').length <= (lang === 'zh' ? 40 : 14) && keys.some((k) => { const n = normalizeReply(k, lang); return !!n && padded.includes(` ${n} `); });
}
