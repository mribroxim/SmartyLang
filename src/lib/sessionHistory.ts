/**
 * Shared helpers for appending practice-session history to localStorage.
 * Keeps a newest-first cap so history stays bounded.
 */

export function appendHistory<T>(key: string, entry: T, cap = 200): T[] {
  let prev: T[] = [];
  try {
    const raw = localStorage.getItem(key);
    prev = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(prev)) prev = [];
  } catch {
    prev = [];
  }
  const next = [entry, ...prev].slice(0, cap);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch { /* quota / private mode */ }
  return next;
}

export const SHADOWING_HISTORY_KEY = 'shadowing_completions_v1';
export const WRITING_MOCK_HISTORY_KEY = 'writing_mock_history_v1';
