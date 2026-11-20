import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Loader2, RefreshCw, Share2, Users } from 'lucide-react';
import { auth, joinClassWithCode } from '../firebase';
import { useUiLang } from '../contexts/UiLangContext';
import { isFriendCode, LEGACY_FRIEND_CODE_LENGTH, normalizeFriendCode } from '../lib/friendCode';
import { announceClassesChanged, useMyClasses } from '../lib/useMyClasses';
import { useFriends } from './FriendsApi';

const card = 'rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_3px_0_0_#e2e8f0] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#27272a]';
const input = 'min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100';
const solid = 'dark-keep inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 font-serif text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_0_#000] active:translate-y-[3px] active:shadow-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900';
const ghost = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 px-3 font-serif text-[13px] font-extrabold dark:border-zinc-700';
const heading = 'mb-2 px-1 font-serif text-xs font-extrabold uppercase tracking-widest text-slate-400';

/** Settings → Friends & classes: my friend code, add a friend, join a class, my classes. */
export function FriendsClassesPanel({ role, onOpenFriends, onOpenClasses }: { role?: string; onOpenFriends: () => void; onOpenClasses: () => void }) {
  const { t } = useUiLang();
  const uid = auth?.currentUser?.uid;
  const { data, busy, error, act } = useFriends();
  const isStudent = role === 'student' || role === 'admin';
  const { classes, reload } = useMyClasses(uid, isStudent ? 'student' : role === 'teacher' ? 'teacher' : null);
  const [friendInput, setFriendInput] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ ok: boolean; text: string }>();
  useEffect(() => { if (!sent) return; const id = window.setTimeout(() => setSent(false), 3000); return () => window.clearTimeout(id); }, [sent]);

  const code = normalizeFriendCode(friendInput);
  const myCode = data?.code;
  async function copy() {
    if (!myCode) return;
    try { await navigator.clipboard.writeText(myCode); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }
  async function share() {
    if (!myCode) return;
    const text = t('fr.shareText', { code: myCode });
    try { if (navigator.share) await navigator.share({ text }); else await copy(); } catch { /* cancelled */ }
  }
  async function addFriend() {
    if (busy || !isFriendCode(code)) return;
    if (await act('request', { code })) { setFriendInput(''); setSent(true); }
  }
  async function join() {
    if (!uid || joining || classCode.trim().length < 4) return;
    setJoining(true); setJoinMsg(undefined);
    try {
      const cls = await joinClassWithCode(uid, classCode.trim());
      setJoinMsg({ ok: true, text: t('core.management.joined_name_1c75f0', { name: cls.name }) });
      setClassCode(''); announceClassesChanged(); await reload();
    } catch (e: any) { setJoinMsg({ ok: false, text: e?.message || t('core.management.failed_to_join_class_e880b2') }); }
    finally { setJoining(false); }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className={heading}>{t('fr.myCode')}</h2>
        <div className={card}>
          {myCode ? <p className={`select-all break-all text-center font-serif font-extrabold text-zinc-900 dark:text-zinc-50 ${myCode.length > 8 ? 'text-xl tracking-[0.12em]' : 'text-3xl tracking-[0.25em]'}`} aria-label={t('fr.myCode')}>{myCode}</p>
            : <p className="text-center text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('fr.noCode')}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {myCode && <button type="button" onClick={() => void copy()} className={ghost}>{copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}{copied ? t('fr.copied') : t('fr.copy')}</button>}
            {myCode && <button type="button" onClick={() => void share()} className={ghost}><Share2 className="h-4 w-4" />{t('fr.share')}</button>}
            <button type="button" disabled={busy} onClick={() => void act('code')} className={ghost}><RefreshCw className="h-4 w-4" />{t(myCode ? 'update.newCode' : 'update.getCode')}</button>
          </div>
        </div>
      </section>

      <section>
        <h2 className={heading}>{t('fr.add')}</h2>
        <form className={card} onSubmit={event => { event.preventDefault(); void addFriend(); }}>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <input aria-label={t('update.friendCode')} placeholder={t('update.friendCode')} value={friendInput} autoComplete="off" autoCapitalize="characters" spellCheck={false}
              onChange={event => setFriendInput(normalizeFriendCode(event.target.value).slice(0, LEGACY_FRIEND_CODE_LENGTH))} className={`${input} uppercase tracking-widest`} />
            <button type="submit" disabled={busy || !isFriendCode(code)} className={solid}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('update.sendRequest')}</button>
          </div>
          {sent && <p role="status" className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('fr.requestSent')}</p>}
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">{t('update.friendsError')}</p>}
          <button type="button" onClick={onOpenFriends} className="mt-3 font-serif text-sm font-extrabold underline">{t('fr.openFriends')}</button>
        </form>
      </section>

      {(isStudent || role === 'teacher') && (
        <section>
          <h2 className={heading}>{t('fr.myClasses')}</h2>
          <div className={card}>
            {isStudent && <>
              <form className="flex flex-col gap-2 min-[400px]:flex-row" onSubmit={event => { event.preventDefault(); void join(); }}>
                <input aria-label={t('site.studentclasses.eg_abc123_9ae2e4')} placeholder={t('site.studentclasses.eg_abc123_9ae2e4')} value={classCode} maxLength={6} autoComplete="off" autoCapitalize="characters"
                  onChange={event => setClassCode(event.target.value.toUpperCase())} className={`${input} text-center uppercase tracking-[0.25em]`} />
                <button type="submit" disabled={joining || classCode.trim().length < 4} className={solid}>{joining && <Loader2 className="h-4 w-4 animate-spin" />}{t('site.studentclasses.join_class_3191b7')}</button>
              </form>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">{t('site.studentclasses.enter_the_6character_invite_code_4584e4')}</p>
              {joinMsg && <p role={joinMsg.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-bold ${joinMsg.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>{joinMsg.text}</p>}
            </>}
            {classes && classes.length > 0 ? (
              <ul className={`${isStudent ? 'mt-4 border-t-2 border-slate-100 pt-3 dark:border-zinc-800' : ''} space-y-2`}>
                {classes.map(cls => <li key={cls.id} className="flex min-w-0 items-center gap-2 font-serif font-extrabold"><Users className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden /><span className="min-w-0 break-words">{cls.name}</span></li>)}
              </ul>
            ) : classes && <p className={`${isStudent ? 'mt-4' : ''} text-sm font-semibold text-slate-500 dark:text-zinc-400`}>{t('fr.noClasses')}</p>}
            {classes && classes.length > 0 && isStudent && <button type="button" onClick={onOpenClasses} className="mt-3 font-serif text-sm font-extrabold underline">{t('nav.myClasses')}</button>}
          </div>
        </section>
      )}
    </div>
  );
}
