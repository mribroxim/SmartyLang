import { DialogSurface } from '../../components/DialogSurface';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Crown, Lock, Play, ChevronRight, ListOrdered, X } from 'lucide-react';
import type { Level, ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import { buildLessonUnits } from '../../lib/lessonUnits';
import { lessonBiteState, type LessonBiteState } from '../../lib/bites/biteProgress';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import { learnerName } from '../../lib/smarty/context';
import type { UiStringKey } from '../../lib/uiStrings';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { SECTIONS, isSectionOpen, sectionComplete } from '../../lib/bites/sections';

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const ZIG = [0, 44, 72, 44, 0, -44, -72, -44];
const UNIT_STICKERS: StickerId[] = ['flow.learning-path', 'learn.bookworm', 'learn.word-nerd', 'listen.ear-twitch', 'learn.chatterbox', 'learn.scribbler', 'vocab.word-garden', 'read.story-portal', 'learn.detective', 'achieve.mastery-aura'];

interface Props {
  level: Level;
  setLevel: (l: Level) => void;
  textsByLevel: Record<Level, ReadingText[]>;
  contentLang: ContentLang;
  startingLevel?: Level;
  onStartBite: (text: ReadingText, biteIndex: number) => void;
  /** Take the jump test for a locked section. */
  onTakeTest: (level: Level) => void;
}

/** Duolingo-style winding path: units → lesson nodes (ring = bites done) → bites. */
export function PathView({ level, setLevel, textsByLevel, contentLang, startingLevel, onStartBite, onTakeTest }: Props) {
  const { t, tText, tLevel } = useUiLang();
  const texts = textsByLevel[level] || [];
  const units = useMemo(() => buildLessonUnits(texts, level), [texts, level]);
  const [tick, setTick] = useState(0);
  const states = useMemo(() => texts.map((tx) => lessonBiteState(contentLang, tx)), [texts, contentLang, tick]);
  const currentIdx = states.findIndex((s) => !s.complete);
  const [open, setOpen] = useState<number | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const done = states.filter((s) => s.complete).length;
  const [sections, setSections] = useState(false);
  const sectionIdx = SECTIONS.indexOf(level);
  const nextLevel = SECTIONS[sectionIdx + 1];
  const nextOpen = nextLevel ? isSectionOpen(contentLang, nextLevel, textsByLevel, startingLevel) : false;

  // Progress may change while away (another tab/device) — refresh on focus.
  useEffect(() => {
    const f = () => setTick((n) => n + 1);
    window.addEventListener('focus', f);
    window.addEventListener('smarty:lesson-progress', f);
    return () => {
      window.removeEventListener('focus', f);
      window.removeEventListener('smarty:lesson-progress', f);
    };
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    return () => window.clearTimeout(id);
  }, [level, currentIdx]);

  return (
    <div className="flex-1 min-w-0 overflow-x-clip bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-xl px-4 pt-5 pb-28">
        {/* Section bar: which section you're in; tap to see all sections */}
        <div className="sticky top-0 z-20 -mx-4 bg-white/95 px-4 pb-2 pt-1 backdrop-blur dark:bg-zinc-950/95">
          <button type="button" onClick={() => setSections(true)}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-left shadow-[0_3px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('path.section', { n: sectionIdx + 1 })}</div>
              <div className="truncate font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{tLevel(level)}</div>
            </div>
            <span className="shrink-0 text-xs font-extrabold tabular-nums text-slate-400">{done}/{texts.length}</span>
            <ListOrdered className="h-5 w-5 shrink-0 text-zinc-500" />
          </button>
        </div>

        {/* Units */}
        {units.map((unit) => {
          const first = unit.index * 10;
          const unitStates = states.slice(first, first + unit.lessons.length);
          const unitDone = unitStates.filter((s) => s.complete).length;
          return (
            <section key={unit.id} className="mt-8">
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3.5 text-white shadow-[0_5px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_5px_0_0_#a1a1aa] dark-keep">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-widest opacity-70">{t('path.unit', { n: unit.index + 1 })} · {unitDone}/{unit.lessons.length}</div>
                  <div className="truncate font-serif text-xl font-extrabold">{/^Unit \d+$/.test(unit.title) ? t('path.unit', { n: unit.index + 1 }) : tText(unit.title)}</div>
                </div>
                <Sticker id={UNIT_STICKERS[unit.index % UNIT_STICKERS.length]} size={54} priority="ambient" quality="full" />
              </div>

              <div className="relative mt-14 flex flex-col items-center gap-6">
                {unit.lessons.map((text, i) => {
                  const gi = first + i;
                  const s = states[gi];
                  const isCurrent = gi === currentIdx;
                  const future = currentIdx >= 0 && gi > currentIdx;
                  const x = ZIG[gi % ZIG.length];
                  return (
                    <div key={text.id} ref={isCurrent ? currentRef : undefined} className="relative w-full flex flex-col items-center">
                      <div className="relative" style={{ transform: `translateX(${x}px)` }}>
                        {isCurrent && (
                          <div className="absolute right-full top-1/2 mr-1 -translate-y-1/2 pointer-events-none">
                            <Sticker id={i === unit.lessons.length - 1 && unit.lessons.length > 1 ? 'game.boss-battle' : 'mood.hi-there'} size={84} priority="hero" />
                          </div>
                        )}
                        {isCurrent && <StartBubble label={s.doneCount ? t('path.continueBite') : t('path.start')} />}
                        <PathNode state={s} current={isCurrent} future={future} index={(gi % 10) + 1} onClick={() => setOpen(open === gi ? null : gi)} />
                      </div>
                      <AnimatePresence>
                        {open === gi && (
                          <NodePopover
                            text={text}
                            state={s}
                            future={future}
                            onStart={(bi) => onStartBite(text, bi)}
                            onClose={() => setOpen(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {/* Unit chest */}
                <div className="flex flex-col items-center">
                  <Sticker id={unitDone === unit.lessons.length ? 'achieve.treasure-chest' : 'reward.surprise-gift'} size={88} priority="ambient" mode={unitDone === unit.lessons.length ? 'auto' : 'still'} />
                  <div className="text-xs font-bold text-slate-400">{unitDone === unit.lessons.length ? t('path.unitDone') : t('path.unitChest')}</div>
                </div>
              </div>
            </section>
          );
        })}

        {currentIdx === -1 && texts.length > 0 && (
          <div className="mt-10 text-center">
            <Sticker id="achieve.fireworks-finale" size={180} priority="hero" />
            <p className="mt-2 font-black text-zinc-900 dark:text-zinc-50">{learnerName() ? t('path.levelDone', { name: learnerName()! }) : t('path.levelDone.plain')}</p>
          </div>
        )}

        {/* Next section: continue, or take a test to jump ahead */}
        {nextLevel && (
          <div className="mt-14">
            <div className="mb-4 flex items-center gap-3 text-slate-300 dark:text-zinc-700">
              <span className="h-0.5 flex-1 bg-current" /><span className="font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('path.section', { n: sectionIdx + 2 })}</span><span className="h-0.5 flex-1 bg-current" />
            </div>
            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-5 text-center shadow-[0_5px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[0_5px_0_0_#e4e4e7]">
              <Sticker id={nextOpen ? 'flow.next-lesson' : 'game.boss-battle'} size={110} priority="ambient" mode="still" className="mx-auto" />
              <div className="mt-1 font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{tLevel(nextLevel)}</div>
              <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-slate-500 dark:text-zinc-400">{nextOpen ? t('path.nextOpen') : t('path.nextLocked')}</p>
              <ChunkyButton className="mt-4 w-full" onClick={() => (nextOpen ? setLevel(nextLevel) : onTakeTest(nextLevel))}>
                {nextOpen ? t('path.continueSection', { n: sectionIdx + 2 }) : t('path.jumpTo', { n: sectionIdx + 2 })}
              </ChunkyButton>
            </div>
          </div>
        )}

        {/* All sections */}
        <AnimatePresence>
          {sections && (
            <DialogSurface role="presentation" aria-modal={undefined} asComponent={motion.div} onClose={() => setSections(false)} className="fixed inset-0 z-[85] flex items-end justify-center bg-zinc-900/40 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSections(false)}>
              <motion.div role="dialog" aria-modal="true" aria-label={t('path.sections')} initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="w-full max-w-lg rounded-t-3xl border-2 border-zinc-900 bg-white p-5 dark:border-zinc-100 dark:bg-zinc-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('path.sections')}</h2>
                  <button type="button" onClick={() => setSections(false)} aria-label={t('history.close')} className="rounded-xl border-2 border-slate-200 p-2 text-slate-500 dark:border-zinc-700"><X className="h-5 w-5" /></button>
                </div>
                <ul className="space-y-2.5">
                  {SECTIONS.map((l, i) => {
                    const list = textsByLevel[l] || [];
                    const finished = sectionComplete(contentLang, list);
                    const isOpen = isSectionOpen(contentLang, l, textsByLevel, startingLevel);
                    const doneHere = list.filter((tx) => lessonBiteState(contentLang, tx).complete).length;
                    return (
                      <li key={l}>
                        <button type="button" onClick={() => { setSections(false); if (isOpen) setLevel(l); else onTakeTest(l); }}
                          className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${l === level ? 'border-zinc-900 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:shadow-[0_3px_0_0_#e4e4e7]' : 'border-slate-200 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-700 dark:shadow-[0_3px_0_0_#3f3f46]'}`}>
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-extrabold ${finished ? 'bg-amber-400 text-zinc-900' : isOpen ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'}`}>
                            {finished ? <Crown className="h-5 w-5" /> : isOpen ? i + 1 : <Lock className="h-5 w-5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('path.section', { n: i + 1 })}</span>
                            <span className="block truncate font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{tLevel(l)}</span>
                          </span>
                          <span className="shrink-0 text-xs font-extrabold text-slate-400">{isOpen ? `${doneHere}/${list.length}` : t('path.jump')}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            </DialogSurface>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Bouncing speech bubble over the current lesson. */
function StartBubble({ label }: { label: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute -top-12 left-1/2 z-[1] -translate-x-1/2"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative whitespace-nowrap rounded-xl border-2 border-slate-200 bg-white px-3 py-1.5 font-serif text-sm font-extrabold uppercase tracking-wide text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
        {label}
        <span aria-hidden className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
      </div>
    </motion.div>
  );
}

/** Chunky lesson node: a solid disc that presses into its bottom edge; ring = bites done. */
function PathNode({ state, current, future, index, onClick }: { state: LessonBiteState; current: boolean; future: boolean; index: number; onClick: () => void }) {
  const { t } = useUiLang();
  const r = 40, c = 2 * Math.PI * r;
  const segs = state.total;
  // Round caps add strokeWidth to each dash, so the visible gap is gap - 7.
  const gap = segs > 1 ? 13 : 0;
  const seg = c / segs - gap;
  const face = state.complete
    ? state.mastered
      ? 'bg-amber-400 text-zinc-900 shadow-[0_6px_0_0_#b45309] dark-keep'
      : 'bg-zinc-900 text-white shadow-[0_6px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_6px_0_0_#a1a1aa] dark-keep'
    : current
      ? 'bg-zinc-900 text-white shadow-[0_6px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_6px_0_0_#a1a1aa] dark-keep'
      : future
        ? 'bg-slate-200 text-slate-400 shadow-[0_6px_0_0_#cbd5e1] dark:bg-zinc-800 dark:text-zinc-500 dark:shadow-[0_6px_0_0_#27272a]'
        : 'bg-white text-zinc-700 border-2 border-slate-300 shadow-[0_6px_0_0_#cbd5e1] dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-600 dark:shadow-[0_6px_0_0_#3f3f46]';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[96px] w-[96px] rounded-full focus-visible:outline-3 focus-visible:outline-offset-4"
      aria-label={t("learning.lesson.v0.v1.024f55", { v0: index, v1: state.complete ? ' (done)' : current ? ' (current)' : '' })}
    >
      {(current || state.doneCount > 0) && (
        <svg viewBox="0 0 96 96" className="absolute inset-0">
          {state.done.map((d, i) => (
            <circle
              key={i}
              cx="48" cy="48" r={r}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(1, seg)} ${c}`}
              strokeDashoffset={-(i * (seg + gap))}
              transform={`rotate(${-90 + (gap / 2 / c) * 360} 48 48)`}
              className={d ? (state.mastered ? 'stroke-amber-400' : 'stroke-zinc-900 dark:stroke-zinc-100') : 'stroke-slate-200 dark:stroke-zinc-800'}
            />
          ))}
        </svg>
      )}
      <span className={`absolute inset-x-[15px] top-[12px] bottom-[18px] flex items-center justify-center rounded-full font-serif text-xl font-extrabold transition-[transform,box-shadow] duration-75 group-active:translate-y-[6px] group-active:shadow-none ${face}`}>
        {state.complete ? (state.mastered ? <Crown className="h-7 w-7" /> : <Check className="h-7 w-7" strokeWidth={3} />) : future ? <Lock className="h-6 w-6" /> : current ? <Play className="ml-1 h-7 w-7 fill-current" /> : index}
      </span>
    </button>
  );
}

function NodePopover({ text, state, future, onStart, onClose }: {
  text: ReadingText; state: LessonBiteState; future: boolean; onStart: (biteIndex: number) => void; onClose: () => void;
}) {
  const { t } = useUiLang();
  const next = state.next === -1 ? 0 : state.next;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="relative z-10 mt-3 w-[min(92vw,360px)] rounded-2xl border-2 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]"
    >
      <div className="flex items-start gap-2">
        {(future || state.complete) && <Sticker id={future ? 'pers.evil-genius' : 'pers.mind-blown'} size={52} mode="once" className="-my-1 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('path.bitesDone', { done: state.doneCount, total: state.total })}</div>
          <div className="font-black text-zinc-900 dark:text-zinc-50 leading-tight">{text.title}</div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 text-sm font-bold px-1" aria-label={t("learning.close.bbfa77")}>×</button>
      </div>
      {future && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">{t('path.jumpAhead')}</p>}
      <ul className="mt-3 space-y-1.5">
        {state.defs.map((d, i) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onStart(i)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${i === next && !state.complete ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${state.done[i] ? 'bg-emerald-500 text-white' : i === next ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                {state.done[i] ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="flex-1 text-sm font-bold">{t(`bites.kind.${d.kind}` as UiStringKey)}</span>
              <span className="text-xs font-semibold opacity-70">{t('bites.minutes', { n: d.estMinutes })}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </li>
        ))}
      </ul>
      <ChunkyButton onClick={() => onStart(next)} className="mt-4 w-full">
        {state.complete ? t('path.practiseAgain') : state.doneCount ? t('path.continueBite') : t('path.startLesson')}
      </ChunkyButton>
    </motion.div>
  );
}
