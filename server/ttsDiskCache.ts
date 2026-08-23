/**
 * Local-dev TTS disk cache (mirrors Cloud Function Storage cache keying).
 * Path: .tts-cache/{sha256}.mp3 (+ .json for sync timepoints)
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CONTENT_VERSION = 'v1';
const CACHE_DIR = path.resolve(process.cwd(), '.tts-cache');

/** Learner speed presets — must match src/lib/speechRates.ts */
const RATE_PRESETS = [0.85, 1.0, 1.1, 1.25] as const;

/** Snap to nearest speech-rate preset. */
export function normalizeRate(rate: number): number {
  const r = Number(rate);
  const target = Number.isFinite(r) ? r : 1.1;
  let best: number = 1.1;
  let bestDist = Infinity;
  for (const p of RATE_PRESETS) {
    const d = Math.abs(p - target);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function buildCacheId(opts: {
  text: string;
  lang: string;
  rate: number;
  voice?: string;
  sync?: boolean;
  words?: string[];
}): string {
  const text = String(opts.text || '').trim();
  const lang = String(opts.lang || 'en');
  const rate = normalizeRate(opts.rate).toFixed(2);
  const voice = String(opts.voice || '');
  const sync = opts.sync === true;
  const wordsPart =
    sync && Array.isArray(opts.words) && opts.words.length
      ? opts.words.join('\u0001')
      : '';
  const payload = [
    CONTENT_VERSION,
    lang,
    rate,
    voice,
    sync ? 'sync' : 'plain',
    wordsPart,
    text,
  ].join('|');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function readDiskCache(cacheId: string): {
  mp3: Buffer;
  timepoints: { index: number; timeSeconds: number }[];
} | null {
  try {
    ensureDir();
    const mp3Path = path.join(CACHE_DIR, `${cacheId}.mp3`);
    if (!fs.existsSync(mp3Path)) return null;
    const mp3 = fs.readFileSync(mp3Path);
    if (!mp3.length) return null;
    let timepoints: { index: number; timeSeconds: number }[] = [];
    const metaPath = path.join(CACHE_DIR, `${cacheId}.json`);
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (Array.isArray(meta?.timepoints)) timepoints = meta.timepoints;
    }
    return { mp3, timepoints };
  } catch {
    return null;
  }
}

export function writeDiskCache(
  cacheId: string,
  mp3: Buffer,
  timepoints?: { index: number; timeSeconds: number }[],
): void {
  try {
    ensureDir();
    fs.writeFileSync(path.join(CACHE_DIR, `${cacheId}.mp3`), mp3);
    if (timepoints?.length) {
      fs.writeFileSync(
        path.join(CACHE_DIR, `${cacheId}.json`),
        JSON.stringify({ timepoints, version: CONTENT_VERSION }),
      );
    }
  } catch (e) {
    console.warn('[ttsDiskCache] write failed:', (e as Error)?.message || e);
  }
}
