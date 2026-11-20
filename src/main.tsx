import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ContentLangProvider } from './contexts/ContentLangContext';
import { UiLangProvider } from './contexts/UiLangContext';
import { warmSpeechVoices } from './lib/speech';
import './index.css';
import { StickerDefs } from './components/stickers/StickerDefs';
import { loadUiLocale, translateUi } from './lib/uiStrings';
import { readStoredUiLang } from './lib/uiLang';
import { LegalRouter } from './features/Legal';
import { initializeMonitoring } from './lib/monitoring';
import { installDialogAccessibility } from './lib/dialogAccessibility';
import { initReminders } from './lib/reminders';

warmSpeechVoices();
initializeMonitoring();
installDialogAccessibility();
initReminders();

// ── Redirect firebase default URLs to custom domain ──────────────────────────
// The default .web.app and .firebaseapp.com URLs always exist but we want all
// traffic to go through the branded domains.
const _firebaseHosts = [
  'smarty-english-c0532.web.app',
  'smarty-english-c0532.firebaseapp.com',
];
const _preferredHost = 'smartylang.com';
if (_firebaseHosts.includes(window.location.hostname)) {
  window.location.replace(
    window.location.href.replace(window.location.hostname, _preferredHost)
  );
}

// ── Stale-chunk auto-reload ─────────────────────────────────────────────────
// When a new build is deployed, users with the old page open will fail to load
// lazy-loaded chunks (the hashed filenames change). The browser surfaces this
// as either an "import error" or a MIME-type mismatch (because Firebase's SPA
// fallback returns index.html for missing files). Detect that situation and
// force-reload so the user picks up the new build automatically.
const STALE_CHUNK_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /Expected a JavaScript-or-Wasm module script/i,
  /MIME type of ['"]text\/html['"]/i,
  /Importing a module script failed/i,
];
const isStaleChunkError = (msg: string | undefined) =>
  !!msg && STALE_CHUNK_PATTERNS.some(rx => rx.test(msg));

let reloadingForStaleChunk = false;
const handleStaleChunk = (reason: string) => {
  if (reloadingForStaleChunk) return;
  reloadingForStaleChunk = true;
  console.warn(`[stale-chunk] reloading because: ${reason}`);
  // Cache-busting query param ensures the browser fetches a fresh index.html.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_r', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
};

window.addEventListener('error', (e: ErrorEvent) => {
  if (isStaleChunkError(e?.message) || isStaleChunkError((e?.error as any)?.message)) {
    handleStaleChunk(e.message);
  }
});
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const reason = e?.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message;
  if (isStaleChunkError(msg)) handleStaleChunk(msg!);
});

const renderApp = () => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StickerDefs />
    <ContentLangProvider>
      <UiLangProvider>
        <LegalRouter><App /></LegalRouter>
      </UiLangProvider>
    </ContentLangProvider>
  </StrictMode>,
);

// Fetch one language chunk before the first screen so a saved language never
// flashes the English interface or downloads the other 27 language packs.
loadUiLocale(readStoredUiLang()).then(renderApp).catch((error) => {
  console.error('Could not load saved interface language:', error);
  createRoot(document.getElementById('root')!).render(
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{translateUi('en', 'error.crash.body')}</p>
      <button type="button" onClick={() => window.location.reload()}>{translateUi('en', 'action.tryAgain')}</button>
    </main>,
  );
});
