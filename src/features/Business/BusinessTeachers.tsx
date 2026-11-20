import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { addOrgTeacher, listOrgTeachers, removeOrgTeacher, type OrgTeacher, type OrgTeacherInvite, type UserAccountProfile } from '../../firebase';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { isValidTeacherEmail, summarizeTeachers } from './teachers';

/** Business accounts: add as many free teacher accounts as needed, see their classes, remove them. */
export function BusinessTeachers({ profile }: { profile: UserAccountProfile }) {
  const { t } = useUiLang();
  const [teachers, setTeachers] = useState<OrgTeacher[] | null>(null);
  const [pending, setPending] = useState<OrgTeacherInvite[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await listOrgTeachers(profile.role === 'admin' ? undefined : profile.uid);
      setTeachers(res.teachers); setPending(res.pending);
    } catch (e) { setError(e instanceof Error ? e.message : t('bizTeachers.error')); }
  }, [profile.uid, profile.role, t]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    const value = email.trim();
    if (!isValidTeacherEmail(value)) { setError(t('bizTeachers.invalidEmail')); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await addOrgTeacher(value);
      setEmail(''); setNotice(t(res.status === 'added' ? 'bizTeachers.added' : 'bizTeachers.invited')); await load();
    } catch (e) { setError(e instanceof Error ? e.message : t('bizTeachers.error')); } finally { setBusy(false); }
  };
  const remove = async (target: { uid?: string; inviteId?: string }, name: string) => {
    if (target.uid && !window.confirm(t('bizTeachers.removeConfirm', { name }))) return;
    setBusy(true); setError(''); setNotice('');
    try { await removeOrgTeacher(target); await load(); } catch (e) { setError(e instanceof Error ? e.message : t('bizTeachers.error')); } finally { setBusy(false); }
  };
  const totals = summarizeTeachers(teachers || []);

  return (
    <section className="mb-5 min-w-0 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
      <div>
        <h2 className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{t('bizTeachers.title')}</h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('bizTeachers.summary', { teachers: totals.teachers, classes: totals.classes, students: totals.students })}</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('bizTeachers.email')} aria-label={t('bizTeachers.email')}
          className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100" />
        <ChunkyButton type="submit" disabled={busy || !email.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('bizTeachers.add')}</ChunkyButton>
      </form>
      <p className="text-xs font-semibold text-slate-400">{t('bizTeachers.hint')}</p>
      {notice && <p role="status" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      {!teachers && !error && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      {teachers && teachers.length === 0 && pending.length === 0 && <p className="text-sm font-semibold text-slate-400">{t('bizTeachers.none')}</p>}
      {teachers && teachers.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800">{teachers.map((tc) => (
          <li key={tc.uid} className="py-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{tc.displayName || tc.email}</div>
                <div className="truncate text-xs font-semibold text-slate-500">{tc.email}</div>
              </div>
              <button type="button" onClick={() => setOpen(open === tc.uid ? null : tc.uid)} aria-expanded={open === tc.uid} className="shrink-0 text-xs font-bold text-slate-500 hover:text-zinc-900 dark:text-zinc-300">
                {t('bizTeachers.counts', { classes: tc.classCount, students: tc.studentCount })}
              </button>
              <button type="button" disabled={busy} onClick={() => void remove({ uid: tc.uid }, tc.displayName || tc.email)} className="shrink-0 text-sm font-semibold text-zinc-600 hover:text-rose-700 dark:text-zinc-300">{t('bizTeachers.remove')}</button>
            </div>
            {open === tc.uid && (tc.classes.length === 0
              ? <p className="mt-1 pl-1 text-xs font-semibold text-slate-400">{t('bizTeachers.noClasses')}</p>
              : <ul className="mt-1 space-y-0.5 pl-1">{tc.classes.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300"><span className="truncate">{c.name}</span><span className="shrink-0">{t('bizTeachers.studentCount', { n: c.studentCount })}</span></li>
                ))}</ul>)}
          </li>
        ))}</ul>
      )}
      {pending.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800">{pending.map((p) => (
          <li key={p.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{p.email}</span>
            <span className="shrink-0 text-xs font-bold text-slate-400">{t('seats.pending')}</span>
            <button type="button" disabled={busy} onClick={() => void remove({ inviteId: p.id }, p.email)} className="shrink-0 text-sm font-semibold text-zinc-600 hover:text-rose-700 dark:text-zinc-300">{t('seats.revoke')}</button>
          </li>
        ))}</ul>
      )}
    </section>
  );
}
