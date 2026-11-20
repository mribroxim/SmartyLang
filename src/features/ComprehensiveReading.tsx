import { DialogSurface } from '../components/DialogSurface';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, ChevronRight, Download, Search, X } from 'lucide-react';
import type { UserAccountProfile } from '../firebase';
import { accountTypeOf } from '../lib/access';
import { playSound } from '../lib/audio';
import { getReadingPassagesForLevel } from '../data/comprehensiveReading';
import type { Level } from '../lib/reading-logic';
import { cleanSpeechToken } from '../lib/reading-logic';
import { WordPopover, sentenceAroundWord } from '../components/WordPopover';
import { FontSizeControl, fontScaleClasses } from '../components/FontSizeControl';
import { logActivity } from '../lib/activity-tracker';
import { PracticeHistory } from '../components/PracticeHistory';
import { useContentLang } from '../contexts/ContentLangContext';
import { useUiLang } from '../contexts/UiLangContext';
import { activityLangStamp } from '../lib/activityMeta';
import { recordCompletion } from '../lib/completions';
import { readHomeworkDraft, saveHomeworkDraft } from '../lib/classHomework';
import { CONTENT_LANG_NATIVE } from '../lib/contentLang';
import { playWord as sharedPlayWord } from '../lib/speech';
import { tokenizeForLang, isRtlLang, getPronunciationProfile } from '../lib/pronunciationProfile';
import { ScreenShell } from '../components/ScreenShell';
import { LevelCard, LevelCardGrid, LibraryCard, LibraryCardGrid } from '../components/LevelCards';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS: Level[] = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const PAGE_SIZE = 8;

export function ComprehensiveReading({ onBack, onAddVocab, savedVocab = {}, onShowModal, initialLevel, initialPassageTitle, accountProfile, assigned }: any) {
  const { contentLang, nativeName, speechLocale, arabicDisplayMode } = useContentLang();
  const { t, tLevel, tLevelDesc } = useUiLang();
  const canDownloadPDF = (() => {
    const t = accountTypeOf(accountProfile as UserAccountProfile | null);
    return t === 'business' || t === 'admin';
  })();
  const hasInitial = !!initialLevel && !!initialPassageTitle;
  const [view, setView] = useState<'levels' | 'library' | 'activity'>(hasInitial ? 'library' : 'levels');
  const [level, setLevel] = useState<Level>((initialLevel as Level) || 'Intermediate');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [passages, setPassages] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [content, setContent] = useState<{ passage: string; questions: any[]; title: string }>({ passage: '', questions: [], title: '' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (assigned && view === 'activity' && content.title && !submitted) {
      saveHomeworkDraft(assigned, { title: content.title, lang: contentLang, questions: content.questions, answers });
    }
  }, [assigned, view, content, answers, contentLang, submitted]);
  const [search, setSearch] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastPassageTitle, setLastPassageTitle] = useState<string | null>(() => {
    try {
      const scoped = localStorage.getItem(`cr_last_passage_${contentLang}`);
      if (scoped) return scoped;
      // Legacy unscoped key was English-only before multi-language
      if (contentLang === 'en') return localStorage.getItem('cr_last_passage');
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
      setLastPassageTitle(localStorage.getItem(`cr_last_passage_${contentLang}`) || null);
    } catch { setLastPassageTitle(null); }
  }, [contentLang]);

  useEffect(() => {
    if (view === 'library') {
      setIsLoading(true);
      getReadingPassagesForLevel(level, contentLang, arabicDisplayMode)
        .then(ps => {
          // Shuffle so students don't get the same order every time
          const shuffled = shuffle(ps);
          setPassages(shuffled);
          // Auto-start assigned passage once loaded
          if (initialPassageTitle) {
            const target = shuffled.find((p: any) => p.title === initialPassageTitle);
            if (target) startReadingWithPassage(target);
          }
        })
        .catch(() => setPassages([]))
        .finally(() => setIsLoading(false));
    }
  }, [view, level, contentLang, arabicDisplayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const doPrint = useCallback((includeAnswerBlanks: boolean) => {
    if (!content.passage) return;
    const answerBlank = includeAnswerBlanks
      ? `<div style="margin-top:8px;border-bottom:1px solid #ccc;height:28px;width:100%;"></div>`
      : '';
    const html = `<!DOCTYPE html><html lang="${contentLang}"><head><meta charset="UTF-8"/><title>${t("nav.reading")} – ${content.title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;color:#1a1a1a;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.8}h1{font-size:2rem;margin-bottom:8px}.badge{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:99px;padding:2px 12px;font-size:.8rem;font-weight:700;margin-bottom:24px}.passage{font-size:1.1rem;margin-bottom:32px}h2{font-size:1.1rem;margin-top:24px;margin-bottom:12px;border-bottom:2px solid #e5e5e5;padding-bottom:4px}.question{margin-bottom:18px}.q{font-weight:700;margin-bottom:6px}.opt{padding:3px 0}@page{margin:20mm}</style>
</head><body>
<h1>${content.title}</h1><div class="badge">${tLevel(level)}</div>
<div class="passage">${content.passage}</div>
<h2>${t("site.print.questions")}</h2>
${content.questions.map((q: any, i: number) => `<div class="question"><div class="q">${i + 1}. ${q.text}</div>${q.options.map((o: string, oi: number) => `<div class="opt">${String.fromCharCode(65 + oi)}) ${o}</div>`).join('')}${answerBlank}</div>`).join('')}
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
    setShowPrintModal(false);
  }, [content, level, contentLang, t, tLevel]);

  const shuffleOptions = (questions: any[]): any[] =>
    questions.map((q: any) => {
      const indexed = q.options.map((opt: string, i: number) => ({ opt, isCorrect: i === q.answer }));
      const shuffled = shuffle(indexed);
      return { ...q, options: shuffled.map((x: any) => x.opt), answer: shuffled.findIndex((x: any) => x.isCorrect) };
    });

  const startReadingWithPassage = (p: any) => {
    const draft = readHomeworkDraft(assigned, p.title, contentLang);
    setContent({ passage: p.passage, questions: draft?.questions ?? shuffleOptions(p.questions), title: p.title });
    setAnswers(draft?.answers ?? {});
    setSubmitted(false);
    playSound('success');
    try {
      localStorage.setItem(`cr_last_passage_${contentLang}`, p.title);
      localStorage.setItem('cr_last_passage', p.title);
    } catch {}
    setLastPassageTitle(p.title);
    setView('activity');
  };

  const playWord = (word: string) => {
    sharedPlayWord(word, 1.0, speechLocale);
  };

  function handleWordClick(word: string) {
    const clean = word.replace(/[^\p{L}\p{M}'’-]/gu, '').toLowerCase();
    if (clean) setSelectedWord(clean);
  }

  if (view === 'levels') {
    return (
      <ScreenShell size="wide" title={t('reading.comp.title')} subtitle={t('compReading.levelSubtitle')}>
        <LevelCardGrid>
          {LEVELS.map((l, idx) => (
            <LevelCard
              key={l}
              title={tLevel(l)}
              desc={tLevelDesc('compReading.desc', l)}
              themeIndex={idx}
              icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
              onClick={() => { setLevel(l); setPage(1); setView('library'); }}
            />
          ))}
        </LevelCardGrid>
      </ScreenShell>
    );
  }

  if (view === 'library') {
    const filtered = search.trim() ? passages.filter(p => p.title?.toLowerCase().includes(search.toLowerCase())) : passages;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const lastPassage = lastPassageTitle ? passages.find(p => p.title === lastPassageTitle) : null;
    return (
      <ScreenShell size="wide">
          <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 md:pb-6 border-b border-slate-200">
            <div>
              <button onClick={() => setView('levels')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 mb-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 w-fit transition-colors shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                <ArrowLeft className="w-4 h-4" /> {t('action.backToLevels')}
              </button>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
                {tLevel(level)} <span className="text-slate-300 font-sans font-light">|</span>{' '}
                <span className="font-sans text-lg md:text-xl text-zinc-900 font-medium">{t('library.title')}</span>
              </h1>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border-2 border-slate-200 flex flex-col items-center shrink-0 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('library.passages')}</span>
              <span className="text-2xl font-black text-zinc-900">{passages.length}</span>
            </div>
          </header>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input aria-label={t('library.searchPassages')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.searchPassages')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/30 focus:border-zinc-700"
            />
          </div>

          {lastPassage && (
            <div className="mb-4 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{t('library.continueBanner')}</p>
                <p className="font-bold text-slate-800 text-sm line-clamp-1">{lastPassage.title}</p>
              </div>
              <button onClick={() => startReadingWithPassage(lastPassage)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shrink-0">{t('dash.continue')}</button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : passages.length === 0 ? (
            <div className="text-center py-24 text-slate-400 max-w-md mx-auto">
              {contentLang === 'en'
                ? t('library.emptyPassages')
                : t("site.comprehensivereading.no_v1_materials_yet_ask_038a0f", {v1: String(CONTENT_LANG_NATIVE[contentLang])})}
            </div>
          ) : (
            <LibraryCardGrid>
              {pagedItems.map((p, i) => (
                <LibraryCard
                  key={i}
                  title={p.title}
                  preview={p.passage?.slice(0, 120)}
                  onClick={() => startReadingWithPassage(p)}
                />
              ))}
            </LibraryCardGrid>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-30 shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-semibold text-slate-500">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-30 shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <PracticeHistory
            storageKey="cr_completions_v1"
            label={t("site.comprehensivereading.past_reading_sessions_6d92c4")}
            level={level}
          />
      </ScreenShell>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white relative">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 gap-4 shadow-sm">
        <button onClick={() => assigned ? onBack?.() : setView('library')} className="text-sm font-bold text-slate-500 hover:text-zinc-900 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-2xl border-2 border-slate-200 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />  {t("onboard.back")}</button>
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm truncate min-w-0 flex-1 justify-center">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" /> <span className="truncate">{content.title || t("reading.comp.title")}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FontSizeControl value={fontScale} onChange={setFontScale} />
          {canDownloadPDF && (
            <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 border-2 border-slate-200 px-3 py-2 rounded-2xl hover:bg-slate-100 transition-colors">
              <Download className="w-4 h-4" />  {t("site.comprehensivelistening.pdf_d613d8")}</button>
          )}
        </div>
      </div>

      {/* Print options modal */}
      {showPrintModal && (
        <DialogSurface onClose={() => setShowPrintModal(false)} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/55 backdrop-blur-[2px]" onClick={() => setShowPrintModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 border-2 border-slate-200 dark:border-zinc-800 shadow-[0_6px_0_0_#e2e8f0] dark:shadow-[0_6px_0_0_#27272a] dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-extrabold text-zinc-900 text-lg">{t("site.comprehensivelistening.pdf_options_ba75a2")}</h2>
              <button aria-label={t('a11y.close')} onClick={() => setShowPrintModal(false)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-8">{t("site.comprehensivelistening.would_you_like_to_include_addbed")}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => doPrint(true)}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-black transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
              >
                {t("site.comprehensivelistening.include_answer_lines_dd4e96")}</button>
              <button
                onClick={() => doPrint(false)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                {t("site.comprehensivelistening.questions_only_no_blanks_e1a126")}</button>
            </div>
          </div>
        </DialogSurface>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="w-full lg:w-1/2 p-6 md:p-10 border-r border-slate-200 overflow-y-auto bg-white relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-6">
            <BookOpen className="w-3.5 h-3.5" />  {t("onboard.passageLabel")}</div>
          <div
            dir={isRtlLang(contentLang) ? 'rtl' : 'ltr'}
            lang={speechLocale || contentLang}
            className={`leading-[1.9] text-slate-700 font-serif transition-all duration-300 ${fontScaleClasses(fontScale)}`}
          >
            {(() => {
              const passageWords = tokenizeForLang(content.passage, contentLang);
              const gap = getPronunciationProfile(contentLang).tokenize === 'whitespace' ? 'me-2.5 mb-2' : 'me-0.5 mb-1';
              return passageWords.map((word, i) => {
              const cleanWord = cleanSpeechToken(word);
              const isSelected = selectedWord === cleanWord && !!cleanWord;
              return (
                <span key={i} className={`cursor-pointer relative inline-block ${gap}`}
                  onClick={() => { if (cleanWord) setSelectedWord(isSelected ? null : cleanWord); }}>
                  {word}
                  {isSelected && (
                    <WordPopover
                      word={cleanWord}
                      cleanWord={cleanWord}
                      sentence={sentenceAroundWord(passageWords, i, contentLang)}
                      savedVocab={savedVocab}
                      onPlay={(w) => sharedPlayWord(w, 1.0, speechLocale)}
                      onToggleVocab={(w) => onAddVocab?.(w, 'From reading comprehension')}
                      onShowModal={(w, mode) => { onShowModal?.(w, mode); setSelectedWord(null); }}
                      onClose={() => setSelectedWord(null)}
                    />
                  )}
                </span>
              );
            });
            })()}
          </div>
          <p className="text-xs text-slate-400 mt-8 italic">{t("site.comprehensivereading.click_any_word_to_translate_eba9a3")}</p>
        </div>
        <div className="w-full lg:w-1/2 p-6 md:p-10 overflow-y-auto bg-slate-50">
          <div className="max-w-xl mx-auto space-y-8">
            <h3 className="font-serif text-2xl font-extrabold text-slate-800">{t("site.comprehensivelistening.questions_9a1fc1")}</h3>
            {content.questions.map((q: any, i: number) => (
              <div key={q.id || i} className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
                <p className="font-serif font-extrabold text-slate-900 mb-4 text-lg">{i + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt: string, oi: number) => {
                    const isSelected = answers[q.id || i] === oi;
                    const isCorrect = submitted && oi === q.answer;
                    const isWrong = submitted && isSelected && !isCorrect;
                    return (
                      <button key={oi} disabled={submitted} onClick={() => setAnswers(prev => ({ ...prev, [q.id || i]: oi }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${isSelected && !submitted ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold' : isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : isWrong ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold' : 'border-slate-100 bg-white hover:border-slate-300 text-slate-700'}`}>
                        {opt}
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!submitted ? (
              <button onClick={() => { if (Object.keys(answers).length < content.questions.length) { alert(t("site.comprehensivereading.answer_all_questions_9214a7")); return; }
                const score = Object.entries(answers).filter(([qid, a]) =>
                  content.questions.find((q: any, qi: number) => (q.id || qi) === Number(qid))?.answer === a
                ).length;
                try {
                  const details = content.questions.map((q: any, i: number) => ({
                    question: q.text,
                    options: q.options,
                    correctIndex: q.answer,
                    pickedIndex: answers[q.id || i] ?? -1,
                    isCorrect: answers[q.id || i] === q.answer,
                  }));
                  recordCompletion('comprehensive-reading', {
                    title: content.title,
                    score,
                    total: content.questions.length,
                    accuracy: content.questions.length > 0 ? Math.round((score / content.questions.length) * 100) : 0,
                    contentLang,
                    data: { level, details, ...activityLangStamp(contentLang) },
                    skipActivity: true,
                  });
                } catch {}
                logActivity({
                  type: 'comprehensive_reading',
                  title: content.title,
                  level,
                  score,
                  total: content.questions.length,
                  accuracy: content.questions.length > 0 ? Math.round((score / content.questions.length) * 100) : 0,
                  details: content.questions.map((q: any, i: number) => ({
                    question: q.text,
                    options: q.options,
                    correctIndex: q.answer,
                    pickedIndex: answers[q.id || i] ?? -1,
                    isCorrect: answers[q.id || i] === q.answer,
                  })),
                });
                setSubmitted(true); playSound('success'); }}
                disabled={assigned && (!content.questions.length || Object.keys(answers).length < content.questions.length)} className="w-full py-4 disabled:opacity-45 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition-colors shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none">{t("site.comprehensivelistening.submit_answers_b4eabb")}</button>
            ) : (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 text-blue-500 mb-3" />
                <h4 className="text-xl font-bold text-blue-900 mb-1">{t("site.comprehensivereading.completed_e67790")}</h4>
                <p className="text-blue-700 mb-4">{t("site.comprehensivelistening.you_scored_6a5599")}{Object.entries(answers).filter(([qid, a]) => content.questions.find((q: any, i: number) => (q.id || i) === Number(qid))?.answer === a).length}  {t("site.comprehensivelistening.out_of_5ee0bb")}{content.questions.length}!</p>
                <button onClick={() => assigned ? onBack?.() : setView('library')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">{t(assigned ? "homework.back" : "site.comprehensivelistening.try_another_edddec")}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
