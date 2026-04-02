/**
 * Robust utility to recover corrupted UTF-8 sequences misread as Latin-1/ISO-8859-1.
 * Handles complex emojis like the Spanish flag (ÐŸ‡ªðŸ‡¸ -> 🇪🇸).
 */

const CORRUPTION_MAP: Record<string, string> = {
  'ÐŸ™ˆ': '🙊',
  'ðŸ °': '🍰',
  'ÐŸ º': '🍺',
  'ðŸ‚': '🥂',
  'ÐŸ”¥': '🔥',
  'ðŸ’€': '💀',
  'ÐŸŽ²': '🎲',
  'ðŸ‘€': '👀',
  'ÐŸ’¬': '💬',
  'ÐŸŽ‰': '🎉',
  'ðŸš€': '🚀',
  'ÐŸ‡ªðŸ‡¸': '🇪🇸',
  'ÐŸ‡²': '🇲🇽',
  'ÐŸ‡º': '🇺🇸',
  'ðŸŽµ': '🎵',
  'ðŸ’ƒ': '💃',
  'ðŸ🕺': '🕺',
  'SIN S /NO': 'SIN SÍ/NO',
  'V CTIMA': 'VÍCTIMA',
  'EL CR TICO': 'EL CRÍTICO'
};

/**
 * Aggressive recovery for UTF-8 bytes read as single characters.
 */
const recoverUTF8 = (str: string): string => {
  try {
    // This is the "Gold Standard" for fixing double-encoding in JS
    // It works for sequences like "Ã¡" -> "á"
    return decodeURIComponent(escape(str));
  } catch (e) {
    // If it fails (invalid UTF-8), try to fix parts of it
    return str.replace(/[\u00C0-\u00FF][\u0080-\u00BF]+/g, (match) => {
      try {
        return decodeURIComponent(escape(match));
      } catch {
        return match;
      }
    });
  }
};

export const cleanGameText = (text: string): string => {
  if (!text) return text;

  let cleaned = text;

  // 1. Manual map for persistent offenders
  Object.entries(CORRUPTION_MAP).forEach(([corrupt, fixed]) => {
    cleaned = cleaned.split(corrupt).join(fixed);
  });

  // 2. Automated UTF-8 recovery
  cleaned = recoverUTF8(cleaned);

  // 3. Final polish for remaining Unicode Replacement Characters or common artifacts
  cleaned = cleaned.replace(/\uFFFD/g, (match, offset, str) => {
    const context = str.toLowerCase();
    if (context.includes('si/no')) return 'Í';
    if (context.includes('victima')) return 'Í';
    if (context.includes('critico')) return 'Í';
    return ''; 
  });

  // 4. Special case for the common "ÐŸ" prefix in many emojis
  if (cleaned.includes('ÐŸ')) {
    cleaned = cleaned.replace(/ÐŸ[\u0080-\u00BF][\u0080-\u00BF][\u0080-\u00BF]/g, (m) => {
       try { return decodeURIComponent(escape(m)); } catch { return m; }
    });
  }

  return cleaned;
};
