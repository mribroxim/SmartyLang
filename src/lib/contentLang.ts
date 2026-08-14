/**
 * Content-language (learning language) helpers.
 * English = full product with built-in TS/JSON content.
 * All other langs = public/data/lang-packs/{lang}/ (+ CMS overrides) with a reduced feature set.
 */

export type ContentLang =
  | 'en' | 'ru' | 'tl'
  | 'es' | 'uz' | 'de' | 'fr' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'
  | 'ar' | 'tr' | 'nl' | 'hi' | 'pl' | 'sv' | 'id' | 'ms' | 'vi'
  | 'th' | 'uk' | 'el' | 'cs' | 'ro' | 'fa' | 'ur' | 'sw';

/** Languages that ship built-in packs under public/data/lang-packs (or English builtins). */
export const CONTENT_LANGS_WITH_PACKS: ReadonlySet<ContentLang> = new Set([
  'en', 'ru', 'tl',
  'ar', 'zh', 'cs', 'nl', 'fa', 'fr', 'de', 'el', 'hi', 'id', 'it',
  'ja', 'ko', 'ms', 'pl', 'pt', 'ro', 'es', 'sv', 'sw', 'th', 'tr',
  'uk', 'ur', 'uz', 'vi',
]);

export const CONTENT_LANGS: readonly ContentLang[] = [
  'en', 'ru', 'tl',
  'ar', 'zh', 'cs', 'nl', 'fa', 'fr', 'de', 'el', 'hi', 'id', 'it',
  'ja', 'ko', 'ms', 'pl', 'pt', 'ro', 'es', 'sv', 'sw', 'th', 'tr',
  'uk', 'ur', 'uz', 'vi',
] as const;

export const CONTENT_LANG_LABEL: Record<ContentLang, string> = {
  en: 'English',
  ru: 'Русский',
  tl: 'Tagalog',
  es: 'Español',
  uz: 'Oʻzbekcha',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  tr: 'Türkçe',
  nl: 'Nederlands',
  hi: 'हिन्दी',
  pl: 'Polski',
  sv: 'Svenska',
  id: 'Indonesia',
  ms: 'Melayu',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  uk: 'Українська',
  el: 'Ελληνικά',
  cs: 'Čeština',
  ro: 'Română',
  fa: 'فارسی',
  ur: 'اردو',
  sw: 'Kiswahili',
};

export const CONTENT_LANG_NATIVE: Record<ContentLang, string> = {
  en: 'English',
  ru: 'Russian',
  tl: 'Tagalog',
  es: 'Spanish',
  uz: 'Uzbek',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  tr: 'Turkish',
  nl: 'Dutch',
  hi: 'Hindi',
  pl: 'Polish',
  sv: 'Swedish',
  id: 'Indonesian',
  ms: 'Malay',
  vi: 'Vietnamese',
  th: 'Thai',
  uk: 'Ukrainian',
  el: 'Greek',
  cs: 'Czech',
  ro: 'Romanian',
  fa: 'Persian',
  ur: 'Urdu',
  sw: 'Swahili',
};

/** BCP-47 codes for Web Speech ASR / TTS */
export const SPEECH_LOCALE: Record<ContentLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  tl: 'fil-PH',
  es: 'es-ES',
  uz: 'uz-UZ',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  tr: 'tr-TR',
  nl: 'nl-NL',
  hi: 'hi-IN',
  pl: 'pl-PL',
  sv: 'sv-SE',
  id: 'id-ID',
  ms: 'ms-MY',
  vi: 'vi-VN',
  th: 'th-TH',
  uk: 'uk-UA',
  el: 'el-GR',
  cs: 'cs-CZ',
  ro: 'ro-RO',
  fa: 'fa-IR',
  ur: 'ur-PK',
  sw: 'sw-KE',
};

/** ISO codes for dictionary / MyMemory source language */
export const DICT_LANG_CODE: Record<ContentLang, string> = {
  en: 'en',
  ru: 'ru',
  tl: 'tl',
  es: 'es',
  uz: 'uz',
  de: 'de',
  fr: 'fr',
  it: 'it',
  pt: 'pt',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN',
  ar: 'ar',
  tr: 'tr',
  nl: 'nl',
  hi: 'hi',
  pl: 'pl',
  sv: 'sv',
  id: 'id',
  ms: 'ms',
  vi: 'vi',
  th: 'th',
  uk: 'uk',
  el: 'el',
  cs: 'cs',
  ro: 'ro',
  fa: 'fa',
  ur: 'ur',
  sw: 'sw',
};

/** Wiktionary REST language keys (under en.wiktionary.org definition API). */
export const WIKT_LANG_CODE: Record<Exclude<ContentLang, 'en'>, string> = {
  ru: 'ru',
  tl: 'tl',
  es: 'es',
  uz: 'uz',
  de: 'de',
  fr: 'fr',
  it: 'it',
  pt: 'pt',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh',
  ar: 'ar',
  tr: 'tr',
  nl: 'nl',
  hi: 'hi',
  pl: 'pl',
  sv: 'sv',
  id: 'id',
  ms: 'ms',
  vi: 'vi',
  th: 'th',
  uk: 'uk',
  el: 'el',
  cs: 'cs',
  ro: 'ro',
  fa: 'fa',
  ur: 'ur',
  sw: 'sw',
};

const CONTENT_LANG_SET = new Set<string>(CONTENT_LANGS);

export function isContentLang(v: string | null | undefined): v is ContentLang {
  return !!v && CONTENT_LANG_SET.has(v);
}

const LS_KEY = 'smarty_content_lang';

export function readStoredContentLang(): ContentLang {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (isContentLang(v)) return v;
  } catch { /* ignore */ }
  return 'en';
}

export function writeStoredContentLang(lang: ContentLang): void {
  try { localStorage.setItem(LS_KEY, lang); } catch { /* ignore */ }
}

/** Firestore cmsContent doc id — English keeps legacy unprefixed ids. */
export function cmsDocId(base: string, lang: ContentLang): string {
  return lang === 'en' ? base : `${base}__${lang}`;
}

/** localStorage key for saved vocabulary scoped by learning language. */
export function vocabStorageKey(lang: ContentLang): string {
  return lang === 'en' ? 'readmaster_saved_vocab' : `readmaster_saved_vocab_${lang}`;
}

/** Firestore vocabulary subcollection under users/{uid}. */
export function vocabCollectionId(lang: ContentLang): string {
  return lang === 'en' ? 'vocabulary' : `vocabulary_${lang}`;
}

/** Features available when learning a non-English language (English keeps everything). */
export const NON_EN_ALLOWED_TABS = new Set([
  'home',
  'dashboard',
  'reading',
  'lessons',
  'practice',
  'listening',
  'speaking',
  'writing',
  'vocabulary',
  'exercises',
  'comprehensive',
  'classes',
  'profile',
  'plans',
  'teacher',
  'organization',
  'admin',
  'content',
  'gamification',
]);

/** English-only practice tabs that should bounce away when switching language. */
export const EN_ONLY_TABS = new Set([
  'story',
  'ielts',
  'ielts-reading',
  'gamification',
]);

export function isFullEnglishApp(lang: ContentLang): boolean {
  return lang === 'en';
}

export function hasBuiltInLangPack(lang: ContentLang): boolean {
  return CONTENT_LANGS_WITH_PACKS.has(lang);
}
