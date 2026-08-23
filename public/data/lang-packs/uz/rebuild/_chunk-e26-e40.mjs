/** Agent-authored UZ Elementary e26–e40 */
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
    'e26',
    'Yashirin kafe topganmisiz?',
    `Odatda eʼtibor bermaydigan koʻchadagi gul doʻkoni orqasida yashirin kafe topdim. Doʻstim bir marta deyarli sirdek tilga olgan edi. Oʻtgan shanba nihoyat bordim. Kirish ombor eshigidek koʻrinardi; ochganimda yogʻoch stolli, yumshoq jazzli tor xona chiqdi. Qahva odatdagi buyurtmamdan kuchliroq, limonli pirog esa uyda pishirilgandek edi.

Joyni maxsus qilgan narsa hashamat emas edi. Eʼtibor edi. Barista ismimni soʻramadi, lekin charchoqimni sezib, suvni avvalo qoʻydi. Stolim yonidagi kitob javoni «oʻqing, qaytarib qoʻying» deb yozilgan edi. Choʻntakdagi telefonni pastga qoʻydim va oʻn daqiqa hech narsani quvmadim.

Yashirin joylar baʼzan reklama emas, tavsiya bilan yashaydi. Agar doʻstingiz tinch kafeni aytsa, boring — lekin uni shovqinli joyga aylantirmang. Men endi yon koʻchalarga koʻproq qarayman. Baʼzan eng yaxshi choy taklif qilmaydi; u sizni sekinlashishga chaqiradi. Uyda pishirilgan taʼm shundan keladi: shoshilmaslik va chin yurakdan qilingan ish.`,
    [
      { word: 'yashirin', definition: 'osongina koʻrinmaydigan' },
      { word: 'ombor', definition: 'narsa saqlanadigan joy' },
      { word: 'hashamat', definition: 'qimmat va dabdabali narsa' },
      { word: 'barista', definition: 'qahva tayyorlovchi' },
      { word: 'choʻntak', definition: 'kiyimdagi kichik boʻshliq' },
      { word: 'tavsiya', definition: 'boshqaga aytib berish' },
      { word: 'istak', definition: 'xohlash' },
      { word: 'uyda pishirilgan', definition: 'uy sharoitida tayyorlangan' },
      { word: 'eʼtibor bermaydigan', definition: 'eʼtiborsiz qoldiriladigan' },
      { word: 'quvmadim', definition: 'ortidan yugurmadim' },
      { word: 'chaqiradi', definition: 'undaydi' },
      { word: 'yon koʻcha', definition: 'asosiy yoʻldan chetdagi koʻcha' },
    ],
  ),
  L(
    'e27',
    'Dam olish kunidagi sayohatda nima ajablantirdi?',
    `Salom, Tom,

Koʻl boʻyidagi shaharchaga qilgan dam olish kunimiz haqida aytishim kerak. Tinch sayr va oʻrtacha ovqat kutgandik. Oʻrniga shanba tushdan keyin koʻcha festivali boshlandi: musiqa, qogʻoz chiroqlar va bolalar uchun qayiq poygasi. Shu ajablanish ikki kunlik safarni kattaroq qilib yubordi.

Yakshanba ertalab tuman suvni qopladi va erta sayrni deyarli oʻtkazib yuborardik. Yaxshi boʻldiki, oʻtkazmadik. Baliqchilar allaqachon ishlayotgan edi, qirgʻoqda esa keksa juftlik termosdan choy ichardi. Iskele nam edi, lekin tinch edi. Rejamizni biroz qayta tartibladik: kechki ovqatni oldinga surdik, muzeyni tushga qoʻydik.

Agar yana qisqa safarga chiqsak, «oʻrtacha» kutishni kamaytiraman. Baʼzan eng yaxshi qism bron qilinmagan narsa boʻladi. Siz ham shu yoʻlni sinab koʻring — tinch koʻrinadigan joylarda ham bayram yashirinishi mumkin.

Doʻstingiz,
Nina`,
    [
      { word: 'festival', definition: 'koʻcha bayrami' },
      { word: 'chiroq', definition: 'yoritgich; qogʻoz chiroq' },
      { word: 'tuman', definition: 'havodagi qalin bugʻ' },
      { word: 'baliqchi', definition: 'baliq tutadigan odam' },
      { word: 'qirgʻoq', definition: 'suv cheti' },
      { word: 'iskele', definition: 'suv ustidagi yoʻlak' },
      { word: 'qayta tartibladik', definition: 'rejani oʻzgartirdik' },
      { word: 'oʻrtacha', definition: 'juda yaxshi emas, oddiy' },
      { word: 'oʻtkazib yuborardik', definition: 'qilmay qoʻyardik' },
      { word: 'bron', definition: 'oldindan band qilish' },
      { word: 'safar', definition: 'sayohat' },
      { word: 'tinch', definition: 'xotirjam' },
    ],
  ),
  L(
    'e28',
    'Tugʻilgan shahringiz oʻzgarayaptimi?',
    `A: Tugʻilgan shahringiz koʻp oʻzgarganmi?
B: Ha. Eski avtobus bekati yoʻqolgan, kinoteatr oʻrnida savdo markazi bor. Baʼzi oʻzgarishlar foydali. Kutubxona kattaroq va kechroq ochiq. Lekin bozor avvalgidek shaxsiy tuyulmaydi.
A: Eski koʻrinishini sogʻinasizmi?
B: Bir qismini. Chang va qahva hidli kitob doʻkonini sogʻinaman. Buzilgan yoʻlaklarni sogʻinmayman. Taraqqiyot kamdan-kam sof boʻladi. Agar shahar faqat yangi yuz koʻrsatib, eski odamlarni unutsa, uzluksizlik yoʻqoladi.
A: Tanqid qilish osonmi?
B: Tanqid oson; qabul qilish qiyinroq. Men foydali oʻzgarishni qoʻllayman, lekin bozor ohangini saqlashni soʻrayman.
A: Nima qilish mumkin?
B: Mahalliy doʻkonlarga borish, kutubxonaga aʼzo boʻlish, shahar majlisida bitta aniq fikr aytish. Shahar faqat bino emas; u odamlarning kundalik yuzidir.`,
    [
      { word: 'tugʻilgan shahar', definition: 'oʻsib ulgʻaygan joy' },
      { word: 'yoʻlak', definition: 'piyodalar yuradigan joy' },
      { word: 'taraqqiyot', definition: 'rivojlanish' },
      { word: 'uzluksizlik', definition: 'eski bilan yangining bogʻlanishi' },
      { word: 'tanqid', definition: 'salbiy baho berish' },
      { word: 'shaxsiy', definition: 'odamlarga yaqin' },
      { word: 'koʻrinish', definition: 'avvalgi holat' },
      { word: 'qabul', definition: 'tan olish' },
      { word: 'sof', definition: 'aralashmasiz' },
      { word: 'chang', definition: 'mayda zarrachalar' },
      { word: 'yuz', definition: 'tashqi qiyofa' },
      { word: 'foydali', definition: 'yordam beradigan' },
    ],
  ),
  L(
    'e29',
    'Sayyohlar nimalarni oʻtkazib yubormasligi kerak?',
    `Shaharmizni mahalliy usulda kashf etishga taklif qilamiz!

Shu bahor tashrif buyursangiz, uchta joyni oʻtkazib yubormang. Birinchisi — quyosh chiqishida tepalik bogʻi: tomlar ustidagi eng tinch manzara shu yerda. Ikkinchisi — juma kunidagi yopiq bozor; nonvoylar mintaqadagi eng yaxshi javdar nonini sotadi. Uchinchisi — vokzal yonidagi kichik tarix muzeyi. U kamtarona koʻrinadi, lekin ichidagi xatlar va suratlar har qanday qoʻllanmadan aniqroq hikoya aytadi.

Agar vaqtingiz qisqa boʻlsa, markazdagi gavjum maydonni quvmang. Buning oʻrniga kutubxona oldidagi favvora yonida oʻn daqiqa oʻtiring. Mahalliy aholi termos bilan kelib, tinch gaplashadi. Eng ishonchli xulosa shu: mashhur joylardan oldin oddiy kun tartibini koʻring. Shahar oʻzini shovqinli reklamada emas, sekin ertalabda ochadi.

Biz sizni kutamiz. Choy ichishni xohlasangiz, bozor yonidagi kichik kafeda soat oʻnada boʻlamiz.`,
    [
      { word: 'tom', definition: 'uyning yuqori qismi' },
      { word: 'yopiq bozor', definition: 'tomi bor bozor' },
      { word: 'kamtarona', definition: 'dabdabasiz' },
      { word: 'qoʻllanma', definition: 'sayyohlar uchun yoʻriqnoma' },
      { word: 'favvora', definition: 'suv otadigan inshoot' },
      { word: 'termos', definition: 'issiq ichimlik saqlaydigan idish' },
      { word: 'gavjum', definition: 'odam koʻp' },
      { word: 'ishonchli', definition: 'toʻgʻri chiqadigan' },
      { word: 'mintaqa', definition: 'hudud' },
      { word: 'xulosa', definition: 'qisqa yakun' },
      { word: 'oddiy', definition: 'kundalik' },
      { word: 'quvmang', definition: 'ortidan yugurmang' },
    ],
  ),
  L(
    'e30',
    'Nega kichik shaharlar tinchroq tuyuladi?',
    `Kichik shaharlar koʻpincha tinchroq tuyuladi, chunki diqqat uchun kurashadigan dvigatel kamroq. Amakivachchamning shahrida kechalar qandaydir erta keladi. Doʻkonlar yopiladi, suhbatlar skameykalarga chiqadi, gaplar orasida qush ovozi eshitiladi. Mening shahrim bilan solishtirganda jimlik boʻsh emas. U uzoqdagi poyezd va oshxona radiosining toʻqimasi bilan toʻla.

Albatta, tinchlik hamma uchun avtomatik xotirjamlik emas. Baʼzi odamlar xizmat kam boʻlganda yolgʻizlik his qiladi. Yoshlar kechki mashgʻulot topa olmasa, jimlik asabiylashtirishi mumkin. Lekin charchoq shahardan keyin men uchun tiklovchi boʻladi: sekin yuraman, osmonni koʻraman, telefonsiz oʻtiraman.

Tinchlik axloqiy jihatdan «yaxshiroq» demak emas. U boshqa ritm. Agar shahar sizni charchatsa, kichik joyga borib, bir kecha skameykada oʻtiring. Baʼzan shifo katta davo emas; u oddiy sukutdir. Men endi oyiga bir marta shunday kechani rejalayman — chunki jimlik ham mashq talab qiladi.`,
    [
      { word: 'dvigatel', definition: 'mashina dvigateli; shovqin manbai' },
      { word: 'toʻqima', definition: 'turli tovushlar qatlami' },
      { word: 'avtomatik', definition: 'oʻz-oʻzidan' },
      { word: 'asabiylashtirishi', definition: 'asabini buzishi' },
      { word: 'tiklovchi', definition: 'kuch qaytaruvchi' },
      { word: 'axloqiy', definition: 'toʻgʻri-notoʻgʻri jihatidan' },
      { word: 'charchoq', definition: 'holdan toyish' },
      { word: 'xizmat', definition: 'doʻkon, transport kabi imkoniyatlar' },
      { word: 'skameyka', definition: 'oʻtirish uchun oʻrindiq' },
      { word: 'jimlik', definition: 'shovqinsizlik' },
      { word: 'kurashadigan', definition: 'raqobatlashadigan' },
      { word: 'shifo', definition: 'tuzalish, yengillik' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e31',
    'Mehmon kelganda nima pishirasiz?',
    `Mehmon kelganda kichik xatolarni kechiradigan ovqat pishiraman. Shoʻrva, qovurilgan sabzavot va non meni hashamatli retseptlardan koʻproq qutqargan. Oʻtgan oy toʻrt doʻstim uzoq poyezd yoʻlidan keyin keldi. Domatesli dimlama tanladim — oldindan tayyorlab, issiq saqlash mumkin edi. Mezbon odamlar kelishidan oldin stressni kamaytirishi kerak, xavfli taom bilan oshirmasligi.

Shuningdek, bir kun oldin allergiya haqida soʻrayman. Bu savol chiroyli bezakdan muhimroq. Kimdir yongʻoq yeyolmasa, desertni oʻzgartiraman. Mehmondoʻstlik hayratga solish emas; oʻylangan qulaylikdir.

Zaxira rejam ham bor: muzlatgichda pishloq, meva, non. Agar asosiy taom kechiksa, stol boʻsh qolmaydi. Mukammallik kerak emas; iliqlik kerak. Oddiy dasturxon baʼzan eng yaxshi kutib olish boʻladi. Mehmonlar kulib, non sindirib, yoʻl charchoqini unutishsa — men uchun kecha muvaffaqiyatli.`,
    [
      { word: 'kechiradigan', definition: 'xatoni oson kechiradigan' },
      { word: 'qovurilgan', definition: 'pechda yoki yogʻda pishirilgan' },
      { word: 'dimlama', definition: 'sekin qaynatilgan quyuq ovqat' },
      { word: 'allergiya', definition: 'baʼzi ovqatga salbiy reaksiya' },
      { word: 'bezak', definition: 'chiroyli koʻrinish' },
      { word: 'hayratga solish', definition: 'lol qoldirish' },
      { word: 'oʻylangan', definition: 'oldindan oʻylab qoʻyilgan' },
      { word: 'zaxira', definition: 'qoʻshimcha reja' },
      { word: 'hashamatli', definition: 'murakkab va koʻzboʻyamachi' },
      { word: 'xavfli', definition: 'xato qilish oson boʻlgan' },
      { word: 'kutib olish', definition: 'mehmonni qarshi olish' },
      { word: 'mukammallik', definition: 'xatosiz holat' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e32',
    'Notanishlar bilan ovqat baham koʻrganmisiz?',
    `Dengiz boʻyiga ketayotgan tungi poyezdda birinchi marta notanishlar bilan ovqat baham koʻrdim. Bir oila guruch va sabzavotli katta idishni ochib, kupedagi hamma bilan boʻlishdi. Avvaliga muloyim rad etdim. Keyin ochlik va qiziqish yutdi. Ovqat odatdagi kechki ovqatlarimdan achchiqroq edi; shu bilan safar issiqroq tuyuldi.

Manzil, ob-havo va uxlamayotgan bolalar haqida gaplashdik. Hech kim familiya almashmadi. Mehmonnavozlik vaqtinchalik va nomsiz edi, lekin chin edi. Men ham sumkamdagi mevalarni chiqarib qoʻydim. Kichik jamoa bir soatga paydo boʻldi.

Ertalab hamma oʻz bekatida tushdi. Men minnatdor edim — nafaqat ovqat, balki ochiqlik uchun. Notanishlar bilan ovqat baʼzan shahardagi restorandan esda qolarliroq boʻladi, chunki u rejasiz. Keyingi safar poyezdda yana rad etishdan oldin bir soniya oʻylayman: balki qisqa suhbat sayohatning eng yaxshi qismidir.`,
    [
      { word: 'kupe', definition: 'poyezddagi kichik xona' },
      { word: 'qiziqish', definition: 'bilish istagi' },
      { word: 'manzil', definition: 'boradigan joy' },
      { word: 'nomsiz', definition: 'ismi nomaʼlum' },
      { word: 'vaqtinchalik', definition: 'qisqa muddatli' },
      { word: 'mehmonnavozlik', definition: 'mehmondoʻstlik' },
      { word: 'idish', definition: 'ovqat solingan narsa' },
      { word: 'rad etdim', definition: 'olmadim' },
      { word: 'minnatdor', definition: 'rahmat his qilgan' },
      { word: 'achchiqroq', definition: 'achchiqroq taʼmli' },
      { word: 'qisqa', definition: 'qisqa muddat' },
      { word: 'jamoa', definition: 'birgalikdagi guruh' },
    ],
  ),
  L(
    'e33',
    'Nega uy ovqati mazaliroq tuyuladi?',
    `Uy ovqati koʻpincha mazaliroq tuyuladi, chunki unda niyat bor. Kimdir mahsulot tanlagan, sous quyuqlashishini kutgan, stolga kim oʻtirishini oʻylagan. Restoran taomlari zoʻr boʻlishi, baʼzan mahoratliroq boʻlishi mumkin. Shunday boʻlsa-da, uy pishirigʻida likopchalar nusxa koʻchira olmaydigan gʻamxoʻrlik bor.

Buni eng aniq shoʻrvada sezaman. Onamning yasmiq shoʻrvasi restorandagidan soddaroq, lekin taʼmi menga xavfsizlik beradi. U tuzni sekin soladi, keyin tatib koʻradi, keyin moslashtiradi. Restoranda taqdimot chiroyliroq boʻlishi mumkin; uyda esa meʼyor va suhbat muhimroq.

Uy ovqati baʼzan kelishuv ham: kim yuvadi, kim kesadi, kim non oladi. Shu kichik kimyo taʼmga qoʻshiladi. Agar charchagan boʻlsangiz, mukammal taqdimotni quvmang. Bitta rost taom va tinch dasturxon koʻp stressni yengillashtiradi. Amaliyot shuni koʻrsatadiki, gʻamxoʻrlik seziladi — hatto retsept oddiy boʻlsa ham.`,
    [
      { word: 'niyat', definition: 'maqsadli oʻylash' },
      { word: 'quyuqlashish', definition: 'qalinlashish' },
      { word: 'mahoratli', definition: 'ustalik bilan qilingan' },
      { word: 'tuz', definition: 'taʼm beruvchi' },
      { word: 'taqdimot', definition: 'koʻrinish' },
      { word: 'moslashtiradi', definition: 'mos qilib oʻzgartiradi' },
      { word: 'meʼyor', definition: 'miqdor' },
      { word: 'kelishuv', definition: 'kelishib olish' },
      { word: 'yordam', definition: 'qoʻl urish' },
      { word: 'kimyo', definition: 'birgalikdagi taʼsir' },
      { word: 'vaziyat', definition: 'sharoit' },
      { word: 'yengillashtiradi', definition: 'yengil qiladi' },
      { word: 'rost', definition: 'chin' },
      { word: 'amaliyot', definition: 'tajriba' },
    ],
  ),
  L(
    'e34',
    'Mezbon har doim allergiya haqida soʻrashimi kerak?',
    `A: Kechki ovqatdan oldin mehmonlardan allergiya haqida soʻraysizmi?
B: Ha. Mezbon soʻrashi shart, deb oʻylayman. Kimdir sut mahsuloti yeyolmasa, men pishloqli makaron bersam, kecha hamma uchun stressli boʻladi.
A: Baʼzi odamlar allergiyani aytishdan uyaladi.
B: Shuning uchun mezbon birinchi soʻrashi kerak. Oddiy xabar yetadi: «Qaysi ovqatdan saqlanishim kerak?» Yongʻoq desa, desertni oʻzgartiraman. Keyin uzr soʻrashdan osonroq.
A: Agar javob noaniq boʻlsa-chi?
B: Unda moslashuvchan boʻling. Bitta muqobil taom qoʻying — masalan, alohida garnir. Bu dramatik boʻlishi shart emas; bu hurmat.
A: Mehmonlar tinchlanadimi?
B: Ha. Savolning oʻzi gʻamxoʻrlikni koʻrsatadi. Mezbonlik taom emas, odamlarni qulay qilishdir.`,
    [
      { word: 'sut mahsuloti', definition: 'sutdan qilingan ovqat' },
      { word: 'aytish', definition: 'tilga olish' },
      { word: 'muqobil', definition: 'boshqa variant' },
      { word: 'moslashuvchan', definition: 'oʻzgarishga tayyor' },
      { word: 'garnir', definition: 'asosiy taom yonidagi ovqat' },
      { word: 'dramatik', definition: 'haddan tashqari' },
      { word: 'hurmat', definition: 'ehtirom' },
      { word: 'stressli', definition: 'asabiy' },
      { word: 'uzr soʻrash', definition: 'kechirim soʻrash' },
      { word: 'saqlanish', definition: 'yemaslik' },
      { word: 'tinchlanadi', definition: 'xotirjam boʻladi' },
      { word: 'mezbon', definition: 'mehmon kutuvchi' },
    ],
  ),
  L(
    'e35',
    'Ovqatni eng odobli qanday rad etasiz?',
    `Mezbon: Yana bir boʻlak tort olasizmi?
Mehmon: Juda yoqimli koʻrinadi, lekin shu yerda toʻxtashim kerak. Rahmat.
Mezbon: Ishonchingiz komilmi? Bu buvimning retsepti.
Mehmon: Ha. Yana yesam, uyga ketayotganda noqulay boʻlishim mumkin. Hammasi mazali edi.
Mezbon: Hechqisi yoʻq. Ertaga uchun kichik boʻlak oʻrab beray.
Mehmon: Mehribonligingiz uchun rahmat, lekin tashvishlanmang. Taomdan chinakam zavq oldim.
Mezbon: Avvallari rad etishni xafa boʻlish deb bilardim. Endi minnatdorchilikni eshitish menga yetadi.
Mehmon: Aniq maqtov yaxshi ishlaydi: sous ajoyib edi, non issiq edi. Rad etish ham hurmatli boʻlishi mumkin.
Mezbon: Tushundim. Iliqlik majburlashda emas, tinglashda ekan.

Keyin stol tinchlandi. Hech kim noqulay boʻlmadi, chunki rad etish qisqa, aniq va minnatdor edi.`,
    [
      { word: 'noqulay', definition: 'oʻzini yomon his qilish' },
      { word: 'xafa', definition: 'ranjigan' },
      { word: 'rad etish', definition: 'olmaslik' },
      { word: 'minnatdorchilik', definition: 'rahmat hissi' },
      { word: 'maqtov', definition: 'yaxshi soʻz' },
      { word: 'qadrlanadi', definition: 'hurmat qilinadi' },
      { word: 'hurmatli', definition: 'odobli' },
      { word: 'retsept', definition: 'tayyorlash yoʻriqnoması' },
      { word: 'oʻrab', definition: 'oʻrab berish' },
      { word: 'chinakam', definition: 'haqiqiy' },
      { word: 'aniq', definition: 'ravshan' },
      { word: 'iliqlik', definition: 'iliq munosabat' },
    ],
  ),
  L(
    'e36',
    'Mehmonlar uchun kechki ovqatni kuydirib yuborganmisiz?',
    `Bir marta mehmonlar uchun kechki ovqatni shunchalik kuydirdimki, tutun signalizatsiyasi ham «mehmon» boʻldi. Mehmonxonada suhbatga berilib, toʻgʻorani unutibman. Qaytib kirsam, sabzavotlar koʻmirdan qorongʻi, oshxona esa lager olovi hidli edi. Bir soniya kechani bekor qilgim keldi.

Buning oʻrniga derazalarni ochdim, pitsa buyurtma qildim, stolga pishloq va meva qoʻydim. Doʻstlarim kuldi, keyin tutunni chiqarishga yordam berdi. Vahima oʻn daqiqada oʻtdi; keyin kecha oddiy quvnoqlikka qaytdi. Men «mukammal spektakl» oʻrniga tinch tiklanishni tanladim.

Falokat baʼzan uyalish keltiradi, lekin doʻstlar mukammallikni emas, rost munosabatni eslaydi. Oʻshandan beri taymer qoʻyaman va suhbatni oshxonadan uzoqlashtirmayman. Hikoyani hali ham aytaman — chunki u oddiy haqiqatni eslatadi: xato oxiri emas, agar tez tuzatsangiz.`,
    [
      { word: 'shunchalik', definition: 'juda kuchli darajada' },
      { word: 'koʻmir', definition: 'qora yongan narsa' },
      { word: 'lager olovi', definition: 'ochiq olov' },
      { word: 'spektakl', definition: 'koʻrsatish uchun oʻyin' },
      { word: 'falokat', definition: 'yomon voqea' },
      { word: 'uyalish', definition: 'xijolat' },
      { word: 'tiklanish', definition: 'tuzatish' },
      { word: 'signalizatsiya', definition: 'ogohlantiruvchi signal' },
      { word: 'bekor qilgim', definition: 'toʻxtatgim' },
      { word: 'buyurtma', definition: 'oshxonaga buyurtma berish' },
      { word: 'vahima', definition: 'qoʻrquv' },
      { word: 'aytaman', definition: 'qayta gapiraman' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e37',
    'Nega odamlar kechki ovqatga sovgʻa olib keladi?',
    `Odamlar kechki ovqatga sovgʻa olib keladi, chunki minnatdorchilikka shakl kerak. Gul, shokolad yoki yaxshi non «bu kecha uchun vaqt sarflaganingizni bilaman» deydi. Men boʻsh qoʻl bilan kelganman va mezbonlar «kerak emas» desa ham, yoʻqlikni darhol sezganman. Kichik sovgʻa toʻlov emas. U kutib olishda ishtirokdir.

Odatlar turlicha. Baʼzi uylarda oshxonada yordam oʻralgan sovgʻadan muhimroq. Boshqalarida alkogolsiz ichimlik yoki gul xavfsiz tanlov. Eng muhimi — oʻylanganlik: mezbonning didini taxmin qilish, shu bilan birga majburiyat his qildirish.

Agar nima olib kelishni bilmasangiz, non yoki meva deyarli hech qachon ortiqcha boʻlmaydi; ularni saqlash ham oson. Oddiy sovgʻa baʼzan eng issiq xabar boʻladi. Men endi eshikdan kirishdan oldin sumkamni tekshiraman: qoʻlimda bir narsa boʻlsin, hatto kichik boʻlsa ham.`,
    [
      { word: 'yoʻqlik', definition: 'biror narsaning yoʻqligi' },
      { word: 'turibdi', definition: 'qatʼiy aytadi' },
      { word: 'ishtirok', definition: 'qatnashish' },
      { word: 'odat', definition: 'urf-odat' },
      { word: 'alkogolsiz', definition: 'spirtli emas' },
      { word: 'oʻylanganlik', definition: 'eʼtibor bilan oʻylash' },
      { word: 'majburiyat', definition: 'majburiy his' },
      { word: 'oʻylangan', definition: 'eʼtiborli' },
      { word: 'boʻsh qoʻl', definition: 'sovgʻasiz' },
      { word: 'oʻralgan', definition: 'qogʻozga oʻralgan' },
      { word: 'saqlash', definition: 'qoʻyib qoʻyish' },
      { word: 'taxmin', definition: 'taxminiy bilish' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e38',
    'Eng sevimli koʻcha ovqati xotirangiz qaysi?',
    `Eng sevimli koʻcha ovqati xotiram port shahridagi yomgʻirli kechadan keladi. Kemalar yonidagi rasta oldidan grillda pishgan makkajoʻxori oldim; yuqorida chayqalar bahslashardi. Sotuvchi uni qogʻozga oʻradi, achchiq tuz sepdi va koʻrinishidan achchiqroq ekanini ogohlantirdi. Rost aytdi. Koʻzlarim yoshladi, shunday boʻlsa-da kuldim.

Tik turib yedim; tor ayvon ostida yana ikki xaridor bilan yomgʻirdan panoh topdik. Ob-havo haqida gaplashdik, chunki boshqa umumiy mavzu yoʻq edi. Navbat qisqa edi, lekin hid uzoqroq turdi — tutunliroq, issiqroq, shahar kechasiga xos.

Restoran dasturxoni yoʻq edi, lekin ziyofat bor edi: oddiy, ochiq, rost. Oʻshandan beri yomgʻir hidini eshitsam, oʻsha makkajoʻxorini eslayman. Koʻcha ovqati baʼzan eng yaxshi xotirani beradi, chunki u mukammal emas — u jonli.`,
    [
      { word: 'kema yonı', definition: 'port damboʻyi' },
      { word: 'chayqa', definition: 'dengiz qushi' },
      { word: 'achchiq', definition: 'achchiq taʼm' },
      { word: 'ayvon', definition: 'yomgʻirdan himoya qiluvchi toml' },
      { word: 'tutunliroq', definition: 'koʻproq tutun hidli' },
      { word: 'navbat', definition: 'kutish qatori' },
      { word: 'ziyofat', definition: 'bayramona ovqatlanish' },
      { word: 'dasturxon', definition: 'stol yopinchigʻi' },
      { word: 'panoh', definition: 'himoya joyi' },
      { word: 'grillda', definition: 'panjarada pishgan' },
      { word: 'ogohlantirdi', definition: 'ogohlantirib aytdi' },
      { word: 'rost', definition: 'haqiqat' },
    ],
  ),
  L(
    'e39',
    'Olti kishilik piknikni qanday rejalaysiz?',
    `Hammaga salom,

Shu yakshanba sharqiy maysazorda olti kishilik piknik rejalayapman. Ob-havo quruq tursa, tushda yogʻoch koʻprik yonida uchrashamiz. Iltimos, bitta umumiy narsa olib keling — hammamiz bir xil gazak koʻtarmaylik. Men sendvich, koʻrpa va suv olib kelaman.

Maya: meva  
Jonas: pishloq va kreker  
Sara: shirin narsa  
Omar: qogʻoz likopcha va stakan  
Lea: oddiy salat  

Yomgʻir yogʻsa, kvartiramga koʻchiramiz va uni «ichki piknik» deb ataymiz. Allergiya boʻlsa, oldindan yozing — menyuni moslashtiramiz. Vazifa katta emas; stolni toʻldirish kifoya. Romantik reja shart emas, quvnoq kun yetarli.

Hammangizni koʻrishni intiqlik bilan kutaman. Tasdiqlab qoʻying!

Lina`,
    [
      { word: 'maysazor', definition: 'oʻtloq maydon' },
      { word: 'koʻrpa', definition: 'yerga toʻshaladigan narsa' },
      { word: 'kreker', definition: 'quruq pechenye' },
      { word: 'romantik', definition: 'ishqiy, orzuli' },
      { word: 'moslashtiramiz', definition: 'oʻzgartiramiz' },
      { word: 'allergiya', definition: 'ovqatga reaksiya' },
      { word: 'umumiy', definition: 'hamma uchun' },
      { word: 'ichki', definition: 'uy ichida' },
      { word: 'toʻldirish', definition: 'yetarli qilish' },
      { word: 'gazak', definition: 'yengil ovqat' },
      { word: 'vazifa', definition: 'qilinadigan ish' },
      { word: 'intiqlik', definition: 'kutish ishtiyoqi' },
    ],
  ),
  L(
    'e40',
    'Mehmonlar idish yuvishga yordam berishi shartmi?',
    `A: Mehmonlar idish yuvishga yordam berishi shartmi?
B: Menimcha, mehmon taklif qilishi kerak. Mezbon keyinroq yuvishni xohlasa, rad etishi mumkin.
A: Bizning oilada taklif qilish odob, lekin qatʼiy turib soʻrash noqulay.
B: Aynan. Bir chin taklif yetadi. Mezbon «yoʻq» desa, javobni qabul qiling. Baʼzi odamlar doʻstlar ketgach yuvib, dam oladi.
A: Koʻp tovada katta kechki ovqat-chi?
B: Unda yordam mehribonroq. Stolni birga yigʻishtirish mehnatni kamaytiradi. Qattiq qoida emas — muvozanat.
A: Niyat qanday boʻlishi kerak?
B: Yordam majburiyat emas, ehtirom. Mezbonning oqshomini himoya qiling: agar u «men qilaman» desa, ishoning.

Xulosa: taklif qiling, radni hurmat qiling, kerak boʻlsa stolni yigʻing. Odob shu yerda.`,
    [
      { word: 'idish yuvish', definition: 'idishlarni tozalash' },
      { word: 'qatʼiy turib', definition: 'qayta-qayta talab qilib' },
      { word: 'chin', definition: 'samimiy' },
      { word: 'odob', definition: 'xulq qoidalari' },
      { word: 'yigʻishtirish', definition: 'stolni tozalash' },
      { word: 'mehnat', definition: 'ish' },
      { word: 'qattiq', definition: 'egiluvchan emas' },
      { word: 'muvozanat', definition: 'oʻrtacha holat' },
      { word: 'taklif', definition: 'yordam taklifi' },
      { word: 'rad', definition: 'olmaslik' },
      { word: 'niyat', definition: 'maqsad' },
      { word: 'himoya', definition: 'asrash' },
    ],
  ),
];
