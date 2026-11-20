import { Avatar, useFriendPopups } from './Friends';
import { ChallengesBanner } from './Challenge/ChallengesSection';
import { EmptyState } from '../components/feedback/EmptyState';
import { mergeClassBoard, type HomeworkRow, type LiveTotals } from '../lib/classBoard';
import { LeagueLadder } from '../components/LeagueTrophy';
import { useUiLang } from '../contexts/UiLangContext';
import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, Flame, Loader2, Clock, Users } from 'lucide-react';
import {
  getGlobalLeagueLeaderboard,
  sortWeeklyLeagueRows,
  type StudentSummary,
} from '../firebase';
import { type HabitState, normalizeHabit, isoWeekKey, leagueMeta, leagueZones, msUntilWeekEnd, leagueForXp } from '../lib/habitEngine';
import { ScreenShell, seCard } from '../components/ScreenShell';
import { dataRequest } from '../lib/selfHostedApi';

export type BoardScope = 'global' | 'friends' | 'class';
export interface BoardClass { id: string; name: string }

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
  classes,
  boardScope,
  onSelectScope,
  onOpenFriends,
}: {
  profile?: { xp?: number; coins?: number; level?: number; league?: string; name?: string };
  habit?: HabitState;
  uid?: string;
  displayName?: string;
  /** Classes the user is in (or teaches); the Class tab only exists when there is at least one. */
  classes: BoardClass[];
  boardScope: BoardScope;
  onSelectScope: (scope: BoardScope) => void;
  onOpenFriends: () => void;
}) {
  const { t, tText } = useUiLang();
  const { openProfile, popups } = useFriendPopups();
  const [rows, setRows] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [boardError, setBoardError] = useState(false);
  const [revision] = useState(0);
  const [remaining, setRemaining] = useState(() => msUntilWeekEnd());
  const h = normalizeHabit(habit);
  const week = isoWeekKey();

  const leagueId = profile?.league || leagueForXp(profile?.xp || 0);
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
    if (!uid || boardScope === 'class') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setBoardError(false);
      try {
        if (boardScope === 'global') {
          const ranked = await getGlobalLeagueLeaderboard(leagueId, week, {
            max: 50,
            includeUid: uid,
          });
          if (!cancelled) {
            setRows(ranked);
          }
          return;
        }

        const summaries = await dataRequest<StudentSummary[]>('summary.circle', { scope: boardScope, weekKey: week });
        const ranked = sortWeeklyLeagueRows(summaries, week);
        if (!cancelled) setRows(ranked);
      } catch {
        if (!cancelled) { setRows([]); setBoardError(true); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, week, boardScope, leagueId, revision]);

  const zones = useMemo(() => leagueZones(boardScope === 'global' ? rows.length : 0), [rows.length, boardScope]);

  return (
    <ScreenShell stickers={['reward.champion', 'social.friendly-rivalry', 'social.leaderboard-climb']} title={t('nav.league')}>
      <div className="mb-4 flex flex-wrap gap-2" aria-label={t('nav.league')}>
        {(['global', 'friends', ...(classes.length ? ['class'] : [])] as BoardScope[]).map(scope => (
          <button key={scope} type="button" aria-pressed={scope === boardScope}
            onClick={() => { if (boardScope !== scope) { setRows([]); onSelectScope(scope); } }}
            className="min-h-10 rounded-xl border-2 border-zinc-200 px-4 py-2 font-serif font-extrabold shadow-[0_3px_0_0_#e4e4e7] aria-pressed:border-zinc-900 aria-pressed:shadow-[0_3px_0_0_#18181b] dark:border-zinc-700 dark:shadow-[0_3px_0_0_#3f3f46] dark:aria-pressed:border-zinc-100 dark:aria-pressed:shadow-[0_3px_0_0_#e4e4e7]">
            {scope === 'friends' ? t('update.friends') : t(scope === 'class' ? 'league.scope.class' : 'league.scope.global')}
          </button>
        ))}
      </div>
      <ChallengesBanner onOpen={onOpenFriends} />
      {boardScope === 'friends' && !loading && !boardError && rows.length === 0 && (
        <div className={`${seCard} mb-3`}>
          <EmptyState sticker="social.friend-request" title={t('fr.empty.title')} body={t('fr.empty.body')} className="py-8"
            action={{ label: t('fr.add'), onClick: onOpenFriends }} />
        </div>
      )}
      {boardScope === 'friends' && rows.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onOpenFriends} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-zinc-200 px-3 font-serif text-sm font-extrabold dark:border-zinc-700"><Users className="h-4 w-4" aria-hidden />{t('fr.manage')}</button>
        </div>
      )}
      {boardScope === 'class' && classes.length > 0 && uid && (
        <div className="space-y-6">{classes.map(cls => <ClassBoard key={cls.id} cls={cls} uid={uid} showTitle={classes.length > 1} />)}</div>
      )}
      {/* the five leagues */}
      {boardScope === 'global' && <div className={`${seCard} px-2 pb-3 pt-4`}>
        <LeagueLadder current={leagueId} label={id => tText(leagueMeta(id).label)}
          currentCaption={`${myWeekly} ${t('site.league.weekXp')}`} />
      </div>}

      {boardScope === 'global' && <p className="mt-4 flex items-center justify-end gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        <Clock className="h-3.5 w-3.5" />{t('site.league.resetsIn', { time: countdown })}
      </p>}
      {boardScope !== 'class' && !(boardScope === 'friends' && !loading && !boardError && rows.length === 0) && <div className={`${seCard} mt-3 overflow-hidden`}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200">
              {t(boardError ? 'league.scope.error' : 'site.gamification.no_global_rankings_yet_2d06d9')}
            </p>
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
                  <LeaderRow rank={rank} name={name} xp={wx} you={you} streak={s.globalStreak?.current ?? s.streak?.current ?? 0} promote={inPromote} demote={inDemote}
                    onOpen={boardScope === 'friends' && !you && s.uid ? () => openProfile({ uid: s.uid!, name }) : undefined} />
                  {showPromoteDivider && <div className="mx-3.5 h-px bg-slate-100 dark:bg-zinc-800" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>}
      {popups}
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
  onOpen,
}: {
  rank: number;
  name: string;
  xp: number;
  you: boolean;
  streak: number;
  promote: boolean;
  demote: boolean;
  onOpen?: () => void;
}) {
  const { t } = useUiLang();
  const hue = avatarHue(name);
  return (
    <div
      {...(onOpen ? { role: 'button', tabIndex: 0, onClick: onOpen, onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } } } : {})}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 ${onOpen ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 ' : ''}${
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
        <div className={`font-serif font-extrabold text-[13px] truncate ${you ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-900 dark:text-zinc-50'}`}>
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

/** One class's ranking: homework performance plus live-game results. Shown only on this page. */
function ClassBoard({ cls, uid, showTitle }: { cls: BoardClass; uid: string; showTitle: boolean }) {
  const { t } = useUiLang();
  const [data, setData] = useState<{ rows: HomeworkRow[]; totalHomework: number } | null>(null);
  const [live, setLive] = useState<Map<string, LiveTotals> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false); setLive(null);
    dataRequest<{ rows: HomeworkRow[]; totalHomework: number }>('class.board', { classId: cls.id }, { signal: controller.signal })
      .then(setData).catch(() => { if (!controller.signal.aborted) setError(true); });
    // Live-game points are already included by the server's class.board ranking.
    return () => controller.abort();
  }, [cls.id]);
  const rows = useMemo(() => data ? mergeClassBoard(data.rows, live) : [], [data, live]);
  return (
    <section aria-label={cls.name}>
      {showTitle && <h2 className="mb-2 break-words font-serif text-lg font-extrabold">{cls.name}</h2>}
      <div className={`${seCard} overflow-hidden`}>
        {error ? <p role="alert" className="px-4 py-8 text-center text-sm font-bold">{t('league.scope.error')}</p>
          : !data ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
          : rows.every(row => row.total === 0) ? (
            <div className="px-4 py-8 text-center"><Trophy className="mx-auto mb-2 h-8 w-8 text-slate-200" /><p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200">{t('lb.class.empty')}</p></div>
          ) : rows.map((row, i) => {
            const you = row.uid === uid;
            return (
              <div key={row.uid} aria-current={you ? 'true' : undefined} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${you ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
                <RankGlyph rank={i + 1} />
                <Avatar name={row.displayName || '?'} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-[13px] font-extrabold text-zinc-900 dark:text-zinc-50">{row.displayName || t('site.identity.student')}
                    {you && <span className="ml-1.5 align-middle rounded-md bg-zinc-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">{t('site.gamification.you_905cb3')}</span>}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">{t('lb.class.detail', { done: row.homeworkDone, total: data.totalHomework, acc: row.accuracy })}{row.liveGames > 0 ? ` · ${t('lb.class.games', { n: row.liveGames })}` : ''}</div>
                </div>
                <div className="shrink-0 text-[13px] font-black tabular-nums text-zinc-800 dark:text-zinc-200">{row.total} <span className="text-[10px] font-bold text-slate-400">{t('lb.class.pts')}</span></div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
