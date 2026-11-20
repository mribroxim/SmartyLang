import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Play, RotateCcw, Volume2, X } from 'lucide-react';
import type { Level, ReadingText } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import { fetchWordTranslations } from '../lib/wordTranslations';
import { useUiLang } from '../contexts/UiLangContext';
import { useContentLang } from '../contexts/ContentLangContext';
import { useProgress } from '../contexts/ProgressContext';
import { readPreferredTranslationLang } from '../lib/preferredTranslationLang';
import { normalizeForMatch, tokenizeForLang } from '../lib/pronunciationProfile';
import { playWord } from '../lib/speech';
import { todayKey } from '../lib/habitEngine';
import type { BiteDef, StepKind } from '../lib/bites/types';
import { seededPick } from '../lib/bites/deriveBites';
import type { UiStringKey } from '../lib/uiStrings';
import { Sticker, type StickerId } from '../components/stickers/Sticker';
import { BiteRunner } from './Bites/BiteRunner';
import { ChunkyButton, ChunkyProgress, Tile } from './Bites/lesson/chunky';

/** Smarty sticker per exercise. */
export const EXERCISE_STICKERS: Record<string, StickerId> = {
  flashcards: 'vocab.flashcard-flip', 'definition-quiz': 'game.quiz-show-host', 'listening-match': 'listen.ear-twitch',
  'true-false-quiz': 'mood.hmm', 'memory-match': 'game.memory-match', 'word-match': 'vocab.word-magnet',
  'spelling-practice': 'write.spelling-bee', pronunciation: 'speak.pronunciation-coach', 'word-scramble': 'write.letter-builder',
};

/** The exercises, in order (Practice lists them). */
export function exerciseCatalog(t: (k: UiStringKey) => string) {
  return (['flashcards', 'definition-quiz', 'listening-match', 'true-false-quiz', 'memory-match', 'word-match', 'spelling-practice', 'pronunciation', 'word-scramble'] as const)
    .map((id) => ({ id, title: t(`ex.${id}.title` as UiStringKey), desc: t(`ex.${id}.desc` as UiStringKey) }));
}

type Source = 'saved' | 'level' | 'topic' | 'custom';

interface ExercisesViewProps {
  savedVocab: Record<string, any>;
  allVocabMap: Map<string, string>;
  activeExercise: string | null;
  setActiveExercise: (ex: any) => void;
  selectedVocabWords: string[];
  setSelectedVocabWords: (fn: any) => void;
  showExerciseWordSelector: string | null;
  setShowExerciseWordSelector: (v: any) => void;
  exerciseSourceType: string;
  setExerciseSourceType: (v: any) => void;
  exerciseSourceLevel: Level;
  setExerciseSourceLevel: (v: any) => void;
  exerciseSourceTopic: string;
  setExerciseSourceTopic: (v: string) => void;
  exerciseSourceCustomTextSel: string;
  setExerciseSourceCustomTextSel: (v: string) => void;
  savedCustomTexts: string[];
  recordExercise: (type: string, data?: any) => void;
  assigned?: { id: string; type: string; words: string[]; lang?: string; onComplete: (accuracy?: number) => void; onExit: () => void };
}

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/**
 * Exercises (opened from Practice): pick the words you want, then play one
 * exercise in Smarty's lesson style. Every word is shown with its translation
 * into your own language.
 */
export default function ExercisesView(props: ExercisesViewProps) {
  const { savedVocab, allVocabMap, setActiveExercise, selectedVocabWords, setSelectedVocabWords, showExerciseWordSelector, setShowExerciseWordSelector, assigned } = props;
  const { contentLang, dictCode } = useContentLang();
  const { t } = useUiLang();
  const [session, setSession] = useState<{ type: string; words: string[]; meanings: Record<string, string> } | null>(null);
  const [loading, setLoading] = useState(false);

  // Leaving or finishing an exercise goes back to Practice (App redirects once nothing is open).
  const leave = () => {
    if (assigned) { assigned.onExit(); return; }
    setSession(null); setActiveExercise(null); setShowExerciseWordSelector(null);
  };

  const start = async (type: string, words: string[], cancelled = () => false) => {
    setLoading(true);
    const to = readPreferredTranslationLang().code;
    // An assignment can say which language its words are in; otherwise use the student's learning language.
    const from = assigned?.lang || dictCode;
    let tr: Record<string, string> = {};
    try { tr = await fetchWordTranslations(words, from, to); } catch { /* fall back below */ }
    // Last resort for words with no translation or lesson definition: the built-in dictionary.
    let lookup: ((w: string) => string) | null = null;
    try {
      const db = await import('../lib/vocabDb');
      if (db.vocabDbEnabled()) {
        await db.loadVocab(from, to);
        lookup = (w) => { const c = db.lookupWord(w, { knownLang: to }); return (c?.knownWord || c?.definition || '').trim(); };
      }
    } catch { /* dictionary unavailable */ }
    if (cancelled()) return;
    const meanings: Record<string, string> = {};
    for (const w of words) {
      const tx = (tr[w] || '').trim();
      // Translations only; when the "translation" is the same word (same language), use the short meaning instead.
      const raw = allVocabMap.get(w.toLowerCase()) || savedVocab[w]?.definition || '';
      const fallback = raw.split(' · ')[0].replace(/^\([^)]*\)\s*/, '').trim();
      const m = tx && tx.toLowerCase() !== w.toLowerCase() ? tx : fallback || lookup?.(w) || '';
      if (m) meanings[w] = m;
    }
    setLoading(false);
    // Assigned words are always played: a word without a known meaning is shown as itself rather than dropped.
    if (assigned) for (const w of words) if (!meanings[w]) meanings[w] = w;
    const usable = [...new Set(words)].filter((w) => meanings[w]);
    if (usable.length < 2) return;
    setActiveExercise(type);
    setShowExerciseWordSelector(null);
    setSession({ type, words: usable, meanings });
  };

  useEffect(() => {
    if (!assigned) return;
    let cancelled = false;
    void start(assigned.type, assigned.words, () => cancelled);
    return () => { cancelled = true; };
  }, [assigned?.id, contentLang]);

  if (session) {
    if (session.type === 'flashcards') return <FlashcardsRun words={session.words} meanings={session.meanings} onDone={(known) => {
      if (assigned) assigned.onComplete();
      else props.recordExercise('flashcards', { score: known, total: session.words.length });
      leave();
    }} onExit={leave} />;
    if (session.type === 'memory-match') return <MemoryRun words={session.words} meanings={session.meanings} onDone={(moves) => {
      const n = Math.min(6, session.words.length);
      if (assigned) assigned.onComplete();
      else props.recordExercise('memory-match', { score: n, total: n, moves });
      leave();
    }} onExit={leave} />;
    return <LessonRun type={session.type} words={session.words} meanings={session.meanings} contentLang={contentLang} runId={assigned?.id} onAccuracy={assigned?.onComplete} onExit={leave} />;
  }
  if (assigned) return <div className="mx-auto max-w-md p-6 text-center">
    <p className="mb-4">{t(loading ? 'class.challenge.loading' : 'path.assessmentUnavailable')}</p>
    <ChunkyButton onClick={leave}>{t('nav.myClasses')}</ChunkyButton>
  </div>;
  if (!showExerciseWordSelector) return null;
  return <WordPicker {...props} type={showExerciseWordSelector} loading={loading}
    onBack={() => setShowExerciseWordSelector(null)}
    onStart={(words) => start(showExerciseWordSelector, words)}
    selected={selectedVocabWords} setSelected={setSelectedVocabWords} />;
}

// ── word picker (full page) ─────────────────────────────────────────────
function WordPicker({ type, loading, onBack, onStart, selected, setSelected, savedVocab, allVocabMap, exerciseSourceType, setExerciseSourceType, exerciseSourceLevel, setExerciseSourceLevel, exerciseSourceTopic, setExerciseSourceTopic, exerciseSourceCustomTextSel, setExerciseSourceCustomTextSel, savedCustomTexts }: ExercisesViewProps & {
  type: string; loading: boolean; onBack: () => void; onStart: (words: string[]) => void; selected: string[]; setSelected: (fn: any) => void;
}) {
  const { t, tLevel } = useUiLang();
  const { contentLang } = useContentLang();
  const LEVEL_TEXTS = useLevelTexts();
  const source = (exerciseSourceType as Source) || 'saved';

  const candidates = useMemo(() => {
    let list: string[] = [];
    if (source === 'saved') list = Object.keys(savedVocab);
    else if (source === 'level') list = (LEVEL_TEXTS[exerciseSourceLevel] || []).flatMap((tx: ReadingText) => tx.vocabulary?.map((v) => v.word.toLowerCase()) || []);
    else if (source === 'topic') list = (LEVEL_TEXTS[exerciseSourceLevel] || []).find((tx: ReadingText) => tx.id === exerciseSourceTopic)?.vocabulary?.map((v) => v.word.toLowerCase()) || [];
    else if (source === 'custom') {
      const text = savedCustomTexts[Number(exerciseSourceCustomTextSel)];
      if (text) list = tokenizeForLang(text, contentLang).map((w) => normalizeForMatch(w, contentLang)).filter((w) => w && allVocabMap.has(w));
    }
    return Array.from(new Set(list));
  }, [source, savedVocab, LEVEL_TEXTS, exerciseSourceLevel, exerciseSourceTopic, exerciseSourceCustomTextSel, savedCustomTexts, contentLang, allVocabMap]);

  const sel = selected.filter((w) => candidates.includes(w));
  const toggle = (w: string) => setSelected((prev: string[]) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  const chip = (on: boolean) => `shrink-0 rounded-2xl border-2 px-3.5 py-2 font-serif text-xs font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[2px] ${on ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_2px_0_0_#000] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`;
  const select = 'rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-4">
        <button type="button" onClick={onBack} className="-ml-2 mb-2 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 font-bold text-slate-500 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <ArrowLeft className="h-5 w-5" />{t('nav.practice')}
        </button>
        <div className="flex items-center gap-3">
          <Sticker id={EXERCISE_STICKERS[type] ?? 'learn.word-nerd'} size={64} mode="once" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t(`ex.${type}.title` as UiStringKey)}</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('ex.pickWords')}</p>
          </div>
        </div>

        <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {(['saved', 'level', 'topic', 'custom'] as Source[]).map((s) => (
            <button key={s} type="button" onClick={() => setExerciseSourceType(s)} className={chip(source === s)}>{t(`ex.source.${s}` as UiStringKey)}</button>
          ))}
        </div>
        {(source === 'level' || source === 'topic') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={exerciseSourceLevel} onChange={(e) => setExerciseSourceLevel(e.target.value)} className={select}>
              {Object.keys(LEVEL_TEXTS).map((l) => <option key={l} value={l}>{tLevel(l as Level)}</option>)}
            </select>
            {source === 'topic' && (
              <select value={exerciseSourceTopic} onChange={(e) => setExerciseSourceTopic(e.target.value)} className={`${select} max-w-[220px]`}>
                <option value="">{t('ex.pickLesson')}</option>
                {(LEVEL_TEXTS[exerciseSourceLevel] || []).map((tx: ReadingText) => <option key={tx.id} value={tx.id}>{tx.title}</option>)}
              </select>
            )}
          </div>
        )}
        {source === 'custom' && (
          <select value={exerciseSourceCustomTextSel} onChange={(e) => setExerciseSourceCustomTextSel(e.target.value)} className={`${select} mt-3 max-w-full`}>
            <option value="">{t('ex.pickText')}</option>
            {savedCustomTexts.map((text, i) => <option key={i} value={String(i)}>{text.slice(0, 40)}…</option>)}
          </select>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('ex.available', { n: candidates.length })}</span>
          {candidates.length > 0 && (
            <button type="button" onClick={() => setSelected(sel.length === candidates.length ? [] : [...candidates])} className="font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-700 hover:underline dark:text-zinc-200">
              {sel.length === candidates.length ? t('ex.selectNone') : t('ex.selectAll')}
            </button>
          )}
        </div>
        {candidates.length === 0 ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <Sticker id="state2.no-results" size={120} mode="still" />
            <p className="mt-2 max-w-xs text-sm font-semibold text-slate-500">{t('ex.noWords')}</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {candidates.map((w) => {
              const on = sel.includes(w);
              return (
                <Tile key={w} state={on ? 'selected' : 'idle'} aria-pressed={on} onClick={() => toggle(w)} className="!px-3 !py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-slate-300 dark:border-zinc-600'}`}>
                      {on && <Check className="h-3 w-3" strokeWidth={3.5} />}
                    </span>
                    <span className="truncate font-bold">{w}</span>
                  </span>
                </Tile>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t-2 border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-2xl">
          <ChunkyButton className="w-full" disabled={loading || (sel.length < 2 && candidates.length < 2)} onClick={() => onStart(sel.length >= 2 ? sel : candidates)}>
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" /> : <Play className="h-5 w-5 fill-current" />}
              {sel.length >= 2 ? t('ex.startWith', { n: sel.length }) : t('ex.startAll')}
            </span>
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}

// ── lesson-style exercises (quiz, listening, true/false, match, spelling, speaking, scramble) ──
function LessonRun({ type, words, meanings, contentLang, runId, onAccuracy, onExit }: { type: string; words: string[]; meanings: Record<string, string>; contentLang: any; runId?: string; onAccuracy?: (accuracy: number) => void; onExit: () => void }) {
  const { t } = useUiLang();
  const { awardBiteXP } = useProgress();
  const [list] = useState(() => {
    const limit = type === 'word-match' ? 10 : 12;
    return runId ? seededPick(words, limit, runId) : shuffle(words).slice(0, limit);
  });
  const id = runId ? `assignment:${runId}` : `exercise:${type}:${list.length}`;
  const title = t(`ex.${type}.title` as UiStringKey);
  const steps = type === 'word-match'
    ? [{ kind: 'word-match' as StepKind, words: list.slice(0, 5) }, ...(list.length >= 7 ? [{ kind: 'word-match' as StepKind, words: list.slice(5, 10) }] : [])]
    : [{ kind: type as StepKind, words: list }];
  const def: BiteDef = { id, passageId: id, index: 0, kind: 'practice', date: todayKey(), estMinutes: 3, costsHearts: false, steps };
  const text: ReadingText = { id, title, text: '', targetSeconds: 180, vocabulary: list.map((w) => ({ word: w, definition: meanings[w] })) };
  return (
    <BiteRunner key={id} text={text} def={def} contentLang={contentLang}
      passageVocab={Object.fromEntries(list.map((w) => [w, { definition: meanings[w], timestamp: Date.now() }]))}
      meanings={meanings} allVocabMap={new Map<string, string>(list.map((w) => [w, meanings[w]]))}
      renderVocabIntro={() => null} renderRead={() => null} readResult={null} onStepScore={() => {}}
      onComplete={(result) => {
        if (result.scores?.some(score => !score.skipped)) onAccuracy?.(result.accuracy);
        return awardBiteXP(result, title);
      }} onExit={onExit} onNext={onExit} nextLabel={t('smarty.continue')} retryMisses />
  );
}

/** Shared top bar for the two custom exercises (matches the lesson top bar). */
function RunTop({ value, onExit }: { value: number; onExit: () => void }) {
  const { t } = useUiLang();
  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <button type="button" onClick={onExit} aria-label={t('history.close')} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"><X className="h-6 w-6" /></button>
      <div className="flex-1"><ChunkyProgress value={value} /></div>
    </div>
  );
}

function DoneScreen({ sticker, title, body, onDone }: { sticker: StickerId; title: string; body: string; onDone: () => void }) {
  const { t } = useUiLang();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <Sticker id={sticker} size={180} priority="hero" mode="once" />
      <h2 className="mt-2 font-serif text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1 font-semibold text-slate-500">{body}</p>
      <ChunkyButton className="mt-8 w-full max-w-sm" onClick={onDone}>{t('smarty.continue')}</ChunkyButton>
    </div>
  );
}

// ── flashcards ──────────────────────────────────────────────────────────
function FlashcardsRun({ words, meanings, onDone, onExit }: { words: string[]; meanings: Record<string, string>; onDone: (known: number) => void; onExit: () => void }) {
  const { t } = useUiLang();
  const { speechLocale } = useContentLang();
  const [deck] = useState(() => shuffle(words).slice(0, 15));
  const [queue, setQueue] = useState<string[]>(deck);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const word = queue[0];
  useEffect(() => { if (word) playWord(word, 1, speechLocale); }, [word]);

  if (!word) return <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950"><DoneScreen sticker="vocab.memory-master" title={t('ex.done')} body={t('ex.flashDone', { n: known, total: deck.length })} onDone={() => onDone(known)} /></div>;
  const answer = (gotIt: boolean) => {
    setFlipped(false);
    if (gotIt) { setKnown((k) => k + 1); setQueue((q) => q.slice(1)); }
    else setQueue((q) => [...q.slice(1), q[0]]); // comes back later in the deck
  };
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <RunTop value={known / deck.length} onExit={onExit} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-6 pt-8">
        <h2 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('ex.flashPrompt')}</h2>
        <button type="button" onClick={() => setFlipped((f) => !f)} className="relative mt-6 min-h-[260px] flex-1 [perspective:1200px]" aria-label={t('ex.flip')}>
          <motion.div className="absolute inset-0 [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-[0_6px_0_0_#18181b] [backface-visibility:hidden] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[0_6px_0_0_#e4e4e7]">
              <span className="font-serif text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">{word}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-400"><RotateCcw className="h-3.5 w-3.5" />{t('ex.tapToFlip')}</span>
            </div>
            <div className="dark-keep absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-zinc-900 bg-zinc-900 p-6 text-center text-white shadow-[0_6px_0_0_#000] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">{word}</span>
              <span className="mt-2 font-serif text-3xl font-extrabold">{meanings[word]}</span>
            </div>
          </motion.div>
        </button>
        <button type="button" onClick={() => playWord(word, 1, speechLocale)} className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200" aria-label={t('lesson.listen')}><Volume2 className="h-5 w-5" /></button>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ChunkyButton tone="secondary" onClick={() => answer(false)}>{t('ex.stillLearning')}</ChunkyButton>
          <ChunkyButton onClick={() => answer(true)}>{t('ex.knowIt')}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

// ── memory match ────────────────────────────────────────────────────────
function MemoryRun({ words, meanings, onDone, onExit }: { words: string[]; meanings: Record<string, string>; onDone: (moves: number) => void; onExit: () => void }) {
  const { t } = useUiLang();
  const [cards] = useState(() => shuffle(shuffle(words).slice(0, 6).flatMap((w) => [{ key: `w:${w}`, pair: w, label: w, isWord: true }, { key: `m:${w}`, pair: w, label: meanings[w], isWord: false }])));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const pairs = cards.length / 2;

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(cards[i].pair)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((k) => cards[k]);
      if (a.pair === b.pair && a.isWord !== b.isWord) setTimeout(() => { setMatched((m) => [...m, a.pair]); setOpen([]); }, 450);
      else setTimeout(() => setOpen([]), 900);
    }
  };

  if (matched.length === pairs) return <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950"><DoneScreen sticker="vocab.memory-master" title={t('ex.done')} body={t('ex.memoryDone', { n: moves })} onDone={() => onDone(moves)} /></div>;
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <RunTop value={matched.length / pairs} onExit={onExit} />
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8">
        <h2 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('ex.memoryPrompt')}</h2>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {cards.map((c, i) => {
            const shown = open.includes(i) || matched.includes(c.pair);
            const done = matched.includes(c.pair);
            return (
              <motion.button key={c.key} type="button" onClick={() => flip(i)} initial={false} animate={{ scale: shown ? 1 : 0.98 }}
                className={`flex aspect-[3/4] items-center justify-center rounded-2xl border-2 p-2 text-center font-bold transition-colors ${done ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : shown ? 'border-zinc-900 bg-white text-zinc-900 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-50' : 'dark-keep border-zinc-900 bg-zinc-900 shadow-[0_3px_0_0_#000]'}`}>
                {shown ? <span className={`break-words ${c.isWord ? 'font-serif text-base font-extrabold' : 'text-sm'}`}>{c.label}</span> : <span className="font-serif text-2xl font-black text-white/30">?</span>}
              </motion.button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('ex.moves', { n: moves })}</p>
      </div>
    </div>
  );
}
