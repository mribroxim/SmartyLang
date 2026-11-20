import { DialogSurface } from '../../components/DialogSurface';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, X } from 'lucide-react';
import { loadLocalCompletions, type CompletionRecord, type CompletionType } from '../../lib/completions';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';

type Cat = 'all' | 'lessons' | 'reading' | 'listening' | 'speaking' | 'writing' | 'exercises' | 'ielts';

const CATS: { id: Cat; sticker: StickerId; types: CompletionType[] }[] = [
  { id: 'all', sticker: 'flow.learning-path', types: [] },
  { id: 'lessons', sticker: 'learn.bookworm', types: ['lesson-bite'] },
  { id: 'reading', sticker: 'read.reading-glasses', types: ['comprehensive-reading', 'reading-pronunciation', 'story'] },
  { id: 'listening', sticker: 'learn.listening', types: ['comprehensive-listening', 'dictation'] },
  { id: 'speaking', sticker: 'learn.chatterbox', types: ['speaking', 'shadowing'] },
  { id: 'writing', sticker: 'learn.scribbler', types: ['writing', 'writing-mock'] },
  { id: 'exercises', sticker: 'state.playtime', types: ['exercise'] },
  { id: 'ielts', sticker: 'learn.smarty-pants', types: ['ielts-reading', 'ielts-listening', 'ielts-speaking', 'ielts-writing', 'ielts-full-mock'] },
];
const catOf = (type: CompletionType): Cat => CATS.find((c) => c.types.includes(type))?.id ?? 'exercises';

/**
 * History popup: "All" first, then one chip per kind of practice. Each entry
 * shows its sticker, title, time and score, grouped by day.
 */
export function HistorySheet({ onClose, showIelts }: { onClose: () => void; showIelts: boolean }) {
  const { t, uiLang } = useUiLang();
  const [cat, setCat] = useState<Cat>('all');
  const [open, setOpen] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const all = useMemo(() => loadLocalCompletions().slice().sort((a, b) => b.timestamp - a.timestamp), []);
  const cats = CATS.filter((c) => showIelts || c.id !== 'ielts');
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: 0 };
    for (const r of all) { const c = catOf(r.type); if (c === 'ielts' && !showIelts) continue; m.all++; m[c] = (m[c] ?? 0) + 1; }
    return m;
  }, [all, showIelts]);
  const list = all.filter((r) => { const c = catOf(r.type); return (showIelts || c !== 'ielts') && (cat === 'all' || c === cat); });

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);

  const dayLabel = (ts: number) => {
    const d = new Date(ts); const today = new Date();
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('history.today');
    if (d.toDateString() === y.toDateString()) return t('history.yesterday');
    return d.toLocaleDateString(uiLang, { weekday: 'long', month: 'long', day: 'numeric' });
  };
  const score = (r: CompletionRecord) =>
    typeof r.accuracy === 'number' ? `${Math.round(r.accuracy)}%`
    : typeof r.band === 'number' ? `${t('history.band')} ${r.band}`
    : typeof r.score === 'number' && typeof r.total === 'number' && r.total > 0 ? `${r.score}/${r.total}` : '';
  const xp = (r: CompletionRecord) => (typeof r.data?.xp === 'number' && r.data.xp > 0 ? `+${r.data.xp} XP` : '');

  let lastDay = '';

  return (
    <DialogSurface role="presentation" aria-modal={undefined} onClose={onClose} className="fixed inset-0 z-[85] flex items-end justify-center bg-zinc-900/55 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="history-title"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="flex h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border-2 border-slate-200 bg-white shadow-[0_6px_0_0_#e2e8f0] outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_6px_0_0_#27272a] sm:h-[80dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center gap-3 border-b-2 border-slate-100 px-5 py-4 dark:border-zinc-800">
          <Sticker id="state2.search-mode" size={52} mode="once" />
          <div className="min-w-0 flex-1">
            <h2 id="history-title" className="font-serif text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t('home.historyTitle')}</h2>
            <p className="text-xs font-semibold text-slate-400">{t('history.count', { n: counts.all ?? 0 })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('history.close')} className="rounded-xl border-2 border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* categories */}
        <div className="flex gap-2 overflow-x-auto border-b-2 border-slate-100 px-5 py-3 dark:border-zinc-800" role="tablist" aria-label={t('history.types')}>
          {cats.map((c) => {
            const on = cat === c.id;
            return (
              <button key={c.id} type="button" role="tab" aria-selected={on} onClick={() => setCat(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-2xl border-2 py-1 pl-1 pr-3 font-serif text-xs font-extrabold uppercase tracking-wide transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[2px] active:shadow-none ${on
                  ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-[0_2px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 dark:shadow-[0_2px_0_0_#e4e4e7]'
                  : 'border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-[0_2px_0_0_#3f3f46]'}`}>
                <Sticker id={c.sticker} size={30} mode="still" />
                {t(`history.cat.${c.id}` as UiStringKey)}
                <span className={`rounded-lg px-1.5 text-[10px] ${on ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800'}`}>{counts[c.id] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* entries */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.div key={cat} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              {list.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Sticker id="state2.empty-library" size={150} priority="hero" />
                  <p className="mt-2 font-serif font-extrabold text-zinc-900 dark:text-zinc-50">{t('history.emptyTitle')}</p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-zinc-400">{t('history.emptyBody')}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((r) => {
                    const day = dayLabel(r.timestamp);
                    const header = day !== lastDay;
                    lastDay = day;
                    const c = CATS.find((x) => x.id === catOf(r.type))!;
                    const s = score(r);
                    const good = typeof r.accuracy === 'number' ? r.accuracy >= 80 : undefined;
                    return (
                      <li key={r.id}>
                        {header && <div className="mb-2 mt-4 font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400 first:mt-0">{day}</div>}
                        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-[0_2px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_2px_0_0_#27272a]">
                        <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full items-center gap-3 p-2.5 pr-3 text-left">
                          <Sticker id={c.sticker} size={44} mode="still" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{r.title || t(`history.cat.${c.id}` as UiStringKey)}</div>
                            <div className="truncate text-xs font-semibold text-slate-400">
                              {t(`history.cat.${c.id}` as UiStringKey)} · {new Date(r.timestamp).toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {xp(r) && <span className="shrink-0 font-serif text-xs font-extrabold text-zinc-900 dark:text-zinc-50">{xp(r)}</span>}
                          {s && (
                            <span className={`shrink-0 rounded-xl border-2 px-2 py-0.5 font-serif text-xs font-extrabold ${good === undefined ? 'border-slate-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200' : good ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'}`}>
                              {s}
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === r.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {open === r.id && <EntryDetail key="d" r={r} />}
                        </AnimatePresence>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </DialogSurface>
  );
}

/** What happened in one session: time, score, XP, coins, mistakes and words got right. */
function EntryDetail({ r }: { r: CompletionRecord }) {
  const { t, uiLang } = useUiLang();
  const d = (r.data ?? {}) as { ms?: number; xp?: number; coins?: number; mistakes?: string[]; correctWords?: string[]; kind?: string };
  const rows: [string, string][] = [];
  rows.push([t('history.d.when'), new Date(r.timestamp).toLocaleString(uiLang, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })]);
  if (typeof d.ms === 'number' && d.ms > 0) rows.push([t('history.d.time'), d.ms < 60000 ? `${Math.max(1, Math.round(d.ms / 1000))} s` : `${Math.round(d.ms / 60000)} min`]);
  if (typeof r.accuracy === 'number') rows.push([t('history.d.accuracy'), `${Math.round(r.accuracy)}%`]);
  if (typeof r.score === 'number' && typeof r.total === 'number' && r.total > 0) rows.push([t('history.d.score'), `${r.score}/${r.total}`]);
  if (typeof d.xp === 'number' && d.xp > 0) rows.push(['XP', `+${d.xp}`]);
  if (typeof d.coins === 'number' && d.coins > 0) rows.push([t('history.d.coins'), `+${d.coins}`]);
  const mistakes = [...new Set((d.mistakes ?? []).filter(Boolean))];
  const right = [...new Set((d.correctWords ?? []).filter(Boolean))].filter((w) => !mistakes.includes(w));
  const chips = (words: string[], tone: string) => <div className="mt-1 flex flex-wrap gap-1.5">{words.slice(0, 24).map((w) => <span key={w} className={`rounded-lg px-2 py-0.5 text-xs font-bold ${tone}`}>{w}</span>)}</div>;
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
      <div className="space-y-3 border-t-2 border-slate-100 px-3 py-3 dark:border-zinc-800">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-zinc-800">
              <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{k}</dt>
              <dd className="font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{v}</dd>
            </div>
          ))}
        </dl>
        {mistakes.length > 0 && <div><div className="text-xs font-extrabold text-amber-700 dark:text-amber-300">{t('history.d.mistakes')}</div>{chips(mistakes, 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200')}</div>}
        {right.length > 0 && <div><div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{t('history.d.right')}</div>{chips(right, 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200')}</div>}
      </div>
    </motion.div>
  );
}
