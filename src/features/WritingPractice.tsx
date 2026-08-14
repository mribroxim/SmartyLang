import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playWord as sharedPlayWord } from '../lib/speech';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { activityLangStamp } from '../lib/activityMeta';
import { PenLine, ArrowLeft, Hash, ChevronRight, Search, Plus, Save, Sparkles, FileText, Trash2, Eye, X, BookmarkPlus, Bookmark, Image as ImageIcon, Upload } from 'lucide-react';
import { TOPICS_BY_LEVEL as _DEFAULT_TOPICS, PRACTICE_LEVELS, PracticeLevel } from '../data/practiceTopics';
import { useCMSContent } from '../lib/useCMSContent';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { useCustomSessions, type CustomSession } from '../hooks/useCustomSessions';
import { resizeImage, dataUrlBytes } from '../lib/imageResize';
import { ScreenShell, HubRow } from '../components/ScreenShell';
import { LevelCard, LevelCardGrid, LEVEL_THEMES } from '../components/LevelCards';

type Essay = {
  topicId: string;
  level: PracticeLevel;
  topicIdx: number;
  content: string;
  wordCount: number;
  savedAt: string;
  contentLang?: string;
  langLabel?: string;
};
type SavedEssay = {
  id: string;
  topicId: string;
  level: PracticeLevel;
  topicIdx: number;
  title: string;
  content: string;
  wordCount: number;
  savedAt: string;
  createdAt: number;
};

function topicTitle(prompt: string) {
  return prompt.length > 90 ? prompt.slice(0, 90).trimEnd() + '…' : prompt;
}

export function WritingPractice({
  onBack,
  initialLevel,
  initialTopicIndex,
  onToggleVocab,
  savedVocab = {},
  onShowModal,
}: { onBack?: () => void; initialLevel?: string; initialTopicIndex?: number; onToggleVocab?: (w: string, ctx: string) => void; savedVocab?: Record<string, any>; onShowModal?: (w: string, mode: string) => void }) {
  const { speechLocale, contentLang } = useContentLang();
  const { t, tLevel, tLevelDesc } = useUiLang();
  const { writingTopics: TOPICS_BY_LEVEL } = useCMSContent();
  const hasInitial = initialLevel !== undefined && initialTopicIndex !== undefined;
  const [view, setView]                   = useState<'levels' | 'topics' | 'editor'>(hasInitial ? 'editor' : 'levels');
  const [selectedLevel, setLevel]         = useState<PracticeLevel>((initialLevel as PracticeLevel) || 'Beginner');
  const [topicIdx, setTopicIdx]           = useState<number | null>(initialTopicIndex ?? null);
  const [content, setContent]             = useState('');
  const [essays, setEssays]               = useState<Record<string, Essay>>({});
  const [lastSaved, setLastSaved]         = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);
  const [selectedWord, setSelectedWord]   = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle]     = useState('');
  const [customTopicText, setCustomTopicText] = useState('');
  const [customImageData, setCustomImageData] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Saveable custom writing prompts. Metadata in localStorage, images in IDB.
  const { sessions: customSessions, save: saveCustomSession, remove: removeCustomSession, loadImage } =
    useCustomSessions('writing_custom_sessions_v1');
  // Thumbnail cache for the saved-prompts list (resolved lazily from IDB).
  const [sessionThumbnails, setSessionThumbnails] = useState<Record<string, string>>({});
  useEffect(() => {
    const missing = customSessions.filter(s => s.imageId && !sessionThumbnails[s.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map(async s => [s.id, await loadImage(s.id)] as const))
      .then(results => {
        if (cancelled) return;
        setSessionThumbnails(prev => {
          const next = { ...prev };
          results.forEach(([id, url]) => { if (url) next[id] = url; });
          return next;
        });
      });
    return () => { cancelled = true; };
  }, [customSessions, loadImage]); // eslint-disable-line react-hooks/exhaustive-deps
  const [savedEssaysList, setSavedEssaysList] = useState<Record<string, SavedEssay[]>>({});
  const [showSavedList, setShowSavedList]   = useState(false);
  const [viewingEssay, setViewingEssay]     = useState<SavedEssay | null>(null);
  const [saveToast, setSaveToast]           = useState<string | null>(null);
  const timerRef                          = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('smarty_essays_v2');
      if (s) {
        const parsed = JSON.parse(s);
        setEssays(parsed);
        // If jumping straight to editor from assignment, load saved content
        if (hasInitial && initialLevel && initialTopicIndex !== undefined) {
          const key = `${initialLevel}__${initialTopicIndex}`;
          const saved = parsed[key];
          setContent(saved?.content || '');
          setLastSaved(saved ? saved.savedAt : null);
        }
      }
      const sl = localStorage.getItem('smarty_saved_essays_v1');
      if (sl) {
        setSavedEssaysList(JSON.parse(sl));
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveEssay = useCallback((customTitle?: string): string | null => {
    if (!content.trim() || topicIdx === null) return null;
    const key = `${selectedLevel}__${topicIdx}`;
    const id = `essay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const title = customTitle?.trim() || (topicIdx === -1
      ? `Custom essay - ${new Date().toLocaleString()}`
      : `Essay #${(savedEssaysList[key]?.length || 0) + 1}`);
    const entry: SavedEssay = {
      id,
      topicId: key,
      level: selectedLevel,
      topicIdx,
      title,
      content,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      savedAt: new Date().toLocaleString(),
      createdAt: Date.now(),
      ...activityLangStamp(contentLang),
    };
    setSavedEssaysList(prev => {
      const next = { ...prev, [key]: [entry, ...(prev[key] || [])] };
      localStorage.setItem('smarty_saved_essays_v1', JSON.stringify(next));
      return next;
    });
    setSaveToast('Essay saved!');
    setTimeout(() => setSaveToast(null), 2000);
    return id;
  }, [content, topicIdx, selectedLevel, savedEssaysList, contentLang]);

  const deleteSavedEssay = useCallback((key: string, id: string) => {
    setSavedEssaysList(prev => {
      const next = { ...prev, [key]: (prev[key] || []).filter(e => e.id !== id) };
      if (next[key]?.length === 0) delete next[key];
      localStorage.setItem('smarty_saved_essays_v1', JSON.stringify(next));
      return next;
    });
  }, []);

  const essayKey = (level: PracticeLevel, idx: number) => `${level}__${idx}`;

  const openTopic = (level: PracticeLevel, idx: number) => {
    const key  = essayKey(level, idx);
    const saved = essays[key];
    setContent(saved?.content || '');
    setLastSaved(saved ? saved.savedAt : null);
    setLevel(level);
    setTopicIdx(idx);
    setView('editor');
  };

  const persist = useCallback((text: string, level: PracticeLevel, idx: number) => {
    const key       = essayKey(level, idx);
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const savedAt   = new Date().toLocaleTimeString();
    const entry: Essay = {
      topicId: key, level, topicIdx: idx, content: text, wordCount, savedAt,
      ...activityLangStamp(contentLang),
    };
    setEssays(prev => {
      const updated = { ...prev, [key]: entry };
      localStorage.setItem('smarty_essays_v2', JSON.stringify(updated));
      return updated;
    });
    setLastSaved(savedAt);
  }, [contentLang]);

  const handleChange = (text: string) => {
    setContent(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (topicIdx !== null && topicIdx !== -1) {
      timerRef.current = setTimeout(() => persist(text, selectedLevel, topicIdx), 800);
    }
  };

  const essaysForLevel = (level: PracticeLevel) =>
    TOPICS_BY_LEVEL[level].filter((_, idx) => {
      const e = essays[essayKey(level, idx)];
      return e && e.content.trim();
    }).length;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const prompt    = topicIdx === -1 ? customTopicText : (topicIdx !== null ? TOPICS_BY_LEVEL[selectedLevel][topicIdx] : '');

  /* ── Editor ── */
  if (view === 'editor' && topicIdx !== null && topicIdx !== undefined) {
    const theme = LEVEL_THEMES[PRACTICE_LEVELS.indexOf(selectedLevel)];
    const currentKey = `${selectedLevel}__${topicIdx}`;
    const savedListForTopic = savedEssaysList[currentKey] || [];
    return (
      <div className="flex flex-col h-full min-h-0 flex-1 bg-white">
        {/* Top bar */}
        <div className="shrink-0 border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-10 bg-white shadow-sm">
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              if (topicIdx !== -1) persist(content, selectedLevel, topicIdx);
              setView('topics');
            }}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-zinc-900 transition-colors shrink-0 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Topics</span>
          </button>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full hidden lg:inline ${theme.badge}`}>
            {topicIdx === -1 ? `${selectedLevel} · Custom` : `${selectedLevel} · #${topicIdx + 1}`}
          </span>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1 font-medium"><Hash className="w-3 h-3" />{wordCount} words</span>
            {lastSaved && <span className="text-emerald-500 font-medium">Auto-saved {lastSaved}</span>}
          </div>

          {/* My Essays */}
          {savedListForTopic.length > 0 && (
            <button
              onClick={() => setShowSavedList(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-zinc-900 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0"
              title="My saved essays for this topic"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Essays</span>
              <span className="bg-zinc-900 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{savedListForTopic.length}</span>
            </button>
          )}

          {/* Save */}
          <button
            onClick={() => {
              saveEssay();
              setContent('');
              if (topicIdx !== -1) persist('', selectedLevel, topicIdx);
            }}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl shadow-md shrink-0"
            title="Save this essay and start a new one"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>

        {/* Save toast */}
        {saveToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Save className="w-4 h-4" /> {saveToast}
          </div>
        )}

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">{topicIdx === -1 ? `Custom Topic: ${customTitle || 'Untitled'}` : `Writing Prompt #${topicIdx + 1}`}</p>
              <p className="text-slate-700 leading-relaxed font-serif text-lg">
                {prompt.split(' ').map((word, i) => {
                  const cleanWord = word.replace(/[^\p{L}\p{M}'’-]/gu, '').toLowerCase();
                  const isSelected = selectedWord === cleanWord && !!cleanWord;
                  const promptWords = prompt.split(' ');
                  return (
                    <span key={i} className="cursor-pointer relative inline-block mr-2.5 mb-2"
                      onClick={() => { if (cleanWord) setSelectedWord(isSelected ? null : cleanWord); }}>
                      {word}
                      {isSelected && (
                        <WordPopover
                          word={cleanWord}
                          cleanWord={cleanWord}
                          sentence={sentenceAroundWord(promptWords, i)}
                          savedVocab={savedVocab}
                          onPlay={(w) => sharedPlayWord(w, 1.0, speechLocale)}
                          onToggleVocab={(w) => onToggleVocab?.(w, 'From writing practice')}
                          onShowModal={(w, mode) => { onShowModal?.(w, mode); setSelectedWord(null); }}
                          onClose={() => setSelectedWord(null)}
                        />
                      )}
                    </span>
                  );
                })}
              </p>
              <p className="text-[10px] text-amber-500 mt-2 italic">Click any word to translate, listen, or save.</p>
              {topicIdx === -1 && customImageData && (
                <div className="mt-5 pt-5 border-t border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Visual Material
                  </p>
                  <img
                    src={customImageData}
                    alt="Writing prompt visual"
                    className="max-w-full max-h-[420px] rounded-xl border border-amber-200 shadow-sm bg-white"
                  />
                </div>
              )}
            </div>
            <textarea
              autoFocus
              spellCheck={true}
              value={content}
              onChange={e => handleChange(e.target.value)}
              placeholder="Start writing here…"
              className="w-full min-h-[520px] text-lg text-slate-800 leading-[1.9] font-serif resize-none outline-none bg-transparent placeholder-slate-300"
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="shrink-0 border-t border-slate-100 px-4 md:px-6 py-2 flex items-center gap-6 text-xs text-slate-400 bg-white">
          <span>{wordCount} words</span>
          <span>{content.length} characters</span>
          {lastSaved && <span className="text-emerald-500 font-medium">● Auto-saved {lastSaved}</span>}
        </div>

        {/* My saved essays list modal */}
        {showSavedList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setShowSavedList(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">My Essays for this Topic</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{savedListForTopic.length} saved essay{savedListForTopic.length === 1 ? '' : 's'}</p>
                </div>
                <button onClick={() => setShowSavedList(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {savedListForTopic.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No saved essays yet.</p>
                ) : (
                  savedListForTopic.map(e => (
                    <div key={e.id} className="p-4 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-2xl group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1 truncate">{e.title}</h3>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                            {e.wordCount} words · {e.savedAt}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setViewingEssay(e)} title="View" className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this saved essay?')) deleteSavedEssay(currentKey, e.id); }} title="Delete" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{e.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Single essay viewer */}
        {viewingEssay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setViewingEssay(null)}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg truncate">{viewingEssay.title}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{viewingEssay.wordCount} words · saved {viewingEssay.savedAt}</p>
                </div>
                <button onClick={() => setViewingEssay(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <p className="font-serif text-base leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{viewingEssay.content}</p>
              </div>
              <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => {
                    setContent(viewingEssay.content);
                    if (topicIdx !== -1) persist(viewingEssay.content, selectedLevel, topicIdx);
                    setViewingEssay(null);
                    setShowSavedList(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-zinc-900 text-white rounded-xl hover:bg-black transition-colors"
                >Load into Editor</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Topics screen ── */
  if (view === 'topics') {
    const levelIdx  = PRACTICE_LEVELS.indexOf(selectedLevel);
    const theme     = LEVEL_THEMES[levelIdx];
    const topics    = TOPICS_BY_LEVEL[selectedLevel];
    const filtered  = search.trim()
      ? topics.filter(t => t.toLowerCase().includes(search.toLowerCase()))
      : topics;
    const savedCount = essaysForLevel(selectedLevel);
    const totalPages = Math.ceil(filtered.length / 8);
    const pagedFiltered = filtered.slice((page - 1) * 8, page * 8);

    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <button onClick={() => { setSearch(''); setView('levels'); }} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-[22px] font-serif font-black text-slate-900 tracking-tight">
                {tLevel(selectedLevel)} <span className="text-slate-300 font-sans font-light text-3xl">|</span>
                <span className="font-sans text-2xl text-zinc-900 tracking-normal font-medium">{t('library.topics')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('writing.essaysSaved')}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-zinc-900">{savedCount}</span>
                <span className="font-bold text-slate-400">/ {topics.length}</span>
              </div>
            </div>
          </header>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.searchTopics')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 transition-all shadow-sm"
            />
          </div>

          {(() => {
            const lastEssay = (Object.values(essays) as Essay[])
              .filter(e => e.level === selectedLevel && e.content.trim())
              .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
            return lastEssay ? (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{topicTitle(TOPICS_BY_LEVEL[selectedLevel][lastEssay.topicIdx] || '')}</p>
                  <p className="text-xs text-slate-400">{lastEssay.wordCount} {t('common.words')} · saved {lastEssay.savedAt}</p>
                </div>
                <button
                  onClick={() => openTopic(selectedLevel, lastEssay.topicIdx)}
                  className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-sm hover:bg-amber-700 transition-colors shrink-0"
                >{t('dash.continue')}</button>
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedFiltered.map((topic, i) => {
              const realIdx = search.trim() ? topics.indexOf(topic) : (page - 1) * 8 + i;
              const key     = essayKey(selectedLevel, realIdx);
              const saved   = essays[key];
              const hasSaved = saved && saved.content.trim();
              return (
                <button
                  key={realIdx}
                  onClick={() => openTopic(selectedLevel, realIdx)}
                  className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 transition-all duration-300 text-left group min-h-[220px]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-300">#{realIdx + 1}</span>
                      {hasSaved && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                          {saved.wordCount} words saved
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-base leading-snug group-hover:text-slate-900 transition-colors">{topicTitle(topic)}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{t('library.status')}</span>
                      <span className="text-sm font-bold text-slate-400">{hasSaved ? `${saved.wordCount} ${t('common.words')}` : t('library.unwritten')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-900 font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <span>{t('action.write')}</span>
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-16">{t('writing.searchEmpty')}</p>
          )}

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
        </div>
      </div>
    );
  }

  /* ── Levels screen ── */
  return (
    <ScreenShell size="wide" title={t('writing.general.title')} subtitle={t('writing.levelSubtitle')}>
        <div className="flex flex-col gap-3">
          <HubRow
            dark
            icon={<Plus className="w-6 h-6" />}
            title={t('writing.customTitle')}
            desc={t('writing.customDesc')}
            onClick={() => setShowCustomForm(true)}
          />
          <LevelCardGrid>
            {PRACTICE_LEVELS.map((level, idx) => {
              const total   = TOPICS_BY_LEVEL[level].length;
              const saved   = essaysForLevel(level);
              const percent = Math.round((saved / total) * 100) || 0;
              return (
                <LevelCard
                  key={level}
                  title={tLevel(level)}
                  desc={tLevelDesc('writing.desc', level)}
                  pct={percent}
                  themeIndex={idx}
                  icon={<PenLine className="w-5 h-5 md:w-6 md:h-6" />}
                  onClick={() => { setLevel(level); setSearch(''); setPage(1); setView('topics'); }}
                />
              );
            })}
          </LevelCardGrid>
        </div>

      {/* Custom Form Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Custom Writing Practice</h3>
            <p className="text-sm text-slate-500 mb-6">Optional: attach a chart, photo, or diagram and describe it in your essay.</p>

            {/* Saved prompts list */}
            {customSessions.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Saved Prompts</p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customSessions.map(s => {
                    const thumb = sessionThumbnails[s.id];
                    const hasImage = !!s.imageId;
                    return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" />
                      ) : hasImage ? (
                        <div className="w-12 h-12 rounded-lg shrink-0 border border-slate-200 bg-slate-100 animate-pulse" />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-sm truncate">{s.title}</p>
                          {hasImage && <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{s.prompt}</p>
                      </div>
                      <button
                        onClick={async () => {
                          setActiveCustomId(s.id);
                          setCustomTitle(s.title);
                          setCustomTopicText(s.prompt);
                          setCustomImageData(hasImage ? (thumb || await loadImage(s.id)) : null);
                          setShowCustomForm(false);
                          setContent('');
                          setLastSaved(null);
                          setTopicIdx(-1);
                          setView('editor');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                      >Use</button>
                      <button
                        onClick={() => removeCustomSession(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors shrink-0"
                        title="Delete saved prompt"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 text-center mt-3 mb-2">— or create a new one below —</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Title</label>
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  placeholder="e.g. Bar chart — energy consumption" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Content / Prompt</label>
                <textarea value={customTopicText} onChange={e => setCustomTopicText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-700 min-h-[140px] resize-none"
                  placeholder="The chart below shows... Summarise the information by selecting and reporting the main features..." />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">
                  Image (optional) <span className="text-slate-400 font-normal">— chart, photo, or diagram to describe</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setImageProcessing(true);
                    try {
                      const dataUrl = await resizeImage(f, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
                      const kb = Math.round(dataUrlBytes(dataUrl) / 1024);
                      if (kb > 2500) {
                        // Resize harder if still too big
                        const smaller = await resizeImage(f, { maxWidth: 900, maxHeight: 900, quality: 0.7 });
                        setCustomImageData(smaller);
                      } else {
                        setCustomImageData(dataUrl);
                      }
                    } catch (err) {
                      alert('Could not process the image. Try a different file.');
                    } finally {
                      setImageProcessing(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                {customImageData ? (
                  <div className="relative inline-block group">
                    <img src={customImageData} alt="Prompt attachment" className="max-h-48 rounded-xl border border-slate-200 shadow-sm" />
                    <button
                      onClick={() => setCustomImageData(null)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                      title="Remove image"
                    ><X className="w-3.5 h-3.5" /></button>
                    <p className="text-xs text-slate-500 mt-2">{Math.round(dataUrlBytes(customImageData) / 1024)} KB</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageProcessing}
                    className="w-full px-4 py-6 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl text-slate-500 hover:text-emerald-700 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                    {imageProcessing ? (
                      <>
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span className="text-sm font-bold">Resizing image…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-sm font-bold">Click to upload image</span>
                        <span className="text-xs text-slate-400">JPG, PNG, WebP — resized to max 1280px</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => {
                setShowCustomForm(false);
                setCustomImageData(null);
              }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={async () => {
                  if (!customTopicText.trim() && !customTitle.trim() && !customImageData) return;
                  const saved = await saveCustomSession({
                    title: customTitle,
                    prompt: customTopicText,
                    imageDataUrl: customImageData || undefined,
                  });
                  setActiveCustomId(saved.id);
                  setSaveToast('Prompt saved!');
                  setTimeout(() => setSaveToast(null), 2000);
                }}
                disabled={!customTopicText.trim() && !customTitle.trim() && !customImageData}
                className="px-4 py-3 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40"
                title="Save this prompt for later"
              >
                <BookmarkPlus className="w-4 h-4" /> Save
              </button>
              <button onClick={() => {
                if (!customTopicText.trim() && !customTitle.trim() && !customImageData) return;
                setShowCustomForm(false);
                setContent('');
                setLastSaved(null);
                setTopicIdx(-1);
                setView('editor');
              }} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black">Start Writing</button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
