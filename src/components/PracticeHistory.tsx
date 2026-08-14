import React, { useMemo } from 'react';
import { Clock, TrendingUp, Trash2 } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { matchesContentLang } from '../lib/activityMeta';

export interface HistoryEntry {
  title: string;
  level?: string;
  timestamp: number;
  score?: number;
  total?: number;
  contentLang?: string;
}

interface PracticeHistoryProps {
  /** localStorage key holding an array of HistoryEntry objects. */
  storageKey: string;
  /** Label shown in the section header (e.g. "Past Comprehensive Readings"). */
  label: string;
  /** Optional filter — only show entries matching this level. */
  level?: string;
  /** How many entries to show before "show more" is needed (default 5). */
  initial?: number;
}

/**
 * Generic past-completions list. Reads a flat array from localStorage and
 * renders newest-first with score badges. Used by Comprehensive Reading,
 * Comprehensive Listening, Interactive Story, and Audio Dictation.
 */
export function PracticeHistory({ storageKey, label, level, initial = 5 }: PracticeHistoryProps) {
  const [showAll, setShowAll] = React.useState(false);
  const { contentLang } = useContentLang();

  const entries = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const filtered = parsed.filter((e: HistoryEntry) => {
        if (!matchesContentLang(e, contentLang)) return false;
        if (level && e.level !== level) return false;
        return true;
      });
      return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, [storageKey, level, showAll, contentLang]);

  if (entries.length === 0) return null;

  const visible = showAll ? entries : entries.slice(0, initial);

  const clearAll = () => {
    if (!confirm(`Clear ${entries.length} ${label.toLowerCase()} from your history?`)) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const remaining = (parsed as HistoryEntry[]).filter((e) => {
        // Keep other languages; also keep other levels if level filter is set
        if (matchesContentLang(e, contentLang)) {
          if (level) return e.level !== level;
          return false;
        }
        return true;
      });
      localStorage.setItem(storageKey, JSON.stringify(remaining));
      window.location.reload();
    } catch {}
  };

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> {label}
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{entries.length}</span>
        </h3>
        <button
          onClick={clearAll}
          className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          title="Clear history"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {visible.map((e, i) => {
          const pct = (typeof e.score === 'number' && typeof e.total === 'number' && e.total > 0)
            ? Math.round((e.score / e.total) * 100)
            : null;
          const scoreColor = pct === null ? 'text-slate-400' :
            pct >= 70 ? 'text-emerald-600' :
            pct >= 40 ? 'text-amber-600' : 'text-rose-600';
          return (
            <li key={i} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{e.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  {e.level && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
                      {e.level}
                    </span>
                  )}
                  <span>{new Date(e.timestamp).toLocaleString()}</span>
                </p>
              </div>
              {typeof e.score === 'number' && typeof e.total === 'number' && (
                <div className="text-right shrink-0">
                  <div className={`text-lg font-black font-mono ${scoreColor} flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" />
                    {e.score}/{e.total}
                  </div>
                  {pct !== null && (
                    <p className={`text-[10px] uppercase font-bold ${scoreColor}`}>{pct}%</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {entries.length > initial && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="w-full px-5 py-3 text-xs font-bold text-slate-500 hover:text-zinc-900 hover:bg-slate-50 border-t border-slate-100 transition-colors"
        >
          {showAll ? 'Show less' : `Show all ${entries.length}`}
        </button>
      )}
    </div>
  );
}
