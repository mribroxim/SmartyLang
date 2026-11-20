import { useUiLang } from '../contexts/UiLangContext';
import { Type } from 'lucide-react';

/**
 * Returns the Tailwind classes for a given font scale (1-5).
 * Reused across all reading/passage views for consistent sizing.
 */
export function fontScaleClasses(scale: number): string {
  if (scale <= 1) return 'text-lg md:text-xl';
  if (scale === 2) return 'text-xl md:text-2xl';
  if (scale === 3) return 'text-xl md:text-3xl';
  if (scale === 4) return 'text-2xl md:text-4xl';
  return 'text-3xl md:text-5xl';
}

interface FontSizeControlProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

/**
 * Pill-shaped font size slider. Drop into any reading/passage view header
 * and bind to local state. Persists across the session via the caller.
 */
export function FontSizeControl({ value, onChange, className = '' }: FontSizeControlProps) {
  const { t } = useUiLang();
  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm ${className}`}>
      <Type className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">{t("core.fontsizecontrol.size_b71523")}</span>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-20 sm:w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
        aria-label={t("core.fontsizecontrol.adjust_text_size_3118b6")}
      />
      <span className="text-[10px] font-mono font-bold text-slate-600 w-3 text-right">{value}</span>
    </div>
  );
}
