/** Agent-authored UZ Elementary e81–e100 */
function L(id, title, text, vocabulary) {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return { id, title, text, vocabulary, targetSeconds: Math.max(45, Math.min(600, Math.round((w / 130) * 60))) };
}

export const lessons = [
  L('e81', 'Rejalaganingizdan koʻproq pul sarflaganmisiz?',
    `Bir marta rejalaganımdan koʻproq pul sarfladim. Doʻkonga «faqat non» deb kirib, impuls bilan yangi quloqchin oldim. Kassa yonida vasvasa kuchli edi; chegirma «bugun oxirgi» derdi. Uyga kelib, afsus boʻldi. Xarid yomon emas edi, lekin byudjetim buzildi.

Endi doʻkonga kirishdan oldin limit yozaman. Agar narsa rejadа boʻlmasa, yigirma daqiqa kutaman. Koʻp impuls oʻtib ketadi. Afsus — yaxshi oʻqituvchi, agar uni eshitsangiz.

Pulni himoya qilish — zavqni yoʻqotish emas. U tanlovni saqlash. Men endi «xohlayman» va «qila olaman»ni ajrataman. Shu kichik pauza meni tinchroq qiladi.`,
    [
      { word: 'sarfladim', definition: 'koʻproq sarfladim' },
      { word: 'impuls', definition: 'toʻsatdan xohish' },
      { word: 'vasvasa', definition: 'undov' },
      { word: 'afsus', definition: 'pushaymonlik' },
      { word: 'xarid', definition: 'sotib olish' },
      { word: 'kassa', definition: 'toʻlov joyi' },
      { word: 'limit', definition: 'chegarа' },
      { word: 'byudjet', definition: 'pul rejasi' },
      { word: 'pauza', definition: 'toʻxtash' },
      { word: 'chegirma', definition: 'narx tushishi' },
      { word: 'himoya', definition: 'asrash' },
      { word: 'tanlov', definition: 'tanlash erkinligi' },
    ]),
  L('e82', 'Har doim eng arzonini olish kerakmi?',
    `A: Har doim eng arzonini olish kerakmi?
B: Yoʻq. Byudjet muhim, lekin qiymat arzonlikdan kengroq.
A: Qimmat narsa yaxshiroqmi?
B: Har doim emas. Baʼzan qimmat moʻrt boʻladi. Men mustahkam poyabzalni tanlayman — uzoqroq xizmat qiladi.
A: Yangilash kerakmi?
B: Agar eski narsa xavfli yoki ishlamasa — ha. Aks holda shoshilmang.
A: Qanday qaror qilasiz?
B: Uch marta soʻrayman: kerakmi, qancha ishlataman, taʼmirlash mumkinmi?
A: Xulosa?
B: Eng arzon baʼzan eng qimmatga tushadi. Qiymat — vaqt, sifat va tinchlik.`,
    [
      { word: 'byudjet', definition: 'pul rejasi' },
      { word: 'qiymat', definition: 'haqiqiy foyda' },
      { word: 'qimmat', definition: 'narxi yuqori' },
      { word: 'moʻrt', definition: 'oson sinadigan' },
      { word: 'yangilash', definition: 'yangi versiya' },
      { word: 'mustahkam', definition: 'bardoshli' },
      { word: 'taʼmirlash', definition: 'tuzatish' },
      { word: 'sifat', definition: 'qandayligi' },
      { word: 'xizmat', definition: 'ishlash muddati' },
      { word: 'qaror', definition: 'tanlov' },
      { word: 'arzon', definition: 'narxi past' },
      { word: 'tinchlik', definition: 'xotirjamlik' },
    ]),
  L('e83', 'Hamyoningizni yoʻqotsangiz nima qilasiz?',
    `Hamyonimni bir marta kafeда yoʻqotdim. Avval vahima keldi, keyin izimni qaytardim: stol, hojatxona, kassa. Topilmagach, kartani bekor qilish uchun bankka qoʻngʻiroq qildim. Yengillik kech keldi — doʻstim sumkamda ekanligini topdi. Men uni oldindan tekshirmagan edim.

Endi chiqishdan oldin choʻntakni tekshiraman. Muhim raqamlarni alohida yozib qoʻyaman. Vahima yordam bermaydi; ketma-ketlik yordam beradi.

Yoʻqotish — dars. U menga sekinlashishni oʻrgatdi. Hamyon kichik, lekin ichidagi ishonch katta. Uni himoya qilish — kun tartibining bir qismi.`,
    [
      { word: 'hamyon', definition: 'pul va kartalar solinadigan narsa' },
      { word: 'vahima', definition: 'kuchli qoʻrquv' },
      { word: 'izimni qaytardim', definition: 'qayta izladim' },
      { word: 'yengillik', definition: 'tinchlanish' },
      { word: 'bekor qilish', definition: 'toʻxtatish' },
      { word: 'oldindan', definition: 'avval' },
      { word: 'ketma-ketlik', definition: 'tartib' },
      { word: 'choʻntak', definition: 'kiyim choʻntagi' },
      { word: 'bank', definition: 'pul muassasasi' },
      { word: 'tekshiraman', definition: 'qarab chiqaman' },
      { word: 'ishonch', definition: 'xavfsizlik' },
      { word: 'himoya', definition: 'asrash' },
    ]),
  L('e84', 'Nega pul tejash topishdan qiyinroq?',
    `Pul tejash topishdan qiyinroq tuyuladi, chunki ortiqcha pul darhol «ruxsat» soʻraydi. Kichik xaridlar kamtarona koʻrinadi, lekin yigʻiladi. Avtomatik oʻtkazma yordam beradi: maosh kelishi bilan bir qismi jamgʻarmaga oʻtadi. Iroda kechqurun charchaydi; tizim charchamaydi.

Men avval «qolganini saqlayman» derdim. Qolmas edi. Endi avval saqlayman, keyin sarflayman. Bu odatiy oʻzgarish.

Tejash — ruxsatni boshqarish. Agar har bir kichik istisno «bir martalik» boʻlsa, jamgʻarma sekin eriydi. Shuning uchun oddiy qoida kerak: avval oʻtkazma, keyin zavq.`,
    [
      { word: 'ortiqcha', definition: 'ortiqcha qolgan' },
      { word: 'ruxsat', definition: 'ijozat' },
      { word: 'kamtarona', definition: 'kichik koʻrinadigan' },
      { word: 'avtomatik', definition: 'oʻz-oʻzidan' },
      { word: 'iroda', definition: 'oʻzini tiyish' },
      { word: 'oʻtkazma', definition: 'pul koʻchirish' },
      { word: 'jamgʻarma', definition: 'saqlangan pul' },
      { word: 'istisno', definition: 'qoidadan chet' },
      { word: 'maosh', definition: 'ish haqi' },
      { word: 'odat', definition: 'tartib' },
      { word: 'sarflayman', definition: 'xarajat qilaman' },
      { word: 'zavq', definition: 'yoqimli narsa' },
    ]),
  L('e85', 'Doʻkonga narsani qaytarganmisiz?',
    `A: Doʻkonga narsani qaytarganmisiz?
B: Ha. Sumka suv oʻtkazardi. Chekni saqlagan edim.
A: Nima qilishdi?
B: Avval almashtirish taklif qilishdi. Keyin nosoz boʻlsa, pulni qaytarish mumkinligini aytishdi.
A: Uyalmadingizmi?
B: Biroz. Lekin isteʼmolchi huquqi bor. Muloyim, lekin aniq gapirdim.
A: Maslahatingiz?
B: Chekni saqlang, nuqsonni koʻrsating, ohangni tinch tuting.
A: Natija?
B: Yangi sumka oldim. Vaqt ketdi, lekin ishonch qaytdi.`,
    [
      { word: 'chek', definition: 'toʻlov hujjati' },
      { word: 'oʻtkazardi', definition: 'suv kiritardi' },
      { word: 'almashtirish', definition: 'boshqasiga almashtirish' },
      { word: 'pulni qaytarish', definition: 'pulni qaytarish' },
      { word: 'nosoz', definition: 'buzilgan' },
      { word: 'isteʼmolchi huquqi', definition: 'xaridor huquqlari' },
      { word: 'nuqson', definition: 'kamchilik' },
      { word: 'muloyim', definition: 'odobli' },
      { word: 'ohang', definition: 'gapirish usuli' },
      { word: 'ishonch', definition: 'ishonch' },
      { word: 'saqlang', definition: 'asrang' },
      { word: 'taklif', definition: 'taklif' },
    ]),
  L('e86', 'Doʻstlar hisobni doim teng boʻlishishi shartmi?',
    `A: Doʻstlar hisobni doim teng boʻlishishi shartmi?
B: Har doim emas. Teng boʻlishish odat, lekin baʼzan nomutanosiblik chiqadi.
A: Biri doim toʻlasa-chi?
B: Unda ranjish toʻplanishi mumkin. Ochiq gaplashish kerak.
A: Saxovat-chi?
B: Saxovat yaxshi, lekin u majburiyatga aylansa, ogʻir. Kelishuv yaxshiroq.
A: Qanday soʻrayman?
B: «Bugun teng qilaylikmi yoki navbat bilanmi?» Oddiy savol.
A: Maqsad?
B: Doʻstlik matematikadan muhim, lekin adolat ham muhim. Muvozanat toping.`,
    [
      { word: 'boʻlishish', definition: 'boʻlib toʻlash' },
      { word: 'teng', definition: 'bir xil' },
      { word: 'ranjish', definition: 'xafa boʻlish' },
      { word: 'nomutanosiblik', definition: 'teng emaslik' },
      { word: 'saxovat', definition: 'qoʻli ochiqlik' },
      { word: 'odat', definition: 'urf' },
      { word: 'majburiyat', definition: 'majburiy his' },
      { word: 'kelishuv', definition: 'kelishib olish' },
      { word: 'navbat', definition: 'ketma-ketlik' },
      { word: 'adolat', definition: 'toʻgʻrilik' },
      { word: 'muvozanat', definition: 'muvozanat' },
      { word: 'hisob', definition: 'toʻlov' },
    ]),
  L('e87', 'Topgan eng yaxshi arzon xaridıngiz qaysi?',
    `Eng yaxshi arzon xiridim — ishlatilgan doʻkondagi rasm romi va asboblar toʻplami. Narxi past edi, lekin tekshirib oldim: burchaklar tekis, vintlar joyida. Uyda qoʻydim — eshikning gʻichirlashi kamaydi, chunki yogʻlash uchun moy topildi.

Arzon xarid baxt emas; eʼtibor. Men avval shoshib olardim, keyin afsus qilardim. Endi tekshiraman, soʻrayman, kerakligini oʻylayman.

Ishlatilgan narsa yangi hayot beradi. Bu ekologik ham, tejamkor ham. Eng yaxshi bitim — arzon va ishlaydigan narsa.`,
    [
      { word: 'arzon xarid', definition: 'foydali arzon olish' },
      { word: 'ishlatilgan', definition: 'ikkinchi qoʻl' },
      { word: 'rom', definition: 'rasm ramkasi' },
      { word: 'asboblar toʻplami', definition: 'asboblar majmui' },
      { word: 'gʻichirlashi', definition: 'ovoz chiqarishi' },
      { word: 'tekshirib', definition: 'koʻrib chiqib' },
      { word: 'bitim', definition: 'foydali xarid' },
      { word: 'tejamkor', definition: 'pul tejaydigan' },
      { word: 'ekologik', definition: 'tabiatga yaxshi' },
      { word: 'vint', definition: 'qotirgich' },
      { word: 'moy', definition: 'yogʻlash moyi' },
      { word: 'eʼtibor', definition: 'diqqat' },
    ]),
  L('e88', 'Doʻstdan qarz olganmisiz?',
    `Salom, Kamola,

Oʻtgan oy sening yordaming uchun yana rahmat. Ish haqi kechikganda qarz soʻrash noqulay edi, lekin sen tinch munosabat bildirDing. Pulni kelishgan kuni oʻtkazdim. Eslatma yubormading — bu ishonchni oshirdi.

Agar kimdir rad etsa, bu doʻstlikning oxiri emas. Baʼzan imkon yoʻq. Men ham endi qarz berishdan oldin aniq sana soʻrayman. Noqulaylikni ochiq aytish yaxshiroq.

Yana bir bor rahmat. Choy ichishga qarzdorman — bu safar men toʻlayman.

Doʻsting,
Sardor`,
    [
      { word: 'qarz', definition: 'vaqtincha olingan pul' },
      { word: 'ish haqi', definition: 'maosh' },
      { word: 'oʻtkazdim', definition: 'pul yubordim' },
      { word: 'eslatma', definition: 'eslatib qoʻyish' },
      { word: 'rad etsa', definition: 'yoʻq desa' },
      { word: 'noqulay', definition: 'biroz noqulay' },
      { word: 'sana', definition: 'qaytarish kuni' },
      { word: 'ishonch', definition: 'ishonch' },
      { word: 'imkon', definition: 'imkoniyat' },
      { word: 'ochiq', definition: 'rost' },
      { word: 'doʻstlik', definition: 'doʻstlik' },
      { word: 'toʻlayman', definition: 'toʻlov qilaman' },
    ]),
  L('e89', 'Nega kichik xarajatlar tez yigʻiladi?',
    `Kichik xarajatlar tez yigʻiladi, chunki ular yolgʻizlikda zararsiz koʻrinadi. Bir choy, bir ilova, bir «istisno» — niqoblangan. Agar ularni alohida qarasangiz, kichik; oy oxirida esa katta.

Men endi ongli baholayman: haftalik taxmin yozaman. Onglilik oʻzgartiradi. «Faqat bugun» degan ovozni eshitib, soʻrayman: bu odatmi?

Yolgʻiz qarorlar zanjir boʻladi. Shuning uchun kichik narsani ham yozish foydali. Raqam koʻringach, tanlov osonlashadi. Tejamkorlik katta voz kechish emas; u kichik niqoblarni ochish.`,
    [
      { word: 'niqoblangan', definition: 'yashirilgan' },
      { word: 'istisno', definition: 'bir martalik deb aytilgan' },
      { word: 'yolgʻizlik', definition: 'alohida holat' },
      { word: 'ongli', definition: 'oʻylab' },
      { word: 'taxmin', definition: 'taxminiy hisob' },
      { word: 'onglilik', definition: 'anglash' },
      { word: 'zanjir', definition: 'ketma-ketlik' },
      { word: 'odat', definition: 'takror' },
      { word: 'raqam', definition: 'son' },
      { word: 'tanlov', definition: 'qaror' },
      { word: 'tejamkorlik', definition: 'tejash' },
      { word: 'niqob', definition: 'yashirish' },
    ]),
  L('e90', 'Telefoningiz buzilsa nima qilasiz?',
    `Telefonim bir kuni muzlab qoldi — ekran yaltiroq, lekin javob yoʻq. Avval oʻchirib yoqdim, keyin taʼmirga olib bordim. Ular «almashtirish kerak» deyishdi. Men zaxira kodlarimni topib, maʼlumotni qayta tikladim. Yangi apparat olishdan oldin narx va kafolatni solishtirdim.

Muzlash vahima keltiradi, chunki hayot ichida. Lekin reja bor: zaxira, muhim raqamlar qogʻozda, sekin qaror. Yaltiroq reklama shoshiltirmasin.

Endi haftada bir marta zaxira qilaman. Telefon buzilishi oxiri emas; u tekshiruv. Tayyor boʻlgan odam tinchroq yuradi.`,
    [
      { word: 'muzlab', definition: 'ishlamay qolib' },
      { word: 'taʼmir', definition: 'tuzatish' },
      { word: 'almashtirish', definition: 'yangi olish' },
      { word: 'zaxira kod', definition: 'tiklash kodi' },
      { word: 'yaltiroq', definition: 'porloq' },
      { word: 'apparат', definition: 'telefon' },
      { word: 'qayta tikladim', definition: 'qayta tikladim' },
      { word: 'kafolat', definition: 'kafolat' },
      { word: 'vahima', definition: 'qoʻrquv' },
      { word: 'reklama', definition: 'reklama' },
      { word: 'zaxira', definition: 'nusxa' },
      { word: 'tekshiruv', definition: 'sinov' },
    ]),
  L('e91', 'Hozir qaysi maqsad sari ishlayapsiz?',
    `Hozir til sertifikati sari ishlayapman. Bu yaltiroq maqsad emas, lekin ishonchli. Motivatsiya baʼzan soʻnadi, shuning uchun ish varagʻi tutaman: har kuni oʻn daqiqa tinglash, oʻn daqiqa yozish. Noaniq maqsad («yaxshiroq boʻlish») meni toʻxtatardi; aniq reja yuritadi.

Maqsad ishonarli boʻlishi kerak. Juda katta boʻlsa, kechikadi; juda kichik boʻlsa, zerikadi. Men oʻrtani tanladim.

Hafta oxirida nima qilganimni belgilayman. Bu kichik nishon. Yaltiroq emas — ishlaydi.`,
    [
      { word: 'sertifikat', definition: 'rasmiy hujjat' },
      { word: 'yaltiroq', definition: 'koʻzni qamashtiradigan' },
      { word: 'ishonchli', definition: 'ishonchli' },
      { word: 'motivatsiya', definition: 'undov' },
      { word: 'ish varagʻi', definition: 'mashq varagʻi' },
      { word: 'noaniq', definition: 'aniq emas' },
      { word: 'ishonarli', definition: 'bajarish mumkin' },
      { word: 'reja', definition: 'tartib' },
      { word: 'nishon', definition: 'kichik gʻalaba' },
      { word: 'tinglash', definition: 'tinglash' },
      { word: 'yozish', definition: 'yozish' },
      { word: 'belgilayman', definition: 'yozib qoʻyaman' },
    ]),
  L('e92', 'Reja haqida fikringizni oʻzgartirganmisiz?',
    `Bir marta sayohat rejasini toʻsatdan oʻzgartirdim. Chipta bor edi, lekin oilada kasallik chiqdi. Orqaga qaytarish biroz uyatli tuyuldi — «qatʼiy emasman» degandek. Lekin zarur edi. Doʻstlarim tushundi; yangilangan reja tinchroq edi.

Qatʼiylik baʼzan yaxshi, baʼzan esa zarar. Izchillik — notoʻgʻri yoʻlda yugurish demak emas. Fikringizni oʻzgartirish — oʻsish belgisidir, agar sabab rost boʻlsa.

Endi katta reja tuzsam, «agar boʻlmasa» qatorini yozaman. Bu meni yumshoqroq, lekin aqlliroq qiladi.`,
    [
      { word: 'oʻzgartirdim', definition: 'orqaga burdim' },
      { word: 'uyatli', definition: 'xijolatli' },
      { word: 'zarur', definition: 'kerak' },
      { word: 'yangilangan', definition: 'yangilangan' },
      { word: 'qatʼiy', definition: 'oʻzgarmas' },
      { word: 'izchillik', definition: 'bir xillik' },
      { word: 'belgi', definition: 'ishora' },
      { word: 'rost', definition: 'haqiqiy' },
      { word: 'qator', definition: 'band' },
      { word: 'sabab', definition: 'nima uchun' },
      { word: 'sayohat', definition: 'safar' },
      { word: 'tushundi', definition: 'tushundi' },
    ]),
  L('e93', 'Nega ulgʻayish koʻrinishidan sekinroq?',
    `Ulgʻayish koʻrinishidan sekinroq, chunki marosimlar tez, kamolot esa dogʻ-dogʻ. Bitiruv bir kunda boʻladi; sabr yillar davomida oʻsadi. Shoshilinchlik yolgʻon signal beradi: «endi tayyorman». Aslida koʻp narsa tugallanmagan qoladi — va bu normal.

Men yigirma beshda «hamma narsani bilaman» deb oʻylardim. Keyin tushundim: bilish — qatlam. Har yili yangi qatlam ochiladi.

Sabr — sekinlikni qabul qilish. Ulgʻayish fotografiyа emas; u video. Toʻxtang, qarang, shoshilmang.`,
    [
      { word: 'marosim', definition: 'rasmiy tadbir' },
      { word: 'kamolot', definition: 'yetuklik' },
      { word: 'dogʻ-dogʻ', definition: 'notekis' },
      { word: 'shoshilinchlik', definition: 'shoshish' },
      { word: 'sabr', definition: 'kutish' },
      { word: 'tugallanmagan', definition: 'tugamagan' },
      { word: 'qatlam', definition: 'qatlam' },
      { word: 'signal', definition: 'ishora' },
      { word: 'yetuklik', definition: 'kattalik' },
      { word: 'normal', definition: 'oddiy' },
      { word: 'sekinlik', definition: 'sekin jarayon' },
      { word: 'qabul', definition: 'tan olish' },
    ]),
  L('e94', 'Odamlar yillik maqsad qoʻyishi kerakmi?',
    `A: Odamlar yillik maqsad qoʻyishi kerakmi?
B: Foydali boʻlishi mumkin, agar moslashuvchan boʻlsa. Qattiq reja baʼzan tashlab ketishga olib keladi.
A: Unda nima qilay?
B: Yoʻnalish tanlang, ustuvorlikni yozing. Mavzu boʻlsin: sogʻliq, oʻqish, oila.
A: Har oynа tekshiraymi?
B: Ha. Kichik tuzatish — yil oxiridagi afsusdan yaxshiroq.
A: Muvaffaqiyatsizlik-chi?
B: Maqsadni tashlamang; shaklini oʻzgartiring.
A: Xulosa?
B: Yillik maqsad kompаs; zanjir emas. Yoʻnalish beradi, boʻgʻmaydi.`,
    [
      { word: 'moslashuvchan', definition: 'oʻzgarishga ochiq' },
      { word: 'yoʻnalish', definition: 'tomon' },
      { word: 'tashlab', definition: 'tashlab yuborish' },
      { word: 'ustuvorlik', definition: 'muhim narsa' },
      { word: 'qattiq', definition: 'egilmas' },
      { word: 'mavzu', definition: 'asosiy yoʻnalish' },
      { word: 'tuzatish', definition: 'oʻzgartirish' },
      { word: 'shakl', definition: 'koʻrinish' },
      { word: 'kompas', definition: 'yoʻl koʻrsatgich' },
      { word: 'zanjir', definition: 'qamoq' },
      { word: 'afsus', definition: 'pushaymon' },
      { word: 'yillik', definition: 'bir yillik' },
    ]),
  L('e95', 'Qilgan eng jasur oʻzgarishingiz qaysi?',
    `Eng jasur oʻzgarishim — barqaror, lekin meni ezayotgan ishdan ketish. Oylik yaxshi edi, lekin ertalab kayfiyatim yassilanardi. Isteʼfo xati yozishdan oldin shubha koʻp edi. Ariza, hujjatlar, maʼmuriy ishlar charchatdi. Lekin ketganimdan keyin nafas oldim.

Jasorat baʼzan baland ovoz emas; u tinch qaror. Men yangi ish qidirdim, kursga yozildim, oilamga rost gapirdim. Shubha qoldi, lekin u endi yoʻlni toʻsmaydi.

Oʻzgarish qulay emas. U kerak boʻlganda qilinadi.`,
    [
      { word: 'barqaror', definition: 'barqaror ish' },
      { word: 'yassilanardi', definition: 'bosilib ketardi' },
      { word: 'isteʼfo', definition: 'ishdan ketish' },
      { word: 'shubha', definition: 'ikkilanish' },
      { word: 'ariza', definition: 'rasmiy soʻrov' },
      { word: 'maʼmuriy', definition: 'hujjat ishlari' },
      { word: 'jasorat', definition: 'jasurlik' },
      { word: 'qaror', definition: 'tanlov' },
      { word: 'rost', definition: 'haqiqat' },
      { word: 'nafas', definition: 'yengillik' },
      { word: 'kurs', definition: 'oʻqish' },
      { word: 'oʻzgarish', definition: 'oʻzgarish' },
    ]),
  L('e96', 'Yiqilib, yana urinib koʻrganmisiz?',
    `Salom, Aziz,

Imtihondan yiqilganingni eshitdim. Birinchi urinishdagi ogʻriqni bilaman. Men ham bir marta yiqildim, keyin tahlil qildim: qayerda zaif edim, qayerda shoshildim. Transcriptni ochib, xatolarni belgiladim. Qatʼiyat va magʻrurlik aralashdi — lekin qayta topshirdim.

Agar xohlasang, birga reja tuzamiz. Kichik boʻlaklarga boʻlamiz. Yiqilish oxiri emas; u maʼlumot.

Sen yolgʻiz emassan. Yoz.

Lola`,
    [
      { word: 'urinish', definition: 'harakat' },
      { word: 'ogʻriq', definition: 'achchiq his' },
      { word: 'tahlil', definition: 'tekshiruv' },
      { word: 'transcript', definition: 'natija varagʻi' },
      { word: 'qatʼiyat', definition: 'qatʼiy turish' },
      { word: 'magʻrurlik', definition: 'oʻzini hurmat' },
      { word: 'yiqilish', definition: 'muvaffaqiyatsizlik' },
      { word: 'zaif', definition: 'kuchsiz joy' },
      { word: 'topshirdim', definition: 'qayta topshirdim' },
      { word: 'reja', definition: 'tartib' },
      { word: 'boʻlak', definition: 'qism' },
      { word: 'maʼlumot', definition: 'bilim' },
    ]),
  L('e97', 'Nega baʼzi odatlar yopishadi, baʼzilari yoʻq?',
    `Baʼzi odatlar yopishadi, chunki ular kundalik langarga bogʻlanadi: tish tozalashdan keyin ip, qahvadan oldin suv. Langarsiz odat suzib ketadi. Men «har kuni sport» deb yozardim, lekin vaqt belgilamasdim — shuning uchun yoʻqoldi.

Shaxsiyat ham muhim. «Men tartibli odamman» desangiz, odat osonroq yopishadi. Aybdorlik va olqish esa zaif yonilgʻi: ular tez soʻnadi.

Yaxshi odat kichik, aniq, langarli boʻlsin. Shunda u qoladi.`,
    [
      { word: 'langar', definition: 'bogʻlanadigan odat' },
      { word: 'suzib', definition: 'yoʻqolib' },
      { word: 'ip', definition: 'tish ipi' },
      { word: 'shaxsiyat', definition: 'kimlik' },
      { word: 'aybdorlik', definition: 'gunoh hissi' },
      { word: 'olqish', definition: 'maqtov' },
      { word: 'yopishadi', definition: 'saqlanadi' },
      { word: 'vaqt', definition: 'soat' },
      { word: 'aniq', definition: 'ravshan' },
      { word: 'yonilgʻi', definition: 'kuch manbai' },
      { word: 'soʻnadi', definition: 'yoʻqoladi' },
      { word: 'tartibli', definition: 'intizomli' },
    ]),
  L('e98', 'Muvaffaqiyat hamma uchun bir xil koʻrinishimi kerak?',
    `A: Muvaffaqiyat hamma uchun bir xil koʻrinishimi kerak?
B: Yoʻq. Hasad koʻpincha boshqa odamning oʻlchovidan keladi.
A: Lekin jamiyat bitta mezon qoʻymaydimi?
B: Qoʻyadi: pul, unvon, tezlik. Bu anʼanaviy timeline. Lekin majburiyat emas.
A: Hayratni qanday ajrataman?
B: «Men ham shuni xohlaymanmi?» deb soʻrang. Baʼzan hayrat — yoʻl koʻrsatadi, baʼzan shovqin.
A: Oʻz mezonimni qanday tanlayman?
B: Qadriyatlaringizni yozing. Keyin kichik belgilarni qoʻying.
A: Xulosa?
B: Muvaffaqiyat shaxsiy xarita. Boshqa xaritani nusxa qilish shart emas.`,
    [
      { word: 'hasad', definition: 'boshqaga rashk' },
      { word: 'mezon', definition: 'oʻlchov' },
      { word: 'majburiyat', definition: 'majburiy narsa' },
      { word: 'hayrat', definition: 'hayron qolish' },
      { word: 'anʼanaviy', definition: 'odatdagi' },
      { word: 'timeline', definition: 'vaqt chizigʻi' },
      { word: 'qadriyat', definition: 'muhim narsa' },
      { word: 'belgi', definition: 'nishon' },
      { word: 'xarita', definition: 'yoʻl' },
      { word: 'unvon', definition: 'lavozim' },
      { word: 'nusxa', definition: 'koʻchirma' },
      { word: 'oʻlchov', definition: 'baho' },
    ]),
  L('e99', 'Kelasi yil nima qilishni boshqacha qilasiz?',
    `Kelasi yil dam olishni himoya qilaman. Bu yil koʻp taklifni qabul qildim va keyin charchadim. Endi «qila olamanmi?» emas, «mendа kuch bormi?» deb soʻrayman. Bu qayta ixtiro emas — oddiy qayta dizayn.

Yangi yil qarori baʼzan shovqinli boʻladi. Men esa bitta aniq oʻzgarish tanlayman: haftada bir kecha telefonsiz. Kichik, lekin saqlanadigan.

Agar reja qimmatga tushsa, uni soddalashtiraman. Oʻzgarish puldan koʻra eʼtiborga muhtoj. Kelasi yil men shoshilishni kamaytiraman.`,
    [
      { word: 'himoya', definition: 'asrash' },
      { word: 'taklif', definition: 'chaqiriq' },
      { word: 'qila olamanmi', definition: 'imkon' },
      { word: 'qayta ixtiro', definition: 'butunlay yangilash' },
      { word: 'qaror', definition: 'yangi yil vaʼdasi' },
      { word: 'qayta dizayn', definition: 'qayta tuzish' },
      { word: 'soddalashtiraman', definition: 'oddiylashtiraman' },
      { word: 'eʼtibor', definition: 'diqqat' },
      { word: 'charchadim', definition: 'holdan toydim' },
      { word: 'saqlanadigan', definition: 'davom etadigan' },
      { word: 'shoshilish', definition: 'shoshish' },
      { word: 'oʻzgarish', definition: 'oʻzgarish' },
    ]),
  L('e100', 'Oʻsganingizni qanday bilasiz?',
    `Oʻsganimni his emas, dalil bilan bilaman. Avval bahsda darhol himoya qilardim; endi aniqlovchi savol beraman. Avval har gapni mashq qilib yod olar dim; endi tinchroq tinglayman. Oʻzini tutish oʻzgardi: tiyilish paydo boʻldi.

Oʻsish kompozitsiya emas; u kichik tanlovlar. Keчikkan javob, yumshoq ohang, «bilmayman» deyish. Bu jasoratning yangi shakli.

Agar oʻtgan yilgi oʻzingiz bilan gaplashsangiz, nima degan boʻlardingiz? Men «sekinlash, bir aniq savol ber» derdim. Shu gap — oʻsish belgisi.`,
    [
      { word: 'dalil', definition: 'isbot' },
      { word: 'mashq', definition: 'takror' },
      { word: 'himoya', definition: 'oʻzini himoya' },
      { word: 'tiyilish', definition: 'oʻzini tiyish' },
      { word: 'oʻzini tutish', definition: 'xulq' },
      { word: 'aniqlovchi', definition: 'ochuvchi' },
      { word: 'ohang', definition: 'gapirish usuli' },
      { word: 'belgi', definition: 'ishora' },
      { word: 'tinglayman', definition: 'eshitaman' },
      { word: 'tanlov', definition: 'qaror' },
      { word: 'jasorat', definition: 'jasurlik' },
      { word: 'sekinlash', definition: 'sekinlash' },
    ]),
];
