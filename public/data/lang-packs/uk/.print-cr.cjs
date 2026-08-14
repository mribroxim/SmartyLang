const fs = require('fs');
const p = JSON.parse(fs.readFileSync('public/data/lang-packs/uk/.cr-beginner-pair.json', 'utf8'));
const start = Number(process.argv[2] || 0);
const end = Number(process.argv[3] || 25);
for (let i = start; i < end && i < p.length; i++) {
  const x = p[i];
  console.log('###' + i + '|' + x.titleEn + '|' + x.titleUk);
  console.log('EN:', x.passageEn);
  console.log('UK:', x.passageUk);
  x.qs.forEach((q, qi) => {
    console.log(' Q' + qi + ' a=' + q.a + ' EN:' + q.tEn + ' | ' + q.oEn.join('/'));
    console.log('    UK:' + q.tUk + ' | ' + q.oUk.join('/'));
  });
  console.log('');
}
