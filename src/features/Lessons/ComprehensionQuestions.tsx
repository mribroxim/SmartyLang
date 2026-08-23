import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import { generateComprehensionQuestions } from './generators';
import { playSound } from '../../lib/audio';

interface Props {
  text: ReadingText;
  contentLang: ContentLang;
  onBack: () => void;
  hideBack?: boolean;
  onComplete: (result: {
    type: string;
    score: number;
    total: number;
    mistakes: string[];
    correctWords: string[];
  }) => void;
}

export function ComprehensionQuestions({ text, contentLang, onBack, onComplete, hideBack }: Props) {
  const questions = useMemo(
    () => generateComprehensionQuestions(text.text, text.vocabulary || [], contentLang, text.id, 8, text.format),
    [text, contentLang],
  );
  const [index, setIndex] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  if (!questions.length) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        {!hideBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        )}
        <p className="text-slate-600">No comprehension questions available for this passage.</p>
      </div>
    );
  }

  const q = questions[index];

  const choose = (optIndex: number) => {
    if (picked !== null) return;
    setPicked(optIndex);
    const ok = optIndex === q.correctIndex;
    const nextScore = scoreCount + (ok ? 1 : 0);
    setScoreCount(nextScore);
    const nextCorrect = ok && q.focusWord ? [...correctWords, q.focusWord] : correctWords;
    const nextMistakes = !ok && q.focusWord ? [...new Set([...mistakes, q.focusWord])] : mistakes;
    if (ok) {
      playSound('success');
      if (q.focusWord) setCorrectWords(nextCorrect);
    } else {
      playSound('fail');
      if (q.focusWord) setMistakes(nextMistakes);
    }
    setTimeout(() => {
      const next = index + 1;
      if (next >= questions.length) {
        playSound('complete');
        onComplete({
          type: 'comprehension',
          score: nextScore,
          total: questions.length,
          mistakes: nextMistakes,
          correctWords: nextCorrect,
        });
      } else {
        setIndex(next);
        setPicked(null);
      }
    }, 900);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      {!hideBack && (
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900 font-medium">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      )}
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Comprehension · {index + 1} / {questions.length}
      </div>
      <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-6">{q.prompt}</h2>
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const show = picked !== null;
          const isCorrect = i === q.correctIndex;
          const isPicked = i === picked;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-medium ${
                show && isCorrect
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                  : show && isPicked
                  ? 'border-rose-400 bg-rose-50 text-rose-900'
                  : 'border-slate-200 dark:border-zinc-700 hover:border-zinc-900 dark:bg-zinc-900'
              }`}
            >
              <span className="flex items-start gap-3">
                {show && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                {show && isPicked && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                <span>{opt}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
