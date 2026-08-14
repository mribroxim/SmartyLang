import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
const langs=process.argv.slice(2);
const nativeTest={ar:/[\u0600-\u06FF]/,fa:/[\u0600-\u06FF]/,ur:/[\u0600-\u06FF]/,hi:/[\u0900-\u097F]/,el:/[\u0370-\u03FF]/,ja:/[\u3040-\u30FF\u4E00-\u9FFF]/,ko:/[\uAC00-\uD7AF\u1100-\u11FF]/,zh:/[\u4E00-\u9FFF]/,th:/[\u0E00-\u0E7F]/,sw:/[^a-z]/i,tr:/(?![a-zçğıöşüÇĞİÖŞÜ])/i,uz:/[^a-z']/i,vi:/(?![a-zàáảãạăắằẳẵặâấầẩẫậ])/i,id:/(?![a-z])/i,ms:/(?![a-z])/i};
const isEnglishOnly=(s,lang)=>{ if(lang in nativeTest){ return /[A-Za-z]{5,}/.test(s) && !nativeTest[lang].test(s); } else { return false; } };
for (const lang of langs){
  const f=path.join(base,lang,'comprehensive-reading.json');
  if(!fs.existsSync(f))continue;
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  const byLevel={};
  let totalItems=0, engTitle=0, engPassage=0, both=0;
  d.forEach((it,i)=>{
    totalItems++;
    const t=(it.title||''), p=(it.passage||'');
    const te=isEnglishOnly(t,lang), pe=isEnglishOnly(p,lang);
    if(te){engTitle++;}
    if(pe){engPassage++;}
    if(te&&pe)both++;
  });
  console.log(`${lang}: items=${totalItems} engTitle=${engTitle} engPassage=${engPassage} both=${both}`);
}
