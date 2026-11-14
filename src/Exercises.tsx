import { useUiLang } from './contexts/UiLangContext';
import { answerFeedback } from './lib/smarty/answer';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { playWord as sharedPlayWord } from './lib/speech';
import { useContentLang } from './contexts/ContentLangContext';
import { ChevronRight, ArrowLeft, CheckCircle2, Mic, Volume2, XCircle, Brain, BookOpen, Type, Shuffle, Headphones, Search, Loader2 } from 'lucide-react';
import { getMatchType } from './lib/reading-logic';
import { normalizeForMatch, tokenizeForLang } from './lib/pronunciationProfile';
import { playSound } from './lib/audio';
import { LANGUAGES, type LanguageOption, decodeHtmlEntities } from './lib/languages';
import { readPreferredTranslationLang } from './lib/preferredTranslationLang';
import { getCard, lookupWord, vocabDbEnabled } from './lib/vocabDb';
import {
  saveExerciseSession,
  clearExerciseSession,
  type ExerciseSessionSnapshot,
} from './lib/exerciseSession';

/** Mobile-safe exercise layout — prevents long words from overflowing the viewport. */
const EX_SHELL = 'max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-6 relative z-10 overflow-x-hidden w-full min-w-0 box-border';
const EX_WORD =
  'font-serif font-black text-slate-900 break-words [overflow-wrap:anywhere] max-w-full px-2 leading-tight text-[clamp(1.35rem,6.5vw,3.25rem)]';
const EX_DEF = 'text-base md:text-xl text-center leading-relaxed font-medium break-words [overflow-wrap:anywhere] max-w-full px-2';
const EX_OPTION =
  'p-4 md:p-6 rounded-2xl border-2 transition-[transform,box-shadow,background-color,border-color] duration-100 text-left font-semibold text-base md:text-lg leading-relaxed shadow-[0_3px_0_0_rgba(15,23,42,0.10)] active:translate-y-[3px] active:shadow-none break-words [overflow-wrap:anywhere] max-w-full w-full min-w-0';

export type MeaningMode = 'definition' | 'translation';

/** Prefetch translations for a set of vocab words (MyMemory + quality filter). */
export async function fetchWordTranslations(
  words: string[],
  sourceDictCode: string,
  targetCode: string,
  glosses?: Record<string, string>,
): Promise<Record<string, string>> {
  const { translateWithCache } = await import('./lib/networkCache');
  const { isGarbageTranslation } = await import('./lib/translationQuality');
  const { vocabDbEnabled, loadVocab, lookupWord } = await import('./lib/vocabDb');
  const transMap: Record<string, string> = {};
  const missing: string[] = [];

  if (vocabDbEnabled()) {
    await loadVocab(sourceDictCode, targetCode);
  }

  for (const w of words) {
    if (targetCode === sourceDictCode) {
      transMap[w] = w;
      transMap[w.toLowerCase()] = w;
      continue;
    }
    if (vocabDbEnabled()) {
      const card = lookupWord(w, { knownLang: targetCode });
      const lemma = (card?.word || w).toLowerCase();
      const known = (card?.knownWord || '').trim();
      // Only trust vocab-db when it actually has a known-language word, not the
      // English/learning definition (that used to leak into quizzes).
      if (known && known.toLowerCase() !== lemma) {
        transMap[w] = known;
        transMap[w.toLowerCase()] = known;
        continue;
      }
    }
    missing.push(w);
  }

  await Promise.all(missing.map(async (w) => {
    const gloss = glosses?.[w] || glosses?.[w.toLowerCase()];
    try {
      const t = await translateWithCache(w, sourceDictCode, targetCode, { fallback: gloss });
      const clean = decodeHtmlEntities((t || '').trim());
      if (clean && !isGarbageTranslation(clean, w)) {
        transMap[w] = clean;
        transMap[w.toLowerCase()] = clean;
      } else if (gloss) {
        const defT = await translateWithCache(gloss, sourceDictCode, targetCode);
        const defClean = decodeHtmlEntities((defT || '').trim());
        if (defClean && !isGarbageTranslation(defClean, gloss)) {
          transMap[w] = defClean;
          transMap[w.toLowerCase()] = defClean;
        } else {
          transMap[w] = w;
          transMap[w.toLowerCase()] = w;
        }
      } else {
        transMap[w] = w;
      }
    } catch {
      transMap[w] = w;
    }
  }));
  return transMap;
}

export function meaningFor(
  word: string,
  data: any,
  allVocabMap: Map<string, string> | undefined,
  meanings?: Record<string, string>,
): string {
  if (meanings) {
    const hit = meanings[word] ?? meanings[word.toLowerCase()];
    if (hit) return hit;
  }
  if (data?.definition) return data.definition;
  const resolved = data?.senseId ? getCard(data.senseId) : lookupWord(word);
  const lemma = (resolved?.word || word).toLowerCase();
  const known = (resolved?.knownWord || '').trim();
  if (known && known.toLowerCase() !== lemma) return known;
  return allVocabMap?.get(word.toLowerCase()) || resolved?.definition || '';
}

/* ─── Inline translation helper (shared across exercises) ────────── */
function readSavedLangInline(_preferEn = false): LanguageOption {
  return readPreferredTranslationLang();
}

function TranslateInline({ word }: { word: string }) {
  const { t } = useUiLang();
  const { contentLang, dictCode, nativeName } = useContentLang();
  const [lang, setLang]             = useState<LanguageOption>(() => readSavedLangInline(contentLang !== 'en'));
  const [shown, setShown]           = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const pickerRef                   = useRef<HTMLDivElement>(null);

  // Reset on word change
  useEffect(() => { setShown(false); setTranslation(null); }, [word]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const doFetch = useCallback(async (langCode: string) => {
    setLoading(true);
    setTranslation(null);
    try {
      if (langCode === dictCode) {
        setTranslation(word);
        setLoading(false);
        return;
      }
      if (vocabDbEnabled()) {
        const { loadVocab } = await import('./lib/vocabDb');
        await loadVocab(dictCode, langCode);
        const card = lookupWord(word, { knownLang: langCode });
        if (card?.knownWord || card?.definition) {
          setTranslation(card.knownWord || card.definition);
          setLoading(false);
          return;
        }
      }
      const { translateWithCache } = await import('./lib/networkCache');
      const raw = await translateWithCache(word, dictCode, langCode);
      const decoded = decodeHtmlEntities((raw || '').trim());
      setTranslation(decoded && decoded.toLowerCase() !== word.toLowerCase() ? decoded : '—');
    } catch { setTranslation('—'); }
    setLoading(false);
  }, [word, dictCode]);

  const toggle = () => {
    if (shown) { setShown(false); return; }
    setShown(true);
    if (translation === null) doFetch(lang.code);
  };

  const handleChangeLang = (l: LanguageOption) => {
    setLang(l);
    setPickerOpen(false);
    setLangSearch('');
    try { localStorage.setItem('preferred_translation_lang', l.code); } catch {}
    setShown(true);
    doFetch(l.code);
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

  return (
    <div className="flex flex-col items-center mt-4 relative" ref={pickerRef}>
      {/* Control row */}
      <div className="flex items-center gap-2">
        <button
          onClick={e => { e.stopPropagation(); toggle(); }}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors font-medium select-none"
        >
          🌐 {shown ? t("learning.hide.34d8b6") : t("learning.translate.2be17a")}
        </button>
        <span className="text-slate-300 text-xs">·</span>
        <button
          onClick={e => { e.stopPropagation(); setPickerOpen(o => !o); setLangSearch(''); }}
          className="inline-flex items-center gap-0.5 text-xs text-slate-400 hover:text-violet-600 transition-colors font-medium select-none"
        >
          {lang.name} <span className="text-[10px]">▾</span>
        </button>
      </div>

      {/* Language picker dropdown */}
      {pickerOpen && (
        <div
          className="absolute top-full mt-1 z-50 bg-white border-2 rounded-2xl overflow-hidden w-56 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
                placeholder={t("learning.search.language.bb13e8")}
                className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-violet-400 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredLangs.length === 0 ? (
              <p className="text-slate-400 text-xs p-3 text-center">{t("learning.no.match.3518df")}</p>
            ) : filteredLangs.map(l => (
              <button
                key={l.code}
                onClick={() => handleChangeLang(l)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-violet-50 transition-colors flex items-center justify-between gap-2 ${
                  l.code === lang.code ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700'
                }`}
              >
                <span>{l.name}</span>
                {l.native && l.native !== l.name && (
                  <span className="text-slate-400 text-[10px] shrink-0">{l.native}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Translation result */}
      {shown && (
        <p className="text-sm font-bold text-violet-600 mt-1.5">
          {loading ? '…' : (translation ?? '—')}
        </p>
      )}
    </div>
  );
}

export function Flashcards({ savedVocab, onBack, onComplete, allVocabMap, recordExercise, meanings, resume }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [words, setWords] = useState<{word: string, def: string}[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [flipped, setFlipped] = useState(false);
 const stats = useRef({ memorized: 0, viewed: new Set<string>(), memorizedList: [] as string[] });
 const appliedResume = useRef(false);

 const [initialCount, setInitialCount] = useState(0);
 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 const list = resume.words.map((word: string) => ({
 word,
 def: meaningFor(word, savedVocab[word], allVocabMap, meanings || resume.meanings),
 srs: savedVocab[word]?.srs,
 })).filter((w: any) => w.def);
 setInitialCount(list.length);
 setWords(list);
 setCurrentIndex(Math.min(resume.index || 0, Math.max(list.length - 1, 0)));
 setFlipped(!!resume.flipped);
 return;
 }
 if (appliedResume.current) return;
 const list = Object.entries(savedVocab).map(([word, data]: any) => ({
 word,
 def: meaningFor(word, data, allVocabMap, meanings),
 srs: data.srs
 })).filter(w => w.def); 
 setInitialCount(list.length);

 const saved = localStorage.getItem('flashcards_progress');
 if (saved && !resume) {
 try {
 const { index, isFlipped, deckOrder } = JSON.parse(saved);
 const orderedList = [];
 const listMap = new Map(list.map(w => [w.word, w]));
 for (const w of deckOrder || []) {
 if (listMap.has(w)) {
 orderedList.push(listMap.get(w)!);
 listMap.delete(w);
 }
 }
 for (const w of listMap.values()) {
 orderedList.push(w);
 }
 
 setWords(orderedList);
 if (orderedList.length > 0) {
 setCurrentIndex(Math.min(index || 0, orderedList.length - 1));
 }
 setFlipped(!!isFlipped);
 return;
 } catch (e) {}
 }
 
 setWords(list.sort((a, b) => {
   const aReview = a.srs?.nextReviewDate || 0;
   const bReview = b.srs?.nextReviewDate || 0;
   return aReview - bReview;
 }));
 }, [savedVocab, allVocabMap, meanings, resume]);

 useEffect(() => {
 if (words.length > 0) {
 localStorage.setItem('flashcards_progress', JSON.stringify({
 index: currentIndex,
 isFlipped: flipped,
 deckOrder: words.map(w => w.word)
 }));
 saveExerciseSession({
 type: 'flashcards',
 words: words.map(w => w.word),
 index: currentIndex,
 score: stats.current.memorized,
 mistakes: [],
 flipped,
 meanings,
 });
 } else {
 localStorage.removeItem('flashcards_progress');
 }
 }, [currentIndex, flipped, words, meanings]);

 const handleBack = () => {
 onBack();
 };

 if (words.length === 0) {
 if (initialCount > 0) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 onComplete({ type: 'flashcards', memorized: stats.current.memorized, score: stats.current.memorized, views: stats.current.viewed.size, correctWords: stats.current.memorizedList });
 }, 100);
 return null;
 }
 return (
 <div className={EX_SHELL}>
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.you.re.all.done.de048b")}</h2>
 <p className="text-slate-500 mb-6">{t('learning.message.1fb3861307', { v0: initialCount })}</p>
 <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>
 </div>
 </div>
 );
 }
 return (
 <div className={EX_SHELL}>
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <Brain className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.not.enough.words.f79561")}</h2>
 <p className="text-slate-500">{t("learning.add.words.to.your.vocabulary.first.to.use.flashcards.2d47e6")}</p>
 </div>
 </div>
 );
 }

 const current = words[currentIndex];

 const playWord = (word: string) => { sharedPlayWord(word, 1.0, speechLocale); };

 const nextCard = () => {
 stats.current.viewed.add(current.word);
 setFlipped(false);
 setTimeout(() => {
 setCurrentIndex((i) => (i + 1) % words.length);
 }, 150);
 };


 return (
 <div className={EX_SHELL}>
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>

 <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
 <h2 className="font-serif text-xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2 md:gap-3 min-w-0">
 <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-zinc-900 shrink-0" />{' '}{t("learning.flashcards.2c6822")}</h2>
 <span className="text-sm md:text-lg font-bold text-slate-500 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shrink-0">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className="relative overflow-hidden rounded-xl" style={{ perspective: '1000px' }}>
 <div
 onClick={() => { playSound('bop'); setFlipped(!flipped); }}
 className="relative w-full min-h-[280px] md:min-h-[380px] cursor-pointer transition-transform duration-500"
 style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
 >
 {/* Front */}
 <div
 className="absolute inset-0 bg-white rounded-2xl p-4 md:p-8 border-2 border-slate-200 flex flex-col items-center justify-center gap-4 overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]"
 style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as any }}
 >
 <h3 className={EX_WORD}>{current.word}</h3>
 <button
 onClick={(e) => { e.stopPropagation(); playWord(current.word); }}
 className="p-3 md:p-4 rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all focus:outline-none shrink-0"
 >
 <Volume2 className="w-6 h-6 md:w-8 md:h-8"/>
 </button>
 <TranslateInline word={current.word} />
 <p className="absolute bottom-4 md:bottom-8 text-slate-400 font-medium tracking-wide uppercase text-xs md:text-sm">{t("learning.click.to.flip.8ab133")}</p>
 </div>

 {/* Back — rotateY keeps the card in the viewport (rotateX pushed content off-screen on phones) */}
 <div
 className="absolute inset-0 bg-zinc-900 text-white dark-keep rounded-xl p-4 md:p-8 shadow-xl border border-black flex flex-col items-center justify-center overflow-hidden"
 style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as any, transform: 'rotateY(180deg)' }}
 >
 <h3 className="text-lg md:text-2xl font-serif font-bold mb-3 md:mb-6 text-zinc-200 break-words max-w-full text-center px-2">{current.word}</h3>
 <p className={EX_DEF + ' text-zinc-100'}>{current.def || t("learning.added.from.reading.passage.98d1bb")}</p>
 <p className="absolute bottom-4 md:bottom-8 text-zinc-400 font-medium tracking-wide uppercase text-xs md:text-sm">{t("learning.click.to.flip.back.211517")}</p>
 </div>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 md:gap-4 mt-8 md:mt-12 w-full max-w-sm mx-auto">
 <button 
 onClick={() => {
 playSound('bop');
 nextCard();
 }} 
 className="flex-1 py-4 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 shadow-sm border border-rose-200 font-bold transition-all flex items-center justify-center gap-2"
 >
 <XCircle className="w-6 h-6" />{' '}{t("learning.not.memorized.987c04")}</button>
 <button 
 onClick={() => {
 playSound('success');
 stats.current.memorized += 1;
 stats.current.memorizedList.push(current.word);
 stats.current.viewed.add(current.word);
 setFlipped(false);
 setTimeout(() => {
 setWords(w => {
 const next = w.filter((_, i) => i !== currentIndex);
 if (next.length > 0) {
 setCurrentIndex(i => i >= next.length ? 0 : i);
 } else {
 playSound('complete');
 }
 return next;
 });
 }, 150);
 }} 
 className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md font-bold transition-all flex items-center justify-center gap-2"
 >
 <CheckCircle2 className="w-6 h-6" />{' '}{t("learning.memorized.ab3c16")}</button>
 </div>
 </div>
 );
}

export function PronunciationDrill({ savedVocab, onBack, onComplete, recordExercise, resume, hideTranslate, hideBack, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale, contentLang } = useContentLang();
 const [words, setWords] = useState<string[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isListening, setIsListening] = useState(false);
 const [result, setResult] = useState<'success' | 'almost' | 'fail' | null>(null);
 const [heardText, setHeardText] = useState<string>('');
 const [mistakes, setMistakes] = useState<string[]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const appliedResume = useRef(false);
 
 const stats = useRef({ correct: 0, almost: 0 });

 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 setWords(resume.words);
 setCurrentIndex(Math.min(resume.index || 0, resume.words.length - 1));
 setMistakes(resume.mistakes || []);
 stats.current.correct = resume.score || 0;
 return;
 }
 if (appliedResume.current) return;
 const list = Object.keys(savedVocab);
 setWords(list.sort(() => Math.random() - 0.5));
 }, [savedVocab, resume]);

 useEffect(() => {
 if (disableSession || isFinished || words.length === 0) return;
 saveExerciseSession({
 type: 'pronunciation',
 words,
 index: currentIndex,
 score: stats.current.correct,
 mistakes,
 });
 }, [words, currentIndex, mistakes, isFinished, disableSession]);

 if (words.length === 0) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <Mic className="w-16 h-16 text-rose-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.no.words.to.practice.7bccb9")}</h2>
 <p className="text-slate-500">{t("learning.add.words.to.your.vocabulary.first.to.drill.pronunciation.d7eef1")}</p>
 </div>
 </div>
 );
 }

 const currentWord = words[currentIndex];

 const playWord = (word: string) => { sharedPlayWord(word, 1.0, speechLocale); };

 const startListening = () => {
 if (isListening) return;
 playSound('start_record');
 setIsListening(true);
 setResult(null);
 try {
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) {
 alert(t("learning.speech.recognition.not.supported.9a4ce8"));
 setIsListening(false);
 return;
 }
 const recognition = new SpeechRecognition();
 recognition.continuous = false;
 recognition.interimResults = true;
 recognition.maxAlternatives = 5;
 recognition.lang = speechLocale;

 let hasMatched = false;
 let sawAnyResult = false;
 let recognitionFailed = false;
 let bestHeard = '';
 const cleanTarget = normalizeForMatch(currentWord, contentLang);
 setHeardText('');

 type Grade = 'exact' | 'slight' | 'none';
 const gradeTranscript = (raw: string): Grade => {
 if (!raw.trim() || !cleanTarget) return 'none';
 const text = raw.toLowerCase();
 const cleanFull = normalizeForMatch(text, contentLang);
 bestHeard = raw.trim();
 if (cleanFull.includes(cleanTarget) || cleanTarget.includes(cleanFull)) return 'exact';
 const fullType = getMatchType(cleanTarget, cleanFull, contentLang);
 if (fullType === 'exact') return 'exact';
 if (fullType === 'slight') return 'slight';

 const transcriptWords = tokenizeForLang(text, contentLang)
 .map((w: string) => normalizeForMatch(w, contentLang))
 .filter(Boolean);

 let best: Grade = 'none';
 for (let i = 0; i < transcriptWords.length; i++) {
 let combined = '';
 for (let j = 0; j < 5 && i + j < transcriptWords.length; j++) {
 combined += transcriptWords[i + j];
 const t1 = getMatchType(cleanTarget, combined, contentLang);
 const t2 = getMatchType(cleanTarget, transcriptWords[i + j], contentLang);
 for (const t of [t1, t2]) {
 if (t === 'exact') return 'exact';
 if (t === 'slight') best = 'slight';
 }
 const tw = transcriptWords[i + j];
 if (
 tw.length >= 2 &&
 cleanTarget.length >= 2 &&
 Math.abs(tw.length - cleanTarget.length) <= 2 &&
 (tw.includes(cleanTarget) || cleanTarget.includes(tw))
 ) {
 best = best === 'exact' ? 'exact' : 'slight';
 }
 }
 }
 return best;
 };

 const markSuccess = (almost = false) => {
 if (hasMatched) return;
 hasMatched = true;
 setHeardText(bestHeard);
 if (almost) {
 answerFeedback(true, { questionId: currentWord, word: currentWord, close: true });
 stats.current.almost += 1;
 setResult('almost');
 } else {
 answerFeedback(true, { questionId: currentWord, word: currentWord });
 stats.current.correct += 1;
 setResult('success');
 }
 setIsListening(false);
 try { recognition.stop(); } catch {}
 setTimeout(() => {
 setResult(null);
 setHeardText('');
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 playSound('click');
 setCurrentIndex((i) => i + 1);
 }
 }, almost ? 1800 : 1500);
 };

 recognition.onresult = (event: any) => {
 if (hasMatched) return;
 sawAnyResult = true;
 let bestGrade: Grade = 'none';
 for (let i = event.resultIndex; i < event.results.length; ++i) {
 const resultRow = event.results[i];
 const n = Math.min(resultRow.length || 1, 5);
 for (let a = 0; a < n; a++) {
 const transcript = resultRow[a]?.transcript || '';
 const g = gradeTranscript(transcript);
 if (g === 'exact') { bestGrade = 'exact'; break; }
 if (g === 'slight') bestGrade = 'slight';
 }
 if (bestGrade === 'exact') break;
 }
 if (bestHeard) setHeardText(bestHeard);
 if (bestGrade === 'exact') markSuccess(false);
 else if (bestGrade === 'slight' && event.results[event.results.length - 1]?.isFinal) markSuccess(true);
 };

 recognition.onerror = () => { recognitionFailed = true; setIsListening(false); };
 recognition.onend = () => {
 setTimeout(() => {
 if (hasMatched) return;
 setHeardText(bestHeard || '');
 setResult(prev => {
 if (prev === 'success' || prev === 'almost') return prev;
 if (sawAnyResult && !recognitionFailed) {
 answerFeedback(false, { questionId: currentWord, word: currentWord });
 setMistakes(m => [...new Set([...m, currentWord])]);
 return 'fail';
 }
 return prev;
 });
 setIsListening(false);
 }, 280);
 };

 recognition.start();
 } catch (e) {
 console.error(e);
 setIsListening(false);
 }
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 const correctWords = words.filter(w => !mistakes.includes(w));
 onComplete({ type: 'pronunciation', score: stats.current.correct + stats.current.almost, mistakes, correctWords, almost: stats.current.almost });
 }, 100);
 return null;
 }
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.exercise.complete.8cdae8")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t("learning.you.ve.successfully.practiced.pronunciation.for.all.words.af4bc5")}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => { setIsFinished(false); setCurrentIndex(0); setResult(null); }} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.practice.again.019dcd")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex items-center justify-between mb-8">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <Mic className="w-8 h-8 text-rose-500" />{' '}{t("learning.pronunciation.drill.db14d9")}</h2>
 <span className="text-lg font-bold text-slate-500 bg-white px-4 py-2 rounded-xl ">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className={`bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 lg:p-12 border-2 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] ${result === 'success' ? 'border-emerald-500 shadow-emerald-100' : result === 'almost' ? 'border-amber-400 shadow-amber-100' : result === 'fail' ? 'border-rose-500 shadow-rose-100' : 'border-slate-200'} transition-all text-center flex flex-col items-center justify-center min-h-[280px] md:min-h-[400px] relative overflow-hidden`}>
 
 {result === 'success' && <div className="absolute top-8 right-8 text-emerald-500 flex items-center gap-2 font-bold text-lg animate-in zoom-in"><CheckCircle2 className="w-8 h-8"/>{' '}{t("learning.perfect.7a9793")}</div>}
 {result === 'almost' && <div className="absolute top-8 right-8 text-amber-500 flex items-center gap-2 font-bold text-lg animate-in zoom-in"><CheckCircle2 className="w-8 h-8"/>{' '}{t("learning.almost.cfd186")}</div>}
 {result === 'fail' && <div className="absolute top-8 right-8 text-rose-500 flex items-center gap-2 font-bold text-lg animate-in zoom-in"><XCircle className="w-8 h-8"/>{' '}{t("action.tryAgain")}</div>}

 <h3 className={`${EX_WORD} mb-4`}>{currentWord}</h3>
 {!hideTranslate && <TranslateInline word={currentWord} />}
 {heardText ? (
 <p className="mt-3 text-sm text-slate-500">{t("learning.heard.cdcc23")}{' '}<span className="font-semibold text-slate-700">&ldquo;{heardText}&rdquo;</span></p>
 ) : null}
 <div className="mb-8" />
 <div className="flex flex-col sm:flex-row items-center gap-6">
 <button 
 onClick={(e) => { e.stopPropagation(); playWord(currentWord); }}
 className="font-serif px-8 py-4 rounded-2xl bg-zinc-100 text-zinc-900 font-extrabold hover:bg-zinc-200 transition-all flex items-center gap-3 text-lg"
 >
 <Volume2 className="w-6 h-6"/>{' '}{t("lesson.listen")}</button>
 <button 
 onClick={startListening}
 disabled={isListening}
 className={`px-10 py-5 rounded-2xl font-bold transition-all flex items-center gap-3 text-xl shadow-lg hover:-translate-y-1 ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-200' : result === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200' : result === 'almost' ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
 >
 <Mic className={`w-6 h-6 ${isListening ? 'animate-bounce' : ''}`}/> {isListening ? t("learning.listening.4fc251") : result === 'success' ? t("learning.mastered.429b84") : result === 'almost' ? t("learning.close.enough.cb4722") : t("learning.click.to.speak.920335")}
 </button>
 </div>
 </div>

 <div className="flex justify-between items-center mt-8">
 <button 
 onClick={() => { 
 setResult(null); 
 setCurrentIndex(i => (i - 1 + words.length) % words.length); 
 }} 
 className="px-6 py-4 rounded-2xl bg-white text-slate-600 hover:text-zinc-900 hover:bg-zinc-100 font-bold flex items-center gap-2 transition-all"
 >
 <ChevronRight className="w-5 h-5 rotate-180" />{' '}{t("learning.previous.50f942")}</button>
 <button 
 onClick={() => { 
 setResult(null); 
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1); 
 }
 }} 
 className="px-8 py-4 rounded-2xl bg-zinc-900 text-white hover:bg-black font-bold flex items-center gap-2 transition-all shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
 >
 {currentIndex === words.length - 1 ? t("learning.finish.b74bde") : t("learning.next.word.786afc")} <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 );
}

export function DefinitionQuiz({ savedVocab, onBack, onComplete, allVocabMap, recordExercise, meanings, resume, hideTranslate, hideBack, disableSession, keepAllWords }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [words, setWords] = useState<{word: string, def: string}[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [options, setOptions] = useState<string[]>([]);
 const [selectedOption, setSelectedOption] = useState<string | null>(null);
 const [score, setScore] = useState(0);
 const [mistakes, setMistakes] = useState<string[]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const appliedResume = useRef(false);
 const completeFired = useRef(false);

 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 const list = resume.words.map((word: string) => ({
 word,
 def: meaningFor(word, savedVocab[word], allVocabMap, meanings || resume.meanings) || word,
 })).filter((w: any) => keepAllWords ? !!w.word : (w.def && w.def !== 'No definition'));
 setWords(list);
 setCurrentIndex(Math.min(resume.index || 0, Math.max(list.length - 1, 0)));
 setScore(resume.score || 0);
 setMistakes(resume.mistakes || []);
 return;
 }
 if (appliedResume.current) return;
 const list = Object.entries(savedVocab).map(([word, data]: any) => ({
 word,
 def: meaningFor(word, data, allVocabMap, meanings) || (keepAllWords ? (data?.definition || word) : 'No definition')
 })).filter(w => keepAllWords ? !!w.word : (w.def && w.def !== 'No definition')).sort(() => Math.random() - 0.5);
 
 setWords(list);
 }, [savedVocab, allVocabMap, meanings, resume, keepAllWords]);

 // Fire onComplete exactly once when finished (avoid setTimeout-in-render loops).
 useEffect(() => {
 if (!isFinished || !onComplete || completeFired.current) return;
 completeFired.current = true;
 clearExerciseSession();
 const correctWords = words.map(w => w.word).filter(w => !mistakes.includes(w));
 onComplete({ type: 'definition-quiz', score, mistakes, correctWords, total: words.length });
 }, [isFinished, onComplete, words, score, mistakes]);

 useEffect(() => {
 if (disableSession || isFinished || words.length === 0) return;
 saveExerciseSession({
 type: 'definition-quiz',
 words: words.map(w => w.word),
 index: currentIndex,
 score,
 mistakes,
 meanings,
 });
 }, [words, currentIndex, score, mistakes, meanings, isFinished, disableSession]);

 useEffect(() => {
 if (words.length > 0 && currentIndex < words.length) {
 const current = words[currentIndex];
 const pool = meanings
 ? Object.values(meanings as Record<string, string>)
 : Array.from(allVocabMap.values());
 const otherDefs = pool
 .filter((d: any) => d !== current.def && typeof d === 'string' && d.length > 0)
 .sort(() => Math.random() - 0.5)
 .slice(0, 3) as string[];
 
 const allOptions = [...otherDefs, current.def].sort(() => Math.random() - 0.5);
 while(allOptions.length < 4) {
 allOptions.push("To do something carefully");
 }
 setOptions(allOptions.slice(0, 4));
 setSelectedOption(null);
 }
 }, [currentIndex, words, allVocabMap, meanings]);

 const minWords = keepAllWords ? 1 : hideTranslate ? 2 : 4;
 if (words.length < minWords) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.need.more.words.0fe8f1")}</h2>
 <p className="text-slate-500">{t('learning.message.2fe93288b8', { v0: minWords })}</p>
 </div>
 </div>
 );
 }

 const handleSelect = (opt: string) => {
 if (selectedOption) return;
 setSelectedOption(opt);
 
 const isCorrect = opt === words[currentIndex].def;
 if (isCorrect) {
 answerFeedback(true, { questionId: words[currentIndex].word, word: words[currentIndex].word });
 setScore(s => s + 1);
 } else {
 answerFeedback(false, { questionId: words[currentIndex].word, word: words[currentIndex].word });
 setMistakes(m => [...new Set([...m, words[currentIndex].word])]);
 }

 setTimeout(() => {
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1);
 }
 }, 1500);
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 // Parent handles result via onComplete effect; keep a quiet placeholder (no blank flash).
 if (onComplete) {
 return (
 <div className={`${EX_SHELL} flex items-center justify-center min-h-[40vh]`}>
 <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
 </div>
 );
 }
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.quiz.complete.1f6753")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t('learning.message.de772f82d2', { v0: score, v1: words.length })}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => { completeFired.current = false; setIsFinished(false); setCurrentIndex(0); setScore(0); setMistakes([]); setWords([...words].sort(() => Math.random() - 0.5)); }} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.play.again.65a693")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 const current = words[currentIndex] || { word: '' };

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex items-center justify-between mb-8">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <BookOpen className="w-8 h-8 text-amber-500" />{' '}{t("learning.quiz.25c86f")}</h2>
 <span className="text-lg font-bold text-slate-500 bg-white px-4 py-2 rounded-xl ">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className="bg-white rounded-2xl p-4 md:p-8 border-2 border-slate-200 mb-6 text-center overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <h3 className={`${EX_WORD} mb-4`}>{current.word}</h3>
 <p className="text-slate-500 uppercase tracking-wider font-bold">{t("today.meaning")}</p>
 {!hideTranslate && <TranslateInline word={current.word} />}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {options.map((opt, i) => {
 let stateClass = "bg-white border-slate-200 hover:border-zinc-400 text-slate-700 hover:-translate-y-1";
 if (selectedOption) {
 if (opt === current.def) {
 stateClass = "bg-emerald-500 border-emerald-600 text-white shadow-lg pointer-events-none";
 } else if (opt === selectedOption) {
 stateClass = "bg-rose-500 border-rose-600 text-white shadow-lg pointer-events-none";
 } else {
 stateClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50 pointer-events-none";
 }
 }

 return (
 <button 
 key={i}
 onClick={() => handleSelect(opt)}
 className={`${EX_OPTION} ${stateClass}`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 );
}

export function SpellingPractice({ savedVocab, onBack, onComplete, recordExercise, resume, hideBack, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [words, setWords] = useState<string[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [inputVal, setInputVal] = useState('');
 const [score, setScore] = useState(0);
 const [mistakes, setMistakes] = useState<string[]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
 const inputRef = useRef<HTMLInputElement>(null);
 const appliedResume = useRef(false);

 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 setWords(resume.words);
 setCurrentIndex(Math.min(resume.index || 0, resume.words.length - 1));
 setScore(resume.score || 0);
 setMistakes(resume.mistakes || []);
 return;
 }
 if (appliedResume.current) return;
 const list = Object.keys(savedVocab);
 setWords(list.sort(() => Math.random() - 0.5));
 }, [savedVocab, resume]);

 useEffect(() => {
 if (disableSession || isFinished || words.length === 0) return;
 saveExerciseSession({
 type: 'spelling-practice',
 words,
 index: currentIndex,
 score,
 mistakes,
 });
 }, [words, currentIndex, score, mistakes, isFinished, disableSession]);

 useEffect(() => {
 if (words.length > 0 && currentIndex < words.length && status === 'idle') {
 playWord(words[currentIndex]);
 setTimeout(() => inputRef.current?.focus(), 100);
 }
 }, [currentIndex, words, status]);

 if (words.length === 0) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <Type className="w-16 h-16 text-cyan-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.need.more.words.0fe8f1")}</h2>
 <p className="text-slate-500">{t("learning.save.words.to.your.vocabulary.to.play.spelling.practice.0f2992")}</p>
 </div>
 </div>
 );
 }

 const playWord = (word: string) => { sharedPlayWord(word, 1.0, speechLocale); };

 const currentWord = words[currentIndex];

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (status !== 'idle' || !inputVal.trim()) return;

 const cleanInput = inputVal.trim().toLowerCase();
 const cleanWord = currentWord.toLowerCase();

 if (cleanInput === cleanWord) {
 answerFeedback(true, { questionId: currentWord, word: currentWord });
 setStatus('correct');
 setScore(s => s + 1);
 } else {
 answerFeedback(false, { questionId: currentWord, word: currentWord });
 setStatus('incorrect');
 setMistakes(m => [...new Set([...m, currentWord])]);
 }

 setTimeout(() => {
 setInputVal('');
 setStatus('idle');
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1);
 }
 }, 2000);
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 const correctWords = words.filter(w => !mistakes.includes(w));
 onComplete({ type: 'spelling-practice', score, mistakes, correctWords });
 }, 100);
 return null;
 }
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.practice.complete.588a5f")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t('learning.message.be29b0628e', { v0: score, v1: words.length })}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => { setIsFinished(false); setCurrentIndex(0); setScore(0); setMistakes([]); setStatus('idle'); setWords([...words].sort(() => Math.random() - 0.5)); }} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.practice.again.019dcd")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex items-center justify-between mb-8">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <Type className="w-8 h-8 text-cyan-500" />{' '}{t("learning.spelling.practice.56660a")}</h2>
 <span className="text-lg font-bold text-slate-500 bg-white px-4 py-2 rounded-xl ">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center relative overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 {status === 'correct' && <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>}
 {status === 'incorrect' && <div className="absolute top-0 inset-x-0 h-2 bg-rose-500"></div>}

 <button 
 onClick={() => playWord(currentWord)}
 className="mx-auto w-20 h-20 bg-zinc-100 text-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-200 hover:scale-110 transition-all mb-8 shadow-sm"
 >
 <Volume2 className="w-10 h-10" />
 </button>

 <form onSubmit={handleSubmit} className="max-w-md mx-auto">
 <input
 ref={inputRef}
 type="text"
 value={inputVal}
 onChange={(e) => setInputVal(e.target.value)}
 disabled={status !== 'idle'}
 placeholder={t("learning.type.what.you.hear.560934")}
 className={`w-full max-w-full text-center text-[clamp(1.25rem,5vw,1.875rem)] font-serif py-4 md:py-6 px-3 md:px-4 rounded-2xl border-4 focus:outline-none transition-colors mb-6 break-words [overflow-wrap:anywhere]
 ${status === 'idle' ? 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800' :
 status === 'correct' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' :
 'bg-rose-50 border-rose-400 text-rose-700'}`}
 autoComplete="off"
 autoCorrect="off"
 spellCheck="false"
 />

 {status === 'incorrect' && (
 <div className="mb-6 animate-in slide-in-from-bottom-2">
 <p className="text-slate-500 font-medium mb-1">{t("learning.correct.spelling.4203b2")}</p>
 <p className={`${EX_WORD} text-emerald-600`}>{currentWord}</p>
 <TranslateInline word={currentWord} />
 </div>
 )}

 <button 
 type="submit" 
 disabled={status !== 'idle' || !inputVal.trim()}
 className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl text-lg hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
 >{t("learning.check.spelling.02175a")}</button>
 </form>
 </div>
 </div>
 );
}


export function WordMatch({ savedVocab, onBack, onComplete, allVocabMap, recordExercise, meanings, resume, hideBack, hideDifficulty, pairCount, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const vocabCount = Object.keys(savedVocab).length;
 const defaultPairs = typeof pairCount === 'number' ? pairCount : Math.min(Math.max(vocabCount, 2), 15);
 const [difficulty, setDifficulty] = useState<number>(() => Math.min(Math.max(defaultPairs, 2), 15));
 const [pairs, setPairs] = useState<{word: string, def: string}[]>([]);
 const [words, setWords] = useState<{id: string, text: string, type: 'word' | 'def', isMatched: boolean}[]>([]);
 const [selectedWord, setSelectedWord] = useState<string | null>(null);
 const [selectedDef, setSelectedDef] = useState<string | null>(null);
 const [score, setScore] = useState(0);
 const [mistakes, setMistakes] = useState<string[]>([]);
 const appliedResume = useRef(false);
 const matchingRef = useRef(false);
 const effectivePairs = typeof pairCount === 'number' ? pairCount : difficulty;
 
 const initGame = (numPairs = effectivePairs, fromResume?: ExerciseSessionSnapshot) => {
 const sourceWords = fromResume?.words?.length
 ? fromResume.words
 : Object.keys(savedVocab).sort(() => Math.random() - 0.5).slice(0, Math.min(numPairs, Object.keys(savedVocab).length));
 const list = sourceWords.map((word: string) => ({
 word,
 def: meaningFor(word, savedVocab[word], allVocabMap, meanings || fromResume?.meanings),
 })).filter((w: any) => w.def);

 setPairs(list);
 const matched = new Set(fromResume?.matchedIds || []);
 const w = list.map(l => ({ id: l.word, text: l.word, type: 'word' as const, isMatched: matched.has(l.word) })).sort(() => Math.random() - 0.5);
 const d = list.map(l => ({ id: l.word, text: l.def || 'From passage', type: 'def' as const, isMatched: matched.has(l.word) })).sort(() => Math.random() - 0.5);
 
 setWords([...w, ...d]);
 setScore(fromResume?.score || matched.size || 0);
 setMistakes(fromResume?.mistakes || []);
 };

 useEffect(() => {
 if (disableSession) {
 if (!appliedResume.current) {
 appliedResume.current = true;
 initGame(effectivePairs);
 }
 return;
 }
 if (appliedResume.current && !resume) return;
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 initGame(resume.words.length, resume);
 return;
 }
 if (appliedResume.current) return;
 initGame(effectivePairs);
 }, [savedVocab, allVocabMap, meanings, difficulty, resume, pairCount, disableSession]);

 useEffect(() => {
 if (disableSession) return;
 if (pairs.length === 0 || score >= pairs.length) return;
 saveExerciseSession({
 type: 'word-match',
 words: pairs.map(p => p.word),
 index: score,
 score,
 mistakes,
 meanings,
 matchedIds: words.filter(w => w.type === 'word' && w.isMatched).map(w => w.id),
 });
 }, [pairs, words, score, mistakes, meanings, disableSession]);

 if (Object.keys(savedVocab).length < 2) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.need.more.words.0fe8f1")}</h2>
 <p className="text-slate-500">{t("learning.save.at.least.2.words.to.your.vocabulary.to.play.word.matc.ed4fde")}</p>
 </div>
 </div>
 );
 }

 const handleSelect = (item: any) => {
 if (item.isMatched || matchingRef.current) return;

 let w = selectedWord;
 let d = selectedDef;

 if (item.type === 'word') {
 if (selectedWord === item.id) w = null;
 else w = item.id;
 } else {
 if (selectedDef === item.id) d = null;
 else d = item.id;
 }

 setSelectedWord(w);
 setSelectedDef(d);

 if (w && d) {
 matchingRef.current = true;
 if (w === d) {
 // match
 answerFeedback(true, { questionId: String(w), word: w });
 setWords(prev => prev.map(p => p.id === w ? {...p, isMatched: true} : p));
 const nextScore = score + 1;
 setScore(nextScore);
 if (nextScore === pairs.length) {
 playSound('complete');
 const correctWords = Array.from(new Set(words.map(w => w.id)));
 setTimeout(() => {
 clearExerciseSession();
 if (onComplete) {
 onComplete({ type: 'word-match', score: nextScore, mistakes, correctWords });
 } else {
 recordExercise?.('word-match', { mistakes, score: nextScore, correctWords });
 onBack();
 }
 }, 1500);
 }
 } else {
 answerFeedback(false, { questionId: String(w), word: w });
 const wWord = words.find(x => x.id === w && x.type === 'word')?.text || w;
 setMistakes(m => [...new Set([...m, wWord])]);
 }
 setTimeout(() => {
 matchingRef.current = false;
 setSelectedWord(null);
 setSelectedDef(null);
 }, 500);
 }
 };

 const handleBack = () => {
 onBack();
 };

 if (score === pairs.length && pairs.length > 0) {
 if (onComplete) return null;
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.exercise.complete.8cdae8")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t("learning.you.successfully.matched.all.the.words.50f635")}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => initGame(effectivePairs)} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.play.again.65a693")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />{' '}{t("learning.word.match.a3d65e")}</h2>
 
 <div className="flex items-center gap-4">
 {!hideDifficulty && (
 <div className="flex bg-slate-100 p-1 rounded-xl">
 <button onClick={() => setDifficulty(5)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${difficulty === 5 ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t("learning.easy.5.85c815")}</button>
 <button onClick={() => setDifficulty(10)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${difficulty === 10 ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t("learning.medium.10.741f61")}</button>
 <button onClick={() => setDifficulty(15)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${difficulty === 15 ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t("learning.hard.15.da6f62")}</button>
 </div>
 )}
 {score === pairs.length && (
 <button onClick={() => initGame(effectivePairs)} className="px-6 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition">{t("learning.play.again.65a693")}</button>
 )}
 </div>
 </div>

 <div className="flex flex-col md:flex-row gap-6">
 <div className="flex-1 space-y-4">
 <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">{t("learning.words.d26d55")}</h3>
 {words.filter(w => w.type === 'word').map((item, i) => {
 let stateClass = "bg-white border-slate-200 hover:border-zinc-400 text-slate-700 shadow-sm cursor-pointer";
 if (item.isMatched) {
 stateClass = "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-50 cursor-default scale-95";
 } else if (selectedWord === item.id) {
 stateClass = "bg-zinc-900 border-zinc-900 text-white shadow-md scale-[1.02]";
 } else if (selectedWord && selectedDef && item.id !== selectedWord && item.id !== selectedDef) {
 if (selectedWord === item.id) {
 stateClass = "bg-rose-500 border-rose-500 text-white";
 }
 }

 return (
 <div 
 key={`word-${i}`} 
 onClick={() => handleSelect(item)}
 className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-center overflow-hidden min-w-0 ${stateClass}`}
 style={{ minHeight: '100px' }}
 >
 <span className="font-bold text-lg md:text-2xl capitalize break-words [overflow-wrap:anywhere] max-w-full px-1">
 {item.text}
 </span>
 </div>
 );
 })}
 </div>

 <div className="flex-1 space-y-4">
 <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">{t("learning.meanings.47dcde")}</h3>
 {words.filter(w => w.type === 'def').map((item, i) => {
 let stateClass = "bg-white border-slate-200 hover:border-zinc-400 text-slate-700 shadow-sm cursor-pointer";
 if (item.isMatched) {
 stateClass = "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-50 cursor-default scale-95";
 } else if (selectedDef === item.id) {
 stateClass = "bg-zinc-900 border-zinc-900 text-white shadow-md scale-[1.02]";
 } else if (selectedWord && selectedDef && item.id !== selectedWord && item.id !== selectedDef) {
 if (selectedDef === item.id) {
 stateClass = "bg-rose-500 border-rose-500 text-white";
 }
 }

 return (
 <div 
 key={`def-${i}`} 
 onClick={() => handleSelect(item)}
 className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-center overflow-hidden min-w-0 ${stateClass}`}
 style={{ minHeight: '100px' }}
 >
 <span className="font-medium text-base md:text-lg leading-relaxed break-words [overflow-wrap:anywhere] max-w-full px-1">
 {item.text}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}

export function WordScramble({ savedVocab, onBack, onComplete, allVocabMap, recordExercise, resume, meanings, hideTranslate, hideBack, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [words, setWords] = useState<{word: string, def: string, scrambled: string[]}[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [selectedLetters, setSelectedLetters] = useState<{char: string, origIndex: number}[]>([]);
 const [score, setScore] = useState(0);
 const [mistakes, setMistakes] = useState<string[]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
 const appliedResume = useRef(false);

 const scrambleWord = (word: string) => {
 let scrambled = word.split('');
 while (scrambled.join('') === word && word.length > 1) {
 scrambled = scrambled.sort(() => Math.random() - 0.5);
 }
 return scrambled;
 };

 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current && !disableSession) {
 appliedResume.current = true;
 const list = resume.words.map((word: string) => {
 const data = savedVocab[word];
 const def = meaningFor(word, data, allVocabMap, meanings || resume.meanings) || 'No definition';
 return { word, def, scrambled: scrambleWord(word) };
 }).filter(w => w.def && w.def !== 'No definition');
 setWords(list);
 setCurrentIndex(Math.min(resume.index || 0, Math.max(list.length - 1, 0)));
 setScore(resume.score || 0);
 setMistakes(resume.mistakes || []);
 return;
 }
 if (appliedResume.current) return;
 const list = Object.entries(savedVocab).map(([word, data]: any) => {
 const def = meaningFor(word, data, allVocabMap, meanings) || 'No definition';
 return { word, def, scrambled: scrambleWord(word) };
 }).filter(w => w.def && w.def !== 'No definition').sort(() => Math.random() - 0.5);
 setWords(list);
 }, [savedVocab, allVocabMap, meanings, resume, disableSession]);

 useEffect(() => {
 if (disableSession || isFinished || words.length === 0) return;
 saveExerciseSession({
 type: 'word-scramble',
 words: words.map(w => w.word),
 index: currentIndex,
 score,
 mistakes,
 });
 }, [words, currentIndex, score, mistakes, isFinished, disableSession]);

 if (words.length === 0) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <Shuffle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.need.more.words.0fe8f1")}</h2>
 <p className="text-slate-500">{t("learning.save.words.with.definitions.to.play.word.scramble.6c0e70")}</p>
 </div>
 </div>
 );
 }

 const current = words[currentIndex];

 const handleLetterClick = (char: string, index: number) => {
 if (status !== 'idle') return;
 if (selectedLetters.some(l => l.origIndex === index)) {
 setSelectedLetters(prev => prev.filter(l => l.origIndex !== index));
 } else {
 setSelectedLetters(prev => [...prev, { char, origIndex: index }]);
 }
 };

 const handleClear = () => {
 if (status !== 'idle') return;
 setSelectedLetters([]);
 };

 const handleSubmit = () => {
 if (status !== 'idle' || selectedLetters.length !== current.word.length) return;

 const guess = selectedLetters.map(l => l.char).join('').toLowerCase();
 const cleanWord = current.word.toLowerCase();

 if (guess === cleanWord) {
 answerFeedback(true, { questionId: current.word, word: current.word });
 setStatus('correct');
 setScore(s => s + 1);
 } else {
 answerFeedback(false, { questionId: current.word, word: current.word });
 setStatus('incorrect');
 setMistakes(m => [...new Set([...m, current.word])]);
 }

 setTimeout(() => {
 setSelectedLetters([]);
 setStatus('idle');
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1);
 }
 }, 2000);
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 const correctWords = words.map(w => w.word).filter(w => !mistakes.includes(w));
 onComplete({ type: 'word-scramble', score, mistakes, correctWords });
 }, 100);
 return null;
 }
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.practice.complete.588a5f")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t('learning.message.be14cd7213', { v0: score, v1: words.length })}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => { setIsFinished(false); setCurrentIndex(0); setScore(0); setMistakes([]); setWords([...words].sort(() => Math.random() - 0.5)); }} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.practice.again.019dcd")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex items-center justify-between mb-8">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <Shuffle className="w-8 h-8 text-emerald-500" />{' '}{t("learning.word.scramble.b1e4dc")}</h2>
 <span className="text-lg font-bold text-slate-500 bg-white px-4 py-2 rounded-xl ">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center relative overflow-hidden shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 {status === 'correct' && <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>}
 {status === 'incorrect' && <div className="absolute top-0 inset-x-0 h-2 bg-rose-500"></div>}

 <p className={`${EX_DEF} text-slate-600 mb-8 md:mb-12`}>{current.def}</p>

 <div className="min-h-[80px] flex justify-center items-center gap-2 mb-8 border-b-2 border-slate-100 pb-4 flex-wrap">
 {selectedLetters.map((l, i) => (
 <span key={i} onClick={() => handleLetterClick(l.char, l.origIndex)} className="w-10 h-12 sm:w-12 sm:h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-3xl font-serif font-bold text-black bg-zinc-100 border-2 border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-200 uppercase transition-all shadow-sm shrink-0">
 {l.char}
 </span>
 ))}
 {selectedLetters.length === 0 && (
 <span className="text-slate-300 italic text-xl">{t("learning.select.letters.below.45208f")}</span>
 )}
 </div>

 <div className="flex flex-wrap justify-center gap-3 mb-8">
 {current.scrambled.map((char, i) => {
 const isSelected = selectedLetters.some(l => l.origIndex === i);
 return (
 <button 
 key={i} 
 onClick={() => handleLetterClick(char, i)}
 disabled={isSelected || status !== 'idle'}
 className={`w-10 h-12 sm:w-12 sm:h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-3xl font-serif font-bold rounded-xl border-2 transition-all shadow-sm uppercase shrink-0
 ${isSelected ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50' : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-400 hover:text-emerald-600 hover:-translate-y-1'}`}
 >
 {char}
 </button>
 )
 })}
 </div>

 {status === 'incorrect' && (
 <div className="mb-6 animate-in slide-in-from-bottom-2">
 <p className="text-slate-500 font-medium mb-1">{t("learning.correct.spelling.4203b2")}</p>
 <p className={`${EX_WORD} text-emerald-600 uppercase tracking-widest`}>{current.word}</p>
 {!hideTranslate && <TranslateInline word={current.word} />}
 </div>
 )}

 <div className="flex justify-center gap-4">
 <button onClick={handleClear} disabled={status !== 'idle' || selectedLetters.length === 0} className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl text-lg hover:bg-slate-200 disabled:opacity-50 transition-colors">{t("learning.clear.719ea3")}</button>
 <button onClick={handleSubmit} disabled={status !== 'idle' || selectedLetters.length !== current.word.length} className="px-10 py-4 bg-zinc-900 text-white font-bold rounded-2xl text-lg hover:bg-black disabled:opacity-50 transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.check.word.9f4981")}</button>
 </div>
 </div>
 </div>
 );
}

export function ListeningMatch({ savedVocab, onBack, onComplete, allVocabMap, recordExercise, meanings, resume, hideBack, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [words, setWords] = useState<{word: string, def: string}[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [options, setOptions] = useState<string[]>([]);
 const [selectedOption, setSelectedOption] = useState<string | null>(null);
 const [score, setScore] = useState(0);
 const [mistakes, setMistakes] = useState<string[]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const appliedResume = useRef(false);

 useEffect(() => {
 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 const list = resume.words.map((word: string) => ({
 word,
 def: meaningFor(word, savedVocab[word], allVocabMap, meanings || resume.meanings) || 'No definition',
 })).filter((w: any) => w.def && w.def !== 'No definition');
 setWords(list);
 setCurrentIndex(Math.min(resume.index || 0, Math.max(list.length - 1, 0)));
 setScore(resume.score || 0);
 setMistakes(resume.mistakes || []);
 return;
 }
 if (appliedResume.current) return;
 const list = Object.entries(savedVocab).map(([word, data]: any) => ({
 word,
 def: meaningFor(word, data, allVocabMap, meanings) || 'No definition'
 })).filter(w => w.def && w.def !== 'No definition').sort(() => Math.random() - 0.5);
 setWords(list);
 }, [savedVocab, allVocabMap, meanings, resume]);

 useEffect(() => {
 if (disableSession || isFinished || words.length === 0) return;
 saveExerciseSession({
 type: 'listening-match',
 words: words.map(w => w.word),
 index: currentIndex,
 score,
 mistakes,
 meanings,
 });
 }, [words, currentIndex, score, mistakes, meanings, isFinished, disableSession]);

 useEffect(() => {
 if (words.length > 0 && currentIndex < words.length) {
 const current = words[currentIndex];
 const pool = meanings
 ? Object.values(meanings as Record<string, string>)
 : Array.from(allVocabMap.values());
 const otherDefs = pool
 .filter((d: any) => d !== current.def && typeof d === 'string' && d.length > 0)
 .sort(() => Math.random() - 0.5)
 .slice(0, 3) as string[];
 
 const allOptions = [...otherDefs, current.def].sort(() => Math.random() - 0.5);
 while(allOptions.length < 4) allOptions.push("To do something carefully");
 setOptions(allOptions.slice(0, 4));
 setSelectedOption(null);
 
 setTimeout(() => playWord(current.word), 300);
 }
 }, [currentIndex, words, allVocabMap, meanings]);

 const minWords = hideBack ? 2 : 4;
 if (words.length < minWords) {
 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={onBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <Headphones className="w-16 h-16 text-blue-200 mx-auto mb-4" />
 <h2 className="font-serif text-2xl font-extrabold text-slate-800 mb-2">{t("learning.need.more.words.0fe8f1")}</h2>
 <p className="text-slate-500">{t('learning.message.dd6e002576', { v0: minWords })}</p>
 </div>
 </div>
 );
 }

 const playWord = (word: string) => { sharedPlayWord(word, 1.0, speechLocale); };

 const handleSelect = (opt: string) => {
 if (selectedOption) return;
 setSelectedOption(opt);
 
 const isCorrect = opt === words[currentIndex].def;
 if (isCorrect) {
 answerFeedback(true, { questionId: words[currentIndex].word, word: words[currentIndex].word });
 setScore(s => s + 1);
 } else {
 answerFeedback(false, { questionId: words[currentIndex].word, word: words[currentIndex].word });
 setMistakes(m => [...new Set([...m, words[currentIndex].word])]);
 }

 setTimeout(() => {
 if (currentIndex === words.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1);
 }
 }, 1500);
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 const correctWords = words.map(w => w.word).filter(w => !mistakes.includes(w));
 onComplete({ type: 'listening-match', score, mistakes, correctWords });
 }, 100);
 return null;
 }
 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold text-slate-800 mb-4">{t("learning.quiz.complete.1f6753")}</h2>
 <p className="text-slate-500 text-lg mb-8">{t('learning.message.de772f82d2', { v0: score, v1: words.length })}</p>
 <div className="flex justify-center gap-4">
 <button onClick={() => { setIsFinished(false); setCurrentIndex(0); setScore(0); setMistakes([]); setWords([...words].sort(() => Math.random() - 0.5)); }} className="px-6 py-3 bg-zinc-200 text-black font-bold rounded-xl shadow-sm hover:bg-zinc-300 transition">{t("learning.play.again.65a693")}</button>
 {!hideBack && <button onClick={handleBack} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("learning.return.to.vocabulary.2680af")}</button>}
 </div>
 </div>
 </div>
 );
 }

 const current = words[currentIndex] || { word: '' };

 return (
 <div className={EX_SHELL}>
 {!hideBack && (
 <button onClick={handleBack} className="mb-6 text-slate-500 hover:text-zinc-900 flex items-center gap-2 font-medium">
 <ArrowLeft className="w-5 h-5"/>{' '}{t("learning.back.to.vocabulary.0e3bfb")}</button>
 )}

 <div className="flex items-center justify-between mb-8">
 <h2 className="font-serif text-3xl font-extrabold text-slate-900 flex items-center gap-3">
 <Headphones className="w-8 h-8 text-blue-500" />{' '}{t("home.preview.listening")}</h2>
 <span className="text-lg font-bold text-slate-500 bg-white px-4 py-2 rounded-xl ">
 {currentIndex + 1} / {words.length}
 </span>
 </div>

 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 mb-6 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
 <button 
 onClick={() => playWord(current.word)}
 className="mx-auto w-24 h-24 bg-zinc-100 text-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-200 hover:scale-105 transition-all mb-4 shadow-sm"
 >
 <Volume2 className="w-12 h-12" />
 </button>
 <p className="text-slate-500 uppercase tracking-wider font-bold">{t("learning.listen.and.pick.the.correct.meaning.1e5fad")}</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {options.map((opt, i) => {
 let stateClass = "bg-white border-slate-200 hover:border-zinc-400 text-slate-700 hover:-translate-y-1";
 if (selectedOption) {
 if (opt === current.def) {
 stateClass = "bg-emerald-500 border-emerald-600 text-white shadow-lg pointer-events-none";
 } else if (opt === selectedOption) {
 stateClass = "bg-rose-500 border-rose-600 text-white shadow-lg pointer-events-none";
 } else {
 stateClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50 pointer-events-none";
 }
 }

 return (
 <button 
 key={i}
 onClick={() => handleSelect(opt)}
 className={`${EX_OPTION} ${stateClass}`}
 >
 {opt}
 </button>
 );
 })}
 </div>
 </div>
 );
}


const SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "She sells seashells by the seashore",
  "Learning a new language takes time and practice",
  "Reading every day improves your vocabulary",
  "The sun rises in the east and sets in the west",
  "Practice makes perfect when you study hard",
  "A good book can change the way you think",
  "Every journey begins with a single step",
  "Kindness costs nothing but means everything",
  "The best way to learn is by doing",
  "Success comes to those who work consistently",
  "Music has the power to change your mood",
  "Healthy habits lead to a better life",
  "Technology connects people around the world",
  "Children learn best when they are having fun",
  "Travelling helps you understand different cultures",
  "Hard work and dedication lead to success",
  "The environment needs our care and attention",
  "Education opens doors to new opportunities",
  "A positive attitude can change your day",
  "Listening carefully is a very important skill",
  "Cities are becoming larger and more crowded",
  "Fresh air and exercise are good for your health",
  "Sharing food with others brings people together",
  "Good communication helps solve most problems",
];

export function SentenceReorder({ savedVocab, onBack, onComplete, recordExercise, sentences: presetSentences, hideBack }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
  const [phase, setPhase] = React.useState<'setup' | 'playing'>(presetSentences?.length ? 'playing' : 'setup');
  const [customInput, setCustomInput] = React.useState('');
  const [queue, setQueue] = React.useState<string[]>(() =>
    presetSentences?.length ? [...presetSentences].slice(0, 10) : [],
  );
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [bankWords, setBankWords] = React.useState<{ id: string; word: string }[]>([]);
  const [chosen, setChosen] = React.useState<{ id: string; word: string }[]>([]);
  const [status, setStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = React.useState(0);
  const [mistakes, setMistakes] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);

  const scoreRef = React.useRef(0);
  const mistakesRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    if (presetSentences?.length && queue.length && bankWords.length === 0 && chosen.length === 0 && !done) {
      const words = queue[0].split(' ');
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setBankWords(shuffled.map((w, i) => ({ id: `${i}-${w}`, word: w })));
    }
  }, [presetSentences, queue, bankWords.length, chosen.length, done]);

  const loadSentence = (sentences: string[], idx: number) => {
    const sentence = sentences[idx];
    const words = sentence.split(' ');
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setBankWords(shuffled.map((w, i) => ({ id: `${i}-${w}`, word: w })));
    setChosen([]);
    setStatus('idle');
  };

  const startGame = (useCustom: boolean) => {
    let sentences: string[];
    if (useCustom && customInput.trim()) {
      sentences = customInput
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.split(' ').length > 1);
      if (sentences.length === 0) {
        sentences = [...SENTENCES].sort(() => Math.random() - 0.5).slice(0, 10);
      }
    } else {
      sentences = [...SENTENCES].sort(() => Math.random() - 0.5).slice(0, 10);
    }
    setQueue(sentences);
    setCurrentIdx(0);
    loadSentence(sentences, 0);
    scoreRef.current = 0;
    mistakesRef.current = [];
    setScore(0);
    setMistakes([]);
    setDone(false);
    setPhase('playing');
  };

  const pickWord = (item: { id: string; word: string }) => {
    if (status !== 'idle') return;
    setBankWords(b => b.filter(w => w.id !== item.id));
    setChosen(c => [...c, item]);
  };

  const removeWord = (item: { id: string; word: string }) => {
    if (status !== 'idle') return;
    setChosen(c => c.filter(w => w.id !== item.id));
    setBankWords(b => [...b, item]);
  };

  const checkAnswer = () => {
    const attempt = chosen.map(w => w.word).join(' ');
    const correct = queue[currentIdx];
    if (attempt === correct) {
      answerFeedback(true, { questionId: String(currentIdx), word: queue[currentIdx] });
      setStatus('correct');
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      answerFeedback(false, { questionId: String(currentIdx), word: queue[currentIdx] });
      setStatus('wrong');
      mistakesRef.current = [...new Set([...mistakesRef.current, correct])];
      setMistakes(mistakesRef.current);
    }
    setTimeout(() => {
      if (currentIdx + 1 >= queue.length) {
        playSound('complete');
        const finalScore = scoreRef.current;
        const finalMistakes = mistakesRef.current;
        const total = Math.max(1, queue.length);
        const correctWords = queue.filter(s => !finalMistakes.includes(s));
        setDone(true);
        onComplete?.({
          type: 'sentence-reorder',
          score: finalScore,
          total,
          percent: Math.round((finalScore / total) * 100),
          mistakes: finalMistakes,
          correctWords,
        });
      } else {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        loadSentence(queue, nextIdx);
      }
    }, 1500);
  };

  const handleBack = () => {
    recordExercise?.('sentence-reorder', { score, mistakes });
    onBack();
  };

  if (done) return null;

  // Setup phase
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        {!hideBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900 font-medium">
            <ArrowLeft className="w-5 h-5" />{' '}{t("onboard.back")}</button>
        )}
        <h2 className="text-3xl font-black text-slate-900 mb-2">{t("learning.sentence.reorder.bc0c27")}</h2>
        <p className="text-slate-500 mb-8">{t("learning.rearrange.scrambled.words.to.form.correct.sentences.99d42c")}</p>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 space-y-6 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t("learning.custom.sentences.34dd96")}{' '}<span className="font-normal text-slate-400">{t("learning.optional.b16c7a")}</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">{t("learning.enter.your.own.sentences.separated.by.line.breaks.leave.em.0456a4")}</p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder={'The cat sat on the mat\nLearning a language is fun\nPractice makes perfect'}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-700 min-h-[160px] resize-none text-sm text-slate-700 placeholder-slate-300"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startGame(false)}
              className="flex-1 py-3 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >{t("learning.use.built.in.sentences.31cbb3")}</button>
            <button
              onClick={() => startGame(true)}
              className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
            >
              {customInput.trim() ? t("learning.start.with.my.sentences.4d8530") : t("learning.start.exercise.b0816f")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const canCheck = chosen.length > 0 && bankWords.length === 0;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      {!hideBack && (
        <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900 font-medium">
          <ArrowLeft className="w-5 h-5" />{' '}{t("onboard.back")}</button>
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900">{t("learning.sentence.reorder.bc0c27")}</h2>
        <span className="text-sm font-bold text-slate-400 bg-white border-2 border-slate-200 px-4 py-1.5 rounded-2xl shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      <div className={`bg-white rounded-2xl border-2 p-6 mb-6 min-h-[100px] relative transition-colors ${status === 'correct' ? 'border-emerald-400' : status === 'wrong' ? 'border-rose-400' : 'border-slate-200'}`}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t("learning.your.sentence.3a434d")}</p>
        {chosen.length === 0 ? (
          <p className="text-slate-300 italic">{t("learning.tap.words.below.to.build.the.sentence.cd182a")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chosen.map(item => (
              <button key={item.id} onClick={() => removeWord(item)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm border transition-colors ${status === 'idle' ? 'bg-zinc-900 text-white border-zinc-800 hover:bg-rose-600 hover:border-rose-600' : status === 'correct' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-rose-500 text-white border-rose-500'}`}>
                {item.word}
              </button>
            ))}
          </div>
        )}
        {status === 'wrong' && (
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-bold text-slate-700">{t("learning.correct.d1a3ac")}{' '}</span>
            <span className="text-emerald-700 font-semibold">{queue[currentIdx]}</span>
          </p>
        )}
      </div>

      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 mb-6 min-h-[80px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t("learning.word.bank.0b4744")}</p>
        <div className="flex flex-wrap gap-2">
          {bankWords.map(item => (
            <button key={item.id} onClick={() => pickWord(item)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-sm text-slate-800 hover:border-zinc-500 hover:shadow-sm transition-all">
              {item.word}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={checkAnswer}
        disabled={!canCheck || status !== 'idle'}
        className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-40 text-base shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
      >{t("learning.check.answer.29ff32")}</button>
    </div>
  );
}

export function TrueFalseQuiz({ savedVocab, allVocabMap, onBack, onComplete, recordExercise, meanings, resume, hideTranslate, hideBack, disableSession }: any) {
  const { t } = useUiLang();
 const { speechLocale } = useContentLang();
 const [questions, setQuestions] = React.useState<{word: string, def: string, isTrue: boolean}[]>([]);
 const [currentIndex, setCurrentIndex] = React.useState(0);
 const [score, setScore] = React.useState(0);
 const [mistakes, setMistakes] = React.useState<string[]>([]);
 const [isFinished, setIsFinished] = React.useState(false);
 const [selected, setSelected] = React.useState<boolean | null>(null);
 const appliedResume = React.useRef(false);

 React.useEffect(() => {
 const buildQs = (list: {word: string, def: string}[]) => list.map(item => {
 const isTrue = Math.random() > 0.5;
 let showDef = item.def;
 if (!isTrue) {
 const others = list.filter(l => l.word !== item.word);
 if (others.length > 0) showDef = others[Math.floor(Math.random() * others.length)].def;
 }
 return { word: item.word, def: showDef, isTrue };
 });

 if (resume?.words?.length && !appliedResume.current) {
 appliedResume.current = true;
 const list = resume.words.map((word: string) => ({
 word,
 def: meaningFor(word, savedVocab[word], allVocabMap, meanings || resume.meanings),
 })).filter((w: any) => w.def);
 if (list.length < 2) return;
 setQuestions(buildQs(list));
 setCurrentIndex(Math.min(resume.index || 0, Math.max(list.length - 1, 0)));
 setScore(resume.score || 0);
 setMistakes(resume.mistakes || []);
 return;
 }

 if (appliedResume.current) return;

 const list = Object.entries(savedVocab).map(([word, data]: any) => ({
 word,
 def: meaningFor(word, data, allVocabMap, meanings)
 })).filter(w => w.def);
 
 if (list.length < 2) return;
 setQuestions(buildQs(list).sort(() => Math.random() - 0.5));
 }, [savedVocab, allVocabMap, meanings, resume]);

 React.useEffect(() => {
 if (disableSession || isFinished || questions.length === 0) return;
 saveExerciseSession({
 type: 'true-false-quiz',
 words: questions.map(q => q.word),
 index: currentIndex,
 score,
 mistakes,
 meanings,
 });
 }, [questions, currentIndex, score, mistakes, meanings, isFinished, disableSession]);

 if (questions.length < 2) return (
 <div className={`${EX_SHELL} text-center`}>
 {!hideBack && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900"><ArrowLeft className="w-5 h-5"/>{' '}{t("onboard.back")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-lg text-slate-500 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">{t("learning.need.more.words.with.meanings.492101")}</div>
 </div>
 );

 const handleSelect = (choice: boolean) => {
 if (selected !== null) return;
 setSelected(choice);
 const q = questions[currentIndex];
 if (choice === q.isTrue) {
 answerFeedback(true, { questionId: questions[currentIndex].word, word: questions[currentIndex].word });
 setScore(s => s + 1);
 } else {
 answerFeedback(false, { questionId: questions[currentIndex].word, word: questions[currentIndex].word });
 setMistakes(m => [...m, q.word]);
 }
 setTimeout(() => {
 setSelected(null);
 if (currentIndex === questions.length - 1) {
 playSound('complete');
 setIsFinished(true);
 } else {
 setCurrentIndex(i => i + 1);
 }
 }, 1500);
 };

 const handleBack = () => {
 onBack();
 };

 if (isFinished) {
 if (onComplete) {
 setTimeout(() => {
 clearExerciseSession();
 onComplete({ type: 'true-false-quiz', score, mistakes, correctWords: questions.filter(q => !mistakes.includes(q.word)).map(q => q.word).slice(0, score) });
 }, 100);
 return null;
 }
 return (
 <div className={`${EX_SHELL} text-center`}>
 {!hideBack && <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-zinc-900"><ArrowLeft className="w-5 h-5"/>{' '}{t("onboard.back")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] ">
 <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
 <h2 className="font-serif text-3xl font-extrabold mb-4 text-slate-800">{t("learning.quiz.finished.c269d0")}</h2>
 <p className="text-lg text-slate-500">{t("learning.score.6ac979")}{' '}{score} / {questions.length}</p>
 </div>
 </div>
 );
 }

 const q = questions[currentIndex];

 return (
 <div className={EX_SHELL}>
 {!hideBack && <button onClick={handleBack} className="flex items-center gap-2 mb-6 text-slate-500 hover:text-zinc-900"><ArrowLeft className="w-5 h-5"/>{' '}{t("onboard.back")}</button>}
 <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-200 text-center shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a] ">
 <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">{currentIndex + 1} / {questions.length}</div>
 <h3 className={`${EX_WORD} mb-2`}>{q.word}</h3>
 {!hideTranslate && <TranslateInline word={q.word} />}
 <p className="text-base md:text-xl text-slate-600 mt-4 md:mt-6 mb-8 md:mb-12 italic leading-relaxed max-w-2xl mx-auto break-words px-2">"{q.def}"</p>
 <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 max-w-md sm:max-w-none mx-auto">
 <button onClick={() => handleSelect(true)} className={"w-full sm:w-48 py-4 rounded-xl font-bold text-lg md:text-xl transition-all border-2 " + (selected !== null ? (selected && q.isTrue ? "bg-emerald-500 border-emerald-500 text-white shadow-lg pointer-events-none" : selected && !q.isTrue ? "bg-rose-500 border-rose-500 text-white shadow-lg pointer-events-none" : "opacity-50 pointer-events-none border-slate-200 text-slate-400 bg-slate-50") : "hover:bg-emerald-50 border-slate-200 text-slate-700 hover:border-emerald-200")}>{t("lesson.true")}</button>
 <button onClick={() => handleSelect(false)} className={"w-full sm:w-48 py-4 rounded-xl font-bold text-lg md:text-xl transition-all border-2 " + (selected !== null ? (selected && q.isTrue ? "bg-rose-500 border-rose-500 text-white shadow-lg pointer-events-none" : selected && !q.isTrue ? "bg-emerald-500 border-emerald-500 text-white shadow-lg pointer-events-none" : "opacity-50 pointer-events-none border-slate-200 text-slate-400 bg-slate-50") : "hover:bg-rose-50 border-slate-200 text-slate-700 hover:border-rose-200")}>{t("lesson.false")}</button>
 </div>
 </div>
 </div>
 );
}
