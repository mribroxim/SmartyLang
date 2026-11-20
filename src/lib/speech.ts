/**
 * Text-to-speech via /api/tts (Google Gemini, or Azure Neural TTS), with browser speechSynthesis fallback.
 * Lyric sync: Azure Speech SDK bookmark timepoints (accurate per word);
 * falls back to language-aware duration weights + rAF, or native word-boundary events.
 */

import { getCachedTtsBlob, setCachedTtsBlob, enqueueTtsRetry } from './networkCache';
import { snapSpeechRate } from './speechRates';
import { tokenDurationWeight, progressToWordIndex, wordIndexFromTimepoints, type Timepoint } from './progress/readAlong';

let _audioFallback: HTMLAudioElement | null = null;
let _objectUrl: string | null = null;
let _speakGen = 0;
let _playResolve: ((ok: boolean) => void) | null = null;
let _rafId = 0;

const blobCache = new Map<string, string>();
const BLOB_CACHE_MAX = 80;
const CHUNK_MAX = 3500;
/** Max display tokens per Cloud TTS sync request (SSML mark budget). */
const SYNC_WORDS_PER_CHUNK = 120;

export type SpeakOpts = {
  /** Fired as playback advances through words (0-based index into `words`). */
  onWordIndex?: (index: number) => void;
  /** Word list used for lyric sync (should match on-screen tokens). */
  words?: string[];
  /** Optional Azure voice override (dialogue gender pairing). */
  voice?: string;
};


function langCandidates(lang: string): string[] {
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'fil' || base === 'tl') return ['fil-PH', 'fil', 'tl-PH', 'tl', lang];
  if (base === 'zh' || base === 'cmn') return ['zh-CN', 'zh', 'cmn-CN', lang];
  if (base === 'en') return [lang, 'en-US', 'en-GB', 'en'];
  return [lang, `${base}-${base.toUpperCase()}`, base];
}

function langBase(lang: string): string {
  return lang.split('-')[0].toLowerCase();
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  for (const candidate of langCandidates(lang)) {
    const exact = voices.find(v => v.lang.toLowerCase() === candidate.toLowerCase());
    if (exact) return exact;
  }
  const base = langBase(lang);
  const fuzzy = voices.find(v => v.lang.toLowerCase().startsWith(base));
  if (fuzzy) return fuzzy;
  if (base === 'fil' || base === 'tl') {
    return voices.find(v => /fil|tagalog|tl/i.test(v.lang + ' ' + v.name));
  }
  return undefined;
}

/** Ensure voices are loaded (Chrome returns [] until voiceschanged). */
export function warmSpeechVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length) return;
  const onVoices = () => { synth.removeEventListener('voiceschanged', onVoices); };
  synth.addEventListener('voiceschanged', onVoices);
  synth.getVoices();
}

function stopAudio() {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = 0;
  }
  if (_playResolve) {
    const resolve = _playResolve;
    _playResolve = null;
    resolve(false);
  }
  if (_audioFallback) {
    try { _audioFallback.pause(); } catch { /* ignore */ }
    _audioFallback = null;
  }
  if (_objectUrl) {
    try { URL.revokeObjectURL(_objectUrl); } catch { /* ignore */ }
    _objectUrl = null;
  }
}

function rememberBlobUrl(key: string, url: string) {
  if (blobCache.has(key)) {
    const old = blobCache.get(key)!;
    if (old !== url) {
      try { URL.revokeObjectURL(old); } catch { /* ignore */ }
    }
  }
  blobCache.set(key, url);
  if (blobCache.size > BLOB_CACHE_MAX) {
    const first = blobCache.keys().next().value;
    if (first !== undefined) {
      const old = blobCache.get(first);
      blobCache.delete(first);
      if (old && old !== url) {
        try { URL.revokeObjectURL(old); } catch { /* ignore */ }
      }
    }
  }
}

/** Split long text near sentence/word boundaries for Cloud TTS limits. */
export function chunkSpeechText(text: string, maxLen = CHUNK_MAX): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf('. ', maxLen);
    if (cut < maxLen * 0.35) cut = remaining.lastIndexOf('? ', maxLen);
    if (cut < maxLen * 0.35) cut = remaining.lastIndexOf('! ', maxLen);
    if (cut < maxLen * 0.35) cut = remaining.lastIndexOf(' ', maxLen);
    if (cut <= 0) cut = maxLen;
    else cut += 1;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

/** Build char spans of each word inside `text` for boundary → index mapping. */
function buildWordSpans(text: string, words: string[]): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const w of words) {
    if (!w) {
      spans.push({ start: cursor, end: cursor });
      continue;
    }
    const at = text.indexOf(w, cursor);
    if (at < 0) {
      spans.push({ start: cursor, end: cursor + w.length });
      cursor += w.length;
    } else {
      spans.push({ start: at, end: at + w.length });
      cursor = at + w.length;
    }
  }
  return spans;
}

function charIndexToWordIndexFromSpans(
  spans: Array<{ start: number; end: number }>,
  charIndex: number,
): number {
  if (!spans.length) return 0;
  for (let i = 0; i < spans.length; i++) {
    if (charIndex < spans[i].end) return i;
  }
  return spans.length - 1;
}

/** Blob URLs whose audio is natural speed and must be played at this rate (Gemini voices). */
const naturalSpeedRate = new Map<string, number>();
const markNaturalSpeed = (url: string, type: string, rate: number) => { if (/wav/i.test(type)) naturalSpeedRate.set(url, rate); };

function playUrlWithSync(
  url: string,
  gen: number,
  opts: {
    onProgress?: (progress01: number) => void;
    timepoints?: Timepoint[];
    wordCount?: number;
    wordOffset?: number;
    onWordIndex?: (globalIndex: number) => void;
  },
): Promise<boolean> {
  return new Promise((resolve) => {
    if (gen !== _speakGen) {
      resolve(false);
      return;
    }
    stopAudio();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const audio = new Audio(url);
    // Natural-speed clips (Gemini WAV) are slowed in the browser, keeping the pitch.
    const slow = naturalSpeedRate.get(url);
    if (slow && slow !== 1) { audio.playbackRate = slow; (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true; }
    _audioFallback = audio;
    _playResolve = (ok) => resolve(ok && gen === _speakGen);

    const wordCount = opts.wordCount ?? 0;
    const offset = opts.wordOffset ?? 0;
    const tps = opts.timepoints || [];
    let lastIdx = -1;

    const emitWord = (localIdx: number) => {
      const global = offset + localIdx;
      if (global === lastIdx || gen !== _speakGen) return;
      lastIdx = global;
      opts.onWordIndex?.(global);
    };

    const tick = () => {
      if (gen !== _speakGen || !_audioFallback) return;
      const a = _audioFallback;
      const dur = a.duration;
      if (dur && Number.isFinite(dur) && dur > 0) {
        const t = a.currentTime;
        opts.onProgress?.(Math.min(1, t / dur));
        if (tps.length && wordCount > 0) {
          emitWord(wordIndexFromTimepoints(tps, t, wordCount));
        } else if (opts.onProgress && wordCount > 0 && opts.onWordIndex) {
          // progress-only path handled by caller via onProgress
        }
      }
      if (!a.paused && !a.ended) {
        _rafId = requestAnimationFrame(tick);
      }
    };

    audio.onplay = () => {
      _rafId = requestAnimationFrame(tick);
    };
    audio.ontimeupdate = () => {
      // Backup when rAF throttled in background tabs
      if (gen !== _speakGen) return;
      const dur = audio.duration;
      if (!dur || !Number.isFinite(dur) || dur <= 0) return;
      opts.onProgress?.(Math.min(1, audio.currentTime / dur));
      if (tps.length && wordCount > 0) {
        emitWord(wordIndexFromTimepoints(tps, audio.currentTime, wordCount));
      }
    };
    audio.onended = () => {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = 0;
      }
      opts.onProgress?.(1);
      if (wordCount > 0) emitWord(wordCount - 1);
      if (_playResolve) {
        const r = _playResolve;
        _playResolve = null;
        r(true);
      }
    };
    audio.onerror = () => {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = 0;
      }
      if (_playResolve) {
        const r = _playResolve;
        _playResolve = null;
        r(false);
      }
    };
    audio.play().catch(() => {
      if (_playResolve) {
        const r = _playResolve;
        _playResolve = null;
        r(false);
      }
    });
  });
}

async function fetchCloudMp3(
  text: string,
  lang: string,
  rate: number,
  voice?: string,
): Promise<string | null> {
  const clamped = snapSpeechRate(rate);
  const voiceTag = voice || '';
  const cacheKey = `v2|${lang}|${voiceTag}|${clamped.toFixed(2)}|${text}`;
  const cached = blobCache.get(cacheKey);
  if (cached) return cached;

  // Persistent IDB cache for offline / weak network
  try {
    const idbBlob = await getCachedTtsBlob(cacheKey);
    if (idbBlob && idbBlob.size) {
      const url = URL.createObjectURL(idbBlob);
      markNaturalSpeed(url, idbBlob.type, clamped);
      rememberBlobUrl(cacheKey, url);
      return url;
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, rate: clamped, ...(voice ? { voice } : {}) }),
    });
    if (!res.ok) {
      enqueueTtsRetry(text, lang, clamped);
      return null;
    }
    const blob = await res.blob();
    if (!blob.size) return null;
    void setCachedTtsBlob(cacheKey, blob);
    const url = URL.createObjectURL(blob);
    markNaturalSpeed(url, blob.type, clamped);
    rememberBlobUrl(cacheKey, url);
    return url;
  } catch {
    enqueueTtsRetry(text, lang, clamped);
    return null;
  }
}

async function fetchCloudSynced(
  text: string,
  lang: string,
  rate: number,
  words: string[],
  voice?: string,
): Promise<{ url: string; timepoints: Timepoint[] } | null> {
  const clamped = snapSpeechRate(rate);
  const voiceTag = voice || '';
  const cacheKey = `v2|sync|${lang}|${voiceTag}|${clamped.toFixed(2)}|${words.length}|${text}`;
  // Don't reuse blob cache for sync JSON; always request (server caches)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        lang,
        rate: clamped,
        sync: true,
        words,
        ...(voice ? { voice } : {}),
      }),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      // Older server returned raw mp3 — treat as unsynced
      const blob = await res.blob();
      if (!blob.size) return null;
      const url = URL.createObjectURL(blob);
      rememberBlobUrl(cacheKey, url);
      return { url, timepoints: [] };
    }
    const data = await res.json() as {
      audioContent?: string;
      mime?: string;
      timepoints?: Timepoint[];
    };
    if (!data.audioContent) return null;
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: data.mime || 'audio/mpeg' }));
    markNaturalSpeed(url, data.mime || '', clamped);
    rememberBlobUrl(cacheKey, url);
    const timepoints = Array.isArray(data.timepoints) ? data.timepoints : [];
    return { url, timepoints };
  } catch {
    return null;
  }
}

function speakNativeAsync(
  text: string,
  rate: number,
  lang: string,
  gen: number,
  words: string[],
  onWordIndex?: (index: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || gen !== _speakGen) {
      resolve(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCandidates(lang)[0] || lang;
    utterance.rate = rate;
    const voice = pickVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    const spans = buildWordSpans(text, words);
    let lastIdx = -1;
    let gotBoundary = false;
    const emit = (idx: number) => {
      const clamped = Math.max(0, Math.min(words.length - 1, idx));
      if (clamped === lastIdx || gen !== _speakGen) return;
      lastIdx = clamped;
      onWordIndex?.(clamped);
    };

    utterance.onboundary = (e) => {
      if (e.name !== 'word' || gen !== _speakGen) return;
      gotBoundary = true;
      emit(charIndexToWordIndexFromSpans(spans, e.charIndex));
    };

    // Fallback ticker only when the voice never fires word boundaries
    const started = Date.now();
    const weights = words.map(w => tokenDurationWeight(w, lang));
    const weightSum = weights.reduce((s, w) => s + w, 0) || 1;
    const approxMs = Math.max(900, (weightSum / Math.max(0.4, rate)) * 220);
    const tick = window.setInterval(() => {
      if (gen !== _speakGen) {
        window.clearInterval(tick);
        return;
      }
      if (gotBoundary) return; // trust boundary events
      const p = Math.min(0.98, (Date.now() - started) / approxMs);
      emit(progressToWordIndex(words, p, lang));
    }, 50);

    utterance.onend = () => {
      window.clearInterval(tick);
      if (gen === _speakGen && words.length) emit(words.length - 1);
      resolve(gen === _speakGen);
    };
    utterance.onerror = () => {
      window.clearInterval(tick);
      resolve(false);
    };

    if (words.length) emit(0);
    window.speechSynthesis.speak(utterance);
  });
}

/** Slice original text covering words[from..to) using indexOf alignment. */
function textSliceForWords(fullText: string, words: string[], from: number, to: number): string {
  if (from >= to) return '';
  const sliceWords = words.slice(from, to);
  let cursor = 0;
  // Advance cursor to start of `from` word
  for (let i = 0; i < from; i++) {
    const at = fullText.indexOf(words[i], cursor);
    if (at >= 0) cursor = at + words[i].length;
  }
  const startAt = fullText.indexOf(sliceWords[0], cursor);
  if (startAt < 0) return sliceWords.join(' ');
  let end = startAt;
  let search = startAt;
  for (const w of sliceWords) {
    const at = fullText.indexOf(w, search);
    if (at < 0) break;
    end = at + w.length;
    search = end;
  }
  return fullText.slice(startAt, end).trim() || sliceWords.join(' ');
}

async function speakAsync(
  text: string,
  rate: number,
  lang: string,
  opts?: SpeakOpts,
): Promise<boolean> {
  const clean = text.trim();
  if (!clean) return false;
  rate = snapSpeechRate(Number.isFinite(Number(rate)) ? Number(rate) : 1.0);

  const gen = ++_speakGen;
  const words = (opts?.words?.length ? opts.words : clean.split(/\s+/).filter(Boolean));
  const onWordIndex = opts?.onWordIndex;
  const voice = opts?.voice;
  const wantSync = !!(onWordIndex && words.length);

  let lastIdx = -1;
  const emit = (idx: number) => {
    const clamped = Math.max(0, Math.min(words.length - 1, idx));
    if (clamped === lastIdx || gen !== _speakGen) return;
    lastIdx = clamped;
    onWordIndex?.(clamped);
  };

  if (words.length) emit(0);

  // ── Synced Cloud TTS (preferred for lyric highlight) ──
  if (wantSync) {
    for (let start = 0; start < words.length; start += SYNC_WORDS_PER_CHUNK) {
      if (gen !== _speakGen) return false;
      const end = Math.min(words.length, start + SYNC_WORDS_PER_CHUNK);
      const chunkWords = words.slice(start, end);
      const chunkText = textSliceForWords(clean, words, start, end);
      if (!chunkText) continue;

      const synced = await fetchCloudSynced(chunkText, lang, rate, chunkWords, voice);
      if (synced) {
        const localCount = chunkWords.length;
        const ok = await playUrlWithSync(synced.url, gen, {
          timepoints: synced.timepoints.map(tp => ({
            index: Math.max(0, Math.min(localCount - 1, tp.index)),
            timeSeconds: tp.timeSeconds,
          })),
          wordCount: localCount,
          wordOffset: start,
          onWordIndex: emit,
          onProgress: synced.timepoints.length
            ? undefined
            : (p) => emit(start + progressToWordIndex(chunkWords, p, lang)),
        });
        if (ok) continue;
      }

      // Cloud failed for this chunk — try plain cloud then native for remainder
      if (gen !== _speakGen) return false;
      const plainUrl = await fetchCloudMp3(chunkText, lang, rate, voice);
      if (plainUrl) {
        const ok = await playUrlWithSync(plainUrl, gen, {
          wordCount: chunkWords.length,
          wordOffset: start,
          onWordIndex: emit,
          onProgress: (p) => emit(start + progressToWordIndex(chunkWords, p, lang)),
        });
        if (ok) continue;
      }

      if (gen !== _speakGen) return false;
      const restWords = words.slice(start);
      const restText = textSliceForWords(clean, words, start, words.length) || restWords.join(' ');
      return speakNativeAsync(restText, rate, lang, gen, restWords, (localIdx) => emit(start + localIdx));
    }

    if (gen === _speakGen && words.length) emit(words.length - 1);
    return gen === _speakGen;
  }

  // ── Plain (no lyric sync) ──
  const chunks = chunkSpeechText(clean);
  for (const chunk of chunks) {
    if (gen !== _speakGen) return false;
    const url = await fetchCloudMp3(chunk, lang, rate, voice);
    if (!url) {
      if (gen !== _speakGen) return false;
      return speakNativeAsync(
        chunks.slice(chunks.indexOf(chunk)).join(' '),
        rate,
        lang,
        gen,
        words,
        onWordIndex,
      );
    }
    const ok = await playUrlWithSync(url, gen, {});
    if (!ok) {
      if (gen !== _speakGen) return false;
      return speakNativeAsync(
        chunks.slice(chunks.indexOf(chunk)).join(' '),
        rate,
        lang,
        gen,
        words,
        onWordIndex,
      );
    }
  }
  return gen === _speakGen;
}

/** Normalize (rate, lang) when callers pass locale as the 2nd argument. */
function resolveRateLang(
  rateOrLang: number | string = 1.0,
  lang: string = 'en-US',
): { rate: number; lang: string } {
  if (typeof rateOrLang === 'string') {
    return { rate: 1.0, lang: rateOrLang || lang };
  }
  const rate = typeof rateOrLang === 'number' && Number.isFinite(rateOrLang) ? rateOrLang : 1.0;
  return { rate, lang };
}

export function playWord(word: string, rateOrLang: number | string = 1.0, lang: string = 'en-US'): boolean {
  const cleanWord = word.replace(/[^\p{L}\p{M}'’-]/gu, '');
  if (!cleanWord) return false;
  const resolved = resolveRateLang(rateOrLang, lang);
  void speakAsync(cleanWord, resolved.rate, resolved.lang);
  return true;
}

export function speakText(text: string, rateOrLang: number | string = 1.0, lang: string = 'en-US'): boolean {
  if (!text.trim()) return false;
  const resolved = resolveRateLang(rateOrLang, lang);
  void speakAsync(text, resolved.rate, resolved.lang);
  return true;
}

/** Returns a promise that resolves when playback finishes (or is cancelled). */
export function speakTextAsync(
  text: string,
  rateOrLang: number | string = 1.0,
  lang: string = 'en-US',
  opts?: SpeakOpts,
): Promise<boolean> {
  if (!text.trim()) return Promise.resolve(false);
  const resolved = resolveRateLang(rateOrLang, lang);
  return speakAsync(text, resolved.rate, resolved.lang, opts);
}

export function cancelSpeech() {
  _speakGen++;
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = 0;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  stopAudio();
}

export function isSpeechPlaying(): boolean {
  return !!_audioFallback && !_audioFallback.paused;
}
