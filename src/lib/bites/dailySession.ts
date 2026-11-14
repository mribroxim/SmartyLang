import { useSyncExternalStore } from 'react';
import type { ContentLang } from '../contentLang';
import type { ReadingText, Level } from '../reading-logic';
import { todayKey } from '../habitEngine';
import { scopedKey, writeScopedJSON } from '../userStorage';
import { registerSyncedStore } from '../syncedStores';
import { seededPick } from './deriveBites';
import { findCurrentLesson } from './biteProgress';
import { loadLessonUnlock } from '../lessonProgress';
import { mergeDailyProgress, type DailyCompletion, type DailyProgress } from './dailyRewards';
export { mergeDailyProgress } from './dailyRewards';
export type { DailyCompletion } from './dailyRewards';

export interface ReviewWord { word: string; definition: string; source: 'new' | 'review' | 'missed' }
export interface ReviewVocab { [word: string]: { definition: string; lang?: string; srs?: { nextReviewDate: number }; timestamp?: number } }
export interface DailySession { v: 1; date: string; lang: ContentLang; passageId: string; items: ReviewWord[] }
export interface DailyInput {
  lang: ContentLang;
  date: string;
  nextText: ReadingText;
  texts: ReadingText[];
  vocab: ReviewVocab;
  missed: string[];
  now: number;
}

const normalize = (word: string) => word.trim().toLowerCase();
export function wordCatalog(texts: ReadingText[], vocab: ReviewVocab, lang: ContentLang): Map<string, string> {
  const catalog = new Map<string, string>();
  for (const text of texts) for (const item of text.vocabulary || []) {
    if (item.word.trim() && item.definition) catalog.set(normalize(item.word), item.definition);
  }
  for (const [word, value] of Object.entries(vocab)) {
    if ((!value.lang || value.lang === lang) && value.definition) catalog.set(normalize(word), value.definition);
  }
  return catalog;
}

/** Seeded 3 new + 5 due + 3 missed words, with deterministic backfill for new accounts. */
export function deriveDailySession(input: DailyInput): DailySession {
  const { lang, date, nextText, vocab, now } = input;
  const catalog = wordCatalog(input.texts, vocab, lang);
  const seen = new Set<string>();
  const items: ReviewWord[] = [];
  const add = (words: string[], count: number, source: ReviewWord['source'], salt: string) => {
    const candidates = [...new Set(words.map(normalize))].filter(word => catalog.has(word) && !seen.has(word)).sort();
    for (const word of seededPick(candidates, count, `${lang}:${date}:${salt}`)) {
      seen.add(word); items.push({ word, definition: catalog.get(word)!, source });
    }
  };
  const nextWords = nextText.vocabulary.map(v => normalize(v.word));
  add(nextWords.filter(word => !vocab[word]), 3, 'new', 'new');
  add(Object.entries(vocab).filter(([, v]) => (!v.lang || v.lang === lang) && v.srs && v.srs.nextReviewDate <= now).map(([word]) => word), 5, 'review', 'due');
  add(input.missed, 3, 'missed', 'missed');
  const target = 11;
  if (items.length < target) add(Object.keys(vocab).filter(word => !vocab[word].lang || vocab[word].lang === lang), target - items.length, 'review', 'saved');
  if (!items.length) add(nextWords, 3, 'new', 'lesson');
  // A new learner has no review history yet: revisit the three new words
  // in both directions instead of introducing eleven unfamiliar words.
  const base = [...items];
  while (items.length && items.length < target) items.push({ ...base[items.length % base.length], source: 'review' });
  return { v: 1, date, lang, passageId: nextText.id, items };
}

function readLocal<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(scopedKey(key)) || 'null') ?? fallback; } catch { return fallback; }
}

/** Freeze the day's selection, even when SRS dates or path progress change later. */
export function getDailySession(lang: ContentLang, level: Level, textsByLevel: Record<Level, ReadingText[]>, vocab: ReviewVocab, problemWords: Record<string, { count: number }>, now = Date.now()): DailySession | null {
  const date = todayKey(new Date(now));
  const cache = readLocal<Partial<Record<ContentLang, DailySession>>>('today_session_v1', {});
  const existing = cache[lang];
  if (existing?.v === 1 && existing.date === date && existing.lang === lang && Array.isArray(existing.items) && existing.items.length > 0) return existing;
  const texts = textsByLevel[level] || [];
  const next = findCurrentLesson(lang, texts)?.text ?? texts[0] ?? Object.values(textsByLevel).flat()[0];
  if (!next) return null;
  const missed = [...Object.keys(problemWords).sort((a, b) => problemWords[b].count - problemWords[a].count), ...texts.flatMap(text => loadLessonUnlock(lang, text.id).missedWords)];
  const session = deriveDailySession({ lang, date, nextText: next, texts: Object.values(textsByLevel).flat(), vocab, missed, now });
  if (!session.items.length) return null;
  writeScopedJSON('today_session_v1', { ...cache, [lang]: session });
  return session;
}

/** Six no-stakes items; missed words take precedence over the ordinary review pool. */
export function deriveHeartPractice(lang: ContentLang, texts: ReadingText[], vocab: ReviewVocab, missed: string[], seed: string): ReviewWord[] {
  const catalog = wordCatalog(texts, vocab, lang);
  const weak = [...new Set(missed.map(normalize))].filter(word => catalog.has(word));
  const chosen = seededPick(weak.sort(), 6, seed);
  const other = [...catalog.keys()].filter(word => !chosen.includes(word)).sort();
  chosen.push(...seededPick(other, 6 - chosen.length, `${seed}:fill`));
  const base = [...chosen];
  while (chosen.length && chosen.length < 6) chosen.push(base[chosen.length % base.length]);
  return chosen.map(word => ({ word, definition: catalog.get(word)!, source: 'missed' }));
}

const PROGRESS_KEY = 'today_bites_v1';
const listeners = new Set<() => void>();
let revision = 0;
const emit = () => { revision++; listeners.forEach(fn => fn()); };
export const subscribeDaily = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useDailyProgress() { useSyncExternalStore(subscribeDaily, () => revision, () => revision); }
export function dailyCompletion(lang: ContentLang, date = todayKey()): DailyCompletion | null {
  return readLocal<DailyProgress>(PROGRESS_KEY, {})[`${date}:${lang}`] ?? null;
}
/** Claim the daily XP once; a later successful replay may still earn its heart. */
export function completeDailySession(lang: ContentLang, date: string, accuracy: number): { xp: boolean; heart: boolean } {
  const all = readLocal<DailyProgress>(PROGRESS_KEY, {});
  const key = `${date}:${lang}`;
  const prev = all[key];
  const xp = !prev?.xpAwarded;
  const heart = accuracy >= 80 && !prev?.heartAwarded;
  const next = { ...all, [key]: { completedAt: Date.now(), best: Math.max(prev?.best ?? 0, accuracy), xpAwarded: true, heartAwarded: !!prev?.heartAwarded || heart } };
  const recent = Object.fromEntries(Object.entries(next).sort(([a], [b]) => b.localeCompare(a)).slice(0, 90));
  writeScopedJSON(PROGRESS_KEY, recent);
  emit();
  return { xp, heart };
}

registerSyncedStore({
  key: 'todayBites',
  snapshot: () => readLocal<DailyProgress>(PROGRESS_KEY, {}),
  apply: remote => {
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return;
    const before = readLocal<DailyProgress>(PROGRESS_KEY, {});
    const next = mergeDailyProgress(before, remote as DailyProgress);
    if (JSON.stringify(before) !== JSON.stringify(next)) { writeScopedJSON(PROGRESS_KEY, next); emit(); }
  },
  subscribe: subscribeDaily,
});
