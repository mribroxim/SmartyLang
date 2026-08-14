import React from 'react';
import { GraduationCap, BookOpen, Search, Volume2, X, ChevronRight, ArrowLeft, Type, Plus, Brain, Trash2, AlertCircle, Languages } from 'lucide-react';
import { LANGUAGES } from '../lib/constants';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { vocabStorageKey } from '../lib/contentLang';
import { ScreenShell } from '../components/ScreenShell';

interface VocabularyViewProps {
  savedVocab: Record<string, { definition: string; timestamp: number; favorite?: boolean; srs?: any }>;
  setSavedVocab: (fn: (prev: any) => any) => void;
  vocabFilter: 'all' | 'favorites';
  setVocabFilter: (f: 'all' | 'favorites') => void;
  myVocabPage: number;
  setMyVocabPage: (fn: (p: number) => number) => void;
  myVocabSearchQuery: string;
  setMyVocabSearchQuery: (q: string) => void;
  targetLangs: string[];
  setTargetLangs: (fn: (prev: string[]) => string[]) => void;
  translations: Record<string, string>;
  setTranslations: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  translateText: (id: string, text: string) => void;
  isTranslating: Record<string, boolean>;
  playWord: (word: string) => void;
  srsDueWords: string[];
  setSelectedVocabWords: (words: string[]) => void;
  setShowExerciseWordSelector: (v: any) => void;
  setActiveExercise: (ex: string | null) => void;
  setActiveTab: (tab: string) => void;
  newVocabWord: string;
  setNewVocabWord: (w: string) => void;
  isAddingVocab: boolean;
  addVocabError: string;
  handleAddNewVocab: () => void;
  onShowModal?: (word: string, mode: 'dictionary' | 'translation') => void;
}

export default function VocabularyView({
  savedVocab,
  setSavedVocab,
  vocabFilter,
  setVocabFilter,
  myVocabPage,
  setMyVocabPage,
  myVocabSearchQuery,
  setMyVocabSearchQuery,
  targetLangs,
  setTargetLangs,
  translations,
  setTranslations,
  translateText,
  isTranslating,
  playWord,
  srsDueWords,
  setSelectedVocabWords,
  setShowExerciseWordSelector,
  setActiveExercise,
  setActiveTab,
  newVocabWord,
  setNewVocabWord,
  isAddingVocab,
  addVocabError,
  handleAddNewVocab,
  onShowModal,
}: VocabularyViewProps) {
  const { contentLang } = useContentLang();
  const { t } = useUiLang();
  const persistLocal = (next: any) => {
    try { localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next)); } catch { /* ignore */ }
  };
  return (
    <ScreenShell title={t('vocab.title')} subtitle={t('vocab.subtitle')}>
            <div className="flex flex-wrap gap-2 mb-4">
               <button
                 onClick={() => {
                   const csvContent = "data:text/csv;charset=utf-8,Word,Definition\n" + Object.entries(savedVocab as any).map(([w, d]) => `${w},"${((d as any).definition || '').replace(/"/g, '""')}"`).join("\n");
                   const link = document.createElement("a");
                   link.setAttribute("href", encodeURI(csvContent));
                   link.setAttribute("download", "readmaster_vocab.csv");
                   document.body.appendChild(link);
                   link.click();
                   document.body.removeChild(link);
                 }}
                 className="px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
               >
                 Export CSV
               </button>
               <label className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-[13px] transition-colors cursor-pointer">
                 Import
                 <input
                   type="file"
                   accept=".csv"
                   className="hidden"
                   onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                         const text = (evt.target?.result as string) || '';
                         const lines = text.split('\n');
                         const nextVocab = { ...savedVocab };
                         lines.forEach((line, i) => {
                            if (i === 0) return;
                            const parts = line.split(',');
                            if (parts.length >= 2) {
                               const word = parts[0].trim().toLowerCase();
                               let def = parts.slice(1).join(',').trim();
                               if (def.startsWith('"') && def.endsWith('"')) def = def.substring(1, def.length - 1).replace(/""/g, '"');
                               if (word) nextVocab[word] = { ...nextVocab[word], definition: def, timestamp: Date.now() };
                            }
                         });
                         setSavedVocab(() => nextVocab);
                         persistLocal(nextVocab);
                         alert('Vocabulary imported successfully!');
                      };
                      reader.readAsText(file);
                   }}
                 />
               </label>
            </div>

{srsDueWords.length > 0 && (
          <section className="mb-4 bg-zinc-100 border border-zinc-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
               <div>
                  <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2 mb-2">
                     <Brain className="w-6 h-6 text-zinc-900" />
                     Spaced Repetition: Due for Review
                  </h2>
                  <p className="text-black">You have {srsDueWords.length} word{srsDueWords.length === 1 ? '' : 's'} ready for review. Practice them now to commit them to long-term memory!</p>
               </div>
               <button
                 onClick={() => {
                    setSelectedVocabWords(srsDueWords);
                    setShowExerciseWordSelector(null);
                    setActiveExercise('flashcards');
                    setActiveTab('exercises');
                 }}
                 className="px-6 py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all shrink-0"
               >
                 Review Now
               </button>
            </div>
          </section>
)}











        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-zinc-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">My Vocabulary</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
               <span className="text-sm font-bold text-slate-500 shrink-0">Translate to:</span>
              <div className="flex flex-col gap-2 relative z-10 w-full sm:w-auto">
                <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                  {targetLangs.map(lang => {
                     const lobj = LANGUAGES.find(l => l.code === lang);
                     return (
                       <div key={lang} className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-black font-bold text-xs rounded-full border border-zinc-200 shadow-sm">
                         {lobj ? lobj.name : lang}
                         <button title="Remove" onClick={(e) => {
                           e.preventDefault();
                           setTargetLangs(prev => prev.length > 1 ? prev.filter(x => x !== lang) : prev);
                         }} className="hover:text-rose-600 text-indigo-400 bg-white rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                       </div>
                     );
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                     const val = e.target.value;
                     if (val && !targetLangs.includes(val)) setTargetLangs(prev => [...prev, val]);
                  }}
                  className="bg-white border text-sm font-bold text-slate-600 box-border border-slate-200 hover:border-zinc-400 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 shadow-sm transition-all cursor-pointer"
                >
                  <option value="" disabled>+ Add Language...</option>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code} disabled={targetLangs.includes(l.code)}>{l.name}</option>)}
                </select>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            {Object.keys(savedVocab).length > 0 && (
              <div className="flex bg-white items-center border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs shadow-sm focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-300 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search my vocabulary..."
                  className="bg-transparent outline-none w-full text-sm text-slate-700"
                  value={myVocabSearchQuery}
                  onChange={(e) => { setMyVocabSearchQuery(e.target.value); setMyVocabPage(() => 1); }}
                />
              </div>
            )}
            {Object.keys(savedVocab).length > 0 && (() => {
              const filteredList = Object.entries(savedVocab as any)
                .filter(([word, data]) => word.includes(myVocabSearchQuery.trim().toLowerCase()) && (vocabFilter === 'all' || (data as any).favorite));
              const totalPages = Math.ceil(filteredList.length / 6) || 1;
              return (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => { setVocabFilter('all'); setMyVocabPage(() => 1); }} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${vocabFilter === 'all' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                    <button onClick={() => { setVocabFilter('favorites'); setMyVocabPage(() => 1); }} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${vocabFilter === 'favorites' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Favorites</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMyVocabPage(p => Math.max(1, p - 1))}
                      disabled={myVocabPage === 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-600">
                      {myVocabPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setMyVocabPage(p => Math.min(totalPages, p + 1))}
                      disabled={myVocabPage >= totalPages}
                      className="p-1 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {Object.keys(savedVocab).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No words saved yet</h3>
              <p className="text-slate-500">Add words from the "Key Vocabulary" list in any reading exercise to build your personal dictionary.</p>
            </div>
          ) : (
            <>
              {Object.entries(savedVocab as any).filter(([word, data]) => word.includes(myVocabSearchQuery.trim().toLowerCase()) && (vocabFilter === 'all' || (data as any).favorite)).length === 0 && (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                  <p className="text-slate-500">No matching words found.</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(savedVocab as any)
                  .filter(([word, data]) => word.includes(myVocabSearchQuery.trim().toLowerCase()) && (vocabFilter === 'all' || (data as any).favorite))
                  .sort((a, b) => (b[1] as any).timestamp - (a[1] as any).timestamp)
                  .slice((myVocabPage - 1) * 6, myVocabPage * 6)
                  .map(([word, data]) => {
                   return (
                   <div
                     key={word}
                     role="button"
                     tabIndex={0}
                     onClick={() => onShowModal?.(word, 'dictionary')}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         onShowModal?.(word, 'dictionary');
                       }
                     }}
                     className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-400 hover:-translate-y-1 transition-all group relative cursor-pointer text-left"
                   >
                     <div className="flex items-start justify-between mb-3">
                       <h3 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                         {word}
                         <button
                           type="button"
                           onClick={(e) => { e.stopPropagation(); playWord(word); }}
                           className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                           title="Hear pronunciation"
                         >
                           <Volume2 className="w-4 h-4" />
                         </button>
                       </h3>
                         <div className="flex items-center gap-1">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setSavedVocab(prev => {
                                 const next = { ...prev };
                                 next[word] = { ...next[word], favorite: !next[word].favorite };
                                 persistLocal(next);
                                 return next;
                               });
                             }}
                             className={`transition-colors p-1 rounded-md ${(data as any).favorite ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 bg-slate-50 hover:bg-amber-50 opacity-0 group-hover:opacity-100'}`}
                             title={(data as any).favorite ? "Unfavorite" : "Favorite"}
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={(data as any).favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setSavedVocab(prev => {
                                 const next = { ...prev };
                                 delete next[word.toLowerCase()];
                                 persistLocal(next);
                                 return next;
                               });
                             }}
                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1 bg-slate-50 hover:bg-rose-50 rounded-md"
                            title="Remove"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                         </div>
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3"><span className="text-zinc-400 font-bold mr-1">def.</span>{(data as any).definition}</p>

                     <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <button
                             onClick={(e) => { e.stopPropagation(); translateText(`word_${word}`, word + ": " + (data as any).definition); }}
                             disabled={isTranslating[`word_${word}`]}
                             className="text-xs font-bold text-zinc-900 hover:text-indigo-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                           >
                             {isTranslating[`word_${word}`] ? <span className="w-2.5 h-2.5 border-2 border-zinc-300 border-t-zinc-900 animate-spin rounded-full inline-block" /> : <Languages className="w-3.5 h-3.5" />}
                             Translate Meaning
                           </button>
                        </div>

                        {targetLangs.map(lang => translations[`${lang}_word_${word}`] ? (
                           <div key={lang} className="mt-1 p-2.5 bg-zinc-100/50 rounded-xl border border-zinc-200/50 flex flex-col gap-1 relative group transition-all">
                             <button onClick={(e) => { e.stopPropagation(); setTranslations(prev => { const next = {...prev}; delete next[`${lang}_word_${word}`]; return next; })}} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-rose-500 bg-white rounded-full shadow-sm transition-all"><X className="w-3 h-3" /></button>
                             <span className="text-[10px] font-bold uppercase text-indigo-400">{LANGUAGES.find(l => l.code === lang)?.name || lang}</span>
                             <p className="text-xs text-indigo-900 font-medium leading-relaxed pr-5">{translations[`${lang}_word_${word}`]}</p>
                           </div>
                        ) : null)}
                     </div>

                    </div>
                 );
               })}
             </div>
            </>
           )}
        </section>


<section className="mb-12">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
               <div className="flex flex-col w-full max-w-2xl">
                   <h2 className="text-xl font-bold text-slate-800 mb-1">{t('vocab.addTitle')}</h2>
                   <p className="text-slate-500 mb-6">{t('vocab.addSubtitle')}</p>
                   <form onSubmit={(e) => { e.preventDefault(); handleAddNewVocab(); }} className="flex flex-col sm:flex-row items-center gap-4">
                       <div className="relative flex-grow w-full">
                         <Type className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input
                           type="text"
                           value={newVocabWord}
                           onChange={(e) => setNewVocabWord(e.target.value)}
                           placeholder={t('vocab.addPlaceholder')}
                           className="pl-12 pr-4 py-4 w-full border border-slate-200 rounded-xl focus:outline-none focus:border-zinc-700 focus:ring-4 focus:ring-zinc-200 text-lg transition-all"
                         />
                       </div>
                       <button
                         type="submit"
                         disabled={isAddingVocab || !newVocabWord.trim()}
                         className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg whitespace-nowrap"
                       >
                         {isAddingVocab ? (
                           <span className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full inline-block" />
                         ) : (
                           <>
                             <Plus className="w-5 h-5" />
                             {t('vocab.addButton')}
                           </>
                         )}
                       </button>
                   </form>
                   {addVocabError && (
                     <div className="mt-4 text-rose-500 flex items-center gap-2 font-medium bg-rose-50 p-3 rounded-lg border border-rose-100 w-fit">
                       <AlertCircle className="w-5 h-5" />
                       {addVocabError}
                     </div>
                   )}
               </div>
            </div>
          </section>


      </ScreenShell>
  );
}
