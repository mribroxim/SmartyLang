/**
 * Local, offline text-to-speech (sherpa-onnx). No quota, no network: the models are downloaded once
 * by `node scripts/tts/download-models.mjs` into $TTS_MODELS_DIR (default ./models/tts).
 *
 *  - Kokoro 82M (Apache-2.0): English, Chinese
 *  - Piper VITS voices: Spanish, Russian, German, French, Arabic
 *  - Meta MMS-TTS (VITS, CC-BY-NC-4.0): Uzbek, Tagalog
 *
 * Output is a 16-bit mono WAV at natural speed (the browser slows it down for "slow" mode, like the
 * Gemini path). Caches: memory -> disk (.tts-cache) -> Postgres speech_audio_cache, ids prefixed "local-".
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { buildCacheId, readDiskCache, writeDiskCache } from './ttsDiskCache.ts';
import { readDbCache, writeDbCache, smoothEdges, pcmToWav } from './geminiTts.ts';
import { DIALOGUE_VOICES } from '../src/lib/dialogueVoices.ts';

const require = createRequire(import.meta.url);

type Gender = 'female' | 'male';
interface Voice { model: string; sid?: number; variant?: 'en' | 'zh' }
interface LangVoices { smarty: Voice; female: Voice[]; male: Voice[] }

const KOKORO = 'kokoro-multi-lang-v1_0';
const piper = (id: string): Voice => ({ model: id });
const kokoro = (sid: number, variant: 'en' | 'zh'): Voice => ({ model: KOKORO, sid, variant });

/** Kokoro speaker ids come from the model's own id2speaker table (af_heart = 3, ...). */
const VOICES: Record<string, LangVoices> = {
  en: { smarty: kokoro(3, 'en'), female: [kokoro(2, 'en'), kokoro(6, 'en')], male: [kokoro(16, 'en'), kokoro(14, 'en')] }, // af_heart | af_bella af_nicole | am_michael am_fenrir
  es: { smarty: piper('vits-piper-es_MX-claude-high'), female: [piper('vits-piper-es_MX-claude-high')], male: [piper('vits-piper-es_ES-davefx-medium')] },
  zh: { smarty: kokoro(47, 'zh'), female: [kokoro(47, 'zh'), kokoro(48, 'zh')], male: [kokoro(50, 'zh'), kokoro(49, 'zh')] }, // zf_xiaoxiao zf_xiaoyi | zm_yunxi zm_yunjian
  ru: { smarty: piper('vits-piper-ru_RU-irina-medium'), female: [piper('vits-piper-ru_RU-irina-medium')], male: [piper('vits-piper-ru_RU-dmitri-medium')] },
  de: { smarty: piper('vits-piper-de_DE-kerstin-low'), female: [piper('vits-piper-de_DE-kerstin-low')], male: [piper('vits-piper-de_DE-thorsten-high')] },
  fr: { smarty: piper('vits-piper-fr_FR-siwis-medium'), female: [piper('vits-piper-fr_FR-siwis-medium')], male: [piper('vits-piper-fr_FR-tom-medium')] },
  ar: { smarty: piper('vits-piper-ar_JO-SA_miro_V2-high'), female: [piper('vits-piper-ar_JO-SA_miro_V2-high')], male: [piper('vits-piper-ar_JO-kareem-medium')] },
  uz: { smarty: piper('mms-uzb'), female: [piper('mms-uzb')], male: [piper('mms-uzb')] },
  tl: { smarty: piper('mms-tgl'), female: [piper('mms-tgl')], male: [piper('mms-tgl')] },
};

const MAX_CHARS = 4000;
const MAX_LOADED = Math.max(2, Number(process.env.TTS_MAX_LOADED_MODELS) || 10);

export function localModelsDir(): string {
  return path.resolve(process.cwd(), process.env.TTS_MODELS_DIR?.trim() || 'models/tts');
}
function modelDir(id: string): string { return path.join(localModelsDir(), id); }
function modelPresent(id: string): boolean {
  try { return fs.existsSync(path.join(modelDir(id), 'tokens.txt')); } catch { return false; }
}

/** "en-US" / "fil-PH" / "zh_CN" -> "en" / "tl" / "zh". */
export function localLangOf(lang: string): string {
  const base = String(lang || 'en').toLowerCase().split(/[-_]/)[0];
  return base === 'fil' ? 'tl' : base;
}

let sherpaLib: any;
let sherpaFailed = false;
function sherpa(): any {
  if (sherpaLib) return sherpaLib;
  if (sherpaFailed) return null;
  try { sherpaLib = require('sherpa-onnx-node'); return sherpaLib; } catch (e: any) {
    sherpaFailed = true;
    console.warn('[tts] sherpa-onnx-node could not be loaded:', e?.message || e);
    return null;
  }
}

/** True when the engine and at least one model are installed. */
export function localTtsConfigured(): boolean {
  if (process.env.LOCAL_TTS === '0') return false;
  if (!sherpa()) return false;
  return Object.keys(VOICES).some((l) => modelPresent(VOICES[l].smarty.model));
}

/** Languages (2-letter codes) this server can speak locally right now. */
export function localTtsLanguages(): string[] {
  if (!localTtsConfigured()) return [];
  return Object.keys(VOICES).filter((l) => modelPresent(VOICES[l].smarty.model));
}

export function localTtsSupports(lang: string): boolean {
  return localTtsLanguages().includes(localLangOf(lang));
}

/** Map the client's voice tag (Azure dialogue voice name or "smarty") to a local voice. */
export function localVoiceFor(lang: string, tag?: string): Voice {
  const base = localLangOf(lang);
  const set = VOICES[base];
  if (!set) throw Object.assign(new Error(`No local voice for language "${lang}"`), { status: 501 });
  let picked = set.smarty;
  if (tag && tag !== 'smarty') {
    outer: for (const [code, pools] of [[base, DIALOGUE_VOICES[base]] as const, ...Object.entries(DIALOGUE_VOICES)]) {
      if (!pools) continue;
      for (const gender of ['female', 'male'] as Gender[]) {
        const i = pools[gender].indexOf(tag);
        if (i >= 0) {
          const pool = (VOICES[base] ?? VOICES[code])[gender];
          picked = pool[i % pool.length];
          break outer;
        }
      }
    }
  }
  return modelPresent(picked.model) ? picked : set.smarty;
}

// ---------------------------------------------------------------------------------------------
// Model loading (lazy, kept in memory, least-recently-used eviction)
// ---------------------------------------------------------------------------------------------

interface Engine { tts: any; queue: Promise<unknown>; lastUsed: number; vocab?: Set<string> }
const engines = new Map<string, Promise<Engine>>();

function onnxFile(dir: string): string {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.onnx'));
  const plain = files.find((f) => !/int8|fp16/.test(f)) ?? files[0];
  if (!plain) throw new Error(`No .onnx file in ${dir}`);
  return path.join(dir, plain);
}

function engineKey(v: Voice): string { return v.variant ? `${v.model}#${v.variant}` : v.model; }

function buildConfig(v: Voice): any {
  const dir = modelDir(v.model);
  const numThreads = Math.max(1, Number(process.env.TTS_THREADS) || 4);
  if (v.model === KOKORO) {
    const lexUs = path.join(dir, 'lexicon-us-en.txt');
    const kokoroCfg: Record<string, unknown> = {
      model: path.join(dir, 'model.onnx'),
      voices: path.join(dir, 'voices.bin'),
      tokens: path.join(dir, 'tokens.txt'),
      dataDir: path.join(dir, 'espeak-ng-data'),
      lexicon: '',
      lang: 'en-us',
    };
    let ruleFsts = '';
    if (v.variant === 'en') kokoroCfg.lexicon = lexUs;
    if (v.variant === 'zh') {
      kokoroCfg.dictDir = path.join(dir, 'dict');
      kokoroCfg.lexicon = [lexUs, path.join(dir, 'lexicon-zh.txt')].join(',');
      ruleFsts = ['phone-zh.fst', 'date-zh.fst', 'number-zh.fst'].map((f) => path.join(dir, f)).join(',');
    }
    return { model: { kokoro: kokoroCfg, numThreads, provider: 'cpu' }, ruleFsts, maxNumSentences: 1, silenceScale: 0.2 };
  }
  const espeak = path.join(dir, 'espeak-ng-data');
  const vits: Record<string, unknown> = { model: onnxFile(dir), tokens: path.join(dir, 'tokens.txt') };
  if (fs.existsSync(espeak)) vits.dataDir = espeak;
  return { model: { vits, numThreads, provider: 'cpu' }, maxNumSentences: 1, silenceScale: 0.2 };
}

function isMms(v: Voice): boolean { return v.model.startsWith('mms-'); }

function loadEngine(v: Voice): Promise<Engine> {
  const key = engineKey(v);
  const hit = engines.get(key);
  if (hit) return hit;
  const lib = sherpa();
  if (!lib) return Promise.reject(Object.assign(new Error('sherpa-onnx is not available'), { status: 503 }));
  if (!modelPresent(v.model)) return Promise.reject(Object.assign(new Error(`TTS model "${v.model}" is not downloaded`), { status: 503 }));
  // Loading is a short synchronous call (~1 s); do it on the next tick so request handling is not mid-flight.
  const job = new Promise<Engine>((resolve, reject) => {
    setImmediate(() => {
      try {
        const tts = new lib.OfflineTts(buildConfig(v));
        let vocab: Set<string> | undefined;
        if (isMms(v)) {
          vocab = new Set(fs.readFileSync(path.join(modelDir(v.model), 'tokens.txt'), 'utf8').split('\n').map((l) => l.replace(/\r$/, '')).filter(Boolean).map((l) => l.slice(0, l.lastIndexOf(' '))));
        }
        resolve({ tts, queue: Promise.resolve(), lastUsed: Date.now(), vocab });
      } catch (e) { reject(e); }
    });
  });
  engines.set(key, job);
  job.catch(() => engines.delete(key));
  evictIdle(key);
  return job;
}

function evictIdle(keep: string): void {
  while (engines.size > MAX_LOADED) {
    // Map keeps insertion order: drop the oldest key that is not the one just requested.
    const victim = [...engines.keys()].find((k) => k !== keep);
    if (!victim) return;
    engines.delete(victim); // the native handle is released once garbage collected
  }
}

// ---------------------------------------------------------------------------------------------
// Text preparation
// ---------------------------------------------------------------------------------------------

/** Uzbek Latin (oʻ gʻ sh ch ...) to Cyrillic, the script the MMS Uzbek model was trained on. */
export function uzbekLatinToCyrillic(input: string): string {
  let s = input.normalize('NFC').replace(/[ʻʼ‘’`´']/g, '’');
  const map: [RegExp, string][] = [
    [/(?<![\p{L}])e/giu, 'э'], // word-initial e
    [/o’/gi, 'ў'], [/g’/gi, 'ғ'],
    [/sh/gi, 'ш'], [/ch/gi, 'ч'], [/ng/gi, 'нг'], [/yo/gi, 'ё'], [/yu/gi, 'ю'], [/ya/gi, 'я'], [/ye/gi, 'е'], [/ts/gi, 'ц'],
    [/’/g, 'ъ'],
  ];
  const single: Record<string, string> = {
    a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
    p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з',
  };
  const keepCase = (from: string, to: string) => (from[0] !== from[0].toLowerCase() ? to.toUpperCase() : to);
  for (const [re, to] of map) s = s.replace(re, (m) => keepCase(m, to));
  return s.replace(/[A-Za-z]/g, (c) => keepCase(c, single[c.toLowerCase()] ?? c));
}

interface Segment { text: string; pause: number }

/** MMS ignores punctuation, so split on it ourselves and insert short silences. */
function mmsSegments(text: string, lang: string, vocab: Set<string>): Segment[] {
  let t = text.replace(/\s+/g, ' ').trim();
  if (lang === 'uz') t = uzbekLatinToCyrillic(t);
  t = t.toLowerCase();
  const segments: Segment[] = [];
  for (const part of t.split(/([.!?…。]+|[,;:،]+|\n+)/u)) {
    if (!part) continue;
    if (/^([.!?…。]+|[,;:،]+)$/u.test(part)) {
      if (segments.length) segments[segments.length - 1].pause = /[.!?…。]/u.test(part) ? 0.32 : 0.16;
      continue;
    }
    let cleaned = '';
    for (const ch of part.normalize('NFC')) {
      if (vocab.has(ch)) { cleaned += ch; continue; }
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      cleaned += base && vocab.has(base) ? base : ch === '’' || ch === '‘' ? '' : ' ';
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (cleaned) segments.push({ text: cleaned, pause: 0.1 });
  }
  return segments;
}

// ---------------------------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------------------------

let active = 0;
const waiting: (() => void)[] = [];
const MAX_PARALLEL = Math.max(1, Number(process.env.TTS_PARALLEL) || 2);
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
}

async function generate(engine: Engine, text: string, sid: number): Promise<{ samples: Float32Array; sampleRate: number }> {
  // One request at a time per loaded model (the native object is not re-entrant); generateAsync runs off the main thread.
  const run = engine.queue.then(() => engine.tts.generateAsync({ text, sid, speed: 1 }));
  engine.queue = run.catch(() => undefined);
  const audio = await run;
  engine.lastUsed = Date.now();
  return { samples: audio.samples as Float32Array, sampleRate: audio.sampleRate as number };
}

function floatToPcm(chunks: { samples: Float32Array; pause: number }[], sampleRate: number): Buffer {
  let total = 0;
  for (const c of chunks) total += c.samples.length + Math.round(c.pause * sampleRate);
  let peak = 0;
  for (const c of chunks) for (let i = 0; i < c.samples.length; i++) { const a = Math.abs(c.samples[i]); if (a > peak) peak = a; }
  // Only ever boost quiet voices (MMS is soft); loud ones are left alone.
  const gain = peak > 0 && peak < 0.7 ? Math.min(8, 0.85 / peak) : 1;
  const out = new Int16Array(total);
  let at = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.samples.length; i++) out[at++] = Math.max(-32768, Math.min(32767, Math.round(c.samples[i] * gain * 32767)));
    at += Math.round(c.pause * sampleRate);
  }
  return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
}

async function synthesizeNow(text: string, lang: string, voice: Voice): Promise<Buffer> {
  const engine = await loadEngine(voice);
  const sid = voice.sid ?? 0;
  const base = localLangOf(lang);
  const chunks: { samples: Float32Array; pause: number }[] = [];
  let sampleRate = 24000;
  if (isMms(voice)) {
    const segments = mmsSegments(text, base, engine.vocab!);
    if (!segments.length) throw Object.assign(new Error('Nothing speakable in the text'), { status: 422 });
    for (const seg of segments) {
      const a = await generate(engine, seg.text, sid);
      sampleRate = a.sampleRate;
      chunks.push({ samples: a.samples, pause: seg.pause });
    }
    chunks[chunks.length - 1].pause = 0;
  } else {
    const a = await generate(engine, text, sid);
    sampleRate = a.sampleRate;
    chunks.push({ samples: a.samples, pause: 0 });
  }
  const pcm = floatToPcm(chunks, sampleRate);
  if (pcm.length < 200) throw Object.assign(new Error('Local TTS produced no audio'), { status: 502 });
  return pcmToWav(smoothEdges(pcm, sampleRate), sampleRate);
}

const memory = new Map<string, Buffer>();
const inFlight = new Map<string, Promise<Buffer>>();

/** Speak `text` in `lang`. `rate` is ignored on purpose: audio is natural speed, the browser slows it for "slow". */
export function synthesizeLocalWav(text: string, lang: string, _rate = 1, voiceTag?: string): Promise<Buffer> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
  if (!clean) return Promise.reject(Object.assign(new Error('Missing text'), { status: 400 }));
  let voice: Voice;
  try { voice = localVoiceFor(lang, voiceTag); } catch (e) { return Promise.reject(e); }
  const base = localLangOf(lang);
  const cacheId = 'local-' + buildCacheId({ text: clean, lang: base, rate: 1, voice: `${voice.model}:${voice.sid ?? 0}:l1` });
  const hit = memory.get(cacheId);
  if (hit) return Promise.resolve(hit);
  const pending = inFlight.get(cacheId);
  if (pending) return pending;
  const job = (async () => {
    const disk = readDiskCache(cacheId)?.mp3;
    if (disk) { memory.set(cacheId, disk); return disk; }
    const shared = await readDbCache(cacheId);
    if (shared) { memory.set(cacheId, shared); writeDiskCache(cacheId, shared); return shared; }
    const wav = await withSlot(() => synthesizeNow(clean, base, voice));
    memory.set(cacheId, wav);
    if (memory.size > 300) memory.delete(memory.keys().next().value as string);
    writeDiskCache(cacheId, wav);
    writeDbCache(cacheId, wav, 'audio/wav');
    return wav;
  })().finally(() => inFlight.delete(cacheId));
  inFlight.set(cacheId, job);
  return job;
}

/** Load the models for the given languages ahead of the first request (optional, used at startup). */
export async function warmLocalTts(langs: string[] = ['en']): Promise<void> {
  for (const l of langs) {
    if (!localTtsSupports(l)) continue;
    try { await loadEngine(localVoiceFor(l)); } catch (e: any) { console.warn(`[tts] warm-up for ${l} failed:`, e?.message || e); }
  }
}
