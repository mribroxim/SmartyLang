import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useLevelTexts } from '../../data/levelTexts';
import { todayKey } from '../../lib/habitEngine';
import type { BiteDef } from '../../lib/bites/types';
import type { Level, ReadingText } from '../../lib/reading-logic';
import { SECTIONS, SECTION_PASS, passSectionTest } from '../../lib/bites/sections';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
import { BiteRunner } from '../Bites/BiteRunner';
import { fetchWordTranslations } from '../../Exercises';
import { readPreferredTranslationCode } from '../../lib/preferredTranslationLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/**
 * Jump test for a section: words from the start of that section, asked as
 * translations, listening and spelling. Score 80%+ to open the section.
 */
export function SectionTest({ level, onDone }: { level: Level; onDone: (passed: boolean) => void }) {
  const { contentLang, awardBiteXP } = useProgress();
  const { dictCode } = useContentLang();
  const { t, tLevel, uiLang } = useUiLang();
  const texts = useLevelTexts();
  const lessons: ReadingText[] = texts[level] || [];
  const words = useMemo(() => {
    const pool = [...new Set(lessons.slice(0, 30).flatMap((tx) => tx.vocabulary.map((v) => v.word.toLowerCase())))];
    return shuffle(pool).slice(0, 12);
  }, [lessons.length, level]);
  const [meanings, setMeanings] = useState<Record<string, string> | null>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (!words.length) return;
    const to = readPreferredTranslationCode() || UI_TRANSLATE_CODE[uiLang] || 'en';
    const defs = Object.fromEntries(lessons.flatMap((tx) => tx.vocabulary.map((v) => [v.word.toLowerCase(), v.definition] as const)));
    if (dictCode === to) { setMeanings(Object.fromEntries(words.map((w) => [w, defs[w] || '']))); return; }
    let cancelled = false;
    fetchWordTranslations(words, dictCode, to, {}).then((r) => {
      if (cancelled) return;
      const out: Record<string, string> = {};
      for (const w of words) { const tr = (r[w] || '').trim(); if (tr && tr.toLowerCase() !== w) out[w] = tr; }
      setMeanings(out);
    }).catch(() => { if (!cancelled) setMeanings({}); });
    return () => { cancelled = true; };
  }, [words.join('|'), dictCode, uiLang]);

  if (!lessons.length || !meanings) return <SmartyLoader sticker="flow.level-check" />;
  const usable = words.filter((w) => meanings[w]);
  if (usable.length < 4) { onDone(false); return null; }
  const id = `section-test:${level}`;
  const title = t('path.testTitle', { n: SECTIONS.indexOf(level) + 1, level: tLevel(level) });
  const text: ReadingText = { id, title, text: '', targetSeconds: 300, vocabulary: usable.map((w) => ({ word: w, definition: meanings[w] })) };
  const def: BiteDef = {
    id, passageId: id, index: 0, kind: 'section-test', date: todayKey(), estMinutes: 5, costsHearts: false,
    steps: [{ kind: 'definition-quiz', words: usable }, { kind: 'listening-match', words: usable.slice(0, 5) }, { kind: 'spelling-practice', words: usable.slice(5, 9).length >= 2 ? usable.slice(5, 9) : usable.slice(0, 4) }],
  };
  return (
    <BiteRunner key={id} text={text} def={def} contentLang={contentLang}
      passageVocab={Object.fromEntries(usable.map((w) => [w, { definition: meanings[w], timestamp: Date.now() }]))}
      meanings={meanings} allVocabMap={new Map<string, string>(usable.map((w) => [w, meanings[w]]))}
      renderVocabIntro={() => null} renderRead={() => null} readResult={null} onStepScore={() => {}}
      onComplete={(result) => {
        const ok = result.accuracy >= SECTION_PASS;
        if (ok) passSectionTest(contentLang, level);
        setPassed(ok);
        return awardBiteXP(result, title);
      }}
      onExit={() => onDone(false)} onNext={() => onDone(passed)} nextLabel={t('smarty.continue')} retryMisses={false} />
  );
}
