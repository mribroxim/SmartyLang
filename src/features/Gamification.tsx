import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, Flame, Loader2, Clock, ArrowUp, ArrowDown, Minus, Globe, Users } from 'lucide-react';
import {
  getStudentClasses,
  getStudentSummaries,
  getGlobalLeagueLeaderboard,
  sortWeeklyLeagueRows,
  type StudentSummary,
} from '../firebase';
import {
  BADGE_META,
  type HabitState,
  normalizeHabit,
  isoWeekKey,
  leagueMeta,
  leagueZones,
  msUntilWeekEnd,
  formatWeekCountdown,
  leagueForXp,
} from '../lib/habitEngine';
import { ScreenShell, seCard } from '../components/ScreenShell';

type Tab = 'league' | 'badges';
type BoardScope = 'global' | 'class';

function avatarHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function RankGlyph({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors =
      rank === 1
        ? 'bg-amber-100 text-amber-600'
        : rank === 2
          ? 'bg-slate-200 text-slate-600'
          : 'bg-orange-100 text-orange-700';
    return (
      <span className={`w-8 h-8 flex items-center justify-center rounded-full ${colors}`} aria-label={`Rank ${rank}`}>
        <Medal className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span className="w-8 h-8 flex items-center justify-center font-black text-slate-400 text-sm tabular-nums">
      {rank}
    </span>
  );
}

export function GamificationDash({
  profile,
  habit,
  uid,
  displayName,
}: {
  profile?: { xp?: number; coins?: number; level?: number; league?: string; name?: string };
  habit?: HabitState;
  uid?: string;
  displayName?: string;
}) {
  const [tab, setTab] = useState<Tab>('league');
  const [boardScope, setBoardScope] = useState<BoardScope>('global');
  const [rows, setRows] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() => formatWeekCountdown(msUntilWeekEnd()));
  const h = normalizeHabit(habit);
  const week = isoWeekKey();

  const leagueId = profile?.league || leagueForXp(profile?.xp || 0);
  const league = leagueMeta(leagueId);
  const myWeekly = h.weekKey === week ? h.weeklyXp : 0;
  const myName = displayName || profile?.name || 'You';

  useEffect(() => {
    const tick = () => setCountdown(formatWeekCountdown(msUntilWeekEnd()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (boardScope === 'global') {
          const ranked = await getGlobalLeagueLeaderboard(leagueId, week, {
            max: 50,
            includeUid: uid,
          });
          if (!cancelled) {
            setRows(ranked);
            setClassName(null);
          }
          return;
        }

        const classes = await getStudentClasses(uid);
        const primary = classes[0];
        if (!primary?.studentUids?.length) {
          if (!cancelled) {
            setRows([]);
            setClassName(null);
          }
          return;
        }
        if (!cancelled) setClassName(primary.name || 'Your class');
        const summaries = await getStudentSummaries(primary.studentUids);
        const ranked = sortWeeklyLeagueRows(summaries, week);
        if (!cancelled) setRows(ranked);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, week, boardScope, leagueId]);

  const zones = useMemo(() => leagueZones(rows.length), [rows.length]);

  const myRank = useMemo(() => {
    const idx = rows.findIndex(s => s.uid === uid);
    return idx >= 0 ? idx + 1 : null;
  }, [rows, uid]);

  const myZone = useMemo(() => {
    if (myRank == null || rows.length === 0) return 'none' as const;
    if (zones.promote > 0 && myRank <= zones.promote) return 'promote' as const;
    if (zones.demote > 0 && myRank > rows.length - zones.demote) return 'demote' as const;
    return 'safe' as const;
  }, [myRank, rows.length, zones]);

  const earnedBadges = h.badges || [];

  const zoneLabel =
    myZone === 'promote' ? (
      <span className="inline-flex items-center gap-1 text-emerald-700"><ArrowUp className="w-3.5 h-3.5" /> #{myRank} · promotion</span>
    ) : myZone === 'demote' ? (
      <span className="inline-flex items-center gap-1 text-rose-600"><ArrowDown className="w-3.5 h-3.5" /> #{myRank} · demotion</span>
    ) : myRank != null ? (
      <span className="inline-flex items-center gap-1 text-slate-500"><Minus className="w-3.5 h-3.5" /> #{myRank} · {league.label}</span>
    ) : null;

  const subtitle =
    boardScope === 'global'
      ? `Global ${league.label} league · weekly XP`
      : className
        ? `Class leaderboard · ${className}`
        : 'Weekly XP race with your class';

  return (
    <ScreenShell title="League" subtitle={subtitle}>
      <div className="flex gap-1.5 mb-4 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
        {[
          { id: 'league' as const, label: 'League' },
          { id: 'badges' as const, label: 'Badges' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors ${
              tab === t.id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'league' && (
        <div className="space-y-2.5">
          <div className="flex gap-1.5 bg-slate-50 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
            {([
              { id: 'global' as const, label: 'Global', icon: Globe },
              { id: 'class' as const, label: 'My class', icon: Users },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setBoardScope(id)}
                className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
                  boardScope === id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className={`${seCard} p-3.5 flex items-center gap-3`}>
            <div
              className="league-tile w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ ['--league-soft' as string]: league.soft, ['--league-ink' as string]: league.ink } as React.CSSProperties}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[15px] text-zinc-900 dark:text-zinc-50">{league.label} League</div>
              <div className="text-[12px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {countdown} left</span>
                {zoneLabel && <span>· {zoneLabel}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your XP</div>
              <div className="font-black tabular-nums text-zinc-900 dark:text-zinc-50">{myWeekly}</div>
            </div>
          </div>

          <div className={`${seCard} overflow-hidden`}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Trophy className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="font-bold text-[14px] text-slate-700">
                  {boardScope === 'global' ? 'No global rankings yet' : 'No league mates yet'}
                </p>
                <p className="text-[12px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {boardScope === 'global'
                    ? 'Earn XP this week to appear on the global leaderboard.'
                    : 'Join a class to see your class rankings, or switch to Global.'}
                </p>
              </div>
            ) : (
              <div>
                {zones.promote > 0 && (
                  <ZoneLabel kind="promote" text={`Promotion · top ${zones.promote}`} />
                )}
                {rows.map((s, i) => {
                  const rank = i + 1;
                  const you = s.uid === uid;
                  const wx = s.weekKey === week ? (s.weeklyXp || 0) : 0;
                  const name = you ? myName : (s.displayName || 'Student');
                  const inPromote = zones.promote > 0 && rank <= zones.promote;
                  const inDemote = zones.demote > 0 && rank > rows.length - zones.demote;
                  const showPromoteDivider = zones.promote > 0 && rank === zones.promote;
                  const showDemoteDivider =
                    zones.demote > 0 && rank === rows.length - zones.demote + 1;

                  return (
                    <React.Fragment key={s.uid || i}>
                      {showDemoteDivider && (
                        <ZoneLabel kind="demote" text={`Demotion · bottom ${zones.demote}`} />
                      )}
                      <LeaderRow
                        rank={rank}
                        name={name}
                        xp={wx}
                        you={you}
                        streak={s.globalStreak?.current ?? s.streak?.current ?? 0}
                        promote={inPromote}
                        demote={inDemote}
                      />
                      {showPromoteDivider && <div className="mx-3.5 h-px bg-slate-100 dark:bg-zinc-800" />}
                    </React.Fragment>
                  );
                })}
                <p className="px-3.5 py-3 text-center text-[11px] text-slate-400 leading-snug">
                  {boardScope === 'global'
                    ? 'Top learners worldwide in your league · XP resets Monday'
                    : 'Top move up · bottom drop · XP resets Monday'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(BADGE_META).map(([id, meta]) => {
            const earned = earnedBadges.includes(id);
            return (
              <div
                key={id}
                className={`${seCard} p-3.5 text-left ${
                  earned ? '' : 'opacity-45 grayscale'
                }`}
              >
                <Medal className={`w-5 h-5 mb-2 ${earned ? 'text-amber-600' : 'text-slate-400'}`} />
                <h4 className={`font-bold text-[13px] ${earned ? 'text-zinc-900 dark:text-zinc-50' : 'text-slate-600'}`}>{meta.label}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}

function ZoneLabel({ kind, text }: { kind: 'promote' | 'demote'; text: string }) {
  const promote = kind === 'promote';
  return (
    <div
      className={`px-3.5 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.12em] ${
        promote ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
      }`}
    >
      {text}
    </div>
  );
}

function LeaderRow({
  rank,
  name,
  xp,
  you,
  streak,
  promote,
  demote,
}: {
  rank: number;
  name: string;
  xp: number;
  you: boolean;
  streak: number;
  promote: boolean;
  demote: boolean;
}) {
  const hue = avatarHue(name);
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2.5 ${
        you
          ? 'bg-sky-50 dark:bg-sky-950/40'
          : promote
            ? 'bg-emerald-50/50'
            : demote
              ? 'bg-rose-50/40'
              : ''
      }`}
    >
      <RankGlyph rank={rank} />
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
        style={{ background: `hsl(${hue} 55% 48%)` }}
        aria-hidden
      >
        {(name?.[0] || '?').toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`font-bold text-[13px] truncate ${you ? 'text-sky-950 dark:text-sky-100' : 'text-zinc-900 dark:text-zinc-50'}`}>
          {name}
          {you && (
            <span className="ml-1.5 align-middle text-[9px] font-black uppercase tracking-wide bg-sky-200 text-sky-900 px-1 py-0.5 rounded">
              You
            </span>
          )}
        </div>
        {streak > 0 && (
          <div className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-400" /> {streak}
          </div>
        )}
      </div>
      <div className={`text-[13px] font-black tabular-nums shrink-0 ${you ? 'text-sky-900 dark:text-sky-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
        {xp} <span className="text-[10px] font-bold text-slate-400">XP</span>
      </div>
    </div>
  );
}
