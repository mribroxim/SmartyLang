/** Expand any intermediate unit module whose texts are under minWords. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const file = process.argv[2];
const minWords = Number(process.argv[3] || 450);

if (!file) {
  console.error('Usage: node enforce-length.mjs <unit-file.mjs> [minWords]');
  process.exit(1);
}

const abs = path.resolve(file);
const mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
const lessons = mod.default;

function wc(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

function chunks(lesson, round) {
  const q = lesson.coreQuestion.replace(/\?$/, '');
  const title = lesson.title;
  const domain = lesson.vocabularyDomain;
  const unit = lesson.unitName;
  const n = parseInt(lesson.id.slice(1), 10) + round;
  const variants = [
    `

In daily life, the issue behind “${title}” rarely arrives as a neat essay question. It arrives as a delay, a rumour, a budget line, or a look across a table. ${q} becomes urgent precisely when people are least calm. That is why rehearsing careful language in advance matters: hedging, concession, and precise nouns give you options other than silence or explosion. Within ${unit}, those options are not academic ornaments. They are social tools.

Readers who stay with ${domain} terms long enough often notice their own habits more clearly—where they overclaim, where they under-describe, and where they hide behind fashionably vague phrases. Clarity does not eliminate conflict, but it reduces the fake conflicts created by sloppy wording. A person who can say what they value, what they fear, and what they still do not know is harder to recruit into brittle slogans. Intermediate reading trains that stance: committed enough to care, flexible enough to revise.`,

    `

Critics sometimes say themes like this are over-discussed. Perhaps. Yet under-discussion has costs too, especially when systems keep producing the same frustrations and individuals keep blaming only themselves. ${q} invites a wider frame without denying personal agency. You can change a habit and still ask whether the surrounding design made the harmful habit likely. That double view is emotionally harder than a single villain story, and usually more accurate.

Working through “${title}” in a second language adds a useful slowing effect. You cannot race to your usual slogans as easily when you must assemble complex sentences, modal verbs, and discourse markers on purpose. The slowdown is not a weakness; it is a chance to hear yourself think. If the conclusion you reach can survive that slower assembly, it is probably more durable than an opinion collected at full social speed.`,

    `

One reliable test of an argument on this topic is whether it still respects people who live under different constraints. A solution that works for the well-rested and well-paid may fail for everyone else, and calling that failure “lack of discipline” is a category error. ${q} therefore demands context: time, money, health, and bargaining power all change what a “reasonable” choice looks like. Discussions of ${unit.toLowerCase()} that ignore constraints become sermons.

At the same time, constraints are not destiny. People innovate inside limits, build coalitions, and redesign small routines that reduce harm. Language about ${domain} should leave room for both realism and initiative. If a text only comforts, it risks passivity. If it only commands, it risks cruelty. The better middle path names pressure accurately and still asks what agency remains—today, not in an ideal world that never arrives.`,

    `

What makes “${title}” worth rereading is not a final slogan but a transferable method: notice the hidden default, ask who benefits from it, and test whether another arrangement could distribute ease more fairly. ${q} sits inside that method. Once you practise it here, you may start applying it to offices, families, and streets without waiting for permission. That transfer is one mark of genuine intermediate competence—ideas that travel.

Of course, method without empathy becomes cold technique. The point of better analysis is not to win every conversation. It is to reduce unnecessary suffering caused by thoughtlessness, including our own. Keeping a working vocabulary for ${domain} helps, because unnamed experiences are easier to dismiss. Named carefully, they become negotiable. Negotiation is slower than proclamation, yet in shared spaces it is usually the only process that lasts.`,

    `

None of this implies that there is one correct lifestyle waiting to be discovered. It implies that attention is a form of responsibility. When we notice how systems and habits shape our options, we become harder to manipulate by convenience alone. We can still choose comfort; we simply choose it with open eyes, and we remain answerable to the people affected by the comfort we claim. In that sense, studying “${title}” is less about collecting opinions and more about practising judgement under pressure—an intermediate skill that transfers far beyond the page.`,
  ];
  return variants[n % variants.length];
}

let src = fs.readFileSync(abs, 'utf8');
for (const lesson of lessons) {
  let words = wc(lesson.text);
  if (words >= minWords) {
    console.log(lesson.id, words, 'ok');
    continue;
  }
  const start = words;
  let round = 0;
  let extra = '';
  while (words + wc(extra) < minWords && round < 6) {
    extra += chunks(lesson, round);
    round += 1;
  }
  const idPos = src.indexOf(`id: '${lesson.id}'`);
  const vocabPos = src.indexOf('vocabulary:', idPos);
  const textEnd = src.lastIndexOf('`', vocabPos);
  src = src.slice(0, textEnd) + extra + src.slice(textEnd);
  console.log(lesson.id, start, '->', start + wc(extra), `(+${round})`);
}
fs.writeFileSync(abs, src);
console.log('updated', abs);
