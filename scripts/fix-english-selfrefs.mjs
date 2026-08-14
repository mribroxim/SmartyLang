/**
 * Fix "content says English but learner studies another language" self-refs
 * across public/data/lang-packs/{lang}/.
 *
 * Usage: node scripts/fix-english-selfrefs.mjs [--dry]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const DRY = process.argv.includes('--dry');

/** level-texts ids that are ABOUT English as a historical subject — leave alone */
const SKIP_LEVEL_IDS = new Set(['p45']);

/**
 * Comprehensive-reading: skip passages whose title matches (factual English /
 * nationality / proper nouns — not "I'm learning English" self-refs).
 */
const SKIP_CR_TITLE = [
  /токио|tokyo|транспорт|transport|suica/i,
  /отел|hotel|бангкок|bangkok/i,
  /объедин[её]нн|united nations|\bоон\b|\bun\b|الأمم المتحدة|联合国|国際連合|국제연합/i,
  /микроскоп|microscope|مجهر|显微镜|顕微鏡|현미경/i,
  /демократ|democracy|легитимн|legitimacy|общественн(ого|ый) договор|social contract/i,
  /олимпий|olympi/i,
  /история английск|history of (the )?english|تاریخ زبان انگلیسی|تاريخ اللغة الإنجليزية|Sejarah Bahasa Inggris|Lịch sử.*[Tt]iếng Anh|英語の歴史|영어의 역사|英语.*历史|Historia de la lengua inglesa|Histoire de la langue anglaise|Geschichte der englischen Sprache|Storia della lingua inglese/i,
];

/**
 * Ordered longest-first replacements: [from, to]
 * Covers morphological forms of "English" → learning-language endonym forms.
 */
const REPLACEMENTS = {
  ru: [
    ['английского языка', 'русского языка'],
    ['Английского языка', 'Русского языка'],
    ['английский язык', 'русский язык'],
    ['Английский язык', 'Русский язык'],
    ['английском языке', 'русском языке'],
    ['английским языком', 'русским языком'],
    ['англоязычную среду', 'русскоязычную среду'],
    ['англоязычную', 'русскоязычную'],
    ['англоязычной', 'русскоязычной'],
    ['англоязычные', 'русскоязычные'],
    ['по-английски', 'по-русски'],
    ['английского', 'русского'],
    ['Английского', 'Русского'],
    ['английскому', 'русскому'],
    ['английским', 'русским'],
    ['английском', 'русском'],
    ['английский', 'русский'],
    ['Английский', 'Русский'],
    ['английские', 'русские'],
    ['Английские', 'Русские'],
    ['английских', 'русских'],
    ['английскую', 'русскую'],
    ['английская', 'русская'],
    ['Английская', 'Русская'],
    ['английское', 'русское'],
    ['английской', 'русской'],
  ],
  uk: [
    ['англійської мови', 'української мови'],
    ['Англійської мови', 'Української мови'],
    ['англійська мова', 'українська мова'],
    ['Англійська мова', 'Українська мова'],
    ['англійською мовою', 'українською мовою'],
    ['англомовне середовище', 'україномовне середовище'],
    ['англомовному', 'україномовному'],
    ['англомовн', 'україномовн'],
    ['англійською', 'українською'],
    ['англійського', 'українського'],
    ['Англійського', 'Українського'],
    ['англійському', 'українському'],
    ['англійським', 'українським'],
    ['англійський', 'український'],
    ['Англійський', 'Український'],
    ['англійські', 'українські'],
    ['англійських', 'українських'],
    ['англійську', 'українську'],
    ['англійська', 'українська'],
    ['Англійська', 'Українська'],
    ['англійське', 'українське'],
    ['англійської', 'української'],
  ],
  es: [
    ['el idioma inglés', 'el idioma español'],
    ['la lengua inglesa', 'la lengua española'],
    ['curso de inglés', 'curso de español'],
    ['clases de inglés', 'clases de español'],
    ['clase de inglés', 'clase de español'],
    ['profesor de inglés', 'profesor de español'],
    ['profesora de inglés', 'profesora de español'],
    ['examen de inglés', 'examen de español'],
    ['prueba de inglés', 'prueba de español'],
    ['libros en inglés', 'libros en español'],
    ['canciones en inglés', 'canciones en español'],
    ['películas en inglés', 'películas en español'],
    ['hablar inglés', 'hablar español'],
    ['habla inglés', 'habla español'],
    ['aprender inglés', 'aprender español'],
    ['estudiar inglés', 'estudiar español'],
    ['estudiando inglés', 'estudiando español'],
    ['aprendizaje del inglés', 'aprendizaje del español'],
    ['dominio del inglés', 'dominio del español'],
    ['en inglés', 'en español'],
    ['En inglés', 'En español'],
    ['del inglés', 'del español'],
    ['al inglés', 'al español'],
    ['el inglés', 'el español'],
    ['El inglés', 'El español'],
    ['un inglés', 'un español'],
    ['inglés', 'español'],
    ['Inglés', 'Español'],
    ['inglesa', 'española'],
    ['Inglesa', 'Española'],
    ['ingleses', 'españoles'],
  ],
  pt: [
    ['língua inglesa', 'língua portuguesa'],
    ['idioma inglês', 'idioma português'],
    ['curso de inglês', 'curso de português'],
    ['aulas de inglês', 'aulas de português'],
    ['aula de inglês', 'aula de português'],
    ['professor de inglês', 'professor de português'],
    ['professora de inglês', 'professora de português'],
    ['teste de inglês', 'teste de português'],
    ['prova de inglês', 'prova de português'],
    ['livros em inglês', 'livros em português'],
    ['músicas em inglês', 'músicas em português'],
    ['filmes em inglês', 'filmes em português'],
    ['falar inglês', 'falar português'],
    ['aprender inglês', 'aprender português'],
    ['estudar inglês', 'estudar português'],
    ['estudando inglês', 'estudando português'],
    ['em inglês', 'em português'],
    ['Em inglês', 'Em português'],
    ['do inglês', 'do português'],
    ['no inglês', 'no português'],
    ['o inglês', 'o português'],
    ['O inglês', 'O português'],
    ['inglês', 'português'],
    ['Inglês', 'Português'],
    ['inglesa', 'portuguesa'],
    ['Inglesa', 'Portuguesa'],
  ],
  fr: [
    ['langue anglaise', 'langue française'],
    ['cours d\'anglais', 'cours de français'],
    ['cours d’anglais', 'cours de français'],
    ['professeur d\'anglais', 'professeur de français'],
    ['professeur d’anglais', 'professeur de français'],
    ['leçon d\'anglais', 'leçon de français'],
    ['leçon d’anglais', 'leçon de français'],
    ['test d\'anglais', 'test de français'],
    ['test d’anglais', 'test de français'],
    ['livres anglais', 'livres français'],
    ['chansons anglaises', 'chansons françaises'],
    ['films anglais', 'films français'],
    ['parler anglais', 'parler français'],
    ['apprendre l\'anglais', 'apprendre le français'],
    ['apprendre l’anglais', 'apprendre le français'],
    ['étudier l\'anglais', 'étudier le français'],
    ['étudier l’anglais', 'étudier le français'],
    ['en anglais', 'en français'],
    ['En anglais', 'En français'],
    ['d\'anglais', 'de français'],
    ['d’anglais', 'de français'],
    ['l\'anglais', 'le français'],
    ['l’anglais', 'le français'],
    ['L\'anglais', 'Le français'],
    ['L’anglais', 'Le français'],
    ['anglais', 'français'],
    ['Anglais', 'Français'],
    ['anglaise', 'française'],
    ['Anglaise', 'Française'],
  ],
  de: [
    ['englischsprachigen Umgebung', 'deutschsprachigen Umgebung'],
    ['englischsprachige Umgebung', 'deutschsprachige Umgebung'],
    ['englischsprachigen', 'deutschsprachigen'],
    ['englischsprachige', 'deutschsprachige'],
    ['Englischunterricht', 'Deutschunterricht'],
    ['Englischlehrerin', 'Deutschlehrerin'],
    ['Englischlehrer', 'Deutschlehrer'],
    ['Englischstunde', 'Deutschstunde'],
    ['Englischkurses', 'Deutschkurses'],
    ['Englischkurs', 'Deutschkurs'],
    ['Englischtesten', 'Deutschtesten'],
    ['Englischtest', 'Deutschtest'],
    ['Englischlernen', 'Deutschlernen'],
    ['Englisch lernen', 'Deutsch lernen'],
    ['auf Englisch', 'auf Deutsch'],
    ['in Englisch', 'in Deutsch'],
    ['Englisch', 'Deutsch'],
    ['englischen', 'deutschen'],
    ['Englischen', 'Deutschen'],
    ['englischer', 'deutscher'],
    ['englische', 'deutsche'],
    ['Englische', 'Deutsche'],
    ['englisch', 'deutsch'],
  ],
  it: [
    ['lingua inglese', 'lingua italiana'],
    ['corso di inglese', 'corso di italiano'],
    ['lezione di inglese', 'lezione di italiano'],
    ['lezioni di inglese', 'lezioni di italiano'],
    ['insegnante di inglese', 'insegnante di italiano'],
    ['professore di inglese', 'professore di italiano'],
    ['test di inglese', 'test di italiano'],
    ['libri in inglese', 'libri in italiano'],
    ['canzoni in inglese', 'canzoni in italiano'],
    ['film in inglese', 'film in italiano'],
    ['parlare inglese', 'parlare italiano'],
    ['imparare l\'inglese', 'imparare l\'italiano'],
    ['imparare l’inglese', 'imparare l’italiano'],
    ['studiare inglese', 'studiare italiano'],
    ['in inglese', 'in italiano'],
    ['In inglese', 'In italiano'],
    ['dell\'inglese', 'dell\'italiano'],
    ['dell’inglese', 'dell’italiano'],
    ['l\'inglese', 'l\'italiano'],
    ['l’inglese', 'l’italiano'],
    ['L\'inglese', 'L\'italiano'],
    ['L’inglese', 'L’italiano'],
    ['inglese', 'italiano'],
    ['Inglese', 'Italiano'],
  ],
  nl: [
    ['Engelstalige omgeving', 'Nederlandstalige omgeving'],
    ['Engelstalige', 'Nederlandstalige'],
    ['Engelse les', 'Nederlandse les'],
    ['Engelse leraar', 'Nederlandse leraar'],
    ['Engelse docent', 'Nederlandse docent'],
    ['Engelse cursus', 'Nederlandse cursus'],
    ['Engelse test', 'Nederlandse test'],
    ['Engelse boeken', 'Nederlandse boeken'],
    ['Engelse liedjes', 'Nederlandse liedjes'],
    ['Engelse films', 'Nederlandse films'],
    ['Engels spreken', 'Nederlands spreken'],
    ['Engels leren', 'Nederlands leren'],
    ['Engels studeren', 'Nederlands studeren'],
    ['in het Engels', 'in het Nederlands'],
    ['In het Engels', 'In het Nederlands'],
    ['het Engels', 'het Nederlands'],
    ['Het Engels', 'Het Nederlands'],
    ['Engelse', 'Nederlandse'],
    ['Engels', 'Nederlands'],
    ['engels', 'nederlands'],
  ],
  pl: [
    ['języka angielskiego', 'języka polskiego'],
    ['język angielski', 'język polski'],
    ['Język angielski', 'Język polski'],
    ['lekcji angielskiego', 'lekcji polskiego'],
    ['lekcja angielskiego', 'lekcja polskiego'],
    ['nauczyciel angielskiego', 'nauczyciel polskiego'],
    ['testu z angielskiego', 'testu z polskiego'],
    ['test z angielskiego', 'test z polskiego'],
    ['angielskie książki', 'polskie książki'],
    ['angielskie piosenki', 'polskie piosenki'],
    ['angielskie filmy', 'polskie filmy'],
    ['mówić po angielsku', 'mówić po polsku'],
    ['uczyć się angielskiego', 'uczyć się polskiego'],
    ['nauka angielskiego', 'nauka polskiego'],
    ['po angielsku', 'po polsku'],
    ['Po angielsku', 'Po polsku'],
    ['angielskiego', 'polskiego'],
    ['Angielskiego', 'Polskiego'],
    ['angielskim', 'polskim'],
    ['angielski', 'polski'],
    ['Angielski', 'Polski'],
    ['angielskie', 'polskie'],
    ['angielskich', 'polskich'],
    ['angielskiej', 'polskiej'],
    ['angielsku', 'polsku'],
  ],
  tr: [
    ['İngilizce diline', 'Türkçe diline'],
    ['İngilizce dili', 'Türkçe dili'],
    ['İngilizce derslerim', 'Türkçe derslerim'],
    ['İngilizce dersleri', 'Türkçe dersleri'],
    ['İngilizce dersi', 'Türkçe dersi'],
    ['İngilizce öğretmeninizim', 'Türkçe öğretmeninizim'],
    ['İngilizce öğretmeni', 'Türkçe öğretmeni'],
    ['İngilizce sınavımdan', 'Türkçe sınavımdan'],
    ['İngilizce sınavı', 'Türkçe sınavı'],
    ['İngilizce kitaplar', 'Türkçe kitaplar'],
    ['İngilizce şarkılar', 'Türkçe şarkılar'],
    ['İngilizce filmler', 'Türkçe filmler'],
    ['İngilizce konuşmayı', 'Türkçe konuşmayı'],
    ['İngilizce konuşmak', 'Türkçe konuşmak'],
    ['İngilizce öğreniyorum', 'Türkçe öğreniyorum'],
    ['İngilizce öğrenmek', 'Türkçe öğrenmek'],
    ['İngilizce çalışıyorum', 'Türkçe çalışıyorum'],
    ['İngilizce\'de', 'Türkçe\'de'],
    ['İngilizce\'nin', 'Türkçe\'nin'],
    ['İngilizceye', 'Türkçeye'],
    ['İngilizce', 'Türkçe'],
  ],
  sv: [
    ['engelskspråkiga miljöer', 'svenskspråkiga miljöer'],
    ['engelskspråkig miljö', 'svenskspråkig miljö'],
    ['engelskspråkiga', 'svenskspråkiga'],
    ['engelsklektioner', 'svensklektioner'],
    ['engelsklektion', 'svensklektion'],
    ['engelskalektion', 'svensklektion'],
    ['engelskaprov', 'svenskprov'],
    ['engelskkursen', 'svenskkursen'],
    ['engelskkurs', 'svenskkurs'],
    ['engelska böcker', 'svenska böcker'],
    ['engelska sånger', 'svenska sånger'],
    ['engelska filmer', 'svenska filmer'],
    ['lära mig engelska', 'lära mig svenska'],
    ['lära sig engelska', 'lära sig svenska'],
    ['studera engelska', 'studera svenska'],
    ['tala engelska', 'tala svenska'],
    ['på engelska', 'på svenska'],
    ['i engelska', 'i svenska'],
    ['engelskan', 'svenskan'],
    ['Engelska', 'Svenska'],
    ['engelska', 'svenska'],
    ['engelskt', 'svenskt'],
    ['engelsk', 'svensk'],
  ],
  cs: [
    ['anglického jazyka', 'českého jazyka'],
    ['anglický jazyk', 'český jazyk'],
    ['Anglický jazyk', 'Český jazyk'],
    ['hodiny angličtiny', 'hodiny češtiny'],
    ['hodina angličtiny', 'hodina češtiny'],
    ['učitel angličtiny', 'učitel češtiny'],
    ['test z angličtiny', 'test z češtiny'],
    ['anglické knihy', 'české knihy'],
    ['anglické písně', 'české písně'],
    ['anglické filmy', 'české filmy'],
    ['učit se anglicky', 'učit se česky'],
    ['mluvit anglicky', 'mluvit česky'],
    ['studovat angličtinu', 'studovat češtinu'],
    ['v angličtině', 'v češtině'],
    ['angličtiny', 'češtiny'],
    ['angličtinu', 'češtinu'],
    ['angličtina', 'čeština'],
    ['Angličtina', 'Čeština'],
    ['anglicky', 'česky'],
    ['anglického', 'českého'],
    ['anglickém', 'českém'],
    ['anglický', 'český'],
    ['Anglický', 'Český'],
    ['anglické', 'české'],
    ['anglických', 'českých'],
    ['anglick', 'česk'],
  ],
  ro: [
    ['limbii engleze', 'limbii române'],
    ['limba engleză', 'limba română'],
    ['Limba engleză', 'Limba română'],
    ['curs de engleză', 'curs de română'],
    ['lecție de engleză', 'lecție de română'],
    ['lecții de engleză', 'lecții de română'],
    ['profesor de engleză', 'profesor de română'],
    ['test de engleză', 'test de română'],
    ['cărți în engleză', 'cărți în română'],
    ['cântece în engleză', 'cântece în română'],
    ['filme în engleză', 'filme în română'],
    ['vorbi engleza', 'vorbi româna'],
    ['învăța engleza', 'învăța româna'],
    ['studia engleza', 'studia româna'],
    ['în engleză', 'în română'],
    ['In engleză', 'În română'],
    ['englezească', 'românească'],
    ['englezesc', 'românesc'],
    ['engleze', 'române'],
    ['engleza', 'româna'],
    ['Engleza', 'Româna'],
    ['engleză', 'română'],
    ['Engleză', 'Română'],
    ['englez', 'român'],
    ['Englez', 'Român'],
  ],
  el: [
    ['αγγλικής γλώσσας', 'ελληνικής γλώσσας'],
    ['Αγγλικής γλώσσας', 'Ελληνικής γλώσσας'],
    ['αγγλική γλώσσα', 'ελληνική γλώσσα'],
    ['Αγγλική γλώσσα', 'Ελληνική γλώσσα'],
    ['μαθήματα αγγλικών', 'μαθήματα ελληνικών'],
    ['μαθήματα Αγγλικών', 'μαθήματα Ελληνικών'],
    ['μάθημα αγγλικών', 'μάθημα ελληνικών'],
    ['μάθημα Αγγλικών', 'μάθημα Ελληνικών'],
    ['μάθημα των Αγγλικών', 'μάθημα των Ελληνικών'],
    ['τεστ των Αγγλικών', 'τεστ των Ελληνικών'],
    ['εκμάθηση των Αγγλικών', 'εκμάθηση των Ελληνικών'],
    ['Εκμάθηση Αγγλικών', 'Εκμάθηση Ελληνικών'],
    ['δάσκαλος αγγλικών', 'δάσκαλος ελληνικών'],
    ['δασκάλα μας των Αγγλικών', 'δασκάλα μας των Ελληνικών'],
    ['των Αγγλικών', 'των Ελληνικών'],
    ['τεστ αγγλικών', 'τεστ ελληνικών'],
    ['αγγλικά βιβλία', 'ελληνικά βιβλία'],
    ['αγγλικά τραγούδια', 'ελληνικά τραγούδια'],
    ['αγγλικές ταινίες', 'ελληνικές ταινίες'],
    ['μιλάω αγγλικά', 'μιλάω ελληνικά'],
    ['μαθαίνω αγγλικά', 'μαθαίνω ελληνικά'],
    ['στα αγγλικά', 'στα ελληνικά'],
    ['Στα αγγλικά', 'Στα ελληνικά'],
    ['τα αγγλικά', 'τα ελληνικά'],
    ['Τα αγγλικά', 'Τα ελληνικά'],
    ['αγγλικών', 'ελληνικών'],
    ['Αγγλικών', 'Ελληνικών'],
    ['αγγλικής', 'ελληνικής'],
    ['Αγγλικής', 'Ελληνικής'],
    ['αγγλικό', 'ελληνικό'],
    ['αγγλική', 'ελληνική'],
    ['Αγγλική', 'Ελληνική'],
    ['αγγλικά', 'ελληνικά'],
    ['Αγγλικά', 'Ελληνικά'],
    ['αγγλικού', 'ελληνικού'],
    ['Αγγλικ', 'Ελληνικ'],
    ['αγγλικ', 'ελληνικ'],
  ],
  hi: [
    ['अंग्रेज़ी भाषा', 'हिन्दी भाषा'],
    ['अंग्रेजी भाषा', 'हिन्दी भाषा'],
    ['अंग्रेज़ी की कक्षा', 'हिन्दी की कक्षा'],
    ['अंग्रेजी की कक्षा', 'हिन्दी की कक्षा'],
    ['अंग्रेज़ी शिक्षक', 'हिन्दी शिक्षक'],
    ['अंग्रेजी शिक्षक', 'हिन्दी शिक्षक'],
    ['अंग्रेज़ी परीक्षा', 'हिन्दी परीक्षा'],
    ['अंग्रेजी परीक्षा', 'हिन्दी परीक्षा'],
    ['अंग्रेज़ी किताबें', 'हिन्दी किताबें'],
    ['अंग्रेजी किताबें', 'हिन्दी किताबें'],
    ['अंग्रेज़ी गाने', 'हिन्दी गाने'],
    ['अंग्रेजी गाने', 'हिन्दी गाने'],
    ['अंग्रेज़ी बोलना', 'हिन्दी बोलना'],
    ['अंग्रेजी बोलना', 'हिन्दी बोलना'],
    ['अंग्रेज़ी सीखना', 'हिन्दी सीखना'],
    ['अंग्रेजी सीखना', 'हिन्दी सीखना'],
    ['अंग्रेज़ी में', 'हिन्दी में'],
    ['अंग्रेजी में', 'हिन्दी में'],
    ['अंग्रेज़ी', 'हिन्दी'],
    ['अंग्रेजी', 'हिन्दी'],
  ],
  id: [
    ['pelajaran bahasa Inggris', 'pelajaran bahasa Indonesia'],
    ['kursus bahasa Inggris', 'kursus bahasa Indonesia'],
    ['guru bahasa Inggris', 'guru bahasa Indonesia'],
    ['tes bahasa Inggris', 'tes bahasa Indonesia'],
    ['buku bahasa Inggris', 'buku bahasa Indonesia'],
    ['lagu-lagu bahasa Inggris', 'lagu-lagu bahasa Indonesia'],
    ['lagu bahasa Inggris', 'lagu bahasa Indonesia'],
    ['film bahasa Inggris', 'film bahasa Indonesia'],
    ['berbicara bahasa Inggris', 'berbicara bahasa Indonesia'],
    ['belajar bahasa Inggris', 'belajar bahasa Indonesia'],
    ['dalam bahasa Inggris', 'dalam bahasa Indonesia'],
    ['Bahasa Inggris', 'Bahasa Indonesia'],
    ['bahasa Inggris', 'bahasa Indonesia'],
    // bilingual / bare language name (not country "di Inggris")
    ['Spanyol dan Inggris', 'Spanyol dan Indonesia'],
    ['(Inggris, Spanyol)', '(Indonesia, Spanyol)'],
  ],
  ms: [
    ['pelajaran bahasa Inggeris', 'pelajaran bahasa Melayu'],
    ['kursus bahasa Inggeris', 'kursus bahasa Melayu'],
    ['guru bahasa Inggeris', 'guru bahasa Melayu'],
    ['ujian bahasa Inggeris', 'ujian bahasa Melayu'],
    ['buku bahasa Inggeris', 'buku bahasa Melayu'],
    ['lagu bahasa Inggeris', 'lagu bahasa Melayu'],
    ['filem bahasa Inggeris', 'filem bahasa Melayu'],
    ['bertutur bahasa Inggeris', 'bertutur bahasa Melayu'],
    ['belajar bahasa Inggeris', 'belajar bahasa Melayu'],
    ['dalam bahasa Inggeris', 'dalam bahasa Melayu'],
    ['Bahasa Inggeris', 'Bahasa Melayu'],
    ['bahasa Inggeris', 'bahasa Melayu'],
    ['Sepanyol dan Inggeris', 'Sepanyol dan Melayu'],
  ],
  vi: [
    ['ngôn ngữ Tiếng Anh', 'ngôn ngữ Tiếng Việt'],
    ['ngôn ngữ tiếng Anh', 'ngôn ngữ tiếng Việt'],
    ['khóa học tiếng Anh', 'khóa học tiếng Việt'],
    ['bài học tiếng Anh', 'bài học tiếng Việt'],
    ['giáo viên tiếng Anh', 'giáo viên tiếng Việt'],
    ['bài kiểm tra tiếng Anh', 'bài kiểm tra tiếng Việt'],
    ['sách tiếng Anh', 'sách tiếng Việt'],
    ['nhạc tiếng Anh', 'nhạc tiếng Việt'],
    ['phim tiếng Anh', 'phim tiếng Việt'],
    ['nói tiếng Anh', 'nói tiếng Việt'],
    ['học tiếng Anh', 'học tiếng Việt'],
    ['bằng tiếng Anh', 'bằng tiếng Việt'],
    ['Tiếng Anh', 'Tiếng Việt'],
    ['tiếng Anh', 'tiếng Việt'],
  ],
  th: [
    ['ภาษาอังกฤษ', 'ภาษาไทย'],
    ['สเปน และ อังกฤษ', 'สเปน และ ไทย'],
    ['(อังกฤษ, สเปน)', '(ไทย, สเปน)'],
    // Do NOT bare-replace อังกฤษ — also means England (e.g. ในอังกฤษ).
  ],
  zh: [
    ['英语课', '中文课'],
    ['英语老师', '中文老师'],
    ['英语考试', '中文考试'],
    ['英语课程', '中文课程'],
    ['英语书', '中文书'],
    ['英语歌', '中文歌'],
    ['英语电影', '中文电影'],
    ['说英语', '说中文'],
    ['学英语', '学中文'],
    ['学习英语', '学习中文'],
    ['用英语', '用中文'],
    ['英语语言', '中文语言'],
    ['英文', '中文'],
    ['英语', '中文'],
  ],
  ja: [
    ['英語の授業', '日本語の授業'],
    ['英語の先生', '日本語の先生'],
    ['英語のテスト', '日本語のテスト'],
    ['英語のコース', '日本語のコース'],
    ['英語の本', '日本語の本'],
    ['英語の歌', '日本語の歌'],
    ['英語の映画', '日本語の映画'],
    ['英語を話す', '日本語を話す'],
    ['英語を学ぶ', '日本語を学ぶ'],
    ['英語を勉強', '日本語を勉強'],
    ['英語で', '日本語で'],
    ['英語', '日本語'],
  ],
  ko: [
    ['영어 수업', '한국어 수업'],
    ['영어 선생님', '한국어 선생님'],
    ['영어 시험', '한국어 시험'],
    ['영어 과정', '한국어 과정'],
    ['영어 책', '한국어 책'],
    ['영어 노래', '한국어 노래'],
    ['영어 영화', '한국어 영화'],
    ['영어를 말', '한국어를 말'],
    ['영어를 배우', '한국어를 배우'],
    ['영어를 공부', '한국어를 공부'],
    ['영어로', '한국어로'],
    ['영어', '한국어'],
  ],
  ar: [
    ['اللغة الإنجليزية', 'اللغة العربية'],
    ['لغة الإنجليزية', 'لغة العربية'],
    ['دروس اللغة الإنجليزية', 'دروس اللغة العربية'],
    ['درس اللغة الإنجليزية', 'درس اللغة العربية'],
    ['معلم اللغة الإنجليزية', 'معلم اللغة العربية'],
    ['معلمة اللغة الإنجليزية', 'معلمة اللغة العربية'],
    ['اختبار اللغة الإنجليزية', 'اختبار اللغة العربية'],
    ['كتب إنجليزية', 'كتب عربية'],
    ['أغاني إنجليزية', 'أغاني عربية'],
    ['أفلام إنجليزية', 'أفلام عربية'],
    ['التحدث باللغة الإنجليزية', 'التحدث باللغة العربية'],
    ['تعلم اللغة الإنجليزية', 'تعلم اللغة العربية'],
    ['دراسة اللغة الإنجليزية', 'دراسة اللغة العربية'],
    ['باللغة الإنجليزية', 'باللغة العربية'],
    ['الإنجليزية', 'العربية'],
    ['إنجليزية', 'عربية'],
    ['إنجليزي', 'عربي'],
  ],
  fa: [
    ['زبان انگلیسی', 'زبان فارسی'],
    ['کلاس انگلیسی', 'کلاس فارسی'],
    ['معلم انگلیسی', 'معلم فارسی'],
    ['آزمون انگلیسی', 'آزمون فارسی'],
    ['کتاب‌های انگلیسی', 'کتاب‌های فارسی'],
    ['آهنگ‌های انگلیسی', 'آهنگ‌های فارسی'],
    ['فیلم‌های انگلیسی', 'فیلم‌های فارسی'],
    ['صحبت کردن به انگلیسی', 'صحبت کردن به فارسی'],
    ['یادگیری انگلیسی', 'یادگیری فارسی'],
    ['مطالعه انگلیسی', 'مطالعه فارسی'],
    ['به انگلیسی', 'به فارسی'],
    ['انگلیسی', 'فارسی'],
  ],
  ur: [
    ['انگریزی زبان', 'اردو زبان'],
    ['انگریزی کی کلاس', 'اردو کی کلاس'],
    ['انگریزی استاد', 'اردو استاد'],
    ['انگریزی امتحان', 'اردو امتحان'],
    ['انگریزی کتابیں', 'اردو کتابیں'],
    ['انگریزی گانے', 'اردو گانے'],
    ['انگریزی فلمیں', 'اردو فلمیں'],
    ['انگریزی بولنا', 'اردو بولنا'],
    ['انگریزی سیکھنا', 'اردو سیکھنا'],
    ['انگریزی پڑھنا', 'اردو پڑھنا'],
    ['انگریزی میں', 'اردو میں'],
    ['انگریزی', 'اردو'],
  ],
  uz: [
    ['ingliz tili', 'oʻzbek tili'],
    ['Ingliz tili', 'Oʻzbek tili'],
    ['inglizcha darslar', 'oʻzbekcha darslar'],
    ['inglizcha dars', 'oʻzbekcha dars'],
    ['inglizcha o\'qituvchi', 'o\'zbekcha o\'qituvchi'],
    ['inglizcha test', 'o\'zbekcha test'],
    ['inglizcha kitoblar', 'o\'zbekcha kitoblar'],
    ['inglizcha qo\'shiqlar', 'o\'zbekcha qo\'shiqlar'],
    ['inglizcha gapirish', 'o\'zbekcha gapirish'],
    ['inglizcha o\'rganish', 'o\'zbekcha o\'rganish'],
    ['inglizcha', 'oʻzbekcha'],
    ['Inglizcha', 'Oʻzbekcha'],
    ['ingliz', 'oʻzbek'],
    ['Ingliz', 'Oʻzbek'],
  ],
  tl: [
    ['wikang English', 'wikang Tagalog'],
    ['wikang Ingles', 'wikang Tagalog'],
    ['English class', 'Tagalog class'],
    ['English teacher', 'Tagalog teacher'],
    ['English test', 'Tagalog test'],
    ['English course', 'Tagalog course'],
    ['English books', 'Tagalog books'],
    ['English songs', 'Tagalog songs'],
    ['English movies', 'Tagalog movies'],
    ['speak English', 'magsalita ng Tagalog'],
    ['speaking English', 'pagsasalita ng Tagalog'],
    ['learn English', 'matuto ng Tagalog'],
    ['learning English', 'pag-aaral ng Tagalog'],
    ['study English', 'mag-aral ng Tagalog'],
    ['in English', 'sa Tagalog'],
    ['In English', 'Sa Tagalog'],
    ['English', 'Tagalog'],
    ['Ingles', 'Tagalog'],
    ['ingles', 'Tagalog'],
  ],
  sw: [
    ['lugha ya Kiingereza', 'lugha ya Kiswahili'],
    ['somo la Kiingereza', 'somo la Kiswahili'],
    ['mwalimu wa Kiingereza', 'mwalimu wa Kiswahili'],
    ['mtihani wa Kiingereza', 'mtihani wa Kiswahili'],
    ['vitabu vya Kiingereza', 'vitabu vya Kiswahili'],
    ['nyimbo za Kiingereza', 'nyimbo za Kiswahili'],
    ['filamu za Kiingereza', 'filamu za Kiswahili'],
    ['kuzungumza Kiingereza', 'kuzungumza Kiswahili'],
    ['kujifunza Kiingereza', 'kujifunza Kiswahili'],
    ['kwa Kiingereza', 'kwa Kiswahili'],
    ['Kiingereza', 'Kiswahili'],
  ],
};

function applyReplacements(text, pairs) {
  let out = text;
  let count = 0;
  const examples = [];
  for (const [from, to] of pairs) {
    if (!from || from === to) continue;
    if (!out.includes(from)) continue;
    const before = out;
    // global replace of literal substring
    out = out.split(from).join(to);
    if (out !== before) {
      const n = (before.split(from).length - 1);
      count += n;
      if (examples.length < 3) examples.push(`${from} → ${to}`);
    }
  }
  return { text: out, count, examples };
}

function shouldSkipCrTitle(title) {
  if (!title) return false;
  return SKIP_CR_TITLE.some((re) => re.test(title));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(json|txt)$/i.test(e.name)) files.push(p);
  }
  return files;
}

function fixLevelTexts(lang, file, pairs, report) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let total = 0;
  const examples = [];
  for (const items of Object.values(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (SKIP_LEVEL_IDS.has(item.id)) {
        report.skipped.push({ lang, file: path.relative(PACKS, file), id: item.id, reason: 'History of English Language (factual)' });
        continue;
      }
      for (const key of ['title', 'text']) {
        if (typeof item[key] !== 'string') continue;
        const r = applyReplacements(item[key], pairs);
        if (r.count) {
          item[key] = r.text;
          total += r.count;
          for (const e of r.examples) if (examples.length < 5) examples.push(e);
        }
      }
      if (Array.isArray(item.vocabulary)) {
        for (const v of item.vocabulary) {
          for (const key of ['word', 'definition']) {
            if (typeof v[key] !== 'string') continue;
            const r = applyReplacements(v[key], pairs);
            if (r.count) {
              v[key] = r.text;
              total += r.count;
            }
          }
        }
      }
    }
  }
  if (total && !DRY) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return { total, examples };
}

function fixJsonDeep(lang, file, pairs, report, opts = {}) {
  const raw = fs.readFileSync(file, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { total: 0, examples: [] };
  }

  let total = 0;
  const examples = [];

  function visit(node, parent = null, key = null) {
    if (node == null) return;
    if (typeof node === 'string') {
      // Array string elements — replace in parent
      if (parent != null && key != null && typeof parent[key] === 'string') {
        if (opts.skipChartLabels && (node === 'English' || node === 'English (%)' || /^Reasons for Studying English/i.test(node))) {
          report.skipped.push({ lang, file: path.relative(PACKS, file), value: node, reason: 'task chart label about English as survey topic' });
          return;
        }
        const r = applyReplacements(node, pairs);
        if (r.count) {
          parent[key] = r.text;
          total += r.count;
          for (const e of r.examples) if (examples.length < 5) examples.push(e);
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (typeof node[i] === 'string') {
          if (opts.skipChartLabels && (node[i] === 'English' || node[i] === 'English (%)' || /^Reasons for Studying English/i.test(node[i]))) {
            report.skipped.push({ lang, file: path.relative(PACKS, file), value: node[i], reason: 'task chart label about English as survey topic' });
            continue;
          }
          const r = applyReplacements(node[i], pairs);
          if (r.count) {
            node[i] = r.text;
            total += r.count;
            for (const e of r.examples) if (examples.length < 5) examples.push(e);
          }
        } else {
          visit(node[i], node, i);
        }
      }
      return;
    }
    if (typeof node !== 'object') return;

    // comprehensive-reading skip by title
    if (opts.skipCr && typeof node.title === 'string' && shouldSkipCrTitle(node.title)) {
      report.skipped.push({ lang, file: path.relative(PACKS, file), title: node.title, reason: 'factual/proper-noun English' });
      return;
    }

    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        if (opts.skipChartLabels && (v === 'English' || v === 'English (%)' || /^Reasons for Studying English/i.test(v))) {
          report.skipped.push({ lang, file: path.relative(PACKS, file), value: v, reason: 'task chart label about English as survey topic' });
          continue;
        }
        const r = applyReplacements(v, pairs);
        if (r.count) {
          node[k] = r.text;
          total += r.count;
          for (const e of r.examples) if (examples.length < 5) examples.push(e);
        }
      } else {
        visit(v, node, k);
      }
    }
  }

  visit(data);
  if (total && !DRY) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return { total, examples };
}

function fixTxt(lang, file, pairs) {
  const raw = fs.readFileSync(file, 'utf8');
  const r = applyReplacements(raw, pairs);
  if (r.count && !DRY) fs.writeFileSync(file, r.text, 'utf8');
  return r;
}

const report = {
  dry: DRY,
  languages: {},
  skipped: [],
};

const langs = fs.readdirSync(PACKS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const lang of langs) {
  const pairs = REPLACEMENTS[lang];
  if (!pairs) {
    report.languages[lang] = { note: 'no replacement map', files: {} };
    continue;
  }
  const files = walk(path.join(PACKS, lang));
  const langReport = { files: {}, examples: [] };

  for (const file of files) {
    const base = path.basename(file);
    const rel = path.relative(PACKS, file);
    let result = { total: 0, examples: [] };

    if (base === 'level-texts.json') {
      result = fixLevelTexts(lang, file, pairs, report);
    } else if (base === 'comprehensive-reading.json') {
      result = fixJsonDeep(lang, file, pairs, report, { skipCr: true });
    } else if (base === 'task1.json' || base === 'task2.json') {
      // Writing Task 1/2 often includes charts/surveys ABOUT English as a
      // global language — leave those alone (not course self-refs).
      report.skipped.push({
        lang,
        file: rel,
        reason: 'task1/task2 survey/chart content about English left unchanged',
      });
      continue;
    } else if (base.endsWith('.txt')) {
      result = fixTxt(lang, file, pairs);
    } else if (base.endsWith('.json')) {
      result = fixJsonDeep(lang, file, pairs, report);
    }

    if (result.total) {
      langReport.files[rel] = result.total;
      for (const e of result.examples) {
        if (langReport.examples.length < 6) langReport.examples.push(e);
      }
    }
  }

  report.languages[lang] = langReport;
}

const outPath = path.join(ROOT, 'scripts', '_selfref-fix-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

let grand = 0;
for (const lr of Object.values(report.languages)) {
  for (const n of Object.values(lr.files || {})) grand += n;
}
console.log(DRY ? 'DRY RUN' : 'APPLIED');
console.log('Total replacements:', grand);
console.log('Skipped entries:', report.skipped.length);
console.log('Report:', outPath);
for (const [lang, lr] of Object.entries(report.languages)) {
  const n = Object.values(lr.files || {}).reduce((a, b) => a + b, 0);
  if (!n) continue;
  console.log(`  ${lang}: ${n} in ${Object.keys(lr.files).length} files — e.g. ${lr.examples[0] || ''}`);
}
