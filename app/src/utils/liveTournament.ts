// Torneo vivo de Megamix: dura toda la partida y avanza a trozos, uno o dos
// duelos cada vez que sale TRIGGER:TORNEO en el mazo.
//
// - Hasta 8 jugadores: una llave. Con más: varias (Llave A, B…), repartidas
//   a partes iguales, y una Gran Final entre sus campeones.
// - REPESCA: quien pierde en una llave principal entra en la repesca, que
//   juega a otra cosa (otro pool de retos). Se emparejan en cuanto hay dos
//   esperando, así que la repesca juega sus cuartos mientras la principal
//   sigue con los suyos.
// - Cada ronda se empareja sola: no hace falta conocer el cuadro entero de
//   antemano y los impares pasan de ronda (bye) cuando ya no puede llegarles
//   rival.
// Todo son funciones puras sobre ids de jugador; el reto se elige con la
// función que se pasa (para poder testearlo sin azar).

export type BracketKind = 'main' | 'repesca' | 'final';

export interface TMatch {
  id: string;
  level: number;
  p1: string;
  p2: string;
  /** Plantilla con {player} y {player2}. */
  reto: string;
  winner?: string;
}

export interface TBracket {
  id: string;
  name: string;
  kind: BracketKind;
  /** Participantes previstos: sirve para nombrar las rondas (cuartos, semis…). */
  size: number;
  /** queues[nivel] = jugadores esperando rival en esa ronda. */
  queues: string[][];
  matches: TMatch[];
  /** Aún pueden llegar jugadores a la primera ronda (repesca). */
  open: boolean;
  done: boolean;
  champion?: string;
}

export interface LiveTournament {
  number: number;
  brackets: TBracket[];
  /** Por qué llave seguir buscando duelo: así se van alternando. */
  cursor: number;
  champion?: string;
  finished: boolean;
}

export type TournamentEvent =
  | { type: 'bracket_champion'; bracketName: string; kind: BracketKind; playerId: string }
  | { type: 'tournament_champion'; playerId: string };

export type PickReto = (kind: BracketKind) => string;

const MAX_PER_BRACKET = 8;
const LETTERS = 'ABCDEFGH';

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clone = (t: LiveTournament): LiveTournament => JSON.parse(JSON.stringify(t));
const pending = (b: TBracket) => b.matches.filter((m) => !m.winner);
const waiting = (b: TBracket) => b.queues.reduce((n, q) => n + q.length, 0);

export function createTournament(
  playerIds: string[],
  number: number,
  pickReto: PickReto,
  rand: () => number = Math.random
): LiveTournament {
  const ids = shuffle(playerIds, rand);
  const groupCount = Math.max(1, Math.ceil(ids.length / MAX_PER_BRACKET));
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  ids.forEach((id, i) => groups[i % groupCount].push(id));

  const brackets: TBracket[] = groups.map((g, i) => ({
    id: `main${i}`,
    name: groupCount === 1 ? 'Llave principal' : `Llave ${LETTERS[i]}`,
    kind: 'main',
    size: g.length,
    queues: [[...g]],
    matches: [],
    open: false,
    done: false,
  }));
  // Con menos de 4 no hay eliminados suficientes para que la repesca tenga gracia.
  if (ids.length >= 4) {
    brackets.push({
      id: 'repesca',
      name: 'Repesca',
      kind: 'repesca',
      size: ids.length - groupCount,
      queues: [[]],
      matches: [],
      open: true,
      done: false,
    });
  }
  return settle({ number, brackets, cursor: 0, finished: false }, pickReto);
}

function settleBracket(b: TBracket, pickReto: PickReto): boolean {
  if (b.done) return false;
  let changed = false;

  // Terminado: no quedan duelos, no puede llegar nadie y queda uno (o nadie).
  if (!b.open && pending(b).length === 0 && waiting(b) <= 1) {
    b.done = true;
    const last = b.queues.find((q) => q.length === 1)?.[0];
    if (last && b.matches.length > 0) b.champion = last;
    return true;
  }

  for (let level = 0; level < b.queues.length; level++) {
    const q = b.queues[level];
    while (q.length >= 2) {
      const p1 = q.shift()!;
      const p2 = q.shift()!;
      b.matches.push({ id: `${b.id}-${b.matches.length}`, level, p1, p2, reto: pickReto(b.kind) });
      changed = true;
    }
    // Bye: uno solo esperando y ya no le puede llegar rival a esta ronda.
    const nothingBelow =
      !b.open &&
      b.matches.every((m) => m.winner || m.level >= level) &&
      b.queues.slice(0, level).every((lower) => lower.length === 0);
    if (q.length === 1 && nothingBelow && waiting(b) > 1) {
      (b.queues[level + 1] ??= []).push(q.shift()!);
      changed = true;
    }
  }
  return changed;
}

function settle(t: LiveTournament, pickReto: PickReto): LiveTournament {
  let changed = true;
  while (changed) {
    changed = false;
    for (const b of t.brackets) changed = settleBracket(b, pickReto) || changed;

    const mains = t.brackets.filter((b) => b.kind === 'main');
    if (mains.every((b) => b.done)) {
      const repesca = t.brackets.find((b) => b.kind === 'repesca');
      if (repesca?.open) {
        repesca.open = false;
        changed = true;
      }
      const champs = mains.map((b) => b.champion).filter((c): c is string => !!c);
      if (mains.length > 1 && !t.brackets.some((b) => b.kind === 'final') && champs.length > 1) {
        t.brackets.push({
          id: 'final',
          name: 'Gran Final',
          kind: 'final',
          size: champs.length,
          queues: [champs],
          matches: [],
          open: false,
          done: false,
        });
        changed = true;
      }
    }
  }

  const decider =
    t.brackets.find((b) => b.kind === 'final') ??
    (t.brackets.filter((b) => b.kind === 'main').length === 1
      ? t.brackets.find((b) => b.kind === 'main')
      : undefined);
  if (decider?.done) t.champion = decider.champion;
  t.finished = t.brackets.every((b) => b.done);
  return t;
}

export function nextMatch(t: LiveTournament): { bracket: TBracket; match: TMatch } | null {
  const n = t.brackets.length;
  for (let k = 0; k < n; k++) {
    const bracket = t.brackets[(t.cursor + k) % n];
    const match = pending(bracket).sort((a, b) => a.level - b.level)[0];
    if (match) return { bracket, match };
  }
  return null;
}

export function recordWinner(
  t: LiveTournament,
  matchId: string,
  winnerId: string,
  pickReto: PickReto
): { tournament: LiveTournament; events: TournamentEvent[] } {
  const next = clone(t);
  const bIdx = next.brackets.findIndex((b) => b.matches.some((m) => m.id === matchId));
  const bracket = next.brackets[bIdx];
  const match = bracket?.matches.find((m) => m.id === matchId);
  if (!bracket || !match || match.winner || (winnerId !== match.p1 && winnerId !== match.p2)) {
    return { tournament: t, events: [] };
  }
  const loserId = winnerId === match.p1 ? match.p2 : match.p1;
  match.winner = winnerId;
  (bracket.queues[match.level + 1] ??= []).push(winnerId);

  const repesca = next.brackets.find((b) => b.kind === 'repesca');
  if (bracket.kind === 'main' && repesca?.open) repesca.queues[0].push(loserId);
  next.cursor = (bIdx + 1) % next.brackets.length;

  const before = new Map(t.brackets.map((b) => [b.id, b.champion]));
  settle(next, pickReto);

  const events: TournamentEvent[] = [];
  for (const b of next.brackets) {
    if (b.champion && before.get(b.id) !== b.champion) {
      events.push({ type: 'bracket_champion', bracketName: b.name, kind: b.kind, playerId: b.champion });
    }
  }
  if (next.champion && !t.champion) events.push({ type: 'tournament_champion', playerId: next.champion });
  return { tournament: next, events };
}

/** "Cuartos", "Semifinal", "Final"… según cuántos empezaron en esa llave. */
export function roundName(bracket: TBracket, level: number): string {
  const totalLevels = Math.max(1, Math.ceil(Math.log2(Math.max(2, bracket.size))));
  const fromEnd = totalLevels - 1 - level;
  if (fromEnd <= 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Cuartos';
  if (fromEnd === 3) return 'Octavos';
  return `Ronda ${level + 1}`;
}

/** Cuántos duelos se juegan cada vez que sale el torneo: más gente, más duelos. */
export function matchesPerTrigger(playersCount: number): number {
  return playersCount >= 6 ? 2 : 1;
}
