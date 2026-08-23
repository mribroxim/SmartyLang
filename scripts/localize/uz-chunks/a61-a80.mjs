/** Agent-authored Latin Uzbek Advanced a61–a80 (offline kernels, no MT API). */
import { buildFromKernel } from './build-from-kernel.mjs';

const fixCyr = (s) =>
  String(s).replace(/[\u0400-\u04FF]/g, (ch) => {
    const map = {
      а: 'a', А: 'A', б: 'b', Б: 'B', в: 'v', В: 'V', г: 'g', Г: 'G',
      д: 'd', Д: 'D', е: 'e', Е: 'E', ё: 'yo', Ё: 'Yo', ж: 'j', Ж: 'J',
      з: 'z', З: 'Z', и: 'i', И: 'I', й: 'y', Й: 'Y', к: 'k', К: 'K',
      л: 'l', Л: 'L', м: 'm', М: 'M', н: 'n', Н: 'N', о: 'o', О: 'O',
      п: 'p', П: 'P', р: 'r', Р: 'R', с: 's', С: 'S', т: 't', Т: 'T',
      у: 'u', У: 'U', ф: 'f', Ф: 'F', х: 'x', Х: 'X', ц: 'ts', Ц: 'Ts',
      ч: 'ch', Ч: 'Ch', ш: 'sh', Ш: 'Sh', ъ: 'ʻ', ь: '', э: 'e', Э: 'E',
      ю: 'yu', Ю: 'Yu', я: 'ya', Я: 'Ya',
      ў: 'oʻ', Ў: 'Oʻ', қ: 'q', Қ: 'Q', ғ: 'gʻ', Ғ: 'Gʻ', ҳ: 'h', Ҳ: 'H',
    };
    return map[ch] ?? '';
  });

const deepFix = (x) => {
  if (typeof x === 'string') return fixCyr(x);
  if (Array.isArray(x)) return x.map(deepFix);
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) o[k] = deepFix(v);
    return o;
  }
  return x;
};

const kernels = [
  {
    "id": "a61",
    "format": "essay",
    "title": "Gʻamxoʻrlar “yoʻq”ni “ha”dek qanday hurmat qilishi kerak?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Gʻamxoʻrlikda “ha” oson eshitiladi, chunki u yordamni ochadi. “Yoʻq” esa toʻsiqdek tuyuladi — lekin u ham odamning chegarasidir.",
      "“Yoʻq”ni mensimaslik baʼzan mehr niqobi ostida keladi: “siz uchun yaxshi”. Bu asimmetriya rozilikni zaiflashtiradi.",
      "Hurmat — rad etishni yozib qoʻyish, qayta bosmaslik, va sabab soʻrashni bosimga aylantirmaslik.",
      "Bolalar va zaif odamlarda rozilik murakkabroq; shunda ham eng kam cheklov prinsipi ishlashi kerak.",
      "Oilalar baʼzan bemorning “yoʻq”ini qoʻrquvdan eshitmaydi. Tarjimon va himoyachi shu yerda koʻprik boʻladi.",
      "Hujjatlashtirilgan oldindan koʻrsatmalar “yoʻq”ni tinch kundagi ovozga aylantiradi.",
      "Xodim “ha”ga majburlanganda ham charchaydi; madaniyat rad etishni xiyonat deb koʻrmasligi kerak.",
      "Hurmat qilingan “yoʻq” keyinroq “ha”ni ham ishonchli qiladi.",
      "Aks holda yordam majburiylikka aylanadi va ishonch yemiriladi.",
      "Xulosa: “yoʻq” — toʻsiq emas, odamning egasiligidir."
    ],
    "fillers": [
      "Amaliy mashq: jamoa “yoʻq” eshitilganda qanday javob berishini yozib qoʻysin. Skript sharmni kamaytiradi.",
      "Qarindoshlar uchun tushuntirish varaqasi: qonun nima deydi, qachon istisno bor. Bilim bosimni yumshatadi."
    ]
  },
  {
    "id": "a62",
    "format": "feature",
    "title": "Vaqt tanqisligi gʻamxoʻrlik sifatini qanday oʻzgartiradi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Vaqt tanqisligi — faqat “bandlik” emas. U suhbatni qisqartiradi, kuzatuvni sayozlashtiradi, xatoni oshiradi.",
      "Yuqori oqim madaniyati tezlikni mukofotlaydi; sifat esa sekinlikni talab qiladi. Shu ziddiyat bemorni orasida qoldiradi.",
      "Xodimlar nisbati past boʻlsa, eng yaxshi niyat ham “konveyer”ga aylanadi.",
      "Uzluksizlik yoʻqolganda har safar qayta tushuntirish kerak — bu ham vaqt, ham ishonch xarajati.",
      "Dam olish yoʻq joyda xato “zaiflik” emas, tizim natijasi.",
      "Texnologiya baʼzi qogʻozlarni qisqartiradi; lekin u insoniy daqiqani avtomatik bermaydi.",
      "Rahbarlar vaqtni byudjet qatori deb koʻrsa, sifat oʻlchanadigan boʻladi.",
      "Oilalar “shoshilish”ni mensimaslik deb his qiladi; aslida bu resurs signalidir.",
      "Yaxshi dizayn: muhim suhbatlar uchun himoyalangan bloklar.",
      "Vaqt qaytarilmasa, gʻamxoʻrlik nomi qoladi, mazmuni esa yupqalashadi."
    ],
    "fillers": [
      "Kuzatuv: bir smenada necha marta “kechirasiz, shoshaman” aytiladi. Bu son sifatning yashirin koʻrsatkichi.",
      "Jamoat kampaniyalari faqat “qahramonlik”ni emas, shtat sonini ham talab qilishi kerak."
    ]
  },
  {
    "id": "a63",
    "format": "opinion",
    "title": "Oilalar layoqatli bemor istagini bekor qila oladimi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Layoqatli bemorning istagi — oʻziga egalik. Oila muhim, lekin u yakka hukmdor emas.",
      "Kollektiv madaniyatlarda oila ovozi kuchli. Bu hurmatli boʻlishi mumkin; lekin qonun koʻpincha shaxsni markazga qoʻyadi.",
      "Ong chalkashligi yoki bosim boʻlsa, “layoqat” qayta baholanadi. Eng kam cheklov yoʻli afzal.",
      "Oldindan yozilgan koʻrsatmalar bahsda kompas boʻladi.",
      "Oilani chetlatish ham xato: ularni eshitish bilan bemor “yoʻq”ini mensimaslik farq qiladi.",
      "Vosita xizmatlari til va qaror ramkasini tarjima qiladi.",
      "Majburiy davolash faqat qatʼiy mezon bilan; aks holda ishonch yoʻqoladi.",
      "Jamoat taʼlimi: vakil hujjati nima uchun kerak.",
      "Xulosa: oila yordamchi, hukmdor emas — layoqat ochiq turganida.",
      "Bu qoida sovuq emas; u zoʻravon mehrdan himoya."
    ],
    "fillers": [
      "Sud amaliyoti ochiq tushuntirilsa, oilalar “rad etish”ni xiyonat deb kamroq koʻradi.",
      "Shifokorlar yozuvda “kim nima dedi”ni aniq qoldirishi keyingi smenani asraydi."
    ]
  },
  {
    "id": "a64",
    "format": "dialogue",
    "title": "Prognoz noaniq boʻlsa, umidni qanday gapirish kerak?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "speakers": [
      "A",
      "B"
    ],
    "beats": [
      "Prognoz bitta raqam emas. Unda umidni qanday aytamiz?",
      "Umidni yolgʻon vaʼda qilmasdan aytish mumkin: “bilganimizcha”, “oyni qayta koʻramiz”.",
      "Oila aniq javob soʻraydi. Bu tabiiy.",
      "Aniqlik yoʻqligini aytish ham rostlik. Umidni oʻchirish emas — noaniqlikni tan olish.",
      "Yengillashtiruvchi yordam umidni oʻchirmaydimi?",
      "Yoʻq. U azobni kamaytirish umidini ochadi. Bu ham umid.",
      "Statistika odamni qoʻrqitadi.",
      "Oʻrtacha koʻrsatkich — aholi haqida. Shaxs yoʻli boshqacha boʻlishi mumkin. Shu farqni aytish kerak.",
      "Ruhaniy maslahatchi kerakmi?",
      "Koʻpincha ha. Umid faqat tibbiy emas, maʼno ham.",
      "Yolgʻon tinchlantirish keyin xiyonatdek tuyuladi.",
      "Shuning uchun “shu oy asosida” degan til yaxshi — qayta moslashishga joy qoldiradi.",
      "Bemorga nima yordam beradi?",
      "Savol: “Siz umiddan nima tushunasiz?” Keyin shu tilda gapirish.",
      "Xulosa?",
      "Umid — yolgʻon emas, ochiq eshik. Eshik esa qayta suhbat bilan ochiq qoladi."
    ],
    "fillers": [
      "A: Tirik qolish hikoyalari-chi?\nB: Ilhom beradi, lekin “hamma shunday” demaslik kerak. Kuzatuv soʻzlari qoʻrquv uygʻotishi mumkin — izohlang.",
      "A: Kechqurun portalda tahlil chiqsa?\nB: Kontekstsiz raqam qoʻrquvni toʻldiradi. Kechni himoya qiluvchi siyosat kerak."
    ]
  },
  {
    "id": "a65",
    "format": "email",
    "title": "Jamoalar axloqiy tiqilinchda qanday yordam soʻraydi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "emailOpen": "Subject: Axloqiy tiqilinchda yordam soʻrash tartibi\n\nHurmatli klinik rahbariyat,",
    "emailClose": "Hurmat bilan,\nMadina Karimova\nSmena yetakchisi",
    "beats": [
      "Klinik jumboqlar uchun maslahat odatiy. Axloqiy tiqilinch esa koʻpincha yoʻlakdagi xoʻrsinishda yashirinadi.",
      "Tiqilinch: toʻgʻri ish resurs yoki qarama-qarshi burch bilan toʻqnashganda.",
      "Yordam soʻrash zaiflik emas, kasbiy mahorat. Uni odatiy qilish kerak.",
      "Qisqa protokol: vaziyat, qiymatlar toʻqnashuvi, allaqachon sinab koʻrilgan yoʻllar, soʻralayotgan yordam.",
      "Keksalar shifokori, ijtimoiy xizmat va etika maslahati birgalikda ishlasin.",
      "Hujjatlashtirish keyingi smenani himoya qiladi va bemorni tashlab ketmaslikni koʻrsatadi.",
      "Javobgarlik qoʻrquvi soʻrashni toʻxtatmasin; rahbariyat himoya tilini ochiq aytishi kerak.",
      "Tavsiya: haftalik “axloqiy qisqa yigʻilish” — 15 daqiqa, aybsiz muhit."
    ],
    "fillers": [
      "Ordinatura dasturlarida etika faqat maʼruza boʻlmasin; smena oʻrtasida chaqirish odati boʻlsin.",
      "Hamkasblar ogʻir buyruqni rad etganlarni yolgʻiz qoldirmasin — bu ham sifat."
    ]
  },
  {
    "id": "a66",
    "format": "article",
    "title": "Yordamga muhtoj odamlarni nutq qanday hurmat qiladi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Til achinish, ilhom yoki yumshoq yashirish orasida sirpanadi. Har biri qadr-qimmatni buzishi mumkin.",
      "“Maxsus ehtiyoj”, “azob chekyapti”, “nogironligiga qaramay” — tarixiy yukli iboralar.",
      "Hurmat — odamni vosita yoki plakat qilmaslik. Agentlikni saqlash.",
      "Birinchi shaxs yoki identifikatsiya-birinchi tanlov jamoaga bogʻliq; soʻrang.",
      "Byudjet, rampa, maosh — shiorlardan keyingi rostlik.",
      "Rozilik shakllari oddiy tilda boʻlsa, hurmat davolashdan oldin boshlanadi.",
      "Shirin til baʼzan mensimaslikni yashiradi; ochiq, aniq til yaxshiroq.",
      "Ommaviy nutqda “yordam vositachisi” ohangidan qoching: odam savdo emas.",
      "Xulosa: hurmat kundalik jumlalarda sinovdan oʻtadi.",
      "Jamiyat oʻzaro bogʻliqlikni oddiy fakt deb koʻrsa, til yumshoqroq boʻladi."
    ],
    "fillers": [
      "Maktab darsliklarida tilni yangilash — avlodni yumshoqroq qiladi.",
      "Xodim treningida “nima demaslik” roʻyxati emas, “qanday soʻrash” mashqi kerak."
    ]
  },
  {
    "id": "a67",
    "format": "essay",
    "title": "Ilgʻor davolash foydasini kim oʻtkazib yuboradi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Yangi dori va usullar vaʼda beradi, lekin foyda teng taqsimlanmaydi.",
      "Geografiya, sugʻurta, irq, jins, nogironlik, raqamli savod — kim birinchi yetishini belgilaydi.",
      "Patent va narx tokchada yoʻq dori — suddagi yutuqni amalda bekor qilishi mumkin.",
      "Masofaviy tibbiyot qulay, lekin interneti yoʻqlar yana chetda qoladi.",
      "Global sogʻliq oʻlchovlari baʼzi kasalliklarni ustuvor qiladi; faollar bu tarafkashlikni koʻrsatadi.",
      "Hamjihatlik — faqat xayriya emas, kirish siyosati.",
      "Joriy etish rejasida “kim keyin” ochiq yozilmasa, jim tengsizlik keladi.",
      "Jamoat nazorati: navbat mezonlari tushunarli boʻlsin.",
      "Foydani oʻtkazib yuborish — tasodif emas, dizayn natijasi boʻlishi mumkin.",
      "Adolat — yangilikning ikkinchi yarmi."
    ],
    "fillers": [
      "Arzon dori bozori ochilmasa, “kirish” soʻzi boʻsh qoladi.",
      "Mahalliy klinikalar uchun trening va logistika — markaziy shifoxona yutuqlaridan muhimroq boʻlishi mumkin."
    ]
  },
  {
    "id": "a68",
    "format": "feature",
    "title": "Maksimal aralashuv qachon ogʻir tanlovdan qochadi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Har bir test va nayza baʼzan maqsadni kechiktiradi, emas hal qiladi.",
      "Prognoz yomon boʻlsa, texnologiya majburiyatdek tuyuladi.",
      "Mudofaa tibbiyoti ham shu bosimni kuchaytiradi: “hammasini qildik” degan himoya.",
      "Yengillashtiruvchi suhbat erta boʻlsa, oila “voz kechish”ni xiyonat deb kamroq koʻradi.",
      "Reanimatsiya resurslari cheklangan joyda maksimal yoʻl boshqalarni ham siqadi.",
      "Yozuvda maqsadlar aniq boʻlsa, smena almashinuvida chalkashlik kamayadi.",
      "Aza tutgan oilalarga keyingi qoʻllab-quvvatlash “maksimal quvurlar = muhabbat” afsonasini yumshatadi.",
      "Tanlov — texnologiyasizlik emas, maqsadga moslik.",
      "Qiyin suhbatdan qochish — kechiktirilgan ogʻriq.",
      "Yaxshi gʻamxoʻrlik baʼzan chegarani sevgi bilan qoʻyadi."
    ],
    "fillers": [
      "Simulyatsiya mashqlari shifokorlarga “toʻxtash” tilini oʻrgatadi.",
      "Jamoat: “hamma narsa qilindi” ohangini tanqidiy tinglash — fuqarolik."
    ]
  },
  {
    "id": "a69",
    "format": "opinion",
    "title": "Qurbonlik afsonasi gʻamxoʻrlarga qanday zarar beradi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Farishta hamshira, “kerak” degan qiz — jamiyat arzon mehnatni maqtov bilan toʻlaydi.",
      "Afsona ichga singadi: dam olish aybdorlikdek tuyuladi.",
      "Ekspluatatsiya shirin soʻz bilan keladi; bu ayblov, maqtov emas.",
      "Dam olish yoʻq tizim “qahramonlik”ni talab qiladi, keyin yonishni hayrat bilan kuzatadi.",
      "Oʻzini yoʻqotish kasbiy fazilat emas, xavf.",
      "Nafaqalar va haq oilaviy mehnatni byudjet qatoriga qoʻyadi — afsonani yechadi.",
      "Oʻqishda oʻzini asrash darsi shtatsiz boʻlsa, bu fazilat koʻrsatishi.",
      "Yorliq: yordam soʻragan “zaif”. Bu madaniyatni almashtirish kerak.",
      "Zarar — bemorga ham yetadi: charchagan qoʻl xato qiladi.",
      "Hurmat — maqtov emas, sharoit."
    ],
    "fillers": [
      "Kasaba va kasbiy uyushmalar shu afsonani ochiq nomlashi mumkin.",
      "Media “qahramon” sarlavhasini kamaytirib, shtat sonini yozsin."
    ]
  },
  {
    "id": "a70",
    "format": "article",
    "title": "Shifokorlar qoʻrquvni toʻldirmasdan qanday maʼlumot beradi?",
    "vocab": [
      [
        "avtonomiya",
        "oʻz hayoti haqida qaror qilish huquqi"
      ],
      [
        "rozilik",
        "erkin va tushunarli ijoza"
      ],
      [
        "gʻamxoʻrlik",
        "boshqaga yordam berish amaliyoti"
      ],
      [
        "chegara",
        "nima mumkinligini belgilash"
      ],
      [
        "umid",
        "yaxshiroq natijaga intilish"
      ],
      [
        "charchoq",
        "uzoq zoʻriqish holati"
      ],
      [
        "himoya",
        "zarardan saqlash"
      ],
      [
        "masʼuliyat",
        "oqibat uchun javobgarlik"
      ]
    ],
    "beats": [
      "Toʻliq maʼlumot — huquq; toʻfon — zarar. Chegara nozik.",
      "Nisbiy xavf qoʻrqitadi; mutlaq xavf va bazaviy chiziq tinchlantirishi mumkin.",
      "Qayta aytish usuli: bemor oʻz soʻzi bilan qaytarsa, chalkashlik erta chiqadi.",
      "Kasbiy jargon — tezlik; tushunish — sekinlik. Sekinlik rozilik sifati.",
      "Vaqt berilmasa, shifokor “otalik”ga sirpanadi.",
      "Portal siyosati kechqurun vahima ni kamaytirishi kerak.",
      "Tanlab berish: hamma fakt emas, kerakli tartib.",
      "Qoʻrquvni inkor etish emas, uni nomlash — hamkorlik.",
      "Yaxshi axborot — bemorni kichraytirmaydi.",
      "Bu mahorat oʻrgatiladi, “tabiat” emas."
    ],
    "fillers": [
      "Viziting oʻrtasida qisqa tekshiruv — oxirida charchagan bemordan yaxshiroq.",
      "Yozma qisqa xulosa uyga ketadi; ogʻzaki narsa unutiladi."
    ]
  },
  {
    "id": "a71",
    "format": "essay",
    "title": "Munozara shartlarini kim belgilaydi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Bahsdan oldin kimdir muammoni nomlaydi. Nom — dalilning eshigi.",
      "Ijara oshishi “bozor tuzatishi”mi yoki “koʻchirish inqirozi”mi? Yorliq keyingi dalilni saralaydi.",
      "Lugʻatni egallash — imperiya yumshoq shakli boʻlishi mumkin.",
      "Stigmatizatsiya qilingan soʻzlarni qaytarib olish kuch beradi; lekin hamma rozilik bilan emas.",
      "Ommaviy organlar muqobil ramkalarni ham eʼlon qilsa, munozara adolatroq boʻladi.",
      "Vaqtinchalik taʼriflar yaxshi: “hozir shunday ataymiz, keyin qayta koʻramiz”.",
      "Qarshilik baʼzan yangi tilni “hujum” deb koʻradi; baʼzan esa haqiqiy tushunmovchilik bor.",
      "Maktabda “bu savol qanday nomlangan?” degan mashq fuqarolikni oʻrgatadi.",
      "Shartnoma varagʻidagi atamalar kabi, siyosiy atamalar ham ochiq boʻlishi kerak.",
      "Xulosa: dunyoni kim nomlasa, bahs shu yerda boshlanadi."
    ],
    "fillers": [
      "Jurnalistika sarlavha tanlovini ochiq muhokama qilishi mumkin: nima uchun shu soʻz?",
      "Fuqarolar yigʻinida avval taʼrif, keyin ovoz — chalkashlikni kamaytiradi."
    ]
  },
  {
    "id": "a72",
    "format": "feature",
    "title": "Grammatika ommaviy nutqda agentlikni qanday yashiradi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "“Xatolar qilindi” — feʼlsiz jumla aybdorni eritadi.",
      "“Jamoalar taʼsirlandi” — kim taʼsir qilgani yoʻqoladi.",
      "Passiv ohang baʼzan ehtiyotkorlik; baʼzan esa yuvish.",
      "Muxbirlar “kim?” deb soʻrasa, grammatika ochiladi.",
      "Pudratchi va idora oʻrtasida masʼuliyat “jarayon”ga oʻtmasin.",
      "Ehtimoliy til (“mumkin”) ham chegarani yumshatadi; uni oʻlchov bilan birga bering.",
      "Tahrir siyosati: imkon qadar ismli feʼl.",
      "Tanqidchilar “til tahlili chalgʻitadi” desа, javob: til ham zarar vositasi.",
      "Oʻquvchilar oddiy mashq bilan agentlikni topishi mumkin.",
      "Shaffof gap — shaffof hisobotning boshlanishi."
    ],
    "fillers": [
      "Maktab insholarida passivni “yomon” demasdan, uning ishini tushuntirish yaxshi.",
      "Davlat matbuot xizmati namuna jumlalarni qayta yozib koʻrsatishi mumkin."
    ]
  },
  {
    "id": "a73",
    "format": "opinion",
    "title": "Nafrat nutqi qoidalari his-tuygʻuni himoya qiladimi yoki demokratiyani?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Qoidalar nima himoya qilishini aniq aytmasa, ixtiyoriy qoʻllash keladi.",
      "His-tuygʻu muhim; lekin faqat u boʻlsa, chegara noaniq boʻladi.",
      "Demokratik qobiliyat: odamlar bahsda teng ishtirok eta olishi.",
      "Insoniy qadrni yoʻqotuvchi til ishtirokni sindirishi mumkin.",
      "Haddan tashqari keng taqiq yashirin kanallarga haydaydi.",
      "Haddan tashqari tor taqiq esa zoʻravonlikni kechiktirib koʻradi.",
      "Moderatsiya ochiq mezon bilan boʻlsin; yopiq “fazilat” xavfli.",
      "Gibrid yondashuv: zoʻravonlikka undash — qattiq; haqorat — kontekstli.",
      "Maktablar munozara madaniyatini oʻrgatsa, taqiq yukі kamayadi.",
      "Aniq maqsad — adolatli qoidaning sharti."
    ],
    "fillers": [
      "Platformalar oʻz qoidalarini oddiy tilda chiqarsin; yuridik tuman ishonchni yemiradi.",
      "Fuqarolik jamiyati kuzatuvi — “kim oʻchirildi?” statistikasi."
    ]
  },
  {
    "id": "a74",
    "format": "dialogue",
    "title": "Metaforalar urashsa, siyosatga nima boʻladi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "speakers": [
      "A",
      "B"
    ],
    "beats": [
      "“Urush” metaforasi siyosatni qanday oʻzgartiradi?",
      "U favqulodda holatni chaqiradi: tezlik, dushman, yon-atrof zarari.",
      "Bu foydali boʻlishi mumkinmi?",
      "Baʼzan ha — diqqatni yigʻadi. Lekin tanqidni “xoinlik” qilishi mumkin.",
      "Salomatlikda “jang” tili-chi?",
      "Bemor “yutqazgan”dek his qilishi mumkin. Yumshoqroq til kerak.",
      "Media nima qilsin?",
      "Metaforani koʻrsatib qoʻysin: “bu oʻxshatish; boshqa oʻxshatish ham bor”.",
      "Neytral til bormi?",
      "Toʻliq emas. Lekin oʻzaro hurmat va audit mumkin.",
      "Siyosatga taʼsir?",
      "Byudjet “jang”ga oqadi; sekin islohot “zaif” koʻrinadi.",
      "Xulosa?",
      "Metafora — bepul emas. Uni tanlash — siyosiy tanlov.",
      "Biz nima qilaylik?",
      "Har safar soʻraylik: bu oʻxshatish kimni kuchaytiradi?"
    ],
    "fillers": [
      "A: Sport metaforasi yumshoqroqmi?\nB: Baʼzan. Lekin “yutish/yutqazish” ham murakkab siyosatni tekislaydi.",
      "A: Maktabda qanday oʻrgatiladi?\nB: Bir matnni uch xil metafora bilan qayta yozish — yaxshi mashq."
    ]
  },
  {
    "id": "a75",
    "format": "email",
    "title": "Muassasalar noaniqliksiz qanday inklyuziv yozadi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "emailOpen": "Subject: Inklyuziv yozuv boʻyicha ichki qoʻllanma\n\nHurmatli kommunikatsiya jamoasi,",
    "emailClose": "Hurmat bilan,\nSevara Toshpulatova\nTahrir kengashi",
    "beats": [
      "Inklyuziv til muhim; lekin noaniq boʻlsa, hech kim majburiyatni tushunmaydi.",
      "Aniqlik — hurmatning bir shakli: kim, nima, qachon.",
      "Stereotipni oldini olish bilan birga, amaliy koʻrsatmalar yozing.",
      "Odam-birinchi yoki identifikatsiya-birinchi — auditoriyaga moslab, izoh bilan.",
      "Ekran oʻqigich uchun matn tuzilishi ham inklyuziyadir.",
      "Majburiy qoidalar ilovada; asosiy matn qisqa va aniq.",
      "Yillik audit: qaysi iboralar chalkashtirdi, qaysilari yordam berdi.",
      "Maqsad: hamma oʻzini koʻrsin va nima qilish kerakligini bilsin."
    ],
    "fillers": [
      "Tarjima qilingan versiyalar ham bir xil aniqlikda boʻlsin; “asosiy til” ustunligi boʻlmasin.",
      "Xodimlar savol bersa, “hujjat noaniq” deb emas, “qaysi jumla?” deb soʻrang."
    ]
  },
  {
    "id": "a76",
    "format": "article",
    "title": "Kinoyali masofa qachon himoya qiladi — yoki jarohatlaydi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Kinoya baʼzan naivlikdan himoya. Baʼzan esa mensimaslik.",
      "Zaif guruh ustidan kinoya — kuchning arzon shakli.",
      "Oʻzini himoya qilish uchun kinoya foydali boʻlishi mumkin; kontekst muhim.",
      "Immunitet tuygʻusi: “men hazil qilyapman” — javobgarlikni yuvadi.",
      "Haddan tashqari tartib ham ijodni oʻldiradi; muvozanat kerak.",
      "Darvozabonlar “hazil”ni kim uchun ruxsat etishini tekshirishi lozim.",
      "Sinov: hazildan keyin kim jim qoldi? Jimlik — signal.",
      "Oʻqituvchilar kinoyani tahlil qilishni oʻrgatishi mumkin.",
      "Yaralovchi kinoya “erkinlik” nomini olmasin.",
      "Himoya qiluvchi kinoya — kuchni ochish, yashirish emas."
    ],
    "fillers": [
      "Ijtimoiy tarmoqlarda kontekst yoʻqoladi; shuning uchun ehtiyot ortadi.",
      "Teatr va satira anʼanasi bor; lekin anʼana aybsizlik sertifikati emas."
    ]
  },
  {
    "id": "a77",
    "format": "essay",
    "title": "Majburiy jimlikni agentlikdan qanday ajratamiz?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Jimlik tanlov ham, majburiyat ham boʻlishi mumkin.",
      "Strategik jimlik — kuch; oʻrgatilgan ojizlik — tuzoq.",
      "Ritual jimlik (hurmat) bilan qoʻrquv jimligi farq qiladi.",
      "Norozilikni “shovqin” deb yopish — majburiy jimlik yaratadi.",
      "Yashirin taqiqlar: hisob yopilishi, ishdan qoʻrqish.",
      "Ajratish uchun: chiqish xavfsizmi? Alternativ kanal bormi?",
      "Jabrlanganni qayta jarohatlash xavfi — “gapir” bosimida ham bor.",
      "Tadqiqotda rozilik va xavfsizlik birinchi.",
      "Jamiyat jimlikni muqaddaslashtirmasligi kerak.",
      "Agentlik — gapirish majburiyati emas, tanlov imkoni."
    ],
    "fillers": [
      "Ish joyida anonim kanal boʻlsa, majburiy jimlik kamayadi.",
      "Maktabda “soʻz berish navbati” jim qolganlarni majburlamasdan ochadi."
    ]
  },
  {
    "id": "a78",
    "format": "feature",
    "title": "Nega nozik ishontirish bilimlilarga koʻproq taʼsir qiladi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Oddiy tashviqot savodsizga moʻljallangan deb oʻylash — xato.",
      "Bilimli odam “uslub”ga ishonadi: metod, manba, jargon.",
      "Motivatsiyalangan mulohaza: xohlagan xulosani “dalil” bilan yuvish.",
      "Tanlab olish va yuvish — elita axborot maydonida kuchli.",
      "Sertifikat ishonch beradi; baʼzan esa tanqidni uxlatadi.",
      "Cynicism ham himoya emas: u ham manipulyatsiyaga ochiq.",
      "Yechim: metodni tekshirish odati, nafaqat xulosani.",
      "Media savodxonligi oliy maʼlumotda ham kerak.",
      "Munozara klublarida “qarama-qarshi eng yaxshi versiya” mashqi foydali.",
      "Bilim — qalqon emas, masʼuliyat."
    ],
    "fillers": [
      "Universitetlar oʻz bitiruvchilariga “siz ham aldanasiz” deb ochiq aytishi kerak.",
      "Ilmiy jurnallar ham marketing tilini tekshirsin."
    ]
  },
  {
    "id": "a79",
    "format": "opinion",
    "title": "Vosita odamlar bosim ostida xabarni qanday qayta shakllantiradi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "Vosita — tarjimon va filtr. Bosim ostida filtr qattiqlashadi.",
      "Sodiqlik: asl maʼnoni saqlash. Registr: auditoriyaga moslash.",
      "Koʻprik iboralar foydali; lekin ular “yolgʻon muvozanat” yaratmasin.",
      "Oddiy oʻquvchi uchun soddalashtirish — hurmat; boʻshatish — xiyonat.",
      "Taglavha va qisqa matn siyosiy qurol boʻlishi mumkin.",
      "Yonma-yon matn (asl + izoh) ishonchni oshiradi.",
      "Ish beruvchi bosimi “yumshoq” xabar talab qilsa, vosita axloqi sinovdan oʻtadi.",
      "Kasbiy kodeks: qachon rad etish kerak.",
      "Jamoatchilik vositani koʻrinmas deb hisoblamasin.",
      "Yaxshi vosita — koʻrinadigan tanlovlar bilan."
    ],
    "fillers": [
      "Sud tarjimonlari uchun trening — umumiy vosita etikasi uchun namuna.",
      "Jurnalistikada muharrir izohi ohangni oʻzgartirmasligi kerak."
    ]
  },
  {
    "id": "a80",
    "format": "article",
    "title": "Asosiy soʻzlar turlicha maʼno bersa, odamlar qanday bahslashadi?",
    "vocab": [
      [
        "munozara",
        "turli fikrlarni ochiq aytish"
      ],
      [
        "metafora",
        "oʻxshatish orqali tushuntirish"
      ],
      [
        "taʼrif",
        "soʻzning chegaralangan maʼnosi"
      ],
      [
        "agentlik",
        "harakat qilish qobiliyati"
      ],
      [
        "ishontirish",
        "fikrni oʻzgartirishga urinish"
      ],
      [
        "jimlik",
        "gapirmaslik holati"
      ],
      [
        "aniqlik",
        "tushunarli va aniq ifoda"
      ],
      [
        "inklyuzivlik",
        "koʻpchilikni qoʻshish"
      ]
    ],
    "beats": [
      "“Erkinlik”, “xavfsizlik”, “adolat” — bir xil yoziladi, turlicha yashaydi.",
      "Shartnoma: avval taʼrif, keyin bahs. Bu sekin, lekin arzonroq.",
      "Izoh va havola — yaxshi niyat belgisi.",
      "Koʻplikni tan olish: bitta soʻzning bir necha ishlatilishi.",
      "Murosa qilinmaydigan yadroni ochiq aytish — vaqt tejaydi.",
      "Yomon niyatli bahs taʼrifni ataylab siljitadi.",
      "Eng yaxshi versiyani tushunish (steelman) ishonchni oshiradi.",
      "Baʼzan bahs soʻz ustida emas, vakolat ustida — proksi urush.",
      "Maktab debatlari shu chalkashlikni oʻrgatishi kerak.",
      "Tushunish — kelishish majburiyati emas, lekin sharti."
    ],
    "fillers": [
      "Davlat hujjatlarida glossariy boʻlsa, fuqaro chalkashligi kamayadi.",
      "Oilaviy janjalda ham “sen nima demoqchisаn?” savoli tinchlantiradi."
    ]
  }
];

export const LESSONS = Object.fromEntries(
  kernels.map((k) => {
    const built = buildFromKernel(deepFix(k));
    return [built.id, deepFix(built)];
  }),
);
