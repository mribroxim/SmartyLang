import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Play, Pause, Square, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, RotateCcw, Volume2, BookOpen, BarChart2, AlertCircle,
  Pencil, Plus,
} from 'lucide-react';
import { ieltsListeningTests, type IELTSListeningTest, type ListeningSection } from '../data/ieltsListeningTests';
import { getIELTSListeningTests } from '../firebase';
import { useEditMode } from '../contexts/EditModeContext';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

interface Props {
  onBack: () => void;
  recordExercise?: (type: string, data: any) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────
function bandColor(score: number) {
  if (score >= 7) return 'text-emerald-600';
  if (score >= 5.5) return 'text-amber-600';
  return 'text-rose-600';
}

function scoreToBand(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.9) return '8.5–9.0';
  if (pct >= 0.8) return '7.5–8.0';
  if (pct >= 0.7) return '6.5–7.0';
  if (pct >= 0.6) return '5.5–6.0';
  if (pct >= 0.5) return '5.0';
  if (pct >= 0.4) return '4.0–4.5';
  return 'Below 4.0';
}

function bandNum(band: string): number {
  return parseFloat(band.split('–')[0]) || parseFloat(band.replace('Below ', ''));
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function isCorrect(userAns: string, correctAns: string, type: string) {
  if (type === 'mcq' || type === 'match') {
    return userAns.trim().toUpperCase() === correctAns.trim().toUpperCase();
  }
  // fill: allow close matches
  const u = normalize(userAns);
  const c = normalize(correctAns);
  if (u === c) return true;
  // accept partial number match (e.g. "14 march 1992" vs "14 march 1992")
  const variants = [c, c.replace(/\s/g, ''), c.replace(',', '')];
  return variants.some(v => u === v || u.includes(v) || v.includes(u));
}

// ── TTS player hook ────────────────────────────────────────────────────────
function useTTS(text: string) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const rateRef = useRef(0.9);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rateRef.current;
    utt.lang = 'en-GB';
    utt.onstart = () => setPlaying(true);
    utt.onend = () => { setPlaying(false); setDone(true); };
    utt.onerror = () => setPlaying(false);
    uttRef.current = utt;
    setDone(false);
    window.speechSynthesis.speak(utt);
  }, [playing, text]);

  // stop on unmount
  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return { playing, done, play, stop, setRate: (r: number) => { rateRef.current = r; } };
}

// ── Timer ──────────────────────────────────────────────────────────────────
function Timer({ seconds, active }: { seconds: number; active: boolean }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);
  useEffect(() => {
    if (!active) { if (ref.current) clearInterval(ref.current); return; }
    ref.current = setInterval(() => setLeft(p => Math.max(0, p - 1)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');
  const urgent = left < 300;
  return (
    <span className={`font-mono text-sm font-bold ${urgent ? 'text-rose-600' : 'text-slate-600'}`}>
      {m}:{s}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function IELTSListening({ onBack, recordExercise }: Props) {
  type View = 'menu' | 'section' | 'review' | 'results';

  const { editMode, openEditor } = useEditMode();
  const [view, setView] = useState<View>('menu');
  const [test, setTest] = useState<IELTSListeningTest | null>(null);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [allAnswers, setAllAnswers] = useState<Record<number, string>>({});
  const [allTests, setAllTests] = useState<(IELTSListeningTest & { isDraft?: boolean })[]>(ieltsListeningTests);

  // Fetch Firestore overrides and merge with built-ins.
  // In edit mode show all (including drafts); for students show published only.
  useEffect(() => {
    getIELTSListeningTests({ publishedOnly: !editMode }).then(records => {
      const overrides: Record<number, IELTSListeningTest & { isDraft?: boolean }> = {};
      const extras: (IELTSListeningTest & { isDraft?: boolean })[] = [];
      let extraId = ieltsListeningTests.length + 1;
      records.filter(r => !r.archived).forEach(r => {
        const isDraft = r.status === 'draft' || r.status === undefined;
        if (r.builtInOverrideIndex !== undefined) {
          overrides[r.builtInOverrideIndex] = {
            id: ieltsListeningTests[r.builtInOverrideIndex]?.id ?? extraId,
            title: r.title,
            sections: r.sections,
            isDraft: editMode ? isDraft : false,
          };
        } else {
          extras.push({ id: extraId++, title: r.title, sections: r.sections, isDraft: editMode ? isDraft : false });
        }
      });
      const builtIns = ieltsListeningTests.map((t, i) =>
        overrides[i] ? overrides[i] : t
      );
      setAllTests([...builtIns, ...extras]);
    }).catch(() => {}); // fall back to built-ins on error
  }, [editMode]);

  const section: ListeningSection | null = test ? test.sections[sectionIdx] : null;
  const tts = useTTS(section?.transcript ?? '');

  function startTest(t: IELTSListeningTest) {
    setTest(t);
    setSectionIdx(0);
    setAnswers({});
    setAllAnswers({});
    setSubmitted(false);
    setView('section');
  }

  function goToSection(idx: number) {
    tts.stop();
    setSubmitted(false);
    setSectionIdx(idx);
    setView('section');
  }

  function submitSection() {
    if (!section) return;
    setAllAnswers(prev => ({ ...prev, ...answers }));
    setSubmitted(true);
    setView('review');
  }

  function nextSection() {
    if (!test) return;
    const next = sectionIdx + 1;
    if (next < test.sections.length) {
      setAnswers({});
      goToSection(next);
    } else {
      // finish — merge last section answers
      const merged = { ...allAnswers, ...answers };
      setAllAnswers(merged);
      setView('results');
      if (recordExercise) {
        const total = test.sections.flatMap(s => s.questions).length;
        const correct = test.sections.flatMap(s => s.questions).filter(q =>
          isCorrect(merged[q.number] ?? '', q.answer, q.type)
        ).length;
        recordExercise('ielts-listening', {
          testId: test.id,
          title: test.title,
          score: correct,
          correct,
          total,
        });
      }
    }
  }

  // ── Results calc ──────────────────────────────────────────────────────────
  const allQuestions = useMemo(() => test ? test.sections.flatMap(s => s.questions) : [], [test]);
  const totalCorrect = useMemo(() => allQuestions.filter(q =>
    isCorrect(allAnswers[q.number] ?? '', q.answer, q.type)
  ).length, [allQuestions, allAnswers]);
  const band = scoreToBand(totalCorrect, allQuestions.length);
  const bandN = bandNum(band);

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (view === 'menu') {
    return (
      <ScreenShell title="IELTS Listening Tests" subtitle="Four sections. 40 questions. Audio played via text-to-speech.">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Sections', value: '4', sub: 'per test' },
              { label: 'Questions', value: '40', sub: 'per test' },
              { label: 'Duration', value: '30 min', sub: 'timed' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-[16px] font-black text-zinc-900">{value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                <div className="text-[10px] text-slate-400">{sub}</div>
              </div>
            ))}
          </div>

          <div className={seGrid2}>
            {allTests.map(t => (
              <HubRow
                key={t.id}
                icon={<Volume2 className="w-5 h-5" />}
                iconClass="bg-sky-50 text-sky-600"
                title={t.title}
                desc={t.isDraft ? 'Draft' : '40 questions · 4 sections'}
                onClick={() => { if (editMode) openEditor('ielts-listening'); else startTest(t); }}
              />
            ))}
            {editMode && (
              <HubRow
                icon={<Plus className="w-5 h-5" />}
                iconClass="bg-sky-50 text-sky-600"
                title="Add New Test"
                desc="Opens Content Manager"
                onClick={() => openEditor('ielts-listening')}
              />
            )}
          </div>
      </ScreenShell>
    );
  }

  // ── SECTION ───────────────────────────────────────────────────────────────
  if ((view === 'section') && section && test) {
    return (
      <main className="flex-grow overflow-y-auto w-full bg-white py-6 px-4 md:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { tts.stop(); onBack(); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Exit Test
            </button>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {test.sections.map((_, i) => (
                  <div key={i} className={`w-6 h-1.5 rounded-full transition-colors ${i < sectionIdx ? 'bg-emerald-400' : i === sectionIdx ? 'bg-sky-500' : 'bg-slate-200'}`} />
                ))}
              </div>
              <Timer seconds={30 * 60} active={!submitted} />
            </div>
          </div>

          {/* Section badge */}
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 text-sm font-black flex items-center justify-center shrink-0">{section.number}</span>
              <div>
                <h2 className="font-bold text-zinc-900">{section.title}</h2>
                <p className="text-sm text-slate-500">Questions {section.questionRange[0]}–{section.questionRange[1]}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4 italic">📍 {section.context}</p>

            {/* Audio controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={tts.play}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tts.playing
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
              >
                {tts.playing ? <><Pause className="w-4 h-4" /> Pause Audio</> : <><Play className="w-4 h-4" /> {tts.done ? 'Replay Audio' : 'Play Audio'}</>}
              </button>
              {tts.playing && (
                <button onClick={tts.stop} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                  <Square className="w-3.5 h-3.5" /> Stop
                </button>
              )}
              {tts.done && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Audio complete</span>}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{section.instructions}</p>

          {/* Questions */}
          <div className="space-y-4 mb-8">
            {section.questions.map(q => (
              <div key={q.number} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{q.number}</span>
                  <div className="flex-1">
                    {q.type === 'fill' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {q.label && <span className="text-sm text-zinc-900 font-medium">{q.label}</span>}
                        <input
                          type="text"
                          value={answers[q.number] ?? ''}
                          onChange={e => setAnswers(prev => ({ ...prev, [q.number]: e.target.value }))}
                          placeholder="your answer…"
                          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 min-w-[160px] flex-1"
                        />
                      </div>
                    )}
                    {q.type === 'mcq' && (
                      <div>
                        <p className="text-sm text-zinc-900 font-medium mb-3">{q.stem}</p>
                        <div className="space-y-2">
                          {q.options!.map(opt => (
                            <label key={opt.label} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              answers[q.number] === opt.label ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}>
                              <input
                                type="radio"
                                name={`q${q.number}`}
                                value={opt.label}
                                checked={answers[q.number] === opt.label}
                                onChange={() => setAnswers(prev => ({ ...prev, [q.number]: opt.label }))}
                                className="mt-0.5 accent-sky-600"
                              />
                              <span className="text-sm"><span className="font-bold">{opt.label}.</span> {opt.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitSection}
            className="w-full py-3.5 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-colors"
          >
            Submit Section {section.number}
          </button>
        </div>
      </main>
    );
  }

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (view === 'review' && section && test) {
    const sectionCorrect = section.questions.filter(q =>
      isCorrect(answers[q.number] ?? '', q.answer, q.type)
    ).length;

    return (
      <main className="flex-grow overflow-y-auto w-full bg-white py-6 px-4 md:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-zinc-900 text-lg">Section {section.number} · {section.title}</h2>
              <span className="text-lg font-black text-zinc-900">{sectionCorrect}/{section.questions.length}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
              <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${(sectionCorrect / section.questions.length) * 100}%` }} />
            </div>
            <p className="text-xs text-slate-500">{Math.round((sectionCorrect / section.questions.length) * 100)}% correct</p>
          </div>

          <div className="space-y-4 mb-8">
            {section.questions.map(q => {
              const userAns = answers[q.number] ?? '';
              const correct = isCorrect(userAns, q.answer, q.type);
              return (
                <div key={q.number} className={`bg-white border rounded-2xl p-5 ${correct ? 'border-emerald-200' : 'border-rose-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5">
                      {correct ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400">Q{q.number}</span>
                        {q.type === 'fill' && q.label && <span className="text-sm text-slate-700">{q.label}</span>}
                        {q.type === 'mcq' && <span className="text-sm text-slate-700">{q.stem}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className={`px-2 py-1 rounded-lg font-medium ${correct ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          Your answer: {userAns || '(blank)'}
                        </span>
                        {!correct && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                            Correct: {q.answer}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={nextSection}
            className="w-full py-3.5 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            {sectionIdx < (test.sections.length - 1) ? (
              <>Next Section <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>See Final Results <BarChart2 className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </main>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (view === 'results' && test) {
    return (
      <main className="flex-grow overflow-y-auto w-full bg-white py-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 mb-6">
            <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-5">
              <BarChart2 className="w-10 h-10 text-sky-600" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-1">Test Complete!</h1>
            <p className="text-slate-500 mb-6">{test.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-3xl font-black text-zinc-900">{totalCorrect}</div>
                <div className="text-xs text-slate-500 font-medium">Correct</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-3xl font-black text-zinc-900">{allQuestions.length - totalCorrect}</div>
                <div className="text-xs text-slate-500 font-medium">Incorrect</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className={`text-3xl font-black ${bandColor(bandN)}`}>{band}</div>
                <div className="text-xs text-slate-500 font-medium">Band Score</div>
              </div>
            </div>

            {/* Per-section breakdown */}
            <div className="space-y-2 mb-6 text-left">
              {test.sections.map(sec => {
                const c = sec.questions.filter(q => isCorrect(allAnswers[q.number] ?? '', q.answer, q.type)).length;
                return (
                  <div key={sec.number} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-slate-500 shrink-0">Section {sec.number}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-sky-400 h-2 rounded-full" style={{ width: `${(c / sec.questions.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-zinc-700 w-10 text-right">{c}/{sec.questions.length}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setView('menu'); setTest(null); }}
                className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Another
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Listening
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
