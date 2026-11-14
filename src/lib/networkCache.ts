/**
 * Persistent caches + retry helpers for TTS blobs and translations.
 * Vocabulary lookups go through vocabDb first; live translation hits
 * POST /api/translate-fallback (server-side provider only).
 */

import {
  TRANS_CACHE_VERSION,
  isGarbageTranslation,
  normalizeTranslationQuery,
  decodeTranslationEntities,
  sanitizeDefinitionText,
} from './translationQuality';

const TRANS_KEY = `translation_cache_${TRANS_CACHE_VERSION}`;
const TRANS_MAX = 500;
const TTS_META_KEY = 'tts_cache_meta_v1';
const TTS_IDB = 'smarty_tts_cache';
const TTS_STORE = 'blobs';
const TTS_MAX = 60;

type TransEntry = { text: string; at: number };
type TransCache = Record<string, TransEntry>;

function transKey(q: string, from: string, to: string) {
  return `${from}|${to}|${normalizeTranslationQuery(q).slice(0, 450)}`;
}

function readTransCache(): TransCache {
  try {
    return JSON.parse(localStorage.getItem(TRANS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeTransCache(cache: TransCache) {
  try {
    const entries = Object.entries(cache).sort((a, b) => b[1].at - a[1].at);
    const trimmed = Object.fromEntries(entries.slice(0, TRANS_MAX));
    localStorage.setItem(TRANS_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function getCachedTranslation(q: string, from: string, to: string): string | null {
  const hit = readTransCache()[transKey(q, from, to)];
  const text = hit?.text || null;
  if (text && isGarbageTranslation(text, q)) {
    try {
      const cache = readTransCache();
      delete cache[transKey(q, from, to)];
      writeTransCache(cache);
    } catch {}
    return null;
  }
  return text;
}

export function setCachedTranslation(q: string, from: string, to: string, text: string) {
  if (!text || isGarbageTranslation(text, q)) return;
  const cache = readTransCache();
  cache[transKey(q, from, to)] = { text, at: Date.now() };
  writeTransCache(cache);
}

/** Normalize short Latin headwords for flashcards (Family → family). */
function polishTranslation(text: string, source: string): string {
  let t = decodeTranslationEntities(text.trim());
  // Drop trailing sentence period on single-token glosses ("school." → "school")
  if (!/\s/.test(t) && /\.$/.test(t) && t.length <= 40) {
    t = t.replace(/\.$/, '');
  }
  if (!/\s/.test(t) && /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(t) && source.trim().split(/\s+/).length <= 2) {
    t = t.toLocaleLowerCase();
  }
  return t;
}

/** Fetch translation: local cache → vocab DB → server fallback. Never calls providers from the browser. */
export async function translateWithCache(
  q: string,
  from: string,
  to: string,
  opts?: { signal?: AbortSignal; fallback?: string; sentence?: string },
): Promise<string | null> {
  const packed = await translateWithAlternatives(q, from, to, opts);
  return packed?.text || null;
}

/** Same as translateWithCache but keeps alternate glosses when the server returns them. */
export async function translateWithAlternatives(
  q: string,
  from: string,
  to: string,
  opts?: { signal?: AbortSignal; fallback?: string; sentence?: string },
): Promise<{ text: string; alternatives: string[] } | null> {
  const raw = q.trim();
  if (!raw) return null;
  if (from === to) return { text: raw, alternatives: [raw] };

  const query = normalizeTranslationQuery(raw);
  const cached = getCachedTranslation(query, from, to);
  if (cached) return { text: cached, alternatives: [cached] };

  const gloss = sanitizeDefinitionText(opts?.fallback || '');

  try {
    const { vocabDbEnabled, loadVocab, lookupAllSenses, toVocabLang } = await import('./vocabDb');
    if (vocabDbEnabled() && query.split(/\s+/).length <= 4) {
      await loadVocab(from, to);
      const cards = lookupAllSenses(raw, { sentence: opts?.sentence, knownLang: to, limit: 8 });
      const alts = cards
        .map((c) => polishTranslation(c.knownWord || c.definition, query))
        .filter((t) => t && !isGarbageTranslation(t, query));
      if (alts.length) {
        setCachedTranslation(query, from, to, alts[0]);
        return { text: alts[0], alternatives: [...new Set(alts)] };
      }
      void toVocabLang;
    }
  } catch {
    /* vocab db optional */
  }

  const attempt = async (): Promise<{ text: string; alternatives: string[] } | null> => {
    const { translateFallback } = await import('./translateFallback');
    try {
      const packed = await translateFallback({
        word: raw,
        from,
        to,
        sentence: opts?.sentence || gloss || undefined,
        signal: opts?.signal,
      });
      if (packed?.text && !isGarbageTranslation(packed.text, query)) {
        const text = polishTranslation(packed.text, query);
        const alternatives = (packed.alternatives || [packed.text])
          .map((a) => polishTranslation(a, query))
          .filter((t) => t && !isGarbageTranslation(t, query));
        return { text, alternatives: alternatives.length ? alternatives : [text] };
      }
    } catch {
      /* fall through */
    }
    if (gloss && gloss !== raw) {
      try {
        const { translateFallback } = await import('./translateFallback');
        const packed = await translateFallback({ word: gloss, from, to, signal: opts?.signal });
        if (packed?.text && !isGarbageTranslation(packed.text, gloss)) {
          const text = polishTranslation(packed.text, query);
          return { text, alternatives: [text] };
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  };

  try {
    const packed = await attempt();
    if (packed?.text && !isGarbageTranslation(packed.text, query)) {
      setCachedTranslation(query, from, to, packed.text);
      return packed;
    }
    return null;
  } catch {
    try {
      await new Promise((r) => setTimeout(r, 600));
      const packed = await attempt();
      if (packed?.text && !isGarbageTranslation(packed.text, query)) {
        setCachedTranslation(query, from, to, packed.text);
        return packed;
      }
      return null;
    } catch {
      return null;
    }
  }
}

/* ─── TTS blob cache (IndexedDB) ─────────────────────────────── */

function openTtsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TTS_IDB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TTS_STORE)) db.createObjectStore(TTS_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedTtsBlob(cacheKey: string): Promise<Blob | null> {
  try {
    const db = await openTtsDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TTS_STORE, 'readonly');
      const req = tx.objectStore(TTS_STORE).get(cacheKey);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedTtsBlob(cacheKey: string, blob: Blob): Promise<void> {
  try {
    const db = await openTtsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TTS_STORE, 'readwrite');
      tx.objectStore(TTS_STORE).put(blob, cacheKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    let meta: string[] = [];
    try {
      meta = JSON.parse(localStorage.getItem(TTS_META_KEY) || '[]');
    } catch {}
    meta = [cacheKey, ...meta.filter((k) => k !== cacheKey)].slice(0, TTS_MAX);
    localStorage.setItem(TTS_META_KEY, JSON.stringify(meta));
    const keep = new Set(meta);
    const all = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const tx = db.transaction(TTS_STORE, 'readonly');
      const req = tx.objectStore(TTS_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    for (const k of all) {
      if (!keep.has(String(k))) {
        const tx = db.transaction(TTS_STORE, 'readwrite');
        tx.objectStore(TTS_STORE).delete(k);
      }
    }
  } catch {
    /* ignore quota errors */
  }
}

const ttsRetryQueue: { text: string; lang: string; rate: number }[] = [];

export function enqueueTtsRetry(text: string, lang: string, rate = 1) {
  if (!ttsRetryQueue.some((x) => x.text === text && x.lang === lang)) {
    ttsRetryQueue.push({ text, lang, rate });
  }
}

export function drainTtsRetryQueue(
  play: (text: string, rate: number, lang: string) => Promise<unknown>,
): void {
  if (!navigator.onLine || ttsRetryQueue.length === 0) return;
  const batch = ttsRetryQueue.splice(0, 5);
  batch.forEach(({ text, lang, rate }) => {
    play(text, rate, lang).catch(() => enqueueTtsRetry(text, lang, rate));
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // consumer should call drain with playWord; soft warm only
  });
}
