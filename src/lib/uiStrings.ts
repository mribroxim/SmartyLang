import type { UiLang } from './uiLang';
import generated from '../locales/ui.generated.json';
import en from '../locales/ui.en.json';
import { formatUi } from './uiFormat';
import { levelUiKey } from './uiFormat';

/** Stable keys for UI chrome. Missing keys fall back to English. */
export type UiStringKey = keyof typeof en;

export const EN_UI_STRINGS = en as Record<UiStringKey, string>;

type Dict = Partial<Record<UiStringKey, string>>;

const PACK = generated as Partial<Record<UiLang, Dict>>;

export function translateUi(
  lang: UiLang,
  key: UiStringKey,
  vars?: Record<string, string | number>,
): string {
  const raw =
    lang === 'en'
      ? EN_UI_STRINGS[key] || key
      : PACK[lang]?.[key] || EN_UI_STRINGS[key] || key;
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
