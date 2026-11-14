/**
 * Browser client for POST /api/translate-fallback.
 * The frontend never talks to Google Translate / MyMemory directly.
 */
export type FallbackResult = {
  text: string;
  source: 'cache' | 'v3' | 'v2' | 'gtx' | 'mymemory' | 'api';
  alternatives?: string[];
};

export async function translateFallback(opts: {
  word: string;
  from: string;
  to: string;
  sentence?: string;
  signal?: AbortSignal;
}): Promise<{ text: string; alternatives: string[] } | null> {
  const word = (opts.word || '').trim();
  if (!word || opts.from === opts.to) {
    return word ? { text: word, alternatives: [word] } : null;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

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
  const text = (d.text || d.translation || '').trim();
  if (!text) return null;
  const alternatives = Array.isArray(d.alternatives) && d.alternatives.length
    ? d.alternatives.map((a) => String(a || '').trim()).filter(Boolean)
    : [text];
  return { text, alternatives };
}
