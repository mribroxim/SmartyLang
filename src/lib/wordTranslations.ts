import { decodeHtmlEntities } from './languages';

/** Prefetch translations for a set of vocab words (MyMemory + quality filter). */
export async function fetchWordTranslations(
  words: string[],
  sourceDictCode: string,
  targetCode: string,
  glosses?: Record<string, string>,
): Promise<Record<string, string>> {
  const { translateWithCache } = await import('./networkCache');
  const { isGarbageTranslation } = await import('./translationQuality');
  const { vocabDbEnabled, loadVocab, lookupWord } = await import('./vocabDb');
  const transMap: Record<string, string> = {};
  const missing: string[] = [];

  if (vocabDbEnabled()) {
    await loadVocab(sourceDictCode, targetCode);
  }

  for (const w of words) {
    if (targetCode === sourceDictCode) {
      transMap[w] = w;
      transMap[w.toLowerCase()] = w;
      continue;
    }
    if (vocabDbEnabled()) {
      const card = lookupWord(w, { knownLang: targetCode });
      const lemma = (card?.word || w).toLowerCase();
      const known = (card?.knownWord || '').trim();
      // Only trust vocab-db when it actually has a known-language word, not the
      // English/learning definition (that used to leak into quizzes).
      if (known && known.toLowerCase() !== lemma) {
        transMap[w] = known;
        transMap[w.toLowerCase()] = known;
        continue;
      }
    }
    missing.push(w);
  }

  await Promise.all(missing.map(async (w) => {
    const gloss = glosses?.[w] || glosses?.[w.toLowerCase()];
    try {
      const t = await translateWithCache(w, sourceDictCode, targetCode, { fallback: gloss });
      const clean = decodeHtmlEntities((t || '').trim());
      if (clean && !isGarbageTranslation(clean, w)) {
        transMap[w] = clean;
        transMap[w.toLowerCase()] = clean;
      } else if (gloss) {
        const defT = await translateWithCache(gloss, sourceDictCode, targetCode);
        const defClean = decodeHtmlEntities((defT || '').trim());
        if (defClean && !isGarbageTranslation(defClean, gloss)) {
          transMap[w] = defClean;
          transMap[w.toLowerCase()] = defClean;
        } else {
          transMap[w] = w;
          transMap[w.toLowerCase()] = w;
        }
      } else {
        transMap[w] = w;
      }
    } catch {
      transMap[w] = w;
    }
  }));
  return transMap;
}

