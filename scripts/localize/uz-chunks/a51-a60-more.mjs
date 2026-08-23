import { latinizeUzbek } from '../shared.mjs';
import { buildFromKernel } from './build-from-kernel.mjs';

const deepFix = (x) => {
  if (typeof x === 'string') return latinizeUzbek(x);
  if (Array.isArray(x)) return x.map(deepFix);
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) o[k] = deepFix(v);
    return o;
  }
  return x;
};

const vocab = {
  econ: [
    ['narx', 'tovar yoki xizmat qiymati'],
    ['mehnat', 'ish orqali qiymat yaratish'],
    ['bozor', 'ayirboshlash maydoni'],
    ['tengsizlik', 'imkoniyatlar farqi'],
    ['hamkorlik', 'birgalikda ishlash'],
    ['qarz', 'qaytariladigan majburiyat'],
    ['vaqt', 'cheklangan hayot resursi'],
    ['qadrlash', 'qiymatni tan olish'],
  ],
};

/** Extra a51–a60 kernels appended into LESSONS export via merge in this file */
export const MORE = [
  {
    id: 'a51',
    format: 'essay',
    title: 'Yashagan narx va mehnat nazariyadan qanday oldin keladi?',
    vocab: vocab.econ,
    beats: [
      'Odam avval doʻkonda narxni koʻradi, keyin iqtisodiy nazariyani. Shu tartib muhim: nazariya hayotni tushuntirishi kerak, hayotni inkor etmasligi.',
      'Ish haqi kechiksa, oila “makrokoʻrsatkich”ni emas, kechki ovqatni his qiladi. Shuning uchun yashagan tajriba — birinchi darslik.',
      'Nazariya foydali, chunki u naqshlarni koʻrsatadi. Lekin u odamning charchogʻini oʻchirib tashlasa, sovuq va notoʻgʻri boʻladi.',
      'Statistika oʻrtachani aytadi; yashagan narx esa chekka holatni. Chekka holat siyosat uchun koʻpincha muhimroq.',
      'Mehnat qadri faqat unumdorlik formulasida emas. Gʻamxoʻrlik, kutish, tuzatish — koʻrinmas mehnat ham bor.',
      'Bozor “signal” beradi, lekin signal hammaga bir xil eshitilmaydi. Kimning ovozi balandroq — oʻsha narxni shakllantiradi.',
      'Oila byudjeti — eng qattiq imtihon. U yerda chiroyli model sindi yoki ishladi.',
      'Tadqiqotchi doʻkon va ish joyiga chiqsa, nazariya boyiydi. Kabinetdan chiqmasa, nazariya sayozlashadi.',
      'Siyosat yashagan narxni eshitsa, islohotlar yumshoqroq qoʻnad. Eshitmasa, qarshilik kuchayadi.',
      'Xulosa: avval hayot, keyin formula. Formula hayotga xizmat qilsin, aksincha emas.',
    ],
    fillers: [
      'Narx oshishi baʼzan “vaqtinchalik” deyiladi. Vaqtinchalik oy boʻlsa, oila uchun u umr boʻlagi. Shuning uchun muddatni ham yashagan koʻz bilan oʻlchash kerak.',
      'Kasaba uyushmalari va isteʼmolchilar guruhlari shu tajribani siyosiy tilga tarjima qiladi. Tarjimasiz tajriba shaxsiy ogʻriq boʻlib qoladi.',
    ],
  },
  {
    id: 'a52',
    format: 'feature',
    title: 'Nega zaruriy gʻamxoʻrlik mehnati past baholanadi?',
    vocab: vocab.econ,
    beats: [
      'Bolani boqish, keksalarni kuzatish, bemorni yuvish — jamiyat shu mehnatsiz toʻxtaydi. Shunga qaramay, u koʻpincha arzon yoki bepul.',
      'Sabablar: jinsiy meʼyorlar, “tabiiy mehr” afsonasi, oʻlchash qiyinligi. Mehrni bozor tashqarisiga surish qulay.',
      'Agar gʻamxoʻrlik toʻxtasa, maktab, ofis, fabrika birgalikda chayqaladi. Shuning uchun u “ikkilamchi” emas, asosiy infratuzilma.',
      'Past baho isteʼdodni haydaydi. Qolganlar charchaydi. Charchoq esa xato va zoʻravonlik xavfini oshiradi.',
      'Davlat va oila oʻrtasida masʼuliyat tushunarsiz boʻlsa, ayollar ustiga sukut bilan tushadi. Sukut — siyosatning bir turi.',
      'Yaxshi baholash: munosib haq, dam olish, trening, hurmat. Faqat “rahmat” yetarli emas.',
      'Migrant ishchilar koʻp joyda shu tarmoqni ushlab turadi. Ularning huquqi zaif boʻlsa, butun tizim ekspluatatsiyaga tayanadi.',
      'Texnologiya baʼzi ishlarni yengillashtiradi, lekin insoniy ishtirokni yoʻq qilmaydi. Robot mehrni almashtirmaydi.',
      'Hisob-kitobda gʻamxoʻrlik yalpi ichki mahsulotda kam koʻrinadi. Koʻrinmaslik — past bahoning yoqimli niqobi.',
      'Qadrlash — axloqiy tanlov va iqtisodiy aql. Ikkalasi birga kelganda jamiyat barqarorlashadi.',
    ],
    fillers: [
      'Ish beruvchilar “oilaviy doʻstona” deb aytganda, bunisi haqiqiy taʼtil va mos jadvalni anglatishi kerak. Soʻz bilan jadval mos kelmasa, bu reklama.',
      'Yoshlar kasb tanlar ekan, hurmat koʻrsalar, gʻamxoʻrlikka kiradi. Hurmat koʻrmasalar, qochadi. Kelajak shu tanlovda.',
    ],
  },
  {
    id: 'a53',
    format: 'opinion',
    title: 'YaIM hali ham muvaffaqiyat hikoyasi boʻlib qolaversinmi?',
    vocab: vocab.econ,
    beats: [
      'YaIM foydali oʻlchov. Lekin u yagona muvaffaqiyat hikoyasi boʻlsa, salomatlik, vaqt, tenglik yoʻqoladi.',
      'Daraxt kesilsa YaIM oshishi mumkin; havo ifloslansa davolash ham YaIMni oshiradi. Shu paradoks ogohlantiradi.',
      'Oilaviy baxt statistikada kech qoladi. Odamlar “iqtisod oʻsdi”ni eshitib, oʻz hayotida siqilishni his qiladi.',
      'Yaxshi qoʻshimcha oʻlchovlar: umr davomiyligi, bolalar ochligi, ish vaqti, ishonch, yashil maydon.',
      'Siyosatchilar bitta raqamni yaxshi koʻradi, chunki u qulay. Qulaylik esa murakkablikni yashiradi.',
      'Biznes ham “oʻsish”dan boshqa maqsadlarni yozishi mumkin: xavfsizlik, barqarorlik, xodimlar qolishi.',
      'YaIMni tashlash shart emas; uni taxtdan tushirish kerak. Taxtda yakka oʻlchov xavfli.',
      'Mahalliy hokimiyat oʻz koʻrsatkichlarini tanlashi mumkin. Bu demokratiyani oʻlchovga yaqinlashtiradi.',
      'Media har hafta YaIM aytmasa, boshqa hikoyalar ham joy oladi. Diqqat — siyosiy resurs.',
      'Muvaffaqiyat — odamlarning nafas olishi mumkin boʻlgan hayoti. Raqam shu hayotga xizmat qilsin.',
    ],
    fillers: [
      'Tarixda boshqa oʻlchovlar ham boʻlgan: gʻalla zaxirasi, soliq yuki, askar soni. Har davr oʻz raqamini tanlagan. Biz ham tanlovimizni tan olishimiz kerak.',
      'Maktablarda “oʻsish nima?” degan dars ochilsa, kelajak fuqarolari bitta raqamga kamroq tushinadi.',
    ],
  },
  {
    id: 'a54',
    format: 'dialogue',
    title: 'Bir tarmoqda maosh oshsa, xarajatni kim koʻtaradi?',
    vocab: vocab.econ,
    speakers: ['A', 'B'],
    beats: [
      'Agar ofitsiantlar maoshi oshsa, ovqat qimmatlashmaydimi?',
      'Baʼzan ha. Lekin xarajat faqat mijozga tushishi shart emas: foyda ulushi, ijara, vositachilik ham bor.',
      'Ish beruvchi “biz yopilamiz” desa-chi?',
      'Bu tahdid baʼzan rost, baʼzan muzokara. Shuning uchun maʼlumot kerak: marja, ijara, soliq.',
      'Mijozlar arzonlikni xohlaydi.',
      'Arzonlikning bir qismi past maosh edi. Endi narx rostroq boʻlishi mumkin — yashirin subsidiya yoʻqoladi.',
      'Boshqa tarmoqlarga taʼsir?',
      'Ha, umumiy ish haqi bosimi. Bu tengsizlikni kamaytirishi yoki inflatsiyani oshirishi mumkin. Natija siyosatga bogʻliq.',
      'Davlat nima qila oladi?',
      'Ijara bosimini yumshatish, kichik biznesga oʻtish yordami, ochiq hisobot. Faqat “oshirmang” demasdan.',
      'Xulosa?',
      'Maosh oshishi xarajatni kimdir koʻtaradi. Savol — adolatli taqsim. Faqat eng zaif yelka boʻlmasin.',
      'Mijoz sifatida men nima qilay?',
      'Narxni soʻrang, lekin mehnatni ham qadrlang. Arzonning hikoyasini eshitish — fuqarolik.',
      'Ishchilar-chi?',
      'Ular ham mijoz. Yuqori maosh boshqa joyda ham talabni oshiradi. Bu oddiy zanjir.',
    ],
    fillers: [
      'A: Avtomatlashuv xavfi oshmaydimi?\nB: Oshishi mumkin. Shuning uchun malaka oshirish va ijtimoiy himoya birga kelishi kerak. Maosh yolgʻiz dastur emas.',
      'A: Kichik kafe yirik zanjirdan farq qiladi.\nB: Toʻgʻri. Siyosat bir xil choʻtka bilan boʻyamasin; bosqichma-bosqich va maʼlumotli boʻlsin.',
    ],
  },
  {
    id: 'a55',
    format: 'email',
    title: 'Norasmiy qarz tizimlari aslida qanday ishlaydi?',
    vocab: vocab.econ,
    emailOpen:
      'Subject: Norasmiy qarz amaliyotlari boʻyicha qisqa brifing\n\nHurmatli moliyaviy inklyuziya guruh,',
    emailClose: 'Hurmat bilan,\nJasur Bekmurodov\nTadqiqot tahlilchisi',
    beats: [
      'Mahalla jamgʻarmalari, doʻstlararo qarz, uyushgan “kassa”lar — rasmiy bankdan tashqarida ishlaydi. Ular tezkor, lekin xavfli ham.',
      'Ishlash tartibi odatda ishonch va ijtimoiy bosimga tayanadi. Garov oʻrniga obroʻ turadi.',
      'Foiz ochiq yoki yashirin boʻlishi mumkin. Yashirin foiz — tushunmovchilik va nizoning manbai.',
      'Ayollar guruhlari baʼzan oylik badallar bilan aylanma kapital yaratadi. Bu kuchli, lekin ishtirokchi chiqib ketsa, zanjir uziladi.',
      'Rasmiy sektor ularni faqat “noqonuniy” deb koʻrsa, odamlar yana soyaga ketadi. Yaxshiroq yoʻl — xavfsiz alternativa.',
      'Raqamli ilovalar norasmiy mantiqni nusxa qilishi mumkin: kichik summa, tez qaror, guruh kafolati. Dizayn ehtiyotkor boʻlsin.',
      'Hadli foiz va shikoyat yoʻli boʻlmasa, ekspluatatsiya oshadi. Himoya — inklyuziyaning sharti.',
      'Brifing tavsiyasi: tinglang, sanang, jazolashdan oldin oʻrgating. Keyin arzon, tushunarli rasmiy mahsulot taklif qiling.',
    ],
    fillers: [
      'Saha suhbatlarida odamlar “bank meni rad etdi” deb qayta-qayta aytadi. Rad etish sababi tushunarsiz boʻlsa, norasmiy yoʻl tabiiy tanlovga aylanadi.',
      'Mahalliy yetakchilar bilan ishlash ishonchni oshiradi. Tashqaridan kelgan “yaxshi mahsulot” ovozsiz qolishi mumkin.',
    ],
  },
  {
    id: 'a56',
    format: 'article',
    title: '“Raqobat” bozorlarini qanday hamkorlik jim ushlab turadi?',
    vocab: vocab.econ,
    beats: [
      'Reklama raqobatni koʻrsatadi. Orqa fonda esa standartlar, logistika ittifoqlari, umumiy taʼminotchilar — hamkorlik bor.',
      'Hamkorlik yomon emas. U xavfsizlik va sifatni oshiradi. Muammo — u yashirin narx kelishuviga aylansa.',
      'Ochiq standartlar innovatsiyani osonlashtiradi. Yopiq kelishuv esa yangi ishtirokchini siqadi.',
      'Kichik firmalar “raqobat” maydoniga chiqish uchun koʻpincha yiriklarning infratuzilmasiga bogʻliq. Bogʻliqlik — yumshoq hokimiyat.',
      'Davlat xaridlarida ham “raqobat” nomigagina boʻlishi mumkin. Haqiqiy tanlov mezonlari ochiq boʻlishi kerak.',
      'Ishchilar tarmogʻi ham bozorni ushlab turadi: tajriba almashinuvi, kasbiy meʼyor. Bu hamkorlik kam koʻrinadi.',
      'Antimonopoliya faqat yirik bitimlarni emas, jim kelishuvlarni ham tekshirishi lozim. Jimlik — kuchning qulay shakli.',
      'Isteʼmolchi uchun narx past boʻlishi mumkin, lekin tanlov kamayishi uzoqda qimmatga tushadi.',
      'Yaxshi bozor — ochiq qoidali hamkorlik + haqiqiy raqobat. Ikkalasini aralashtirib yubormaslik kerak.',
      '“Raqobat” soʻzini eshitganda, orqadagi kelishuvlarni ham soʻrang. Savol — fuqarolik.',
    ],
    fillers: [
      'Tadqiqotchilar taʼminot zanjirini xarita qilsa, yashirin tugunlar ochiladi. Xarita siyosat uchun qimmatli vosita.',
      'Startaplar “erkin bozor” deb kirib, keyin platforma qoidalariga duch keladi. Qoidalar ham hamkorlik shakli — egasi kimligini soʻrang.',
    ],
  },
  {
    id: 'a57',
    format: 'essay',
    title: 'Jamiyatlar olinmagan startlarni qanday axloqiylashtiradi?',
    vocab: vocab.econ,
    beats: [
      'Meros, tanish-bilish, sogʻlom bolalik — koʻp startlar “mehnat”dan oldin keladi. Jamiyat buni qanday izohlaydi?',
      'Bir izoh: “omad”. U tinchlantiradi, lekin tuzilmani yashiradi.',
      'Ikkinchi izoh: “oila qadri”. U mehrni koʻrsatadi, lekin tengsizlikni tabiiylashtirishi mumkin.',
      'Uchinchi izoh: “tizim”. U siyosiy, lekin shaxsiy masʼuliyatni yoʻqotib yuborishi mumkin.',
      'Maktablar “mehnat qil — yutasan” desa, olinmagan startni koʻrmagan bolalar oʻzini aybdor his qiladi.',
      'Yaxshi axloqiy til: omadni tan olish + imkoniyatni kengaytirish + shaxsiy urinishni qadrlash. Uchasi birga.',
      'Soliq va grantlar olinmagan startni qisman tuzatishi mumkin. Bu “hasad” emas, barqarorlik sarmoyasi.',
      'Media “oʻzini yaratgan” afsonasini yaxshi koʻradi. Afsona ilhom beradi; u yolgʻiz hikoya boʻlsa, yolgʻonlashadi.',
      'Doʻstlik doiralari ham start: maslahat, ish, kafolat. Shu tarmoqni ochish — siyosiy vazifa.',
      'Olinmagan startni axloqiylashtirish — uni yoʻqotish emas, uni masʼuliyat bilan koʻrish.',
    ],
    fillers: [
      'Oilalar ichida ham “sen omadli eding” degan gap nizoga aylanishi mumkin. Ochiq gapirish — oilaviy adolatning boshlanishi.',
      'Universitet stipendiyalari faqat ball emas, kontekstni ham koʻrsa, start farqini kamaytiradi.',
    ],
  },
  {
    id: 'a58',
    format: 'feature',
    title: 'Oilalar narx oshishini qanday axloqiy hikoya qiladi?',
    vocab: vocab.econ,
    beats: [
      'Narx oshganda oila “kim aybdor?” deb hikoya qiladi: davlat, doʻkon, vositachi, oʻzi.',
      'Hikoya xarajat qarorini boshqaradi: tejaladigan narsa, kechiriladigan hashamat, yashirin qarz.',
      'Baʼzi oilalar sharmni ichga oladi: “biz boshqara olmadik”. Bu tizim bosimini shaxsiylashtiradi.',
      'Boshqalar gʻazabni tashqariga chiqaradi. Gʻazab tashkil topsa, siyosat; tartibsiz boʻlsa, umidsizlik.',
      'Bolalar suhbatni eshitadi. Ular “pul — xavf” yoki “pul — muzokara” deb oʻrganadi.',
      'Mahalla chatlari narxni solishtiradi. Bu foydali; lekin mish-mish ham tarqaladi. Tekshirish odat kerak.',
      'Diniy yoki madaniy til: sabr, shukr, adolat. Shu til yordam yoki passivlik berishi mumkin.',
      'Ayollar koʻpincha kundalik narxni boshqaradi; ularning hikoyasi siyosiy maʼlumot.',
      'Ochiq oilaviy byudjet suhbat sharmni kamaytiradi. Raqam — ayblov emas, xarita.',
      'Axloqiy hikoya muqarrar; uni adolatli qilish — oila va jamiyat ishi.',
    ],
    fillers: [
      'Doʻkonlar “aksiya” tili bilan aybdorlikni yumshatadi. Aksiya foydali boʻlishi mumkin; lekin u umumiy oshishni yashirmasligi kerak.',
      'Mahalliy jurnalistika oilaviy savatni kuzatsa, hikoya shaxsiydan jamoaga koʻtariladi.',
    ],
  },
  {
    id: 'a59',
    format: 'opinion',
    title: 'Qaysi institutsional tanlovlar bozor libosini kiyadi?',
    vocab: vocab.econ,
    beats: [
      'Baʼzi qarorlar “bozor talab qildi” deyiladi. Aslida bu siyosiy tanlov: qoida, subsidiya, ruxsat.',
      'Libos qulay: masʼuliyatni noaniq oluvchiga yuklaydi. “Bozor” javob bermaydi.',
      'Energiya narxi, uy-joy, taʼlim — shu sohalarda sof bozor kam uchraydi. Aralash tizim — norma.',
      'Privatizatsiya baʼzan samara beradi, baʼzan esa jamoat nazoratini yoʻqotadi. Natijani libossiz oʻlchash kerak.',
      'Xususiy-sheriklik shartnomalari ochiq boʻlmasa, fuqaro kimga shikoyat qilishini bilmaydi.',
      '“Tanlov” soʻzi ham libos boʻlishi mumkin: tanlov bor, lekin sifatli variant yoʻq.',
      'Ishchilar huquqi “raqobatbardoshlik” nom ostida qisqarishi mumkin. Nomini tekshiring.',
      'Yaxshi siyosat libosni yechadi: maqsad, yutuvchi, yutqazuvchi, muddat — ochiq.',
      'Media “bozor reaksiyasi”ni tabiat hodisasidek yozmasligi kerak. Reaksiya — odamlar qarori.',
      'Bozor libosi yechilsa, demokratiya yana koʻrinadi. Koʻrinish — javobgarlikning boshlanishi.',
    ],
    fillers: [
      'Qonun loyihalarida “bozor mexanizmi” degan ibora uchrasa, ilova jadval soʻrang: kim toʻlaydi? Jadvalsiz ibora — tuman.',
      'Talabalar debatlarda libosni aniqlash mashqini qilishi mumkin. Bu tanqidiy fikrning amaliy darsi.',
    ],
  },
  {
    id: 'a60',
    format: 'article',
    title: 'Vaqt boyligi muvaffaqiyatni qanday qayta ramkalaydi?',
    vocab: vocab.econ,
    beats: [
      'Muvaffaqiyat koʻpincha pul va lavozim bilan oʻlchanadi. Vaqt boyligi — boshqa oʻq: kimning soati oʻziga tegishli?',
      'Uzun smena yuqori maosh bersa ham, oila va salomatlikni yeyishi mumkin. Shunda “yutuq” yarimyog.',
      'Transport kutish — yashirin kambagʻallik. Vaqt boyligi infratuzilmaga bogʻliq.',
      'Ish beruvchilar mos jadvalni imtiyoz emas, unumdorlik sharti deb koʻrsa, madaniyat oʻzgaradi.',
      'Texnologiya vaqtni tejashi yoki oʻgʻirlashi mumkin. Bildirishnoma — oʻgʻri boʻlishi mumkin.',
      'Nafaqa va taʼtil siyosati vaqtni qayta taqsimlaydi. Bu “dangasalik” emas, barqarorlik.',
      'Bolalar bilan vaqt — jamiyat sarmoyasi. Uni faqat shaxsiy tanlov deb koʻrish — tor qarash.',
      'Status ramkalari oʻzgarsa, odamlar boshqa narsaga intiladi: uyqu, ijod, qoʻshnilik.',
      'Oʻlchov kerak: ish tashqaridagi soatlar, dam olish sifati, kutish vaqti. Oʻlchovsiz ramka boʻsh.',
      'Vaqt boyligi — yangi hashamat emas, adolatning yumshoq oʻlchovi. Uni jiddiy olsak, muvaffaqiyat insoniyroq boʻladi.',
    ],
    fillers: [
      'Shaharlar “vaqt xaritasi” tuzishi mumkin: qayerda kutish uzun. Xarita byudjetni boshqacha yoʻnaltiradi.',
      'Yoshlar “burnout” haqida gapirganda, bu dangasa shikoyat emas, vaqt tizimining signali.',
    ],
  },
];

// Also re-export a41-a50 from previous object by importing dynamically is hard;
// This module only adds MORE for a51-a60. Parent a41-a60.mjs already has a41-a50.
// We'll merge in agent writer instead.

export const LESSONS_A51_A60 = Object.fromEntries(
  MORE.map((k) => {
    const built = buildFromKernel(deepFix(k));
    return [built.id, deepFix(built)];
  }),
);
