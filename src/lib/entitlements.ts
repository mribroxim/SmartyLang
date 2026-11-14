export function paidPlanEnded(profile: { planCancelAt?: unknown; planExpiresAt?: unknown } | null | undefined, now = Date.now()): boolean {
  return [profile?.planCancelAt, profile?.planExpiresAt].some(value => typeof value === 'number' && Number.isFinite(value) && now >= value);
}
