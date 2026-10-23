// Preguntas/retos ligados a los "gustos" opcionales de cada jugador (ver PlayerSetup).
// Cada plantilla usa {taste_player} → se sustituye por el nombre real del jugador
// que puso ese gusto ANTES de entrar al mazo (no es un placeholder dinámico de turno
// como {player}, es fijo: siempre señala a la misma persona). Implican al grupo
// (duelo, votación, apuesta) para que no sea solo el jugador de turno quien actúa.

export const TASTE_CHIPS = [
  { key: 'musica', label: '🎵 Música', emoji: '🎵' },
  { key: 'series', label: '📺 Series', emoji: '📺' },
  { key: 'futbol', label: '⚽ Fútbol', emoji: '⚽' },
  { key: 'gaming', label: '🎮 Gaming', emoji: '🎮' },
  { key: 'viajes', label: '✈️ Viajes', emoji: '✈️' },
  { key: 'comida', label: '🍔 Comida', emoji: '🍔' },
  { key: 'moda', label: '👗 Moda', emoji: '👗' },
  { key: 'cotilleo', label: '📰 Cotilleo', emoji: '📰' },
] as const;

export type TasteKey = typeof TASTE_CHIPS[number]['key'];

// Plantillas por categoría. {taste_player} = la persona que puso ese gusto.
export const TASTE_CARD_TEMPLATES: Record<string, string[]> = {
  musica: [
    "🎯 GUSTOS: Duelo — ¿quién del grupo sabe más de música que {taste_player}? El que pierda el pulso bebe 2.",
    "🎯 GUSTOS: Votad: ¿creéis que a {taste_player} le suena bien cualquier canción con tal de bailar, o tiene gusto de verdad? El grupo decide y el que pierda la votación invita a una ronda imaginaria.",
    "🎯 GUSTOS: {taste_player}, canta 5 segundos de tu canción favorita AHORA MISMO. Si el grupo no la reconoce, bebes 2. Si la reconocen, el que acierte primero reparte 1.",
    "🎯 GUSTOS: Todos a la vez: decid un artista que creéis que le gusta a {taste_player}. El que más se acerque, reparte 2.",
  ],
  series: [
    "🎯 GUSTOS: Votación — ¿qué personaje de serie encaja más con {taste_player}? Discutidlo 20 segundos; el que convenza al grupo, reparte 2.",
    "🎯 GUSTOS: Duelo de spoilers — alguien reta a {taste_player} a adivinar de qué serie habla con una sola pista. Si {taste_player} falla, bebe 2; si acierta, el retador bebe 2.",
    "🎯 GUSTOS: {taste_player}, resume tu serie favorita en 10 segundos sin decir el nombre. Si el grupo no la adivina, bebes 2.",
  ],
  futbol: [
    "🎯 GUSTOS: Duelo de fútbol — alguien del grupo reta a {taste_player} con una pregunta random de fútbol. Quien falle, bebe 2.",
    "🎯 GUSTOS: Votación: ¿quién se cree más forofo del fútbol que {taste_player} sin tener ni idea? El señalado y {taste_player} hacen un mini-duelo; el que pierda bebe 2.",
    "🎯 GUSTOS: {taste_player}, nombra 3 equipos de fútbol en 5 segundos. Si fallas, bebes 2. Si lo consigues, elige a alguien que beba 1 por intentar seguirte el ritmo.",
  ],
  gaming: [
    "🎯 GUSTOS: Duelo — reta a {taste_player} a un piedra-papel-tijera al mejor de 3. El perdedor bebe 2.",
    "🎯 GUSTOS: Votación: ¿quién cree que le ganaría a {taste_player} en su videojuego favorito sin haberlo jugado nunca? El elegido y {taste_player} se lo juegan a cara o cruz; el perdedor bebe 2.",
    "🎯 GUSTOS: {taste_player}, describe tu videojuego favorito con mímica durante 10 segundos sin hablar. Si nadie lo adivina, bebes 2.",
  ],
  viajes: [
    "🎯 GUSTOS: {taste_player}, cuenta el destino que más feo te ha quedado en una app de viajes o en la vida real. Si no hace gracia, bebes 2.",
    "🎯 GUSTOS: Votación: ¿a qué país mandaríais a {taste_player} de viaje sorpresa sin avisar? El más votado, que lo diga en voz alta y {taste_player} decide si le convence o bebe 1.",
    "🎯 GUSTOS: Todos a la vez: decid un país que creéis que {taste_player} aún no ha visitado. El que acierte más veces, reparte 2.",
  ],
  comida: [
    "🎯 GUSTOS: Duelo — alguien reta a {taste_player} a nombrar 5 platos en 10 segundos. Si falla, bebe 2; si gana, el retador bebe 2.",
    "🎯 GUSTOS: Votación: ¿quién del grupo cocina peor que {taste_player}? El señalado y {taste_player} brindan por su nivel culinario (ambos beben 1).",
    "🎯 GUSTOS: {taste_player}, describe tu plato favorito sin decir ningún ingrediente. Si el grupo no lo adivina en 15 segundos, bebes 2.",
  ],
  moda: [
    "🎯 GUSTOS: Votación: ¿quién viste peor que {taste_player} en este grupo, con cariño? El señalado bebe 1 y {taste_player} reparte 1 por presumido/a.",
    "🎯 GUSTOS: {taste_player}, describe el look más arriesgado que llevarías a una fiesta sin que te importe el qué dirán. Si al grupo le convence, reparte 2; si no, bebes 2.",
  ],
  cotilleo: [
    "🎯 GUSTOS: {taste_player}, cuenta el último cotilleo que te has enterado y que no sea sobre nadie de esta mesa. Si no tienes ninguno, bebes 2.",
    "🎯 GUSTOS: Votación: ¿quién se entera antes de todo, {taste_player} o el grupo entero junto? Si gana {taste_player}, reparte 2. Si gana el grupo, {taste_player} bebe 2.",
  ],
};
