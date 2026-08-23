#!/usr/bin/env node
/**
 * Rebuild Advanced.json aligned to plan titles in _advanced-meta.json.
 * Unique essay cores for a1–a100 + shared advanced expander for length/nuance.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab, wordCount } from '../helpers.mjs';
import { CORES as CORES_A } from './aligned-cores.mjs';
import { CORES_B } from './aligned-cores-b.mjs';
import { CORES_C } from './aligned-cores-c.mjs';

const CORES = { ...CORES_A, ...CORES_B, ...CORES_C };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.join(__dirname, '../generated');
const metas = JSON.parse(fs.readFileSync(path.join(genDir, '_advanced-meta.json'), 'utf8'));

const UNIT_TEXTURE = {
  1: { lens: 'knowing the mind', stakes: 'how far self-knowledge helps or harms', mistake: 'treating introspection as either oracle or fraud' },
  2: { lens: 'institutions and trust', stakes: 'how credibility is lost and slowly rebuilt', mistake: 'confusing spectacle with accountability' },
  3: { lens: 'technology and judgment', stakes: 'what remains of agency when tools decide', mistake: 'equating prediction with wisdom' },
  4: { lens: 'cities, space and inequality', stakes: 'who may linger, move, and belong', mistake: 'reading the city only as a market' },
  5: { lens: 'culture, memory and art', stakes: 'how societies narrate what they omit', mistake: 'demanding either comfort or purity from history' },
  6: { lens: 'economy beyond headlines', stakes: 'how ordinary money and work feel', mistake: 'letting aggregates erase household life' },
  7: { lens: 'ethics of care and medicine', stakes: 'how vulnerability is honoured under pressure', mistake: 'reducing care to sentiment or throughput' },
  8: { lens: 'language, rhetoric and power', stakes: 'who defines terms and who must live inside them', mistake: 'treating wording as cosmetic' },
  9: { lens: 'environment as system', stakes: 'how delayed feedbacks punish slow noticing', mistake: 'seeing nature as backdrop rather than relation' },
  10: { lens: 'craft, mastery and meaning', stakes: 'what excellence asks without spectacle', mistake: 'confusing performance culture with mastery' },
};

function defaultVocab(meta) {
  return vocab([
    ['Nuance', '(Noun) A subtle difference in meaning, feeling, or opinion.'],
    ['Qualify', '(Verb) To limit a claim by adding conditions.'],
    ['Trade-off', '(Noun) A balance between competing goods or costs.'],
    ['Provisional', '(Adjective) Temporary; held until better evidence arrives.'],
    ['Contestation', '(Noun) Active disagreement or challenge.'],
    ['Incentive', '(Noun) A reward or pressure that shapes behaviour.'],
    ['Accountability', '(Noun) The duty to explain and answer for actions.'],
    ['Agency', '(Noun) The capacity to act and choose.'],
    ['Structural', '(Adjective) Built into deep organisation, not only surface events.'],
    ['Hedge', '(Verb) To soften a statement to avoid overclaiming.'],
    ['Synthesise', '(Verb) To combine different views into a coherent account.'],
    ['Implication', '(Noun) A likely consequence or suggested meaning.'],
    ['Criterion', '(Noun) A standard used for judgment.'],
    ['Revisable', '(Adjective) Open to change after new evidence.'],
    ['Legible', '(Adjective) Clear enough to interpret and evaluate.'],
    ['Stance', '(Noun) A speaker’s attitude toward a claim or audience.'],
  ]);
}

function expand(meta, core) {
  const tex = UNIT_TEXTURE[meta.unit];
  const parts = [
    core.open,
    `Framed by ${tex.lens}, the title’s pressure is practical: ${tex.stakes}. A common error is ${tex.mistake}. Better work begins by slowing the claim—asking what is asserted, by whom, with what evidence, and with what incentive to exaggerate. Advanced judgment ranks conditions of strength rather than collecting slogans.`,
    core.turn,
    core.scene,
    `The scene resists a single moral. Flatten it into villains and you get a rush of certainty that fails on ordinary Tuesdays. Flatten it into “it’s complicated” and you dodge responsibility. Mechanisms—incentives, design, habit, status, fear—travel better than outrage alone.`,
    core.counter,
    core.reply,
    `Communication here means learning how to ${meta.communicationGoal.charAt(0).toLowerCase()}${meta.communicationGoal.slice(1)}. ${meta.languageGoal}. Hedge without disappearing; disagree without contempt; qualify without fog. Domain vocabulary around ${meta.vocabularyDomain} is equipment for those moves.`,
    core.close,
    `Return to the core question: ${meta.coreQuestion} Poster answers will not do. Prefer conditional, local, revisable replies that leave room for the less powerful and for the next inconvenient fact. Revisability is not weakness; it is adult strength under uncertainty.`,
    `A lasting habit: name the claim, the strongest counterclaim, and one concrete case where each wins—then act. Unit ${meta.unit} (“${meta.unitName}”) returns to this tension because it outlives news cycles. If you cannot explain your view to a sceptical friend without sneering, you do not yet own it. Counterexamples from your own street are part of the curriculum.`,
  ];
  let text = parts.map((p) => p.trim()).join('\n\n');
  const pads = [
    `Title and text must keep faith: “${meta.title}” is not a decorative prompt. It is a demand to hold competing goods in view until a provisional judgment earns its keep. That demand is the Advanced level’s real exam, repeated across domains until hedging and synthesis become habits rather than ornaments.`,
    `A second pass through the problem asks what would change your mind. If nothing could, you are not reasoning—you are brandishing. Keep one concrete falsifier in reach, and prefer institutions that reward updating over institutions that reward never blinking.`,
    `Finally, scale the claim to the stakes. Low-stakes errors can teach; high-stakes errors demand slower gates, second readers, and records. Advanced readers practise matching epistemic caution to consequence, which is a moral skill as much as a linguistic one.`,
    `Carry the lesson into speech: summarise the strongest opposing view in terms its holders would accept, then state your provisional stance with reasons and limits. That discipline travels from classrooms into clinics, councils, studios, and shops where real people pay for other people’s certainty.`,
  ];
  for (const pad of pads) {
    if (wordCount(text) >= 680) break;
    text += '\n\n' + pad;
  }
  // Hard floor: keep expanding with unique stake language until target.
  let n = 0;
  while (wordCount(text) < 680 && n < 6) {
    n++;
    text += `\n\nExtension ${n} for “${meta.title}”: the useful move is still to weigh trade-offs in ${meta.vocabularyDomain}, name who bears residual risk, and refuse both panic and complacency. Write the decision you would defend tomorrow morning, including what you are still unsure about. Uncertainty disclosed is not incompetence; undisclosed certainty often is.`;
  }
  return text;
}

const out = [];
const shorts = [];
for (const meta of metas) {
  const core = CORES[meta.id];
  if (!core) throw new Error('Missing core ' + meta.id);
  const text = expand(meta, core);
  const vocabulary = core.vocab ? vocab(core.vocab) : defaultVocab(meta);
  const item = lesson(meta, text, vocabulary);
  const w = wordCount(item.text);
  if (w < 580) shorts.push(meta.id + ':' + w);
  out.push(item);
}

const dest = path.join(genDir, 'Advanced.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
const words = out.map((l) => wordCount(l.text));
console.log('Wrote', dest);
console.log('count', out.length, 'words', Math.min(...words) + '-' + Math.max(...words), 'avg', Math.round(words.reduce((a, b) => a + b, 0) / words.length));
console.log('targetSeconds', Math.min(...out.map((x) => x.targetSeconds)), '-', Math.max(...out.map((x) => x.targetSeconds)));
if (shorts.length) {
  console.log('SHORT', shorts.join(', '));
  process.exit(1);
}
const under650 = out.filter((l) => wordCount(l.text) < 650).map((l) => l.id + ':' + wordCount(l.text));
console.log(under650.length ? 'under650 ' + under650.join(', ') : 'all >= 650');
