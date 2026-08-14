/**
 * Literary MT polish pass for Romance lang packs: es, pt, fr, it, ro.
 * Fixes self-ref damage, agreement/calques, capitalization; preserves JSON structure.
 *
 * Usage: node scripts/polish-romance-literary.mjs [--dry] [--lang=es]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS = path.join(ROOT, 'public', 'data', 'lang-packs');
const DRY = process.argv.includes('--dry');
const ONLY = (process.argv.find((a) => a.startsWith('--lang=')) || '').slice(7);

const LANGS = ['es', 'pt', 'fr', 'it', 'ro'];

/** Sentence-case / title-case first letter (Unicode-aware). */
function capFirst(s) {
  if (!s || typeof s !== 'string') return s;
  const m = s.match(/^(\s*)(\S)(.*)$/s);
  if (!m) return s;
  return m[1] + m[2].toLocaleUpperCase('und') + m[3];
}

function applyPairs(text, pairs) {
  let out = text;
  let n = 0;
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) {
      const next = out.replace(from, to);
      if (next !== out) n++;
      out = next;
    } else if (out.includes(from)) {
      out = out.split(from).join(to);
      n++;
    }
  }
  return { text: out, n };
}

/** High-confidence literary / bugfix pairs per language (longest first). */
const PAIRS = {
  es: [
    ['español e español', 'español e inglés'],
    ['Español e español', 'Español e inglés'],
    ['(español, español)', '(español, inglés)'],
    ['llave española', 'llave inglesa'],
    ['En blanco y negro', 'Blanco y negro'],
    ['en blanco y negro', 'blanco y negro'],
    ['Sobre el piso', 'En el suelo'],
    ['sobre el piso', 'en el suelo'],
    ['Discuta ambos', 'Discute ambos'],
    ['dé su propia', 'da tu propia'],
    ['Dé su propia', 'Da tu propia'],
    ['Resuma la información', 'Resume la información'],
    ['haga comparaciones', 'haz comparaciones'],
    ['Escribe al menos', 'Escribe al menos'],
    ['el español es un idioma', 'El español es un idioma'],
    ['Revisión Final', 'Repaso final'],
    ['Dominando los Matices del español', 'Dominar los matices del español'],
    ['Alcanzando la Fluidez', 'Alcanzar la fluidez'],
    ['Alcanzando la Maestría', 'Alcanzar la maestría'],
    ['Alcanzando tu Potencial', 'Alcanzar tu potencial'],
    ['Estudiando Español Todos los Días', 'Estudiar español todos los días'],
    ['Mi Mañana', 'Mi mañana'],
    [/A ella le gusta beber leche\. Ella duerme/g, 'Le gusta beber leche. Duerme'],
    [/señales en inglés/g, 'señales en inglés'], // factual Tokyo — keep
  ],
  pt: [
    ['chave portuguesa', 'chave de boca'],
    ['Aula de Português', 'aula de português'],
    ['Português Todos os Dias', 'português todos os dias'],
    ['Dominando as Sutilezas do português', 'Dominar as sutilezas do português'],
    ['Alcançando Fluência', 'Alcançar fluência'],
    ['Alcançando Maestria', 'Alcançar maestria'],
    ['Eu abro meus olhos', 'Abro os olhos'],
    ['Eu estico meus braços', 'esticо os braços'],
    [' eu lavo meu rosto', ' lavo o rosto'],
    [' eu escovo meus dentes', ' escovo os dentes'],
    ['Eu faço um pequeno café', 'Faço um pequeno café'],
    ['Eu gosto de ler', 'Gosto de ler'],
    ['Eu me sinto feliz', 'Sinto-me feliz'],
    ['Eu tenho uma mochila', 'Tenho uma mochila'],
    ['Eu lembro da', 'Lembro da'],
    ['Eu estava um pouco nervoso porque eu não', 'Estava um pouco nervoso porque não'],
    ['Eu consigo dizer', 'Consigo dizer'],
    ['Eu consigo descrever', 'Consigo descrever'],
    ['Eu consigo falar', 'Consigo falar'],
    ['Eu estudo português', 'Estudo português'],
    ['Eu leio livros', 'Leio livros'],
    ['Eu aprendo palavras', 'Aprendo palavras'],
    ['Discuta ambos', 'Discuta ambos'],
    ['dê sua própria', 'dê a sua própria'],
  ],
  fr: [
    ['de le français', 'du français'],
    ['De le français', 'Du français'],
    ['maîtrise de le français', 'maîtrise du français'],
    ['environnements anglophones', 'environnements francophones'],
    ['environnements anglophones', 'environnements francophones'],
    ['le français est une langue', 'Le français est une langue'],
    ['Maîtriser les nuances de le français', 'Maîtriser les nuances du français'],
    ['Le Chemin vers la Maîtrise de le français', 'Le chemin vers la maîtrise du français'],
    ['Ma première leçon de Français', 'Ma première leçon de français'],
    ['Mon monde en Français', 'Mon monde en français'],
    ['Étudier le Français Tous les Jours', 'Étudier le français tous les jours'],
    ['sur mon visage', 'au visage'],
    ['Aujourd\'hui est un très bon jour', 'Aujourd\'hui, c\'est une très belle journée'],
    ['Ce fut une journée très chargée et bonne', 'Ce fut une journée bien remplie et agréable'],
    ['Discutez des deux points de vue et donnez votre propre opinion.', 'Discutez les deux points de vue et donnez votre opinion.'],
  ],
  it: [
    ['chiave italiano', 'chiave inglese'],
    ['ambienti anglofoni', 'ambienti italofoni'],
    ['l\'italiano è una lingua', 'L\'italiano è una lingua'],
    ['studio italiano ogni giorno', 'Studio italiano ogni giorno'],
    ['Lezione di Italiano', 'lezione di italiano'],
    ['Padroneggiare le Sfumature dell\'italiano', 'Padroneggiare le sfumature dell\'italiano'],
    ['Il Percorso verso la Padronanza dell\'italiano', 'Il percorso verso la padronanza dell\'italiano'],
    ['un cibo italiano simile ai noodles', 'un piatto italiano di pasta lunga'],
    ['Dentro la borsa ci sono', 'Nella borsa ci sono'],
    ['Discuti entrambi i punti di vista e dai la tua opinione.', 'Discuti entrambi i punti di vista ed esprimi la tua opinione.'],
  ],
  ro: [
    ['Educaţie', 'Educație'],
    ['orașul tău natal. Unde este situat?', 'orașul tău natal. Unde se află?'],
    ['Recenzie finală', 'Recapitulare finală'],
    ['Revizuire Finală', 'Recapitulare finală'],
    ['Studiind româna', 'Studiind limba română'],
    ['Fluentei', 'fluenței'],
    ['Fluentei', 'fluenței'],
    ['în română!', 'în limba română!'],
    ['Discutați ambele puncte de vedere și spuneți-vă propria părere. Scrie', 'Discută ambele puncte de vedere și exprimă-ți propria părere. Scrie'],
    ['Discutați ambele puncte de vedere și spuneți-vă propria părere.', 'Discută ambele puncte de vedere și exprimă-ți propria părere.'],
    ['clasa a cincea', 'sala numărul cinci'], // EN: classroom number five — not 5th grade
  ],
};

// Fix accidental Cyrillic о in pt pair
PAIRS.pt = PAIRS.pt.map(([a, b]) => [a, typeof b === 'string' ? b.replace('esticо', 'estico') : b]);

function polishString(lang, s, ctx = '') {
  if (typeof s !== 'string' || !s) return { text: s, n: 0 };
  let { text, n } = applyPairs(s, PAIRS[lang] || []);

  // Title fields: capitalize first letter
  if (/(^|\.)(title|name|label)$/i.test(ctx) || ctx.endsWith('.title') || ctx === 'title') {
    const c = capFirst(text);
    if (c !== text) {
      text = c;
      n++;
    }
  }

  return { text, n };
}

function walk(lang, node, ctx, stats) {
  if (typeof node === 'string') {
    const { text, n } = polishString(lang, node, ctx);
    stats.fixes += n;
    stats.strings++;
    return text;
  }
  if (Array.isArray(node)) {
    return node.map((v, i) => walk(lang, v, `${ctx}[${i}]`, stats));
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      // Skip chart data payloads that are pure numbers / series keys under data
      if (k === 'data' || k === 'datasets' || k === 'labels' || k === 'rows' || k === 'columns') {
        out[k] = v; // leave structural chart data; still polish nested instruction elsewhere
        // But recurse into objects that may contain titles
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          out[k] = walk(lang, v, `${ctx}.${k}`, stats);
        } else if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
          out[k] = walk(lang, v, `${ctx}.${k}`, stats);
        } else {
          out[k] = v;
        }
        continue;
      }
      out[k] = walk(lang, v, ctx ? `${ctx}.${k}` : k, stats);
    }
    return out;
  }
  return node;
}

function polishLevelTexts(lang, data, stats) {
  for (const level of Object.keys(data)) {
    for (const p of data[level]) {
      if (p.title) {
        const r = polishString(lang, p.title, 'title');
        p.title = r.text;
        stats.fixes += r.n;
      }
      if (p.text) {
        const r = polishString(lang, p.text, 'text');
        p.text = r.text;
        stats.fixes += r.n;
      }
      if (Array.isArray(p.vocabulary)) {
        for (const v of p.vocabulary) {
          if (v.definition) {
            const r = polishString(lang, v.definition, 'definition');
            v.definition = r.text;
            stats.fixes += r.n;
          }
          if (v.word) {
            const r = polishString(lang, v.word, 'word');
            v.word = r.text;
            stats.fixes += r.n;
          }
        }
      }
      stats.passages++;
    }
  }
  return data;
}

function polishCR(lang, data, stats) {
  for (const item of data) {
    if (item.title) {
      item.title = capFirst(polishString(lang, item.title, 'title').text);
      stats.fixes++;
    }
    if (item.passage) {
      const r = polishString(lang, item.passage, 'passage');
      item.passage = r.text;
      stats.fixes += r.n;
    }
    if (Array.isArray(item.questions)) {
      for (const q of item.questions) {
        if (q.text) {
          const r = polishString(lang, q.text, 'q');
          q.text = r.text;
          stats.fixes += r.n;
        }
        if (Array.isArray(q.options)) {
          q.options = q.options.map((o) => {
            const r = polishString(lang, o, 'opt');
            stats.fixes += r.n;
            // normalize option capitalization lightly
            return r.text;
          });
        }
      }
    }
    stats.passages++;
  }
  return data;
}

function polishTopics(lang, data, stats) {
  for (const level of Object.keys(data)) {
    data[level] = data[level].map((s) => {
      const r = polishString(lang, s, 'topic');
      stats.fixes += r.n;
      stats.passages++;
      return r.text;
    });
  }
  return data;
}

function polishTask2(lang, data, stats) {
  return walk(lang, data, 'task2', stats);
}

function polishTask1Instructions(lang, data, stats) {
  // Only polish instruction/title/description/label prose — not chart category English labels that are data
  function scrub(node, ctx) {
    if (typeof node === 'string') {
      if (/instruction|description|label|title|prompt|name/i.test(ctx.split('.').pop() || '')) {
        // Keep factual English/England chart topics
        const factual =
          /\b(England|English\s*%|Reasons for Studying English|United Kingdom|UK)\b/.test(node) ||
          /\b(Inglaterra|Royaume-Uni|Regno Unito|Anglia|Reino Unido)\b/.test(node);
        if (factual && /English\s*%|England|Inglaterra|Anglia/.test(node)) {
          stats.skippedFactual++;
          return node;
        }
        const r = polishString(lang, node, ctx);
        stats.fixes += r.n;
        stats.strings++;
        return r.text;
      }
      return node;
    }
    if (Array.isArray(node)) return node.map((v, i) => scrub(v, `${ctx}[${i}]`));
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (['data', 'values', 'series', 'points', 'rows', 'cells'].includes(k)) {
          out[k] = v;
          continue;
        }
        out[k] = scrub(v, ctx ? `${ctx}.${k}` : k);
      }
      return out;
    }
    return node;
  }
  return scrub(data, 'task1');
}

function polishDictation(lang, text, stats) {
  const lines = text.split(/\r?\n/);
  const out = lines.map((line) => {
    if (!line.trim()) return line;
    const r = polishString(lang, line, 'dict');
    stats.fixes += r.n;
    stats.passages++;
    return r.text;
  });
  return out.join('\n');
}

function processLang(lang) {
  const dir = path.join(PACKS, lang);
  const stats = { passages: 0, strings: 0, fixes: 0, skippedFactual: 0, files: [] };

  const files = [
    ['level-texts.json', (d) => polishLevelTexts(lang, d, stats)],
    ['comprehensive-reading.json', (d) => polishCR(lang, d, stats)],
    ['speaking-topics.json', (d) => polishTopics(lang, d, stats)],
    ['writing-topics.json', (d) => polishTopics(lang, d, stats)],
    ['task2.json', (d) => polishTask2(lang, d, stats)],
    ['task1.json', (d) => polishTask1Instructions(lang, d, stats)],
  ];

  for (const [name, fn] of files) {
    const fp = path.join(dir, name);
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, 'utf8');
    const data = JSON.parse(raw);
    const next = fn(data);
    if (!DRY) fs.writeFileSync(fp, JSON.stringify(next, null, 2) + '\n', 'utf8');
    stats.files.push(name);
  }

  const dictDir = path.join(dir, 'dictation');
  if (fs.existsSync(dictDir)) {
    for (const f of fs.readdirSync(dictDir)) {
      if (!f.endsWith('.txt')) continue;
      const fp = path.join(dictDir, f);
      const text = fs.readFileSync(fp, 'utf8');
      const next = polishDictation(lang, text, stats);
      if (!DRY) fs.writeFileSync(fp, next, 'utf8');
      stats.files.push(`dictation/${f}`);
    }
  }

  return stats;
}

const targets = ONLY ? [ONLY] : LANGS;
const report = {};
for (const lang of targets) {
  if (!LANGS.includes(lang)) continue;
  report[lang] = processLang(lang);
  console.log(
    lang,
    'files',
    report[lang].files.length,
    'passages~',
    report[lang].passages,
    'fixes',
    report[lang].fixes,
    DRY ? '(dry)' : ''
  );
}
console.log(JSON.stringify(report, null, 2));
