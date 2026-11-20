/** Word recommendations for a class (or one student), from how students actually behave. */

export interface ClassInsights {
  students: { uid: string; name: string }[];
  completions: { uid: string; timestamp: number; type?: string; mistakes: string[]; correct: string[] }[];
  vocab: { uid: string; word: string; nextReviewDate: number | null; lapses: number }[];
  problem: { uid: string; word: string; count: number; lastMissed: number }[];
}

export type RecKind = 'missed' | 'due' | 'new';
export interface RecReason { kind: RecKind; students: number; total: number; times?: number }
export interface WordRec { word: string; score: number; primary: RecKind; reasons: RecReason[] }

export interface RecommendOptions {
  /** Words from the level or unit to introduce (in teaching order; earlier = more common). */
  levelWords?: string[];
  now?: number;
  limit?: number;
  /** Restrict to one student. */
  studentUid?: string;
}

const norm = (w: string) => w.trim().toLowerCase();
const PER_KIND_CAP = 8;

export function recommendWords(insights: ClassInsights, opts: RecommendOptions = {}): WordRec[] {
  const now = opts.now ?? Date.now();
  const limit = opts.limit ?? 20;
  const uids = new Set((opts.studentUid ? insights.students.filter((s) => s.uid === opts.studentUid) : insights.students).map((s) => s.uid));
  if (opts.studentUid) uids.add(opts.studentUid);
  const total = uids.size;
  if (!total) return [];

  const missed = new Map<string, { students: Set<string>; times: number }>();
  const due = new Map<string, Set<string>>();
  const met = new Map<string, Set<string>>();
  const touch = (map: Map<string, Set<string>>, word: string, uid: string) => { let s = map.get(word); if (!s) map.set(word, s = new Set()); s.add(uid); };
  const miss = (word: string, uid: string, times: number) => {
    const w = norm(word); if (!w) return;
    let m = missed.get(w); if (!m) missed.set(w, m = { students: new Set(), times: 0 });
    m.students.add(uid); m.times += times; touch(met, w, uid);
  };

  for (const c of insights.completions) {
    if (!uids.has(c.uid)) continue;
    for (const w of c.mistakes) miss(w, c.uid, 1);
    for (const w of c.correct) touch(met, norm(w), c.uid);
  }
  // Problem words overlap with completions: count the student, and only raise the times.
  const problemTimes = new Map<string, number>();
  for (const p of insights.problem) {
    if (!uids.has(p.uid)) continue;
    const w = norm(p.word); if (!w) continue;
    let m = missed.get(w); if (!m) missed.set(w, m = { students: new Set(), times: 0 });
    m.students.add(p.uid); touch(met, w, p.uid);
    problemTimes.set(w, Math.max(problemTimes.get(w) ?? 0, p.count));
  }
  for (const [w, count] of problemTimes) { const m = missed.get(w)!; m.times = Math.max(m.times, count); }

  for (const v of insights.vocab) {
    if (!uids.has(v.uid)) continue;
    const w = norm(v.word); if (!w) continue;
    touch(met, w, v.uid);
    if (v.lapses > 0 || (v.nextReviewDate !== null && v.nextReviewDate <= now)) touch(due, w, v.uid);
  }

  const recs = new Map<string, WordRec>();
  const put = (word: string, reason: RecReason, score: number) => {
    const prev = recs.get(word);
    if (prev) { prev.reasons.push(reason); prev.score += score; return; }
    recs.set(word, { word, score, primary: reason.kind, reasons: [reason] });
  };

  const top = <T,>(entries: [string, T][], value: (t: T) => number) =>
    entries.sort((a, b) => value(b[1]) - value(a[1])).slice(0, PER_KIND_CAP);
  for (const [w, m] of top([...missed.entries()], (m) => m.students.size * 100 + m.times))
    put(w, { kind: 'missed', students: m.students.size, total, times: m.times }, 30 * (m.students.size / total) + Math.min(m.times, 10));
  for (const [w, s] of top([...due.entries()], (s) => s.size))
    put(w, { kind: 'due', students: s.size, total }, 20 * (s.size / total));
  const level = (opts.levelWords ?? []).map(norm).filter((w, i, a) => w && a.indexOf(w) === i);
  let added = 0;
  level.forEach((w, i) => {
    if (added >= PER_KIND_CAP) return;
    const seen = met.get(w)?.size ?? 0;
    if (seen / total >= 0.25) return;
    added++;
    put(w, { kind: 'new', students: total - seen, total }, 10 * (1 - seen / total) - i * 0.01);
  });

  // Keep the three reasons balanced: the strongest first, ties broken alphabetically.
  return [...recs.values()].sort((a, b) => b.score - a.score || a.word.localeCompare(b.word)).slice(0, limit);
}
