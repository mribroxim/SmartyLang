import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronRight, Sparkles, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { playSound } from '../lib/audio';
import { getStoriesForLevel } from '../data/interactiveStories';
import type { Level } from '../lib/reading-logic';
import { cleanSpeechToken } from '../lib/reading-logic';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { FontSizeControl, fontScaleClasses } from '../components/FontSizeControl';
import { logActivity } from '../lib/activity-tracker';
import { PracticeHistory } from '../components/PracticeHistory';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { activityLangStamp } from '../lib/activityMeta';
import { tokenizeForLang, isRtlLang, getPronunciationProfile } from '../lib/pronunciationProfile';
import { ScreenShell, HubRow, seGrid2 } from '../components/ScreenShell';

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const PAGE_SIZE = 8;

export function InteractiveStory({ onBack, onAddVocab, onToggleVocab, savedVocab = {}, onShowModal }: any) {
  const addVocab = onAddVocab || onToggleVocab;
  const { contentLang } = useContentLang();
  const { t, tLevel } = useUiLang();
  const [view, setView] = useState<'levels' | 'library' | 'story'>('levels');
  const [level, setLevel] = useState<Level>('Intermediate');
  const [page, setPage] = useState(1);
  const [step, setStep] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const localStoryRef = useRef<any>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [search, setSearch] = useState('');
  const [lastStoryTitle, setLastStoryTitle] = useState<string | null>(() => {
    try {
      const cl = localStorage.getItem('smarty_content_lang') || 'en';
      const scoped = localStorage.getItem(`is_last_story_${cl}`);
      if (scoped) return scoped;
      if (cl === 'en') return localStorage.getItem('is_last_story');
      return null;
    } catch { return null; }
  });
  const [fontScale, setFontScale] = useState<number>(() => {
    try { return Number(localStorage.getItem('passage_font_scale')) || 3; } catch { return 3; }
  });
  useEffect(() => {
    try { localStorage.setItem('passage_font_scale', String(fontScale)); } catch {}
  }, [fontScale]);

  useEffect(() => {
    try {
      const scoped = localStorage.getItem(`is_last_story_${contentLang}`);
      setLastStoryTitle(scoped || (contentLang === 'en' ? localStorage.getItem('is_last_story') : null));
    } catch { setLastStoryTitle(null); }
  }, [contentLang]);

  // Async story data
  const [storyCounts, setStoryCounts] = useState<Record<string, number>>({});
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  // Preload story counts for level cards
  useEffect(() => {
    const counts: Record<string, number> = {};
    Promise.all(
      LEVELS.map(l => getStoriesForLevel(l).then(s => { counts[l] = s.length; }))
    ).then(() => setStoryCounts({ ...counts }));
  }, []);

  // Load stories when entering library view
  useEffect(() => {
    if (view !== 'library') return;
    setLoadingStories(true);
    getStoriesForLevel(level).then(s => {
      setAvailableStories(s);
      setLoadingStories(false);
    });
  }, [view, level]);

  const handleChoice = (choiceObj: any) => {
    const newHistory = [...history, { text: nodes[step].text, choice: choiceObj.label }];
    setHistory(newHistory);
    const localStory = localStoryRef.current;
    const recordCompletion = (reachedTerminalNode: boolean) => {
      try {
        const prev = JSON.parse(localStorage.getItem('is_completions_v1') || '[]');
        prev.push({
          title: storyTitle,
          level: level,
          timestamp: Date.now(),
          path: newHistory,
          details: newHistory.map((h, idx) => ({ step: idx + 1, passage: h.text, choice: h.choice })),
          ...activityLangStamp(contentLang),
        });
        localStorage.setItem('is_completions_v1', JSON.stringify(prev));
      } catch {}
      logActivity({
        type: 'interactive_story',
        title: storyTitle,
        level,
        details: newHistory.map((h, idx) => ({ step: idx + 1, passage: h.text, choice: h.choice })),
      });
    };
    if (localStory && choiceObj.nextNodeId && localStory.nodes[choiceObj.nextNodeId]) {
      const nextNode = localStory.nodes[choiceObj.nextNodeId];
      setNodes([...nodes, nextNode]);
      setStep(nodes.length);
      playSound('success');
      if (!nextNode.choices || nextNode.choices.length === 0) {
        recordCompletion(true);
      }
    } else {
      recordCompletion(false);
      alert('The story ends here. Start a new one!');
    }
  };

  const playWord = (word: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = word.replace(/[^\p{L}\p{M}'’-]/gu, '');
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  /* ── Levels ── */
  if (view === 'levels') {
    return (
      <ScreenShell title="Interactive Reading" subtitle={t('story.levelSubtitle')}>
        <div className={seGrid2}>
          {LEVELS.map((l) => (
            <HubRow
              key={l}
              icon={<BookOpen className="w-5 h-5" />}
              iconClass="bg-violet-50 text-violet-600"
              title={tLevel(l)}
              desc={t('story.count', { n: storyCounts[l] ?? 0 })}
              onClick={() => { setLevel(l); setPage(1); setView('library'); }}
            />
          ))}
        </div>
      </ScreenShell>
    );
  }

  /* ── Library ── */
  if (view === 'library') {
    if (loadingStories) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      );
    }

    const filtered = search.trim()
      ? availableStories.filter(s => s.topic?.toLowerCase().includes(search.toLowerCase()))
      : availableStories;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const lastStory = lastStoryTitle ? availableStories.find(s => s.topic === lastStoryTitle) : null;

    const startStory = (s: any) => {
      localStoryRef.current = s;
      const sn = s.nodes['start'] || Object.values(s.nodes)[0];
      setNodes([sn]);
      setStep(0);
      setHistory([]);
      setStoryTitle(s.topic);
      try {
        localStorage.setItem(`is_last_story_${contentLang}`, s.topic);
        localStorage.setItem('is_last_story', s.topic);
      } catch {}
      setLastStoryTitle(s.topic);
      setView('story');
      playSound('success');
    };

    return (
      <ScreenShell>
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => setView('levels')} className="text-[13px] font-semibold text-zinc-900 flex items-center gap-1 mb-1">
                <ArrowLeft className="w-4 h-4" /> {tLevel(level)}
              </button>
              <p className="text-[12px] text-slate-400">{t('library.title')}</p>
            </div>
            <div className="bg-slate-100 rounded-[10px] px-3 py-1.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stories</div>
              <div className="text-[14px] font-extrabold text-zinc-900">{availableStories.length}</div>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.searchStories')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/30 focus:border-zinc-700"
            />
          </div>

          {lastStory && (
            <div className="mb-3 p-3 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                <p className="font-bold text-slate-800 text-sm line-clamp-1">{lastStory.topic}</p>
              </div>
              <button onClick={() => startStory(lastStory)} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-colors shrink-0">{t('dash.continue')}</button>
            </div>
          )}

          {availableStories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No stories available for this level yet. Try another level.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pagedItems.map((s, i) => (
                <button key={s.id || i} type="button"
                  onClick={() => startStory(s)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-zinc-900 leading-snug mb-0.5">{s.topic}</div>
                    <div className="text-[12px] text-slate-400">Choose your own path</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-semibold text-slate-500">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <PracticeHistory
            storageKey="is_completions_v1"
            label="Past Stories"
            level={level}
          />
      </ScreenShell>
    );
  }

  /* ── Story Finished ── */
  if (!nodes[step] || !nodes[step].choices || nodes[step].choices.length === 0) {
    return (
      <div className="flex-grow overflow-y-auto w-full bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
          <button onClick={() => setView('library')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-8 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Stories
          </button>
          <div className="bg-white rounded-[2rem] p-6 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/50 text-center">
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Story Complete!</h2>
            <p className="text-slate-500 mb-10">You've reached the end of this adventure.</p>
            {nodes[step] && (
              <div className="text-lg font-serif text-slate-700 leading-relaxed mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left">
                {nodes[step].text}
              </div>
            )}
            <button onClick={() => setView('library')} className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
              Try Another Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Story Reading ── */
  return (
    <div className="flex-grow overflow-y-auto w-full bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <button onClick={() => setView('library')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Stories
          </button>
          <FontSizeControl value={fontScale} onChange={setFontScale} />
        </div>

        <div className="bg-white rounded-[2rem] p-6 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-8">
            <BookOpen className="w-3.5 h-3.5" /> {storyTitle}
          </div>

          <div
            dir={isRtlLang(contentLang) ? 'rtl' : 'ltr'}
            lang={contentLang}
            className={`font-serif text-slate-800 leading-[1.9] mb-4 transition-all duration-300 ${fontScaleClasses(fontScale)}`}
          >
            {(() => {
              const textWords = tokenizeForLang(nodes[step].text, contentLang);
              const gap = getPronunciationProfile(contentLang).tokenize === 'whitespace' ? 'me-2.5 mb-2' : 'me-0.5 mb-1';
              return textWords.map((word: string, i: number) => {
              const clean = cleanSpeechToken(word);
              const isSelected = selectedWord === clean && clean !== '';
              return (
                <span key={i} className={`cursor-pointer relative inline-block ${gap}`}
                  onClick={() => { if (clean) setSelectedWord(isSelected ? null : clean); }}>
                  {word}
                  {isSelected && (
                    <WordPopover word={clean} cleanWord={clean} savedVocab={savedVocab}
                      sentence={sentenceAroundWord(textWords, i, contentLang)}
                      onPlay={playWord}
                      onToggleVocab={(w) => addVocab?.(w, 'From interactive story')}
                      onShowModal={(w, mode) => { onShowModal(w, mode); setSelectedWord(null); }}
                      onClose={() => setSelectedWord(null)} />
                  )}
                </span>
              );
            });
            })()}
          </div>

          <p className="text-xs text-slate-400 mb-10 italic">Click any word to translate, listen, or add to vocabulary.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-5">{nodes[step].question}</h3>
            <div className="space-y-3">
              {nodes[step].choices.map((c: any, i: number) => (
                <button key={i} onClick={() => handleChoice(c)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group">
                  <span className="font-medium text-slate-700 group-hover:text-purple-900 transition-colors">{c.label}</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
