import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { alignWords, type WordStatus } from '../../../lib/reading-logic';
import { tokenizeForLang } from '../../../lib/pronunciationProfile';
import type { ContentLang } from '../../../lib/contentLang';
import { useVosk, isMobileDevice } from '../../../hooks/useVosk';
import { playSound } from '../../../lib/audio';
import { useUiLang } from '../../../contexts/UiLangContext';

/**
 * Speaking: the learner taps the mic and says the word/sentence; words light up
 * as they're heard and the answer is graded when everything was attempted (or
 * they tap the mic again). Hearing nothing is not an answer: they can just retry.
 */
export function SpeakPanel({ target, mode, lang, locale, locked, onResult }: {
  target: string;
  mode: 'word' | 'sentence';
  lang: ContentLang;
  locale: string;
  locked: boolean;
  onResult: (ok: boolean, right: string[], wrong: string[], near: boolean) => void;
}) {
  const { t } = useUiLang();
  const { startRecognition, stopRecognition, isReady, modelLoading } = useVosk(locale);
  const src = useMemo(() => tokenizeForLang(target, lang), [target, lang]);
  const [statuses, setStatuses] = useState<WordStatus[]>([]);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState(false);
  const finalRef = useRef('');
  const doneRef = useRef(false);
  const failed = useRef(false);

  useEffect(() => () => { stopRecognition(); }, [stopRecognition]);

  const finish = (heard: string) => {
    if (doneRef.current) return;
    stopRecognition();
    setRecording(false);
    if (failed.current || !heard.trim()) { setStatuses([]); return; }
    doneRef.current = true;
    const aligned = alignWords(src, tokenizeForLang(heard, lang), lang);
    setStatuses(aligned);
    const right = src.filter((_, i) => aligned[i] === 'correct' || aligned[i] === 'slight_mistake');
    const wrong = src.filter((_, i) => aligned[i] !== 'correct' && aligned[i] !== 'slight_mistake');
    const ratio = src.length ? right.length / src.length : 0;
    const ok = ratio >= 0.8;
    onResult(ok, right, wrong, ok && aligned.some((a) => a === 'slight_mistake'));
  };

  const live = (heard: string) => {
    const aligned = alignWords(src, tokenizeForLang(heard, lang), lang);
    setStatuses(aligned);
    if (src.length && !aligned.includes('pending')) finish(heard);
  };

  const start = async () => {
    if (recording || locked) return;
    failed.current = false;
    doneRef.current = false;
    finalRef.current = '';
    setMicError(false);
    setStatuses(src.map(() => 'pending' as WordStatus));
    setRecording(true);
    playSound('start_record');
    const fail = () => { failed.current = true; setMicError(true); setRecording(false); stopRecognition(); };
    try {
      await startRecognition(
        (finalText) => { finalRef.current = `${finalRef.current} ${finalText}`.trim(); live(finalRef.current); },
        (partial) => live(`${finalRef.current} ${partial}`.trim()),
        !isMobileDevice(),
        fail,
      );
    } catch { fail(); }
  };

  const tone = (st?: WordStatus) => st === 'correct' ? 'text-emerald-600 dark:text-emerald-400'
    : st === 'slight_mistake' ? 'text-amber-600 dark:text-amber-400'
    : st === 'incorrect' ? 'text-rose-600 dark:text-rose-400'
    : 'text-zinc-900 dark:text-zinc-50';

  return (
    <div className="flex flex-col items-center">
      <div className="w-full rounded-3xl border-2 border-slate-200 bg-white p-5 text-center shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46]">
        <p className={`font-serif font-extrabold leading-snug ${mode === 'word' ? 'text-4xl' : 'text-xl sm:text-2xl'}`}>
          {src.map((w, i) => (
            <span key={i} className={`${tone(statuses[i])} transition-colors`}>{w}{i < src.length - 1 ? ' ' : ''}</span>
          ))}
        </p>
      </div>
      {micError && (
        <p role="alert" className="mt-4 w-full rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t('bites.micUnavailable')}
        </p>
      )}
      {!locked && (
        <>
          <button
            type="button"
            onClick={recording ? () => finish(finalRef.current) : start}
            disabled={!isReady && !recording}
            aria-label={recording ? t('lesson.tapToStop') : t('lesson.tapToSpeak')}
            className={`relative mt-8 flex h-24 w-24 items-center justify-center rounded-full transition active:translate-y-[5px] active:shadow-none disabled:opacity-40 dark-keep ${recording
              ? 'bg-rose-500 text-white shadow-[0_5px_0_0_#be123c]'
              : 'bg-zinc-900 text-white shadow-[0_5px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_5px_0_0_#a1a1aa]'}`}
          >
            {recording && <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/40" />}
            <Mic className="relative h-10 w-10" />
          </button>
          <p className="mt-3 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-400">
            {modelLoading || !isReady ? t('lesson.micPreparing') : recording ? t('lesson.tapToStop') : t('lesson.tapToSpeak')}
          </p>
        </>
      )}
    </div>
  );
}
