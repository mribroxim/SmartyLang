import React, { useMemo, useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import { tokenizeForLang, normalizeForMatch } from '../../lib/pronunciationProfile';
import { speakText, cancelSpeech } from '../../lib/speech';
import { splitSentences } from './generators';
import { playSound } from '../../lib/audio';
import { useContentLang } from '../../contexts/ContentLangContext';

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

export function AudioDictation({ text, contentLang, onBack, onComplete, hideBack }: Props) {
  const { speechLocale } = useContentLang();
  const sentences = useMemo(
    () => splitSentences(text.text, text.format).slice(0, 8),
    [text.text, text.format],
  );
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [revealed, setRevealed] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  if (!sentences.length) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        {!hideBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        )}
        <p className="text-slate-600">No sentences available for dictation.</p>
      </div>
    );
  }

  const current = sentences[index];

  const play = () => {
    cancelSpeech();
    speakText(current, 1.0, speechLocale || 'en-US');
  };

  const grade = (attempt: string, target: string) => {
    const sourceTokens = tokenizeForLang(target, contentLang);
    const a = tokenizeForLang(attempt, contentLang).map((w) => normalizeForMatch(w, contentLang));
    const t = sourceTokens.map((w) => normalizeForMatch(w, contentLang));
    const correct: string[] = [];
    const wrong: string[] = [];
    const max = Math.max(a.length, t.length);
    for (let i = 0; i < max; i++) {
      if (a[i] && t[i] && a[i] === t[i]) correct.push(sourceTokens[i]);
      else if (t[i]) wrong.push(sourceTokens[i]);
    }
    const ratio = t.length ? correct.length / t.length : 0;
    return { correct, wrong, ratio };
  };

  const submit = () => {
    if (feedback !== 'idle') return;
    const { correct, wrong, ratio } = grade(input, current);
    const ok = ratio >= 0.8;
    const nextPassed = passedCount + (ok ? 1 : 0);
    setPassedCount(nextPassed);
    if (ok) playSound('success');
    else playSound('fail');
    const nextCorrect = [...correctWords, ...correct];
    const nextMistakes = [...new Set([...mistakes, ...wrong])];
    setCorrectWords(nextCorrect);
    setMistakes(nextMistakes);
    setFeedback(ok ? 'ok' : 'bad');
    setRevealed(true);
    setTimeout(() => {
      const next = index + 1;
      if (next >= sentences.length) {
        playSound('complete');
        onComplete({
          type: 'audio-dictation',
          score: nextPassed,
          total: sentences.length,
          mistakes: nextMistakes,
          correctWords: nextCorrect,
        });
      } else {
        setIndex(next);
        setInput('');
        setFeedback('idle');
        setRevealed(false);
        cancelSpeech();
      }
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      {!hideBack && (
        <button
          onClick={() => { cancelSpeech(); onBack(); }}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      )}
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Audio Dictation · {index + 1} / {sentences.length}
      </div>
      <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-4">Listen and type</h2>
      <button
        onClick={play}
        className="mb-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm"
      >
        <Volume2 className="w-4 h-4" /> Play sentence
      </button>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={feedback !== 'idle'}
        rows={3}
        className={`w-full px-4 py-3 rounded-xl border-2 text-lg outline-none ${
          feedback === 'ok'
            ? 'border-emerald-400 bg-emerald-50'
            : feedback === 'bad'
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-200 focus:border-zinc-900 dark:bg-zinc-900 dark:border-zinc-700'
        }`}
        placeholder="Type what you hear…"
      />
      {revealed && (
        <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400">
          Target: <span className="font-medium text-zinc-900 dark:text-zinc-100">{current}</span>
        </p>
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
