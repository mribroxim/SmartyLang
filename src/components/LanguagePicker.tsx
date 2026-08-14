import React from 'react';
import { Globe, Languages } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import {
  CONTENT_LANGS,
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
  type ContentLang,
} from '../lib/contentLang';
import { UI_LANGS, uiLangLabel, type UiLang } from '../lib/uiLang';

interface LanguagePickerProps {
  /** learning = content language; interface = UI chrome language */
  mode?: 'learning' | 'interface';
  /** compact = icon + select; pills = full-width select */
  variant?: 'compact' | 'pills';
  className?: string;
  onChange?: (lang: ContentLang | UiLang) => void;
}

export function LanguagePicker({
  mode = 'learning',
  variant = 'compact',
  className = '',
  onChange,
}: LanguagePickerProps) {
  const { contentLang, setContentLang } = useContentLang();
  const { uiLang, setUiLang } = useUiLang();

  const isInterface = mode === 'interface';
  const value = isInterface ? uiLang : contentLang;

  const change = (lang: string) => {
    if (isInterface) {
      if (lang === uiLang) return;
      setUiLang(lang as UiLang);
      onChange?.(lang as UiLang);
    } else {
      if (lang === contentLang) return;
      setContentLang(lang as ContentLang);
      onChange?.(lang as ContentLang);
    }
  };

  const selectClass =
    variant === 'pills'
      ? 'w-full bg-white border border-slate-200 text-sm font-semibold text-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-zinc-700 shadow-sm cursor-pointer'
      : 'bg-white border border-slate-200 text-sm font-semibold text-zinc-800 rounded-lg px-2.5 py-1.5 outline-none focus:border-zinc-700 shadow-sm cursor-pointer max-w-[11rem]';

  const Icon = isInterface ? Languages : Globe;
  const options = isInterface ? UI_LANGS : CONTENT_LANGS;

  return (
    <label className={`inline-flex items-center gap-2 ${variant === 'pills' ? 'w-full' : ''} ${className}`}>
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <select
        value={value}
        onChange={e => change(e.target.value)}
        className={selectClass}
        title={isInterface ? 'Interface language' : 'Learning language'}
      >
        {options.map(lang => (
          <option key={lang} value={lang}>
            {isInterface
              ? uiLangLabel(lang)
              : `${CONTENT_LANG_NATIVE[lang]}${
                  CONTENT_LANG_LABEL[lang] !== CONTENT_LANG_NATIVE[lang]
                    ? ` · ${CONTENT_LANG_LABEL[lang]}`
                    : ''
                }`}
          </option>
        ))}
      </select>
    </label>
  );
}
