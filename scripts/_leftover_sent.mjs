import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
const nativeTest={ar:/[\u0600-\u06FF]/,fa:/[\u0600-\u06FF]/,ur:/[\u0600-\u06FF]/,hi:/[\u0900-\u097F]/,el:/[\u0370-\u03FF]/};
const langs=process.argv.slice(2);
function walk(o,out,skipKeys){ if(o===null||o===undefined)return; if(typeof o==='string'){out.push(o);return;} if(Array.isArray(o)){o.forEach(v=>walk(v,out,skipKeys));return;} if(typeof o==='object'){for(const k in o){ if(skipKeys&&skipKeys.includes(k))continue; walk(o[k],out,skipKeys);} } }
for(const lang of langs){
  const nat=nativeTest[lang];
  console.log(`\n=========== ${lang} ===========`);
  for(const f of ['speaking-topics.json','writing-topics.json','level-texts.json','task2.json','task1.json']){
    const file=path.join(base,lang,f);
    if(!fs.existsSync(file))continue;
    const d=JSON.parse(fs.readFileSync(file,'utf8'));
    const strs=[]; const skip = f==='task1.json'?['chartData']:[];
    walk(d,strs,skip);
    const seen=new Set();
    for(const s of strs){
      if(s.length<10)continue;
      if(sentLike(s,lang)&&!seen.has(s)){seen.add(s);console.log(` [${f}] ${s.slice(0,150)}`);}
    }
  }
}
function sentLike(s,lang){
  const nat=nativeTest[lang];
  if(!nat.test(s)){ // has no native script
    // english sentence with many words
    const words=(s.match(/[A-Za-z]+/g)||[]).length;
    return words>=4;
  }
  return false;
}
