import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Volume2 } from 'lucide-react';
import { Sticker } from '../../../components/stickers/Sticker';
import { useUiLang } from '../../../contexts/UiLangContext';
import { useContentLang } from '../../../contexts/ContentLangContext';
import { useSmartyPrefs } from '../../../lib/smarty/prefs';
import { cancelSpeech, playWord, speakText } from '../../../lib/speech';
import { sceneImage, wordImage, type V2Item, type V2Lesson } from '../../../lib/lessons/v2';
import { ChunkyButton } from './chunky';
import { translateWithCache } from '../../../lib/networkCache';
import { UI_TRANSLATE_CODE } from '../../../lib/uiLang';

/** A picture that quietly disappears until the file has been drawn. */
function Picture({ src, className }: { src: string; className: string }) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [src]);
  return ok ? <img src={src} alt="" className={className} onError={() => setOk(false)} draggable={false} /> : null;
}

const sayIt = (text: string, locale: string, slow = false) => (/\s/.test(text.trim()) ? speakText(text, slow ? 0.7 : 1, locale) : playWord(text, slow ? 0.7 : 1, locale));

/**
 * Teach cards: Smarty introduces each item — picture, the item, how to use it,
 * an example — and says it aloud. One card at a time, then the check that follows.
 */
export function TeachCards({ items, meanings, onDone }: { items: V2Item[]; meanings: Record<string, string>; onDone: (words: string[]) => void }) {
  const { t } = useUiLang();
  const { speechLocale } = useContentLang();
  const [i, setI] = useState(0);
  const item = items[i];
  const { autoplayVoice } = useSmartyPrefs();
  useEffect(() => {
    if (!item || !autoplayVoice) return;
    const id = window.setTimeout(() => sayIt(item.text, speechLocale), 350);
    return () => { window.clearTimeout(id); cancelSpeech(); };
  }, [i, item, speechLocale, autoplayVoice]);
  if (!item) return null;
  const meaning = meanings[item.text.toLowerCase()];
  const last = i + 1 >= items.length;
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-2 sm:pt-6">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('lesson.v2.new', { n: i + 1, total: items.length })}</div>
        <AnimatePresence mode="wait">
          <motion.div key={item.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
            <div className="mt-3 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-[0_4px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_4px_0_0_#27272a]">
              {item.image && <div className="flex justify-center bg-slate-50 dark:bg-zinc-950"><Picture src={wordImage(item.image.id)} className="h-44 w-44 object-contain sm:h-56 sm:w-56" /></div>}
              <div className="p-5">
                <button type="button" onClick={() => sayIt(item.text, speechLocale)} className="flex items-center gap-3 text-left">
                  <span className="dark-keep flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-[0_4px_0_0_#000] dark:bg-zinc-100 dark:text-zinc-900"><Volume2 className="h-6 w-6" /></span>
                  <span className="font-serif text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{item.text}</span>
                </button>
                {meaning && meaning.toLowerCase() !== item.text.toLowerCase() && meaning !== item.note && <div className="mt-2 text-lg font-bold text-slate-600 dark:text-zinc-300">{meaning}</div>}
                <button type="button" onClick={() => sayIt(item.example, speechLocale)} className="mt-3 flex items-center gap-2 text-left text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  <Play className="h-4 w-4 shrink-0 text-slate-400" /> {item.example}
                </button>
              </div>
            </div>
            {item.note && (
              <div className="mt-4 flex items-end gap-2">
                <Sticker id="learn.chatterbox" size={72} priority="hero" mode="once" className="shrink-0" />
                <div className="relative mb-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">{item.note}</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-2xl justify-end">
          <ChunkyButton autoFocus onClick={() => (last ? onDone(items.map((x) => x.text.toLowerCase())) : setI(i + 1))} className="w-full sm:w-auto sm:min-w-[160px]">
            {last ? t('smarty.continue') : t('lesson.v2.next')}
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}

/** The scene: picture, then the dialogue line by line (tap a line to hear it). */
export function SceneView({ lesson, onDone }: { lesson: V2Lesson; onDone: () => void }) {
  const { t, uiLang } = useUiLang();
  const { speechLocale, dictCode } = useContentLang();
  const [shown, setShown] = useState(1);
  // Tap a line: hear it again and see it in your own language (covers any word not taught yet).
  const [gloss, setGloss] = useState<Record<number, string>>({});
  const tapLine = (i: number, text: string) => {
    speakText(text, 1, speechLocale);
    if (gloss[i] !== undefined) { setGloss(({ [i]: _drop, ...rest }) => rest); return; }
    const to = UI_TRANSLATE_CODE[uiLang] || 'en';
    if (to === dictCode) return;
    setGloss((g) => ({ ...g, [i]: '…' }));
    translateWithCache(text, dictCode, to, { sentence: text }).then((tr) => setGloss((g) => (i in g ? { ...g, [i]: tr || '' } : g))).catch(() => setGloss((g) => ({ ...g, [i]: '' })));
  };
  const lines = lesson.story.lines;
  const all = shown >= lines.length;

  const left = lines[0]?.speaker;
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-2 sm:pt-6">
        <h1 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{lesson.title}</h1>
        {lesson.story.hook && <p className="mt-1 text-sm font-bold text-slate-500">{lesson.story.hook}</p>}
        {!!lesson.exposure?.length && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t('lesson.v2.newInScene')}>
            {lesson.exposure.map((e) => (
              <button key={e.text} type="button" onClick={() => speakText(e.text, 1, speechLocale)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {e.text}{e.gloss ? <span className="text-slate-400"> · {e.gloss}</span> : null}
              </button>
            ))}
          </div>
        )}
        {lesson.story.image && <Picture src={sceneImage(lesson.story.image.id)} className="mt-3 aspect-[16/10] w-full rounded-2xl border-2 border-slate-200 object-cover dark:border-zinc-800" />}
        <div className="mt-4 flex flex-col gap-2">
          {lines.slice(0, shown).map((l, i) => {
            const mine = l.speaker !== left;
            return (
              <motion.button key={i} type="button" onClick={() => tapLine(i, l.text)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] rounded-2xl border-2 px-4 py-2.5 text-left ${mine ? 'self-end border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'self-start border-slate-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'}`}>
                <span className="block text-[11px] font-extrabold uppercase tracking-widest opacity-60">{l.speaker}</span>
                <span className="text-base font-semibold">{l.text}</span>
                {gloss[i] ? <span className="mt-1 block text-sm font-medium opacity-70">{gloss[i]}</span> : null}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-2xl justify-end">
          <ChunkyButton autoFocus onClick={() => (all ? onDone() : setShown(shown + 1))} className="w-full sm:w-auto sm:min-w-[160px]">
            {all ? t('smarty.continue') : t('lesson.v2.nextLine')}
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}
