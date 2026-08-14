// IELTS Academic Listening – Tests 1 & 2
// Each test: 4 sections, 40 questions, 30 minutes
// Audio is synthesised via Web Speech API (TTS)

export type ListeningQuestionType =
  | 'fill'   // fill-in-the-blank (one or two words)
  | 'mcq'    // multiple choice A/B/C
  | 'match'; // matching

export interface ListeningMCQOption { label: string; text: string; }

export interface ListeningQuestion {
  number: number;
  type: ListeningQuestionType;
  /** For fill: the label displayed before the blank */
  label?: string;
  /** MCQ stem */
  stem?: string;
  options?: ListeningMCQOption[];
  /** Matching: left-side statement */
  statement?: string;
  matchOptions?: { label: string; text: string }[];
  answer: string; // for fill: the word(s); for mcq/match: the letter
  explanation: string;
}

export interface ListeningSection {
  number: 1 | 2 | 3 | 4;
  title: string;
  context: string; // Short scene-setter shown to the student
  transcript: string; // Read aloud via TTS
  questionRange: [number, number];
  instructions: string;
  questions: ListeningQuestion[];
}

export interface IELTSListeningTest {
  id: number;
  title: string;
  sections: ListeningSection[];
}

// ─────────────────────────────────────────────
// TEST 1
// ─────────────────────────────────────────────
const listeningTest1: IELTSListeningTest = {
  id: 1,
  title: 'IELTS Academic Listening – Test 1',
  sections: [
    // ── SECTION 1 ──────────────────────────────
    {
      number: 1,
      title: 'City Library Membership',
      context: 'A new resident, Tom, is speaking to a library assistant about joining the city library.',
      transcript: `
Assistant: Good morning. Welcome to Westgate City Library. How can I help you today?
Tom: Hi there. I'd like to join the library, please. This is actually my first time visiting.
Assistant: Wonderful! I'll just need to take down a few details. Can I start with your full name?
Tom: Sure. It's Thomas Crawford. Tom for short.
Assistant: Thomas Crawford. And could you spell the surname for me?
Tom: C-R-A-W-F-O-R-D.
Assistant: Thank you. And your date of birth?
Tom: The fourteenth of March, nineteen ninety-two.
Assistant: Perfect. Now, your address?
Tom: Forty-seven, Birchwood Avenue, Westgate. The postcode is WG4 3LT.
Assistant: WG4 3LT. And a contact number?
Tom: My mobile is 07812 554 390.
Assistant: Great. What about email? We like to send reminders when books are due.
Tom: It's tom dot crawford at greenmail dot co dot uk.
Assistant: Lovely. Now, which type of membership are you interested in? We have Standard, which is free, Premium at six pounds a month, or Family at ten pounds.
Tom: I think Standard will be fine for now.
Assistant: Excellent. With Standard membership you can borrow up to eight books at a time, and keep them for three weeks.
Tom: That sounds great. Is there anything else I need?
Assistant: Just one more thing — do you have proof of address? A utility bill or a bank statement dated within the last three months would be perfect.
Tom: I have a bank statement from last month. Will that do?
Assistant: Absolutely. And we'll issue you a library card today. The card is valid for two years and can be renewed online. We also have free Wi-Fi throughout the building — the password is WESTGATE2024 — all capitals.
Tom: Brilliant. Thanks so much.
Assistant: My pleasure. I'll just get that card printed for you now.
      `.trim(),
      questionRange: [1, 10],
      instructions: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      questions: [
        {
          number: 1, type: 'fill',
          label: 'Surname:',
          answer: 'Crawford',
          explanation: 'Tom spells out his surname: C-R-A-W-F-O-R-D.',
        },
        {
          number: 2, type: 'fill',
          label: 'Date of birth:',
          answer: '14 March 1992',
          explanation: 'Tom says "the fourteenth of March, nineteen ninety-two".',
        },
        {
          number: 3, type: 'fill',
          label: 'Street address:',
          answer: 'Birchwood Avenue',
          explanation: 'The address is 47 Birchwood Avenue.',
        },
        {
          number: 4, type: 'fill',
          label: 'Postcode:',
          answer: 'WG4 3LT',
          explanation: 'Tom provides the postcode WG4 3LT.',
        },
        {
          number: 5, type: 'fill',
          label: 'Mobile number:',
          answer: '07812 554 390',
          explanation: 'Tom gives his mobile as 07812 554 390.',
        },
        {
          number: 6, type: 'fill',
          label: 'Email domain:',
          answer: 'greenmail',
          explanation: 'His email is at greenmail.co.uk.',
        },
        {
          number: 7, type: 'mcq',
          stem: 'Which membership type does Tom choose?',
          options: [{ label: 'A', text: 'Standard' }, { label: 'B', text: 'Premium' }, { label: 'C', text: 'Family' }],
          answer: 'A',
          explanation: 'Tom says "Standard will be fine for now".',
        },
        {
          number: 8, type: 'fill',
          label: 'Maximum books borrowed at once:',
          answer: '8',
          explanation: 'Standard membership allows up to eight books.',
        },
        {
          number: 9, type: 'fill',
          label: 'Loan period (weeks):',
          answer: '3',
          explanation: 'Books can be kept for three weeks.',
        },
        {
          number: 10, type: 'fill',
          label: 'Wi-Fi password:',
          answer: 'WESTGATE2024',
          explanation: 'The assistant says the password is WESTGATE2024 — all capitals.',
        },
      ],
    },

    // ── SECTION 2 ──────────────────────────────
    {
      number: 2,
      title: 'Riverside Nature Reserve',
      context: 'A ranger gives a welcome talk to a group of visitors at Riverside Nature Reserve.',
      transcript: `
Ranger: Good afternoon, everyone, and welcome to the Riverside Nature Reserve. My name is Sarah and I'll be your guide today. Before we set off, let me give you a quick overview of what to expect.

The reserve covers approximately three hundred and fifty hectares of mixed woodland, wetlands, and open meadow. It was established in nineteen eighty-six following a successful campaign by local conservation groups, and since then, it has been home to over two hundred and forty species of birds alone.

This afternoon we'll be following the Blue Trail, which is the medium-difficulty route. It's roughly five kilometres long and should take around two hours. Do make sure you stay on the marked path — the wetland areas to the west can be extremely boggy and dangerous off-trail.

Our first stop will be the Kingfisher Hide, about twenty minutes from here. If you're lucky, you may spot the reserve's famous pair of kingfishers, who have nested at the same site for the past six years. Please keep noise to a minimum inside the hide.

From there we'll head north to the Meadow Viewpoint for our mid-walk refreshment break. You can refill your water bottles at the fountain near the wooden shelter — the water is fully filtered and safe to drink.

Our final stop before returning to the visitor centre is the Ancient Oak Grove. The oldest tree there is believed to be over four hundred years old. We ask that you don't touch the bark, as the oils from skin can introduce fungi that harm these trees.

A couple of housekeeping points: please carry all litter out with you, as we have no bins on the trails. Photography is very welcome — we'd love to see your pictures. If you tag the reserve on social media, use the hashtag NatureRiverside. That's N-A-T-U-R-E-R-I-V-E-R-S-I-D-E, all one word.

Right — if there are no questions, let's get started!
      `.trim(),
      questionRange: [11, 20],
      instructions: 'Choose the correct letter, A, B, or C, or complete the notes below.',
      questions: [
        {
          number: 11, type: 'fill',
          label: 'Reserve area (hectares):',
          answer: '350',
          explanation: 'The reserve covers approximately three hundred and fifty hectares.',
        },
        {
          number: 12, type: 'fill',
          label: 'Year established:',
          answer: '1986',
          explanation: 'It was established in nineteen eighty-six.',
        },
        {
          number: 13, type: 'fill',
          label: 'Number of bird species:',
          answer: '240',
          explanation: 'The reserve is home to over two hundred and forty species of birds.',
        },
        {
          number: 14, type: 'mcq',
          stem: 'Which trail will the group follow today?',
          options: [{ label: 'A', text: 'An easy trail' }, { label: 'B', text: 'A medium trail' }, { label: 'C', text: 'A difficult trail' }],
          answer: 'B',
          explanation: 'The ranger says they will follow the Blue Trail, which is the medium-difficulty route.',
        },
        {
          number: 15, type: 'fill',
          label: 'Trail length (km):',
          answer: '5',
          explanation: 'The Blue Trail is roughly five kilometres long.',
        },
        {
          number: 16, type: 'mcq',
          stem: 'Why should visitors stay on the marked path?',
          options: [{ label: 'A', text: 'There are dangerous animals.' }, { label: 'B', text: 'The wetlands are very boggy.' }, { label: 'C', text: 'Private land borders the trail.' }],
          answer: 'B',
          explanation: 'The ranger warns that "the wetland areas can be extremely boggy and dangerous off-trail".',
        },
        {
          number: 17, type: 'fill',
          label: 'First stop:',
          answer: 'Kingfisher Hide',
          explanation: 'The first stop is the Kingfisher Hide, about twenty minutes away.',
        },
        {
          number: 18, type: 'fill',
          label: 'Water source at mid-walk stop:',
          answer: 'fountain',
          explanation: 'Visitors can refill at the fountain near the wooden shelter.',
        },
        {
          number: 19, type: 'fill',
          label: 'Age of oldest tree (years):',
          answer: '400',
          explanation: 'The oldest tree is believed to be over four hundred years old.',
        },
        {
          number: 20, type: 'fill',
          label: 'Social media hashtag:',
          answer: 'NatureRiverside',
          explanation: 'The ranger gives the hashtag as NatureRiverside — all one word.',
        },
      ],
    },

    // ── SECTION 3 ──────────────────────────────
    {
      number: 3,
      title: 'University Project Discussion',
      context: 'Two students, Priya and Marcus, discuss their group research project with their tutor, Dr. Evans.',
      transcript: `
Dr. Evans: So, Priya, Marcus — how is the research project coming along?
Priya: Reasonably well, I think. We've settled on our research question, which is whether urban green spaces reduce reported stress levels in city workers.
Dr. Evans: Good choice — very topical. What methodology are you planning?
Marcus: We decided on a mixed-methods approach. We'll conduct a quantitative survey with a hundred and fifty participants drawn from three different companies in the city centre, and we'll also do ten in-depth qualitative interviews.
Dr. Evans: Sensible. Who will you be recruiting as participants?
Priya: Office workers aged between twenty-five and fifty. We wanted to avoid students since they face quite different stressors.
Dr. Evans: Good reasoning. Have you thought carefully about your data collection tools?
Marcus: Yes. For the survey we're using the Perceived Stress Scale — that's PSS for short — which is a validated measure. For the interviews, we'll follow a semi-structured format so we can explore unexpected themes.
Dr. Evans: The PSS is certainly well established. One thing I'd flag is the potential for social desirability bias in both the survey and the interviews. How will you mitigate that?
Priya: We'll make the surveys completely anonymous. For the interviews we'll remind participants that there are no right or wrong answers and that their responses are confidential.
Dr. Evans: Good. Now, ethical approval — where are you with that?
Marcus: We submitted the application last Tuesday. We're expecting a response within three weeks.
Dr. Evans: Make sure you have that approval before any data collection starts. What's your timeline looking like overall?
Priya: We're aiming to finish data collection by the end of next month, then spend six weeks on analysis and writing. We want to submit four weeks before the deadline to allow time for revisions.
Dr. Evans: That sounds sensible — though I'd recommend building in a contingency of at least one extra week for the analysis phase. These things often take longer than expected.
Marcus: That's good advice. We'll adjust our Gantt chart accordingly.
Dr. Evans: Excellent. One more thing — have you thought about your theoretical framework?
Priya: We're planning to use Attention Restoration Theory and Stress Recovery Theory. Both seem very applicable to our question.
Dr. Evans: Perfect choices. I'd also suggest having a look at Rachel and Stephen Kaplan's work on Restorative Environments — it feeds directly into Attention Restoration Theory and will strengthen your literature review.
Marcus: I'll add that to our reading list.
Dr. Evans: Right. I think you're on a solid track. Come back to me once you have ethical approval and we can refine your interview questions together.
      `.trim(),
      questionRange: [21, 30],
      instructions: 'Choose the correct letter, A, B, or C.',
      questions: [
        {
          number: 21, type: 'mcq',
          stem: 'What is the topic of the students\' research project?',
          options: [
            { label: 'A', text: 'The effect of commuting on stress' },
            { label: 'B', text: 'Green spaces and stress in city workers' },
            { label: 'C', text: 'Office design and productivity' },
          ],
          answer: 'B',
          explanation: 'Priya says the question is "whether urban green spaces reduce reported stress levels in city workers".',
        },
        {
          number: 22, type: 'fill',
          label: 'Number of survey participants:',
          answer: '150',
          explanation: 'Marcus says they will survey one hundred and fifty participants.',
        },
        {
          number: 23, type: 'fill',
          label: 'Number of qualitative interviews:',
          answer: '10',
          explanation: 'They plan ten in-depth qualitative interviews.',
        },
        {
          number: 24, type: 'mcq',
          stem: 'Why did the students exclude students from their participant group?',
          options: [
            { label: 'A', text: 'Students are too young.' },
            { label: 'B', text: 'Students face different stressors.' },
            { label: 'C', text: 'Students are hard to recruit.' },
          ],
          answer: 'B',
          explanation: 'Priya says they avoided students because "they face quite different stressors".',
        },
        {
          number: 25, type: 'fill',
          label: 'Validated survey tool used:',
          answer: 'Perceived Stress Scale',
          explanation: 'Marcus mentions using the Perceived Stress Scale (PSS).',
        },
        {
          number: 26, type: 'mcq',
          stem: 'How will the students reduce social desirability bias in surveys?',
          options: [
            { label: 'A', text: 'By making surveys anonymous' },
            { label: 'B', text: 'By offering incentives' },
            { label: 'C', text: 'By using only open questions' },
          ],
          answer: 'A',
          explanation: 'Priya says "we\'ll make the surveys completely anonymous".',
        },
        {
          number: 27, type: 'fill',
          label: 'Weeks for analysis and writing:',
          answer: '6',
          explanation: 'The students plan to spend six weeks on analysis and writing.',
        },
        {
          number: 28, type: 'mcq',
          stem: 'What does Dr. Evans recommend regarding the analysis phase?',
          options: [
            { label: 'A', text: 'Shorten it to save time' },
            { label: 'B', text: 'Add at least one extra week' },
            { label: 'C', text: 'Combine it with writing' },
          ],
          answer: 'B',
          explanation: 'Dr. Evans says "I\'d recommend building in a contingency of at least one extra week for the analysis phase".',
        },
        {
          number: 29, type: 'fill',
          label: 'First theoretical framework:',
          answer: 'Attention Restoration Theory',
          explanation: 'Priya names Attention Restoration Theory and Stress Recovery Theory.',
        },
        {
          number: 30, type: 'fill',
          label: 'Recommended researchers to read:',
          answer: 'Rachel and Stephen Kaplan',
          explanation: 'Dr. Evans suggests looking at Rachel and Stephen Kaplan\'s work on Restorative Environments.',
        },
      ],
    },

    // ── SECTION 4 ──────────────────────────────
    {
      number: 4,
      title: 'The History of Glass',
      context: 'A lecturer gives a talk on the history and science of glass production.',
      transcript: `
Lecturer: Today I want to explore the remarkable history of glass — a material so ubiquitous that we barely notice it, yet one that has fundamentally transformed civilisation.

The earliest known glass objects date back approximately five thousand years to Mesopotamia and ancient Egypt. These weren't windows or lenses, but small decorative beads and vessels, often coloured with mineral oxides — cobalt for blue, iron for green. The process was labour-intensive and the results inconsistent by modern standards, but the fascination with this magical material was unmistakable.

For much of its early history, glass was a luxury commodity reserved for royalty and the elite. The Romans made significant advances, discovering that adding manganese could decolourise glass, producing a clearer material. They also developed blowing techniques that allowed craftsmen to create thin-walled vessels far more efficiently than grinding or casting.

The transformative shift in glass production came with the establishment of glassmaking centres on the island of Murano, near Venice, in the thirteenth century. Venetian glassmakers were masters of their craft, and the republic recognised that their skills were a vital economic asset. Glassmakers were granted noble status and extraordinary privileges — but were also forbidden from leaving the island under penalty of death, effectively making them gilded prisoners. This concentration of expertise on Murano allowed for rapid innovation. Venetian craftsmen developed cristallo, an exceptionally pure and clear form of glass, and later the technique of making millefiori — meaning a thousand flowers — a decorative technique using fused coloured glass canes.

The invention of lead crystal glass in seventeenth-century England by George Ravenscroft marked another revolution. By substituting lead oxide for traditional calcium, Ravenscroft produced a glass with a higher refractive index, giving it exceptional brilliance and clarity. This became the basis for fine glassware and optical lenses.

In the twentieth century, the float glass process, developed by Sir Alastair Pilkington in nineteen fifty-nine, transformed architectural and industrial glass production. In this process, molten glass is poured onto a bath of molten tin. Because the glass floats on the tin, it spreads to a uniform thickness and achieves a perfectly flat surface without polishing. This technique remains the dominant method of flat glass production to this day, accounting for over ninety percent of the world's flat glass output.

Glass continues to evolve. Gorilla Glass, developed by Corning, is now used in billions of smartphones, while smart glass that can switch from transparent to opaque in response to electrical current is becoming increasingly common in architecture. From a bead in an Egyptian tomb to the screen in your pocket, glass has been a silent partner in human progress.
      `.trim(),
      questionRange: [31, 40],
      instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      questions: [
        {
          number: 31, type: 'fill',
          label: 'Age of earliest glass objects (years):',
          answer: '5000',
          explanation: 'The earliest glass objects date back approximately five thousand years.',
        },
        {
          number: 32, type: 'fill',
          label: 'Region of origin of earliest glass:',
          answer: 'Mesopotamia',
          explanation: 'The earliest glass came from Mesopotamia and ancient Egypt.',
        },
        {
          number: 33, type: 'fill',
          label: 'Mineral oxide for blue glass:',
          answer: 'cobalt',
          explanation: 'Cobalt was used for blue colouring; iron for green.',
        },
        {
          number: 34, type: 'fill',
          label: 'Roman additive to decolourise glass:',
          answer: 'manganese',
          explanation: 'Romans discovered that adding manganese could decolourise glass.',
        },
        {
          number: 35, type: 'fill',
          label: 'Century glassmaking centre established on Murano:',
          answer: '13th',
          explanation: 'Glassmaking centres were established on Murano in the thirteenth century.',
        },
        {
          number: 36, type: 'fill',
          label: 'Venetian clear glass called:',
          answer: 'cristallo',
          explanation: 'Venetian craftsmen developed cristallo, an exceptionally pure and clear form of glass.',
        },
        {
          number: 37, type: 'fill',
          label: 'Inventor of lead crystal glass:',
          answer: 'George Ravenscroft',
          explanation: 'Lead crystal glass was invented by George Ravenscroft in seventeenth-century England.',
        },
        {
          number: 38, type: 'fill',
          label: 'Material glass floats on in float glass process:',
          answer: 'tin',
          explanation: 'In the float glass process, molten glass is poured onto a bath of molten tin.',
        },
        {
          number: 39, type: 'fill',
          label: 'Year float glass process developed:',
          answer: '1959',
          explanation: 'The float glass process was developed by Alastair Pilkington in nineteen fifty-nine.',
        },
        {
          number: 40, type: 'mcq',
          stem: 'What percentage of flat glass is produced by the float process today?',
          options: [
            { label: 'A', text: 'Over 70%' },
            { label: 'B', text: 'Over 80%' },
            { label: 'C', text: 'Over 90%' },
          ],
          answer: 'C',
          explanation: 'The lecturer states the float process accounts for "over ninety percent of the world\'s flat glass output".',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// TEST 2
// ─────────────────────────────────────────────
const listeningTest2: IELTSListeningTest = {
  id: 2,
  title: 'IELTS Academic Listening – Test 2',
  sections: [
    // ── SECTION 1 ──────────────────────────────
    {
      number: 1,
      title: 'Sports Centre Registration',
      context: 'A woman, Lisa, is registering at a new sports centre by phone.',
      transcript: `
Receptionist: Good afternoon, Lakeside Sports Centre. How can I help?
Lisa: Hi, I'd like to register for membership, please.
Receptionist: Of course. Could I start with your full name?
Lisa: It's Lisa Patel. That's P-A-T-E-L.
Receptionist: Thank you. And your date of birth?
Lisa: Second of June, nineteen eighty-eight.
Receptionist: And your home address?
Lisa: Twelve, Elmwood Close, Lakeside, and the postcode is LS7 4NQ.
Receptionist: LS7 4NQ. And a contact number?
Lisa: Home is 01423 887 221. I don't really use my mobile.
Receptionist: That's fine. Occupation?
Lisa: I'm a physiotherapist. I work at the general hospital just nearby.
Receptionist: Great. Which membership would you like? We have Monthly at thirty-five pounds, Quarterly at ninety-five pounds — that's a saving — or Annual at three hundred and forty pounds, which works out the cheapest per month.
Lisa: I'll go for the Quarterly, I think, and see how it goes.
Receptionist: Smart choice. And are you interested in any of our add-on services? We have personal training, group fitness classes, or nutrition consultations.
Lisa: Just the group fitness classes, please.
Receptionist: Perfect. Those are included twice a week under your membership. Now, your first visit — we'd recommend booking an induction session with one of our trainers so you can learn the equipment. These are on Mondays and Thursdays at nine AM or six PM.
Lisa: Thursday at six PM works perfectly.
Receptionist: Lovely. And how did you hear about us?
Lisa: A colleague recommended you. She's been coming for two years and loves it.
Receptionist: Wonderful. I'll send you a confirmation email with all the details and your membership number. Is the email address the same as the contact number you gave?
Lisa: Oh no, email is lisa underscore patel at citymed dot org.
Receptionist: Got it. You're all set. See you Thursday!
      `.trim(),
      questionRange: [1, 10],
      instructions: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      questions: [
        {
          number: 1, type: 'fill',
          label: 'Surname (spelled):',
          answer: 'Patel',
          explanation: 'Lisa spells her surname: P-A-T-E-L.',
        },
        {
          number: 2, type: 'fill',
          label: 'Date of birth:',
          answer: '2 June 1988',
          explanation: 'She says "Second of June, nineteen eighty-eight".',
        },
        {
          number: 3, type: 'fill',
          label: 'Street name:',
          answer: 'Elmwood Close',
          explanation: 'Her address is 12 Elmwood Close.',
        },
        {
          number: 4, type: 'fill',
          label: 'Postcode:',
          answer: 'LS7 4NQ',
          explanation: 'The postcode is LS7 4NQ.',
        },
        {
          number: 5, type: 'fill',
          label: 'Home phone:',
          answer: '01423 887 221',
          explanation: 'Lisa gives her home number as 01423 887 221.',
        },
        {
          number: 6, type: 'fill',
          label: 'Occupation:',
          answer: 'physiotherapist',
          explanation: 'Lisa says she is a physiotherapist.',
        },
        {
          number: 7, type: 'mcq',
          stem: 'Which membership does Lisa choose?',
          options: [{ label: 'A', text: 'Monthly' }, { label: 'B', text: 'Quarterly' }, { label: 'C', text: 'Annual' }],
          answer: 'B',
          explanation: 'Lisa says "I\'ll go for the Quarterly".',
        },
        {
          number: 8, type: 'fill',
          label: 'Add-on service selected:',
          answer: 'group fitness classes',
          explanation: 'Lisa requests only the group fitness classes.',
        },
        {
          number: 9, type: 'fill',
          label: 'Induction session booked (day & time):',
          answer: 'Thursday 6 PM',
          explanation: 'Lisa chooses Thursday at six PM for her induction.',
        },
        {
          number: 10, type: 'fill',
          label: 'Email domain:',
          answer: 'citymed',
          explanation: 'Her email is at citymed.org.',
        },
      ],
    },

    // ── SECTION 2 ──────────────────────────────
    {
      number: 2,
      title: 'Harborview Science Museum',
      context: 'A museum guide gives an orientation talk to new volunteers.',
      transcript: `
Guide: Good morning, everyone, and welcome to Harborview Science Museum. I'm so pleased you've chosen to give your time as volunteers here. Before we do anything else, let me walk you through the key facts about the museum and your role.

We opened our doors in two thousand and three and since then have welcomed over four million visitors. The museum currently houses six permanent galleries and two temporary exhibition spaces. Our biggest draw is undoubtedly the Space Exploration Gallery — it accounts for roughly thirty percent of visitor footfall, particularly popular with school groups.

For volunteers, your primary role is visitor engagement. That means answering questions, pointing people in the right direction, and helping to run our hands-on science demonstrations. Demonstrations run every hour on the hour from ten AM, and we need at least two volunteers per demonstration. Please make sure you've attended the demonstration training session before you're rostered onto the floor.

On the subject of practicalities: you must sign in at the volunteer desk — that's just past the main reception on the left — at least fifteen minutes before your shift starts. We ask you to wear your volunteer lanyard at all times; this is both for identification and security purposes. Your lanyard also gives you access to the staff canteen on level two, where you can get hot drinks and a subsidised lunch.

If a visitor has a complaint or you encounter an emergency situation, please don't try to handle it alone. Use the radio clipped to your lanyard to contact the duty manager, whose name and extension will be on your induction sheet.

We want our visitors to have an outstanding experience, and you are central to that. Thank you again, and let's go and make science exciting!
      `.trim(),
      questionRange: [11, 20],
      instructions: 'Complete the notes below, or choose the correct letter A, B, or C.',
      questions: [
        {
          number: 11, type: 'fill',
          label: 'Year museum opened:',
          answer: '2003',
          explanation: 'The guide says "We opened our doors in two thousand and three".',
        },
        {
          number: 12, type: 'fill',
          label: 'Total visitors since opening (millions):',
          answer: '4',
          explanation: 'The museum has welcomed over four million visitors.',
        },
        {
          number: 13, type: 'fill',
          label: 'Number of permanent galleries:',
          answer: '6',
          explanation: 'The museum currently houses six permanent galleries.',
        },
        {
          number: 14, type: 'fill',
          label: 'Most popular gallery:',
          answer: 'Space Exploration Gallery',
          explanation: 'The Space Exploration Gallery accounts for roughly 30% of visitor footfall.',
        },
        {
          number: 15, type: 'mcq',
          stem: 'What is the primary role of volunteers?',
          options: [
            { label: 'A', text: 'Selling tickets and merchandise' },
            { label: 'B', text: 'Visitor engagement and demonstrations' },
            { label: 'C', text: 'Maintaining exhibits' },
          ],
          answer: 'B',
          explanation: 'The guide says the primary role is visitor engagement — answering questions and running demonstrations.',
        },
        {
          number: 16, type: 'fill',
          label: 'How often demonstrations run:',
          answer: 'every hour',
          explanation: 'Demonstrations run every hour on the hour from ten AM.',
        },
        {
          number: 17, type: 'fill',
          label: 'Minimum volunteers per demonstration:',
          answer: '2',
          explanation: 'At least two volunteers are needed per demonstration.',
        },
        {
          number: 18, type: 'fill',
          label: 'Minutes before shift volunteers must sign in:',
          answer: '15',
          explanation: 'Volunteers must sign in at least fifteen minutes before their shift.',
        },
        {
          number: 19, type: 'fill',
          label: 'Level of staff canteen:',
          answer: '2',
          explanation: 'The staff canteen is on level two.',
        },
        {
          number: 20, type: 'mcq',
          stem: 'What should volunteers do if they face a complaint or emergency?',
          options: [
            { label: 'A', text: 'Handle it themselves' },
            { label: 'B', text: 'Call the police' },
            { label: 'C', text: 'Contact the duty manager by radio' },
          ],
          answer: 'C',
          explanation: 'The guide says to use the radio on the lanyard to contact the duty manager.',
        },
      ],
    },

    // ── SECTION 3 ──────────────────────────────
    {
      number: 3,
      title: 'Urban Farming Research',
      context: 'Two students, Sam and Nina, discuss their presentation on urban farming with their supervisor, Professor Hall.',
      transcript: `
Professor Hall: Good, Sam, Nina — let's talk about your presentation. Where are you with the research?
Sam: We've gathered quite a lot of material. The core argument we're making is that urban vertical farming has the potential to dramatically reduce food miles and improve urban food security, but the energy costs are a significant barrier at the moment.
Professor Hall: That's a well-framed tension. How are you structuring the presentation?
Nina: We're starting with a brief history of urban farming — going back to the wartime "victory gardens" of the nineteen forties. Then we move to the contemporary context, focusing on vertical farms using hydroponics and LED lighting.
Professor Hall: Good historical grounding. What about the quantitative data?
Sam: We found a study comparing energy consumption per kilogram of produce between a vertical farm and a conventional farm. The vertical farm used about eleven times more electricity, but the land use was ninety-five percent lower.
Professor Hall: That's quite a striking statistic. Have you looked at the carbon footprint comparison, factoring in transport?
Nina: Yes. When you include the carbon cost of transporting conventional produce over an average of fifteen hundred kilometres, the vertical farm's overall footprint can be competitive — particularly if the farm uses renewable energy.
Professor Hall: Good. What cases are you using as examples?
Sam: We've chosen three. A commercial lettuce farm in Tokyo, a community project in Detroit, and a corporate research facility in Singapore. The Singapore one is especially interesting because they've partnered with the national grid to run entirely on solar.
Professor Hall: Impressive choice. What's the weakest part of your argument so far?
Nina: Probably the economic viability section. The capital costs for setting up a vertical farm are extremely high, and we've struggled to find reliable data on the break-even timelines.
Professor Hall: I'd suggest looking at the journal Sustainable Agriculture and Food Security — there's a good meta-analysis published two years ago that includes cost projections from twenty-three different case studies. That should strengthen your argument considerably.
Nina: Great, I'll look that up.
Professor Hall: What's your conclusion going to be?
Sam: That vertical farming is a promising but not yet scalable solution. It needs policy support — subsidies or tax incentives — and continued advances in photovoltaic efficiency before it can compete economically with conventional agriculture.
Professor Hall: A measured and defensible conclusion. Make sure you leave enough time for questions at the end. I'd suggest nine minutes for presentation and six for Q and A.
      `.trim(),
      questionRange: [21, 30],
      instructions: 'Choose the correct letter, A, B, or C, or complete the notes.',
      questions: [
        {
          number: 21, type: 'mcq',
          stem: 'What is the main argument of the students\' presentation?',
          options: [
            { label: 'A', text: 'Urban farming is fully economically viable today.' },
            { label: 'B', text: 'Vertical farming can reduce food miles but faces energy costs.' },
            { label: 'C', text: 'Traditional farming is more sustainable than vertical farming.' },
          ],
          answer: 'B',
          explanation: 'Sam says vertical farming can reduce food miles but "energy costs are a significant barrier".',
        },
        {
          number: 22, type: 'fill',
          label: 'Historical reference used: wartime ___',
          answer: 'victory gardens',
          explanation: 'Nina mentions the wartime "victory gardens" of the nineteen forties.',
        },
        {
          number: 23, type: 'fill',
          label: 'Technology used in contemporary vertical farms:',
          answer: 'hydroponics',
          explanation: 'The students focus on vertical farms using hydroponics and LED lighting.',
        },
        {
          number: 24, type: 'fill',
          label: 'Electricity use in vertical farms vs conventional (times more):',
          answer: '11',
          explanation: 'The vertical farm used about eleven times more electricity.',
        },
        {
          number: 25, type: 'fill',
          label: 'Land use reduction in vertical farms (%):',
          answer: '95',
          explanation: 'The land use was ninety-five percent lower in vertical farms.',
        },
        {
          number: 26, type: 'fill',
          label: 'Average transport distance for conventional produce (km):',
          answer: '1500',
          explanation: 'The carbon cost of transport is calculated over an average of fifteen hundred kilometres.',
        },
        {
          number: 27, type: 'mcq',
          stem: 'Which case study uses entirely renewable energy?',
          options: [
            { label: 'A', text: 'Tokyo' },
            { label: 'B', text: 'Detroit' },
            { label: 'C', text: 'Singapore' },
          ],
          answer: 'C',
          explanation: 'The Singapore facility runs entirely on solar energy.',
        },
        {
          number: 28, type: 'fill',
          label: 'Weakest section of the argument:',
          answer: 'economic viability',
          explanation: 'Nina says the economic viability section is the weakest part.',
        },
        {
          number: 29, type: 'fill',
          label: 'Journal recommended by Professor Hall:',
          answer: 'Sustainable Agriculture and Food Security',
          explanation: 'The professor recommends the journal Sustainable Agriculture and Food Security.',
        },
        {
          number: 30, type: 'fill',
          label: 'Minutes recommended for Q&A:',
          answer: '6',
          explanation: 'Professor Hall suggests six minutes for Q&A.',
        },
      ],
    },

    // ── SECTION 4 ──────────────────────────────
    {
      number: 4,
      title: 'The Psychology of Colour',
      context: 'A lecturer gives a talk on how colour affects human psychology and behaviour.',
      transcript: `
Lecturer: Today's lecture examines the psychology of colour — that is, how the colours we see in our environment influence our emotions, cognition, and even our physical responses.

Let's begin with some historical context. The systematic study of colour psychology is relatively modern, but humans have long intuited its power. Ancient Egyptians, for example, used specific colours in their temples and healing chambers — blue and green were associated with health and regeneration, while red was linked to vitality and danger.

In the early twentieth century, Rudolf Steiner — better known as a philosopher and educationalist — conducted informal experiments suggesting that different colours induced different mood states. But it was not until the mid-twentieth century that more rigorous scientific investigations began.

One of the most-cited early findings is the "Baker-Miller Pink" phenomenon. In the nineteen seventies, researcher Alexander Schauss claimed that exposing agitated individuals to a particular shade of pink — officially named Baker-Miller Pink — rapidly reduced aggression and muscle strength. Several US correctional facilities painted holding cells this shade as a result. However, subsequent replications failed to consistently reproduce the effect, and the finding remains controversial.

What is better established is the influence of colour on attention and memory. Research by Patricia Valdez and Albert Mehrabian in nineteen ninety-four demonstrated that colours in the blue-green range are associated with positive affect and low arousal — states that favour focused study. In contrast, highly saturated red has been shown to impair performance on complex cognitive tasks, though it can boost performance on simple, detail-oriented tasks such as proofreading.

Colour also influences consumer behaviour significantly. Studies show that colour accounts for up to ninety percent of snap judgements made about products. A logo or product colour misaligned with consumer expectations can reduce purchase intent substantially. The specific effects vary by culture: white, for instance, is associated with purity in Western cultures but with mourning in parts of East Asia. Successful global brands invest heavily in understanding these cultural colour associations.

The relationship between colour and appetite is particularly well documented. Red and yellow have been shown to stimulate appetite — you'll notice these feature prominently in the branding of major fast-food chains. Blue, conversely, is considered an appetite suppressant. In one widely cited experiment, participants ate significantly less food when served under blue lighting compared to red or white lighting.

Finally, a word on colour and workplace design. The colour of an office significantly affects employee mood and productivity. Green environments are associated with creativity, while blue promotes efficiency and focus. Yellow can stimulate innovation but in excess can cause anxiety. Many modern organisations now use evidence-based colour design in their workplaces.

In summary, while the science of colour psychology is nuanced and culturally mediated, the evidence that colour meaningfully influences human psychology and behaviour is robust.
      `.trim(),
      questionRange: [31, 40],
      instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      questions: [
        {
          number: 31, type: 'fill',
          label: 'Egyptian colour associated with health:',
          answer: 'blue',
          explanation: 'Blue and green were associated with health and regeneration by ancient Egyptians.',
        },
        {
          number: 32, type: 'fill',
          label: 'Early colour psychologist (educationalist):',
          answer: 'Rudolf Steiner',
          explanation: 'Rudolf Steiner, philosopher and educationalist, conducted early experiments on colour and mood.',
        },
        {
          number: 33, type: 'fill',
          label: 'Decade of Baker-Miller Pink experiments:',
          answer: '1970s',
          explanation: 'Alexander Schauss\'s Baker-Miller Pink experiments took place in the nineteen seventies.',
        },
        {
          number: 34, type: 'mcq',
          stem: 'What does current research say about the Baker-Miller Pink finding?',
          options: [
            { label: 'A', text: 'It has been universally confirmed.' },
            { label: 'B', text: 'It has not been consistently reproduced.' },
            { label: 'C', text: 'It only works outside the US.' },
          ],
          answer: 'B',
          explanation: 'The lecturer says "subsequent replications failed to consistently reproduce the effect".',
        },
        {
          number: 35, type: 'fill',
          label: 'Colour range associated with positive affect and focused study:',
          answer: 'blue-green',
          explanation: 'Valdez and Mehrabian found the blue-green range is linked to positive affect and low arousal.',
        },
        {
          number: 36, type: 'fill',
          label: 'Task type boosted by red:',
          answer: 'proofreading',
          explanation: 'Red can boost performance on simple detail-oriented tasks such as proofreading.',
        },
        {
          number: 37, type: 'fill',
          label: 'Percentage of snap judgements influenced by colour:',
          answer: '90',
          explanation: 'Colour accounts for up to ninety percent of snap judgements about products.',
        },
        {
          number: 38, type: 'fill',
          label: 'Colour considered an appetite suppressant:',
          answer: 'blue',
          explanation: 'Blue is considered an appetite suppressant; participants ate less under blue lighting.',
        },
        {
          number: 39, type: 'fill',
          label: 'Office colour associated with creativity:',
          answer: 'green',
          explanation: 'Green environments are associated with creativity.',
        },
        {
          number: 40, type: 'fill',
          label: 'Office colour that can cause anxiety in excess:',
          answer: 'yellow',
          explanation: 'Yellow can stimulate innovation but in excess can cause anxiety.',
        },
      ],
    },
  ],
};

export const ieltsListeningTests: IELTSListeningTest[] = [listeningTest1, listeningTest2];
