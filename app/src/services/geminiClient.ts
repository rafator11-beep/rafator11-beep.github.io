/**
 * Compatibilidad: este módulo YA NO llama a ninguna IA externa.
 *
 * BEEP se sirve como sitio estático (GitHub Pages) y no hay backend donde
 * guardar una API key de forma segura. Toda la generación de "salseo" es
 * ahora local y determinista — ver src/lib/partyDirector.ts.
 *
 * Se conservan estos nombres de export (`gemini*`) solo para no tocar los
 * imports existentes. Cuando puedas, importa directamente de
 * `@/lib/partyDirector`.
 */
export {
  isGeminiConfigured,
  getGeminiApiKey,
  getPartyTheme,
  geminiEnrichChallenge,
  geminiGenerateCard,
  geminiGenerateTorneoAnnouncement,
  geminiGenerateRoundAnalysis,
  geminiGeneratePartyChronicle,
  geminiResolveDispute,
  geminiGenerateCustomPunishment,
  geminiGenerateImpostorRound,
  geminiGenerateProfileCoach,
  geminiGenerateSecretsTrivia,
} from '@/lib/partyDirector';
