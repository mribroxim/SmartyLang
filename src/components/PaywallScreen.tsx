import { Check } from 'lucide-react';
import { PLANS, formatUSD } from '../lib/plans';
import { Sticker } from './stickers/Sticker';
import { useUiLang } from '../contexts/UiLangContext';
import type { UiStringKey } from '../lib/uiStrings';
import { ChunkyButton } from '../features/Bites/lesson/chunky';

const PERKS: UiStringKey[] = ['plans.lose.hearts', 'plans.row.practice', 'plans.row.ai', 'plans.row.ielts'];

/** A locked tab for free learners: Smarty explains what Max opens up, one tap to plans. */
export function PaywallScreen({
  email,
  accountLabel,
  onUpgrade,
  onBack,
}: {
  email?: string;
  accountLabel?: string;
  onUpgrade: () => void;
  onBack: () => void;
}) {
  const { t } = useUiLang();
  const max = PLANS.find((p) => p.id === 'smarty-max');

  return (
    <main className="flex-1 w-full bg-white dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-10 text-center sm:py-16">
        <Sticker id="state2.locked-feature" size="clamp(150px, 40vw, 200px)" priority="hero" mode="once" />
        <div className="relative mt-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900">
          <span aria-hidden className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
          <h1 className="font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t('paywall.title')}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('paywall.freeVocabulary.body')}</p>
        </div>

        <ul className="mt-6 w-full space-y-2 text-left">
          {PERKS.map((k) => (
            <li key={k} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep"><Check className="h-4 w-4" strokeWidth={3} /></span>
              {t(k)}
            </li>
          ))}
        </ul>

        {max && (
          <p className="mt-6 text-zinc-900 dark:text-zinc-50">
            <span className="font-serif text-3xl font-extrabold">{formatUSD(max.basePriceUSD)}</span>
            <span className="ml-1 text-sm font-bold text-slate-400">{t('plans.perMonth')}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{t('paywall.cancelAnytime')}</p>

        <ChunkyButton autoFocus onClick={onUpgrade} className="mt-5 w-full">{t('plans.getMax')}</ChunkyButton>
        <button type="button" onClick={onBack} className="mt-3 w-full py-2 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          {t('paywall.back')}
        </button>

        {(email || accountLabel) && (
          <p className="mt-6 text-[11px] text-slate-400">
            {email}{email && accountLabel ? ' · ' : ''}{accountLabel}
          </p>
        )}
      </div>
    </main>
  );
}
