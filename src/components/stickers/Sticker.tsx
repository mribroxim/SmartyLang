import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { STICKER_BY_ID, type StickerId } from './manifest';
import { getStickerSvg, loadStickerSvg } from './loader';
import { registerSticker, type StickerMode, type StickerPriority } from './scheduler';
import { useUiLang } from '../../contexts/UiLangContext';
import { localizeStickerSvg } from './localize';

export type { StickerId } from './manifest';

export interface StickerProps {
  id: StickerId;
  /** px number or any CSS length. Default 96. */
  size?: number | string;
  /** Who gets to animate first when many stickers are on screen. */
  priority?: StickerPriority;
  /** auto = loop while visible, still = poster frame, once = play then rest. */
  mode?: StickerMode;
  onceMs?: number;
  /** lite = no ink filter (tiny sizes like nav chips). */
  quality?: 'full' | 'lite';
  /** Accessible name; omit for decorative stickers. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * One animated Smarty sticker. The SVG is generated internally from the
 * sticker kit (never from user input) and injected as markup.
 */
export const Sticker = memo(function Sticker({
  id, size = 96, priority = 'normal', mode = 'auto', onceMs, quality = 'full', title, className = '', style,
}: StickerProps) {
  const [svg, setSvg] = useState<string | null>(() => getStickerSvg(id));
  const ref = useRef<HTMLSpanElement>(null);
  const { uiLang } = useUiLang();
  const displaySvg = useMemo(() => svg ? localizeStickerSvg(svg, uiLang) : '', [svg, uiLang]);

  useEffect(() => {
    let alive = true;
    const ready = getStickerSvg(id);
    if (ready != null) setSvg(ready);
    else {
      setSvg(null);
      loadStickerSvg(id).then((s) => { if (alive) setSvg(s); }).catch(() => { /* network: stays blank */ });
    }
    return () => { alive = false; };
  }, [id]);

  useLayoutEffect(() => {
    if (!displaySvg || !ref.current) return;
    return registerSticker(ref.current, { priority, mode, onceMs, posterMs: STICKER_BY_ID[id]?.posterMs });
  }, [displaySvg, id, priority, mode, onceMs]);

  const box = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      ref={ref}
      className={`st ${quality === 'lite' ? 'st-lite' : ''} ${svg ? 'se-ready' : ''} ${className}`}
      style={{ width: box, height: box, ...style }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={svg ? { __html: displaySvg } : undefined}
    />
  );
});
