import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Coins, Zap } from 'lucide-react';
import { ChunkyButton } from '../features/Bites/lesson/chunky';
import { Sticker } from './stickers/Sticker';
import { useUiLang } from '../contexts/UiLangContext';
import { playSound } from '../lib/audio';
import { foodById, BOOST_MINUTES } from '../lib/smarty/food';
import type { UiStringKey } from '../lib/uiStrings';

/** Anything the learner can win: coins, XP, food for the fridge, a lucky boost. */
export interface Reward {
  coins?: number;
  xp?: number;
  food?: string;
  foodCount?: number;
  boost?: { kind: 'xp' | 'coins'; mult: number };
}

/** Bottom sheet on phones, centred card on larger screens. */
export function Overlay({ children, onClose, z = 50 }: { children: ReactNode; onClose?: () => void; z?: number }) {
  return (
    <motion.div role="dialog" aria-modal="true" style={{ zIndex: z }} className="fixed inset-0 flex items-end justify-center bg-zinc-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 80, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 pb-[max(env(safe-area-inset-bottom),24px)] text-center sm:max-w-sm sm:rounded-3xl dark:bg-zinc-900">
        {children}
      </motion.div>
    </motion.div>
  );
}

/** One line per thing won. */
export function RewardLines({ reward }: { reward: Reward }) {
  const { t } = useUiLang();
  const food = reward.food ? foodById(reward.food) : undefined;
  const chip = 'flex items-center justify-center gap-2 rounded-2xl border-2 border-zinc-900 bg-white px-3 py-2 font-serif text-lg font-extrabold text-zinc-900 shadow-[0_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50';
  return (
    <div className="flex flex-col items-stretch gap-2">
      {!!reward.coins && <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={chip}><Coins className="h-5 w-5 text-amber-500" />{t('rewards.coins', { n: reward.coins })}</motion.div>}
      {!!reward.xp && <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08 }} className={chip}><Zap className="h-5 w-5 fill-current" />{t('rewards.xp', { n: reward.xp })}</motion.div>}
      {food && (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.16 }} className={chip}>
          <img src={food.src} alt="" className="h-9 w-auto" />{t('rewards.food', { name: t(`food.${food.id}` as UiStringKey), n: reward.foodCount ?? 1 })}
        </motion.div>
      )}
      {reward.boost && (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.24 }} className={`${chip} !bg-amber-300 !text-zinc-900`}>
          <Zap className="h-5 w-5 fill-current" />{t(reward.boost.kind === 'xp' ? 'rewards.boostXp' : 'rewards.boostCoins', { n: reward.boost.mult, m: BOOST_MINUTES })}
        </motion.div>
      )}
    </div>
  );
}

/**
 * A mystery box: tap it, it bursts open (chest sound, coins flying) and shows
 * what was won. Used for lesson coins, quest rewards and lucky food boosts.
 */
export function RewardBox({ reward, title, onDone, z }: { reward: Reward; title?: string; onDone: () => void; z?: number }) {
  const { t } = useUiLang();
  const [open, setOpen] = useState(false);
  const tapBox = () => {
    if (open) return;
    setOpen(true);
    playSound('chest-open', { mascot: false });
    const n = reward.coins ? Math.min(6, Math.max(2, Math.round(reward.coins / 3))) : 2;
    for (let i = 0; i < n; i++) window.setTimeout(() => playSound(reward.coins ? 'coin' : 'sparkle', { mascot: false }), 450 + i * 90);
  };
  return (
    <Overlay onClose={open ? onDone : undefined} z={z}>
      <h2 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{open ? t('rewards.youGot') : title ?? t('complete.boxTitle')}</h2>
      <motion.button type="button" onClick={tapBox} aria-label={t('complete.boxTap')}
        animate={open ? { scale: [1, 1.25, 1], rotate: 0 } : { rotate: [0, -6, 6, -4, 4, 0] }}
        transition={open ? { duration: 0.5 } : { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
        className="relative mx-auto my-3 block">
        <Sticker id={open ? 'achieve.treasure-chest' : 'game.mystery-box'} size={open ? 'clamp(96px, 18dvh, 140px)' : 'clamp(140px, 30dvh, 200px)'} priority="hero" mode={open ? 'once' : 'still'} />
        <AnimatePresence>
          {open && Array.from({ length: 10 }).map((_, i) => (
            <motion.span key={i} initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }} animate={{ opacity: 0, x: Math.cos((i / 10) * Math.PI * 2) * 110, y: Math.sin((i / 10) * Math.PI * 2) * 90 - 40, scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="pointer-events-none absolute left-1/2 top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-zinc-900 shadow">
              <Coins className="h-4 w-4" />
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.button>
      {open ? (
        <>
          <RewardLines reward={reward} />
          <ChunkyButton autoFocus onClick={onDone} className="mt-5 w-full">{t('complete.great')}</ChunkyButton>
        </>
      ) : <p className="text-sm font-bold text-slate-500">{t('complete.boxTap')}</p>}
    </Overlay>
  );
}
