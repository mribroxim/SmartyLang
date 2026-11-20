import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, Search, Star, Trash2, Volume2, X } from 'lucide-react';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { vocabStorageKey, CONTENT_LANG_LABEL } from '../lib/contentLang';
import { readPreferredTranslationCode } from '../lib/preferredTranslationLang';
import { getCard, loadVocab, lookupAllSenses, vocabDbEnabled } from '../lib/vocabDb';
import { ScreenShell, seCard, seChipOff, seChipOn } from '../components/ScreenShell';
import { EmptyState } from '../components/feedback/EmptyState';
import type { UiStringKey } from '../lib/uiStrings';

type Entry = { definition: string; timestamp: number; favorite?: boolean; srs?: any; senseId?: string; displayWord?: string; pos?: string; translation?: string };

interface VocabularyViewProps {
  savedVocab: Record<string, Entry>;
  setSavedVocab: (fn: (prev: any) => any) => void;
  playWord: (word: string) => void;
  newVocabWord: string;
  setNewVocabWord: (w: string) => void;
  isAddingVocab: boolean;
  addVocabError: string;
  handleAddNewVocab: () => void;
  onShowModal?: (word: string, mode: 'dictionary' | 'translation') => void;
}

type Tab = 'all' | 'important' | 'noun' | 'verb' | 'adjective' | 'phrase' | 'other';
const TABS: Tab[] = ['all', 'important', 'noun', 'verb', 'adjective', 'phrase', 'other'];
const PAGE = 40;

/** Machine translations sometimes end in a stray " ." or quote marks. */
const tidy = (s: string) => s.trim().replace(/^["'«“]+|["'»”]+$/g, '').replace(/s*[.。]$/, '').trim();

/** Word type: saved with the word, else from the vocabulary database, else from "(noun) …" in the definition. */
function kindOf(word: string, e: Entry, dbPos?: string): Exclude<Tab, 'all' | 'important'> {
  if (/\s/.test(word.trim())) return 'phrase';
  const pos = (e.pos || dbPos || e.definition?.match(/^\((\w[\w ]*)\)/)?.[1] || '').toLowerCase();
  if (pos.startsWith('noun')) return 'noun';
  if (pos.includes('phrasal')) return 'phrase';
  if (pos.startsWith('verb')) return 'verb';
  if (pos.startsWith('adj')) return 'adjective';
  return 'other';
}

/**
 * My vocabulary: every saved word or phrase with its translation into your
 * own language, sorted into tabs by word type. Add new words from the bar at
 * the top; tap a word for the full dictionary card.
 */
export default function VocabularyView({
  savedVocab, setSavedVocab, playWord, newVocabWord, setNewVocabWord, isAddingVocab, addVocabError, handleAddNewVocab, onShowModal,
}: VocabularyViewProps) {
  const { contentLang } = useContentLang();
  const { t } = useUiLang();
  const known = useMemo(() => readPreferredTranslationCode() || 'en', []);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [dbReady, setDbReady] = useState(false);
  const [extra, setExtra] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    if (vocabDbEnabled()) loadVocab(contentLang, known).then(() => { if (alive) setDbReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, [contentLang, known]);

  const persist = (next: any) => { try { localStorage.setItem(vocabStorageKey(contentLang), JSON.stringify(next)); } catch { /* ignore */ } };

  // Word, translation and type for every saved entry.
  const rows = useMemo(() => Object.entries(savedVocab).map(([key, e]) => {
    const word = e.displayWord || key;
    const card = dbReady ? (e.senseId ? getCard(e.senseId, known) : lookupAllSenses(word, { knownLang: known, limit: 1 })[0]) : null;
    const dbTr = card && card.knownWord && card.knownWord.toLowerCase() !== word.toLowerCase() ? tidy(card.knownWord) : '';
    return { key, word, entry: e, kind: kindOf(word, e, card?.pos), translation: e.translation || dbTr || extra[key] || '' };
  }).sort((a, b) => (b.entry.timestamp || 0) - (a.entry.timestamp || 0)), [savedVocab, dbReady, known, extra]);

  // Words the database doesn't know: translate the visible ones once (cached).
  useEffect(() => {
    if (!dbReady && vocabDbEnabled()) return;
    if (known === contentLang) return;
    const missing = rows.filter((r) => !r.translation).slice(0, 24);
    if (!missing.length) return;
    let alive = true;
    (async () => {
      const { translateWithCache } = await import('../lib/networkCache');
      for (const r of missing) {
        const tr = await translateWithCache(r.word, contentLang, known).catch(() => null);
        if (!alive) return;
        setExtra((x) => ({ ...x, [r.key]: tr && tidy(tr) && tidy(tr).toLowerCase() !== r.word.toLowerCase() ? tidy(tr) : '—' }));
      }
    })();
    return () => { alive = false; };
  }, [rows, dbReady, known, contentLang]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: rows.length, important: 0, noun: 0, verb: 0, adjective: 0, phrase: 0, other: 0 };
    for (const r of rows) { c[r.kind]++; if (r.entry.favorite) c.important++; }
    return c;
  }, [rows]);
  const q = query.trim().toLowerCase();
  const list = rows.filter((r) => (tab === 'all' || (tab === 'important' ? r.entry.favorite : r.kind === tab))
    && (!q || r.word.toLowerCase().includes(q) || r.translation.toLowerCase().includes(q)));

  const toggleStar = (key: string) => setSavedVocab((prev: any) => { const next = { ...prev, [key]: { ...prev[key], favorite: !prev[key]?.favorite } }; persist(next); return next; });
  const remove = (key: string) => setSavedVocab((prev: any) => { const next = { ...prev }; delete next[key]; persist(next); return next; });

  return (
    <ScreenShell stickers={['learn.word-nerd', 'vocab.word-collector']} title={t('vocab.title')} subtitle={t('vocab.count', { n: rows.length, lang: CONTENT_LANG_LABEL[contentLang] })}>
      {/* add a word */}
      <form onSubmit={(e) => { e.preventDefault(); handleAddNewVocab(); }} className={`${seCard} flex items-center gap-2 p-2`}>
        <input aria-label={t('vocab.addPlaceholder')} value={newVocabWord} onChange={(e) => setNewVocabWord(e.target.value)} placeholder={t('vocab.addPlaceholder')} lang={contentLang}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base font-semibold text-zinc-900 outline-none placeholder:text-slate-400 dark:text-zinc-50" />
        <button type="submit" disabled={isAddingVocab || !newVocabWord.trim()}
          className="dark-keep inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 font-serif text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#000] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_3px_0_0_#a1a1aa]">
          {isAddingVocab ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="h-4 w-4" strokeWidth={3} />}
          {t('vocab.add')}
        </button>
      </form>
      {addVocabError && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-rose-600"><AlertCircle className="h-4 w-4" />{addVocabError}</p>
      )}

      {rows.length === 0 ? (
        <div className={`${seCard} mt-5 p-6`}>
          <EmptyState sticker="vocab.word-garden" title={t('empty.vocab.title')} body={t('empty.vocab.body')} className="!py-2" />
        </div>
      ) : (
        <>
          {/* tabs + search */}
          <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="tablist" aria-label={t('vocab.types')}>
            {TABS.filter((k) => k === 'all' || k === 'important' || counts[k] > 0).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setLimit(PAGE); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 font-serif text-xs font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-75 active:translate-y-[2px] ${tab === k ? seChipOn : seChipOff}`}>
                {k === 'important' && <Star className={`h-3.5 w-3.5 ${tab === k ? 'fill-current' : 'fill-amber-400 text-amber-400'}`} />}
                {t(`vocab.tab.${k}` as UiStringKey)}
                <span className={`rounded-md px-1.5 text-[10px] ${tab === k ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-800'}`}>{counts[k]}</span>
              </button>
            ))}
          </div>
          <label className={`${seCard} mt-3 flex items-center gap-2 px-3 py-2.5 focus-within:border-zinc-900 dark:focus-within:border-zinc-100`}>
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input aria-label={t('learning.search.my.vocabulary.58df4d')} value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={t('learning.search.my.vocabulary.58df4d')}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-slate-400 dark:text-zinc-50" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label={t('history.close')} className="text-slate-400 hover:text-zinc-900"><X className="h-4 w-4" /></button>}
          </label>

          {/* words */}
          {list.length === 0 ? (
            <EmptyState sticker={tab === 'important' && !q ? 'vocab.word-collector' : 'state2.no-results'}
              title={tab === 'important' && !q ? t('vocab.noImportantTitle') : t('empty.search.title')}
              body={tab === 'important' && !q ? t('vocab.noImportantBody') : t('empty.search.body')} compact />
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {list.slice(0, limit).map((r) => (
                <li key={r.key}>
                  <div role="button" tabIndex={0} onClick={() => onShowModal?.(r.word, 'dictionary')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onShowModal?.(r.word, 'dictionary'); } }}
                    className={`${seCard} group flex cursor-pointer items-center gap-2 py-2.5 pl-2 pr-1.5 transition-[transform,box-shadow] duration-75 hover:border-zinc-300 active:translate-y-[3px] active:shadow-none dark:hover:border-zinc-600`}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); playWord(r.word); }} aria-label={t('learning.hear.pronunciation.046cac')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-slate-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-[17px] font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">{r.word}</div>
                      <div className="truncate text-sm font-semibold text-slate-500 dark:text-zinc-400">
                        {known === contentLang ? r.entry.definition : r.translation && r.translation !== '—' ? r.translation : r.translation === '—' ? r.entry.definition : <span className="inline-block h-3 w-20 animate-pulse rounded bg-slate-100 align-middle dark:bg-zinc-800" />}
                      </div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(r.key); }} aria-pressed={!!r.entry.favorite}
                      aria-label={r.entry.favorite ? t('learning.unfavorite.de9bba') : t('learning.favorite.6b90b6')}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${r.entry.favorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500 dark:text-zinc-600'}`}>
                      <Star className={`h-5 w-5 ${r.entry.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(r.key); }} aria-label={t('learning.remove.e96390')}
                      className="flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:text-rose-500 dark:text-zinc-600 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {list.length > limit && (
            <button type="button" onClick={() => setLimit((n) => n + PAGE)}
              className="mx-auto mt-4 block rounded-2xl border-2 border-slate-200 bg-white px-5 py-2.5 font-serif text-xs font-extrabold uppercase tracking-wide text-zinc-700 shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[0_3px_0_0_#3f3f46]">
              {t('vocab.showMore', { n: list.length - limit })}
            </button>
          )}
        </>
      )}
    </ScreenShell>
  );
}
