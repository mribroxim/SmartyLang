/**
 * Builds content/en/beginner/plan.json: the Beginner (A1) scope & sequence.
 * One unit = one topic = one room of Smarty's house. Each lesson teaches 4–5
 * items, simplest first. Item notation: `*` = needs a picture, `[a,b]` = forms
 * (plurals, -s, contractions) the lesson may use, `~` = pattern.
 * Unit 1 comes from the existing unit-01.json.
 *
 *   node scripts/content/build-plan.mjs
 */
import fs from 'node:fs';

const U1 = JSON.parse(fs.readFileSync(new URL('../../content/en/beginner/unit-01.json', import.meta.url), 'utf8'));

export const UNITS = [
  { unit: 2, title: 'Family & Friends', room: 'living-room', grammar: 'possessives (my/his/her/our), have/has, adjectives before nouns', lessons: [
    'My family | Name the people in your family | *mother[mum]; *father[dad]; *brother[brothers]; *sister[sisters]; family; the',
    'This is my… | Introduce a family member | his; her; our; *baby[babies]; *parents',
    'Who is she? | Ask who someone is | Who is she?[Who\'s she?]; it[it\'s,it is]; *grandmother[grandma]; *grandfather[grandpa]',
    'How old are you? | Ask and say ages | How old are you?; years old; eleven; twelve; twenty',
    'My friends | Talk about friends | *best friend; *boy[boys]; *girl[girls]; they; they are[they\'re]',
    'Big and small | Describe people simply | *big; *small; *tall; *short; young',
    'I have a cat | Say what you have | I have; you have; *cat[cats]; *dog[dogs]; an',
    'She has a bird | Say what someone has | has; *house[houses]; *pet[pets]; *bird[birds]',
    'People I love | Say who you like and love | I love; I like; *photo[photos]; together; me',
    'Meet my family | Introduce your family to Smarty | *aunt; *uncle; *cousin[cousins]; *son[sons]; *daughter[daughters]',
  ] },
  { unit: 3, title: 'Food & Drink', room: 'kitchen', grammar: 'do you like…?, I don\'t like, can I have…?, some/any, imperatives', lessons: [
    'I\'m hungry | Say you are hungry or thirsty | *hungry; *thirsty; *water; *bread; *apple[apples]',
    'Breakfast | Name breakfast food | *breakfast; *egg[eggs]; *milk; *tea; *coffee; for',
    'Do you like bananas? | Ask and answer about likes | Do you like; I do not like[I don\'t like]; *banana[bananas]; *cheese; or',
    'Lunch and dinner | Name main meals | *lunch; *dinner; *rice; *soup; *chicken',
    'Can I have juice? | Ask for food politely | Can I have; *juice; *cake[cakes]; Of course; Here you are',
    'Fruit and vegetables | Name fruit and vegetables | *orange[oranges]; *tomato[tomatoes]; *potato[potatoes]; *carrot[carrots]; fruit',
    'Delicious! | Say how food tastes | *delicious; *hot; *cold; *sweet; but',
    'Cook with Smarty | Follow simple kitchen steps | *eat[eats]; *drink[drinks]; *cook[cooks]; *cut[cuts]; *wash[washes]',
    'Some and any | Talk about amounts | some; any; *plate[plates]; *cup[cups]; *glass[glasses]',
    'Feed Smarty | Offer food and say you are full | food; *fish; *sandwich[sandwiches]; full; very',
  ] },
  { unit: 4, title: 'My Day', room: 'bathroom', grammar: 'present simple (I/you, he/she -s), does, telling the time, adverbs of frequency', lessons: [
    'What time is it? | Ask and tell the time | What time is it?; o\'clock; *clock[clocks]; half past',
    'Morning routine | Say what you do in the morning | *get up[gets up]; *brush my teeth[brushes]; *take a shower[takes]; *towel',
    'Every day | Talk about your routine | every day; *go to school[goes]; *work[works]; at',
    'She gets up early | Say how often | usually; always; never; sometimes; early',
    'Days of the week | Name weekdays | Monday; Tuesday; Wednesday; Thursday; Friday',
    'The weekend | Talk about the weekend | Saturday; Sunday; weekend; *sleep[sleeps]; late',
    'Bathroom things | Name bathroom things | *soap; *toothbrush; *mirror; *bath',
    'Does he read? | Ask about someone\'s routine | does; *watch TV[watches TV]; *read[reads]; *book[books]',
    'In the evening | Talk about the evening | *go to bed[goes to bed]; *homework; night; then; after',
    'My day | Tell Smarty about your day | before; in the morning; in the evening; first',
  ] },
  { unit: 5, title: 'My Home', room: 'hallway', grammar: 'there is / there are, prepositions of place, this/these, imperatives', lessons: [
    'Rooms | Name rooms in a home | *room[rooms]; *kitchen; *bedroom; *bathroom; *living room',
    'There is a door | Say what is in a place | There is[There\'s]; There are; *door[doors]; *window[windows]',
    'Furniture | Name furniture | *table[tables]; *chair[chairs]; *bed[beds]; *sofa; *lamp[lamps]',
    'Where is it? | Say where things are | in; on; under; next to; *box[boxes]',
    'These and those | Point to things near and far | these; those; *key[keys]; *bag[bags]',
    'My things | Name everyday things | *phone[phones]; *computer; *pen[pens]; *pencil[pencils]; *notebook',
    'Is there a garden? | Ask what a home has | Is there; Are there; *stairs; *wall[walls]',
    'A nice home | Describe a home | new; *clean; *dirty; *beautiful',
    'Open the door | Give simple instructions | *open[opens]; *close[closes]; *stand up; come in',
    'Welcome home | Show Smarty your home | welcome; *home; live[lives]; *street',
  ] },
  { unit: 6, title: 'Clothes & Colours', room: 'wardrobe', grammar: 'colours, present continuous (I\'m wearing), whose / mine / yours, too + adjective', lessons: [
    'Colours | Name colours | *red; *blue; *green; *yellow; *black',
    'What colour is it? | Ask about colours | *white; *pink; *purple; *brown; What colour is it?',
    'Clothes | Name clothes | *shirt[shirts]; *T-shirt[T-shirts]; *trousers; *dress[dresses]; *shoes[shoe]',
    'I\'m wearing a hat | Say what you are wearing | I am wearing[I\'m wearing]; *jacket[jackets]; *hat[hats]; *socks',
    'Too long! | Say clothes do not fit | too; *long; size; *coat[coats]',
    'Whose is this? | Ask who owns something | Whose is this?; mine; yours; *scarf',
    'I want new boots | Say what you want | I want; *boots; *jeans; *skirt[skirts]',
    'Getting dressed | Talk about putting clothes on | *put on[puts on]; *take off[takes off]; *gloves; *belt',
    'My favourite colour | Talk about favourites | favourite; dark; light; grey',
    'Fashion show | Describe an outfit for Smarty | look[looks]; great; cool; *uniform',
  ] },
  { unit: 7, title: 'Shopping & Numbers', room: 'shop', grammar: 'numbers to 100, how much / how many, I\'d like, can I help you?', lessons: [
    'Numbers 13–17 | Count to seventeen | thirteen; fourteen; fifteen; sixteen; seventeen',
    'Numbers to 50 | Count in tens to fifty | eighteen; nineteen; thirty; forty; fifty',
    'Numbers to 100 | Count to one hundred | sixty; seventy; eighty; ninety; *hundred',
    'How much is it? | Ask the price | How much is it?; *money; *dollar[dollars]; cheap',
    'It\'s expensive | Talk about prices | expensive; *price[prices]; *shop[shops]; buy[buys]',
    'At the market | Buy food at a market | *market; *kilo[kilos]; How many; *bottle[bottles]',
    'I\'d like this one | Choose what to buy | I would like[I\'d like]; this one; that one; *basket',
    'Paying | Pay by card or cash | *card[cards]; *cash; pay[pays]; here',
    'In the shop | Talk about shops and people | *shopping; sell[sells]; *customer[customers]; *shop assistant',
    'Smarty\'s shop | Serve a customer in Smarty\'s shop | Can I help you?; Just looking; Anything else?; That is all[That\'s all]',
  ] },
  { unit: 8, title: 'Town & Directions', room: 'balcony', grammar: 'where is…?, can / can\'t, prepositions of place in town, imperatives for directions', lessons: [
    'Places in town | Name places in town | *park; *school; *hospital; *bank; *café',
    'More places | Name more places | *supermarket; *library; *cinema; *station; *museum',
    'Where is the bank? | Ask where a place is | Where is[Where\'s]; near; far; *map[maps]',
    'Turn left | Give simple directions | *turn left; *turn right; *go straight on; *corner',
    'I can swim | Say what you can and can\'t do | I can; I cannot[I can\'t]; *swim[swims]; *ride a bike[rides a bike]',
    'How do you go? | Say how you travel in town | walk[walks]; *by bus; *by car; *on foot',
    'In the city | Name things in a city | *bridge; *road[roads]; *city; *town',
    'Opposite the park | Say where places are | opposite; between; behind; in front of',
    'Excuse me | Ask a stranger for help | Excuse me; Is it far?; *traffic lights; minutes',
    'A walk with Smarty | Guide Smarty through town | *taxi; *ticket[tickets]; Let\'s go; *bus stop',
  ] },
  { unit: 9, title: 'Weather & Free Time', room: 'garden', grammar: 'weather (it\'s sunny), like + -ing, present continuous (it\'s raining), with', lessons: [
    'What\'s the weather like? | Talk about the weather | *sunny; *rainy; *windy; *cloudy; What is the weather like?[What\'s the weather like?]',
    'Rain and snow | Describe more weather | *snow[snows]; *rain[rains]; warm; *umbrella',
    'Seasons | Name the seasons | *spring; *summer; *autumn; *winter; season',
    'I like dancing | Say what you like doing | *play football[plays football,playing football]; *dance[dances,dancing]; *sing[sings,singing]; *draw[draws,drawing]',
    'Hobbies | Talk about hobbies | *hobby[hobbies]; *music; *paint[paints,painting]; *game[games]',
    'Sports | Name sports | *tennis; *basketball; *run[runs,running]; *jump[jumps,jumping]',
    'In the garden | Name things in a garden | *flower[flowers]; *tree[trees]; *grass; *butterfly; *sun',
    'It\'s raining now | Say what is happening now | It is raining[It\'s raining]; now; *outside; *inside',
    'Free time | Plan free time with a friend | free time; *picnic; *beach; with',
    'Smarty\'s garden | Look after the garden with Smarty | *plant[plants]; *grow[grows]; *sky; *cloud[clouds]',
  ] },
  { unit: 10, title: 'Plans & Travel', room: 'garage', grammar: 'going to, months and dates, where are you going?, need', lessons: [
    'Transport | Name ways to travel | *train[trains]; *plane[planes]; *boat[boats]; *motorbike; *suitcase',
    'January to May | Name the first months | January; February; March; April; May',
    'June to October | Name more months | June; July; August; September; October',
    'My birthday | Say when your birthday is | November; December; month[months]; year; *birthday',
    'I\'m going to visit | Talk about plans | I am going to[I\'m going to]; tomorrow; next week; *visit[visits]',
    'Holidays | Talk about a holiday | *holiday[holidays]; *hotel; *passport; travel[travels]',
    'Where are you going? | Ask about travel plans | Where are you going?; *airport; arrive[arrives]; leave[leaves]',
    'Packing | Say what you need for a trip | *pack[packs]; *camera; *sunglasses; need[needs]',
    'How long? | Ask how long a trip is | How long; *trip; fun; *souvenir',
    'The big trip | Plan a trip with Smarty | Have a good trip!; See you soon; *postcard; enjoy',
  ] },
];

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40);

function parseItem(raw, prefix) {
  let s = raw.trim();
  const image = s.startsWith('*'); if (image) s = s.slice(1);
  const pattern = s.startsWith('~'); if (pattern) s = s.slice(1);
  const m = s.match(/^(.*?)(?:\[(.*)\])?$/);
  const text = m[1].trim();
  const forms = m[2] ? m[2].split(',').map((f) => f.trim()).filter(Boolean) : undefined;
  const kind = pattern ? 'pattern' : /\s/.test(text) ? 'phrase' : 'word';
  return { id: `${prefix}.${slug(text)}`, text, kind, ...(forms ? { forms } : {}), image };
}

export function buildPlan() {
  const unit1 = {
    unit: 1, title: U1.title || 'Hello & Me', room: 'bedroom', grammar: 'be (I am / you are / he is), greetings, introductions', source: 'content/en/beginner/unit-01.json',
    lessons: U1.lessons.map((l) => ({ lesson: l.lesson, title: l.title, canDo: l.canDo, items: l.items.map((i) => ({ id: i.id, text: i.text, kind: i.kind, ...(i.forms ? { forms: i.forms } : {}), image: false })) })),
  };
  const units = UNITS.map((u) => ({
    unit: u.unit, title: u.title, room: u.room, grammar: u.grammar,
    lessons: u.lessons.map((line, i) => {
      const [title, canDo, items] = line.split('|').map((x) => x.trim());
      const prefix = `en.beginner.u${String(u.unit).padStart(2, '0')}.l${String(i + 1).padStart(2, '0')}`;
      return { lesson: i + 1, title, canDo, items: items.split(';').map((r) => parseItem(r, prefix)) };
    }),
  }));
  return { lang: 'en', section: 'beginner', units: [unit1, ...units] };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build-plan.mjs')) {
  const plan = buildPlan();
  // Sanity: no item taught twice, 4–6 items per lesson.
  const seen = new Map();
  for (const u of plan.units) for (const l of u.lessons) {
    if (l.items.length < 4 || l.items.length > 6) console.warn(`u${u.unit} l${l.lesson}: ${l.items.length} items`);
    for (const it of l.items) {
      const k = it.text.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim();
      if (seen.has(k)) console.warn(`duplicate "${it.text}" (u${u.unit} l${l.lesson}, first ${seen.get(k)})`);
      seen.set(k, `u${u.unit} l${l.lesson}`);
    }
  }
  fs.writeFileSync(new URL('../../content/en/beginner/plan.json', import.meta.url), JSON.stringify(plan, null, 2) + '\n');
  const n = plan.units.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.items.length, 0), 0);
  console.log(`plan.json: ${plan.units.length} units, ${n} items, ${plan.units.flatMap((u) => u.lessons).flatMap((l) => l.items).filter((i) => i.image).length} pictures`);
}
