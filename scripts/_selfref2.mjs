import fs from 'fs';
import path from 'path';
const base='public/data/lang-packs';
// learner self-ref patterns translated per language: "I speak/write/read/learn/study/practice my own language"
// search files speaking-topics, writing-topics, level-texts, dictation (learner-voice)
const langs=process.argv.slice(2);
const patterns={
  tr:/(İngilizce (konuş|yaz|ok|öğren|çalış)|İngilizcem|İngilizce (biliyor|konuşabiliyor))/i,
  uz:/(ingliz (tilida )?(gapir|yoz|o'qi|o'rgan)|ingliz tili)/i,
  id:/(berbahasa Inggris|Bahasa Inggris (saya|ku)|belajar bahasa Inggris|mengerti bahasa Inggris)/i,
  ms:/(berbahasa Inggeris|Bahasa Inggeris (saya|aku)|belajar bahasa Inggeris)/i,
  vi:/(nói tiếng Anh|tiếng Anh của (tôi|mình)|học tiếng Anh|viết tiếng Anh)/i,
  ar:/(أتكلم الإنجليزية|الانجليزية|الإنجليزية|أتحدث الإنجليزي|لغتي)/,
  fa:/(انگلیسی صحبت|انگلیسی حرف|زبان انگلیسی من|انگلیسی یاد|انگلیسی می)/,
  ur:/(انگریزی بول|انگریزی لکھ|میری انگریزی|انگریزی سیکھ|انگریزی پڑھ)/,
  sw:/(kizungumza Kiingereza|Kiingereza changu|kujifunza Kiingereza|Kiingereza)/i,
  hi:/(मेरी अंग्रेजी|अंग्रेजी बोल|अंग्रेजी सीख|अंग्रेजी पढ़|английский)/,
  el:/(μιλώ αγγλικ|μαθαίνω αγγλικ|αγγλικ)/i,
  ja:/(英語が話|英語を話|英語を学|私の英語|英語が)/,
  ko:/(영어를 말|영어로 말|영어를 배우|내 영어|영어 (잘|더))/,
  zh:/(我(的)?(会|能|可以)?说英语|学习英语|学英语|我的英语|我会说英语)/,
  th:/(พูดภาษาอังกฤษ|เรียนภาษาอังกฤษ|ภาษาอังกฤษของฉัน)/,
};
const files=['speaking-topics.json','writing-topics.json','level-texts.json'];
for(const lang of langs){
  const re=patterns[lang];
  if(!re){continue;}
  console.log(`\n########## ${lang} (self-ref candidates) ##########`);
  for(const f of files){
    const file=path.join(base,lang,f);
    if(!fs.existsSync(file))continue;
    const d=JSON.parse(fs.readFileSync(file,'utf8'));
    const out=[];
    (function walk(o){ if(typeof o==='string'){ out.push(o);} else if(Array.isArray(o)){o.forEach(walk);} else if(typeof o==='object'){for(const k in o)walk(o[k]);} })(d);
    const seen=new Set();
    for(const s of out){ if(re.test(s)&&!seen.has(s)){ seen.add(s); console.log(`  [${f}] ${s.slice(0,220)}`); } }
  }
}
