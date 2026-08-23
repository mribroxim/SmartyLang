import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type UiLang,
  readStoredUiLang,
  writeStoredUiLang,
  uiLangLabel,
} from '../lib/uiLang';
import { isRtlLang } from '../lib/pronunciationProfile';
import {
  translateUi,
  translateLevel,
  translateLevelDesc,
  type UiStringKey,
} from '../lib/uiStrings';

interface UiLangContextType {
  uiLang: UiLang;
  setUiLang: (lang: UiLang) => void;
  label: string;
  t: (key: UiStringKey, vars?: Record<string, string | number>) => string;
  tLevel: (level: string) => string;
  tLevelDesc: (prefix: string, level: string) => string;
}

const UiLangContext = createContext<UiLangContextType>({
  uiLang: 'en',
  setUiLang: () => {},
  label: 'English',
  t: (key, vars) => translateUi('en', key, vars),
  tLevel: (level) => level,
  tLevelDesc: () => '',
});

export const useUiLang = () => useContext(UiLangContext);

export function UiLangProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setLangState] = useState<UiLang>(() => readStoredUiLang());

  const setUiLang = useCallback((lang: UiLang) => {
    setLangState(lang);
    writeStoredUiLang(lang);
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
  const tLevelDesc = useCallback(
    (prefix: string, level: string) => translateLevelDesc(uiLang, prefix, level),
    [uiLang],
  );

  const value = useMemo<UiLangContextType>(() => ({
    uiLang,
    setUiLang,
    label: uiLangLabel(uiLang),
    t,
    tLevel,
    tLevelDesc,
  }), [uiLang, setUiLang, t, tLevel, tLevelDesc]);

  return (
    <UiLangContext.Provider value={value}>
      {children}
    </UiLangContext.Provider>
  );
}
