// Inventory static UI literals. Learning passages, user content and data modules
// intentionally stay in the selected learning language and are not rewritten.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const attrs = new Set(['title', 'placeholder', 'aria-label', 'alt', 'label', 'subtitle', 'description', 'desc', 'emptyText', 'loadingText', 'confirmLabel', 'cancelLabel']);
function files(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : e.name.endsWith('.tsx') ? [path.join(dir,e.name)] : []); }
const findings = [];
let intentional = 0;
// Explicit examples belong to the lesson/editor schema, not interface copy.
const examples = new Map([
  ['src/components/InteractiveDemos.tsx', new Set(['A Beautiful Morning'])],
  ['src/Exercises.tsx', new Set(['The cat sat on the mat Learning a language is fun Practice makes perfect'])],
  ['src/features/TeacherDashboard.tsx', new Set(['es'])],
]);
for (const file of files(path.join(root, 'src'))) {
  if (/[/\\]stickers[/\\]/.test(file)) continue;
  const source = fs.readFileSync(file,'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function add(node,value,kind) {
    value = value.replace(/&ldquo;|&rdquo;/g,'“').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'");
    value = value.replace(/\s+/g,' ').trim();
    if (!/[A-Za-z]{2}/.test(value) || /^(Smarty(Lang)?( Max)?|IELTS|XP|PDF|SRS|CEFR|OK|Wordle|Instagram|TikTok|YouTube)$/.test(value)) return;
    const relative = path.relative(root,file).replaceAll('\\','/');
    if (examples.get(relative)?.has(value)) {intentional++;return;}
    if (relative === 'src/features/ContentManager.tsx') {
      if (['tfng','mcq'].includes(value)) {intentional++;return;}
      try { JSON.parse(value); intentional++; return; } catch { /* ordinary UI text */ }
    }
    findings.push({ file:relative, line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1, kind, value });
  }
  function visit(node) {
    if (ts.isJsxText(node)) add(node,node.text,'text');
    if (ts.isJsxAttribute(node) && attrs.has(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) add(node,node.initializer.text,'attribute');
    if (ts.isJsxExpression(node) && node.expression) {
      const inspect = n => {
        if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) add(n,n.text,'expression');
        else if (ts.isConditionalExpression(n)) {inspect(n.whenTrue);inspect(n.whenFalse);}
        else if (ts.isBinaryExpression(n) && [ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.AmpersandAmpersandToken].includes(n.operatorToken.kind)) inspect(n.right);
      };
      if (!ts.isJsxAttribute(node.parent) || attrs.has(node.parent.name.getText(ast))) inspect(node.expression);
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
}
if (process.argv.includes('--json')) console.log(JSON.stringify(findings,null,2));
else {
  const counts = new Map();
  for (const f of findings) counts.set(f.file,(counts.get(f.file)||0)+1);
  for (const [file,n] of [...counts].sort((a,b)=>b[1]-a[1])) console.log(`${String(n).padStart(4)} ${file}`);
  console.log(`\n${findings.length} unlocalized static UI candidates in ${counts.size} files; ${intentional} intentional lesson/code examples excluded.`);
}
if (process.argv.includes('--strict') && findings.length) process.exitCode = 1;
