import { DialogSurface } from '../../components/DialogSurface';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, X } from 'lucide-react';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { cancelMax, type CancelReason } from '../../lib/payments';
import { ChunkyButton, Tile } from '../Bites/lesson/chunky';

type Step = 'lose' | 'reason' | 'confirm' | 'done';

const REASONS: CancelReason[] = ['price', 'not-using', 'features', 'technical', 'break', 'other'];
const LOSSES: UiStringKey[] = ['plans.lose.hearts', 'plans.lose.practice', 'plans.lose.ai', 'plans.lose.ielts'];
const STICKER: Record<Step, StickerId> = { lose: 'mood.teary', reason: 'mood.hmm', confirm: 'pers.dramatic-cry', done: 'pose.bye-for-now' };

/**
 * Cancelling Smarty Max, one honest step at a time: what you'd lose → why
 * (optional) → confirm with the end date → bye. Keeping Max is always one tap.
 */
export function CancelMaxFlow({ endsAt, onClose, onCancelled, formatDate }: {
  /** When Max would end if cancelled now (end of the paid period). */
  endsAt: number;
  onClose: () => void;
  onCancelled: (profile: Record<string, any>) => void;
  formatDate: (ms: number) => string;
}) {
  const { t } = useUiLang();
  const [step, setStep] = useState<Step>('lose');
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalEnd, setFinalEnd] = useState(endsAt);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const profile = await cancelMax(reason ?? undefined);
      if (typeof profile?.planCancelAt === 'number') setFinalEnd(profile.planCancelAt);
      onCancelled(profile);
      setStep('done');
    } catch (e: any) {
      setError(e?.message || t('plans.cancel.error'));
    } finally {
      setBusy(false);
    }
  };

  const title: Record<Step, string> = {
    lose: t('plans.cancel.loseTitle'),
    reason: t('plans.cancel.reasonTitle'),
    confirm: t('plans.cancel.confirmTitle'),
    done: t('plans.cancel.doneTitle'),
  };

  return (
    <DialogSurface role="presentation" aria-modal={undefined} onClose={() => !busy && onClose()} className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={() => !busy && onClose()}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={title[step]}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(env(safe-area-inset-bottom),24px)] text-center dark:bg-zinc-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step !== 'done' && (
          <button type="button" onClick={onClose} disabled={busy} aria-label={t('plans.cancel.keep')} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="flex justify-center"><Sticker id={STICKER[step]} size={130} priority="hero" mode="once" /></div>
            <h2 className="mt-1 font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{title[step]}</h2>

            {step === 'lose' && (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('plans.cancel.loseBody')}</p>
                <ul className="mt-4 space-y-2 text-left">
                  {LOSSES.map((k) => (
                    <li key={k} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 px-4 py-3 font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                        {k === 'plans.lose.hearts' ? <Heart className="h-4 w-4 fill-current" /> : <X className="h-4 w-4" strokeWidth={3} />}
                      </span>
                      {t(k)}
                    </li>
                  ))}
                </ul>
                <ChunkyButton autoFocus onClick={onClose} className="mt-6 w-full">{t('plans.cancel.keep')}</ChunkyButton>
                <button type="button" onClick={() => setStep('reason')} className="mt-3 w-full py-2 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-400 hover:text-rose-600">
                  {t('plans.cancel.continue')}
                </button>
              </>
            )}

            {step === 'reason' && (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('plans.cancel.reasonBody')}</p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                  {REASONS.map((r) => (
                    <Tile key={r} state={reason === r ? 'selected' : 'idle'} onClick={() => setReason(r)} aria-pressed={reason === r} className="py-2.5 text-sm">
                      {t(`plans.reason.${r}` as UiStringKey)}
                    </Tile>
                  ))}
                </div>
                <ChunkyButton onClick={() => setStep('confirm')} className="mt-6 w-full">{t('onboard.continue')}</ChunkyButton>
                <button type="button" onClick={onClose} className="mt-3 w-full py-2 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                  {t('plans.cancel.keep')}
                </button>
              </>
            )}

            {step === 'confirm' && (
              <>
                <p className="mt-2 font-semibold text-zinc-700 dark:text-zinc-200">{t('plans.cancel.confirmBody', { date: formatDate(endsAt) })}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{t('plans.cancel.confirmNote')}</p>
                {error && <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
                <ChunkyButton autoFocus onClick={onClose} disabled={busy} className="mt-6 w-full">{t('plans.cancel.keep')}</ChunkyButton>
                <ChunkyButton tone="secondary" onClick={confirm} disabled={busy} className="mt-3 w-full !text-rose-600">
                  {busy ? t('onboard.saving') : t('plans.cancel.confirm')}
                </ChunkyButton>
              </>
            )}

            {step === 'done' && (
              <>
                <p className="mt-2 font-semibold text-zinc-700 dark:text-zinc-200">{t('plans.cancel.doneBody', { date: formatDate(finalEnd) })}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{t('plans.cancel.doneNote')}</p>
                <ChunkyButton autoFocus onClick={onClose} className="mt-6 w-full">{t('plans.cancel.done')}</ChunkyButton>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DialogSurface>
  );
}
