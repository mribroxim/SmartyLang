import { useEffect } from 'react';
import { emitSmarty } from './bus';
import { isFocusRoute } from '../chrome';
import { parseHash } from '../appRoute';

const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const PAGE_STEPS = [60_000, 180_000];
const SESSION_STEP = 30_000;

/**
 * Tells Smarty when the learner goes quiet: 30 s inside a session,
 * 1 and 3 minutes on a normal page. Each step fires once per quiet spell.
 * Pointer movement counts as activity except for the 1-minute desktop
 * "cursor hunter" moment, so the cat can chase a still cursor.
 */
export function useIdle(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    let fired = new Set<number>();
    const reset = () => { last = Date.now(); fired = new Set(); };
    EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const quiet = Date.now() - last;
      const route = parseHash();
      const inSession = !!route && isFocusRoute(route.tab, route.path);
      const steps = inSession ? [SESSION_STEP] : PAGE_STEPS;
      for (const step of steps) {
        if (quiet >= step && !fired.has(step)) {
          fired.add(step);
          emitSmarty({ type: 'idle', ms: step, where: inSession ? 'session' : 'page' });
        }
      }
    }, 5000);
    return () => {
      window.clearInterval(timer);
      EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [enabled]);
}
