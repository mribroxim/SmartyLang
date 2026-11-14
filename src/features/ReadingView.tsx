import React, { useState, useRef, useEffect, useMemo } from 'react';
import { writeScopedJSON } from '../lib/userStorage';
import { EmptyState } from '../components/feedback/EmptyState';
import { Level } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { BookOpen, AlertCircle, CheckCircle2, Clock, Volume2, X, ChevronRight, ArrowLeft, Search, PlusCircle, Plus, Mic, Download, RefreshCw, Trash2, Loader2, Square } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { vocabStorageKey } from '../lib/contentLang';
import { speakTextAsync, cancelSpeech } from '../lib/speech';
import { isRtlLang, getPronunciationProfile, tokenizeForLang } from '../lib/pronunciationProfile';
import { looksLikeDialogue, parseDialogue, getSpeakablePassageText } from '../lib/dialogueText';
import { assignDialogueVoices } from '../lib/dialogueVoices';
import {
  SPEECH_RATE_PRESETS,
  SPEECH_RATE_LABELS,
  snapSpeechRate,
  speechRateFromIndex,
  speechRateToIndex,
} from '../lib/speechRates';
import { consumeFlag, READING_RESUME_FLAG, loadReadingSession } from '../lib/midSession';
import { sessionsForLang, matchesContentLang } from '../lib/activityMeta';
import { ScreenShell, HubRow } from '../components/ScreenShell';
import { LevelCard, LevelCardGrid, LibraryCard, LibraryCardGrid } from '../components/LevelCards';

interface ReadingViewProps {
  readingView: string;
  setReadingView: (v: string) => void;
  setActiveTab: (tab: string) => void;
  level: Level;
  setLevel: (l: Level) => void;
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
  setIsCustomMode: (v: boolean) => void;
  isRecording: boolean;
  isFinished: boolean;
  setIsFinished: (v: boolean) => void;
  setTranscript: (t: string) => void;
  transcript: string;
  timedMode: boolean;
  setTimedMode: (v: boolean) => void;
  timeLeft: number;
  setTimeLeft: (fn: (t: number) => number | number) => void;
  realtime: boolean;
  setRealtime: (v: boolean) => void;
  currentTextObj: any;
  setCurrentTextId: (id: string | null) => void;
  sourceWords: string[];
  displayStatuses: string[];
  rawStatuses: string[];
  activeWordIndex: number;
  activeWordRef: React.RefObject<HTMLSpanElement>;
  accuracy: number;
  readAccuracy: number;
  passageAccuracy: number;
  transcriptWords: string[];
  fontScale: number;
  setFontScale: (s: number) => void;
  speechRate: number;
  setSpeechRate: (r: number) => void;
  vocabOpen: boolean;
  setVocabOpen: (v: boolean) => void;
  savedVocab: Record<string, any>;
  setSavedVocab: (fn: (prev: any) => any) => void;
  clickedWordInfo: any;
  setClickedWordInfo: (v: any) => void;
  wordModal: any;
  setWordModal: (v: any) => void;
  playWord: (word: string) => void;
  handleToggleVocab: (word: string, fallbackDef: string) => void;
  recognitionError: string | null;
  setRecognitionError: (v: string | null) => void;
  toggleRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  hasNextText: boolean;
  hasPrevText: boolean;
  handleNextText: () => void;
  handlePrevText: () => void;
  targetTime: number;
  sessionAudioBlob: Blob | null;
  downloadAudio: (textId: string, timestamp?: number) => void;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (v: boolean) => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playingAudioId: string | null;
  setPlayingAudioId: (v: string | null) => void;
  voskLoading: boolean;
  voskReady: boolean;
  isAnalyzing?: boolean;
  transcriptionFailed?: boolean;
  transcriptionUnavailable?: boolean;
  /** When true, only the pronunciation practice UI is shown (Lessons embed). */
  lessonEmbed?: boolean;
  /** BiteRunner supplies its own navigation and completion controls. */
  hideLessonNavigation?: boolean;
  /** When true, show Continue to Exercises even if this session isn't finished yet. */
  lessonExercisesReady?: boolean;
  onLessonBack?: () => void;
  onLessonContinue?: () => void;
}

export function ReadingView(props: ReadingViewProps) {
  const LEVEL_TEXTS = useLevelTexts();
  const { isEnglish, contentLang, speechLocale } = useContentLang();
  const { t, tLevel } = useUiLang();
  const isRtl = isRtlLang(contentLang);
  const pronProfile = getPronunciationProfile(contentLang);
  const wordGapClass = pronProfile.tokenize === 'whitespace' ? 'me-2.5 mb-2' : 'me-0.5 mb-1';
  const [isSpeakingPassage, setIsSpeakingPassage] = useState(false);
  const [listenWordIndex, setListenWordIndex] = useState(-1);
  const listenWordRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isSpeakingPassage || listenWordIndex < 0) return;
    listenWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [listenWordIndex, isSpeakingPassage]);

  const stopPassageListen = () => {
    cancelSpeech();
    setIsSpeakingPassage(false);
    setListenWordIndex(-1);
  };
  const {
    readingView, setReadingView, setActiveTab,
    level, setLevel, history, searchQuery, setSearchQuery, searchResults,
    topicPage, setTopicPage, customText, setCustomText,
    savedCustomTexts, setSavedCustomTexts, isCustomMode, setIsCustomMode,
    isRecording, isFinished, setIsFinished, setTranscript, transcript,
    timedMode, setTimedMode, timeLeft, setTimeLeft, realtime, setRealtime,
    currentTextObj, setCurrentTextId, sourceWords, displayStatuses,
    rawStatuses, activeWordIndex, activeWordRef, readAccuracy, passageAccuracy, transcriptWords,
    fontScale, setFontScale, speechRate, setSpeechRate, vocabOpen, setVocabOpen,
    savedVocab, setSavedVocab, clickedWordInfo, setClickedWordInfo,
    wordModal, setWordModal, playWord, handleToggleVocab,
    recognitionError, setRecognitionError, toggleRecording, stopRecording,
    reset, hasNextText, hasPrevText, handleNextText, handlePrevText,
    targetTime, sessionAudioBlob, downloadAudio,
    showFeedbackModal, setShowFeedbackModal,
    currentAudioRef, playingAudioId, setPlayingAudioId,
    voskLoading, voskReady, isAnalyzing = false, transcriptionFailed = false,
    lessonEmbed = false, lessonExercisesReady = false, onLessonBack, onLessonContinue,
  } = props;

  const effectiveView = lessonEmbed ? 'practice' : readingView;

  const dialogue = useMemo(() => {
    const raw = typeof currentTextObj?.text === 'string' ? currentTextObj.text : '';
    if (!looksLikeDialogue(raw, currentTextObj?.format)) {
      return null;
    }
    const parsed = parseDialogue(raw);
    if (!parsed.isDialogue) return null;
    let offset = 0;
    const turns = parsed.turns.map((t) => {
      const words = tokenizeForLang(t.line, contentLang);
      const start = offset;
      offset += words.length;
      return { ...t, words, startIndex: start };
    });
    return { turns, speakableText: parsed.speakableText };
  }, [currentTextObj?.text, currentTextObj?.format, contentLang]);

  // Dashboard / flag-driven resume of mid-session reading
  useEffect(() => {
    if (!consumeFlag(READING_RESUME_FLAG)) return;
    const snap = loadReadingSession();
    if (!snap || !matchesContentLang(snap, contentLang)) return;
    if (snap.isCustomMode) {
      setIsCustomMode(true);
      if (snap.customText) setCustomText(snap.customText);
    } else {
      setIsCustomMode(false);
      if (snap.level) setLevel(snap.level as Level);
      setCurrentTextId(snap.textId);
    }
    setTimedMode(!!snap.timedMode);
    if (typeof snap.timeLeft === 'number') setTimeLeft(() => snap.timeLeft);
    setTranscript(snap.transcript || '');
    setIsFinished(false);
    setReadingView('practice');
  }, [contentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ── 1. Menu ── */}
      {effectiveView === 'menu' && (
        <ScreenShell title={t('reading.title')} subtitle={t('reading.subtitle')}>
          <HubRow
            icon={<BookOpen className="w-6 h-6" />}
            iconClass="bg-blue-50 text-blue-600"
            sticker="read.page-hunter"
            title={t('reading.comp.title')}
            desc={t('reading.comp.desc')}
            onClick={() => setActiveTab('comprehensive')}
          />
        </ScreenShell>
      )}

      {/* ── 2. Levels ── */}
      {effectiveView === 'levels' && (
        <ScreenShell size="wide" title={t('reading.level.title')} subtitle={t('reading.level.subtitle')}>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('reading.level.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-700/30 focus:border-zinc-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim() ? (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-slate-400">{t('reading.searchResults', { n: searchResults.length })}</p>
              {searchResults.length === 0 ? (
                <EmptyState sticker="state2.no-results" title={t('empty.search.title')} body={t('reading.searchEmpty', { query: searchQuery })} className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl" />
              ) : (
                <LibraryCardGrid>
                  {searchResults.map(text => {
                    const recordArray = sessionsForLang(history[text.id], contentLang);
                    const record = recordArray.length
                      ? recordArray.reduce((best: any, curr: any) => curr.accuracy > best.accuracy ? curr : best, recordArray[0])
                      : null;
                    return (
                      <LibraryCard
                        key={text.id}
                        title={text.title}
                        meta={record ? `${tLevel(text.levelInfo)} · ${record.accuracy}%` : tLevel(text.levelInfo)}
                        done={!!record}
                        badge={
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-zinc-100 text-zinc-900">
                            {tLevel(text.levelInfo)}
                          </span>
                        }
                        onClick={() => {
                          setLevel(text.levelInfo);
                          setCurrentTextId(text.id);
                          setIsCustomMode(false);
                          if (isRecording) stopRecording();
                          setTranscript('');
                          setIsFinished(false);
                          setVocabOpen(false);
                          if (timedMode) setTimeLeft(() => text.targetSeconds || 60);
                          setReadingView('practice');
                        }}
                      />
                    );
                  })}
                </LibraryCardGrid>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <HubRow
                dark
                icon={<PlusCircle className="w-6 h-6" />}
                title={t('custom.practiceTitle')}
                desc={t('custom.practiceDesc')}
                onClick={() => setReadingView('custom-entry')}
              />
              <LevelCardGrid>
                {(['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'] as Level[]).map((l, idx) => {
                  const total = LEVEL_TEXTS[l].length;
                  const completed = LEVEL_TEXTS[l].filter(tx => sessionsForLang(history[tx.id], contentLang).length > 0).length;
                  const percent = Math.round((completed / total) * 100) || 0;
                  return (
                    <LevelCard
                      key={l}
                      title={tLevel(l)}
                      desc={t('common.topicsCompleted', { done: completed, total })}
                      pct={percent}
                      themeIndex={idx}
                      icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
                      onClick={() => {
                        setLevel(l);
                        setTopicPage(() => 1);
                        setReadingView('library');
                      }}
                    />
                  );
                })}
              </LevelCardGrid>
            </div>
          )}
        </ScreenShell>
      )}

      {/* ── 3. Custom Entry ── */}
      {effectiveView === 'custom-entry' && (
        <ScreenShell>
            <button
              onClick={() => setReadingView('levels')}
              className="text-[13px] font-semibold text-zinc-900 flex items-center gap-1 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
            </button>

            <div className="bg-white rounded-2xl p-4 md:p-5 border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center shrink-0">
                     <PlusCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-[18px] font-serif font-black text-zinc-900 tracking-tight">{t('custom.pasteTitle')}</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">{t('custom.pasteSubtitle')}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wider ml-1">{t('custom.yourText')}</label>
                    <textarea
                      placeholder={t('custom.placeholder')}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full h-48 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-700 transition-all text-[15px] leading-relaxed resize-none scrollbar-hide"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
                     <div className="flex items-center gap-2 text-slate-400 text-sm italic ml-1">
                        <BookOpen className="w-4 h-4" />
                        {t('common.wordsDetected', { n: customText.trim().split(/\s+/).filter(Boolean).length })}
                     </div>
                     <div className="flex flex-col flex-wrap sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                          disabled={!customText.trim() || savedCustomTexts.includes(customText.trim())}
                          onClick={() => {
                            const trimmed = customText.trim();
                            if (trimmed && !savedCustomTexts.includes(trimmed)) {
                              setSavedCustomTexts(prev => {
                                const next = [trimmed, ...prev];
                                writeScopedJSON('readmaster_saved_custom_texts', next);
                                return next;
                              });
                            }
                          }}
                          className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-2xl transition-all shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
                        >
                          {t('custom.saveText')}
                        </button>
                        <button
                          disabled={!customText.trim()}
                          onClick={() => {
                            setIsCustomMode(true);
                            setIsFinished(false);
                            setTranscript('');
                            setReadingView('practice');
                          }}
                          className="w-full sm:w-auto px-10 py-5 bg-zinc-900 hover:bg-black disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl transition-all shadow-lg shadow-zinc-200 hover:shadow-xl hover:-translate-y-1 active:scale-95"
                        >
                          {t('custom.startSession')}
                        </button>
                     </div>
                  </div>
               </div>

               {savedCustomTexts.length > 0 && (
                 <div className="mt-12 space-y-4">
                   <h2 className="font-serif text-xl font-extrabold text-slate-800">{t('custom.savedList')}</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {savedCustomTexts.map((text, idx) => (
                       <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-zinc-300 transition-all cursor-pointer group flex flex-col justify-between shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]" onClick={() => setCustomText(text)}>
                          <p className="text-slate-600 line-clamp-3 mb-4">{text}</p>
                          <div className="flex items-center justify-between text-sm">
                             <span className="text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-md">{t('common.wordsCount', { n: text.split(/\s+/).filter(Boolean).length })}</span>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSavedCustomTexts(prev => {
                                   const next = prev.filter((_, i) => i !== idx);
                                   writeScopedJSON('readmaster_saved_custom_texts', next);
                                   return next;
                                 });
                               }}
                               className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
        </ScreenShell>
      )}

      {/* ── 4. Library ── */}
      {effectiveView === 'library' && (
        <ScreenShell size="wide">
          <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 md:pb-6 border-b border-slate-200">
            <div>
              <button
                onClick={() => setReadingView('levels')}
                className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
              >
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
                {tLevel(level)} <span className="text-slate-300 font-sans font-light">|</span>{' '}
                <span className="font-sans text-lg md:text-xl text-zinc-900 font-medium">{t('library.title')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border-2 border-slate-200 flex flex-col items-center shrink-0 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('library.levelProgress')}</span>
              <span className="text-2xl font-black text-zinc-900">
                {LEVEL_TEXTS[level].filter(tx => sessionsForLang(history[tx.id], contentLang).length > 0).length}
                <span className="text-slate-300 font-light mx-1">/</span>
                {LEVEL_TEXTS[level].length}
              </span>
            </div>
          </header>

            {/* Continue where you left off */}
            {(() => {
              let snap: any = null;
              try { snap = JSON.parse(localStorage.getItem('reading_session_v1') || 'null'); } catch {}
              const hasSnap = (snap?.textId || snap?.customText) && matchesContentLang(snap, contentLang);
              const lastHistId = Object.keys(history).filter(id => sessionsForLang(history[id], contentLang).length > 0).sort((a, b) => {
                const ta = sessionsForLang(history[a], contentLang).slice(-1)[0]?.timestamp || 0;
                const tb = sessionsForLang(history[b], contentLang).slice(-1)[0]?.timestamp || 0;
                return tb - ta;
              })[0];
              if (!hasSnap && !lastHistId) return null;
              const title = hasSnap
                ? (snap.isCustomMode ? 'Custom text' : (LEVEL_TEXTS[level]?.find((t: any) => t.id === snap.textId)?.title || snap.textId))
                : (LEVEL_TEXTS[level]?.find((t: any) => t.id === lastHistId)?.title || 'Last passage');
              return (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                  <p className="font-bold text-slate-800 text-sm truncate">{hasSnap ? `${t('library.resumeSession')} · ${title}` : title}</p>
                  {hasSnap && snap.timedMode && (
                    <p className="text-xs text-emerald-700 mt-0.5">{snap.timeLeft}{t("learning.s.left.on.timer.40a95b")}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (hasSnap) {
                      if (snap.isCustomMode) {
                        setIsCustomMode(true);
                        if (snap.customText) setCustomText(snap.customText);
                      } else {
                        setIsCustomMode(false);
                        if (snap.level) setLevel(snap.level as Level);
                        setCurrentTextId(snap.textId);
                      }
                      setTimedMode(!!snap.timedMode);
                      if (typeof snap.timeLeft === 'number') setTimeLeft(() => snap.timeLeft);
                      setTranscript(snap.transcript || '');
                      setIsFinished(false);
                      if (isRecording) stopRecording();
                      setReadingView('practice');
                      return;
                    }
                    if (lastHistId) {
                      setCurrentTextId(lastHistId);
                      setIsCustomMode(false);
                      if (isRecording) stopRecording();
                      setTranscript('');
                      setIsFinished(false);
                      setReadingView('practice');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors shrink-0"
                >
                  {t('dash.continue')}
                </button>
              </div>
              );
            })()}

            <LibraryCardGrid>
              {LEVEL_TEXTS[level].slice((topicPage - 1) * 8, topicPage * 8).map(text => {
                const recordArray = sessionsForLang(history[text.id], contentLang);
                const record = recordArray.length
                  ? recordArray.reduce((best: any, curr: any) => curr.accuracy > best.accuracy ? curr : best, recordArray[0])
                  : null;
                return (
                  <LibraryCard
                    key={text.id}
                    title={text.title}
                    meta={record ? `${record.accuracy}%` : t('library.unread')}
                    done={!!record && record.accuracy >= 80}
                    onClick={() => {
                      setCurrentTextId(text.id);
                      setIsCustomMode(false);
                      if (isRecording) stopRecording();
                      setTranscript('');
                      setIsFinished(false);
                      setVocabOpen(false);
                      if (timedMode) setTimeLeft(() => text.targetSeconds || 60);
                      setReadingView('practice');
                    }}
                  />
                );
              })}
            </LibraryCardGrid>
            {Math.ceil(LEVEL_TEXTS[level].length / 8) > 1 && (
              <div className="mt-6 flex justify-center items-center gap-4">
                <button
                  disabled={topicPage === 1}
                  onClick={() => setTopicPage(p => Math.max(1, p - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-30 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] font-semibold text-slate-500">{topicPage} / {Math.ceil(LEVEL_TEXTS[level].length / 8)}</span>
                <button
                  disabled={topicPage >= Math.ceil(LEVEL_TEXTS[level].length / 8)}
                  onClick={() => setTopicPage(p => p + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-30 shadow-sm"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
        </ScreenShell>
      )}

      {/* ── 5. Practice ── */}
      {effectiveView === 'practice' && (
        <>
          <main className={`flex-grow flex flex-col items-center px-4 py-4 md:px-12 md:py-10 overflow-y-auto w-full bg-white dark:bg-zinc-950 relative ${lessonEmbed ? 'pb-36' : 'pb-[calc(64px+7rem)] lg:pb-32'}`}>


            <div className={`max-w-4xl w-full flex items-center mb-4 relative z-10 gap-3 flex-wrap ${lessonEmbed ? 'justify-end' : 'justify-between'}`}>
               {!lessonEmbed && (
               <button
                  onClick={() => {
                    cancelSpeech();
                    setIsSpeakingPassage(false);
                    setListenWordIndex(-1);
                    if(isRecording) stopRecording();
                    if (isCustomMode) {
                      setReadingView('custom-entry');
                    } else {
                      setReadingView('library');
                    }
                  }}
                  className="text-sm font-semibold text-slate-600 hover:text-zinc-900 flex items-center gap-2 transition-all bg-white hover:bg-slate-50 px-3 py-1.5 rounded-2xl border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
                >
                  <ArrowLeft className="w-4 h-4" /> {isCustomMode ? t('action.backToEntry') : t('action.backToLibrary')}
                </button>
               )}
                {lessonEmbed && !props.hideLessonNavigation && (isFinished || lessonExercisesReady) && (
                  <button
                    onClick={() => onLessonContinue?.()}
                    className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm"
                  >{t("learning.continue.to.exercises.318bcb")}{' '}<ChevronRight className="w-4 h-4 inline" />
                  </button>
                )}
            </div>

            <div className={`relative z-10 w-full max-w-3xl ${lessonEmbed ? '' : 'rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#27272a] sm:p-6 md:p-8'}`}>
              {recognitionError ? (
                 <div className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium border border-rose-100 mb-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                   <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                   </div>
                   <div className="flex-1 text-center sm:text-left">
                     <p className="font-bold text-base mb-1">{t("learning.microphone.connection.issue.e4bb60")}</p>
                     <p className="text-rose-500 mb-3 text-sm">{recognitionError}</p>
                     <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                       <button
                         onClick={() => {
                           setRecognitionError(null);
                           toggleRecording();
                         }}
                         className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md hover:shadow-rose-200 text-sm"
                       >{t("action.tryAgain")}</button>
                       <button
                         onClick={() => setRecognitionError(null)}
                         className="px-4 py-1.5 bg-white text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-50 transition-all text-sm"
                       >{t("smarty.dismiss")}</button>
                     </div>
                   </div>
                 </div>
              ) : null}

              <header className="mb-5 flex flex-col gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 font-serif text-[11px] font-extrabold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <BookOpen className="h-3 w-3" />{isCustomMode ? t('custom.label') : tLevel(level)}
                    <span className="text-slate-400">· {t('read.wordsCount', { n: sourceWords.length })}</span>
                  </span>
                  <h1 className="mt-2 font-serif text-2xl font-extrabold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">{currentTextObj.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={async () => {
                      if (isSpeakingPassage) {
                        stopPassageListen();
                        return;
                      }
                      const raw =
                        typeof currentTextObj?.text === 'string' ? currentTextObj.text : '';
                      setIsSpeakingPassage(true);
                      setListenWordIndex(0);
                      try {
                        if (dialogue) {
                          const voiceMap = assignDialogueVoices(
                            dialogue.turns.map((t) => t.speaker),
                            (speechLocale || contentLang || 'en').split('-')[0].toLowerCase(),
                          );
                          for (const turn of dialogue.turns) {
                            if (!turn.words.length) continue;
                            const voice = turn.speaker
                              ? voiceMap.get(turn.speaker)
                              : undefined;
                            const ok = await speakTextAsync(turn.line, speechRate, speechLocale, {
                              words: turn.words,
                              voice,
                              onWordIndex: (localIdx) => {
                                setListenWordIndex(turn.startIndex + localIdx);
                              },
                            });
                            if (!ok) break;
                          }
                        } else {
                          const passage =
                            getSpeakablePassageText(raw, currentTextObj?.format).trim()
                            || sourceWords.join(' ');
                          if (!passage.trim()) return;
                          await speakTextAsync(passage, speechRate, speechLocale, {
                            words: sourceWords,
                            onWordIndex: setListenWordIndex,
                          });
                        }
                      } finally {
                        setIsSpeakingPassage(false);
                        setListenWordIndex(-1);
                      }
                    }}
                    className={`dark-keep inline-flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none sm:flex-none sm:px-5 ${isSpeakingPassage ? 'bg-rose-500 text-white shadow-[0_3px_0_0_#9f1239]' : 'bg-zinc-900 text-white shadow-[0_3px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa]'}`}>
                    {isSpeakingPassage ? <><Square className="h-4 w-4 fill-current" />{t('learning.stop.9e2534')}</> : <><Volume2 className="h-4 w-4" />{t('lesson.listen')}</>}
                  </button>
                  <button type="button" onClick={() => setFontScale(fontScale >= 5 ? 1 : fontScale + 1)} aria-label={t('learning.size.b71523')} title={t('learning.size.b71523')}
                    className="inline-flex h-11 min-w-[52px] items-center justify-center gap-0.5 rounded-2xl border-2 border-slate-200 bg-white px-3 font-serif font-extrabold text-zinc-800 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_3px_0_0_#3f3f46]">
                    <span className="text-xs">A</span><span className="text-lg leading-none">A</span>
                    <span className="ml-1 flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= fontScale ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-slate-200 dark:bg-zinc-700'}`} />)}</span>
                  </button>
                  <button type="button" onClick={() => { const i = speechRateToIndex(speechRate); setSpeechRate(speechRateFromIndex(i >= SPEECH_RATE_PRESETS.length - 1 ? 0 : i + 1)); }}
                    aria-label={t('learning.adjust.speech.speed.19fdae')} title={t('learning.speed.2d2cb0')}
                    className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-3 font-serif text-xs font-extrabold text-zinc-800 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_3px_0_0_#3f3f46]">
                    <Clock className="h-4 w-4 text-slate-400" />{SPEECH_RATE_LABELS[snapSpeechRate(speechRate)]}
                  </button>
                </div>
              </header>

              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                lang={speechLocale || contentLang}
                className={`relative rounded-2xl border-2 border-slate-200 bg-white p-4 font-semibold leading-[1.8] text-zinc-800 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:p-6 ${
                fontScale === 1 ? 'text-lg md:text-xl' :
                fontScale === 2 ? 'text-xl md:text-2xl' :
                fontScale === 3 ? 'text-xl md:text-3xl' :
                fontScale === 4 ? 'text-2xl md:text-4xl' :
                'text-3xl md:text-5xl'
              }`}>
                {(() => {
                  const renderWord = (word: string, i: number) => {
                  const status = displayStatuses[i];
                  let colorClass = 'text-slate-800 transition-colors duration-300 hover:text-zinc-700 cursor-pointer';
                  let extraElements = null;
                  let opacityClass = '';

                  if (isSpeakingPassage && listenWordIndex >= 0) {
                    // Spotify-style: upcoming words dim; spoken + current fully visible
                    if (i < listenWordIndex) {
                      opacityClass = 'opacity-100';
                      colorClass = 'text-slate-800 transition-opacity duration-200 cursor-pointer';
                    } else if (i === listenWordIndex) {
                      opacityClass = 'opacity-100';
                      colorClass = 'text-zinc-950 font-semibold transition-opacity duration-200 cursor-pointer';
                    } else {
                      opacityClass = 'opacity-[0.28]';
                      colorClass = 'text-slate-800 transition-opacity duration-200 cursor-pointer';
                    }
                  } else if (status === 'correct') {
                    colorClass = 'text-emerald-500 transition-colors duration-300 hover:text-emerald-400 cursor-pointer';
                  } else if (status === 'slight_mistake') {
                    colorClass = 'text-orange-400 transition-colors duration-300 hover:text-orange-300 cursor-pointer underline decoration-orange-200 decoration-2 underline-offset-4';
                  } else if (status === 'incorrect') {
                    colorClass = 'text-rose-500 transition-colors duration-300 hover:text-rose-400 cursor-pointer underline decoration-rose-200 decoration-4 underline-offset-4';
                  } else if (i === activeWordIndex) {
                    colorClass = 'text-zinc-900 relative transition-colors duration-300 cursor-pointer';
                    extraElements = (
                      <>
                        <span className="absolute -bottom-1 left-0 w-full h-[4px] bg-zinc-700 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 pointer-events-none shadow-md font-sans">{t("learning.reading.48b240")}</span>
                      </>
                    );
                  } else if (status === 'pending' && !isRecording && !isFinished) {
                    colorClass = 'text-slate-700 transition-colors duration-300 hover:text-slate-500 cursor-pointer';
                  }

                  const isListenCurrent = isSpeakingPassage && i === listenWordIndex;

                  return (
                    <span
                      key={i}
                      ref={isListenCurrent ? listenWordRef : (i === activeWordIndex ? activeWordRef : null)}
                      className={`group inline-block relative ${wordGapClass} ${colorClass} ${opacityClass}`}
                    >
                      <span onClick={() => {
                        const cleanWord = word.replace(/[^\p{L}\p{M}'’-]/gu, '');
                        if (clickedWordInfo?.index === i) {
                          setClickedWordInfo(null);
                        } else {
                          setClickedWordInfo({ word, index: i, cleanWord });
                        }
                      }} title={t("learning.click.for.options.36aec8")}>
                        {word}
                      </span>
                      {clickedWordInfo?.index === i && (
                        <WordPopover
                          word={clickedWordInfo.word}
                          cleanWord={clickedWordInfo.cleanWord}
                          sentence={sentenceAroundWord(sourceWords, i, contentLang)}
                          savedVocab={savedVocab}
                          onPlay={(w) => playWord(w)}
                          onToggleVocab={async (w) => handleToggleVocab(w, 'From reading practice')}
                          onShowModal={(w, mode) => {
                             setWordModal({ word: w, mode });
                             setClickedWordInfo(null);
                          }}
                          onClose={() => setClickedWordInfo(null)}
                        />
                      )}
                      {extraElements}
                    </span>
                  );
                  };

                  if (dialogue) {
                    return (
                      <div className="flex flex-col gap-4 md:gap-5">
                        {dialogue.turns.map((turn, ti) => (
                          <div key={ti} className="block">
                            {turn.speaker ? (
                              <div className="pointer-events-none mb-1 inline-flex select-none rounded-full bg-slate-100 px-2.5 py-0.5 font-serif text-[0.55em] font-extrabold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                {turn.speaker}
                              </div>
                            ) : null}
                            <div className="block">
                              {turn.words.map((word, wi) => renderWord(word, turn.startIndex + wi))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return sourceWords.map((word, i) => renderWord(word, i));
                })()}
              </div>

              {currentTextObj.vocabulary && currentTextObj.vocabulary.length > 0 && (
                <details
                  className="text-left mt-16 bg-slate-50 rounded-2xl border-2 border-slate-200 group overflow-hidden"
                  open={vocabOpen}
                  onToggle={(e) => setVocabOpen((e.target as HTMLDetailsElement).open)}
                >
                  <summary className="font-serif font-extrabold text-lg text-slate-800 p-6 flex items-center justify-between cursor-pointer list-none hover:bg-slate-100 transition-colors select-none">
                    <span className="flex items-center gap-3">
                       <BookOpen className="w-5 h-5 text-zinc-900" />{t("learning.key.vocabulary.74d366")}<button
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           setSavedVocab(prev => {
                             const missingWords = (currentTextObj.vocabulary || []).filter(
                               (w: any) => !prev[w.word.toLowerCase()]
                             );
                             if (missingWords.length === 0) return prev;
                             const next = { ...prev };
                             missingWords.forEach((w: any) => {
                               next[w.word.toLowerCase()] = { definition: w.definition, timestamp: Date.now() };
                             });
                             localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next));
                             return next;
                           });
                         }}
                         disabled={(currentTextObj.vocabulary || []).every(
                           (w: any) => !!savedVocab[w.word.toLowerCase()]
                         )}
                         className={`ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                           (currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                             ? 'text-emerald-600 bg-emerald-50 border-emerald-200 cursor-default'
                             : 'text-zinc-900 bg-zinc-100 border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300'
                         }`}
                         title={
                           (currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                             ? t("learning.all.key.vocabulary.added.bec002")
                             : t("learning.add.all.key.vocabulary.words.to.my.vocabulary.a5734a")
                         }
                       >
                         {(currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                           ? <CheckCircle2 className="w-3.5 h-3.5" />
                           : <Plus className="w-3.5 h-3.5" />
                         }
                         {(currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                           ? t("learning.added.b68734")
                           : t("learning.add.all.39c724")
                         }
                       </button>
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-slate-200">
                    <ul className="space-y-4">
                      {currentTextObj.vocabulary.map((v: any, i: number) => {
                        const isSaved = !!savedVocab[v.word.toLowerCase()];
                        return (
                          <li key={i} className="text-slate-600 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 group">
                            <span
                              onClick={() => playWord(v.word)}
                              className="font-bold text-slate-900 min-w-[120px] cursor-pointer hover:text-zinc-900 transition-colors flex items-center gap-2"
                              title={t("learning.click.to.hear.pronunciation.78cd5a")}
                            >
                              {v.word}
                              <Volume2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <span className="text-slate-600 leading-relaxed flex-1"><span className="hidden sm:inline text-slate-300 mr-2">-</span>{v.definition}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSavedVocab(prev => {
                                  const next = { ...prev };
                                  if (isSaved) {
                                    delete next[v.word.toLowerCase()];
                                  } else {
                                    next[v.word.toLowerCase()] = { definition: v.definition, timestamp: Date.now() };
                                  }
                                  localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next));
                                  return next;
                                });
                              }}
                              className={`ml-auto shrink-0 p-1.5 rounded-lg transition-colors border ${isSaved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-400 border-slate-200 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'}`}
                              title={isSaved ? t("learning.remove.from.my.vocabulary.68146d") : t("learning.add.to.my.vocabulary.c6eb1d")}
                            >
                              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>
              )}

              {!lessonEmbed && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-slate-100">
                <button
                  disabled={!hasPrevText}
                  onClick={handlePrevText}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />{' '}{t("learning.previous.lesson.83fd4c")}</button>
                <button
                  disabled={!hasNextText}
                  onClick={handleNextText}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-100 text-black rounded-xl text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >{t("learning.next.lesson.74ed89")}{' '}<ChevronRight className="w-4 h-4" />
                </button>
              </div>
              )}
              {lessonEmbed && !props.hideLessonNavigation && (isFinished || lessonExercisesReady) && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => onLessonBack?.()}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t('action.backToLibrary')}
                  </button>
                  <button
                    onClick={() => onLessonContinue?.()}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >{t("learning.continue.to.exercises.318bcb")}{' '}<ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Footer: progress strip on top, a big mic in the middle, small toggles on the right */}
          <footer
            className={`fixed left-0 right-0 z-30 border-t-2 border-slate-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 lg:left-64 xl:left-72 ${lessonEmbed ? 'bottom-0 lg:left-0 xl:left-0' : 'bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0'}`}
            style={lessonEmbed ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
          >
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800">
              <div className="h-full bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100" style={{ width: `${sourceWords.length ? (Math.max(0, isFinished ? sourceWords.length : activeWordIndex) / sourceWords.length) * 100 : 0}%` }} />
            </div>
            <div className="mx-auto grid h-[84px] max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
              {/* left: score or progress */}
              <div className="min-w-0">
                {isFinished ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('bites.kind.read')}</span>
                    <span className={`font-serif text-xl font-extrabold leading-none ${transcriptionFailed ? 'text-slate-400' : 'text-emerald-600'}`}>{transcriptionFailed ? t('learning.n.a.08d2e9') : `${readAccuracy}%`}</span>
                  </div>
                ) : timedMode && isRecording ? (
                  <span className="inline-flex items-center gap-1 font-serif text-lg font-extrabold text-rose-500"><Clock className="h-4 w-4" />{t('learning.seconds', { n: timeLeft })}</span>
                ) : (
                  <span className="font-serif text-lg font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">{Math.max(0, activeWordIndex)}<span className="text-sm text-slate-400">/{sourceWords.length}</span></span>
                )}
              </div>

              {/* centre: mic */}
              <div className="relative" data-preview-block>
                <button
                  onClick={isAnalyzing ? undefined : toggleRecording}
                  disabled={!!recognitionError || isAnalyzing}
                  title={isRecording ? t('learning.stop.9e2534') : isAnalyzing ? t('learning.analyzing.3331cd') : isFinished ? t('learning.play.again.65a693') : t('reading.comp.cta')}
                  className={`dark-keep flex h-16 w-16 items-center justify-center rounded-full border-[3px] transition-[transform,box-shadow] duration-75 active:translate-y-[4px] active:shadow-none disabled:opacity-60 ${
                    isRecording ? 'animate-pulse border-rose-700 bg-rose-500 text-white shadow-[0_4px_0_0_#9f1239]'
                    : isAnalyzing ? 'border-zinc-300 bg-zinc-100 text-zinc-500 shadow-[0_4px_0_0_#d4d4d8]'
                    : isFinished ? 'border-emerald-700 bg-emerald-500 text-white shadow-[0_4px_0_0_#047857]'
                    : 'border-zinc-900 bg-zinc-900 text-white shadow-[0_4px_0_0_#000] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_4px_0_0_#a1a1aa]'}`}
                >
                  {isRecording ? <span className="h-5 w-5 rounded-md bg-white" /> : isAnalyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : isFinished ? <RefreshCw className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
                </button>
                {(isFinished || isAnalyzing) && sessionAudioBlob && (
                  <button onClick={() => downloadAudio(currentTextObj.id)} title={t('learning.download.recording.306b5e')}
                    className="absolute left-full top-1/2 ml-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-900">
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* right: timed / live / restart */}
              <div className="flex items-center justify-end gap-1.5">
                <button type="button" onClick={() => { if (!isRecording) setTimedMode(!timedMode); setTimeLeft(() => targetTime); }} disabled={isRecording}
                  aria-pressed={timedMode} title={t('learning.timed.1c19d5')}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors disabled:opacity-50 ${timedMode ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark-keep' : 'border-slate-200 text-slate-400 dark:border-zinc-700'}`}>
                  <Clock className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setRealtime(!realtime)} aria-pressed={realtime} title={t('learning.live.65c821')}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 font-serif text-[10px] font-extrabold uppercase transition-colors ${realtime ? 'border-emerald-600 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 dark:border-zinc-700'}`}>
                  {t('read.live')}
                </button>
                
              </div>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
