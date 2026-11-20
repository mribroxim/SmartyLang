import React, { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Sticker } from '../../components/stickers/Sticker';
import { useLevelTexts } from '../../data/levelTexts';
import type { Level, ReadingText } from '../../lib/reading-logic';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';
import { type LessonPhase, type LessonUnlock, loadLessonUnlock, updateLessonUnlock, maybeAwardLevelCertificate, registerMasteredCheck } from '../../lib/lessonProgress';
import { useProgress } from '../../contexts/ProgressContext';
import { deriveBites } from '../../lib/bites/deriveBites';
import { lessonBiteState, recordBiteCompletion, recordBiteStep } from '../../lib/bites/biteProgress';
import { finishWorkshopBite, prepareWorkshop, recordLessonStep, recycleFor, sectionOf, startWorkshopBite } from '../../lib/workshop/lessonHooks';
import { assessPath, isAuthoredAssessment } from '../../lib/bites/pathAssessments';
import { buildLessonUnits } from '../../lib/lessonUnits';
import { isSectionOpen, sectionComplete } from '../../lib/bites/sections';
import { SmartyLoader } from '../../components/feedback/SmartyLoader';
const PathView = lazy(() => import('../Path/PathView').then(m => ({ default: m.PathView })));
const SectionTest = lazy(() => import('../Path/SectionTest').then(m => ({ default: m.SectionTest })));
const BiteRunner = lazy(() => import('../Bites/BiteRunner').then(m => ({ default: m.BiteRunner })));
const ReviewSession = lazy(() => import('../Today/ReviewSession').then(m => ({ default: m.ReviewSession })));
import { useHearts, loseHeart } from '../../lib/hearts/heartsStore';
import { HeartsChip } from '../Hearts/HeartsChip';
import { HeartsOptions, OutOfHeartsSheet } from '../Hearts/OutOfHeartsSheet';
import { fetchWordTranslations } from '../../lib/wordTranslations';
import { CONTENT_LANG_LABEL, DICT_LANG_CODE } from '../../lib/contentLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { VocabLearnPhase } from './VocabLearnPhase';
import { ReadingView } from '../ReadingView';
import { UNIT_ONE_PILOT_ENABLED } from '../../lib/unitOnePilot/enabled';
const UnitOnePilot = lazy(() => import('../UnitOnePilot/UnitOnePilot').then(m => ({ default: m.UnitOnePilot })));

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

type HubView = 'levels' | 'units' | 'library' | 'lesson' | 'certificate';

interface LessonsViewProps {
  assignedLesson?: { finish: (accuracy: number) => void; exit: () => void };
  path: string[];
  navigatePath: (path: string[], opts?: { replace?: boolean }) => void;
  level: Level;
  setLevel: (l: Level) => void;
  currentTextObj: ReadingText;
  setCurrentTextId: (id: string) => void;
  setIsCustomMode: (v: boolean) => void;
  isRecording: boolean;
  isFinished: boolean;
  setIsFinished: (v: boolean) => void;
  transcript: string;
  setTranscript: (t: string) => void;
  timedMode: boolean;
  setTimedMode: (v: boolean) => void;
  timeLeft: number;
  setTimeLeft: (n: number | ((p: number) => number)) => void;
  realtime: boolean;
  setRealtime: (v: boolean) => void;
  sourceWords: string[];
  displayStatuses: any[];
  rawStatuses: any[];
  activeWordIndex: number;
  activeWordRef: React.RefObject<HTMLSpanElement | null>;
  accuracy: number;
  readAccuracy: number;
  passageAccuracy: number;
  transcriptWords: string[];
  fontScale: number;
  setFontScale: (n: number) => void;
  speechRate: number;
  setSpeechRate: (n: number) => void;
  savedVocab: Record<string, any>;
  setSavedVocab: (v: any) => void;
  playWord: (w: string) => void;
  toggleRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  targetTime: number;
  sessionAudioBlob: Blob | null;
  downloadAudio: (id: string) => void;
  voskLoading: boolean;
  voskReady: boolean;
  isAnalyzing: boolean;
  transcriptionUnavailable: boolean;
  transcriptionFailed: boolean;
  recognitionError: string | null;
  setRecognitionError: (e: string | null) => void;
  allVocabMap: Map<string, string>;
  recordExercise: (type: string, data: any) => void;
  srsDueWords: string[];
  studentName?: string;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (v: boolean) => void;
  // Extra ReadingView props for exact embed
  history: Record<string, any[]>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: any[];
  topicPage: number;
  setTopicPage: (fn: (p: number) => number) => void;
  customText: string;
  setCustomText: (t: string) => void;
  savedCustomTexts: string[];
  setSavedCustomTexts: (fn: (prev: string[]) => string[]) => void;
  isCustomMode: boolean;
  vocabOpen: boolean;
  setVocabOpen: (v: boolean) => void;
  clickedWordInfo: any;
  setClickedWordInfo: (v: any) => void;
  wordModal: any;
  setWordModal: (v: any) => void;
  handleToggleVocab: (word: string, fallbackDef: string) => void;
  handleAddVocab: (word: string, fallbackDef: string) => void;
  hasNextText: boolean;
  hasPrevText: boolean;
  handleNextText: () => void;
  handlePrevText: () => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playingAudioId: string | null;
  setPlayingAudioId: (v: string | null) => void;
  setActiveTab: (tab: string) => void;
  setReadingView: (v: string) => void;
  startingLevel?: Level;
  /** Optional: App uses this for “Continue to Exercises” on the reading stats modal. */
  feedbackContinueRef?: React.MutableRefObject<(() => void) | null>;
}

export function LessonsView(props: LessonsViewProps) {
  const { contentLang, dictCode } = useContentLang();
  const { t, uiLang } = useUiLang();
  const LEVEL_TEXTS = useLevelTexts();
  const { awardBiteXP, previewMode, unlimitedHearts, navigate } = useProgress();
  const hearts = useHearts();
  const routeKind = props.path[0] || 'path';
  const isBite = routeKind === 'bite';
  const routeLevel = LEVELS.find(l => l === props.path[1]);
  const biteLevel = isBite ? LEVELS.find(l => LEVEL_TEXTS[l].some(tx => tx.id === props.path[2])) : undefined;
  const bitePath = useMemo(() => {
    if (!biteLevel) return null;
    const open = previewMode || isSectionOpen(contentLang, biteLevel, LEVEL_TEXTS, props.startingLevel);
    const units = assessPath(contentLang, buildLessonUnits(LEVEL_TEXTS[biteLevel], biteLevel), undefined, previewMode);
    return { open, unit: units.find(entry => entry.unit.lessonIds.includes(props.path[2])) };
  }, [biteLevel, contentLang, LEVEL_TEXTS, previewMode, props.startingLevel, props.path[2]]);
  const biteIndex = /^\d+$/.test(props.path[3] || '') ? Number(props.path[3]) : -1;
  // Older words to mix into Practice: picked once per lesson so the bite plan stays stable.
  const recycle = useMemo(() => props.currentTextObj ? recycleFor(contentLang, props.currentTextObj) : [], [contentLang, props.currentTextObj?.id]);
  const biteDefs = useMemo(() => deriveBites(props.currentTextObj, recycle), [props.currentTextObj, recycle]);
  const biteDef = biteDefs[biteIndex];

  // Copy older progress into the workshop once, and keep the house deliveries current.
  useEffect(() => {
    if (previewMode || !Object.values(LEVEL_TEXTS).some(texts => texts.length)) return;
    prepareWorkshop(contentLang, LEVEL_TEXTS);
  }, [contentLang, LEVEL_TEXTS, previewMode]);
  useEffect(() => { if (biteDef) startWorkshopBite(); }, [biteDef?.id]);

  useEffect(() => {
    const desired = isBite ? biteLevel : routeKind === 'path' ? routeLevel : undefined;
    if (desired && desired !== props.level) props.setLevel(desired);
  }, [isBite, biteLevel, routeKind, routeLevel, props.level]);

  useEffect(() => {
    registerMasteredCheck((lang, id) => {
      if (lang !== contentLang) return false;
      const text = Object.values(LEVEL_TEXTS).flat().find(tx => tx.id === id);
      return !!text && lessonBiteState(lang, text).mastered;
    });
    return () => registerMasteredCheck(null);
  }, [LEVEL_TEXTS, contentLang]);

  const [hubView, setHubView] = useState<HubView>('levels');
  const [phase, setPhase] = useState<LessonPhase>('pre-read');
  const [unlock, setUnlock] = useState<LessonUnlock>(() =>
    loadLessonUnlock(contentLang, props.currentTextObj?.id || ''),
  );
  const [meanings, setMeanings] = useState<Record<string, string>>({});



  const passageVocab = useMemo(() => {
    const entries = (props.currentTextObj?.vocabulary || []).map((v) => [
      v.word.toLowerCase(),
      { definition: meanings[v.word.toLowerCase()] || v.definition, timestamp: Date.now() },
    ]);
    return Object.fromEntries(entries);
  }, [props.currentTextObj, meanings]);

  useEffect(() => {
    if (!props.currentTextObj?.id) return;
    setUnlock(loadLessonUnlock(contentLang, props.currentTextObj.id));
  }, [contentLang, props.currentTextObj?.id]);

  // Record reading scores whenever the user finishes the read phase.
  useEffect(() => {
    if (hubView !== 'lesson' || phase !== 'read') return;
    if (!props.isFinished || props.isRecording || props.transcriptionFailed) return;
    if (props.transcriptionUnavailable) return;
    if (!props.currentTextObj?.id) return;
    const pct = Math.round(props.readAccuracy || 0);
    const next = updateLessonUnlock(contentLang, props.currentTextObj.id, { readingBest: pct });
    setUnlock(next);
  }, [
    props.isFinished, props.isRecording, props.readAccuracy,
    props.transcriptionFailed, props.transcriptionUnavailable,
    hubView, phase, contentLang, props.currentTextObj?.id,
  ]);

  const ensureMeanings = async () => {
    const words = [...(props.currentTextObj?.vocabulary || []).map((v) => v.word), ...recycle];
    if (!words.length) return {};
    const from = dictCode || DICT_LANG_CODE[contentLang] || 'en';
    const to = UI_TRANSLATE_CODE[uiLang] || 'en';
    if (from === to) {
      const defs = Object.fromEntries(
        (props.currentTextObj.vocabulary || []).map((v) => [
          v.word.toLowerCase(),
          (v.definition || v.word).replace(/^\([^)]*\)\s*/, ''),
        ]),
      );
      return defs;
    }
    const glosses: Record<string, string> = {};
    for (const v of props.currentTextObj.vocabulary || []) {
      if (v.definition) {
        glosses[v.word] = v.definition;
        glosses[v.word.toLowerCase()] = v.definition;
      }
    }
    const map = await fetchWordTranslations(words, from, to, glosses);
    const merged: Record<string, string> = {};
    for (const w of words) {
      const key = w.toLowerCase();
      merged[key] = map[w] || map[key] || w;
    }
    return merged;
  };

  useEffect(() => {
    if (hubView !== 'lesson' && !isBite) return;
    let cancelled = false;
    setMeanings({});
    ensureMeanings().then(defs => { if (!cancelled) setMeanings(defs); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubView, isBite, props.currentTextObj?.id, contentLang, uiLang]);

  // After vocab is learned once, never show the pre-read list again.
  useEffect(() => {
    if (hubView !== 'lesson') return;
    if (unlock.vocabPassed && phase === 'pre-read') setPhase('read');
  }, [hubView, unlock.vocabPassed, phase]);


  /** Open exercises tab — reading score persisted if the session just finished. */
  const goToExercises = useCallback(() => {
    if (
      props.isFinished &&
      !props.isRecording &&
      !props.transcriptionFailed &&
      !props.transcriptionUnavailable &&
      props.currentTextObj?.id
    ) {
      const pct = Math.round(props.readAccuracy || 0);
      const next = updateLessonUnlock(contentLang, props.currentTextObj.id, { readingBest: pct });
      setUnlock(next);
    }
    setPhase('exercises');
  }, [
    contentLang,
    props.currentTextObj?.id,
    props.isFinished,
    props.isRecording,
    props.readAccuracy,
    props.transcriptionFailed,
    props.transcriptionUnavailable,
  ]);

  useEffect(() => {
    if (!props.feedbackContinueRef) return;
    props.feedbackContinueRef.current = goToExercises;
    return () => {
      props.feedbackContinueRef!.current = null;
    };
  }, [props.feedbackContinueRef, goToExercises]);



  const renderReading = (embed: { ready: boolean; onBack: () => void; onContinue: () => void; hideNavigation?: boolean }) => (
    <ReadingView
          readingView="practice"
          setReadingView={props.setReadingView}
          setActiveTab={props.setActiveTab}
          level={props.level}
          setLevel={props.setLevel}
          history={props.history}
          searchQuery={props.searchQuery}
          setSearchQuery={props.setSearchQuery}
          searchResults={props.searchResults}
          topicPage={props.topicPage}
          setTopicPage={props.setTopicPage}
          customText={props.customText}
          setCustomText={props.setCustomText}
          savedCustomTexts={props.savedCustomTexts}
          setSavedCustomTexts={props.setSavedCustomTexts}
          isCustomMode={false}
          setIsCustomMode={props.setIsCustomMode}
          isRecording={props.isRecording}
          isFinished={props.isFinished}
          setIsFinished={props.setIsFinished}
          setTranscript={props.setTranscript}
          transcript={props.transcript}
          timedMode={props.timedMode}
          setTimedMode={props.setTimedMode}
          timeLeft={props.timeLeft}
          setTimeLeft={props.setTimeLeft as any}
          realtime={props.realtime}
          setRealtime={props.setRealtime}
          currentTextObj={props.currentTextObj}
          setCurrentTextId={props.setCurrentTextId}
          sourceWords={props.sourceWords}
          displayStatuses={props.displayStatuses}
          rawStatuses={props.rawStatuses}
          activeWordIndex={props.activeWordIndex}
          activeWordRef={props.activeWordRef as any}
          accuracy={props.accuracy}
          readAccuracy={props.readAccuracy}
          passageAccuracy={props.passageAccuracy}
          transcriptWords={props.transcriptWords}
          fontScale={props.fontScale}
          setFontScale={props.setFontScale}
          speechRate={props.speechRate}
          setSpeechRate={props.setSpeechRate}
          vocabOpen={props.vocabOpen}
          setVocabOpen={props.setVocabOpen}
          savedVocab={props.savedVocab}
          setSavedVocab={props.setSavedVocab}
          clickedWordInfo={props.clickedWordInfo}
          setClickedWordInfo={props.setClickedWordInfo}
          wordModal={props.wordModal}
          setWordModal={props.setWordModal}
          playWord={props.playWord}
          handleToggleVocab={props.handleToggleVocab}
          recognitionError={props.recognitionError}
          setRecognitionError={props.setRecognitionError}
          toggleRecording={props.toggleRecording}
          stopRecording={props.stopRecording}
          reset={props.reset}
          hasNextText={false}
          hasPrevText={false}
          handleNextText={props.handleNextText}
          handlePrevText={props.handlePrevText}
          targetTime={props.targetTime}
          sessionAudioBlob={props.sessionAudioBlob}
          downloadAudio={props.downloadAudio}
          showFeedbackModal={props.showFeedbackModal}
          setShowFeedbackModal={props.setShowFeedbackModal}
          currentAudioRef={props.currentAudioRef}
          playingAudioId={props.playingAudioId}
          setPlayingAudioId={props.setPlayingAudioId}
          voskLoading={props.voskLoading}
          voskReady={props.voskReady}
          isAnalyzing={props.isAnalyzing}
          transcriptionUnavailable={props.transcriptionUnavailable}
          transcriptionFailed={props.transcriptionFailed}
          lessonEmbed
          hideLessonNavigation={embed.hideNavigation}
          lessonExercisesReady={embed.ready}
          onLessonBack={embed.onBack}
          onLessonContinue={embed.onContinue}
        />
  );

  const backToPath = () => {
    props.reset();
    props.setShowFeedbackModal(false);
    props.navigatePath(['path', biteLevel || props.level]);
  };
  const startBite = (text: ReadingText, index: number) => {
    props.reset();
    props.setIsCustomMode(false);
    props.setCurrentTextId(text.id);
    props.navigatePath(['bite', contentLang, text.id, String(index)]);
  };

  const reviewExit = () => navigate({ tab: 'practice', path: [] });
  if (routeKind === 'today') return <ReviewSession kind="today" onExit={reviewExit} onContinue={reviewExit} />;
  if (routeKind === 'refine') return <ReviewSession kind="refine" onExit={reviewExit} onContinue={reviewExit} />;
  if (routeKind === 'hearts') {
    const resumeBite = props.path.length === 5 ? () => props.navigatePath(['bite', ...props.path.slice(2)]) : backToPath;
    if (props.path[1] === 'practice') return <ReviewSession kind="heart-practice" onExit={() => props.navigatePath(['hearts'])} onContinue={resumeBite} />;
    return <div className="max-w-md w-full mx-auto px-5 py-8"><HeartsOptions
      onPractice={() => props.navigatePath(['hearts', 'practice'])}
      onToday={unlimitedHearts ? () => props.navigatePath(['today']) : undefined}
      onClose={backToPath}
    /></div>;
  }

  if (routeKind === 'test') {
    const testLevel = LEVELS.find(l => l === props.path[1]);
    if (testLevel) return <SectionTest level={testLevel} onDone={(passed) => props.navigatePath(['path', passed ? testLevel : props.level])} />;
  }

  const unitsFor = (level: Level) => assessPath(contentLang, buildLessonUnits(LEVEL_TEXTS[level], level), undefined, previewMode);
  const checkCertificate = (level: Level) => {
    const texts = LEVEL_TEXTS[level];
    if (!sectionComplete(contentLang, texts, level)) return;
    maybeAwardLevelCertificate(contentLang, level, texts.filter(text => !isAuthoredAssessment(text)).map(text => text.id), props.studentName);
  };
  if (routeKind === 'assessment') {
    if (!Object.values(LEVEL_TEXTS).some(texts => texts.length)) return <SmartyLoader />;
    const level = LEVELS.find(level => level === props.path[1]) ?? props.level;
    const assessment = unitsFor(level).flatMap(({ checkpoints, exam }) => [...checkpoints, exam]).find(check => check.id === props.path[2]);
    const exit = () => props.navigatePath(['path', level]);
    if (!assessment?.ready || !previewMode && !isSectionOpen(contentLang, level, LEVEL_TEXTS, props.startingLevel)) return <div className="m-auto p-6 text-center">
      <p>{t('path.assessmentLocked')}</p><button type="button" className="mt-4 font-bold underline" onClick={exit}>{t('bites.backToPath')}</button>
    </div>;
    return <SectionTest key={`${contentLang}:${assessment.id}`} level={level} assessment={assessment} onDone={exit}
      onPassed={assessment.kind === 'exam' ? () => checkCertificate(level) : undefined} />;
  }

  if (UNIT_ONE_PILOT_ENABLED && contentLang === 'en' && routeKind === 'unit-one') {
    return <UnitOnePilot sessionId={props.path[1]} onOpen={id => props.navigatePath(['unit-one', ...(id ? [id] : [])])}
      onBack={() => props.navigatePath(['path', 'Beginner'])} onOriginal={() => props.navigatePath(['path', 'Beginner', 'original'])} />;
  }

  // The path is the whole Learn tab now: older library pages fall back to it.
  if (!isBite) {
    if (!Object.values(LEVEL_TEXTS).some(texts => texts.length)) return <SmartyLoader sticker="flow.lesson-loading" />;
    return <PathView
      level={routeLevel || props.level}
      setLevel={level => { props.setLevel(level); props.navigatePath(['path', level]); }}
      textsByLevel={LEVEL_TEXTS}
      contentLang={contentLang}
      startingLevel={props.startingLevel}
      onStartBite={startBite}
      onTakeTest={(lvl) => props.navigatePath(['test', lvl])}
      onAssessment={(level, id) => props.navigatePath(['assessment', level, id])}
      preview={previewMode}
      onOpenPilot={() => props.navigatePath(['unit-one'])}
      showOriginalUnitOne={props.path[2] === 'original'}
    />;
  }

  if (isBite) {
    const validLang = Object.hasOwn(CONTENT_LANG_LABEL, props.path[1]);
    if (validLang && (props.path[1] !== contentLang || !Object.values(LEVEL_TEXTS).some(texts => texts.length))) return <SmartyLoader />;
    if (!validLang || !biteLevel || !biteDef || props.currentTextObj.id !== props.path[2]) {
      return <div className="m-auto p-6 text-center flex flex-col items-center">
        <Sticker id="reward.toast" size={150} priority="hero" />
        <p className="font-bold">{t('bites.notFound')}</p>
        <button type="button" onClick={backToPath} className="mt-4 rounded-2xl bg-zinc-900 text-white px-6 py-3 font-bold shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75">{t('bites.backToPath')}</button>
      </div>;
    }
    const within = bitePath?.unit;
    if (!props.assignedLesson && (!bitePath?.open || within && !within.open)) return <div className="m-auto p-6 text-center">
      <p>{t('path.unitExamLocked')}</p><button type="button" className="mt-4 font-bold underline" onClick={backToPath}>{t('bites.backToPath')}</button>
    </div>;
    const currentAssessment = within && [...within.checkpoints, within.exam].find(check => check.authored?.id === props.currentTextObj.id);
    if (currentAssessment) return <div className="m-auto p-6 text-center">
      <button type="button" className="font-bold underline" onClick={() => currentAssessment.ready
        ? props.navigatePath(['assessment', biteLevel, currentAssessment.id]) : backToPath()}>
        {t(currentAssessment.ready ? 'path.start' : 'bites.backToPath')}
      </button>
    </div>;
    const levelTexts = LEVEL_TEXTS[biteLevel];
    const nextText = levelTexts.slice(levelTexts.findIndex(tx => tx.id === props.currentTextObj.id) + 1).find(text => !isAuthoredAssessment(text));
    const nextDef = biteDefs[biteIndex + 1];
    const position = (within?.unit.lessonIds.indexOf(props.currentTextObj.id) ?? -1) + 1;
    const nextCheck = within && [...within.checkpoints, within.exam].find(check => check.end === position && !check.passed);
    const continuePath = () => {
      if (nextDef) return startBite(props.currentTextObj, nextDef.index);
      if (props.assignedLesson) return props.assignedLesson.exit();
      const refreshed = nextCheck && unitsFor(biteLevel).flatMap(({ checkpoints, exam }) => [...checkpoints, exam])
        .find(check => check.id === nextCheck.id);
      if (refreshed?.ready) return props.navigatePath(['assessment', biteLevel, refreshed.id]);
      if (nextCheck?.kind === 'exam' || !nextText) return backToPath();
      startBite(nextText, 0);
    };
    const readResult = props.isFinished && !props.isRecording && !props.transcriptionFailed && !props.transcriptionUnavailable
      ? Math.round(props.readAccuracy) : null;
    const blocked = !props.assignedLesson && biteDef.costsHearts && !unlimitedHearts && !previewMode && hearts.count === 0;
    return <BiteRunner
      key={`${contentLang}:${biteDef.id}`}
      text={props.currentTextObj}
      def={biteDef}
      firstEver={biteDef.index === 0 && LEVEL_TEXTS[biteLevel][0]?.id === props.currentTextObj.id}
      contentLang={contentLang}
      passageVocab={passageVocab}
      meanings={meanings}
      allVocabMap={props.allVocabMap}
      renderVocabIntro={(words, done) => <VocabLearnPhase
        text={{ ...props.currentTextObj, vocabulary: props.currentTextObj.vocabulary.filter(v => words.includes(v.word.toLowerCase())) }}
        playWord={props.playWord}
        onBack={backToPath}
        hideBack
        variant="lesson"
        continueLabel={t('smarty.continue')}
        onLearned={done}
        onMemorizeWord={props.handleAddVocab}
      />}
      renderRead={() => renderReading({ ready: false, onBack: backToPath, onContinue: () => {}, hideNavigation: true })}
      readResult={readResult}
      onStepScore={score => {
        if (previewMode) return;
        recordBiteStep(contentLang, props.currentTextObj.id, score);
        recordLessonStep(contentLang, props.currentTextObj, sectionOf(LEVEL_TEXTS, props.currentTextObj.id), score);
      }}
      onComplete={result => {
        if (!nextDef) props.assignedLesson?.finish(result.accuracy);
        if (!previewMode) {
          recordBiteCompletion(contentLang, result);
          checkCertificate(biteLevel);
        }
        const award = awardBiteXP(result, props.currentTextObj.title);
        return previewMode ? award : { ...award, workshop: finishWorkshopBite(contentLang, LEVEL_TEXTS) };
      }}
      onExit={props.assignedLesson?.exit ?? backToPath}
      onNext={continuePath}
      nextLabel={props.assignedLesson && !nextDef ? t('homework.back') : nextDef || nextText || nextCheck ? t('smarty.continue') : t('bites.backToPath')}
      topRight={<HeartsChip />}
      onMistake={word => {
        if (props.assignedLesson || unlimitedHearts || previewMode) return true;
        if (word) updateLessonUnlock(contentLang, props.currentTextObj.id, { missedWords: [word.toLowerCase()] });
        return loseHeart();
      }}
      paused={blocked}
      pausedOverlay={blocked ? <OutOfHeartsSheet onClose={backToPath} onPractice={() => props.navigatePath(['hearts', 'practice', ...props.path.slice(1)])} /> : undefined}
    />;
  }

  return null;
}
