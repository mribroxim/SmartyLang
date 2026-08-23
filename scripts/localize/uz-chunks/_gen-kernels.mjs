/**
 * Offline generator: writes a61-a80.mjs and a81-a100.mjs kernels (no MT API).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const care = [
  ['avtonomiya', 'oʻz hayoti haqida qaror qilish huquqi'],
  ['rozilik', 'erkin va tushunarli ijoza'],
  ['gʻamxoʻrlik', 'boshqaga yordam berish amaliyoti'],
  ['chegara', 'nima mumkinligini belgilash'],
  ['umid', 'yaxshiroq natijaga intilish'],
  ['charchoq', 'uzoq zoʻriqish holati'],
  ['himoya', 'zarardan saqlash'],
  ['masʼuliyat', 'oqibat uchun javobgarlik'],
];
const lang = [
  ['munozara', 'turli fikrlarni ochiq aytish'],
  ['metafora', 'oʻxshatish orqali tushuntirish'],
  ['taʼrif', 'soʻzning chegaralangan maʼnosi'],
  ['agentlik', 'harakat qilish qobiliyati'],
  ['ishontirish', 'fikrni oʻzgartirishga urinish'],
  ['jimlik', 'gapirmaslik holati'],
  ['aniqlik', 'tushunarli va aniq ifoda'],
  ['inklyuzivlik', 'koʻpchilikni qoʻshish'],
];
const eco = [
  ['ekotizim', 'tirik mavjudotlar bogʻlanishi'],
  ['kechikish', 'oqibatning kech koʻrinishi'],
  ['tiklash', 'buzilganni qayta sogʻlomlash'],
  ['oʻzaro bogʻliqlik', 'birining ikkinchiga taʼsiri'],
  ['koʻrsatkich', 'oʻlchov belgisi'],
  ['issiqlik', 'haroratning xavfli oshishi'],
  ['majburiyat', 'qilish kerak boʻlgan ish'],
  ['sabablar', 'bir necha turtki majmui'],
];
const craft = [
  ['mahorat', 'mashq bilan olingan ustalik'],
  ['hunar', 'qoʻl va aql birikmasi'],
  ['sabr', 'sekin mukammallikka intilish'],
  ['xato', 'oʻrganish uchun muvaffaqiyatsizlik'],
  ['ustoz', 'yoʻl koʻrsatuvchi tajribali odam'],
  ['jamiyat', 'bir hunar atrofidagi odamlar'],
  ['maqsad', 'nima uchun ishlash'],
  ['sifat', 'ishning yaxshilik darajasi'],
];

const a61_80 = [];
const a81_100 = [];

function push(arr, o) {
  arr.push(o);
}

push(a61_80, {
  id: 'a61',
  format: 'essay',
  title: 'Gʻamxoʻrlar “yoʻq”ni “ha”dek qanday hurmat qilishi kerak?',
  vocab: care,
  beats: [
    'Gʻamxoʻrlikda “ha” oson eshitiladi, chunki u yordamni ochadi. “Yoʻq” esa toʻsiqdek tuyuladi — lekin u ham odamning chegarasidir.',
    '“Yoʻq”ni mensimaslik baʼzan mehr niqobi ostida keladi: “siz uchun yaxshi”. Bu asimmetriya rozilikni zaiflashtiradi.',
    'Hurmat — rad etishni yozib qoʻyish, qayta bosmaslik, va sabab soʻrashni bosimga aylantirmaslik.',
    'Bolalar va zaif odamlarda rozilik murakkabroq; shunda ham eng kam cheklov prinsipi ishlashi kerak.',
    'Oilalar baʼzan bemorning “yoʻq”ini qoʻrquvdan eshitmaydi. Tarjimon va himoyachi shu yerda koʻprik boʻladi.',
    'Hujjatlashtirilgan oldindan koʻrsatmalar “yoʻq”ni tinch kundagi ovozga aylantiradi.',
    'Xodim “ha”ga majburlanganda ham charchaydi; madaniyat rad etishni xiyonat deb koʻrmasligi kerak.',
    'Hurmat qilingan “yoʻq” keyinroq “ha”ni ham ishonchli qiladi.',
    'Aks holda yordam majburiylikka aylanadi va ishonch yemiriladi.',
    'Xulosa: “yoʻq” — toʻsiq emas, odamning egasiligidir.',
  ],
  fillers: [
    'Amaliy mashq: jamoa “yoʻq” eshitilganda qanday javob berishini yozib qoʻysin. Skript sharmni kamaytiradi.',
    'Qarindoshlar uchun tushuntirish varaqasi: qonun nima deydi, qachon istisno bor. Bilim bosimni yumshatadi.',
  ],
});

push(a61_80, {
  id: 'a62',
  format: 'feature',
  title: 'Vaqt tanqisligi gʻamxoʻrlik sifatini qanday oʻzgartiradi?',
  vocab: care,
  beats: [
    'Vaqt tanqisligi — faqat “bandlik” emas. U suhbatni qisqartiradi, kuzatuvni sayozlashtiradi, xatoni oshiradi.',
    'Yuqori oqim madaniyati tezlikni mukofotlaydi; sifat esa sekinlikni talab qiladi. Shu ziddiyat bemorni orasida qoldiradi.',
    'Xodimlar nisbati past boʻlsa, eng yaxshi niyat ham “konveyer”ga aylanadi.',
    'Uzluksizlik yoʻqolganda har safar qayta tushuntirish kerak — bu ham vaqt, ham ishonch xarajati.',
    'Dam olish yoʻq joyda xato “zaiflik” emas, tizim natijasi.',
    'Texnologiya baʼzi qogʻozlarni qisqartiradi; lekin u insoniy daqiqani avtomatik bermaydi.',
    'Rahbarlar vaqtni byudjet qatori deb koʻrsa, sifat oʻlchanadigan boʻladi.',
    'Oilalar “shoshilish”ni mensimaslik deb his qiladi; aslida bu resurs signalidir.',
    'Yaxshi dizayn: muhim suhbatlar uchun himoyalangan bloklar.',
    'Vaqt qaytarilmasa, gʻamxoʻrlik nomi qoladi, mazmuni esa yupqalashadi.',
  ],
  fillers: [
    'Kuzatuv: bir smenada necha marta “kechirasiz, shoshaman” aytiladi. Bu son sifatning yashirin koʻrsatkichi.',
    'Jamoat kampaniyalari faqat “qahramonlik”ni emas, shtat sonini ham talab qilishi kerak.',
  ],
});

push(a61_80, {
  id: 'a63',
  format: 'opinion',
  title: 'Oilalar layoqatli bemor istagini bekor qila oladimi?',
  vocab: care,
  beats: [
    'Layoqatli bemorning istagi — oʻziga egalik. Oila muhim, lekin u yakka hukmdor emas.',
    'Kollektiv madaniyatlarda oila ovozi kuchli. Bu hurmatli boʻlishi mumkin; lekin qonun koʻpincha shaxsni markazga qoʻyadi.',
    'Ong chalkashligi yoki bosim boʻlsa, “layoqat” qayta baholanadi. Eng kam cheklov yoʻli afzal.',
    'Oldindan yozilgan koʻrsatmalar bahsda kompas boʻladi.',
    'Oilani chetlatish ham xato: ularni eshitish bilan bemor “yoʻq”ini mensimaslik farq qiladi.',
    'Vosita xizmatlari til va qaror ramkasini tarjima qiladi.',
    'Majburiy davolash faqat qatʼiy mezon bilan; aks holda ishonch yoʻqoladi.',
    'Jamoat taʼlimi: vakil hujjati nima uchun kerak.',
    'Xulosa: oila yordamchi, hukmdor emas — layoqat ochiq turganida.',
    'Bu qoida sovuq emas; u zoʻravon mehrdan himoya.',
  ],
  fillers: [
    'Sud amaliyoti ochiq tushuntirilsa, oilalar “rad etish”ni xiyonat deb kamroq koʻradi.',
    'Shifokorlar yozuvda “kim nima dedi”ni aniq qoldirishi keyingi smenani asraydi.',
  ],
});

push(a61_80, {
  id: 'a64',
  format: 'dialogue',
  title: 'Prognoz noaniq boʻlsa, umidni qanday gapirish kerak?',
  vocab: care,
  speakers: ['A', 'B'],
  beats: [
    'Prognoz bitta raqam emas. Unda umidni qanday aytamiz?',
    'Umidni yolgʻon vaʼda qilmasdan aytish mumkin: “bilganimizcha”, “oyni qayta koʻramiz”.',
    'Oila aniq javob soʻraydi. Bu tabiiy.',
    'Aniqlik yoʻqligini aytish ham rostlik. Umidni oʻchirish emas — noaniqlikni tan olish.',
    'Yengillashtiruvchi yordam umidni oʻchirmaydimi?',
    'Yoʻq. U azobni kamaytirish umidini ochadi. Bu ham umid.',
    'Statistika odamni qoʻrqitadi.',
    'Oʻrtacha koʻrsatkich — aholi haqida. Shaxs yoʻli boshqacha boʻlishi mumkin. Shu farqni aytish kerak.',
    'Ruhaniy maslahatchi kerakmi?',
    'Koʻpincha ha. Umid faqat tibbiy emas, maʼno ham.',
    'Yolgʻon tinchlantirish keyin xiyonatdek tuyuladi.',
    'Shuning uchun “shu oy asosida” degan til yaxshi — qayta moslashishga joy qoldiradi.',
    'Bemorga nima yordam beradi?',
    'Savol: “Siz umiddan nima tushunasiz?” Keyin shu tilda gapirish.',
    'Xulosa?',
    'Umid — yolgʻon emas, ochiq eshik. Eshik esa qayta suhbat bilan ochiq qoladi.',
  ],
  fillers: [
    'A: Tirik qolish hikoyalari-chi?\nB: Ilhom beradi, lekin “hamma shunday” demaslik kerak. Kuzatuv soʻzlari qoʻrquv uygʻotishi mumkin — izohlang.',
    'A: Kechqurun portalda tahlil chiqsa?\nB: Kontekstsiz raqam qoʻrquvni toʻldiradi. Kechni himoya qiluvchi siyosat kerak.',
  ],
});

push(a61_80, {
  id: 'a65',
  format: 'email',
  title: 'Jamoalar axloqiy tiqilinchda qanday yordam soʻraydi?',
  vocab: care,
  emailOpen:
    'Subject: Axloqiy tiqilinchda yordam soʻrash tartibi\n\nHurmatli klinik rahbariyat,',
  emailClose: 'Hurmat bilan,\nMadina Karimova\nSmena yetakchisi',
  beats: [
    'Klinik jumboqlar uchun maslahat odatiy. Axloqiy tiqilinch esa koʻpincha yoʻlakdagi xoʻrsinishda yashirinadi.',
    'Tiqilinch: toʻgʻri ish resurs yoki qarama-qarshi burch bilan toʻqnashganda.',
    'Yordam soʻrash zaiflik emas, kasbiy mahorat. Uni odatiy qilish kerak.',
    'Qisqa protokol: vaziyat, qiymatlar toʻqnashuvi, allaqachon sinab koʻrilgan yoʻllar, soʻralayotgan yordam.',
    'Keksalar shifokori, ijtimoiy xizmat va etika maslahati birgalikda ishlasin.',
    'Hujjatlashtirish keyingi smenani himoya qiladi va bemorni tashlab ketmaslikni koʻrsatadi.',
    'Javobgarlik qoʻrquvi soʻrashni toʻxtatmasin; rahbariyat himoya tilini ochiq aytishi kerak.',
    'Tavsiya: haftalik “axloqiy qisqa yigʻilish” — 15 daqiqa, aybsiz muhit.',
  ],
  fillers: [
    'Ordinatura dasturlarida etika faqat maʼruza boʻlmasin; smena oʻrtasida chaqirish odati boʻlsin.',
    'Hamkasblar ogʻir buyruqni rad etganlarni yolgʻiz qoldirmasin — bu ham sifat.',
  ],
});

push(a61_80, {
  id: 'a66',
  format: 'article',
  title: 'Yordamga muhtoj odamlarni nutq qanday hurmat qiladi?',
  vocab: care,
  beats: [
    'Til achinish, ilhom yoki yumshoq yashirish orasida sirpanadi. Har biri qadr-qimmatni buzishi mumkin.',
    '“Maxsus ehtiyoj”, “azob chekyapti”, “nogironligiga qaramay” — tarixiy yukli iboralar.',
    'Hurmat — odamni vosita yoki plakat qilmaslik. Agentlikni saqlash.',
    'Birinchi shaxs yoki identifikatsiya-birinchi tanlov jamoaga bogʻliq; soʻrang.',
    'Byudjet, rampa, maosh — shiorlardan keyingi rostlik.',
    'Rozilik shakllari oddiy tilda boʻlsa, hurmat davolashdan oldin boshlanadi.',
    'Shirin til baʼzan mensimaslikni yashiradi; ochiq, aniq til yaxshiroq.',
    'Ommaviy nutqda “yordam vositachisi” ohangidan qoching: odam savdo emas.',
    'Xulosa: hurmat kundalik jumlalarda sinovdan oʻtadi.',
    'Jamiyat oʻzaro bogʻliqlikni oddiy fakt deb koʻrsa, til yumshoqroq boʻladi.',
  ],
  fillers: [
    'Maktab darsliklarida tilni yangilash — avlodni yumshoqroq qiladi.',
    'Xodim treningida “nima demaslik” roʻyxati emas, “qanday soʻrash” mashqi kerak.',
  ],
});

push(a61_80, {
  id: 'a67',
  format: 'essay',
  title: 'Ilgʻor davolash foydasini kim oʻtkazib yuboradi?',
  vocab: care,
  beats: [
    'Yangi dori va usullar vaʼda beradi, lekin foyda teng taqsimlanmaydi.',
    'Geografiya, sugʻurta, irq, jins, nogironlik, raqamli savod — kim birinchi yetishini belgilaydi.',
    'Patent va narx tokchada yoʻq dori — suddagi yutuqni amalda bekor qilishi mumkin.',
    'Masofaviy tibbiyot qulay, lekin interneti yoʻqlar yana chetda qoladi.',
    'Global sogʻliq oʻlchovlari baʼzi kasalliklarni ustuvor qiladi; faollar bu tarafkashlikni koʻrsatadi.',
    'Hamjihatlik — faqat xayriya emas, kirish siyosati.',
    'Joriy etish rejasida “kim keyin” ochiq yozilmasa, jim tengsizlik keladi.',
    'Jamoat nazorati: navbat mezonlari tushunarli boʻlsin.',
    'Foydani oʻtkazib yuborish — tasodif emas, dizayn natijasi boʻlishi mumkin.',
    'Adolat — yangilikning ikkinchi yarmi.',
  ],
  fillers: [
    'Arzon dori bozori ochilmasa, “kirish” soʻzi boʻsh qoladi.',
    'Mahalliy klinikalar uchun trening va logistika — markaziy shifoxona yutuqlaridan muhimroq boʻlishi mumkin.',
  ],
});

push(a61_80, {
  id: 'a68',
  format: 'feature',
  title: 'Maksimal aralashuv qachon ogʻir tanlovdan qochadi?',
  vocab: care,
  beats: [
    'Har bir test va nayza baʼzan maqsadni kechiktiradi, emas hal qiladi.',
    'Prognoz yomon boʻlsa, texnologiya majburiyatdek tuyuladi.',
    'Mudofaa tibbiyoti ham shu bosimni kuchaytiradi: “hammasini qildik” degan himoya.',
    'Yengillashtiruvchi suhbat erta boʻlsa, oila “voz kechish”ni xiyonat deb kamroq koʻradi.',
    'Reanimatsiya resurslari cheklangan joyda maksimal yoʻl boshqalarni ham siqadi.',
    'Yozuvda maqsadlar aniq boʻlsa, smena almashinuvida chalkashlik kamayadi.',
    'Aza tutgan oilalarga keyingi qoʻllab-quvvatlash “maksimal quvurlar = muhabbat” afsonasini yumshatadi.',
    'Tanlov — texnologiyasizlik emas, maqsadga moslik.',
    'Qiyin suhbatdan qochish — kechiktirilgan ogʻriq.',
    'Yaxshi gʻamxoʻrlik baʼzan chegarani sevgi bilan qoʻyadi.',
  ],
  fillers: [
    'Simulyatsiya mashqlari shifokorlarga “toʻxtash” tilini oʻrgatadi.',
    'Jamoat: “hamma narsa qilindi” ohangini tanqidiy tinglash — fuqarolik.',
  ],
});

push(a61_80, {
  id: 'a69',
  format: 'opinion',
  title: 'Qurbonlik afsonasi gʻamxoʻrlarga qanday zarar beradi?',
  vocab: care,
  beats: [
    'Farishta hamshira, “kerak” degan qiz — jamiyat arzon mehnatni maqtov bilan toʻlaydi.',
    'Afsona ichga singadi: dam olish aybdorlikdek tuyuladi.',
    'Ekspluatatsiya shirin soʻz bilan keladi; bu ayblov, maqtov emas.',
    'Dam olish yoʻq tizim “qahramonlik”ni talab qiladi, keyin yonishni hayrat bilan kuzatadi.',
    'Oʻzini yoʻqotish kasbiy fazilat emas, xavf.',
    'Nafaqalar va haq oilaviy mehnatni byudjet qatoriga qoʻyadi — afsonani yechadi.',
    'Oʻqishda oʻzini asrash darsi shtatsiz boʻlsa, bu fazilat koʻrsatishi.',
    'Yorliq: yordam soʻragan “zaif”. Bu madaniyatni almashtirish kerak.',
    'Zarar — bemorga ham yetadi: charchagan qoʻl xato qiladi.',
    'Hurmat — maqtov emas, sharoit.',
  ],
  fillers: [
    'Kasaba va kasbiy uyushmalar shu afsonani ochiq nomlashi mumkin.',
    'Media “qahramon” sarlavhasini kamaytirib, shtat sonini yozsin.',
  ],
});

push(a61_80, {
  id: 'a70',
  format: 'article',
  title: 'Shifokorlar qoʻrquvni toʻldirmasdan qanday maʼlumot beradi?',
  vocab: care,
  beats: [
    'Toʻliq maʼlumot — huquq; toʻfon — zarar. Chegara nozik.',
    'Nisbiy xavf qoʻrqitadi; mutlaq xavf va bazaviy chiziq tinchlantirishi mumkin.',
    'Qayta aytish usuli: bemor oʻz soʻzi bilan qaytarsa, chalkashlik erta chiqadi.',
    'Kasbiy jargon — tezlik; tushunish — sekinlik. Sekinlik rozilik sifati.',
    'Vaqt berilmasa, shifokor “otalik”ga sirpanadi.',
    'Portal siyosati kechqurun vahima ni kamaytirishi kerak.',
    'Tanlab berish: hamma fakt emas, kerakli tartib.',
    'Qoʻrquvni inkor etish emas, uni nomlash — hamkorlik.',
    'Yaxshi axborot — bemorni kichraytirmaydi.',
    'Bu mahorat oʻrgatiladi, “tabiat” emas.',
  ],
  fillers: [
    'Viziting oʻrtasida qisqa tekshiruv — oxirida charchagan bemordan yaxshiroq.',
    'Yozma qisqa xulosa uyga ketadi; ogʻzaki narsa unutiladi.',
  ],
});

// a71-a80 language
push(a61_80, {
  id: 'a71',
  format: 'essay',
  title: 'Munozara shartlarini kim belgilaydi?',
  vocab: lang,
  beats: [
    'Bahsdan oldin kimdir muammoni nomlaydi. Nom — dalilning eshigi.',
    'Ijara oshishi “bozor tuzatishi”mi yoki “koʻchirish inqirozi”mi? Yorliq keyingi dalilni saralaydi.',
    'Lugʻatni egallash — imperiya yumshoq shakli boʻlishi mumkin.',
    'Stigmatizatsiya qilingan soʻzlarni qaytarib olish kuch beradi; lekin hamma rozilik bilan emas.',
    'Ommaviy organlar muqobil ramkalarni ham eʼlon qilsa, munozara adolatroq boʻladi.',
    'Vaqtinchalik taʼriflar yaxshi: “hozir shunday ataymiz, keyin qayta koʻramiz”.',
    'Qarshilik baʼzan yangi tilni “hujum” deb koʻradi; baʼzan esa haqiqiy tushunmovchilik bor.',
    'Maktabda “bu savol qanday nomlangan?” degan mashq fuqarolikni oʻrgatadi.',
    'Shartnoma varagʻidagi atamalar kabi, siyosiy atamalar ham ochiq boʻlishi kerak.',
    'Xulosa: dunyoni kim nomlasa, bahs shu yerda boshlanadi.',
  ],
  fillers: [
    'Jurnalistika sarlavha tanlovini ochiq muhokama qilishi mumkin: nima uchun shu soʻz?',
    'Fuqarolar yigʻinida avval taʼrif, keyin ovoz — chalkashlikni kamaytiradi.',
  ],
});

push(a61_80, {
  id: 'a72',
  format: 'feature',
  title: 'Grammatika ommaviy nutqda agentlikni qanday yashiradi?',
  vocab: lang,
  beats: [
    '“Xatolar qilindi” — feʼlsiz jumla aybdorni eritadi.',
    '“Jamoalar taʼsirlandi” — kim taʼsir qilgani yoʻqoladi.',
    'Passiv ohang baʼzan ehtiyotkorlik; baʼzan esa yuvish.',
    'Muxbirlar “kim?” deb soʻrasa, grammatika ochiladi.',
    'Pudratchi va idora oʻrtasida masʼuliyat “jarayon”ga oʻtmasin.',
    'Ehtimoliy til (“mumkin”) ham chegarani yumshatadi; uni oʻlchov bilan birga bering.',
    'Tahrir siyosati: imkon qadar ismli feʼl.',
    'Tanqidchilar “til tahlili chalgʻitadi” desа, javob: til ham zarar vositasi.',
    'Oʻquvchilar oddiy mashq bilan agentlikni topishi mumkin.',
    'Shaffof gap — shaffof hisobotning boshlanishi.',
  ],
  fillers: [
    'Maktab insholarida passivni “yomon” demasdan, uning ishini tushuntirish yaxshi.',
    'Davlat matbuot xizmati namuna jumlalarni qayta yozib koʻrsatishi mumkin.',
  ],
});

push(a61_80, {
  id: 'a73',
  format: 'opinion',
  title: 'Nafrat nutqi qoidalari his-tuygʻuni himoya qiladimi yoki demokratiyani?',
  vocab: lang,
  beats: [
    'Qoidalar nima himoya qilishini aniq aytmasa, ixtiyoriy qoʻllash keladi.',
    'His-tuygʻu muhim; lekin faqat u boʻlsa, chegara noaniq boʻladi.',
    'Demokratik qobiliyat: odamlar bahsda teng ishtirok eta olishi.',
    'Insoniy qadrni yoʻqotuvchi til ishtirokni sindirishi mumkin.',
    'Haddan tashqari keng taqiq yashirin kanallarga haydaydi.',
    'Haddan tashqari tor taqiq esa zoʻravonlikni kechiktirib koʻradi.',
    'Moderatsiya ochiq mezon bilan boʻlsin; yopiq “fazilat” xavfli.',
    'Gibrid yondashuv: zoʻravonlikka undash — qattiq; haqorat — kontekstli.',
    'Maktablar munozara madaniyatini oʻrgatsa, taqiq yukі kamayadi.',
    'Aniq maqsad — adolatli qoidaning sharti.',
  ],
  fillers: [
    'Platformalar oʻz qoidalarini oddiy tilda chiqarsin; yuridik tuman ishonchni yemiradi.',
    'Fuqarolik jamiyati kuzatuvi — “kim oʻchirildi?” statistikasi.',
  ],
});

push(a61_80, {
  id: 'a74',
  format: 'dialogue',
  title: 'Metaforalar urashsa, siyosatga nima boʻladi?',
  vocab: lang,
  speakers: ['A', 'B'],
  beats: [
    '“Urush” metaforasi siyosatni qanday oʻzgartiradi?',
    'U favqulodda holatni chaqiradi: tezlik, dushman, yon-atrof zarari.',
    'Bu foydali boʻlishi mumkinmi?',
    'Baʼzan ha — diqqatni yigʻadi. Lekin tanqidni “xoinlik” qilishi mumkin.',
    'Salomatlikda “jang” tili-chi?',
    'Bemor “yutqazgan”dek his qilishi mumkin. Yumshoqroq til kerak.',
    'Media nima qilsin?',
    'Metaforani koʻrsatib qoʻysin: “bu oʻxshatish; boshqa oʻxshatish ham bor”.',
    'Neytral til bormi?',
    'Toʻliq emas. Lekin oʻzaro hurmat va audit mumkin.',
    'Siyosatga taʼsir?',
    'Byudjet “jang”ga oqadi; sekin islohot “zaif” koʻrinadi.',
    'Xulosa?',
    'Metafora — bepul emas. Uni tanlash — siyosiy tanlov.',
    'Biz nima qilaylik?',
    'Har safar soʻraylik: bu oʻxshatish kimni kuchaytiradi?',
  ],
  fillers: [
    'A: Sport metaforasi yumshoqroqmi?\nB: Baʼzan. Lekin “yutish/yutqazish” ham murakkab siyosatni tekislaydi.',
    'A: Maktabda qanday oʻrgatiladi?\nB: Bir matnni uch xil metafora bilan qayta yozish — yaxshi mashq.',
  ],
});

push(a61_80, {
  id: 'a75',
  format: 'email',
  title: 'Muassasalar noaniqliksiz qanday inklyuziv yozadi?',
  vocab: lang,
  emailOpen:
    'Subject: Inklyuziv yozuv boʻyicha ichki qoʻllanma\n\nHurmatli kommunikatsiya jamoasi,',
  emailClose: 'Hurmat bilan,\nSevara Toshpulatova\nTahrir kengashi',
  beats: [
    'Inklyuziv til muhim; lekin noaniq boʻlsa, hech kim majburiyatni tushunmaydi.',
    'Aniqlik — hurmatning bir shakli: kim, nima, qachon.',
    'Stereotipni oldini olish bilan birga, amaliy koʻrsatmalar yozing.',
    'Odam-birinchi yoki identifikatsiya-birinchi — auditoriyaga moslab, izoh bilan.',
    'Ekran oʻqigich uchun matn tuzilishi ham inklyuziyadir.',
    'Majburiy qoidalar ilovada; asosiy matn qisqa va aniq.',
    'Yillik audit: qaysi iboralar chalkashtirdi, qaysilari yordam berdi.',
    'Maqsad: hamma oʻzini koʻrsin va nima qilish kerakligini bilsin.',
  ],
  fillers: [
    'Tarjima qilingan versiyalar ham bir xil aniqlikda boʻlsin; “asosiy til” ustunligi boʻlmasin.',
    'Xodimlar savol bersa, “hujjat noaniq” deb emas, “qaysi jumla?” deb soʻrang.',
  ],
});

push(a61_80, {
  id: 'a76',
  format: 'article',
  title: 'Kinoyali masofa qachon himoya qiladi — yoki jarohatlaydi?',
  vocab: lang,
  beats: [
    'Kinoya baʼzan naivlikdan himoya. Baʼzan esa mensimaslik.',
    'Zaif guruh ustidan kinoya — kuchning arzon shakli.',
    'Oʻzini himoya qilish uchun kinoya foydali boʻlishi mumkin; kontekst muhim.',
    'Immunitet tuygʻusi: “men hazil qilyapman” — javobgarlikni yuvadi.',
    'Haddan tashqari tartib ham ijodni oʻldiradi; muvozanat kerak.',
    'Darvozabonlar “hazil”ni kim uchun ruxsat etishini tekshirishi lozim.',
    'Sinov: hazildan keyin kim jim qoldi? Jimlik — signal.',
    'Oʻqituvchilar kinoyani tahlil qilishni oʻrgatishi mumkin.',
    'Yaralovchi kinoya “erkinlik” nomini olmasin.',
    'Himoya qiluvchi kinoya — kuchni ochish, yashirish emas.',
  ],
  fillers: [
    'Ijtimoiy tarmoqlarda kontekst yoʻqoladi; shuning uchun ehtiyot ortadi.',
    'Teatr va satira anʼanasi bor; lekin anʼana aybsizlik sertifikati emas.',
  ],
});

push(a61_80, {
  id: 'a77',
  format: 'essay',
  title: 'Majburiy jimlikni agentlikdan qanday ajratamiz?',
  vocab: lang,
  beats: [
    'Jimlik tanlov ham, majburiyat ham boʻlishi mumkin.',
    'Strategik jimlik — kuch; oʻrgatilgan ojizlik — tuzoq.',
    'Ritual jimlik (hurmat) bilan qoʻrquv jimligi farq qiladi.',
    'Norozilikni “shovqin” deb yopish — majburiy jimlik yaratadi.',
    'Yashirin taqiqlar: hisob yopilishi, ishdan qoʻrqish.',
    'Ajratish uchun: chiqish xavfsizmi? Alternativ kanal bormi?',
    'Jabrlanganni qayta jarohatlash xavfi — “gapir” bosimida ham bor.',
    'Tadqiqotda rozilik va xavfsizlik birinchi.',
    'Jamiyat jimlikni muqaddaslashtirmasligi kerak.',
    'Agentlik — gapirish majburiyati emas, tanlov imkoni.',
  ],
  fillers: [
    'Ish joyida anonim kanal boʻlsa, majburiy jimlik kamayadi.',
    'Maktabda “soʻz berish navbati” jim qolganlarni majburlamasdan ochadi.',
  ],
});

push(a61_80, {
  id: 'a78',
  format: 'feature',
  title: 'Nega nozik ishontirish bilimlilarga koʻproq taʼsir qiladi?',
  vocab: lang,
  beats: [
    'Oddiy tashviqot savodsizga moʻljallangan deb oʻylash — xato.',
    'Bilimli odam “uslub”ga ishonadi: metod, manba, jargon.',
    'Motivatsiyalangan mulohaza: xohlagan xulosani “dalil” bilan yuvish.',
    'Tanlab olish va yuvish — elita axborot maydonida kuchli.',
    'Sertifikat ishonch beradi; baʼzan esa tanqidni uxlatadi.',
    'Cynicism ham himoya emas: u ham manipulyatsiyaga ochiq.',
    'Yechim: metodni tekshirish odati, nafaqat xulosani.',
    'Media savodxonligi oliy maʼlumotda ham kerak.',
    'Munozara klublarida “qarama-qarshi eng yaxshi versiya” mashqi foydali.',
    'Bilim — qalqon emas, masʼuliyat.',
  ],
  fillers: [
    'Universitetlar oʻz bitiruvchilariga “siz ham aldanasiz” deb ochiq aytishi kerak.',
    'Ilmiy jurnallar ham marketing tilini tekshirsin.',
  ],
});

push(a61_80, {
  id: 'a79',
  format: 'opinion',
  title: 'Vosita odamlar bosim ostida xabarni qanday qayta shakllantiradi?',
  vocab: lang,
  beats: [
    'Vosita — tarjimon va filtr. Bosim ostida filtr qattiqlashadi.',
    'Sodiqlik: asl maʼnoni saqlash. Registr: auditoriyaga moslash.',
    'Koʻprik iboralar foydali; lekin ular “yolgʻon muvozanat” yaratmasin.',
    'Oddiy oʻquvchi uchun soddalashtirish — hurmat; boʻshatish — xiyonat.',
    'Taglavha va qisqa matn siyosiy qurol boʻlishi mumkin.',
    'Yonma-yon matn (asl + izoh) ishonchni oshiradi.',
    'Ish beruvchi bosimi “yumshoq” xabar talab qilsa, vosita axloqi sinovdan oʻtadi.',
    'Kasbiy kodeks: qachon rad etish kerak.',
    'Jamoatchilik vositani koʻrinmas deb hisoblamasin.',
    'Yaxshi vosita — koʻrinadigan tanlovlar bilan.',
  ],
  fillers: [
    'Sud tarjimonlari uchun trening — umumiy vosita etikasi uchun namuna.',
    'Jurnalistikada muharrir izohi ohangni oʻzgartirmasligi kerak.',
  ],
});

push(a61_80, {
  id: 'a80',
  format: 'article',
  title: 'Asosiy soʻzlar turlicha maʼno bersa, odamlar qanday bahslashadi?',
  vocab: lang,
  beats: [
    '“Erkinlik”, “xavfsizlik”, “adolat” — bir xil yoziladi, turlicha yashaydi.',
    'Shartnoma: avval taʼrif, keyin bahs. Bu sekin, lekin arzonroq.',
    'Izoh va havola — yaxshi niyat belgisi.',
    'Koʻplikni tan olish: bitta soʻzning bir necha ishlatilishi.',
    'Murosa qilinmaydigan yadroni ochiq aytish — vaqt tejaydi.',
    'Yomon niyatli bahs taʼrifni ataylab siljitadi.',
    'Eng yaxshi versiyani tushunish (steelman) ishonchni oshiradi.',
    'Baʼzan bahs soʻz ustida emas, vakolat ustida — proksi urush.',
    'Maktab debatlari shu chalkashlikni oʻrgatishi kerak.',
    'Tushunish — kelishish majburiyati emas, lekin sharti.',
  ],
  fillers: [
    'Davlat hujjatlarida glossariy boʻlsa, fuqaro chalkashligi kamayadi.',
    'Oilaviy janjalda ham “sen nima demoqchisаn?” savoli tinchlantiradi.',
  ],
});

// a81-a90 eco
push(a81_100, {
  id: 'a81',
  format: 'essay',
  title: 'Tizimli nigoh ekologik hukmni qanday oʻzgartiradi?',
  vocab: eco,
  beats: [
    'Yakka daraxtni koʻrish oson; oqim, tuproq, migratsiya yoʻlini koʻrish qiyinroq.',
    'Tizimli nigoh aloqalarni birinchi oʻringa qoʻyadi.',
    'Kechikkan teskari aloqa “hammasi joyida” degan yolgʻon tinchlik beradi.',
    'Soddalashtirish baʼzan kerak; lekin u siyosatni chalgʻitmasin.',
    'Qiyosiy tajriba: boshqa havzadagi yechimni koʻr-koʻrona koʻchirmang.',
    'Hamkor boshqaruv mahalliy bilimni modelga qoʻshadi.',
    'Epistemologiya savoli: biz nima bilamiz va nima bilmaymiz?',
    'Hukm oʻzgarsa, byudjet ham oʻzgaradi: profilaktika qimmatroq koʻrinadi, lekin arzonroq chiqadi.',
    'Fuqarolar xarita va hikoya bilan tizimni oʻrganishi mumkin.',
    'Xulosa: bogʻliqlikni koʻrish — masʼuliyatni kengaytirish.',
  ],
  fillers: [
    'Maktab ekskursiyasi faqat “chiroyli tabiat” emas, oqava suv nuqtasini ham koʻrsatsin.',
    'Korxonalar taʼminot zanjirini ochsa, tizim nigohi amaliy boʻladi.',
  ],
});

push(a81_100, {
  id: 'a82',
  format: 'feature',
  title: 'Kechikkan teskari aloqalar sekin sezishni qanday jazolaydi?',
  vocab: eco,
  beats: [
    'Yer osti suvi yillar davomida kamayadi; sezilganda kech boʻladi.',
    'Turlar yoʻqolishi ham shu naqshda: jim, keyin toʻsatdan.',
    'Qaytarib boʻlmaslik chegarasi yaqinlashganda, “kutib turaylik” qimmatga tushadi.',
    'Avlodlararo adolat — kechikishning axloqiy nomi.',
    'Ehtiyot prinsipi: noaniqlikda zarar yoʻnalishini tanlash.',
    'Inkor qulay: bugungi foyda koʻrinadi, ertangi zarar yoʻq.',
    'Monitoring erta ogohlantirish beradi; uni kesish — koʻrlik sotib olish.',
    'Jamoat: sekin oʻzgarishni hikoya qilish sanʼati kerak.',
    'Siyosat sikli qisqa; ekologiya sikli uzun. Shu ziddiyatni tan olish — birinchi qadam.',
    'Sekin sezish — tabiat aybi emas, diqqat dizayni.',
  ],
  fillers: [
    'Fermerlar jurnali: quduq sathi yillik yozuvi — mahalliy erta signal.',
    'Sugʻurta premiumlari kechikishni “narxlashi” mumkin; lekin bu yetarli emas.',
  ],
});

push(a81_100, {
  id: 'a83',
  format: 'opinion',
  title: 'Tiklash oʻtmish ekotizimiga qaytishi kerakmi yoki kelajakdagiga?',
  vocab: eco,
  beats: [
    'Oʻtmish bazasi romantik; iqlim oʻzgargan dunyoda esa u imkonsiz boʻlishi mumkin.',
    'Yangi ekotizimlar bahsli: “tabiiy emas” deyiladi, lekin baʼzan chidamli.',
    'Yordamchi migratsiya — aralashuv; aralashmaslik ham aralashuv oqibatidir.',
    'Boshqariladigan chekinish — magʻlubiyat emas, reja.',
    'Triyaj qiyin: qaysi joyga sarmoya, qaysi joydan voz kechish.',
    'Mahalliy xalq bilimlari bazani boyitadi; “qoʻlga olish” xavfini esa kuzating.',
    'Maqsadni ochiq aytish: nostalgiyami, xizmatmi, xilma-xillikmi?',
    'Fuqarolar ishtirokisiz tiklash texnik loyihaga aylanadi.',
    'Kelajakka yoʻnalgan tiklash — umidni reja bilan bogʻlash.',
    'Oʻtmishni hurmat qilish — uni muzlatish majburiyati emas.',
  ],
  fillers: [
    'Pilot uchastkalar va ochiq maʼlumot — bahsni dalilli qiladi.',
    'Maktablar “qaysi manzara?” deb rasm solishtirishi mumkin.',
  ],
});

push(a81_100, {
  id: 'a84',
  format: 'dialogue',
  title: 'Bir tur yoʻqolsa, qaysi aloqalar uziladi?',
  vocab: eco,
  speakers: ['A', 'B'],
  beats: [
    'Bitta tur yoʻqolishi nima uchun muhim?',
    'Chunki u changlatuvchi, parchalovchi yoki oziq zanjiri tuguni boʻlishi mumkin.',
    'Hamma tur “kalit”mi?',
    'Yoʻq. Lekin ortiqcha zaxira ham cheklangan. Mutaxassis turlar zaif.',
    'Chiroyli hayvonlarga koʻproq eʼtibor ketadimi?',
    'Ha, charizma mablagʻni tortadi. Unchalik “yoqimli” boʻlmagan turlar jim yoʻqoladi.',
    'Kaskad nima?',
    'Bir yoʻqotish boshqasini tortadi — toʻlqin.',
    'Yoʻlaklar yordam beradimi?',
    'Ha, migratsiya va gen oqimi uchun. Lekin yoʻlak yolgʻiz davo emas.',
    'Oddiy odam nima qilsin?',
    'Mahalliy oʻsimlik, pestitsidni kamaytirish, kuzatuvga qoʻshilish.',
    'Xulosa?',
    'Tur — yakka hayot emas, munosabatlar toʻri. Toʻr uzilsa, biz ham sezamiz.',
    'Umidingiz bormi?',
    'Bor, agar erta harakat qilsak. Kechikish — qimmatroq dars.',
  ],
  fillers: [
    'A: Qishloq xoʻjaligi-chi?\nB: Xilma-xil ekin va chegara oʻsimliklari changlatuvchilarni ushlab turadi.',
    'A: Shaharda mumkinmi?\nB: Ha: tom bogʻ, daraxt turi, tungi yorugʻlikni kamaytirish.',
  ],
});

push(a81_100, {
  id: 'a85',
  format: 'email',
  title: 'Jamoalar suv havzasi bogʻliqligini qanday tasvirlaydi?',
  vocab: eco,
  emailOpen:
    'Subject: Suv havzasi oʻzaro bogʻliqligi boʻyicha jamoat brifingi\n\nHurmatli mahalla kengashi,',
  emailClose: 'Hurmat bilan,\nJasmina Rahimova\nSuv himoyasi guruhi',
  beats: [
    'Yuqori oqimdagi qaror past oqimdagi ichimlikni oʻzgartiradi. Shu bogʻliqlikni oddiy tilda aytish kerak.',
    'Xarita: qayerdan yomgʻir oqadi, qayerda singadi, qayerda ifloslanadi.',
    'Qirgʻoq oʻsimliklari — tabiiy filtr. Ularni “boʻsh yer” demang.',
    'Tuproq siqilishi oqimni tezlashtiradi; toshqin xavfi oshadi.',
    'Bufer zonalar qishloq va shahar oʻrtasida tinchlik shartnomasi.',
    'Eng yuqori oqim kunlari infratuzilmani sinaydi; reja shu kunga quriladi.',
    'Maktab bolalari kuzatuv daftarі tutishi mumkin — bu ham maʼlumot.',
    'Maqsad: har bir qoʻshni oʻzini “havza fuqarosi” deb his qilsin.',
  ],
  fillers: [
    'Fermer va shaharlik bir stolga oʻtirsa, ayblov kamayib, reja koʻpayadi.',
    'Rasmlar va oddiy sonlar uzun hisobotdan kuchliroq boʻladi.',
  ],
});

push(a81_100, {
  id: 'a86',
  format: 'article',
  title: 'Foydali tushuncha qanday ortiqcha signalga aylanadi?',
  vocab: eco,
  beats: [
    '“Keskin nuqta” foydali edi: oʻzini kuchaytiruvchi jarayonni tushuntirdi.',
    'Haddan tashqari ishlatilsa, har bir yangilik “halokat” boʻlib ketadi.',
    'Signal charchogʻi: odamlar eshitishni toʻxtatadi.',
    'Noaniqlik diapazonini aytmaslik — ishonchni yemiradi.',
    'Apokalipsis tili baʼzan safarbar qiladi, baʼzan shol qiladi.',
    'Chiziqli oʻylash murakkab tizimni tekislaydi.',
    'Qaytarib boʻladigan zarar bilan boʻlmaydiganini ajratish muhim.',
    'Olimlar va jurnalistlar birgalikda “qachon shu soʻz?” mezonini yozishi mumkin.',
    'Fuqaro savodxonligi: soʻzni emas, mexanizmni soʻrash.',
    'Foydali tushuncha — ehtiyotkor ishlatilganda qurol, emas shovqin.',
  ],
  fillers: [
    'Maktabda “dovul soʻzlari” mashqi: qaysi gap dalil, qaysi gap ohang?',
    'Ilmiy kommunikatsiya treningi — ortiqcha signalga qarshi vaksinа.',
  ],
});

push(a81_100, {
  id: 'a87',
  format: 'essay',
  title: 'Shaharlarni xavfli issiq qiladigan oʻzaro sabablar nimalar?',
  vocab: eco,
  beats: [
    'Asfalt va beton issiqlikni yutadi; kechasi ham qaytaradi.',
    'Daraxt yoʻqolsa, bugʻlanish salqinligi kamayadi.',
    'Kambagʻal mahallalar koʻpincha soyasiz — bu tengsizlik.',
    'Mikroiqlim: ikki koʻcha orasidagi farq hayot-mamot boʻlishi mumkin.',
    'Qayta jihozlash: ochiq rangli tom, suv oʻtkazuvchi qoplama, daraxt.',
    'Bazaviy harorat oshsa, “oddiy issiq kun” ommaviy xavfga aylanadi.',
    'Sogʻliq tizimi massaviy jarohat rejasini yozishi kerak.',
    'Energiya tarmogʻi konditsioner choʻqqisida sindi — yana bogʻliqlik.',
    'Fuqarolar salqin markazlar xaritasini bilishi kerak.',
    'Issiqlik — tabiat “jazosi” emas, dizayn oqibati.',
  ],
  fillers: [
    'Qariyalar va ochiq havoda ishlovchilar alohida ustuvorlikka loyiq.',
    'Yozgi festival ruxsatnomalariga soyа va suv sharti qoʻyilishi mumkin.',
  ],
});

push(a81_100, {
  id: 'a88',
  format: 'feature',
  title: 'Nega ijtimoiy tizimlar ekologik reja ichida turishi kerak?',
  vocab: eco,
  beats: [
    'Tabiatni “boʻsh joy” deb koʻrish odamlarni ham “boʻsh” qiladi.',
    'Integratsiyalangan reja: uy-joy, transport, havo birga.',
    'Yer egallash va “qurbon zona” — ekologik adolatsizlikning ijtimoiy yuzi.',
    'Kvotalar ochiq boʻlmasa, kuchlilar yutadi.',
    'Hamkor boshqaruv — siloslarni sindirish.',
    'Qoʻshma foyda: daraxt — salqinlik + bolalar oʻyini + astma kamayishi.',
    'Alohida vazirliklar alohida maqsad quvsa, shahar sindi.',
    'Byudjet birlashtirilsa, bahona kamayadi.',
    'Jamoat eshitilsa, reja qogʻozda qolmaydi.',
    'Ekologiya — odamlar hayotidan tashqarida emas.',
  ],
  fillers: [
    'Sogʻliq statistikasi ekologik majlisga kiritsin — til birlashadi.',
    'Yoshlar kengashi loyihani “kim nafas oladi?” deb tekshirsin.',
  ],
});

push(a81_100, {
  id: 'a89',
  format: 'opinion',
  title: 'Qaysi ekologik koʻrsatkichlar qaror qabul qiluvchini chalgʻitadi?',
  vocab: eco,
  beats: [
    'Oʻlchov nima boʻlsa, tizim shuni maksimallashtiradi — Goodhart qonuni.',
    'Yagona ekin “unumdor” koʻrinadi; tuproq esa kambagʻallashadi.',
    'Zararni chet elga chiqarish — mahalliy “yashil” raqamni boʻyadi.',
    'Yashil yuvish: sertifikat bor, oqibat yoʻq.',
    'Yashiringan uglerod va hayot sikli hisobsiz “tozalik” yolgʻon.',
    'ESG ballari foydali boʻlishi mumkin; lekin tekshiruvsiz — marketing.',
    'Qaror qabul qiluvchi bir necha oʻlchovni birga koʻrsin.',
    'Mustaqil tekshiruv — ishonch valyutasi.',
    'Fuqaro savoli: “bu raqam nima yashiryapti?”',
    'Yaxshi koʻrsatkich — xulqni yaxshilaydi, niqoblamaydi.',
  ],
  fillers: [
    'Maktab loyihalarida “oʻlchov tanqidі” darsi kerak.',
    'Davlat xaridlari hayot sikli narxini soʻrasin.',
  ],
});

push(a81_100, {
  id: 'a90',
  format: 'article',
  title: 'Tarqalgan sababiylik ostida burch qanday ishlaydi?',
  vocab: eco,
  beats: [
    'Koʻp qoʻl bilan qilingan zarar “hech kimniki” boʻlib ketadi.',
    'Burch — yagona aybdorni topish emas, taʼsir nuqtasini tanlash.',
    'Qulflanish: eski infratuzilma yangi niyatni ushlab turadi.',
    'Differentsial masʼuliyat: kim koʻproq foyda koʻrgan boʻlsa, koʻproq koʻtarsin.',
    'Ishlab chiqaruvchi javobgarligi chiqindini dizaynga qaytaradi.',
    'Namoyishkorona burch — selfi; rost burch — byudjet.',
    'Hamjihatlik: kichik ishtirokchilar ham yoʻl topadi.',
    'Moslashuv va oldini olish birga; faqat biri — yarim ish.',
    'Qonun tarqalgan zararni tan olsa, sud yoʻli ochiladi.',
    'Burch — mukammal aybdorlik emas, amaliy sodiqlik.',
  ],
  fillers: [
    'Mahalla loyihalari “bizning ulush”ni koʻrsatib, umidsizlikni kamaytiradi.',
    'Korxona hisobotida taʼminot zanjiri boʻlmasa, burch yarim.',
  ],
});

// a91-a100 craft
push(a81_100, {
  id: 'a91',
  format: 'essay',
  title: 'Tomosha madaniyatisiz mukammallik qanday koʻrinadi?',
  vocab: craft,
  beats: [
    'Tomosha reyting va “eng yaxshi lahzalar”ni mukofotlaydi; hunar esa sekinlikni.',
    'Shogirdlik — koʻrinmas soatlar. Ular highlight emas.',
    'Motivatsion nutq baʼzan shaxsni brend qiladi; ish esa yoʻqoladi.',
    'Tugallanmaganlik — rostlik: usta ham mashq qiladi.',
    'Reyting yoʻq joyda sifat boshqa mezon bilan oʻlchanadi: chidamlilik, aniqlik, foyda.',
    'Jamoa ichida tanqid — shou emas, tikuv.',
    'Yoshlar “koʻrinish”ga tortilsa, sabr mushagi zaiflashadi.',
    'Mukammallik — perfektsiya emas, sodiq eʼtibor.',
    'Jamiyat sekin ustalikni koʻrsatadigan maydon ochishi kerak.',
    'Tomoshasiz mukammallik — tinchroq, lekin chuqurroq.',
  ],
  fillers: [
    'Maktab koʻrgazmalarida jarayon fotosuratlari ham olsin, faqat natija emas.',
    'Ustaxonа ochiq kunlari “sehr”ni emas, mashqni koʻrsatadi.',
  ],
});

push(a81_100, {
  id: 'a92',
  format: 'feature',
  title: 'Uzoq oʻrganish xarakterni qanday qayta shakllantiradi?',
  vocab: craft,
  beats: [
    'Plato bosqichi — darak: endi chuqurlash yoki tashlash.',
    'Refleksiya kundaligi xato ni shaxsiyatga aylantirmaydi, darsga aylantiradi.',
    'Isteʼdod afsonasi kech gullaganlarni yashiradi.',
    'Taʼtil va sabbatikal — zaiflik emas, chuqurlashish sharti.',
    'Tana xotirasi: qoʻl oʻylagandan oldin biladi.',
    'Qattiqlik xavfi: eski usulga yopishish. Moslashuv ham xarakter.',
    'Uzoq yoʻl sabr, kamtarlik va eʼtiborni tarbiyalaydi.',
    'Jamoa shogirdni yolgʻiz qoldirmasa, xarakter sogʻlomroq oʻsadi.',
    'Qisqa kurslar foydali; lekin ular uzoq yoʻlni almashtirmaydi.',
    'Xarakter — sertifikat emas, takroriy tanlovlar yigʻindisi.',
  ],
  fillers: [
    'Ustozlar “tez yulduz”ni emas, barqaror odatni maqtasin.',
    'Oila uzoq mashqni “isrof” deb koʻrmasligi uchun natija emas, odatni qadrlasin.',
  ],
});

push(a81_100, {
  id: 'a93',
  format: 'opinion',
  title: 'Har bir ishtiyoq kasbga aylanishі kerakmi?',
  vocab: craft,
  beats: [
    'Sevimli ishni pulga aylantirish vasvasasi kuchli. Lekin hamma ishtiyoq bozor emas.',
    'Kasbiylashtirish baʼzan sevinchni oʻldiradi: muddat, mijoz, reyting.',
    'Boзор toʻlishi: koʻp odam bir orzuga yugursa, daromad tushadi.',
    'Gig iqtisod “erkinlik”ni vaʼda qilib, oʻzini ekspluatatsiya qilishi mumkin.',
    '“Tajriba uchun bepul” — koʻpincha nohaq.',
    'Hobbi sifatida qolgan hunar ruhiy salomatlik beradi.',
    'Tanlov ochiq boʻlsin: kasb yoki avlodiy sevinch.',
    'Taʼlim “hamma startap” demasdan, barqaror yoʻllarni ham koʻrsatsin.',
    'Jamiyat madaniy ishtiyoqni faqat foyda bilan oʻlchamаsin.',
    'Ishtiyoq — hayot yoqilgʻisi; uni doim sotish shart emas.',
  ],
  fillers: [
    'Yoshlar mentorі bozоr realigini yumshoq, lekin rost aytishi kerak.',
    'Mahalliy toʻgaraklar ishtiyoqni kasbsiz ham ushlab turadi.',
  ],
});

push(a81_100, {
  id: 'a94',
  format: 'dialogue',
  title: 'Vositalar aqllashsa, ustaga nima qoladi?',
  vocab: craft,
  speakers: ['A', 'B'],
  beats: [
    'Dastgoh aniqroq kesadi. Usta nima qiladi?',
    'Maqsadni tanlash, sifatni tekshirish, xatoni oʻqish — hali insoniy.',
    'Motivetni kim beradi?',
    'Usta. Mashina parametrni bajaradi; maʼnoni emas.',
    'Shogird endi nima oʻrganadi?',
    'Integratsiya: vosita + material + mijoz ehtiyoji.',
    'Javobgarlik kimda?',
    'Imzo qoʻygan odamda. “Kompyuter shunday chiqardi” yetarli emas.',
    'Ish yoʻqoladimi?',
    'Baʼzi ishlar oʻzgaradi. Yangi nazorat va taʼmir ishlari chiqadi.',
    'Qoʻrquv bormi?',
    'Bor. Shuning uchun oʻqish uzluksiz boʻlsin.',
    'Xulosa?',
    'Aqlli vosita — sherik. Usta esa hali ham hukm egasi.',
    'Amaliy maslahat?',
    'Vositasiz ham qisqa sinov qiling — tushuncha yoʻqolmasin.',
  ],
  fillers: [
    'A: Dizayn dasturi gʻoya beradimi?\nB: Variant beradi. Tanlov va uygʻunlik — sizniki.',
    'A: Mijoz arzonlik soʻrasa?\nB: Arzonning narxini tushuntiring: vaqt, chidamlilik, taʼmir.',
  ],
});

push(a81_100, {
  id: 'a95',
  format: 'email',
  title: 'Ustozlar sekin mukammallikni qanday himoya qiladi?',
  vocab: craft,
  emailOpen:
    'Subject: Sekin sifatni himoya qilish boʻyicha tavsiya\n\nHurmatli taʼlim kengashi,',
  emailClose: 'Hurmat bilan,\nOlimjon Saidov\nUstozlar kengashi',
  beats: [
    'Tez portfolio bosimi shogirdni yuzaki qiladi. Biz sekin sifatni himoya qilishimiz kerak.',
    'Bahoda nafaqat natija, balki jarayon jurnali ham boʻlsin.',
    'Tanqid — shaxsiyatga emas, ishga. Bu temperamentni tarbiyalaydi.',
    'Buyurtma muddatlari real boʻlsin; “kecha kerak” — sifat dushmani.',
    'Pechka, quritish, dam olish — tabiatning vaqti. Uni “romantikа” demang, fizika.',
    'Halollik: yomon ishni maqtamang. Yumshoq rostlik — sabrni oʻrgatadi.',
    'Moliyaviy qoʻllab-quvvatlash sekin yoʻlni tanlaganlarni saqlaydi.',
    'Iltimos: baholash mezonlariga “chuqurlik” qatorini qoʻshing.',
  ],
  fillers: [
    'Ota-onalar yigʻilishida “sekin”ning qiymatini tushuntirish — sarmoya.',
    'Koʻrgazmada “necha soat?” yorligʻi tomoshabinni tarbiyalaydi.',
  ],
});

push(a81_100, {
  id: 'a96',
  format: 'article',
  title: 'Ustalar muvaffaqiyatsizlikni oʻzini yoʻqotmasdan qanday oʻqiydi?',
  vocab: craft,
  beats: [
    'Xato sharm spiraliga aylansa, oʻrganish toʻxtaydi.',
    'Oʻzini yoʻqotish — “men yomonman”; oʻqish — “shu urinish nima dedi?”.',
    'Payvanddagi yoriq — dars; melodrama esa vaqtni yeydi.',
    'Noaniq daromad sharoitida xato qoʻrqinchliroq; shuning uchun xavfsiz mashq maydoni kerak.',
    'Post-mortem: nima boʻldi, nima oʻrganildi, keyingi sinov nima.',
    'Yashirish madaniyati xatoni kattalashtiradi.',
    'Jamoa oldida ochiq tahlil — sharmni kamaytiradi.',
    'Qayta jarohatlash: oʻtmish muvaffaqiyatsizlikni tinimsiz tilga olish ham zarar.',
    'Yaxshi usta xatoni yashirmaydi, uni oʻlchaydi.',
    'Oʻzini saqlab qolish — keyingi urinish uchun yoqilgʻi.',
  ],
  fillers: [
    'Daftarda “uch xato — uch dars” rubrikasi foydali.',
    'Mijozga rost gapirish ishonchni buzmaydi, baʼzan oshiradi.',
  ],
});

push(a81_100, {
  id: 'a97',
  format: 'essay',
  title: 'Maqsad haqidagi nutqlar qiyin qismni nima uchun oʻtkazib yuboradi?',
  vocab: craft,
  beats: [
    'Ilhomli nutq oson: “nima uchun”. Qiyin qism — kompromiss va sheriklik.',
    'Boʻsh maqsad — chiroyli soʻz, yopiq byudjet.',
    'Meros va nufuz baʼzan qiyin savolni yopadi.',
    'Kalit nutqlar “konteyner” beradi; lekin ichini jamoa toʻldirishi kerak.',
    'Dilemma: foyda va axloq toʻqnashganda nima qilish? Shu yerda rost maqsad sinadi.',
    'Yoshlar “maqsad” marketingini sezadi; shuning uchun ochiqlik kerak.',
    'Ustaxonаda maqsad — mijozga rost xizmat; u shior emas.',
    'Qiyin qismni oʻtkazib yuborish — keyinroq ishonch inqirozi.',
    'Yaxshi rahbar qiyin qismni stolga qoʻyadi.',
    'Maqsad — yoʻnalish; yoʻl esa ishqalanish bilan keladi.',
  ],
  fillers: [
    'Jamoa yigʻilishida “nima qilmaymiz?” roʻyxati foydali.',
    'Talabalar uchun keys: chiroyli missiya vs real qaror.',
  ],
});

push(a81_100, {
  id: 'a98',
  format: 'feature',
  title: 'Hunar jamoalarini moda oʻzgarishida nima tirik saqlaydi?',
  vocab: craft,
  beats: [
    'Ustaxonаlar va uyushmalar bilмni avloddan avlodga oʻtkazadi.',
    'Darvozabonlik baʼzan sifat; baʼzan esa yangi ovozni yopish.',
    'Oʻtkazuvchanlik: yangi aʼzo kira olsin, lekin meʼyor saqlansin.',
    'Subsidия va davlat buyurtmasi moda pasayganda nafas beradi.',
    'Yashirin bilim — qoʻlda; uni faqat video bilan saqlab boʻlmaydi.',
    'Hamjihatlik: asbob almashish, birga xarid, birga oʻqitish.',
    'Pipeline: maktabdan ustaxonаga yoʻl ochiq boʻlsin.',
    'Moda oʻzgaradi; ehtiyoj (taʼmir, sifat) qoladi.',
    'Jamoa bayrami — faqat shou emas, rishta.',
    'Tiriklik — pul va maʼnoning birgaligi.',
  ],
  fillers: [
    'Kutubxona hunar kechalari yangi odamlarni olib keladi.',
    'Onlayn forum foydali; lekin yonma-yon ishlash oʻrnini bosmaydi.',
  ],
});

push(a81_100, {
  id: 'a99',
  format: 'opinion',
  title: 'Yuqori mahorat egalari tengsiz startga qanday munosabatda boʻlishi kerak?',
  vocab: craft,
  beats: [
    'Mahorat baʼzan omadli start ustiga quriladi. Buni unutish — amneziya.',
    'Stajirovka eshiklari tanish-bilish bilan ochilsa, darvoza qattiqlashadi.',
    'Qayta taqsimlash: stipendiya, ochiq portfolio koʻrik, bepul asbob soati.',
    'Boʻsh “ilhom” nutqi yetarli emas; joy ochish kerak.',
    'Bilimni yigʻib qoʻyish jamoani kambagʻallashtiradi.',
    'Yuqori mahorat — majburiyat ham: koʻprik boʻlish.',
    'Tanqid: “men ham qiynaldim” — baʼzan rost, baʼzan nisbatni yashiradi.',
    'Adolat — hasad emas, barqaror ekotizim.',
    'Maktablar bilan hamkorlik — eng amaliy javob.',
    'Start teng boʻlmasa ham, eshiklar kengayishi mumkin.',
  ],
  fillers: [
    'Ustozlar tanlov hayʼatida xilma-xil tajribani soʻrashsin.',
    'Grant hisobotida “kim yangi kirdi?” degan savol boʻlsin.',
  ],
});

push(a81_100, {
  id: 'a100',
  format: 'essay',
  title: 'Hunar markazli hayot nima soʻraydi va nima beradi?',
  vocab: craft,
  beats: [
    'Hunar markazli hayot tezkor shuhratni emas, kunlik eʼtiborni soʻraydi.',
    'U baʼzan kamroq pul, koʻproq maʼno beradi — lekin romantikа qilmaslik kerak.',
    'Kompetensiya — o‘zini hurmat qilishning sokin asosi.',
    'Vositalilik xavfi: odamni faqat foyda deb koʻrish. Hunar buni yumshatishi mumkin.',
    'Shahidlikka o‘xshash yonish — sovgʻa emas; chegarа kerak.',
    'Mavsumiy ritm: baʼzi ishlar shoshilmaydi. Tabiat va material vaqt beradi.',
    'Shogirdga joy ochish — hayotning berishi.',
    'Jamiyat bunyodkorlarni koʻrinsin qilsa, yoshlar yoʻl topadi.',
    'Hunar — faqat buyum emas, eʼtibor tarbiyasi.',
    'Soʻraydi: sabr. Beradi: uygʻunlik, foydali qoʻl, tinch magʻrurlik.',
  ],
  fillers: [
    'Yakuniy eslatma: hunar markazli hayot mukammal emas; u tanlangan eʼtibor.',
    'Shu eʼtibor jamiyatga ham oqadi — taʼmirlangan narsa, oʻrgatilgan qoʻl, ochiq usta.',
  ],
});

function wrap(kernels, label) {
  return `/** Agent-authored Latin Uzbek Advanced ${label} (offline kernels, no MT API). */
import { buildFromKernel } from './build-from-kernel.mjs';

const fixCyr = (s) =>
  String(s).replace(/[\\u0400-\\u04FF]/g, (ch) => {
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

const kernels = ${JSON.stringify(kernels, null, 2)};

export const LESSONS = Object.fromEntries(
  kernels.map((k) => {
    const built = buildFromKernel(deepFix(k));
    return [built.id, deepFix(built)];
  }),
);
`;
}

fs.writeFileSync(path.join(__dirname, 'a61-a80.mjs'), wrap(a61_80, 'a61–a80'));
fs.writeFileSync(path.join(__dirname, 'a81-a100.mjs'), wrap(a81_100, 'a81–a100'));
console.log('Wrote a61-a80', a61_80.length, 'a81-a100', a81_100.length);
