import { useEffect, useMemo, useState } from 'react';
import { useUiLang } from '../../contexts/UiLangContext';
import { loadLocalCompletions, mergeCompletions, type CompletionRecord } from '../../lib/completions';
import { auth } from '../../firebase';
import { dataRequest } from '../../lib/selfHostedApi';
import { buildTimeline, summarize } from '../../lib/activity/model';
import { ActivityTimeline, ActivityStat } from './ActivityTimeline';

/** A learner's own full history (#/profile/settings/activity): local cache plus what the server has. */
export function ActivityHistory() {
  const { t } = useUiLang();
  const [rows, setRows] = useState<CompletionRecord[]>(() => loadLocalCompletions());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const ctl = new AbortController();
    dataRequest<CompletionRecord[]>('completions.list', { uid, limit: 500 }, { signal: ctl.signal })
      .then(cloud => { if (!ctl.signal.aborted) setRows(local => mergeCompletions(cloud, local)); })
      .catch(() => { if (!ctl.signal.aborted) setError(true); })
      .finally(() => { if (!ctl.signal.aborted) setLoading(false); });
    return () => ctl.abort();
  }, []);

  const items = useMemo(() => buildTimeline(rows as never[]), [rows]);
  const month = useMemo(() => summarize(items, Date.now() - 30 * 86_400_000), [items]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('act.subtitle')}</p>
      <div>
        <div className="mb-2 px-1 font-serif text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('act.last30')}</div>
        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
          <ActivityStat label={t('act.stat.sessions')} value={String(month.sessions)} />
          <ActivityStat label={t('act.stat.xp')} value={String(month.xp)} />
          <ActivityStat label={t('act.stat.days')} value={String(month.activeDays)} />
          <ActivityStat label={t('act.stat.accuracy')} value={month.avgAccuracy === null ? '-' : `${month.avgAccuracy}%`} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('act.error')}</p>}
      <ActivityTimeline items={items} loading={loading && items.length === 0} />
    </div>
  );
}
