// Conservative reachability: retain literal keys, English values used by tText,
// and every family referenced through a template or concatenation.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'src/locales/ui.en.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const literals = new Set();
// Numbered mascot pools build keys through seq(prefix, count), rather than
// templates. Keep both families so pruning never removes their spoken copy.
const prefixes = new Set(['smarty.', 'mascot.', 'room.', 'ex.', 'practice.', 'quests.', 'ach.', 'vocab.tab.', 'history.cat.', 'legal.', 'safety.', 'account.']);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'locales') walk(file); continue; }
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteralLike(node)) literals.add(node.text);
      if (ts.isTemplateExpression(node) && node.head.text.includes('.')) prefixes.add(node.head.text);
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken && ts.isStringLiteralLike(node.left) && node.left.text.includes('.')) prefixes.add(node.left.text);
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
}
walk(path.join(root, 'src'));
const unused = Object.keys(source).filter(key => !literals.has(key) && !literals.has(source[key]) && ![...prefixes].some(prefix => key.startsWith(prefix)));
console.log(JSON.stringify({ sourceKeys: Object.keys(source).length, unusedKeys: unused.length, protectedPrefixes: [...prefixes].sort(), removed: unused }, null, 2));
if (process.argv.includes('--write')) {
  for (const key of unused) delete source[key];
  fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n');
}
