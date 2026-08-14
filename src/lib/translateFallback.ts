/**
 * Browser client for POST /api/translate-fallback.
 * The frontend never talks to Google Translate / MyMemory directly.
 */
import { auth } from '../firebase';

export type FallbackResult = {
  text: string;
  source: 'cache' | 'v3' | 'v2' | 'gtx' | 'api';
};

export async function translateFallback(opts: {
  word: string;
  from: string;
  to: string;
  sentence?: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  const word = (opts.word || '').trim();
  if (!word || opts.from === opts.to) return word || null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* anonymous is fine */ }

  const r = await fetch('/api/translate-fallback', {
    method: 'POST',
    headers,
    signal: opts.signal,
    body: JSON.stringify({
      word,
      from: opts.from,
      to: opts.to,
      sentence: opts.sentence || '',
    }),
  });
  if (!r.ok) throw new Error(`fallback ${r.status}`);
  const d = (await r.json()) as FallbackResult & { translation?: string };
  return (d.text || d.translation || '').trim() || null;
}
