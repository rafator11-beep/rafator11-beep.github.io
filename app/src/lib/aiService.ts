/**
 * AI Service for BEEP Megamix
 * Connects to local Ollama instance (localhost:11434)
 * Bridge: 19GB Local Inference Model
 */

const OLLAMA_URL = 'http://localhost:11434/v1/chat/completions';

export interface AIChallengeResponse {
  content: string;
  type: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
}

export const generateAIChallenge = async (
  players: any[],
  currentMode: string,
  intensity: 'soft' | 'medium' | 'hard' = 'medium'
): Promise<AIChallengeResponse> => {
  const playerNames = players.map(p => p.name).join(', ');

  const systemPrompt = `Actúa como un Senior Game Designer experto en juegos de fiesta ("Yo Nunca", "Retos", "Picante"). 
  Tu objetivo es generar una única tarjeta de juego creativa, divertida y sorprendente.
  
  CONTEXTO:
  - Jugadores actuales: ${playerNames}
  - Modo: ${currentMode}
  - Intensidad: ${intensity}

  REGLAS:
  1. Si el modo es "yo_nunca", responde con una frase que empiece por "Yo nunca...".
  2. Si el modo es "clasico" o "megamix", responde con un Reto para uno de los jugadores. Ejemplo: "Reto: {player} haz X...".
  3. Usa el formato JSON: { "content": "texto del reto", "type": "common|rare|legendary|chaos|virus" }.
  4. Sé original, evita clichés. Aprovecha que tienes nombres de jugadores para crear piques sanos.
  5. Responde SOLO el JSON.`;

  // Only attempt Ollama on localhost — CORS blocks it from production origins
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!isLocalhost) {
    return {
      content: "La IA solo funciona en modo local. ¡Sigue con las cartas normales!",
      type: 'common'
    };
  }

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama'
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash:latest',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Genera una tarjeta épica para el modo ${currentMode}.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('Ollama not responding');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI');
    }

    // Try to parse JSON from the content
    try {
      const result = JSON.parse(content);
      return {
        content: result.content || "Error en el formato de la IA",
        type: result.type || 'common'
      };
    } catch (e) {
      // If AI didn't return valid JSON, try to clean it or just use the text
      return {
        content: content.replace(/```json|```/g, '').trim(),
        type: 'common'
      };
    }
  } catch (error) {
    console.error('AI Bridge Error:', error);
    return {
      content: "La IA se ha tomado un trago de más y no responde. ¡Sigue con las cartas normales!",
      type: 'common'
    };
  }
};
