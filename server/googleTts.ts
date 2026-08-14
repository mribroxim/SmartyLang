/** Microsoft Azure Neural Text-to-Speech helper (server-side, dev only). */

export interface VoiceSpec {
  locale: string;
  voice: string;
}

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
 * Premium Azure Neural voices per app language code.
 * Note: Azure REST returns no word-boundary timepoints — synced requests return
 * empty timepoints and the client falls back to duration-estimated highlights.
 */
const AZURE_VOICES: Record<string, VoiceSpec> = {
  en: { locale: 'en-US', voice: 'en-US-AriaNeural' },
  ru: { locale: 'ru-RU', voice: 'ru-RU-SvetlanaNeural' },
  tl: { locale: 'fil-PH', voice: 'fil-PH-BlessicaNeural' },
  fil: { locale: 'fil-PH', voice: 'fil-PH-BlessicaNeural' },
  es: { locale: 'es-ES', voice: 'es-ES-ElviraNeural' },
  uz: { locale: 'uz-UZ', voice: 'uz-UZ-MadinaNeural' },
  de: { locale: 'de-DE', voice: 'de-DE-KatjaNeural' },
  fr: { locale: 'fr-FR', voice: 'fr-FR-DeniseNeural' },
  it: { locale: 'it-IT', voice: 'it-IT-ElsaNeural' },
  pt: { locale: 'pt-BR', voice: 'pt-BR-FranciscaNeural' },
  ja: { locale: 'ja-JP', voice: 'ja-JP-NanamiNeural' },
  ko: { locale: 'ko-KR', voice: 'ko-KR-SunHiNeural' },
  zh: { locale: 'zh-CN', voice: 'zh-CN-XiaoxiaoNeural' },
  cmn: { locale: 'zh-CN', voice: 'zh-CN-XiaoxiaoNeural' },
  ar: { locale: 'ar-SA', voice: 'ar-SA-ZariyahNeural' },
  tr: { locale: 'tr-TR', voice: 'tr-TR-EmelNeural' },
  nl: { locale: 'nl-NL', voice: 'nl-NL-ColetteNeural' },
  hi: { locale: 'hi-IN', voice: 'hi-IN-SwaraNeural' },
  pl: { locale: 'pl-PL', voice: 'pl-PL-ZofiaNeural' },
  sv: { locale: 'sv-SE', voice: 'sv-SE-SofieNeural' },
  id: { locale: 'id-ID', voice: 'id-ID-GadisNeural' },
  ms: { locale: 'ms-MY', voice: 'ms-MY-YasminNeural' },
  vi: { locale: 'vi-VN', voice: 'vi-VN-HoaiMyNeural' },
  th: { locale: 'th-TH', voice: 'th-TH-PremwadeeNeural' },
  uk: { locale: 'uk-UA', voice: 'uk-UA-PolinaNeural' },
  el: { locale: 'el-GR', voice: 'el-GR-AthinaNeural' },
  cs: { locale: 'cs-CZ', voice: 'cs-CZ-VlastaNeural' },
  ro: { locale: 'ro-RO', voice: 'ro-RO-AlinaNeural' },
  ur: { locale: 'ur-PK', voice: 'ur-PK-UzmaNeural' },
  sw: { locale: 'sw-KE', voice: 'sw-KE-ZuriNeural' },
  fa: { locale: 'fa-IR', voice: 'fa-IR-DilaraNeural' },
};

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

function cacheKey(text: string, langKey: string, rate: number, sync: boolean): string {
  return `${langKey}|${rate.toFixed(2)}|${sync ? 'sync|' : ''}${text}`;
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

function buildAzureSsml(text: string, langKey: string, rate: number): string {
  const cfg = AZURE_VOICES[langKey] || AZURE_VOICES.en;
  const r = Math.min(2, Math.max(0.5, rate || 1));
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
        'User-Agent': 'smarty-english',
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
  const speakingRate = Math.min(2, Math.max(0.5, rate || 1));
  const key = cacheKey(clean, langKey, speakingRate, false);
  const hit = cache.get(key);
  if (hit) {
    hit.at = Date.now();
    return hit.mp3;
  }

  const mp3 = await callAzure(buildAzureSsml(clean, langKey, speakingRate), cfg.key, cfg.region);
  cache.set(key, { mp3, at: Date.now() });
  pruneCache();
  return mp3;
}

/**
 * Azure REST does not expose word-boundary timepoints — synced requests return
 * the mp3 with empty timepoints, and the client falls back to duration-estimated
 * highlighting. (Precise word timing requires the Azure Speech SDK over WS.)
 */
export async function synthesizeMp3WithSync(
  text: string,
  langInput: string,
  rate = 1,
): Promise<TtsSyncResult> {
  const mp3 = await synthesizeMp3(text, langInput, rate);
  return { mp3, timepoints: [] };
}
