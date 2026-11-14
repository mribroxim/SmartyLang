import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, GraduationCap, Headphones, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ArabicDisplayModeToggle } from '../components/ArabicDisplayModeToggle';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import {
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
  CONTENT_LANGS,
  type ContentLang,
} from '../lib/contentLang';
import type { UiLang } from '../lib/uiLang';
import type { Level } from '../lib/reading-logic';
import { syncPreferredTranslationFromUiLang } from '../lib/preferredTranslationLang';
import { loadPlacementFlow } from '../lib/loadPlacementFlow';
import {
  LEARNING_GOALS,
  PLACEMENT_LEVELS,
  PLACEMENT_SECTION_LABELS,
  analyzePlacement,
  type LearningGoal,
  type PlacementSectionId,
  type PlacementStep,
} from '../lib/placement';
import type { UiStringKey } from '../lib/uiStrings';
import { EN_UI_STRINGS } from '../lib/uiStrings';
import { Sticker, type StickerId } from '../components/stickers/Sticker';
import { getPrefs, type DailyMinutes } from '../lib/smarty/prefs';
import { goalXpForMinutes } from '../lib/bites/xp';
import { ChunkyButton, ChunkyProgress, Tile } from './Bites/lesson/chunky';

const FEATURED: ContentLang[] = ['en', 'uz', 'ru', 'tr', 'es', 'ar'];
const NATIVE_FEATURED: UiLang[] = ['en', 'ru', 'uz', 'tr', 'es', 'ar'];

type Step = 'hello' | 'meet' | 'native' | 'learning' | 'goal' | 'start' | 'placement' | 'result';

/** Steps that fill the progress bar (the welcome splash sits before it). */
const PROGRESS: Step[] = ['meet', 'native', 'learning', 'goal', 'start', 'placement', 'result'];

const MINUTE_LEVEL: Record<DailyMinutes, UiStringKey> = {
  5: 'onboard.minutes.casual', 10: 'onboard.minutes.regular', 15: 'onboard.minutes.serious', 20: 'onboard.minutes.intense',
};

type T = (key: UiStringKey, vars?: Record<string, string | number>) => string;

/**
 * One onboarding screen: back arrow + chunky progress on top, Smarty asking the
 * question in a speech bubble, the answers, and a fixed bottom bar with Continue.
 */
function Stage({
  step, title, subtitle, children, primary, extra, onBack, t, sticker, focusKey, progress,
}: {
  step: Step;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  primary: React.ReactNode;
  extra?: React.ReactNode;
  onBack?: () => void;
  t: T;
  sticker?: StickerId;
  focusKey?: string;
  /** Override the bar (e.g. inside the level check). */
  progress?: number;
}) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    root.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [step, title, subtitle, focusKey]);
  const mascot = sticker ?? ({
    hello: 'mood.hello', meet: 'flow.welcome-aboard', native: 'flow.choose-your-language', learning: 'sig.the-language-portal',
    goal: 'pers.confident', start: 'flow.learning-path', placement: 'flow.level-check', result: 'sig.the-magic-paw',
  } satisfies Record<Step, StickerId>)[step];
  const index = PROGRESS.indexOf(step);
  const value = progress ?? (index < 0 ? 0 : (index + 0.5) / PROGRESS.length);

  return (
    <main ref={root} className="flex-1 w-full bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),16px)] pb-48">
        <div className="flex items-center gap-3 sm:gap-4">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label={t('onboard.back')} className="-ml-2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : <span className="w-8" />}
          <div className="flex-1" role="group" aria-label={t('onboard.progress', { n: Math.max(1, index + 1), total: PROGRESS.length })}>
            <ChunkyProgress value={value} />
          </div>
        </div>

        <motion.div key={`${step}:${focusKey ?? ''}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          <header className="mt-6 sm:mt-10 flex items-end gap-2 sm:gap-4">
            <Sticker id={mascot} size="clamp(92px, 24vw, 140px)" priority="hero" mode="once" className="shrink-0" />
            <div className="relative mb-4 min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <span aria-hidden className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
              <h1 ref={heading} tabIndex={-1} className="outline-none font-serif text-lg sm:text-xl font-extrabold leading-snug text-zinc-900 dark:text-zinc-50">{title}</h1>
            </div>
          </header>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{subtitle}</p>}
          {children && <div className="mt-6">{children}</div>}
        </motion.div>
      </div>

      {(primary || extra) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-2xl flex-col-reverse gap-2 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:flex-row sm:items-center sm:py-6">
            <div className="flex flex-wrap justify-center gap-1 sm:justify-start">{extra}</div>
            <div className="hidden flex-1 sm:block" />
            {primary}
          </div>
        </div>
      )}
    </main>
  );
}

const primaryCls = 'w-full sm:w-auto sm:min-w-[180px]';

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-3 py-2 font-serif text-[13px] font-extrabold uppercase tracking-wide text-slate-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
    >
      {children}
    </button>
  );
}

function LangGrid({ value, onChange, featured, t }: { value: ContentLang; onChange: (c: ContentLang) => void; featured: ContentLang[]; t: T }) {
  const isOther = !featured.includes(value);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {featured.map((code) => (
          <Tile key={code} state={value === code ? 'selected' : 'idle'} onClick={() => onChange(code)} aria-pressed={value === code} className="py-4">
            <span className="block font-serif text-[17px] font-extrabold leading-tight">{CONTENT_LANG_LABEL[code]}</span>
            <span className="block text-xs font-semibold text-slate-400">{CONTENT_LANG_LABEL[code]}</span>
          </Tile>
        ))}
      </div>
      <div className="mt-4">
        <label htmlFor="more-langs" className="mb-1.5 block font-serif text-xs font-extrabold uppercase tracking-wide text-slate-400">{t('onboard.moreLanguages')}</label>
        <select
          id="more-langs"
          value={isOther ? value : ''}
          onChange={(e) => e.target.value && onChange(e.target.value as ContentLang)}
          className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-[15px] font-semibold text-zinc-800 shadow-[0_3px_0_0_#e2e8f0] focus-visible:outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_3px_0_0_#3f3f46] ${isOther ? 'border-zinc-900 dark:border-zinc-100' : 'border-slate-200 dark:border-zinc-700'}`}
        >
          <option value="">{t('onboard.choose')}</option>
          {CONTENT_LANGS.filter((c) => !featured.includes(c)).map((code) => (
            <option key={code} value={code}>{CONTENT_LANG_LABEL[code]} ({CONTENT_LANG_NATIVE[code]})</option>
          ))}
        </select>
      </div>
    </>
  );
}

function McqOptions({ options, picked, onPick }: { options: string[]; picked: number | undefined; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, i) => (
        <Tile key={opt} hotkey={i + 1} state={picked === i ? 'selected' : 'idle'} onClick={() => onPick(i)} aria-pressed={picked === i}>{opt}</Tile>
      ))}
    </div>
  );
}

function sectionLabel(section: PlacementSectionId, t: T): string {
  const key = `onboard.section.${section}` as UiStringKey;
  if (key in EN_UI_STRINGS) return t(key);
  return PLACEMENT_SECTION_LABELS[section];
}

function goalCopy(id: LearningGoal, field: 'title' | 'desc', fallback: string, t: T): string {
  const key = `onboard.goal.${id}.${field}` as UiStringKey;
  if (key in EN_UI_STRINGS) return t(key);
  return fallback;
}

function sectionTitle(step: PlacementStep, t: (k: UiStringKey) => string): string {
  if (step.type === 'passage') return t('onboard.reading.title');
  if (step.type === 'listening') return t('onboard.listening.title');
  return t('onboard.placement.title');
}

export function Onboarding({
  canStartLessons,
  onComplete,
}: {
  canStartLessons: boolean;
  onComplete: (result: {
    contentLang: ContentLang;
    uiLang: UiLang;
    goal: LearningGoal;
    startingLevel: Level;
    startLessons: boolean;
    preferredName: string;
    dailyMinutes: DailyMinutes;
  }) => Promise<void>;
}) {
  const { contentLang, setContentLang, arabicDisplayMode } = useContentLang();
  const { uiLang, setUiLang, t } = useUiLang();

  const [step, setStep] = useState<Step>('hello');
  const [preferredName, setPreferredName] = useState(() => getPrefs().preferredName ?? '');
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes>(() => getPrefs().dailyMinutes);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const finishing = useRef(false);
  const [nativeLang, setNativeLang] = useState<UiLang>(uiLang);
  const [lang, setLang] = useState<ContentLang>(contentLang);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | boolean>>({});
  const [flowIndex, setFlowIndex] = useState(0);
  const [flow, setFlow] = useState<PlacementStep[]>([]);
  const [flowReady, setFlowReady] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<Level | null>(null);

  const flowItem = flow[flowIndex];
  const analysis = useMemo(() => analyzePlacement(answers, flow), [answers, flow]);
  const startingLevel = overrideLevel ?? analysis.startingLevel;
  const answeredCount = Object.keys(answers).length;
  const isLastFlow = flow.length > 0 && flowIndex + 1 >= flow.length;

  // Preload placement content when learning language changes (also covers goal → placement).
  useEffect(() => {
    let cancelled = false;
    setFlowReady(false);
    loadPlacementFlow(lang, arabicDisplayMode).then((next) => {
      if (cancelled) return;
      setFlow(next);
      setFlowReady(true);
    });
    return () => { cancelled = true; };
  }, [lang, arabicDisplayMode]);

  // Reset placement progress when learning language changes.
  useEffect(() => {
    setFlowIndex(0);
    setAnswers({});
    setOverrideLevel(null);
  }, [lang]);

  const applyNativeLang = (code: UiLang) => {
    setNativeLang(code);
    setUiLang(code);
    syncPreferredTranslationFromUiLang(code);
  };

  const finish = async (startLessons: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    setSaving(true);
    setSaveError(false);
    setContentLang(lang);
    setUiLang(nativeLang);
    syncPreferredTranslationFromUiLang(nativeLang);
    try {
      await onComplete({
        contentLang: lang,
        uiLang: nativeLang,
        goal: goal || 'daily',
        startingLevel,
        startLessons,
        preferredName: preferredName.trim(),
        dailyMinutes,
      });
    } catch {
      setSaveError(true);
    } finally {
      finishing.current = false;
      setSaving(false);
    }
  };

  const skip = () => {
    if (!answeredCount) setOverrideLevel('Beginner');
    setStep('result');
  };

  const pickSelfLevel = (level: Level) => {
    setOverrideLevel(level);
    setStep('result');
  };

  const advanceFlow = useCallback(() => {
    setFlowIndex((i) => {
      if (i + 1 >= flow.length) {
        setStep('result');
        return i;
      }
      return i + 1;
    });
  }, [flow.length]);

  // Enter = Continue on the simple screens.
  useEffect(() => {
    if (step !== 'hello' && step !== 'native' && step !== 'learning' && !(step === 'goal' && goal)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      e.preventDefault();
      if (step === 'hello') setStep('meet');
      else if (step === 'native') setStep('learning');
      else if (step === 'learning') { setContentLang(lang); setStep('goal'); }
      else if (step === 'goal') setStep('start');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goal, lang, setContentLang]);

  useEffect(() => {
    if (step !== 'placement' || !flowItem) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if ((flowItem.type === 'mcq' || flowItem.type === 'listening') && !Number.isNaN(n) && n >= 1 && n <= flowItem.options.length) {
        e.preventDefault();
        setAnswers((prev) => ({ ...prev, [flowItem.id]: n - 1 }));
        return;
      }
      if (flowItem.type === 'truefalse' && (n === 1 || n === 2)) {
        e.preventDefault();
        setAnswers((prev) => ({ ...prev, [flowItem.id]: n === 1 }));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        advanceFlow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, flowItem, advanceFlow]);

  if (step === 'hello') {
    return (
      <main className="flex-1 w-full bg-white dark:bg-zinc-950">
        <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-6 pb-40 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Sticker id="mood.hello" size="clamp(170px, 46vw, 240px)" priority="hero" />
          </motion.div>
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="relative mt-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900">
            <span aria-hidden className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
            <h1 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('onboard.hello.title')}</h1>
            <p className="mt-1 font-semibold text-slate-500 dark:text-zinc-400">{t('onboard.hello.body')}</p>
          </motion.div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-2xl px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:justify-end sm:py-6">
            <ChunkyButton autoFocus onClick={() => setStep('meet')} className={primaryCls}>{t('onboard.continue')}</ChunkyButton>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'meet') {
    return (
      <Stage step="meet" title={t('onboard.meet.name')} subtitle={t('onboard.meet.optional')} t={t} onBack={() => setStep('hello')}
        sticker={preferredName.trim() ? 'pers.happy-purr' : 'flow.welcome-aboard'}
        primary={<ChunkyButton type="submit" form="meet-smarty" className={primaryCls}>{t('onboard.continue')}</ChunkyButton>}
      >
        <form id="meet-smarty" onSubmit={(e) => { e.preventDefault(); setStep('native'); }}>
          <label htmlFor="preferred-name" className="sr-only">{t('onboard.meet.name')}</label>
          <input id="preferred-name" autoFocus autoComplete="given-name" maxLength={40} value={preferredName} onChange={(e) => setPreferredName(e.target.value)}
            placeholder={t('onboard.meet.placeholder')}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-xl font-semibold text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100" />
          <p role="status" className="mt-4 font-semibold text-zinc-700 dark:text-zinc-200">
            {preferredName.trim() ? t('onboard.meet.hello', { name: preferredName.trim() }) : t('onboard.meet.friend')}
          </p>
        </form>
      </Stage>
    );
  }

  if (step === 'native') {
    return (
      <Stage step="native" title={t('onboard.native.title')} subtitle={t('onboard.native.subtitle')} t={t} onBack={() => setStep('meet')}
        primary={<ChunkyButton onClick={() => setStep('learning')} className={primaryCls}>{t('onboard.continue')}</ChunkyButton>}
        extra={<LinkButton onClick={skip}>{t('onboard.skipForNow')}</LinkButton>}
      >
        <LangGrid value={nativeLang} onChange={applyNativeLang} featured={NATIVE_FEATURED} t={t} />
      </Stage>
    );
  }

  if (step === 'learning') {
    const tipLearnLang: ContentLang = lang === nativeLang ? (lang === 'en' ? 'es' : 'en') : lang;
    return (
      <Stage step="learning" title={t('onboard.learning.title')} subtitle={t('onboard.learning.subtitle')} t={t} onBack={() => setStep('native')}
        primary={<ChunkyButton onClick={() => { setContentLang(lang); setStep('goal'); }} className={primaryCls}>{t('onboard.continue')}</ChunkyButton>}
        extra={<LinkButton onClick={skip}>{t('onboard.skipForNow')}</LinkButton>}
      >
        <LangGrid value={lang} onChange={setLang} featured={FEATURED} t={t} />
        {lang === 'ar' && <ArabicDisplayModeToggle className="mt-4" />}
        {lang === nativeLang && (
          <p className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {t('onboard.tip.sameLang', { native: CONTENT_LANG_LABEL[nativeLang], learn: CONTENT_LANG_LABEL[tipLearnLang] })}
          </p>
        )}
      </Stage>
    );
  }

  if (step === 'goal') {
    return (
      <Stage step="goal" title={t('onboard.goal.title')} subtitle={t('onboard.goal.subtitle')} t={t} onBack={() => setStep('learning')}
        sticker={dailyMinutes === 20 ? 'pers.confident' : dailyMinutes === 15 ? 'mood.you-got-this' : dailyMinutes === 5 ? 'mood.hello' : 'flow.ready-to-learn'}
        primary={<ChunkyButton disabled={!goal} onClick={() => setStep('start')} className={primaryCls}>{t('onboard.continue')}</ChunkyButton>}
        extra={<LinkButton onClick={skip}>{t('onboard.skipForNow')}</LinkButton>}
      >
        <div className="flex flex-col gap-3">
          {LEARNING_GOALS.map((g) => {
            const Icon = g.id === 'exam' ? GraduationCap : BookOpen;
            const active = goal === g.id;
            return (
              <Tile key={g.id} state={active ? 'selected' : 'idle'} onClick={() => setGoal(g.id)} aria-pressed={active} className="py-3.5">
                <span className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'bg-slate-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif text-[16px] font-extrabold">{goalCopy(g.id, 'title', g.title, t)}</span>
                    <span className="block text-sm font-medium text-slate-400">{goalCopy(g.id, 'desc', g.desc, t)}</span>
                  </span>
                </span>
              </Tile>
            );
          })}
        </div>

        <fieldset className="mt-8">
          <legend className="font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{t('onboard.minutes.title')}</legend>
          <p className="mb-3 mt-0.5 text-sm text-slate-500 dark:text-zinc-400">{t('onboard.minutes.subtitle')}</p>
          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={t('onboard.minutes.title')}>
            {([5, 10, 15, 20] as const).map((minutes) => (
              <Tile key={minutes} role="radio" aria-checked={dailyMinutes === minutes} state={dailyMinutes === minutes ? 'selected' : 'idle'} onClick={() => setDailyMinutes(minutes)} className="py-3">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-serif font-extrabold">{t(MINUTE_LEVEL[minutes])}</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('onboard.minutes.option', { n: minutes })} · {t('onboard.minutes.xp', { n: goalXpForMinutes(minutes) })}</span>
                </span>
              </Tile>
            ))}
          </div>
          <p role="status" className="mt-3 text-sm font-semibold text-slate-600 dark:text-zinc-300">{t(`onboard.minutes.reaction.${dailyMinutes}` as UiStringKey)}</p>
        </fieldset>
      </Stage>
    );
  }

  if (step === 'start') {
    const card = (onClick: () => void, sticker: StickerId, title: string, desc: string) => (
      <button type="button" onClick={onClick}
        className="flex w-full items-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-4 text-left shadow-[0_4px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 hover:bg-slate-50 active:translate-y-[4px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46] dark:hover:bg-zinc-800">
        <Sticker id={sticker} size={84} mode="once" className="shrink-0" />
        <span className="min-w-0">
          <span className="block font-serif text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{title}</span>
          <span className="mt-0.5 block text-sm font-medium text-slate-500 dark:text-zinc-400">{desc}</span>
        </span>
      </button>
    );
    return (
      <Stage step="start" title={t('onboard.start.title')} t={t} onBack={() => setStep('goal')}
        primary={null}
      >
        <div className="flex flex-col gap-4">
          {card(() => pickSelfLevel('Beginner'), 'flow.first-lesson', t('onboard.start.scratch.title'), t('onboard.start.scratch.desc'))}
          {card(() => setStep('placement'), 'learn.detective', t('onboard.start.find.title'), t('onboard.start.find.desc'))}
        </div>
      </Stage>
    );
  }

  if (step === 'placement' && !flowReady) {
    return (
      <Stage step="placement" title={t('onboard.placement.title')} t={t} onBack={() => setStep('start')}
        primary={null}
        extra={<LinkButton onClick={skip}>{t('onboard.skipForNow')}</LinkButton>}
      >
        <div className="flex flex-col items-center py-6">
          <Sticker id="flow.lesson-loading" size={110} priority="hero" />
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('onboard.loadingCheck')}</p>
        </div>
      </Stage>
    );
  }

  if (step === 'placement' && flowReady && flow.length === 0) {
    return (
      <Stage step="placement" title={t('onboard.selfLevel.title')} subtitle={t('onboard.selfLevel.subtitle')} t={t} onBack={() => setStep('start')}
        primary={null}
        extra={<LinkButton onClick={skip}>{t('onboard.skipForNow')}</LinkButton>}
      >
        <div className="flex flex-col gap-3">
          {PLACEMENT_LEVELS.map((level, i) => (
            <Tile key={level} hotkey={i + 1} onClick={() => pickSelfLevel(level)} className="font-serif font-extrabold">{level}</Tile>
          ))}
        </div>
      </Stage>
    );
  }

  if (step === 'placement' && flowItem) {
    const picked = answers[flowItem.id];
    // The level check is long: the bar tracks the check itself here.
    const value = (flowIndex + 1) / Math.max(1, flow.length);
    const title = flowItem.type === 'mcq' ? flowItem.prompt
      : flowItem.type === 'truefalse' ? flowItem.statement
      : flowItem.type === 'listening' ? flowItem.prompt
      : sectionTitle(flowItem, t);

    return (
      <Stage step="placement" title={title} focusKey={flowItem.id} progress={value} t={t}
        onBack={flowIndex > 0 ? () => setFlowIndex(flowIndex - 1) : () => setStep('start')}
        sticker={picked !== undefined ? 'pers.confident' : flowIndex === 0 || flowItem.type === 'passage' ? 'flow.level-check' : 'mood.hmm'}
        primary={<ChunkyButton onClick={advanceFlow} className={primaryCls}>{isLastFlow ? t('onboard.seeLevel') : picked === undefined && flowItem.type !== 'passage' ? t('onboard.skipQuestion') : t('onboard.continue')}</ChunkyButton>}
        extra={<LinkButton onClick={() => setStep('result')}>{t('onboard.skipPlacement')}</LinkButton>}
      >
        <div className="mb-4 flex items-center justify-between font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            {flowItem.section === 'listening' && <Headphones className="h-3.5 w-3.5" />}
            {sectionLabel(flowItem.section as PlacementSectionId, t)}
          </span>
          <span>{t('onboard.questionOf', { n: flowIndex + 1, total: flow.length })}</span>
        </div>

        {flowItem.type === 'passage' && (
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46]">
            <p className="mb-2 font-serif text-xs font-extrabold uppercase tracking-wider text-slate-400">{flowItem.title}</p>
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-zinc-800 dark:text-zinc-100">{flowItem.passage}</p>
            <p className="mt-3 text-sm text-slate-500">{t('onboard.reading.subtitle')}</p>
          </div>
        )}

        {flowItem.type === 'mcq' && (
          <McqOptions options={flowItem.options} picked={picked as number | undefined} onPick={(i) => setAnswers((prev) => ({ ...prev, [flowItem.id]: i }))} />
        )}

        {flowItem.type === 'truefalse' && (
          <div className="grid grid-cols-2 gap-3">
            {([true, false] as const).map((val, i) => (
              <Tile key={String(val)} hotkey={i + 1} center state={picked === val ? 'selected' : 'idle'} onClick={() => setAnswers((prev) => ({ ...prev, [flowItem.id]: val }))} className="py-5 text-lg">
                {val ? t('onboard.true') : t('onboard.false')}
              </Tile>
            ))}
          </div>
        )}

        {flowItem.type === 'listening' && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <p className="text-[15px] italic leading-relaxed text-zinc-800 dark:text-zinc-100">{flowItem.context}</p>
            </div>
            <McqOptions options={flowItem.options} picked={picked as number | undefined} onPick={(i) => setAnswers((prev) => ({ ...prev, [flowItem.id]: i }))} />
          </div>
        )}
      </Stage>
    );
  }

  const sectionRows = (Object.keys(analysis.sections) as PlacementSectionId[]).filter((s) => analysis.sections[s].total > 0);

  return (
    <Stage step="result" title={t('onboard.result.levelLine', { level: startingLevel })} subtitle={t('onboard.result.subtitle')} t={t}
      onBack={() => setStep(flow.length && answeredCount ? 'placement' : 'start')}
      progress={1}
      primary={
        <ChunkyButton disabled={saving} onClick={() => finish(canStartLessons)} className={primaryCls}>
          {saving ? t('onboard.saving') : canStartLessons ? t('onboard.startBite') : t('onboard.continuePlans')}
        </ChunkyButton>
      }
      extra={
        <>
          <LinkButton onClick={() => { if (!saving) void finish(false); }}>{canStartLessons ? t('onboard.goHome') : t('onboard.skipForNow')}</LinkButton>
          {saveError && <p role="alert" className="w-full text-center text-sm font-semibold text-rose-600 dark:text-rose-400 sm:text-left">{t('onboard.saveError')}</p>}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <div className="rounded-3xl bg-zinc-900 p-5 text-white shadow-[0_5px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_5px_0_0_#a1a1aa] dark-keep">
          <div className="mb-2 flex items-center gap-2 font-serif text-[11px] font-extrabold uppercase tracking-widest opacity-60">
            <Sparkles className="h-3.5 w-3.5" /> {t('onboard.result.starting')}
          </div>
          <div className="font-serif text-[32px] font-extrabold leading-none tracking-tight">{startingLevel}</div>
          <p className="mt-2.5 text-sm opacity-70">
            {answeredCount === 0
              ? t('onboard.result.skipped')
              : overrideLevel
              ? CONTENT_LANG_LABEL[lang]
              : t('onboard.result.correct', { correct: analysis.totalCorrect, total: analysis.totalScored })}
          </p>
          {goal === 'exam' && <p className="mt-1 text-sm opacity-70">{t('onboard.examHint')}</p>}
        </div>

        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46]">
          <p className="mb-3 font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('onboard.result.skills')}</p>
          {sectionRows.length === 0 || answeredCount === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {answeredCount === 0 ? t('onboard.result.skippedBody') : overrideLevel ? t('onboard.selfLevel.subtitle') : t('onboard.placement.subtitle')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {sectionRows.map((s) => {
                const { correct, total, pct } = analysis.sections[s];
                return (
                  <div key={s}>
                    <div className="mb-1 flex justify-between text-[13px] font-semibold">
                      <span>{sectionLabel(s, t)}</span>
                      <span className="text-slate-500">{correct}/{total}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {answeredCount > 0 && (analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t-2 border-slate-100 pt-4 text-[13px] dark:border-zinc-800 sm:grid-cols-2">
              {analysis.strengths.length > 0 && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">{t('onboard.result.strengths')}</p>
                  <p className="text-slate-600 dark:text-zinc-400">{analysis.strengths.join(', ')}</p>
                </div>
              )}
              {analysis.weaknesses.length > 0 && (
                <div>
                  <p className="mb-1 font-bold text-amber-700">{t('onboard.result.weaknesses')}</p>
                  <p className="text-slate-600 dark:text-zinc-400">{analysis.weaknesses.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#3f3f46] sm:col-span-2">
          <p className="mb-1 font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('onboard.result.nextTitle')}</p>
          <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t('onboard.result.daily', { minutes: dailyMinutes, xp: goalXpForMinutes(dailyMinutes) })}</p>
          <ul className="flex flex-col gap-2.5">
            {[
              t('onboard.result.firstBite', { level: startingLevel }),
              t('onboard.result.biteSteps'),
              t('onboard.result.levelsOpen'),
              t('onboard.result.streakXp'),
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-snug text-slate-600 dark:text-zinc-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Stage>
  );
}
