import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Mic, MicOff, Timer, ChevronRight, ChevronLeft,
  CheckCircle, RotateCcw, Volume2, Clock, Trash2, History,
} from 'lucide-react';
import {
  PART1_TOPICS as _DEFAULT_PART1, PART2_CARDS as _DEFAULT_P2, PART3_TOPICS as _DEFAULT_P3,
  type Part1Topic, type Part2Card, type Part3Topic,
} from '../data/ieltsSpeakingData';
import { useCMSContent }                   from '../lib/useCMSContent';
import { useContentLang } from '../contexts/ContentLangContext';
import { activityLangStamp } from '../lib/activityMeta';
import { set as idbSet } from 'idb-keyval';
import { recordCompletion } from '../lib/completions';

// ─── Types ────────────────────────────────────────────────────────────────────

type IeltsView =
  | 'parts'   | 'history'
  | 'p1_topics' | 'p1_practice'
  | 'p2_cards'  | 'p2_prep'    | 'p2_speaking'
  | 'p3_topics' | 'p3_practice'
  | 'mock'      | 'mock_p1'    | 'mock_p2_prep' | 'mock_p2_speak' | 'mock_p3' | 'mock_done';

interface IELTSSpeakingSession {
  id: string;
  part: string;
  topic: string;
  question: string;
  practicedAt: number;
  contentLang?: string;
  langLabel?: string;
  transcript?: string;
  audioKey?: string;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const HISTORY_KEY = 'ielts_speaking_history_v1';
function loadHistory(): IELTSSpeakingSession[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function persistHistory(list: IELTSSpeakingSession[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)));
}

// ─── Part info ────────────────────────────────────────────────────────────────

const PART_INFO = [
  {
    part: 'part1' as const,
    label: 'Part 1', title: 'Introduction & Interview',
    description: 'Answer questions about familiar topics such as home, family, work, studies, and interests.',
    duration: '4–5 minutes',
    tips: ['Give extended answers — not just yes/no.', 'Use varied tenses and vocabulary.', 'It is okay to say what you really think.'],
    color: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-700', icon: '💬',
  },
  {
    part: 'part2' as const,
    label: 'Part 2', title: 'Individual Long Turn',
    description: 'Speak for 1–2 minutes on a given topic. You have 1 minute to prepare notes.',
    duration: '3–4 minutes',
    tips: ['Use your 1 minute of preparation wisely.', 'Cover all bullet points on the card.', 'Keep speaking until the examiner stops you.'],
    color: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700', icon: '🎙️',
  },
  {
    part: 'part3' as const,
    label: 'Part 3', title: 'Two-Way Discussion',
    description: 'Discuss more abstract ideas and issues connected to the Part 2 topic.',
    duration: '4–5 minutes',
    tips: ['Give opinions and justify them.', 'Use discourse markers: "on the other hand", "in terms of…"', 'It is fine to say you are not sure but speculate.'],
    color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: '🗣️',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountdown(initial: number, active: boolean, onDone?: () => void) {
  const [remaining, setRemaining] = useState(initial);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!active) return;
    setRemaining(initial);
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current!); onDone?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, initial]);
  return remaining;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function TimerRing({ total, remaining, color = '#6366f1' }: { total: number; remaining: number; color?: string }) {
  const r = 54, cx = 64, cy = 64, circ = 2 * Math.PI * r;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={remaining <= 10 ? '#ef4444' : color}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - remaining / total)}
        transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize="22" fontWeight="bold" fill={remaining <= 10 ? '#ef4444' : '#1e293b'}>
        {formatTime(remaining)}
      </text>
    </svg>
  );
}

function speak(text: string) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// ─── History Screen ───────────────────────────────────────────────────────────

function HistoryScreen({
  history, onDelete, onBack,
}: { history: IELTSSpeakingSession[]; onDelete: (id: string) => void; onBack: () => void }) {
  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Speaking History</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{history.length} sessions</span>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
            <Mic className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">No speaking sessions yet</p>
            <p className="text-sm text-slate-400 mt-1">Practice speaking to log your sessions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(s => {
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        s.part.includes('Part 1') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        s.part.includes('Part 2') ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        s.part.includes('Part 3') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>{s.part}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{s.topic}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.question}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.practicedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => onDelete(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function IELTSSpeaking({ onBack }: { onBack?: () => void }) {
  const { part1Topics: PART1_TOPICS, part2Cards: PART2_CARDS, part3Topics: PART3_TOPICS } = useCMSContent();
  const { contentLang } = useContentLang();
  const [view, setView] = useState<IeltsView>('parts');

  // Part 1
  const [p1Topic, setP1Topic] = useState<Part1Topic | null>(null);
  const [p1QIdx,  setP1QIdx]  = useState(0);

  // Part 2
  const [p2Card,       setP2Card]       = useState<Part2Card | null>(null);
  const [prepActive,   setPrepActive]   = useState(false);
  const [speakActive,  setSpeakActive]  = useState(false);
  const [prepDone,     setPrepDone]     = useState(false);

  // Part 3
  const [p3Topic, setP3Topic] = useState<Part3Topic | null>(null);
  const [p3QIdx,  setP3QIdx]  = useState(0);

  // Mock
  const [mockP1Topic,      setMockP1Topic]      = useState<Part1Topic | null>(null);
  const [mockP2Card,       setMockP2Card]        = useState<Part2Card | null>(null);
  const [mockP3Topic,      setMockP3Topic]       = useState<Part3Topic | null>(null);
  const [mockP1QIdx,       setMockP1QIdx]        = useState(0);
  const [mockP3QIdx,       setMockP3QIdx]        = useState(0);
  const [mockPrepActive,   setMockPrepActive]    = useState(false);
  const [mockSpeakActive,  setMockSpeakActive]   = useState(false);
  const [mockPrepDone,     setMockPrepDone]      = useState(false);

  // Recording
  const [recording, setRecording] = useState(false);
  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<BlobPart[]>([]);

  // VAD
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef      = useRef<number | null>(null);

  // History
  const [history, setHistory] = useState<IELTSSpeakingSession[]>(loadHistory);

  const getPracticeContext = useCallback((): { part: string; topic: string; question: string } => {
    if (view === 'p1_practice' && p1Topic) {
      return { part: 'Part 1', topic: p1Topic.title, question: p1Topic.questions[p1QIdx] ?? '' };
    }
    if ((view === 'p2_speaking' || view === 'p2_prep') && p2Card) {
      return { part: 'Part 2', topic: p2Card.title, question: p2Card.prompt };
    }
    if (view === 'p3_practice' && p3Topic) {
      return { part: 'Part 3', topic: p3Topic.cardTitle, question: p3Topic.questions[p3QIdx] ?? '' };
    }
    if (view === 'mock_p1' && mockP1Topic) {
      return { part: 'Mock · Part 1', topic: mockP1Topic.title, question: mockP1Topic.questions[mockP1QIdx] ?? '' };
    }
    if (view === 'mock_p2_speak' && mockP2Card) {
      return { part: 'Mock · Part 2', topic: mockP2Card.title, question: mockP2Card.prompt };
    }
    if (view === 'mock_p3' && mockP3Topic) {
      return { part: 'Mock · Part 3', topic: mockP3Topic.cardTitle, question: mockP3Topic.questions[mockP3QIdx] ?? '' };
    }
    return { part: 'IELTS Speaking', topic: '', question: '' };
  }, [view, p1Topic, p1QIdx, p2Card, p3Topic, p3QIdx, mockP1Topic, mockP1QIdx, mockP2Card, mockP3Topic, mockP3QIdx]);

  const addHistoryEntry = useCallback((entry: Omit<IELTSSpeakingSession, 'id' | 'practicedAt'>): string => {
    const id = `ielts_${Date.now()}`;
    const audioKey = (window as any).__smartyLatestIeltsAudioKey as string | undefined;
    const session: IELTSSpeakingSession = {
      ...entry,
      id,
      practicedAt: Date.now(),
      audioKey,
      ...activityLangStamp(contentLang),
    };
    setHistory(prev => { const next = [session, ...prev].slice(0, 100); persistHistory(next); return next; });
    recordCompletion('ielts-speaking', {
      title: `${session.part || 'IELTS'} · ${session.topic || 'Speaking'}`,
      band: typeof (session as any).band === 'number' ? (session as any).band : (session as any).aiResult?.band,
      contentLang,
      data: session as any,
    });
    return id;
  }, [contentLang]);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory(prev => { const next = prev.filter(s => s.id !== id); persistHistory(next); return next; });
  }, []);

  // Timers
  const prepRemaining      = useCountdown(60,  prepActive,      () => { setPrepActive(false);      setPrepDone(true);      });
  const speakRemaining     = useCountdown(120, speakActive,     () => setSpeakActive(false));
  const mockPrepRemaining  = useCountdown(60,  mockPrepActive,  () => { setMockPrepActive(false);  setMockPrepDone(true);  });
  const mockSpeakRemaining = useCountdown(120, mockSpeakActive, () => setMockSpeakActive(false));

  const startMock = () => {
    const p1 = PART1_TOPICS[Math.floor(Math.random() * PART1_TOPICS.length)];
    const validCards = PART2_CARDS.filter(c => PART3_TOPICS.some(t => t.cardId === c.id));
    const p2 = validCards[Math.floor(Math.random() * validCards.length)];
    const p3 = PART3_TOPICS.find(t => t.cardId === p2.id)!;
    setMockP1Topic(p1); setMockP2Card(p2); setMockP3Topic(p3);
    setMockP1QIdx(0); setMockP3QIdx(0);
    setMockPrepActive(false); setMockSpeakActive(false); setMockPrepDone(false);
    stopRecording(); setView('mock_p1');
  };

  const clearVAD = useCallback(() => {
    if (rafRef.current)      { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
  }, []);

  useEffect(() => () => { window.speechSynthesis.cancel(); clearVAD(); }, [clearVAD]);

  // ── Recording with audio capture ──────────────────────────────────────────

  const startRecording = useCallback(async (autoStop = true) => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 500) {
          const audioKey = `ielts_speak_${Date.now()}`;
          idbSet(audioKey, blob).catch(() => {});
          (window as any).__smartyLatestIeltsAudioKey = audioKey;
          // Save practice session
          const ctx = getPracticeContext();
          addHistoryEntry({ part: ctx.part, topic: ctx.topic, question: ctx.question });
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);

      if (autoStop) {
        try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new Ctx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          ctx.createMediaStreamSource(stream).connect(analyser);
          audioCtxRef.current = ctx; analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);
          let hasSpoken = false;
          const check = () => {
            if (!analyserRef.current) return;
            analyser.getByteFrequencyData(data);
            const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
            if (rms > 4) {
              hasSpoken = true;
              if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null; }
            } else if (hasSpoken && !silTimerRef.current) {
              silTimerRef.current = setTimeout(() => {
                silTimerRef.current = null;
                if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
                if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
                analyserRef.current = null;
                mediaRef.current?.stop(); // triggers mr.onstop above
                setRecording(false);
              }, 2500);
            }
            rafRef.current = requestAnimationFrame(check);
          };
          rafRef.current = requestAnimationFrame(check);
        } catch { /* VAD unavailable */ }
      }
    } catch { /* mic not available */ }
  }, [getPracticeContext, addHistoryEntry]);

  const stopRecording = useCallback(() => {
    clearVAD();
    mediaRef.current?.stop(); // triggers mr.onstop
    setRecording(false);
  }, [clearVAD]);

  const toggleRecording = (autoStop = true) =>
    recording ? stopRecording() : startRecording(autoStop);

  // ── Common mic button ─────────────────────────────────────────────────────

  function RecordBtn({ autoStop = true, label }: { autoStop?: boolean; label?: string }) {
    return (
      <div className="flex items-center gap-6">
        <button onClick={() => toggleRecording(autoStop)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${recording ? 'bg-rose-500 animate-pulse' : 'bg-zinc-900 hover:bg-black'}`}>
          {recording ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
        </button>
        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed text-left">
          {recording
            ? (autoStop ? '🔴 Stops automatically when you pause.' : '🔴 Recording…')
            : (label ?? 'Tap to record — stops when you stop talking.')}
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // History
  if (view === 'history') {
    return (
      <>
        <HistoryScreen history={history} onDelete={deleteHistoryEntry} onBack={() => setView('parts')} />
      </>
    );
  }

  /* ─── Parts screen ─────────────────────────────────────────────────────── */
  if (view === 'parts') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            {onBack && (
              <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-widest">
                🎤 IELTS Speaking
              </div>
              <button onClick={() => setView('history')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
                <History className="w-3.5 h-3.5" /> History
                {history.length > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">{history.length}</span>}
              </button>
            </div>
            <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight leading-tight mb-1.5">Select a Part</h1>
            <p className="text-[13px] text-slate-500 mb-4">Practise each part of the IELTS Speaking test independently.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {PART_INFO.map(info => (
                <button key={info.part}
                  onClick={() => setView(info.part === 'part1' ? 'p1_topics' : info.part === 'part2' ? 'p2_cards' : 'p3_topics')}
                  className={`p-8 rounded-3xl border-2 text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-200 ${info.color}`}>
                  <div className="text-3xl mb-4">{info.icon}</div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${info.badge} mb-3 inline-block`}>{info.duration}</span>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{info.label}</h2>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{info.title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{info.description}</p>
                  <div className="mt-5 pt-4 border-t border-slate-200 space-y-1">
                    {info.tips.map((t, i) => (
                      <p key={i} className="text-[11px] text-slate-500 flex items-start gap-1"><span className="text-slate-300 font-bold shrink-0">·</span>{t}</p>
                    ))}
                  </div>
                </button>
              ))}
              <button onClick={() => setView('mock')}
                className="p-8 rounded-3xl border-2 text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-200 bg-zinc-900 border-zinc-700 text-white">
                <div className="text-3xl mb-4">🎓</div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-3 inline-block">~14 minutes</span>
                <h2 className="text-xl font-bold text-white mb-1">Mock Exam</h2>
                <p className="text-sm font-semibold text-zinc-300 mb-2">Full Speaking Test</p>
                <p className="text-sm text-zinc-400 leading-relaxed">All 3 parts in sequence — exactly like the real IELTS Speaking exam with real timers.</p>
                <div className="mt-5 pt-4 border-t border-zinc-700 space-y-1">
                  <p className="text-[11px] text-zinc-400 flex items-start gap-1"><span className="text-zinc-600 font-bold shrink-0">·</span>Part 1 → Part 2 → Part 3</p>
                  <p className="text-[11px] text-zinc-400 flex items-start gap-1"><span className="text-zinc-600 font-bold shrink-0">·</span>Random questions each attempt</p>
                  <p className="text-[11px] text-zinc-400 flex items-start gap-1"><span className="text-zinc-600 font-bold shrink-0">·</span>Part 3 follows your Part 2 topic</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 1: Topic list ─────────────────────────────────────────────────── */
  if (view === 'p1_topics') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <button onClick={() => setView('parts')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Parts
            </button>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 mb-4 inline-block">Part 1 · Interview</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Choose a Topic</h1>
            <p className="text-slate-500 mb-8">Practice answering Part 1 style questions on familiar topics.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PART1_TOPICS.map(topic => (
                <button key={topic.id}
                  onClick={() => { setP1Topic(topic); setP1QIdx(0); setView('p1_practice'); }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left flex items-center gap-4 group">
                  <span className="text-2xl shrink-0">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{topic.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.questions.length} questions</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 1: Practice ───────────────────────────────────────────────────── */
  if (view === 'p1_practice' && p1Topic) {
    const q = p1Topic.questions[p1QIdx];
    const isLast = p1QIdx === p1Topic.questions.length - 1;
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { window.speechSynthesis.cancel(); stopRecording(); setView('p1_topics'); }}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Topics</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{p1Topic.icon} {p1Topic.title}</p>
              <p className="text-[10px] text-slate-400">Question {p1QIdx + 1} of {p1Topic.questions.length}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 shrink-0">Part 1</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">
            <div className="flex gap-1.5 mb-8">
              {p1Topic.questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === p1QIdx ? 'bg-sky-500' : i < p1QIdx ? 'bg-sky-200' : 'bg-slate-200'}`} />
              ))}
            </div>
            <div className="max-w-xl w-full bg-sky-50 border border-sky-200 rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-3">Examiner asks:</p>
              <p className="text-2xl font-serif text-slate-900 leading-relaxed">{q}</p>
              <button onClick={() => speak(q)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-bold">
                <Volume2 className="w-3.5 h-3.5" /> Hear question
              </button>
            </div>
            <RecordBtn autoStop={true} />
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm w-full text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Speaking tips</p>
              <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside leading-relaxed">
                <li>Expand your answer — aim for 3–5 sentences.</li>
                <li>Use a variety of tenses.</li>
                <li>Give reasons and examples.</li>
              </ul>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 px-4 py-4 flex items-center justify-between bg-white">
            <button disabled={p1QIdx === 0} onClick={() => { stopRecording(); setP1QIdx(v => v - 1); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {isLast ? (
              <button onClick={() => { stopRecording(); setView('p1_topics'); }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors">
                <CheckCircle className="w-4 h-4" /> Finish Topic
              </button>
            ) : (
              <button onClick={() => { stopRecording(); setP1QIdx(v => v + 1); }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 2: Card list ──────────────────────────────────────────────────── */
  if (view === 'p2_cards') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <button onClick={() => setView('parts')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Parts
            </button>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 mb-4 inline-block">Part 2 · Cue Card</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Choose a Cue Card</h1>
            <p className="text-slate-500 mb-8">You will have 1 minute to prepare, then speak for up to 2 minutes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PART2_CARDS.map(card => (
                <button key={card.id}
                  onClick={() => { setP2Card(card); setPrepActive(false); setSpeakActive(false); setPrepDone(false); setView('p2_prep'); }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cue Card</p>
                  <p className="font-bold text-slate-800 text-lg leading-snug mb-2">{card.title}</p>
                  <p className="text-sm text-slate-500 italic">"{card.prompt}"</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{card.bullets.length} bullet points</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 2: Prep ───────────────────────────────────────────────────────── */
  if (view === 'p2_prep' && p2Card) {
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { setPrepActive(false); setSpeakActive(false); setView('p2_cards'); }}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Cards</span>
            </button>
            <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm truncate">{p2Card.title}</p></div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 shrink-0">Part 2</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-7 mb-8 shadow-sm">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-3">🃏 Task Card</p>
                <p className="text-xl font-bold text-slate-800 leading-snug mb-5">{p2Card.prompt}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">You should say:</p>
                <ul className="space-y-2 mb-5">
                  {p2Card.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">{i + 1}</span>{b}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-slate-600 italic border-t border-amber-200 pt-4">{p2Card.followUp}</p>
              </div>
              <div className="text-center">
                {!prepActive && !prepDone && (
                  <>
                    <p className="text-slate-500 text-sm mb-4">Press the button to start your 1-minute preparation time.</p>
                    <button onClick={() => setPrepActive(true)}
                      className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-2xl shadow-lg transition-colors">
                      <Timer className="w-4 h-4" /> Start Preparation (1 min)
                    </button>
                  </>
                )}
                {prepActive && (
                  <div className="flex flex-col items-center">
                    <p className="text-slate-600 font-bold mb-4">Preparation time</p>
                    <TimerRing total={60} remaining={prepRemaining} color="#7c3aed" />
                    <p className="text-slate-500 text-sm mt-4">Read the card carefully and plan your answer.</p>
                    <button onClick={() => { setPrepActive(false); setPrepDone(true); }}
                      className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">Skip preparation</button>
                  </div>
                )}
                {prepDone && (
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <p className="text-slate-700 font-bold">Preparation complete!</p>
                    <button onClick={() => { setPrepDone(false); setSpeakActive(true); setView('p2_speaking'); }}
                      className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg transition-colors">
                      <Mic className="w-4 h-4" /> Start Speaking (2 min)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 2: Speaking ───────────────────────────────────────────────────── */
  if (view === 'p2_speaking' && p2Card) {
    const linked = PART3_TOPICS.find(t => t.cardId === p2Card.id);
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { setSpeakActive(false); stopRecording(); setView('p2_prep'); }}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Prep</span>
            </button>
            <p className="flex-1 font-bold text-slate-800 text-sm truncate">{p2Card.title}</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 shrink-0">Speaking</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-xl mx-auto px-4 md:px-8 py-8 flex flex-col items-center gap-8">
              <div className="flex flex-col items-center">
                <p className="text-slate-600 font-bold mb-4">Speaking time</p>
                <TimerRing total={120} remaining={speakRemaining} color="#dc2626" />
                {speakRemaining === 0 && <p className="text-rose-600 font-bold mt-3 text-sm">⏱ Time's up!</p>}
              </div>
              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="font-bold text-slate-700 text-sm mb-3">{p2Card.prompt}</p>
                <ul className="space-y-1">
                  {p2Card.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{b}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold text-slate-500 italic mt-3 pt-3 border-t border-amber-200">{p2Card.followUp}</p>
              </div>
              <RecordBtn autoStop={false} label="Tap to record" />
              {linked && (
                <button onClick={() => { setSpeakActive(false); stopRecording(); setP3Topic(linked); setP3QIdx(0); setView('p3_practice'); }}
                  className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:shadow-md transition-all group">
                  <div>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Continue to Part 3</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">Discussion: {linked.cardTitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 3: Topic list ─────────────────────────────────────────────────── */
  if (view === 'p3_topics') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <button onClick={() => setView('parts')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Parts
            </button>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 mb-4 inline-block">Part 3 · Discussion</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Choose a Discussion Topic</h1>
            <p className="text-slate-500 mb-8">Practise expressing and justifying abstract opinions.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PART3_TOPICS.map(topic => (
                <button key={topic.id}
                  onClick={() => { setP3Topic(topic); setP3QIdx(0); setView('p3_practice'); }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Linked to Part 2</p>
                    <p className="font-bold text-slate-800">{topic.cardTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.questions.length} questions</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Part 3: Practice ───────────────────────────────────────────────────── */
  if (view === 'p3_practice' && p3Topic) {
    const q = p3Topic.questions[p3QIdx];
    const isLast = p3QIdx === p3Topic.questions.length - 1;
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { window.speechSynthesis.cancel(); stopRecording(); setView('p3_topics'); }}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Topics</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{p3Topic.cardTitle}</p>
              <p className="text-[10px] text-slate-400">Question {p3QIdx + 1} of {p3Topic.questions.length}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0">Part 3</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">
            <div className="flex gap-1.5 mb-8">
              {p3Topic.questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === p3QIdx ? 'bg-amber-500' : i < p3QIdx ? 'bg-amber-200' : 'bg-slate-200'}`} />
              ))}
            </div>
            <div className="max-w-xl w-full bg-amber-50 border border-amber-200 rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-3">Discussion question:</p>
              <p className="text-2xl font-serif text-slate-900 leading-relaxed">{q}</p>
              <button onClick={() => speak(q)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-bold">
                <Volume2 className="w-3.5 h-3.5" /> Hear question
              </button>
            </div>
            <RecordBtn autoStop={true} />
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm w-full text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Speaking tips</p>
              <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside leading-relaxed">
                <li>Give a clear opinion and support it with reasons.</li>
                <li>Use discourse markers: "On the other hand…", "In terms of…"</li>
                <li>Consider both sides before concluding.</li>
              </ul>
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-100 px-4 py-4 flex items-center justify-between bg-white">
            <button disabled={p3QIdx === 0} onClick={() => { stopRecording(); setP3QIdx(v => v - 1); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {isLast ? (
              <button onClick={() => { stopRecording(); setView('p3_topics'); }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors">
                <CheckCircle className="w-4 h-4" /> Finish
              </button>
            ) : (
              <button onClick={() => { stopRecording(); setP3QIdx(v => v + 1); }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Intro ────────────────────────────────────────────────────────── */
  if (view === 'mock') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <button onClick={() => setView('parts')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Parts
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">🎓 Mock Exam</div>
            <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 tracking-tight leading-tight mb-3">Full Speaking Mock Test</h1>
            <p className="text-slate-500 text-lg mb-8">Simulates the real IELTS Speaking exam. All three parts are assigned randomly. Part 3 questions will be linked to your Part 2 topic.</p>
            <div className="space-y-3 mb-8">
              {[
                { label: 'Part 1 — Interview', detail: '5 questions on a familiar topic · ~5 min', color: 'bg-sky-50 border-sky-200 text-sky-700' },
                { label: 'Part 2 — Cue Card', detail: '1 min prep · 2 min speaking · timer shown', color: 'bg-violet-50 border-violet-200 text-violet-700' },
                { label: 'Part 3 — Discussion', detail: '5 abstract questions linked to Part 2 · ~5 min', color: 'bg-amber-50 border-amber-200 text-amber-700' },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${s.color}`}>
                  <span className="text-2xl font-black opacity-30">{i + 1}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={startMock}
              className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg text-lg transition-colors flex items-center justify-center gap-3">
              <Mic className="w-5 h-5" /> Start Mock Test
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Part 1 ───────────────────────────────────────────────────────── */
  if (view === 'mock_p1' && mockP1Topic) {
    const q = mockP1Topic.questions[mockP1QIdx];
    const isLast = mockP1QIdx === mockP1Topic.questions.length - 1;
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { stopRecording(); setView('mock'); }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Exit Mock</span></button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">Mock Exam — Part 1</p>
              <p className="text-[10px] text-slate-400">Question {mockP1QIdx + 1} of {mockP1Topic.questions.length} · {mockP1Topic.icon} {mockP1Topic.title}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 shrink-0">Part 1</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">
            <div className="flex gap-1.5 mb-8">
              {mockP1Topic.questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === mockP1QIdx ? 'bg-sky-500' : i < mockP1QIdx ? 'bg-sky-200' : 'bg-slate-200'}`} />
              ))}
            </div>
            <div className="max-w-xl w-full bg-sky-50 border border-sky-200 rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-3">Examiner asks:</p>
              <p className="text-2xl font-serif text-slate-900 leading-relaxed">{q}</p>
              <button onClick={() => speak(q)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-bold"><Volume2 className="w-3.5 h-3.5" /> Hear question</button>
            </div>
            <RecordBtn autoStop={true} />
          </div>
          <div className="shrink-0 border-t border-slate-100 px-4 py-4 flex items-center justify-between bg-white">
            <button disabled={mockP1QIdx === 0} onClick={() => { stopRecording(); setMockP1QIdx(v => v - 1); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /> Previous</button>
            {isLast ? (
              <button onClick={() => { stopRecording(); setMockPrepActive(false); setMockPrepDone(false); setView('mock_p2_prep'); }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow transition-colors">Continue to Part 2 <ChevronRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => { stopRecording(); setMockP1QIdx(v => v + 1); }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow transition-colors">Next <ChevronRight className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Part 2 Prep ──────────────────────────────────────────────────── */
  if (view === 'mock_p2_prep' && mockP2Card) {
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { setMockPrepActive(false); setView('mock_p1'); }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Part 1</span></button>
            <p className="flex-1 font-bold text-slate-800 text-sm">Mock Exam — Part 2 Preparation</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 shrink-0">Part 2</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-7 mb-8 shadow-sm">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-3">🃏 Task Card</p>
                <p className="text-xl font-bold text-slate-800 leading-snug mb-5">{mockP2Card.prompt}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">You should say:</p>
                <ul className="space-y-2 mb-5">
                  {mockP2Card.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">{i + 1}</span>{b}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-slate-600 italic border-t border-amber-200 pt-4">{mockP2Card.followUp}</p>
              </div>
              <div className="text-center">
                {!mockPrepActive && !mockPrepDone && (
                  <><p className="text-slate-500 text-sm mb-4">Press the button to start your 1-minute preparation time.</p>
                  <button onClick={() => setMockPrepActive(true)} className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-2xl shadow-lg transition-colors"><Timer className="w-4 h-4" /> Start Preparation (1 min)</button></>
                )}
                {mockPrepActive && (
                  <div className="flex flex-col items-center">
                    <p className="text-slate-600 font-bold mb-4">Preparation time</p>
                    <TimerRing total={60} remaining={mockPrepRemaining} color="#7c3aed" />
                    <button onClick={() => { setMockPrepActive(false); setMockPrepDone(true); }} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">Skip preparation</button>
                  </div>
                )}
                {mockPrepDone && (
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <p className="text-slate-700 font-bold">Preparation complete!</p>
                    <button onClick={() => { setMockPrepDone(false); setMockSpeakActive(true); setView('mock_p2_speak'); }} className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg transition-colors"><Mic className="w-4 h-4" /> Start Speaking (2 min)</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Part 2 Speaking ──────────────────────────────────────────────── */
  if (view === 'mock_p2_speak' && mockP2Card) {
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { setMockSpeakActive(false); stopRecording(); setView('mock_p2_prep'); }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Prep</span></button>
            <p className="flex-1 font-bold text-slate-800 text-sm">{mockP2Card.title}</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 shrink-0">Speaking</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-xl mx-auto px-4 md:px-8 py-8 flex flex-col items-center gap-8">
              <div className="flex flex-col items-center">
                <p className="text-slate-600 font-bold mb-4">Speaking time</p>
                <TimerRing total={120} remaining={mockSpeakRemaining} color="#dc2626" />
                {mockSpeakRemaining === 0 && <p className="text-rose-600 font-bold mt-3 text-sm">⏱ Time's up!</p>}
              </div>
              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="font-bold text-slate-700 text-sm mb-3">{mockP2Card.prompt}</p>
                <ul className="space-y-1">
                  {mockP2Card.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{b}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold text-slate-500 italic mt-3 pt-3 border-t border-amber-200">{mockP2Card.followUp}</p>
              </div>
              <RecordBtn autoStop={false} label="Tap to record" />
              <button onClick={() => { setMockSpeakActive(false); stopRecording(); setMockP3QIdx(0); setView('mock_p3'); }} className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:shadow-md transition-all group">
                <div>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Continue to Part 3</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">Discussion: {mockP2Card.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Part 3 ───────────────────────────────────────────────────────── */
  if (view === 'mock_p3' && mockP3Topic) {
    const q = mockP3Topic.questions[mockP3QIdx];
    const isLast = mockP3QIdx === mockP3Topic.questions.length - 1;
    return (
      <>
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
            <button onClick={() => { stopRecording(); setView('mock_p2_speak'); }} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Part 2</span></button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">Mock Exam — Part 3</p>
              <p className="text-[10px] text-slate-400">Question {mockP3QIdx + 1} of {mockP3Topic.questions.length} · Topic: {mockP3Topic.cardTitle}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0">Part 3</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">
            <div className="flex gap-1.5 mb-8">
              {mockP3Topic.questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === mockP3QIdx ? 'bg-amber-500' : i < mockP3QIdx ? 'bg-amber-200' : 'bg-slate-200'}`} />
              ))}
            </div>
            <div className="max-w-xl w-full bg-amber-50 border border-amber-200 rounded-3xl p-8 mb-8 shadow-sm">
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-3">Discussion question:</p>
              <p className="text-2xl font-serif text-slate-900 leading-relaxed">{q}</p>
              <button onClick={() => speak(q)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-bold"><Volume2 className="w-3.5 h-3.5" /> Hear question</button>
            </div>
            <RecordBtn autoStop={true} />
          </div>
          <div className="shrink-0 border-t border-slate-100 px-4 py-4 flex items-center justify-between bg-white">
            <button disabled={mockP3QIdx === 0} onClick={() => { stopRecording(); setMockP3QIdx(v => v - 1); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /> Previous</button>
            {isLast ? (
              <button onClick={() => { stopRecording(); setView('mock_done'); }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors"><CheckCircle className="w-4 h-4" /> Finish Mock</button>
            ) : (
              <button onClick={() => { stopRecording(); setMockP3QIdx(v => v + 1); }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow transition-colors">Next <ChevronRight className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ─── Mock: Done ─────────────────────────────────────────────────────────── */
  if (view === 'mock_done') {
    return (
      <>
        <div className="flex-grow overflow-y-auto w-full bg-white">
          <div className="max-w-xl mx-auto px-4 md:px-8 py-16 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3">Mock Test Complete!</h1>
            <p className="text-slate-500 text-lg mb-8">You completed all three parts of the IELTS Speaking mock exam. Well done!</p>
            <div className="space-y-3 mb-8">
              {[
                { label: 'Part 1 — Interview', detail: `${mockP1Topic?.questions.length} questions · ${mockP1Topic?.title}`, done: true },
                { label: 'Part 2 — Cue Card', detail: mockP2Card?.title || '', done: true },
                { label: 'Part 3 — Discussion', detail: `${mockP3Topic?.questions.length} discussion questions`, done: true },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-left">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div><p className="font-bold text-slate-800 text-sm">{s.label}</p><p className="text-xs text-slate-400 mt-0.5">{s.detail}</p></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={startMock} className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl shadow transition-colors flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Try Another Mock
              </button>
              <button onClick={() => setView('history')} className="w-full py-3 bg-white border border-violet-200 hover:bg-violet-50 text-violet-700 font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2">
                <History className="w-4 h-4" /> View Speaking History
              </button>
              <button onClick={() => setView('parts')} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl shadow-sm transition-colors">
                Back to Parts
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
