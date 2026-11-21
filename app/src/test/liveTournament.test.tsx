import { describe, it, expect, vi } from 'vitest';
import {
  createTournament,
  nextMatch,
  recordWinner,
  roundName,
  matchesPerTrigger,
  type LiveTournament,
  type TournamentEvent,
} from '@/utils/liveTournament';

const pick = (kind: string) => `reto-${kind}`;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
const noShuffle = () => 0.999999;

// Juega el torneo entero; gana siempre p1 salvo que se diga otra cosa.
function playAll(t: LiveTournament, choose = (m: { p1: string; p2: string }) => m.p1) {
  const order: string[] = [];
  const events: TournamentEvent[] = [];
  let guard = 0;
  let cur = t;
  for (let next = nextMatch(cur); next && guard < 200; next = nextMatch(cur), guard++) {
    order.push(next.bracket.kind);
    const res = recordWinner(cur, next.match.id, choose(next.match), pick);
    cur = res.tournament;
    events.push(...res.events);
  }
  return { t: cur, order, events };
}

describe('torneo vivo', () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 9, 12, 16])('con %i jugadores termina, con campeón y n-1 duelos en las llaves', (n) => {
    const { t, events } = playAll(createTournament(ids(n), 1, pick));
    expect(t.finished).toBe(true);
    expect(t.champion).toBeTruthy();
    const mainAndFinal = t.brackets.filter((b) => b.kind !== 'repesca');
    const duels = mainAndFinal.reduce((s, b) => s + b.matches.length, 0);
    expect(duels).toBe(n - 1);
    expect(events.filter((e) => e.type === 'tournament_champion')).toHaveLength(1);
  });

  it('hasta 8 jugadores hay una llave; con 12, dos llaves y Gran Final', () => {
    expect(createTournament(ids(8), 1, pick).brackets.filter((b) => b.kind === 'main')).toHaveLength(1);
    const big = playAll(createTournament(ids(12), 1, pick)).t;
    expect(big.brackets.filter((b) => b.kind === 'main').map((b) => b.name)).toEqual(['Llave A', 'Llave B']);
    expect(big.brackets.some((b) => b.kind === 'final')).toBe(true);
  });

  it('los que pierden en la principal juegan la repesca a la vez, con otros retos', () => {
    const { t, order } = playAll(createTournament(ids(8), 1, pick, noShuffle));
    const repesca = t.brackets.find((b) => b.kind === 'repesca')!;
    expect(repesca.matches.length).toBe(6); // 7 eliminados → 6 duelos
    expect(repesca.matches.every((m) => m.reto === 'reto-repesca')).toBe(true);
    expect(repesca.champion).toBeTruthy();
    // La repesca empieza antes de que acabe la principal (se alternan).
    const firstRepesca = order.indexOf('repesca');
    const lastMain = order.lastIndexOf('main');
    expect(firstRepesca).toBeGreaterThan(-1);
    expect(firstRepesca).toBeLessThan(lastMain);
  });

  it('el que pierde en la principal no vuelve a jugar en ella', () => {
    const t0 = createTournament(ids(8), 1, pick);
    const first = nextMatch(t0)!;
    const { tournament } = recordWinner(t0, first.match.id, first.match.p2, pick);
    const main = tournament.brackets.find((b) => b.kind === 'main')!;
    const later = main.matches.filter((m) => m.id !== first.match.id);
    expect(later.some((m) => m.p1 === first.match.p1 || m.p2 === first.match.p1)).toBe(false);
    expect(tournament.brackets.find((b) => b.kind === 'repesca')!.queues[0]).toContain(first.match.p1);
  });

  it('no acepta un ganador que no juega ese duelo ni un duelo ya jugado', () => {
    const t0 = createTournament(ids(4), 1, pick);
    const { match } = nextMatch(t0)!;
    expect(recordWinner(t0, match.id, 'intruso', pick).tournament).toBe(t0);
    const once = recordWinner(t0, match.id, match.p1, pick).tournament;
    expect(recordWinner(once, match.id, match.p2, pick).tournament).toBe(once);
  });

  it('avisa del campeón de cada llave y del torneo', () => {
    const { events } = playAll(createTournament(ids(6), 1, pick));
    expect(events.some((e) => e.type === 'bracket_champion' && e.kind === 'repesca')).toBe(true);
    expect(events.some((e) => e.type === 'tournament_champion')).toBe(true);
  });

  it('nombra las rondas según el tamaño de la llave', () => {
    const t = createTournament(ids(8), 1, pick);
    const main = t.brackets[0];
    expect([0, 1, 2].map((l) => roundName(main, l))).toEqual(['Cuartos', 'Semifinal', 'Final']);
    expect(roundName({ ...main, size: 4 }, 0)).toBe('Semifinal');
  });

  it('con más gente se juegan más duelos cada vez', () => {
    expect(matchesPerTrigger(4)).toBe(1);
    expect(matchesPerTrigger(8)).toBe(2);
  });
});

// ─── Pantalla del duelo ──────────────────────────────────────────────────────
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement, useState } from 'react';
import { LiveTournamentOverlay } from '@/components/game/party/LiveTournamentOverlay';

describe('LiveTournamentOverlay', () => {
  const players = ids(4).map((id, i) => ({ id, name: ['Ana', 'Luis', 'Marta', 'Pablo'][i] })) as never[];

  function Host({ stop, onDone }: { stop: number; onDone: () => void }) {
    const [t, setT] = useState(() => createTournament(ids(4), 1, () => '{player} vs {player2}: pulso', noShuffle));
    const [left, setLeft] = useState(stop);
    return createElement(LiveTournamentOverlay, {
      tournament: t,
      players,
      matchesLeft: left,
      onResult: (matchId: string, winnerId: string) => {
        const r = recordWinner(t, matchId, winnerId, () => 'reto');
        setT(r.tournament);
        setLeft((n) => n - 1);
        return r.events;
      },
      onDone,
    });
  }

  it('enseña el duelo con nombres, marca ganador y vuelve a las cartas al acabar la parada', () => {
    const onDone = vi.fn();
    render(createElement(Host, { stop: 1, onDone }));
    expect(screen.getByText(/pulso/).textContent).not.toMatch(/\{player/);
    const [first] = screen.getAllByRole('button', { name: /^🏅 Gana/ });
    fireEvent.click(first);
    expect(screen.getByText(/bebe 2/)).toBeTruthy();
    fireEvent.click(screen.getByText('Volver a las cartas'));
    expect(onDone).toHaveBeenCalled();
  });

  it('con dos duelos por parada ofrece el siguiente', () => {
    render(createElement(Host, { stop: 2, onDone: () => {} }));
    fireEvent.click(screen.getAllByRole('button', { name: /^🏅 Gana/ })[0]);
    fireEvent.click(screen.getByText('⚔️ Siguiente duelo'));
    expect(screen.getAllByRole('button', { name: /^🏅 Gana/ })).toHaveLength(2);
  });

  it('en solo lectura no deja elegir ganador', () => {
    const t = createTournament(ids(4), 1, pick);
    render(
      createElement(LiveTournamentOverlay, {
        readOnly: true,
        tournament: t,
        players,
        matchesLeft: 0,
        onResult: () => [],
        onDone: () => {},
      })
    );
    expect(screen.queryByRole('button', { name: /^🏅 Gana/ })).toBeNull();
  });
});
