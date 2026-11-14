import { useEffect, useRef, type ReactNode } from 'react';
/** Provides an explicit Escape callback without changing the drawn overlay. */
export function DialogSurface({ onClose, className, children, label, asComponent: Component = 'div', onClick, ...rest }: { onClose: () => void; className?: string; children: ReactNode; label?: string; asComponent?: any; onClick?: any; [key: string]: any }) {
  const panel = useRef<HTMLDivElement>(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => { const el = panel.current; const escape = (event: Event) => { event.stopPropagation(); close.current(); }; el?.addEventListener('smarty-dialog-escape', escape); return () => el?.removeEventListener('smarty-dialog-escape', escape); }, []);
  return <Component ref={panel} role="dialog" aria-modal="true" aria-label={label} className={className} {...rest} onClick={onClick || (event => { if (event.target === event.currentTarget) onClose(); })}>{children}</Component>;
}
