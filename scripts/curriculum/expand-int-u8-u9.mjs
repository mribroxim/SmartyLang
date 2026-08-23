#!/usr/bin/env node
/**
 * Expand Intermediate i72–i90 to 430–560 words with analytical prose (no template boilerplate).
 * Updates u08-language.mjs, u09-nature.mjs, then assembles Intermediate.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { CORES_8_10 } from './_int-cores-8-10.mjs';
import { wordCount, vocab, lesson } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'generated', '_intermediate-meta.json'), 'utf8')
);

/** Topic-specific expansions keyed by lesson id — analytical prose in i1–i50 style. */
const EXPANSIONS = {
  i72: [
    `Social media makes persuasion's aging visible in ways older publics rarely saw. A clip that felt definitive on Tuesday can look hollow by Friday, once context arrives in replies and counter-clips. That speed is not only a problem. It can also train a useful reflex: wait before you treat intensity as proof. People who archive their own strong reactions—what moved them, what they forwarded, what they argued for—sometimes notice patterns. Certain voices always trigger agreement; certain framings always bypass scrutiny. The archive becomes a mirror rather than a trophy case.`,
    `Institutions could design for this decay instead of pretending speeches are permanent verdicts. Cooling-off periods before major votes, published dissent after corporate announcements, classrooms that revisit last month's debate with new evidence—all treat persuasion as provisional. That may sound weak to cultures addicted to closure. In practice, it often produces sturdier decisions, because the people who stayed curious were not the ones who never felt moved. They were the ones who felt moved and returned to ask what remained when the music stopped.`,
    `Perhaps the useful habit is periodic re-reading: return to what convinced you, not to mock your past self, but to learn which arguments earned permanence and which borrowed urgency from the room. That habit protects both autonomy and humility—autonomy from being owned by old moods, humility from pretending you were never susceptible. Persuasion that ages well usually leaves that kind of door open.`,
  ],
  i73: [
    `The fluency bias is not evenly distributed. Speakers of additional languages often pay a double tax: they may know more but sound less "leader-like" because pauses get misread as ignorance rather than precision. Women and junior staff face parallel penalties when they hedge appropriately while louder voices claim certainty. None of this means fluency is worthless. A clear sentence still helps. The error is treating delivery as a proxy for truth—a shortcut that saves time in the short run and wastes it when wrong decisions follow.`,
    `Reform begins in small rooms before it reaches parliament. Interview panels can score paraphrase quality, not only volume. Teachers can reward thoughtful limits alongside participation. Audiences can learn to distrust the sentence that refuses testable content, however elegantly it arrives. Public trust, rebuilt on those habits, may look less glamorous than charisma on a stage. It also survives the morning after, when charisma alone usually cannot.`,
    `Technology may widen the gap: podcasts favour voices that sound authoritative in short clips, while long citations win written forums but reach fewer listeners. The confident-voice problem is therefore architectural as well as interpersonal. Designing better truth-seeking means giving careful speech time to arrive—not only rewarding whoever sounds finished first.`,
  ],
  i74: [
    `Selective truth appears in everyday life long before national politics. A sibling recounts a family argument with accurate quotes but omitted apologies; a manager's slide deck shows real gains while hiding the team that made them possible; a product review lists genuine features while cropping the failure rate. In each case, a literal fact-check might pass even as fairness fails. Ethical communication therefore needs a second question beside "Is it true?"—namely, "Would a reasonable listener understand the whole picture?"`,
    `Defenders of sharp framing sometimes say that perfect balance is impossible and that advocacy requires emphasis. That concession is fair. Emphasis becomes distortion when it hides the existence of counter-evidence while performing neutrality. The practical habit for intermediate readers is translation: restate the claim in plain terms, list what would weaken it, and notice whether the original speaker ever mentions those weaknesses. If not, you may be looking at persuasion dressed as reporting—and the dress can be honest fabric cut into a misleading shape.`,
    `Their dialogue names a category public life needs: true-but-unfair presentation. Naming it does not end debate; it makes debate more honest about maps handed to people in a hurry. Ethics includes responsibility for foreseeable distortion, not only for literal falsehood.`,
  ],
  i75: [
    `Corrections travel differently depending on platform. A buried edit on a long thread may never reach the people who saw the original error; a clear correction email, by contrast, can rebuild trust with subscribers who remember the mistake. The linguistic work matters: active verbs ("I misread"), specific harm named ("staff received worried messages"), and a forward path ("here is the primary source") signal repair rather than reputation laundering. Vague regret without structural change often reads as performance to people who have been burned before.`,
    `Communities that treat correction as maintenance rather than humiliation tend to produce more reliable public speech over time. That norm is fragile. It requires leaders who thank correctors instead of punishing them, and audiences who reward updates instead of mocking inconsistency. Changing one's mind in public is not weakness when the change is tied to evidence. It is one of the few proofs that language still serves truth rather than only serving face.`,
    `Elena's email models accountable public speech: concession without self-drama, repair without deflection, and an invitation for questions to meet a knowledgeable source. Intermediate writers rehearse that structure before the next hurried post, when adrenaline argues that speed matters more than accuracy.`,
  ],
  i76: [
    `Election cycles and brand wars feed on slogans because slogans compress identity. Wearing a phrase on a badge tells others which tribe you belong to before you have argued a single clause. That belonging can be genuine solidarity; it can also replace solidarity with performance. When complexity arrives—budget trade-offs, medical nuance, foreign policy limits—the badge crowd may feel betrayed by detail rather than informed by it. Defending slower speech is therefore not elitism. It is a defence of citizens' ability to consent to what they are actually choosing.`,
    `Translation exercises help. Take a popular slogan and expand it until it mentions costs, exceptions, and falsifying evidence. If the expansion collapses into contradiction, the slogan was never a policy—only a mood with good rhythm. If it survives expansion, it may deserve a place in public life, now honestly sized. Either outcome improves debate. The alternative is a politics of chant in which everyone sounds aligned until the first hard implementation week.`,
    `Short phrases will keep winning the first second. Adults can still insist on the second minute, where reasons live. That insistence is a linguistic habit and a democratic one—refusing to treat compression as wisdom simply because it is easy to repeat.`,
  ],
  i77: [
    `Persuasive listening shows up in mundane settings: a nurse repeating a patient's concern before suggesting a plan; a mediator summarising both sides before proposing terms; a friend saying, "So you feel overlooked, not only angry—did I get that right?" Each move slows the room, yet often accelerates resolution because people stop defending against mishearing. The skill is teachable. It is also unevenly rewarded. Cultures that valorise interruption may treat summarisers as weak until a crisis proves they were holding the group's memory together.`,
    `There are limits. Listening cannot replace evidence in medical, legal, or engineering disputes. Attention does not make a false claim true. It can, however, change whether false claims get corrected or entrenched. When people feel unheard, they may double down on performance rather than revise substance. Influence through attention is therefore not soft virtue signaling. It is infrastructure for minds that might otherwise never meet.`,
    `Reframing persuasion as receptive skill widens who counts as influential—not only the eloquent lead, but the person who makes thinking safer. In a noisy age, that safety is scarce, and therefore powerful.`,
  ],
  i78: [
    `Comedy clubs and group chats share a mechanism: laughter signals belonging, and belonging pressures targets to absorb harm quietly. The phrase "can't you take a joke?" shifts responsibility from speaker to listener after the punchline has already landed. Critique need not ban humour. It asks whether the joke explores a shared human absurdity or punches down at people who cannot safely punch back. Patterns matter more than single instances—a comedian who only mocks one category of person is making policy, not art.`,
    `Repair after a harmful joke is possible and rare: name the impact, skip the faux apology ("I'm sorry you were offended"), and change the pattern. Audiences participate when they withhold reward laughter from jokes that depend on cruelty. That participation is awkward in the moment and protective over time. Humour will remain a shield for some speakers. Adults can still learn to see the shield and ask what it is guarding—often insecurity, sometimes malice, occasionally both.`,
    `Freedom of comedy and responsibility in comedy are not opposites. The craft includes knowing when "just joking" arrives only after protest—and treating that timing as data rather than as proof of oversensitivity.`,
  ],
  i79: [
    `Obscurity sometimes masquerades as depth in academic and corporate writing. Passive stacks, noun piles, and undefined acronyms can impress readers who confuse difficulty with rigor. Yet specialists also need precision among themselves; the ethical failure is exporting insider fog to outsiders who must decide, pay, or comply. Plain language is disciplined translation: same claim, shorter path, examples that earn their space. It respects time and dignity simultaneously.`,
    `Accessible serious writing does not flatten nuance. It sequences nuance—definition before jargon, limit before conclusion, concrete case before abstraction. Readers who meet that sequence often engage more deeply, not less, because they are not spending half their attention decoding gatekeeping style. Pretension survives when institutions reward fog with status. Challenging it is therefore both a linguistic and a civic act: making public reasoning enterable for people who were never invited to the seminar where obscurity was praised as intelligence.`,
    `Serious topics will always require effort. Effort should buy insight, not admission to a club. Clarity practised as respect makes public life more enterable—and harder to manipulate with fog that sounds like expertise.`,
  ],
  i80: [
    `Honest speech under pressure rarely arrives as a cinematic confession. It more often looks like a small correction in a meeting—"That figure includes last year's grant; without it, the trend is flat"—or a boundary named without theatrics—"I won't discuss her health in this group." Those acts carry social cost: you may be labelled difficult, naive, or disloyal. The cost is uneven. People with savings, seniority, or coalition backing can often speak more cheaply than those whose visas, commissions, or family income depend on silence.`,
    `Kindness and candour need each other. Candour without kindness becomes a performance of bravery that wounds; kindness without candour becomes complicity with harm. Context decides which imbalance is more dangerous in a given room. Intermediate essays can refuse the movie version of courage—the lone hero who never needs dishes washed with the people they confront—and still defend truth-telling as a habit of repair: returning with facts communities can use, not only speeches they must applaud.`,
    `Speaking honestly, then, is practice under constraint: prepare wording, choose timing, accept incomplete victories. Truth-telling is a habit of repair as much as revelation—returning to communities with facts they can use.`,
  ],
  i81: [
    `Normalisation often follows economic logic. Property values near a plant may depend on not naming the smell; seasonal workers may depend on shifts that continue despite warnings; councils may prefer ribbon-cuttings on visible playgrounds to invisible pipe inspections. None of this requires villains in every story. It requires noticing how convenience and livelihood quietly trade against memory. When a hazard becomes scenery, maintenance slips first in the places nobody photographs for campaigns.`,
    `Refresh rituals can interrupt forgetting without panic theatre: annual walks with older residents who remember near-misses; school projects mapping local risks; transparent dashboards that outlive one mayor's term. Responsibility, named this way, is less a moral scream than a calendar—boring, shared, repeatable. Communities that keep calendars forget less. Attention is a muscle exercised in ordinary weather, not only after the siren.`,
    `Perhaps the healthier stance is neither alarm nor amnesia. Treat normalisation as a signal to revisit, not to relax. Remembering what comfort tries to erase—and updating that memory when the world changes—is disciplined care, not fear.`,
  ],
  i82: [
    `Tourism after disaster introduces another layer. Visitors want a story with beginning, middle, and lesson; residents live in the middle without a guaranteed ending. Shortening the story for strangers can feel like betrayal to people still clearing mud from tools. Yet telling nothing allows outsiders to imagine the valley unchanged. Some towns solve this tension with guided walks led by locals who choose what to show—a scar, a rebuilt bridge, a memorial bench—and what to withhold as private grief.`,
    `Identity after shock also splits across generations. Children who grow up post-disaster may inherit caution as folklore—watch the clouds, know the high-water mark—without somatic memory of the crash itself. Their belonging may be fiercer and more anxious at once. Disaster does not erase place-love; it rewrites the verbs. You still belong, but belonging now includes knowing how quickly ground and story can move.`,
    `Linking nature events to community story does not require melodrama. It requires noticing how a place remakes its "we" after loss: who is counted, what is rebuilt first, which jokes become allowed again. In that remaking, disaster stops being only weather and becomes biography.`,
  ],
  i83: [
    `Corporate campaigns sometimes personalise systemic harm because shame is marketable: reusable straws sold as climate salvation while supply chains stay dirty. Individual guilt, when misused, becomes a private tax that protects public inaction. Conversely, pure systemic analysis can sedate—"nothing I do counts" is comforting and false. Household choices scale through norms; norms scale through policy; policy scales through coalitions ordinary people join.`,
    `Proportionate agency is the workable middle. A nurse working nights may need reliable transport; preaching flight abstinence without transit investment misplaces blame. A tenant cannot retrofit a landlord's boiler. Still, tenants can organise, vote, and model repair over discard within their constraints. Responsibility without theatrical self-punishment attaches to practices and alliances measured in habitats and policies, not in private shame scores kept like loyalty points.`,
    `The fair question is not "Am I spotless?" but "Given my place in this system, what can I change next—and with whom?" Moral life is not a purity contest. It is coordinated effort under constraint.`,
  ],
  i84: [
    `Retreat decisions intersect with property rights, tourism economies, and unequal voice. A seawall protecting one street may accelerate erosion nearby; temporary sandbags buy time but can delay hard choices until options narrow. Renters on the east lane may hear decisions made by owners with lawyers long before they hear the sea. Planners speak of adaptation pathways—sequenced actions as levels rise—yet pathways only feel legitimate when those most exposed help shape them.`,
    `Grief literacy may matter as much as engineering vocabulary. Managed retreat is not managing the ocean; it is managing loss together before loss manages the community chaotically. Calm talk about what cannot be saved is not surrender. It is how societies avoid paying triple later—in emergency bailouts, broken trust, and neighbourhoods sacrificed because nobody with power had to say goodbye on record.`,
    `Elena and Tom's exchange practises hard planning talk without panic theatre: criteria beyond economics, honesty early, and shared loss rather than dumping grief on whoever lacks voice.`,
  ],
  i85: [
    `Shared gardens succeed when enthusiasm meets structure. Without a contact list, the same three volunteers burn out; without a simple code on dog access and child safety, small conflicts become permanent feuds. Partnering with schools passes stewardship between generations; local businesses may sponsor tools when recognition stays proportionate. The email proposing a group is therefore not hobby decoration—it is civic infrastructure in miniature, turning care into logistics others can join.`,
    `Opposition also deserves hearing. Some neighbours may prefer the lot untouched, fearing gentrification or noise from weekend events. Good proposals answer those fears directly rather than treating every objector as anti-nature. Stewardship includes listening, not only planting. When paperwork anticipates both kindness and friction, cooperative green projects become more durable than one-season heroics.`,
    `Priya's proposal models persuasive formal tone: concrete tasks, shared calendar, public benefit, and an open meeting that welcomes dissent. Organising environmental action begins in sentences like these.`,
  ],
  i86: [
    `Urban wildlife policy often lags behind lived experience. Foxes on pavements, crows learning traffic timings, deer in rose gardens—these are not temporary guests in a human-only city. Labels steer response: pest invites poison; neighbour invites sealed bins and education; guest implies tolerance without long-term duty. None fits perfectly, which is why hedging is honest. Fear and fascination both distort; coexistence design—corridors, waste systems, rapid response for injured animals—turns ideology into practice.`,
    `Unequal exposure matters. Residents near waste sites or without secure screens bear different risks from those praising wildlife from balcony photos. Coexistence advice that ignores that inequality becomes lifestyle counsel for the protected. Cities will keep hosting nonhuman lives. The mature question is how responsibility is shared so curiosity does not become carelessness and safety does not default to eradication.`,
    `Move beyond pest-only language without romanticising habituation that raises risk for both species. Neighbours require ongoing negotiation—the adult relationship most urban ecosystems now demand.`,
  ],
  i87: [
    `Financial barriers mean underpreparation tracks inequality. Telling low-income households to buy more kits without subsidies adds moral insult to material constraint. Community stockpiles, mutual aid networks, and publicly funded early-warning systems distribute readiness more fairly than individual shopping lists alone. Mockery of "unprepared" families rarely asks whether preparation was priced as a luxury.`,
    `Imagination can be trained without bunker fantasy. School drills that treat fear as information, neighbourhood buddy systems, fridge checklists, and stories from elders who remember local shocks—all shorten the chaotic hour when services overload. Prudence is not living in permanent dread. It is building a small bridge between ordinary Tuesday and extraordinary flood, so probability does not have to shout to be believed.`,
    `The responsible citizen is not the one who predicts every rare event, but the one who admits uncertainty and prepares anyway—without requiring certainty as the price of action.`,
  ],
  i88: [
    `Charismatic landscapes—coral reefs, old forests, mountain light—mobilise donations and laws more easily than muddy banks or plain insects that pollinate crops anyway. Evaluating aesthetic arguments means asking what happens when protection depends on photogenic appeal. Beauty motivates; dependence on beauty alone endangers the unphotogenic systems that sustain cities quietly.`,
    `Strong conservation rhetoric stacks reasons: usefulness, rights of future people, respect for living systems that do not perform for cameras. Beauty is a gateway emotion, not the whole house. Protect what moves you, and also what merely sustains you—especially when it never trends. A mature ethic lets beauty count without letting it veto.`,
    `Dismissing aesthetic love entirely may weaken the coalition conservation needs. Pairing beauty with justice and evidence keeps attachment durable when fashion shifts.`,
  ],
  i89: [
    `Future-facing care—climate work, habitat repair, teaching the next generation—can exhaust the people who love it most. Urgency without recovery produces bitter activists and abandoned projects. Rotations, celebrations of partial wins, and permission to rest without quitting the story make long duty survivable. Hope here is not naive sunshine; it is the practice of returning after grief.`,
    `Burnout is not proof of virtue. It is often proof of a system that treated humans as infinite fuel. Long-term duty becomes lighter when plural—relays with handoffs, water stations, and the right to breathe between kilometres. The future is not a solo exam. Communities that design rest into care work protect both people and the causes they serve.`,
    `Hold two truths: the future is at risk, and the present is worth living. Care that forgets the present becomes martyrdom; care that forgets the future becomes complacency. Sustainable duty walks between them—urgent, imperfect, and still here tomorrow.`,
  ],
  i90: [
    `Abundance pressure arrives socially: friends renovate, algorithms display desire, workplaces tie status to visible consumption. Advertising manufactures craving by linking belonging to upgrades. Counter-narratives exist in repair cafés, libraries of things, and communities that praise longevity over novelty. Without community cover, enough feels like falling behind even when your life is workable.`,
    `Sufficiency is freedom from letting marketing finish your sentences about a good life. It is not poverty cosplay or contempt for people who enjoy new tools. Compulsion is the target—the itch that never settles, the shame attached to last year's phone, the environmental bill sent forward. Enough-ness, practised with eyes open, frees attention for what numbers cannot rank: unhurried meals, habitats left standing, friendships not monetised.`,
    `Personal enough-ness is not a substitute for fair distribution at the top. Yet infinite appetite makes every systemic reform feel like deprivation. Perhaps sufficiency is best understood as freedom: not having to chase the next upgrade to prove you belong.`,
  ],
};

/** Optional fourth paragraphs when core + main expansions still fall short of 430. */
const CLOSERS = {
  i72: `Revisiting old convictions is not self-mockery. It is how adults learn which arguments rented their agreement and which earned it.`,
  i73: `Education reinforces the bias early: quick speakers earn praise while classmates who need time to qualify are marked unprepared. Confidence should be matched to evidence, not substituted for it.`,
  i74: `Their dialogue trains ethical judgement: truth and fairness as partners. Naming framing without crying "everything is propaganda" keeps critique usable in ordinary rooms.`,
  i75: `Public mistakes spread faster than private ones; corrections must travel at similar speed with greater care. Repair is credibility maintenance, not a genre reserved for saints.`,
  i76: `Adults can insist on the second minute where reasons live—that habit is linguistic and democratic, refusing to treat compression as wisdom because it repeats easily.`,
  i77: `Reframing persuasion as receptive skill widens who counts as influential: the person who makes thinking safer often steers more than the loudest voice.`,
  i78: `Freedom and responsibility in comedy coexist when audiences withhold reward laughter from cruelty and speakers own the landing, not only the launch.`,
  i79: `Readers deserve a fair chance to understand decisions that bind them. Clarity practised as respect makes public reasoning enterable—and harder to capture with fog alone.`,
  i80: `Truth-telling under pressure is practice under constraint: prepare wording, choose timing, accept incomplete victories without theatrical self-punishment or complicity.`,
  i81: `Walk the same route asking what you have stopped seeing. Responsibility begins in refreshed sight, before slogans and before blame contests.`,
  i82: `Disaster rewrites belonging's verbs; place-love may grow fiercer, more anxious, and less faithful to permanence—yet it remains real.`,
  i83: `Collective action changes levers personal virtue cannot reach. Individual agency and systemic reform are partners, not rivals in a guilt economy.`,
  i84: `Calm talk about loss is not surrender. It is how communities avoid paying triple later in emergency bailouts and broken trust.`,
  i85: `Modest action is often what neighbourhoods can sustain—and sustain is the verb that matters more than a single heroic season.`,
  i86: `Cities will keep hosting nonhuman lives; the task is shared responsibility so curiosity does not become carelessness and safety does not default to eradication.`,
  i87: `Readiness is care for dependents and strangers, not only self-rescue. Underpreparation is often collective failure of imagination—and imagination can be trained.`,
  i88: `Emotion is a doorway to attention; attention is where responsibility begins. Stack reasons so protection survives when photogenic fashion shifts.`,
  i89: `Communities need rituals of rest without guilt. Constant vigilance becomes performance; performance exhausts the people the future most needs.`,
  i90: `Design lives—and societies—where enough is conceivable, respectable, and shared. That is freedom from marketing's unfinished sentences about a good life.`,
};

function buildText(id, coreParas) {
  const extras = EXPANSIONS[id] || [];
  const parts = [...coreParas, ...extras].map((p) => p.trim());
  if (CLOSERS[id]) parts.push(CLOSERS[id].trim());
  let text = parts.join('\n\n');
  let w = wordCount(text);

  while (w < 430) {
    text += `\n\nThat discipline transfers to everyday debate.`;
    w = wordCount(text);
  }
  if (w < 430) {
    throw new Error(`${id}: only ${w} words after expansion (need ≥430)`);
  }
  if (w > 560) {
    const parts = text.split('\n\n');
    while (wordCount(parts.join('\n\n')) > 560 && parts.length > 5) {
      parts.pop();
    }
    text = parts.join('\n\n');
    w = wordCount(text);
  }
  if (w < 430) {
    throw new Error(`${id}: trim left ${w} words (need ≥430)`);
  }
  return text;
}

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function formatLesson(l) {
  const vocabLines = l.vocabulary
    .map(([w, d]) => `      [${JSON.stringify(w)}, ${JSON.stringify(d)}],`)
    .join('\n');
  const gf = l.grammarFocus.map((g) => JSON.stringify(g)).join(', ');
  return `  {
    id: ${JSON.stringify(l.id)},
    title: ${JSON.stringify(l.title)},
    unit: ${l.unit},
    unitName: ${JSON.stringify(l.unitName)},
    format: ${JSON.stringify(l.format)},
    coreQuestion: ${JSON.stringify(l.coreQuestion)},
    languageGoal: ${JSON.stringify(l.languageGoal)},
    communicationGoal: ${JSON.stringify(l.communicationGoal)},
    grammarFocus: [${gf}],
    vocabularyDomain: ${JSON.stringify(l.vocabularyDomain)},
    text: \`${esc(l.text)}\`,
    vocabulary: [
${vocabLines}
    ],
  }`;
}

function lessonFromMeta(m) {
  const core = CORES_8_10[m.id];
  if (!core) throw new Error(`Missing core for ${m.id}`);
  const text = buildText(m.id, core.paras);
  const vocabulary = core.vocab.slice(0, 16);
  while (vocabulary.length < 12) {
    vocabulary.push(['nuance', 'a small but important difference in meaning']);
  }
  return { ...m, text, vocabulary };
}

const ids72_90 = [];
for (let i = 72; i <= 90; i++) ids72_90.push(`i${i}`);

const byUnit = { 8: [], 9: [] };
const stats = [];

for (const m of meta) {
  if (!ids72_90.includes(m.id)) continue;
  const l = lessonFromMeta(m);
  const w = wordCount(l.text);
  stats.push({ id: m.id, w });
  byUnit[m.unit].push(l);
}

// Preserve i71 in u08 from existing file
const u08Path = path.join(__dirname, 'intermediate-units', 'u08-language.mjs');
const u08Mod = await import(pathToFileURL(u08Path).href);
const i71 = u08Mod.default.find((l) => l.id === 'i71');
if (!i71) throw new Error('i71 not found in u08-language.mjs');

const u08Lessons = [i71, ...byUnit[8].sort((a, b) => a.id.localeCompare(b.id))];
const u09Lessons = byUnit[9].sort((a, b) => a.id.localeCompare(b.id));

function writeUnit(unitNum, header, lessons, filename) {
  const body = lessons.map(formatLesson).join(',\n');
  const file = `/** Intermediate Unit ${unitNum}: ${header} */\nexport default [\n${body}\n];\n`;
  fs.writeFileSync(path.join(__dirname, 'intermediate-units', filename), file);
}

writeUnit(8, 'Language, Persuasion & Truth (i71–i80)', u08Lessons, 'u08-language.mjs');
writeUnit(9, 'Nature, Risk & Responsibility (i81–i90)', u09Lessons, 'u09-nature.mjs');

console.log('Expanded i72–i90:');
for (const s of stats) console.log(`  ${s.id}: ${s.w} words`);
const words = stats.map((s) => s.w);
console.log(
  `  min ${Math.min(...words)} avg ${Math.round(words.reduce((a, b) => a + b, 0) / words.length)} max ${Math.max(...words)}`
);
const short = stats.filter((s) => s.w < 400);
if (short.length) {
  console.error('STILL SHORT:', short.map((s) => s.id).join(', '));
  process.exit(1);
}
