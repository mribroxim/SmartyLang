import { dataRequest } from './selfHostedApi';

type Vocabulary = Record<string, unknown>;
export type VocabularyChanges = { upserts: { word: string; data: unknown }[]; deletes: string[] };

/** JSON restored from the server has new object identities and may reorder keys. */
export function vocabularyValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => vocabularyValuesEqual(value, b[index]));
  }
  const left = a as Vocabulary, right = b as Vocabulary;
  const keys = Object.keys(left).filter(key => left[key] !== undefined);
  return keys.length === Object.keys(right).filter(key => right[key] !== undefined).length
    && keys.every(key => Object.hasOwn(right, key) && vocabularyValuesEqual(left[key], right[key]));
}

export function vocabularyChanges(previous: Vocabulary, current: Vocabulary): VocabularyChanges {
  return {
    upserts: Object.keys(current).filter(word => !Object.hasOwn(previous, word) || !vocabularyValuesEqual(previous[word], current[word])).map(word => ({ word, data: current[word] })),
    deletes: Object.keys(previous).filter(word => !Object.hasOwn(current, word)),
  };
}

/** Bound both request count and payload size; large vocabularies never fan out per word. */
export async function syncVocabulary(uid: string, lang: string, changes: VocabularyChanges): Promise<void> {
  let upserts: VocabularyChanges['upserts'] = [], bytes = 0;
  const flush = async () => {
    if (!upserts.length) return;
    await dataRequest('vocab.sync', { uid, lang, upserts, deletes: [] });
    upserts = []; bytes = 0;
  };
  for (const entry of changes.upserts) {
    const size = new TextEncoder().encode(JSON.stringify(entry)).length;
    if (size > 180_000) throw new Error('Vocabulary entry is too large to sync');
    if (upserts.length >= 100 || bytes + size > 180_000) await flush();
    upserts.push(entry); bytes += size;
  }
  await flush();
  for (let index = 0; index < changes.deletes.length; index += 100) {
    await dataRequest('vocab.sync', { uid, lang, upserts: [], deletes: changes.deletes.slice(index, index + 100) });
  }
}
