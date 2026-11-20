import { useCallback, useEffect, useState } from 'react';
import { Swords, Trophy } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { MODE_META } from '../Classes/liveGameKit';
import { declineChallenge, listChallenges, type ChallengeRow } from './api';
import { ChallengePlay, ScoreCompare } from './ChallengeFlow';
import { DialogSurface } from '../../components/DialogSurface';
import { panel, sheet } from './FriendProfileDialog';
import { seCard } from '../../components/ScreenShell';

/** Poll the challenge list (short interval while the tab is visible). */
export function useChallenges(intervalMs = 20_000) {
  const [rows, setRows] = useState<ChallengeRow[] | null>(null);
  const reload = useCallback(() => listChallenges().then(setRows).catch(() => setRows(current => current ?? [])), []);
  useEffect(() => {
    void reload();
    const id = window.setInterval(() => { if (!document.hidden) void reload(); }, intervalMs);
    return () => window.clearInterval(id);
  }, [reload, intervalMs]);
  return { rows, reload };
}

export const waitingChallenges = (rows: ChallengeRow[] | null) => (rows || []).filter(row => row.incoming && row.status === 'open' && !row.expired);

/** Small "challenges waiting" card for the leaderboards page. */
export function ChallengesBanner({ onOpen }: { onOpen: () => void }) {
  const { t } = useUiLang();
  const { rows } = useChallenges(60_000);
  const waiting = waitingChallenges(rows).length;
  if (!waiting) return null;
  return (
    <button type="button" onClick={onOpen} className={`${seCard} mb-4 flex w-full min-w-0 items-center gap-3 p-3 text-left`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950"><Swords className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1 break-words font-serif font-extrabold">{t('ch.waitingBanner', { n: waiting })}</span>
    </button>
  );
}

/** The "Challenges" list on the friends page. */
export function ChallengesSection({ rows, reload }: { rows: ChallengeRow[] | null; reload: () => void }) {
  const { t } = useUiLang();
  const [playing, setPlaying] = useState<ChallengeRow>();
  const [viewing, setViewing] = useState<ChallengeRow>();
  const list = (rows || []).filter(row => !(row.expired && row.status === 'open'));
  if (!list.length) return null;
  const label = (row: ChallengeRow) => {
    if (row.status === 'done') return t(row.result === 'win' ? 'ch.statusWon' : row.result === 'lose' ? 'ch.statusLost' : 'ch.statusTie');
    return row.incoming ? t('ch.statusYourTurn') : t('ch.statusWaiting', { name: row.opponentName });
  };
  return (
    <section aria-labelledby="ch-title" className="space-y-2">
      <h2 id="ch-title" className="font-serif text-lg font-extrabold">{t('ch.listTitle')}</h2>
      <ul className="space-y-2">
        {list.map(row => {
          const meta = MODE_META[row.mode];
          const Icon = meta.icon;
          const open = row.incoming && row.status === 'open';
          return (
            <li key={row.id} className={`${seCard} flex min-w-0 flex-wrap items-center gap-3 p-3`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white dark-keep ${meta.tint}`}><Icon className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-serif font-extrabold">{row.opponentName}</span>
                <span className={`flex items-center gap-1 text-xs font-bold ${row.result === 'win' ? 'text-emerald-600' : row.result === 'lose' ? 'text-rose-600' : 'text-slate-500 dark:text-zinc-400'}`}>
                  {row.status === 'done' && <Trophy className="h-3 w-3" aria-hidden />}{t(meta.title)} · {label(row)}
                </span>
              </span>
              {open && <>
                <button type="button" onClick={() => setPlaying(row)} className="dark-keep min-h-9 rounded-xl bg-zinc-900 px-4 font-serif text-sm font-extrabold uppercase text-white dark:bg-zinc-100 dark:text-zinc-900">{t('ch.play')}</button>
                <button type="button" onClick={() => { void declineChallenge(row.id).then(reload); }} className="min-h-9 px-1 text-sm font-semibold underline">{t('friendGame.decline')}</button>
              </>}
              {row.status === 'done' && <button type="button" onClick={() => setViewing(row)} className="min-h-9 rounded-xl border-2 border-slate-200 px-3 font-serif text-sm font-extrabold dark:border-zinc-700">{t('teacher.games.results')}</button>}
            </li>
          );
        })}
      </ul>
      {playing && <ChallengePlay challenge={playing} onClose={() => { setPlaying(undefined); reload(); }} onFinished={reload} />}
      {viewing?.me && (
        <DialogSurface label={viewing.opponentName} onClose={() => setViewing(undefined)} className={sheet}>
          <div className={panel}>
            <ScoreCompare me={viewing.me} them={viewing.them} themName={viewing.opponentName} result={viewing.result} />
            <button type="button" onClick={() => setViewing(undefined)} className="mt-4 w-full font-serif text-sm font-extrabold underline">{t('ch.done')}</button>
          </div>
        </DialogSurface>
      )}
    </section>
  );
}
