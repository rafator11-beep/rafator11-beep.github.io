import { describe, it, expect } from 'vitest';
import { triggerIntervals } from '@/config/cardWeights';
import { getMegamixPhase, paceRound } from '@/utils/megamixExperience';
import { createTournament, matchesPerTrigger, nextMatch, recordWinner } from '@/utils/liveTournament';
import { pickDisplayPlayer } from '@/components/game/CardDisplay';
import { geminiEnrichChallenge } from '@/lib/partyDirector';

describe('fiesta de 24 personas', () => {
  it('el ritmo de eventos y fases no se alarga más allá de una mesa de 8', () => {
    expect(triggerIntervals(24)).toEqual(triggerIntervals(8));
    expect(getMegamixPhase(200, 24)).toBe(getMegamixPhase(200, 8));
    expect(paceRound(160, 24)).toBe(11);
    // Con 24 se llega al final épico en una partida normal (~200 cartas).
    expect(getMegamixPhase(200, 24)).toBe('Final épico');
  });

  it('el torneo con 24: tres llaves, Gran Final, repesca y 3 duelos por parada', () => {
    const pick = () => 'reto';
    let t = createTournament(Array.from({ length: 24 }, (_, i) => `p${i}`), 1, pick);
    expect(t.brackets.filter((b) => b.kind === 'main')).toHaveLength(3);
    expect(matchesPerTrigger(24)).toBe(3);
    for (let next = nextMatch(t), guard = 0; next && guard < 100; next = nextMatch(t), guard++) {
      t = recordWinner(t, next.match.id, next.match.p1, pick).tournament;
    }
    expect(t.finished).toBe(true);
    expect(t.champion).toBeTruthy();
    expect(t.brackets.some((b) => b.kind === 'final')).toBe(true);
  });
});

describe('a quién se nombra en la carta', () => {
  const ana = { id: 'a', name: 'asda' };
  const ana2 = { id: 'b', name: 'ASDASD' };
  const players = [ana, ana2];

  it('un nombre que está dentro de otro no cuenta ("asda" dentro de "ASDASD")', () => {
    expect(pickDisplayPlayer('ASDASD, haz 10 flexiones', players, ana)).toBe(ana2);
  });

  it('si se nombra al de turno, sale el de turno aunque se nombre a otro', () => {
    expect(pickDisplayPlayer('ASDASD contra asda: pulso', players, ana2)).toBe(ana2);
  });

  it('si no se nombra a nadie, sale el de turno', () => {
    expect(pickDisplayPlayer('Todos a la vez: señalad', players, ana2)).toBe(ana2);
  });
});

describe('la carta no mezcla frases de otras cartas', () => {
  it('el enriquecido solo rellena huecos, sin recuerdos ni piques pegados', async () => {
    const card = '⚔️ Duelo de miradas. El primero que parpadee, bebe.';
    for (let i = 0; i < 20; i++) {
      const out = await geminiEnrichChallenge(
        card,
        'Ana: 5 tragos bebidos, 3 retos fallados | Luis: recién empezando',
        ['Ana', 'Luis'],
        'Ana',
        '🔁 Luis ya rajó en «RETO: algo», a ver ahora.'
      );
      expect(out).toBe(card);
    }
  });
});
