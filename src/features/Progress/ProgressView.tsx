import { ArrowLeft, Check, Flame } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { ScreenShell, seCard } from '../../components/ScreenShell';
import { useProgressData } from './useProgressData';
import { deltaPct, heatLevel, youCan, type WeekStats } from '../../lib/progress/recap';

const HEAT = [
  'bg-slate-100 dark:bg-zinc-800',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-600',
  'bg-emerald-600 dark:bg-emerald-400',
];

const H2 = 'mb-3 font-serif text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400';

function Stat({ label, now, before, noChange, up, down, first }: { label: string; now: number; before: number; noChange: string; up: (n: number) => string; down: (n: number) => string; first: string }) {
  const d = deltaPct(now, before);
  const text = d === null ? first : d === 0 ? noChange : d > 0 ? up(d) : down(-d);
  const tone = d === null || d === 0 ? 'text-slate-400' : d > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500';
  return (
    <div className={`${seCard} min-w-0 p-3.5`}>
      <div className="font-serif text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{now}</div>
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{label}</div>
      <div className={`mt-1 text-[11px] font-bold leading-snug ${tone}`}>{text}</div>
    </div>
  );
}

export function ProgressView({ onBack }: { onBack: () => void }) {
  const { t } = useUiLang();
  const d = useProgressData();
  const { thisWeek, lastWeek } = d.weeks;
  const fields: [keyof WeekStats, string][] = [
    ['xp', t('progress.xp')], ['bites', t('progress.bites')], ['minutes', t('progress.minutes')], ['words', t('progress.words')], ['daysActive', t('progress.days')],
  ];
  const dow = [t('progress.dow.m'), t('progress.dow.t'), t('progress.dow.w'), t('progress.dow.t'), t('progress.dow.f'), t('progress.dow.s'), t('progress.dow.s')];
  return (
    <ScreenShell title={t('progress.title')} size="narrow">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-[0_3px_0_0_#27272a]">
        <ArrowLeft className="h-4 w-4" />{t('progress.back')}
      </button>

      <section className="mb-7">
        <h2 className={H2}>{t('progress.thisWeek')} <span className="normal-case text-slate-400">· {t('progress.vsLast')}</span></h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([k, label], i) => (
            <div key={k} className={i === fields.length - 1 && fields.length % 2 ? 'col-span-2' : ''}>
              <Stat label={label} now={thisWeek[k]} before={lastWeek[k]}
                noChange={t('progress.noChange')} first={t('progress.firstWeek')}
                up={(n) => t('progress.up', { n })} down={(n) => t('progress.down', { n })} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <h2 className={H2}>{t('progress.words.title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${seCard} p-3.5`}>
            <div className="font-serif text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{d.totals.learned}</div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{t('progress.words.learned')}</div>
          </div>
          <div className={`${seCard} p-3.5`}>
            <div className="font-serif text-3xl font-extrabold text-amber-600 dark:text-amber-400">{d.totals.mastered}</div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{t('progress.words.mastered')}</div>
          </div>
        </div>
        {d.totals.learned === 0 && <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('progress.words.empty')}</p>}
      </section>

      <section className="mb-7">
        <h2 className={H2}>{t('progress.level.title')}</h2>
        <div className={`${seCard} p-4`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('progress.level.n', { n: d.level })}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{t('progress.level.toNext', { n: 1000 - d.xpInLevel, next: d.level + 1 })}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={1000} aria-valuenow={d.xpInLevel}>
            <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.max(2, d.xpInLevel / 10)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-extrabold text-amber-700 dark:text-amber-400">
            <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{t('progress.level.streak', { n: d.streak })}</span>
            <span className="text-slate-500 dark:text-zinc-400">{t('progress.level.best', { n: d.bestStreak })}</span>
          </div>
        </div>
      </section>

      <section className="mb-7">
        <h2 className={H2}>{t('progress.heat.title')}</h2>
        <div className={`${seCard} p-4`}>
          <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold uppercase text-slate-400">
            {dow.map((x, i) => <span key={i}>{x}</span>)}
          </div>
          <div className="grid gap-1.5">
            {d.heat.map((row, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {row.map((day) => (
                  <div key={day.key} title={t('progress.heat.day', { n: day.count, date: day.key })}
                    className={`aspect-square rounded-lg ${day.future ? 'border-2 border-dashed border-slate-200 dark:border-zinc-800' : HEAT[heatLevel(day.count)]}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-400">
            {t('progress.heat.legend')}{HEAT.map((c, i) => <span key={i} className={`h-3 w-3 rounded ${c}`} />)}{t('progress.heat.legendMore')}
          </div>
        </div>
      </section>

      <section>
        <h2 className={H2}>{t('progress.cando.title')}</h2>
        {d.canDo.length === 0 ? (
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('progress.cando.empty')}</p>
        ) : (
          <div className="space-y-3">
            {d.canDo.map((u) => (
              <div key={u.unitKey} className={`${seCard} p-4`}>
                <div className="mb-2 font-serif text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{u.title}</div>
                <ul className="space-y-2">
                  {u.items.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" strokeWidth={4} /></span>
                      <span className="min-w-0 break-words">{youCan(x)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
