import React from 'react';
import { Award, BookOpen, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

export const LEVEL_THEMES = [
  {
    bg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    icon: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    border: 'hover:border-emerald-300',
    progress: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    card: 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100',
    accent: 'text-emerald-600',
  },
  {
    bg: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    icon: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    border: 'hover:border-teal-300',
    progress: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    card: 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100',
    accent: 'text-teal-600',
  },
  {
    bg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    icon: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    border: 'hover:border-blue-300',
    progress: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    card: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
    accent: 'text-blue-600',
  },
  {
    bg: 'bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white',
    icon: 'bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white',
    border: 'hover:border-zinc-400',
    progress: 'bg-zinc-700',
    badge: 'bg-zinc-100 text-zinc-700',
    card: 'bg-zinc-100 border-zinc-200 text-zinc-900 hover:bg-zinc-200',
    accent: 'text-zinc-900',
  },
  {
    bg: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    icon: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    border: 'hover:border-violet-300',
    progress: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    card: 'bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100',
    accent: 'text-violet-600',
  },
] as const;

export function LevelCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5">
      {children}
    </div>
  );
}

type LevelCardProps = {
  title: string;
  desc?: string;
  pct?: number;
  themeIndex?: number;
  icon?: React.ReactNode;
  onClick: () => void;
  forYou?: boolean;
  certAwarded?: boolean;
  onCertClick?: () => void;
};

export const LevelCard: React.FC<LevelCardProps> = ({
  title,
  desc,
  pct = 0,
  themeIndex = 0,
  icon,
  onClick,
  forYou,
  certAwarded,
  onCertClick,
}) => {
  const theme = LEVEL_THEMES[themeIndex % LEVEL_THEMES.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-zinc-900 p-4 md:p-7 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md md:hover:shadow-xl transition-all duration-300 text-left flex flex-row md:flex-col items-center md:items-stretch md:justify-between gap-3.5 md:min-h-[240px] ${theme.border} md:hover:-translate-y-1 active:scale-[0.99] ${forYou ? 'ring-1 ring-zinc-900 dark:ring-zinc-100' : ''}`}
    >
      {(pct === 100 || certAwarded) && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white p-1.5 md:p-2 rounded-bl-2xl md:rounded-bl-3xl z-10">
          <Award className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )}
      <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${theme.bg}`}>
        {icon ?? <BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5 md:mb-2">
          <h2 className="text-base md:text-2xl font-bold text-slate-800 dark:text-zinc-50">{title}</h2>
          {forYou && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md">
              For you
            </span>
          )}
        </div>
        {desc && <p className="text-slate-500 text-xs md:text-sm mb-2 md:mb-0">{desc}</p>}
        <div className="md:mt-8">
          <div className="flex justify-between items-center mb-1.5 md:mb-2 text-[11px] md:text-sm font-semibold">
            <span className="text-slate-700 dark:text-zinc-300 hidden md:inline">Progress</span>
            <span className={pct === 100 ? 'text-emerald-500' : 'text-slate-900 dark:text-zinc-100'}>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 md:h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${pct === 100 ? 'bg-emerald-500' : theme.progress}`}
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
          {certAwarded && onCertClick && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onCertClick(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.stopPropagation(); onCertClick(); }
              }}
              className="mt-2 md:mt-3 inline-block text-xs font-bold text-amber-700 underline"
            >
              View certificate
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 md:hidden shrink-0" />
    </button>
  );
};

export function LibraryCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{children}</div>;
}

type LibraryCardProps = {
  title: string;
  preview?: string;
  meta?: string;
  badge?: React.ReactNode;
  locked?: boolean;
  done?: boolean;
  onClick: () => void;
};

export const LibraryCard: React.FC<LibraryCardProps> = ({
  title,
  preview,
  meta,
  badge,
  locked,
  done,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-2xl border flex flex-col text-left shadow-sm hover:shadow-md hover:border-zinc-400 transition-all cursor-pointer group gap-3 ${
        done ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">
          {locked ? (
            <Lock className="w-4 h-4 text-slate-400" />
          ) : done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-[15px] md:text-base text-slate-800 dark:text-zinc-50 group-hover:text-black dark:group-hover:text-white transition-colors leading-snug">
              {title}
            </h3>
            {badge}
          </div>
          {preview && <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-1.5">{preview}</p>}
          {meta && <p className="text-xs text-slate-400 font-medium">{meta}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <div className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
