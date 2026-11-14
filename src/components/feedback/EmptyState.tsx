import type { ReactNode } from 'react';
import { Sticker, type StickerId } from '../stickers/Sticker';

/** Friendly empty state: a Smarty sticker, a title, a short line and an optional action. */
export function EmptyState({
  sticker = 'pose.loaf', title, body, action, size = 140, compact = false, className = '',
}: {
  sticker?: StickerId;
  title: string;
  body?: ReactNode;
  action?: { label: string; onClick: () => void };
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-1 py-4' : 'gap-2 py-10'} ${className}`}>
      <Sticker id={sticker} size={compact ? Math.min(size, 96) : size} priority="normal" />
      <h3 className={`${compact ? 'text-sm' : 'text-base'} font-black text-zinc-900 dark:text-zinc-50`}>{title}</h3>
      {body && <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs">{body}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-bold text-white hover:bg-black active:scale-95 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
