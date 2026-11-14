import React, { useEffect, useState, useMemo } from 'react';
import { Check, CreditCard, AlertCircle, X, Loader2, Minus, Plus, Languages, Heart, Infinity as InfinityIcon, GraduationCap } from 'lucide-react';
import {
  PLANS, formatUZS, formatUSD,
  computeMonthlyUSD, computeMonthlyUZSTiyin, Plan, PlanId,
} from '../lib/plans';
import { isPaymentsConfigured, startPlanCheckout, resumeMax, maxPaidThrough } from '../lib/payments';
import { ScreenShell, seCard } from '../components/ScreenShell';
import { Sticker } from '../components/stickers/Sticker';
import { useUiLang } from '../contexts/UiLangContext';
import type { UiStringKey } from '../lib/uiStrings';
import type { UserAccountProfile } from '../firebase';
import { maxEndsAt } from '../lib/access';
import { ChunkyButton } from './Bites/lesson/chunky';
import { CancelMaxFlow } from './Plans/CancelMaxFlow';

interface PaymentPlansProps {
  user: any;
  currentPlan?: PlanId | null;
  /** Full profile (for cancel state, start date, gifted plans). */
  profile?: UserAccountProfile | null;
  onPlanActivated?: (planId: PlanId, seats: number, languages?: number) => void;
  /** Server returned an updated profile (cancel / keep Max). */
  onProfileChange?: (profile: Record<string, any>) => void;
}

/** Free vs Max, matching what each plan actually unlocks in the app. */
const COMPARE: { key: UiStringKey; free: boolean | 'hearts'; max: boolean | 'hearts' }[] = [
  { key: 'plans.row.path', free: true, max: true },
  { key: 'plans.row.hearts', free: 'hearts', max: 'hearts' },
  { key: 'plans.row.practice', free: false, max: true },
  { key: 'plans.row.ai', free: false, max: true },
  { key: 'plans.row.ielts', free: false, max: true },
  { key: 'plans.row.vocab', free: false, max: true },
];

export function PaymentPlans({ user, currentPlan, profile, onPlanActivated: _onPlanActivated, onProfileChange }: PaymentPlansProps) {
  const { t, uiLang } = useUiLang();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [seats, setSeats] = useState<number>(0);
  const [languages, setLanguages] = useState<number>(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const max = PLANS.find((p) => p.id === 'smarty-max')!;
  const business = PLANS.find((p) => p.id === 'business')!;
  const onMax = currentPlan === 'smarty-max';
  const endsAt = maxEndsAt(profile);
  const fmt = (ms: number) => new Date(ms).toLocaleDateString(uiLang, { year: 'numeric', month: 'long', day: 'numeric' });

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSeats(plan.minSeats ?? plan.includedSeats ?? 0);
    setLanguages(plan.includedLanguages ?? 1);
    setError(null);
  };

  const totalUSD = useMemo(
    () => (selectedPlan ? computeMonthlyUSD(selectedPlan, seats, languages) : 0),
    [selectedPlan, seats, languages]
  );
  const totalUZS = useMemo(
    () => (selectedPlan ? computeMonthlyUZSTiyin(selectedPlan, seats, languages) : 0),
    [selectedPlan, seats, languages]
  );

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError(null);
    try {
      if (user?.uid) {
        try {
          sessionStorage.setItem('smarty_pending_payment', JSON.stringify({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? user.email ?? 'User',
            planId: selectedPlan.id,
            seats,
            languages,
            amountUSD: totalUSD,
            amountUZS: totalUZS,
            startedAt: Date.now(),
          }));
        } catch { /* non-fatal */ }
      }

      if (!(await isPaymentsConfigured())) {
        throw new Error(t("core.common.payments_are_not_configured_yet_377c2a"));
      }
      await startPlanCheckout(selectedPlan, {
        planId: selectedPlan.id,
        seats,
        languages,
        amountUSD: totalUSD,
      });
    } catch (err: any) {
      setError(err.message || t("core.common.failed_to_start_payment_34237d"));
      setProcessing(false);
    }
  };

  const keepMax = async () => {
    setResuming(true);
    setResumeError(null);
    try {
      onProfileChange?.(await resumeMax());
    } catch (e: any) {
      setResumeError(e?.message || t('plans.cancel.error'));
    } finally {
      setResuming(false);
    }
  };

  const mark = (v: boolean | 'hearts', col: 'free' | 'max') => {
    if (v === 'hearts') {
      return col === 'max'
        ? <span className="inline-flex items-center gap-1 font-serif font-extrabold"><InfinityIcon className="h-5 w-5" /></span>
        : <span className="inline-flex items-center gap-1 font-serif font-extrabold"><Heart className="h-4 w-4 fill-rose-500 text-rose-500" />5</span>;
    }
    return v
      ? <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${col === 'max' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'bg-emerald-500 text-white'}`}><Check className="h-4 w-4" strokeWidth={3} /></span>
      : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-800"><Minus className="h-4 w-4" strokeWidth={3} /></span>;
  };

  return (
    <ScreenShell
      stickers={['state.bag-cat', 'premium.vip-cat']}
      title={t('plans.title')}
      subtitle={t('plans.subtitle')}
      size="wide"
    >
      <div className="mx-auto max-w-2xl">
        {onMax ? (
          /* Manage Smarty Max */
          <section className="rounded-3xl bg-zinc-900 p-6 text-white shadow-[0_6px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_6px_0_0_#a1a1aa] dark-keep">
            <div className="flex items-center gap-4">
              <span className="shrink-0 rounded-2xl bg-white p-1.5"><Sticker id={endsAt ? 'mood.teary' : 'premium.vip-cat'} size={88} priority="hero" mode="once" /></span>
              <div className="min-w-0">
                <p className="font-serif text-[11px] font-extrabold uppercase tracking-widest opacity-60">{t('plans.current')}</p>
                <h2 className="font-serif text-2xl font-extrabold tracking-tight">{t("core.paymentplans.smarty_max_f71a94")}</h2>
                <p className="mt-1 text-sm font-semibold opacity-80">
                  {endsAt ? t('plans.endsOn', { date: fmt(endsAt) }) : profile?.sponsoredBy ? t('plans.gifted') : t('plans.active')}
                </p>
              </div>
            </div>
            {endsAt ? (
              <>
                <ChunkyButton tone="secondary" onClick={keepMax} disabled={resuming} className="mt-5 w-full">
                  {resuming ? t('onboard.saving') : t('plans.keep')}
                </ChunkyButton>
                {resumeError && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{resumeError}</p>}
              </>
            ) : !profile?.sponsoredBy && (
              <button type="button" onClick={() => setCancelOpen(true)} className="mt-5 font-serif text-xs font-extrabold uppercase tracking-wide opacity-60 hover:opacity-100">
                {t('plans.cancel.open')}
              </button>
            )}
          </section>
        ) : (
          /* Upgrade to Smarty Max */
          <section className="text-center">
            <div className="flex justify-center"><Sticker id="premium.upgrade-magic" size="clamp(150px, 40vw, 210px)" priority="hero" /></div>
            <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">{t('plans.hero.title')}</h2>
            <p className="mx-auto mt-2 max-w-md font-semibold text-slate-500 dark:text-zinc-400">{t('plans.hero.body')}</p>

            <div className="mt-6 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white text-left shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46]">
              <div className="grid grid-cols-[1fr_64px_72px] items-center gap-2 border-b-2 border-slate-100 px-4 py-3 dark:border-zinc-800">
                <span />
                <span className="text-center font-serif text-xs font-extrabold uppercase tracking-wide text-slate-400">{t('plans.col.free')}</span>
                <span className="rounded-lg bg-zinc-900 py-1 text-center font-serif text-xs font-extrabold uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep">{t("core.paymentplans.max_a95e85")}</span>
              </div>
              {COMPARE.map((row) => (
                <div key={row.key} className="grid grid-cols-[1fr_64px_72px] items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t(row.key)}</span>
                  <span className="flex justify-center">{mark(row.free, 'free')}</span>
                  <span className="flex justify-center">{mark(row.max, 'max')}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-zinc-900 dark:text-zinc-50">
                <span className="font-serif text-3xl font-extrabold">{formatUSD(max.basePriceUSD)}</span>
                <span className="ml-1 text-sm font-bold text-slate-400">{t('plans.perMonth')}</span>
              </p>
              <ChunkyButton onClick={() => openPlan(max)} className="w-full sm:w-auto sm:min-w-[280px]">{t('plans.getMax')}</ChunkyButton>
              <p className="text-xs text-slate-400">{t('plans.secure')}</p>
            </div>
          </section>
        )}

        {/* Business, for teachers and schools */}
        <section className={`${seCard} mt-10 p-5`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"><GraduationCap className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{business.name}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{business.description}</p>
              <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatUSD(business.basePriceUSD)} <span className="font-semibold text-slate-400">{t('plans.perMonth')}</span></p>
            </div>
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {business.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-zinc-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{f}</li>
            ))}
          </ul>
          {currentPlan === 'business' ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 py-3 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{t('plans.currentBusiness')}</p>
          ) : (
            <ChunkyButton tone="secondary" onClick={() => openPlan(business)} className="mt-4 w-full">{t('plans.getBusiness')}</ChunkyButton>
          )}
        </section>
      </div>

      {cancelOpen && (
        <CancelMaxFlow
          endsAt={maxPaidThrough(profile)}
          formatDate={fmt}
          onClose={() => setCancelOpen(false)}
          onCancelled={(p) => onProfileChange?.(p)}
        />
      )}

      {selectedPlan && (
        <SubscribeModal
          plan={selectedPlan}
          seats={seats}
          setSeats={setSeats}
          languages={languages}
          setLanguages={setLanguages}
          totalUSD={totalUSD}
          totalUZS={totalUZS}
          error={error}
          processing={processing}
          onClose={() => { if (!processing) { setSelectedPlan(null); setError(null); } }}
          onConfirm={confirmSubscribe}
        />
      )}
    </ScreenShell>
  );
}

function CounterRow({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-4 p-4 lg:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          onChange={(e) => {
            const v = parseInt(e.target.value || '0', 10);
            onChange(Math.max(min, isNaN(v) ? min : v));
          }}
          className="flex-1 text-center text-2xl font-black font-mono py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SubscribeModal({
  plan, seats, setSeats, languages, setLanguages, totalUSD, totalUZS, error, processing, onClose, onConfirm,
}: {
  plan: Plan;
  seats: number;
  setSeats: (s: number) => void;
  languages: number;
  setLanguages: (n: number) => void;
  totalUSD: number;
  totalUZS: number;
  error: string | null;
  processing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useUiLang();
  const showSeatSelector = !!plan.extraSeatPriceUSD || (plan.minSeats ?? 0) > 0;
  const minSeats = plan.minSeats ?? plan.includedSeats ?? 0;
  const includedSeats = plan.includedSeats ?? 0;
  const seatCount = showSeatSelector ? Math.max(minSeats, seats) : 0;
  const extraSeats = Math.max(0, seatCount - includedSeats);
  const extraSeatCost = extraSeats * (plan.extraSeatPriceUSD ?? 0);
  const includedLangs = plan.includedLanguages ?? 1;
  const extraLangs = Math.max(0, languages - includedLangs);
  const langCost = plan.extraLanguagePerSeatUSD
    ? extraLangs * Math.max(showSeatSelector ? seatCount : 1, 1) * plan.extraLanguagePerSeatUSD
    : extraLangs * (plan.extraLearningLanguageUSD ?? 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md lg:max-w-lg shadow-[0_20px_60px_rgba(24,24,27,0.28)] border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 lg:p-7 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-5 lg:mb-6">
            <h2 className="font-serif font-black text-[20px] lg:text-[24px] tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              {t("core.paymentplans.configure_your_1712d3")} {plan.name}
            </h2>
            {!processing && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {showSeatSelector && (
            <CounterRow
              label={t("core.paymentplans.student_seats_117606")}
              hint={
                includedSeats > 0
                  ? `${includedSeats} included, extras at $${plan.extraSeatPriceUSD}/seat`
                  : `Minimum ${minSeats} seats at $${plan.extraSeatPriceUSD}/seat`
              }
              value={seats}
              min={minSeats}
              onChange={setSeats}
            />
          )}

          <CounterRow
            label={t("core.paymentplans.learning_languages_d7b7b3")}
            hint={
              plan.extraLanguagePerSeatUSD
                ? `1 included · +$${plan.extraLanguagePerSeatUSD} × seats per extra language (UI language stays free)`
                : `1 included · +$${plan.extraLearningLanguageUSD}/mo per extra language (UI language stays free)`
            }
            value={languages}
            min={includedLangs}
            onChange={setLanguages}
          />

          <div className="mb-4 p-4 lg:p-5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">{t("core.paymentplans.pricing_breakdown_78626b")}</h4>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {plan.basePriceUSD > 0 && (
                <div className="flex justify-between">
                  <span>{plan.name}  {t("core.paymentplans.base_1405df")}{includedSeats > 0 ? ` (${includedSeats} seats)` : ''}</span>
                  <span className="font-mono font-bold">{formatUSD(plan.basePriceUSD)}</span>
                </div>
              )}
              {extraSeats > 0 && (
                <div className="flex justify-between">
                  <span>{extraSeats} × ${plan.extraSeatPriceUSD}  {t("core.paymentplans.extra_seats_f97ba4")}</span>
                  <span className="font-mono font-bold">{formatUSD(extraSeatCost)}</span>
                </div>
              )}
              {extraLangs > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="flex items-start gap-1.5">
                    <Languages className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                    {plan.extraLanguagePerSeatUSD
                      ? `${extraLangs} extra lang × ${seatCount || 1} seats × $${plan.extraLanguagePerSeatUSD}`
                      : `${extraLangs} × $${plan.extraLearningLanguageUSD} extra languages`}
                  </span>
                  <span className="font-mono font-bold shrink-0">{formatUSD(langCost)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between text-base">
                <span className="font-black text-zinc-900 dark:text-zinc-50">{t("core.paymentplans.total_monthly_5da6b3")}</span>
                <span className="font-black font-mono text-zinc-900 dark:text-zinc-50">{formatUSD(totalUSD)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                <span>{t("core.paymentplans.uzs_equivalent_381a2a")}</span>
                <span>{formatUZS(totalUZS)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
            <strong>{t("core.paymentplans.checkout_3ac8e9")}</strong>  {t("core.paymentplans.opens_the_dodo_payments_secure_4cb7aa")}</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <ChunkyButton tone="secondary" onClick={onClose} disabled={processing} className="flex-1 !px-3">
              {t("onboard.back")}</ChunkyButton>
            <ChunkyButton onClick={onConfirm} disabled={processing} className="flex-1 !px-3">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {t("core.paymentplans.checkout_3ac8e9")}</ChunkyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
