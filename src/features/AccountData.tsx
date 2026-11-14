import { useState } from 'react';
import { useUiLang } from '../contexts/UiLangContext';
import { Sheet } from '../components/feedback/Sheet';
import { seCard, sePrimary } from '../components/ScreenShell';
import { apiRequest } from '../lib/selfHostedApi';
import { LegalLinks } from './Legal';
import { getStorageUid } from '../lib/userStorage';

export function AccountData() {
  const { t } = useUiLang();
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function remove(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(false);
    try {
      await apiRequest('/api/account', { method: 'DELETE', body: JSON.stringify({ email, password }) });
      // Delete account-scoped caches and persisted practice data on this device.
      const prefix = `smarty_${getStorageUid()}_`;
      for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
      sessionStorage.clear();
      location.replace('/#/home'); location.reload();
    } catch { setError(true); setBusy(false); }
  }
  return <section className={`${seCard} space-y-3 p-4`}><h2 className="font-serif text-lg font-extrabold">{t('account.data.title')}</h2>
    <a className="block underline" href="/api/account/export" download>{t('account.export')}</a>
    <button type="button" className="font-bold text-rose-700 dark:text-rose-300" onClick={() => setDeleting(true)}>{t('account.delete')}</button>
    <LegalLinks />
    {deleting && <Sheet titleId="delete-account-title" onClose={() => setDeleting(false)}><form className="space-y-4" onSubmit={remove}>
      <h2 id="delete-account-title" className="font-serif text-xl font-extrabold">{t('account.delete')}</h2><p>{t('account.delete.body')}</p>
      <label className="block">{t('account.delete.email')}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-2xl border-2 bg-transparent p-3" /></label>
      <label className="block">{t('account.delete.password')}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full rounded-2xl border-2 bg-transparent p-3" /></label>
      {error && <p role="alert">{t('account.data.error')}</p>}
      <button disabled={busy} className={`${sePrimary} w-full p-3`}>{t('account.delete.confirm')}</button><button type="button" onClick={() => setDeleting(false)}>{t('a11y.close')}</button>
    </form></Sheet>}
  </section>;
}
