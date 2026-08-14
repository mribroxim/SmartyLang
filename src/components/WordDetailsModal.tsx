import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Languages, Volume2, Loader2, Plus, CheckCircle2, Search } from 'lucide-react';
import { LANGUAGES, type LanguageOption, decodeHtmlEntities } from '../lib/languages';
import { readPreferredTranslationLang } from '../lib/preferredTranslationLang';
import { useContentLang } from '../contexts/ContentLangContext';
import { DICT_LANG_CODE } from '../lib/contentLang';
import { lookupDictionary } from '../lib/dictionary';
import { playWord as sharedPlayWord } from '../lib/speech';
import { loadVocab, lookupWord, vocabDbEnabled } from '../lib/vocabDb';

function readSavedLang(): LanguageOption {
  return readPreferredTranslationLang();
}

/** Preferred language shown in the Dictionary tab. Defaults to the learning language, else English. */
function readSavedDefLang(): LanguageOption {
  try {
    const code = localStorage.getItem('preferred_definition_lang');
    if (code) {
      const found = LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === code.split('-')[0]);
      if (found) return found;
    }
  } catch {}
  try {
    const cl = localStorage.getItem('smarty_content_lang');
    if (cl) {
      const clOpt =
        LANGUAGES.find(l => l.code === cl) ||
        LANGUAGES.find(l => l.code.split('-')[0] === cl);
      if (clOpt) return clOpt;
    }
  } catch {}
  return LANGUAGES.find(l => l.code === 'en')!;
}

interface WordDetailsModalProps {
  word: string | null;
  mode: 'dictionary' | 'translation' | null;
  onClose: () => void;
  savedVocab: Record<string, any>;
  onToggleVocab: (word: string, fallbackDef?: string) => Promise<void>;
}

export function WordDetailsModal({ word, mode: initialMode, onClose, savedVocab, onToggleVocab }: WordDetailsModalProps) {
  const { contentLang, speechLocale } = useContentLang();
  const sourceLang = DICT_LANG_CODE[contentLang];
  const [activeTab, setActiveTab] = useState<'dictionary' | 'translation' | null>(initialMode);
  const [dictData, setDictData] = useState<any>(null);
  const [transData, setTransData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<LanguageOption>(readSavedLang);
  const [defLang, setDefLang] = useState<LanguageOption>(readSavedDefLang);
  const [langSearch, setLangSearch] = useState('');
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [defPickerOpen, setDefPickerOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('preferred_translation_lang', targetLang.code); } catch {}
  }, [targetLang]);

  useEffect(() => {
    try { localStorage.setItem('preferred_definition_lang', defLang.code); } catch {}
  }, [defLang]);

  const filteredLangs = useMemo(() => {
    const s = langSearch.trim().toLowerCase();
    if (!s) return LANGUAGES;
    return LANGUAGES.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.code.toLowerCase().includes(s) ||
      (l.native && l.native.toLowerCase().includes(s)),
    );
  }, [langSearch]);

  useEffect(() => {
    setActiveTab(initialMode);
    setDictData(null);
    setTransData(null);
    setError(null);
  }, [initialMode, word, contentLang]);

  // Look up the definition in the WORD'S OWN language (the learning language),
  // then translate the displayed text if the user picked a different language.
  useEffect(() => {
    if (!word || !activeTab) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === 'dictionary') {
          if (vocabDbEnabled()) {
            await loadVocab(contentLang, defLang.code);
            const card = lookupWord(word, { knownLang: defLang.code });
            if (card) {
              if (!isMounted) return;
              setDictData({
                word: card.word,
                phonetic: card.cefr ? `CEFR ${card.cefr}` : undefined,
                phonetics: [],
                senseId: card.senseId,
                meanings: [{
                  partOfSpeech: card.pos,
                  definitions: [{ definition: card.definition }],
                }],
                srcLang: contentLang,
              });
              return;
            }
          }
          const result = await lookupDictionary(word, contentLang, defLang.code);
          if (!result) throw new Error('Definition not found');
          if (!isMounted) return;
          setDictData({
            word: result.word,
            phonetic: result.phonetic,
            phonetics: result.phonetic ? [{ text: result.phonetic }] : [],
            meanings: result.meanings,
            srcLang: contentLang,
          });
        } else if (activeTab === 'translation') {
          if (vocabDbEnabled()) {
            await loadVocab(sourceLang, targetLang.code);
            const card = lookupWord(word, { knownLang: targetLang.code });
            if (card?.knownWord || card?.definition) {
              if (isMounted) setTransData({ translation: card.knownWord || card.definition, lang: targetLang.name });
              return;
            }
          }
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          try {
            const { translateWithCache } = await import('../lib/networkCache');
            const translation = await translateWithCache(word, sourceLang, targetLang.code, {
              signal: controller.signal,
            });
            if (!translation) throw new Error('Translation not available');
            if (isMounted) setTransData({ translation: decodeHtmlEntities(translation), lang: targetLang.name });
          } finally {
            clearTimeout(timer);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [word, activeTab, targetLang, defLang, contentLang, sourceLang]);

  if (!word || !activeTab) return null;

  const isSaved = savedVocab[word.toLowerCase()] !== undefined;

  const langList = (selectedCode: string, onPick: (l: LanguageOption) => void, accent: 'emerald' | 'indigo') => (
    <div className={`mt-1 bg-white border rounded-xl overflow-hidden ${accent === 'emerald' ? 'border-emerald-100' : 'border-indigo-100'}`}>
      <div className="p-2 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            autoFocus
            value={langSearch}
            onChange={e => setLangSearch(e.target.value)}
            placeholder="Search language…"
            className={`w-full pl-8 pr-2 py-1.5 text-sm bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg outline-none ${
              accent === 'emerald' ? 'focus:border-emerald-500' : 'focus:border-indigo-500'
            }`}
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredLangs.length === 0 ? (
          <p className="text-zinc-400 text-xs p-3 text-center">No match</p>
        ) : (
          filteredLangs.map(l => (
            <button
              type="button"
              key={l.code}
              onClick={() => { onPick(l); setLangSearch(''); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                l.code === selectedCode
                  ? accent === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span className="truncate">{l.name}</span>
              {l.native && l.native !== l.name && (
                <span className="text-zinc-400 text-xs shrink-0 ml-2">{l.native}</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col gap-4 shrink-0 bg-zinc-50 relative">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <h3 className="font-bold text-zinc-900 capitalize text-xl flex items-center gap-2">
                 {word}
                 <button
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     sharedPlayWord(word, 1.0, speechLocale);
                   }}
                   className="p-1.5 rounded-lg bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition-colors"
                 >
                   <Volume2 className="w-5 h-5"/>
                 </button>
               </h3>
             </div>

             <div className="flex items-center gap-2">
               <button
                 type="button"
                 onClick={() => { void onToggleVocab(word); }}
                 className={`p-2 rounded-xl transition-colors ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                 title={isSaved ? "Remove from Vocab" : "Add to Vocab"}
               >
                 {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
               </button>
               <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-200 text-zinc-500 transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>
           </div>

           <div className="flex bg-zinc-200/50 p-1 rounded-xl">
             <button
               type="button"
               onClick={() => { setActiveTab('dictionary'); setLangPickerOpen(false); setDefPickerOpen(false); }}
               className={`flex-1 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 justify-center transition-all ${activeTab === 'dictionary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:bg-zinc-200'}`}
             >
               <BookOpen className="w-4 h-4" /> Dictionary
             </button>
             <button
               type="button"
               onClick={() => { setActiveTab('translation'); setLangPickerOpen(false); setDefPickerOpen(false); }}
               className={`flex-1 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 justify-center transition-all ${activeTab === 'translation' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:bg-zinc-200'}`}
             >
               <Languages className="w-4 h-4" /> Translation
             </button>
           </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'translation' && (
            <div className="mb-6 flex justify-center">
              <div className="w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => { setLangPickerOpen(o => !o); setDefPickerOpen(false); setLangSearch(''); }}
                  className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-3 py-2.5 font-bold flex items-center justify-between hover:bg-emerald-100 transition-colors"
                >
                  <span className="truncate">{targetLang.name}{targetLang.native && targetLang.native !== targetLang.name ? ` · ${targetLang.native}` : ''}</span>
                  <span className="text-[10px] text-emerald-500 shrink-0">{langPickerOpen ? '▲' : '▼'}</span>
                </button>
                {langPickerOpen && langList(targetLang.code, (l) => {
                  setTargetLang(l);
                  setLangPickerOpen(false);
                  setTransData(null);
                }, 'emerald')}
              </div>
            </div>
          )}

          {activeTab === 'dictionary' && (
            <div className="mb-6 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Show definition in</span>
              <div className="w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => { setDefPickerOpen(o => !o); setLangPickerOpen(false); setLangSearch(''); }}
                  className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-xl px-3 py-2.5 font-bold flex items-center justify-between hover:bg-indigo-100 transition-colors"
                >
                  <span className="truncate">{defLang.name}{defLang.native && defLang.native !== defLang.name ? ` · ${defLang.native}` : ''}</span>
                  <span className="text-[10px] text-indigo-400 shrink-0">{defPickerOpen ? '▲' : '▼'}</span>
                </button>
                {defPickerOpen && langList(defLang.code, (l) => {
                  setDefLang(l);
                  setDefPickerOpen(false);
                  setDictData(null);
                }, 'indigo')}
              </div>
            </div>
          )}

          {(langPickerOpen || defPickerOpen) ? null : loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
               <Loader2 className="w-8 h-8 animate-spin mb-4" />
               <p>{activeTab === 'dictionary' ? 'Searching dictionary...' : `Translating to ${targetLang.name}...`}</p>
             </div>
           ) : error ? (
              <div className="text-center py-8">
                <p className="text-rose-500">Could not find {activeTab === 'dictionary' ? 'definition' : 'translation'}.</p>
                {activeTab === 'dictionary' && (
                  <p className="text-zinc-400 text-sm mt-2">Try changing the definition language above.</p>
                )}
              </div>
          ) : activeTab === 'dictionary' && dictData ? (
              <div className="space-y-6 text-zinc-800">
                 {(dictData.phonetic || dictData.phonetics?.find((p:any) => p.text)) && (
                   <div className="text-sm text-zinc-500 font-mono bg-zinc-100 px-2 py-1 rounded inline-block">
                     {dictData.phonetic || dictData.phonetics.find((p:any) => p.text).text}
                   </div>
                 )}
                 {dictData.meanings?.map((meaning: any, i: number) => (
                   <div key={i} className="space-y-2">
                     <h4 className="font-bold text-indigo-900 border-b border-indigo-100 pb-1 mb-2 capitalize">{meaning.partOfSpeech}</h4>
                     <ol className="list-decimal pl-5 space-y-3">
                       {meaning.definitions.map((def: any, j: number) => (
                         <li key={j} className="text-zinc-700">
                           <p className="leading-relaxed">{def.definition}</p>
                           {def.example && (
                             <p className="text-zinc-500 italic mt-1 bg-zinc-50 p-2 rounded-lg text-sm border border-zinc-100">"{def.example}"</p>
                           )}
                         </li>
                       ))}
                     </ol>
                   </div>
                 ))}
              </div>
          ) : activeTab === 'translation' && transData ? (
              <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
                 <p className="text-3xl font-black text-emerald-600 bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">{transData.translation}</p>
              </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
