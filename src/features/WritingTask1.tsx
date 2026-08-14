import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BarChart2, Hash, Save, FileText, X, Eye, Trash2, ChevronRight, Clock } from 'lucide-react';
import { TASK1_DATA as _DEFAULT_T1, TASK1_CHART_COLORS, type Task1ChartType } from '../data/writingTask1';
import { useCMSContent } from '../lib/useCMSContent';
import { Task1ChartVisual } from '../components/Task1ChartVisual';
import { useContentLang } from '../contexts/ContentLangContext';
import { activityLangStamp } from '../lib/activityMeta';

const PROMPTS_PER_PAGE = 8;

type T1View = 'types' | 'prompts' | 'editor';

type SavedEssay = {
  id: string;
  promptKey: string; // e.g. "table_0"
  chartType: Task1ChartType;
  promptTitle: string;
  content: string;
  wordCount: number;
  savedAt: string;
  createdAt: number;
};

const LS_KEY = 'smarty_t1_essays_v1';

function load(): Record<string, SavedEssay[]> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function persist(data: Record<string, SavedEssay[]>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function WritingTask1({ onBack, onToggleVocab, savedVocab = {}, onShowModal }: {
  onBack?: () => void;
  onToggleVocab?: (w: string, ctx: string) => void;
  savedVocab?: Record<string, any>;
  onShowModal?: (w: string, mode: string) => void;
}) {
  const { task1Data: TASK1_DATA } = useCMSContent();
  const { contentLang } = useContentLang();
  const [view, setView] = useState<T1View>('types');
  const [chartType, setChartType] = useState<Task1ChartType>('table');
  const [promptIdx, setPromptIdx] = useState(0);
  const [content, setContent] = useState('');
  const [savedEssays, setSavedEssays] = useState<Record<string, SavedEssay[]>>(load);
  const [showSaved, setShowSaved] = useState(false);
  const [viewingEssay, setViewingEssay] = useState<SavedEssay | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [promptPage, setPromptPage] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeData = TASK1_DATA.find(d => d.type === chartType) ?? TASK1_DATA[0];
  const prompt   = typeData.prompts[promptIdx];
  const promptKey = `${chartType}_${promptIdx}`;
  const colors   = TASK1_CHART_COLORS[chartType];
  const savedForPrompt = savedEssays[promptKey] || [];
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Auto-save draft
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (view === 'editor') {
      timerRef.current = setTimeout(() => {
        try { localStorage.setItem(`t1_draft_${promptKey}`, content); } catch {}
      }, 800);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content, promptKey, view]);

  const openPrompt = (type: Task1ChartType, idx: number) => {
    setChartType(type);
    setPromptIdx(idx);
    const draft = (() => { try { return localStorage.getItem(`t1_draft_${type}_${idx}`) || ''; } catch { return ''; } })();
    setContent(draft);
    setView('editor');
  };

  const saveEssay = useCallback((): string | null => {
    if (!content.trim()) return null;
    const id = `t1_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: SavedEssay = {
      id, promptKey, chartType,
      promptTitle: prompt.title,
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
  }, [content, promptKey, chartType, prompt, contentLang]);

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
    return (
      <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
        {/* Topbar */}
        <div className="shrink-0 border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10 bg-white shadow-sm">
          <button onClick={() => setView('prompts')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prompts</span>
          </button>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full hidden lg:inline ${colors.badge}`}>
            Task 1 · {typeData.label} · #{promptIdx + 1}
          </span>
          <div className="flex-1" />
          <span className="hidden md:flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0">
            <Hash className="w-3 h-3" />{wordCount} words
            {wordCount < 150 && <span className="text-amber-500 ml-1">({150 - wordCount} to go)</span>}
            {wordCount >= 150 && <span className="text-emerald-500 ml-1">✓ 150+ words</span>}
          </span>

          {savedForPrompt.length > 0 && (
            <button onClick={() => setShowSaved(true)} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-zinc-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Essays</span>
              <span className="bg-zinc-900 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{savedForPrompt.length}</span>
            </button>
          )}

          <button
            onClick={() => { saveEssay(); setContent(''); try { localStorage.removeItem(`t1_draft_${promptKey}`); } catch {} }}
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
            {/* Prompt display */}
            <div className={`border rounded-2xl p-5 mb-10 ${colors.bg.replace('group-hover:', '')} border-slate-200`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text.replace('group-hover:', '')}`}>
                  IELTS Task 1 · {typeData.label}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-base mb-4">{prompt.title}</p>
              <p className="text-slate-700 text-sm leading-relaxed mb-5">{prompt.instruction}</p>
              <Task1ChartVisual chartData={prompt.chartData} />
            </div>

            <textarea
              autoFocus
              spellCheck
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Begin your Task 1 response here… Describe the key features and make comparisons."
              className="w-full min-h-[480px] text-lg text-slate-800 leading-[1.9] font-serif resize-none outline-none bg-transparent placeholder-slate-300"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-2 flex items-center gap-6 text-xs text-slate-400 bg-white">
          <span>{wordCount} words</span>
          <span className={wordCount >= 150 ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
            {wordCount >= 150 ? '✓ Minimum word count met' : `${150 - wordCount} more words needed`}
          </span>
        </div>

        {/* Saved essays modal */}
        {showSaved && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setShowSaved(false)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">My Essays — {prompt.title}</h2>
                  <p className="text-xs text-zinc-500">{savedForPrompt.length} saved</p>
                </div>
                <button onClick={() => setShowSaved(false)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {savedForPrompt.map(e => (
                  <div key={e.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                          {e.wordCount} words · {e.savedAt}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setViewingEssay(e)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Delete?')) deleteEssay(promptKey, e.id); }}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{e.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Single essay viewer */}
        {viewingEssay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setViewingEssay(null)}>
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">{viewingEssay.promptTitle}</h2>
                  <p className="text-xs text-zinc-500">{viewingEssay.wordCount} words · {viewingEssay.savedAt}</p>
                </div>
                <button onClick={() => setViewingEssay(null)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <p className="font-serif text-base leading-relaxed whitespace-pre-wrap text-zinc-800">{viewingEssay.content}</p>
              </div>
              <div className="px-6 py-3 border-t border-zinc-100 flex gap-2 shrink-0">
                <button onClick={() => { setContent(viewingEssay.content); setViewingEssay(null); setShowSaved(false); }}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-zinc-900 text-white rounded-xl hover:bg-black">
                  Load into Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Prompts screen ── */
  if (view === 'prompts') {
    const col = TASK1_CHART_COLORS[chartType];
    const allPrompts = typeData.prompts;
    const totalPages = Math.ceil(allPrompts.length / PROMPTS_PER_PAGE);
    const pagePrompts = allPrompts.slice((promptPage - 1) * PROMPTS_PER_PAGE, promptPage * PROMPTS_PER_PAGE);

    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <button onClick={() => setView('types')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Chart Types
          </button>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">{typeData.label}</h1>
          <p className="text-slate-500 mb-8">{typeData.description} Choose a sample prompt below.</p>

          <div className="space-y-4">
            {pagePrompts.map((p, pageIdx) => {
              const idx = (promptPage - 1) * PROMPTS_PER_PAGE + pageIdx;
              const key = `${chartType}_${idx}`;
              const count = (savedEssays[key] || []).length;
              return (
                <button
                  key={idx}
                  onClick={() => openPrompt(chartType, idx)}
                  className={`w-full bg-white p-6 rounded-2xl border border-slate-200 flex items-start justify-between gap-4 shadow-sm hover:shadow-lg ${col.border} hover:-translate-y-0.5 transition-all duration-200 text-left group`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-300">Sample #{idx + 1}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                          {count} essay{count > 1 ? 's' : ''} saved
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-base mb-1">{p.title}</p>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                      {p.instruction.length > 120 ? p.instruction.slice(0, 120) + '…' : p.instruction}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${col.bg.replace('group-hover:', '')} ${col.text.replace('group-hover:', '')} group-hover:bg-zinc-900 group-hover:text-white transition-colors`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-6 bg-white p-4 rounded-full border border-slate-200 shadow-sm w-fit mx-auto">
              <button
                disabled={promptPage === 1}
                onClick={() => setPromptPage(p => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPromptPage(i + 1)}
                    className={`w-3 h-3 rounded-full transition-colors ${promptPage === i + 1 ? 'bg-zinc-900 scale-125' : 'bg-slate-200 hover:bg-slate-300'}`}
                  />
                ))}
              </div>
              <button
                disabled={promptPage >= totalPages}
                onClick={() => setPromptPage(p => p + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Chart types screen ── */
  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-16">
        <header className="mb-12">
          {onBack && (
            <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <BarChart2 className="w-3 h-3" /> IELTS Academic Task 1
          </div>
          <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight leading-tight mb-1.5">Select Chart Type</h1>
          <p className="text-[13px] text-slate-500">Each type has 100 sample prompts with real data. Write at least 150 words.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TASK1_DATA.map(type => {
            const col = TASK1_CHART_COLORS[type.type];
            const isProcess = type.type === 'process';
            const totalSaved = type.prompts.reduce((acc, _, i) => acc + (savedEssays[`${type.type}_${i}`]?.length || 0), 0);
            return (
              <button
                key={type.type}
                onClick={() => {
                  if (isProcess) return;
                  setChartType(type.type);
                  setPromptPage(1);
                  setView('prompts');
                }}
                disabled={isProcess}
                className={`relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 text-left group flex flex-col justify-between min-h-[220px] ${isProcess ? 'opacity-60 cursor-not-allowed' : `hover:shadow-xl ${col.border} hover:-translate-y-1`}`}
              >
                {isProcess && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Coming Soon
                  </div>
                )}
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${col.bg} ${col.text} ${isProcess ? '' : col.hover} transition-colors duration-300`}>
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{type.label}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{type.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {isProcess ? 'In development' : `${type.prompts.length} sample prompts`}
                  </span>
                  {totalSaved > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {totalSaved} saved
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
