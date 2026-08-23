import fs from 'fs';

const map = {
  а: 'a', А: 'A', б: 'b', Б: 'B', в: 'v', В: 'V', г: 'g', Г: 'G',
  д: 'd', Д: 'D', е: 'e', Е: 'E', ё: 'yo', Ё: 'Yo', ж: 'j', Ж: 'J',
  з: 'z', З: 'Z', и: 'i', И: 'I', й: 'y', Й: 'Y', к: 'k', К: 'K',
  л: 'l', Л: 'L', м: 'm', М: 'M', н: 'n', Н: 'N', о: 'o', О: 'O',
  п: 'p', П: 'P', р: 'r', Р: 'R', с: 's', С: 'S', т: 't', Т: 'T',
  у: 'u', У: 'U', ф: 'f', Ф: 'F', х: 'x', Х: 'X', ц: 'ts', Ц: 'Ts',
  ч: 'ch', Ч: 'Ch', ш: 'sh', Ш: 'Sh', ъ: 'ʻ', ь: '', э: 'e', Э: 'E',
  ю: 'yu', Ю: 'Yu', я: 'ya', Я: 'Ya',
  ў: 'oʻ', Ў: 'Oʻ', қ: 'q', Қ: 'Q', ғ: 'gʻ', Ғ: 'Gʻ', ҳ: 'h', Ҳ: 'H',
  і: 'i', І: 'I',
};

const files = process.argv.slice(2);
for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const before = (s.match(/[\u0400-\u04FF]/g) || []).length;
  s = s.replace(/[\u0400-\u04FF]/g, (ch) => map[ch] ?? '');
  fs.writeFileSync(file, s);
  console.log(file, 'removed', before, 'cyr chars');
}
