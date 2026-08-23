#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { targetSecondsFor, wordCount } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'generated/Intermediate.json');
const arr = JSON.parse(fs.readFileSync(file, 'utf8'));

const EXTRA = {
  i39: `A family recipe book sitting beside a nutrition paper is a good picture of the tension. The recipe carries memory: a grandmother’s hand, a holiday smell, a reason to gather. The paper carries measurement: salt, sugar, risk. People do not have to throw either book away. They can cook the dish less often, change one ingredient, or keep the ritual while updating the science. Tradition then becomes a conversation partner, not a tyrant.

Data has limits too. Studies average across bodies; your neighbour’s kitchen does not. If a local practice has kept a community well for generations, that is also evidence, even if it never wore a lab coat. The honest habit is to ask what each source is good at. Stories remember meaning. Numbers remember rates. Holding them together is slower than picking a team, and more adult.`,

  i43: `Consider insulin, heating in a hard winter, or a bus fare that decides whether someone can reach work. When the price of such things floats as if they were fashion, the market is doing something besides signalling taste. It is rationing survival through wallets. That does not mean every essential should be free. It does mean a society can decide that some prices belong under public watch.

Luxury pricing on essentials also distorts language. A bottled water brand can look like choice while the tap is unsafe. A private clinic can look like quality while the public ward waits. If you only see the glossy version, you may conclude that expensive equals necessary. A fairer test is simpler: if a person cannot live decently without it, its price is a political fact, not only a shopping fact.`,

  i44: `A market where everyone bargains sounds lively until you notice who has time, nerve, and language to push. Tourists with cash and a smile often pay less than a tired parent buying the same rice after a night shift. The quiet losers are not always poor in a dramatic sense; they are people who cannot risk a scene, cannot return tomorrow, or cannot decode the “real” price.

Some traders defend bargaining as cultural sport. Sport, though, needs equal players. When one side is hungry and the other is bored, the game is extractive. Posted prices with room for genuine hardship discounts can be kinder than a theatre of haggling. The question is not whether bargaining is charming. It is who pays for the charm.`,

  i45: `A well-run second-hand shop can feel like a small republic of respect: clothes steamed, stories optional, prices honest. A badly run one can feel like a dumping ground where other people’s lives are treated as clutter. The difference is rarely the objects. It is whether staff and customers treat used things as still having dignity.

Respect also travels toward the original owners. Donating stained, broken goods “for the poor” is not generosity; it is offloading. Repair, cleaning, and fair pricing turn surplus into circulation. If used-goods economies are to be more than a trend, they need this ethic as much as they need Instagram shelves.`,

  i46: `Soft loans often arrive with warm words: investment in yourself, a bridge, a little help. The hardness appears later in fees, compounding, and the shame of missing a date printed in small type. Families then treat a financial product as a moral failure, when the product was designed to be sticky.

A useful test is to read the exit. If walking away early is expensive, the loan was never only a favour. Community lending circles, credit unions, and clear public loans are not romantic alternatives; they are attempts to keep help from becoming a trap. Borrowers still need discipline. Lenders still need honesty about what “soft” actually costs.`,

  i47: `Hidden charges thrive in hurry. A booking site adds a “service fee” after you have already pictured the weekend. A restaurant prints a service charge that looks official enough to silence questions. Challenging these costs feels rude, which is part of the design.

Practice helps. Ask, before paying, what the total includes. Ask whether a fee can be removed. Keep the tone flat, not theatrical. If staff cannot explain a line, that is information. Consumer law in many places already treats surprise fees as unfair; using that law is not being difficult. It is refusing to fund opacity.`,

  i48: `A lottery ticket is a cheap story about a different life. That is why it sells when the odds are grim. For some buyers it is entertainment with a known price, like a cinema snack. For others it is a monthly hope budget taken from food or bills. The same product, two moral worlds.

Governments that profit from long-shot tickets sit in an awkward chair. They warn about gambling and collect the revenue. If tickets still sell, it is not because people cannot do maths. It is because inequality makes miracles feel more plausible than raises. Addressing that hunger matters more than mocking the buyer.`,

  i49: `A weekly market stall, a barber who knows your name, a baker who holds a loaf aside: these are not efficient in a spreadsheet sense. They survive because they carry social value that delivery apps cannot bag. Trust is built in repeated small encounters. News travels. Reputation has a face.

When those places close, people do not only lose a product. They lose a reason to be seen. Online ratings try to imitate this, and sometimes they help. They cannot replace the slight bow of recognition when you walk in. Policy that only measures price per unit will keep missing why face-to-face trade still matters.`,

  i50: `Uneven starts inside a family are explosive because they mix love with arithmetic. One sibling inherits a deposit; another inherits advice. Parents may believe they were fair because they “helped when needed,” while children keep different ledgers. Silence does not keep peace; it stores it.

Talking well means naming facts without turning them into a verdict on who was loved. It can include later balancing gifts, or an honest admission that balancing is impossible. What corrodes families is the pretence that money never shaped the map. A calm inventory, perhaps with a third person present, is less dramatic than a blow-up at a funeral, and more useful.`,

  i51: `Taste feels intimate, like a fingerprint. Then you notice how often it arrived in a pack: the radio of your teens, a friend’s irony, a teacher’s praise, an algorithm’s next suggestion. Training is not a conspiracy. It is how culture works. The honest question is how much of your taste you would still defend after the crowd left the room.

A practical check is to borrow against your habits. Spend a month with music, food, or clothes you usually mock, and keep notes without performing them. You may return unchanged, which is also data. You may find that “personal” was partly a neighbourhood. Either way, taste becomes something you can revise rather than a flag you must guard.`,

  i52: `A single demanding novel, film, or piece of music can retrain attention because it refuses to reward skimming. You either stay or leave. In a feed, leaving costs nothing and staying is cheaply stimulated. Difficulty, used well, is not snobbery. It is resistance training for the mind.

This does not mean all slow art is virtuous or all popular work is junk. It means attention is a muscle with a diet. If your days are built from fragments, one weekly session with a work that requires patience can change what later fragments feel like. You begin to notice when you are being hurried.`,

  i53: `Calling creative work “fun” is a convenient way to leave it unpaid. Fun and labour can share a room. A gigging musician may love the set and still need rent. A designer’s Saturday project can become a company’s Monday asset. Payment is not an insult to passion. It is recognition that time was spent.

Unpaid making still has a place: gifts, learning, play. The line is crossed when institutions harvest that play as if it were a free department. Ask who profits if the work succeeds. If the answer is not the maker, “fun” has been used as a discount code.`,

  i54: `When publishing is easy, attention becomes the scarce good. Everyone can post; almost no one can be carefully heard. Gatekeepers used to ration printing. Now audiences ration time, often badly, with metrics that reward heat over patience.

Scarcity then shifts to editing, trust, and care. A small magazine that publishes twelve pieces a year may matter more than a feed of thousands. The skill worth practising is not only making more. It is choosing what deserves a second look, and building rooms where that look is possible.`,

  i55: `A kind refusal is a craft. “This is not for us, and here is why, and here is one door that might be” takes longer than silence. Silence feels like contempt. A form email feels like a machine. Specific, bounded critique lets a person keep working without pretending the work was ready.

Gatekeepers who fear being disliked sometimes over-praise, which is another kind of crush: it sends people down a year-long wrong road. Honest no, spoken early, can be a form of respect. The test is whether the refused person still has energy and a map, not whether they left smiling.`,

  i56: `Nostalgia edits like a kindly liar. It keeps the song and drops the queue, the smoke, the unpaid intern, the people who were not welcome. Cultural memory then becomes a theme park of the past’s best lighting. Longing is human; unexamined longing is a poor historian.

A better habit is double vision. Enjoy the old film. Also ask who funded it, who was missing, what the street smelled like. You can love a childhood summer without electing it as a political programme. When memory is allowed to keep its shadows, it becomes useful. When it is only golden, it is advertising.`,

  i57: `Unpaid making needs space that is not always a side hustle pitch. A kitchen table, a borrowed studio hour, a public library table: these are infrastructures of amateur culture. When every hobby is expected to become a brand, people stop beginning.

Cities that keep cheap rooms, evening classes, and tool libraries are not being sentimental. They are protecting the right to make things badly at first. Professional work can grow from that soil. So can joy that never needs to sell. Both are civic goods.`,

  i58: `Difficult art asks for a different contract: you give time, it may give a delayed kind of pleasure. That wait is not automatically noble. Some difficulty is merely bad design. Some is a door with a lock worth picking. The only way to tell is to stay long enough to notice whether meaning thickens or just fog.

A fair approach is to budget difficulty. One demanding work a week is enough for many lives. If nothing opens after honest attention, you may leave without shame. Worth is not proven by suffering. It is proven by a change in what you can notice afterwards.`,

  i59: `Lines around acceptable art, jokes, or public speech are drawn by many hands: law, platforms, audiences, advertisers, and the nervousness of a room. Pretending there is one “the line” flatters whoever currently holds the pen. People still need limits; cruelty is not a style. The adult question is process: who decides, on what evidence, with what appeal.

If a community cannot explain a ban except by panic, the line will move with the next panic. If it can explain harm, power, and context, disagreement remains possible. Drawing lines is not the opposite of freedom. Hidden, unappealable lines are.`,

  i60: `A couple’s private playlist, a family’s holiday film, a city’s mural: shared culture can map a relationship more honestly than slogans about love. You learn what you can sit through together, what you quote, what you refuse. Taste becomes a dialect.

When that map is only consumer brands, the relationship can feel thin. When it includes local jokes, inherited recipes, and arguments about a book, it thickens. Culture here is not decoration. It is the furniture you keep bumping into, which is how you learn the shape of the room.`,

  i61: `A slow clinic teaches improvisation that patients should not have to invent: print records, bring a list, ask a nurse which delay is medical and which is administrative. Waiting is not a personality test. It is a system leaking time onto people with less power.

Useful action is specific. Confirm the referral was sent. Ask for the next cancellation slot. Bring one person who can hear what you miss when anxious. Campaigning for shorter waits is a different job, and both jobs are real. The first keeps you from disappearing in the queue. The second asks why the queue exists.`,

  i62: `Medical talk has hidden rules: who sits, who is interrupted, which pain gets a metaphor, which gets a number. Patients who “perform” well—concise, unemotional, grateful—are often believed sooner. That is not science. It is etiquette mistaken for evidence.

Naming the rules helps you play them without being owned by them. Write symptoms in order. Say what you fear, once, clearly. Ask the clinician to repeat the plan. If the room goes wrong, you can still be polite and precise. Hidden rules lose some power when they are spoken aloud.`,

  i63: `Prevention looks boring in a budget meeting. Treatment looks like a rescue. Cameras love rescues. Yet a cheap vaccine, a damp-free home, or a school meal can prevent years of clinic time. Funding both is not indecision. Illness does not wait for perfect spreadsheets.

The trap is using prevention as an excuse to abandon the already sick. A fair argument says: spend earlier so fewer people need the expensive later, and keep the later humane. If a politician only praises gym memberships while wards close, the word prevention is being used as a broom.`,

  i64: `Vague symptoms—fatigue, dizziness, pain that moves—are where medicine’s confidence thins and bias thickens. People who are believed get tests. People who are not get labels like stress, until something measurable appears, sometimes too late. Belief here is not a hug. It is access.

A patient can help by tracking patterns, bringing a witness, and asking what would change the clinician’s mind. A clinician can help by saying “I don’t know yet” instead of “it’s nothing.” Uncertainty shared is safer than certainty performed. Who gets believed is a fairness issue wearing a white coat.`,

  i65: `Asking for a second opinion sounds like distrust. Framed well, it is collaboration: “I want to understand this from another angle before we decide.” Bring the first notes. Do not trash the first doctor in the corridor. The goal is a better plan, not a courtroom.

Politeness here is strategy, not submission. It keeps doors open. If a clinician punishes the request, that is useful information about the relationship. Good professionals are used to colleagues. Patients should not need a law degree to hear more than one trained voice.`,

  i66: `Waiting rooms are unofficial museums of access. Who is missing work, who brought a child, who can afford the taxi, who understood the letter. Shared space makes inequality visible in a way a website never does. It also creates small solidarities: a saved seat, a translated form, a warning about a long delay.

Designers who only digitise booking can erase those solidarities without erasing the wait. A humane system would shorten the queue and keep a place where people can ask a human being what the letter meant. Access is not only a slot in a calendar. It is whether you can survive the hour before the slot.`,

  i67: `A sleep score can feel like a coach or a critic. The same graph that helps one person change a habit can convince another they are failing at night. Empowerment and anxiety are not opposite apps. They are two uses of the same mirror.

A workable rule is to time-limit tracking. Use it to answer a question, then stop. If the number starts running the day—mood, meals, self-worth—it is no longer information. It is a boss. Health data should serve a decision, not become a personality.`,

  i68: `Forced optimism in sick rooms—“stay positive!”—can isolate the person who is actually afraid. Hope is not the same as a cheerleading ban on grief. Care relationships break when the well person needs the ill person to perform recovery for them.

Better care makes room for mixed weather: hope on Tuesday, fury on Wednesday, jokes on Thursday. Clinicians and relatives who can sit with bad news without immediately decorating it are easier to trust. Optimism that cannot hear pain is not strength. It is a closed door.`,

  i69: `A nearby general clinic can stitch a week back together: an ear that hurts, a form signed, a fear checked before it becomes an emergency department night. Distant experts matter for rare puzzles. They cannot walk your street or know which pharmacy still has stock.

People sometimes treat generalists as a queue to endure on the way to “the real doctor.” That snobbery is expensive. Systems that starve local services send ordinary problems into hospitals, then blame hospitals for crowding. What nearby care provides is continuity, which is a kind of intelligence.`,

  i70: `When experts disagree, patients are often told to “do their own research,” which usually means swimming in panic. A better method is narrower. Ask each expert what would change their mind. Ask what they are watching for next. Ask who they respect on the other side.

Disagreement is not always a scandal. It can mean the evidence is genuinely mixed. Your job is not to become a third specialist overnight. It is to choose a plan you can live with, with a review date, and to refuse the comfort of fake certainty.`,

  i71: `Soft words in clinics—“discomfort,” “a little procedure,” “lifestyle”—can protect dignity or hide stakes. A person who hears “discomfort” may not prepare for pain. A person who hears “lifestyle” may hear blame. Precision can be kind. Bluntness without care is just bluntness.

The skill is matching language to the decision in front of you. If you must consent, you need the hard nouns. If you are leaving the room with hope intact, you may need gentler pacing. Ask: “What does that word mean in my case?” Softness is a tool. It should not be a fog machine.`,
};

let n = 0;
for (const lesson of arr) {
  const extra = EXTRA[lesson.id];
  if (!extra) continue;
  if (wordCount(lesson.text) >= 420) continue;
  lesson.text = `${lesson.text.trim()}\n\n${extra.trim()}`;
  lesson.targetSeconds = targetSecondsFor(lesson.text);
  n++;
}

fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
const words = arr.map((l) => wordCount(l.text));
const short = arr.filter((l) => wordCount(l.text) < 400);
console.log('expanded', n, 'words', Math.min(...words) + '-' + Math.max(...words), 'avg', Math.round(words.reduce((a, b) => a + b, 0) / words.length), 'under400', short.length);
if (short.length) console.log(short.map((l) => `${l.id}:${wordCount(l.text)}`).join(', '));
