import type { ElementType } from 'react';
import { seInteractive } from './ScreenShell';
import { useUiLang } from '../contexts/UiLangContext';

/** The same chunky controls used throughout the learning screens. */
export function ManagementTabs<T extends string>({ tabs, active, onSelect }: {
  tabs: { id: T; label: string; icon: ElementType }[];
  active: T;
  onSelect: (tab: T) => void;
}) {
  const { t } = useUiLang();
  return (
    <div role="group" className="mb-5 flex flex-wrap gap-1.5 border-b border-slate-200 pb-2 dark:border-zinc-800 sm:gap-2" aria-label={t('nav.management')}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" aria-pressed={active === id} onClick={() => onSelect(id)}
          className={`inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-center text-xs font-bold leading-tight [overflow-wrap:anywhere] sm:flex-none sm:px-4 sm:text-sm ${seInteractive} ${active === id ? 'border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50' : 'border-transparent text-zinc-600 dark:text-zinc-300'}`}>
          <Icon className="hidden h-4 w-4 shrink-0 sm:block" strokeWidth={2} aria-hidden />{label}
        </button>
      ))}
    </div>
  );
}
