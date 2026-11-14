import React from 'react';
import { reportError } from '../../lib/monitoring';
import { Smarty } from '../mascot/Smarty';
import { translateUi } from '../../lib/uiStrings';
import { readStoredUiLang } from '../../lib/uiLang';

interface Props {
  children: React.ReactNode;
  /** Changing this value clears the error (e.g. the active tab). */
  resetKey?: unknown;
  onHome?: () => void;
}
interface State { error: Error | null }

/**
 * Catches render crashes inside a screen so the rest of the app keeps working.
 * Smarty apologises and offers a retry instead of a blank page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  // React 19 ships without bundled class typings in this project; declare what we use.
  declare props: Readonly<Props>;
  declare setState: (next: State) => void;
  declare context: unknown;
  declare forceUpdate: () => void;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError('render');
    console.error('Screen crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const lang = readStoredUiLang();
    const t = (k: Parameters<typeof translateUi>[1]) => translateUi(lang, k);
    return (
      <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Smarty sticker="state2.something-went-wrong" size={150} priority="hero" />
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{t('error.crash.title')}</h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-sm">{t('error.crash.body')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-sm font-bold transition shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#a1a1aa] active:translate-y-[4px] active:shadow-none"
          >
            {t('action.tryAgain')}
          </button>
          {this.props.onHome && (
            <button
              type="button"
              onClick={() => { this.setState({ error: null }); this.props.onHome?.(); }}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-zinc-700 text-sm font-bold active:scale-95 transition"
            >
              {t('error.crash.home')}
            </button>
          )}
        </div>
      </div>
    );
  }
}
