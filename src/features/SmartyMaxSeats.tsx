import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Crown, Mail, X, Loader2, CheckCircle2, Clock, Send, AlertCircle, Sparkles, Plus, Minus, CreditCard } from 'lucide-react';
import {
  getSponsorSeatUsage, inviteToSmartyMax, revokeSmartyMaxInvitation,
  recordPayment, setUserPlan,
  SmartyMaxInvitation, UserRole,
} from '../firebase';
import {
  getPlan, isAtmosConfigured, redirectToAtmosForSeats,
  computeSeatAddOnUSD, computeSeatAddOnUZSTiyin, formatUSD, formatUZS,
  PlanId,
} from '../lib/atmos';

interface SmartyMaxSeatsProps {
  /** UID of the sponsor (teacher or organization). */
  sponsorUid: string;
  /** Email of the sponsor — needed for the payment record. */
  sponsorEmail?: string;
  /** Display name of the sponsor (shown to invitees). */
  sponsorName: string;
  /** Role of the sponsor (used for invitation metadata). */
  sponsorRole: UserRole;
  /** Plan id that owns the seats (drives per-seat pricing in the buy modal). */
  currentPlan: PlanId;
  /** Total seats included in the plan (5 for Teacher, 30+ for Organization). */
  totalSeats: number;
  /** Optional callback when seats change so the parent can refresh stats. */
  onChange?: () => void;
  /** Called after seats are successfully added (refresh page state). */
  onSeatsAdded?: (newTotal: number) => void;
  /** Customise the headline (e.g. "Teacher Seats" vs "Organization Seats"). */
  title?: string;
  /** Show below the title. */
  subtitle?: string;
  /** Hide the upgrade nudge if the org/teacher has already added extras. */
  hideUpgradeHint?: boolean;
}

export function SmartyMaxSeats({
  sponsorUid, sponsorEmail, sponsorName, sponsorRole,
  currentPlan, totalSeats, onChange, onSeatsAdded,
  title = 'SmartyLang Max Seats',
  subtitle,
  hideUpgradeHint,
}: SmartyMaxSeatsProps) {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<SmartyMaxInvitation[]>([]);
  const [accepted, setAccepted] = useState(0);
  const [pending, setPending] = useState(0);

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Buy-seats modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyCount, setBuyCount] = useState(5);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyErr, setBuyErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const usage = await getSponsorSeatUsage(sponsorUid);
      setInvitations(usage.invitations.filter(i => i.status !== 'revoked'));
      setAccepted(usage.accepted);
      setPending(usage.pending);
    } finally { setLoading(false); }
  }, [sponsorUid]);

  useEffect(() => { reload(); }, [reload]);

  const used = accepted + pending;
  const remaining = Math.max(0, totalSeats - used);
  const overLimit = used > totalSeats;
  const pct = totalSeats > 0 ? Math.min(100, (used / totalSeats) * 100) : 0;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOkMsg(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (remaining <= 0) {
      setErr(`You've used all ${totalSeats} seats. Free a seat or buy more to invite again.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErr('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const result = await inviteToSmartyMax(sponsorUid, sponsorName, sponsorRole, trimmed);
      setEmail('');
      setOkMsg(
        result.status === 'accepted'
          ? `${trimmed} already had an account — SmartyLang Max activated for them.`
          : `Invitation sent to ${trimmed}. SmartyLang Max will activate when they sign in.`,
      );
      await reload();
      onChange?.();
      setTimeout(() => setOkMsg(null), 5000);
    } catch (e: any) {
      setErr(e?.message || 'Failed to send invitation.');
    } finally { setBusy(false); }
  };

  // ── Buy-Seats helpers ────────────────────────────────────────────────
  const plan = useMemo(() => getPlan(currentPlan), [currentPlan]);
  const seatPrice = plan?.extraSeatPriceUSD ?? 12.99;
  const buyTotalUSD = useMemo(
    () => plan ? computeSeatAddOnUSD(plan, buyCount) : 0,
    [plan, buyCount],
  );
  const buyTotalUZS = useMemo(
    () => plan ? computeSeatAddOnUZSTiyin(plan, buyCount) : 0,
    [plan, buyCount],
  );

  const openBuy = () => {
    setBuyCount(5);
    setBuyErr(null);
    setShowBuyModal(true);
  };

  const confirmBuy = async () => {
    if (!plan || buyCount < 1) return;
    setBuyErr(null); setBuyBusy(true);
    try {
      // Stash the pending seat purchase so it's finalized on the success redirect.
      const newTotal = totalSeats + buyCount;
      sessionStorage.setItem('smarty_pending_payment', JSON.stringify({
        type: 'seats',
        uid: sponsorUid,
        email: sponsorEmail ?? '',
        displayName: sponsorName,
        planId: currentPlan,
        currentSeats: totalSeats,
        additionalSeats: buyCount,
        newSeats: newTotal,
        amountUSD: buyTotalUSD,
        amountUZS: buyTotalUZS,
        startedAt: Date.now(),
      }));

      if (!isAtmosConfigured()) {
        // Dev fallback: instantly apply seats so the rest of the flow can be tested.
        await recordPayment({
          uid: sponsorUid,
          email: sponsorEmail ?? '',
          displayName: sponsorName,
          planId: currentPlan,
          seats: buyCount,
          amountUSD: buyTotalUSD,
          amountUZS: buyTotalUZS,
          status: 'completed',
          paidAt: Date.now(),
        });
        await setUserPlan(sponsorUid, currentPlan, { seats: newTotal });
        sessionStorage.removeItem('smarty_pending_payment');
        setShowBuyModal(false);
        setOkMsg(`Added ${buyCount} seat${buyCount === 1 ? '' : 's'} (ATMOS not configured — applied locally).`);
        onSeatsAdded?.(newTotal);
        setTimeout(() => setOkMsg(null), 5000);
        return;
      }

      redirectToAtmosForSeats(plan, buyCount, sponsorUid);
    } catch (e: any) {
      setBuyErr(e?.message || 'Failed to start payment.');
      setBuyBusy(false);
    }
  };

  const handleRevoke = async (inv: SmartyMaxInvitation) => {
    if (!inv.id) return;
    if (!confirm(`Revoke SmartyLang Max for ${inv.inviteeEmail}? They'll lose premium access immediately.`)) return;
    setBusy(true);
    try {
      await revokeSmartyMaxInvitation(inv.id);
      await reload();
      onChange?.();
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50">
              {used}<span className="text-slate-400 dark:text-zinc-500 text-xl">/{totalSeats}</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              seats used
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2.5 bg-white/60 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overLimit ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-zinc-300 font-bold">
            {accepted} active · {pending} pending invite{pending !== 1 ? 's' : ''}
          </span>
          <span className={`font-bold ${overLimit ? 'text-rose-700 dark:text-rose-400' : remaining === 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {overLimit ? `${used - totalSeats} over limit` : `${remaining} seat${remaining !== 1 ? 's' : ''} remaining`}
          </span>
        </div>

        {/* Buy more seats CTA */}
        <button
          onClick={openBuy}
          className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Buy more seats
        </button>
      </div>

      {/* Invite form */}
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@example.com"
              disabled={busy}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 bg-white text-sm focus:outline-none focus:border-zinc-400 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email.trim() || remaining <= 0}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Invite
          </button>
        </form>
        {err && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
          </div>
        )}
        {okMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {okMsg}
          </div>
        )}
        {remaining <= 0 && !hideUpgradeHint && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Out of seats? Add more from <span className="font-bold">Plans → Add seats</span>.
          </p>
        )}
      </div>

      {/* Invitee list */}
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">
          Invitees ({invitations.length})
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-zinc-500">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No one invited yet</p>
            <p className="text-xs mt-1">Use the form above to gift SmartyLang Max access.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {invitations.map(inv => (
              <li key={inv.id} className="py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  inv.status === 'accepted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}>
                  {inv.status === 'accepted' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{inv.inviteeEmail}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    {inv.status === 'accepted'
                      ? `Active since ${new Date(inv.acceptedAt ?? inv.createdAt).toLocaleDateString()}`
                      : `Pending — sent ${new Date(inv.createdAt).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(inv)}
                  disabled={busy}
                  title="Revoke SmartyLang Max access"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Buy Seats modal ────────────────────────────────────────────── */}
      {showBuyModal && plan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !buyBusy && setShowBuyModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-100 dark:border-amber-900">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Buy more seats</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{plan.name} plan · {formatUSD(seatPrice)} per seat / month</p>
                  </div>
                </div>
                <button onClick={() => !buyBusy && setShowBuyModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Seat picker */}
            <div className="p-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">
                How many additional seats?
              </label>
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => setBuyCount(c => Math.max(1, c - 1))}
                  disabled={buyBusy || buyCount <= 1}
                  className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={buyCount}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v > 0) setBuyCount(v);
                  }}
                  disabled={buyBusy}
                  className="w-24 h-14 text-center text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={() => setBuyCount(c => c + 1)}
                  disabled={buyBusy}
                  className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick presets */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {[5, 10, 25, 50].map(n => (
                  <button
                    key={n}
                    onClick={() => setBuyCount(n)}
                    disabled={buyBusy}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      buyCount === n
                        ? 'bg-zinc-900 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    +{n}
                  </button>
                ))}
              </div>

              {/* Cost summary */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl p-4 space-y-1.5 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-zinc-300">Currently active</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50 font-mono">{totalSeats} seats</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-zinc-300">After purchase</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{totalSeats + buyCount} seats</span>
                </div>
                <div className="border-t border-slate-200 dark:border-zinc-700 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-zinc-300">Monthly total</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{formatUSD(buyTotalUSD)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{formatUZS(buyTotalUZS)}</div>
                  </div>
                </div>
              </div>

              {buyErr && (
                <div className="mb-4 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {buyErr}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => !buyBusy && setShowBuyModal(false)}
                  disabled={buyBusy}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBuy}
                  disabled={buyBusy || buyCount < 1}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {buyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay {formatUSD(buyTotalUSD)}
                </button>
              </div>

              <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500 text-center">
                Secure payment via ATMOS · Uzcard, Humo, Visa, Mastercard accepted
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
