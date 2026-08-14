import React, { useState, useCallback, useRef } from 'react';
import { playWord as sharedPlayWord } from '../lib/speech';
import { useContentLang } from '../contexts/ContentLangContext';
import { ArrowLeft, BookOpen, Hash, Save, FileText, X, Eye, Trash2, ChevronRight, Search } from 'lucide-react';
import { TASK2_DATA as _DEFAULT_TASK2, type Task2EssayType } from '../data/writingTask2';
import { useCMSContent } from '../lib/useCMSContent';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { activityLangStamp } from '../lib/activityMeta';

type T2View = 'types' | 'categories' | 'prompts' | 'editor';

type SavedEssay = {
  id: string;
  essayType: Task2EssayType;
  categoryName: string;
  promptText: string;
  content: string;
  wordCount: number;
  savedAt: string;
  createdAt: number;
};

const LS_KEY = 'smarty_t2_essays_v1';
function load(): Record<string, SavedEssay[]> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function persist(data: Record<string, SavedEssay[]>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

const TYPE_COLORS: Record<Task2EssayType, { bg: string; text: string; border: string; badge: string; accent: string }> = {
  'discussion':          { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'hover:border-violet-300',  badge: 'bg-violet-100 text-violet-700',  accent: 'bg-violet-600' },
  'opinion':             { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'hover:border-blue-300',    badge: 'bg-blue-100 text-blue-700',      accent: 'bg-blue-600'   },
  'advantage-disadvantage': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-300', badge: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-600' },
  'problem-solution':    { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'hover:border-amber-300',   badge: 'bg-amber-100 text-amber-700',    accent: 'bg-amber-600'  },
  'double-question':     { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'hover:border-rose-300',    badge: 'bg-rose-100 text-rose-700',      accent: 'bg-rose-600'   },
};

const PAGE_SIZE = 10;

export function WritingTask2({ onBack, onToggleVocab, savedVocab = {}, onShowModal }: {
  onBack?: () => void;
  onToggleVocab?: (w: string, ctx: string) => void;
  savedVocab?: Record<string, any>;
  onShowModal?: (w: string, mode: string) => void;
}) {
  const { speechLocale, contentLang } = useContentLang();
  const { task2Data: TASK2_DATA } = useCMSContent();
  const [view, setView]           = useState<T2View>('types');
  const [essayType, setEssayType] = useState<Task2EssayType>('discussion');
  const [catIdx, setCatIdx]       = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [content, setContent]     = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [savedEssays, setSavedEssays]   = useState<Record<string, SavedEssay[]>>(load);
  const [showSaved, setShowSaved]       = useState(false);
  const [viewingEssay, setViewingEssay] = useState<SavedEssay | null>(null);
  const [saveToast, setSaveToast]       = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeData = TASK2_DATA.find(d => d.type === essayType) ?? TASK2_DATA[0];
  const category = typeData.categories[catIdx];
  const promptText = category?.prompts[promptIdx] ?? '';
  const promptKey  = `${essayType}_${catIdx}_${promptIdx}`;
  const colors     = TYPE_COLORS[essayType];
  const savedForPrompt = savedEssays[promptKey] || [];
  const wordCount  = content.trim() ? content.trim().split(/\s+/).length : 0;

  const openPrompt = (type: Task2EssayType, ci: number, pi: number) => {
    setEssayType(type); setCatIdx(ci); setPromptIdx(pi);
    const draft = (() => { try { return localStorage.getItem(`t2_draft_${type}_${ci}_${pi}`) || ''; } catch { return ''; } })();
    setContent(draft);
    setView('editor');
  };

  const saveEssay = useCallback((): string | null => {
    if (!content.trim()) return null;
    const id = `t2_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: SavedEssay = {
      id, essayType, categoryName: category.name, promptText,
      content,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      savedAt: new Date().toLocaleString(),
      createdAt: Date.now(),
      ...activityLangStamp(contentLang),
    };
    setSavedEssays(prev => {
      const next = { ...prev, [promptKey]: [entry, ...(prev[promptKey] || [])] };
      persist(next);
      return next;
    });
    setSaveToast('Essay saved!');
    setTimeout(() => setSaveToast(null), 2000);
    return id;
  }, [content, promptKey, essayType, category, promptText, contentLang]);

  const deleteEssay = useCallback((key: string, id: string) => {
    setSavedEssays(prev => {
      const next = { ...prev, [key]: (prev[key] || []).filter(e => e.id !== id) };
      if (!next[key]?.length) delete next[key];
      persist(next);
      return next;
    });
  }, []);

  /* ── Editor ── */
  if (view === 'editor') {
    const instructionLine = typeData.instruction;
    return (
      <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
        <div className="shrink-0 border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10 bg-white shadow-sm">
          <button onClick={() => setView('prompts')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prompts</span>
          </button>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full hidden lg:inline ${colors.badge}`}>
            Task 2 · {typeData.label} · {category.name}
          </span>
          <div className="flex-1" />
          <span className="hidden md:flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0">
            <Hash className="w-3 h-3" />{wordCount} words
            {wordCount < 250 && <span className="text-amber-500 ml-1">({250 - wordCount} to go)</span>}
            {wordCount >= 250 && <span className="text-emerald-500 ml-1">✓ 250+ words</span>}
          </span>

          {savedForPrompt.length > 0 && (
            <button onClick={() => setShowSaved(true)} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Essays</span>
              <span className="bg-zinc-900 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{savedForPrompt.length}</span>
            </button>
          )}

          <button
            onClick={() => { saveEssay(); setContent(''); try { localStorage.removeItem(`t2_draft_${promptKey}`); } catch {} }}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl shadow-md shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>

        {saveToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> {saveToast}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <div className={`border rounded-2xl p-5 mb-10 bg-amber-50 border-amber-200`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${colors.text}`}>
                IELTS Task 2 · {typeData.label} · {category.name}
              </p>
              <p className="text-slate-700 leading-relaxed font-serif text-lg mb-3">
                {promptText.split(' ').map((word, i) => {
                  const clean = word.replace(/[^\p{L}\p{M}'’-]/gu, '').toLowerCase();
                  const isSel = selectedWord === clean && !!clean;
                  const promptWords = promptText.split(' ');
                  return (
                    <span key={i} className="cursor-pointer relative inline-block mr-1.5 mb-1"
                      onClick={() => { if (clean) setSelectedWord(isSel ? null : clean); }}>
                      {word}
                      {isSel && (
                        <WordPopover
                          word={clean} cleanWord={clean}
                          sentence={sentenceAroundWord(promptWords, i)}
                          savedVocab={savedVocab}
                          onPlay={w => sharedPlayWord(w, 1.0, speechLocale)}
                          onToggleVocab={w => onToggleVocab?.(w, 'From Task 2 writing')}
                          onShowModal={(w, mode) => { onShowModal?.(w, mode); setSelectedWord(null); }}
                          onClose={() => setSelectedWord(null)}
                        />
                      )}
                    </span>
                  );
                })}
              </p>
              <p className="text-xs text-amber-600 font-medium italic">{instructionLine}</p>
              <p className="text-[10px] text-amber-500 mt-1 italic">Click any word to translate, listen, or save.</p>
            </div>

            <textarea
              autoFocus spellCheck
              value={content}
              onChange={e => {
                setContent(e.target.value);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                  try { localStorage.setItem(`t2_draft_${promptKey}`, e.target.value); } catch {}
                }, 800);
              }}
              placeholder="Begin your Task 2 essay here…"
              className="w-full min-h-[520px] text-lg text-slate-800 leading-[1.9] font-serif resize-none outline-none bg-transparent placeholder-slate-300"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-2 flex items-center gap-6 text-xs text-slate-400 bg-white">
          <span>{wordCount} words</span>
          <span className={wordCount >= 250 ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
            {wordCount >= 250 ? '✓ Minimum word count met' : `${250 - wordCount} more words needed`}
          </span>
        </div>

        {showSaved && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setShowSaved(false)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">My Essays for this Prompt</h2>
                  <p className="text-xs text-zinc-500">{savedForPrompt.length} saved</p>
                </div>
                <button onClick={() => setShowSaved(false)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {savedForPrompt.map(e => (
                  <div key={e.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                        {e.wordCount} words · {e.savedAt}
                      </p>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setViewingEssay(e)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Delete?')) deleteEssay(promptKey, e.id); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{e.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewingEssay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setViewingEssay(null)}>
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">{typeData.label} – {viewingEssay.categoryName}</h2>
                  <p className="text-xs text-zinc-500">{viewingEssay.wordCount} words · {viewingEssay.savedAt}</p>
                </div>
                <button onClick={() => setViewingEssay(null)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-6">
                <p className="font-serif text-sm text-zinc-500 italic mb-4 border-l-4 border-zinc-200 pl-3 line-clamp-3">{viewingEssay.promptText}</p>
                <p className="font-serif text-base leading-relaxed whitespace-pre-wrap text-zinc-800">{viewingEssay.content}</p>
              </div>
              <div className="px-6 py-3 border-t border-zinc-100 flex gap-2 shrink-0">
                <button onClick={() => { setContent(viewingEssay.content); setViewingEssay(null); setShowSaved(false); }} className="flex-1 px-4 py-2 text-sm font-bold bg-zinc-900 text-white rounded-xl hover:bg-black">Load into Editor</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Prompts screen ── */
  if (view === 'prompts') {
    const col = TYPE_COLORS[essayType];
    const cat = typeData.categories[catIdx];
    const filtered = search.trim()
      ? cat.prompts.map((p, i) => ({ p, i })).filter(({ p }) => p.toLowerCase().includes(search.toLowerCase()))
      : cat.prompts.map((p, i) => ({ p, i }));
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <button onClick={() => { setView('categories'); setSearch(''); setPage(1); }} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Categories
          </button>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">{typeData.label}</h1>
          <p className={`text-sm font-bold mb-6 ${col.text}`}>{cat.name}</p>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search prompts…"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700/50 shadow-sm" />
          </div>

          <div className="space-y-3">
            {paged.map(({ p, i }) => {
              const key = `${essayType}_${catIdx}_${i}`;
              const count = (savedEssays[key] || []).length;
              return (
                <button key={i} onClick={() => openPrompt(essayType, catIdx, i)}
                  className={`w-full bg-white p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4 shadow-sm hover:shadow-lg ${col.border} hover:-translate-y-0.5 transition-all duration-200 text-left group`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-300">#{i + 1}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{count} saved</span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{p}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${col.bg} ${col.text} group-hover:bg-zinc-900 group-hover:text-white transition-colors mt-1`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && <p className="text-center text-slate-400 py-16">No prompts match your search.</p>}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-4 bg-white p-4 rounded-full border border-slate-200 shadow-sm w-fit mx-auto">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-600">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Categories screen ── */
  if (view === 'categories') {
    const col = TYPE_COLORS[essayType];
    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <button onClick={() => setView('types')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Essay Types
          </button>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${col.badge}`}>
            {typeData.label}
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Choose a Category</h1>
          <p className="text-slate-500 mb-8">{typeData.description} {typeData.categories[0].prompts.length * typeData.categories.length} prompts across {typeData.categories.length} categories.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typeData.categories.map((cat, ci) => {
              const totalSaved = cat.prompts.reduce((acc, _, pi) => acc + (savedEssays[`${essayType}_${ci}_${pi}`]?.length || 0), 0);
              return (
                <button key={ci} onClick={() => { setCatIdx(ci); setSearch(''); setPage(1); setView('prompts'); }}
                  className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg ${col.border} hover:-translate-y-0.5 transition-all duration-200 text-left group flex items-center justify-between`}>
                  <div>
                    <p className="font-bold text-slate-800 text-base">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.prompts.length} prompts{totalSaved > 0 ? ` · ${totalSaved} saved` : ''}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${col.bg} ${col.text} group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Essay types screen ── */
  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-16">
        <header className="mb-12">
          {onBack && (
            <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <BookOpen className="w-3 h-3" /> IELTS Academic Task 2
          </div>
          <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight leading-tight mb-1.5">Choose Essay Type</h1>
          <p className="text-slate-500 text-lg">500 essay prompts across 5 types and 10 topic categories. Write at least 250 words.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TASK2_DATA.map(type => {
            const col = TYPE_COLORS[type.type];
            const totalSaved = Object.keys(savedEssays).filter(k => k.startsWith(`${type.type}_`)).reduce((acc, k) => acc + savedEssays[k].length, 0);
            const totalPrompts = type.categories.reduce((acc, c) => acc + c.prompts.length, 0);
            return (
              <button key={type.type} onClick={() => { setEssayType(type.type); setView('categories'); }}
                className={`bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl ${col.border} hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col justify-between min-h-[200px]`}>
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${col.bg} ${col.text} transition-colors duration-300`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{type.label}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{type.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{totalPrompts} prompts · {type.categories.length} categories</span>
                  {totalSaved > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{totalSaved} saved</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
