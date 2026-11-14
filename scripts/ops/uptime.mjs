// No dependency or secret needed. Nonzero exit is consumable by systemd/cron.
const url = new URL('/api/ready', process.env.APP_URL || 'http://localhost:3000');
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: 'error' });
  const data = await response.json();
  if (!response.ok || data.ok !== true) throw new Error('not ready');
  console.log(JSON.stringify({ event: 'uptime_ok', checkedAt: new Date().toISOString() }));
} catch { console.error(JSON.stringify({ event: 'uptime_failed', checkedAt: new Date().toISOString() })); process.exitCode = 1; }
