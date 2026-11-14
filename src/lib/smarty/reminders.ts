import { useSyncExternalStore } from 'react';
import { scopedKey, writeScopedJSON } from '../userStorage';
import { todayKey } from '../habitEngine';

export interface LocalReminder { id: string; kind: 'daily' | 'streak'; createdAt: number; read: boolean; notified?: boolean }
const KEY = 'today_reminders_v1';
const listeners = new Set<() => void>();
let version = 0;
const emit = () => { version++; listeners.forEach(fn => fn()); };
export function localReminders(): LocalReminder[] {
  try { const raw = JSON.parse(localStorage.getItem(scopedKey(KEY)) || '[]'); return Array.isArray(raw) ? raw : []; } catch { return []; }
}
function save(rows: LocalReminder[]) { writeScopedJSON(KEY, rows.slice(0, 14)); emit(); }
export function useLocalReminders(): LocalReminder[] {
  useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => version, () => version);
  return localReminders();
}
export function markLocalReminderRead(id?: string) { save(localReminders().map(row => !id || row.id === id ? { ...row, read: true } : row)); }

export function isStreakAtRisk(streak: number, xpToday: number, now = new Date()): boolean {
  return streak > 0 && xpToday === 0 && now.getHours() >= 18;
}
export function reminderDue(time: string | undefined, goalDone: boolean, now = new Date()): boolean {
  if (!time || goalDone || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const [hour, minute] = time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
}
export function ensureLocalReminder(kind: LocalReminder['kind'], now = new Date()): LocalReminder {
  const id = `smarty-reminder:${todayKey(now)}:${kind}`;
  const previous = localReminders();
  const existing = previous.find(row => row.id === id);
  if (existing) return existing;
  const row: LocalReminder = { id, kind, createdAt: now.getTime(), read: false };
  save([row, ...previous]);
  return row;
}
export function markReminderNotified(id: string) { save(localReminders().map(row => row.id === id ? { ...row, notified: true } : row)); }
