import { useState, useEffect } from 'react';
import { Volume2, Mic, CheckCircle2 } from 'lucide-react';
import { lookupDictionary, readSavedDefLang } from '../lib/dictionary';
import { loadVocab, lookupWord, vocabDbEnabled } from '../lib/vocabDb';
import { useContentLang } from '../contexts/ContentLangContext';

interface DashboardWordCardProps {
  word: string;
  data: { count: number; lastMissed: number };
  type: 'practice' | 'improved';
  playWord: (word: string) => void;
  practicingWord: string | null;
  startPracticeWord: (word: string) => void;
  allVocabMap: Map<string, string>;
}

export function DashboardWordCard({ word, data, type, playWord, practicingWord, startPracticeWord, allVocabMap }: DashboardWordCardProps) {
  const { contentLang } = useContentLang();
  const [def, setDef] = useState<string | null>(allVocabMap.get(word.toLowerCase()) || null);
  const [loadingDef, setLoadingDef] = useState(!def);

  useEffect(() => {
    if (def) return;
    let cancelled = false;
    setLoadingDef(true);
    (async () => {
      try {
        if (vocabDbEnabled()) {
          await loadVocab(contentLang, readSavedDefLang());
          const card = lookupWord(word);
          if (card?.definition) {
            if (!cancelled) setDef(card.definition);
            return;
          }
        }
        const result = await lookupDictionary(word, contentLang, readSavedDefLang());
        if (cancelled) return;
        const d = result?.meanings?.[0]?.definitions?.[0]?.definition;
        setDef(d || 'No definition found.');
      } catch {
        if (!cancelled) setDef('Could not load definition.');
      } finally {
        if (!cancelled) setLoadingDef(false);
      }
    })();
    return () => { cancelled = true; };
  }, [word, def, contentLang]);

  return (
    <div className={`bg-white rounded-2xl p-6 border ${type === 'improved' ? 'border-emerald-200' : 'border-rose-200'} shadow-sm hover:shadow-lg transition-all group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3
            className={`text-xl font-bold text-slate-900 capitalize cursor-pointer transition-colors flex items-center gap-2 ${type === 'improved' ? 'hover:text-emerald-600' : 'hover:text-zinc-900'}`}
            onClick={() => playWord(word)}
            title="Click to hear pronunciation"
          >
            {word}
            <Volume2 className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${type === 'improved' ? 'text-emerald-500' : 'text-zinc-700'}`} />
          </h3>
        </div>
        {type === 'practice' ? (
          <div className="flex items-center gap-2">
            {practicingWord === word ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 text-zinc-900 rounded-md border border-zinc-200 animate-pulse">
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Listening...</span>
              </div>
            ) : (
              <button
                onClick={() => startPracticeWord(word)}
                className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors outline-none"
                title="Click and say to practice"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-600 px-2.5 py-1 rounded-md">
              Missed {data.count}x
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Mastered
          </span>
        )}
      </div>
      {loadingDef ? (
        <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse mt-3 text-sm" />
      ) : (
        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mt-3">{def}</p>
      )}
    </div>
  );
}
