import { useMemo, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import {
  ACTIVITY_FILTERS, countByFilter, filterTimeline, groupByDay,
  type ActivityFilter, type ActivityItem,
} from '../../lib/activity/model';

const PAGE = 30;
const card = 'rounded-2xl border-2 border-slate-200 bg-white shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]';
const chip = 'rounded-lg border-2 px-2 py-0.5 text-xs font-bold';

function useFormat() {
  const { t, uiLang } = useUiLang();
  const dayLabel = (ts: number) => {
    const d = new Date(ts), today = new Date(), y = new Date();
    y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('act.today');
    if (d.toDateString() === y.toDateString()) return t('act.yesterday');
    return d.toLocaleDateString(uiLang, { weekday: 'long', month: 'long', day: 'numeric' });
  };
  const time = (ts: number) => new Date(ts).toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit' });
  const duration = (ms?: number) => ms === undefined ? '' : ms < 60000 ? t('act.lessThanMinute') : t('act.minutes', { n: Math.round(ms / 60000) });
  return { t, dayLabel, time, duration };
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 dark:bg-zinc-800">
    <div className="truncate text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="truncate font-serif text-base font-extrabold text-zinc-900 dark:text-zinc-50">{value}</div>
  </div>;
}

function Row({ item }: { item: ActivityItem }) {
  const { t, time, duration } = useFormat();
  const [open, setOpen] = useState(false);
  const kindLabel = t(`act.kind.${item.kind}` as UiStringKey);
  const title = item.title || (item.type === 'vocabulary_add' ? t('act.wordSaved') : kindLabel);
  const good = item.accuracy === undefined ? undefined : item.accuracy >= 80;
  const hasDetail = item.accuracy !== undefined || item.ms !== undefined || item.xp !== undefined || item.mistakes.length > 0 || item.correct.length > 0 || item.total !== undefined;
  return (
    <li className={card}>
      <button type="button" aria-expanded={open} disabled={!hasDetail} onClick={() => setOpen(v => !v)}
        className="flex w-full min-w-0 items-center gap-3 rounded-2xl p-3 text-left disabled:cursor-default">
        <div className="min-w-0 flex-1">
          <div className="break-words font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{title}</div>
          <div className="truncate text-xs font-semibold text-slate-400">{kindLabel} · {time(item.ts)}</div>
        </div>
        {item.xp ? <span className="shrink-0 font-serif text-xs font-extrabold text-zinc-900 dark:text-zinc-50">+{item.xp} XP</span> : null}
        {item.accuracy !== undefined && (
          <span className={`shrink-0 rounded-xl border-2 px-2 py-0.5 font-serif text-xs font-extrabold ${good ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'}`}>{item.accuracy}%</span>
        )}
        {hasDetail && <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="space-y-3 border-t-2 border-slate-100 px-3 pb-3 pt-3 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
            {item.accuracy !== undefined && <Stat label={t('act.accuracy')} value={`${item.accuracy}%`} />}
            {item.score !== undefined && item.total ? <Stat label={t('act.score')} value={`${item.score}/${item.total}`} /> : null}
            {item.ms !== undefined && <Stat label={t('act.time')} value={duration(item.ms)} />}
            {item.xp !== undefined && <Stat label={t('act.xp')} value={String(item.xp)} />}
          </div>
          {item.mistakes.length > 0 ? (
            <div>
              <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{t('act.mistakes')}</div>
              <div className="flex flex-wrap gap-1.5">{[...new Set(item.mistakes)].map(w => <span key={w} className={`${chip} break-all border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300`}>{w}</span>)}</div>
            </div>
          ) : item.type === 'lesson-bite' && <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('act.noMistakes')}</p>}
          {item.correct.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{t('act.correctWords')}</div>
              <div className="flex flex-wrap gap-1.5">{[...new Set(item.correct)].map(w => <span key={w} className={`${chip} break-all border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300`}>{w}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * The one activity timeline: filter chips, days with totals, expandable rows, "load more".
 * Pass `onLoadMore` when the data itself is paged (teacher view); otherwise it pages locally.
 */
export function ActivityTimeline({ items, loading, hasMore, onLoadMore, loadingMore, filters = ACTIVITY_FILTERS }: {
  items: ActivityItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  filters?: ActivityFilter[];
}) {
  const { t, dayLabel } = useFormat();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [shown, setShown] = useState(PAGE);
  const counts = useMemo(() => countByFilter(items), [items]);
  const filtered = useMemo(() => filterTimeline(items, filter), [items, filter]);
  const visible = onLoadMore ? filtered : filtered.slice(0, shown);
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const more = onLoadMore ? !!hasMore : filtered.length > shown;

  return (
    <div className="min-w-0 space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t('act.title')}>
        {filters.map(f => {
          const on = f === filter;
          return <button key={f} type="button" role="tab" aria-selected={on} onClick={() => { setFilter(f); setShown(PAGE); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3 py-1.5 font-serif text-xs font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[2px] active:shadow-none ${on
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_2px_0_0_#000] dark-keep dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
              : 'border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-[0_2px_0_0_#3f3f46]'}`}>
            {t(`act.filter.${f}` as UiStringKey)}
            <span className={`rounded-md px-1.5 text-[10px] ${on ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-800'}`}>{counts[f]}</span>
          </button>;
        })}
      </div>

      {loading ? <p role="status" className="py-8 text-center text-sm font-semibold text-slate-400">{t('act.loading')}</p>
        : groups.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-400">{t(filter === 'all' ? 'act.empty' : 'act.emptyFilter')}</p>
        : groups.map(g => (
          <section key={g.key} aria-label={dayLabel(g.ts)}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 px-1">
              <h3 className="font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{dayLabel(g.ts)}</h3>
              <span className="text-[11px] font-bold text-slate-400">{t('act.dayTotals', { n: g.items.length, xp: g.xp })}</span>
            </div>
            <ul className="space-y-2">{g.items.map(item => <Row key={item.id} item={item} />)}</ul>
          </section>
        ))}

      {more && !loading && (
        <button type="button" disabled={loadingMore} onClick={() => onLoadMore ? onLoadMore() : setShown(n => n + PAGE)}
          className="mx-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-zinc-700 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[0_3px_0_0_#3f3f46]">
          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}{t('act.loadMore')}
        </button>
      )}
    </div>
  );
}

export { Stat as ActivityStat };
