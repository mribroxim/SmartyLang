import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import { todayKey } from '../../lib/habitEngine';
import type { BiteDef, BiteStep } from '../../lib/bites/types';
import type { Level, ReadingText } from '../../lib/reading-logic';
import { SECTIONS, SECTION_PASS, passSectionTest } from '../../lib/bites/sections';
import { UNIT_PASS, saveAssessment, type PathAssessment } from '../../lib/bites/pathAssessments';
import { seededPick } from '../../lib/bites/deriveBites';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
import { ScreenShell } from '../../components/ScreenShell';
import { BiteRunner } from '../Bites/BiteRunner';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { fetchWordTranslations } from '../../lib/wordTranslations';
import { readPreferredTranslationCode } from '../../lib/preferredTranslationLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';

export function SectionTest({ level, assessment, onDone, onPassed }: { level: Level; assessment?: PathAssessment; onDone: (passed: boolean) => void; onPassed?: () => void }) {
  const { contentLang, awardBiteXP, previewMode } = useProgress();
  const { dictCode } = useContentLang();
  const { t, tLevel, uiLang } = useUiLang();
  const texts = useLevelTexts();
  const lessons = assessment?.lessons ?? texts[level];
  const id = assessment?.id ?? `section-test:${level}`;
  const exam = !!assessment;
  const authored = assessment?.authored;
  const authoredSteps: BiteStep[] = [];
  if (authored?.v2.practice.some(task => ['choice', 'listen', 'match'].includes(task.kind))) authoredSteps.push({ kind: 'v2-recognise' });
  if (authored?.v2.practice.some(task => !['choice', 'listen', 'match'].includes(task.kind))) authoredSteps.push({ kind: 'v2-produce' });
  if (authored?.v2.story.questions.length) authoredSteps.push({ kind: 'v2-scene-quiz' });
  const useAuthored = !!authored && authoredSteps.length > 0;
  const { words, definitions } = useMemo(() => {
    const byLesson = (exam ? lessons : lessons.slice(0, 30)).map(lesson => lesson.vocabulary
      .filter(v => v.definition && v.word.trim()).map(v => [v.word.trim().toLowerCase(), v.definition] as const));
    const definitions = Object.fromEntries(byLesson.flat());
    const limit = assessment?.kind === 'checkpoint' ? 6 : 12;
    const sample = exam ? byLesson.flatMap((items, i) => seededPick(items, 1, `${id}:${i}`).map(([word]) => word)) : [];
    const words = [...new Set([...sample, ...seededPick(Object.keys(definitions), limit, id)])].slice(0, limit);
    return { words, definitions };
  }, [lessons, exam, assessment?.kind, id]);
  const [meanings, setMeanings] = useState<Record<string, string> | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const to = readPreferredTranslationCode() || UI_TRANSLATE_CODE[uiLang] || 'en';
    if (useAuthored || !words.length || dictCode === to) { setMeanings(definitions); return; }
    let cancelled = false;
    fetchWordTranslations(words, dictCode, to, {}).then((result) => {
      if (cancelled) return;
      const translated = Object.fromEntries(words.flatMap(word => {
        const value = result[word]?.trim();
        return value && value.toLowerCase() !== word ? [[word, value]] : [];
      }));
      setMeanings(exam ? { ...definitions, ...translated } : translated);
    }).catch(() => { if (!cancelled) setMeanings(exam ? definitions : {}); });
    return () => { cancelled = true; };
  }, [words.join('|'), dictCode, uiLang, exam, useAuthored]);

  if (!lessons.length || !meanings) return <SmartyLoader sticker="flow.level-check" />;
  const usable = words.filter(w => meanings[w]);
  const title = assessment ? t(assessment.kind === 'checkpoint' ? 'path.checkpoint' : 'path.unitExam')
    : t('path.testTitle', { n: SECTIONS.indexOf(level) + 1, level: tLevel(level) });
  const threshold = assessment ? UNIT_PASS : SECTION_PASS;
  const close = <ChunkyButton onClick={() => onDone((score ?? 0) >= threshold)}>{t('bites.backToPath')}</ChunkyButton>;
  if (assessment && score !== null) return <ScreenShell title={title}>
    <p className="mb-4 font-bold">{t(score >= threshold ? 'path.assessmentPassed' : 'path.assessmentRetry', { score, threshold })}</p>
    {close}
  </ScreenShell>;
  if (!useAuthored && usable.length < 2) return <ScreenShell title={title}>
    <p className="mb-4">{t('path.assessmentUnavailable')}</p>{close}
  </ScreenShell>;
  const vocabulary = usable.map(word => ({ word, definition: meanings[word] }));
  const text: ReadingText = useAuthored ? authored : { id, title, text: '', targetSeconds: 300, vocabulary };
  const def: BiteDef = {
    id, passageId: id, index: 0, kind: assessment?.kind === 'exam' ? 'unit-exam' : 'section-test', date: todayKey(), estMinutes: 5, costsHearts: false,
    steps: useAuthored ? authoredSteps : [{ kind: 'definition-quiz', words: usable }, { kind: 'listening-match', words: usable.slice(0, 5) }, { kind: 'spelling-practice', words: usable.slice(-4) }],
  };
  return (
    <BiteRunner key={id} text={text} def={def} contentLang={contentLang}
      passageVocab={Object.fromEntries(vocabulary.map(({ word, definition }) => [word, { definition, timestamp: Date.now() }]))}
      meanings={meanings} allVocabMap={new Map(vocabulary.map(({ word, definition }) => [word, definition]))}
      renderVocabIntro={() => null} renderRead={() => null} readResult={null} onStepScore={() => {}}
      onComplete={(result) => {
        const accuracy = assessment ? Math.round((result.scores ?? []).reduce((total, step) => total + (step.skipped ? 0 : step.percent), 0) / def.steps.length)
          : (result.scores?.some(step => !step.skipped) ? result.accuracy : 0);
        if (!previewMode) {
          if (assessment) {
            saveAssessment(contentLang, assessment.id, accuracy);
            if (accuracy >= threshold) onPassed?.();
          }
          else if (accuracy >= SECTION_PASS) passSectionTest(contentLang, level);
        }
        setScore(accuracy);
        if (!assessment || assessment.kind === 'exam' && !assessment.passed && accuracy >= threshold) {
          return awardBiteXP({ ...result, accuracy }, title);
        }
      }}
      onExit={() => onDone(false)} onNext={() => onDone((score ?? 0) >= threshold)}
      nextLabel={t('smarty.continue')} retryMisses={false} />
  );
}
