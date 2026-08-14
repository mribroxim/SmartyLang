/**
 * Romance polish pass 3: task1 instruction boilerplate, register, writing calques, titles.
 * node scripts/polish-romance-pass3.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');

function writeJson(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** Normalize trailing Task-1 boilerplate (IELTS Academic style). */
const TASK1_BOILER = {
  es: {
    // unify to tú + natural phrasing
    patterns: [
      [
        /Resume la información seleccionando e informando las características principales, y haga comparaciones cuando sea relevante\. Escribe al menos 150 palabras\./g,
        'Resume la información seleccionando y describiendo las características principales, y haz comparaciones cuando sea pertinente. Escribe al menos 150 palabras.',
      ],
      [
        /Resume la información seleccionando y reportando las características principales, y haga comparaciones cuando sea relevante\. Escribe al menos 150 palabras\./g,
        'Resume la información seleccionando y describiendo las características principales, y haz comparaciones cuando sea pertinente. Escribe al menos 150 palabras.',
      ],
      [
        /Resume la información seleccionando e informando las características principales, y haz comparaciones cuando sea relevante\. Escribe al menos 150 palabras\./g,
        'Resume la información seleccionando y describiendo las características principales, y haz comparaciones cuando sea pertinente. Escribe al menos 150 palabras.',
      ],
      [
        /Resuma la información seleccionando e informando las características principales, y haga comparaciones cuando sea relevante\. Escribe al menos 150 palabras\./g,
        'Resume la información seleccionando y describiendo las características principales, y haz comparaciones cuando sea pertinente. Escribe al menos 150 palabras.',
      ],
      [
        /Resuma la información seleccionando y reportando las características principales, y haga comparaciones cuando sea relevante\. Escribe al menos 150 palabras\./g,
        'Resume la información seleccionando y describiendo las características principales, y haz comparaciones cuando sea pertinente. Escribe al menos 150 palabras.',
      ],
      [/haga comparaciones cuando sea relevante/g, 'haz comparaciones cuando sea pertinente'],
      [/seleccionando e informando/g, 'seleccionando y describiendo'],
      [/seleccionando y reportando/g, 'seleccionando y describiendo'],
      [/seleccionando e informando/g, 'seleccionando y describiendo'],
      [/\bResuma\b/g, 'Resume'],
    ],
  },
  pt: {
    patterns: [
      [
        /Resuma a[s]? informações? selecionando e (reportando|relatando) as (principais )?características(,)? e (faça|faz) comparações (quando|onde) (relevante|for relevante)\. Escreva pelo menos 150 palavras\./gi,
        'Resuma as informações selecionando e descrevendo as características principais, e faça comparações quando for pertinente. Escreva pelo menos 150 palavras.',
      ],
      [/selecionando e reportando/gi, 'selecionando e descrevendo'],
      [/selecionando e relatando/gi, 'selecionando e descrevendo'],
      [/quando for relevante/gi, 'quando for pertinente'],
      [/quando relevante/gi, 'quando for pertinente'],
    ],
  },
  fr: {
    patterns: [
      [
        /Résumez les informations en sélectionnant et en (rapportant|signalant) les (principales )?caractéristiques, et effectuez des comparaisons le cas échéant\. Écrivez au moins 150 mots\./gi,
        'Résumez les informations en sélectionnant et en décrivant les caractéristiques principales, et faites des comparaisons le cas échéant. Écrivez au moins 150 mots.',
      ],
      [/en sélectionnant et en rapportant/gi, 'en sélectionnant et en décrivant'],
      [/en sélectionnant et en signalant/gi, 'en sélectionnant et en décrivant'],
    ],
  },
  it: {
    patterns: [
      [
        /Riassumere le informazioni selezionando e segnalando le (principali )?caratteristiche, ed effettua(re)? confronti ove rilevante\. Scrivi almeno 150 parole\./gi,
        'Riassumi le informazioni selezionando e descrivendo le caratteristiche principali, e fai confronti dove è pertinente. Scrivi almeno 150 parole.',
      ],
      [
        /Riassumi le informazioni selezionando e (segnalando|riportando) le (principali )?caratteristiche, ed effettua(re)? confronti ove rilevante\. Scrivi almeno 150 parole\./gi,
        'Riassumi le informazioni selezionando e descrivendo le caratteristiche principali, e fai confronti dove è pertinente. Scrivi almeno 150 parole.',
      ],
      [/\bRiassumere\b/g, 'Riassumi'],
      [/selezionando e segnalando/gi, 'selezionando e descrivendo'],
      [/selezionando e riportando/gi, 'selezionando e descrivendo'],
      [/ove rilevante/gi, 'dove è pertinente'],
    ],
  },
  ro: {
    patterns: [
      [
        /Rezumați informațiile selectând și raportând (principalele )?caracteristici(,)? și (faceți|fă) comparații (acolo )?unde (este )?relevant\. Scrie[țt]i cel puțin 150 de cuvinte\./gi,
        'Rezumă informațiile selectând și descriind caracteristicile principale, și fă comparații acolo unde este cazul. Scrie cel puțin 150 de cuvinte.',
      ],
      [/Rezumați/g, 'Rezumă'],
      [/selectând și raportând/gi, 'selectând și descriind'],
      [/Scrieți cel puțin 150/g, 'Scrie cel puțin 150'],
    ],
  },
};

function polishTask1(lang) {
  const fp = path.join(PACKS, lang, 'task1.json');
  let s = fs.readFileSync(fp, 'utf8');
  let n = 0;
  for (const [re, to] of TASK1_BOILER[lang].patterns) {
    const before = s;
    s = s.replace(re, to);
    if (s !== before) n++;
  }
  // validate JSON
  JSON.parse(s);
  fs.writeFileSync(fp, s, 'utf8');
  console.log(lang, 'task1 pattern groups hit', n);
}

function fixTitleCaseNoise(str) {
  // Fix accidental mid-title Capitals after lowercase words: "fluidez Profesional"
  return str.replace(
    /(\p{Ll}) (\p{Lu})(\p{Ll}+)/gu,
    (m, a, B, rest) => {
      // keep if likely proper noun (single token after) — still lowercase connective style for common adjectives
      const word = B + rest;
      const keep = /^(B2|C1|C2|PIB|PISA|CO|AM|PM|IELTS|ONU|UE|USA|UK)$/i.test(word);
      if (keep) return m;
      return `${a} ${B.toLocaleLowerCase('und')}${rest}`;
    }
  );
}

function polishLevelTexts(lang) {
  const fp = path.join(PACKS, lang, 'level-texts.json');
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let n = 0;

  // ES: unify a50/a100 to tú (matches i50 style)
  if (lang === 'es') {
    for (const level of Object.keys(data)) {
      for (const p of data[level]) {
        if (p.id === 'a50' || p.id === 'a100') {
          const before = p.text;
          p.text = p.text
            .replace(/\ble permite\b/g, 'te permite')
            .replace(/\bpuede comunicar/g, 'puedes comunicar')
            .replace(/\bpuede comprender/g, 'puedes comprender')
            .replace(/\bha demostrado\b/g, 'has demostrado')
            .replace(/\bPuede comunicar/g, 'Puedes comunicar')
            .replace(/\bsus ideas\b/g, 'tus ideas')
            .replace(/\bsus habilidades\b/g, 'tus habilidades')
            .replace(/\bque aprende\b/g, 'que aprendes')
            .replace(/\bexpande su mundo\b/g, 'expande tu mundo')
            .replace(/\ble permite conectarse\b/g, 'te permite conectar')
            .replace(/\bLe deseamos\b/g, 'Te deseamos')
            .replace(/\bsu máximo potencial\b/g, 'tu máximo potencial')
            .replace(/\bsu campo elegido\b/g, 'el campo que elijas')
            .replace(/\bsu viaje\b/g, 'tu viaje')
            .replace(/\bsignifica su\b/g, 'marca tu');
          if (p.text !== before) n++;
        }
        if (p.title) {
          const t = fixTitleCaseNoise(p.title);
          if (t !== p.title) {
            p.title = t;
            n++;
          }
        }
      }
    }
  } else {
    for (const level of Object.keys(data)) {
      for (const p of data[level]) {
        if (p.title) {
          const t = fixTitleCaseNoise(p.title);
          if (t !== p.title) {
            p.title = t;
            n++;
          }
        }
      }
    }
  }

  // Language-specific body polish
  const bodyPairs = {
    es: [
      ['de manera efectiva', 'con eficacia'],
      ['fuerza laboral', 'mano de obra'],
      ['ostensiblemente', 'en apariencia'],
      ['exacerbar las dispar', 'agravar las dispar'],
    ],
    pt: [
      ['de maneira efetiva', 'com eficácia'],
      ['força de trabalho', 'mão de obra'],
    ],
    fr: [
      ['main-d\'œuvre est ostensiblement conçue', 'main-d\'œuvre est censée'],
      ['réalisation significative', 'étape importante'],
    ],
    it: [
      ['in maniera efficace', 'in modo efficace'],
      ['forza lavoro', 'forza lavoro'],
    ],
    ro: [
      ['în mod eficient', 'cu eficacitate'],
    ],
  };

  for (const level of Object.keys(data)) {
    for (const p of data[level]) {
      let t = p.text;
      for (const [a, b] of bodyPairs[lang] || []) {
        if (t.includes(a)) {
          t = t.split(a).join(b);
          n++;
        }
      }
      p.text = t;
    }
  }

  writeJson(fp, data);
  console.log(lang, 'level-texts fixes', n);
}

function polishWriting(lang) {
  const fp = path.join(PACKS, lang, 'writing-topics.json');
  let s = fs.readFileSync(fp, 'utf8');
  const pairs = {
    es: [
      ['pidiéndole que se reúnan para tomar un café', 'para quedar y tomar un café juntos'],
      ['Escribe un mensaje de texto a un amigo pidiendo', 'Escribe un mensaje de texto a un amigo para pedir'],
      ['Nombra tres cosas', 'Indica tres cosas'],
      ['Enumera cinco cosas', 'Enumera cinco cosas'],
      ['Comparte tres razones', 'Explica tres razones'],
      ['Responde esto:', 'Responde a esto:'],
      ['tienda de comestibles', 'supermercado'],
      ['entrada de diario', 'entrada en el diario'],
      ['aprender el idioma español', 'aprender español'],
    ],
    pt: [
      ['Liste cinco coisas', 'Liste cinco coisas'],
      ['Nomeie três coisas', 'Indique três coisas'],
      ['Responda a esta pergunta:', 'Responda a esta pergunta:'],
    ],
    fr: [
      ['Énumérez cinq choses', 'Énumérez cinq choses'],
      ['Nommez trois choses', 'Indiquez trois choses'],
    ],
    it: [
      ['Elenca cinque cose', 'Elenca cinque cose'],
      ['Indica tre cose', 'Indica tre cose'],
    ],
    ro: [
      ['Numește trei lucruri', 'Indică trei lucruri'],
    ],
  };

  let n = 0;
  for (const [a, b] of pairs[lang] || []) {
    if (s.includes(a) && a !== b) {
      s = s.split(a).join(b);
      n++;
    }
  }
  JSON.parse(s);
  fs.writeFileSync(fp, s, 'utf8');
  console.log(lang, 'writing fixes', n);
}

function polishCROptions(lang) {
  const fp = path.join(PACKS, lang, 'comprehensive-reading.json');
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let n = 0;
  for (const item of data) {
    if (item.title) {
      const t = fixTitleCaseNoise(item.title);
      if (t !== item.title) {
        item.title = t;
        n++;
      }
    }
    for (const q of item.questions || []) {
      if (!Array.isArray(q.options)) continue;
      q.options = q.options.map((o) => {
        if (typeof o !== 'string') return o;
        let x = o.trim();
        // capitalize first letter of options inconsistently lowercased
        if (/^[a-záéíóúñàèìòùăâîșțç]/i.test(x) && !/^[A-ZÁÉÍÓÚÑÀÈÌÒÙĂÂÎȘȚÇ]/.test(x)) {
          x = x.charAt(0).toLocaleUpperCase(lang) + x.slice(1);
          n++;
        }
        // ES calques
        if (lang === 'es') {
          if (x === 'En blanco y negro') {
            x = 'Blanco y negro';
            n++;
          }
          if (x === 'Sobre el piso') {
            x = 'En el suelo';
            n++;
          }
          if (x === 'en la cama') {
            x = 'En la cama';
            n++;
          }
          if (x === 'en el sofá') {
            x = 'En el sofá';
            n++;
          }
          if (x === 'en la silla') {
            x = 'En la silla';
            n++;
          }
        }
        return x;
      });
    }
  }
  writeJson(fp, data);
  console.log(lang, 'CR option/title fixes', n);
}

for (const lang of ['es', 'pt', 'fr', 'it', 'ro']) {
  polishTask1(lang);
  polishLevelTexts(lang);
  polishWriting(lang);
  polishCROptions(lang);
}
console.log('pass3 done');
