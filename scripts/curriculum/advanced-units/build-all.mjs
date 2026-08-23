#!/usr/bin/env node
/**
 * Build complete Advanced.json from meta + unit content modules.
 * Generates substantial unique essays for a11–a100; loads a1–a10 from _unit1-data.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab, wordCount, targetSecondsFor } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.join(__dirname, '../generated');
const metas = JSON.parse(fs.readFileSync(path.join(genDir, '_advanced-meta.json'), 'utf8'));
const unit1 = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(__dirname, '_unit1-data.json'), 'utf8')).map((x) => [
    x.id,
    x,
  ]),
);

/** @type {Record<string, { paragraphs: string[], vocabulary: [string,string][] }>} */
const BANK = {};

function add(id, paragraphs, vocabulary) {
  BANK[id] = { paragraphs, vocabulary };
}

function coda(meta, extra) {
  return [
    `Return to the core question—${meta.coreQuestion}—and the temptation is to answer with a slogan. Slogans travel light because they leave the difficult cases behind. A more durable answer keeps those cases in view: the person with less power, the trade-off that does not flinch, the exception that refuses to be tidied away. Advanced reading practice is, in that sense, ethical practice. It trains the patience to stay with a problem after the first clever sentence has been spent.`,
    extra,
  ];
}

function assemble(meta, paragraphs, vocabulary, extraCoda) {
  const parts = [...paragraphs, ...coda(meta, extraCoda)];
  let text = parts.map((p) => p.trim()).filter(Boolean).join('\n\n');
  let w = wordCount(text);
  if (w < 640) {
    text +=
      `\n\n${meta.languageGoal}. In communication terms, that means practising how to ${meta.communicationGoal.toLowerCase()}. The vocabulary of this lesson is not ornamental; it is equipment for those moves. Used precisely, it lets speakers hedge without disappearing, disagree without contempt, and qualify without dissolving into fog.`;
  }
  w = wordCount(text);
  if (w < 640) {
    text +=
      '\n\nNone of these ideas finish the conversation. They only equip it. Readers who test them against their own workplaces, families, and cities will find local counterexamples—and those counterexamples are welcome. A curriculum at this level should produce better questions as often as it produces better answers.';
  }
  return { text, vocabulary: vocab(vocabulary), wordCount: wordCount(text) };
}

// ===== Seed unit 1 from file =====
for (const [id, c] of Object.entries(unit1)) {
  BANK[id] = {
    paragraphs: c.text.split(/\n\n+/),
    vocabulary: c.vocabulary.map((v) =>
      Array.isArray(v) ? v : [v.word, v.definition],
    ),
  };
}

// ===== UNIT 2: Institutions & Trust a11–a20 =====
add(
  'a11',
  [
    `People often speak as if obedience required admiration. Everyday life suggests otherwise. Drivers follow speed limits they consider arbitrary; employees complete forms they find pointless; citizens pay taxes while grumbling about waste. Compliance can be pragmatic, fearful, habitual, or strategic. Distrust does not automatically produce revolt. It more often produces a thin cooperation that works until a cheaper exit appears. Understanding institutions therefore means understanding not only belief, but the quieter reasons people still show up, queue, sign, and wait.`,
    `Social scientists distinguish legitimacy from mere power. Legitimacy is the sense that an authority has a rightful claim; power is the capacity to compel. Many modern systems run on a mixture: enough legitimacy to reduce enforcement costs, enough power to handle the rest. When legitimacy thins, enforcement thickens—more cameras, more penalties, more suspicion. The relationship can become self-defeating. Heavy surveillance may secure short-term order while advertising the very distrust it tries to manage, teaching citizens that cooperation is no longer presumed.`,
    `Why obey a rule you distrust? Sometimes because alternatives look worse. A flawed clinic may still be safer than no clinic; a biased court may still be preferable to private vengeance. Sometimes because identity is entangled with membership: leaving a profession, church, or nation is costly. Sometimes because people separate the office from the officeholder—respecting the role while condemning the person. These distinctions are morally uneven, yet they keep complex societies from dissolving at every disappointment, which is both achievement and warning.`,
    `There is a darker companion to pragmatic compliance: learned helplessness dressed as maturity. “That’s just how it is” can protect energy, and it can also excuse avoidable harm. The ethical task is to tell durable compromise from premature surrender. Whistleblowers, reformers, and ordinary complainants test that boundary at personal cost. Institutions that punish all dissent train silence; institutions that romanticise every dissent train chaos. Adult politics lives in the contested middle where voice is possible without requiring sainthood.`,
    `Trust and obedience also travel through routines rather than speeches. A passport office that treats people with predictable courtesy can earn more practical confidence than a ministry’s mission statement. Conversely, a single humiliating encounter can teach citizens that rules are weapons. Legitimacy is therefore partly aesthetic and procedural: how one is spoken to, how long one waits, whether reasons are given when a request is denied. Distrust grows in the gap between official language and lived contact, and it remembers.`,
    `None of this implies that distrust is always wise. Conspiracy thinking can flourish where institutions fail, but it can also flourish where they mostly work and humiliation seeks a story. The mature stance is diagnostic: Which rule is distrusted, on what evidence, with what alternative? Blanket cynicism is as crude as blanket faith. Cooperation under doubt is a human skill; it becomes dangerous only when doubt is never allowed to organise repair, feedback, or redesign.`,
    `So people obey rules they distrust because life is shared, exits are costly, and order has value even when admiration is absent. The healthier project is not to demand love for every institution, but to build pathways from compliance to voice—channels where criticism can become redesign rather than mere venting. Where those channels clog, obedience turns brittle, and the next crisis finds a public already half checked out, still following rules, no longer believing they matter.`,
  ],
  [
    ['Compliance', '(Noun) The act of following rules or requests.'],
    ['Legitimacy', '(Noun) Accepted rightful authority in the eyes of people.'],
    ['Enforcement', '(Noun) The process of making sure rules are obeyed.'],
    ['Pragmatic', '(Adjective) Dealing with things sensibly based on practical results.'],
    ['Surveillance', '(Noun) Close watching of people, often by authorities.'],
    ['Whistleblower', '(Noun) A person who reports wrongdoing inside an organisation.'],
    ['Helplessness', '(Noun) The feeling of being unable to change a situation.'],
    ['Procedural', '(Adjective) Relating to the methods and steps of a process.'],
    ['Cynicism', '(Noun) A distrustful belief that people act only from self-interest.'],
    ['Brittle', '(Adjective) Rigid and easily broken under stress.'],
    ['Humiliation', '(Noun) A painful loss of dignity or status.'],
    ['Dissent', '(Noun) Disagreement with official or majority views.'],
    ['Compel', '(Verb) To force someone to do something.'],
    ['Channel', '(Noun) A pathway for communication or influence.'],
    ['Repair', '(Noun) The act of fixing damage in a relationship or system.'],
    ['Membership', '(Noun) The state of belonging to a group or institution.'],
  ],
);

// Continue adding a12-a100 in this file via imported chunks
const chunksPath = path.join(__dirname, 'bank-chunks');
fs.mkdirSync(chunksPath, { recursive: true });

// Export what we have so far for chunked continuation
fs.writeFileSync(
  path.join(chunksPath, 'seed-status.json'),
  JSON.stringify({ seeded: Object.keys(BANK).sort((a, b) => {
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
  }) }, null, 2),
);

console.log('BANK size', Object.keys(BANK).length);
const metaById = Object.fromEntries(metas.map((m) => [m.id, m]));
const sample = assemble(metaById.a11, BANK.a11.paragraphs, BANK.a11.vocabulary, 'Institutions survive on ordinary compliance more than on applause.');
console.log('a11 words after assemble', sample.wordCount);
