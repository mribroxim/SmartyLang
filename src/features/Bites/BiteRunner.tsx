import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Volume2, VolumeX, MicOff } from 'lucide-react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import type { BiteDef, BiteResult, BiteStep } from '../../lib/bites/types';
import { resultPercent, wordsOf } from '../../lib/bites/result';
import { BiteExercise } from './BiteExercise';
import { BiteComplete, type BiteAward } from './BiteComplete';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import { onSmarty, emitSmarty } from '../../lib/smarty/bus';
import { decide, newDirectorState, pickLine } from '../../lib/smarty/director';
import { setPrefs, useSmartyPrefs } from '../../lib/smarty/prefs';
import type { UiStringKey } from '../../lib/uiStrings';
import { clearBiteSession, loadBiteSession, saveBiteSession, type StepScore, type AnswerHistory } from '../../lib/bites/session';
import { learnerName } from '../../lib/smarty/context';
import { chargeFirstAttempt } from '../../lib/hearts/hearts';
import { ChunkyButton, ChunkyProgress } from './lesson/chunky';
import { NATIVE_KINDS } from './lesson/questions';
import type { LessonFeedback } from './lesson/LessonRunner';

// Per step kind, Smarty rotates through a few intro stickers (picked per lesson + step, so it is stable on resume).
const KIND_INTRO: Record<string, StickerId[]> = {
  'definition-quiz': ['game.quiz-show-host', 'vocab.translation-magic', 'vocab.dictionary-dive'],
  'word-match': ['vocab.word-magnet', 'game.memory-match', 'vocab.flashcard-flip'],
  'word-scramble': ['write.letter-builder', 'game.puzzle-solver', 'vocab.grammar-puzzle'],
  'listening-match': ['listen.sound-detective', 'listen.audio-radar', 'listen.listening-carefully'],
  'true-false-quiz': ['mood.hmm', 'game.word-race', 'vocab.memory-refresh'],
  'spelling-practice': ['write.spelling-bee', 'write.keyboard-ninja'],
  pronunciation: ['learn.fishbowl', 'speak.pronunciation-coach', 'speak.your-turn'],
  'sentence-reorder': ['write.sentence-architect', 'write.grammar-editor'],
  cloze: ['vocab.missing-word', 'read.highlight-hero', 'vocab.memory-master'],
  comprehension: ['read.reading-glasses', 'read.page-hunter', 'read.plot-twist'],
  'audio-dictation': ['listen.sound-catcher', 'listen.repeat-please', 'listen.slow-it-down'],
  'read-back-shadowing': ['speak.mic-ready', 'speak.voice-waves', 'listen.heard-that'],
  'vocab-intro': ['pers.curious', 'vocab.word-explosion'],
  'read-aloud': ['read.reading-glasses', 'read.speed-reader', 'read.lost-in-a-book'],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function introSticker(kind: string, key: string, idx: number, total: number, retry: boolean, firstEver: boolean): StickerId {
  if (retry) return idx % 2 ? 'speak.say-it-again' : 'feed.second-chance';
  if (idx === 0 && firstEver) return 'flow.first-lesson';
  if (total >= 4 && idx === total - 1) return 'flow.final-question';
  if (total >= 4 && idx === Math.floor(total / 2)) return 'flow.halfway-there';
  const pool = KIND_INTRO[kind];
  return pool ? pool[hashStr(`${key}:${idx}`) % pool.length] : 'mood.hi-there';
}

interface Props {
  text: ReadingText;
  def: BiteDef;
  contentLang: ContentLang;
  passageVocab: Record<string, any>;
  meanings: Record<string, string>;
  allVocabMap: Map<string, string>;
  /** Vocab cards for the given words; call done() when the learner has seen them. */
  renderVocabIntro: (words: string[], done: () => void) => ReactNode;
  /** The read-aloud screen. */
  renderRead: () => ReactNode;
  /** Read-aloud finished, with accuracy (0–100). */
  readResult: number | null;
  onReadStepChange?: (active: boolean) => void;
  /** Persist one step's score into the lesson record. */
  onStepScore: (s: StepScore) => void;
  /** Bite finished (award XP etc.). Called once. */
  onComplete: (r: BiteResult) => BiteAward | void;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
  /** Slot in the top bar (hearts chip). */
  topRight?: ReactNode;
  /** Wrong first-try answer in a step that costs hearts. Return false to pause the bite. */
  onMistake?: (word?: string) => boolean;
  /** Rendered over the bite when paused (e.g. out of hearts). */
  pausedOverlay?: ReactNode;
  paused?: boolean;
  retryMisses?: boolean;
  /** Learner has never finished a bite before (shows the First lesson sticker). */
  firstEver?: boolean;
}

interface Flash { id: number; sticker: StickerId; line: UiStringKey; vars: Record<string, string | number>; good: boolean }

/** Runs one bite: steps one by one, Smarty feedback per answer, retry round, reward screen. */
export function BiteRunner(props: Props) {
  const { def, text } = props;
  const { t } = useUiLang();
  const prefs = useSmartyPrefs();
  const [resume] = useState(() => loadBiteSession(props.contentLang, def));
  const [steps, setSteps] = useState<BiteStep[]>(resume?.steps ?? def.steps);
  const [idx, setIdx] = useState(resume?.index ?? 0);
  const [scores, setScores] = useState<StepScore[]>(resume?.scores ?? []);
  const [done, setDone] = useState<BiteResult | null>(null);
  const [award, setAward] = useState<BiteAward | null>(null);
  const [quit, setQuit] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [lessonFeedback, setLessonFeedback] = useState<LessonFeedback | null>(null);
  const [subProgress, setSubProgress] = useState(0);
  const startedAt = useRef(Date.now() - (resume?.elapsed ?? 0));
  const st = useRef(newDirectorState());
  const flashTimer = useRef<number | undefined>(undefined);
  const flashId = useRef(1);
  const completedOnce = useRef(false);
  const lastAdvanced = useRef(-1);
  const answered = useRef<Record<number, string[]>>(resume?.answered ?? {});
  const answerHistory = useRef<AnswerHistory>(resume?.answerHistory ?? { mistakes: [], hadWrong: false });
  const pausedRef = useRef(!!props.paused);
  const pendingScore = useRef<StepScore | null>(null);
  const step = steps[idx];
  const isRetry = !!step?.retry;
  // Quiz-style steps run on the lesson engine, which shows Smarty's reaction in its feedback sheet.
  const native = !!step && NATIVE_KINDS.has(step.kind);
  // Screens that bring their own lesson-style title and footer.
  const fullBleed = native || step?.kind === 'vocab-intro';

  useEffect(() => { emitSmarty({ type: 'session.start' }); }, []);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);
  useEffect(() => {
    if (!done && !completedOnce.current) saveBiteSession(props.contentLang, def, steps, idx, scores, Date.now() - startedAt.current, answered.current, answerHistory.current);
  }, [def, props.contentLang, steps, idx, scores, done]);
  useEffect(() => {
    if (!quit) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setQuit(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quit]);

  // Smarty reacts to every answer inside the bite (stage is hidden in focus mode).
  useEffect(() => {
    if (done) return;
    return onSmarty((e) => {
      if (e.type !== 'answer') return;
      const tried = new Set<string>(answered.current[idx] ?? []);
      const charge = chargeFirstAttempt(tried, e.questionId, e.correct, isRetry || e.retry);
      answered.current[idx] = [...tried];
      if (charge) {
        answerHistory.current.hadWrong = true;
        if (e.word) answerHistory.current.mistakes = [...new Set<string>([...answerHistory.current.mistakes, e.word.toLowerCase()])];
      }
      if (e.questionId) saveBiteSession(props.contentLang, def, steps, idx, scores, Date.now() - startedAt.current, answered.current, answerHistory.current);
      // Speaking steps are graded by speech recognition, which can mishear: never charge hearts there.
      const speechStep = step?.kind === 'pronunciation' || step?.kind === 'read-back-shadowing';
      if (charge && def.costsHearts && !speechStep && !pausedRef.current && props.onMistake && !props.onMistake(e.word)) pausedRef.current = true;
      const r = decide(e, st.current);
      if (native) {
        setLessonFeedback({
          id: flashId.current++,
          sticker: r?.sticker ?? (e.correct ? 'mood.yay' : 'feed.not-quite'),
          line: r?.line ?? pickLine(st.current, e.correct ? 'correct' : 'wrong'),
          vars: r?.vars ?? (learnerName() ? { name: learnerName()! } : {}),
        });
        return;
      }
      let f: Flash | null = r ? { id: flashId.current++, sticker: r.sticker, line: r.line, vars: r.vars, good: e.correct } : null;
      if (!f && prefs.liveliness !== 'off' && (!e.correct || Math.random() < 0.35)) {
        f = {
          id: flashId.current++,
          sticker: e.correct ? 'mood.yay' : 'feed.not-quite',
          line: pickLine(st.current, e.correct ? 'correct' : 'wrong'),
          vars: learnerName() ? { name: learnerName()! } : {},
          good: e.correct,
        };
      }
      if (!f) return;
      setFlash(f);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
    });
  }, [done, def.costsHearts, isRetry, native, props.onMistake, prefs.liveliness, idx, steps, scores]);
  useEffect(() => { setLessonFeedback(null); setSubProgress(0); }, [idx]);

  useEffect(() => { props.onReadStepChange?.(step?.kind === 'read-aloud' && !done); }, [step?.kind, done]);

  const finish = (all: StepScore[]) => {
    const graded = all.filter((s) => !s.skipped && s.kind !== 'vocab-intro');
    const first = graded.filter((s) => !s.retry);
    const accuracy = first.length ? Math.round(first.reduce((a, s) => a + s.percent, 0) / first.length) : 100;
    const mistakes = [...new Set([...first.flatMap((s) => s.mistakes), ...answerHistory.current.mistakes])];
    const correctWords = [...new Set(graded.flatMap((s) => s.correctWords))];
    const res: BiteResult = {
      def, accuracy, correctWords, mistakes,
      perfect: first.length > 0 && mistakes.length === 0 && !answerHistory.current.hadWrong && !all.some(s => s.skipped) && first.every((s) => s.percent === 100),
      recovered: mistakes.length >= 3 && accuracy >= 80,
      ms: Date.now() - startedAt.current,
    };
    setDone(res);
    if (!completedOnce.current) {
      completedOnce.current = true;
      clearBiteSession(props.contentLang, def);
      const a = props.onComplete(res);
      if (a) setAward(a);
      emitSmarty({ type: 'session.complete', accuracy: res.accuracy, perfect: res.perfect, mistakes: res.mistakes.length });
    }
  };

  const advance = (score: StepScore) => {
    // An exercise's finish timer may fire behind the empty-hearts sheet.
    if (pausedRef.current || props.paused) { pendingScore.current = score; return; }
    // Exercise timers or a double tap must not advance/award the same step twice.
    if (completedOnce.current || lastAdvanced.current === idx) return;
    lastAdvanced.current = idx;
    const all = [...scores, score];
    setScores(all);
    if (!score.skipped) props.onStepScore(score);
    const atEnd = idx + 1 >= steps.length;
    if (atEnd && props.retryMisses !== false && !steps.some((s) => s.retry)) {
      // Second chance: re-ask up to 3 missed words before finishing (never costs hearts).
      const missed = [...new Set(all.filter((s) => !s.retry).flatMap((s) => s.mistakes))]
        .filter((w) => props.passageVocab[w]).slice(0, 3);
      if (missed.length) {
        setSteps([...steps, { kind: 'definition-quiz', words: missed, retry: true }]);
        setIdx(idx + 1);
        return;
      }
    }
    if (atEnd) finish(all);
    else setIdx(idx + 1);
  };

  useEffect(() => {
    pausedRef.current = !!props.paused;
    if (!props.paused && pendingScore.current) {
      const score = pendingScore.current;
      pendingScore.current = null;
      advance(score);
    }
  }, [props.paused]);

  const onExerciseDone = (result: any) => {
    advance({
      kind: step.kind,
      percent: resultPercent(result),
      mistakes: wordsOf(result?.mistakes),
      correctWords: wordsOf(result?.correctWords),
      retry: step.retry,
    });
  };

  const progress = useMemo(() => (steps.length ? (idx + (done ? 1 : subProgress)) / steps.length : 0), [idx, steps.length, done, subProgress]);

  if (done) {
    return (
      <BiteComplete
        result={done}
        award={award}
        onContinue={props.onNext ?? props.onExit}
        continueLabel={props.nextLabel}
        onBack={props.onExit}
        title={text.title}
      />
    );
  }

  const speaking = step?.kind === 'pronunciation' || step?.kind === 'read-back-shadowing';

  return (
    <div className="min-h-dvh flex flex-col bg-white dark:bg-zinc-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-3 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3 sm:gap-4">
          <button type="button" onClick={() => setQuit(true)} aria-label={t('bites.quit')} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="w-6 h-6" />
          </button>
          <ChunkyProgress value={progress} />
          {props.topRight}
          <button type="button" onClick={() => setPrefs({ sound: !prefs.sound })} aria-label={t('settings.smarty.sound')} className="p-2 -mr-2 rounded-full text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            {prefs.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Step header (the lesson engine shows its own big title) */}
      <div className={`max-w-3xl mx-auto w-full px-4 pt-2 sm:pt-6 ${fullBleed ? 'hidden' : ''}`}>
        <h1 className="font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
          {isRetry ? t('bites.retry') : t(`bites.step.${step.kind}` as UiStringKey)}
        </h1>
        <div className="mt-3 flex items-end gap-2 sm:gap-3">
          <Sticker key={`${idx}-${step.kind}`} id={introSticker(step.kind, def.id, idx, steps.length, isRetry, !!props.firstEver)} size="clamp(72px, 18vw, 100px)" priority="hero" mode="once" className="shrink-0" />
          <div className="relative mb-3 min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <span aria-hidden className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
            {step.kind === 'read-aloud' ? t('lesson.readAloudHint') : t(`bites.kind.${def.kind}` as UiStringKey)}
          </div>
        </div>
        {speaking && (
          <button
            type="button"
            onClick={() => advance({ kind: step.kind, percent: 0, mistakes: [], correctWords: [], skipped: true })}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <MicOff className="w-4 h-4" /> {t('bites.cantSpeak')}
          </button>
        )}
      </div>

      {/* Step body */}
      <div inert={props.paused || undefined} aria-hidden={props.paused || undefined} className={`flex-1 w-full mx-auto flex flex-col ${fullBleed ? '' : 'max-w-3xl px-2 sm:px-4 pb-24'}`}>
        <motion.div key={`${idx}-${step.kind}`} className="flex flex-1 flex-col" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          {step.kind === 'vocab-intro' ? (
            props.renderVocabIntro(step.words ?? [], () => advance({ kind: 'vocab-intro', percent: 100, mistakes: [], correctWords: [] }))
          ) : step.kind === 'read-aloud' ? (
            props.renderRead()
          ) : (
            <BiteExercise
              key={idx}
              step={step}
              text={text}
              contentLang={props.contentLang}
              passageVocab={props.passageVocab}
              meanings={props.meanings}
              allVocabMap={props.allVocabMap}
              onComplete={onExerciseDone}
              feedback={lessonFeedback}
              presenter={introSticker(step.kind, def.id, idx, steps.length, isRetry, !!props.firstEver)}
              onProgress={setSubProgress}
              onSkip={speaking ? () => advance({ kind: step.kind, percent: 0, mistakes: [], correctWords: [], skipped: true }) : undefined}
              title={isRetry ? t('bites.retry') : t(`bites.step.${step.kind}` as UiStringKey)}
            />
          )}
        </motion.div>
      </div>

      {/* Read-aloud finished → continue */}
      {step.kind === 'read-aloud' && props.readResult != null && (
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30 bg-emerald-50 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:py-6 dark:bg-emerald-950"
          role="status" aria-live="polite"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Sticker id="read.reading-complete" size={72} priority="hero" mode="once" className="shrink-0" />
              <div className="min-w-0">
                <div className="font-serif text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{t('lesson.good')}</div>
                <div className="text-sm font-semibold text-emerald-800/80 dark:text-emerald-200/80">{t('bites.readDone', { n: props.readResult })}</div>
              </div>
            </div>
            <ChunkyButton tone="good" autoFocus onClick={() => advance({ kind: 'read-aloud', percent: props.readResult ?? 0, mistakes: [], correctWords: [] })} className="w-full sm:w-auto sm:min-w-[160px]">
              {t('smarty.continue')}
            </ChunkyButton>
          </div>
        </motion.div>
      )}

      {/* Smarty's per-answer feedback */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[min(92vw,420px)]"
            aria-live="polite"
          >
            <div className={`flex items-center gap-2 rounded-2xl border-2 bg-white dark:bg-zinc-900 p-2 pr-4 border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] ${flash.good ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-200 dark:border-zinc-700'}`}>
              <Sticker id={flash.sticker} size={64} priority="hero" />
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{t(flash.line, flash.vars)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {props.pausedOverlay}

      {/* Quit sheet */}
      <AnimatePresence>
        {quit && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/55 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuit(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-6 pb-[max(env(safe-area-inset-bottom),24px)] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center"><Sticker id={prefs.liveliness === 'lively' ? 'mood.unimpressed' : 'state.coffee-break'} size={130} priority="hero" /></div>
              <h2 className="mt-1 text-xl font-black text-zinc-900 dark:text-zinc-50">{t('bites.quitTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{t('bites.quitBody')}</p>
              <button type="button" autoFocus onClick={() => setQuit(false)} className="mt-5 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-black text-white shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">{t('bites.keepGoing')}</button>
              <button type="button" onClick={props.onExit} className="mt-2 w-full rounded-full py-3 text-sm font-bold text-rose-600">{t('bites.quitConfirm')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
