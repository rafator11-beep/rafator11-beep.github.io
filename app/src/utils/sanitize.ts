/**
 * Utility to fix corrupted characters from encoding mismatches.
 * Handles UTF-8 misread as Latin-1/ISO-8859-1 (e.g., ÐŸ™ˆ -> 🙊).
 */

const CORRUPTION_MAP: Record<string, string> = {
  'ÐŸ™ˆ': '🙊',
  'ðŸ°': '🍰',
  'ÐŸº': '🍺',
  'ðŸ¥‚': '🥂',
  'ÐŸ”¥': '🔥',
  'ðŸ’€': '💀',
  'ÐŸŽ²': '🎲',
  'ðŸ‘€': '👀',
  'ÐŸ’¬': '💬',
  'ÐŸŽ‰': '🎉',
  'ðŸš€': '🚀',
  'SIN S /NO': 'SIN SÍ/NO',
  'V CTIMA': 'VÍCTIMA',
  'EL CR TICO': 'EL CRÍTICO'
};

export const cleanGameText = (text: string): string => {
  if (!text) return text;

  let cleaned = text;

  // 1. Check for specific corrupted sequences we know about
  Object.entries(CORRUPTION_MAP).forEach(([corrupt, fixed]) => {
    cleaned = cleaned.split(corrupt).join(fixed);
  });

  // 2. Automated UTF-8 recovery attempt
  // This helps with sequences like "Ã¡" -> "á"
  try {
    const raw = cleaned;
    // This is a classic trick to re-decode UTF-8 that was misread as Latin-1
    const decoded = decodeURIComponent(escape(raw));
    if (decoded.length > 0) {
      cleaned = decoded;
    }
  } catch (e) {
    // If it fails, it wasn't valid UTF-8-as-Latin-1, keep original
  }

  // 3. Final polish for messy symbols (Replacement Character)
  cleaned = cleaned.replace(/\uFFFD/g, (match, offset, str) => {
    // Try to guess based on context (Spanish centric)
    const context = str.toLowerCase();
    if (context.includes('si/no')) return 'Í';
    if (context.includes('victima')) return 'Í';
    if (context.includes('critico')) return 'Í';
    return ''; // Remove if unknown
  });

  return cleaned;
};
