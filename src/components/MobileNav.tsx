import React, { useState } from 'react';
import {
  Home, BookOpen, Dumbbell, Trophy, User,
  Users, X, Trello, Building2, Shield,
  Moon, Sun, LogOut, Crown, LayoutGrid, Award, Brain, GraduationCap,
} from 'lucide-react';
import type { UserRole } from '../firebase';
import { useUiLang } from '../contexts/UiLangContext';
import { useContentLang } from '../contexts/ContentLangContext';

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
  /** When true, open the extras sheet (driven by top-bar menu). */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}

function tabFamily(tab: string): string {
  if (tab === 'dashboard') return 'dashboard';
  if (tab === 'lessons' || tab === 'reading' || tab === 'classes') return 'lessons';
  if (
    tab === 'practice' || tab === 'listening' || tab === 'speaking' ||
    tab === 'writing' || tab === 'exercises' || tab === 'vocabulary' ||
    tab === 'story' || tab === 'comprehensive' || tab === 'ielts' ||
    tab === 'ielts-reading'
  ) return 'practice';
  if (tab === 'gamification') return 'gamification';
  if (tab === 'profile' || tab === 'plans') return 'profile';
  return tab;
}

export function MobileNav({
  activeTab, setActiveTab, setReadingView, userRole, user,
  darkMode, onToggleDark, logout, menuOpen, onMenuOpenChange,
}: MobileNavProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onMenuOpenChange?.(v);
  };
  const isAdmin = userRole === 'admin';
  const isOrg = userRole === 'organization';
  const isTeacher = userRole === 'teacher' || isOrg || isAdmin;
  const isContentManager = userRole === 'content-manager';
  const { t } = useUiLang();
  const { isEnglish } = useContentLang();
  const family = tabFamily(activeTab);

  const go = (tab: string) => {
    setActiveTab(tab);
    setOpen(false);
  };

  const primary = isAdmin
    ? [
        { tab: 'dashboard', Icon: Home, label: t('nav.home') },
        { tab: 'admin', Icon: Shield, label: t('nav.adminShort') },
        { tab: 'teacher', Icon: Trello, label: t('nav.teacherShort') },
        { tab: 'content', Icon: LayoutGrid, label: t('nav.contentShort') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : isOrg
    ? [
        { tab: 'dashboard', Icon: Home, label: t('nav.home') },
        { tab: 'organization', Icon: Building2, label: t('nav.orgShort') },
        { tab: 'teacher', Icon: Trello, label: t('nav.teacherShort') },
        { tab: 'lessons', Icon: BookOpen, label: t('nav.learn') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : isContentManager
    ? [
        { tab: 'dashboard', Icon: Home, label: t('nav.home') },
        { tab: 'content', Icon: LayoutGrid, label: t('nav.contentShort') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : isTeacher
    ? [
        { tab: 'dashboard', Icon: Home, label: t('nav.home') },
        { tab: 'teacher', Icon: Trello, label: t('nav.teacherShort') },
        { tab: 'lessons', Icon: BookOpen, label: t('nav.learn') },
        { tab: 'practice', Icon: Dumbbell, label: t('nav.practice') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ]
    : [
        { tab: 'dashboard', Icon: Home, label: t('nav.home') },
        { tab: 'lessons', Icon: BookOpen, label: t('nav.learn') },
        { tab: 'practice', Icon: Dumbbell, label: t('nav.practice') },
        { tab: 'gamification', Icon: Trophy, label: t('nav.league') },
        { tab: 'profile', Icon: User, label: t('nav.profile') },
      ];

  const drawerSections: { title: string; items: { tab: string; Icon: React.ElementType; label: string }[] }[] = [
    ...(!isContentManager ? [{
      title: t('nav.learn'),
      items: [
        { tab: 'lessons', Icon: BookOpen, label: t('nav.learn') },
        ...(userRole === 'student' ? [{ tab: 'classes', Icon: Users, label: t('nav.myClasses') }] : []),
      ],
    }] : []),
    ...(!isContentManager ? [{
      title: t('nav.keepGoing'),
      items: [
        { tab: 'vocabulary', Icon: GraduationCap, label: t('nav.vocabulary') },
        { tab: 'exercises', Icon: Brain, label: t('nav.exercises') },
        ...(isEnglish ? [{ tab: 'ielts', Icon: Award, label: t('nav.ielts') }] : []),
        { tab: 'gamification', Icon: Trophy, label: t('nav.league') },
      ],
    }] : []),
    ...(isContentManager ? [{
      title: t('nav.content'),
      items: [{ tab: 'content', Icon: LayoutGrid, label: t('nav.content') }],
    }] : []),
    ...(isTeacher ? [{
      title: t('nav.management'),
      items: [
        ...((userRole === 'teacher' || userRole === 'admin') ? [{ tab: 'teacher', Icon: Trello, label: t('nav.teacher') }] : []),
        ...((userRole === 'organization' || userRole === 'admin') ? [{ tab: 'organization', Icon: Building2, label: t('nav.organization') }] : []),
        ...(userRole === 'admin' ? [{ tab: 'admin', Icon: Shield, label: t('nav.admin') }] : []),
        ...(userRole === 'admin' ? [{ tab: 'content', Icon: LayoutGrid, label: t('nav.content') }] : []),
      ],
    }] : []),
    {
      title: t('nav.plans'),
      items: [{ tab: 'plans', Icon: Crown, label: t('nav.upgrade') }],
    },
  ];

  const isPrimaryActive = (tab: string) => {
    if (tab === 'dashboard') return family === 'dashboard';
    if (tab === 'lessons') return family === 'lessons';
    if (tab === 'practice') return family === 'practice';
    if (tab === 'gamification') return family === 'gamification';
    if (tab === 'profile') return family === 'profile';
    return activeTab === tab;
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="grid h-[64px]" style={{ gridTemplateColumns: `repeat(${primary.length}, 1fr)` }}>
            {primary.map(({ tab, Icon, label }) => {
              const isActive = isPrimaryActive(tab);
              return (
                <button
                  key={tab}
                  onClick={() => go(tab)}
                  className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] active:scale-95 transition-transform duration-100"
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors duration-200 ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span
                    className={`text-[10px] transition-colors duration-200 ${
                      isActive
                        ? 'font-bold text-zinc-900 dark:text-zinc-50'
                        : 'font-medium text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
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
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
              <button
                onClick={() => go('profile')}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700 active:scale-[0.98] transition-transform"
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

              {drawerSections.map(section =>
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
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500 dark:text-rose-400 active:scale-95 transition-transform"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
