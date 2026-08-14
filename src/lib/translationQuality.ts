/**
 * Translation text hygiene. Provider scoring used to live here when the
 * browser called MyMemory directly; lookups now go through vocabDb + the
 * server fallback, so this file only filters unusable strings.
 */

export const TRANS_CACHE_VERSION = 'v6';

const GARBAGE_RE = [
  /^\*?\s*see\s+p\.?\s*\d+/i,
  /^\*?\s*see\s+(page|pages|above|below|entry|note)\b/i,
  /\bsee\s+p\.?\s*\d+/i,
  /mymemory\s*warning/i,
  /invalid\s*language\s*pair/i,
  /query\s*length\s*limit/i,
  /please\s*select\s*two\s*distinct/i,
  /^https?:\/\//i,
  /^www\./i,
  /^\[\d+\]$/,
  /^\(\*+\)$/,
  /^n\/?a$/i,
  /^null$/i,
  /^undefined$/i,
];

export function normalizeTranslationQuery(q: string): string {
  return q.trim().normalize('NFC').toLocaleLowerCase();
}

export function isGarbageTranslation(text: string | null | undefined, source?: string): boolean {
  if (!text) return true;
  const t = text.trim();
  if (!t) return true;
  if (t.length > 400) return true;
  for (const re of GARBAGE_RE) {
    if (re.test(t)) return true;
  }
  if (/^(cf\.|ibid\.|op\.\s*cit)/i.test(t)) return true;
  if (!/\p{L}/u.test(t)) return true;
  if (source && t.toLocaleLowerCase() === source.trim().toLocaleLowerCase()) {
    const srcHasLatin = /[a-z]/i.test(source);
    const outHasLatin = /[a-z]/i.test(t);
    const srcHasCyr = /[а-яёіїєґ]/i.test(source);
    const outHasCyr = /[а-яёіїєґ]/i.test(t);
    if (srcHasCyr === outHasCyr && srcHasLatin === outHasLatin) return true;
  }
  return false;
}

export function decodeTranslationEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function sanitizeDefinitionText(text: string): string {
  let t = String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return '';
  if (isGarbageTranslation(t)) return '';
  t = t.replace(/^\*+\s*/, '');
  t = t.replace(/^\([^)]{0,40}\)\s*/u, '').trim();
  return t;
}
