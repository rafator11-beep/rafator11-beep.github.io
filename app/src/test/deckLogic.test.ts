import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  capDrinking,
  getStructuredMegamix,
  isIndividualCard,
  normalizeCardText,
} from '@/data/gameContent';
import { DUEL_POOL } from '@/data/tournamentPools';
import { interleaveTasteCards, useGameContent } from '@/hooks/game/useGameContent';
import { MEGAMIX_SPAIN_GENERAL, MEGAMIX_SPAIN_INDIVIDUAL } from '@/data/megamixSpain';
import {
  canFireRuntimeEvent,
  getMegamixPhase,
  getMegamixMystery,
  transformCardForNoAlcohol,
} from '@/utils/megamixExperience';
import { cardKey, loadSeenCards, markCardSeen } from '@/utils/seenCards';
import { MEGAMIX_EXTRA_GENERAL, MEGAMIX_EXTRA_INDIVIDUAL } from '@/data/megamixCore';
import { GENERAL_TYPE_WEIGHTS, INDIVIDUAL_TYPE_WEIGHTS, triggerIntervals } from '@/config/cardWeights';

vi.mock('@/services/customThemeService', () => ({ fetchThemeCards: vi.fn(async () => []) }));

const CLASICO_OPTS = {
  generalKeys: ['yoNunca', 'picante', 'enLaCama', 'masProbable', 'pacovers', 'espana'],
  individualKeys: ['retos', 'categorias', 'clasico'],
};

const isTrigger = (c: string) => c.startsWith('TRIGGER:') || c.startsWith('📜');
const oddSlots = (deck: string[]) => deck.filter((_, i) => i % 2 === 1);
const evenSlots = (deck: string[]) => deck.filter((c, i) => i % 2 === 0 && !isTrigger(c));

// ─── isIndividualCard ────────────────────────────────────────────────────────
// Decide si una carta avanza el turno: si clasifica mal, la partida se atasca
// en un jugador o se salta a otro.

describe('isIndividualCard', () => {
  it.each([
    '🎯 RETO: {player}, imita a alguien de la mesa',
    '🎤 VERDAD O BEBE: {player} — ¿cuál es tu mayor vergüenza?',
    '⚡ TRIVIA EXPRESS: ¿Capital de Australia? (Canberra)',
    '🔤 CATEGORÍAS — "marcas de coches"',
    '⚔️ Duelo de miradas',
    'Reto: {player} canta el estribillo',
    'Cultura Chupística: ríos de España',
  ])('individual: %s', (card) => {
    expect(isIndividualCard(card)).toBe(true);
  });

  it.each([
    '🙈 Yo nunca... he mentido en una entrevista',
    '🗳️ ¿Quién es más probable que llegue tarde?',
    '🙌 TODOS A LA VEZ: señalad al más dormilón',
    'NORMA: prohibido decir "vale"',
    '📜 NORMA: se bebe con la izquierda',
    'TRIGGER:IMPOSTOR',
    '',
  ])('general: %s', (card) => {
    expect(isIndividualCard(card)).toBe(false);
  });
});

// ─── getStructuredMegamix ────────────────────────────────────────────────────

describe('getStructuredMegamix', () => {
  const deck = getStructuredMegamix(500, 5);

  it('devuelve exactamente las cartas pedidas', () => {
    expect(deck).toHaveLength(500);
    expect(deck.every((c) => typeof c === 'string' && c.trim().length > 0)).toBe(true);
    expect(deck).not.toContain('[object Object]');
  });

  it('mantiene los triggers repetidos (antes se deduplicaban a 1 de cada)', () => {
    // Impostor cada 5 rondas (con 5 jugadores, cada 50 cartas) → ~10 en 500
    expect(deck.filter((c) => c === 'TRIGGER:IMPOSTOR').length).toBeGreaterThanOrEqual(8);
    expect(
      deck.filter((c) => c === 'TRIGGER:TORNEO' || c === 'TRIGGER:MEGATORNEO').length
    ).toBeGreaterThan(4);
  });

  it('alterna individual / general sin excepciones', () => {
    expect(evenSlots(deck).filter((c) => !isIndividualCard(c))).toEqual([]);
    expect(oddSlots(deck).filter(isIndividualCard)).toEqual([]);
  });

  it('respeta los intervalos de eventos (por rondas, según jugadores)', () => {
    const every = triggerIntervals(5);
    const n = (re: RegExp) => deck.filter((c) => re.test(c)).length;
    // El respiro y las coincidencias retrasan alguno: margen de 2.
    expect(n(/^TRIGGER:(MEGA)?TORNEO$/)).toBeGreaterThanOrEqual(Math.floor(500 / every.torneo) - 2);
    expect(n(/^📜 NORMA/)).toBeGreaterThanOrEqual(Math.floor(500 / every.norma) - 2);
    expect(n(/^TRIGGER:(TRIVIA_|DUELO|VIRUS|EQUIPOS)/)).toBeGreaterThanOrEqual(Math.floor(500 / every.especial) - 2);
    expect(n(/^TRIGGER:IMPOSTOR$/)).toBeGreaterThanOrEqual(Math.floor(500 / every.impostor) - 2);
  });

  it('con más jugadores los eventos se espacian más (van por rondas)', () => {
    const four = triggerIntervals(4);
    const eight = triggerIntervals(8);
    for (const k of Object.keys(four) as (keyof typeof four)[]) {
      expect(eight[k]).toBeGreaterThan(four[k]);
    }
    // Con 2 jugadores no se disparan: hay un mínimo de cartas.
    expect(triggerIntervals(2).torneo).toBeGreaterThanOrEqual(14);
  });

  it('nunca dos eventos seguidos y como mucho un tercio de las grupales', () => {
    const big = getStructuredMegamix(2000, 4);
    const isEvent = (c: string) => c.startsWith('TRIGGER:') || c.startsWith('📜');
    const generals = big.filter((_, i) => i % 2 === 1);
    generals.forEach((c, i) => {
      if (i > 0 && isEvent(c) && isEvent(generals[i - 1])) {
        throw new Error(`dos eventos seguidos en el hueco general ${i}: ${generals[i - 1]} → ${c}`);
      }
    });
    expect(generals.filter(isEvent).length / generals.length).toBeLessThan(0.36);
  });

  it('lo fuerte (picante, en la cama) se guarda para el final', () => {
    const strong = (c: string) => /^(🌶️|🛌)/u.test(c);
    let early = 0;
    let earlyTotal = 0;
    let late = 0;
    let lateTotal = 0;
    // 8 jugadores: la primera fase dura 48 cartas y la final empieza en la 192.
    for (let k = 0; k < 6; k++) {
      const d = getStructuredMegamix(320, 8);
      d.forEach((c, i) => {
        if (i % 2 === 0 || c.startsWith('TRIGGER:') || c.startsWith('📜')) return;
        if (i < 48) {
          earlyTotal++;
          if (strong(c)) early++;
        } else if (i >= 192) {
          lateTotal++;
          if (strong(c)) late++;
        }
      });
    }
    // Al final sale bastante más (~5 % al principio, ~33 % al final); margen
    // amplio porque la muestra es aleatoria.
    expect(late / lateTotal).toBeGreaterThan((early / earlyTotal) * 2);
  });

  it('respeta los tipos permitidos (modo clásico)', () => {
    const clasico = getStructuredMegamix(400, 4, CLASICO_OPTS);
    for (const banned of ['🎭', '⚔️', '⚡', '💀']) {
      expect(clasico.filter((c) => c.startsWith(banned))).toEqual([]);
    }
  });

  it('aplica exclude', () => {
    const excluded = (c: string) => c.startsWith('🙈') && c.length % 2 === 0;
    const filtered = getStructuredMegamix(300, 4, { exclude: excluded });
    expect(filtered.filter(excluded)).toEqual([]);
    expect(filtered).toHaveLength(300);
  });

  it('no duplica el prefijo "Yo nunca"', () => {
    const big = getStructuredMegamix(2500, 4);
    expect(big.filter((c) => /yo nunca\.{3}\s*yo nunca/i.test(c))).toEqual([]);
  });

  it('sin emojis de tipo duplicados ni categorías envueltas dos veces', () => {
    const big = getStructuredMegamix(2500, 4);
    const leadingEmojis = /^(?:(?:\p{Extended_Pictographic}️?)\s*){2,}/u;
    expect(big.filter((c) => leadingEmojis.test(c))).toEqual([]);
    expect(big.filter((c) => /CATEGOR[IÍ]AS[^"]*"CATEGOR[IÍ]AS/i.test(c))).toEqual([]);
  });

  it('sin finales de trago que hablan de perdedor o votos inexistentes', () => {
    const big = getStructuredMegamix(2500, 4);
    const appended = / 🍻 El perdedor bebe 2\.$| 🍻 El que más votos tenga| 🍺 El señalado bebe 1\.$| 🥃 El que pierda,/;
    expect(big.filter((c) => appended.test(c))).toEqual([]);
  });

  it('mezcla los pools extra como un tipo más', () => {
    const extra = getStructuredMegamix(600, 4, {
      generalKeys: ['yoNunca'],
      extraGeneral: { customRetos: ['CARTA EXTRA DE PRUEBA'] },
    });
    expect(extra).toContain('CARTA EXTRA DE PRUEBA');
  });

  it('incluye contenido español curado en su posición correcta', () => {
    const spanish = getStructuredMegamix(500, 4, {
      extraGeneral: { megamixEspañaGeneral: MEGAMIX_SPAIN_GENERAL },
      extraIndividual: { megamixEspañaIndividual: MEGAMIX_SPAIN_INDIVIDUAL },
    });

    expect(spanish.some((card) => MEGAMIX_SPAIN_GENERAL.includes(card))).toBe(true);
    expect(spanish.some((card) => MEGAMIX_SPAIN_INDIVIDUAL.includes(card))).toBe(true);

    spanish.forEach((card, index) => {
      if (index % 2 === 0) expect(isIndividualCard(card)).toBe(true);
      if (index % 2 === 1 && !isTrigger(card) && !card.startsWith('📜')) {
        expect(isIndividualCard(card)).toBe(false);
      }
    });
  });
});

// ─── Memoria entre partidas ──────────────────────────────────────────────────

describe('cartas vistas en partidas anteriores', () => {
  beforeEach(() => localStorage.clear());

  it('la clave ignora la coletilla de trago, que cambia en cada partida', () => {
    expect(cardKey('🙈 Yo nunca he mentido 🍻 ¡Bebe 2 tragos!')).toBe(
      cardKey('🙈 Yo nunca he mentido 🍺 ¡Un traguito!')
    );
    expect(cardKey('🙈 Yo nunca he mentido')).not.toBe(cardKey('🙈 Yo nunca he robado'));
  });

  it('markCardSeen recuerda por modo y no duplica', () => {
    markCardSeen('megamix', '🎯 RETO: baila');
    markCardSeen('megamix', '🎯 RETO: baila');
    expect(loadSeenCards('megamix')('🎯 RETO: baila')).toBe(true);
    expect(loadSeenCards('clasico')('🎯 RETO: baila')).toBe(false);
    expect(JSON.parse(localStorage.getItem('beep_seen_cards')!).megamix).toHaveLength(1);
  });

  it('la partida siguiente empieza por cartas nuevas sin romper la alternancia', () => {
    const first = getStructuredMegamix(300, 4);
    const seenKeys = new Set(first.filter((c) => !isTrigger(c)).map(cardKey));
    const second = getStructuredMegamix(300, 4, { seen: (c) => seenKeys.has(cardKey(c)) });

    const repeated = second.filter((c) => !isTrigger(c) && seenKeys.has(cardKey(c)));
    expect(repeated.length).toBeLessThan(5);
    expect(evenSlots(second).filter((c) => !isIndividualCard(c))).toEqual([]);
  });

  it('un pool pequeño saca todas sus cartas nuevas antes de repetir una vista', () => {
    const pool = MEGAMIX_SPAIN_INDIVIDUAL;
    const seenHalf = new Set(pool.slice(0, 26).map(cardKey));
    const deck = getStructuredMegamix(400, 4, {
      individualKeys: [],
      extraIndividual: { megamixEspañaIndividual: pool },
      seen: (c) => seenHalf.has(cardKey(c)),
    });
    const fromPool = deck.filter((c) => pool.includes(c));
    const firstStale = fromPool.findIndex((c) => seenHalf.has(cardKey(c)));
    expect(firstStale).toBe(26);
  });
});

// ─── Consumo con cabeza ──────────────────────────────────────────────────────

describe('capDrinking', () => {
  it.each([
    ['Si no lo haces, bebe el vaso entero.', 'Si no lo haces, bebe 3 tragos.'],
    ['contar un secreto o beber un vaso entero', 'contar un secreto o beber 3 tragos'],
    ['Si no, bebe fondo.', 'Si no, bebe 4 tragos.'],
    ['El que pierda, fondo.', 'El que pierda, 4 tragos.'],
    ['Si te niegas, fondo blanco de tu bebida.', 'Si te niegas, 4 tragos.'],
    ['Ves a tu ex. Fondo por despecho.', 'Ves a tu ex. 4 tragos por despecho.'],
    ['Limpiar una casa a fondo.', 'Limpiar una casa a fondo.'],
  ])('%s', (card, expected) => {
    expect(capDrinking(card)).toBe(expected);
  });

  it('el mazo de Megamix no tiene vasos enteros, fondos ni retos peligrosos', () => {
    const big = getStructuredMegamix(6000, 6, {
      extraGeneral: MEGAMIX_EXTRA_GENERAL,
      extraIndividual: MEGAMIX_EXTRA_INDIVIDUAL,
      withoutFiller: true,
    });
    const bad = big.filter((c) =>
      /vaso entero|bebe fondo|¡fondo!|, fondo\.|cara metida en|aguanta la respiración|balcón o ventana|mezclar? tres líquidos/i.test(c)
    );
    expect(bad).toEqual([]);
  });

  it('los retos del torneo tampoco', () => {
    expect(DUEL_POOL.filter((c) => /vaso entero|cara metida en|¡fondo!/i.test(c))).toEqual([]);
  });
});

// ─── normalizeCardText ───────────────────────────────────────────────────────

describe('normalizeCardText', () => {
  it.each([
    ['🎯 🎯 RETO: baila', '🎯 RETO: baila'],
    ['🗳️ 🗳️ ¿Quién es más probable…?', '🗳️ ¿Quién es más probable…?'],
    ['🎯 ⏳ 10 SEGUNDOS: di 5 frutas', '⏳ 10 SEGUNDOS: di 5 frutas'],
    ['🙈 Yo nunca he mentido', '🙈 Yo nunca he mentido'],
    ['🇪🇸 Si has comido paella, bebe', '🇪🇸 Si has comido paella, bebe'],
    ['TRIGGER:IMPOSTOR', 'TRIGGER:IMPOSTOR'],
  ])('%s', (card, expected) => {
    expect(normalizeCardText(card)).toBe(expected);
  });
});

// ─── interleaveTasteCards ────────────────────────────────────────────────────

describe('interleaveTasteCards', () => {
  const deck = Array.from({ length: 48 }, (_, i) => `c${i}`);

  it('sin cartas de gustos devuelve el mazo tal cual', () => {
    expect(interleaveTasteCards(deck, [])).toBe(deck);
  });

  it('mete una carta de gustos cada 16 sin cambiar el tamaño del mazo', () => {
    const out = interleaveTasteCards(deck, ['gusto']);
    expect(out).toHaveLength(48);
    expect(out[16]).toBe('gusto');
    expect(out[32]).toBe('gusto');
  });

  it('no rompe la alternancia individual / general ni pisa eventos', () => {
    const structured = getStructuredMegamix(400, 4);
    const tastes = ['🎯 GUSTOS: reto para Ana', '🙌 GUSTOS: todos señalan a Ana'];
    const out = interleaveTasteCards(structured, tastes);
    expect(out).toHaveLength(structured.length);
    expect(out.filter((c) => tastes.includes(c)).length).toBeGreaterThan(15);
    out.forEach((card, i) => {
      if (isIndividualCard(structured[i]) !== isIndividualCard(card)) {
        throw new Error(`hueco ${i} cambió de lado: ${structured[i]} → ${card}`);
      }
      if (structured[i].startsWith('TRIGGER:')) expect(card).toBe(structured[i]);
    });
  });
});

// ─── useGameContent (mazo real que ve la partida) ────────────────────────────

describe('useGameContent', () => {
  beforeEach(() => localStorage.clear());

  async function loadDeck(mode: 'megamix' | 'clasico' | 'picante') {
    const { result } = renderHook(() => useGameContent(mode, 0, 'Ana', 4, []));
    await waitFor(() => expect(result.current.content.length).toBeGreaterThan(0));
    return result.current.content;
  }

  it('megamix: no baraja el mazo estructurado (antes se perdía la alternancia)', async () => {
    const deck = (await loadDeck('megamix')).slice(0, 400);
    expect(evenSlots(deck).filter((c) => !isIndividualCard(c))).toEqual([]);
    expect(oddSlots(deck).filter(isIndividualCard)).toEqual([]);
  });

  it('clásico: tampoco baraja', async () => {
    const deck = (await loadDeck('clasico')).slice(0, 400);
    expect(evenSlots(deck).filter((c) => !isIndividualCard(c))).toEqual([]);
    expect(oddSlots(deck).filter(isIndividualCard)).toEqual([]);
  });

  it('no mete objetos crudos como cartas', async () => {
    expect(await loadDeck('megamix')).not.toContain('[object Object]');
  });

  it('las cartas con -3 votos o menos dejan de salir en megamix', async () => {
    const first = await loadDeck('megamix');
    const victim = first.find((c) => c.startsWith('🙈'))!;
    localStorage.setItem('fiesta-party-votes', JSON.stringify({ megamix: { [victim]: -3 } }));
    expect(await loadDeck('megamix')).not.toContain(victim);
  });

  it('los modos sueltos siguen barajados', async () => {
    const a = await loadDeck('picante');
    const b = await loadDeck('picante');
    expect(a.slice(0, 20)).not.toEqual(b.slice(0, 20));
  });
});

// ─── Megamix experience ──────────────────────────────────────────────────────
describe('Megamix experience', () => {
  it('progresa por las cuatro fases de la partida, por rondas', () => {
    // 4 jugadores: 8 cartas por ronda. Previa desde la ronda 4, locura desde
    // la 8 y final desde la 13.
    expect(getMegamixPhase(0, 4)).toBe('Calienta motores');
    expect(getMegamixPhase(30, 4)).toBe('La previa se anima');
    expect(getMegamixPhase(70, 4)).toBe('Modo locura');
    expect(getMegamixPhase(120, 4)).toBe('Final épico');
    // Con 8 jugadores la misma carta está en una fase más temprana.
    expect(getMegamixPhase(70, 8)).toBe('La previa se anima');
  });

  it('los eventos al azar no saltan pegados a otro evento', () => {
    expect(canFireRuntimeEvent(10, 8)).toBe(false);
    expect(canFireRuntimeEvent(12, 8)).toBe(true);
  });

  it('devuelve pistas sin revelar el texto completo', () => {
    expect(getMegamixMystery('⚔️ DUELO: piedra contra papel')).toMatchObject({ label: 'Duelo' });
    expect(getMegamixMystery('TRIGGER:IMPOSTOR')).toMatchObject({ label: 'Sospecha' });
  });

  it('transforma consecuencias de alcohol a puntos', () => {
    const transformed = transformCardForNoAlcohol('🍻 Bebe 2 tragos si fallas');
    expect(transformed).not.toMatch(/🍻|bebes? 2|tragos/i);
  });

  it.each([
    ['Bebe 2 tragos si fallas', 'Pierde 2 puntos si fallas'],
    ['Los demás deben beber 1.', 'Los demás deben perder 1 punto.'],
    ['Si fallas, bebéis 3.', 'Si fallas, perdéis 3 puntos.'],
    ['El primero reparte 2.', 'El primero quita 2 puntos.'],
    ['reparte un trago', 'quita un punto'],
    ['si uno bebe, el otro también bebe', 'si uno pierde puntos, el otro también pierde puntos'],
    ['🍻 BRINDIS REVUELTO', '⭐ BRINDIS REVUELTO'],
    ['pensad en una bebida', 'pensad en una bebida'],
  ])('sin alcohol: %s', (card, expected) => {
    expect(transformCardForNoAlcohol(card)).toBe(expected);
  });

  it('el núcleo de Megamix cae cada carta en su lado y sin duplicados', () => {
    for (const [key, cards] of Object.entries(MEGAMIX_EXTRA_GENERAL)) {
      expect(cards.filter(isIndividualCard), key).toEqual([]);
    }
    for (const [key, cards] of Object.entries(MEGAMIX_EXTRA_INDIVIDUAL)) {
      expect(cards.filter((c) => !isIndividualCard(c)), key).toEqual([]);
    }
    const all = [...Object.values(MEGAMIX_EXTRA_GENERAL), ...Object.values(MEGAMIX_EXTRA_INDIVIDUAL)].flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('el núcleo de Megamix tiene peso propio y sale en la partida', () => {
    // 2000 cartas: con 400, un tipo de peso 1 sale ~4 veces y a veces ninguna.
    const deck = getStructuredMegamix(2000, 4, {
      extraGeneral: MEGAMIX_EXTRA_GENERAL,
      extraIndividual: MEGAMIX_EXTRA_INDIVIDUAL,
      withoutFiller: true,
    });
    for (const [key, cards] of [
      ...Object.entries(MEGAMIX_EXTRA_GENERAL),
      ...Object.entries(MEGAMIX_EXTRA_INDIVIDUAL),
    ]) {
      expect(GENERAL_TYPE_WEIGHTS[key] ?? INDIVIDUAL_TYPE_WEIGHTS[key], key).toBeGreaterThan(0);
      expect(deck.some((c) => cards.includes(c)), key).toBe(true);
    }
  });

  it('las cartas españolas están en el lado correcto (general / individual)', () => {
    expect(MEGAMIX_SPAIN_GENERAL.filter(isIndividualCard)).toEqual([]);
    expect(MEGAMIX_SPAIN_INDIVIDUAL.filter((c) => !isIndividualCard(c))).toEqual([]);
  });
});
