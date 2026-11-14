import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AppRoute,
  type AppTab,
  defaultPathFor,
  parseHash,
  routesEqual,
  toHash,
} from '../lib/appRoute';

/**
 * Syncs app navigation with the browser History API (hash URLs).
 * - Forward navigations call pushState (or replaceState).
 * - Back / forward / Android system back fire popstate → restore route.
 */
export function useAppRoute(fallback: AppRoute = { tab: 'home', path: [] }) {
  const [route, setRoute] = useState<AppRoute>(() => parseHash() ?? fallback);
  /** Lets setReadingView coalesce with a same-tick setActiveTab into one history entry. */
  const lastTabNavAt = useRef(0);
  /** Stash reading sub-view when set before the reading tab is active. */
  const pendingReadingViewRef = useRef<string | null>(null);

  // Seed / restore on mount + listen for back/forward.
  // Preserve ?query (e.g. Dodo payment return params) until the app strips them.
  useEffect(() => {
    const search = window.location.search;
    const hashUrl = (route: AppRoute) => window.location.pathname + search + toHash(route);
    const existing = parseHash();
    if (existing) {
      setRoute(existing);
      window.history.replaceState(existing, '', hashUrl(existing));
    } else {
      const seed = fallback;
      window.history.replaceState(seed, '', hashUrl(seed));
      setRoute(seed);
    }

    const onPop = (e: PopStateEvent) => {
      const next =
        (e.state && typeof e.state === 'object' && 'tab' in e.state
          ? (e.state as AppRoute)
          : null) ??
        parseHash() ??
        fallback;
      setRoute(next);
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRoute = useCallback((next: AppRoute, opts?: { replace?: boolean }) => {
    setRoute(prev => {
      if (routesEqual(prev, next)) return prev;
      const url = toHash(next);
      if (opts?.replace) {
        window.history.replaceState(next, '', url);
      } else {
        window.history.pushState(next, '', url);
      }
      return next;
    });
  }, []);

  const navigate = useCallback((next: AppRoute, opts?: { replace?: boolean }) => {
    applyRoute(next, opts);
  }, [applyRoute]);

  /** Drop-in replacement for setActiveTab — pushes a history entry. */
  const setActiveTab = useCallback((tab: string | ((prev: string) => string)) => {
    setRoute(prevRoute => {
      const resolved = typeof tab === 'function' ? tab(prevRoute.tab) : tab;
      let path = defaultPathFor(resolved);
      if (resolved === 'reading') {
        if (pendingReadingViewRef.current) {
          path = [pendingReadingViewRef.current];
          pendingReadingViewRef.current = null;
        } else if (
          prevRoute.tab === 'reading' &&
          prevRoute.path.length > 0 &&
          Date.now() - lastTabNavAt.current < 80
        ) {
          path = prevRoute.path;
        }
      }
      const next: AppRoute = { tab: resolved as AppTab, path };
      if (routesEqual(prevRoute, next)) return prevRoute;
      lastTabNavAt.current = Date.now();
      window.history.pushState(next, '', toHash(next));
      return next;
    });
  }, []);

  /**
   * Drop-in for setReadingView.
   * - If already on reading (or reading was just selected): update path + history.
   * - Otherwise stash for the next time reading is opened (no forced tab switch).
   */
  const setReadingView = useCallback((view: string) => {
    setRoute(prev => {
      const recentTabNav = Date.now() - lastTabNavAt.current < 80;
      if (prev.tab !== 'reading' && !recentTabNav) {
        pendingReadingViewRef.current = view;
        return prev;
      }
      const next: AppRoute = { tab: 'reading', path: [view] };
      if (routesEqual(prev, next)) return prev;
      const url = toHash(next);
      if (recentTabNav) {
        window.history.replaceState(next, '', url);
      } else {
        window.history.pushState(next, '', url);
      }
      lastTabNavAt.current = Date.now();
      return next;
    });
  }, []);

  /** Navigate within the current tab (hub modes, etc.). */
  const setSubPath = useCallback((path: string[], opts?: { replace?: boolean }) => {
    setRoute(prev => {
      const next: AppRoute = { tab: prev.tab, path };
      if (routesEqual(prev, next)) return prev;
      const url = toHash(next);
      if (opts?.replace) window.history.replaceState(next, '', url);
      else window.history.pushState(next, '', url);
      return next;
    });
  }, []);

  const replaceRoute = useCallback((next: AppRoute) => {
    applyRoute(next, { replace: true });
  }, [applyRoute]);

  return {
    route,
    navigate,
    setActiveTab,
    setReadingView,
    setSubPath,
    replaceRoute,
    activeTab: route.tab,
    /** First path segment — used as hub mode / reading view. */
    sub: route.path[0] ?? '',
    path: route.path,
  };
}
