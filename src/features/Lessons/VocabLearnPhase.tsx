import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { DICT_LANG_CODE } from '../../lib/contentLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { fetchWordTranslations } from '../../lib/wordTranslations';
import { useSmartyPrefs } from '../../lib/smarty/prefs';
import { cancelSpeech } from '../../lib/speech';
import { playSound } from '../../lib/audio';
import { Sticker } from '../../components/stickers/Sticker';
import { ChunkyButton } from '../Bites/lesson/chunky';

interface Props {
  text: ReadingText;
  playWord: (w: string) => void;
  onBack: () => void;
  hideBack?: boolean;
  continueLabel?: string;
  /** Unlock reading after the learner has seen the words. */
  onLearned: () => void;
  onMemorizeWord: (word: string, definition: string) => void;
  /** Bite look: one word per screen, Smarty presents it, chunky Continue footer. */
  variant?: 'lesson';
}

/** Pre-read: word + interface-language translation. Quiz happens after reading. */
export function VocabLearnPhase({
  text, playWord, onBack, onLearned, onMemorizeWord, hideBack, continueLabel, variant,
}: Props) {
  const { contentLang, dictCode } = useContentLang();
  const { uiLang, t } = useUiLang();
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

  const { autoplayVoice } = useSmartyPrefs();
  const spokenWord = text.vocabulary[index]?.word;
  useEffect(() => {
    if (loading || !autoplayVoice || !spokenWord || variant !== 'lesson') return;
    playWord(spokenWord);
    return cancelSpeech;
  }, [spokenWord, loading, variant, autoplayVoice]);

  if (loading && variant === 'lesson') {
    return <div className="flex justify-center py-24"><Sticker id="flow.lesson-loading" size={120} priority="hero" /></div>;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />{' '}{t("learning.loading.translations.53f24b")}</div>
    );
  }

  const current = text.vocabulary[index];
  const allLearned = words.length === 0
    || (index >= words.length - 1 && learned.size >= words.length - 1);
  const translation = current
    ? translations[current.word.toLowerCase()] || translations[current.word] || current.word
    : '';

  const markCurrentLearned = () => {
    if (!current) return;
    const key = current.word.toLowerCase();
    if (learned.has(key)) return;
    const gloss = translations[key] || translations[current.word] || current.word;
    // Seeing a word card isn't an answer: keep it out of Smarty's combo counter.
    playSound('success', { mascot: false });
    onMemorizeWord(current.word, gloss);
    setLearned((prev) => new Set([...prev, key]));
  };

  const goNext = () => {
    markCurrentLearned();
    setIndex((i) => Math.min(text.vocabulary.length - 1, i + 1));
  };

  if (variant === 'lesson' && current) {
    const last = index >= text.vocabulary.length - 1;
    const next = () => {
      markCurrentLearned();
      if (last) onLearned();
      else setIndex(index + 1);
    };
    return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-40 pt-2 sm:pt-6">
          <div className="font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('lesson.newWord')} · {index + 1}/{text.vocabulary.length}</div>
          <h1 className="mt-1 font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">{t('bites.step.vocab-intro')}</h1>
          <div key={current.word} className="mt-6 flex flex-col items-center text-center">
            <Sticker id={index % 3 === 0 ? 'pers.curious' : index % 3 === 1 ? 'vocab.word-explosion' : 'learn.word-nerd'} size="clamp(110px, 30vw, 160px)" priority="hero" mode="once" />
            <div className="mt-3 w-full rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46]">
              <button type="button" onClick={() => playWord(current.word)} className="inline-flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-[0_4px_0_0_#000] transition active:translate-y-[4px] active:shadow-none dark-keep"><Volume2 className="h-6 w-6" /></span>
                <span className="font-serif text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-5xl">{current.word}</span>
              </button>
              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-600 dark:text-zinc-300">{translation}</p>
            </div>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-2xl gap-3 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:py-6">
            {index > 0 && <ChunkyButton tone="secondary" onClick={() => setIndex(index - 1)} aria-label={t('lesson.prev')} className="!px-4">←</ChunkyButton>}
            <div className="hidden flex-1 sm:block" />
            <ChunkyButton autoFocus onClick={next} className="flex-1 sm:flex-none sm:min-w-[160px]">{last ? (continueLabel ?? t('smarty.continue')) : t('lesson.next')}</ChunkyButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {!hideBack && <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 font-medium">
        <ArrowLeft className="w-5 h-5" />{' '}{t("library.title")}</button>}

      <h2 className="text-5xl md:text-6xl font-serif font-black text-zinc-900 dark:text-zinc-50 mb-8">{t("learning.learn.the.word.be0c92")}</h2>

      {current && (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border-2 p-8 md:p-12 text-center mb-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]">
          <h3 className="text-5xl md:text-7xl font-serif font-black text-zinc-900 dark:text-zinc-50 mb-5">{current.word}</h3>
          <p className="text-2xl md:text-3xl text-slate-700 dark:text-zinc-200 font-medium leading-relaxed mb-9">
            {translation}
          </p>
          <button
            onClick={() => playWord(current.word)}
            className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-zinc-900 dark:text-zinc-50"
          >
            <Volume2 className="w-6 h-6" />{' '}{t("learning.hear.word.e3b3fa")}</button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="px-4 py-3 rounded-xl border font-bold disabled:opacity-40"
        >{t("learning.prev.e96fea")}</button>
        <button
          disabled={index >= text.vocabulary.length - 1}
          onClick={goNext}
          className="flex-1 py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold disabled:opacity-40 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75"
        >{t("lesson.next")}</button>
      </div>

      <button
        disabled={!allLearned}
        onClick={() => {
          markCurrentLearned();
          onLearned();
        }}
        className="mt-6 w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold disabled:opacity-40 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75"
      >
        {continueLabel ?? t("learning.continue.to.reading.9cf196")}
      </button>
    </div>
  );
}
