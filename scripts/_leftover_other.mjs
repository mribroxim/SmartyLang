import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
const nativeTest={ar:/[\u0600-\u06FF]/,fa:/[\u0600-\u06FF]/,ur:/[\u0600-\u06FF]/,hi:/[\u0900-\u097F]/,el:/[\u0370-\u03FF]/,ja:/[\u3040-\u30FF\u4E00-\u9FFF]/,ko:/[\uAC00-\uD7AF\u1100-\u11FF]/,zh:/[\u4E00-\u9FFF]/,th:/[\u0E00-\u0E7F]/};
// English-only test: for non-latin native, string has no native chars and has long english words
const enOnly=(s,nat)=>{ if(nat && !nat.test(s)) return /[A-Za-z]{6,}/.test(s); return false; };
const langs=process.argv.slice(2);
function walk(o,out,skip){ if(o===null||o===undefined)return; if(typeof o==='string'){out.push(o);return;} if(Array.isArray(o)){o.forEach(v=>walk(v,out,skip));return;} if(typeof o==='object'){for(const k in o){if(skip&&skip.includes(k))continue; walk(o[k],out,skip);}} }
for(const lang of langs){
  const nat=nativeTest[lang];
  if(!nat) continue; // only non-latin native for title detection
  console.log(`\n===== ${lang} =====`);
  for(const f of ['level-texts.json','speaking-topics.json','writing-topics.json']){
    const file=path.join(base,lang,f);
    if(!fs.existsSync(file))continue;
    const d=JSON.parse(fs.readFileSync(file,'utf8'));
    // level-texts: titles only; speaking/writing: whole strings
    if(f==='level-texts.json'){
      for(const lvl in d){ if(Array.isArray(d[lvl])) d[lvl].forEach((it,i)=>{ if(it&&it.title&&enOnly(it.title,nat)) console.log(` [${f}][${lvl}][${i}] TITLE ${JSON.stringify(it.title)}`); }); }
    } else {
      const strs=[]; walk(d,strs);
      const seen=new Set();
      for(const s of strs){ if(s.length<8)continue; if(seen.has(s))continue; seen.add(s); if(enOnly(s,nat)){ const w=(s.match(/[A-Za-z]+/g)||[]).length; if(w>=4) console.log(` [${f}] ${s.slice(0,120)}`); } }
    }
  }
}
