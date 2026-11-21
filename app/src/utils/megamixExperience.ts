export type MegamixPhase =
  'Calienta motores' | 'La previa se anima' | 'Modo locura' | 'Final épico';

export interface MegamixMystery {
  emoji: string;
  label: string;
  hint: string;
}

export function getMegamixPhase(cardIndex: number): MegamixPhase {
  if (cardIndex < 40) return 'Calienta motores';
  if (cardIndex < 100) return 'La previa se anima';
  if (cardIndex < 180) return 'Modo locura';
  return 'Final épico';
}

export function getMegamixPhaseMeta(phase: MegamixPhase) {
  if (phase === 'Calienta motores')
    return { accent: 'text-cyan-300', bg: 'bg-cyan-400/10', emoji: '🔥' };
  if (phase === 'La previa se anima')
    return { accent: 'text-violet-300', bg: 'bg-violet-400/10', emoji: '⚡' };
  if (phase === 'Modo locura')
    return { accent: 'text-pink-300', bg: 'bg-pink-400/10', emoji: '💥' };
  return { accent: 'text-amber-300', bg: 'bg-amber-400/10', emoji: '👑' };
}

export function getMegamixMystery(card: string): MegamixMystery {
  const text = card.toLowerCase();
  if (/duelo|piedra|papel/i.test(text))
    return { emoji: '⚔️', label: 'Duelo', hint: 'Algo personal se acerca' };
  if (/verdad o bebe|confes/i.test(text))
    return { emoji: '🎤', label: 'Confidencia', hint: 'Alguien tendrá que decidir' };
  if (/cadena|categor/i.test(text))
    return { emoji: '🔗', label: 'Cadena', hint: 'La mesa entra en presión' };
  if (/trivia|comunidad|capital/i.test(text))
    return { emoji: '⚡', label: 'Pregunta rápida', hint: 'Piensa antes de hablar' };
  if (/norma/i.test(text))
    return { emoji: '📜', label: 'Nueva norma', hint: 'Las reglas pueden cambiar' };
  if (/impostor/i.test(text))
    return { emoji: '🕵️', label: 'Sospecha', hint: 'Alguien no es quien dice ser' };
  if (/torneo/i.test(text))
    return { emoji: '🏆', label: 'Torneo', hint: 'Se prepara una eliminatoria' };
  if (/más probable|votación|votad/i.test(text))
    return { emoji: '🗳️', label: 'Votación', hint: 'Las opiniones van a delataros' };
  if (/yo nunca/i.test(text))
    return { emoji: '🙈', label: 'Yo nunca', hint: 'Alguien se va a reconocer' };
  if (/pacto|alianza|traidor|secreto/i.test(text))
    return { emoji: '🃏', label: 'Carta oscura', hint: 'Esta ronda puede tener consecuencias' };
  return { emoji: '🎲', label: 'Sorpresa', hint: 'Nadie sabe quién acabará bebiendo' };
}

// Fin de palabra que también respeta tildes y ñ (\b no las considera letras).
const END = '(?![\\wáéíóúñ])';

const DRINK_VERBS: Record<string, string> = {
  bebe: 'pierde',
  bebes: 'pierdes',
  beben: 'pierden',
  beban: 'pierdan',
  bebéis: 'perdéis',
  beber: 'perder',
};

const GIVE_VERBS: Record<string, string> = {
  reparte: 'quita',
  repartes: 'quitas',
  reparten: 'quitan',
  repartid: 'quitad',
};

const points = (n: string) => `${n} ${n === '1' || n === 'un' ? 'punto' : 'puntos'}`;

// Conserva la mayúscula inicial ("Bebe 2" → "Pierde 2 puntos").
const matchCase = (original: string, replacement: string) =>
  original[0] === original[0].toUpperCase()
    ? replacement[0].toUpperCase() + replacement.slice(1)
    : replacement;

export function transformCardForNoAlcohol(card: string): string {
  const drinkVerb = `(${Object.keys(DRINK_VERBS).join('|')})${END}`;
  const giveVerb = `(${Object.keys(GIVE_VERBS).join('|')})${END}`;
  const amount = `\\s+(\\d+|un)(?:\\s+tragos?${END})?`;

  return (
    card
      // "bebe 2", "bebe 2 tragos", "deben beber 1" → "pierde 2 puntos"
      .replace(new RegExp(drinkVerb + amount, 'gi'), (m, verb: string, n: string) =>
        matchCase(m, `${DRINK_VERBS[verb.toLowerCase()]} ${points(n)}`)
      )
      // "reparte 3" → "quita 3 puntos"
      .replace(new RegExp(giveVerb + amount, 'gi'), (m, verb: string, n: string) =>
        matchCase(m, `${GIVE_VERBS[verb.toLowerCase()]} ${points(n)}`)
      )
      // "si uno bebe, el otro también bebe" → "pierde puntos"
      .replace(new RegExp(drinkVerb, 'gi'), (m, verb: string) =>
        matchCase(m, `${DRINK_VERBS[verb.toLowerCase()]} puntos`)
      )
      .replace(new RegExp(`(\\d+|un)\\s+tragos?${END}`, 'gi'), (_m, n: string) => points(n))
      .replace(/🍺|🍻|🥃/g, '⭐')
  );
}

export function isNoAlcoholMode(): boolean {
  try {
    return localStorage.getItem('beep_no_alcohol') === 'true';
  } catch {
    return false;
  }
}

export function setNoAlcoholMode(enabled: boolean): void {
  try {
    localStorage.setItem('beep_no_alcohol', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('beep:no-alcohol-change'));
  } catch {
    // Sin persistencia no cambia el funcionamiento de la partida.
  }
}
