import React, { useState } from 'react';
import { useUiLang } from '../../contexts/UiLangContext';
import { setPrefs, useSmartyPrefs } from '../../lib/smarty/prefs';
import { playSound } from '../../lib/audio';
import { configureBackgroundReminder, disableBackgroundReminder } from '../../lib/pushReminders';
import { reminderSupport, requestReminderPermission } from '../../lib/reminders';

const DEFAULT_REMINDER_TIME = '19:00';


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

/** Sound, touch and notification preferences. */
export function SmartySettingsCard() {
  const { t } = useUiLang();
  const prefs = useSmartyPrefs();

  const [reminderNote, setReminderNote] = useState('');
  const [busy, setBusy] = useState(false);
  const saveReminder = async (time?: string) => {
    setBusy(true);
    try {
      if (time) await configureBackgroundReminder(time);
      else await disableBackgroundReminder();
      setPrefs({ reminderTime: time });
      setReminderNote('');
    } catch { setReminderNote(t('update.reminderUnavailable')); }
    finally { setBusy(false); }
  };
  const toggleReminder = async (on: boolean) => {
    setReminderNote('');
    if (!on) { await saveReminder(); return; }
    const result = await requestReminderPermission();
    if (result === 'granted') await saveReminder(prefs.reminderTime || DEFAULT_REMINDER_TIME);
    else setReminderNote(t(result === 'unsupported' || reminderSupport() === 'unsupported' ? 'settings.smarty.reminder.unsupported' : 'settings.smarty.reminder.blocked'));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-4 shadow-[0_3px_0_0_#e2e8f0] dark:shadow-[0_3px_0_0_#27272a]">
      <Row title={t('settings.smarty.sound')} desc={t('settings.smarty.sound.desc')}>
        <Toggle on={prefs.sound} label={t('settings.smarty.sound')} onChange={(v) => { setPrefs({ sound: v }); if (v) playSound('success'); }} />
      </Row>
      <Row title={t('update.autoplayVoice')}>
        <Toggle on={prefs.autoplayVoice} label={t('update.autoplayVoice')} onChange={value => setPrefs({ autoplayVoice: value })} />
      </Row>
      <Row title={t('settings.smarty.haptics')} desc={t('settings.smarty.haptics.desc')}>
        <Toggle on={prefs.haptics} label={t('settings.smarty.haptics')} onChange={(v) => setPrefs({ haptics: v })} />
      </Row>
      <Row title={t('settings.smarty.reminder')} desc={reminderNote || t('settings.smarty.reminder.desc')}>
        <div className="flex items-center gap-2">
          {prefs.reminderTime && (
            <input
              type="time"
              aria-label={t('settings.smarty.reminder')}
              value={prefs.reminderTime}
              disabled={busy}
              onChange={(e) => { if (e.target.value) void saveReminder(e.target.value); }}
              className="border border-slate-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-lg px-2 py-1.5 text-sm dark:text-zinc-50"
            />
          )}
          <Toggle on={!!prefs.reminderTime} label={t('settings.smarty.reminder')} onChange={value => { if (!busy) void toggleReminder(value); }} />
        </div>
      </Row>
    </div>
  );
}
