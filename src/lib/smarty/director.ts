/**
 * The Smarty director: turns events into at most one reaction (sticker + line
 * + where to show it), with no-repeat shuffle bags, cooldowns, priorities and
 * the learner's liveliness setting. Pure apart from Math.random and the clock.
 */
import type { StickerId } from '../../components/stickers/manifest';
import type { UiStringKey } from '../uiStrings';
import type { SoundType } from '../audio';
import type { SmartyEvent, SmartyEventType } from './events';
import { POOLS, TITLES, type PoolName } from './lines';
import { getPrefs, type Liveliness } from './prefs';
import { getSmartyCtx, learnerName } from './context';

export type Surface = 'stage' | 'toast' | 'fullscreen';
export type Priority = 0 | 1 | 2 | 3; // 0 critical … 3 ambient

export interface Reaction {
  id: number;
  sticker: StickerId;
  line: UiStringKey;
  title?: UiStringKey;
  vars: Record<string, string | number>;
  surface: Surface;
  priority: Priority;
  ms: number;
  sound?: SoundType;
  action?: { label: UiStringKey; run: () => void };
  tone?: 'good' | 'soft' | 'warn';
}

export interface DirectorState {
  combo: number;
  wrongStreak: number;
  fastCount: number;
  mistakes: number;
  wrongWords: Set<string>;
  lastFired: Record<string, number>;
  bags: Record<string, number[]>;
  lastStageAt: number;
}

export const newDirectorState = (): DirectorState => ({
  combo: 0, wrongStreak: 0, fastCount: 0, mistakes: 0, wrongWords: new Set(), lastFired: {}, bags: {}, lastStageAt: 0,
});

type Min = 'lively' | 'calm' | 'off';
interface Rule<T extends SmartyEventType = SmartyEventType> {
  id: string;
  on: T;
  when?: (e: Extract<SmartyEvent, { type: T }>, st: DirectorState) => boolean;
  stickers: StickerId[] | ((e: Extract<SmartyEvent, { type: T }>) => StickerId[]);
  pool: PoolName;
  title?: keyof typeof TITLES;
  vars?: (e: Extract<SmartyEvent, { type: T }>, st: DirectorState) => Record<string, string | number>;
  surface: Surface;
  priority: Priority;
  ms: number;
  min: Min;
  cooldownMs?: number;
  chance?: number;
  sound?: SoundType;
  tone?: Reaction['tone'];
  action?: (e: Extract<SmartyEvent, { type: T }>) => Reaction['action'];
}

const isMilestone = (n: number) => n === 3 || n === 5 || (n >= 10 && n % 5 === 0);
const touch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

function r<T extends SmartyEventType>(rule: Rule<T>): Rule { return rule as unknown as Rule; }

const RULES: Rule[] = [
  /* ── answers ── */
  r({ id: 'fixed', on: 'answer', when: (e) => e.correct && !!e.retry, stickers: ['feed.you-fixed-it'], pool: 'fixed', surface: 'stage', priority: 2, ms: 2200, min: 'lively' }),
  r({ id: 'hint', on: 'answer', when: (e) => e.correct && !!e.usedHint, stickers: ['feed.smart-move', 'feed.helpful-hint'], pool: 'hint', surface: 'stage', priority: 2, ms: 2000, min: 'lively' }),
  r({ id: 'closeCall', on: 'answer', when: (e) => e.correct && e.msLeft != null && e.msLeft < 3000, stickers: ['feed.close-call'], pool: 'closeCall', surface: 'stage', priority: 2, ms: 2000, min: 'lively' }),
  r({ id: 'fast', on: 'answer', when: (e, st) => e.correct && st.fastCount >= 2, stickers: ['pers.suspicious'], pool: 'fast', surface: 'stage', priority: 2, ms: 2200, min: 'lively', cooldownMs: 60_000 }),
  r({ id: 'combo', on: 'answer', when: (e, st) => e.correct && isMilestone(st.combo),
    stickers: (_e) => [], pool: 'combo', vars: (_e, st) => ({ n: st.combo }), surface: 'stage', priority: 2, ms: 2600, min: 'lively', tone: 'good' }),
  r({ id: 'correct', on: 'answer', when: (e, st) => e.correct && Date.now() - st.lastStageAt > 5000, chance: 0.3,
    stickers: ['mood.yay', 'feed.purrfect', 'feed.tiny-applause', 'feed.shiny-whiskers', 'feed.nailed-it', 'feed.brilliant', 'pers.excited', 'game.bonus-round'],
    pool: 'correct', surface: 'stage', priority: 3, ms: 2000, min: 'lively', tone: 'good' }),
  r({ id: 'close', on: 'answer', when: (e) => !e.correct && !!e.close, stickers: ['feed.almost-there', 'write.typo-catcher'], pool: 'close', surface: 'stage', priority: 2, ms: 2200, min: 'lively', tone: 'soft' }),
  r({ id: 'dizzy', on: 'answer', when: (e, st) => !e.correct && st.wrongStreak >= 3, stickers: ['mood.dizzy'], pool: 'dizzy', surface: 'stage', priority: 2, ms: 2800, min: 'lively', cooldownMs: 30_000, tone: 'soft' }),
  r({ id: 'facepalm', on: 'answer', when: (e, st) => !e.correct && !!e.word && st.wrongWords.has(e.word.toLowerCase()), stickers: () => getPrefs().liveliness === 'lively' ? ['pers.facepalm', 'pers.judging-you'] : ['pers.facepalm'], pool: 'facepalm', surface: 'stage', priority: 2, ms: 2200, min: 'lively', cooldownMs: 20_000, tone: 'soft' }),
  r({ id: 'oopsie', on: 'answer', when: (e, st) => !e.correct && st.mistakes === 1, stickers: ['feed.oopsie'], pool: 'oopsie', surface: 'stage', priority: 2, ms: 2200, min: 'lively', tone: 'soft' }),
  r({ id: 'wrong', on: 'answer', when: (e) => !e.correct, stickers: ['feed.not-quite', 'mood.teary', 'feed.try-again'], pool: 'wrong', surface: 'stage', priority: 2, ms: 2300, min: 'lively', cooldownMs: 1200, tone: 'soft' }),

  /* ── sessions ── */
  r({ id: 'complete', on: 'session.complete',
    stickers: (e) => e.perfect ? ['mood.perfect-score', 'achieve.golden-paw', 'achieve.trophy-lift'] : (e.accuracy != null && e.accuracy < 50) ? ['pers.awkward'] : ['mood.party-time', 'flow.finish-line', 'reward.snack-time', 'achieve.xp-collector'],
    pool: 'complete', surface: 'stage', priority: 1, ms: 3400, min: 'lively', tone: 'good', sound: undefined }),

  /* ── streaks, goals, rewards ── */
  r({ id: 'streakMilestone', on: 'streak.milestone',
    stickers: (e) => e.n >= 365 ? ['achieve.medal-ceremony'] : e.n >= 100 ? ['streak.100-day-streak'] : e.n >= 30 ? ['streak.30-day-streak'] : ['streak.7-day-streak'],
    pool: 'streakMilestone', title: 'streak', vars: (e) => ({ n: e.n }), surface: 'fullscreen', priority: 1, ms: 0, min: 'off', sound: 'level-up' }),
  r({ id: 'streakKept', on: 'streak.kept', stickers: ['pers.happy-purr', 'streak.streak-growing', 'streak.daily-check-in'], pool: 'streakKept', vars: (e) => ({ n: e.n }), surface: 'toast', priority: 3, ms: 3200, min: 'lively', tone: 'good' }),
  r({ id: 'streakLost', on: 'streak.lost', stickers: () => getPrefs().liveliness === 'lively' ? ['pers.dramatic-cry'] : ['mood.grumpy'],
    pool: 'streakLost', title: 'streakLost', vars: (e) => ({ n: e.prev }), surface: 'toast', priority: 1, ms: 5000, min: 'calm', tone: 'soft' }),
  r({ id: 'freeze', on: 'streak.freezeUsed', stickers: ['streak.streak-saved'], pool: 'freeze', title: 'freeze', surface: 'toast', priority: 1, ms: 4000, min: 'calm', tone: 'good' }),
  r({ id: 'levelUp', on: 'xp.levelUp', stickers: ['pose.reach', 'achieve.level-up'], pool: 'levelUp', title: 'levelUp', vars: (e) => ({ n: e.level }), surface: 'fullscreen', priority: 1, ms: 0, min: 'off', sound: 'level-up' }),
  r({ id: 'badge', on: 'badge', stickers: ['achieve.achievement-unlocked', 'reward.badge-earned', 'achieve.medal-ceremony'], pool: 'badge', title: 'badge', surface: 'toast', priority: 1, ms: 4200, min: 'off', tone: 'good', sound: 'complete' }),
  r({ id: 'league', on: 'league.promoted', stickers: ['achieve.rank-promotion', 'social.leaderboard-climb'], pool: 'league', title: 'league', vars: (e) => ({ league: e.to }), surface: 'fullscreen', priority: 1, ms: 0, min: 'off', sound: 'level-up' }),
  r({ id: 'cert', on: 'certificate', stickers: ['sig.the-constellation-cat'], pool: 'cert', title: 'cert', vars: (e) => ({ level: e.level }), surface: 'fullscreen', priority: 1, ms: 0, min: 'off', sound: 'level-up' }),
  r({ id: 'premium', on: 'premium.activated', stickers: ['premium.royal-treatment', 'premium.premium-unlocked'], pool: 'premium', title: 'premium', surface: 'fullscreen', priority: 1, ms: 0, min: 'off', sound: 'level-up' }),

  /* ── hearts ── */
  r({ id: 'heartsLast', on: 'hearts.lost', when: (e) => e.left === 1, stickers: ['mood.teary'], pool: 'heartsLast', surface: 'stage', priority: 2, ms: 2600, min: 'lively', tone: 'warn' }),
  r({ id: 'heartsLost', on: 'hearts.lost', stickers: ['mood.teary'], pool: 'heartsLost', vars: (e) => ({ n: e.left }), surface: 'stage', priority: 2, ms: 2300, min: 'lively', cooldownMs: 1500, tone: 'warn' }),
  r({ id: 'heartsRefill', on: 'hearts.refill', stickers: ['reward.snack-time', 'achieve.diamond-eyes'], pool: 'heartsRefill', title: 'heartsRefill', vars: (e) => ({ n: e.n }), surface: 'toast', priority: 2, ms: 3000, min: 'calm', tone: 'good' }),

  /* ── words & languages ── */
  r({ id: 'saved', on: 'vocab.saved', stickers: ['mood.smitten'], pool: 'saved', title: 'saved', vars: (e) => ({ word: e.word }), surface: 'toast', priority: 3, ms: 2600, min: 'calm', cooldownMs: 15_000, tone: 'good' }),
  r({ id: 'removed', on: 'vocab.removed', stickers: ['state.oops-deleted'], pool: 'removed', title: 'removed', vars: (e) => ({ word: e.word }), surface: 'toast', priority: 3, ms: 4500, min: 'calm',
    action: (e) => e.undo ? { label: 'smarty.undo', run: e.undo } : undefined }),
  r({ id: 'vocabFish', on: 'vocab.milestone', when: (e) => e.n % 25 === 0, stickers: ['sig.the-vocabulary-fish'], pool: 'vocabMilestone', title: 'vocabMilestone', vars: (e) => ({ n: e.n }), surface: 'fullscreen', priority: 1, ms: 0, min: 'calm' }),
  r({ id: 'vocabMilestone', on: 'vocab.milestone', stickers: ['vocab.word-collector', 'vocab.word-garden', 'vocab.word-unlocked'], pool: 'vocabMilestone', title: 'vocabMilestone', vars: (e) => ({ n: e.n }), surface: 'toast', priority: 2, ms: 3600, min: 'calm', tone: 'good' }),
  r({ id: 'lang', on: 'lang.switch', stickers: ['sig.the-language-portal'], pool: 'lang', title: 'lang', vars: (e) => ({ lang: e.to }), surface: 'fullscreen', priority: 1, ms: 5200, min: 'calm' }),

  /* ── app states ── */
  r({ id: 'offline', on: 'net', when: (e) => !e.online, stickers: ['state2.offline-kitty'], pool: 'offline', title: 'offline', surface: 'toast', priority: 0, ms: 6000, min: 'off', tone: 'warn' }),
  r({ id: 'online', on: 'net', when: (e) => e.online, stickers: ['state2.back-online'], pool: 'online', title: 'online', surface: 'toast', priority: 0, ms: 2800, min: 'off', tone: 'good' }),
  r({ id: 'error', on: 'error', stickers: ['pose.spooked'], pool: 'error', title: 'error', surface: 'toast', priority: 0, ms: 5000, min: 'off', cooldownMs: 8000, tone: 'warn' }),

  /* ── idle & easter eggs ── */
  r({ id: 'idleDream', on: 'idle', when: (e) => e.where === 'page' && e.ms >= 180_000, stickers: ['egg.fish-dream', 'pose.snooze', 'pose.belly-up'], pool: 'dream', surface: 'stage', priority: 3, ms: 6000, min: 'lively', cooldownMs: 600_000 }),
  r({ id: 'idlePage', on: 'idle', when: (e) => e.where === 'page' && e.ms >= 60_000, stickers: () => touch() ? ['egg.screen-tap'] : ['egg.cursor-hunter', 'egg.tail-typing', 'egg.paw-prints', 'egg.invisible-wall', 'pose.sneaky'], pool: 'idlePage', surface: 'stage', priority: 3, ms: 5000, min: 'lively', cooldownMs: 300_000 }),
  r({ id: 'idleSession', on: 'idle', when: (e) => e.where === 'session', stickers: ['pers.daydreaming', 'pers.bored'], pool: 'idleSession', surface: 'stage', priority: 3, ms: 4000, min: 'lively', cooldownMs: 120_000 }),
  r({ id: 'innocent', on: 'tap.smarty', when: (e) => e.count === 3, stickers: ['pers.fake-innocence', 'pose.belly-up'], pool: 'meow', surface: 'stage', priority: 3, ms: 3000, min: 'lively', cooldownMs: 60_000 }),
  r({ id: 'tinySneeze', on: 'return', when: (e) => e.daysAway >= 14, stickers: ['egg.tiny-sneeze'], pool: 'returnBack', surface: 'toast', priority: 2, ms: 4500, min: 'calm' }),
  r({ id: 'returnBack', on: 'return', when: (e) => e.daysAway >= 3, stickers: ['streak.back-in-action'], pool: 'returnBack', surface: 'toast', priority: 2, ms: 4000, min: 'calm', tone: 'good' }),
  r({ id: 'prefsName', on: 'prefs.saved', when: (e) => !!e.name, stickers: ['pers.shy'], pool: 'prefsName', surface: 'toast', priority: 3, ms: 3000, min: 'calm', tone: 'good' }),
  r({ id: 'prefsSaved', on: 'prefs.saved', stickers: ['state2.saved'], pool: 'prefsSaved', surface: 'toast', priority: 3, ms: 2400, min: 'calm', cooldownMs: 10_000, tone: 'good' }),
  r({ id: 'update', on: 'app.update', stickers: ['state2.update-available'], pool: 'update', title: 'update', surface: 'toast', priority: 1, ms: 15_000, min: 'off',
    action: () => ({ label: 'smarty.reload', run: () => window.location.reload() }) }),
  r({ id: 'download', on: 'download', stickers: ['state2.download-complete'], pool: 'download', title: 'download', surface: 'toast', priority: 3, ms: 3000, min: 'calm', cooldownMs: 10_000, tone: 'good' }),
  r({ id: 'meow', on: 'tap.smarty', when: (e) => e.count >= 5, stickers: ['egg.secret-meow'], pool: 'meow', surface: 'stage', priority: 3, ms: 3200, min: 'calm', sound: 'meow' }),
  r({ id: 'blink', on: 'tap.smarty', when: (e) => e.count === 1 && getSmartyCtx().streak >= 7, chance: 0.5, stickers: ['egg.slow-blink'], pool: 'blink', surface: 'stage', priority: 3, ms: 3600, min: 'lively', cooldownMs: 120_000 }),
];

const COMBO_STICKER = (n: number): StickerId => n >= 20 && n % 10 === 0 ? 'achieve.rocket-cat' : n === 15 ? 'game.time-attack' : n === 3 ? (getPrefs().liveliness === 'lively' ? 'feed.victory-dance' : 'feed.triple-correct') : n === 5 ? 'feed.paw-five' : 'feed.combo-spin';

const LIVE_RANK: Record<Liveliness, number> = { off: 0, calm: 1, lively: 2 };
const MIN_RANK: Record<Min, number> = { off: 0, calm: 1, lively: 2 };

function fromBag<T>(st: DirectorState, key: string, items: T[]): T {
  if (items.length <= 1) return items[0];
  let bag = st.bags[key];
  if (!bag || !bag.length) {
    bag = items.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    st.bags[key] = bag;
  }
  return items[bag.pop()!];
}

/** Pick a line, preferring {name} lines ~40% of the time when the name is known. */
export function pickLine(st: DirectorState, pool: PoolName): UiStringKey {
  const p = POOLS[pool] as { plain: UiStringKey[]; named?: UiStringKey[] };
  if (p.named?.length && learnerName() && Math.random() < 0.4) return fromBag(st, `${pool}:named`, p.named);
  return fromBag(st, pool, p.plain);
}

let nextId = 1;

/** Update counters for the event, then return the best reaction (or null). */
export function decide(e: SmartyEvent, st: DirectorState, now = Date.now()): Reaction | null {
  if (e.type === 'answer') {
    if (e.correct) {
      st.combo += 1; st.wrongStreak = 0;
      st.fastCount = e.ms != null && e.ms < 1000 ? st.fastCount + 1 : 0;
    } else {
      st.combo = 0; st.wrongStreak += 1; st.mistakes += 1; st.fastCount = 0;
    }
  } else if (e.type === 'session.start' || e.type === 'session.complete') {
    st.combo = 0; st.wrongStreak = 0; st.mistakes = 0; st.fastCount = 0; st.wrongWords.clear();
  }

  const live = LIVE_RANK[getPrefs().liveliness];
  let picked: Reaction | null = null;
  for (const rule of RULES) {
    if (rule.on !== e.type) continue;
    if (rule.when && !rule.when(e as never, st)) continue;
    if (live < MIN_RANK[rule.min]) continue;
    if (rule.cooldownMs && now - (st.lastFired[rule.id] ?? 0) < rule.cooldownMs) continue;
    if (rule.chance != null && Math.random() > rule.chance) break; // this event's best rule declined
    const list = typeof rule.stickers === 'function' ? (rule.stickers as (x: SmartyEvent) => StickerId[])(e) : rule.stickers;
    const sticker = rule.id === 'combo' ? COMBO_STICKER(st.combo) : fromBag(st, `s:${rule.id}`, list);
    const name = learnerName();
    picked = {
      id: nextId++,
      sticker,
      line: pickLine(st, rule.pool),
      title: rule.title ? TITLES[rule.title] : undefined,
      vars: { ...(name ? { name } : {}), ...(rule.vars ? rule.vars(e as never, st) : {}) },
      surface: rule.surface,
      priority: rule.priority,
      ms: rule.ms,
      sound: rule.sound,
      tone: rule.tone,
      action: rule.action ? rule.action(e as never) : undefined,
    };
    st.lastFired[rule.id] = now;
    break;
  }

  // Remember wrong words after matching so "facepalm" fires on the *second* miss.
  if (e.type === 'answer' && !e.correct && e.word) st.wrongWords.add(e.word.toLowerCase());
  if (picked?.surface === 'stage') st.lastStageAt = now;
  return picked;
}
