const fs = require('fs');
const boosts = {
  i43: 'Transparent pricing laws for essentials spread when shoppers refuse mystery fees and regulators copy the precedent—fairness as habit, not exception.',
  i44: 'Fair negotiation cultures publish expected ranges so skill stops taxing the uninformed—a small institutional fix for a old hidden subsidy.',
  i48: 'Lottery regulation that caps advertising near schools protects aspiration while limiting extraction—policy that respects hope without feeding predatory glow.',
  i49: 'Community market vouchers for low-income buyers preserve face-to-face trade without pricing out necessity—hybrid design worth copying.',
  i51: 'Taste training loosens when people meet art outside their algorithm—one deliberate detour per month can reopen preference without shame.',
  i55: 'Humane refusal scales when programmes batch feedback sessions instead of ghosting—standards with doors, not walls.',
  i56: 'Memory stays honest when nostalgia includes price tags others paid—affection with footnotes beats myth with soundtrack.',
  i57: 'Employers counting volunteer craft hours in hiring widen culture beyond credentialed lanes—recognition without replacing fair pay.',
  i59: 'Creators who ask permission before borrowing sacred motifs build audiences that trust them when lines blur—accountability as long-term craft strategy.',
  i62: 'Patients who rehearse one opening sentence in the car often report clearer visits—not certainty theatre, but respect for a genre with time limits.',
  i63: 'Ring-fenced prevention funds survive when voters reward politicians who show decade graphs, not only emergency clips—patience as civic virtue.',
  i65: 'Second opinions need not be battles; they can be partnerships that turn fear into informed agreement—even when prescriptions barely change.',
  i66: 'Waiting rooms improve when patients sit on redesign committees—access fixes authored by people who paid the bench in hours lost.',
  i67: 'Trackers serve patients best when clinicians co-write alert rules—shared thresholds beat default alarms that never sleep.',
  i68: 'Care improves when visitors ask what helps today instead of prescribing mood—small question, large relief from performance.',
  i69: 'Fund local follow-up after distant specialist visits; adherence rises when plans meet buses, kitchens, and shift patterns—not only OR brilliance.',
  i70: 'Write decisions while experts disagree; future selves forgive uncertainty better when reasons were captured before exhaustion edited memory.',
};

const data = JSON.parse(fs.readFileSync('scripts/curriculum/generated/Intermediate.json', 'utf8'));

function wc(t) {
  return t.split(/\s+/).filter(Boolean).length;
}
function ts(w) {
  return Math.max(45, Math.min(600, Math.round((w / 130) * 60)));
}

for (const l of data) {
  if (!boosts[l.id]) continue;
  const w = wc(l.text);
  if (w >= 420) continue;
  l.text = l.text + '\n\n' + boosts[l.id];
  const nw = wc(l.text);
  l.targetSeconds = ts(nw);
  console.log(`${l.id}: ${w} -> ${nw}`);
}

fs.writeFileSync('scripts/curriculum/generated/Intermediate.json', JSON.stringify(data, null, 2) + '\n');

const c = data.map((l) => wc(l.text));
console.log('\nMin:', Math.min(...c), 'Avg:', Math.round(c.reduce((a, b) => a + b) / c.length), 'Max:', Math.max(...c));
console.log('Under 400:', c.filter((x) => x < 400).length, 'Under 420:', c.filter((x) => x < 420).length);
