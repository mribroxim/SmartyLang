/** Agent-authored Latin Uzbek Elementary e1–e5. */
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
    'e1',
    'Birinchi kuningiz qanday oʻtdi?',
    `Til maktabidagi birinchi kunim oddiy haftadan ham uzunroq tuyuldi. Kechikib qolishdan qoʻrqib, yigirma daqiqa erta keldim. Shisha eshik oldida turib, sumkamni qayta-qayta tekshirdim. Ichkarida yoʻlakda qahva va yangi qogʻoz hidi bor edi. Qabulxona xodimi tabassum qilib, sinfxona raqami yozilgan koʻk kartochka berdi. Joyimga oʻtirganimda avvaliga hech kim gapirmadi. Keyin yonidagi qiz qayerdan ekanligimni soʻradi va xona birdan yengillashgandek boʻldi.

Oʻqituvchi kutganimdan yoshroq chiqdi. U doskaga uchta savol yozdi va juft boʻlib javob berishimizni aytdi. Sherigim mendan tezroq gapirdi, lekin men soʻz qidirganda kutib turdi. Tushlikka qadar oʻnta yangi iborani eshitdim, yarmiga yaqinini esa unutib qoʻydim. Shunday boʻlsa-da, uyga faxr bilan qaytdim. Yoʻlda oyoq tovushimni sekinroq, jimlik bilan eshitardim — shoshilishim pasaygan edi.

Birinchi kunlar kamdan-kam mukammal boʻladi. Lekin ular shuni koʻrsatadiki, jasorat baʼzan baland ovoz bilan emas, oddiy kelib oʻtirish bilan boshlanadi. Agar kelasang, tinglasang va urinib koʻrsang, notanish joy ham asta-sekin imkoniyatga aylanadi. Oʻsha kechqurun daftarimga uchta gap yozdim: kim bilan gaplashdim, qaysi ibora esda qoldi, ertaga nima soʻrayman.`,
    [
      { word: 'yoʻlak', definition: 'bino ichidagi uzun yoʻl; xonalar shu yoʻlga ochiladi' },
      { word: 'qabulxona xodimi', definition: 'kiruvchilarni kutib oladigan va yoʻnaltiradigan xodim' },
      { word: 'sherik', definition: 'juft ishlaydigan odam' },
      { word: 'ibora', definition: 'birgalikda ishlatiladigan qisqa soʻzlar guruhi' },
      { word: 'faxr', definition: 'qilgan ishingizdan mamnunlik hissi' },
      { word: 'jasorat', definition: 'qoʻrqinchli boʻlsa-da harakat qilish kuchi' },
      { word: 'jimlik', definition: 'shovqinsiz, sokin holat' },
      { word: 'kutganimdan', definition: 'taxminimdan farqli ravishda' },
      { word: 'qidirganda', definition: 'nimanidir izlayotgan paytda' },
      { word: 'imkoniyat', definition: 'amalga oshishi mumkin boʻlgan narsa' },
      { word: 'birdan', definition: 'kutilmaganda, tezda' },
      { word: 'kamdan-kam', definition: 'juda kam hollarda' },
      { word: 'oddiy', definition: 'maxsus emas; kundalik' },
    ],
  ),
  L(
    'e2',
    'Hech adashganmisiz?',
    `Men bir necha marta adashganman, lekin eng qiyini notanish shaharda boʻldi. Muzeydan chiqqach telefon batareyasi oʻchdi va koʻcha nomlari bir-biriga oʻxshash koʻrindi. Deyarli yarim soat doira boʻylab yurdim. Har bir kafe oldingisidan gavjumroq edi; shoshilayotgan odamlarni toʻxtatishga uyalardim.

Nihoyat kitob doʻkoni oldidagi keksa odamdan soʻradim. U diqqat bilan tingladi-da, yoʻlning narigi tomonidagi tramvay bekatini koʻrsatdi. «Uchinchi yoʻnalishga chiqing,» dedi. «Toʻrt bekat yursangiz, daryoni koʻrasiz; mehmonxonangiz koʻprik yonida.» Uning yoʻl koʻrsatmasi xayolimdagi xaritadan aniqroq edi. Tramvayda shahar oʻtib ketayotganini tomosha qildim va koʻcha nomini jimlik bilan takrorladim.

Mehmonxonaga yetgach, telefonni darhol quvvatladim. Shundan beri oddiy qoida tutaman: uzoq yurishdan oldin batareyani tekshiraman va bitta manzilni qogʻozga yozaman. Adashish keyin kulgili hikoyaga aylanadi, lekin oʻsha daqiqada magʻrurlikdan koʻra xotirjam reja kerak. Endi shaharga chiqsam, bir manzilni oldindan mashq qilib olaman.`,
    [
      { word: 'batareya', definition: 'telefonda elektr saqlaydigan qism' },
      { word: 'toʻxtatish', definition: 'kimnidir gapirish uchun toʻxtatib soʻrash' },
      { word: 'tramvay', definition: 'shaharda relsda yuradigan elektr transport' },
      { word: 'yoʻl koʻrsatma', definition: 'qaerga borishni tushuntiruvchi yoʻriq' },
      { word: 'quvvatladim', definition: 'batareyaga elektr berdim' },
      { word: 'jimlik', definition: 'ovoz chiqarmasdan' },
      { word: 'doira', definition: 'aylana yoʻl; bir joy atrofida aylanish' },
      { word: 'oʻxshash', definition: 'bir-biriga yaqin koʻrinadigan' },
      { word: 'xotirjam', definition: 'tinch, shoshilmasdan' },
      { word: 'magʻrurlik', definition: 'oʻzini pastga qoʻymaslik istagi' },
      { word: 'mashq', definition: 'takrorlab oʻrganish' },
      { word: 'qoida', definition: 'amal qilinadigan oddiy tartib' },
    ],
  ),
  L(
    'e3',
    'Birinchi marta yolgʻiz qachon ovqat pishirdingiz?',
    `Oʻtgan oy birinchi marta yolgʻiz kechki ovqat pishirdim. Xonadoshlarim ketgan edi; oshxona birdan kattaroq va tinchroq koʻrindi. Goʻshtdan xavfsizroq tuyulgani uchun makaron tanladim. Suvni qaynatdim, tuz soldim va asabiylik bilan soatga qaradim. Sous videodagidek oson chiqmadi. Piyozni sekin toʻgʻradim, koʻzlarim yoshladi. Shunday boʻlsa-da, oshxona hidi issiqroq va mehmondoʻstroq boʻlib bordi.

Birinchi luqmani tatib koʻrganimda tuzi koʻproq edi, lekin yeyish mumkin edi. Deraza yonida oʻtirib, telefonsiz yedim. Shu kichik tanlov ovqatni muhimroq qildi. Yordam bilan koʻp marta pishirganman, lekin yolgʻiz pishirish boshqacha: xato shaxsiy qoladi, muvaffaqiyat ham faqat senga tegishli.

Yana yolgʻiz pishirsam, olovni yoqishdan oldin mahsulotlarni tayyorlab qoʻyaman. Birinchi kechalar kamdan-kam nafis boʻladi, lekin ular muhim. Mustaqillik baʼzan bitta oddiy likopdan boshlanadi. Keyin daftarimga uchta gap yozdim: nima boʻldi, nima muhim edi, keyingi safar nimani oʻzgartiraman. Shu qisqa odat savolni faqat oʻqish emas, amaliyotga aylantirdi. Yolgʻiz pishirish qanday edi? Halol javob har safar yangi misol bilan oʻzgaradi.`,
    [
      { word: 'xonadosh', definition: 'bir kvartirada yashaydigan odam' },
      { word: 'sous', definition: 'ovqatga taʼm beradigan quyuq suyuqlik' },
      { word: 'yeyish mumkin', definition: 'xavfsiz va yeyishga yaroqli' },
      { word: 'mahsulot', definition: 'ovqat uchun kerakli narsa' },
      { word: 'mustaqillik', definition: 'oʻzingiz qaror qilib ishlash' },
      { word: 'nafis', definition: 'chiroyli va mukammal koʻrinadigan' },
      { word: 'luqma', definition: 'bir marta ogʻizga olinadigan ovqat' },
      { word: 'qaynatdim', definition: 'suvni qaynaguncha isitdim' },
      { word: 'asabiylik', definition: 'xavotirli, bezovta holat' },
      { word: 'mehmondoʻst', definition: 'iliq, chaqiruvchi muhit' },
      { word: 'shaxsiy', definition: 'faqat oʻzingizga tegishli' },
      { word: 'tayyorlab', definition: 'oldindan tartiblab qoʻymoq' },
      { word: 'halol', definition: 'yolgʻon emas; rost' },
      { word: 'amaliyot', definition: 'takrorlab bajarish mashqi' },
    ],
  ),
  L(
    'e4',
    'Birinchi katta xatoingiz nima edi?',
    `Ishdagi birinchi katta xatoim mijozga notoʻgʻri fayl yuborish boʻldi. Charchagan edim, tez bosib yubordim va nomini tekshirmay «yuborish»ni bosdim. Oʻn daqiqadan keyin menejerim qoʻngʻiroq qildi. Ovozi tinch edi, lekin muammo aniq edi. Darhol uzr soʻradim va toʻgʻri hujjatni yubordim. Mijoz sabrli boʻldi, lekin men oʻtirgan stulimdan ham kichikroq tuyuldim.

Shu kuni tushdan keyin yopishqoq qogʻozga tekshiruv roʻyxati yozdim: nom, sana, ilova, oxirgi oʻqish. Bolalarcha koʻrinardi, lekin ishladi. Oʻshandan beri shu xatoni takrorlamadim. Birinchi marta xato ogʻirroq tuyuladi, chunki uni qanday tuzatishni hali bilmaysiz. Keyin tushunasiz: rostgoʻylik yashirishdan tezroq.

Jiddiy xato qilsangiz, nima boʻlganini ayting, tuzating va keyingi safar oldini oladigan bitta qadam yozing. Odamlar mukammallikdan koʻra tuzatishni hurmat qiladi. Oʻsha xato hali ham biroz uyalish hissi beradi, lekin qoʻllarim fikrimdan tezroq harakat qilganda sekinlashishni oʻrgatdi. Atrofdagilar turlicha munosabat bildirgan: biri hazil qildi, biri diqqat bilan tingladi. Men hikoyani bir marta aytaman-da, boshqalarga joy qoldiraman.`,
    [
      { word: 'mijoz', definition: 'xizmat yoki ish uchun toʻlov qiladigan shaxs' },
      { word: 'ilova', definition: 'xat bilan birga yuboriladigan fayl' },
      { word: 'tekshiruv roʻyxati', definition: 'bajarilishi kerak boʻlgan ishlar roʻyxati' },
      { word: 'uzr soʻradim', definition: 'kechirim soʻradim' },
      { word: 'tuzatish', definition: 'xatoni toʻgʻrilash' },
      { word: 'oldini oladigan', definition: 'qayta boʻlmasligi uchun toʻsuvchi' },
      { word: 'uyalish', definition: 'xijolat hissi' },
      { word: 'mukammallik', definition: 'hech qanday xatosiz holat' },
      { word: 'sabrli', definition: 'kutishga va tushunishga tayyor' },
      { word: 'jiddiy', definition: 'muhim va ogʻir' },
      { word: 'rostgoʻylik', definition: 'haqiqatni aytish' },
      { word: 'menejer', definition: 'ishni boshqaradigan rahbar' },
    ],
  ),
  L(
    'e5',
    'Birinchi doʻstingizni eslaysizmi?',
    `Boshlangʻich maktabdagi birinchi chin doʻstimni hali eslayman. Uning ismi Leo edi; u ikki parta uzoqda oʻtirardi. Uchinchi kuni men sendvichimni unutganim uchun u oʻzinikini yarim qilib berdi. Sahna dramatik emas edi. U shunchaki sendvichni surib, «Ochqorasan shekilli,» dedi. Shu kichik ish har qanday nutqdan katta tuyuldi.

Uyga bir xil yoʻldan qayta boshladik. U futbol haqida gapirardi, men komikslar haqida. Qiziqishlarimiz turlicha edi, lekin kulgimiz mos kelardi. Boshqa bola mening talaffuzimga kulganda, Leo yaqinroq turdi va mavzuni oʻzgartirdi. Keyin koʻp doʻst orttirdim, lekin birinchi doʻstlar alohida qoladi: ular dunyoga hali yangi boʻlganingizda keladi.

Bolalik doʻstligi kattalar nikohidan oddiyroq boʻladi. Kalendar yoki karyera haqida kelishmaysiz. Gazak, sir va tirnalgan tizzalarni baham koʻrasiz. Bugun Leo bilan uchrashsam, yuzini birdan tanimasligim mumkin, lekin hissiyotni tanib olaman: kimdir mening butun hikoyamni bilmasdan oldin mehribonlik qilgan. Orqaga qarasam, eng qiyini soʻz tanlash emas edi. Yordam kerakligini tan olish edi. Endi shunday paytlarda avvalo qiziqish bilan boshlayman, keyin bajaradigan oddiy reja qoʻyaman.`,
    [
      { word: 'boshlangʻich maktab', definition: 'kichik bolalar oʻqiydigan maktab' },
      { word: 'dramatik', definition: 'kuchli his-tuygʻu bilan toʻla' },
      { word: 'talaffuz', definition: 'soʻzlarni ayirish usuli' },
      { word: 'kelishmaysiz', definition: 'shartlashib kelishib olmaysiz' },
      { word: 'tirnalgan', definition: 'teri yoki joy shikastlangan' },
      { word: 'tanib olaman', definition: 'bilib, eslab qolaman' },
      { word: 'kulgi', definition: 'kulish ovozi yoki hissi' },
      { word: 'qiziqish', definition: 'nimagadir boʻlgan eʼtibor' },
      { word: 'sir', definition: 'boshqalarga aytilmagan narsa' },
      { word: 'berdi', definition: 'taklif qilib uzatdi' },
      { word: 'bolalik', definition: 'bola boʻlgan davr' },
      { word: 'mehribonlik', definition: 'yaxshi va yumshoq munosabat' },
    ],
  ),
];
