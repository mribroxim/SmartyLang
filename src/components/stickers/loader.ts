/**
 * Lazy loading for sticker chunks. Only the manifest is in the main bundle;
 * each chunk (core, a, b, c, sig) is fetched the first time one of its stickers
 * is shown. SVG strings are cached per id (draw functions are deterministic).
 */
import { STICKER_BY_ID, type StickerChunk, type StickerId } from './manifest';

interface RawSticker { name: string; tag: string; cat: string; svg: () => string }

const LOADERS: Record<StickerChunk, () => Promise<{ default: RawSticker[] }>> = {
  core: () => import('./sets/core'),
  a: () => import('./sets/a'),
  b: () => import('./sets/b'),
  c: () => import('./sets/c'),
  sig: () => import('./sets/sig'),
};

const chunks: Partial<Record<StickerChunk, RawSticker[]>> = {};
const pending: Partial<Record<StickerChunk, Promise<RawSticker[]>>> = {};
const svgCache = new Map<StickerId, string>();

export function loadChunk(chunk: StickerChunk): Promise<RawSticker[]> {
  if (chunks[chunk]) return Promise.resolve(chunks[chunk]!);
  if (!pending[chunk]) {
    pending[chunk] = LOADERS[chunk]().then((m) => {
      chunks[chunk] = m.default;
      return m.default;
    }).catch((e) => {
      delete pending[chunk];
      throw e;
    });
  }
  return pending[chunk]!;
}

function draw(id: StickerId, list: RawSticker[]): string {
  const meta = STICKER_BY_ID[id];
  let svg = svgCache.get(id);
  if (svg == null) {
    try {
      svg = list[meta.index].svg();
    } catch (e) {
      console.error('Sticker draw failed:', id, e);
      svg = '';
    }
    svgCache.set(id, svg);
  }
  return svg;
}

/** Synchronous access if the chunk is already loaded, else null. */
export function getStickerSvg(id: StickerId): string | null {
  const meta = STICKER_BY_ID[id];
  if (!meta) return '';
  const list = chunks[meta.chunk];
  return list ? draw(id, list) : null;
}

export async function loadStickerSvg(id: StickerId): Promise<string> {
  const meta = STICKER_BY_ID[id];
  if (!meta) return '';
  const list = await loadChunk(meta.chunk);
  return draw(id, list);
}

/** Warm the hot chunks (feedback + moods) when the browser is idle. */
export function prefetchStickers(list: StickerChunk[] = ['core', 'a']) {
  const run = () => list.forEach((c) => { loadChunk(c).catch(() => { /* retried on demand */ }); });
  const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => void) | undefined;
  if (ric) ric(run, { timeout: 4000 }); else setTimeout(run, 1500);
}
