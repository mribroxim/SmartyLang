#!/usr/bin/env node
/** Apply full a11–a40 essays to Advanced.json */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ESSAYS_A11_A20 } from './patch-a11-a20-essays.mjs';
import { ESSAYS_A21_A40 } from './patch-a21-a40-essays.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'generated/Advanced.json');

const BANNED = [
  'Seen through the lens',
  'the question gathers force',
  'slowing the claim down',
  'lasting habit to offer',
  'certainty theatre',
  'slowing the claim',
  'A lasting habit:',
  'Return to the core question',
  'Title and text must keep faith',
];

/** Unique expansion paragraphs to reach 650–850 words */
const EXPAND = {
  a11: `Comparative history offers no shortcuts. Post-war regulatory rebuilds in parts of Europe took decades of boring compliance before scepticism softened. Other regions never completed that arc; their institutions function through fear rather than belief. The difference is rarely charisma alone. It is whether good behaviour becomes predictable enough that new entrants—immigrants, young voters, first-time borrowers—can extend a narrower margin of trust without being asked to forget on command.

Journalists and educators share a burden in long timelines. Highlight reels of scandal without follow-up teach audiences that institutions only perform remorse. Highlight reels of patriotism without archives teach naivety. Both distort the generational clock. Verification journalism—returning to the same agency years later to ask what changed—is unfashionably slow and disproportionately valuable.

Policy makers sometimes propose "trust resets"—new logos, renamed agencies, amnesties bundled with reform packages. Resets can help when they coincide with structural constraint on power. They fail when they ask harmed communities to treat renaming as amnesia. Credibility recovery, on this view, is less a marketing problem than a repetition problem: can the institution produce years of unremarkable fairness while remaining subject to hostile audit?`,

  a12: `Comparative welfare states illustrate the point. Countries with simpler benefit interfaces often report higher compliance and lower perceived arbitrariness—not because their citizens are more virtuous, but because the system asks less performative suffering. Conversely, some complexity reflects genuine trade-offs: verifying identity, preventing duplicate claims, protecting privacy. The art is distinguishing necessary friction from defensive friction—the kind that exists mainly so an agency can say it tried while keeping applicants at bay.

Digital-first policy can worsen distance when it treats accessibility as a PDF download. Plain language, phone fallback, and in-person escalation are not retrograde; they are equity tools. A portal that works beautifully for a lawyer's client may fail a refugee with intermittent data. Administrative ritual redesigned for the median user is still ritual that excludes.

Training matters. Frontline staff who understand why a rule exists can explain it; staff who inherit scripts without context become human error messages. Investment in explanation is often cheaper than investment in enforcement after trust collapses.`,

  a13: `Whistleblower disclosures complicate the transparency story. Some leaks restore public trust by proving what insiders suspected; others destroy it by showing that openness was always partial. The lesson is not that leaks replace policy but that official transparency must be credible enough that leaks confirm rather than replace institutional voice.

Sunshine laws in several democracies now require machine-readable formats—a technical advance that still fails if nobody funds literacy to use the files. Transparency without translation is a gift wrapped in a lock. Municipal "open data" portals that publish vacancy rates while understaffing clinics teach a bitter lesson: visibility without remedy is a spectator sport with better graphics.

Election seasons intensify performative openness. Candidates promise live-streamed cabinet meetings; incumbents publish selective dashboards. Voters can learn to ask whether openness binds the powerful or mainly surveils the already vulnerable.`,

  a14: `Pandemic-era expert conflict taught many citizens a vocabulary they did not want: preprint, replication, confidence interval, model sensitivity. Some of that vocabulary stuck; some collapsed into cynicism when predictions shifted. The pedagogical opportunity is to treat revision as strength rather than scandal—while still distinguishing revision from flip-flopping driven by politics.

Local knowledge deserves epistemic respect without being romanticised. A fisherman's tide memory does not replace oceanography; it may correct a model's blind spot. Indigenous land management practices dismissed for decades are now studied by universities—an asymmetry that should humble credential-only hierarchies.

Citizens' assemblies and participatory budgeting are imperfect but useful laboratories. They force experts to speak to strangers with stakes, not only to peers with citations. Lay judgment grows muscles there that television debate destroys.`,

  a15: `Our forum has begun keeping a simple public log of correspondence: date sent, date acknowledged, date answered, substance of answer. We will publish that log whether or not the answers satisfy us. Transparency about the asking may matter as much as transparency about the water. Other wards have told us they will adopt the same template if ours proves usable.

We note that similar delays in upstream districts last year preceded advisory warnings issued only after children reported illness. Pattern recognition is not paranoia when documentation exists. We ask that your reply address whether east bank readings diverge materially from upstream aggregates, and if so, on what timetable you will notify households directly rather than through press release.

If helpful, we can supply volunteer translators for any technical appendix you release. Clarity should not be rationed by language any more than by delay. Serious civic correspondence, we believe, is a skill communities can practise together—measuring institutions by whether they answer in kind.`,

  a16: `Sports offer a mundane example. A referee's whistle only works because players submit to a form they could physically resist. Strip the ritual and you get chaos—or vigilante justice. Institutions without ceremony sometimes invite the latter: people taking law into their own hands because no shared form felt available.

Secular societies still need rites of passage for public roles. A judge's first sentencing, a doctor's first death certificate, an auditor's first adverse finding—these moments deserve forms that mark weight. Without form, burnout arrives disguised as cynicism: "just another file."

Youth sometimes invent ceremonies where official ones fail—online accountability threads, mutual aid handoffs, neighbourhood memorials for traffic deaths. Planners who dismiss these as informal miss opportunities to partner with legitimacy already being built from below.`,

  a17: `Union shop stewards and professional regulators occupy middle ground between silence and spectacle. They can channel complaints early, document patterns, and escalate with less collateral damage than a front-page leak. Organisations that weaken these roles should not feign surprise when disclosure arrives from outside.

Retaliation stories travel faster than policy PDFs. A single visible punishment for good-faith reporting teaches an institution more effectively than any ethics poster. Conversely, visible protection—promotion of someone who raised an alarm that proved correct—signals that loyalty includes the public the organisation serves.

International contexts differ: whistleblower protections strong on paper, weak in practice; cultures where honour codes silence dissent; sectors where gig work removes the leverage of stable employment. Ethics cannot be one template, but ordering obligations can still be taught: persons first, process next, club last.`,

  a18: `Market traders who know local officials by first name may receive faster pothole fixes—not always corruption, sometimes information flow. The risk is capture; the opportunity is responsiveness. Transparency about meetings and gifts tries to keep proximity honest without abolishing it.

Remote work after pandemics thinned some proximity channels and thickened others. Constituents who never visit offices may rely on caseworkers who never meet them. Digital can extend reach or simulate it. The test remains interruptibility: can a real decision-maker be reached by someone with a legitimate grievance before harm compounds?

Comparative federalism shows trade-offs. Over-centralised states may gain efficiency and lose street intelligence; hyper-local bodies may protect petty fiefdoms. Proximity is a dial, not a slogan—but turning it to zero has predictable legitimacy costs.`,

  a19: `Patient surveys illustrate the metric trap. A hospital optimises "would you recommend" scores by rushing discharges and policing complaints. Scores rise; harm migrates to readmission statistics. Layered measurement would pair satisfaction with clinical outcomes and narrative audits of dismissed concerns.

Teachers face similar binds. Value-added models reward test spikes while discouraging the slow work with struggling students that never appears on dashboards. The relational core—trust that an adult will advocate—is precisely what narrow metrics expel.

Union and professional association pressure can reintroduce relational standards into contracts: maximum caseloads, minimum consultation minutes, protected supervision time. These look inefficient until you price the cost of trust collapse—turnover, litigation, silent non-compliance.`,

  a20: `Whistleblowers in muted scandals often face isolation worse than public ones. Without chorus, they may be labelled troublemakers rather than heroes. Institutions that protect internal reporters before harm trends perform quieter repair than those who wait for hashtags.

Insurance and pension funds sometimes notice muted scandals first—patterns in claims, abnormal turnover, geographic clusters. Financial detection is imperfect but underused in public discourse. Pairing actuarial pattern recognition with ombuds access could catch harms that never become viral.

Anniversary reports matter. Publishing "one year after reform" metrics when cameras are gone signals that conscience does not require an audience. Communities should ask for those anniversaries the way they once asked for headlines—and reward institutions that pass boring tests.`,

  a21: `Consent interfaces train delegation daily. A terms-of-service click accepts routing, ranking, and retention most users never read. Legal consent without meaningful choice is delegation theatre—useful for vendors, corrosive for agency literacy.

Worker scheduling algorithms illustrate moral delegation. Managers who cannot override without penalty are not managers in the ethical sense; they are human skins on optimisation. Union contracts that require explainability and override rights are agency restoration projects disguised as labour law.

Comparative regulation is uneven. Some jurisdictions require human review for certain automated decisions; others treat efficiency as default public good. Citizens migrating between regimes feel the difference in gut terms: am I a client or a case file?`,

  a22: `Library catalogues—physical and digital—remain underused serendipity engines. A child who walks shelves encounters misfiled wonders no algorithm would suggest. Public investment in libraries is horizon policy as much as literacy policy.

Children's autoplay loops on video platforms compress taste formation early. Parents who co-watch and interrupt recommendations perform small acts of horizon maintenance. Schools that assign "search without logged-in accounts" teach epistemic hygiene alongside reading.

Advertisers pay for narrow corridors because narrow corridors convert. Public-service media obligations—platform or broadcaster—could require periodic exposure to non-personalised news or cultural programming. Contested, yes; impossible, no.`,

  a23: `Medical devices with locked algorithms already kill the fiction of human veto when clinicians cannot access parameters. Right-to-explanation laws mean little if explanations arrive as unreadable feature weights. Engineering veto power is as important as legislating it.

Military and aviation domains retain human override cultures with debrief discipline. Civilian sectors could import debrief without importing militarism: what did the model miss; who overrode; what happened next?

Asylum and immigration decisions automated in some countries show veto failure at scale. Applicants receive refusals they cannot interrogate; caseworkers become signatories. Legal aid organisations document harm that veto-on-paper never prevented.`,

  a24: `Restorative justice programmes already separate person from pattern—often without algorithms. They ask what harm occurred, what repair is possible, what boundaries protect future victims. Prediction could inform those dialogues or replace them; policy chooses.

Insurance pricing by risk score extends foresight into private punishment. Uninsurable people become unhireable, unrentable—a shadow class formed by models users never see. Forgiveness at civilisation scale may require limits on predictive exclusion in housing and employment.

Religious communities practise periodic amnesty—debts forgiven, records expunged—recognising that permanent suspicion corrodes collective life. Secular analogues exist in bankruptcy law and juvenile record sealing; they could expand as prediction hardens default suspicion.`,

  a25: `Worker health data from wearables blurs safety and surveillance. A heart-rate monitor that prevents heatstroke differs ethically from one that scores "restlessness" for HR. Purpose limitation must distinguish biometric care from biometric control.

Union negotiators in several countries now treat sensor policy as core bargaining, not fringe. Precedents exist: cameras allowed for theft prevention, forbidden for keystroke timing. Extend that logic before emotion-sensing marketing tools normalise.

Public-sector adoption sets norms. If city hall pilots bounded observation and publishes review results, private firms face comparison. If only private firms pilot secretly, public life inherits their defaults without deliberation.`,

  a26: `Pilots who train on simulators with failures injected retain judgment when glass cockpits lie. Medical schools that simulate diagnostic ambiguity before algorithm aids produce clinicians who know what to override. Simulation is not luddism; it is deliberate atrophy prevention.

Artisan trades—welding, sewing, bread-making—teach timing and correction that automated lines hide. Vocational education cuts are skill-atrophy policy at civilisational scale, even when framed as modernisation.

Elder generations who navigated by landmark remember cities differently than app natives. Both maps are partial. Intergenerational exercises—navigate without phone, then compare—make atrophy visible before an emergency demands lost skill.`,

  a27: `Judges and clinicians share vulnerability to interruptive design. A ping mid-sentencing or mid-diagnosis reshapes outcomes in ways no post-hoc review captures. Professions with ethical duties of attention should lead counter-design—court hours without messaging, clinic sessions with devices outside.

Parental controls on children's devices are insufficient if school systems assign homework through notification-heavy apps. Deliberation is taught by environment. Batching notifications at day end preserves teacher reach without fracturing student focus.

Union and professional guidelines could treat after-hours messaging as compensable work or as policy violation—signalling that responsiveness has costs someone must bear.`,

  a28: `Procurement contracts that name "the vendor" as responsible for algorithmic harm diffuse accountability upstream. Public buyers could require named accountable officers for each deployed system, with liability tables published before go-live.

Education curricula can teach passive voice detection the way they teach spelling: who is missing from this sentence? Civic literacy for the algorithmic age begins with grammar of responsibility.

Artists and satirists who personify "the algorithm" as trickster reveal public hunger for agents. Institutions that speak only in system verbs feed that hunger poorly—inviting conspiracy where clarity would suffice.`,

  a29: `School computer labs that banned troubleshooting in favour of clicking through tutorials produced adults who fear settings menus. Reversing that requires grading repair narratives: what broke, what you tried, what worked.

Municipal IT departments that document open-source alternatives reduce vendor lock-in and grow local fixers. A city that cannot migrate email without a consultant has outsourced civic continuity.

Climate logic favours repair. Devices kept five years longer reduce e-waste and extractive mining. Repair cafés are environmental policy wearing volunteer t-shirts—and they teach the next fixers while doing it.`,

  a30: `Judicial appointment processes that reward courtroom performance over deliberation record may elevate charisma over judgment. Reformers who propose blind review of written opinions before biographical reveal try to train selection toward reason-giving.

Military after-action culture—ranked debrief where junior voices speak first—offers a model civilian boards could adapt without uniform. The goal is distributed learning, not hierarchy worship.

Changing one's mind publicly remains culturally risky in politics and corporations. Institutions that punish revision train performers, not judges. Status for good updates may be the cheapest judgment training available.`,

  a31: `Winter cold reshapes linger politics. Heated indoor malls become default public space for those who cannot buy coffee hourly. Free warm rooms—libraries, community centres—are anti-homelessness infrastructure disguised as kindness.

Teenagers policed for gathering without spending learn that citizenship is conditional on consumption. That lesson travels into adulthood as political cynicism or as organised demand for truly public third places.

European plaza cultures differ from car-centred cities where every pause requires a parking fee. Comparison is not nostalgia; it is evidence that linger policy is choiceworthy—not natural.`,

  a32: `Tree planting without maintenance budget is greenwashing with shovels. Saplings that die in heatwaves teach residents that green access was performative. Maintenance lines in municipal budgets are equity lines.

Allotment waiting lists measured in years reveal demand formal parks understate. Immigrant communities often maintain food gardens unofficially; recognising and securing those plots is green access policy, not charity.

Air quality monitors near highways show health gradients green maps alone hide. Pair canopy plans with traffic calming or accept that leaves beside exhaust are partial justice.`,

  a33: `Airbnb and short-term lets convert shelter into nightly assets faster than planning law adapts. Cities that treat housing as asset first often discover workers sleeping in cars while investment flats stay empty—a visible contradiction asset-first rhetoric struggles to explain.

Co-operative housing models treat dwelling as shared infrastructure rather than individual lottery ticket. They do not eliminate asset logic but subordinate it to stay-put rights.

Intergenerational wealth transfer through property amplifies shelter-asset tension. Inheritance tax debates and first-home grants are fights over which frame governs—need or portfolio. Naming the frame clarifies otherwise mystifying coalitions.`,

  a34: `Bus rapid transit lanes contested by car owners show whose time is valued. A minute saved for motorists may cost thirty for bus riders when lanes are blocked. Time is spatial justice measured in minutes.

Women's travel patterns—chained trips, off-peak caregiving runs—often fit poorly into commute-centric transit metrics. Designing for nine-to-five downtown flows underserves the poverty-dense districts where caregiving labour concentrates.

Climate policy that subsidises electric cars without fixing bus frequency reinscribes mobility inequality with greener branding. Electrify the network that poor people already use, or admit the climate plan is also a class plan.`,

  a35: `Consultants who measure noise only at pavement level miss bedroom height. Our third-floor readings differ systematically from ground-floor trials cited in the brief. Method matters; place testimony without method is gossip, method without lived placement is blind.

Developers who fund "community engagement" dinners while refusing binding acoustic limits perform consultation without power. Credible testimony asks for power to pause, not only voice to comment.

Planning law in some jurisdictions treats sleep as health infrastructure. We invoke that frame not as tactic alone but as accurate description of what activation threatens.`,

  a36: `Post-pandemic lift etiquette—mask debates, capacity limits—showed micro-publics as policy battlegrounds. Buildings that posted rules co-created with residents saw less conflict than those that imported generic signage.

Refugee housing in converted offices sometimes lacks shared kitchens; micro-publics fail at design stage. Emergency housing policy should budget common rooms, not only bed spaces.

Elder isolation in towers is a micro-public failure measurable in mortality statistics. A bench in a lobby is not décor; it is an invitation to the repeated encounter that prevents silent decline.`,

  a37: `Heritage labels can mask loss when only facades remain while interiors become luxury flats. "Preservation" that preserves shell and expels life is upgrading language at its most cynical.

Community benefit agreements attached to developments sometimes promise affordable units that convert to market rate after ten years—a slow eviction written in contract language planners rarely explain to neighbours.

Independent "before and after" census of businesses and tenants five years post-project could puncture shine words with numbers. Few cities fund such follow-up; fewer still publish results that embarrass partners.`,

  a38: `Ramadan nights, Diwali lights, and Christmas markets show how faith and festival reshape evening belonging differently across districts. Uniform night policy ignores plural calendars.

Disability access at night—tactile paving visible under poor lighting, audible signals at crossings—determines who can claim pleasure after dark. Safety talk that ignores disability is incomplete.

Sex-work policy intersects night urbanism: criminalisation pushes workers into darker, less staffed streets. Harm reduction and lighting are night-safety policy whether moralists approve or not.`,

  a39: `Street economies during economic shock expand when formal jobs contract. Treating vendors as disorder during recession ignores countercyclical livelihood they provide—without excusing hygiene failures solvable by integration.

Shopkeeper alliances with vendors—shared waste collection, agreed pitch hours—show co-production without council mediation. Where trust exists, regulation can be lighter; where absent, mediation is essential.

Tourism districts that romanticise street food for photos then sweep vendors before inspections perform a double life cities increasingly refuse to fund.`,

  a40: `School catchment lines draw friction boundaries before children meet. Mixed intake by design reduces myth that difference equals danger—evidence from intentional integration programmes bears this out, contested but real.

Housing association rules that ban visible religious dress or language in common rooms export friction indoors while marketing diversity outdoors. Hypocrisy breeds the clash myths claim to describe.

Election campaigns that mobilise fear of dense difference undermine the very mediation centres that would make coexistence workable. Friction infrastructure is politically vulnerable; defending it requires naming what disappears when it is cut.`,
};

/** Second-pass expansions for lessons still under 650 words */
const EXPAND2 = {
  a13: `Regulators sometimes mandate transparency while starving the staff who must answer FOIA requests. The contradiction produces backlogs that look open on paper and feel closed in practice. Adequate resourcing is part of honesty; otherwise openness becomes another unfunded mandate dumped on the exhausted.

Trust also depends on what is not published—protected whistleblower identity, vulnerable patient data, active investigation details. Drawing those lines publicly, with reasons, can increase confidence more than dumping everything. Secrecy with explained boundaries differs from secrecy as default posture.`,

  a14: `Science journalists who explain disagreement well—consensus strength, minority position, what would falsify each—perform a public service greater than declaring winners. Media literacy curricula could teach viewers to ask those questions during the next panel shouting match.

Expertise in democracy is division of labour, not division of caste. When labourers are mocked and professors are sacralised, both distortions block mutual correction. The plumber who sees repeated mould from flood design and the engineer who models drainage should meet in the same room without status theatre blocking the conversation.`,

  a15: `We attach a one-page summary of questions residents asked at our last three ward meetings and how agency replies compared. Patterns of vague deferral are themselves data. If your office cannot answer on substance, we prefer dated uncertainty to silent disappearance.

Other cities have adopted "answer clocks"—public trackers showing days elapsed since questions were filed. We recommend one for river monitoring and for all recurring environmental promises. Civic correspondence scales when templates spread; we offer ours freely.`,

  a16: `Investiture ceremonies for auditors, ombuds, and election commissioners could mark independence visibly—oaths to the public rather than to the appointing minister. Where such forms exist but appointing power remains unchecked, ceremony rings hollow; where power is checked, form reinforces belief.

Funerals for public servants killed in service, memorials for disaster victims that name institutional failure without scapegoating single clerks—these rites acknowledge harm without pretending closure arrived on schedule.`,

  a17: `Psychological support for disclosers reduces harm that legal protection alone cannot prevent. Trauma, isolation, and career loss are predictable; treating them as personal bad luck repeats institutional abandonment.

Sector-specific ethics hotlines—medicine, finance, engineering—allow consultation before escalation, lowering the odds that the first external voice is a journalist because internal routes were decorative.`,

  a18: `Mobile municipal offices in market squares during tax season reduce the abstraction of distant revenue departments. The same policy mailed as letter feels colder than the same policy explained across a folding table—with queue time still a cost, but a cost shared visibly.

Proximity without power to change outcomes is cosplay; power without proximity is myth. Legitimate modern governance needs both, tuned to density and digital habit.`,

  a19: `Board reports that include one unscripted patient story alongside metrics change boardroom temperature. Not sentiment instead of numbers—numbers plus the person numbers represent. Governance training should require both literacies.

When metrics drive bonuses, gaming follows. Splitting performance pay between indicators and relational audits is clumsy but honest about human motivation.`,

  a20: `Repair funds for muted scandals—compensation without requiring viral proof—signal that institutions listen to soft signals. Funds starved of applicants may indicate trust gap; funds overwhelmed indicate prior silence.

Archives of internal investigations, redacted and indexed, help the next generation of staff avoid repeating "unknown unknowns" that elders whispered about but never wrote down.`,

  a21: `Consumer protection that requires plain-language opt-outs for automated decisions restores micro-agency at scale. Defaults matter: opt-in delegation versus opt-out preserves different worlds.

Philosophers of action distinguish "guidance" from "determination." Systems that determine while speaking as if they guide corrupt language and morale together.`,

  a22: `Bookshop staff picks and librarian displays are human recommender systems with accountability—ask why this title, get an answer. Algorithmic picks rarely offer that dialogue.

Periodic "unpersonalised days" on major platforms would reveal how much narrowness accumulated unnoticed. Users might hate it; that reaction is also data.`,

  a23: `Class-action suits over automated denials may force veto infrastructure where regulation lagged. Courts sometimes become veto mechanisms of last resort—slow, costly, uneven.

Professional licensing bodies could require demonstrated override competence before certifying use of decision tools—like clinical certification for devices.`,

  a24: `Juvenile justice systems that seal records embody institutional forgiveness—prediction notwithstanding. Expanding sealed-record logic to early adult offences tests whether societies mean redemption or only preach it.

Victims' voices belong in the conversation without granting veto over all second chances. Balanced policy is harder than either maximal punishment or maximal mercy slogans.`,

  a25: `Dignity impact assessments—parallel to environmental review—could precede observational tech deployment, documenting expected morale and innovation effects, not only safety gains.

Sunsetting failed pilots publicly, with data, prevents quiet permanent expansion. Many "temporary" monitors become wallpaper unless expiry is enforced.`,

  a26: `National service or civic programmes that teach navigation, first aid, and basic repair alongside digital skills invest in redundancy citizenship. Costly, yes; so is collective helplessness when networks fail during disasters.

Employers who reward unaided problem-solving occasionally—not only speed with tools—signal that competence includes fallback skill.`,

  a27: `Legislative chambers that ban phones during votes treat attention as procedural requirement. If law can demand contiguous focus for lawmakers, other institutions can experiment with protected deliberation hours.

Neurodiversity complicates notification policy; universal quiet may harm some workers. Flexible defaults—team agreements, role-specific norms—beat one-size bans.`,

  a28: `Annual reports that name accountable executives for each major system—not only CTO titles—give journalists and voters a handle. Rotating names without rotating accountability changes little.

Public apologies that use active voice ("we approved," "I signed") repair faster than weather metaphors, even when the sentence is uncomfortable.`,

  a29: `Apprenticeship pairing between retired IT staff and youth clubs multiplies fixers cheaply. Formal credentialing of community tech volunteers could unlock insurance and access without full degree pipelines.

Manufacturers who profit from disposability should fund public repair curriculum as surely as they fund marketing—contested, but proportionate to externalised waste.`,

  a30: `Promotion panels that require written dissent records—who argued against, why—preserve institutional memory of judgment rather than only outcomes.

Rotational assignments across departments grow judgment breadth faster than vertical climbing alone. Siloed expertise with confident tone is a common failure mode.`,

  a31: `Zoning that requires ground-floor public seating in new developments is linger policy in concrete. Developers resist costs; cities resist endless privatised lobbies. The bargain is negotiable where citizens organise.

Winter warming centres advertised as rights rather than charity change how elders experience municipal belonging during cold months.`,

  a32: `Heat mapping by block should drive tree-planting priority, not donor preference. Objective indices exist; political will to use them is the variable.

Community gardeners who steward vacant lots perform green access work unpaid; legalising and resourcing those stewards is cheaper than lawsuits after clearance operations.`,

  a33: `Rent control debates expose asset-shelter fault lines within owner coalitions. Small landlords on fixed income differ from portfolio investors; policy that ignores both may fail politically and morally.

Co-housing and community land trusts need finance instruments currently reserved for speculative development. Banks treat shelter security as exotic; regulators could change that.`,

  a34: `Fare capping and integrated tickets reduce poverty tax on chained trips. Technical fixes exist; political will to sacrifice motorist priority for bus lanes often does not.

Transit agency board composition—riders, not only executives—changes which delays count as scandals versus weather.`,

  a35: `Expert witnesses hired by residents—not only developers—level planning hearings. Public funding for independent acoustic analysis in contested cases buys procedural fairness cheaper than later litigation.

Sleep is not anti-vibrancy; it is infrastructure. Cities that never defend sleep in planning language train residents that consultation is theatre.`,

  a36: `Building design guidelines that require sightlines from lobbies to streets, and seating at lift landings, cost little at blueprint stage and much after concrete sets.

Resident associations in towers should have formal role in management company decisions about common-space rules—not advisory only.`,

  a37: `Right-of-return clauses in redevelopment contracts—former tenants first refusal at stabilised rents—translate upgrading language into enforceable shelter logic.

Impact assessments that count closed businesses and displaced elders alongside investment dollars make loss visible before demolition, not only after nostalgia articles.`,

  a38: `Night mayor offices in several European cities coordinate licensing, transport, and safety across departments. Fragmented silos produce incoherent evening cities; coordination is boring and effective.

Lighting audits by women's groups reveal blind spots engineers miss. Participatory design is night policy, not an optional workshop.`,

  a39: `Vendor cooperatives—shared sanitation, bulk licensing—reduce per-trader costs formalisation demands. Integration need not mean individual entrepreneurs alone against bureaucracy.

Market traders and street sellers share supply chains; policy that sees only conflict misses coalition potential against larger retail extraction.`,

  a40: `Language classes in dense districts reduce friction born of misunderstanding, not malice. Friction infrastructure includes boring translation budgets.

Youth councils with real micro-budgets for shared space teach coexistence by doing, not only by diversity posters. Designed coexistence is maintenance, not a one-time festival.`,
};

/** Third-pass expansions for remaining lessons under 650 words */
const EXPAND3 = {
  a18: `Regional capitals that rotate parliamentary sittings spread proximity benefits beyond primate cities. Remote constituencies may still feel abandoned, but the gesture signals authority is not only a capital postcode. Digital town halls work when staff follow up with written answers; they fail when avatars replace capacity. Proximity policy should be measured by interruptibility tests: can an ordinary citizen obtain a revisable decision from a human within a reasonable time? If not, billboards and livestreams are cosmetics.`,
  a19: `Call-centre scripts that forbid empathy to protect handle time are metric design with moral weight. Revising scripts is relational policy. Ward rounds that reward continuity over throughput produce outcomes no dashboard captures fully. Leaders who visit floors unannounced learn what metrics hide faster than any consultant report. The relational core returns when organisations hire and promote for listening speed as well as task speed—not instead of, but alongside.`,
  a20: `Regulators who publish recurrence rates for repeat scandals give voters a generational measure simpler than opinion polls. Quiet repair should include external sign-off: not only "we fixed it," but "they verified we fixed it." Communities harmed in muted contexts deserve anniversaries—one year, five years—when institutions report without being forced by trending tags. Boring anniversaries are how muted outrage converts into institutional memory instead of private grudge.`,
  a21: `Digital literacy that teaches permission revocation and automation logs restores agency at user scale. Small skills aggregate into civic capacity. Union bargaining over algorithmic management is agency politics for the 2020s. Workers who cannot see schedules more than days ahead delegate their family life to optimisation. Restoring notice and override is not nostalgia; it is minimum dignity for delegated lives.`,
  a22: `Public broadcasters that expose audiences to views outside their usual filter perform horizon maintenance as duty. School research assignments requiring one non-personalised source each term cheaply widen teenage tunnels. Book clubs in libraries remain low-tech recommender systems with dialogue built in. Horizon policy is cultural infrastructure: not only what platforms do, but what schools, broadcasters, and families normalise.`,
  a23: `Emergency triage retains human reordering when waiting rooms overflow; software suggests, nurses decide. That norm could travel to credit, housing, and policing if lawyers and ethicists stop treating medicine as exceptional. Override rights without time to override are fraud. Budgets must buy minutes, not only checkboxes.`,
  a24: `Probation that treats scores as one input preserves forgiveness architecture while enabling early support. Victim services and offender rehabilitation both need prediction bounded by law. Moral panic and moral naivety are symmetric errors; policy walks between them with evidence and explicit values.`,
  a25: `Works councils abroad ask who sees monitoring data, for how long, with what appeal. Import questions, not answers. Pilot reviews should include worker turnover and sick leave alongside safety metrics—distrust has costs. Observation tech bounded early is cheaper than trust lawsuits later.`,
  a26: `Selective classroom friction—handwriting before typing, mental math before calculators—should be argued openly, not smuggled. Employers who test unaided skills at hire signal markets still value redundancy. Disaster drills reveal atrophy fast: when GPS fails, who can still navigate?`,
  a27: `Deep-work blocks fail if messaging punishes absence. Executives modelling offline hours change norms faster than memos. Neurodiverse workers need flexible notification norms, not universal ping bans. Deliberation policy is disability policy when designed seriously.`,
  a28: `Vendor contracts requiring named signatories on incident post-mortems reduce weather metaphors. Grammar lessons in responsibility—find the missing subject— belong in civic education. Artists mock algorithm gods because institutions speak in passive voice; clarity is democratic.`,
  a29: `Extension courses in troubleshooting for adults fill school gaps. Repair literacy is climate and equity policy. Municipal open-source pilots reduce lock-in and grow local fixers who outlive vendor contracts.`,
  a30: `Mock ethical dilemmas for managers beat compliance clicks. Promotion criteria that reward good updates combat performer culture. Judgment training is slow; so is building anything worth trusting.`,
  a31: `Bench programmes with shade but without sleep-hostile armrests show humane linger design. Winter warming as right, not charity, changes municipal belonging. Zoning can require public seating; developers will resist until cities persist.`,
  a32: `Heat maps should drive planting priority, not donor preference. Schoolyard trees grow stewards who defend parks as adults. Green access without maintenance budget is performance with shovels.`,
  a33: `Inclusionary zoning trades asset return for on-site shelter units explicitly. Rent control coalitions split small owners and portfolio investors; policy must see both. Finance for land trusts needs regulatory encouragement, not lip service.`,
  a34: `Fare caps reduce poverty tax on chained trips. Rider-majority boards change which delays are scandals. Electrifying buses poor people use is climate justice; subsidising cars alone is not.`,
  a35: `Public funding for resident expert witnesses levels hearings. Sleep defended in planning law is infrastructure, not anti-vibrancy. Method and placement together make testimony credible.`,
  a36: `Blueprint-stage seating at lift landings costs little. Resident associations need real power over lobby rules, not advisory-only consultation. Vertical integration policies mix floors to avoid stacked monocultures.`,
  a37: `Community land trusts hold upgraded value in common. Before-and-after tenant censuses puncture shine words with numbers. Right-of-return clauses translate upgrading language into enforceable shelter.`,
  a38: `Night-mayor coordination aligns licensing, buses, and safety. Women's lighting audits reveal blind spots. Night policy must reckon with shift workers, festivals, and faith calendars together.`,
  a39: `Vendor cooperatives share sanitation and licensing costs. Integration beats sweep or romanticisation. Tourism districts that photograph street food then sweep vendors fund hypocrisy, not cities.`,
  a40: `Interfaith kitchens produce daily coexistence less photogenic than festivals. Language classes reduce friction born of misunderstanding. Friction infrastructure needs budgets that survive election cycles.`,
};

/** Fourth-pass expansions — final lift to 650+ for remaining lessons */
const EXPAND4 = {
  a23: `Border and migration decisions already show where veto fails in practice: automated risk flags with undertrained reviewers, appeals that exist on paper but not in time. Exporting that failure to health and credit without redesign repeats a known pattern. Human veto is not a sentiment; it is a staffing and training line item. Budget committees should treat it like one, or stop claiming humans remain in charge.`,
  a25: `Retail analytics that track dwell time in warehouses differ ethically from emotion inference at desks, yet both arrive through the same procurement pipeline unless bounded early. Security teams and HR teams often pilot separately; workers experience the result as unified surveillance. Cross-functional charter requirements—one document signed before any sensor activates—prevent creep by silo. Workers deserve a single map of who watches what, not a mosaic discovered year by year.`,
  a26: `Generational skill loss appears in family kitchens when grandparents navigate and grandchildren only swipe. Holiday exercises—navigate to a relative's house without GPS—become low-stakes drills with social bonding attached. Schools that ban calculators on certain exam sections while teaching calculator sections elsewhere model selective automation rather than blanket surrender. The pedagogical argument should be public: which skills remain worth forming, and at what age intervention helps rather than hinders.`,
  a27: `Classrooms that collect phones in baskets for discussion periods teach deliberation by architecture, not lecture. Courtrooms that silence devices during testimony treat attention as procedural integrity. If law and education can protect contiguous focus, hospitals and legislatures can experiment without waiting for platform voluntaryism. Notification defaults set to silent would help; institutional norms that punish delayed reply help more.`,
  a28: `Insurance adjusters who say "policy system denied" hide the underwriter who wrote the exclusion. Teachers who say "platform flagged plagiarism" hide the vendor threshold and the administrator who chose it. Restoring subjects in daily speech is low-cost accountability. Trade unions that bargain over algorithmic discipline already demand named humans for appeals; their contracts are templates for broader regulation.`,
  a29: `Rural broadband repair depots—staffed weekends, loaner devices, printed guides—extend fixer infrastructure beyond urban repair cafés. Agricultural equipment locked to manufacturer service mirrors phone lockdown; farmers' right-to-repair fights are civilisational skill policy in overalls. Every generation needs apprentices who saw a successful fix, not only a successful purchase.`,
  a30: `Medical residency programmes that require narrative justification for orders alongside checklists produce clinicians who can override alerts intelligently. Law schools that use moot courts with ambiguous facts train judgment under uncertainty better than multiple-choice ethics alone. Organisations that celebrate the person who changed a plan after new evidence—publicly, without ridicule—build cultures where judgment can mature.`,
  a31: `Mall privatisation turns public gathering into conditional access: security guards enforce unstated dress and spend norms. High streets with empty shopfronts could be reopened as sheltered linger space under municipal lease faster than new parks are built. The right to linger is also a right to rest while job-seeking, studying, or caring; policies that treat stillness as suspicious misread poverty as disorder.`,
  a32: `Urban heat island mapping without tree planting money is diagnostic theatre. Bond measures that tie canopy targets to mortality reduction make green access legible to fiscal conservatives and health advocates alike. Private golf courses inside cities are green access hoarded; converting portions to public woodland is politically explosive and geographically obvious on any equity map.`,
  a33: `Short-term rental platforms convert shelter into nightly assets faster than tenants can organise. Registration and night caps are asset-frame interventions pretending to be neutral tech policy. Social housing waiting lists measured in decades are the queue that asset-first rhetoric tries not to see. Housing policy debates that never mention queue length are incomplete by design.`,
  a34: `Paratransit for disabled riders in poor districts often exceeds trip times of fixed routes by multiples—a hidden tax on those least able to pay with time. Accessibility law without frequency law leaves rights on paper. Transit equity audits that publish time-to-hospital from each ward make abstract justice concrete for voters who never ride buses until they must.`,
  a35: `Developer-funded noise studies predict compliance; resident-funded replication sometimes finds otherwise. Planning panels that treat replication as hostility miss the point of falsifiable testimony. Conditional approvals with acoustic monitoring after opening—automatic pause if thresholds breach—align incentives toward honest modelling rather than optimistic renderings.`,
  a36: `Pandemic lift etiquette revealed how quickly micro-publics become policy arenas. Buildings with posted capacity and neighbour committees fared better than those with only security reprimands. Post-pandemic, retaining some of that mutual rule-making—not only surveillance—preserves vertical citizenship learned under stress.`,
  a37: `Tax increment financing that captures uplift for investors while displacing renters exports upgrading's gains upward. Capture mechanisms that fund relocation and right-of-return are upgrading language with accounting attached. Journalists who translate brochures without asking who left five years later amplify mask, not scrutiny.`,
  a38: `Late-night economy strategies often consult venue owners before cleaners and nurses finishing shifts. Shift-worker transit surveys reveal safety gaps tourism boards miss. Pleasure districts that fund harm reduction for nightlife workers—not only police overtime—treat pleasure as labour policy, not only culture.`,
  a39: `Street economies absorb unemployment spikes when formal hiring freezes; sweeping vendors during recession doubles policy cruelty. Micro-credit tied to vendor cooperatives beats fines as integration tool. Formal shops that pay taxes and informal traders who pay bribes both reveal incomplete order; integration aims at fair fees, not pretended purity.`,
  a40: `Dense housing without mediation funding invites friction myths to flourish after first conflict. Youth interfaith sports leagues cost less than security responses after riots sparked by rumour. Designed coexistence is boring budget line: translators, mediators, shared kitchens, mixed schools—maintained, not inaugurated once.`,
};

const EXPAND5 = {
  a25: `Annual review of observational tech should publish what was decommissioned as well as what was added. Sunset discipline prevents temporary pilots becoming permanent architecture. Workers who participate in design reviews report higher acceptance even when monitoring remains; exclusion breeds workaround culture that safety teams cannot see.`,
  a27: `Hospital protocols that batch non-urgent messages into twice-daily summaries reduce interruption harm without abandoning reachability for emergencies. Legislatures could adopt similar rules for constituent casework during committee weeks. Deliberation-friendly design is sector-specific, not one-size, but each sector can name its protected hours.`,
  a28: `City procurement officers who require "accountable human" fields in algorithmic RFPs shift markets toward vendors comfortable with scrutiny. Small wording changes in contract templates propagate faster than new statutes. Responsibility language is infrastructure hiding in plain sight.`,
  a29: `High schools that partner with repair cafés for service hours connect youth to fixer pipelines early. Grading troubleshooting write-ups alongside essays validates maintenance cognition as academic skill. Societies that reserve prestige for founders alone will keep importing dependency.`,
  a30: `Retirement of senior leaders who never admitted error teaches juniors that judgment includes revision. Exit interviews that ask "what would you decide differently?" capture institutional memory cheaply. Training judgment means training retirement stories, not only onboarding heroics.`,
  a31: `Library hours extended into evening provide linger without purchase better than policing benches. Heat plans that open cooling centres as public rights reduce summer exclusion for those without café budgets. Linger policy is climate policy when heat kills.`,
  a32: `Tree equity scores should bind capital budgets the way pavement repairs bind to pothole complaints. Neighbourhood councils with tree stewardship grants turn green access into participatory maintenance, not only participatory planting photo-ops.`,
  a33: `Renters' unions bargaining for habitable standards treat shelter as non-negotiable floor beneath asset returns. Pension funds invested in residential REITs face the same shelter-asset tension as households; fiduciary duty arguments can cut both ways if regulators clarify priorities.`,
  a34: `Bus lane enforcement with cameras shifts political pain from riders to motorists; without enforcement, lanes are paint. Equity metrics published monthly—time to employment zones by ward—keep slow transit visible after elections end.`,
  a35: `Resident testimony read aloud in full at hearings, not summarised by staff, signals respect that paraphrase denies. Timing guarantees—each speaker receives equal minutes—prevent stack-jacking by professional consultants with prettier slides.`,
  a36: `Mixed-income towers with shared laundry and shared play areas produce micro-publics across class lines when management does not segregate floors by rent band. Architecture cannot solve inequality; it can stop amplifying separation.`,
  a37: `Affordable housing quotas in "upgraded" districts without enforcement mechanisms are upgrading language with loopholes. Independent compliance officers funded by fines on violations align developer speech with developer behaviour.`,
  a38: `Queer nightlife districts contribute tax and culture; licensing boards that listen only to property owners externalise their costs onto neighbours who never wanted silence but wanted safety planning. Night belongs to workers as much as to tourists.`,
  a39: `Seasonal vendor permits tied to sanitation training integrate traders without pretending informality is risk-free. Confiscation without alternative pitch assignment is livelihood destruction dressed as order.`,
  a40: `Election cycles that cut translation services guarantee the friction myths they campaign on. Dense difference succeeds when boring services persist across administrations—mediators employed for decades, not only appointed after riots.`,
};

const EXPAND6 = {
  a30: `Peer observation programmes where junior staff watch senior decisions—and vice versa—normalise uncertainty as professional material. Judgment training fails when only errors are dissected and wins are mythologised as instinct. Balanced post-mortems build calibration: why this call, what we ignored, what we would watch next time.`,
  a31: `Winter markets in public squares that do not require purchase to enter preserve linger while supporting traders. The distinction is gating: commerce welcome, consumption optional. Cities that confuse the two train residents to see public space as a mall without price tags on entry—but with price tags on dignity.`,
  a32: `Canopy cover measured from satellite should trigger automatic capital allocations when wards fall below thresholds, removing green access from discretionary charity. Heat vulnerability indices linked to tree planting turn environmental justice from slogan into trigger. Without triggers, maps remain posters.`,
  a33: `Empty investor flats counted in census data expose asset-first housing when shelter queues grow. Vacancy taxes unpopular with portfolios may be popular with renters if revenues fund social units. Naming empty units is shelter politics.`,
  a34: `Weekend service gaps in poor districts reflect design when white-collar suburbs retain frequency. Shift workers' schedules are transit data; agencies that ignore them design neglect and call it legacy.`,
  a35: `Expert replication funded equally for residents and developers prevents asymmetric science in planning fights. When only developers bring acousticians, testimony is structurally unequal before anyone speaks.`,
  a36: `Fire drills that include neighbour check-ins build vertical micro-publics under stress. Buildings that only drill evacuation without teaching mutual aid waste the one moment residents share attention.`,
  a37: `Memorial plaques for closed businesses after upgrades preserve memory official language erases. Public history of loss makes upgrading accountable to more than investment metrics.`,
  a38: `All-night pharmacies and clinics anchor night safety for parents and workers beyond entertainment districts. Pleasure infrastructure without care infrastructure is incomplete night policy.`,
  a39: `Vendor health grades displayed publicly—like restaurants—reward clean informality and punish corner-cutting without blanket sweeps. Integration uses transparency, not only permits.`,
  a40: `School twinning across ethnic lines maintained for years beats one-day diversity fairs. Friction myths lose force when children grow up with paired classrooms and shared trips as normal, not exceptional.`,
};

const EXPAND7 = {
  a32: `Playground shade audits at primary schools reveal green access gaps before children learn heat as normal. Parent associations publishing walk-to-park times by block make abstract equity maps actionable at PTA meetings.`,
  a34: `Civil rights history reminds that transit desegregation without frequency is incomplete justice. Speed and dignity together define mobility equity; slow buses are not only inconvenient but discriminatory when patterned.`,
  a35: `Sleep studies linked to planning decisions remain rare; funding resident-collected data closes the gap. Cities that treat rest as health input upgrade policy beyond vibrancy slogans.`,
  a36: `Roof gardens visible from lift lobbies remind residents they share vertical infrastructure, not only vertical isolation. Shared maintenance days turn micro-publics into micro-democracies with spades.`,
  a37: `Oral history projects before demolition preserve upgrading's human inventory when bricks leave. Archives of shopkeepers and tenants complicate glossy after photos.`,
  a38: `Street harassment reporting kiosks near nightlife zones signal that night safety includes women's mobility, not only property crime stats.`,
  a39: `Factory-gate food vendors serve workers with minutes, not hours, for lunch; clearing them without replacement canteens is nutrition policy failure dressed as order.`,
  a40: `Block parties with translation booths model designed coexistence without pretending friction vanishes—only that it can be hosted safely.`,
};

const EXPAND8 = {
  a36: `Noticeboards in lift lobbies with rotating resident introductions—optional, anonymous if needed—humanise vertical anonymity without forcing intimacy. Small prompts beat grand community programmes nobody requested.`,
  a37: `Rent stabilisation tied to upgrading projects prevents improvement language from meaning exit. Without tenure protection, upgrade is displacement with better lighting and the same grief.`,
  a38: `Last-train timetables posted outside clubs in plain language reduce navigational labour for visitors unfamiliar with local night transit. Information is night safety infrastructure.`,
  a39: `Rain covers for vendor pitches cost less than repeated confiscations and legal churn. Infrastructure beats enforcement when informality meets weather.`,
  a40: `Mixed seating in new public squares—no VIP sections—signals that dense difference is spatial policy, not only festival rhetoric. Design speaks before speeches.`,
};

const EXPAND9 = {
  a37: `Community land assemblies with veto on demolition pace upgrading to human speed. Fast capital hates slow consent; consent is how loss stays visible.`,
  a39: `Vendor-led waste collection cooperatives reduce city costs and street conflict simultaneously. Integration can align fiscal and humane goals when designers listen. Municipal pilots that measure both cleanliness and livelihood retention offer metrics neither romantics nor eradicators alone provide.`,
  a40: `Annual neighbourhood friction audits—reported disputes, mediations, outcomes—replace myth with numbers without denying that some conflict is normal in dense life.`,
};

function wc(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

function targetSeconds(words) {
  return Math.min(600, Math.max(45, Math.round((words / 130) * 60)));
}

function refreshVocab(existing, id) {
  const fresh = {
    a11: [{ word: 'Credibility', definition: '(Noun) The quality of being trusted and believed.' }, { word: 'Generational', definition: '(Adjective) Spanning or passing between generations.' }],
    a22: [{ word: 'Serendipity', definition: '(Noun) Fortunate discovery by chance.' }, { word: 'Opacity', definition: '(Noun) Lack of transparency; hard to see inside.' }],
    a31: [{ word: 'Loitering', definition: '(Noun) Remaining in a place without apparent purpose, often policed.' }, { word: 'Third place', definition: '(Noun) A social setting beyond home and work.' }],
    a40: [{ word: 'Coexistence', definition: '(Noun) Living together despite differences.' }, { word: 'Mediation', definition: '(Noun) Helping parties reach agreement.' }],
  }[id];
  if (!fresh) return existing;
  const out = [...existing];
  for (const item of fresh) {
    const i = out.findIndex((v) => v.word === item.word);
    if (i >= 0) out[i] = item;
    else out[0] = item;
  }
  return out;
}

const ALL = { ...ESSAYS_A11_A20, ...ESSAYS_A21_A40 };
const arr = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const stats = [];

for (let i = 10; i < 40; i++) {
  const lesson = arr[i];
  const id = lesson.id;
  let text = ALL[id];
  if (EXPAND[id]) text = `${text.trim()}\n\n${EXPAND[id].trim()}`;
  if (EXPAND2[id]) text = `${text.trim()}\n\n${EXPAND2[id].trim()}`;
  if (EXPAND3[id]) text = `${text.trim()}\n\n${EXPAND3[id].trim()}`;
  if (EXPAND4[id]) text = `${text.trim()}\n\n${EXPAND4[id].trim()}`;
  if (EXPAND5[id]) text = `${text.trim()}\n\n${EXPAND5[id].trim()}`;
  if (EXPAND6[id]) text = `${text.trim()}\n\n${EXPAND6[id].trim()}`;
  if (EXPAND7[id]) text = `${text.trim()}\n\n${EXPAND7[id].trim()}`;
  if (EXPAND8[id]) text = `${text.trim()}\n\n${EXPAND8[id].trim()}`;
  if (EXPAND9[id]) text = `${text.trim()}\n\n${EXPAND9[id].trim()}`;
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  for (const phrase of BANNED) {
    if (text.includes(phrase)) {
      console.error(`BANNED phrase in ${id}: ${phrase}`);
      process.exit(1);
    }
  }

  const words = wc(text);
  if (words < 650 || words > 850) {
    console.warn(`WARN ${id}: ${words} words (target 650–850)`);
  }

  lesson.text = text;
  lesson.targetSeconds = targetSeconds(words);
  lesson.vocabulary = refreshVocab(lesson.vocabulary, id);
  stats.push({ id, words, targetSeconds: lesson.targetSeconds });
}

fs.writeFileSync(FILE, JSON.stringify(arr, null, 2) + '\n');
console.log(JSON.stringify(stats, null, 2));
console.log(
  'Summary:',
  `min=${Math.min(...stats.map((s) => s.words))}`,
  `max=${Math.max(...stats.map((s) => s.words))}`,
  `avg=${Math.round(stats.reduce((a, s) => a + s.words, 0) / stats.length)}`
);
