/**
 * Ship Pre-Intermediate rebuild: authored p1–p10 + p50, polished existing for rest.
 * Natural vocab defs, calque fixes, length floor. No kernel fillers. No final pack write.
 */
import fs from 'fs';
import path from 'path';
import {
  EN_PATH,
  REBUILD_DIR,
  normalizeLesson,
  targetSecondsFor,
  validateLesson,
  validateSense,
  wordCount,
  writeJson,
  vocabAppearsInText,
} from '../../../../../scripts/localize/shared.mjs';
import { lessons as authoredP1P10 } from './_chunk-p01-p10.mjs';

const LEVEL = 'Pre-Intermediate';

function naturalDef(def) {
  let d = String(def || '').trim();
  if (!d) return d;
  d = d.replace(/^\((Noun|Verb|Adjective|Adverb)\)\s*/i, '');
  const exact = {
    'Maʼlumotlarni tartibli koʻrsatish uchun qator va ustunlardan iborat tuzilma.':
      'vaqt yoki ishlarni tartiblab yozilgan reja',
    'Maʼlumotlarni tartibli koʻrsatish uchun qator va ustunlardan iborat tuzilma':
      'vaqt yoki ishlarni tartiblab yozilgan reja',
    'Berilgan savolga yoki aytilgan fikrga qarshi aytiladigan soʻz.':
      'savol yoki gapga qaytarilgan soʻz',
    'Berilgan savolga yoki aytilgan fikrga qarshi aytiladigan soʻz':
      'savol yoki gapga qaytarilgan soʻz',
    'Faol boʻlmagan, harakatsiz.': 'harakatsiz, passiv',
    'Faol boʻlmagan, harakatsiz': 'harakatsiz, passiv',
    'Biror ishni davom ettirishga imkon bermaslik.': 'davom etishga yoʻl qoʻymaydi',
    'Biror ishni davom ettirishga imkon bermaslik': 'davom etishga yoʻl qoʻymaydi',
    'Oʻzini boshqalardan ustun qoʻyish hissi, gʻurur.': 'oʻzini yuqori qoʻyish hissi',
    'Oʻzini boshqalardan ustun qoʻyish hissi, gʻurur': 'oʻzini yuqori qoʻyish hissi',
    'Ishchilarning oʻz talablarini qondirish uchun ishni toʻxtatishi.':
      'ishchilar ishni toʻxtatib talab bildirishi',
    'Ishchilarning oʻz talablarini qondirish uchun ishni toʻxtatishi':
      'ishchilar ishni toʻxtatib talab bildirishi',
    'Asoslanmagan holda biror narsaning toʻgʻri ekanligini qabul qilish.':
      'aniq bilmasdan faraz qilish',
    'Asoslanmagan holda biror narsaning toʻgʻri ekanligini qabul qilish':
      'aniq bilmasdan faraz qilish',
    'Biror narsani ishdan chiqarish, shikastlash yoki rejasini barbod qilish.':
      'buzib yuborish yoki rejani barbod qilish',
    'Biror narsani ishdan chiqarish, shikastlash yoki rejasini barbod qilish':
      'buzib yuborish yoki rejani barbod qilish',
  };
  if (exact[d]) d = exact[d];
  if (/^[A-ZÀ-ÖØ-ÞА-ЯЁ]/.test(d) && !/^[A-Z]{2,}/.test(d)) {
    d = d.charAt(0).toLowerCase() + d.slice(1);
  }
  d = d.replace(/\.$/, '');
  if (d.length > 95) {
    const cut = d.slice(0, 95);
    const i = Math.max(cut.lastIndexOf(','), cut.lastIndexOf(';'));
    d = (i > 40 ? cut.slice(0, i) : cut).trim();
  }
  return d;
}

const CALQUE_FIXES = [
  [/Tinglashning qiyinroq boʻlishining sabablaridan biri shu\./g, 'Tinglash shuning uchun ham qiyinroq.'],
  [/xuddi ular yagona muhim narsalardek gapirishadi/g, 'goʻyo faqat ular muhimdek gapirishadi'],
];

function fixMarks(text) {
  let t = String(text || '');
  for (const [re, to] of CALQUE_FIXES) t = t.replace(re, to);
  return t
    .replace(/o'/g, 'oʻ')
    .replace(/g'/g, 'gʻ')
    .replace(/O'/g, 'Oʻ')
    .replace(/G'/g, 'Gʻ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Topic-specific expansions to reach B1 length without kernel fillers. */
const EXPANSIONS = {
  p1: `Kichik tanlovlar haqida gapirish baʼzan «ortiqcha nazorat»dek eshitiladi. Lekin maqsad hayotni qafasga solish emas. Maqsad — ketma-ket keladigan mayda oqibatlarni koʻrish. Masalan, kechqurun yana bir seriya koʻrish ertangi diqqatni olib qoʻyishi mumkin. Shu bogʻlanishni koʻrsangiz, tanlov aybdorlik emas, vositaga aylanadi. Men endi haftaning oxirida uchta mayda tanlovni eslab, qaysi biri menga tinchlik berganini belgilayman. Bu oddiy yozuv katta nutqdan koʻra koʻproq oʻzgartiradi, chunki u haqiqiy haftaga bogʻlanadi.`,
  p2: `Muhimi shuki, tartib yoki egiluvchanlikni shaxsiyat belgisi qilib qoʻymaslik. Baʼzi odamlar erta turishni fazilat deb koʻradi, boshqalar kech ishlashni. Ikkalasi ham ishlashi mumkin, agar uyqu, ovqat va vaʼdalar himoyalansa. Men uchun eng yaxshi signal — yakshanba oqshomi: ertaga nima kutayotganini bilamanmi, yoinki hamma narsa noaniqmi? Noaniqlik koʻp boʻlsa, tartibni biroz kuchaytiraman. Hamma narsa qattiq boʻlsa, bitta kechani ochiq qoldiraman. Shu tebranma moslashuv «mukammal uslub»dan koʻra chidamliroq.`,
  p3: `Fikrni oʻzgartirishning yana bir tomoni — oʻzingizga aytadigan hikoya. «Men beqarorman» deb boshlasangiz, har bir tuzatish oʻzini tasdiqlaydi. «Men yangi maʼlumotga moslashaman» deb boshlasangiz, xuddi shu harakat oʻsishga oʻxshaydi. Shuning uchun men endi bekor qilish xabariga sababni qisqa yozaman: nima oʻzgardi, kimga taʼsir qiladi, keyingi qadam nima. Bu odob ham, aniqlik ham. Odamlar noaniq uzrdan koʻra qisqa va aniq sababni yaxshiroq qabul qiladi.`,
  p4: `Tezlikni tanlashda tananing signalini ham eshitish kerak. Qorinning qisilishi baʼzan xavfni, baʼzan shunchaki shoshilishni bildiradi. Ikkalasini ajratish uchun men «besh nafas qoida»sini ishlataman: favqulodda boʻlmasa, besh marta nafas olguncha javob bermayman. Shu qisqa pauza sekin qarorni kechiktirmaydi, lekin koʻr-koʻrona tezlikni toʻxtatadi. Keyin savol oddiy: bu qarorni ertaga ham himoya qila olamanmi? Agar javob noaniq boʻlsa, hali maʼlumot yetishmayotgan boʻlishi mumkin.`,
  p5: `Doʻstlar taʼsirini yozib koʻrish ham foydali. Bir hafta davomida «ha» degangan uchta narsani belgilang va yoniga yozing: bu mening istagimmi yoki guruhning ohangi? Baʼzan ikkalasi bir xil boʻladi — bu yaxshi. Baʼzan esa faqat ohang boʻladi. Shu farqni koʻrganingizdan keyin muloyim rad javobi osonlashadi. Sogʻlom doʻstlik «yoʻq»dan keyin ham suhbatni davom ettiradi. Agar suhbat darhol sovisa, taʼsir bosimga aylanganini sezasiz.`,
  p6: `Reja buzilganda oziq-ovqat, suv va quvvat kabi oddiy ehtiyojlarni birinchi qoʻyaman. Och yoki charchagan holda muqobil izlash qiyinroq. Shuning uchun sumkada kichik yeyishlik va zaryadlovchi boʻlishi baʼzan «egiluvchanlik»ning eng amaliy qismi. Keyin guruhdagi eng jim odamdan boshlab keyingi qadamni soʻrayman: baʼzan eng yaxshi gʻoya shovqinli ovozdan emas, tinch kuzatuvdan keladi. Aniq keyingi qadam vahimani qisqartiradi.`,
  p7: `Pushaymonlikni yozganda men endi ikki ustun ochaman: «oʻsha paytda bilganim» va «hozir bilganim». Bu ikki ustun oʻtgan oʻzimni haqsiz hukm qilishni kamaytiradi. Agar ikkala ustun bir xil boʻlsa ham xato qilgan boʻlsam, demak qoida kerak. Agar farq katta boʻlsa, yumshoqlik kerak. Shu oddiy jadval pushaymonlikni tumandan chiqarib, keyingi qadamga aylantiradi. Keyin qoidani bir jumlada yozib, telefonga eslatma qilib qoʻyaman.`,
  p8: `Qulaylik bilan sinovni haftalik kalendarga ham joylashtirish mumkin. Masalan, chorshanba kechasi yangi narsa — dars, suhbat yoki marshrut. Juma kechasi esa tanish dam olish. Shu ritm meni doim zoʻriqtirishdan yoki doim yashirinishdan saqlaydi. Agar sinov faqat boshqalarning olqishi uchun boʻlsa, uni qisqartiraman. Agar sinov menga kerakli koʻnikma bersa, qulaylikni uning atrofida quraman. Maqsad — jasoratni koʻrsatish emas, chidamli oʻsish.`,
  p9: `Adolatni tekshirishning oddiy usuli — «almashish testi». Qaror qoidasini boshqa odamning oʻrniga qoʻyib koʻring: shunda ham qabul qilarmidingiz? Agar yoʻq boʻlsa, qoida hali xom. Yana bir belgi — muhokama qilish mumkinligi. Qoidani gapirish taqiqlansa, u yerda kuch bor, adolat kam. Men endi uy ishlari yoki pul boʻyicha kelishuvni ikki haftadan keyin qayta koʻrib chiqish sanasini ham yozaman. Sana boʻlsa, norozilik yigʻilib qolmaydi.`,
  p10: `Odat qarorning «avtomatik uchuvchisi»ga oʻxshaydi. Yaxshi sozlangan boʻlsa, charchagan kunda ham yoʻldan chiqmaydi. Yomon sozlangan boʻlsa, xuddi shu avtomatik rejim sizni keraksiz xaridorlikka yoki kechki ekranga olib ketadi. Shuning uchun men odatni haftasiga bir marta qisqa savol bilan tekshiraman: bu odat menga tinchlik berayaptimi yoki faqat eskirgan qoʻrquvni takrorlayaptimi? Javob ikkinchi boʻlsa, odatni yumshoq tahrirlayman. Kichik tahrir katta «yangi hayot» vaʼdasidan chidamliroq.`,
};

function ensureLength(authoredText, expansion, minW = 320, maxW = 420) {
  let text = fixMarks(authoredText);
  if (wordCount(text) < minW && expansion) {
    text = `${text}\n\n${fixMarks(expansion)}`;
  }
  if (wordCount(text) > maxW) {
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    while (paras.length > 4 && wordCount(paras.join('\n\n')) > maxW) paras.pop();
    text = paras.join('\n\n');
  }
  if (wordCount(text) > maxW) {
    const words = text.split(/\s+/).slice(0, maxW);
    text = words.join(' ');
    if (!/[.!?…]$/.test(text)) text += '.';
  }
  return text;
}

const SHOWCASE = {
  p50: {
    id: 'p50',
    title: 'Siz uchun sogʻlomroq tartib qanday boʻlardi?',
    text: `Agar bir haftani farovonlik uchun qayta tuzsam, avvalo uchta asosiy narsani himoya qilardim: barqaror uyqu vaqtlari, ekransiz yeyiladigan ikkita haqiqiy ovqat va oʻzimga yoqadigan bir blok harakat. Qolgan hamma narsa shu uchtala atrofida joylashardi — ularni qoldiq daqiqalarga siqib tiqish emas.

Ertalablar sekinroq boshlanardi. Telefonni darhol ochish oʻrniga oʻn daqiqa tinch oʻtirib, kunning ikkita ustuvor ishini yozib olardim. Bu kichik marosim shoshilinchni kamaytiradi. Nonushta oddiy boʻlishi mumkin, lekin shoshib yutilmasdi. Yoʻlda podcast oʻrniga baʼzan jim yurishni tanlardim: quloq ham dam olishi kerak.

Kunduzi tanaffuslarni «yana bir xabar» uchun yemasdim. Yigirma besh daqiqalik diqqatdan keyin uch daqiqa turib choʻzilish yoki suv ichish — charchatmaydigan tiklanish. Tushlikni stol yonida emas, imkon boʻlsa deraza yoki hovli yonida yeyishga harakat qilardim. Ovqatni ish bilan aralashtirish odatda ikkalasini ham yomonlashtiradi.

Kechqurun yopilish marosimi boʻlardi: ertangi kiyimni tayyorlash, sumkani tekshirish, ekranni uxlashdan bir soat oldin yopish. Bu qoidalar kurort emas — realistik. Baʼzi kechalar mehmon yoki muddat tufayli buziladi; shunda ertasi kuni yana asosiy uchtalikka qaytaman. Sogʻlom tartib mukammal hafta emas, qaytib kelinadigan iz.

Ixtiyoriy narsalarni ham qoldirardim: doʻst bilan qisqa suhbat, yoqtirgan musiqa, qisqa sayr. Ular «qoʻshimcha» emas — kayfiyatning yonilgʻisi. Solishtirishni kamaytirish uchun ijtimoiy tarmoqdagi «ideal kun» lentasini cheklardim. Oʻz tartibimni boshqa birovning fotosiga emas, oʻz uyqum va energiyamga qarab oʻlchardim.

Sogʻlomroq tartib menga qanday koʻrinadi? Kamroq shovqin, aniqroq ustuvorlik, va dam olishni aybdorliksiz qabul qilish. Agar shu uchala ishlasa, qolgan qarorlar osonlashadi. Agar ishlamasa, yana bir kichik qadamni sozlayman — butun hayotni bir kechada qayta yozmasdan.

Haftaning oxirida uchta savol qoldiraman: nima kuch berdi, nima olib qoʻydi, keyingi haftada qaysi bitta odatni saqlayman. Baʼzan javob oddiy boʻladi — oʻn daqiqa erta uxlash. Baʼzan esa bitta majlisni rad etish. Muhimi shuki, tartib mening haqiqiy haftamga mos keladi, boshqa birovning ideal jadvaliga emas. Shu moslik boʻlsa, sogʻlomlik reja emas, odatga aylanadi.`,
    vocabulary: [
      { word: 'asosiy', definition: 'eng muhim, markaziy' },
      { word: 'qoldiq', definition: 'ortib qolgan, ikkinchi darajali' },
      { word: 'ustuvor', definition: 'birinchi oʻrindagi' },
      { word: 'marosim', definition: 'takrorlanadigan kichik odat' },
      { word: 'tiklanish', definition: 'kuchni qayta olish' },
      { word: 'yopilish marosimi', definition: 'kunni yumshoq yakunlash odati' },
      { word: 'realistik', definition: 'amalda bajarish mumkin' },
      { word: 'ixtiyoriy', definition: 'majburiy emas, xohishga bogʻliq' },
      { word: 'solishtirish', definition: 'oʻzini boshqalar bilan tenglashtirish' },
      { word: 'charchatmaydigan', definition: 'zoʻriqtirmaydigan' },
      { word: 'siqib tiqish', definition: 'tor joyga majburlab joylashtirish' },
      { word: 'sozlayman', definition: 'kichik tuzatish kiritaman' },
    ],
  },
};

const authoredById = Object.fromEntries(authoredP1P10.map((l) => [l.id, l]));

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'))[LEVEL];
const uzOld = JSON.parse(fs.readFileSync(path.join(REBUILD_DIR, '../level-texts.json'), 'utf8'))[LEVEL];

const out = [];
const failures = [];

for (let i = 0; i < 100; i++) {
  const enL = en[i];
  const old = uzOld[i];
  let raw;
  if (SHOWCASE[enL.id]) {
    raw = {
      ...SHOWCASE[enL.id],
      text: ensureLength(SHOWCASE[enL.id].text, null, 280, 420),
    };
  } else if (authoredById[enL.id]) {
    const a = authoredById[enL.id];
    raw = {
      id: a.id,
      title: a.title,
      text: ensureLength(a.text, EXPANSIONS[a.id], 320, 420),
      vocabulary: a.vocabulary,
    };
  } else {
    raw = {
      id: enL.id,
      title: old.title,
      text: fixMarks(old.text),
      vocabulary: (old.vocabulary || []).map((v) => ({
        word: v.word,
        definition: naturalDef(v.definition),
      })),
    };
  }

  raw = {
    ...raw,
    title: fixMarks(raw.title),
    text: fixMarks(raw.text),
    vocabulary: (raw.vocabulary || []).map((v) => ({
      word: fixMarks(v.word),
      definition: naturalDef(v.definition),
    })),
  };

  let lesson = normalizeLesson(raw, enL);
  lesson.targetSeconds = targetSecondsFor(lesson.text);

  if (lesson.vocabulary.length < 6) {
    const extras = [];
    for (const v of old.vocabulary || []) {
      const item = { word: fixMarks(v.word), definition: naturalDef(v.definition) };
      if (vocabAppearsInText(item.word, lesson.text)) extras.push(item);
    }
    const merged = [...lesson.vocabulary];
    for (const e of extras) {
      if (merged.length >= 10) break;
      if (!merged.some((m) => m.word === e.word)) merged.push(e);
    }
    lesson.vocabulary = merged.slice(0, 12);
    lesson = normalizeLesson(lesson, enL);
    lesson.targetSeconds = targetSecondsFor(lesson.text);
  }

  const v = validateLesson(LEVEL, enL, lesson);
  const s = validateSense(LEVEL, enL, lesson);
  if (!v.ok || !s.ok) {
    failures.push({ id: enL.id, errors: [...v.errors, ...s.errors], words: wordCount(lesson.text) });
  }
  out.push(lesson);
}

writeJson(path.join(REBUILD_DIR, 'Pre-Intermediate.json'), out);
writeJson(path.join(REBUILD_DIR, '_pre-int-failures.json'), failures);

console.log(
  `Wrote ${out.length}/100; fail ${failures.length}; avgWords ${Math.round(out.reduce((a, l) => a + wordCount(l.text), 0) / 100)}`,
);
if (failures.length) {
  console.log(failures.slice(0, 15));
  process.exitCode = 1;
} else {
  console.log('p1:', out[0].title, wordCount(out[0].text) + 'w');
  console.log('p50:', out[49].title, wordCount(out[49].text) + 'w');
  console.log(out[0].text.slice(0, 280));
  console.log('---');
  console.log(out[49].text.slice(0, 280));
}
