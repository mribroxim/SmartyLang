/**
 * Keeps sticker animation cheap. Each animated sticker re-runs its SVG ink
 * filter every frame, so only a few may move at once:
 *  - one shared IntersectionObserver (offscreen stickers freeze)
 *  - hidden tab freezes everything
 *  - budget per liveliness: Lively 4 (2 on small/slow devices), Calm 2 (1), Off 0
 *  - prefers-reduced-motion freezes on a hand-picked poster frame (not `animation:none`,
 *    which would stack every act of the multi-scene signature stickers)
 * Freezing uses the Web Animations API so the poster frame is exact.
 */
import { getPrefs, subscribePrefs } from '../../lib/smarty/prefs';

export type StickerPriority = 'hero' | 'normal' | 'ambient';
export type StickerMode = 'auto' | 'still' | 'once';

interface Entry {
  el: HTMLElement;
  prio: number;
  mode: StickerMode;
  posterMs: number;
  onceMs: number;
  seq: number;
  visible: boolean;
  onceDone: boolean;
  frozenOnce: boolean;
  animating: boolean | null;
  timer?: number;
}

const PRIO: Record<StickerPriority, number> = { hero: 3, normal: 2, ambient: 1 };
const entries = new Map<HTMLElement, Entry>();
let seq = 0;
let io: IntersectionObserver | null = null;
let raf = 0;
let started = false;

const mq = (q: string) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null);
const reducedMq = mq('(prefers-reduced-motion: reduce)');
const smallMq = mq('(max-width: 767px)');

function budget(): number {
  const live = getPrefs().liveliness;
  if (live === 'off') return 0;
  const slow = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4) || !!smallMq?.matches;
  if (live === 'calm') return slow ? 1 : 2;
  return slow ? 2 : 4;
}

function animationsOf(el: HTMLElement): Animation[] {
  if (typeof el.getAnimations !== 'function') return [];
  // Skip the wrapper's own fade-in; only the drawing's animations are scheduled.
  return el.getAnimations({ subtree: true }).filter((a) => (a.effect as KeyframeEffect | null)?.target !== el);
}

function setAnimating(e: Entry, on: boolean) {
  if (e.animating === on) return;
  e.animating = on;
  const svg = e.el.querySelector('svg') as (SVGSVGElement & { pauseAnimations?: () => void }) | null;
  const anims = animationsOf(e.el);
  if (on) {
    // "Play once" counts only time actually spent playing (not offscreen / hidden tab).
    if (e.mode === 'once' && !e.timer) {
      e.timer = window.setTimeout(() => {
        e.onceDone = true;
        // Land on the poster frame: wherever playback happens to stop can hide the cat
        // (e.g. mid curtain-reveal); the poster is picked to show him.
        e.frozenOnce = false;
        e.animating = null;
        scheduleRecompute();
      }, e.onceMs);
    }
    e.el.classList.remove('off');
    anims.forEach((a) => { try { a.play(); } catch { /* detached */ } });
    try { svg?.unpauseAnimations(); } catch { /* no SMIL */ }
  } else {
    // The first freeze lands on the poster frame; later freezes keep the current frame.
    if (!e.frozenOnce) {
      anims.forEach((a) => { try { a.currentTime = e.posterMs; } catch { /* ignore */ } });
      try { svg?.setCurrentTime(e.posterMs / 1000); } catch { /* no SMIL */ }
    }
    e.frozenOnce = true;
    anims.forEach((a) => { try { a.pause(); } catch { /* detached */ } });
    try { svg?.pauseAnimations(); } catch { /* no SMIL */ }
    e.el.classList.add('off');
  }
}

function recompute() {
  raf = 0;
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const reduced = !!reducedMq?.matches;
  const n = hidden || reduced ? 0 : budget();
  const candidates = [...entries.values()]
    .filter((e) => e.visible && e.mode !== 'still' && !e.onceDone)
    .sort((x, y) => y.prio - x.prio || y.seq - x.seq);
  const allowed = new Set(candidates.slice(0, n));
  entries.forEach((e) => setAnimating(e, allowed.has(e)));
}

export function scheduleRecompute() {
  if (typeof window === 'undefined') return;
  if (!raf) raf = window.requestAnimationFrame(recompute);
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((list) => {
      list.forEach((it) => {
        const e = entries.get(it.target as HTMLElement);
        if (e) e.visible = it.isIntersecting;
      });
      scheduleRecompute();
    }, { rootMargin: '120px' });
  }
  document.addEventListener('visibilitychange', scheduleRecompute);
  reducedMq?.addEventListener?.('change', scheduleRecompute);
  smallMq?.addEventListener?.('change', scheduleRecompute);
  subscribePrefs(scheduleRecompute);
}

export function registerSticker(
  el: HTMLElement,
  opts: { priority?: StickerPriority; mode?: StickerMode; posterMs?: number; onceMs?: number },
): () => void {
  start();
  const e: Entry = {
    el,
    prio: PRIO[opts.priority ?? 'normal'],
    mode: opts.mode ?? 'auto',
    posterMs: opts.posterMs ?? 450,
    onceMs: opts.onceMs ?? 2600,
    seq: ++seq,
    visible: true,
    onceDone: false,
    frozenOnce: false,
    animating: null,
  };
  entries.set(el, e);
  io?.observe(el);
  scheduleRecompute();
  return () => {
    if (e.timer) window.clearTimeout(e.timer);
    io?.unobserve(el);
    entries.delete(el);
    scheduleRecompute();
  };
}
