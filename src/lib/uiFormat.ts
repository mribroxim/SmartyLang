/** Replace `{name}` placeholders in UI strings. */
export function formatUi(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`,
  );
}

const LEVEL_KEY: Record<string, string> = {
  Beginner: 'level.beginner',
  Elementary: 'level.elementary',
  'Pre-Intermediate': 'level.preIntermediate',
  Intermediate: 'level.intermediate',
  Advanced: 'level.advanced',
};

/** Map English Level ID → ui string key (display only; storage stays English). */
export function levelUiKey(level: string): string {
  return LEVEL_KEY[level] || level;
}
