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

  const TRENDS_2025 = `Referencias y tendencias actuales (2025) que puedes usar para hacer los retos más frescos y virales:
- Series/pelis: La Casa de Papel (nueva temporada), Stranger Things final, Squid Game S2, La Mesías, Sé quién eres, Un lugar tranquilo
- Música: Bad Bunny, Karol G, Bizarrap sessions, Quevedo, Aitana, C. Tangana, Rosalía virales, reggaeton nuevo
- Memes/viral: "Sí señor", "Bro realmente pensó", "Que me quiten lo bailao", el baile de Saltburn, trends TikTok España 2025
- Tecnología: ChatGPT en la vida diaria, deepfakes, vídeollamadas de trabajo, influencers, OnlyFans cultura
- Deportes: Eurovisión España, Rafa Nadal retirada, Real Madrid, Barça, La Roja, nuevo escándalo fútbol
- Cultura pop española: Operación Triunfo, programas de TV, memes de Twitter/X España`;

  const prompt = `
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP. Año: 2025.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${players.join(', ')}.${themePrompt}

Historial reciente de la partida (úsalo para crear piques y rivalidades entre jugadores):
${JSON.stringify(events.slice(-15))}

${TRENDS_2025}

Instrucciones:
- Crea una carta con un reto único. Puede ser: "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1", "Castigo" o "🛌 En la cama y...".
- OBLIGATORIO: usa referencias de tendencias 2025 de la lista de arriba para hacer el reto más actual y gracioso.
- Ocasionalmente genera "🛌 En la cama y..." con doble sentido por turnos (Ej: '¡Está muy caliente!', '¡Cabe otro!').
- Sé muy divertido, sarcástico, irónico y atrevido (mayores de 18, fiesta en bar o casa).
- OBLIGATORIO: menciona a uno o varios jugadores por su nombre real (${players.join(', ')}). NUNCA uses '{player}'.
- La salida es un JSON con la propiedad "card". Solo JSON, nada más.

{"card": "texto del reto en español"}
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

  const TRENDS_2025 = `Tendencias 2025 que puedes citar para hacer el salseo más viral: Bad Bunny, Karol G, Bizarrap, La Mesías, Squid Game S2, memes TikTok España, ChatGPT en el trabajo, Saltburn baile, Rafa Nadal retirada, Eurovisión, operación triunfo, "Bro realmente pensó", streamers españoles.`;

  const prompt = `
Eres el motor de salseo del juego de fiesta BEEP (2025). Añades ironía, dinamismo y referencias actuales a los retos usando los nombres y stats de los jugadores.
Reto original: "${challengeText}"
Protagonista del turno: "${activePlayerName}"
Jugadores: ${playerNames.join(', ')}
Stats (úsalos de forma sarcástica): ${playerStats}${themePrompt}
${TRENDS_2025}

Instrucciones:
- Reescribe el reto integrando nombres, stats y alguna referencia de tendencia 2025 de forma natural y graciosa.
- El protagonista es "${activePlayerName}". Involucra a ${playerNames.filter(n => n !== activePlayerName).join(', ') || 'los demás'} por nombre.
- Si hay "🛌" o "En la cama y...", mantén el formato de ronda de doble sentido con 2 ejemplos pícaros al final.
- Pulla divertida sobre quién lleva más tragos 🍻 o quién está fallando.
- Mantén la esencia del reto (duelo→duelo, beber→beber).
- Solo JSON: {"enriched": "texto reescrito en español"}
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
