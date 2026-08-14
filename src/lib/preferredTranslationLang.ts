import { readStoredContentLang } from './contentLang';
import { readStoredUiLang } from './uiLang';
import { LANGUAGES, type LanguageOption } from './languages';

const LS_KEY = 'preferred_translation_lang';

/** Map app lang codes to dictionary / translate API codes. */
const LANG_CODE: Record<string, string> = {
  zh: 'zh-CN',
};

export function uiLangToTranslateCode(lang: string): string {
  return LANG_CODE[lang] ?? lang;
}

export function readPreferredTranslationCode(): string {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return saved;
  } catch { /* ignore */ }
  const ui = readStoredUiLang();
  if (ui && ui !== 'en') return uiLangToTranslateCode(ui);
  const content = readStoredContentLang();
  if (content && content !== 'en') return 'en';
  return uiLangToTranslateCode(ui || 'en');
}

export function writePreferredTranslationCode(code: string) {
  try { localStorage.setItem(LS_KEY, code); } catch { /* ignore */ }
}

export function readPreferredTranslationLang(): LanguageOption {
  const code = readPreferredTranslationCode();
  return LANGUAGES.find(l => l.code === code)
    ?? LANGUAGES.find(l => l.code === code.split('-')[0])
    ?? LANGUAGES.find(l => l.code === 'en')!;
}

/** After onboarding: native UI lang becomes default translation target for word lookups. */
export function syncPreferredTranslationFromUiLang(uiLang: string) {
  if (!uiLang || uiLang === 'en') return;
  writePreferredTranslationCode(uiLangToTranslateCode(uiLang));
}
