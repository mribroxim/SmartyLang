/** Shared helpers for EN curriculum assembly. */

export function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

/** Learner reading pace ~130 wpm. */
export function targetSecondsFor(text) {
  const w = wordCount(text);
  return Math.max(45, Math.min(600, Math.round((w / 130) * 60)));
}

export function vocab(items) {
  return items.map(([word, definition]) => ({ word, definition }));
}

export function lesson(meta, text, vocabulary) {
  return {
    id: meta.id,
    title: meta.title,
    text: text.trim().replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
    targetSeconds: targetSecondsFor(text),
    vocabulary,
    coreQuestion: meta.coreQuestion,
    languageGoal: meta.languageGoal,
    communicationGoal: meta.communicationGoal,
    grammarFocus: meta.grammarFocus,
    vocabularyDomain: meta.vocabularyDomain,
    unit: meta.unit,
    unitName: meta.unitName,
    format: meta.format,
  };
}

export function attachUnitMeta(topics, unitIndex, unitName) {
  return topics.map((t) => ({
    ...t,
    unit: unitIndex,
    unitName,
  }));
}
