import { useEffect, useRef, useState } from 'react';
import { Check, Headphones, X } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { playGameSfx } from '../../lib/gameAudio';
import type { BoxView, GameTeam, LiveGameView, PublicQuestion } from '../../lib/liveWordGame';
import { ANSWER_TILES, TWIST_META } from './liveGameKit';

type Tone = 'idle' | 'mine' | 'right' | 'wrong' | 'dim';

/* ---------- multiple choice (quiz, listen, true/false) ---------- */

export function ChoiceGrid({ question, selected, correct, locked, reveal, big, onPick }: {
  question: PublicQuestion;
  selected?: number;
  correct?: number;
  locked: boolean;
  reveal: boolean;
  /** Projector view: larger type, tiles are display-only. */
  big?: boolean;
  onPick?: (index: number) => void;
}) {
  const { t } = useUiLang();
  const options = question.options ?? [];
  const tf = !!question.tf;
  const longChoices = options.some(option => option.length > 30);
  return <div className={`grid gap-3 ${tf || !longChoices || big ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-[clamp(0.5rem,1.4dvh,1.25rem)]`}>
    {options.map((option, i) => {
      const style = tf ? (i === 0 ? { bg: 'bg-emerald-600 shadow-[0_5px_0_0_#065f46]', shape: '✓' } : { bg: 'bg-rose-600 shadow-[0_5px_0_0_#9f1239]', shape: '✕' }) : ANSWER_TILES[i % 4];
      const tone: Tone = reveal ? (i === correct ? 'right' : i === selected ? 'wrong' : 'dim') : selected === i ? 'mine' : selected !== undefined ? 'dim' : 'idle';
      return <button key={`${i}-${option}`} type="button" disabled={locked || reveal || !onPick || selected !== undefined}
        aria-pressed={selected === i} onClick={() => { playGameSfx('box', 0.5); onPick?.(i); }}
        className={`dark-keep relative flex ${tf ? 'min-h-[clamp(4.5rem,16dvh,9rem)]' : longChoices && !big ? 'min-h-[clamp(3rem,8dvh,3.5rem)]' : 'min-h-[clamp(3.25rem,10dvh,5rem)]'} items-center gap-2 rounded-2xl px-3 py-2 text-left font-serif sm:gap-3 sm:px-4 sm:py-3 font-extrabold text-white transition-[transform,opacity,box-shadow] duration-100 active:translate-y-[5px] active:shadow-none disabled:cursor-default ${style.bg}
          ${big ? 'min-h-[clamp(3.5rem,12dvh,8rem)] text-[clamp(0.9rem,min(3.6dvh,3.8vw),2.25rem)] leading-snug' : tf ? 'text-2xl' : 'text-[clamp(0.9rem,min(2.6dvh,4vw),1.125rem)] leading-snug'}
          ${tone === 'dim' ? 'opacity-40' : ''} ${tone === 'mine' ? 'ring-4 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900' : ''}
          ${tone === 'right' ? 'ring-4 ring-emerald-300 ring-offset-2 dark:ring-offset-zinc-900' : ''}`}>
        <span aria-hidden className="text-2xl leading-none opacity-80">{style.shape}</span>
        <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{tf ? t(i === 0 ? 'game.true' : 'game.false') : option}</span>
        {tone === 'right' && <Check className="h-7 w-7 shrink-0" aria-label={t('game.correct')} />}
        {tone === 'wrong' && <X className="h-7 w-7 shrink-0" aria-label={t('game.wrong')} />}
      </button>;
    })}
  </div>;
}

/* ---------- typing (spelling bee, scramble) ---------- */

export function TypeAnswer({ question, selected, reveal, locked, correctText, onSubmit, onReplay }: {
  question: PublicQuestion;
  selected?: string;
  reveal: boolean;
  locked: boolean;
  correctText?: string;
  onSubmit: (text: string) => void;
  onReplay?: () => void;
}) {
  const { t } = useUiLang();
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!selected && !locked) ref.current?.focus({ preventScroll: true }); }, [selected, locked]);
  return <div className="space-y-4">
    {question.speak && onReplay && <button type="button" onClick={onReplay}
      className="dark-keep mx-auto flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-serif text-lg font-extrabold text-white shadow-[0_5px_0_0_#115e59] active:translate-y-[5px] active:shadow-none">
      <Headphones className="h-6 w-6" aria-hidden />{t('game.hear')}
    </button>}
    {question.prompt && <p className="break-all text-center font-serif text-[clamp(1.75rem,6dvh,3rem)] font-extrabold tracking-[.18em] text-zinc-900 dark:text-zinc-50" aria-label={question.prompt.split('').join(' ')}>{question.prompt}</p>}
    {question.hint && <p className="text-center text-sm font-semibold text-zinc-600 dark:text-zinc-300">{t('game.hint', { meaning: question.hint })}</p>}
    {!reveal && selected === undefined && <form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (text.trim()) onSubmit(text.trim()); }}>
      <input ref={ref} value={text} onChange={event => setText(event.target.value)} maxLength={100} disabled={locked}
        aria-label={t('game.typeHere')} placeholder={question.length ? '_ '.repeat(question.length).trim() : t('game.typeHere')}
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
        className="min-w-0 flex-1 rounded-2xl border-2 border-zinc-300 bg-white px-4 py-3 text-center font-serif text-xl font-extrabold tracking-widest text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50" />
      <button type="submit" disabled={locked || !text.trim()}
        className="dark-keep rounded-2xl bg-emerald-600 px-5 font-serif text-base font-extrabold uppercase text-white shadow-[0_4px_0_0_#065f46] active:translate-y-[4px] active:shadow-none disabled:opacity-40">{t('game.send')}</button>
    </form>}
    {selected !== undefined && !reveal && <p role="status" className="text-center font-serif font-extrabold">{t('class.live.lockedAnswer')}</p>}
    {reveal && <div className="space-y-1 text-center font-serif font-extrabold" role="status">
      {selected !== undefined && <p className={selected && correctText && selected.replace(/[\s\-'’.,!?]/g, '').toLowerCase() === correctText.replace(/[\s\-'’.,!?]/g, '').toLowerCase()
        ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{selected}</p>}
      <p className="text-2xl text-emerald-600 dark:text-emerald-400">{correctText}</p>
    </div>}
  </div>;
}

/* ---------- speed match ---------- */

export function MatchBoard({ question, locked, msLeft, onFinish }: {
  question: PublicQuestion;
  locked: boolean;
  msLeft: number;
  onFinish: (matched: number, mistakes: number) => void;
}) {
  const { t } = useUiLang();
  const pairs = question.pairs!;
  const [leftPick, setLeftPick] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const mistakes = useRef(0);
  const sent = useRef(false);
  const doneRef = useRef(done);
  doneRef.current = done;
  const send = (matched: number) => {
    if (sent.current) return;
    sent.current = true;
    onFinish(matched, mistakes.current);
  };
  useEffect(() => { if (msLeft > 0 && msLeft < 1200 && !locked) send(doneRef.current.size); }); // save partial progress just before time is up
  const pickRight = (index: number) => {
    if (leftPick == null || locked) return;
    if (pairs.key[leftPick] === index) {
      const next = new Set(done).add(leftPick);
      setDone(next);
      setLeftPick(null);
      playGameSfx('correct');
      if (next.size === pairs.left.length) { playGameSfx('streak'); send(next.size); }
    } else {
      mistakes.current++;
      setWrong(index);
      playGameSfx('wrong', 0.8);
      window.setTimeout(() => setWrong(null), 350);
    }
  };
  const matchedRight = new Set([...done].map(i => pairs.key[i]));
  return <div>
    <p className="mb-3 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-300" role="status">
      {done.size === pairs.left.length ? t('game.match.done') : t('game.match.hint', { n: done.size, total: pairs.left.length })}
    </p>
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <div className="space-y-2">{pairs.left.map((word, i) => <button key={word} type="button" disabled={done.has(i) || locked || sent.current}
        onClick={() => { setLeftPick(i); playGameSfx('box', 0.4); }} aria-pressed={leftPick === i}
        className={`dark-keep min-h-16 w-full rounded-2xl px-2 py-2 font-serif text-base font-extrabold break-words [overflow-wrap:anywhere] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none
        ${done.has(i) ? 'bg-emerald-500 text-white opacity-70' : leftPick === i ? 'bg-blue-600 text-white shadow-[0_4px_0_0_#1e3a8a] ring-4 ring-blue-300' : 'bg-blue-500 text-white shadow-[0_4px_0_0_#1e3a8a]'}`}>{word}</button>)}</div>
      <div className="space-y-2">{pairs.right.map((meaning, i) => <button key={meaning} type="button" disabled={matchedRight.has(i) || locked || sent.current || leftPick == null}
        onClick={() => pickRight(i)}
        className={`dark-keep min-h-16 w-full rounded-2xl px-2 py-2 text-sm font-bold break-words [overflow-wrap:anywhere] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none disabled:cursor-default
        ${matchedRight.has(i) ? 'bg-emerald-500 text-white opacity-70' : wrong === i ? 'bg-rose-600 text-white' : 'bg-amber-400 text-zinc-900 shadow-[0_4px_0_0_#b45309]'}`}>{meaning}</button>)}</div>
    </div>
  </div>;
}

/* ---------- mystery boxes ---------- */

export function MysteryBoxes({ boxes, canPick, youLabel, onPick, activeBox, teamLabel }: {
  boxes: BoxView[];
  canPick: boolean;
  youLabel: string;
  activeBox?: number;
  teamLabel: (team: GameTeam) => string;
  onPick: (index: number) => void;
}) {
  const { t } = useUiLang();
  void teamLabel;
  return <div>
    {canPick && <p className="mb-3 text-center font-serif text-lg font-extrabold" role="status">{youLabel}</p>}
    <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:gap-4">
      {boxes.map((box, i) => {
        const meta = box.twist ? TWIST_META[box.twist] : null;
        const Icon = meta?.icon;
        return <button key={box.n} type="button" disabled={!canPick || box.taken} onClick={() => onPick(i)}
          aria-label={meta ? `${box.n}: ${t(meta.label)}` : `${box.n}`}
          className={`dark-keep flex aspect-square flex-col items-center justify-center rounded-2xl font-serif font-extrabold transition-[transform,box-shadow] disabled:cursor-default
          ${meta ? meta.tone : box.taken ? 'bg-zinc-400 text-white' : 'bg-violet-600 text-white shadow-[0_5px_0_0_#4c1d95] active:translate-y-[5px] active:shadow-none'}
          ${activeBox === box.n ? 'ring-4 ring-amber-300 ring-offset-2 dark:ring-offset-zinc-900' : ''}
          ${box.taken ? 'opacity-90' : canPick ? 'hover:-translate-y-0.5' : 'opacity-90'}`}>
          {Icon ? <><Icon className="h-6 w-6 sm:h-9 sm:w-9" aria-hidden /><span className="mt-1 px-1 text-center text-[11px] leading-tight sm:text-sm">{t(meta!.label)}</span></>
            : <span className="text-3xl sm:text-5xl">{box.n}</span>}
        </button>;
      })}
    </div>
  </div>;
}

export type { LiveGameView };
