// Manual bites/hearts/Today QA only. Vite's production build does not include this entry.
// All API calls are mocked and localStorage is namespaced; no real account is used.
const params = new URLSearchParams(location.search);
if (params.has('hour')) {
  const NativeDate = window.Date;
  const target = new NativeDate();
  target.setHours(Number(params.get('hour')), 0, 0, 0);
  const offset = target.getTime() - NativeDate.now();
  window.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [NativeDate.now() + offset])); }
    static now() { return NativeDate.now() + offset; }
  };
}
if (params.has('width') && !params.has('frame')) {
  const frame = document.createElement('iframe');
  const url = new URL(location.href);
  url.searchParams.set('frame', '1');
  frame.src = url.href;
  frame.title = 'Phone preview';
  frame.style.cssText = `display:block;border:1px solid #ccc;width:${Number(params.get('width')) || 390}px;height:calc(100dvh - 42px);max-height:844px;margin:20px auto;`;
  document.body.style.background = '#ddd';
  document.body.append(frame);
} else {
  if (params.has('micError')) {
    window.SpeechRecognition = class {
      start() { setTimeout(() => this.onerror?.({ error: 'audio-capture' }), 0); }
      stop() {}
      abort() {}
    };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { throw new Error('QA microphone unavailable'); };
  }
  const realStorage = window.localStorage;
  const account = params.get('account') || 'max';
  const testCase = params.get('case') || 'default';
  const prefix = params.has('account') ? `smarty-phase45-qa:${account}:${testCase}:` : 'smarty-phase3-qa:';
  const qaStorage = {
    getItem: key => realStorage.getItem(prefix + key),
    setItem: (key, value) => realStorage.setItem(prefix + key, String(value)),
    removeItem: key => realStorage.removeItem(prefix + key),
    key: index => Object.keys(realStorage).filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length))[index] ?? null,
    get length() { return Object.keys(realStorage).filter(key => key.startsWith(prefix)).length; },
  };
  Object.defineProperty(window, 'localStorage', { value: qaStorage });
  if (!params.has('onboarding') || !qaStorage.getItem('smarty_content_lang')) qaStorage.setItem('smarty_content_lang', 'en');
  if (!params.has('ui') && (!params.has('onboarding') || !qaStorage.getItem('smarty_ui_lang_v1'))) qaStorage.setItem('smarty_ui_lang_v1', 'en');
  if (params.has('ui')) {
    const seedKey = 'ui-language-seeded';
    if (!qaStorage.getItem(seedKey)) {
      qaStorage.setItem('smarty_ui_lang_v1', params.get('ui'));
      qaStorage.setItem(seedKey, '1');
    }
  }
  qaStorage.setItem('smarty_dark', params.has('dark') ? 'true' : 'false');
  const uid = params.has('account') ? `phase45-${account}-${testCase}` : 'phase3-qa';
  const profile = { uid, role: account === 'preview' ? 'business' : 'student', plan: account === 'max' ? 'smarty-max' : null, displayName: 'QA Learner', email: 'qa@example.invalid', createdAt: Date.now() - 86400000 * 10, ...(params.has('onboarding') ? {} : { startingLevel: 'Beginner', onboardingCompletedAt: 1 }), ...JSON.parse(qaStorage.getItem('mock-profile') || '{}') };
  if (!qaStorage.getItem('mock-progress')) qaStorage.setItem('mock-progress', JSON.stringify({ xp: params.has('account') && !params.has('onboarding') ? 100 : 0, coins: 240 }));
  if (params.has('reminders') && !qaStorage.getItem('reminders-seeded')) {
    const localDay = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const progress = JSON.parse(qaStorage.getItem('mock-progress'));
    qaStorage.setItem('mock-progress', JSON.stringify({ ...progress, globalStreak: { current: 7, max: 7, lastDate: localDay(yesterday) }, dailyGoal: { date: localDay(new Date()), xpEarned: 0, completed: false, weekHits: 0, weekKey: '' } }));
    qaStorage.setItem(`smarty_${uid}_smarty_prefs_v1`, JSON.stringify({ v: 1, liveliness: 'calm', sound: false, haptics: false, seasonal: true, dailyMinutes: 10, reminderTime: '18:30', updatedAt: Date.now() }));
    qaStorage.setItem('reminders-seeded','1');
  }
  const heartKey = `smarty_${uid}_smarty_hearts_v1`;
  if (params.has('hearts') && !qaStorage.getItem(heartKey)) {
    const count = Math.max(0, Math.min(5, Number(params.get('hearts'))));
    const hearts = { v: 1, count, grace: Number(params.get('grace') || '0'), regenAt: count < 5 ? Date.now() + 4 * 3600000 : null, updatedAt: Date.now() };
    qaStorage.setItem(heartKey, JSON.stringify(hearts));
    const progress = JSON.parse(qaStorage.getItem('mock-progress'));
    qaStorage.setItem('mock-progress', JSON.stringify({ ...progress, hearts }));
  }
  const status = document.createElement('output');
  status.setAttribute('aria-label', 'QA diagnostics');
  status.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:1000;background:#e0f2fe;color:#075985;padding:4px 7px;font:11px sans-serif;border-radius:6px;pointer-events:none';
  document.body.append(status);
  const updateStatus = () => {
    const progress = JSON.parse(qaStorage.getItem('mock-progress') || '{}');
    const completions = JSON.parse(qaStorage.getItem('mock-completions') || '[]');
    const vocab = JSON.parse(qaStorage.getItem('mock-vocab') || '{}');
    const scheduled = Object.values(vocab).filter(word => word.srs?.nextReviewDate > Date.now()).length;
    status.textContent = `Isolated QA · XP ${progress.xp || 0} · bite completions ${completions.filter(c => c.type === 'lesson-bite').length} · SRS ${scheduled}`;
  };
  window.addEventListener('error', e => { status.textContent = `QA error: ${e.message}`; });
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/')) return nativeFetch(input, init);
    let payload = {};
    if (url.pathname === '/api/auth/session') payload = { user: profile };
    else if (url.pathname === '/api/data') {
      const { action, args = {} } = JSON.parse(init?.body || '{}');
      let result = null;
      if (action === 'profile.ensure' || action === 'profile.get') result = profile;
      else if (action === 'profile.update') {
        if (params.has('saveError') && !qaStorage.getItem('save-error-tested')) {
          qaStorage.setItem('save-error-tested', '1');
          return new Response(JSON.stringify({ error: 'QA simulated connection failure' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
        Object.assign(profile, args.patch);
        qaStorage.setItem('mock-profile', JSON.stringify(profile));
        result = profile;
      }
      else if (action === 'progress.get') result = JSON.parse(qaStorage.getItem('mock-progress') || '{"xp":0,"coins":0}');
      else if (action === 'progress.set') qaStorage.setItem('mock-progress', JSON.stringify(args.data));
      else if (action === 'vocab.list') result = JSON.parse(qaStorage.getItem('mock-vocab') || '{}');
      else if (action === 'vocab.upsert') qaStorage.setItem('mock-vocab', JSON.stringify({ ...JSON.parse(qaStorage.getItem('mock-vocab') || '{}'), [args.word]: args.data }));
      else if (action === 'lesson.list' || action === 'completions.list') result = [];
      else if (action.endsWith('.list')) result = [];
      else if (action === 'completions.upsert') {
        const list = JSON.parse(qaStorage.getItem('mock-completions') || '[]');
        qaStorage.setItem('mock-completions', JSON.stringify([...list, args.record]));
      }
      payload = { result };
      updateStatus();
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  if (params.get('scenario') === 'resume' && !qaStorage.getItem('resume-seeded')) {
    const texts = await nativeFetch('/level-texts.json').then(r => r.json());
    const { deriveBites } = await import('/src/lib/bites/deriveBites.ts');
    const tx = texts.Beginner[0];
    const def = deriveBites(tx)[0];
    qaStorage.setItem(`smarty_${uid}_bite_session_v1`, JSON.stringify({
      version: 1, lang: 'en', id: def.id, signature: JSON.stringify(def.steps), steps: def.steps, index: 2, elapsed: 120000,
      scores: def.steps.slice(0, 2).map(step => ({ kind: step.kind, percent: 100, mistakes: [], correctWords: step.words || [] })),
    }));
    qaStorage.setItem('resume-seeded', '1');
    location.hash = `#/lessons/bite/en/${encodeURIComponent(tx.id)}/0`;
  } else if (!location.hash) location.hash = params.has('account') ? '#/dashboard' : '#/lessons/path/Beginner';
  updateStatus();
  await import('/src/main.tsx');
}
