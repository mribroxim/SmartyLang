/// <reference types="vite/client" />
import type { Level } from '../lib/reading-logic';
import { getCMSDocument } from '../firebase';
import { type ContentLang, cmsDocId, readStoredContentLang } from '../lib/contentLang';
import { fetchLangPackJson } from '../lib/langPacks';

interface Question {
  id: number;
  text: string;
  options: string[];
  answer: number;
}

export interface ReadingPassage {
  passage: string;
  questions: Question[];
  level: string;
  title: string;
  archived?: boolean;
}

// Fetched from public/data/comprehensive-reading/ at runtime — keeps the
// 966 KB text file out of the JS bundle.
let parsedData: ReadingPassage[] | null = null;
const packCache: Partial<Record<Exclude<ContentLang, 'en'>, ReadingPassage[]>> = {};

function parseComprehensiveReading(text: string): ReadingPassage[] {
  const results: ReadingPassage[] = [];
  const lines = text.split('\n');
  let currentLevel = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.toUpperCase().startsWith('LEVEL:')) {
      currentLevel = line.replace(/^LEVEL:\s*/i, '').trim();
      i++;
      continue;
    }

    const readingMatch = line.match(/^Reading\s+\d+:\s*(.+)/i);
    if (readingMatch && currentLevel) {
      const title = readingMatch[1].trim();
      const passageLines: string[] = [];
      i++;

      while (i < lines.length) {
        const pl = lines[i].trim();
        if (/^\d+\./.test(pl) || pl.startsWith('Answer Key:') || pl.match(/^Reading\s+\d+:/i)) break;
        if (pl && !/^[=\-_*#]{3,}$/.test(pl)) passageLines.push(pl);
        i++;
      }

      const passage = passageLines.join(' ').trim();
      const questions: Question[] = [];

      for (let q = 0; q < 5 && i < lines.length; q++) {
        while (i < lines.length && !lines[i].trim()) i++;
        if (i >= lines.length) break;

        const qLine = lines[i].trim();
        const qMatch = qLine.match(/^\d+\.\s*(.+)/);
        if (!qMatch) break;

        const qText = qMatch[1].trim();
        const options: string[] = [];
        i++;

        for (let o = 0; o < 4 && i < lines.length; o++) {
          while (i < lines.length && !lines[i].trim()) i++;
          if (i >= lines.length) break;

          const optLine = lines[i].trim();
          const optMatch = optLine.match(/^[A-D]\)\s*(.+)/);
          if (optMatch) { options.push(optMatch[1].trim()); i++; }
          else break;
        }

        if (options.length >= 2) {
          questions.push({ id: q + 1, text: qText, options, answer: -1 });
        }
      }

      while (i < lines.length) {
        const akLine = lines[i].trim();
        if (akLine.startsWith('Answer Key:')) {
          const answers = akLine.replace('Answer Key:', '').trim();
          const letters = answers.split(/\s+/).filter(p => /^[A-D]$/.test(p));
          letters.forEach((letter, qi) => {
            if (qi < questions.length) {
              const idx = letter.charCodeAt(0) - 65;
              if (idx >= 0 && idx < 4) questions[qi].answer = idx;
            }
          });
          i++;
          break;
        }
        i++;
      }

      if (passage && questions.length > 0) {
        results.push({ passage, questions, level: currentLevel, title });
      }
      continue;
    }
    i++;
  }
  return results;
}

async function loadAllPassages(): Promise<ReadingPassage[]> {
  if (parsedData) return parsedData;
  try {
    const r = await fetch('/data/comprehensive-reading/Comprehensive_Reading_Materials.txt');
    if (!r.ok) { parsedData = []; return []; }
    const raw = await r.text();
    parsedData = parseComprehensiveReading(raw);
    return parsedData;
  } catch {
    parsedData = [];
    return [];
  }
}

async function loadLangPackPassages(lang: Exclude<ContentLang, 'en'>): Promise<ReadingPassage[]> {
  if (packCache[lang]) return packCache[lang]!;
  const data = await fetchLangPackJson<ReadingPassage[]>(lang, 'comprehensive-reading.json');
  packCache[lang] = Array.isArray(data) ? data : [];
  return packCache[lang]!;
}

/**
 * Exported so the admin panel can load built-in passages for a level to display/edit.
 */
export async function loadBuiltInReadingPassages(level: Level, lang: ContentLang = 'en'): Promise<ReadingPassage[]> {
  const all = lang === 'en' ? await loadAllPassages() : await loadLangPackPassages(lang);
  return all.filter(p => p.level.toLowerCase() === level.toLowerCase());
}

/** Call after saving customComprehensiveReading to reset the cache. */
export function invalidateCompReadingCache(): void {
  parsedData = null;
  for (const k of Object.keys(packCache) as Exclude<ContentLang, 'en'>[]) {
    delete packCache[k];
  }
}

export async function getReadingPassagesForLevel(
  level: Level,
  lang: ContentLang = readStoredContentLang(),
): Promise<ReadingPassage[]> {
  const docId = cmsDocId('customComprehensiveReading', lang);
  const builtInPromise =
    lang === 'en' ? loadAllPassages() : loadLangPackPassages(lang);

  const [all, doc] = await Promise.all([builtInPromise, getCMSDocument(docId)]);

  // If admin has saved a full override for this level, use it exclusively.
  if (doc?.override?.[level] !== undefined) {
    return (doc.override[level] as ReadingPassage[]).filter(p => !p.archived);
  }

  // Otherwise merge built-in + legacy custom additions (non-archived).
  const builtIn = all.filter(p => p.level.toLowerCase() === level.toLowerCase());
  const custom: ReadingPassage[] = (doc?.byLevel?.[level] ?? []).filter((p: any) => p && !p.archived);
  return [...builtIn, ...custom];
}

export async function getRandomReadingPassage(
  level: Level,
  lang: ContentLang = readStoredContentLang(),
): Promise<ReadingPassage | null> {
  const passages = await getReadingPassagesForLevel(level, lang);
  if (passages.length === 0) return null;
  return passages[Math.floor(Math.random() * passages.length)];
}
