/**
 * Anti-repetición entre partidas para preguntas de quiz (Cultura, Fútbol,
 * Speed Round). Guarda en localStorage los IDs mostrados recientemente y
 * prioriza los que no se han visto. Si no quedan suficientes frescos, resetea.
 *
 * Todo protegido: si localStorage falla, devuelve una selección barajada normal.
 */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CAP = 800;

/** Devuelve `need` elementos priorizando los no vistos y los recuerda. */
export function pickFreshQuiz<T>(
  pool: T[],
  storageKey: string,
  id: (x: T) => string,
  need: number,
): T[] {
  if (pool.length === 0) return [];
  let seen: string[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(seen)) seen = [];
  } catch {
    seen = [];
  }
  const seenSet = new Set(seen);

  let fresh = pool.filter(x => !seenSet.has(id(x)));
  if (fresh.length < Math.max(need, Math.ceil(pool.length * 0.1))) {
    fresh = [...pool]; // agotado: reseteamos la memoria
    seen = [];
  }

  const chosen = shuffle(fresh).slice(0, need);

  try {
    const merged = [...chosen.map(id), ...seen].slice(0, CAP);
    localStorage.setItem(storageKey, JSON.stringify(merged));
  } catch {
    /* sin persistencia, no pasa nada */
  }

  return chosen;
}

/** Añade IDs ya mostrados a la memoria (para el flujo carta-a-carta). */
export function rememberQuizIds(ids: string[], storageKey: string): void {
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const merged = [...ids, ...(Array.isArray(prev) ? prev : [])].slice(0, CAP);
    localStorage.setItem(storageKey, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}
