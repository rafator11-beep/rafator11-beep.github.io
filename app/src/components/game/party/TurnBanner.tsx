import { motion } from 'framer-motion';
import type { TurnInfo } from '@/components/game/SpectatorView';

interface Props {
  turn: TurnInfo | null;
  /** El jugador de turno tiene la partida abierta en su móvil. */
  connected: boolean;
  captainName?: string;
}

// Si el de turno no tiene la partida en su móvil (lo normal: muchas veces no
// se conecta nadie), el capitán se la lee en voz alta desde ya, sin esperar.
export function TurnBanner({ turn, connected, captainName }: Props) {
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
      ) : captainName && !isCaptainOwnTurn ? (
        <span className="text-amber-200"> · 📢 {captainName}, léesela en voz alta</span>
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
