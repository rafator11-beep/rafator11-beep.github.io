// Normas interactivas de Megamix: mientras dura una norma, cualquiera puede
// pulsar "¡Pillado!" y señalar a quien la ha incumplido. Al acabar, sale el
// veredicto: el que más ha caído bebe, y si nadie ha caído, bebe el capitán
// por mal vigilante. Todo por id de jugador; los móviles reportan por nombre
// y la partida lo traduce.

export type NormaInfractions = Record<string, number>;

export interface NormaResult {
  text: string;
  infractions: NormaInfractions;
}

export interface NormaVerdict {
  /** Los que más veces han caído (empate = todos ellos). */
  worstIds: string[];
  worstCount: number;
  /** Tragos para cada uno de los peores: lo que han caído, entre 2 y 5. */
  drinks: number;
  /** Los que no han caído ni una vez: reparten 1 cada uno. */
  cleanIds: string[];
  /** Nadie ha caído en toda la norma. */
  nobody: boolean;
}

// Al cazar a alguien bebe en el momento; el veredicto final es aparte.
export const DRINKS_PER_INFRACTION = 1;

export function addInfraction(infractions: NormaInfractions, playerId: string): NormaInfractions {
  return { ...infractions, [playerId]: (infractions[playerId] ?? 0) + 1 };
}

export function normaVerdict(infractions: NormaInfractions, playerIds: string[]): NormaVerdict {
  const counts = playerIds.map((id) => [id, infractions[id] ?? 0] as const);
  const worstCount = Math.max(0, ...counts.map(([, n]) => n));
  if (worstCount === 0) {
    return { worstIds: [], worstCount: 0, drinks: 2, cleanIds: [...playerIds], nobody: true };
  }
  return {
    worstIds: counts.filter(([, n]) => n === worstCount).map(([id]) => id),
    worstCount,
    drinks: Math.min(5, Math.max(2, worstCount)),
    cleanIds: counts.filter(([, n]) => n === 0).map(([id]) => id),
    nobody: false,
  };
}

/** Texto de la norma sin prefijos ("📜 NORMA: …" → "…"). */
export function cleanNormaText(text: string): string {
  return text
    .replace(/📜\s*/g, '')
    .replace(/NUEVA\s*NORMA:\s*/gi, '')
    .replace(/NORMA:\s*/gi, '')
    .trim();
}
