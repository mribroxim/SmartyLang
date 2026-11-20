/**
 * Sounds and music for live games and assignments (files in public/sounds/games, CC0 — see CREDITS.md).
 * Everything respects Settings → Smarty → Sound; music has its own host switch on top of that.
 */
import { getPrefs } from './smarty/prefs';

export type GameSfx =
  | 'join' | 'countdown' | 'go' | 'tick' | 'last5' | 'correct' | 'wrong' | 'streak' | 'reveal'
  | 'winner' | 'box' | 'double' | 'steal' | 'bomb' | 'timeup';
export type GameMusic = 'lobby' | 'question';

const GAINS: Record<GameSfx, number> = {
  join: 0.6, countdown: 0.7, go: 0.8, tick: 0.35, last5: 0.55, correct: 0.7, wrong: 0.6, streak: 0.7, reveal: 0.6,
  winner: 0.8, box: 0.7, double: 0.7, steal: 0.7, bomb: 0.8, timeup: 0.6,
};
const MUSIC_GAIN: Record<GameMusic, number> = { lobby: 0.28, question: 0.12 };
const MUSIC_FILE: Record<GameMusic, string> = { lobby: 'lobby-loop', question: 'question-loop' };
const MUSIC_KEY = 'smarty_game_music_off';

const url = (file: string) => `${(import.meta as any).env?.BASE_URL ?? '/'}sounds/games/${file}.mp3`;
const soundOn = () => { try { return getPrefs().sound !== false; } catch { return true; } };

export function isGameMusicOn(): boolean {
  try { return localStorage.getItem(MUSIC_KEY) !== '1'; } catch { return true; }
}
export function setGameMusicOn(on: boolean): void {
  try { if (on) localStorage.removeItem(MUSIC_KEY); else localStorage.setItem(MUSIC_KEY, '1'); } catch { /* private mode */ }
  if (!on) stopGameMusic();
}

const cache = new Map<string, HTMLAudioElement>();
export function playGameSfx(name: GameSfx, volume = 1): void {
  if (typeof Audio === 'undefined' || !soundOn()) return;
  try {
    let base = cache.get(name);
    if (!base) { base = new Audio(url(name)); base.preload = 'auto'; cache.set(name, base); }
    // Clone so overlapping sounds (tick + correct) never cut each other off.
    const node = base.cloneNode() as HTMLAudioElement;
    node.volume = Math.min(1, GAINS[name] * volume);
    void node.play().catch(() => { /* autoplay blocked until the first tap */ });
  } catch { /* ignore */ }
}

let music: { kind: GameMusic; el: HTMLAudioElement } | null = null;
export function startGameMusic(kind: GameMusic): void {
  if (typeof Audio === 'undefined' || !soundOn() || !isGameMusicOn()) { stopGameMusic(); return; }
  if (music?.kind === kind) return;
  stopGameMusic();
  try {
    const el = new Audio(url(MUSIC_FILE[kind]));
    el.loop = true;
    el.volume = MUSIC_GAIN[kind];
    music = { kind, el };
    void el.play().catch(() => { /* retried by the next startGameMusic call after a tap */ if (music?.el === el) music = null; });
  } catch { music = null; }
}
export function stopGameMusic(): void {
  if (!music) return;
  try { music.el.pause(); } catch { /* ignore */ }
  music = null;
}

/** Tone by rank for podium/results screens. */
export const prefersReducedMotion = (): boolean => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};
