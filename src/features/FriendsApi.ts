import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/selfHostedApi';

export interface Friend { uid: string; name: string; accepted: boolean; outgoing: boolean }
export interface FriendsData { friends: Friend[]; code?: string }
export const FRIENDS_CHANGED = 'smarty:friends-changed';

export const friendsRequest = <T,>(action: string, fields: object = {}) =>
  apiRequest<T>('/api/friends', { method: 'POST', body: JSON.stringify({ action, ...fields }) });

/** Friends list + my code, with actions that refresh the list and tell other screens. */
export function useFriends() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try { setData(await friendsRequest<FriendsData>('list')); setError(false); } catch { setError(true); setData(current => current ?? { friends: [] }); }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener(FRIENDS_CHANGED, refresh);
    return () => window.removeEventListener(FRIENDS_CHANGED, refresh);
  }, [refresh]);
  const act = useCallback(async (action: string, fields?: object) => {
    setBusy(true); setError(false);
    try { await friendsRequest(action, fields); await refresh(); window.dispatchEvent(new Event(FRIENDS_CHANGED)); return true; }
    catch { setError(true); return false; } finally { setBusy(false); }
  }, [refresh]);
  return { data, busy, error, act, refresh };
}
