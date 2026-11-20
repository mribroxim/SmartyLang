import { DialogSurface } from './DialogSurface';
import React, { useState } from 'react';
import { BookOpen, Trophy, User, Users, X, Trello, Shield, Moon, Sun, LogOut, Crown, GraduationCap, BookA, Target, Cat, Medal } from 'lucide-react';
import type { UserRole } from '../firebase';
import { isBusinessRole, isTeacherRole } from '../lib/access';
import { useUiLang } from '../contexts/UiLangContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setReadingView: (view: string) => void;
  userRole: UserRole;
  user: any;
  darkMode: boolean;
  onToggleDark: () => void;
  logout: () => void;
  onContentLangChange?: (lang: any) => void;
  /** Students can join classes and classroom games from "My Classes". */
  showClasses?: boolean;
  /** When true, open the extras sheet (driven by top-bar menu). */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}

function tabFamily(tab: string): string {
  if (tab === 'lessons' || tab === 'reading' || tab === 'story') return 'lessons';
  if (tab === 'vocabulary') return 'vocabulary';
  if (tab === 'classes') return 'classes';
  if (
    tab === 'practice' || tab === 'exercises' || tab === 'listening' || tab === 'speaking' ||
    tab === 'writing' || tab === 'comprehensive' || tab === 'ielts' ||
    tab === 'ielts-reading'
  ) return 'practice';
  if (tab === 'gamification') return 'gamification';
  if (tab === 'quests') return 'quests';
  if (tab === 'business' || tab === 'teacher' || tab === 'organization') return 'business';
  if (tab === 'profile' || tab === 'plans' || tab === 'dashboard') return 'profile';
  return tab;
}

export function MobileNav({
  activeTab, setActiveTab, setReadingView, userRole, user,
  darkMode, onToggleDark, logout, menuOpen, onMenuOpenChange, showClasses = false,
}: MobileNavProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onMenuOpenChange?.(v);
  };
  const isAdmin = userRole === 'admin';
  const isBusiness = isBusinessRole(userRole);
  const isTeacher = isTeacherRole(userRole);
  const { t } = useUiLang();
  const family = tabFamily(activeTab);

  const go = (tab: string) => {
    setActiveTab(tab);
    setOpen(false);
  };

  const primary = isAdmin
    ? [
        { tab: 'admin', Icon: Shield, label: t('nav.adminShort') },
        { tab: 'business', Icon: Trello, label: t('nav.businessShort') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : isBusiness
    ? [
        { tab: 'business', Icon: Trello, label: t('nav.businessShort') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : [
        { tab: 'lessons', Icon: GraduationCap, label: t('nav.learn') },
        // Teachers learn for free too, and get their classes tab instead of Practice.
        ...(isTeacher ? [{ tab: 'business', Icon: Trello, label: t('nav.teach') }] : []),
        { tab: 'vocabulary', Icon: BookA, label: t('nav.vocabulary') },
        ...(isTeacher ? [] : [{ tab: 'practice', Icon: Target, label: t('nav.practice') }]),
        ...(showClasses && !isTeacher ? [{ tab: 'classes', Icon: Users, label: t('nav.myClasses') }] : []),
        { tab: 'gamification', Icon: Trophy, label: t('nav.league') },
        { tab: 'quests', Icon: Medal, label: t('nav.quests') },
        { tab: 'profile', Icon: Cat, label: t('nav.profile') },
      ];

  const drawerSections: { title: string; items: { tab: string; Icon: React.ElementType; label: string }[] }[] = [
    ...([{
      title: t('nav.learn'),
      items: [
        { tab: 'lessons', Icon: BookOpen, label: t('nav.learn') },
        ...(isAdmin ? [{ tab: 'practice', Icon: Target, label: t('nav.practice') }] : []),
        ...(showClasses ? [{ tab: 'classes', Icon: Users, label: t('nav.myClasses') }] : []),
      ],
    }]),
    ...([{
      title: t('nav.keepGoing'),
      items: [
        { tab: 'vocabulary', Icon: GraduationCap, label: t('nav.vocabulary') },
        { tab: 'gamification', Icon: Trophy, label: t('nav.league') },
        ...(isAdmin ? [{ tab: 'quests', Icon: Medal, label: t('nav.quests') }] : []),
      ],
    }]),
    ...((isBusiness || isAdmin) ? [{
      title: t('nav.management'),
      items: [
        ...((isBusiness || isAdmin) ? [{ tab: 'business', Icon: Trello, label: t('nav.business') }] : []),
        ...(isAdmin ? [{ tab: 'admin', Icon: Shield, label: t('nav.admin') }] : []),
      ],
    }] : []),
    {
      title: t('nav.plans'),
      items: [{ tab: 'plans', Icon: Crown, label: t('nav.upgrade') }],
    },
  ];

  const isPrimaryActive = (tab: string) => tabFamily(tab) === family;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-white dark:bg-zinc-950 border-t-2 border-slate-200 dark:border-zinc-800">
          <div className="grid h-[64px]" style={{ gridTemplateColumns: `repeat(${primary.length}, 1fr)` }}>
            {primary.map(({ tab, Icon, label }) => {
              const isActive = isPrimaryActive(tab);
              return (
                <button
                  key={tab}
                  onClick={() => go(tab)}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  title={label}
                  className="flex items-center justify-center min-h-[44px] active:scale-90 transition-transform duration-100"
                >
                  <span className={`flex h-11 w-12 items-center justify-center rounded-2xl border-2 transition-[background-color,border-color,box-shadow] duration-200 ${
                    isActive
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_3px_0_0_#000] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa] dark-keep'
                      : 'border-transparent text-slate-400 dark:text-zinc-500'
                  }`}>
                    <Icon className="w-[26px] h-[26px]" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {open && (
        <DialogSurface onClose={() => setOpen(false)} className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-backdrop-in"
            onClick={() => setOpen(false)}
          />

          <div
            className="relative bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl max-h-[88vh] flex flex-col animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 bg-slate-300 dark:bg-zinc-600 rounded-full" />
            </div>

            <div className="px-5 pb-3 pt-1 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('nav.menu')}
              </h2>
              <button aria-label={t('a11y.close')}
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
              <button
                onClick={() => go('profile')}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border-2 border-slate-100 dark:border-zinc-700 active:scale-[0.98] transition-transform"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-11 h-11 rounded-full shrink-0 object-cover" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                      {(user?.displayName?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{user?.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{t('nav.profile')}</p>
                </div>
                <User className="w-4 h-4 text-slate-400" />
              </button>

              {!isBusiness && drawerSections.map(section =>
                section.items.length === 0 ? null : (
                  <div key={section.title || section.items.map(i => i.tab).join('-')}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                      {section.title}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {section.items.map(({ tab, Icon, label }) => {
                        const isActive = activeTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => go(tab)}
                            className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl text-[11px] font-semibold transition-all active:scale-95 ${
                              isActive
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 active:bg-slate-200 dark:active:bg-zinc-700'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="leading-tight text-center">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex items-center justify-end gap-2">
                <button
                  onClick={onToggleDark}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 active:scale-95 transition-transform"
                  title={t("core.mobilenav.toggle_dark_mode_2dda3c")}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500 dark:text-rose-400 active:scale-95 transition-transform"
                  title={t("profile.logout.go")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </DialogSurface>
      )}
    </>
  );
}
