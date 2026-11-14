import { expect, test } from 'vitest';
import { POOLS, TITLES } from '../src/lib/smarty/lines';
import { EN_UI_STRINGS, loadUiLocale, translateUi } from '../src/lib/uiStrings';
import { UI_LANGS } from '../src/lib/uiLang';

test('every generated Smarty message resolves to real copy in every interface language', async () => {
  const keys = [...new Set([
    ...Object.values(POOLS).flatMap(pool => [...pool.plain, ...('named' in pool ? pool.named : [])]),
    ...Object.values(TITLES),
  ])];
  for (const lang of UI_LANGS) {
    await loadUiLocale(lang);
    for (const key of keys) {
      expect(EN_UI_STRINGS[key], `${lang}: ${key} is absent from English`).toBeTruthy();
      const copy = translateUi(lang, key, { name: 'Learner', n: 3, lang: 'English', days: 3, level: 2 });
      expect(copy, `${lang}: ${key} leaked its key`).not.toBe(key);
    }
  }
});
