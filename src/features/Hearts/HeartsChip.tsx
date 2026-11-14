import { Heart } from 'lucide-react';
import { useHearts } from '../../lib/hearts/heartsStore';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';

export function HeartsChip({ onClick }: { onClick?: () => void }) {
  const { count } = useHearts();
  const { previewMode, unlimitedHearts, navigate } = useProgress();
  const { t } = useUiLang();
  if (previewMode) return null;
  return <button type="button" onClick={onClick ?? (() => navigate({ tab: 'lessons', path: ['hearts'] }))} aria-label={unlimitedHearts ? t('hearts.unlimited') : t('hearts.count', { n: count })} className="shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 px-2 py-1 text-xs font-black active:scale-95 transition">
    <Heart className="w-4 h-4 fill-current" aria-hidden="true" /><span>{unlimitedHearts ? '∞' : count}</span>
  </button>;
}
