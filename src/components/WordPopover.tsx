import { useUiLang } from '../contexts/UiLangContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Volume2, Plus, CheckCircle2, BookOpen, Languages, Loader2, Search, Text } from 'lucide-react';
import { LANGUAGES, type LanguageOption, decodeHtmlEntities } from '../lib/languages';
import { readPreferredTranslationLang } from '../lib/preferredTranslationLang';
import { useContentLang } from '../contexts/ContentLangContext';
import { DICT_LANG_CODE, type ContentLang } from '../lib/contentLang';
import { joinTokens } from '../lib/pronunciationProfile';
import { translateWithAlternatives } from '../lib/networkCache';
import { loadVocab, lookupAllSenses, vocabDbEnabled } from '../lib/vocabDb';

interface WordPopoverProps {
  word: string;
  cleanWord: string;
  savedVocab: Record<string, any>;
  onPlay: (word: string) => void;
  onToggleVocab: (word: string, fallbackDef?: string) => Promise<void> | void;
  onShowModal: (word: string, mode: 'dictionary' | 'translation') => void;
  /** Full sentence containing the clicked word — enables sentence translate. */
  sentence?: string;
  /** Close when user clicks/taps outside the popover. */
  onClose?: () => void;
}

type TransScope = 'word' | 'sentence';

/** Extract the sentence that contains `wordIndex` from a tokenized word list. */
export function sentenceAroundWord(
  words: string[],
  wordIndex: number,
  lang?: ContentLang
): string {
  if (!words.length || wordIndex < 0 || wordIndex >= words.length) {
    return words[wordIndex] || '';
  }
  const endsSentence = (w: string) => /[.!?؟…。！？]["'”’)\]\}]*$/u.test(String(w).trim());
  let start = wordIndex;
  while (start > 0 && !endsSentence(words[start - 1])) start--;
  let end = wordIndex;
  while (end < words.length - 1 && !endsSentence(words[end])) end++;
  const slice = words.slice(start, end + 1);
  if (lang) return joinTokens(slice, lang);
  return slice.join(' ').replace(/\s+/g, ' ').trim();
}

function readSavedLang(): LanguageOption {
  return readPreferredTranslationLang();
}

export function WordPopover({
  word, cleanWord, savedVocab, onPlay, onToggleVocab, onShowModal, sentence, onClose,
}: WordPopoverProps) {
  const { t } = useUiLang();
  const { contentLang, speechLocale } = useContentLang();
  const sourceLang = DICT_LANG_CODE[contentLang];
  const rootRef = useRef<HTMLDivElement>(null);
  const langListRef = useRef<HTMLDivElement>(null);
  const [transScope, setTransScope] = useState<TransScope | null>(null);
  const [targetLang, setTargetLang] = useState<LanguageOption>(readSavedLang);
  const [langSearch, setLangSearch] = useState('');
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [senseList, setSenseList] = useState<{ pos: string; text: string; definition?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transError, setTransError] = useState(false);
  /** Optimistic local flip so the + → ✓ feels instant even before parent re-renders. */
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);

  const vocabKey = cleanWord.toLowerCase();
  const isSaved = localSaved ?? !!savedVocab[vocabKey];

  // Sync optimistic override once parent state catches up
  useEffect(() => {
    const inVocab = !!savedVocab[vocabKey];
    if (localSaved === null) return;
    if (localSaved === inVocab) setLocalSaved(null);
  }, [savedVocab, vocabKey, localSaved]);

  const sentenceText = (sentence || '').trim();
  const canTranslateSentence = sentenceText.length > 0 && sentenceText.toLowerCase() !== cleanWord.toLowerCase();

  // Close when clicking/tapping anywhere outside the popover
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current && rootRef.current.contains(target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', handler, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (langPickerOpen) setLangPickerOpen(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, langPickerOpen]);

  // Persist user's last picked language across sessions
  useEffect(() => {
    try { localStorage.setItem('preferred_translation_lang', targetLang.code); } catch {}
  }, [targetLang]);

  useEffect(() => {
    if (!transScope) return;
    const query = transScope === 'sentence' ? sentenceText : cleanWord;
    if (!query) return;
    const q = query.length > 450 ? `${query.slice(0, 450)}…` : query;
    let isMounted = true;
    setIsLoading(true);
    setTransError(false);
    setTranslation(null);
    setSenseList([]);
    const langCode = targetLang.code;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        if (transScope === 'word' && vocabDbEnabled()) {
          await loadVocab(sourceLang, langCode);
          const cards = lookupAllSenses(cleanWord, {
            sentence: sentenceText,
            knownLang: langCode,
            limit: 6,
          });
          if (cards.length && isMounted) {
            const senses = cards.map((c) => ({
              pos: String(c.pos || 'sense'),
              text: c.knownWord || c.definition,
              definition: c.definition !== (c.knownWord || c.definition) ? c.definition : undefined,
            })).filter((s) => s.text);
            setSenseList(senses);
            setTranslation(senses[0]?.text || null);
            setIsLoading(false);
            return;
          }
        }
        const packed = await translateWithAlternatives(q, sourceLang, langCode, {
          signal: controller.signal,
          sentence: sentenceText,
        });
        if (isMounted) {
          const decoded = decodeHtmlEntities((packed?.text || '').trim());
          const alts = (packed?.alternatives || [])
            .map((a) => decodeHtmlEntities(String(a || '').trim()))
            .filter((a) => a && a.toLowerCase() !== q.toLowerCase());
          if (decoded && decoded.toLowerCase() !== q.toLowerCase()) {
            setTranslation(decoded);
            setSenseList(
              alts.length > 1
                ? alts.map((text, i) => ({ pos: i === 0 ? 'closest' : 'also', text }))
                : [],
            );
          } else setTransError(true);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) { setTransError(true); setIsLoading(false); }
      }
    })();
    return () => { isMounted = false; controller.abort(); clearTimeout(timer); };
  }, [transScope, targetLang, cleanWord, sentenceText, sourceLang]);

  // Scroll selected language into view when opening the picker
  useEffect(() => {
    if (!langPickerOpen || !langListRef.current) return;
    const selected = langListRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [langPickerOpen]);

  const filteredLangs = useMemo(() => {
    const s = langSearch.trim().toLowerCase();
    if (!s) return LANGUAGES;
    return LANGUAGES.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.code.toLowerCase().includes(s) ||
      (l.native && l.native.toLowerCase().includes(s)),
    );
  }, [langSearch]);

  const toggleScope = (scope: TransScope) => {
    setTransScope(prev => (prev === scope ? null : scope));
    setLangPickerOpen(false);
  };

  const showTranslation = transScope !== null;

  return (
    <div
      ref={rootRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 rounded-xl shadow-2xl z-50 font-sans"
      style={{ minWidth: showTranslation ? (transScope === 'sentence' ? '260px' : senseList.length > 1 ? '240px' : '220px') : 'auto', maxWidth: 'min(90vw, 340px)' }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Action buttons row */}
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay(cleanWord); }}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title={`Play pronunciation (${speechLocale})`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const next = !isSaved;
            setLocalSaved(next);
            void Promise.resolve(onToggleVocab(cleanWord)).catch(() => setLocalSaved(!next));
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            isSaved
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title={isSaved ? t("core.wordpopover.remove_from_vocabulary_041ceb") : t("vocab.addButton")}
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShowModal(cleanWord, 'dictionary'); }}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title={t("core.wordpopover.see_definition_e300b8")}
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleScope('word'); }}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            transScope === 'word'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title={t("core.wordpopover.translate_word_bca3f7")}
        >
          <Languages className="w-4 h-4" />
        </button>
        {canTranslateSentence && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleScope('sentence'); }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
              transScope === 'sentence'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title={t("core.wordpopover.translate_sentence_7d1ee1")}
          >
            <Text className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inline translation panel */}
      {showTranslation && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-700/60 rounded-b-xl">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 px-0.5">
            {transScope === 'sentence' ? t("core.wordpopover.sentence_1bb1f3") : t("core.wordpopover.word_44363c")}
          </p>
          {transScope === 'sentence' && (
            <p className="text-[11px] text-slate-400 mb-2 leading-snug line-clamp-3 px-0.5">{sentenceText}</p>
          )}

          {/* Language picker — inline (not absolute) so it can scroll inside the popover */}
          <div className="mb-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLangPickerOpen(o => !o); setLangSearch(''); }}
              className="w-full flex items-center justify-between text-xs font-bold bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2 py-1.5 outline-none hover:border-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <span className="truncate">{targetLang.name}{targetLang.native && targetLang.native !== targetLang.name ? ` · ${targetLang.native}` : ''}</span>
              <span className="text-slate-500 text-[10px]">{langPickerOpen ? '▲' : '▼'}</span>
            </button>
            {langPickerOpen && (
              <div className="mt-1 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
                <div className="p-1.5 border-b border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    <input aria-label={t("core.wordpopover.search_language_bb13e8")}
                      autoFocus
                      type="text"
                      value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onPointerDown={e => e.stopPropagation()}
                      placeholder={t("core.wordpopover.search_language_bb13e8")}
                      className="w-full pl-6 pr-2 py-1 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded outline-none focus:border-emerald-500 placeholder-slate-500"
                    />
                  </div>
                </div>
                <div
                  ref={langListRef}
                  className="max-h-40 overflow-y-auto overscroll-contain touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                  onWheel={e => e.stopPropagation()}
                  onTouchMove={e => e.stopPropagation()}
                >
                  {filteredLangs.length === 0 ? (
                    <p className="text-slate-500 text-xs p-2 text-center">{t("core.wordpopover.no_match_3518df")}</p>
                  ) : (
                    filteredLangs.map(l => (
                      <button
                        type="button"
                        key={l.code}
                        data-selected={l.code === targetLang.code ? 'true' : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetLang(l);
                          setLangPickerOpen(false);
                          setLangSearch('');
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 ${
                          l.code === targetLang.code ? 'bg-emerald-900/40 text-emerald-300 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <span className="truncate">{l.name}</span>
                        {l.native && l.native !== l.name && (
                          <span className="text-slate-500 text-[10px] shrink-0">{l.native}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {!langPickerOpen && (
            isLoading ? (
              <div className="flex items-center justify-center py-1.5">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            ) : transError ? (
              <p className="text-rose-400 text-xs text-center py-1">{t("core.wordpopover.not_available_d1a17a")}</p>
            ) : senseList.length > 1 ? (
              <ul className="flex flex-col gap-1.5 py-0.5 max-h-40 overflow-y-auto">
                {senseList.map((s, i) => (
                  <li
                    key={`${s.pos}-${i}`}
                    className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-2 py-1.5 text-left"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{s.pos}</span>
                      {i === 0 && <span className="text-[9px] text-emerald-500/90 font-semibold">{t("core.wordpopover.closest_c113bd")}</span>}
                    </div>
                    <p className="text-emerald-400 font-bold text-sm leading-snug">{s.text}</p>
                    {s.definition && (
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{s.definition}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : translation ? (
              <p className={`text-emerald-400 font-bold text-center py-1 leading-snug ${transScope === 'sentence' ? 'text-xs text-left' : 'text-sm'}`}>
                {translation}
              </p>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
