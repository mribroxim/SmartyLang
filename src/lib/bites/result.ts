/** Normalise any exercise result into a 0–100 percent plus word lists. */
export function resultPercent(result: any): number {
  if (typeof result?.percent === 'number' && Number.isFinite(result.percent)) {
    return Math.min(100, Math.max(0, Math.round(result.percent)));
  }
  if (typeof result?.score === 'number' && typeof result?.total === 'number' && result.total > 0) {
    return Math.min(100, Math.max(0, Math.round((result.score / result.total) * 100)));
  }
  const c = Array.isArray(result?.correctWords) ? result.correctWords.length : 0;
  const m = Array.isArray(result?.mistakes) ? result.mistakes.length : 0;
  if (c + m > 0) return Math.round((c / (c + m)) * 100);
  if (typeof result?.score === 'number') return Math.min(100, Math.max(0, Math.round(result.score)));
  return 0;
}

export const wordsOf = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.toLowerCase()) : [];
