import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { getSponsorSeatUsage, inviteToSmartyMax, revokeSmartyMaxInvitation, type SmartyMaxInvitation, type UserAccountProfile } from '../../firebase';
import { ChunkyButton } from '../Bites/lesson/chunky';

/** Business accounts only: seats used, invite a student by email, remove, buy more. */
export function SeatsPanel({ profile, onBuyMore }: { profile: UserAccountProfile; onBuyMore: () => void }) {
  const { t } = useUiLang();
  const [invites, setInvites] = useState<SmartyMaxInvitation[] | null>(null);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const quota = Number(profile.planSeats || 0);

  const load = useCallback(async () => {
    try {
      const u = await getSponsorSeatUsage(profile.uid);
      setInvites(u.invitations.filter((i) => i.status !== 'revoked')); setTotal(u.total);
    } catch { setError(t('seats.error')); }
  }, [profile.uid, t]);
  useEffect(() => { void load(); }, [load]);

  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true); setError('');
    try {
      await inviteToSmartyMax(profile.uid, profile.displayName || '', profile.role, email.trim());
      setEmail(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : t('seats.error')); } finally { setBusy(false); }
  };
  const revoke = async (id: string) => {
    setBusy(true); setError('');
    try { await revokeSmartyMaxInvitation(id); await load(); } catch { setError(t('seats.error')); } finally { setBusy(false); }
  };
  const full = quota > 0 && total >= quota;

  return (
    <section className="mb-5 min-w-0 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{t('seats.title')}</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('seats.used', { used: total, total: quota })}</p>
        </div>
        <ChunkyButton tone="secondary" onClick={onBuyMore}>{t('seats.buy')}</ChunkyButton>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void invite(); }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('seats.email')} aria-label={t('seats.email')}
          className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100" />
        <ChunkyButton type="submit" disabled={busy || full || !email.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seats.invite')}</ChunkyButton>
      </form>
      {full && <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('seats.full')}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      {invites && (invites.length === 0 ? <p className="text-sm font-semibold text-slate-400">{t('seats.none')}</p> : (
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800">{invites.map((i) => (
          <li key={i.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{i.inviteeEmail}</span>
            <span className="shrink-0 text-xs font-bold text-slate-400">{t(i.status === 'pending' ? 'seats.pending' : 'seats.accepted')}</span>
            <button type="button" disabled={busy} onClick={() => void revoke(i.id)} className="shrink-0 text-sm font-semibold text-zinc-600 hover:text-rose-700 dark:text-zinc-300">{t('seats.revoke')}</button>
          </li>
        ))}</ul>
      ))}
    </section>
  );
}
