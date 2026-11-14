import { useUiLang } from '../../contexts/UiLangContext';
import { useEffect, useState } from 'react';
import { Sticker, type StickerId } from '../stickers/Sticker';

/**
 * Loading state with Smarty chasing his tail. Waits a beat before showing so
 * fast loads don't flash a cat. Text is optional.
 */
export function SmartyLoader({
  text, sticker = 'pose.tail-chase', size = 120, delayMs = 250, className = 'min-h-[60vh]',
}: { text?: string; sticker?: StickerId; size?: number; delayMs?: number; className?: string }) {
  const { t } = useUiLang();
  const [show, setShow] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);
  return (
    <div role="status" aria-live="polite" className={`flex-1 flex flex-col items-center justify-center gap-2 ${className}`}>
      {show && <Sticker id={sticker} size={size} priority="hero" />}
      {show && text && <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{text}</p>}
      <span className="sr-only">{text || t("site.smartyloader.loading_8f26c6")}</span>
    </div>
  );
}
