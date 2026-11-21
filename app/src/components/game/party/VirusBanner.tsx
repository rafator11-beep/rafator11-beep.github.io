import { motion } from 'framer-motion';
import type { Player, PlayerVirus } from '@/types/game';
import { roundsLabel } from '@/utils/megamixViruses';

interface Props {
  viruses: PlayerVirus[];
  players: Player[];
  /** Pillado incumpliendo su virus. */
  onCatch: (playerId: string) => void;
}

// Infectados siempre a la vista: quién, qué virus y cuántas rondas le quedan.
// Tocar 🚨 = le habéis pillado incumpliéndolo.
export function VirusBanner({ viruses, players, onCatch }: Props) {
  if (viruses.length === 0) return null;
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 mx-auto mb-3 w-full max-w-md rounded-2xl border border-green-500/40 bg-green-500/10 px-3 py-2"
    >
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-green-400">
        🦠 Infectados
      </p>
      <div className="flex flex-col gap-1.5">
        {viruses.map((v) => (
          <div key={v.playerId} className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm leading-tight text-white/85">
              <b className="text-white">{name(v.playerId)}</b>
              <span className="text-green-300"> · {v.virusName}</span>
              <span className="block truncate text-[11px] text-white/50">{v.virusDescription}</span>
            </p>
            <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black text-green-300">
              {roundsLabel(v.turnsRemaining)}
            </span>
            {(v.caught ?? 0) > 0 && (
              <span className="shrink-0 text-[11px] font-bold text-red-300">×{v.caught}</span>
            )}
            <button
              type="button"
              onClick={() => onCatch(v.playerId)}
              aria-label={`Pillado: ${name(v.playerId)}`}
              className="shrink-0 rounded-xl border border-red-400/50 bg-red-500/20 px-2.5 py-1.5 text-xs font-black text-red-100 active:scale-95"
            >
              🚨
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
