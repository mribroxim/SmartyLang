import { useEffect, useMemo, useRef, useState } from 'react';
import { Tile, ChunkyProgress } from '../Bites/lesson/chunky';
import { useUiLang } from '../../contexts/UiLangContext';
import type { ChallengeMode, ChallengeScore, ChallengeWord } from '../../lib/challenge';

const SECONDS = 20;
const PAIRS = 4;
const squash = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\s\-'’.,!?]/g, '');
const shuffle = <T,>(items: T[]) => { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const speedBonus = (ms: number) => Math.round(Math.max(0, 1 - ms / (SECONDS * 1000)) * 50);

/**
 * Self-contained solo round on a fixed word list, so a challenger and a friend play the same
 * round. Scoring: 100 per right answer, up to 50 for speed, +10 per answer in a streak (max +50).
 */
export function SoloRound({ words, mode, onDone }: { words: ChallengeWord[]; mode: ChallengeMode; onDone: (result: ChallengeScore) => void }) {
  return mode === 'match' ? <MatchRound words={words} onDone={onDone} /> : <QuestionRound words={words} mode={mode} onDone={onDone} />;
}

function QuestionRound({ words, mode, onDone }: { words: ChallengeWord[]; mode: 'quiz' | 'spelling'; onDone: (result: ChallengeScore) => void }) {
  const { t } = useUiLang();
  const order = useMemo(() => shuffle(words), [words]);
  const choices = useMemo(() => order.map(item => shuffle([item, ...shuffle(words.filter(other => other.word !== item.word)).slice(0, 3)])), [order, words]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [left, setLeft] = useState(SECONDS);
  const total = useRef({ score: 0, correct: 0, ms: 0, streak: 0 });
  const started = useRef(Date.now());
  const item = order[index];
  const ok = answer !== null && squash(answer) === squash(item.word);

  useEffect(() => { started.current = Date.now(); setLeft(SECONDS); setAnswer(null); setTyped(''); }, [index]);
  useEffect(() => {
    if (answer !== null) return;
    const id = window.setInterval(() => setLeft(value => value - 1), 1000);
    return () => window.clearInterval(id);
  }, [index, answer]);
  useEffect(() => { if (left <= 0 && answer === null) settle(''); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  function settle(value: string) {
    if (answer !== null) return;
    const ms = Math.min(SECONDS * 1000, Date.now() - started.current);
    const right = !!value && squash(value) === squash(item.word);
    total.current.ms += ms;
    if (right) { total.current.correct++; total.current.streak++; total.current.score += 100 + speedBonus(ms) + Math.min(50, (total.current.streak - 1) * 10); }
    else total.current.streak = 0;
    setAnswer(value || '\u200b');
  }
  function next() {
    if (index + 1 >= order.length) onDone({ score: total.current.score, correct: total.current.correct, ms: total.current.ms });
    else setIndex(index + 1);
  }

  const mask = item.word.length > 1 ? item.word[0] + ' ' + '_ '.repeat(item.word.length - 1).trim() : '_';
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1"><ChunkyProgress value={(index + (answer !== null ? 1 : 0)) / order.length} /></div>
        <span className="shrink-0 tabular-nums font-serif text-sm font-extrabold text-slate-500 dark:text-zinc-400" aria-label={t('ch.seconds', { n: Math.max(0, left) })}>{Math.max(0, left)}s</span>
      </div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('ch.question', { n: index + 1, total: order.length })}</p>
      <h2 className="break-words font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{mode === 'quiz' ? t('ch.whichWord') : t('ch.typeWord')}</h2>
      <p className="break-words rounded-2xl bg-slate-50 p-3 text-base font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">{item.meaning}</p>
      {mode === 'quiz' ? (
        <div className="grid gap-2.5">
          {choices[index].map(choice => (
            <Tile key={choice.word} center disabled={answer !== null} onClick={() => settle(choice.word)}
              state={answer === null ? 'idle' : choice.word === item.word ? 'correct' : answer === choice.word ? 'wrong' : 'dim'}>{choice.word}</Tile>
          ))}
        </div>
      ) : (
        <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (typed.trim()) settle(typed.trim()); }}>
          <p aria-hidden className="text-center font-serif text-2xl font-extrabold tracking-[0.2em] text-slate-400">{mask}</p>
          <input autoFocus value={typed} onChange={event => setTyped(event.target.value)} readOnly={answer !== null} autoComplete="off" autoCapitalize="none" spellCheck={false}
            aria-label={t('ch.typeWord')} placeholder={t('ch.typePlaceholder')}
            className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-center font-serif text-xl font-extrabold outline-none dark:bg-zinc-950 ${answer === null ? 'border-slate-200 focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100' : ok ? 'border-emerald-500 text-emerald-700' : 'border-rose-500 text-rose-700'}`} />
          {answer === null && <button type="submit" disabled={!typed.trim()} className="dark-keep w-full rounded-2xl bg-zinc-900 py-3 font-serif text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#000] active:translate-y-[4px] active:shadow-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">{t('ch.check')}</button>}
        </form>
      )}
      {answer !== null && (
        <div role="status" className={`flex items-center gap-3 rounded-2xl p-3 ${ok ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-rose-50 dark:bg-rose-950'}`}>
          <p className="min-w-0 flex-1 break-words font-serif font-extrabold">{ok ? t('ch.right') : t('ch.answerWas', { word: item.word })}</p>
          <button type="button" autoFocus onClick={next} className="dark-keep shrink-0 rounded-xl bg-zinc-900 px-4 py-2 font-serif text-sm font-extrabold uppercase text-white dark:bg-zinc-100 dark:text-zinc-900">{index + 1 >= order.length ? t('ch.finish') : t('ch.next')}</button>
        </div>
      )}
    </div>
  );
}

function MatchRound({ words, onDone }: { words: ChallengeWord[]; onDone: (result: ChallengeScore) => void }) {
  const { t } = useUiLang();
  const groups = useMemo(() => { const out: ChallengeWord[][] = []; for (let i = 0; i < words.length; i += PAIRS) out.push(words.slice(i, i + PAIRS)); return out.filter(group => group.length >= 2); }, [words]);
  const [round, setRound] = useState(0);
  const group = groups[round];
  const left = useMemo(() => shuffle(group.map(item => item.word)), [group]);
  const right = useMemo(() => shuffle(group.map(item => item.meaning)), [group]);
  const [pickLeft, setPickLeft] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const total = useRef({ score: 0, correct: 0, ms: 0 });
  const started = useRef(Date.now());
  const mistakes = useRef(0);

  function choose(meaning: string) {
    if (!pickLeft || done.includes(pickLeft)) return;
    const match = group.find(item => item.word === pickLeft);
    if (match && match.meaning === meaning) {
      const next = [...done, pickLeft];
      setDone(next); setPickLeft(null);
      total.current.correct++;
      if (next.length === group.length) {
        const ms = Date.now() - started.current;
        total.current.ms += ms;
        total.current.score += group.length * 100 + Math.round(Math.max(0, 1 - ms / (group.length * 8000)) * 100) - mistakes.current * 25;
        window.setTimeout(() => {
          if (round + 1 >= groups.length) onDone({ score: Math.max(0, total.current.score), correct: total.current.correct, ms: total.current.ms });
          else { setRound(round + 1); setDone([]); mistakes.current = 0; started.current = Date.now(); }
        }, 450);
      }
    } else {
      mistakes.current++;
      setWrong(meaning); window.setTimeout(() => setWrong(null), 450); setPickLeft(null);
    }
  }
  return (
    <div className="space-y-4">
      <ChunkyProgress value={(round + done.length / group.length) / groups.length} />
      <h2 className="font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('ch.matchTitle')}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-2.5">{left.map(word => <Tile key={word} center disabled={done.includes(word)} onClick={() => setPickLeft(word)}
          state={done.includes(word) ? 'correct' : pickLeft === word ? 'selected' : 'idle'} className="min-h-14 justify-center text-sm">{word}</Tile>)}</div>
        <div className="space-y-2.5">{right.map(meaning => {
          const solved = done.some(word => group.find(item => item.word === word)?.meaning === meaning);
          return <Tile key={meaning} center disabled={solved} onClick={() => choose(meaning)} state={solved ? 'correct' : wrong === meaning ? 'wrong' : 'idle'} className="min-h-14 justify-center text-xs">{meaning}</Tile>;
        })}</div>
      </div>
    </div>
  );
}
