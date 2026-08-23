/** Agent-authored UZ Elementary e6–e15 */
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
    'e6',
    'Sizni birinchi qaysi film hayajonga soldi?',
    `Meni chinakam hayajonga solgan birinchi film kichik dengizboʻyi shaharchasida yashovchi ikki opa-singil haqida edi. Oʻn besh yoshimda yomgʻirli yakshanba kuni tomosha qildim. Yengil hikoya kutgandim, lekin sokin sahnalar shovqinli joylardan kuchliroq taʼsir qildi. Biri ketmoqchi edi, ikkinchisi qolmoqchi. Ularning bahsi kinodagi nutq emas, haqiqiy oshxonadagi gaplarga oʻxshardi.

Oxiriga yaqin hech kim mukammal nutq aytmadi. Ular nam iskeleda turib, bir-birini yoʻqotishdan qoʻrqishlarini tan oldilar. Men oʻzimni hayratga solib yigʻladim. Keyin aqlliroq va mashhurroq filmlar koʻrdim, lekin shunchalik rostgoʻy tuyulganni kam uchratdim. Hikoyalar oddiy jasoratni koʻrsatganda yuramizni qoʻzgʻaydi.

Agar film faqat katta effekt ortidan quvsa, ikki soat koʻngil ochishi, lekin ichingizda hech narsa qoldirmasligi mumkin. Qoladigan filmlar koʻpincha sekinroq va kundalik hayotga yaqinroq. Oʻsha hissiy film menga kichik dialoglarga eʼtibor berishni oʻrgatdi. Baʼzan eng muhim gap deyarli pichirlab aytiladi. Shu hafta oddiy ish qilayotganimda — piyola yuvayotganda, avtobus kutayotganda — filmning bir tafsiloti yana qaytdi. Demak, chuqur his qildirgan hikoya faqat dars savoli emas; tinch daqiqalarda ham keladi.`,
    [
      { word: 'dengizboʻyi', definition: 'dengiz yonidagi' },
      { word: 'iskele', definition: 'suv ustiga chiqib turgan piyodalar yoʻli' },
      { word: 'tan oldilar', definition: 'haqiqatni ochiq aytdilar' },
      { word: 'oddiy', definition: 'maxsus emas; kundalik' },
      { word: 'effekt', definition: 'koʻzni qamashtiruvchi maxsus taʼsir' },
      { word: 'dialog', definition: 'qahramonlar orasidagi suhbat' },
      { word: 'pichirlab', definition: 'juda past ovozda' },
      { word: 'hissiy', definition: 'his-tuygʻuga boy' },
      { word: 'aqlliroq', definition: 'aqlli gʻoyalar bilan toʻla' },
      { word: 'rostgoʻy', definition: 'yolgʻonsiz, chin' },
      { word: 'bahs', definition: 'kelishmovchilik, munozara' },
      { word: 'koʻngil ochishi', definition: 'vaqtni qiziqarli oʻtkazishi' },
    ],
  ),
  L(
    'e7',
    'Hech qachon chinakam faxrlanganmisiz?',
    `Salom, Maya,

Shu hafta meni chinakam faxrga solgan voqeani aytmoqchi edim. Mart oyida boshlagan qisqa kursimni nihoyat tugatdim. Bir necha oy ishdan keyin charchoq bilan oʻqidim; baʼzi kechalar deyarli tashlab ketmoqchi boʻldim. Payshanba kuni yakuniy natija keldi — kutganimdan yaxshiroq chiqdi.

Faxr hissi internetdagi bayram fotosuratlaridan tinchroq edi. Choy damlab, deraza yonida oʻtirdim va sertifikatni ikki marta oʻqidim. Motivatsiya sovuq shoʻrvadek suyuq tuyulgan kechalarni esladim. Oson kechalardan koʻra shu ogʻir kechalarda kelib oʻtirish muhimroq edi.

Agar uzoq va sekin ishni boshlasangiz, sizni harakatda saqlaydigan kichik odatlarni asrang. Faxr faqat yutish emas. Baʼzan oʻzingizga bergan vaʼdani bajarishingizni isbotlashdir. Noliyotganimda meni ruhlantirganingiz uchun rahmat. Keyingi safar ogʻir ishni tugatsangiz, yozing — men ham sizni quvvatlab qoʻyay.

Oddiy kunlar ham hisobga kiradi: darsdan keyin oʻn daqiqa takrorlash, dam olishdan oldin bitta mashq. Shu kichik tartib meni yakunga olib keldi.

Lina`,
    [
      { word: 'chinakam', definition: 'haqiqiy, soxta emas' },
      { word: 'sertifikat', definition: 'kurs tugaganini koʻrsatuvchi hujjat' },
      { word: 'motivatsiya', definition: 'harakatga undovchi kuch' },
      { word: 'odat', definition: 'muntazam bajariladigan ish' },
      { word: 'tashlab ketmoqchi', definition: 'toʻxtatib qoʻymoqchi' },
      { word: 'ruhlantirganingiz', definition: 'dalda berganingiz' },
      { word: 'noliyotganimda', definition: 'shikoyat qilayotganimda' },
      { word: 'quvvatlab', definition: 'qoʻllab-quvvatlab' },
      { word: 'vaʼda', definition: 'bajarishga soʻz berish' },
      { word: 'isbotlash', definition: 'koʻrsatib tasdiqlash' },
      { word: 'natija', definition: 'oxirgi baho yoki yakun' },
      { word: 'bayram', definition: 'nishonlash, tantana' },
      { word: 'oddiy', definition: 'kundalik, maxsus emas' },
    ],
  ),
  L(
    'e8',
    'Oilasiz birinchi marta qachon sayohat qildingiz?',
    `Oilamizsiz birinchi sayohatimda ikki sinfdoshim bilan yaqin shaharga dam olish kuniga bordik. Poyezd odatdagidan tezroq tuyuldi — balki chiptani saqlashni hech kim eslatmagani uchundir. Hosteldagi xonani notanishlar bilan boʻlishdik; ular ohista xorillardi va yarim tunda pechenye taklif qilishdi. Mustaqillik arzon shampun va shahar yomgʻiri hididek edi.

Ikki marta yoʻldan adashdik, kechki ovqat haqida bir marta bahslashdik, shunday boʻlsa-da xavotirdan koʻra koʻproq kuldik. Ota-onasiz qaror sekinroq chiqardi, lekin qaror bizniki edi. Byudjetimiz kichik edi: arzon kafe, bepul park, bitta muzey. Shu chegara ichida ham yangi kashfiyot topdik — daryo boʻyidagi kitob doʻkoni.

Uyga qaytgach, oila qulayligini yanada qadrladim, lekin oʻzimni endi «mutaxassis» emas, tajribaliroq his qildim. Oilasiz sayohat sizni katta qilmaydi; u sizga oddiy tanlovlarni oʻzingiz qilishni oʻrgatadi. Keyingi safar byudjetni oldindan yozaman va kechki ovqatni oldindan kelishib olaman — shunda bahs kamayadi, zavq koʻpayadi.`,
    [
      { word: 'hostel', definition: 'arzon, umumiy xonali turar joy' },
      { word: 'xorillardi', definition: 'uxlab ovoz chiqarishardi' },
      { word: 'mustaqillik', definition: 'oʻzingiz qaror qilish erkinligi' },
      { word: 'byudjet', definition: 'sarflash uchun rejalangan pul' },
      { word: 'kashfiyot', definition: 'kutilmagan yangi topilma' },
      { word: 'adashdik', definition: 'yoʻldan chiqib qoldik' },
      { word: 'mutaxassis', definition: 'hamma narsani biladigan odam' },
      { word: 'oddiy', definition: 'kundalik, kichik' },
      { word: 'eslatmagani', definition: 'esga solmagani' },
      { word: 'bahslashdik', definition: 'kelisha olmay munozara qildik' },
      { word: 'qulaylik', definition: 'oson va tinch sharoit' },
      { word: 'dam olish kuni', definition: 'ish yoki maktabsiz dam kunlari' },
    ],
  ),
  L(
    'e9',
    'Birinchi suhbat-intervyuingiz qanday oʻtdi?',
    `A: Birinchi suhbat-intervyuingiz qanday oʻtdi?
B: Tushlarimdagi dahshatdan ham yomon, ayni paytda yaxshiroq. Erta bordim, keyin yorugʻ qabulxonada kutdim; har bir soat odatdagidan balandroq eshitilardi.
A: Nima soʻrashdi?
B: Avvalo jamoa loyihasi haqida soʻrashdi. Aniq tushuntirdim, lekin zaif tomonim haqidagi oddiy savolda xayolim boʻshab qoldi. Baʼzan ishimni ortiqcha tekshirishimni aytdim. Sukutdan xavfsizroq tuyuldi.
A: Ishga oldilarmi?
B: Yoʻq. Ikki kundan keyin xushmuomalalik bilan xat yozishdi. Shunday boʻlsa-da, suhbat-intervyu imtihon emas, suhbat ekanini tushundim. Roʻyxat emas, hikoyalar tayyorlash kerak.
A: Keyingi safar nima qilasiz?
B: Muvaffaqiyatsizlik haqida soʻrashsa, haqiqiy misol beraman va keyin nima oʻzgartirganimni aytaman. Shu hafta amakivachcham bilan ikki marta mashq qildik. Asab energiyasi foydali — agar uni vahima emas, tinglashga yoʻnaltirsangiz.
A: Hozir ham oʻylaysizmi?
B: Ha, ayniqsa oʻxshash vaziyat boshlanganda. Bir marta nafas olaman, keyin oʻn asabiy gap oʻrniga bitta aniq jumla tanlayman.
A: Yoshroq oʻquvchiga nima deysiz?
B: Ikki haqiqiy misol tayyorlang va ovoz chiqarib mashq qiling. Sukut xavfsiz tuyuladi, lekin qisqa rost javob ishonchni oshiradi.`,
    [
      { word: 'suhbat-intervyu', definition: 'ishga olish uchun suhbat' },
      { word: 'qabulxona', definition: 'kutish zali' },
      { word: 'zaif tomon', definition: 'kamchilik yoki qiyinchilik' },
      { word: 'sukut', definition: 'jimlik; hech narsa demaslik' },
      { word: 'muvaffaqiyatsizlik', definition: 'reja ishlamagan holat' },
      { word: 'vahima', definition: 'kuchli qoʻrquv' },
      { word: 'mashq', definition: 'takrorlab tayyorlanish' },
      { word: 'xushmuomalalik', definition: 'muloyim, odobli tarzda' },
      { word: 'yoʻnaltirsangiz', definition: 'maqsadga qaratib ishlatsangiz' },
      { word: 'energiya', definition: 'ichki kuch' },
      { word: 'imtihon', definition: 'bilimni tekshiruvchi sinov' },
      { word: 'keyin', definition: 'undan soʻng' },
      { word: 'ishonch', definition: 'oʻziga ishonish hissi' },
      { word: 'rost', definition: 'yolgʻon emas' },
    ],
  ),
  L(
    'e10',
    'Nega birinchi marta boshidan oʻtgan narsalar esda qoladi?',
    `Menimcha, birinchi marta boshidan oʻtgan narsalar esda qoladi, chunki miya yangilikni yorqin boʻyoqdek qabul qiladi. Hamma narsa notanish boʻlganda tafsilotlar yopishadi: sinfxona hidi, chamadon dastasining ogʻirligi, kimdir aytgan aniq gap. Keyingi tajribalar baxtliroq yoki muvaffaqiyatliroq boʻlishi mumkin, lekin ular yumshoqroq tuyuladi — chunki naqshni allaqachon bilamiz.

Birinchi marta xavf ham bor. Oxirini bilmaganingiz uchun diqqatingiz oʻtkirlashadi. Shu oʻtkir diqqat kuchliroq xotira yozadi. Men bir necha marta uy almashtirdim; eng aniq eslaganim birinchisi: boʻsh xona, yangi kalit, derazadan kelgan notanish shahar shovqini. Keyingi koʻchishlar tezroq oʻtdi, chunki tartib tanish edi.

Shuning uchun birinchi marta baʼzan noqulay boʻlsa-da, qimmatli boʻladi. Ular hayotingizda belgi qoʻyadi: «bundan oldin» va «bundan keyin». Chegara oʻtkazilgan joyda xotira ham kuchayadi. Endi yangi ishni boshlaganimda, birinchi kunning noqulayligini dushman emas, diqqatni oʻstiruvchi vosita deb bilaman. Oddiy odatlar keyin qulaylik beradi; birinchi kun esa yangilikning oʻzini oʻrgatadi.`,
    [
      { word: 'notanish', definition: 'avval koʻrilmagan, yangi' },
      { word: 'tafsilot', definition: 'kichik, aniq belgi' },
      { word: 'naqsh', definition: 'takrorlanadigan tartib' },
      { word: 'diqqat', definition: 'eʼtibor qaratish' },
      { word: 'belgi', definition: 'esda qoladigan nuqta' },
      { word: 'noqulay', definition: 'biroz qiynaydigan' },
      { word: 'chegara', definition: 'bir holatdan ikkinchisiga oʻtish chizigʻi' },
      { word: 'sovgʻa', definition: 'qimmatli narsa; mukofot emas' },
      { word: 'yangilik', definition: 'ilgari boʻlmagan narsa' },
      { word: 'odat', definition: 'muntazam ish' },
      { word: 'xotira', definition: 'esda qolgan narsa' },
      { word: 'yopishadi', definition: 'esda qolib ketadi' },
    ],
  ),
  L(
    'e11',
    'Sizga eng koʻp kim oʻrgatdi?',
    `Menga eng koʻp oʻrgatgan odam mashhur oʻqituvchi emas edi. Tong otmasdan kichik nonvoyxona ochadigan xolam edi. Oʻn olti yoshimda bir yoz u bilan ishladim. Boshqa kattalardan kam gapirardi, lekin har bir koʻrsatma aniq edi. «Ikki marta oʻlchagin,» derdi. «Bezashdan oldin tatib koʻr. Xamir notoʻgʻri tuyulsa, qoʻlingga ishon.»

U xatolarimni tuzatar, lekin meni behuda his qildirarmasdi. Shu muvozanat isteʼdoddandan ham kam uchraydi. Maktabda faktlarni tez oʻrganardim, lekin u sabr, vaqt hisobi va sifat standartini oʻrgatdi. Mijoz kutganidan kamroq berish mumkin emasligini aytdi. Bir kuni men shoshilib nonni erta pechdan oldim; u jim turib, keyin tinch ovoz bilan qayta qilishimni soʻradi.

Yillar oʻtdi, lekin uning ohangi hali ham ichimda. Qiyin ishda shoshilsam, «ikki marta oʻlchagin» deb eslayman. Eng yaxshi ustoz baʼzan dars beradi, baʼzan esa oʻzi ishlab koʻrsatadi. Xolamning nonvoyxonasi kichik edi, lekin u yerda oʻrganganlarim katta ishlarda ham ishlatiladi: sabr, aniqlik va yumshoq tuzatish.`,
    [
      { word: 'nonvoyxona', definition: 'non va pishiriq tayyorlanadigan joy' },
      { word: 'oʻlchagin', definition: 'miqdorni aniq belgilagin' },
      { word: 'xamir', definition: 'non uchun yumshoq massa' },
      { word: 'bezash', definition: 'chiroyli qilib bezatish' },
      { word: 'behuda', definition: 'foydasiz, qadrsiz' },
      { word: 'sabr', definition: 'kutish va tinch ishlash qobiliyati' },
      { word: 'kutilgan', definition: 'kutilgan daraja' },
      { word: 'standart', definition: 'sifat meʼyori' },
      { word: 'vaqt hisobi', definition: 'qachon nima qilishni bilish' },
      { word: 'tuzatar', definition: 'xatoni toʻgʻrilardi' },
      { word: 'isteʼdod', definition: 'tabiiy qobiliyat' },
      { word: 'ustoz', definition: 'yoʻl koʻrsatuvchi odam' },
    ],
  ),
  L(
    'e12',
    'Qoʻshnini nima maxsus qiladi?',
    `Karim xola binomizni kamroq yolgʻiz his qildirgan qoʻshni edi. Koridorning narigi tomonida yashardi va kimdir kasal yoki sumkalar bilan ogʻirlanganini sezardi. Bir qish kechasi qulfim muzlab, eshik ochilmadi. U issiq suvli choynak olib keldi, yonimda kutdi, keyin metall yumshaguncha meni shoʻrvaga chaqirdi.

Maxsus qoʻshni har doim eng yaqin doʻstingiz boʻlmaydi. Baʼzan u kundalik hayotni xavfsizroq qiladi. Karim xola tugʻilgan kunlarni ijtimoiy tarmoqqa qoʻymasdan eslar edi. Yoʻlovchi yoʻqligida gullarni sugʻorardi. Yarim tunda shovqin boʻlsa, avval janjal emas, yordam soʻrardi.

Mahalla shunday kichik ishlardan tuziladi. Agar yangi binoga koʻchsangiz, birinchi haftada qoʻshnilarga salom bering. Ismni eslang, bitta mayda yordam taklif qiling. Maxsus qoʻshni mukofot kutmaydi; u oddiy eʼtibor bilan ishonch quradi. Men endi oʻzim ham koridorda ogʻir sumka koʻrsam, eshikni ushlab turaman — Karim xola oʻrgatganidek.`,
    [
      { word: 'ogʻirlangan', definition: 'ortiqcha yuk koʻtargan' },
      { word: 'muzlab', definition: 'sovuqdan qotib qolgan' },
      { word: 'yumshagan', definition: 'qattiqligi kamaygan' },
      { word: 'mahalla', definition: 'yonma-yon yashovchilar jamoasi' },
      { word: 'ohista', definition: 'yumshoq, sekin' },
      { word: 'mahalliy', definition: 'shu joyga tegishli' },
      { word: 'koridor', definition: 'xonalar oldidagi yoʻlak' },
      { word: 'chaqirdi', definition: 'mehmonga taklif qildi' },
      { word: 'sezardi', definition: 'eʼtibor berib bilardi' },
      { word: 'xavfsizroq', definition: 'kamroq xavfli' },
      { word: 'yarim tun', definition: 'tunning oʻrtasi' },
      { word: 'bino', definition: 'koʻp xonadonli uy' },
    ],
  ),
  L(
    'e13',
    'Qattiqqoʻl oʻqituvchingiz boʻlganmi?',
    `A: Hasan aka yoqadimi?
B: «Yoqadi» notoʻgʻri soʻz. U men koʻrgan eng qattiqqoʻl oʻqituvchi edi. Uy vazifasini daqiqasiga yigʻardi va har bir mayda grammatika xatosini tuzatardi.
A: Bu dahshatdek eshitiladi.
B: Avvaliga ha. Lekin uning qattiqqoʻlligi koʻrinishidan adolatliroq edi. Yordam soʻrasangiz, darsdan keyin qolardi. Oʻquvchi biroz qiynalishi kerak, chunki qiynalish xotirani mustahkamlaydi, derdi.
A: Yumshoq oʻqituvchilar yaxshiroqmi?
B: Yumshoq oʻqituvchilar kundalikda mehribonroq boʻlishi mumkin. Qattiqqoʻl oʻqituvchilar esa baʼzan sizni qoʻrqitmasdan yuqori meʼyor qoʻyadi. Farq shundaki, adolat bormi-yoʻqmi.
A: Undan nima oldingiz?
B: Aniq daqiqada topshirish odati va xatosiz tayyorlanish. Endi ishda ham muddatni oʻtkazib yubormayman.
A: Yana uchrashsangiz nima deysiz?
B: «Oʻsha paytda gʻazablanganman, lekin maslahatingiz behuda ketmadi,» derdim. Qattiqqoʻllik baʼzan qattiq ovoz emas, qatʼiy meʼyor demakdir.`,
    [
      { word: 'qattiqqoʻl', definition: 'qatʼiy talab qoʻyadigan' },
      { word: 'xato', definition: 'kichik notoʻgʻrilik' },
      { word: 'qiynalish', definition: 'biroz qiyinchilik bilan ishlash' },
      { word: 'adolatli', definition: 'teng va toʻgʻri' },
      { word: 'harakat', definition: 'urinish, mehnat' },
      { word: 'qoʻrqitmasdan', definition: 'qoʻrquv uygʻotmasdan' },
      { word: 'aniq', definition: 'daqiqasiga mos' },
      { word: 'maslahat', definition: 'foydali yoʻl-yoʻriq' },
      { word: 'yigʻardi', definition: 'yigʻib olardi' },
      { word: 'tayyorlanish', definition: 'oldindan tayyor boʻlish' },
      { word: 'grammatika', definition: 'til qoidalari' },
      { word: 'behuda', definition: 'foydasiz' },
    ],
  ),
  L(
    'e14',
    'Ishlar chigalashganda kimga telefon qilasiz?',
    `Aziz Nora,

Oʻsha qiyin haftadan keyin holimni soʻraganingiz uchun rahmat. Ishlar chigalashganda odatda avvalo akamga telefon qilaman. U hamma tafsilotni darhol tuzatishga urinmaydi. Tinglaydi, bitta aniq savol beradi, keyin keyingi kichik qadamni tanlashga yordam beradi. Muammo amaliy boʻlsa, uyga kelishi mumkin. Hissiy boʻlsa, ovozim barqarorlashguncha telefonda qoladi.

Turli muammoga turli odam kerakligini ham oʻrgandim. Ish stressi uchun eski hamkasbimga yozaman. Sogʻliq xavotiri uchun onamga qoʻngʻiroq qilaman. Inqiroz hamma narsani birdaniga bitta odamdan kutish emas; ishonchli doiradan toʻgʻri odamni tanlashdir.

Agar sizda ham ogʻir kun boʻlsa, yozing. Men mukammal javob bermasligim mumkin, lekin tinglab, keyingi qadamni birga saralashga yordam beraman. Baʼzan eng muhimi shoshilinch yechim emas, yonida tinch odamning borligi.

Ishonchli qoʻllab-quvvatlash ogʻir yukni yengillashtiradi. Rahmat yana bir bor.

Doʻstingiz,
Samira`,
    [
      { word: 'amaliy', definition: 'qoʻlda hal qilinadigan' },
      { word: 'hissiy', definition: 'tuygʻuga bogʻliq' },
      { word: 'barqaror', definition: 'tinch va mustahkam' },
      { word: 'hamkasb', definition: 'birga ishlaydigan odam' },
      { word: 'inqiroz', definition: 'ogʻir, keskin vaziyat' },
      { word: 'shoshilinch', definition: 'darhol kerak boʻladigan' },
      { word: 'qoʻllab-quvvatlash', definition: 'yordam va dalda' },
      { word: 'ishonchli', definition: 'ishonch bildiradigan' },
      { word: 'saralash', definition: 'tartiblab tanlash' },
      { word: 'tafsilot', definition: 'mayda qism' },
      { word: 'chigalashganda', definition: 'muammo boʻlganda' },
      { word: 'ogʻir', definition: 'koʻtarish qiyin boʻlgan' },
    ],
  ),
  L(
    'e15',
    'Bobokalonlaringiz sizga nima oʻrgatgan?',
    `Bobokalonlarim hech qanday ilova oʻrnini bosa olmaydigan narsalarni oʻrgatgan. Bobom hovlidagi velosiped zanjirini taʼmirlashni koʻrsatgan. U hech qachon shoshilmasdi. «Asbobni majburlasang, asbob sinadi,» derdi. Buvim sovgʻa olgan kuniyoq minnatdorchilik xati yozishni oʻrgatgan. Minnatdorchilik tez yetishi kerak, deb hisoblardi.

Ularning saboqlari bir vaqtda amaliy va axloqiy edi. Bankalarni saqlashardi, sumkalarni qayta ishlatishardi, stullarni tashlash oʻrniga taʼmirlashardi. Avvaliga bu tejamkorlikdek tuyulardi; keyin aql ekanini tushundim. Yangisini sotib olish oson, lekin saqlashni bilish — boshqa mahorat.

Ular odobni ham oddiy ishlar orqali oʻrgatardi: eshikni ushlab turish, kechiksangiz qoʻngʻiroq qilish, konvertdagi manzilni aniq yozish. Bugun telefonim koʻp narsani eslatadi, lekin ularning odatlari hali ham ichimda. Qiyin ishda asbobni majburlashdan oldin toʻxtayman. Sovgʻa olsam, oʻsha kuni qisqa xabar yozaman. Bobokalonlarimning darsi oddiy edi, lekin rost edi: eʼtibor va amaliyot birga yursa, hayot mustahkamroq boʻladi.`,
    [
      { word: 'taʼmirlash', definition: 'buzilgan narsani tuzatish' },
      { word: 'hovli', definition: 'uy oldidagi ochiq joy' },
      { word: 'minnatdorchilik', definition: 'rahmat aytish hissi' },
      { word: 'axloqiy', definition: 'toʻgʻri-notoʻgʻri haqidagi' },
      { word: 'qayta ishlatish', definition: 'yana foydalanish' },
      { word: 'tuzatish', definition: 'ishlatiladigan holatga keltirish' },
      { word: 'aql', definition: 'aqlli yondashuv' },
      { word: 'odob', definition: 'xushmuomala qoidalar' },
      { word: 'konvert', definition: 'xat solinadigan qogʻoz quti' },
      { word: 'majburlasang', definition: 'zoʻrlab ishlatsang' },
      { word: 'odat', definition: 'muntazam ish' },
      { word: 'oddiy', definition: 'sodda, kundalik' },
      { word: 'rost', definition: 'haqiqiy' },
      { word: 'amaliyot', definition: 'takrorlab bajarish' },
    ],
  ),
];
