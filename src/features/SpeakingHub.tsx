import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Mic, Headphones, Loader2 } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

const SpeakingPractice = lazy(() => import('./SpeakingPractice').then(m => ({ default: m.SpeakingPractice })));
const Shadowing        = lazy(() => import('./Shadowing').then(m => ({ default: m.Shadowing })));
const IELTSSpeaking    = lazy(() => import('./IELTSSpeaking').then(m => ({ default: m.IELTSSpeaking })));

type SpeakingMode = 'hub' | 'general' | 'shadowing' | 'ielts';

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );
}

function parseMode(raw?: string): SpeakingMode {
  if (raw === 'general' || raw === 'shadowing' || raw === 'ielts') return raw;
  return 'hub';
}

export function SpeakingHub({
  initialTopicIndex,
  onToggleVocab,
  savedVocab = {},
  onShowModal,
  navMode,
  onNavMode,
  onIeltsBack,
}: {
  initialTopicIndex?: number;
  onToggleVocab?: (w: string, ctx: string) => void;
  savedVocab?: Record<string, any>;
  onShowModal?: (w: string, mode: string) => void;
  /** Controlled mode from browser URL (optional). */
  navMode?: string;
  onNavMode?: (mode: SpeakingMode) => void;
  /** When set, IELTS Speaking back returns here (IELTS tab) instead of the Practice hub. */
  onIeltsBack?: () => void;
}) {
  const { isEnglish } = useContentLang();
  const { t } = useUiLang();
  const controlled = typeof onNavMode === 'function';
  const [localMode, setLocalMode] = useState<SpeakingMode>(
    initialTopicIndex !== undefined ? 'general' : (isEnglish ? 'hub' : 'general'),
  );

  const mode: SpeakingMode = !isEnglish
    ? 'general'
    : controlled
      ? parseMode(navMode)
      : localMode;

  const setMode = (m: SpeakingMode) => {
    if (controlled) onNavMode!(m);
    else setLocalMode(m);
  };

  // When a jump supplies a topic, open general practice once.
  useEffect(() => {
    if (initialTopicIndex !== undefined) setMode('general');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopicIndex]);

  if (mode === 'general' || !isEnglish) {
    return (
      <Suspense fallback={<Spinner />}>
        <SpeakingPractice
          onBack={isEnglish ? () => setMode('hub') : undefined}
          initialTopicIndex={initialTopicIndex}
          onToggleVocab={onToggleVocab}
          savedVocab={savedVocab}
          onShowModal={onShowModal}
        />
      </Suspense>
    );
  }

  if (mode === 'shadowing') {
    return (
      <Suspense fallback={<Spinner />}>
        <Shadowing onBack={() => setMode('hub')} />
      </Suspense>
    );
  }

  if (mode === 'ielts') {
    return (
      <Suspense fallback={<Spinner />}>
        <IELTSSpeaking onBack={() => (onIeltsBack ? onIeltsBack() : setMode('hub'))} />
      </Suspense>
    );
  }

  return (
    <ScreenShell title={t('speaking.title')} subtitle={t('speaking.subtitle')}>
      <div className={seGrid2}>
        <HubRow
          icon={<Mic className="w-6 h-6" />}
          iconClass="bg-slate-100 text-slate-700"
          title={t('speaking.general.title')}
          desc={t('speaking.general.desc')}
          onClick={() => setMode('general')}
        />
        <HubRow
          icon={<Headphones className="w-6 h-6" />}
          iconClass="bg-sky-50 text-sky-700"
          title={t('speaking.shadow.title')}
          desc={t('speaking.shadow.desc')}
          onClick={() => setMode('shadowing')}
        />
      </div>
    </ScreenShell>
  );
}
