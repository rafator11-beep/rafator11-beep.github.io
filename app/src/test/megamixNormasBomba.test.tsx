import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  addInfraction,
  cleanNormaText,
  normaVerdict,
} from '@/utils/megamixNormas';
import { bombTickInterval, isBombCard, randomBombDuration, BOMB_MIN_MS, BOMB_MAX_MS } from '@/utils/megamixBomb';
import { NormaBanner } from '@/components/game/party/NormaBanner';
import { NormaVerdict } from '@/components/game/party/NormaVerdict';
import { BombOverlay } from '@/components/game/party/BombOverlay';
import { MEGAMIX_BOMBA } from '@/data/megamixCore';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Luis' },
  { id: 'c', name: 'Marta' },
] as never[];

describe('normas: infracciones y veredicto', () => {
  it('suma infracciones sin mutar', () => {
    const start = {};
    const once = addInfraction(start, 'a');
    expect(addInfraction(once, 'a')).toEqual({ a: 2 });
    expect(start).toEqual({});
  });

  it('el que más ha caído bebe lo que ha caído (entre 2 y 5) y los limpios reparten', () => {
    const v = normaVerdict({ a: 3, b: 1 }, ['a', 'b', 'c']);
    expect(v).toMatchObject({ worstIds: ['a'], worstCount: 3, drinks: 3, cleanIds: ['c'], nobody: false });
    expect(normaVerdict({ a: 9 }, ['a']).drinks).toBe(5);
    expect(normaVerdict({ a: 1 }, ['a']).drinks).toBe(2);
  });

  it('empate en lo más alto: beben los dos', () => {
    expect(normaVerdict({ a: 2, b: 2 }, ['a', 'b']).worstIds).toEqual(['a', 'b']);
  });

  it('si nadie ha caído, lo dice (bebe el capitán)', () => {
    expect(normaVerdict({}, ['a', 'b']).nobody).toBe(true);
  });

  it('limpia los prefijos de la norma', () => {
    expect(cleanNormaText('📜 NORMA: Prohibido decir “sí”')).toBe('Prohibido decir “sí”');
    expect(cleanNormaText('NUEVA NORMA: T-Rex')).toBe('T-Rex');
  });

  it('el banner deja elegir a quién se ha pillado', () => {
    const onReport = vi.fn();
    render(<NormaBanner text="T-Rex" turnsLeft={6} players={players} infractions={{}} onReport={onReport} />);
    fireEvent.click(screen.getByText('🚨 ¡Pillado!'));
    fireEvent.click(screen.getByText('Luis'));
    expect(onReport).toHaveBeenCalledWith('b');
  });

  it('el veredicto nombra al que más ha caído', () => {
    render(
      <NormaVerdict
        result={{ text: 'T-Rex', infractions: { c: 2 } }}
        players={players}
        captainName="Ana"
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Marta')).toBeTruthy();
    expect(screen.getByText(/bebe 2/)).toBeTruthy();
  });
});

describe('la bomba', () => {
  afterEach(() => vi.useRealTimers());

  it('dura entre el mínimo y el máximo', () => {
    expect(randomBombDuration(() => 0)).toBe(BOMB_MIN_MS);
    expect(randomBombDuration(() => 1)).toBe(BOMB_MAX_MS);
  });

  it('el tic-tac se acelera', () => {
    const steps = [0, 0.6, 0.9, 0.99].map(bombTickInterval);
    expect([...steps].sort((a, b) => b - a)).toEqual(steps);
    expect(steps[0]).toBeGreaterThan(steps[3]);
  });

  it('todas las cartas de bomba se detectan y explican el botón', () => {
    for (const card of MEGAMIX_BOMBA) {
      expect(isBombCard(card)).toBe(true);
      expect(card).toMatch(/ACTIVAR/);
    }
  });

  it('explota sola y no se puede cerrar mientras hace tic-tac', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<BombOverlay open onClose={onClose} />);
    expect(screen.queryByRole('button')).toBeNull();
    act(() => vi.advanceTimersByTime(BOMB_MAX_MS + 2000));
    expect(screen.getByText('¡BUM!')).toBeTruthy();
    fireEvent.click(screen.getByText('Seguir jugando'));
    expect(onClose).toHaveBeenCalled();
  });
});
