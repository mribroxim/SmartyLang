import { useState } from 'react';
import {
  BookOpen, GraduationCap, ChevronRight, Brain, Headphones, Mic, PenLine,
  ArrowRight, Crown, Building2, Check, Languages, ShieldCheck, Zap, Moon, Sun,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PLANS, type PlanId } from '../lib/atmos';
import { LanguagePicker } from '../components/LanguagePicker';
import { FadeIn } from '../components/motion';
import { useUiLang } from '../contexts/UiLangContext';
import type { UiStringKey } from '../lib/uiStrings';

interface HomePageProps {
  user: any;
  loginWithGoogle: () => void;
  requestSubscribe: () => void;
  setActiveTab: (tab: string) => void;
  setReadingView: (view: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function HomePage({ user, loginWithGoogle, requestSubscribe, setActiveTab, darkMode, onToggleDark }: HomePageProps) {
  const { uiLang } = useUiLang();
  const goToPlans = () => {
    if (user) setActiveTab('plans');
    else requestSubscribe();
  };

  return (
    <main className="flex-grow overflow-y-auto w-full bg-white dark:bg-zinc-950 relative">
      <TopNav user={user} loginWithGoogle={loginWithGoogle} setActiveTab={setActiveTab} darkMode={darkMode} onToggleDark={onToggleDark} />
      <AnimatePresence mode="wait">
        <motion.div
          key={uiLang}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <Hero user={user} loginWithGoogle={loginWithGoogle} setActiveTab={setActiveTab} />
          <SkillsSection />
          <ProductSection />
          <TeachersOrgSection goToPlans={goToPlans} />
          <PricingSection goToPlans={goToPlans} />
          <Footer />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${light ? 'bg-white' : 'bg-zinc-900 dark:bg-zinc-100'}`}>
        <span className={`font-serif font-black text-lg leading-none ${light ? 'text-zinc-900' : 'text-white dark:text-zinc-900'}`}>S</span>
      </div>
      <span className={`font-serif font-black tracking-tighter uppercase text-xl ${light ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'}`}>
        SmartyLang
      </span>
    </div>
  );
}

function TopNav({ user, loginWithGoogle, setActiveTab, darkMode, onToggleDark }: any) {
  const { t } = useUiLang();
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center gap-3">
        <BrandMark />
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-zinc-400">
          <a href="#product" className="hover:text-zinc-900 dark:hover:text-zinc-50">{t('home.nav.product')}</a>
          <a href="#teachers" className="hover:text-zinc-900 dark:hover:text-zinc-50">{t('home.nav.teachers')}</a>
          <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-zinc-50">{t('home.nav.pricing')}</a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <LanguagePicker mode="interface" variant="compact" />
          {user ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-black dark:hover:bg-white hover:-translate-y-px"
            >
              {t('home.cta.dashboard')}
            </button>
          ) : (
            <>
              <button
                onClick={loginWithGoogle}
                className="hidden sm:inline px-3 py-2 text-zinc-700 dark:text-zinc-300 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {t('home.cta.signIn')}
              </button>
              <button
                onClick={loginWithGoogle}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-black dark:hover:bg-white hover:-translate-y-px"
              >
                {t('home.cta.tryFree')}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ user, loginWithGoogle, setActiveTab }: any) {
  const { t } = useUiLang();
  return (
    <section className="relative pt-14 pb-16 md:pt-20 md:pb-24 px-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(24,24,27,0.04),_transparent_55%)]" />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="font-serif font-black tracking-tighter uppercase text-2xl sm:text-3xl text-zinc-900 dark:text-zinc-50 mb-5"
            >
              SmartyLang
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
              className="text-4xl sm:text-5xl md:text-[3.25rem] font-serif font-black text-zinc-900 dark:text-zinc-50 leading-[1.05] tracking-tight mb-4"
            >
              {t('home.hero.title1')}<br />
              <span className="text-slate-500 dark:text-zinc-400">{t('home.hero.title2')}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="text-base md:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-md"
            >
              {t('home.hero.body')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            >
              <button
                onClick={user ? () => setActiveTab('dashboard') : loginWithGoogle}
                className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold tracking-wider uppercase text-sm rounded-xl hover:bg-black dark:hover:bg-white hover:-translate-y-px flex items-center justify-center gap-2"
              >
                {user ? t('home.cta.dashboard') : t('home.cta.start')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-slate-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 font-semibold tracking-wider uppercase text-sm rounded-xl"
              >
                {t('home.cta.pricing')}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
              className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"
            >
              <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> {t('home.hero.noCard')}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> {t('home.hero.uiLangs')}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> {t('home.hero.cancel')}</span>
            </motion.div>
          </div>

          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  const { t } = useUiLang();
  const nav = [
    t('home.preview.learn'),
    t('home.preview.practice'),
    t('home.preview.vocab'),
    t('home.preview.plans'),
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
      className="relative"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800 bg-[#f9f9f9] dark:bg-zinc-900">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="ms-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('home.preview.dashboard')}</span>
        </div>
        <div className="grid grid-cols-[88px_1fr] min-h-[280px] sm:min-h-[320px]">
          <aside className="bg-[#f9f9f9] dark:bg-zinc-950 border-e border-slate-100 dark:border-zinc-800 p-3 space-y-2">
            <div className="h-2.5 w-14 rounded bg-zinc-900/80 mb-4" />
            {nav.map((label, i) => (
              <div
                key={label}
                className={`h-7 rounded-lg px-2 flex items-center text-[9px] font-semibold ${
                  i === 0 ? 'bg-zinc-900 text-white' : 'text-slate-500'
                }`}
              >
                {label}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('home.preview.today')}</p>
                <p className="text-sm font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('home.preview.continue')}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">120 XP</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-3.5 bg-white dark:bg-zinc-900">
              <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">
                {t('home.preview.passage')}
              </p>
              <div className="flex gap-2">
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">{t('home.preview.readAloud')}</span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-zinc-900 text-white">{t('home.preview.exercises')}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t('home.preview.reading'), tone: 'bg-emerald-50 text-emerald-700' },
                { label: t('home.preview.listening'), tone: 'bg-slate-50 text-slate-600' },
                { label: t('home.preview.speaking'), tone: 'bg-slate-50 text-slate-600' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border border-slate-200 p-2.5 text-center ${s.tone}`}>
                  <p className="text-[10px] font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SkillsSection() {
  const { t } = useUiLang();
  const skills = [
    { icon: BookOpen, title: t('home.preview.reading'), desc: t('home.skills.reading.desc') },
    { icon: Headphones, title: t('home.preview.listening'), desc: t('home.skills.listening.desc') },
    { icon: Mic, title: t('home.preview.speaking'), desc: t('home.skills.speaking.desc') },
    { icon: PenLine, title: t('nav.writing'), desc: t('home.skills.writing.desc') },
  ];
  return (
    <section className="py-16 md:py-20 px-4 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-10 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
            {t('home.skills.title')}
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-base leading-relaxed">
            {t('home.skills.body')}
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {skills.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm h-full"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  const { t } = useUiLang();
  const points = [
    { icon: Languages, title: t('home.product.p1.title'), desc: t('home.product.p1.desc') },
    { icon: Brain, title: t('home.product.p2.title'), desc: t('home.product.p2.desc') },
    { icon: Zap, title: t('home.product.p3.title'), desc: t('home.product.p3.desc') },
  ];
  return (
    <section id="product" className="py-16 md:py-20 px-4 bg-slate-50 dark:bg-zinc-900/40 border-y border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-10 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
            {t('home.product.title')}
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-base leading-relaxed">
            {t('home.product.body')}
          </p>
        </FadeIn>
        <div className="space-y-3">
          {points.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.05}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="flex gap-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 md:p-6 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{desc}</p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeachersOrgSection({ goToPlans }: { goToPlans: () => void }) {
  const { t } = useUiLang();
  return (
    <section id="teachers" className="py-16 md:py-24 px-4 bg-zinc-900 text-white dark-keep">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-12 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight mb-3">
            {t('home.teachers.title')}
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            {t('home.teachers.body')}
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-4">
          <FadeIn>
            <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-white/10 bg-white/5 p-7 h-full">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.teachers.teachers')}</h3>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                {t('home.teachers.teachers.price')}
              </p>
              <ul className="space-y-2.5 mb-7">
                {[t('home.teachers.teachers.f1'), t('home.teachers.teachers.f2'), t('home.teachers.teachers.f3')].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={goToPlans}
                className="w-full py-3 rounded-xl bg-white dark:bg-zinc-100 text-zinc-900 font-semibold text-sm uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-white"
              >
                {t('home.teachers.teachers.cta')}
              </button>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-7 h-full">
              <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center mb-5">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.teachers.org')}</h3>
              <p className="text-sm text-emerald-100/80 mb-5 leading-relaxed">
                {t('home.teachers.org.price')}
              </p>
              <ul className="space-y-2.5 mb-7">
                {[t('home.teachers.org.f1'), t('home.teachers.org.f2'), t('home.teachers.org.f3')].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={goToPlans}
                className="w-full py-3 rounded-xl bg-zinc-950 text-white font-semibold text-sm uppercase tracking-wider hover:bg-black border border-white/10"
              >
                {t('home.teachers.org.cta')}
              </button>
            </motion.div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

const PLAN_COPY: Record<PlanId, { name: UiStringKey; desc: UiStringKey; features: UiStringKey[] }> = {
  'smarty-max': {
    name: 'home.plan.max.name',
    desc: 'home.plan.max.desc',
    features: ['home.plan.max.f1', 'home.plan.max.f2', 'home.plan.max.f3', 'home.plan.max.f4', 'home.plan.max.f5'],
  },
  teacher: {
    name: 'home.plan.teacher.name',
    desc: 'home.plan.teacher.desc',
    features: ['home.plan.teacher.f1', 'home.plan.teacher.f2', 'home.plan.teacher.f3', 'home.plan.teacher.f4', 'home.plan.teacher.f5'],
  },
  organization: {
    name: 'home.plan.org.name',
    desc: 'home.plan.org.desc',
    features: ['home.plan.org.f1', 'home.plan.org.f2', 'home.plan.org.f3', 'home.plan.org.f4', 'home.plan.org.f5'],
  },
};

function PricingSection({ goToPlans }: { goToPlans: () => void }) {
  const { t } = useUiLang();
  return (
    <section id="pricing" className="py-16 md:py-24 px-4 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-12 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
            {t('home.pricing.title')}
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-base leading-relaxed">
            {t('home.pricing.body')}
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => {
            const isMax = plan.id === 'smarty-max';
            const isOrg = plan.id === 'organization';
            const isTeacher = plan.id === 'teacher';
            const copy = PLAN_COPY[plan.id];
            return (
              <FadeIn key={plan.id} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className={`relative rounded-2xl p-6 flex flex-col border h-full ${
                    isMax
                      ? 'bg-zinc-900 text-white border-zinc-800 dark-keep'
                      : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 start-5 bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg dark-keep">
                      {t('home.pricing.popular')}
                    </div>
                  )}

                  <div className="mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isMax ? 'bg-white/10' : isTeacher ? 'bg-amber-50' : 'bg-emerald-50'
                    }`}>
                      {isMax ? <Crown className="w-5 h-5 text-white" /> :
                       isTeacher ? <GraduationCap className="w-5 h-5 text-amber-700" /> :
                       <Building2 className="w-5 h-5 text-emerald-700" />}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-1">{t(copy.name)}</h3>
                    <p className={`text-sm ${isMax ? 'text-zinc-300' : 'text-slate-500 dark:text-zinc-400'}`}>{t(copy.desc)}</p>
                  </div>

                  <div className="mb-5">
                    {isOrg ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black font-mono">${plan.extraSeatPriceUSD}</span>
                          <span className={`text-sm font-semibold ${isMax ? 'text-zinc-300' : 'text-slate-400'}`}>{t('home.pricing.perSeat')}</span>
                        </div>
                        <p className={`text-xs mt-1 ${isMax ? 'text-zinc-300' : 'text-slate-400'}`}>
                          {t('home.pricing.orgMeta', { n: plan.minSeats ?? 20, price: plan.extraLanguagePerSeatUSD ?? 0 })}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black font-mono">${plan.basePriceUSD}</span>
                          <span className={`text-sm font-semibold ${isMax ? 'text-zinc-300' : 'text-slate-400'}`}>{t('home.pricing.perMonth')}</span>
                        </div>
                        {plan.extraSeatPriceUSD ? (
                          <p className={`text-xs mt-1 ${isMax ? 'text-zinc-300' : 'text-slate-400'}`}>
                            {t('home.pricing.teacherMeta', { seat: plan.extraSeatPriceUSD, lang: plan.extraLanguagePerSeatUSD ?? 0 })}
                          </p>
                        ) : plan.extraLearningLanguageUSD ? (
                          <p className={`text-xs mt-1 ${isMax ? 'text-zinc-300' : 'text-slate-400'}`}>
                            {t('home.pricing.maxMeta', { price: plan.extraLearningLanguageUSD })}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 mb-7 flex-1">
                    {copy.features.map((key) => (
                      <li key={key} className="flex items-start gap-2 text-sm leading-relaxed">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isMax ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span className={isMax ? 'text-zinc-200' : 'text-slate-700 dark:text-zinc-300'}>{t(key)}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={goToPlans}
                    className={`w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider ${
                      isMax
                        ? 'bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-white'
                    }`}
                  >
                    {t('home.pricing.subscribe')}
                  </button>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>

        <FAQ />
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useUiLang();
  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`home.faq.q${n}` as UiStringKey),
    a: t(`home.faq.a${n}` as UiStringKey),
  }));
  const [open, setOpen] = useState<number | null>(0);
  return (
    <FadeIn className="max-w-2xl mx-auto mt-16">
      <h3 className="text-xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-6 text-center">{t('home.faq.title')}</h3>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={f.q} className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm pe-4">{f.q}</span>
              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800 pt-3">
                    {f.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

function Footer() {
  const { t } = useUiLang();
  return (
    <footer className="py-10 px-4 bg-zinc-950 text-zinc-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <BrandMark light />
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            © {new Date().getFullYear()}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
          <a href="#product" className="hover:text-white">{t('home.nav.product')}</a>
          <a href="#teachers" className="hover:text-white">{t('home.nav.teachers')}</a>
          <a href="#pricing" className="hover:text-white">{t('home.nav.pricing')}</a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://t.me/mribroxim"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] hover:bg-[#1a8bc1] text-white text-xs font-semibold uppercase tracking-wider rounded-xl"
          >
            <TelegramIcon className="w-4 h-4" />
            {t('home.footer.telegram')}
          </a>
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('home.footer.atmos')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
    </svg>
  );
}
