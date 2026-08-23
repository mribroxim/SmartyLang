#!/usr/bin/env node
/**
 * Author compact unique seeds for a21–a100 and write seeds-a21-a100.mjs
 * Each seed has unique open/turn/scene/counter/reply/close + 16 vocab items.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../generated/_advanced-meta.json'), 'utf8'),
).filter((m) => {
  const n = parseInt(m.id.slice(1), 10);
  return n >= 21;
});

/** Unique vignettes / angles keyed by id — dense but distinct. */
const UNIQUE = {
  a21: {
    open: `Feeds decide which voices arrive before breakfast. Ranking systems claim neutrality while quietly setting agendas: what counts as trending, credible, or ignorable. Visibility becomes a scarce good allocated by metrics most users never see.`,
    turn: `Defenders note that algorithms surface minority interests old gatekeepers ignored. Critics reply that optimisation for engagement rewards heat over light. Both can be true in different hours of the same day.`,
    scene: `A neighbourhood dispute goes viral while a careful local investigation stays unread. The platform did not “lie”; it ranked. Yet ranking is a political act wearing engineering language.`,
    counter: `Human editors also excluded, sensationalised, and sold access. Nostalgia for newsrooms should not become amnesia about their biases and bottlenecks.`,
    reply: `The adult demand is accountable ranking: clearer values, appeal paths, researcher access, and public alternatives that do not treat attention as the only currency.`,
    close: `Whether algorithms should decide who gets heard is less a yes/no than a design question: heard by whom, for what purpose, with what recourse when the score is wrong?`,
  },
  a22: {
    open: `Frictionless design promises mercy: one tap, saved passwords, default settings that “just work.” Some frictions were pure cruelty. Others were thinking time in disguise—moments that forced a second look before harm.`,
    turn: `When checkout, posting, and consent become instant, error and manipulation travel at the same speed. Convenience can deskill judgment by removing the pause where values used to interrupt appetite.`,
    scene: `A parent approves a permission screen while juggling bags; a trader confirms a blink-fast order; a voter shares a clip before reading past the headline. Speed feels like competence until repair costs arrive.`,
    counter: `Adding friction can be paternalism, especially when elites keep shortcuts for themselves. Not every delay is wisdom; some is hostility to users with little time.`,
    reply: `Keep frictions that protect irreversible choices—money, reputation, medical consent—while removing frictions that merely humiliate. Design ethics is triage, not purity.`,
    close: `Convenience weakens judgment when it abolishes the interval between impulse and consequence. The interval was never inefficiency alone; it was sometimes the last home of care.`,
  },
  a23: {
    open: `Prediction engines can forecast hospital demand, credit risk, or next-word likelihood with eerie success. Understanding why may lag behind. Societies then face a bargain: act on patterns we cannot explain, or wait for explanations that arrive too late.`,
    turn: `Prediction without understanding works in stable environments and fails when the world shifts—or when people game the metric. Explanation supports responsibility, learning, and contestation; pure prediction can freeze opacity into infrastructure.`,
    scene: `A teacher receives a dashboard flagging “at-risk” students without a story of causes. Interventions become generic. The score was accurate enough to worry, too mute to guide.`,
    counter: `Demanding full causal clarity can become a stalling tactic while harm continues. Sometimes acting on imperfect prediction is the least cruel option available.`,
    reply: `Treat prediction as a hypothesis generator, not an oracle. Pair models with qualitative inquiry, appeal rights, and sunset clauses when environments drift.`,
    close: `Prediction should not replace understanding; it should provoke it. Where provocation never happens, accuracy becomes a glittering form of ignorance.`,
  },
  a24: {
    open: `When an automated system denies a claim, mislabels a face, or routes a patient wrongly, responsibility scatters. Designers cite users; users cite policy; executives cite vendors; vendors cite “the model.” Harm has a location; liability goes missing.`,
    turn: `Accountability requires mapable duties across the chain: who chose training data, thresholds, override powers, monitoring, and retirement of failing tools. Without that map, “human in the loop” becomes theatre—a tired employee clicking approve.`,
    scene: `A benefits office installs a scoring tool. Staff learn that questioning it is career risk. The human remains, but judgment has been socially demoted. Automation’s mistake becomes everyone’s alibi.`,
    counter: `Individual blame can also be unfair when incentives and tools coerce error. Hanging a junior officer does not fix a procurement culture.`,
    reply: `Build answerability into contracts and interfaces: logs, escalation paths, meaningful override, and sanctions that reach decision-makers who chose deployment speed over safety.`,
    close: `Automated mistakes need human owners. If no one can be named, the system was not modernised—it was unowned.`,
  },
  a25: {
    open: `Remote work dissolved some office tyrannies and invented new ones: calendar tessellation, chat surveillance, the loneliness of brilliance with nowhere to collide. Collaboration online can be precise and strangely thin.`,
    turn: `Certain tasks thrive asynchronously—writing, coding, careful review. Others rely on side glances, half-sentences, and trust built in corridors. Mistaking all work for the first kind flattens organisations into ticket machines.`,
    scene: `A team ships features on time while mentorship withers; juniors never overhear how seniors doubt. Efficiency metrics smile. Culture becomes a slide deck about culture.`,
    counter: `Offices were not magic communities; they excluded caregivers, the disabled, and the geographically stuck. Forcing return-to-office as nostalgia can be cruelty with a badge.`,
    reply: `Design hybrid life by function, not fashion: protect deep work, schedule collision on purpose, measure learning not only output, and refuse monitoring that treats adults as suspects.`,
    close: `Remote work changes thinking together by changing who overhears whom. The question is which collisions we still owe each other.`,
  },
  a26: {
    open: `Digital archives promise perfect recall: searchable mail, photos, location trails. Forgetting becomes an active project rather than a default. Societies that cannot forget may also struggle to forgive, update, or let identities evolve.`,
    turn: `Biological memory edits; digital memory accumulates. The shift changes shame, evidence, and history. A cruel teenage post can outlive the person who grew; a deleted injustice can vanish if no one mirrored it.`,
    scene: `Families argue with their own photo rolls; courts argue with timestamps; activists argue with disappearing pages. Permanence and fragility coexist oddly—everything saved, nothing curated.`,
    counter: `Nostalgia for forgetting ignores victims who needed records. Archives can protect the vulnerable against powerful amnesia.`,
    reply: `Curation, retention limits, and contextualisation become civic skills. Deletion rights and preservation duties must be weighed case by case, not slogan by slogan.`,
    close: `We forget differently now: less by decay, more by drowning or deletion. Wisdom lies in choosing which.`,
  },
  a27: {
    open: `Automation speeches oscillate between utopia and unemployment apocalypse. Quieter evidence suggests unevenness: routine tasks shrink; judgment, repair, care, negotiation, and taste persist in stubbornly human forms—sometimes underpaid.`,
    turn: `Skills that survive are often those that handle novelty, conflicting values, and messy bodies. They are harder to standardise, which is why markets undervalue them until crisis.`,
    scene: `A clinic’s paperwork bot frees minutes; nurses spend them on patients who do not fit pathways. The “soft” skill was the load-bearing wall.`,
    counter: `Romanticising irreplaceable humans can excuse refusing to automate drudgery that genuinely hurts workers. Not every task deserves human hands.`,
    reply: `Education should teach meta-skills—learning, ethical reasoning, collaboration—while societies share productivity gains instead of concentrating them.`,
    close: `What survives automation is less a fixed list than a moving frontier of judgment. The ethical question is who gets trained for that frontier, and who gets discarded at the edge.`,
  },
  a28: {
    open: `Defaults steer: organ-donation opt-outs, pre-checked boxes, infinite scroll. Nudge theory promised gentle help. Dark patterns turned the same toolkit toward extraction. The ethical line is thin and profitable to blur.`,
    turn: `Helpful design reduces needless complexity; manipulative design exploits bias while performing care. Consent that is legally present and cognitively impossible is a moral failure with a checkbox.`,
    scene: `Unsubscribing takes seven screens; buying takes one. The asymmetry reveals intent more honestly than any design manifesto.`,
    counter: `Total neutrality is impossible; every interface orders options. Refusing all nudges can abandon people to confusion that favours the already fluent.`,
    reply: `Criteria help: Is the user’s goal advanced? Is the mechanism legible? Is reversal easy? Would publicity of the tactic survive shame? If not, it is manipulation wearing UX.`,
    close: `Design can nudge without manipulating when it remains an ally of the user’s longer aims—not a hunter of their lapses.`,
  },
  a29: {
    open: `Experts specialise until the world beyond their tunnel blurs. Amateurs arrive with inconvenient questions, odd analogies, and freedom from professional taboos. Fields that exile them calcify; fields that worship them drown in noise.`,
    turn: `Productive amateurism shows up in astronomy, open-source software, natural history, and patient advocacy—places where distributed eyes catch what guilds miss. The gift is attention and stake, not credentials.`,
    scene: `A parent of a rare-disease child maps literature the clinic skimmed; a birder’s dataset revises migration models. Authority feels momentarily upside down, then—ideally—collaborative.`,
    counter: `Amateur confidence can also spread medical myths and engineering fantasies. Openness needs filters, not just microphones.`,
    reply: `Institutions should build translation layers: ways for outsiders to contribute evidence without pretending all claims are equal. Respect without romance; standards without contempt.`,
    close: `Experts need amateurs as mirrors and sensors. Amateurs need experts as scaffolding. Either alone becomes a caricature of knowing.`,
  },
  a30: {
    open: `Information abundance was sold as enlightenment. Many experience it as vertigo: more sources, less shared reality, endless “research” that never settles into judgment. Wisdom is not the sum of tabs.`,
    turn: `Data without curation becomes a landfill. Attention, trust, and interpretive skill are the bottlenecks—not raw supply. Those bottlenecks are unequally distributed, so abundance can widen epistemic inequality.`,
    scene: `Two citizens “do their own research” and emerge with incompatible universes, each armed with screenshots. The problem was not lack of information; it was lack of shared methods for weighing it.`,
    counter: `Gatekept scarcity also produced ignorance and elite capture. Returning to a priestly few is not the cure for overwhelm.`,
    reply: `Invest in public curation: libraries, journalism with standards, education in source evaluation, and personal practices of finishing fewer things more deeply.`,
    close: `More information makes us wiser only when judgment scales with supply. Otherwise we become richly confused.`,
  },
  a31: {
    open: `Public space is legally open and socially filtered. Who lingers on a square without apology depends on benches, policing, prices nearby, and unspoken etiquette. Claiming space is quieter than owning property and often more contested.`,
    turn: `Design and policy allocate belonging: skate stoppers, hostile architecture, permit cultures, music bans. Comfort for some is expulsion for others, described as “order.”`,
    scene: `Teenagers occupy steps until security moves them; office workers keep the café seats all afternoon. Both are using the city. Only one group is narrated as a problem.`,
    counter: `Unbounded use can destroy the shared good—noise, litter, intimidation. Rules are not automatically oppression; absence of rules can be capture by the boldest.`,
    reply: `Democratic public space needs plural uses, clear non-arbitrary rules, and amenities that invite rather than merely exclude. Measure success by who feels entitled to rest.`,
    close: `Who gets to claim public space is a daily referendum on equality—held not at ballot boxes but on pavements.`,
  },
  a32: {
    open: `Some neighbourhoods appear endlessly in lifestyle media; others exist mainly in crime maps or not at all. Invisibility is produced: by investment patterns, journalistic habits, transport maps, and the aesthetics of what counts as “interesting.”`,
    turn: `Being unseen shapes politics. Problems without picturesque framing struggle for budget. Talents without networks remain local secrets. Inequality is material and representational at once.`,
    scene: `A bus line cut makes a district farther from jobs; a newspaper’s “city guide” draws a border that skips it. Residents joke they live off the map. The joke is a theory.`,
    counter: `Visibility can bring extraction—gentrifying attention that raises rents without raising power. Being seen is not automatically being served.`,
    reply: `Repair means better data, resident-led storytelling, and infrastructure that treats overlooked places as central rather than residual. Representation should follow accountability, not replace it.`,
    close: `Neighbourhoods feel invisible when institutions stop imagining them as futures. Remapping is moral work as much as cartographic work.`,
  },
  a33: {
    open: `Density frightens those who equate closeness with chaos. Yet many beloved cities are dense and humane: mixed uses, walkable errands, shared services. Overcrowding is not density; it is density without design, rights, or light.`,
    turn: `Humane density needs floor-area fairness, sound insulation, green pockets, transit, and governance that prevents predatory crowding. Anti-density politics often protects scarcity that keeps prices cruel.`,
    scene: `A well-built mid-rise with a courtyard can hold more life than sprawling lots that isolate carers without cars. The skyline argument misses the kitchen-table argument.`,
    counter: `Forced density without services reproduces vertical slums. Developers citing “urbanism” while deleting play space deserve scepticism.`,
    reply: `Judge proposals by daylight, noise, tenure security, and access—not by rural nostalgia or maximal floor counts alone.`,
    close: `Density can be humane when proximity is paired with dignity. Without that pairing, closeness becomes only pressure.`,
  },
  a34: {
    open: `Housing is shelter, asset, status, and inheritance vehicle. Speeches about fairness sound abstract until rent, mould, and commute times enter the room. Homes encode hierarchy more honestly than mission statements.`,
    turn: `When housing is primarily a financial instrument, residents become residual. Policy that only “stimulates supply” without tenure protection can build units that still exclude. Fairness is distributional, not only volumetric.`,
    scene: `Two colleagues share a workplace and incomparable evenings: one hosts friends; one calculates whether heating or food loses this month. The labour market called them equals. Housing disagreed.`,
    counter: `Price controls and romantic anti-market politics can freeze supply and create queues with their own injustices. Moral clarity about need must face production realities.`,
    reply: `A serious fairness agenda mixes supply, social housing, stable tenancies, and limits on predatory extraction—local details matter more than global slogans.`,
    close: `Housing reveals fairness because it decides who can plan a future. Without that, other equalities remain theoretical.`,
  },
  a35: {
    open: `Cities concentrate opportunity and exclusion in the same metro map. They invent new inequalities—platform labour, amenity premiums—and intensify old ones. Calling them laboratories is apt if we remember laboratories can be unethical.`,
    turn: `Migration to cities is often rational even amid unfairness: anonymity, specialised work, weaker local surveillance. Liberation and stratification commute together.`,
    scene: `A gleaming waterfront and a flood-prone periphery share a brand. Tourism cameras never pan to the periphery’s boil-water notices. The brand is a selective truth.`,
    counter: `Rural nostalgia ignores rural hierarchies and scarcities. Anti-urbanism can be another elite aesthetic.`,
    reply: `Use cities as sites of repair: progressive services, inclusive zoning, labour standards for new sectors—not as proof that unfairness is inevitable.`,
    close: `Cities are laboratories of inequality and of remedies. Which experiment we fund is a choice, not a fate.`,
  },
  a36: {
    open: `Commutes are designed long before individuals “choose” them. Rail alignments, road widenings, fare structures, and school locations allocate whose time is treated as cheap. Mobility policy is time policy.`,
    turn: `When planning privileges peak car throughput, caregivers’ multi-stop journeys become illegible. When night shifts lack transit, the poor subsidise the city with exhaustion.`,
    scene: `A nurse’s cross-town trip takes three buses; an executive’s takes a single express lane. Productivity culture praises the executive’s punctuality without counting the nurse’s unpaid transit labour.`,
    counter: `Not every long commute is oppression; some are trades for space or kin. Agency exists—inside constrained menus.`,
    reply: `Design for the complex trip, price congestion fairly, and treat reliability as equity. Ask whose minutes are expendable in every map.`,
    close: `Who designs the commute designs the day. That is quieter power than most speeches admit.`,
  },
  a37: {
    open: `Parks are called lungs and equalisers. Entry may be free while belonging is not: policing styles, sports bookings, café prices, and cultural codes gatekeep green space. Democracy in a park is a practice, not a plaque.`,
    turn: `Hostile design against sleeping rough can make lawns feel safer to some and like exile to others. Safety talk often hides a preference about which bodies may rest.`,
    scene: `A weekend drum circle draws complaints; a corporate yoga brand gets a permit. Both make sound. Only one is narrated as vibrancy.`,
    counter: `Unregulated parks can become territories of intimidation. Rules can protect the shy and the small. The question is who writes them and how unevenly they bite.`,
    reply: `Democratic parks need diverse amenities, transparent rules, community stewardship, and enforcement that distinguishes harm from mere presence.`,
    close: `A park is public when many kinds of people can waste time there without translating themselves into someone else’s comfort.`,
  },
  a38: {
    open: `Culture districts often begin with cheap rent and risky experiments. Success attracts capital; capital raises rents; the experimenters leave. The brand remains, now selling a memory of edge.`,
    turn: `Gentrification stories can be moralising or naive. Displacement is real; so is residents’ desire for safer streets and better shops. The tragedy is when “improvement” means cultural eviction.`,
    scene: `A studio becomes a concept store selling replicas of the studio’s former grit. Artists commute from farther out to staff openings they can no longer afford to live beside.`,
    counter: `Freezing neighbourhoods in romantic poverty denies long-term residents upgrades they want. Anti-displacement policy must not require misery as authenticity.`,
    reply: `Tools exist: community land trusts, studio covenants, tax policies, and cultural funding tied to tenure. Taste alone will not save a scene.`,
    close: `When culture districts price out culture, cities keep the postcard and lose the process that made the postcard worth buying.`,
  },
  a39: {
    open: `Pipes, rails, and highway interchanges outlive election cycles. Path dependence means yesterday’s concrete constrains today’s fairness: who floods, who reaches jobs, who breathes particulate matter.`,
    turn: `Infrastructure is destiny only if we refuse retrofit. Destiny talk can become fatalism that protects old winners. Yet underestimating sunk systems produces fantasy plans with no water pressure.`,
    scene: `A redlined map from decades ago still predicts tree canopy and heat deaths. The map was policy; the heat is present tense.`,
    counter: `Not every unequal outcome is sealed by old concrete; governance and maintenance choices continue to matter yearly.`,
    reply: `Treat inheritance as editable: repair, reconnect, bury, shade, and reprice access. Long-lived systems need long-lived justice agendas.`,
    close: `Infrastructure shapes fate without writing it finally. The adult stance is respect for constraints without worshipping them.`,
  },
  a40: {
    open: `Maps claim to show what is there. They also argue what matters: centre, margin, scale, omission. A transit map that erases walking deserts tells a political story with coloured lines.`,
    turn: `Mercator, zoning atlases, crime heatmaps—each aesthetic choice allocates attention and fear. Neutrality is a rhetorical achievement, not a starting point.`,
    scene: `Tourists navigate a city that looks continuous on their phones while residents know which blocks the route silently avoids. Convenience routing can encode avoidance as common sense.`,
    counter: `All representations select; the demand for a perfect mirror is impossible. Criticism of maps should propose better selections, not purity.`,
    reply: `Counter-mapping by communities, transparent legend choices, and multiple maps for multiple purposes can pluralise power. Teach map reading as civic literacy.`,
    close: `Maps hide power when their selections are naturalised. Making the legend contestable is a democratic act.`,
  },
};

// Continue UNIQUE for a41-a100 in second object below via codegen from meta + handcrafted lines
const MORE = {};

function vocabFor(meta) {
  const domain = meta.vocabularyDomain;
  const base = [
    ['Nuance', '(Noun) A subtle difference in meaning or opinion.'],
    ['Qualify', '(Verb) To limit or add conditions to a statement.'],
    ['Stakeholder', '(Noun) A person with an interest in a decision’s outcome.'],
    ['Trade-off', '(Noun) A balance between two desirable but incompatible features.'],
    ['Provisional', '(Adjective) Temporary; accepted for now pending evidence.'],
    ['Contestation', '(Noun) The action of disputing or challenging.'],
    ['Incentive', '(Noun) Something that motivates action.'],
    ['Legible', '(Adjective) Clear enough to read or interpret.'],
    ['Structural', '(Adjective) Relating to deep organisation rather than surface.'],
    ['Agency', '(Noun) Capacity to act and choose.'],
    ['Accountability', '(Noun) Responsibility to explain and answer for actions.'],
    ['Synthesise', '(Verb) To combine parts into a coherent whole.'],
    ['Hedge', '(Verb) To soften a claim to avoid overstatement.'],
    ['Implication', '(Noun) A likely consequence or suggested meaning.'],
    ['Criterion', '(Noun) A standard for judgment (plural: criteria).'],
    ['Revisable', '(Adjective) Able to be changed after new evidence.'],
  ];
  // lightly specialise first items using domain words
  const w = domain.split(/[&,\s]+/).filter(Boolean)[0] || 'Theme';
  base[0] = [
    w.charAt(0).toUpperCase() + w.slice(1),
    `(Noun) A key idea in the domain of ${domain}.`,
  ];
  return base;
}

function fillFromMeta(meta, unique) {
  return {
    open: unique.open,
    turn: unique.turn,
    scene: unique.scene,
    counter: unique.counter,
    reply: unique.reply,
    close: unique.close,
    vocab: vocabFor(meta),
  };
}

// Handcrafted unique blocks a41–a100 (compressed)
const U2 = {
  a41: [`Shared stories coordinate strangers: who “we” are, what we owe, what we refuse. Without any common narrative, cooperation relies only on price and force—thin glue for complex societies.`, `Stories also exclude. National myths can erase minorities; local legends can police belonging. The need for shared narrative is not a need for a single authorised myth.`, `A civic holiday that still argues about its meaning may be healthier than a holiday that forbids argument. Contested stories can still be shared as contested.`, `Demanding unanimity produces official scripts nobody believes. Cynicism then becomes the only shared story left.`, `Practise pluralism with common procedures: who may speak, how evidence enters, how revisions happen. Story as infrastructure needs maintenance rules.`, `Societies need shared stories the way cities need roads—passable, repairable, and not owned by one convoy.`],
  a42: [`Museums once performed certainty. Increasingly they are asked to perform conscience: labels that confess violence, absences, and theft. The shift can educate or become a sermon that flattens art into evidence only.`, `Uncomfortable truth needs craft: objects, context, multiple voices, and room for visitors to think without being marched.`, `An exhibition that only congratulates the audience’s prior politics teaches little. One that only aestheticises harm teaches cruelty.`, `Curators fear both backlash and righteousness. Their job is interpretation under uncertainty, not absolution retail.`, `Invite dispute into the gallery through documented debate, not only through wall text that pretends the argument is over.`, `Museums can tell uncomfortable truths when they remain places of inquiry rather than tribunals with gift shops.`],
  a43: [`When a language fades, more than words leave. Ecological knowledge, joke timing, kinship terms, and ways of noticing weather can thin with the grammar that carried them.`, `Documentation helps; living speakers matter more. Museums of vocabulary without intergenerational use are archives of loss.`, `A grandparent’s proverb untranslatable into school language marks a precise thought the majority tongue handles clumsily.`, `Preservation can turn speakers into exhibits. Respect means resources for use—schools, media, rights—not only linguist careers.`, `Support bilingual futures without forcing purity tests that shame mixed speech, which is often how languages actually live.`, `What survives when languages fade is sometimes a scar tissue of translation. What does not survive is harder to mourn because it lacked a market name.`],
  a44: [`Personal nostalgia can be tender. Political nostalgia selects a past, deletes its victims, and sells the remainder as destiny. Longing becomes a programme.`, `Campaigns that promise return often invent the destination. The “again” in slogans is a curated museum with the exits hidden.`, `A factory town remembering steady wages is not foolish; a politics that weaponises that memory against neighbours is.`, `Not every future orientation is wise, and not every past reference is propaganda. Distinguish grief from mobilisation.`, `Ask who benefits from the selected golden age, and which archives were left in the darkroom.`, `Nostalgia becomes politics when it organises power. Until then it is only weather in the chest—real, but not yet a platform.`],
  a45: [`Tradition is inherited, borrowed, remixed, and sometimes stolen. Ownership language helps communities protect dignity; it can also freeze living practice into property law cosplay.`, `Gatekeeping can prevent extraction; it can also punish internal innovators, especially the young and the queer.`, `A dance taught across borders acquires new feet. Purism that denies contact histories often invents a past as pure as it is false.`, `Consent, credit, and reciprocity are better tools than metaphysical ownership of culture.`, `Negotiate: who speaks, who profits, who is invited to revise. Process matters more than a single verdict of “allowed.”`, `Who owns a tradition? Practitioners in relation—not a trademark office alone, and not every tourist with a camera.`],
  a46: [`Art that lectures often loses the room. Art that refuses the world can look like luxury. Critique without preaching tends to trust the audience with ambiguity.`, `Didactic pieces can still matter in emergencies; subtlety is not always the ethical priority.`, `A play that indicts everyone except its audience flatters more than it challenges.`, `Ambiguity is not relativism; it is a form that keeps conscience working after the lights rise.`, `Judge political art by aftertaste: Does it enlarge perception or only confirm tribe?`, `Art can criticise without preaching when it prefers revelation to verdict—and accepts that some viewers will refuse the gift.`],
  a47: [`Monuments are time machines stuck in public squares. Meanings shift as audiences shift: hero, oppressor, ancestor, embarrassment. Bronze is stable; significance is not.`, `Removal, contextualisation, and relocation are interpretive acts, not merely vandalism or purification.`, `A statue that once unified a ruling story may now fracture a city. Pretending otherwise is historical illiteracy.`, `Endless monument wars can distract from material repair. They can also be the repair’s necessary language.`, `Prefer processes with historians, residents, and due notice over midnight erasure or stubborn denial.`, `Monuments keep changing meaning because we do. The stone is a mirror with a plaque.`],
  a48: [`Translation is accused of betrayal and praised as bridge. In practice it is labour: choosing losses, inventing compensations, and making a new original that answers two languages at once.`, `Readers who want perfect equivalence want mathematics from an art.`, `A translated poem that sings may diverge; a literal one that thuds may “faithfully” fail.`, `Translators deserve visibility as co-authors, not invisibility as pipes.`, `Compare versions; learn what each system can hold. Loss is real; so is discovery.`, `Translation creates meaning as it loses it—the paradox is the job description.`],
  a49: [`Archives feel neutral: boxes, indexes, humidity control. Yet collecting is choosing, and discarding is often quieter violence. Silences in the record are frequently organised.`, `Who had literacy, who was policed into paperwork, who could afford preservation—these shape “what happened.”`, `A colonial archive may be rich on taxes and mute on interior lives. Absence is data.`, `Digitisation can democratise access and amplify old biases at scale.`, `Fund community archives, describe provenance honestly, and teach suspicion toward completeness myths.`, `Archives are not neutral. They are arguments that forgot they were arguing—until someone asks who is missing.`],
  a50: [`Some works endure through institutions: schools, canons, copyrights, rituals of revisit. Genius talk hides the machinery. Endurance is social reproduction as much as spark.`, `Contemporaries equally loved can vanish when no one assigns them.`, `Canon revision is not vandalism; refusal to revise is not reverence—it is inertia with incense.`, `Markets of attention now accelerate forgetting and sudden revival alike.`, `Ask what infrastructures keep a work alive, and whom those infrastructures serve.`, `A cultural moment lasts when people keep needing it—to think, bond, or quarrel. Without need, prestige is only storage.`],
  a51: [`Prices enter the body: the flinch at the till, the pride of treating someone, the shame of returning goods. Macro talk about inflation misses how costs feel like judgment.`, `Households narrate prices as personal competence even when the shock is systemic.`, `A rising rent is not only a number; it is a threat to continuity of school, friends, and care.`, `Economists need those textures without drowning in anecdote; citizens need aggregates without being told their pain is ignorance.`, `Watch what people cut first—medicine, leisure, gifts—and you will see priorities under coercion.`, `Prices feel personal because they ration belonging. That is why “just a market signal” so often sounds like an insult.`],
  a52: [`Growth headlines celebrate averages that can rise while typical lives stall. Distribution is not a sequel to growth; it is part of what growth means for persons.`, `A booming skyline beside stagnant wages is not a mystery; it is a pattern.`, `Policy that waits to “grow first, share later” often discovers later never arrives with power attached.`, `Anti-growth romanticism can also harm the poor if it blocks tools that raise real living standards.`, `Measure medians, floors, and access—not only totals. Tell stories that refuse the tyranny of the mean.`, `Growth that ignores distribution is a victory parade counted from the balcony.`],
  a53: [`Waged work crowds the definition of labour. Care, informal hustles, and community maintenance remain economically essential and culturally demoted. What counts as work is a political sorting.`, `Time-use studies make the invisible overtime of households painfully clear.`, `A society that calls only paid effort “productive” will underbuild the conditions of everyone’s productivity.`, `Not all unpaid activity is exploitation; some is joy. The point is recognition and support where duty falls unevenly.`, `Count care in budgets, design leave, and refuse contempt for informal workers who keep cities alive.`, `What counts as work shapes who may claim fatigue as legitimate. That claim is a justice issue.`],
  a54: [`“The market decided” often ends arguments that were moral all along: about desert, risk, and whose preferences count. Efficiency language can smuggle values past customs.`, `Prices coordinate brilliantly and exclude brutally; both facts belong in one sentence.`, `Calling a outcome “market” does not make it non-political when rules, property, and enforcement structured the game.`, `Moralising against all markets ignores their role in plural coordination among strangers.`, `Name the values inside the model. Then argue about them without the costume of inevitability.`, `Markets are tools and stages for moral conflict. Treating them as oracles is theology with spreadsheets.`],
  a55: [`Risk is allocated by contracts, insurance, family, and luck. Gig schedules, medical debt, and climate exposure show that misfortune is rarely randomly sprinkled.`, `Who may smooth shocks and who must absorb them is a design choice repeated daily.`, `A delivery rider waits out rain without sick pay while a salaried office watches the same storm through glass.`, `Personal responsibility talk matters inside fair structures; outside them it becomes victim theory.`, `Expand portable benefits, enforce safety, and stop pretending volatility is a personality test.`, `Who pays for risk reveals whose lives are treated as buffers for other people’s convenience.`],
  a56: [`Debt reorganises time: futures are pledged, presents shrink, relationships strain under quiet arithmetic. Character talk about debtors often ignores how credit systems invite dependence.`, `Shame is a collection tool. It works—and it distorts self-respect.`, `A student loan can be ladder or tether depending on wages and interest politics.`, `Not every leverage is predation; not every default is moral failure. Distinguish liquidity from condemnation.`, `Regulate abusive products, teach negotiation without humiliation, and reject stories that make poverty look like sin.`, `Debt reshapes character when societies teach people to experience structural binds as private flaws.`],
  a57: [`Local makers face global price, fashion, and platform gravity. Resistance is rarely pure autarky; it is niche, quality, relationship, and sometimes policy shelter.`, `A town’s bakery competing with logistics giants is not a fairy tale; it is an ecosystem question.`, `Tourists may romanticise localism while bidding up the rents that kill it.`, `Global connection also brings tools and audiences small places need. The binary is false.`, `Support commons infrastructure—workspaces, credit unions, procurement—that lets local firms stay viable without museum status.`, `Local economies resist global fashion by becoming necessary, not merely nostalgic.`],
  a58: [`Shortages strip politeness from priorities. Empty shelves reveal what households hoard, what governments ration, and which groups are told to wait “for the greater good.”`, `Panic buying is information about trust as much as about greed.`, `A medicine shortage teaches whose chronic conditions count as urgent.`, `Not every scarcity is natural; some is engineered by concentration and just-in-time fragility.`, `Build buffers, diversify supply, and communicate rationing criteria before crises invent rumours.`, `Shortages reveal priorities because trade-offs stop hiding in abundance.`],
  a59: [`Productivity metrics organise workplaces and self-worth. Output per hour can illuminate waste and also erase care, craft, and rest as “unproductive.” Master metrics become moral metrics.`, `A nurse’s presence may not chart like a factory unit and still prevent death.`, `Refusing all measurement invites favouritism; worshipping measurement invites cruelty.`, `Use plural indicators: quality, safety, learning, wellbeing—accepted as real even when harder to count.`, `Defend unproductive-looking goods: rehearsal, mourning, play. Civilisation depends on them.`, `Productivity is a tool, not a definition of a good life. When it becomes the latter, people become dashboards.`],
  a60: [`Headlines love crashes and jackpots. Ordinary money lives in remittances, rotating savings clubs, informal credit, and careful envelopes. Those practices organise more households than trading floors.`, `A weekly transfer across borders can outweigh a national growth story for one family.`, `Ignoring informal finance makes policy blind—and sometimes punitive.`, `Spectacle finance is not fake; it is incomplete as a portrait of economic life.`, `Listen to household cash calendars before designing interventions that assume banked, steady wages.`, `What headlines miss about ordinary money is most of money: the uncelebrated logistics of getting through the month.`],
};

const U3 = {
  a61: [`Care is claimed by professions, families, and algorithms that schedule visits. Defining care is a power struggle dressed as kindness: who decides need, quality, and enough.`, `A timesheet may call a conversation “non-billable” while a patient calls it the only human hour.`, `Centring only clinical tasks can erase the relational labour that makes clinical tasks possible.`, `Sentimentality can also trap carers in unpaid forever roles gendered by habit.`, `Negotiate definitions publicly: standards, pay, and patient voice in the same conversation.`, `Who decides what counts as care decides whose exhaustion is visible.`],
  a62: [`Hospitals chase throughput and dignity at once. Targets can save lives by reducing deadly waits—and crush the pauses where people are recognised as persons.`, `A discharge timed to a metric may be clinically defensible and existentially violent.`, `Efficiency without dignity becomes warehousing; dignity without any efficiency can ration by chaos.`, `Staff feel the collision as moral injury when they know what the schedule forbids.`, `Design metrics that include continuity, communication, and equity—not only minutes and beds.`, `Medicine serves both aims only when efficiency is defined as serving persons, not replacing them.`],
  a63: [`Diagnosis begins in story. Listening is not courtesy; it is instrument. Interrupted patients often lose the detail that would have changed the path.`, `Time pressure teaches clinicians to hear categories instead of people.`, `A pause that invites the second sentence can prevent the wrong third test.`, `Listening without skill can become voyeurism or endlessness; structure still matters.`, `Train and staff for attention as a clinical resource with the seriousness given to machines.`, `Listening is a clinical skill because bodies speak in narratives before they speak in numbers.`],
  a64: [`Chronic illness refuses the drama of cure. Obligations shift toward support, pacing, and citizenship that includes limited energy. Acute-care ethics is incomplete here.`, `Friends disappear when the plot stops resolving; systems do too.`, `Pity narratives comfort observers and shrink the ill person’s agency.`, `Support that enables contribution without denying limits is harder than inspiration posters.`, `Build long-horizon benefits, workplace redesign, and communities that stay after novelty fades.`, `What we owe the chronically ill is durable solidarity—not a temporary performance of concern.`],
  a65: [`Dying decisions feel private and rarely are. Families, statutes, faiths, and clinical teams enter the room—sometimes invited, sometimes by force of fear.`, `A person may want silence; a relative may want every intervention; a protocol may demand a form.`, `Privacy language can protect dignity and also abandon people to unequipped families.`, `Public rules exist because private rooms contain unequal power.`, `Advance care planning, mediation, and trained palliative teams reduce the cruelty of improvised ethics at 3 a.m.`, `End-of-life choices are intimate and institutional at once; pretending otherwise helps no one who must live with the result.`],
  a66: [`Prevention campaigns offer freedom from disease and sometimes police lifestyles. Autonomy can be expanded by knowledge or narrowed by shame.`, `A tax on soda may save teeth and stigmatise poverty if alternatives are weak.`, `Public health without liberty language becomes paternal theatre; liberty without prevention can be indifference to the vulnerable.`, `Co-design with communities beats lectures from afar.`, `Make healthy choices easier and cheaper before moralising harder ones.`, `Prevention feels like freedom when it multiplies options—and like control when it only multiplies judgment.`],
  a67: [`Proxy decision-makers speak for patients who cannot. Trustworthy proxies need clarity about values, limits on self-interest, and clinical humility.`, `Substituted judgment tries to choose as the patient would; best interest standards try to choose what benefits them now—both can be abused.`, `A relative may love fiercely and still project their own fears.`, `Leaving proxies without guidance is abandonment dressed as respect.`, `Document wishes early, review conflicts, and keep the silent patient’s dignity as the north star—not the loudest relative’s.`, `Who speaks for the unspeaking must be auditable, temporary, and answerable to the person’s known commitments.`],
  a68: [`Hospital technology can restore contact—shared imaging explained well—or replace it with screen glow and data entry backs turned to beds.`, `A bedside tablet that lets distant family join rounds may humanise; a laptop that steals eye contact may not.`, `Novelty bias funds gadgets over nurses.`, `Romantic anti-tech nostalgia forgets suffering that machines relieve.`, `Evaluate tools by relationship effects and error rates together; sunset what isolates.`, `Technology humanises hospitals only when it serves presence rather than merely documenting its absence.`],
  a69: [`Burnout is framed as individual resilience failure. Often it is the system’s fever: understaffing, moral injury, and metrics that punish care. Exhausted staff change treatment quality before they resign.`, `Compassion thins; shortcuts multiply; residual anger leaks onto patients.`, `Wellness apps without workload change are insult therapy.`, `Some stress is intrinsic to high stakes; much is optional cruelty of design.`, `Staff to acuity, restore recovery time, and give clinicians voice in workflow redesign.`, `Burnout threatens care because care is embodied. You cannot extract infinite presence from finite nervous systems.`],
  a70: [`Access barriers hide in mundanities: bus routes, form literacy, childcare, distrust, and waiting rooms that punish the already tired. Equity fails in cumulative frictions.`, `A missed appointment may be a moralised “no-show” or a transit timetable.`, `Building a clinic without asking how people arrive is architecture as exclusion.`, `Not every barrier is injustice; some are triage. But triage should be honest and reviewable.`, `Map the journey with patients; fix the stupid frictions first; publish waits by group.`, `Fair access looks like a path a tired person can complete—not a right that exists only on paper.`],
  a71: [`Metaphors smuggle policies: war on drugs, viral ideas, tipping points, safety nets. Each highlights and hides. Calling something a war recruits enemies; calling it a journey softens conflict.`, `A budget framed as household belt-tightening may misdescribe a currency issuer—and still persuade.`, `Dead metaphors rule after they stop looking like metaphors.`, `Not all figurative language is deceit; abstraction needs images.`, `Audit dominant metaphors and try alternatives in public drafts before they harden.`, `Metaphors shape policy by shaping what counts as a sensible next move.`],
  a72: [`Plain language can liberate publics from priestly fog. It can also strip nuance that minorities need, or become a branding exercise that leaves power untouched.`, `A clear denial is clearer harm; opacity at least advertised complexity.`, `Jargon protects guilds; clarity can expose them—hence resistance.`, `Anti-expert plainness can become populist anti-knowledge.`, `Translate without dumbing: layered texts, glossaries, and bilingual outreach.`, `Plain language is power when it redistributes understanding—not when it merely sells simplicity.`],
  a73: [`Slogans compress and travel. Evidence crawls. In attention markets, the portable phrase outruns the careful paragraph, especially when emotion pays the postage.`, `“Take back control” needs no footnote to move a crowd.`, `Complex truths can be framed memorably without becoming lies—but the incentive leans toward emptiness.`, `Refusing all slogans concedes the field to worse stylists.`, `Teach slogan literacy: Who benefits? What is omitted? What would falsify this?`, `Slogans outrun evidence because minds are busy and rhyme is sticky. Democracy needs slower genres too.`],
  a74: [`Ambiguity can be diplomacy’s oil or evasion’s smoke. Joint statements that mean two things keep peace; corporate apologies that mean nothing keep profits.`, `Strategic vagueness is a skill; so is detecting it.`, `A regulator’s “may” can be mercy or escape hatch.`, `Demanding impossible precision can shatter coalitions that do rough good.`, `Ask for operational definitions when rights and money are at stake; allow constructive ambiguity when symbolism must hold a truce.`, `Who benefits from ambiguity is the first diagnostic question—before praising subtlety or crying betrayal.`],
  a75: [`Silence can refuse a frame, protect the vulnerable, starve a troll, or abandon a victim. Rhetoric includes the unsaid.`, `A press conference without questions answered is theatre; a mourner’s refusal to perform grief for cameras may be dignity.`, `Powerful silence differs from silenced power.`, `“Breaking the silence” is not automatically virtuous if it extracts confession for spectacle.`, `Read context: Who can afford to speak? Who is punished for pauses?`, `Silence is a rhetorical strategy whenever meaning is made by what does not occur on the record.`],
  a76: [`Stories select, order, and emphasise. They can be factually correct and still unfair—true sentences arranged into a false world.`, `A profile that opens with a single crime and closes without context is a weaponised chronology.`, `Advocacy needs narrative; so does propaganda. The overlap is the ethical danger zone.`, `Demanding story-free politics is fantasy; humans think in arcs.`, `Disclose selection, invite rival tellings, and separate accuracy from narrative justice.`, `Storytelling distorts without lying whenever emphasis does the quiet work that falsehood would do loudly.`],
  a77: [`Jargon packs precision for insiders and builds moats against outsiders. Medicine, law, and software need terms; they also need translations when power touches the uninitiated.`, `A diagnosis name can comfort a clinician and terrify a family without explanation.`, `Gatekeeping via vocabulary preserves status as well as safety.`, `Flattening all specialised language insults craft.`, `Institutionalise interpreters: plain-language summaries, patient advocates, public editors inside technical fields.`, `Jargon protects professions by speeding work and, sometimes, by rationing voice. Only one of those deserves defence.`],
  a78: [`Public apologies fail when they centre the speaker’s feelings, blur agency, or skip repair. They work when they name harm, accept consequence, and change practice under verification.`, `“If anyone was offended” is a museum of non-apology technique.`, `Victims may refuse forgiveness; that refusal does not make a good apology unsuccessful as accountability.`, `Forced apology rituals can become humiliation theatre without justice.`, `Match words to costs: compensation, resignation, redesign—not only press remorse.`, `A public apology works when it reallocates risk away from the harmed—and fails when it only reallocates sympathy to the powerful.`],
  a79: [`Debate formats reward interruption, zingers, and team loyalty. Clarification is slower and loses cameras. Design decides whether argument educates or scores.`, `A town hall with timed rage segments teaches citizens that politics is combat sports.`, `Agonistic clash has value; permanent gladiator mode does not.`, `Consensus rituals can also suppress necessary conflict.`, `Invent formats for inquiry: steelmanning, evidence exchanges, and delayed rebuttal after reading time.`, `Debates clarify when designed for understanding; they merely crown winners when designed for heat.`],
  a80: [`Framing selects what counts as the issue: “security,” “freedom,” “burden,” “investment.” Two accurate descriptions can summon opposite policies by spotlight placement.`, `A tax as “relief” or “giveaway” is the same money in different moral lighting.`, `Frames are not lies; they are competitive emphasises. Literacy means seeing the light source.`, `Claiming to be frameless is usually another frame—the frame of neutrality.`, `Practise frame translation: rewrite the story in a rival vocabulary and notice what appears.`, `Framing decides what we notice by deciding what we are invited to care about first.`],
};

const U4 = {
  a81: [`A river is catchment, sediment, flood memory, and politics upstream. Drawing it as a blue line on a map is useful and misleading—like calling a body only a pulse.`, `Factories, farms, and wetlands converse through water whether stakeholders admit the conversation or not.`, `A levee that “solves” one neighbourhood may write risk onto another.`, `Romantic river talk without hydrology can be as harmful as concrete-only engineering.`, `Govern as a system: upstream rights with downstream duties, and monitoring that crosses borders.`, `Seeing a river as a system is the beginning of not being surprised by what water remembers.`],
  a82: [`Conservation that fences people out can save habitats and destroy livelihoods—or ignore the knowledge that managed the place for generations. Local knowledge is not automatically green virtue; excluding it is still often arrogant.`, `A ranger’s satellite map and a fisher’s season lore can correct each other.`, `“Wilderness” emptied of residents may be a colonial aesthetic with endangered species inside.`, `Romanticising locals can also trap them as museum keepers without rights.`, `Co-manage: share power, data, and benefits; test claims; refuse both fortress and free-for-all.`, `Conservation that ignores local knowledge risks protecting a postcard while losing a living ecology.`],
  a83: [`Waste is a category produced by design and law. What is discarded in one system is feedstock in another. Circularity begins by refusing the naturalness of trash.`, `Planned obsolescence manufactures waste on schedule.`, `Exporting refuse exports harm while importers of “recycling” perform virtue.`, `Not everything should circulate; some toxins need containment, not clever loops.`, `Extended producer responsibility, repair rights, and honest labelling beat guilt campaigns aimed only at households.`, `What counts as waste reveals who may dump costs on the future.`],
  a84: [`Cities are habitats: heat islands, migratory stopovers, soil under pavement, rivers in pipes. Treating them as outside nature licenses neglect of urban ecology and of people who need shade.`, `A street tree is infrastructure, not decoration.`, `Green amenities often track wealth; ecology becomes another inequality.`, `Anti-city environmentalism can ignore that dense living may reduce per-capita harm.`, `Integrate nature into planning without greenwashing displacement.`, `Cities are part of nature the moment we stop using “nature” as a word for elsewhere.`],
  a85: [`Ecosystems can absorb stress until they reorganise suddenly. Thresholds make gradualism dangerous: the last increment looks like all the others until it is not.`, `A reef that bleaches, a lake that flips to algae—nonlinear stories that linear politics dislike.`, `Alarmism without thresholds becomes noise; silence about thresholds becomes negligence.`, `Local thresholds differ; universal panic dates help less than local monitoring.`, `Manage with buffers, early-warning indicators, and humility about surprise.`, `Small thresholds matter because systems do not owe us smooth graphs.`],
  a86: [`Restoration plants trees, rewires wetlands, and sometimes sells absolution. Undoing harm fully is rare; softening trajectories is common and still valuable.`, `A reforested slope may not revive extinct understory relationships.`, `Promising reverse-button ecology sets projects up to be called failures when they are partial goods.`, `Doing nothing while waiting for purity is another harm.`, `Set honest baselines, include communities, and measure functions—not only plant counts.`, `Restoration softens and sometimes heals; it rarely rewinds. Maturity is funding it anyway.`],
  a87: [`Commons fail in textbooks when nobody can exclude and everybody extracts. In life, many commons survive through nested rules, monitoring, and graduated sanctions—Ostrom’s world, not only Hardin’s parable.`, `A shared pasture with rotating rights can outlast a privatised dust bowl.`, `State enclosure and corporate capture also destroy commons in the name of efficiency.`, `Romantic commons talk can hide elite capture inside “community.”`, `Support user-designed rules with legal recognition and conflict resolution.`, `Who owns the commons? Ideally the users under rules they can revise—not a slogan and not a distant landlord.`],
  a88: [`Resilience as bounce-back restores the prior state—including its injustices. Resilience as adaptation may transform what “normal” means. The word hides a fight about goals.`, `After flood, rebuilding the same footprint is recovery and sometimes stubbornness.`, `Transformation talk can excuse abandoning people who need continuity.`, `Define resilience operationally: for whom, to what disturbance, toward which future.`, `Prefer adaptive capacity—learning, diversity, options—over brittle restoration of a fragile status quo.`, `Resilience should mean staying able to respond, not staying unable to change.`],
  a89: [`Food receipts omit carbon, depleted aquifers, underpaid pickers, and antibiotic residue in landscapes. Cheapness is often a relocated cost.`, `Seasonal abundance in aisles coexists with precarious fields.`, `Consumer virtue alone cannot reprice a system built on externalisation.`, `Shaming shoppers while subsidising harmful production is theatre.`, `Align standards, wages, and true-cost accounting without pretending all households can absorb premium prices overnight.`, `Food systems hide costs because visibility would reorder power at the till and the border.`],
  a90: [`Stewardship sounds lofty until it becomes schedules: clearing drains, saving seeds, teaching children not to trash a creek, funding maintenance after ribbon cuttings.`, `Care for places is mostly unfinished business.`, `Heroic one-off cleanups without institutions are confetti.`, `Bureaucracy without love becomes neglect with forms.`, `Pair civic rituals with budgets and rights; make stewardship a job as well as a virtue.`, `In practice, stewardship looks like showing up again after the camera leaves.`],
  a91: [`Craftsmanship insists that how something is made still matters when markets reward only that it exists. Care in making is an ethic of regard for users and materials.`, `A well-joined chair teaches standards the body remembers.`, `Nostalgia can freeze craft as heritage performance while denying living wages.`, `Speed cultures need craft values precisely because error scales.`, `Fund apprenticeships, repair economies, and procurement that pays for durability.`, `Craftsmanship matters as resistance to disposable relations—with objects and with labour.`],
  a92: [`Mastery wants time; markets want throughput. The collision appears in newsrooms, clinics, kitchens, and code sprints. Standards either bend or people do.`, `A chef’s plate rushed for turnover is a small tragedy repeated nightly.`, `Refusing all speed can become preciousness that only elites afford.`, `Protect “slow lanes” for high-stakes quality while automating true drudgery.`, `Clients and publics must learn that some waits are safety.`, `Mastery coexists with market speed only where rules defend the minimum time excellence requires.`],
  a93: [`Deliberate practice is less glamorous than talent myths: isolating weaknesses, seeking feedback, tolerating awkward repetition. It feels like controlled frustration more than flow.`, `A violinist’s slow bow on one passage is the opposite of highlight reels.`, `Without feedback, repetition engraves errors.`, `Romantic suffering is unnecessary; honest difficulty is not.`, `Design practice loops with coaches, peers, and rest—burnout is not a credential.`, `Deliberate practice feels like work because it is—meaningful work that compounds.`],
  a94: [`Talent stories flatter winners and excuse gatekeepers. Training, health, money, and luck vanish behind aura. Ability differences exist; mythology about them does political work.`, `A “natural” is often an early starter with a quiet coach.`, `Denying all talent talk can erase real variation and become its own cruelty.`, `Redistribute access to practice before sorting souls into gifted and not.`, `Celebrate achievement while narrating conditions; change conditions.`, `Talent is partly a story told after success—useful as inspiration, dangerous as destiny.`],
  a95: [`Manuals teach the said; apprenticeships teach the unsayable: timing, feel, judgment under variation. Tacit knowledge moves through shared work and correction.`, `A carpenter’s hand on wood detects what a diagram cannot.`, `Pure immersion without concepts can trap learners in master whims.`, `Combine studio and study; neither priesthood nor PDF suffices alone.`, `Protect time for side-by-side work in professions being “optimised” into solitude.`, `Apprenticeships teach more than manuals because some knowledge only exists in motion between people.`],
  a96: [`Amateurs deepen fields when they bring new questions, data, or care—citizen science, open source, fan scholarship. They dilute fields when confidence outruns method.`, `A meticulous hobbyist’s collection can shame a neglected public archive.`, `Professional hostility sometimes protects standards and sometimes protects rents.`, `Build on-ramps with mentorship and shared norms rather than sneering.`, `Credit amateurs; require evidence; keep the ladder climbable.`, `Amateurs deepen a field when seriousness, not status, becomes the entry ticket.`],
  a97: [`Meaning at work often comes from craft, contribution, recognition, and fair pay—rarely from posters about passion. Purpose-talk without conditions is managerial perfume.`, `A cleaner who sees a building function may have clearer purpose than a branded “change agent.”`, `Not everyone can quit into vocation; meaning must be buildable inside constraints.`, `Refuse both cynicism that nothing matters and propaganda that exploitation is a gift.`, `Design jobs with visible impact, learning, and voice—then pay properly.`, `Work becomes meaningful beyond pay when effort connects to a world one can respect—including one’s own fatigue.`],
  a98: [`Perfectionism polishes and paralyses. High standards produce excellence; unreachable ones produce unfinished work and self-contempt. Craft needs an exit ramp called “done.”`, `A designer tweaking endlessly may be caring or hiding from judgment.`, `Cultures that only reward flawless first tries breed secret mediocrity.`, `Define good-enough gates; iterate in public; separate care from fear.`, `Teachers should model beautiful incomplete drafts.`, `Perfectionism helps until it hollows craft into endless prelude.`],
  a99: [`Tools reshape attention: a chisel teaches edges; a spreadsheet teaches rows; a camera teaches framing. Makers become slightly different animals than before the tool.`, `Software that rewards speed trains impatience as character.`, `Choosing tools is choosing future habits of mind.`, `Refusing new tools can be integrity or fear; adopting all tools can be submission to vendors.`, `Practise tool sobriety: what perception does this instrument enlarge or erase?`, `Tools reshape the maker because skill is embodied negotiation with an object that pushes back.`],
  a100: [`When a work is finished, residue remains: skill in the hands, standards in a community, a object in the world, a silence where striving was. Meaning may shift from making to stewardship or teaching.`, `Careers end; practices transmit or evaporate.`, `Clinging to endless projects can be fear of the quiet after mastery.`, `Ending well includes documenting, crediting, and leaving tools for others.`, `Accept that some meaning is only visible in retrospect—and some never becomes monument.`, `What remains when the work is finished is the shape it gave to a life and to those who continue—often quieter than applause, and sturdier.`],
};

function arrToSeed(meta, arr) {
  return {
    open: arr[0],
    turn: arr[1],
    scene: arr[2],
    counter: arr[3],
    reply: arr[4],
    close: arr[5],
    vocab: vocabFor(meta),
  };
}

const metaById = Object.fromEntries(
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../generated/_advanced-meta.json'), 'utf8'),
  ).map((m) => [m.id, m]),
);

const SEEDS = { ...UNIQUE };
for (const [id, arr] of Object.entries({ ...U2, ...U3, ...U4 })) {
  SEEDS[id] = arrToSeed(metaById[id], arr);
}
for (const [id, u] of Object.entries(UNIQUE)) {
  SEEDS[id] = fillFromMeta(metaById[id], u);
}

// a11-a20 imported separately — this file only writes a21+
const outPath = path.join(__dirname, 'seeds-a21-a100.mjs');
const body = `/** Auto-authored unique seeds a21–a100 */\nexport const SEEDS_B = ${JSON.stringify(SEEDS, null, 2)};\n`;
fs.writeFileSync(outPath, body);
console.log('wrote', outPath, 'keys', Object.keys(SEEDS).length);
