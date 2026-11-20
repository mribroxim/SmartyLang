import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import {
  GAME_KINDS, GAME_KIND_IDS, MAX_GAME_WORDS, MIN_GAME_WORDS, checkWordRows, parseImportText,
  type GameKind, type GameWord, type WordCheck,
} from '../../lib/liveWordGame';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { MODE_META } from './liveGameKit';

export const setupField = 'w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50';

export type WordRow = { key: number; term: string; def: string };
let rowKey = 0;
export const newRow = (term = '', def = ''): WordRow => ({ key: ++rowKey, term, def });
export const rowsFromWords = (words: GameWord[]): WordRow[] => {
  const rows = words.map(item => newRow(item.word, item.meaning));
  while (rows.length < MIN_GAME_WORDS) rows.push(newRow());
  return rows;
};

/** Friendly sentence for the first thing wrong with the set (or null when it is ready). */
export function useWordMessage() {
  const { t } = useUiLang();
  return useCallback((check: WordCheck): string | null => {
    const has = (issue: WordCheck['issues'][number]) => check.issues.includes(issue);
    if (has('half')) return t('game.set.half');
    if (has('long')) return t('game.set.long');
    if (has('dupWord')) return t('game.set.dupWord');
    if (has('dupMeaning')) return t('game.set.dupMeaning');
    if (has('many')) return t('game.set.many', { max: MAX_GAME_WORDS, n: check.words.length - MAX_GAME_WORDS });
    if (has('few')) return t('game.set.few', { min: MIN_GAME_WORDS, n: check.words.length });
    return null;
  }, [t]);
}

/** Quizlet-style set builder: Term | Definition rows, paste import, and an optional lesson as the starting point. */
export function WordSetBuilder({ rows, onChange, showProblems }: { rows: WordRow[]; onChange: (rows: WordRow[]) => void; showProblems: boolean }) {
  const { t, tLevel } = useUiLang();
  const texts = useLevelTexts();
  const message = useWordMessage();
  const check = useMemo(() => checkWordRows(rows), [rows]);
  const [importing, setImporting] = useState(false);
  const [paste, setPaste] = useState('');
  const [note, setNote] = useState('');
  const focusNext = useRef<{ key: number; col: 'term' | 'def' } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    box.current?.querySelector<HTMLInputElement>(`[data-row="${target.key}"][data-col="${target.col}"]`)?.focus();
  }, [rows]);

  const update = (key: number, patch: Partial<WordRow>) => onChange(rows.map(row => (row.key === key ? { ...row, ...patch } : row)));
  const add = () => {
    if (rows.length >= MAX_GAME_WORDS + 4) return;
    const row = newRow();
    focusNext.current = { key: row.key, col: 'term' };
    onChange([...rows, row]);
  };
  const remove = (key: number) => {
    const rest = rows.filter(row => row.key !== key);
    while (rest.length < MIN_GAME_WORDS) rest.push(newRow());
    onChange(rest);
  };
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const onKey = (event: React.KeyboardEvent<HTMLInputElement>, index: number, col: 'term' | 'def') => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (col === 'term') { box.current?.querySelector<HTMLInputElement>(`[data-row="${rows[index].key}"][data-col="def"]`)?.focus(); return; }
    const next = rows[index + 1];
    if (next) box.current?.querySelector<HTMLInputElement>(`[data-row="${next.key}"][data-col="term"]`)?.focus();
    else add();
  };

  /** Fill empty rows first, then append; the rest is dropped with a note. */
  const merge = (words: GameWord[], skipped: number) => {
    const kept = rows.filter(row => row.term.trim() || row.def.trim());
    const room = Math.max(0, MAX_GAME_WORDS - kept.length);
    const added = words.slice(0, room).map(item => newRow(item.word, item.meaning));
    const next = [...kept, ...added];
    while (next.length < MIN_GAME_WORDS) next.push(newRow());
    onChange(next);
    const parts = [];
    if (words.length > room) parts.push(t('game.set.importCapped', { max: MAX_GAME_WORDS }));
    if (skipped) parts.push(t('game.set.importSkipped', { n: skipped }));
    setNote(parts.join(' '));
  };
  const importLines = () => {
    const { words, skipped } = parseImportText(paste);
    if (!words.length) { setNote(t('game.set.importNone')); return; }
    merge(words, skipped);
    setPaste('');
    if (words.length) setImporting(false);
  };
  const fromLesson = (id: string) => {
    if (!id) return;
    const lesson = Object.values(texts).flat().find(item => item.id === id);
    const pairs = [...new Map((lesson?.vocabulary ?? []).filter(item => item.word.trim() && item.definition.trim())
      .map(item => [item.word.toLowerCase(), item])).values()].slice(0, MAX_GAME_WORDS);
    onChange(rowsFromWords(pairs.map(item => ({ word: item.word, meaning: item.definition.replace(/\s+/g, ' ') }))));
    setNote('');
  };

  const problem = message(check);
  const bad = new Set(showProblems ? check.badRows : []);
  return <div ref={box} className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-serif text-lg font-extrabold">{t('game.set.title')}</h3>
      <span className={`rounded-full px-3 py-1 text-sm font-extrabold tabular-nums ${check.words.length >= MIN_GAME_WORDS && check.words.length <= MAX_GAME_WORDS ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'}`}
        role="status">{t('game.set.count', { n: check.words.length, max: MAX_GAME_WORDS })}</span>
    </div>
    <div className="hidden grid-cols-[2rem_1fr_1fr_6.5rem] gap-2 px-1 text-xs font-extrabold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:grid">
      <span /><span>{t('game.set.term')}</span><span>{t('game.set.def')}</span><span />
    </div>
    <ol className="space-y-2">
      {rows.map((row, index) => {
        const flagged = bad.has(index);
        const input = `${setupField} min-w-0 !py-2 ${flagged ? '!border-rose-500' : ''}`;
        return <li key={row.key} className="grid grid-cols-[2rem_1fr_auto] items-start gap-2 rounded-2xl border-2 border-slate-200 p-2 dark:border-zinc-800 sm:grid-cols-[2rem_1fr_1fr_6.5rem] sm:border-0 sm:p-0">
          <span className="pt-2.5 text-center font-serif text-sm font-extrabold text-zinc-500 dark:text-zinc-400">{index + 1}</span>
          <div className="col-start-2 space-y-2 sm:contents">
            <input data-row={row.key} data-col="term" className={input} value={row.term} maxLength={100} autoComplete="off" enterKeyHint="next"
              aria-label={`${t('game.set.term')} ${index + 1}`} placeholder={t('game.set.term')} aria-invalid={flagged || undefined}
              onChange={event => update(row.key, { term: event.target.value })} onKeyDown={event => onKey(event, index, 'term')} />
            <input data-row={row.key} data-col="def" className={input} value={row.def} maxLength={200} autoComplete="off" enterKeyHint={index === rows.length - 1 ? 'done' : 'next'}
              aria-label={`${t('game.set.def')} ${index + 1}`} placeholder={t('game.set.def')} aria-invalid={flagged || undefined}
              onChange={event => update(row.key, { def: event.target.value })} onKeyDown={event => onKey(event, index, 'def')} />
          </div>
          <div className="col-start-3 row-start-1 flex flex-col items-center sm:col-start-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t('game.set.up', { n: index + 1 })}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-zinc-800 sm:p-2"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label={t('game.set.down', { n: index + 1 })}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-zinc-800 sm:p-2"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => remove(row.key)} aria-label={t('game.set.remove', { n: index + 1 })}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 sm:p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        </li>;
      })}
    </ol>
    <div className="flex flex-wrap items-center gap-2">
      <ChunkyButton type="button" tone="secondary" className="!px-4 !py-2.5 !text-sm" onClick={add} disabled={rows.length >= MAX_GAME_WORDS + 4}><Plus className="h-4 w-4" />{t('game.set.add')}</ChunkyButton>
      <ChunkyButton type="button" tone="secondary" className="!px-4 !py-2.5 !text-sm" aria-expanded={importing} onClick={() => setImporting(value => !value)}><ClipboardPaste className="h-4 w-4" />{t('game.set.import')}</ChunkyButton>
    </div>
    {importing && <div className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800/60">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-zinc-600 dark:text-zinc-300">{t('game.set.importHint')}</span>
        <textarea className={setupField} rows={5} maxLength={4096} value={paste} onChange={event => setPaste(event.target.value)} placeholder={'apple: a round fruit\nbread - baked from flour'} />
      </label>
      <ChunkyButton type="button" className="!px-4 !py-2.5 !text-sm" onClick={importLines} disabled={!paste.trim()}><Check className="h-4 w-4" />{t('game.set.importAdd')}</ChunkyButton>
    </div>}
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-zinc-600 dark:text-zinc-300">{t('game.set.lesson')}</span>
      <select value="" onChange={event => fromLesson(event.target.value)} className={setupField}>
        <option value="">{t('game.set.lessonPick')}</option>
        {Object.entries(texts).map(([level, lessons]) => (
          <optgroup key={level} label={tLevel(level as keyof typeof texts)}>
            {lessons.filter(lesson => lesson.vocabulary.length >= MIN_GAME_WORDS).map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
    {note && <p role="status" className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{note}</p>}
    {showProblems && problem && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{problem}</p>}
  </div>;
}

/** Big selectable cards: pick one or several games, played in the order they were chosen. */
export function GamePicker({ value, onChange }: { value: GameKind[]; onChange: (modes: GameKind[]) => void }) {
  const { t } = useUiLang();
  const toggle = (id: GameKind) => onChange(value.includes(id) ? value.filter(item => item !== id) : [...value, id]);
  return <fieldset className="space-y-3">
    <legend className="font-serif text-lg font-extrabold">{t('game.pick.title')}</legend>
    <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('game.pick.hint')}</p>
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
      {GAME_KIND_IDS.map(id => {
        const meta = MODE_META[id];
        const Icon = meta.icon;
        const order = value.indexOf(id);
        const on = order >= 0;
        const rule = GAME_KINDS[id].teams;
        return <li key={id}>
          <label className={`relative flex h-full min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border-2 p-3 text-left transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sky-400 ${on ? 'border-zinc-900 bg-slate-50 shadow-[0_4px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:shadow-[0_4px_0_0_#f4f4f5]' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(id)} />
            <span className="flex items-center justify-between gap-2">
              <span className={`dark-keep flex h-11 w-11 items-center justify-center rounded-xl text-white ${meta.tint}`}><Icon className="h-6 w-6" aria-hidden /></span>
              {on && <span className="dark-keep flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-900 px-2 font-serif text-sm font-extrabold text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label={t('game.pick.order', { n: order + 1 })}>{order + 1}</span>}
            </span>
            <span className="font-serif text-base font-extrabold leading-tight">{t(meta.title)}</span>
            <span className="text-xs leading-snug text-zinc-600 dark:text-zinc-300">{t(meta.blurb)}</span>
            {rule !== 'optional' && <span className="mt-auto text-xs font-bold text-zinc-500 dark:text-zinc-400">{t(rule === 'always' ? 'game.setup.teamsAlways' : 'game.setup.solo')}</span>}
          </label>
        </li>;
      })}
    </ul>
  </fieldset>;
}

/** Team and read-aloud switches that only show up when a chosen game uses them. */
export function GameOptions({ modes, teams, onTeams, hostSpeaks, onHostSpeaks }: {
  modes: GameKind[]; teams: boolean; onTeams: (value: boolean) => void; hostSpeaks: boolean; onHostSpeaks: (value: boolean) => void;
}) {
  const { t } = useUiLang();
  const optional = modes.some(id => GAME_KINDS[id].teams === 'optional');
  if (!optional && !modes.some(id => id === 'spelling' || id === 'listen')) return null;
  return <div className="space-y-2">
    {optional && <label className="flex items-center gap-2 font-serif font-bold">
      <input type="checkbox" checked={teams} onChange={event => onTeams(event.target.checked)} />{t('game.setup.teams')}
    </label>}
    {modes.some(id => id === 'spelling' || id === 'listen') && <label className="flex items-center gap-2 font-serif font-bold">
      <input type="checkbox" checked={hostSpeaks} onChange={event => onHostSpeaks(event.target.checked)} />{t('game.setup.hostSpeaks')}
    </label>}
  </div>;
}
