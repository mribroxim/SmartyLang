import React from 'react';
import { Gauge } from 'lucide-react';

interface SpeechRateControlProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  /** Compact label; default "Speed" */
  label?: string;
}

/**
 * Pill-shaped speech-rate slider (0.5×–1.25×), matching FontSizeControl styling.
 */
export function SpeechRateControl({
  value,
  onChange,
  className = '',
  label = 'Speed',
}: SpeechRateControlProps) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm ${className}`}>
      <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">{label}</span>
      <input
        type="range"
        min={0.5}
        max={1.25}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 sm:w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
        aria-label="Adjust speech speed"
      />
      <span className="text-[10px] font-mono font-bold text-slate-600 w-9 text-right">{value.toFixed(2)}×</span>
    </div>
  );
}
