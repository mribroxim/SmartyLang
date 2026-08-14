/// <reference types="vite/client" />
import type { Level } from '../lib/reading-logic';
import { getCMSDocument } from '../firebase';

interface Question {
  id: number;
  text: string;
  options: string[];
  answer: number;
}

export interface ListeningPassage {
  passage: string;
  questions: Question[];
  title: string;
  level?: string;
  archived?: boolean;
}

// Fetched from public/data/comprehensive-listening/ at runtime — keeps the
// raw .txt files out of the JS bundle. Each level downloads on first access.
const cache = new Map<string, ListeningPassage[]>();

function parseListeningFile(text: string): ListeningPassage[] {
  const results: ListeningPassage[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const passageMatch = line.match(/^Passage\s+\d+:\s*(.+)/i);

    if (passageMatch) {
      const title = passageMatch[1].trim();
      const passageLines: string[] = [];
      i++;

      while (i < lines.length) {
        const pl = lines[i].trim();
        if (pl.startsWith('Questions:') || pl.match(/^Passage\s+\d+:/i)) break;
        if (pl && !/^[=\-_*#]{3,}$/.test(pl)) passageLines.push(pl);
        i++;
      }

      const passage = passageLines.join(' ').trim();
      const questions: Question[] = [];

      if (lines[i]?.trim().startsWith('Questions:')) i++;

      for (let qIdx = 0; qIdx < 5 && i < lines.length; qIdx++) {
        let qi = i;
        let foundQuestion = false;
        while (qi < lines.length) {
          const qLine = lines[qi].trim();
          if (qLine.match(/^Passage\s+\d+:/i) || qLine.match(/^=+/)) break;
          const qMatch = qLine.match(/^\d+\.\s*(.+)/);
          if (qMatch) {
            const qText = qMatch[1].trim();
            const options: string[] = [];
            qi++;
            for (let o = 0; o < 4 && qi < lines.length; o++) {
              const optLine = lines[qi].trim();
              const optMatch = optLine.match(/^[a-d]\)\s*(.+)/i);
              if (optMatch) { options.push(optMatch[1].trim()); qi++; }
              else break;
            }
            let answer = -1;
            while (qi < lines.length) {
              const al = lines[qi].trim();
              const aMatch = al.match(/^Answer:\s*([a-d])/i);
              if (aMatch) { answer = aMatch[1].toLowerCase().charCodeAt(0) - 97; qi++; break; }
              if (al.match(/^Passage\s+\d+:/i)) break;
              qi++;
            }
            if (qText && options.length >= 2) {
              questions.push({ id: qIdx + 1, text: qText, options, answer });
            }
            i = qi;
            foundQuestion = true;
            break;
          }
          qi++;
        }
        if (!foundQuestion) break;
      }

      if (passage && questions.length > 0) {
        results.push({ passage, questions, title });
      }
      continue;
    }
    i++;
  }

  return results;
}

async function loadListening(level: Level): Promise<ListeningPassage[]> {
  const fileMap: Record<string, string> = {
    'Beginner': 'Beginner.txt',
    'Elementary': 'Elementary.txt',
    'Pre-Intermediate': 'PreIntermediate.txt',
    'Intermediate': 'Intermediate.txt',
    'Advanced': 'Advanced.txt',
  };
  const targetFile = fileMap[level] || 'Intermediate.txt';
  try {
    const r = await fetch(`/data/comprehensive-listening/${targetFile}`);
    if (!r.ok) return [];
    const raw = await r.text();
    return parseListeningFile(raw);
  } catch {
    return [];
  }
}

/**
 * Exported so the admin panel can load built-in passages for a level to display/edit.
 */
export async function loadBuiltInListeningPassages(level: Level): Promise<ListeningPassage[]> {
  return loadListening(level);
}

/** Call after saving customListening to Firestore so the cache re-fetches. */
export function invalidateListeningCache(): void {
  cache.clear();
}

export async function getRandomListeningPassage(level: Level): Promise<ListeningPassage | null> {
  if (!cache.has(level)) {
    await _buildCache(level);
  }
  const passages = cache.get(level)!;
  if (passages.length === 0) return null;
  return passages[Math.floor(Math.random() * passages.length)];
}

export async function getListeningPassagesForLevel(level: Level): Promise<ListeningPassage[]> {
  if (!cache.has(level)) {
    await _buildCache(level);
  }
  return cache.get(level)!;
}

async function _buildCache(level: Level): Promise<void> {
  const [base, doc] = await Promise.all([loadListening(level), getCMSDocument('customListening')]);

  // If admin has saved a full override for this level, use it exclusively.
  if (doc?.override?.[level] !== undefined) {
    cache.set(level, (doc.override[level] as ListeningPassage[]).filter((p: any) => p && !p.archived));
  } else {
    const custom = (doc?.byLevel?.[level] ?? []).filter((p: any) => p && !p.archived);
    cache.set(level, [...base, ...custom]);
  }
}
