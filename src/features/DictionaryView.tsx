import React from 'react';
import { BookOpen, Search, Volume2, AlertCircle, X, Languages } from 'lucide-react';
import { LANGUAGES } from '../lib/constants';
import { ScreenShell } from '../components/ScreenShell';

interface DictionaryViewProps {
  dictSearchQuery: string;
  setDictSearchQuery: (q: string) => void;
  handleDictSearch: (e?: any) => void;
  isSearchingDict: boolean;
  dictError: string | null;
  dictResult: any;
  savedVocab: Record<string, any>;
  toggleSavedVocab: (word: string, def?: string) => void;
  targetLangs: string[];
  setTargetLangs: (fn: (prev: string[]) => string[]) => void;
  translations: Record<string, string>;
  setTranslations: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  translateText: (id: string, text: string) => void;
  isTranslating: Record<string, boolean>;
  defLang: string;
  setDefLang: (code: string) => void;
  defPickerOpen: boolean;
  setDefPickerOpen: (open: boolean) => void;
}

export default function DictionaryView({
  dictSearchQuery,
  setDictSearchQuery,
  handleDictSearch,
  isSearchingDict,
  dictError,
  dictResult,
  savedVocab,
  toggleSavedVocab,
  targetLangs,
  setTargetLangs,
  translations,
  setTranslations,
  translateText,
  isTranslating,
  defLang,
  setDefLang,
  defPickerOpen,
  setDefPickerOpen,
}: DictionaryViewProps) {
  return (
    <ScreenShell title="Dictionary" subtitle="Look up any word to see definitions, examples, and translations.">
         <form onSubmit={handleDictSearch} className="mb-4">
           <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-200">
             <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
             <input
               type="text"
               placeholder="Type a word to search..."
               value={dictSearchQuery}
               onChange={(e) => setDictSearchQuery(e.target.value)}
               className="flex-1 bg-transparent px-2 py-2.5 outline-none text-[15px] font-medium text-slate-800 placeholder-slate-400"
             />
             <button
               disabled={isSearchingDict || !dictSearchQuery.trim()}
               className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg text-[13px] transition-colors disabled:opacity-50"
               type="submit"
             >
               {isSearchingDict ? <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full inline-block" /> : 'Search'}
             </button>
           </div>
           {dictError && <p className="text-center text-rose-500 mt-3 font-medium flex justify-center items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" /> {dictError}</p>}
         </form>

         <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[240px]">
            {dictResult ? (
              <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{dictResult.word}</h2>
                     {dictResult.phonetic && <p className="text-xl text-zinc-700 font-medium font-mono">{dictResult.phonetic}</p>}
                   </div>

                   <div className="flex flex-wrap items-center gap-4">
                     {dictResult.audio && (
                       <button
                         onClick={() => new Audio(dictResult.audio).play().catch(console.error)}
                         className="p-4 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-full transition-colors flex items-center justify-center"
                       >
                         <Volume2 className="w-6 h-6" />
                       </button>
                     )}
                     <button
                       onClick={() => toggleSavedVocab(dictResult.word, dictResult.meanings?.[0]?.definitions?.[0]?.definition || '')}
                       className={`px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-2 ${(savedVocab as any)[dictResult.word.toLowerCase()] ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                       {(savedVocab as any)[dictResult.word.toLowerCase()] ? 'Saved' : '+ Save Word'}
                     </button>
                   </div>
                </div>

                <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50 rounded-2xl mb-8">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-bold text-slate-600 mr-2">Show definition in:</span>
                      <div className="relative">
                        <button
                          onClick={() => setDefPickerOpen(!defPickerOpen)}
                          className="bg-white border text-sm font-bold text-indigo-700 box-border border-zinc-200 hover:border-indigo-400 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span>{LANGUAGES.find(l => l.code === defLang || l.code === defLang.split('-')[0])?.name || defLang}</span>
                          <span className="text-[10px] text-indigo-400">▼</span>
                        </button>
                        {defPickerOpen && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-2xl z-30 max-h-72 overflow-y-auto w-64">
                            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-2 border-b border-zinc-100 dark:border-zinc-800">
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search language…"
                                className="w-full pl-3 pr-2 py-1.5 text-sm bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg outline-none focus:border-indigo-500"
                              />
                            </div>
                            {LANGUAGES.map(l => (
                              <button
                                key={l.code}
                                onClick={() => { setDefLang(l.code); setDefPickerOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                                  l.code === defLang ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-zinc-700'
                                }`}
                              >
                                <span className="truncate">{l.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-bold text-slate-600 mr-2">Target translation LANGUAGES:</span>
                     <div className="flex flex-col gap-2">
                       <div className="flex flex-wrap gap-1.5">
                         {targetLangs.map(lang => {
                            const lobj = LANGUAGES.find(l => l.code === lang);
                            return (
                              <div key={lang} className="flex items-center gap-1 px-2.5 py-1 bg-white text-black font-bold text-xs rounded-full border border-zinc-200 shadow-sm">
                                {lobj ? lobj.name : lang}
                                <button title="Remove" onClick={(e) => {
                                  e.preventDefault();
                                  setTargetLangs(prev => prev.length > 1 ? prev.filter(x => x !== lang) : prev);
                                }} className="hover:text-rose-600 text-indigo-400 bg-slate-50 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
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
                   <button
                     onClick={() => translateText(`dict_${dictResult.word}`, dictResult.word + ': ' + (dictResult.meanings?.[0]?.definitions?.[0]?.definition || ''))}
                     disabled={isTranslating[`dict_${dictResult.word}`]}
                     className="px-5 py-3 bg-zinc-900 text-white hover:bg-black font-bold rounded-xl transition-all shadow-sm hover:shadow-zinc-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
                   >
                     {isTranslating[`dict_${dictResult.word}`] ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin rounded-full inline-block" /> : <Languages className="w-4 h-4" />}
                     Translate Meaning
                   </button>
                </div>

                {targetLangs.filter(lang => (translations as any)[`${lang}_dict_${dictResult.word}`]).length > 0 && (
                   <div className="mb-10 p-6 bg-zinc-100 rounded-2xl border border-zinc-200 flex flex-col gap-4 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Languages className="w-12 h-12 text-zinc-900 rotate-12" />
                     </div>
                     <div className="flex items-center gap-2 relative z-10 mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 bg-zinc-200 px-2 py-0.5 rounded">Translations</span>
                     </div>
                     {targetLangs.map(lang => (translations as any)[`${lang}_dict_${dictResult.word}`] ? (
                         <div key={lang} className="flex flex-col gap-1 relative z-10 group">
                           <button onClick={() => setTranslations(prev => { const next = {...prev}; delete next[`${lang}_dict_${dictResult.word}`]; return next; })} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-white rounded-full shadow-sm text-slate-400 p-1.5 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button>
                           <span className="text-[10px] font-bold uppercase text-indigo-400">{LANGUAGES.find((l:any)=>l.code===lang)?.name}</span>
                           <p className="text-indigo-900 font-bold text-2xl leading-tight pr-10">{(translations as any)[`${lang}_dict_${dictResult.word}`]}</p>
                         </div>
                     ) : null)}
                   </div>
                )}

                <div className="space-y-8">
                   {dictResult.meanings.map((meaning: any, i: number) => (
                     <div key={i}>
                       <h3 className="text-xl font-bold text-slate-800 italic mb-3 border-b border-slate-100 pb-2">{meaning.partOfSpeech}</h3>
                       <ol className="list-decimal pl-5 space-y-4 text-slate-600 text-lg">
                         {meaning.definitions.map((def: any, j: number) => (
                           <li key={j}>
                             <p className="font-medium text-slate-700">{def.definition}</p>
                             {def.example && <p className="text-slate-500 italic mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">{def.example}</p>}
                           </li>
                         ))}
                       </ol>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                 <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
                 <p>Look up definitions, pronunciations, and examples of usage.</p>
              </div>
            )}
         </div>
    </ScreenShell>
  );
}
