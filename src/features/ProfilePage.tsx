import { accountUiLabel } from '../lib/uiAccountLabels';
import { AccountData } from './AccountData';
import { DialogSurface } from '../components/DialogSurface';
import React, { useState } from 'react';
import { Save, Loader2, CheckCircle2, LogOut, ArrowLeft, ChevronRight, Crown, User, BookOpen, SlidersHorizontal, Wallet, ShieldCheck, Sun, Moon, GraduationCap, History, UserPlus } from 'lucide-react';
import { updateUserDisplayName, setTeacherMode, UserAccountProfile } from '../firebase';
import { ActivityHistory } from './Activity/ActivityHistory';
import type { User as FBUser } from '../firebase';
import { CoursesPanel } from './CoursesPanel';
import { FriendsClassesPanel } from './FriendsCode';
import type { ContentLang } from '../lib/contentLang';
import { useUiLang } from '../contexts/UiLangContext';
import { SmartySettingsCard } from '../components/mascot/SmartySettingsCard';
import { Sticker } from '../components/stickers/Sticker';

interface ProfilePageProps {
  user: FBUser;
  accountProfile: UserAccountProfile;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  onProfileUpdate: (updated: UserAccountProfile) => void;
  onContentLangChange?: (lang: ContentLang) => void;
  streak?: number;
  xp?: number;
  league?: string;
  badges?: number;
  /** Route path under #/profile ('settings' opens settings). */
  path?: string[];
  onNavigate?: (path: string[]) => void;
  onOpenTab?: (tab: string) => void;
  /** Smarty ate a meal: award its XP. */
  onMealEaten?: (xp: number) => void;
}

/** Profile: Duolingo-style overview; the gear opens settings (#/profile/settings). */
export function ProfilePage(props: ProfilePageProps) {
  return <SettingsView {...props} />;
}

/** A titled group of settings rows, chunky card style. */
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">{title}</h2>
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({ label, hint, children, last = false }: { label: string; hint?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b-2 border-slate-100 dark:border-zinc-800'}`}>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-zinc-900 dark:text-zinc-50">{label}</div>
        {hint && <div className="text-xs font-semibold text-slate-400">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange}
      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${on ? 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark-keep' : 'border-slate-300 bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full border-2 bg-white transition-all ${on ? 'left-[26px] border-zinc-900' : 'left-0.5 border-slate-300 dark:border-zinc-600'}`} />
    </button>
  );
}

function SettingsView({
  user, accountProfile, darkMode, onToggleDark, onLogout, onProfileUpdate, onContentLangChange, onNavigate, onOpenTab, path,
}: ProfilePageProps) {
  const { t, uiLang } = useUiLang();
  const [displayName, setDisplayName] = useState(accountProfile.displayName || user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const changed = !!displayName.trim() && displayName.trim() !== (accountProfile.displayName || '');

  const handleSave = async () => {
    if (!changed) return;
    setSaving(true);
    try {
      await updateUserDisplayName(user.uid, displayName.trim());
      onProfileUpdate({ ...accountProfile, displayName: displayName.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };
  const [teacherBusy, setTeacherBusy] = useState(false);
  const [teacherError, setTeacherError] = useState(false);
  const canSwitchTeacher = accountProfile.role === 'student' || accountProfile.role === 'teacher';
  const isTeacherAccount = accountProfile.role === 'teacher';
  const toggleTeacher = async () => {
    setTeacherBusy(true); setTeacherError(false);
    try {
      const role = await setTeacherMode(!isTeacherAccount);
      onProfileUpdate({ ...accountProfile, role: role as UserAccountProfile['role'] });
    } catch { setTeacherError(true); } finally { setTeacherBusy(false); }
  };
  const sub = path?.[1];
  const GROUPS = ['profile', 'courses', 'friends', 'preferences', 'account', 'activity'] as const;
  type Group = typeof GROUPS[number];
  const group = (GROUPS as readonly string[]).includes(sub ?? '') ? (sub as Group) : null;
  const isMax = accountProfile.plan === 'smarty-max' || accountProfile.role === 'admin';

  const MENU: { id: Group | 'plan'; label: string; Icon: typeof User }[] = [
    { id: 'profile', label: t('settings.profile'), Icon: User },
    { id: 'courses', label: t('settings.courses'), Icon: BookOpen },
    { id: 'friends', label: t('fr.settingsTitle'), Icon: UserPlus },
    { id: 'preferences', label: t('settings.preferences'), Icon: SlidersHorizontal },
    { id: 'activity', label: t('act.title'), Icon: History },
    { id: 'plan', label: t('settings.managePlan'), Icon: Wallet },
    { id: 'account', label: t('settings.accountData'), Icon: ShieldCheck },
  ];
  const chunky = 'dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#e4e4e7] border-2 border-zinc-900 bg-white shadow-[0_4px_0_0_#18181b]';
  const heading = group ? MENU.find((m) => m.id === group)!.label : t('settings.title');

  return (
    <div className="min-w-0 flex-1 overflow-x-clip bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[560px] space-y-6 px-4 pb-14 pt-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate?.(group ? ['settings'] : [])} aria-label={t('onboard.back')} className="-ml-2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"><ArrowLeft className="h-6 w-6" /></button>
          <h1 className="min-w-0 truncate font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{heading}</h1>
        </div>

        {!group && (
          <div className="space-y-3">
            {MENU.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => id === 'plan' ? onOpenTab?.('plans') : onNavigate?.(['settings', id])}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${chunky}`}>
                <Icon className="h-6 w-6 shrink-0 text-zinc-900 dark:text-zinc-50" />
                <span className="min-w-0 flex-1 truncate font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{label}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
            ))}
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 ${chunky}`}>
              {darkMode ? <Moon className="h-6 w-6 shrink-0 text-zinc-900 dark:text-zinc-50" /> : <Sun className="h-6 w-6 shrink-0 text-zinc-900 dark:text-zinc-50" />}
              <span className="min-w-0 flex-1 truncate font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{t('settings.theme')}: {darkMode ? t('settings.themeDark') : t('settings.themeLight')}</span>
              <Toggle on={darkMode} onChange={onToggleDark} label={t('core.profilepage.dark_mode_e7f8b9')} />
            </div>
          </div>
        )}

        {group === 'profile' && (
          <>
        {/* who you are */}
        <div className="flex items-center gap-4 rounded-2xl border-2 border-zinc-900 bg-white p-4 shadow-[0_4px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#e4e4e7]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800">
            {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : <Sticker id="pose.mochi" size={60} mode="still" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{accountProfile.displayName || user.displayName || t('site.identity.you')}</div>
            <div className="truncate text-sm font-semibold text-slate-400">{user.email}</div>
            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-serif text-[11px] font-extrabold uppercase tracking-wide ${isMax ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
              {isMax && <Crown className="h-3 w-3" />}{accountUiLabel(t, accountProfile.plan === 'smarty-max' && accountProfile.role !== 'admin' ? 'smarty-max' : accountProfile.role)}
            </span>
          </div>
        </div>

        <SettingsGroup title={t('settings.profile')}>
          <div className="border-b-2 border-slate-100 px-4 py-3.5 dark:border-zinc-800">
            <label htmlFor="settings-name" className="font-bold text-zinc-900 dark:text-zinc-50">{t('core.profilepage.display_name_8d6b34')}</label>
            <div className="mt-2 flex gap-2">
              <input id="settings-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('core.profilepage.your_display_name_33a614')}
                className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100" />
              <button type="button" onClick={handleSave} disabled={saving || !changed}
                className="dark-keep inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 font-serif text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#000] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? t('core.profilepage.saved_e929bf') : t('core.profilepage.save_efc007')}
              </button>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">{t('core.profilepage.this_is_the_name_others_69d429')}</p>
          </div>
          <SettingsRow label={t('core.profilepage.email_84add5')}><span className="truncate text-sm font-semibold text-slate-500">{user.email}</span></SettingsRow>
          <SettingsRow label={t('core.profilepage.member_since_f425b0')} last><span className="text-sm font-semibold text-slate-500">{new Date(accountProfile.createdAt).toLocaleDateString(uiLang)}</span></SettingsRow>
        </SettingsGroup>

          </>
        )}

        {group === 'courses' && <CoursesPanel onContentLangChange={onContentLangChange} />}

        {group === 'friends' && <FriendsClassesPanel role={accountProfile.role} onOpenFriends={() => onOpenTab?.('friends')} onOpenClasses={() => onOpenTab?.('classes')} />}

        {group === 'preferences' && (
          <>
        <section>
          <h2 className="mb-2 px-1 font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('settings.smarty')}</h2>
          <SmartySettingsCard />
        </section>

          </>
        )}

        {group === 'activity' && <ActivityHistory />}

        {group === 'account' && (
          <>
        {canSwitchTeacher && (
          <section className={`rounded-2xl p-4 ${chunky}`}>
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-zinc-900 dark:text-zinc-50" />
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{t('account.teacher.title')}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('account.teacher.body')}</p>
                {isTeacherAccount && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-serif text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" />{t('account.teacher.active')}</p>}
              </div>
            </div>
            <button type="button" onClick={() => void toggleTeacher()} disabled={teacherBusy}
              className={`mt-3 w-full rounded-2xl py-3 font-serif text-[13px] font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none disabled:opacity-50 ${isTeacherAccount
                ? 'border-2 border-slate-200 bg-white text-zinc-700 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[0_3px_0_0_#3f3f46]'
                : 'dark-keep bg-zinc-900 text-white shadow-[0_3px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa]'}`}>
              {teacherBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : isTeacherAccount ? t('account.teacher.off') : t('account.teacher.on')}
            </button>
            {teacherError && <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">{t('account.teacher.error')}</p>}
          </section>
        )}
        <AccountData />
        {confirmLogout ? (
          <DialogSurface onClose={() => setConfirmLogout(false)} label={t('profile.logout.confirm')} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 p-4 text-center dark:border-zinc-800">
            <Sticker id="pose.bye-for-now" size={110} priority="hero" />
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t('profile.logout.confirm')}</p>
            <div className="flex w-full gap-2">
              <button type="button" autoFocus onClick={() => setConfirmLogout(false)} className="flex-1 rounded-2xl border-2 border-slate-200 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:shadow-[0_3px_0_0_#3f3f46]">{t('profile.logout.stay')}</button>
              <button type="button" onClick={onLogout} className="flex-1 rounded-2xl bg-rose-600 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#9f1239] active:translate-y-[3px] active:shadow-none">{t('profile.logout.go')}</button>
            </div>
          </DialogSurface>
        ) : (
          <button type="button" onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-rose-600 shadow-[0_3px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
            <LogOut className="h-4 w-4" />{t('core.profilepage.sign_out_61fd08')}
          </button>
        )}
          </>
        )}
      </div>
    </div>
  );
}
