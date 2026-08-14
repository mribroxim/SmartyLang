import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, ChevronRight, Lock, Mic, Volume2, X, Users,
} from 'lucide-react';
import { useLevelTexts } from '../../data/levelTexts';
import type { Level, ReadingText } from '../../lib/reading-logic';
import { useContentLang } from '../../contexts/ContentLangContext';
import { useUiLang } from '../../contexts/UiLangContext';
import {
  type LessonPhase,
  type LessonUnlock,
  loadLessonUnlock,
  updateLessonUnlock,
  recordLessonExerciseScore,
  lessonExerciseProgress,
  levelProgressSummary,
  maybeAwardLevelCertificate,
  loadCertificateMeta,
} from '../../lib/lessonProgress';
import { fetchWordTranslations } from '../../Exercises';
import { DICT_LANG_CODE } from '../../lib/contentLang';
import { UI_TRANSLATE_CODE } from '../../lib/uiLang';
import { CertificateView } from './CertificateView';
import { VocabLearnPhase } from './VocabLearnPhase';
import { LessonExerciseFlow } from './LessonExerciseFlow';
import { ReadingView } from '../ReadingView';
import { ScreenShell } from '../../components/ScreenShell';
import { LevelCard, LevelCardGrid, LibraryCard, LibraryCardGrid } from '../../components/LevelCards';

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const PAGE_SIZE = 8;

type HubView = 'levels' | 'library' | 'lesson' | 'certificate';

interface LessonsViewProps {
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
}

export function LessonsView(props: LessonsViewProps) {
  const { contentLang, dictCode } = useContentLang();
  const { t, tLevel, uiLang } = useUiLang();
  const LEVEL_TEXTS = useLevelTexts();

  const [hubView, setHubView] = useState<HubView>('levels');
  const [phase, setPhase] = useState<LessonPhase>('pre-read');
  const [libPage, setLibPage] = useState(1);
  const [unlock, setUnlock] = useState<LessonUnlock>(() =>
    loadLessonUnlock(contentLang, props.currentTextObj?.id || ''),
  );
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [certLevel, setCertLevel] = useState<Level>('Beginner');
  const [showRecModal, setShowRecModal] = useState(false);

  const passageIds = useMemo(
    () => (LEVEL_TEXTS[props.level] || []).map((x) => x.id),
    [LEVEL_TEXTS, props.level],
  );

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

  // Soft-gate: only record reading scores after vocab is unlocked and user is reading.
  useEffect(() => {
    if (hubView !== 'lesson' || phase !== 'read') return;
    if (!unlock.vocabPassed) return;
    if (!props.isFinished || props.isRecording || props.transcriptionFailed) return;
    if (props.transcriptionUnavailable) return;
    if (!props.currentTextObj?.id) return;
    const pct = Math.round(props.readAccuracy || 0);
    const next = updateLessonUnlock(contentLang, props.currentTextObj.id, { readingBest: pct });
    setUnlock(next);
    props.setShowFeedbackModal(false);
  }, [
    props.isFinished, props.isRecording, props.readAccuracy,
    props.transcriptionFailed, props.transcriptionUnavailable,
    hubView, phase, unlock.vocabPassed, contentLang, props.currentTextObj?.id,
  ]);

  const ensureMeanings = async () => {
    const words = (props.currentTextObj?.vocabulary || []).map((v) => v.word);
    if (!words.length) return {};
    const from = dictCode || DICT_LANG_CODE[contentLang] || 'en';
    const to = UI_TRANSLATE_CODE[uiLang] || 'en';
    if (from === to) {
      const defs = Object.fromEntries(
        (props.currentTextObj.vocabulary || []).map((v) => [
          v.word.toLowerCase(),
          v.definition || v.word,
        ]),
      );
      setMeanings(defs);
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
      merged[key] =
        map[w] ||
        map[key] ||
        glosses[key] ||
        w;
    }
    setMeanings(merged);
    return merged;
  };

  useEffect(() => {
    if (hubView === 'lesson') ensureMeanings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubView, props.currentTextObj?.id, contentLang, uiLang]);

  // After vocab quiz is passed once, never show vocabulary again.
  useEffect(() => {
    if (hubView !== 'lesson') return;
    if (unlock.vocabPassed && phase === 'pre-read') setPhase('read');
  }, [hubView, unlock.vocabPassed, phase]);

  const openPassage = (level: Level, text: ReadingText) => {
    props.setLevel(level);
    props.setIsCustomMode(false);
    props.setCurrentTextId(text.id);
    props.reset();
    const u = loadLessonUnlock(contentLang, text.id);
    setUnlock(u);
    setShowRecModal(false);
    const hasExerciseProgress = Object.keys(u.exerciseBest || {}).length > 0;
    if (!u.vocabPassed) setPhase('pre-read');
    else if (u.readingBest != null || u.readingPassed || hasExerciseProgress) setPhase('exercises');
    else setPhase('read');
    setHubView('lesson');
  };

  /** Persist current read score (if any) then open exercises — survives leave/return. */
  const goToExercises = () => {
    if (!unlock.vocabPassed) return;
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
  };

  const handleVocabQuizComplete = (result: any): boolean => {
    const expectedTotal = Math.max(
      1,
      (props.currentTextObj?.vocabulary || []).length,
      typeof result.total === 'number' ? result.total : 0,
    );
    const scoreCount = typeof result.score === 'number' ? result.score : (result.correctWords?.length || 0);
    const finalPct =
      typeof result.percent === 'number' && Number.isFinite(result.percent)
        ? Math.min(100, Math.max(0, Math.round(result.percent)))
        : Math.min(100, Math.max(0, Math.round((scoreCount / expectedTotal) * 100)));
    const next = updateLessonUnlock(contentLang, props.currentTextObj.id, {
      vocabQuizScore: finalPct,
    });
    setUnlock(next);
    if (next.vocabPassed) {
      setPhase('read');
      return true;
    }
    return false;
  };

  const handleExerciseComplete = (result: any) => {
    const type = result.type as string;
    let percent = 0;
    if (typeof result.percent === 'number' && Number.isFinite(result.percent)) {
      percent = Math.min(100, Math.max(0, Math.round(result.percent)));
    } else if (
      typeof result.score === 'number' &&
      typeof result.total === 'number' &&
      result.total > 0
    ) {
      percent = Math.min(100, Math.max(0, Math.round((result.score / result.total) * 100)));
    } else {
      const c = Array.isArray(result.correctWords) ? result.correctWords.length : 0;
      const m = Array.isArray(result.mistakes) ? result.mistakes.length : 0;
      if (c + m > 0) {
        percent = Math.round((c / (c + m)) * 100);
      } else if (typeof result.score === 'number') {
        // Already a 0–100 percentage from the exercise itself
        percent = Math.min(100, Math.max(0, Math.round(result.score)));
      }
    }
    // Lesson exercise sessions are separate from Practice → Exercises history.
    const next = recordLessonExerciseScore(
      contentLang,
      props.currentTextObj.id,
      type,
      percent,
      result.mistakes || [],
    );
    setUnlock(next);
    maybeAwardLevelCertificate(contentLang, props.level, passageIds, props.studentName);
    const prog = lessonExerciseProgress(next);
    if (prog.done >= prog.total) setShowRecModal(true);
  };

  // ── Levels — classic themed cards (row on phone, tall cards on desktop)
  if (hubView === 'levels') {
    return (
      <ScreenShell size="wide" title={t('nav.learn')} subtitle="Learn vocab, read aloud, then master exercises.">
          <LevelCardGrid>
            {LEVELS.map((lvl, idx) => {
              const ids = (LEVEL_TEXTS[lvl] || []).map((x) => x.id);
              const summary = levelProgressSummary(contentLang, ids);
              const cert = loadCertificateMeta(contentLang, lvl);
              const pct = summary.total
                ? Math.round((summary.exercisesComplete / summary.total) * 100)
                : 0;
              return (
                <LevelCard
                  key={lvl}
                  title={tLevel(lvl)}
                  desc={`${summary.exercisesComplete}/${summary.total} lessons · ${summary.vocabUnlocked} unlocked`}
                  pct={pct}
                  themeIndex={idx}
                  forYou={props.startingLevel === lvl}
                  certAwarded={!!cert?.awarded}
                  onCertClick={() => { setCertLevel(lvl); setHubView('certificate'); }}
                  onClick={() => { props.setLevel(lvl); setLibPage(1); setHubView('library'); }}
                />
              );
            })}
          </LevelCardGrid>
          <button
            type="button"
            onClick={() => { window.location.hash = '#/classes'; }}
            className="mt-3 md:mt-5 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 flex items-center gap-3.5 text-left shadow-sm hover:shadow-md hover:border-zinc-400 transition-all"
          >
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 text-zinc-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] md:text-lg text-zinc-900 dark:text-zinc-50">{t('nav.myClasses')}</div>
              <div className="text-[12px] md:text-sm text-slate-400">Assignments from your teacher</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
      </ScreenShell>
    );
  }

  if (hubView === 'certificate') {
    return (
      <CertificateView
        level={certLevel}
        contentLang={contentLang}
        studentName={props.studentName}
        onBack={() => setHubView('levels')}
      />
    );
  }

  if (hubView === 'library') {
    const texts = LEVEL_TEXTS[props.level] || [];
    const pages = Math.max(1, Math.ceil(texts.length / PAGE_SIZE));
    const pageItems = texts.slice((libPage - 1) * PAGE_SIZE, libPage * PAGE_SIZE);
    const cert = loadCertificateMeta(contentLang, props.level);
    const summary = levelProgressSummary(contentLang, texts.map((x) => x.id));

    return (
      <ScreenShell size="wide">
          <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 pb-4 md:pb-6 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <button
                type="button"
                onClick={() => setHubView('levels')}
                className="text-sm font-bold text-slate-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2 mb-3 md:mb-4 transition-colors bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-zinc-50 tracking-tight flex items-center gap-3 md:gap-4 flex-wrap">
                {tLevel(props.level)} <span className="text-slate-300 font-sans font-light">|</span>{' '}
                <span className="font-sans text-lg sm:text-xl md:text-2xl text-zinc-900 dark:text-zinc-100 tracking-normal font-medium">Lessons</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 md:mt-2">Choose a lesson — vocabulary unlocks reading, then exercises.</p>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
              <div className="bg-white dark:bg-zinc-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Level progress</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{summary.exercisesComplete}</span>
                  <span className="font-bold text-slate-400">/ {summary.total}</span>
                </div>
              </div>
              {cert?.awarded && (
                <button
                  type="button"
                  onClick={() => { setCertLevel(props.level); setHubView('certificate'); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-sm"
                >
                  <Award className="w-4 h-4" /> Certificate
                </button>
              )}
            </div>
          </header>

          <LibraryCardGrid>
            {pageItems.map((text) => {
              const u = loadLessonUnlock(contentLang, text.id);
              const prog = lessonExerciseProgress(u);
              const done = prog.done >= prog.total && prog.total > 0;
              return (
                <LibraryCard
                  key={text.id}
                  title={text.title}
                  preview={text.text}
                  locked={!u.vocabPassed}
                  done={done}
                  badge={u.readingBest != null ? (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${u.readingPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {u.readingBest}%
                    </span>
                  ) : undefined}
                  meta={`Vocab ${u.vocabPassed ? '✓' : '—'} · Read ${u.readingPassed ? '✓' : u.readingBest != null ? `${u.readingBest}%` : '—'} · Exercises ${prog.done}/${prog.total}`}
                  onClick={() => openPassage(props.level, text)}
                />
              );
            })}
          </LibraryCardGrid>

          {pages > 1 && (
            <div className="mt-6 md:mt-8 flex justify-center items-center gap-4">
              <button
                type="button"
                disabled={libPage <= 1}
                onClick={() => setLibPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 disabled:opacity-30 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-semibold text-slate-500">{libPage} / {pages}</span>
              <button
                type="button"
                disabled={libPage >= pages}
                onClick={() => setLibPage((p) => Math.min(pages, p + 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 disabled:opacity-30 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
      </ScreenShell>
    );
  }

  // After vocab quiz is passed once, Vocabulary never shows again — only Read + Exercises.
  const exercisesUnlocked =
    unlock.readingBest != null ||
    unlock.readingPassed ||
    Object.keys(unlock.exerciseBest || {}).length > 0;
  const phaseTabs: { id: LessonPhase; label: string; locked: boolean }[] = unlock.vocabPassed
    ? [
        { id: 'read', label: 'Read', locked: false },
        { id: 'exercises', label: 'Exercises', locked: !exercisesUnlocked },
      ]
    : [
        { id: 'pre-read', label: 'Vocabulary', locked: false },
        { id: 'read', label: 'Read', locked: true },
        { id: 'exercises', label: 'Exercises', locked: true },
      ];

  // Keep Read | Exercises tabs visible after vocab unlock (including during read),
  // so returning to the passage never hides Exercises.
  const showPhaseChrome = unlock.vocabPassed;

  return (
    <div className="min-h-full">
      {showPhaseChrome && (
      <div className={`sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-slate-200 dark:border-zinc-800 px-4 py-3 ${phase === 'read' ? '' : ''}`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { props.reset(); setHubView('library'); setShowRecModal(false); }}
            className="text-sm font-semibold text-slate-600 hover:text-zinc-900 flex items-center gap-2 transition-all bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {t('action.backToLibrary')}
          </button>
          <span className="font-serif font-bold text-zinc-900 dark:text-zinc-50 truncate flex-1">
            {props.currentTextObj?.title}
          </span>
        </div>
        <div className="max-w-4xl mx-auto flex gap-1 mt-3 overflow-x-auto">
          {phaseTabs.map((tab) => (
            <button
              key={tab.id}
              disabled={tab.locked}
              onClick={() => {
                if (tab.locked) return;
                if (tab.id === 'exercises') goToExercises();
                else setPhase(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                phase === tab.id
                  ? 'bg-zinc-900 text-white'
                  : tab.locked
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.locked && <Lock className="w-3 h-3 inline mr-1" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {phase === 'pre-read' && !unlock.vocabPassed && (
        <VocabLearnPhase
          text={props.currentTextObj}
          allVocabMap={props.allVocabMap}
          playWord={props.playWord}
          onBack={() => setHubView('library')}
          onQuizComplete={handleVocabQuizComplete}
          onMemorizeWord={(word, def) => props.handleAddVocab(word, def)}
        />
      )}

      {phase === 'read' && unlock.vocabPassed && (
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
          showFeedbackModal={false}
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
          lessonExercisesReady={unlock.readingBest != null || unlock.readingPassed}
          onLessonBack={() => setHubView('library')}
          onLessonContinue={goToExercises}
        />
      )}

      {phase === 'exercises' && unlock.vocabPassed && (
        <LessonExerciseFlow
          text={props.currentTextObj}
          contentLang={contentLang}
          passageVocab={passageVocab}
          meanings={meanings}
          allVocabMap={props.allVocabMap}
          unlock={unlock}
          onBack={() => setHubView('library')}
          onExerciseComplete={handleExerciseComplete}
          onReRead={() => setPhase('read')}
          onAllDone={() => setShowRecModal(true)}
        />
      )}

      {/* Recommendations popup */}
      {showRecModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowRecModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Lesson complete</h2>
            <p className="text-slate-500 text-sm mb-5">Recommended next — review these words:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {[...new Set([...(unlock.missedWords || []), ...props.srsDueWords])].slice(0, 16).map((w) => (
                <div
                  key={w}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200"
                >
                  <span className="font-medium capitalize">{w}</span>
                  <button onClick={() => props.playWord(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {[...new Set([...(unlock.missedWords || []), ...props.srsDueWords])].length === 0 && (
                <p className="text-sm text-slate-500">No words due — great work!</p>
              )}
            </div>
            {loadCertificateMeta(contentLang, props.level)?.awarded && (
              <button
                onClick={() => { setShowRecModal(false); setCertLevel(props.level); setHubView('certificate'); }}
                className="w-full mb-3 py-3 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" /> View certificate
              </button>
            )}
            <button
              onClick={() => { setShowRecModal(false); setHubView('library'); }}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold"
            >
              Back to library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
