/** Microsoft Azure Neural Text-to-Speech helper (server-side, dev only). */

import { buildSsmlWithBookmarks, synthesizeSsmlWithTimepoints } from './azureTtsSync.ts';
import { AZURE_VOICES, resolveVoiceCfg, type VoiceSpec } from './azureVoices.ts';
import {
  buildCacheId,
  normalizeRate,
  readDiskCache,
  writeDiskCache,
} from './ttsDiskCache.ts';

export type { VoiceSpec };

export interface TtsTimepoint {
  /** Word index matching the request `words` array */
  index: number;
  /** Seconds from start of audio */
  timeSeconds: number;
}

export interface TtsSyncResult {
  mp3: Buffer;
  timepoints: TtsTimepoint[];
}

/**
 * Synced requests use the Speech SDK + SSML bookmarks for accurate word timing.
 */

const MAX_CHARS = 4500;
const CACHE_MAX = 200;

type CacheEntry = { mp3: Buffer; timepoints?: TtsTimepoint[]; at: number };
const cache = new Map<string, CacheEntry>();

export function resolveTtsKey(lang: string): string {
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'fil') return 'tl';
  if (base === 'cmn' || base === 'zh') return 'zh';
  if (AZURE_VOICES[base]) return base;
  return 'en';
}

function cacheKey(text: string, langKey: string, rate: number, sync: boolean, voice = ''): string {
  return `${langKey}|${voice}|${rate.toFixed(2)}|${sync ? 'sync|' : ''}${text}`;
}

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (let i = 0; i < oldest.length - CACHE_MAX; i++) {
    cache.delete(oldest[i][0]);
  }
}

export function getConfig():
  | { key: string; region: string }
  | { missing: string } {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = (process.env.AZURE_SPEECH_REGION?.trim() || 'eastus').toLowerCase();
  if (!key) return { missing: 'Set AZURE_SPEECH_KEY (and optionally AZURE_SPEECH_REGION) in .env' };
  return { key, region };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildAzureSsml(text: string, langKey: string, rate: number, voiceOverride?: string): string {
  const cfg = resolveVoiceCfg(langKey, voiceOverride);
  const r = normalizeRate(rate);
  return (
    `<speak version='1.0' xml:lang='${cfg.locale}'>` +
    `<voice name='${cfg.voice}'>` +
    `<prosody rate='${r.toFixed(2)}'>${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  );
}

async function callAzure(ssml: string, key: string, region: string): Promise<Buffer> {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'smartylang',
      },
      body: ssml,
    });
  } catch (e) {
    throw Object.assign(new Error(`Azure TTS network error: ${(e as Error)?.message || 'unknown'}`), { status: 502 });
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw Object.assign(
      new Error(`Azure TTS failed (${res.status}): ${errText.slice(0, 300)}`),
      { status: 502, upstream: res.status },
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) {
    throw Object.assign(new Error('Azure TTS returned no audio'), { status: 502 });
  }
  return buf;
}

export async function synthesizeMp3(
  text: string,
  langInput: string,
  rate = 1,
  voiceOverride?: string,
): Promise<Buffer> {
  const cfg = getConfig();
  if ('missing' in cfg) {
    throw Object.assign(new Error(cfg.missing), { status: 503 });
  }

  const clean = text.trim().slice(0, MAX_CHARS);
  if (!clean) {
    throw Object.assign(new Error('Empty text'), { status: 400 });
  }

  const langKey = resolveTtsKey(langInput);
  const speakingRate = normalizeRate(rate);
  const key = cacheKey(clean, langKey, speakingRate, false, voiceOverride || '');
  const hit = cache.get(key);
  if (hit) {
    hit.at = Date.now();
    return hit.mp3;
  }

  const diskId = buildCacheId({
    text: clean,
    lang: langKey,
    rate: speakingRate,
    voice: voiceOverride || '',
    sync: false,
  });
  const disk = readDiskCache(diskId);
  if (disk?.mp3?.length) {
    cache.set(key, { mp3: disk.mp3, at: Date.now() });
    pruneCache();
    return disk.mp3;
  }

  const mp3 = await callAzure(buildAzureSsml(clean, langKey, speakingRate, voiceOverride), cfg.key, cfg.region);
  cache.set(key, { mp3, at: Date.now() });
  pruneCache();
  writeDiskCache(diskId, mp3);
  return mp3;
}

export async function synthesizeMp3WithSync(
  text: string,
  langInput: string,
  rate = 1,
  words: string[] = [],
  voiceOverride?: string,
): Promise<TtsSyncResult> {
  const cfg = getConfig();
  if ('missing' in cfg) {
    throw Object.assign(new Error(cfg.missing), { status: 503 });
  }

  const clean = text.trim().slice(0, MAX_CHARS);
  if (!clean) {
    throw Object.assign(new Error('Empty text'), { status: 400 });
  }
  const wordList = words.filter(w => typeof w === 'string' && w.length >= 0);
  if (!wordList.length) {
    throw Object.assign(new Error('Missing words for sync'), { status: 400 });
  }

  const langKey = resolveTtsKey(langInput);
  const speakingRate = normalizeRate(rate);
  const key = cacheKey(clean, langKey, speakingRate, true, voiceOverride || '') + `|${wordList.length}`;
  const hit = cache.get(key);
  if (hit?.timepoints?.length || hit?.mp3?.length) {
    hit.at = Date.now();
    return { mp3: hit.mp3, timepoints: hit.timepoints || [] };
  }

  const diskId = buildCacheId({
    text: clean,
    lang: langKey,
    rate: speakingRate,
    voice: voiceOverride || '',
    sync: true,
    words: wordList,
  });
  const disk = readDiskCache(diskId);
  if (disk?.mp3?.length) {
    cache.set(key, { mp3: disk.mp3, timepoints: disk.timepoints, at: Date.now() });
    pruneCache();
    return { mp3: disk.mp3, timepoints: disk.timepoints };
  }

  const voiceCfg = resolveVoiceCfg(langKey, voiceOverride);
  try {
    const ssml = buildSsmlWithBookmarks(clean, wordList, voiceCfg, speakingRate);
    const { mp3, timepoints } = await synthesizeSsmlWithTimepoints(ssml, cfg.key, cfg.region);
    cache.set(key, { mp3, timepoints, at: Date.now() });
    pruneCache();
    writeDiskCache(diskId, mp3, timepoints);
    return { mp3, timepoints };
  } catch (sdkErr) {
    console.warn('[tts] Azure SDK sync failed, falling back to REST:', (sdkErr as Error)?.message);
    const mp3 = await synthesizeMp3(text, langInput, rate, voiceOverride);
    return { mp3, timepoints: [] };
  }
}
