/** Agent-authored UZ Elementary e16–e25 */
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
    'e16',
    'Notanish odam kuningizni oʻzgartira oladimi?',
    `Bir yomgʻirli seshanba notanish odam mening kunimni uch daqiqadan kamroq vaqtda oʻzgartirdi. Imtihonga kechikayotgan edim va avtobus bekatida soyabonim sindi. Jildimdagi qogʻozlar jingalaklana boshladi. Yonimdagi ayol sezdi, kattaroq soyabonini ikkalamiz ustiga ochdi va «Avtobus kelguncha shu yerda turing,» dedi. Ismimni soʻramadi. Shunchaki zudlikdagi muammoni yechdi.

Avtobus kelganda u keyingi bekatda tushdi va bir marta qoʻl silkitdi. Uni boshqa koʻrmadim. Shu qisqa mehribonlik imtihonni osonlashtirmadi, lekin vahimani toʻxtatdi. Agar u paydo boʻlmaganda, kechikish va hoʻl qogʻozlar meni yana chuqurroq tashvishga tortishi mumkin edi.

Oʻsha kundan beri soyabonimni zaxira bilan olib yuraman va kimdir qiynalayotganini koʻrsam, bir soniya toʻxtayman. Qahramonlik katta nutq boʻlishi shart emas. Baʼzan u oddiy eʼtibor. Notanish odamning hikoyasi davomi yoʻq, lekin mening kunimda u bor: men ham kimnidir toʻxtatib, yordam berishim mumkin. Kichik yordam katta spiralni buzadi.`,
    [
      { word: 'jingalaklana', definition: 'namdan qiyshayib burilmoq' },
      { word: 'jild', definition: 'qogʻozlar solingan papka' },
      { word: 'zudlikdagi', definition: 'hozirgi, darhol' },
      { word: 'vahima', definition: 'kuchli qoʻrquv' },
      { word: 'qahramonlik', definition: 'katta jasorat koʻrsatish' },
      { word: 'spiral', definition: 'yomonlashib boruvchi aylana' },
      { word: 'davomi', definition: 'keyingi qism' },
      { word: 'toʻxtatib', definition: 'ishini boʻlib' },
      { word: 'sezdi', definition: 'eʼtibor berib bildi' },
      { word: 'soyabon', definition: 'yomgʻirdan himoya qiladigan asbob' },
      { word: 'notanish', definition: 'avval koʻrilmagan odam' },
      { word: 'mehribonlik', definition: 'yaxshi munosabat' },
    ],
  ),
  L(
    'e17',
    'Nega baʼzi doʻstlar oiladek tuyuladi?',
    `Baʼzi doʻstlar oiladek tuyuladi, chunki hayot noqulay boʻlganda ham qoladilar. Ular sizning tugallanmagan gaplaringizni biladi. Soʻralmasa ham ogʻir kunning yilligini eslaydi. Menda shunday doʻst bor. Endi bir shaharda yashamaymiz, lekin suhbatlarimiz hali ham sovuq havoda uzoq yurib uyga qaytgandek tuyuladi.

Oila beriladi; doʻstlik tanlanadi. Shu tanlov maxsus sodiqlik yaratadi. Tanlangan oila muammolaringizni reyting qilmay tinglaydi. Shu bilan birga, ogʻir haqiqatni ham aytishi mumkin — chunki munosabat yupqa maqtovga emas, ishonchga qurilgan.

Uzoq masofada ham hazil bir xil ishlaydi. Bir xabar, bir ovozli xabar — va siz yana «uyda» ekansiz. Bu doʻstliklar kam uchraydi, chunki vaqt va eʼtibor talab qiladi. Kattalik shuni koʻrsatadiki, qon bogʻi boʻlmasa ham, baʼzi munosabatlar doimiy oila vazifasini bajaradi. Men bunday doʻstlarga tugʻilgan kunida emas, oddiy chorshanbada ham yozaman. Chunki oiladek tuyulgan doʻstlik bayramga emas, kundalik eʼtiborga muhtoj.`,
    [
      { word: 'noqulay', definition: 'qulay emas; qiynaydigan' },
      { word: 'yillik', definition: 'har yili eslanadigan sana' },
      { word: 'sodiqlik', definition: 'sodiq qolish' },
      { word: 'reyting', definition: 'muammolarni tartiblab baholash' },
      { word: 'uzoq', definition: 'masofasi katta' },
      { word: 'hazil', definition: 'kulgili gap' },
      { word: 'doimiy', definition: 'uzoq muddatli' },
      { word: 'kattalik', definition: 'kattalar hayoti' },
      { word: 'ishonch', definition: 'bir-biriga ishonish' },
      { word: 'munosabat', definition: 'odamlar orasidagi bogʻlanish' },
      { word: 'yupqa', definition: 'zaif, sayoz' },
      { word: 'kam', definition: 'tez-tez uchramaydigan' },
    ],
  ),
  L(
    'e18',
    'Ishda kim sizni ilhomlantiradi?',
    `A: Shu kunlarda ishda kim sizni ilhomlantiradi?
B: Jamoa rahbarimiz Rina. Bu yil ikkita qiyin loyihani stressni baqirishga aylantirmay boshqardi.
A: U nima qiladi boshqacha?
B: Ustuvorlikni aniq tushuntiradi. Ish kutishi mumkin boʻlsa, shuni aytadi. Muddat haqiqiy boʻlsa, diqqat vaqtini himoya qiladi. U yigʻilishlarda maqtovni oʻziga yigʻmay, boshqalarga berishini koʻrganman.
A: Bu kam uchraydi.
B: Ha. Baʼzi rahbarlar faqat xatoni koʻradi. U yaxshilanishni ham koʻradi. Oʻtgan oy menga qisqa taqdimotni olib borishni topshirdi va oldindan tayyorlanishga yordam berdi.
A: Undan nima oʻrgandingiz?
B: Barqaror adolat ishonchni oshiradi. Jamoa otashbozlikdan koʻra tinch meʼyorga tayanadi.
A: Oʻzingizda nima oʻzgardi?
B: Endi shoshilinchni baland ovoz bilan emas, aniq reja bilan yechamman. Ishonchim ham oshdi, chunki rost fikr aytish mumkinligini koʻrdim.`,
    [
      { word: 'ilhomlantiradi', definition: 'yaxshi misol koʻrsatib undaydi' },
      { word: 'ustuvorlik', definition: 'avvalo qilinadigan ish' },
      { word: 'muddat', definition: 'tugash vaqti' },
      { word: 'maqtov', definition: 'ishni eʼtirof etish' },
      { word: 'yaxshilanish', definition: 'oldingidan yaxshiroq boʻlish' },
      { word: 'taqdimot', definition: 'gʻoyani ochiq koʻrsatish' },
      { word: 'barqaror', definition: 'doimiy, oʻzgarmas' },
      { word: 'adolat', definition: 'teng va toʻgʻri munosabat' },
      { word: 'tayanadi', definition: 'ishonib suyanadi' },
      { word: 'diqqat', definition: 'eʼtibor' },
      { word: 'meʼyor', definition: 'qabul qilingan standart' },
      { word: 'otashbozlik', definition: 'shovqinli, vaqtinchalik shov-shuv' },
      { word: 'ishonch', definition: 'oʻziga ishonish' },
      { word: 'rost', definition: 'haqiqiy' },
    ],
  ),
  L(
    'e19',
    'Hech kimnidir notoʻgʻri tushunganmisiz?',
    `Oʻtgan bahor hamkasbim Dana xabarini notoʻgʻri tushunib, loyihani deyarli buzib qoʻydim. U «Dizaynni toʻxtatib tura olmaymizmi?» deb yozdi. Men buni tanqid deb oʻqib, juda keskin javob berdim. Aslida u moliya boʻlimidan yangi raqamlarni kutishimizni nazarda tutgan ekan. Tushga qadar chat ofis konditsioneridan ham sovuqroq tuyuldi.

Ertasi kuni ertalab yuzma-yuz uzr soʻradim. Uning soʻzlariga emas, oʻz qoʻrquvimga javob berganimni aytdim. U bir marta kuldi-da, vaziyatni aniqroq tushuntirdi. Agar xabar keskin tuyulsa, birinchi munosabat emas, aniqlovchi savol yozishga kelishdik.

Notoʻgʻri tushunish tez boʻladi, chunki biz maʼnoni taxmin qilamiz. Yaxshi jamoa ishi taxminni qiziqish bilan almashtiradi. Endi «nima demoqchisiz?» deb soʻrashni oʻrgandim. Bu oddiy savol koʻp zararning oldini oladi. Dana bilan ishimiz yaxshilandi, chunki ikkalamiz ham aniqroq yozamiz va tezroq tuzatamiz.`,
    [
      { word: 'notoʻgʻri tushunib', definition: 'maʼnoni xato anglab' },
      { word: 'tanqid', definition: 'salbiy baho' },
      { word: 'keskin', definition: 'qattiq, qoʻpol' },
      { word: 'vaziyat', definition: 'atrofdagi sharoit' },
      { word: 'aniqlovchi', definition: 'maʼnoni ochuvchi' },
      { word: 'taxmin', definition: 'tekshirmasdan oʻylash' },
      { word: 'qiziqish', definition: 'bilish istagi' },
      { word: 'aniq', definition: 'ravshan' },
      { word: 'jamoa ishi', definition: 'birgalikda ishlash' },
      { word: 'toʻxtatib', definition: 'vaqtincha toʻxtamoq' },
      { word: 'javob berganimni', definition: 'munosabat bildirganimni' },
      { word: 'buzib', definition: 'zarar yetkazib' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e20',
    'Yaxshi ustozni nima qiladi?',
    `Yaxshi ustoz faqat maqtov bermaydi. U foydali savollar beradi, rost ogohlantirishlarni aytadi va boshqalar sezmagan taraqqiyotni nishonlaydi. Bilgan eng yaxshi ustozim hech qachon oʻzining kichik nusxasini yaratishga urinmaydi. U odamlarga oʻzlarining kuchliroq usullarini topishga yordam beradi.

Ustozda uchta sifat kerak, deb oʻylayman. Birinchisi — sabr: oʻsish maslahatdan sekinroq. Ikkinchisi — aniqlik: noaniq ilhom bitta amaliy keyingi qadamdan kamroq yordam beradi. Uchinchi — chegara: ustoz yoʻl koʻrsatadi, lekin boshqarmaydi. Agar kimdir faqat hayrat talab qilsa, bu yoʻl-yoʻriq emas, nazorat.

Yaxshi ustoz xato qilganini ham tan oladi. Bu jasorat oʻquvchiga xavfsiz maydon beradi. Munosabat hurmatga quriladi: siz tinglaysiz, lekin oʻzingiz qaror qilasiz. Men endi yordam soʻrasam, «nima qilay?» emas, «qaysi ikki variantni koʻryapsiz?» deb soʻrayman — ustozim oʻrgatganidek. Taraqqiyot shovqinli boʻlishi shart emas; baʼzan u tinch, aniq qadamdir.`,
    [
      { word: 'ustoz', definition: 'yoʻl koʻrsatuvchi tajribali odam' },
      { word: 'maqtov', definition: 'yaxshi soʻzlar' },
      { word: 'ogohlantirish', definition: 'xavf haqida ogohlash' },
      { word: 'noaniq', definition: 'ravshan emas' },
      { word: 'hayrat', definition: 'hayron qolish, katta ehtirom' },
      { word: 'yoʻl-yoʻriq', definition: 'yoʻnaltiruvchi yordam' },
      { word: 'chegara', definition: 'nima mumkin-emasligi' },
      { word: 'tan oladi', definition: 'haqiqatni ochiq aytadi' },
      { word: 'jasorat', definition: 'qiyin narsani qilish kuchi' },
      { word: 'taraqqiyot', definition: 'oldinga siljish' },
      { word: 'usul', definition: 'ishlash yoʻli' },
      { word: 'munosabat', definition: 'odamlar orasidagi bogʻ' },
    ],
  ),
  L(
    'e21',
    'Yangi shaharda nimalarni sezdingiz?',
    `Yangi shahardagi birinchi tushdan keyin koʻzim doimo oʻtkirlashadi. Oʻtgan aprel daryoboʻyi shaharchasiga keldim; doʻkonlar mening shahrimdagidan kichikroq, avtobuslar esa kamroq uzr bilan kelardi. Tor koʻchalarda osilgan kir-yuvish, nonvoyxonalar oldidagi boʻr menyular, shovqinli guruhda uyga ketayotgan maktabbolalarni sezdim. Hech narsa mashhur emas edi, lekin hamma narsa aniq edi.

Bir soat manzilsiz yurdim. Joy bilan tanishishning sevimli usuli shu. Xarita foydali, lekin kezish shaharning shaxsiyatini koʻrsatadi. Baʼzi koʻchalar sekin, baʼzilari shoshilinchi. Temiryoʻl yaqinida havo metall hidli edi; parkda esa bolalar kulgisi eshitilardi.

Kechqurun daftarimga uchta tafsilot yozdim: hid, ovoz, odamlar qanday yurishi. Shu kichik odat yangi joyni esda saqlaydi. Mashhur joylar keyinroq ham topiladi; birinchi kunning mukofoti — sezishning oʻzi. Rost aytganda, amaliyot shuni koʻrsatadiki, sekin yurish tez sayohatdan koʻra koʻproq narsani ochadi.`,
    [
      { word: 'daryoboʻyi', definition: 'daryo yonidagi' },
      { word: 'kir-yuvish', definition: 'yuvilgan kiyimlar' },
      { word: 'manzil', definition: 'boradigan joy' },
      { word: 'kezish', definition: 'maqsadsiz yurish' },
      { word: 'surʼat', definition: 'tezlik' },
      { word: 'temiryoʻl', definition: 'poyezd yoʻli' },
      { word: 'aniq', definition: 'oʻziga xos, ravshan' },
      { word: 'soʻnish', definition: 'asta yoʻqolish' },
      { word: 'sezish', definition: 'eʼtibor bilan koʻrish' },
      { word: 'uzr', definition: 'kechirim; kechikish uchun' },
      { word: 'shaxsiyat', definition: 'oʻziga xos belgi' },
      { word: 'mukofot', definition: 'foyda, natija' },
      { word: 'rost', definition: 'haqiqat' },
      { word: 'amaliyot', definition: 'tajriba orqali bilish' },
    ],
  ),
  L(
    'e22',
    'Hech notoʻgʻri poyezdga chiqqanmisiz?',
    `Bir marta notoʻgʻri poyezdga chiqqanman; xotira hali ham kuldiradi va yuzimni burishtiradi. Charchagan edim, tez chiqdim va eshik yopilgach ekranni tekshirdim. Poyezd janub emas, shimolga ketardi. Oʻn daqiqa adashganimga umid qildim. Keyin konduktor jim falokatimni tasdiqladi.

Keyingi bekatda tushib, yangi chipta oldim. Kechikish doʻstlarim bilan kechki ovqatga kech qoldirdi, lekin koʻrmagan mahallam boʻylab rejasiz sayr berdi. Yon koʻchada gul rastalari turardi; kichik kinoteatrda kunduzgi seans eʼloni osilgan edi. Telefonimda xarita ochib, platformaga qaytdim.

Uyga yetganimda doʻstlarim hazil qilishdi, men esa choy ichib, nafas oldim. Notoʻgʻri poyezd baʼzan sarguzashtga aylanadi, agar tinch tiklanishni bilsangiz. Endi chiqishdan oldin ekranni ikki marta oʻqiyman. Kichik odat katta kechikishning oldini oladi. Shu kun menga shuni oʻrgatdi: xato oxiri emas; baʼzan u yangi koʻchani ochadi.`,
    [
      { word: 'burishtiradi', definition: 'nojinslikdan yuzni qiyshaytiradi' },
      { word: 'chiqdim', definition: 'poyezdga bordim' },
      { word: 'ekran', definition: 'maʼlumot koʻrsatuvchi displey' },
      { word: 'konduktor', definition: 'poyezd xodimi' },
      { word: 'kechikish', definition: 'kech qolish' },
      { word: 'rejasiz', definition: 'oldindan oʻylanmagan' },
      { word: 'seans', definition: 'kino koʻrsatuv vaqti' },
      { word: 'platforma', definition: 'poyezd kutadigan joy' },
      { word: 'mahalla', definition: 'shahar qismi' },
      { word: 'tiklanish', definition: 'vaziyatni tuzatish' },
      { word: 'tasdiqladi', definition: 'ha ekanini aytdi' },
      { word: 'sarguzasht', definition: 'kutilmagan qiziq voqea' },
    ],
  ),
  L(
    'e23',
    'Nega chet el bozorlari boshqacha tuyuladi?',
    `Chet el bozorlari koʻpincha boshqacha tuyuladi, chunki sezgilar birdan uygʻonadi. Mening shahrimdagi bozorda rastalar tartibli, narxlar aniq yozilgan. Oʻtgan yili borgan dengizboʻyi bozorida sotuvchilar taklif chaqirardi, ziravorlar ochiq qoplarda turardi, xaridorlar zaytunni sotib olishdan oldin tatib koʻrardi. Shovqin tartibsizlikdan doʻstona edi, lekin supermarket yoʻlagidan koʻproq diqqat talab qilardi.

Oʻsha kechqurun hostel daftarimda ikki tajribani solishtirdim. Uyda xarid tezroq va tinchroq. Chetda xarid suhbat va tanlashga aylanadi. Pul almashish, namuna soʻrash, nonni qogʻozga oʻrash — hammasi madaniyatning bir qismi.

Men ikkalasini ham yaxshi koʻraman. Tartibli bozor vaqt tejaydi; shovqinli bozor xotira beradi. Agar yangi joyga borsangiz, birinchi kuni supermarketga emas, ochiq bozorga boring. U yerda shahar oʻzini yashirmaydi. Xarid faqat narsa olish emas; u odamlar qanday gaplashishi va nima qadrlashini koʻrsatadi.`,
    [
      { word: 'rasta', definition: 'bozordagi savdo joyi' },
      { word: 'tartibli', definition: 'tartibga solingan' },
      { word: 'ziravor', definition: 'taʼm beruvchi quruq oʻsimlik' },
      { word: 'yoʻlak', definition: 'doʻkon ichidagi yoʻl' },
      { word: 'tartibsizlik', definition: 'tartibsiz shovqin' },
      { word: 'almashish', definition: 'pul yoki narsa almashtirish' },
      { word: 'namuna', definition: 'tatib koʻrish uchun kichik qism' },
      { word: 'chet', definition: 'boshqa mamlakat' },
      { word: 'xarid', definition: 'sotib olish' },
      { word: 'oʻrash', definition: 'qogʻozga burab berish' },
      { word: 'talab', definition: 'kerak qilish' },
      { word: 'madaniyat', definition: 'odamlarning turmush usuli' },
    ],
  ),
  L(
    'e24',
    'Eng yaxshi sayringiz qaysi edi?',
    `Eng yaxshi sayrim tasodifan boshlangan. Doʻstim bilan yumshoq oktabr kunida avtobusni oʻtkazib yubordik, kutish oʻrniga kanal boʻylab yurishga qaror qildik. Yoʻl yoʻldan uzunroq, lekin tinchroq edi. Tol daraxtlari suv ustiga egilgan, velosipedchilar esa oʻtib ketayotganda muloyim jiringlashardi.

Odatdagidan kam gaplashdik, chunki joyning oʻzi gapirardi. Oʻrdaklar kichik guruhda suzardi. Bir kishi qarama-qarshi qirgʻoqni chizardı. Qayerdadir ochiq derazadan eski qoʻshiq eshitilardi. Shahar markaziga yetganimizda yelkamizdagi tashvish biroz qayta tartiblangandek edi.

Baʼzan eng yaxshi sayr dramatik maqsadsiz boʻladi. U shunchaki marshrutni oʻzgartiradi va tanani tinchlantiradi. Oʻshandan beri charchaganimda uzun yoʻl emas, suv boʻyidagi qisqa yoʻlni tanlayman. Oddiy yurish baʼzan katta dam olishdan kuchliroq ishlaydi. Doʻstim bilan hali ham shu kanalni eslaymiz — chunki u yerda hech narsa «muhim» emas edi, lekin hammasi esda qoldi.`,
    [
      { word: 'kanal', definition: 'shahar ichidagi sunʼiy suv yoʻli' },
      { word: 'tol', definition: 'suv boʻyida oʻsadigan daraxt' },
      { word: 'velosipedchi', definition: 'velosipedda yuruvchi' },
      { word: 'qayta tartiblangan', definition: 'yana tartibga kelgan' },
      { word: 'yelka', definition: 'tana yuqori qismi; tashvish joyi' },
      { word: 'tinchlantiradi', definition: 'xotirjam qiladi' },
      { word: 'yumshoq', definition: 'iliq, qattiq emas' },
      { word: 'qarama-qarshi', definition: 'narigi tomondagi' },
      { word: 'dramatik', definition: 'kuchli, hayajonli' },
      { word: 'marshrut', definition: 'yurish yoʻli' },
      { word: 'maqsad', definition: 'borish sababi' },
      { word: 'qirgʻoq', definition: 'suv cheti' },
      { word: 'oddiy', definition: 'sodda' },
    ],
  ),
  L(
    'e25',
    'Yoʻlni qanday muloyim soʻraysiz?',
    `Sayyoh: Kechirasiz, eski kutubxonani topishga yordam bera olasizmi? Notoʻgʻri koʻchada turganman shekilli.
Mahalliy: Albatta. Yaqinsiz. Ikki blok toʻgʻri yursangiz, kichik parkni koʻrasiz. U yerdan chapga buriling.
Sayyoh: Asosiy yoʻldanmi yoki tinchroq yon koʻchadanmi?
Mahalliy: Yon koʻcha piyoda xavfsizroq va kamroq shovqinli. Lekin svetoforda oʻting. Burchak yaqinida mashinalar tez keladi.
Sayyoh: Rahmat. Kutubxona hozir ochiqmi?
Mahalliy: Olti gacha ochiq boʻlishi kerak. Agar eshik yopiq boʻlsa, yon kirishni tekshiring — oʻqish zali baʼzan alohida ishlaydi.
Sayyoh: Yana bir narsa: xarita ilovasim chalkash. Qaysi yoʻnalish tinchroq?
Mahalliy: Parkdan keyin daryo tomonga boring. U yoʻl uzunroq, lekin odamlar sekinroq yuradi. Asabiylashingiz kamayadi.
Sayyoh: Siz juda yordam berdingiz.
Mahalliy: Hechqisi yoʻq. Notanish joyda soʻrash — aqlli ish. Omad!

Sayyoh ichida bir marta nafas oldi-da, yoʻlni takrorlab oldi: ikki blok, chap, svetofor, yon kirish. Muloyim savol baʼzan eng yaxshi xaritadir.`,
    [
      { word: 'blok', definition: 'ikki koʻcha orasidagi masofa' },
      { word: 'kirish', definition: 'ichkariga oʻtadigan eshik' },
      { word: 'notanish', definition: 'tanimagan odam' },
      { word: 'yopiq', definition: 'ochilmagan' },
      { word: 'oʻtish', definition: 'koʻchani kesib oʻtish' },
      { word: 'tinchroq', definition: 'kamroq shovqinli' },
      { word: 'asabiylash', definition: 'xavotirlanish' },
      { word: 'ohista', definition: 'sekin' },
      { word: 'toʻgʻri', definition: 'toʻgʻri chiziqda' },
      { word: 'yordam', definition: 'koʻrsatilgan yordam' },
      { word: 'svetofor', definition: 'chiroqli oʻtish joyi' },
      { word: 'oʻqish zali', definition: 'kitob oʻqiladigan zal' },
    ],
  ),
];
