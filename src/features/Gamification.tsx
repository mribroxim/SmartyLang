import { LeagueTrophy, LeagueLadder } from '../components/LeagueTrophy';
import { useUiLang } from '../contexts/UiLangContext';
import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, Flame, Loader2, Clock, ArrowUp, ArrowDown, Users } from 'lucide-react';
import {
  getStudentClasses,
  getStudentSummaries,
  getGlobalLeagueLeaderboard,
  sortWeeklyLeagueRows,
  type StudentSummary,
} from '../firebase';
import { type HabitState, normalizeHabit, isoWeekKey, leagueMeta, leagueZones, msUntilWeekEnd, leagueForXp } from '../lib/habitEngine';
import { ScreenShell, seCard } from '../components/ScreenShell';

type BoardScope = 'global' | 'class';

function avatarHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function RankGlyph({ rank }: { rank: number }) {
  const { t } = useUiLang();
  if (rank <= 3) {
    const colors =
      rank === 1
        ? 'bg-amber-100 text-amber-600'
        : rank === 2
          ? 'bg-slate-200 text-slate-600'
          : 'bg-orange-100 text-orange-700';
    return (
      <span className={`w-8 h-8 flex items-center justify-center rounded-full ${colors}`} aria-label={t("site.gamification.rank_v1_2b1c7f", {v1: String(rank)})}>
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
  onOpenClass,
}: {
  profile?: { xp?: number; coins?: number; level?: number; league?: string; name?: string };
  habit?: HabitState;
  uid?: string;
  displayName?: string;
  /** Students get a "My class" button under the board. */
  onOpenClass?: () => void;
}) {
  const { t, tText } = useUiLang();
  const boardScope: BoardScope = 'global';
  const [rows, setRows] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(() => msUntilWeekEnd());
  const h = normalizeHabit(habit);
  const week = isoWeekKey();

  const leagueId = profile?.league || leagueForXp(profile?.xp || 0);
  const rawLeague = leagueMeta(leagueId);
  const league = { ...rawLeague, label: tText(rawLeague.label) };
  const myWeekly = h.weekKey === week ? h.weeklyXp : 0;
  const myName = displayName || profile?.name || t('site.identity.you');

  useEffect(() => {
    const tick = () => setRemaining(msUntilWeekEnd());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const countdown = days > 0
    ? t('site.duration.daysHours', { days, hours })
    : t('site.duration.hoursMinutes', { hours, minutes });

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
        if (!cancelled) setClassName(primary.name || t('site.identity.yourClass'));
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


  const zoneLabel =
    myZone === 'promote' ? (
      <span className="inline-flex items-center gap-1 text-emerald-700"><ArrowUp className="w-3.5 h-3.5" /> #{myRank}  {t("site.gamification.promotion_06f5ba")}</span>
    ) : myZone === 'demote' ? (
      <span className="inline-flex items-center gap-1 text-rose-600"><ArrowDown className="w-3.5 h-3.5" /> #{myRank}  {t("site.gamification.demotion_5e04af")}</span>
    ) : myRank != null ? (
      <span className="text-slate-500">#{myRank}</span>
    ) : null;

    boardScope === 'global'
      ? t('site.league.globalSubtitle', { league: league.label })
      : className
        ? t('site.league.classSubtitle', { name: className })
        : t('site.league.classRace');

  return (
    <ScreenShell stickers={['reward.champion', 'social.friendly-rivalry', 'social.leaderboard-climb']} title={t('nav.league')} subtitle={t('site.league.globalSubtitle', { league: league.label })}>
      {/* the five leagues */}
      <div className={`${seCard} px-2 pb-3 pt-4`}>
        <LeagueLadder current={league.id} label={(id) => tText(leagueMeta(id).label)} />
      </div>

      {/* where you stand this week */}
      <div className={`${seCard} mt-3 flex items-center gap-3 p-3.5`}>
        <LeagueTrophy id={league.id} size={48} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[17px] font-extrabold text-zinc-900 dark:text-zinc-50">{t('site.league.name', { league: league.label })}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t('site.league.resetsIn', { time: countdown })}</span>
            {zoneLabel && <span>· {zoneLabel}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-serif text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">{myWeekly}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('site.league.weekXp')}</div>
        </div>
      </div>

      {/* the board */}
      <div className={`${seCard} mt-3 overflow-hidden`}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200">{t('site.gamification.no_global_rankings_yet_2d06d9')}</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] text-slate-400">{t('site.gamification.earn_xp_this_week_to_6d3ba1')}</p>
          </div>
        ) : (
          <div>
            {zones.promote > 0 && <ZoneLabel kind="promote" text={t('site.gamification.promotion_top_v1_5f7395', { v1: String(zones.promote) })} />}
            {rows.map((s, i) => {
              const rank = i + 1;
              const you = s.uid === uid;
              const wx = s.weekKey === week ? (s.weeklyXp || 0) : 0;
              const name = you ? myName : (s.displayName || t('site.identity.student'));
              const inPromote = zones.promote > 0 && rank <= zones.promote;
              const inDemote = zones.demote > 0 && rank > rows.length - zones.demote;
              const showPromoteDivider = zones.promote > 0 && rank === zones.promote;
              const showDemoteDivider = zones.demote > 0 && rank === rows.length - zones.demote + 1;
              return (
                <React.Fragment key={s.uid || i}>
                  {showDemoteDivider && <ZoneLabel kind="demote" text={t('site.gamification.demotion_bottom_v1_34d44f', { v1: String(zones.demote) })} />}
                  <LeaderRow rank={rank} name={name} xp={wx} you={you} streak={s.globalStreak?.current ?? s.streak?.current ?? 0} promote={inPromote} demote={inDemote} />
                  {showPromoteDivider && <div className="mx-3.5 h-px bg-slate-100 dark:bg-zinc-800" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {onOpenClass && (
        <button type="button" onClick={onOpenClass}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3 font-serif text-[13px] font-extrabold uppercase tracking-wide text-zinc-700 shadow-[0_3px_0_0_#e2e8f0] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[0_3px_0_0_#3f3f46]">
          <Users className="h-4 w-4" />{t('site.league.myClass')}
        </button>
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
  const { t } = useUiLang();
  const hue = avatarHue(name);
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2.5 ${
        you
          ? 'bg-zinc-100 dark:bg-zinc-800'
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
        <div className={`font-bold text-[13px] truncate ${you ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-900 dark:text-zinc-50'}`}>
          {name}
          {you && (
            <span className="ml-1.5 align-middle text-[9px] font-black uppercase tracking-wide bg-zinc-900 text-white px-1.5 py-0.5 rounded-md dark:bg-zinc-100 dark:text-zinc-900">
              {t("site.gamification.you_905cb3")}</span>
          )}
        </div>
        {streak > 0 && (
          <div className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-400" /> {streak}
          </div>
        )}
      </div>
      <div className={`text-[13px] font-black tabular-nums shrink-0 ${you ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
        {xp} <span className="text-[10px] font-bold text-slate-400">XP</span>
      </div>
    </div>
  );
}
