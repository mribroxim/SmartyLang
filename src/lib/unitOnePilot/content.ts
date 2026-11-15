/** Authored English-only trial. Original passages/unlocks are never rewritten. */
export type ReplyRule = 'introduction' | 'origin' | 'ask-name' | 'ask-origin';
interface Common { id: string; prompt: string; explanation: string; scene?: string; }
export type PilotTask =
  | (Common & { kind: 'teach'; examples: string[] })
  | (Common & { kind: 'choice'; options: string[]; answer: string; audio?: string })
  | (Common & { kind: 'build'; tiles: string[]; answers: string[] })
  | (Common & { kind: 'reply'; rule: ReplyRule; example: string })
  | (Common & { kind: 'speak'; target: string });
export interface PilotSession { id: string; title: string; goal: string; category: string; minutes: number; tasks: PilotTask[]; }
const note = (id: string, prompt: string, explanation: string, examples: string[]): PilotTask => ({ id, kind: 'teach', prompt, explanation, examples });
const pick = (id: string, prompt: string, options: string[], answer: string, explanation: string, extra: { audio?: string; scene?: string } = {}): PilotTask => ({ id, kind: 'choice', prompt, options, answer, explanation, ...extra });
const build = (id: string, prompt: string, tiles: string[], answers: string[], explanation: string): PilotTask => ({ id, kind: 'build', prompt, tiles, answers, explanation });
const reply = (id: string, prompt: string, rule: ReplyRule, example: string, explanation: string, scene?: string): PilotTask => ({ id, kind: 'reply', prompt, rule, example, explanation, scene });

export const PILOT_SESSIONS: PilotSession[] = [
  { id: 'hello', title: 'Say hello', goal: 'Start and end a friendly conversation.', category: 'New phrases', minutes: 3, tasks: [
    note('hello-learn', 'A few words open a conversation.', 'Hello and Hi start a conversation. Goodbye ends it. Hi is more informal.', ['Hello!', 'Hi!', 'Goodbye!']),
    pick('hello-start', 'You meet a new classmate. What do you say first?', ['Hello!', 'Goodbye!', 'My name'], 'Hello!', 'Hello is a complete greeting. Use it when you meet someone.'),
    pick('hello-listen', 'Listen. Which greeting did you hear?', ['Hi!', 'Goodbye!', 'Hello!'], 'Hi!', 'Hi is a short, friendly way to say hello.', { audio: 'Hi!' }),
    pick('hello-leave', 'Your friend is leaving. What do you say?', ['Goodbye!', 'My name', 'Hello!'], 'Goodbye!', 'Goodbye ends the conversation.'),
    { id: 'hello-say', kind: 'speak', prompt: 'Give Smarty a friendly greeting.', target: 'Hello, Smarty!', explanation: 'You have greeted someone in English. You can also say Hi, Smarty!' },
    pick('hello-return', 'A classmate says “Hi!” to you. Choose a natural reply.', ['Hi!', 'My name', 'Goodbye!'], 'Hi!', 'You can reply to a greeting with another greeting.'),
  ] },
  { id: 'name', title: 'Tell me your name', goal: 'Introduce yourself and recognise a name question.', category: 'New phrases', minutes: 4, tasks: [
    note('name-learn', 'Your first introduction', 'My name is… and I’m… both introduce you. I’m is the short form of I am. Use a nickname or an imaginary name if you prefer.', ['My name is Mia.', 'I’m Mia.', 'What’s your name?']),
    build('name-build', 'Introduce yourself as Sam.', ['name', 'Sam.', 'My', 'is', 'your'], ['My name is Sam.'], 'My name is + a name. My tells us the name belongs to the speaker.'),
    pick('name-question', 'Someone asks “What’s your name?” What do they want to know?', ['Your name', 'Where you are from', 'Whether you are leaving'], 'Your name', 'What’s your name? asks what to call you.'),
    pick('name-hear', 'Listen. Who is speaking?', ['Mia', 'Sam', 'Ben'], 'Mia', 'My name is Mia means the speaker is called Mia.', { audio: 'My name is Mia.' }),
    reply('name-own', 'Smarty: “What’s your name?” Introduce yourself.', 'introduction', 'My name is Sam.', 'Use My name is… or I’m… followed by a name.'),
  ] },
  { id: 'listen', title: 'Catch the name', goal: 'Understand short introductions by listening.', category: 'Listening', minutes: 3, tasks: [
    note('listen-tip', 'Listen for the important part.', 'The name usually comes after I’m or My name is. You do not have to understand every sound to catch a name.', ['I’m Ben. → Ben', 'My name is Mia. → Mia']),
    pick('listen-ben', 'Which name did you hear?', ['Sam', 'Ben', 'Mia'], 'Ben', 'I’m Ben introduces Ben.', { audio: 'Hello! I am Ben.' }),
    pick('listen-sam', 'Which name did you hear?', ['Mia', 'Ben', 'Sam'], 'Sam', 'Listen for Sam after My name is.', { audio: 'Hi! My name is Sam.' }),
    pick('listen-question', 'What is the speaker asking for?', ['Your name', 'A goodbye', 'Your country'], 'Your name', 'What’s is the short form of What is.', { audio: 'What is your name?' }),
    pick('listen-bye', 'Is the speaker starting or ending the conversation?', ['Ending it', 'Asking a name', 'Introducing themselves'], 'Ending it', 'Goodbye signals that the conversation is ending.', { audio: 'Goodbye, Mia!' }),
    pick('listen-mia', 'Who introduced themselves?', ['Ben', 'Mia', 'Sam'], 'Mia', 'The greeting changes, but the name still comes after I’m.', { audio: 'Hi, Ben! I’m Mia.' }),
  ] },
  { id: 'be', title: 'I am, you are', goal: 'Use the right form of be in an introduction.', category: 'Tiny grammar lesson', minutes: 4, tasks: [
    note('be-learn', 'I am. You are.', 'Use am with I, and are with you. In speech, I am often becomes I’m and you are becomes you’re. They mean the same thing.', ['I am Sam. → I’m Sam.', 'You are Mia. → You’re Mia.']),
    pick('be-am', 'I ___ Sam.', ['am', 'are', 'is'], 'am', 'I goes with am: I am Sam.'),
    pick('be-are', 'You ___ Mia.', ['is', 'am', 'are'], 'are', 'You goes with are: You are Mia.'),
    pick('be-short', 'Which means the same as “I am Ben”?', ['I’m Ben.', 'You’re Ben.', 'My Ben.'], 'I’m Ben.', 'I’m combines I and am. The apostrophe replaces the missing a.'),
    build('be-build', 'Tell Mia who she is: “You are Mia.”', ['Mia.', 'am', 'You', 'are'], ['You are Mia.'], 'You are + a name. We do not say You am.'),
    { id: 'be-say', kind: 'speak', prompt: 'Try saying the short form.', target: 'I’m Sam.', explanation: 'I am Sam and I’m Sam are both correct introductions.' },
  ] },
  { id: 'review', title: 'A quick reunion', goal: 'Recall greetings and introductions without a new word list.', category: 'Mixed review', minutes: 3, tasks: [
    pick('review-greet', 'You see a friend at the start of a conversation.', ['Hello!', 'Goodbye!', 'Your name.'], 'Hello!', 'Start with a greeting, then introduce yourself or ask a question.'),
    build('review-name', 'Ask a new classmate their name.', ['your', 'name?', 'What', 'is', 'my'], ['What is your name?'], 'Use your when you ask about the other person’s name.'),
    pick('review-you', 'Choose the correct sentence.', ['You are Mia.', 'You am Mia.', 'I are Mia.'], 'You are Mia.', 'I am; you are. The verb changes with the speaker.'),
    reply('review-own', 'A new classmate asks “What’s your name?” Reply with a full introduction.', 'introduction', 'I’m Sam.', 'My name is… and I’m… are both accepted.'),
    pick('review-listen', 'Listen. What should you do?', ['Tell them your name', 'Say goodbye', 'Tell them your country'], 'Tell them your name', 'They are asking what to call you.', { audio: 'Hello! What’s your name?' }),
  ] },
  { id: 'from', title: 'Where are you from?', goal: 'Say where you are from and ask someone else.', category: 'New phrases', minutes: 4, tasks: [
    note('from-learn', 'Add one more detail.', 'I’m from… tells someone your country or place of origin. Where are you from? asks the same question back. Use a real or imaginary place for practice.', ['I’m from Uzbekistan.', 'I am from Brazil.', 'Where are you from?']),
    pick('from-gap', 'I’m ___ Uzbekistan.', ['from', 'name', 'are'], 'from', 'From introduces the place you come from.'),
    pick('from-hear', 'Where is the speaker from?', ['Uzbekistan', 'Brazil', 'England'], 'Brazil', 'Listen for the place after from.', { audio: 'Hello! I am from Brazil.' }),
    build('from-ask', 'Ask where someone is from.', ['you', 'Where', 'from?', 'are', 'am'], ['Where are you from?'], 'Question order: Where + are + you + from?'),
    reply('from-own', 'Smarty: “Where are you from?” Answer with a place.', 'origin', 'I’m from Uzbekistan.', 'Use I’m from… or I am from… followed by a place.'),
  ] },
  { id: 'story', title: 'Two new classmates', goal: 'Understand a tiny conversation and follow who says what.', category: 'Mini story', minutes: 4, tasks: [
    note('story-phrase', 'A friendly reply', 'Say Nice to meet you when you meet someone for the first time. You can reply Nice to meet you, too. Too means also here.', ['Nice to meet you!', 'Nice to meet you, too!']),
    note('story-read', 'Mia meets Sam.', 'Read or listen. Look for each person’s name and country.', ['Mia: Hello! My name is Mia.', 'Sam: Hi, Mia! I’m Sam.', 'Mia: I’m from Uzbekistan. Where are you from?', 'Sam: I’m from Brazil.', 'Mia: Nice to meet you!', 'Sam: Nice to meet you, too!']),
    pick('story-mia', 'Where is Mia from?', ['Uzbekistan', 'Brazil', 'We are not told'], 'Uzbekistan', 'Mia says I’m from Uzbekistan.', { scene: 'Mia: I’m from Uzbekistan. Where are you from?\nSam: I’m from Brazil.' }),
    pick('story-sam', 'Who is from Brazil?', ['Sam', 'Mia', 'Both classmates'], 'Sam', 'Sam says I’m from Brazil.', { scene: 'Mia: I’m from Uzbekistan.\nSam: I’m from Brazil.' }),
    pick('story-polite', 'Mia says “Nice to meet you!” Choose Sam’s friendly reply.', ['Nice to meet you, too!', 'My country is name.', 'You am Mia.'], 'Nice to meet you, too!', 'Too lets Sam say that he is also pleased to meet Mia.'),
    pick('story-recall', 'What are Mia and Sam doing?', ['Meeting for the first time', 'Saying their names are the same', 'Saying they are from the same country'], 'Meeting for the first time', 'They exchange names, ask about countries and say Nice to meet you.'),
  ] },
  { id: 'chat', title: 'Your turn with Smarty', goal: 'Keep a short conversation going with fewer hints.', category: 'Guided conversation', minutes: 4, tasks: [
    pick('chat-start', 'Choose your first reply.', ['Hi, Smarty!', 'Goodbye, Smarty!', 'My from Smarty.'], 'Hi, Smarty!', 'Reply to a greeting with a greeting.', { scene: 'Smarty: Hello!' }),
    reply('chat-name', 'Answer Smarty with your name or a nickname.', 'introduction', 'My name is Sam.', 'A complete introduction includes My name is… or I’m… plus a name.', 'Smarty: I’m Smarty. What’s your name?'),
    pick('chat-meet', 'Keep the conversation friendly.', ['Nice to meet you, too!', 'You are from name.', 'My goodbye.'], 'Nice to meet you, too!', 'Nice to meet you, too is a friendly reply when you meet someone.', { scene: 'Smarty: Nice to meet you!' }),
    reply('chat-from', 'Tell Smarty where you are from.', 'origin', 'I am from Brazil.', 'Use I am from… or I’m from… and a place.', 'Smarty: Where are you from?'),
    reply('chat-ask', 'Now ask Smarty where he is from.', 'ask-origin', 'Where are you from?', 'Use Where are you from? to ask the question back.'),
    pick('chat-close', 'You need to leave. Finish the conversation.', ['Goodbye, Smarty!', 'What’s your name?', 'You am Smarty.'], 'Goodbye, Smarty!', 'You can finish politely with Goodbye.'),
  ] },
  { id: 'repair', title: 'Make it stick', goal: 'Revisit phrases you found tricky, in a short mixed practice.', category: 'Personal review', minutes: 3, tasks: [] },
  { id: 'mission', title: 'Meet someone new', goal: 'Introduce yourself, say where you are from and ask about the other person.', category: 'Your first mission', minutes: 4, tasks: [
    note('mission-brief', 'You can do this.', 'Imagine you are meeting a new classmate. Write your own replies without answer tiles. A nickname and an imaginary place are fine. This checks the English pattern, not whether personal details are real.', ['Greet them and introduce yourself.', 'Say where you are from.', 'Ask about them.']),
    reply('mission-name', 'Introduce yourself. You may include a greeting.', 'introduction', 'Hello! My name is Sam.', 'Use My name is… or I’m… and a name.', 'New classmate: Hello! What’s your name?'),
    reply('mission-from', 'Answer with a complete sentence.', 'origin', 'I’m from Uzbekistan.', 'Use I’m from… or I am from… and a place.', 'New classmate: Nice to meet you! Where are you from?'),
    reply('mission-ask', 'Ask the classmate where they are from.', 'ask-origin', 'Where are you from?', 'Where are you from? asks about the other person.'),
    reply('mission-name-question', 'Another classmate joins you. Ask their name.', 'ask-name', 'What’s your name?', 'What’s your name? and What is your name? both work.'),
    pick('mission-finish', 'Your new classmate says “Nice to meet you!” Finish politely.', ['Nice to meet you, too!', 'I from name.', 'You am from.'], 'Nice to meet you, too!', 'You have introduced yourself and kept a short conversation going.'),
  ] },
];

export const ALL_TASKS = new Map(PILOT_SESSIONS.flatMap(s => s.tasks.map(task => [task.id, task] as const)));
const REVIEW_DEFAULTS = ['hello-start', 'be-are', 'listen-ben', 'from-ask', 'chat-name', 'chat-from'];
export function sessionTasks(session: PilotSession, missed: string[] = []): PilotTask[] {
  if (session.id !== 'repair') return session.tasks;
  const candidates = [...new Set([...missed, ...REVIEW_DEFAULTS])].map(id => ALL_TASKS.get(id)).filter((task): task is PilotTask => !!task && task.kind !== 'teach' && task.kind !== 'speak');
  return candidates.slice(0, 6);
}
