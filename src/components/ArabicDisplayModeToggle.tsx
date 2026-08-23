import React from 'react';
import { Type } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';

interface Props {
  className?: string;
  compact?: boolean;
}

export function ArabicDisplayModeToggle({ className = '', compact = false }: Props) {
  const { contentLang, arabicDisplayMode, setArabicDisplayMode } = useContentLang();

  if (contentLang !== 'ar') return null;

  const btnClass = compact
    ? 'px-2.5 py-1.5 text-xs rounded-lg'
    : 'px-3 py-2 text-sm rounded-xl';

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Arabic text style</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
        Switch between the same Arabic content with or without harakat.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setArabicDisplayMode('with-harakat')}
          className={`${btnClass} border font-semibold transition-colors ${
            arabicDisplayMode === 'with-harakat'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
          }`}
        >
          With harakat
        </button>
        <button
          type="button"
          onClick={() => setArabicDisplayMode('without-harakat')}
          className={`${btnClass} border font-semibold transition-colors ${
            arabicDisplayMode === 'without-harakat'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
          }`}
        >
          Without harakat
        </button>
      </div>
    </div>
  );
}
