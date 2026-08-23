/** Agent-authored Latin Uzbek Advanced a81–a100 (offline kernels, no MT API). */
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
    "id": "a81",
    "format": "essay",
    "title": "Tizimli nigoh ekologik hukmni qanday oʻzgartiradi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Yakka daraxtni koʻrish oson; oqim, tuproq, migratsiya yoʻlini koʻrish qiyinroq.",
      "Tizimli nigoh aloqalarni birinchi oʻringa qoʻyadi.",
      "Kechikkan teskari aloqa “hammasi joyida” degan yolgʻon tinchlik beradi.",
      "Soddalashtirish baʼzan kerak; lekin u siyosatni chalgʻitmasin.",
      "Qiyosiy tajriba: boshqa havzadagi yechimni koʻr-koʻrona koʻchirmang.",
      "Hamkor boshqaruv mahalliy bilimni modelga qoʻshadi.",
      "Epistemologiya savoli: biz nima bilamiz va nima bilmaymiz?",
      "Hukm oʻzgarsa, byudjet ham oʻzgaradi: profilaktika qimmatroq koʻrinadi, lekin arzonroq chiqadi.",
      "Fuqarolar xarita va hikoya bilan tizimni oʻrganishi mumkin.",
      "Xulosa: bogʻliqlikni koʻrish — masʼuliyatni kengaytirish."
    ],
    "fillers": [
      "Maktab ekskursiyasi faqat “chiroyli tabiat” emas, oqava suv nuqtasini ham koʻrsatsin.",
      "Korxonalar taʼminot zanjirini ochsa, tizim nigohi amaliy boʻladi."
    ]
  },
  {
    "id": "a82",
    "format": "feature",
    "title": "Kechikkan teskari aloqalar sekin sezishni qanday jazolaydi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Yer osti suvi yillar davomida kamayadi; sezilganda kech boʻladi.",
      "Turlar yoʻqolishi ham shu naqshda: jim, keyin toʻsatdan.",
      "Qaytarib boʻlmaslik chegarasi yaqinlashganda, “kutib turaylik” qimmatga tushadi.",
      "Avlodlararo adolat — kechikishning axloqiy nomi.",
      "Ehtiyot prinsipi: noaniqlikda zarar yoʻnalishini tanlash.",
      "Inkor qulay: bugungi foyda koʻrinadi, ertangi zarar yoʻq.",
      "Monitoring erta ogohlantirish beradi; uni kesish — koʻrlik sotib olish.",
      "Jamoat: sekin oʻzgarishni hikoya qilish sanʼati kerak.",
      "Siyosat sikli qisqa; ekologiya sikli uzun. Shu ziddiyatni tan olish — birinchi qadam.",
      "Sekin sezish — tabiat aybi emas, diqqat dizayni."
    ],
    "fillers": [
      "Fermerlar jurnali: quduq sathi yillik yozuvi — mahalliy erta signal.",
      "Sugʻurta premiumlari kechikishni “narxlashi” mumkin; lekin bu yetarli emas."
    ]
  },
  {
    "id": "a83",
    "format": "opinion",
    "title": "Tiklash oʻtmish ekotizimiga qaytishi kerakmi yoki kelajakdagiga?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Oʻtmish bazasi romantik; iqlim oʻzgargan dunyoda esa u imkonsiz boʻlishi mumkin.",
      "Yangi ekotizimlar bahsli: “tabiiy emas” deyiladi, lekin baʼzan chidamli.",
      "Yordamchi migratsiya — aralashuv; aralashmaslik ham aralashuv oqibatidir.",
      "Boshqariladigan chekinish — magʻlubiyat emas, reja.",
      "Triyaj qiyin: qaysi joyga sarmoya, qaysi joydan voz kechish.",
      "Mahalliy xalq bilimlari bazani boyitadi; “qoʻlga olish” xavfini esa kuzating.",
      "Maqsadni ochiq aytish: nostalgiyami, xizmatmi, xilma-xillikmi?",
      "Fuqarolar ishtirokisiz tiklash texnik loyihaga aylanadi.",
      "Kelajakka yoʻnalgan tiklash — umidni reja bilan bogʻlash.",
      "Oʻtmishni hurmat qilish — uni muzlatish majburiyati emas."
    ],
    "fillers": [
      "Pilot uchastkalar va ochiq maʼlumot — bahsni dalilli qiladi.",
      "Maktablar “qaysi manzara?” deb rasm solishtirishi mumkin."
    ]
  },
  {
    "id": "a84",
    "format": "dialogue",
    "title": "Bir tur yoʻqolsa, qaysi aloqalar uziladi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "speakers": [
      "A",
      "B"
    ],
    "beats": [
      "Bitta tur yoʻqolishi nima uchun muhim?",
      "Chunki u changlatuvchi, parchalovchi yoki oziq zanjiri tuguni boʻlishi mumkin.",
      "Hamma tur “kalit”mi?",
      "Yoʻq. Lekin ortiqcha zaxira ham cheklangan. Mutaxassis turlar zaif.",
      "Chiroyli hayvonlarga koʻproq eʼtibor ketadimi?",
      "Ha, charizma mablagʻni tortadi. Unchalik “yoqimli” boʻlmagan turlar jim yoʻqoladi.",
      "Kaskad nima?",
      "Bir yoʻqotish boshqasini tortadi — toʻlqin.",
      "Yoʻlaklar yordam beradimi?",
      "Ha, migratsiya va gen oqimi uchun. Lekin yoʻlak yolgʻiz davo emas.",
      "Oddiy odam nima qilsin?",
      "Mahalliy oʻsimlik, pestitsidni kamaytirish, kuzatuvga qoʻshilish.",
      "Xulosa?",
      "Tur — yakka hayot emas, munosabatlar toʻri. Toʻr uzilsa, biz ham sezamiz.",
      "Umidingiz bormi?",
      "Bor, agar erta harakat qilsak. Kechikish — qimmatroq dars."
    ],
    "fillers": [
      "A: Qishloq xoʻjaligi-chi?\nB: Xilma-xil ekin va chegara oʻsimliklari changlatuvchilarni ushlab turadi.",
      "A: Shaharda mumkinmi?\nB: Ha: tom bogʻ, daraxt turi, tungi yorugʻlikni kamaytirish."
    ]
  },
  {
    "id": "a85",
    "format": "email",
    "title": "Jamoalar suv havzasi bogʻliqligini qanday tasvirlaydi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "emailOpen": "Subject: Suv havzasi oʻzaro bogʻliqligi boʻyicha jamoat brifingi\n\nHurmatli mahalla kengashi,",
    "emailClose": "Hurmat bilan,\nJasmina Rahimova\nSuv himoyasi guruhi",
    "beats": [
      "Yuqori oqimdagi qaror past oqimdagi ichimlikni oʻzgartiradi. Shu bogʻliqlikni oddiy tilda aytish kerak.",
      "Xarita: qayerdan yomgʻir oqadi, qayerda singadi, qayerda ifloslanadi.",
      "Qirgʻoq oʻsimliklari — tabiiy filtr. Ularni “boʻsh yer” demang.",
      "Tuproq siqilishi oqimni tezlashtiradi; toshqin xavfi oshadi.",
      "Bufer zonalar qishloq va shahar oʻrtasida tinchlik shartnomasi.",
      "Eng yuqori oqim kunlari infratuzilmani sinaydi; reja shu kunga quriladi.",
      "Maktab bolalari kuzatuv daftarі tutishi mumkin — bu ham maʼlumot.",
      "Maqsad: har bir qoʻshni oʻzini “havza fuqarosi” deb his qilsin."
    ],
    "fillers": [
      "Fermer va shaharlik bir stolga oʻtirsa, ayblov kamayib, reja koʻpayadi.",
      "Rasmlar va oddiy sonlar uzun hisobotdan kuchliroq boʻladi."
    ]
  },
  {
    "id": "a86",
    "format": "article",
    "title": "Foydali tushuncha qanday ortiqcha signalga aylanadi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "“Keskin nuqta” foydali edi: oʻzini kuchaytiruvchi jarayonni tushuntirdi.",
      "Haddan tashqari ishlatilsa, har bir yangilik “halokat” boʻlib ketadi.",
      "Signal charchogʻi: odamlar eshitishni toʻxtatadi.",
      "Noaniqlik diapazonini aytmaslik — ishonchni yemiradi.",
      "Apokalipsis tili baʼzan safarbar qiladi, baʼzan shol qiladi.",
      "Chiziqli oʻylash murakkab tizimni tekislaydi.",
      "Qaytarib boʻladigan zarar bilan boʻlmaydiganini ajratish muhim.",
      "Olimlar va jurnalistlar birgalikda “qachon shu soʻz?” mezonini yozishi mumkin.",
      "Fuqaro savodxonligi: soʻzni emas, mexanizmni soʻrash.",
      "Foydali tushuncha — ehtiyotkor ishlatilganda qurol, emas shovqin."
    ],
    "fillers": [
      "Maktabda “dovul soʻzlari” mashqi: qaysi gap dalil, qaysi gap ohang?",
      "Ilmiy kommunikatsiya treningi — ortiqcha signalga qarshi vaksinа."
    ]
  },
  {
    "id": "a87",
    "format": "essay",
    "title": "Shaharlarni xavfli issiq qiladigan oʻzaro sabablar nimalar?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Asfalt va beton issiqlikni yutadi; kechasi ham qaytaradi.",
      "Daraxt yoʻqolsa, bugʻlanish salqinligi kamayadi.",
      "Kambagʻal mahallalar koʻpincha soyasiz — bu tengsizlik.",
      "Mikroiqlim: ikki koʻcha orasidagi farq hayot-mamot boʻlishi mumkin.",
      "Qayta jihozlash: ochiq rangli tom, suv oʻtkazuvchi qoplama, daraxt.",
      "Bazaviy harorat oshsa, “oddiy issiq kun” ommaviy xavfga aylanadi.",
      "Sogʻliq tizimi massaviy jarohat rejasini yozishi kerak.",
      "Energiya tarmogʻi konditsioner choʻqqisida sindi — yana bogʻliqlik.",
      "Fuqarolar salqin markazlar xaritasini bilishi kerak.",
      "Issiqlik — tabiat “jazosi” emas, dizayn oqibati."
    ],
    "fillers": [
      "Qariyalar va ochiq havoda ishlovchilar alohida ustuvorlikka loyiq.",
      "Yozgi festival ruxsatnomalariga soyа va suv sharti qoʻyilishi mumkin."
    ]
  },
  {
    "id": "a88",
    "format": "feature",
    "title": "Nega ijtimoiy tizimlar ekologik reja ichida turishi kerak?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Tabiatni “boʻsh joy” deb koʻrish odamlarni ham “boʻsh” qiladi.",
      "Integratsiyalangan reja: uy-joy, transport, havo birga.",
      "Yer egallash va “qurbon zona” — ekologik adolatsizlikning ijtimoiy yuzi.",
      "Kvotalar ochiq boʻlmasa, kuchlilar yutadi.",
      "Hamkor boshqaruv — siloslarni sindirish.",
      "Qoʻshma foyda: daraxt — salqinlik + bolalar oʻyini + astma kamayishi.",
      "Alohida vazirliklar alohida maqsad quvsa, shahar sindi.",
      "Byudjet birlashtirilsa, bahona kamayadi.",
      "Jamoat eshitilsa, reja qogʻozda qolmaydi.",
      "Ekologiya — odamlar hayotidan tashqarida emas."
    ],
    "fillers": [
      "Sogʻliq statistikasi ekologik majlisga kiritsin — til birlashadi.",
      "Yoshlar kengashi loyihani “kim nafas oladi?” deb tekshirsin."
    ]
  },
  {
    "id": "a89",
    "format": "opinion",
    "title": "Qaysi ekologik koʻrsatkichlar qaror qabul qiluvchini chalgʻitadi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Oʻlchov nima boʻlsa, tizim shuni maksimallashtiradi — Goodhart qonuni.",
      "Yagona ekin “unumdor” koʻrinadi; tuproq esa kambagʻallashadi.",
      "Zararni chet elga chiqarish — mahalliy “yashil” raqamni boʻyadi.",
      "Yashil yuvish: sertifikat bor, oqibat yoʻq.",
      "Yashiringan uglerod va hayot sikli hisobsiz “tozalik” yolgʻon.",
      "ESG ballari foydali boʻlishi mumkin; lekin tekshiruvsiz — marketing.",
      "Qaror qabul qiluvchi bir necha oʻlchovni birga koʻrsin.",
      "Mustaqil tekshiruv — ishonch valyutasi.",
      "Fuqaro savoli: “bu raqam nima yashiryapti?”",
      "Yaxshi koʻrsatkich — xulqni yaxshilaydi, niqoblamaydi."
    ],
    "fillers": [
      "Maktab loyihalarida “oʻlchov tanqidі” darsi kerak.",
      "Davlat xaridlari hayot sikli narxini soʻrasin."
    ]
  },
  {
    "id": "a90",
    "format": "article",
    "title": "Tarqalgan sababiylik ostida burch qanday ishlaydi?",
    "vocab": [
      [
        "ekotizim",
        "tirik mavjudotlar bogʻlanishi"
      ],
      [
        "kechikish",
        "oqibatning kech koʻrinishi"
      ],
      [
        "tiklash",
        "buzilganni qayta sogʻlomlash"
      ],
      [
        "oʻzaro bogʻliqlik",
        "birining ikkinchiga taʼsiri"
      ],
      [
        "koʻrsatkich",
        "oʻlchov belgisi"
      ],
      [
        "issiqlik",
        "haroratning xavfli oshishi"
      ],
      [
        "majburiyat",
        "qilish kerak boʻlgan ish"
      ],
      [
        "sabablar",
        "bir necha turtki majmui"
      ]
    ],
    "beats": [
      "Koʻp qoʻl bilan qilingan zarar “hech kimniki” boʻlib ketadi.",
      "Burch — yagona aybdorni topish emas, taʼsir nuqtasini tanlash.",
      "Qulflanish: eski infratuzilma yangi niyatni ushlab turadi.",
      "Differentsial masʼuliyat: kim koʻproq foyda koʻrgan boʻlsa, koʻproq koʻtarsin.",
      "Ishlab chiqaruvchi javobgarligi chiqindini dizaynga qaytaradi.",
      "Namoyishkorona burch — selfi; rost burch — byudjet.",
      "Hamjihatlik: kichik ishtirokchilar ham yoʻl topadi.",
      "Moslashuv va oldini olish birga; faqat biri — yarim ish.",
      "Qonun tarqalgan zararni tan olsa, sud yoʻli ochiladi.",
      "Burch — mukammal aybdorlik emas, amaliy sodiqlik."
    ],
    "fillers": [
      "Mahalla loyihalari “bizning ulush”ni koʻrsatib, umidsizlikni kamaytiradi.",
      "Korxona hisobotida taʼminot zanjiri boʻlmasa, burch yarim."
    ]
  },
  {
    "id": "a91",
    "format": "essay",
    "title": "Tomosha madaniyatisiz mukammallik qanday koʻrinadi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Tomosha reyting va “eng yaxshi lahzalar”ni mukofotlaydi; hunar esa sekinlikni.",
      "Shogirdlik — koʻrinmas soatlar. Ular highlight emas.",
      "Motivatsion nutq baʼzan shaxsni brend qiladi; ish esa yoʻqoladi.",
      "Tugallanmaganlik — rostlik: usta ham mashq qiladi.",
      "Reyting yoʻq joyda sifat boshqa mezon bilan oʻlchanadi: chidamlilik, aniqlik, foyda.",
      "Jamoa ichida tanqid — shou emas, tikuv.",
      "Yoshlar “koʻrinish”ga tortilsa, sabr mushagi zaiflashadi.",
      "Mukammallik — perfektsiya emas, sodiq eʼtibor.",
      "Jamiyat sekin ustalikni koʻrsatadigan maydon ochishi kerak.",
      "Tomoshasiz mukammallik — tinchroq, lekin chuqurroq."
    ],
    "fillers": [
      "Maktab koʻrgazmalarida jarayon fotosuratlari ham olsin, faqat natija emas.",
      "Ustaxonа ochiq kunlari “sehr”ni emas, mashqni koʻrsatadi."
    ]
  },
  {
    "id": "a92",
    "format": "feature",
    "title": "Uzoq oʻrganish xarakterni qanday qayta shakllantiradi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Plato bosqichi — darak: endi chuqurlash yoki tashlash.",
      "Refleksiya kundaligi xato ni shaxsiyatga aylantirmaydi, darsga aylantiradi.",
      "Isteʼdod afsonasi kech gullaganlarni yashiradi.",
      "Taʼtil va sabbatikal — zaiflik emas, chuqurlashish sharti.",
      "Tana xotirasi: qoʻl oʻylagandan oldin biladi.",
      "Qattiqlik xavfi: eski usulga yopishish. Moslashuv ham xarakter.",
      "Uzoq yoʻl sabr, kamtarlik va eʼtiborni tarbiyalaydi.",
      "Jamoa shogirdni yolgʻiz qoldirmasa, xarakter sogʻlomroq oʻsadi.",
      "Qisqa kurslar foydali; lekin ular uzoq yoʻlni almashtirmaydi.",
      "Xarakter — sertifikat emas, takroriy tanlovlar yigʻindisi."
    ],
    "fillers": [
      "Ustozlar “tez yulduz”ni emas, barqaror odatni maqtasin.",
      "Oila uzoq mashqni “isrof” deb koʻrmasligi uchun natija emas, odatni qadrlasin."
    ]
  },
  {
    "id": "a93",
    "format": "opinion",
    "title": "Har bir ishtiyoq kasbga aylanishі kerakmi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Sevimli ishni pulga aylantirish vasvasasi kuchli. Lekin hamma ishtiyoq bozor emas.",
      "Kasbiylashtirish baʼzan sevinchni oʻldiradi: muddat, mijoz, reyting.",
      "Boзор toʻlishi: koʻp odam bir orzuga yugursa, daromad tushadi.",
      "Gig iqtisod “erkinlik”ni vaʼda qilib, oʻzini ekspluatatsiya qilishi mumkin.",
      "“Tajriba uchun bepul” — koʻpincha nohaq.",
      "Hobbi sifatida qolgan hunar ruhiy salomatlik beradi.",
      "Tanlov ochiq boʻlsin: kasb yoki avlodiy sevinch.",
      "Taʼlim “hamma startap” demasdan, barqaror yoʻllarni ham koʻrsatsin.",
      "Jamiyat madaniy ishtiyoqni faqat foyda bilan oʻlchamаsin.",
      "Ishtiyoq — hayot yoqilgʻisi; uni doim sotish shart emas."
    ],
    "fillers": [
      "Yoshlar mentorі bozоr realigini yumshoq, lekin rost aytishi kerak.",
      "Mahalliy toʻgaraklar ishtiyoqni kasbsiz ham ushlab turadi."
    ]
  },
  {
    "id": "a94",
    "format": "dialogue",
    "title": "Vositalar aqllashsa, ustaga nima qoladi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "speakers": [
      "A",
      "B"
    ],
    "beats": [
      "Dastgoh aniqroq kesadi. Usta nima qiladi?",
      "Maqsadni tanlash, sifatni tekshirish, xatoni oʻqish — hali insoniy.",
      "Motivetni kim beradi?",
      "Usta. Mashina parametrni bajaradi; maʼnoni emas.",
      "Shogird endi nima oʻrganadi?",
      "Integratsiya: vosita + material + mijoz ehtiyoji.",
      "Javobgarlik kimda?",
      "Imzo qoʻygan odamda. “Kompyuter shunday chiqardi” yetarli emas.",
      "Ish yoʻqoladimi?",
      "Baʼzi ishlar oʻzgaradi. Yangi nazorat va taʼmir ishlari chiqadi.",
      "Qoʻrquv bormi?",
      "Bor. Shuning uchun oʻqish uzluksiz boʻlsin.",
      "Xulosa?",
      "Aqlli vosita — sherik. Usta esa hali ham hukm egasi.",
      "Amaliy maslahat?",
      "Vositasiz ham qisqa sinov qiling — tushuncha yoʻqolmasin."
    ],
    "fillers": [
      "A: Dizayn dasturi gʻoya beradimi?\nB: Variant beradi. Tanlov va uygʻunlik — sizniki.",
      "A: Mijoz arzonlik soʻrasa?\nB: Arzonning narxini tushuntiring: vaqt, chidamlilik, taʼmir."
    ]
  },
  {
    "id": "a95",
    "format": "email",
    "title": "Ustozlar sekin mukammallikni qanday himoya qiladi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "emailOpen": "Subject: Sekin sifatni himoya qilish boʻyicha tavsiya\n\nHurmatli taʼlim kengashi,",
    "emailClose": "Hurmat bilan,\nOlimjon Saidov\nUstozlar kengashi",
    "beats": [
      "Tez portfolio bosimi shogirdni yuzaki qiladi. Biz sekin sifatni himoya qilishimiz kerak.",
      "Bahoda nafaqat natija, balki jarayon jurnali ham boʻlsin.",
      "Tanqid — shaxsiyatga emas, ishga. Bu temperamentni tarbiyalaydi.",
      "Buyurtma muddatlari real boʻlsin; “kecha kerak” — sifat dushmani.",
      "Pechka, quritish, dam olish — tabiatning vaqti. Uni “romantikа” demang, fizika.",
      "Halollik: yomon ishni maqtamang. Yumshoq rostlik — sabrni oʻrgatadi.",
      "Moliyaviy qoʻllab-quvvatlash sekin yoʻlni tanlaganlarni saqlaydi.",
      "Iltimos: baholash mezonlariga “chuqurlik” qatorini qoʻshing."
    ],
    "fillers": [
      "Ota-onalar yigʻilishida “sekin”ning qiymatini tushuntirish — sarmoya.",
      "Koʻrgazmada “necha soat?” yorligʻi tomoshabinni tarbiyalaydi."
    ]
  },
  {
    "id": "a96",
    "format": "article",
    "title": "Ustalar muvaffaqiyatsizlikni oʻzini yoʻqotmasdan qanday oʻqiydi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Xato sharm spiraliga aylansa, oʻrganish toʻxtaydi.",
      "Oʻzini yoʻqotish — “men yomonman”; oʻqish — “shu urinish nima dedi?”.",
      "Payvanddagi yoriq — dars; melodrama esa vaqtni yeydi.",
      "Noaniq daromad sharoitida xato qoʻrqinchliroq; shuning uchun xavfsiz mashq maydoni kerak.",
      "Post-mortem: nima boʻldi, nima oʻrganildi, keyingi sinov nima.",
      "Yashirish madaniyati xatoni kattalashtiradi.",
      "Jamoa oldida ochiq tahlil — sharmni kamaytiradi.",
      "Qayta jarohatlash: oʻtmish muvaffaqiyatsizlikni tinimsiz tilga olish ham zarar.",
      "Yaxshi usta xatoni yashirmaydi, uni oʻlchaydi.",
      "Oʻzini saqlab qolish — keyingi urinish uchun yoqilgʻi."
    ],
    "fillers": [
      "Daftarda “uch xato — uch dars” rubrikasi foydali.",
      "Mijozga rost gapirish ishonchni buzmaydi, baʼzan oshiradi."
    ]
  },
  {
    "id": "a97",
    "format": "essay",
    "title": "Maqsad haqidagi nutqlar qiyin qismni nima uchun oʻtkazib yuboradi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Ilhomli nutq oson: “nima uchun”. Qiyin qism — kompromiss va sheriklik.",
      "Boʻsh maqsad — chiroyli soʻz, yopiq byudjet.",
      "Meros va nufuz baʼzan qiyin savolni yopadi.",
      "Kalit nutqlar “konteyner” beradi; lekin ichini jamoa toʻldirishi kerak.",
      "Dilemma: foyda va axloq toʻqnashganda nima qilish? Shu yerda rost maqsad sinadi.",
      "Yoshlar “maqsad” marketingini sezadi; shuning uchun ochiqlik kerak.",
      "Ustaxonаda maqsad — mijozga rost xizmat; u shior emas.",
      "Qiyin qismni oʻtkazib yuborish — keyinroq ishonch inqirozi.",
      "Yaxshi rahbar qiyin qismni stolga qoʻyadi.",
      "Maqsad — yoʻnalish; yoʻl esa ishqalanish bilan keladi."
    ],
    "fillers": [
      "Jamoa yigʻilishida “nima qilmaymiz?” roʻyxati foydali.",
      "Talabalar uchun keys: chiroyli missiya vs real qaror."
    ]
  },
  {
    "id": "a98",
    "format": "feature",
    "title": "Hunar jamoalarini moda oʻzgarishida nima tirik saqlaydi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Ustaxonаlar va uyushmalar bilмni avloddan avlodga oʻtkazadi.",
      "Darvozabonlik baʼzan sifat; baʼzan esa yangi ovozni yopish.",
      "Oʻtkazuvchanlik: yangi aʼzo kira olsin, lekin meʼyor saqlansin.",
      "Subsidия va davlat buyurtmasi moda pasayganda nafas beradi.",
      "Yashirin bilim — qoʻlda; uni faqat video bilan saqlab boʻlmaydi.",
      "Hamjihatlik: asbob almashish, birga xarid, birga oʻqitish.",
      "Pipeline: maktabdan ustaxonаga yoʻl ochiq boʻlsin.",
      "Moda oʻzgaradi; ehtiyoj (taʼmir, sifat) qoladi.",
      "Jamoa bayrami — faqat shou emas, rishta.",
      "Tiriklik — pul va maʼnoning birgaligi."
    ],
    "fillers": [
      "Kutubxona hunar kechalari yangi odamlarni olib keladi.",
      "Onlayn forum foydali; lekin yonma-yon ishlash oʻrnini bosmaydi."
    ]
  },
  {
    "id": "a99",
    "format": "opinion",
    "title": "Yuqori mahorat egalari tengsiz startga qanday munosabatda boʻlishi kerak?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Mahorat baʼzan omadli start ustiga quriladi. Buni unutish — amneziya.",
      "Stajirovka eshiklari tanish-bilish bilan ochilsa, darvoza qattiqlashadi.",
      "Qayta taqsimlash: stipendiya, ochiq portfolio koʻrik, bepul asbob soati.",
      "Boʻsh “ilhom” nutqi yetarli emas; joy ochish kerak.",
      "Bilimni yigʻib qoʻyish jamoani kambagʻallashtiradi.",
      "Yuqori mahorat — majburiyat ham: koʻprik boʻlish.",
      "Tanqid: “men ham qiynaldim” — baʼzan rost, baʼzan nisbatni yashiradi.",
      "Adolat — hasad emas, barqaror ekotizim.",
      "Maktablar bilan hamkorlik — eng amaliy javob.",
      "Start teng boʻlmasa ham, eshiklar kengayishi mumkin."
    ],
    "fillers": [
      "Ustozlar tanlov hayʼatida xilma-xil tajribani soʻrashsin.",
      "Grant hisobotida “kim yangi kirdi?” degan savol boʻlsin."
    ]
  },
  {
    "id": "a100",
    "format": "essay",
    "title": "Hunar markazli hayot nima soʻraydi va nima beradi?",
    "vocab": [
      [
        "mahorat",
        "mashq bilan olingan ustalik"
      ],
      [
        "hunar",
        "qoʻl va aql birikmasi"
      ],
      [
        "sabr",
        "sekin mukammallikka intilish"
      ],
      [
        "xato",
        "oʻrganish uchun muvaffaqiyatsizlik"
      ],
      [
        "ustoz",
        "yoʻl koʻrsatuvchi tajribali odam"
      ],
      [
        "jamiyat",
        "bir hunar atrofidagi odamlar"
      ],
      [
        "maqsad",
        "nima uchun ishlash"
      ],
      [
        "sifat",
        "ishning yaxshilik darajasi"
      ]
    ],
    "beats": [
      "Hunar markazli hayot tezkor shuhratni emas, kunlik eʼtiborni soʻraydi.",
      "U baʼzan kamroq pul, koʻproq maʼno beradi — lekin romantikа qilmaslik kerak.",
      "Kompetensiya — o‘zini hurmat qilishning sokin asosi.",
      "Vositalilik xavfi: odamni faqat foyda deb koʻrish. Hunar buni yumshatishi mumkin.",
      "Shahidlikka o‘xshash yonish — sovgʻa emas; chegarа kerak.",
      "Mavsumiy ritm: baʼzi ishlar shoshilmaydi. Tabiat va material vaqt beradi.",
      "Shogirdga joy ochish — hayotning berishi.",
      "Jamiyat bunyodkorlarni koʻrinsin qilsa, yoshlar yoʻl topadi.",
      "Hunar — faqat buyum emas, eʼtibor tarbiyasi.",
      "Soʻraydi: sabr. Beradi: uygʻunlik, foydali qoʻl, tinch magʻrurlik."
    ],
    "fillers": [
      "Yakuniy eslatma: hunar markazli hayot mukammal emas; u tanlangan eʼtibor.",
      "Shu eʼtibor jamiyatga ham oqadi — taʼmirlangan narsa, oʻrgatilgan qoʻl, ochiq usta."
    ]
  }
];

export const LESSONS = Object.fromEntries(
  kernels.map((k) => {
    const built = buildFromKernel(deepFix(k));
    return [built.id, deepFix(built)];
  }),
);
