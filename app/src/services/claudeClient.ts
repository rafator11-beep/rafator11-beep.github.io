/**
 * Cliente de integración con la API de Claude (Anthropic) via fetch directo.
 * No usa el SDK para evitar incompatibilidades con el bundler de Vite/browser.
 * La API Key se lee de VITE_ANTHROPIC_API_KEY o de localStorage 'fiesta_claude_key'.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';

export function getClaudeApiKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('fiesta_claude_key') || '';
}

export function isClaudeConfigured(): boolean {
  const key = getClaudeApiKey();
  return typeof key === 'string' && key.trim().length > 0 && !key.includes('placeholder');
}

export function getPartyTheme(): string {
  return localStorage.getItem('fiesta_party_theme') || '';
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<any | null> {
  if (!isClaudeConfigured()) {
    console.warn('Claude Client: No API Key configured');
    return null;
  }
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': getClaudeApiKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error(`Claude Client: API error (${response.status})`);
      return null;
    }

    const data = await response.json();
    const raw = (data?.content?.[0]?.text ?? '').trim()
      .replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

    return JSON.parse(raw);
  } catch (error) {
    console.error('Claude Client error:', error);
    return null;
  }
}

// Aliases para compatibilidad con imports previos de geminiClient
export const isGeminiConfigured = isClaudeConfigured;
export const getGeminiApiKey = getClaudeApiKey;

// ── 1. Generar carta/reto personalizado ────────────────────────────────────
export async function geminiGenerateCard(events: any[], players: string[]): Promise<string | null> {
  const theme = getPartyTheme();
  const themeNote = theme ? `\nTema especial de la fiesta: "${theme}". El reto DEBE inspirarse en este tema.` : '';
  const system = `Eres el motor de IA del juego de fiesta BEEP. Generas retos de fiesta divertidos y atrevidos para mayores de 18 años. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Jugadores: ${players.join(', ')}.${themeNote}
Historial reciente: ${JSON.stringify(events.slice(-15))}

Genera un reto único de fiesta (Yo nunca, Reto individual, Verdad, Duelo 1v1, Castigo o En la cama y...). Involucra a los jugadores por su nombre. Tono: irónico, divertido, ligeramente atrevido.

Responde SOLO con: {"card": "texto del reto en español"}`;
  const result = await callClaude(system, user);
  return result?.card || null;
}

// ── 2. Enriquecer reto con salseo ──────────────────────────────────────────
export async function geminiEnrichChallenge(
  challengeText: string,
  playerStats: string,
  playerNames: string[],
  activePlayerName: string
): Promise<string | null> {
  const theme = getPartyTheme();
  const themeNote = theme ? `\nTema especial: "${theme}". Intégralo sutilmente.` : '';
  const system = `Eres el motor de salseo del juego de fiesta BEEP. Reescribes retos añadiendo ironía y referencias a los jugadores. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Reto original: "${challengeText}"
Jugador protagonista: "${activePlayerName}"
Todos los jugadores: ${playerNames.join(', ')}
Estadísticas: ${playerStats}${themeNote}

Reescribe el reto integrando nombres y estadísticas de forma gamberra. Si contiene "🛌" o "En la cama y...", mantén el formato de ronda de doble sentido con 2 ejemplos graciosos.

Responde SOLO con: {"enriched": "texto reescrito en español"}`;
  const result = await callClaude(system, user);
  return result?.enriched || null;
}

// ── 3. Anuncio de duelo de torneo ──────────────────────────────────────────
export async function geminiGenerateTorneoAnnouncement(
  player1: string,
  player2: string,
  retoText: string,
  memory: string[]
): Promise<string | null> {
  const system = `Eres el narrador dramático del juego de fiesta BEEP, estilo presentador de boxeo gamberro. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Duelo: ${player1} vs ${player2}
Reto: "${retoText}"
Historial: ${JSON.stringify(memory)}

Escribe una presentación emocionante y divertida (máx. 2 frases) con mucho hype y piques amistosos.

Responde SOLO con: {"announcement": "texto en español"}`;
  const result = await callClaude(system, user);
  return result?.announcement || null;
}

// ── 4. Análisis de ronda ───────────────────────────────────────────────────
export async function geminiGenerateRoundAnalysis(
  players: string[],
  round: number,
  summary: string[],
  playerStatsDigest: string[]
): Promise<string | null> {
  const system = `Eres el comentarista irónico de bar del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Ronda ${round} terminada. Jugadores: ${players.join(', ')}
Eventos: ${JSON.stringify(summary)}
Stats: ${JSON.stringify(playerStatsDigest)}

Escribe un comentario humorístico de 2-3 frases sobre la ronda con emojis.

Responde SOLO con: {"comment": "texto en español"}`;
  const result = await callClaude(system, user);
  return result?.comment || null;
}

// ── 5. Crónica final para el Podio ─────────────────────────────────────────
export async function geminiGeneratePartyChronicle(
  players: { name: string; score: number }[],
  trackingData: any
): Promise<string | null> {
  const theme = getPartyTheme();
  const themeNote = theme ? `\nTema de la noche: "${theme}".` : '';
  const system = `Eres el cronista cotilla del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Partida terminada.${themeNote}
Jugadores y XP: ${players.map(p => `${p.name}: ${p.score} XP`).join(', ')}
Tragos: ${JSON.stringify(trackingData?.drinkCounts || {})}
Votos: ${JSON.stringify(trackingData?.voteCounts || {})}
Skips: ${JSON.stringify(trackingData?.skipCounts || {})}
Virus: ${JSON.stringify(trackingData?.virusReceived || {})}

Escribe una crónica divertida (máx. 150 palabras) con títulos de fiesta para cada jugador según sus stats.

Responde SOLO con: {"chronicle": "texto en español con emojis"}`;
  const result = await callClaude(system, user);
  return result?.chronicle || null;
}

// ── 6. Juez del Bar ────────────────────────────────────────────────────────
export async function geminiResolveDispute(
  players: string[],
  disputeText: string
): Promise<string | null> {
  const system = `Eres el "Juez de la Barra", árbitro sarcástico y divertido del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Jugadores: ${players.join(', ')}
Disputa: "${disputeText}"

Dicta una sentencia firme y graciosa (máx. 2-3 frases) sobre quién bebe.

Responde SOLO con: {"ruling": "sentencia en español"}`;
  const result = await callClaude(system, user);
  return result?.ruling || null;
}

// ── 7. Castigo personalizado ───────────────────────────────────────────────
export async function geminiGenerateCustomPunishment(
  playerName: string,
  statsSummary: string
): Promise<string | null> {
  const theme = getPartyTheme();
  const themeNote = theme ? ` Inspírate en el tema: "${theme}".` : '';
  const system = `Eres el motor de castigos del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Jugador: "${playerName}". Stats: ${statsSummary}.${themeNote}
Genera un castigo divertido, realizable y ligeramente vergonzoso (máx. 1-2 frases).

Responde SOLO con: {"punishment": "castigo en español"}`;
  const result = await callClaude(system, user);
  return result?.punishment || null;
}

// ── 8. Ronda del Impostor ──────────────────────────────────────────────────
export async function geminiGenerateImpostorRound(): Promise<{ category: string; word: string; fakeWord: string; hint: string } | null> {
  const theme = getPartyTheme();
  const themeNote = theme ? `\nTema especial: "${theme}". Los términos DEBEN encajar con este tema.` : '';
  const system = `Eres el motor del juego del Impostor en BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Genera una ronda del Impostor divertida y original.${themeNote}
- category: tema general
- word: palabra real para el grupo
- fakeWord: palabra falsa para el impostor (similar pero distinta)
- hint: pista general que se lee en voz alta

Responde SOLO con: {"category":"...","word":"...","fakeWord":"...","hint":"..."}`;
  const result = await callClaude(system, user);
  if (result?.category && result?.word && result?.fakeWord && result?.hint) return result;
  return null;
}

// ── 9. AI Party Coach ──────────────────────────────────────────────────────
export async function geminiGenerateProfileCoach(
  playerName: string,
  stats: {
    level: number; xp: number; gamesPlayed: number; gamesWon: number;
    megamixWins: number; clasicoWins: number; picanteWins: number;
    pokerChips: number; parchisWins: number;
  }
): Promise<string | null> {
  const system = `Eres el "AI Party Coach", entrenador de fiesta sarcástico y exagerado de BEEP. Respondes ÚNICAMENTE con JSON válido.`;
  const user = `Jugador: "${playerName}"
Stats: Nivel ${stats.level}, ${stats.xp} XP, ${stats.gamesPlayed} partidas (${stats.gamesWon} ganadas), ${stats.megamixWins} Megamix, ${stats.clasicoWins} Clásico, ${stats.picanteWins} Picante, ${stats.pokerChips} fichas poker, ${stats.parchisWins} Parchís.

Escribe un diagnóstico canalla (máx. 120 palabras) con mote inventado y consejo absurdo al final.

Responde SOLO con: {"coachAnalysis": "texto en español con emojis"}`;
  const result = await callClaude(system, user);
  return result?.coachAnalysis || null;
}

// ── 10. Trivia de secretos del lobby ──────────────────────────────────────
export async function geminiGenerateSecretsTrivia(
  secrets: { playerName: string; secret: string }[]
): Promise<any[] | null> {
  const system = `Eres el motor de trivia de chismes de BEEP. Respondes ÚNICAMENTE con JSON válido (array).`;
  const user = `Confesiones: ${JSON.stringify(secrets)}

Crea preguntas de opción múltiple para adivinar de quién es cada confesión. Formato:
[{"question":"...","options":["Nombre1","Nombre2","Nombre3","Nombre4"],"correctIndex":0,"hint":"...","difficulty":3,"category":"Quiz de Chismes 🤫"}]

Responde SOLO con el array JSON.`;
  return await callClaude(system, user);
}
