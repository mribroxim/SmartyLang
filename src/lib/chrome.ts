/**
 * Single source of truth for when the app chrome (sidebar, top bar, mobile
 * nav, floating Smarty) is visible. Focus routes like a running bite hide it.
 */
export interface ChromeState {
  signedIn: boolean;
  hasProfile: boolean;
  needsOnboarding: boolean;
  tab: string;
  path?: string[];
}

/** Routes that take over the whole screen (bite sessions, heart practice). */
export function isFocusRoute(tab: string, path: string[] = []): boolean {
  if (tab === 'practice' && path[0]) return true; // a running Practice session
  return tab === 'lessons' && (path[0] === 'bite' || path[0] === 'today' || path[0] === 'hearts' || path[0] === 'test');
}

export function shouldShowChrome(s: ChromeState): boolean {
  if (!s.signedIn || !s.hasProfile || s.needsOnboarding) return false;
  if (s.tab === 'home' || s.tab === 'plans') return false;
  return !isFocusRoute(s.tab, s.path);
}
