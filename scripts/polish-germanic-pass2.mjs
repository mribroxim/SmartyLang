/**
 * Pass 2: deeper literary + L2-self-ref fixes for de/nl/sv
 */
import fs from 'fs';
import path from 'path';

const BASE = 'C:/Users/user/Desktop/Projects/Smarty English/public/data/lang-packs';
const log = [];

function save(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function replaceAllInStrings(node, pairs, skipKeys = new Set()) {
  let n = 0;
  function walk(o, key) {
    if (o == null) return o;
    if (typeof o === 'string') {
      let s = o;
      for (const [a, b] of pairs) {
        if (a instanceof RegExp) {
          const before = s;
          s = s.replace(a, b);
          if (s !== before) n++;
        } else if (s.includes(a)) {
          const c = s.split(a).length - 1;
          s = s.split(a).join(b);
          n += c;
        }
      }
      return s;
    }
    if (Array.isArray(o)) return o.map((x) => walk(x, key));
    if (typeof o === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(o)) {
        if (skipKeys.has(k)) out[k] = v;
        else out[k] = walk(v, k);
      }
      return out;
    }
    return o;
  }
  return { data: walk(node), n };
}

// ── DE ──
{
  const lang = 'de';
  const dir = path.join(BASE, lang);

  // level-texts: fix leftover Weltsprache vocab
  {
    const f = 'level-texts.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const level of Object.keys(data)) {
      for (const item of data[level]) {
        if (item.id === 'b79' && Array.isArray(item.vocabulary)) {
          for (const v of item.vocabulary) {
            if (v.word === 'Weltsprache') {
              v.word = 'Europa';
              v.definition = '(Nomen) Der Kontinent, auf dem Deutschland liegt.';
            }
          }
        }
        if (typeof item.text === 'string') {
          item.text = item.text
            .replace(/dieser Exposition/g, 'dieser Belastung')
            .replace(/dieser Exposition werden/g, 'dieser Belastung werden')
            .replace(/Auswirkungen dieser Exposition/g, 'Auswirkungen dieser Belastung');
        }
      }
    }
    // Advanced a1 opener polish
    if (data.Advanced?.[0]) {
      data.Advanced[0].text = data.Advanced[0].text
        .replace(/Das unermüdliche Streben|Das unaufhörliche Streben/g, 'Das unablässige Streben')
        .replace(/sozioökonomische Ungleichheiten weiter zu verschärfen/g, 'sozioökonomische Ungleichheiten weiter zu vertiefen');
    }
    save(p, data);
    log.push(`${lang}/${f}: vocab+exposition`);
  }

  // task2 world-language false claims → sensible L2 / general prompts
  {
    const f = 'task2.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [
        'Deutsch wird zur universellen Weltsprache. Dies ist eine positive Entwicklung für die internationalen Beziehungen und den Handel. Inwieweit stimmen Sie zu oder nicht?',
        'Deutsch gewinnt in Wirtschaft, Wissenschaft und Diplomatie in Europa an Bedeutung. Ist das Ihrer Meinung nach eine positive Entwicklung für internationale Beziehungen und Handel? Inwieweit stimmen Sie zu oder nicht?',
      ],
      [
        /Deutsch wird immer mehr zur Weltsprache (des|von) Reisen und Tourismus\. Was sind die Vor- und Nachteile davon, eine einzige dominante Weltsprache zu haben\?/g,
        'Eine dominante Verkehrssprache im internationalen Tourismus vereinfacht Reisen, kann aber lokale Sprachen verdrängen. Was sind die Vor- und Nachteile einer einzigen dominanten Weltsprache?',
      ],
      [
        /Deutsch ist (die|zur) dominante[n]? Sprache (des internationalen Geschäftslebens|von Wirtschaft und Wissenschaft).*?\?/gs,
        'Eine gemeinsame Verkehrssprache beherrscht oft internationales Geschäftsleben und Wissenschaft. Warum entsteht eine solche dominante Sprache – und welche Nachteile hat sie?',
      ],
      [/früherer Umgang/g, 'früher Umgang'],
      [/eine gesunde Vereinbarkeit von Beruf und Privatleben aufrechtzuerhalten/g, 'Beruf und Privatleben unter einen Hut zu bringen'],
      [/Vielen Arbeitnehmern fällt es schwer, eine gesunde Vereinbarkeit von Beruf und Privatleben aufrechtzuerhalten/g, 'Vielen Berufstätigen fällt es schwer, Beruf und Privatleben unter einen Hut zu bringen'],
      [/Besprechen Sie beide Ansichten und geben Sie Ihre Meinung ab\./g, 'Erörtern Sie beide Standpunkte und legen Sie Ihre eigene Meinung dar.'],
      [/Besprechen Sie beide Ansichten und geben Sie Ihre eigene Meinung ab\./g, 'Erörtern Sie beide Standpunkte und legen Sie Ihre eigene Meinung dar.'],
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    save(p, data);
    log.push(`${lang}/${f}: world-lang + register`);
  }

  // CR literary fixes
  {
    const f = 'comprehensive-reading.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [/Es ist aus Metall gefertigt und rot lackiert\. Es läuft auf winzigen Gleisen/g, 'Sie ist aus Metall und rot lackiert. Sie fährt auf winzigen Gleisen'],
      [/Der Zug fährt im Kreis und im Kreis\./g, 'Der Zug fährt immer wieder im Kreis.'],
      [/einsam, arm, böse, brutal und kurz/g, 'einsam, arm, widerwärtig, brutal und kurz'],
      [/Was wäre laut der Passage nach Hobbes der Zustand des Naturzustands\?/g, 'Wie beschreibt Hobbes laut der Passage den Naturzustand?'],
      [/Rahmenwerke der westlichen politischen Philosophie/g, 'Rahmen der westlichen politischen Philosophie'],
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    save(p, data);
    log.push(`${lang}/${f}: literary tweaks`);
  }

  // speaking/writing register
  {
    for (const f of ['speaking-topics.json', 'writing-topics.json']) {
      const p = path.join(dir, f);
      let data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const pairs = [
        [/Lass uns über/g, 'Lass uns über'],
        [/Was ist dein Lieblingsfach zum Lernen\?/g, 'Was ist dein Lieblingsfach?'],
        [/Magst du Fast Food, zum Beispiel Schawarma oder Tandir-Lavasch\?/g, 'Magst du Fast Food wie Schawarma oder Tandir-Brot?'],
        [/Benutzt du jeden Tag einen Computer\?/g, 'Nutzt du jeden Tag einen Computer?'],
        [/Wofür benutzt du dein Handy am meisten\?/g, 'Wofür nutzt du dein Handy am meisten?'],
        [/Erzähl mir von einer Handyapp/g, 'Erzähl mir von einer App'],
        [/Übst du Deutsch mit deinen Freunden\?/g, 'Übst du Deutsch mit Freunden?'],
      ];
      ({ data } = replaceAllInStrings(data, pairs));
      save(p, data);
      log.push(`${lang}/${f}`);
    }
  }

  // task1 already polished; light extra
  {
    const f = 'task1.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [/Das folgende Balkendiagramm zeigt/g, 'Das folgende Säulendiagramm zeigt'],
      [/Das folgende Kreisdiagramm zeigt/g, 'Das folgende Kreisdiagramm zeigt'],
    ];
    const skip = new Set(['data', 'rows', 'columns', 'series', 'values', 'points', 'cells', 'labels', 'datasets']);
    ({ data } = replaceAllInStrings(data, pairs, skip));
    save(p, data);
    log.push(`${lang}/${f}: diagram wording`);
  }

  // dictation
  {
    for (const name of fs.readdirSync(path.join(dir, 'dictation'))) {
      if (!name.endsWith('.txt')) continue;
      const p = path.join(dir, 'dictation', name);
      let t = fs.readFileSync(p, 'utf8');
      const before = t;
      t = t
        .replace(/Das Eitern des sozialen Vertrauens/g, 'Die Erosion des sozialen Vertrauens')
        .replace(/einer längeren Exposition gegenüber Desinformation/g, 'längerer Desinformation')
        .replace(/Exposition gegenüber/g, 'Belastung durch')
        .replace(/Ich bin ein Student/g, 'Ich bin Student')
        .replace(/Eiscreme/g, 'Eis')
        .replace(/im Pool/g, 'im Schwimmbad')
        .replace(/mittags zu Mittag/g, 'zu Mittag');
      if (t !== before) {
        fs.writeFileSync(p, t, 'utf8');
        log.push(`${lang}/dictation/${name}`);
      }
    }
  }
}

// ── NL ──
{
  const lang = 'nl';
  const dir = path.join(BASE, lang);

  {
    const f = 'level-texts.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const level of Object.keys(data)) {
      for (const item of data[level]) {
        if (typeof item.text === 'string') {
          item.text = item.text
            .replace(/Constante blootstelling aan/g, 'Voortdurend contact met')
            .replace(/van deze blootstelling/g, 'van dit contact')
            .replace(/chronische blootstelling/g, 'langdurige belasting')
            .replace(/body positivity/g, 'lichaamspositiviteit')
            .replace(/face-to-face interactie/g, 'interactie in persoon')
            .replace(/\"likes\"/g, 'likes')
            .replace(/microbeads/g, 'microkorrels');
        }
        if (item.id === 'b79' && Array.isArray(item.vocabulary)) {
          // ensure no wereldtaal leftover in vocab if any
          for (const v of item.vocabulary) {
            if (/wereldtaal|globale taal/i.test(v.word || '')) {
              v.word = 'Europa';
              v.definition = '(Zelfstandig naamwoord) Het continent waar Nederland ligt.';
            }
          }
        }
      }
    }
    // Fix b79 text if still claims world language
    for (const item of data.Beginner || []) {
      if (item.id === 'b79') {
        item.text = item.text.replace(
          /Nederlands is een wereldtaal\./g,
          'Nederlands opent veel deuren in Europa en daarbuiten.'
        );
      }
    }
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    const f = 'task2.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [
        'Nederlands wordt de universele wereldtaal. Dit is een positieve ontwikkeling voor de internationale betrekkingen en handel. In hoeverre bent u het daarmee eens of oneens?',
        'Nederlands wint aan belang in handel, wetenschap en diplomatie binnen Europa. Is dat volgens u een positieve ontwikkeling voor internationale betrekkingen en handel? In hoeverre bent u het eens of oneens?',
      ],
      [
        'Nederlands wordt steeds meer de wereldtaal van reizen en toerisme. Wat zijn de voor- en nadelen van het hebben van één dominante wereldtaal?',
        'Een dominante voertaal in het internationale toerisme maakt reizen eenvoudiger, maar kan lokale talen verdringen. Wat zijn de voor- en nadelen van één dominante wereldtaal?',
      ],
      [
        /Nederlands is de dominante taal geworden van het internationale bedrijfsleven en de wetenschap\. Waarom heeft het Nederlands deze mondiale status bereikt\? Wat zijn de nadelen van het hebben van één wereldtaal\?/g,
        'Vaak domineert één voertaal het internationale bedrijfsleven en de wetenschap. Waarom ontstaat zo’n dominante taal – en wat zijn de nadelen ervan?',
      ],
      [/chronische blootstelling aan lawaai/g, 'langdurige blootstelling aan lawaai'],
      [/Bespreek beide standpunten en geef uw mening\./g, 'Bespreek beide standpunten en geef uw eigen mening.'],
      [/face-to-face onderwijs/g, 'onderwijs in persoon'],
      [/scholen voor hetzelfde geslacht/g, 'jongens- of meisjesscholen'],
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    const f = 'comprehensive-reading.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [/een\s{2,}/g, 'een '],
      [/\u00a0/g, ' '],
      [/akelig, bruut en kort/g, 'akelig, wreed en kort'],
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    // ensure doctor passage still good
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    for (const f of ['speaking-topics.json', 'writing-topics.json']) {
      const p = path.join(dir, f);
      let data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const pairs = [
        [/Vertel eens over je woonplaats/g, 'Vertel over je woonplaats'],
        [/Houd je van fastfood zoals shoarma of tandoor lavash\?/g, 'Houd je van fastfood, zoals shoarma of tandir-brood?'],
        [/Vind je Nederlands moeilijk\?/g, 'Vind je Nederlands moeilijk om te leren?'],
      ];
      ({ data } = replaceAllInStrings(data, pairs));
      save(p, data);
      log.push(`${lang}/${f}`);
    }
  }

  {
    const f = 'task1.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [
        /door de belangrijkste kenmerken te selecteren en te rapporteren, en maak waar relevant vergelijkingen/g,
        'door de belangrijkste kenmerken te selecteren en te beschrijven, en vergelijk waar dat zinvol is',
      ],
      [
        /door de belangrijkste kenmerken te selecteren en te rapporteren, en maak vergelijkingen waar relevant/g,
        'door de belangrijkste kenmerken te selecteren en te beschrijven, en vergelijk waar dat zinvol is',
      ],
      [/Vat de informatie samen/g, 'Vat de informatie samen'],
    ];
    const skip = new Set(['data', 'rows', 'columns', 'series', 'values', 'points', 'cells', 'labels', 'datasets']);
    ({ data } = replaceAllInStrings(data, pairs, skip));
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    for (const name of fs.readdirSync(path.join(dir, 'dictation'))) {
      if (!name.endsWith('.txt')) continue;
      const p = path.join(dir, 'dictation', name);
      let t = fs.readFileSync(p, 'utf8');
      const before = t;
      t = t
        .replace(/Het etteren van sociaal vertrouwen/g, 'De uitholling van sociaal vertrouwen')
        .replace(/langdurige blootstelling aan desinformatie/g, 'langdurige blootstelling aan desinformatie')
        .replace(/^(- )Ik ben een student\./m, '$1Ik ben student.')
        .replace(/Wij eten 's middags lunch\./g, 'Wij lunchen.');
      if (t !== before) {
        fs.writeFileSync(p, t, 'utf8');
        log.push(`${lang}/dictation/${name}`);
      }
    }
  }
}

// ── SV ──
{
  const lang = 'sv';
  const dir = path.join(BASE, lang);

  {
    const f = 'level-texts.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const level of Object.keys(data)) {
      for (const item of data[level]) {
        if (typeof item.text === 'string') {
          item.text = item.text
            .replace(/Konstant exponering för/g, 'Ständig exponering för')
            .replace(/av denna exponering/g, 'av denna exponering')
            .replace(/ansikte-mot-ansikte-interaktion/g, 'interaktion ansikte mot ansikte')
            .replace(/allestädes närvarande/g, 'allestädes närvarande')
            .replace(/\"likes\"/g, 'likes')
            .replace(/mikropärlor/g, 'mikroplastpärlor')
            .replace(/Min fars namn är/g, 'Min pappa heter')
            .replace(/min mors namn är/g, 'min mamma heter')
            .replace(/hans namn är/g, 'han heter')
            .replace(/hennes namn är/g, 'hon heter')
            .replace(/Dess namn är/g, 'Den heter')
            .replace(/Detta är ett foto av min familj\. Detta är mina föräldrar\./g, 'Det här är ett foto av min familj. Det här är mina föräldrar.');
        }
        if (item.id === 'b79') {
          item.title = item.title.replace(/^Studerar svenska varje dag$/, 'Att studera svenska varje dag');
          if (Array.isArray(item.vocabulary)) {
            for (const v of item.vocabulary) {
              if (/globalt/i.test(v.word || '') || /global/i.test(v.word || '')) {
                v.word = 'Europa';
                v.definition = '(Substantiv) Kontinenten där Sverige ligger.';
              }
            }
          }
        }
        // vocab middagstid used for lunch context
        if (Array.isArray(item.vocabulary)) {
          for (const v of item.vocabulary) {
            if (v.word === 'middagstid' && /lunch/i.test(item.text || '')) {
              v.word = 'lunchtid';
              v.definition = '(Substantiv) Tiden då man äter lunch.';
            }
          }
        }
      }
    }
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    const f = 'task2.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [
        /Vissa hävdar att ett enda globalt språk \(som svenska\) för världen samman i fred, medan andra tror att det förstör unika kulturella identiteter\. Diskutera båda åsikterna och ge din åsikt\./g,
        'Vissa hävdar att ett enda globalt språk för världen samman i fred, medan andra menar att det hotar unika kulturella identiteter. Diskutera båda åsikterna och ge din åsikt.',
      ],
      [
        /svenska blir alltmer det globala språket för resor och turism\. Vilka är fördelarna och nackdelarna med att ha ett enda dominerande globalt språk\?/g,
        'Ett dominerande världsspråk inom resor och turism underlättar kommunikation men kan tränga undan lokala språk. Vilka är för- och nackdelarna med ett enda dominerande globalt språk?',
      ],
      [
        /svenska har blivit det dominerande språket för internationellt företagande och vetenskap\. Varför har svenskan uppnått denna globala status\? Vilka är nackdelarna med att ha ett globalt språk\?/g,
        'Ofta dominerar ett enda språk internationellt företagande och vetenskap. Varför uppstår ett sådant dominansspråk – och vilka nackdelar har det?',
      ],
      [/kronisk bullerexponering/g, 'långvarig bullerexponering'],
      [/hur man skiljer rätt från fel/g, 'hur man skiljer rätt från fel'],
      [/Diskutera båda åsikterna och ge din åsikt\./g, 'Diskutera båda synsätten och ge din egen åsikt.'],
      [/det överordnade imperationen/g, 'det överordnade imperativet'],
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    const f = 'comprehensive-reading.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [/det överordnade imperationen/g, 'det överordnade imperativet'],
      [/otäckt, brutalt och kort/g, 'otäckt, brutalt och kort'],
      [/Personalens? var hjälpsam och talade bra svenska/g, 'Personalen var hjälpsam och talade bra engelska'],
      [/Skyltarna är på svenska/g, 'Skyltarna är på engelska'],
      // Malta immersion fantasy: keep svenska as L2 study context is intentional
    ];
    ({ data } = replaceAllInStrings(data, pairs));
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    for (const f of ['speaking-topics.json', 'writing-topics.json']) {
      const p = path.join(dir, f);
      let data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const pairs = [
        [/Vad är ditt fullständiga namn\?/g, 'Vad är ditt fullständiga namn?'],
        [/Gillar du snabbmat som shaurma eller tandir-lavash\?/g, 'Gillar du snabbmat som shawarma eller tandirbröd?'],
        [/Titta på på TV/g, 'titta på TV'],
        [/Gillar du att titta på på TV\?/g, 'Gillar du att titta på TV?'],
        [/Berätta om en sport du gillar att titta på på TV\./g, 'Berätta om en sport du gillar att titta på TV.'],
      ];
      ({ data } = replaceAllInStrings(data, pairs));
      save(p, data);
      log.push(`${lang}/${f}`);
    }
  }

  {
    const f = 'task1.json';
    const p = path.join(dir, f);
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pairs = [
      [
        /genom att välja och rapportera huvuddragen och göra jämförelser där det är relevant/g,
        'genom att välja ut och beskriva huvuddragen och göra jämförelser där det är lämpligt',
      ],
      [
        /genom att välja och rapportera huvuddragen, och gör jämförelser där det är relevant/g,
        'genom att välja ut och beskriva huvuddragen och göra jämförelser där det är lämpligt',
      ],
      [
        /huvudfunktionerna och göra jämförelser där det är relevant/g,
        'huvuddragen och göra jämförelser där det är lämpligt',
      ],
      [
        /huvudfunktionerna, och gör jämförelser där det är relevant/g,
        'huvuddragen och göra jämförelser där det är lämpligt',
      ],
      [
        /aste funktionerna och göra jämförelser där det är relevant/g,
        'aste dragen och göra jämförelser där det är lämpligt',
      ],
      [
        /ovisa huvuddragen och göra jämförelser där det är relevant/g,
        'skriva huvuddragen och göra jämförelser där det är lämpligt',
      ],
    ];
    const skip = new Set(['data', 'rows', 'columns', 'series', 'values', 'points', 'cells', 'labels', 'datasets']);
    ({ data } = replaceAllInStrings(data, pairs, skip));
    save(p, data);
    log.push(`${lang}/${f}`);
  }

  {
    for (const name of fs.readdirSync(path.join(dir, 'dictation'))) {
      if (!name.endsWith('.txt')) continue;
      const p = path.join(dir, 'dictation', name);
      let t = fs.readFileSync(p, 'utf8');
      const before = t;
      t = t
        .replace(/Suppurationen av socialt förtroende/g, 'Urholkningen av socialt förtroende')
        .replace(/långvarig exponering för desinformation/g, 'långvarig exponering för desinformation')
        .replace(/Vi äter lunch vid middagstid\./g, 'Vi äter lunch.')
        .replace(/Vi äter lunch vid lunchtid\./g, 'Vi äter lunch.');
      if (t !== before) {
        fs.writeFileSync(p, t, 'utf8');
        log.push(`${lang}/dictation/${name}`);
      }
    }
  }
}

console.log(log.join('\n'));
console.log('PASS2 DONE');
