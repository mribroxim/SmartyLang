/** Agent-authored UZ Elementary e66–e80 */
function L(id, title, text, vocabulary) {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return { id, title, text, vocabulary, targetSeconds: Math.max(45, Math.min(600, Math.round((w / 130) * 60))) };
}

export const lessons = [
  L('e66', 'Tong otganda qushlarni kuzatganmisiz?',
    `Tong otganda qushlarni kuzatishni yaxshi koʻraman. Sparrowlar buta orasida shoshilinchi gaplashadi; ularning harakati maqsadli tuyuladi. Binokl olib, daraxtga qarayman — baʼzan qizilishtonni eshitaman, lekin koʻrmayman.

Bu soat shahar hali yumshoq. Mashinalar kam, havo salqin, fikrlarim tinchroq. Qushlar kunni boshlashni biladi: ovqat, xavfsizlik, joy. Men esa telefonni choʻntagimda qoldiraman.

Kuzatish sabr oʻrgatadi. Tez natija yoʻq; faqat eʼtibor. Baʼzan hech narsa «muhim» boʻlmaydi, lekin boshim yengillashadi. Agar stress boʻlsa, oʻn daqiqalik tonggi qush yetarli boʻlishi mumkin. Tabiat dars bermaydi — u misol koʻrsatadi.`,
    [
      { word: 'tong', definition: 'kun boshi' },
      { word: 'sparrow', definition: 'mayda qush; chumchuq' },
      { word: 'buta', definition: 'past oʻsimlik' },
      { word: 'maqsadli', definition: 'aniq maqsadli' },
      { word: 'binokl', definition: 'uzoqni koʻradigan asbob' },
      { word: 'qizilishton', definition: 'daraxt qushi' },
      { word: 'sabr', definition: 'kutish' },
      { word: 'eʼtibor', definition: 'diqqat' },
      { word: 'yengillashadi', definition: 'yengil boʻladi' },
      { word: 'stress', definition: 'asabiylik' },
      { word: 'salqin', definition: 'salqin havo' },
      { word: 'misol', definition: 'namuna' },
    ]),
  L('e67', 'Nega dengiz kayfiyatni oʻzgartiradi?',
    `Dengiz kayfiyatimni tez oʻzgartiradi. Ufq chizigʻi muammolarni oʻchirgandek tuyuladi — ular yoʻqolmaydi, lekin kichiklashadi. Toʻlqinlar rejasiz, lekin men uchun ular ataylab tinchlantiradi. Kenglik nuqtai nazarni ochadi: mening tashvishim paketcha xabar emas, katta manzaraning bir qismi.

Sohilda yurganimda nafas sekinlashadi. Telefon signalı zaif boʻlsa, yaxshi. Dengiz «hozir» ni majburlaydi. Shu majburiyat baʼzan eng yaxshi dori.

Albatta, hamma uchun bir xil emas. Baʼzilar dengizni qoʻrqinchli deb biladi. Men uchun u perspektiva beradi. Shaharga qaytgach, muammolar yana keladi, lekin men ularni boshqacha oʻlchayman. Dengiz oʻchiradi emas — u oʻlchovni oʻzgartiradi.`,
    [
      { word: 'ufq', definition: 'osmon bilan yer tutashgan chiziq' },
      { word: 'oʻchirgandek', definition: 'yoʻqotgandek' },
      { word: 'ataylab', definition: 'maqasadli' },
      { word: 'kenglik', definition: 'keng maydon' },
      { word: 'nuqtai nazar', definition: 'qarash' },
      { word: 'paket', definition: 'kichik oʻram' },
      { word: 'perspektiva', definition: 'kengroq qarash' },
      { word: 'toʻlqin', definition: 'suv toʻlqini' },
      { word: 'sohil', definition: 'dengiz cheti' },
      { word: 'signal', definition: 'aloqa' },
      { word: 'majburiyat', definition: 'majburiy holat' },
      { word: 'oʻlchov', definition: 'baholash' },
    ]),
  L('e68', 'Tabiatni topganimizdek qoldirishimiz shartmi?',
    `Sizni bahorgi yoʻl sayriga taklif qilamiz!

Agar togʻ yoʻliga chiqsangiz, tabiatni topganingizdek qoldiring. Axlatni olib chiqing — hatto oʻzingizniki boʻlmasa ham. Gullarni koʻrsatish uchun uzmang; suratga oling. Bolalarga yetakchi boʻling: izdan chiqmaslik, olovni ehtiyot qilish, chaqmoq boʻlsa daraxtdan uzoqlashish.

Bu qoidalar qattiq emas — ular gʻamxoʻrlik. Keyingi guruh ham shu goʻzallikni koʻrsin. Uchrashuv: shanba soat 8:00, pastki avtobus bekati. Sumkada suv, yengil yopinchiq, qoʻlqop boʻlsin.

Birgalikda yoʻlni toza saqlaymiz. Tabiat muzey emas, lekin uni buzish shart emas. Keling, tinch yuring, kuzating, iz qoldirmang.`,
    [
      { word: 'yoʻl', definition: 'togʻ yoʻli' },
      { word: 'axlat', definition: 'chiqindi' },
      { word: 'olib chiqing', definition: 'oʻzingiz bilan olib keting' },
      { word: 'koʻrsatish', definition: 'namoyish' },
      { word: 'yetakchi', definition: 'yoʻl koʻrsatuvchi' },
      { word: 'chaqmoq', definition: 'momaqaldiroq chaqmogʻi' },
      { word: 'iz', definition: 'oyoq izi' },
      { word: 'yopinchiq', definition: 'himoya mato' },
      { word: 'gʻamxoʻrlik', definition: 'eʼtibor' },
      { word: 'toza', definition: 'iflossiz' },
      { word: 'kuzating', definition: 'diqqat bilan qarang' },
      { word: 'qoida', definition: 'tartib' },
    ]),
  L('e69', 'Tashqarida qaysi biri qiyinroq: issiqmi yoki sovuqmi?',
    `A: Tashqarida qaysi biri qiyinroq: issiqmi yoki sovuqmi?
B: Men uchun issiq qiyinroq. Sovuqda qatlam qoʻshaman; issiqda esa suvsizlanish tez keladi.
A: Boshim aylanadi baʼzan.
B: Soyaga kiring, suv iching. Paxta kiyim yaxshi; sintetik baʼzan yomonroq.
A: Sovuqda nima xavfli?
B: Qoʻl-oyoq uchlari. Qalin qoʻlqop va quruq paypoq kerak. Issiq choy yordam beradi.
A: Demak, ikkalasi ham eʼtibor talab qiladi?
B: Ha. Farq shundaki, sovuqni kiyim bilan boshqarasiz; issiqni esa sekinlashish va soyа bilan.
A: Xulosa?
B: Ob-havoni dushman deb bilmang; uni reja qiling. Tayyorgarlik — eng yaxshi qatlam.`,
    [
      { word: 'qatlam', definition: 'kiyim qatlami' },
      { word: 'suvsizlanish', definition: 'suv yoʻqotish' },
      { word: 'aylanadi', definition: 'bosh aylanishi' },
      { word: 'soya', definition: 'quyoshdan himoya' },
      { word: 'uchlari', definition: 'qoʻl-oyoq uchlari' },
      { word: 'paxta', definition: 'paxta mato' },
      { word: 'sintetik', definition: 'sunʼiy mato' },
      { word: 'qoʻlqop', definition: 'qoʻl kiyimi' },
      { word: 'paypoq', definition: 'oyoq kiyimi' },
      { word: 'sekinlashish', definition: 'sekin ishlash' },
      { word: 'reja', definition: 'oldindan oʻylash' },
      { word: 'tayyorgarlik', definition: 'tayyorlanish' },
    ]),
  L('e70', 'Yoʻlda adashganmisiz?',
    `Bir marta togʻ yoʻlida adashdim. Belgi yoʻqolib qolgandi; noaniqlik oshdi. Orqaga qaytib, oxirgi aniq nuqtani qidirdim. Telefonimda xarita bor edi, lekin signal yoʻq. Shoshilish oʻrniga toʻxtadim, suv ichdim, usul tanladim: izni qayta bosib, pastga qaytish.

Yoʻlni yoʻqotish — asbobni yoʻqotishdek. Panika keladi, lekin usul panikani yengadi. Men uchta qoida yozdim: belgini suratga ol, quyosh tomonini bil, charchoqda yangi yoʻl ochma.

Ikki soatdan keyin tanish daraxtni topdim. Uyga qaytgach, doʻstlarimga aytmadim — avval oʻzim tinchlandim. Endi sayohatda toʻxtashni uyat deb bilmayman. Baʼzan eng aqlli qadam — oldinga emas, orqaga.`,
    [
      { word: 'belgi', definition: 'yoʻl belgisi' },
      { word: 'noaniqlik', definition: 'aniq emaslik' },
      { word: 'qaytib', definition: 'orqaga qaytish' },
      { word: 'yoʻqotish', definition: 'adashib qolish' },
      { word: 'usul', definition: 'yoʻl-yoʻriq' },
      { word: 'toʻxtadim', definition: 'toʻxtab turdim' },
      { word: 'signal', definition: 'aloqa' },
      { word: 'panika', definition: 'vahima' },
      { word: 'suratga', definition: 'rasmga' },
      { word: 'charchoq', definition: 'holdan toyish' },
      { word: 'tanish', definition: 'bilgan' },
      { word: 'uyat', definition: 'xijolat' },
    ]),
  L('e71', 'Qayta-qayta aytadigan hikoyangiz qaysi?',
    `Qayta-qayta aytadigan hikoyam — shahardagi issiqlik toʻlqini kechasi. Konditsionerlar ishlamay qoldi, odamlar hovlida uxlar edi. Osmonda yulduzlar galaktikadek koʻp tuyulardi, chunki chiroqlar oʻchgan edi. Qorongʻulik resursni ochdi: qoʻshnilar muzqaymoq, suv, quvvat bankini baham koʻrdi.

Avvaliga noqulay edi. Keyin jamoa paydo boʻldi. Bolalar fonar bilan oʻynadi, keksalar skameykada gaplashdi. Hech narsa buzilmadi — aksincha, odamlar ochiqroq boʻldi. Elektr yoʻqolganda, baʼzi narsalar yaxshilandi.

Bu hikoyani aytaman, chunki u qoʻrquv va mehribonlikni birga koʻrsatadi. Qorongʻulik oxiri emas. Baʼzan u yangi suhbatni yoqadi.`,
    [
      { word: 'issiqliq toʻlqini', definition: 'juda issiq davr' },
      { word: 'konditsioner', definition: 'havo sovutgich' },
      { word: 'galaktika', definition: 'yulduzlar tizimi' },
      { word: 'resurs', definition: 'kerakli narsa' },
      { word: 'buzilmadi', definition: 'yomonlashmadi' },
      { word: 'qorongʻulik', definition: 'yorugʻliksizlik' },
      { word: 'baham', definition: 'boʻlishish' },
      { word: 'jamoa', definition: 'guruh' },
      { word: 'fonar', definition: 'qoʻl chiroq' },
      { word: 'elektr', definition: 'tok' },
      { word: 'mehribonlik', definition: 'yaxshilik' },
      { word: 'suhbat', definition: 'gaplashish' },
    ]),
  L('e72', 'Serial uchun kechga qolganmisiz?',
    `Bir marta sevimli serialning yakunini koʻrish uchun tonggacha oʻtirib qoldim. Striming xizmati «keyingi qism»ni oson qiladi; jarlikdan sakrash oson. Ertalab boshim ogʻridi, lekin syujet yorqin edi.

Oqibat oddiy: uyqu qarz, kechikkan nonushta, ishdа eʼtiborsizlik. Endi oʻzimga qoida qoʻydim — ish kuni kechasi koʻpi bilan bitta qism. Dam olish kunida ikkita.

Toʻliq koʻrish baʼzan yoqimli, lekin har doim arzimaydi. Yopilish hissi kerak; u esa ertalab ham kelishi mumkin. Serial doʻstdek tuyuladi, lekin u sizning uyqungizni soʻramaydi. Chegara — mehribonlik oʻzingizga.`,
    [
      { word: 'yopilish', definition: 'yakun hissi' },
      { word: 'striming', definition: 'onlayn tomosha' },
      { word: 'jarlik', definition: 'qiziqarli toʻxtash' },
      { word: 'yorqin', definition: 'aniq esda' },
      { word: 'oqibat', definition: 'natija' },
      { word: 'toʻliq koʻrish', definition: 'ketma-ket koʻp qism' },
      { word: 'qarz', definition: 'yetishmovchilik' },
      { word: 'qoida', definition: 'tartib' },
      { word: 'chegara', definition: 'limit' },
      { word: 'syujet', definition: 'hikoya' },
      { word: 'eʼtiborsizlik', definition: 'diqqatsizlik' },
      { word: 'arzimaydi', definition: 'loyiq emas' },
    ]),
  L('e73', 'Nega baʼzi filmlar haqiqiyroq tuyuladi?',
    `Baʼzi filmlar haqiqiyroq tuyuladi, chunki qahramonlar ikkilanadi, gaplari ustma-ust tushadi, mukammal nutq aytmaydi. Realizm — faqat aniq dekor emas; u taniqlik. «Bu mening hayotimga oʻxshaydi» degan his.

Men bir filmda ota-bola suhbatini koʻrdim. Ular yarim soʻzlarda gaplashdi, lekin maʼno aniq edi. Bu meni ishontirdi: hayot ham shunday — toʻliq jumlalar kam.

Aniqlik muhim, lekin baʼzan hissiy taniqlik kuchliroq. Agar film faqat effekt quvsa, u koʻngil ochadi; agar insoniy noaniqlikni koʻrsatsa, u qoladi. Haqiqiy tuyulgan film — oyna, vitrina emas.`,
    [
      { word: 'ikkilanadi', definition: 'ikkilanish' },
      { word: 'ustma-ust', definition: 'bir-biriga qoʻshilib' },
      { word: 'ishontirdi', definition: 'ishonch uygʻotdi' },
      { word: 'realizm', definition: 'haqiqiyga yaqinlik' },
      { word: 'aniqlik', definition: 'toʻgʻrilik' },
      { word: 'taniqlik', definition: 'tanish his' },
      { word: 'effekt', definition: 'maxsus taʼsir' },
      { word: 'noaniqlik', definition: 'aniq emaslik' },
      { word: 'oyna', definition: 'aks ettirish' },
      { word: 'vitrina', definition: 'koʻrsatish oynasi' },
      { word: 'hissiy', definition: 'tuygʻuli' },
      { word: 'dekor', definition: 'bezak' },
    ]),
  L('e74', 'Bolalar ekran vaqtini cheklashi kerakmi?',
    `A: Bolalar ekran vaqtini cheklashi kerakmi?
B: Ha, lekin chegara egiluvchan boʻlsin. Qattiq taqiq baʼzan isyon keltiradi.
A: Fon televizori-chi?
B: Fon ham eʼtiborni boʻladi. Oʻqish va oʻyin vaqtida oʻchirish yaxshi.
A: Varaqash odatiga nima deysiz?
B: Uni jazо bilan emas, muqobil bilan yenging: sayr, kitob, oshxona yordami.
A: Ota-ona oʻzi telefonni koʻp ishlatsa?
B: Unda bola nusxa koʻchiradi. Avvalo oʻz chegarangizni koʻrsating.
A: Maqsad nima?
B: Ekran dushman emas; u vosita. Vaqt va mazmun muhim.`,
    [
      { word: 'chegara', definition: 'limit' },
      { word: 'egiluvchan', definition: 'moslashuvchan' },
      { word: 'fon', definition: 'orqa fonda' },
      { word: 'varaqash', definition: 'ekranni varaqlash' },
      { word: 'jazo', definition: 'jazо' },
      { word: 'isyon', definition: 'qarshilik' },
      { word: 'muqobil', definition: 'boshqa variant' },
      { word: 'taqiq', definition: 'man etish' },
      { word: 'nusxa', definition: 'takrorlash' },
      { word: 'vosita', definition: 'asbob' },
      { word: 'mazmun', definition: 'ichki maʼno' },
      { word: 'eʼtibor', definition: 'diqqat' },
    ]),
  L('e75', 'Yaqinda tugatgan eng yaxshi kitobingiz qaysi?',
    `Salom, Olim,

Yaqinda bir roman tugatdim — triller emas, adabiyroq hikoya. Unda ayol eski doʻstiga xat yozadi va oʻtgan xafagarchilikni tuzatishga urinadi. Syujet shovqinli emas, lekin ichimda qoldi.

Kitobni kutubxonadan oldim; chek oʻrniga shtamp bosildi. Avvaliga sekin ketdi, keyin sahifalarni kechqurun kutib qoldim. Qahramonning gʻazabi tanish edi: kichik soʻzlar katta yara ochishi mumkin.

Agar oʻqimoqchi boʻlsang, ayt — nomini yozaman. Bu kitob menga tuzatish kechikishi mumkinligini, lekin urinish kerakligini eslatdi.

Doʻsting,
Nodira`,
    [
      { word: 'roman', definition: 'uzun badiiy asar' },
      { word: 'triller', definition: 'hayajonli janr' },
      { word: 'adabiy', definition: 'badiiy sifatli' },
      { word: 'chek', definition: 'toʻlov qogʻozi' },
      { word: 'xafagarchilik', definition: 'ranjish' },
      { word: 'tuzatish', definition: 'yarashtirish' },
      { word: 'gʻazab', definition: 'jahl' },
      { word: 'shtamp', definition: 'kutubxona belgisi' },
      { word: 'sahifa', definition: 'kitob varagʻi' },
      { word: 'yara', definition: 'ogʻriq' },
      { word: 'nom', definition: 'kitob nomi' },
      { word: 'urinish', definition: 'harakat' },
    ]),
  L('e76', 'Oʻzingiz hikoya yozganmisiz?',
    `Bir marta qisqa hikoya yozdim. Birinchi qoralama notekis edi: baʼzi joylar tez, baʼzilari boʻsh. Keyin qayta koʻrib chiqdim, oxirini oʻzgartirdim. Tasavvur ishladi, lekin sharoit ham kerak edi — tinch stоl, oʻchgan telefon, bir soat vaqt.

Doʻstim oʻqib, «oxiri yumshoqroq boʻlsin» dedi. Men gʻazablanmadim; tuzatdim. Yozish — faqat ilhom emas; u qayta yozish.

Hikoya nashr etilmadi, lekin men uchun muhim edi. U menga oʻz ovozimni koʻrsatdi. Endi yozsam, mukammal boshlashni kutmayman. Avval notekis qoralama, keyin ish.`,
    [
      { word: 'qoralama', definition: 'birinchi yozuv' },
      { word: 'notekis', definition: 'tekis emas' },
      { word: 'qayta koʻrib', definition: 'qayta tahrirlash' },
      { word: 'oxir', definition: 'tugash' },
      { word: 'tasavvur', definition: 'xayol' },
      { word: 'sharoit', definition: 'qulay holat' },
      { word: 'tuzatdim', definition: 'oʻzgartirdim' },
      { word: 'ilhom', definition: 'toʻsatdan kuch' },
      { word: 'ovoz', definition: 'uslub' },
      { word: 'nashr', definition: 'chop etish' },
      { word: 'stol', definition: 'ish stoli' },
      { word: 'vaqt', definition: 'soat' },
    ]),
  L('e77', 'Nega podkastlar doʻstdek tuyuladi?',
    `Podkastlar doʻstdek tuyuladi, chunki ovoz yaqinlik beradi. Odam qulogʻingizda gapiradi — garchi aloqa bir tomonlama boʻlsa ham. Yolgʻizlikda bu yetarli boʻlishi mumkin: siz yolgʻiz emassiz, lekin suhbat majburiy emas.

Yoʻlda ketayotganda orqaga qaytarib, muhim joyni qayta eshitaman. Bu doʻstlik emas, lekin sheriklikka oʻxshaydi. Baʼzi boshlovchilar ohangini shunday tanlaydiki, xuddi kafeda oʻtirgandeksiz.

Albatta, chegara kerak. Podkast yolgʻizlikni yashirishi mumkin. Men baʼzan sukutni ham tanlayman. Lekin uzoq yoʻlda yaxshi podkast — engil hamroh. U savol bermaydi, lekin kunni yumshoqroq qiladi.`,
    [
      { word: 'podkast', definition: 'audio dastur' },
      { word: 'yaqinlik', definition: 'yaqin his' },
      { word: 'bir tomonlama', definition: 'faqat bir tomon' },
      { word: 'yolgʻizlik', definition: 'yolgʻiz qolish' },
      { word: 'orqaga qaytarib', definition: 'qayta tinglash' },
      { word: 'sheriklik', definition: 'birga boʻlish' },
      { word: 'hamroh', definition: 'yoʻldosh' },
      { word: 'ohang', definition: 'ovoz uslubi' },
      { word: 'chegara', definition: 'limit' },
      { word: 'sukut', definition: 'jimlik' },
      { word: 'yoʻl', definition: 'safar' },
      { word: 'yumshoqroq', definition: 'yengilroq' },
    ]),
  L('e78', 'Koʻngilochar narsa doim oʻrgatishi shartmi?',
    `A: Koʻngilochar narsa doim oʻrgatishi shartmi?
B: Yoʻq. Baʼzan quvonchning oʻzi yetarli. Hamma narsa hujjatli film boʻlishi shart emas.
A: Lekin vaqtni behuda ketkazmaymizmi?
B: Dam olish ham foydali. U kuchni tiklaydi. Keyin ish yaxshiroq ketadi.
A: Bilvosita oʻrganish-chi?
B: Ha, komediya ham insoniy narsani oʻrgatishi mumkin. Lekin aybdorlik bilan tomosha qilish — yomon odat.
A: Demak, maqsadsiz kulish mumkinmi?
B: Mumkin. Keyin xohlasangiz, jiddiy narsa tanlang. Muvozanat kerak.
A: Xulosa?
B: Koʻngilochar narsa dars ham, dam ham boʻla oladi. Ikkalasini ham hurmat qiling.`,
    [
      { word: 'koʻngilochar', definition: 'koʻngil ochadigan' },
      { word: 'quvonch', definition: 'xursandlik' },
      { word: 'hujjatli', definition: 'hujjatli film' },
      { word: 'tiklaydi', definition: 'qaytaradi' },
      { word: 'bilvosita', definition: 'toʻgʻridan-toʻgʻri emas' },
      { word: 'aybdorlik', definition: 'gunoh hissi' },
      { word: 'dam', definition: 'dam olish' },
      { word: 'muvozanat', definition: 'muvozanat' },
      { word: 'jiddiy', definition: 'ogʻir mavzu' },
      { word: 'hurmat', definition: 'ehtirom' },
      { word: 'foydali', definition: 'yordam beradigan' },
      { word: 'odat', definition: 'takroriy ish' },
    ]),
  L('e79', 'Qaysi oʻyin dunyolari eng jonli tuyuladi?',
    `Eng jonli tuyulgan oʻyin dunyosi — dengizboʻyi shaharchasi bor sarguzasht oʻyini. NPC lar mening harakatimga reaksiya bildirardi; doʻkonlar yopilardi, yomgʻir kelardi. Kezish missiyadan muhimroq edi. Dunyo qatʼiy edi: agar kechiksangiz, voqea oʻzgarardi.

Men asosiy vazifani shoshilmay, sohil boʻylab yurdim. Muhit ishlardi — tovush, rang, odamlarning gaplari. Bu menga kinodan boshqacha erkinlik berdi.

Jonli dunyo — chiroyli grafikadan koʻra reaksiya. Agar dunyo sizni eslasa, u tirik. Endi oʻyin tanlasam, uzun roʻyxat emas, yashash mumkin boʻlgan joy qidiraman.`,
    [
      { word: 'reaksiya', definition: 'javob harakati' },
      { word: 'kezish', definition: 'erkin yurish' },
      { word: 'dengizboʻyi', definition: 'dengiz yonidagi' },
      { word: 'qatʼiy', definition: 'qoidaga rioya' },
      { word: 'vazifa', definition: 'topshiriq' },
      { word: 'muhit', definition: 'atrof' },
      { word: 'grafika', definition: 'koʻrinish' },
      { word: 'tirik', definition: 'jonli' },
      { word: 'erkinlik', definition: 'erkin tanlov' },
      { word: 'sohil', definition: 'qirgʻoq' },
      { word: 'voqea', definition: 'hodisa' },
      { word: 'yashash', definition: 'boʻlish' },
    ]),
  L('e80', 'Kitobni filmdan afzal koʻrganmisiz?',
    `Baʼzan kitobni filmdan afzal koʻraman, chunki sahifani qayta oʻqish mumkin. Paragraf ichida toʻxtab, oʻylayman. Film esa musiqa bilan suradi; tempo sizniki emas.

Moslashuvlar yaxshi boʻlishi mumkin, lekin sahna qoʻyilishi muallifning jimligini oʻzgartiradi. Kitobda ovoz ichingizda; filmda u tayyor. Ikkalasi ham yaxshi vosita, lekin men sekinroq vositani tanlayman.

Yaqinda sevimli romaning ekran versiyasini koʻrdim. Chiroyli edi, lekin ichimdagi manzara boshqacha qoldi. Shuning uchun baʼzan avval kitob, keyin film. Qayta oʻqish — qayta koʻrishdan chuqurroq boʻlishi mumkin.`,
    [
      { word: 'qayta oʻqish', definition: 'yana oʻqish' },
      { word: 'paragraf', definition: 'matn boʻlagi' },
      { word: 'suradi', definition: 'tez olib ketadi' },
      { word: 'moslashuv', definition: 'ekran versiyasi' },
      { word: 'sahna qoʻyilishi', definition: 'sahnalashtirish' },
      { word: 'vosita', definition: 'ifoda usuli' },
      { word: 'tempo', definition: 'surʼat' },
      { word: 'roman', definition: 'kitob' },
      { word: 'manzara', definition: 'tasavvurdagi koʻrinish' },
      { word: 'jimlik', definition: 'aytilmagan narsa' },
      { word: 'versiya', definition: 'nusxa' },
      { word: 'sekinroq', definition: 'sekin' },
    ]),
];
