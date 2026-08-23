#!/usr/bin/env node
/**
 * Completes en-curriculum-plan.json for Elementary→Advanced and writes meta extracts + docs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const planPath = path.join(__dirname, 'en-curriculum-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

function topics(prefix, start, unitIndex, unitName, items) {
  return items.map((it, i) => {
    const id = `${prefix}${start + i}`;
    return {
      id,
      title: it[0],
      coreQuestion: it[1],
      format: it[2],
      grammarFocus: it[3],
      vocabularyDomain: it[4],
      languageGoal: it[5],
      communicationGoal: it[6],
    };
  });
}

function unit(index, name, theme, prefix, start, items) {
  return {
    index,
    name,
    theme,
    topics: topics(prefix, start, index, name, items).map((t) => t),
  };
}

// Each item: [title, coreQuestion, format, grammarFocus[], vocabDomain, languageGoal, communicationGoal]

plan.levels.Elementary = {
  cefr: 'A2–B1-',
  grammarFocus: [
    'past narrative',
    'comparatives/superlatives',
    'modals',
    'first conditional',
    'present perfect intro',
    'opinions',
  ],
  units: [
    unit(1, 'Memories & Firsts', 'Formative first experiences and early memories', 'e', 1, [
      ['What was your first day like?', 'How do people remember a first day?', 'short story', ['past simple', 'feelings'], 'first days', 'Narrate a first-day memory', 'Share an early personal experience'],
      ['When did you first feel proud?', 'What moments create pride?', 'short story', ['past simple', 'because'], 'emotions & achievement', 'Explain a proud moment', 'Talk about personal success'],
      ['Who taught you to ride a bike?', 'How do first skills get learned?', 'dialogue', ['past simple', 'could'], 'learning skills', 'Describe learning a practical skill', 'Credit someone who helped you'],
      ['What is your earliest memory?', 'Which childhood scenes stay with us?', 'short story', ['past simple', 'used to intro'], 'childhood', 'Describe a distant memory', 'Compare early memories with friends'],
      ['Have you ever got lost?', 'What happens in a small emergency?', 'short story', ['present perfect', 'past simple'], 'problems', 'Tell a problem-and-solution story', 'Reassure someone with a past example'],
      ['What changed after you moved?', 'How does moving home feel?', 'email', ['past simple', 'comparatives'], 'moving house', 'Compare old and new places', 'Write about a life change'],
      ['When did you first cook alone?', 'What makes a first independent task memorable?', 'short story', ['past simple', 'sequencers'], 'independence', 'Sequence a first cooking story', 'Describe learning by doing'],
      ['Was your first job hard?', 'How do young people start working?', 'dialogue', ['past simple', 'modals should'], 'first jobs', 'Discuss early work experiences', 'Give advice from experience'],
      ['What photo do you keep?', 'Why do objects hold memories?', 'short story', ['present perfect', 'because'], 'keepsakes', 'Explain the meaning of an object', 'Share sentimental stories'],
      ['If you could restart one day, which?', 'Which past days feel unfinished?', 'opinion', ['first conditional', 'would'], 'reflection', 'Hypothesize about the past lightly', 'Discuss regrets without drama'],
    ]),
    unit(2, 'People Who Shape Us', 'Influence of family, mentors, peers', 'e', 11, [
      ['Who listens to you best?', 'What makes someone a good listener?', 'dialogue', ['present simple', 'modals'], 'listening', 'Describe supportive behaviour', 'Praise someone thoughtfully'],
      ['How is your uncle different from your dad?', 'How do family roles compare?', 'short story', ['comparatives', 'adjectives'], 'family roles', 'Compare two relatives', 'Talk about family personalities'],
      ['What makes a fair teacher?', 'Which teacher habits help learners?', 'opinion', ['should', 'because'], 'education people', 'Give reasoned opinions about teaching', 'Discuss fairness at school'],
      ['Have you ever disagreed with a friend?', 'How do friends repair conflict?', 'dialogue', ['past simple', 'should'], 'friendship conflict', 'Narrate and resolve disagreement', 'Practise polite disagreement'],
      ['Who inspires you to try harder?', 'What influence feels positive?', 'short story', ['present perfect', 'because'], 'role models', 'Explain inspiration', 'Talk about positive influence'],
      ['What advice did your grandma give?', 'Which short advice sticks?', 'short story', ['past simple', 'reported light'], 'advice', 'Retell advice in your words', 'Pass on useful tips'],
      ['Are neighbours still important?', 'How do local relationships work now?', 'opinion', ['comparatives', 'used to'], 'community', 'Compare past/present neighbour life', 'Discuss local connection'],
      ['When should you say no?', 'How do people set gentle boundaries?', 'dialogue', ['modals', 'first conditional'], 'boundaries', 'Refuse politely', 'Protect time and energy'],
      ['Who made you laugh yesterday?', 'How does humour connect people?', 'short story', ['past simple', 'past continuous'], 'humour', 'Tell a funny interpersonal story', 'Share light social moments'],
      ['What do you admire in quiet people?', 'Can quiet traits be strengths?', 'opinion', ['modals might', 'adjectives'], 'personality', 'Defend a less obvious strength', 'Appreciate different personalities'],
    ]),
    unit(3, 'Towns, Trips & Discovery', 'Local exploration and short travel', 'e', 21, [
      ['Is your town better in summer or winter?', 'How do seasons change a place?', 'opinion', ['comparatives', 'because'], 'seasons & place', 'Compare seasonal city life', 'Recommend when to visit'],
      ['What did you notice on the slow train?', 'What details appear when you travel slowly?', 'short story', ['past continuous', 'past simple'], 'train travel', 'Narrate observational travel', 'Describe journey atmosphere'],
      ['Should tourists learn three local phrases?', 'Does language effort change travel?', 'dialogue', ['should', 'first conditional'], 'travel language', 'Argue for basic local language', 'Encourage respectful travel'],
      ['Where do locals actually eat?', 'How do you avoid tourist traps?', 'email', ['modals', 'imperatives soft'], 'local food', 'Give practical local tips', 'Recommend authentic places'],
      ['Have you ever missed a bus on purpose?', 'When is delay strangely useful?', 'short story', ['present perfect', 'past simple'], 'chance moments', 'Tell an unexpected discovery story', 'Reflect on unplanned events'],
      ['Which street feels most alive at night?', 'What makes nightlife welcoming?', 'description', ['there is/are', 'adjectives'], 'urban night', 'Describe night-time atmosphere', 'Compare daytime vs night streets'],
      ['Was the museum worth the queue?', 'How do we judge cultural visits?', 'dialogue', ['past simple', 'worth'], 'museums', 'Evaluate an experience', 'Discuss expectations vs reality'],
      ['What would you show a visitor in three hours?', 'How do you curate a short tour?', 'email', ['would', 'sequencers'], 'city tour', 'Plan a short itinerary', 'Host a visitor thoughtfully'],
      ['Did the map help or confuse you?', 'When do tools fail travellers?', 'short story', ['past simple', 'but/so'], 'navigation', 'Narrate a navigation mishap', 'Laugh at travel mistakes'],
      ['If it rains all weekend, where can you go?', 'How do cities plan for bad weather?', 'opinion', ['first conditional', 'can'], 'indoor options', 'Suggest indoor alternatives', 'Problem-solve weekend plans'],
    ]),
    unit(4, 'Food, Guests & Sharing', 'Hospitality, meals, cultural food talk', 'e', 31, [
      ['What makes a guest feel welcome?', 'Which small acts create hospitality?', 'opinion', ['should', 'because'], 'hospitality', 'Advise hosts', 'Create welcoming atmosphere'],
      ['Have you ever cooked for five people?', 'How do hosts manage group meals?', 'short story', ['present perfect', 'past simple'], 'cooking for others', 'Narrate hosting a meal', 'Talk about pressure and care'],
      ['Is street food safer than it looks?', 'How do we judge food safety casually?', 'dialogue', ['modals might', 'comparatives'], 'street food', 'Weigh risk and pleasure', 'Discuss food choices when travelling'],
      ['Why do shared meals feel longer?', 'What changes when we eat together?', 'short story', ['present simple', 'because'], 'shared meals', 'Explain social eating', 'Value slow meals'],
      ['What dish reminds you of home?', 'How does food carry memory?', 'email', ['present simple', 'present perfect'], 'comfort food', 'Connect food and belonging', 'Share cultural dishes'],
      ['Should guests help wash up?', 'What are unspoken hosting rules?', 'dialogue', ['should', 'would'], 'etiquette', 'Negotiate polite help', 'Discuss cultural expectations'],
      ['When did a recipe go wrong?', 'How do cooking failures become stories?', 'short story', ['past simple', 'sequencers'], 'kitchen fails', 'Tell a funny failure narrative', 'Normalise mistakes'],
      ['Is sweet or savoury better for celebrations?', 'How do tastes mark special days?', 'opinion', ['comparatives', 'prefer'], 'celebration food', 'Defend a taste preference', 'Talk about festive food'],
      ['What would you bring to a potluck?', 'How do you choose food for a group?', 'message', ['would', 'because'], 'potluck', 'Propose a contribution', 'Coordinate shared meals'],
      ['If someone is vegetarian, how do you adapt?', 'How do hosts include dietary needs?', 'dialogue', ['first conditional', 'can'], 'dietary needs', 'Adapt menus politely', 'Include everyone at table'],
    ]),
    unit(5, 'Health, Habits & Feeling Well', 'Daily health, rest, small wellbeing choices', 'e', 41, [
      ['Do you sleep better with a routine?', 'How do habits affect sleep?', 'opinion', ['present simple', 'if'], 'sleep', 'Discuss sleep habits', 'Suggest practical changes'],
      ['Have you ever walked instead of taking the bus?', 'When does a small choice help health?', 'short story', ['present perfect', 'comparatives'], 'active travel', 'Narrate a healthier choice', 'Motivate gentle activity'],
      ['Should phones stay outside the bedroom?', 'What boundaries help rest?', 'dialogue', ['should', 'first conditional'], 'digital habits', 'Debate a sleep boundary', 'Negotiate household rules'],
      ['What does “enough water” mean for you?', 'How do people track simple health goals?', 'blog note', ['modals', 'present simple'], 'hydration', 'Talk about personal health targets', 'Avoid extreme advice'],
      ['When did rest feel productive?', 'Can resting be a smart decision?', 'short story', ['past simple', 'because'], 'rest', 'Reframe rest positively', 'Justify taking a break'],
      ['Is a short walk better than nothing?', 'How do we start fitness without pressure?', 'opinion', ['comparatives', 'modals'], 'fitness', 'Encourage small steps', 'Discuss realistic exercise'],
      ['What snack actually helps you study?', 'Which foods support concentration?', 'dialogue', ['present simple', 'might'], 'study fuel', 'Share practical snack ideas', 'Link food and focus'],
      ['Have you ever ignored a small pain?', 'When should people seek help?', 'short story', ['present perfect', 'should'], 'listening to body', 'Narrate a health lesson', 'Advise seeking care'],
      ['Who helps you stay calm?', 'How do social ties support wellbeing?', 'email', ['present simple', 'because'], 'support networks', 'Describe calming people/habits', 'Ask for or offer support'],
      ['If you feel overloaded, what do you drop first?', 'How do priorities protect health?', 'opinion', ['first conditional', 'must/should'], 'priorities', 'Choose what to reduce', 'Protect wellbeing under pressure'],
    ]),
    unit(6, 'Skills, Work & Ambition', 'Learning skills, early work, goals', 'e', 51, [
      ['What skill took longer than you expected?', 'Why do skills need patience?', 'short story', ['past simple', 'took'], 'skill learning', 'Narrate slow progress', 'Encourage persistence'],
      ['Should teenagers have part-time jobs?', 'What are the trade-offs of early work?', 'opinion', ['should', 'advantages'], 'part-time work', 'Weigh pros and cons', 'Discuss youth work'],
      ['Have you ever practised in public?', 'How does performance anxiety feel?', 'short story', ['present perfect', 'feelings'], 'practice', 'Describe practising under eyes', 'Normalise nerves'],
      ['Who gave you useful feedback?', 'What feedback helps growth?', 'dialogue', ['past simple', 'should'], 'feedback', 'Talk about constructive comments', 'Ask for better feedback'],
      ['Is ambition always healthy?', 'When does drive become pressure?', 'opinion', ['modals might', 'comparatives'], 'ambition', 'Qualify ambition', 'Discuss balance'],
      ['What would you teach in twenty minutes?', 'Which skills can you share quickly?', 'email', ['would', 'can'], 'peer teaching', 'Offer to teach a mini-skill', 'Value peer learning'],
      ['Did teamwork make the project better?', 'When does collaboration help?', 'short story', ['past simple', 'because'], 'teamwork', 'Evaluate a group project', 'Reflect on roles'],
      ['How do you start when you feel stuck?', 'What unblocks beginners?', 'dialogue', ['imperatives soft', 'modals'], 'getting unstuck', 'Share starter strategies', 'Help a stuck peer'],
      ['Have you improved more by copying or inventing?', 'Which learning path fits you?', 'opinion', ['comparatives', 'present perfect'], 'learning styles', 'Compare imitation vs invention', 'Describe personal method'],
      ['If you fail the first try, what next?', 'How do resilient learners respond?', 'message', ['first conditional', 'will'], 'resilience', 'Plan a second attempt', 'Encourage retrying'],
    ]),
    unit(7, 'Nature & Outdoor Life', 'Parks, weather, outdoor habits', 'e', 61, [
      ['What does a park give a city?', 'Why do green spaces matter locally?', 'opinion', ['because', 'modals'], 'parks', 'Argue for local green space', 'Appreciate everyday nature'],
      ['Have you ever watched birds for an hour?', 'What happens when you slow down outdoors?', 'short story', ['present perfect', 'past continuous'], 'birdwatching', 'Narrate quiet observation', 'Value slow attention'],
      ['Should phones be silent on trails?', 'What etiquette fits outdoor spaces?', 'dialogue', ['should', 'if'], 'outdoor etiquette', 'Negotiate shared outdoor norms', 'Protect calm spaces'],
      ['When did weather change your plans?', 'How do outdoors people adapt?', 'short story', ['past simple', 'so'], 'weather plans', 'Narrate adaptive outdoor plans', 'Stay flexible'],
      ['Is camping comfortable or character-building?', 'What do people gain from basic overnight trips?', 'opinion', ['comparatives', 'might'], 'camping', 'Weigh comfort vs challenge', 'Discuss outdoor overnight trips'],
      ['What wild place is near your home?', 'Where can city people find nature?', 'email', ['there is', 'can'], 'local nature', 'Recommend nearby wild corners', 'Explore locally'],
      ['Have you planted anything that survived?', 'What does growing teach?', 'short story', ['present perfect', 'past simple'], 'gardening', 'Tell a plant-care story', 'Connect care and patience'],
      ['Why do rivers attract walkers?', 'What draws people to water?', 'description', ['present simple', 'because'], 'rivers', 'Describe riverside atmosphere', 'Explain attraction to water'],
      ['What would you pack for a hill walk?', 'How do you prepare safely?', 'message', ['need', 'should'], 'hiking prep', 'List sensible gear', 'Plan a safe walk'],
      ['If the path is crowded, do you turn back?', 'How do people share limited outdoor space?', 'dialogue', ['first conditional', 'modals'], 'crowds outdoors', 'Decide under outdoor pressure', 'Respect shared nature'],
    ]),
    unit(8, 'Stories, Screens & Imagination', 'Books, films, games, creative habits', 'e', 71, [
      ['Which book character feels real to you?', 'How do stories create empathy?', 'opinion', ['because', 'feel like'], 'fiction', 'Explain a character connection', 'Discuss reading taste'],
      ['Have you ever rewatched a film for comfort?', 'Why do people repeat stories?', 'short story', ['present perfect', 'because'], 'comfort media', 'Narrate comfort viewing', 'Talk about emotional media use'],
      ['Should children finish every book they start?', 'Is quitting a book allowed?', 'dialogue', ['should', 'might'], 'reading habits', 'Debate reading rules', 'Defend quitting thoughtfully'],
      ['What game taught you patience?', 'Can play build real skills?', 'short story', ['past simple', 'learned'], 'games', 'Link play and skill', 'Value non-academic learning'],
      ['Is a short story enough for a long train?', 'How do formats fit situations?', 'opinion', ['comparatives', 'suitable'], 'reading formats', 'Match text length to context', 'Recommend travel reading'],
      ['Who do you talk to after a good film?', 'How does conversation extend stories?', 'email', ['present simple', 'after'], 'film talk', 'Invite post-film discussion', 'Share reactions'],
      ['Have screens stolen your boredom?', 'Is boredom useful for imagination?', 'opinion', ['used to', 'present perfect'], 'boredom & screens', 'Argue for productive boredom', 'Reflect on attention'],
      ['What picture lives in your head from childhood?', 'How do images stay with us?', 'short story', ['past simple', 'still'], 'mental images', 'Describe lasting imagery', 'Connect memory and imagination'],
      ['Would you rather write or draw a story?', 'How do creative modes differ?', 'dialogue', ['would rather', 'comparatives'], 'creative modes', 'Compare expressive options', 'Choose a creative path'],
      ['If a story has no ending, is it broken?', 'What do open endings do to readers?', 'opinion', ['first conditional', 'might'], 'endings', 'Discuss narrative closure', 'Tolerate ambiguity'],
    ]),
    unit(9, 'Money, Choices & Small Problems', 'Everyday money and practical decisions', 'e', 81, [
      ['What was your first expensive mistake?', 'How do people learn from spending?', 'short story', ['past simple', 'should have light'], 'spending lessons', 'Narrate a money mistake', 'Share practical lessons'],
      ['Should pocket money be earned?', 'What teaches money responsibility?', 'opinion', ['should', 'because'], 'pocket money', 'Debate allowance models', 'Discuss fairness at home'],
      ['Have you ever saved for something slow?', 'What does waiting change?', 'short story', ['present perfect', 'comparatives'], 'saving', 'Describe delayed gratification', 'Value saving goals'],
      ['Is cheap always worse?', 'How do we judge value?', 'dialogue', ['comparatives', 'modals'], 'value for money', 'Compare price and quality', 'Make careful purchases'],
      ['What would you do with a surprise £20?', 'How do priorities show in small choices?', 'message', ['would', 'because'], 'small windfalls', 'Explain a spending choice', 'Reveal personal priorities'],
      ['When did sharing cost nothing but help a lot?', 'What generosity doesn’t need money?', 'short story', ['past simple', 'because'], 'non-money help', 'Narrate helpful sharing', 'Value non-financial gifts'],
      ['Should friends split bills evenly?', 'What feels fair in money among friends?', 'dialogue', ['should', 'if'], 'splitting costs', 'Negotiate bill fairness', 'Avoid money awkwardness'],
      ['Have you borrowed something and worried?', 'How do trust and objects connect?', 'short story', ['present perfect', 'feelings'], 'borrowing', 'Talk about responsibility for objects', 'Handle borrowing carefully'],
      ['What tiny cost adds up each month?', 'Where do quiet expenses hide?', 'opinion', ['present simple', 'add up'], 'budgets', 'Identify sneaky spending', 'Track small costs'],
      ['If you lose a ticket, who helps first?', 'How do people solve sudden money problems?', 'dialogue', ['first conditional', 'can'], 'sudden problems', 'Seek help under pressure', 'Solve practical emergencies'],
    ]),
    unit(10, 'Goals, Change & Growing Up', 'Personal change, plans, maturity', 'e', 91, [
      ['What habit are you trying to change?', 'How do people reshape routines?', 'email', ['present continuous', 'trying to'], 'habit change', 'Describe an ongoing change', 'Ask for accountability'],
      ['Have you outgrown an old hobby?', 'When is it okay to leave interests?', 'short story', ['present perfect', 'used to'], 'changing tastes', 'Narrate outgrowing something', 'Accept change without guilt'],
      ['Should goals be public or private?', 'Does sharing goals help?', 'opinion', ['should', 'might'], 'goal setting', 'Weigh public commitment', 'Choose a goal style'],
      ['Who noticed you growing up before you did?', 'How do others see our change?', 'short story', ['past simple', 'noticed'], 'growing up', 'Describe being seen differently', 'Talk about maturation'],
      ['What small win kept you going?', 'Which tiny successes matter?', 'dialogue', ['past simple', 'helped'], 'motivation', 'Celebrate micro-progress', 'Encourage peers'],
      ['Is changing your mind a strength?', 'Can flexibility look like weakness?', 'opinion', ['modals', 'because'], 'flexibility', 'Defend changing your mind', 'Discuss intellectual honesty'],
      ['Have you apologised and meant it?', 'What makes an apology real?', 'short story', ['present perfect', 'past simple'], 'apologies', 'Narrate a sincere apology', 'Repair relationships'],
      ['What would future-you thank you for?', 'How do we choose helpful present actions?', 'message', ['would', 'if'], 'future self', 'Connect present acts to future', 'Motivate wise choices'],
      ['When did patience feel like progress?', 'How is waiting part of growth?', 'short story', ['past simple', 'felt like'], 'patience', 'Reframe waiting as growth', 'Value slow improvement'],
      ['If next year is kinder, what will you practise now?', 'Which practices build a kinder future?', 'opinion', ['first conditional', 'will'], 'personal growth', 'Set a practice-oriented goal', 'Close the level with forward hope'],
    ]),
  ],
};

// Continue in part 2 file execution - write Pre-Int, Intermediate, Advanced similarly
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
console.log('Elementary units written:', plan.levels.Elementary.units.length);
