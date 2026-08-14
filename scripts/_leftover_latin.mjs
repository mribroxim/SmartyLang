import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
const func=/^(the|a|an|and|of|to|in|is|are|was|were|for|with|on|at|as|by|from|it|he|she|they|we|you|my|his|her|their|our|this|that|these|those|have|has|had|can|could|will|would|should|not|but|or|because|about|learn|learning|speak|speaking|write|writing|read|reading|study|studying|english|do|does|did|be|been|being|i|people|their|there|over|under|into|up|down|out|than|then|them|who|what|when|where|why|how|which|its|very|also|more|most|one|two|three|when|while|during|after|before|through|between|among|from|about|said|says|like|likes)$/i;
const langs=process.argv.slice(2);
function walk(o,out,skip){ if(o===null||o===undefined)return; if(typeof o==='string'){out.push(o);return;} if(Array.isArray(o)){o.forEach(v=>walk(v,out,skip));return;} if(typeof o==='object'){for(const k in o){if(skip&&skip.includes(k))continue;walk(o[k],out,skip);}} }
for(const lang of langs){
  console.log(`\n=========== ${lang} ===========`);
  for(const f of ['speaking-topics.json','writing-topics.json','level-texts.json','comprehensive-reading.json','task2.json','task1.json']){
    const file=path.join(base,lang,f);
    if(!fs.existsSync(file))continue;
    const d=JSON.parse(fs.readFileSync(file,'utf8'));
    const strs=[]; const skip=f==='task1.json'?['chartData']:['vocabulary'];
    walk(d,strs,skip);
    const seen=new Set();
    for(const s of strs){
      if(s.length<12)continue;
      if(seen.has(s))continue; seen.add(s);
      // count english words out of total words
      const toks=s.split(/[^A-Za-z']+/).filter(x=>x);
      if(toks.length<5)continue;
      const eng=toks.filter(t=>func.test(t)).length;
      const ratio=eng/toks.length;
      if(ratio>=0.25){
        console.log(` [${f}] ${s.slice(0,160)}`);
      }
    }
  }
}
