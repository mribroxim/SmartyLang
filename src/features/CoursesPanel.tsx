import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { ArabicDisplayModeToggle } from '../components/ArabicDisplayModeToggle';
import { LanguagePicker } from '../components/LanguagePicker';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { CONTENT_LANGS, CONTENT_LANG_LABEL, CONTENT_LANG_NATIVE, type ContentLang } from '../lib/contentLang';

/** Flag emoji per language (the language's best-known country). Falls back to a globe. */
const FLAG: Record<ContentLang, string> = {
  en: '🇬🇧', ru: '🇷🇺', tl: '🇵🇭', es: '🇪🇸', uz: '🇺🇿', de: '🇩🇪', fr: '🇫🇷', it: '🇮🇹', pt: '🇵🇹',
  ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', ar: '🇸🇦', tr: '🇹🇷', nl: '🇳🇱', hi: '🇮🇳', pl: '🇵🇱', sv: '🇸🇪',
  id: '🇮🇩', ms: '🇲🇾', vi: '🇻🇳', th: '🇹🇭', uk: '🇺🇦', el: '🇬🇷', cs: '🇨🇿', ro: '🇷🇴', fa: '🇮🇷',
  ur: '🇵🇰', sw: '🇰🇪',
};

/** Language name written in the interface language (falls back to the built-in label). */
function nameIn(uiLang: string, code: ContentLang): string {
  try {
    const n = new Intl.DisplayNames([uiLang], { type: 'language' }).of(code);
    if (n && n.toLowerCase() !== code) return n.charAt(0).toLocaleUpperCase(uiLang) + n.slice(1);
  } catch { /* unsupported locale */ }
  return CONTENT_LANG_LABEL[code] || code;
}

/** Settings → Courses: courses for the speaker's language, Duolingo-style, plus an "I speak…" row. */
export function CoursesPanel({ onContentLangChange }: { onContentLangChange?: (lang: ContentLang) => void }) {
  const { t, uiLang } = useUiLang();
  const { contentLang, setContentLang } = useContentLang();
  const speakerName = nameIn(uiLang, uiLang);
  const courses = useMemo(
    () => CONTENT_LANGS.filter((c) => c !== uiLang),
    [uiLang],
  );
  const choose = (lang: ContentLang) => {
    if (lang === contentLang) return;
    setContentLang(lang);
    onContentLangChange?.(lang);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border-2 border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 px-0.5 font-bold text-zinc-900 dark:text-zinc-50">{t('courses.iSpeak')}</div>
        <LanguagePicker mode="interface" variant="pills" className="w-full" />
      </section>
      <section>
        <h2 className="mb-2 px-1 font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400">
          {t('courses.forSpeakers', { lang: speakerName })}
        </h2>
        <ul className="space-y-2.5">
          {courses.map((code) => {
            const active = code === contentLang;
            const native = CONTENT_LANG_NATIVE[code];
            const name = nameIn(uiLang, code);
            return (
              <li key={code}>
                <button type="button" onClick={() => choose(code)} aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${active
                    ? 'border-zinc-900 bg-slate-50 shadow-[0_4px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:shadow-[0_4px_0_0_#e4e4e7]'
                    : 'border-slate-200 bg-white shadow-[0_4px_0_0_#e2e8f0] hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#27272a]'}`}>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-2xl leading-none dark:border-zinc-700 dark:bg-zinc-950">{FLAG[code] ?? '🌐'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-base font-extrabold text-zinc-900 dark:text-zinc-50">{name}</span>
                    {native && native !== name && <span className="block truncate text-xs font-semibold text-slate-400">{native}</span>}
                  </span>
                  {active && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-serif text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      <Check className="h-3.5 w-3.5" />{t('courses.current')}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <ArabicDisplayModeToggle className="mt-3" />
      </section>

    </div>
  );
}
