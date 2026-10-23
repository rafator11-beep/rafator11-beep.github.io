/**
 * Temas personalizados con contenido generado por IA (Fase 5).
 *
 * Llama SIEMPRE a la Edge Function `generate-card` (modo `theme_batch`), nunca
 * a la API de Gemini directamente desde el cliente — la API key vive solo en
 * el servidor (secreto de Supabase). La función genera un lote de ~18 cartas
 * de una vez y las cachea en Supabase por tema, así que escribir el mismo
 * tema ("Despedida de soltera") en otra partida no vuelve a gastar tokens.
 *
 * Si falla, no hay conexión, o Gemini no está configurado en el servidor,
 * devuelve [] y la partida sigue con el banco de frases normal — nunca bloquea.
 */
import { supabase } from '@/integrations/supabase/client';

// Evita pedir el mismo tema más de una vez por sesión de pestaña (p. ej. si el
// efecto que la llama se re-ejecuta). El caché real de coste vive en Supabase.
const requestedThisSession = new Set<string>();

export async function fetchThemeCards(theme: string): Promise<string[]> {
  const trimmed = (theme || '').trim();
  if (!trimmed) return [];

  const key = trimmed.toLowerCase();
  if (requestedThisSession.has(key)) return [];
  requestedThisSession.add(key);

  try {
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: { mode: 'theme_batch', theme: trimmed },
    });
    if (error || !Array.isArray(data?.cards)) return [];
    return data.cards.filter((c: unknown) => typeof c === 'string' && c.trim().length > 0);
  } catch {
    return [];
  }
}
