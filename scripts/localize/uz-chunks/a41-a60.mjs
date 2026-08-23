import { latinizeUzbek } from '../shared.mjs';
import { buildFromKernel } from './build-from-kernel.mjs';

const V = {
  cult: [
    ['meros', 'oʻtmishdan qolgan qadriyat va iz'],
    ['hikoya', 'voqeani tushuntiruvchi bayon'],
    ['arxiv', 'hujjat va dalillar ombori'],
    ['tarjima', 'maʼnoni boshqa tilga koʻchirish'],
    ['yodgorlik', 'xotira uchun qoʻyilgan belgi'],
    ['koʻrgazma', 'ommaviy namoyish'],
    ['ishtirok', 'qarorda qatnashish'],
    ['ishonch', 'rostlikka tayanish'],
  ],
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
  care: [
    ['gʻamxoʻrlik', 'boshqaga yordam berish'],
    ['rozilik', 'erkin berilgan ijoza'],
    ['umid', 'yaxshiroq natijaga intilish'],
    ['chegara', 'nima mumkinligini belgilash'],
    ['ogohlantirish', 'xavf haqida aytish'],
    ['jamoa', 'birga ishlaydigan odamlar'],
    ['axloq', 'toʻgʻri-notoʻgʻri mezonlari'],
    ['charchoq', 'uzoq zoʻriqish holati'],
  ],
  lang: [
    ['munozara', 'turli fikrlarni ochiq aytish'],
    ['metafora', 'oʻxshatish orqali tushuntirish'],
    ['agentlik', 'harakat qilish qobiliyati'],
    ['tushunarsizlik', 'soʻzlarning turlicha maʼnosi'],
    ['ishontirish', 'fikrni oʻzgartirishga urinish'],
    ['jimlik', 'gapirmaslik holati'],
    ['inklyuzivlik', 'koʻpchilikni qoʻshish'],
    ['masofa', 'kinoya yoki uzoqlashish'],
  ],
  eco: [
    ['ekotizim', 'tirik mavjudotlar bogʻlanishi'],
    ['kechikish', 'oqibatning kech koʻrinishi'],
    ['tiklash', 'buzilganni qayta sogʻlomlash'],
    ['oʻzaro bogʻliqlik', 'birining ikkinchiga taʼsiri'],
    ['koʻrsatkich', 'oʻlchov belgisi'],
    ['issiqish', 'haroratning xavfli oshishi'],
    ['majburiyat', 'qilish kerak boʻlgan ish'],
    ['sabablar', 'bir necha turtki majmui'],
  ],
  craft: [
    ['mahorat', 'mashq bilan olingan ustalik'],
    ['hunar', 'qoʻl va aql birikmasi'],
    ['sabr', 'sekin mukammallikka intilish'],
    ['xato', 'oʻrganish uchun muvaffaqiyatsizlik'],
    ['ustoz', 'yoʻl koʻrsatuvchi tajribali odam'],
    ['jamiyat', 'bir hunar atrofidagi odamlar'],
    ['maqsad', 'nima uchun ishlash'],
    ['sifat', 'ishning yaxshilik darajasi'],
  ],
};

// Fix any cyrillic that might have snuck into V - will latinize on write

const kernels = [];

function add(k) {
  kernels.push(k);
}

// --- Culture / history a41–a50 ---
add({
  id: 'a41',
  format: 'essay',
  title: 'Muassasalar oʻz tushirib qoldirishlarini qanday hikoya qilishi kerak?',
  vocab: V.cult,
  beats: [
    'Muassasa odatda yutuqlarini yozadi: ochilishlar, mukofotlar, oʻsish. Tushirib qoldirishlar — kechikkan ogohlantirish, eʼtiborsiz guruh, yoʻqolgan hujjat — kamdan-kam markazda turadi.',
    'Oʻz tushirib qoldirishini aytish zaiflik emas, ishonch qurish usuli. Chunki jamoatchilik baribir boʻshliqlarni sezadi; inkor esa gʻazabni kuchaytiradi.',
    'Yaxshi hikoya uchta qismdan iborat: nima boʻlmaganini aniq aytish, kim zarar koʻrganini tan olish, bundan keyin qanday tuzatish yoʻli borligini koʻrsatish.',
    'Til muhim. “Noqulaylik yuz berdi” degan feʼlsiz gap aybdorni yoʻqotadi. “Biz X qarorni kechiktirib, Y guruhni eshitmadik” esa masʼuliyatni qaytaradi.',
    'Arxivlar toʻliq emasligini ham aytish kerak. Yoʻq sahifa — ham hikoya. Uni yashirishdan koʻra, qanday toʻldirishga urinayotganini yozish halollikdir.',
    'Xodimlar uchun xavfsiz muhit boʻlmasa, hech kim ichki tushirib qoldirishni tashqariga aytmaydi. Shuning uchun ochiqlik — faqat PR emas, ichki himoya.',
    'Yillik hisobotda “nima qilmadik” boʻlimi boʻlishi mumkin. Bu gʻalati tuyuladi, lekin u oʻqiladigan ishonch yaratadi.',
    'Taʼlim muassasalari oʻz bitiruvchilari orasidagi tengsiz natijalarni ham muhokama qilishi kerak. Faqat eng yaxshi misollar — yarim haqiqat.',
    'Jamoatchilik savollariga tez, aniq, hujjatli javob — hikoyaning davomi. Sukut esa boʻshliqni mish-mish bilan toʻldiradi.',
    'Xulosa yoʻnalishi: tushirib qoldirishni aytish — muassasani kichraytirish emas, uni tuzatishga loyiq qilish.',
  ],
  fillers: [
    'Amaliy qadam sifatida tashqi audit, fuqarolar kengashi va ochiq shikoyat jurnali yordam beradi. Ular “biz aytdik” degan gapni tekshiriladigan holatga keltiradi. Tekshiruv boʻlmasa, hikoya yana niqobga aylanadi. Niqob esa keyingi inqirozda qimmatga tushadi. Shuning uchun ochiqlik — xarajat emas, sugʻurta.',
    'Matbuot bilan ishlashda ham bir xil mezon kerak: birinchi kun toʻliq bilmasangiz, shuni ayting; keyin yangilang. Tez yolgʻon tinchlantiradi, sekin rost esa ishonchni saqlaydi. Muassasa vaqti uzoq; shuning uchun uzoq ishonch qimmatliroq.',
  ],
});

add({
  id: 'a42',
  format: 'feature',
  title: 'Musiqa milliy ziddiyatni qanday ushlab tura oladi?',
  vocab: V.cult,
  beats: [
    'Musiqa bayroqdan yumshoqroq, lekin baʼzan kuchliroq. U bir xil ohangda turli xotiralarni uygʻotadi: gʻalaba va yoʻqotish, faxr va uyat.',
    'Milliy ziddiyat — bir xil voqeani turlicha eslash. Qoʻshiq shu ziddiyatni yoʻq qilmasdan, bir maydonda ushlab turishi mumkin.',
    'Radio va festivallar qaysi ovozlarni qoʻyishi — siyosiy tanlov. “Betaraf pleylist” degan narsa kam uchraydi; tanlov bor joyda masʼuliyat bor.',
    'Diaspora qoʻshiqlari vatandagi rasmiy hikoyani murakkablashtiradi. Ular yoʻqolgan tillarni, aralash oilalarni, ikki uyli yurakni eslatadi.',
    'Sansüra urinishlari musiqani toʻxtatmaydi; u yer ostiga tushadi va keyin balandroq qaytadi. Yopish — yechim emas, kechiktirish.',
    'Maktab xorlari ham ziddiyatni yumshatishi yoki keskinlashtirishi mumkin: qaysi tillarda kuylash, qaysi bayramlarni tanlash.',
    'Tijorat oqimi “milliy”ni brend qilishi mumkin. Brend foydali, lekin u ogʻriqli xotirani yuvib yuborsa, musiqa yolgʻonlashadi.',
    'Jonli konsertlarda odamlar yonma-yon turadi. Shu jismoniy yaqinlik baʼzan matndan kuchliroq kelishuv yaratadi.',
    'Tarixchilar va musiqashunoslar izohlarni ochiq yozsa, tinglovchi manipulyatsiyani yaxshiroq sezadi.',
    'Musiqa tinchlik kafolati emas; lekin u ziddiyatni inkor etmasdan birga eshitishga joy ochadi.',
  ],
  fillers: [
    'Shahar maydonlaridagi ochiq konsertlar turli mahallalarni bir joyga chaqirishi mumkin. Chipta qimmat boʻlmasa, ishtirok kengayadi. Keng ishtirok — ziddiyatni yumshatishning amaliy sharti. Amaliy shart bajarilmasa, musiqa faqat bir qatlamning bezagi boʻlib qoladi.',
    'Yosh ijodkorlarga grant berish — yangi ohanglar orqali eski bahsga yangi eshik ochish. Yangi eshik eski eshikni yopmaydi; u havo kiritadi.',
  ],
});

add({
  id: 'a43',
  format: 'opinion',
  title: 'Qiyin tarixni tashrif buyuruvchilar uchun qulay qilish kerakmi?',
  vocab: V.cult,
  beats: [
    'Muzeylar baʼzan ogʻriqli mavzuni “tushunarli” qilish uchun yumshatadi. Yumshatish tushuntirishi mumkin; lekin u haqiqatni yengillashtirib yuborishi ham mumkin.',
    'Tashrif buyuruvchi qulaylikni xohlaydi: qisqa matn, chiroyli zal, xavfsiz his. Jabrlanuvchi xotira esa qulaylikni har doim berolmaydi.',
    'Bolalar guruhlari uchun moslashtirish kerak — bu inkor emas, yoshga mos yoʻl. Lekin kattalar uchun ham hamma narsani yumshoq qilish — hurmatsizlik boʻlishi mumkin.',
    'Qulaylashtirishning yaxshi shakli: ogohlantirish, tanlovli chuqurlik, tinch zona. Yomon shakli: zoʻravonlikni “afsona” qilib koʻrsatish.',
    'Mahalliy jamoalar matnni birga yozsa, “tashqaridan kelgan yumshoqlik” kamayadi. Ular nima aytish mumkinligini yaxshiroq biladi.',
    'Turizm daromadi bosimi xavfli. Agar maqsad — koʻproq chipta, hikoya boʻysanishi mumkin. Maqsad — hurmatli xotira boʻlsa, baʼzi tashrif buyuruvchi noqulay ketadi — bu baʼzan toʻgʻri.',
    'Raqamli qoʻshimchalar chuqur qatlamni ixtiyoriy ochishi mumkin: xohlagan odam koʻproq oʻqiydi, xohlamagani asosiy yoʻlakda qoladi.',
    'Qulaylik — tushunishga yordam; tinchlantirish — masʼuliyatdan qochish. Ikkalasini adashtirmaslik kerak.',
    'Xodimlar ham tayyorlanishi lozim: ogʻir savollarga javob, hissiy qoʻllab-quvvatlash, aniq faktlar.',
    'Qiyin tarix qulay boʻlishi shart emas; u adolatli, aniq va hurmatli boʻlishi kerak.',
  ],
  fillers: [
    'Xorijiy mehmonlarga kontekst berish — yaxshi. Lekin kontekstni “bizning aybimiz yoʻq” deb yozish — yomon. Farq shu ikki jumlada. Jamoatchilik shu farqni sezgir oʻqiydi.',
    'Vaqti-vaqti bilan matnni qayta koʻrib chiqish kerak: yangi tadqiqot, yangi ovoz, yangi savov. Muzey tirik organizm; muzey muzlamasligi kerak.',
  ],
});

add({
  id: 'a44',
  format: 'dialogue',
  title: 'Arxivlar toʻliq boʻlmasa, boʻshliqlarni qanday hikoyalar toʻldiradi?',
  vocab: V.cult,
  speakers: ['A', 'B'],
  beats: [
    'Boʻsh sahifa qolsa, odamlar mish-mish bilan toʻldiradi. Bu tabiiy, lekin xavfli.',
    'Shuning uchun arxivchi “bilmaymiz”ni ochiq aytishi kerak. Boʻshliq — ham dalil.',
    'Ogʻzaki tarix boʻshliqni toʻldira oladimi?',
    'Qisman. U boy, lekin xotira tanlab ishlaydi. Shuning uchun uni yozib, solishtirib, ehtiyot bilan qoʻyish kerak.',
    'Badiiy film boʻshliqni “yopib” yubormaydimi?',
    'Film hissiyot beradi, lekin uni hujjat deb koʻrsatmaslik kerak. Eng yaxshi filmlar oʻz toʻqimasini tan oladi.',
    'Kimning ovozi arxivga kirmagan?',
    'Koʻpincha kambagʻal, ayol, ozchilik, magʻlub tomon. Boʻshliq — kuch xaritasi.',
    'Unda nima qilamiz?',
    'Qidiramiz, soʻraymiz, ehtiyotkor faraz qilamiz, va “bu aniq” demasdan oldin tekshiramiz.',
    'Jamoatchilik sabrsiz-ku.',
    'Sabrsizlikni tushunaman. Lekin tez yolgʻon sekin rostan qimmatroq.',
    'Maktablarda qanday oʻrgatamiz?',
    'Oʻquvchilarga manba tanqisligini koʻrsatamiz. Ular “toʻliq kitob” afsonasidan chiqadi.',
    'Xulosa?',
    'Boʻshliqni toʻldirish — ijod emas, masʼuliyat. Eng rost toʻldirish baʼzan ochiq savov bilan qolishdir.',
  ],
  fillers: [
    'A: Digital nusxalar yordam beradimi?\nB: Ha, lekin raqamlashtirish tanlovini ham soʻrang: nima birinchi skanerlanadi? Tanlov yana kuchni koʻrsatadi.',
    'A: Oilaviy sandiqlarchi?\nB: Ular oltin koni. Kutubxonalar ularni ehtiyotlab qabul qilsa, rasmiy arxiv yumshoqadi va boyiydi.',
  ],
});

add({
  id: 'a45',
  format: 'email',
  title: 'Koʻrgazma matni hal etilmagan tarixni qanday hurmat qiladi?',
  vocab: V.cult,
  emailOpen:
    'Subject: Hal etilmagan tarix uchun koʻrgazma matni boʻyicha taklif\n\nHurmatli kuratorlar kengashi,',
  emailClose: 'Hurmat bilan,\nLaylo Rahimova\nTafsir va matn boʻyicha maslahatchi',
  beats: [
    'Yangi zal matnida “yakuniy haqiqat” ohangidan qochishni soʻrayman. Hal etilmagan tarix yakuniy gapni koʻtarmaydi; u ochiq savovni koʻtaradi.',
    'Har bir boʻlimda nima maʼlum, nima bahsli, nima nomaʼlum ekanini ajrataylik. Bu tashrif buyuruvchini chalkashtirmaydi; aksincha, uni hurmat qiladi.',
    'Jabrlanuvchi jamoalarning ovozidan iqtiboslar — markazda turishi kerak. Bizning izohimiz ularni “tushuntirib yubormasligi” lozim.',
    'Ogohlantirish yozuvlari va tinch xona — qulaylashtirish emas, gʻamxoʻrlik. Ogʻir materialdan keyin odam nafas olishi kerak.',
    'Tarjimalar teng sifatda boʻlsin. Zaif tarjima baʼzi tillarni ikkinchi darajali qiladi — bu ham tarixiy adolatsizlik izidir.',
    'Chipta matnida turizm vaʼdasini yumshoq qilib, xotira vazifasini aniq aytaylik. Mehmon nima kutishini bilishi kerak.',
    'Ochiq muhokama kechasi — koʻrgazmaning davomi. Matn yakun emas, suhbat boshlanishi boʻlsin.',
    'Agar yangi dalil chiqsa, matnni yangilash protokoli oldindan yozilsin. Tirik koʻrgazma — shu protokol.',
  ],
  fillers: [
    'Moliyachi homiylar matnga taʼsir qilmasligi haqida yozma kelishuvni tavsiya qilaman. Homiylik kerak; tahrir huquqi esa xotirani sotadi. Sotilgan xotira keyin qaytarib boʻlmaydigan ishonchsizlik keltiradi.',
    'Xodimlar uchun qisqa trening: qiyin savollarga qanday javob, qachon mutaxassisga yoʻnaltirish. Yaxshi matn yomon tayyorgarlikda sindi.',
  ],
});

add({
  id: 'a46',
  format: 'article',
  title: 'Bahsdan keyin yodgorlik: nima qoladi?',
  vocab: V.cult,
  beats: [
    'Yodgorlik bahsi tugagach, tosh yo koʻchadi, yo qoladi, yo yoniga izoh qoʻyiladi. Lekin jamiyatda nima qoladi — ochiq savov.',
    'Baʼzan yodgorlik ketadi, gʻazab qoladi. Baʼzan yodgorlik qoladi, lekin maʼnosi oʻzgaradi. Natija — faqat bronza emas, xotira amaliyoti.',
    'Izoh lavhasi kompromis boʻlishi mumkin: eski belgi + yangi kontekst. Bu hammaga yoqmasligi mumkin, lekin u tarixni oʻchirmasdan murakkablashtiradi.',
    'Maktab dasturlari bahsdan keyin muhimroq. Bolalar nima uchun bahs boʻlganini tushunmasa, toshning taqdiri yetarli emas.',
    'Raqamli arxiv — koʻchirilgan yodgorlikning izini saqlashi mumkin. Yoʻqotishni inkor etmasdan, oʻrganishni davom ettirish.',
    'Mahalla uchun yangi xotira joyi kerak boʻlishi mumkin: skameyka, daraxt, kichik muzey. Boʻsh postament — ham xabar.',
    'Sanʼatkorlar bahsni yangi asarga aylantirishi mumkin. Asar yechim emas, lekin suhbatni tirik saqlaydi.',
    'Siyosatchilar “tugadi” desa ham, oilaviy hikoyalar davom etadi. Rasmiy yakun — xususiy xotirani toʻxtatmaydi.',
    'Eng sogʻlom qoldiq — keyingi bahsga tayyorroq boʻlgan fuqarolik: dalil, hurmat, jarayon.',
    'Yodgorlik ketishi yoki qolishi — boshlanish; jamiyatning oʻrganishi — asosiy meros.',
  ],
  fillers: [
    'Xalqaro misollar koʻrsatadiki, bitta formula yoʻq. Har bir joy oʻz tarixiy yarasiga mos yoʻl tanlaydi. Nusxa koʻchirish xavfli; oʻrganish foydali. Oʻrganish esa vaqt oladi.',
    'Mahalliy media bahsdan keyin ham kuzatishi kerak: vaʼdalar bajarildimi, izohlar oʻqiladimi, dars ochildimi? Eʼtibor tugasa, islohot ham soʻnadi.',
  ],
});

add({
  id: 'a47',
  format: 'essay',
  title: 'Xususiy kolleksiyalar qachon ommaviy tashvishga aylanadi?',
  vocab: V.cult,
  beats: [
    'Kolleksionerlar sanʼatni saqlashi mumkin. Lekin baʼzi asarlar shunchalik muhimki, ularning yopiq saqlanishi jamoat yoʻqotishi hisoblanadi.',
    'Chegara qachon chiziladi? Madaniy meros statusi, talon-taroj tarixi, noyoblik, jamoat uchun maʼno — shu mezonlar bahsda ishtirok etadi.',
    'Bozor narxi ommaviy qiziqishni kuchaytiradi, lekin narx yagona mezon emas. Qimmat boʻlmagan hujjat ham xalq xotirasi boʻlishi mumkin.',
    'Muzeylarga hadya yoki uzoq muddatli ijara — yumshoq yoʻl. Majburiy olib qoʻyish esa qonuniy va axloqiy jihatdan ogʻir.',
    'Kelib chiqish hujjatlari ochiq boʻlsa, munozara adolatliroq boʻladi. Yopiq provinensiya shubhani boqadi.',
    'Xususiy huquq muhim; lekin u oʻgʻirlik ustiga qurilgan boʻlsa, himoya zaiflashadi. Tarixiy adolat shu yerda aralashadi.',
    'Raqamli nusxa ommaviy kirishni oshiradi, lekin asl buyumning aurasi boshqa. Ikkala ehtiyojni aralashtirmaslik kerak.',
    'Soliq imtiyozlari ochiq namoyish sharti bilan berilishi mumkin. Bu bozorni yoʻq qilmaydi; jamoat foydasini oshiradi.',
    'Xalqaro qaytarish daʼvolari uzoq davom etadi. Ular charchatadi, lekin sukutdan yaxshiroq.',
    'Xususiy kolleksiya ommaviy tashvishga aylanganda, savol mulkdan tashqariga chiqadi: biz kim sifatida esdalik saqlaymiz?',
  ],
  fillers: [
    'Kichik shahar muzeylari ham shu bahsda ovozga ega. Faqat poytaxt emas, mahalliy xotira ham “ommaviy”dir. Markazlashgan qaror ularni unutmasligi kerak.',
    'Huquqshunoslar va tarixchilar birga ishlasa, emotsiya va qonun oʻrtasida koʻprik chiqadi. Koʻpriksiz bahs qichqiriqqa aylanadi.',
  ],
});

add({
  id: 'a48',
  format: 'feature',
  title: 'Tarjimonlar soʻzma-soʻz boʻlmasdan qanday sodiq qoladi?',
  vocab: V.cult,
  beats: [
    'Soʻzma-soʻz tarjima baʼzan xiyonat qiladi: maʼno, ohang, hazil yoʻqoladi. Sodiqlik — lugʻat emas, taʼsir va aniqlik muvozanati.',
    'Tarjimon tanlov qiladi: idiomani tushuntirishmi, oʻxshashini topishmi, izoh berm? Har bir yoʻl bir narsani saqlab, boshqasini yoʻqotadi.',
    'Muallif ohangi — qattiq, yumshoq, kinoyali — sodiqlikning markazi. Ohang yoʻqolsa, “toʻgʻri soʻz” ham yolgʻon tuyuladi.',
    'Madaniy ishoralar tarjimada ochilishi yoki moslashtirilishi mumkin. Auditoriya kimligi shu tanlovni belgilaydi.',
    'Hamkorlik foydali: muharrir, madaniy maslahatchi, sinov oʻquvchilar. Yolgʻiz daho afsonasi kamdan-kam ishlaydi.',
    'Mashina tarjimasi tezlik beradi; sodiqlik esa hali ham insoniy hukm talab qiladi. Hukmsiz tezlik — xavfli qulaylik.',
    'Sheʼr va dramaturgiya ayniqsa nozik. Ritm va pauza maʼnoning bir qismi. Ularni eʼtiborsiz qoldirish — matnni tekislash.',
    'Tarjimonning koʻrinmasligi baʼzan hurmatsizlik. Izohda ism va tanlov sabablari boʻlsa, oʻquvchi boyiydi.',
    'Sodiqlik — mukammallik emas, masʼuliyatli yaqinlik. Yaqinlik esa doim biroz masofa bilan keladi.',
    'Yaxshi tarjima ikki dunyo orasida eshik ochadi; u eshikni gʻisht bilan toʻldirmaydi.',
  ],
  fillers: [
    'Nashriyotlar tarjimaga yetarli muddat va haq bersa, sifat oshadi. Shoshilinch byudjet sodiqlikni arzonlashtiradi. Arzon sodiqlik keyin brendga qimmatga tushadi.',
    'Oʻquvchilar ham “bu tarjima”ni muhokama qilishi mumkin. Tanqid — dushmanlik emas, sodiqlikni oshiruvchi teskari aloqa.',
  ],
});

add({
  id: 'a49',
  format: 'opinion',
  title: 'Tijorat oʻtmishni sotish uchun qanday stilizatsiya qiladi?',
  vocab: V.cult,
  beats: [
    'Kafelardagi “retro”, kinodagi “vintage”, doʻkondagi “anʼanaviy taʼm” — oʻtmish tez-tez mahsulotga aylanadi.',
    'Stilizatsiya xotirani yumshoq qiladi: ogʻriqni olib tashlab, rang va hidni qoldiradi. Bu yoqimli; lekin u oʻrgatishni almashtirmasligi kerak.',
    'Brendlar “autentik” soʻzini yaxshi koʻradi. Autentiklik esa koʻpincha tanlangan bezak. Tanlovni yashirish — manipulyatsiya.',
    'Turizm shaharlarida eski mahalla “dekoratsiya”ga aylanadi. Yashovchilar esa dekoratsiya ichida ijara toʻlaydi. Shu ziddiyatni koʻrish kerak.',
    'Yaxshi stilizatsiya manbani koʻrsatadi va murakkablikni yashirmaydi. Yomon stilizatsiya — shirin yolgʻon.',
    'Maktablar tijoriy oʻtmishni tanqidiy oʻqishni oʻrgatishi mumkin: reklama kim uchun, nima oʻchirilgan?',
    'Hunarmandlar oʻz merosini oʻzlari sotganda, bu ovoz boshqacha. Ovoz egasi kimligi — axloqiy farq.',
    'Qonun “madaniy oʻgʻirlik”ni toʻliq yopa olmaydi; madaniy savodxonlik esa yumshoq himoya beradi.',
    'Isteʼmolchi soʻrashi mumkin: men nima sotib olyapman — buyummi yoki birovning xotirasinimi?',
    'Oʻtmishni sotish mumkin; lekin uni faqat bezak qilish — kelajakni sayozlashtirish.',
  ],
  fillers: [
    'Muzey doʻkonlari ham shu bosim ostida. Suvenir foydali; lekin u asosiy hikoyani yengillashtirib yubormasligi kerak. Chegara nozik, shuning uchun ochiq muhokama kerak.',
    'Yosh dizaynerlar stilizatsiyani tanqidiy loyiha sifatida ishlatishi mumkin: goʻzallik bilan birga izoh. Izoh — rostlikka yoʻl.',
  ],
});

add({
  id: 'a50',
  format: 'article',
  title: 'Nega hozir sekin estetik talablarni himoya qilish kerak?',
  vocab: V.cult,
  beats: [
    'Tez lentalar, qisqa videolar, bir soniyalik eʼtibor — davr shu ohangda. Shu yerda sekin estetika gʻalati tuyuladi: uzun roman, jim konsert, diqqatli tomosha.',
    'Sekin talab — hashamat emas, diqqat mushagini saqlash. U yoʻqolsa, murakkab sanʼat ham, murakkab fuqarolik ham qiyinlashadi.',
    'Maktab va kutubxonalar sekinlikni “qoloqlik” deb koʻrmasligi kerak. Ular sekinlik infratuzilmasi.',
    'Tijorat tezlikni mukofotlaydi. Shuning uchun jamoat sarmoyasi sekin shakllarni himoya qilishi mumkin: festival, nashr, namoyish vaqti.',
    'Sekin estetika elitar boʻlib ketmasligi uchun kirish oson boʻlishi kerak: arzon chipta, ochiq matn, tushuntirish.',
    'Raqamli platformalar ham “sekin rejim” taklif qilishi mumkin. Bu foyda modeliga qarshi ketishi mumkin; shuning uchun siyosiy ragʻbat kerak.',
    'Sanʼatkorlar shoshilish bosimini his qiladi. Grantlar natijani emas, jarayonni ham qadrlasa, sifat oshadi.',
    'Tomoshabin charchogʻi haqiqiy. Sekin asar charchoqni inkor etmasdan, boshqa nafas taklif qiladi.',
    'Himoya — taqiqlash emas, joy ochish. Tez madaniyat yonida sekin madaniyat ham yashasin.',
    'Hozir himoya qilmasak, keyin qayta tiklash qimmatroq boʻladi. Diqqat — tiklash qiyin resurs.',
  ],
  fillers: [
    'Oila kechalarida bitta filmni toʻliq koʻrish, bitta bobni ovoz chiqarib oʻqish — kichik amaliyot. Kichik amaliyotlar jamoaviy qobiliyatni saqlaydi.',
    'Tanqidchilar sekin asarlarni “zerikarli” deb yopmasdan, ularga kirish kalitini bersa, auditoriya kengayadi. Kalit — hurmatning bir shakli.',
  ],
});

function deepFix(x) {
  if (typeof x === 'string') return latinizeUzbek(x);
  if (Array.isArray(x)) return x.map(deepFix);
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) o[k] = deepFix(v);
    return o;
  }
  return x;
}

export const LESSONS = Object.fromEntries(
  kernels.map((k) => {
    const built = buildFromKernel(deepFix(k));
    return [built.id, deepFix(built)];
  }),
);
