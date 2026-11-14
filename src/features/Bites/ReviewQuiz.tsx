import { useMemo, useRef, useState } from 'react';
import type { ReadingText } from '../../lib/reading-logic';
import { seededPick } from '../../lib/bites/deriveBites';
import { answerFeedback } from '../../lib/smarty/answer';
import { useUiLang } from '../../contexts/UiLangContext';
import { Check, X } from 'lucide-react';

/** A short, untimed review. Each question is graded once and advances explicitly. */
export function ReviewQuiz({ text, words, meanings, allVocabMap, onComplete }: {
  text: ReadingText; words: string[]; meanings: Record<string, string>; allVocabMap: Map<string, string>; onComplete: (result: any) => void;
}) {
  const { t } = useUiLang();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const results = useRef<{ correct: string[]; mistakes: string[] }>({ correct: [], mistakes: [] });
  const finished = useRef(false);
  const word = words[index];
  const defOf = (w: string) => meanings[w] || text.vocabulary.find(v => v.word.toLowerCase() === w)?.definition || allVocabMap.get(w) || w;
  const definition = defOf(word);
  const reverse = index % 2 === 1;
  const answer = reverse ? word : definition;
  const options = useMemo(() => {
    const local = reverse ? words : words.map(defOf);
    let pool = [...new Set(local)].filter(value => value && value !== answer);
    if (!pool.length) pool = [...new Set(reverse ? allVocabMap.keys() : allVocabMap.values())].filter(value => value && value !== answer);
    return seededPick([answer, ...seededPick(pool, 3, `${text.id}:${index}:others`)], 4, `${text.id}:${index}:order`);
  }, [answer, reverse, text.id, index, meanings, allVocabMap, text.vocabulary]);
  const choose = (option: string) => {
    if (picked != null || finished.current) return;
    setPicked(option);
    const correct = option === answer;
    results.current[correct ? 'correct' : 'mistakes'].push(word);
    answerFeedback(correct, { questionId: String(index), word });
  };
  const next = () => {
    if (picked == null || finished.current) return;
    if (index + 1 < words.length) { setIndex(i => i + 1); setPicked(null); return; }
    finished.current = true;
    onComplete({ score: results.current.correct.length, total: words.length, correctWords: results.current.correct, mistakes: results.current.mistakes });
  };
  return <section className="px-2 py-6 sm:px-6 max-w-xl mx-auto">
    <p className="text-xs font-bold text-slate-500">{t('today.question', { n: index + 1, total: words.length })}</p>
    <h2 className={`my-7 text-center font-black break-words text-zinc-900 dark:text-zinc-50 ${reverse ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'}`}>{reverse ? definition : word}</h2>
    <p className="text-center text-sm text-slate-500 mb-5">{t(reverse ? 'today.chooseWord' : 'today.meaning')}</p>
    <div className="grid gap-3">
      {options.map(option => <button key={option} type="button" disabled={picked != null} onClick={() => choose(option)} className={`rounded-2xl border-2 px-4 py-4 text-left text-sm font-semibold transition active:scale-[.98] ${picked != null && option === answer ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : picked === option ? 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100' : 'border-slate-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'}`}>{option}</button>)}
    </div>
    {picked != null && <div className="mt-5" aria-live="polite">
      <p className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">{picked === answer ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-rose-500" />}{picked === answer ? t('today.correct') : t('today.answer', { answer })}</p>
      <button type="button" onClick={next} className="mt-4 w-full rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 font-black shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">{t('smarty.continue')}</button>
    </div>}
  </section>;
}
