import React, { useEffect, useState } from 'react';
import { Smarty } from './Smarty';
import { useUiLang } from '../../contexts/UiLangContext';
import { setPrefs, useSmartyPrefs, type DailyMinutes, type Liveliness } from '../../lib/smarty/prefs';
import { playSound } from '../../lib/audio';
import { emitSmarty } from '../../lib/smarty/bus';

const LIVELINESS: Liveliness[] = ['lively', 'calm', 'off'];
const MINUTES: DailyMinutes[] = [5, 10, 15, 20];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${on ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-slate-200 dark:bg-zinc-700'}`}
    >
      <span className={`w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow absolute top-0.5 transition-all ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-slate-100 dark:border-zinc-800 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{title}</div>
        {desc && <div className="text-xs text-slate-500 dark:text-zinc-400">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

/** Settings → Smarty: how lively the cat is, sounds, vibration, name and daily goal. */
export function SmartySettingsCard({ fallbackName }: { fallbackName?: string }) {
  const { t } = useUiLang();
  const prefs = useSmartyPrefs();
  const [name, setName] = useState(prefs.preferredName ?? '');
  useEffect(() => { setName(prefs.preferredName ?? ''); }, [prefs.preferredName]);

  const mood = prefs.liveliness === 'off' ? 'sleepy' : prefs.liveliness === 'calm' ? 'idle' : 'wave';
  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold border transition active:scale-95 ${active
      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 dark-keep'
      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'}`;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-4 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
      <div className="flex items-center gap-3 mb-3">
        <Smarty mood={mood} size={56} />
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{t('settings.smarty.title')}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{t('settings.smarty.desc')}</p>
        </div>
      </div>

      <Row title={t('settings.smarty.liveliness')} desc={t(`settings.smarty.liveliness.${prefs.liveliness}.desc`)}>
        <div className="flex gap-1.5" role="radiogroup" aria-label={t('settings.smarty.liveliness')}>
          {LIVELINESS.map((l) => (
            <button key={l} type="button" role="radio" aria-checked={prefs.liveliness === l} className={pill(prefs.liveliness === l)} onClick={() => setPrefs({ liveliness: l })}>
              {t(`settings.smarty.liveliness.${l}`)}
            </button>
          ))}
        </div>
      </Row>

      <Row title={t('settings.smarty.name')} desc={t('settings.smarty.name.desc')}>
        <input aria-label={fallbackName || t('settings.smarty.name.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (name.trim() !== (prefs.preferredName ?? '')) { setPrefs({ preferredName: name }); emitSmarty({ type: 'prefs.saved', name: !!name.trim() }); } }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder={fallbackName || t('settings.smarty.name.placeholder')}
          maxLength={40}
          className="w-36 border border-slate-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 dark:text-zinc-50"
        />
      </Row>

      <Row title={t('settings.smarty.minutes')} desc={t('settings.smarty.minutes.desc')}>
        <div className="flex gap-1.5">
          {MINUTES.map((m) => (
            <button key={m} type="button" className={pill(prefs.dailyMinutes === m)} onClick={() => { setPrefs({ dailyMinutes: m }); emitSmarty({ type: 'prefs.saved' }); }}>
              {m}
            </button>
          ))}
        </div>
      </Row>

      <Row title={t('settings.smarty.sound')} desc={t('settings.smarty.sound.desc')}>
        <Toggle on={prefs.sound} label={t('settings.smarty.sound')} onChange={(v) => { setPrefs({ sound: v }); if (v) playSound('success'); }} />
      </Row>
      <Row title={t('settings.smarty.haptics')} desc={t('settings.smarty.haptics.desc')}>
        <Toggle on={prefs.haptics} label={t('settings.smarty.haptics')} onChange={(v) => setPrefs({ haptics: v })} />
      </Row>
      <Row title={t('settings.smarty.seasonal')} desc={t('settings.smarty.seasonal.desc')}>
        <Toggle on={prefs.seasonal} label={t('settings.smarty.seasonal')} onChange={(v) => setPrefs({ seasonal: v })} />
      </Row>
      <Row title={t('settings.smarty.reminder')} desc={t('settings.smarty.reminder.desc')}>
        <input
          type="time"
          value={prefs.reminderTime ?? ''}
          onChange={(e) => setPrefs({ reminderTime: e.target.value || undefined })}
          className="border border-slate-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm dark:text-zinc-50"
        />
      </Row>
    </div>
  );
}
