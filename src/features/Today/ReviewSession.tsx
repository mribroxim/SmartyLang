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
import { fetchWordTranslations } from '../../lib/wordTranslations';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
import { HeartsChip } from '../Hearts/HeartsChip';
import { loadLessonUnlock } from '../../lib/lessonProgress';
import { wordCatalog } from '../../lib/bites/dailySession';
import { refineQueue } from '../../lib/workshop/model';
import { workshopItems } from '../../lib/workshop/store';
import { finishReview, recordReviewStep, startWorkshopBite } from '../../lib/workshop/lessonHooks';

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

export function ReviewSession({ kind, onExit, onContinue }: { kind: 'today' | 'heart-practice' | 'refine'; onExit: () => void; onContinue: () => void }) {
  const { contentLang, savedVocab, problemWords, level, awardBiteXP, previewMode } = useProgress();
  const { dictCode } = useContentLang();
  const { t, uiLang } = useUiLang();
  const texts = useLevelTexts();
  const allTexts: ReadingText[] = useMemo(() => Object.values(texts).flat(), [texts]);
  const session: { id: string; date?: string; items: ReviewWord[]; recall?: string[] } | null = useMemo(() => {
    if (!allTexts.length) return null;
    if (kind === 'refine') {
      const catalog = wordCatalog(allTexts, savedVocab as any, contentLang);
      const shop = workshopItems(contentLang);
      const now = Date.now();
      const missed = [...Object.keys(problemWords), ...allTexts.flatMap(text => loadLessonUnlock(contentLang, text.id).missedWords)]
        .map(word => word.trim().toLowerCase());
      const savedDue = Object.entries(savedVocab).filter(([, item]) => !item.srs || item.srs.nextReviewDate <= now)
        .map(([word]) => word.trim().toLowerCase());
      const urgentMisses = missed.filter(word => !shop[word] || shop[word].due <= now);
      const items = [...new Set([...urgentMisses, ...savedDue, ...refineQueue(shop, now, 10), ...missed])]
        .filter(word => catalog.has(word))
        .slice(0, 10)
        .map(word => ({ word, definition: catalog.get(word)!, source: 'review' as const }));
      const recall = items.map(item => item.word).filter(word => shop[word]?.stage === 2 && !word.includes(' ')).slice(0, 4);
      return { id: `refine:${Date.now()}`, items, recall };
    }
    if (kind === 'today') {
      const daily = getDailySession(contentLang, level, texts, savedVocab, problemWords);
      return { id: `today:${todayKey()}:${contentLang}`, date: daily?.date, items: daily?.items ?? [] };
    }
    const missed = [...Object.keys(problemWords), ...allTexts.flatMap(tx => loadLessonUnlock(contentLang, tx.id).missedWords)];
    return practiceSession(contentLang, () => deriveHeartPractice(contentLang, texts[level], savedVocab, missed, `${contentLang}:${Date.now()}`));
  }, [kind, contentLang, allTexts.length]);
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  useEffect(() => { startWorkshopBite(); }, [session?.id]);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const glosses = Object.fromEntries(session.items.map(item => [item.word, item.definition]));
    setMeanings(glosses);
    const to = UI_TRANSLATE_CODE[uiLang] || 'en';
    if (dictCode !== to) fetchWordTranslations(Object.keys(glosses), dictCode, to, glosses).then(result => {
      if (!cancelled) setMeanings({ ...glosses, ...result });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [session?.id, uiLang, dictCode]);

  if (!session) return <SmartyLoader />;
  if (!session.items.length) return <div className="p-8 m-auto text-center"><p>{t('today.noWords')}</p><button type="button" onClick={onExit} className="mt-5 font-bold underline">{t('bites.backToPath')}</button></div>;
  const words = session.items.map(item => item.word);
  const recallWords = session.recall ?? [];
  const title = kind === 'today' ? t('update.dailyReview') : kind === 'refine' ? t('practice.words') : t('hearts.practice');
  const text: ReadingText = { id: session.id, title, text: '', targetSeconds: 180, vocabulary: [...new Map<string, { word: string; definition: string }>(session.items.map(item => [item.word, { word: item.word, definition: item.definition }])).values()] };
  const def: BiteDef = {
    id: session.id, passageId: session.id, index: 0, kind, date: session.date ?? todayKey(), estMinutes: 3, costsHearts: false,
    steps: [
      { kind: 'word-review', words },
      ...(kind !== 'heart-practice' ? [
        { kind: 'listening-match' as const, words: words.slice(0, 3) },
        { kind: 'pronunciation' as const, words: words.slice(-2) },
      ] : []),
      // Refine also asks you to produce a few words, so they can move up to Recalled.
      ...(kind === 'refine' && recallWords.length >= 2 ? [{ kind: 'spelling-practice' as const, words: recallWords }] : []),
    ],
  };
  const allVocabMap = new Map<string, string>(allTexts.flatMap(tx => tx.vocabulary.map(v => [v.word.toLowerCase(), v.definition] as const)));
  const passageVocab = Object.fromEntries(text.vocabulary.map(v => [v.word, { definition: meanings[v.word] || v.definition, timestamp: Date.now() }]));
  return <BiteRunner key={def.id} text={text} def={def} contentLang={contentLang} passageVocab={passageVocab} meanings={meanings} allVocabMap={allVocabMap}
    renderVocabIntro={() => null}
    renderRead={() => null} readResult={null} onStepScore={score => { if (!previewMode) recordReviewStep(contentLang, score); }}
    onComplete={result => {
      if (kind === 'heart-practice') { try { localStorage.removeItem(scopedKey('heart_practice_v1')); } catch { /* Ignore storage failure. */ } }
      const award = awardBiteXP(result, title);
      return previewMode ? award : { ...award, workshop: finishReview(contentLang, texts) };
    }}
    onExit={onExit} onNext={onContinue} topRight={<HeartsChip />} nextLabel={t('smarty.continue')} retryMisses={kind !== 'heart-practice'}
  />;
}
