/**
 * useCMSContent — fetches admin-managed content overrides from Firestore once
 * per language per session and falls back to hardcoded / lang-pack defaults.
 *
 * English merges with built-in TS defaults.
 * Other content langs use public/data/lang-packs/{lang}/ when CMS is empty.
 */
import { useState, useEffect } from 'react';
import { getCMSDocument } from '../firebase';
import { TOPICS_BY_LEVEL as D_WRITING }          from '../data/practiceTopics';
import { SPEAKING_TOPICS_BY_LEVEL as D_SPEAKING } from '../data/speakingTopics';
import { TASK2_DATA as D_TASK2 }                 from '../data/writingTask2';
import { TASK1_DATA as D_TASK1 }                 from '../data/writingTask1';
import {
  PART1_TOPICS as D_PART1,
  PART2_CARDS  as D_PART2,
  PART3_TOPICS as D_PART3,
} from '../data/ieltsSpeakingData';
import type { Task2TypeData }                    from '../data/writingTask2';
import type { Task1TypeData, Task1Prompt }       from '../data/writingTask1';
import type { Part1Topic, Part2Card, Part3Topic } from '../data/ieltsSpeakingData';
import type { ShadowingPassage }                 from '../data/shadowingPassages';
import { type ContentLang, cmsDocId, readStoredContentLang } from './contentLang';
import { useContentLang } from '../contexts/ContentLangContext';
import { fetchLangPackJson } from './langPacks';

export interface CMSContent {
  writingTopics:   typeof D_WRITING;
  speakingTopics:  typeof D_SPEAKING;
  task2Data:       Task2TypeData[];
  part1Topics:     Part1Topic[];
  part2Cards:      Part2Card[];
  part3Topics:     Part3Topic[];
  /** TASK1_DATA merged with any custom prompts the admin added */
  task1Data:       Task1TypeData[];
  /** Shadowing passages. When shadowingIsFullOverride is true, this is the
   *  complete list and should NOT be merged with built-in passages. */
  shadowingCustom: ShadowingPassage[];
  /** True when admin has saved a full passage list — Shadowing.tsx skips
   *  merging with the hardcoded SHADOWING_PASSAGES constant. */
  shadowingIsFullOverride: boolean;
}

const EMPTY_LEVELS = {
  'Beginner': [] as string[],
  'Elementary': [] as string[],
  'Pre-Intermediate': [] as string[],
  'Intermediate': [] as string[],
  'Advanced': [] as string[],
};

const _defaultEn: CMSContent = {
  writingTopics:   D_WRITING,
  speakingTopics:  D_SPEAKING,
  task2Data:       D_TASK2,
  part1Topics:     D_PART1,
  part2Cards:      D_PART2,
  part3Topics:     D_PART3,
  task1Data:       D_TASK1,
  shadowingCustom: [],
  shadowingIsFullOverride: false,
};

const _defaultNonEn: CMSContent = {
  writingTopics:   { ...EMPTY_LEVELS },
  speakingTopics:  { ...EMPTY_LEVELS },
  task2Data:       [],
  part1Topics:     [],
  part2Cards:      [],
  part3Topics:     [],
  task1Data:       [],
  shadowingCustom: [],
  shadowingIsFullOverride: false,
};

const _cacheByLang: Partial<Record<ContentLang, CMSContent>> = {};
const _promiseByLang: Partial<Record<ContentLang, Promise<CMSContent>>> = {};
const _listenersByLang: Partial<Record<ContentLang, Set<(c: CMSContent) => void>>> = {};

export function invalidateCMS(lang?: ContentLang) {
  if (lang) {
    delete _cacheByLang[lang];
    delete _promiseByLang[lang];
  } else {
    for (const k of Object.keys(_cacheByLang) as ContentLang[]) {
      delete _cacheByLang[k];
      delete _promiseByLang[k];
    }
  }
}

/** Merge custom prompts (non-archived only) into base Task1 data. */
function mergeTask1(
  base: Task1TypeData[],
  customByType: Record<string, Task1Prompt[]> | undefined,
): Task1TypeData[] {
  return base.map(typeData => ({
    ...typeData,
    prompts: [
      ...typeData.prompts,
      ...(customByType?.[typeData.type] ?? []).filter(p => !(p as any).archived),
    ],
  }));
}

async function loadLangPackDefaults(lang: Exclude<ContentLang, 'en'>): Promise<{
  writingTopics: typeof D_WRITING;
  speakingTopics: typeof D_SPEAKING;
  task2Data: Task2TypeData[];
  task1Data: Task1TypeData[];
}> {
  const [writing, speaking, task2, task1] = await Promise.all([
    fetchLangPackJson<typeof D_WRITING>(lang, 'writing-topics.json'),
    fetchLangPackJson<typeof D_SPEAKING>(lang, 'speaking-topics.json'),
    fetchLangPackJson<Task2TypeData[]>(lang, 'task2.json'),
    fetchLangPackJson<{ types?: Task1TypeData[]; byType?: Record<string, Task1Prompt[]> }>(lang, 'task1.json'),
  ]);

  let task1Data: Task1TypeData[] = [];
  if (task1?.types?.length) {
    task1Data = task1.types;
  } else if (task1?.byType) {
    task1Data = D_TASK1.map(typeData => ({
      ...typeData,
      prompts: task1.byType![typeData.type] ?? [],
    })).filter(t => t.prompts.length > 0);
  }

  return {
    writingTopics:  writing  ?? { ...EMPTY_LEVELS },
    speakingTopics: speaking ?? { ...EMPTY_LEVELS },
    task2Data:      Array.isArray(task2) ? task2 : [],
    task1Data,
  };
}

function loadCMS(lang: ContentLang): Promise<CMSContent> {
  if (_promiseByLang[lang]) return _promiseByLang[lang]!;

  const empty = lang === 'en' ? _defaultEn : _defaultNonEn;

  _promiseByLang[lang] = (async () => {
    const cmsDocs = Promise.all([
      getCMSDocument(cmsDocId('writingTopics', lang)),
      getCMSDocument(cmsDocId('speakingTopics', lang)),
      getCMSDocument(cmsDocId('writingTask2', lang)),
      getCMSDocument(cmsDocId('ieltsSpeakingPart1', lang)),
      getCMSDocument(cmsDocId('ieltsSpeakingPart2', lang)),
      getCMSDocument(cmsDocId('ieltsSpeakingPart3', lang)),
      getCMSDocument(cmsDocId('customTask1Prompts', lang)),
      getCMSDocument(cmsDocId('customShadowing', lang)),
    ]);

    const packDefaults =
      lang === 'en' ? null : await loadLangPackDefaults(lang);

    const [writing, speaking, task2, part1, part2, part3, task1Custom, shadowCustom] =
      await cmsDocs;

    const notArchived = (x: any) => !x?.archived;

    let c: CMSContent;
    if (lang === 'en') {
      c = {
        writingTopics:   writing?.levels   ?? D_WRITING,
        speakingTopics:  speaking?.levels  ?? D_SPEAKING,
        task2Data:       task2?.types      ?? D_TASK2,
        part1Topics:     (part1?.topics    ?? D_PART1).filter(notArchived),
        part2Cards:      (part2?.cards     ?? D_PART2).filter(notArchived),
        part3Topics:     (part3?.topics    ?? D_PART3).filter(notArchived),
        task1Data:       mergeTask1(D_TASK1, task1Custom?.byType),
        shadowingIsFullOverride: shadowCustom?.allPassages !== undefined,
        shadowingCustom: shadowCustom?.allPassages !== undefined
          ? (shadowCustom.allPassages as any[]).filter(notArchived)
          : (shadowCustom?.passages ?? []).filter(notArchived),
      };
    } else {
      const pack = packDefaults!;
      c = {
        writingTopics:   writing?.levels   ?? pack.writingTopics,
        speakingTopics:  speaking?.levels  ?? pack.speakingTopics,
        task2Data:       (task2?.types?.length ? task2.types : pack.task2Data).filter(notArchived),
        part1Topics:     [],
        part2Cards:      [],
        part3Topics:     [],
        task1Data:       mergeTask1(pack.task1Data.length ? pack.task1Data : [], task1Custom?.byType)
          .filter(t => t.prompts.length > 0),
        shadowingIsFullOverride: false,
        shadowingCustom: [],
      };
      if (c.task1Data.length === 0 && task1Custom?.byType) {
        c.task1Data = D_TASK1.map(typeData => ({
          ...typeData,
          prompts: (task1Custom.byType[typeData.type] ?? []).filter(p => !(p as any).archived),
        })).filter(t => t.prompts.length > 0);
      }
    }

    _cacheByLang[lang] = c;
    (_listenersByLang[lang] ?? new Set()).forEach(fn => fn(c));
    _listenersByLang[lang]?.clear();
    return c;
  })().catch(() => {
    delete _promiseByLang[lang];
    return empty;
  });

  return _promiseByLang[lang]!;
}

export function useCMSContent(): CMSContent {
  const { contentLang } = useContentLang();
  const fallback = contentLang === 'en' ? _defaultEn : _defaultNonEn;
  const [content, setContent] = useState<CMSContent>(_cacheByLang[contentLang] ?? fallback);

  useEffect(() => {
    let cancelled = false;
    const cached = _cacheByLang[contentLang];
    if (cached) { setContent(cached); return; }

    setContent(contentLang === 'en' ? _defaultEn : _defaultNonEn);
    if (!_listenersByLang[contentLang]) _listenersByLang[contentLang] = new Set();
    const onLoad = (c: CMSContent) => { if (!cancelled) setContent(c); };
    _listenersByLang[contentLang]!.add(onLoad);
    loadCMS(contentLang);
    return () => {
      cancelled = true;
      _listenersByLang[contentLang]?.delete(onLoad);
    };
  }, [contentLang]);

  return content;
}

/** Imperative load (e.g. App boot) using stored or explicit lang. */
export function loadCMSContent(lang: ContentLang = readStoredContentLang()): Promise<CMSContent> {
  return loadCMS(lang);
}
