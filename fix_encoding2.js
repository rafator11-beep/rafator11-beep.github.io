const fs = require('fs');

// Reverse map: Unicode codepoint → CP1252 byte (for the 0x80-0x9F special range)
const CP1252_REVERSE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

function charToByte(ch) {
  const cp = ch.codePointAt(0);
  if (cp <= 0x7F) return cp;                      // ASCII - direct
  if (cp >= 0xA0 && cp <= 0xFF) return cp;         // Latin-1 upper - direct
  if (CP1252_REVERSE[cp] !== undefined) return CP1252_REVERSE[cp]; // CP1252 special
  return null; // Cannot represent in CP1252 (already correct unicode)
}

function fixMojibake(content) {
  // Strip BOM if present - we'll re-add it
  const hasBOM = content.codePointAt(0) === 0xFEFF;
  const body = hasBOM ? content.slice(1) : content;

  const bytes = [];
  for (let i = 0; i < body.length; i++) {
    const b = charToByte(body[i]);
    if (b !== null) {
      bytes.push(b);
    } else {
      // Character not in CP1252 range - already correct Unicode, encode as UTF-8
      const cp = body.codePointAt(i);
      const encoded = Buffer.from(String.fromCodePoint(cp), 'utf8');
      for (const byte of encoded) bytes.push(byte);
      if (cp > 0xFFFF) i++; // surrogate pair in JS string
    }
  }

  const result = Buffer.from(bytes).toString('utf8');
  return hasBOM ? '\uFEFF' + result : result;
}

// Fix gameContent.ts from the original mojibaked version
const srcPath = 'C:/Users/Rafa/Desktop/App Final/app/src/data/gameContent_orig.ts';
const destPath = 'C:/Users/Rafa/Desktop/App Final/app/src/data/gameContent.ts';

const original = fs.readFileSync(srcPath, 'utf8');
const fixed = fixMojibake(original);

// Verify: check for remaining mojibake patterns
const remaining = (fixed.match(/Ã[^\s"',;!?.)\]}]/g) || []).length;
const emojiTest = fixed.includes('🥰') || fixed.includes('😂') || fixed.includes('🎉') || fixed.includes('🔥');
const accentTest = fixed.includes('sofá') || fixed.includes('sí') || fixed.includes('Ó') || fixed.includes('Ñ');
const quoteTest = !fixed.includes('â€˜') && !fixed.includes('â€™');

console.log('Remaining Ã+X mojibake:', remaining);
console.log('Accent chars OK:', accentTest);
console.log('Smart quotes fixed:', quoteTest);
console.log('Has emojis:', emojiTest);

fs.writeFileSync(destPath, fixed, 'utf8');
console.log('Written to', destPath);
