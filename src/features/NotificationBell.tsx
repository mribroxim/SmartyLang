import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, BookOpen, Users, Megaphone, Info, GraduationCap } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from '../firebase';
import { EmptyState } from '../components/feedback/EmptyState';
import { Sticker } from '../components/stickers/Sticker';
import { useUiLang } from '../contexts/UiLangContext';
import { useLocalReminders, markLocalReminderRead, type LocalReminder } from '../lib/smarty/reminders';
import { useProgress } from '../contexts/ProgressContext';

const TYPE_ICON: Record<AppNotification['type'], React.ReactNode> = {
  assignment:   <BookOpen className="w-4 h-4 text-blue-500" />,
  class_join:   <Users className="w-4 h-4 text-emerald-500" />,
  announcement: <Megaphone className="w-4 h-4 text-violet-500" />,
  role_change:  <GraduationCap className="w-4 h-4 text-amber-500" />,
  system:       <Info className="w-4 h-4 text-slate-500" />,
};

interface NotificationBellProps {
  uid: string;
  onNavigate?: (tab: string) => void;
}

export function NotificationBell({ uid, onNavigate }: NotificationBellProps) {
  const { t } = useUiLang();
  const local = useLocalReminders();
  const { navigate } = useProgress();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length + local.filter(n => !n.read).length;

  const load = async () => {
    setLoading(true);
    try { setNotifs((await getNotifications(uid, 20)) || []); }
    catch { /* Keep the cached feed available while offline. */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [uid]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => { setOpen(o => !o); if (!open) load(); };

  const handleRead = async (n: AppNotification) => {
    if (n.read || !n.id) return;
    await markNotificationRead(uid, n.id);
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.link && onNavigate) { onNavigate(n.link); setOpen(false); }
  };

  const handleReadAll = async () => {
    markLocalReminderRead();
    await markAllNotificationsRead(uid);
    setNotifs(prev => prev.map(x => ({ ...x, read: true })));
  };

  const openLocal = (row: LocalReminder) => {
    markLocalReminderRead(row.id);
    setOpen(false);
    navigate({ tab: 'lessons', path: ['today'] });
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button aria-label={t('today.notifications')} onClick={handleOpen} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-zinc-900 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[min(20rem,calc(100vw-24px))] bg-white dark:bg-zinc-900 rounded-2xl border-2 dark:border-zinc-700 z-50 overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">{unread > 0 && <Sticker id={notifs.some(n => !n.read && n.type === 'class_join') ? 'state.youve-got-mail' : 'state2.notifications'} size={34} mode="once" className="-my-2" />}{t('today.notifications')} {unread > 0 && <span className="text-rose-500">({unread})</span>}</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={handleReadAll} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100" title={t("site.notificationbell.mark_all_read_8958e2")}>
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button aria-label={t('a11y.close')} onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {local.map(row => <button key={row.id} type="button" onClick={() => openLocal(row)} className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-100 dark:border-zinc-800 ${row.read ? '' : 'bg-amber-50 dark:bg-amber-950/30'}`}><Bell className="w-4 h-4 mt-1 text-amber-500 shrink-0" /><div><p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t(row.kind === 'streak' ? 'today.riskReminderTitle' : 'today.reminderTitle')}</p><p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{t(row.kind === 'streak' ? 'today.riskReminderBody' : 'today.reminderBody')}</p></div></button>)}
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">{t("site.contentmanager.loading_33ce41")}</div>
            ) : notifs.length === 0 && local.length === 0 ? (
              <EmptyState sticker="state.box-cat" title={t('empty.notifications.title')} body={t('empty.notifications.body')} compact />
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${!n.read ? 'bg-blue-50/60' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? <Info className="w-4 h-4 text-slate-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug ${!n.read ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
