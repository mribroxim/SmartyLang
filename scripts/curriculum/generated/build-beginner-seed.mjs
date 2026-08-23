#!/usr/bin/env node
/**
 * Build Beginner.json from handwritten passages + plan metadata.
 * Passages live in beginner-passages/*.txt or inline map below.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lesson, vocab } from '../helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_beginner-meta.json'), 'utf8'),
);

/** @type {Record<string, { text: string, vocabulary: [string, string][] }>} */
const CONTENT = {
  b1: {
    text: `A: Hi! My name is Sara. What's your name?
B: Hello, Sara. I'm Omar. Nice to meet you.
A: Nice to meet you too. Are you a student here?
B: Yes, I am. This is my first week. Are you new too?
A: No, I study here every year. I live near the school.
B: Oh, good. Can you show me the coffee shop later?
A: Sure. After class, we can walk there together.
B: Thank you, Sara. See you at two o'clock.
A: See you, Omar!`,
    vocabulary: [
      ['Name', '(Noun) What people call you.'],
      ['Nice to meet you', '(Phrase) A polite thing to say when you meet someone new.'],
      ['Student', '(Noun) A person who studies at a school or college.'],
      ['First', '(Adjective) Before all others; number one.'],
      ['Week', '(Noun) A period of seven days.'],
      ['Near', '(Preposition/Adjective) Close to a place.'],
      ['Show', '(Verb) To let someone see something or help them find it.'],
      ['Together', '(Adverb) With each other; in one group.'],
      ['Sure', '(Adjective/Interjection) Yes; I agree.'],
      ['See you', '(Phrase) A friendly way to say goodbye.'],
    ],
  },
  b2: {
    text: `A: Where are you from, Lena?
B: I'm from Poland, but I live in Manchester now.
A: Manchester? That's a big city. Do you like it?
B: Yes, I do. My flat is small, but the street is quiet.
A: I'm from Brazil. My city is Recife. It's warm there.
B: Is Recife near the sea?
A: Yes. Many people swim at the beach after work.
B: That sounds nice. My town in Poland is colder.
A: Do you go home often?
B: Not often. Flights are expensive. But I call my parents every Sunday.`,
    vocabulary: [
      ['From', '(Preposition) Used to say the place a person comes from.'],
      ['Live', '(Verb) To have your home in a place.'],
      ['City', '(Noun) A large and important town.'],
      ['Flat', '(Noun) A set of rooms for living in, usually on one floor.'],
      ['Quiet', '(Adjective) With little or no noise.'],
      ['Warm', '(Adjective) A little hot; comfortably hot.'],
      ['Sea', '(Noun) The salt water that covers much of the Earth.'],
      ['Beach', '(Noun) Sand or stones by the sea where people swim.'],
      ['Often', '(Adverb) Many times; frequently.'],
      ['Expensive', '(Adjective) Costing a lot of money.'],
      ['Parents', '(Noun) Your mother and father.'],
    ],
  },
  b3: {
    text: `My name is Theo, and I am twelve years old. My birthday is in March. Every year, my family makes a small cake with chocolate. My sister is fifteen. She always sings to me at breakfast. My little brother is only four. He cannot say "birthday" well, but he tries. Last year, my uncle gave me a red football. This year, I want books. Age is just a number, my grandma says, but I still like birthday candles. On my birthday, I feel tall and happy.`,
    vocabulary: [
      ['Age', '(Noun) How old a person is.'],
      ['Birthday', '(Noun) The day each year when you were born.'],
      ['Years old', '(Phrase) Used after a number to say a person’s age.'],
      ['Cake', '(Noun) A sweet food made from flour, sugar, and eggs.'],
      ['Sister', '(Noun) A girl or woman who has the same parents as you.'],
      ['Brother', '(Noun) A boy or man who has the same parents as you.'],
      ['Uncle', '(Noun) The brother of your mother or father.'],
      ['Candle', '(Noun) A stick of wax with a string that burns for light.'],
      ['Happy', '(Adjective) Feeling pleasure or joy.'],
      ['Family', '(Noun) A group of people who are related, often living together.'],
    ],
  },
  b4: {
    text: `This is my family. We live in a small house with a garden. My mother works in a hospital. She is kind and busy. My father cooks dinner most evenings. He makes pasta and salad. I have one sister, Ana. She is tall and funny. She helps me with homework. Our grandma visits on Fridays. She brings fruit and tells old stories. There is also a cat called Miso. He sleeps on the sofa. In the evening, we sit together and talk about our day. I feel safe with my family.`,
    vocabulary: [
      ['Family', '(Noun) People related to you, such as parents and children.'],
      ['Garden', '(Noun) An outdoor area with plants next to a house.'],
      ['Hospital', '(Noun) A place where sick or hurt people get care.'],
      ['Kind', '(Adjective) Friendly and helpful to others.'],
      ['Busy', '(Adjective) Having a lot of things to do.'],
      ['Dinner', '(Noun) The main meal of the evening.'],
      ['Funny', '(Adjective) Making people laugh.'],
      ['Homework', '(Noun) School work that you do at home.'],
      ['Visit', '(Verb) To go and see a person or place.'],
      ['Sofa', '(Noun) A long soft seat for two or more people.'],
      ['Safe', '(Adjective) Not in danger.'],
    ],
  },
  b5: {
    text: `My friend Yasmin is easy to see in a crowd. She is tall, and her hair is long and black. She usually ties it in a ponytail. Her eyes are brown, and she wears small round glasses. Yasmin has a bright smile. She likes red jackets and white trainers. My brother is different. He is short, with curly hair and freckles. He never wears glasses. When we meet at the station, I look for Yasmin’s red jacket first. Then I wave, and she waves back.`,
    vocabulary: [
      ['Tall', '(Adjective) Higher than usual from head to foot.'],
      ['Hair', '(Noun) The thin strands that grow on your head.'],
      ['Eyes', '(Noun) The parts of your face that you see with.'],
      ['Glasses', '(Noun) Lenses in a frame that help you see better.'],
      ['Smile', '(Noun/Verb) A happy look that turns up your mouth.'],
      ['Jacket', '(Noun) A short coat.'],
      ['Trainers', '(Noun) Soft shoes for sport or casual wear.'],
      ['Short', '(Adjective) Small in height.'],
      ['Curly', '(Adjective) Forming curves or rings (for hair).'],
      ['Wave', '(Verb) To move your hand to say hello or goodbye.'],
    ],
  },
  b6: {
    text: `I like many things, and I also have clear “no” answers. I love swimming on hot days. Cold water wakes me up. I like drawing animals in my notebook. I do not like loud concerts. The noise hurts my ears. I enjoy sweet tea, but I do not like coffee. It tastes bitter to me. My favourite colour is green because trees look calm. My sister likes pink. That’s fine! People are different. On Sundays, I choose a quiet park, a book, and an apple. Those are my favourite simple things.`,
    vocabulary: [
      ['Like', '(Verb) To enjoy something or find it pleasant.'],
      ['Love', '(Verb) To like something very much.'],
      ['Hate / do not like', '(Phrase) To find something unpleasant.'],
      ['Swimming', '(Noun) Moving through water using your arms and legs.'],
      ['Drawing', '(Noun/Verb) Making a picture with a pencil or pen.'],
      ['Loud', '(Adjective) Making a lot of noise.'],
      ['Noise', '(Noun) Sound that is loud or unwanted.'],
      ['Bitter', '(Adjective) Having a sharp taste, not sweet.'],
      ['Favourite', '(Adjective) Liked more than others.'],
      ['Choose', '(Verb) To pick one thing from several options.'],
      ['Simple', '(Adjective) Easy; not complicated.'],
    ],
  },
  b7: {
    text: `A: Excuse me. Can you help me, please?
B: Of course. What’s wrong?
A: I can’t open this door. My hands are full.
B: Sure. I can hold your bags. Please give them to me.
A: Thank you! Now I can find my key.
B: Is this the right floor?
A: Yes. Flat 4B. Can you press the light switch too?
B: Done. Anything else?
A: Can you tell me where the stairs are? The lift is slow today.
B: They’re behind you, next to the plant.
A: Perfect. You’re very kind. Have a nice day!
B: You too.`,
    vocabulary: [
      ['Help', '(Verb) To make it easier for someone to do something.'],
      ['Please', '(Adverb) A polite word used when you ask for something.'],
      ['Of course', '(Phrase) Yes; certainly.'],
      ['Hold', '(Verb) To keep something in your hands.'],
      ['Key', '(Noun) A small metal object that opens a lock.'],
      ['Press', '(Verb) To push something with your finger.'],
      ['Switch', '(Noun) A small control that turns lights on or off.'],
      ['Stairs', '(Noun) A set of steps between floors.'],
      ['Lift', '(Noun) A machine that carries people up and down in a building.'],
      ['Kind', '(Adjective) Friendly and helpful.'],
    ],
  },
  b8: {
    text: `There are many things in my bag today. There is a blue notebook for English class. There are two pens and one pencil. There is also a small bottle of water. I have my keys on a red ring. There is an apple for break time and a sandwich in a box. My phone is in the front pocket. There isn’t any money today—only a bus card. Oh, and there is a scarf because the morning is cold. My bag looks heavy, but I need these things.`,
    vocabulary: [
      ['Bag', '(Noun) A soft container you carry, often over your shoulder.'],
      ['Notebook', '(Noun) A book of blank pages for writing.'],
      ['Pen', '(Noun) A tool for writing with ink.'],
      ['Bottle', '(Noun) A container for liquid, usually with a narrow neck.'],
      ['Keys', '(Noun) Metal objects that open doors or locks.'],
      ['Sandwich', '(Noun) Food with filling between two pieces of bread.'],
      ['Pocket', '(Noun) A small bag sewn into clothes for carrying things.'],
      ['Bus card', '(Noun) A card you use to pay for bus travel.'],
      ['Scarf', '(Noun) A piece of cloth worn around the neck to keep warm.'],
      ['Heavy', '(Adjective) Weighing a lot; hard to carry.'],
      ['Need', '(Verb) To require something because it is necessary.'],
    ],
  },
  b9: {
    text: `A: Can I have your phone number?
B: Yes. It’s 07 552 448 19. Should I say it slowly?
A: Please. Seven… five five two…
B: Four four eight… one nine.
A: Thanks. And your email?
B: Maya.dot.green at mail.com. No spaces.
A: Got it. I’ll send you the group chat link tonight.
B: Great. What’s your number, so I can save it?
A: 07 331 902 64. Call me if you’re late tomorrow.
B: Okay. See you at the library at ten.`,
    vocabulary: [
      ['Phone number', '(Noun) The digits you dial to call someone.'],
      ['Slowly', '(Adverb) Not quickly; taking more time.'],
      ['Email', '(Noun) An electronic message address or message.'],
      ['Send', '(Verb) To make something go to another person.'],
      ['Link', '(Noun) An internet address you can tap or click.'],
      ['Save', '(Verb) To keep information on your phone or computer.'],
      ['Call', '(Verb) To telephone someone.'],
      ['Late', '(Adjective) After the expected time.'],
      ['Library', '(Noun) A place with books you can read or borrow.'],
      ['Digits', '(Noun) The numbers 0–9.'],
    ],
  },
  b10: {
    text: `A: It was lovely to talk to you, Priya.
B: You too, Daniel. I enjoyed our coffee.
A: Same here. Good luck with your new class.
B: Thanks! Maybe we can meet again next week?
A: I’d like that. Message me on Friday.
B: I will. Take care on your way home.
A: You too. The bus is coming—bye for now!
B: Bye, Daniel. Nice to meet you today.
A: Nice to meet you too. See you soon!
B: See you soon.`,
    vocabulary: [
      ['Lovely', '(Adjective) Very pleasant or nice.'],
      ['Enjoy', '(Verb) To get pleasure from something.'],
      ['Good luck', '(Phrase) Words you say when you want someone to succeed.'],
      ['Maybe', '(Adverb) Perhaps; it is possible.'],
      ['Meet', '(Verb) To come together with someone.'],
      ['Message', '(Verb/Noun) To send a short text; a short written note.'],
      ['Take care', '(Phrase) A friendly goodbye wishing someone safety.'],
      ['Bye', '(Interjection) A short informal goodbye.'],
      ['Soon', '(Adverb) In a short time from now.'],
      ['Again', '(Adverb) One more time; another time.'],
    ],
  },
};

fs.writeFileSync(
  path.join(__dirname, 'beginner-content-partial.json'),
  JSON.stringify(CONTENT, null, 2),
);
console.log('wrote partial', Object.keys(CONTENT).length);
