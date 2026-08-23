/** Official Academic IELTS conversion tables (40 questions). */

export function readingScoreToBand(correct: number): number {
  const n = Math.max(0, Math.min(40, Math.round(correct)));
  if (n >= 39) return 9;
  if (n >= 37) return 8.5;
  if (n >= 35) return 8;
  if (n >= 33) return 7.5;
  if (n >= 30) return 7;
  if (n >= 27) return 6.5;
  if (n >= 23) return 6;
  if (n >= 19) return 5.5;
  if (n >= 15) return 5;
  if (n >= 13) return 4.5;
  if (n >= 10) return 4;
  if (n >= 8) return 3.5;
  if (n >= 6) return 3;
  if (n >= 4) return 2.5;
  return 2;
}

export function listeningScoreToBand(correct: number): number {
  const n = Math.max(0, Math.min(40, Math.round(correct)));
  if (n >= 39) return 9;
  if (n >= 37) return 8.5;
  if (n >= 35) return 8;
  if (n >= 32) return 7.5;
  if (n >= 30) return 7;
  if (n >= 26) return 6.5;
  if (n >= 23) return 6;
  if (n >= 18) return 5.5;
  if (n >= 16) return 5;
  if (n >= 13) return 4.5;
  if (n >= 11) return 4;
  if (n >= 8) return 3.5;
  if (n >= 6) return 3;
  if (n >= 4) return 2.5;
  return 2;
}

export function roundHalfBand(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 2) / 2;
}
