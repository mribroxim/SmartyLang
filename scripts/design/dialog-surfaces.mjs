// One-time migration of legacy popup surfaces; preserves their motion props.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const fallback = {
  'src/App.tsx': ['() => setShowFeedbackModal(false)', '() => setIsExerciseCompleteModalOpen(false)', '() => setSelectedExerciseSession(null)'],
  'src/components/HabitCelebrateModal.tsx': ['onClose'],
  'src/components/MobileNav.tsx': ['() => setOpen(false)'],
  'src/features/ListeningDictation.tsx': ['() => setShowCustomForm(false)'],
  'src/features/SpeakingPractice.tsx': ['() => setShowNewForm(false)'],
  'src/features/StudentClasses.tsx': ['() => setShowJoin(false)'],
  'src/features/TeacherDashboard.tsx': ['() => setViewingAssignment(null)'],
  'src/features/WritingPractice.tsx': ['() => setShowCustomForm(false)'],
};
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.tsx') ? [path.join(dir, e.name)] : []); }
for (const file of walk('src')) {
  const key = file.replaceAll('\\', '/');
  if (key.endsWith('/DialogSurface.tsx') || key.endsWith('/feedback/Sheet.tsx') || key.endsWith('/ContentEditorDrawer.tsx')) continue;
  let source = fs.readFileSync(file, 'utf8'), edits = [], added = 0, absent = 0;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement, tag = opening.tagName.getText(ast);
      const attrs = opening.attributes.properties;
      const cls = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'className')?.getText(ast) || '';
      if (['div', 'motion.div'].includes(tag) && cls.includes('fixed inset-0') && node.children.some(c => ts.isJsxElement(c) || ts.isJsxExpression(c))) {
        const click = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'onClick');
        const handler = click?.initializer?.expression?.getText(ast) || fallback[key]?.[absent++];
        if (handler) {
          edits.push([opening.tagName.getStart(ast), opening.tagName.end, `DialogSurface${tag === 'motion.div' ? ' asComponent={motion.div}' : ''} onClose={${handler}}`]);
          edits.push([node.closingElement.tagName.getStart(ast), node.closingElement.tagName.end, 'DialogSurface']);
          added++;
        } else console.log(`Needs manual popup callback: ${key}:${ast.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!added) continue;
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + text + source.slice(end);
  let relative = path.relative(path.dirname(file), 'src/components/DialogSurface').replaceAll('\\', '/');
  if (!relative.startsWith('.')) relative = './' + relative;
  fs.writeFileSync(file, `import { DialogSurface } from '${relative}';\n` + source);
  console.log(`${key}: ${added} popup surfaces`);
}
