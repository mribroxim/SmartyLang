import React, { useEffect, useMemo, useState } from 'react';
import { Level } from '../lib/reading-logic';
import { useLevelTexts } from '../data/levelTexts';
import {
  Flashcards,
  PronunciationDrill,
  WordMatch,
  DefinitionQuiz,
  SpellingPractice,
  WordScramble,
  MemoryMatch,
  ListeningMatch,
  TrueFalseQuiz,
  fetchWordTranslations,
} from '../Exercises';
import {
  Mic,
  Shuffle,
  BookOpen,
  Type,
  RefreshCw,
  Layers,
  Headphones,
  Languages,
  CheckCircle2,
  Grid,
  X,
  AlertCircle,
  PlayCircle,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useUiLang } from '../contexts/UiLangContext';
import { useContentLang } from '../contexts/ContentLangContext';
import { LANGUAGES, type LanguageOption } from '../lib/languages';
import { readPreferredTranslationLang } from '../lib/preferredTranslationLang';
import {
  loadExerciseSession,
  clearExerciseSession,
  consumeExerciseResumeFlag,
  exerciseTypeLabel,
  sessionProgressLabel,
  type ExerciseSessionSnapshot,
} from '../lib/exerciseSession';
import { matchesContentLang } from '../lib/activityMeta';
import { ScreenShell, HubRow } from '../components/ScreenShell';
import { normalizeForMatch, tokenizeForLang } from '../lib/pronunciationProfile';

const MEANING_MODE_EXERCISES = new Set([
  'flashcards',
  'definition-quiz',
  'listening-match',
  'true-false-quiz',
  'memory-match',
  'word-match',
]);

interface ExercisesViewProps {
  savedVocab: Record<string, any>;
  allVocabMap: Map<string, string>;
  activeExercise: string | null;
  setActiveExercise: (ex: any) => void;
  selectedVocabWords: string[];
  setSelectedVocabWords: (fn: (prev: string[]) => string[] | string[]) => void;
  showExerciseWordSelector: string | null;
  setShowExerciseWordSelector: (v: any) => void;
  exerciseSourceType: string;
  setExerciseSourceType: (v: any) => void;
  exerciseSourceLevel: Level;
  setExerciseSourceLevel: (v: any) => void;
  exerciseSourceTopic: string;
  setExerciseSourceTopic: (v: string) => void;
  exerciseSourceCustomTextSel: string;
  setExerciseSourceCustomTextSel: (v: string) => void;
  savedCustomTexts: string[];
  recordExercise: (type: string, data?: any) => void;
  setIsExerciseCompleteModalOpen: (v: boolean) => void;
  setExerciseCompleteData: (v: any) => void;
}

function readSavedLang(_preferEn: boolean): LanguageOption {
  return readPreferredTranslationLang();
}

export default function ExercisesView({
  savedVocab,
  allVocabMap,
  activeExercise,
  setActiveExercise,
  selectedVocabWords,
  setSelectedVocabWords,
  showExerciseWordSelector,
  setShowExerciseWordSelector,
  exerciseSourceType,
  setExerciseSourceType,
  exerciseSourceLevel,
  setExerciseSourceLevel,
  exerciseSourceTopic,
  setExerciseSourceTopic,
  exerciseSourceCustomTextSel,
  setExerciseSourceCustomTextSel,
  savedCustomTexts,
  recordExercise,
  setIsExerciseCompleteModalOpen,
  setExerciseCompleteData,
}: ExercisesViewProps) {
  const LEVEL_TEXTS = useLevelTexts();
  const { t } = useUiLang();
  const { contentLang, dictCode, nativeName } = useContentLang();

  const [pendingExercise, setPendingExercise] = useState<string | null>(null);
  const [meaningStep, setMeaningStep] = useState<'mode' | 'lang' | null>(null);
  const [exerciseMeanings, setExerciseMeanings] = useState<Record<string, string> | undefined>(undefined);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [targetLang, setTargetLang] = useState<LanguageOption>(() => readSavedLang(contentLang !== 'en'));
  const [langSearch, setLangSearch] = useState('');
  const [resumeSnapshot, setResumeSnapshot] = useState<ExerciseSessionSnapshot | null>(null);
  const [interrupted, setInterrupted] = useState<ExerciseSessionSnapshot | null>(() => {
    const snap = loadExerciseSession();
    const cl = (() => { try { return localStorage.getItem('smarty_content_lang') || 'en'; } catch { return 'en'; } })();
    return snap && matchesContentLang(snap, cl) ? snap : null;
  });

  const refreshInterrupted = () => {
    const snap = loadExerciseSession();
    setInterrupted(snap && matchesContentLang(snap, contentLang) ? snap : null);
  };

  const doResume = (snap: ExerciseSessionSnapshot) => {
    setSelectedVocabWords(() => [...snap.words]);
    setExerciseMeanings(snap.meanings);
    setResumeSnapshot(snap);
    setInterrupted(null);
    setMeaningStep(null);
    setPendingExercise(null);
    setShowExerciseWordSelector(null);
    setActiveExercise(snap.type);
  };

  useEffect(() => {
    if (consumeExerciseResumeFlag()) {
      const snap = loadExerciseSession();
      if (snap && matchesContentLang(snap, contentLang)) doResume(snap);
    }
  }, []);

  useEffect(() => {
    refreshInterrupted();
  }, [contentLang]);

  useEffect(() => {
    if (!activeExercise) {
      refreshInterrupted();
      setResumeSnapshot(null);
    }
  }, [activeExercise]);

  const onComplete = (data: any) => {
    const { type, ...rest } = data || {};
    if (type) {
      try {
        recordExercise(type, rest);
      } catch (e) {
        console.error('Error recording exercise on complete:', e);
      }
    }
    clearExerciseSession();
    setResumeSnapshot(null);
    setInterrupted(null);
    setActiveExercise(null);
    setExerciseMeanings(undefined);
    setPendingExercise(null);
    setExerciseCompleteData(data);
    setIsExerciseCompleteModalOpen(true);
  };

  const closeExercise = () => {
    setActiveExercise(null);
    setExerciseMeanings(undefined);
    setPendingExercise(null);
    setResumeSnapshot(null);
    refreshInterrupted();
  };

  const buildDefinitionMeanings = (words: string[]): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const w of words) {
      const def = allVocabMap.get(w.toLowerCase()) || savedVocab[w]?.definition || '';
      if (def) map[w] = def;
    }
    return map;
  };

  const launchWithMeanings = (exId: string, meanings: Record<string, string>) => {
    clearExerciseSession();
    setResumeSnapshot(null);
    setInterrupted(null);
    setExerciseMeanings(meanings);
    setMeaningStep(null);
    setPendingExercise(null);
    setShowExerciseWordSelector(null);
    setActiveExercise(exId);
  };

  const startAfterWordSelect = (exId: string) => {
    if (MEANING_MODE_EXERCISES.has(exId)) {
      setPendingExercise(exId);
      setMeaningStep('mode');
      setShowExerciseWordSelector(null);
      return;
    }
    clearExerciseSession();
    setResumeSnapshot(null);
    setInterrupted(null);
    setExerciseMeanings(undefined);
    setActiveExercise(exId);
    setShowExerciseWordSelector(null);
  };

  const chooseDefinition = () => {
    if (!pendingExercise) return;
    const words = selectedVocabWords.length > 0 ? selectedVocabWords : Object.keys(savedVocab);
    launchWithMeanings(pendingExercise, buildDefinitionMeanings(words));
  };

  const chooseTranslation = () => {
    setMeaningStep('lang');
  };

  const startWithTranslationLang = async (lang: LanguageOption) => {
    if (!pendingExercise) return;
    setTargetLang(lang);
    try { localStorage.setItem('preferred_translation_lang', lang.code); } catch {}
    const words = selectedVocabWords.length > 0 ? selectedVocabWords : Object.keys(savedVocab);
    setLoadingTranslations(true);
    try {
      const map = await fetchWordTranslations(words, dictCode, lang.code);
      launchWithMeanings(pendingExercise, map);
    } catch (e) {
      console.error(e);
      setLoadingTranslations(false);
    }
    setLoadingTranslations(false);
  };

  const filteredLangs = useMemo(() => {
    const s = langSearch.trim().toLowerCase();
    if (!s) return LANGUAGES;
    return LANGUAGES.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.code.toLowerCase().includes(s) ||
      (l.native && l.native.toLowerCase().includes(s)),
    );
  }, [langSearch]);

  const exerciseList = [
    { id: 'flashcards', title: 'Flashcards', desc: 'Classic spaced repetition — definition or translation', icon: <Grid className="w-6 h-6" />, meaningChoice: true },
    { id: 'definition-quiz', title: 'Quiz', desc: 'Multiple choice meanings — definition or translation', icon: <BookOpen className="w-6 h-6" />, meaningChoice: true },
    { id: 'listening-match', title: 'Listening', desc: 'Hear the word, pick the meaning', icon: <Headphones className="w-6 h-6" />, meaningChoice: true },
    { id: 'true-false-quiz', title: 'True or False', desc: 'Is this meaning correct?', icon: <CheckCircle2 className="w-6 h-6" />, meaningChoice: true },
    { id: 'memory-match', title: 'Memory Match', desc: 'Flip and match word ↔ meaning pairs', icon: <Layers className="w-6 h-6" />, meaningChoice: true },
    { id: 'word-match', title: 'Word Match', desc: 'Connect words to meanings', icon: <Shuffle className="w-6 h-6" />, meaningChoice: true },
    { id: 'spelling-practice', title: 'Spelling Practice', desc: 'Type the word you hear', icon: <Type className="w-6 h-6" />, meaningChoice: false },
    { id: 'pronunciation', title: 'Pronunciation', desc: 'Speak and get graded', icon: <Mic className="w-6 h-6" />, meaningChoice: false },
    { id: 'word-scramble', title: 'Word Scramble', desc: 'Unscramble the letters', icon: <RefreshCw className="w-6 h-6" />, meaningChoice: false },
  ];

  return (
    <main className="flex-grow overflow-y-auto overflow-x-hidden w-full max-w-[100vw] bg-white relative">
      {(() => {
        const exerciseVocab = selectedVocabWords.length > 0
          ? Object.fromEntries(selectedVocabWords.map(w => [w, savedVocab[w] || { definition: '' }]))
          : savedVocab;
        const meaningProps = { meanings: exerciseMeanings };
        const resumeProp = (type: string) =>
          resumeSnapshot?.type === type ? { resume: resumeSnapshot } : {};
        return (
          <>
            {activeExercise === 'flashcards' && (
              <Flashcards savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('flashcards')} />
            )}
            {activeExercise === 'pronunciation' && (
              <PronunciationDrill savedVocab={exerciseVocab} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...resumeProp('pronunciation')} />
            )}
            {activeExercise === 'word-match' && (
              <WordMatch savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('word-match')} />
            )}
            {activeExercise === 'definition-quiz' && (
              <DefinitionQuiz savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('definition-quiz')} />
            )}
            {activeExercise === 'spelling-practice' && (
              <SpellingPractice savedVocab={exerciseVocab} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...resumeProp('spelling-practice')} />
            )}
            {activeExercise === 'word-scramble' && (
              <WordScramble savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...resumeProp('word-scramble')} />
            )}
            {activeExercise === 'memory-match' && (
              <MemoryMatch savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('memory-match')} />
            )}
            {activeExercise === 'listening-match' && (
              <ListeningMatch savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('listening-match')} />
            )}
            {activeExercise === 'true-false-quiz' && (
              <TrueFalseQuiz savedVocab={exerciseVocab} allVocabMap={allVocabMap} onBack={closeExercise} onComplete={onComplete} recordExercise={recordExercise} {...meaningProps} {...resumeProp('true-false-quiz')} />
            )}
          </>
        );
      })()}

      {/* Definition vs Translation picker */}
      {meaningStep === 'mode' && pendingExercise && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Practice with…</h2>
                <p className="text-sm text-slate-500 mt-1">Choose definition or translation for this exercise.</p>
              </div>
              <button
                onClick={() => { setMeaningStep(null); setPendingExercise(null); }}
                className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid gap-3">
              <button
                onClick={chooseDefinition}
                className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Definition</div>
                  <div className="text-sm text-slate-500 mt-0.5">Match or quiz using dictionary meanings</div>
                </div>
              </button>
              <button
                onClick={chooseTranslation}
                className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Translation</div>
                  <div className="text-sm text-slate-500 mt-0.5">Practice with another language</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation language picker */}
      {meaningStep === 'lang' && pendingExercise && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Translation language</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Translate your {nativeName} words into…
                </p>
              </div>
              <button
                onClick={() => setMeaningStep('mode')}
                className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingTranslations ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Loading translations…</div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      autoFocus
                      value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                      placeholder="Search language…"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredLangs.map(l => (
                      <button
                        key={l.code}
                        onClick={() => startWithTranslationLang(l)}
                        className={`text-left p-3 rounded-xl border transition-colors ${
                          targetLang.code === l.code
                            ? 'border-zinc-900 bg-zinc-50'
                            : 'border-slate-200 hover:border-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-sm truncate">{l.name}</div>
                        {l.native && l.native !== l.name && (
                          <div className="text-xs text-slate-500 truncate">{l.native}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!activeExercise && (
        <ScreenShell title={t('exercises.title')} subtitle={t('exercises.subtitle')} size="wide">
          {!showExerciseWordSelector && !meaningStep && (
            <>
              {interrupted && (
                <div className="mb-4 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Continue where you left off</p>
                    <h3 className="text-lg font-bold text-slate-900 capitalize truncate">
                      {exerciseTypeLabel(interrupted.type)}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {sessionProgressLabel(interrupted)} · {interrupted.words.length} words
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        clearExerciseSession();
                        setInterrupted(null);
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => doResume(interrupted)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black transition flex items-center gap-2"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
                {exerciseList.map(ex => (
                  <HubRow
                    key={ex.id}
                    icon={ex.icon}
                    iconClass="bg-slate-100 text-zinc-700"
                    title={ex.title}
                    desc={ex.desc}
                    meta={ex.meaningChoice ? 'Definition or translation' : undefined}
                    onClick={() => setShowExerciseWordSelector(ex.id as any)}
                  />
                ))}
              </div>
            </>
          )}

          {showExerciseWordSelector && (() => {
            let candidateWords: string[] = [];
            if (exerciseSourceType === 'saved') candidateWords = Object.keys(savedVocab);
            else if (exerciseSourceType === 'level') candidateWords = LEVEL_TEXTS[exerciseSourceLevel]?.flatMap(t => t.vocabulary?.map(v => v.word.toLowerCase()) || []) || [];
            else if (exerciseSourceType === 'topic') {
              const topic = LEVEL_TEXTS[exerciseSourceLevel]?.find(t => t.id === exerciseSourceTopic);
              if (topic) candidateWords = topic.vocabulary?.map(v => v.word.toLowerCase()) || [];
            } else if (exerciseSourceType === 'custom') {
              const text = savedCustomTexts[Number(exerciseSourceCustomTextSel)];
              if (text) {
                const words = tokenizeForLang(text, contentLang)
                  .map((word) => normalizeForMatch(word, contentLang))
                  .filter(Boolean);
                candidateWords = words.filter(w => allVocabMap.has(w));
              }
            }
            candidateWords = Array.from(new Set(candidateWords));

            return (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-zinc-700" />
                        Select Words to Practice
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">Choose specific words, or leave all unselected to practice your full vocabulary.</p>
                    </div>
                    <button onClick={() => setShowExerciseWordSelector(null)} className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50 shrink-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-bold text-slate-600 mr-2">Source:</span>
                      <select
                        value={exerciseSourceType}
                        onChange={(e) => setExerciseSourceType((e.target as any).value)}
                        className="bg-white border text-sm max-w-[200px] font-bold text-slate-700 box-border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all"
                      >
                        <option value="saved">Saved Vocab</option>
                        <option value="level">From Level Texts</option>
                        <option value="topic">Topic Keyword</option>
                        <option value="custom">From Custom</option>
                      </select>

                      {exerciseSourceType === 'level' && (
                        <select
                          value={exerciseSourceLevel}
                          onChange={(e) => setExerciseSourceLevel((e.target as any).value)}
                          className="bg-white border text-sm font-bold text-slate-700 box-border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all"
                        >
                          {Object.keys(LEVEL_TEXTS).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                      )}

                      {exerciseSourceType === 'topic' && (
                        <>
                          <select
                            value={exerciseSourceLevel}
                            onChange={(e) => setExerciseSourceLevel((e.target as any).value)}
                            className="bg-white border text-sm font-bold text-slate-700 box-border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all"
                          >
                            {Object.keys(LEVEL_TEXTS).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                          </select>
                          <select
                            value={exerciseSourceTopic}
                            onChange={(e) => setExerciseSourceTopic(e.target.value)}
                            className="bg-white border text-sm max-w-[150px] font-bold text-slate-700 box-border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all truncate"
                          >
                            <option value="">Select Topic...</option>
                            {LEVEL_TEXTS[exerciseSourceLevel]?.map((topic: any) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                          </select>
                        </>
                      )}

                      {exerciseSourceType === 'custom' && (
                        <select
                          value={exerciseSourceCustomTextSel}
                          onChange={(e) => setExerciseSourceCustomTextSel(e.target.value)}
                          className="bg-white border text-sm max-w-[200px] font-bold text-slate-700 box-border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all truncate"
                        >
                          <option value="">Select Custom Text...</option>
                          {savedCustomTexts.map((text, idx) => <option key={idx} value={String(idx)}>{text.slice(0, 30)}...</option>)}
                        </select>
                      )}
                    </div>

                    {candidateWords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVocabWords(() => [...candidateWords])}
                          className="text-xs font-bold text-zinc-900 hover:text-black bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVocabWords(() => [])}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Unselect All
                        </button>
                        <span className="text-xs text-slate-400 font-medium ml-1">
                          {selectedVocabWords.length} selected
                        </span>
                      </div>
                    )}

                    <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">
                      {candidateWords.length} Words Available
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {candidateWords.map((word: string) => {
                        const isSelected = selectedVocabWords.includes(word);
                        return (
                          <button
                            key={word}
                            onClick={() => {
                              setSelectedVocabWords(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]);
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-bold text-left transition-all ${isSelected ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:border-zinc-400 hover:shadow-sm'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-zinc-700' : 'border-slate-300 bg-slate-50'}`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <span className="truncate">{word}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {candidateWords.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-slate-500 py-10">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-medium text-center max-w-[250px]">No words found for the selected source.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                    <button
                      disabled={selectedVocabWords.length === 0}
                      onClick={() => {
                        if (selectedVocabWords.length > 0 && showExerciseWordSelector) {
                          startAfterWordSelect(showExerciseWordSelector);
                        }
                      }}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-black hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none active:scale-95"
                    >
                      <PlayCircle className="w-5 h-5" /> Start Exercise
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </ScreenShell>
      )}
    </main>
  );
}
