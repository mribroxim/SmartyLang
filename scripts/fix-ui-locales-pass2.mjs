/**
 * Fill remaining new-key translations + Chinese quality fixes.
 * Run: node scripts/fix-ui-locales-pass2.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'src/locales/ui.generated.json');
const cachePath = path.join(root, 'scripts/.ui-locale-cache.json');
const gen = JSON.parse(fs.readFileSync(outPath, 'utf8'));
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

const PACK = {
  tl: {
    'vocab.title': 'Bokabularyo',
    'vocab.subtitle': 'Balikan ang mga salitang natutunan mo at sanayin ang mga ito.',
    'vocab.addTitle': 'Magdagdag ng Bagong Salita',
    'auth.welcome': 'Maligayang pagdating',
    'auth.signInHint': 'Mag-sign in upang simulan ang iyong pag-aaral',
  },
  es: {
    'vocab.title': 'Vocabulario',
    'vocab.subtitle': 'Repasa las palabras que has aprendido y practícalas.',
    'vocab.addTitle': 'Añadir palabra nueva',
    'auth.welcome': 'Bienvenido',
    'auth.signInHint': 'Inicia sesión para comenzar tu aprendizaje',
  },
  uz: {
    'vocab.title': 'Lug‘at',
    'vocab.subtitle': 'O‘rgangan so‘zlaringizni takrorlang va mashq qiling.',
    'vocab.addTitle': 'Yangi so‘z qo‘shish',
    'auth.welcome': 'Xush kelibsiz',
    'auth.signInHint': 'O‘qishni boshlash uchun tizimga kiring',
  },
  de: {
    'vocab.title': 'Wortschatz',
    'vocab.subtitle': 'Wiederhole gelernte Wörter und übe sie.',
    'vocab.addTitle': 'Neues Wort hinzufügen',
    'auth.welcome': 'Willkommen',
    'auth.signInHint': 'Melde dich an, um mit dem Lernen zu beginnen',
  },
  fr: {
    'vocab.title': 'Vocabulaire',
    'vocab.subtitle': 'Révisez les mots appris et pratiquez-les.',
    'vocab.addTitle': 'Ajouter un nouveau mot',
    'auth.welcome': 'Bienvenue',
    'auth.signInHint': 'Connectez-vous pour commencer votre apprentissage',
  },
  it: {
    'vocab.title': 'Vocabolario',
    'vocab.subtitle': 'Rivedi le parole che hai imparato e praticale.',
    'vocab.addTitle': 'Aggiungi una nuova parola',
    'auth.welcome': 'Benvenuto',
    'auth.signInHint': 'Accedi per iniziare il tuo percorso di apprendimento',
  },
  pt: {
    'vocab.title': 'Vocabulário',
    'vocab.subtitle': 'Revise as palavras que aprendeu e pratique-as.',
    'vocab.addTitle': 'Adicionar nova palavra',
    'auth.welcome': 'Bem-vindo',
    'auth.signInHint': 'Inicie sessão para começar a aprender',
  },
  ja: {
    'vocab.title': '単語帳',
    'vocab.subtitle': '覚えた単語を見直して練習しましょう。',
    'vocab.addTitle': '新しい単語を追加',
    'auth.welcome': 'ようこそ',
    'auth.signInHint': '学習を始めるにはサインインしてください',
  },
  ko: {
    'vocab.title': '단어장',
    'vocab.subtitle': '배운 단어를 복습하고 연습하세요.',
    'vocab.addTitle': '새 단어 추가',
    'auth.welcome': '환영합니다',
    'auth.signInHint': '학습을 시작하려면 로그인하세요',
  },
  zh: {
    'vocab.title': '词汇',
    'vocab.subtitle': '复习已学单词并进行练习。',
    'vocab.addTitle': '添加新单词',
    'auth.welcome': '欢迎',
    'auth.signInHint': '登录以开始学习之旅',
    'reading.comp.desc': '阅读完整篇章并回答理解题。支持划词释义，并融入词汇积累。',
    'compReading.levelSubtitle': '阅读完整篇章并回答理解题。',
    'listening.comp.desc': '听音频篇章并回答理解题。可按需查看文字稿。',
    'dictation.customDesc': '粘贴你自己的句子，练习对你重要的听写内容。',
    'custom.practiceDesc': '粘贴你自己的新闻、邮件或学习材料，练习对你重要的文本发音。',
  },
  ar: {
    'vocab.title': 'المفردات',
    'vocab.subtitle': 'راجع الكلمات التي تعلمتها وتدرّب عليها.',
    'vocab.addTitle': 'إضافة كلمة جديدة',
    'auth.welcome': 'مرحبًا',
    'auth.signInHint': 'سجّل الدخول لبدء رحلة التعلم',
  },
  tr: {
    'vocab.title': 'Kelime dağarcığı',
    'vocab.subtitle': 'Öğrendiğiniz kelimeleri gözden geçirin ve pratik yapın.',
    'vocab.addTitle': 'Yeni kelime ekle',
    'auth.welcome': 'Hoş geldiniz',
    'auth.signInHint': 'Öğrenmeye başlamak için giriş yapın',
  },
  nl: {
    'vocab.title': 'Woordenschat',
    'vocab.subtitle': 'Herhaal de woorden die je hebt geleerd en oefen ze.',
    'vocab.addTitle': 'Nieuw woord toevoegen',
    'auth.welcome': 'Welkom',
    'auth.signInHint': 'Log in om met leren te beginnen',
  },
  hi: {
    'vocab.title': 'शब्दावली',
    'vocab.subtitle': 'सीखे गए शब्दों की समीक्षा करें और उनका अभ्यास करें।',
    'vocab.addTitle': 'नया शब्द जोड़ें',
    'auth.welcome': 'स्वागत है',
    'auth.signInHint': 'अपनी सीखने की यात्रा शुरू करने के लिए साइन इन करें',
  },
  pl: {
    'vocab.title': 'Słownictwo',
    'vocab.subtitle': 'Powtórz nauczone słowa i ćwicz je.',
    'vocab.addTitle': 'Dodaj nowe słowo',
    'auth.welcome': 'Witaj',
    'auth.signInHint': 'Zaloguj się, aby rozpocząć naukę',
  },
  sv: {
    'vocab.title': 'Ordförråd',
    'vocab.subtitle': 'Repetera orden du har lärt dig och öva på dem.',
    'vocab.addTitle': 'Lägg till nytt ord',
    'auth.welcome': 'Välkommen',
    'auth.signInHint': 'Logga in för att börja din inlärningsresa',
  },
  id: {
    'vocab.title': 'Kosakata',
    'vocab.subtitle': 'Tinjau kata yang telah dipelajari dan latih mereka.',
    'vocab.addTitle': 'Tambah kata baru',
    'auth.welcome': 'Selamat datang',
    'auth.signInHint': 'Masuk untuk memulai perjalanan belajar Anda',
  },
  ms: {
    'vocab.title': 'Perbendaharaan kata',
    'vocab.subtitle': 'Semak semula perkataan yang dipelajari dan latihinya.',
    'vocab.addTitle': 'Tambah perkataan baharu',
    'auth.welcome': 'Selamat datang',
    'auth.signInHint': 'Log masuk untuk memulakan perjalanan pembelajaran anda',
  },
  vi: {
    'vocab.title': 'Từ vựng',
    'vocab.subtitle': 'Ôn lại các từ đã học và luyện tập chúng.',
    'vocab.addTitle': 'Thêm từ mới',
    'auth.welcome': 'Chào mừng',
    'auth.signInHint': 'Đăng nhập để bắt đầu hành trình học tập',
  },
  th: {
    'vocab.title': 'คำศัพท์',
    'vocab.subtitle': 'ทบทวนคำที่เรียนไปแล้วและฝึกฝน',
    'vocab.addTitle': 'เพิ่มคำใหม่',
    'auth.welcome': 'ยินดีต้อนรับ',
    'auth.signInHint': 'ลงชื่อเข้าใช้เพื่อเริ่มการเรียนรู้',
  },
  uk: {
    'vocab.title': 'Словник',
    'vocab.subtitle': 'Повторюйте вивчені слова та практикуйте їх.',
    'vocab.addTitle': 'Додати нове слово',
    'auth.welcome': 'Ласкаво просимо',
    'auth.signInHint': 'Увійдіть, щоб розпочати навчання',
  },
  el: {
    'vocab.title': 'Λεξιλόγιο',
    'vocab.subtitle': 'Επαναλάβετε τις λέξεις που μάθατε και εξασκηθείτε.',
    'vocab.addTitle': 'Προσθήκη νέας λέξης',
    'auth.welcome': 'Καλώς ήρθατε',
    'auth.signInHint': 'Συνδεθείτε για να ξεκινήσετε τη μάθηση',
  },
  cs: {
    'vocab.title': 'Slovní zásoba',
    'vocab.subtitle': 'Opakujte naučená slova a procvičujte je.',
    'vocab.addTitle': 'Přidat nové slovo',
    'auth.welcome': 'Vítejte',
    'auth.signInHint': 'Přihlaste se a začněte se učit',
  },
  ro: {
    'vocab.title': 'Vocabular',
    'vocab.subtitle': 'Revedeți cuvintele învățate și exersați-le.',
    'vocab.addTitle': 'Adaugă un cuvânt nou',
    'auth.welcome': 'Bine ați venit',
    'auth.signInHint': 'Autentificați-vă pentru a începe învățarea',
  },
  fa: {
    'vocab.title': 'واژگان',
    'vocab.subtitle': 'کلمات آموخته‌شده را مرور کنید و تمرین کنید.',
    'vocab.addTitle': 'افزودن واژه جدید',
    'auth.welcome': 'خوش آمدید',
    'auth.signInHint': 'برای شروع یادگیری وارد شوید',
  },
  ur: {
    'vocab.title': 'ذخیرہ الفاظ',
    'vocab.subtitle': 'سیکھے ہوئے الفاظ کا جائزہ لیں اور مشق کریں۔',
    'vocab.addTitle': 'نیا لفظ شامل کریں',
    'auth.welcome': 'خوش آمدید',
    'auth.signInHint': 'اپنی تعلیمی سفر شروع کرنے کے لیے سائن اِن کریں',
  },
  sw: {
    'vocab.title': 'Msamiati',
    'vocab.subtitle': 'Pitia maneno uliyojifunza na uyafanyie mazoezi.',
    'vocab.addTitle': 'Ongeza neno jipya',
    'auth.welcome': 'Karibu',
    'auth.signInHint': 'Ingia ili kuanza safari yako ya kujifunza',
  },
  // Extra RU polish for remaining awkward MT
  ru: {
    'reading.comp.desc': 'Читайте полные тексты и отвечайте на вопросы на понимание. Есть выделение для перевода и встроенное расширение словаря.',
    'listening.comp.desc': 'Слушайте аудиофрагменты и отвечайте на вопросы. Текст доступен по запросу.',
    'writing.subtitle': 'Выберите тип письменной практики.',
    'speaking.subtitle': 'Выберите режим говорения, чтобы развивать беглость, ритм и уверенность на экзамене.',
    'listening.subtitle': 'Тренируйте аудирование: тексты с вопросами, диктанты и полноценные тесты IELTS.',
    'custom.pasteTitle': 'Вставить свой текст',
    'custom.practiceTitle': 'Практика со своим текстом',
    'nav.dashboard': 'Статистика и активность',
    'library.continueBanner': 'Продолжить с того места, где остановились',
  },
};

let n = 0;
for (const [lang, map] of Object.entries(PACK)) {
  gen[lang] = { ...gen[lang], ...map };
  cache[lang] = { ...(cache[lang] || {}), ...gen[lang] };
  n += Object.keys(map).length;
}

fs.writeFileSync(outPath, JSON.stringify(gen, null, 2) + '\n');
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n');
console.log('Applied', n, 'pass-2 overrides');
