import { hasBackgroundReminders } from './pushReminders';
import { todayKey } from './habitEngine';
import { ensureLocalReminder, markReminderNotified } from './smarty/reminders';

export type ReminderSupport = 'unsupported' | NotificationPermission;

/** What the React side knows right now; pushed in by ReminderController. */
export interface ReminderSnapshot {
  enabled: boolean;
  /** 'HH:MM' local time, undefined = reminders off. */
  time?: string;
  xpToday: number;
  streak: number;
  /** Every daily quest is finished and at least one reward is unclaimed. */
  questsReady: boolean;
  title: (kind: 'study' | 'quests') => string;
  body: (kind: 'study' | 'quests', streak: number) => string;
}

export const REMINDER_ICON = '/smarty-face.svg';
const SENT_KEY = 'smarty_reminder_last_sent_v1';

export function reminderSupport(): ReminderSupport {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
}

/** Ask for permission (call from a user gesture, e.g. enabling the toggle). */
export async function requestReminderPermission(): Promise<ReminderSupport> {
  if (reminderSupport() === 'unsupported') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return Notification.permission; }
}

function minutesOf(time?: string): number | null {
  const m = time && /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function lastSentDay(): string | null {
  try { return localStorage.getItem(SENT_KEY); } catch { return null; }
}
function markSent(day: string) {
  try { localStorage.setItem(SENT_KEY, day); } catch { /* ignore */ }
}

/** Pure decision: which reminder (if any) is due now. At most one per local day. */
export function pickReminder(s: Pick<ReminderSnapshot, 'enabled' | 'time' | 'xpToday' | 'questsReady'>, now: Date, sentDay: string | null): 'quests' | 'study' | null {
  const at = minutesOf(s.time);
  if (!s.enabled || at === null || sentDay === todayKey(now)) return null;
  if (now.getHours() * 60 + now.getMinutes() < at) return null;
  if (s.questsReady) return 'quests';
  return s.xpToday === 0 ? 'study' : null;
}

let registration: ServiceWorkerRegistration | null = null;

export async function registerReminderWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try { registration = await navigator.serviceWorker.register('/sw.js'); } catch { /* http / blocked: fall back to page notifications */ }
}

async function show(title: string, body: string, tag: string, url: string): Promise<boolean> {
  const options: NotificationOptions & { data?: unknown } = { body, tag, icon: REMINDER_ICON, badge: REMINDER_ICON, data: { url } };
  try {
    if (registration) { await registration.showNotification(title, options); return true; }
    const n = new Notification(title, options);
    n.onclick = () => { window.focus(); if (url.startsWith('/#')) window.location.hash = url.slice(1); n.close(); };
    return true;
  } catch { return false; }
}

let snapshot: ReminderSnapshot | null = null;
export function setReminderSnapshot(next: ReminderSnapshot | null) { snapshot = next; checkReminders(); }

/** Fire the due reminder, once per day. Safe to call often. */
export function checkReminders(now = new Date()): void {
  const s = snapshot;
  if (!s || hasBackgroundReminders() || reminderSupport() !== 'granted') return;
  const kind = pickReminder(s, now, lastSentDay());
  if (!kind) return;
  const day = todayKey(now);
  markSent(day); // set first so concurrent ticks cannot duplicate
  void show(s.title(kind), s.body(kind, s.streak), `smarty-reminder:${day}`, kind === 'quests' ? '/#/quests' : '/').then((ok) => {
    if (!ok) { try { localStorage.removeItem(SENT_KEY); } catch { /* ignore */ } return; }
    markReminderNotified(ensureLocalReminder('daily', now).id);
  });
}

let started = false;
/** Register the worker and start the check loop. Idempotent; no-op where Notification is unsupported. */
export function initReminders(): void {
  if (started || reminderSupport() === 'unsupported') return;
  started = true;
  void registerReminderWorker();
  window.setInterval(() => checkReminders(), 30_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(); });
}
