import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft, BookOpen, BarChart2, RotateCcw, AlertCircle, Pencil, Plus } from 'lucide-react';
import { useEditMode } from '../contexts/EditModeContext';
import {
  ieltsReadingTests, getAllQuestions, scoreToBand,
  type IELTSTest, type IELTSPassage, type IELTSQuestion, type QuestionSection,
} from '../data/ieltsReadingTests';
import { getIELTSTests } from '../firebase';

interface Props {
  onBack: () => void;
  recordExercise?: (type: string, data: any) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────
const PASSAGE_PARA_COUNT = (p: IELTSPassage) => p.paragraphs.length; // A-F or A-G

function bandColor(band: string) {
  const n = parseFloat(band);
  if (n >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (n >= 5.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function answerLabel(q: IELTSQuestion, section: QuestionSection): string {
  if (q.type === 'wordbank' && section.wordBank) {
    const wb = section.wordBank.find(w => w.letter === q.answer);
    return wb ? `${wb.letter} – ${wb.word}` : q.answer;
  }
  if (q.type === 'heading' && section.headings) {
    const h = section.headings.find(h => h.roman === q.answer);
    return h ? `${h.roman}. ${h.text}` : q.answer;
  }
  if (q.type === 'concept-match' && section.matchOptions) {
    const m = section.matchOptions.find(m => m.label === q.answer);
    return m ? `${m.label} – ${m.text}` : q.answer;
  }
  if (q.type === 'mcq' && q.options) {
    const o = q.options.find(o => o.label === q.answer);
    return o ? `${o.label}) ${o.text}` : q.answer;
  }
  return q.answer;
}

// Parse summaryText with {{N}} blanks into segments
function parseSummary(text: string): Array<{ kind: 'text' | 'blank'; content: string }> {
  const parts: Array<{ kind: 'text' | 'blank'; content: string }> = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', content: text.slice(last, m.index) });
    parts.push({ kind: 'blank', content: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', content: text.slice(last) });
  return parts;
}

// ── sub-components ────────────────────────────────────────────────────────

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const warn = seconds < 300; // last 5 min
  return (
    <span className={`font-mono font-bold text-sm tabular-nums ${warn ? 'text-rose-500 animate-pulse' : 'text-zinc-600 dark:text-zinc-300'}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// Single question input
function QuestionInput({
  q, section, value, onChange, showResult,
}: {
  q: IELTSQuestion;
  section: QuestionSection;
  value: string;
  onChange: (v: string) => void;
  showResult: boolean;
}) {
  const isCorrect = showResult ? value.toUpperCase() === q.answer.toUpperCase() : null;

  const baseBtnCls = 'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all';
  const activeCls = 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-50';
  const inactiveCls = 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400';
  const correctCls = 'bg-emerald-500 text-white border-emerald-500';
  const wrongCls = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
  const missedCls = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 ring-2 ring-emerald-400';

  function getOptionCls(label: string) {
    if (!showResult) return value === label ? activeCls : inactiveCls;
    const isThisCorrect = label.toUpperCase() === q.answer.toUpperCase();
    const isThisSelected = value.toUpperCase() === label.toUpperCase();
    if (isThisCorrect && isThisSelected) return correctCls;
    if (isThisCorrect) return missedCls;    // show correct when user was wrong
    if (isThisSelected) return wrongCls;
    return inactiveCls;
  }

  // --- T/F/NG or Y/N/NG ---
  if (q.type === 'tfng' || q.type === 'ynng') {
    const opts = q.type === 'tfng'
      ? ['TRUE', 'FALSE', 'NOT GIVEN']
      : ['YES', 'NO', 'NOT GIVEN'];
    return (
      <div className="flex flex-wrap gap-1.5">
        {opts.map(opt => (
          <button
            key={opt}
            disabled={showResult}
            onClick={() => onChange(opt)}
            className={`${baseBtnCls} ${getOptionCls(opt)}`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // --- Paragraph match (A-F or A-G) ---
  if (q.type === 'paragraph-match') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return (
      <div className="flex flex-wrap gap-1.5">
        {letters.map(l => (
          <button
            key={l}
            disabled={showResult}
            onClick={() => onChange(l)}
            className={`w-9 h-9 rounded-lg text-xs font-black border transition-all ${getOptionCls(l)}`}
          >
            {l}
          </button>
        ))}
      </div>
    );
  }

  // --- MCQ (A-D) ---
  if (q.type === 'mcq' && q.options) {
    return (
      <div className="space-y-1.5">
        {q.options.map(opt => (
          <button
            key={opt.label}
            disabled={showResult}
            onClick={() => onChange(opt.label)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all flex items-start gap-2 ${getOptionCls(opt.label)}`}
          >
            <span className="font-black shrink-0">{opt.label})</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>
    );
  }

  // --- Heading match ---
  if (q.type === 'heading' && section.headings) {
    return (
      <select
        disabled={showResult}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full text-xs rounded-lg border px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400
          ${showResult
            ? isCorrect
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-400 text-rose-700 dark:text-rose-300'
            : 'border-zinc-300 dark:border-zinc-600'
          }`}
      >
        <option value="">— select heading —</option>
        {section.headings.map(h => (
          <option key={h.roman} value={h.roman}>{h.roman}. {h.text}</option>
        ))}
      </select>
    );
  }

  // --- Word bank ---
  if (q.type === 'wordbank' && section.wordBank) {
    return (
      <select
        disabled={showResult}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full text-xs rounded-lg border px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400
          ${showResult
            ? isCorrect
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-400 text-rose-700 dark:text-rose-300'
            : 'border-zinc-300 dark:border-zinc-600'
          }`}
      >
        <option value="">— select word —</option>
        {section.wordBank.map(w => (
          <option key={w.letter} value={w.letter}>{w.letter} – {w.word}</option>
        ))}
      </select>
    );
  }

  // --- Concept / researcher match ---
  if (q.type === 'concept-match' && section.matchOptions) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {section.matchOptions.map(opt => (
          <button
            key={opt.label}
            disabled={showResult}
            onClick={() => onChange(opt.label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${getOptionCls(opt.label)}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

// ── main component ────────────────────────────────────────────────────────
export function IELTSReading({ onBack, recordExercise }: Props) {
  const { editMode, openEditor } = useEditMode();
  const [view, setView] = useState<'hub' | 'test' | 'results'>('hub');
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentPassage, setCurrentPassage] = useState(0);
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('questions');
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewPassage, setReviewPassage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);

  // Custom tests from Firestore, merged with the 3 built-in ones.
  // Records with builtInOverrideIndex replace the built-in at that index.
  // In edit mode show all (including drafts); for students show published only.
  const [overriddenBuiltIns, setOverriddenBuiltIns] = useState<Record<number, IELTSTest & { isDraft?: boolean }>>({});
  const [customTests, setCustomTests] = useState<(IELTSTest & { isDraft?: boolean })[]>([]);
  useEffect(() => {
    getIELTSTests({ publishedOnly: !editMode }).then(records => {
      const overrides: Record<number, IELTSTest & { isDraft?: boolean }> = {};
      const extras: (IELTSTest & { isDraft?: boolean })[] = [];
      let extraId = 100;
      records.filter(r => !r.archived).forEach(r => {
        const isDraft = editMode && (r.status === 'draft' || r.status === undefined);
        if (r.builtInOverrideIndex !== undefined) {
          overrides[r.builtInOverrideIndex] = {
            id: ieltsReadingTests[r.builtInOverrideIndex]?.id ?? extraId,
            title: r.title,
            passages: r.passages as IELTSPassage[],
            isDraft,
          };
        } else {
          extras.push({ id: extraId++, title: r.title, passages: r.passages as IELTSPassage[], isDraft });
        }
      });
      setOverriddenBuiltIns(overrides);
      setCustomTests(extras);
    }).catch(() => {/* silently ignore if offline */});
  }, [editMode]);
  const allTests = useMemo<(IELTSTest & { isDraft?: boolean })[]>(() => {
    const builtIns = ieltsReadingTests.map((t, i) =>
      overriddenBuiltIns[i] ? overriddenBuiltIns[i] : t
    );
    return [...builtIns, ...customTests];
  }, [overriddenBuiltIns, customTests]);

  const test = allTests[selectedTestIdx] ?? ieltsReadingTests[0];
  const allQ = useMemo(() => getAllQuestions(test), [test]);
  const answered = Object.keys(answers).filter(k => answers[+k] !== '').length;

  // timer
  useEffect(() => {
    if (!timerActive || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive, submitted]);

  function startTest(idx: number) {
    setSelectedTestIdx(idx);
    setAnswers({});
    setCurrentPassage(0);
    setMobileTab('questions');
    setTimeLeft(60 * 60);
    setTimerActive(true);
    setSubmitted(false);
    setView('test');
  }

  function handleSubmit() {
    clearInterval(timerRef.current!);
    setTimerActive(false);
    setSubmitted(true);
    // score
    const correct = allQ.filter(q => (answers[q.number] || '').toUpperCase() === q.answer.toUpperCase()).length;
    if (recordExercise) {
      recordExercise('ielts-reading', {
        score: correct,
        total: 40,
        testId: test.id,
        title: test.title,
        testTitle: test.title,
      });
    }
    setReviewPassage(0);
    setView('results');
  }

  // ── HUB ──────────────────────────────────────────────────────────────────
  if (view === 'hub') {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-0">
        {/* header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 h-14 flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">IELTS Reading</h1>
        </div>

        <div className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
          {/* info banner */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 mb-8 flex gap-4 items-start border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white dark:text-zinc-900" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">Academic Reading Module</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">3 passages · 40 questions · 60 minutes. The timer starts when you begin. You can switch between passages at any time.</p>
            </div>
          </div>

          {/* test cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {allTests.map((t, i) => {
              const totalQ = t.passages.flatMap(p => p.sections.flatMap(s => s.questions)).length;
              return (
                <div
                  key={t.id}
                  className={`relative group text-left rounded-2xl p-5 transition-all ${
                    editMode
                      ? 'bg-white dark:bg-zinc-900 border border-sky-200 dark:border-sky-800 ring-1 ring-sky-100 dark:ring-sky-900'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-400 hover:shadow-lg cursor-pointer'
                  }`}
                  onClick={editMode ? undefined : () => startTest(i)}
                >
                  {/* Edit mode button */}
                  {editMode && (
                    <button
                      onClick={e => { e.stopPropagation(); openEditor('ielts-reading'); }}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors shadow"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    editMode
                      ? 'bg-sky-50 dark:bg-sky-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100'
                  }`}>
                    <span className={`font-black text-lg transition-colors ${
                      editMode
                        ? 'text-sky-400'
                        : 'text-zinc-900 dark:text-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900'
                    }`}>{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="font-black text-zinc-900 dark:text-zinc-50">{t.title || `Test ${i + 1}`}</p>
                    {t.isDraft && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">Draft</span>}
                  </div>
                  <div className="space-y-0.5">
                    {t.passages.map((p, pi) => (
                      <p key={pi} className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">P{pi + 1}: {p.title}</p>
                    ))}
                  </div>
                  {editMode ? (
                    <div className="mt-4 text-xs text-sky-500 font-semibold">Click Edit to modify</div>
                  ) : (
                    <div className="mt-4 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>60 min · {totalQ} Q</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add new test — edit mode only */}
            {editMode && (
              <button
                onClick={() => openEditor('ielts-reading')}
                className="border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-sky-500 hover:border-sky-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">Add New Test</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (view === 'results') {
    const correct = allQ.filter(q => (answers[q.number] || '').toUpperCase() === q.answer.toUpperCase()).length;
    const band = scoreToBand(correct);
    const passage = test.passages[reviewPassage];

    // per-passage score
    const pScores = test.passages.map(p => {
      const pQ = p.sections.flatMap(s => s.questions);
      const pCorrect = pQ.filter(q => (answers[q.number] || '').toUpperCase() === q.answer.toUpperCase()).length;
      return { correct: pCorrect, total: pQ.length };
    });

    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-0">
        {/* header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 h-14 flex items-center gap-4">
          <button onClick={() => setView('hub')} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">Results – {test.title}</h1>
        </div>

        <div className="flex-1 px-4 lg:px-8 py-8 max-w-5xl mx-auto w-full">
          {/* score summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {/* band */}
            <div className="sm:col-span-1 bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Est. Band</p>
              <p className={`text-6xl font-black ${band === '9' ? 'text-amber-400' : 'text-white'}`}>{band}</p>
              <p className="text-xs text-zinc-400 mt-1">IELTS Academic</p>
            </div>
            {/* total */}
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 text-center border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Correct</p>
                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{correct}</p>
                <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-0.5">out of 40</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-5 text-center border border-rose-200 dark:border-rose-800">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Incorrect</p>
                <p className="text-4xl font-black text-rose-700 dark:text-rose-300">{40 - correct}</p>
                <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5">out of 40</p>
              </div>
            </div>
          </div>

          {/* per-passage */}
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {test.passages.map((p, pi) => {
              const { correct: pc, total: pt } = pScores[pi];
              const pct = Math.round((pc / pt) * 100);
              return (
                <button
                  key={pi}
                  onClick={() => setReviewPassage(pi)}
                  className={`text-left p-4 rounded-2xl border transition-all ${reviewPassage === pi ? 'border-zinc-900 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400'}`}
                >
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">Passage {pi + 1}</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2 line-clamp-1">{p.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{pc}/{pt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* review section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Review – Passage {reviewPassage + 1}: {passage.title}</h2>
              <div className="flex items-center gap-2">
                {test.passages.map((_, pi) => (
                  <button
                    key={pi}
                    onClick={() => setReviewPassage(pi)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${reviewPassage === pi ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'}`}
                  >
                    {pi + 1}
                  </button>
                ))}
              </div>
            </div>

            {passage.sections.map((section, si) => (
              <div key={si} className="p-5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Q{section.questionRange[0]}–{section.questionRange[1]}: {section.instructions.slice(0, 80)}…</p>

                {/* word bank summary inline */}
                {section.questionType === 'wordbank' && section.summaryText && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
                    {parseSummary(section.summaryText).map((part, pi) => {
                      if (part.kind === 'text') return <span key={pi}>{part.content}</span>;
                      const qNum = +part.content;
                      const q = section.questions.find(q => q.number === qNum);
                      const userAns = answers[qNum] || '';
                      const wb = section.wordBank?.find(w => w.letter === userAns);
                      const correct = userAns.toUpperCase() === (q?.answer || '').toUpperCase();
                      return (
                        <span key={pi} className={`inline-block mx-1 px-2 py-0.5 rounded-md font-bold text-xs border ${correct ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300'}`}>
                          {qNum}: {wb ? wb.word : '—'}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-3">
                  {section.questions.map(q => {
                    const userAns = answers[q.number] || '';
                    const isCorrect = userAns.toUpperCase() === q.answer.toUpperCase();
                    return (
                      <div key={q.number} className={`rounded-xl p-3 border ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
                        <div className="flex items-start gap-2 mb-1">
                          {isCorrect
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-0.5">
                              Q{q.number}
                              {q.statement ? ` – ${q.statement}` : ''}
                              {q.stem ? ` – ${q.stem}` : ''}
                              {q.paragraphLabel ? ` – ${q.paragraphLabel}` : ''}
                            </p>
                            {!isCorrect && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-300">Your answer: <span className="font-bold">{userAns || '(not answered)'}</span></p>
                            )}
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Correct: <span className="font-bold">{answerLabel(q, section)}</span></p>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-6 leading-relaxed">{q.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => startTest(selectedTestIdx)}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Retry Test {test.id}
            </button>
            <button
              onClick={() => setView('hub')}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-black transition-colors"
            >
              All Tests <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TEST VIEW ─────────────────────────────────────────────────────────────
  const passage = test.passages[currentPassage];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
      {/* top bar */}
      <div className="shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-6 h-14 flex items-center gap-3 z-10">
        <button
          onClick={() => { if (confirm('Leave the test? Your progress will be lost.')) { clearInterval(timerRef.current!); setView('hub'); } }}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* passage tabs */}
        <div className="flex items-center gap-1 flex-1">
          {test.passages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPassage(i); passageRef.current?.scrollTo(0, 0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPassage === i ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              P{i + 1}
            </button>
          ))}
        </div>

        {/* progress */}
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono shrink-0">{answered}/40</span>

        {/* timer */}
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <Timer seconds={timeLeft} onExpire={handleSubmit} />
        </div>

        {/* submit */}
        <button
          onClick={() => { if (confirm('Submit the test? You cannot change answers after submission.')) handleSubmit(); }}
          className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:bg-black transition-colors shrink-0"
        >
          Submit
        </button>
      </div>

      {/* mobile tab bar */}
      <div className="lg:hidden shrink-0 border-b border-zinc-200 dark:border-zinc-800 flex">
        <button
          onClick={() => setMobileTab('passage')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${mobileTab === 'passage' ? 'text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          Passage
        </button>
        <button
          onClick={() => setMobileTab('questions')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${mobileTab === 'questions' ? 'text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          Questions
        </button>
      </div>

      {/* main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Passage (left / mobile tab) ── */}
        <div
          ref={passageRef}
          className={`lg:w-1/2 overflow-y-auto p-5 lg:p-6 border-r border-zinc-200 dark:border-zinc-800 ${mobileTab === 'passage' ? 'flex-1' : 'hidden lg:block'}`}
        >
          <h2 className="font-serif font-black text-xl text-zinc-900 dark:text-zinc-50 mb-5">{passage.title}</h2>
          <div className="space-y-4">
            {passage.paragraphs.map(para => (
              <div key={para.label}>
                <span className="inline-block w-7 font-black text-zinc-400 dark:text-zinc-500 text-sm">{para.label}</span>
                <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{para.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Questions (right / mobile tab) ── */}
        <div className={`lg:w-1/2 overflow-y-auto ${mobileTab === 'questions' ? 'flex-1' : 'hidden lg:block'}`}>
          {passage.sections.map((section, si) => (
            <div key={si} className="p-5 lg:p-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              {/* section header */}
              <div className="mb-4">
                <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                  Questions {section.questionRange[0]}–{section.questionRange[1]}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{section.instructions}</p>
              </div>

              {/* heading list */}
              {section.headings && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 mb-4 space-y-1.5">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">List of Headings</p>
                  {section.headings.map(h => (
                    <p key={h.roman} className="text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="font-bold w-6 inline-block">{h.roman}.</span> {h.text}
                    </p>
                  ))}
                </div>
              )}

              {/* match options (concept / researcher) */}
              {section.matchOptions && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 mb-4 space-y-1.5">
                  {section.matchOptions.map(opt => (
                    <p key={opt.label} className="text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="font-black w-5 inline-block">{opt.label}.</span> {opt.text}
                    </p>
                  ))}
                </div>
              )}

              {/* word bank */}
              {section.wordBank && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Word Bank</p>
                  <div className="flex flex-wrap gap-2">
                    {section.wordBank.map(w => (
                      <span key={w.letter} className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-0.5 text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold">{w.letter}</span> – {w.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* summary text for wordbank */}
              {section.questionType === 'wordbank' && section.summaryText && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-amber-200 dark:border-amber-800">
                  {parseSummary(section.summaryText).map((part, pi) => {
                    if (part.kind === 'text') return <span key={pi}>{part.content}</span>;
                    const qNum = +part.content;
                    const userAns = answers[qNum] || '';
                    const wb = section.wordBank?.find(w => w.letter === userAns);
                    return (
                      <span key={pi} className="inline-block mx-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${userAns ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-600'}`}>
                          {qNum}: {wb ? wb.word : '___'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* individual questions */}
              <div className="space-y-4">
                {section.questions.map(q => (
                  <div key={q.number}>
                    {/* question text */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-700 dark:text-zinc-200">
                        {q.number}
                      </span>
                      <div className="flex-1 min-w-0 pt-0.5">
                        {q.statement && <p className="text-sm text-zinc-700 dark:text-zinc-200">{q.statement}</p>}
                        {q.stem && <p className="text-sm text-zinc-700 dark:text-zinc-200">{q.stem}</p>}
                        {q.paragraphLabel && <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{q.paragraphLabel}</p>}
                        {q.type === 'wordbank' && !section.summaryText && <p className="text-sm text-zinc-500 dark:text-zinc-400">Select the correct word for blank {q.number}.</p>}
                        {q.type === 'wordbank' && section.summaryText && <p className="text-xs text-zinc-400 dark:text-zinc-500">Choose the word for blank {q.number} (highlighted above)</p>}
                      </div>
                    </div>

                    {/* answer input */}
                    <div className="ml-9">
                      <QuestionInput
                        q={q}
                        section={section}
                        value={answers[q.number] || ''}
                        onChange={(v) => setAnswers(prev => ({ ...prev, [q.number]: v }))}
                        showResult={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* passage nav */}
          <div className="p-5 flex items-center justify-between gap-3">
            <button
              disabled={currentPassage === 0}
              onClick={() => { setCurrentPassage(p => p - 1); passageRef.current?.scrollTo(0, 0); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-bold disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev Passage
            </button>
            {currentPassage < test.passages.length - 1 ? (
              <button
                onClick={() => { setCurrentPassage(p => p + 1); passageRef.current?.scrollTo(0, 0); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:bg-black transition-colors"
              >
                Next Passage <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { if (confirm('Submit the test? You cannot change answers after submission.')) handleSubmit(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
