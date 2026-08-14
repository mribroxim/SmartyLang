import React, { useState } from 'react';
import { Headphones, Mic } from 'lucide-react';
import { ComprehensiveListening } from './ComprehensiveListening';
import { ListeningDictation } from './ListeningDictation';
import { IELTSListening } from './IELTSListening';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow } from '../components/ScreenShell';

type ListeningView = 'menu' | 'comprehensive' | 'dictation' | 'ielts';

function parseView(raw?: string): ListeningView {
  if (raw === 'comprehensive' || raw === 'dictation' || raw === 'ielts') return raw;
  return 'menu';
}

export function ListeningPractice({
  onBack,
  onToggleVocab,
  savedVocab = {},
  onShowModal,
  initialLevel,
  initialPassageTitle,
  accountProfile,
  recordExercise,
  navView,
  onNavView,
  onIeltsBack,
}: any) {
  const { isEnglish } = useContentLang();
  const { t } = useUiLang();
  const controlled = typeof onNavView === 'function';
  const [localView, setLocalView] = useState<ListeningView>(
    initialLevel && initialPassageTitle && isEnglish
      ? 'comprehensive'
      : (!isEnglish ? 'dictation' : 'menu')
  );

  const view: ListeningView = !isEnglish
    ? 'dictation'
    : controlled
      ? parseView(navView)
      : localView;

  const setView = (v: ListeningView) => {
    if (controlled) onNavView(v === 'menu' ? '' : v);
    else setLocalView(v);
  };

  if (view === 'comprehensive' && isEnglish) {
    return (
      <ComprehensiveListening
        onBack={() => setView('menu')}
        onToggleVocab={onToggleVocab}
        savedVocab={savedVocab}
        onShowModal={onShowModal}
        initialLevel={initialLevel}
        initialPassageTitle={initialPassageTitle}
        accountProfile={accountProfile}
      />
    );
  }

  if (view === 'dictation') {
    return (
      <ListeningDictation
        onBack={() => (isEnglish ? setView('menu') : onBack?.())}
        onToggleVocab={onToggleVocab}
        savedVocab={savedVocab}
        onShowModal={onShowModal}
      />
    );
  }

  if (view === 'ielts' && isEnglish) {
    return (
      <IELTSListening
        onBack={() => (onIeltsBack ? onIeltsBack() : setView('menu'))}
        recordExercise={recordExercise}
      />
    );
  }

  return (
    <ScreenShell title={t('listening.title')} subtitle={t('listening.subtitle')}>
      <div className="flex flex-col gap-2">
        <HubRow
          icon={<Headphones className="w-6 h-6" />}
          iconClass="bg-blue-50 text-blue-600"
          title={t('listening.comp.title')}
          desc={t('listening.comp.desc')}
          onClick={() => setView('comprehensive')}
        />
        <HubRow
          icon={<Mic className="w-6 h-6" />}
          iconClass="bg-emerald-50 text-emerald-600"
          title={t('listening.dict.title')}
          desc={t('listening.dict.desc')}
          onClick={() => setView('dictation')}
        />
      </div>
    </ScreenShell>
  );
}
