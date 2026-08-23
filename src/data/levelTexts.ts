import { useEffect, useState } from 'react';
import type { Level, ReadingText } from '../lib/reading-logic';
import { getCMSDocument } from '../firebase';
import { type ContentLang, cmsDocId, readStoredContentLang } from '../lib/contentLang';
import { readStoredArabicDisplayMode, transformArabicContent } from '../lib/arabicText';
import { useContentLang } from '../contexts/ContentLangContext';
import { fetchLangPackJson } from '../lib/langPacks';

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
      const VOCAB_CACHE_BUST = 'v20260820c';
      const basePromise =
        lang === 'en'
          ? fetch(`/level-texts.json?${VOCAB_CACHE_BUST}`).then(r => r.json()).catch(() => EMPTY_LEVEL_TEXTS)
          : fetchLangPackJson<LevelTexts>(lang, 'level-texts.json').then(d => d ?? EMPTY_LEVEL_TEXTS);

      const [base, doc] = await Promise.all([basePromise, getCMSDocument(docId)]);
      const merged: LevelTexts = { ...EMPTY_LEVEL_TEXTS };
      for (const level of LEVELS) {
        if (doc?.override?.[level] !== undefined) {
          merged[level] = (doc.override[level] as ReadingText[]).filter((t: any) => !t.archived);
        } else {
          merged[level] = [
            ...(base[level] ?? []),
            ...(doc?.byLevel?.[level] ?? []).filter((t: any) => !t.archived),
          ];
        }
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
