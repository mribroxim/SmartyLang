import { answerFeedback } from '../../lib/smarty/answer';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import type { ReadingText, WordStatus } from '../../lib/reading-logic';
import { alignWords } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import { tokenizeForLang } from '../../lib/pronunciationProfile';
import { splitSentences } from './generators';
import { playSound } from '../../lib/audio';
import { useVosk, isMobileDevice } from '../../hooks/useVosk';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';

interface Props {
  text: ReadingText;
  contentLang: ContentLang;
  onBack: () => void;
  onComplete: (result: {
    type: string;
    score: number;
    total: number;
    mistakes: string[];
    correctWords: string[];
  }) => void;
  /** Bite-sized sessions: how many sentences, starting where. */
  maxItems?: number;
  sentenceOffset?: number;
  focusMode?: boolean;
}

/** Sentence-level reading pronunciation: Web Speech + live highlight + auto-end. */
export function ReadBackShadowing({ text, contentLang, onBack: _onBack, onComplete, maxItems = 8, sentenceOffset = 0, focusMode = false }: Props) {
  const { speechLocale } = useContentLang();
  const { t } = useUiLang();
  const sentences = useMemo(
    () => splitSentences(text.text, text.format).slice(sentenceOffset, sentenceOffset + maxItems),
    [text.text, text.format, maxItems, sentenceOffset],
  );
  const { startRecognition, stopRecognition, isReady, modelLoading } = useVosk(speechLocale);
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const speechFailed = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [statuses, setStatuses] = useState<WordStatus[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const finalRef = useRef('');
  const finishingRef = useRef(false);
  const indexRef = useRef(0);
  const passedRef = useRef(0);
  const correctRef = useRef<string[]>([]);
  const mistakesRef = useRef<string[]>([]);

  useEffect(() => () => { stopRecognition(); }, [stopRecognition]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { passedRef.current = passedCount; }, [passedCount]);
  useEffect(() => { correctRef.current = correctWords; }, [correctWords]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  if (!sentences.length) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <p className="text-slate-600">{t("learning.no.sentences.available.for.shadowing.d840b0")}</p>
      </div>
    );
  }

  const current = sentences[index];
  const sourceWords = tokenizeForLang(current, contentLang);
  const activeWordIndex = statuses.findIndex((s) => s === 'pending');

  const finishSentence = (heard: string) => {
    if (finishingRef.current) return;
    if (speechFailed.current || !heard.trim()) { stopRecognition(); setRecording(false); return; }
    finishingRef.current = true;
    stopRecognition();
    setRecording(false);
    const src = tokenizeForLang(sentences[indexRef.current], contentLang);
    const aligned = alignWords(src, tokenizeForLang(heard, contentLang), contentLang);
    setStatuses(aligned);
    const correct = src.filter((_, i) => aligned[i] === 'correct' || aligned[i] === 'slight_mistake');
    const wrong = src.filter((_, i) => aligned[i] === 'incorrect');
    const ratio = src.length ? correct.length / src.length : 0;
    const ok = ratio >= 0.8;
    const nextPassed = passedRef.current + (ok ? 1 : 0);
    const nextCorrect = [...correctRef.current, ...correct];
    const nextMistakes = [...new Set([...mistakesRef.current, ...wrong])];
    setPassedCount(nextPassed);
    setCorrectWords(nextCorrect);
    setMistakes(nextMistakes);
    if (ok) answerFeedback(true, { questionId: String(indexRef.current) });
    else answerFeedback(false, { questionId: String(indexRef.current), word: wrong[0] });

    setTimeout(() => {
      const next = indexRef.current + 1;
      if (next >= sentences.length) {
        playSound('complete');
        onComplete({
          type: 'read-back-shadowing',
          score: nextPassed,
          total: sentences.length,
          mistakes: nextMistakes,
          correctWords: nextCorrect,
        });
      } else {
        finishingRef.current = false;
        setIndex(next);
        setTranscript('');
        finalRef.current = '';
        setStatuses([]);
      }
    }, 900);
  };

  const evaluateLive = (heard: string) => {
    const src = tokenizeForLang(sentences[indexRef.current], contentLang);
    const aligned = alignWords(src, tokenizeForLang(heard, contentLang), contentLang);
    setStatuses(aligned);
    const pendingLeft = aligned.filter((s) => s === 'pending').length;
    const attempted = aligned.length - pendingLeft;
    // Auto-end once the sentence is fully attempted (reading-pronunciation style).
    if (src.length > 0 && pendingLeft === 0 && attempted >= src.length) {
      finishSentence(heard);
    }
  };

  const start = async () => {
    speechFailed.current = false;
    setMicError(false);
    finishingRef.current = false;
    finalRef.current = '';
    setTranscript('');
    setStatuses(sourceWords.map(() => 'pending' as WordStatus));
    setRecording(true);
    const mobile = isMobileDevice();
    const fail = () => { speechFailed.current = true; setMicError(true); setRecording(false); stopRecognition(); };
    try { await startRecognition(
      (finalText) => {
        const next = (finalRef.current + ' ' + finalText).trim();
        finalRef.current = next;
        setTranscript(next);
        evaluateLive(next);
      },
      (partial) => {
        const live = (finalRef.current + ' ' + partial).trim();
        setTranscript(live);
        evaluateLive(live);
      },
      !mobile,
      fail,
    ); } catch { fail(); }
  };

  const stopManual = () => {
    const heard = finalRef.current.trim() || transcript.trim();
    finishSentence(heard);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-36 md:pb-28">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t("learning.read.back.shadowing.c3cd30")}{' '}{index + 1} / {sentences.length}
      </div>
      <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">{t("lesson.saySentence")}</h2>
      {micError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-900 dark:text-amber-200">{t('bites.micUnavailable')}</p>}

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border-2 dark:border-zinc-700 p-6 md:p-10 mb-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]">
        <p className="text-xl md:text-2xl leading-relaxed text-slate-800 dark:text-zinc-100">
          {sourceWords.map((w, i) => {
            const status = statuses[i] || 'pending';
            const active = recording && i === (activeWordIndex < 0 ? sourceWords.length - 1 : activeWordIndex);
            let cls = 'me-2 mb-1 inline-block';
            if (status === 'correct') cls += ' text-emerald-600';
            else if (status === 'slight_mistake') cls += ' text-amber-600';
            else if (status === 'incorrect') cls += ' text-rose-600';
            if (active) cls += ' underline decoration-2 underline-offset-4';
            return <span key={i} className={cls}>{w}</span>;
          })}
        </p>
      </div>

      {(modelLoading || !isReady) && (
        <p className="text-sm text-slate-500 mb-4">{t("learning.preparing.microphone.0bbf4a")}</p>
      )}

      <div className={`fixed left-0 right-0 min-h-[64px] bg-white/95 dark:bg-zinc-950/95 border-t border-slate-200 dark:border-zinc-800 px-4 flex items-center z-30 ${focusMode ? 'bottom-0 pb-[env(safe-area-inset-bottom)]' : 'lg:left-64 xl:left-72 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0'}`}>
        <div className="max-w-3xl mx-auto flex justify-center">
          {!recording ? (
            <button
              onClick={start}
              disabled={!isReady || finishingRef.current}
              className="px-8 py-3 rounded-2xl bg-zinc-900 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75"
            >
              <Mic className="w-4 h-4" />{' '}{t("reading.comp.cta")}</button>
          ) : (
            <button
              onClick={stopManual}
              className="px-8 py-3 rounded-full bg-rose-600 text-white font-bold text-sm flex items-center gap-2"
            >
              <Square className="w-4 h-4" />{' '}{t("learning.stop.9e2534")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
