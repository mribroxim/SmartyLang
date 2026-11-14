/** One topmost-dialog keyboard owner, including nested legacy overlays. */
export function installDialogAccessibility() {
  const open = new Map<HTMLElement, HTMLElement | null>();
  const visible = (el: HTMLElement) => !el.hidden && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).visibility !== 'hidden' && el.getClientRects().length > 0;
  const controls = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(visible);
  const z = (el: HTMLElement) => { let value = 0; for (let node: HTMLElement | null = el; node; node = node.parentElement) value = Math.max(value, Number(getComputedStyle(node).zIndex) || 0); return value; };
  const dialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"],[role="listbox"][data-popup]')].filter(visible).sort((a, b) => z(a) - z(b));
  const refresh = () => {
    const current = dialogs();
    for (const [el, previous] of open) if (!current.includes(el)) { open.delete(el); if (previous?.isConnected) previous.focus(); }
    for (const el of current) if (!open.has(el)) {
      open.set(el, document.activeElement as HTMLElement | null);
      el.tabIndex = -1;
      const heading = el.querySelector<HTMLElement>('h1,h2,h3');
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby') && heading) { heading.id ||= `dialog-title-${Math.random().toString(36).slice(2)}`; el.setAttribute('aria-labelledby', heading.id); }
      queueMicrotask(() => { if (dialogs().at(-1) === el && !el.contains(document.activeElement)) (controls(el)[0] || el).focus(); });
    }
  };
  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', event => {
    const top = dialogs().at(-1); if (!top) return;
    if (event.key === 'Escape') {
      // Explicit onKeyDown handlers own closing. Stop older document handlers
      // from also closing an underlying sheet; bubble only through this popup.
      event.preventDefault(); event.stopImmediatePropagation();
      const close = new CustomEvent('smarty-dialog-escape', { bubbles: true }); top.dispatchEvent(close);
      return;
    }
    if (event.key !== 'Tab') return;
    event.stopImmediatePropagation();
    const items = controls(top), first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); top.focus(); }
    else if (!top.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
  }, true);
  refresh();
}
