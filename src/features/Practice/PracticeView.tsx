import { Crown } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { canPractice } from '../../lib/access';
import { ScreenShell, seGrid3, seRow } from '../../components/ScreenShell';
import { Sticker, type StickerId } from '../../components/stickers/Sticker';
import { exerciseCatalog, EXERCISE_STICKERS } from '../ExercisesView';

export function PracticeView({ onExercise }: { onExercise: (id: string) => void }) {
  const { t } = useUiLang();
  const { accountProfile, navigate } = useProgress();
  const cards: { title: string; sticker: StickerId; action: () => void; premium?: boolean }[] = [
    { title: t('update.dailyReview'), sticker: 'vocab.memory-refresh', action: () => navigate({ tab: 'lessons', path: ['today'] }), premium: !canPractice(accountProfile) },
    { title: t('update.tutor'), sticker: 'speak.conversation-partner', action: () => navigate({ tab: 'profile', path: ['speak'] }) },
    { title: t('practice.words'), sticker: 'vocab.word-garden', action: () => navigate({ tab: 'lessons', path: ['refine'] }) },
  ];
  return (
    <ScreenShell stickers={['game.challenge-accepted', 'state.playtime']} title={t('nav.practice')}>
      <div className={seGrid3}>
        {cards.map(({ title, sticker, action, premium }) => (
          <button key={sticker} type="button" className={`${seRow} font-serif font-extrabold`} onClick={action}>
            <Sticker id={sticker} size={64} mode="still" className="shrink-0" />
            <span className="flex-1">{title}</span>
            {premium && <Crown aria-label="SmartyLang Max" className="h-5 w-5 shrink-0 text-amber-500" />}
          </button>
        ))}
      </div>
      <section className="mt-7" aria-labelledby="self-practice">
        <h2 id="self-practice" className="mb-3 font-serif text-lg font-extrabold">{t('practice.yourself')}</h2>
        <div className={seGrid3}>
          {exerciseCatalog(t).map(exercise => (
            <button key={exercise.id} type="button" className={`${seRow} font-serif font-extrabold`} onClick={() => onExercise(exercise.id)}>
              <Sticker id={EXERCISE_STICKERS[exercise.id]} size={48} mode="still" className="shrink-0" />
              {exercise.title}
            </button>
          ))}
        </div>
      </section>
    </ScreenShell>
  );
}
