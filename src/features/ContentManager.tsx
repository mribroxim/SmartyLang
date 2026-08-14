/**
 * ContentManager — admin UI for editing all major content types in Firestore.
 * Rendered inside AdminPanel under the "Content" tab.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, PenLine, Mic, Loader2, CheckCircle2, Trash2, Plus,
  RotateCcw, Save, ChevronDown, Edit2, X, Code, AlertTriangle,
  Volume2, FileText, Headphones, BookMarked, BarChart2,
  EyeOff, Eye, ChevronRight, Languages,
} from 'lucide-react';
import {
  getCMSDocument, setCMSDocument, deleteCMSDocument,
  getIELTSTests, saveIELTSTest, updateIELTSTest, deleteIELTSTest,
  type CustomIELTSTestRecord,
  getIELTSListeningTests, saveIELTSListeningTest, updateIELTSListeningTest, deleteIELTSListeningTest,
  type CustomIELTSListeningTestRecord,
  getVocabMisses, markVocabMissReviewed, type VocabMissRecord,
} from '../firebase';
import { invalidateCMS }          from '../lib/useCMSContent';
import { TOPICS_BY_LEVEL, PRACTICE_LEVELS, type PracticeLevel } from '../data/practiceTopics';
import { SPEAKING_TOPICS_BY_LEVEL, type SpeakingLevel }         from '../data/speakingTopics';
import { TASK2_DATA, type Task2TypeData }                        from '../data/writingTask2';
import { TASK1_DATA, type Task1ChartType, type Task1Prompt }     from '../data/writingTask1';
import {
  PART1_TOPICS, PART2_CARDS, PART3_TOPICS,
  type Part1Topic, type Part2Card, type Part3Topic,
} from '../data/ieltsSpeakingData';
import { SHADOWING_PASSAGES, type ShadowingPassage, type ShadowingLevel } from '../data/shadowingPassages';
import { invalidateDictationCache, loadBuiltInSentences }               from '../data/audioDictation';
import { invalidateCompReadingCache, loadBuiltInReadingPassages }        from '../data/comprehensiveReading';
import { invalidateListeningCache, loadBuiltInListeningPassages }        from '../data/comprehensiveListening';
import { invalidateLevelTextsCache }                                     from '../data/levelTexts';
import { ieltsReadingTests, type IELTSTest }                            from '../data/ieltsReadingTests';
import { ieltsListeningTests }                                           from '../data/ieltsListeningTests';
import type { Level }                                                    from '../lib/reading-logic';
import {
  type ContentLang, cmsDocId, CONTENT_LANGS, CONTENT_LANG_LABEL,
} from '../lib/contentLang';
import { ScreenShell } from '../components/ScreenShell';

type SubTab =
  | 'writing' | 'speaking' | 'task2' | 'ielts-speaking' | 'ielts-reading'
  | 'task1' | 'ielts-p2' | 'ielts-p3'
  | 'shadowing' | 'dictation' | 'comp-reading' | 'comp-listening' | 'reading-texts'
  | 'ielts-listening' | 'vocab';

/** Active CMS language — set by ContentManager so nested editors namespace doc ids. */
let _cmsLang: ContentLang = 'en';
function activeCmsLang(): ContentLang { return _cmsLang; }
function cmsGet(base: string) { return getCMSDocument(cmsDocId(base, activeCmsLang())); }
function cmsSet(base: string, data: any) { return setCMSDocument(cmsDocId(base, activeCmsLang()), data); }
function cmsDel(base: string) { return deleteCMSDocument(cmsDocId(base, activeCmsLang())); }

const EMPTY_TOPICS: Record<string, string[]> = {
  'Beginner': [], 'Elementary': [], 'Pre-Intermediate': [], 'Intermediate': [], 'Advanced': [],
};

const EN_ONLY_SUBTABS = new Set<SubTab>([
  'ielts-speaking', 'ielts-p2', 'ielts-p3', 'ielts-reading', 'ielts-listening',
  'comp-listening', 'shadowing',
]);

// ── helpers ──────────────────────────────────────────────────────────────────

const LEVELS = PRACTICE_LEVELS as readonly string[];

const LEVEL_COLORS: Record<string, string> = {
  'Beginner':         'bg-emerald-50  text-emerald-700  border-emerald-200',
  'Elementary':       'bg-sky-50      text-sky-700      border-sky-200',
  'Pre-Intermediate': 'bg-indigo-50   text-indigo-700   border-indigo-200',
  'Intermediate':     'bg-violet-50   text-violet-700   border-violet-200',
  'Advanced':         'bg-rose-50     text-rose-700     border-rose-200',
};

// ── shared helpers ───────────────────────────────────────────────────────────

function ArchivedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
      <EyeOff className="w-2.5 h-2.5" /> Archived
    </span>
  );
}

function archiveBtn(isArchived: boolean, onClick: () => void) {
  return (
    <button
      onClick={onClick}
      title={isArchived ? 'Restore (show to students)' : 'Archive (hide from students)'}
      className={`p-1.5 rounded-lg transition-colors ${isArchived ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
    >
      {isArchived ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── StringListEditor ─────────────────────────────────────────────────────────

interface StringListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  rowLabel?: (idx: number) => string;
}

function StringListEditor({ items, onChange, placeholder = 'Add item…', rowLabel }: StringListEditorProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newText, setNewText] = useState('');

  const startEdit = (idx: number) => { setEditIdx(idx); setEditText(items[idx]); };
  const saveEdit  = () => {
    if (editIdx === null) return;
    const next = [...items];
    next[editIdx] = editText.trim();
    onChange(next.filter(Boolean));
    setEditIdx(null);
  };
  const del = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
    if (editIdx === idx) setEditIdx(null);
  };
  const add = () => {
    if (!newText.trim()) return;
    onChange([...items, newText.trim()]);
    setNewText('');
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className={`rounded-xl border transition-all ${editIdx === idx ? 'border-zinc-400 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
          {editIdx === idx ? (
            <div className="p-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full text-sm px-2 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button onClick={() => setEditIdx(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-3 py-2.5">
              <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5 w-6 text-right">{rowLabel ? rowLabel(idx) : idx + 1}.</span>
              <p className="flex-1 text-sm text-slate-800 leading-snug">{item}</p>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button onClick={() => startEdit(idx)} title="Edit" className="p-1 rounded-md text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(idx)} title="Delete" className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new item */}
      <div className="flex gap-2 mt-3">
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }}
          rows={2}
          placeholder={placeholder}
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-dashed border-slate-300 focus:outline-none focus:border-zinc-400 resize-none bg-slate-50"
        />
        <button
          onClick={add}
          disabled={!newText.trim()}
          className="self-end px-3 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}

// ── TopicsEditor (shared for Writing / Speaking) ─────────────────────────────

interface TopicsEditorProps {
  docId: string;
  defaultTopics: Record<string, string[]>;
  levels: readonly string[];
  label: string;
}

function TopicsEditor({ docId, defaultTopics, levels, label }: TopicsEditorProps) {
  const [level, setLevel] = useState<string>(levels[0]);
  const [allTopics, setAllTopics] = useState<Record<string, string[]>>(defaultTopics);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    setLoading(true);
    getCMSDocument(docId).then(data => {
      if (data?.levels) setAllTopics(prev => ({ ...prev, ...data.levels }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [docId]);

  const handleChange = (items: string[]) => {
    setAllTopics(prev => ({ ...prev, [level]: items }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await setCMSDocument(docId, { levels: allTopics });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes will appear on the next page load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(`Reset all ${label} topics to built-in defaults? This removes your Firestore overrides.`)) return;
    setSaving(true);
    try {
      await deleteCMSDocument(docId);
      setAllTopics(defaultTopics);
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Reset to defaults.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  const currentTopics = allTopics[level] ?? defaultTopics[level] ?? [];

  return (
    <div>
      {/* Level selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {levels.map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              level === l
                ? 'bg-zinc-900 text-white border-zinc-900 shadow'
                : `${LEVEL_COLORS[l] || 'bg-slate-50 text-slate-600 border-slate-200'} hover:opacity-80`
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">
          {currentTopics.length} topics · <span className="text-slate-400 font-normal">{level}</span>
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={reset} disabled={saving} title="Reset to defaults" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <StringListEditor
          items={currentTopics}
          onChange={handleChange}
          placeholder={`Add a new ${label.toLowerCase()} topic…`}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── Task2Editor ───────────────────────────────────────────────────────────────

function Task2Editor() {
  const [types, setTypes] = useState<Task2TypeData[]>(TASK2_DATA);
  const [selectedType, setSelectedType] = useState(TASK2_DATA[0].type);
  const [selectedCat, setSelectedCat] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('writingTask2').then(data => {
      if (data?.types?.length) setTypes(data.types);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const typeData = types.find(t => t.type === selectedType) ?? types[0];
  const typeIdx  = types.findIndex(t => t.type === selectedType);
  const category = typeData?.categories[selectedCat];

  const handlePromptsChange = (prompts: string[]) => {
    setTypes(prev => prev.map((t, ti) => ti !== typeIdx ? t : {
      ...t,
      categories: t.categories.map((c, ci) => ci !== selectedCat ? c : { ...c, prompts }),
    }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await cmsSet('writingTask2', { types });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes will appear on the next page load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset all Writing Task 2 prompts to built-in defaults?')) return;
    setSaving(true);
    try {
      await cmsDel('writingTask2');
      setTypes(TASK2_DATA);
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Reset to defaults.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* Essay type selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map(t => (
          <button
            key={t.type}
            onClick={() => { setSelectedType(t.type); setSelectedCat(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedType === t.type ? 'bg-zinc-900 text-white border-zinc-900 shadow' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category selector */}
      {typeData && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span>
          <div className="relative">
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(Number(e.target.value))}
              className="pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-zinc-900 bg-white focus:outline-none focus:border-zinc-400 appearance-none"
            >
              {typeData.categories.map((c, i) => (
                <option key={i} value={i}>{c.name} ({c.prompts.length})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
            <button onClick={reset} disabled={saving} title="Reset to defaults" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : category ? (
        <StringListEditor
          items={category.prompts}
          onChange={handlePromptsChange}
          placeholder="Add a new Task 2 essay prompt…"
        />
      ) : null}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── IELTSSpeakingEditor (Part 1) ─────────────────────────────────────────────

function IELTSSpeakingEditor() {
  const [topics, setTopics] = useState<Part1Topic[]>(PART1_TOPICS);
  const [selectedId, setSelectedId] = useState(PART1_TOPICS[0]?.id ?? '');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicIcon, setNewTopicIcon] = useState('📝');
  const [showNewTopic, setShowNewTopic] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('ieltsSpeakingPart1').then(data => {
      if (data?.topics?.length) setTopics(data.topics);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const topic    = topics.find(t => t.id === selectedId);
  const topicIdx = topics.findIndex(t => t.id === selectedId);
  const isArchived = !!(topic as any)?.archived;

  const handleQuestionsChange = (questions: string[]) => {
    setTopics(prev => prev.map((t, i) => i !== topicIdx ? t : { ...t, questions }));
    setDirty(true);
  };

  const toggleArchive = () => {
    setTopics(prev => prev.map((t, i) => i !== topicIdx ? t : { ...t, archived: !isArchived }));
    setDirty(true);
  };

  const addTopic = () => {
    if (!newTopicTitle.trim()) return;
    const id = `custom_${Date.now()}`;
    const newTopic: Part1Topic = { id, title: newTopicTitle.trim(), icon: newTopicIcon, questions: [] };
    setTopics(prev => [...prev, newTopic]);
    setSelectedId(id);
    setNewTopicTitle(''); setNewTopicIcon('📝'); setShowNewTopic(false);
    setDirty(true);
  };

  const deleteTopic = () => {
    if (!confirm(`Permanently delete topic "${topic?.title}"? This cannot be undone.`)) return;
    const remaining = topics.filter(t => t.id !== selectedId);
    setTopics(remaining);
    setSelectedId(remaining.find(t => !(t as any).archived)?.id ?? remaining[0]?.id ?? '');
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await cmsSet('ieltsSpeakingPart1', { topics });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes will appear on the next page load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset all IELTS Speaking Part 1 topics to built-in defaults?')) return;
    setSaving(true);
    try {
      await cmsDel('ieltsSpeakingPart1');
      setTopics(PART1_TOPICS);
      setSelectedId(PART1_TOPICS[0]?.id ?? '');
      invalidateCMS(); setDirty(false);
      showToast('Reset to defaults.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  const activeTopics   = topics.filter(t => !(t as any).archived);
  const archivedTopics = topics.filter(t => !!(t as any).archived);

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-zinc-900 bg-white focus:outline-none focus:border-zinc-400 appearance-none">
              <optgroup label="Active topics">
                {activeTopics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.title} ({t.questions.length}Q)</option>)}
              </optgroup>
              {archivedTopics.length > 0 && (
                <optgroup label="Archived topics">
                  {archivedTopics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.title} [archived]</option>)}
                </optgroup>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowNewTopic(s => !s)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Topic
          </button>
          {topic && archiveBtn(isArchived, toggleArchive)}
          {topic && (
            <button onClick={deleteTopic} title="Permanently delete" className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved</span>}
          <button onClick={reset} disabled={saving} title="Reset to defaults" className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {showNewTopic && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Part 1 Topic</p>
          <div className="flex gap-2">
            <input value={newTopicIcon} onChange={e => setNewTopicIcon(e.target.value)} maxLength={4}
              className="w-14 text-center px-2 py-2 rounded-xl border border-slate-200 text-lg focus:outline-none focus:border-zinc-400" placeholder="📝" />
            <input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)}
              placeholder="Topic title (e.g. Travel & Tourism)"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
            <button onClick={addTopic} disabled={!newTopicTitle.trim()}
              className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-zinc-700 transition-colors">Add</button>
            <button onClick={() => setShowNewTopic(false)} className="p-2 rounded-xl text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : topic ? (
        <div className={isArchived ? 'opacity-60' : ''}>
          {isArchived && <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200"><ArchivedBadge /><span className="text-xs text-amber-700">This topic is hidden from students. Restore it to make it visible again.</span></div>}
          <StringListEditor items={topic.questions} onChange={handleQuestionsChange} placeholder="Add a new interview question…" />
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400"><Mic className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p>No topic selected.</p></div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── IELTSReadingManager ──────────────────────────────────────────────────────

function IELTSReadingManager() {
  const [tests, setTests] = useState<CustomIELTSTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const emptyForm = { open: false, editId: null as string | null, title: '', json: '', saving: false, error: null as string | null, builtInOverrideIdx: null as number | null, status: 'draft' as 'draft' | 'published' };
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setTests(await getIELTSTests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TEMPLATE = JSON.stringify([{
    title: 'Passage 1 Title',
    paragraphs: [{ label: 'A', text: 'First paragraph text.' }, { label: 'B', text: 'Second paragraph text.' }],
    sections: [{
      instructions: 'Questions 1–5. Write TRUE, FALSE, or NOT GIVEN.',
      questionType: 'tfng', questionRange: [1, 5],
      questions: [{ number: 1, type: 'tfng', statement: 'Statement here.', answer: 'TRUE', explanation: 'Explanation.' }],
    }],
  }], null, 2);

  const openAdd = () => setForm({ ...emptyForm, open: true });
  const openEdit = (t: CustomIELTSTestRecord) => setForm({
    open: true, editId: t.firestoreId, title: t.title,
    json: JSON.stringify(t.passages, null, 2), saving: false, error: null, builtInOverrideIdx: t.builtInOverrideIndex ?? null,
    status: t.status ?? 'draft',
  });

  // Edit a built-in test — uses existing override if present, else seeds from built-in data
  const openEditBuiltIn = (idx: number) => {
    const override = tests.find(t => t.builtInOverrideIndex === idx && !t.archived);
    if (override) {
      setForm({ open: true, editId: override.firestoreId, title: override.title, json: JSON.stringify(override.passages, null, 2), saving: false, error: null, builtInOverrideIdx: idx, status: override.status ?? 'draft' });
    } else {
      const builtIn = ieltsReadingTests[idx];
      setForm({ open: true, editId: null, title: builtIn.title, json: JSON.stringify(builtIn.passages, null, 2), saving: false, error: null, builtInOverrideIdx: idx, status: 'draft' });
    }
  };

  const resetBuiltIn = async (idx: number) => {
    const override = tests.find(t => t.builtInOverrideIndex === idx);
    if (!override) return;
    if (!confirm(`Reset Built-in Test ${idx + 1} to its original content? The custom override will be deleted.`)) return;
    try {
      await deleteIELTSTest(override.firestoreId);
      await load();
      showToast('Reset to built-in test.');
    } catch { showToast('Delete failed.'); }
  };

  const onSave = async (status: 'draft' | 'published') => {
    setForm(f => ({ ...f, saving: true, error: null }));
    try {
      const passages = JSON.parse(form.json);
      if (!Array.isArray(passages) || passages.length === 0) throw new Error('Must be a non-empty JSON array of passages');
      if (form.editId) {
        await updateIELTSTest(form.editId, {
          title: form.title.trim(), passages, status,
          ...(form.builtInOverrideIdx !== null ? { builtInOverrideIndex: form.builtInOverrideIdx } : {}),
        });
      } else {
        await saveIELTSTest({
          title: form.title.trim(), passages, status,
          ...(form.builtInOverrideIdx !== null ? { builtInOverrideIndex: form.builtInOverrideIdx } : {}),
        });
      }
      showToast(status === 'published' ? 'Test published!' : 'Saved as draft.');
      await load();
      setForm(emptyForm);
    } catch (e: any) {
      setForm(f => ({ ...f, saving: false, error: e.message || 'Invalid JSON or save failed.' }));
    }
  };

  const onToggleStatus = async (t: CustomIELTSTestRecord) => {
    const newStatus = t.status === 'published' ? 'draft' : 'published';
    try {
      await updateIELTSTest(t.firestoreId, { status: newStatus });
      setTests(prev => prev.map(x => x.firestoreId === t.firestoreId ? { ...x, status: newStatus } : x));
      showToast(newStatus === 'published' ? 'Test published!' : 'Test set to draft.');
    } catch { showToast('Failed to update status.'); }
  };

  const onToggleArchive = async (t: CustomIELTSTestRecord) => {
    try {
      await updateIELTSTest(t.firestoreId, { archived: !t.archived });
      setTests(prev => prev.map(x => x.firestoreId === t.firestoreId ? { ...x, archived: !t.archived } : x));
      showToast(t.archived ? 'Test restored.' : 'Test archived.');
    } catch { showToast('Failed to update.'); }
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete test "${title}"? This cannot be undone.`)) return;
    try { await deleteIELTSTest(id); setTests(prev => prev.filter(t => t.firestoreId !== id)); showToast('Deleted.'); }
    catch { showToast('Delete failed.'); }
  };

  const activeTests        = tests.filter(t => !t.archived);
  const archivedTests      = tests.filter(t => t.archived);
  const activeCustomTests  = activeTests.filter(t => t.builtInOverrideIndex === undefined);
  const archivedCustomTests= archivedTests.filter(t => t.builtInOverrideIndex === undefined);

  const TestRow = ({ t, idx }: { t: CustomIELTSTestRecord; idx: number }) => (
    <div key={t.firestoreId} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${t.archived ? 'border-amber-200 opacity-70' : t.status === 'published' ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.archived ? 'bg-amber-50' : 'bg-zinc-100'}`}>
        <span className="font-black text-zinc-900">{idx}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-zinc-900 truncate">{t.title}</p>
          {t.archived && <ArchivedBadge />}
          {!t.archived && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              t.status === 'published'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {t.status === 'published' ? '✓ Published' : '⏸ Draft'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{t.passages?.length ?? 0} passages · {new Date(t.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!t.archived && (
          <>
            <button onClick={() => onToggleStatus(t)}
              title={t.status === 'published' ? 'Set to draft (hide from students)' : 'Publish (show to students)'}
              className={`p-2 rounded-lg transition-colors ${t.status === 'published' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}>
              {t.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => openEdit(t)} title="Edit test" className="p-2 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </>
        )}
        {archiveBtn(!!t.archived, () => onToggleArchive(t))}
        <button onClick={() => onDelete(t.firestoreId, t.title)} title="Permanently delete" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">Edit built-in tests or add custom ones. Custom tests appear as Tests 4, 5, …</p>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Built-in tests */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Built-in Tests</p>
            <div className="grid gap-3">
              {ieltsReadingTests.map((t, idx) => {
                const override = tests.find(x => x.builtInOverrideIndex === idx && !x.archived);
                return (
                  <div key={t.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${override ? 'border-emerald-200' : 'border-slate-200'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${override ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                      <span className="font-black text-zinc-900">{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-zinc-900 truncate">{override ? override.title : t.title}</p>
                        {override && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✎ Modified</span>}
                      </div>
                      <p className="text-xs text-slate-400">{(override ? override.passages : t.passages)?.length ?? 0} passages · {override ? 'Custom override active' : 'Built-in'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditBuiltIn(idx)} title="Edit this test" className="p-2 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {override && (
                        <button onClick={() => resetBuiltIn(idx)} title="Reset to built-in" className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom tests (exclude built-in overrides from this list) */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Tests</p>
          {activeCustomTests.length === 0 && archivedCustomTests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-500 text-sm">No custom tests yet</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeCustomTests.map((t, i) => <React.Fragment key={t.firestoreId}><TestRow t={t} idx={ieltsReadingTests.length + i + 1} /></React.Fragment>)}
            </div>
          )}
          {archivedCustomTests.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowArchived(s => !s)}
                className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived tests ({archivedCustomTests.length})
              </button>
              {showArchived && (
                <div className="grid gap-3">
                  {archivedCustomTests.map((t, i) => <React.Fragment key={t.firestoreId}><TestRow t={t} idx={activeCustomTests.length + i + ieltsReadingTests.length + 1} /></React.Fragment>)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-zinc-900">
                {form.builtInOverrideIdx !== null
                  ? `Edit Built-in Test ${form.builtInOverrideIdx + 1}`
                  : form.editId ? 'Edit Custom Test' : 'Add Custom Test'}
              </h3>
              <button onClick={() => setForm(emptyForm)} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Test Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Academic Reading Test 4"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Passages (JSON)</label>
                  <button onClick={() => setForm(f => ({ ...f, json: TEMPLATE, error: null }))} className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                    <Code className="w-3 h-3" /> Load template
                  </button>
                </div>
                <textarea value={form.json} onChange={e => setForm(f => ({ ...f, json: e.target.value, error: null }))}
                  rows={14} spellCheck={false} placeholder='Paste a JSON array of passages…'
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
                {form.error && <p className="mt-1.5 text-xs text-rose-600 font-semibold">⚠ {form.error}</p>}
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Types: <code className="font-mono bg-slate-100 px-1 rounded">tfng</code> · <code className="font-mono bg-slate-100 px-1 rounded">ynng</code> · <code className="font-mono bg-slate-100 px-1 rounded">mcq</code> · <code className="font-mono bg-slate-100 px-1 rounded">paragraph-match</code> · <code className="font-mono bg-slate-100 px-1 rounded">heading</code> · <code className="font-mono bg-slate-100 px-1 rounded">wordbank</code> · <code className="font-mono bg-slate-100 px-1 rounded">concept-match</code>
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <p className="text-xs text-slate-400">
                {form.editId ? `Editing${form.status === 'published' ? ' (currently published)' : ' (currently draft)'}` : 'New test'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setForm(emptyForm)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={() => onSave('draft')} disabled={form.saving || !form.title.trim() || !form.json.trim()}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save as Draft
                </button>
                <button onClick={() => onSave('published')} disabled={form.saving || !form.title.trim() || !form.json.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── IELTSListeningManager ─────────────────────────────────────────────────────

function IELTSListeningManager() {
  const [tests, setTests] = useState<CustomIELTSListeningTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const emptyForm = { open: false, editId: null as string | null, title: '', json: '', saving: false, error: null as string | null, builtInOverrideIdx: null as number | null, status: 'draft' as 'draft' | 'published' };
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setTests(await getIELTSListeningTests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const SECTION_TEMPLATE = JSON.stringify([{
    number: 1,
    title: 'Section Title',
    context: 'Brief scene-setter shown to the student before audio plays.',
    transcript: 'Full audio transcript here. Speaker A: ... Speaker B: ...',
    questionRange: [1, 10],
    instructions: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    questions: [
      { number: 1, type: 'fill', label: 'Name:', answer: 'Smith', explanation: 'Explanation of where the answer appears.' },
      { number: 2, type: 'mcq', stem: 'Which option is correct?', options: [{ label: 'A', text: 'Option A' }, { label: 'B', text: 'Option B' }, { label: 'C', text: 'Option C' }], answer: 'B', explanation: 'Explanation.' },
    ],
  }], null, 2);

  const openAdd = () => setForm({ ...emptyForm, open: true });
  const openEdit = (t: CustomIELTSListeningTestRecord) => setForm({
    open: true, editId: t.firestoreId, title: t.title,
    json: JSON.stringify(t.sections, null, 2), saving: false, error: null, builtInOverrideIdx: t.builtInOverrideIndex ?? null,
    status: t.status ?? 'draft',
  });

  const openEditBuiltIn = (idx: number) => {
    const override = tests.find(t => t.builtInOverrideIndex === idx && !t.archived);
    if (override) {
      setForm({ open: true, editId: override.firestoreId, title: override.title, json: JSON.stringify(override.sections, null, 2), saving: false, error: null, builtInOverrideIdx: idx, status: override.status ?? 'draft' });
    } else {
      const builtIn = ieltsListeningTests[idx];
      setForm({ open: true, editId: null, title: builtIn.title, json: JSON.stringify(builtIn.sections, null, 2), saving: false, error: null, builtInOverrideIdx: idx, status: 'draft' });
    }
  };

  const resetBuiltIn = async (idx: number) => {
    const override = tests.find(t => t.builtInOverrideIndex === idx);
    if (!override) return;
    if (!confirm(`Reset Built-in Test ${idx + 1} to its original content? The custom override will be deleted.`)) return;
    try {
      await deleteIELTSListeningTest(override.firestoreId);
      await load();
      showToast('Reset to built-in test.');
    } catch { showToast('Delete failed.'); }
  };

  const onSave = async (status: 'draft' | 'published') => {
    setForm(f => ({ ...f, saving: true, error: null }));
    try {
      const sections = JSON.parse(form.json);
      if (!Array.isArray(sections) || sections.length === 0) throw new Error('Must be a non-empty JSON array of sections');
      if (form.editId) {
        await updateIELTSListeningTest(form.editId, {
          title: form.title.trim(), sections, status,
          ...(form.builtInOverrideIdx !== null ? { builtInOverrideIndex: form.builtInOverrideIdx } : {}),
        });
      } else {
        await saveIELTSListeningTest({
          title: form.title.trim(), sections, status,
          ...(form.builtInOverrideIdx !== null ? { builtInOverrideIndex: form.builtInOverrideIdx } : {}),
        });
      }
      showToast(status === 'published' ? 'Test published!' : 'Saved as draft.');
      await load();
      setForm(emptyForm);
    } catch (e: any) {
      setForm(f => ({ ...f, saving: false, error: e.message || 'Invalid JSON or save failed.' }));
    }
  };

  const onToggleStatus = async (t: CustomIELTSListeningTestRecord) => {
    const newStatus = t.status === 'published' ? 'draft' : 'published';
    try {
      await updateIELTSListeningTest(t.firestoreId, { status: newStatus });
      setTests(prev => prev.map(x => x.firestoreId === t.firestoreId ? { ...x, status: newStatus } : x));
      showToast(newStatus === 'published' ? 'Test published!' : 'Test set to draft.');
    } catch { showToast('Failed to update status.'); }
  };

  const onToggleArchive = async (t: CustomIELTSListeningTestRecord) => {
    try {
      await updateIELTSListeningTest(t.firestoreId, { archived: !t.archived });
      setTests(prev => prev.map(x => x.firestoreId === t.firestoreId ? { ...x, archived: !t.archived } : x));
      showToast(t.archived ? 'Test restored.' : 'Test archived.');
    } catch { showToast('Failed to update.'); }
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete test "${title}"? This cannot be undone.`)) return;
    try { await deleteIELTSListeningTest(id); setTests(prev => prev.filter(t => t.firestoreId !== id)); showToast('Deleted.'); }
    catch { showToast('Delete failed.'); }
  };

  const activeTests        = tests.filter(t => !t.archived);
  const archivedTests      = tests.filter(t => t.archived);
  const activeCustomTests  = activeTests.filter(t => t.builtInOverrideIndex === undefined);
  const archivedCustomTests= archivedTests.filter(t => t.builtInOverrideIndex === undefined);

  const TestRow = ({ t, idx }: { t: CustomIELTSListeningTestRecord; idx: number }) => (
    <div key={t.firestoreId} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${t.archived ? 'border-amber-200 opacity-70' : t.status === 'published' ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.archived ? 'bg-amber-50' : 'bg-zinc-100'}`}>
        <span className="font-black text-zinc-900">{idx}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-zinc-900 truncate">{t.title}</p>
          {t.archived && <ArchivedBadge />}
          {!t.archived && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              t.status === 'published'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {t.status === 'published' ? '✓ Published' : '⏸ Draft'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{t.sections?.length ?? 0} sections · {new Date(t.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!t.archived && (
          <>
            <button onClick={() => onToggleStatus(t)}
              title={t.status === 'published' ? 'Set to draft (hide from students)' : 'Publish (show to students)'}
              className={`p-2 rounded-lg transition-colors ${t.status === 'published' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}>
              {t.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => openEdit(t)} title="Edit test" className="p-2 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </>
        )}
        {archiveBtn(!!t.archived, () => onToggleArchive(t))}
        <button onClick={() => onDelete(t.firestoreId, t.title)} title="Permanently delete" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">Edit built-in tests or add custom ones. Custom tests appear as Tests 3, 4, …</p>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Built-in tests */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Built-in Tests</p>
            <div className="grid gap-3">
              {ieltsListeningTests.map((t, idx) => {
                const override = tests.find(x => x.builtInOverrideIndex === idx && !x.archived);
                return (
                  <div key={t.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${override ? 'border-emerald-200' : 'border-slate-200'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${override ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                      <span className="font-black text-zinc-900">{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-zinc-900 truncate">{override ? override.title : t.title}</p>
                        {override && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✎ Modified</span>}
                      </div>
                      <p className="text-xs text-slate-400">{(override ? override.sections : t.sections)?.length ?? 0} sections · {override ? 'Custom override active' : 'Built-in'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditBuiltIn(idx)} title="Edit this test" className="p-2 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {override && (
                        <button onClick={() => resetBuiltIn(idx)} title="Reset to built-in" className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom tests */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Tests</p>
          {activeCustomTests.length === 0 && archivedCustomTests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Headphones className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-500 text-sm">No custom tests yet</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeCustomTests.map((t, i) => <React.Fragment key={t.firestoreId}><TestRow t={t} idx={ieltsListeningTests.length + i + 1} /></React.Fragment>)}
            </div>
          )}
          {archivedCustomTests.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowArchived(s => !s)}
                className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived tests ({archivedCustomTests.length})
              </button>
              {showArchived && (
                <div className="grid gap-3">
                  {archivedCustomTests.map((t, i) => <React.Fragment key={t.firestoreId}><TestRow t={t} idx={activeCustomTests.length + i + ieltsListeningTests.length + 1} /></React.Fragment>)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-zinc-900">
                {form.builtInOverrideIdx !== null
                  ? `Edit Built-in Test ${form.builtInOverrideIdx + 1}`
                  : form.editId ? 'Edit Custom Test' : 'Add Custom Test'}
              </h3>
              <button onClick={() => setForm(emptyForm)} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Test Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. IELTS Listening Test 3"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sections (JSON)</label>
                  <button onClick={() => setForm(f => ({ ...f, json: SECTION_TEMPLATE, error: null }))} className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                    <Code className="w-3 h-3" /> Load template
                  </button>
                </div>
                <textarea value={form.json} onChange={e => setForm(f => ({ ...f, json: e.target.value, error: null }))}
                  rows={14} spellCheck={false} placeholder='Paste a JSON array of sections…'
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
                {form.error && <p className="mt-1.5 text-xs text-rose-600 font-semibold">⚠ {form.error}</p>}
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Question types: <code className="font-mono bg-slate-100 px-1 rounded">fill</code> · <code className="font-mono bg-slate-100 px-1 rounded">mcq</code> · <code className="font-mono bg-slate-100 px-1 rounded">match</code>
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <p className="text-xs text-slate-400">
                {form.editId ? `Editing${form.status === 'published' ? ' (currently published)' : ' (currently draft)'}` : 'New test'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setForm(emptyForm)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={() => onSave('draft')} disabled={form.saving || !form.title.trim() || !form.json.trim()}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save as Draft
                </button>
                <button onClick={() => onSave('published')} disabled={form.saving || !form.title.trim() || !form.json.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── Task1Editor ───────────────────────────────────────────────────────────────

const CHART_TYPE_LABELS: Record<Task1ChartType, string> = {
  table: 'Table', bar: 'Bar Chart', line: 'Line Chart',
  pie: 'Pie Chart', map: 'Map', process: 'Process Diagram',
};

interface Task1CustomDoc {
  byType: Record<string, Task1Prompt[]>;
}

function Task1Editor() {
  const [customByType, setCustomByType] = useState<Record<string, Task1Prompt[]>>({});
  const [chartType, setChartType] = useState<Task1ChartType>('table');
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [dirty, setDirty]      = useState(false);
  const [toast, setToast]      = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx]   = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const emptyForm = { title: '', instruction: '', chartJson: '', error: '' };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('customTask1Prompts').then((doc: Task1CustomDoc | null) => {
      if (doc?.byType) setCustomByType(doc.byType);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const builtInCount  = TASK1_DATA.find(d => d.type === chartType)?.prompts.length ?? 0;
  const customForType = customByType[chartType] ?? [];

  const openAdd = () => { setEditIdx(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (idx: number) => {
    const p = customForType[idx];
    setEditIdx(idx);
    setForm({ title: p.title, instruction: p.instruction, chartJson: p.chartData ? JSON.stringify(p.chartData, null, 2) : '', error: '' });
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditIdx(null); setForm(emptyForm); };

  const submitPrompt = () => {
    if (!form.title.trim() || !form.instruction.trim()) {
      setForm(f => ({ ...f, error: 'Title and instruction are required.' })); return;
    }
    let chartData: any = { type: chartType };
    if (form.chartJson.trim()) {
      try { chartData = JSON.parse(form.chartJson); }
      catch { setForm(f => ({ ...f, error: 'Invalid JSON for chart data.' })); return; }
    }
    const prompt: Task1Prompt = { title: form.title.trim(), instruction: form.instruction.trim(), chartData };
    setCustomByType(prev => {
      const list = [...(prev[chartType] ?? [])];
      if (editIdx !== null) { list[editIdx] = prompt; } else { list.push(prompt); }
      return { ...prev, [chartType]: list };
    });
    cancelForm();
    setDirty(true);
  };

  const toggleArchive = (idx: number) => {
    setCustomByType(prev => {
      const list = [...(prev[chartType] ?? [])];
      list[idx] = { ...list[idx], archived: !(list[idx] as any).archived } as any;
      return { ...prev, [chartType]: list };
    });
    setDirty(true);
  };

  const deletePrompt = (idx: number) => {
    if (!confirm('Permanently delete this prompt?')) return;
    setCustomByType(prev => {
      const list = [...(prev[chartType] ?? [])];
      list.splice(idx, 1);
      return { ...prev, [chartType]: list };
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await cmsSet('customTask1Prompts', { byType: customByType });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Refresh the page to see changes.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Remove all custom Task 1 prompts? Built-in prompts are unaffected.')) return;
    setSaving(true);
    try {
      await cmsDel('customTask1Prompts');
      setCustomByType({});
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Custom prompts removed.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Add custom prompts to any chart type. Built-in prompts are not editable but custom ones appear alongside them.</p>

      {/* Chart type selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(CHART_TYPE_LABELS) as Task1ChartType[]).map(ct => (
          <button key={ct} onClick={() => setChartType(ct)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${chartType === ct ? 'bg-zinc-900 text-white border-zinc-900 shadow' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {CHART_TYPE_LABELS[ct]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-zinc-900">{builtInCount}</span> built-in ·{' '}
          <span className="font-semibold text-zinc-900">{customForType.length}</span> custom
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={reset} disabled={saving} title="Remove all custom prompts" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Active prompts */}
          {customForType.filter(p => !(p as any).archived).length === 0 && (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 mb-4">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No custom prompts yet for {CHART_TYPE_LABELS[chartType]}.</p>
            </div>
          )}
          <div className="space-y-2 mb-4">
            {customForType.map((p, i) => !(p as any).archived && (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.instruction}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(i)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => toggleArchive(i))}
                  <button onClick={() => deletePrompt(i)} title="Delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived prompts */}
          {customForType.some(p => (p as any).archived) && (
            <div className="mb-4">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived prompts ({customForType.filter(p => (p as any).archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {customForType.map((p, i) => (p as any).archived && (
                    <div key={i} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.instruction}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => toggleArchive(i))}
                        <button onClick={() => deletePrompt(i)} title="Permanently delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add / Edit form */}
          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? 'Edit' : 'New'} {CHART_TYPE_LABELS[chartType]} Prompt</p>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, error: '' }))}
                placeholder="Prompt title (e.g. Coffee Consumption by Country 2023)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <textarea value={form.instruction} onChange={e => setForm(f => ({ ...f, instruction: e.target.value, error: '' }))}
                rows={3} placeholder="Instruction text shown to the student…"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Chart Data (JSON) <span className="font-normal text-slate-400">— optional</span></p>
                <textarea value={form.chartJson} onChange={e => setForm(f => ({ ...f, chartJson: e.target.value, error: '' }))}
                  rows={6} spellCheck={false} placeholder={'{"type":"bar","unit":"kg","groups":["2020","2021"],"series":[{"name":"UK","color":"#3b82f6","values":[45,52]}]}'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
              </div>
              {form.error && <p className="text-xs text-rose-600 font-semibold">⚠ {form.error}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={cancelForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={submitPrompt} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? 'Update Prompt' : 'Add Prompt'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Custom Prompt
            </button>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── IELTSPart2Editor ──────────────────────────────────────────────────────────

function IELTSPart2Editor() {
  const [cards, setCards]          = useState<Part2Card[]>(PART2_CARDS);
  const [selectedId, setSelectedId] = useState(PART2_CARDS[0]?.id ?? '');
  const [loading, setLoading]      = useState(true);
  const [dirty, setDirty]          = useState(false);
  const [saving, setSaving]        = useState(false);
  const [toast, setToast]          = useState<string | null>(null);
  const [showNew, setShowNew]      = useState(false);
  const [newForm, setNewForm] = useState({ title: '', prompt: '', followUp: '', part3Id: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('ieltsSpeakingPart2').then(data => {
      if (data?.cards?.length) setCards(data.cards);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const card = cards.find(c => c.id === selectedId);
  const cardIdx = cards.findIndex(c => c.id === selectedId);
  const isArchived = !!(card as any)?.archived;

  const updateField = <K extends keyof Part2Card>(field: K, value: Part2Card[K]) => {
    setCards(prev => prev.map((c, i) => i !== cardIdx ? c : { ...c, [field]: value }));
    setDirty(true);
  };

  const toggleArchive = () => {
    setCards(prev => prev.map((c, i) => i !== cardIdx ? c : { ...c, archived: !isArchived } as any));
    setDirty(true);
  };

  const addCard = () => {
    if (!newForm.title.trim() || !newForm.prompt.trim()) return;
    const id = `p2_custom_${Date.now()}`;
    const nc: Part2Card = {
      id,
      title: newForm.title.trim(),
      prompt: newForm.prompt.trim(),
      bullets: [],
      followUp: newForm.followUp.trim(),
      part3Id: newForm.part3Id.trim() || '',
    };
    setCards(prev => [...prev, nc]);
    setSelectedId(id);
    setNewForm({ title: '', prompt: '', followUp: '', part3Id: '' });
    setShowNew(false);
    setDirty(true);
  };

  const deleteCard = () => {
    if (!confirm(`Permanently delete card "${card?.title}"? This cannot be undone.`)) return;
    const rest = cards.filter(c => c.id !== selectedId);
    setCards(rest);
    setSelectedId(rest.find(c => !(c as any).archived)?.id ?? rest[0]?.id ?? '');
    setDirty(true);
  };

  const activeCards   = cards.filter(c => !(c as any).archived);
  const archivedCards = cards.filter(c => !!(c as any).archived);

  const save = async () => {
    setSaving(true);
    try {
      await cmsSet('ieltsSpeakingPart2', { cards });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes appear on next page load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset IELTS Speaking Part 2 cards to built-in defaults?')) return;
    setSaving(true);
    try {
      await cmsDel('ieltsSpeakingPart2');
      setCards(PART2_CARDS);
      setSelectedId(PART2_CARDS[0]?.id ?? '');
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Reset to defaults.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-zinc-900 bg-white focus:outline-none focus:border-zinc-400 appearance-none">
              <optgroup label="Active cards">
                {activeCards.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </optgroup>
              {archivedCards.length > 0 && (
                <optgroup label="Archived cards">
                  {archivedCards.map(c => <option key={c.id} value={c.id}>{c.title} [archived]</option>)}
                </optgroup>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowNew(s => !s)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Card
          </button>
          {card && archiveBtn(isArchived, toggleArchive)}
          {card && <button onClick={deleteCard} title="Permanently delete" className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved</span>}
          <button onClick={reset} disabled={saving} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {showNew && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Part 2 Cue Card</p>
          <input value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Card title (e.g. A Favourite Season)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          <textarea value={newForm.prompt} onChange={e => setNewForm(f => ({ ...f, prompt: e.target.value }))}
            rows={2} placeholder="Describe a… (main cue card instruction)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
          <input value={newForm.followUp} onChange={e => setNewForm(f => ({ ...f, followUp: e.target.value }))}
            placeholder="Follow-up statement (e.g. And explain why you enjoy it.)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          <input value={newForm.part3Id} onChange={e => setNewForm(f => ({ ...f, part3Id: e.target.value }))}
            placeholder="Part 3 topic ID to link (optional, e.g. p3_seasons)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={addCard} disabled={!newForm.title.trim() || !newForm.prompt.trim()}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold disabled:opacity-40 hover:bg-zinc-700 transition-colors">Add</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : card ? (
        <div className={`space-y-4 ${isArchived ? 'opacity-60' : ''}`}>
          {isArchived && <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200"><ArchivedBadge /><span className="text-xs text-amber-700">This card is hidden from students. Restore it to make it visible again.</span></div>}
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
            <input value={card.title} onChange={e => updateField('title', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          </div>
          {/* Prompt */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cue Card Prompt</label>
            <textarea value={card.prompt} onChange={e => updateField('prompt', e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
          </div>
          {/* Bullets */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bullet Points (talking guides)</label>
            <StringListEditor items={card.bullets} onChange={bullets => updateField('bullets', bullets)}
              placeholder="Add a bullet point…" />
          </div>
          {/* Follow-up */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Follow-up Statement</label>
            <input value={card.followUp} onChange={e => updateField('followUp', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          </div>
          {/* Part 3 ID */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Linked Part 3 Topic ID</label>
            <input value={card.part3Id} onChange={e => updateField('part3Id', e.target.value)}
              placeholder="e.g. p3_inspiration"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-zinc-400" />
          </div>
        </div>
      ) : null}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── IELTSPart3Editor ──────────────────────────────────────────────────────────

function IELTSPart3Editor() {
  const [topics, setTopics]         = useState<Part3Topic[]>(PART3_TOPICS);
  const [selectedId, setSelectedId]  = useState(PART3_TOPICS[0]?.id ?? '');
  const [loading, setLoading]       = useState(true);
  const [dirty, setDirty]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);
  const [newForm, setNewForm] = useState({ id: '', cardId: '', cardTitle: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('ieltsSpeakingPart3').then(data => {
      if (data?.topics?.length) setTopics(data.topics);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const topic = topics.find(t => t.id === selectedId);
  const topicIdx = topics.findIndex(t => t.id === selectedId);
  const p3IsArchived = !!(topic as any)?.archived;

  const updateQuestions = (questions: string[]) => {
    setTopics(prev => prev.map((t, i) => i !== topicIdx ? t : { ...t, questions }));
    setDirty(true);
  };

  const toggleP3Archive = () => {
    setTopics(prev => prev.map((t, i) => i !== topicIdx ? t : { ...t, archived: !p3IsArchived } as any));
    setDirty(true);
  };

  const addTopic = () => {
    if (!newForm.cardTitle.trim()) return;
    const id = newForm.id.trim() || `p3_custom_${Date.now()}`;
    const nt: Part3Topic = { id, cardId: newForm.cardId.trim(), cardTitle: newForm.cardTitle.trim(), questions: [] };
    setTopics(prev => [...prev, nt]);
    setSelectedId(id);
    setNewForm({ id: '', cardId: '', cardTitle: '' });
    setShowNew(false);
    setDirty(true);
  };

  const deleteTopic = () => {
    if (!confirm(`Permanently delete Part 3 topic "${topic?.cardTitle}"? This cannot be undone.`)) return;
    const rest = topics.filter(t => t.id !== selectedId);
    setTopics(rest);
    setSelectedId(rest.find(t => !(t as any).archived)?.id ?? rest[0]?.id ?? '');
    setDirty(true);
  };

  const activeP3Topics   = topics.filter(t => !(t as any).archived);
  const archivedP3Topics = topics.filter(t => !!(t as any).archived);

  const save = async () => {
    setSaving(true);
    try {
      await cmsSet('ieltsSpeakingPart3', { topics });
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes appear on next page load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset IELTS Speaking Part 3 topics to built-in defaults?')) return;
    setSaving(true);
    try {
      await cmsDel('ieltsSpeakingPart3');
      setTopics(PART3_TOPICS);
      setSelectedId(PART3_TOPICS[0]?.id ?? '');
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Reset to defaults.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-zinc-900 bg-white focus:outline-none focus:border-zinc-400 appearance-none">
              <optgroup label="Active topics">
                {activeP3Topics.map(t => <option key={t.id} value={t.id}>{t.cardTitle} ({t.questions.length}Q)</option>)}
              </optgroup>
              {archivedP3Topics.length > 0 && (
                <optgroup label="Archived topics">
                  {archivedP3Topics.map(t => <option key={t.id} value={t.id}>{t.cardTitle} [archived]</option>)}
                </optgroup>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowNew(s => !s)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Topic Set
          </button>
          {topic && archiveBtn(p3IsArchived, toggleP3Archive)}
          {topic && <button onClick={deleteTopic} title="Permanently delete" className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved</span>}
          <button onClick={reset} disabled={saving} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {showNew && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Part 3 Topic Set</p>
          <input value={newForm.cardTitle} onChange={e => setNewForm(f => ({ ...f, cardTitle: e.target.value }))}
            placeholder="Topic name (e.g. Seasons & Climate)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
          <input value={newForm.cardId} onChange={e => setNewForm(f => ({ ...f, cardId: e.target.value }))}
            placeholder="Linked Part 2 card ID (optional, e.g. p2_season)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-zinc-400" />
          <input value={newForm.id} onChange={e => setNewForm(f => ({ ...f, id: e.target.value }))}
            placeholder="Topic ID (optional, auto-generated if blank)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-zinc-400" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={addTopic} disabled={!newForm.cardTitle.trim()}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold disabled:opacity-40 hover:bg-zinc-700 transition-colors">Add</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : topic ? (
        <div className={p3IsArchived ? 'opacity-60' : ''}>
          {p3IsArchived && <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200"><ArchivedBadge /><span className="text-xs text-amber-700">This topic set is hidden from students. Restore it to make it visible again.</span></div>}
          <StringListEditor items={topic.questions} onChange={updateQuestions}
            placeholder="Add a Part 3 discussion question…" />
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400"><Mic className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p>No topic selected.</p></div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── ShadowingEditor ───────────────────────────────────────────────────────────

const SHADOWING_LEVELS: ShadowingLevel[] = ['beginner', 'intermediate', 'advanced'];

function ShadowingEditor() {
  const [passages, setPassages]    = useState<ShadowingPassage[]>([]);
  const [loading, setLoading]      = useState(true);
  const [saving, setSaving]        = useState(false);
  const [dirty, setDirty]          = useState(false);
  const [cmsDoc, setCmsDoc]        = useState<any | null>(null);
  const [toast, setToast]          = useState<string | null>(null);
  const [showForm, setShowForm]    = useState(false);
  const [editIdx, setEditIdx]      = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const emptyForm = { title: '', level: 'intermediate' as ShadowingLevel, topic: 'Listening Practice', audioSrc: '', text: '' };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    cmsGet('customShadowing').then(data => {
      const doc = data ?? {};
      setCmsDoc(doc);
      if (doc.allPassages !== undefined) {
        setPassages(doc.allPassages as ShadowingPassage[]);
      } else {
        const custom = (doc.passages ?? []) as ShadowingPassage[];
        setPassages([...SHADOWING_PASSAGES, ...custom]);
      }
      setLoading(false);
    }).catch(() => {
      setCmsDoc({});
      setPassages([...SHADOWING_PASSAGES]);
      setLoading(false);
    });
  }, []);

  const openAdd = () => { setEditIdx(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (idx: number) => {
    const p = passages[idx];
    setEditIdx(idx);
    setForm({ title: p.title, level: p.level, topic: p.topic, audioSrc: p.audioSrc, text: p.text });
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditIdx(null); };

  const submitForm = () => {
    if (!form.title.trim() || !form.text.trim()) return;
    const p: ShadowingPassage = {
      id: editIdx !== null ? passages[editIdx].id : `custom_${Date.now()}`,
      title: form.title.trim(), level: form.level, topic: form.topic.trim(),
      audioSrc: form.audioSrc.trim(), text: form.text.trim(),
    };
    setPassages(prev => {
      if (editIdx !== null) { const n = [...prev]; n[editIdx] = p; return n; }
      return [...prev, p];
    });
    setShowForm(false); setEditIdx(null); setDirty(true);
  };

  const toggleShadowArchive = (idx: number) => {
    setPassages(prev => prev.map((p, i) => i !== idx ? p : { ...p, archived: !(p as any).archived } as any));
    setDirty(true);
  };

  const deletePassage = (idx: number) => {
    if (!confirm('Permanently delete this shadowing passage? This cannot be undone.')) return;
    setPassages(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), allPassages: passages };
      await cmsSet('customShadowing', newDoc);
      setCmsDoc(newDoc);
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Saved!');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset all shadowing passages to built-in defaults? All edits and custom additions will be removed.')) return;
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}) };
      delete newDoc.allPassages;
      await cmsSet('customShadowing', newDoc);
      setCmsDoc(newDoc);
      const remaining = (newDoc.passages ?? []) as ShadowingPassage[];
      setPassages([...SHADOWING_PASSAGES, ...remaining]);
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast('Reset to built-in passages.');
    } catch { showToast('Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Edit all shadowing passages — both built-in and custom. Changes are saved as a full override of the passage list.</p>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600"><span className="font-semibold text-zinc-900">{passages.filter(p => !(p as any).archived).length}</span> active · <span className="font-semibold text-zinc-900">{passages.filter(p => !!(p as any).archived).length}</span> archived</p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={reset} disabled={saving} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Active passages */}
          <div className="space-y-2 mb-3">
            {passages.map((p, i) => !(p as any).archived && (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' : p.level === 'intermediate' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>{p.level}</span>
                    {p.audioSrc && <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{p.text.substring(0, 80)}…</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(i)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => toggleShadowArchive(i))}
                  <button onClick={() => deletePassage(i)} title="Delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived passages */}
          {passages.some(p => (p as any).archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived passages ({passages.filter(p => (p as any).archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {passages.map((p, i) => (p as any).archived && (
                    <div key={p.id} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{p.text.substring(0, 80)}…</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => toggleShadowArchive(i))}
                        <button onClick={() => deletePassage(i)} title="Permanently delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? 'Edit' : 'New'} Shadowing Passage</p>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Passage title" className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
                <div className="relative">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as ShadowingLevel }))}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-zinc-400 appearance-none">
                    {SHADOWING_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Topic tag (e.g. Motivation)" className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <input value={form.audioSrc} onChange={e => setForm(f => ({ ...f, audioSrc: e.target.value }))}
                placeholder="Audio URL (optional — https://… or /data/shadowing/…/audio.mp3)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                rows={5} placeholder="Full transcript text…"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={submitForm} disabled={!form.title.trim() || !form.text.trim()}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold disabled:opacity-40 hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? 'Update' : 'Add Passage'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Custom Passage
            </button>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── DictationEditor ───────────────────────────────────────────────────────────

function DictationEditor() {
  const [sentences, setSentences] = useState<string[]>([]); // ALL sentences for current level
  const [level, setLevel]         = useState<string>(LEVELS[0]);
  const [cmsDoc, setCmsDoc]       = useState<any | null>(null); // null = loading
  const [levelLoading, setLevelLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Load Firestore doc once on mount
  useEffect(() => {
    cmsGet('customDictation').then(doc => setCmsDoc(doc ?? {})).catch(() => setCmsDoc({}));
  }, []);

  // When level changes or doc loads, rebuild the sentence list
  useEffect(() => {
    if (cmsDoc === null) return;
    setLevelLoading(true);
    setDirty(false);
    loadBuiltInSentences(level as Level, activeCmsLang()).then(builtIn => {
      if (cmsDoc.override?.[level] !== undefined) {
        setSentences(cmsDoc.override[level] as string[]);
      } else {
        const custom = (cmsDoc.levels?.[level] ?? []).filter(Boolean) as string[];
        setSentences([...builtIn, ...custom]);
      }
      setLevelLoading(false);
    });
  }, [level, cmsDoc]);

  const save = async () => {
    setSaving(true);
    try {
      const newDoc = { ...cmsDoc, override: { ...(cmsDoc?.override ?? {}), [level]: sentences } };
      await cmsSet('customDictation', newDoc);
      setCmsDoc(newDoc);
      invalidateDictationCache();
      setDirty(false);
      showToast('Saved! Changes appear on next dictation load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(`Reset "${level}" dictation sentences back to built-in defaults?`)) return;
    setSaving(true);
    try {
      const newDoc = { ...cmsDoc, override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await cmsSet('customDictation', newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateDictationCache();
      setDirty(false);
      showToast('Reset to built-in sentences.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Edit all dictation sentences per level — both built-in and custom. Changes are saved and override the built-in set for that level.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${level === l ? 'bg-zinc-900 text-white border-zinc-900 shadow' : `${LEVEL_COLORS[l] || 'bg-slate-50 text-slate-600 border-slate-200'} hover:opacity-80`}`}>
            {l}
            {cmsDoc?.override?.[l] !== undefined && <span className="ml-1 text-[9px] font-black text-emerald-600">✎</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">
          {sentences.length} sentences · <span className="text-slate-400 font-normal">{level}</span>
          {cmsDoc?.override?.[level] !== undefined && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Custom override active</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={resetLevel} disabled={saving} title="Reset this level to built-in sentences" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>
      {levelLoading || cmsDoc === null ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <StringListEditor
          items={sentences}
          onChange={items => { setSentences(items); setDirty(true); }}
          placeholder="Add a new dictation sentence…"
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── PassageWithQuestionsEditor (shared for Comp Reading & Comp Listening) ─────

interface SimplePassage {
  title: string;
  passage: string;
  level: string;
  questionsJson: string; // JSON array of {text, options: string[], answer: number}
}

interface PassageEditorProps {
  docId: string;
  label: string;
  placeholder: string;
  invalidateCache: () => void;
  loadBuiltIn: (level: Level) => Promise<any[]>;
}

function PassageWithQuestionsEditor({ docId, label, placeholder, invalidateCache, loadBuiltIn }: PassageEditorProps) {
  const [cmsDoc, setCmsDoc]       = useState<any | null>(null); // null = loading
  const [byLevel, setByLevel]     = useState<Record<string, any[]>>({});
  const [level, setLevel]         = useState(LEVELS[0]);
  const [levelLoading, setLevelLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editIdx, setEditIdx]     = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<SimplePassage>({ title: '', passage: '', level: LEVELS[0], questionsJson: '' });
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Load CMS doc once on mount
  useEffect(() => {
    setCmsDoc(null);
    setByLevel({});
    getCMSDocument(docId).then(doc => setCmsDoc(doc ?? {})).catch(() => setCmsDoc({}));
  }, [docId]);

  // On level change or doc load: rebuild passage list for this level
  useEffect(() => {
    if (cmsDoc === null) return;
    setLevelLoading(true);
    setDirty(false);
    loadBuiltIn(level as Level).then(builtIn => {
      if (cmsDoc.override?.[level] !== undefined) {
        setByLevel(prev => ({ ...prev, [level]: cmsDoc.override[level] as any[] }));
      } else {
        const custom = (cmsDoc.byLevel?.[level] ?? []).filter((p: any) => p);
        setByLevel(prev => ({ ...prev, [level]: [...builtIn, ...custom] }));
      }
      setLevelLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, cmsDoc]);

  const currentPassages = byLevel[level] ?? [];
  const overrideActive  = cmsDoc?.override?.[level] !== undefined;

  const TEMPLATE = JSON.stringify([
    { text: 'What is the main topic?', options: ['A', 'B', 'C', 'D'], answer: 0 },
    { text: 'According to the passage…', options: ['A', 'B', 'C', 'D'], answer: 1 },
  ], null, 2);

  const openAdd = () => {
    setEditIdx(null);
    setForm({ title: '', passage: '', level, questionsJson: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (idx: number) => {
    const p = currentPassages[idx];
    setEditIdx(idx);
    setForm({
      title: p.title ?? '',
      passage: p.passage ?? '',
      level: p.level ?? level,
      questionsJson: p.questions?.length ? JSON.stringify(p.questions, null, 2) : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const cancelPassageForm = () => { setShowForm(false); setEditIdx(null); setFormError(''); };

  const submitPassage = () => {
    if (!form.title.trim() || !form.passage.trim()) { setFormError('Title and passage text are required.'); return; }
    let questions: any[] = [];
    if (form.questionsJson.trim()) {
      try { questions = JSON.parse(form.questionsJson); }
      catch { setFormError('Invalid JSON for questions.'); return; }
    }
    const entry = { title: form.title.trim(), passage: form.passage.trim(), level: form.level, questions };
    if (editIdx !== null) {
      setByLevel(prev => {
        const list = [...(prev[level] ?? [])];
        list[editIdx] = { ...list[editIdx], ...entry };
        return { ...prev, [level]: list };
      });
    } else {
      setByLevel(prev => ({ ...prev, [form.level]: [...(prev[form.level] ?? []), entry] }));
    }
    setForm({ title: '', passage: '', level, questionsJson: '' });
    setFormError('');
    setShowForm(false);
    setEditIdx(null);
    setDirty(true);
  };

  const togglePassageArchive = (idx: number) => {
    setByLevel(prev => {
      const list = [...(prev[level] ?? [])];
      list[idx] = { ...list[idx], archived: !list[idx].archived };
      return { ...prev, [level]: list };
    });
    setDirty(true);
  };

  const deletePassage = (idx: number) => {
    if (!confirm('Permanently delete this passage? This cannot be undone.')) return;
    setByLevel(prev => ({ ...prev, [level]: (prev[level] ?? []).filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}), [level]: currentPassages } };
      await setCMSDocument(docId, newDoc);
      setCmsDoc(newDoc);
      invalidateCache();
      setDirty(false);
      showToast('Saved! Changes appear on next load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(`Reset "${level}" ${label} passages back to built-in defaults?`)) return;
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await setCMSDocument(docId, newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateCache();
      setDirty(false);
      showToast('Reset to built-in passages.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Edit all {label.toLowerCase()} passages — both built-in and custom. Changes are saved as a full override for the selected level.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${level === l ? 'bg-zinc-900 text-white border-zinc-900 shadow' : `${LEVEL_COLORS[l] || 'bg-slate-50 text-slate-600 border-slate-200'} hover:opacity-80`}`}>
            {l}
            {cmsDoc?.override?.[l] !== undefined && <span className="ml-1 text-[9px] font-black text-emerald-600">✎</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">
          {currentPassages.filter(p => !p.archived).length} active · {currentPassages.filter(p => p.archived).length} archived · <span className="text-slate-400 font-normal">{level}</span>
          {overrideActive && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Custom override active</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={resetLevel} disabled={saving} title="Reset this level to built-in passages" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>
      {cmsDoc === null || levelLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Active passages */}
          <div className="space-y-2 mb-3">
            {currentPassages.map((p, i) => !p.archived && (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.questions?.length ?? 0} questions · {p.passage?.substring(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(i)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => togglePassageArchive(i))}
                  <button onClick={() => deletePassage(i)} title="Delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived passages */}
          {currentPassages.some(p => p.archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived passages ({currentPassages.filter(p => p.archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {currentPassages.map((p, i) => p.archived && (
                    <div key={i} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.questions?.length ?? 0} questions · {p.passage?.substring(0, 60)}…</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => togglePassageArchive(i))}
                        <button onClick={() => deletePassage(i)} title="Permanently delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? 'Edit' : 'New'} {label} Passage</p>
              <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }}
                placeholder="Passage title" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <div className="relative">
                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-zinc-400 appearance-none">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <textarea value={form.passage} onChange={e => { setForm(f => ({ ...f, passage: e.target.value })); setFormError(''); }}
                rows={6} placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-y" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions (JSON) — optional</label>
                  <button onClick={() => setForm(f => ({ ...f, questionsJson: TEMPLATE }))} className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1">
                    <Code className="w-3 h-3" /> Template
                  </button>
                </div>
                <textarea value={form.questionsJson} onChange={e => { setForm(f => ({ ...f, questionsJson: e.target.value })); setFormError(''); }}
                  rows={6} spellCheck={false} placeholder='[{"text":"Question?","options":["A","B","C","D"],"answer":0}]'
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
              </div>
              {formError && <p className="text-xs text-rose-600 font-semibold">⚠ {formError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={cancelPassageForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={submitPassage} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? 'Update Passage' : 'Add Passage'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Custom Passage
            </button>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── ReadingTextsEditor ────────────────────────────────────────────────────────

function ReadingTextsEditor() {
  const [cmsDoc, setCmsDoc]       = useState<any | null>(null); // null = loading
  const [builtInBase, setBuiltInBase] = useState<Record<string, any[]>>({});
  const [byLevel, setByLevel]     = useState<Record<string, any[]>>({});
  const [level, setLevel]         = useState(LEVELS[0]);
  const [levelLoading, setLevelLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editIdx, setEditIdx]     = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ title: '', text: '', targetSeconds: '120', vocabJson: '' });
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Load CMS doc + built-in JSON once on mount
  useEffect(() => {
    Promise.all([
      cmsGet('customReadingTexts').catch(() => null),
      fetch('/level-texts.json').then(r => r.json()).catch(() => ({})),
    ]).then(([doc, base]) => {
      setCmsDoc(doc ?? {});
      setBuiltInBase(base ?? {});
    });
  }, []);

  // On level change or doc/base load: rebuild text list for this level
  useEffect(() => {
    if (cmsDoc === null) return;
    setLevelLoading(true);
    setDirty(false);
    if (cmsDoc.override?.[level] !== undefined) {
      setByLevel(prev => ({ ...prev, [level]: cmsDoc.override[level] as any[] }));
    } else {
      const builtIn = builtInBase[level] ?? [];
      const custom  = (cmsDoc.byLevel?.[level] ?? []).filter((t: any) => t);
      setByLevel(prev => ({ ...prev, [level]: [...builtIn, ...custom] }));
    }
    setLevelLoading(false);
  }, [level, cmsDoc, builtInBase]);

  const currentTexts  = byLevel[level] ?? [];
  const overrideActive = cmsDoc?.override?.[level] !== undefined;

  const openAddText = () => {
    setEditIdx(null);
    setForm({ title: '', text: '', targetSeconds: '120', vocabJson: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditText = (idx: number) => {
    const t = currentTexts[idx];
    setEditIdx(idx);
    setForm({
      title: t.title ?? '',
      text: t.text ?? '',
      targetSeconds: String(t.targetSeconds ?? 120),
      vocabJson: t.vocabulary?.length ? JSON.stringify(t.vocabulary, null, 2) : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const cancelTextForm = () => { setShowForm(false); setEditIdx(null); setFormError(''); };

  const submitText = () => {
    if (!form.title.trim() || !form.text.trim()) { setFormError('Title and text are required.'); return; }
    let vocabulary: any[] = [];
    if (form.vocabJson.trim()) {
      try { vocabulary = JSON.parse(form.vocabJson); }
      catch { setFormError('Invalid JSON for vocabulary.'); return; }
    }
    if (editIdx !== null) {
      setByLevel(prev => {
        const list = [...(prev[level] ?? [])];
        list[editIdx] = {
          ...list[editIdx],
          title: form.title.trim(),
          text: form.text.trim(),
          targetSeconds: parseInt(form.targetSeconds) || 120,
          vocabulary,
        };
        return { ...prev, [level]: list };
      });
    } else {
      const entry = {
        id: `custom_${Date.now()}`,
        title: form.title.trim(),
        text: form.text.trim(),
        targetSeconds: parseInt(form.targetSeconds) || 120,
        vocabulary,
      };
      setByLevel(prev => ({ ...prev, [level]: [...(prev[level] ?? []), entry] }));
    }
    setForm({ title: '', text: '', targetSeconds: '120', vocabJson: '' });
    setFormError('');
    setShowForm(false);
    setEditIdx(null);
    setDirty(true);
  };

  const toggleTextArchive = (idx: number) => {
    setByLevel(prev => {
      const list = [...(prev[level] ?? [])];
      list[idx] = { ...list[idx], archived: !list[idx].archived };
      return { ...prev, [level]: list };
    });
    setDirty(true);
  };

  const deleteText = (idx: number) => {
    if (!confirm('Permanently delete this reading text? This cannot be undone.')) return;
    setByLevel(prev => ({ ...prev, [level]: (prev[level] ?? []).filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}), [level]: currentTexts } };
      await cmsSet('customReadingTexts', newDoc);
      setCmsDoc(newDoc);
      invalidateLevelTextsCache(activeCmsLang());
      setDirty(false);
      showToast('Saved! Changes appear on next load.');
    } catch { showToast('Save failed.'); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(`Reset "${level}" reading texts back to built-in defaults?`)) return;
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await cmsSet('customReadingTexts', newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateLevelTextsCache(activeCmsLang());
      setDirty(false);
      showToast('Reset to built-in texts.');
    } catch { showToast('Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Edit all reading texts — both built-in and custom. Changes are saved as a full override for the selected level.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${level === l ? 'bg-zinc-900 text-white border-zinc-900 shadow' : `${LEVEL_COLORS[l] || 'bg-slate-50 text-slate-600 border-slate-200'} hover:opacity-80`}`}>
            {l}
            {cmsDoc?.override?.[l] !== undefined && <span className="ml-1 text-[9px] font-black text-emerald-600">✎</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">
          {currentTexts.filter(t => !t.archived).length} active · {currentTexts.filter(t => t.archived).length} archived · <span className="text-slate-400 font-normal">{level}</span>
          {overrideActive && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Custom override active</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved changes</span>}
          <button onClick={resetLevel} disabled={saving} title="Reset this level to built-in texts" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>
      {cmsDoc === null || levelLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Active texts */}
          <div className="space-y-2 mb-3">
            {currentTexts.map((t, i) => !t.archived && (
              <div key={t.id || i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.targetSeconds}s target · {t.vocabulary?.length ?? 0} vocab items · {t.text?.substring(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditText(i)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => toggleTextArchive(i))}
                  <button onClick={() => deleteText(i)} title="Delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived texts */}
          {currentTexts.some(t => t.archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                Archived texts ({currentTexts.filter(t => t.archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {currentTexts.map((t, i) => t.archived && (
                    <div key={t.id || i} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.targetSeconds}s target · {t.vocabulary?.length ?? 0} vocab items</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => toggleTextArchive(i))}
                        <button onClick={() => deleteText(i)} title="Permanently delete" className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? 'Edit' : 'New'} Reading Text</p>
              <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }}
                placeholder="Text title" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <div className="flex gap-3">
                <input value={form.targetSeconds} onChange={e => setForm(f => ({ ...f, targetSeconds: e.target.value }))}
                  placeholder="Target seconds (e.g. 120)" type="number" min="10"
                  className="w-40 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <textarea value={form.text} onChange={e => { setForm(f => ({ ...f, text: e.target.value })); setFormError(''); }}
                rows={7} placeholder="Full text content for the student to read aloud…"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-y" />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vocabulary JSON <span className="font-normal text-slate-400">— optional</span></label>
                <textarea value={form.vocabJson} onChange={e => { setForm(f => ({ ...f, vocabJson: e.target.value })); setFormError(''); }}
                  rows={3} spellCheck={false} placeholder='[{"word":"ubiquitous","definition":"found everywhere"}]'
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
              </div>
              {formError && <p className="text-xs text-rose-600 font-semibold">⚠ {formError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={cancelTextForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={submitText} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? 'Update Text' : 'Add Text'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAddText}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Custom Text
            </button>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold z-[60]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

function VocabReviewEditor() {
  const [misses, setMisses] = useState<VocabMissRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { w: string; d: string; lang: string }>>({});
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMisses(await getVocabMisses(100));
    } catch (e: any) {
      setError(e?.message || 'Could not load vocab misses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const patchJson = useMemo(() => {
    const senses: Record<string, any> = {};
    const newSenses: any[] = [];
    for (const m of misses) {
      const e = edits[m.id];
      if (!e?.w && !e?.d) continue;
      const id = `patch_${m.id}`.replace(/[^a-z0-9_]/gi, '_').slice(0, 40);
      newSenses.push({
        id,
        pos: 'unknown',
        src: [`miss:${m.id}`],
        langs: {
          [m.lang || 'en']: { w: m.word, d: e.d || m.lastTranslation || '' },
          [e.lang || m.targetLang || 'en']: { w: e.w || m.lastTranslation || '', d: e.d || '' },
        },
      });
    }
    return JSON.stringify({ senses, newSenses }, null, 2);
  }, [misses, edits]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Words students looked up that were not in the predetermined vocabulary database.
        Save the exported JSON as <code className="text-xs bg-slate-100 px-1 rounded">scripts/vocab-patches.json</code> and run <code className="text-xs bg-slate-100 px-1 rounded">npm run build:vocab</code>.
      </p>
      {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
      {error && <p className="text-rose-600 text-sm">{error}</p>}
      {!loading && misses.length === 0 && <p className="text-slate-500 text-sm">No misses yet. The queue fills when students tap words outside the seed.</p>}
      <div className="space-y-3">
        {misses.map((m) => (
          <div key={m.id} className={`bg-white border rounded-xl p-3 ${m.reviewed ? 'border-emerald-200 opacity-70' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="font-bold text-zinc-900">{m.word} <span className="text-xs font-medium text-slate-400">{m.lang} → {m.targetLang || '?'}</span></p>
                <p className="text-xs text-slate-500">Requested {m.count || 1}× {m.source === 'api' ? '· provisional API' : ''}</p>
              </div>
              {!m.reviewed && (
                <button
                  onClick={() => markVocabMissReviewed(m.id).then(reload)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  Mark reviewed
                </button>
              )}
            </div>
            {m.sampleSentence && <p className="text-sm italic text-slate-600 mb-2">“{m.sampleSentence}”</p>}
            {m.lastTranslation && <p className="text-sm text-slate-500 mb-2">API: {m.lastTranslation}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                placeholder="Correct word in known language"
                value={edits[m.id]?.w ?? ''}
                onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { w: e.target.value, d: p[m.id]?.d || '', lang: m.targetLang || 'en' } }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Correct definition"
                value={edits[m.id]?.d ?? ''}
                onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { w: p[m.id]?.w || '', d: e.target.value, lang: m.targetLang || 'en' } }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      {misses.length > 0 && (
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(patchJson);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-bold"
        >
          {copied ? 'Copied patch JSON' : 'Copy vocab-patches.json'}
        </button>
      )}
    </div>
  );
}

// ── ContentManager (main export) ─────────────────────────────────────────────

const SUB_TAB_GROUPS = [
  {
    label: 'Writing',
    tabs: [
      { id: 'writing'  as SubTab, label: 'Writing Topics',  icon: PenLine,    description: 'Free-writing practice prompts by level' },
      { id: 'speaking' as SubTab, label: 'Speaking Topics', icon: Mic,        description: 'Speaking practice topics by level' },
      { id: 'task2'    as SubTab, label: 'Writing Task 2',  icon: PenLine,    description: 'IELTS Task 2 essay prompts by type & category' },
      { id: 'task1'    as SubTab, label: 'Writing Task 1',  icon: BarChart2,  description: 'Add custom Task 1 chart prompts' },
    ],
  },
  {
    label: 'IELTS Speaking',
    tabs: [
      { id: 'ielts-speaking' as SubTab, label: 'Part 1 Topics',   icon: Mic,      description: 'Interview topic groups & questions' },
      { id: 'ielts-p2'       as SubTab, label: 'Part 2 Cards',    icon: FileText, description: 'Cue cards with bullets & follow-up' },
      { id: 'ielts-p3'       as SubTab, label: 'Part 3 Topics',   icon: Mic,      description: 'Discussion question sets' },
    ],
  },
  {
    label: 'Reading & Listening',
    tabs: [
      { id: 'ielts-reading'    as SubTab, label: 'IELTS Reading',   icon: BookOpen,    description: 'Full tests (3 passages, 40 Q)' },
      { id: 'ielts-listening'  as SubTab, label: 'IELTS Listening', icon: Headphones,  description: 'Full tests (4 sections, 40 Q)' },
      { id: 'comp-reading'     as SubTab, label: 'Comp. Reading',   icon: BookMarked,  description: 'Custom reading passages + MCQ' },
      { id: 'comp-listening'   as SubTab, label: 'Comp. Listening', icon: Volume2,     description: 'Custom listening scripts + MCQ' },
      { id: 'reading-texts'    as SubTab, label: 'Reading Texts',   icon: FileText,    description: 'Pronunciation & reading level texts' },
    ],
  },
  {
    label: 'Other',
    tabs: [
      { id: 'vocab'      as SubTab, label: 'Vocabulary', icon: Languages, description: 'Review API fallback misses and export seed patches' },
      { id: 'shadowing'  as SubTab, label: 'Shadowing',  icon: Volume2, description: 'Custom audio shadowing passages' },
      { id: 'dictation'  as SubTab, label: 'Dictation',  icon: Mic,     description: 'Custom audio dictation sentences' },
    ],
  },
];

const ALL_SUB_TABS = SUB_TAB_GROUPS.flatMap(g => g.tabs);

export function ContentManager({ initialSubTab, embedded }: { initialSubTab?: SubTab; embedded?: boolean } = {}) {
  const [cmsLang, setCmsLang] = useState<ContentLang>('en');
  _cmsLang = cmsLang;
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab ?? 'writing');

  const groups = useMemo(() => {
    if (cmsLang === 'en') return SUB_TAB_GROUPS;
    return SUB_TAB_GROUPS.map(g => ({
      ...g,
      tabs: g.tabs.filter(t => !EN_ONLY_SUBTABS.has(t.id)),
    })).filter(g => g.tabs.length > 0);
  }, [cmsLang]);

  const allTabs = useMemo(() => groups.flatMap(g => g.tabs), [groups]);
  const current = allTabs.find(t => t.id === subTab) ?? allTabs[0];

  useEffect(() => {
    if (current && subTab !== current.id) setSubTab(current.id);
  }, [cmsLang]); // eslint-disable-line react-hooks/exhaustive-deps

  const emptyDefaults = cmsLang === 'en'
    ? (TOPICS_BY_LEVEL as Record<string, string[]>)
    : EMPTY_TOPICS;
  const emptySpeaking = cmsLang === 'en'
    ? (SPEAKING_TOPICS_BY_LEVEL as Record<string, string[]>)
    : EMPTY_TOPICS;

  const body = (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Content language</p>
          <select
            value={cmsLang}
            onChange={e => setCmsLang(e.target.value as ContentLang)}
            className="bg-white border border-slate-200 text-sm font-semibold text-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-zinc-700 cursor-pointer max-w-xs"
          >
            {CONTENT_LANGS.map(lang => (
              <option key={lang} value={lang}>{CONTENT_LANG_LABEL[lang]} ({lang})</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1.5">
            {cmsLang === 'en'
              ? 'Editing English (built-ins + CMS overrides).'
              : `Editing ${CONTENT_LANG_LABEL[cmsLang]} — CMS-only (no built-in pack yet).`}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">{group.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {group.tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all ${
                    subTab === t.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-xs font-bold leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 pb-4 border-b border-slate-200">
        <h2 className="font-bold text-zinc-900">{current?.label}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{current?.description}</p>
      </div>

      <div key={cmsLang}>
      {subTab === 'writing' && (
        <TopicsEditor
          docId={cmsDocId('writingTopics', cmsLang)}
          defaultTopics={emptyDefaults}
          levels={LEVELS}
          label="Writing"
        />
      )}
      {subTab === 'speaking' && (
        <TopicsEditor
          docId={cmsDocId('speakingTopics', cmsLang)}
          defaultTopics={emptySpeaking}
          levels={LEVELS}
          label="Speaking"
        />
      )}
      {subTab === 'task2' && <Task2Editor />}
      {subTab === 'task1' && <Task1Editor />}
      {cmsLang === 'en' && subTab === 'ielts-speaking' && <IELTSSpeakingEditor />}
      {cmsLang === 'en' && subTab === 'ielts-p2' && <IELTSPart2Editor />}
      {cmsLang === 'en' && subTab === 'ielts-p3' && <IELTSPart3Editor />}
      {cmsLang === 'en' && subTab === 'ielts-reading' && <IELTSReadingManager />}
      {cmsLang === 'en' && subTab === 'ielts-listening' && <IELTSListeningManager />}
      {subTab === 'comp-reading' && (
        <PassageWithQuestionsEditor
          docId={cmsDocId('customComprehensiveReading', cmsLang)}
          label="Comprehensive Reading"
          placeholder="Paste the reading passage text here…"
          invalidateCache={invalidateCompReadingCache}
          loadBuiltIn={(level) => loadBuiltInReadingPassages(level, cmsLang)}
        />
      )}
      {cmsLang === 'en' && subTab === 'comp-listening' && (
        <PassageWithQuestionsEditor
          docId={cmsDocId('customListening', cmsLang)}
          label="Comprehensive Listening"
          placeholder="Paste the listening audio script / transcript here…"
          invalidateCache={invalidateListeningCache}
          loadBuiltIn={loadBuiltInListeningPassages}
        />
      )}
      {subTab === 'reading-texts' && <ReadingTextsEditor />}
      {cmsLang === 'en' && subTab === 'shadowing' && <ShadowingEditor />}
      {subTab === 'dictation' && <DictationEditor />}
      {subTab === 'vocab' && <VocabReviewEditor />}
      </div>
    </>
  );

  if (embedded) return body;
  return (
    <ScreenShell size="wide" title="Content" subtitle="Lessons, IELTS, and library material.">
      {body}
    </ScreenShell>
  );
}
