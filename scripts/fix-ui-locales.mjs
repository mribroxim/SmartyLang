/**
 * One-shot quality fixes for UI locale packs.
 * Run: node scripts/fix-ui-locales.mjs
 *
 * - Strips Tagalog (and any) `\n<` / trailing `<` translation artifacts
 * - Restores broken `{n}`, `{done}`, `{total}`, `{recs}`, `{query}` placeholders
 * - Replaces "English text" instructional copy with language-neutral wording
 * - Improves critical labels (learning language, interface language) where MT garbled them
 * - Syncs scripts/.ui-locale-cache.json and src/locales/ui.generated.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/locales/ui.en.json');
const outPath = path.join(root, 'src/locales/ui.generated.json');
const cachePath = path.join(root, 'scripts/.ui-locale-cache.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const gen = JSON.parse(fs.readFileSync(outPath, 'utf8'));
let cache = {};
try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch { /* */ }

// ── English source updates ──────────────────────────────────────────────
const EN_UPDATES = {
  'custom.pasteSubtitle': 'Type or paste any text you want to practice reading.',
  'lang.learning': 'Learning language',
  'vocab.title': 'Vocabulary',
  'vocab.subtitle': "Review the words you've learned and practice them.",
  'vocab.addTitle': 'Add New Word',
  'vocab.addSubtitle': 'Type any word in your learning language to look up its definition and save it to your list.',
  'vocab.addPlaceholder': 'Enter a word…',
  'vocab.addButton': 'Add to Vocabulary',
  'auth.tagline': 'AI-powered language learning platform',
  'auth.welcome': 'Welcome',
  'auth.signInHint': 'Sign in to start your learning journey',
};

Object.assign(en, EN_UPDATES);
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');

// ── Per-language curated overrides (confident fixes only) ───────────────
/** @type {Record<string, Record<string, string>>} */
const OVERRIDES = {
  ru: {
    'nav.home': 'Главная',
    'nav.learn': 'Обучение',
    'nav.league': 'Лига',
    'nav.more': 'Ещё',
    'nav.keepGoing': 'Продолжай',
    'nav.adminShort': 'Админ',
    'nav.contentShort': 'Контент',
    'nav.orgShort': 'Орг.',
    'nav.ielts': 'IELTS',
    'nav.lessons': 'Уроки',
    'ielts.hub.subtitle': 'Полная подготовка к IELTS: чтение, аудирование, письмо и говорение.',
    'action.play': 'Воспроизвести',
    'action.stop': 'Остановить',
    'action.signOut': 'Выйти',
    'nav.upgrade': 'Тарифы',
    'dash.continue': 'Продолжить',
    'onboard.native.title': 'На каком языке вы говорите?',
    'onboard.native.subtitle': 'Меню, кнопки и переводы слов будут на этом языке.',
    'onboard.learning.title': 'Какой язык вы изучаете?',
    'onboard.learning.subtitle': 'Уроки, тексты, аудио и упражнения будут на этом языке.',
    'onboard.goal.title': 'Зачем вы здесь?',
    'onboard.goal.subtitle': 'Это влияет на рекомендации. Позже можно изменить в профиле.',
    'onboard.placement.title': 'Проверка уровня',
    'onboard.placement.subtitle': 'Грамматика, слова, чтение и аудирование — около 10 минут. Пропускайте неизвестное.',
    'onboard.reading.title': 'Прочитайте текст',
    'onboard.reading.subtitle': 'Внимательно прочитайте, затем ответьте на вопросы.',
    'onboard.listening.title': 'Аудирование',
    'onboard.listening.subtitle': 'Прочитайте, что вы услышали бы, и выберите ответ.',
    'onboard.true': 'Верно',
    'onboard.false': 'Неверно',
    'onboard.passageLabel': 'Текст',
    'onboard.questionOf': 'Вопрос {n} из {total}',
    'onboard.answered': 'Ответов: {n}',
    'onboard.seeLevel': 'Мой уровень',
    'onboard.next': 'Далее',
    'onboard.skipQuestion': 'Пропустить',
    'onboard.skipPlacement': 'Пропустить тест',
    'onboard.skipForNow': 'Пропустить',
    'onboard.continue': 'Продолжить',
    'onboard.back': 'Назад',
    'onboard.result.title': 'Ваш уровень',
    'onboard.result.subtitle': 'Все уровни открыты — это лишь рекомендация, с чего начать.',
    'onboard.result.starting': 'Стартовый уровень',
    'onboard.result.correct': '{correct} из {total} верно',
    'onboard.result.skills': 'По навыкам',
    'onboard.result.strengths': 'Сильные стороны',
    'onboard.result.weaknesses': 'Стоит потренировать',
    'onboard.result.nextTitle': 'Что дальше',
    'onboard.startLesson': 'Начать первый урок',
    'onboard.goHome': 'На главную',
    'onboard.continuePlans': 'К тарифам',
    'onboard.step.native': 'Ваш язык',
    'onboard.step.learning': 'Изучаемый',
    'onboard.step.goal': 'Цель',
    'onboard.step.placement': 'Уровень',
    'onboard.step.result': 'Старт',
    'custom.pasteSubtitle': 'Введите или вставьте любой текст для практики чтения.',
    'lang.learning': 'Язык обучения',
    'lang.interface': 'Язык интерфейса',
    'speaking.general.cta': 'Начать практику',
    'action.getStarted': 'Начать',
    'reading.subtitle': 'Выберите формат чтения и работайте с интегрированным словарём, инструментами и отзывами ИИ.',
    'exercises.subtitle': 'Развивайте словарный запас с помощью интерактивных упражнений под ваш уровень.',
    'custom.practiceDesc': 'Вставьте свои статьи, письма или учебные материалы, чтобы потренировать произношение на важном для вас тексте.',
    'vocab.title': 'Словарь',
    'vocab.subtitle': 'Повторяйте выученные слова и практикуйте их.',
    'vocab.addTitle': 'Добавить слово',
    'vocab.addSubtitle': 'Введите любое слово на языке обучения, чтобы посмотреть определение и сохранить его в список.',
    'vocab.addPlaceholder': 'Введите слово…',
    'vocab.addButton': 'Добавить в словарь',
    'auth.tagline': 'Платформа изучения языков с ИИ',
    'auth.welcome': 'Добро пожаловать',
    'auth.signInHint': 'Войдите, чтобы начать обучение',
    'library.unread': 'Не прочитано',
    'library.unwritten': 'Не написано',
    'common.progress': 'Прогресс',
  },
  uk: {
    'custom.pasteSubtitle': 'Введіть або вставте будь-який текст, який хочете потренувати в читанні.',
    'lang.learning': 'Мова навчання',
    'speaking.general.cta': 'Почати практику',
    'action.getStarted': 'Почати',
    'vocab.addSubtitle': 'Введіть будь-яке слово мовою навчання, щоб переглянути визначення та зберегти його.',
    'vocab.addPlaceholder': 'Введіть слово…',
    'vocab.addButton': 'Додати до словника',
    'auth.tagline': 'Платформа вивчення мов зі штучним інтелектом',
  },
  es: {
    'custom.pasteSubtitle': 'Escribe o pega cualquier texto que quieras practicar leyendo.',
    'lang.learning': 'Idioma de aprendizaje',
    'common.topicsCompleted': '{done} de {total} temas completados',
    'vocab.addSubtitle': 'Escribe cualquier palabra en tu idioma de aprendizaje para ver su definición y guardarla.',
    'vocab.addPlaceholder': 'Escribe una palabra…',
    'vocab.addButton': 'Añadir al vocabulario',
    'auth.tagline': 'Plataforma de aprendizaje de idiomas con IA',
  },
  de: {
    'custom.pasteSubtitle': 'Gib einen beliebigen Text ein oder füge ihn ein, den du zum Lesen üben möchtest.',
    'lang.learning': 'Lernsprache',
    'lang.interface': 'Oberflächensprache',
    'speaking.general.cta': 'Übung starten',
    'action.getStarted': 'Loslegen',
    'vocab.addSubtitle': 'Gib ein Wort in deiner Lernsprache ein, um die Definition nachzuschlagen und zu speichern.',
    'vocab.addPlaceholder': 'Wort eingeben…',
    'vocab.addButton': 'Zum Wortschatz hinzufügen',
    'auth.tagline': 'KI-gestützte Sprachlernplattform',
  },
  fr: {
    'custom.pasteSubtitle': 'Saisissez ou collez n’importe quel texte que vous souhaitez vous entraîner à lire.',
    'lang.learning': 'Langue d’apprentissage',
    'common.topicsCompleted': '{done} sur {total} sujets terminés',
    'speaking.general.cta': 'Commencer à pratiquer',
    'vocab.addSubtitle': 'Saisissez un mot dans votre langue d’apprentissage pour en voir la définition et l’enregistrer.',
    'vocab.addPlaceholder': 'Saisir un mot…',
    'vocab.addButton': 'Ajouter au vocabulaire',
    'auth.tagline': 'Plateforme d’apprentissage des langues propulsée par l’IA',
  },
  it: {
    'custom.pasteSubtitle': 'Digita o incolla qualsiasi testo su cui vuoi esercitarti a leggere.',
    'lang.learning': 'Lingua di apprendimento',
    'lang.interface': 'Lingua dell’interfaccia',
    'vocab.addSubtitle': 'Digita una parola nella lingua di apprendimento per cercarne la definizione e salvarla.',
    'vocab.addPlaceholder': 'Inserisci una parola…',
    'vocab.addButton': 'Aggiungi al vocabolario',
    'auth.tagline': 'Piattaforma di apprendimento linguistico con IA',
  },
  pt: {
    'custom.pasteSubtitle': 'Digite ou cole qualquer texto que deseja praticar a leitura.',
    'lang.learning': 'Idioma de aprendizagem',
    'common.topicsCompleted': '{done} de {total} tópicos concluídos',
    'vocab.addSubtitle': 'Digite qualquer palavra no seu idioma de aprendizagem para ver a definição e guardar.',
    'vocab.addPlaceholder': 'Introduza uma palavra…',
    'vocab.addButton': 'Adicionar ao vocabulário',
    'auth.tagline': 'Plataforma de aprendizagem de idiomas com IA',
  },
  tl: {
    'custom.pasteSubtitle': 'I-type o i-paste ang anumang tekstong gusto mong pagsanayan sa pagbabasa.',
    'lang.learning': 'Wika ng pag-aaral',
    'lang.interface': 'Wika ng interface',
    'nav.dashboard': 'Stats at Aktibidad',
    'action.dismiss': 'Isara',
    'vocab.addSubtitle': 'Mag-type ng anumang salita sa iyong wika ng pag-aaral para tingnan ang kahulugan at i-save ito.',
    'vocab.addPlaceholder': 'Maglagay ng salita…',
    'vocab.addButton': 'Idagdag sa Vocabulary',
    'auth.tagline': 'AI-powered na platform sa pag-aaral ng wika',
  },
  uz: {
    'custom.pasteSubtitle': 'O‘qishni mashq qilmoqchi bo‘lgan istalgan matnni kiriting yoki joylashtiring.',
    'lang.learning': 'O‘rganilayotgan til',
    'common.topicsCompleted': '{total} ta mavzudan {done} tasi yakunlandi',
    'vocab.addSubtitle': 'Ta’rifini ko‘rish va ro‘yxatga saqlash uchun o‘rganilayotgan tilda istalgan so‘zni kiriting.',
    'vocab.addPlaceholder': 'So‘z kiriting…',
    'vocab.addButton': 'Lug‘atga qo‘shish',
    'auth.tagline': 'Sun’iy intellektli til o‘rganish platformasi',
  },
  ja: {
    'custom.pasteSubtitle': '読む練習をしたいテキストを入力または貼り付けてください。',
    'lang.learning': '学習言語',
    'vocab.addSubtitle': '学習言語の単語を入力して定義を調べ、リストに保存します。',
    'vocab.addPlaceholder': '単語を入力…',
    'vocab.addButton': '単語帳に追加',
    'auth.tagline': 'AI搭載の語学学習プラットフォーム',
  },
  ko: {
    'custom.pasteSubtitle': '읽기 연습할 텍스트를 입력하거나 붙여넣으세요.',
    'lang.learning': '학습 언어',
    'vocab.addSubtitle': '학습 언어의 단어를 입력해 정의를 찾고 목록에 저장하세요.',
    'vocab.addPlaceholder': '단어 입력…',
    'vocab.addButton': '단어장에 추가',
    'auth.tagline': 'AI 기반 언어 학습 플랫폼',
  },
  zh: {
    'custom.pasteSubtitle': '输入或粘贴任何想练习阅读的文本。',
    'lang.learning': '学习语言',
    'vocab.addSubtitle': '输入学习语言中的任意单词以查看释义并保存到列表。',
    'vocab.addPlaceholder': '输入单词…',
    'vocab.addButton': '添加到词汇表',
    'auth.tagline': 'AI 驱动的语言学习平台',
  },
  ar: {
    'custom.pasteSubtitle': 'اكتب أو الصق أي نص تريد التدرب على قراءته.',
    'lang.learning': 'لغة التعلم',
    'common.wordsCount': '{n} كلمة',
    'common.wordsDetected': '{n} كلمة مكتشفة',
    'reading.searchResults': 'نتائج البحث ({n})',
    'story.count': '{n} قصص متاحة',
    'shadowing.search': 'بحث في {n} مقاطع…',
    'vocab.addSubtitle': 'اكتب أي كلمة بلغة التعلم للاطلاع على تعريفها وحفظها في قائمتك.',
    'vocab.addPlaceholder': 'أدخل كلمة…',
    'vocab.addButton': 'إضافة إلى المفردات',
    'auth.tagline': 'منصة لتعلم اللغات مدعومة بالذكاء الاصطناعي',
  },
  tr: {
    'custom.pasteSubtitle': 'Okuma pratiği yapmak istediğiniz herhangi bir metni yazın veya yapıştırın.',
    'lang.learning': 'Öğrenilen dil',
    'vocab.addSubtitle': 'Tanımını görmek ve kaydetmek için öğrenilen dilde bir kelime yazın.',
    'vocab.addPlaceholder': 'Bir kelime girin…',
    'vocab.addButton': 'Kelime dağarcığına ekle',
    'auth.tagline': 'Yapay zekâ destekli dil öğrenme platformu',
  },
  nl: {
    'custom.pasteSubtitle': 'Typ of plak een tekst die je wilt oefenen met lezen.',
    'lang.learning': 'Leertaal',
    'common.topicsCompleted': '{done} van {total} onderwerpen voltooid',
    'vocab.addSubtitle': 'Typ een woord in je leertaal om de definitie op te zoeken en op te slaan.',
    'vocab.addPlaceholder': 'Voer een woord in…',
    'vocab.addButton': 'Toevoegen aan vocabulaire',
    'auth.tagline': 'AI-aangedreven taalplatform',
  },
  hi: {
    'custom.pasteSubtitle': 'कोई भी पाठ टाइप या पेस्ट करें जिसे आप पढ़ने का अभ्यास करना चाहते हैं।',
    'lang.learning': 'अधिगम भाषा',
    'common.wordsCount': '{n} शब्द',
    'common.wordsDetected': '{n} शब्द मिले',
    'common.topicsCompleted': '{total} में से {done} विषय पूरे',
    'reading.searchEmpty': '\"{query}\" से मेल खाती कोई रीडिंग नहीं मिली।',
    'shadowing.searchEmpty': 'कोई भी अनुच्छेद \"{query}\" से मेल नहीं खाता',
    'vocab.addSubtitle': 'परिभाषा देखने और सूची में सहेजने के लिए अपनी अधिगम भाषा में कोई शब्द लिखें।',
    'vocab.addPlaceholder': 'शब्द लिखें…',
    'vocab.addButton': 'शब्दावली में जोड़ें',
    'auth.tagline': 'एआई-संचालित भाषा सीखने का मंच',
  },
  pl: {
    'custom.pasteSubtitle': 'Wpisz lub wklej dowolny tekst, który chcesz przećwiczyć w czytaniu.',
    'lang.learning': 'Język nauki',
    'vocab.addSubtitle': 'Wpisz dowolne słowo w języku nauki, aby zobaczyć definicję i zapisać je.',
    'vocab.addPlaceholder': 'Wpisz słowo…',
    'vocab.addButton': 'Dodaj do słownictwa',
    'auth.tagline': 'Platforma do nauki języków z AI',
  },
  sv: {
    'custom.pasteSubtitle': 'Skriv eller klistra in valfri text som du vill öva på att läsa.',
    'lang.learning': 'Inlärningsspråk',
    'speaking.sessionsSummary': '{n} sessioner · {recs} inspelade',
    'vocab.addSubtitle': 'Skriv ett ord på ditt inlärningsspråk för att slå upp definitionen och spara det.',
    'vocab.addPlaceholder': 'Ange ett ord…',
    'vocab.addButton': 'Lägg till i ordförråd',
    'auth.tagline': 'AI-driven plattform för språkinlärning',
  },
  id: {
    'custom.pasteSubtitle': 'Ketik atau tempel teks apa pun yang ingin Anda latih bacaannya.',
    'lang.learning': 'Bahasa pembelajaran',
    'common.topicsCompleted': '{done} dari {total} topik selesai',
    'vocab.addSubtitle': 'Ketik kata apa pun dalam bahasa pembelajaran untuk melihat definisi dan menyimpannya.',
    'vocab.addPlaceholder': 'Masukkan kata…',
    'vocab.addButton': 'Tambahkan ke kosakata',
    'auth.tagline': 'Platform belajar bahasa bertenaga AI',
  },
  ms: {
    'custom.pasteSubtitle': 'Taip atau tampal sebarang teks yang ingin anda latih membaca.',
    'lang.learning': 'Bahasa pembelajaran',
    'vocab.addSubtitle': 'Taip sebarang perkataan dalam bahasa pembelajaran untuk melihat definisi dan menyimpannya.',
    'vocab.addPlaceholder': 'Masukkan perkataan…',
    'vocab.addButton': 'Tambah ke perbendaharaan kata',
    'auth.tagline': 'Platform pembelajaran bahasa berkuasa AI',
  },
  vi: {
    'custom.pasteSubtitle': 'Nhập hoặc dán bất kỳ văn bản nào bạn muốn luyện đọc.',
    'lang.learning': 'Ngôn ngữ học',
    'vocab.addSubtitle': 'Nhập bất kỳ từ nào bằng ngôn ngữ bạn đang học để xem định nghĩa và lưu vào danh sách.',
    'vocab.addPlaceholder': 'Nhập một từ…',
    'vocab.addButton': 'Thêm vào từ vựng',
    'auth.tagline': 'Nền tảng học ngôn ngữ hỗ trợ AI',
  },
  th: {
    'custom.pasteSubtitle': 'พิมพ์หรือวางข้อความใดก็ได้ที่คุณต้องการฝึกอ่าน',
    'lang.learning': 'ภาษาที่เรียน',
    'vocab.addSubtitle': 'พิมพ์คำใดก็ได้ในภาษาที่คุณกำลังเรียนเพื่อดูคำจำกัดความและบันทึก',
    'vocab.addPlaceholder': 'ใส่คำ…',
    'vocab.addButton': 'เพิ่มในคำศัพท์',
    'auth.tagline': 'แพลตฟอร์มเรียนภาษาด้วย AI',
  },
  el: {
    'custom.pasteSubtitle': 'Πληκτρολογήστε ή επικολλήστε οποιοδήποτε κείμενο θέλετε να εξασκηθείτε στην ανάγνωση.',
    'lang.learning': 'Γλώσσα εκμάθησης',
    'common.topicsCompleted': '{done} από {total} θέματα ολοκληρώθηκαν',
    'vocab.addSubtitle': 'Πληκτρολογήστε οποιαδήποτε λέξη στη γλώσσα εκμάθησης για ορισμό και αποθήκευση.',
    'vocab.addPlaceholder': 'Εισαγάγετε μια λέξη…',
    'vocab.addButton': 'Προσθήκη στο λεξιλόγιο',
    'auth.tagline': 'Πλατφόρμα εκμάθησης γλωσσών με AI',
  },
  cs: {
    'custom.pasteSubtitle': 'Napište nebo vložte libovolný text, který chcete procvičit ve čtení.',
    'lang.learning': 'Jazyk výuky',
    'vocab.addSubtitle': 'Zadejte libovolné slovo v jazyce výuky, zobrazte definici a uložte ho.',
    'vocab.addPlaceholder': 'Zadejte slovo…',
    'vocab.addButton': 'Přidat do slovní zásoby',
    'auth.tagline': 'Platforma pro výuku jazyků s AI',
  },
  ro: {
    'custom.pasteSubtitle': 'Tastează sau lipește orice text pe care vrei să-l exersezi la citire.',
    'lang.learning': 'Limba de învățare',
    'lang.interface': 'Limba interfeței',
    'common.topicsCompleted': '{done} din {total} subiecte finalizate',
    'vocab.addSubtitle': 'Tastează orice cuvânt în limba de învățare pentru a vedea definiția și a-l salva.',
    'vocab.addPlaceholder': 'Introdu un cuvânt…',
    'vocab.addButton': 'Adaugă în vocabular',
    'auth.tagline': 'Platformă de învățare a limbilor cu AI',
  },
  fa: {
    'custom.pasteSubtitle': 'هر متنی را که می‌خواهید برای تمرین خواندن تایپ کنید یا جای‌گذاری کنید.',
    'lang.learning': 'زبان یادگیری',
    'common.topicsCompleted': '{done} از {total} مبحث تکمیل شد',
    'vocab.addSubtitle': 'هر واژه‌ای را به زبان یادگیری تایپ کنید تا تعریف آن را ببینید و ذخیره کنید.',
    'vocab.addPlaceholder': 'یک واژه وارد کنید…',
    'vocab.addButton': 'افزودن به واژگان',
    'auth.tagline': 'پلتفرم یادگیری زبان مبتنی بر هوش مصنوعی',
  },
  ur: {
    'custom.pasteSubtitle': 'کوئی بھی متن ٹائپ یا پیسٹ کریں جسے آپ پڑھنے کی مشق کرنا چاہتے ہیں۔',
    'lang.learning': 'زبانِ تعلیم',
    'vocab.addSubtitle': 'تعریف دیکھنے اور محفوظ کرنے کے لیے اپنی زبانِ تعلیم میں کوئی لفظ لکھیں۔',
    'vocab.addPlaceholder': 'لفظ درج کریں…',
    'vocab.addButton': 'ذخیرہ الفاظ میں شامل کریں',
    'auth.tagline': 'اے آئی سے چلنے والا زبان سیکھنے کا پلیٹ فارم',
  },
  sw: {
    'custom.pasteSubtitle': 'Andika au ubandike maandishi yoyote unayotaka kujizoeza kusoma.',
    'lang.learning': 'Lugha ya kujifunza',
    'vocab.addSubtitle': 'Andika neno lolote katika lugha unayojifunza ili kuona maana yake na kuliokoa.',
    'vocab.addPlaceholder': 'Ingiza neno…',
    'vocab.addButton': 'Ongeza kwenye msamiati',
    'auth.tagline': 'Jukwaa la kujifunza lugha linalotumia AI',
  },
};

const PLACEHOLDER_KEYS = [
  'common.wordsDetected',
  'common.wordsCount',
  'common.topicsCompleted',
  'reading.searchResults',
  'reading.searchEmpty',
  'story.count',
  'shadowing.search',
  'shadowing.searchEmpty',
  'speaking.sessionsSummary',
];

function cleanArtifacts(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/\n</g, '').replace(/<<<SEP>>>/g, '').trim();
}

/** Restore English placeholder names if MT translated them. */
function fixPlaceholders(lang, key, value) {
  const enVal = en[key];
  if (!enVal || typeof value !== 'string') return value;
  const wanted = enVal.match(/\{[a-z]+\}/gi) || [];
  if (!wanted.length) return value;

  // Already correct?
  const have = value.match(/\{[a-z]+\}/gi) || [];
  if (have.slice().sort().join() === wanted.slice().sort().join()) return value;

  // Known key-specific templates
  if (key === 'common.topicsCompleted') {
    // Prefer keeping local word order where possible; fall back to EN structure
    if (lang === 'uz') return '{total} ta mavzudan {done} tasi yakunlandi';
    if (lang === 'hi') return '{total} में से {done} विषय पूरे';
    // Generic: replace any {...} tokens in order of appearance with wanted names
  }

  const parts = value.split(/\{[^}]+\}/);
  if (parts.length === wanted.length + 1) {
    let out = parts[0];
    for (let i = 0; i < wanted.length; i++) out += wanted[i] + parts[i + 1];
    return out;
  }

  // Fallback: replace non-ASCII / translated brace tokens sequentially
  let i = 0;
  return value.replace(/\{[^}]+\}/g, () => wanted[i++] || '');
}

let stats = { artifactCleaned: 0, placeholderFixed: 0, overrideApplied: 0, keysAdded: 0 };

for (const lang of Object.keys(gen)) {
  const pack = gen[lang];
  for (const [k, v] of Object.entries(pack)) {
    const cleaned = cleanArtifacts(v);
    if (cleaned !== v) {
      pack[k] = cleaned;
      stats.artifactCleaned++;
    }
  }

  for (const k of PLACEHOLDER_KEYS) {
    if (!pack[k]) continue;
    const fixed = fixPlaceholders(lang, k, pack[k]);
    if (fixed !== pack[k]) {
      pack[k] = fixed;
      stats.placeholderFixed++;
    }
  }

  const ovr = OVERRIDES[lang] || {};
  for (const [k, v] of Object.entries(ovr)) {
    pack[k] = v;
    stats.overrideApplied++;
  }

  // Ensure every EN key exists
  for (const k of Object.keys(en)) {
    if (!pack[k]) {
      pack[k] = ovr[k] || en[k];
      stats.keysAdded++;
    }
  }

  // Neutral pasteSubtitle fallback if still mentions English-family words
  const paste = pack['custom.pasteSubtitle'] || '';
  if (/\bEnglish\b|anglais|inglés|Englisch|inglese|inglês|英語|영어|английск|англійськ|İngiliz|الإنجليز|انگریزی|ภาษาอังกฤษ|tiếng Anh|Inggris|Kiingereza|inglizcha/i.test(paste)
      && !ovr['custom.pasteSubtitle']) {
    pack['custom.pasteSubtitle'] = en['custom.pasteSubtitle'];
    stats.overrideApplied++;
  }

  gen[lang] = pack;
  cache[lang] = { ...(cache[lang] || {}), ...pack };
}

fs.writeFileSync(outPath, JSON.stringify(gen, null, 2) + '\n');
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n');

console.log('Done.', stats);
console.log('EN keys now:', Object.keys(en).length);
console.log('Langs:', Object.keys(gen).length);
