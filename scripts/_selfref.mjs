import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
// lang -> array of English-identifying substrings (native word for English)
const engWords={
  tr:['İngilizce','İngiliz','ingilizce'],
  uz:['ingliz','Ingliz'],
  id:['Inggris','inggris','Inggeris'],
  ms:['Inggeris','Inggris','inggeris'],
  vi:['tiếng Anh','Tiếng Anh','Anh ngữ'],
  ar:['إنجليزي','إنجليزي','الانجليزيه','الانجليزية','الإنجليزية','الانجليزية'],
  fa:['انگلیسی','انگليسي'],
  ur:['انگریزی','انگريزی'],
  sw:['Kiingereza','kiingereza'],
  hi:['अंग्रेज़ी','अंग्रेजी','English'],
  el:['αγγλικ','Αγγλικ'],
  ja:['英語'],
  ko:['영어'],
  zh:['英语','英語'],
  th:['ภาษาอังกฤษ'],
};
const jsonFiles=['speaking-topics.json','writing-topics.json','level-texts.json','comprehensive-reading.json','task1.json','task2.json'];
const langs=process.argv.slice(2);
function walkStr(o,out,ctx,paths){ if(o===null||o===undefined)return; if(typeof o==='string'){out.push([o,ctx]);return;} if(Array.isArray(o)){o.forEach((v,i)=>walkStr(v,out,ctx+'['+i+']',paths));return;} if(typeof o==='object'){for(const k in o)walkStr(o[k],out,ctx+'.'+k,paths);} }
for(const lang of langs){
  const words=engWords[lang];
  if(!words){console.log(`no words for ${lang}`);continue;}
  const re=new RegExp(words.join('|'),'gi');
  console.log(`\n########## ${lang} ##########`);
  for(const f of jsonFiles){
    const file=path.join(base,lang,f);
    if(!fs.existsSync(file))continue;
    let data; try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){console.log('PARSEFAIL',f);continue;}
    const strs=[]; walkStr(data,strs,'',null);
    const shown=new Set();
    let n=0;
    for(const [s,ctx] of strs){
      if(re.test(s) && !shown.has(s)){
        shown.add(s);
        // only print contextual-ish (short sentences) to keep output manageable
        if(s.length<260){
          console.log(`  [${f}]${ctx} :: ${s}`);
        }
        n++;
      }
    }
  }
}
