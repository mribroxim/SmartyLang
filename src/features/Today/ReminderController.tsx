import { useEffect } from 'react';
import { useNow } from '../../hooks/useNow';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useSmartyPrefs } from '../../lib/smarty/prefs';
import { normalizeHabit, visibleStreak } from '../../lib/habitEngine';
import { ensureLocalReminder, isStreakAtRisk, markReminderNotified, reminderDue } from '../../lib/smarty/reminders';

/** Local reminders run only while the app is open; never request permission automatically. */
export function ReminderController({ enabled }: { enabled: boolean }) {
  const now = useNow();
  const { habit, previewMode, navigate } = useProgress();
  const { t } = useUiLang();
  const prefs = useSmartyPrefs();
  useEffect(() => {
    if (!enabled || previewMode) return;
    const date = new Date(now);
    const h = normalizeHabit(habit);
    if (isStreakAtRisk(visibleStreak(h, date), h.dailyGoal.xpEarned, date)) ensureLocalReminder('streak', date);
    if (!reminderDue(prefs.reminderTime, h.dailyGoal.completed, date)) return;
    const row = ensureLocalReminder('daily', date);
    if (row.notified || row.read || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(t('today.reminderTitle'), { body: t('today.reminderBody'), tag: row.id });
      notification.onclick = () => { window.focus(); navigate({ tab: 'lessons', path: ['today'] }); notification.close(); };
      markReminderNotified(row.id);
    } catch { /* The in-app notification remains available if desktop notifications fail. */ }
  }, [enabled, previewMode, now, habit, prefs.reminderTime, t]);
  return null;
}
