import { useUiLang } from '../contexts/UiLangContext';
import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Languages, Volume2, Loader2, Plus, CheckCircle2, Search } from 'lucide-react';
import { LANGUAGES, type LanguageOption, decodeHtmlEntities } from '../lib/languages';
import { readPreferredTranslationLang } from '../lib/preferredTranslationLang';
import { useContentLang } from '../contexts/ContentLangContext';
import { DICT_LANG_CODE } from '../lib/contentLang';
import { lookupDictionary } from '../lib/dictionary';
import { playWord as sharedPlayWord } from '../lib/speech';
import { loadVocab, lookupAllSenses, vocabDbEnabled } from '../lib/vocabDb';

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
  const { t } = useUiLang();
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
            const cards = lookupAllSenses(word, { knownLang: defLang.code, limit: 8 })
              .filter((c) => (c.definition || c.knownWord || c.learningDefinition || '').trim());
            if (cards.length) {
              if (!isMounted) return;
              const byPos = new Map<string, { definition: string }[]>();
              for (const card of cards) {
                const pos = card.pos || 'sense';
                const list = byPos.get(pos) || [];
                const text = (card.definition || card.knownWord || card.learningDefinition || '').trim();
                if (!text) continue;
                list.push({ definition: text });
                byPos.set(pos, list);
              }
              if (byPos.size) {
                setDictData({
                  word: cards[0].word,
                  phonetic: cards[0].cefr ? `CEFR ${cards[0].cefr}` : undefined,
                  phonetics: [],
                  senseId: cards[0].senseId,
                  meanings: [...byPos.entries()].map(([partOfSpeech, definitions]) => ({
                    partOfSpeech,
                    definitions,
                  })),
                  srcLang: contentLang,
                });
                return;
              }
            }
          }
          const result = await lookupDictionary(word, contentLang, defLang.code);
          if (result?.meanings?.length) {
            if (!isMounted) return;
            setDictData({
              word: result.word,
              phonetic: result.phonetic,
              phonetics: result.phonetic ? [{ text: result.phonetic }] : [],
              meanings: result.meanings,
              srcLang: contentLang,
            });
            return;
          }
          // Last resort: gloss the word into the definition language.
          try {
            const { translateWithCache } = await import('../lib/networkCache');
            const gloss = await translateWithCache(word, contentLang, defLang.code);
            if (gloss && gloss.toLocaleLowerCase() !== word.toLocaleLowerCase()) {
              if (!isMounted) return;
              setDictData({
                word,
                phonetics: [],
                meanings: [{ partOfSpeech: 'gloss', definitions: [{ definition: gloss }] }],
                srcLang: contentLang,
              });
              return;
            }
          } catch { /* ignore */ }
          throw new Error('Definition not found');
        } else if (activeTab === 'translation') {
          if (vocabDbEnabled()) {
            await loadVocab(sourceLang, targetLang.code);
            const cards = lookupAllSenses(word, { knownLang: targetLang.code, limit: 8 })
              .filter((c) => (c.knownWord || c.definition || '').trim());
            if (cards.length) {
              if (isMounted) {
                setTransData({
                  translation: cards[0].knownWord || cards[0].definition,
                  lang: targetLang.name,
                  senses: cards.map((c) => ({
                    pos: c.pos,
                    known: c.knownWord || c.definition,
                    definition: c.definition,
                    word: c.word,
                  })),
                });
              }
              return;
            }
          }
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          try {
            const { translateWithAlternatives } = await import('../lib/networkCache');
            const packed = await translateWithAlternatives(word, sourceLang, targetLang.code, {
              signal: controller.signal,
            });
            if (!packed?.text) throw new Error('Translation not available');
            const alts = (packed.alternatives || [packed.text])
              .map((a) => decodeHtmlEntities(String(a || '').trim()))
              .filter(Boolean);
            if (isMounted) {
              setTransData({
                translation: decodeHtmlEntities(packed.text),
                lang: targetLang.name,
                senses: alts.length > 1
                  ? alts.map((known, i) => ({
                      pos: i === 0 ? 'closest' : 'also',
                      known,
                      definition: '',
                      word,
                    }))
                  : [],
              });
            }
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
    <div className={`mt-1 bg-white dark:bg-zinc-900 border-2 rounded-2xl overflow-hidden ${accent === 'emerald' ? 'border-slate-200' : 'border-slate-200'}`}>
      <div className="p-2 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            autoFocus
            value={langSearch}
            onChange={e => setLangSearch(e.target.value)}
            placeholder={t("core.wordpopover.search_language_bb13e8")}
            className={`w-full pl-8 pr-2 py-1.5 text-sm bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg outline-none ${
              accent === 'emerald' ? 'focus:border-zinc-900' : 'focus:border-zinc-900'
            }`}
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredLangs.length === 0 ? (
          <p className="text-zinc-400 text-xs p-3 text-center">{t("core.wordpopover.no_match_3518df")}</p>
        ) : (
          filteredLangs.map(l => (
            <button
              type="button"
              key={l.code}
              onClick={() => { onPick(l); setLangSearch(''); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                l.code === selectedCode
                  ? accent === 'emerald'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-bold'
                    : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-bold'
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b-2 border-slate-100 dark:border-zinc-800 flex flex-col gap-4 shrink-0 bg-white dark:bg-zinc-900 relative">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <h3 className="font-serif font-extrabold text-zinc-900 dark:text-zinc-50 capitalize text-2xl flex items-center gap-3">
                 {word}
                 <button
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     sharedPlayWord(word, 1.0, speechLocale);
                   }}
                   className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-[0_3px_0_0_#000] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa] dark-keep"
                 >
                   <Volume2 className="w-5 h-5"/>
                 </button>
               </h3>
             </div>

             <div className="flex items-center gap-2">
               <button
                 type="button"
                 onClick={() => { void onToggleVocab(word); }}
                 className={`p-2 rounded-xl border-2 transition-[transform,box-shadow] duration-75 active:translate-y-[2px] active:shadow-none ${isSaved ? 'border-emerald-300 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 shadow-[0_2px_0_0_#6ee7b7] dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'border-slate-200 bg-white text-slate-600 shadow-[0_2px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}
                 title={isSaved ? t("core.worddetailsmodal.remove_from_vocab_6c7e4b") : t("core.worddetailsmodal.add_to_vocab_e702c2")}
               >
                 {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
               </button>
               <button type="button" onClick={onClose} className="p-2 rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>
           </div>

           <div className="flex gap-2">
             <button
               type="button"
               onClick={() => { setActiveTab('dictionary'); setLangPickerOpen(false); setDefPickerOpen(false); }}
               className={`flex-1 py-2 rounded-2xl border-2 font-serif text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 justify-center transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[2px] active:shadow-none ${activeTab === 'dictionary' ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-[0_2px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 dark:shadow-[0_2px_0_0_#e4e4e7]' : 'border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}
             >
               <BookOpen className="w-4 h-4" />  {t("nav.dictionary")}</button>
             <button
               type="button"
               onClick={() => { setActiveTab('translation'); setLangPickerOpen(false); setDefPickerOpen(false); }}
               className={`flex-1 py-2 rounded-2xl border-2 font-serif text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 justify-center transition-[transform,box-shadow,background-color] duration-75 active:translate-y-[2px] active:shadow-none ${activeTab === 'translation' ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-[0_2px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 dark:shadow-[0_2px_0_0_#e4e4e7]' : 'border-slate-200 bg-white text-slate-500 shadow-[0_2px_0_0_#e2e8f0] hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}
             >
               <Languages className="w-4 h-4" />  {t("core.worddetailsmodal.translation_ac26a7")}</button>
           </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'translation' && (
            <div className="mb-6 flex justify-center">
              <div className="w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => { setLangPickerOpen(o => !o); setDefPickerOpen(false); setLangSearch(''); }}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm rounded-2xl px-3 py-2.5 font-bold flex items-center justify-between shadow-[0_2px_0_0_#e2e8f0] dark:shadow-[0_2px_0_0_#3f3f46] hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
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
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t("core.worddetailsmodal.show_definition_in_f745b7")}</span>
              <div className="w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => { setDefPickerOpen(o => !o); setLangPickerOpen(false); setLangSearch(''); }}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm rounded-xl px-3 py-2.5 font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="truncate">{defLang.name}{defLang.native && defLang.native !== defLang.name ? ` · ${defLang.native}` : ''}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{defPickerOpen ? '▲' : '▼'}</span>
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
               <p>{activeTab === 'dictionary' ? t("core.worddetailsmodal.searching_dictionary_11b4eb") : `Translating to ${targetLang.name}...`}</p>
             </div>
           ) : error ? (
              <div className="text-center py-8">
                <p className="text-rose-500">{t("core.worddetailsmodal.could_not_find_67c7be")}{activeTab === 'dictionary' ? t("core.worddetailsmodal.definition_f3f1dd") : t("core.worddetailsmodal.translation_efd7fd")}.</p>
                {activeTab === 'dictionary' && (
                  <p className="text-zinc-400 text-sm mt-2">{t("core.worddetailsmodal.try_changing_the_definition_language_2065de")}</p>
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
                     <h4 className="font-bold text-zinc-900 dark:text-zinc-50 border-b border-slate-200 pb-1 mb-2 capitalize">{meaning.partOfSpeech}</h4>
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
              <div className="py-4 flex flex-col items-stretch gap-3">
                 {Array.isArray(transData.senses) && transData.senses.length > 1 ? (
                   <>
                     <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
                       {transData.senses.length}  {t("core.worddetailsmodal.meanings_56ff9b")}{transData.lang}
                     </p>
                     {transData.senses.map((s: any, i: number) => (
                       <div
                         key={i}
                         className="rounded-2xl border border-slate-200 bg-emerald-50/80 px-4 py-3 text-left"
                       >
                         <div className="flex items-baseline justify-between gap-2 mb-1">
                           <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700/80">
                             {s.pos || t("core.worddetailsmodal.sense_e9a38c")}
                           </span>
                           {i === 0 && (
                             <span className="text-[10px] font-semibold text-emerald-600">{t("core.wordpopover.closest_c113bd")}</span>
                           )}
                         </div>
                         <p className="text-xl font-black text-emerald-700 leading-snug">{s.known}</p>
                         {s.definition && s.definition !== s.known && (
                           <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{s.definition}</p>
                         )}
                       </div>
                     ))}
                   </>
                 ) : (
                   <div className="py-4 text-center flex flex-col items-center justify-center space-y-4">
                     <p className="text-3xl font-black text-emerald-600 bg-emerald-50 px-6 py-4 rounded-2xl border border-slate-200">
                       {transData.translation}
                     </p>
                   </div>
                 )}
              </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
