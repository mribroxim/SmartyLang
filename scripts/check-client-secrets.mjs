import fs from 'node:fs';
import path from 'node:path';
const patterns = [/sk-or-v1-[A-Za-z0-9]{30,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /AIza[0-9A-Za-z_-]{30,}/];
const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const secretValues = env.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z_]*(?:KEY|SECRET|PASSWORD))\s*=\s*(.+)$/);
  const value = match?.[2]?.trim().replace(/^['"]|['"]$/g, '');
  return value && value.length >= 12 && !/CHANGE_ME|generate-a/.test(value) ? [value] : [];
});
let files = 0, failures = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!/\.(js|css|html|json)$/.test(file)) continue;
    files++; const text = fs.readFileSync(file, 'utf8');
    if (patterns.some(pattern => pattern.test(text)) || secretValues.some(value => text.includes(value))) { failures++; console.error('Potential secret in client artifact:', file); }
  }
}
walk('dist');
console.log(`Scanned ${files} client artifacts; ${failures} potential secret exposures. Secret values are never printed.`);
process.exitCode = failures ? 1 : 0;
