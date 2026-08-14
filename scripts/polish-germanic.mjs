/**
 * Literary MT polish for de / nl / sv lang packs.
 * Preserves JSON IDs/structure. Polishes task1 instruction prose only
 * (does not rename chart England/English data labels).
 */
import fs from 'fs';
import path from 'path';

const BASE = 'C:/Users/user/Desktop/Projects/Smarty English/public/data/lang-packs';

const stats = { de: {}, nl: {}, sv: {} };

function countChange(lang, file, n = 1) {
  stats[lang][file] = (stats[lang][file] || 0) + n;
}

function applyPairs(text, pairs) {
  let out = text;
  let n = 0;
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) {
      const before = out;
      out = out.replace(from, to);
      if (out !== before) n++;
    } else if (out.includes(from)) {
      const parts = out.split(from);
      n += parts.length - 1;
      out = parts.join(to);
    }
  }
  return { text: out, n };
}

/** Strip OCR/MT dash garbage at passage starts */
function stripDashArtifact(s) {
  return s
    .replace(/^[\s\-–—_]{5,}(?:ne:)?\s*/u, '')
    .replace(/^[\s\-–—_]{5,}\s*/u, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// ─── German ───────────────────────────────────────────────────────────
const DE_PAIRS = [
  // factual / localization errors
  [/nach dem Deutschen Bürgerkrieg/g, 'nach dem Englischen Bürgerkrieg'],
  [/des Deutschen Bürgerkriegs/g, 'des Englischen Bürgerkriegs'],
  [/im Deutschen Bürgerkrieg/g, 'im Englischen Bürgerkrieg'],
  [/Deutsch ist eine Weltsprache\./g, 'Deutsch öffnet viele Türen in Europa\.'],
  [/"Weltsprache"/g, '"Sprache"'],
  [/Bezieht sich auf die ganze Welt\./g, 'Ein System aus Wörtern, mit dem Menschen sprechen und schreiben\.'],

  // morphology / doubles
  [/studieren dürfen dürfen/g, 'studieren dürfen'],
  [/dürfen sollten/g, 'sollten'],
  [/Was wäre laut Hobbes laut der Passage/g, 'Was wäre laut der Passage nach Hobbes'],
  [/laut Hobbes laut /g, 'laut Hobbes '],

  // calques & register
  [/frühzeitige Exposition/g, 'früher Umgang'],
  [/eine frühzeitige Exposition/g, 'früher Umgang'],
  [/Work-Life-Balance/g, 'Vereinbarkeit von Beruf und Privatleben'],
  [/das ultimative Symbol/g, 'das wichtigste Symbol'],
  [/ein entscheidendes Sprungbrett/g, 'eine entscheidende Einstiegsmöglichkeit'],
  [/manuelle Tätigkeiten/g, 'handwerkliche Berufe'],
  [/professionelle Tätigkeiten wie Ärzte oder Anwälte/g, 'akademische Berufe wie Arzt oder Anwalt'],
  [/sich einen Arbeitsplatz zu erschließen/g, 'Arbeitsplätze für Jüngere freizumachen'],
  [/Curriculum/g, 'Lehrplan'],
  [/Curriculums/g, 'Lehrplans'],
  [/C1\/C2-Profizienz/g, 'C1-/C2-Niveau'],
  [/Profizienz/g, 'Sprachkompetenz'],
  [/Meilenstein, der es Ihnen ermöglicht/g, 'Meilenstein, der Ihnen ermöglicht'],
  [/fortgeschrittenen Curriculums/g, 'fortgeschrittenen Lehrplans'],
  [/dieses fortgeschrittenen Lehrplans/g, 'dieses fortgeschrittenen Lehrplans'],

  // beginner literary
  [/Ich mache ein kleines Frühstück/g, 'Ich bereite ein kleines Frühstück zu'],
  [/Meine Mutter schenkt mir ein Lächeln/g, 'Meine Mutter lächelt mir zu'],
  [/Ich bin ein Student/g, 'Ich bin Student'],
  [/Wir essen mittags zu Mittag/g, 'Wir essen zu Mittag'],
  [/Eiscreme/g, 'Eis'],
  [/im Pool/g, 'im Schwimmbad'],
  [/Lerne meinen besten Freund kennen/g, 'Mein bester Freund'],
  [/Handy-App/g, 'Handyapp'],
  [/Schawarma/g, 'Schawarma'],
  [/Tandir-Lavasch/g, 'Tandir-Lavasch'],

  // CR MT errors
  [/um einen Ausschlag zu erzeugen/g, 'um einen Ausbruch zu erzeugen'],
  [/Schulwissenschaftsmesse/g, 'Wissenschaftsmesse an der Schule'],
  [/an Dummies das Anlegen/g, 'an Übungspuppen das Anlegen'],

  // task1 instruction polish
  [/indem Sie die Hauptmerkmale auswählen und angeben/g, 'indem Sie die wichtigsten Merkmale herausgreifen und beschreiben'],
  [/indem Sie die Hauptmerkmale auswählen und melden/g, 'indem Sie die wichtigsten Merkmale herausgreifen und beschreiben'],
  [/und vergleichen Sie sie gegebenenfalls/g, 'und vergleichen Sie sie, wo es sinnvoll ist'],
  [/Fassen Sie die Informationen zusammen/g, 'Fassen Sie die Informationen zusammen'],
  [/Schreiben Sie mindestens 150 Wörter\./g, 'Schreiben Sie mindestens 150 Wörter.'],

  // speaking/writing register
  [/Student\/in/g, 'Student oder Studentin'],
  [/Freund\/deine beste Freundin/g, 'Freund oder deine beste Freundin'],
  [/Erzähle mir/g, 'Erzähl mir'],
  [/Lass uns über das Deutschlernen sprechen/g, 'Lass uns über das Deutschlernen sprechen'],
];

const DE_CR_FIXES = {
  108: {
    title: 'Die Ärztin',
    passage:
      'Doktor Lee arbeitet in einem Krankenhaus. Sie hilft jeden Tag kranken Menschen. Sie trägt einen weißen Kittel. Mit einem Stethoskop hört sie die Herzen der Patienten ab. Sie ist sehr freundlich und klug.',
  },
  225: {
    passage:
      'Lisa hatte drei Tage lang Zahnschmerzen und ging deshalb zum Zahnarzt. Der Zahnarzt fertigte eine Röntgenaufnahme ihrer Zähne an. Er fand ein kleines Loch in ihrem Backenzahn. Lisa war nervös, weil sie dachte, es würde wehtun. Der Zahnarzt war jedoch behutsam, und die Füllung war schnell erledigt. Er riet Lisa, zweimal täglich zu putzen und regelmäßig Zahnseide zu benutzen. Seit dem Besuch hat Lisa keine Schmerzen mehr.',
  },
  250: {
    passage:
      'Für die Wissenschaftsmesse an der Schule haben mein Partner und ich einen Modellvulkan gebaut. Wir haben Backpulver, Essig und rote Lebensmittelfarbe verwendet, um einen Ausbruch zu erzeugen. Das Experiment funktionierte einwandfrei, und die künstliche Lava floss die Seiten hinunter. Viele Schüler kamen zu unserer Vorführung. Die Jury verlieh uns den zweiten Preis. Wir überlegen schon, was wir nächstes Jahr bauen – am liebsten einen funktionierenden Roboter.',
  },
  273: {
    passage:
      'Letztes Wochenende habe ich einen Erste-Hilfe-Kurs im Gemeindezentrum besucht. Der Ausbilder zeigte uns, wie man Schnitte, Verbrennungen und Brüche versorgt. An Übungspuppen übten wir das Anlegen von Verbänden und die Wiederbelebung. Der Kurs dauerte sechs Stunden mit einer Mittagspause. Am Ende bestand ich die Prüfung und erhielt eine Bescheinigung. Nun fühle ich mich sicherer, in einem Notfall helfen zu können. Jeder sollte die Grundlagen der Ersten Hilfe beherrschen.',
  },
  274: {
    passage:
      'Meine Cousine Lisa ist auf TikTok bekannt geworden. Sie veröffentlicht kurze Videos über ihren Alltag als Krankenschwester und gibt Tipps, wie man gesund bleibt und mit Stress umgeht. Vor sechs Monaten begann sie damit; inzwischen hat sie über fünfzigtausend Follower. Marken haben sie kontaktiert, um Produkte zu bewerben. Lisa sagt, sie mache das zum Spaß und plane nicht, ihren Beruf aufzugeben. Ich finde es schön, dass sie andere inspirieren kann.',
  },
};

// ─── Dutch ────────────────────────────────────────────────────────────
const NL_PAIRS = [
  [/na de Nederlandse burgeroorlog/gi, 'na de Engelse burgeroorlog'],
  [/de Nederlandse burgeroorlog/gi, 'de Engelse burgeroorlog'],
  [/Nederlands is een wereldtaal\./g, 'Nederlands opent veel deuren in Europa en daarbuiten.'],
  [/Nederlands is een globale taal\./g, 'Nederlands opent veel deuren in Europa en daarbuiten.'],

  [/vroege blootstelling/g, 'vroeg contact'],
  [/dat vroege blootstelling/g, 'dat vroeg contact'],
  [/Work-Life-Balance/g, 'balans tussen werk en privé'],
  [/face-to-face onderwijs/g, 'onderwijs in persoon'],
  [/curriculum/g, 'leerplan'],
  [/geavanceerde curriculum/g, 'gevorderde leerplan'],
  [/dit geavanceerde leerplan/g, 'dit gevorderde leerplan'],
  [/C1\/C2-beheersing/g, 'C1-/C2-niveau'],

  [/Ik maak een klein ontbijt/g, 'Ik bereid een klein ontbijt'],
  [/geeft me een glimlach/g, 'lacht naar me'],
  [/Mijn moeder geeft me een glimlach/g, 'Mijn moeder lacht naar me'],
  [/op fopspenen/g, 'op oefenpoppen'],
  [/Ga je graag kleding winkelen/g, 'Ga je graag kleding kopen'],
  [/Wat is je favoriete vak om te studeren/g, 'Wat is je favoriete schoolvak'],
  [/Vertel me over/g, 'Vertel eens over'],
  [/Laten we het hebben over Nederlands leren/g, 'Laten we het over Nederlands leren hebben'],

  [/Vat de informatie samen door de belangrijkste kenmerken te selecteren en te vermelden/g, 'Vat de informatie samen door de belangrijkste kenmerken te selecteren en te beschrijven'],
  [/en vergelijk ze waar relevant/g, 'en vergelijk ze waar dat zinvol is'],
  [/Schrijf minimaal 150 woorden\./g, 'Schrijf minimaal 150 woorden.'],

  [/\u00a0/g, ' '],
];

const NL_CR_FIXES = {
  108: {
    title: 'De dokter',
    passage:
      'Dokter Lee werkt in een ziekenhuis. Elke dag helpt ze zieke mensen. Ze draagt een witte jas. Met een stethoscoop luistert ze naar de harten van patiënten. Ze is erg vriendelijk en slim.',
  },
  225: {
    passage:
      'Lisa had al drie dagen kiespijn, dus ging ze naar de tandarts. De tandarts maakte een röntgenfoto van haar gebit. Hij vond een klein gaatje in een kies achterin. Lisa was zenuwachtig, omdat ze dacht dat het pijn zou doen. De tandarts werkte echter voorzichtig en de vulling was snel gezet. Hij raadde Lisa aan om twee keer per dag te poetsen en regelmatig te flossen. Sinds dat bezoek heeft Lisa geen pijn meer gehad.',
  },
  250: {
    passage:
      'Voor de wetenschapsbeurs op school bouwden mijn partner en ik een modelvulkaan. We gebruikten baking soda, azijn en rode kleurstof om een uitbarsting te veroorzaken. Het experiment lukte perfect: de neplava stroomde langs de zijkanten omlaag. Veel leerlingen kwamen naar onze demonstratie kijken. De jury gaf ons de tweede prijs. We denken al na over volgend jaar — het liefst bouwen we een werkende robot.',
  },
  273: {
    passage:
      'Afgelopen weekend volgde ik een EHBO-cursus in het buurthuis. De instructeur leerde ons snijwonden, brandwonden en botbreuken te behandelen. Op oefenpoppen oefenden we verbanden aanleggen en reanimeren. De cursus duurde zes uur, met een lunchpauze ertussen. Aan het eind slaagde ik voor het examen en kreeg ik een certificaat. Nu voel ik me zekerder om iemand in nood te helpen. Iedereen zou de basis van EHBO moeten kennen.',
  },
  274: {
    passage:
      'Mijn nicht Lisa is populair geworden op TikTok. Ze plaatst korte video’s over haar dagelijkse leven als verpleegkundige en deelt tips om gezond te blijven en stress te beheersen. Zes maanden geleden begon ze; inmiddels heeft ze meer dan vijftigduizend volgers. Merken hebben haar gevraagd hun producten te promoten. Lisa zegt dat ze het voor de lol doet en niet van plan is haar baan op te geven. Ik vind het mooi dat ze anderen kan inspireren.',
  },
};

// ─── Swedish ──────────────────────────────────────────────────────────
const SV_PAIRS = [
  [/det svenska inbördeskriget/gi, 'det engelska inbördeskriget'],
  [/efter det svenska inbördeskriget/gi, 'efter det engelska inbördeskriget'],
  [/svenska är ett globalt språk\./gi, 'Svenska öppnar många dörrar i Norden och Europa.'],
  [/svenska är ett globalt språk/gi, 'svenska öppnar många dörrar'],

  [/tidig exponering/g, 'tidig användning'],
  [/att tidig exponering/g, 'att tidig användning'],
  [/Work-Life-Balance/g, 'balans mellan arbete och fritid'],
  [/modersmålsliknande flyt/g, 'nästan infödd behärskning'],
  [/modersmålsliknande/g, 'nästan som en modersmålstalare'],
  [/denna avancerade kursplan/g, 'den här avancerade kursen'],
  [/denna kursplan/g, 'den här kursen'],
  [/avancerade kursplan/g, 'avancerade kursen'],
  [/C1\/C2-färdighet/g, 'C1-/C2-nivå'],

  [/Jag gör en liten frukost/g, 'Jag lagar en enkel frukost'],
  [/Min mamma ger mig ett leende/g, 'Min mamma ler mot mig'],
  [/Vi äter lunch vid middagstid/g, 'Vi äter lunch'],
  [/vid middagstid var vi i matsalen för lunch/gi, 'vid lunchtid var vi i matsalen'],
  [/Vid middagstid/g, 'Vid lunchtid'],
  [/vid middagstid/g, 'vid lunchtid'],
  [/Vad heter du i efternamn\?/g, 'Vad är ditt fullständiga namn?'],
  [/karamellfärg/g, 'hushållsfärg'],
  [/hur man dömer rätt från fel/g, 'hur man skiljer rätt från fel'],
  [/enkönade skolor/g, 'könssegregerade skolor'],

  [/Sammanfatta informationen genom att välja ut och redovisa de viktigaste egenskaperna/g, 'Sammanfatta informationen genom att välja ut och beskriva de viktigaste dragen'],
  [/och jämför dem där det är relevant/g, 'och jämför dem där det är lämpligt'],
  [/Skriv minst 150 ord\./g, 'Skriv minst 150 ord.'],
];

function polishString(lang, s, ctx = '') {
  if (typeof s !== 'string' || !s) return s;
  let out = s;
  if (ctx === 'chart-data') return out;

  if (lang === 'de') ({ text: out } = applyPairs(out, DE_PAIRS));
  else if (lang === 'nl') ({ text: out } = applyPairs(out, NL_PAIRS));
  else if (lang === 'sv') ({ text: out } = applyPairs(out, SV_PAIRS));

  // selective accidental doubles (not articles like "die die" in relative clauses)
  out = out.replace(
    /\b(dürfen|mogen|studieren|spielen|lernen|Exposition|exponering)\s+\1\b/gi,
    '$1'
  );

  return out;
}

function walkPolish(lang, node, file, opts = {}) {
  if (node == null) return node;
  if (typeof node === 'string') {
    const next = polishString(lang, node, opts.ctx);
    if (next !== node) countChange(lang, file);
    return next;
  }
  if (Array.isArray(node)) {
    return node.map((x) => walkPolish(lang, x, file, opts));
  }
  if (typeof node === 'object') {
    const out = Array.isArray(node) ? [] : { ...node };
    for (const [k, v] of Object.entries(node)) {
      // Skip chart/table raw data fields in task1
      if (
        opts.task1 &&
        [
          'data',
          'rows',
          'columns',
          'series',
          'values',
          'points',
          'cells',
          'labels',
          'datasets',
          'xLabels',
          'yLabels',
          'tableData',
          'chartData',
          'raw',
        ].includes(k)
      ) {
        out[k] = v;
        continue;
      }
      // Keep chart title strings that are explicitly English survey topics as-is
      if (
        opts.task1 &&
        (k === 'name' || k === 'label' || k === 'title') &&
        typeof v === 'string' &&
        /\bEnglish\b|\bEngland\b|Studying English|English \(%\)/.test(v)
      ) {
        out[k] = v;
        continue;
      }
      out[k] = walkPolish(lang, v, file, opts);
    }
    return out;
  }
  return node;
}

function polishLevelTexts(lang, data, file) {
  const levels = Object.keys(data);
  for (const level of levels) {
    for (const item of data[level]) {
      if (item.title) {
        const t = polishString(lang, item.title);
        if (t !== item.title) {
          item.title = t;
          countChange(lang, file);
        }
      }
      if (item.text) {
        const t = polishString(lang, item.text);
        if (t !== item.text) {
          item.text = t;
          countChange(lang, file);
        }
      }
      if (Array.isArray(item.vocabulary)) {
        for (const v of item.vocabulary) {
          if (v.word) {
            const w = polishString(lang, v.word);
            if (w !== v.word) {
              v.word = w;
              countChange(lang, file);
            }
          }
          if (v.definition) {
            const d = polishString(lang, v.definition);
            if (d !== v.definition) {
              v.definition = d;
              countChange(lang, file);
            }
          }
        }
      }
    }
  }

  // Targeted literary rewrites for known weak beginner openers
  const b = data.Beginner;
  if (lang === 'de' && b?.[0]) {
    b[0].text =
      'Jeden Morgen wache ich früh auf. Ich öffne die Augen und strecke die Arme. Zuerst wasche ich mir das Gesicht mit kaltem Wasser. Dann putze ich mir die Zähne. Ich bereite ein kleines Frühstück mit Brot und Tee zu. Vor der Schule lese ich gern ein Buch. Meine Mutter lächelt mir zu. Ich fühle mich glücklich und bereit für den Tag.';
    countChange(lang, file);
  }
  if (lang === 'nl' && b?.[0]) {
    b[0].title = 'Mijn ochtend';
    b[0].text =
      'Elke ochtend word ik vroeg wakker. Ik open mijn ogen en strek mijn armen. Eerst was ik mijn gezicht met koud water. Daarna poets ik mijn tanden. Ik bereid een klein ontbijt met brood en thee. Voor school lees ik graag een boek. Mijn moeder lacht naar me. Ik voel me blij en klaar voor de dag.';
    countChange(lang, file);
  }
  if (lang === 'sv' && b?.[0]) {
    b[0].text =
      'Varje morgon vaknar jag tidigt. Jag öppnar ögonen och sträcker på armarna. Först tvättar jag ansiktet med kallt vatten. Sedan borstar jag tänderna. Jag lagar en enkel frukost med bröd och te. Före skolan läser jag gärna en bok. Min mamma ler mot mig. Jag känner mig glad och redo för dagen.';
    countChange(lang, file);
  }

  // Advanced closing lesson polish
  if (data.Advanced?.[0]) {
    if (lang === 'de') {
      data.Advanced[0].title = 'Das Paradox des digitalen Fortschritts';
      data.Advanced[0].text = polishString(
        'de',
        data.Advanced[0].text
          .replace(/unaufhörliche Streben/g, 'unermüdliche Streben')
          .replace(/vordergründig darauf abzielt/g, 'zunächst darauf abzielt')
      );
      countChange(lang, file);
    }
  }

  return data;
}

function polishCR(lang, data, file) {
  const fixes = lang === 'de' ? DE_CR_FIXES : lang === 'nl' ? NL_CR_FIXES : null;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    if (fixes?.[i]) {
      if (fixes[i].title) p.title = fixes[i].title;
      if (fixes[i].passage) p.passage = fixes[i].passage;
      countChange(lang, file);
    } else if (typeof p.passage === 'string') {
      let passage = stripDashArtifact(p.passage);
      // Fix truncated "ne:" leftovers from "Lee werkt" / "Lee funktioniert"
      if (/^ne[:：]/.test(passage) || passage.startsWith('ne:')) {
        if (lang === 'de') {
          passage = 'Doktor Lee arbeitet in einem Krankenhaus. ' + passage.replace(/^ne[:：]\s*/i, '').replace(/^funktioniert\.\s*/i, '');
        } else if (lang === 'nl') {
          passage = 'Dokter Lee werkt in een ziekenhuis. ' + passage.replace(/^ne[:：]\s*/i, '').replace(/^werkt\.\s*/i, '');
        }
      }
      passage = polishString(lang, passage);
      if (passage !== p.passage) {
        p.passage = passage;
        countChange(lang, file);
      }
    }
    if (p.title) {
      const t = polishString(lang, p.title);
      if (t !== p.title) {
        p.title = t;
        countChange(lang, file);
      }
    }
    // questions
    if (Array.isArray(p.questions)) {
      for (const q of p.questions) {
        for (const key of ['text', 'question', 'explanation']) {
          if (typeof q[key] === 'string') {
            const n = polishString(lang, q[key]);
            if (n !== q[key]) {
              q[key] = n;
              countChange(lang, file);
            }
          }
        }
        if (Array.isArray(q.options)) {
          q.options = q.options.map((o) => {
            const n = polishString(lang, o);
            if (n !== o) countChange(lang, file);
            return n;
          });
        }
      }
    }
  }
  return data;
}

function polishPromptList(lang, data, file) {
  // speaking/writing: { level: string[] }
  for (const level of Object.keys(data)) {
    if (!Array.isArray(data[level])) continue;
    data[level] = data[level].map((s) => {
      if (typeof s !== 'string') return s;
      let n = polishString(lang, s);
      // Extra literary prompt polish
      if (lang === 'de') {
        n = n
          .replace(/^Lass uns /g, 'Lass uns ')
          .replace(/Magst du Fast Food wie/g, 'Magst du Fast Food, zum Beispiel')
          .replace(/Ist Deutsch für dich schwer zu lernen\?/g, 'Fällt dir Deutsch schwer?')
          .replace(/Beschreibe dein Deutsch-Klassenzimmer\./g, 'Beschreibe deinen Deutschunterricht.')
          .replace(/Erzähle mir von deinem Deutschlehrer\./g, 'Erzähl mir von deiner Deutschlehrerin oder deinem Deutschlehrer.');
      }
      if (lang === 'nl') {
        n = n
          .replace(/Is Nederlands moeilijk voor je om te leren\?/g, 'Vind je Nederlands moeilijk?')
          .replace(/Beschrijf je Nederlandse klaslokaal\./g, 'Beschrijf je Nederlandse les.')
          .replace(/Vertel eens over je Nederlandse leraar\./g, 'Vertel eens over je Nederlandse docent.');
      }
      if (lang === 'sv') {
        n = n
          .replace(/Är svenska svårt för dig att lära dig\?/g, 'Tycker du att svenska är svårt?')
          .replace(/Beskriv ditt klassrum för svenska\./g, 'Beskriv din svenskalektion.')
          .replace(/Berätta om din svensklärare\./g, 'Berätta om din svensklärare.');
      }
      if (n !== s) countChange(lang, file);
      return n;
    });
  }
  return data;
}

function polishTask2(lang, data, file) {
  return walkPolish(lang, data, file);
}

function polishTask1(lang, data, file) {
  return walkPolish(lang, data, file, { task1: true });
}

function polishDictation(lang, text, file) {
  let lines = text.split(/\r?\n/);
  lines = lines.map((line) => {
    if (!line.startsWith('- ')) return polishString(lang, line);
    let body = line.slice(2);
    body = polishString(lang, body);
    if (lang === 'de') {
      body = body
        .replace(/^Ich bin ein Student\.$/, 'Ich bin Student.')
        .replace(/^Wir essen mittags zu Mittag\.$/, 'Wir essen zu Mittag.')
        .replace(/Eiscreme/g, 'Eis')
        .replace(/im Pool/g, 'im Schwimmbad')
        .replace(/^Sie schwimmen im Schwimmbad\.$/, 'Sie schwimmen im Schwimmbad.');
    }
    if (lang === 'nl') {
      body = body
        .replace(/^Wij eten 's middags lunch\.$/, 'Wij lunchen.')
        .replace(/^Ik ben een student\.$/, 'Ik ben student.');
    }
    if (lang === 'sv') {
      body = body
        .replace(/^Vi äter lunch vid middagstid\.$/, 'Vi äter lunch.')
        .replace(/^Vi äter lunch vid lunchtid\.$/, 'Vi äter lunch.')
        .replace(/^Jag är student\.$/, 'Jag är student.');
    }
    const next = '- ' + body;
    if (next !== line) countChange(lang, file);
    return next;
  });
  return lines.join('\n').replace(/\n+$/, '\n');
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function processLang(lang) {
  const dir = path.join(BASE, lang);
  console.log('\n===', lang, '===');

  // level-texts
  {
    const f = 'level-texts.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    polishLevelTexts(lang, data, f);
    writeJson(p, data);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // comprehensive-reading
  {
    const f = 'comprehensive-reading.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    polishCR(lang, data, f);
    writeJson(p, data);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // speaking
  {
    const f = 'speaking-topics.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    polishPromptList(lang, data, f);
    writeJson(p, data);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // writing
  {
    const f = 'writing-topics.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    polishPromptList(lang, data, f);
    writeJson(p, data);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // task2
  {
    const f = 'task2.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const next = polishTask2(lang, data, f);
    writeJson(p, next);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // task1 instructions only
  {
    const f = 'task1.json';
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const next = polishTask1(lang, data, f);
    writeJson(p, next);
    console.log(f, 'edits~', stats[lang][f] || 0);
  }

  // dictation
  const dictDir = path.join(dir, 'dictation');
  for (const name of fs.readdirSync(dictDir)) {
    if (!name.endsWith('.txt')) continue;
    const p = path.join(dictDir, name);
    const raw = fs.readFileSync(p, 'utf8');
    const next = polishDictation(lang, raw, `dictation/${name}`);
    fs.writeFileSync(p, next, 'utf8');
    console.log('dictation/' + name, 'edits~', stats[lang][`dictation/${name}`] || 0);
  }
}

for (const lang of ['de', 'nl', 'sv']) processLang(lang);
console.log('\nDONE', JSON.stringify(stats, null, 2));
