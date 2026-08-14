import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail } from '../firebase';
import { useUiLang } from '../contexts/UiLangContext';

interface AuthGateProps {
  loginWithGoogle: () => Promise<void>;
}

type EmailMode = 'signin' | 'register';

// Codes that mean the user deliberately cancelled — no error message needed.
const SILENT_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

function friendlyEmailError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/configuration-not-found':
    case 'auth/invalid-api-key':
      return 'Firebase is not configured correctly. Check your project settings.';
    default:
      return `Sign-in failed (${code || 'unknown'}). Please try again.`;
  }
}

function friendlyGoogleError(code: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Add it in Firebase Console → Authentication → Settings → Authorised domains.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid. Check your project configuration.';
    default:
      return `Google sign-in failed (${code || 'unknown'}). Please try again.`;
  }
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export function AuthGate({ loginWithGoogle }: AuthGateProps) {
  const { t } = useUiLang();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmail, setShowEmail]   = useState(false);
  const [emailMode, setEmailMode]   = useState<EmailMode>('signin');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const busy = googleLoading || emailLoading;

  /* ── Google ───────────────────────────────────────────────────────────── */
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // Popup success → parent unmounts via onAuthStateChanged (don't reset loading).
      // Redirect fallback → page navigates away (loading state irrelevant).
    } catch (e: any) {
      if (!SILENT_CODES.has(e?.code)) {
        setError(friendlyGoogleError(e?.code ?? ''));
      }
      setGoogleLoading(false);
    }
  };

  /* ── Email ────────────────────────────────────────────────────────────── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailMode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setEmailLoading(true);
    setError(null);
    try {
      if (emailMode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name.trim() || undefined);
      }
      // Parent unmounts on success — do NOT reset emailLoading here.
    } catch (e: any) {
      setError(friendlyEmailError(e?.code ?? ''));
      setEmailLoading(false);
    }
  };

  const switchMode = (mode: EmailMode) => {
    setEmailMode(mode);
    setError(null);
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-5 shadow-2xl">
            <span className="font-serif font-black text-2xl text-zinc-900">S</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight mb-2">SMARTY</h1>
          <p className="text-zinc-400 text-base">{t('auth.tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">{t('auth.welcome')}</h2>
          <p className="text-zinc-400 text-sm mb-6">{t('auth.signInHint')}</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {googleLoading
              ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              : <GoogleIcon />}
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Email section */}
          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 font-semibold py-3.5 px-6 rounded-xl hover:border-zinc-500 hover:text-white active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              <MailIcon /> Continue with Email
            </button>
          ) : (
            <>
              {/* Sign In / Register tabs */}
              <div className="flex bg-zinc-800 rounded-xl p-1 mb-5">
                {(['signin', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      emailMode === m
                        ? 'bg-zinc-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m === 'signin' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {emailMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Full name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={busy}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-60"
                  />
                )}

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-60"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={busy}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-60"
                />

                {emailMode === 'register' && (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={busy}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-60"
                  />
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-white text-zinc-900 font-semibold py-3.5 rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  {emailLoading && (
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                  )}
                  {emailLoading
                    ? 'Please wait…'
                    : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-rose-400 text-sm text-center mt-4">{error}</p>
          )}

          <p className="text-zinc-600 text-xs text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: '🎙️', label: 'Speaking' },
            { icon: '📖', label: 'Reading' },
            { icon: '✍️', label: 'Writing' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-zinc-900/60 rounded-2xl p-4 text-center border border-zinc-800">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-zinc-400 text-xs font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
