import { useEffect } from 'react';
import { useNow } from '../../hooks/useNow';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useSmartyPrefs } from '../../lib/smarty/prefs';
import { normalizeHabit, visibleStreak } from '../../lib/habitEngine';
import { ensureLocalReminder, isStreakAtRisk, reminderDue } from '../../lib/smarty/reminders';
import { restoreBackgroundReminderState } from '../../lib/pushReminders';
import { setReminderSnapshot } from '../../lib/reminders';
import { useDailyQuests } from '../Quests/dailyQuests';

/**
 * Keeps in-app reminders and feeds the notification scheduler (src/lib/reminders.ts).
 * The browser handles closed-app delivery through the push worker.
 */
export function ReminderController({ enabled }: { enabled: boolean }) {
  const now = useNow();
  const { habit, previewMode } = useProgress();
  const { t } = useUiLang();
  const prefs = useSmartyPrefs();
  const { quests, progress, claimed } = useDailyQuests();
  const finished = quests.length > 0 && quests.every((q) => (progress[q.metric] ?? 0) >= q.target);
  const questsReady = finished && claimed.length < quests.length;

  useEffect(() => {
    if (!enabled || previewMode) { setReminderSnapshot(null); return; }
    const date = new Date(now);
    const h = normalizeHabit(habit);
    const streak = visibleStreak(h, date);
    if (isStreakAtRisk(streak, h.dailyGoal.xpEarned, date)) ensureLocalReminder('streak', date);
    if (reminderDue(prefs.reminderTime, h.dailyGoal.completed, date)) ensureLocalReminder('daily', date);
    setReminderSnapshot({
      enabled: true,
      time: prefs.reminderTime,
      xpToday: h.dailyGoal.xpEarned || 0,
      streak,
      questsReady,
      title: (kind) => (kind === 'quests' ? t('reminder.questsTitle') : t('reminder.title')),
      body: (kind, n) => (kind === 'quests' ? t('reminder.questsBody') : n > 0 ? t('reminder.streakBody', { n }) : t('reminder.studyBody')),
    });
  }, [enabled, previewMode, now, habit, prefs.reminderTime, questsReady, t]);
  useEffect(() => { if (enabled) void restoreBackgroundReminderState(); }, [enabled]);
  useEffect(() => () => setReminderSnapshot(null), []);
  return null;
}
