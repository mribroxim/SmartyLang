import React from 'react';
import { BookOpen, Headphones, Mic, PenLine, GraduationCap, Brain, Award } from 'lucide-react';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { ScreenShell, HubRow, seGrid2 } from '../../components/ScreenShell';

interface Props {
  setActiveTab: (tab: string) => void;
  setReadingView?: (view: string) => void;
}

export function PracticeHub({ setActiveTab }: Props) {
  const { t } = useUiLang();
  const { isEnglish } = useContentLang();

  const items = [
    { tab: 'reading', label: t('nav.reading'), desc: 'Passages with comprehension questions at every level', Icon: BookOpen, color: 'bg-emerald-50 text-emerald-700' },
    { tab: 'listening', label: t('nav.listening'), desc: 'Dictation and listening comprehension', Icon: Headphones, color: 'bg-sky-50 text-sky-700' },
    { tab: 'speaking', label: t('nav.speaking'), desc: 'Speaking topics and shadowing practice', Icon: Mic, color: 'bg-rose-50 text-rose-700' },
    { tab: 'writing', label: t('nav.writing'), desc: 'Writing tasks and prompts', Icon: PenLine, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <ScreenShell title={t('nav.practice')} subtitle="Free practice — doesn't count toward lesson progress.">
      <div className={seGrid2}>
        {items.map(({ tab, label, desc, Icon, color }) => (
          <HubRow
            key={tab}
            icon={<Icon className="w-6 h-6" />}
            iconClass={color}
            title={label}
            desc={desc}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      <div className="mt-5 lg:mt-8 pt-4 lg:pt-6 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 lg:mb-3.5">Vocabulary</div>
        <div className={seGrid2}>
          <HubRow
            icon={<GraduationCap className="w-6 h-6" />}
            iconClass="bg-amber-50 text-amber-700"
            title="My Vocabulary"
            desc="Saved words & spaced repetition"
            onClick={() => setActiveTab('vocabulary')}
          />
          <HubRow
            icon={<Brain className="w-6 h-6" />}
            iconClass="bg-slate-100 text-zinc-700"
            title={t('nav.exercises')}
            desc="Quizzes, match, spelling, and more"
            onClick={() => setActiveTab('exercises')}
          />
          {isEnglish && (
            <HubRow
              icon={<Award className="w-6 h-6" />}
              iconClass="bg-violet-50 text-violet-700"
              title={t('nav.ielts')}
              desc="Full exam practice"
              onClick={() => setActiveTab('ielts')}
            />
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
