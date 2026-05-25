/**
 * Cliente de integración directa con Google Gemini 1.5 Flash.
 * Realiza peticiones HTTP directas (sin dependencias de SDKs grandes)
 * y devuelve respuestas estructuradas forzando formato JSON.
 */

const GEMINI_MODEL = 'gemini-1.5-flash';

// Obtener la API Key desde las variables de entorno o desde localStorage (ajustes en caliente)
export function getGeminiApiKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_GEMINI_API_KEY || localStorage.getItem('fiesta_gemini_key') || '';
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return typeof key === 'string' && key.trim().length > 0 && !key.includes('placeholder');
}

/**
 * Función genérica de llamada a Gemini con salida JSON forzada
 */
async function callGemini(prompt: string): Promise<any | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('Gemini Client: No API Key configured');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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
      console.error(`Gemini Client: API error (${response.status}):`, errText);
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
 * 1. Generar una nueva carta/reto personalizada
 */
export async function geminiGenerateCard(events: any[], players: string[]): Promise<string | null> {
  const prompt = `
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${players.join(', ')}.
Aquí tienes el historial reciente de eventos del juego para darte contexto y poder crear rivalidades o piques divertidos:
${JSON.stringify(events.slice(-15))}

Instrucciones de generación:
- Crea una carta con un reto único. Puede ser del tipo "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1" o "Castigo".
- Sé muy divertido, sarcástico, irónico y ligeramente atrevido (apto para mayores de 18 años jugando de fiesta en un bar o casa).
- Involucra a los jugadores activos y haz referencia a su historial de eventos si es gracioso (ej. si alguien lleva muchos tragos, se niega a confesar, o va invicto).
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
 * 2. Enriquecer un reto existente con estadísticas y salseo
 */
export async function geminiEnrichChallenge(
  challengeText: string,
  playerStats: string,
  playerNames: string[]
): Promise<string | null> {
  const prompt = `
Eres el motor de IA del juego de fiesta BEEP. Tu misión es añadir salseo, ironía y dinamismo a un reto existente utilizando la memoria real de los jugadores involucrados.
Reto original: "${challengeText}"
Jugadores implicados en este reto: ${playerNames.join(', ')}
Estadísticas de estos jugadores (¡úsalas de forma sarcástica para picarlos o justificar el reto!):
${playerStats}

Instrucciones:
- Reescribe el reto original de forma ingeniosa para integrar sus estadísticas de forma orgánica.
- Haz chistes o pullas divertidas sobre quién va ganando, quién lleva más tragos 🍻, o quién no da pie con bola.
- Mantén la esencia del reto original (si es un duelo, que siga siendo un duelo; si es beber, que siga siendo beber) pero haz que parezca personalizado en vivo por un presentador de televisión gamberro.
- Si el reto original requiere beber tragos, puedes adaptarlos un poco según las estadísticas (ej. "Rafa que lleva 0 tragos bebe el doble para compensar").
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
