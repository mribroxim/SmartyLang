import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { auth, createAssignment, getClassInsights } from '../../firebase';
import { useLevelTexts } from '../../data/levelTexts';
import { recommendWords, type ClassInsights, type RecKind, type RecReason } from '../../lib/activity/recommend';
import type { Level } from '../../lib/reading-logic';
import { ChunkyButton } from '../Bites/lesson/chunky';

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const MAX_WORDS = 20;
const TONE: Record<RecKind, string> = {
  missed: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
  due: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  new: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
};

/** Recommended words with reasons and a one-tap assignment. Works for a whole class or a single student. */
export function RecommendedWords({ classId, insights, loading, error, retry, studentUid, name }: {
  classId: string;
  insights: ClassInsights | null;
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  studentUid?: string;
  name?: string;
}) {
  const { t } = useUiLang();
  const levelTexts = useLevelTexts();
  const { dictCode } = useContentLang();
  const [level, setLevel] = useState<Level>('Beginner');
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [failure, setFailure] = useState('');

  const levelWords = useMemo(() => (levelTexts[level] ?? []).flatMap((p: any) => (p.vocabulary ?? []).map((v: any) => String(v.word))), [levelTexts, level]);
  const recs = useMemo(() => insights ? recommendWords(insights, { levelWords, studentUid, limit: MAX_WORDS }) : [], [insights, levelWords, studentUid]);
  // Until the teacher chooses, the top ten are selected.
  const selected = picked ?? new Set(recs.slice(0, 10).map((r) => r.word));
  useEffect(() => { setPicked(null); }, [recs.length, level, studentUid]);

  const toggle = (word: string) => {
    const next = new Set(selected);
    if (next.has(word)) next.delete(word); else if (next.size < MAX_WORDS) next.add(word);
    setPicked(next); setDone(0);
  };
  const reason = (r: RecReason) => {
    const single = r.total === 1;
    if (r.kind === 'missed') return single ? t('rec.reason.missedOne', { n: r.times ?? 1 }) : t('rec.reason.missed', { n: r.students, total: r.total });
    if (r.kind === 'due') return single ? t('rec.reason.dueOne') : t('rec.reason.due', { n: r.students, total: r.total });
    return single ? t('rec.reason.newOne') : t('rec.reason.new', { n: r.students, total: r.total });
  };
  const create = async () => {
    const teacherUid = auth?.currentUser?.uid;
    if (!teacherUid || selected.size < 2) { setFailure(t('rec.need2')); return; }
    setBusy(true); setFailure(''); setDone(0);
    try {
      await createAssignment({
        classId, teacherUid, title: t('rec.assignTitle'), type: 'exercise', exerciseType: 'flashcards',
        exerciseWords: [...selected].slice(0, MAX_WORDS), exerciseLang: dictCode, createdAt: Date.now(),
      });
      setDone(selected.size);
    } catch (e) { setFailure(e instanceof Error ? e.message : t('management.loadError')); }
    finally { setBusy(false); }
  };

  return (
    <section className="min-w-0 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
      <div>
        <h3 className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{name ? t('teacher.student.recommended', { name }) : t('rec.title')}</h3>
        {!name && <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('rec.subtitle')}</p>}
      </div>
      <label className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {t('rec.level')}
        <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="rounded-xl border-2 border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold normal-case tracking-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50">
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      {error ? <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('rec.loadError')} {retry && <button type="button" onClick={retry} className="underline">{t('action.tryAgain')}</button>}</p>
        : loading || !insights ? <p role="status" className="text-sm font-semibold text-slate-400">{t('act.loading')}</p>
        : recs.length === 0 ? <p className="text-sm font-semibold text-slate-400">{t('rec.empty')}</p>
        : <>
          <ul className="space-y-2">
            {recs.map((r) => {
              const on = selected.has(r.word);
              return <li key={r.word}>
                <label className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border-2 p-2.5 ${on ? 'border-zinc-900 dark:border-zinc-100' : 'border-slate-200 dark:border-zinc-700'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(r.word)} className="mt-1 h-4 w-4 shrink-0 accent-zinc-900" />
                  <span className="min-w-0 flex-1">
                    <span className="break-words font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{r.word}</span>
                    <span className="mt-1 flex flex-wrap gap-1">{r.reasons.map((x, i) => <span key={i} className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${TONE[x.kind]}`}>{reason(x)}</span>)}</span>
                  </span>
                </label>
              </li>;
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <ChunkyButton onClick={() => void create()} disabled={busy || selected.size < 2}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('rec.assign')}
            </ChunkyButton>
            <span className="text-sm font-bold text-slate-500">{t('rec.selected', { n: selected.size })}{selected.size >= MAX_WORDS ? ` · ${t('rec.max')}` : ''}</span>
          </div>
          {done > 0 && <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />{t('rec.assigned', { n: done })}</p>}
          {failure && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{failure}</p>}
        </>}
    </section>
  );
}

/** Class-level panel: loads what students did, then recommends. */
export function ClassRecommendations({ classId }: { classId: string }) {
  const [insights, setInsights] = useState<ClassInsights | null>(null);
  const [error, setError] = useState(false);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    setError(false);
    getClassInsights(classId, ctl.signal)
      .then((d) => { if (!ctl.signal.aborted) setInsights(d); })
      .catch(() => { if (!ctl.signal.aborted) setError(true); });
    return () => ctl.abort();
  }, [classId, rev]);
  return <div className="mt-4"><RecommendedWords classId={classId} insights={insights} error={error} retry={() => setRev((v) => v + 1)} /></div>;
}
