/**
 * Client loader for the predetermined semantic vocabulary database.
 * Fetches index.json + the learning-language shard + the known-language shard.
 * Runtime lookups never call a translation API; misses go through translateFallback.
 */
import type { ContentLang } from './contentLang';
import { CONTENT_LANGS, isContentLang } from './contentLang';
import { readPreferredTranslationCode } from './preferredTranslationLang';
import { readStoredUiLang } from './uiLang';

export const VOCAB_CACHE_BUST = 'v1';

export type VocabPos =
  | 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb'
  | 'preposition' | 'conjunction' | 'pronoun' | 'interjection'
  | 'determiner' | 'unknown' | string;

export interface SenseMeta {
  pos: VocabPos;
  cefr?: string;
  src?: string[];
}

export interface LangEntry {
  w: string;
  d: string;
}

export interface VocabCard {
  senseId: string;
  word: string;
  knownWord: string;
  definition: string;
  learningDefinition: string;
  pos: VocabPos;
  cefr?: string;
  src?: string[];
}

type IndexFile = {
  version: string;
  senses: Record<string, SenseMeta>;
};

type Shard = Record<string, LangEntry>;

type Loaded = {
  index: IndexFile;
  learning: Shard;
  known: Shard;
  learningLang: string;
  knownLang: string;
  lemmaIndex: Map<string, string[]>;
};

const _shardPromises = new Map<string, Promise<Shard | null>>();
let _indexPromise: Promise<IndexFile | null> | null = null;
let _loaded: Loaded | null = null;
let _loadPromise: Promise<Loaded | null> | null = null;

export function vocabDbEnabled(): boolean {
  const v = import.meta.env.VITE_VOCAB_DB;
  if (v === '0' || v === 'false') return false;
  return true;
}

/** Map API / UI codes (zh-CN, fil) onto shard filenames. */
export function toVocabLang(code: string | null | undefined): ContentLang | null {
  if (!code) return null;
  const raw = code.trim().toLowerCase();
  if (raw === 'fil' || raw === 'tl-ph') return 'tl';
  if (raw === 'zh-cn' || raw === 'zh-tw' || raw === 'cmn' || raw === 'zh') return 'zh';
  const base = raw.split('-')[0];
  if (isContentLang(base)) return base;
  if (isContentLang(raw)) return raw as ContentLang;
  return null;
}

function vocabUrl(file: string): string {
  return `/data/vocab/${file}?${VOCAB_CACHE_BUST}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function loadIndex(): Promise<IndexFile | null> {
  if (!_indexPromise) {
    _indexPromise = fetchJson<IndexFile>(vocabUrl('index.json'));
  }
  return _indexPromise;
}

function loadShard(lang: string): Promise<Shard | null> {
  const key = toVocabLang(lang) || lang;
  if (!_shardPromises.has(key)) {
    _shardPromises.set(key, fetchJson<Shard>(vocabUrl(`${key}.json`)));
  }
  return _shardPromises.get(key)!;
}

export function normalizeLemma(word: string): string {
  return String(word || '')
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[“”"'`´]/g, '')
    .replace(/[.,!?;:()[\]{}]/g, '')
    .replace(/\s+/g, ' ');
}

function buildLemmaIndex(shard: Shard): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (key: string, id: string) => {
    if (!key) return;
    const list = map.get(key);
    if (list) {
      if (!list.includes(id)) list.push(id);
    } else {
      map.set(key, [id]);
    }
  };
  for (const [id, entry] of Object.entries(shard)) {
    const w = normalizeLemma(entry.w);
    add(w, id);
    if (w.includes(' ')) {
      add(w.replace(/\s+/g, ''), id);
      const parts = w.split(' ');
      if (parts.length === 2) add(parts[0], id);
    }
    if (w.endsWith('s') && w.length > 4) add(w.slice(0, -1), id);
    if (w.endsWith('es') && w.length > 5) add(w.slice(0, -2), id);
    if (w.endsWith('ing') && w.length > 6) add(w.slice(0, -3), id);
    if (w.endsWith('ed') && w.length > 5) add(w.slice(0, -2), id);
  }
  return map;
}

function tokenOverlap(sentence: string, definition: string): number {
  const stop = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'be', 'this', 'that', 'it', 'with']);
  const toks = (s: string) =>
    normalizeLemma(s)
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stop.has(t));
  const a = new Set(toks(sentence));
  const b = toks(definition);
  if (!a.size || !b.length) return 0;
  let n = 0;
  for (const t of b) if (a.has(t)) n++;
  return n / Math.max(b.length, 1);
}

export async function loadVocab(
  learningLang: string,
  knownLang?: string,
): Promise<Loaded | null> {
  if (!vocabDbEnabled()) return null;
  const learn = toVocabLang(learningLang);
  const known = toVocabLang(knownLang || readStoredUiLang() || 'en') || 'en';
  if (!learn) return null;

  if (
    _loaded &&
    _loaded.learningLang === learn &&
    _loaded.knownLang === known
  ) {
    return _loaded;
  }

  const cacheKey = `${learn}|${known}`;
  if (_loadPromise && _loaded && `${_loaded.learningLang}|${_loaded.knownLang}` === cacheKey) {
    return _loadPromise;
  }

  _loadPromise = (async () => {
    const [index, learning, knownShard] = await Promise.all([
      loadIndex(),
      loadShard(learn),
      known === learn ? loadShard(learn) : loadShard(known),
    ]);
    if (!index || !learning || !knownShard) return null;
    const loaded: Loaded = {
      index,
      learning,
      known: knownShard,
      learningLang: learn,
      knownLang: known,
      lemmaIndex: buildLemmaIndex(learning),
    };
    _loaded = loaded;
    return loaded;
  })();

  return _loadPromise;
}

export function getLoadedVocab(): Loaded | null {
  return _loaded;
}

export function getCard(senseId: string, knownLang?: string): VocabCard | null {
  const db = _loaded;
  if (!db || !senseId) return null;
  const meta = db.index.senses[senseId];
  const learn = db.learning[senseId];
  if (!meta || !learn) return null;
  const knownCode = toVocabLang(knownLang || db.knownLang);
  let knownEntry = db.known[senseId];
  if (knownCode && knownCode !== db.knownLang) {
    // Best-effort: if caller asked for a different known lang than loaded, use learning def.
    knownEntry = db.known[senseId];
  }
  return {
    senseId,
    word: learn.w,
    knownWord: knownEntry?.w || learn.w,
    definition: knownEntry?.d || learn.d,
    learningDefinition: learn.d,
    pos: meta.pos,
    cefr: meta.cefr,
    src: meta.src,
  };
}

export function resolveSense(word: string, sentence?: string | null): string | null {
  const db = _loaded;
  if (!db || !word) return null;
  const key = normalizeLemma(word);
  if (!key) return null;
  let ids = db.lemmaIndex.get(key);
  if (!ids && key.endsWith('s') && key.length > 4) ids = db.lemmaIndex.get(key.slice(0, -1));
  if (!ids && key.endsWith('ing') && key.length > 6) ids = db.lemmaIndex.get(key.slice(0, -3));
  if (!ids && key.endsWith('ed') && key.length > 5) ids = db.lemmaIndex.get(key.slice(0, -2));
  if (!ids || !ids.length) return null;
  if (ids.length === 1 || !sentence) return ids[0];

  let best = ids[0];
  let bestScore = -1;
  for (const id of ids) {
    const def = db.learning[id]?.d || db.known[id]?.d || '';
    const score = tokenOverlap(sentence, def);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

export function lookupWord(
  word: string,
  opts?: { sentence?: string | null; knownLang?: string },
): VocabCard | null {
  const id = resolveSense(word, opts?.sentence);
  if (!id) return null;
  return getCard(id, opts?.knownLang);
}

export async function lookupWordAsync(
  word: string,
  opts?: { sentence?: string | null; learningLang?: string; knownLang?: string },
): Promise<VocabCard | null> {
  const learning = opts?.learningLang;
  const known = opts?.knownLang || readPreferredTranslationCode();
  if (learning) await loadVocab(learning, known);
  else if (!_loaded) {
    const { readStoredContentLang } = await import('./contentLang');
    await loadVocab(readStoredContentLang(), known);
  }
  return lookupWord(word, { sentence: opts?.sentence, knownLang: known });
}

export const VOCAB_LANGS: readonly string[] = CONTENT_LANGS;
