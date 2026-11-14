/**
 * Language-aware dictionary for the 29 supported learning languages.
 *
 * A word naturally belongs to one of the supported languages — the language
 * the user is studying (the "source language"). Definitions are fetched in
 * that language first. If the user chooses a different display language, the
 * definition is translated on demand rather than looked up in a foreign
 * dictionary (which is why lookups often failed).
 *
 * Lookup pipeline (all in the SOURCE language):
 *   1. English via the Free Dictionary API (most complete).
 *   2. Any other language via Wiktionary's language section.
 */
import { DICT_LANG_CODE } from './contentLang';
import {
  isGarbageTranslation,
  sanitizeDefinitionText,
  decodeTranslationEntities,
} from './translationQuality';
import { translateWithCache } from './networkCache';

export interface DictMeaning {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
  synonyms: string[];
}

export interface DictResult {
  word: string;
  phonetic?: string;
  audio?: string;
  meanings: DictMeaning[];
}

const WIKT_SECTION_CODE: Record<string, string> = {
  en: 'en', ru: 'ru', tl: 'tl', es: 'es', uz: 'uz', de: 'de', fr: 'fr',
  it: 'it', pt: 'pt', ja: 'ja', ko: 'ko', zh: 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh',
  ar: 'ar', tr: 'tr', nl: 'nl', hi: 'hi', pl: 'pl', sv: 'sv', id: 'id',
  ms: 'ms', vi: 'vi', th: 'th', uk: 'uk', el: 'el', cs: 'cs', ro: 'ro',
  fa: 'fa', ur: 'ur', sw: 'sw', ceb: 'ceb',
};

function wiktionarySectionCode(code: string): string {
  return WIKT_SECTION_CODE[code] || code;
}

/** ISO-639-1 code a given code/kebab maps to, for machine translation. */
function mtCode(code: string): string {
  const bare = code.split('-')[0];
  return bare;
}

async function lookupEnglish(word: string): Promise<DictResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    if (!entry) return null;
    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text,
      audio: entry.phonetics?.find((p: any) => p.audio)?.audio,
      meanings: (entry.meanings || []).map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: (m.definitions || []).map((d: any) => ({
          definition: sanitizeDefinitionText(d.definition || ''),
          example: d.example ? sanitizeDefinitionText(d.example) : undefined,
        })).filter((d: any) => d.definition),
        synonyms: m.synonyms || [],
      })),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function lookupWiktionary(
  word: string,
  code: string,
): Promise<DictResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const section = wiktionarySectionCode(code);
    const entries = Array.isArray(data?.[section])
      ? data[section]
      : (Object.entries(data || {}).find(([k]) => {
          const v = k.toLowerCase();
          return v === section.toLowerCase() || (
            code.includes('-') && v === code.split('-')[0]
          );
        })?.[1] as any[] | undefined);
    if (!Array.isArray(entries) || entries.length === 0) return null;

    const meanings: DictMeaning[] = entries.map((e: any) => ({
      partOfSpeech: e.partOfSpeech || 'unknown',
      definitions: (e.definitions || []).slice(0, 8).map((d: any) => ({
        definition: sanitizeDefinitionText(String(d.definition || '')),
        example: d.examples?.[0]
          ? sanitizeDefinitionText(String(d.examples[0]))
          : undefined,
      })).filter((d: any) => d.definition),
      synonyms: [],
    })).filter((m: DictMeaning) => m.definitions.length > 0);

    if (meanings.length === 0) return null;
    return { word, meanings };
  } finally {
    clearTimeout(timer);
  }
}

const ELISION_PREFIXES = [
  /^(?:d|j|l|m|n|s|t|c|qu)['’]/i,
  /^(?:de[ls]|à[ls]|a[ls]|d['’]|dell['’])['’]/i,
];

function asciiFold(word: string): string {
  try {
    return word.normalize('NFD').replace(/\p{M}/gu, '');
  } catch {
    return word;
  }
}

/** Surface → headword candidates (opens → open, café → cafe). */
function lookupCandidates(word: string): string[] {
  const raw = word.trim();
  if (!raw) return [];
  const lower = raw.toLocaleLowerCase();
  const ascii = asciiFold(lower).toLocaleLowerCase();
  const forms: string[] = [raw, lower];
  if (ascii !== lower) forms.push(ascii);

  const stemFrom = (base: string) => {
    if (!/^[a-z][a-z'-]*$/i.test(base)) return;
    if (base.endsWith('ies') && base.length > 4) forms.push(`${base.slice(0, -3)}y`);
    if (base.endsWith('ves') && base.length > 4) {
      forms.push(`${base.slice(0, -3)}f`, `${base.slice(0, -3)}fe`);
    }
    if (/(?:sses|xes|zes|ches|shes)$/.test(base) && base.length > 5) forms.push(base.slice(0, -2));
    if (base.endsWith('es') && base.length > 3) forms.push(base.slice(0, -2));
    if (base.endsWith('s') && !base.endsWith('ss') && base.length > 3) forms.push(base.slice(0, -1));
    if (base.endsWith('ing') && base.length > 5) {
      forms.push(base.slice(0, -3), `${base.slice(0, -3)}e`);
      if (/(.)\1ing$/.test(base)) forms.push(base.slice(0, -4));
    }
    if (base.endsWith('ied') && base.length > 4) forms.push(`${base.slice(0, -3)}y`);
    if (base.endsWith('ed') && base.length > 3) {
      forms.push(base.slice(0, -2), base.slice(0, -1));
      if (/(.)\1ed$/.test(base)) forms.push(base.slice(0, -3));
    }
    if (base.endsWith('ly') && base.length > 4) forms.push(base.slice(0, -2));
  };
  stemFrom(lower);
  if (ascii !== lower) stemFrom(ascii);

  for (const rx of ELISION_PREFIXES) {
    if (rx.test(lower)) {
      const stripped = lower.replace(rx, '').trim();
      if (stripped) forms.push(stripped);
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const f of forms) {
    const t = f.trim();
    if (!t) continue;
    const key = t.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 12);
}

/**
 * Look up a definition for `word` written IN `srcLang` (the word's own
 * language). When `displayLang` differs, translate the returned definitions
 * into `displayLang` so users can read them in any of the 29 languages.
 * Returns null only if every source fails.
 */

/** Rough script/word heuristics to catch Wiktionary results that aren't really in the target language. */
const LANG_SCRIPT: Record<string, RegExp> = {
  ru: /[а-яё]/i,
  uk: /[а-яіїєґ]/i,
  el: /[α-ωάέήίόύώϊΐΰ]/i,
  ar: /[\u0600-\u06FF]/,
  fa: /[\u0600-\u06FF]/,
  ur: /[\u0600-\u06FF]/,
  hi: /[\u0900-\u097F]/,
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/,
  'zh-CN': /[\u4E00-\u9FFF]/,
  'zh-TW': /[\u4E00-\u9FFF]/,
  zh: /[\u4E00-\u9FFF]/,
  ko: /[\uAC00-\uD7AF]/,
  th: /[\u0E00-\u0E7F]/,
};

function isPlausibleLang(result: DictResult, code: string): boolean {
  const bare = code.split('-')[0];
  const re = LANG_SCRIPT[code] || LANG_SCRIPT[bare];
  if (!re) return true; // Latin-script languages: trust Wiktionary
  const sample = (result.meanings || [])
    .flatMap((m: DictMeaning) => m.definitions.map(d => d.definition))
    .join(' ');
  // If the definition clearly uses the expected script, it's in that language.
  // Otherwise (e.g. an interwiki/English stub) reject it.
  return re.test(sample);
}

async function lookupViaProxy(word: string, lang: string): Promise<DictResult | null> {
  try {
    const r = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, lang }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data?.meanings?.length) return null;
    return data as DictResult;
  } catch {
    return null;
  }
}

export async function lookupDictionary(
  word: string,
  srcLang: string,
  displayLang?: string,
): Promise<DictResult | null> {
  const q = word.trim();
  if (!q) return null;
  const code = srcLang === 'en' ? 'en' : srcLang;

  // Server already stems; still send the raw word once. Client fallbacks
  // retry morphology if the proxy is down or returns 404.
  const candidates = lookupCandidates(q);

  let result: DictResult | null = null;

  // Prefer server proxy (reliable CORS / no client blocks), then direct.
  result = await lookupViaProxy(q, code);

  if (!result) {
    if (code === 'en') {
      for (const c of candidates) {
        try {
          const wikt = await lookupWiktionary(c, 'en');
          if (wikt) { result = wikt; break; }
          const en = await lookupEnglish(c);
          if (en) { result = en; break; }
        } catch { /* blocked */ }
      }
    } else {
      for (const c of candidates) {
        try {
          const wikt = await lookupWiktionary(c, code);
          if (wikt && isPlausibleLang(wikt, code)) { result = wikt; break; }
        } catch { /* blocked */ }
      }
      if (!result) {
        for (const c of candidates) {
          const folded = asciiFold(c);
          if (!/^[A-Za-z][A-Za-z' -]*$/.test(folded)) continue;
          try {
            const en = await lookupEnglish(folded);
            if (en) { result = en; break; }
            const wiktEn = await lookupWiktionary(folded, 'en');
            if (wiktEn) { result = wiktEn; break; }
          } catch { /* blocked */ }
        }
      }
    }
  }

  // Translate to the display language when it differs from the source.
  if (result && displayLang && displayLang !== srcLang && mtCode(displayLang) !== mtCode(srcLang)) {
    result = await translateDictResult(result, srcLang, displayLang);
  }

  return result;
}

/** Translate every definition + example of a DictResult into `toLang`. */
async function translateDictResult(
  result: DictResult,
  fromLang: string,
  toLang: string,
): Promise<DictResult> {
  const translated: DictResult = {
    ...result,
    meanings: [],
  };
  for (const meaning of result.meanings) {
    const defs = [];
    for (const d of meaning.definitions) {
      const definition = (await translateDefinition(d.definition, fromLang, toLang)) || d.definition;
      const example = d.example
        ? (await translateDefinition(d.example, fromLang, toLang)) || d.example
        : undefined;
      defs.push({ definition, example });
    }
    translated.meanings.push({ ...meaning, definitions: defs });
  }
  return translated;
}

/**
 * Translate a definition text from one supported language to another.
 * Uses shared quality-filtered MyMemory picker (rejects corpus junk like "See p. 11").
 */
export async function translateDefinition(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<string | null> {
  const from = mtCode(fromLang);
  const to = mtCode(toLang);
  if (from === to) return text;
  const cleaned = sanitizeDefinitionText(text || '');
  if (!cleaned) return null;
  const t = await translateWithCache(cleaned, from, to);
  if (!t || isGarbageTranslation(t, cleaned)) return null;
  return decodeTranslationEntities(t);
}

export function dictSourceLabel(defLang: string): string {
  return defLang === 'en' ? 'en' : DICT_LANG_CODE[defLang as keyof typeof DICT_LANG_CODE] || defLang;
}

/** Read the user's saved definition (display) language preference. */
export function readSavedDefLang(): string {
  try {
    const code = localStorage.getItem('preferred_definition_lang');
    if (code) return code;
  } catch {}
  try {
    const cl = localStorage.getItem('smarty_content_lang');
    if (cl) return cl;
  } catch {}
  return 'en';
}
