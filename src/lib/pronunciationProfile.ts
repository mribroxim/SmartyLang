/**
 * Per-language pronunciation / reading-alignment profiles for all ContentLangs.
 * Centralizes RTL, tokenization, match mode, and honest capability tiers so
 * reading practice is not English-centric.
 */

import { CONTENT_LANGS, SPEECH_LOCALE, type ContentLang } from './contentLang';

export type TextDir = 'ltr' | 'rtl';
export type TokenizeMode = 'whitespace' | 'segmenter' | 'chars';
/** Alignment strategy after normalizeForMatch. */
export type PronMatchMode = 'levenshtein' | 'soft-cjk' | 'exactish';
/**
 * full — ASR + alignment expected to work reasonably with Web Speech
 * beta — usable but ASR coverage/quality is weaker; UI may note limited confidence
 * listen-only — scoring not trustworthy yet (reserved; none start here)
 */
export type PronunciationTier = 'full' | 'beta' | 'listen-only';

export interface PronunciationProfile {
  dir: TextDir;
  tokenize: TokenizeMode;
  matchMode: PronMatchMode;
  tier: PronunciationTier;
  speechLocale: string;
}

const RTL_LANGS: ReadonlySet<ContentLang> = new Set(['ar', 'fa', 'ur']);

/** Weaker / less common Web Speech ASR — honest beta tier. */
const BETA_LANGS: ReadonlySet<ContentLang> = new Set([
  'uz', 'sw', 'ms', 'tl', 'th', 'ur',
]);

const SEGMENTER_LANGS: ReadonlySet<ContentLang> = new Set(['zh', 'ja', 'th']);
const SOFT_CJK_LANGS: ReadonlySet<ContentLang> = new Set(['zh', 'ja']);

function buildProfile(lang: ContentLang): PronunciationProfile {
  const dir: TextDir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  const tokenize: TokenizeMode = SEGMENTER_LANGS.has(lang)
    ? (lang === 'zh' ? 'chars' : 'segmenter')
    : 'whitespace';
  const matchMode: PronMatchMode = SOFT_CJK_LANGS.has(lang)
    ? 'soft-cjk'
    : lang === 'th'
      ? 'exactish'
      : 'levenshtein';
  const tier: PronunciationTier = BETA_LANGS.has(lang) ? 'beta' : 'full';
  return {
    dir,
    tokenize,
    matchMode,
    tier,
    speechLocale: SPEECH_LOCALE[lang],
  };
}

const PROFILE_CACHE: Record<ContentLang, PronunciationProfile> = Object.fromEntries(
  CONTENT_LANGS.map(lang => [lang, buildProfile(lang)])
) as Record<ContentLang, PronunciationProfile>;

export function getPronunciationProfile(lang: ContentLang): PronunciationProfile {
  return PROFILE_CACHE[lang] ?? PROFILE_CACHE.en;
}

export function isRtlLang(lang: ContentLang): boolean {
  return getPronunciationProfile(lang).dir === 'rtl';
}

/** True when on-device Whisper-tiny.en may be used (English only). */
export function canUseEnglishWhisper(lang: ContentLang): boolean {
  return lang === 'en';
}

const HAS_SEGMENTER =
  typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function';

/** CJK ideograph / kana / hangul / thai as single-char tokens; Latin/Cyrillic as runs. */
function tokenizeCharsFallback(text: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      tokens.push(buf);
      buf = '';
    }
  };

  for (const ch of text.normalize('NFC')) {
    if (/\s/u.test(ch)) {
      flush();
      continue;
    }
    // CJK Unified + Ext A/B (common), kana, hangul syllables, Thai letters
    if (
      /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/u.test(ch)
    ) {
      flush();
      tokens.push(ch);
    } else if (/[\p{L}\p{N}'’-]/u.test(ch)) {
      buf += ch;
    } else {
      flush();
      if (ch) tokens.push(ch);
    }
  }
  flush();
  return tokens;
}

function tokenizeWithSegmenter(text: string, locale: string): string[] {
  if (!HAS_SEGMENTER) return tokenizeCharsFallback(text);
  try {
    const seg = new (Intl as any).Segmenter(locale, { granularity: 'word' });
    const tokens: string[] = [];
    for (const part of seg.segment(text) as Iterable<{ segment: string; isWordLike?: boolean }>) {
      const s = part.segment;
      if (!s || /^\s+$/u.test(s)) continue;
      tokens.push(s);
    }
    return tokens.length ? tokens : tokenizeCharsFallback(text);
  } catch {
    return tokenizeCharsFallback(text);
  }
}

function tokenizeWhitespace(text: string): string[] {
  return text.trim().split(/\s+/u).filter(Boolean);
}

/**
 * Language-aware word tokens for display + alignment.
 * zh/ja/th prefer Intl.Segmenter (or char fallback for zh); others use whitespace.
 */
export function tokenizeForLang(text: string, lang: ContentLang): string[] {
  if (!text?.trim()) return [];
  const profile = getPronunciationProfile(lang);
  const locale = profile.speechLocale;

  if (profile.tokenize === 'whitespace') {
    return tokenizeWhitespace(text);
  }

  if (profile.tokenize === 'segmenter') {
    return tokenizeWithSegmenter(text, locale);
  }

  // chars — try segmenter first, then char fallback (zh)
  if (HAS_SEGMENTER) {
    const segs = tokenizeWithSegmenter(text, locale);
    // If segmenter returned one giant token (no word breaks), fall back to chars
    if (segs.length === 1 && segs[0].replace(/\s/g, '').length > 8) {
      return tokenizeCharsFallback(text);
    }
    return segs;
  }
  return tokenizeCharsFallback(text);
}

/** Join display tokens back into readable text (no spurious spaces for CJK/Thai). */
export function joinTokens(tokens: string[], lang: ContentLang): string {
  const mode = getPronunciationProfile(lang).tokenize;
  if (mode === 'whitespace') {
    return tokens.join(' ').replace(/\s+/g, ' ').trim();
  }
  // segmenter / chars: glue script runs; keep spaces only where source had Latin gaps
  let out = '';
  for (const t of tokens) {
    if (!t) continue;
    if (!out) {
      out = t;
      continue;
    }
    const prev = out[out.length - 1];
    const next = t[0];
    const prevScript = /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/u.test(prev);
    const nextScript = /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/u.test(next);
    if (prevScript && nextScript) {
      out += t;
    } else if (/\s/u.test(prev) || /\s/u.test(next)) {
      out += t;
    } else if (/[\p{L}\p{N}]/u.test(prev) && /[\p{L}\p{N}]/u.test(next) && !prevScript && !nextScript) {
      out += ' ' + t;
    } else {
      out += t;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Normalize a token for pronunciation matching.
 * NFC + script-aware variants + Unicode letter/number clean (never ASCII-only).
 */
export function normalizeForMatch(token: string, lang: ContentLang): string {
  let t = (token || '').normalize('NFC');

  if (lang === 'ar' || lang === 'fa' || lang === 'ur') {
    // Strip Arabic diacritics / tatweel; fold common letter variants
    t = t
      .replace(/[\u064B-\u065F\u0670\u0640]/gu, '')
      .replace(/[أإآٱ]/gu, 'ا')
      .replace(/ة/gu, 'ه')
      .replace(/ى/gu, 'ي')
      .replace(/ؤ/gu, 'و')
      .replace(/ئ/gu, 'ي');
  }

  if (lang === 'ko') {
    // NFC already; soft-strip trailing particles when the stem is long enough
    t = t.replace(/(이|가|을|를|은|는|도|만|에|에서|으로|로|와|과|의|께|한테)$/u, (m, _p, offset, s) =>
      (s as string).length - m.length >= 2 ? '' : m
    );
  }

  // Case fold where the script has case; no-op for others
  t = t.toLowerCase();
  return t.replace(/[^\p{L}\p{N}'’-]/gu, '');
}
