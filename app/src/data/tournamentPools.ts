// Retos para el torneo vivo de Megamix (src/utils/liveTournament.ts).
// LLAVES principales: duelos de todo tipo (físicos, de ingenio, de baile…).
// REPESCA: "otro torneo de otra cosa": memoria, rapidez y suerte, para que
// los eliminados sientan que juegan a otro juego.
import { capDrinking, torneoRetos } from '@/data/gameContent';
import { duelosV5 } from '@/data/updatePostVerano2026';
import { duelosV5b } from '@/data/updatePostVerano2026_v2';
import { moreTorneoRetos } from '@/data/extraContentIndex';

export const DUEL_POOL: string[] = Array.from(
  new Set(
    [...torneoRetos, ...duelosV5, ...duelosV5b, ...moreTorneoRetos].map((s) => capDrinking(s.trim()))
  )
).filter(Boolean);

export const REPESCA_POOL: string[] = [
  "🧠 REPESCA — MEMORIA: {player} y {player2}, la mesa dice 6 objetos. Repetidlos en orden por turnos. El que se equivoque antes, pierde.",
  "🧠 REPESCA — CADENA DE PAÍSES: {player} empieza, {player2} sigue con la última letra. El que se quede en blanco 3s, pierde.",
  "🧠 REPESCA — NÚMEROS: {player} y {player2} cuentan alternando del 1 al 30, pero si toca múltiplo de 3 hay que decir 'bip'. El que falle, pierde.",
  "⚡ REPESCA — RAPIDEZ: a la de 3, {player} y {player2} dicen un color. Si coincide, se repite; el primero que dude, pierde.",
  "⚡ REPESCA — ALFABETO: {player} y {player2} dicen nombres de famosos empezando por la letra que diga la mesa, por turnos. El que se atasque, pierde.",
  "🎯 REPESCA — PUNTERÍA: {player} y {player2} intentan encestar algo (un papel, un tapón) en un vaso desde la misma distancia. Mejor de 3 tiros.",
  "🤐 REPESCA — AGUANTA LA RISA: la mesa intenta hacer reír a {player} y {player2} a la vez durante 15s. El primero que se ría, pierde.",
  "🧠 REPESCA — TRIVIAL EXPRÉS: la mesa hace una pregunta de cultura general. El primero de {player} o {player2} en contestar bien, gana.",
  "👁️ REPESCA — ESTATUA: {player} y {player2} se quedan congelados. El primero que se mueva o se ría, pierde.",
  "🗣️ REPESCA — TRABALENGUAS: {player} y {player2} repiten el mismo trabalenguas 3 veces seguidas lo más rápido posible. Gana quien lo borde.",
  "🧠 REPESCA — CATEGORÍA RÁPIDA: la mesa dice una categoría (animales, comida...). {player} y {player2} se turnan diciendo uno cada uno sin repetir hasta que alguien falle.",
  "✋ REPESCA — PALMADA: {player} y {player2} ponen las manos juntas; uno intenta dar una palmada en la mano del otro antes de que la retire. Mejor de 3.",
  "🎲 REPESCA — PIEDRA PAPEL TIJERA: mejor de 5 entre {player} y {player2}. Sin trampas.",
  "🧠 REPESCA — ORDEN CRONOLÓGICO: la mesa dice 4 años al azar; {player} y {player2} compiten por decir el orden correcto primero.",
  "⚡ REPESCA — ECO: {player} dice una frase corta, {player2} tiene que repetirla exacta al momento. Si falla una palabra, pierde; si acierta, cambian los papeles.",
];
