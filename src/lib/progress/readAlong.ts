/**
 * Read-along timing: estimated word timings when the TTS engine gives no
 * timepoints (local/native voice or plain audio), plus time → word lookup.
 */

export interface Timepoint { index: number; timeSeconds: number }

const base = (lang: string) => lang.split('-')[0].toLowerCase();

/** Pause (in weight units) a trailing punctuation mark adds after the word is spoken. */
export function trailingPause(token: string): number {
  const m = token.trim().match(/([.!?。！？…]+|[,;:，、；：]+|[-–—]+)["'”’)\]]*$/u);
  if (!m) return 0;
  const p = m[1];
  if (/[.!?。！？…]/u.test(p)) return 1.9;
  if (/[;:；：]/u.test(p)) return 1.1;
  if (/[,，、]/u.test(p)) return 0.8;
  return 0.4;
}

/** Vowel-group syllable estimate for Latin/Cyrillic/Greek words (silent final "e" ignored). */
export function estimateSyllables(letters: string): number {
  let lower = letters.toLowerCase();
  if (/^[a-z]+$/.test(lower) && lower.length > 3) lower = lower.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = lower.match(/[aeiouyаеёиоуыэюяіїєґαεηιουωäöüáéíóúàèìòùâêîôûæøå]+/gi);
  return Math.max(1, groups?.length || Math.ceil(letters.length / 3));
}

/** Language-aware dwell weight for one display token (higher = longer highlight). */
export function tokenDurationWeight(token: string, lang: string): number {
  const b = base(lang);
  const t = token.normalize('NFC');
  if (!t.trim()) return 0.15;
  if (/^[.!?。！？…]+$/u.test(t)) return 2.4;
  if (/^[,;:，、；：]+$/u.test(t)) return 1.1;
  if (/^["'“”‘’()[\]{}「」『』]+$/u.test(t)) return 0.2;

  const letters = t.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
  if (!letters) return 0.3;
  const pause = trailingPause(t);
  const n = [...letters].length;

  if (b === 'zh' || b === 'ja' || /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30FF]/u.test(letters)) return Math.max(1, n) * 1.15 + pause;
  if (b === 'ko' || /[\uAC00-\uD7AF]/u.test(letters)) return Math.max(1, n) * 1.05 + pause;
  if (b === 'th' || /[\u0E00-\u0E7F]/u.test(letters)) return Math.max(1, n) * 0.95 + pause;
  if (b === 'ar' || b === 'fa' || b === 'ur' || /[\u0600-\u06FF]/u.test(letters)) return Math.max(1, n) * 0.55 + pause;
  if (b === 'hi' || /[\u0900-\u097F]/u.test(letters)) return Math.max(1, n) * 0.6 + pause;

  // Long words are spoken a bit faster per syllable; numbers read as digits.
  const syl = /^\d+$/.test(letters) ? Math.min(6, n) : estimateSyllables(letters);
  return 0.5 + syl * 0.8 + pause;
}

/** Cumulative start times (0..1 of total) for each word, from weights. */
export function startFractions(words: string[], lang: string): number[] {
  const w = words.map((x) => Math.max(0.15, tokenDurationWeight(x, lang)));
  const total = w.reduce((s, x) => s + x, 0) || 1;
  let acc = 0;
  return w.map((x) => { const at = acc / total; acc += x; return at; });
}

/** Word being spoken at `progress` (0..1) of the clip, by estimated weights. */
export function progressToWordIndex(words: string[], progress: number, lang: string): number {
  if (!words.length) return 0;
  const p = Math.min(1, Math.max(0, progress));
  if (p >= 1) return words.length - 1;
  const starts = startFractions(words, lang);
  let idx = 0;
  for (let i = 0; i < starts.length; i++) { if (starts[i] <= p) idx = i; else break; }
  return idx;
}

/** Estimated timepoints for a clip of `durationSeconds`, same shape as the server's. */
export function estimateTimepoints(words: string[], durationSeconds: number, lang: string): Timepoint[] {
  return startFractions(words, lang).map((f, index) => ({ index, timeSeconds: f * durationSeconds }));
}

/** Word index at time `t` (timepoints sorted by time). */
export function wordIndexFromTimepoints(timepoints: Timepoint[], t: number, wordCount: number): number {
  if (!timepoints.length || wordCount <= 0) return 0;
  let idx = timepoints[0].index;
  for (const tp of timepoints) {
    if (tp.timeSeconds <= t) idx = tp.index;
    else break;
  }
  return Math.max(0, Math.min(wordCount - 1, idx));
}
