import { accountUiLabel } from '../lib/uiAccountLabels';
import React, { useState } from 'react';
import { Save, Loader2, CheckCircle2, LogOut, Languages, Globe, ArrowLeft, ChevronRight, Crown } from 'lucide-react';
import { ArabicDisplayModeToggle } from '../components/ArabicDisplayModeToggle';
import { updateUserDisplayName, UserAccountProfile } from '../firebase';
import type { User as FBUser } from '../firebase';
import { LanguagePicker } from '../components/LanguagePicker';
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
  onMealEaten?: () => void;
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
  user, accountProfile, darkMode, onToggleDark, onLogout, onProfileUpdate, onContentLangChange, onNavigate, onOpenTab,
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
  const isMax = accountProfile.plan === 'smarty-max' || accountProfile.role === 'admin';

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[560px] space-y-6 px-4 pb-14 pt-5">
        {/* header */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate?.([])} aria-label={t('onboard.back')} className="-ml-2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"><ArrowLeft className="h-6 w-6" /></button>
          <h1 className="font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t('settings.title')}</h1>
        </div>

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

        <SettingsGroup title={t('lang.languages')}>
          <div className="border-b-2 border-slate-100 px-4 py-3.5 dark:border-zinc-800">
            <div className="mb-2 flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50"><Globe className="h-4 w-4 text-slate-400" />{t('lang.learning')}</div>
            <LanguagePicker mode="learning" variant="pills" className="w-full" onChange={(lang) => onContentLangChange?.(lang as ContentLang)} />
            <ArabicDisplayModeToggle className="mt-3" />
          </div>
          <div className="px-4 py-3.5">
            <div className="mb-2 flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50"><Languages className="h-4 w-4 text-slate-400" />{t('lang.interface')}</div>
            <LanguagePicker mode="interface" variant="pills" className="w-full" />
          </div>
        </SettingsGroup>

        <SettingsGroup title={t('settings.app')}>
          <SettingsRow label={t('core.profilepage.dark_mode_e7f8b9')} hint={t('core.profilepage.switch_between_light_and_dark_3b2f42')} last>
            <Toggle on={darkMode} onChange={onToggleDark} label={t('core.profilepage.dark_mode_e7f8b9')} />
          </SettingsRow>
        </SettingsGroup>

        <section>
          <h2 className="mb-2 px-1 font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('settings.smarty')}</h2>
          <SmartySettingsCard fallbackName={(accountProfile.displayName || user.displayName || '').split(' ')[0]} />
        </section>

        <SettingsGroup title={t('settings.subscription')}>
          <button type="button" onClick={() => onOpenTab?.('plans')} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60">
            <Sticker id={isMax ? 'premium.vip-cat' : 'premium.upgrade-magic'} size={44} mode="still" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-50">{isMax ? t('settings.maxActive') : t('settings.getMax')}</div>
              <div className="text-xs font-semibold text-slate-400">{isMax ? t('settings.manage') : t('settings.maxPitch')}</div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </button>
        </SettingsGroup>

        {confirmLogout ? (
          <div role="dialog" aria-label={t('profile.logout.confirm')} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 p-4 text-center dark:border-zinc-800">
            <Sticker id="pose.bye-for-now" size={110} priority="hero" />
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t('profile.logout.confirm')}</p>
            <div className="flex w-full gap-2">
              <button type="button" autoFocus onClick={() => setConfirmLogout(false)} className="flex-1 rounded-2xl border-2 border-slate-200 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:shadow-[0_3px_0_0_#3f3f46]">{t('profile.logout.stay')}</button>
              <button type="button" onClick={onLogout} className="flex-1 rounded-2xl bg-rose-600 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#9f1239] active:translate-y-[3px] active:shadow-none">{t('profile.logout.go')}</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-rose-600 shadow-[0_3px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
            <LogOut className="h-4 w-4" />{t('core.profilepage.sign_out_61fd08')}
          </button>
        )}
      </div>
    </div>
  );
}
