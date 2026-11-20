import { useEffect, useState } from 'react';
import type { Level, ReadingText } from '../lib/reading-logic';
import { getCMSDocument } from '../firebase';
import { type ContentLang, cmsDocId, readStoredContentLang } from '../lib/contentLang';
import { readStoredArabicDisplayMode, transformArabicContent } from '../lib/arabicText';
import { useContentLang } from '../contexts/ContentLangContext';
import { fetchLangPackJson } from '../lib/langPacks';
import { applyCourse, rememberCourse, LEVEL_OF_SECTION, type V2Course } from '../lib/lessons/v2';

/** New step-by-step courses (v2), listed in public/data/course/index.json by scripts/content/build-course.mjs. */
let courseIndex: Promise<{ lang: string; section: string }[]> | null = null;
const listCourses = (bust: string) => (courseIndex ??= fetch(`/data/course/index.json?${bust}`).then(r => (r.ok ? r.json() : [])).catch(() => []));

export type LevelTexts = Record<Level, ReadingText[]>;

export const EMPTY_LEVEL_TEXTS: LevelTexts = {
  'Beginner': [],
  'Elementary': [],
  'Pre-Intermediate': [],
  'Intermediate': [],
  'Advanced': [],
};

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

const _promiseByLang: Partial<Record<ContentLang, Promise<LevelTexts>>> = {};
const _cachedByLang: Partial<Record<ContentLang, LevelTexts>> = {};

/** Call after saving customReadingTexts to Firestore so the cache re-fetches. */
export function invalidateLevelTextsCache(lang?: ContentLang): void {
  if (lang) {
    delete _promiseByLang[lang];
    delete _cachedByLang[lang];
  } else {
    for (const k of Object.keys(_promiseByLang) as ContentLang[]) {
      delete _promiseByLang[k];
      delete _cachedByLang[k];
    }
  }
}

/**
 * Fetches level reading texts.
 * EN: /level-texts.json + cmsContent/customReadingTexts
 * Other langs: lang pack + cmsContent/customReadingTexts__{lang} (CMS override wins)
 */
export function loadLevelTexts(lang: ContentLang = readStoredContentLang()): Promise<LevelTexts> {
  if (_cachedByLang[lang]) return Promise.resolve(_cachedByLang[lang]!);
  if (!_promiseByLang[lang]) {
    _promiseByLang[lang] = (async () => {
      const docId = cmsDocId('customReadingTexts', lang);
      // Bust long-lived CDN/browser caches when content JSON changes (version bump).
      const VOCAB_CACHE_BUST = 'v20260826d';
      const basePromise =
        lang === 'en'
          ? fetch(`/level-texts.json?${VOCAB_CACHE_BUST}`).then(r => r.json()).catch(() => EMPTY_LEVEL_TEXTS)
          : fetchLangPackJson<LevelTexts>(lang, 'level-texts.json').then(d => d ?? EMPTY_LEVEL_TEXTS);

      const coursesPromise = listCourses(VOCAB_CACHE_BUST).then(list => Promise.all(list.filter(c => c.lang === lang).map(({ section }) =>
        fetch(`/data/course/${lang}-${section}.json?${VOCAB_CACHE_BUST}`).then(r => (r.ok ? r.json() as Promise<V2Course> : null)).catch(() => null))));
      const [base, doc, courses] = await Promise.all([basePromise, getCMSDocument(docId), coursesPromise]);
      const merged: LevelTexts = { ...EMPTY_LEVEL_TEXTS };
      for (const level of LEVELS) {
        const baseLevel = base[level] ?? [];
        if (doc?.override?.[level] !== undefined) {
          const overrideLevel = (doc.override[level] as ReadingText[]).filter((t: any) => !t.archived);
          // Empty CMS overrides used to wipe the whole level (looked like "language shows nothing").
          merged[level] = overrideLevel.length > 0 || baseLevel.length === 0 ? overrideLevel : baseLevel;
        } else {
          merged[level] = [
            ...baseLevel,
            ...(doc?.byLevel?.[level] ?? []).filter((t: any) => !t.archived),
          ];
        }
      }
      for (const course of courses) {
        if (!course?.units?.length) continue;
        rememberCourse(course);
        const level = LEVEL_OF_SECTION[course.section];
        if (level) merged[level] = applyCourse(merged[level], course);
      }
      _cachedByLang[lang] = merged;
      return merged;
    })().catch((err) => {
      console.warn('[level-texts] failed to load:', err);
      delete _promiseByLang[lang];
      return EMPTY_LEVEL_TEXTS;
    });
  }
  return _promiseByLang[lang]!;
}

export function getLevelTextsSync(lang: ContentLang = readStoredContentLang()): LevelTexts {
  return transformArabicContent(
    _cachedByLang[lang] ?? EMPTY_LEVEL_TEXTS,
    lang,
    readStoredArabicDisplayMode(),
  );
}

export function useLevelTexts(): LevelTexts {
  const { contentLang, arabicDisplayMode } = useContentLang();
  const [texts, setTexts] = useState<LevelTexts>(() => _cachedByLang[contentLang] ?? EMPTY_LEVEL_TEXTS);
  useEffect(() => {
    let cancelled = false;
    const cached = _cachedByLang[contentLang];
    if (cached) { setTexts(cached); return; }
    setTexts(EMPTY_LEVEL_TEXTS);
    loadLevelTexts(contentLang).then(data => {
      if (!cancelled) setTexts(data);
    });
    return () => { cancelled = true; };
  }, [contentLang]);
  return transformArabicContent(texts, contentLang, arabicDisplayMode);
}
