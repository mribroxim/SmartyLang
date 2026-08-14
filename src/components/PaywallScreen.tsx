import React from 'react';
import { ArrowRight, Check, Crown } from 'lucide-react';
import { ScreenShell } from './ScreenShell';
import { PLANS } from '../lib/atmos';

const INCLUDED = [
  'Structured lesson path across five levels',
  'Read aloud with live pronunciation scoring',
  'Listening, dictation and shadowing practice',
  'Speaking and writing checks with feedback',
  'Vocabulary with spaced repetition',
  'IELTS reading, listening, writing, speaking',
  'Streak, XP and progress synced to your account',
];

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
  const max = PLANS.find((p) => p.id === 'smarty-max');

  return (
    <ScreenShell
      title="Smarty Max"
      subtitle="This part of Smarty English is included with Smarty Max. Here’s everything it opens up."
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 lg:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-400 dark:text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-[16px] lg:text-[17px] text-zinc-900 dark:text-zinc-50 leading-tight">
                Everything in one subscription
              </p>
              <p className="text-[12px] lg:text-[13px] text-slate-400 mt-0.5">No add-ons, no per-skill upsells.</p>
            </div>
          </div>

          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5">
            {INCLUDED.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2.5 text-[13px] lg:text-[14px] text-slate-600 dark:text-zinc-300 leading-snug"
              >
                <span className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 lg:mt-0 rounded-xl bg-zinc-900 dark:bg-zinc-100 p-5 lg:p-7 lg:sticky lg:top-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-2">
            Smarty Max
          </p>
          {max && (
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[30px] lg:text-[36px] font-black font-mono text-white dark:text-zinc-900 leading-none">
                ${max.basePriceUSD}
              </span>
              <span className="text-[13px] font-bold text-zinc-400 dark:text-zinc-500">/ month</span>
            </div>
          )}
          <p className="text-[13px] text-zinc-400 dark:text-zinc-600 leading-relaxed mb-5">
            Cancel anytime. Your progress stays on your account either way.
          </p>

          <button
            type="button"
            onClick={onUpgrade}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-extrabold text-[15px] transition-transform active:scale-[0.99] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-offset-zinc-100"
          >
            Get Smarty Max <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 w-full py-3 rounded-xl text-[14px] font-semibold text-zinc-400 dark:text-zinc-600 hover:text-white dark:hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:focus-visible:ring-zinc-900"
          >
            Back to Home
          </button>

          {(email || accountLabel) && (
            <p className="mt-5 pt-4 border-t border-white/10 dark:border-zinc-900/10 text-[11px] text-zinc-500 dark:text-zinc-600 text-center">
              {email}
              {email && accountLabel ? ' · ' : ''}
              {accountLabel}
            </p>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
