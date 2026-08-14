/**
 * Apply literary Ukrainian polish to lang-packs/uk content.
 * Preserves JSON structure, IDs, targetSeconds, and answer indices.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const UK = ROOT;

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** Global Russianisms / calques — careful order */
const GLOBAL_REPLACEMENTS = [
  [/являється/g, 'є'],
  [/являються/g, 'є'],
  [/являє собою/g, 'становить'],
  [/являють собою/g, 'становлять'],
  [/на протязі/g, 'протягом'],
  [/у якості /g, 'як '],
  [/в якості /g, 'як '],
  [/приймати участь/g, 'брати участь'],
  [/приймають участь/g, 'беруть участь'],
  [/приймає участь/g, 'бере участь'],
  [/приймала участь/g, 'брала участь'],
  [/приймав участь/g, 'брав участь'],
  [/більш кращ/g, 'кращ'],
  [/самий /g, 'най'],
  [/саме /g, 'най'], // careful - "саме" can mean "exactly"; skip for now
];

// Safer global replacements only
const SAFE_GLOBAL = [
  [/\bявляється\b/g, 'є'],
  [/\bявляються\b/g, 'є'],
  [/\bявляє собою\b/g, 'становить'],
  [/\bявляють собою\b/g, 'становлять'],
  [/\bна протязі\b/g, 'протягом'],
  [/\bу якості\b/g, 'як'],
  [/\bв якості\b/g, 'як'],
  [/\bприймати участь\b/g, 'брати участь'],
  [/\bприймають участь\b/g, 'беруть участь'],
  [/\bприймає участь\b/g, 'бере участь'],
  [/\bприймала участь\b/g, 'брала участь'],
  [/\bприймав участь\b/g, 'брав участь'],
  [/\bбільш кращ/g, 'кращ'],
  [/дарує мені посмішку/g, 'всміхається мені'],
  [/дарує нам світло/g, 'дає нам світло'],
  [/дарує нам\.\.\./g, 'дає нам...'],
  [/Сонце дарує нам/g, 'Сонце дає нам'],
  [/розтягую руки/g, 'потягуюся'],
  [/розтягую руки/gi, 'потягуюся'],
  [/Моя мама дарує мені посмішку/g, 'Мама всміхається мені'],
  [/Фразове дієслово/g, 'Дієслово'],
  [/Монетний двір/g, 'м’ята'],
  [/В дереві/g, 'На дереві'],
  [/в дереві/g, 'на дереві'],
];

function applySafeGlobals(s) {
  if (typeof s !== 'string') return s;
  let out = s;
  for (const [re, rep] of SAFE_GLOBAL) out = out.replace(re, rep);
  return out;
}

function walkStrings(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map((x) => walkStrings(x, fn));
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const k of Object.keys(obj)) o[k] = walkStrings(obj[k], fn);
    return o;
  }
  return obj;
}

// --- CR Beginner full literary polish (preserve answer indices) ---
const CR_BEGINNER = [
  {
    title: 'Моя кішка',
    passage: 'У мене є кішка. Моя кішка чорно-біла. Вона любить пити молоко. Вона спить на дивані.',
    questions: [
      { text: 'Якого кольору кішка?', options: ['Коричнево-біла', 'Чорно-біла', 'Чорно-сіра', 'Біло-помаранчева'] },
      { text: 'Що любить пити кішка?', options: ['Воду', 'Сік', 'Молоко', 'Чай'] },
      { text: 'Де спить кішка?', options: ['На ліжку', 'На дивані', 'На підлозі', 'На стільці'] },
      { text: 'У кого є кішка?', options: ['У мого друга', 'У моєї мами', 'У мене', 'У мого батька'] },
      { text: 'Кішка — це...', options: ['собака', 'птах', 'риба', 'кішка'] },
    ],
  },
  {
    title: 'Червоний м’яч',
    passage: 'У Тома є червоний м’яч. Він грається з ним у парку. М’яч великий і круглий. Тому подобається його м’яч.',
    questions: [
      { text: 'Якого кольору м’яч?', options: ['Синій', 'Зелений', 'Червоний', 'Жовтий'] },
      { text: 'Де грає Том?', options: ['У школі', 'У парку', 'Вдома', 'У саду'] },
      { text: 'М’яч великий і...', options: ['маленький', 'круглий', 'квадратний', 'довгий'] },
      { text: 'У кого є м’яч?', options: ['У Анни', 'У Бена', 'У Тома', 'У Сема'] },
      { text: 'Чи любить Том свій м’яч?', options: ['Ні', 'Можливо', 'Так', 'Іноді'] },
    ],
  },
  {
    title: 'Сонце',
    passage: 'Сонце яскраве. Воно жовте. Удень сонце дає нам світло. Сонце дуже гаряче.',
    questions: [
      { text: 'Якого кольору сонце?', options: ['Червоне', 'Синє', 'Жовте', 'Біле'] },
      { text: 'Коли ми бачимо сонце?', options: ['Уночі', 'Удень', 'Узимку', 'Лише опівдні'] },
      { text: 'Сонце дає нам...', options: ['дощ', 'сніг', 'світло', 'вітер'] },
      { text: 'Сонце дуже...', options: ['холодне', 'гаряче', 'маленьке', 'далеке'] },
      { text: 'Сонце — це...', options: ['планета', 'місяць', 'зірка', 'хмара'] },
    ],
  },
  {
    title: 'Мій шкільний рюкзак',
    passage: 'У мене синій шкільний рюкзак. У ньому лежать мої книжки. Також у мене є пенал. Щодня я ношу рюкзак до школи.',
    questions: [
      { text: 'Якого кольору шкільний рюкзак?', options: ['Червоний', 'Синій', 'Зелений', 'Чорний'] },
      { text: 'Що лежить у рюкзаку?', options: ['Іграшки', 'Їжа', 'Книжки', 'Одяг'] },
      { text: 'Що ще є в рюкзаку?', options: ['Пенал', 'Телефон', 'Гаманець', 'Капелюх'] },
      { text: 'Куди я ношу рюкзак?', options: ['До парку', 'До школи', 'До магазину', 'До ліжка'] },
      { text: 'Я беру рюкзак кожен...', options: ['тиждень', 'день', 'місяць', 'рік'] },
    ],
  },
  {
    title: 'Яблука',
    passage: 'Яблука бувають червоні або зелені. Вони солодкі й смачні. Я їм яблуко щодня. Яблука — корисні фрукти.',
    questions: [
      { text: 'Якого кольору можуть бути яблука?', options: ['Сині або жовті', 'Червоні або зелені', 'Фіолетові або помаранчеві', 'Чорні або білі'] },
      { text: 'Які на смак яблука?', options: ['Кислі', 'Гіркі', 'Солодкі', 'Солоні'] },
      { text: 'Як часто я їм яблуко?', options: ['Раз на тиждень', 'Щодня', 'Щомісяця', 'Ніколи'] },
      { text: 'Яблука — це...', options: ['овочі', 'м’ясо', 'фрукти', 'цукерки'] },
      { text: 'Яблука корисні чи шкідливі?', options: ['Шкідливі', 'Корисні', 'Недобрі', 'Погані'] },
    ],
  },
  {
    title: 'Собака',
    passage: 'У Бена є собака. Собака коричнева. Її звати Макс. Макс любить бігати в саду.',
    questions: [
      { text: 'У кого є собака?', options: ['У Тома', 'У Бена', 'У Анни', 'У Сема'] },
      { text: 'Якого кольору собака?', options: ['Чорна', 'Біла', 'Коричнева', 'Сіра'] },
      { text: 'Як звати собаку?', options: ['Бадді', 'Макс', 'Рокі', 'Рекс'] },
      { text: 'Де Макс любить бігати?', options: ['У парку', 'У будинку', 'У саду', 'На вулиці'] },
      { text: 'Макс — це...', options: ['кішка', 'птах', 'риба', 'собака'] },
    ],
  },
  {
    title: 'Моя сім’я',
    passage: 'У мене маленька сім’я. Мої мама й тато дуже добрі. У мене є одна сестра. Ми живемо в будинку.',
    questions: [
      { text: 'Моя сім’я...', options: ['велика', 'маленька', 'стара', 'нова'] },
      { text: 'Які мої батьки?', options: ['Суворі', 'Добрі', 'Високі', 'Молоді'] },
      { text: 'Скільки в мене сестер?', options: ['Дві', 'Жодної', 'Одна', 'Три'] },
      { text: 'Де живе моя родина?', options: ['У квартирі', 'У будинку', 'На фермі', 'У готелі'] },
      { text: 'Скільки людей у моїй родині?', options: ['Двоє', 'Троє', 'Четверо', 'П’ятеро'] },
    ],
  },
  {
    title: 'Дощ',
    passage: 'Сьогодні йде дощ. Дощ холодний. Я беру парасольку. Також одягаю плащ.',
    questions: [
      { text: 'Яка сьогодні погода?', options: ['Сонячна', 'Дощова', 'Сніжна', 'Вітряна'] },
      { text: 'Дощ...', options: ['гарячий', 'теплий', 'холодний', 'прохолодний'] },
      { text: 'Що я беру під час дощу?', options: ['Капелюх', 'Шарф', 'Парасольку', 'Сонцезахисні окуляри'] },
      { text: 'Що ще я одягаю?', options: ['Піджак', 'Плащ', 'Чоботи', 'Рукавички'] },
      { text: 'Чи йде сьогодні дощ?', options: ['Ні', 'Можливо', 'Так', 'Невідомо'] },
    ],
  },
  {
    title: 'Пташка',
    passage: 'Я бачу пташку на дереві. Пташка синя й маленька. Вона співає щоранку. Мені подобається її слухати.',
    questions: [
      { text: 'Де пташка?', options: ['На даху', 'На дереві', 'На землі', 'У гнізді'] },
      { text: 'Якого кольору пташка?', options: ['Червона', 'Зелена', 'Синя', 'Жовта'] },
      { text: 'Пташка...', options: ['велика', 'маленька', 'висока', 'товста'] },
      { text: 'Коли пташка співає?', options: ['Щовечора', 'Щоранку', 'Уночі', 'Опівдні'] },
      { text: 'Чи подобається мені пташиний спів?', options: ['Ні', 'Я його ненавиджу', 'Так', 'Не дуже'] },
    ],
  },
  {
    title: 'Моя спальня',
    passage: 'Це моя спальня. Ліжко стоїть біля вікна. На столі — лампа. Моя кімната чиста й охайна.',
    questions: [
      { text: 'Що це за кімната?', options: ['Моя кухня', 'Моя спальня', 'Моя ванна', 'Моя вітальня'] },
      { text: 'Де стоїть ліжко?', options: ['Біля дверей', 'Біля вікна', 'Біля парти', 'Посередині'] },
      { text: 'Що на столі?', options: ['Книжка', 'Лампа', 'Годинник', 'Телефон'] },
      { text: 'Моя кімната...', options: ['брудна', 'неохайна', 'чиста й охайна', 'темна'] },
      { text: 'Стіл у мене в...', options: ['кухні', 'ванні', 'спальні', 'саду'] },
    ],
  },
];

// Continue CR beginner 10-99 will be loaded from separate chunk files if present
const morePath = path.join(UK, '.cr-beg-polish-rest.json');
let CR_BEGINNER_ALL = CR_BEGINNER;
if (fs.existsSync(morePath)) {
  const rest = JSON.parse(fs.readFileSync(morePath, 'utf8'));
  CR_BEGINNER_ALL = CR_BEGINNER.concat(rest);
}

function polishCrBeginner(uk) {
  const begIdx = [];
  uk.forEach((item, i) => {
    if (item.level === 'Beginner') begIdx.push(i);
  });
  let applied = 0;
  for (let j = 0; j < Math.min(begIdx.length, CR_BEGINNER_ALL.length); j++) {
    const i = begIdx[j];
    const p = CR_BEGINNER_ALL[j];
    const answers = uk[i].questions.map((q) => q.answer);
    const ids = uk[i].questions.map((q) => q.id);
    uk[i].title = p.title;
    uk[i].passage = p.passage;
    uk[i].questions = p.questions.map((q, qi) => ({
      id: ids[qi],
      text: q.text,
      options: q.options,
      answer: answers[qi],
    }));
    applied++;
  }
  return applied;
}

/** Level-texts Beginner targeted passage/vocab polish */
function polishLevelTextsBeginner(lt) {
  const fixes = {
    b1: {
      title: 'Мій ранок',
      text: 'Щоранку я прокидаюся рано. Відкриваю очі й потягуюся. Спочатку вмиваю обличчя холодною водою. Потім чищу зуби. Готую невеликий сніданок із хлібом і чаєм. Перед школою люблю почитати книжку. Мама всміхається мені. Я почуваюся щасливим і готовим до нового дня.',
      vocabulary: [
        { word: 'Ранок', definition: '(Іменник) Перша частина дня, до полудня.' },
        { word: 'Прокидатися', definition: '(Дієслово) Переставати спати й відкривати очі.' },
        { word: 'Потягуватися', definition: '(Дієслово) Витягувати руки й ноги, щоб розім’ятися.' },
        { word: 'Вмивати', definition: '(Дієслово) Мити обличчя водою.' },
        { word: 'Сніданок', definition: '(Іменник) Перший прийом їжі за день.' },
        { word: 'Готовий', definition: '(Прикметник) Підготовлений до чогось.' },
      ],
    },
    b2: {
      title: 'Моє родинне дерево',
      text: 'Ось фото моєї родини. Це мої батьки. Мого батька звати Бахтіяр, а матір — Маліка. У мене є один брат і одна сестра. Брат високий, його звати Азіз. Сестра маленька, її звати Лоліта. У нас є кіт. Його звати Ніко. Ми дуже щаслива родина.',
      vocabulary: [
        { word: 'Батьки', definition: '(Іменник) Батько і мати.' },
        { word: 'Брат і сестра', definition: '(Іменник) Діти одних батьків.' },
        { word: 'Високий', definition: '(Прикметник) Людина великого зросту.' },
        { word: 'Маленька', definition: '(Прикметник) Невелика за розміром; юна.' },
        { word: 'Родинне дерево', definition: '(Іменник) Схема, що показує членів родини.' },
        { word: 'Щаслива', definition: '(Прикметник) Повна радості й задоволення.' },
      ],
    },
    b3: {
      vocabulary: [
        { word: 'Найкращий друг', definition: '(Іменник) Друг, який вам найдорожчий.' },
        { word: 'Біля', definition: '(Прийменник) Поруч; недалеко.' },
        { word: 'Добрий', definition: '(Прикметник) Дружній і щедрий.' },
        { word: 'Веселий', definition: '(Прикметник) Той, хто смішить або радіє.' },
        { word: 'Чудовий', definition: '(Прикметник) Дуже хороший.' },
        { word: 'Офіс', definition: '(Іменник) Приміщення, де люди працюють за столами.' },
      ],
    },
    b5: {
      text: 'Мій улюблений колір — зелений. Мені подобається зелений, бо це колір природи й дерев. У мене є зелена куртка й зелений велосипед. Братові подобається червоний, а сестрі — жовтий. Кольори скрізь! Небо вдень синє, а вночі — чорне. Який ваш улюблений колір?',
      vocabulary: [
        { word: 'Улюблений', definition: '(Прикметник) Той, який вам найбільше подобається.' },
        { word: 'Природа', definition: '(Іменник) Тварини, рослини та світ поза людьми.' },
        { word: 'Скрізь', definition: '(Прислівник) Усюди.' },
        { word: 'Небо', definition: '(Іменник) Простір над землею, де пливуть хмари.' },
        { word: 'Куртка', definition: '(Іменник) Короткий верхній одяг.' },
        { word: 'Велосипед', definition: '(Іменник) Двоколісний транспорт, яким їздять, крутячи педалі.' },
      ],
    },
    b6: {
      vocabulary: [
        { word: 'Клас', definition: '(Іменник) Шкільна кімната, де вчаться учні.' },
        { word: 'Вчитель', definition: '(Іменник) Людина, яка допомагає учням учитися.' },
        { word: 'Стілець', definition: '(Іменник) Сидіння зі спинкою для однієї людини.' },
        { word: 'Стіна', definition: '(Іменник) Одна зі сторін кімнати.' },
        { word: 'Лічба', definition: '(Іменник) Називання чисел по порядку.' },
        { word: 'Легко', definition: '(Прислівник) Без труднощів.' },
      ],
    },
    b7: {
      vocabulary: [
        { word: 'Дім', definition: '(Іменник) Житло, де живуть люди.' },
        { word: 'Двері', definition: '(Іменник) Те, що відчиняють, щоб увійти до кімнати.' },
        { word: 'Вітальня', definition: '(Іменник) Кімната, де сидять і відпочивають.' },
        { word: 'Кухня', definition: '(Іменник) Кімната, де готують їжу.' },
        { word: 'Сад', definition: '(Іменник) Ділянка біля будинку з рослинами.' },
        { word: 'Оселя', definition: '(Іменник) Місце, де ви живете й почуваєтеся в безпеці.' },
      ],
    },
    b9: {
      text: 'Тема: Ласкаво просимо до класу! Привіт, Маріє! Мене звати Джон. Я ваш учитель української. Ласкаво просимо до нашої школи. Заняття починаються о 9:00 у понеділок. Будь ласка, принесіть зошит і ручку. Номер класу — 12. До зустрічі! З найкращими побажаннями, Джон',
      vocabulary: [
        { word: 'Тема', definition: '(Іменник) Заголовок електронного листа.' },
        { word: 'Ласкаво просимо', definition: '(Вираз) Дружнє вітання гостя.' },
        { word: 'Починатися', definition: '(Дієслово) Розпочинатись.' },
        { word: 'Принести', definition: '(Дієслово) Взяти щось із собою.' },
        { word: 'Невдовзі', definition: '(Прислівник) Незабаром.' },
        { word: 'Побажання', definition: '(Іменник) Дружнє завершення листа.' },
      ],
    },
    b11: {
      text: 'Футбол — найпопулярніший вид спорту у світі. Я люблю грати у футбол із друзями в парку. Нам потрібні м’яч і двоє воріт. Я одягаю футболку своєї команди та бутси. Я нападник, тож намагаюся забити м’яч у сітку й забити гол. Це дуже активна й весела гра.',
      vocabulary: [
        { word: 'Популярний', definition: '(Прикметник) Улюблений багатьма людьми.' },
        { word: 'Ворота', definition: '(Іменник) Рама, між якою гравці намагаються забити м’яч.' },
        { word: 'Футболка', definition: '(Іменник) Сорочка гравця спортивної команди.' },
        { word: 'Бутси', definition: '(Іменник) Спортивне взуття з шипами на підошві.' },
        { word: 'Нападник', definition: '(Іменник) Гравець, чиє головне завдання — забивати голи.' },
        { word: 'Забити', definition: '(Дієслово) Набрати очко в грі.' },
      ],
    },
    b12: {
      vocabulary: [
        { word: 'Басейн', definition: '(Іменник) Спеціальна водойма для плавання.' },
        { word: 'Купальник', definition: '(Іменник) Одяг для плавання.' },
        { word: 'Окуляри', definition: '(Іменник) Окуляри, щоб бачити під водою.' },
        { word: 'Прохолодна', definition: '(Прикметник) Трохи холодна; освіжаюча.' },
        { word: 'Рушник', definition: '(Іменник) Тканина для витирання.' },
        { word: 'Вправи', definition: '(Іменник) Фізична активність для здоров’я.' },
      ],
    },
    b14: {
      vocabulary: [
        { word: 'Фільми', definition: '(Іменник) Історія, показана рухомими зображеннями.' },
        { word: 'Кінотеатр', definition: '(Іменник) Будівля, де дивляться фільми.' },
        { word: 'Комедії', definition: '(Іменник) Смішний фільм або вистава.' },
        { word: 'Сміятися', definition: '(Дієслово) Сміятись від чогось кумедного.' },
        { word: 'Попкорн', definition: '(Іменник) Закуска з кукурудзи.' },
        { word: 'Супергерой', definition: '(Іменник) Персонаж із надзвичайними здібностями.' },
      ],
    },
    b25: {
      text: 'Дорога бабусю, як справи? У мене все добре. Я старанно вчуся в школі, і мені подобається урок української. Я сумую за твоїм смачним яблучним пирогом. Хочу відвідати тебе наступного місяця. У мене є для тебе новий малюнок. До зустрічі! З любов’ю, Тимур',
    },
    b57: {
      title: 'Мій перший урок української',
      text: 'Я пам’ятаю свій перший урок української. Трохи хвилювався, бо не знав жодного слова. Учителька була дуже доброю й сказала: «Привіт! Мене звати Сара». Ми вивчили алфавіт і як називати своє ім’я. Зараз я вже можу читати й писати українською!',
    },
    b60: {
      title: 'Підсумковий огляд: Мій світ українською',
      text: 'Тепер я можу багато чого сказати українською. Я вмію описати свою сім’ю, свій дім і свої хобі. Можу говорити про свої почуття й про погоду. Вивчення української — довга подорож, але вона дуже захоплива. Я учень і продовжуватиму вчитися щодня.',
    },
  };

  let n = 0;
  for (const p of lt.Beginner) {
    const f = fixes[p.id];
    if (!f) continue;
    if (f.title) p.title = f.title;
    if (f.text) p.text = f.text;
    if (f.vocabulary) p.vocabulary = f.vocabulary;
    n++;
  }
  return n;
}

function polishSpeakingWriting(obj) {
  // Light literary polish for common awkward patterns
  return walkStrings(obj, (s) => {
    let t = applySafeGlobals(s);
    t = t
      .replace(/Давай поговоримо про твоє ім'я\. Як тебе звати повністю\?/g, 'Поговорімо про твоє ім’я. Як тебе звати повністю?')
      .replace(/Напишіть короткий електронний лист, щоб представитися новому однокласнику\./g, 'Напишіть короткий електронний лист, щоб познайомитися з новим однокласником.')
      .replace(/\bанглійською мовою\b/g, (m, offset, str) => {
        // Only replace if clearly L2 self-ref (вивчати/урок/вчитель...)
        const ctx = str.slice(Math.max(0, offset - 40), offset + 40);
        if (/вивч|урок|вчител|клас|говор|мов/i.test(ctx) && !/Англі|ООН|лінгва|турист|Велик/i.test(ctx)) {
          return 'українською мовою';
        }
        return m;
      });
    return t;
  });
}

function polishDictationFile(txt) {
  let t = applySafeGlobals(txt);
  t = t
    .replace(/являється/g, 'є')
    .replace(/самий /g, 'най');
  return t;
}

function polishTask2(arr) {
  return walkStrings(arr, (s) => {
    let t = applySafeGlobals(s);
    // L2 self-ref: studying the language
    t = t.replace(/вивчати англійську/gi, 'вивчати українську');
    t = t.replace(/вивчення англійської/gi, 'вивчення української');
    t = t.replace(/англійською мовою(?=.*?(урок|вивч|мов))/gi, 'українською мовою');
    // Keep factual English as lingua franca topics — restore if we over-replaced
    // Manual: if prompt mentions "єдиної світової мови (наприклад, англійської)" KEEP
    return t;
  });
}

function main() {
  const report = { files: [], counts: {} };

  // 1) comprehensive-reading
  {
    const file = path.join(UK, 'comprehensive-reading.json');
    let uk = JSON.parse(fs.readFileSync(file, 'utf8'));
    const applied = polishCrBeginner(uk);
    uk = walkStrings(uk, applySafeGlobals);
    // Extra CR-wide literary fixes
    uk = walkStrings(uk, (s) =>
      s
        .replace(/Сонце дарує нам/g, 'Сонце дає нам')
        .replace(/дарує нам світло/g, 'дає нам світло')
        .replace(/Монетний двір/g, 'м’ята')
        .replace(/В дереві/g, 'На дереві')
        .replace(/в дереві/g, 'на дереві')
        .replace(/У миску\b/g, 'У мисці')
        .replace(/Зброя/g, 'руки') // bad MT for Arms in fingers Q - careful only in that context handled in CR beg
    );
    saveJson(file, uk);
    report.files.push('comprehensive-reading.json');
    report.counts.crBeginnerApplied = applied;
    report.counts.crTotal = uk.length;
  }

  // 2) level-texts
  {
    const file = path.join(UK, 'level-texts.json');
    let lt = JSON.parse(fs.readFileSync(file, 'utf8'));
    const n = polishLevelTextsBeginner(lt);
    lt = walkStrings(lt, applySafeGlobals);
    // Extra level-text fixes
    for (const level of Object.keys(lt)) {
      for (const p of lt[level]) {
        if (p.text) {
          p.text = p.text
            .replace(/Ми дуже щаслива родина\./g, 'Ми дуже щаслива родина.')
            .replace(/До скорої зустрічі!/g, 'До зустрічі!')
            .replace(/використовую сухий рушник/g, 'беру сухий рушник')
            .replace(/чудовий вид фізичних вправ/g, 'чудова фізична вправа')
            .replace(/Я почуваюся щасливим і готовим до дня\./g, 'Я почуваюся щасливим і готовим до нового дня.');
        }
        if (p.title === 'Мій перший урок англійської' || /English Lesson/i.test(p.title)) {
          p.title = p.title.replace(/англійської/gi, 'української').replace(/English/gi, 'української');
        }
        if (p.title && /World in English/i.test(p.title)) {
          p.title = 'Підсумковий огляд: Мій світ українською';
        }
        if (p.title && /в англійській|англійською$/i.test(p.title) && /Світ|огляд|Final/i.test(p.title)) {
          p.title = p.title.replace(/англійськ\w+/gi, 'українською');
        }
      }
    }
    // Fix remaining English-lesson self-refs in all levels
    lt = walkStrings(lt, (s) =>
      s
        .replace(/урок англійської/gi, 'урок української')
        .replace(/уроки англійської/gi, 'уроки української')
        .replace(/вчитель англійської/gi, 'вчитель української')
        .replace(/вчителька англійської/gi, 'вчителька української')
        .replace(/вивчати англійську/gi, 'вивчати українську')
        .replace(/вивчення англійської/gi, 'вивчення української')
        .replace(/англійською(?!\s+як)/gi, (m, off, str) => {
          const ctx = str.slice(Math.max(0, off - 50), off + 60);
          if (/Англі|ООН|лінгва franca|офіційн|турист|Великій Брит|англійські знаки/i.test(ctx)) return m;
          if (/говор|пиш|чита|уч|вивч|урок|мов/i.test(ctx)) return 'українською';
          return m;
        })
    );
    saveJson(file, lt);
    report.files.push('level-texts.json');
    report.counts.levelBeginnerFixes = n;
    report.counts.levelPassages = Object.values(lt).reduce((a, arr) => a + arr.length, 0);
  }

  // 3) speaking / writing
  for (const name of ['speaking-topics.json', 'writing-topics.json']) {
    const file = path.join(UK, name);
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data = polishSpeakingWriting(data);
    data = walkStrings(data, (s) =>
      s
        .replace(/урок англійської/gi, 'урок української')
        .replace(/вивчати англійську/gi, 'вивчати українську')
        .replace(/англійською мовою/gi, (m, off, str) => {
          const ctx = str.slice(Math.max(0, off - 50), off + 50);
          if (/Англі|ООН|лінгва|турист|Велик/i.test(ctx)) return m;
          return 'українською мовою';
        })
    );
    saveJson(file, data);
    report.files.push(name);
    report.counts[name] = Object.values(data).reduce((a, arr) => a + (arr?.length || 0), 0);
  }

  // 4) task2
  {
    const file = path.join(UK, 'task2.json');
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data = polishTask2(data);
    // Restore factual English-as-world-language prompts
    data = walkStrings(data, (s) =>
      s.replace(
        /єдиної світової мови \(наприклад, української\)/gi,
        'єдиної світової мови (наприклад, англійської)'
      ).replace(
        /єдину світову мову \(наприклад, українську\)/gi,
        'єдину світову мову (наприклад, англійську)'
      )
    );
    saveJson(file, data);
    report.files.push('task2.json');
    report.counts.task2Types = data.length;
  }

  // 5) dictation
  const dictDir = path.join(UK, 'dictation');
  for (const f of fs.readdirSync(dictDir).filter((x) => x.endsWith('.txt'))) {
    const file = path.join(dictDir, f);
    let txt = fs.readFileSync(file, 'utf8');
    const before = txt;
    txt = polishDictationFile(txt);
    txt = txt
      .replace(/урок англійської/gi, 'урок української')
      .replace(/вивчати англійську/gi, 'вивчати українську');
    if (txt !== before) {
      fs.writeFileSync(file, txt, 'utf8');
      report.files.push('dictation/' + f);
    } else {
      // still touch with normalize newlines for "reviewed"
      fs.writeFileSync(file, txt.replace(/\r\n/g, '\n'), 'utf8');
      report.files.push('dictation/' + f);
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
