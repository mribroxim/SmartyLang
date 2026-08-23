import type { ContentLang } from './contentLang';

export type ArabicDisplayMode = 'with-harakat' | 'without-harakat';

const LS_KEY = 'smarty_arabic_display_mode';

const ARABIC_DIACRITICS_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]/gu;

export function isArabicContentLang(lang: ContentLang): boolean {
  return lang === 'ar';
}

export function stripHarakat(text: string): string {
  return text.replace(ARABIC_DIACRITICS_RE, '');
}

export function applyArabicDisplayMode(text: string, mode: ArabicDisplayMode): string {
  return mode === 'without-harakat' ? stripHarakat(text) : text;
}

export function readStoredArabicDisplayMode(): ArabicDisplayMode {
  try {
    const value = localStorage.getItem(LS_KEY);
    if (value === 'with-harakat' || value === 'without-harakat') return value;
  } catch {
    /* ignore */
  }
  return 'with-harakat';
}

export function writeStoredArabicDisplayMode(mode: ArabicDisplayMode): void {
  try {
    localStorage.setItem(LS_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function transformArabicContent<T>(
  value: T,
  lang: ContentLang,
  mode: ArabicDisplayMode,
): T {
  if (!isArabicContentLang(lang) || mode === 'with-harakat') return value;

  if (typeof value === 'string') {
    return applyArabicDisplayMode(value, mode) as T;
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const mapped = transformArabicContent(item, lang, mode);
      if (mapped !== item) changed = true;
      return mapped;
    });
    return (changed ? next : value) as T;
  }

  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const mapped = transformArabicContent(child, lang, mode);
      next[key] = mapped;
      if (mapped !== child) changed = true;
    }
    return (changed ? next : value) as T;
  }

  return value;
}
