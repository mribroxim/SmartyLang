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
  if (tab === 'gamification' && path[0] === 'friends' && path[1] === 'play' && !!path[2]) return true;
  // A running live game room (host: business/live/<class>/<code>, student: classes/live/<code>).
  if (tab === 'business' && path[0] === 'live' && !!path[2]) return true;
  if (tab === 'classes' && path[0] === 'live' && !!path[1]) return true;
  if (tab === 'practice' && path[0] && path[0] !== 'yourself') return true; // a running Practice session (not the exercise list)
  return tab === 'lessons' && (path[0] === 'bite' || path[0] === 'today' || path[0] === 'refine' || path[0] === 'hearts' || path[0] === 'test' || path[0] === 'unit-one');
}

export function shouldShowChrome(s: ChromeState): boolean {
  if (!s.signedIn || !s.hasProfile || s.needsOnboarding) return false;
  if (s.tab === 'home' || s.tab === 'plans') return false;
  return !isFocusRoute(s.tab, s.path);
}
