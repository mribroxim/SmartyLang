let count = 0;
export function reportError(kind: 'render' | 'unhandled' | 'promise', line?: number, column?: number) {
  if (++count > 10) return;
  void fetch('/api/monitor', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, position: line && column ? `${line}:${column}` : 'unknown' }) }).catch(() => {});
}
export function initializeMonitoring() {
  window.addEventListener('error', event => reportError('unhandled', event.lineno, event.colno));
  window.addEventListener('unhandledrejection', () => reportError('promise'));
}
