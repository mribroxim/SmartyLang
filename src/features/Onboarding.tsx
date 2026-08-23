import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, GraduationCap, Headphones, Sparkles } from 'lucide-react';
import { ArabicDisplayModeToggle } from '../components/ArabicDisplayModeToggle';
import { sePrimary, seSecondary } from '../components/ScreenShell';
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

const FEATURED: ContentLang[] = ['en', 'uz', 'ru', 'tr', 'es', 'ar'];
const NATIVE_FEATURED: UiLang[] = ['en', 'ru', 'uz', 'tr', 'es', 'ar'];

type Step = 'native' | 'learning' | 'goal' | 'placement' | 'result';

const STEPS: { id: Step; labelKey: 'onboard.step.native' | 'onboard.step.learning' | 'onboard.step.goal' | 'onboard.step.placement' | 'onboard.step.result' }[] = [
  { id: 'native', labelKey: 'onboard.step.native' },
  { id: 'learning', labelKey: 'onboard.step.learning' },
  { id: 'goal', labelKey: 'onboard.step.goal' },
  { id: 'placement', labelKey: 'onboard.step.placement' },
  { id: 'result', labelKey: 'onboard.step.result' },
];

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function Stage({
  step,
  title,
  subtitle,
  children,
  footer,
  t,
}: {
  step: Step;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const index = STEPS.findIndex((s) => s.id === step);

  return (
    <main className="flex-1 w-full bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[520px] lg:max-w-[900px] px-4 py-6 lg:px-10 lg:py-16">
        <div className="flex items-center justify-between gap-4 mb-8 lg:mb-12">
          <span className="font-serif font-black tracking-tighter uppercase text-[17px] lg:text-[19px] text-zinc-900 dark:text-zinc-50">
            SmartyLang
          </span>
          <div className="flex items-center gap-1.5 lg:gap-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 lg:gap-2">
                <span
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i <= index ? 'w-6 lg:w-10 bg-zinc-900 dark:bg-zinc-100' : 'w-6 lg:w-10 bg-slate-200 dark:bg-zinc-800'
                  }`}
                />
                <span
                  className={`hidden lg:inline text-[11px] font-bold uppercase tracking-[0.14em] ${
                    i <= index ? 'text-zinc-900 dark:text-zinc-100' : 'text-slate-300 dark:text-zinc-600'
                  }`}
                >
                  {t(s.labelKey)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <header className="mb-6 lg:mb-9 lg:max-w-[640px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2 lg:mb-3">
            Step {index + 1} of {STEPS.length}
          </p>
          <h1 className="text-[26px] lg:text-[38px] font-serif font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 lg:mt-3 text-[14px] lg:text-[16px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            {subtitle}
          </p>
        </header>

        {children}

        <div className="mt-7 lg:mt-10 pt-6 lg:pt-7 border-t border-slate-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
          {footer}
        </div>
      </div>
    </main>
  );
}

function LangGrid({
  value,
  onChange,
  featured,
}: {
  value: ContentLang;
  onChange: (c: ContentLang) => void;
  featured: ContentLang[];
}) {
  const isOther = !featured.includes(value);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-3">
        {featured.map((code) => {
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              aria-pressed={active}
              className={`relative text-left rounded-xl border p-3.5 lg:p-5 transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 ${
                active
                  ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100 bg-white dark:bg-zinc-900'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              {active && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white dark:text-zinc-900" />
                </span>
              )}
              <div className="font-serif font-black text-[17px] lg:text-[20px] text-zinc-900 dark:text-zinc-50 leading-tight pr-6">
                {CONTENT_LANG_NATIVE[code]}
              </div>
              <div className="text-[12px] lg:text-[13px] text-slate-400 mt-0.5">{CONTENT_LANG_LABEL[code]}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 lg:mt-6 lg:max-w-[420px]">
        <label htmlFor="more-langs" className="block text-[12px] font-semibold text-slate-400 mb-1.5">
          More languages
        </label>
        <select
          id="more-langs"
          value={isOther ? value : ''}
          onChange={(e) => e.target.value && onChange(e.target.value as ContentLang)}
          className={`w-full rounded-xl border bg-white dark:bg-zinc-900 px-3.5 py-3 text-[14px] font-semibold text-zinc-800 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
            isOther ? 'border-zinc-900 dark:border-zinc-100' : 'border-slate-200 dark:border-zinc-800'
          }`}
        >
          <option value="">Choose…</option>
          {CONTENT_LANGS.filter((c) => !featured.includes(c)).map((code) => (
            <option key={code} value={code}>
              {CONTENT_LANG_NATIVE[code]} ({CONTENT_LANG_LABEL[code]})
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function McqOptions({
  options,
  picked,
  onPick,
}: {
  options: string[];
  picked: number | undefined;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 lg:gap-2.5">
      {options.map((opt, i) => {
        const active = picked === i;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={active}
            className={`w-full flex items-center gap-3 text-left rounded-xl border p-3.5 lg:p-4 font-semibold text-[15px] lg:text-[16px] transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 ${
              active
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[12px] font-black ${
                active ? 'bg-white/15 text-white dark:bg-zinc-900/10 dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {OPTION_KEYS[i] ?? i + 1}
            </span>
            <span className="flex-1">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function sectionLabel(
  section: PlacementSectionId,
  t: (key: UiStringKey, vars?: Record<string, string | number>) => string,
): string {
  const key = `onboard.section.${section}` as UiStringKey;
  if (key in EN_UI_STRINGS) return t(key);
  return PLACEMENT_SECTION_LABELS[section];
}

function goalCopy(
  id: LearningGoal,
  field: 'title' | 'desc',
  fallback: string,
  t: (key: UiStringKey, vars?: Record<string, string | number>) => string,
): string {
  const key = `onboard.goal.${id}.${field}` as UiStringKey;
  if (key in EN_UI_STRINGS) return t(key);
  return fallback;
}

function sectionTitle(step: PlacementStep, t: (k: UiStringKey) => string): string {
  if (step.type === 'passage') return t('onboard.reading.title');
  if (step.type === 'listening') return t('onboard.listening.title');
  return t('onboard.placement.title');
}

function sectionSubtitle(
  step: PlacementStep,
  t: (k: UiStringKey, vars?: Record<string, string | number>) => string,
): string {
  if (step.type === 'passage') return t('onboard.reading.subtitle');
  if (step.type === 'listening') return t('onboard.listening.subtitle');
  return `${sectionLabel(step.section, t)} · ${t('onboard.placement.subtitle')}`;
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
  }) => void;
}) {
  const { contentLang, setContentLang, arabicDisplayMode } = useContentLang();
  const { uiLang, setUiLang, t } = useUiLang();

  const [step, setStep] = useState<Step>('native');
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
  const flowPct = flow.length > 0 ? Math.round((flowIndex / flow.length) * 100) : 0;

  // Preload placement content when learning language changes (also covers goal → placement).
  useEffect(() => {
    let cancelled = false;
    setFlowReady(false);
    loadPlacementFlow(lang, arabicDisplayMode).then((next) => {
      if (cancelled) return;
      setFlow(next);
      setFlowReady(true);
    });
    return () => {
      cancelled = true;
    };
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

  const finish = (startLessons: boolean) => {
    setContentLang(lang);
    setUiLang(nativeLang);
    syncPreferredTranslationFromUiLang(nativeLang);
    onComplete({
      contentLang: lang,
      uiLang: nativeLang,
      goal: goal || 'daily',
      startingLevel,
      startLessons,
    });
  };

  const skip = () => {
    setContentLang(lang);
    setUiLang(nativeLang);
    syncPreferredTranslationFromUiLang(nativeLang);
    onComplete({
      contentLang: lang,
      uiLang: nativeLang,
      goal: goal || 'daily',
      startingLevel: 'Elementary',
      startLessons: false,
    });
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

  useEffect(() => {
    if (step !== 'placement' || !flowItem) return;
    if (flowItem.type !== 'mcq' && flowItem.type !== 'listening') return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const opts = flowItem.options;
      if (!Number.isNaN(n) && n >= 1 && n <= opts.length) {
        e.preventDefault();
        setAnswers((prev) => ({ ...prev, [flowItem.id]: n - 1 }));
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

  if (step === 'native') {
    return (
      <Stage
        step="native"
        title={t('onboard.native.title')}
        subtitle={t('onboard.native.subtitle')}
        t={t}
        footer={
          <>
            <button type="button" onClick={() => setStep('learning')} className={sePrimary}>
              {t('onboard.continue')} <ArrowRight className="w-4 h-4" />
            </button>
            <GhostButton onClick={skip}>{t('onboard.skipForNow')}</GhostButton>
          </>
        }
      >
        <LangGrid value={nativeLang} onChange={applyNativeLang} featured={NATIVE_FEATURED} />
      </Stage>
    );
  }

  if (step === 'learning') {
    const tipLearnLang: ContentLang = lang === nativeLang ? (lang === 'en' ? 'es' : 'en') : lang;
    return (
      <Stage
        step="learning"
        title={t('onboard.learning.title')}
        subtitle={t('onboard.learning.subtitle')}
        t={t}
        footer={
          <>
            <button type="button" onClick={() => { setContentLang(lang); setStep('goal'); }} className={sePrimary}>
              {t('onboard.continue')} <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setStep('native')} className={seSecondary}>
              {t('onboard.back')}
            </button>
            <GhostButton onClick={skip}>{t('onboard.skipForNow')}</GhostButton>
          </>
        }
      >
        <LangGrid value={lang} onChange={setLang} featured={FEATURED} />
        {lang === 'ar' && <ArabicDisplayModeToggle className="mt-4 lg:max-w-[420px]" />}
        {lang === nativeLang && (
          <p className="mt-4 text-[13px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
            Tip: most learners pick a different language here (e.g. speak {CONTENT_LANG_LABEL[nativeLang]}, learn{' '}
            {CONTENT_LANG_LABEL[tipLearnLang]}).
          </p>
        )}
      </Stage>
    );
  }

  if (step === 'goal') {
    return (
      <Stage
        step="goal"
        title={t('onboard.goal.title')}
        subtitle={t('onboard.goal.subtitle')}
        t={t}
        footer={
          <>
            <button type="button" disabled={!goal} onClick={() => setStep('placement')} className={sePrimary}>
              {t('onboard.continue')} <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setStep('learning')} className={seSecondary}>
              {t('onboard.back')}
            </button>
            <GhostButton onClick={skip}>{t('onboard.skipForNow')}</GhostButton>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 lg:gap-4">
          {LEARNING_GOALS.map((g) => {
            const active = goal === g.id;
            const Icon = g.id === 'exam' ? GraduationCap : BookOpen;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                aria-pressed={active}
                className={`relative text-left rounded-xl border p-4 lg:p-6 flex items-center lg:items-start lg:flex-col gap-3.5 lg:gap-0 transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 ${
                  active
                    ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100 bg-white dark:bg-zinc-900'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 lg:mb-5 ${
                    active ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px] lg:text-[18px] text-zinc-900 dark:text-zinc-50 leading-snug">
                    {goalCopy(g.id, 'title', g.title, t)}
                  </div>
                  <div className="text-[12px] lg:text-[14px] text-slate-400 mt-0.5 lg:mt-1.5 leading-snug">
                    {goalCopy(g.id, 'desc', g.desc, t)}
                  </div>
                </div>
                {active && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center lg:top-5 lg:right-5">
                    <Check className="w-3 h-3 text-white dark:text-zinc-900" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Stage>
    );
  }

  if (step === 'placement' && !flowReady) {
    return (
      <Stage
        step="placement"
        title={t('onboard.placement.title')}
        subtitle={t('onboard.placement.subtitle')}
        t={t}
        footer={
          <>
            <button type="button" onClick={() => setStep('goal')} className={seSecondary}>
              {t('onboard.back')}
            </button>
            <GhostButton onClick={skip}>{t('onboard.skipForNow')}</GhostButton>
          </>
        }
      >
        <p className="text-[14px] text-slate-500 dark:text-zinc-400">Loading level check…</p>
      </Stage>
    );
  }

  if (step === 'placement' && flowReady && flow.length === 0) {
    return (
      <Stage
        step="placement"
        title={t('onboard.selfLevel.title')}
        subtitle={t('onboard.selfLevel.subtitle')}
        t={t}
        footer={
          <>
            <button type="button" onClick={() => setStep('goal')} className={seSecondary}>
              {t('onboard.back')}
            </button>
            <GhostButton onClick={skip}>{t('onboard.skipForNow')}</GhostButton>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3">
          {PLACEMENT_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => pickSelfLevel(level)}
              className="text-left rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:p-5 font-bold text-[15px] lg:text-[16px] text-zinc-900 dark:text-zinc-50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2"
            >
              {level}
            </button>
          ))}
        </div>
      </Stage>
    );
  }

  if (step === 'placement' && flowItem) {
    const sectionBadge = sectionLabel(flowItem.section as PlacementSectionId, t);

    return (
      <Stage
        step="placement"
        title={sectionTitle(flowItem, t)}
        subtitle={sectionSubtitle(flowItem, t)}
        t={t}
        footer={
          <>
            <button type="button" onClick={advanceFlow} className={sePrimary}>
              {isLastFlow ? t('onboard.seeLevel') : t('onboard.next')} <ArrowRight className="w-4 h-4" />
            </button>
            <GhostButton onClick={advanceFlow}>{t('onboard.skipQuestion')}</GhostButton>
            <GhostButton onClick={() => { setStep('result'); }}>{t('onboard.skipPlacement')}</GhostButton>
          </>
        }
      >
        <div className="mb-5 lg:mb-8">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
            <span className="inline-flex items-center gap-1.5">
              {flowItem.section === 'listening' && <Headphones className="w-3.5 h-3.5" />}
              {sectionBadge} · {t('onboard.questionOf', { n: flowIndex + 1, total: flow.length })}
            </span>
            <span>{t('onboard.answered', { n: answeredCount })}</span>
          </div>
          <div className="h-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300" style={{ width: `${flowPct}%` }} />
          </div>
        </div>

        {flowItem.type === 'passage' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 p-4 lg:p-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{flowItem.title}</p>
              <p className="text-[15px] lg:text-[16px] leading-relaxed text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap">{flowItem.passage}</p>
            </div>
            <p className="text-[13px] text-slate-500">{t('onboard.reading.subtitle')}</p>
          </div>
        )}

        {flowItem.type === 'mcq' && (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:items-start">
            <p className="text-[19px] lg:text-[24px] font-serif font-black text-zinc-900 dark:text-zinc-50 leading-snug mb-4 lg:mb-0">
              {flowItem.prompt}
            </p>
            <McqOptions
              options={flowItem.options}
              picked={answers[flowItem.id] as number | undefined}
              onPick={(i) => setAnswers((prev) => ({ ...prev, [flowItem.id]: i }))}
            />
          </div>
        )}

        {flowItem.type === 'truefalse' && (
          <div className="space-y-4">
            <p className="text-[19px] lg:text-[24px] font-serif font-black text-zinc-900 dark:text-zinc-50 leading-snug">
              {flowItem.statement}
            </p>
            <div className="grid grid-cols-2 gap-2.5 max-w-md">
              {([true, false] as const).map((val) => {
                const active = answers[flowItem.id] === val;
                return (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [flowItem.id]: val }))}
                    className={`py-4 rounded-xl border font-bold text-[15px] transition-all ${
                      active
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-slate-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    {val ? t('onboard.true') : t('onboard.false')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {flowItem.type === 'listening' && (
          <div className="space-y-4 lg:space-y-5">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 dark:bg-indigo-950/30 dark:border-indigo-900 p-4 lg:p-5 flex gap-3">
              <Headphones className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[15px] leading-relaxed text-indigo-950 dark:text-indigo-100 italic">{flowItem.context}</p>
            </div>
            <p className="text-[17px] lg:text-[20px] font-serif font-black text-zinc-900 dark:text-zinc-50">{flowItem.prompt}</p>
            <McqOptions
              options={flowItem.options}
              picked={answers[flowItem.id] as number | undefined}
              onPick={(i) => setAnswers((prev) => ({ ...prev, [flowItem.id]: i }))}
            />
          </div>
        )}
      </Stage>
    );
  }

  const sectionRows = (Object.keys(analysis.sections) as PlacementSectionId[]).filter(
    (s) => analysis.sections[s].total > 0,
  );

  return (
    <Stage
      step="result"
      title={t('onboard.result.title')}
      subtitle={t('onboard.result.subtitle')}
      t={t}
      footer={
        <>
          <button type="button" onClick={() => finish(canStartLessons)} className={sePrimary}>
            {canStartLessons ? t('onboard.startLesson') : t('onboard.continuePlans')} <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => finish(false)} className={seSecondary}>
            {canStartLessons ? t('onboard.goHome') : t('onboard.skipForNow')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-5">
        <div className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-5 lg:p-8">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> {t('onboard.result.starting')}
          </div>
          <div className="font-serif font-black text-[28px] lg:text-[40px] leading-none tracking-tight">{startingLevel}</div>
          <p className="text-[13px] lg:text-[14px] text-zinc-400 dark:text-zinc-600 mt-2.5">
            {overrideLevel
              ? CONTENT_LANG_LABEL[lang]
              : t('onboard.result.correct', { correct: analysis.totalCorrect, total: analysis.totalScored })}
            {goal === 'exam' ? ' · IELTS on Practice tab' : ''}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 lg:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3">{t('onboard.result.skills')}</p>
          {sectionRows.length === 0 ? (
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">
              {overrideLevel ? t('onboard.selfLevel.subtitle') : t('onboard.placement.subtitle')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {sectionRows.map((s) => {
                const { correct, total, pct } = analysis.sections[s];
                return (
                  <div key={s}>
                    <div className="flex justify-between text-[13px] font-semibold mb-1">
                      <span>{sectionLabel(s, t)}</span>
                      <span className="text-slate-500">{correct}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              {analysis.strengths.length > 0 && (
                <div>
                  <p className="font-bold text-emerald-700 mb-1">{t('onboard.result.strengths')}</p>
                  <p className="text-slate-600 dark:text-zinc-400">{analysis.strengths.join(', ')}</p>
                </div>
              )}
              {analysis.weaknesses.length > 0 && (
                <div>
                  <p className="font-bold text-amber-700 mb-1">{t('onboard.result.weaknesses')}</p>
                  <p className="text-slate-600 dark:text-zinc-400">{analysis.weaknesses.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 lg:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3.5">{t('onboard.result.nextTitle')}</p>
          <ul className="flex flex-col gap-3">
            {[
              `Learn opens at ${startingLevel}, marked “For you”`,
              'Each lesson runs vocab → read aloud → exercises',
              'Every level stays unlocked if you want to go back',
              'Streak and XP start counting from your first lesson',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13px] lg:text-[14px] text-slate-600 dark:text-zinc-300 leading-snug">
                <span className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" />
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

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full lg:w-auto py-2.5 lg:py-2 px-3 rounded-lg text-[13px] font-semibold text-slate-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
    >
      {children}
    </button>
  );
}
