import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';

export function Sheet({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const getButtons = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]') ?? [])];
    getButtons()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); }
      if (e.key !== 'Tab') return;
      const controls = getButtons();
      if (!controls.length) { e.preventDefault(); return; }
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-zinc-900/55 backdrop-blur-[2px]" onClick={onClose}>
    <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a]" onClick={e => e.stopPropagation()}>{children}</motion.div>
  </div>;
}
