import type { ContentLang } from './contentLang';
import {
  getPronunciationProfile,
  normalizeForMatch,
  type PronMatchMode,
} from './pronunciationProfile';

export type Level = 'Beginner' | 'Elementary' | 'Pre-Intermediate' | 'Intermediate' | 'Advanced';

export interface VocabularyItem {
  word: string;
  definition: string;
}

export interface ReadingText {
  id: string;
  title: string;
  text: string;
  targetSeconds: number;
  vocabulary: VocabularyItem[];
  /** Optional curriculum metadata (EN redesign); ignored by older UI. */
  coreQuestion?: string;
  languageGoal?: string;
  communicationGoal?: string;
  grammarFocus?: string[];
  vocabularyDomain?: string;
  unit?: number;
  unitName?: string;
  format?: string;
}

export type WordStatus = 'correct' | 'incorrect' | 'slight_mistake' | 'pending';

export type MatchMode = 'exact' | 'slight' | 'none';

/**
 * Canonical Unicode speech-token cleaner.
 * Prefer normalizeForMatch(token, lang) when the content language is known.
 */
export function cleanSpeechToken(w: string): string {
  return w.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '');
}

/** English-only ASR alias map (Latin-centric homophones / numbers). */
const ENGLISH_ALIAS_MAP: Record<string, string[]> = {
  temur: ['timber', 'teymur', 'tamur', 'taylor', 'tenor', 'tomorrow', 'timur', 'timer'],
  bakhtiyor: ['bakhtiar', 'bachtiyr', 'bahadur', 'bachtior', 'bachtiyor', 'bacterial'],
  malika: ['moleka', 'malacca', 'malik', 'monica'],
  aliev: ['alive', 'olive', 'leave'],
  uzbekistan: ['oozbekistan', 'uzb'],
  twentytwo: ['22'],
  twentythree: ['23'],
  twentyone: ['21'],
  twenty: ['20'],
  ten: ['10'],
  two: ['2', 'to', 'too'],
  five: ['5'],
  four: ['4', 'for'],
  three: ['3'],
  one: ['1', 'won'],
  '900': ['nine', 'nineoclock', '9'],
  '12': ['twelve'],
  '200': ['two', 'twooclock', '2'],
  '500': ['five', 'fiveoclock', '5'],
  '1234567': ['1234567', 'onetwothreefourfivesixseven'],
};

function englishAliasMatch(cleanSource: string, cleanTrans: string): boolean {
  if (ENGLISH_ALIAS_MAP[cleanSource]?.includes(cleanTrans)) return true;
  for (const [key, variants] of Object.entries(ENGLISH_ALIAS_MAP)) {
    if (cleanSource === key && variants.includes(cleanTrans)) return true;
    if (variants.includes(cleanSource) && key === cleanTrans) return true;
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function resolveMatchMode(lang?: ContentLang, matchMode?: PronMatchMode): PronMatchMode {
  if (matchMode) return matchMode;
  if (lang) return getPronunciationProfile(lang).matchMode;
  return 'levenshtein';
}

export function getMatchType(
  cleanSource: string,
  cleanTrans: string,
  lang?: ContentLang,
  matchMode?: PronMatchMode
): MatchMode {
  if (cleanSource === cleanTrans) return 'exact';
  if (!cleanSource || !cleanTrans) return 'none';

  const mode = resolveMatchMode(lang, matchMode);

  // English (or Latin alias) — only when lang is English or unspecified legacy path
  if ((!lang || lang === 'en') && englishAliasMatch(cleanSource, cleanTrans)) {
    return 'exact';
  }

  if (mode === 'soft-cjk') {
    // Single grapheme clusters: exact only
    if (cleanSource.length === 1 || cleanTrans.length === 1) {
      return cleanSource === cleanTrans ? 'exact' : 'none';
    }
    const dist = levenshtein(cleanSource, cleanTrans);
    if (dist === 0) return 'exact';
    const maxLen = Math.max(cleanSource.length, cleanTrans.length);
    if (dist <= 1 && maxLen >= 2) return 'slight';
    // High overlap: shared chars ≥ 70% of shorter
    const shorter = cleanSource.length <= cleanTrans.length ? cleanSource : cleanTrans;
    const longer = cleanSource.length > cleanTrans.length ? cleanSource : cleanTrans;
    let shared = 0;
    const longerChars = [...longer];
    for (const ch of shorter) {
      const idx = longerChars.indexOf(ch);
      if (idx >= 0) {
        shared++;
        longerChars.splice(idx, 1);
      }
    }
    if (shared / shorter.length >= 0.7 && shorter.length >= 2) return 'slight';
    return 'none';
  }

  if (mode === 'exactish') {
    if (cleanSource === cleanTrans) return 'exact';
    const dist = levenshtein(cleanSource, cleanTrans);
    if (cleanSource.length >= 4 && dist <= 1) return 'slight';
    return 'none';
  }

  // levenshtein (default)
  if (cleanSource.length >= 6) {
    if (levenshtein(cleanSource, cleanTrans) <= 2) return 'slight';
  } else if (cleanSource.length >= 4) {
    if (levenshtein(cleanSource, cleanTrans) <= 1) return 'slight';
  }
  return 'none';
}

export function isMatch(
  cleanSource: string,
  cleanTrans: string,
  lang?: ContentLang,
  matchMode?: PronMatchMode
): boolean {
  return getMatchType(cleanSource, cleanTrans, lang, matchMode) !== 'none';
}

export type AlignOptions = {
  lang?: ContentLang;
  matchMode?: PronMatchMode;
};

export function alignWords(
  sourceWords: string[],
  transcriptWords: string[],
  options?: AlignOptions | ContentLang
): WordStatus[] {
  const opts: AlignOptions =
    typeof options === 'string' ? { lang: options } : options || {};
  const { lang, matchMode } = opts;
  const mode = resolveMatchMode(lang, matchMode);

  const status: WordStatus[] = new Array(sourceWords.length).fill('pending');
  // The user can only plausibly have reached a source word roughly as far as the
  // transcript words they spoke (plus a small tolerance for skip-ahead during
  // alignment). If the source "reading head" races further ahead of the consumed
  // transcript than this, the transcript has been exhausted / over-consumed and
  // everything from that point on has not been attempted yet — so it stays pending.
  const MAX_SOURCE_LEAD = 6;
  let s = 0;
  let t = 0;

  // Work on a local copy so we don't mutate caller arrays
  let trans = transcriptWords;
  if (trans.length > sourceWords.length + 50) {
    trans = trans.slice(0, sourceWords.length + 50);
  }

  const clean = (w: string) =>
    lang ? normalizeForMatch(w, lang) : cleanSpeechToken(w);

  while (s < sourceWords.length && t < trans.length) {
    const cleanSource = clean(sourceWords[s]);
    const cleanTrans = clean(trans[t]);

    // Punctuation-only tokens — skip as correct. (Must NOT treat Cyrillic as empty.)
    if (!cleanSource) {
      status[s] = 'correct';
      s++;
      continue;
    }

    if (!cleanTrans) {
      t++;
      continue;
    }

    let combinedTrans = cleanTrans;
    let foundCombinedMatch = false;
    let combinedWordsCount = 1;
    for (let i = 1; i <= 4 && t + i < trans.length; i++) {
      if (isMatch(cleanSource, combinedTrans, lang, mode)) {
        foundCombinedMatch = true;
        break;
      }
      combinedTrans += clean(trans[t + i]);
      combinedWordsCount++;
    }
    if (!foundCombinedMatch && isMatch(cleanSource, combinedTrans, lang, mode)) {
      foundCombinedMatch = true;
    }

    if (foundCombinedMatch) {
      const matchType = getMatchType(cleanSource, combinedTrans, lang, mode);
      status[s] = matchType === 'slight' ? 'slight_mistake' : 'correct';
      s++;
      t += combinedWordsCount;
    } else {
      let foundMatchInTranscript = false;
      for (let i = 1; i <= 3 && t + i < trans.length; i++) {
        const nextTrans = clean(trans[t + i]);
        if (isMatch(cleanSource, nextTrans, lang, mode)) {
          foundMatchInTranscript = true;
          t += i;
          break;
        }
      }

      if (foundMatchInTranscript) {
        // We skipped source word(s) but only advanced the transcript cursor by a
        // bounded lookahead, so the reading head can't have run away from the
        // consumed transcript. Continue aligning while within the read region.
        if (s - t > MAX_SOURCE_LEAD) {
          return status;
        }
        continue;
      }

      let foundMatchInSource = false;
      for (let i = 1; i <= 3 && s + i < sourceWords.length; i++) {
        const nextSource = clean(sourceWords[s + i]);
        if (isMatch(nextSource, cleanTrans, lang, mode)) {
          foundMatchInSource = true;
          for (let j = 0; j < i; j++) {
            status[s + j] = 'incorrect';
          }
          s += i;
          break;
        }
      }

      if (foundMatchInSource) {
        // We consumed `i` source words (marked incorrect) against a single
        // transcript word. If the source head races too far ahead of the
        // transcript cursor, the transcript has been over-consumed and the
        // remaining passage has not been attempted — leave it pending.
        if (s - t > MAX_SOURCE_LEAD) {
          return status;
        }
        continue;
      }

      // No match anywhere in either direction. Only flag this word as incorrect
      // if we are still within the active read region (transcript cursor hasn't
      // been over-consumed). Otherwise the user never reached it — leave pending.
      if (s - t > MAX_SOURCE_LEAD) {
        return status;
      }
      status[s] = 'incorrect';
      s++;
      t++;
    }
  }

  return status;
}
