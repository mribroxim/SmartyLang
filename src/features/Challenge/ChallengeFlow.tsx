import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DialogSurface } from '../../components/DialogSurface';
import { Sticker } from '../../components/stickers/Sticker';
import { ChunkyButton } from '../Bites/lesson/chunky';
import { MODE_META } from '../Classes/liveGameKit';
import { useUiLang } from '../../contexts/UiLangContext';
import { useProgress } from '../../contexts/ProgressContext';
import { loadLevelTexts } from '../../data/levelTexts';
import { CHALLENGE_MODES, pickChallengeWords, type ChallengeMode, type ChallengeScore, type ChallengeWord } from '../../lib/challenge';
import { sendChallenge, submitChallenge, type ChallengeRow, type FriendProfile } from './api';
import { SoloRound } from './SoloRound';
import { panel, sheet } from './FriendProfileDialog';

type Step = 'intro' | 'mode' | 'play' | 'saving' | 'done';

export function ScoreCompare({ me, them, themName, result }: { me: ChallengeScore; them: ChallengeScore | null; themName: string; result: 'win' | 'lose' | 'tie' | null }) {
  const { t } = useUiLang();
  const sticker = result === 'win' ? 'achieve.trophy-lift' : result === 'lose' ? 'feed.try-again' : 'social.high-five-duo';
  return (
    <div className="space-y-4 text-center">
      <Sticker id={sticker} size={120} priority="hero" />
      <h2 className="font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
        {result ? t(result === 'win' ? 'ch.youWon' : result === 'lose' ? 'ch.youLost' : 'ch.tie') : t('ch.sent')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {[{ label: t('site.gamification.you_905cb3'), s: me, strong: result === 'win' }, { label: themName, s: them, strong: result === 'lose' }].map(({ label, s, strong }, i) => (
          <div key={i} className={`min-w-0 rounded-2xl border-2 p-3 ${strong ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-slate-200 dark:border-zinc-700'}`}>
            <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="font-serif text-3xl font-extrabold tabular-nums">{s ? s.score : '–'}</p>
            {s && <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{t('ch.correctCount', { n: s.correct })}</p>}
          </div>
        ))}
      </div>
      {!result && <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('ch.waiting', { name: themName })}</p>}
    </div>
  );
}

/** Send a challenge: cat popup, game type, auto-picked words, a solo round, then send. */
export function ChallengeFlow({ friend, onClose, onSent }: { friend: FriendProfile; onClose: () => void; onSent?: () => void }) {
  const { t } = useUiLang();
  const { level, savedVocab, contentLang } = useProgress();
  const [step, setStep] = useState<Step>('intro');
  const [mode, setMode] = useState<ChallengeMode>('quiz');
  const [words, setWords] = useState<ChallengeWord[]>([]);
  const [mine, setMine] = useState<ChallengeScore | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function start(next: ChallengeMode) {
    setMode(next); setLoading(true); setError('');
    try {
      const texts = await loadLevelTexts(contentLang);
      const picked = pickChallengeWords({ myLevel: level, friendLevel: friend.level, textsByLevel: texts, learned: savedVocab, spelling: next === 'spelling' });
      if (picked.length < 4) { setError(t('ch.noWords')); return; }
      setWords(picked); setStep('play');
    } catch { setError(t('ch.noWords')); } finally { setLoading(false); }
  }
  async function finish(score: ChallengeScore) {
    setMine(score); setStep('saving'); setError('');
    try {
      await sendChallenge({ friend: friend.uid, mode, level: friend.level, words, ...score });
      setStep('done'); onSent?.();
    } catch { setError(t('ch.sendError')); setStep('done'); }
  }
  const quit = () => { if (step !== 'saving') onClose(); };
  return (
    <DialogSurface label={t('friendGame.challengeNamed', { name: friend.name })} onClose={quit} className={sheet}>
      <div className={panel}>
        {step === 'intro' && (
          <div className="space-y-4 text-center">
            <Sticker id="game.challenge-accepted" size={150} priority="hero" />
            <h2 className="break-words font-serif text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('friendGame.challengeNamed', { name: friend.name })}</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{t('ch.introBody')}</p>
            <ChunkyButton className="w-full" onClick={() => setStep('mode')}>{t('ch.send')}</ChunkyButton>
            <button type="button" onClick={onClose} className="font-serif text-sm font-extrabold underline">{t('ch.notNow')}</button>
          </div>
        )}
        {step === 'mode' && (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('ch.pickGame')}</h2>
            {CHALLENGE_MODES.map(id => {
              const meta = MODE_META[id];
              const Icon = meta.icon;
              return (
                <button key={id} type="button" disabled={loading} onClick={() => void start(id)}
                  className="flex w-full min-w-0 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3 text-left shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[2px] active:shadow-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_3px_0_0_#3f3f46]">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white dark-keep ${meta.tint}`}><Icon className="h-6 w-6" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block font-serif text-base font-extrabold">{t(meta.title)}</span><span className="block text-xs font-semibold text-slate-500 dark:text-zinc-400">{t(meta.blurb)}</span></span>
                  {loading && mode === id && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              );
            })}
            {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
            <button type="button" onClick={onClose} className="font-serif text-sm font-extrabold underline">{t('action.cancel')}</button>
          </div>
        )}
        {step === 'play' && <SoloRound words={words} mode={mode} onDone={score => void finish(score)} />}
        {step === 'saving' && <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>}
        {step === 'done' && mine && (
          <div className="space-y-4">
            <ScoreCompare me={mine} them={null} themName={friend.name} result={null} />
            {error && <p role="alert" className="text-center text-sm font-semibold text-rose-600">{error}</p>}
            <ChunkyButton className="w-full" onClick={onClose}>{t('ch.done')}</ChunkyButton>
          </div>
        )}
      </div>
    </DialogSurface>
  );
}

/** Play an incoming challenge on the exact same words, then see who won. */
export function ChallengePlay({ challenge, onClose, onFinished }: { challenge: ChallengeRow; onClose: () => void; onFinished?: () => void }) {
  const { t } = useUiLang();
  const [state, setState] = useState<{ mine: ChallengeScore; result: 'win' | 'lose' | 'tie' } | 'saving' | 'error' | null>(null);
  const [mine, setMine] = useState<ChallengeScore | null>(null);
  const words = useMemo(() => challenge.words, [challenge.words]);
  useEffect(() => { setState(null); }, [challenge.id]);
  async function finish(score: ChallengeScore) {
    setMine(score); setState('saving');
    try { const { result } = await submitChallenge(challenge.id, score); setState({ mine: score, result }); onFinished?.(); }
    catch { setState('error'); }
  }
  const resultView = typeof state === 'object' && state ? state : null;
  return (
    <DialogSurface label={t('friendGame.challengeNamed', { name: challenge.opponentName })} onClose={() => { if (state !== 'saving') onClose(); }} className={sheet}>
      <div className={panel}>
        {state === null && <SoloRound words={words} mode={challenge.mode} onDone={score => void finish(score)} />}
        {state === 'saving' && <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>}
        {state === 'error' && <div className="space-y-4 text-center"><Sticker id="state2.something-went-wrong" size={110} /><p role="alert" className="font-semibold text-rose-600">{t('ch.sendError')}</p>
          <ChunkyButton className="w-full" onClick={() => mine && void finish(mine)}>{t('action.tryAgain')}</ChunkyButton></div>}
        {resultView && (
          <div className="space-y-4">
            <ScoreCompare me={resultView.mine} them={challenge.me ? null : { score: challenge.them?.score ?? 0, correct: challenge.them?.correct ?? 0, ms: challenge.them?.ms ?? 0 }} themName={challenge.opponentName} result={resultView.result} />
            <ChunkyButton className="w-full" onClick={onClose}>{t('ch.done')}</ChunkyButton>
          </div>
        )}
      </div>
    </DialogSurface>
  );
}
