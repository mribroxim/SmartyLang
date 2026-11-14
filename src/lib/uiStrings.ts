import type { UiLang } from './uiLang';
import en from '../locales/ui.en.json';
import { formatUi } from './uiFormat';
import { levelUiKey } from './uiFormat';

/** Stable keys for UI chrome. Missing keys fall back to English. */
export type UiStringKey = keyof typeof en;

export const EN_UI_STRINGS = en as Record<UiStringKey, string>;

type Dict = Partial<Record<UiStringKey, string>>;

const PACK: Partial<Record<UiLang, Dict>> = {};
const LOADERS: Partial<Record<UiLang, () => Promise<{ default: Dict }>>> = {
  ru: () => import('../locales/ui/ru.json'),
  tl: () => import('../locales/ui/tl.json'),
  es: () => import('../locales/ui/es.json'),
  uz: () => import('../locales/ui/uz.json'),
  de: () => import('../locales/ui/de.json'),
  fr: () => import('../locales/ui/fr.json'),
  it: () => import('../locales/ui/it.json'),
  pt: () => import('../locales/ui/pt.json'),
  ja: () => import('../locales/ui/ja.json'),
  ko: () => import('../locales/ui/ko.json'),
  zh: () => import('../locales/ui/zh.json'),
  ar: () => import('../locales/ui/ar.json'),
  tr: () => import('../locales/ui/tr.json'),
  nl: () => import('../locales/ui/nl.json'),
  hi: () => import('../locales/ui/hi.json'),
  pl: () => import('../locales/ui/pl.json'),
  sv: () => import('../locales/ui/sv.json'),
  id: () => import('../locales/ui/id.json'),
  ms: () => import('../locales/ui/ms.json'),
  vi: () => import('../locales/ui/vi.json'),
  th: () => import('../locales/ui/th.json'),
  uk: () => import('../locales/ui/uk.json'),
  el: () => import('../locales/ui/el.json'),
  cs: () => import('../locales/ui/cs.json'),
  ro: () => import('../locales/ui/ro.json'),
  fa: () => import('../locales/ui/fa.json'),
  ur: () => import('../locales/ui/ur.json'),
  sw: () => import('../locales/ui/sw.json'),
};
const pending = new Map<UiLang, Promise<void>>();

/** Load just the selected built-in language, before rendering it. */
export function loadUiLocale(lang: UiLang): Promise<void> {
  if (lang === 'en' || PACK[lang]) return Promise.resolve();
  const existing = pending.get(lang);
  if (existing) return existing;
  const loader = LOADERS[lang];
  if (!loader) return Promise.reject(new Error('Unknown UI language: ' + lang));
  const promise = loader().then(mod => { PACK[lang] = mod.default; }).catch(error => {
    pending.delete(lang);
    throw error;
  });
  pending.set(lang, promise);
  return promise;
}

// Legacy shared metadata keeps stable English values for storage and comparisons.
// Translate those labels at the rendering boundary, without changing their IDs.
const KEY_FOR_ENGLISH = new Map<string, UiStringKey>();
for (const key of Object.keys(EN_UI_STRINGS) as UiStringKey[]) {
  if (!KEY_FOR_ENGLISH.has(EN_UI_STRINGS[key])) KEY_FOR_ENGLISH.set(EN_UI_STRINGS[key], key);
}

export function translateUiText(lang: UiLang, text: string): string {
  const key = KEY_FOR_ENGLISH.get(text);
  return key ? translateUi(lang, key) : text;
}

export function translateUi(
  lang: UiLang,
  key: UiStringKey,
  vars?: Record<string, string | number>,
): string {
  if (lang === 'en') return formatUi(EN_UI_STRINGS[key] || key, vars);
  const pack = PACK[lang];
  const fromPack = pack ? pack[key] : undefined;
  const raw = (fromPack && fromPack.trim()) || EN_UI_STRINGS[key] || key;
  return formatUi(raw, vars);
}

/** Translate an English level id for display (storage stays English). */
export function translateLevel(lang: UiLang, level: string): string {
  const key = levelUiKey(level);
  if (key in EN_UI_STRINGS) return translateUi(lang, key as UiStringKey);
  return level;
}

const LEVEL_DESC_SUFFIX: Record<string, string> = {
  Beginner: 'beginner',
  Elementary: 'elementary',
  'Pre-Intermediate': 'preIntermediate',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
};

/** Feature-scoped level card description, e.g. prefix `compReading.desc`. */
export function translateLevelDesc(
  lang: UiLang,
  prefix: string,
  level: string,
): string {
  const suffix = LEVEL_DESC_SUFFIX[level];
  if (!suffix) return '';
  const key = `${prefix}.${suffix}` as UiStringKey;
  return translateUi(lang, key);
}
