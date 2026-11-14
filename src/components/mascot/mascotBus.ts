/**
 * Tiny event bus so any code (exercises, audio, habit engine) can make the
 * mascot react without prop-drilling. <SmartyHost/> shows the reactions.
 */
export type MascotReaction = 'correct' | 'wrong' | 'complete';

export interface MascotEventDetail {
  kind: MascotReaction;
  /** Optional override text for the speech bubble. */
  message?: string;
}

import { getPrefs, setPrefs } from '../../lib/smarty/prefs';
import { emitSmarty } from '../../lib/smarty/bus';

export const MASCOT_EVENT = 'smarty:mascot';

/** Legacy entry point (playSound success/fail/complete) → Smarty director events. */
export function mascotReact(kind: MascotReaction, message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<MascotEventDetail>(MASCOT_EVENT, { detail: { kind, message } }));
  if (kind === 'complete') emitSmarty({ type: 'session.complete' });
  else emitSmarty({ type: 'answer', correct: kind === 'correct' });
}

/** Mascot pop-ups are on unless the learner chose "Off" in Settings → Smarty. */
export function isMascotEnabled(): boolean {
  return getPrefs().liveliness !== 'off';
}

export function setMascotEnabled(on: boolean) {
  setPrefs({ liveliness: on ? 'lively' : 'off' });
}
