import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Volume2, X } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { DICT_LANG_CODE } from '../../lib/contentLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { DefinitionQuiz, fetchWordTranslations } from '../../Exercises';
import { LESSON_PASS_THRESHOLD } from '../../lib/lessonProgress';
import { playSound } from '../../lib/audio';

interface Props {
  text: ReadingText;
  allVocabMap: Map<string, string>;
  playWord: (w: string) => void;
  onBack: () => void;
  /** Called with quiz result; parent updates unlock. Returns true if vocab passed. */
  onQuizComplete: (result: any) => boolean;
  /** Add word to saved vocabulary if not already present. */
  onMemorizeWord: (word: string, definition: string) => void;
}

/** "Learn these words" — show word + interface-language translation, then gated quiz. */
export function VocabLearnPhase({
  text, allVocabMap, playWord,
  onBack, onQuizComplete, onMemorizeWord,
}: Props) {
  const { contentLang, dictCode } = useContentLang();
  const { uiLang } = useUiLang();
  const words = useMemo(
    () => (text.vocabulary || []).map((v) => v.word),
    [text.vocabulary],
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'learn' | 'quiz'>('learn');
  const [index, setIndex] = useState(0);
  const [quizKey, setQuizKey] = useState(0);
  const [failScore, setFailScore] = useState<number | null>(null);
  const handledQuizKey = useRef<number | null>(null);

  useEffect(() => {
    setStep('learn');
    setLearned(new Set());
    setIndex(0);
    setFailScore(null);
    setQuizKey(0);
    handledQuizKey.current = null;
  }, [text.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = dictCode || DICT_LANG_CODE[contentLang] || 'en';
      const to = UI_TRANSLATE_CODE[uiLang] || 'en';
      if (from === to) {
        const defs: Record<string, string> = {};
        for (const v of text.vocabulary || []) {
          defs[v.word] = v.definition || v.word;
          defs[v.word.toLowerCase()] = v.definition || v.word;
        }
        if (!cancelled) {
          setTranslations(defs);
          setLoading(false);
        }
        return;
      }
      const glosses: Record<string, string> = {};
      for (const v of text.vocabulary || []) {
        if (v.definition) {
          glosses[v.word] = v.definition;
          glosses[v.word.toLowerCase()] = v.definition;
        }
      }
      const map = await fetchWordTranslations(words, from, to, glosses);
      const merged: Record<string, string> = {};
      for (const w of words) {
        const key = w.toLowerCase();
        const val = map[w] || map[key] || glosses[w] || glosses[key] || w;
        merged[w] = val;
        merged[key] = val;
      }
      if (!cancelled) {
        setTranslations(merged);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [text.id, contentLang, uiLang, dictCode, words.join('|')]);

  const passageVocab = useMemo(() => {
    const entries = (text.vocabulary || []).map((v) => {
      const key = v.word.toLowerCase();
      return [v.word, { definition: translations[key] || translations[v.word] || v.definition, timestamp: Date.now() }];
    });
    return Object.fromEntries(entries);
  }, [text.vocabulary, translations]);

  const handleQuizComplete = (result: any) => {
    if (handledQuizKey.current === quizKey) return;
    handledQuizKey.current = quizKey;
    // Always score against the full lesson vocabulary list — never inflate %
    // from a short quiz that dropped words missing translations.
    const expectedTotal = Math.max(1, words.length);
    const scoreCount = typeof result.score === 'number' ? result.score : (result.correctWords?.length || 0);
    const finalPct = Math.min(100, Math.max(0, Math.round((scoreCount / expectedTotal) * 100)));
    const passed = onQuizComplete({
      ...result,
      percent: finalPct,
      score: scoreCount,
      total: expectedTotal,
    });
    if (!passed) {
      playSound('fail');
      setFailScore(finalPct);
    }
  };

  const tryAgain = () => {
    setFailScore(null);
    handledQuizKey.current = null;
    setQuizKey((k) => k + 1);
  };

  const reviewWords = () => {
    setFailScore(null);
    handledQuizKey.current = null;
    setStep('learn');
  };

  if (step === 'quiz') {
    return (
      <div className="relative min-h-[50vh]">
        <DefinitionQuiz
          key={quizKey}
          savedVocab={passageVocab}
          meanings={translations}
          allVocabMap={allVocabMap}
          hideTranslate
          hideBack
          disableSession
          keepAllWords
          onBack={() => setStep('learn')}
          onComplete={handleQuizComplete}
          recordExercise={undefined}
        />

        {failScore != null && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="vocab-fail-title"
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={tryAgain}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h2 id="vocab-fail-title" className="text-2xl font-serif font-bold text-zinc-900 mb-2">
                Almost there
              </h2>
              <p className="text-slate-500 mb-1">
                You scored <span className="font-bold text-zinc-800">{failScore}%</span>.
              </p>
              <p className="text-slate-500 mb-6">
                You need <span className="font-bold text-zinc-800">{LESSON_PASS_THRESHOLD}%</span> to unlock the passage.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={tryAgain}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-black transition-colors"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={reviewWords}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Review words
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading translations…
      </div>
    );
  }

  const current = text.vocabulary[index];
  const allLearned = learned.size >= words.length && words.length > 0;
  const translation = current
    ? translations[current.word.toLowerCase()] || current.definition
    : '';

  const markMemorized = () => {
    if (!current) return;
    const key = current.word.toLowerCase();
    const def = translations[key] || current.definition || current.word;
    playSound('success');
    onMemorizeWord(current.word, def);
    setLearned((prev) => new Set([...prev, key]));
    if (index < text.vocabulary.length - 1) setIndex(index + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-medium">
        <ArrowLeft className="w-5 h-5" /> Library
      </button>

      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Vocabulary</p>
      <h2 className="text-3xl font-serif font-black text-zinc-900 mb-2">Learn these words</h2>
      <p className="text-slate-500 mb-8">
        Hear each word and learn its meaning. Score ≥{LESSON_PASS_THRESHOLD}% on the quiz to unlock reading.
      </p>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-2 mb-6">
        {text.vocabulary.map((v, i) => (
          <button
            key={v.word}
            onClick={() => setIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
              learned.has(v.word.toLowerCase())
                ? 'bg-emerald-500 text-white border-emerald-500'
                : i === index
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {current && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 md:p-12 text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            {index + 1} / {text.vocabulary.length}
          </p>
          <h3 className="text-4xl md:text-5xl font-serif font-black text-zinc-900 mb-4">{current.word}</h3>
          <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-8">
            {translation}
          </p>
          <button
            onClick={() => playWord(current.word)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-900"
          >
            <Volume2 className="w-5 h-5" /> Hear word
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="px-4 py-3 rounded-xl border font-bold disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={markMemorized}
          className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Memorized
        </button>
        <button
          disabled={index >= text.vocabulary.length - 1}
          onClick={() => setIndex((i) => Math.min(text.vocabulary.length - 1, i + 1))}
          className="px-4 py-3 rounded-xl border font-bold disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <button
        disabled={!allLearned}
        onClick={() => { setFailScore(null); setQuizKey((k) => k + 1); handledQuizKey.current = null; setStep('quiz'); }}
        className="mt-6 w-full py-3.5 rounded-xl bg-zinc-900 text-white font-bold disabled:opacity-40"
      >
        {allLearned
          ? 'Start vocabulary quiz'
          : `Learn all words first (${learned.size}/${words.length})`}
      </button>
    </div>
  );
}
