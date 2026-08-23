#!/usr/bin/env node
/** Attach unique 16-item vocab lists to each Advanced lesson from title/domain keywords. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCount } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, '../generated/Advanced.json');
const arr = JSON.parse(fs.readFileSync(dest, 'utf8'));

/** Curated pools by unit — rotated and mixed per lesson for uniqueness */
const POOLS = {
  1: [
    ['Opacity', '(Noun) The quality of being hard to see into or fully know.'],
    ['Introspection', '(Noun) The examination of one’s own thoughts and feelings.'],
    ['Calibration', '(Adjective/Noun) Adjustment so judgments match evidence; the act of adjusting.'],
    ['Bias', '(Noun) A systematic inclination that skews judgment.'],
    ['Reconstructive', '(Adjective) Built again from parts rather than replayed intact.'],
    ['Affective', '(Adjective) Relating to emotions and feelings.'],
    ['Cliché', '(Noun) An overused phrase that has lost precision.'],
    ['Commons', '(Noun) A shared resource managed (or depleted) collectively.'],
    ['Self-policing', '(Noun) Monitoring and restricting oneself, sometimes excessively.'],
    ['Over-interpret', '(Verb) To read more meaning into something than evidence supports.'],
    ['Provisional', '(Adjective) Temporary; held until better evidence arrives.'],
    ['Falsifier', '(Noun) Evidence that could show a claim is wrong.'],
    ['Spontaneity', '(Noun) Natural, unforced action without over-planning.'],
    ['Meta-cognition', '(Noun) Thinking about one’s own thinking.'],
    ['Narrative', '(Noun) A story used to organise events and identity.'],
    ['Hypothesis', '(Noun) A proposed explanation open to testing.'],
    ['Impulse', '(Noun) A sudden urge to act.'],
    ['Insight', '(Noun) A clear understanding of a complex situation.'],
  ],
  2: [
    ['Legitimacy', '(Noun) Perceived rightfulness of authority.'],
    ['Credibility', '(Noun) The quality of being believable or trusted.'],
    ['Transparency', '(Noun) Openness of information and processes.'],
    ['Accountability', '(Noun) Duty to explain and answer for actions.'],
    ['Procedural', '(Adjective) Relating to fair methods and steps.'],
    ['Spectacle', '(Noun) Public display that draws attention, often shallowly.'],
    ['Proximity', '(Noun) Nearness in space or relationship.'],
    ['Metric', '(Noun) A standard of measurement used to judge performance.'],
    ['Remorse', '(Noun) Deep regret for wrongdoing.'],
    ['Ombuds', '(Noun) An official who investigates complaints against an organisation.'],
    ['Verification', '(Noun) Independent checking that claims are true.'],
    ['Capture', '(Noun) When oversight serves the interests it should restrain.'],
    ['Ritual', '(Noun) A repeated ceremonial practice.'],
    ['Dissent', '(Noun) Disagreement with official or majority views.'],
    ['Asymmetry', '(Noun) Lack of balance between two sides.'],
    ['Constituency', '(Noun) A group that can organise around shared interests.'],
    ['Humiliation', '(Noun) Painful loss of dignity.'],
    ['Continuity', '(Noun) Unbroken connection over time.'],
  ],
  3: [
    ['Delegation', '(Noun) Handing decision authority to another person or system.'],
    ['Agency', '(Noun) Capacity to act and make choices.'],
    ['Filter', '(Noun) A mechanism that selects what information appears.'],
    ['Veto', '(Noun) Authority to reject a decision.'],
    ['Prediction', '(Noun) A forecast about what is likely to happen.'],
    ['Surveillance', '(Noun) Systematic watching of people or activity.'],
    ['Deskilling', '(Noun) Loss of ability through disuse or automation.'],
    ['Interruptive', '(Adjective) Designed to break attention repeatedly.'],
    ['Override', '(Noun/Verb) A human rejection of an automated recommendation.'],
    ['Obfuscate', '(Verb) To make something unclear on purpose.'],
    ['Calibration', '(Noun) Matching confidence to actual accuracy.'],
    ['Serendipity', '(Noun) Valuable discovery by meaningful chance.'],
    ['Retention', '(Noun) How long data or records are kept.'],
    ['Heuristic', '(Noun) A mental shortcut for quick judgment.'],
    ['Opacity', '(Noun) Lack of transparency in how a system works.'],
    ['Recourse', '(Noun) A way to seek help or correction after harm.'],
    ['Threshold', '(Noun) A level at which a decision rule changes.'],
    ['Literacy', '(Noun) Competence in reading and evaluating a domain.'],
  ],
  4: [
    ['Linger', '(Verb) To stay in a place without urgent purpose.'],
    ['Commercialisation', '(Noun) Turning spaces or goods primarily toward selling.'],
    ['Canopy', '(Noun) The layer of tree cover that provides shade.'],
    ['Tenure', '(Noun) The conditions under which someone holds housing.'],
    ['Displacement', '(Noun) Being forced out of a home or neighbourhood.'],
    ['Path dependence', '(Noun) Constraint by past infrastructure and choices.'],
    ['Testimony', '(Noun) First-person evidence about lived experience.'],
    ['Micro-public', '(Noun) A small shared social world within a building or block.'],
    ['Revitalisation', '(Noun) Redevelopment framed as bringing new life.'],
    ['Informality', '(Noun) Economic activity outside official regulation.'],
    ['Hostile architecture', '(Noun) Design that discourages lingering or resting.'],
    ['Equity', '(Noun) Fairness in outcomes and access.'],
    ['Amenity', '(Noun) A useful or pleasant facility in a place.'],
    ['Segregation', '(Noun) Separation of groups in space or institutions.'],
    ['Commons', '(Noun) Shared space or resource not purely private.'],
    ['Zoning', '(Noun) Rules controlling how land may be used.'],
    ['Gentrification', '(Noun) Upscale change that can displace prior residents.'],
    ['Last-mile', '(Adjective) Relating to the final stage of a journey.'],
  ],
  5: [
    ['Omission', '(Noun) Something left out of a record or story.'],
    ['Curatorial', '(Adjective) Relating to selecting and interpreting exhibits.'],
    ['Provenance', '(Noun) The history of ownership and origin of an object.'],
    ['Canon', '(Noun) Works treated as central or authoritative in a culture.'],
    ['Nostalgia', '(Noun) Sentimental longing for a past time.'],
    ['Literalism', '(Noun) Insistence on word-for-word equivalence.'],
    ['Contextualise', '(Verb) To place something in its historical setting.'],
    ['Restitution', '(Noun) Return of what was taken; making amends.'],
    ['Archive', '(Noun) A collection of preserved records.'],
    ['Monument', '(Noun) A structure commemorating a person or event.'],
    ['Ambiguity', '(Noun) Openness to more than one interpretation.'],
    ['Stylise', '(Verb) To present in a distinctive, often simplified aesthetic.'],
    ['Pedagogy', '(Noun) The method and practice of teaching.'],
    ['Contestation', '(Noun) Active dispute over meaning or ownership.'],
    ['Heritage', '(Noun) Valued cultural inheritance.'],
    ['Translation', '(Noun) Rendering meaning from one language into another.'],
    ['Erasure', '(Noun) Removal of people or facts from the record.'],
    ['Aesthetic', '(Adjective/Noun) Relating to beauty and artistic taste.'],
  ],
  6: [
    ['Aggregate', '(Noun) A combined total that can hide distribution.'],
    ['Distribution', '(Noun) How goods, income, or risk are shared.'],
    ['Care labour', '(Noun) Work of looking after people, often underpaid.'],
    ['Externalise', '(Verb) To push costs onto others or the future.'],
    ['Remittance', '(Noun) Money sent home by a worker abroad.'],
    ['Informal credit', '(Noun) Lending outside official banks.'],
    ['Windfall', '(Noun) An unexpected large gain.'],
    ['Time-affluence', '(Noun) Having control over one’s time and rest.'],
    ['Pass-through', '(Noun) Passing a cost increase on to customers.'],
    ['Median', '(Noun) The middle value in a distribution.'],
    ['Scarcity', '(Noun) Insufficient supply relative to need.'],
    ['Predatory', '(Adjective) Exploiting others’ weakness for gain.'],
    ['Livelihood', '(Noun) Means of securing necessities of life.'],
    ['Subsidy', '(Noun) Public money supporting an activity or group.'],
    ['Volatility', '(Noun) Tendency to change rapidly and unpredictably.'],
    ['Household', '(Noun) People who share living arrangements and budgets.'],
    ['Abstraction', '(Noun) A general idea detached from concrete detail.'],
    ['Incentive', '(Noun) A factor that motivates behaviour.'],
  ],
  7: [
    ['Consent', '(Noun) Freely given agreement to an action.'],
    ['Refusal', '(Noun) A decision not to accept an offer or treatment.'],
    ['Prognosis', '(Noun) A forecast of the likely course of a condition.'],
    ['Capacity', '(Noun) Ability to understand and decide for oneself.'],
    ['Palliative', '(Adjective) Relieving suffering without curing the disease.'],
    ['Moral injury', '(Noun) Deep distress from actions that violate one’s ethics.'],
    ['Throughput', '(Noun) Amount of work processed in a period.'],
    ['Proxy', '(Noun) A person authorised to decide for another.'],
    ['Escalation', '(Noun) Increasing intensity of intervention.'],
    ['Teach-back', '(Noun) Asking patients to repeat information to confirm understanding.'],
    ['Acuity', '(Noun) Severity of illness used to allocate care.'],
    ['Dignity', '(Noun) Worthiness of respect as a person.'],
    ['Paternalism', '(Noun) Limiting freedom “for someone’s own good.”'],
    ['Continuity', '(Noun) Ongoing relationship in care over time.'],
    ['Triage', '(Noun) Sorting cases by urgency.'],
    ['Withholding', '(Noun) Not starting a treatment.'],
    ['Burden', '(Noun) A heavy load of duty, cost, or suffering.'],
    ['Advocacy', '(Noun) Active support for someone’s interests.'],
  ],
  8: [
    ['Frame', '(Noun) A way of selecting and emphasising aspects of an issue.'],
    ['Definitional', '(Adjective) Relating to how terms are defined.'],
    ['Passive voice', '(Noun) Grammar that can hide who performs an action.'],
    ['Hate speech', '(Noun) Expression that attacks or subordinates a group.'],
    ['Metaphor', '(Noun) Describing one thing in terms of another.'],
    ['Irony', '(Noun) Meaning that contrasts with the literal surface.'],
    ['Coercion', '(Noun) Pressure that removes real choice.'],
    ['Mediation', '(Noun) Passing a message through an intermediary.'],
    ['Operationalise', '(Verb) To define a term so it can be applied in practice.'],
    ['Rhetoric', '(Noun) The art of persuasive speaking or writing.'],
    ['Homonym', '(Noun) Words alike in form but different in meaning.'],
    ['Steelmanning', '(Noun) Stating an opposing view in its strongest form.'],
    ['Dog whistle', '(Noun) Coded language heard differently by subgroups.'],
    ['Speech act', '(Noun) An utterance that performs an action (promise, apology).'],
    ['Vagueness', '(Noun) Lack of clear boundaries in meaning.'],
    ['Persuasion', '(Noun) The act of convincing others.'],
    ['Inclusive', '(Adjective) Designed not to exclude people unfairly.'],
    ['Subordination', '(Noun) Placing a group in a lower social position.'],
  ],
  9: [
    ['Systems thinking', '(Noun) Analysing wholes and interactions, not isolated parts.'],
    ['Feedback', '(Noun) A result that loops back to influence later causes.'],
    ['Threshold', '(Noun) A tipping level beyond which a system reorganises.'],
    ['Watershed', '(Noun) Land area draining into a common water system.'],
    ['Restoration', '(Noun) Attempt to repair damaged ecosystems.'],
    ['Keystone', '(Adjective/Noun) A species with outsized effects on its web.'],
    ['Externality', '(Noun) A cost or benefit not priced into a transaction.'],
    ['Resilience', '(Noun) Capacity to absorb disturbance and keep functioning.'],
    ['Baseline', '(Noun) A reference state used for comparison.'],
    ['Interdependence', '(Noun) Mutual reliance among parts of a system.'],
    ['Offset', '(Noun) A claimed compensation for harm done elsewhere.'],
    ['Triage', '(Noun) Prioritising under limited resources.'],
    ['Stewardship', '(Noun) Responsible care for a place or resource.'],
    ['Cascade', '(Noun) A chain of effects triggered by one change.'],
    ['Monitoring', '(Noun) Ongoing measurement to detect change.'],
    ['Leverage point', '(Noun) A place in a system where small shifts matter a lot.'],
    ['Distributed', '(Adjective) Spread across many actors or places.'],
    ['Habitat', '(Noun) The natural home environment of a species.'],
  ],
  10: [
    ['Mastery', '(Noun) High skill developed through sustained practice.'],
    ['Apprenticeship', '(Noun) Learning beside a skilled practitioner.'],
    ['Tacit knowledge', '(Noun) Know-how hard to put fully into words.'],
    ['Deliberate practice', '(Noun) Focused repetition aimed at specific improvement.'],
    ['Perfectionism', '(Noun) Demanding flawlessness in ways that can block finishing.'],
    ['Vocation', '(Noun) A strong sense of calling toward certain work.'],
    ['Guild', '(Noun) A community organised around shared skill standards.'],
    ['Post-mortem', '(Noun) A review of what went wrong after a failure.'],
    ['Scaffolding', '(Noun) Temporary support that helps learners reach harder tasks.'],
    ['Durability', '(Noun) Ability to last through use and time.'],
    ['Mentorship', '(Noun) Guidance from a more experienced person.'],
    ['Craft', '(Noun) Skilled making guided by standards and care.'],
    ['Throughput', '(Noun) Speed/volume of output under market pressure.'],
    ['Authenticity', '(Noun) Consistency with honest values or origins.'],
    ['Transmission', '(Noun) Passing skill and standards to the next generation.'],
    ['Excellence', '(Noun) Outstanding quality relative to a standard.'],
    ['Humility', '(Noun) Modest awareness of limits and luck.'],
    ['Meaning', '(Noun) Sense of significance and purpose in activity.'],
  ],
};

function pickVocab(unit, index) {
  const pool = POOLS[unit];
  const out = [];
  const used = new Set();
  for (let k = 0; k < 16; k++) {
    const item = pool[(index * 3 + k * 5) % pool.length];
    const key = item[0].toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    out.push({ word: item[0], definition: item[1] });
    if (out.length === 16) break;
  }
  // refill if collision skipped too many
  let i = 0;
  while (out.length < 16 && i < pool.length * 2) {
    const item = pool[i % pool.length];
    i++;
    const key = item[0].toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    out.push({ word: item[0], definition: item[1] });
  }
  return out;
}

for (let i = 0; i < arr.length; i++) {
  const L = arr[i];
  L.vocabulary = pickVocab(L.unit, i);
  // ensure targetSeconds still matches
  const w = wordCount(L.text);
  L.targetSeconds = Math.max(45, Math.min(600, Math.round((w / 130) * 60)));
}

fs.writeFileSync(dest, JSON.stringify(arr, null, 2) + '\n');
const words = arr.map((l) => wordCount(l.text));
console.log('updated vocab; words', Math.min(...words), '-', Math.max(...words), 'avg', Math.round(words.reduce((a, b) => a + b, 0) / words.length));
console.log('sample a1 vocab', arr[0].vocabulary.slice(0, 3));
console.log('sample a91 vocab', arr[90].vocabulary.slice(0, 3));
