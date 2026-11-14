/**
 * Built-in language packs for non-English learning modes.
 * Files live under /data/lang-packs/{lang}/ and act as defaults when CMS is empty.
 */
import type { ContentLang } from './contentLang';

/** Bump when lang-pack JSON content changes so browsers skip stale CDN caches. */
const LANG_PACK_CACHE_BUST = 'v20260826d';

export function langPackUrl(lang: Exclude<ContentLang, 'en'>, ...parts: string[]): string {
  return `/data/lang-packs/${lang}/${parts.join('/')}?${LANG_PACK_CACHE_BUST}`;
}

export async function fetchLangPackJson<T>(
  lang: Exclude<ContentLang, 'en'>,
  ...parts: string[]
): Promise<T | null> {
  try {
    const r = await fetch(langPackUrl(lang, ...parts));
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchLangPackText(
  lang: Exclude<ContentLang, 'en'>,
  ...parts: string[]
): Promise<string | null> {
  try {
    const r = await fetch(langPackUrl(lang, ...parts));
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}
