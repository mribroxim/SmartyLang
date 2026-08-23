import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import { normalizeForMatch } from '../../lib/pronunciationProfile';
import { generateClozeItems } from './generators';
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

export function ClozeComponent({ text, contentLang, onBack, onComplete, hideBack }: Props) {
  const items = useMemo(
    () => generateClozeItems(text.text, text.vocabulary || [], contentLang, 14, text.format),
    [text, contentLang],
  );
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle');

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        {!hideBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        )}
        <p className="text-slate-600">No cloze items could be generated for this passage.</p>
      </div>
    );
  }

  const current = items[index];
  const done = index >= items.length;

  const submit = () => {
    if (feedback !== 'idle' || !current) return;
    const ok =
      normalizeForMatch(input.trim(), contentLang) ===
      normalizeForMatch(current.answer, contentLang);
    if (ok) {
      playSound('success');
      setCorrectWords((w) => [...w, current.word]);
      setFeedback('ok');
    } else {
      playSound('fail');
      setMistakes((m) => [...new Set([...m, current.word])]);
      setFeedback('bad');
    }
    setTimeout(() => {
      const next = index + 1;
      if (next >= items.length) {
        const nextCorrect = ok ? [...correctWords, current.word] : correctWords;
        const nextMistakes = ok ? mistakes : [...new Set([...mistakes, current.word])];
        playSound('complete');
        onComplete({
          type: 'cloze',
          score: nextCorrect.length,
          total: items.length,
          mistakes: nextMistakes,
          correctWords: nextCorrect,
        });
      } else {
        setIndex(next);
        setInput('');
        setFeedback('idle');
      }
    }, 900);
  };

  if (done) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      {!hideBack && (
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900 font-medium">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      )}
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Gap Fill · {index + 1} / {items.length}
      </div>
      <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-6">Fill in the blank</h2>
      <p className="text-lg leading-relaxed text-slate-800 dark:text-zinc-200 mb-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6">
        {current.blanked}
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={feedback !== 'idle'}
        className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium outline-none transition-colors ${
          feedback === 'ok'
            ? 'border-emerald-400 bg-emerald-50'
            : feedback === 'bad'
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-200 focus:border-zinc-900 dark:bg-zinc-900 dark:border-zinc-700'
        }`}
        placeholder="Type the missing word…"
        autoFocus
      />
      {feedback === 'bad' && (
        <p className="mt-3 text-sm text-rose-600">Answer: <span className="font-bold">{current.answer}</span></p>
      )}
      {feedback === 'ok' && (
        <p className="mt-3 text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Correct</p>
      )}
      <button
        onClick={submit}
        disabled={!input.trim() || feedback !== 'idle'}
        className="mt-6 w-full py-3 rounded-xl bg-zinc-900 text-white font-bold uppercase tracking-wider text-sm disabled:opacity-40"
      >
        Check
      </button>
    </div>
  );
}
