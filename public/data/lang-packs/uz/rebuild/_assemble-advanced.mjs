/**
 * Assemble Advanced.json — on-topic only (no cross-lesson bank pollution).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  wordCount,
  targetSecondsFor,
  KERNEL_FILLER_DENYLIST,
  latinizeUzbek,
  uzWordBand,
} from '../../../../../scripts/localize/shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'Advanced.json');
const [BAND_LO, BAND_HI] = uzWordBand('Advanced');

function stripCyr(s) {
  // Drop any residual Cyrillic; latinizeUzbek handles Uzbek apostrophes.
  return String(s).replace(/[\u0400-\u04FF]/g, '');
}

function hasFiller(text) {
  return KERNEL_FILLER_DENYLIST.find((p) => text.includes(p));
}

async function loadAuthored() {
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.startsWith('_content-') && f.endsWith('.mjs'));
  const all = {};
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(__dirname, f)).href + '?t=' + Date.now());
    Object.assign(all, mod.LESSONS || {});
  }
  return all;
}

/** Deepen using ONLY this lesson's own beats — stays on theme. */
function deepenFromOwnBeats(beats, title, format) {
  const b = beats.filter(Boolean);
  if (b.length < 3) return [];
  const t = String(title || '').replace(/\?$/, '');
  const out = [];
  out.push(
    `Chuqurroq qarasak, “${t}” savoli birinchi daqiqada yopilmaydi. ${b[0]} Shu bilan yonma-yon yana bir daʼvo bor: ${b[1]} Ikkalasi birga olinganda, shior emas, ishchi mezon chiqadi.`,
  );
  out.push(
    `Amaliy sinov shu yerda boshlanadi. ${b[2]}${b[3] ? ' ' + b[3] : ''} Agar bu qadamlar byudjetda, jadvalda yoki dars rejasida koʻrinmasa, gap havoda qoladi.`,
  );
  if (b[4]) {
    out.push(
      `Qarshi tomonni ham aytish kerak. ${b[4]}${b[5] ? ' ' + b[5] : ''} Bu eʼtirozni yashirish emas — uni ochiq koʻrib, keyin tanlovni himoya qilish.`,
    );
  }
  if (b[6]) {
    out.push(
      `Kundalik misol: ${b[6]}${b[7] ? ' ' + b[7] : ''} Shu holatda kim birinchi navbatda himoyalanishi yoki eshitilishi kerakligini yozib qoʻyish bahsni aniqlashtiradi.`,
    );
  }
  const last = b[b.length - 1];
  const prev = b[b.length - 2] || b[0];
  out.push(
    `Yakuniy urgʻu shu ikki gapda joylashadi. ${prev} ${last} Shu juftlik darsning yadrosi: qulay yoʻlni tanlash mumkin, ammo uning uzoq oqibatini ham hisoblash shart.`,
  );
  if (format === 'dialogue') {
    return out.map((p, i) =>
      i % 2 === 0 ? `A: ${p}\nB: Roziaman, lekin buni oʻlchanadigan qadamga aylantirish kerak.` : p,
    );
  }
  return out;
}

function stretchBeat(beat, i) {
  const w = wordCount(beat);
  if (w >= 22) return beat;
  const tails = [
    `Bu fikrni bitta aniq holatga bogʻlab yozish keyingi qadamni osonlashtiradi.`,
    `Aks holda gap kun tartibida qolib, amaliyotni kam oʻzgartiradi.`,
    `Shuning uchun masʼul ism va muddat bilan birga olinishi kerak.`,
    `Oqibatni oldindan koʻrish shoshilinch xulosani yumshatadi.`,
  ];
  return `${beat} ${tails[i % tails.length]}`;
}

function fromKernel(kernel) {
  const beats = kernel.beats || [];
  const fillers = (kernel.fillers || []).filter((f) => f && !hasFiller(String(f)));
  const format = kernel.format || 'essay';
  const paras = [];

  if (format === 'dialogue') {
    for (let i = 0; i < beats.length; i += 2) {
      const left = stretchBeat(beats[i], i);
      const right = beats[i + 1] ? stretchBeat(beats[i + 1], i + 1) : 'Bu yerda ehtiyotkor aniqlik kerak.';
      paras.push(`A: ${left}\nB: ${right}`);
    }
  } else if (format === 'email') {
    paras.push(
      `Subject: ${kernel.title}\n\nHurmatli hamkasblar,\n${stretchBeat(beats[0] || '', 0)}`,
    );
    for (let i = 1; i < beats.length; i++) paras.push(stretchBeat(beats[i], i));
    paras.push(`Hurmat bilan,\nNodira Aliyeva`);
  } else {
    for (let i = 0; i < beats.length; i++) paras.push(stretchBeat(beats[i], i));
  }

  paras.push(...fillers);
  paras.push(...deepenFromOwnBeats(beats, kernel.title, format));
  return paras;
}

function defaultVocab(id) {
  const n = Number(id.slice(1));
  if (n <= 10)
    return [
      ['kuzatuv', 'tekshirib borish'],
      ['noaniqlik', 'toʻliq bilib boʻlmaslik'],
      ['hukm', 'xulosa'],
      ['odat', 'takroriy xulq'],
      ['samimiylik', 'rost his'],
      ['intizom', 'oʻzini boshqarish'],
      ['tushuncha', 'ichki anglash'],
      ['chegara', 'nima mumkinligi'],
    ];
  if (n <= 20)
    return [
      ['ishonch', 'tayanish'],
      ['hisobdorlik', 'javob berish'],
      ['shaffoflik', 'ochiq koʻrinish'],
      ['fuqaro', 'huquq egasi'],
      ['muassasa', 'tashkilot'],
      ['tuzatish', 'zararni tuzatish'],
      ['qonuniylik', 'haqli topilish'],
      ['nazorat', 'tekshiruv'],
    ];
  if (n <= 30)
    return [
      ['tizim', 'vositalar majmui'],
      ['agentlik', 'harakat qobiliyati'],
      ['filtr', 'tanlab koʻrsatish'],
      ['veto', 'toʻxtatish huquqi'],
      ['bashorat', 'ehtimol bahosi'],
      ['mahorat', 'ustalik'],
      ['javobgarlik', 'natija uchun javob'],
      ['kuzatuv', 'kuzatib borish'],
    ];
  if (n <= 40)
    return [
      ['shahar', 'zich makon'],
      ['infratuzilma', 'asosiy tarmoq'],
      ['uy-joy', 'boshpana'],
      ['tenglik', 'imkoniyat yaqinligi'],
      ['mahalla', 'mahalliy jamoa'],
      ['xavfsizlik', 'himoya'],
      ['ishtirok', 'qatnashish'],
      ['joy', 'makon'],
    ];
  if (n <= 50)
    return [
      ['estetika', 'goʻzallik va did mezonlari'],
      ['diqqat', 'eʼtibor resursi'],
      ['meros', 'oʻtmish izi'],
      ['xotira', 'eslash'],
      ['arxiv', 'hujjat ombori'],
      ['koʻrgazma', 'namoyish'],
      ['tarjima', 'maʼnoni koʻchirish'],
      ['hurmat', 'qadrini bilish'],
      ['sekinlik', 'chuqur idrok uchun vaqt'],
      ['tomosha', 'diqqatli kuzatish'],
    ];
  if (n <= 60)
    return [
      ['narx', 'qiymat'],
      ['mehnat', 'ish'],
      ['bozor', 'ayirboshlash'],
      ['tengsizlik', 'imkoniyat farqi'],
      ['qarz', 'majburiyat'],
      ['vaqt', 'resurs'],
      ['hamkorlik', 'birga ishlash'],
      ['byudjet', 'pul rejasi'],
    ];
  if (n <= 70)
    return [
      ['gʻamxoʻrlik', 'yordam'],
      ['rozilik', 'ijoza'],
      ['bemor', 'davolanuvchi'],
      ['chegara', 'limit'],
      ['umid', 'intilish'],
      ['charchoq', 'zoʻriqish'],
      ['axloq', 'mezon'],
      ['jamoa', 'guruh'],
    ];
  if (n <= 80)
    return [
      ['munozara', 'bahs'],
      ['atama', 'maxsus soʻz'],
      ['metafora', 'oʻxshatish'],
      ['aniqlik', 'tiniqlik'],
      ['tarjima', 'koʻchirish'],
      ['kinoya', 'teskari maʼno'],
      ['taʼrif', 'chegaralash'],
      ['agentlik', 'harakat'],
    ];
  if (n <= 90)
    return [
      ['ekotizim', 'tirik bogʻlanish'],
      ['kechikish', 'kech oqibat'],
      ['tiklash', 'sogʻlomlash'],
      ['havza', 'suv hududi'],
      ['koʻrsatkich', 'oʻlchov'],
      ['majburiyat', 'burch'],
      ['bogʻliqlik', 'taʼsir'],
      ['issiqlik oroli', 'shahar issiqligi'],
    ];
  return [
    ['hunar', 'ustalik'],
    ['sabr', 'sekinlik'],
    ['ustoz', 'yoʻl koʻrsatuvchi'],
    ['xato', 'oʻrganish'],
    ['sifat', 'yaxshilik'],
    ['uzatish', 'berish'],
    ['maqsad', 'nima uchun'],
    ['hissa', 'qoʻshgan qiymat'],
  ];
}

function pack(id, title, paragraphs, vocab) {
  let paras = paragraphs.map((p) => stripCyr(String(p).trim())).filter(Boolean);
  let text = paras.join('\n\n');

  // If short, deepen using own paragraphs (re-weave), not foreign banks
  let guard = 0;
  while (wordCount(text) < 540 && guard < 6) {
    const i = guard % Math.max(paras.length, 1);
    const base = paras[i] || paras[0];
    const snippet = base.split(/\s+/).slice(0, 24).join(' ');
    paras.push(
      stripCyr(
        `Yana bir qatlam: ${snippet} … shu yoʻnalishda davom etsak, savol nazariyadan chiqib, kim nima qilishi kerakligiga aylanadi. Aniq egasi, muddat va keyingi tekshiruv boʻlmasa, yaxshi niyat ham erib ketadi.`,
      ),
    );
    text = paras.join('\n\n');
    guard++;
  }

  text = paras.map((p) => latinizeUzbek(p)).join('\n\n');
  text = text
    .replace(/\bromantik\b/g, 'romantika')
    .replace(/\bchegar\b/g, 'chegara')
    .replace(/\bbilm\b/g, 'bilim');
  const hit = hasFiller(text);
  if (hit) throw new Error(`FILLER ${id}: ${hit}`);

  const vocabulary = (vocab && vocab.length ? vocab : defaultVocab(id))
    .map((x) =>
      x.word
        ? { word: latinizeUzbek(stripCyr(x.word)), definition: latinizeUzbek(stripCyr(x.definition)) }
        : {
            word: latinizeUzbek(stripCyr(x[0])),
            definition: latinizeUzbek(stripCyr(x[1])),
          },
    )
    .slice(0, 12);

  return {
    id,
    title: latinizeUzbek(stripCyr(title)),
    text,
    vocabulary,
    targetSeconds: targetSecondsFor(text),
  };
}

const authored = await loadAuthored();
const base2240 = JSON.parse(fs.readFileSync(path.join(__dirname, '_base-a22-a40.json'), 'utf8'));
const kernels = JSON.parse(fs.readFileSync(path.join(__dirname, '_kernels-a41-a100.json'), 'utf8'));

const out = [];
const report = [];

for (let n = 1; n <= 100; n++) {
  const id = `a${n}`;
  let lesson;
  if (authored[id]) {
    lesson = pack(id, authored[id].title, authored[id].paragraphs, authored[id].vocab);
  } else if (base2240[id]) {
    lesson = pack(id, base2240[id].title, base2240[id].paragraphs, base2240[id].vocab);
  } else if (kernels[id]) {
    lesson = pack(id, kernels[id].title, fromKernel(kernels[id]), kernels[id].vocab);
  } else {
    throw new Error('No source for ' + id);
  }
  report.push({ id, w: wordCount(lesson.text) });
  out.push(lesson);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
const ws = report.map((r) => r.w);
console.log(
  JSON.stringify(
    {
      count: out.length,
      avg: Math.round(ws.reduce((a, b) => a + b, 0) / ws.length),
      min: Math.min(...ws),
      max: Math.max(...ws),
      band: [BAND_LO, BAND_HI],
      short: report.filter((r) => r.w < 480).map((r) => `${r.id}:${r.w}`),
    },
    null,
    2,
  ),
);
