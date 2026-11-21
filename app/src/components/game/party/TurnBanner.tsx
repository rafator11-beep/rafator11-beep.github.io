import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { TurnInfo } from '@/components/game/SpectatorView';

// Segundos que se espera a que el jugador de turno mire su móvil antes de
// pedirle al capitán que le lea la prueba en voz alta.
const READ_ALOUD_AFTER_MS = 6000;

interface Props {
  turn: TurnInfo | null;
  /** El jugador de turno tiene la partida abierta en su móvil. */
  connected: boolean;
  captainName?: string;
}

export function TurnBanner({ turn, connected, captainName }: Props) {
  const [askCaptain, setAskCaptain] = useState(false);
  const cardNumber = turn?.cardNumber;
  const needsReader = turn?.kind === 'individual' && !connected;

  useEffect(() => {
    setAskCaptain(false);
    if (!needsReader) return;
    const t = setTimeout(() => setAskCaptain(true), READ_ALOUD_AFTER_MS);
    return () => clearTimeout(t);
  }, [cardNumber, needsReader]);

  if (!turn) return null;

  if (turn.kind === 'grupal') {
    return (
      <Pill tone="amber">
        🎤 Abre: <b className="text-white">{turn.name}</b>
        {captainName === turn.name && <span className="text-amber-200/70"> · capitán</span>}
      </Pill>
    );
  }

  const isCaptainOwnTurn = captainName === turn.name;
  return (
    <Pill tone="fuchsia">
      🎯 Le toca a <b className="text-white">{turn.name}</b>
      {connected ? (
        <span className="text-fuchsia-200/70"> · 📱 mira tu móvil</span>
      ) : askCaptain && captainName ? (
        <span className="text-amber-200">
          {' '}
          · 📢 {isCaptainOwnTurn ? `${turn.name}, léela en voz alta` : `${captainName}, léesela en voz alta`}
        </span>
      ) : null}
    </Pill>
  );
}

function Pill({ tone, children }: { tone: 'amber' | 'fuchsia'; children: React.ReactNode }) {
  const color =
    tone === 'amber'
      ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
      : 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`mx-auto mb-2 w-fit max-w-full rounded-full border px-4 py-1.5 text-center text-sm font-bold ${color}`}
    >
      {children}
    </motion.div>
  );
}
