// La bomba de Megamix: el móvil hace tic-tac cada vez más rápido y explota a
// un tiempo aleatorio que nadie conoce. Funciones puras para poder testearlas.

export const BOMB_MIN_MS = 8000;
export const BOMB_MAX_MS = 25000;

export function randomBombDuration(rand: () => number = Math.random): number {
  return Math.round(BOMB_MIN_MS + rand() * (BOMB_MAX_MS - BOMB_MIN_MS));
}

/** Milisegundos hasta el siguiente tic según lo que lleva consumido (0..1). */
export function bombTickInterval(progress: number): number {
  if (progress < 0.5) return 1000;
  if (progress < 0.8) return 500;
  if (progress < 0.95) return 250;
  return 120;
}

export function isBombCard(card: string): boolean {
  return card.startsWith('💣');
}
