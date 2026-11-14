import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import { getDailySession, deriveHeartPractice, type ReviewWord } from '../../lib/bites/dailySession';
import { todayKey } from '../../lib/habitEngine';
import { scopedKey, writeScopedJSON } from '../../lib/userStorage';
import type { BiteDef } from '../../lib/bites/types';
import type { ReadingText } from '../../lib/reading-logic';
import { BiteRunner } from '../Bites/BiteRunner';
import { VocabLearnPhase } from '../Lessons/VocabLearnPhase';
import { fetchWordTranslations } from '../../Exercises';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
import { HeartsChip } from '../Hearts/HeartsChip';
import { loadLessonUnlock } from '../../lib/lessonProgress';
import { playWord } from '../../lib/speech';

interface Practice { lang: string; id: string; items: ReviewWord[] }
function practiceSession(lang: string, items: () => ReviewWord[]): Practice {
  try {
    const saved = JSON.parse(localStorage.getItem(scopedKey('heart_practice_v1')) || 'null');
    if (saved?.lang === lang && Array.isArray(saved.items) && saved.items.length === 6) return saved;
  } catch { /* New session. */ }
  const session = { lang, id: `heart-practice:${Date.now()}`, items: items() };
  writeScopedJSON('heart_practice_v1', session);
  return session;
}

export function ReviewSession({ kind, onExit, onContinue }: { kind: 'today' | 'heart-practice'; onExit: () => void; onContinue: () => void }) {
  const { contentLang, savedVocab, problemWords, level, awardBiteXP, saveWord, previewMode } = useProgress();
  const { dictCode, speechLocale } = useContentLang();
  const { t, uiLang } = useUiLang();
  const texts = useLevelTexts();
  const allTexts: ReadingText[] = useMemo(() => Object.values(texts).flat(), [texts]);
  const session: { id: string; date?: string; items: ReviewWord[] } | null = useMemo(() => {
    if (!allTexts.length) return null;
    if (kind === 'today') {
      const daily = getDailySession(contentLang, level, texts, savedVocab, problemWords);
      return daily ? { id: `today:${daily.date}:${contentLang}`, date: daily.date, items: daily.items } : null;
    }
    const missed = [...Object.keys(problemWords), ...allTexts.flatMap(tx => loadLessonUnlock(contentLang, tx.id).missedWords)];
    return practiceSession(contentLang, () => deriveHeartPractice(contentLang, texts[level], savedVocab, missed, `${contentLang}:${Date.now()}`));
  }, [kind, contentLang, allTexts.length]);
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const glosses = Object.fromEntries(session.items.map(item => [item.word, item.definition]));
    setMeanings(glosses);
    const to = UI_TRANSLATE_CODE[uiLang] || 'en';
    if (dictCode !== to) fetchWordTranslations(Object.keys(glosses), dictCode, to, glosses).then(result => {
      if (!cancelled) setMeanings({ ...glosses, ...result });
    });
    return () => { cancelled = true; };
  }, [session?.id, uiLang, dictCode]);

  if (!session) return <SmartyLoader />;
  if (!session.items.length) return <div className="p-8 m-auto text-center"><p>{t('today.noWords')}</p><button type="button" onClick={onExit} className="mt-5 font-bold underline">{t('bites.backToPath')}</button></div>;
  const newWords = [...new Set<string>(session.items.filter(item => item.source === 'new').map(item => item.word))];
  const title = kind === 'today' ? t('today.biteTitle') : t('hearts.practice');
  const text: ReadingText = { id: session.id, title, text: '', targetSeconds: 180, vocabulary: [...new Map<string, { word: string; definition: string }>(session.items.map(item => [item.word, { word: item.word, definition: item.definition }])).values()] };
  const def: BiteDef = {
    id: session.id, passageId: session.id, index: 0, kind, date: session.date ?? todayKey(), estMinutes: 3, costsHearts: false,
    steps: [...(kind === 'today' && newWords.length ? [{ kind: 'vocab-intro' as const, words: newWords }] : []), { kind: 'word-review', words: session.items.map(item => item.word) }],
  };
  const allVocabMap = new Map<string, string>(allTexts.flatMap(tx => tx.vocabulary.map(v => [v.word.toLowerCase(), v.definition] as const)));
  const passageVocab = Object.fromEntries(text.vocabulary.map(v => [v.word, { definition: meanings[v.word] || v.definition, timestamp: Date.now() }]));
  return <BiteRunner key={def.id} text={text} def={def} contentLang={contentLang} passageVocab={passageVocab} meanings={meanings} allVocabMap={allVocabMap}
    renderVocabIntro={(words, done) => <VocabLearnPhase text={{ ...text, vocabulary: text.vocabulary.filter(v => words.includes(v.word)) }} playWord={word => playWord(word, 1, speechLocale)} hideBack variant="lesson" onBack={onExit} continueLabel={t('smarty.continue')} onLearned={done} onMemorizeWord={(word, definition) => { if (!previewMode) saveWord(word, definition); }} />}
    renderRead={() => null} readResult={null} onStepScore={() => {}}
    onComplete={result => {
      if (kind === 'heart-practice') { try { localStorage.removeItem(scopedKey('heart_practice_v1')); } catch { /* Ignore storage failure. */ } }
      return awardBiteXP(result, title);
    }}
    onExit={onExit} onNext={onContinue} topRight={<HeartsChip />} nextLabel={t('smarty.continue')} retryMisses={kind !== 'heart-practice'}
  />;
}
