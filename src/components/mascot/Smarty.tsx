import { Sticker, type StickerId } from '../stickers/Sticker';
import type { StickerMode, StickerPriority } from '../stickers/scheduler';

/**
 * Smarty — the Smarty English mascot. Flat ink-black cat with white ring eyes
 * in a hand-inked sticker style. Renders one of the 229 approved stickers
 * (design/sticker-board); `mood` picks a sensible default, `sticker` overrides.
 */
export type SmartyMood =
  | 'idle'
  | 'happy'
  | 'celebrate'
  | 'sad'
  | 'thinking'
  | 'sleepy'
  | 'surprised'
  | 'love'
  | 'wave';

export const MOOD_STICKER: Record<SmartyMood, StickerId> = {
  idle: 'mood.hi-there',
  happy: 'mood.yay',
  celebrate: 'mood.party-time',
  sad: 'mood.teary',
  thinking: 'mood.hmm',
  sleepy: 'pose.snooze',
  surprised: 'mood.gasp',
  love: 'mood.smitten',
  wave: 'mood.hello',
};

interface SmartyProps {
  mood?: SmartyMood;
  /** Exact sticker to show (wins over mood). */
  sticker?: StickerId;
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
  /** Accessible label. Omit for decorative use (aria-hidden). */
  title?: string;
  priority?: StickerPriority;
  mode?: StickerMode;
}

export function Smarty({ mood = 'idle', sticker, size = 120, className = '', title, priority = 'normal', mode = 'auto' }: SmartyProps) {
  return (
    <Sticker
      id={sticker ?? MOOD_STICKER[mood]}
      size={size}
      className={className}
      title={title}
      priority={priority}
      mode={mode}
    />
  );
}
