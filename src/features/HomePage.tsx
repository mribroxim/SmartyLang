import { useState, type ReactNode } from 'react';
import { LegalLinks } from './Legal';
import { motion } from 'motion/react';
import { Check, Crown, Mic, Moon, Sun, Sparkles } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { CONTENT_LANGS, CONTENT_LANG_LABEL, type ContentLang } from '../lib/contentLang';
import { LanguagePicker } from '../components/LanguagePicker';
import { CatLogo } from '../components/brand/CatLogo';
import { Sticker, type StickerId } from '../components/stickers/Sticker';
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

const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-7 py-4 font-serif text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#000] transition-[transform,box-shadow] duration-75 active:translate-y-[5px] active:shadow-none';
const secondaryBtn = 'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-7 py-[14px] font-serif text-[15px] font-extrabold uppercase tracking-wide text-zinc-800 shadow-[0_4px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[4px] active:shadow-none';

/** One feature row: text on one side, a picture on the other (alternating on desktop). */
function Feature({ kicker, title, body, points, visual, flip = false }: { kicker: string; title: string; body: string; points?: string[]; visual: ReactNode; flip?: boolean }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-16 md:px-8 md:py-20">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.45 }}
        className={flip ? 'md:order-2' : ''}>
        {visual}
      </motion.div>
      <div className={flip ? 'md:order-1' : ''}>
        <div className="font-serif text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">{kicker}</div>
        <h2 className="mt-2 font-serif text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 md:text-[42px]">{title}</h2>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-500">{body}</p>
        {points && (
          <ul className="mt-5 space-y-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 font-bold text-zinc-800">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>{p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const card = 'rounded-3xl border-2 border-zinc-900 bg-white shadow-[0_6px_0_0_#18181b]';

/** Landing page: Duolingo-style structure, Smarty's look, our own features front and centre. */
export function HomePage({ user, loginWithGoogle, requestSubscribe, setActiveTab, darkMode, onToggleDark }: HomePageProps) {
  const { contentLang, setContentLang } = useContentLang();
  const { t } = useUiLang();
  const [learnLang, setLearnLang] = useState<ContentLang>(contentLang);

  const start = () => {
    setContentLang(learnLang);
    if (user) setActiveTab('lessons');
    else setActiveTab('dashboard');
  };
  const login = () => (setActiveTab('dashboard'));
  const plans = () => (user ? setActiveTab('plans') : requestSubscribe());

  return (
    <main className="dark:bg-zinc-950 dark:text-zinc-50 min-h-full w-full flex-grow overflow-y-auto bg-white text-zinc-900">
      {/* header */}
      <header className="sticky top-0 z-50 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <CatLogo className="h-9 w-9" />
            <span className="font-serif text-xl font-black tracking-tight">SmartyLang</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={t('core.profilepage.dark_mode_e7f8b9')} aria-pressed={darkMode} onClick={onToggleDark} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800">
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <LanguagePicker mode="interface" variant="compact" className="[&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none" />
            <button type="button" onClick={login} className="hidden rounded-2xl border-2 border-slate-200 px-4 py-2 font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-700 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none sm:inline-flex">
              {user ? t('landing.open') : t('landing.login')}
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 md:grid-cols-2 md:gap-14 md:px-8 md:pb-20 md:pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="relative mx-auto aspect-[16/11] w-full max-w-[560px] overflow-hidden rounded-[2rem] border-2 border-zinc-900 shadow-[0_8px_0_0_#18181b]">
          <img src="/room/background.webp" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 63.8%' }} />
          <img src="/room/window/curtain.webp" alt="" className="absolute right-[6%] top-[8%] w-[30%]" />
          <img src="/room/shelf/trailing.webp" alt="" className="absolute left-[6%] top-[14%] w-[26%]" />
          <img src="/room/bed/cat-ears.webp" alt="" className="absolute bottom-[18%] left-[-3%] w-[30%]" />
          <img src="/room/desk/notebook.webp" alt="" className="absolute bottom-[26%] right-[-2%] w-[26%]" />
          <img src="/room/rug/fluffy.webp" alt="" className="absolute bottom-[8%] left-1/2 w-[44%] -translate-x-1/2" />
          <img src="/room/bowl/full.webp" alt="" className="absolute bottom-[6%] right-[10%] w-[15%]" />
          <div className="absolute bottom-[12%] left-1/2 w-[34%] -translate-x-1/2"><Sticker id="mood.hi-there" size="100%" priority="hero" /></div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="absolute left-1/2 top-[24%] -translate-x-1/2 whitespace-nowrap rounded-2xl border-2 border-zinc-900 bg-white px-3 py-1.5 dark:bg-zinc-900 text-sm font-extrabold shadow-[0_3px_0_0_#18181b]">
            {t('landing.heroBubble')}
          </motion.div>
        </motion.div>
        <div className="text-center md:text-left">
          <h1 className="font-serif text-[38px] font-black leading-[1.08] tracking-tight md:text-[56px]">{t('landing.heroTitle')}</h1>
          <p className="mx-auto mt-4 max-w-md text-lg font-semibold text-slate-500 md:mx-0">{t('landing.heroBody')}</p>
          <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 md:mx-0">
            <button type="button" onClick={start} className={primaryBtn}>{t('landing.getStarted')}</button>
            {!user && <button type="button" onClick={login} className={secondaryBtn}>{t('landing.haveAccount')}</button>}
          </div>
        </div>
      </section>

      {/* languages */}
      <section className="border-y-2 border-slate-100 bg-slate-50/60 dark:bg-zinc-900/70">
        <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
          <div className="mb-3 text-center font-serif text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">{t('landing.pickLanguage')}</div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:justify-center md:px-0">
            {CONTENT_LANGS.map((c) => (
              <button key={c} type="button" onClick={() => setLearnLang(c)}
                className={`shrink-0 rounded-2xl border-2 px-4 py-2 font-serif text-sm font-extrabold transition-[transform,box-shadow] duration-75 active:translate-y-[2px] ${learnLang === c ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_3px_0_0_#000]' : 'border-slate-200 bg-white text-zinc-700 shadow-[0_3px_0_0_#e2e8f0]'}`}>
                {CONTENT_LANG_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* talk to Smarty */}
      <Feature kicker={t('landing.talk.kicker')} title={t('landing.talk.title')} body={t('landing.talk.body')}
        points={[t('landing.talk.p1'), t('landing.talk.p2'), t('landing.talk.p3')]}
        visual={
          <div className={`${card} mx-auto max-w-md p-5`}>
            <div className="flex items-end gap-3">
              <Sticker id="speak.conversation-partner" size={84} mode="still" />
              <div className="mb-2 rounded-2xl rounded-bl-md border-2 border-zinc-900 bg-white px-4 py-2.5 font-bold">{t('landing.talk.smarty1')}</div>
            </div>
            <div className="mt-3 flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 font-bold text-white">{t('landing.talk.you')}</div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <Sticker id="mood.yay" size={64} mode="still" />
              <div className="mb-1 rounded-2xl rounded-bl-md border-2 border-zinc-900 bg-white px-4 py-2.5 font-bold">
                {t('landing.talk.smarty2')}
                <span className="mt-1 block text-xs font-semibold text-slate-400">💡 {t('landing.talk.tip')}</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-zinc-900 py-3 font-serif text-sm font-extrabold uppercase tracking-wide text-white"><Mic className="h-4 w-4" />{t('room.talk.button')}</div>
          </div>
        } />

      {/* bites */}
      <Feature flip kicker={t('landing.bites.kicker')} title={t('landing.bites.title')} body={t('landing.bites.body')}
        points={[t('landing.bites.p1'), t('landing.bites.p2'), t('landing.bites.p3')]}
        visual={
          <div className={`${card} mx-auto flex max-w-md flex-col items-center gap-4 bg-slate-50 p-6`}>
            {['done', 'done', 'now', 'next'].map((s, i) => (
              <div key={i} className="flex w-full items-center gap-4" style={{ paddingLeft: `${[10, 40, 60, 30][i]}%` }}>
                <span className={`flex h-16 w-16 items-center justify-center rounded-full font-serif text-xl font-extrabold ${s === 'done' ? 'bg-amber-400 shadow-[0_5px_0_0_#b45309]' : s === 'now' ? 'bg-zinc-900 text-white shadow-[0_5px_0_0_#000]' : 'bg-slate-200 text-slate-400 shadow-[0_5px_0_0_#cbd5e1]'}`}>
                  {s === 'done' ? <Check className="h-7 w-7" strokeWidth={3} /> : s === 'now' ? '▶' : '🔒'}
                </span>
                {s === 'now' && <span className="rounded-xl border-2 border-zinc-900 bg-white px-3 py-1 font-serif text-xs font-extrabold uppercase">{t('bites.minutes', { n: 3 })}</span>}
              </div>
            ))}
          </div>
        } />

      {/* feed Smarty */}
      <Feature kicker={t('landing.feed.kicker')} title={t('landing.feed.title')} body={t('landing.feed.body')}
        visual={
          <div className={`${card} mx-auto max-w-md p-6`}>
            <div className="grid grid-cols-5 items-end gap-2">
              {['empty', 'one', 'three', 'pile', 'full'].map((b) => <img key={b} src={`/room/bowl/${b}.webp`} alt="" className="w-full" />)}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Sticker id="reward.snack-time" size={72} mode="still" />
              <div>
                <div className="font-serif text-lg font-extrabold">{t('landing.feed.card')}</div>
                <div className="text-sm font-semibold text-slate-500">{t('landing.feed.cardSub')}</div>
              </div>
            </div>
          </div>
        } />

      {/* room */}
      <Feature flip kicker={t('landing.room.kicker')} title={t('landing.room.title')} body={t('landing.room.body')}
        visual={
          <div className={`${card} mx-auto grid max-w-md grid-cols-3 gap-3 p-5`}>
            {['bed/paw', 'bed/canopy', 'desk/gamer', 'window/fairy-lights', 'rug/cat-face', 'chair/paw-ears', 'shelf/fairy', 'desk/cozy', 'bed/cat-cave'].map((src) => (
              <div key={src} className="flex aspect-square items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-2">
                <img src={`/room/${src}.webp`} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        } />

      {/* read aloud */}
      <Feature kicker={t('landing.read.kicker')} title={t('landing.read.title')} body={t('landing.read.body')}
        visual={
          <div className={`${card} mx-auto max-w-md p-6`}>
            <p className="text-xl font-bold leading-relaxed">
              <span className="text-emerald-600">{t('landing.read.s1')}</span>{' '}
              <span className="underline decoration-zinc-900 decoration-4 underline-offset-4">{t('landing.read.s2')}</span>{' '}
              <span className="text-slate-300">{t('landing.read.s3')}</span>
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-serif text-lg font-extrabold">12<span className="text-sm text-slate-400">/40</span></span>
              <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full border-[3px] border-rose-700 bg-rose-500 shadow-[0_4px_0_0_#9f1239]"><span className="h-5 w-5 rounded-md bg-white" /></span>
              <span className="rounded-xl bg-emerald-500 px-2.5 py-1 font-serif text-xs font-extrabold uppercase text-white">{t('read.live')}</span>
            </div>
          </div>
        } />

      {/* compete */}
      <Feature flip kicker={t('landing.compete.kicker')} title={t('landing.compete.title')} body={t('landing.compete.body')}
        visual={
          <div className={`${card} mx-auto max-w-md p-6`}>
            <div className="flex items-end justify-between gap-1">
              {['bronze', 'silver', 'gold', 'emerald', 'diamond'].map((l, i) => <img key={l} src={`/room/trophy/${l}.webp`} alt="" style={{ width: `${14 + i * 2}%` }} />)}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <img src="/room/fire/hot.webp" alt="" className="h-12 w-auto" />
              <div>
                <div className="font-serif text-lg font-extrabold">{t('landing.compete.streak')}</div>
                <div className="text-sm font-semibold text-slate-500">{t('landing.compete.quests')}</div>
              </div>
            </div>
          </div>
        } />

      {/* schools */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
          <Sticker id="social.study-group" size={120} mode="still" className="mx-auto" />
          <h2 className="mt-2 font-serif text-3xl font-extrabold tracking-tight md:text-[42px]">{t('landing.schools.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg font-semibold text-slate-500">{t('landing.schools.body')}</p>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 text-left md:grid-cols-3">
            {(['classes', 'progress', 'seats'] as const).map((k, i) => (
              <div key={k} className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-[0_4px_0_0_#e2e8f0]">
                <Sticker id={(['pose.study-buddies', 'flow.learning-path', 'premium.vip-cat'] as StickerId[])[i] ?? 'mood.hello'} size={56} mode="still" />
                <div className="mt-2 font-serif text-lg font-extrabold">{t(`landing.schools.${k}` as UiStringKey)}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{t(`landing.schools.${k}Body` as UiStringKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Max */}
      <section className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-14 text-center md:flex-row md:text-left md:px-8">
          <Sticker id="premium.royal-treatment" size={130} mode="still" className="shrink-0" />
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-900"><Crown className="h-3.5 w-3.5" />Smarty Max</div>
            <h2 className="mt-3 font-serif text-3xl font-extrabold tracking-tight md:text-4xl">{t('landing.max.title')}</h2>
            <p className="mt-2 text-lg font-semibold text-zinc-300">{t('landing.max.body')}</p>
          </div>
          <button type="button" onClick={plans} className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-7 py-4 font-serif text-[15px] font-extrabold uppercase tracking-wide text-zinc-900 shadow-[0_5px_0_0_#a1a1aa] active:translate-y-[5px] active:shadow-none">
            <Sparkles className="h-4 w-4" />{t('landing.max.cta')}
          </button>
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Sticker id="flow.welcome-aboard" size={170} priority="hero" className="mx-auto" />
        <h2 className="mt-2 font-serif text-4xl font-black tracking-tight md:text-5xl">{t('landing.final.title')}</h2>
        <button type="button" onClick={start} className={`${primaryBtn} mt-8 w-full max-w-sm`}>{t('landing.getStarted')}</button>
      </section>

      <footer className="border-t-2 border-slate-100">
        <LegalLinks />
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm font-bold text-slate-400 md:flex-row md:px-8">
          <span className="flex items-center gap-2"><CatLogo className="h-6 w-6" />© {new Date().getFullYear()} SmartyLang</span>
          <button type="button" onClick={plans} className="hover:text-zinc-900">{t('landing.footerPlans')}</button>
        </div>
      </footer>
    </main>
  );
}
