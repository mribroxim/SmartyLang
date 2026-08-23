import React, { useState, lazy, Suspense } from 'react';
import { ArrowLeft, GraduationCap, Headphones, BookOpen, PenLine, Mic, Loader2, CheckCircle } from 'lucide-react';
import { roundHalfBand } from '../lib/ieltsBands';
import { recordCompletion } from '../lib/completions';
import { activityLangStamp } from '../lib/activityMeta';
import { useContentLang } from '../contexts/ContentLangContext';
import { AiCheckReport } from '../components/AiCheckReport';
import type { AiCheckReportData } from '../lib/aiExaminer';

const IELTSListening = lazy(() => import('./IELTSListening').then(m => ({ default: m.IELTSListening })));
const IELTSReading = lazy(() => import('./IELTSReading').then(m => ({ default: m.IELTSReading })));
const WritingMock = lazy(() => import('./WritingMock').then(m => ({ default: m.WritingMock })));
const IELTSSpeaking = lazy(() => import('./IELTSSpeaking').then(m => ({ default: m.IELTSSpeaking })));

type Step = 'intro' | 'listening' | 'reading' | 'writing' | 'speaking' | 'results';

const STEPS: { id: Exclude<Step, 'intro' | 'results'>; label: string; mins: string }[] = [
  { id: 'listening', label: 'Listening', mins: '~30 min' },
  { id: 'reading', label: 'Reading', mins: '60 min' },
  { id: 'writing', label: 'Writing', mins: '60 min' },
  { id: 'speaking', label: 'Speaking', mins: '~14 min' },
];

export function IELTSFullMock({
  onBack,
  recordExercise,
}: {
  onBack: () => void;
  recordExercise?: (type: string, data: any) => void;
}) {
  const { contentLang } = useContentLang();
  const [step, setStep] = useState<Step>('intro');
  const [listening, setListening] = useState<{ score: number; total: number; band: number } | null>(null);
  const [reading, setReading] = useState<{ score: number; total: number; band: number } | null>(null);
  const [writing, setWriting] = useState<{ band?: number; aiResult1?: AiCheckReportData | null; aiResult2?: AiCheckReportData | null } | null>(null);
  const [speaking, setSpeaking] = useState<{ band?: number; aiResult?: AiCheckReportData | null } | null>(null);

  const quit = () => {
    if (step !== 'intro' && step !== 'results') {
      if (!confirm('Leave the Full Mock? Progress for this sitting will be lost.')) return;
    }
    onBack();
  };

  const persistAndShow = (nextSpeaking?: typeof speaking) => {
    const s = nextSpeaking ?? speaking;
    const wBand = writing?.band;
    const sBand = s?.band;
    const bands = [listening?.band, reading?.band, wBand, sBand].filter((n): n is number => typeof n === 'number');
    const overall = bands.length === 4 ? roundHalfBand(bands.reduce((a, b) => a + b, 0) / 4) : undefined;
    const entry = {
      id: `full_${Date.now()}`,
      timestamp: Date.now(),
      listening,
      reading,
      writing,
      speaking: s,
      overall,
      ...activityLangStamp(contentLang),
    };
    try {
      const raw = localStorage.getItem('ielts_full_mock_v1');
      const prev = raw ? JSON.parse(raw) : [];
      localStorage.setItem('ielts_full_mock_v1', JSON.stringify([entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 50)));
    } catch { /* ignore */ }
    recordCompletion('ielts-full-mock', {
      title: 'IELTS Full Mock',
      band: overall,
      contentLang,
      data: entry as any,
    });
    setStep('results');
  };

  const Spinner = (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
    </div>
  );

  if (step === 'intro') {
    return (
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <button onClick={onBack} className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-8 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-zinc-900 dark:text-zinc-50">Full Mock</h1>
              <p className="text-sm text-zinc-500">Listening → Reading → Writing → Speaking</p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            One sitting, like the Academic exam. You cannot go back a skill once it starts. Confirm before quitting.
          </p>
          <div className="space-y-2 mb-8">
            {STEPS.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{s.label}</span>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{s.mins}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep('listening')}
            className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl"
          >
            Start Full Mock
          </button>
        </div>
      </div>
    );
  }

  if (step === 'listening') {
    return (
      <Suspense fallback={Spinner}>
        <IELTSListening
          onBack={quit}
          recordExercise={recordExercise}
          embedded
          onFinish={(r) => { setListening(r); setStep('reading'); }}
        />
      </Suspense>
    );
  }

  if (step === 'reading') {
    return (
      <Suspense fallback={Spinner}>
        <IELTSReading
          onBack={quit}
          recordExercise={recordExercise}
          embedded
          onFinish={(r) => { setReading(r); setStep('writing'); }}
        />
      </Suspense>
    );
  }

  if (step === 'writing') {
    return (
      <Suspense fallback={Spinner}>
        <WritingMock
          onBack={quit}
          embedded
          onFinish={(r) => { setWriting(r); setStep('speaking'); }}
        />
      </Suspense>
    );
  }

  if (step === 'speaking') {
    return (
      <Suspense fallback={Spinner}>
        <IELTSSpeaking
          onBack={quit}
          embedded
          onFinish={(r) => {
            setSpeaking(r);
            persistAndShow(r);
          }}
        />
      </Suspense>
    );
  }

  const overallBands = [listening?.band, reading?.band, writing?.band, speaking?.band].filter(
    (n): n is number => typeof n === 'number',
  );
  const overall = overallBands.length
    ? roundHalfBand(overallBands.reduce((a, b) => a + b, 0) / overallBands.length)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-serif font-black text-zinc-900 dark:text-zinc-50 mb-2">Full Mock results</h1>
        <p className="text-sm text-zinc-500 mb-6">Overall band from four skills, rounded to the nearest .0 / .5</p>
        <div className="bg-zinc-900 rounded-3xl p-6 text-white mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Overall</p>
            <p className="text-5xl font-black tabular-nums">{overall}</p>
          </div>
          <GraduationCap className="w-10 h-10 text-amber-300" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { Icon: Headphones, label: 'Listening', band: listening?.band, meta: listening ? `${listening.score}/${listening.total}` : '—' },
            { Icon: BookOpen, label: 'Reading', band: reading?.band, meta: reading ? `${reading.score}/${reading.total}` : '—' },
            { Icon: PenLine, label: 'Writing', band: writing?.band, meta: 'AI examiner' },
            { Icon: Mic, label: 'Speaking', band: speaking?.band, meta: 'AI examiner' },
          ].map(({ Icon, label, band, meta }) => (
            <div key={label} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-zinc-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{band ?? '—'}</p>
              <p className="text-[11px] text-zinc-400">{meta}</p>
            </div>
          ))}
        </div>
        {writing?.aiResult2 && (
          <div className="mb-6">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Writing</p>
            <AiCheckReport report={writing.aiResult2} compact />
          </div>
        )}
        {speaking?.aiResult && (
          <div className="mb-8">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Speaking</p>
            <AiCheckReport report={speaking.aiResult} compact />
          </div>
        )}
        <button onClick={onBack} className="w-full py-3 bg-zinc-900 text-white font-bold rounded-2xl">
          Back to IELTS
        </button>
      </div>
    </div>
  );
}
