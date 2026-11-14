import React from 'react';
import { Sticker } from './stickers/Sticker';
import { useUiLang } from '../contexts/UiLangContext';
import { Loader2, Sparkles } from 'lucide-react';
import type { AiCheckReportData, AiCriterion } from '../lib/aiExaminer';

function bandTone(score: number, ielts: boolean) {
  const hi = ielts ? 7 : 8;
  const mid = ielts ? 5.5 : 6;
  if (score >= hi) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= mid) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function CriterionCard({ c, ielts }: { c: AiCriterion; ielts: boolean; key?: string }) {
  const { t } = useUiLang();
  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{c.name}</p>
        <span className={`text-lg font-black tabular-nums ${bandTone(c.score, ielts)}`}>
          {ielts ? c.score.toFixed(1) : c.score}
        </span>
      </div>
      {c.strengths?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{t("onboard.result.strengths")}</p>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
            {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {c.weaknesses?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">{t("core.aicheckreport.to_improve_078551")}</p>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
            {c.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {c.recommendations?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-1">{t("core.dashboardview.recommendations_4faa65")}</p>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
            {c.recommendations.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {c.improvements?.length > 0 && (
        <div className="mt-3 space-y-2">
          {c.improvements.map((im, i) => (
            <div key={i} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 text-xs space-y-1">
              {im.what_you_did && <p className="text-zinc-600 dark:text-zinc-300"><span className="font-bold text-zinc-800 dark:text-zinc-100">{t("core.dashboardview.you_wrote_c8d76a")}</span>{im.what_you_did}</p>}
              {im.what_you_could_have_done && <p className="text-zinc-600 dark:text-zinc-300"><span className="font-bold text-zinc-800 dark:text-zinc-100">{t("core.aicheckreport.try_102acb")}</span>{im.what_you_could_have_done}</p>}
              {im.reason && <p className="text-zinc-500 dark:text-zinc-400">{im.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiCheckReport({
  report,
  compact,
}: {
  report: AiCheckReportData;
  compact?: boolean;
}) {
  const { t } = useUiLang();
  const ielts = report.style === 'ielts';
  const overall = report.final?.overallScore;
  const label = ielts ? `Band ${overall}` : `Score ${overall}`;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {ielts ? t("core.aicheckreport.overall_band_e4167c") : t("core.aicheckreport.overall_score_4a1ce2")}
            {report.final?.levelLabel ? ` · ${report.final.levelLabel}` : ''}
          </p>
          <p className="text-4xl font-black tabular-nums">{label}</p>
        </div>
        <Sparkles className="w-7 h-7 text-amber-300 shrink-0" />
      </div>

      {report.final?.summary && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{report.final.summary}</p>
      )}

      {report.pronunciationNote && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2">
          {report.pronunciationNote}
        </p>
      )}

      {report.final?.topPriorities && report.final.topPriorities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t("core.aicheckreport.top_priorities_4dabea")}</p>
          <ol className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1 list-decimal pl-5">
            {report.final.topPriorities.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {(report.criteria || []).map(c => (
          <CriterionCard key={c.name} c={c} ielts={ielts} />
        ))}
      </div>
    </div>
  );
}

export function AiCheckButton({
  onClick,
  loading,
  disabled,
  label = 'AI Check',
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const { t } = useUiLang();
  return (
    <>
    {loading && (
      <div role="status" aria-live="polite" className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-2xl border-2 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-1 pr-4 py-1 border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]" style={{ bottom: 'calc(var(--se-mobile-nav, 0px) + 16px)' }}>
        <Sticker id={Date.now() % 2 ? 'learn.typing-away' : 'flow.thinking-time'} size={56} priority="hero" />
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('ai.checking')}</span>
      </div>
    )}
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl shadow-md shrink-0 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{loading ? t("core.aicheckreport.checking_820d60") : label}</span>
    </button>
    </>
  );
}

export function AiCheckError({ message }: { message: string }) {
  return (
    <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2">
      {message}
    </p>
  );
}
