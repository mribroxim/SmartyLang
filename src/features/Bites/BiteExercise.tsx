import { useEffect, useMemo, useState } from 'react';
import type { ReadingText } from '../../lib/reading-logic';
import type { ContentLang } from '../../lib/contentLang';
import type { BiteStep } from '../../lib/bites/types';
import {
  DefinitionQuiz,
  WordMatch,
  WordScramble,
  ListeningMatch,
  TrueFalseQuiz,
  SpellingPractice,
  PronunciationDrill,
  SentenceReorder,
  meaningFor,
} from '../../Exercises';
import type { StickerId } from '../../components/stickers/Sticker';
import { LessonRunner, type LessonFeedback } from './lesson/LessonRunner';
import { buildQuestions, v2Questions, NATIVE_KINDS } from './lesson/questions';
import { isV2, itemById, wordImage } from '../../lib/lessons/v2';
import { SceneView, TeachCards } from './lesson/V2Steps';
import { ClozeComponent } from '../Lessons/ClozeComponent';
import { ComprehensionQuestions } from '../Lessons/ComprehensionQuestions';
import { AudioDictation } from '../Lessons/AudioDictation';
import { ReadBackShadowing } from '../Lessons/ReadBackShadowing';
import { splitSentences } from '../Lessons/generators';
import { ReviewQuiz } from './ReviewQuiz';

interface Props {
  step: BiteStep;
  text: ReadingText;
  contentLang: ContentLang;
  passageVocab: Record<string, any>;
  meanings: Record<string, string>;
  allVocabMap: Map<string, string>;
  onComplete: (result: any) => void;
  /** Lesson engine: Smarty's latest reaction, his presenting sticker and the step title. */
  feedback?: LessonFeedback | null;
  presenter?: StickerId;
  title?: string;
  onProgress?: (fraction: number) => void;
  onSkip?: () => void;
  /** Re-ask wrong answers inside the step (default true). */
  retryMisses?: boolean;
}

/** One exercise inside a bite, limited to the bite's words / item cap. */
export function BiteExercise({ step, text, contentLang, passageVocab, meanings, allVocabMap, onComplete, feedback = null, presenter = 'mood.hi-there', title = '', onProgress, onSkip, retryMisses = true }: Props) {
  // Most quiz-style steps run on the lesson engine (Check → feedback sheet); built once per step.
  const v2 = isV2(text) ? text.v2 : null;
  const [questions] = useState(() => {
    if (!NATIVE_KINDS.has(step.kind)) return [];
    const which = ({ 'v2-recognise': 'recognise', 'v2-produce': 'produce', 'v2-scene-quiz': 'scene', 'mission-reply': 'mission' } as const)[step.kind as 'v2-recognise'];
    if (v2 && which) {
      const local = new Map(v2.items.map((i) => [i.id, i.text]));
      const images = new Map(v2.items.map((i) => [i.id, i.image?.id]));
      return v2Questions(v2, which, (id) => local.get(id) ?? itemById(id)?.text, (id) => { const img = images.get(id) ?? itemById(id)?.image?.id; return img ? wordImage(img) : undefined; });
    }
    // One clean meaning per word: no "(noun)" tags, no list of extra senses.
    const clean = (d: string) => d.split(' · ')[0].replace(/^\([^)]*\)\s*/, '').trim();
    const def = (w: string) => clean(meaningFor(w, passageVocab[w], allVocabMap, meanings) || passageVocab[w]?.definition || '');
    const stepWords = step.words?.length ? step.words : Object.keys(passageVocab);
    const defs = Object.fromEntries(stepWords.map((w) => [w, def(w)]).filter(([, d]) => d));
    const all = Object.keys(passageVocab);
    return buildQuestions({
      step,
      defs,
      meaningPool: all.map(def).filter(Boolean),
      wordPool: all,
      sentences: splitSentences(text.text, text.format),
      text,
      lang: contentLang,
    });
  });

  const vocab = useMemo(() => {
    if (!step.words?.length) return passageVocab;
    return Object.fromEntries(step.words.map((w) => [w, passageVocab[w] ?? { definition: meanings[w] || w, timestamp: Date.now() }]));
  }, [step.words, passageVocab, meanings]);

  // An authored step with nothing in it (e.g. no produce tasks) passes straight through.
  const emptyV2 = !!v2 && NATIVE_KINDS.has(step.kind) && !questions.length && ['v2-recognise', 'v2-produce', 'v2-scene-quiz', 'mission-reply'].includes(step.kind);
  useEffect(() => { if (emptyV2) onComplete({ score: 1, total: 1, mistakes: [], correctWords: [] }); }, [emptyV2]);
  const noop = () => {};

  if (v2 && step.kind === 'teach') {
    const want = new Set(step.words ?? []);
    const items = v2.items.filter((i) => want.has(i.text.trim().toLowerCase()));
    return <TeachCards items={items} meanings={meanings} onDone={(words) => onComplete({ score: 1, total: 1, mistakes: [], correctWords: words })} />;
  }
  if (v2 && step.kind === 'scene') return <SceneView lesson={v2} onDone={() => onComplete({ score: 1, total: 1, mistakes: [], correctWords: [] })} />;
  if (emptyV2) return null;
  const n = Object.keys(vocab).length;
  const finishVocab = (result: any) => {
    // Vocab exercises return raw counts, often without a total. Word Match
    // eventually matches every pair, so use first-attempt mistakes for accuracy.
    const total = step.kind === 'word-match' ? Math.min(6, n) : n;
    const missed = new Set((result?.mistakes ?? []).filter((w: unknown) => typeof w === 'string')).size;
    onComplete({ ...result, total: result.total ?? total,
      ...(step.kind === 'word-match' ? { percent: Math.round(100 * Math.max(0, total - missed) / Math.max(1, total)) } : {}),
    });
  };
  const common = {
    savedVocab: vocab,
    meanings,
    allVocabMap,
    onBack: noop,
    onComplete: finishVocab,
    recordExercise: undefined as any,
    hideBack: true,
    hideTranslate: true,
    disableSession: true,
  };

  if (questions.length) {
    return <LessonRunner questions={questions} feedback={feedback} presenter={presenter} title={title} onComplete={onComplete} onProgress={onProgress} onSkip={onSkip} retryMisses={retryMisses} />;
  }

  switch (step.kind) {
    case 'word-review': return <ReviewQuiz text={text} words={step.words ?? []} meanings={meanings} allVocabMap={allVocabMap} onComplete={onComplete} />;
    case 'definition-quiz': return <DefinitionQuiz {...common} keepAllWords />;
    case 'word-match': return <WordMatch {...common} hideDifficulty pairCount={Math.max(2, Math.min(6, n))} />;
    case 'word-scramble': return <WordScramble {...common} />;
    case 'listening-match': return <ListeningMatch {...common} />;
    case 'true-false-quiz': return <TrueFalseQuiz {...common} />;
    case 'spelling-practice': return <SpellingPractice {...common} />;
    case 'pronunciation': return <PronunciationDrill {...common} />;
    case 'sentence-reorder':
      return <SentenceReorder {...common} onComplete={onComplete} sentences={splitSentences(text.text, text.format).slice(0, step.maxItems ?? 4)} />;
    case 'cloze':
      return <ClozeComponent text={text} contentLang={contentLang} onBack={noop} onComplete={onComplete} hideBack maxItems={step.maxItems} />;
    case 'comprehension':
      return <ComprehensionQuestions text={text} contentLang={contentLang} onBack={noop} onComplete={onComplete} hideBack maxItems={step.maxItems} />;
    case 'audio-dictation':
      return <AudioDictation text={text} contentLang={contentLang} onBack={noop} onComplete={onComplete} hideBack maxItems={step.maxItems} sentenceOffset={step.sentenceOffset} />;
    case 'read-back-shadowing':
      return <ReadBackShadowing text={text} contentLang={contentLang} onBack={noop} onComplete={onComplete} focusMode maxItems={step.maxItems} sentenceOffset={splitSentences(text.text, text.format).length > (step.sentenceOffset ?? 0) ? step.sentenceOffset : 0} />;
    default:
      return null;
  }
}
