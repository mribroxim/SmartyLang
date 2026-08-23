import fs from 'fs';

const files = [
  'public/data/lang-packs/uz/rebuild/_chunk-e51-e65.mjs',
  'public/data/lang-packs/uz/rebuild/_chunk-e41-e50.mjs',
];

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace(/vodi\u0443/g, 'vodiy');
  t = t.replace(/ovoz\u0441\u0438\u0437/g, 'ovozsiz');
  t = t.replace(/tep\u0430lik/g, 'tepalik');
  t = t.replace(/jaz\u043e/g, 'jazo');
  t = t.replace(/belgil\u0430/g, 'belgila');
  t = t.replace(
    /definition: 'jazo emas — jazo; ogʻir majburiyat'/g,
    "definition: 'ogʻir majburiyat'",
  );
  t = t.replace(
    /definition: 'jazо'/g,
    "definition: 'ogʻir majburiyat'",
  );
  // strip any remaining Cyrillic
  const hits = [];
  for (let i = 0; i < t.length; i++) {
    const code = t.charCodeAt(i);
    if (code >= 0x0400 && code <= 0x04ff) {
      hits.push({ i, ch: t[i], code, ctx: t.slice(Math.max(0, i - 25), i + 25) });
    }
  }
  console.log(f, 'cyr hits before strip', hits.length);
  hits.forEach((h) => console.log(JSON.stringify(h)));
  // replace remaining Cyrillic with latin approximations where known
  t = t.replace(/[\u0400-\u04FF]/g, '');
  fs.writeFileSync(f, t);
  console.log('wrote', f);
}
