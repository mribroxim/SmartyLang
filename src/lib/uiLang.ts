/**
 * Interface (UI chrome) language — separate from learning/content language.
 * All content languages are available as interface languages.
 */
import {
  type ContentLang,
  CONTENT_LANGS,
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
} from './contentLang';

export type UiLang = ContentLang;
export const UI_LANGS = CONTENT_LANGS;

const LS_KEY = 'smarty_ui_lang_v1';

export function isUiLang(v: string): v is UiLang {
  return (UI_LANGS as readonly string[]).includes(v);
}

export function readStoredUiLang(): UiLang {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s && isUiLang(s)) return s;
  } catch { /* ignore */ }
  return 'en';
}

export function writeStoredUiLang(lang: UiLang) {
  try { localStorage.setItem(LS_KEY, lang); } catch { /* ignore */ }
}

export function uiLangLabel(lang: UiLang): string {
  return CONTENT_LANG_NATIVE[lang] || CONTENT_LANG_LABEL[lang] || lang;
}

/** MyMemory / translate API codes for UI lang generation & future use */
export const UI_TRANSLATE_CODE: Record<UiLang, string> = {
  en: 'en', ru: 'ru', tl: 'tl', es: 'es', uz: 'uz', de: 'de', fr: 'fr',
  it: 'it', pt: 'pt', ja: 'ja', ko: 'ko', zh: 'zh-CN', ar: 'ar', tr: 'tr',
  nl: 'nl', hi: 'hi', pl: 'pl', sv: 'sv', id: 'id', ms: 'ms', vi: 'vi',
  th: 'th', uk: 'uk', el: 'el', cs: 'cs', ro: 'ro', fa: 'fa', ur: 'ur', sw: 'sw',
};
