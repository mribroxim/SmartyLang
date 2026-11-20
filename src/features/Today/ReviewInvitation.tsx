import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Overlay } from '../../components/RewardPopup';
import { Sticker } from '../../components/stickers/Sticker';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import { dailyCompletion, getDailySession } from '../../lib/bites/dailySession';
import { todayKey } from '../../lib/habitEngine';
import { readScopedJSON, writeScopedJSON } from '../../lib/userStorage';
import { ChunkyButton } from '../Bites/lesson/chunky';

export function ReviewInvitation({ uid }: { uid: string }) {
  const { contentLang, level, savedVocab, problemWords, navigate } = useProgress();
  const { t } = useUiLang();
  const texts = useLevelTexts();
  const [open, setOpen] = useState(false);
  const day = todayKey();
  const invite = `${day}:${contentLang}`;
  const key = 'review_invitation_v1';

  useEffect(() => {
    if (readScopedJSON(key, '', uid) === invite || dailyCompletion(contentLang, day)) { setOpen(false); return; }
    setOpen(!!getDailySession(contentLang, level, texts, savedVocab, problemWords));
  }, [uid, invite, day, contentLang, level, texts, savedVocab, problemWords]);

  const dismiss = () => {
    writeScopedJSON(key, invite, uid);
    setOpen(false);
  };

  if (!open) return null;
  const due = getDailySession(contentLang, level, texts, savedVocab, problemWords)?.items?.length;
  return (
    <AnimatePresence>
      <Overlay onClose={dismiss} z={100}>
        <Sticker id="vocab.memory-refresh" size="clamp(110px, 22dvh, 160px)" priority="hero" mode="once" className="mx-auto" />
        <h2 className="mt-2 font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('update.dailyReview')}</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('today.invite')}</p>
        {!!due && <p className="mx-auto mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 font-serif text-sm font-extrabold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">{t('today.inviteSteps', { n: due })}</p>}
        <ChunkyButton autoFocus className="mt-5 w-full" onClick={() => { dismiss(); navigate({ tab: 'lessons', path: ['today'] }); }}>{t('path.start')}</ChunkyButton>
        <button type="button" className="mt-3 w-full py-2 text-sm font-bold text-slate-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={dismiss}>{t('today.later')}</button>
      </Overlay>
    </AnimatePresence>
  );
}
