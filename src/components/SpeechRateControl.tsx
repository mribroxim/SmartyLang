import { useUiLang } from '../contexts/UiLangContext';
import { Gauge } from 'lucide-react';
import { SPEECH_RATE_PRESETS, snapSpeechRate, speechRateFromIndex, speechRateToIndex, type SpeechRatePreset } from '../lib/speechRates';

interface SpeechRateControlProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  /** Compact label; default "Speed" */
  label?: string;
}

/**
 * 4-step speech-rate control (Slow / Normal / Default / Fast).
 * Matches FontSizeControl styling; only preset rates hit Azure TTS.
 */
export function SpeechRateControl({
  value,
  onChange,
  className = '',
  label,
}: SpeechRateControlProps) {
  const { t } = useUiLang();
  const snapped = snapSpeechRate(value);
  const index = speechRateToIndex(snapped);
  const presetLabel = ({ 0.85: t("core.management.slow_33dcec"), 1: t("core.management.normal_45e118"), 1.1: t("core.management.default_808d7d"), 1.25: t("core.management.fast_8db6a2") })[snapped];

  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm ${className}`}>
      <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">{label ?? t("learning.speed.2d2cb0")}</span>
      <input
        type="range"
        min={0}
        max={SPEECH_RATE_PRESETS.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(speechRateFromIndex(parseInt(e.target.value, 10)))}
        className="w-20 sm:w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
        aria-label={t("core.speechratecontrol.adjust_speech_speed_19fdae")}
        aria-valuetext={`${presetLabel} ${snapped.toFixed(2)}×`}
      />
      <span className="text-[10px] font-mono font-bold text-slate-600 w-16 text-right tabular-nums">
        {presetLabel}
      </span>
    </div>
  );
}

export type { SpeechRatePreset };
