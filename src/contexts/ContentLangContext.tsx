import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  type ContentLang,
  CONTENT_LANG_LABEL,
  CONTENT_LANG_NATIVE,
  SPEECH_LOCALE,
  DICT_LANG_CODE,
  readStoredContentLang,
  writeStoredContentLang,
  isFullEnglishApp,
} from '../lib/contentLang';

interface ContentLangContextType {
  contentLang: ContentLang;
  setContentLang: (lang: ContentLang) => void;
  label: string;
  nativeName: string;
  speechLocale: string;
  dictCode: string;
  isEnglish: boolean;
}

const ContentLangContext = createContext<ContentLangContextType>({
  contentLang: 'en',
  setContentLang: () => {},
  label: 'English',
  nativeName: 'English',
  speechLocale: 'en-US',
  dictCode: 'en',
  isEnglish: true,
});

export const useContentLang = () => useContext(ContentLangContext);

export function ContentLangProvider({ children }: { children: React.ReactNode }) {
  const [contentLang, setLangState] = useState<ContentLang>(() => readStoredContentLang());

  const setContentLang = useCallback((lang: ContentLang) => {
    setLangState(lang);
    writeStoredContentLang(lang);
  }, []);

  const value = useMemo<ContentLangContextType>(() => ({
    contentLang,
    setContentLang,
    label: CONTENT_LANG_LABEL[contentLang],
    nativeName: CONTENT_LANG_NATIVE[contentLang],
    speechLocale: SPEECH_LOCALE[contentLang],
    dictCode: DICT_LANG_CODE[contentLang],
    isEnglish: isFullEnglishApp(contentLang),
  }), [contentLang, setContentLang]);

  return (
    <ContentLangContext.Provider value={value}>
      {children}
    </ContentLangContext.Provider>
  );
}
