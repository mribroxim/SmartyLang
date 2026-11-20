import { mascotReact } from '../components/mascot/mascotBus';
import { getPrefs } from './smarty/prefs';

let sharedCtx: any = null;

export type SoundType =
  | 'click' | 'success' | 'complete' | 'fail' | 'hover' | 'bop' | 'start_record' | 'stop_record' | 'tick'
  | 'heart-lost' | 'heart-refill' | 'level-up' | 'meow'
  /** Rewards and UI life: coins, chests, pops, whooshes, sparkles, purchases, soft taps. */
  | 'coin' | 'chest-open' | 'pop' | 'whoosh' | 'sparkle' | 'purchase' | 'tap';

/** Short vibration on phones, if the learner allows it in Settings → Smarty. */
export function haptic(pattern: number | number[]) {
  try {
    if (!getPrefs().haptics) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch { /* unsupported */ }
}

/** Play a little melody: [frequency, startOffsetSec, durationSec][]. Quiet synth fallback only. */
function tones(ctx: any, wave: OscillatorType, notes: [number, number, number][], vol = 0.05) {
  for (const [freq, at, dur] of notes) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.connect(g); g.connect(ctx.destination);
    const t0 = ctx.currentTime + at;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
}

/** Sample file (public/sounds/<file>.mp3) and playback gain per sound type. */
const SAMPLES: Partial<Record<SoundType, { file: string; gain: number }>> = {
  success: { file: 'success', gain: 0.55 },
  fail: { file: 'fail', gain: 0.6 },
  complete: { file: 'complete', gain: 0.55 },
  'level-up': { file: 'level-up', gain: 0.55 },
  coin: { file: 'coin', gain: 0.45 },
  purchase: { file: 'purchase', gain: 0.5 },
  'chest-open': { file: 'chest-open', gain: 0.55 },
  sparkle: { file: 'sparkle', gain: 0.35 },
  'heart-lost': { file: 'heart-lost', gain: 0.55 },
  'heart-refill': { file: 'heart-refill', gain: 0.5 },
  start_record: { file: 'rec-start', gain: 0.4 },
  stop_record: { file: 'rec-stop', gain: 0.4 },
  pop: { file: 'pop', gain: 0.5 },
  tap: { file: 'tap', gain: 0.5 },
  bop: { file: 'tap', gain: 0.5 },
  click: { file: 'click', gain: 0.45 },
  tick: { file: 'tick', gain: 0.35 },
  whoosh: { file: 'whoosh', gain: 0.3 },
};

const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
const failed = new Set<string>();

function getCtx(): any | null {
  const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sharedCtx) sharedCtx = new AudioContextCtor();
  if (sharedCtx.state === 'suspended') sharedCtx.resume?.();
  return sharedCtx;
}

function loadBuffer(ctx: any, file: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(file);
  if (cached) return Promise.resolve(cached);
  if (failed.has(file)) return Promise.resolve(null);
  let p = loading.get(file);
  if (!p) {
    const base = (import.meta as any).env?.BASE_URL ?? '/';
    p = fetch(`${base}sounds/${file}.mp3`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then(data => new Promise<AudioBuffer>((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
      .then(buf => { buffers.set(file, buf); return buf; })
      .catch(() => { failed.add(file); return null; })
      .finally(() => { loading.delete(file); });
    loading.set(file, p);
  }
  return p;
}

function preloadAll() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    for (const f of new Set(Object.values(SAMPLES).map(s => s!.file))) void loadBuffer(ctx, f);
  } catch { /* ignore */ }
}

// Decode every sample once, on the first user gesture (autoplay policy).
if (typeof window !== 'undefined') {
  const onGesture = () => {
    window.removeEventListener('pointerdown', onGesture, true);
    window.removeEventListener('keydown', onGesture, true);
    if (getPrefs().sound) preloadAll();
  };
  window.addEventListener('pointerdown', onGesture, true);
  window.addEventListener('keydown', onGesture, true);
}

function playBuffer(ctx: any, buf: AudioBuffer, gain: number) {
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(g); g.connect(ctx.destination);
  src.start();
}

/** Quiet synthesized fallback (also used for sounds without a sample: hover, meow). */
function synth(ctx: any, type: SoundType) {
  switch (type) {
    case 'success': tones(ctx, 'sine', [[1175, 0, 0.18]]); break;
    case 'fail': tones(ctx, 'sine', [[220, 0, 0.18]], 0.07); break;
    case 'complete': case 'level-up': tones(ctx, 'triangle', [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]], 0.06); break;
    case 'coin': tones(ctx, 'sine', [[988, 0, 0.06], [1319, 0.06, 0.16]], 0.04); break;
    case 'chest-open': tones(ctx, 'triangle', [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.1], [1047, 0.3, 0.35]], 0.06); break;
    case 'purchase': tones(ctx, 'triangle', [[659, 0, 0.08], [880, 0.08, 0.08], [1319, 0.16, 0.2]], 0.05); break;
    case 'sparkle': tones(ctx, 'sine', [[1568, 0, 0.08], [2093, 0.06, 0.08], [2637, 0.12, 0.14]], 0.03); break;
    case 'heart-lost': tones(ctx, 'sine', [[330, 0, 0.12], [262, 0.11, 0.22]], 0.06); break;
    case 'heart-refill': tones(ctx, 'sine', [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.18]], 0.05); break;
    case 'pop': case 'tap': case 'bop': case 'click': tones(ctx, 'sine', [[700, 0, 0.04]], 0.04); break;
    case 'start_record': tones(ctx, 'sine', [[500, 0, 0.08], [700, 0.08, 0.1]], 0.04); break;
    case 'stop_record': tones(ctx, 'sine', [[700, 0, 0.08], [500, 0.08, 0.1]], 0.04); break;
    case 'meow': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.12); o.frequency.exponentialRampToValueAtTime(600, t + 0.35);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.start(t); o.stop(t + 0.4);
      break;
    }
    case 'hover': case 'tick': case 'whoosh': default: break; // intentionally silent
  }
}

export const playSound = (type: SoundType, options?: { mascot?: boolean }) => {
  // Answer feedback doubles as mascot feedback (floating Smarty reacts).
  if (options?.mascot !== false) {
    if (type === 'success') mascotReact('correct');
    else if (type === 'fail') mascotReact('wrong');
    else if (type === 'complete') mascotReact('complete');
  }

  if (type === 'fail' || type === 'heart-lost') haptic(60);
  else if (type === 'complete' || type === 'level-up') haptic([30, 40, 30]);

  if (!getPrefs().sound) return;

  try {
    const ctx = getCtx();
    if (!ctx) return;

    const sample = SAMPLES[type];
    if (!sample) { synth(ctx, type); return; }

    const ready = buffers.get(sample.file);
    if (ready) { playBuffer(ctx, ready, sample.gain); return; }
    if (failed.has(sample.file)) { synth(ctx, type); return; }
    // Not decoded yet (first sound): play once loaded, falling back to synth if it fails.
    void loadBuffer(ctx, sample.file).then(buf => {
      try { if (buf) playBuffer(ctx, buf, sample.gain); else synth(ctx, type); } catch { /* ignore */ }
    });
    preloadAll();
  } catch {
    // Ignore audio errors silently
  }
};
