import type { SmartyEvent } from './events';

export const SMARTY_EVENT = 'smarty:event';

/** Tell Smarty something happened. Safe to call from anywhere (no React needed). */
export function emitSmarty(e: SmartyEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SmartyEvent>(SMARTY_EVENT, { detail: e }));
}

export function onSmarty(fn: (e: SmartyEvent) => void): () => void {
  const h = (ev: Event) => fn((ev as CustomEvent<SmartyEvent>).detail);
  window.addEventListener(SMARTY_EVENT, h);
  return () => window.removeEventListener(SMARTY_EVENT, h);
}
