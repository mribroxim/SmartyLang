// Shared by Express and the legacy Functions deployment. Fail closed on errors,
// missing configuration, or unsupported languages; never log conversation text.
const CATEGORIES = ['Hate', 'Sexual', 'SelfHarm', 'Violence'];
function moderationConfigured(language) {
  return !!process.env.CONTENT_SAFETY_ENDPOINT && !!process.env.CONTENT_SAFETY_KEY && String(process.env.CONTENT_SAFETY_LANGUAGES || 'en,es,fr,de,it,pt,zh,ja').split(',').includes(language);
}
async function moderateOutput(result, language, fetcher = fetch) {
  const fallback = { reply: '', followUp: '', correctionNote: '', tip: '', mood: 'happy', safeFallback: true };
  const endpoint = process.env.CONTENT_SAFETY_ENDPOINT;
  const key = process.env.CONTENT_SAFETY_KEY;
  const allowed = String(process.env.CONTENT_SAFETY_LANGUAGES || 'en,es,fr,de,it,pt,zh,ja').split(',');
  if (!endpoint || !key || !allowed.includes(language)) return fallback;
  try {
    const url = new URL('/contentsafety/text:analyze?api-version=2024-09-01', endpoint);
    if (url.protocol !== 'https:') return fallback;
    const text = [result.reply, result.followUp, result.tip, result.correctionNote].filter(Boolean).join('\n');
    if (!text.trim()) return fallback;
    const response = await fetcher(url, { method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': key }, body: JSON.stringify({ text, categories: CATEGORIES, outputType: 'FourSeverityLevels' }) });
    if (!response.ok) return fallback;
    const data = await response.json();
    if (data.blocklistsMatch?.length || !Array.isArray(data.categoriesAnalysis) || !CATEGORIES.every(category => data.categoriesAnalysis.some(item => item.category === category && item.severity === 0))) return fallback;
    return { ...result, safeFallback: false };
  } catch { return fallback; }
}
module.exports = { moderateOutput, moderationConfigured };
