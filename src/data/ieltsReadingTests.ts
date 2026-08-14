// IELTS Academic Reading – Tests 1, 2, 3
// Each test: 3 passages, 40 questions, 60 minutes

export type QuestionType =
  | 'tfng'          // True / False / Not Given
  | 'ynng'          // Yes / No / Not Given
  | 'paragraph-match' // Which paragraph contains …
  | 'mcq'           // Choose A / B / C / D
  | 'heading'       // Match heading to paragraph
  | 'wordbank'      // Complete summary from word bank
  | 'concept-match'; // Match statement to person / concept

export interface MCQOption { label: string; text: string; }

export interface IELTSQuestion {
  number: number;
  type: QuestionType;
  statement?: string;   // tfng / ynng / paragraph-match / concept-match
  stem?: string;        // mcq question stem
  options?: MCQOption[];// mcq answer choices
  paragraphLabel?: string; // heading: "Paragraph B"
  answer: string;
  explanation: string;
}

export interface QuestionSection {
  instructions: string;
  questionType: QuestionType;
  questionRange: [number, number];
  headings?: { roman: string; text: string }[];
  wordBank?: { letter: string; word: string }[];
  summaryText?: string; // uses {{N}} as blank markers
  matchOptions?: { label: string; text: string }[];
  questions: IELTSQuestion[];
}

export interface IELTSPassage {
  title: string;
  paragraphs: { label: string; text: string }[];
  sections: QuestionSection[];
}

export interface IELTSTest {
  id: number;
  title: string;
  passages: IELTSPassage[];
}

// ─────────────────────────────────────────────
// TEST 1
// ─────────────────────────────────────────────
const test1: IELTSTest = {
  id: 1,
  title: 'IELTS Academic Reading – Test 1',
  passages: [
    // ── PASSAGE 1 ──────────────────────────────
    {
      title: 'The Chronometric Crucible',
      paragraphs: [
        {
          label: 'A',
          text: `For centuries, the vast expanse of the open ocean represented a formidable epistemological void for maritime navigators. While determining latitude—one's position north or south of the equator—was a relatively straightforward mathematical exercise involving the measurement of celestial bodies' altitudes, calculating longitude remained an intractable enigma. Without an accurate methodology to ascertain their east-west position, nautical fleets routinely succumbed to catastrophic navigational errors. The most infamous of these occurred in 1707, when a British naval squadron under Admiral Sir Cloudesley Shovell miscalculated its longitude and foundered on the rocks of the Scilly Isles, resulting in the loss of four warships and nearly 2,000 lives. This disaster catalyzed a paradigm shift, transforming the longitude problem from an esoteric academic puzzle into an urgent national imperative.`,
        },
        {
          label: 'B',
          text: `In response to mounting public and commercial pressure, the British government enacted the Longitude Act of 1714. This unprecedented legislation established the Board of Longitude, a committee of scientific luminaries and naval officers authorized to award a staggering £20,000 (equivalent to millions today) to anyone who could devise a practical and precise method for determining longitude at sea. The scientific community was subsequently bifurcated into two fiercely partisan camps: the "lunars," who advocated for astronomical methodologies, and the "mechanics," who championed the creation of an infallible marine clock.`,
        },
        {
          label: 'C',
          text: `The astronomical approach, heavily favored by the establishment, relied on the "lunar distance method." By charting the precise angular distance between the moon and specific stars, navigators could theoretically determine the time at a fixed reference point, such as Greenwich. Sir Isaac Newton, an influential member of the Board, vehemently supported this method, dismissing mechanical timepieces as intrinsically flawed. Newton argued that changes in temperature, humidity, and the violent oscillation of a ship would inevitably compromise the delicate escapements of any pendulum-based clock. Nevil Maskelyne, a subsequent Astronomer Royal, further entrenched this astronomical bias, rigorously publishing almanacs to facilitate lunar calculations.`,
        },
        {
          label: 'D',
          text: `Operating on the periphery of this academic hegemony was John Harrison, a self-educated Yorkshire carpenter and horologist. Unburdened by the dogmatism of the astronomical elite, Harrison recognized that knowing the exact time at a reference meridian was the solitary prerequisite for calculating longitude. Between 1730 and 1759, he engineered a series of revolutionary sea clocks—H1, H2, and H3. These monumental brass machines eschewed pendulums in favor of interconnected counter-oscillating balances, ingeniously designed to negate the ship's motion. Yet, despite their brilliance, they were cumbersome, and Harrison himself recognized their limitations in prolonged maritime environments.`,
        },
        {
          label: 'E',
          text: `Harrison's ultimate triumph materialized not as a monolithic clock, but as a colossal pocket watch known as H4. Completed in 1759, H4 utilized a high-frequency balance wheel and a novel temperature-compensation mechanism. During a grueling transatlantic trial to Jamaica in 1761, H4 lost a mere five seconds over two months. However, the Board of Longitude, heavily influenced by Maskelyne, refused to disburse the full prize. They obfuscated the process, demanding further trials and accusing Harrison of experiencing mere fortuitous luck rather than demonstrating reproducible scientific rigor. Maskelyne even confiscated Harrison's earlier models under the guise of "evaluating" them, effectively hamstringing the horologist's research.`,
        },
        {
          label: 'F',
          text: `It was only through the eventual intervention of King George III in 1773 that the elderly Harrison received his rightful financial restitution, though the Board stubbornly withheld the official title of the prize. Nevertheless, the efficacy of mechanical timekeeping had been unequivocally proven. Captain James Cook's reliance on K1—an exact replica of H4—during his second voyage to the Pacific definitively cemented the marine chronometer as an indispensable navigational instrument, thereby democratizing global exploration.`,
        },
        {
          label: 'G',
          text: `Modern navigational paradigms have, predictably, relegated mechanical chronometers to the realm of antiquarian curiosity. The advent of quartz oscillators in the 20th century, followed by ubiquitous satellite-based GPS systems governed by atomic clocks, has achieved a level of geographical precision Harrison could scarcely have conceptualized. Yet, the foundational premise remains unchanged: the mastery of space is inextricably predicated upon the flawless measurement of time.`,
        },
      ],
      sections: [
        {
          instructions: 'Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.',
          questionType: 'tfng',
          questionRange: [1, 5],
          questions: [
            { number: 1, type: 'tfng', statement: 'The disaster at the Scilly Isles in 1707 was primarily caused by anomalous magnetic interference affecting the ships\' compasses.', answer: 'NOT GIVEN', explanation: 'The text states the fleet miscalculated longitude and foundered, but the specific cause of the miscalculation—"anomalous magnetic interference"—is not mentioned.' },
            { number: 2, type: 'tfng', statement: 'The Board of Longitude was entirely composed of naval personnel who possessed practical seafaring experience.', answer: 'FALSE', explanation: 'The text explicitly states the Board was a "committee of scientific luminaries and naval officers," making the "entirely composed" claim false.' },
            { number: 3, type: 'tfng', statement: 'Sir Isaac Newton believed that environmental fluctuations would render sea clocks fundamentally inaccurate.', answer: 'TRUE', explanation: 'Newton argued that changes in temperature, humidity, and ship oscillation would "inevitably compromise" mechanical clocks.' },
            { number: 4, type: 'tfng', statement: 'Nevil Maskelyne publicly acknowledged the superiority of Harrison\'s H4 over the lunar distance method after the Jamaica trial.', answer: 'FALSE', explanation: 'Maskelyne did not acknowledge its superiority; rather, he refused to disburse the full prize and obfuscated the process.' },
            { number: 5, type: 'tfng', statement: 'The Board of Longitude confiscated Harrison\'s H4 to evaluate its high-frequency balance wheel.', answer: 'NOT GIVEN', explanation: 'Maskelyne confiscated Harrison\'s earlier models (H1-H3) under the guise of evaluation, but the text does not state H4 itself was confiscated for this specific reason.' },
          ],
        },
        {
          instructions: 'Reading Passage 1 has seven paragraphs, A–G. Which paragraph contains the following information? Write the correct letter A–G.',
          questionType: 'paragraph-match',
          questionRange: [6, 10],
          questions: [
            { number: 6, type: 'paragraph-match', statement: 'A description of an administrative body intentionally delaying financial compensation.', answer: 'E', explanation: 'Paragraph E details the Board refusing to pay Harrison and obfuscating the process.' },
            { number: 7, type: 'paragraph-match', statement: 'An explanation of how celestial observation was theoretically utilized to ascertain location.', answer: 'C', explanation: 'Paragraph C explains charting angular distance between the moon and stars to determine time and therefore location.' },
            { number: 8, type: 'paragraph-match', statement: 'A reference to the contemporary technologies that have superseded Harrison\'s inventions.', answer: 'G', explanation: 'Paragraph G mentions quartz oscillators and GPS replacing mechanical chronometers.' },
            { number: 9, type: 'paragraph-match', statement: 'An account of a self-taught inventor departing from traditional horological design.', answer: 'D', explanation: 'Paragraph D introduces the self-educated carpenter Harrison who departed from the astronomical dogmatism.' },
            { number: 10, type: 'paragraph-match', statement: 'The assertion that mastering a specific dimension is a prerequisite for traversing geography.', answer: 'G', explanation: 'The final sentence asserts that mastery of space (traversing geography) is predicated upon flawless measurement of time.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [11, 13],
          questions: [
            {
              number: 11, type: 'mcq',
              stem: 'According to Paragraph D, John Harrison\'s H1, H2, and H3 models:',
              options: [
                { label: 'A', text: 'Were ultimately destroyed by the violent oscillations of naval vessels.' },
                { label: 'B', text: 'Utilized interconnected pendulums to counteract changes in humidity.' },
                { label: 'C', text: 'Were abandoned by Harrison because he recognized they were impractically large.' },
                { label: 'D', text: 'Were immediately endorsed by the astronomical elite.' },
              ],
              answer: 'C',
              explanation: 'The text states Harrison himself recognized they were cumbersome and had limitations in prolonged maritime environments, leading him to develop the smaller H4.',
            },
            {
              number: 12, type: 'mcq',
              stem: 'Nevil Maskelyne\'s actions regarding the longitude problem demonstrate that he:',
              options: [
                { label: 'A', text: 'Provided John Harrison with the necessary almanacs to perfect the H4 model.' },
                { label: 'B', text: 'Used his institutional authority to impede the progress of mechanical timekeeping.' },
                { label: 'C', text: 'Was an impartial judge during the transatlantic trial to Jamaica.' },
                { label: 'D', text: 'Invented a temperature-compensation mechanism for lunar instruments.' },
              ],
              answer: 'B',
              explanation: 'Maskelyne used his institutional power to withhold the prize and confiscate Harrison\'s models, impeding mechanical progress.' },
            {
              number: 13, type: 'mcq',
              stem: 'The writer\'s primary purpose in Passage 1 is to:',
              options: [
                { label: 'A', text: 'Argue that the lunar distance method was scientifically superior to chronometry.' },
                { label: 'B', text: 'Detail the bureaucratic and scientific hurdles overcome in the pursuit of longitude.' },
                { label: 'C', text: 'Criticize King George III\'s interference in the Board of Longitude\'s affairs.' },
                { label: 'D', text: 'Explain the intricate mathematical formulas used by 18th-century sailors.' },
              ],
              answer: 'B',
              explanation: 'The passage as a whole tracks both the political/institutional hurdles and scientific developments in the pursuit of longitude.',
            },
          ],
        },
      ],
    },

    // ── PASSAGE 2 ──────────────────────────────
    {
      title: 'Subterranean Syntactics – The Mycorrhizal Debate',
      paragraphs: [
        { label: 'A', text: `In 1997, the journal Nature published a revolutionary study that precipitated a paradigm shift in forest ecology. Dr. Suzanne Simard demonstrated that carbon isotopes could pass between distinct tree species—specifically Douglas fir and paper birch—via a subterranean network of mycorrhizal fungi. This symbiotic infrastructure, rapidly dubbed the "Wood Wide Web," subverted the Darwinian orthodoxy of the forest as a theater of ruthless, zero-sum competition. Instead, forests were reimagined as cooperative, interdependent super-organisms. Popular media swiftly co-opted these findings, propagating narratives of "mother trees" altruistically nurturing saplings and complex warning systems communicating pathogenic threats across vast timberlands.` },
        { label: 'B', text: `The mechanics of this biological intranet rely upon two primary fungal architectures: ectomycorrhizal (EcM) fungi, which sheathe the root tips of many temperate and boreal trees, and arbuscular mycorrhizal (AM) fungi, which penetrate the cortical cells of the roots. In this mutualistic exchange, the autotrophic plants synthesize carbohydrates via photosynthesis, allocating up to 30% of their carbon yields to the fungi. In reciprocity, the vast mycelial networks, whose microscopic hyphae possess an exponentially greater surface area than plant roots, scavenge the soil for essential inorganic nutrients—predominantly phosphorus and nitrogen—and transport them back to the host trees.` },
        { label: 'C', text: `Proponents of the "cooperative forest" theory argue that these networks facilitate a sophisticated resource-sharing economy. Proponents suggest that mature, deeply rooted canopy trees operate as ecological hubs, subsidizing shaded understory saplings that cannot generate sufficient photosynthate. Furthermore, empirical studies have indicated that plants subjected to aphid attacks or mechanical defoliation can release semiochemicals into the mycelial network, subsequently upregulating the defensive enzyme production in neighboring, unblemished trees. This implies a level of ecological sentience and directed reciprocity previously reserved for complex faunal societies.` },
        { label: 'D', text: `However, a burgeoning contingent of evolutionary biologists and fungal ecologists has begun to aggressively interrogate the altruistic interpretation of mycorrhizal networks. Dr. David Robinson and other skeptics assert that the romanticization of the Wood Wide Web represents a profound anthropomorphic fallacy. They argue that fungi are not benevolent botanical internet service providers; they are autonomous, self-optimizing organisms. According to this counter-narrative, the observed transfer of carbon or nutrients between trees is not plant-directed altruism, but rather a consequence of the fungus aggressively reallocating resources to maximize its own mycelial expansion and reproductive fitness.` },
        { label: 'E', text: `Methodological criticisms have also surfaced regarding the foundational isotope-tracking experiments. While the transfer of Carbon-14 isotopes between trees is an indisputable physiological reality, quantitative ecologists point out that the volume of transferred carbon is frequently negligible—often accounting for less than 1% of the recipient plant's total carbon budget. Such a microscopic subsidy is highly unlikely to dictate the survival or mortality of a sapling in a natural forest ecosystem. Furthermore, identifying the precise pathway of transfer is notoriously difficult; isotopic markers detected in a neighboring plant may have traveled via passive soil exudation rather than a direct fungal conduit.` },
        { label: 'F', text: `The discourse surrounding mycorrhizal networks highlights a recurring epistemological tension within the biological sciences: the precarious balance between discovering emergent ecological phenomena and imposing human socio-political constructs onto nature. While the purely competitive model of forest ecology is undeniably obsolete, the utopian vision of arboricultural socialism is equally flawed. The reality likely resides in a complex matrix of mutual exploitation and conditional symbiosis, where the evolutionary imperatives of both plant and fungus sporadically align, yielding byproducts that only mimic conscious cooperation.` },
      ],
      sections: [
        {
          instructions: 'Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each of Paragraphs B–F from the list of headings below.',
          questionType: 'heading',
          questionRange: [14, 18],
          headings: [
            { roman: 'i',    text: 'The quantitative insignificance of resource exchange' },
            { roman: 'ii',   text: 'Media exaggeration of pathogenic threats' },
            { roman: 'iii',  text: 'Anatomical structures of symbiotic exchange' },
            { roman: 'iv',   text: 'Evidence of inter-plant chemical signaling' },
            { roman: 'v',    text: 'Theoretical discord regarding primary beneficiaries' },
            { roman: 'vi',   text: 'The financial costs of fungal research' },
            { roman: 'vii',  text: 'Reconciling scientific observation with human bias' },
            { roman: 'viii', text: 'The synthesis of carbohydrates in arbuscular environments' },
          ],
          questions: [
            { number: 14, type: 'heading', paragraphLabel: 'Paragraph B', answer: 'iii', explanation: 'Paragraph B outlines the distinct anatomical structures (EcM and AM fungi) used in the exchange.' },
            { number: 15, type: 'heading', paragraphLabel: 'Paragraph C', answer: 'iv',  explanation: 'Paragraph C discusses empirical studies showing plants releasing semiochemicals (chemical signaling) to trigger defensive enzymes in neighbors.' },
            { number: 16, type: 'heading', paragraphLabel: 'Paragraph D', answer: 'v',   explanation: 'Paragraph D details the theoretical discord: Robinson asserting the fungus, not the plant, is the primary beneficiary.' },
            { number: 17, type: 'heading', paragraphLabel: 'Paragraph E', answer: 'i',   explanation: 'Paragraph E focuses on the quantitative criticism that transferred carbon is frequently negligible (less than 1%).' },
            { number: 18, type: 'heading', paragraphLabel: 'Paragraph F', answer: 'vii',  explanation: 'Paragraph F summarizes the need to balance biological realities with the human bias of anthropomorphic constructs.' },
          ],
        },
        {
          instructions: 'Complete the summary below using words from the box. Write the correct letter A–H in boxes 19–22.',
          questionType: 'wordbank',
          questionRange: [19, 22],
          wordBank: [
            { letter: 'A', word: 'survival' },
            { letter: 'B', word: 'carbon' },
            { letter: 'C', word: 'competition' },
            { letter: 'D', word: 'photosynthesis' },
            { letter: 'E', word: 'pathogens' },
            { letter: 'F', word: 'altruism' },
            { letter: 'G', word: 'isotopes' },
            { letter: 'H', word: 'reproduction' },
          ],
          summaryText: `The initial discovery of the Wood Wide Web challenged the traditional scientific view of {{19}} among forest flora. While it is scientifically proven that fungal structures exchange nutrients for plant-derived {{20}}, the intent behind inter-tree resource transfer is heavily debated. Critics argue that attributing human traits to fungi is a fundamental error. Furthermore, while the movement of {{21}} has been tracked between trees, skeptics note that the actual amount transferred is often too small to impact a plant's overall {{22}}.`,
          questions: [
            { number: 19, type: 'wordbank', answer: 'C', explanation: 'The passage states the discovery subverted the orthodox view of the forest as a theater of ruthless, zero-sum competition.' },
            { number: 20, type: 'wordbank', answer: 'B', explanation: 'Autotrophic plants allocate carbon/carbohydrates to the fungi in exchange for nutrients.' },
            { number: 21, type: 'wordbank', answer: 'G', explanation: 'Tracking involves Carbon-14 isotopes, explicitly referenced as passing between distinct species.' },
            { number: 22, type: 'wordbank', answer: 'A', explanation: 'The microscopic subsidy is highly unlikely to dictate the survival or mortality of a sapling.' },
          ],
        },
        {
          instructions: 'Do the following statements agree with the claims of the writer in Passage 2? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [23, 26],
          questions: [
            { number: 23, type: 'ynng', statement: 'Arbuscular mycorrhizal fungi wrap entirely around the exterior of root tips without breaching the plant cells.', answer: 'NO', explanation: 'The text states AM fungi penetrate the cortical cells, contradicting the claim that they remain entirely on the exterior.' },
            { number: 24, type: 'ynng', statement: 'Dr. David Robinson hypothesizes that fungi transport nutrients primarily to assist weaker saplings in the understory.', answer: 'NO', explanation: 'Robinson argues the opposite: fungi act aggressively for their own reproductive fitness, not to altruistically assist saplings.' },
            { number: 25, type: 'ynng', statement: 'Isotopic markers can pass between plants through methods other than direct mycorrhizal connections.', answer: 'YES', explanation: 'Paragraph E confirms isotopic markers may travel via passive soil exudation rather than direct fungal conduits.' },
            { number: 26, type: 'ynng', statement: 'Future ecological models will likely abandon the concept of fungal symbiosis entirely.', answer: 'NOT GIVEN', explanation: 'While the passage says pure competition is obsolete and utopian symbiosis is flawed, it never claims ecologists will abandon the concept of symbiosis entirely.' },
          ],
        },
      ],
    },

    // ── PASSAGE 3 ──────────────────────────────
    {
      title: 'The Epistemology of the Artificial',
      paragraphs: [
        { label: 'A', text: `The ascendance of Large Language Models (LLMs) in the early 21st century precipitated a philosophical crisis that extended far beyond the realms of computer science, rupturing the very foundations of epistemology. Historically, technology functioned as a passive conduit for human cognition; a printing press or a search engine merely retrieved or disseminated knowledge that had been empirically verified or rationally synthesized by human agents. However, generative neural networks represent an ontological departure: they do not merely retrieve, they synthesize, extrapolate, and generate novel linguistic artifacts. This has forced philosophers to confront a bewildering question: if a machine generates a mathematically accurate, logically coherent proof without possessing any conscious comprehension of mathematics, does this output constitute "knowledge"?` },
        { label: 'B', text: `This dilemma resurrects the ancient dichotomy between empiricism and rationalism, albeit in a digital theater. The architecture of LLMs is fundamentally empiricist, functioning through the high-dimensional statistical analysis of staggering volumes of human-generated text. They map the probabilistic proximity of tokens—words or sub-words—calculating the statistical likelihood of one token following another. They are, in the words of computational linguist Emily Bender, "stochastic parrots," mindlessly regurgitating the linguistic patterns of their training corpora. Yet, the output they produce frequently exhibits properties associated with rigorous rationalism: complex deductive reasoning, the identification of abstract patterns, and the spontaneous generation of functional computer code.` },
        { label: 'C', text: `To navigate this paradox, contemporary philosophers frequently invoke John Searle's seminal 1980 "Chinese Room" thought experiment. Searle posited a scenario wherein an individual locked in a room, entirely ignorant of the Chinese language, utilizes a comprehensive rulebook to manipulate Chinese characters in response to inputs. To an outside observer, the entity inside the room appears fluent. Searle argued this demonstrated that syntactic manipulation (following rules) does not equate to semantic understanding (meaning). Modern LLMs are essentially the Chinese Room scaled to billions of parameters; they possess flawless syntactic mastery but suffer from an absolute absence of semantic grounding. They manipulate the symbol for "water" without any embodied conception of wetness, thirst, or oceans.` },
        { label: 'D', text: `Conversely, proponents of "emergent properties" vehemently contest the reductionist view of LLMs as mere statistical mimics. They argue that quantitative changes in scale—increasing the parameter count from billions to trillions—engender qualitative shifts in capability. When a neural network successfully passes the bar exam or solves a novel protein-folding puzzle, claiming it lacks "understanding" becomes a semantic quibble. If the functional output of the system is indistinguishable from, or superior to, human cognitive labor, the biological or synthetic nature of the internal processing mechanism is arguably irrelevant. In this utilitarian framework, knowledge is defined entirely by its performative utility, not its conscious origins.` },
        { label: 'E', text: `The most insidious threat posed by generative AI, however, lies in the "hermeneutic opacity" of its deep learning architecture. Unlike classical symbolic AI, where programmers explicitly hard-coded logic trees, the internal weighting of a multi-layer neural network is fundamentally a black box. When an LLM outputs a medical diagnosis, it cannot cite a chain of deductive reasoning; it can only point to a probabilistic matrix. This epistemological opacity degrades the concept of justification—a core tenet of classical knowledge theory, which defines knowledge as "justified true belief." If we outsource cognitive labor to systems that cannot epistemically justify their conclusions, we risk reverting to a pre-Enlightenment state of digital scholasticism, accepting algorithmic outputs as infallible dogma.` },
        { label: 'F', text: `Furthermore, the widespread integration of AI forces a re-evaluation of intentionality. Searle asserted that intentionality—the mind's capacity to be directed toward objects or states of affairs—is a biological phenomenon. When humans write an essay, there is an intent to persuade, inform, or deceive. An LLM possesses no such intentionality; it seeks only to minimize its loss function during text generation. Yet, users consistently project intentionality onto these systems, treating them as conversational agents with coherent worldviews. This anthropomorphic projection obfuscates the reality that the "mind" users interact with is merely a fluid simulacrum, a mirror reflecting the aggregated biases and linguistic tropes of the internet.` },
        { label: 'G', text: `Ultimately, resolving the epistemological status of artificial intelligence requires fracturing our monolithic definition of truth. We must delineate between "biological knowledge," which is inherently embodied, contextual, and intentional, and "synthetic knowledge," which is statistical, emergent, and functionally utilitarian. Failing to establish this ontological boundary will not simply result in flawed computing; it will irrevocably corrupt human society's capacity to distinguish between profound insight and statistically sophisticated hallucination.` },
      ],
      sections: [
        {
          instructions: 'Match each statement with the correct concept, A, B, C, or D. You may use any letter more than once.',
          questionType: 'concept-match',
          questionRange: [27, 31],
          matchOptions: [
            { label: 'A', text: 'The Chinese Room experiment' },
            { label: 'B', text: 'Stochastic Parrot argument' },
            { label: 'C', text: 'Emergent properties theory' },
            { label: 'D', text: 'Hermeneutic opacity' },
          ],
          questions: [
            { number: 27, type: 'concept-match', statement: 'Asserts that massive increases in network size result in fundamentally new cognitive abilities.', answer: 'C', explanation: 'Proponents of emergent properties argue quantitative changes in scale engender qualitative shifts in capabilities.' },
            { number: 28, type: 'concept-match', statement: 'Highlights the inability of modern AI to explain the logical steps taken to reach a specific conclusion.', answer: 'D', explanation: 'Hermeneutic opacity refers to deep learning architecture being a "black box" that cannot cite a chain of deductive reasoning.' },
            { number: 29, type: 'concept-match', statement: 'Claims that AI generation is purely the mimicry of probabilities found in its training data.', answer: 'B', explanation: 'The Stochastic Parrot argument asserts LLMs are merely regurgitating statistical probabilities from training corpora.' },
            { number: 30, type: 'concept-match', statement: 'Illustrates the difference between manipulating rules and genuinely comprehending meaning.', answer: 'A', explanation: 'Searle\'s Chinese Room directly contrasts flawless syntactic manipulation (rules) with an absolute absence of semantic understanding (meaning).' },
            { number: 31, type: 'concept-match', statement: 'Suggests that if an AI\'s output solves a complex problem effectively, its lack of consciousness does not matter.', answer: 'C', explanation: 'Utilitarian proponents of emergent properties argue that if the functional output solves a puzzle, biological consciousness is irrelevant.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [32, 35],
          questions: [
            {
              number: 32, type: 'mcq',
              stem: 'In Paragraph A, the writer contrasts historical technologies with LLMs by stating that historical technologies:',
              options: [
                { label: 'A', text: 'Generated logically coherent mathematical proofs without human input.' },
                { label: 'B', text: 'Acted as neutral tools that only organized human-created information.' },
                { label: 'C', text: 'Prevented human agents from empirically verifying scientific data.' },
                { label: 'D', text: 'Were primarily used to disrupt the foundations of computer science.' },
              ],
              answer: 'B',
              explanation: 'The text states historical technology was a "passive conduit" that retrieved/disseminated knowledge already verified by humans.',
            },
            {
              number: 33, type: 'mcq',
              stem: 'Emily Bender\'s characterization of LLMs (Paragraph B) implies that they:',
              options: [
                { label: 'A', text: 'Possess rigorous rationalism similar to human deductive reasoning.' },
                { label: 'B', text: 'Create functional computer code by understanding programming logic.' },
                { label: 'C', text: 'Are limited to repeating patterns without understanding the underlying concepts.' },
                { label: 'D', text: 'Function primarily through the observation of biological parrots.' },
              ],
              answer: 'C',
              explanation: '"Stochastic parrots" mindlessly regurgitate linguistic patterns without actual cognitive comprehension.' },
            {
              number: 34, type: 'mcq',
              stem: 'John Searle\'s original argument (Paragraph C) was primarily designed to:',
              options: [
                { label: 'A', text: 'Prove that AI could eventually learn the Chinese language.' },
                { label: 'B', text: 'Show that semantic understanding is required to write a comprehensive rulebook.' },
                { label: 'C', text: 'Demonstrate that flawless rule-following is not the same as true comprehension.' },
                { label: 'D', text: 'Explain how modern LLMs manage billions of parameters.' },
              ],
              answer: 'C',
              explanation: 'Searle utilized the Chinese Room to prove that syntactic manipulation (following rules) does not equate to semantic understanding.' },
            {
              number: 35, type: 'mcq',
              stem: 'The writer uses the term "digital scholasticism" in Paragraph E to warn against:',
              options: [
                { label: 'A', text: 'Unquestioningly accepting AI conclusions without understanding how they were reached.' },
                { label: 'B', text: 'The modern education system\'s over-reliance on generative AI.' },
                { label: 'C', text: 'Programmers spending too much time hard-coding classical logic trees.' },
                { label: 'D', text: 'The deep learning architecture used to diagnose complex medical conditions.' },
              ],
              answer: 'A',
              explanation: '"Digital scholasticism" warns against accepting algorithmic outputs as infallible dogma because systems cannot epistemically justify their conclusions.' },
          ],
        },
        {
          instructions: 'Do the following statements agree with the information given in Passage 3? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [36, 40],
          questions: [
            { number: 36, type: 'ynng', statement: 'Classical symbolic AI allowed programmers to clearly trace how a system arrived at its output.', answer: 'YES', explanation: 'The text contrasts opaque LLMs with classical symbolic AI, where programmers explicitly hard-coded logic trees, allowing traceability.' },
            { number: 37, type: 'ynng', statement: 'The loss function of an LLM is intentionally designed to deceive human users.', answer: 'NO', explanation: 'The text states an LLM does not seek to deceive; it only seeks to minimize its loss function during text generation.' },
            { number: 38, type: 'ynng', statement: 'Humans frequently misinterpret the outputs of LLMs as evidence of a conscious personality.', answer: 'YES', explanation: 'The text states users consistently "project intentionality" and treat AI as having coherent worldviews, obfuscating reality.' },
            { number: 39, type: 'ynng', statement: 'The author believes that "synthetic knowledge" will eventually replace "biological knowledge" entirely.', answer: 'NOT GIVEN', explanation: 'The author argues we must delineate between the two types, but makes no prediction about synthetic knowledge completely replacing biological knowledge.' },
            { number: 40, type: 'ynng', statement: 'Deep learning architectures require less electricity to run than classical symbolic AI systems.', answer: 'NOT GIVEN', explanation: 'The text compares logic structures of the systems but entirely omits any mention of electricity or power consumption.' },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// TEST 2
// ─────────────────────────────────────────────
const test2: IELTSTest = {
  id: 2,
  title: 'IELTS Academic Reading – Test 2',
  passages: [
    // ── PASSAGE 1 ──────────────────────────────
    {
      title: 'The Domestication Paradigm',
      paragraphs: [
        { label: 'A', text: `In 1868, Charles Darwin articulated a phenomenon he termed the "domestication syndrome." He observed that domesticated mammals invariably exhibited a unified suite of physiological anomalies: piebald coats, floppy ears, and diminished cranial capacities. Darwin hypothesized these traits were intrinsically linked, yet the biological mechanism remained an impenetrable mystery. For nearly a century, the scientific consensus posited that early humans had deliberately crossbred animals to achieve these specific aesthetic modifications. An obscure journal republished these early Darwinian theories in 1959, momentarily reviving interest in the aesthetic crossbreeding hypothesis before it was ultimately debunked by geneticists.` },
        { label: 'B', text: `Separately, in 1959, the Soviet geneticist Dmitry Belyaev orchestrated a clandestine experiment at the Institute of Cytology and Genetics in Novosibirsk. Operating under the oppressive shadow of Lysenkoism—a state-sanctioned pseudo-scientific dogma that violently rejected Mendelian genetics—Belyaev ostensibly bred silver foxes for the lucrative Soviet fur trade. However, his authentic objective was radically different: to isolate the exact variable responsible for domestication. Belyaev hypothesized that our ancestors did not select for floppy ears or curly tails; rather, they selected solely for tameness.` },
        { label: 'C', text: `Belyaev's methodology was ruthlessly binary. Researchers approached the cages of infant fox kits and strictly graded their physiological responses. Those exhibiting aggressive or fearful behaviors, such as biting or cowering, were immediately culled from the breeding pool. Only the most docile individuals—the top 10%—were permitted to reproduce. Crucially, the researchers actively ignored any physical traits; their selection criterion was exclusively behavioral.` },
        { label: 'D', text: `The phenotypic results were unprecedented in their velocity. By the tenth generation, an elite sub-population of foxes emerged that actively sought human affection. Concurrently, the physiological markers of Darwin's domestication syndrome spontaneously manifested. Their rigid ears collapsed, and their coats developed piebald mottling—all without any deliberate genetic selection for these specific physical attributes. Decades later, in a rival study conducted in Novosibirsk during the 1980s, alternative researchers attempted to replicate these physiological changes in wolves by modifying their diet alone, a methodology that ended in abject failure.` },
        { label: 'E', text: `To explain this biological cascade, Belyaev proposed a biochemical nexus. He theorized that selecting for tameness fundamentally altered the animals' neuroendocrinology, specifically reducing the adrenal glands' production of cortisol (a stress hormone) while concomitantly upregulating serotonin. Because the biochemical pathways governing stress responses are deeply intertwined with melanin production and cartilage development during embryonic growth, the pursuit of behavioral docility inadvertently triggered sweeping morphological transformations.` },
        { label: 'F', text: `Contemporary biologists, however, rely on the "neural crest hypothesis" to refine Belyaev's conclusions. Neural crest cells are embryonic stem cells that migrate throughout the developing fetus. Modern geneticists, including Richard Wrangham, argue that a mild deficit in neural crest cells—induced by selecting for tameness—perfectly accounts for the constellation of physical changes observed in Belyaev's foxes. Interestingly, early in his career, Richard Wrangham previously published a highly controversial paper arguing that domestication was purely a product of geographical isolation, though he has long since abandoned that stance.` },
      ],
      sections: [
        {
          instructions: 'Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.',
          questionType: 'tfng',
          questionRange: [1, 5],
          questions: [
            { number: 1, type: 'tfng', statement: 'The republication of Darwin\'s theories in 1959 conclusively proved that early humans selectively bred animals for aesthetic traits.', answer: 'FALSE', explanation: 'The text states it "momentarily revived interest… before it was ultimately debunked." It did not prove the hypothesis.' },
            { number: 2, type: 'tfng', statement: 'Dmitry Belyaev\'s official, state-approved justification for breeding silver foxes was to supply the commercial fur industry.', answer: 'TRUE', explanation: 'The text explicitly states Belyaev "ostensibly bred silver foxes for the lucrative Soviet fur trade" as his state-approved reason.' },
            { number: 3, type: 'tfng', statement: 'The researchers in Belyaev\'s experiment occasionally selected foxes with desirable coat colors for the breeding pool to fund their research.', answer: 'FALSE', explanation: 'The text states researchers "actively ignored any physical traits; their selection criterion was exclusively behavioral."' },
            { number: 4, type: 'tfng', statement: 'The 1980s dietary study successfully induced floppy ears in wolves without requiring behavioral selection.', answer: 'FALSE', explanation: 'The 1980s dietary study in wolves ended in "abject failure."' },
            { number: 5, type: 'tfng', statement: 'Richard Wrangham currently argues that the neural crest hypothesis also explains the evolutionary domestication of modern feline species.', answer: 'NOT GIVEN', explanation: 'While Wrangham and the neural crest hypothesis are mentioned, the passage never mentions modern feline species.' },
          ],
        },
        {
          instructions: 'Reading Passage 1 has six paragraphs, A–F. Which paragraph contains the following information? Write the correct letter A–F.',
          questionType: 'paragraph-match',
          questionRange: [6, 10],
          questions: [
            { number: 6, type: 'paragraph-match', statement: 'An explanation of how hormones linked to anxiety also influence physical cartilage growth.', answer: 'E', explanation: 'Paragraph E discusses how cortisol (stress hormone) is linked to cartilage development through embryonic biochemical pathways.' },
            { number: 7, type: 'paragraph-match', statement: 'A reference to a discredited Soviet scientific doctrine that necessitated secrecy.', answer: 'B', explanation: 'Paragraph B references Lysenkoism, a state-sanctioned pseudo-science that necessitated Belyaev\'s clandestine experiment.' },
            { number: 8, type: 'paragraph-match', statement: 'The assertion that an absence of specific embryonic cells dictates physical anomalies.', answer: 'F', explanation: 'Paragraph F discusses how a deficit in neural crest cells (embryonic cells) accounts for physical changes.' },
            { number: 9, type: 'paragraph-match', statement: 'A description of a strict, one-dimensional standard used to eliminate certain animals.', answer: 'C', explanation: 'Paragraph C details the "ruthlessly binary" standard of culling any animal showing fear or aggression.' },
            { number: 10, type: 'paragraph-match', statement: 'The historical assumption that anatomical changes in animals were intentionally engineered by early humans.', answer: 'A', explanation: 'Paragraph A outlines the century-long consensus that humans "deliberately crossbred" animals for physical modifications.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [11, 13],
          questions: [
            {
              number: 11, type: 'mcq',
              stem: 'According to Paragraph B, the significance of the year 1959 is that it marks:',
              options: [
                { label: 'A', text: 'The year Darwin\'s aesthetic crossbreeding hypothesis was finally proven true.' },
                { label: 'B', text: 'The beginning of a secret behavioral experiment disguised as a commercial enterprise.' },
                { label: 'C', text: 'The exact moment when Lysenkoism officially endorsed Mendelian genetics.' },
                { label: 'D', text: 'The discovery of the silver fox species in the wilderness of Novosibirsk.' },
              ],
              answer: 'B',
              explanation: 'In Paragraph B, 1959 marks the beginning of Belyaev\'s clandestine behavioral experiment disguised as fur trading.',
            },
            {
              number: 12, type: 'mcq',
              stem: 'The experimental results described in Paragraph D reveal that:',
              options: [
                { label: 'A', text: 'The researchers in Novosibirsk successfully altered wolf phenotypes using dietary changes in the 1980s.' },
                { label: 'B', text: 'Selecting foxes purely for docile behavior accidentally caused their ears to become floppy.' },
                { label: 'C', text: 'The tenth generation of foxes became aggressive when they developed piebald coats.' },
                { label: 'D', text: 'Darwin\'s domestication syndrome only occurs when breeders deliberately select for physical anomalies.' },
              ],
              answer: 'B',
              explanation: 'Paragraph D explains that selecting purely for docility spontaneously caused physical changes like floppy ears without deliberate genetic selection.',
            },
            {
              number: 13, type: 'mcq',
              stem: 'The reference to Richard Wrangham in the passage demonstrates:',
              options: [
                { label: 'A', text: 'How modern science uses geographical isolation to explain the neural crest hypothesis.' },
                { label: 'B', text: 'That researchers who initially reject domestication theories often refuse to change their minds.' },
                { label: 'C', text: 'A shift in scientific consensus from environmental isolation to cellular developmental theories.' },
                { label: 'D', text: 'That early career papers by geneticists are usually more accurate than their later work.' },
              ],
              answer: 'C',
              explanation: 'Wrangham represents a shift; he abandoned his early theory of geographical isolation in favor of the cellular neural crest hypothesis.',
            },
          ],
        },
      ],
    },

    // ── PASSAGE 2 ──────────────────────────────
    {
      title: 'The Edifice of Erasure: Post-War Urbanism',
      paragraphs: [
        { label: 'A', text: `In the immediate aftermath of the Second World War, municipal governments across the Western hemisphere embraced an architectural ideology characterized by sterile pragmatism and aggressive spatial rationalization. This movement, broadly categorized as High Modernism, sought to eradicate the labyrinthine, organic growth of historical cities in favor of geometric grids, arterial highways, and monolithic concrete residential blocks. Proponents argued that this radical restructuring was a hygienic necessity, engineered to maximize automotive efficiency and eradicate the blight of tenement housing. However, contemporary urban sociologists assert that this paradigm executed a form of systemic spatial erasure, systematically dismantling the intricate social topographies of marginalized communities.` },
        { label: 'B', text: `The zenith of this destructive ideology was arguably the tenure of Robert Moses in New York City. Moses, operating with unprecedented bureaucratic autonomy, championed the construction of the Cross-Bronx Expressway in the 1950s. To rationalize this monolithic infrastructure project, Moses weaponized the legal mechanism of eminent domain, displacing over 60,000 residents and physically bisecting tightly-knit, working-class neighborhoods. His philosophy was encapsulated in his infamous maxim: "You have to hack your way with a meat ax." Interestingly, years later in Paris, Robert Moses heavily criticized the European approach to historic preservation, deeming it an impediment to necessary vehicular flow.` },
        { label: 'C', text: `The counter-narrative to this infrastructural brutalism was galvanized by the journalist and activist Jane Jacobs. In her seminal 1961 treatise, Jacobs dismantled the High Modernist orthodoxy, arguing that vibrant cities require organic chaos, mixed-use zoning, and densely populated sidewalks. She famously coined the concept of "eyes on the street," positing that the continuous, informal surveillance provided by local shopkeepers and pedestrians is the ultimate deterrent to urban crime, rather than the isolated, fortified towers advocated by Modernist planners.` },
        { label: 'D', text: `Conversely, critics of Jane Jacobs frequently point out the limitations of her localized perspective. Urban planner Thomas Campanella noted that while Jacobs championed the preservation of her own neighborhood, Greenwich Village, she offered few scalable solutions for integrating necessary macro-infrastructure, such as regional transit hubs, into modern metropolises. Furthermore, Campanella argues that Jacobs inadvertently laid the theoretical groundwork for modern gentrification, as the "historic, mixed-use" neighborhoods she fetishized quickly became prohibitively expensive playgrounds for the affluent elite.` },
        { label: 'E', text: `The contemporary manifestation of spatial erasure no longer relies on the blunt instrument of the bulldozer; it operates through the insidious mechanics of capital accumulation. "Revitalization" initiatives frequently deploy the aesthetic vocabulary of Jacobs—restored brick facades, artisanal commercial spaces, and pedestrianized zones—while simultaneously executing the economic displacement championed by Moses. When a neglected industrial district is aggressively rebranded as an "arts corridor," the pre-existing, lower-income demographic is invariably priced out of their ancestral geography by escalating property taxes and rent surges.` },
        { label: 'F', text: `This phenomenon highlights a persistent dichotomy in urban planning: the tension between the city as an optimized engine of capital and the city as an inhabited sociological ecosystem. Until municipal frameworks legally decouple housing from speculative financial markets, urban renewal will remain a zero-sum mechanism, continuously prioritizing aesthetic and economic sanitization over the preservation of vulnerable community architectures.` },
      ],
      sections: [
        {
          instructions: 'Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each of Paragraphs B–F from the list of headings below.',
          questionType: 'heading',
          questionRange: [14, 18],
          headings: [
            { roman: 'i',   text: 'The financial mechanisms of modern displacement' },
            { roman: 'ii',  text: 'The necessity of unorganized community vigilance' },
            { roman: 'iii', text: 'The legal empowerment of infrastructural destruction' },
            { roman: 'iv',  text: 'The failure of European architectural preservation' },
            { roman: 'v',   text: 'The failure to provide large-scale urban solutions' },
            { roman: 'vi',  text: 'The architectural response to post-war poverty' },
            { roman: 'vii', text: 'Reconciling community needs with speculative markets' },
          ],
          questions: [
            { number: 14, type: 'heading', paragraphLabel: 'Paragraph B', answer: 'iii', explanation: 'Paragraph B focuses on Moses weaponizing eminent domain (legal empowerment) to build highways (destruction).' },
            { number: 15, type: 'heading', paragraphLabel: 'Paragraph C', answer: 'ii',  explanation: 'Paragraph C covers Jacobs\' concept of "eyes on the street," which relies on informal, unorganized pedestrian vigilance.' },
            { number: 16, type: 'heading', paragraphLabel: 'Paragraph D', answer: 'v',   explanation: 'Paragraph D critiques Jacobs for failing to offer "scalable solutions" for macro-infrastructure like regional transit.' },
            { number: 17, type: 'heading', paragraphLabel: 'Paragraph E', answer: 'i',   explanation: 'Paragraph E details how modern displacement operates through the "insidious mechanics of capital accumulation" and rent surges.' },
            { number: 18, type: 'heading', paragraphLabel: 'Paragraph F', answer: 'vii',  explanation: 'Paragraph F summarizes the need to decouple housing from speculative markets to protect communities.' },
          ],
        },
        {
          instructions: 'Complete the summary below using words from the box. Write the correct letter A–H in boxes 19–22.',
          questionType: 'wordbank',
          questionRange: [19, 22],
          wordBank: [
            { letter: 'A', word: 'preservation' },
            { letter: 'B', word: 'displacement' },
            { letter: 'C', word: 'surveillance' },
            { letter: 'D', word: 'hygiene' },
            { letter: 'E', word: 'gentrification' },
            { letter: 'F', word: 'autonomy' },
            { letter: 'G', word: 'architecture' },
            { letter: 'H', word: 'investment' },
          ],
          summaryText: `The High Modernist urban planning movement favored the construction of rigid grids and residential towers, ostensibly to improve city {{19}} and traffic flow. However, this often resulted in the destruction of established communities. In New York, the bureaucratic power of eminent domain was used to force the {{20}} of thousands of residents. In response, activists argued that safety is not achieved through fortified towers, but rather through the natural {{21}} provided by active, bustling sidewalks. Today, displacement is less about bulldozers and more about {{22}}, as historic neighborhoods become unaffordable for their original inhabitants.`,
          questions: [
            { number: 19, type: 'wordbank', answer: 'D', explanation: 'High Modernism sought geometric grids engineered to maximize automotive efficiency and as a "hygienic necessity."' },
            { number: 20, type: 'wordbank', answer: 'B', explanation: 'Moses used eminent domain, resulting in displacing over 60,000 residents.' },
            { number: 21, type: 'wordbank', answer: 'C', explanation: 'Jacobs argued safety comes from the continuous, informal surveillance of pedestrians ("eyes on the street").' },
            { number: 22, type: 'wordbank', answer: 'E', explanation: 'Paragraph E explains displacement operates through "capital accumulation" and Jacobs\' theories laid groundwork for gentrification.' },
          ],
        },
        {
          instructions: 'Do the following statements agree with the claims of the writer in Passage 2? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [23, 26],
          questions: [
            { number: 23, type: 'ynng', statement: 'Robert Moses believed that preserving the historic architecture of Paris was more important than building new highways.', answer: 'NO', explanation: 'Paragraph B explicitly states Moses "heavily criticized" European historic preservation as an impediment to vehicular flow.' },
            { number: 24, type: 'ynng', statement: 'Jane Jacobs actively advocated for the demolition of regional transit hubs in Greenwich Village.', answer: 'NOT GIVEN', explanation: 'The text states Campanella criticized Jacobs for offering few solutions for integrating regional transit hubs, but it never claims Jacobs actively campaigned to demolish them.' },
            { number: 25, type: 'ynng', statement: 'Thomas Campanella asserts that Jacobs\' theories unintentionally contributed to the modern affordability crisis in historic neighborhoods.', answer: 'YES', explanation: 'Paragraph D states Campanella argues Jacobs "inadvertently laid the theoretical groundwork" for neighborhoods becoming "prohibitively expensive."' },
            { number: 26, type: 'ynng', statement: 'The author believes that urban renewal programs currently prioritize the financial optimization of cities over the protection of vulnerable populations.', answer: 'YES', explanation: 'Paragraph F confirms the author believes urban renewal continuously prioritizes "economic sanitization over the preservation of vulnerable community architectures."' },
          ],
        },
      ],
    },

    // ── PASSAGE 3 ──────────────────────────────
    {
      title: 'The Thermodynamics of Chronological Asymmetry',
      paragraphs: [
        { label: 'A', text: `Within the framework of classical Newtonian physics, time is an agonizingly symmetric construct. The foundational equations governing motion are completely ambivalent regarding chronological direction; mathematically, a planetary orbit functions with equal validity whether calculated forwards or backwards in time. If one were to reverse the velocity of every particle in a shattered glass, classical mechanics dictates that the shards would seamlessly reassemble themselves into a pristine goblet. Yet, human experience is inexorably bound to a unidirectional temporal flow—a phenomenon the British astrophysicist Arthur Eddington famously designated as "Time's Arrow." Reconciling the microscopic symmetry of physical laws with the macroscopic asymmetry of reality remains one of the most profound epistemological crises in theoretical physics.` },
        { label: 'B', text: `The inception of a scientific explanation for this asymmetry arrived not from astrophysics, but from the industrial study of steam engines. The Second Law of Thermodynamics postulates that the entropy—a measure of disorder or randomness—of an isolated system can only increase over time. The Austrian physicist Ludwig Boltzmann provided the statistical scaffolding for this law, demonstrating that there are exponentially more ways for a system's microscopic components to be disordered than ordered. Consequently, a system will naturally evolve toward a state of maximum entropy simply because it is overwhelmingly more statistically probable. Therefore, the arrow of time is not a fundamental property of the universe, but rather an emergent statistical illusion.` },
        { label: 'C', text: `However, Boltzmann's statistical mechanics birthed a paralyzing paradox known as the "Past Hypothesis." If the universe is constantly evolving toward higher entropy, it logically necessitates that the universe began in a state of remarkably, inexplicably low entropy. The cosmological physicist Roger Penrose calculated that the probability of the universe's initial state possessing such microscopic precision by mere chance is 1 in 10 to the power of 10^123—a number so infinitesimally small that it defies human comprehension. Interestingly, in an obscure mathematical critique published years later, Roger Penrose argued that the concept of entropy is completely irrelevant to the study of black holes, a theory that was heavily ridiculed by his peers.` },
        { label: 'D', text: `In an attempt to bypass the Past Hypothesis, some quantum physicists look to the Copenhagen interpretation of quantum mechanics to ground the arrow of time. In the quantum realm, particles exist in a superposition of multiple potential states until they are observed or measured, at which point the wave function "collapses" into a single definitive reality. This collapse is an inherently irreversible process. Once a quantum measurement is taken, one cannot un-measure it to restore the superposition. Proponents argue that this microscopic irreversibility is the true quantum engine driving macroscopic chronological asymmetry.` },
        { label: 'E', text: `Conversely, the theoretical physicist Carlo Rovelli fundamentally rejects both the thermodynamic and quantum explanations, advocating instead for the total obliteration of time as a foundational concept. Utilizing the framework of Loop Quantum Gravity, Rovelli proposes that at the Planck scale—the smallest measurable distance in the universe—time literally ceases to exist. Instead, reality is composed of a localized network of interacting quantum events without a universal ticking clock. Rovelli asserts that our perception of a flowing temporal arrow is merely a biological limitation—a "perspectival illusion" born from our neurological inability to process the microscopic intricacies of quantum states. Curiously, Carlo Rovelli previously championed the Copenhagen interpretation's wave-function collapse as the definitive answer to time asymmetry before radically abandoning the theory entirely in his later publications.` },
        { label: 'F', text: `The implications of Rovelli's hypothesis extend deeply into the philosophy of mind. If time is structurally non-existent, the human experience of memory and anticipation are merely evolutionary adaptations rather than reflections of physical reality. Our brains encode "memories" of lower-entropy states (the past) to navigate and predict higher-entropy states (the future) to ensure biological survival. In this paradigm, time is not a dimension we travel through; it is an epistemological interface, a cognitive rendering engine utilized by biology to make sense of a timeless quantum matrix.` },
      ],
      sections: [
        {
          instructions: 'Match each statement with the correct researcher, A, B, C, or D. You may use any letter more than once.',
          questionType: 'concept-match',
          questionRange: [27, 31],
          matchOptions: [
            { label: 'A', text: 'Arthur Eddington' },
            { label: 'B', text: 'Ludwig Boltzmann' },
            { label: 'C', text: 'Roger Penrose' },
            { label: 'D', text: 'Carlo Rovelli' },
          ],
          questions: [
            { number: 27, type: 'concept-match', statement: 'Claimed that the probability of the universe starting in a highly ordered state by pure chance is virtually impossible.', answer: 'C', explanation: 'Penrose calculated the probability of the universe\'s initial low-entropy state as 1 in 10^(10^123).' },
            { number: 28, type: 'concept-match', statement: 'Coined a specific metaphorical term to describe the unidirectional flow of human experience.', answer: 'A', explanation: 'Eddington coined the phrase "Time\'s Arrow."' },
            { number: 29, type: 'concept-match', statement: 'Argues that human perception of time is a consequence of our inability to observe the universe at a microscopic level.', answer: 'D', explanation: 'Rovelli asserts time is a perspectival illusion born from our neurological inability to process microscopic quantum states.' },
            { number: 30, type: 'concept-match', statement: 'Proved mathematically that systems naturally move toward disorder because ordered states are highly improbable.', answer: 'B', explanation: 'Boltzmann provided the statistical proof that there are exponentially more ways for a system to be disordered than ordered.' },
            { number: 31, type: 'concept-match', statement: 'Asserted that time is entirely absent at the most fundamental, microscopic scale of reality.', answer: 'D', explanation: 'Rovelli proposes that at the Planck scale, time literally ceases to exist.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [32, 35],
          questions: [
            {
              number: 32, type: 'mcq',
              stem: 'In Paragraph A, the example of the shattered glass is used to illustrate:',
              options: [
                { label: 'A', text: 'Why Newtonian physics is incapable of calculating planetary orbits accurately.' },
                { label: 'B', text: 'That the fundamental laws of motion do not mathematically prevent processes from happening in reverse.' },
                { label: 'C', text: 'The exact moment when Arthur Eddington discovered the Arrow of Time.' },
                { label: 'D', text: 'That objects with higher mass shatter faster than objects with lower mass.' },
              ],
              answer: 'B',
              explanation: 'The glass example illustrates that classical mechanics equations work symmetrically; they dictate the shards could seamlessly reassemble.',
            },
            {
              number: 33, type: 'mcq',
              stem: 'The "Past Hypothesis" (Paragraph C) is considered a paradox because:',
              options: [
                { label: 'A', text: 'The Second Law of Thermodynamics relies on steam engines, which are obsolete.' },
                { label: 'B', text: 'It requires the universe to have started in an organized state that is statistically near-impossible to occur randomly.' },
                { label: 'C', text: 'Roger Penrose proved that entropy does not apply to black holes or the early universe.' },
                { label: 'D', text: 'Ludwig Boltzmann calculated that the universe is actually moving toward lower entropy.' },
              ],
              answer: 'B',
              explanation: 'If entropy always increases, the universe must have started in an initial state of low entropy that defies random chance.',
            },
            {
              number: 34, type: 'mcq',
              stem: 'According to Paragraph D, the collapse of the wave function provides a potential explanation for the arrow of time because:',
              options: [
                { label: 'A', text: 'It proves that macroscopic chronological asymmetry is an illusion.' },
                { label: 'B', text: 'Measuring a quantum particle is an action that cannot mathematically be undone.' },
                { label: 'C', text: 'Particles in superposition travel backward in time before they are measured.' },
                { label: 'D', text: 'The Copenhagen interpretation relies entirely on classical Newtonian equations.' },
              ],
              answer: 'B',
              explanation: 'Paragraph D explains that measuring a quantum particle collapses its wave function, which is an "inherently irreversible process."',
            },
            {
              number: 35, type: 'mcq',
              stem: 'The specific detail involving Carlo Rovelli in Paragraph E highlights:',
              options: [
                { label: 'A', text: 'His consistent, lifelong dedication to proving the Copenhagen interpretation.' },
                { label: 'B', text: 'The fact that his theories on Loop Quantum Gravity are heavily ridiculed by his peers.' },
                { label: 'C', text: 'His radical shift away from relying on wave-function collapse to explain time asymmetry.' },
                { label: 'D', text: 'His belief that biological limitations are an illusion.' },
              ],
              answer: 'C',
              explanation: 'The text explicitly notes that Rovelli "radically abandoned" his previous reliance on the Copenhagen interpretation.',
            },
          ],
        },
        {
          instructions: 'Do the following statements agree with the information given in Passage 3? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [36, 40],
          questions: [
            { number: 36, type: 'ynng', statement: 'Roger Penrose published an obscure paper arguing that entropy is irrelevant to black holes.', answer: 'YES', explanation: 'Paragraph C explicitly states: "Roger Penrose argued that the concept of entropy is completely irrelevant to the study of black holes."' },
            { number: 37, type: 'ynng', statement: 'The Copenhagen interpretation asserts that particles exist in only one definitive state before they are measured by an observer.', answer: 'NO', explanation: 'Paragraph D states particles exist in a "superposition of multiple potential states" before being measured, contradicting them being in only one state.' },
            { number: 38, type: 'ynng', statement: 'Carlo Rovelli previously argued that the collapse of a quantum wave function was the reason time only moves forward.', answer: 'YES', explanation: 'The text in Paragraph E explicitly notes Rovelli "previously championed the Copenhagen interpretation\'s wave-function collapse" before abandoning it.' },
            { number: 39, type: 'ynng', statement: 'The author states that human memory is a biological tool used to predict highly ordered, low-entropy future events.', answer: 'NO', explanation: 'Paragraph F states our brains predict "higher-entropy states (the future)," not low-entropy states.' },
            { number: 40, type: 'ynng', statement: 'Loop Quantum Gravity is currently accepted by the majority of physicists as the most accurate model of the universe.', answer: 'NOT GIVEN', explanation: 'While Loop Quantum Gravity is explained in detail, the text never claims it is currently accepted by the majority of physicists.' },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// TEST 3
// ─────────────────────────────────────────────
const test3: IELTSTest = {
  id: 3,
  title: 'IELTS Academic Reading – Test 3',
  passages: [
    // ── PASSAGE 1 ──────────────────────────────
    {
      title: 'Bathymetric Oases – The Chemosynthetic Revolution',
      paragraphs: [
        { label: 'A', text: `For the majority of the 20th century, marine biologists operated under the axiomatic assumption that the abyssal plains of the world's oceans were barren, desolate wastelands. Because the photic zone—the uppermost layer of water penetrable by sunlight—extends a mere 200 meters deep, it was scientific consensus that photosynthesis, and therefore the foundational base of the global food web, was impossible in the aphotic depths. Oceanographers mapped the bathymetric topography of the seafloor using sonar, but they expected to find little more than microscopic detritivores subsisting on the "marine snow" of decaying organic matter drifting down from the surface.` },
        { label: 'B', text: `This paradigm was violently shattered in 1977 during an expedition to the Galapagos Rift, situated 2,500 meters below the surface of the Pacific Ocean. Dr. Robert Ballard and his team, utilizing the deep-sea submersible Alvin, were originally surveying the rift for thermal anomalies to confirm theories of plate tectonics. Instead of a sterile geological landscape, the Alvin illuminated a dense, thriving ecosystem surrounding jagged hydrothermal vents. These "black smokers" were violently expelling superheated, mineral-rich fluids. Astonishingly, despite the crushing hydrostatic pressure and absolute absence of sunlight, the vent periphery was teeming with unprecedented biological diversity, including giant tube worms, blind crabs, and uncharacterized bivalves.` },
        { label: 'C', text: `The existence of this ecosystem posed a profound biological paradox: what was the primary energy source sustaining such immense biomass? The answer lay in a revolutionary biochemical process known as chemosynthesis. Unlike surface flora that harness solar photons to convert carbon dioxide into organic sugars, the foundational organisms of the vent ecosystem are extremophilic bacteria capable of oxidizing the toxic hydrogen sulfide abundantly present in the vent effluent. These lithoautotrophic bacteria effectively decouple biological life from the sun, extracting thermodynamic energy directly from the Earth's geothermal exhalations.` },
        { label: 'D', text: `The most iconic resident of these bathymetric oases is Riftia pachyptila, the giant tube worm, which can attain lengths exceeding two meters. Anatomically, Riftia pachyptila is a grotesque anomaly; it completely lacks a mouth, digestive tract, and anus. Instead, its survival is predicated upon an obligate endosymbiotic relationship with chemosynthetic bacteria housed within a specialized internal organ called the trophosome. The worm's striking red gill plumes extract hydrogen sulfide and oxygen from the water, binding them to specialized hemoglobin molecules that transport the chemicals directly to the bacterial colony, which in turn synthesizes the carbohydrates required by the host.` },
        { label: 'E', text: `The evolutionary implications of the 1977 Galapagos Rift discovery resonated far beyond marine biology, catalyzing radical new hypotheses regarding the origin of life itself. Previously, microbiologists had theorized that early biological synthesis occurred in shallow, sunlit primordial pools. However, the discovery that complex life could thrive in extreme temperatures and toxic chemical gradients led researchers to postulate that hydrothermal vents provided the ideal incubator for the first single-celled organisms, shielding them from the lethal ultraviolet radiation and meteoroid bombardments of the Hadean eon. Interestingly, a rival hypothesis published in 1977 by terrestrial botanists vehemently rejected this, arguing that chemosynthesis was merely a secondary evolutionary adaptation, not the primary genesis of life.` },
        { label: 'F', text: `Despite their isolation, hydrothermal vent ecosystems are highly ephemeral. The subterranean magma chambers that power the black smokers are inherently unstable, frequently shifting or collapsing due to tectonic volatility. When a vent's plumbing is severed, the localized hydrogen sulfide supply ceases, and the dependent biological community inevitably suffocates and decays within a matter of months. Curiously, Dr. Robert Ballard noted during a subsequent 1985 expedition to the wreck of the RMS Titanic that similar, albeit smaller, chemosynthetic communities had managed to colonize the degrading iron hull of the sunken vessel, proving the remarkable adaptability of these sulfur-oxidizing bacteria.` },
        { label: 'G', text: `Today, the primary threat to these pristine deep-sea habitats is anthropogenic. The mineral-rich chimneys of hydrothermal vents contain staggering concentrations of gold, copper, and rare-earth elements, making them prime targets for emerging deep-sea mining corporations. Conservationists argue that the invasive dredging techniques proposed by these entities would irreparably obliterate these delicate ecosystems before their genetic and pharmaceutical potential can be fully cataloged.` },
      ],
      sections: [
        {
          instructions: 'Do the following statements agree with the information given in the passage? Write TRUE, FALSE, or NOT GIVEN.',
          questionType: 'tfng',
          questionRange: [1, 5],
          questions: [
            { number: 1, type: 'tfng', statement: 'Prior to 1977, the scientific community believed that organic life at the bottom of the ocean relied solely on dead matter falling from above.', answer: 'TRUE', explanation: 'Oceanographers expected to find little more than microscopic detritivores subsisting on "marine snow" of decaying organic matter drifting down from the surface.' },
            { number: 2, type: 'tfng', statement: 'The submersible Alvin was specifically deployed to the Galapagos Rift to collect biological specimens of giant tube worms.', answer: 'FALSE', explanation: 'The text explicitly states the Alvin was "originally surveying the rift for thermal anomalies to confirm theories of plate tectonics," not to collect worms.' },
            { number: 3, type: 'tfng', statement: 'Riftia pachyptila utilizes specialized hemoglobin molecules to safely excrete toxic hydrogen sulfide from its trophosome.', answer: 'FALSE', explanation: 'The text states the hemoglobin transports the chemicals "directly to the bacterial colony" for synthesis, not to safely excrete them.' },
            { number: 4, type: 'tfng', statement: 'Terrestrial botanists published a paper in 1977 confirming that hydrothermal vents were the original source of single-celled organisms.', answer: 'FALSE', explanation: 'The 1977 paper by terrestrial botanists "vehemently rejected this," arguing chemosynthesis was merely a secondary adaptation.' },
            { number: 5, type: 'tfng', statement: 'Deep-sea mining corporations have already begun extracting rare-earth elements from the Galapagos Rift.', answer: 'NOT GIVEN', explanation: 'The text states vents are "prime targets for emerging deep-sea mining corporations," but never confirms extraction has "already begun" at the Galapagos Rift.' },
          ],
        },
        {
          instructions: 'Reading Passage 1 has seven paragraphs, A–G. Which paragraph contains the following information? Write the correct letter A–G.',
          questionType: 'paragraph-match',
          questionRange: [6, 10],
          questions: [
            { number: 6, type: 'paragraph-match', statement: 'An explanation of how tectonic instability leads to the localized extinction of vent organisms.', answer: 'F', explanation: 'Paragraph F details how shifting magma chambers sever the vent\'s plumbing, causing the community to suffocate and decay.' },
            { number: 7, type: 'paragraph-match', statement: 'The identification of a biological structure that compensates for the lack of a traditional digestive system.', answer: 'D', explanation: 'Paragraph D identifies the "trophosome" as the specialized internal organ compensating for the worm lacking a digestive tract.' },
            { number: 8, type: 'paragraph-match', statement: 'A description of how solar energy drives the production of organic sugars in non-deep-sea environments.', answer: 'C', explanation: 'Paragraph C contrasts vent life with "surface flora that harness solar photons to convert carbon dioxide into organic sugars."' },
            { number: 9, type: 'paragraph-match', statement: 'A reference to the commercial exploitation of the geological structures created by deep-sea vents.', answer: 'G', explanation: 'Paragraph G discusses emerging corporations targeting the mineral-rich chimneys for gold and rare-earth elements.' },
            { number: 10, type: 'paragraph-match', statement: 'The observation that chemosynthetic bacteria can thrive on artificial, man-made debris.', answer: 'F', explanation: 'Paragraph F mentions Dr. Ballard observing chemosynthetic bacteria thriving on the degrading iron hull of the sunken RMS Titanic.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [11, 13],
          questions: [
            {
              number: 11, type: 'mcq',
              stem: 'According to Paragraph B, Dr. Robert Ballard\'s expedition to the Galapagos Rift:',
              options: [
                { label: 'A', text: 'Was intended to prove that the photic zone extended deeper than 200 meters.' },
                { label: 'B', text: 'Was fundamentally geological in its original scientific objective.' },
                { label: 'C', text: 'Discovered the RMS Titanic by mapping thermal anomalies in the Pacific.' },
                { label: 'D', text: 'Was severely damaged by the violent explosion of superheated black smokers.' },
              ],
              answer: 'B',
              explanation: 'The expedition was surveying thermal anomalies to confirm plate tectonics, which is a geological objective.',
            },
            {
              number: 12, type: 'mcq',
              stem: 'The significance of chemosynthesis, as detailed in Paragraph C, is that it:',
              options: [
                { label: 'A', text: 'Allows surface flora to extract thermodynamic energy from the sun.' },
                { label: 'B', text: 'Completely decouples the survival of complex ecosystems from solar radiation.' },
                { label: 'C', text: 'Transforms marine snow into toxic hydrogen sulfide for the tube worms.' },
                { label: 'D', text: 'Prevents lithoautotrophic bacteria from being crushed by hydrostatic pressure.' },
              ],
              answer: 'B',
              explanation: 'Paragraph C states lithoautotrophic bacteria "effectively decouple biological life from the sun," freeing them from relying on solar radiation.',
            },
            {
              number: 13, type: 'mcq',
              stem: 'The mention of the 1985 RMS Titanic expedition in Paragraph F serves to illustrate:',
              options: [
                { label: 'A', text: 'The speed at which hydrothermal vents collapse after tectonic shifts.' },
                { label: 'B', text: 'Dr. Ballard\'s transition from marine biology to nautical archaeology.' },
                { label: 'C', text: 'The versatility and resilience of chemosynthetic biological communities.' },
                { label: 'D', text: 'That early biological synthesis occurred in shallow primordial pools.' },
              ],
              answer: 'C',
              explanation: 'The Titanic example proves the "remarkable adaptability" (versatility and resilience) of sulfur-oxidizing bacteria to new, non-vent environments.',
            },
          ],
        },
      ],
    },

    // ── PASSAGE 2 ──────────────────────────────
    {
      title: 'The Architecture of Irrationality',
      paragraphs: [
        { label: 'A', text: `For over a century, the architectural scaffolding of classical macroeconomic theory was supported by a single, monolithic pillar: the concept of Homo economicus. This hypothetical archetype positioned the human consumer as a flawlessly rational agent, an entity that consistently evaluated all available probabilistic data to maximize personal utility and financial wealth. Prominent mid-century economists at the University of Chicago vehemently defended this rational-choice theory, arguing that any individual deviations from logical behavior were merely statistical noise that would inevitably be corrected by the invisible hand of the free market. To suggest that humans were systematically and predictably irrational was considered economic heresy.` },
        { label: 'B', text: `This entrenched orthodoxy remained largely unassailed until the late 1970s, when two Israeli psychologists, Daniel Kahneman and Amos Tversky, began publishing a series of subversive empirical studies. Their seminal 1979 paper introduced "Prospect Theory," a psychological framework that mathematically demonstrated how human beings systematically violate the axioms of rational choice under conditions of risk. Kahneman and Tversky proved that humans do not evaluate outcomes based on absolute states of wealth, but rather relative to a subjective baseline or "reference point."` },
        { label: 'C', text: `The most profound revelation of Prospect Theory was the quantification of "loss aversion." Classical economics dictated that the psychological utility gained from finding $100 should perfectly equal the psychological disutility of losing $100. Kahneman and Tversky's experiments, however, revealed a drastic psychological asymmetry: the pain of a financial loss is experienced approximately twice as intensely as the pleasure of an equivalent gain. This innate neurological bias explains why investors irrationally hold onto plummeting stocks—hoping to avoid realizing a loss—while hastily selling profitable stocks to secure a premature gain. Years later, critics at the University of Chicago attempted to replicate these loss aversion experiments, arguing that the psychological asymmetry vanished when subjects were provided with significantly larger sums of institutional capital.` },
        { label: 'D', text: `Beyond loss aversion, Kahneman and Tversky cataloged a vast taxonomy of cognitive "heuristics"—mental shortcuts deployed by the brain to expedite complex decision-making. While evolutionarily advantageous for avoiding predators, these heuristics often lead to catastrophic financial miscalculations. The "availability heuristic," for instance, compels individuals to overestimate the probability of an event based on how easily an example can be recalled from memory. Consequently, individuals routinely purchase exorbitant insurance policies against highly improbable events (such as shark attacks or plane crashes) simply because such events receive disproportionate media coverage, while simultaneously under-insuring against mundane, statistically probable threats like cardiovascular disease.` },
        { label: 'E', text: `The integration of these psychological insights into economic policy was championed by Richard Thaler, a behavioral economist who, ironically, later secured a professorship at the University of Chicago. Thaler expanded upon Kahneman's foundation by developing "Nudge Theory." Thaler posited that if humans are predictably irrational, institutions could design "choice architectures" that gently steer (or nudge) citizens toward optimal decisions without restricting their freedom of choice—a philosophy he termed "libertarian paternalism." By simply changing the default option on corporate retirement plans from "opt-in" to "opt-out," Thaler demonstrated that employee savings rates could be drastically increased, utilizing human inertia as a tool for public good.` },
        { label: 'F', text: `Despite securing multiple Nobel Prizes, behavioral economics is not immune to rigorous academic interrogation. Purists argue that while the discipline is remarkably adept at describing irrational phenomena retrospectively, it fundamentally lacks the predictive mathematical precision of classical economics. Furthermore, sociologists have raised profound ethical concerns regarding Nudge Theory. If governments and corporations explicitly engineer choice architectures to manipulate the subconscious heuristics of the populace, the line between benevolent paternalism and covert psychological coercion becomes dangerously blurred. In a 1979 critique completely unrelated to Kahneman's work, sociologists argued that any state intervention in consumer markets inevitably leads to authoritarianism.` },
      ],
      sections: [
        {
          instructions: 'Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each of Paragraphs B–F from the list of headings below.',
          questionType: 'heading',
          questionRange: [14, 18],
          headings: [
            { roman: 'i',    text: 'The ethical ambiguity of subconscious manipulation' },
            { roman: 'ii',   text: 'The subjective nature of assessing risk and reward' },
            { roman: 'iii',  text: 'The failure of classical economists to understand biology' },
            { roman: 'iv',   text: 'The disproportionate emotional impact of negative outcomes' },
            { roman: 'v',    text: 'Utilizing inherent laziness to improve financial security' },
            { roman: 'vi',   text: 'How media exaggerates the risk of marine predators' },
            { roman: 'vii',  text: 'Flawed probability assessments due to memory recall' },
            { roman: 'viii', text: 'The institutional rejection of behavioral economics at Chicago' },
          ],
          questions: [
            { number: 14, type: 'heading', paragraphLabel: 'Paragraph B', answer: 'ii',  explanation: 'Paragraph B introduces Prospect Theory, demonstrating humans evaluate outcomes relative to a subjective baseline rather than absolute facts.' },
            { number: 15, type: 'heading', paragraphLabel: 'Paragraph C', answer: 'iv',  explanation: 'Paragraph C details loss aversion, where the psychological pain of losing is twice as intense as the pleasure of gaining.' },
            { number: 16, type: 'heading', paragraphLabel: 'Paragraph D', answer: 'vii', explanation: 'Paragraph D explains the availability heuristic, where individuals miscalculate probabilities based on how easily an event is recalled from memory.' },
            { number: 17, type: 'heading', paragraphLabel: 'Paragraph E', answer: 'v',   explanation: 'Paragraph E discusses Nudge Theory, specifically using "human inertia" (laziness) to increase employee retirement savings rates.' },
            { number: 18, type: 'heading', paragraphLabel: 'Paragraph F', answer: 'i',   explanation: 'Paragraph F addresses the "ethical concerns" regarding choice architectures leading to "covert psychological coercion."' },
          ],
        },
        {
          instructions: 'Complete the summary below using words from the box. Write the correct letter A–H in boxes 19–22.',
          questionType: 'wordbank',
          questionRange: [19, 22],
          wordBank: [
            { letter: 'A', word: 'rational' },
            { letter: 'B', word: 'probability' },
            { letter: 'C', word: 'heuristics' },
            { letter: 'D', word: 'unpredictable' },
            { letter: 'E', word: 'utility' },
            { letter: 'F', word: 'satisfaction' },
            { letter: 'G', word: 'coercion' },
            { letter: 'H', word: 'algorithms' },
          ],
          summaryText: `Classical economic theory relied on the assumption that individuals act as perfectly {{19}} beings, always making decisions that maximize their financial standing. However, Kahneman and Tversky challenged this by demonstrating that humans suffer from a cognitive bias known as loss aversion, where the emotional distress of losing money far outweighs the {{20}} of gaining the same amount. Furthermore, human decision-making is heavily influenced by {{21}}, which are rapid mental shortcuts. While these shortcuts were once useful for survival, they cause modern humans to drastically misjudge statistical {{22}}, particularly when heavily publicized events are easily remembered.`,
          questions: [
            { number: 19, type: 'wordbank', answer: 'A', explanation: 'The Homo economicus archetype positioned the consumer as a flawlessly "rational" agent.' },
            { number: 20, type: 'wordbank', answer: 'F', explanation: 'The text contrasts the pain of a loss with the "pleasure" of an equivalent gain; satisfaction is the correct synonym.' },
            { number: 21, type: 'wordbank', answer: 'C', explanation: 'Paragraph D defines heuristics as the "mental shortcuts" deployed to expedite decision-making.' },
            { number: 22, type: 'wordbank', answer: 'B', explanation: 'The text states individuals overestimate the "probability" of highly publicized events like shark attacks due to heuristics.' },
          ],
        },
        {
          instructions: 'Do the following statements agree with the claims of the writer in Passage 2? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [23, 26],
          questions: [
            { number: 23, type: 'ynng', statement: 'Early economists at the University of Chicago believed that occasional irrational behavior by individuals would ultimately disrupt the free market.', answer: 'NO', explanation: 'Paragraph A states they believed deviations would "inevitably be corrected by the invisible hand," contradicting the claim that it would disrupt the market.' },
            { number: 24, type: 'ynng', statement: 'Critics at the University of Chicago proved that loss aversion does not apply to individuals investing large amounts of institutional money.', answer: 'YES', explanation: 'Paragraph C explicitly notes that Chicago critics argued the psychological asymmetry vanished when subjects used "large amounts of institutional capital."' },
            { number: 25, type: 'ynng', statement: 'Richard Thaler\'s concept of libertarian paternalism forces individuals to save for retirement by legally restricting their options.', answer: 'NO', explanation: 'Paragraph E explicitly states Nudge Theory steers decisions "without restricting their freedom of choice," refuting legal restriction.' },
            { number: 26, type: 'ynng', statement: 'Some academics published criticisms in 1979 arguing that behavioral economics lacks the mathematical precision of classical models.', answer: 'NOT GIVEN', explanation: 'While purists argue it lacks mathematical precision and a 1979 critique mentions authoritarianism, the 1979 critique is described as "completely unrelated to Kahneman\'s work," making it NOT GIVEN that this specific critique argued about mathematical precision.' },
          ],
        },
      ],
    },

    // ── PASSAGE 3 ──────────────────────────────
    {
      title: 'The Cryptographic Sword of Damocles',
      paragraphs: [
        { label: 'A', text: `Throughout human history, the pursuit of secure communication was fundamentally an arms race of mechanical obfuscation, culminating in the intricate rotor systems of the WWII Enigma machine. However, the advent of the digital epoch necessitated a paradigm shift from mechanical complexity to algorithmic intractability. In 1977, three mathematicians—Ron Rivest, Adi Shamir, and Leonard Adleman—developed the RSA algorithm, effectively birthing modern asymmetric cryptography. Unlike historical ciphers that utilized a single, highly vulnerable key to both scramble and unscramble data, RSA utilized a bipartite system: a public key for encryption and a distinct, mathematically tethered private key for decryption. This architecture successfully democratized secure communication, forming the invisible foundational bedrock of modern global e-commerce and classified governmental networks.` },
        { label: 'B', text: `The absolute security of RSA is not grounded in physical impossibility, but rather in computational asymmetry. The algorithm relies upon the mathematical process of prime factorization. While it is computationally trivial for a modern processor to multiply two massive prime numbers together to create a colossal composite number, executing the reverse operation—deducing the original primes from the composite product—is a mathematical labyrinth. For a sufficiently large key length (e.g., 2048 bits), it would theoretically take the most advanced classical supercomputers millions of years to brute-force the factorization. Thus, the security of current global data relies entirely upon the axiomatic assumption that factoring massive primes is an inherently intractable problem for binary computers.` },
        { label: 'C', text: `This mathematical sanctuary was violently destabilized in 1994 by an MIT mathematician named Peter Shor. Operating in the purely theoretical realm of quantum mechanics, Shor published a revolutionary quantum algorithm capable of factoring massive integers exponentially faster than any classical algorithm. "Shor's Algorithm" demonstrated that a sufficiently powerful quantum computer—utilizing the properties of superposition and quantum interference—could collapse the millions of years required to crack RSA into a matter of hours. In 1994, this was largely viewed as an esoteric academic exercise, as the hardware required to run Shor's Algorithm did not yet exist. However, rapid contemporary advancements in quantum processing have transformed Shor's theoretical paper into an impending cryptographic apocalypse.` },
        { label: 'D', text: `To avert this impending catastrophe, cryptographers are abandoning mathematical intractability in favor of ontological absolute security, primarily through Quantum Key Distribution (QKD). QKD entirely bypasses computational algorithms, leveraging the fundamental laws of quantum physics to exchange cryptographic keys. The system typically transmits data utilizing the polarization states of single photons traversing fiber-optic cables. According to the Heisenberg Uncertainty Principle, it is a fundamental law of physics that the mere act of measuring a quantum system irrevocably alters its state.` },
        { label: 'E', text: `Consequently, the mechanics of QKD offer a flawless, physics-based alarm system against espionage. If a malicious third party attempts to intercept or clone the polarized photons during transmission, the quantum state collapses, instantly introducing detectable error rates into the key. The communicating parties are immediately alerted to the intrusion and discard the compromised key before any sensitive data is transmitted. The theoretical perfection of QKD was further bolstered by the application of Bell's Theorem in 1977, though at the time, Rivest, Shamir, and Adleman dismissed quantum applications as science fiction, focusing entirely on their RSA mathematical framework.` },
        { label: 'F', text: `Despite the promise of QKD, the transitional period between classical RSA dominance and quantum-safe infrastructure represents a period of extreme geopolitical vulnerability, frequently termed the "Harvest Now, Decrypt Later" threat. State-sponsored intelligence agencies are currently intercepting and hoarding colossal volumes of encrypted classical data—ranging from biometric databases to military schematics. While this data is currently illegible, these actors are patiently warehousing the ciphertexts, awaiting the imminent arrival of a cryptographically relevant quantum computer.` },
        { label: 'G', text: `Ultimately, the transition from algorithmic complexity to quantum cryptography represents a profound epistemological boundary. For the first time in human history, secrecy will no longer be reliant upon the transient limitations of our adversaries' technology or mathematical prowess. If successfully deployed, quantum cryptography promises an era of perfect secrecy, governed not by human ingenuity, but by the immutable, deterministic laws of the physical universe. Whether human society is prepared for an internet where absolute, unbreakable anonymity is a fundamental physical guarantee remains an intensely debated philosophical quandary.` },
      ],
      sections: [
        {
          instructions: 'Match each statement with the correct cryptographic concept, A, B, C, or D. You may use any letter more than once.',
          questionType: 'concept-match',
          questionRange: [27, 31],
          matchOptions: [
            { label: 'A', text: 'The RSA Algorithm' },
            { label: 'B', text: 'Shor\'s Algorithm' },
            { label: 'C', text: 'Quantum Key Distribution (QKD)' },
            { label: 'D', text: 'Harvest Now, Decrypt Later' },
          ],
          questions: [
            { number: 27, type: 'concept-match', statement: 'Relies on the physical impossibility of observing a system without altering it.', answer: 'C', explanation: 'QKD relies on the Heisenberg Uncertainty Principle, where the "mere act of measuring a quantum system irrevocably alters its state."' },
            { number: 28, type: 'concept-match', statement: 'Involves the long-term storage of intercepted, unreadable communications by government actors.', answer: 'D', explanation: '"Harvest Now, Decrypt Later" involves state agencies hoarding volumes of encrypted classical data to decipher later.' },
            { number: 29, type: 'concept-match', statement: 'Operates on the premise that separating a massive number into its original components is too time-consuming for standard computers.', answer: 'A', explanation: 'The RSA algorithm relies on the assumption that deducing original primes from a composite product is mathematically intractable for binary computers.' },
            { number: 30, type: 'concept-match', statement: 'Provides an automatic warning to the intended recipients if an unauthorized entity attempts to view the transmission.', answer: 'C', explanation: 'In QKD, if an eavesdropper intercepts the photons, the quantum state collapses, "instantly introducing detectable error rates" that alert the parties.' },
            { number: 31, type: 'concept-match', statement: 'Demonstrated theoretically that binary encryption could be broken rapidly using superposition.', answer: 'B', explanation: 'Shor\'s Algorithm demonstrated a quantum computer utilizing superposition could factor primes exponentially faster than classical computers.' },
          ],
        },
        {
          instructions: 'Choose the correct letter, A, B, C, or D.',
          questionType: 'mcq',
          questionRange: [32, 35],
          questions: [
            {
              number: 32, type: 'mcq',
              stem: 'In Paragraph A, the writer contrasts the Enigma machine with the RSA algorithm by stating that RSA:',
              options: [
                { label: 'A', text: 'Used physical rotor systems to secure modern e-commerce.' },
                { label: 'B', text: 'Relied on a single, highly vulnerable key to scramble data.' },
                { label: 'C', text: 'Separated the encryption and decryption processes into two distinct keys.' },
                { label: 'D', text: 'Was developed by the military to replace WWII mechanical systems.' },
              ],
              answer: 'C',
              explanation: 'Paragraph A contrasts Enigma\'s single key with RSA\'s bipartite system utilizing a public key for encryption and a distinct private key for decryption.',
            },
            {
              number: 33, type: 'mcq',
              stem: 'Peter Shor\'s publication in 1994 (Paragraph C) was initially considered an "esoteric academic exercise" because:',
              options: [
                { label: 'A', text: 'It took millions of years for classical computers to verify his math.' },
                { label: 'B', text: 'The physical machines needed to execute his equations had not been built yet.' },
                { label: 'C', text: 'The RSA algorithm had already been broken by MIT mathematicians in 1977.' },
                { label: 'D', text: 'Quantum interference made his algorithm too unstable to be published.' },
              ],
              answer: 'B',
              explanation: 'Paragraph C states it was considered an academic exercise because "the hardware required to run Shor\'s Algorithm did not yet exist."',
            },
            {
              number: 34, type: 'mcq',
              stem: 'According to Paragraph E, what is the primary consequence of an eavesdropper trying to intercept a QKD transmission?',
              options: [
                { label: 'A', text: 'The eavesdropper successfully clones the data using Bell\'s Theorem.' },
                { label: 'B', text: 'The transmission is rerouted through classical RSA algorithms.' },
                { label: 'C', text: 'The photons speed up, destroying the fiber-optic cables.' },
                { label: 'D', text: 'The quantum state collapses, revealing the intrusion to the original users.' },
              ],
              answer: 'D',
              explanation: 'Paragraph E states intercepting the photons causes the quantum state to collapse, alerting the communicating parties to the intrusion.',
            },
            {
              number: 35, type: 'mcq',
              stem: 'The specific detail involving the year 1977 in Paragraph E highlights:',
              options: [
                { label: 'A', text: 'The year Bell\'s Theorem was used to successfully crack the RSA algorithm.' },
                { label: 'B', text: 'That the creators of RSA intentionally ignored physical quantum solutions at the time.' },
                { label: 'C', text: 'The exact date Peter Shor began working on quantum computing at MIT.' },
                { label: 'D', text: 'When state actors first began hoarding encrypted military schematics.' },
              ],
              answer: 'B',
              explanation: 'The 1977 detail in Paragraph E notes that Rivest, Shamir, and Adleman dismissed quantum applications as science fiction to focus entirely on their RSA math.',
            },
          ],
        },
        {
          instructions: 'Do the following statements agree with the information given in Passage 3? Write YES, NO, or NOT GIVEN.',
          questionType: 'ynng',
          questionRange: [36, 40],
          questions: [
            { number: 36, type: 'ynng', statement: 'The mathematical process of multiplying two massive prime numbers together is extremely difficult for a modern classical processor.', answer: 'NO', explanation: 'Paragraph B states it is "computationally trivial" (very easy) for a modern processor to multiply two massive primes; it is the reverse that is difficult.' },
            { number: 37, type: 'ynng', statement: 'Rivest, Shamir, and Adleman successfully utilized Bell\'s Theorem to improve the security of the RSA algorithm in 1977.', answer: 'NO', explanation: 'Paragraph E explicitly states Rivest, Shamir, and Adleman "dismissed quantum applications" (like Bell\'s Theorem) as science fiction in 1977.' },
            { number: 38, type: 'ynng', statement: 'State-sponsored intelligence agencies are currently able to read the military schematics they are hoarding using classical supercomputers.', answer: 'NO', explanation: 'Paragraph F explicitly states that the hoarded data is "currently illegible" to these state actors.' },
            { number: 39, type: 'ynng', statement: 'The author asserts that the arrival of quantum-safe infrastructure will eliminate all forms of geopolitical conflict.', answer: 'NOT GIVEN', explanation: 'The author states quantum cryptography promises perfect secrecy, but never claims it will "eliminate all forms of geopolitical conflict."' },
            { number: 40, type: 'ynng', statement: 'Quantum Key Distribution relies on the fundamental laws of physics rather than computational difficulty to secure data.', answer: 'YES', explanation: 'Paragraph D states QKD abandons mathematical intractability, instead "leveraging the fundamental laws of quantum physics" to secure data.' },
          ],
        },
      ],
    },
  ],
};

export const ieltsReadingTests: IELTSTest[] = [test1, test2, test3];

// Convenience: flat list of all questions in a test (for scoring)
export function getAllQuestions(test: IELTSTest): IELTSQuestion[] {
  return test.passages.flatMap(p => p.sections.flatMap(s => s.questions));
}

// IELTS band conversion (Academic Reading, 40 questions)
export function scoreToBand(correct: number): string {
  if (correct >= 39) return '9';
  if (correct >= 37) return '8.5';
  if (correct >= 35) return '8';
  if (correct >= 33) return '7.5';
  if (correct >= 30) return '7';
  if (correct >= 27) return '6.5';
  if (correct >= 23) return '6';
  if (correct >= 19) return '5.5';
  if (correct >= 15) return '5';
  if (correct >= 13) return '4.5';
  if (correct >= 10) return '4';
  if (correct >= 8)  return '3.5';
  return '3';
}
