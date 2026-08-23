import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Volume2 } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { DICT_LANG_CODE } from '../../lib/contentLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { fetchWordTranslations } from '../../Exercises';
import { playSound } from '../../lib/audio';

interface Props {
  text: ReadingText;
  playWord: (w: string) => void;
  onBack: () => void;
  /** Unlock reading after the learner has seen the words. */
  onLearned: () => void;
  onMemorizeWord: (word: string, definition: string) => void;
}

/** Pre-read: word + interface-language translation. Quiz happens after reading. */
export function VocabLearnPhase({
  text, playWord, onBack, onLearned, onMemorizeWord,
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLearned(new Set());
    setIndex(0);
  }, [text.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = dictCode || DICT_LANG_CODE[contentLang] || 'en';
      const to = UI_TRANSLATE_CODE[uiLang] || 'en';
      const glosses: Record<string, string> = {};
      for (const v of text.vocabulary || []) {
        if (v.definition) {
          glosses[v.word] = v.definition;
          glosses[v.word.toLowerCase()] = v.definition;
        }
      }
      const map = from === to
        ? Object.fromEntries(
            (text.vocabulary || []).flatMap((v) => {
              const meaning = v.definition || v.word;
              return [[v.word, meaning], [v.word.toLowerCase(), meaning]] as [string, string][];
            }),
          )
        : await fetchWordTranslations(words, from, to, glosses);
      const merged: Record<string, string> = {};
      for (const w of words) {
        const key = w.toLowerCase();
        const val = map[w] || map[key] || w;
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
    ? translations[current.word.toLowerCase()] || translations[current.word] || current.word
    : '';

  const markMemorized = () => {
    if (!current) return;
    const key = current.word.toLowerCase();
    const gloss = translations[key] || translations[current.word] || current.word;
    playSound('success');
    onMemorizeWord(current.word, gloss);
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
        Hear each word and learn its translation. Then continue to the passage — the quiz is in Exercises after you read.
      </p>

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
                : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-zinc-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {current && (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl p-8 md:p-12 text-center mb-6">
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
        disabled={!allLearned && words.length > 0}
        onClick={onLearned}
        className="mt-6 w-full py-3.5 rounded-xl bg-zinc-900 text-white font-bold disabled:opacity-40"
      >
        {allLearned || words.length === 0
          ? 'Continue to reading'
          : `Learn all words first (${learned.size}/${words.length})`}
      </button>
    </div>
  );
}
