import type { UiLang } from './uiLang';
import generated from '../locales/ui.generated.json';
import en from '../locales/ui.en.json';
import { formatUi } from './uiFormat';
import { levelUiKey } from './uiFormat';

/** Stable keys for UI chrome. Missing keys fall back to English. */
export type UiStringKey = keyof typeof en;

export const EN_UI_STRINGS = en as Record<UiStringKey, string>;

type Dict = Partial<Record<UiStringKey, string>>;

function unwrapGenerated(mod: unknown): Partial<Record<UiLang, Dict>> {
  if (!mod || typeof mod !== 'object') return {};
  const o = mod as Record<string, unknown>;
  if (o.ru && typeof o.ru === 'object') return o as Partial<Record<UiLang, Dict>>;
  const nested = o.default;
  if (nested && typeof nested === 'object' && (nested as Record<string, unknown>).ru) {
    return nested as Partial<Record<UiLang, Dict>>;
  }
  return {};
}

const PACK = unwrapGenerated(generated);

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
