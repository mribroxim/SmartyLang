import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Chunky, tactile controls for lessons: a solid bottom edge that the control
 * presses into. Black-and-white like Smarty; green/red only mean right/wrong.
 */
type Tone = 'primary' | 'secondary' | 'good' | 'bad';

const TONE: Record<Tone, string> = {
  primary:
    'bg-zinc-900 text-white shadow-[0_4px_0_0_#000] hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_4px_0_0_#a1a1aa] dark:hover:bg-white dark-keep',
  secondary:
    'bg-white text-zinc-900 border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:shadow-[0_4px_0_0_#3f3f46] dark:hover:bg-zinc-800',
  good: 'bg-emerald-500 text-white shadow-[0_4px_0_0_#047857] hover:bg-emerald-400 dark-keep',
  bad: 'bg-rose-500 text-white shadow-[0_4px_0_0_#be123c] hover:bg-rose-400 dark-keep',
};

export function ChunkyButton({ tone = 'primary', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-serif text-[15px] font-extrabold uppercase tracking-wide transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[4px] active:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-[0_4px_0_0_#cbd5e1] dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 dark:disabled:shadow-[0_4px_0_0_#27272a] ${TONE[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim' | 'used';

const TILE: Record<TileState, string> = {
  idle: 'border-slate-200 bg-white text-zinc-800 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_3px_0_0_#3f3f46] dark:hover:bg-zinc-800',
  selected: 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:text-white dark:shadow-[0_3px_0_0_#e4e4e7]',
  correct: 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_3px_0_0_#10b981] dark:bg-emerald-950 dark:text-emerald-200',
  wrong: 'border-rose-500 bg-rose-50 text-rose-800 shadow-[0_3px_0_0_#f43f5e] dark:bg-rose-950 dark:text-rose-200',
  dim: 'border-slate-200 bg-white text-slate-400 shadow-[0_3px_0_0_#e2e8f0] opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:shadow-none',
  used: 'border-slate-200 bg-slate-100 text-transparent shadow-none dark:border-zinc-800 dark:bg-zinc-800',
};

/** Selectable answer tile. `hotkey` shows a small number badge (1–9). */
export function Tile({ state = 'idle', hotkey, center = false, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { state?: TileState; hotkey?: number; center?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-[transform,box-shadow,background-color,border-color] duration-75 active:translate-y-[3px] active:shadow-none disabled:active:translate-y-0 ${TILE[state]} ${className}`}
    >
      {hotkey != null && (
        <span aria-hidden className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-bold ${state === 'selected' ? 'border-zinc-900 dark:border-zinc-100' : state === 'correct' ? 'border-emerald-500' : state === 'wrong' ? 'border-rose-500' : 'border-slate-200 text-slate-400 dark:border-zinc-700'}`}>
          {hotkey}
        </span>
      )}
      <span className={`min-w-0 flex-1 break-words [overflow-wrap:anywhere] ${center ? 'text-center' : ''}`}>{children}</span>
    </button>
  );
}

/** Chunky progress bar for the lesson top bar. */
export function ChunkyProgress({ value }: { value: number }) {
  const pct = Math.max(3, Math.min(100, value * 100));
  return (
    <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div className="h-full rounded-full bg-zinc-900 transition-[width] duration-500 ease-out dark:bg-zinc-100" style={{ width: `${pct}%` }}>
        <div className="mx-2 mt-[3px] h-[4px] rounded-full bg-white/25" />
      </div>
    </div>
  );
}
