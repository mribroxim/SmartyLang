import fs from 'fs';

const fp = 'public/data/lang-packs/es/level-texts.json';
let raw = fs.readFileSync(fp, 'utf8');

// Strip trailing literal \n (backslash + n)
while (raw.endsWith('\\n')) {
  raw = raw.slice(0, -2);
}
if (!raw.endsWith('\n')) raw += '\n';

JSON.parse(raw);
fs.writeFileSync(fp, raw);
console.log('repaired es level-texts.json, ends with', [...Buffer.from(raw.slice(-5))]);

// Also fix a100 su vida if still present
const es = JSON.parse(raw);
for (const level of Object.keys(es)) {
  for (const p of es[level]) {
    if (p.id === 'a100' || p.id === 'a50') {
      p.text = p.text
        .replace(/en su vida profesional y personal/g, 'en tu vida profesional y personal')
        .replace(/conectarse con otros/g, 'conectar con los demás')
        .replace(/te permite conectar con otros/g, 'te permite conectar con los demás');
    }
  }
}
fs.writeFileSync(fp, JSON.stringify(es, null, 2) + '\n');
JSON.parse(fs.readFileSync(fp, 'utf8'));
console.log('a100 ok', es.Advanced.find((p) => p.id === 'a100').text.slice(-120));
