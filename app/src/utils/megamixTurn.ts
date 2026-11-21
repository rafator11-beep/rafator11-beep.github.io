import { isIndividualCard } from '@/data/gameContent';
import type { TurnInfo } from '@/components/game/SpectatorView';

// De quién es la carta actual en los modos estructurados:
// - individual → el jugador de turno.
// - grupal     → la abre siempre el capitán (si aún no hay, el de turno).
// Los eventos (TRIGGER:) tienen su propia pantalla y no llevan aviso.
export function getTurnInfo(params: {
  rawCard: string;
  currentPlayerName?: string;
  captainName?: string;
  cardNumber: number;
}): TurnInfo | null {
  const { rawCard, currentPlayerName, captainName, cardNumber } = params;
  if (!rawCard || rawCard.startsWith('TRIGGER:')) return null;
  if (isIndividualCard(rawCard)) {
    return currentPlayerName ? { kind: 'individual', name: currentPlayerName, cardNumber } : null;
  }
  const opener = captainName || currentPlayerName;
  return opener ? { kind: 'grupal', name: opener, cardNumber } : null;
}
