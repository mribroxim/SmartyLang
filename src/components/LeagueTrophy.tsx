import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { LEAGUE_TIERS, leagueMeta } from '../lib/habitEngine';

/** Chunky trophy cup in a league's colours; higher tiers gain a star and gems. */
export function LeagueTrophy({ id, size = 56, locked = false }: { id: string; size?: number; locked?: boolean }) {
  const m = leagueMeta(id);
  const tier = LEAGUE_TIERS.findIndex((t) => t.id === m.id);
  // Locked leagues keep their colour (so you can see what's ahead), just faded.
  const fill = m.accent;
  const ink = locked ? '#64748b' : '#18181b';
  // 3D render (scripts/blender/room3d.py); the drawn cup below is the fallback.
  const [noRender, setNoRender] = useState(false);
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {!noRender ? (
        <img src={`/room/trophy/${m.id.toLowerCase()}.webp`} alt="" width={size} height={size} loading="lazy" draggable={false}
          onError={() => setNoRender(true)} className={`h-full w-full object-contain ${locked ? 'opacity-50 grayscale' : ''}`} />
      ) : (
      <span className={locked ? 'contents [&>svg]:opacity-45 [&>svg]:saturate-50' : 'contents'}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        {/* handles */}
        <path d="M16 16 H8 Q6 30 20 32" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M48 16 H56 Q58 30 44 32" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        {/* cup */}
        <path d="M14 10 H50 V22 Q50 40 32 42 Q14 40 14 22 Z" fill={fill} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
        {/* shine */}
        {!locked && <path d="M20 15 V24 Q20 30 24 33" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />}
        {/* stem + base */}
        <path d="M28 42 H36 V50 H28 Z" fill={fill} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 50 H46 Q48 50 48 52 V57 H16 V52 Q16 50 18 50 Z" fill={ink} />
        {/* star from Sapphire up, gems from Amethyst up */}
        {!locked && tier >= 3 && <path d="M32 17 l2.6 5.4 6 .8 -4.3 4.1 1 5.9 -5.3 -2.8 -5.3 2.8 1 -5.9 -4.3 -4.1 6 -.8 Z" fill="white" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />}
        {!locked && tier >= 6 && <><circle cx="22" cy="53.5" r="2" fill={m.accent} /><circle cx="42" cy="53.5" r="2" fill={m.accent} /></>}
      </svg>
      </span>
      )}
      {locked && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-white dark:border-zinc-900">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
  );
}

/** All five leagues in a row: reached ones in colour, yours big, the rest locked. */
export function LeagueLadder({ current, label }: { current: string; label: (id: string) => string }) {
  const idx = Math.max(0, LEAGUE_TIERS.findIndex((t) => t.id === leagueMeta(current).id));
  return (
    <div>
      <ol className="flex w-full items-end justify-between gap-1">
        {LEAGUE_TIERS.map((t, i) => {
          const isCurrent = i === idx;
          const locked = i > idx;
          return (
            <li key={t.id} className="flex min-w-0 flex-1 flex-col items-center" aria-current={isCurrent ? 'step' : undefined}>
              {isCurrent ? (
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                  <LeagueTrophy id={t.id} size={76} />
                </motion.div>
              ) : (
                <LeagueTrophy id={t.id} size={50} locked={locked} />
              )}
              <span className={`mt-1 font-serif text-[10px] font-extrabold uppercase tracking-wide ${isCurrent ? 'text-zinc-900 dark:text-zinc-50' : 'text-slate-400'}`}>{label(t.id)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
