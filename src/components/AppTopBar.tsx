import React from 'react';
import { Flame, Zap, ChevronLeft, LayoutGrid } from 'lucide-react';
import { DAILY_GOAL_XP, type HabitState, normalizeHabit } from '../lib/habitEngine';
import { NotificationBell } from '../features/NotificationBell';

const ROOT_TABS = new Set([
  'dashboard', 'lessons', 'practice', 'gamification', 'profile',
  'admin', 'teacher', 'organization', 'content',
]);

function parentOf(tab: string): string {
  if (tab === 'classes' || tab === 'reading') return 'lessons';
  if (
    tab === 'listening' || tab === 'speaking' || tab === 'writing' ||
    tab === 'exercises' || tab === 'vocabulary' || tab === 'ielts' ||
    tab === 'ielts-reading' || tab === 'comprehensive' || tab === 'story'
  ) return 'practice';
  if (tab === 'plans') return 'profile';
  return 'dashboard';
}

interface Props {
  activeTab: string;
  title?: string;
  habit: HabitState;
  xp: number;
  user: any;
  uid?: string;
  onNavigate: (tab: string) => void;
  onOpenMenu?: () => void;
}

export function AppTopBar({ activeTab, title, habit, xp, user, uid, onNavigate, onOpenMenu }: Props) {
  const h = normalizeHabit(habit);
  const earned = Math.min(h.dailyGoal.xpEarned || 0, DAILY_GOAL_XP);
  const pct = Math.round((earned / DAILY_GOAL_XP) * 100);
  const isRoot = ROOT_TABS.has(activeTab);

  return (
    <header
      className="sticky top-0 z-30 shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-14 px-4 flex items-center gap-2.5 max-w-[560px] lg:max-w-none mx-auto lg:px-6">
        {isRoot ? (
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="font-serif font-black tracking-tighter uppercase text-[15px] text-zinc-900 dark:text-zinc-50 shrink-0"
          >
            SMARTY
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate(parentOf(activeTab))}
            className="flex items-center gap-0.5 text-zinc-900 dark:text-zinc-50 font-semibold text-sm min-h-[44px] -ml-1 pr-1 shrink-0 max-w-[55%]"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="truncate">{title || 'Back'}</span>
          </button>
        )}

        {isRoot && (
          <div className="flex-1 min-w-0 max-w-[180px] mx-auto">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Daily goal</span>
              <span>{earned} / {DAILY_GOAL_XP} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${h.dailyGoal.completed ? 'bg-emerald-500' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {!isRoot && <div className="flex-1" />}

        <div className="flex items-center gap-1.5 shrink-0">
          {isRoot && (
            <>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[12px] font-bold">
                <Flame className="w-3.5 h-3.5" />
                {h.globalStreak.current}
              </span>
              <span className="hidden xs:inline-flex sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                <Zap className="w-3.5 h-3.5" />
                {xp.toLocaleString()}
              </span>
            </>
          )}
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Menu"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          )}
          {uid && <NotificationBell uid={uid} onNavigate={onNavigate} />}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-7 h-7 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                {(user?.displayName?.[0] ?? '?').toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
