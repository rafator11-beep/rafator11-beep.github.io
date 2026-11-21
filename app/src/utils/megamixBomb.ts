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

/** Tema de una carta de bomba: lo que va entre comillas “…”. */
export function bombTopicFromCard(card: string): string | undefined {
  return card.match(/“([^”]+)”/)?.[1];
}

// ─── Temas ────────────────────────────────────────────────────────────────
// De fiesta y vida diaria.
export const BOMB_TOPICS_FIESTA: string[] = [
  'excusas para no ir a una boda',
  'cosas que hay en un bar de pueblo',
  'frases de madre',
  'cosas que se dicen en el grupo de WhatsApp de la familia',
  'cosas que hace un borracho en la cola del baño',
  'marcas que hay en el Mercadona',
  'cosas que no le dirías a tu suegra',
  'cantantes españoles',
  'excusas para llegar tarde al curro',
  'cosas que hay en una despedida de soltero/a',
  'cosas que se pierden en una noche de fiesta',
  'motivos para cortar con alguien',
  'series españolas',
  'cosas que se hacen en un viaje de fin de curso',
  'cosas que hay en la maleta de un guiri',
  'nombres de perro',
  'cosas que se gritan en un partido de fútbol',
  'cosas que solo pasan en las fiestas del pueblo',
  'excusas para no pagar una ronda',
  'cosas que tu abuela guarda «por si acaso»',
];

// ¿Sabes más que un niño de primaria? Cultura básica del cole.
export const BOMB_TOPICS_SABER: string[] = [
  'múltiplos de 7, en orden (7, 14, 21…)',
  'múltiplos de 3, en orden',
  'capitales de Europa',
  'ríos de España',
  'comunidades autónomas',
  'provincias de España',
  'países de América',
  'planetas y lunas del sistema solar',
  'huesos del cuerpo humano',
  'elementos de la tabla periódica',
  'animales que ponen huevos',
  'mamíferos que viven en el mar',
  'insectos',
  'dinosaurios',
  'instrumentos musicales',
  'figuras geométricas',
  'palabras esdrújulas',
  'palabras con ñ',
  'verbos irregulares en inglés',
  'colores en inglés',
  'animales en inglés',
  'deportes olímpicos',
  'pintores famosos',
  'escritores españoles',
  'mares y océanos',
  'inventos que usas todos los días',
  'partes de una planta',
  'profesiones',
  'idiomas del mundo',
  'personajes de Disney',
  'frutas y verduras de color verde',
  'cosas que flotan en el agua',
];

/** Dos temas distintos para elegir: uno de cultura básica y otro de fiesta. */
export function pickTwoTopics(
  exclude: (string | undefined)[] = [],
  rand: () => number = Math.random
): [string, string] {
  const pick = (pool: string[]) => {
    const options = pool.filter((t) => !exclude.includes(t));
    const from = options.length > 0 ? options : pool;
    return from[Math.floor(rand() * from.length)];
  };
  return [pick(BOMB_TOPICS_SABER), pick(BOMB_TOPICS_FIESTA)];
}
