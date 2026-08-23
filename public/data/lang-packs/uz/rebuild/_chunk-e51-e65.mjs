/** Agent-authored UZ Elementary e51–e65 */
function L(id, title, text, vocabulary) {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return { id, title, text, vocabulary, targetSeconds: Math.max(45, Math.min(600, Math.round((w / 130) * 60))) };
}

export const lessons = [
  L('e51', 'Eng koʻp faxrlanadigan mahoratingiz qaysi?',
    `Eng koʻp faxrlanadigan mahoratim — boshqalarga dars berish. Universitetda matematikadan qiynalgan kursdoshlarimga yordam berardim. Ular chalkashib qolganda, men formulani bezamasdan, oddiy misol bilan tushuntirardim. Texnik bilish yetarli emasligini oʻsha paytda bildim; muloqot ham kerak.

Bir qiz birinchi hafta gʻazab bilan daftarini yopardi. Men «qayerda toʻxtading?» deb soʻradim. U sekin gapirdi, men tingladim, keyin bitta qadamni birga yozdik. Ikki oyda u imtihondan oʻtdi. Faxrim uning bahosida emas, uning «endi tushundim» degan ovozida edi.

Hozir ishda yangi hamkasblarga dasturiy taʼminotni tushuntiraman. Yana shu usul: chalkashlikni aybdorlik emas, signal deb bilish. Dars berish — bezakli nutq emas; sabr va aniq gap. Shu mahorat meni foydali his qildiradi.`,
    [
      { word: 'dars berish', definition: 'boshqaga oʻrgatish' },
      { word: 'chalkashib', definition: 'tushunmay qolib' },
      { word: 'gʻazab', definition: 'jahl' },
      { word: 'texnik', definition: 'maxsus bilimga oid' },
      { word: 'muloqot', definition: 'gaplashish' },
      { word: 'bezamasdan', definition: 'ortiqcha bezaksiz' },
      { word: 'tushuntirardim', definition: 'ochib berardim' },
      { word: 'signal', definition: 'ishora' },
      { word: 'sabr', definition: 'kutish qobiliyati' },
      { word: 'aniq', definition: 'ravshan' },
      { word: 'foydali', definition: 'yordam beradigan' },
      { word: 'mahorat', definition: 'oʻrgangan qobiliyat' },
    ]),
  L('e52', 'Biror narsani qiyin yoʻl bilan oʻrganganmisiz?',
    `Biror narsani eng qiyin yoʻl bilan oʻrgangan paytim — muhim faylni oʻchirib yuborgan kunim. Tugmani shoshilib bosdim, keyin fayl buzilib ochilmadi. Zaxira nusxa yoʻq edi. Rahbarim tinch soʻradi: «Qachon oxirgi marta saqlading?» Javobim achinarli edi.

Oqibat tez keldi: kechki ish, uzr, qayta yozish. Oʻsha kecha yomon kayfiyatda uyga qaytdim. Keyin qoida qoʻydim: har kechqurun zaxira, har loyihada ikki joy. Qiyin yoʻl ogʻriqli, lekin esda qoladi.

Endi yangi dastur oʻrgansam, avval xavfsiz sinov qilaman. Nazoratchim «xato — dushman emas, dars» degan edi. Men bunga ishonaman, lekin bir xil xatoni ikki marta qilishni xohlamayman. Qiyin yoʻl — baʼzan eng aniq oʻqituvchi.`,
    [
      { word: 'oʻchirib', definition: 'oʻchirib tashlab' },
      { word: 'buzilib', definition: 'ishlamay qolib' },
      { word: 'zaxira', definition: 'qoʻshimcha nusxa' },
      { word: 'rahbar', definition: 'boshqaruvchi' },
      { word: 'achinarli', definition: 'yomon, ayanchli' },
      { word: 'oqibat', definition: 'natija' },
      { word: 'nazoratchi', definition: 'ishni kuzatuvchi' },
      { word: 'saqlading', definition: 'yozib qoʻyding' },
      { word: 'qoida', definition: 'tartib' },
      { word: 'sinov', definition: 'tekshirish' },
      { word: 'xato', definition: 'notoʻgʻrilik' },
      { word: 'dars', definition: 'oʻrganilgan narsa' },
    ]),
  L('e53', 'Yoshlar koʻp ishni sinab koʻrishi kerakmi?',
    `A: Yoshlar koʻp ishni sinab koʻrishi kerakmi?
B: Ha, ayniqsa mushak va fikr hali moslashuvchan boʻlsa. Turli lavozimlar CV ga qiziqish qoʻshadi.
A: Baʼzilar bu sarsonlik deyishadi.
B: Farq bor. Maqsadsiz suzish boshqa, ongli tajriba boshqa. Uch oy kafeda ishlash, keyin ofis — bu yoʻqotish emas, maʼlumot.
A: Ota-onalar barqarorlik xohlaydi.
B: Tushunarli. Lekin erta yoshda faqat bitta yoʻl baʼzan keyin afsus keltiradi. Sinab koʻrish — boʻsh joylarni toʻldirish.
A: Qachon toʻxtash kerak?
B: Qachonki bitta yoʻnalish kuch va qiziqishni birlashtirsa. Unda chuqurlash. Lekin oldin koʻp eshikni ochish — mushak mashqi.`,
    [
      { word: 'mushak', definition: 'tana kuchi; moslashuv' },
      { word: 'lavozim', definition: 'ish oʻrni' },
      { word: 'suzish', definition: 'maqsadsiz yurish' },
      { word: 'CV', definition: 'ish tarjimai holi' },
      { word: 'qiziqish', definition: 'bilish istagi' },
      { word: 'sarsonlik', definition: 'yoʻnalishsizlik' },
      { word: 'ongli', definition: 'oʻylab qilingan' },
      { word: 'barqarorlik', definition: 'barqaror holat' },
      { word: 'boʻsh joy', definition: 'boʻshliq' },
      { word: 'chuqurlash', definition: 'chuqurroq oʻrganish' },
      { word: 'tajriba', definition: 'sinov orqali bilish' },
      { word: 'eshik', definition: 'imkoniyat' },
    ]),
  L('e54', 'Ishdagi birinchi haftani nima qiyinlashtiradi?',
    `Salom, Dilnoza,

Ishdagi birinchi haftang qanday oʻtdi, deb soʻramoqchi edim. Mening birinchi haftam qiyin edi, chunki hamma narsa yangi edi: dasturiy taʼminot, qisqa yoʻllar, doimiy ismlar. Intensiv kunlar edi; ustuvorlikni hali bilmasdim.

Eng qiyini soʻrashga jasorat topish edi. «Bu oddiy narsani bilmayman» demak uyatdek tuyulardi. Keyin tushundim: birinchi hafta — oʻrganish haftasi, mukammallik haftasi emas. Mening maslahatim: har kuni uchta savol yoz, bitta odamni kuzat, kechqurun nima oʻrganganingni belgila.

Agar dastur chalkashsa, qisqa yoʻlni keyinroq oʻrgan. Avvalo asosiy oqimni tushun. Jasorat baʼzan katta nutq emas; u «kechirasiz, yana bir marta koʻrsata olasizmi?» degan oddiy gap.

Yozib tur,

Jasur`,
    [
      { word: 'qisqa yoʻl', definition: 'tezlatuvchi usul' },
      { word: 'dasturiy taʼminot', definition: 'kompyuter dasturi' },
      { word: 'doimiy', definition: 'tinimsiz' },
      { word: 'intensiv', definition: 'juda zoʻr' },
      { word: 'ustuvorlik', definition: 'avvalo qilinadigan ish' },
      { word: 'jasorat', definition: 'qidirish kuchi' },
      { word: 'uyat', definition: 'xijolat' },
      { word: 'kuzat', definition: 'diqqat bilan qara' },
      { word: 'asosiy', definition: 'eng muhim' },
      { word: 'chalkashsa', definition: 'tushunarsiz boʻlsa' },
      { word: 'oddiy', definition: 'sodda' },
      { word: 'maslahat', definition: 'yoʻriq' },
    ]),
  L('e55', 'Nega baʼzi odamlar kasbini oʻzgartiradi?',
    `Baʼzi odamlar kasbini oʻzgartiradi, chunki ish hayoti maqsadga mos kelmay qoladi. Oylik yaxshi boʻlishi mumkin, lekin ertalab uygʻonganda ogʻirlik seziladi. Bu baʼzan isteʼfo bilan tugaydi; baʼzan sekin qayta oʻqish bilan.

Men tanishim oʻqituvchilikdan dizaynga oʻtdi. U «kimligim faqat lavozim emas» dedi. Qayta tayyorgarlik qiyin edi: kechki kurslar, kamroq pul, koʻp shubha. Lekin u koʻngilli ishda yangi yoʻnalishni sinab koʻrdi va u yerda energiya topdi.

Kasb oʻzgartirish shaxsiyatni tashlash emas; uni yangilash. Maqsad baʼzan uzoqda yashiringan boʻladi. Agar ishingiz doimiy charchoq bersa, savol bering: bu charchoq normalmi yoki notoʻgʻri yoʻl belgisimi? Javob shaxsiy, lekin savol kerak.`,
    [
      { word: 'isteʼfo', definition: 'ishdan ketish' },
      { word: 'mos kelmay', definition: 'toʻgʻri kelmay' },
      { word: 'maqsad', definition: 'nima uchun ishlash' },
      { word: 'qayta tayyorgarlik', definition: 'yangi kasb oʻrganish' },
      { word: 'shaxsiyat', definition: 'kimligingiz' },
      { word: 'koʻngilli', definition: 'pullik emas, ixtiyoriy' },
      { word: 'shubha', definition: 'ishonchsizlik' },
      { word: 'energiya', definition: 'ichki kuch' },
      { word: 'lavozim', definition: 'ish nomi' },
      { word: 'charchoq', definition: 'holdan toyish' },
      { word: 'belgi', definition: 'ishora' },
      { word: 'yangilash', definition: 'yangilamoq' },
    ]),
  L('e56', 'Biror kishiga mahorat oʻrgatganmisiz?',
    `Opa-singiliga velosiped haydashni oʻrgatganman. U qatʼiy edi, lekin birinchi daqiqada qoʻrquvdan qotib qoldi. Men orqadan ushlab turdim, keyin asta qoʻyib yubordim. U yiqildi, kuldi, yana urinib koʻrdi. Tarjima qilish shart emasdi: tana oʻzi oʻrganardi.

Dastlab harakatlar sirli tuyulardi — muvozanat qanday ishlaydi? Keyin avtomatik boʻldi. Mening ishim tushuntirishdan koʻra xavfsiz maydon berish edi. U ishonch topganda, men orqaga chekindim.

Oʻrgatish — gʻalaba nutqi emas. U sabr, qayta urinish va kichik nishonlash. Endi ishda yangi dastur oʻrgatsam, shu usulni eslayman: qoʻrquvni masxara qilma, qoʻyib yuborish vaqtini bil. Mahorat sirli qolmasin; u amaliyot bilan ochiladi.`,
    [
      { word: 'qatʼiy', definition: 'qarorli' },
      { word: 'qoʻrquv', definition: 'qoʻrqish' },
      { word: 'qoʻyib yubordim', definition: 'qoʻllab turishni toʻxtatdim' },
      { word: 'tarjima', definition: 'boshqa tilga oʻgirish' },
      { word: 'avtomatik', definition: 'oʻylamasdan' },
      { word: 'sirli', definition: 'tushunarsiz' },
      { word: 'muvozanat', definition: 'tenglik' },
      { word: 'ishonch', definition: 'oʻziga ishonish' },
      { word: 'sabr', definition: 'kutish' },
      { word: 'masxara', definition: 'kulish' },
      { word: 'amaliyot', definition: 'mashq' },
      { word: 'nishonlash', definition: 'quvonish' },
    ]),
  L('e57', 'Nima muhimroq: isteʼdodmi yoki mashqmi?',
    `A: Nima muhimroq: isteʼdodmi yoki mashqmi?
B: Isteʼdod eshikni ochadi, mashq ichkarida qoldiradi. Sovgʻali bola bor, lekin mashqsiz yorqinligi soʻnadi.
A: Ilhom-chi?
B: Ilhom yoqimli, lekin u jazo emas, mehmondir. Har kuni kelavermaydi. Mashq keladi.
A: Demak, isteʼdod kerak emasmi?
B: Kerak, lekin yetarli emas. Men sekin boshlaganman, lekin har kuni oʻn daqiqa mashq qilganman. Natija «sehr» emas, soatlar edi.
A: Bolalarga nima deysiz?
B: «Sen isteʼdodlisan»dan koʻra «sen mashq qila olasan» deying. Bu ishonchni oshiradi.
A: Xulosa?
B: Isteʼdod urugʻ; mashq suv. Ikkalasi kerak, lekin suvsiz urugʻ och qoladi.`,
    [
      { word: 'isteʼdod', definition: 'tabiiy qobiliyat' },
      { word: 'mashq', definition: 'takroriy ishlash' },
      { word: 'sovgʻali', definition: 'isteʼdodli' },
      { word: 'ilhom', definition: 'toʻsatdan kuch' },
      { word: 'soʻnadi', definition: 'yoʻqoladi' },
      { word: 'jazo', definition: 'ogʻir majburiyat' },
      { word: 'sehr', definition: 'sehrli kuch' },
      { word: 'ishonch', definition: 'oʻziga ishonish' },
      { word: 'urugʻ', definition: 'boshlangʻich' },
      { word: 'natija', definition: 'chiqish' },
      { word: 'yorqinlik', definition: 'yaltiroqlik' },
      { word: 'mehmon', definition: 'vaqtincha keladigan' },
    ]),
  L('e58', 'Ishni yaxshi bajarish uchun uni sevish shartmi?',
    `Ishni yaxshi bajarish uchun uni doim sevish shart emas, deb oʻylayman. Professionalizm baʼzan ishtiyoqdan mustaqil ishlaydi. Shifokor charchasa ham, meʼyor saqlaydi. Haydovchi kayfiyati yomon boʻlsa ham, eʼtiborli boʻladi. Ishlash sifati — ichki otashbozlik emas, qabul qilingan standart.

Albatta, ishtiyoq yordam beradi. U charchoqni yengillashtiradi va ijodni oshiradi. Lekin faqat ishtiyoqqa tayanadigan jamoalar xavfli: motivatsion nutq ketganda natija ham ketadi. Yaxshi hunar — kayfiyatga qaramay ishlash.

Men oʻz ishimni baʼzan sevaman, baʼzan shunchaki bajaraman. Muhimi — vaʼdani buzmaslik. Mijozga sifat kerak, mening bugungi kayfiyatim emas. Agar ishni umuman yomon koʻrsangiz, oʻzgartirish haqida oʻylang. Lekin «har daqiqa romantika» kutish — notoʻgʻri meʼyor. Professionalizm tinch, barqaror va ishonchlidir.`,
    [
      { word: 'professionalizm', definition: 'kasbiy javobgarlik' },
      { word: 'ishtiyoq', definition: 'kuchli sevgi' },
      { word: 'meʼyor', definition: 'sifat standarti' },
      { word: 'natija', definition: 'ish chiqishi' },
      { word: 'motivatsion', definition: 'undovchi' },
      { word: 'hunar', definition: 'kasb mahorati' },
      { word: 'standart', definition: 'talab' },
      { word: 'charchoq', definition: 'holdan toyish' },
      { word: 'mijoz', definition: 'xizmat oluvchi' },
      { word: 'vaʼda', definition: 'berilgan soʻz' },
      { word: 'barqaror', definition: 'oʻzgarmas' },
      { word: 'ishonchli', definition: 'ishonchli' },
    ]),
  L('e59', 'Qoʻshimcha javobgarlikni qanday soʻraysiz?',
    `A: Qoʻshimcha javobgarlikni qanday soʻraysiz?
B: Avvalo hozirgi ishni aniq bajaraman. Keyin rahbarga qisqa xabar yozaman: nima qilayotganim, nima qoʻshishim mumkin.
A: Bu shuhratparastlikdek koʻrinmaydimi?
B: Agar niyat rost boʻlsa — yoʻq. Ambitsiya yashirinmasligi kerak, lekin ustuvorlikni buzmasligi kerak.
A: Birinchi qadam nima?
B: Yangi xodimni kuzatish yoki soya boʻlib yurishni soʻrang. Onboarding jarayonida yordam berish — yaxshi start.
A: Rad etishsa-chi?
B: Aniq sabab soʻrang. Baʼzan vaqt masalasi. Keyinroq qayting.
A: Nima demayman?
B: «Menga zerikarli» demang. «Koʻproq foyda keltirmoqchiman» deng. Javobgarlik — ovoz balandligi emas, ishonch.`,
    [
      { word: 'javobgarlik', definition: 'masʼuliyat' },
      { word: 'onboarding', definition: 'yangi xodimni joriy etish' },
      { word: 'aniq', definition: 'toʻgʻri' },
      { word: 'ustuvorlik', definition: 'muhim ish' },
      { word: 'soya', definition: 'kuzatib yurish' },
      { word: 'ambitsiya', definition: 'oʻsish istagi' },
      { word: 'rahbar', definition: 'boshliq' },
      { word: 'niyat', definition: 'maqsad' },
      { word: 'rost', definition: 'chin' },
      { word: 'foyda', definition: 'yordam' },
      { word: 'ishonch', definition: 'ishonch' },
      { word: 'rad', definition: 'yoʻq javob' },
    ]),
  L('e60', 'Reja buzilsa nima qilasiz?',
    `Rejam birinchi marta jiddiy buzilganda, loyiham rad etildi. Bir hafta ish qulagandek tuyuldi. Portfelimdagi eng yaxshi ish «yetarli emas» deyildi. Avval hafsalam pir boʻldi, keyin fikr-mulohazani oʻqidim.

Muhimi — darhol yangi versiya yozish emas edi. Avvalo bir kecha «yoʻqotish»ga ruxsat berdim. Keyin inventarizatsiya qildim: nima ishladi, nima zaif edi, nima keyingi qadam. Rad etish oxiri emas; u yoʻnalish.

Endi reja tuzsam, zaxira yoʻl qoʻyaman. Agar A ishlamasa, B bor. Portfelni yangilayman, fikr-mulohazani yozib qoʻyaman, qayta topshiraman. Hafsalasizlik vaqtinchalik; harakat davomiy. Reja buzilsa, men roʻyxat ochaman — emosiyani emas, keyingi uchta ishni.`,
    [
      { word: 'rad etildi', definition: 'qabul qilinmadi' },
      { word: 'qulagan', definition: 'buzilgan' },
      { word: 'portfel', definition: 'ish namunalari toʻplami' },
      { word: 'fikr-mulohaza', definition: 'baho va izoh' },
      { word: 'hafsala', definition: 'kayfiyat' },
      { word: 'inventarizatsiya', definition: 'roʻyxatga olish' },
      { word: 'zaxira', definition: 'qoʻshimcha reja' },
      { word: 'versiya', definition: 'nusxa' },
      { word: 'yoʻnalish', definition: 'yoʻl' },
      { word: 'davomiy', definition: 'toʻxtamas' },
      { word: 'emosiya', definition: 'his' },
      { word: 'topshiraman', definition: 'yuboraman' },
    ]),
  L('e61', 'Oxirgi piyoda sayohatingizda nima koʻrdingiz?',
    `Oxirgi piyoda sayohatimda ertalabki tuman ichida daraxtlar yoʻqolgandek edi. Keyin quyosh chiqib, soyalar naqsh chizdi. Yoʻlda mayda toshlar oyoq ostida qarsillardi. Tepaga chiqish oson, pastga tushish esa tizzani sinadi.

Choʻqqida telefon bildirishnomasini oʻchirdim. Bir soat hech kim yozmadi — yoki yozdi, lekin men bilmadim. Bu jimlik boshni yuvgandek edi. Qaytayotganda soyada oʻtirdim, suv ichdim, etikdagi changni yuvib tashladim.

Tabiatda koʻrganlarim katta emas edi: qush, tosh, uzoq vodiy. Lekin shahar shovqinidan keyin ular yetarli edi. Endi sayohatdan oldin xarita va suv tekshiraman, choʻqqida esa ekranni unutaman. Eng yaxshi manzara baʼzan bildirishnomasiz ochiladi.`,
    [
      { word: 'yoʻqolgandek', definition: 'gʻoyib boʻlgandek' },
      { word: 'naqsh', definition: 'chizma' },
      { word: 'qarsillardi', definition: 'ovoz chiqarardi' },
      { word: 'tushish', definition: 'pasayish' },
      { word: 'yuvib', definition: 'tozalab' },
      { word: 'bildirishnoma', definition: 'telefon xabari' },
      { word: 'jimlik', definition: 'sukut' },
      { word: 'soyada', definition: 'soya ichida' },
      { word: 'choʻqqi', definition: 'eng yuqori nuqta' },
      { word: 'etik', definition: 'oyoq kiyim' },
      { word: 'vodiy', definition: 'togʻ orasidagi pastlik' },
      { word: 'xarita', definition: 'yoʻl chizmasi' },
    ]),
  L('e62', 'Yomgʻirda lager qurganmisiz?',
    `Bir marta doʻstlarim bilan yomgʻirda lager qurdik. Palatkamiz «suv oʻtkazmaydi» deyilgan edi; biz optimistik edik. Yarim tunda suv tikuvlardan oqib kirdi. Kimdir «bu yerda hech qachon yomgʻir yogʻmaydi» degan mish-mish aytgan edi — yolgʻon chiqdi.

Tarpaulinni ustiga tortib, sumkalarni markazga yigʻdik. Tongda oyoq izlari loyga botgan edi, lekin kulgi qurigan edi. Choy qaynatdik, hoʻl paypoqlarni osdik, rejani oʻzgartirdik: uzoq yoʻl emas, yaqin sharshara.

Yomgʻirdagi lager noqulay, lekin esda qolarli. Endi ob-havo prognozini ikki marta oʻqiyman va zaxira yopinchiq olib yuraman. Optimizm yaxshi; tayyorgarlik yaxshiroq.`,
    [
      { word: 'suv oʻtkazmaydi', definition: 'suv kirimaydi' },
      { word: 'optimistik', definition: 'iyatli' },
      { word: 'tikuv', definition: 'tikilgan chiziq' },
      { word: 'mish-mish', definition: 'ishonchsiz gap' },
      { word: 'tarpaulin', definition: 'suvdan himoya qiluvchi mato' },
      { word: 'oyoq izi', definition: 'bosilgan iz' },
      { word: 'loy', definition: 'nam tuproq' },
      { word: 'yopinchiq', definition: 'ustiga yopiladigan narsa' },
      { word: 'prognoz', definition: 'ob-havo bashorati' },
      { word: 'palatka', definition: 'lager uyi' },
      { word: 'zaxira', definition: 'qoʻshimcha' },
      { word: 'noqulay', definition: 'qiyin' },
    ]),
  L('e63', 'Nega parklar shaharni yaxshilaydi?',
    `Parklar shaharni yaxshilaydi, chunki ular shaharning oʻpkasidek ishlaydi. Beton orasida yashil yoʻlak boʻlsa, odamlar sekinlashadi, bolalar yuguradi, keksalar oʻtiradi. Shahar faqat ish joyi emas; u nafas olish joyi ham.

Adolat shu yerda koʻrinadi: park faqat boy mahallada boʻlsa, shahar meʼyorini notoʻgʻri qoʻygan boʻladi. Yaxshi shahar har bir tumanga yashil yoʻlak beradi. Men yangi binolar rejasini koʻrsam, avvalo soʻrayman: daraxt qayerda?

Park maqsadni ham oʻzgartiradi. Baʼzan «tezroq yetib bor» oʻrniga «shu yerda toʻxta» deydi. Bu kichik qayta koʻrib chiqish kundalik stressni kamaytiradi. Shahar oʻpkasi yoʻqolsa, hammamiz qisqa nafas olamiz. Shuning uchun park — bezak emas, zarurat.`,
    [
      { word: 'oʻpka', definition: 'nafas organiga oʻxshatma' },
      { word: 'shahar', definition: 'urban muhit' },
      { word: 'yoʻlak', definition: 'yashil yoʻl' },
      { word: 'adolat', definition: 'tenglik' },
      { word: 'qayta koʻrib', definition: 'qayta baholash' },
      { word: 'meʼyor', definition: 'standart' },
      { word: 'maqsad', definition: 'niyat' },
      { word: 'stress', definition: 'asabiylik' },
      { word: 'zarurat', definition: 'keraklilik' },
      { word: 'bezak', definition: 'faqat chiroy' },
      { word: 'tuman', definition: 'shahar qismi' },
      { word: 'nafas', definition: 'nafas olish' },
    ]),
  L('e64', 'Odamlar yovvoyi gullarni uzishi kerakmi?',
    `A: Odamlar yovvoyi gullarni uzishi kerakmi?
B: Koʻpincha yoʻq. Gul yonbagʻirda koʻpayishi uchun urugʻ qoldirish kerak.
A: Lekin bolalar uchun chiroyli sovgʻa-ku.
B: Chiroyli, lekin odat xavfli. Agar hamma uzsa, keyingi bahor boʻsh qoladi.
A: Unda nima qilish mumkin?
B: Suratga olish, chizish, yoki bogʻdan gul olish. Tabiatda tiyilish — hurmat.
A: Hech qachon mumkin emasmi?
B: Baʼzi joylarda ruxsat bor, lekin kam miqdorda. Avvalo belgini oʻqing.
A: Asosiy fikr?
B: Yovvoyi gul hammaga tegishli. Uni uzish — baʼzan oʻzini oʻylash; qoldirish — kelajakni oʻylash.`,
    [
      { word: 'yovvoyi gul', definition: 'oʻzi oʻsgan gul' },
      { word: 'koʻpayishi', definition: 'koʻpayib oʻsishi' },
      { word: 'yonbagʻir', definition: 'tepalik yon tomoni' },
      { word: 'urugʻ', definition: 'oʻsimlik urugʻi' },
      { word: 'odat', definition: 'urf' },
      { word: 'tiyilish', definition: 'oʻzini tiyish' },
      { word: 'belgi', definition: 'yoʻriq belgisi' },
      { word: 'ruxsat', definition: 'ijozat' },
      { word: 'hurmat', definition: 'ehtirom' },
      { word: 'miqdor', definition: 'son' },
      { word: 'bahor', definition: 'fasl' },
      { word: 'kelajak', definition: 'oldindagi vaqt' },
    ]),
  L('e65', 'Bilgan eng tinch joyingiz qayer?',
    `Bilgan eng tinch joyim — shahar chetidagi qamishli botqoq. Yoʻl loyli, lekin yogʻoch platforma bor. Ertalab u yerda baqalar jim, faqat baʼzan suv qimirlaydi. Bir kuni qoʻqonoq turganini koʻrdim; u sekin uchib ketdi, men esa nafas olishni unutgandek boʻldim.

Bu joyga telefonimni olib kiraman, lekin rejimni ovozsiz qilaman. Kislorod boshqa joydagidek, lekin miyam boshqacha ishlaydi. Shovqin yoʻqolgach, kichik tovushlar katta boʻladi: shamol, qush, uzoq poezd.

Tinch joy — qochish emas; u qayta sozlash. Men oyiga bir marta boraman, oʻn daqiqa oʻtiraman, qaytaman. Loy etikda qoladi, lekin boshimda yengillik qoladi. Agar shahar sizni siqsa, oʻz botqoqingizni toping — hatto kichik boʻlsa ham.`,
    [
      { word: 'qamish', definition: 'suv boʻyi oʻsimligi' },
      { word: 'botqoq', definition: 'nam, suvli yer' },
      { word: 'loyli', definition: 'loy bilan' },
      { word: 'platforma', definition: 'yogʻoch yoʻlak' },
      { word: 'qoʻqonoq', definition: 'uzun oyoqli qush' },
      { word: 'kislorod', definition: 'havodagi gaz' },
      { word: 'jim', definition: 'ovozsiz' },
      { word: 'rejim', definition: 'telefon holati' },
      { word: 'yengillik', definition: 'engil his' },
      { word: 'siqsa', definition: 'bosim bersa' },
      { word: 'sozlash', definition: 'moslashtirish' },
      { word: 'shamol', definition: 'havo harakati' },
    ]),
];
