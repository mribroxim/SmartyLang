import {
  type ContentLang,
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
} from './contentLang';

/** Stamp learning-language metadata onto any locally-persisted activity. */
export function activityLangStamp(contentLang: ContentLang) {
  return {
    contentLang,
    langLabel: CONTENT_LANG_NATIVE[contentLang] || CONTENT_LANG_LABEL[contentLang] || contentLang,
  };
}

/**
 * True when an activity record belongs to `lang`.
 * Missing contentLang is treated as English (legacy records).
 */
export function matchesContentLang(obj: any, lang: ContentLang | string): boolean {
  const recorded =
    obj?.contentLang
    || obj?.aiCheckResult?.contentLang
    || obj?.fullCheck?.contentLang
    || obj?.result?.contentLang
    || 'en';
  return recorded === lang;
}

/** Filter history sessions for a passage id to the current learning language. */
export function sessionsForLang<T extends { contentLang?: string }>(
  sessions: T[] | undefined | null,
  lang: ContentLang | string,
): T[] {
  if (!sessions?.length) return [];
  return sessions.filter(s => matchesContentLang(s, lang));
}

export function resolveLangLabel(contentLang?: string | null, langLabel?: string | null): string {
  if (langLabel && String(langLabel).trim()) return String(langLabel).trim();
  if (contentLang && CONTENT_LANG_NATIVE[contentLang as ContentLang]) {
    return CONTENT_LANG_NATIVE[contentLang as ContentLang];
  }
  if (contentLang && CONTENT_LANG_LABEL[contentLang as ContentLang]) {
    return CONTENT_LANG_LABEL[contentLang as ContentLang];
  }
  if (contentLang) return String(contentLang);
  return 'Unknown';
}

/** Strip huge/binary fields before showing "full dump" in UI. */
export function sanitizeActivityRaw(value: unknown, depth = 0): unknown {
  if (value == null || depth > 6) return value;
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > 200) {
      return `[data URL omitted · ${Math.round(value.length / 1024)} KB]`;
    }
    if (value.length > 8000) return value.slice(0, 8000) + '…';
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 200).map(v => sanitizeActivityRaw(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/audio|blob|base64|dataUrl|imageData/i.test(k) && typeof v === 'string' && v.length > 120) {
        out[k] = `[omitted · ${Math.round(v.length / 1024)} KB]`;
      } else {
        out[k] = sanitizeActivityRaw(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}
