/** Agent-authored UZ Elementary e41–e50 */
function L(id, title, text, vocabulary) {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    id,
    title,
    text,
    vocabulary,
    targetSeconds: Math.max(45, Math.min(600, Math.round((w / 130) * 60))),
  };
}

export const lessons = [
  L(
    'e41',
    'Qaysi odatlar oʻzingizni yaxshi his qildiradi?',
    `Meni yaxshi his qildiradigan odatlar deyarli zerikarli — shuning uchun ishlaydi. Imkon boʻlsa yarim tundan oldin uxlayman, qahvadan oldin suv ichaman, tushlikdan keyin oʻn daqiqa yuraman. Bu odatlarning hech biri ijtimoiy tarmoqda hayratlanarli koʻrinmaydi. Birgalikda esa tushdan keyinni aniqroq, kechani yengilroq qiladi.

Avval dramatik oʻzgarishlarni sinab koʻrganman: toʻsatdan parhez, uzun sport zali rejasi, mukammal tong tartibi. Ular birinchi qiyin haftada quladi. Hozirgi odatlarim oddiyroq, shuning uchun saqlanib qoladi. Barqaror odat baʼzan sekin transformatsiya beradi — otashbozlik emas.

Kofeinni kechga surmayman, ishdan keyin biroz choʻzilaman, uxlashdan oldin telefonni uzoq varaqlamayman. Shu naqsh energiyamni kamaytirishni toʻxtatadi. Maxsus jihoz shart emas; amaliy qadam yetarli. Agar oʻzingizni yomon his qilsangiz, katta vaʼda emas, kichik odatni tanlang va uch hafta ushlang.`,
    [
      { word: 'hayratlanarli', definition: 'koʻzni qamashtiradigan' },
      { word: 'quladi', definition: 'buzilib ketadi' },
      { word: 'saqlanib', definition: 'davom etib' },
      { word: 'barqaror', definition: 'uzoq davom etadigan' },
      { word: 'transformatsiya', definition: 'oʻzgarish' },
      { word: 'kofein', definition: 'qahvadagi faol modda' },
      { word: 'choʻzilaman', definition: 'mushaklarni choʻzaman' },
      { word: 'varaqlamayman', definition: 'ekranni varaqlab yurmayman' },
      { word: 'kamaytirish', definition: 'quvvatni tortib olish' },
      { word: 'naqsh', definition: 'takrorlanuvchi tartib' },
      { word: 'jihoz', definition: 'asbob-uskuna' },
      { word: 'amaliy', definition: 'amalda ishlaydigan' },
    ],
  ),
  L(
    'e42',
    'Charchaganingizda ham sport qilish kerakmi?',
    `A: Yomon uxladim. Yana yugurishga boraymi?
B: Holatga bogʻliq. Agar faqat biroz charchagan boʻlsangiz, ogʻir yugurishdan koʻra yumshoq sayr koʻproq yordam beradi.
A: Murabbiyim intizom muhim deydi.
B: Intizom tanangizni tinglashni ham oʻz ichiga oladi. Mashq qilishingiz kerak, lekin tiklanish ham kerak. Chuqur charchoqni zoʻrlab oʻtsangiz, jarohat olishingiz mumkin.
A: Demak, dam olish dangasalik emasmi?
B: Har doim emas. Strategik dam keyingi hafta mashqini yaxshilashi mumkin. Kayfiyat ham signal: baʼzan oʻn daqiqa choʻzilish boshni ochadi.
A: Qachon qatʼiy turaman?
B: Agar charchoq bahona boʻlsa. Lekin haqiqiy holdan toyishni eʼtiborsiz qoldirmang. Rost javob: bugun tanangiz nima deyapti?
B: Fitness qatʼiylik emas, aqlli tanlovlar ketma-ketligidir. Ishonch shundan keladi.`,
    [
      { word: 'intizom', definition: 'reja va qoidaga rioya' },
      { word: 'tiklanish', definition: 'kuch yigʻish' },
      { word: 'charchoq', definition: 'holdan toyish' },
      { word: 'jarohat', definition: 'shikast' },
      { word: 'dangasalik', definition: 'ishlamaslik' },
      { word: 'strategik', definition: 'maqasadli' },
      { word: 'fitness', definition: 'jismoniy tayyorgarlik' },
      { word: 'qatʼiy', definition: 'oʻjar' },
      { word: 'yumshoq', definition: 'engil' },
      { word: 'zoʻrlab', definition: 'majburan oʻtmoq' },
      { word: 'kayfiyat', definition: 'hissiy holat' },
      { word: 'choʻzilish', definition: 'mushak mashqi' },
      { word: 'ishonch', definition: 'oʻziga ishonish' },
      { word: 'rost', definition: 'haqiqiy' },
    ],
  ),
  L(
    'e43',
    'Shamollashni uzoq eʼtiborsiz qoldirganmisiz?',
    `Oʻtgan qish ish shoshilinch tuyulgani uchun shamollashni uzoq eʼtiborsiz qoldirdim. «Faqat tomoq ogʻriyapti», dedim. Keyin tomoq isitmani chaqirdi, isitma esa uchta uchrashuvni bekor qildi. Dam olganimda tuzalish birinchi kundayoq toʻxtaganimdan uzoqroq davom etdi. Magʻrurlik qimmat dori ekan.

Endi erta belgilarni noqulaylik emas, xabar deb bilaman. Shamollash har doim shifokorga muhtoj emas, lekin dam, suv va uyquga muhtoj. Qahramonlik koʻrinish uchun yoʻtalib ishlash emas. Baʼzan eng aqlli ish — yoʻqlik: bir kun tinch uyda qolish.

Oldini olish ham oddiy: qoʻl yuvish, uyqu, dori emas, asosiy zaxira. Endi majburlab ishlashdan oldin toʻxtayman. Agar belgilar kuchaysa, rejamni qisqartiraman. Oddiy qoida: tanangiz birinchi ogohlantirganda tinglang.`,
    [
      { word: 'eʼtiborsiz', definition: 'eʼtibor bermaslik' },
      { word: 'shoshilinch', definition: 'kechiktirmaslik kerak' },
      { word: 'isitma', definition: 'tana harorati koʻtarilishi' },
      { word: 'tuzalish', definition: 'sogʻayish' },
      { word: 'belgi', definition: 'kasallik ishorasi' },
      { word: 'noqulaylik', definition: 'noqulay holat' },
      { word: 'qahramonlik', definition: 'oʻzini jasur koʻrsatish' },
      { word: 'yoʻqlik', definition: 'ishda boʻlmaslik' },
      { word: 'oldini olish', definition: 'kasallikni toʻsish' },
      { word: 'zaxira', definition: 'kerakli narsalar' },
      { word: 'yoʻtalib', definition: 'yoʻtal bilan' },
      { word: 'majburlab', definition: 'zoʻrlab' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e44',
    'Nega uyqu koʻrinishidan qiyinroq?',
    `Uyqu oddiy koʻrinadi — toki uni himoya qilishga urinmaguningizcha. Ekranlar aqldan kechroq yonadi. Xavotirlar hali boʻlmagan suhbatlarni mashq qildiradi. Tushdan keyingi qahva tanada tan olganimizdan uzoqroq qoladi. Sport maslahati bilan solishtirganda uyqu maslahati tinchroq, lekin koʻpchilikka u kerakroq.

Telefonni boshqa xonaga qoʻyib, qogʻoz kitobdan oʻn sahifa oʻqisam, yaxshiroq uxlayman. Bu odat aytishdan qiyinroq, chunki kechki «yana bir qism» ilgagi kuchli. Uyqu qarziga foiz bor: kech qolgan soat ertalab ogʻirroq qaytadi.

Men uchrashuvlarni ertalabga toʻplashga harakat qilaman va kechki gadjetni cheklayman. Bu kelishuv: oʻyin-kulgi oʻrniga tinchlik. Baʼzan eng yaxshi reja yangi asbob emas; u himoya qilingan qorongʻulikdir. Uyqu — ishning dushmani emas, uning asosidir.`,
    [
      { word: 'yonadi', definition: 'yorugʻlik beradi' },
      { word: 'mashq qildiradi', definition: 'qayta-qayta oʻylatadi' },
      { word: 'tan olganimizdan', definition: 'eʼtirof etganimizdan' },
      { word: 'aylana', definition: 'takrorlanuvchi sikl' },
      { word: 'qarz', definition: 'qarzga oʻxshash yetishmovchilik' },
      { word: 'foiz', definition: 'qoʻshimcha ogʻirlik' },
      { word: 'uchrashuv', definition: 'belgilangan uchrashuv' },
      { word: 'gadjet', definition: 'telefon kabi qurilma' },
      { word: 'kelishuv', definition: 'kelishib olish' },
      { word: 'qism', definition: 'serial qismi' },
      { word: 'aql', definition: 'donolik' },
      { word: 'himoya', definition: 'asrash' },
    ],
  ),
  L(
    'e45',
    'Stress boʻlganda nima qilasiz?',
    `Aziz Aleks,

Haftangiz ogʻir oʻtganiga afsusdaman. Stress boʻlganda hamma narsani yechishdan oldin uchta kichik ish qilaman. Avvalo, ob-havo xira boʻlsa ham, besh daqiqaga tashqariga chiqaman. Toza havo fikrlarimning balandligini pasaytiradi. Ikkinchisi — muammoni bir jumlada yozaman, shunda u aylanib turishni toʻxtatadi. Uchinchisi — yolgʻiz koʻtarmasdan, ishonchli odamga yozaman.

Agar stress vazifalar koʻpligidan kelsa, mukammallikni yecha boshlashingiz kerak. Hamma narsa sayqallangan boʻlishi shart emas. Bajariladigan ketma-ketlik tuzing: bugun uchta, ertaga uchta. Baholovchi ovoz ichingizda baqirsa, unga «hozir reja kerak, hukm emas» deng.

Stressni yolgʻiz koʻtarish baʼzan jasorat kabi koʻrinadi; aslida u niqob. Baham koʻrilgan ogʻirlik yengilroq. Rost ayting: nima ogʻir? Keyin amaliyot: bitta kichik qadam.

Doʻstingiz,
Mila`,
    [
      { word: 'xira', definition: 'bulutli, zerikarli' },
      { word: 'balandlik', definition: 'ovoz kuchi' },
      { word: 'aylanib', definition: 'aylanib turish' },
      { word: 'ishonchli', definition: 'ishonch bildiradigan' },
      { word: 'mukammallik', definition: 'xatosizlikka intilish' },
      { word: 'niqob', definition: 'yashirinish' },
      { word: 'bajariladigan', definition: 'uddalash mumkin' },
      { word: 'ketma-ketlik', definition: 'tartib' },
      { word: 'sayqallangan', definition: 'mukammal koʻrinadigan' },
      { word: 'baholovchi', definition: 'hukm qiluvchi' },
      { word: 'pasaytiradi', definition: 'pasaytiradi' },
      { word: 'baham', definition: 'birga koʻtarilgan' },
      { word: 'rost', definition: 'haqiqat' },
      { word: 'amaliyot', definition: 'amal' },
    ],
  ),
  L(
    'e46',
    'Har doim likopchani boʻshatish shartmi?',
    `A: Ammam likopchani boʻshatmasam xafa boʻladi.
B: Bu bosim keng tarqalgan, lekin har doim foydali emas. Eski qoidalardan koʻra ochlikni tinglash kerak.
A: U ovqatni isrof qilish yomon deydi.
B: Isrof muhim, lekin toʻyganingizdan keyin zoʻrlash ham yomon odat oʻrgatadi. Aybdorlikdan koʻra yaxshi reja yordam beradi. Meʼyor katta boʻlsa, mezbon boshida kamroq qoʻyishi mumkin.
A: Muloyim nima deyaman?
B: «Rahmat, juda mazali edi, lekin toʻydim,» deb koʻring. Keyin aniq maqtov qoʻshing — shoʻrva ajoyib edi.
A: Tanadagi noqulaylik signalmi?
B: Ha. Signalni eʼtiborsiz qoldirish keyin qiyinroq. Minnatdorchilik majburiy toʻla likopcha demak emas.

Odob — zoʻrlash emas, tinglash va rahmat aytish.`,
    [
      { word: 'bosim', definition: 'majburlash kuchi' },
      { word: 'ochlik', definition: 'yemoq kerakligi' },
      { word: 'isrof', definition: 'behuda tashlash' },
      { word: 'toʻygan', definition: 'toʻyib qolgan' },
      { word: 'aybdorlik', definition: 'gunoh hissi' },
      { word: 'meʼyor', definition: 'miqdor' },
      { word: 'noqulaylik', definition: 'yomon his' },
      { word: 'signal', definition: 'ishora' },
      { word: 'minnatdorchilik', definition: 'rahmat' },
      { word: 'zoʻrlash', definition: 'majburan yedirish' },
      { word: 'muloyim', definition: 'odobli' },
      { word: 'maqtov', definition: 'yaxshi soʻz' },
    ],
  ),
  L(
    'e47',
    'Sogʻlomroq tartibni sinab koʻrganmisiz?',
    `Martda kech qolgan tunlar va oʻtkazib yuborilgan nonushtalardan keyin sogʻlomroq tartibni sinadim. Hamma narsani birdan oʻzgartirmadim. Uchta maqsad qoʻydim: soat oʻn bird uxlamoq, har kuni yigirma daqiqa yurmoq, haftada toʻrt marta oddiy kechki ovqat pishirmoq. Birinchi ikki hafta noqulay oʻtdi — yangi oyoq kiyimdekgina.

Baʼzi kunlar muvaffaqiyatsiz boʻldi. Uzoq yigʻilishdan keyin tayyor ovqat buyurtma qildim va oʻzimdan norozi boʻldim. Keyin esladim: tartiblar qahramonlikdan emas, izchillikdan yashaydi. Intensivlik birinchi haftada yoqimli; izchillik bosh ogʻrigʻini kamaytiradi.

Bir oydan keyin kunlarim barqarorroq tuyuldi. Uyqu yaxshilandi, kiyim biroz bemalolroq oʻtirdi, kayfiyat tinchroq edi. Taraqqiyot sekin edi, lekin sezilardi. Endi «mukammal hafta» emas, «yaxshi yetarli hafta»ni maqsad qilaman. Sogʻlom tartib shovqinli emas — u moslashadi va qaytadi.`,
    [
      { word: 'tartib', definition: 'kundalik reja' },
      { word: 'ikki hafta', definition: 'oʻn toʻrt kun' },
      { word: 'tayyor ovqat', definition: 'tashqaridan buyurtma' },
      { word: 'izchillik', definition: 'muntazamlik' },
      { word: 'intensivlik', definition: 'juda kuchli urinish' },
      { word: 'qahramonlik', definition: 'haddan tashqari jasorat' },
      { word: 'bosh ogʻrigʻi', definition: 'bosh ogʻrishi' },
      { word: 'barqarorroq', definition: 'barqarorroq' },
      { word: 'noqulay', definition: 'begona tuyuladigan' },
      { word: 'oʻtkazib yuborilgan', definition: 'qilinmagan' },
      { word: 'oʻtirdi', definition: 'mos keldi' },
      { word: 'taraqqiyot', definition: 'oldinga siljish' },
    ],
  ),
  L(
    'e48',
    'Qachon shifokorga murojaat qilish kerak?',
    `A: Bir haftadan beri yoʻtalayapman. Qachon shifokorga boray?
B: Yengil va yaxshilanayotgan boʻlsa, dam yetishi mumkin. Isitma, koʻkrak ogʻrigʻi yoki nafas qisqarishi boʻlsa, uchrashuv yozing.
A: Kichik narsa uchun klinikani bezovta qilishni yoqtirmayman.
B: Shifokorlar kechki favqulodda holatdan erta tashrifni afzal koʻradi. Ogohlantiruvchi belgilarni eʼtiborsiz qoldirmang. Belgilar bir necha kundan keyin oʻzgarmasa, mutaxassis fikri taxminni tinchlantiradi.
A: Uyda nima kuzatay?
B: Harorat, yoʻtal, zaiflik. Yomonlashsa, kutmang. Ishonchingiz «men chidayman» emas, «men tekshiraman» boʻlsin.
A: Rostmi — erta bormoq yaxshimi?
B: Ha. Rost savol uyat emas. Sogʻliq taxmin ishi emas.`,
    [
      { word: 'yengil', definition: 'ogʻir emas' },
      { word: 'klinika', definition: 'davolash joyi' },
      { word: 'favqulodda', definition: 'shoshilinch holat' },
      { word: 'belgi', definition: 'kasallik ishorasi' },
      { word: 'taxmin', definition: 'taxminiy bilish' },
      { word: 'kuzatay', definition: 'eʼtibor bilan qaray' },
      { word: 'yomonlashsa', definition: 'ogʻirlashsa' },
      { word: 'mutaxassis', definition: 'malakali shifokor' },
      { word: 'uchrashuv', definition: 'qabul vaqti' },
      { word: 'koʻkrak', definition: 'koʻkrak qafasi' },
      { word: 'nafas', definition: 'nafas olish' },
      { word: 'zaiflik', definition: 'kuchsizlik' },
      { word: 'ishonch', definition: 'oʻziga ishonish' },
      { word: 'rost', definition: 'haqiqat' },
    ],
  ),
  L(
    'e49',
    'Nega qisqa sayrlar shunchalik yordam beradi?',
    `Qisqa sayrlar uzunligidan koʻra koʻproq yordam beradi. Tashqarida oʻn daqiqa keskin tushdan keyinni yana bir piyola qahvadan yaxshiroq yumshatishi mumkin. Harakat tanani uygʻotadi; kunduzgi yorugʻlik kayfiyatni moslashtiradi; manzara yopishqoq fikrlarni toʻxtatadi. Eng yaqin bekatni kutish oʻrniga keyingi bekatgacha yura boshladim — kunlarim kamroq siqilgandek boʻldi.

Sport zali mashgʻulotidan farqli oʻlaroq, qisqa sayr kamroq jasorat va kamroq jihoz soʻraydi. U nazariy emas: ovqat hazmiga, boshni ochishga, oddiy yoʻlakda havo olishga yordam beradi. Katta maqsadlar baʼzan qadoqlangan vaʼda kabi tuyuladi; qisqa sayr esa darhol ishlaydi.

Men endi uchrashuvlar orasida besh daqiqalik aylana yoʻl qoʻyaman. Bu ambitsiyali reja emas — amaliy odat. Oddiy qadamlar baʼzan eng kuchli dori.`,
    [
      { word: 'yumshatishi', definition: 'yumshoq qilishi' },
      { word: 'keskin', definition: 'tarang' },
      { word: 'manzara', definition: 'koʻrinadigan joy' },
      { word: 'yopishqoq', definition: 'ketmaydigan' },
      { word: 'siqilgan', definition: 'bosim ostida' },
      { word: 'nazariy', definition: 'faqat gʻoya' },
      { word: 'hazm', definition: 'ovqat hazm qilish' },
      { word: 'qadoqlangan', definition: 'chiroyli oʻralgan' },
      { word: 'yoʻlak', definition: 'piyodalar yoʻli' },
      { word: 'ambitsiyali', definition: 'katta maqsadli' },
      { word: 'toʻxtatadi', definition: 'boʻladi' },
      { word: 'kunduzgi', definition: 'kun yorugʻligi' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e50',
    'Eng qiyin saqlanadigan odat qaysi?',
    `Menga eng qiyin saqlanadigan odat — vaqtida uxlash. Sabzavot pishira olaman, suv idishini toʻldira olaman, ishdan keyin choʻzila olaman. Keyin tun keladi va telefon magnitga aylanadi. Bitta video oʻn ikkitaga aylanadi. Birdan rejamdan kech boʻladi va ertaga allaqachon charchoq hidini beradi.

Qattiq qoidalar va yumshoq maqsadlarni sinadim. Eng koʻp yordam beradigan narsa — muhitni oʻzgartirish: zaryadlovchini oshxonada qoldirish, yostiqqa kitob qoʻyish, tinchlanish vaqti uchun signal. Agar faqat irodaga tayanilsa, odatlar tez-tez buziladi. Dizayn nutqdan kuchliroq. Shunday boʻlsa-da, baʼzi kechalar tizimni buzaman va ertasi kuni dramatik aybdorliksiz qayta boshlayman.

Odat muhim boʻlsa, qayta tushishni kutib, qaytishni rejalang. Sogʻlomlashish toʻgʻri chiziq emas. U qayta qarorlar ketma-ketligi. Eng qiyin odatlar zaif daqiqada nima qadrlashimizni ochib beradi. Men uchun dam qimmatli — toki koʻngilochar narsa balandroq boʻlguncha. Shu ziddiyatni rost nomlash — yaxshi tun sari birinchi qadam.`,
    [
      { word: 'magnit', definition: 'oʻziga tortadigan narsa' },
      { word: 'muhit', definition: 'atrofdagi sharoit' },
      { word: 'iroda', definition: 'oʻzini tiyish kuchi' },
      { word: 'tinchlanish', definition: 'uxlashdan oldin tinchlanish' },
      { word: 'qayta tushish', definition: 'eski odatga qaytish' },
      { word: 'qayta qaror', definition: 'yana qaror qilish' },
      { word: 'ziddiyat', definition: 'ichki kurash' },
      { word: 'ochib beradi', definition: 'koʻrsatadi' },
      { word: 'aybdorlik', definition: 'gunoh hissi' },
      { word: 'zaryadlovchi', definition: 'batareyaga quvvat beradigan asbob' },
      { word: 'qattiq', definition: 'qatʼiy' },
      { word: 'koʻngilochar', definition: 'koʻngil ochadigan narsa' },
    ],
  ),
];
