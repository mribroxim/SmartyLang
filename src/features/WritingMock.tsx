import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Clock, Hash, ChevronRight,
  CheckCircle2, BarChart2, BookOpen, AlertCircle, Timer,
} from 'lucide-react';
import { TASK1_DATA, type Task1ChartType, type Task1Prompt } from '../data/writingTask1';
import { TASK2_DATA, type Task2EssayType } from '../data/writingTask2';
import { Task1ChartVisual } from '../components/Task1ChartVisual';
import { appendHistory, WRITING_MOCK_HISTORY_KEY } from '../lib/sessionHistory';
import { recordCompletion } from '../lib/completions';
import { activityLangStamp } from '../lib/activityMeta';
import { useContentLang } from '../contexts/ContentLangContext';

/* ─── helpers ──────────────────────────────────────────────────── */
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function wc(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/* random selection */
function pickTask1(): { chartType: Task1ChartType; promptIdx: number; prompt: Task1Prompt } {
  const typeData = TASK1_DATA[Math.floor(Math.random() * TASK1_DATA.length)];
  const idx = Math.floor(Math.random() * typeData.prompts.length);
  return { chartType: typeData.type, promptIdx: idx, prompt: typeData.prompts[idx] };
}
function pickTask2(): { essayType: Task2EssayType; promptText: string; instruction: string } {
  const typeData = TASK2_DATA[Math.floor(Math.random() * TASK2_DATA.length)];
  const cat = typeData.categories[Math.floor(Math.random() * typeData.categories.length)];
  const promptText = cat.prompts[Math.floor(Math.random() * cat.prompts.length)];
  return { essayType: typeData.type, promptText, instruction: typeData.instruction };
}

/* ─── types ─────────────────────────────────────────────────────── */
type MockPhase = 'intro' | 'task1' | 'task2' | 'done';

const TOTAL_SECONDS = 3600; // 60 minutes

/* ─── component ─────────────────────────────────────────────────── */
export function WritingMock({ onBack }: { onBack: () => void }) {
  const { contentLang } = useContentLang();
  const [phase, setPhase]           = useState<MockPhase>('intro');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  /* Task 1 state */
  const [t1, setT1] = useState(() => pickTask1());
  const [t1Text, setT1Text] = useState('');

  /* Task 2 state */
  const [t2, setT2] = useState(() => pickTask2());
  const [t2Text, setT2Text] = useState('');

  const mockHistoryIdRef = useRef<string | null>(null);

  /* timer */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerActive(false);
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    setTimerActive(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimerActive(false);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const persistMockAttempt = useCallback((extra: Record<string, any> = {}) => {
    const id = mockHistoryIdRef.current || `mock_${Date.now()}`;
    mockHistoryIdRef.current = id;
    const entry = {
      id,
      title: 'IELTS Writing Mock',
      timestamp: Date.now(),
      t1Title: t1.prompt?.title || t1.chartType,
      t2Title: t2.promptText?.slice(0, 80) || t2.essayType,
      t1Words: wc(t1Text),
      t2Words: wc(t2Text),
      t1Content: t1Text,
      t2Content: t2Text,
      secondsUsed: TOTAL_SECONDS - secondsLeft,
      ...activityLangStamp(contentLang),
      ...extra,
    };
    try {
      const raw = localStorage.getItem(WRITING_MOCK_HISTORY_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(prev) ? prev.filter((e: any) => e.id !== id) : [];
      const merged = {
        ...(Array.isArray(prev) ? prev.find((e: any) => e.id === id) || {} : {}),
        ...entry,
      };
      localStorage.setItem(WRITING_MOCK_HISTORY_KEY, JSON.stringify([merged, ...list].slice(0, 100)));
      recordCompletion('writing-mock', {
        title: merged.title || 'IELTS Writing Mock',
        band: merged.band,
        contentLang,
        data: merged,
      });
    } catch {
      appendHistory(WRITING_MOCK_HISTORY_KEY, entry, 100);
      recordCompletion('writing-mock', {
        title: entry.title || 'IELTS Writing Mock',
        contentLang,
        data: entry as any,
      });
    }
  }, [t1, t2, t1Text, t2Text, secondsLeft, contentLang]);

  /* Persist when the mock reaches the done screen (submit or time-up). */
  useEffect(() => {
    if (phase !== 'done') return;
    persistMockAttempt();
  }, [phase, persistMockAttempt]);

  /* ── start exam ─── */
  const startMock = () => {
    const p1 = pickTask1();
    const p2 = pickTask2();
    setT1(p1); setT2(p2);
    setT1Text(''); setT2Text('');
    mockHistoryIdRef.current = null;
    setSecondsLeft(TOTAL_SECONDS);
    setPhase('task1');
    startTimer();
  };

  /* ── submit / move between phases ─── */
  const goTask2 = () => setPhase('task2');
  const submit  = () => { stopTimer(); setPhase('done'); };

  /* ── timer colour ─── */
  const timerRed = secondsLeft <= 300; // last 5 min

  /* ── TIMER BAR (shown during exam) ─── */
  const TimerBar = () => (
    <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 ${timerRed ? 'bg-red-600' : 'bg-zinc-900'} text-white shadow-lg`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        <Clock className="w-4 h-4" />
        <span>IELTS Writing Mock</span>
      </div>
      <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timerRed ? 'animate-pulse' : ''}`}>
        <Timer className="w-4 h-4" />
        {fmtTime(secondsLeft)}
      </div>
      <div className="text-sm font-medium opacity-80">
        {phase === 'task1' ? 'Task 1' : 'Task 2'}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════ */
  /*  INTRO                                                         */
  /* ══════════════════════════════════════════════════════════════ */
  if (phase === 'intro') return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <button
          onClick={onBack}
          className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-8 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 px-8 py-10 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Timer className="w-3 h-3" /> Full Mock Exam
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight mb-2">IELTS Writing Mock</h1>
            <p className="text-zinc-300 text-base">Simulated Academic Writing exam — 60 minutes total</p>
          </div>

          {/* Rules */}
          <div className="px-8 py-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <BarChart2 className="w-5 h-5 text-blue-600" />,
                  bg: 'bg-blue-50',
                  title: 'Task 1 — Academic (20 min)',
                  points: ['Describe a chart, table or diagram', 'At least 150 words', 'Focus on key trends & comparisons'],
                },
                {
                  icon: <BookOpen className="w-5 h-5 text-violet-600" />,
                  bg: 'bg-violet-50',
                  title: 'Task 2 — Essay (40 min)',
                  points: ['Respond to an argument or question', 'At least 250 words', 'Worth more marks — allow extra time'],
                },
              ].map(({ icon, bg, title, points }) => (
                <div key={title} className={`${bg} rounded-2xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    {icon}
                    <span className="font-bold text-slate-800 text-sm">{title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {points.map(p => (
                      <li key={p} className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="text-slate-400 mt-0.5">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-bold text-sm mb-1">Exam Conditions</p>
                  <p className="text-amber-700 text-sm">
                    The 60-minute timer starts the moment you click <strong>Start Mock</strong>. Questions are selected randomly.
                    Complete Task 1 first, then move to Task 2.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>60 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Hash className="w-4 h-4" />
                <span>150 + 250 words minimum</span>
              </div>
            </div>

            <button
              onClick={startMock}
              className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <Timer className="w-5 h-5" />
              Start Mock Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════ */
  /*  TASK 1                                                        */
  /* ══════════════════════════════════════════════════════════════ */
  if (phase === 'task1') return (
    <div className="flex flex-col flex-grow overflow-hidden w-full bg-slate-50">
      <TimerBar />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Task badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest">
              <BarChart2 className="w-3.5 h-3.5" /> Academic Task 1
            </div>
            <span className="text-xs text-slate-400 font-medium">Suggested time: 20 minutes</span>
          </div>

          {/* Prompt */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-slate-700 text-sm leading-relaxed">{t1.prompt.instruction}</p>
          </div>

          {/* Chart visual */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <Task1ChartVisual chartData={t1.prompt.chartData} />
          </div>

          {/* Text area */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Response</span>
              <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${wc(t1Text) >= 150 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Hash className="w-3.5 h-3.5" />
                {wc(t1Text)} / 150 words
              </div>
            </div>
            <textarea
              value={t1Text}
              onChange={e => setT1Text(e.target.value)}
              placeholder="Begin your Task 1 response here…"
              className="w-full min-h-[320px] p-5 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none font-[inherit]"
            />
          </div>

          {/* Next button */}
          <div className="flex justify-end pb-8">
            <button
              onClick={goTask2}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white font-bold px-7 py-3 rounded-xl transition-colors shadow-md"
            >
              Continue to Task 2 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════ */
  /*  TASK 2                                                        */
  /* ══════════════════════════════════════════════════════════════ */
  if (phase === 'task2') return (
    <div className="flex flex-col flex-grow overflow-hidden w-full bg-slate-50">
      <TimerBar />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Task badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5" /> Academic Task 2
            </div>
            <span className="text-xs text-slate-400 font-medium">Suggested time: 40 minutes</span>
          </div>

          {/* Instruction */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <p className="text-violet-700 text-xs font-bold uppercase tracking-widest mb-1">Task Instructions</p>
            <p className="text-slate-600 text-sm">{t2.instruction}</p>
          </div>

          {/* Prompt */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-800 text-base leading-relaxed font-medium">{t2.promptText}</p>
          </div>

          {/* Text area */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Response</span>
              <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${wc(t2Text) >= 250 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Hash className="w-3.5 h-3.5" />
                {wc(t2Text)} / 250 words
              </div>
            </div>
            <textarea
              value={t2Text}
              onChange={e => setT2Text(e.target.value)}
              placeholder="Begin your Task 2 essay here…"
              className="w-full min-h-[400px] p-5 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none font-[inherit]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pb-8">
            <button
              onClick={submit}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3 rounded-xl transition-colors shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Mock
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════ */
  /*  DONE                                                          */
  /* ══════════════════════════════════════════════════════════════ */
  const timeUsed = TOTAL_SECONDS - secondsLeft;
  const minsUsed = Math.floor(timeUsed / 60);
  const secsUsed = timeUsed % 60;

  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Completion banner */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-3xl p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-serif tracking-tight">Mock Exam Complete!</h2>
          </div>
          <p className="text-zinc-300 text-sm">
            Time used: <span className="font-bold text-white">{String(minsUsed).padStart(2,'0')}:{String(secsUsed).padStart(2,'0')}</span>
            {secondsLeft === 0 && <span className="ml-2 text-amber-400 font-semibold">· Time ran out</span>}
          </p>
        </div>

        {/* Task 1 summary */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-blue-50">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">Academic Task 1</span>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${wc(t1Text) >= 150 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {wc(t1Text)} words {wc(t1Text) < 150 ? '(min 150)' : '✓'}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-slate-500 text-xs font-medium line-clamp-2">{t1.prompt.instruction}</p>
            {t1Text.trim() ? (
              <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {t1Text}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No response written.</p>
            )}
            {t1Text.trim() && (
              <div className="flex items-center justify-between">
                <span />
              </div>
            )}
          </div>
        </div>

        {/* Task 2 summary */}        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-violet-50">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <span className="font-bold text-slate-800 text-sm">Academic Task 2</span>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${wc(t2Text) >= 250 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {wc(t2Text)} words {wc(t2Text) < 250 ? '(min 250)' : '✓'}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-slate-500 text-xs font-medium line-clamp-2">{t2.promptText}</p>
            {t2Text.trim() ? (
              <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {t2Text}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No response written.</p>
            )}
            {t2Text.trim() && (
              <div className="flex items-center justify-between">
                <span />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startMock}
            className="flex-1 bg-zinc-900 hover:bg-black text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Timer className="w-4 h-4" /> Try Another Mock
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Writing
          </button>
        </div>
      </div>
    </div>
  );
}
