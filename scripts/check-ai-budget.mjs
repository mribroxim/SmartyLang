import 'dotenv/config';
if (!process.env.OPENROUTER_API_KEY) { console.log('AI key not configured'); process.exit(1); }
try {
  const response = await fetch('https://openrouter.ai/api/v1/key', { signal: AbortSignal.timeout(10_000), headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } });
  if (!response.ok) throw Error('unavailable');
  const { data } = await response.json();
  console.log(JSON.stringify({ creditLimit: data.limit, limitRemaining: data.limit_remaining, limitReset: data.limit_reset, usageDaily: data.usage_daily, hasProviderCreditCap: Number.isFinite(data.limit) }, null, 2));
  process.exitCode = Number.isFinite(data.limit) ? 0 : 1;
} catch { console.log('AI budget inspection unavailable'); process.exitCode = 1; }
