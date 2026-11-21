import type { PlayerVirus } from '@/types/game';

// Virus de Megamix: duran RONDAS (antes se descontaban en cada carta y un
// "3T" duraba 3 cartas, menos de media ronda). Mientras dura, cualquiera
// puede pillar al infectado incumpliéndolo; al acabar cada ronda sale el
// parte: quién sigue infectado y quién se cura, con su castigo o premio.

export interface VirusRoundReport {
  round: number;
  /** Siguen infectados, ya con una ronda menos. */
  remaining: PlayerVirus[];
  /** Se curan al acabar esta ronda. */
  cured: PlayerVirus[];
}

export function tickVirusesForRound(viruses: PlayerVirus[], round: number): VirusRoundReport {
  const next = viruses.map((v) => ({ ...v, turnsRemaining: v.turnsRemaining - 1 }));
  return {
    round,
    remaining: next.filter((v) => v.turnsRemaining > 0),
    cured: next.filter((v) => v.turnsRemaining <= 0),
  };
}

export function catchInfected(viruses: PlayerVirus[], playerId: string): PlayerVirus[] {
  return viruses.map((v) => (v.playerId === playerId ? { ...v, caught: (v.caught ?? 0) + 1 } : v));
}

/** Al curarse: si le pillaron, bebe esas veces (máx. 5); si lo cumplió limpio, reparte 2. */
export function cureOutcome(v: PlayerVirus): { kind: 'bebe' | 'reparte'; drinks: number } {
  const caught = v.caught ?? 0;
  return caught > 0 ? { kind: 'bebe', drinks: Math.min(5, caught) } : { kind: 'reparte', drinks: 2 };
}

export const roundsLabel = (n: number) => `${n} ${n === 1 ? 'ronda' : 'rondas'}`;
