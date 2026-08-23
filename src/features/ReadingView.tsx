import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Level } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import {
  BookOpen, AlertCircle, CheckCircle2, Clock, Volume2, X, ChevronRight,
  ArrowLeft, Search, PlusCircle, Type, Plus, Mic, Download, Target,
  AlignLeft, Award, RefreshCw, Trash2, Loader2, Square
} from 'lucide-react';
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
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-700/30 focus:border-zinc-700"
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
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500">{t('reading.searchEmpty', { query: searchQuery })}</p>
                </div>
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

            <div className="bg-white rounded-xl p-4 md:p-5 border border-slate-200">
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
                      className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-700 transition-all text-[15px] leading-relaxed resize-none scrollbar-hide"
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
                                localStorage.setItem('readmaster_saved_custom_texts', JSON.stringify(next));
                                return next;
                              });
                            }
                          }}
                          className="w-full sm:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-600 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-2xl transition-all shadow-sm"
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
                   <h2 className="text-xl font-bold text-slate-800">{t('custom.savedList')}</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {savedCustomTexts.map((text, idx) => (
                       <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between" onClick={() => setCustomText(text)}>
                          <p className="text-slate-600 line-clamp-3 mb-4">{text}</p>
                          <div className="flex items-center justify-between text-sm">
                             <span className="text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-md">{t('common.wordsCount', { n: text.split(/\s+/).filter(Boolean).length })}</span>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSavedCustomTexts(prev => {
                                   const next = prev.filter((_, i) => i !== idx);
                                   localStorage.setItem('readmaster_saved_custom_texts', JSON.stringify(next));
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
                className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
                {tLevel(level)} <span className="text-slate-300 font-sans font-light">|</span>{' '}
                <span className="font-sans text-lg md:text-xl text-zinc-900 font-medium">{t('library.title')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
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
                    <p className="text-xs text-emerald-700 mt-0.5">{snap.timeLeft}s left on timer</p>
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
          <main className="flex-grow flex flex-col items-center px-4 py-4 md:px-12 md:py-10 overflow-y-auto w-full bg-white dark:bg-zinc-950 relative pb-[calc(64px+0.75rem)] lg:pb-20">


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
                  className="text-sm font-semibold text-slate-600 hover:text-zinc-900 flex items-center gap-2 transition-all bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-4 h-4" /> {isCustomMode ? t('action.backToEntry') : t('action.backToLibrary')}
                </button>
               )}
                {lessonEmbed && (isFinished || lessonExercisesReady) && (
                  <button
                    onClick={() => onLessonContinue?.()}
                    className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm"
                  >
                    Continue to Exercises <ChevronRight className="w-4 h-4 inline" />
                  </button>
                )}
            </div>

            <div className="max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-10 border border-slate-200 dark:border-zinc-700 shadow-xl shadow-slate-200/50 relative z-10 transition-all">
              {recognitionError ? (
                 <div className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium border border-rose-100 mb-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                   <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                   </div>
                   <div className="flex-1 text-center sm:text-left">
                     <p className="font-bold text-base mb-1">Microphone Connection Issue</p>
                     <p className="text-rose-500 mb-3 text-sm">{recognitionError}</p>
                     <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                       <button
                         onClick={() => {
                           setRecognitionError(null);
                           toggleRecording();
                         }}
                         className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md hover:shadow-rose-200 text-sm"
                       >
                         Try Again
                       </button>
                       <button
                         onClick={() => setRecognitionError(null)}
                         className="px-4 py-1.5 bg-white text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-50 transition-all text-sm"
                       >
                         Dismiss
                       </button>
                     </div>
                   </div>
                 </div>
              ) : null}

              <header className="flex flex-col gap-3 mb-5 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 text-zinc-900 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">
                      <BookOpen className="w-3 h-3" />
                      {isCustomMode ? t('custom.label') : tLevel(level)}
                    </div>
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-snug">{currentTextObj.title}</h1>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 bg-slate-50 dark:bg-zinc-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-zinc-700">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Words</span>
                      <span className="text-base font-mono font-bold text-slate-800 leading-tight">{sourceWords.length}</span>
                    </div>
                    <div className="w-px h-7 bg-slate-200"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Target</span>
                      <span className="text-base font-mono font-bold text-slate-800 flex items-center gap-1 leading-tight">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {targetTime}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Type className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider shrink-0">Size</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={fontScale}
                        onChange={(e) => setFontScale(parseInt(e.target.value))}
                        className="flex-1 min-w-0 max-w-[7rem] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-600 w-3">{fontScale}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider shrink-0">Speed</span>
                      <input
                        type="range"
                        min={0}
                        max={SPEECH_RATE_PRESETS.length - 1}
                        step={1}
                        value={speechRateToIndex(speechRate)}
                        onChange={(e) => setSpeechRate(speechRateFromIndex(parseInt(e.target.value, 10)))}
                        className="flex-1 min-w-0 max-w-[7rem] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        aria-label="Adjust speech speed"
                        aria-valuetext={SPEECH_RATE_LABELS[snapSpeechRate(speechRate)]}
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-600 w-12 text-right">
                        {SPEECH_RATE_LABELS[snapSpeechRate(speechRate)]}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
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
                    className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isSpeakingPassage
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-zinc-900 text-white hover:bg-black'
                    }`}
                  >
                    {isSpeakingPassage ? (
                      <><Square className="w-3.5 h-3.5 fill-current" /> Stop</>
                    ) : (
                      <><Volume2 className="w-3.5 h-3.5" /> Listen</>
                    )}
                  </button>
                </div>
              </header>

              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                lang={speechLocale || contentLang}
                className={`font-serif leading-[1.8] text-slate-800 transition-all duration-300 relative ${
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
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 pointer-events-none shadow-md font-sans">
                          Reading...
                        </span>
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
                      }} title="Click for options">
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
                              <div className="font-sans text-[0.65em] md:text-[0.55em] font-bold uppercase tracking-wider text-zinc-500 mb-1 select-none pointer-events-none">
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
                  className="text-left mt-16 bg-slate-50 rounded-2xl border border-slate-200 group overflow-hidden"
                  open={vocabOpen}
                  onToggle={(e) => setVocabOpen((e.target as HTMLDetailsElement).open)}
                >
                  <summary className="font-bold text-lg text-slate-800 p-6 flex items-center justify-between cursor-pointer list-none hover:bg-slate-100 transition-colors select-none">
                    <span className="flex items-center gap-3">
                       <BookOpen className="w-5 h-5 text-zinc-900" />
                       Key Vocabulary
                       <button
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
                             ? "All key vocabulary added"
                             : "Add all key vocabulary words to My Vocabulary"
                         }
                       >
                         {(currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                           ? <CheckCircle2 className="w-3.5 h-3.5" />
                           : <Plus className="w-3.5 h-3.5" />
                         }
                         {(currentTextObj.vocabulary || []).every((w: any) => !!savedVocab[w.word.toLowerCase()])
                           ? "Added"
                           : "Add All"
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
                              title="Click to hear pronunciation"
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
                              title={isSaved ? "Remove from My Vocabulary" : "Add to My Vocabulary"}
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
                  className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous Lesson
                </button>
                <button
                  disabled={!hasNextText}
                  onClick={handleNextText}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-100 text-black rounded-xl text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  Next Lesson <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              )}
              {lessonEmbed && (isFinished || lessonExercisesReady) && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => onLessonBack?.()}
                    className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t('action.backToLibrary')}
                  </button>
                  <button
                    onClick={() => onLessonContinue?.()}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Exercises <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Footer Controls — same height as MobileNav (64px); sits flush above it, no overhang */}
          <footer
            className="fixed left-0 right-0 lg:left-64 xl:left-72 h-[64px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-700 px-3 md:px-8 flex items-center justify-between z-30 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0"
          >

            {/* Left Side: Stats */}
            <div className="flex items-center gap-3 md:gap-5 min-w-0">
              <div className="flex flex-col items-start">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold leading-none mb-0.5">Read</span>
                <span className={`text-sm md:text-base font-mono font-bold tracking-tight leading-none ${isFinished && !transcriptionFailed ? 'text-emerald-500' : 'text-slate-800 dark:text-zinc-100'}`}>
                   {isFinished ? (transcriptionFailed ? 'N/A' : `${readAccuracy}%`) : '--'}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold leading-none mb-0.5">Pass</span>
                <span className={`text-sm md:text-base font-mono font-bold tracking-tight leading-none ${isFinished && !transcriptionFailed ? 'text-sky-500' : 'text-slate-800 dark:text-zinc-100'}`}>
                   {isFinished ? (transcriptionFailed ? 'N/A' : `${passageAccuracy}%`) : '--'}
                </span>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-zinc-700"></div>
              <div className="flex flex-col items-start min-w-0">
                {timedMode && isRecording ? (
                  <>
                    <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold leading-none mb-0.5">Left</span>
                    <span className="text-sm md:text-base font-mono font-bold tracking-tight text-rose-500 flex items-center gap-0.5 leading-none">
                      <Clock className="w-3.5 h-3.5" />
                      {timeLeft}s
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold leading-none mb-0.5">Progress</span>
                    <span className="text-sm md:text-base font-mono font-bold tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                       {Math.max(0, activeWordIndex)}<span className="text-xs text-slate-400 dark:text-zinc-500">/{sourceWords.length}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Center: Mic stays inside the 64px bar — no negative top offset */}
            <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className="relative" data-preview-block>
                <button
                  onClick={isAnalyzing ? undefined : toggleRecording}
                  disabled={!!recognitionError || isAnalyzing}
                  className="group relative w-11 h-11 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  title={isRecording ? 'Stop' : isAnalyzing ? 'Analyzing…' : isFinished ? 'Play Again' : 'Start Reading'}
                >
                  {isRecording ? (
                     <>
                       <div className="absolute inset-0 bg-rose-50 rounded-full"></div>
                       <div className="absolute inset-0 border-2 border-rose-200 rounded-full animate-pulse"></div>
                       <div className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center shadow-md z-10 transition-colors hover:bg-rose-600">
                         <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                       </div>
                     </>
                  ) : isAnalyzing ? (
                     <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center shadow-md z-10">
                       <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                     </div>
                  ) : isFinished ? (
                     <div className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center shadow-md z-10 transition-colors hover:bg-emerald-600">
                       <RefreshCw className="w-4 h-4 text-white" />
                     </div>
                  ) : (
                     <div className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center shadow-md z-10 transition-colors hover:bg-black">
                       <Mic className="w-4 h-4 text-white" />
                     </div>
                  )}
                 </button>
                 {(isFinished || isAnalyzing) && sessionAudioBlob && (
                   <button
                      onClick={() => downloadAudio(currentTextObj.id)}
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-sm"
                      title="Download Recording"
                   >
                      <Download className="w-3.5 h-3.5" />
                   </button>
                 )}
              </div>
            </div>

            {/* Right Side: Toggles — single row, fits 64px */}
            <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] md:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:inline">Timed</span>
                <div
                  onClick={() => {
                    if (!isRecording) setTimedMode(!timedMode);
                    setTimeLeft(() => targetTime);
                  }}
                  className={`w-8 h-4 rounded-full relative p-0.5 transition-colors ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${timedMode ? 'bg-zinc-700' : 'bg-slate-200'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute shadow-sm transition-transform ${timedMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] md:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:inline">Live</span>
                <div
                  onClick={() => setRealtime(!realtime)}
                  className={`w-8 h-4 rounded-full relative p-0.5 cursor-pointer transition-colors ${realtime ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute shadow-sm transition-transform ${realtime ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>
              <button
                onClick={reset}
                title="Restart reading passage"
                className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-zinc-900 transition-colors flex items-center gap-1 p-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </div>

          </footer>
        </>
      )}
    </>
  );
}
