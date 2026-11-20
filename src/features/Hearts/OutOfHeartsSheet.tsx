import { ArrowLeft, Heart } from 'lucide-react';
import { Sticker } from '../../components/stickers/Sticker';
import { Sheet } from '../../components/feedback/Sheet';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useHearts, purchaseHeartRefill } from '../../lib/hearts/heartsStore';
import { HEART_REFILL_COST, MAX_HEARTS, nextHeartIn } from '../../lib/hearts/hearts';
import { useNow } from '../../hooks/useNow';

export function heartCountdown(ms: number): string {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}

export function HeartsOptions({ onPractice, onToday, onClose, sheet = false }: { onPractice: () => void; onToday?: () => void; onClose: () => void; sheet?: boolean }) {
  const { t } = useUiLang();
  const state = useHearts();
  const now = useNow();
  const { userProfile, spendCoins, unlimitedHearts, previewMode, navigate } = useProgress();
  const remaining = nextHeartIn(state, now);
  const refill = () => purchaseHeartRefill(spendCoins);
  return <div className="text-center">
    <div className="flex justify-center"><Sticker id={unlimitedHearts ? 'premium.unlimited-learning' : state.count === 0 ? 'pose.flop' : 'egg.shadow-boxing'} size={140} priority="hero" /></div>
    <h1 id="hearts-title" className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{unlimitedHearts ? t('hearts.unlimited') : state.count === 0 ? t('hearts.empty') : t('hearts.title')}</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{unlimitedHearts ? t('hearts.maxBody') : t('hearts.body')}</p>
    {!previewMode && <div className="flex justify-center gap-2 my-5" aria-label={unlimitedHearts ? t('hearts.unlimited') : t('hearts.count', { n: state.count })}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => <Heart key={i} className={`w-7 h-7 ${unlimitedHearts || i < state.count ? 'text-red-600 fill-current' : 'text-slate-200 dark:text-zinc-700'}`} />)}
    </div>}
    {!unlimitedHearts && remaining != null && <p className="mb-4 text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('hearts.next', { time: heartCountdown(remaining) })}</p>}
    {!unlimitedHearts && state.grace > 0 && <p className="text-xs font-semibold text-slate-500">{t('hearts.grace', { n: state.grace })}</p>}
    <div className="grid gap-2 mt-5">
      <button type="button" onClick={onPractice} className="w-full rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black py-3.5 transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t(unlimitedHearts ? 'hearts.review' : 'hearts.practice')}</button>
      {onToday && <button type="button" onClick={onToday} className="w-full rounded-full border-2 border-slate-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold py-3">{t('hearts.today')}</button>}
      {!unlimitedHearts && !previewMode && <>
        <button type="button" disabled={state.count >= MAX_HEARTS || userProfile.coins < HEART_REFILL_COST} onClick={refill} className="w-full rounded-full border-2 border-amber-200 dark:border-amber-900 text-zinc-900 dark:text-zinc-100 font-bold py-3 disabled:opacity-40">{t('hearts.refill', { n: HEART_REFILL_COST })}</button>
        <p className="text-xs text-slate-500">{t('hearts.coins', { n: userProfile.coins })}</p>
        <button type="button" onClick={() => navigate({ tab: 'plans', path: [] })} className="w-full rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 font-bold py-3">{t('hearts.upgrade')}</button>
      </>}
      <button type="button" onClick={onClose} className="py-3 inline-flex items-center justify-center gap-2 font-bold text-sm text-slate-500"><ArrowLeft className="w-4 h-4" />{sheet ? t('bites.backToPath') : t('smarty.continue')}</button>
    </div>
  </div>;
}

export function OutOfHeartsSheet(props: { onPractice: () => void; onToday?: () => void; onClose: () => void }) {
  return <Sheet titleId="hearts-title" onClose={props.onClose}><HeartsOptions {...props} sheet /></Sheet>;
}
