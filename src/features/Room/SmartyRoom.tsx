import { completionsOfType } from '../../lib/completions';
import { DialogSurface } from '../../components/DialogSurface';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Coins, Crown, Flame, Heart, Keyboard, MessageCircleMore, Mic, Send, Trophy, X, Zap } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import type { UiStringKey } from '../../lib/uiStrings';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { LeagueTrophy } from '../../components/LeagueTrophy';
import { HistorySheet } from '../Home/HistorySheet';
import { noteTalkedToSmarty } from '../Quests/dailyQuests';
import { SLOT_CATEGORY, buyItem, itemById, itemsFor, placeItem, useRoom, type Slot } from '../../lib/smarty/room';
import { activeBoost, buyFood, feedSmarty, foodCount, smartyLevel, usePantry, FRIDGE_MAX_EACH } from '../../lib/smarty/pantry';
import { FOODS, foodById } from '../../lib/smarty/food';
import { RewardBox, type Reward } from '../../components/RewardPopup';
import { useHearts } from '../../lib/hearts/heartsStore';
import { normalizeHabit, todayKey, visibleStreak } from '../../lib/habitEngine';
import { smartyTalk, type SmartyMood } from '../../lib/aiExaminer';
import { practisingWords } from '../../lib/workshop/store';
import { speakText } from '../../lib/speech';
import { playSound } from '../../lib/audio';
import { getPrefs } from '../../lib/smarty/prefs';
import { useVosk } from '../../hooks/useVosk';

/** Smarty sitting calmly (a still frame, no idle animation). */
const BASE: StickerId = 'mood.hi-there';
const MOOD: Record<SmartyMood, StickerId> = {
  happy: 'mood.yay', laugh: 'pers.excited', curious: 'pers.curious', love: 'mood.smitten',
  surprised: 'mood.gasp', sleepy: BASE, sad: 'mood.teary', proud: 'pers.confident',
};


// ── layout ──────────────────────────────────────────────────────────────
// The wall/floor seam of public/room/background.webp sits 63.8% down; the
// background is drawn "cover" and pinned there, so the floor line is always at
// 63.8% of the room's height. Pieces are placed against that: cx = centre (%
// of width), by = bottom edge (% of height), and a size in cqh (h) or cqw (w).
type Spot = { cx: number; by: number; h?: number; w?: number; z: number };
type Layout = Record<Slot | 'plaque' | 'xp' | 'history' | 'settings' | 'cat', Spot> & { talk: { top: number; w: number; h: number }; ref: number };

const PORTRAIT: Layout = {
  window: { cx: 83, by: 41, h: 23, z: 1 },
  shelf1: { cx: 19, by: 27, w: 35, z: 1 },
  shelf2: { cx: 21, by: 39, w: 34, z: 1 },
  plaque: { cx: 50, by: 24.5, w: 27, z: 3 },
  xp: { cx: 50, by: 33.5, w: 31, z: 3 },
  history: { cx: 43, by: 41.5, w: 11.5, z: 3 },
  settings: { cx: 57, by: 41.5, w: 11.5, z: 3 },
  bed: { cx: 10, by: 71, h: 17, z: 2 },
  fridge: { cx: 33, by: 70, h: 12.5, z: 3 },
  desk: { cx: 89, by: 67.5, h: 17, z: 2 },
  chair: { cx: 86, by: 69.5, h: 12, z: 3 },
  rug: { cx: 59, by: 77, w: 50, z: 2 },
  cat: { cx: 59, by: 75.5, w: 37, z: 4 },
  talk: { top: 82.5, w: 78, h: 7.5 },
  // Width ÷ height of the phone room this layout was drawn on.
  ref: 0.545,
};
const LANDSCAPE: Layout = {
  window: { cx: 77, by: 47, h: 33, z: 1 },
  shelf1: { cx: 22, by: 28, h: 14, z: 1 },
  shelf2: { cx: 24, by: 45, h: 12, z: 1 },
  plaque: { cx: 50, by: 23, h: 15, z: 3 },
  xp: { cx: 50, by: 34, h: 10, z: 3 },
  history: { cx: 44.5, by: 46, h: 9, z: 3 },
  settings: { cx: 55.5, by: 46, h: 9, z: 3 },
  bed: { cx: 13, by: 79, h: 32, z: 2 },
  fridge: { cx: 30, by: 77, h: 21, z: 3 },
  desk: { cx: 87, by: 74, h: 28, z: 2 },
  chair: { cx: 80, by: 80, h: 17, z: 3 },
  rug: { cx: 52, by: 86, h: 15, z: 2 },
  cat: { cx: 52, by: 84, h: 30, z: 4 },
  talk: { top: 87.5, w: 36, h: 7.5 },
  ref: 1.35,
};

/**
 * Sizes scale with the room's smaller side relative to the reference shape, so
 * on a wider or a shorter screen every piece shrinks together instead of the
 * width-sized ones crowding the height-sized ones.
 */
const fitW = (w: number, ref: number) => `min(${w}cqw, ${(w * ref).toFixed(2)}cqh)`;
const fitH = (h: number, ref: number) => `min(${h}cqh, ${(h / ref).toFixed(2)}cqw)`;
const sizeOf = (s: Spot, ref: number): CSSProperties => (s.w ? { width: fitW(s.w, ref), height: 'auto' } : { height: fitH(s.h ?? 10, ref), width: 'auto' });
const spotStyle = (s: Spot, ref: number): CSSProperties => ({
  left: `${s.cx}%`, top: `${s.by}%`, transform: 'translate(-50%, -100%)', zIndex: s.z,
  ...(s.w ? { width: fitW(s.w, ref) } : { height: fitH(s.h ?? 10, ref) }),
});

type Sheet = null | 'stats' | 'history' | 'fridge' | { slot: Slot };
type Talk = 'idle' | 'listening' | 'thinking' | 'speaking';
type Say = { id: number; text: string; tip?: string };

/**
 * Talking Smarty's room (Home on desktop, Profile on phones). Every piece of
 * furniture can be tapped to swap it from its own shop; the sign shows hearts,
 * the board shows level and XP, and Smarty sits calmly on his rug: tap or
 * stroke him, feed him from his mini-fridge, or (with Smarty Max) talk to him.
 */
const GREETINGS: Partial<Record<string, string>> = {
  en: 'Hello', es: '¡Hola', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', pt: 'Olá', zh: '你好', ja: 'こんにちは',
  ko: '안녕하세요', ru: 'Привет', ar: 'مرحبًا', uz: 'Salom', tr: 'Merhaba', hi: 'नमस्ते', uk: 'Привіт',
  nl: 'Hallo', pl: 'Cześć', sv: 'Hej', id: 'Halo', vi: 'Xin chào', th: 'สวัสดี', fa: 'سلام',
  ur: 'سلام', ro: 'Salut', el: 'Γεια σου', tl: 'Kumusta', ms: 'Hai', cs: 'Ahoj', sw: 'Habari',
};

export function SmartyRoom({ xp, league, canTalk, greetOnOpen, showIelts, onMealEaten, onOpenSettings, onOpenPlans }: {
  xp: number;
  league: string;
  canTalk: boolean;
  greetOnOpen?: boolean;
  showIelts: boolean;
  onMealEaten: (xp: number) => void;
  onOpenSettings: () => void;
  onOpenPlans: () => void;
}) {
  const { t, uiLang } = useUiLang();
  const { userProfile, habit, level, accountProfile, savedVocab, unlimitedHearts } = useProgress();
  const { contentLang, speechLocale } = useContentLang();
  const room = useRoom();
  const pantry = usePantry();
  const hearts = useHearts();
  const reduced = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [say, setSay] = useState<Say | null>(null);
  const [sticker, setSticker] = useState<StickerId>(BASE);
  const [eating, setEating] = useState(false);
  const [flying, setFlying] = useState<{ dx: number; dy: number; src: string } | null>(null);
  const [lucky, setLucky] = useState<Reward | null>(null);
  const [pets, setPets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [talk, setTalk] = useState<Talk>('idle');
  const [heard, setHeard] = useState('');
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [wide, setWide] = useState(false);
  const history = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const ids = useRef(1);
  const timers = useRef<number[]>([]);
  const pokes = useRef({ n: 0, at: 0 });
  const pet = useRef({ x: 0, y: 0, acc: 0, on: false });
  const outer = useRef<HTMLDivElement>(null);
  const cat = useRef<HTMLDivElement>(null);
  const mouth = useRef<HTMLDivElement>(null);
  const fridge = useRef<HTMLButtonElement>(null);
  const abort = useRef<AbortController | null>(null);
  const { startRecognition, stopRecognition, isReady: micReady } = useVosk(speechLocale);

  // Portrait phones and wide screens get different furniture layouts.
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const fit = () => { const r = el.getBoundingClientRect(); setWide(r.width / Math.max(1, r.height) >= 0.9); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const L = wide ? LANDSCAPE : PORTRAIT;

  // Smarty is always awake and calm in his room (no sleeping, hunger or mood meters).
  const base: StickerId = BASE;
  const baseRef = useRef(base);

  useEffect(() => () => { timers.current.forEach(clearTimeout); abort.current?.abort(); stopRecognition(); }, [stopRecognition]);

  // Now and then (first visit of the day, then about one visit in three) Smarty comments on the streak.
  useEffect(() => {
    if (greetOnOpen) return;
    const h = normalizeHabit(habit);
    const n = visibleStreak(h);
    const practisedToday = (h.dailyGoal.xpEarned || 0) > 0;
    const day = todayKey();
    let seen: { day: string; n: number } = { day: '', n: 0 };
    try { seen = JSON.parse(sessionStorage.getItem('smarty_streak_note') || localStorage.getItem('smarty_streak_note') || '{}') || seen; } catch { /* first visit */ }
    const visits = seen.day === day ? seen.n : 0;
    try { localStorage.setItem('smarty_streak_note', JSON.stringify({ day, n: visits + 1 })); } catch { /* ignore */ }
    if (visits > 0 && Math.random() > 0.33) return;
    const id = window.setTimeout(() => {
      if (n === 0) react('pers.curious', t('room.streak.none'), 3200);
      else if (!practisedToday) react('state.wake-up', t('room.streak.atRisk', { n }), 3600);
      else if (n >= 7) react('streak.streak-growing', t('room.streak.hot', { n }), 3600);
      else react('mood.yay', t('room.streak.warm', { n }), 3200);
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const haptic = (p: number | number[]) => { if (getPrefs().haptics && 'vibrate' in navigator) navigator.vibrate?.(p); };

  /** Show a reaction for a moment, then settle back to sitting. */
  const react = (s: StickerId, text: string, ms = 1800, tip?: string, keepWords = false) => {
    const id = ids.current++;
    setSticker(s);
    setSay({ id, text, tip });
    later(ms, () => {
      if (!keepWords) setSay((cur) => (cur?.id === id ? null : cur));
      setSticker((cur) => (cur === s ? baseRef.current : cur));
    });
  };

  useEffect(() => {
    if (!greetOnOpen) return;
    const name = accountProfile?.displayName?.trim().split(/\s+/)[0];
    const greeting = `${GREETINGS[contentLang] || GREETINGS.en}${name ? `, ${name}` : ''}!`;
    react('mood.hi-there', greeting, 3500, undefined, true);
    speakText(greeting, 1, speechLocale);
  }, [greetOnOpen, contentLang, speechLocale, accountProfile?.displayName]);

  // ── touch: head = shy, tummy = giggle, too many pokes = grumpy ──
  const onTap = (e: React.MouseEvent) => {
    if (eating || talk !== 'idle' || pet.current.on) return;
    const r = cat.current?.getBoundingClientRect();
    const y = r ? (e.clientY - r.top) / r.height : 0.5;
    const now = Date.now();
    pokes.current = now - pokes.current.at < 2000 ? { n: pokes.current.n + 1, at: now } : { n: 1, at: now };
    const n = pokes.current.n;
    playSound('meow', { mascot: false });
    haptic(12);
    if (n >= 7) { pokes.current = { n: 0, at: 0 }; return react('egg.secret-meow', t('room.poke.secret'), 2600); }
    if (n >= 4) return react('mood.grumpy', t('room.poke.grumpy'), 1800);
    if (y < 0.45) return react('pers.shy', t('room.poke.head'), 1600);
    react('pers.excited', t('room.poke.tummy'), 1600);
  };

  // ── stroke: moving a pressed finger over him makes hearts ──
  const onPetMove = (e: React.PointerEvent) => {
    if (eating || e.buttons !== 1) return;
    const p = pet.current;
    if (p.x || p.y) p.acc += Math.hypot(e.clientX - p.x, e.clientY - p.y);
    p.x = e.clientX; p.y = e.clientY;
    if (p.acc > 70 && !p.on) { p.on = true; setSticker('mood.smitten'); setSay({ id: ids.current++, text: t('room.pet.purr') }); }
    if (p.on && p.acc > 110) {
      p.acc = 0;
      const r = cat.current?.getBoundingClientRect();
      if (r) setPets((l) => [...l.slice(-8), { id: ids.current++, x: e.clientX - r.left, y: e.clientY - r.top }]);
      haptic(8);
    }
  };
  const endPet = () => {
    const was = pet.current.on;
    pet.current = { x: 0, y: 0, acc: 0, on: false };
    if (was) react('mood.smitten', t('room.pet.done'), 1500);
  };

  // ── feeding: a snack from the fridge flies to Smarty ──
  const eat = (id: string) => {
    const before = smartyLevel(pantry.eaten).level;
    const fed = feedSmarty(id);
    if (!fed) return;
    setEating(true);
    setSticker('reward.snack-time');
    setSay({ id: ids.current++, text: t('kitchen.say.eating') });
    playSound('success', { mascot: false });
    haptic([20, 40, 20, 40, 20]);
    onMealEaten(fed.xp);
    later(reduced ? 600 : 1900, () => { setFlying(null); playSound('meow', { mascot: false }); });
    later(reduced ? 900 : 2200, () => {
      setEating(false);
      react('mood.smitten', t('kitchen.say.happy'), 1800);
      const after = smartyLevel(pantry.eaten + 1).level;
      if (after > before) { setLevelUp(after); playSound('level-up', { mascot: false }); }
      // Some snacks are lucky: a boost popup.
      if (fed.boost) setLucky({ xp: fed.xp, boost: { kind: fed.boost.kind, mult: fed.boost.mult } });
    });
  };
  const feedFood = (id: string) => {
    if (eating || !pantry.foods[id]) return;
    setSheet(null);
    const f = fridge.current?.getBoundingClientRect();
    const m = mouth.current?.getBoundingClientRect();
    const src = foodById(id)?.src ?? '';
    setFlying(f && m ? { dx: m.left + m.width / 2 - (f.left + f.width / 2), dy: m.top + m.height / 2 - (f.top + f.height * 0.4), src } : { dx: 120, dy: -60, src });
    setSticker('mood.gasp');
    later(reduced ? 30 : 700, () => eat(id));
  };

  // ── talking ──
  const ask = async (utterance: string) => {
    const text = utterance.trim();
    if (!text) { setTalk('idle'); return; }
    setHeard(text);
    setTalk('thinking');
    setSticker('mood.hmm');
    setSay({ id: ids.current++, text: '…' });
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    try {
      const name = accountProfile?.displayName?.trim().split(/\s+/)[0] || undefined;
      const r = await smartyTalk({ utterance: text, history: history.current.slice(-8), contentLang, uiLang, level, name, knownWords: practisingWords(contentLang) }, ac.signal);
      if (r.safeFallback) r.reply = t('safety.ai.fallback');
      history.current.push({ role: 'user', content: text }, { role: 'assistant', content: r.reply });
      noteTalkedToSmarty();
      setTalk('speaking');
      const ms = Math.max(3500, Math.min(12000, r.reply.length * 90));
      speakText(r.reply, 1, speechLocale);
      // Smarty only meows when his line actually has a cat sound in it (the teacher prompt keeps that rare).
      if (/m+[ie]+a*o*w|miau|miaou|мяу|ニャ|喵|nyan|purr/i.test(r.reply)) later(250, () => playSound('meow', { mascot: false }));
      react(MOOD[r.mood] ?? 'mood.yay', r.reply, ms, r.tip || undefined, true);
      later(ms, () => setTalk((cur) => (cur === 'speaking' ? 'idle' : cur)));
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setTalk('idle');
      react('mood.dizzy', t('room.talk.error'), 2600);
    }
  };

  const startListening = async () => {
    if (talk === 'listening') { stopRecognition(); setTalk('idle'); setSticker(baseRef.current); setSay(null); return; }
    if (talk !== 'idle' || eating) return;
    if (!canTalk) {
      playSound('meow', { mascot: false });
      return react('pers.curious', t('room.talk.meow'), 2400);
    }
    if (!micReady) { setTyping(true); return; }
    setHeard('');
    setTalk('listening');
    setSticker('listen.ear-twitch');
    setSay({ id: ids.current++, text: t('room.talk.listening') });
    let done = false;
    const finish = (txt: string) => { if (done) return; done = true; stopRecognition(); void ask(txt); };
    try {
      await startRecognition(finish, (partial) => setHeard(partial), false, () => { if (!done) { done = true; stopRecognition(); setTalk('idle'); react('mood.dizzy', t('room.talk.micError'), 2400); } });
      later(9000, () => { if (!done) { done = true; stopRecognition(); setTalk('idle'); setSticker(baseRef.current); setSay(null); } });
    } catch {
      setTalk('idle');
      setTyping(true);
    }
  };
  const sendTyped = () => { if (!canTalk || !draft.trim() || talk === 'thinking') return; const d = draft; setDraft(''); void ask(d); };

  const streak = visibleStreak(normalizeHabit(habit));

  /** A tappable piece of furniture that opens its shop. */
  const piece = (slot: Slot) => {
    const item = itemById(room[slot]);
    if (!item) return null;
    const s = L[slot];
    return (
      <button key={slot} type="button" onClick={() => setSheet({ slot })} aria-label={t('room.change', { thing: t(`room.one.${SLOT_CATEGORY[slot]}` as UiStringKey) })}
        className="absolute transition-transform duration-150 hover:scale-[1.03] active:scale-95" style={spotStyle(s, L.ref)}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img key={item.id} src={item.src} alt="" draggable={false} className="block max-w-none select-none"
            style={sizeOf(s, L.ref)}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }} />
        </AnimatePresence>
      </button>
    );
  };
  const sized = (s: Spot): CSSProperties => sizeOf(s, L.ref);
  const hudImg = (name: string, s: Spot) => <img src={`/room/hud/${name}.webp`} alt="" draggable={false} className="block max-w-none select-none" style={sized(s)} />;
  // Text on the sign/board scales with them: their width in px-independent units.
  const signFont = (frac: number, s: Spot) => (s.w ? fitW(s.w * frac, L.ref) : fitH((s.h ?? 10) * frac * 2.2, L.ref));

  const catSpot = L.cat;
  return (
    <div ref={outer} className="light-zone relative h-[calc(100dvh-123px-env(safe-area-inset-bottom))] min-h-[400px] overflow-hidden bg-[#efeff1] lg:h-dvh" style={{ containerType: 'size' }}>
      <img src="/room/background.webp" alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: '50% 63.8%' }} />

      {(['window', 'shelf1', 'shelf2', 'bed', 'desk', 'rug', 'chair'] as Slot[]).map(piece)}

      {/* sign: hearts */}
      <button type="button" onClick={() => setSheet('stats')} aria-label={unlimitedHearts ? t('hearts.unlimited') : t('hearts.count', { n: hearts.count })}
        className="absolute transition-transform active:scale-95" style={spotStyle(L.plaque, L.ref)}>
        {hudImg('plaque', L.plaque)}
        <span className="absolute inset-x-0 flex items-center justify-center gap-[0.3em] font-serif font-extrabold leading-none text-zinc-900" style={{ top: '67%', transform: 'translateY(-50%)', fontSize: signFont(0.2, L.plaque) }}>
          <Heart className="fill-red-600 text-red-600" style={{ width: '0.95em', height: '0.95em' }} />{unlimitedHearts ? '∞' : hearts.count}
        </span>
      </button>
      {/* board: streak. Grey flame until you practise today, orange while it grows, red-hot from 7 days. */}
      <button type="button" onClick={() => setSheet('stats')} aria-label={t('room.streak.label', { n: streak })} className="absolute transition-transform active:scale-[0.97]" style={spotStyle(L.xp, L.ref)}>
        {hudImg('xp', L.xp)}
        <span className="absolute inset-x-[8%] inset-y-[12%] flex items-center justify-center gap-[0.35em] whitespace-nowrap font-serif font-extrabold leading-none text-zinc-900" style={{ fontSize: signFont(0.092, L.xp) }}>
          <img src={`/room/fire/${streak === 0 || (normalizeHabit(habit).dailyGoal.xpEarned || 0) === 0 ? 'cold' : streak >= 7 ? 'hot' : 'warm'}.webp`} alt="" className="h-[1.6em] w-auto" draggable={false} />
          {t('room.streak.days', { n: streak })}
        </span>
      </button>
      <button type="button" onClick={() => setSheet('history')} aria-label={t('home.historyTitle')} className="absolute transition-transform hover:scale-105 active:scale-90" style={spotStyle(L.history, L.ref)}>
        {hudImg('history', L.history)}
      </button>
      <button type="button" onClick={onOpenSettings} aria-label={t('room.settings')} className="absolute transition-transform hover:scale-105 active:scale-90" style={spotStyle(L.settings, L.ref)}>
        {hudImg('settings', L.settings)}
      </button>

      {/* Smarty on the rug */}
      <div ref={cat} className="absolute touch-none select-none transition-[left,top,width,height] duration-700 ease-out" style={spotStyle(catSpot, L.ref)}
        onPointerMove={onPetMove} onPointerUp={endPet} onPointerLeave={endPet} onPointerCancel={endPet}>
        <div className="pointer-events-none absolute bottom-[88%] left-1/2 flex w-[200%] max-w-[90cqw] -translate-x-1/2 justify-center" style={{ zIndex: 6 }}>
          <AnimatePresence mode="popLayout">
            {say && (
              <motion.div key={say.id} initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }} role="status" aria-live="polite"
                className="relative max-w-[340px] rounded-2xl border-2 border-zinc-900 bg-white px-3.5 py-2 text-center text-sm font-extrabold text-zinc-900 shadow-[0_3px_0_0_#18181b]">
                {say.text}
                {say.tip && <span className="mt-1 block text-[11px] font-semibold text-slate-500">{say.tip}</span>}
                <span aria-hidden className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-zinc-900 bg-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button type="button" onClick={onTap} aria-label={t('kitchen.tapSmarty')} className="relative block aspect-square rounded-full focus-visible:outline-none" style={sized(catSpot)}>
          {/* talking: the mood face keeps playing and he bobs gently while the line is spoken */}
          <motion.div className="h-full w-full" style={{ transformOrigin: '50% 100%' }}
            animate={talk === 'speaking' && !reduced ? { y: [0, -5, 0, -3, 0], scaleY: [1, 1.03, 0.99, 1.02, 1] } : talk === 'thinking' && !reduced ? { rotate: [-2, 2, -2] } : { y: 0, rotate: 0, scaleY: 1 }}
            transition={talk === 'speaking' ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : talk === 'thinking' ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}>
            <Sticker key={sticker} id={sticker} size="100%" priority="hero" mode={sticker === BASE ? 'still' : talk === 'speaking' || talk === 'thinking' || talk === 'listening' ? 'auto' : 'once'} />
          </motion.div>
        </button>
        <div ref={mouth} aria-hidden className="pointer-events-none absolute left-[46%] top-[52%] h-4 w-4" />
        <AnimatePresence>
          {pets.map((p) => (
            <motion.span key={p.id} aria-hidden className="pointer-events-none absolute text-red-500" style={{ left: p.x - 12, top: p.y - 12 }}
              initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 1], y: -70 }} transition={{ duration: 1.1 }}
              onAnimationComplete={() => setPets((l) => l.filter((x) => x.id !== p.id))}>
              <Heart className="h-6 w-6 fill-current" />
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* mini-fridge → snacks for Smarty */}
      <button type="button" ref={fridge} onClick={() => setSheet('fridge')} aria-label={t('fridge.label')} className="absolute transition-transform hover:scale-[1.03] active:scale-95" style={spotStyle(L.fridge, L.ref)}>
        <img src={itemById(room.fridge)?.src} alt="" draggable={false} className="block max-w-none select-none" style={sized(L.fridge)} />
        <AnimatePresence>
          {flying && (
            <motion.img key="snack" src={flying.src} alt="" className="pointer-events-none absolute left-[20%] top-[20%] w-[60%]"
              initial={{ x: 0, y: 0, scale: 1 }} animate={{ x: flying.dx, y: flying.dy, scale: 0.6, rotate: 20 }} exit={{ opacity: 0 }} transition={{ duration: 0.65, ease: [0.3, 0, 0.3, 1] }} />
          )}
        </AnimatePresence>
      </button>
      <BoostChip />

      {/* what Smarty heard / typed message */}
      <AnimatePresence>
        {heard && talk !== 'idle' && !typing && (
          <motion.p key="heard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute left-1/2 z-[7] max-w-[80%] -translate-x-1/2 truncate rounded-full bg-zinc-900/85 px-3 py-1 text-xs font-bold text-white" style={{ top: `${L.talk.top - 5}%` }}>“{heard}”</motion.p>
        )}
        {typing && canTalk && (
          <motion.form key="type" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            onSubmit={(e) => { e.preventDefault(); sendTyped(); }}
            className="absolute left-1/2 z-20 flex w-[min(92cqw,520px)] -translate-x-1/2 gap-2 rounded-2xl border-2 border-zinc-900 bg-white p-1.5 shadow-[0_3px_0_0_#18181b]" style={{ top: `${L.talk.top - 9}%` }}>
            <input aria-label={t('room.talk.placeholder')} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('room.talk.placeholder')} maxLength={240}
              className="min-w-0 flex-1 bg-transparent px-2 text-base font-semibold text-zinc-900 outline-none" />
            <button type="submit" disabled={!draft.trim() || talk === 'thinking'} aria-label={t('room.talk.send')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
            <button type="button" onClick={() => setTyping(false)} aria-label={t('a11y.close')} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500"><X className="h-4 w-4" /></button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Talk to Smarty */}
      <div className="absolute left-1/2 z-[8] flex -translate-x-1/2 flex-col items-center" style={{ top: `${L.talk.top}%`, width: `min(${L.talk.w}cqw, 520px)` }}>
        <motion.button type="button" onClick={startListening} aria-label={canTalk ? t('room.talk.button') : t('room.talk.meowLabel')}
          animate={talk === 'listening' && !reduced ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: talk === 'listening' ? Infinity : 0 }}
          className={`flex w-full items-center justify-center gap-3 rounded-full font-serif font-extrabold text-white shadow-[0_5px_0_0_#000,0_14px_24px_-8px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-75 active:translate-y-[5px] active:shadow-none ${talk === 'listening' ? 'bg-rose-500' : 'bg-zinc-900'}`}
          style={{ height: `clamp(48px, ${L.talk.h}cqh, 68px)`, fontSize: 'clamp(16px, 2.6cqh, 22px)' }}>
          {talk === 'thinking'
            ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-[3px] border-current border-t-transparent" />
            : talk === 'listening' ? <Mic className="h-7 w-7" /> : <MessageCircleMore className="h-7 w-7" strokeWidth={2.2} />}
          {talk === 'listening' ? t('room.talk.listening') : t('room.talk.button')}
          {!canTalk && <Crown className="h-5 w-5 text-amber-400" />}
        </motion.button>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {canTalk ? (
            talk === 'idle' && !typing && (
              <button type="button" onClick={() => setTyping(true)} className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:underline">
                <Keyboard className="h-3.5 w-3.5" />{t('room.talk.type')}
              </button>
            )
          ) : (
            <button type="button" onClick={onOpenPlans} className="flex items-center gap-1.5 font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-900 hover:underline">
              <Crown className="h-3.5 w-3.5 text-amber-500" />{t('room.talk.unlock')}
            </button>
          )}
        </div>
      </div>

      {/* ── sheets ── */}
      <AnimatePresence>
        {sheet === 'stats' && (
          <RoomSheet key="stats" title={t('room.stats')} sticker="achieve.trophy-lift" onClose={() => setSheet(null)}>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={<BookOpen className="h-6 w-6" />} value={completionsOfType('lesson-bite').filter(entry => entry.contentLang === contentLang).length} label={t('update.sessions')} />
              <Stat icon={<Heart className="h-6 w-6 fill-red-600 text-red-600" />} value={unlimitedHearts ? '∞' : hearts.count} label={t('room.stat.hearts')} />
              <Stat icon={<Zap className="h-6 w-6 fill-current" />} value={xp} label={t('profile.stat.xp')} />
              <Stat icon={<Flame className="h-6 w-6 text-orange-500" />} value={streak} label={t('profile.stat.streak')} />
              <Stat icon={<LeagueTrophy id={league} size={30} />} value={league} label={t('profile.stat.league')} />
              <Stat icon={<BookOpen className="h-6 w-6" />} value={Object.keys(savedVocab || {}).length} label={t('room.stat.words')} />
              <Stat icon={<Trophy className="h-6 w-6 text-amber-500" />} value={normalizeHabit(habit).badges?.length ?? 0} label={t('room.stat.badges')} />
              <Stat icon={<Coins className="h-6 w-6 text-amber-500" />} value={userProfile.coins} label={t('room.coins')} />
            </div>
          </RoomSheet>
        )}
        {sheet && typeof sheet === 'object' && <Shop key={sheet.slot} slot={sheet.slot} onClose={() => setSheet(null)} />}
        {sheet === 'fridge' && <Fridge key="fridge" onFeed={feedFood} onChange={() => setSheet({ slot: 'fridge' })} onClose={() => setSheet(null)} />}
      </AnimatePresence>
      {sheet === 'history' && <HistorySheet onClose={() => setSheet(null)} showIelts={showIelts} />}

      <AnimatePresence>{lucky && <RewardBox title={t('rewards.lucky')} reward={lucky} onDone={() => setLucky(null)} z={95} />}</AnimatePresence>


      {/* ── level up ── */}
      <AnimatePresence>
        {levelUp && (
          <DialogSurface asComponent={motion.div} onClose={() => setLevelUp(null)} className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-900/60 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLevelUp(null)}>
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="w-full max-w-xs rounded-3xl border-2 border-zinc-900 bg-white p-6 text-center shadow-[0_6px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900">
              <Sticker id="achieve.level-up" size={150} priority="hero" mode="once" />
              <p className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('kitchen.levelUp.title')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t('kitchen.levelUp.body', { n: levelUp, title: t(`kitchen.levelTitle.${smartyLevel(pantry.eaten).title}` as UiStringKey) })}</p>
            </motion.div>
          </DialogSurface>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-900 dark:text-zinc-50">{icon}</span>
      <div className="min-w-0">
        <div className="truncate font-serif text-lg font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">{value}</div>
        <div className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function RoomSheet({ title, sticker, onClose, children, peek = false, right }: { title: string; sticker?: StickerId; onClose: () => void; children: ReactNode; /** Short, lightly dimmed: the room stays visible above it. */ peek?: boolean; right?: ReactNode }) {
  const { t } = useUiLang();
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <DialogSurface role="presentation" aria-modal={undefined} asComponent={motion.div} onClose={onClose} className={`fixed inset-0 z-[85] flex items-end justify-center ${peek ? 'bg-zinc-900/10' : 'bg-zinc-900/40 sm:items-center sm:p-4'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={`flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-2 border-zinc-900 bg-white shadow-[0_-4px_0_0_rgba(24,24,27,0.08)] dark:border-zinc-100 dark:bg-zinc-900 ${peek ? 'max-h-[52dvh] border-b-0 sm:max-h-[60dvh]' : 'max-h-[72dvh] sm:rounded-3xl'}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-zinc-700 sm:hidden" />
        <div className="flex items-center gap-3 px-5 pb-3 pt-2">
          {sticker && <Sticker id={sticker} size={44} mode="once" />}
          <h2 className="flex-1 font-serif text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
          {right}
          <button type="button" onClick={onClose} aria-label={t('a11y.close')} className="rounded-xl border-2 border-slate-200 p-2 text-slate-500 dark:border-zinc-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1">{children}</div>
      </motion.div>
    </DialogSurface>
  );
}

/** Shop for one spot in the room: every bed (or desk, rug…) to pick from. */
function Shop({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const { t } = useUiLang();
  const { userProfile, spendCoins } = useProgress();
  const room = useRoom();
  const category = SLOT_CATEGORY[slot];
  const [note, setNote] = useState<{ id: number; text: string } | null>(null);
  const [popped, setPopped] = useState<string | null>(null);

  const choose = (id: string) => {
    const item = itemById(id)!;
    if (room.owned.includes(id)) {
      if (room[slot] !== id) { placeItem(slot, id); playSound('success', { mascot: false }); }
      return;
    }
    if (userProfile.coins < item.price) { setNote({ id: Date.now(), text: t('room.shop.needCoins') }); playSound('fail', { mascot: false }); return; }
    if (buyItem(slot, id, spendCoins)) { setPopped(id); playSound('purchase', { mascot: false }); window.setTimeout(() => playSound('sparkle', { mascot: false }), 260); setNote({ id: Date.now(), text: t('room.shop.bought') }); }
  };

  return (
    <RoomSheet title={t(`room.cat.${category}` as UiStringKey)} onClose={onClose} peek
      right={<span className="flex items-center gap-1 rounded-2xl border-2 border-slate-200 px-2.5 py-1.5 font-serif text-sm font-extrabold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"><Coins className="h-4 w-4 text-amber-500" />{userProfile.coins}</span>}>
      <AnimatePresence>
        {note && (
          <motion.p key={note.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-3 rounded-xl bg-zinc-900 px-3 py-2 text-center text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">{note.text}</motion.p>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {itemsFor(category).map((item) => {
          const owned = room.owned.includes(item.id);
          const on = room[slot] === item.id;
          return (
            <motion.button key={item.id} type="button" onClick={() => choose(item.id)} aria-label={t(`room.item.${item.id}` as UiStringKey)}
              animate={popped === item.id ? { scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] } : {}} transition={{ duration: 0.45 }}
              className={`relative flex flex-col items-center rounded-2xl border-2 p-2 transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${on
                ? 'border-zinc-900 bg-zinc-50 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:shadow-[0_3px_0_0_#e4e4e7]'
                : 'border-slate-200 bg-white shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#3f3f46]'}`}>
              <span className="flex aspect-square w-full items-center justify-center rounded-xl bg-slate-50 p-1.5 dark:bg-white">
                <img src={item.src} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
              </span>
              <span className="mt-1.5 flex h-5 items-center gap-1 text-[11px] font-extrabold">
                {on ? <span className="flex items-center gap-0.5 text-emerald-600"><Check className="h-3.5 w-3.5" strokeWidth={3} />{t('room.shop.placed')}</span>
                  : owned ? <span className="text-slate-400">{t('room.shop.owned')}</span>
                  : <span className="flex items-center gap-1 text-amber-600"><Coins className="h-3 w-3" />{item.price}</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
    </RoomSheet>
  );
}

/** A running food boost, shown in the room's corner with minutes left. */
function BoostChip() {
  const { t } = useUiLang();
  const pantry = usePantry();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(id); }, []);
  const b = activeBoost(pantry, now);
  if (!b) return null;
  return (
    <span className="absolute left-3 top-3 z-[8] flex items-center gap-1 rounded-full border-2 border-zinc-900 bg-amber-300 px-2.5 py-1 font-serif text-xs font-extrabold text-zinc-900 shadow-[0_2px_0_0_#18181b]">
      <Zap className="h-3.5 w-3.5 fill-current" />{t('rewards.boostActive', { n: b.mult, what: t(b.kind === 'xp' ? 'rewards.what.xp' : 'rewards.what.coins'), m: Math.max(1, Math.ceil((b.until - now) / 60_000)) })}
    </span>
  );
}

/** Smarty's mini-fridge: snacks inside (tap to feed) and a food shop. */
function Fridge({ onFeed, onChange, onClose }: { onFeed: (id: string) => void; onChange: () => void; onClose: () => void }) {
  const { t } = useUiLang();
  const { userProfile, spendCoins } = useProgress();
  const pantry = usePantry();
  const [tab, setTab] = useState<'inside' | 'shop'>(foodCount(pantry) ? 'inside' : 'shop');
  const [note, setNote] = useState<{ id: number; text: string } | null>(null);
  const [popped, setPopped] = useState<string | null>(null);
  const inside = FOODS.filter((f) => pantry.foods[f.id]);
  const buy = (id: string) => {
    const food = foodById(id)!;
    if ((pantry.foods[id] ?? 0) >= FRIDGE_MAX_EACH) { setNote({ id: Date.now(), text: t('fridge.full') }); playSound('fail', { mascot: false }); return; }
    if (userProfile.coins < food.price) { setNote({ id: Date.now(), text: t('fridge.noCoins') }); playSound('fail', { mascot: false }); return; }
    if (buyFood(id, spendCoins)) { setPopped(id); window.setTimeout(() => setPopped(null), 450); playSound('purchase', { mascot: false }); window.setTimeout(() => playSound('coin', { mascot: false }), 180); }
  };
  const tile = 'relative flex flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-[0_3px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#3f3f46]';
  return (
    <RoomSheet title={t('fridge.title')} onClose={onClose}
      right={<span className="flex items-center gap-1 rounded-2xl border-2 border-slate-200 px-2.5 py-1.5 font-serif text-sm font-extrabold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"><Coins className="h-4 w-4 text-amber-500" />{userProfile.coins}</span>}>
      <div className="mb-3 flex gap-2">
        {(['inside', 'shop'] as const).map((k) => (
          <button key={k} type="button" onClick={() => { setTab(k); playSound('tap', { mascot: false }); }}
            className={`flex-1 rounded-2xl border-2 py-2 font-serif text-[13px] font-extrabold uppercase tracking-wide ${tab === k ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-slate-200 text-slate-500 dark:border-zinc-700'}`}>
            {t(k === 'inside' ? 'fridge.inside' : 'fridge.shop')}{k === 'inside' && foodCount(pantry) ? ` · ${foodCount(pantry)}` : ''}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {note && (
          <motion.p key={note.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-3 rounded-xl bg-zinc-900 px-3 py-2 text-center text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">{note.text}</motion.p>
        )}
      </AnimatePresence>
      {tab === 'inside' ? (
        inside.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {inside.map((f) => (
              <button key={f.id} type="button" onClick={() => onFeed(f.id)} className={tile} aria-label={`${t('fridge.feed')} ${t(`food.${f.id}` as UiStringKey)}`}>
                <span className="absolute right-1.5 top-1.5 rounded-full bg-zinc-900 px-1.5 text-[11px] font-extrabold text-white dark:bg-zinc-100 dark:text-zinc-900">×{pantry.foods[f.id]}</span>
                <img src={f.src} alt="" loading="lazy" className="h-16 w-full object-contain" />
                <span className="mt-1 line-clamp-1 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-50">{t(`food.${f.id}` as UiStringKey)}</span>
                <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-slate-500"><Zap className="h-3 w-3" />{f.xp}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-slate-500">{t('fridge.empty')}</p>
            <button type="button" onClick={() => setTab('shop')} className="mt-3 rounded-2xl bg-zinc-900 px-4 py-2 font-serif text-sm font-extrabold uppercase text-white dark:bg-zinc-100 dark:text-zinc-900">{t('fridge.shop')}</button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {FOODS.map((f) => (
            <motion.button key={f.id} type="button" onClick={() => buy(f.id)} className={tile} aria-label={t(`food.${f.id}` as UiStringKey)}
              animate={popped === f.id ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.4 }}>
              {!!pantry.foods[f.id] && <span className="absolute right-1.5 top-1.5 rounded-full bg-slate-200 px-1.5 text-[11px] font-extrabold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">×{pantry.foods[f.id]}</span>}
              {f.tier === 3 && <span className="absolute left-1.5 top-1.5 text-amber-500"><Zap className="h-3.5 w-3.5 fill-current" /></span>}
              <img src={f.src} alt="" loading="lazy" className="h-16 w-full object-contain" />
              <span className="mt-1 line-clamp-1 text-[11px] font-extrabold text-zinc-900 dark:text-zinc-50">{t(`food.${f.id}` as UiStringKey)}</span>
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600"><Coins className="h-3 w-3" />{f.price}</span>
            </motion.button>
          ))}
        </div>
      )}
      <button type="button" onClick={onChange} className="mt-4 w-full text-center text-sm font-bold text-slate-500 underline">{t('fridge.change')}</button>
    </RoomSheet>
  );
}
