import React, { useState, lazy, Suspense, useEffect } from 'react';
import { PenLine, Loader2 } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

const WritingPractice = lazy(() => import('./WritingPractice').then(m => ({ default: m.WritingPractice })));

type WritingMode = 'hub' | 'general';

interface WritingHubProps {
  onBack?: () => void;
  initialLevel?: string;
  initialTopicIndex?: number;
  onToggleVocab?: (w: string, ctx: string) => void;
  savedVocab?: Record<string, any>;
  onShowModal?: (w: string, mode: string) => void;
  navMode?: string;
  onNavMode?: (mode: WritingMode) => void;
  /** When set, IELTS Writing back returns here (IELTS tab) instead of the Practice hub. */
  onIeltsBack?: () => void;
  startingLevel?: string;
}

const SPINNER = (
  <div className="flex-grow flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
  </div>
);

function parseMode(raw?: string): WritingMode {
  if (raw === 'general') return raw;
  return 'hub';
}

export function WritingHub({ onBack, initialLevel, initialTopicIndex, onToggleVocab, savedVocab = {}, onShowModal, navMode, onNavMode, onIeltsBack, startingLevel }: WritingHubProps) {
  const { isEnglish } = useContentLang();
  const { t } = useUiLang();
  const hasInitial = initialLevel !== undefined && initialTopicIndex !== undefined;
  const controlled = typeof onNavMode === 'function';
  const [localMode, setLocalMode] = useState<WritingMode>(hasInitial ? 'general' : 'hub');

  const mode: WritingMode = controlled ? parseMode(navMode) : localMode;

  const setMode = (m: WritingMode) => {
    if (controlled) onNavMode!(m);
    else setLocalMode(m);
  };

  useEffect(() => {
    if (hasInitial) setMode('general');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitial, initialLevel, initialTopicIndex]);

  if (mode === 'general') {
    return (
      <Suspense fallback={SPINNER}>
        <WritingPractice
          onBack={() => setMode('hub')}
          initialLevel={initialLevel}
          initialTopicIndex={initialTopicIndex}
          onToggleVocab={onToggleVocab}
          savedVocab={savedVocab}
          onShowModal={onShowModal}
          startingLevel={startingLevel}
        />
      </Suspense>
    );
  }

  return (
    <ScreenShell title={t('writing.title')} subtitle={t('writing.subtitle')} stickers={['learn.scribbler', 'write.signed', 'write.ink-trouble']}>
      <div className={seGrid2}>
        <HubRow
          icon={<PenLine className="w-6 h-6" />}
          iconClass="bg-amber-50 text-amber-700"
          sticker="learn.scribbler"
          title={t('writing.general.title')}
          desc={t('writing.general.desc')}
          onClick={() => setMode('general')}
        />
      </div>
    </ScreenShell>
  );
}
