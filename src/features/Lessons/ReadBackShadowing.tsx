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
}

/** Sentence-level reading pronunciation: Web Speech + live highlight + auto-end. */
export function ReadBackShadowing({ text, contentLang, onBack: _onBack, onComplete }: Props) {
  const { speechLocale } = useContentLang();
  const sentences = useMemo(() => splitSentences(text.text).slice(0, 8), [text.text]);
  const { startRecognition, stopRecognition, isReady, modelLoading } = useVosk(speechLocale);
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
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
        <p className="text-slate-600">No sentences available for shadowing.</p>
      </div>
    );
  }

  const current = sentences[index];
  const sourceWords = tokenizeForLang(current, contentLang);
  const activeWordIndex = statuses.findIndex((s) => s === 'pending');

  const finishSentence = (heard: string) => {
    if (finishingRef.current) return;
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
    if (ok) playSound('success');
    else playSound('fail');

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
    finishingRef.current = false;
    finalRef.current = '';
    setTranscript('');
    setStatuses(sourceWords.map(() => 'pending' as WordStatus));
    setRecording(true);
    const mobile = isMobileDevice();
    await startRecognition(
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
    );
  };

  const stopManual = () => {
    const heard = finalRef.current.trim() || transcript.trim();
    finishSentence(heard);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-36 md:pb-28">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Read-back Shadowing · {index + 1} / {sentences.length}
      </div>
      <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">Read this sentence aloud</h2>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-700 p-6 md:p-10 shadow-xl mb-6">
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
        <p className="text-sm text-slate-500 mb-4">Preparing microphone…</p>
      )}

      <div className="fixed left-0 right-0 lg:left-64 xl:left-72 h-[64px] bg-white/95 dark:bg-zinc-950/95 border-t border-slate-200 dark:border-zinc-800 px-4 flex items-center z-30 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0">
        <div className="max-w-3xl mx-auto flex justify-center">
          {!recording ? (
            <button
              onClick={start}
              disabled={!isReady || finishingRef.current}
              className="px-8 py-3 rounded-full bg-zinc-900 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40"
            >
              <Mic className="w-4 h-4" /> Start Reading
            </button>
          ) : (
            <button
              onClick={stopManual}
              className="px-8 py-3 rounded-full bg-rose-600 text-white font-bold text-sm flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
