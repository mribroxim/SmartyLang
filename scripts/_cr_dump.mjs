import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
const langs=process.argv.slice(2);
const nativeTest={ar:/[\u0600-\u06FF]/,fa:/[\u0600-\u06FF]/,ur:/[\u0600-\u06FF]/,el:/[\u0370-\u03FF]/,sw:/[^a-z]/i,uz:/[^a-z'\u2019]/i};
const isEnglishOnly=(s)=>{ return /[A-Za-z]{5,}/.test(s) && !nativeTest[process.env.LANG]?.test(s); };
for (const lang of langs){
  process.env.LANG=lang;
  const f=path.join(base,lang,'comprehensive-reading.json');
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  console.log(`\n========== ${lang} ==========`);
  d.forEach((it,i)=>{
    const t=(it.title||''), p=(it.passage||'');
    const te=isEnglishOnly(t), pe=isEnglishOnly(p);
    if(te||pe){
      console.log(`[${i}] level=${it.level} title=${JSON.stringify(t)}`);
      if(pe) console.log(`    passage=${JSON.stringify(p).slice(0,150)}`);
    }
  });
}
