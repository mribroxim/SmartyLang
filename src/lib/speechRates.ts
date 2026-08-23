/**
 * Fixed TTS speed presets — fewer Azure cache keys, native prosody at each speed.
 * Slow / Normal / Default / Fast
 */
export const SPEECH_RATE_PRESETS = [0.85, 1.0, 1.1, 1.25] as const;

export type SpeechRatePreset = (typeof SPEECH_RATE_PRESETS)[number];

export const DEFAULT_SPEECH_RATE: SpeechRatePreset = 1.1;

export const SPEECH_RATE_LABELS: Record<SpeechRatePreset, string> = {
  0.85: 'Slow',
  1.0: 'Normal',
  1.1: 'Default',
  1.25: 'Fast',
};

/** Snap any slider/API value to the nearest preset. */
export function snapSpeechRate(rate: number): SpeechRatePreset {
  const r = Number.isFinite(Number(rate)) ? Number(rate) : DEFAULT_SPEECH_RATE;
  let best: SpeechRatePreset = DEFAULT_SPEECH_RATE;
  let bestDist = Infinity;
  for (const p of SPEECH_RATE_PRESETS) {
    const d = Math.abs(p - r);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/** Index 0..n-1 for a preset-aligned range input. */
export function speechRateToIndex(rate: number): number {
  const snapped = snapSpeechRate(rate);
  return SPEECH_RATE_PRESETS.indexOf(snapped);
}

export function speechRateFromIndex(index: number): SpeechRatePreset {
  const i = Math.min(SPEECH_RATE_PRESETS.length - 1, Math.max(0, Math.round(index)));
  return SPEECH_RATE_PRESETS[i];
}
