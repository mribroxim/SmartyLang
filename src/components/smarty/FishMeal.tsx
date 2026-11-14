import { motion } from 'motion/react';
import { FISH_PARTS, type FishPart } from '../../lib/smarty/pantry';

/**
 * A chunky ink fish in four parts (tail, body, fins, head). Collected parts are
 * solid; missing ones are dashed outlines. The newest part drops in with a bounce.
 */
export function FishMeal({ filled, fresh, size = 180, className = '' }: {
  /** How many parts are collected (0–4). */
  filled: number;
  /** Part that was just added (animates in). */
  fresh?: FishPart | null;
  size?: number;
  className?: string;
}) {
  const has = (p: FishPart) => FISH_PARTS.indexOf(p) < filled;
  const part = (p: FishPart, solid: React.ReactNode, outline: React.ReactNode) => {
    const on = has(p);
    if (!on) return <g key={p} className="text-slate-300 dark:text-zinc-600">{outline}</g>;
    if (fresh !== p) return <g key={p}>{solid}</g>;
    return (
      <motion.g
        key={p}
        initial={{ y: -40, opacity: 0, scale: 0.4 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.25 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {solid}
      </motion.g>
    );
  };
  const ink = 'currentColor';
  const dash = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeDasharray: '6 5', strokeLinejoin: 'round' as const };

  return (
    <svg viewBox="0 0 200 110" width={size} height={(size * 110) / 200} className={`text-zinc-900 dark:text-zinc-50 ${className}`} role="img" aria-label={`${filled} / 4`}>
      {/* tail */}
      {part('tail',
        <path d="M44 55 L8 24 Q14 55 8 86 Z" fill={ink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />,
        <path d="M44 55 L8 24 Q14 55 8 86 Z" {...dash} />)}
      {/* fins (top + bottom) */}
      {part('fins',
        <g fill={ink} stroke={ink} strokeWidth={3} strokeLinejoin="round">
          <path d="M78 26 Q96 2 126 22 Z" />
          <path d="M90 84 Q100 104 118 88 Z" />
        </g>,
        <g {...dash}><path d="M78 26 Q96 2 126 22 Z" /><path d="M90 84 Q100 104 118 88 Z" /></g>)}
      {/* body */}
      {part('body',
        <g>
          <path d="M44 55 Q60 22 120 22 L120 88 Q60 88 44 55 Z" fill={ink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <g fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" className="dark:[stroke:#18181b]">
            <path d="M70 44 q8 9 0 18" /><path d="M86 38 q9 12 0 30" /><path d="M102 36 q9 14 0 34" />
          </g>
        </g>,
        <path d="M44 55 Q60 22 120 22 L120 88 Q60 88 44 55 Z" {...dash} />)}
      {/* head */}
      {part('head',
        <g>
          <path d="M120 22 Q176 22 190 55 Q176 88 120 88 Z" fill={ink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx="160" cy="46" r="9" fill="white" />
          <circle cx="162" cy="46" r="4.5" fill={ink} />
          <path d="M176 62 q6 2 10 -2" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" />
          <path d="M132 30 q8 25 0 50" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" />
        </g>,
        <path d="M120 22 Q176 22 190 55 Q176 88 120 88 Z" {...dash} />)}
      {fresh && has(fresh) && (
        <g>
          {[[30, 14], [178, 16], [104, 102], [190, 92], [14, 98]].map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
              fill="currentColor"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: 0.45 + i * 0.07 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
