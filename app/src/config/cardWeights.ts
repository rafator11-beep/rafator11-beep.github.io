// Pesos relativos por tipo de carta para el mazo de Megamix/Clásico.
// El motor (ver src/data/gameContent.ts, función buildMegamixDeck) elige el tipo
// de la siguiente carta con probabilidad proporcional a su peso (no por volumen
// de cartas disponibles, que es como funcionaba antes). Pesos más altos = sale
// más a menudo. 1.0 es la referencia "normal".
//
// Tipos GENERAL (participa toda la mesa, no avanza el turno del jugador):
export const GENERAL_TYPE_WEIGHTS: Record<string, number> = {
  yoNunca: 1.0,
  picante: 1.3,
  humorNegro: 1.3,
  enLaCama: 1.2,
  masProbable: 1.1,
  grupal: 1.1,
  cadena: 0.8,
  pacovers: 1.0,
  espana: 0.5,
  mimica: 0.9,
  // customPartyRetos ("Si has..., bebe"): pocas cartas, peso bajo para no repetirlas.
  customRetos: 0.05,
};

// Tipos INDIVIDUAL (actúa el jugador activo, sí avanza el turno):
export const INDIVIDUAL_TYPE_WEIGHTS: Record<string, number> = {
  retos: 1.0,
  verdadOBebe: 1.5,
  triviaExpress: 0.6,
  categorias: 0.6,
  duelos: 1.0,
  clasico: 0.9,
  // Pool extra que useGameContent inyecta (antes iba suelto al final del mazo
  // y solo aparecía gracias al shuffle global). Peso ≈ su cuota original.
  torneoRetos: 0.25,
};

// Máximo de veces que un mismo tipo puede salir de forma consecutiva dentro de
// su propia secuencia (general o individual van intercaladas, así que esto se
// aplica por separado a cada una).
export const MAX_CONSECUTIVE_SAME_TYPE = 2;
