export interface SRSData {
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  nextReviewDate: number; // timestamp
}

export function calculateSM2(quality: number, data?: SRSData): SRSData {
  let interval = data?.interval || 0;
  let repetition = data?.repetition || 0;
  let easeFactor = data?.easeFactor || 2.5;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { interval, repetition, easeFactor, nextReviewDate };
}
