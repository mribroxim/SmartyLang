import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function files(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.tsx')?[path.join(dir,e.name)]:[]);}
let total=0;
for(const file of files('src')){
 const src=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(node){
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['useMemo','useCallback'].includes(node.expression.text)&&node.arguments.length===2){
   const fn=node.arguments[0],deps=node.arguments[1];
   if((ts.isArrowFunction(fn)||ts.isFunctionExpression(fn))&&ts.isArrayLiteralExpression(deps)){
    const needed=new Set();const scan=n=>{if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&['t','tr','tText','tLevel','tLevelDesc'].includes(n.expression.text))needed.add(n.expression.text);ts.forEachChild(n,scan);};scan(fn.body);
    for(const dep of deps.elements)if(ts.isIdentifier(dep))needed.delete(dep.text);
    if(needed.size)edits.push({pos:deps.end-1,value:(deps.elements.length?', ':'')+[...needed].join(', ')});
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);if(edits.length){let out=src;for(const e of edits.sort((a,b)=>b.pos-a.pos))out=out.slice(0,e.pos)+e.value+out.slice(e.pos);fs.writeFileSync(file,out);total+=edits.length;console.log(file,edits.length);}
}
console.log(`Updated ${total} memo/callback dependency lists so UI language changes refresh translated text.`);
