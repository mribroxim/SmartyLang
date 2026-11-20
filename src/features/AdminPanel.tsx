import { accountUiLabel } from '../lib/uiAccountLabels';
import { useUiLang } from '../contexts/UiLangContext';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Shield, Users, GraduationCap, RefreshCw, CheckCircle2, BarChart2, FileText, Ban, Crown, User as UserIcon, Loader2, Search, TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import {
  listAllProfiles, suspendUser, setUserPlan, setUserRole, auth,
  getAuditPage, getPlatformStats, listPayments,
  UserAccountProfile, PlanId,
  AuditEntryRow, PlatformStats, PaymentRecord,
} from '../firebase';
import { accountTypeOf, AccountType } from '../lib/access';
import { normalizePlanId } from '../lib/plans';
import { ManagementTabs } from '../components/ManagementTabs';
import '../styles/management.css';
import { ScreenShell, seCard } from '../components/ScreenShell';

type Tab = 'users' | 'financials' | 'analytics' | 'audit';

/**
 * Account Type is the single user-facing concept that combines role + plan.
 * - user            → role: student, no plan        (free / default)
 * - smarty-max      → role: student, plan: smarty-max  (paid premium individual)
 * - teacher         → role: teacher  (paid teacher plan)
 * - organization    → role: organization (paid org plan)
 * - admin           → role: admin (locked)
 */
const TYPE_BADGE: Record<AccountType, string> = {
  'user':            'bg-slate-50  text-slate-600  border-slate-200',
  'smarty-max':      'bg-amber-50  text-amber-700  border-amber-200',
  'teacher':         'bg-sky-50 text-sky-700 border-sky-200',
  'business':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'admin':           'bg-rose-50   text-rose-700   border-rose-200',
};
const TYPE_ICON: Record<AccountType, React.ReactNode> = {
  'user':            <UserIcon       className="w-4 h-4" />,
  'smarty-max':      <Crown          className="w-4 h-4" />,
  'teacher':         <GraduationCap  className="w-4 h-4" />,
  'business':        <GraduationCap  className="w-4 h-4" />,
  'admin':           <Shield         className="w-4 h-4" />,
};

/** Plan-only label (kept for the Payments table / financials breakdown). */
const PLAN_LABEL: Record<PlanId, string> = {
  'smarty-max': 'SmartyLang Max',
  'business':   'SmartyLang Business',
};
const PLAN_BADGE: Record<PlanId, string> = {
  'smarty-max': 'bg-amber-50  text-amber-700  border-amber-200',
  'business':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};



const fmtUSD = (n: number) => `$${n.toFixed(2)}`;

export function AdminPanel() {
  const { t: tr, uiLang } = useUiLang();
const ACTION_LABELS: Record<string, string> = {
  role_changed: 'Role Changed',
  plan_changed: 'Plan Changed',
  class_created: 'Class Created',
  user_suspended: 'User Suspended',
  user_unsuspended: 'User Unsuspended',
  org_teacher_added: 'Teacher Added',
  org_teacher_invited: 'Teacher Invited',
  org_teacher_removed: 'Teacher Removed',
};
const AUDIT_PAGE_SIZE = 25;

  const [tab, setTab] = useState<Tab>('users');
  const [profiles, setProfiles] = useState<UserAccountProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Tab, string>>>({});
  const clearError = (key: Tab) => setErrors(prev => ({ ...prev, [key]: undefined }));
  const loadError = (key: Tab, error: unknown) => setErrors(prev => ({ ...prev, [key]: error instanceof Error ? error.message : 'Request failed' }));

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [auditLog, setAuditLog] = useState<AuditEntryRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [auditAction, setAuditAction] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSearchApplied, setAuditSearchApplied] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const selfUid = auth.currentUser?.uid;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);


  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    clearError('users');
    try { setProfiles(await listAllProfiles()); }
    catch (error) { loadError('users', error); }
    finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    clearError('analytics');
    try { setStats(await getPlatformStats()); }
    catch (error) { loadError('analytics', error); }
    finally { setStatsLoading(false); }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    clearError('audit');
    try {
      const page = await getAuditPage({ limit: AUDIT_PAGE_SIZE, offset: auditPage * AUDIT_PAGE_SIZE, action: auditAction || undefined, search: auditSearchApplied || undefined });
      setAuditLog(page.entries); setAuditTotal(page.total); setAuditActions(page.actions);
    }
    catch (error) { loadError('audit', error); }
    finally { setAuditLoading(false); }
  }, [auditPage, auditAction, auditSearchApplied]);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    clearError('financials');
    try { setPayments(await listPayments(500)); }
    catch (error) { loadError('financials', error); }
    finally { setPaymentsLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === 'analytics') loadStats(); }, [tab, loadStats]);
  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab, loadAudit]);
  useEffect(() => { if (tab === 'financials') loadPayments(); }, [tab, loadPayments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? profiles.filter(p => (p.email ?? '').toLowerCase().includes(q) || (p.displayName ?? '').toLowerCase().includes(q)) : profiles;
    const order: Record<string, number> = { admin: 0, business: 1, teacher: 1, organization: 1, student: 2 };
    return [...list].sort((a, b) => ((order[a.role] ?? 2) - (order[b.role] ?? 2)) || ((b.createdAt || 0) - (a.createdAt || 0)));
  }, [profiles, query]);

  const counts = useMemo(() => {
    const c: Record<AccountType | 'suspended', number> = {
      'user': 0, 'smarty-max': 0, 'teacher': 0, 'business': 0, 'admin': 0, 'suspended': 0,
    };
    profiles.forEach(p => {
      c[accountTypeOf(p)]++;
      if (p.suspended) c.suspended++;
    });
    return c;
  }, [profiles]);

  // ── Financials aggregates ──────────────────────────────────────────────
  const financials = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed');
    const totalRevenueUSD = completed.reduce((s, p) => s + (p.amountUSD || 0), 0);
    const byPlan: Record<PlanId, { count: number; revenue: number; seats: number }> = {
      'smarty-max': { count: 0, revenue: 0, seats: 0 },
      'business':   { count: 0, revenue: 0, seats: 0 },
    };
    completed.forEach(p => {
      const k = normalizePlanId(p.planId);
      if (k && byPlan[k]) {
        byPlan[k].count++;
        byPlan[k].revenue += p.amountUSD || 0;
        byPlan[k].seats += p.seats || 0;
      }
    });
    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = completed.filter(p => p.paidAt >= last30Days);
    const mrr = recent.reduce((s, p) => s + (p.amountUSD || 0), 0);
    return { totalRevenueUSD, byPlan, mrr, totalTransactions: payments.length, completed: completed.length };
  }, [payments]);

  /**
   * Change a user's account type. This single call updates both role and plan in
   * the account database — User clears the plan + sets role=student, SmartyLang Max sets plan
   * but keeps the student role, Teacher/Organization swap the role accordingly.
   */
  const onAccountTypeChange = async (p: UserAccountProfile, next: AccountType) => {
    if (!p.uid || next === accountTypeOf(p)) return;
    if (p.uid === selfUid) { showToast(tr('admin.role.self')); return; }
    const label = accountUiLabel(tr, next);
    if (!window.confirm(tr('admin.role.confirm', { name: p.displayName || p.email, role: label }))) return;
    setSavingUid(p.uid);
    try {
      let role: UserAccountProfile['role'];
      let plan: PlanId | null | undefined = p.plan ?? undefined;
      if (next === 'admin' || next === 'teacher') {
        await setUserRole(p.uid, next);
        role = next;
      } else {
        // Leaving admin/teacher first returns the account to a normal learner, then the plan decides the rest.
        if (p.role === 'admin' || p.role === 'teacher') await setUserRole(p.uid, 'student');
        plan = next === 'user' ? null : next === 'smarty-max' ? 'smarty-max' : 'business';
        await setUserPlan(p.uid, plan);
        role = next === 'business' ? 'business' : 'student';
      }
      setProfiles(prev => prev.map(x => x.uid === p.uid ? { ...x, plan: plan ?? undefined, role } : x));
      showToast(tr('admin.role.changed', { name: p.displayName || p.email, role: label }));
    } catch (e: any) { showToast(e?.message || tr("core.management.failed_254aaf")); }
    finally { setSavingUid(null); }
  };

  const onSuspend = async (p: UserAccountProfile) => {
    if (!p.uid || p.uid === selfUid) return;
    const newSuspended = !p.suspended;
    setSavingUid(p.uid);
    try {
      await suspendUser(p.uid, newSuspended);
      setProfiles(prev => prev.map(x => x.uid === p.uid ? { ...x, suspended: newSuspended } : x));
      showToast(newSuspended ? tr("core.management.suspended_name_ecbf61", { name: p.displayName }) : tr("core.management.restored_access_for_name_df24ca", { name: p.displayName }));
    } catch { showToast(tr("core.management.failed_254aaf")); }
    finally { setSavingUid(null); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'users',      label: tr("core.management.users_57f2b1"),           icon: Users },
    { id: 'financials', label: tr("core.management.financials_0aeb7c"),      icon: DollarSign },
    { id: 'analytics',  label: tr("core.management.analytics_25bc96"),       icon: BarChart2 },
    { id: 'audit',      label: tr("core.management.audit_log_28dd75"),       icon: FileText },
  ];

  return (
    <ScreenShell
      size="wide"
      className="smarty-management"
      stickers={['learn.detective']}
      title={tr("nav.adminShort")}
      subtitle={tr("management.admin.subtitle")}
      actions={
        <button
          onClick={() => { loadUsers(); if (tab === 'analytics') loadStats(); if (tab === 'audit') loadAudit(); if (tab === 'financials') loadPayments(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 text-sm font-serif font-extrabold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />  {tr("site.app.refresh_56e3ba")}</button>
      }
    >
      <div className="flex items-center justify-end mb-3 lg:hidden">
        <button
          onClick={() => { loadUsers(); if (tab === 'analytics') loadStats(); if (tab === 'audit') loadAudit(); if (tab === 'financials') loadPayments(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-sm font-serif font-extrabold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />  {tr("site.app.refresh_56e3ba")}</button>
      </div>
      <ManagementTabs<Tab> tabs={tabs} active={tab} onSelect={setTab} />
      {errors[tab] && (
        <div role="alert" className={`${seCard} p-5 mb-5 border-rose-200`}>
          <p className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{tr('management.loadError')}</p>
          <p className="text-sm text-slate-500 mt-1 mb-3">{errors[tab]}</p>
          <button type="button" onClick={() => { if (tab === 'users') loadUsers(); else if (tab === 'analytics') loadStats(); else if (tab === 'audit') loadAudit(); else loadPayments(); }} className="px-4 py-2 rounded-2xl border-2 border-slate-200 font-bold">{tr('action.tryAgain')}</button>
        </div>
      )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-4">
              {(['user', 'smarty-max', 'teacher', 'business', 'admin'] as AccountType[]).map(t => (
                <div key={t} className={`${seCard} p-3 flex items-center gap-2.5`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${TYPE_BADGE[t]}`}>{TYPE_ICON[t]}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] leading-snug uppercase tracking-wider text-slate-400 font-bold">{accountUiLabel(tr, t)}</div>
                    <div className="text-xl font-serif font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">{profiles.length === 0 && (loading || errors.users) ? '—' : counts[t]}</div>
                  </div>
                </div>
              ))}
              <div className={`${seCard} p-3 flex items-center gap-2.5`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-500 border-slate-200 shrink-0"><Ban className="w-4 h-4" /></div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{tr("site.adminpanel.suspended_794696")}</div>
                  <div className="text-xl font-serif font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">{profiles.length === 0 && (loading || errors.users) ? '—' : counts.suspended}</div>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input aria-label={tr("site.adminpanel.search_users_71cd28")} value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("site.adminpanel.search_users_71cd28")} className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              {!loading && !errors.users && <p role="status" className="text-xs text-slate-500 shrink-0">{filtered.length} / {profiles.length} {tr('core.management.users_57f2b1')}</p>}
            </div>

            <div className={`${seCard} overflow-hidden`}>
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.user_9f8a23")}</th>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.account_type_ff6962")}</th>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.actions_c3cd63")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && !errors.users && <tr><td colSpan={3} className="p-10 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                      <p className="font-serif font-extrabold">{query.trim() ? tr('empty.search.title') : tr('management.noUsers')}</p>
                      {query.trim() && <button onClick={() => setQuery('')} className="mt-3 underline font-bold">{tr('management.clearSearch')}</button>}
                    </td></tr>}
                    {filtered.map(p => {
                      const saving = savingUid === p.uid;
                      const isAdmin = p.role === 'admin';
                      const type = accountTypeOf(p);
                      return (
                        <tr key={p.uid} className={`border-t border-slate-100 ${p.suspended ? 'opacity-60 bg-slate-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {p.photoURL ? <img src={p.photoURL} alt="" className="w-9 h-9 rounded-full shrink-0" /> : <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-zinc-600">{(p.displayName?.[0] || '?').toUpperCase()}</span></div>}
                              <div className="min-w-0">
                                <div className="font-serif font-extrabold text-zinc-900 truncate">{p.displayName || '—'}</div>
                                <div className="text-xs text-slate-500 truncate">{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${TYPE_BADGE[type]}`}>
                                {type === 'smarty-max' && <Crown className="w-3 h-3" />}
                                {isAdmin && <Shield className="w-3 h-3" />}
                                {accountUiLabel(tr, type)}
                              </span>
                              <select
                                aria-label={tr("site.adminpanel.change_account_type_fc5d08")}
                                value={type}
                                onChange={e => onAccountTypeChange(p, e.target.value as AccountType)}
                                disabled={saving || p.uid === selfUid}
                                className="px-2 py-1 rounded-md border-2 border-slate-200 dark:border-zinc-700 bg-white text-xs font-serif font-extrabold text-zinc-900 focus:outline-none disabled:opacity-60"
                                title={p.uid === selfUid ? tr('admin.role.self') : tr("site.adminpanel.change_account_type_fc5d08")}
                              >
                                <option value="user">{tr("site.adminpanel.user_9f8a23")}</option>
                                <option value="smarty-max">{tr("home.plan.max.name")}</option>
                                <option value="teacher">{accountUiLabel(tr, 'teacher')}</option>
                                <option value="business">{tr("home.plan.business.name")}</option>
                                <option value="admin">{accountUiLabel(tr, 'admin')}</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.uid !== selfUid && (
                              <button onClick={() => onSuspend(p)} disabled={saving} title={p.suspended ? tr("site.adminpanel.unsuspend_6a9485") : tr("site.adminpanel.suspend_b24247")} className={`p-1.5 rounded-lg text-xs font-serif font-extrabold ${p.suspended ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>
                                {p.suspended ? tr("site.adminpanel.unsuspend_6a9485") : tr("site.adminpanel.suspend_b24247")}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Financials ── */}
        {tab === 'financials' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{tr("site.adminpanel.total_revenue_f3a837")}</div>
                <div className="text-xl lg:text-3xl font-black text-emerald-700">{fmtUSD(financials.totalRevenueUSD)}</div>
                <div className="text-xs text-slate-500 mt-1">{financials.completed}  {tr("site.adminpanel.completed_payments_006fe0")}</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{tr("site.adminpanel.last_30_days_611886")}</div>
                <div className="text-xl lg:text-3xl font-black text-indigo-700">{fmtUSD(financials.mrr)}</div>
                <div className="text-xs text-slate-500 mt-1">{tr("site.adminpanel.recent_subscription_revenue_08ece5")}</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{tr("home.plan.max.name")}</div>
                <div className="text-xl lg:text-3xl font-black text-amber-700">{financials.byPlan['smarty-max'].count}</div>
                <div className="text-xs text-slate-500 mt-1">{fmtUSD(financials.byPlan['smarty-max'].revenue)}  {tr("site.adminpanel.revenue_abf72c")}</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{tr("home.nav.business")}</div>
                <div className="text-xl lg:text-3xl font-black text-emerald-700">
                  {financials.byPlan['business'].count}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {fmtUSD(financials.byPlan['business'].revenue)}  {tr("site.adminpanel.revenue_abf72c")}</div>
              </div>
            </div>

            {/* Per-plan breakdown */}
            <div className={`${seCard} p-6 mb-6`}>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />  {tr("site.adminpanel.revenue_by_plan_098e8b")}</h2>
              <div className="space-y-3">
                {(['smarty-max', 'business'] as PlanId[]).map(planId => {
                  const data = financials.byPlan[planId];
                  const pct = financials.totalRevenueUSD > 0 ? (data.revenue / financials.totalRevenueUSD) * 100 : 0;
                  return (
                    <div key={planId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-serif font-extrabold text-zinc-900">{PLAN_LABEL[planId]}</span>
                        <span className="text-slate-500 font-mono">
                          {fmtUSD(data.revenue)} · {data.count}  {tr("site.adminpanel.payments_79e025")}{data.seats}  {tr("site.adminpanel.seats_05d560")}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          planId === 'smarty-max' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment table */}
            <div className={`${seCard} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-500" />
                <h2 className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{tr("site.adminpanel.all_payments_ba6058")}</h2>
                <span className="text-xs text-slate-400 ml-auto">{payments.length}  {tr("site.adminpanel.records_86761b")}</span>
              </div>
              {paymentsLoading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : payments.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-serif font-extrabold text-slate-500">{tr("site.adminpanel.no_payments_yet_d48f53")}</p>
                  <p className="text-xs mt-1">{tr("site.adminpanel.payments_will_appear_here_automatically_1f73cd")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.customer_0e8574")}</th>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.plan_ae2f98")}</th>
                      <th className="text-right font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.seats_692aab")}</th>
                      <th className="text-right font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.amount_43dc85")}</th>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("library.status")}</th>
                      <th className="text-left font-serif font-extrabold px-4 py-3">{tr("site.adminpanel.date_eb9a4b")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="font-serif font-extrabold text-zinc-900 truncate max-w-[200px]">{p.displayName || '—'}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${PLAN_BADGE[p.planId]}`}>
                            {PLAN_LABEL[p.planId]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-900">{p.seats}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{fmtUSD(p.amountUSD)}</div>
                          <div className="text-[10px] text-slate-400">{p.amountUZS.toLocaleString(uiLang)}  {tr("site.adminpanel.som_ea8628")}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            p.status === 'refunded' ? 'bg-slate-100 text-slate-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(p.paidAt).toLocaleString(uiLang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Analytics ── */}
        {tab === 'analytics' && (
          statsLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> :
          stats ? (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: tr("core.management.total_accounts_b8b140"), value: stats.totalUsers, color: 'text-zinc-900' },
                  { label: tr("core.management.users_57f2b1"),           value: stats.students,    color: 'text-slate-600' },
                  { label: tr("home.nav.business"),        value: stats.business,    color: 'text-emerald-600' },
                  { label: tr("core.management.total_classes_7afd39"),   value: stats.totalClasses,    color: 'text-indigo-600' },
                  { label: tr("core.management.assignments_057d58"),     value: stats.totalAssignments, color: 'text-orange-600' },
                  { label: tr("core.management.admins_ed6b52"),          value: stats.admins,      color: 'text-rose-600' },
                  { label: tr("site.adminpanel.suspended_794696"),       value: stats.suspended,   color: 'text-slate-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`${seCard} p-5 text-center`}>
                    <div className={`text-3xl font-black ${color}`}>{value}</div>
                    <div className="text-sm text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className={`${seCard} p-6`}>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />  {tr("site.adminpanel.role_distribution_aa4bff")}</h2>
                <div className="space-y-3">
                  {[
                    { role: 'Users',         count: stats.students, total: stats.totalUsers, color: 'bg-slate-500' },
                    { role: 'Business', count: stats.business, total: stats.totalUsers, color: 'bg-emerald-500' },
                  ].map(({ role, count, total, color }) => (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-serif font-extrabold text-zinc-900">{role}</span><span className="text-slate-500">{count} ({total > 0 ? Math.round(count / total * 100) : 0}%)</span></div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${total > 0 ? count / total * 100 : 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null
        )}

        {/* ── Audit Log ── */}
        {tab === 'audit' && (
          <>
            <form className="mb-4 flex flex-wrap items-center gap-3" onSubmit={e => { e.preventDefault(); setAuditPage(0); setAuditSearchApplied(auditSearch.trim()); }}>
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input aria-label={tr('admin.logs.search')} value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder={tr('admin.logs.search')} className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <select aria-label={tr('admin.logs.action')} value={auditAction} onChange={e => { setAuditPage(0); setAuditAction(e.target.value); }} className="px-3 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-sm font-serif font-extrabold">
                <option value="">{tr('admin.logs.allActions')}</option>
                {auditActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>)}
              </select>
              <button type="submit" className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white text-sm font-serif font-extrabold">{tr('admin.logs.apply')}</button>
            </form>
            {auditLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : (
              <div className={`${seCard} overflow-hidden`}>
                {auditLog.length === 0 ? (
                  <div className="p-12 text-center text-slate-400"><FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p>{tr("site.adminpanel.no_audit_entries_yet_33de4c")}</p></div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left px-4 py-3 font-serif font-extrabold">{tr("site.adminpanel.action_97c89a")}</th>
                        <th className="text-left px-4 py-3 font-serif font-extrabold">{tr("site.adminpanel.actor_cbd19b")}</th>
                        <th className="text-left px-4 py-3 font-serif font-extrabold">{tr("site.adminpanel.target_details_c893b8")}</th>
                        <th className="text-left px-4 py-3 font-serif font-extrabold">{tr("lesson.stat.time")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((e, i) => (
                        <tr key={e.id ?? i} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.action === 'user_suspended' ? 'bg-rose-50 text-rose-700' : e.action === 'user_unsuspended' ? 'bg-emerald-50 text-emerald-700' : e.action === 'plan_changed' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {ACTION_LABELS[e.action] ?? e.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 text-xs font-mono truncate max-w-[180px]">{e.actorEmail || e.actorName || e.actorUid?.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs max-w-[280px] truncate">{e.targetEmail || e.targetName || (e.targetUid ? e.targetUid.slice(0, 8) : '')} {Object.entries(e.details ?? {}).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString(uiLang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
                {auditTotal > AUDIT_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
                    <span role="status">{tr('admin.logs.range', { from: auditPage * AUDIT_PAGE_SIZE + 1, to: Math.min(auditTotal, (auditPage + 1) * AUDIT_PAGE_SIZE), total: auditTotal })}</span>
                    <div className="flex gap-2">
                      <button type="button" disabled={auditPage === 0} onClick={() => setAuditPage(n => Math.max(0, n - 1))} className="px-3 py-1.5 rounded-xl border-2 border-slate-200 font-serif font-extrabold disabled:opacity-50">{tr('admin.logs.prev')}</button>
                      <button type="button" disabled={(auditPage + 1) * AUDIT_PAGE_SIZE >= auditTotal} onClick={() => setAuditPage(n => n + 1)} className="px-3 py-1.5 rounded-xl border-2 border-slate-200 font-serif font-extrabold disabled:opacity-50">{tr('admin.logs.next')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}


      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 dark-keep px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-serif font-extrabold z-50 shadow-[0_3px_0_0_#000] dark:shadow-[0_3px_0_0_#a1a1aa] active:translate-y-[3px] active:shadow-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </ScreenShell>
  );
}
