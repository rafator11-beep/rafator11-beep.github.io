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
  megamixHumorNegro: 1.6,
  megamixVotaciones: 1.4,
  megamixTodos: 1.3,
  megamixAnecdotas: 1.0,
  megamixBomba: 0.8,
  megamixQuizEspana: 0.7,
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
  // Pool extra que useGameContent inyecta (antes iba suelto al final del mazo
  // y solo aparecía gracias al shuffle global). Peso ≈ su cuota original.
  torneoRetos: 0.25,
};

// Máximo de veces que un mismo tipo puede salir de forma consecutiva dentro de
// su propia secuencia (general o individual van intercaladas, así que esto se
// aplica por separado a cada una).
export const MAX_CONSECUTIVE_SAME_TYPE = 2;

// Cada cuántas cartas del mazo entra cada evento (ocupan el hueco de carta
// general). Si dos coinciden, el de menor prioridad se retrasa al siguiente
// hueco general. Prioridad: impostor > torneo > norma > especial.
export const TRIGGER_INTERVALS = {
  impostor: 20,
  torneo: 15,
  norma: 25,
  especial: 10, // trivia fútbol/cultura, duelo, virus
} as const;
