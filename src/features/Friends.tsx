import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, UserPlus, X } from 'lucide-react';
import { ScreenShell, seCard } from '../components/ScreenShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { useUiLang } from '../contexts/UiLangContext';
import { apiRequest } from '../lib/selfHostedApi';
import type { FriendGame } from '../lib/liveWordGame';
import { useFriends, type Friend } from './FriendsApi';
import { avatarHue, FriendProfileDialog } from './Challenge/FriendProfileDialog';
import { ChallengeFlow } from './Challenge/ChallengeFlow';
import { ChallengesSection, useChallenges } from './Challenge/ChallengesSection';
import type { FriendProfile } from './Challenge/api';

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return <span aria-hidden className="flex shrink-0 items-center justify-center rounded-full font-black text-white" style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${avatarHue(name)} 55% 48%)` }}>{(name[0] || '?').toUpperCase()}</span>;
}

/** Opens a friend's profile popup, then the challenge flow. Shared by the friends page and the leaderboard. */
export function useFriendPopups() {
  const [profileOf, setProfileOf] = useState<{ uid: string; name: string }>();
  const [challenging, setChallenging] = useState<FriendProfile>();
  const popups = <>
    {profileOf && <FriendProfileDialog friend={profileOf} onClose={() => setProfileOf(undefined)} onChallenge={profile => { setProfileOf(undefined); setChallenging(profile); }} />}
    {challenging && <ChallengeFlow friend={challenging} onClose={() => setChallenging(undefined)} onSent={() => window.dispatchEvent(new Event('smarty:challenges-changed'))} />}
  </>;
  return { openProfile: setProfileOf, popups };
}

/** #/gamification/people: friends, requests and challenges. Codes live in Settings. */
export function FriendsPage({ onBack, onAddFriend, onOpenGame }: { onBack: () => void; onAddFriend: () => void; onOpenGame: (code: string) => void }) {
  const { t } = useUiLang();
  const { data, busy, error, act } = useFriends();
  const { rows, reload } = useChallenges(15_000);
  const { openProfile, popups } = useFriendPopups();
  const [games, setGames] = useState<FriendGame[]>([]);
  useEffect(() => {
    const ctl = new AbortController();
    let timeout: number;
    async function poll() {
      try { if (!document.hidden) { const current = await apiRequest<FriendGame[]>('/api/live-game/friends', { signal: ctl.signal }); if (!ctl.signal.aborted) setGames(current.filter(game => game.phase !== 'finished')); } }
      catch { /* retry at the next poll */ }
      if (!ctl.signal.aborted) timeout = window.setTimeout(poll, 8000);
    }
    void poll();
    return () => { ctl.abort(); window.clearTimeout(timeout); };
  }, []);
  useEffect(() => { window.addEventListener('smarty:challenges-changed', reload); return () => window.removeEventListener('smarty:challenges-changed', reload); }, [reload]);

  const friends = (data?.friends || []).filter(friend => friend.accepted);
  const incoming = (data?.friends || []).filter(friend => !friend.accepted && !friend.outgoing);
  const sent = (data?.friends || []).filter(friend => !friend.accepted && friend.outgoing);
  const pill = (friend: Friend, children: React.ReactNode) => <li key={friend.uid} className={`${seCard} flex min-w-0 items-center gap-3 p-3`}><Avatar name={friend.name} />{children}</li>;
  return (
    <ScreenShell title={t('update.friends')} stickers={['social.friend-request', 'social.high-five-duo']} size="narrow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 font-serif text-sm font-extrabold text-slate-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><ArrowLeft className="h-4 w-4" aria-hidden />{t('nav.league')}</button>
        <button type="button" onClick={onAddFriend} className="dark-keep inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 font-serif text-sm font-extrabold text-white shadow-[0_3px_0_0_#000] active:translate-y-[3px] active:shadow-none dark:bg-zinc-100 dark:text-zinc-900"><UserPlus className="h-4 w-4" aria-hidden />{t('fr.add')}</button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm font-semibold text-rose-600">{t('update.friendsError')}</p>}
      <div className="space-y-6">
        {incoming.length > 0 && <section className="space-y-2" aria-labelledby="fr-req"><h2 id="fr-req" className="font-serif text-lg font-extrabold">{t('fr.requests')}</h2>
          <ul className="space-y-2">{incoming.map(friend => pill(friend, <>
            <span className="min-w-0 flex-1 break-words font-serif font-extrabold">{friend.name}</span>
            <button type="button" disabled={busy} aria-label={t('update.accept')} onClick={() => void act('accept', { friend: friend.uid })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_3px_0_0_#047857] active:translate-y-[3px] active:shadow-none dark-keep"><Check className="h-5 w-5" /></button>
            <button type="button" disabled={busy} aria-label={t('friendGame.decline')} onClick={() => void act('remove', { friend: friend.uid })} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 dark:border-zinc-700"><X className="h-5 w-5" /></button>
          </>))}</ul></section>}

        <ChallengesSection rows={rows} reload={reload} />

        {games.length > 0 && <section className="space-y-2" aria-labelledby="fr-games"><h2 id="fr-games" className="font-serif text-lg font-extrabold">{t('friendGame.invites')}</h2>
          <ul className="space-y-2">{games.map(game => <li key={game.code} className={`${seCard} flex items-center gap-3 p-3`}>
            <span className="min-w-0 flex-1 break-words font-serif font-extrabold">{game.name}</span>
            <button type="button" onClick={() => onOpenGame(game.code)} className="min-h-9 rounded-xl border-2 border-slate-200 px-3 font-serif text-sm font-extrabold dark:border-zinc-700">{t(game.phase === 'lobby' && !game.joined ? 'friendGame.join' : 'friendGame.open')}</button>
          </li>)}</ul></section>}

        <section className="space-y-2" aria-labelledby="fr-list">
          <h2 id="fr-list" className="font-serif text-lg font-extrabold">{t('fr.list')}</h2>
          {data && friends.length === 0 ? <EmptyState sticker="social.friend-request" title={t('fr.empty.title')} body={t('fr.empty.body')} className="py-6" />
            : <ul className="space-y-2">{friends.map(friend => <li key={friend.uid}>
              <button type="button" onClick={() => openProfile(friend)} className={`${seCard} flex w-full min-w-0 items-center gap-3 p-3 text-left active:translate-y-[2px]`}>
                <Avatar name={friend.name} /><span className="min-w-0 flex-1 break-words font-serif font-extrabold">{friend.name || t('site.identity.student')}</span><ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              </button></li>)}</ul>}
          {sent.length > 0 && <ul className="space-y-2 pt-2">{sent.map(friend => pill(friend, <>
            <span className="min-w-0 flex-1 break-words font-serif font-extrabold">{friend.name}</span><span className="text-xs font-bold text-slate-500">{t('update.pending')}</span>
            <button type="button" disabled={busy} onClick={() => void act('remove', { friend: friend.uid })} className="text-sm font-semibold underline">{t('action.cancel')}</button></>))}</ul>}
        </section>
      </div>
      {popups}
    </ScreenShell>
  );
}
