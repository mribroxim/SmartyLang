/** One timeline model for a learner's activity, used by the student's own history and the teacher's student view. */

export type ActivityKind = 'lessons' | 'practice' | 'speaking' | 'games' | 'other';
export type ActivityFilter = 'all' | 'lessons' | 'practice' | 'speaking' | 'games';
export const ACTIVITY_FILTERS: ActivityFilter[] = ['all', 'lessons', 'practice', 'speaking', 'games'];

export interface ActivityItem {
  id: string;
  ts: number;
  kind: ActivityKind;
  /** Raw record type, for fallbacks and labels. */
  type: string;
  title: string;
  accuracy?: number;
  score?: number;
  total?: number;
  xp?: number;
  ms?: number;
  mistakes: string[];
  correct: string[];
}

/** Loose shapes of the stored records (completions and student_activity rows). */
export interface RawCompletion {
  id?: string;
  type?: string;
  timestamp?: number;
  title?: string;
  score?: number;
  total?: number;
  accuracy?: number;
  data?: Record<string, any>;
}
export interface RawActivity {
  type?: string;
  title?: string;
  timestamp?: number;
  accuracy?: number;
  score?: number;
  total?: number;
  durationMs?: number;
  details?: { word?: string }[];
}

const GAME_EXERCISES = new Set(['memory-match', 'word-match', 'word-scramble', 'listening-match', 'live-game', 'game']);
const SPEAKING_TYPES = new Set(['speaking', 'shadowing', 'ielts-speaking', 'reading-pronunciation']);

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && !!v.trim()).slice(0, 60) : [];
const num = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

export function kindOfCompletion(type: string | undefined, data?: Record<string, any>): ActivityKind {
  if (type === 'lesson-bite') {
    // Practice and review sessions are recorded as bites too; tell them apart by their kind.
    const kind = typeof data?.kind === 'string' ? data.kind : '';
    if (kind === 'practice' || kind === 'today' || kind === 'refine') return /speak/i.test(String(data?.title ?? data?.biteId ?? '')) ? 'speaking' : 'practice';
    if (kind === 'tutor') return 'speaking';
    return 'lessons';
  }
  if (type && SPEAKING_TYPES.has(type)) return 'speaking';
  const ex = typeof data?.exerciseType === 'string' ? data.exerciseType : '';
  if (type === 'exercise' && (GAME_EXERCISES.has(ex) || data?.game === true)) return 'games';
  return type ? 'practice' : 'other';
}

export function fromCompletion(row: RawCompletion, index = 0): ActivityItem {
  const data = row.data ?? {};
  const accuracy = num(row.accuracy) ?? (num(row.total) && num(row.score) !== undefined ? Math.round((row.score! / row.total!) * 100) : undefined);
  return {
    id: row.id || `c${row.timestamp ?? 0}-${index}`,
    ts: row.timestamp || 0,
    kind: kindOfCompletion(row.type, { ...data, title: row.title }),
    type: row.type || 'other',
    title: row.title || '',
    accuracy: accuracy === undefined ? undefined : Math.round(accuracy),
    score: num(row.score),
    total: num(row.total),
    xp: num(data.xp),
    ms: num(data.ms) ?? num(data.durationMs),
    mistakes: strings(data.mistakes),
    correct: strings(data.correctWords),
  };
}

/** Activity-feed events that completions do not already cover (saved words, AI checks, translation). */
const EXTRA_ACTIVITY: Record<string, ActivityKind> = {
  vocabulary_add: 'other', ai_check_writing: 'practice', ai_check_speaking: 'speaking', translation_practice: 'practice',
};
export function fromActivity(row: RawActivity, index = 0): ActivityItem | null {
  const kind = row.type ? EXTRA_ACTIVITY[row.type] : undefined;
  if (!kind) return null;
  const words = (row.details ?? []).map((d) => d?.word).filter((w): w is string => !!w);
  return {
    id: `a${row.timestamp ?? 0}-${row.type}-${index}`,
    ts: row.timestamp || 0,
    kind,
    type: row.type!,
    title: row.title || words.join(', '),
    accuracy: num(row.accuracy) === undefined ? undefined : Math.round(row.accuracy!),
    score: num(row.score),
    total: num(row.total),
    ms: num(row.durationMs),
    mistakes: [],
    correct: [],
  };
}

export function buildTimeline(completions: RawCompletion[], activity: RawActivity[] = []): ActivityItem[] {
  const seen = new Set<string>();
  const items: ActivityItem[] = [];
  completions.forEach((row, i) => {
    const item = fromCompletion(row, i);
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  });
  activity.forEach((row, i) => { const item = fromActivity(row, i); if (item) items.push(item); });
  return items.sort((a, b) => b.ts - a.ts);
}

export function filterTimeline(items: ActivityItem[], filter: ActivityFilter): ActivityItem[] {
  return filter === 'all' ? items : items.filter((item) => item.kind === filter);
}

export function countByFilter(items: ActivityItem[]): Record<ActivityFilter, number> {
  const out: Record<ActivityFilter, number> = { all: items.length, lessons: 0, practice: 0, speaking: 0, games: 0 };
  for (const item of items) if (item.kind !== 'other') out[item.kind]++;
  return out;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface DayGroup { key: string; ts: number; items: ActivityItem[]; xp: number; ms: number; }

/** Newest-first items, grouped by local calendar day. */
export function groupByDay(items: ActivityItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const key = dayKey(item.ts);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) { group = { key, ts: item.ts, items: [], xp: 0, ms: 0 }; groups.push(group); }
    group.items.push(item);
    group.xp += item.xp ?? 0;
    group.ms += item.ms ?? 0;
  }
  return groups;
}

export interface ActivitySummary {
  sessions: number;
  xp: number;
  minutes: number;
  avgAccuracy: number | null;
  activeDays: number;
  mistakes: number;
}

export function summarize(items: ActivityItem[], sinceTs = 0): ActivitySummary {
  const list = items.filter((i) => i.ts >= sinceTs);
  const acc = list.map((i) => i.accuracy).filter((a): a is number => a !== undefined);
  return {
    sessions: list.length,
    xp: list.reduce((s, i) => s + (i.xp ?? 0), 0),
    minutes: Math.round(list.reduce((s, i) => s + (i.ms ?? 0), 0) / 60000),
    avgAccuracy: acc.length ? Math.round(acc.reduce((s, a) => s + a, 0) / acc.length) : null,
    activeDays: new Set(list.map((i) => dayKey(i.ts))).size,
    mistakes: list.reduce((s, i) => s + i.mistakes.length, 0),
  };
}

export interface MissedWord { word: string; count: number; lastMissed: number }

/** Words a learner missed, most-missed first, from completions plus the stored problem-word list. */
export function missedWords(items: ActivityItem[], problem: { word: string; count: number; lastMissed: number }[] = []): MissedWord[] {
  const map = new Map<string, MissedWord>();
  const add = (raw: string, count: number, ts: number) => {
    const word = raw.trim().toLowerCase();
    if (!word) return;
    const prev = map.get(word);
    if (prev) { prev.count += count; prev.lastMissed = Math.max(prev.lastMissed, ts); } else map.set(word, { word, count, lastMissed: ts });
  };
  for (const item of items) for (const w of item.mistakes) add(w, 1, item.ts);
  // Problem words overlap with completions, so only top up counts they know more about.
  for (const p of problem) {
    const word = p.word.trim().toLowerCase();
    const prev = map.get(word);
    if (!prev) add(p.word, p.count, p.lastMissed);
    else { prev.count = Math.max(prev.count, p.count); prev.lastMissed = Math.max(prev.lastMissed, p.lastMissed); }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastMissed - a.lastMissed);
}
