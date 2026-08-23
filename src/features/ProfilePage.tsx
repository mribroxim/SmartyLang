import React, { useState } from 'react';
import { Save, Loader2, CheckCircle2, Moon, Sun, LogOut, Languages, Globe } from 'lucide-react';
import { ArabicDisplayModeToggle } from '../components/ArabicDisplayModeToggle';
import { updateUserDisplayName, UserAccountProfile } from '../firebase';
import type { User as FBUser } from 'firebase/auth';
import { LanguagePicker } from '../components/LanguagePicker';
import { ProfileIdentityCard } from '../components/ProfileIdentityCard';
import type { ContentLang } from '../lib/contentLang';
import { useUiLang } from '../contexts/UiLangContext';

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
}

export function ProfilePage({
  user, accountProfile, darkMode, onToggleDark, onLogout, onProfileUpdate, onContentLangChange,
  streak = 0, xp = 0,
}: ProfilePageProps) {
  const { t } = useUiLang();
  const [displayName, setDisplayName] = useState(accountProfile.displayName || user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim() || displayName === accountProfile.displayName) return;
    setSaving(true);
    try {
      await updateUserDisplayName(user.uid, displayName.trim());
      onProfileUpdate({ ...accountProfile, displayName: displayName.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[480px] lg:max-w-[720px] xl:max-w-[860px] px-4 pt-5 pb-8 lg:pb-14 space-y-2.5">
        <h1 className="text-[22px] font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">Settings</h1>

        <ProfileIdentityCard
          photoURL={user.photoURL}
          displayName={accountProfile.displayName}
          email={user.email}
          accountProfile={accountProfile}
          streak={streak}
          xp={xp}
        />

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3">Display Name</h3>
          {saved && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-3 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />Saved!</div>}
          <div className="flex gap-3">
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="flex-1 border border-slate-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 dark:text-zinc-50"
            />
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim() || displayName === accountProfile.displayName}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-black dark:hover:bg-white disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">This is the name others see across the platform.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-zinc-400">Email</span><span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-zinc-400">Account type</span><span className="font-medium text-zinc-900 dark:text-zinc-50 capitalize">{accountProfile.role}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-zinc-400">Member since</span><span className="font-medium text-zinc-900 dark:text-zinc-50">{new Date(accountProfile.createdAt).toLocaleDateString()}</span></div>
            {accountProfile.role === 'admin' && (
              <div className="flex items-center justify-between"><span className="text-slate-500">Admin access</span><span className="font-semibold text-rose-600">Full platform access</span></div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">Languages</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Change how the app looks and which language you are learning.</p>
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('lang.interface')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Menus, buttons, and labels</p>
              <LanguagePicker mode="interface" variant="pills" className="w-full" />
            </div>
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('lang.learning')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Passages, vocabulary, and practice content</p>
              <LanguagePicker
                mode="learning"
                variant="pills"
                className="w-full"
                onChange={(lang) => onContentLangChange?.(lang as ContentLang)}
              />
              <ArabicDisplayModeToggle className="mt-3" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3">Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">Dark Mode</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">Switch between light and dark interface</div>
            </div>
            <button
              onClick={onToggleDark}
              className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-zinc-100' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${darkMode ? 'left-6' : 'left-0.5'} flex items-center justify-center`}>
                {darkMode ? <Moon className="w-3 h-3 text-zinc-700" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </div>
            </button>
          </div>
        </div>

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
