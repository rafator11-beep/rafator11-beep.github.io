import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { catchInfected, cureOutcome, tickVirusesForRound } from '@/utils/megamixViruses';
import { VirusBanner } from '@/components/game/party/VirusBanner';
import { VirusRoundReport } from '@/components/game/party/VirusRoundReport';
import type { PlayerVirus } from '@/types/game';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Luis' },
] as never[];

const v = (playerId: string, turnsRemaining: number, caught?: number): PlayerVirus => ({
  playerId,
  virusName: 'SAMURAI',
  virusDescription: 'Bebe con una mano en la cintura',
  turnsRemaining,
  caught,
});

describe('virus por rondas', () => {
  it('al acabar la ronda se descuenta una ronda y se separan los curados', () => {
    const r = tickVirusesForRound([v('a', 3), v('b', 1)], 4);
    expect(r.round).toBe(4);
    expect(r.remaining).toEqual([v('a', 2)]);
    expect(r.cured.map((x) => x.playerId)).toEqual(['b']);
  });

  it('pillar al infectado suma sin tocar a los demás', () => {
    const next = catchInfected([v('a', 2), v('b', 2)], 'a');
    expect(next[0].caught).toBe(1);
    expect(next[1].caught).toBeUndefined();
  });

  it('al curarse: bebe lo que le pillaron (máx. 5) o reparte 2 si fue limpio', () => {
    expect(cureOutcome(v('a', 0, 3))).toEqual({ kind: 'bebe', drinks: 3 });
    expect(cureOutcome(v('a', 0, 9))).toEqual({ kind: 'bebe', drinks: 5 });
    expect(cureOutcome(v('a', 0))).toEqual({ kind: 'reparte', drinks: 2 });
  });

  it('la franja enseña las rondas que quedan y deja pillar', () => {
    const onCatch = vi.fn();
    render(<VirusBanner viruses={[v('a', 2)]} players={players} onCatch={onCatch} />);
    expect(screen.getByText('2 rondas')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Pillado: Ana'));
    expect(onCatch).toHaveBeenCalledWith('a');
  });

  it('el parte de fin de ronda dice quién sigue y quién se cura', () => {
    render(
      <VirusRoundReport
        report={{ round: 3, remaining: [v('a', 1)], cured: [v('b', 0, 2)] }}
        players={players}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Le queda 1 ronda/)).toBeTruthy();
    expect(screen.getByText(/Luis se cura de SAMURAI/)).toBeTruthy();
    expect(screen.getByText(/bebe 2/)).toBeTruthy();
  });
});
