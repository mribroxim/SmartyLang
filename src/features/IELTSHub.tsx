import React, { useMemo } from 'react';
import { BookOpen, Headphones, Mic, PenLine } from 'lucide-react';
import { useUiLang } from '../contexts/UiLangContext';
import { completionsOfType, type CompletionRecord } from '../lib/completions';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ScreenShell, HubRow, seCard, seGrid2 } from '../components/ScreenShell';

interface Props {
  navigate: (route: { tab: string; path: string[] }) => void;
  setActiveTab: (tab: string) => void;
}

/** English-only IELTS landing — four skill entry points + band history. */
export function IELTSHub({ navigate, setActiveTab }: Props) {
  const { t } = useUiLang();

  const reading = useMemo(() => completionsOfType('ielts-reading'), []);
  const listening = useMemo(() => completionsOfType('ielts-listening'), []);
  const speaking = useMemo(() => completionsOfType('ielts-speaking'), []);
  const writing = useMemo(() => completionsOfType(['ielts-writing', 'writing-mock']), []);

  const trend = useMemo(() => {
    const rows: { t: number; label: string; band: number; skill: string }[] = [];
    const push = (list: CompletionRecord[], skill: string) => {
      for (const c of list) {
        const band = c.band ?? (typeof c.score === 'number' && c.total === 40
          ? Math.round((1 + (c.score / 40) * 8) * 2) / 2
          : undefined);
        if (band == null) continue;
        rows.push({
          t: c.timestamp,
          label: new Date(c.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          band,
          skill,
        });
      }
    };
    push(reading, 'R');
    push(listening, 'L');
    push(speaking, 'S');
    push(writing, 'W');
    return rows.sort((a, b) => a.t - b.t).slice(-20);
  }, [reading, listening, speaking, writing]);

  const items = [
    {
      key: 'reading',
      label: t('reading.ielts.title'),
      desc: t('reading.ielts.desc'),
      Icon: BookOpen,
      color: 'bg-violet-100 text-violet-600',
      cta: 'text-violet-600',
      onClick: () => setActiveTab('ielts-reading'),
      last: reading[0],
    },
    {
      key: 'listening',
      label: t('listening.ielts.title'),
      desc: t('listening.ielts.desc'),
      Icon: Headphones,
      color: 'bg-blue-100 text-blue-600',
      cta: 'text-blue-600',
      onClick: () => navigate({ tab: 'listening', path: ['ielts'] }),
      last: listening[0],
    },
    {
      key: 'writing',
      label: t('writing.ielts.title'),
      desc: t('writing.academic.descIelts'),
      Icon: PenLine,
      color: 'bg-amber-100 text-amber-700',
      cta: 'text-amber-700',
      onClick: () => navigate({ tab: 'writing', path: ['ielts'] }),
      last: writing[0],
    },
    {
      key: 'speaking',
      label: t('speaking.ielts.title'),
      desc: t('speaking.ielts.desc'),
      Icon: Mic,
      color: 'bg-rose-100 text-rose-600',
      cta: 'text-rose-600',
      onClick: () => navigate({ tab: 'speaking', path: ['ielts'] }),
      last: speaking[0],
    },
  ];

  return (
    <ScreenShell title={t('common.ielts')} subtitle={t('ielts.hub.subtitle')}>
      {trend.length > 1 && (
        <div className={`${seCard} p-4 mb-3`}>
          <h2 className="text-[15px] font-bold text-zinc-900 mb-0.5">Band trend</h2>
          <p className="text-[12px] text-slate-400 mb-2">Recent scored IELTS attempts across skills</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 9]} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="band" stroke="#18181b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className={seGrid2}>
        {items.map(({ key, label, desc, Icon, color, onClick, last }) => (
          <HubRow
            key={key}
            icon={<Icon className="w-6 h-6" />}
            iconClass={color}
            title={label}
            desc={desc}
            meta={
              last
                ? `Last: ${
                    last.score != null && last.total != null
                      ? `${last.score}/${last.total}`
                      : last.band != null
                      ? `Band ${last.band}`
                      : 'Completed'
                  }`
                : undefined
            }
            onClick={onClick}
          />
        ))}
      </div>
    </ScreenShell>
  );
}
