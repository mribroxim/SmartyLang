import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Volume2, Snail, X, MicOff } from 'lucide-react';
import { Sticker, type StickerId } from '../../../components/stickers/Sticker';
import { useUiLang } from '../../../contexts/UiLangContext';
import { useContentLang } from '../../../contexts/ContentLangContext';
import { answerFeedback } from '../../../lib/smarty/answer';
import { useSmartyPrefs } from '../../../lib/smarty/prefs';
import { cancelSpeech, playWord, speakText } from '../../../lib/speech';
import type { UiStringKey } from '../../../lib/uiStrings';
import { ChunkyButton, Tile, type TileState } from './chunky';
import { gradeTyped, sameTiles, type Question } from './questions';
import { normalizeForMatch, tokenizeForLang } from '../../../lib/pronunciationProfile';
import type { ContentLang } from '../../../lib/contentLang';
import { SpeakPanel } from './SpeakPanel';
import { MAX_RETRIES, initialQueue, isRetryable, monotoneProgress, requeueMissed, variantForRetry } from './retryQueue';
import { acceptsReply } from '../../../lib/lessons/v2';

export interface LessonFeedback { id: number; sticker: StickerId; line: UiStringKey; vars: Record<string, string | number> }

interface Props {
  questions: Question[];
  /** Smarty's latest reaction (from the bite's director), shown in the feedback sheet. */
  feedback: LessonFeedback | null;
  /** Sticker Smarty uses to present the questions in this step. */
  presenter: StickerId;
  /** Step title, e.g. "Pick the meaning". */
  title: string;
  onComplete: (result: { score: number; total: number; mistakes: string[]; correctWords: string[] }) => void;
  /** Share of this step's questions answered (0–1), for the lesson progress bar. */
  onProgress?: (fraction: number) => void;
  /** Speaking steps: skip the whole step ("Can't speak now"). */
  onSkip?: () => void;
  /** Re-ask wrong answers later in the step (default true). Off for tests and hearts practice. */
  retryMisses?: boolean;
}

/** Word-by-word grade for a sentence (dictation): right/wrong source tokens and the ratio right. */
function gradeSentence(attempt: string, target: string, lang: ContentLang) {
  const src = tokenizeForLang(target, lang);
  const a = tokenizeForLang(attempt, lang).map((w) => normalizeForMatch(w, lang));
  const tk = src.map((w) => normalizeForMatch(w, lang));
  const right: string[] = [];
  const wrong: string[] = [];
  // Tolerant within a small window, so one missing word doesn't fail the rest.
  let j = 0;
  for (let i = 0; i < tk.length; i++) {
    const k = a.slice(j, j + 3).indexOf(tk[i]);
    if (k >= 0) { right.push(src[i]); j += k + 1; } else wrong.push(src[i]);
  }
  // Extra words count against the answer too (typing more than you heard isn't right).
  return { right, wrong, ratio: tk.length ? right.length / Math.max(tk.length, a.length) : 0 };
}

type Status = 'answering' | 'correct' | 'wrong';

/**
 * The lesson loop: Smarty presents a question, the learner picks/builds/types
 * an answer, presses Check, and a green or red sheet slides up with Smarty's
 * reaction and Continue.
 */
export function LessonRunner({ questions, feedback, presenter, title, onComplete, onProgress, onSkip, retryMisses = true }: Props) {
  const { t } = useUiLang();
  const { autoplayVoice } = useSmartyPrefs();
  const { speechLocale, contentLang } = useContentLang();
  // Position in the queue; a wrong answer puts its question back at the end (fix it before you finish).
  const [idx, setIdx] = useState(0);
  const [queue, setQueue] = useState(() => initialQueue(questions.length));
  const variants = useRef(new Map<string, Question>());
  const shownProgress = useRef(0);
  const [status, setStatus] = useState<Status>('answering');
  const [choice, setChoice] = useState<string | null>(null);
  const [tf, setTf] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [close, setClose] = useState(false);
  const [pairsDone, setPairsDone] = useState(false);
  // One entry per graded question (word '' for sentence questions), plus word-level hits from sentences.
  const results = useRef<{ word: string; ok: boolean }[]>([]);
  const tokens = useRef<{ right: Set<string>; wrong: Set<string> }>({ right: new Set(), wrong: new Set() });
  const finished = useRef(false);
  const item = queue[idx];
  const isRetry = !!item && item.attempt > 0;
  // A retried question keeps its text but shows its options in a new order (made once per retry).
  const q = useMemo(() => {
    if (!item) return undefined;
    const base = questions[item.qi];
    if (!base || item.attempt === 0) return base;
    const key = `${item.qi}:${item.attempt}`;
    let v = variants.current.get(key);
    if (!v) { v = variantForRetry(base); variants.current.set(key, v); }
    return v;
  }, [item, questions]);
  const reportProgress = (fraction: number) => {
    shownProgress.current = monotoneProgress(shownProgress.current, fraction);
    onProgress?.(shownProgress.current);
  };

  const say = useCallback((text: string, slow = false) => {
    if (!text) return;
    if (/\s/.test(text.trim())) speakText(text, slow ? 0.7 : 1, speechLocale);
    else playWord(text, slow ? 0.7 : 1, speechLocale);
  }, [speechLocale]);

  // Fresh answer state per question; audio questions speak on arrival.
  useEffect(() => {
    setStatus('answering'); setChoice(null); setTf(null); setPicked([]); setTyped(''); setClose(false); setPairsDone(false);
    if (!q || !autoplayVoice) return;
    const auto = q.type === 'choice' && (q.prompt === 'audio' || q.prompt === 'word' || q.prompt === 'cloze') ? q.show
      : q.type === 'tiles' && q.audio ? q.audio
      : q.type === 'tiles' && q.scene ? q.scene.text
      : q.type === 'reply' ? q.smarty
      : q.type === 'type' && q.sentence ? q.answer
      : q.type === 'tf' ? q.word
      : q.type === 'speak' ? q.target : '';
    if (auto) {
      const id = window.setTimeout(() => say(auto), 350);
      return () => { window.clearTimeout(id); cancelSpeech(); };
    }
  }, [idx, q, say, autoplayVoice]);

  const ready = !q ? false
    : q.type === 'choice' ? choice != null
    : q.type === 'tf' ? tf != null
    : q.type === 'tiles' ? (q.mode === 'letters' ? picked.length === q.tiles.length : picked.length > 0)
    : q.type === 'type' || q.type === 'reply' ? typed.trim().length > 0
    : q.type === 'pairs' ? pairsDone
    : false;

  const check = () => {
    if (!q || status !== 'answering' || !ready || q.type === 'pairs' || q.type === 'speak') return;
    let ok = false; let near = false; let missed: string | undefined;
    if (q.type === 'choice') ok = choice === q.answer;
    else if (q.type === 'tf') ok = tf === q.answer;
    else if (q.type === 'tiles') ok = sameTiles(picked.map((i) => q.tiles[i]), q.answer);
    else if (q.type === 'type' && q.sentence) {
      const g = gradeSentence(typed, q.answer, contentLang);
      ok = g.ratio >= 0.8; near = ok && g.ratio < 1; missed = g.wrong[0];
      if (!isRetry) {
        g.right.forEach((w) => tokens.current.right.add(w.toLowerCase()));
        g.wrong.forEach((w) => tokens.current.wrong.add(w.toLowerCase()));
      }
    } else if (q.type === 'type') {
      // Several answers can be right (e.g. "Bye" or "Goodbye"): take the best grade.
      for (const a of q.answers?.length ? q.answers : [q.answer]) { const g = gradeTyped(typed, a); if (g.ok) { ok = true; near = g.close; if (!g.close) break; } }
    } else if (q.type === 'reply') ok = acceptsReply(typed, q.accept, q.keys, contentLang);
    finishQuestion(ok, near, missed);
  };

  /** Record one graded answer: Smarty reacts (and may charge a heart), the sheet slides up. */
  const finishQuestion = (ok: boolean, near: boolean, missed?: string) => {
    if (!q) return;
    const sentenceLevel = (q.type === 'tiles' && q.mode === 'words') || (q.type === 'type' && !!q.sentence) || (q.type === 'speak' && q.mode === 'sentence');
    setClose(near);
    // Only the first try counts toward the score; fixing it later still clears the question.
    if (!isRetry) results.current.push({ word: sentenceLevel ? '' : (q.type === 'pairs' ? '' : q.word), ok });
    answerFeedback(ok, { questionId: q.id, word: sentenceLevel ? missed : (q.type === 'pairs' ? undefined : q.word || undefined), close: near, retry: isRetry });
    setStatus(ok ? 'correct' : 'wrong');
    reportProgress((idx + 1) / (queue.length + (ok || !retryMisses || !isRetryable(q) || item.attempt >= MAX_RETRIES ? 0 : 1)));
  };

  const next = () => {
    if (status === 'answering' && !(q?.type === 'pairs' && pairsDone)) return;
    let nextQueue = queue;
    // Wrong → it comes back a few questions later (twice at most). Speaking is never forced: the mic can mishear.
    if (retryMisses && status === 'wrong' && q && isRetryable(q)) {
      nextQueue = requeueMissed(queue, idx);
      if (nextQueue !== queue) setQueue(nextQueue);
    }
    if (idx + 1 < nextQueue.length) { setIdx(idx + 1); return; }
    if (finished.current) return;
    finished.current = true;
    const all = results.current;
    const mistakes: string[] = Array.from(new Set<string>([...all.filter((r) => !r.ok && r.word).map((r) => r.word), ...tokens.current.wrong]));
    const correctWords: string[] = Array.from(new Set<string>([...all.filter((r) => r.ok && r.word).map((r) => r.word), ...tokens.current.right])).filter((w) => !mistakes.includes(w));
    if (q?.type === 'pairs') {
      const graded = new Set(all.map((r) => r.word)).size;
      const slipped = new Set(all.filter((r) => !r.ok).map((r) => r.word)).size;
      onComplete({ score: Math.max(0, graded - slipped), total: Math.max(1, graded), mistakes, correctWords });
    } else {
      onComplete({ score: all.filter((r) => r.ok).length, total: Math.max(1, questions.length), mistakes, correctWords });
    }
  };

  // Keyboard: 1–9 pick, Enter checks / continues, Backspace removes the last tile.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'Enter') {
        e.preventDefault();
        if (status === 'answering' && !(q?.type === 'pairs' && pairsDone)) check(); else next();
        return;
      }
      if (typing || status !== 'answering' || !q) return;
      const n = Number(e.key);
      if (q.type === 'choice' && n >= 1 && n <= q.options.length) setChoice(q.options[n - 1]);
      if (q.type === 'tf' && (n === 1 || n === 2)) setTf(n === 1);
      if (q.type === 'tiles' && e.key === 'Backspace') setPicked((p) => p.slice(0, -1));
      // Letter tiles: typing a letter picks the first unused matching tile.
      if (q.type === 'tiles' && q.mode === 'letters' && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        setPicked((p) => {
          const i = q.tiles.findIndex((tl, n) => tl.toLowerCase() === k && !p.includes(n));
          return i < 0 ? p : [...p, i];
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!q) return null;
  const locked = status !== 'answering';
  const good = status === 'correct' || (q.type === 'pairs' && pairsDone);

  const tileState = (selected: boolean, isAnswer: boolean): TileState => {
    if (!locked) return selected ? 'selected' : 'idle';
    if (isAnswer) return 'correct';
    return selected ? 'wrong' : 'dim';
  };

  const answerText = q.type === 'speak' ? q.target : q.type === 'choice' ? q.answer
    : q.type === 'tf' ? (q.answer ? t('lesson.true') : t('lesson.false'))
    : q.type === 'tiles' ? q.answer.join(q.mode === 'letters' ? '' : ' ')
    : q.type === 'type' ? q.answer
    : q.type === 'reply' ? q.example : '';

  const why = explain(q, t);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-44 pt-2 sm:pt-6">
        {isRetry && status === 'answering' && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-200">{t('lesson.previousMistake')}</div>
        )}
        <h1 className="font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
          {q.type === 'choice' && q.prompt === 'audio' ? t('lesson.whatDoYouHear') : q.type === 'type' && q.sentence ? t('bites.step.audio-dictation') : title}
        </h1>

        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {/* Smarty presents the question */}
            {q.type !== 'pairs' && (
              <div className="mt-5 flex items-end gap-2 sm:gap-3">
                <Sticker id={presenter} size="clamp(84px, 22vw, 124px)" priority="hero" mode="once" className="shrink-0" />
                <div className="relative mb-4 min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <span aria-hidden className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
                  <Bubble q={q} say={say} t={t} choice={choice} />
                </div>
              </div>
            )}

            {/* Answer area */}
            <div className="mt-6">
              {q.type === 'choice' && (
                <div className={`grid gap-3 ${q.prompt === 'audio' || (q.prompt === 'cloze' && q.options.every((o) => o.length < 24)) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {q.options.map((o, i) => (
                    <Tile key={o} hotkey={i + 1} disabled={locked} state={tileState(choice === o, o === q.answer)} onClick={() => setChoice(o)}
                      center={q.prompt === 'audio' || q.prompt === 'cloze'} className={q.prompt === 'audio' || q.prompt === 'cloze' ? 'text-lg' : ''}>
                      {o}
                    </Tile>
                  ))}
                </div>
              )}

              {q.type === 'tf' && (
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((v, i) => (
                    <Tile key={String(v)} hotkey={i + 1} disabled={locked} state={tileState(tf === v, v === q.answer)} onClick={() => setTf(v)} center className="py-5 text-lg">
                      {v ? t('lesson.true') : t('lesson.false')}
                    </Tile>
                  ))}
                </div>
              )}

              {q.type === 'tiles' && (
                <TileBuilder q={q} picked={picked} setPicked={setPicked} locked={locked} />
              )}

              {(q.type === 'type' || q.type === 'reply') && (
                <input aria-label={t('lesson.typeHere')}
                  autoFocus
                  value={typed}
                  disabled={locked}
                  onChange={(e) => setTyped(e.target.value)}
                  autoCapitalize="off" autoCorrect="off" spellCheck={false}
                  placeholder={t('lesson.typeHere')}
                  className={`w-full rounded-2xl border-2 bg-slate-50 px-4 py-4 text-xl font-semibold outline-none transition focus:border-zinc-900 focus:bg-white dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100 ${status === 'correct' ? 'border-emerald-500' : status === 'wrong' ? 'border-rose-500' : 'border-slate-200 dark:border-zinc-700'}`}
                />
              )}

              {q.type === 'speak' && (
                <SpeakPanel key={idx} target={q.target} mode={q.mode} lang={contentLang} locale={speechLocale} locked={locked}
                  onResult={(ok, right, wrong, near) => {
                    right.forEach((w) => tokens.current.right.add(w.toLowerCase()));
                    wrong.forEach((w) => tokens.current.wrong.add(w.toLowerCase()));
                    finishQuestion(ok, near, wrong[0]);
                  }} />
              )}

              {q.type === 'pairs' && (
                <Pairs key={idx} pairs={q.pairs} say={say} onMatch={(word, ok) => {
                  results.current.push({ word, ok });
                  answerFeedback(ok, { questionId: `pair:${word}`, word });
                }} onDone={() => { setPairsDone(true); reportProgress(1); }} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: Check → feedback sheet → Continue */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t-2 transition-colors duration-200 ${locked || (q.type === 'pairs' && pairsDone) ? (good ? 'border-transparent bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-rose-50 dark:bg-rose-950') : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'}`}>
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:flex-row sm:items-center sm:py-6">
          <AnimatePresence initial={false}>
            {(locked || (q.type === 'pairs' && pairsDone)) && (
              <motion.div
                key="sheet"
                initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="flex min-w-0 flex-1 items-center gap-3"
                role="status" aria-live="assertive"
              >
                {feedback ? (
                  <Sticker key={feedback.id} id={feedback.sticker} size={72} priority="hero" mode="once" className="shrink-0" />
                ) : (
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-900 ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {good ? <Check className="h-8 w-8" strokeWidth={3} /> : <X className="h-8 w-8" strokeWidth={3} />}
                  </span>
                )}
                <div className="min-w-0">
                  <div className={`font-serif text-xl font-extrabold ${good ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                    {good ? (close ? t('lesson.typo') : t('lesson.good')) : t('lesson.correctAnswer')}
                  </div>
                  {!good && <div className="break-words font-semibold text-rose-700 dark:text-rose-300">{why || answerText}</div>}
                  {good && close && <div className="font-semibold text-emerald-700 dark:text-emerald-300">{answerText}</div>}
                  
                  {feedback && good && <div className={`text-sm font-semibold ${good ? 'text-emerald-800/80 dark:text-emerald-200/80' : 'text-rose-800/80 dark:text-rose-200/80'}`}>{t(feedback.line, feedback.vars)}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!locked && !(q.type === 'pairs' && pairsDone) && <div className="hidden flex-1 sm:block" />}
          {q.type === 'speak' && !locked ? (
            onSkip ? <ChunkyButton tone="secondary" onClick={onSkip} className="w-full sm:w-auto"><MicOff className="h-4 w-4" /> {t('bites.cantSpeak')}</ChunkyButton> : null
          ) : q.type === 'pairs' && !pairsDone ? null : locked || (q.type === 'pairs' && pairsDone) ? (
            <ChunkyButton tone={good ? 'good' : 'bad'} onClick={next} autoFocus className="w-full sm:w-auto sm:min-w-[160px]">{t('smarty.continue')}</ChunkyButton>
          ) : (
            <ChunkyButton onClick={check} disabled={!ready} className="w-full sm:w-auto sm:min-w-[160px]">{t('lesson.check')}</ChunkyButton>
          )}
        </div>
      </div>
    </div>
  );
}

function Speak({ onClick, slow, label }: { onClick: () => void; slow?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-[0_4px_0_0_#000] transition active:translate-y-[4px] active:shadow-none dark-keep ${slow ? 'h-11 w-11' : 'h-14 w-14'}`}>
      {slow ? <Snail className="h-5 w-5" /> : <Volume2 className="h-7 w-7" />}
    </button>
  );
}

type T = (k: UiStringKey, v?: Record<string, string | number>) => string;
/** "…helps you." inside a sentence that ends with its own full stop. */
const bare = (s: string) => s.trim().replace(/[.。!]+$/u, '');

/** One line on why the right answer is right (shown after a wrong answer). */
function explain(q: Question, t: T): string {
  if ('why' in q && q.why) return q.why;
  if (q.type === 'reply') return t('lesson.why.example', { example: q.example });
  if (q.type === 'choice') {
    if (q.prompt === 'word') return t('lesson.why.means', { word: q.word, meaning: bare(q.answer) });
    if (q.prompt === 'meaning') return t('lesson.why.means', { word: q.answer, meaning: bare(q.show) });
    if (q.prompt === 'audio') return t('lesson.why.heard', { word: q.answer });
    if (q.prompt === 'cloze') return t('lesson.why.sentence', { sentence: q.show.replace('______', q.answer) });
    return '';
  }
  if (q.type === 'tf') return q.answer ? t('lesson.why.means', { word: q.word, meaning: bare(q.def) }) : t('lesson.why.notMeans', { word: q.word, meaning: bare(q.def) });
  if (q.type === 'tiles' && q.scene) return t('lesson.why.reply', { line: q.scene.text, reply: q.answer.join(' ') });
  if ((q.type === 'tiles' && q.mode === 'letters') || (q.type === 'type' && !q.sentence)) return q.hint ? t('lesson.why.means', { word: q.word, meaning: bare(q.hint) }) : '';
  return '';
}

function Bubble({ q, say, t, choice }: { q: Question; say: (s: string, slow?: boolean) => void; t: (k: UiStringKey, v?: Record<string, string | number>) => string; choice?: string | null }) {
  if (q.type === 'choice' && q.prompt === 'cloze') {
    const [before, ...rest] = q.show.split('______');
    return (
      <p className="text-lg font-semibold leading-relaxed text-zinc-800 dark:text-zinc-100">
        {before}
        <span className={`mx-1 inline-block min-w-[80px] border-b-2 px-1 text-center font-serif font-extrabold ${choice ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50' : 'border-slate-300 text-transparent'}`}>{choice || '…'}</span>
        {rest.join('______')}
      </p>
    );
  }
  if (q.type === 'choice' && q.prompt === 'ask') {
    return (
      <div>
        {q.image && <img src={q.image} alt="" className="mb-2 h-32 w-32 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <p className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{q.show}</p>
      </div>
    );
  }
  if (q.type === 'reply') {
    return (
      <div className="min-w-0">
        <button type="button" onClick={() => say(q.smarty)} className="flex items-start gap-2 text-left">
          <Volume2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{q.smarty}</span>
        </button>
        <div className="mt-2 text-sm font-bold text-slate-500">{q.hint}</div>
      </div>
    );
  }
  if (q.type === 'choice' && q.prompt === 'meaning') {
    return (
      <div>
        <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('today.chooseWord')}</div>
        <p className="mt-1 font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{q.show}</p>
      </div>
    );
  }
  if (q.type === 'tiles' && q.scene) {
    const scene = q.scene;
    return (
      <div className="min-w-0">
        <button type="button" onClick={() => say(scene.text)} className="flex items-start gap-2 text-left">
          <Volume2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
          <span className="min-w-0">
            {scene.speaker && <span className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">{scene.speaker}</span>}
            <span className="block text-lg font-semibold text-zinc-900 dark:text-zinc-50">{scene.text}</span>
          </span>
        </button>
        <div className="mt-2 text-sm font-bold text-slate-500">{t('lesson.yourReply')}</div>
      </div>
    );
  }
  if (q.type === 'choice' && q.prompt === 'text') {
    return <p className="font-semibold text-zinc-800 dark:text-zinc-100">{t('lesson.whichTrue')}</p>;
  }
  if (q.type === 'type' && q.sentence) {
    return (
      <div className="flex items-center gap-3">
        <Speak onClick={() => say(q.answer)} label={t('lesson.listen')} />
        <Speak onClick={() => say(q.answer, true)} slow label={t('lesson.listenSlow')} />
      </div>
    );
  }
  if (q.type === 'speak') {
    return (
      <div className="flex items-center gap-3">
        <Speak onClick={() => say(q.target)} label={t('lesson.listen')} />
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{t(q.mode === 'word' ? 'lesson.sayWord' : 'lesson.saySentence')}</span>
      </div>
    );
  }
  if (q.type === 'choice' && q.prompt === 'word') {
    return (
      <button type="button" onClick={() => say(q.show)} className="flex items-center gap-2 text-left">
        <Volume2 className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="font-serif text-2xl font-extrabold text-zinc-900 underline decoration-slate-300 decoration-dotted underline-offset-4 dark:text-zinc-50">{q.show}</span>
      </button>
    );
  }
  if (q.type === 'choice' || (q.type === 'tiles' && q.audio)) {
    const text = q.type === 'choice' ? q.show : q.audio!;
    return (
      <div className="flex items-center gap-3">
        <Speak onClick={() => say(text)} label={t('lesson.listen')} />
        <Speak onClick={() => say(text, true)} slow label={t('lesson.listenSlow')} />
      </div>
    );
  }
  if (q.type === 'tf') {
    return (
      <div className="text-zinc-900 dark:text-zinc-50">
        <button type="button" onClick={() => say(q.word)} className="font-serif text-xl font-extrabold underline decoration-slate-300 decoration-dotted underline-offset-4">{q.word}</button>
        <span className="mx-2 font-bold text-slate-400">=</span>
        <span className="font-semibold">{q.def}</span>
      </div>
    );
  }
  if (q.type === 'tiles' || (q.type === 'type' && !q.sentence)) {
    return (
      <div className="flex items-center gap-3">
        {q.type === 'type' && <Speak onClick={() => say(q.word)} label={t('lesson.listen')} />}
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{q.hint}</span>
      </div>
    );
  }
  return null;
}

function TileBuilder({ q, picked, setPicked, locked }: { q: Extract<Question, { type: 'tiles' }>; picked: number[]; setPicked: (f: (p: number[]) => number[]) => void; locked: boolean }) {
  const letters = q.mode === 'letters';
  const tile = `rounded-xl border-2 px-3 py-2 font-semibold transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${letters ? 'min-w-[44px] text-center text-xl font-serif font-extrabold' : 'text-base'}`;
  return (
    <div>
      <div className={`flex min-h-[64px] flex-wrap content-start gap-2 pb-3 ${letters ? 'justify-center border-b-2 border-slate-200 dark:border-zinc-800' : 'min-h-[116px]'}`} style={!letters ? { backgroundImage: 'linear-gradient(to bottom, transparent 55px, rgb(226 232 240 / 0.9) 55px, rgb(226 232 240 / 0.9) 57px, transparent 57px)', backgroundSize: '100% 58px' } : undefined}>
        {picked.map((i, pos) => (
          <motion.button layoutId={`tile-${q.id}-${i}`} key={i} type="button" disabled={locked}
            onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}
            className={`${tile} border-slate-200 bg-white text-zinc-900 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-[0_3px_0_0_#3f3f46]`}>
            {q.tiles[i]}
          </motion.button>
        ))}
      </div>
      <div className={`mt-6 flex flex-wrap justify-center gap-2`}>
        {q.tiles.map((w, i) => {
          const used = picked.includes(i);
          return (
            <div key={i} className="relative">
              <div aria-hidden className={`${tile} border-slate-200 bg-slate-100 text-transparent dark:border-zinc-800 dark:bg-zinc-800`}>{w}</div>
              {!used && (
                <motion.button layoutId={`tile-${q.id}-${i}`} type="button" disabled={locked}
                  onClick={() => setPicked((p) => [...p, i])}
                  className={`${tile} absolute inset-0 border-slate-200 bg-white text-zinc-900 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-[0_3px_0_0_#3f3f46]`}>
                  {w}
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pairs({ pairs, say, onMatch, onDone }: { pairs: { word: string; def: string }[]; say: (s: string) => void; onMatch: (word: string, ok: boolean) => void; onDone: () => void }) {
  const right = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);
  const [left, setLeft] = useState<string | null>(null);
  const [rightSel, setRightSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [bad, setBad] = useState<{ l: string; r: string } | null>(null);
  const missed = useRef(new Set<string>());

  useEffect(() => {
    if (!left || !rightSel) return;
    const ok = left === rightSel;
    if (ok) {
      setMatched((m) => { const n = new Set(m).add(left); if (n.size === pairs.length) window.setTimeout(onDone, 250); return n; });
      if (!missed.current.has(left)) onMatch(left, true);
      setLeft(null); setRightSel(null);
    } else {
      // Count each word's first slip once.
      if (!missed.current.has(left)) { missed.current.add(left); onMatch(left, false); }
      setBad({ l: left, r: rightSel });
      const id = window.setTimeout(() => { setBad(null); setLeft(null); setRightSel(null); }, 650);
      return () => window.clearTimeout(id);
    }
  }, [left, rightSel]);

  const state = (side: 'l' | 'r', key: string): TileState => {
    if (matched.has(key)) return 'used';
    if (bad && (side === 'l' ? bad.l === key : bad.r === key)) return 'wrong';
    if ((side === 'l' ? left : rightSel) === key) return 'selected';
    return 'idle';
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {pairs.map((p) => (
          <Tile key={p.word} state={state('l', p.word)} disabled={matched.has(p.word) || !!bad} onClick={() => { setLeft(p.word); say(p.word); }} center className="min-h-[64px] font-serif font-extrabold">
            {p.word}
          </Tile>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {right.map((p) => (
          <Tile key={p.word} state={state('r', p.word)} disabled={matched.has(p.word) || !!bad} onClick={() => setRightSel(p.word)} className="min-h-[64px] text-sm">
            {p.def}
          </Tile>
        ))}
      </div>
    </div>
  );
}
