import React, { useEffect, useState, useMemo } from 'react';
import { Check, Crown, GraduationCap, CreditCard, AlertCircle, X, Loader2, Minus, Plus, Building2, Mail } from 'lucide-react';
import {
  PLANS, redirectToAtmos, isAtmosConfigured, formatUZS, formatUSD,
  computeMonthlyUSD, computeMonthlyUZSTiyin, Plan, PlanId,
} from '../lib/atmos';
import { recordPayment, setUserPlan } from '../firebase';
import { ScreenShell, seCard, seGrid3, sePrimary } from '../components/ScreenShell';

interface PaymentPlansProps {
  user: any;
  currentPlan?: PlanId | null;
  onPlanActivated?: (planId: PlanId, seats: number) => void;
}

const PLAN_ICONS: Record<PlanId, any> = {
  'smarty-max': Crown,
  'teacher': GraduationCap,
  'organization': Building2,
};

const PLAN_COLORS: Record<PlanId, { icon: string; accent: string; button: string }> = {
  'smarty-max': {
    icon: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
    accent: 'text-zinc-900 dark:text-zinc-100',
    button: 'bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
  },
  'teacher': {
    icon: 'bg-slate-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    accent: 'text-zinc-900 dark:text-zinc-100',
    button: 'bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
  },
  'organization': {
    icon: 'bg-slate-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    accent: 'text-zinc-900 dark:text-zinc-100',
    button: 'bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
  },
};

export function PaymentPlans({ user, currentPlan, onPlanActivated }: PaymentPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [seats, setSeats] = useState<number>(0); // additional seats requested for selected plan
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSeats(plan.minSeats ?? plan.includedSeats ?? 0);
    setError(null);
  };

  const totalUSD = useMemo(
    () => (selectedPlan ? computeMonthlyUSD(selectedPlan, seats) : 0),
    [selectedPlan, seats]
  );
  const totalUZS = useMemo(
    () => (selectedPlan ? computeMonthlyUZSTiyin(selectedPlan, seats) : 0),
    [selectedPlan, seats]
  );

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError(null);
    try {
      const accountId = user?.uid || user?.email || `guest_${Date.now()}`;

      // Stash pending payment so it can be finalized on the success redirect.
      if (user?.uid) {
        try {
          sessionStorage.setItem('smarty_pending_payment', JSON.stringify({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? user.email ?? 'User',
            planId: selectedPlan.id,
            seats,
            amountUSD: totalUSD,
            amountUZS: totalUZS,
            startedAt: Date.now(),
          }));
        } catch { /* sessionStorage may be unavailable; non-fatal */ }
      }

      if (!isAtmosConfigured()) {
        // Dev/preview fallback: just activate the plan immediately so the rest
        // of the flow can be tested without a live ATMOS merchant account.
        if (user?.uid) {
          await recordPayment({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? user.email ?? 'User',
            planId: selectedPlan.id,
            seats,
            amountUSD: totalUSD,
            amountUZS: totalUZS,
            status: 'completed',
            paidAt: Date.now(),
          });
          await setUserPlan(user.uid, selectedPlan.id, { seats });
          sessionStorage.removeItem('smarty_pending_payment');
          onPlanActivated?.(selectedPlan.id, seats);
        }
        setSelectedPlan(null);
        setProcessing(false);
        return;
      }
      redirectToAtmos(selectedPlan, seats, accountId);
    } catch (err: any) {
      setError(err.message || 'Failed to start payment.');
      setProcessing(false);
    }
  };

  return (
    <ScreenShell
      title="Plans"
      subtitle="Individual, teacher, or school access."
      size="wide"
    >
      {currentPlan && (
        <div className={`${seCard} mb-3 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 p-3.5 lg:flex lg:items-center lg:gap-3`}>
          <span className="hidden lg:flex w-8 h-8 rounded-full bg-emerald-600 items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </span>
          <div>
            <p className="font-bold text-[14px] text-emerald-900 dark:text-emerald-200">
              You’re on {PLANS.find(p => p.id === currentPlan)?.name ?? currentPlan}
            </p>
            <p className="text-[12px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Access is active. Open Learn when you’re ready for your first lesson.
            </p>
          </div>
        </div>
      )}

      <div className={`${seGrid3} items-stretch`}>
        {PLANS.map(plan => {
          const Icon = PLAN_ICONS[plan.id];
          const color = PLAN_COLORS[plan.id];
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative ${seCard} ${plan.popular ? 'border-zinc-900 dark:border-zinc-100' : ''} flex flex-col`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                <div className={`w-9 h-9 rounded-xl ${color.icon} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>

                <h2 className="text-[16px] lg:text-[18px] font-serif font-black text-zinc-900 dark:text-zinc-50 mb-0.5 tracking-tight">{plan.name}</h2>
                <p className="text-[12px] text-slate-500 dark:text-zinc-400 mb-3 leading-snug">{plan.description}</p>

                <div className="mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  {plan.id === 'organization' ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[22px] font-black font-mono text-zinc-900 dark:text-zinc-50 leading-none">${plan.extraSeatPriceUSD}</span>
                        <span className="text-[12px] font-bold text-slate-400">/ seat / month</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Minimum {plan.minSeats} student seats</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[22px] font-black font-mono text-zinc-900 dark:text-zinc-50 leading-none">${plan.basePriceUSD}</span>
                        <span className="text-[12px] font-bold text-slate-400">/month</span>
                      </div>
                      {plan.extraSeatPriceUSD ? (
                        <p className="text-[11px] text-slate-400 mt-1">+ ${plan.extraSeatPriceUSD} per additional seat / month</p>
                      ) : null}
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-4 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] lg:text-[13px] text-slate-600 dark:text-zinc-300 leading-snug">
                      <div className="shrink-0 w-3.5 h-3.5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mt-0.5">
                        <Check className="w-2 h-2 text-white dark:text-zinc-900" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-3 text-center text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    ✓ Your current plan
                  </div>
                ) : (
                  <button
                    onClick={() => openPlan(plan)}
                    className={`${sePrimary} lg:w-full ${color.button}`}
                  >
                    {plan.id === 'organization' ? 'Configure & Subscribe' : `Subscribe to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <SubscribeModal
          plan={selectedPlan}
          seats={seats}
          setSeats={setSeats}
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

/* ── Subscribe / seat config modal ── */
function SubscribeModal({
  plan, seats, setSeats, totalUSD, totalUZS, error, processing, onClose, onConfirm,
}: {
  plan: Plan;
  seats: number;
  setSeats: (s: number) => void;
  totalUSD: number;
  totalUZS: number;
  error: string | null;
  processing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const showSeatSelector = !!plan.extraSeatPriceUSD || (plan.minSeats ?? 0) > 0;
  const minSeats = plan.minSeats ?? plan.includedSeats ?? 0;
  const includedSeats = plan.includedSeats ?? 0;
  const extraSeats = Math.max(0, seats - includedSeats);
  const extraCost = extraSeats * (plan.extraSeatPriceUSD ?? 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md lg:max-w-lg shadow-[0_20px_60px_rgba(24,24,27,0.28)] border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 lg:p-7 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-5 lg:mb-6">
            <h2 className="font-serif font-black text-[20px] lg:text-[24px] tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              Configure your {plan.name}
            </h2>
            {!processing && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Seat selector */}
          {showSeatSelector && (
            <div className="mb-4 p-4 lg:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Student seats</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    {includedSeats > 0
                      ? `${includedSeats} included, ${extraSeats} extra at $${plan.extraSeatPriceUSD}/seat`
                      : `Minimum ${minSeats} seats at $${plan.extraSeatPriceUSD}/seat`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSeats(Math.max(minSeats, seats - 1))}
                  disabled={seats <= minSeats}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={seats}
                  min={minSeats}
                  onChange={(e) => {
                    const v = parseInt(e.target.value || '0', 10);
                    setSeats(Math.max(minSeats, isNaN(v) ? minSeats : v));
                  }}
                  className="flex-1 text-center text-2xl font-black font-mono py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setSeats(seats + 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center mt-2 font-medium">total seats</p>
            </div>
          )}

          {/* Org-specific staff feature */}
          {plan.allowsStaffInvites && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 flex items-start gap-3">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                After payment you'll get an admin panel to <strong>invite unlimited staff as teachers</strong> and assign students to them.
              </div>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="mb-4 p-4 lg:p-5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Pricing breakdown</h4>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {plan.basePriceUSD > 0 && (
                <div className="flex justify-between">
                  <span>{plan.name} base{includedSeats > 0 ? ` (${includedSeats} seats included)` : ''}</span>
                  <span className="font-mono font-bold">{formatUSD(plan.basePriceUSD)}</span>
                </div>
              )}
              {extraSeats > 0 && (
                <div className="flex justify-between">
                  <span>{extraSeats} × ${plan.extraSeatPriceUSD} {plan.basePriceUSD > 0 ? 'extra ' : ''}seat{extraSeats === 1 ? '' : 's'}</span>
                  <span className="font-mono font-bold">{formatUSD(extraCost)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between text-base">
                <span className="font-black text-zinc-900 dark:text-zinc-50">Total monthly</span>
                <span className="font-black font-mono text-zinc-900 dark:text-zinc-50">{formatUSD(totalUSD)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                <span>UZS equivalent</span>
                <span>{formatUZS(totalUZS)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Clicking <strong>Pay with ATMOS</strong> redirects you to the ATMOS secure payment page. You return to Smarty English after confirmation.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={processing}
              className="flex-1 py-3 text-sm font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Pay with ATMOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
