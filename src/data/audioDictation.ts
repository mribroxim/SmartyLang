import type { Level } from '../lib/reading-logic';
import { getCMSDocument } from '../firebase';
import { type ContentLang, cmsDocId, readStoredContentLang } from '../lib/contentLang';
import { fetchLangPackText } from '../lib/langPacks';
import {
  applyArabicDisplayMode,
  readStoredArabicDisplayMode,
  type ArabicDisplayMode,
} from '../lib/arabicText';

const cache = new Map<string, string[]>();

function cacheKey(level: Level, lang: ContentLang) {
  return `${lang}:${level}`;
}

/** Call after saving customDictation to Firestore so the cache re-fetches. */
export function invalidateDictationCache(): void {
  cache.clear();
}

function levelToFile(level: Level): string {
  const map: Record<string, string> = {
    'Beginner': 'Beginner.txt',
    'Elementary': 'Elementary.txt',
    'Pre-Intermediate': 'Pre-Intermediate.txt',
    'Intermediate': 'Intermediate.txt',
    'Advanced': 'Advanced.txt',
  };
  return map[level] || 'Intermediate.txt';
}

function parseDictationText(raw: string): string[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.substring(2).trim())
    .filter(Boolean);
}

async function loadSentences(level: Level, lang: ContentLang = 'en'): Promise<string[]> {
  const targetFile = levelToFile(level);
  try {
    const raw =
      lang === 'en'
        ? await (async () => {
            const r = await fetch(`/data/audio-dictation/${targetFile}`);
            if (!r.ok) return null;
            return r.text();
          })()
        : await fetchLangPackText(lang, 'dictation', targetFile);
    if (!raw) return [];
    return parseDictationText(raw);
  } catch {
    return [];
  }
}

function transformSentences(
  sentences: string[],
  lang: ContentLang,
  arabicDisplayMode: ArabicDisplayMode,
): string[] {
  if (lang !== 'ar' || arabicDisplayMode === 'with-harakat') return sentences;
  return sentences.map((sentence) => applyArabicDisplayMode(sentence, arabicDisplayMode));
}

/**
 * Exported so the admin panel can load built-in sentences for display/editing.
 */
export async function loadBuiltInSentences(
  level: Level,
  lang: ContentLang = 'en',
  arabicDisplayMode: ArabicDisplayMode = readStoredArabicDisplayMode(),
): Promise<string[]> {
  return transformSentences(await loadSentences(level, lang), lang, arabicDisplayMode);
}

export async function getRandomDictation(
  level: Level,
  count: number = 3,
  lang: ContentLang = readStoredContentLang(),
  arabicDisplayMode: ArabicDisplayMode = readStoredArabicDisplayMode(),
): Promise<string[]> {
  const key = cacheKey(level, lang);
  if (!cache.has(key)) {
    const docId = cmsDocId('customDictation', lang);
    const [base, doc] = await Promise.all([
      loadSentences(level, lang),
      getCMSDocument(docId),
    ]);
    if (doc?.override?.[level] !== undefined) {
      cache.set(key, (doc.override[level] as string[]).filter(Boolean));
    } else {
      const custom = (doc?.levels?.[level] ?? []).filter(Boolean);
      cache.set(key, [...base, ...custom]);
    }
  }
  const sentences = cache.get(key)!;
  if (sentences.length === 0) return [];
  const shuffled = [...sentences].sort(() => Math.random() - 0.5);
  return transformSentences(
    shuffled.slice(0, Math.min(count, shuffled.length)),
    lang,
    arabicDisplayMode,
  );
}
