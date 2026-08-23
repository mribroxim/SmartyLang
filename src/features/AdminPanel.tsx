import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Shield, Users, Building2, GraduationCap, RefreshCw,
  CheckCircle2, BarChart2, FileText, Ban, Crown, User as UserIcon,
  Loader2, Search, TrendingUp, DollarSign, CreditCard, LayoutGrid,
} from 'lucide-react';
import {
  listAllProfiles, setTeacherOrganization, suspendUser, setUserPlan, setUserRole,
  getAuditLog, getPlatformStats, listPayments,
  UserAccountProfile, PlanId,
  AuditEntry, PlatformStats, PaymentRecord,
} from '../firebase';
import { ContentManager } from './ContentManager';
import { ScreenShell, seCard } from '../components/ScreenShell';

type Tab = 'users' | 'financials' | 'analytics' | 'audit' | 'content';

/**
 * Account Type is the single user-facing concept that combines role + plan.
 * - user            → role: student, no plan        (free / default)
 * - smarty-max      → role: student, plan: smarty-max  (paid premium individual)
 * - teacher         → role: teacher  (paid teacher plan)
 * - organization    → role: organization (paid org plan)
 * - admin           → role: admin (locked)
 * - content-manager → role: content-manager (CMS access only)
 */
type AccountType = 'user' | 'smarty-max' | 'teacher' | 'organization' | 'admin' | 'content-manager';

const TYPE_LABEL: Record<AccountType, string> = {
  'user':            'User',
  'smarty-max':      'SmartyLang Max',
  'teacher':         'Teacher',
  'organization':    'Organization',
  'admin':           'Admin',
  'content-manager': 'Content Manager',
};
const TYPE_BADGE: Record<AccountType, string> = {
  'user':            'bg-slate-50  text-slate-600  border-slate-200',
  'smarty-max':      'bg-amber-50  text-amber-700  border-amber-200',
  'teacher':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'organization':    'bg-violet-50 text-violet-700 border-violet-200',
  'admin':           'bg-rose-50   text-rose-700   border-rose-200',
  'content-manager': 'bg-sky-50    text-sky-700    border-sky-200',
};
const TYPE_ICON: Record<AccountType, React.ReactNode> = {
  'user':            <UserIcon       className="w-4 h-4" />,
  'smarty-max':      <Crown          className="w-4 h-4" />,
  'teacher':         <GraduationCap  className="w-4 h-4" />,
  'organization':    <Building2      className="w-4 h-4" />,
  'admin':           <Shield         className="w-4 h-4" />,
  'content-manager': <LayoutGrid     className="w-4 h-4" />,
};

/** Derive the unified account type from a profile's role + plan. */
const accountTypeOf = (p: UserAccountProfile): AccountType => {
  if (p.role === 'admin') return 'admin';
  if (p.role === 'content-manager') return 'content-manager';
  if (p.role === 'teacher') return 'teacher';
  if (p.role === 'organization') return 'organization';
  if (p.plan === 'smarty-max') return 'smarty-max';
  return 'user';
};

/** Plan-only label (kept for the Payments table / financials breakdown). */
const PLAN_LABEL: Record<PlanId, string> = {
  'smarty-max':   'SmartyLang Max',
  'teacher':      'Teacher',
  'organization': 'Organization',
};
const PLAN_BADGE: Record<PlanId, string> = {
  'smarty-max':   'bg-amber-50  text-amber-700  border-amber-200',
  'teacher':      'bg-emerald-50 text-emerald-700 border-emerald-200',
  'organization': 'bg-violet-50 text-violet-700 border-violet-200',
};

const ACTION_LABELS: Record<string, string> = {
  role_changed: 'Role Changed',
  plan_changed: 'Plan Changed',
  class_created: 'Class Created',
  user_suspended: 'User Suspended',
  user_unsuspended: 'User Unsuspended',
};

const fmtUSD = (n: number) => `$${n.toFixed(2)}`;

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('users');
  const [profiles, setProfiles] = useState<UserAccountProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);


  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setProfiles(await listAllProfiles()); } finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await getPlatformStats()); } finally { setStatsLoading(false); }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try { setAuditLog(await getAuditLog(100)); } finally { setAuditLoading(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try { setPayments(await listPayments(500)); } finally { setPaymentsLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === 'analytics') loadStats(); }, [tab, loadStats]);
  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab, loadAudit]);
  useEffect(() => { if (tab === 'financials') loadPayments(); }, [tab, loadPayments]);

  const organizations = useMemo(() => profiles.filter(p => p.role === 'organization'), [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? profiles.filter(p => (p.email ?? '').toLowerCase().includes(q) || (p.displayName ?? '').toLowerCase().includes(q)) : profiles;
    const order: Record<string, number> = { admin: 0, organization: 1, teacher: 2, student: 3 };
    return [...list].sort((a, b) => (order[a.role] - order[b.role]) || (a.createdAt - b.createdAt));
  }, [profiles, query]);

  const counts = useMemo(() => {
    const c: Record<AccountType | 'suspended', number> = {
      'user': 0, 'smarty-max': 0, 'teacher': 0, 'organization': 0, 'admin': 0, 'content-manager': 0, 'suspended': 0,
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
      'smarty-max':  { count: 0, revenue: 0, seats: 0 },
      'teacher':     { count: 0, revenue: 0, seats: 0 },
      'organization':{ count: 0, revenue: 0, seats: 0 },
    };
    completed.forEach(p => {
      const k = p.planId as PlanId;
      if (byPlan[k]) {
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
   * Firestore — User clears the plan + sets role=student, SmartyLang Max sets plan
   * but keeps the student role, Teacher/Organization swap the role accordingly.
   */
  const onAccountTypeChange = async (p: UserAccountProfile, next: AccountType) => {
    if (!p.uid || p.role === 'admin' || next === 'admin') return;
    if (next === accountTypeOf(p)) return;
    setSavingUid(p.uid);
    try {
      if (next === 'content-manager') {
        // Clear any plan first, then set content-manager role
        await setUserPlan(p.uid, null);
        await setUserRole(p.uid, 'content-manager');
        setProfiles(prev => prev.map(x => x.uid === p.uid ? {
          ...x, plan: undefined, role: 'content-manager', organizationId: undefined,
        } : x));
      } else {
        const planArg: PlanId | null =
          next === 'user' ? null
          : next === 'smarty-max'  ? 'smarty-max'
          : next === 'teacher'     ? 'teacher'
          : 'organization';
        await setUserPlan(p.uid, planArg);
        setProfiles(prev => prev.map(x => x.uid === p.uid ? {
          ...x,
          plan: planArg ?? undefined,
          role: next === 'teacher' ? 'teacher' : next === 'organization' ? 'organization' : 'student',
          organizationId: next === 'teacher' ? x.organizationId : undefined,
        } : x));
      }
      showToast(`${p.displayName || p.email} → ${TYPE_LABEL[next]}`);
    } catch (e: any) { showToast(e?.message || 'Failed.'); }
    finally { setSavingUid(null); }
  };

  const onOrgChange = async (p: UserAccountProfile, orgUid: string) => {
    if (!p.uid) return;
    setSavingUid(p.uid);
    try {
      await setTeacherOrganization(p.uid, orgUid || null);
      setProfiles(prev => prev.map(x => x.uid === p.uid ? { ...x, organizationId: orgUid || undefined } : x));
      showToast(orgUid ? `Assigned to organization.` : 'Removed from organization.');
    } catch (e: any) { showToast(e?.message || 'Failed.'); }
    finally { setSavingUid(null); }
  };

  const onSuspend = async (p: UserAccountProfile) => {
    if (!p.uid || p.role === 'admin') return;
    const newSuspended = !p.suspended;
    setSavingUid(p.uid);
    try {
      await suspendUser(p.uid, newSuspended);
      setProfiles(prev => prev.map(x => x.uid === p.uid ? { ...x, suspended: newSuspended } : x));
      showToast(`${p.displayName} ${newSuspended ? 'suspended' : 'unsuspended'}.`);
    } catch { showToast('Failed.'); }
    finally { setSavingUid(null); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'users',      label: 'Users',           icon: Users },
    { id: 'financials', label: 'Financials',      icon: DollarSign },
    { id: 'analytics',  label: 'Analytics',       icon: BarChart2 },
    { id: 'audit',      label: 'Audit Log',       icon: FileText },
    { id: 'content',    label: 'Content',         icon: LayoutGrid },
  ];

  return (
    <ScreenShell
      size="wide"
      title="Admin"
      subtitle="Users, billing, analytics, and content."
      actions={
        <button
          onClick={() => { loadUsers(); if (tab === 'analytics') loadStats(); if (tab === 'audit') loadAudit(); if (tab === 'financials') loadPayments(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      }
    >
      <div className="flex items-center justify-end mb-3 lg:hidden">
        <button
          onClick={() => { loadUsers(); if (tab === 'analytics') loadStats(); if (tab === 'audit') loadAudit(); if (tab === 'financials') loadPayments(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-[13px] transition-all shrink-0 ${tab === t.id ? 'bg-zinc-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

        {/* ── Users ── */}
        {tab === 'users' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
              {(['user', 'smarty-max', 'teacher', 'organization', 'content-manager', 'admin'] as AccountType[]).map(t => (
                <div key={t} className={`${seCard} p-3 flex items-center gap-2.5`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${TYPE_BADGE[t]}`}>{TYPE_ICON[t]}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold truncate">{TYPE_LABEL[t]}</div>
                    <div className="text-xl font-black text-zinc-900 leading-tight">{counts[t] ?? 0}</div>
                  </div>
                </div>
              ))}
              <div className={`${seCard} p-3 flex items-center gap-2.5`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-500 border-slate-200 shrink-0"><Ban className="w-4 h-4" /></div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Suspended</div>
                  <div className="text-xl font-black text-zinc-900 leading-tight">{counts.suspended ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-zinc-400" />
              </div>
            </div>

            <div className={`${seCard} overflow-hidden`}>
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">User</th>
                      <th className="text-left font-semibold px-4 py-3">Account Type</th>
                      <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Organization</th>
                      <th className="text-left font-semibold px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
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
                                <div className="font-semibold text-zinc-900 truncate">{p.displayName || '—'}</div>
                                <div className="text-xs text-slate-500 truncate">{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${TYPE_BADGE.admin}`}>
                                <Shield className="w-3.5 h-3.5" /> Admin
                              </span>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${TYPE_BADGE[type]}`}>
                                  {type === 'smarty-max' && <Crown className="w-3 h-3" />}
                                  {TYPE_LABEL[type]}
                                </span>
                                <select
                                  value={type}
                                  onChange={e => onAccountTypeChange(p, e.target.value as AccountType)}
                                  disabled={saving}
                                  className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none disabled:opacity-60"
                                  title="Change account type"
                                >
                                  <option value="user">User</option>
                                  <option value="smarty-max">SmartyLang Max</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="organization">Organization</option>
                                  <option value="content-manager">Content Manager</option>
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {p.role === 'teacher' ? (
                              <select value={p.organizationId ?? ''} onChange={e => onOrgChange(p, e.target.value)} disabled={saving || organizations.length === 0} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-zinc-900 focus:outline-none disabled:opacity-60 min-w-[160px]">
                                <option value="">— Unassigned —</option>
                                {organizations.map(o => <option key={o.uid} value={o.uid}>{o.displayName || o.email}</option>)}
                              </select>
                            ) : <span className="text-slate-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {!isAdmin && (
                              <button onClick={() => onSuspend(p)} disabled={saving} title={p.suspended ? 'Unsuspend' : 'Suspend'} className={`p-1.5 rounded-lg text-xs font-semibold ${p.suspended ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>
                                {p.suspended ? 'Unsuspend' : 'Suspend'}
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
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total Revenue</div>
                <div className="text-xl lg:text-3xl font-black text-emerald-700">{fmtUSD(financials.totalRevenueUSD)}</div>
                <div className="text-xs text-slate-500 mt-1">{financials.completed} completed payments</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Last 30 Days</div>
                <div className="text-xl lg:text-3xl font-black text-indigo-700">{fmtUSD(financials.mrr)}</div>
                <div className="text-xs text-slate-500 mt-1">Recent subscription revenue</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">SmartyLang Max</div>
                <div className="text-xl lg:text-3xl font-black text-amber-700">{financials.byPlan['smarty-max'].count}</div>
                <div className="text-xs text-slate-500 mt-1">{fmtUSD(financials.byPlan['smarty-max'].revenue)} revenue</div>
              </div>
              <div className={`${seCard} p-5`}>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Teachers + Orgs</div>
                <div className="text-xl lg:text-3xl font-black text-emerald-700">
                  {financials.byPlan['teacher'].count + financials.byPlan['organization'].count}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {fmtUSD(financials.byPlan['teacher'].revenue + financials.byPlan['organization'].revenue)} revenue
                </div>
              </div>
            </div>

            {/* Per-plan breakdown */}
            <div className={`${seCard} p-6 mb-6`}>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Revenue by Plan</h2>
              <div className="space-y-3">
                {(['smarty-max', 'teacher', 'organization'] as PlanId[]).map(planId => {
                  const data = financials.byPlan[planId];
                  const pct = financials.totalRevenueUSD > 0 ? (data.revenue / financials.totalRevenueUSD) * 100 : 0;
                  return (
                    <div key={planId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-zinc-900">{PLAN_LABEL[planId]}</span>
                        <span className="text-slate-500 font-mono">
                          {fmtUSD(data.revenue)} · {data.count} payments · {data.seats} seats
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          planId === 'smarty-max' ? 'bg-amber-500' :
                          planId === 'teacher' ? 'bg-emerald-500' : 'bg-violet-500'
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
                <h2 className="font-bold text-zinc-900">All Payments</h2>
                <span className="text-xs text-slate-400 ml-auto">{payments.length} records</span>
              </div>
              {paymentsLoading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : payments.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-500">No payments yet</p>
                  <p className="text-xs mt-1">Payments will appear here automatically after users subscribe.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Customer</th>
                      <th className="text-left font-semibold px-4 py-3">Plan</th>
                      <th className="text-right font-semibold px-4 py-3">Seats</th>
                      <th className="text-right font-semibold px-4 py-3">Amount</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-left font-semibold px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900 truncate max-w-[200px]">{p.displayName || '—'}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${PLAN_BADGE[p.planId]}`}>
                            {PLAN_LABEL[p.planId]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-900">{p.seats}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-zinc-900">{fmtUSD(p.amountUSD)}</div>
                          <div className="text-[10px] text-slate-400">{p.amountUZS.toLocaleString()} so'm</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            p.status === 'refunded' ? 'bg-slate-100 text-slate-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(p.paidAt).toLocaleString()}</td>
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
                  { label: 'Total Accounts', value: stats.totalUsers, color: 'text-zinc-900' },
                  { label: 'Users',           value: stats.students,    color: 'text-slate-600' },
                  { label: 'Teachers',        value: stats.teachers,    color: 'text-emerald-600' },
                  { label: 'Organizations',   value: stats.orgs,        color: 'text-violet-600' },
                  { label: 'Total Classes',   value: stats.totalClasses,    color: 'text-indigo-600' },
                  { label: 'Assignments',     value: stats.totalAssignments, color: 'text-orange-600' },
                  { label: 'Admins',          value: stats.admins,      color: 'text-rose-600' },
                  { label: 'Suspended',       value: stats.suspended,   color: 'text-slate-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`${seCard} p-5 text-center`}>
                    <div className={`text-3xl font-black ${color}`}>{value}</div>
                    <div className="text-sm text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className={`${seCard} p-6`}>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Role Distribution</h2>
                <div className="space-y-3">
                  {[
                    { role: 'Users',         count: stats.students, total: stats.totalUsers, color: 'bg-slate-500' },
                    { role: 'Teachers',      count: stats.teachers, total: stats.totalUsers, color: 'bg-emerald-500' },
                    { role: 'Organizations', count: stats.orgs,     total: stats.totalUsers, color: 'bg-violet-500' },
                  ].map(({ role, count, total, color }) => (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-zinc-900">{role}</span><span className="text-slate-500">{count} ({total > 0 ? Math.round(count / total * 100) : 0}%)</span></div>
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
          auditLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : (
            <div className={`${seCard} overflow-hidden`}>
              {auditLog.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p>No audit entries yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Action</th>
                      <th className="text-left px-4 py-3 font-semibold">Actor</th>
                      <th className="text-left px-4 py-3 font-semibold">Target / Details</th>
                      <th className="text-left px-4 py-3 font-semibold">Time</th>
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
                        <td className="px-4 py-3 text-slate-700 text-xs font-mono truncate max-w-[140px]">{e.actorEmail}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{e.targetUid ? `→ ${e.targetUid.slice(0, 8)}…` : ''} {Object.entries(e.details ?? {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )
        )}

        {/* ── Content Management ── */}
        {tab === 'content' && <ContentManager embedded />}

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </ScreenShell>
  );
}
