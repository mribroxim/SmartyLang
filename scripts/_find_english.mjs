import fs from 'fs';
import path from 'path';

const base = 'public/data/lang-packs';

const langs = process.argv.slice(2);

function walkValues(obj, ctx, cb) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    cb(obj, ctx);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkValues(v, ctx + `[${i}]`, cb));
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      walkValues(v, ctx + `.${k}`, cb);
    }
  }
}

function scanJson(file, re, label) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const hits = [];
  walkValues(data, '$', (s) => {
    if (re.test(s)) hits.push(s);
  });
  return hits;
}

for (const lang of langs) {
  const dir = path.join(base, lang);
  console.log(`\n===== ${lang} =====`);
  const jsonFiles = ['speaking-topics.json','writing-topics.json','level-texts.json','comprehensive-reading.json','task1.json','task2.json'];
  for (const f of jsonFiles) {
    const file = path.join(dir, f);
    if (!fs.existsSync(file)) continue;
    const re = new RegExp(process.env.RE);
    const hits = scanJson(file, re, f);
    if (hits.length) {
      console.log(`\n--- ${f}: ${hits.length} hits ---`);
      hits.forEach(h => console.log(h.slice(0, 200)));
    }
  }
  const dictDir = path.join(dir, 'dictation');
  if (fs.existsSync(dictDir)) {
    for (const df of fs.readdirSync(dictDir)) {
      if (!df.endsWith('.txt')) continue;
      const content = fs.readFileSync(path.join(dictDir, df), 'utf8');
      const re = new RegExp(process.env.RE, 'g');
      const lines = content.split(/\r?\n/).filter(l => re.test(l));
      if (lines.length) {
        console.log(`\n--- dictation/${df}: ${lines.length} hits ---`);
        lines.forEach(l => console.log(l.slice(0, 200)));
      }
    }
  }
}
