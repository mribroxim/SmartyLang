import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { getStudentDetail, type StudentDetailPage } from '../../firebase';
import { buildTimeline, missedWords, summarize } from '../../lib/activity/model';
import type { ClassInsights } from '../../lib/activity/recommend';
import { ActivityTimeline, ActivityStat } from './ActivityTimeline';
import { RecommendedWords } from './RecommendedWords';

type Tab = 'overview' | 'activity' | 'words' | 'mistakes';
const TABS: Tab[] = ['overview', 'activity', 'words', 'mistakes'];

/** One student's in-depth page for their teacher: Overview, Activity, Words, Mistakes. */
export function StudentDetail({ classId, student, onBack }: { classId: string; student: { uid: string; name: string }; onBack: () => void }) {
  const { t, uiLang } = useUiLang();
  const [tab, setTab] = useState<Tab>('overview');
  const [first, setFirst] = useState<StudentDetailPage | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rev, setRev] = useState(0);
  const name = student.name || t('site.identity.student');

  useEffect(() => {
    const ctl = new AbortController();
    setError(false); setFirst(null); setRows([]);
    getStudentDetail(student.uid, undefined, ctl.signal)
      .then((d) => { if (ctl.signal.aborted) return; setFirst(d); setRows(d.completions); setHasMore(d.hasMore); })
      .catch(() => { if (!ctl.signal.aborted) setError(true); });
    return () => ctl.abort();
  }, [student.uid, rev]);

  const loadMore = useCallback(async () => {
    const last = rows[rows.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const d = await getStudentDetail(student.uid, last.timestamp);
      setRows((prev) => [...prev, ...d.completions]);
      setHasMore(d.hasMore);
    } catch { setError(true); } finally { setLoadingMore(false); }
  }, [rows, student.uid]);

  const items = useMemo(() => buildTimeline(rows as never[], (first?.activity ?? []) as never[]), [rows, first]);
  const month = useMemo(() => summarize(items, Date.now() - 30 * 86_400_000), [items]);
  const missed = useMemo(() => missedWords(items, first?.problemWords), [items, first]);
  const vocab = useMemo(() => [...(first?.vocab ?? [])].sort((a, b) => {
    const now = Date.now();
    const da = a.nextReviewDate !== null && a.nextReviewDate <= now ? 0 : 1, db = b.nextReviewDate !== null && b.nextReviewDate <= now ? 0 : 1;
    return da - db || a.word.localeCompare(b.word);
  }), [first]);
  const dueCount = vocab.filter((v) => v.nextReviewDate !== null && v.nextReviewDate <= Date.now()).length;
  const insights = useMemo<ClassInsights | null>(() => first ? {
    students: [{ uid: student.uid, name }],
    completions: items.filter((i) => i.type !== 'vocabulary_add').map((i) => ({ uid: student.uid, timestamp: i.ts, mistakes: i.mistakes, correct: i.correct })),
    vocab: first.vocab?.map((v) => ({ uid: student.uid, word: v.word, nextReviewDate: v.nextReviewDate, lapses: v.lapses })) ?? [],
    problem: (first.problemWords ?? []).map((p) => ({ uid: student.uid, ...p })),
  } : null, [first, items, student.uid, name]);
  const lastActive = items[0]?.ts;

  const card = 'rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]';
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label={t('teacher.student.back')} className="-ml-2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"><ArrowLeft className="h-6 w-6" /></button>
        <div className="min-w-0">
          <h2 className="break-words font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{name}</h2>
          <p className="text-xs font-semibold text-slate-400">{first && (lastActive ? t('teacher.student.lastActive', { when: new Date(lastActive).toLocaleDateString(uiLang) }) : t('teacher.student.neverActive'))}</p>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {TABS.map((id) => {
          const on = id === tab;
          return <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setTab(id)}
            className={`shrink-0 rounded-2xl border-2 px-3 py-1.5 font-serif text-xs font-extrabold uppercase tracking-wide ${on
              ? 'border-zinc-900 bg-zinc-900 text-white dark-keep dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
              : 'border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}>
            {t(`teacher.student.${id}` as UiStringKey)}
          </button>;
        })}
      </div>

      {error && !first ? <div role="alert" className={card}><p className="font-serif font-extrabold">{t('act.error')}</p><button type="button" onClick={() => setRev((v) => v + 1)} className="mt-1 text-sm font-bold underline">{t('action.tryAgain')}</button></div>
        : !first ? <p role="status" className="py-8 text-center text-sm font-semibold text-slate-400">{t('act.loading')}</p>
        : <>
          {tab === 'overview' && (
            <div className="space-y-4">
              <div>
                <div className="mb-2 px-1 font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('act.last30')}</div>
                <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
                  <ActivityStat label={t('act.stat.sessions')} value={String(month.sessions)} />
                  <ActivityStat label={t('act.stat.days')} value={String(month.activeDays)} />
                  <ActivityStat label={t('act.stat.xp')} value={String(month.xp)} />
                  <ActivityStat label={t('act.stat.minutes')} value={String(month.minutes)} />
                  <ActivityStat label={t('act.stat.accuracy')} value={month.avgAccuracy === null ? '-' : `${month.avgAccuracy}%`} />
                  <ActivityStat label={t('act.stat.mistakes')} value={String(month.mistakes)} />
                </div>
                <p className="mt-2 px-1 text-xs font-semibold text-slate-400">{t('teacher.student.savedWords', { n: vocab.length })} · {t('teacher.student.dueWords', { n: dueCount })}</p>
              </div>
              <RecommendedWords classId={classId} insights={insights} studentUid={student.uid} name={name} />
            </div>
          )}
          {tab === 'activity' && <ActivityTimeline items={items} hasMore={hasMore} onLoadMore={() => void loadMore()} loadingMore={loadingMore} />}
          {tab === 'words' && (vocab.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-slate-400">{t('teacher.student.noWords')}</p> : (
            <ul className="space-y-2">{vocab.slice(0, 200).map((v) => {
              const isDue = v.nextReviewDate !== null && v.nextReviewDate <= Date.now();
              return <li key={v.word} className={`${card} flex items-center gap-3 !p-3`}>
                <div className="min-w-0 flex-1">
                  <div className="break-words font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{v.word}</div>
                  {v.definition && <div className="break-words text-xs font-semibold text-slate-400">{v.definition}</div>}
                </div>
                <span className={`shrink-0 rounded-lg border-2 px-2 py-0.5 text-xs font-bold ${isDue ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'border-slate-200 text-slate-500 dark:border-zinc-700'}`}>{isDue ? t('teacher.student.due') : t('teacher.student.fresh')}</span>
              </li>;
            })}</ul>
          ))}
          {tab === 'mistakes' && (missed.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-slate-400">{t('teacher.student.noMistakes')}</p> : (
            <ul className="space-y-2">{missed.slice(0, 200).map((m) => (
              <li key={m.word} className={`${card} flex items-center gap-3 !p-3`}>
                <span className="min-w-0 flex-1 break-words font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{m.word}</span>
                <span className="shrink-0 rounded-lg border-2 border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{t('teacher.student.missedTimes', { n: m.count })}</span>
              </li>
            ))}</ul>
          ))}
        </>}
    </div>
  );
}
