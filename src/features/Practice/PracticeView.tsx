import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Coins, Crown } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import { wordCatalog } from '../../lib/bites/dailySession';
import { loadLessonUnlock } from '../../lib/lessonProgress';
import { todayKey } from '../../lib/habitEngine';
import type { BiteDef, BiteStep } from '../../lib/bites/types';
import type { ReadingText } from '../../lib/reading-logic';
import type { UiStringKey } from '../../lib/uiStrings';
import { ScreenShell, seCard } from '../../components/ScreenShell';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
import { BiteRunner } from '../Bites/BiteRunner';
import { EXERCISE_STICKERS, exerciseCatalog } from '../ExercisesView';
import { fetchWordTranslations } from '../../Exercises';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { readPreferredTranslationCode } from '../../lib/preferredTranslationLang';

export type { PracticeMode } from '../../lib/practicePools';
import { practicePools, type PracticeMode } from '../../lib/practicePools';
/** "Made for you": built from your own history. */
const FOR_YOU: { id: PracticeMode; sticker: StickerId }[] = [
  { id: 'mistakes', sticker: 'feed.mistake-eraser' },
  { id: 'review', sticker: 'vocab.memory-refresh' },
  { id: 'listening', sticker: 'listen.ear-twitch' },
  { id: 'speaking', sticker: 'speak.mic-ready' },
];
/** Exercises: one game each, on words you know. */
const GAMES: { id: PracticeMode; sticker: StickerId }[] = [
  { id: 'translate', sticker: 'vocab.translation-magic' },
  { id: 'match', sticker: 'vocab.word-magnet' },
  { id: 'truefalse', sticker: 'game.quiz-show-host' },
  { id: 'scramble', sticker: 'vocab.grammar-puzzle' },
  { id: 'spell', sticker: 'write.spelling-bee' },
];
const MODES = [...FOR_YOU, ...GAMES];
const SIZE = 8;

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Words for each kind of practice, picked from the learner's own history. */
function usePools() {
  const { contentLang, savedVocab, problemWords } = useProgress();
  const texts = useLevelTexts();
  const all: ReadingText[] = useMemo(() => Object.values(texts).flat(), [texts]);
  return useMemo(() => {
    const catalog = wordCatalog(all, savedVocab, contentLang);
    const pools = practicePools(all, savedVocab, problemWords, catalog, Object.fromEntries(all.map(tx => [tx.id, loadLessonUnlock(contentLang, tx.id).missedWords])));
    return { catalog, pools, ready: all.length > 0 };
  }, [all, savedVocab, problemWords, contentLang]);
}

/**
 * Practice (Smarty Max): short sessions built from your own mistakes, the
 * words due for review, and listening/speaking drills on words you know.
 * Each session pays XP and coins.
 */
export function PracticeView({ path, navigatePath, onOpenExercise }: { path: string[]; navigatePath: (p: string[]) => void; onOpenExercise: (id: string) => void }) {
  const mode = MODES.find((m) => m.id === path[0])?.id;
  return mode ? <PracticeSession mode={mode} onExit={() => navigatePath([])} /> : <PracticeHub onStart={(m) => navigatePath([m])} onOpenExercise={onOpenExercise} />;
}

function PracticeHub({ onStart, onOpenExercise }: { onStart: (m: PracticeMode) => void; onOpenExercise: (id: string) => void }) {
  const { tText } = useUiLang();
  const { t } = useUiLang();
  const { pools, ready } = usePools();
  if (!ready) return <SmartyLoader />;
  return (
    <ScreenShell stickers={['game.challenge-accepted', 'state.playtime']} title={t('nav.practice')} subtitle={t('practice.subtitle')}>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-serif text-[11px] font-extrabold uppercase tracking-wide text-amber-800">
        <Crown className="h-3.5 w-3.5" />{t('practice.max')}
      </div>
      {[{ title: t('practice.forYou'), list: FOR_YOU }].map((section) => (
      <section key={section.title} className="mb-6">
      <h2 className="mb-2.5 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{section.title}</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {section.list.map(({ id, sticker }) => {
          const n = pools[id].length;
          const empty = n < 2;
          return (
            <button key={id} type="button" disabled={empty} onClick={() => onStart(id)}
              className={`${seCard} flex items-center gap-3.5 p-3.5 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none disabled:opacity-55 disabled:active:translate-y-0`}>
              <Sticker id={sticker} size={64} mode="still" className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[17px] font-extrabold text-zinc-900 dark:text-zinc-50">{t(`practice.${id}.title` as UiStringKey)}</span>
                <span className="block text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  {empty ? t(`practice.${id}.empty` as UiStringKey) : t(`practice.${id}.desc` as UiStringKey, { n })}
                </span>
                {!empty && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600"><Coins className="h-3 w-3" />{t('practice.reward')}</span>
                )}
              </span>
              {!empty && <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
            </button>
          );
        })}
      </div>
      </section>
      ))}

      <section className="mb-6">
        <h2 className="mb-1 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{t('practice.games')}</h2>
        <p className="mb-2.5 text-xs font-semibold text-slate-400">{t('practice.gamesHint')}</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {exerciseCatalog(t).map((ex) => (
            <button key={ex.id} type="button" onClick={() => onOpenExercise(ex.id)}
              className={`${seCard} flex items-center gap-3 p-3 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none`}>
              <Sticker id={EXERCISE_STICKERS[ex.id] ?? 'learn.word-nerd'} size={52} mode="still" className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">{tText(ex.title)}</span>
                <span className="line-clamp-2 block text-xs font-semibold text-slate-500 dark:text-zinc-400">{ex.desc}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </section>
    </ScreenShell>
  );
}

const STEPS: Record<PracticeMode, (w: string[]) => BiteStep[]> = {
  mistakes: (w) => [{ kind: 'definition-quiz', words: w }, { kind: 'spelling-practice', words: w.slice(0, 4) }],
  review: (w) => [{ kind: 'definition-quiz', words: w }, { kind: 'true-false-quiz', words: w.slice(0, 5) }],
  listening: (w) => [{ kind: 'listening-match', words: w }, { kind: 'spelling-practice', words: w.slice(0, 4) }],
  speaking: (w) => [{ kind: 'pronunciation', words: w.slice(0, 6) }],
  translate: (w) => [{ kind: 'definition-quiz', words: w }],
  match: (w) => [{ kind: 'word-match', words: w.slice(0, 5) }, { kind: 'word-match', words: w.slice(5, 10).length >= 2 ? w.slice(5, 10) : w.slice(0, 5) }],
  truefalse: (w) => [{ kind: 'true-false-quiz', words: w }],
  scramble: (w) => [{ kind: 'word-scramble', words: w.slice(0, 6) }],
  spell: (w) => [{ kind: 'spelling-practice', words: w.slice(0, 6) }],
};

function PracticeSession({ mode, onExit }: { mode: PracticeMode; onExit: () => void }) {
  const { contentLang, awardBiteXP } = useProgress();
  const { dictCode } = useContentLang();
  const { t, uiLang } = useUiLang();
  const { catalog, pools, ready } = usePools();
  const [run, setRun] = useState(0);
  // Fix the word list once per run so it doesn't shuffle while answering.
  const words = useMemo(() => (ready ? shuffle(pools[mode].slice(0, SIZE * 2)).slice(0, SIZE) : []), [ready, mode, run]);
  // Translations only (no definitions): each word in the learner's own language.
  const [meanings, setMeanings] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    setMeanings(null);
    const to = readPreferredTranslationCode() || UI_TRANSLATE_CODE[uiLang] || 'en';
    let cancelled = false;
    if (!words.length) return;
    if (dictCode === to) { setMeanings(Object.fromEntries(words.map((w) => [w, catalog.get(w) || '']))); return; }
    fetchWordTranslations(words, dictCode, to, {}).then((r) => {
      if (cancelled) return;
      const clean: Record<string, string> = {};
      for (const w of words) { const tr = (r[w] || '').trim(); if (tr && tr.toLowerCase() !== w.toLowerCase()) clean[w] = tr; }
      setMeanings(clean);
    }).catch(() => { if (!cancelled) setMeanings({}); });
    return () => { cancelled = true; };
  }, [words.join('|'), uiLang, dictCode]);

  if (!ready || (words.length >= 2 && !meanings)) return <SmartyLoader />;
  const usable = words.filter((w) => meanings?.[w]);
  if (usable.length < 2) { onExit(); return null; }
  const id = `practice:${mode}:${run}`;
  const title = t(`practice.${mode}.title` as UiStringKey);
  const m = meanings!;
  const text: ReadingText = { id, title, text: '', targetSeconds: 180, vocabulary: usable.map((w) => ({ word: w, definition: m[w] })) };
  const def: BiteDef = { id, passageId: id, index: 0, kind: 'practice', date: todayKey(), estMinutes: 3, costsHearts: false, steps: STEPS[mode](usable) };
  const passageVocab = Object.fromEntries(usable.map((w) => [w, { definition: m[w], timestamp: Date.now() }]));
  const translatedMap = new Map<string, string>(usable.map((w) => [w, m[w]]));
  return (
    <BiteRunner key={id} text={text} def={def} contentLang={contentLang} passageVocab={passageVocab} meanings={m} allVocabMap={translatedMap}
      renderVocabIntro={() => null} renderRead={() => null} readResult={null} onStepScore={() => {}}
      onComplete={(result) => awardBiteXP(result, title)}
      onExit={onExit} onNext={() => setRun((n) => n + 1)} nextLabel={t('practice.again')} retryMisses />
  );
}
