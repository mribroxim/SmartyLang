import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Globe, Languages, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DialogSurface } from './DialogSurface';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import {
  CONTENT_LANGS,
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
  type ContentLang,
} from '../lib/contentLang';
import { UI_LANGS, type UiLang } from '../lib/uiLang';

interface LanguagePickerProps {
  mode?: 'learning' | 'interface';
  variant?: 'compact' | 'pills';
  className?: string;
  onChange?: (lang: ContentLang | UiLang) => void;
}

function langPrimary(code: ContentLang): string {
  return CONTENT_LANG_LABEL[code] || code;
}

function langSecondary(code: ContentLang): string {
  return CONTENT_LANG_NATIVE[code] || code;
}

export function LanguagePicker({
  mode = 'learning',
  variant = 'compact',
  className = '',
  onChange,
}: LanguagePickerProps) {
  const { contentLang, setContentLang } = useContentLang();
  const { uiLang, setUiLang, loadingLanguage, t } = useUiLang();
  const isInterface = mode === 'interface';
  const value = (isInterface ? uiLang : contentLang) as ContentLang;
  const options = (isInterface ? UI_LANGS : CONTENT_LANGS) as readonly ContentLang[];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);

  const apply = (lang: ContentLang) => {
    if (isInterface) {
      setUiLang(lang as UiLang);
      onChange?.(lang as UiLang);
    } else {
      setContentLang(lang);
      onChange?.(lang);
    }
    setOpen(false);
    setQuery('');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((code) => {
      const a = langPrimary(code).toLowerCase();
      const b = langSecondary(code).toLowerCase();
      return a.includes(q) || b.includes(q) || code.toLowerCase().includes(q);
    });
  }, [options, query]);

  const placeMenu = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = variant === 'pills' ? r.width : Math.max(r.width, 300);
    const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - r.bottom - 12;
    const openUp = spaceBelow < 320 && r.top > spaceBelow;
    setMenuPos({
      top: openUp ? r.top - 8 : r.bottom + 8,
      left,
      width,
      openUp,
    });
  };

  useEffect(() => {
    if (!open) return;
    placeMenu();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    const id = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
      window.clearTimeout(id);
    };
  }, [open]);

  const Icon = isInterface ? Languages : Globe;
  const title = isInterface ? t('lang.interface') : t('lang.learning');

  return (
    <div className={`relative ${variant === 'pills' ? 'w-full' : ''} ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-busy={isInterface && loadingLanguage !== null}
        title={title}
        className={
          variant === 'pills'
            ? 'w-full flex items-center gap-2.5 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 text-left hover:border-zinc-400 dark:hover:border-zinc-500 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]'
            : 'inline-flex items-center gap-2 max-w-[11.5rem] bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 rounded-2xl pl-2.5 pr-2 py-1.5 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]'
        }
      >
        <span className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-200" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-tight">
            {langPrimary(value)}
          </span>
          {variant === 'pills' && langSecondary(value) !== langPrimary(value) && (
            <span className="block text-[11px] text-slate-400 truncate">{langSecondary(value)}</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && menuPos && (
              <>
                <motion.button
                  type="button"
                  aria-label={t("core.dashboardview.close_bbfa77")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-zinc-950/10 dark:bg-black/50 bg-zinc-900/55 backdrop-blur-[2px]"
                  onPointerDown={() => setOpen(false)}
                />
                <DialogSurface asComponent={motion.div} onClose={() => setOpen(false)} data-popup
                  role="listbox"
                  aria-label={title}
                  initial={{ opacity: 0, y: menuPos.openUp ? 6 : -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: menuPos.openUp ? 6 : -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'fixed',
                    top: menuPos.openUp ? undefined : menuPos.top,
                    bottom: menuPos.openUp ? window.innerHeight - menuPos.top : undefined,
                    left: menuPos.left,
                    width: menuPos.width,
                    zIndex: 91,
                  }}
                  className="rounded-2xl border-2 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]"
                >
                <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 px-2.5 py-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input aria-label={t('lang.search')}
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('lang.search')}
                      className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-slate-400"
                    />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {filtered.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-slate-400">{t('lang.search')}</p>
                    ) : (
                      filtered.map((code) => {
                        const active = code === value;
                        return (
                          <button
                            key={code}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              apply(code);
                            }}
                          className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left ${
                            active ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                          }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black uppercase tracking-wider ${
                                active ? 'bg-white/15 dark:bg-zinc-900/10 text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                              }`}
                            >
                              {code}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold truncate">{langPrimary(code)}</span>
                              {langSecondary(code) !== langPrimary(code) && (
                                <span className={`block text-[11px] truncate ${active ? 'text-white/60 dark:text-zinc-900/50' : 'text-slate-400 dark:text-zinc-500'}`}>
                                  {langSecondary(code)}
                                </span>
                              )}
                            </span>
                            {active && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </DialogSurface>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
