/**
 * Google Gemini text-to-speech (server-side). Gemini returns raw 16-bit PCM
 * (24 kHz mono); we wrap it in a WAV header so browsers can play it directly.
 *
 * Env: GEMINI_API_KEY (required), GEMINI_TTS_MODEL (default gemini-2.5-flash-preview-tts),
 * GEMINI_TTS_VOICE (Smarty's voice, default Puck). Results are cached in memory and on disk.
 */
import { buildCacheId, readDiskCache, writeDiskCache } from './ttsDiskCache.ts';
import { databaseConfigured, query } from './db.ts';

/** Shared cache in Postgres (survives restarts and deploys); the disk and memory caches sit in front of it. */
export async function readDbCache(id: string): Promise<Buffer | null> {
  if (!databaseConfigured) return null;
  try {
    const r = await query<{ audio: Buffer }>('UPDATE speech_audio_cache SET last_used_at = NOW() WHERE id = $1 RETURNING audio', [id]);
    return r.rows[0]?.audio ?? null;
  } catch { return null; }
}
export function writeDbCache(id: string, audio: Buffer, mime: string): void {
  if (!databaseConfigured) return;
  query('INSERT INTO speech_audio_cache (id, mime, audio, bytes) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING', [id, mime, audio, audio.length]).catch(() => { /* cache only */ });
}

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts';
import { DIALOGUE_VOICES } from '../src/lib/dialogueVoices.ts';

/**
 * Voices: Smarty (and all narration) is Puck, upbeat and friendly. In dialogues,
 * girls and women get Leda / Aoede and boys and men get Fenrir / Achird, so two
 * speakers of the same gender still sound different.
 */
const DEFAULT_VOICE = 'Puck';
const DIALOGUE_GEMINI: Record<'female' | 'male', string[]> = { female: ['Leda', 'Aoede'], male: ['Fenrir', 'Achird'] };

/** Map the client's voice tag (Azure dialogue voice name or "smarty") to a Gemini voice. */
export function geminiVoiceFor(tag?: string): string | undefined {
  if (!tag || tag === 'smarty') return undefined;
  if (/^[A-Za-z]+$/.test(tag)) return tag;
  for (const pools of Object.values(DIALOGUE_VOICES)) {
    for (const gender of ['female', 'male'] as const) {
      const i = pools[gender].indexOf(tag);
      if (i >= 0) return DIALOGUE_GEMINI[gender][i % DIALOGUE_GEMINI[gender].length];
    }
  }
  return undefined;
}
const MAX_CHARS = 4000;
const memory = new Map<string, Buffer>();

export function geminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}

/**
 * Gemini may return raw PCM or a complete WAV file. Take only the samples from
 * the "data" chunk: wrapping a WAV inside another WAV plays its header and
 * trailing metadata as loud clicks.
 */
export function extractPcm(raw: Buffer, fallbackRate = 24000): { pcm: Buffer; sampleRate: number } {
  if (raw.length < 12 || raw.toString('ascii', 0, 4) !== 'RIFF' || raw.toString('ascii', 8, 12) !== 'WAVE') return { pcm: raw, sampleRate: fallbackRate };
  let sampleRate = fallbackRate;
  let at = 12;
  while (at + 8 <= raw.length) {
    const id = raw.toString('ascii', at, at + 4);
    const size = raw.readUInt32LE(at + 4);
    const body = at + 8;
    if (id === 'fmt ' && body + 8 <= raw.length) sampleRate = raw.readUInt32LE(body + 4);
    if (id === 'data') return { pcm: raw.subarray(body, Math.min(raw.length, body + size)), sampleRate };
    at = body + size + (size % 2);
  }
  return { pcm: raw.subarray(44), sampleRate };
}

/** Short fade in/out plus a little trailing silence, so clips never start or stop with a click. */
export function smoothEdges(pcm: Buffer, sampleRate = 24000): Buffer {
  const samples = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + (pcm.length & ~1)));
  const fadeIn = Math.min(samples.length >> 2, Math.round(sampleRate * 0.008));
  const fadeOut = Math.min(samples.length >> 2, Math.round(sampleRate * 0.03));
  for (let i = 0; i < fadeIn; i++) samples[i] = Math.round(samples[i] * (i / fadeIn));
  for (let i = 0; i < fadeOut; i++) { const k = samples.length - 1 - i; samples[k] = Math.round(samples[k] * (i / fadeOut)); }
  const tail = Buffer.alloc(Math.round(sampleRate * 0.12) * 2);
  return Buffer.concat([Buffer.from(samples.buffer), tail]);
}

/** Build a WAV file around little-endian 16-bit PCM. */
export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Gemini is sent exactly the text: any instruction risks being read aloud.
 * Audio is always natural speed; the browser slows it down (pitch kept) for
 * the "slow" button.
 */
export function promptFor(text: string): string {
  return text;
}

/** Requests already being synthesized: a second ask for the same clip waits for the first. */
const inFlight = new Map<string, Promise<Buffer>>();
/** After a quota error, skip Gemini for a minute instead of failing every request slowly. */
let coolUntil = 0;

export function synthesizeGeminiWav(text: string, lang: string, rate = 1, voice?: string): Promise<Buffer> {
  const key = `${voice || ''}|${text.trim()}`;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const job = synthesize(text, lang, rate, voice).finally(() => inFlight.delete(key));
  inFlight.set(key, job);
  return job;
}

async function synthesize(text: string, lang: string, rate = 1, voice?: string): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw Object.assign(new Error('GEMINI_API_KEY is not set'), { status: 503 });
  const clean = text.trim().slice(0, MAX_CHARS);
  const voiceName = geminiVoiceFor(voice) ?? (process.env.GEMINI_TTS_VOICE?.trim() || DEFAULT_VOICE);
  const model = process.env.GEMINI_TTS_MODEL?.trim() || DEFAULT_MODEL;
  const cacheId = 'gemini-' + buildCacheId({ text: clean, lang: '*', rate: 1, voice: `${model}:${voiceName}:p4` });
  const local = memory.get(cacheId) ?? readDiskCache(cacheId)?.mp3;
  if (local) return local;
  const shared = await readDbCache(cacheId);
  if (shared) { memory.set(cacheId, shared); writeDiskCache(cacheId, shared); return shared; }
  if (Date.now() < coolUntil) throw Object.assign(new Error('Gemini TTS cooling down after a quota error'), { status: 429 });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptFor(clean) }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) coolUntil = Date.now() + 60_000;
    const detail = (await res.text()).slice(0, 300);
    throw Object.assign(new Error(`Gemini TTS failed (${res.status}): ${detail}`), { status: res.status === 429 ? 429 : 502 });
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!part?.data) throw Object.assign(new Error('Gemini TTS returned no audio'), { status: 502 });
  const rateMatch = /rate=(\d+)/.exec(part.mimeType || '');
  const { pcm, sampleRate } = extractPcm(Buffer.from(part.data, 'base64'), rateMatch ? Number(rateMatch[1]) : 24000);
  const wav = pcmToWav(smoothEdges(pcm, sampleRate), sampleRate);
  memory.set(cacheId, wav);
  if (memory.size > 300) memory.delete(memory.keys().next().value as string);
  writeDiskCache(cacheId, wav);
  writeDbCache(cacheId, wav, 'audio/wav');
  return wav;
}

/**
 * Gemini gives no word timings; estimate them from each word's length across
 * the audio's duration (good enough for read-along highlighting).
 */
export function estimateTimepoints(wav: Buffer, words: string[]): { index: number; timeSeconds: number }[] {
  const header = wav.length >= 44 && wav.toString('ascii', 0, 4) === 'RIFF' ? wav.readUInt32LE(24) : 0;
  const seconds = Math.max(0, (wav.length - 44) / ((header >= 8000 && header <= 96000 ? header : 24000) * 2));
  const weights = words.map((w) => Math.max(1, w.length) + 1);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let at = seconds * 0.04;
  return words.map((_, index) => {
    const tp = { index, timeSeconds: Math.round(at * 100) / 100 };
    at += (seconds * 0.92 * weights[index]) / total;
    return tp;
  });
}
