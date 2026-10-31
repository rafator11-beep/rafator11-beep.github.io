import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getStructuredMegamix, isIndividualCard } from '@/data/gameContent';
import { interleaveTasteCards, useGameContent } from '@/hooks/game/useGameContent';

vi.mock('@/services/customThemeService', () => ({ fetchThemeCards: vi.fn(async () => []) }));

const CLASICO_OPTS = {
  generalKeys: ['yoNunca', 'picante', 'enLaCama', 'masProbable', 'pacovers', 'espana'],
  individualKeys: ['retos', 'categorias', 'clasico'],
};

const isTrigger = (c: string) => c.startsWith('TRIGGER:') || c.startsWith('📜');
const share = (cards: string[], pred: (c: string) => boolean) => cards.filter(pred).length / Math.max(1, cards.length);
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
  ])('individual: %s', card => {
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
  ])('general: %s', card => {
    expect(isIndividualCard(card)).toBe(false);
  });
});

// ─── getStructuredMegamix ────────────────────────────────────────────────────

describe('getStructuredMegamix', () => {
  const deck = getStructuredMegamix(500, 5);

  it('devuelve exactamente las cartas pedidas', () => {
    expect(deck).toHaveLength(500);
    expect(deck.every(c => typeof c === 'string' && c.trim().length > 0)).toBe(true);
    expect(deck).not.toContain('[object Object]');
  });

  it('mantiene los triggers repetidos (antes se deduplicaban a 1 de cada)', () => {
    // Impostor en cada múltiplo de 20 → 24 en 500 cartas
    expect(deck.filter(c => c === 'TRIGGER:IMPOSTOR')).toHaveLength(24);
    expect(deck.filter(c => c === 'TRIGGER:TORNEO' || c === 'TRIGGER:MEGATORNEO').length).toBeGreaterThan(4);
  });

  it('alterna general / individual', () => {
    expect(share(oddSlots(deck), isIndividualCard)).toBeGreaterThan(0.9);
    // Margen: algunas cartas de picante/humor negro llevan {player} y cuentan como individuales
    expect(share(evenSlots(deck), c => !isIndividualCard(c))).toBeGreaterThan(0.75);
  });

  it('respeta los tipos permitidos (modo clásico)', () => {
    const clasico = getStructuredMegamix(400, 4, CLASICO_OPTS);
    for (const banned of ['🎭', '⚔️', '⚡', '💀']) {
      expect(clasico.filter(c => c.startsWith(banned))).toEqual([]);
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
    expect(big.filter(c => /yo nunca\.{3}\s*yo nunca/i.test(c))).toEqual([]);
  });

  it('mezcla los pools extra como un tipo más', () => {
    const extra = getStructuredMegamix(600, 4, {
      generalKeys: ['yoNunca'],
      extraGeneral: { customRetos: ['CARTA EXTRA DE PRUEBA'] },
    });
    expect(extra).toContain('CARTA EXTRA DE PRUEBA');
  });
});

// ─── interleaveTasteCards ────────────────────────────────────────────────────

describe('interleaveTasteCards', () => {
  const deck = Array.from({ length: 48 }, (_, i) => `c${i}`);

  it('sin cartas de gustos devuelve el mazo tal cual', () => {
    expect(interleaveTasteCards(deck, [])).toBe(deck);
  });

  it('mete una carta de gustos cada 16 sin perder ninguna del mazo', () => {
    const out = interleaveTasteCards(deck, ['gusto']);
    expect(out).toHaveLength(51);
    expect(out[16]).toBe('gusto');
    expect(out[33]).toBe('gusto');
    expect(out.filter(c => c !== 'gusto')).toEqual(deck);
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
    expect(deck[20]).toBe('TRIGGER:IMPOSTOR');
    expect(share(oddSlots(deck), isIndividualCard)).toBeGreaterThan(0.9);
  });

  it('clásico: tampoco baraja', async () => {
    const deck = (await loadDeck('clasico')).slice(0, 400);
    expect(share(oddSlots(deck), isIndividualCard)).toBeGreaterThan(0.85);
  });

  it('no mete objetos crudos como cartas', async () => {
    expect(await loadDeck('megamix')).not.toContain('[object Object]');
  });

  it('las cartas con -3 votos o menos dejan de salir en megamix', async () => {
    const first = await loadDeck('megamix');
    const victim = first.find(c => c.startsWith('🙈'))!;
    localStorage.setItem('fiesta-party-votes', JSON.stringify({ megamix: { [victim]: -3 } }));
    expect(await loadDeck('megamix')).not.toContain(victim);
  });

  it('los modos sueltos siguen barajados', async () => {
    const a = await loadDeck('picante');
    const b = await loadDeck('picante');
    expect(a.slice(0, 20)).not.toEqual(b.slice(0, 20));
  });
});
