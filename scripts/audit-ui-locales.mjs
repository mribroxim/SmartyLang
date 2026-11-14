/** Strict, offline UI-pack validation. `--json` emits a machine-readable report. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, sourceHash, translationIssues } from './ui-locale-tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const source = read('src/locales/ui.en.json');
const packs = read('src/locales/ui.generated.json');
const approvedPath = path.join(root, 'scripts/ui-locale-identical.json');
const approved = fs.existsSync(approvedPath) ? JSON.parse(fs.readFileSync(approvedPath, 'utf8')) : {};
const report = { languages: LANGS.length + 1, sourceKeys: Object.keys(source).length, sourceHash: sourceHash(source), errors: [], byLanguage: {} };
for (const language of Object.keys(packs)) if (!LANGS.includes(language)) report.errors.push({ language, type: 'unknown-language' });
for (const language of LANGS) {
  const pack = packs[language] ?? {};
  const errors = [];
  for (const [key, text] of Object.entries(source)) for (const type of translationIssues(text, pack[key], language, approved)) errors.push({ key, type });
  for (const key of Object.keys(pack)) if (!(key in source)) errors.push({ key, type: 'obsolete-key' });
  const splitPath = path.join(root, `src/locales/ui/${language}.json`);
  if (!fs.existsSync(splitPath)) errors.push({ type: 'split-pack-missing' });
  else if (JSON.stringify(JSON.parse(fs.readFileSync(splitPath, 'utf8'))) !== JSON.stringify(pack)) errors.push({ type: 'split-pack-mismatch' });
  report.byLanguage[language] = { keys: Object.keys(pack).length, errors: errors.length };
  report.errors.push(...errors.map(error => ({ language, ...error })));
}
if (fs.existsSync(path.join(root, 'src/locales/ui.generated.meta.json'))) {
  const meta = read('src/locales/ui.generated.meta.json');
  if (meta.sourceHash !== report.sourceHash) report.errors.push({ type: 'stale-source', message: 'English source changed after pack generation.' });
}
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`${report.languages} languages · ${report.sourceKeys} source keys`);
  for (const [language, result] of Object.entries(report.byLanguage)) console.log(`${language}: ${result.keys} keys · ${result.errors} errors`);
  for (const issue of report.errors.slice(0, 45)) console.log(`  ${issue.language ?? 'all'} ${issue.key ?? ''}: ${issue.type}`);
  console.log(report.errors.length ? `FAILED: ${report.errors.length} issue(s). Use --json for every issue.` : 'PASS: complete packs; placeholders, brands and copy checks passed.');
}
process.exitCode = report.errors.length ? 1 : 0;
