/**
 * Fix CP1252-over-UTF8 mojibake in gameContent.ts
 *
 * The file was originally UTF-8, then got re-saved with bytes misread as
 * Windows-1252 and re-encoded to UTF-8 (double encoding). This reverses it
 * ONLY for known mojibake sequences, leaving already-correct chars untouched.
 */
const fs = require('fs');

// Windows-1252: Unicode codepoint → original byte
const CP1252_REVERSE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

function cpToByte(cp) {
  if (cp <= 0x7F || (cp >= 0xA0 && cp <= 0xFF)) return cp;
  return CP1252_REVERSE[cp] ?? null;
}

function decodeSequence(chars) {
  const bytes = chars.map(c => cpToByte(c.codePointAt(0)));
  if (bytes.some(b => b === null)) return null;
  const buf = Buffer.from(bytes);
  const decoded = buf.toString('utf8');
  return decoded.includes('\uFFFD') ? null : decoded;
}

function fixMojibake(content) {
  let result = '';
  let i = 0;

  while (i < content.length) {
    const cp = content.codePointAt(i);

    // 4-byte emoji: ð (F0) + Ÿ (9F via CP1252 0x9F=U+0178) + 2 more
    if (cp === 0x00F0 && i + 3 < content.length && content.codePointAt(i + 1) === 0x0178) {
      const chars = [content[i], content[i+1], content[i+2], content[i+3]];
      const decoded = decodeSequence(chars);
      if (decoded) { result += decoded; i += 4; continue; }
    }

    // 3-byte sequences: â (E2) + 2 more chars
    if (cp === 0x00E2 && i + 2 < content.length) {
      const chars = [content[i], content[i+1], content[i+2]];
      const decoded = decodeSequence(chars);
      if (decoded) { result += decoded; i += 3; continue; }
    }

    // 2-byte sequences: Ã (C3) or Â (C2) + 1 char
    if ((cp === 0x00C3 || cp === 0x00C2) && i + 1 < content.length) {
      const chars = [content[i], content[i+1]];
      const decoded = decodeSequence(chars);
      if (decoded) { result += decoded; i += 2; continue; }
    }

    result += content[i];
    i += cp > 0xFFFF ? 2 : 1;
  }

  return result;
}

const srcPath = 'C:/Users/Rafa/Desktop/App Final/app/src/data/gameContent_orig.ts';
const destPath = 'C:/Users/Rafa/Desktop/App Final/app/src/data/gameContent.ts';

const original = fs.readFileSync(srcPath, 'utf8');

// Strip BOM if present - Node writes clean UTF-8 without BOM
const body = original.codePointAt(0) === 0xFEFF ? original.slice(1) : original;

const fixed = fixMojibake(body);

// Verify
const badCount = (fixed.match(/\uFFFD/g) || []).length;
const mojiCount = (fixed.match(/Ã[^\s"',;!?.)\]}]/g) || []).length;
const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(fixed);
const hasAccents = fixed.includes('sofá') && fixed.includes('Ópera') && fixed.includes('Ñ');
const hasQuotes = fixed.includes('\u2018') && fixed.includes('\u2019'); // curly quotes
const hasEuro = fixed.includes('€');

console.log('Replacement chars \\uFFFD:', badCount);
console.log('Remaining Ã+ mojibake:', mojiCount);
console.log('Has emojis:', hasEmoji);
console.log('Has accents (sofá, Ópera, Ñ):', hasAccents);
console.log('Has curly quotes:', hasQuotes);
console.log('Has euro €:', hasEuro);

if (badCount === 0 && mojiCount === 0) {
  fs.writeFileSync(destPath, fixed, 'utf8');
  console.log('\n✓ Written to', destPath);
} else {
  console.log('\n✗ Verification failed - NOT written');
}
