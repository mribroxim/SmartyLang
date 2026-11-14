import { CatLogo } from './brand/CatLogo';
import { accountUiLabel } from '../lib/uiAccountLabels';
import React from 'react';
import { LogOut, GraduationCap, Home, Trello, Shield, Users, Moon, Sun, Crown, Lock, LayoutGrid, Trophy, BookA, Target, Medal } from 'lucide-react';
import type { UserAccountProfile, UserRole } from '../firebase';
import { NotificationBell } from '../features/NotificationBell';
import { accountTypeOf, AccountType, isBusinessRole } from '../lib/access';
import { type HabitState, normalizeHabit } from '../lib/habitEngine';
import { goalXpForMinutes } from '../lib/bites/xp';
import { useSmartyPrefs } from '../lib/smarty/prefs';
import { useUiLang } from '../contexts/UiLangContext';
import { useContentLang } from '../contexts/ContentLangContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setReadingView: (view: string) => void;
  userRole: UserRole;
  accountProfile?: UserAccountProfile | null;
  user: any;
  uid: string;
  loginWithGoogle: () => void;
  logout: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  habit?: HabitState;
  xp?: number;
  /** Only students an organization has added to a class see "My class". */
  inClass?: boolean;
}

const ACCOUNT_TYPE_BADGE: Record<AccountType, string> = {
  'user':            'bg-slate-50  text-slate-600  border-slate-200',
  'smarty-max':      'bg-amber-50  text-amber-700  border-amber-200',
  'business':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'admin':           'bg-rose-50   text-rose-700   border-rose-200',
  'content-manager': 'bg-sky-50    text-sky-700    border-sky-200',
};

const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, setReadingView, userRole, accountProfile, user, uid,
  loginWithGoogle, logout, darkMode, onToggleDark, habit, xp = 0, inClass = false,
}) => {
  const accountType = accountTypeOf(accountProfile);
  const isFreeUser = accountType === 'user';
  const { t } = useUiLang();
  const { isEnglish } = useContentLang();
  const h = habit ? normalizeHabit(habit) : null;
  const prefs = useSmartyPrefs();
  const goal = goalXpForMinutes(prefs.dailyMinutes);
  const earned = h ? Math.min(h.dailyGoal.xpEarned || 0, goal) : 0;
  const pct = Math.round((earned / goal) * 100);

  /** Lock practice/feature tabs for free Users (the click still works — it
   *  navigates to the locked-feature screen — but visually we mark them). */
  const PRACTICE_TABS = new Set([
    'practice', 'ielts', 'gamification', 'reading', 'listening', 'speaking', 'writing', 'exercises',
    'vocabulary', 'story', 'comprehensive', 'ielts-reading', 'ielts-full-mock',
    'classes',
  ]);

  const navBtn = (tab: string, label: string, Icon: React.ElementType, onClick?: () => void) => {
    const locked = isFreeUser && PRACTICE_TABS.has(tab);
    return (
      <button
        onClick={onClick ?? (() => setActiveTab(tab))}
        className={`w-full px-3 py-2.5 rounded-2xl border-2 font-serif text-[13px] font-extrabold uppercase tracking-wide flex items-center gap-3 transition-[background-color,color,transform,box-shadow] duration-75 active:translate-y-[2px] ${
          (activeTab === tab || (tab === 'practice' && activeTab === 'exercises') || (tab === 'dashboard' && activeTab === 'profile'))
            ? 'dark-keep border-zinc-900 bg-zinc-900 text-white shadow-[0_3px_0_0_#000] active:shadow-none dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa]'
            : locked
            ? 'border-transparent text-zinc-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={2.25} />
        <span className="flex-1 text-left">{label}</span>
        {locked && <Lock className="w-3 h-3 text-amber-500" />}
      </button>
    );
  };

  const roleLabel = accountUiLabel(t, accountType);
  const badgeClass = ACCOUNT_TYPE_BADGE[accountType];
  const isBusinessOrAdmin = isBusinessRole(userRole) || userRole === 'admin';
  const isContentManager = userRole === 'content-manager';

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 bg-white dark:bg-zinc-950 border-r-2 border-slate-200 dark:border-zinc-800 flex-col shrink-0 relative z-40">
      <div className="px-5 py-4 border-b-2 border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className="font-serif font-black tracking-tighter uppercase text-xl text-zinc-900 dark:text-zinc-50 hover:opacity-60 transition-opacity flex-1 text-left flex items-center gap-2"
          >
            <CatLogo className="h-8 w-8" />
            SmartyLang
          </button>
          {user && uid && (
            <NotificationBell uid={uid} onNavigate={setActiveTab} />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isFreeUser && (
          <button
            onClick={() => setActiveTab('plans')}
            className="w-full mb-3 rounded-xl bg-zinc-900 dark:bg-zinc-950 text-white dark-keep p-3.5 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.14em]">{t("core.sidebar.get_smartylang_max_4337f4")}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t("core.sidebar.unlock_reading_listening_speaking_writing_a509e3")}</p>
          </button>
        )}

        {navBtn('dashboard', t('nav.home'), Home)}
        {navBtn('lessons', t('nav.learn'), GraduationCap)}
        {navBtn('vocabulary', t('nav.vocabulary'), BookA)}
        {navBtn('practice', t('nav.practice'), Target)}
        {inClass && navBtn('classes', t('nav.myClasses'), Users)}
        {navBtn('gamification', t('nav.league'), Trophy)}
        {navBtn('quests', t('nav.quests'), Medal)}

        {isBusinessOrAdmin && (
          <>
            <div className="pt-3 pb-1 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('nav.management')}</p>
            </div>
            {(isBusinessRole(userRole) || userRole === 'admin') && navBtn('business', t('nav.business'), Trello)}
            {userRole === 'admin' && navBtn('admin', t('nav.admin'), Shield)}
            {userRole === 'admin' && navBtn('content', t('nav.content'), LayoutGrid)}
          </>
        )}

        {isContentManager && navBtn('content', t('nav.content'), LayoutGrid)}
      </div>

      {/* Bottom: dark mode + user info */}
      <div className="p-4 border-t-2 border-slate-100 dark:border-zinc-800">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
                {roleLabel}
              </span>
              <button onClick={onToggleDark} className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" title={t("core.mobilenav.toggle_dark_mode_2dda3c")}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full bg-zinc-200 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{user.displayName?.[0] ?? '?'}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{user.displayName}</span>
              </button>
              <button onClick={logout} title={t('action.signOut')} className="text-zinc-400 dark:text-zinc-500 hover:text-rose-500 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className="w-full py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
            {t('action.signIn')}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
