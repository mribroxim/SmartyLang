import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Mic, Headphones, Loader2, MessageCircle } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

const SpeakingPractice = lazy(() => import('./SpeakingPractice').then(m => ({ default: m.SpeakingPractice })));
const Shadowing        = lazy(() => import('./Shadowing').then(m => ({ default: m.Shadowing })));
const SpeakingBuddy    = lazy(() => import('./SpeakingBuddy').then(m => ({ default: m.SpeakingBuddy })));

type SpeakingMode = 'hub' | 'general' | 'shadowing' | 'buddy';

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );
}

function parseMode(raw?: string): SpeakingMode {
  if (raw === 'general' || raw === 'shadowing' || raw === 'buddy') return raw;
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
  startingLevel,
}: {
  initialTopicIndex?: number;
  onToggleVocab?: (w: string, ctx: string) => void;
  savedVocab?: Record<string, any>;
  onShowModal?: (w: string, mode: string) => void;
  navMode?: string;
  onNavMode?: (mode: SpeakingMode) => void;
  onIeltsBack?: () => void;
  startingLevel?: string;
}) {
  const { isEnglish } = useContentLang();
  const { t } = useUiLang();
  const controlled = typeof onNavMode === 'function';
  const [localMode, setLocalMode] = useState<SpeakingMode>(
    initialTopicIndex !== undefined ? 'general' : 'hub',
  );

  const mode: SpeakingMode = controlled ? parseMode(navMode) : localMode;

  const setMode = (m: SpeakingMode) => {
    if (controlled) onNavMode!(m);
    else setLocalMode(m);
  };

  useEffect(() => {
    if (initialTopicIndex !== undefined) setMode('general');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopicIndex]);

  if (mode === 'general') {
    return (
      <Suspense fallback={<Spinner />}>
        <SpeakingPractice
          onBack={() => setMode('hub')}
          initialTopicIndex={initialTopicIndex}
          onToggleVocab={onToggleVocab}
          savedVocab={savedVocab}
          onShowModal={onShowModal}
          startingLevel={startingLevel}
        />
      </Suspense>
    );
  }

  if (mode === 'shadowing' && isEnglish) {
    return (
      <Suspense fallback={<Spinner />}>
        <Shadowing onBack={() => setMode('hub')} />
      </Suspense>
    );
  }

  if (mode === 'buddy') {
    return (
      <Suspense fallback={<Spinner />}>
        <SpeakingBuddy onBack={() => setMode('hub')} startingLevel={startingLevel} />
      </Suspense>
    );
  }

  return (
    <ScreenShell title={t('speaking.title')} subtitle={t('speaking.subtitle')} stickers={['learn.chatterbox', 'speak.conversation-partner', 'speak.tongue-twister']}>
      <div className={seGrid2}>
        <HubRow
          icon={<Mic className="w-6 h-6" />}
          iconClass="bg-slate-100 text-slate-700"
          sticker="speak.loud-and-clear"
          title={t('speaking.general.title')}
          desc={t('speaking.general.desc')}
          onClick={() => setMode('general')}
        />
        {isEnglish && (
          <HubRow
            icon={<Headphones className="w-6 h-6" />}
            iconClass="bg-sky-50 text-sky-700"
            sticker="speak.voice-waves"
            title={t('speaking.shadow.title')}
            desc={t('speaking.shadow.desc')}
            onClick={() => setMode('shadowing')}
          />
        )}
        <HubRow
          icon={<MessageCircle className="w-6 h-6" />}
          iconClass="bg-violet-50 text-violet-700"
          sticker="speak.conversation-partner"
          title={t("site.speakingbuddy.speaking_buddy_cf9c4a")}
          desc={t("site.speakinghub.short_conversations_with_ai_speak_93a156")}
          onClick={() => setMode('buddy')}
        />
      </div>
    </ScreenShell>
  );
}
