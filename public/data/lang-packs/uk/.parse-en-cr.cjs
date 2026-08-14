const fs = require('fs');
const text = fs.readFileSync('public/data/comprehensive-reading/Comprehensive_Reading_Materials.txt', 'utf8');
const levels = text.split(/LEVEL:\s*/).slice(1);
const all = [];
for (const block of levels) {
  const levelName = block.match(/^([^\r\n]+)/)[1].trim();
  const parts = block.split(/\r?\nReading\s+\d+:\s*/).slice(1);
  for (const part of parts) {
    const lines = part.split(/\r?\n/);
    const title = lines[0].trim();
    // skip separator lines of dashes
    let i = 1;
    while (i < lines.length && (/^-{5,}$/.test(lines[i].trim()) || lines[i].trim() === '')) i++;
    const passageLines = [];
    while (i < lines.length && !/^\d+\./.test(lines[i].trim())) {
      if (!/^-{5,}$/.test(lines[i].trim()) && lines[i].trim() !== '') passageLines.push(lines[i].trim());
      i++;
    }
    const passage = passageLines.join(' ');
    const rest = lines.slice(i).join('\n');
    const qs = [];
    for (let n = 1; n <= 5; n++) {
      const qm = rest.match(
        new RegExp(
          n +
            '\\.\\s*([^\\n]+)\\n\\s*A\\)\\s*([^\\n]+)\\n\\s*B\\)\\s*([^\\n]+)\\n\\s*C\\)\\s*([^\\n]+)\\n\\s*D\\)\\s*([^\\n]+)'
        )
      );
      if (qm) qs.push({ text: qm[1].trim(), options: [qm[2].trim(), qm[3].trim(), qm[4].trim(), qm[5].trim()] });
    }
    const ak = rest.match(
      /Answer Key:\s*1\.\s*([A-D])\s*2\.\s*([A-D])\s*3\.\s*([A-D])\s*4\.\s*([A-D])\s*5\.\s*([A-D])/i
    );
    const map = { A: 0, B: 1, C: 2, D: 3 };
    const answers = ak ? [1, 2, 3, 4, 5].map((n) => map[ak[n].toUpperCase()]) : [];
    all.push({ level: levelName, title, passage, questions: qs, answers });
  }
}
console.log('parsed', all.length, 'empty', all.filter((x) => !x.passage).length);
console.log(all[0]);
console.log(all[2]);
fs.writeFileSync('public/data/lang-packs/uk/.en-cr.json', JSON.stringify(all, null, 2));

const uk = JSON.parse(fs.readFileSync('public/data/lang-packs/uk/comprehensive-reading.json', 'utf8'));
// Align EN by level+index within level since UK missing one Pre-Int
const enByLevel = {};
for (const e of all) {
  (enByLevel[e.level] ||= []).push(e);
}
const pair = uk.map((u, idx) => {
  const arr = enByLevel[u.level] || [];
  // find position among same level
  const li = uk.slice(0, idx + 1).filter((x) => x.level === u.level).length - 1;
  const e = arr[li];
  return {
    idx,
    level: u.level,
    li,
    titleUk: u.title,
    titleEn: e?.title,
    passageUk: u.passage,
    passageEn: e?.passage,
    qs: u.questions.map((q, qi) => ({
      tUk: q.text,
      tEn: e?.questions[qi]?.text,
      oUk: q.options,
      oEn: e?.questions[qi]?.options,
      a: q.answer,
    })),
  };
});
fs.writeFileSync('public/data/lang-packs/uk/.cr-pair-all.json', JSON.stringify(pair, null, 2));
fs.writeFileSync(
  'public/data/lang-packs/uk/.cr-beginner-pair.json',
  JSON.stringify(
    pair.filter((x) => x.level === 'Beginner'),
    null,
    2
  )
);
console.log('pairs', pair.length);
