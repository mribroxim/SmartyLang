/**
 * Hash-based in-app routing so the browser / phone back button
 * navigates within SmartyLang instead of leaving the site.
 *
 * URL shape:  #/<tab>[/<seg>…]
 * Examples:   #/dashboard
 *             #/reading/menu
 *             #/speaking/shadowing
 *             #/writing/task1
 *             #/listening/dictation
 */

export type AppTab =
  | 'home'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'reading'
  | 'lessons'
  | 'practice'
  | 'ielts'
  | 'dashboard'
  | 'vocabulary'
  | 'exercises'
  | 'business'
  | 'admin'
  | 'content'
  | 'gamification'
  | 'quests'
  | 'story'
  | 'ielts-reading'
  | 'ielts-full-mock'
  | 'comprehensive'
  | 'classes'
  | 'profile'
  | 'plans'
  | 'stickers';

export interface AppRoute {
  tab: AppTab;
  /** Nested segments after the tab (hub mode, reading view, etc.). */
  path: string[];
}

const VALID_TABS = new Set<string>([
  'home', 'listening', 'speaking', 'writing', 'reading', 'lessons', 'practice',
  'ielts', 'dashboard', 'vocabulary', 'exercises', 'business',
  'admin', 'content', 'gamification', 'quests', 'story', 'ielts-reading', 'ielts-full-mock',
  'comprehensive', 'classes', 'profile', 'plans', 'stickers',
]);

/** Default nested path when landing on a tab from the sidebar / nav. */
export function defaultPathFor(tab: string): string[] {
  if (tab === 'reading') return ['menu'];
  if (tab === 'lessons') return ['path'];
  return [];
}

export function parseHash(hash = typeof window !== 'undefined' ? window.location.hash : ''): AppRoute | null {
  // Older builds appended the page query after the hash on mount.
  const raw = (hash || '').split('?')[0].replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const parts = raw.split('/').map(decodeURIComponent).filter(Boolean);
  if (!parts.length) return null;
  // Old dictionary URLs → vocabulary
  if (parts[0] === 'dictionary') return { tab: 'vocabulary', path: [] };
  // Legacy tabs → business dashboard
  if (parts[0] === 'teacher' || parts[0] === 'organization') {
    return { tab: 'business', path: parts.slice(1) };
  }
  if (!VALID_TABS.has(parts[0])) return null;
  return { tab: parts[0] as AppTab, path: parts.slice(1) };
}

export function toHash(route: AppRoute): string {
  const parts = [route.tab, ...route.path].filter(Boolean).map(encodeURIComponent);
  return '#/' + parts.join('/');
}

export function routesEqual(a: AppRoute, b: AppRoute): boolean {
  if (a.tab !== b.tab) return false;
  if (a.path.length !== b.path.length) return false;
  return a.path.every((p, i) => p === b.path[i]);
}
