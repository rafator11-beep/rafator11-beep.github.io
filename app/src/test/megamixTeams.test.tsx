import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { makeTeams, teamCountFor, pickTeamChallenge, TEAM_CHALLENGES } from '@/utils/megamixTeams';
import { TeamBattleOverlay } from '@/components/game/party/TeamBattleOverlay';
import { getStructuredMegamix } from '@/data/gameContent';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe('guerra de equipos', () => {
  it('más equipos cuanta más gente', () => {
    expect(teamCountFor(4)).toBe(2);
    expect(teamCountFor(12)).toBe(3);
    expect(teamCountFor(24)).toBe(4);
  });

  it('reparte a todos, sin repetir, y equilibrado', () => {
    for (const n of [4, 7, 12, 24, 30]) {
      const teams = makeTeams(ids(n));
      const all = teams.flatMap((t) => t.playerIds);
      expect(all.sort()).toEqual(ids(n).sort());
      const sizes = teams.map((t) => t.playerIds.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(new Set(teams.map((t) => t.name)).size).toBe(teams.length);
    }
  });

  it('otra prueba nunca repite la que había', () => {
    for (const c of TEAM_CHALLENGES) expect(pickTeamChallenge(c)).not.toBe(c);
  });

  it('sale en el mazo con 4 o más jugadores y no con 3', () => {
    expect(getStructuredMegamix(1500, 6)).toContain('TRIGGER:EQUIPOS');
    expect(getStructuredMegamix(1500, 3)).not.toContain('TRIGGER:EQUIPOS');
  });

  it('se marca el ganador y dice quién bebe', () => {
    const players = ids(6).map((id) => ({ id, name: id.toUpperCase() })) as never[];
    const onDone = vi.fn();
    render(<TeamBattleOverlay open players={players} onDone={onDone} />);
    const winButtons = screen.getAllByRole('button', { name: /^🏆 / });
    expect(winButtons).toHaveLength(2);
    fireEvent.click(winButtons[0]);
    expect(screen.getByText(/Reparten 1 cada uno/)).toBeTruthy();
    expect(screen.getByText(/bebe 2 cada uno/)).toBeTruthy();
    fireEvent.click(screen.getByText('Volver a las cartas'));
    expect(onDone).toHaveBeenCalled();
  });
});
