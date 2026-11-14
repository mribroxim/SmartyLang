import { useMemo, useState } from 'react';
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
import { buildQuestions, NATIVE_KINDS } from './lesson/questions';
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
}

/** One exercise inside a bite, limited to the bite's words / item cap. */
export function BiteExercise({ step, text, contentLang, passageVocab, meanings, allVocabMap, onComplete, feedback = null, presenter = 'mood.hi-there', title = '', onProgress, onSkip }: Props) {
  // Most quiz-style steps run on the lesson engine (Check → feedback sheet); built once per step.
  const [questions] = useState(() => {
    if (!NATIVE_KINDS.has(step.kind)) return [];
    const def = (w: string) => meaningFor(w, passageVocab[w], allVocabMap, meanings) || passageVocab[w]?.definition || '';
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

  const noop = () => {};
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
    return <LessonRunner questions={questions} feedback={feedback} presenter={presenter} title={title} onComplete={onComplete} onProgress={onProgress} onSkip={onSkip} />;
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
