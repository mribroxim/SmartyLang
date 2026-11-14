import { useEffect, useState } from 'react';
import { useUiLang } from '../contexts/UiLangContext';
import { seCard, sePrimary } from '../components/ScreenShell';
import { apiRequest } from '../lib/selfHostedApi';

export function LegalLinks() {
  const { t } = useUiLang();
  return <nav aria-label={t('legal.links')} className="flex flex-wrap justify-center gap-4 p-4 text-sm underline"><a href="#/legal/privacy">{t('legal.privacy.title')}</a><a href="#/legal/terms">{t('legal.terms.title')}</a></nav>;
}
export function LegalPage({ terms = false }: { terms?: boolean }) {
  const { t } = useUiLang();
  const [info, setInfo] = useState({ operator: '', contact: '' });
  useEffect(() => { apiRequest<typeof info>('/api/legal').then(setInfo).catch(() => {}); }, []);
  const sections = terms ? ['use', 'payments', 'ai', 'rights'] : ['data', 'providers', 'children', 'retention', 'rights'];
  return <main className="min-h-dvh bg-white p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"><article className={`${seCard} mx-auto max-w-3xl space-y-6 p-6`}>
    <a href="#/home" className="underline">{t('error.crash.home')}</a>
    <h1 className="font-serif text-3xl font-extrabold">{terms ? t('legal.terms.title') : t('legal.privacy.title')}</h1>
    <p>{t('legal.operator', { operator: info.operator || t('legal.pending') })}</p>
    {sections.map(id => <section key={id}><h2 className="mb-2 text-xl font-bold">{t(`legal.${terms ? 'terms' : 'privacy'}.${id}.title` as any)}</h2><p>{t(`legal.${terms ? 'terms' : 'privacy'}.${id}.body` as any)}</p></section>)}
    <p>{t('legal.contact')} {info.contact ? <a className="underline" href={`mailto:${info.contact}`}>{info.contact}</a> : t('legal.pending')}</p>
    <LegalLinks />
  </article></main>;
}

/** No account fields or OAuth request are shown before this neutral age screen. */
export function AgeGate({ onReady }: { onReady: () => void }) {
  const { t } = useUiLang();
  const [parent, setParent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [contact, setContact] = useState('');
  useEffect(() => { apiRequest<{ contact: string }>('/api/legal').then(v => setContact(v.contact)).catch(() => {}); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget as HTMLFormElement);
    const date = String(fields.get('birthDate') || '');
    const consentCode = String(fields.get('consentCode') || '');
    setBusy(true); setError(false);
    try {
      const [year, month, day] = date.split('-').map(Number);
      const result = await apiRequest<{ ready?: boolean; parentalConsentRequired?: boolean }>(parent ? '/api/safety/parent-consent' : '/api/safety/age', { method: 'POST', body: JSON.stringify(parent ? { code: consentCode } : { year, month, day }) });
      if (result.ready) onReady(); else setParent(!!result.parentalConsentRequired);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-white p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"><form onSubmit={submit} className={`${seCard} w-full max-w-md space-y-5 p-6`}>
    <h1 className="font-serif text-2xl font-extrabold">{t(parent ? 'safety.parent.title' : 'safety.age.title')}</h1>
    <p>{t(parent ? 'safety.parent.body' : 'safety.age.body')}</p>
    {parent ? <><p>{t('safety.parent.contact')} {contact && <a className="underline" href={`mailto:${contact}`}>{contact}</a>}</p><label className="block font-bold">{t('safety.parent.code')}<input name="consentCode" required autoComplete="off" value={code} onChange={e => setCode(e.target.value)} className="mt-2 w-full rounded-2xl border-2 bg-transparent p-3" /></label></> : <label className="block font-bold">{t('safety.age.date')}<input name="birthDate" required type="date" className="mt-2 w-full rounded-2xl border-2 bg-transparent p-3" /></label>}
    {error && <p role="alert">{t('safety.error')}</p>}
    <button disabled={busy} className={`${sePrimary} w-full p-3`}>{t('smarty.continue')}</button>
    <LegalLinks />
  </form></main>;
}

export function LegalRouter({ children }: { children: React.ReactNode }) {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const update = () => setHash(location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  return hash.startsWith('#/legal/') ? <LegalPage terms={hash === '#/legal/terms'} /> : <>{children}</>;
}
