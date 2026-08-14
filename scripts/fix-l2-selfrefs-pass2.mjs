/**
 * Pass 2: mop leftover English self-refs + rewrite p45 language-history passages.
 * Usage: node scripts/fix-l2-selfrefs-pass2.mjs [--dry]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const DRY = process.argv.includes('--dry');

/** Accurate-enough short L2 language-history blurbs (Beginner/Pre-Int length). */
const P45 = {
  ru: {
    title: 'История русского языка',
    text:
      'Русский язык — один из самых распространённых языков мира, и у него богатая история. Он развился из древнерусского языка восточных славян. Важную роль сыграл церковнославянский язык, который пришёл вместе с письменностью. Позже русский язык вобрал много слов из тюркских, греческих, латинских, немецких и французских источников. В XVIII–XIX веках литературная норма укрепилась благодаря писателям и учёным. Сегодня на русском говорят миллионы людей, и язык продолжает меняться вместе с обществом и технологиями.',
  },
  uk: {
    title: 'Історія української мови',
    text:
      'Українська мова має глибоке історичне коріння серед східнослов’янських мов. Вона розвивалася з давніх діалектів і довго зберігала багату усну традицію. Важливими етапами стали формування літературної мови та вплив церковнослов’янської писемності. У різні періоди українська мова взаємодіяла з польською, турецькою, німецькою та іншими мовами. У XIX–XX століттях письменники й мовознавці зміцнили сучасну норму. Сьогодні українська активно розвивається в освіті, медіа та інтернеті.',
  },
  es: {
    title: 'La historia del idioma español',
    text:
      'El español es una lengua global con una historia compleja. Nació del latín hablado en la península ibérica y se enriqueció con palabras árabes durante siglos de contacto cultural. Más tarde se extendió por América y otras regiones del mundo. Durante el Siglo de Oro, escritores y gramáticos ayudaron a fijar una norma literaria. Hoy el español sigue evolucionando y lo hablan cientos de millones de personas en muchos países.',
  },
  de: {
    title: 'Die Geschichte der deutschen Sprache',
    text:
      'Deutsch ist eine germanische Sprache mit einer langen Geschichte. Althochdeutsch und Mittelhochdeutsch waren frühe Stufen, bevor sich eine neuhochdeutsche Schriftsprache entwickelte. Die Erfindung des Buchdrucks und Luthers Bibelübersetzung förderten eine gemeinsame Standardsprache. Deutsch hat auch viele Wörter aus dem Lateinischen, Französischen und anderen Sprachen aufgenommen. Heute sprechen Millionen Menschen Deutsch, und die Sprache verändert sich weiter durch Medien und Technik.',
  },
  fr: {
    title: "L'histoire de la langue française",
    text:
      "Le français est une langue romane née du latin parlé en Gaule. Au Moyen Âge, plusieurs dialectes existaient; le francien d'Île-de-France a progressivement gagné en prestige. La Renaissance et l'Académie française ont contribué à stabiliser la norme écrite. Le français a emprunté des mots à d'autres langues et s'est diffusé sur plusieurs continents. Aujourd'hui, il reste une langue mondiale de la culture, de la diplomatie et de l'éducation.",
  },
  it: {
    title: 'La storia della lingua italiana',
    text:
      "L'italiano deriva dal latino e si è sviluppato dai dialetti della penisola. La tradizione letteraria di Dante, Petrarca e Boccaccio diede prestigio al toscano. Nei secoli successivi, grammatici e scrittori aiutarono a formare una lingua comune. L'italiano ha anche preso parole da altre lingue europee. Oggi è parlato da milioni di persone e continua a evolversi con i media e la tecnologia.",
  },
  pt: {
    title: 'A história da língua portuguesa',
    text:
      'O português nasceu do latim falado na Península Ibérica e desenvolveu-se a partir do galego-português medieval. Com as navegações, espalhou-se pelo Brasil, África e Ásia. Ao longo do tempo, recebeu influências de línguas indígenas, africanas e europeias. Escritores e gramáticos ajudaram a consolidar a norma literária. Hoje o português é falado por centenas de milhões de pessoas e continua a mudar com a sociedade moderna.',
  },
  nl: {
    title: 'De geschiedenis van de Nederlandse taal',
    text:
      'Nederlands is een West-Germaanse taal met wortels in het Oudnederlands. In de Middeleeuwen ontstonden regionale varianten, en later groeide een gemeenschappelijke standaardtaal. De Statenbijbel en de drukpers speelden een belangrijke rol. Nederlands heeft woorden ontleend aan het Frans, Latijn, Duits en Engels. Vandaag spreken miljoenen mensen Nederlands in Nederland, België en Suriname, en de taal blijft evolueren.',
  },
  pl: {
    title: 'Historia języka polskiego',
    text:
      'Język polski należy do grupy języków zachodniosłowiańskich. Rozwijał się ze staropolszczyzny, a ważną rolę odegrała literatura i druk. Przez wieki polski zapożyczał słowa z łaciny, niemieckiego, francuskiego i innych języków. W XIX wieku pisarze i uczeni umacniali nowoczesną normę literacką. Dziś polski jest językiem milionów ludzi i nadal się zmienia wraz z kulturą i technologią.',
  },
  cs: {
    title: 'Historie českého jazyka',
    text:
      'Čeština patří mezi západoslovanské jazyky a má bohatou historii. Vyvíjela se ze staroslověnských a staročeských kořenů. Významnou roli hrála literatura, knihtisk a národní obrození. Čeština přejímala slova z němčiny, latiny a dalších jazyků. Dnes ji používají miliony lidí a jazyk se dál mění s médii a technologií.',
  },
  ro: {
    title: 'Istoria limbii române',
    text:
      'Limba română este o limbă romanică descendentă din latina vorbită în Dacia. De-a lungul secolelor a preluat cuvinte din slavă, greacă, turcă, maghiară, franceză și alte limbi. Scriitorii și cărturarii au contribuit la formarea normei literare moderne. Astăzi româna este vorbită de milioane de oameni și continuă să evolueze odată cu societatea.',
  },
  sv: {
    title: 'Det svenska språkets historia',
    text:
      'Svenska är ett nordgermanskt språk med rötter i fornnordiskan. Under medeltiden och tidigmodern tid växte en gemensam skriftspråksnorm fram. Bibeln och boktryckarkonsten bidrog till standardisering. Svenskan har lånat ord från tyska, franska, latin och engelska. Idag talas svenska av miljoner människor och språket fortsätter att förändras.',
  },
  tr: {
    title: 'Türkçenin tarihi',
    text:
      'Türkçe, Türk dilleri ailesine ait köklü bir dildir. Eski Türk yazıtlarından Osmanlı Türkçesine uzanan uzun bir yolu vardır. Zaman içinde Arapça, Farsça ve Avrupa dillerinden birçok sözcük almıştır. Cumhuriyet döneminde dilde sadeleşme ve standart yazım güçlenmiştir. Bugün Türkçe milyonlarca insan tarafından konuşulmakta ve teknolojiyle birlikte değişmeye devam etmektedir.',
  },
  id: {
    title: 'Sejarah Bahasa Indonesia',
    text:
      'Bahasa Indonesia tumbuh dari bahasa Melayu yang lama dipakai sebagai lingua franca di Nusantara. Pada abad ke-20, bahasa ini ditetapkan sebagai bahasa nasional dan dikembangkan untuk pendidikan serta pemerintahan. Bahasa Indonesia meminjam kata dari Sansekerta, Arab, Belanda, Portugis, dan bahasa daerah. Hari ini dipakai oleh ratusan juta orang dan terus berkembang bersama media serta teknologi.',
  },
  ms: {
    title: 'Sejarah Bahasa Melayu',
    text:
      'Bahasa Melayu mempunyai sejarah panjang sebagai bahasa perdagangan dan budaya di Alam Melayu. Ia berkembang melalui batu bersurat, kesusasteraan klasik, dan hubungan dengan bahasa Sanskrit, Arab, dan Eropah. Pada zaman moden, Bahasa Melayu menjadi bahasa rasmi dan bahasa pendidikan. Hari ini bahasa ini terus berubah dengan pengaruh media dan teknologi.',
  },
  vi: {
    title: 'Lịch sử tiếng Việt',
    text:
      'Tiếng Việt thuộc ngữ hệ Nam Á và có lịch sử lâu dài. Trải qua nhiều giai đoạn, tiếng Việt chịu ảnh hưởng từ tiếng Hán và sau này từ tiếng Pháp cùng các ngôn ngữ khác. Chữ Quốc ngữ dựa trên bảng chữ cái Latin đã giúp chuẩn hóa việc đọc và viết. Ngày nay tiếng Việt được hàng chục triệu người sử dụng và tiếp tục phát triển cùng xã hội hiện đại.',
  },
  th: {
    title: 'ประวัติภาษาไทย',
    text:
      'ภาษาไทยมีประวัติยาวนานในตระกูลไท และพัฒนามาพร้อมกับอารยธรรมสุโขทัย อยุธยา และรัตนโกสินทร์ อักษรไทยได้รับการพัฒนาเพื่อบันทึกภาษาอย่างเป็นระบบ ภาษาไทยรับคำยืมจากบาลี สันสกฤต เขมร จีน และภาษาตะวันตก ปัจจุบันมีผู้ใช้ภาษาไทยหลายสิบล้านคน และภาษายังคงเปลี่ยนแปลงตามสื่อและเทคโนโลยี',
  },
  ja: {
    title: '日本語の歴史',
    text:
      '日本語には長い歴史があります。古代の言葉から始まり、漢字の伝来とともに表記の仕組みが大きく変わりました。その後、ひらがなやカタカナが発達し、文学や教育の中で共通の書き言葉が形成されました。日本語は中国語などから多くの語彙を取り入れ、近代には西洋の言葉も増えました。今日もメディアや技術とともに変化し続けています。',
  },
  ko: {
    title: '한국어의 역사',
    text:
      '한국어는 오랜 역사를 가진 언어입니다. 고대부터 다양한 표기 방법이 쓰였고, 훈민정음 창제 이후 한글이 널리 퍼졌습니다. 역사 속에서 중국어 등 다른 언어의 어휘도 받아들였습니다. 근현대에 들어 표준어와 맞춤법이 정비되었고, 오늘날 한국어는 교육·미디어·인터넷에서 활발히 쓰이며 계속 변화하고 있습니다.',
  },
  zh: {
    title: '中文的历史',
    text:
      '中文有着非常悠久的历史。汉字体系经过甲骨文、金文、篆书等阶段逐渐发展，成为记录汉语的重要工具。普通话以北方话为基础，并在现代教育与媒体中广泛使用。中文在不同时代吸收了其他语言的词汇，也影响了许多周边语言。今天，全球有数以亿计的人使用中文，它仍在随着社会与科技不断发展。',
  },
  ar: {
    title: 'تاريخ اللغة العربية',
    text:
      'اللغة العربية لغة سامية عريقة ذات تاريخ طويل. ازدهرت عبر الشعر الجاهلي ثم القرآن الكريم الذي ثبّت فصاحة العربية الفصحى. ومع انتشار الإسلام امتدت العربية إلى مناطق واسعة وتفاعلت مع لغات أخرى. في العصر الحديث تطورت الصحافة والتعليم والمعاجم لتثبيت معايير الكتابة. واليوم يتحدث العربية ملايين الناس وتواصل التطور مع الإعلام والتقنية.',
  },
  fa: {
    title: 'تاریخ زبان فارسی',
    text:
      'زبان فارسی پیشینه‌ای دراز در خانوادهٔ زبان‌های ایرانی دارد. از فارسی باستان و میانه تا فارسی دری، این زبان مسیر درازی پیموده است. ادبیات کلاسیک نقش مهمی در تثبیت هنجار ادبی داشت و فارسی واژه‌هایی از عربی و زبان‌های دیگر وام گرفت. امروز میلیون‌ها نفر به فارسی سخن می‌گویند و زبان همچنان با جامعه و فناوری دگرگون می‌شود.',
  },
  ur: {
    title: 'اردو زبان کی تاریخ',
    text:
      'اردو ایک ہند-آریائی زبان ہے جس کی تشکیل شمالی برصغیر میں ہوئی۔ اس نے فارسی، عربی، ترکی اور مقامی زبانوں سے الفاظ لیے۔ ادب، صحافت اور تعلیم نے معیاری اردو کو مضبوط کیا۔ آج اردو لاکھوں لوگوں کی زبان ہے اور میڈیا و ٹیکنالوجی کے ساتھ بدلتی رہتی ہے۔',
  },
  hi: {
    title: 'हिन्दी भाषा का इतिहास',
    text:
      'हिन्दी एक इंडो-आर्यन भाषा है जिसका विकास मध्य काल की बोलियों से हुआ। भक्ति साहित्य और आधुनिक गद्य ने मानक हिन्दी को आकार दिया। हिन्दी ने संस्कृत, फारसी, अरबी और अंग्रेज़ी सहित कई स्रोतों से शब्द लिए। आज करोड़ों लोग हिन्दी बोलते हैं और यह शिक्षा तथा मीडिया के साथ आगे बढ़ रही है।',
  },
  el: {
    title: 'Η ιστορία της ελληνικής γλώσσας',
    text:
      'Η ελληνική είναι μία από τις αρχαιότερες γλώσσες με γραπτή παράδοση. Από τα αρχαία ελληνικά πέρασε στην ελληνιστική κοινή και αργότερα στα μεσαιωνικά και νέα ελληνικά. Η γλώσσα επηρεάστηκε από λατινικά, τουρκικά και άλλες γλώσσες σε διάφορες εποχές. Σήμερα τα ελληνικά μιλιούνται από εκατομμύρια ανθρώπους και συνεχίζουν να εξελίσσονται.',
  },
  uz: {
    title: "O'zbek tilining tarixi",
    text:
      "O'zbek tili turkiy tillar oilasiga mansub. U qadimgi turkiy yozma meros va o'rta asr adabiy an'analari asosida shakllangan. Tarix davomida arab, fors va rus tillaridan ko'plab so'zlar o'zlashgan. XX asrda milliy adabiy norma mustahkamlandi. Bugun o'zbek tili millionlab odamlar tomonidan so'zlashiladi va texnologiya bilan birga rivojlanishda davom etmoqda.",
  },
  sw: {
    title: 'Historia ya Kiswahili',
    text:
      'Kiswahili ni lugha ya Kibantu yenye historia ndefu ya biashara na mawasiliano katika pwani ya Afrika Mashariki. Ilikua kupitia mwingiliano na Kiarabu na lugha nyingine, kisha ikapanuka kama lugha ya taifa na elimu. Leo Kiswahili kinazungumzwa na mamilioni ya watu na kinaendelea kubadilika kupitia vyombo vya habari na teknolojia.',
  },
  tl: {
    title: 'Ang Kasaysayan ng Wikang Filipino',
    text:
      'Ang Filipino ay batay sa Tagalog at umunlad bilang wikang pambansa ng Pilipinas. Sa paglipas ng panahon, dumami ang mga salitang hiram mula sa Espanyol, Ingles, at iba pang wika. Ang panitikan, paaralan, at midya ay tumulong sa pagpapalakas ng pamantayang wika. Ngayon, ginagamit ito ng milyon-milyong tao at patuloy na nagbabago kasama ng teknolohiya.',
  },
};

/** Supplemental replacements for leftovers after pass 1. */
const EXTRA = {
  zh: {
    protect: [
      /英国科学家/g,
      /英文指示牌/g,
      /英语指示牌/g,
      /英国议会/g,
      /英国内战/g,
      /阿拉伯语、汉语、英语、法语、俄语/g,
      /阿拉伯语、中文、英语、法语、俄语/g,
      /如英语/g, // task2 global-language debate — leave if in task2; we skip task1 only
    ],
    reps: [
      [/英语老师/g, '中文老师'],
      [/英语课/g, '中文课'],
      [/英语考试/g, '中文考试'],
      [/英语能力/g, '中文能力'],
      [/英语电影/g, '中文电影'],
      [/英语世界/g, '中文世界'],
      [/学英语/g, '学中文'],
      [/学习英语/g, '学习中文'],
      [/说英语/g, '说中文'],
      [/讲英语/g, '讲中文'],
      [/用英语/g, '用中文'],
      [/的英语/g, '的中文'],
      [/我的英语/g, '我的中文'],
      [/读写英语/g, '读写中文'],
      [/给英语/g, '给中文'],
      [/迈向英语/g, '迈向中文'],
      [/沉浸在英语/g, '沉浸在中文'],
      [/期末复习：英语/g, '期末复习：中文'],
      [/英语(?![。，、])/g, '中文'], // remaining learner refs
      [/英文(?!指示)/g, '中文'],
    ],
  },
  ja: {
    protect: [
      /イギリスの科学者/g,
      /英語の案内/g,
      /イギリス議会/g,
      /アラビア語、中国語、英語、フランス語、ロシア語/g,
      /英語教育者/g,
      /英語など/g,
    ],
    reps: [
      [/英語コース/g, '日本語コース'],
      [/英語習得/g, '日本語習得'],
      [/英語圏/g, '日本語圏'],
      [/英語言語/g, '日本語'],
      [/英語能力試験/g, '日本語能力試験'],
      [/英語と歴史/g, '日本語と歴史'],
      [/この英語/g, 'この日本語'],
      [/英語(?![。、])/g, '日本語'],
    ],
  },
  ko: {
    protect: [/영국 과학자/g, /영어 표지판/g, /영국 의회/g, /아랍어, 중국어, 영어, 프랑스어, 러시아어/g],
    reps: [[/영어/g, '한국어']],
  },
  el: {
    protect: [
      /Άγγλος επιστήμονας/gi,
      /πινακίδες στα αγγλικά/gi,
      /αγγλικό κοινοβούλιο/gi,
      /Αγγλικό κοινοβούλιο/g,
    ],
    reps: [
      [/Αγγλικών/g, 'Ελληνικών'],
      [/αγγλικών/gi, 'ελληνικών'],
      [/Αγγλικά/g, 'Ελληνικά'],
      [/αγγλικά/gi, 'ελληνικά'],
      [/Αγγλικής/g, 'Ελληνικής'],
      [/αγγλικής/gi, 'ελληνικής'],
      [/αγγλικές/gi, 'ελληνικές'],
      [/καθηγητής αγγλικών/gi, 'καθηγητής ελληνικών'],
      [/μάθημα των Αγγλικών/gi, 'μάθημα των Ελληνικών'],
      [/τεστ των Αγγλικών/gi, 'τεστ των Ελληνικών'],
      [/εκμάθηση των Αγγλικών/gi, 'εκμάθηση των Ελληνικών'],
      [/Εκμάθηση Αγγλικών/g, 'Εκμάθηση Ελληνικών'],
      [/μαθήματα Αγγλικών/gi, 'μαθήματα Ελληνικών'],
    ],
  },
  ro: {
    protect: [
      /om de știință englez/gi,
      /indicatoare în engleză/gi,
      /Parlamentul englez/gi,
      /vorbea bine engleza/gi,
    ],
    reps: [
      [/Studiind engleza/gi, 'Studiind româna'],
      [/Studiez engleza/gi, 'Studiez româna'],
      [/învață engleza/gi, 'învață româna'],
      [/învață Pedro engleza/gi, 'învață Pedro româna'],
      [/practice engleza/gi, 'practice româna'],
      [/vorbea foarte bine engleza/gi, 'vorbea foarte bine româna'],
      [/Învățăm engleza/gi, 'Învățăm româna'],
      [/Engleza este/g, 'Româna este'],
      [/engleza continuă/gi, 'româna continuă'],
      [/engleza(?=\s|[,.!?»";:]|$)/gi, 'româna'],
      [/Engleza(?=\s|[,.!?»";:]|$)/g, 'Româna'],
      [/cum ar fi engleza/gi, 'cum ar fi româna'],
      [/Engleza devine/g, 'Româna devine'],
      [/limbi dominante precum engleza/gi, 'limbi dominante precum româna'],
      [/atins engleza/gi, 'atins româna'],
    ],
  },
  sv: {
    protect: [
      /engelsk forskare/gi,
      /skyltar på engelska/gi,
      /engelska parlamentet/gi,
      /Det engelska parlamentet/g,
    ],
    reps: [
      [/engelsklektioner/gi, 'svensklektioner'],
      [/engelsklärare/gi, 'svensklärare'],
      [/engelskkursen/gi, 'svenskkursen'],
      [/engelskkurs/gi, 'svenskkurs'],
      [/engelskspråkiga/gi, 'svenskspråkiga'],
      [/engelskt kunskapsprov/gi, 'svenskt kunskapsprov'],
      [/Vår engelsklärare/gi, 'Vår svensklärare'],
      [/på engelska/gi, 'på svenska'],
      [/engelska(?=\s|[,.!?»"]|$)/gi, 'svenska'],
    ],
  },
  tr: {
    protect: [
      /İngiliz bilim/gi,
      /İngilizce tabelalar/gi,
      /İngiliz Parlamentosu/gi,
      /İngiliz İç Savaşı/gi,
      /İngiliz filozofu/gi,
      /Bir İngiliz eğitimci/g,
      /İngiliz bir bilim/gi,
    ],
    reps: [
      [/İngilizce'de/g, "Türkçe'de"],
      [/İngilizce'nin/g, "Türkçe'nin"],
      [/İngilizceye/g, 'Türkçeye'],
      [/İngilizce'dir/g, "Türkçe'dir"],
      [/B2 İngilizce/g, 'B2 Türkçe'],
      [/İngilizce(?=['\s.,!?]|$)/g, 'Türkçe'],
    ],
  },
  cs: {
    protect: [
      /anglický vědec/gi,
      /nápisy v angličtině/gi,
      /Anglický parlament/g,
      /mluvili dobře anglicky/gi,
    ],
    reps: [
      [/mluvit anglicky/gi, 'mluvit česky'],
      [/psát anglicky/gi, 'psát česky'],
      [/španělsky a anglicky/gi, 'španělsky a česky'],
      [/anglicky mluvících/gi, 'česky mluvících'],
      [/učí anglicky/gi, 'učí česky'],
      [/učíme anglicky/gi, 'učíme česky'],
      [/nemluvil dobře anglicky/gi, 'nemluvil dobře česky'],
      [/Neuměl moc dobře anglicky/gi, 'Neuměl moc dobře česky'],
      [/anglicky(?=\s|[,.!?»"]|$)/gi, 'česky'],
    ],
  },
  id: {
    protect: [/berbahasa Inggris/gi, /Inggris Raya/gi],
    reps: [
      [/bahasa Inggris/gi, 'Bahasa Indonesia'],
      [/Bahasa Inggris/g, 'Bahasa Indonesia'],
    ],
  },
  ms: {
    protect: [],
    reps: [
      [/bahasa Inggeris/gi, 'Bahasa Melayu'],
      [/Bahasa Inggeris/g, 'Bahasa Melayu'],
      [/bahasa Inggris/gi, 'Bahasa Melayu'],
    ],
  },
  pl: {
    protect: [/angielski naukowiec/gi, /angielski parlament/gi],
    reps: [[/angielsk\w*/gi, (m) => m.replace(/angielsk/i, 'polsk')]],
  },
  uz: {
    protect: [/ingliz olimi/gi, /Ingliz parlamenti/gi],
    reps: [
      [/inglizcha/gi, "o'zbekcha"],
      [/ingliz tili/gi, "o'zbek tili"],
      [/\bingliz\b/gi, "o'zbek"],
    ],
  },
  ar: {
    protect: [/عالم إنجليزي/g, /لافتات باللغة الإنجليزية/g, /البرلمان الإنجليزي/g],
    reps: [
      [/اللغة الإنجليزية/g, 'اللغة العربية'],
      [/باللغة الإنجليزية/g, 'باللغة العربية'],
      [/الإنجليزية/g, 'العربية'],
    ],
  },
  fa: {
    protect: [/دانشمند انگلیسی/g],
    reps: [[/انگلیسی/g, 'فارسی']],
  },
  hi: {
    protect: [/अंग्रेज़ वैज्ञानिक/g],
    reps: [
      [/अंग्रेज़ी/g, 'हिन्दी'],
      [/अंग्रेजी/g, 'हिन्दी'],
    ],
  },
  vi: {
    protect: [/nhà khoa học người Anh/gi, /biển chỉ dẫn bằng tiếng Anh/gi],
    reps: [[/tiếng Anh/gi, 'tiếng Việt']],
  },
  sw: {
    protect: [],
    reps: [[/Kiingereza/g, 'Kiswahili'], [/kiingereza/gi, 'kiswahili']],
  },
  uk: {
    protect: [/англійський вчений/gi, /Англійський парламент/g, /Англійської громадянської/g],
    reps: [
      [/англійськ\w*/gi, (m) => m.replace(/англійськ/i, 'українськ')],
      [/англомов\w*/gi, (m) => m.replace(/англомов/i, 'україномов')],
    ],
  },
  ru: {
    // Only mop learner leftovers; keep factual CR protects from pass1 semantics by protecting again
    protect: [
      /английский учёный/gi,
      /английский ученый/gi,
      /указатели на английском языке/gi,
      /Указатели на английском языке/gi,
      /Английский парламент/g,
      /Английской гражданской/g,
      /Английский педагог/g,
      /арабский, китайский, английский, французский, русский/gi,
      /хорошо говорил(?:а|и)? по-английски/gi,
    ],
    reps: [], // p45 rewrite handles history; CR factual remains
  },
};

function applyProtect(s, protect) {
  const slots = [];
  let out = s;
  for (const p of protect || []) {
    out = out.replace(p, (m) => {
      const i = slots.length;
      slots.push(m);
      return `\uE000${i}\uE001`;
    });
  }
  return { out, slots };
}
function restoreProtect(s, slots) {
  return s.replace(/\uE000(\d+)\uE001/g, (_, i) => slots[Number(i)]);
}
function applyReps(s, reps) {
  let out = s;
  for (const [from, to] of reps || []) {
    out = typeof to === 'function' || from instanceof RegExp ? out.replace(from, to) : out.split(from).join(to);
  }
  return out;
}
function fixString(s, cfg) {
  if (typeof s !== 'string' || !s || !cfg) return s;
  const { out, slots } = applyProtect(s, cfg.protect);
  return restoreProtect(applyReps(out, cfg.reps), slots);
}
function walk(obj, cfg) {
  if (typeof obj === 'string') return fixString(obj, cfg);
  if (Array.isArray(obj)) return obj.map((x) => walk(x, cfg));
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) o[k] = walk(v, cfg);
    return o;
  }
  return obj;
}

function patchP45(lang, data) {
  const blurb = P45[lang];
  if (!blurb || !data) return 0;
  let n = 0;
  for (const passages of Object.values(data)) {
    if (!Array.isArray(passages)) continue;
    for (const p of passages) {
      if (p.id !== 'p45') continue;
      p.title = blurb.title;
      p.text = blurb.text;
      // Fix vocab word "English" if present
      if (Array.isArray(p.vocabulary)) {
        for (const v of p.vocabulary) {
          if (v && typeof v.word === 'string' && /English|англий|anglais|Englisch|inglés|英語|영어|英语|Inggris|Inggeris|İngiliz|αγγλικ|angielsk|englez|engelsk|anglick|tiếng Anh|انگلیسی|انگریزی|अंग्रेज|Kiingereza|الإنجليز/i.test(v.word + (v.definition || ''))) {
            // leave vocab for now unless clearly "English"
            if (/^English$/i.test(v.word) || /английск/i.test(v.word)) {
              // language-specific simple renames
              const map = {
                ru: ['русский', '(Существительное) Язык, на котором говорят в России и других странах.'],
                es: ['español', '(Sustantivo) Idioma hablado en España y muchos países de América.'],
                de: ['Deutsch', '(Nomen) Sprache, die in Deutschland, Österreich und der Schweiz gesprochen wird.'],
                fr: ['français', '(Nom) Langue parlée en France et dans de nombreux pays.'],
                zh: ['中文', '（名词）在中国及世界许多地方使用的语言。'],
                ja: ['日本語', '（名詞）日本で話されている言語。'],
                ko: ['한국어', '(명사) 한국에서 사용되는 언어.'],
                ar: ['العربية', '(اسم) اللغة التي تُتحدث في العالم العربي.'],
                tr: ['Türkçe', '(İsim) Türkiye’de ve başka yerlerde konuşulan dil.'],
                vi: ['tiếng Việt', '(Danh từ) Ngôn ngữ được sử dụng tại Việt Nam.'],
                uk: ['українська', '(Іменник) Мова, якою говорять в Україні.'],
                pl: ['polski', '(Rzeczownik) Język używany w Polsce.'],
                pt: ['português', '(Substantivo) Língua falada no Brasil e em Portugal.'],
                it: ['italiano', '(Sostantivo) Lingua parlata in Italia.'],
                nl: ['Nederlands', '(Zelfstandig naamwoord) Taal gesproken in Nederland en België.'],
                id: ['Bahasa Indonesia', '(Nomina) Bahasa nasional Indonesia.'],
                ms: ['Bahasa Melayu', '(Kata nama) Bahasa rasmi di Malaysia dan Brunei.'],
                th: ['ภาษาไทย', '(คำนาม) ภาษาที่ใช้ในประเทศไทย'],
                hi: ['हिन्दी', '(संज्ञा) भारत में बोली जाने वाली भाषा।'],
                fa: ['فارسی', '(اسم) زبانی که در ایران و برخی کشورهای دیگر صحبت می‌شود.'],
                ur: ['اردو', '(اسم) پاکستان اور بھارت میں بولی جانے والی زبان۔'],
                el: ['ελληνικά', '(Ουσιαστικό) Η γλώσσα που μιλιέται στην Ελλάδα.'],
                cs: ['čeština', '(Podstatné jméno) Jazyk používaný v Česku.'],
                ro: ['română', '(Substantiv) Limba vorbită în România.'],
                sv: ['svenska', '(Substantiv) Språk som talas i Sverige.'],
                uz: ["o'zbekcha", "(Ot) O'zbekistonda so'zlashiladigan til."],
                sw: ['Kiswahili', '(Nomino) Lugha inayozungumzwa Afrika Mashariki.'],
                tl: ['Filipino', '(Pangngalan) Ang wikang pambansa ng Pilipinas.'],
              };
              if (map[lang]) {
                v.word = map[lang][0];
                v.definition = map[lang][1];
              }
            }
          }
        }
      }
      n++;
    }
  }
  return n;
}

function main() {
  const langs = fs.readdirSync(PACKS).filter((d) => fs.statSync(path.join(PACKS, d)).isDirectory());
  let totalFiles = 0;
  let p45count = 0;

  for (const lang of langs) {
    const cfg = EXTRA[lang];
    const dir = path.join(PACKS, lang);
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      if (f === 'task1.json') continue;
      const fp = path.join(dir, f);
      let data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      const before = JSON.stringify(data);
      if (cfg) data = walk(data, cfg);
      if (f === 'level-texts.json') p45count += patchP45(lang, data);
      const after = JSON.stringify(data);
      if (before !== after) {
        totalFiles++;
        if (!DRY) fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log('updated', lang + '/' + f);
      }
    }
    const dictDir = path.join(dir, 'dictation');
    if (cfg && fs.existsSync(dictDir)) {
      for (const f of fs.readdirSync(dictDir)) {
        if (!f.endsWith('.txt')) continue;
        const fp = path.join(dictDir, f);
        const raw = fs.readFileSync(fp, 'utf8');
        const next = fixString(raw, cfg);
        if (next !== raw) {
          totalFiles++;
          if (!DRY) fs.writeFileSync(fp, next, 'utf8');
          console.log('updated', lang + '/dictation/' + f);
        }
      }
    }
  }

  // verify ru p45 + b60
  if (!DRY) {
    const ru = JSON.parse(fs.readFileSync(path.join(PACKS, 'ru', 'level-texts.json'), 'utf8'));
    for (const passages of Object.values(ru)) {
      for (const p of passages) {
        if (p.id === 'p45') console.log('\np45:', p.title, '\n', p.text.slice(0, 180));
        if (p.id === 'b60') console.log('\nb60:', p.title, '|', p.text.slice(0, 80));
      }
    }
  }
  console.log('\nDONE files', totalFiles, 'p45 patched', p45count, DRY ? '(dry)' : '');
}

main();
