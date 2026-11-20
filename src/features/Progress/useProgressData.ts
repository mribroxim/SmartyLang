import { useMemo } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useWorkshop } from '../../lib/workshop/store';
import { useLevelTexts } from '../../data/levelTexts';
import { loadLocalCompletions } from '../../lib/completions';
import { buildLessonUnits, isLessonComplete } from '../../lib/lessonUnits';
import { normalizeHabit, visibleStreak, levelForXp } from '../../lib/habitEngine';
import type { Level } from '../../lib/reading-logic';
import {
  canDoFromUnits, compareWeeks, heatmap, recapWeek, wordTotals,
  type CanDoUnit, type HeatDay, type Totals, type WeekCompare, type WeekStats,
} from '../../lib/progress/recap';

export interface ProgressData {
  weeks: WeekCompare;
  recap: { stats: WeekStats; before: WeekStats; from: number };
  totals: Totals;
  canDo: CanDoUnit[];
  heat: HeatDay[][];
  xp: number;
  level: number;
  xpInLevel: number;
  streak: number;
  bestStreak: number;
}

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

/** Everything the Progress screen and the weekly recap show, from local data. */
export function useProgressData(): ProgressData {
  const { savedVocab, contentLang, userProfile, habit } = useProgress();
  const workshop = useWorkshop();
  const levelTexts = useLevelTexts();
  return useMemo(() => {
    const all = loadLocalCompletions().filter((c) => !c.contentLang || c.contentLang === contentLang || c.type !== 'lesson-bite');
    const input = { completions: all, vocab: savedVocab };
    const weeks = compareWeeks(input);
    const h = normalizeHabit(habit);
    // Habit XP is the source of truth for this week when the local log is shorter.
    weeks.thisWeek = { ...weeks.thisWeek, xp: Math.max(weeks.thisWeek.xp, h.weeklyXp) };
    const units = LEVELS.flatMap((lvl) => buildLessonUnits(levelTexts[lvl] ?? [], lvl));
    const xp = userProfile.xp || 0;
    return {
      weeks,
      recap: recapWeek(input),
      totals: wordTotals(workshop.items[contentLang] ?? {}, savedVocab),
      canDo: canDoFromUnits(units, (id) => isLessonComplete(contentLang, id)),
      heat: heatmap(all),
      xp,
      level: levelForXp(xp),
      xpInLevel: xp % 1000,
      streak: visibleStreak(h),
      bestStreak: Math.max(h.globalStreak.max || 0, visibleStreak(h)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedVocab, contentLang, userProfile.xp, habit, workshop, levelTexts]);
}
