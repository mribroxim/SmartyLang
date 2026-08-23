import React, { useState, lazy, Suspense, useEffect } from 'react';
import { PenLine, BarChart2, BookOpen, Loader2, Timer, GraduationCap } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

const WritingPractice = lazy(() => import('./WritingPractice').then(m => ({ default: m.WritingPractice })));
const WritingTask1    = lazy(() => import('./WritingTask1').then(m => ({ default: m.WritingTask1 })));
const WritingTask2    = lazy(() => import('./WritingTask2').then(m => ({ default: m.WritingTask2 })));
const WritingMock     = lazy(() => import('./WritingMock').then(m => ({ default: m.WritingMock })));

type WritingMode = 'hub' | 'ielts' | 'general' | 'task1' | 'task2' | 'mock';

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
  if (raw === 'ielts' || raw === 'general' || raw === 'task1' || raw === 'task2' || raw === 'mock') return raw;
  return 'hub';
}

export function WritingHub({ onBack, initialLevel, initialTopicIndex, onToggleVocab, savedVocab = {}, onShowModal, navMode, onNavMode, onIeltsBack, startingLevel }: WritingHubProps) {
  const { isEnglish } = useContentLang();
  const { t } = useUiLang();
  const academicLabel = isEnglish ? t('writing.ielts.title') : t('writing.academicLabel');
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

  if (mode === 'task1') {
    return (
      <Suspense fallback={SPINNER}>
        <WritingTask1
          onBack={() => setMode('ielts')}
          onToggleVocab={onToggleVocab}
          savedVocab={savedVocab}
          onShowModal={onShowModal}
        />
      </Suspense>
    );
  }

  if (mode === 'task2') {
    return (
      <Suspense fallback={SPINNER}>
        <WritingTask2
          onBack={() => setMode('ielts')}
          onToggleVocab={onToggleVocab}
          savedVocab={savedVocab}
          onShowModal={onShowModal}
        />
      </Suspense>
    );
  }

  if (mode === 'mock' && isEnglish) {
    return (
      <Suspense fallback={SPINNER}>
        <WritingMock onBack={() => setMode('ielts')} />
      </Suspense>
    );
  }

  /* Academic / IELTS sub-hub — English reaches this only via the IELTS tab URL */
  if (mode === 'ielts') {
    return (
      <ScreenShell
        title={academicLabel}
        subtitle={isEnglish ? t('writing.ielts.hubSubtitle') : t('writing.academic.hubSubtitle')}
      >
        <div className={seGrid2}>
          <HubRow
            icon={<BarChart2 className="w-6 h-6" />}
            iconClass="bg-sky-50 text-sky-700"
            title="Academic Task 1"
            desc="Describe charts, graphs, maps, and processes. At least 150 words."
            onClick={() => setMode('task1')}
          />
          <HubRow
            icon={<BookOpen className="w-6 h-6" />}
            iconClass="bg-violet-50 text-violet-700"
            title="Academic Task 2"
            desc="Write an essay responding to a point of view or problem. At least 250 words."
            onClick={() => setMode('task2')}
          />
          {isEnglish && (
            <HubRow
              dark
              icon={<Timer className="w-6 h-6" />}
              title="Writing Mock"
              desc="Timed full exam combining Task 1 and Task 2 with AI feedback."
              meta="Mock exam"
              onClick={() => setMode('mock')}
            />
          )}
        </div>
      </ScreenShell>
    );
  }

  /* Hub screen — IELTS Writing is English-only via the IELTS tab, not Practice */
  return (
    <ScreenShell title={t('writing.title')} subtitle={t('writing.subtitle')}>
      <div className={seGrid2}>
        <HubRow
          icon={<PenLine className="w-6 h-6" />}
          iconClass="bg-amber-50 text-amber-700"
          title={t('writing.general.title')}
          desc={t('writing.general.desc')}
          onClick={() => setMode('general')}
        />
        {!isEnglish && (
          <HubRow
            dark
            icon={<GraduationCap className="w-6 h-6" />}
            title={academicLabel}
            desc={t('writing.academic.desc')}
            onClick={() => setMode('ielts')}
          />
        )}
      </div>
    </ScreenShell>
  );
}
