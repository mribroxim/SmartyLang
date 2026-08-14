/**
 * Romance polish pass 2: task2 register, vocab lemmas, leftover calques.
 * node scripts/polish-romance-pass2.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

function writeJson(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function polishTask2() {
  // ES — tú register
  {
    const fp = path.join(PACKS, 'es', 'task2.json');
    let s = fs.readFileSync(fp, 'utf8');
    s = s
      .replaceAll('Discuta las ventajas y desventajas y da tu propia opinión cuando se le solicite. Escribe al menos 250 palabras.',
        'Discute las ventajas y las desventajas y da tu propia opinión cuando se te pida. Escribe al menos 250 palabras.')
      .replaceAll('Explique las causas/impactos de este problema y sugiera soluciones. Escribe al menos 250 palabras.',
        'Explica las causas o el impacto de este problema y sugiere soluciones. Escribe al menos 250 palabras.')
      .replaceAll('Responda ambas preguntas completamente. Escribe al menos 250 palabras.',
        'Responde ambas preguntas por completo. Escribe al menos 250 palabras.')
      .replace(/\bDiscuta\b/g, 'Discute')
      .replace(/\bExplique\b/g, 'Explica')
      .replace(/\bSugiera\b/g, 'Sugiere')
      .replace(/\bResponda\b/g, 'Responde')
      .replace(/\bdé su\b/g, 'da tu')
      .replace(/\bDé su\b/g, 'Da tu')
      .replace(/cuando se le /g, 'cuando se te ');
    fs.writeFileSync(fp, s, 'utf8');
    JSON.parse(s); // validate
    console.log('es task2 ok');
  }
  // PT
  {
    const fp = path.join(PACKS, 'pt', 'task2.json');
    let s = fs.readFileSync(fp, 'utf8');
    s = s
      .replaceAll('Discuta ambos os pontos de vista e dê sua própria opinião',
        'Discuta os dois pontos de vista e dê a sua opinião')
      .replaceAll('Discuta as vantagens e desvantagens',
        'Discuta as vantagens e as desvantagens');
    fs.writeFileSync(fp, s, 'utf8');
    JSON.parse(s);
    console.log('pt task2 ok');
  }
  // FR
  {
    const fp = path.join(PACKS, 'fr', 'task2.json');
    let s = fs.readFileSync(fp, 'utf8');
    s = s.replaceAll(
      'Discutez des deux points de vue et donnez votre propre opinion',
      'Discutez les deux points de vue et donnez votre opinion'
    );
    fs.writeFileSync(fp, s, 'utf8');
    JSON.parse(s);
    console.log('fr task2 ok');
  }
  // IT
  {
    const fp = path.join(PACKS, 'it', 'task2.json');
    let s = fs.readFileSync(fp, 'utf8');
    s = s.replaceAll(
      'Discuti entrambi i punti di vista e dai la tua opinione',
      'Discuti entrambi i punti di vista ed esprimi la tua opinione'
    );
    fs.writeFileSync(fp, s, 'utf8');
    JSON.parse(s);
    console.log('it task2 ok');
  }
  // RO
  {
    const fp = path.join(PACKS, 'ro', 'task2.json');
    let s = fs.readFileSync(fp, 'utf8');
    s = s
      .replaceAll(
        'Discutați ambele puncte de vedere și spuneți-vă propria părere',
        'Discută ambele puncte de vedere și exprimă-ți propria părere'
      )
      .replaceAll('Educaţie', 'Educație');
    fs.writeFileSync(fp, s, 'utf8');
    JSON.parse(s);
    console.log('ro task2 ok');
  }
}

function polishVocabLemmas() {
  // Italian Beginner conjugated → citation forms (common ones)
  const itMap = {
    Sveglio: 'Svegliarsi',
    Allungo: 'Allungare',
    Lavo: 'Lavarsi',
    Apro: 'Aprire',
    Leggo: 'Leggere',
    Scrivo: 'Scrivere',
    Parlo: 'Parlare',
    Mangio: 'Mangiare',
    Bevo: 'Bere',
    Vado: 'Andare',
    Vengo: 'Venire',
    Faccio: 'Fare',
    Dico: 'Dire',
    Capisco: 'Capire',
    Studio: 'Studiare',
    Imparo: 'Imparare',
    Gioco: 'Giocare',
    Lavoro: 'Lavorare',
    Dormo: 'Dormire',
    Corro: 'Correre',
  };
  const itFp = path.join(PACKS, 'it', 'level-texts.json');
  const it = JSON.parse(fs.readFileSync(itFp, 'utf8'));
  let n = 0;
  for (const level of Object.keys(it)) {
    for (const p of it[level]) {
      for (const v of p.vocabulary || []) {
        if (itMap[v.word]) {
          v.word = itMap[v.word];
          n++;
        }
      }
    }
  }
  writeJson(itFp, it);
  console.log('it lemmas', n);

  // French
  const frMap = {
    Étire: "S'étirer",
    Ouvre: 'Ouvrir',
    Prépare: 'Préparer',
    Brosse: 'Se brosser',
  };
  const frFp = path.join(PACKS, 'fr', 'level-texts.json');
  const fr = JSON.parse(fs.readFileSync(frFp, 'utf8'));
  let fn = 0;
  for (const level of Object.keys(fr)) {
    for (const p of fr[level]) {
      for (const v of p.vocabulary || []) {
        if (frMap[v.word]) {
          v.word = frMap[v.word];
          fn++;
        }
      }
    }
  }
  writeJson(frFp, fr);
  console.log('fr lemmas', fn);

  // Spanish — common conjugated headwords
  const esMap = {
    Despierto: 'Despertarse',
    Estiro: 'Estirar',
    Abro: 'Abrir',
    Lavo: 'Lavarse',
    Cepillo: 'Cepillarse',
    Preparo: 'Preparar',
  };
  const esFp = path.join(PACKS, 'es', 'level-texts.json');
  const es = JSON.parse(fs.readFileSync(esFp, 'utf8'));
  let en = 0;
  for (const level of Object.keys(es)) {
    for (const p of es[level]) {
      for (const v of p.vocabulary || []) {
        if (esMap[v.word]) {
          v.word = esMap[v.word];
          en++;
        }
      }
    }
  }
  writeJson(esFp, es);
  console.log('es lemmas', en);

  // Portuguese
  const ptMap = {
    Acordo: 'Acordar',
    Estico: 'Esticar',
    Abro: 'Abrir',
    Lavo: 'Lavar',
    Escovo: 'Escovar',
  };
  const ptFp = path.join(PACKS, 'pt', 'level-texts.json');
  const pt = JSON.parse(fs.readFileSync(ptFp, 'utf8'));
  let pn = 0;
  for (const level of Object.keys(pt)) {
    for (const p of pt[level]) {
      for (const v of p.vocabulary || []) {
        if (ptMap[v.word]) {
          v.word = ptMap[v.word];
          pn++;
        }
      }
    }
  }
  writeJson(ptFp, pt);
  console.log('pt lemmas', pn);

  // Romanian
  const roMap = {
    Întind: 'A întinde',
    Deschid: 'A deschide',
  };
  const roFp = path.join(PACKS, 'ro', 'level-texts.json');
  const ro = JSON.parse(fs.readFileSync(roFp, 'utf8'));
  let rn = 0;
  for (const level of Object.keys(ro)) {
    for (const p of ro[level]) {
      for (const v of p.vocabulary || []) {
        if (roMap[v.word]) {
          v.word = roMap[v.word];
          rn++;
        }
        // normalize "Mă trezesc" style already OK as phrase
      }
    }
  }
  writeJson(roFp, ro);
  console.log('ro lemmas', rn);
}

function polishLevelTextBodies() {
  // High-value body rewrites for b1 morning routine — literary native
  const bodies = {
    es: {
      b1: {
        title: 'Mi mañana',
        text: 'Cada mañana me despierto temprano. Abro los ojos y estiro los brazos. Primero me lavo la cara con agua fría. Luego me cepillo los dientes. Preparo un desayuno ligero con pan y té. Me gusta leer un libro antes de ir a la escuela. Mi madre me sonríe. Me siento feliz y listo para el día.',
      },
      b79: {
        text: 'Estudio español todos los días. Leo libros en español y escucho canciones en español. En clase hablo con mi maestra. Aprendo palabras nuevas cada mañana. El español es un idioma global. Es muy útil para mi futuro. ¡Aprender un idioma es divertido!',
      },
    },
    pt: {
      b1: {
        title: 'Minha manhã',
        text: 'Toda manhã acordo cedo. Abro os olhos e estico os braços. Primeiro, lavo o rosto com água fria. Depois escovo os dentes. Faço um pequeno café da manhã com pão e chá. Gosto de ler um livro antes da escola. Minha mãe me dá um sorriso. Sinto-me feliz e pronto para o dia.',
      },
    },
    fr: {
      b1: {
        title: 'Mon matin',
        text: "Chaque matin, je me réveille tôt. J'ouvre les yeux et j'étire les bras. D'abord, je me lave le visage à l'eau froide. Ensuite, je me brosse les dents. Je prépare un petit déjeuner avec du pain et du thé. J'aime lire un livre avant l'école. Ma mère me sourit. Je me sens heureux et prêt pour la journée.",
      },
      b79: {
        text: "J'étudie le français tous les jours. Je lis des livres en français et j'écoute des chansons en français. En classe, je parle avec ma professeure. J'apprends de nouveaux mots chaque matin. Le français est une langue mondiale. C'est très utile pour mon avenir. Apprendre une langue, c'est amusant !",
      },
    },
    it: {
      b1: {
        title: 'La mia mattina',
        text: "Ogni mattina mi sveglio presto. Apro gli occhi e allungo le braccia. Per prima cosa mi lavo il viso con acqua fredda. Poi mi lavo i denti. Faccio una piccola colazione con pane e tè. Mi piace leggere un libro prima di andare a scuola. Mia madre mi sorride. Mi sento felice e pronto per la giornata.",
      },
      b79: {
        text: "Studio italiano ogni giorno. Leggo libri in italiano e ascolto canzoni in italiano. In classe parlo con la mia insegnante. Imparo parole nuove ogni mattina. L'italiano è una lingua globale. È molto utile per il mio futuro. Imparare una lingua è divertente!",
      },
    },
    ro: {
      b1: {
        title: 'Dimineața mea',
        text: 'În fiecare dimineață mă trezesc devreme. Îmi deschid ochii și îmi întind brațele. Mai întâi îmi spăl fața cu apă rece. Apoi îmi periez dinții. Fac un mic dejun cu pâine și ceai. Îmi place să citesc o carte înainte de școală. Mama îmi zâmbește. Mă simt fericit și pregătit pentru zi.',
      },
    },
  };

  for (const [lang, byId] of Object.entries(bodies)) {
    const fp = path.join(PACKS, lang, 'level-texts.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let n = 0;
    for (const level of Object.keys(data)) {
      for (const p of data[level]) {
        if (byId[p.id]) {
          Object.assign(p, byId[p.id]);
          n++;
        }
      }
    }
    writeJson(fp, data);
    console.log(lang, 'body rewrites', n);
  }
}

function polishSpeakingCalques() {
  const esFp = path.join(PACKS, 'es', 'speaking-topics.json');
  let es = fs.readFileSync(esFp, 'utf8');
  es = es
    .replaceAll('¿Dónde está ubicada?', '¿Dónde queda?')
    .replaceAll('Háblame de', 'Cuéntame sobre')
    .replaceAll('coger el autobús', 'tomar el autobús'); // LatAm-friendlier; Spain uses coger — use tomar for broader
  // Actually "Cuéntame sobre" is a mild calque; native is "Cuéntame de" or "Háblame de". Revert Háblame.
  es = es.replaceAll('Cuéntame sobre', 'Háblame de');
  fs.writeFileSync(esFp, es, 'utf8');
  JSON.parse(es);
  console.log('es speaking ok');

  const ptFp = path.join(PACKS, 'pt', 'speaking-topics.json');
  let pt = fs.readFileSync(ptFp, 'utf8');
  pt = pt.replaceAll('Onde ela fica?', 'Onde fica?');
  fs.writeFileSync(ptFp, pt, 'utf8');
  JSON.parse(pt);
  console.log('pt speaking ok');

  const itFp = path.join(PACKS, 'it', 'speaking-topics.json');
  let it = fs.readFileSync(itFp, 'utf8');
  it = it.replaceAll("Dov'è situata?", "Dove si trova?");
  fs.writeFileSync(itFp, it, 'utf8');
  JSON.parse(it);
  console.log('it speaking ok');
}

polishTask2();
polishVocabLemmas();
polishLevelTextBodies();
polishSpeakingCalques();
console.log('pass2 done');
