const fs = require('fs');

function fixMojibake(content) {
  const map = [
    ['Ã³', 'ó'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã¡', 'á'], ['Ãº', 'ú'],
    ['Ã±', 'ñ'], ['Ã¼', 'ü'], ['Ã ', 'à'], ['Ã¨', 'è'], ['Ã²', 'ò'],
    ['Ã¹', 'ù'], ['Ã¯', 'ï'], ['Ãµ', 'õ'], ['Ã¢', 'â'], ['Ã®', 'î'],
    ['Ã´', 'ô'], ['Ã»', 'û'],
    ['Ã€', 'À'], ['Ã\x81', 'Á'], ['Ã\x8d', 'Í'], ['Ã\x87', 'Ç'],
    // Windows-1252 range (0x80-0x9F mapped to special Unicode chars)
    ['Ã\u201C', 'Ó'],  // 0x93 → U+201C
    ['Ã\u201D', 'Ô'],  // 0x94 → U+201D (just in case)
    ['Ã\u2018', 'Ñ'],  // 0x91 → U+2018
    ['Ã\u2019', 'Ò'],  // 0x92 → U+2019 (just in case)
    ['Ã\u2030', 'É'],  // 0x89 → U+2030
    ['Ã\u0161', 'Ú'],  // 0x9A → U+0161
    ['Ã\u2014', '\xD7'], // 0x97 → U+2014 → ×
    ['Ã\u00A7', 'ç'],  // 0xA7 → § → ç
    ['â\x80\x99', '\u2019'], ['â\x80\x9c', '\u201C'], ['â\x80\x9d', '\u201D'],
    ['â\x80\x94', '\u2014'], ['â\x80\x93', '\u2013'],
    ['Â¿', '¿'], ['Â¡', '¡'], ['Â«', '«'], ['Â»', '»'], ['Â·', '·'],
    ['Ã\x83', 'Ã'],
  ];
  for (const [from, to] of map) {
    content = content.split(from).join(to);
  }
  return content;
}

const files = [
  'C:/Users/Rafa/Desktop/App Final/app/src/data/gameContent.ts',
  'C:/Users/Rafa/Desktop/App Final/app/src/data/duelosContent.ts',
];

for (const p of files) {
  const original = fs.readFileSync(p, 'utf8');
  const fixed = fixMojibake(original);
  fs.writeFileSync(p, fixed, 'utf8');
  const remaining = (fixed.match(/Ã[^\s]/g) || []).length;
  console.log(`Fixed ${p} — remaining mojibake hits: ${remaining}`);
}
