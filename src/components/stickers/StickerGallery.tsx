import { DialogSurface } from '../DialogSurface';
import { useMemo, useState } from 'react';
import { STICKERS, type StickerId } from './manifest';
import { Sticker } from './Sticker';
import { STICKER_INFO } from './stickerInfo';

const CAT_LABEL: Record<string, string> = {
  mood: 'Moods', pose: 'Full body', learn: 'Learning', reward: 'Rewards', state: 'App states',
  pers: 'Personality', feed: 'Answer feedback', read: 'Reading', listen: 'Listening', speak: 'Speaking',
  write: 'Writing', vocab: 'Vocab & grammar', flow: 'Lesson flow', streak: 'Streaks', achieve: 'Achievements',
  game: 'Games', social: 'Friends', state2: 'App states +', premium: 'Premium', season: 'Seasonal',
  egg: 'Easter eggs', sig: 'Signature',
};

/** Admin/dev page (#/stickers): every Smarty sticker with its id and where it is used. */
export function StickerGallery() {
  const cats = useMemo(() => [...new Set(STICKERS.map((s) => s.cat))], []);
  const [cat, setCat] = useState<string>('all');
  const [open, setOpen] = useState<StickerId | null>(null);
  const list = STICKERS.filter((s) => cat === 'all' || s.cat === cat);
  const current = open ? STICKERS.find((s) => s.id === open) : null;

  return (
    <div className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-serif font-black tracking-tight mb-1">Smarty stickers</h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">{STICKERS.length} stickers. Only a few animate at once (performance budget); tap one to play it big.</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {['all', ...cats].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${cat === c ? 'bg-zinc-900 text-white border-zinc-900 dark-keep' : 'border-slate-200 dark:border-zinc-700'}`}
          >
            {c === 'all' ? 'All' : CAT_LABEL[c] ?? c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s.id)}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-left hover:border-zinc-400 transition"
          >
            <div className="flex justify-center"><Sticker id={s.id} size={120} priority="ambient" /></div>
            <div className="mt-1 text-[11px] font-mono text-slate-400">#{s.no} · {s.id}</div>
            <div className="text-sm font-black">{STICKER_INFO[s.id].name}</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">{STICKER_INFO[s.id].tag}</div>
          </button>
        ))}
      </div>
      {current && (
        <DialogSurface onClose={() => setOpen(null)} className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center"><Sticker id={current.id} size={300} priority="hero" title={STICKER_INFO[current.id].name} /></div>
            <div className="mt-2 text-xs font-mono text-slate-400">#{current.no} · {current.id}</div>
            <div className="text-xl font-black">{STICKER_INFO[current.id].name}</div>
            <div className="text-sm text-slate-500 dark:text-zinc-400">{STICKER_INFO[current.id].tag}</div>
            <button type="button" onClick={() => setOpen(null)} className="mt-4 px-5 py-2 rounded-full bg-zinc-900 text-white text-sm font-bold dark-keep">Close</button>
          </div>
        </DialogSurface>
      )}
    </div>
  );
}
