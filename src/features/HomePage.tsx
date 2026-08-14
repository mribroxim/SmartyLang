import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, GraduationCap, ChevronRight, Brain, Headphones, Mic, PenLine,
  Play, Sparkles, Crown, Building2, Check, Languages, ArrowRight, Zap,
  Trophy, ShieldCheck, Volume2, Plus, CheckCircle2, Search,
} from 'lucide-react';
import { PLANS } from '../lib/atmos';
import { LanguagePicker } from '../components/LanguagePicker';

interface HomePageProps {
  user: any;
  loginWithGoogle: () => void;
  /** Triggers login → subscription flow. If user is already signed in, jumps straight to Plans. */
  requestSubscribe: () => void;
  setActiveTab: (tab: string) => void;
  setReadingView: (view: string) => void;
}

export function HomePage({ user, loginWithGoogle, requestSubscribe, setActiveTab, setReadingView }: HomePageProps) {
  // Centralised subscribe handler: signed-in users go to Plans, signed-out users
  // go through the login → plans pipeline set up in App.tsx.
  const goToPlans = () => {
    if (user) setActiveTab('plans');
    else requestSubscribe();
  };

  return (
    <main className="flex-grow overflow-y-auto w-full bg-white relative">
      <TopNav user={user} loginWithGoogle={loginWithGoogle} setActiveTab={setActiveTab} />
      <Hero user={user} loginWithGoogle={loginWithGoogle} setActiveTab={setActiveTab} />
      <StatsStrip />
      <ExperienceSection setActiveTab={setActiveTab} setReadingView={setReadingView} goToPlans={goToPlans} />
      <AIExaminerSection setActiveTab={setActiveTab} />
      <TeachersOrgSection goToPlans={goToPlans} />
      <PricingSection goToPlans={goToPlans} />
      <Footer />
    </main>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   TOP NAV
   ════════════════════════════════════════════════════════════════════════ */
function TopNav({ user, loginWithGoogle, setActiveTab }: any) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="font-serif font-black text-white text-lg leading-none">S</span>
          </div>
          <span className="font-serif font-black tracking-tighter uppercase text-xl text-zinc-900">SMARTY</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-600">
          <a href="#experience" className="hover:text-zinc-900 transition-colors">Experience</a>
          <a href="#ai-examiner" className="hover:text-zinc-900 transition-colors">AI Examiner</a>
          <a href="#teachers" className="hover:text-zinc-900 transition-colors">For Teachers</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker variant="compact" />
          {user ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2.5 bg-zinc-900 text-white font-bold tracking-widest text-xs uppercase rounded-full hover:bg-black transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={loginWithGoogle}
                className="hidden sm:inline px-4 py-2 text-zinc-700 font-bold tracking-wider text-xs uppercase rounded-full hover:bg-zinc-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={loginWithGoogle}
                className="px-5 py-2.5 bg-zinc-900 text-white font-bold tracking-widest text-xs uppercase rounded-full hover:bg-black transition-colors"
              >
                Try Free
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════════════════════════ */
function Hero({ user, loginWithGoogle, setActiveTab }: any) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4">
      {/* Background flair */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-gradient-to-br from-indigo-100 via-emerald-50 to-amber-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-zinc-100 to-emerald-100 rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — copy + CTAs */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-black text-zinc-900 leading-[1.0] tracking-tighter mb-6">
              Practice <span className="italic text-zinc-500">Every</span> Language Skill{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">In One Place.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-600 leading-relaxed font-light mb-8 max-w-xl">
              Reading, listening, speaking, writing — graded by AI examiners trained on IELTS standards. From beginner to expert, with real-time feedback.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <button
                onClick={user ? () => setActiveTab('dashboard') : loginWithGoogle}
                className="px-7 py-3.5 bg-zinc-900 text-white font-bold tracking-widest uppercase text-sm rounded-full hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {user ? <>Go to Dashboard <ArrowRight className="w-4 h-4" /></> : <>Start Free <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('pricing');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3.5 bg-white text-zinc-900 border-2 border-zinc-200 hover:border-zinc-900 font-bold tracking-widest uppercase text-sm rounded-full transition-all"
              >
                See Pricing
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 font-bold">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Free demos</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime</div>
            </div>
          </div>

          {/* RIGHT — video showcase */}
          <div className="relative">
            <VideoShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   VIDEO SHOWCASE — auto-playing animated product tour.
   Eight scenes cycle every few seconds, looping forever. No real video
   file is loaded — this is a fully animated CSS/React component, so it's
   responsive, weightless, and always shows the live product UI.
   ════════════════════════════════════════════════════════════════════════ */

interface Scene {
  kind: 'hero' | 'reading' | 'listening' | 'speaking' | 'writing' | 'vocab' | 'teacher' | 'cta';
  duration: number; // ms
  label: string;
}

const TOUR_SCENES: Scene[] = [
  { kind: 'hero',     duration: 3500, label: 'Welcome' },
  { kind: 'reading',  duration: 4800, label: 'Reading' },
  { kind: 'listening',duration: 4500, label: 'Listening' },
  { kind: 'speaking', duration: 4800, label: 'Speaking' },
  { kind: 'writing',  duration: 4800, label: 'AI Writing' },
  { kind: 'vocab',    duration: 4500, label: 'Vocabulary' },
  { kind: 'teacher',  duration: 4800, label: 'For Teachers' },
  { kind: 'cta',      duration: 4500, label: 'Start Free' },
];

function VideoShowcase() {
  const [idx, setIdx]     = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);

  // Auto-advance — pauses while user hovers, or after manual pause.
  useEffect(() => {
    if (paused || hover) return;
    const t = setTimeout(
      () => setIdx(prev => (prev + 1) % TOUR_SCENES.length),
      TOUR_SCENES[idx].duration,
    );
    return () => clearTimeout(t);
  }, [idx, paused, hover]);

  const scene = TOUR_SCENES[idx];

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Decorative gradient ring */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 rounded-[2.5rem] blur-2xl opacity-25 animate-pulse" style={{ animationDuration: '4s' }}></div>

      <div
        className="relative aspect-video rounded-[2rem] overflow-hidden bg-zinc-900 shadow-2xl ring-1 ring-zinc-200"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Scene container — keyed by idx so it remounts and the animation fires fresh */}
        <div key={idx} className="absolute inset-0 tour-fade-in">
          {scene.kind === 'hero'      && <HeroScene />}
          {scene.kind === 'reading'   && <ReadingScene />}
          {scene.kind === 'listening' && <ListeningScene />}
          {scene.kind === 'speaking'  && <SpeakingScene />}
          {scene.kind === 'writing'   && <WritingScene />}
          {scene.kind === 'vocab'     && <VocabScene />}
          {scene.kind === 'teacher'   && <TeacherScene />}
          {scene.kind === 'cta'       && <CTAScene />}
        </div>

        {/* Top-left scene counter + label */}
        <div className="absolute top-4 left-5 flex items-center gap-2 z-10 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-white/70 tracking-widest tabular-nums">
            {String(idx + 1).padStart(2, '0')} / {String(TOUR_SCENES.length).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{scene.label}</span>
        </div>

        {/* Pause toggle */}
        <button
          onClick={() => setPaused(p => !p)}
          aria-label={paused ? 'Resume tour' : 'Pause tour'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition-colors z-10"
        >
          {paused
            ? <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            : <span className="block w-2 h-3 border-l-2 border-r-2 border-white" />}
        </button>

        {/* Scene-dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {TOUR_SCENES.map((_, i) => (
            <button
              key={i}
              aria-label={`Jump to scene ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all ${
                i === idx ? 'w-6 bg-white' : 'w-1 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Progress bar — fills over the current scene's duration */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          {!paused && !hover && (
            <div
              key={idx}
              className="h-full bg-emerald-400"
              style={{ animation: `tourProgress ${scene.duration}ms linear forwards` }}
            />
          )}
        </div>
      </div>

      {/* Animation keyframes scoped to this section */}
      <style>{`
        @keyframes tourProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes tourFadeIn {
          0%   { opacity: 0; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        .tour-fade-in { animation: tourFadeIn 0.7s ease-out both; }

        @keyframes tourWordHighlight {
          0%, 100% { color: rgb(228 228 231); background-color: transparent; }
          15%, 85% { color: rgb(16 185 129); background-color: rgba(16, 185, 129, 0.12); }
        }
        @keyframes tourBarFill {
          from { width: 0%; }
          to   { width: var(--target, 70%); }
        }
        @keyframes tourCounter {
          from { content: '0.0'; }
          to   { content: var(--target); }
        }
        @keyframes tourTypewriter {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes tourCardFlip {
          0%, 45%   { transform: rotateY(0deg); }
          55%, 100% { transform: rotateY(180deg); }
        }
        @keyframes tourSlideUp {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .tour-slide-up { animation: tourSlideUp 0.6s ease-out both; }
      `}</style>
    </div>
  );
}

/* ─── Scene 1: Hero — brand wordmark + tagline ─────────────────────────── */
function HeroScene() {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-indigo-950 via-zinc-950 to-emerald-950">
      <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.5) 0%, transparent 50%)'
      }}></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <div className="tour-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-[10px] font-bold tracking-[0.3em] uppercase mb-5">
            <Sparkles className="w-3 h-3 text-amber-300" /> Smarty English
          </div>
        </div>
        <h1 className="tour-slide-up font-serif font-black text-white text-4xl md:text-6xl tracking-tighter leading-[1.05] mb-3" style={{ animationDelay: '0.35s' }}>
          Practice <span className="italic text-zinc-400">Every</span><br />
          Language Skill.
        </h1>
        <p className="tour-slide-up text-sm md:text-base text-zinc-400 max-w-md" style={{ animationDelay: '0.6s' }}>
          Reading · Listening · Speaking · Writing — graded by AI.
        </p>
      </div>
    </div>
  );
}

/* ─── Scene 2: Reading — words turn green as if being spoken ───────────── */
function ReadingScene() {
  const words = ['The', 'sun', 'rises', 'over', 'the', 'quiet', 'mountain', 'village.'];
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-8 md:p-12 flex flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 tour-slide-up">
          <BookOpen className="w-3 h-3" /> Reading Practice · A1
        </div>
        <p className="text-zinc-800 font-serif text-2xl md:text-4xl leading-[1.5] tracking-tight">
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                animation: `tourWordHighlight 4s ease-in-out ${i * 0.45}s infinite`,
                display: 'inline-block',
                padding: '0 4px',
                borderRadius: '6px',
              }}
            >
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
      <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm tour-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-sm font-bold text-zinc-700">Recording — read aloud</span>
        </div>
        <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center shadow-md shadow-rose-200">
          <Mic className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 3: Listening — audio bars + question ───────────────────────── */
function ListeningScene() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 p-8 md:p-12 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 tour-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">
            <Headphones className="w-3 h-3" /> Listening · Intermediate · 2:34
          </div>
          <div className="flex items-end gap-1">
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-500 rounded-full"
                style={{
                  height: `${h * 4}px`,
                  animation: `tourBarFill 0.8s ease-out ${i * 0.08}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-zinc-800 font-serif text-lg md:text-2xl leading-relaxed tour-slide-up" style={{ animationDelay: '0.2s' }}>
          Climate scientists have observed a <span className="bg-indigo-100 text-indigo-800 px-1.5 rounded">steady increase</span> in ocean temperatures…
        </p>
      </div>
      <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-sm tour-slide-up" style={{ animationDelay: '0.4s' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">Question 1 of 5</p>
        <p className="text-base md:text-lg font-bold text-zinc-900 mb-3">What is the main topic discussed?</p>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 tour-slide-up" style={{ animationDelay: '1.8s' }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold text-emerald-700">Ocean temperatures rising</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 4: Speaking — live transcript + recording ──────────────────── */
function SpeakingScene() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 p-8 md:p-12 flex flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 tour-slide-up">
          <Mic className="w-3 h-3" /> Speaking · IELTS Part 2
        </div>
        <div className="bg-white border border-rose-200 rounded-2xl p-4 mb-3 shadow-sm tour-slide-up" style={{ animationDelay: '0.15s' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">Prompt</p>
          <p className="text-base md:text-lg font-serif text-zinc-800">Describe a place you would like to visit.</p>
        </div>
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm tour-slide-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Live transcript · 0:34</p>
          </div>
          <p className="text-sm md:text-base font-serif text-zinc-700 leading-relaxed overflow-hidden whitespace-nowrap" style={{ animation: 'tourTypewriter 3s steps(60) 0.6s forwards', width: '0' }}>
            I would really love to visit Japan because the culture is so rich…
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center tour-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-200 ring-4 ring-rose-100 animate-pulse">
          <div className="w-4 h-4 bg-white rounded-sm" />
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 5: AI Writing examiner — IELTS bands fill in ───────────────── */
function WritingScene() {
  const bands = [
    { label: 'Task Achievement',       score: 7.0, color: 'bg-emerald-500' },
    { label: 'Coherence & Cohesion',   score: 6.5, color: 'bg-indigo-500'  },
    { label: 'Lexical Resource',       score: 7.5, color: 'bg-amber-500'   },
    { label: 'Grammatical Range',      score: 7.0, color: 'bg-rose-500'    },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-indigo-50 p-8 md:p-12 flex flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest mb-5 tour-slide-up">
          <Sparkles className="w-3 h-3 text-amber-400" /> AI Examiner · Writing
        </div>
        <div className="space-y-3">
          {bands.map((b, i) => (
            <div key={b.label} className="tour-slide-up" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs md:text-sm font-bold text-zinc-700">{b.label}</span>
                <span className="text-sm md:text-base font-mono font-black text-zinc-900">{b.score.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${b.color} rounded-full`}
                  style={{
                    width: `${(b.score / 9) * 100}%`,
                    animation: `tourBarFill 1.2s ease-out ${0.4 + i * 0.15}s both`,
                    ['--target' as any]: `${(b.score / 9) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-2xl px-5 py-4 shadow-xl tour-slide-up" style={{ animationDelay: '1.2s' }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Overall Band</p>
          <p className="text-3xl md:text-4xl font-black font-mono">7.0</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Status</p>
          <p className="text-sm md:text-base font-black flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Competent
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 6: Vocabulary — word card flipping ─────────────────────────── */
function VocabScene() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-100 p-8 md:p-12 flex flex-col items-center justify-center text-center">
      <div className="tour-slide-up mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-700">Word of the day</p>
      </div>
      <h2 className="font-serif font-black text-zinc-900 text-5xl md:text-7xl tracking-tight mb-2 tour-slide-up" style={{ animationDelay: '0.1s' }}>
        Serendipity
      </h2>
      <p className="text-sm md:text-base font-mono text-zinc-500 mb-6 tour-slide-up" style={{ animationDelay: '0.25s' }}>
        /ˌserənˈdɪpɪti/
      </p>
      <p className="text-base md:text-xl font-serif text-zinc-700 max-w-md leading-relaxed tour-slide-up mb-7" style={{ animationDelay: '0.4s' }}>
        The occurrence of events by chance in a happy or beneficial way.
      </p>
      <div className="flex items-center gap-2 tour-slide-up" style={{ animationDelay: '0.6s' }}>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md">
          <CheckCircle2 className="w-3.5 h-3.5" /> Saved
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold shadow-sm">
          <Volume2 className="w-3.5 h-3.5" /> Listen
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-zinc-700 rounded-xl text-xs font-bold shadow-sm">
          12 Languages
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 7: Teacher Dashboard — class + AI worksheet ────────────────── */
function TeacherScene() {
  return (
    <div className="w-full h-full bg-zinc-900 text-white p-8 md:p-12 flex flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest mb-5 tour-slide-up">
          <GraduationCap className="w-3 h-3" /> Teacher Dashboard
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 tour-slide-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">My Class · 8 students</p>
            <div className="flex items-center -space-x-1.5">
              {['A', 'M', 'J', 'K', 'S', '+3'].map((n, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ring-2 ring-zinc-900 flex items-center justify-center text-[10px] font-black ${
                  i === 5 ? 'bg-zinc-700 text-zinc-300' : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                }`}>{n}</div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 tour-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Smarty Max Seats</p>
            <p className="text-2xl font-black font-mono">5<span className="text-zinc-500 text-lg">/5</span></p>
            <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: '100%', animation: 'tourBarFill 1.2s ease-out 0.5s both', ['--target' as any]: '100%' }} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 border border-white/10 rounded-2xl p-4 backdrop-blur tour-slide-up" style={{ animationDelay: '0.45s' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">AI Worksheet Generated</p>
          </div>
          <p className="text-base font-bold text-white mb-1">"Animals & Habitats — B1 Vocabulary"</p>
          <p className="text-xs text-zinc-400">12 vocab · 6 cloze · 4 comprehension · Assigned to 8 students</p>
        </div>
      </div>
      <div className="flex items-center gap-2 tour-slide-up" style={{ animationDelay: '0.7s' }}>
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold text-emerald-300">Assignment delivered to class roster</span>
      </div>
    </div>
  );
}

/* ─── Scene 8: CTA — start free pricing teaser ─────────────────────────── */
function CTAScene() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 p-8 md:p-12 flex flex-col items-center justify-center text-center text-white">
      <div className="tour-slide-up mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/90 text-[10px] font-bold tracking-[0.3em] uppercase">
          <Crown className="w-3 h-3 text-amber-300" /> Start Today
        </div>
      </div>
      <h2 className="font-serif font-black text-4xl md:text-6xl tracking-tighter leading-[1.05] mb-3 tour-slide-up" style={{ animationDelay: '0.15s' }}>
        Master languages<br />
        <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">at your own pace.</span>
      </h2>
      <p className="text-sm md:text-base text-zinc-400 max-w-md mb-7 tour-slide-up" style={{ animationDelay: '0.3s' }}>
        Free to try. Smarty Max from <span className="font-black text-white">$19.99/mo</span>. Cancel anytime.
      </p>
      <div className="flex items-center gap-3 tour-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="px-7 py-3.5 bg-white text-zinc-900 font-bold tracking-widest uppercase text-sm rounded-full shadow-2xl flex items-center gap-2">
          Start Free <ArrowRight className="w-4 h-4" />
        </div>
        <div className="px-6 py-3.5 bg-transparent border-2 border-white/30 text-white font-bold tracking-widest uppercase text-sm rounded-full">
          See Pricing
        </div>
      </div>
      <div className="mt-8 flex items-center gap-4 text-xs text-zinc-500 tour-slide-up" style={{ animationDelay: '0.7s' }}>
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> No credit card</span>
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> 5 IELTS levels</span>
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> 4k+ practice items</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   STATS STRIP
   ════════════════════════════════════════════════════════════════════════ */
function StatsStrip() {
  const stats = [
    { value: '5',   label: 'IELTS Levels',     Icon: Trophy },
    { value: '4k+', label: 'Practice Items',   Icon: BookOpen },
    { value: '4',   label: 'AI Examiners',     Icon: Sparkles },
    { value: 'Any', label: 'Language Translation', Icon: Languages },
  ];
  return (
    <section className="border-y border-zinc-100 bg-zinc-50 py-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 mx-auto flex items-center justify-center mb-3 shadow-sm">
              <s.Icon className="w-5 h-5 text-zinc-700" />
            </div>
            <div className="text-3xl md:text-4xl font-black font-mono text-zinc-900 leading-none">{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   EXPERIENCE SMARTY — fully interactive demos
   ════════════════════════════════════════════════════════════════════════ */

// Palette: emerald · amber · indigo · rose · zinc — no purple, no blue
const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  indigo:  'bg-indigo-100 text-indigo-700',
  rose:    'bg-rose-100 text-rose-700',
  zinc:    'bg-zinc-100 text-zinc-700',
};

/* ── Tiny shared helpers ───────────────────────────────────────────────── */
const speak = (text: string, rate = 0.9) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.lang = 'en-US';
  window.speechSynthesis.speak(u);
};

/* ── 1. Reading: click any word for a popover translation ──────────────── */
function ReadingMiniDemo() {
  const sentence = 'The sun is shining brightly today. A small cat is sleeping on the green grass.';
  const words = sentence.split(' ');
  const [picked, setPicked] = useState<number | null>(null);
  const [trans, setTrans] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'es' | 'fr' | 'ru'>('es');

  useEffect(() => {
    if (picked === null) return;
    const word = words[picked].replace(/[^a-zA-Z']/g, '');
    setLoading(true);
    setTrans(null);
    let cancelled = false;
    import('../lib/vocabDb')
      .then(async ({ loadVocab, lookupWord, vocabDbEnabled }) => {
        if (vocabDbEnabled()) {
          await loadVocab('en', lang);
          const card = lookupWord(word, { knownLang: lang });
          if (card?.knownWord || card?.definition) return card.knownWord || card.definition;
        }
        const { translateWithCache } = await import('../lib/networkCache');
        return translateWithCache(word, 'en', lang);
      })
      .then((t) => { if (!cancelled) setTrans(t || '—'); })
      .catch(() => { if (!cancelled) setTrans('—'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [picked, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> Tap any word
          </div>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as any)}
            onClick={e => e.stopPropagation()}
            className="text-xs font-bold bg-white border border-emerald-200 text-emerald-700 rounded-lg px-2 py-1 cursor-pointer"
          >
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ru">Russian</option>
          </select>
        </div>
        <p className="text-zinc-800 leading-[1.9] font-serif text-sm md:text-base">
          {words.map((w, i) => (
            <span key={i}>
              <span
                onClick={() => setPicked(i)}
                className={`cursor-pointer rounded px-0.5 transition-colors ${
                  picked === i ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-emerald-200'
                }`}
              >
                {w}
              </span>{' '}
            </span>
          ))}
        </p>
      </div>
      <div className="bg-white border border-emerald-200 rounded-xl p-3 mt-3 min-h-[58px]">
        {picked === null ? (
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Translation appears here</p>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
              {words[picked].replace(/[^a-zA-Z']/g, '')} →{' '}
              {lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'Russian'}
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {loading ? <span className="text-zinc-400">Translating…</span> : trans}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 2. Vocabulary: real Save / Listen / Define interactions ───────────── */
function VocabularyMiniDemo() {
  const word = 'Serendipity';
  const phon = '/ˌserənˈdɪpɪti/';
  const def = 'The occurrence of events by chance in a happy or beneficial way.';
  const [saved, setSaved] = useState(false);
  const [showDef, setShowDef] = useState(true);

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 p-6 flex flex-col justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">Word of the Day</p>
        <h2 className="text-4xl font-serif font-black text-zinc-900 mb-1">{word}</h2>
        <p className="text-xs font-mono text-zinc-400 mb-3">{phon}</p>
        {showDef && (
          <p className="text-sm font-serif text-zinc-700 leading-relaxed animate-in fade-in">{def}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => setSaved(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            saved ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={() => speak(word, 0.75)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50"
        >
          <Volume2 className="w-3.5 h-3.5" /> Listen
        </button>
        <button
          onClick={() => setShowDef(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-amber-50"
        >
          <BookOpen className="w-3.5 h-3.5" /> {showDef ? 'Hide' : 'Define'}
        </button>
      </div>
    </div>
  );
}

/* ── 3. Dictionary: real fetch to dictionaryapi.dev ────────────────────── */
function DictionaryMiniDemo() {
  const [q, setQ] = useState('ephemeral');
  const [data, setData] = useState<any>({
    word: 'ephemeral', phonetic: '/ɪˈfem(ə)r(ə)l/', pos: 'adjective',
    def: 'Lasting for a very short time; transitory in nature.',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const search = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.trim())}`);
      if (!res.ok) throw new Error('Word not found');
      const json = await res.json();
      const first = json[0];
      const meaning = first.meanings?.[0];
      setData({
        word: first.word,
        phonetic: first.phonetic || first.phonetics?.find((p: any) => p.text)?.text || '',
        pos: meaning?.partOfSpeech || '',
        def: meaning?.definitions?.[0]?.definition || '—',
        audio: first.phonetics?.find((p: any) => p.audio)?.audio,
      });
    } catch (e: any) {
      setErr(e.message || 'Lookup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-zinc-50 to-slate-100 border border-zinc-200 p-6 flex flex-col justify-between">
      <div>
        <form
          onSubmit={(e) => { e.preventDefault(); search(q); }}
          className="flex items-center bg-white border border-zinc-200 rounded-xl px-3 py-1.5 mb-4 focus-within:border-zinc-500"
        >
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search a word..."
            className="flex-1 text-sm text-zinc-800 outline-none bg-transparent min-w-0"
          />
          <button type="submit" className="ml-2 px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-black">
            {loading ? '…' : 'Look up'}
          </button>
        </form>
        {err ? (
          <p className="text-sm font-bold text-rose-600">{err}</p>
        ) : (
          <>
            <h2 className="text-2xl font-black text-zinc-900 mb-1">{data.word}</h2>
            {data.phonetic && <p className="text-xs font-mono text-zinc-400 mb-2">{data.phonetic}</p>}
            {data.pos && (
              <span className="inline-flex px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold italic mb-2">
                {data.pos}
              </span>
            )}
            <p className="text-sm font-serif text-zinc-700 leading-relaxed line-clamp-3">{data.def}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => data?.audio ? new Audio(data.audio).play().catch(() => speak(data.word)) : speak(data.word)}
          className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-200"
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Live data · dictionaryapi.dev</span>
      </div>
    </div>
  );
}

/* ── 4. Stories: branching choices that actually advance the story ─────── */
function StoryMiniDemo() {
  const nodes: Record<string, { title: string; body: string; choices?: { label: string; to: string }[] }> = {
    start: {
      title: 'The Forgotten Map',
      body: 'The wind howled as Maya pressed the old map against her chest. Two paths stretched before her — one leading deeper into the misty forest, the other curving toward distant lights...',
      choices: [
        { label: '→ Follow the forest path', to: 'forest' },
        { label: '→ Head toward the lights', to: 'lights' },
      ],
    },
    forest: {
      title: 'The forest path',
      body: 'Pine needles crunched underfoot. Through the mist, she saw a small wooden cabin with smoke curling from its chimney. A faint melody drifted from within...',
      choices: [
        { label: '→ Knock on the door', to: 'end1' },
        { label: '← Turn back', to: 'start' },
      ],
    },
    lights: {
      title: 'The distant lights',
      body: 'The lights belonged to a tiny harbor town she had never seen on any map. A man with weathered eyes waved her over, holding a lantern and an envelope with her name on it.',
      choices: [
        { label: '→ Take the envelope', to: 'end2' },
        { label: '← Turn back', to: 'start' },
      ],
    },
    end1: { title: 'A welcome', body: 'The door opened. An old cartographer smiled. "I have been waiting for you to find this map." — END —' },
    end2: { title: 'A new beginning', body: 'Inside the envelope was a single line: "The next chapter starts when you turn the page." — END —' },
  };
  const [at, setAt] = useState('start');
  const node = nodes[at];

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-rose-50 to-pink-100 border border-rose-200 p-6 flex flex-col justify-between">
      <div className="overflow-y-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5" /> {node.title}
        </div>
        <p className="text-zinc-800 leading-[1.7] font-serif text-sm">{node.body}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-3">
        {node.choices ? node.choices.map(c => (
          <button
            key={c.to}
            onClick={() => setAt(c.to)}
            className="text-left p-2.5 bg-white border border-rose-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-colors text-sm font-medium text-zinc-800"
          >
            {c.label}
          </button>
        )) : (
          <button
            onClick={() => setAt('start')}
            className="text-left p-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors"
          >
            ↻ Read again
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 5. Listening: speak the passage + answer a comprehension question ── */
function ListeningMiniDemo() {
  const passage = 'Climate scientists have observed a steady increase in ocean temperatures over the past decade, with implications for marine ecosystems worldwide.';
  const correct = 'a';
  const options = [
    { id: 'a', label: 'Ocean temperatures rising' },
    { id: 'b', label: 'New marine species discovered' },
    { id: 'c', label: 'Cold weather patterns' },
  ];
  const [pick, setPick] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(passage);
    u.rate = 0.9; u.lang = 'en-US';
    u.onend = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" /> Intermediate
          </div>
          <button
            onClick={play}
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700"
          >
            {playing ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>
        <p className="text-zinc-800 leading-[1.7] font-serif text-sm">{passage}</p>
      </div>
      <div className="bg-white border border-indigo-200 rounded-xl p-3 mt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">What is the main topic?</p>
        <div className="space-y-1.5">
          {options.map(o => {
            const isPicked = pick === o.id;
            const isRight = pick && o.id === correct;
            const isWrong = isPicked && o.id !== correct;
            return (
              <button
                key={o.id}
                onClick={() => setPick(o.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  isWrong ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : isRight ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : isPicked ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-indigo-300'
                }`}
              >
                {o.label} {isRight && '✓'} {isWrong && '✗'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── 6. Dictation: speak a sentence + score typed answer ───────────────── */
function DictationMiniDemo() {
  const sentence = 'The quick brown fox jumps over the lazy dog.';
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const score = (() => {
    if (!submitted) return null;
    const a = sentence.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const b = typed.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    let correct = 0;
    a.forEach((w, i) => { if (b[i] === w) correct++; });
    return { correct, total: a.length, pct: Math.round((correct / a.length) * 100) };
  })();

  return (
    <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider">
            Sentence 1 / 10
          </div>
          <button
            onClick={() => speak(sentence, 0.8)}
            className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md hover:bg-amber-700"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">Press play, then type what you hear</p>
        <textarea
          value={typed}
          onChange={e => { setTyped(e.target.value); setSubmitted(false); }}
          placeholder="Type the sentence..."
          className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm font-serif text-zinc-800 outline-none resize-none focus:border-amber-400"
          rows={2}
        />
      </div>
      <div className="mt-3">
        {submitted && score ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-white border border-amber-200 rounded-xl py-1.5">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Correct</p>
              <p className="text-lg font-black text-zinc-900">{score.correct}</p>
            </div>
            <div className="text-center bg-white border border-amber-200 rounded-xl py-1.5">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Total</p>
              <p className="text-lg font-black text-zinc-900">{score.total}</p>
            </div>
            <div className="text-center bg-white border border-amber-200 rounded-xl py-1.5">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Acc</p>
              <p className={`text-lg font-black ${score.pct >= 80 ? 'text-emerald-600' : score.pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{score.pct}%</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!typed.trim()}
            className="w-full py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check answer
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 7. Locked-feature CTA used for Exercises / Speaking / Writing ─────── */
function GetSmartyMaxCard({
  Icon, accent, gradient, border, title, copy, goToPlans,
}: {
  Icon: any;
  accent: string;
  gradient: string;
  border: string;
  title: string;
  copy: string;
  goToPlans: () => void;
}) {
  return (
    <div className={`aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br ${gradient} border ${border} p-6 flex flex-col items-center justify-center text-center`}>
      <div className={`w-16 h-16 rounded-2xl ${accent} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">Premium Feature</p>
      <h3 className="text-2xl font-serif font-black text-zinc-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-600 max-w-[260px] leading-relaxed mb-5">{copy}</p>
      <button
        onClick={goToPlans}
        className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest shadow-md inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" /> Get Smarty Max
      </button>
    </div>
  );
}

function ExperienceSection({ setActiveTab, setReadingView, goToPlans }: any) {
  const slides = [
    /* ── 1. Reading ──────────────────────────────────────────────────── */
    {
      badge: 'Tap to Translate',
      badgeColor: 'emerald',
      title: 'Reading + Translation',
      description: 'Read at your level — and click any word in any passage for an instant translation into 12+ languages.',
      cta: { label: 'Try Reading Practice', onClick: () => { setActiveTab('reading'); setReadingView('menu'); } },
      Icon: BookOpen,
      iconBg: 'bg-emerald-100 text-emerald-600',
      demo: <ReadingMiniDemo />,
    },

    /* ── 2. Vocabulary ───────────────────────────────────────────────── */
    {
      badge: 'Spaced Repetition',
      badgeColor: 'amber',
      title: 'Smart Vocabulary',
      description: "Click any word anywhere on the site to translate, listen, save, or look it up. Reviews surface automatically when you're about to forget.",
      cta: { label: 'Open Vocabulary', onClick: () => setActiveTab('vocabulary') },
      Icon: Brain,
      iconBg: 'bg-amber-100 text-amber-600',
      demo: <VocabularyMiniDemo />,
    },

    /* ── 3. Exercises (Smarty Max) ───────────────────────────────────── */
    {
      badge: 'Smarty Max',
      badgeColor: 'indigo',
      title: '9 Interactive Exercises',
      description: 'Flashcards, word matching, pronunciation drills, memory match — all auto-generated from your reading history. Compete with yourself daily.',
      cta: { label: 'Get Smarty Max', onClick: goToPlans },
      Icon: Brain,
      iconBg: 'bg-indigo-100 text-indigo-600',
      demo: (
        <GetSmartyMaxCard
          Icon={Brain}
          gradient="from-indigo-50 to-slate-100"
          border="border-indigo-200"
          accent="bg-gradient-to-br from-indigo-600 to-indigo-800"
          title="9 Exercise Types"
          copy="Unlock the full exercise suite — flashcards, pronunciation drills, word matching, and 6 more game modes."
          goToPlans={goToPlans}
        />
      ),
    },

    /* ── 4. Dictionary ───────────────────────────────────────────────── */
    {
      badge: 'Live API',
      badgeColor: 'zinc',
      title: 'Integrated Dictionary',
      description: "Definitions, phonetics, audio, real-world examples — never leave your reading flow to look up a word again.",
      cta: { label: 'Open Vocabulary', onClick: () => setActiveTab('vocabulary') },
      Icon: BookOpen,
      iconBg: 'bg-zinc-100 text-zinc-700',
      demo: <DictionaryMiniDemo />,
    },

    /* ── 5. Stories ──────────────────────────────────────────────────── */
    {
      badge: 'Branching Plot',
      badgeColor: 'rose',
      title: 'Interactive Stories',
      description: 'Read branching narratives where every choice shapes the plot. Click any word for definitions or save it to your vocabulary list as you read.',
      cta: { label: 'Read a Story', onClick: () => setActiveTab('story') },
      Icon: BookOpen,
      iconBg: 'bg-rose-100 text-rose-600',
      demo: <StoryMiniDemo />,
    },

    /* ── 6. Listening ────────────────────────────────────────────────── */
    {
      badge: 'Comprehension',
      badgeColor: 'indigo',
      title: 'Listening Comprehension',
      description: 'Full audio passages with transcripts, comprehension questions, and click-to-translate on every word. Train your ear at every level.',
      cta: { label: 'Try Listening', onClick: () => setActiveTab('listening') },
      Icon: Headphones,
      iconBg: 'bg-indigo-100 text-indigo-600',
      demo: <ListeningMiniDemo />,
    },

    /* ── 7. Dictation ────────────────────────────────────────────────── */
    {
      badge: 'Audio Drills',
      badgeColor: 'amber',
      title: 'Audio Dictation',
      description: 'Listen to sentences and type what you hear. Speed control, sentence repeat, and instant accuracy scoring — the fastest way to sharpen your ear.',
      cta: { label: 'Start Dictation', onClick: () => setActiveTab('listening') },
      Icon: Headphones,
      iconBg: 'bg-amber-100 text-amber-600',
      demo: <DictationMiniDemo />,
    },

    /* ── 8. Writing (Smarty Max) ─────────────────────────────────────── */
    {
      badge: 'Smarty Max',
      badgeColor: 'indigo',
      title: 'Writing Practice + AI Examiner',
      description: 'Hundreds of writing prompts across 5 levels. Save multiple essays per topic, edit anytime, and check with our 4-criteria AI examiner for an IELTS band score.',
      cta: { label: 'Get Smarty Max', onClick: goToPlans },
      Icon: PenLine,
      iconBg: 'bg-indigo-100 text-indigo-600',
      demo: (
        <GetSmartyMaxCard
          Icon={PenLine}
          gradient="from-indigo-50 to-slate-100"
          border="border-indigo-200"
          accent="bg-gradient-to-br from-indigo-600 to-indigo-800"
          title="AI Writing Checker"
          copy="Unlimited writing prompts + 4-criteria IELTS band scoring from an AI examiner."
          goToPlans={goToPlans}
        />
      ),
    },

    /* ── 9. Speaking (Smarty Max) ────────────────────────────────────── */
    {
      badge: 'Smarty Max',
      badgeColor: 'rose',
      title: 'Speaking Practice + AI Examiner',
      description: 'Record yourself answering prompts. Live transcription captures every word, then a 4-criteria AI examiner gives you a full IELTS band breakdown.',
      cta: { label: 'Get Smarty Max', onClick: goToPlans },
      Icon: Mic,
      iconBg: 'bg-rose-100 text-rose-600',
      demo: (
        <GetSmartyMaxCard
          Icon={Mic}
          gradient="from-rose-50 to-pink-100"
          border="border-rose-200"
          accent="bg-gradient-to-br from-rose-500 to-rose-700"
          title="AI Speaking Examiner"
          copy="Unlimited speaking prompts with live transcription + IELTS-style band scoring."
          goToPlans={goToPlans}
        />
      ),
    },
  ];

  const [idx, setIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const total = slides.length;
  const go = (n: number) => setIdx((n + total) % total);

  // Keyboard navigation when the slider is in view.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!hovering) return;
      if (e.key === 'ArrowLeft')  go(idx - 1);
      if (e.key === 'ArrowRight') go(idx + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hovering, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch swipe support for mobile.
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: any) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: any) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? idx + 1 : idx - 1);
    touchStart.current = null;
  };

  return (
    <section id="experience" className="py-20 md:py-28 px-4 bg-gradient-to-b from-zinc-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-zinc-900 tracking-tighter mb-4">
            Experience Smarty
          </h2>
          <p className="text-base md:text-lg text-zinc-500 font-light max-w-2xl mx-auto leading-relaxed">
            Hover, click, swipe — every demo is interactive. No signup, no credit card.
          </p>
        </div>

        {/* Slider */}
        <div
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Track */}
          <div className="overflow-hidden rounded-[2rem]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${idx * 100}%)` }}
            >
              {slides.map((s, i) => (
                <div key={i} className="w-full shrink-0 px-2 md:px-4">
                  <DemoSlide slide={s} isActive={i === idx} />
                </div>
              ))}
            </div>
          </div>

          {/* Arrow controls */}
          <button
            onClick={() => go(idx - 1)}
            aria-label="Previous slide"
            className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 bg-white border border-zinc-200 rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={() => go(idx + 1)}
            aria-label="Next slide"
            className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 bg-white border border-zinc-200 rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

        {/* Minimal dot indicators */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-8 bg-zinc-900' : 'w-1.5 bg-zinc-300 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSlide({ slide }: { slide: any; isActive: boolean }) {
  const Icon = slide.Icon;
  return (
    <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-100 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
        {/* Copy */}
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
          <div className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full ${BADGE_COLORS[slide.badgeColor]} text-[10px] font-bold tracking-[0.2em] uppercase mb-5`}>
            {slide.badge}
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-zinc-900 tracking-tighter mb-4 flex items-center gap-4 flex-wrap">
            <div className={`p-2.5 rounded-2xl ${slide.iconBg}`}><Icon className="w-6 h-6" /></div>
            {slide.title}
          </h3>
          <p className="text-base md:text-lg text-zinc-600 leading-relaxed font-light mb-6">{slide.description}</p>
          <button
            onClick={slide.cta.onClick}
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 hover:gap-3 transition-all"
          >
            {slide.cta.label} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Demo — fully interactive panel */}
        <div className="p-6 md:p-8 lg:p-10 bg-zinc-50 flex items-center justify-center">
          <div className="w-full max-w-md">{slide.demo}</div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AI EXAMINERS — IELTS Writing & Speaking checkers
   ════════════════════════════════════════════════════════════════════════ */
function AIExaminerSection({ setActiveTab }: any) {
  return (
    <section id="ai-examiner" className="py-20 md:py-32 px-4 bg-gradient-to-b from-zinc-50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px] opacity-50 -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px] opacity-50 -z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-zinc-900 tracking-tighter mb-4">
            IELTS-Grade Feedback,<br /><span className="italic text-zinc-500">in seconds.</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-500 font-light max-w-2xl mx-auto leading-relaxed">
            Four parallel AI examiners review your work using the actual IELTS rubric. A fifth synthesizes everything into a final band score.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Writing checker */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center">
                  <PenLine className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Writing</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 mb-2">AI Writing Checker</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">Submit any essay and get a full IELTS band breakdown in seconds.</p>

              <div className="space-y-2 mb-6">
                {['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'].map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-zinc-700">{c}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${65 + i * 5}%` }}></div>
                      </div>
                      <span className="text-xs font-mono font-black text-indigo-700 w-7">{(6 + i * 0.5).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Overall Band</p>
                    <p className="text-3xl font-black font-mono text-indigo-900">7.5</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</p>
                    <p className="text-sm font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Very Good</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('writing')}
                className="w-full py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
              >
                Try Writing Checker
              </button>
            </div>
          </div>

          {/* Speaking checker */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Speaking</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 mb-2">AI Speaking Checker</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">Record your answer, get a live transcript, then a full IELTS band evaluation.</p>

              <div className="space-y-2 mb-6">
                {['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'].map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-zinc-700">{c}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${70 + i * 3}%` }}></div>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-700 w-7">{(6.5 + i * 0.25).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Overall Band</p>
                    <p className="text-3xl font-black font-mono text-emerald-900">7.0</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</p>
                    <p className="text-sm font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Competent</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('speaking')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
              >
                Try Speaking Checker
              </button>
            </div>
          </div>
        </div>

        {/* Process strip */}
        <div className="mt-12 bg-zinc-900 text-white rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-2">How it works</p>
            <h3 className="text-2xl md:text-3xl font-serif font-black tracking-tighter">5 examiners. 1 final score.</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { n: '1', t: 'Submit your essay or recording' },
              { n: '2', t: 'Four AI examiners grade in parallel' },
              { n: '3', t: 'Each returns score + feedback' },
              { n: '4', t: 'A lead examiner synthesizes' },
              { n: '5', t: 'You get a final IELTS band' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white text-zinc-900 font-black font-mono flex items-center justify-center mb-3 shadow-lg">{s.n}</div>
                <p className="text-xs text-zinc-300 leading-relaxed">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FOR TEACHERS & ORGANIZATIONS
   ════════════════════════════════════════════════════════════════════════ */
function TeachersOrgSection({ goToPlans }: { goToPlans: () => void }) {
  return (
    <section id="teachers" className="py-20 md:py-32 px-4 bg-zinc-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.4) 0%, transparent 40%)'
      }}></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tighter mb-4">
            Run your classroom<br /><span className="text-zinc-400 italic">on autopilot.</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
            Assign tasks, monitor progress, grade with AI. Built for solo teachers and entire schools alike.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teachers */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-3">Teachers</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">Take 5 students with you for $99/month. Add more for $12.99 each.</p>

            <ul className="space-y-3 mb-8">
              {[
                '5 student seats included',
                'Additional seats: $12.99 / month each',
                'Assign reading, writing & speaking tasks',
                'See per-student progress and scores',
                'AI examiner included on every submission',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={goToPlans}
              className="w-full py-3.5 rounded-2xl bg-white text-zinc-900 font-bold text-sm uppercase tracking-widest hover:bg-zinc-100 transition-colors"
            >
              View Teacher Plan
            </button>
          </div>

          {/* Organizations */}
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 border border-emerald-400/20 rounded-3xl p-8 shadow-2xl shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white text-emerald-700">Best Value</span>
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-3">Organizations</h3>
              <p className="text-emerald-100 mb-6 leading-relaxed">Schools, academies and language centers. Pay only for the seats you use.</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Just $12.99 / student / month',
                  'Minimum 30 seats',
                  'Invite unlimited staff as teachers',
                  'Organization-wide analytics',
                  'Bulk student onboarding',
                  'Priority enterprise support',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={goToPlans}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-black transition-colors"
              >
                View Organization Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════════════════════════════════ */
function PricingSection({ goToPlans }: { goToPlans: () => void }) {
  return (
    <section id="pricing" className="py-20 md:py-32 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-zinc-900 tracking-tighter mb-4">
            Pick your plan.<br /><span className="italic text-zinc-500">Start learning today.</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-500 font-light max-w-2xl mx-auto leading-relaxed">
            Pay securely through ATMOS. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const isMax     = plan.id === 'smarty-max';
            const isOrg     = plan.id === 'organization';
            const isTeacher = plan.id === 'teacher';
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  isMax
                    ? 'bg-zinc-900 text-white shadow-2xl ring-4 ring-zinc-900/10'
                    : 'bg-white text-zinc-900 border border-zinc-200 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    isMax ? 'bg-white/10' : isTeacher ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    {isMax     ? <Crown       className="w-6 h-6 text-white" /> :
                     isTeacher ? <GraduationCap className="w-6 h-6 text-amber-600" /> :
                                 <Building2   className="w-6 h-6 text-emerald-700" />}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">{plan.name}</h3>
                  <p className={`text-sm ${isMax ? 'text-zinc-400' : 'text-zinc-500'}`}>{plan.description}</p>
                </div>

                <div className="mb-6">
                  {isOrg ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black font-mono">${plan.extraSeatPriceUSD}</span>
                        <span className={`text-sm font-bold ${isMax ? 'text-zinc-500' : 'text-zinc-400'}`}>/seat/mo</span>
                      </div>
                      <p className={`text-xs mt-1 ${isMax ? 'text-zinc-500' : 'text-zinc-400'}`}>Minimum {plan.minSeats} seats</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black font-mono">${plan.basePriceUSD}</span>
                        <span className={`text-sm font-bold ${isMax ? 'text-zinc-500' : 'text-zinc-400'}`}>/month</span>
                      </div>
                      {plan.extraSeatPriceUSD ? (
                        <p className={`text-xs mt-1 ${isMax ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          + ${plan.extraSeatPriceUSD} per extra seat
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.slice(0, 6).map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isMax ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={isMax ? 'text-zinc-200' : 'text-zinc-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={goToPlans}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
                    isMax
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-md'
                      : isTeacher
                      ? 'bg-zinc-900 text-white hover:bg-black shadow-md'
                      : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-md'
                  }`}
                >
                  Subscribe
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <FAQ />
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: 'Can I try before I buy?',
      a: "Absolutely. Every interactive demo on this page is fully working — no signup required. When you're ready, the free tier gives you access to reading practice, vocabulary, and basic listening.",
    },
    {
      q: 'How accurate is the AI examiner?',
      a: 'The AI uses the official IELTS 0-9 band rubric for each criterion. Four independent examiners grade in parallel, then a fifth synthesizes the scores. While it never replaces a human examiner for an official test, students consistently see their AI scores match their real IELTS results within ±0.5.',
    },
    {
      q: 'How does the Teacher plan work?',
      a: "You get 5 student seats included in the $99/month base. Each additional student is $12.99/month. You can assign tasks, monitor progress per student, and see AI-graded submissions in one dashboard.",
    },
    {
      q: 'How is the Organization plan different?',
      a: 'Organizations pay only per seat ($12.99/seat/month, minimum 30). You can invite unlimited staff as teachers — they share your seat pool. Includes organization-wide analytics and bulk student onboarding.',
    },
    {
      q: 'How do I pay?',
      a: 'All payments are processed securely through ATMOS. We accept Uzcard, Humo, and Visa/Mastercard. You can cancel anytime — no questions asked.',
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto mt-24">
      <h3 className="text-2xl md:text-3xl font-serif font-black text-zinc-900 tracking-tighter mb-8 text-center">Frequently asked</h3>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="font-bold text-zinc-900 text-sm pr-4">{f.q}</span>
              <Zap className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open === i ? 'opacity-100' : 'opacity-40'}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="py-12 px-4 bg-zinc-950 text-zinc-400">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
              <span className="font-serif font-black text-zinc-900 text-lg leading-none">S</span>
            </div>
            <div>
              <p className="font-serif font-black tracking-tighter uppercase text-lg text-white">SMARTY ENGLISH</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">© {new Date().getFullYear()} — All rights reserved</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#ai-examiner" className="hover:text-white transition-colors">AI</a>
            <a href="#teachers" className="hover:text-white transition-colors">Teachers</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/mribroxim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] hover:bg-[#1a8bc1] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <TelegramIcon className="w-4 h-4" />
              Contact on Telegram
            </a>
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Secured by ATMOS</span>
            </div>
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
