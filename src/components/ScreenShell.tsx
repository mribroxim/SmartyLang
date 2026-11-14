import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PageEnter } from './motion';
import { Sticker, type StickerId } from './stickers/Sticker';

/** One sticker per day from the list (stable within a day, changes tomorrow). */
function dailyPick(ids: StickerId[]): StickerId {
  const d = new Date();
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  return ids[day % ids.length];
}

/**
 * Shared student-screen frame. Compact single column on phones; on desktop the
 * column widens and gains breathing room so it reads as a real app pane rather
 * than a phone view stretched next to the sidebar.
 */
export function ScreenShell({
  children,
  title,
  subtitle,
  actions,
  size = 'default',
  className = '',
  stickers,
}: {
  children: React.ReactNode;
  /** Smarty sticker(s) beside the title; one is picked per day. */
  stickers?: StickerId[];
  title?: string;
  subtitle?: string;
  /** Desktop-only header controls, placed opposite the title. */
  actions?: React.ReactNode;
  /** `wide` for grid-heavy screens, `narrow` for reading/forms. */
  size?: 'default' | 'wide' | 'narrow';
  className?: string;
}) {
  const width =
    size === 'wide'
      ? 'max-w-[480px] lg:max-w-[880px] xl:max-w-[1040px]'
      : size === 'narrow'
      ? 'max-w-[480px] lg:max-w-[620px]'
      : 'max-w-[480px] lg:max-w-[760px] xl:max-w-[860px]';

  return (
    <main className={`flex-1 w-full bg-white dark:bg-zinc-950 ${className}`}>
      <PageEnter className={`mx-auto w-full ${width} px-4 pt-5 pb-8 lg:px-8 lg:pt-10 lg:pb-14`}>
        {(title || subtitle || actions) && (
          <header className="mb-4 lg:mb-7 lg:flex lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0 flex items-center gap-3">
              {stickers?.length ? <Sticker id={dailyPick(stickers)} size={64} priority="ambient" mode="once" className="shrink-0 -my-2" /> : null}
              <div className="min-w-0">
              {title && (
                <h1 className="text-[24px] lg:text-[32px] font-serif font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 lg:mt-2 text-[13px] lg:text-[15px] text-slate-500 dark:text-zinc-400 leading-snug">
                  {subtitle}
                </p>
              )}
              </div>
            </div>
            {actions && <div className="hidden lg:flex items-center gap-2 shrink-0">{actions}</div>}
          </header>
        )}
        {children}
      </PageEnter>
    </main>
  );
}

/* Chunky Smarty surfaces: 2px borders, a solid bottom edge that presses in, rounded-2xl. */
export const seCard =
  'bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]';
export const seRow =
  'w-full flex items-center gap-3.5 p-3.5 text-left bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none';

/** Stacked on phones, two columns once there is desktop room. */
export const seGrid2 = 'grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4';
/** Stacked on phones, three columns on wide desktop. */
export const seGrid3 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4';

/** Shared interaction affordance: chunky press-down, hover tint, visible focus. */
export const seInteractive =
  'transition-[transform,box-shadow,background-color,border-color] duration-75 active:translate-y-[3px] active:shadow-none hover:bg-slate-50 dark:hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950';

export const seFill = 'bg-zinc-900 dark:bg-zinc-100';
export const seChipOn = 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-[0_2px_0_0_#000] dark:shadow-[0_2px_0_0_#a1a1aa]';
export const seChipOff = 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-2 border-slate-200 dark:border-zinc-800';

/** Primary action (chunky). Full width on phones, content width on desktop. */
export const sePrimary =
  'w-full lg:w-auto lg:min-w-[220px] inline-flex items-center justify-center gap-2 py-3.5 lg:py-3 px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-serif font-extrabold uppercase tracking-wide text-[14px] shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[4px] active:shadow-none hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 dark-keep';

/** Secondary action (chunky, quiet). */
export const seSecondary =
  'w-full lg:w-auto lg:min-w-[160px] inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-serif font-extrabold uppercase tracking-wide text-[13px] text-zinc-700 dark:text-zinc-200 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#3f3f46] transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[3px] active:shadow-none hover:bg-slate-50 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2';

export function HubRow({
  icon,
  iconClass = 'bg-slate-100 text-zinc-700',
  title,
  desc,
  meta,
  onClick,
  dark,
  selected,
  sticker,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  desc?: string;
  meta?: string;
  onClick: () => void;
  dark?: boolean;
  /** Draws the row as a chosen option (used by pickers, not navigation). */
  selected?: boolean;
  /** Smarty sticker shown instead of the icon tile. */
  sticker?: StickerId;
  key?: React.Key;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full h-full flex items-center gap-3.5 p-3.5 lg:p-4 text-left rounded-2xl border-2 ${seInteractive} ${
        dark
          ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] hover:!bg-zinc-800 dark:hover:!bg-white dark-keep'
          : selected
          ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-[0_3px_0_0_#18181b] dark:shadow-[0_3px_0_0_#e4e4e7]'
          
          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]'
      }`}
    >
      {sticker ? (
        <span className={`shrink-0 ${dark ? 'rounded-xl bg-white p-0.5' : ''}`}><Sticker id={sticker} size={56} priority="ambient" mode="still" /></span>
      ) : (
        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${dark ? 'bg-white/10 text-white dark:bg-zinc-900/10 dark:text-zinc-900' : iconClass}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`font-serif font-extrabold text-[16px] leading-snug ${dark ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-50'}`}>{title}</div>
        {desc && <div className={`text-[12px] lg:text-[13px] leading-snug mt-0.5 ${dark ? 'text-zinc-400 dark:text-zinc-500' : 'text-slate-400'}`}>{desc}</div>}
        {meta && <div className={`text-[11px] font-semibold mt-1 ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>{meta}</div>}
      </div>
      <ChevronRight className={`w-4 h-4 shrink-0 ${dark ? 'text-zinc-500' : 'text-slate-300 dark:text-zinc-600'}`} />
    </button>
  );
}

export function ProgressRow({
  title,
  sub,
  pct,
  onClick,
  done,
}: {
  title: string;
  sub: string;
  pct: number;
  onClick: () => void;
  done?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] p-3.5 lg:p-4 flex items-center gap-3.5 text-left ${seInteractive}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${done ? 'bg-emerald-50' : 'bg-slate-100 dark:bg-zinc-800'}`}>
        📖
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif font-extrabold text-[15px] text-zinc-900 dark:text-zinc-50">{title}</div>
        <div className="text-[11px] text-slate-400 mb-1.5">{sub}</div>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : seFill}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" />
    </button>
  );
}
