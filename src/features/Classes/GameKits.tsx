import { useCallback, useEffect, useState } from 'react';
import { Copy, Gamepad2, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { DialogSurface } from '../../components/DialogSurface';
import { seCard } from '../../components/ScreenShell';
import { useUiLang } from '../../contexts/UiLangContext';

import { ApiError, apiRequest } from '../../lib/selfHostedApi';
import {
  KIT_COLORS, checkWordRows, kitModes,
  type GameKind, type GameKit, type LiveGameView,
} from '../../lib/liveWordGame';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { MODE_META } from './liveGameKit';
import { GameOptions, GamePicker, WordSetBuilder, rowsFromWords, setupField, useWordMessage, type WordRow } from './GameSetup';

const field = setupField;
const EMOJIS = ['🎮', '🚀', '🦊', '🐼', '⚡', '🍕', '🌍', '🏆', '🎵', '🔥'];
/** Cover tints: light fill + readable text in both themes. */
const COVER: Record<string, string> = {
  rose: 'bg-rose-100 dark:bg-rose-950', violet: 'bg-violet-100 dark:bg-violet-950', sky: 'bg-sky-100 dark:bg-sky-950',
  amber: 'bg-amber-100 dark:bg-amber-950', teal: 'bg-teal-100 dark:bg-teal-950', emerald: 'bg-emerald-100 dark:bg-emerald-950',
  fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-950', orange: 'bg-orange-100 dark:bg-orange-950',
};
const SWATCH: Record<string, string> = {
  rose: 'bg-rose-400', violet: 'bg-violet-400', sky: 'bg-sky-400', amber: 'bg-amber-400',
  teal: 'bg-teal-400', emerald: 'bg-emerald-400', fuchsia: 'bg-fuchsia-400', orange: 'bg-orange-400',
};

/** "My games": games a teacher prepares ahead of time, then hosts for a class with one tap. */
export function GameKitLibrary({ classId, onHost }: { classId: string; onHost: (classId: string, code?: string) => void }) {
  const { t } = useUiLang();
  const [kits, setKits] = useState<GameKit[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<GameKit | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');
  const [failure, setFailure] = useState('');

  const load = useCallback((signal?: AbortSignal) => {
    setError(false);
    apiRequest<GameKit[]>('/api/game-kits', { signal })
      .then(items => { if (!signal?.aborted) setKits(items); })
      .catch(() => { if (!signal?.aborted) setError(true); });
  }, []);
  useEffect(() => { const ctl = new AbortController(); load(ctl.signal); return () => ctl.abort(); }, [load]);

  const act = async (id: string, work: () => Promise<unknown>) => {
    setBusyId(id); setFailure('');
    try { await work(); } catch (e) { setFailure(e instanceof ApiError ? e.message : t('management.loadError')); }
    finally { setBusyId(''); }
  };
  const host = (kit: GameKit) => act(kit.id, async () => {
    const view = await apiRequest<LiveGameView>('/api/live-game', {
      method: 'POST', body: JSON.stringify({ action: 'create', classId, mode: kit.mode, modes: kitModes(kit), teams: kit.teams, hostSpeaks: kit.hostSpeaks, words: kit.words }),
    });
    onHost(classId, view.code);
  });
  const duplicate = (kit: GameKit) => act(kit.id, async () => {
    const copy = await apiRequest<GameKit>('/api/game-kits', { method: 'POST', body: JSON.stringify({ action: 'duplicate', id: kit.id }) });
    setKits(items => [copy, ...(items ?? [])]);
  });
  const remove = (kit: GameKit) => {
    if (!window.confirm(t('kit.deleteConfirm', { title: kit.title }))) return;
    void act(kit.id, async () => {
      await apiRequest('/api/game-kits', { method: 'POST', body: JSON.stringify({ action: 'delete', id: kit.id }) });
      setKits(items => items?.filter(item => item.id !== kit.id) ?? null);
    });
  };

  return <section className="mb-8 space-y-4" aria-labelledby="kit-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="kit-heading" className="font-serif text-xl font-extrabold">{t('kit.title')}</h2>
      <ChunkyButton onClick={() => setEditing('new')}><Plus className="h-4 w-4" />{t('kit.new')}</ChunkyButton>
    </div>
    {failure && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{failure}</p>}
    {error ? <p role="alert" className={`${seCard} p-4 font-semibold`}>{t('management.loadError')} <button type="button" className="underline" onClick={() => load()}>{t('action.tryAgain')}</button></p>
      : !kits ? <p role="status">{t('teacher.loading')}</p>
        : kits.length === 0 ? <p className={`${seCard} p-5 text-sm text-zinc-600 dark:text-zinc-300`}>{t('kit.empty')}</p>
          : <ul className="grid gap-4 sm:grid-cols-2">
            {kits.map(kit => {
              const kinds = kitModes(kit);
              const meta = MODE_META[kinds[0]];
              const Icon = meta.icon;
              return <li key={kit.id} className={`${seCard} flex min-w-0 flex-col overflow-hidden`}>
                <div className={`flex items-center gap-3 px-4 py-4 ${COVER[kit.color] ?? COVER.sky}`}>
                  <span aria-hidden className="text-4xl leading-none">{kit.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="break-words font-serif text-lg font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">{kit.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      <span className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5" aria-hidden />{kinds.length > 1 ? t('kit.games', { n: kinds.length }) : t(meta.title)}</span>
                      <span>· {t('kit.words', { n: kit.words.length })}</span>
                      {kit.teams && <span className="inline-flex items-center gap-1">· <Users className="h-3.5 w-3.5" aria-hidden />{t('kit.teams')}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <ChunkyButton className="!px-4 !py-2.5 !text-sm" disabled={busyId === kit.id} onClick={() => void host(kit)}>
                    {busyId === kit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gamepad2 className="h-4 w-4" />}{t('kit.host')}
                  </ChunkyButton>
                  <button type="button" onClick={() => setEditing(kit)} aria-label={t('kit.editNamed', { title: kit.title })} className="rounded-xl p-2.5 text-zinc-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void duplicate(kit)} disabled={busyId === kit.id} aria-label={t('kit.duplicateNamed', { title: kit.title })} className="rounded-xl p-2.5 text-zinc-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"><Copy className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(kit)} disabled={busyId === kit.id} aria-label={t('kit.deleteNamed', { title: kit.title })} className="ml-auto rounded-xl p-2.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>;
            })}
          </ul>}
    {editing && <KitEditor kit={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
      onSaved={saved => { setKits(items => [saved, ...(items ?? []).filter(item => item.id !== saved.id)]); setEditing(null); }} />}
  </section>;
}

function KitEditor({ kit, onClose, onSaved }: { kit: GameKit | null; onClose: () => void; onSaved: (kit: GameKit) => void }) {
  const { t } = useUiLang();
  const message = useWordMessage();
  const [title, setTitle] = useState(kit?.title ?? '');
  const [modes, setModes] = useState<GameKind[]>(kit ? kitModes(kit) : ['quiz']);
  const [teams, setTeams] = useState(kit?.teams ?? false);
  const [hostSpeaks, setHostSpeaks] = useState(kit?.hostSpeaks ?? true);
  const [color, setColor] = useState(kit?.color ?? 'sky');
  const [emoji, setEmoji] = useState(kit?.emoji ?? '🎮');
  const [rows, setRows] = useState<WordRow[]>(() => rowsFromWords(kit?.words ?? []));
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError(''); setTried(true);
    if (!title.trim()) { setError(t('kit.needTitle')); return; }
    const check = checkWordRows(rows);
    const problem = message(check);
    if (problem) { setError(problem); return; }
    if (!modes.length) { setError(t('game.pick.none')); return; }
    setBusy(true);
    try {
      onSaved(await apiRequest<GameKit>('/api/game-kits', { method: 'POST', body: JSON.stringify({
        id: kit?.id, title, mode: modes[0], modes, teams, hostSpeaks, words: check.words, color, emoji,
      }) }));
    } catch (e) { setError(e instanceof ApiError ? e.message : t('class.live.connection')); }
    finally { setBusy(false); }
  };

  return <DialogSurface label={t(kit ? 'kit.editTitle' : 'kit.new')} onClose={onClose}
    className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
    <form onSubmit={event => { event.preventDefault(); void save(); }}
      className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto overflow-x-hidden rounded-t-3xl border-2 border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl">
      <h2 className="font-serif text-xl font-extrabold">{t(kit ? 'kit.editTitle' : 'kit.new')}</h2>
      <label className="block">
        <span className="mb-1.5 block font-serif font-extrabold">{t('kit.name')}</span>
        <input className={field} value={title} maxLength={80} onChange={event => setTitle(event.target.value)} placeholder={t('kit.namePlaceholder')} />
      </label>
      <WordSetBuilder rows={rows} onChange={setRows} showProblems={tried} />
      <GamePicker value={modes} onChange={setModes} />
      <GameOptions modes={modes} teams={teams} onTeams={setTeams} hostSpeaks={hostSpeaks} onHostSpeaks={setHostSpeaks} />
      <fieldset>
        <legend className="mb-1.5 font-serif font-extrabold">{t('kit.cover')}</legend>
        <div className="flex flex-wrap gap-2">
          {KIT_COLORS.map(id => <label key={id} className="relative cursor-pointer has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sky-400 rounded-full">
            <input type="radio" name="kit-color" className="sr-only" checked={color === id} onChange={() => setColor(id)} aria-label={id} />
            <span className={`block h-9 w-9 rounded-full ${SWATCH[id]} ${color === id ? 'ring-4 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900' : ''}`} />
          </label>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EMOJIS.map(item => <button key={item} type="button" aria-pressed={emoji === item} onClick={() => setEmoji(item)}
            className={`h-10 w-10 rounded-xl border-2 text-xl ${emoji === item ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800' : 'border-slate-200 dark:border-zinc-700'}`}>{item}</button>)}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="flex gap-3">
        <ChunkyButton type="submit" className="flex-1" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('kit.save')}</ChunkyButton>
        <ChunkyButton type="button" tone="secondary" onClick={onClose}>{t('action.cancel')}</ChunkyButton>
      </div>
    </form>
  </DialogSurface>;
}
