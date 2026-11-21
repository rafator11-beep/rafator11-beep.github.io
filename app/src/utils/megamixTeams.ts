// Guerra de equipos de Megamix: la app reparte a la gente en equipos al azar
// (más equipos cuanta más gente) y propone una prueba que se juega en grupo.
// Pierden: beben 2 cada uno. Ganan: reparten 1 cada uno.

export interface Team {
  name: string;
  /** Clases de color (borde/fondo/texto) para pintar el equipo. */
  tone: string;
  playerIds: string[];
}

const TEAM_STYLES: { name: string; tone: string }[] = [
  { name: 'Las Croquetas', tone: 'border-amber-400/60 bg-amber-500/15 text-amber-200' },
  { name: 'Los Calimochos', tone: 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200' },
  { name: 'Las Bravas', tone: 'border-red-400/60 bg-red-500/15 text-red-200' },
  { name: 'Los Chupitos', tone: 'border-sky-400/60 bg-sky-500/15 text-sky-200' },
  { name: 'Las Sangrías', tone: 'border-rose-400/60 bg-rose-500/15 text-rose-200' },
  { name: 'Los Jamones', tone: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' },
];

/** 2 equipos hasta 9 personas, 3 hasta 17 y 4 a partir de ahí. */
export function teamCountFor(players: number): number {
  if (players >= 18) return 4;
  if (players >= 10) return 3;
  return 2;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeTeams(playerIds: string[], rand: () => number = Math.random): Team[] {
  const count = Math.min(teamCountFor(playerIds.length), Math.max(2, Math.floor(playerIds.length / 2)));
  const styles = shuffle(TEAM_STYLES, rand).slice(0, count);
  const teams: Team[] = styles.map((s) => ({ ...s, playerIds: [] }));
  shuffle(playerIds, rand).forEach((id, i) => teams[i % count].playerIds.push(id));
  return teams;
}

export const TEAM_CHALLENGES: string[] = [
  '🔗 CADENA POR EQUIPOS: el capitán dice un tema y los equipos se turnan diciendo uno. El equipo que repita o tarde más de 3 segundos, pierde.',
  '🎭 MÍMICA RELÁMPAGO: cada equipo elige a uno que hace la mímica de una película que le diga el capitán al oído. Su equipo tiene 30 segundos. Gana el que la adivine más rápido.',
  '🧠 EL CAPITÁN PREGUNTA: tres preguntas de cultura general. El primer equipo en gritar la respuesta buena se lleva el punto. Gana quien más puntos tenga.',
  '🤫 TELÉFONO ESCACHARRADO: el capitán susurra la misma frase al primero de cada equipo y pasa de oído en oído. Gana el equipo cuyo último la diga más parecida.',
  '🏗️ LA TORRE: 30 segundos para hacer la torre más alta con objetos de la mesa, sin romper nada. Gana la torre más alta que siga en pie.',
  '🎤 KARAOKE DE EQUIPO: cada equipo canta a la vez el estribillo de una canción del verano. Los aplausos del resto deciden quién gana.',
  '📸 LA FOTO ÉPICA: 10 segundos para montar la pose de grupo más épica. El capitán elige la mejor.',
  '🔤 SIN LA E: los equipos se turnan diciendo animales sin la letra E. El equipo que la diga o tarde más de 3 segundos, pierde.',
  '🎬 DOBLAJE: cada equipo representa en 20 segundos una escena famosa (Titanic, El Rey León, Aquí no hay quien viva…). Gana la más graciosa.',
  '✊ PIEDRA, PAPEL O TIJERA EN EQUIPO: cada equipo decide en secreto y lo enseñan todos sus miembros a la vez. Al mejor de tres.',
  '🧩 ADIVINA EL FAMOSO: un equipo piensa un famoso y el otro tiene 10 preguntas de sí o no. Luego al revés. Gana el que lo adivine con menos preguntas.',
  '🎵 TARAREA Y ADIVINA: uno de cada equipo tararea una canción y su equipo tiene que adivinarla. Gana el más rápido. Al mejor de tres.',
  '🔢 HASTA 20: cada equipo cuenta del 1 al 20 diciendo un número por persona y sin orden fijo. Si dos hablan a la vez, vuelven a empezar. Gana el primero que llegue.',
  '🗺️ CAPITALES: el capitán dice países y el primer equipo en gritar la capital buena se lleva el punto. Gana el primero que llegue a 5.',
  '👟 LA RECOLECTA: el capitán pide algo (un calcetín, algo rojo, una moneda de 2 €…). Gana el primer equipo en traerlo. Al mejor de tres.',
  '🤐 SIN REÍRSE: un equipo intenta hacer reír al otro durante 20 segundos y luego cambian. Pierde el equipo que más se haya reído.',
  '🌀 TRABALENGUAS EN CADENA: cada equipo dice “tres tristes tigres tragaban trigo en un trigal” uno detrás de otro. Gana el que llegue al final con menos fallos.',
  '📖 HISTORIA EN EQUIPO: cada equipo cuenta una historia diciendo una palabra por persona. El resto vota la mejor.',
  '🍻 EL BRINDIS: cada equipo tiene 15 segundos para el brindis más original. El capitán elige.',
  '🧮 ¿SABES MÁS QUE UN NIÑO DE PRIMARIA?: el capitán pregunta (tabla del 7, ríos de España, planetas…). El primer equipo en acertar suma. Gana el primero que llegue a 3.',
  '💃 LA COREO: 20 segundos para inventar un baile y lo bailan todos a la vez. Gana el equipo más sincronizado.',
  '🎯 PUNTERÍA: cada persona tira un tapón o una bola de papel a un vaso desde dos metros. Gana el equipo con más aciertos.',
  '🗣️ PASAPALABRA: el capitán dice una letra y los equipos se turnan diciendo palabras que empiecen por ella. Quien repita o se quede en blanco, pierde.',
  '🕵️ EL INFILTRADO: cada equipo elige en secreto a un “infiltrado” que tiene que decir la palabra “croqueta” sin que le pillen en la próxima ronda. Gana el equipo que pille antes al infiltrado contrario.',
];

export function pickTeamChallenge(exclude?: string, rand: () => number = Math.random): string {
  const options = TEAM_CHALLENGES.filter((c) => c !== exclude);
  return options[Math.floor(rand() * options.length)];
}
