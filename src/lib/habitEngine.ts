/**
 * Habit loop: daily XP goal, global streak, freezes, daily quests.
 * State lives on users/{uid}/data/progress (synced) + uid-scoped cache.
 */

export const DAILY_GOAL_XP = 30;
export const STREAK_FREEZE_COST = 20;
export const WEEKLY_GOAL_DAYS_FOR_FREEZE = 5;

export type GlobalStreak = {
  current: number;
  max: number;
  /** YYYY-MM-DD in local time */
  lastDate: string;
};

export type DailyGoalState = {
  /** YYYY-MM-DD */
  date: string;
  xpEarned: number;
  completed: boolean;
  /** Days this ISO week the daily goal was hit */
  weekHits: number;
  weekKey: string;
};

export type HabitState = {
  globalStreak: GlobalStreak;
  dailyGoal: DailyGoalState;
  streakFreezes: number;
  weeklyXp: number;
  weekKey: string;
  /** Quest id for today */
  questId: string;
  questDone: boolean;
  badges: string[];
};

export type DailyQuest = {
  id: string;
  title: string;
  sub: string;
  /** Tab to open */
  tab: string;
  path?: string[];
};

const QUESTS: DailyQuest[] = [
  { id: 'reviews', title: 'Clear due reviews', sub: 'Review vocab with SRS flashcards', tab: 'exercises' },
  { id: 'lesson', title: 'Complete a lesson step', sub: 'Vocab, reading, or exercises', tab: 'lessons' },
  { id: 'shadow', title: 'Shadow one passage', sub: 'Speaking → Shadowing', tab: 'speaking', path: ['shadowing'] },
  { id: 'write80', title: 'Write 80+ words', sub: 'General writing practice', tab: 'writing', path: ['general'] },
  { id: 'ielts5', title: 'IELTS micro practice', sub: 'Open IELTS Reading or Listening', tab: 'ielts' },
];

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function emptyHabit(): HabitState {
  const date = todayKey();
  const weekKey = isoWeekKey();
  return {
    globalStreak: { current: 0, max: 0, lastDate: '' },
    dailyGoal: { date, xpEarned: 0, completed: false, weekHits: 0, weekKey },
    streakFreezes: 0,
    weeklyXp: 0,
    weekKey,
    questId: pickQuestId(date),
    questDone: false,
    badges: [],
  };
}

function pickQuestId(date: string): string {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return QUESTS[h % QUESTS.length].id;
}

export function getQuest(id: string): DailyQuest {
  return QUESTS.find(q => q.id === id) || QUESTS[0];
}

/** Duolingo-style league ladder (lowest → highest). */
export const LEAGUE_TIERS = [
  { id: 'Bronze', label: 'Bronze', accent: '#C4793B', soft: '#F5E6D3', ink: '#7A4A1E' },
  { id: 'Silver', label: 'Silver', accent: '#8E9AA8', soft: '#E8EEF3', ink: '#3F4A56' },
  { id: 'Gold', label: 'Gold', accent: '#E5A100', soft: '#FFF3CC', ink: '#7A5500' },
  { id: 'Sapphire', label: 'Sapphire', accent: '#1CB0F6', soft: '#D7F1FC', ink: '#0B6B96' },
  { id: 'Ruby', label: 'Ruby', accent: '#FF4B4B', soft: '#FFE0E0', ink: '#9B1C1C' },
  { id: 'Emerald', label: 'Emerald', accent: '#58CC02', soft: '#E4F7D0', ink: '#2B6B00' },
  { id: 'Amethyst', label: 'Amethyst', accent: '#CE82FF', soft: '#F3E4FF', ink: '#6B2F9B' },
  { id: 'Pearl', label: 'Pearl', accent: '#F0E6D8', soft: '#FAF7F2', ink: '#6B5E4E' },
  { id: 'Obsidian', label: 'Obsidian', accent: '#4B4B4B', soft: '#E8E8E8', ink: '#1F1F1F' },
  { id: 'Diamond', label: 'Diamond', accent: '#86D3F5', soft: '#E8F7FD', ink: '#1A6B8A' },
] as const;

export type LeagueId = (typeof LEAGUE_TIERS)[number]['id'];

export function leagueMeta(id?: string | null) {
  // Legacy name from earlier XP ladder
  if (id === 'Platinum') return LEAGUE_TIERS.find(t => t.id === 'Pearl')!;
  return LEAGUE_TIERS.find(t => t.id === id) || LEAGUE_TIERS[0];
}

export function leagueForXp(xp: number): LeagueId {
  if (xp > 20000) return 'Diamond';
  if (xp > 14000) return 'Obsidian';
  if (xp > 10000) return 'Pearl';
  if (xp > 7000) return 'Amethyst';
  if (xp > 4500) return 'Emerald';
  if (xp > 2800) return 'Ruby';
  if (xp > 1500) return 'Sapphire';
  if (xp > 700) return 'Gold';
  if (xp > 250) return 'Silver';
  return 'Bronze';
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

/** Promotion / demotion slot counts, scaled for class size (Duolingo uses 10 up / 5 down in ~30). */
export function leagueZones(playerCount: number): { promote: number; demote: number } {
  const n = Math.max(0, playerCount);
  if (n <= 2) return { promote: 0, demote: 0 };
  if (n <= 5) return { promote: 1, demote: 1 };
  if (n <= 10) return { promote: 3, demote: 2 };
  if (n <= 20) return { promote: 5, demote: 3 };
  return { promote: 10, demote: 5 };
}

/** Milliseconds until next Monday 00:00 local (ISO week rollover). */
export function msUntilWeekEnd(now = new Date()): number {
  const end = new Date(now);
  const day = end.getDay(); // 0 Sun … 6 Sat
  const daysUntilMon = day === 0 ? 1 : 8 - day;
  end.setDate(end.getDate() + daysUntilMon);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, end.getTime() - now.getTime());
}

export function formatWeekCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Normalize habit fields after load / across midnight. */
export function normalizeHabit(raw: Partial<HabitState> | null | undefined): HabitState {
  const base = emptyHabit();
  if (!raw || typeof raw !== 'object') return base;
  const date = todayKey();
  const weekKey = isoWeekKey();

  let daily = raw.dailyGoal || base.dailyGoal;
  if (daily.date !== date) {
    daily = { date, xpEarned: 0, completed: false, weekHits: daily.weekKey === weekKey ? (daily.weekHits || 0) : 0, weekKey };
  } else if (daily.weekKey !== weekKey) {
    daily = { ...daily, weekHits: 0, weekKey };
  }

  let weeklyXp = raw.weeklyXp ?? 0;
  let stateWeek = raw.weekKey || weekKey;
  if (stateWeek !== weekKey) {
    weeklyXp = 0;
    stateWeek = weekKey;
  }

  const questId = raw.questId && raw.dailyGoal?.date === date ? raw.questId : pickQuestId(date);
  const questDone = raw.dailyGoal?.date === date ? !!raw.questDone : false;

  return {
    globalStreak: {
      current: raw.globalStreak?.current ?? 0,
      max: raw.globalStreak?.max ?? 0,
      lastDate: raw.globalStreak?.lastDate ?? '',
    },
    dailyGoal: daily,
    streakFreezes: raw.streakFreezes ?? 0,
    weeklyXp,
    weekKey: stateWeek,
    questId,
    questDone,
    badges: Array.isArray(raw.badges) ? raw.badges : [],
  };
}

/**
 * Apply XP toward daily goal + weekly XP. Updates streak if this is first activity today.
 * Returns { habit, goalJustCompleted, streakTicked, newBadges }.
 */
export function applyXpToHabit(
  habit: HabitState,
  xpAmount: number,
): { habit: HabitState; goalJustCompleted: boolean; streakTicked: boolean; newBadges: string[] } {
  const next = normalizeHabit(habit);
  const date = todayKey();
  let goalJustCompleted = false;
  let streakTicked = false;
  const newBadges: string[] = [];

  next.weeklyXp = (next.weeklyXp || 0) + Math.max(0, xpAmount);
  next.dailyGoal.xpEarned = (next.dailyGoal.xpEarned || 0) + Math.max(0, xpAmount);

  if (!next.dailyGoal.completed && next.dailyGoal.xpEarned >= DAILY_GOAL_XP) {
    next.dailyGoal.completed = true;
    goalJustCompleted = true;
    next.dailyGoal.weekHits = (next.dailyGoal.weekHits || 0) + 1;
    if (next.dailyGoal.weekHits >= WEEKLY_GOAL_DAYS_FOR_FREEZE) {
      next.streakFreezes += 1;
      next.dailyGoal.weekHits = 0;
    }
  }

  // Tick global streak on first qualifying XP of the day
  if (next.globalStreak.lastDate !== date && xpAmount > 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = todayKey(yesterday);
    if (next.globalStreak.lastDate === yKey) {
      next.globalStreak.current += 1;
    } else if (next.globalStreak.lastDate === '') {
      next.globalStreak.current = 1;
    } else {
      // Missed day — try freeze
      if (next.streakFreezes > 0) {
        next.streakFreezes -= 1;
        next.globalStreak.current = Math.max(1, next.globalStreak.current);
      } else {
        next.globalStreak.current = 1;
      }
    }
    next.globalStreak.max = Math.max(next.globalStreak.max, next.globalStreak.current);
    next.globalStreak.lastDate = date;
    streakTicked = true;
  }

  if (next.globalStreak.current >= 7 && !next.badges.includes('streak7')) {
    next.badges = [...next.badges, 'streak7'];
    newBadges.push('streak7');
  }
  if (next.globalStreak.current >= 30 && !next.badges.includes('streak30')) {
    next.badges = [...next.badges, 'streak30'];
    newBadges.push('streak30');
  }

  return { habit: next, goalJustCompleted, streakTicked, newBadges };
}

export function markQuestDone(habit: HabitState): HabitState {
  const next = normalizeHabit(habit);
  next.questDone = true;
  return next;
}

export function unlockBadge(habit: HabitState, badge: string): HabitState {
  const next = normalizeHabit(habit);
  if (!next.badges.includes(badge)) next.badges = [...next.badges, badge];
  return next;
}

export const BADGE_META: Record<string, { label: string; desc: string }> = {
  streak7: { label: '7-Day Flame', desc: 'Keep a 7-day streak' },
  streak30: { label: 'Monthly Flame', desc: 'Keep a 30-day streak' },
  firstIelts: { label: 'IELTS Starter', desc: 'Finish your first IELTS test' },
  certificate: { label: 'Certified', desc: 'Earn a level certificate' },
  goalWeek: { label: 'Goal Grinder', desc: 'Hit daily goal 5 days in a week' },
};
