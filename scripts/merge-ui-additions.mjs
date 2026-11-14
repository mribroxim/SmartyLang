import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root,'src/locales/ui.en.json');
const additionsDir = path.join(root,'src/locales/additions');
const source = JSON.parse(fs.readFileSync(target,'utf8'));
let count = 0;
for (const name of fs.readdirSync(additionsDir).filter(n=>n.endsWith('.json')).sort()) {
  const extra = JSON.parse(fs.readFileSync(path.join(additionsDir,name),'utf8'));
  for (const [key,value] of Object.entries(extra)) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Empty UI string: ${key}`);
    if (key in source && source[key] !== value) throw new Error(`Conflicting UI source: ${key}`);
    if (!(key in source)) {source[key]=value;count++;}
  }
}
fs.writeFileSync(target,JSON.stringify(source,null,2)+'\n');
console.log(`Merged ${count} UI messages; ${Object.keys(source).length} total English keys.`);
