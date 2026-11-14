/**
 * Heuristics: does this word/phrase belong in the current learning language?
 * Used to keep vocabulary lists language-separated.
 */
import type { ContentLang } from './contentLang';
import { CONTENT_LANG_NATIVE } from './contentLang';

/** Distinctive scripts — mismatch = hard reject. */
const SCRIPT_RE: Partial<Record<ContentLang, RegExp>> = {
  ru: /[\u0400-\u04FF]/,
  uk: /[\u0400-\u04FF]/,
  el: /[\u0370-\u03FF]/,
  ar: /[\u0600-\u06FF]/,
  fa: /[\u0600-\u06FF]/,
  ur: /[\u0600-\u06FF]/,
  hi: /[\u0900-\u097F]/,
  th: /[\u0E00-\u0E7F]/,
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/,
  zh: /[\u4E00-\u9FFF]/,
  ko: /[\uAC00-\uD7AF]/,
};

const LATINISH = /[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ]/;
const HAS_CJK = /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/
const HAS_CYR = /[\u0400-\u04FF]/
const HAS_ARABIC = /[\u0600-\u06FF]/
const HAS_DEVANAGARI = /[\u0900-\u097F]/
const HAS_THAI = /[\u0E00-\u0E7F]/
const HAS_GREEK = /[\u0370-\u03FF]/

export type LangMatchResult = { ok: true } | { ok: false; reason: string };

export function wordMatchesLearningLang(word: string, lang: ContentLang): LangMatchResult {
  const w = String(word || '').trim();
  if (!w) return { ok: false, reason: 'Enter a word or phrase.' };
  const native = CONTENT_LANG_NATIVE[lang] || lang;

  const script = SCRIPT_RE[lang];
  if (script) {
    if (!script.test(w)) {
      return {
        ok: false,
        reason: `"${w}" doesn’t look like ${native}. Switch your learning language, or type a ${native} word/phrase.`,
      };
    }
    return { ok: true };
  }

  // Latin-script learning languages: reject clearly foreign scripts.
  if (HAS_CJK.test(w) || HAS_CYR.test(w) || HAS_ARABIC.test(w) || HAS_DEVANAGARI.test(w) || HAS_THAI.test(w) || HAS_GREEK.test(w)) {
    return {
      ok: false,
      reason: `"${w}" isn’t written in ${native}. Vocabulary is saved separately for each learning language.`,
    };
  }

  // Prefer some Latin letters for Latin langs (allow digits/punctuation around them).
  if (!LATINISH.test(w) && !/\d/.test(w)) {
    return {
      ok: false,
      reason: `"${w}" doesn’t look like ${native}.`,
    };
  }

  return { ok: true };
}
