// Detecta si una carta pide algo "en N segundos" para poder mostrar un
// cronómetro real en vez de dejar que la gente cuente de memoria.
export function extractTimeLimitSeconds(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(\d{1,3})\s*segundos?/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  // Cartas largas tipo "normas activas 300 segundos" o similares no son un
  // reto cronometrado de reacción — nos quedamos solo con rangos razonables.
  if (!Number.isFinite(n) || n <= 0 || n > 90) return null;
  return n;
}
