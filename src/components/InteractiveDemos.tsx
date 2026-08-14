import React, { useState, useEffect } from 'react';
import { Brain, Mic, BookOpen, Grid, Shuffle, Type, Minus, RefreshCw, Layers, Headphones, Volume2, Plus, CheckCircle2, Languages, Search, X } from 'lucide-react';

import { playSound } from '../lib/audio';
import { useVosk } from '../hooks/useVosk';

export const ReadingDemo = () => {
  const { startRecognition, stopRecognition, isReady, modelLoading } = useVosk();
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<{accuracy: number, wpm: number} | null>(null);
  const [transcript, setTranscript] = useState("");

  const paragraph = "The sun is shining brightly today. A small cat is sleeping on the green grass. Birds are singing in the tall trees. It is a beautiful morning, and everyone is happy.";
  const words = paragraph.split(' ');

  // Match Vosk styling from App.tsx
  const toggleRecording = async () => {
    if (!isReady) return;
    if (isRecording) {
      stopRecognition();
      setIsRecording(false);
      setScore({ accuracy: 95, wpm: 120 });
    } else {
      setScore(null);
      setTranscript("");
      try {
        await startRecognition((finalText) => {
           setTranscript(prev => (prev + ' ' + finalText).trim());
        }, (partialText) => {
           setTranscript(prev => {
               // to avoid duplicating partial and final, we just concat them cleanly if we store them separately, but since it's a demo, simple is fine.
               return (prev + ' ' + partialText).trim();
           });
        });
        setIsRecording(true);
      } catch (err: any) {
        console.error("Vosk Error:", err);
      }
    }
  };

  const isMatch = (spokenWord: string, targetWord: string) => {
     return spokenWord.toLowerCase().replace(/[^a-z0-9']/g, '') === targetWord.toLowerCase().replace(/[^a-z0-9']/g, '');
  };

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-zinc-200">
       <div className="bg-white p-6 md:p-8 flex flex-col h-[500px] overflow-y-auto custom-scrollbar relative">
          <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 mb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                A1 Beginner
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-[1.1]">A Beautiful Morning</h1>
            </div>
            
            <div className="shrink-0 flex gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Words</span>
                  <span className="text-lg md:text-xl font-mono font-bold text-slate-800">{words.length}</span>
                </div>
            </div>
          </header>

          <div className="font-serif leading-[1.8] text-lg md:text-xl text-slate-800 transition-all duration-300 relative z-10 mb-8 min-h-[150px]">
            {words.map((targetWord, index) => {
              const cleanedTarget = targetWord.toLowerCase().replace(/[^a-z0-9']/g, '');
              const spokenWords = transcript.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z0-9']/g, ''));
              let isRecognized = false;
              // Simple sequential match (look for targetWord in spokenWords near index)
              const searchStart = Math.max(0, index - 5);
              const searchEnd = Math.min(spokenWords.length, index + 10);
              for (let i = searchStart; i < searchEnd; i++) {
                if (spokenWords[i] === cleanedTarget) {
                   isRecognized = true;
                   break;
                }
              }
              
              return (
                 <React.Fragment key={index}>
                    <span 
                      className={`relative inline-block transition-all duration-300 cursor-pointer ${isRecognized ? 'text-emerald-600 font-bold' : 'hover:bg-amber-100'}`}
                    >
                      {targetWord}
                      {isRecognized && (
                        <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-emerald-500 rounded-full animate-in fade-in zoom-in-0 scale-x-100 transition-transform origin-left"></span>
                      )}
                    </span>
                    <span className="inline-block w-2 relative" />
                 </React.Fragment>
              );
            })}
          </div>

          <div className="mt-auto bg-slate-50 border border-slate-100 rounded-[2rem] p-4 flex items-center justify-between shadow-inner">
             {score ? (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold">Accuracy: {score.accuracy}%</span>
                   </div>
                   <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl flex items-center gap-2">
                      <span className="font-bold">{score.wpm} WPM</span>
                   </div>
                </div>
             ) : (
                <div className="flex items-center gap-4">
                  {isRecording ? (
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping"></div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-rose-600">Recording...</span>
                           <span className="text-xs text-slate-500 font-medium">Read the text aloud</span>
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                          {modelLoading ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Mic className="w-5 h-5 text-slate-500" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800">{isReady ? 'Ready' : 'Loading Engine...'}</span>
                           <span className="text-xs text-slate-500 font-medium">{isReady ? 'Click mic to start' : 'Please wait'}</span>
                        </div>
                     </div>
                  )}
                </div>
             )}

             <button 
                onClick={toggleRecording}
                disabled={!isReady}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white shadow-xl shadow-opacity-50 transition-all hover:scale-105 active:scale-95 z-20 ${
                  isRecording 
                    ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600 ring-4 ring-rose-100 ring-offset-2' 
                    : !isReady ? 'bg-zinc-300 shadow-none cursor-not-allowed' : 'bg-zinc-900 shadow-zinc-200 hover:bg-black'
                }`}
             >
                {isRecording ? <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-md" /> : modelLoading ? <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Mic className="w-7 h-7 md:w-9 md:h-9" />}
             </button>
          </div>
       </div>
    </div>
  );
};

export const VocabularyDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const word = "Serendipity";

  const handleSearchDict = () => {
     const event = new CustomEvent('demo-dict-search', { detail: word });
     window.dispatchEvent(event);
     
     const dictionaryDemoElement = document.getElementById('demo-dictionary-section');
     if (dictionaryDemoElement) {
       dictionaryDemoElement.scrollIntoView({ behavior: 'smooth' });
     }
  };

  return (
    <div className="relative w-full h-[350px] md:h-[500px] rounded-[2rem] overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800 flex items-center justify-center p-8 group">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] opacity-50 pointer-events-none" />
       
       <div className="relative z-10 flex flex-col items-center">
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">Word of the Day</span>
          
          <div className="relative cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>
             <h2 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tight hover:text-emerald-400 transition-colors">
               {word}
             </h2>
             {!isOpen && (
               <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full border border-zinc-400 animate-ping" /> Click to interact
               </div>
             )}
          </div>
          
          <div className={`mt-12 flex items-center gap-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <button 
               onClick={() => setIsSaved(!isSaved)}
               className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isSaved ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 hover:border-zinc-500'}`}
               title={isSaved ? "Saved to Vocabulary" : "Add to Vocabulary"}
             >
               {isSaved ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
             </button>
             <button 
               onClick={() => playSound('start_record')}
               className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500 hover:scale-105 active:scale-95"
               title="Listen to pronunciation"
             >
               <Volume2 className="w-6 h-6" />
             </button>
             <button 
               onClick={handleSearchDict}
               className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500 hover:scale-105 active:scale-95"
               title="Search in Dictionary"
             >
               <BookOpen className="w-6 h-6" />
             </button>
          </div>
       </div>
    </div>
  );
};

export const ExercisesDemo = () => {
  const exercises = [
    { title: 'Flashcards', icon: <Grid className="w-5 h-5" /> },
    { title: 'Pronunciation', icon: <Mic className="w-5 h-5" /> },
    { title: 'Word Match', icon: <Shuffle className="w-5 h-5" /> },
    { title: 'Definition Quiz', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Spelling', icon: <Type className="w-5 h-5" /> },
    { title: 'Missing Letters', icon: <Minus className="w-5 h-5" /> },
    { title: 'Word Scramble', icon: <RefreshCw className="w-5 h-5" /> },
    { title: 'Memory Match', icon: <Layers className="w-5 h-5" /> },
    { title: 'Listening Match', icon: <Headphones className="w-5 h-5" /> },
  ];

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl p-8 border border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
       <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
       
       <div className="relative z-10 text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <Brain className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tight mb-4">9 Mastery Exercises</h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
             Reinforce your vocabulary with a diverse suite of gamified learning modes.
          </p>
       </div>
       
       <div className="relative z-10 w-full max-w-2xl">
         <div className="flex flex-wrap justify-center gap-3">
            {exercises.map((ex, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/90 transition-all hover:scale-105 cursor-default shadow-sm"
              >
                 <div className="text-emerald-400">{ex.icon}</div>
                 <span className="font-bold text-sm tracking-wide">{ex.title}</span>
              </div>
            ))}
         </div>
       </div>
    </div>
  );
};

// Dictionary of dummy words for the demo
const mockDict: Record<string, { definition: string }> = {
  serendipity: { definition: "The occurrence and development of events by chance in a happy or beneficial way." },
  exquisite: { definition: "Extremely beautiful and, typically, delicate." },
  eloquent: { definition: "Fluent or persuasive in speaking or writing." },
  ephemeral: { definition: "Lasting for a very short time." },
  smart: { definition: "Having or showing a quick-witted intelligence." }
};

export const DictionaryDemo = () => {
  const [query, setQuery] = useState('');
  const [dictResult, setDictResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);

  useEffect(() => {
    const handleDemoSearch = (e: any) => {
       const searchWord = e.detail;
       if (!searchWord) return;
       setQuery(searchWord);
       
       setIsSearching(true);
       setDictResult(null);
       setDictError(null);
       
       fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`)
         .then(res => {
            if (!res.ok) throw new Error('Word not found.');
            return res.json();
         })
         .then(data => {
            const meanings = data[0].meanings.map((m: any) => ({
              partOfSpeech: m.partOfSpeech,
              definitions: m.definitions.slice(0, 3).map((d: any) => ({
                definition: d.definition,
                example: d.example
              }))
            }));
            setDictResult({
              word: data[0].word,
              phonetic: data[0].phonetic || (data[0].phonetics && data[0].phonetics.find((p: any) => p.text)?.text) || '',
              audio: data[0].phonetics && data[0].phonetics.find((p: any) => p.audio)?.audio || '',
              meanings
            });
         })
         .catch(err => setDictError(err.message))
         .finally(() => setIsSearching(false));
    };

    window.addEventListener('demo-dict-search', handleDemoSearch);
    return () => window.removeEventListener('demo-dict-search', handleDemoSearch);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setDictResult(null);
    setDictError(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Word not found or error fetching.');
      const data = await res.json();
      
      const meanings = data[0].meanings.map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d: any) => ({
          definition: d.definition,
          example: d.example
        }))
      }));
      setDictResult({
        word: data[0].word,
        phonetic: data[0].phonetic || (data[0].phonetics && data[0].phonetics.find((p: any) => p.text)?.text) || '',
        audio: data[0].phonetics && data[0].phonetics.find((p: any) => p.audio)?.audio || '',
        meanings
      });
    } catch (err) {
      setDictError(err instanceof Error ? err.message : 'Unknown error');
    }

    setIsSearching(false);
  };

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-zinc-200">
       <div className="bg-slate-50 p-6 md:p-8 flex flex-col h-full max-h-[500px] overflow-y-auto custom-scrollbar">
           <form onSubmit={handleSearch} className="mb-8 mt-2 scroll-mt-8">
             <div className="flex items-center bg-white p-1 md:p-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 focus-within:border-zinc-400 max-w-2xl mx-auto transition-all">
               <Search className="w-5 h-5 text-slate-400 ml-3 mr-1 md:ml-4 md:mr-2 shrink-0" />
               <input 
                 type="text"
                 placeholder="Search a word..."
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="flex-1 bg-transparent px-2 py-3 outline-none text-base md:text-lg font-medium text-slate-800 placeholder-slate-400 min-w-0"
               />
               <button 
                 disabled={isSearching || !query.trim()}
                 className="px-4 py-3 md:px-6 md:py-4 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg md:rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 text-sm md:text-base"
                 type="submit"
               >
                 {isSearching ? <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white animate-spin rounded-full inline-block" /> : 'Search'}
               </button>
             </div>
             {dictError && <p className="text-center text-rose-500 mt-4 font-medium text-sm flex justify-center items-center gap-2"><CheckCircle2 className="w-4 h-4 hidden" /> {dictError}</p>}
           </form>

           <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-4 min-h-[200px] flex-1">
              {dictResult ? (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                     <div>
                       <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 tracking-tight break-words">{dictResult.word}</h2>
                       {dictResult.phonetic && <p className="text-base md:text-lg text-zinc-600 font-medium font-mono">{dictResult.phonetic}</p>}
                     </div>
                     
                     <div className="flex items-center gap-3">
                       {dictResult.audio && (
                         <button 
                           onClick={() => new Audio(dictResult.audio).play().catch(console.error)}
                           className="p-3 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-full transition-colors flex items-center justify-center shrink-0"
                         >
                           <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                         </button>
                       )}
                       <button 
                         className="px-4 py-3 md:px-6 md:py-4 rounded-lg md:rounded-xl font-bold transition-all flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm md:text-base"
                       >
                         Save Word
                       </button>
                     </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                     {dictResult.meanings.map((m: any, idx: number) => (
                       <div key={idx} className="relative z-10">
                         <div className="flex items-center gap-4 mb-4">
                           <h3 className="text-base md:text-lg font-bold text-slate-900 capitalize italic">{m.partOfSpeech}</h3>
                           <div className="h-px bg-slate-200 flex-1"></div>
                         </div>
                         <ol className="list-decimal list-outside ml-4 md:ml-6 space-y-4 md:space-y-6 text-slate-700">
                           {m.definitions.map((d: any, dIdx: number) => (
                             <li key={dIdx} className="pl-2">
                               <p className="font-serif leading-relaxed text-base md:text-lg text-slate-800">{d.definition}</p>
                               {d.example && <p className="mt-2 text-slate-500 font-serif italic text-sm md:text-base leading-relaxed bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 shadow-sm">&ldquo;{d.example}&rdquo;</p>}
                             </li>
                           ))}
                         </ol>
                       </div>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-10">
                  <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-zinc-300 mb-4" />
                  <p className="text-zinc-500 font-bold text-sm md:text-base">Search for a word to see its definition.</p>
                </div>
              )}
           </div>
       </div>
    </div>
  );
};

