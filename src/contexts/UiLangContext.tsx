import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  type UiLang,
  readStoredUiLang,
  writeStoredUiLang,
  uiLangLabel,
} from '../lib/uiLang';
import { isRtlLang } from '../lib/pronunciationProfile';
import {
  translateUi,
  loadUiLocale,
  translateUiText,
  translateLevel,
  translateLevelDesc,
  type UiStringKey,
} from '../lib/uiStrings';

interface UiLangContextType {
  uiLang: UiLang;
  setUiLang: (lang: UiLang) => void;
  loadingLanguage: UiLang | null;
  label: string;
  t: (key: UiStringKey, vars?: Record<string, string | number>) => string;
  tText: (text: string) => string;
  tLevel: (level: string) => string;
  tLevelDesc: (prefix: string, level: string) => string;
}

const UiLangContext = createContext<UiLangContextType>({
  uiLang: 'en',
  setUiLang: () => {},
  loadingLanguage: null,
  label: 'English',
  t: (key, vars) => translateUi('en', key, vars),
  tText: (text) => text,
  tLevel: (level) => level,
  tLevelDesc: () => '',
});

export const useUiLang = () => useContext(UiLangContext);

export function UiLangProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setLangState] = useState<UiLang>(() => readStoredUiLang());
  const [loadingLanguage, setLoadingLanguage] = useState<UiLang | null>(null);
  const [failedLanguage, setFailedLanguage] = useState<UiLang | null>(null);
  const request = useRef(0);

  const setUiLang = useCallback((lang: UiLang) => {
    const id = ++request.current;
    setLoadingLanguage(lang);
    setFailedLanguage(null);
    void loadUiLocale(lang).then(() => {
      if (id !== request.current) return;
      setLangState(lang);
      writeStoredUiLang(lang);
    }).catch((error) => {
      console.error('Could not load interface language:', error);
      if (id === request.current) setFailedLanguage(lang);
    }).finally(() => {
      if (id === request.current) setLoadingLanguage(null);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = isRtlLang(uiLang) ? 'rtl' : 'ltr';
  }, [uiLang]);

  const t = useCallback(
    (key: UiStringKey, vars?: Record<string, string | number>) => translateUi(uiLang, key, vars),
    [uiLang],
  );
  const tLevel = useCallback((level: string) => translateLevel(uiLang, level), [uiLang]);
  const tText = useCallback((text: string) => translateUiText(uiLang, text), [uiLang]);
  const tLevelDesc = useCallback(
    (prefix: string, level: string) => translateLevelDesc(uiLang, prefix, level),
    [uiLang],
  );

  const value = useMemo<UiLangContextType>(() => ({
    uiLang,
    setUiLang,
    loadingLanguage,
    label: uiLangLabel(uiLang),
    t,
    tText,
    tLevel,
    tLevelDesc,
  }), [uiLang, setUiLang, loadingLanguage, t, tText, tLevel, tLevelDesc]);

  return (
    <UiLangContext.Provider value={value}>
      {children}
      {failedLanguage && (
        <div role="alert" className="fixed bottom-5 inset-x-4 z-[200] mx-auto max-w-md rounded-2xl border border-red-300 bg-white dark:bg-zinc-900 p-4 text-sm shadow-lg">
          <strong>{t('lang.interface')}: {uiLangLabel(failedLanguage)}</strong>
          <p className="my-2">{t('error.crash.body')}</p>
          <button type="button" className="font-bold underline" onClick={() => setUiLang(failedLanguage)}>{t('action.tryAgain')}</button>
        </div>
      )}
    </UiLangContext.Provider>
  );
}
