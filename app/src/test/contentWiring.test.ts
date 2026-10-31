import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ─── Content Wiring ──────────────────────────────────────────────────────────
// Ya pasó una vez: se añadieron ~3.000 frases en gameContentExtraN / MegaN que
// nadie importaba, así que nunca salían en el juego. Este test falla si algún
// export de un fichero de contenido no se usa en ningún otro sitio de src/.

const SRC = join(__dirname, '..');
const DATA = join(SRC, 'data');
const CONTENT_FILE = /^(gameContent(Extra|Mega)\w*|updatePostVerano\w*|generatedParty|humorNegroContent)\.ts$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'test' ? [] : walk(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

const sources = walk(SRC).map(file => ({
  file,
  words: new Set(readFileSync(file, 'utf8').match(/[A-Za-z_$][\w$]*/g) ?? []),
}));

describe('Content wiring', () => {
  const contentFiles = readdirSync(DATA).filter(f => CONTENT_FILE.test(f));

  it('finds the content files', () => {
    expect(contentFiles.length).toBeGreaterThan(20);
  });

  for (const name of contentFiles) {
    const file = join(DATA, name);
    const text = readFileSync(file, 'utf8');
    const exports = [...text.matchAll(/^export const (\w+)/gm)].map(m => m[1]);

    it(`${name}: todos sus exports se usan en el juego`, () => {
      const unused = exports.filter(
        exp => !sources.some(s => s.file !== file && s.words.has(exp)),
      );
      expect(unused, `Sin conectar en ${relative(SRC, file)}`).toEqual([]);
    });
  }
});
