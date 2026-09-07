/**
 * Generador de cartas "sorpresa" — 100 % local, sin IA ni backend.
 * (Antes llamaba a Gemini/Ollama; ahora usa plantillas + los jugadores reales.)
 */

export interface AIChallengeResponse {
  content: string;
  type: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
}

const rnd = () => Math.random();
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

const YO_NUNCA = [
  'Yo nunca he mandado un mensaje y me he arrepentido a los 2 segundos.',
  'Yo nunca he fingido una llamada para escapar de una conversación.',
  'Yo nunca me he reído en un momento totalmente inapropiado.',
  'Yo nunca he mirado el móvil de alguien sin permiso.',
  'Yo nunca he vuelto con un/a ex sabiendo que era mala idea.',
  'Yo nunca he echado la culpa a otra persona por algo que hice yo.',
];
const RETOS = [
  (a: string, b: string) => `Reto: ${a}, dile a ${b} un piropo tan exagerado que dé vergüenza ajena. Si te cortas, bebes 2.`,
  (a: string, b: string) => `Reto: ${a} y ${b} hacen un pulso. El que pierda bebe el doble esta ronda.`,
  (a: string) => `Reto: ${a} habla 30 segundos sin parar sobre por qué es el mejor jugador de la mesa. Sin pruebas.`,
  (a: string, b: string) => `Reto: ${a} imita a ${b}. Si ${b} no se ríe, bebe ${b}.`,
  (a: string) => `Reto: ${a} enseña la última foto de su galería o bebe 3.`,
  (a: string, b: string) => `Reto: ${a} y ${b} intercambian un secreto. El que dude más de 5s, bebe.`,
];

export const generateAIChallenge = async (
  players: { name: string }[],
  currentMode: string,
  _intensity: 'soft' | 'medium' | 'hard' = 'medium',
): Promise<AIChallengeResponse> => {
  const names = (players || []).map(p => p.name).filter(Boolean);
  const a = names.length ? pick(names) : 'Tú';
  const b = names.filter(n => n !== a).length ? pick(names.filter(n => n !== a)) : a;

  const type = pick<AIChallengeResponse['type']>(['common', 'common', 'rare', 'legendary', 'chaos']);

  if (currentMode === 'yo_nunca') {
    return { content: pick(YO_NUNCA), type };
  }
  const tmpl = pick(RETOS);
  return { content: tmpl(a, b), type };
};
