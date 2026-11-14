import { mascotReact } from '../components/mascot/mascotBus';
import { getPrefs } from './smarty/prefs';

let sharedCtx: any = null;

export type SoundType =
  | 'click' | 'success' | 'complete' | 'fail' | 'hover' | 'bop' | 'start_record' | 'stop_record' | 'tick'
  | 'heart-lost' | 'heart-refill' | 'level-up' | 'meow';

/** Short vibration on phones, if the learner allows it in Settings → Smarty. */
export function haptic(pattern: number | number[]) {
  try {
    if (!getPrefs().haptics) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch { /* unsupported */ }
}

/** Play a little melody: [frequency, startOffsetSec, durationSec][]. */
function tones(ctx: any, wave: OscillatorType, notes: [number, number, number][], vol = 0.09) {
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
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    if (!sharedCtx) {
      sharedCtx = new AudioContext();
    }
    
    // Resume context if it was suspended by the browser
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    
    const ctx = sharedCtx;
    if (type === 'heart-lost') { tones(ctx, 'triangle', [[392, 0, 0.12], [311, 0.11, 0.22]]); return; }
    if (type === 'heart-refill') { tones(ctx, 'sine', [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.18]]); return; }
    if (type === 'level-up') { tones(ctx, 'triangle', [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]], 0.1); return; }
    if (type === 'meow') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.12); o.frequency.exponentialRampToValueAtTime(600, t + 0.35);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.start(t); o.stop(t + 0.4);
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'bop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'complete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'start_record') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'stop_record') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    // Ignore audio errors silently
  }
};
