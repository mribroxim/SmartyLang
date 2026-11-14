export interface DailyCompletion { completedAt: number; best: number; xpAwarded: boolean; heartAwarded: boolean }
export type DailyProgress = Record<string, DailyCompletion>;

/** Completion claims only accumulate when two devices restore the same day. */
export function mergeDailyProgress(a: DailyProgress, b: DailyProgress): DailyProgress {
  const result: DailyProgress = {};
  for (const [key, row] of [...Object.entries(a), ...Object.entries(b)]) {
    if (!/^\d{4}-\d{2}-\d{2}:[a-z]{2}$/.test(key) || !row || !Number.isFinite(row.best) || !Number.isFinite(row.completedAt)) continue;
    const prev = result[key];
    result[key] = { completedAt: Math.max(prev?.completedAt ?? 0, row.completedAt), best: Math.max(prev?.best ?? 0, Math.min(100, Math.max(0, row.best))), xpAwarded: !!(prev?.xpAwarded || row.xpAwarded), heartAwarded: !!(prev?.heartAwarded || row.heartAwarded) };
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => b.localeCompare(a)).slice(0, 90));
}
