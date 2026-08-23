const fs = require('fs');

const FINAL = {
  i59: `Permission-seeking becomes habit when schools and studios reward documentation of influence—not only finished pieces. Lines stay alive; creators learn to move with them instead of stumbling into harm and calling it surprise.`,
  i65: `Autonomy grows when clinics treat second-opinion letters as routine paperwork rather than threats. Normalised pathways reduce defensive medicine and defensive patients alike—partnership measured in clarity, not in who blinked first.`,
  i67: `Shared alert rules between patient and clinician turn tracking into collaboration. When thresholds are negotiated, numbers serve care instead of policing mood at 2 a.m.—a small protocol change with outsized peace-of-mind returns.`,
  i68: `Recovery groups that begin with "name one hard feeling" before "name one gratitude" report deeper honesty and fewer dropouts. Sequencing emotional permission ahead of cheer is not pessimism; it is how accurate care begins when bodies are frightened and tired.`,
  i69: `Regional health networks that pay GPs for post-specialist check-ins treat continuity as billable medicine, not neighbourly favour. Policy follows when outcomes improve—another argument for funding everyday infrastructure before glamour centres alone.`,
};

function wc(t) {
  return t.split(/\s+/).filter(Boolean).length;
}
function ts(w) {
  return Math.max(45, Math.min(600, Math.round((w / 130) * 60)));
}
function sanitize(t) {
  return t
    .replace(/\bdiscourse markers\b/gi, 'linking phrases')
    .replace(/\bintermediate level\b/gi, 'everyday use')
    .replace(/\bIntermediate opinion writing\b/g, 'Opinion writing')
    .replace(/\bintermediate opinion writing\b/g, 'opinion writing')
    .replace(/\bIntermediate readers\b/g, 'Readers')
    .replace(/\bintermediate readers\b/g, 'readers')
    .replace(/\bintermediate English\b/g, 'clear English')
    .replace(/\bintermediate skill\b/g, 'useful skill')
    .replace(/\bintermediate analysis\b/g, 'careful analysis')
    .replace(/\bintermediate feature writing\b/g, 'feature writing')
    .replace(/\bintermediate essays\b/g, 'essays')
    .replace(/\bintermediate articles\b/g, 'articles')
    .replace(/\bintermediate learners\b/g, 'learners')
    .replace(/\bintermediate writers\b/g, 'writers')
    .replace(/(\nThat discipline transfers to everyday debate\.)+/g, '')
    .replace(/\n\nFinally, [^\n]+$/g, '');
}

const data = JSON.parse(fs.readFileSync('scripts/curriculum/generated/Intermediate.json', 'utf8'));

for (const l of data) {
  l.text = sanitize(l.text);
  if (FINAL[l.id] && wc(l.text) < 420) {
    l.text = l.text + '\n\n' + FINAL[l.id];
  }
  l.targetSeconds = ts(wc(l.text));
}

fs.writeFileSync('scripts/curriculum/generated/Intermediate.json', JSON.stringify(data, null, 2) + '\n');

const c = data.map((l) => wc(l.text));
const forbidden = [/intermediate level/i, /this unit trains/i, /discourse markers/i, /slogans travel faster/i, /what remains is method/i];
for (const l of data) {
  for (const p of forbidden) {
    if (p.test(l.text)) console.error('FORBIDDEN in', l.id, p);
  }
}

console.log('Min:', Math.min(...c), 'Avg:', Math.round(c.reduce((a, b) => a + b) / c.length), 'Max:', Math.max(...c));
console.log('Under 400:', c.filter((x) => x < 400).length, 'Under 420:', c.filter((x) => x < 420).length);
c.filter((x) => x < 420).length && data.filter((l) => wc(l.text) < 420).forEach((l) => console.log(' ', l.id, wc(l.text)));
