import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import {
  LESSON_EXERCISE_TYPES,
  LESSON_EXERCISE_LABELS,
  LESSON_PASS_THRESHOLD,
  type LessonExerciseType,
  type LessonUnlock,
  lessonExerciseProgress,
} from '../../lib/lessonProgress';
import {
  DefinitionQuiz,
  WordMatch,
  WordScramble,
  ListeningMatch,
  TrueFalseQuiz,
  SpellingPractice,
  PronunciationDrill,
  SentenceReorder,
} from '../../Exercises';
import { ClozeComponent } from './ClozeComponent';
import { ComprehensionQuestions } from './ComprehensionQuestions';
import { AudioDictation } from './AudioDictation';
import { ReadBackShadowing } from './ReadBackShadowing';
import { splitSentences } from './generators';

interface Props {
  text: ReadingText;
  contentLang: ContentLang;
  passageVocab: Record<string, any>;
  meanings: Record<string, string>;
  allVocabMap: Map<string, string>;
  unlock: LessonUnlock;
  onBack: () => void;
  onExerciseComplete: (result: any) => void;
  onReRead: () => void;
  onAllDone: () => void;
}

/** VIP-Grammar-style sequential runner: one exercise at a time + progress bar. */
export function LessonExerciseFlow({
  text, contentLang, passageVocab, meanings, allVocabMap, unlock,
  onBack, onExerciseComplete, onReRead, onAllDone,
}: Props) {
  const types = LESSON_EXERCISE_TYPES;
  const firstIncomplete = useMemo(() => {
    const idx = types.findIndex((t) => (unlock.exerciseBest[t] ?? 0) < LESSON_PASS_THRESHOLD);
    return idx < 0 ? 0 : idx;
  }, [unlock.exerciseBest]);

  const [index, setIndex] = useState(firstIncomplete);
  const [running, setRunning] = useState(false);
  const currentType = types[index];
  const prog = lessonExerciseProgress(unlock);
  const progressPct = types.length ? (prog.done / types.length) * 100 : 0;
  const allDone = prog.done >= types.length;

  const handleComplete = (result: any) => {
    const type = (result.type || currentType) as LessonExerciseType;
    onExerciseComplete({ ...result, type });
    setRunning(false);

    const thisPct =
      typeof result.total === 'number' && result.total > 0 && typeof result.score === 'number'
        ? Math.round((result.score / result.total) * 100)
        : Math.round(
            ((result.correctWords?.length || 0) /
              Math.max(1, (result.correctWords?.length || 0) + (result.mistakes?.length || 0))) *
              100,
          );
    const passedThis = thisPct >= LESSON_PASS_THRESHOLD;
    const simulated: Record<string, number> = {
      ...unlock.exerciseBest,
      [type]: Math.max(unlock.exerciseBest[type] ?? 0, thisPct),
    };
    const doneCount = types.filter((t) => (simulated[t] ?? 0) >= LESSON_PASS_THRESHOLD).length;
    if (doneCount >= types.length) {
      onAllDone();
      return;
    }
    if (passedThis) {
      const next = types.findIndex(
        (t, i) => i > index && (simulated[t] ?? 0) < LESSON_PASS_THRESHOLD,
      );
      if (next >= 0) setIndex(next);
    }
  };

  if (running) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={() => setRunning(false)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <p className="text-sm font-black text-slate-700 text-center">
            <span className="text-zinc-900">Learn</span>
            {' · '}
            {LESSON_EXERCISE_LABELS[currentType]}
            <span className="text-slate-400 font-bold"> · {index + 1} / {types.length}</span>
          </p>
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="text-xs font-bold text-zinc-900 hover:underline opacity-0 pointer-events-none"
          >
            —
          </button>
        </div>
        <div className="h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-zinc-900 rounded-full transition-all duration-300"
            style={{ width: `${((index + (unlock.exerciseBest[currentType] != null ? 1 : 0)) / types.length) * 100}%` }}
          />
        </div>
        <ExerciseSlot
          type={currentType}
          text={text}
          contentLang={contentLang}
          passageVocab={passageVocab}
          meanings={meanings}
          allVocabMap={allVocabMap}
          onBack={() => setRunning(false)}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-medium">
        <ArrowLeft className="w-5 h-5" /> Library
      </button>

      {!unlock.readingPassed && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Recommended: re-read for a better score</p>
            <p className="text-xs mt-1">
              Best read accuracy: {unlock.readingBest ?? 0}%. Aim for {LESSON_PASS_THRESHOLD}%+.
            </p>
            <button onClick={onReRead} className="mt-2 text-xs font-bold underline">Re-read passage</button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-serif font-bold mb-1">Exercises</h2>
      <p className="text-slate-500 text-sm mb-4">
        Complete each step with ≥{LESSON_PASS_THRESHOLD}% · {prog.done}/{types.length} done
      </p>
      <div className="h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="space-y-3 mb-8">
        {types.map((type, i) => {
          const best = unlock.exerciseBest[type];
          const passed = (best ?? 0) >= LESSON_PASS_THRESHOLD;
          return (
            <button
              key={type}
              onClick={() => { setIndex(i); setRunning(true); }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                passed
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : i === index
                  ? 'border-zinc-900 bg-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-zinc-400'
              }`}
            >
              <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                passed ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white'
              }`}>
                {passed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900">{LESSON_EXERCISE_LABELS[type]}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{type.replace(/-/g, ' ')}</p>
              </div>
              {best != null && (
                <span className={`text-sm font-mono font-bold ${passed ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {best}%
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sticky bottom-4">
        <button
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="inline-flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-bold border-2 border-slate-200 bg-white disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => {
            if (allDone) onAllDone();
            else setRunning(true);
          }}
          className="inline-flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-bold text-white bg-zinc-900"
        >
          {allDone ? 'Finish' : (unlock.exerciseBest[currentType] != null ? 'Continue' : 'Start')}{' '}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {allDone && (
        <button
          onClick={onAllDone}
          className="mt-4 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> All exercises complete — see recommendations
        </button>
      )}
    </div>
  );
}

/** 3–5 rounds of 6 word↔meaning pairs (no difficulty picker; no practice session). */
function LessonWordMatchRounds({
  passageVocab, meanings, allVocabMap, onComplete,
}: {
  passageVocab: Record<string, any>;
  meanings: Record<string, string>;
  allVocabMap: Map<string, string>;
  onComplete: (r: any) => void;
}) {
  const vocabN = Object.keys(passageVocab).length;
  const totalRounds = vocabN >= 24 ? 5 : vocabN >= 18 ? 4 : 3;
  const [round, setRound] = useState(0);
  const [aggScore, setAggScore] = useState(0);
  const [aggMistakes, setAggMistakes] = useState<string[]>([]);
  const [aggCorrect, setAggCorrect] = useState<string[]>([]);

  const handleRoundComplete = (result: any) => {
    const nextScore = aggScore + (result.score || 0);
    const nextMistakes = [...new Set([...aggMistakes, ...(result.mistakes || [])])];
    const nextCorrect = [...new Set([...aggCorrect, ...(result.correctWords || [])])];
    setAggScore(nextScore);
    setAggMistakes(nextMistakes);
    setAggCorrect(nextCorrect);
    if (round + 1 >= totalRounds) {
      onComplete({
        type: 'word-match',
        score: nextScore,
        total: Math.max(1, totalRounds * Math.min(6, vocabN || 6)),
        mistakes: nextMistakes,
        correctWords: nextCorrect,
      });
    } else {
      setRound((r) => r + 1);
    }
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
        Round {round + 1} / {totalRounds} · 6 pairs
      </p>
      <WordMatch
        key={round}
        savedVocab={passageVocab}
        meanings={meanings}
        allVocabMap={allVocabMap}
        hideBack
        hideDifficulty
        pairCount={6}
        disableSession
        onBack={() => {}}
        onComplete={handleRoundComplete}
        recordExercise={undefined}
      />
    </div>
  );
}

function ExerciseSlot({
  type, text, contentLang, passageVocab, meanings, allVocabMap, onBack, onComplete,
}: {
  type: LessonExerciseType;
  text: ReadingText;
  contentLang: ContentLang;
  passageVocab: Record<string, any>;
  meanings: Record<string, string>;
  allVocabMap: Map<string, string>;
  onBack: () => void;
  onComplete: (r: any) => void;
}) {
  const common = {
    savedVocab: passageVocab,
    meanings,
    allVocabMap,
    onBack,
    onComplete,
    recordExercise: undefined as any,
    hideBack: true,
    hideTranslate: true,
    disableSession: true,
  };

  if (type === 'cloze') {
    return <ClozeComponent text={text} contentLang={contentLang} onBack={onBack} onComplete={onComplete} hideBack />;
  }
  if (type === 'comprehension') {
    return <ComprehensionQuestions text={text} contentLang={contentLang} onBack={onBack} onComplete={onComplete} hideBack />;
  }
  if (type === 'audio-dictation') {
    return <AudioDictation text={text} contentLang={contentLang} onBack={onBack} onComplete={onComplete} hideBack />;
  }
  if (type === 'read-back-shadowing') {
    return <ReadBackShadowing text={text} contentLang={contentLang} onBack={onBack} onComplete={onComplete} />;
  }
  if (type === 'definition-quiz') return <DefinitionQuiz {...common} />;
  if (type === 'word-match') {
    return (
      <LessonWordMatchRounds
        passageVocab={passageVocab}
        meanings={meanings}
        allVocabMap={allVocabMap}
        onComplete={onComplete}
      />
    );
  }
  if (type === 'word-scramble') return <WordScramble {...common} />;
  if (type === 'listening-match') return <ListeningMatch {...common} />;
  if (type === 'true-false-quiz') return <TrueFalseQuiz {...common} />;
  if (type === 'spelling-practice') return <SpellingPractice {...common} />;
  if (type === 'pronunciation') return <PronunciationDrill {...common} />;
  if (type === 'sentence-reorder') {
    return <SentenceReorder {...common} sentences={splitSentences(text.text).slice(0, 8)} />;
  }
  return (
    <div className="text-center py-12">
      <p className="text-slate-500 mb-4">Unknown exercise</p>
      <button onClick={onBack} className="inline-flex items-center gap-2 font-bold"><RotateCcw className="w-4 h-4" /> Exit</button>
    </div>
  );
}
