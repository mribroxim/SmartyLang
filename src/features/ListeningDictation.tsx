import React, { useState, useEffect } from 'react';
import { Mic, Headphones, ArrowLeft, Loader2, Sparkles, Volume2, CheckCircle2, PlayCircle, BookOpen, ChevronRight, Plus, Search } from 'lucide-react';
import { playSound } from '../lib/audio';
import { getRandomDictation } from '../data/audioDictation';
import type { Level } from '../lib/reading-logic';
import { logActivity } from '../lib/activity-tracker';
import { useCustomSessions } from '../hooks/useCustomSessions';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { PracticeHistory } from '../components/PracticeHistory';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { CONTENT_LANG_NATIVE } from '../lib/contentLang';
import { activityLangStamp } from '../lib/activityMeta';
import { speakText, cancelSpeech } from '../lib/speech';
import { normalizeForMatch, tokenizeForLang } from '../lib/pronunciationProfile';
import { SpeechRateControl } from '../components/SpeechRateControl';
import { DEFAULT_SPEECH_RATE, SPEECH_RATE_LABELS, snapSpeechRate } from '../lib/speechRates';
import { ScreenShell, HubRow } from '../components/ScreenShell';
import { LevelCard, LevelCardGrid, LEVEL_THEMES } from '../components/LevelCards';

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];

const PAGE_SIZE = 8;

export function ListeningDictation({ onBack }: any) {
  const { contentLang, speechLocale, nativeName, arabicDisplayMode } = useContentLang();
  const { t, tLevel, tLevelDesc } = useUiLang();
  const [view, setView] = useState<'levels' | 'library' | 'activity'>('levels');
  const [level, setLevel] = useState<Level>('Intermediate');
  const [page, setPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; diff: any[] }[]>([]);
  const [showCurrentTranscript, setShowCurrentTranscript] = useState(false);
  const [exerciseLabel, setExerciseLabel] = useState('');
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  // Saveable custom dictation sessions persisted in localStorage.
  const { sessions: customSessions, save: saveCustomSession, remove: removeCustomSession } =
    useCustomSessions('listening_dictation_custom_v1');
  const [lastExercise, setLastExercise] = useState<string | null>(() => {
    try {
      const cl = localStorage.getItem('smarty_content_lang') || 'en';
      const scoped = localStorage.getItem(`ld_last_exercise_${cl}`);
      if (scoped) return scoped;
      if (cl === 'en') return localStorage.getItem('ld_last_exercise');
      return null;
    } catch { return null; }
  });
  const [speechRate, setSpeechRate] = useState(DEFAULT_SPEECH_RATE);

  useEffect(() => {
    try {
      const scoped = localStorage.getItem(`ld_last_exercise_${contentLang}`);
      setLastExercise(scoped || (contentLang === 'en' ? localStorage.getItem('ld_last_exercise') : null));
    } catch { setLastExercise(null); }
  }, [contentLang]);

  const startDictation = async (label: string, customSentences?: string[]) => {
    setIsGenerating(true);
    try {
      const s = customSentences || await getRandomDictation(level, 3, contentLang, arabicDisplayMode);
      if (!s.length) {
        alert(`No ${nativeName} dictation materials yet. Ask a content manager to add sentences.`);
        return;
      }
      setSentences(s);
      setExerciseLabel(label);
      setCurrentIndex(0);
      setUserInput('');
      setSubmitted(false);
      setResults([]);
      setShowCurrentTranscript(false);
      playSound('success');
      try {
        localStorage.setItem(`ld_last_exercise_${contentLang}`, label);
        localStorage.setItem('ld_last_exercise', label);
      } catch {}
      setLastExercise(label);
      setView('activity');
      playAudio(s[0]);
    } catch {
      alert("Error loading dictation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (text: string) => {
    speakText(text, speechRate, speechLocale);
  };

  const playNormalAudio = (text: string) => {
    speakText(text, speechRate, speechLocale);
  };

  const checkText = (input: string, correct: string) => {
    const inputWords = tokenizeForLang(input, contentLang).map((word) => normalizeForMatch(word, contentLang));
    const correctWords = tokenizeForLang(correct, contentLang).map((word) => normalizeForMatch(word, contentLang));
    if (inputWords.join(' ') === correctWords.join(' ')) return { correct: true, diff: [{ type: 'correct', val: correct }] };
    const diff = [];
    for (let i = 0; i < Math.max(inputWords.length, correctWords.length); i++) {
      if (inputWords[i] === correctWords[i]) {
        if (correctWords[i]) diff.push({ type: 'correct', val: correctWords[i] });
      } else {
        diff.push({ type: 'incorrect', expected: correctWords[i] || '', actual: inputWords[i] || '' });
      }
    }
    return { correct: false, diff };
  };

  const handleNext = () => {
    const res = checkText(userInput, sentences[currentIndex]);
    const nextResults = [...results, res];
    if (currentIndex < sentences.length - 1) {
      setResults(nextResults);
      setCurrentIndex(i => i + 1);
      setUserInput('');
      setShowCurrentTranscript(false);
      playAudio(sentences[currentIndex + 1]);
    } else {
      setResults(nextResults);
      setSubmitted(true);
      playSound('success');
      const score = nextResults.filter((r: any) => r.correct).length;
      const details = nextResults.map((r: any, idx: number) => ({
        question: sentences[idx],
        expected: sentences[idx],
        actual: (r.diff || []).map((d: any) => d.type === 'correct' ? d.val : (d.actual || '∅')).join(' '),
        isCorrect: r.correct,
      }));
      try {
        const prev = JSON.parse(localStorage.getItem('ld_completions_v1') || '[]');
        prev.push({
          label: exerciseLabel || 'Exercise',
          title: exerciseLabel || 'Dictation',
          level: level,
          timestamp: Date.now(),
          score,
          total: sentences.length,
          details,
          ...activityLangStamp(contentLang),
        });
        localStorage.setItem('ld_completions_v1', JSON.stringify(prev));
      } catch {}
      logActivity({
        type: 'audio_dictation',
        title: exerciseLabel || 'Audio Dictation',
        level,
        score,
        total: sentences.length,
        accuracy: sentences.length > 0 ? Math.round((score / sentences.length) * 100) : 0,
        details,
      });
    }
  };

  if (view === 'levels') {
    return (
      <ScreenShell size="wide" title={t('listening.dict.title')} subtitle={t('dictation.levelSubtitle')}>
          <div className="flex flex-col gap-3">
            <HubRow
              dark
              icon={<Plus className="w-6 h-6" />}
              title={t('dictation.customTitle')}
              desc={t('dictation.customDesc')}
              onClick={() => setShowCustomForm(true)}
            />
            <LevelCardGrid>
              {LEVELS.map((l, idx) => (
                <LevelCard
                  key={l}
                  title={tLevel(l)}
                  desc={tLevelDesc('dictation.desc', l)}
                  themeIndex={idx}
                  icon={<Headphones className="w-5 h-5 md:w-6 md:h-6" />}
                  onClick={() => { setLevel(l); setPage(1); setView('library'); }}
                />
              ))}
            </LevelCardGrid>
          </div>

        {/* Custom Dictation Modal */}
        {showCustomForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">{t('dictation.customTitle')}</h3>

              {/* Saved dictation sessions */}
              {customSessions.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('dictation.savedSessions')}</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {customSessions.map(s => (
                      <div key={s.id} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{s.title}</p>
                          <p className="text-xs text-slate-500 truncate">{s.prompt.replace(/\n/g, ' · ').slice(0, 80)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowCustomForm(false);
                            const sents = s.prompt.split('\n').map(x => x.trim()).filter(Boolean);
                            startDictation(s.title || t('dictation.customTitle'), sents);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                        >{t('action.use')}</button>
                        <button
                          onClick={() => removeCustomSession(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors shrink-0"
                          title="Delete saved session"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-3 mb-2">— or create a new one below —</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">{t('common.title')}</label>
                  <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    placeholder="My Custom Dictation" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Sentences (one per line)</label>
                  <textarea value={customText} onChange={e => setCustomText(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-700 min-h-[160px] resize-none"
                    placeholder="Enter sentences for dictation (one per line)..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCustomForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">{t('action.cancel')}</button>
                <button
                  onClick={async () => {
                    if (!customText.trim()) return;
                    await saveCustomSession({ title: customTitle, prompt: customText });
                  }}
                  disabled={!customText.trim()}
                  className="px-4 py-3 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40"
                  title="Save this dictation set for later"
                ><BookmarkPlus className="w-4 h-4" /> Save</button>
                <button onClick={() => {
                  if (!customText.trim()) return;
                  setShowCustomForm(false);
                  const sents = customText.split('\n').map(s => s.trim()).filter(Boolean);
                  startDictation(customTitle || t('dictation.customTitle'), sents);
                }} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black">{t('listening.dict.cta')}</button>
              </div>
            </div>
          </div>
        )}
      </ScreenShell>
    );
  }

  if (view === 'library') {
    const allExercises = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const exercises = search.trim() ? allExercises.filter(i => `Exercise ${i}`.toLowerCase().includes(search.toLowerCase())) : allExercises;
    const totalPages = Math.ceil(exercises.length / PAGE_SIZE);
    const pagedItems = exercises.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const levelIdx = LEVELS.indexOf(level);
    const theme = LEVEL_THEMES[levelIdx] || LEVEL_THEMES[3];
    return (
      <div className="flex-grow overflow-y-auto w-full bg-white relative">
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-6 md:py-12">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <button onClick={() => setView('levels')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                {tLevel(level)} <span className="text-slate-300 font-sans font-light text-3xl">|</span>
                <span className="font-sans text-2xl text-zinc-900 tracking-normal font-medium">{t('library.title')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('library.levelProgress')}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-zinc-900">{allExercises.length}</span>
                <span className="font-bold text-slate-400">{t('library.exercises')}</span>
              </div>
            </div>
          </header>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.searchExercises')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 transition-all shadow-sm"
            />
          </div>

          {lastExercise && (
            <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                <p className="font-bold text-slate-800 text-sm">{lastExercise} · {tLevel(level)}</p>
              </div>
              <button onClick={() => startDictation(lastExercise)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors shrink-0">{t('dash.continue')}</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pagedItems.map(i => (
              <button key={i} onClick={() => startDictation(`Exercise ${i}`)}
                className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 transition-all duration-300 text-left group min-h-[220px] relative overflow-hidden">
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${theme.card}`}>
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-slate-800 mb-3 group-hover:text-black">Exercise {i}</h3>
                  <p className="text-base text-slate-500 leading-relaxed">3 dictation sentences at {tLevel(level)} level</p>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{t('library.status')}</span>
                    <span className="text-sm font-bold text-slate-400">{t('library.ready')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-900 font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <span>{t('action.start')}</span>
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-6 bg-white p-4 rounded-full border border-slate-200 shadow-sm w-fit mx-auto">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button key={idx} onClick={() => setPage(idx + 1)} className={`w-3 h-3 rounded-full transition-colors ${page === idx + 1 ? 'bg-zinc-900 scale-125' : 'bg-slate-200 hover:bg-slate-300'}`} />
                ))}
              </div>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <PracticeHistory
            storageKey="ld_completions_v1"
            label="Past Dictation Sessions"
            level={level}
          />
        </div>

      </div>
    );
  }

  if (submitted) {
    const score = results.filter(r => r.correct).length;
    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <button onClick={() => { cancelSpeech(); setSubmitted(false); setView('library'); }}
          className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-8 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Exercises</button>
        <div className="bg-white rounded-[2rem] p-6 md:p-12 shadow-xl border border-slate-200 text-center">
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mb-4">Practice Complete!</h2>
          <p className="text-xl text-slate-500 mb-12">You got {score} out of {sentences.length} sentences correct.</p>
          {sentences.map((sent, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-400">Sentence {i + 1}</span>
                <button onClick={() => playNormalAudio(sent)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold">
                  <Volume2 className="w-4 h-4" /> Listen
                </button>
              </div>
              <div className="text-lg font-serif text-slate-900 mb-2">{sent}</div>
              {!results[i].correct && (
                <div className="bg-white border-l-4 border-rose-400 p-4 rounded-r-xl">
                  <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">What you wrote:</span>
                  <div className="flex flex-wrap gap-1">
                    {results[i].diff.map((d: any, idx) => (
                      <span key={idx} className={d.type === 'correct' ? 'text-zinc-400' : 'text-rose-600 font-bold underline decoration-rose-300'}>
                        {d.type === 'correct' ? d.val : (d.actual || '(missed)')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => { setSubmitted(false); setView('library'); }}
            className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-colors mt-6">
            Try More Exercises
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12">
      <button onClick={() => { cancelSpeech(); setView('library'); }}
        className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-8 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors">
        <ArrowLeft className="w-4 h-4" /> Exit Dictation</button>
      <div className="space-y-2 mb-8 flex gap-2">
        {sentences.map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < currentIndex ? 'bg-emerald-500' : i === currentIndex ? 'bg-emerald-200' : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="bg-white rounded-[2rem] p-6 md:p-12 shadow-xl border border-slate-200 text-center">
        <div className="mb-8">
          <span className="font-bold text-slate-400 uppercase tracking-widest mb-6 block">{exerciseLabel}</span>
          <div className="flex flex-col items-center gap-4">
            <SpeechRateControl value={speechRate} onChange={setSpeechRate} />
            <button
              type="button"
              onClick={() => playAudio(sentences[currentIndex])}
              className="flex flex-col items-center justify-center p-6 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all group w-full max-w-xs"
            >
              <Headphones className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-emerald-900">Play Audio</span>
              <span className="text-[10px] font-mono text-emerald-700/70 mt-1">
                {SPEECH_RATE_LABELS[snapSpeechRate(speechRate)]}
              </span>
            </button>
          </div>
        </div>
        <div className="mb-8 text-left">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Type what you hear</label>
            <button onClick={() => setShowCurrentTranscript(true)}
              className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">Reveal text</button>
          </div>
          <textarea value={userInput} onChange={e => setUserInput(e.target.value)}
            className="w-full bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 resize-none font-serif text-xl outline-none transition-colors h-32"
            placeholder="Start typing..." autoFocus />
          {showCurrentTranscript && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xs font-bold text-amber-700 uppercase block mb-1">Transcript</span>
              <span className="text-amber-900 font-serif">{sentences[currentIndex]}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={handleNext} disabled={!userInput.trim()}
            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {currentIndex < sentences.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
