import { DialogSurface } from '../components/DialogSurface';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, BookOpen, Brain, GraduationCap, CheckCircle2, Loader2, ChevronRight, ChevronLeft, X, Headphones, Mic, PenLine, Gamepad2 } from 'lucide-react';
import {
  auth, getStudentClasses, getStudentAssignments,
  getStudentSubmissions, startAssignment, ClassRoom, Assignment, AssignmentProgress,
} from '../firebase';
import { ScreenShell } from '../components/ScreenShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { useUiLang } from '../contexts/UiLangContext';
import { Confetti, Mascot } from './Classes/liveGameKit';
import { ChunkyButton } from './Bites/lesson/chunky';
import { playGameSfx } from '../lib/gameAudio';
import { HOMEWORK_REFRESH, HOMEWORK_STARTED_KEY, needsMaxForHomework } from '../lib/classHomework';

const TYPE_ICON: Record<string, React.ElementType> = {
  reading:    BookOpen,
  'comp-reading': BookOpen,
  listening:  Headphones,
  speaking:   Mic,
  writing:    PenLine,
  exercise:   Brain,
  lesson:     GraduationCap,
  vocabulary: GraduationCap,
};

const TYPE_COLOR: Record<string, string> = {
  reading: 'bg-blue-50 text-blue-700 border-blue-200',
  exercise: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900',
  lesson: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900',
  vocabulary: 'bg-amber-50 text-amber-700 border-amber-200',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
};

const DAY = 86_400_000;

/** Colour-coded due date: overdue = rose, today = orange, within 2 days = amber, later = emerald. */
function dueTone(due: number, now = Date.now()) {
  const days = Math.ceil((due - now) / DAY);
  if (due < now) return { kind: 'overdue' as const, days: 0, cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' };
  if (days <= 1) return { kind: 'today' as const, days, cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' };
  if (days <= 3) return { kind: 'soon' as const, days, cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' };
  return { kind: 'later' as const, days, cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' };
}

export function StudentClasses({
  onJoinGame,
  onStartAssignment,
  hasMax,
  onOpenSettings,
}: {
  onJoinGame: (code: string) => void;
  onStartAssignment: (assignment: Assignment) => void;
  hasMax: boolean;
  /** Joining a class by code lives in Settings → Friends & classes. */
  onOpenSettings?: () => void;
}) {
  const { t: tr, uiLang } = useUiLang();
  const uid = auth?.currentUser?.uid ?? '';
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentProgress>>({});
  const [loading, setLoading] = useState(true);
  const loadVersion = useRef(0);
  const [loadError, setLoadError] = useState(false);
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(false);

  const [openClass, setOpenClass] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [intro, setIntro] = useState<Assignment | null>(null);
  const [celebrate, setCelebrate] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const cls = await getStudentClasses(uid);
      const asgns = cls.length ? await getStudentAssignments(cls.map(c => c.id!)) : [];
      const subs = asgns.length ? await getStudentSubmissions(asgns.map(a => a.id!), uid) : {};
      if (version !== loadVersion.current) return;
      setClasses(cls); setAssignments(asgns); setSubmissions(subs); setLoadError(false);
      try {
        const key = `${HOMEWORK_STARTED_KEY}:${uid}`;
        const started = sessionStorage.getItem(key);
        const done = started ? asgns.find(a => a.id === started && subs[a.id!]?.completedAt) : undefined;
        if (done) { sessionStorage.removeItem(key); setCelebrate(done); playGameSfx('winner'); }
      } catch { /* storage unavailable */ }
    } catch {
      if (version === loadVersion.current) setLoadError(true);
    } finally { if (version === loadVersion.current) setLoading(false); }
  }, [uid]);

  useEffect(() => {
    const refresh = () => { if (!document.hidden) void load(); };
    void load();
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    window.addEventListener(HOMEWORK_REFRESH, refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      loadVersion.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(HOMEWORK_REFRESH, refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const handleStart = async (assignment: Assignment) => {
    if (!assignment.id || starting || (!hasMax && needsMaxForHomework(assignment.type))) return;
    setStarting(true); setStartError(false);
    try {
      await startAssignment(assignment.id);
      try { sessionStorage.setItem(`${HOMEWORK_STARTED_KEY}:${uid}`, assignment.id); } catch { /* storage unavailable */ }
      setIntro(null);
      playGameSfx('go');
      onStartAssignment(assignment);
    } catch { setStartError(true); }
    finally { setStarting(false); }
  };

  const pending = assignments.filter(a => !submissions[a.id!]?.completedAt);
  const completed = assignments.filter(a => !!submissions[a.id!]?.completedAt);
  const byDue = (a: Assignment, b: Assignment) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity) || b.createdAt - a.createdAt;
  const todo = [...pending].sort(byDue);
  const detail = classes.find(c => c.id === openClass);

  const typeLabels = { exercise: 'class.challenge', lesson: 'hw.type.lesson', reading: 'home.preview.reading',
    'comp-reading': 'core.management.comp_reading_69cffb', listening: 'core.management.comp_listening_9bfe80',
    writing: 'nav.writing', speaking: 'home.preview.speaking' } as const;
  const typeLabel = (a: Assignment) => a.type === 'worksheet' ? a.type : tr(typeLabels[a.type]);
  const dueChip = (a: Assignment) => {
    if (!a.dueDate) return null;
    const due = dueTone(a.dueDate);
    const text = due.kind === 'overdue' ? tr('site.studentclasses.overdue_53d585') : due.kind === 'today' ? tr('game.asg.dueToday') : due.kind === 'soon' ? tr('game.asg.dueIn', { n: due.days })
      : `${tr('site.studentclasses.due_c50447')}${new Date(a.dueDate).toLocaleDateString(uiLang)}`;
    return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ${due.cls}`}>{text}</span>;
  };
  const homeworkRow = (a: Assignment) => {
    const Icon = TYPE_ICON[a.type] ?? BookOpen;
    const underway = !!submissions[a.id!]?.startedAt;
    const locked = !hasMax && needsMaxForHomework(a.type);
    return <li key={a.id}>
      <button type="button" onClick={() => { setIntro(a); setStartError(false); playGameSfx('join'); }}
        className="flex w-full min-w-0 items-center gap-3 border-b border-slate-200 px-1 py-3.5 text-left hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TYPE_COLOR[a.type] ?? TYPE_COLOR.custom}`}><Icon className="h-5 w-5" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block break-words font-serif font-extrabold leading-snug text-zinc-900 dark:text-zinc-50">{a.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>{typeLabel(a)}</span>{dueChip(a)}
            {underway && <span>{tr('homework.inProgress')}</span>}
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold">{locked ? 'Max' : tr(underway ? 'homework.resume' : 'homework.start')}</span>
      </button>
    </li>;
  };
  const doneList = (items: Assignment[]) => items.length > 0 && <details className="group">
    <summary className="cursor-pointer list-none font-serif text-sm font-extrabold text-slate-500 dark:text-zinc-400">{tr('sc.doneList', { n: items.length })}</summary>
    <ul className="mt-3 space-y-2">
      {items.map(a => <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-zinc-800">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-zinc-900 dark:text-zinc-100">{a.title}
          <span className="ml-2 text-xs font-normal text-slate-400">{new Date(submissions[a.id!]!.completedAt!).toLocaleDateString(uiLang)}</span></span>
        {submissions[a.id!]?.score !== undefined && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{submissions[a.id!].score}%</span>}
      </li>)}
    </ul>
  </details>;

  return (
    <ScreenShell title={detail ? detail.name : tr("nav.myClasses")}>
        {detail ? (
          <button type="button" onClick={() => setOpenClass(null)} className="mb-5 inline-flex items-center gap-1 font-serif text-sm font-extrabold text-zinc-700 dark:text-zinc-200">
            <ChevronLeft className="h-4 w-4" aria-hidden />{tr('nav.myClasses')}
          </button>
        ) : (
          <div className="mb-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowGame(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 font-serif text-sm font-extrabold text-zinc-800 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
              <Gamepad2 className="h-4 w-4" aria-hidden />{tr('sc.joinGame')}
            </button>
          </div>
        )}

        {/* Join game: small sheet */}
        {showGame && (
          <DialogSurface label={tr('class.live.join')} onClose={() => setShowGame(false)} className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
            <form onSubmit={event => { event.preventDefault(); if (gameCode.length === 6) onJoinGame(gameCode); }}
              className="w-full max-w-sm rounded-t-3xl border-2 border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-lg font-extrabold">{tr('class.live.join')}</h2>
                <button type="button" aria-label={tr('a11y.close')} onClick={() => setShowGame(false)} className="rounded p-1 text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100"><X className="h-5 w-5" /></button>
              </div>
              <input autoFocus aria-label={tr('class.live.code')} placeholder={tr('class.live.code')} autoComplete="off" autoCapitalize="characters" maxLength={6} value={gameCode}
                onChange={event => setGameCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))}
                className="mb-4 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center font-serif text-2xl font-extrabold tracking-[0.3em] text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" />
              <ChunkyButton type="submit" className="w-full" disabled={gameCode.length !== 6}>{tr('class.live.joinButton')}</ChunkyButton>
            </form>
          </DialogSurface>
        )}

        {loadError && <p role="alert" className="mb-4 text-sm text-rose-700 dark:text-rose-300">{tr('management.loadError')} <button type="button" className="underline" onClick={() => void load()}>{tr('action.tryAgain')}</button></p>}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : classes.length === 0 ? (
          <EmptyState sticker="social.study-group" title={tr('empty.classes.title')} body={tr('empty.classes.body')} className="py-12"
            action={onOpenSettings ? { label: tr('fr.joinInSettings'), onClick: onOpenSettings } : undefined} />
        ) : detail ? (
          <div className="space-y-8">
            <section aria-labelledby="class-hw">
              <h2 id="class-hw" className="mb-3 font-serif text-lg font-extrabold">{tr('sc.homework')}</h2>
              {(() => {
                const mine = assignments.filter(a => a.classId === detail.id);
                const open = mine.filter(a => !submissions[a.id!]?.completedAt).sort(byDue);
                const done = mine.filter(a => !!submissions[a.id!]?.completedAt);
                return <div className="space-y-4">
                  {open.length ? <ul className="space-y-3">{open.map(homeworkRow)}</ul> : <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{mine.length ? tr('game.asg.allDone') : tr('sc.noHomework')}</p>}
                  {doneList(done)}
                </div>;
              })()}
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            {assignments.length > 0 && (
              <section aria-labelledby="todo-h" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="todo-h" className="font-serif text-lg font-extrabold">{tr('sc.todo')}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    role="progressbar" aria-valuemin={0} aria-valuemax={assignments.length} aria-valuenow={completed.length}>{tr('sc.doneCount', { done: completed.length, total: assignments.length })}</span>
                </div>
                {todo.length ? <ul>{todo.map(homeworkRow)}</ul>
                  : <p className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-zinc-300"><Mascot id="reward.champion" size={56} className="!mx-0" />{tr('game.asg.allDone')}</p>}
                {doneList([...completed])}
              </section>
            )}
            {/* One calm card per class */}
            <section aria-labelledby="my-classes" className="space-y-3">
              <h2 id="my-classes" className={assignments.length ? 'text-base font-bold' : 'sr-only'}>{tr('homework.classList')}</h2>
              {classes.map(cls => {
                const remaining = pending.filter(a => a.classId === cls.id).length;
                return <button key={cls.id} type="button" onClick={() => setOpenClass(cls.id!)}
                  className="flex w-full min-w-0 items-center gap-3.5 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[2px] active:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950"><Users className="h-6 w-6 text-indigo-600 dark:text-indigo-300" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-serif text-base font-extrabold text-zinc-900 dark:text-zinc-50">{cls.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {remaining ? tr('homework.pendingCount', { n: remaining }) : tr('sc.noHomework')}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                </button>;
              })}
            </section>

          </div>
        )}
        {intro && (
          <DialogSurface onClose={() => { if (!starting) setIntro(null); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]">
            <div className="w-full max-w-sm overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-6 text-center shadow-[0_6px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_6px_0_0_#27272a]">
              <h2 className="mt-1 break-words font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{intro.title}</h2>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${TYPE_COLOR[intro.type] ?? TYPE_COLOR.custom}`}>
                  {(() => { const Icon = TYPE_ICON[intro.type] ?? BookOpen; return <Icon className="h-3 w-3" />; })()}{typeLabel(intro)}
                </span>
                {intro.dueDate && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${dueTone(intro.dueDate).cls}`}>
                  {new Date(intro.dueDate).toLocaleDateString(uiLang)}</span>}
              </div>
              {intro.description && <p className="mt-3 break-words text-sm text-slate-600 dark:text-zinc-300">{intro.description}</p>}
              {startError && <p role="alert" className="mt-3 text-sm text-rose-600">{tr('management.loadError')}</p>}
              {!hasMax && needsMaxForHomework(intro.type)
                ? <p className="mt-4 font-bold">{tr('homework.max')}</p>
                : <button type="button" disabled={starting} onClick={() => void handleStart(intro)}
                className="mt-5 w-full rounded-2xl bg-zinc-900 py-3 font-serif text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#000] active:translate-y-[4px] active:shadow-none dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_4px_0_0_#a1a1aa] dark-keep">
                {tr(starting ? 'teacher.loading' : submissions[intro.id!]?.startedAt ? 'homework.resume' : 'homework.start')}
              </button>}
              <button type="button" disabled={starting} onClick={() => setIntro(null)} className="mt-3 font-serif text-sm font-extrabold underline">{tr('game.asg.later')}</button>
            </div>
          </DialogSurface>
        )}
        {celebrate && (
          <DialogSurface onClose={() => setCelebrate(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]">
            <Confetti />
            <div className="relative z-50 w-full max-w-sm overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-6 text-center shadow-[0_6px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_6px_0_0_#27272a]" role="status">
              <Mascot id="achieve.trophy-lift" size={120} />
              <h2 className="mt-2 font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{tr('game.asg.doneTitle')}</h2>
              <p className="mt-1 break-words text-sm text-slate-600 dark:text-zinc-300">{tr('game.asg.doneBody', { title: celebrate.title })}</p>
              <p className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 font-serif text-sm font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                {tr('game.asg.progress', { done: completed.length, total: assignments.length })}
              </p>
              <button type="button" onClick={() => setCelebrate(null)} className="mt-5 w-full rounded-2xl bg-emerald-600 py-3 font-serif text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#065f46] active:translate-y-[4px] active:shadow-none dark-keep">{tr('game.asg.next')}</button>
            </div>
          </DialogSurface>
        )}
      </ScreenShell>
  );
}
