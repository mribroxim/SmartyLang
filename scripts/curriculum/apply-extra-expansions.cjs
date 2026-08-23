const fs = require('fs');
const path = require('path');
const EXTRA = require('./intermediate-expansions-extra.cjs');
const EXTRA2 = require('./intermediate-expansions-extra2.cjs');

const JSON_PATH = path.join(__dirname, 'generated', 'Intermediate.json');

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function targetSeconds(wc) {
  return Math.max(45, Math.min(600, Math.round((wc / 130) * 60)));
}

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

for (const lesson of data) {
  let wc = wordCount(lesson.text);
  const extras = [...(EXTRA[lesson.id] || []), ...(EXTRA2[lesson.id] || [])];
  if (wc >= 420 || extras.length === 0) continue;
  lesson.text = lesson.text + '\n\n' + extras.join('\n\n');
  const newWc = wordCount(lesson.text);
  lesson.targetSeconds = targetSeconds(newWc);
  console.log(`${lesson.id}: ${wc} -> ${newWc}`);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

const counts = data.map((l) => wordCount(l.text));
const under400 = counts.filter((c) => c < 400).length;
const under420 = counts.filter((c) => c < 420).length;
console.log('\nMin:', Math.min(...counts), 'Avg:', Math.round(counts.reduce((a, b) => a + b, 0) / counts.length), 'Max:', Math.max(...counts));
console.log('Under 400:', under400, 'Under 420:', under420);
if (under400 > 0) process.exit(1);
