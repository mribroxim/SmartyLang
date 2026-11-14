import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';

const files = ["src/App.tsx","src/features/AdminPanel.tsx","src/features/ContentManager.tsx","src/features/TeacherDashboard.tsx","src/features/StudentClasses.tsx","src/features/SmartyMaxSeats.tsx","src/features/ComprehensiveListening.tsx","src/features/ComprehensiveReading.tsx","src/features/DictionaryView.tsx","src/features/ExercisesView.tsx","src/features/Gamification.tsx","src/features/IELTSFullMock.tsx","src/features/IELTSHub.tsx","src/features/IELTSListening.tsx","src/features/IELTSReading.tsx","src/features/IELTSSpeaking.tsx","src/features/InteractiveStory.tsx","src/features/ListeningDictation.tsx","src/features/NotificationBell.tsx","src/features/Shadowing.tsx","src/features/SpeakingBuddy.tsx","src/features/SpeakingHub.tsx","src/features/WritingHub.tsx","src/features/WritingMock.tsx","src/features/WritingTask1.tsx","src/features/WritingTask2.tsx","src/features/Plans/CancelMaxFlow.tsx","src/components/feedback/SmartyLoader.tsx","src/components/mascot/SmartySettingsCard.tsx"];
const english = JSON.parse(fs.readFileSync('src/locales/ui.en.json','utf8'));
const additionsPath='src/locales/additions/site.json';
const additions = fs.existsSync(additionsPath)?JSON.parse(fs.readFileSync(additionsPath,'utf8')):{};
const existing = new Map(Object.entries({...english,...additions}).map(([k,v])=>[v,k]));
const attrs = new Set(['title','subtitle','label','description','desc','alt','placeholder','aria-label','navLabel','emptyText','buttonText','hint']);
function key(text,file) {
  if(existing.has(text))return existing.get(text);
  const slug=text.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim().split(/\s+/).slice(0,5).join('_') || 'label';
  const k=`site.${path.basename(file,'.tsx').toLowerCase()}.${slug}_${crypto.createHash('sha1').update(text).digest('hex').slice(0,6)}`;
  additions[k]=text; existing.set(text,k);return k;
}
function worth(text) {return /[A-Za-z]/.test(text) && !/^(SmartyLang|Smarty|Smarty\.|S|XP|AI|IELTS|USD|UZS|Instagram|TikTok|YouTube|X)$/.test(text);}
function component(node) {
  for(let p=node;p;p=p.parent) {
    if(ts.isFunctionDeclaration(p)&&p.name&&/^[A-Z]/.test(p.name.text)&&p.body)return p;
    if((ts.isArrowFunction(p)||ts.isFunctionExpression(p))&&ts.isVariableDeclaration(p.parent)&&ts.isIdentifier(p.parent.name)&&/^[A-Z]/.test(p.parent.name.text))return p;
  }
}
for(const file of files) {
 if(!fs.existsSync(file))continue;
 const src=fs.readFileSync(file,'utf8'), tree=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const edits=[], funcs=new Set(), seen=new Set();
 function replace(node,text,kind='expr') {
   if(!worth(text))return;
   const owner=component(node); if(!owner)return;
   const pos=node.getStart(tree),end=node.end;if(seen.has(pos))return;seen.add(pos);
   const call=`t(${JSON.stringify(key(text,file))})`;
   edits.push({pos,end,value:kind==='jsx'?`{${call}}`:kind==='attr'?`{${call}}`:call});funcs.add(owner);
 }
 function expr(node) {
   if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){replace(node,node.text);return;}
   if(ts.isConditionalExpression(node)){expr(node.whenTrue);expr(node.whenFalse);return;}
   if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.PlusToken].includes(node.operatorToken.kind)){expr(node.left);expr(node.right);return;}
   if(ts.isParenthesizedExpression(node)){expr(node.expression);return;}
   
   
 }
 function visit(node){
   if(ts.isJsxText(node)) {
     // Match JSX whitespace normalization while keeping separators around inline nodes.
     const lines=node.text.replace(/\r/g,'').split('\n');
     let text=lines.map((s,i)=>i===0?s.replace(/\s+$/,''):i===lines.length-1?s.replace(/^\s+/,''):s.trim()).filter(Boolean).join(' ');
     text=text.replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
     const lead=/^\s/.test(text)?' ':'';const trail=/\s$/.test(text)?' ':'';
     if(worth(text.trim())){ const before=edits.length;replace(node,text.trim(),'jsx');if(edits.length>before)edits.at(-1).value=`${lead}${edits.at(-1).value}${trail}`; }
   } else if(ts.isJsxAttribute(node)&&attrs.has(node.name.text)&&node.initializer){
     if(ts.isStringLiteral(node.initializer))replace(node.initializer,node.initializer.text,'attr');
     else if(ts.isJsxExpression(node.initializer)&&node.initializer.expression)expr(node.initializer.expression);
   } else if(ts.isJsxExpression(node)&&!ts.isJsxAttribute(node.parent)&&node.expression)expr(node.expression);
   ts.forEachChild(node,visit);
 }
 visit(tree);
 if(!edits.length)continue;
 let needImport=false;
 for(const fn of funcs){
   const param=fn.parameters.map(p=>p.getText(tree)).join(',');
   const body=fn.body.getText(tree);
   if(/\bt\b/.test(param)||/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useUiLang\(/.test(body))continue;
   if(body.includes('useUiLang()')){
     const m=/const\s*\{([^}]*)\}\s*=\s*useUiLang\(\)/.exec(body);
     if(m){const pos=fn.body.getStart(tree)+m.index+m[0].indexOf('{')+1;edits.push({pos,end:pos,value:' t,'});continue;}
   }
   needImport=true;
   if(ts.isBlock(fn.body))edits.push({pos:fn.body.getStart(tree)+1,end:fn.body.getStart(tree)+1,value:'\n  const { t } = useUiLang();'});
   else {
    edits.push({pos:fn.body.getStart(tree),end:fn.body.getStart(tree),value:'{ const { t } = useUiLang(); return ('});
    edits.push({pos:fn.body.end,end:fn.body.end,value:'); }'});
   }
 }
 if(needImport&&!src.includes("import { useUiLang }")){
   const rel=path.relative(path.dirname(file),'src/contexts/UiLangContext').replaceAll('\\','/');
   edits.push({pos:0,end:0,value:`import { useUiLang } from '${rel.startsWith('.')?rel:'./'+rel}';\n`});
 }
 let out=src;for(const e of edits.sort((a,b)=>b.pos-a.pos||b.end-a.end))out=out.slice(0,e.pos)+e.value+out.slice(e.end);
 fs.writeFileSync(file,out);console.log(file,edits.length);
}
fs.mkdirSync(path.dirname(additionsPath),{recursive:true});fs.writeFileSync(additionsPath,JSON.stringify(additions,null,2)+'\n');
console.log('New keys',Object.keys(additions).length);
