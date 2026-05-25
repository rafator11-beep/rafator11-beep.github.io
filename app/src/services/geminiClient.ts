/**
 * Cliente de integración directa con Google Gemini 1.5 Flash.
 * Realiza peticiones HTTP directas (sin dependencias de SDKs grandes)
 * y devuelve respuestas estructuradas forzando formato JSON.
 */

// Obtener modelo activo de Gemini con fallback dinámico inteligente
function getActiveModel(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fiesta_gemini_active_model') || 'gemini-1.5-flash';
  }
  return 'gemini-1.5-flash';
}

// Obtener la API Key desde las variables de entorno o desde localStorage (ajustes en caliente)
export function getGeminiApiKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_GEMINI_API_KEY || localStorage.getItem('fiesta_gemini_key') || '';
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return typeof key === 'string' && key.trim().length > 0 && !key.includes('placeholder');
}

export function getPartyTheme(): string {
  return localStorage.getItem('fiesta_party_theme') || '';
}

/**
 * Función genérica de llamada a Gemini con salida JSON forzada e inteligente de fallbacks
 */
async function callGemini(prompt: string, overrideModel?: string): Promise<any | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('Gemini Client: No API Key configured');
    return null;
  }

  const activeModel = overrideModel || getActiveModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini Client: API error (${response.status}) for model ${activeModel}:`, errText);
      
      // Si recibimos un 404 (modelo no encontrado o no soportado en esta versión), intentamos fallbacks
      if (response.status === 404 && !overrideModel) {
        const fallbackModels = ['gemini-1.5-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const nextModel of fallbackModels) {
          if (nextModel === activeModel) continue; // No repetir el fallido
          console.log(`Gemini Client: Attempting fallback to model "${nextModel}"...`);
          const fallbackResult = await callGemini(prompt, nextModel);
          if (fallbackResult) {
            console.log(`Gemini Client: Fallback model "${nextModel}" was successful! Saving to cache.`);
            if (typeof window !== 'undefined') {
              localStorage.setItem('fiesta_gemini_active_model', nextModel);
            }
            return fallbackResult;
          }
        }
      }
      return null;
    }

    const json = await response.json();
    const textContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.warn('Gemini Client: Empty response');
      return null;
    }

    // Limpiar posibles bloques markdown si Gemini los añade a pesar de forzar JSON
    let cleanJsonStr = textContent.trim();
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(cleanJsonStr);
  } catch (error) {
    console.error('Gemini Client: Execution error:', error);
    return null;
  }
}

/**
 * 1. Generar una nueva carta/reto personalizada (con soporte de tema)
 */
export async function geminiGenerateCard(events: any[], players: string[]): Promise<string | null> {
  const theme = getPartyTheme();
  const themePrompt = theme 
    ? `\n- El grupo ha establecido que la fiesta de hoy tiene este tema especial: "${theme}". ES OBLIGATORIO que el reto esté fuertemente inspirado en este tema, haciendo chistes, referencias, o dinámicas relacionadas.` 
    : '';

  const prompt = `
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${players.join(', ')}.${themePrompt}
Aquí tienes el historial reciente de eventos del juego para darte contexto y poder crear rivalidades o piques divertidos:
${JSON.stringify(events.slice(-15))}

Instrucciones de generación:
- Crea una carta con un reto único. Puede ser del tipo "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1", "Castigo" o del tipo "🛌 Cosas que puedes decir en la cama y...".
- Ocasionalmente, puedes generar una carta del tipo "🛌 En la cama y..." siguiendo un patrón de comparación de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase de doble sentido que sirva para ambos contextos. Quien repita o falle, bebe X tragos. (Ej: '¡Está muy caliente!', '¡Cabe otro!')".
- Sé muy divertido, sarcástico, irónico y ligeramente atrevido (apto para mayores de 18 años jugando de fiesta en un bar o casa).
- IMPORTANTE: Involucra obligatoriamente a uno o varios de los jugadores activos (${players.join(', ')}) llamándolos por sus nombres reales en el texto del reto (ej: "Rafa tiene que..." o "España y Asdased compiten..."). NO utilices marcadores genéricos como '{player}' o '{player1}'. Usa sus nombres reales de la lista proporcionada.
- IMPORTANTE: La salida debe ser un objeto JSON válido con la propiedad "card".
- El texto de la carta debe estar en español y redactado con un tono dinámico y juvenil.

Formato JSON esperado:
{
  "card": "El texto del reto personalizado en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.card || null;
}

/**
 * 2. Enriquecer un reto existente con estadísticas y salseo (con soporte de tema)
 */
export async function geminiEnrichChallenge(
  challengeText: string,
  playerStats: string,
  playerNames: string[],
  activePlayerName: string
): Promise<string | null> {
  const theme = getPartyTheme();
  const themePrompt = theme 
    ? `\n- Tema especial de la fiesta de hoy: "${theme}". Intenta reescribir el reto para integrar sutilmente este tema o palabras clave de forma hilarante.` 
    : '';

  const prompt = `
Eres el motor de IA del juego de fiesta BEEP. Tu misión es añadir salseo, ironía y dinamismo a un reto existente utilizando la memoria real y nombres de los jugadores del grupo.
Reto original: "${challengeText}"
El jugador que tiene el turno actual (el protagonista del reto) es: "${activePlayerName}".
Todos los jugadores del grupo son: ${playerNames.join(', ')}
Estadísticas de los jugadores (¡úsalas de forma sarcástica para picarlos, retarlos o justificar el reto!):
${playerStats}${themePrompt}

Instrucciones:
- Reescribe el reto original de forma ingeniosa para integrar sus nombres y estadísticas de forma orgánica.
- El reto DEBE ir dirigido principalmente a "${activePlayerName}" o tenerle como protagonista del turno.
- DEBES involucrar a otros jugadores del grupo (como ${playerNames.filter(n => n !== activePlayerName).join(', ') || 'alguien del grupo'}) por sus nombres reales en la reescritura del reto para crear preguntas graciosas, retos de complicidad, piques o duelos de beber.
- IMPORTANTE: Si el reto original contiene el emoji "🛌" o menciona "En la cama y..." o "Cosas que puedes decir en la cama y...", la reescritura DEBE seguir el formato de una ronda por turnos de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase que sirva en ambos contextos. El primero que repita o falle, bebe X tragos". Además, incluye al final de la carta 2 ejemplos extremadamente graciosos, pícaros y con doble sentido para inspirar a los jugadores (ej: "(Ej: '¡Está saliendo líquido!', '¡Qué estrecho está esto!')").
- Haz chistes o pullas divertidas sobre quién va ganando, quién lleva más tragos 🍻, o quién no da pie con bola.
- Mantén la esencia del reto original (si es un duelo, que siga siendo un duelo; si es beber, que siga siendo beber) pero haz que parezca personalizado en vivo por un presentador de televisión gamberro.
- Si el reto original requiere beber tragos, puedes adaptarlos un poco según las estadísticas (ej. "${activePlayerName} que lleva 0 tragos bebe el doble para compensar").
- La salida debe ser un objeto JSON válido con la propiedad "enriched".
- Escribe en español.

Formato JSON esperado:
{
  "enriched": "El texto del reto reescrito con salseo en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.enriched || null;
}

/**
 * 3. Narrar el anuncio de un Duelo de Torneo 1v1
 */
export async function geminiGenerateTorneoAnnouncement(
  player1: string,
  player2: string,
  retoText: string,
  memory: string[]
): Promise<string | null> {
  const prompt = `
Eres el narrador estrella y maestro de ceremonias teatral del juego de fiesta BEEP.
Se va a disputar un duelo decisivo de torneo 1v1 entre ${player1} y ${player2}.
El reto del duelo es: "${retoText}"
Historial de eventos recientes de la partida para dar contexto:
${JSON.stringify(memory)}

Instrucciones:
- Escribe una presentación súper emocionante, divertida, dramática e irónica.
- Emplea un tono de presentador de boxeo de Las Vegas o de un espectáculo gamberro.
- Pica a ambos jugadores de forma amistosa resaltando piques del historial de eventos.
- El texto debe ser corto (máximo 2 frases) pero con muchísima energía y "hype".
- La salida debe ser un objeto JSON válido con la propiedad "announcement".
- Escribe en español.

Formato JSON esperado:
{
  "announcement": "El espectacular anuncio del duelo en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.announcement || null;
}

/**
 * 4. Generar el comentario de análisis al final de la ronda
 */
export async function geminiGenerateRoundAnalysis(
  players: string[],
  round: number,
  summary: string[],
  playerStatsDigest: string[]
): Promise<string | null> {
  const prompt = `
Eres el analista oficial y comentarista irónico de la barra del bar en el juego de fiesta BEEP.
Ha terminado la ronda número ${round} de la partida.
Jugadores activos: ${players.join(', ')}
Eventos que han ocurrido en esta ronda:
${JSON.stringify(summary)}
Resumen de estadísticas de toda la partida:
${JSON.stringify(playerStatsDigest)}

Instrucciones:
- Escribe un comentario humorístico, irónico y muy divertido resumiendo lo que ha pasado en esta ronda y cómo va la partida en general.
- Señala con gracia quién es el rey de la bebida (lleva más tragos 🍻), quién es un campeón invicto, quién está fallando todos sus retos, o algún pique interesante surgido.
- Utiliza emojis y mantén un estilo cercano, ingenioso y de bar de copas. Máximo 2-3 frases.
- La salida debe ser un objeto JSON válido con la propiedad "comment".
- Escribe en español.

Formato JSON esperado:
{
  "comment": "Tu comentario sarcástico y divertido sobre la ronda en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.comment || null;
}

/**
 * 5. Generar la crónica final humorística para la pantalla de Podio
 */
export async function geminiGeneratePartyChronicle(
  players: { name: string; score: number }[],
  trackingData: any
): Promise<string | null> {
  const theme = getPartyTheme();
  const themePrompt = theme ? `\n- El tema de la noche era: "${theme}".` : '';

  const prompt = `
Eres el cronista del corazón y reportero más cotilla del juego de fiesta BEEP.
Ha terminado la partida. Aquí tienes los resultados finales, XP y estadísticas globales de los jugadores:${themePrompt}
- Jugadores y su XP final:
${players.map(p => `- ${p.name}: ${p.score} XP`).join('\n')}
- Tragos totales acumulados:
${JSON.stringify(trackingData?.drinkCounts || {})}
- Votos recibidos en dinámicas de grupo:
${JSON.stringify(trackingData?.voteCounts || {})}
- Veces que pasaron/hicieron skip:
${JSON.stringify(trackingData?.skipCounts || {})}
- Virus totales recibidos:
${JSON.stringify(trackingData?.virusReceived || {})}

Instrucciones:
- Redacta una crónica de la partida súper divertida, irónica, gamberra y muy picante.
- Asigna un "Rol o Título de Fiesta" ingenioso a cada jugador según sus estadísticas (ej. "Rafa: Hígado de Adamantio por sus 15 tragos", "Ana: La Cobardica Mayor por pasar de 3 retos").
- Describe con humor la transcurso del juego y los piques.
- Estructura el texto en párrafos cortos, desenfadados y con emojis festivos. Máximo 150 palabras.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "chronicle".
- Escribe en español.

Formato JSON esperado:
{
  "chronicle": "El texto humorístico completo de la crónica en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.chronicle || null;
}

/**
 * 6. Actuar como Juez del Bar resolviendo una disputa en caliente
 */
export async function geminiResolveDispute(
  players: string[],
  disputeText: string
): Promise<string | null> {
  const prompt = `
Eres el "Juez de la Barra", un árbitro de bar de copas legendario, sabio, sarcástico y sumamente divertido.
Varios amigos jugando al juego de fiesta BEEP tienen una disputa acalorada y requieren que dictes sentencia.
Jugadores involucrados: ${players.join(', ')}
Descripción de la disputa: "${disputeText}"

Instrucciones:
- Analiza la disputa con mucha ironía y humor.
- Dicta una sentencia firme y graciosa de quién tiene la razón y quién tiene que ser castigado o beber.
- Sé contundente, no te andes con rodeos. Sé canalla pero amigable. Máximo 2-3 frases.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "ruling".
- Escribe en español.

Formato JSON esperado:
{
  "ruling": "Tu divertida y firme sentencia arbitral en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.ruling || null;
}

/**
 * 7. Generar un castigo en vivo personalizado (Ruleta de Castigos)
 */
export async function geminiGenerateCustomPunishment(
  playerName: string,
  statsSummary: string
): Promise<string | null> {
  const theme = getPartyTheme();
  const themePrompt = theme ? ` El castigo debe estar inspirado en el tema especial de la fiesta: "${theme}".` : '';

  const prompt = `
Eres el motor de tortura divertida y gamberra del juego de fiesta BEEP.
El jugador "${playerName}" ha decidido no beber tragos y en su lugar quiere someterse a la Ruleta de Castigos de la IA.
Estadísticas del jugador: ${statsSummary}.${themePrompt}

Instrucciones:
- Genera un castigo único, atrevido, físico o social, que tenga que realizar el jugador en vivo frente al grupo.
- Ejemplos: Hacer una llamada a alguien y decirle algo loco, dejar que otro jugador le envíe un mensaje en WhatsApp, actuar de forma graciosa durante un turno, etc.
- El castigo debe ser realizable, seguro pero muy divertido y ligeramente vergonzoso para generar risas en el grupo.
- Mantén el texto corto (máximo 1-2 frases).
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "punishment".
- Escribe en español.

Formato JSON esperado:
{
  "punishment": "La descripción del castigo a realizar en español"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.punishment || null;
}

/**
 * 8. Generar una ronda del Impostor personalizada con IA (con soporte de tema)
 */
export async function geminiGenerateImpostorRound(): Promise<{ category: string; word: string; fakeWord: string; hint: string } | null> {
  const theme = getPartyTheme();
  const themePrompt = theme 
    ? `\n- Tema especial de la fiesta de hoy: "${theme}". ES OBLIGATORIO que los términos generados encajen de forma divertidísima con este tema.` 
    : '';

  const prompt = `
Eres el motor de IA del juego de fiesta BEEP. Tu misión es generar una ronda del juego del "Impostor".
En este juego, la mayoría de los jugadores recibe la palabra real ("word"), mientras que el Impostor recibe la palabra falsa ("fakeWord") o una pista ligeramente descolorida. También hay un tema general o categoría ("category") y una pista general común ("hint").

Genera una ronda súper divertida, picante o ingeniosa.${themePrompt}

Instrucciones:
- "category": El tema general o categoría (ej. "Comida rápida", "Posturas de yoga", "Cosas de resaca").
- "word": La palabra real que el grupo recibirá (ej. "Hamburguesa").
- "fakeWord": La palabra falsa que el impostor recibirá (debe ser muy parecida o del mismo tipo para que pueda disimular, pero distinta, ej. "Kebab").
- "hint": Una pista general que se lee en voz alta para toda la mesa (ej. "Se come con las manos y da sed").
- IMPORTANTE: Devuelve un objeto JSON válido con las cuatro propiedades indicadas.
- Escribe en español.

Formato JSON esperado:
{
  "category": "La categoría",
  "word": "La palabra real",
  "fakeWord": "La palabra falsa",
  "hint": "La pista general"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  if (result && result.category && result.word && result.fakeWord && result.hint) {
    return result;
  }
  return null;
}

/**
 * 9. Generar análisis de perfil hilarante (Entrenador IA)
 */
export async function geminiGenerateProfileCoach(
  playerName: string,
  stats: {
    level: number;
    xp: number;
    gamesPlayed: number;
    gamesWon: number;
    megamixWins: number;
    clasicoWins: number;
    picanteWins: number;
    pokerChips: number;
    parchisWins: number;
  }
): Promise<string | null> {
  const prompt = `
Eres el "AI Party Coach", un entrenador de fiesta legendario, sarcástico, exagerado y sumamente divertido.
Analiza el perfil histórico del jugador "${playerName}" a partir de sus estadísticas acumuladas de juego y redacta un informe/diagnóstico hilarante sobre su personalidad fiestera:
Estadísticas históricas:
- Nivel de jugador: ${stats.level}
- XP total: ${stats.xp}
- Partidas totales jugadas: ${stats.gamesPlayed}
- Partidas ganadas: ${stats.gamesWon}
- Victorias en Megamix: ${stats.megamixWins}
- Victorias en Clásico: ${stats.clasicoWins}
- Victorias en Picante: ${stats.picanteWins}
- Fichas ganadas en Poker: ${stats.pokerChips}
- Victorias en Parchís: ${stats.parchisWins}

Instrucciones:
- Crea un informe/diagnóstico canalla, sarcástico y muy divertido sobre su estilo de juego.
- Invierte mucha personalidad: ponle un mote descabellado y divertido (ej. "Rafa 'El Hígado de Acero'", "Carlos 'El Amagador Silencioso'").
- Haz chistes sobre si juega mucho pero no gana nada, si solo juega al póker de farol, o si es un crack en los retos atrevidos pero le teme a la mímica.
- Dale un "Consejo Científico de Fiesta" hilarante y absurdo al final (ej. "Consejo: Bebe más agua para diluir la vergüenza del próximo Yo Nunca").
- Estructura el texto con emojis de fiesta y párrafos muy ágiles. Máximo 100-120 palabras.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "coachAnalysis".
- Escribe en español.

Formato JSON esperado:
{
  "coachAnalysis": "El texto del diagnóstico en español con formato Markdown y emojis"
}
No devuelvas nada más que el objeto JSON.
`;

  const result = await callGemini(prompt);
  return result?.coachAnalysis || null;
}

/**
 * 10. Generar preguntas de cultura/trivia a partir de las confesiones del lobby
 */
export async function geminiGenerateSecretsTrivia(
  secrets: { playerName: string; secret: string }[]
): Promise<any[] | null> {
  const prompt = `
Eres el motor de IA del juego de fiesta BEEP.
Aquí tienes una lista de confesiones y secretos anónimos introducidos por los propios jugadores en el lobby:
${JSON.stringify(secrets)}

Tu misión es crear preguntas de opción múltiple divertidísimas (tipo trivia/quiz de chismes) para adivinar de quién es cada confesión.
Instrucciones:
- Para cada secreto/confesión relevante, crea una pregunta graciosa y salseante.
- Ejemplo: "Alguien de este grupo confesó: 'Una vez me detuvieron por hacer ruido en el parque'. ¿Quién de estos sospechosos cometió tal atrocidad?"
- Genera 4 opciones de respuesta ("options"), que deben ser nombres reales de los jugadores participantes (¡saca los nombres de la lista de confesiones!).
- Indica la respuesta correcta ("correct_answer") que debe ser exactamente el nombre del jugador que confesó ese secreto.
- Indica el índice de la respuesta correcta en la lista de opciones ("correctIndex", 0-indexed).
- Asigna una dificultad de 2 a 4.
- Agrega una pista divertida ("hint") si es posible.
- IMPORTANTE: Devuelve un array JSON válido de objetos pregunta. Cada objeto debe tener la estructura indicada abajo.
- Escribe en español.

Formato JSON esperado:
[
  {
    "question": "¿Quién de los presentes confesó: '...'?",
    "options": ["Nombre1", "Nombre2", "Nombre3", "Nombre4"],
    "correctIndex": 1,
    "hint": "Una pista graciosa...",
    "difficulty": 3,
    "category": "Quiz de Chismes 🤫"
  }
]
No devuelvas nada más que el array JSON.
`;

  const result = await callGemini(prompt);
  return result || null;
}
