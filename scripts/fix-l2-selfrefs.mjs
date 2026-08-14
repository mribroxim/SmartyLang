/**
 * Fix English self-references in non-English lang packs.
 * Learners of L2 must not see "I learn/speak English" — rewrite to L2.
 *
 * Usage: node scripts/fix-l2-selfrefs.mjs [--dry]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const DRY = process.argv.includes('--dry');

/** @typedef {{ from: RegExp|string, to: string }[]} Repl */

/**
 * Ordered replacements (longer / more specific first).
 * Each lang maps English-language self-refs → that learning language.
 * @type {Record<string, { reps: [string|RegExp, string][], protect?: (string|RegExp)[] }>}
 */
const LANG = {
  ru: {
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
    reps: [
      [/англоязычн(ую|ой|ые|ых|ый|ого|ом)/gi, (_, e) => `русскоязычн${e}`],
      [/по-английски/gi, 'по-русски'],
      [/английского языка/gi, 'русского языка'],
      [/английскому языку/gi, 'русскому языку'],
      [/английском языке/gi, 'русском языке'],
      [/английским языком/gi, 'русским языком'],
      [/английский язык/gi, 'русский язык'],
      [/Английский язык/g, 'Русский язык'],
      [/английские (книги|песни|фильмы|слова|уроки)/gi, (_, w) => `русские ${w}`],
      [/английских (книг|песен|фильмов|слов|уроков)/gi, (_, w) => `русских ${w}`],
      [/английского (теста|урока|курса|класса|языка)/gi, (_, w) => `русского ${w}`],
      [/уроков английского/gi, 'уроков русского'],
      [/урок английского/gi, 'урок русского'],
      [/уроке английского/gi, 'уроке русского'],
      [/учитель английского/gi, 'учитель русского'],
      [/учителя английского/gi, 'учителя русского'],
      [/курс(?:е)? английского/gi, (m) => m.replace(/английского/i, 'русского')],
      [/изучени[ея] английского/gi, (m) => m.replace(/английского/i, 'русского')],
      [/изучаю английский/gi, 'изучаю русский'],
      [/учить английский/gi, 'учить русский'],
      [/учит английский/gi, 'учит русский'],
      [/изучает английский/gi, 'изучает русский'],
      [/практиковать английский/gi, 'практиковать русский'],
      [/разговорный английский/gi, 'разговорный русский'],
      [/на английском/gi, 'на русском'],
      [/по английскому/gi, 'по русскому'],
      [/английском и/gi, 'русском и'],
      [/и английском/gi, 'и русском'],
      [/испанском и английском/gi, 'испанском и русском'],
      [/\(английский, испанский\)/gi, '(русский, испанский)'],
      [/Английский —/g, 'Русский —'],
      [/Английский -/g, 'Русский -'],
      [/английский(?=[.,!?\s"»])/gi, 'русский'],
      [/Английский(?=[.,!?\s"»])/g, 'Русский'],
      [/английского(?=[.,!?\s"»])/gi, 'русского'],
      [/английском(?=[.,!?\s"»])/gi, 'русском'],
      [/английским(?=[.,!?\s"»])/gi, 'русским'],
      [/английские(?=[.,!?\s"»])/gi, 'русские'],
      [/английских(?=[.,!?\s"»])/gi, 'русских'],
      [/английскую(?=[.,!?\s"»])/gi, 'русскую'],
      [/английской(?=[.,!?\s"»])/gi, 'русской'],
      [/английская(?=[.,!?\s"»])/gi, 'русская'],
      [/Мастерств[оуа] английского/gi, (m) => m.replace(/английского/i, 'русского')],
      [/владени[яе] английским/gi, (m) => m.replace(/английским/i, 'русским')],
      [/B2 английского/gi, 'B2 русского'],
      [/нюансов английского/gi, 'нюансов русского'],
      [/История английского языка/g, 'История русского языка'],
      [/английского языка на уровне/gi, 'русского языка на уровне'],
    ],
  },
  uk: {
    protect: [
      /англійський вчений/gi,
      /вказівники англійською/gi,
      /Англійський парламент/g,
      /Англійської громадянської/g,
      /арабська, китайська, англійська, французька, російська/gi,
    ],
    reps: [
      [/англомовн(е|і|у|ого|ій|их)/gi, (_, e) => `україномовн${e === 'е' ? 'е' : e}`],
      [/англійською(?=\s|[,.!?»"]|$)/gi, 'українською'],
      [/англійської мови/gi, 'української мови'],
      [/англійську мову/gi, 'українську мову'],
      [/англійська мова/gi, 'українська мова'],
      [/англійський язык/gi, 'українська мова'],
      [/англійські (книжки|пісні|фільми|слова|уроки)/gi, (_, w) => `українські ${w}`],
      [/урок(?:у|ів)? англійської/gi, (m) => m.replace(/англійської/i, 'української')],
      [/вчител[ья] англійської/gi, (m) => m.replace(/англійської/i, 'української')],
      [/курс(?:у|і)? англійської/gi, (m) => m.replace(/англійської/i, 'української')],
      [/вивченн[яя] англійської/gi, (m) => m.replace(/англійської/i, 'української')],
      [/вивчаю англійську/gi, 'вивчаю українську'],
      [/вчити англійську/gi, 'вчити українську'],
      [/практикувати англійську/gi, 'практикувати українську'],
      [/розмовн(?:а|ий) англійськ/gi, (m) => m.replace(/англійськ/i, 'українськ')],
      [/Англійська –/g, 'Українська –'],
      [/Англійська —/g, 'Українська —'],
      [/англійськ(а|у|ої|ій|им|ому|ою|і|их)/gi, (_, e) => {
        const map = { а: 'а', у: 'у', ої: 'ої', ій: 'ій', им: 'им', ому: 'ому', ою: 'ою', і: 'і', их: 'их' };
        return 'українськ' + (map[e] || e);
      }],
      [/по-англійськи/gi, 'українською'],
      [/Історія англійської мови/g, 'Історія української мови'],
    ],
  },
  es: {
    protect: [
      /cient[ií]fico ingl[eé]s/gi,
      /señales en ingl[eé]s/gi,
      /Parlamento Ingl[eé]s/gi,
      /Guerra Civil Ingl[eé]sa/gi,
      /[aá]rabe, chino, ingl[eé]s, franc[eé]s, ruso/gi,
      /hablaba(?:n)? bien ingl[eé]s/gi,
    ],
    reps: [
      [/idioma ingl[eé]s/gi, 'idioma español'],
      [/lengua inglesa/gi, 'lengua española'],
      [/del ingl[eé]s/gi, 'del español'],
      [/al ingl[eé]s/gi, 'al español'],
      [/en ingl[eé]s/gi, 'en español'],
      [/de ingl[eé]s/gi, 'de español'],
      [/el ingl[eé]s/gi, 'el español'],
      [/El ingl[eé]s/g, 'El español'],
      [/aprender ingl[eé]s/gi, 'aprender español'],
      [/estudi(?:o|ar|ando) ingl[eé]s/gi, (m) => m.replace(/ingl[eé]s/i, 'español')],
      [/curso de ingl[eé]s/gi, 'curso de español'],
      [/lecci[oó]n de ingl[eé]s/gi, 'lección de español'],
      [/clase de ingl[eé]s/gi, 'clase de español'],
      [/profesor(?:a)? de ingl[eé]s/gi, (m) => m.replace(/ingl[eé]s/i, 'español')],
      [/libros en ingl[eé]s/gi, 'libros en español'],
      [/canciones en ingl[eé]s/gi, 'canciones en español'],
      [/pel[ií]culas en ingl[eé]s/gi, 'películas en español'],
      [/dominio del ingl[eé]s/gi, 'dominio del español'],
      [/maestr[ií]a del ingl[eé]s/gi, 'maestría del español'],
      [/fluidez.*ingl[eé]s/gi, (m) => m.replace(/ingl[eé]s/i, 'español')],
      [/Historia del Idioma Ingl[eé]s/gi, 'Historia del Idioma Español'],
      [/Ingl[eé]s(?=\s|[,.!?»"]|$)/g, 'Español'],
      [/ingl[eé]s(?=\s|[,.!?»"]|$)/gi, 'español'],
      [/inglesa/gi, 'española'],
      [/inglesas/gi, 'españolas'],
      [/ingleses/gi, 'españoles'],
    ],
  },
  de: {
    protect: [
      /englische(?:r)? Wissenschaftler/gi,
      /Schilder auf Englisch/gi,
      /englische(?:s)? Parlament/gi,
      /Englischen Bürgerkrieg/gi,
      /Arabisch, Chinesisch, Englisch, Französisch, Russisch/gi,
    ],
    reps: [
      [/englischen Sprache/gi, 'deutschen Sprache'],
      [/englische Sprache/gi, 'deutsche Sprache'],
      [/auf Englisch/gi, 'auf Deutsch'],
      [/in Englisch/gi, 'in Deutsch'],
      [/Englischkurs(?:es)?/gi, (m) => m.replace(/Englisch/i, 'Deutsch')],
      [/Englischstunde/gi, 'Deutschstunde'],
      [/Englischunterricht/gi, 'Deutschunterricht'],
      [/Englischlehrer(?:in)?/gi, (m) => m.replace(/Englisch/i, 'Deutsch')],
      [/Englischlernen/gi, 'Deutschlernen'],
      [/Englisch lernen/gi, 'Deutsch lernen'],
      [/lerne? Englisch/gi, (m) => m.replace(/Englisch/i, 'Deutsch')],
      [/englische (Bücher|Lieder|Filme|Wörter)/gi, (_, w) => `deutsche ${w}`],
      [/Beherrschung (?:des |der )?Englisch(?:en)?/gi, 'Beherrschung des Deutschen'],
      [/Geschichte der englischen Sprache/gi, 'Geschichte der deutschen Sprache'],
      [/Englisch(?=\s|[,.!?»"/-]|$)/g, 'Deutsch'],
      [/englisch(?=\s|[,.!?»"/-]|$)/gi, 'deutsch'],
      [/englische(?=\s|[,.!?»"]|$)/gi, 'deutsche'],
      [/englischen(?=\s|[,.!?»"]|$)/gi, 'deutschen'],
      [/englischer(?=\s|[,.!?»"]|$)/gi, 'deutscher'],
    ],
  },
  fr: {
    protect: [
      /scientifique anglais/gi,
      /panneaux en anglais/gi,
      /Parlement anglais/gi,
      /guerre civile anglaise/gi,
      /arabe, chinois, anglais, français, russe/gi,
      /pays anglophones/gi,
      /monde anglophone/gi,
    ],
    reps: [
      [/langue anglaise/gi, 'langue française'],
      [/l'anglais/gi, 'le français'],
      [/L'anglais/g, 'Le français'],
      [/d'anglais/gi, 'de français'],
      [/en anglais/gi, 'en français'],
      [/cours d'anglais/gi, 'cours de français'],
      [/le[cç]on d'anglais/gi, 'leçon de français'],
      [/professeur(?:e)? d'anglais/gi, (m) => m.replace(/anglais/i, 'français')],
      [/apprendre l'anglais/gi, 'apprendre le français'],
      [/[eé]tudie(?:r)? l'anglais/gi, (m) => m.replace(/anglais/i, 'français')],
      [/ma[iî]trise de l'anglais/gi, 'maîtrise du français'],
      [/histoire de la langue anglaise/gi, 'histoire de la langue française'],
      [/Anglais(?=\s|[,.!?»"]|$)/g, 'Français'],
      [/anglais(?=\s|[,.!?»"']|$)/gi, 'français'],
      [/anglaise/gi, 'française'],
      [/anglaises/gi, 'françaises'],
    ],
  },
  it: {
    protect: [
      /scienziato inglese/gi,
      /segnaletica in inglese/gi,
      /Parlamento inglese/gi,
      /guerra civile inglese/gi,
      /arabo, cinese, inglese, francese, russo/gi,
    ],
    reps: [
      [/lingua inglese/gi, 'lingua italiana'],
      [/in inglese/gi, 'in italiano'],
      [/di inglese/gi, 'di italiano'],
      [/l'inglese/gi, "l'italiano"],
      [/L'inglese/g, "L'italiano"],
      [/corso di inglese/gi, 'corso di italiano'],
      [/lezione di inglese/gi, 'lezione di italiano'],
      [/insegnante di inglese/gi, 'insegnante di italiano'],
      [/imparare l'inglese/gi, "imparare l'italiano"],
      [/studio inglese/gi, 'studio italiano'],
      [/padronanza dell'inglese/gi, "padronanza dell'italiano"],
      [/storia della lingua inglese/gi, 'storia della lingua italiana'],
      [/Inglese(?=\s|[,.!?»"]|$)/g, 'Italiano'],
      [/inglese(?=\s|[,.!?»"']|$)/gi, 'italiano'],
    ],
  },
  pt: {
    protect: [
      /cientista ingl[eê]s/gi,
      /placas em ingl[eê]s/gi,
      /Parlamento Ingl[eê]s/gi,
      /Guerra Civil Ingl[eê]sa/gi,
      /[aá]rabe, chin[eê]s, ingl[eê]s, franc[eê]s, russo/gi,
    ],
    reps: [
      [/l[ií]ngua inglesa/gi, 'língua portuguesa'],
      [/idioma ingl[eê]s/gi, 'idioma português'],
      [/em ingl[eê]s/gi, 'em português'],
      [/de ingl[eê]s/gi, 'de português'],
      [/o ingl[eê]s/gi, 'o português'],
      [/O ingl[eê]s/g, 'O português'],
      [/curso de ingl[eê]s/gi, 'curso de português'],
      [/aula de ingl[eê]s/gi, 'aula de português'],
      [/professor(?:a)? de ingl[eê]s/gi, (m) => m.replace(/ingl[eê]s/i, 'português')],
      [/aprender ingl[eê]s/gi, 'aprender português'],
      [/estud(?:o|ar|ando) ingl[eê]s/gi, (m) => m.replace(/ingl[eê]s/i, 'português')],
      [/maestria do ingl[eê]s/gi, 'maestria do português'],
      [/Hist[oó]ria da L[ií]ngua Inglesa/gi, 'História da Língua Portuguesa'],
      [/Ingl[eê]s(?=\s|[,.!?»"]|$)/g, 'Português'],
      [/ingl[eê]s(?=\s|[,.!?»"]|$)/gi, 'português'],
      [/inglesa/gi, 'portuguesa'],
    ],
  },
  nl: {
    protect: [
      /Engelse wetenschapper/gi,
      /borden in het Engels/gi,
      /Engelse parlement/gi,
      /Engelse Burgeroorlog/gi,
      /Arabisch, Chinees, Engels, Frans, Russisch/gi,
    ],
    reps: [
      [/Engelse taal/gi, 'Nederlandse taal'],
      [/in het Engels/gi, 'in het Nederlands'],
      [/het Engels/gi, 'het Nederlands'],
      [/cursus Engels/gi, 'cursus Nederlands'],
      [/Engelse les/gi, 'Nederlandse les'],
      [/Engels leren/gi, 'Nederlands leren'],
      [/Engels studeren/gi, 'Nederlands studeren'],
      [/Engelse (boeken|liedjes|films|woorden)/gi, (_, w) => `Nederlandse ${w}`],
      [/Geschiedenis van de Engelse Taal/gi, 'Geschiedenis van de Nederlandse Taal'],
      [/Engelse Beheersing/gi, 'Nederlandse Beheersing'],
      [/Engels meesterschap/gi, 'Nederlands meesterschap'],
      [/Engels(?=\s|[,.!?»"/-]|$)/g, 'Nederlands'],
      [/engels(?=\s|[,.!?»"/-]|$)/gi, 'nederlands'],
      [/Engelse(?=\s|[,.!?»"]|$)/g, 'Nederlandse'],
      [/engelse(?=\s|[,.!?»"]|$)/gi, 'nederlandse'],
    ],
  },
  pl: {
    protect: [
      /angielski naukowiec/gi,
      /oznakowanie po angielsku/gi,
      /angielski parlament/gi,
      /angielskiej wojny domowej/gi,
      /arabski, chiński, angielski, francuski, rosyjski/gi,
    ],
    reps: [
      [/języka angielskiego/gi, 'języka polskiego'],
      [/język angielski/gi, 'język polski'],
      [/po angielsku/gi, 'po polsku'],
      [/angielskiego/gi, 'polskiego'],
      [/angielskim/gi, 'polskim'],
      [/angielskiej/gi, 'polskiej'],
      [/angielskie/gi, 'polskie'],
      [/angielskich/gi, 'polskich'],
      [/angielską/gi, 'polską'],
      [/Angielski(?=\s|[,.!?»"]|$)/g, 'Polski'],
      [/angielski(?=\s|[,.!?»"]|$)/gi, 'polski'],
      [/Historia.*angielskiego/gi, (m) => m.replace(/angielskiego/i, 'polskiego')],
    ],
  },
  cs: {
    protect: [
      /anglický vědec/gi,
      /nápisy v angličtině/gi,
      /anglický parlament/gi,
      /anglické občanské války/gi,
    ],
    reps: [
      [/anglického jazyka/gi, 'českého jazyka'],
      [/anglický jazyk/gi, 'český jazyk'],
      [/v angličtině/gi, 'v češtině'],
      [/angličtin[ěy]/gi, (m) => m.replace(/angličtin/i, 'češtin')],
      [/anglick(ý|ého|ému|ém|ým|á|é|ou|ých|ými)/gi, (_, e) => `česk${e}`],
      [/Anglick(ý|ého)/g, (_, e) => `Česk${e}`],
      [/Historie anglického jazyka/gi, 'Historie českého jazyka'],
    ],
  },
  ro: {
    protect: [
      /om de știință englez/gi,
      /indicatoare în engleză/gi,
      /Parlamentul englez/gi,
    ],
    reps: [
      [/limba engleză/gi, 'limba română'],
      [/limbii engleze/gi, 'limbii române'],
      [/în engleză/gi, 'în română'],
      [/de engleză/gi, 'de română'],
      [/engleză/gi, 'română'],
      [/engleze/gi, 'române'],
      [/englez(?=\s|[,.!?»"]|$)/gi, 'român'],
      [/Engleză/g, 'Română'],
      [/Istoria limbii engleze/gi, 'Istoria limbii române'],
    ],
  },
  sv: {
    protect: [
      /engelsk forskare/gi,
      /skyltar på engelska/gi,
      /engelska parlamentet/gi,
    ],
    reps: [
      [/engelska språket/gi, 'svenska språket'],
      [/på engelska/gi, 'på svenska'],
      [/engelska/gi, 'svenska'],
      [/engelsk(?=\s|[,.!?»"]|$)/gi, 'svensk'],
      [/Engelska/g, 'Svenska'],
      [/Historia.*engelska/gi, (m) => m.replace(/engelska/i, 'svenska')],
    ],
  },
  tr: {
    protect: [
      /İngiliz bilim insanı/gi,
      /İngilizce tabelalar/gi,
      /İngiliz Parlamentosu/gi,
      /İngiliz İç Savaşı/gi,
    ],
    reps: [
      [/İngilizce dili/gi, 'Türkçe dili'],
      [/İngilizce(?=\s|[,.!?»"]|$)/g, 'Türkçe'],
      [/ingilizce(?=\s|[,.!?»"]|$)/gi, 'Türkçe'],
      [/İngilizcenin/g, 'Türkçenin'],
      [/İngilizceyi/g, 'Türkçeyi'],
      [/İngilizcede/g, 'Türkçede'],
      [/İngilizcenin tarihi/gi, 'Türkçenin tarihi'],
      [/History of.*İngiliz/gi, 'Türkçenin Tarihi'],
    ],
  },
  id: {
    // Do NOT replace bare "Inggris" — also means England/Britain in charts.
    protect: [
      /ilmuwan Inggris/gi,
      /petunjuk dalam bahasa Inggris/gi,
      /Parlemen Inggris/gi,
      /berbahasa Inggris/gi,
      /Inggris Raya/gi,
    ],
    reps: [
      [/Sejarah Bahasa Inggris/gi, 'Sejarah Bahasa Indonesia'],
      [/bahasa Inggris/gi, 'Bahasa Indonesia'],
      [/Bahasa Inggris/g, 'Bahasa Indonesia'],
      [/Pelajaran Bahasa Inggris/gi, 'Pelajaran Bahasa Indonesia'],
      [/kursus Bahasa Inggris/gi, 'kursus Bahasa Indonesia'],
      [/belajar Bahasa Inggris/gi, 'belajar Bahasa Indonesia'],
      [/Belajar Bahasa Inggris/g, 'Belajar Bahasa Indonesia'],
      [/penguasaan bahasa Inggris/gi, 'penguasaan Bahasa Indonesia'],
      [/kefasihan.*bahasa Inggris/gi, (m) => m.replace(/bahasa Inggris/gi, 'Bahasa Indonesia')],
      [/Duniaku dalam Bahasa Inggris/gi, 'Duniaku dalam Bahasa Indonesia'],
    ],
  },
  ms: {
    protect: [
      /saintis Inggeris/gi,
      /papan tanda dalam bahasa Inggeris/gi,
      /Parlimen Inggeris/gi,
      /berbahasa Inggeris/gi,
    ],
    reps: [
      [/Sejarah Bahasa Inggeris/gi, 'Sejarah Bahasa Melayu'],
      [/bahasa Inggeris/gi, 'Bahasa Melayu'],
      [/Bahasa Inggeris/g, 'Bahasa Melayu'],
      [/bahasa Inggris/gi, 'Bahasa Melayu'],
      [/Bahasa Inggris/g, 'Bahasa Melayu'],
      [/Pelajaran Bahasa Inggeris/gi, 'Pelajaran Bahasa Melayu'],
      [/kursus Bahasa Inggeris/gi, 'kursus Bahasa Melayu'],
      [/belajar Bahasa Inggeris/gi, 'belajar Bahasa Melayu'],
      [/Belajar Bahasa Inggris/g, 'Belajar Bahasa Melayu'],
      [/penguasaan bahasa Inggeris/gi, 'penguasaan Bahasa Melayu'],
      [/Dunia Saya dalam Bahasa Inggeris/gi, 'Dunia Saya dalam Bahasa Melayu'],
    ],
  },
  vi: {
    protect: [
      /nhà khoa học người Anh/gi,
      /biển chỉ dẫn bằng tiếng Anh/gi,
      /Nghị viện Anh/gi,
    ],
    reps: [
      [/tiếng Anh/gi, 'tiếng Việt'],
      [/Tiếng Anh/g, 'Tiếng Việt'],
      [/ngôn ngữ tiếng Anh/gi, 'ngôn ngữ tiếng Việt'],
      [/Lịch sử.*tiếng Anh/gi, 'Lịch sử ngôn ngữ tiếng Việt'],
    ],
  },
  th: {
    // Bare อังกฤษ also means England — only rewrite "ภาษาอังกฤษ".
    protect: [
      /นักวิทยาศาสตร์ชาวอังกฤษ/g,
      /ป้ายภาษาอังกฤษ/g,
      /รัฐสภาอังกฤษ/g,
      /อังกฤษและเวลส์/g,
    ],
    reps: [
      [/ภาษาอังกฤษ/g, 'ภาษาไทย'],
    ],
  },
  ja: {
    protect: [
      /イギリスの科学者/g,
      /英語の案内(?:板|表示)/g,
      /イギリス議会/g,
      /英国内戦/g,
      /アラビア語、中国語、英語、フランス語、ロシア語/g,
    ],
    reps: [
      [/英語の授業/g, '日本語の授業'],
      [/英語の世界/g, '日本語の世界'],
      [/英語学習/g, '日本語学習'],
      [/英語を/g, '日本語を'],
      [/英語の/g, '日本語の'],
      [/英語で/g, '日本語で'],
      [/英語は/g, '日本語は'],
      [/英語に/g, '日本語に'],
      [/英語が/g, '日本語が'],
      [/英語史/g, '日本語史'],
      [/英語(?=[。、！？\s」』]|$)/g, '日本語'],
    ],
  },
  ko: {
    protect: [
      /영국 과학자/g,
      /영어 표지판/g,
      /영국 의회/g,
      /아랍어, 중국어, 영어, 프랑스어, 러시아어/g,
    ],
    reps: [
      [/영어 수업/g, '한국어 수업'],
      [/영어를/g, '한국어를'],
      [/영어로/g, '한국어로'],
      [/영어의/g, '한국어의'],
      [/영어는/g, '한국어는'],
      [/영어 책/g, '한국어 책'],
      [/영어 노래/g, '한국어 노래'],
      [/영어(?=[.。,，!！?？\s」]|$)/g, '한국어'],
    ],
  },
  zh: {
    protect: [
      /英国科学家/g,
      /英文指示牌|英语指示牌/g,
      /英国议会/g,
      /英国内战/g,
      /阿拉伯语、汉语、英语、法语、俄语|阿拉伯语、中文、英语、法语、俄语/g,
    ],
    reps: [
      [/英语课/g, '中文课'],
      [/英语世界/g, '中文世界'],
      [/学习英语/g, '学习中文'],
      [/学英语/g, '学中文'],
      [/用英语/g, '用中文'],
      [/英语书/g, '中文书'],
      [/英语歌/g, '中文歌'],
      [/英语的/g, '中文的'],
      [/英语是/g, '中文是'],
      [/英语语言/g, '中文语言'],
      [/英语史|英语的历史/g, '中文的历史'],
      [/英语(?=[。，！？、\s」』]|$)/g, '中文'],
      [/英文(?=[。，！？、\s」』]|$)/g, '中文'],
    ],
  },
  ar: {
    protect: [
      /عالم إنجليزي/g,
      /لافتات باللغة الإنجليزية/g,
      /البرلمان الإنجليزي/g,
      /الحرب الأهلية الإنجليزية/g,
    ],
    reps: [
      [/اللغة الإنجليزية/g, 'اللغة العربية'],
      [/باللغة الإنجليزية/g, 'باللغة العربية'],
      [/الإنجليزية/g, 'العربية'],
      [/انجليزية/g, 'عربية'],
      [/إنجليزي(?=\s|[,.!?،]|$)/g, 'عربي'],
    ],
  },
  fa: {
    protect: [
      /دانشمند انگلیسی/g,
      /تابلوهای انگلیسی/g,
      /پارلمان انگلیس/g,
    ],
    reps: [
      [/زبان انگلیسی/g, 'زبان فارسی'],
      [/انگلیسی/g, 'فارسی'],
    ],
  },
  ur: {
    protect: [
      /انگریز سائنسدان/g,
      /انگریزی علامات/g,
      /انگریزی پارلیمنٹ/g,
    ],
    reps: [
      [/انگریزی زبان/g, 'اردو زبان'],
      [/انگریزی/g, 'اردو'],
    ],
  },
  hi: {
    protect: [
      /अंग्रेज़ वैज्ञानिक/g,
      /अंग्रेजी संकेत/g,
      /अंग्रेजी संसद/g,
    ],
    reps: [
      [/अंग्रेजी भाषा/g, 'हिन्दी भाषा'],
      [/अंग्रेज़ी/g, 'हिन्दी'],
      [/अंग्रेजी/g, 'हिन्दी'],
    ],
  },
  el: {
    protect: [
      /Άγγλος επιστήμονας/gi,
      /πινακίδες στα αγγλικά/gi,
      /αγγλικό κοινοβούλιο/gi,
    ],
    reps: [
      [/αγγλικής γλώσσας/gi, 'ελληνικής γλώσσας'],
      [/αγγλική γλώσσα/gi, 'ελληνική γλώσσα'],
      [/στα αγγλικά/gi, 'στα ελληνικά'],
      [/αγγλικά/gi, 'ελληνικά'],
      [/αγγλικ(ή|ής|ό|ού|ά)/gi, (_, e) => `ελληνικ${e}`],
      [/Αγγλικ(ή|ά)/g, (_, e) => `Ελληνικ${e}`],
    ],
  },
  uz: {
    // Prefer "ingliz tili" / "inglizcha" — avoid bare "ingliz" alone where possible
    protect: [
      /ingliz olimi/gi,
      /inglizcha belgilar/gi,
      /Ingliz parlamenti/gi,
      /Ingliz fuqarolik urushi/gi,
    ],
    reps: [
      [/ingliz tilini/gi, "o'zbek tilini"],
      [/Ingliz tilini/g, "O'zbek tilini"],
      [/ingliz tili/gi, "o'zbek tili"],
      [/Ingliz tili/g, "O'zbek tili"],
      [/inglizcha/gi, "o'zbekcha"],
      [/Inglizcha/g, "O'zbekcha"],
      [/ingliz tilidan/gi, "o'zbek tilidan"],
      [/ingliz tiliga/gi, "o'zbek tiliga"],
      [/ingliz tilida/gi, "o'zbek tilida"],
      // Remaining learner self-refs
      [/(o'rganaman|o'rganish|o'qiyman|gapirish|dars|kurs|kitob|qo'shiq).*?\bingliz\b/gi, (m) =>
        m.replace(/ingliz/gi, "o'zbek")],
      [/\bingliz\b(?=\s+(til|darsi|o'qituvchi|kitob|qo'shiq|kurs))/gi, "o'zbek"],
      [/Ingliz(?=\s+(til|darsi|o'qituvchi))/g, "O'zbek"],
    ],
  },
  sw: {
    protect: [
      /mwanasayansi wa Kiingereza/gi,
      /alama kwa Kiingereza/gi,
      /Bunge la Kiingereza/gi,
    ],
    reps: [
      [/lugha ya Kiingereza/gi, 'lugha ya Kiswahili'],
      [/Kiingereza/g, 'Kiswahili'],
      [/kiingereza/gi, 'kiswahili'],
    ],
  },
  tl: {
    protect: [
      /Ingles na siyentipiko/gi,
      /mga karatula sa Ingles/gi,
      /Parlamentong Ingles/gi,
      /\bEnglish scientist\b/gi,
      /\bEnglish Civil War\b/gi,
    ],
    reps: [
      [/wikang Ingles/gi, 'wikang Filipino'],
      [/Wikang Ingles/g, 'Wikang Filipino'],
      [/sa Ingles/gi, 'sa Filipino'],
      [/ng Ingles/gi, 'ng Filipino'],
      [/aralin sa Ingles/gi, 'aralin sa Filipino'],
      [/kursong Ingles/gi, 'kursong Filipino'],
      [/librong Ingles/gi, 'librong Filipino'],
      [/kantang Ingles/gi, 'kantang Filipino'],
      [/pag-aaral ng Ingles/gi, 'pag-aaral ng Filipino'],
      [/Kasaysayan ng Wikang Ingles/gi, 'Kasaysayan ng Wikang Filipino'],
      [/Ingles(?=\s|[,.!?»"]|$)/g, 'Filipino'],
      [/\bEnglish\b/g, 'Filipino'],
    ],
  },
};

/** Passages in level-texts that are about English linguistics history — flag after naive rename */
const HISTORY_IDS = new Set(['p45']);

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
  for (const [from, to] of reps) {
    if (typeof to === 'function') out = out.replace(from, to);
    else if (from instanceof RegExp) out = out.replace(from, to);
    else out = out.split(from).join(to);
  }
  return out;
}

function fixString(s, cfg) {
  if (typeof s !== 'string' || !s) return { s, n: 0 };
  const before = s;
  const { out, slots } = applyProtect(s, cfg.protect);
  let mid = applyReps(out, cfg.reps);
  mid = restoreProtect(mid, slots);
  return { s: mid, n: mid === before ? 0 : 1 };
}

function walk(obj, cfg, stats) {
  if (typeof obj === 'string') {
    const { s, n } = fixString(obj, cfg);
    stats.stringFixes += n;
    if (n) stats.changedStrings++;
    return s;
  }
  if (Array.isArray(obj)) return obj.map((x) => walk(x, cfg, stats));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = walk(v, cfg, stats);
    return out;
  }
  return obj;
}

/** task1 charts mix England geography, "English-speaking countries", and language surveys — skip all. */
const SKIP_TASK1 = true;

function processJsonFile(fp, cfg, stats, lang) {
  const base = path.basename(fp);
  if (base === 'task1.json' && SKIP_TASK1) {
    stats.skippedTask1 = true;
    return;
  }
  const raw = fs.readFileSync(fp, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('JSON parse fail', fp, e.message);
    return;
  }
  const before = JSON.stringify(data);
  const next = walk(data, cfg, stats);
  const after = JSON.stringify(next);
  if (before !== after) {
    stats.filesTouched++;
    if (!DRY) fs.writeFileSync(fp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  }
}

function processTextFile(fp, cfg, stats) {
  const raw = fs.readFileSync(fp, 'utf8');
  const { s, n } = fixString(raw, cfg);
  if (n) {
    stats.filesTouched++;
    stats.stringFixes += n;
    stats.changedStrings++;
    if (!DRY) fs.writeFileSync(fp, s, 'utf8');
  }
}

function main() {
  const langs = fs.readdirSync(PACKS).filter((d) => fs.statSync(path.join(PACKS, d)).isDirectory());
  const report = {};

  for (const lang of langs) {
    const cfg = LANG[lang];
    if (!cfg) {
      console.warn('No rules for', lang);
      continue;
    }
    const stats = { filesTouched: 0, stringFixes: 0, changedStrings: 0 };
    const dir = path.join(PACKS, lang);
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (f.endsWith('.json')) processJsonFile(fp, cfg, stats, lang);
    }
    const dictDir = path.join(dir, 'dictation');
    if (fs.existsSync(dictDir)) {
      for (const f of fs.readdirSync(dictDir)) {
        if (f.endsWith('.txt')) processTextFile(path.join(dictDir, f), cfg, stats);
      }
    }
    report[lang] = stats;
    console.log(
      `${lang}: files=${stats.filesTouched} stringFieldsChanged=${stats.changedStrings}`
    );
  }

  // Spot-check Russian b60
  if (!DRY) {
    const ru = JSON.parse(fs.readFileSync(path.join(PACKS, 'ru', 'level-texts.json'), 'utf8'));
    for (const passages of Object.values(ru)) {
      for (const p of passages) {
        if (p.id === 'b60') {
          console.log('\nSAMPLE ru b60 title:', p.title);
          console.log('SAMPLE ru b60 text:', p.text);
        }
        if (HISTORY_IDS.has(p.id)) {
          console.log(`\nNOTE ${p.id} history passage retargeted — verify factual fit:`, p.title);
        }
      }
    }
  }

  console.log('\nDONE', DRY ? '(dry run)' : '(written)');
  console.log(JSON.stringify(report, null, 2));
}

main();
