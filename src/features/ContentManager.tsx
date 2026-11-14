import { useUiLang } from '../contexts/UiLangContext';
/**
 * ContentManager — admin UI for editing all major content types in Firestore.
 * Rendered inside AdminPanel under the "Content" tab.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PenLine, Mic, Loader2, CheckCircle2, Trash2, Plus, RotateCcw, Save, ChevronDown, Edit2, Code, Volume2, FileText, BookMarked, EyeOff, Eye, ChevronRight, Languages } from 'lucide-react';
import { getCMSDocument, setCMSDocument, deleteCMSDocument, getVocabMisses, markVocabMissReviewed, type VocabMissRecord } from '../firebase';
import { invalidateCMS }          from '../lib/useCMSContent';
import { TOPICS_BY_LEVEL, PRACTICE_LEVELS } from '../data/practiceTopics';
import { SPEAKING_TOPICS_BY_LEVEL }         from '../data/speakingTopics';
import { SHADOWING_PASSAGES, type ShadowingPassage, type ShadowingLevel } from '../data/shadowingPassages';
import { invalidateDictationCache, loadBuiltInSentences }               from '../data/audioDictation';
import { invalidateCompReadingCache, loadBuiltInReadingPassages }        from '../data/comprehensiveReading';
import { invalidateListeningCache, loadBuiltInListeningPassages }        from '../data/comprehensiveListening';
import { invalidateLevelTextsCache }                                     from '../data/levelTexts';
import type { Level }                                                    from '../lib/reading-logic';
import {
  type ContentLang, cmsDocId, CONTENT_LANGS, CONTENT_LANG_LABEL,
} from '../lib/contentLang';
import { ScreenShell } from '../components/ScreenShell';

type SubTab =
  | 'writing' | 'speaking'
  | 'shadowing' | 'dictation' | 'comp-reading' | 'comp-listening' | 'reading-texts'
  | 'vocab';

/** Active CMS language — set by ContentManager so nested editors namespace doc ids. */
let _cmsLang: ContentLang = 'en';
function activeCmsLang(): ContentLang { return _cmsLang; }
function cmsGet(base: string) { return getCMSDocument(cmsDocId(base, activeCmsLang())); }
function cmsSet(base: string, data: any) { return setCMSDocument(cmsDocId(base, activeCmsLang()), data); }
function cmsDel(base: string) { return deleteCMSDocument(cmsDocId(base, activeCmsLang())); }

const EMPTY_TOPICS: Record<string, string[]> = {
  'Beginner': [], 'Elementary': [], 'Pre-Intermediate': [], 'Intermediate': [], 'Advanced': [],
};

const EN_ONLY_SUBTABS = new Set<SubTab>(['comp-listening', 'shadowing']);

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
  const { t: tr, uiLang, tLevel } = useUiLang();
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
      <EyeOff className="w-2.5 h-2.5" />  {tr("site.contentmanager.archived_eddc81")}</span>
  );
}

function archiveBtn(isArchived: boolean, onClick: () => void, tr: ReturnType<typeof useUiLang>['t']) {
  return (
    <button
      onClick={onClick}
      title={isArchived ? tr("core.management.restore_show_to_students_5c0c3b") : tr("core.management.archive_hide_from_students_7f0a9a")}
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
                <button onClick={() => setEditIdx(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">{tr("action.cancel")}</button>
                <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />  {tr("site.contentmanager.save_efc007")}</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-3 py-2.5">
              <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5 w-6 text-right">{rowLabel ? rowLabel(idx) : idx + 1}.</span>
              <p className="flex-1 text-sm text-slate-800 leading-snug">{item}</p>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button onClick={() => startEdit(idx)} title={tr("site.contentmanager.edit_530164")} className="p-1 rounded-md text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(idx)} title={tr("site.contentmanager.delete_f6fdbe")} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
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
          <Plus className="w-4 h-4" />  {tr("site.contentmanager.add_61cc55")}</button>
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
      showToast(tr("core.management.saved_changes_will_appear_on_065a09"));
    } catch { showToast(tr("core.management.save_failed_aefc63")); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(tr("core.management.reset_all_label_topics_to_21c4fe", { label: label }))) return;
    setSaving(true);
    try {
      await deleteCMSDocument(docId);
      setAllTopics(defaultTopics);
      invalidateCMS(activeCmsLang());
      setDirty(false);
      showToast(tr("core.management.reset_to_defaults_5b3b55"));
    } catch { showToast(tr("core.management.reset_failed_29fe06")); }
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
          {currentTopics.length}  {tr("site.contentmanager.topics_674f5e")}<span className="text-slate-400 font-normal">{level}</span>
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{tr("site.contentmanager.unsaved_changes_292672")}</span>}
          <button onClick={reset} disabled={saving} title={tr("site.contentmanager.reset_to_defaults_ddefe4")} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {tr("site.contentmanager.save_efc007")}</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <StringListEditor
          items={currentTopics}
          onChange={handleChange}
          placeholder={tr("core.management.add_a_new_value1_topic_530455", { value1: label.toLowerCase() })}
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

// ── ShadowingEditor ───────────────────────────────────────────────────────────

const SHADOWING_LEVELS: ShadowingLevel[] = ['beginner', 'intermediate', 'advanced'];

function ShadowingEditor() {
  const { t: tr, uiLang, tLevel } = useUiLang();
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
    if (!confirm(tr("core.management.permanently_delete_this_shadowing_passage_d6dc9f"))) return;
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
      showToast(tr("core.profilepage.saved_e929bf"));
    } catch { showToast(tr("core.management.save_failed_aefc63")); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(tr("core.management.reset_all_shadowing_passages_to_c8f4a8"))) return;
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
      showToast(tr("core.management.reset_to_builtin_passages_7f157f"));
    } catch { showToast(tr("core.management.failed_254aaf")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{tr("site.contentmanager.edit_all_shadowing_passages_both_a67cbd")}</p>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600"><span className="font-semibold text-zinc-900">{passages.filter(p => !(p as any).archived).length}</span>  {tr("site.contentmanager.active_4c7107")}<span className="font-semibold text-zinc-900">{passages.filter(p => !!(p as any).archived).length}</span>  {tr("site.contentmanager.archived_48f0f9")}</p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{tr("site.contentmanager.unsaved_changes_292672")}</span>}
          <button onClick={reset} disabled={saving} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}  {tr("site.contentmanager.save_efc007")}</button>
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
                  <button onClick={() => openEdit(i)} title={tr("site.contentmanager.edit_530164")} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => toggleShadowArchive(i), tr)}
                  <button onClick={() => deletePassage(i)} title={tr("site.contentmanager.delete_f6fdbe")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived passages */}
          {passages.some(p => (p as any).archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                {tr("site.contentmanager.archived_passages_436080")}{passages.filter(p => (p as any).archived).length})
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
                        {archiveBtn(true, () => toggleShadowArchive(i), tr)}
                        <button onClick={() => deletePassage(i)} title={tr("site.contentmanager.permanently_delete_2eea1f")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? tr("site.contentmanager.edit_530164") : tr("site.contentmanager.new_6403f2")}  {tr("site.contentmanager.shadowing_passage_8af61e")}</p>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={tr("site.contentmanager.passage_title_00488f")} className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
                <div className="relative">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as ShadowingLevel }))}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-zinc-400 appearance-none">
                    {SHADOWING_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder={tr("site.contentmanager.topic_tag_eg_motivation_2dedb0")} className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <input value={form.audioSrc} onChange={e => setForm(f => ({ ...f, audioSrc: e.target.value }))}
                placeholder={tr("site.contentmanager.audio_url_optional_https_or_73ec8f")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                rows={5} placeholder={tr("site.contentmanager.full_transcript_text_2511f9")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{tr("action.cancel")}</button>
                <button onClick={submitForm} disabled={!form.title.trim() || !form.text.trim()}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold disabled:opacity-40 hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? tr("site.contentmanager.update_fb91e2") : tr("site.contentmanager.add_passage_a769b8")}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" />  {tr("site.contentmanager.add_custom_passage_2009c5")}</button>
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
      showToast(tr("core.management.saved_changes_appear_on_next_8e7a67"));
    } catch { showToast(tr("core.management.save_failed_aefc63")); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(tr("core.management.reset_level_dictation_sentences_back_d83dde", { level: level }))) return;
    setSaving(true);
    try {
      const newDoc = { ...cmsDoc, override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await cmsSet('customDictation', newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateDictationCache();
      setDirty(false);
      showToast(tr("core.management.reset_to_builtin_sentences_0fb5a4"));
    } catch { showToast(tr("core.management.reset_failed_29fe06")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{tr("site.contentmanager.edit_all_dictation_sentences_per_9c727e")}</p>
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
          {sentences.length}  {tr("site.contentmanager.sentences_333216")}<span className="text-slate-400 font-normal">{level}</span>
          {cmsDoc?.override?.[level] !== undefined && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tr("site.contentmanager.custom_override_active_5731e2")}</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{tr("site.contentmanager.unsaved_changes_292672")}</span>}
          <button onClick={resetLevel} disabled={saving} title={tr("site.contentmanager.reset_this_level_to_builtin_7bb110")} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}  {tr("site.contentmanager.save_efc007")}</button>
        </div>
      </div>
      {levelLoading || cmsDoc === null ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <StringListEditor
          items={sentences}
          onChange={items => { setSentences(items); setDirty(true); }}
          placeholder={tr("site.contentmanager.add_a_new_dictation_sentence_14b5bd")}
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
    if (!form.title.trim() || !form.passage.trim()) { setFormError(tr("core.management.title_and_passage_text_are_d06523")); return; }
    let questions: any[] = [];
    if (form.questionsJson.trim()) {
      try { questions = JSON.parse(form.questionsJson); }
      catch { setFormError(tr("core.management.invalid_json_for_questions_809b02")); return; }
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
    if (!confirm(tr("core.management.permanently_delete_this_passage_this_0ef776"))) return;
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
      showToast(tr("core.management.saved_changes_appear_on_next_6d1a8d"));
    } catch { showToast(tr("core.management.save_failed_aefc63")); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(tr("core.management.reset_level_label_passages_back_4e7a32", { level: level, label: label }))) return;
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await setCMSDocument(docId, newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateCache();
      setDirty(false);
      showToast(tr("core.management.reset_to_builtin_passages_7f157f"));
    } catch { showToast(tr("core.management.reset_failed_29fe06")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{tr("site.contentmanager.edit_all_a6eb30")}{label.toLowerCase()}  {tr("site.contentmanager.passages_both_builtin_and_custom_eca7a7")}</p>
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
          {currentPassages.filter(p => !p.archived).length}  {tr("site.contentmanager.active_4c7107")}{currentPassages.filter(p => p.archived).length}  {tr("site.contentmanager.archived_8bef8e")}<span className="text-slate-400 font-normal">{level}</span>
          {overrideActive && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tr("site.contentmanager.custom_override_active_5731e2")}</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{tr("site.contentmanager.unsaved_changes_292672")}</span>}
          <button onClick={resetLevel} disabled={saving} title={tr("site.contentmanager.reset_this_level_to_builtin_861ae1")} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}  {tr("site.contentmanager.save_efc007")}</button>
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
                  <p className="text-xs text-slate-500">{p.questions?.length ?? 0}  {tr("site.contentmanager.questions_21292f")}{p.passage?.substring(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(i)} title={tr("site.contentmanager.edit_530164")} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => togglePassageArchive(i), tr)}
                  <button onClick={() => deletePassage(i)} title={tr("site.contentmanager.delete_f6fdbe")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived passages */}
          {currentPassages.some(p => p.archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                {tr("site.contentmanager.archived_passages_436080")}{currentPassages.filter(p => p.archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {currentPassages.map((p, i) => p.archived && (
                    <div key={i} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.questions?.length ?? 0}  {tr("site.contentmanager.questions_21292f")}{p.passage?.substring(0, 60)}…</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => togglePassageArchive(i), tr)}
                        <button onClick={() => deletePassage(i)} title={tr("site.contentmanager.permanently_delete_2eea1f")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? tr("site.contentmanager.edit_530164") : tr("site.contentmanager.new_6403f2")} {label}  {tr("onboard.passageLabel")}</p>
              <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }}
                placeholder={tr("site.contentmanager.passage_title_00488f")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("site.contentmanager.questions_json_optional_14e814")}</label>
                  <button onClick={() => setForm(f => ({ ...f, questionsJson: TEMPLATE }))} className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1">
                    <Code className="w-3 h-3" />  {tr("site.contentmanager.template_3ec1ae")}</button>
                </div>
                <textarea value={form.questionsJson} onChange={e => { setForm(f => ({ ...f, questionsJson: e.target.value })); setFormError(''); }}
                  rows={6} spellCheck={false} placeholder={'[{"text":"Question?","options":["A","B","C","D"],"answer":0}]'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
              </div>
              {formError && <p className="text-xs text-rose-600 font-semibold">⚠ {formError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={cancelPassageForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{tr("action.cancel")}</button>
                <button onClick={submitPassage} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? tr("site.contentmanager.update_passage_669625") : tr("site.contentmanager.add_passage_a769b8")}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" />  {tr("site.contentmanager.add_custom_passage_2009c5")}</button>
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
    if (!form.title.trim() || !form.text.trim()) { setFormError(tr("core.management.title_and_text_are_required_078033")); return; }
    let vocabulary: any[] = [];
    if (form.vocabJson.trim()) {
      try { vocabulary = JSON.parse(form.vocabJson); }
      catch { setFormError(tr("core.management.invalid_json_for_vocabulary_e0b9c0")); return; }
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
    if (!confirm(tr("core.management.permanently_delete_this_reading_text_36ca3d"))) return;
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
      showToast(tr("core.management.saved_changes_appear_on_next_6d1a8d"));
    } catch { showToast(tr("core.management.save_failed_aefc63")); }
    finally { setSaving(false); }
  };

  const resetLevel = async () => {
    if (!confirm(tr("core.management.reset_level_reading_texts_back_b79021", { level: level }))) return;
    setSaving(true);
    try {
      const newDoc = { ...(cmsDoc ?? {}), override: { ...(cmsDoc?.override ?? {}) } };
      delete newDoc.override[level];
      await cmsSet('customReadingTexts', newDoc);
      setCmsDoc(newDoc); // triggers useEffect to reload built-in
      invalidateLevelTextsCache(activeCmsLang());
      setDirty(false);
      showToast(tr("core.management.reset_to_builtin_texts_f28539"));
    } catch { showToast(tr("core.management.reset_failed_29fe06")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{tr("site.contentmanager.edit_all_reading_texts_both_341152")}</p>
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
          {currentTexts.filter(t => !t.archived).length}  {tr("site.contentmanager.active_4c7107")}{currentTexts.filter(t => t.archived).length}  {tr("site.contentmanager.archived_8bef8e")}<span className="text-slate-400 font-normal">{level}</span>
          {overrideActive && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{tr("site.contentmanager.custom_override_active_5731e2")}</span>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{tr("site.contentmanager.unsaved_changes_292672")}</span>}
          <button onClick={resetLevel} disabled={saving} title={tr("site.contentmanager.reset_this_level_to_builtin_d3ee8a")} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={save} disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}  {tr("site.contentmanager.save_efc007")}</button>
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
                  <p className="text-xs text-slate-500">{t.targetSeconds}{tr("site.contentmanager.s_target_406af5")}{t.vocabulary?.length ?? 0}  {tr("site.contentmanager.vocab_items_1fa075")}{t.text?.substring(0, 60)}…</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditText(i)} title={tr("site.contentmanager.edit_530164")} className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-900 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {archiveBtn(false, () => toggleTextArchive(i), tr)}
                  <button onClick={() => deleteText(i)} title={tr("site.contentmanager.delete_f6fdbe")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Archived texts */}
          {currentTexts.some(t => t.archived) && (
            <div className="mb-3">
              <button onClick={() => setShowArchived(s => !s)} className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                {tr("site.contentmanager.archived_texts_884ee2")}{currentTexts.filter(t => t.archived).length})
              </button>
              {showArchived && (
                <div className="space-y-2">
                  {currentTexts.map((t, i) => t.archived && (
                    <div key={t.id || i} className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><ArchivedBadge /></div>
                        <p className="font-semibold text-sm text-zinc-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.targetSeconds}{tr("site.contentmanager.s_target_406af5")}{t.vocabulary?.length ?? 0}  {tr("site.contentmanager.vocab_items_787b43")}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {archiveBtn(true, () => toggleTextArchive(i), tr)}
                        <button onClick={() => deleteText(i)} title={tr("site.contentmanager.permanently_delete_2eea1f")} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{editIdx !== null ? tr("site.contentmanager.edit_530164") : tr("site.contentmanager.new_6403f2")}  {tr("site.contentmanager.reading_text_6ac6dc")}</p>
              <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }}
                placeholder={tr("site.contentmanager.text_title_f4b779")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              <div className="flex gap-3">
                <input value={form.targetSeconds} onChange={e => setForm(f => ({ ...f, targetSeconds: e.target.value }))}
                  placeholder={tr("site.contentmanager.target_seconds_eg_120_4b69ad")} type="number" min="10"
                  className="w-40 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400" />
              </div>
              <textarea value={form.text} onChange={e => { setForm(f => ({ ...f, text: e.target.value })); setFormError(''); }}
                rows={7} placeholder={tr("site.contentmanager.full_text_content_for_the_278c41")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-zinc-400 resize-y" />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{tr("site.contentmanager.vocabulary_json_7fe09b")}<span className="font-normal text-slate-400">{tr("site.contentmanager.optional_c7cdc4")}</span></label>
                <textarea value={form.vocabJson} onChange={e => { setForm(f => ({ ...f, vocabJson: e.target.value })); setFormError(''); }}
                  rows={3} spellCheck={false} placeholder={'[{"word":"ubiquitous","definition":"found everywhere"}]'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-mono focus:outline-none focus:border-zinc-400 resize-y" />
              </div>
              {formError && <p className="text-xs text-rose-600 font-semibold">⚠ {formError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={cancelTextForm} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{tr("action.cancel")}</button>
                <button onClick={submitText} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  {editIdx !== null ? tr("site.contentmanager.update_text_511d1e") : tr("site.contentmanager.add_text_827a9c")}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={openAddText}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-zinc-400 hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4" />  {tr("site.contentmanager.add_custom_text_d67da1")}</button>
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
  const { t: tr, uiLang, tLevel } = useUiLang();
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
      setError(e?.message || tr("core.management.could_not_load_vocab_misses_77bcf6"));
    } finally {
      setLoading(false);
    }
  }, [tr]);

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
        {tr("site.contentmanager.words_students_looked_up_that_350d28")} <code className="text-xs bg-slate-100 px-1 rounded">{tr("site.contentmanager.scriptsvocabpatchesjson_ff0853")}</code>  {tr("site.contentmanager.and_run_2ae262")}<code className="text-xs bg-slate-100 px-1 rounded">{tr("site.contentmanager.npm_run_buildvocab_53fbf9")}</code>.
      </p>
      {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />  {tr("site.contentmanager.loading_33ce41")}</div>}
      {error && <p className="text-rose-600 text-sm">{error}</p>}
      {!loading && misses.length === 0 && <p className="text-slate-500 text-sm">{tr("site.contentmanager.no_misses_yet_the_queue_530d77")}</p>}
      <div className="space-y-3">
        {misses.map((m) => (
          <div key={m.id} className={`bg-white border rounded-xl p-3 ${m.reviewed ? 'border-emerald-200 opacity-70' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="font-bold text-zinc-900">{m.word} <span className="text-xs font-medium text-slate-400">{m.lang} → {m.targetLang || '?'}</span></p>
                <p className="text-xs text-slate-500">{tr("site.contentmanager.requested_c26bf6")}{m.count || 1}× {m.source === 'api' ? tr("site.contentmanager.provisional_api_bf3617") : ''}</p>
              </div>
              {!m.reviewed && (
                <button
                  onClick={() => markVocabMissReviewed(m.id).then(reload)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {tr("site.contentmanager.mark_reviewed_277c92")}</button>
              )}
            </div>
            {m.sampleSentence && <p className="text-sm italic text-slate-600 mb-2">“{m.sampleSentence}”</p>}
            {m.lastTranslation && <p className="text-sm text-slate-500 mb-2">{tr("site.contentmanager.api_1fa34c")}{m.lastTranslation}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                placeholder={tr("site.contentmanager.correct_word_in_known_language_6f468c")}
                value={edits[m.id]?.w ?? ''}
                onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { w: e.target.value, d: p[m.id]?.d || '', lang: m.targetLang || 'en' } }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder={tr("site.contentmanager.correct_definition_9528f7")}
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
          {copied ? tr("site.contentmanager.copied_patch_json_78dd9a") : tr("site.contentmanager.copy_vocabpatchesjson_a3e33a")}
        </button>
      )}
    </div>
  );
}

// ── ContentManager (main export) ─────────────────────────────────────────────





export function ContentManager({ initialSubTab, embedded }: { initialSubTab?: SubTab; embedded?: boolean } = {}) {
  const { t: tr, uiLang, tLevel } = useUiLang();
const SUB_TAB_GROUPS = [
  {
    label: tr("nav.writing"),
    tabs: [
      { id: 'writing'  as SubTab, label: tr("core.management.writing_topics_638b1a"),  icon: PenLine,    description: tr("core.management.freewriting_practice_prompts_by_level_bec732") },
      { id: 'speaking' as SubTab, label: tr("core.management.speaking_topics_602fe9"), icon: Mic,        description: tr("core.management.speaking_practice_topics_by_level_53e950") },
    ],
  },
  {
    label: tr("core.management.reading_listening_600d2c"),
    tabs: [
      { id: 'comp-reading'     as SubTab, label: tr("core.management.comp_reading_69cffb"),   icon: BookMarked,  description: tr("core.management.custom_reading_passages_mcq_0ddc4d") },
      { id: 'comp-listening'   as SubTab, label: tr("core.management.comp_listening_9bfe80"), icon: Volume2,     description: tr("core.management.custom_listening_scripts_mcq_783e95") },
      { id: 'reading-texts'    as SubTab, label: tr("core.management.reading_texts_508fd8"),   icon: FileText,    description: tr("core.management.pronunciation_reading_level_texts_d132ae") },
    ],
  },
  {
    label: tr("core.management.other_6e6a6f"),
    tabs: [
      { id: 'vocab'      as SubTab, label: tr("onboard.section.vocabulary"), icon: Languages, description: tr("core.management.review_api_fallback_misses_and_3c3aa0") },
      { id: 'shadowing'  as SubTab, label: tr("speaking.shadow.title"),  icon: Volume2, description: tr("core.management.custom_audio_shadowing_passages_808bfe") },
      { id: 'dictation'  as SubTab, label: tr("core.management.dictation_2a7fe4"),  icon: Mic,     description: tr("core.management.custom_audio_dictation_sentences_e48bcc") },
    ],
  },
];

  const [cmsLang, setCmsLang] = useState<ContentLang>('en');
  _cmsLang = cmsLang;
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab ?? 'writing');

  const groups = useMemo(() => {
    if (cmsLang === 'en') return SUB_TAB_GROUPS;
    return SUB_TAB_GROUPS.map(g => ({
      ...g,
      tabs: g.tabs.filter(t => !EN_ONLY_SUBTABS.has(t.id)),
    })).filter(g => g.tabs.length > 0);
  }, [cmsLang, tr]);

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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{tr("site.contentmanager.content_language_9dc835")}</p>
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
              ? tr("site.contentmanager.editing_english_builtins_cms_overrides_f8bdff")
              : tr("core.management.editing_value1_cmsonly_no_builtin_f1e9cd", { value1: CONTENT_LANG_LABEL[cmsLang] })}
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
          label={tr("nav.writing")}
        />
      )}
      {subTab === 'speaking' && (
        <TopicsEditor
          docId={cmsDocId('speakingTopics', cmsLang)}
          defaultTopics={emptySpeaking}
          levels={LEVELS}
          label={tr("home.preview.speaking")}
        />
      )}
      {subTab === 'comp-reading' && (
        <PassageWithQuestionsEditor
          docId={cmsDocId('customComprehensiveReading', cmsLang)}
          label={tr("reading.comp.title")}
          placeholder={tr("site.contentmanager.paste_the_reading_passage_text_af544e")}
          invalidateCache={invalidateCompReadingCache}
          loadBuiltIn={(level) => loadBuiltInReadingPassages(level, cmsLang)}
        />
      )}
      {cmsLang === 'en' && subTab === 'comp-listening' && (
        <PassageWithQuestionsEditor
          docId={cmsDocId('customListening', cmsLang)}
          label={tr("listening.comp.title")}
          placeholder={tr("site.contentmanager.paste_the_listening_audio_script_f920c1")}
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
    <ScreenShell size="wide" title={tr("nav.contentShort")} subtitle={tr("site.contentmanager.lessons_ielts_and_library_material_f9b2c0")}>
      {body}
    </ScreenShell>
  );
}
