import { useUiLang } from '../contexts/UiLangContext';
import { Type } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';

interface Props {
  className?: string;
  compact?: boolean;
}

export function ArabicDisplayModeToggle({ className = '', compact = false }: Props) {
  const { t } = useUiLang();
  const { contentLang, arabicDisplayMode, setArabicDisplayMode } = useContentLang();

  if (contentLang !== 'ar') return null;

  const btnClass = compact
    ? 'px-2.5 py-1.5 text-xs rounded-lg'
    : 'px-3 py-2 text-sm rounded-xl';

  return (
    <div className={`rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("core.arabicdisplaymodetoggle.arabic_text_style_e3a2b6")}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
        {t("core.arabicdisplaymodetoggle.switch_between_the_same_arabic_efa05c")}</p>
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
          {t("core.arabicdisplaymodetoggle.with_harakat_87e558")}</button>
        <button
          type="button"
          onClick={() => setArabicDisplayMode('without-harakat')}
          className={`${btnClass} border font-semibold transition-colors ${
            arabicDisplayMode === 'without-harakat'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
          }`}
        >
          {t("core.arabicdisplaymodetoggle.without_harakat_0cb9b2")}</button>
      </div>
    </div>
  );
}
