/** Light weekly goals + exercise streak helpers (local only). */

export type WeeklyGoals = {
  /** ISO week key YYYY-Www */
  weekKey: string;
  exerciseSessions: number;
  readingSessions: number;
  listeningSessions: number;
  speakingSessions: number;
  /** Target counts for the week */
  targets: {
    exercises: number;
    reading: number;
    listening: number;
    speaking: number;
  };
};

const KEY = 'weekly_goals_v1';
const EX_STREAK_KEY = 'exercise_streak_v1';

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

const DEFAULT_TARGETS = { exercises: 5, reading: 3, listening: 2, speaking: 2 };

export function loadWeeklyGoals(): WeeklyGoals {
  const weekKey = isoWeekKey();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyGoals;
      if (parsed.weekKey === weekKey) return parsed;
    }
  } catch {}
  const fresh: WeeklyGoals = {
    weekKey,
    exerciseSessions: 0,
    readingSessions: 0,
    listeningSessions: 0,
    speakingSessions: 0,
    targets: { ...DEFAULT_TARGETS },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

export function bumpWeeklyGoal(
  kind: 'exercises' | 'reading' | 'listening' | 'speaking',
): WeeklyGoals {
  const g = loadWeeklyGoals();
  if (kind === 'exercises') g.exerciseSessions += 1;
  if (kind === 'reading') g.readingSessions += 1;
  if (kind === 'listening') g.listeningSessions += 1;
  if (kind === 'speaking') g.speakingSessions += 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(g));
  } catch {}
  return g;
}

export type ExerciseStreak = { current: number; max: number; lastDate: string };

export function loadExerciseStreak(): ExerciseStreak {
  try {
    return JSON.parse(localStorage.getItem(EX_STREAK_KEY) || '{"current":0,"max":0,"lastDate":""}');
  } catch {
    return { current: 0, max: 0, lastDate: '' };
  }
}

export function trackExerciseStreak(): ExerciseStreak {
  const prev = loadExerciseStreak();
  const today = new Date().toDateString();
  if (prev.lastDate === today) return prev;
  let current = 1;
  if (prev.lastDate) {
    const diff = Math.ceil(
      Math.abs(new Date(today).getTime() - new Date(prev.lastDate).getTime()) / 86400000,
    );
    current = diff <= 1 ? prev.current + 1 : 1;
  }
  const next = { current, max: Math.max(prev.max, current), lastDate: today };
  try {
    localStorage.setItem(EX_STREAK_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function dueSrsWords(
  savedVocab: Record<string, { srs?: { nextReviewDate: number } }>,
): string[] {
  const now = Date.now();
  return Object.entries(savedVocab)
    .filter(([, v]) => v?.srs?.nextReviewDate != null && v.srs.nextReviewDate <= now)
    .sort((a, b) => (a[1].srs!.nextReviewDate) - (b[1].srs!.nextReviewDate))
    .map(([w]) => w);
}
