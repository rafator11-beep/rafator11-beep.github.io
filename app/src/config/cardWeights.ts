// Pesos relativos por tipo de carta para el mazo de Megamix/Clásico.
// El motor (ver src/data/gameContent.ts, función buildMegamixDeck) elige el tipo
// de la siguiente carta con probabilidad proporcional a su peso (no por volumen
// de cartas disponibles, que es como funcionaba antes). Pesos más altos = sale
// más a menudo. 1.0 es la referencia "normal".
//
// Tipos GENERAL (participa toda la mesa, no avanza el turno del jugador):
export const GENERAL_TYPE_WEIGHTS: Record<string, number> = {
  yoNunca: 1.15,
  picante: 1.35,
  // El pool antiguo de humor negro es casi todo "Yo nunca" con 💀: pesa menos
  // ahora que hay uno nuevo con votaciones (megamixHumorNegro).
  humorNegro: 0.6,
  enLaCama: 1.2,
  masProbable: 1.25,
  grupal: 1.45,
  cadena: 1.05,
  pacovers: 0.75,
  espana: 0.65,
  mimica: 0.95,
  // Solo 67 cartas: con más peso se repetían en cada partida.
  megamixEspañaGeneral: 1.0,
  // Núcleo de Megamix escrito a mano (src/data/megamixCore.ts).
  megamixYoNunca: 1.6,
  megamixHumorNegro: 1.9,
  megamixVotaciones: 1.4,
  megamixTodos: 1.3,
  megamixAnecdotas: 1.0,
  megamixBomba: 0.8,
  megamixQuizEspana: 0.7,
  megamixPicante: 1.2,
  megamixVidaEspana: 1.4,
  // customPartyRetos ("Si has..., bebe"): pocas cartas, peso bajo para no repetirlas.
  customRetos: 0.05,
};

// Tipos INDIVIDUAL (actúa el jugador activo, sí avanza el turno):
export const INDIVIDUAL_TYPE_WEIGHTS: Record<string, number> = {
  retos: 1.35,
  verdadOBebe: 1.8,
  triviaExpress: 0.45,
  categorias: 0.55,
  duelos: 1.15,
  clasico: 0.7,
  // Solo 52 cartas: con 2.4 salían en una de cada cuatro individuales.
  megamixEspañaIndividual: 0.9,
  // Núcleo de Megamix escrito a mano (src/data/megamixCore.ts).
  megamixRetos: 1.6,
  megamixVerdades: 1.2,
  megamixDuelos: 1.0,
  megamixRetosDia: 1.2,
  megamixVerdadesPicantes: 0.8,
  megamixHumorNegroTurno: 1.0,
  // Pool extra que useGameContent inyecta (antes iba suelto al final del mazo
  // y solo aparecía gracias al shuffle global). Peso ≈ su cuota original.
  torneoRetos: 0.25,
};

// Máximo de veces que un mismo tipo puede salir de forma consecutiva dentro de
// su propia secuencia (general o individual van intercaladas, así que esto se
// aplica por separado a cada una).
export const MAX_CONSECUTIVE_SAME_TYPE = 2;

// ─── Eventos del mazo ─────────────────────────────────────────────────────
// Cada cuántas RONDAS entra cada evento (ocupan el hueco de carta general).
// Una ronda = cada jugador ha tenido su individual = 2 × jugadores cartas.
// Antes iba por cartas fijas (cada 10/15/20/25) y con 4 jugadores los eventos
// se comían la mitad de las cartas grupales. Si dos coinciden, el de menor
// prioridad se retrasa. Prioridad: impostor > torneo > norma > especial.
export const TRIGGER_EVERY_ROUNDS = {
  impostor: 5,
  torneo: 2,
  norma: 3,
  especial: 4, // trivia fútbol/cultura, duelo, virus
} as const;

// Mínimo de cartas entre eventos del mismo tipo (con 2-3 jugadores una ronda
// son muy pocas cartas).
const TRIGGER_MIN_CARDS: Record<keyof typeof TRIGGER_EVERY_ROUNDS, number> = {
  impostor: 30,
  torneo: 14,
  norma: 20,
  especial: 16,
};

export type TriggerKind = keyof typeof TRIGGER_EVERY_ROUNDS;

export function triggerIntervals(playersCount: number): Record<TriggerKind, number> {
  const cardsPerRound = 2 * Math.max(2, playersCount);
  const out = {} as Record<TriggerKind, number>;
  for (const k of Object.keys(TRIGGER_EVERY_ROUNDS) as TriggerKind[]) {
    out[k] = Math.max(TRIGGER_MIN_CARDS[k], TRIGGER_EVERY_ROUNDS[k] * cardsPerRound);
  }
  return out;
}

// ─── Intensidad por fases ─────────────────────────────────────────────────
// Cada tipo tiene una intensidad; según la fase de la partida, su peso se
// multiplica: al principio manda lo suave y lo picante casi no sale; al final
// es al revés. Tipos sin entrada cuentan como 'media'.
export type Intensity = 'suave' | 'media' | 'fuerte';

export const TYPE_INTENSITY: Record<string, Intensity> = {
  // generales
  yoNunca: 'suave',
  megamixYoNunca: 'suave',
  megamixTodos: 'suave',
  megamixQuizEspana: 'suave',
  cadena: 'suave',
  pacovers: 'suave',
  espana: 'suave',
  customRetos: 'suave',
  picante: 'fuerte',
  enLaCama: 'fuerte',
  humorNegro: 'fuerte',
  // El humor negro nuevo no es sexual: sale durante toda la partida.
  megamixHumorNegro: 'media',
  megamixPicante: 'fuerte',
  megamixVidaEspana: 'suave',
  // individuales
  triviaExpress: 'suave',
  categorias: 'suave',
  clasico: 'suave',
  megamixVerdadesPicantes: 'fuerte',
  megamixHumorNegroTurno: 'media',
};

export const PHASE_INTENSITY_MULTIPLIER: Record<
  'Calienta motores' | 'La previa se anima' | 'Modo locura' | 'Final épico',
  Record<Intensity, number>
> = {
  'Calienta motores': { suave: 1.6, media: 1.0, fuerte: 0.25 },
  'La previa se anima': { suave: 1.1, media: 1.2, fuerte: 0.8 },
  'Modo locura': { suave: 0.7, media: 1.1, fuerte: 1.4 },
  'Final épico': { suave: 0.5, media: 1.0, fuerte: 1.6 },
};
