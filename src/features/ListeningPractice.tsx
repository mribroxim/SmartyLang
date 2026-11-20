import { useState } from 'react';
import { Headphones, Mic } from 'lucide-react';
import { ComprehensiveListening } from './ComprehensiveListening';
import { ListeningDictation } from './ListeningDictation';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { ScreenShell, HubRow } from '../components/ScreenShell';

type ListeningView = 'menu' | 'comprehensive' | 'dictation';

function parseView(raw?: string): ListeningView {
  if (raw === 'comprehensive' || raw === 'dictation') return raw;
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
  assigned,
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

  const view: ListeningView = !isEnglish && !assigned
    ? 'dictation'
    : controlled
      ? parseView(navView)
      : localView;

  const setView = (v: ListeningView) => {
    if (controlled) onNavView(v === 'menu' ? '' : v);
    else setLocalView(v);
  };

  if (view === 'comprehensive' && (isEnglish || assigned)) {
    return (
      <ComprehensiveListening
        onBack={() => assigned ? onBack?.() : setView('menu')}
        assigned={assigned}
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

  return (
    <ScreenShell title={t('listening.title')} subtitle={t('listening.subtitle')}>
      <div className="flex flex-col gap-2">
        <HubRow
          icon={<Headphones className="w-6 h-6" />}
          iconClass="bg-blue-50 text-blue-600"
          sticker="listen.sound-detective"
          title={t('listening.comp.title')}
          desc={t('listening.comp.desc')}
          onClick={() => setView('comprehensive')}
        />
        <HubRow
          icon={<Mic className="w-6 h-6" />}
          iconClass="bg-emerald-50 text-emerald-600"
          sticker="listen.sound-catcher"
          title={t('listening.dict.title')}
          desc={t('listening.dict.desc')}
          onClick={() => setView('dictation')}
        />
      </div>
    </ScreenShell>
  );
}
