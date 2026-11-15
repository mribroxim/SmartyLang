import { PILOT_COPY as PC } from '../../lib/unitOnePilot/copy';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Mic, RotateCcw, Volume2 } from 'lucide-react';
import { Sticker } from '../../components/stickers/Sticker';
import { ChunkyButton, ChunkyProgress, Tile } from '../Bites/lesson/chunky';
import { SpeakPanel } from '../Bites/lesson/SpeakPanel';
import { speakText } from '../../lib/speech';
import { PILOT_SESSIONS, sessionTasks, type PilotSession } from '../../lib/unitOnePilot/content';
import { checkTask } from '../../lib/unitOnePilot/model';
import { completePilot, usePilotProgress } from '../../lib/unitOnePilot/progress';
import { readScopedJSON, removeScoped, writeScopedJSON } from '../../lib/userStorage';

const DRAFT = 'beginner_unit_one_pilot_draft_v1';
const inputClass = 'w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-lg font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50';
function Listen({ text, slow = false }: { text: string; slow?: boolean }) {
  return <button type="button" onClick={() => speakText(text, slow ? 0.7 : 1, 'en-US')} aria-label={slow ? PC.listen_slowly_91307 : PC.listen_c518f} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold text-zinc-900 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"><Volume2 className="h-5 w-5" />{slow ? PC.slowly_ce652 : PC.listen_c518f}</button>;
}

export function UnitOnePilotCard({ onOpen, onOriginal }: { onOpen: () => void; onOriginal?: () => void }) {
  const progress = usePilotProgress();
  const done = Object.keys(progress).length;
  return <section className="mt-8 rounded-3xl border-2 border-zinc-900 bg-white p-5 text-zinc-900 shadow-[0_5px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-50">
    <div className="flex items-center gap-3"><div className="flex-1"><p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{PC.beginner_unit_1_new_e3750}</p><h2 className="mt-1 font-serif text-2xl font-extrabold">{PC.meet_someone_new_b287c}</h2></div><Sticker id="flow.welcome-aboard" size={90} mode="once" /></div>
    <p className="mt-3 leading-relaxed text-slate-600 dark:text-zinc-300">{PC.ten_short_sessions_by_2b631}</p>
    <div className="my-5"><div className="mb-2 flex justify-between text-sm font-bold"><span>{done} {PC._10_sessions_66a7a}</span><span>{PC.session_duration}</span></div><ChunkyProgress value={done / 10} /></div>
    <ChunkyButton onClick={onOpen} className="w-full">{done ? PC.continue_unit_1_7d780 : PC.explore_unit_1_f3449}<ChevronRight className="h-5 w-5" /></ChunkyButton>
    {onOriginal && <button type="button" onClick={onOriginal} className="mt-4 min-h-11 w-full text-sm font-bold underline underline-offset-4">{PC.compare_with_original_unit_1942f}</button>}
  </section>;
}

export function UnitOnePilot({ sessionId, onOpen, onBack, onOriginal }: { sessionId?: string; onOpen: (id?: string) => void; onBack: () => void; onOriginal: () => void }) {
  const progress = usePilotProgress();
  const session = PILOT_SESSIONS.find(s => s.id === sessionId);
  const next = PILOT_SESSIONS.find(s => !progress[s.id]);
  if (session) return <PilotSessionView key={session.id} session={session} onBack={() => onOpen()} onNext={() => {
    const following = PILOT_SESSIONS[PILOT_SESSIONS.indexOf(session) + 1];
    onOpen(following?.id);
  }} />;
  return <main className="w-full flex-1 bg-white px-4 pb-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
    <div className="mx-auto max-w-3xl pt-5">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 font-bold"><ArrowLeft className="h-5 w-5" />{PC.learning_path_94a61}</button>
      <header className="mt-5 flex items-center gap-4"><Sticker id="flow.welcome-aboard" size={130} mode="once" /><div><p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{PC.english_beginner_unit_1_78430}</p><h1 className="mt-2 font-serif text-3xl font-extrabold sm:text-4xl">{PC.meet_someone_new_b287c}</h1><p className="mt-3 max-w-lg text-slate-600 dark:text-zinc-300">{PC.a_little_learning_a_e1f93}</p></div></header>
      <div className="my-6 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-900"><div className="mb-3 flex flex-wrap justify-between gap-2 font-bold"><span>{Object.keys(progress).length} {PC.of_10_sessions_complete_b88cd}</span><span className="text-sm text-slate-500">{PC.free_practice_no_hearts_06e44}</span></div><ChunkyProgress value={Object.keys(progress).length / 10} /></div>
      <ChunkyButton onClick={() => onOpen(next?.id || 'mission')} className="mb-6 w-full sm:w-auto">{next ? PC.continue_learning_46a69 : PC.try_the_final_mission_4f145}<ChevronRight className="h-5 w-5" /></ChunkyButton>
      <ol className="grid gap-3 sm:grid-cols-2">{PILOT_SESSIONS.map((s, i) => <li key={s.id}><button onClick={() => onOpen(s.id)} className="flex h-full w-full items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-[0_3px_0_0_#e2e8f0] transition hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold ${progress[s.id] ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'}`}>{progress[s.id] ? <Check className="h-5 w-5" /> : i + 1}</span>
        <span><span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{s.category} · {s.minutes} {PC.min_f4e8a}</span><span className="mt-1 block font-serif text-lg font-extrabold">{s.title}</span><span className="mt-1 block text-sm text-slate-600 dark:text-zinc-300">{s.goal}</span>{progress[s.id] && <span className="mt-2 block text-xs font-bold text-emerald-700 dark:text-emerald-300">{PC.best_firsttry_score_bd57b}{progress[s.id].best}%</span>}</span>
      </button></li>)}</ol>
      <p className="mt-6 text-sm text-slate-500">{PC.try_any_session_while_36103}</p>
      <button onClick={onOriginal} className="mt-4 min-h-11 text-sm font-bold underline underline-offset-4">{PC.open_original_unit_1_50db6}</button>
    </div>
  </main>;
}

interface Draft { session: string; index: number; missed: string[]; skipped: string[]; }
function PilotSessionView({ session, onBack, onNext }: { session: PilotSession; onBack: () => void; onNext: () => void }) {
  const progress = usePilotProgress();
  const [tasks] = useState(() => sessionTasks(session, Object.values(progress).flatMap(s => s.missed)));
  const [draft] = useState(() => {
    const raw = readScopedJSON<Partial<Draft>>(DRAFT, {});
    return raw.session === session.id && Number.isInteger(raw.index) && Number(raw.index) >= 0 && Number(raw.index) < tasks.length ? raw : {};
  });
  const [index, setIndex] = useState(Number(draft.index) || 0);
  const [missed, setMissed] = useState<string[]>(Array.isArray(draft.missed) ? draft.missed : []);
  const [skipped, setSkipped] = useState<string[]>(Array.isArray(draft.skipped) ? draft.skipped : []);
  const [selected, setSelected] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<'answering' | 'correct' | 'wrong'>('answering');
  const [transcript, setTranscript] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [micAttempt, setMicAttempt] = useState(0);
  const [done, setDone] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLElement>(null);
  const finished = useRef(false);
  const advancing = useRef(false);
  const task = tasks[index];
  const speechTask = task.kind === 'speak';
  const assessed = tasks.filter(t => t.kind !== 'teach' && !skipped.includes(t.id));
  const firstTryScore = assessed.length ? Math.round(100 * (assessed.length - assessed.filter(t => missed.includes(t.id)).length) / assessed.length) : 0;
  const tileOrder = useMemo(() => task.kind === 'build' ? task.tiles : [], [task]);
  useEffect(() => {
    advancing.current = false;
    setSelected(''); setPicked([]); setTyped(''); setStatus('answering'); setTranscript(false); setMicrophone(false);
    heading.current?.focus({ preventScroll: true }); root.current?.scrollIntoView({ block: 'start' });
  }, [index]);
  useEffect(() => { if (!done) writeScopedJSON(DRAFT, { session: session.id, index, missed, skipped }); }, [session.id, index, missed, skipped, done]);
  const grade = (ok: boolean) => {
    if (status !== 'answering') return;
    if (!ok) setMissed(previous => [...new Set([...previous, task.id])]);
    setStatus(ok ? 'correct' : 'wrong');
  };
  const advance = (skipId?: string) => {
    if (advancing.current) return;
    advancing.current = true;
    if (index + 1 < tasks.length) { setIndex(index + 1); return; }
    if (finished.current) return;
    finished.current = true;
    const graded = tasks.filter(t => t.kind !== 'teach' && !skipped.includes(t.id) && t.id !== skipId);
    const score = graded.length ? Math.round(100 * (graded.length - graded.filter(t => missed.includes(t.id)).length) / graded.length) : 0;
    completePilot(session.id, score, missed);
    removeScoped(DRAFT); setDone(true);
  };
  const check = () => {
    if (task.kind === 'teach') { advance(); return; }
    if (status === 'correct') { advance(); return; }
    if (status === 'wrong') { setStatus('answering'); setSelected(''); setPicked([]); setTyped(''); setMicAttempt(n => n + 1); heading.current?.focus(); return; }
    grade(checkTask(task, task.kind === 'choice' ? selected : task.kind === 'build' ? picked.map(i => tileOrder[i]).join(' ') : typed));
  };
  const ready = task.kind === 'teach' || status !== 'answering' || (task.kind === 'choice' ? !!selected : task.kind === 'build' ? picked.length > 0 : typed.trim().length > 0);
  if (done) return <main className="flex w-full flex-1 flex-col items-center justify-center bg-white px-5 py-12 text-center text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"><Sticker id="achieve.treasure-chest" size={170} mode="once" /><p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-slate-500">{PC.session_complete_4efea}</p><h1 className="mt-2 font-serif text-3xl font-extrabold">{session.id === 'mission' ? PC.you_met_someone_new_b9f1e : PC.one_more_thing_you_2086d}</h1><p className="mt-4 max-w-md text-lg">{session.goal}</p><p className="mt-4 font-bold">{firstTryScore}{PC._on_first_tries_79065}{missed.length ? PC.you_worked_through_the_0c158 : PC.great_recall_399ec}</p>{skipped.length > 0 && <p className="mt-2 text-sm text-slate-500">{PC.speaking_skipped_this_time_b78be}</p>}<p className="mt-3 max-w-sm text-sm text-slate-500">{PC.your_progress_in_this_ddfab}</p><ChunkyButton onClick={onNext} className="mt-7 w-full max-w-sm">{session.id === 'mission' ? PC.back_to_unit_1_ac802 : PC.next_session_ff712}<ChevronRight className="h-5 w-5" /></ChunkyButton><button onClick={onBack} className="mt-4 min-h-11 font-bold underline">{PC.unit_overview_db798}</button></main>;
  return <main ref={root} className="w-full flex-1 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
    <div className="mx-auto max-w-2xl px-4 pb-72 pt-4">
      <div className="flex items-center gap-4"><button type="button" onClick={onBack} aria-label={PC.back_to_unit_1_ac802} className="min-h-12 min-w-12 rounded-full p-3"><ArrowLeft className="h-6 w-6" /></button><div className="flex-1"><p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-500">{session.title} · {index + 1}/{tasks.length}</p><ChunkyProgress value={index / tasks.length} /></div></div>
      <div className="mt-6 flex items-end gap-3"><Sticker id={task.kind === 'teach' ? 'learn.bookworm' : task.kind === 'reply' ? 'learn.chatterbox' : 'mood.hi-there'} size={100} mode="once" /><div className="mb-2 rounded-2xl border-2 border-slate-200 px-4 py-3 dark:border-zinc-700"><h1 ref={heading} tabIndex={-1} className="font-serif text-xl font-extrabold leading-snug outline-none">{task.prompt}</h1></div></div>
      {task.scene && <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 font-semibold leading-relaxed dark:bg-zinc-900">{task.scene.split('\n').map(line => <p key={line}>{line}</p>)}</div>}
      {task.kind === 'teach' && <div className="mt-5"><p className="text-lg leading-relaxed text-slate-600 dark:text-zinc-300">{task.explanation}</p><div className="mt-5 space-y-3">{task.examples.map(line => <div key={line} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 p-4 dark:border-zinc-700"><p className="font-serif text-lg font-bold">{line}</p><Listen text={line} /></div>)}</div></div>}
      {task.kind === 'choice' && <div className="mt-5">{task.audio && <div className="mb-6 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-900"><div className="flex flex-wrap gap-3"><Listen text={task.audio} /><Listen text={task.audio} slow /></div><button onClick={() => setTranscript(v => !v)} className="mt-3 min-h-11 text-sm font-bold underline">{transcript ? PC.hide_transcript_53025 : PC.show_transcript_77578}</button>{transcript && <p className="mt-2 font-semibold">{task.audio}</p>}</div>}<div className="space-y-3">{task.options.map(option => <Tile key={option} disabled={status !== 'answering'} state={status === 'correct' && option === task.answer ? 'correct' : status === 'wrong' && option === selected ? 'wrong' : option === selected ? 'selected' : 'idle'} onClick={() => setSelected(option)} className="min-h-14 w-full text-lg">{option}</Tile>)}</div></div>}
      {task.kind === 'build' && <div className="mt-6"><div aria-label={PC.your_sentence_3a434} className="flex min-h-24 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-3 dark:border-zinc-700">{picked.map((n, at) => <button key={at} disabled={status !== 'answering'} onClick={() => setPicked(p => p.filter((_, i) => i !== at))} className="rounded-xl bg-zinc-900 px-4 py-3 font-bold text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label={`Remove ${tileOrder[n]}`}>{tileOrder[n]}</button>)}{!picked.length && <span className="self-center text-slate-500">{PC.tap_the_words_to_991c8}</span>}</div><div className="mt-5 flex flex-wrap gap-2">{tileOrder.map((word, n) => <Tile key={n} disabled={picked.includes(n) || status !== 'answering'} state={picked.includes(n) ? 'used' : 'idle'} onClick={() => setPicked(p => [...p, n])}>{word}</Tile>)}</div><button disabled={status !== 'answering'} onClick={() => setPicked([])} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold"><RotateCcw className="h-4 w-4" />{PC.start_over_51dd9}</button></div>}
      {task.kind === 'reply' && <form id="pilot-answer" className="mt-6" onSubmit={e => { e.preventDefault(); if (ready) check(); }}><label htmlFor="pilot-reply" className="mb-2 block font-bold">{PC.your_reply_bf9a7}</label><input id="pilot-reply" autoComplete="off" spellCheck={false} maxLength={140} value={typed} disabled={status !== 'answering'} onChange={e => setTyped(e.target.value)} className={inputClass} placeholder={PC.write_your_own_answer_c1b22} /><p className="mt-3 text-sm text-slate-500">{PC.capital_letters_and_punctuation_f14a5}</p></form>}
      {speechTask && <div className="mt-6"><div className="mb-5 flex items-center gap-3"><p className="flex-1 font-serif text-2xl font-extrabold">{task.target}</p><Listen text={task.target} /></div>{microphone ? <SpeakPanel key={micAttempt} target={task.target} mode="sentence" lang="en" locale="en-US" locked={status !== 'answering'} onResult={ok => grade(ok)} /> : <ChunkyButton onClick={() => setMicrophone(true)} tone="secondary" className="w-full"><Mic className="h-5 w-5" />{PC.use_microphone_64f0f}</ChunkyButton>}<button onClick={() => { setMicrophone(false); setSkipped(p => [...new Set([...p, task.id])]); advance(task.id); }} className="mt-4 min-h-11 w-full text-sm font-bold underline">{PC.i_cant_speak_now_fca54}</button><p className="mt-2 text-center text-sm text-slate-500">{PC.speech_recognition_can_mishear_991fc}</p></div>}
    </div>
    <footer className={`fixed inset-x-0 bottom-0 z-30 border-t-2 ${status === 'correct' ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950' : status === 'wrong' ? 'border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950' : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'}`}><div className="mx-auto max-w-2xl px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:pb-6">
      {status !== 'answering' && <div role="status" aria-live="polite" className="mb-4"><p className="flex items-center gap-2 font-serif text-lg font-extrabold">{status === 'correct' ? <Check className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}{status === 'correct' ? PC.that_works_02084 : PC.lets_try_it_once_5c532}</p><p className="mt-1 text-sm leading-relaxed">{task.explanation}</p>{status === 'wrong' && task.kind === 'reply' && <p className="mt-2 font-bold">{PC.one_example_7ba53}{task.example}</p>}{status === 'wrong' && task.kind === 'build' && <p className="mt-2 font-bold">{task.answers[0]}</p>}</div>}
      <ChunkyButton type={task.kind === 'reply' && status === 'answering' ? 'submit' : 'button'} form={task.kind === 'reply' ? 'pilot-answer' : undefined} onClick={task.kind === 'reply' && status === 'answering' ? undefined : check} disabled={!ready && !(speechTask && status !== 'answering')} className="w-full">{task.kind === 'teach' || status === 'correct' ? PC.continue_2e026 : status === 'wrong' ? PC.try_again_042c8 : PC.check_4b5e8}</ChunkyButton>
    </div></footer>
  </main>;
}
