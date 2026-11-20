export interface HomeworkRow { uid: string; displayName: string; homeworkDone: number; accuracy: number; points: number }
export interface LiveTotals { points: number; games: number }
export interface ClassBoardRow extends HomeworkRow { liveGames: number; livePoints: number; total: number }

/** One live-game point is worth 1/100 of a leaderboard point, so a homework or a few games matter equally. */
export const LIVE_POINT_DIVISOR = 100;

/** Tolerant reader for GET /api/live-game-results: an array, or { players | results | totals: [...] }. */
export function readLiveResults(payload: unknown): Map<string, LiveTotals> {
  const list = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.players) ? (payload as any).players
    : Array.isArray((payload as any)?.results) ? (payload as any).results : Array.isArray((payload as any)?.totals) ? (payload as any).totals : [];
  const out = new Map<string, LiveTotals>();
  for (const item of list) {
    const uid = String(item?.uid ?? item?.playerUid ?? item?.studentUid ?? '');
    if (!uid) continue;
    const previous = out.get(uid) || { points: 0, games: 0 };
    out.set(uid, { points: previous.points + (Number(item.points ?? item.score ?? item.total) || 0), games: previous.games + (Number(item.games ?? item.played) || 0) });
  }
  return out;
}

/** Homework performance plus live-game results, best first. */
export function mergeClassBoard(rows: HomeworkRow[], live: Map<string, LiveTotals> | null): ClassBoardRow[] {
  return rows.map(row => {
    const totals = live?.get(row.uid);
    const livePoints = Math.round((totals?.points || 0) / LIVE_POINT_DIVISOR);
    return { ...row, liveGames: totals?.games || 0, livePoints, total: row.points + livePoints };
  }).sort((a, b) => b.total - a.total || b.homeworkDone - a.homeworkDone || a.displayName.localeCompare(b.displayName));
}
