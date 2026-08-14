const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'));
const all = JSON.parse(fs.readFileSync('src/locales/ui.generated.json', 'utf8'));
const lang = process.argv[2];
const dict = all[lang];
if (!dict) { console.error('no lang', lang); process.exit(1); }
const keys = Object.keys(en);
for (const k of keys) {
  console.log(`## ${k}`);
  console.log(`EN: ${en[k]}`);
  console.log(`${lang}: ${dict[k]}`);
  console.log('');
}
