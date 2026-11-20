import { X, Flame, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Overlay } from '../../components/RewardPopup';
import { Sticker } from '../../components/stickers/Sticker';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { useUiLang } from '../../contexts/UiLangContext';
import { useProgressData } from './useProgressData';
import { hasAnyActivity, recapDue, weekId } from '../../lib/progress/recap';
import { readScopedJSON, writeScopedJSON } from '../../lib/userStorage';

const KEY = 'weekly_recap_shown_v1';

/** True once per week (weeks start Monday): the first open of a new week. */
export function shouldShowWeeklyRecap(now: Date = new Date()): boolean {
  return recapDue(readScopedJSON<string | null>(KEY, null), now);
}

export function markWeeklyRecapShown(now: Date = new Date()): void {
  writeScopedJSON(KEY, weekId(now));
}

/**
 * Popup summarising last week. Render it when `shouldShowWeeklyRecap()` is true,
 * and call `markWeeklyRecapShown()` in `onClose`/`onOpenProgress` (this card does it for you).
 */
export function WeeklyRecapCard({ onClose, onOpenProgress }: { onClose: () => void; onOpenProgress?: () => void }) {
  const { t } = useUiLang();
  const { recap } = useProgressData();
  const s = recap.stats;
  const quiet = !hasAnyActivity(s);
  const done = (open?: boolean) => { markWeeklyRecapShown(); onClose(); if (open) onOpenProgress?.(); };
  const rows: [string, number][] = [
    [t('progress.xp'), s.xp], [t('progress.bites'), s.bites], [t('progress.minutes'), s.minutes], [t('progress.words'), s.words],
  ];
  return (
    <AnimatePresence>
      <Overlay onClose={() => done()} z={100}>
        <button type="button" onClick={() => done()} aria-label={t('progress.recap.close')} className="absolute end-4 top-4 rounded-full p-2 text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100"><X className="h-5 w-5" /></button>
        <Sticker id={quiet ? 'pers.curious' : 'achieve.trophy-lift'} size="clamp(110px, 22dvh, 160px)" priority="hero" mode="once" className="mx-auto" />
        <div className="mt-1 flex items-center justify-center gap-1.5 font-serif text-xs font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400"><Sparkles className="h-4 w-4" />{t('progress.recap.great')}</div>
        <h2 className="mt-1 font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('progress.recap.title')}</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-slate-500 dark:text-zinc-400">{quiet ? t('progress.recap.quiet') : t('progress.recap.sub')}</p>
        {!quiet && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-left">
            {rows.map(([label, n]) => (
              <div key={label} className="rounded-2xl border-2 border-zinc-900 bg-white px-3 py-2.5 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-950 dark:shadow-[0_3px_0_0_#e4e4e7]">
                <div className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{n}</div>
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{label}</div>
              </div>
            ))}
            <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-amber-100 p-2.5 text-sm font-extrabold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
              <Flame className="h-4 w-4" />{t('progress.days')}: {s.daysActive}/7
            </div>
          </div>
        )}
        {onOpenProgress && <ChunkyButton autoFocus className="mt-5 w-full" onClick={() => done(true)}>{t('progress.recap.cta')}</ChunkyButton>}
        <button type="button" onClick={() => done()} className="mt-3 w-full py-2 text-sm font-bold text-slate-500 hover:text-zinc-900 dark:hover:text-zinc-100">{t('progress.recap.close')}</button>
      </Overlay>
    </AnimatePresence>
  );
}
