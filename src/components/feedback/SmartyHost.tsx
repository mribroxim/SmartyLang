import { DialogSurface } from '../DialogSurface';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sticker } from '../stickers/Sticker';
import { useUiLang } from '../../contexts/UiLangContext';
import { onSmarty, emitSmarty } from '../../lib/smarty/bus';
import { decide, newDirectorState, type Reaction } from '../../lib/smarty/director';
import { playSound } from '../../lib/audio';
import { useIdle } from '../../lib/smarty/useIdle';

const TONE_BORDER: Record<NonNullable<Reaction['tone']>, string> = {
  good: 'border-emerald-200 dark:border-emerald-900',
  soft: 'border-slate-200 dark:border-zinc-700',
  warn: 'border-amber-200 dark:border-amber-900',
};

/**
 * Where Smarty lives on screen. Listens to every Smarty event, asks the
 * director what to do and shows it on one of three surfaces:
 *  - stage: the cat pops up bottom-right with a speech bubble (tap him!)
 *  - toast: small card at the top (saved word, offline, badge…)
 *  - fullscreen: big moments (level up, streak milestone, new league…)
 * The stage only shows where the app chrome is visible; toasts and big
 * moments show anywhere once signed in.
 */
export function SmartyHost({ signedIn, stageEnabled }: { signedIn: boolean; stageEnabled: boolean }) {
  const { t } = useUiLang();
  const st = useRef(newDirectorState());
  const [stage, setStage] = useState<Reaction | null>(null);
  const [toasts, setToasts] = useState<Reaction[]>([]);
  const [big, setBig] = useState<Reaction[]>([]);
  const stageTimer = useRef<number | undefined>(undefined);
  const taps = useRef<{ n: number; at: number }>({ n: 0, at: 0 });
  const stageOn = useRef(stageEnabled);
  stageOn.current = stageEnabled;

  useIdle(signedIn);

  // New build deployed while the app is open → offer a reload (checked when the tab comes back).
  useEffect(() => {
    if (!signedIn || import.meta.env.DEV) return;
    const mine = [...document.querySelectorAll('script[type="module"][src]')].map((x) => (x as HTMLScriptElement).getAttribute('src')).join('|');
    let told = false;
    const check = async () => {
      if (told || document.visibilityState !== 'visible') return;
      try {
        const html = await (await fetch('/index.html', { cache: 'no-store' })).text();
        const latest = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => m[1]).join('|');
        if (mine && latest && latest !== mine) { told = true; emitSmarty({ type: 'app.update' }); }
      } catch { /* offline */ }
    };
    const id = window.setInterval(check, 30 * 60_000);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const off = onSmarty((e) => {
      const r = decide(e, st.current);
      if (!r) return;
      if (r.sound) playSound(r.sound);
      if (r.surface === 'stage') {
        if (!stageOn.current) return;
        setStage((cur) => (cur && cur.priority < r.priority ? cur : r));
        window.clearTimeout(stageTimer.current);
        stageTimer.current = window.setTimeout(() => setStage(null), r.ms);
      } else if (r.surface === 'toast') {
        setToasts((cur) => [...cur.filter((x) => x.priority <= r.priority || x.priority === 0).slice(-1), r]);
        window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== r.id)), r.ms);
      } else {
        setBig((cur) => (cur.some((x) => x.sticker === r.sticker) ? cur : [...cur, r]));
        if (r.ms > 0) window.setTimeout(() => setBig((cur) => cur.filter((x) => x.id !== r.id)), r.ms);
      }
    });
    const online = () => emitSmarty({ type: 'net', online: true });
    const offline = () => emitSmarty({ type: 'net', online: false });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      off();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.clearTimeout(stageTimer.current);
    };
  }, [signedIn]);

  useEffect(() => { if (!stageEnabled) setStage(null); }, [stageEnabled]);

  // Escape closes the current big moment (the dialog autofocuses its Continue button).
  const hasBig = big.length > 0;
  useEffect(() => {
    if (!hasBig) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBig((cur) => cur.slice(1)); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasBig]);

  const onTapStage = () => {
    const now = Date.now();
    taps.current = now - taps.current.at < 3000 ? { n: taps.current.n + 1, at: now } : { n: 1, at: now };
    emitSmarty({ type: 'tap.smarty', count: taps.current.n });
    if (taps.current.n >= 5) taps.current = { n: 0, at: 0 };
  };

  const current = big[0];
  const text = (r: Reaction) => t(r.line, r.vars);

  return (
    <>
      {/* Stage */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-3 z-[55] sm:right-6"
        style={{ bottom: 'calc(var(--se-mobile-nav, 0px) + 12px)' }}
      >
        <AnimatePresence>
          {stage && (
            <motion.div
              key={stage.id}
              initial={{ y: 160, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 160, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="pointer-events-auto flex items-end gap-1"
            >
              <motion.button
                type="button"
                onClick={() => setStage(null)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 500, damping: 24 }}
                style={{ originX: 1, originY: 1 }}
                className={`relative mb-14 max-w-[210px] rounded-2xl border-2 bg-white dark:bg-zinc-900 px-3.5 py-2 text-left text-sm font-black text-zinc-900 dark:text-zinc-100 shadow-lg ${TONE_BORDER[stage.tone ?? 'soft']}`}
              >
                {text(stage)}
                <span aria-hidden className={`absolute -right-[9px] bottom-3 h-4 w-4 -rotate-45 border-b-2 border-r-2 bg-white dark:bg-zinc-900 ${TONE_BORDER[stage.tone ?? 'soft']}`} />
              </motion.button>
              <button type="button" onClick={onTapStage} aria-label="Smarty" className="active:scale-95 transition">
                <Sticker id={stage.sticker} size={108} priority="hero" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toasts */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[65] flex flex-col items-center gap-2 px-3 sm:items-end sm:right-4 sm:left-auto">
        <AnimatePresence>
          {toasts.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border-2 bg-white dark:bg-zinc-900 p-2.5 pr-3 border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] ${TONE_BORDER[r.tone ?? 'soft']}`}
              role="status"
            >
              <Sticker id={r.sticker} size={56} priority="normal" mode="once" />
              <div className="min-w-0 flex-1">
                {r.title && <div className="text-sm font-black text-zinc-900 dark:text-zinc-50">{t(r.title, r.vars)}</div>}
                <div className="text-[13px] font-semibold text-slate-600 dark:text-zinc-300">{text(r)}</div>
              </div>
              {r.action && (
                <button
                  type="button"
                  onClick={() => { r.action!.run(); setToasts((cur) => cur.filter((x) => x.id !== r.id)); }}
                  className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white dark-keep"
                >
                  {t(r.action.label)}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Big moments */}
      <AnimatePresence>
        {current && (
          <DialogSurface role="presentation" aria-modal={undefined} asComponent={motion.div} onClose={() => setBig((cur) => cur.slice(1))}
            key={current.id}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBig((cur) => cur.slice(1))}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={current.title ? t(current.title, current.vars) : text(current)}
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 px-6 pb-6 pt-4 text-center border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center"><Sticker id={current.sticker} size={250} priority="hero" /></div>
              {current.title && <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{t(current.title, current.vars)}</h2>}
              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-zinc-300">{text(current)}</p>
              <button
                type="button"
                autoFocus
                onClick={() => setBig((cur) => cur.slice(1))}
                className="mt-5 w-full rounded-full bg-zinc-900 py-3 text-sm font-black text-white hover:bg-black active:scale-[.98] transition"
              >
                {t('smarty.continue')}
              </button>
            </motion.div>
          </DialogSurface>
        )}
      </AnimatePresence>
    </>
  );
}
