export const ASSESSMENT_SCORES = 'path_assessments_v1';

export function mergeAssessmentScores(...sources: unknown[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    for (const [key, score] of Object.entries(source)) {
      if (/^[a-z]{2}:[\w.:-]{1,160}$/.test(key) && Number.isInteger(score) && score >= 0 && score <= 100) {
        scores[key] = Math.max(scores[key] ?? 0, score);
      }
    }
  }
  return scores;
}
