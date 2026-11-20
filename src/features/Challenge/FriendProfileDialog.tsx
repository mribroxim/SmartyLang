import { useEffect, useState } from 'react';
import { Flame, Loader2, Swords, Trophy, X, Zap } from 'lucide-react';
import { DialogSurface } from '../../components/DialogSurface';
import { useUiLang } from '../../contexts/UiLangContext';
import { loadFriendProfile, type FriendProfile } from './api';

export const avatarHue = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h % 360; };

export const sheet = 'fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4';
export const panel = 'max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_6px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_6px_0_0_#27272a] sm:rounded-3xl';

/** Profile popup for a friend: quick stats and the Challenge button. */
export function FriendProfileDialog({ friend, onClose, onChallenge }: {
  friend: { uid: string; name: string }; onClose: () => void; onChallenge: (profile: FriendProfile) => void;
}) {
  const { t, tLevel } = useUiLang();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    loadFriendProfile(friend.uid).then(value => { if (live) setProfile(value); }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [friend.uid]);
  const name = friend.name || t('site.identity.student');
  return (
    <DialogSurface label={name} onClose={onClose} className={sheet}>
      <div className={panel}>
        <div className="mb-3 flex justify-end">
          <button type="button" aria-label={t('a11y.close')} onClick={onClose} className="rounded p-1 text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white text-3xl font-black text-white shadow-[0_3px_0_0_#cbd5e1] dark:border-zinc-800" style={{ background: `hsl(${avatarHue(name)} 55% 48%)` }} aria-hidden>{(name[0] || '?').toUpperCase()}</div>
          <h2 className="mt-3 w-full break-words font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{name}</h2>
          {profile && <p className="mt-1 text-sm font-bold text-slate-500 dark:text-zinc-400">{tLevel(profile.level as never)}</p>}
        </div>
        {!profile && !error && <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>}
        {error && <p role="alert" className="py-4 text-center text-sm font-semibold text-rose-600">{t('ch.profileError')}</p>}
        {profile && (
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { Icon: Zap, label: 'XP', value: profile.xp, tint: 'text-amber-500' },
              { Icon: Flame, label: t('ch.streak'), value: profile.streak, tint: 'text-orange-500' },
              { Icon: Trophy, label: t('ch.weekXp'), value: profile.weeklyXp, tint: 'text-emerald-600' },
            ].map(({ Icon, label, value, tint }) => (
              <div key={label} className="min-w-0 rounded-2xl border-2 border-slate-200 p-2 dark:border-zinc-700">
                <Icon className={`mx-auto h-5 w-5 ${tint}`} aria-hidden />
                <dd className="font-serif text-lg font-extrabold tabular-nums">{value}</dd>
                <dt className="truncate text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</dt>
              </div>
            ))}
          </dl>
        )}
        <button type="button" disabled={!profile} onClick={() => profile && onChallenge(profile)}
          className="dark-keep mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 font-serif text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#000] transition-[transform,box-shadow] duration-75 active:translate-y-[4px] active:shadow-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_4px_0_0_#a1a1aa]">
          <Swords className="h-5 w-5" aria-hidden />{t('friendGame.challenge')}
        </button>
      </div>
    </DialogSurface>
  );
}
