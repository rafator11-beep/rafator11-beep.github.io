import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/types/game';
import type { NormaInfractions } from '@/utils/megamixNormas';

interface Props {
  text: string;
  turnsLeft: number;
  players: Player[];
  infractions: NormaInfractions;
  onReport: (playerId: string) => void;
}

// Norma activa + botón para chivarse. Pensado para el móvil compartido:
// botones grandes y la lista de jugadores solo aparece al pulsar "¡Pillado!".
export function NormaBanner({ text, turnsLeft, players, infractions, onReport }: Props) {
  const [picking, setPicking] = useState(false);
  const caught = players
    .filter((p) => (infractions[p.id] ?? 0) > 0)
    .sort((a, b) => (infractions[b.id] ?? 0) - (infractions[a.id] ?? 0));

  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 mx-auto mb-3 w-full max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 shadow-[0_0_24px_rgba(245,158,11,0.15)]"
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xl">📜</span>
        <p className="line-clamp-2 flex-1 text-sm font-bold leading-tight text-amber-100">{text}</p>
        {turnsLeft > 0 && (
          <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300">
            {turnsLeft} turnos
          </span>
        )}
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          className="shrink-0 rounded-xl border border-red-400/50 bg-red-500/20 px-3 py-2 text-xs font-black uppercase text-red-100 active:scale-95"
        >
          {picking ? 'Cerrar' : '🚨 ¡Pillado!'}
        </button>
      </div>

      {caught.length > 0 && !picking && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {caught.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-200"
            >
              {p.name} ×{infractions[p.id]}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {picking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mb-1.5 mt-2 text-center text-[11px] font-semibold text-amber-200/70">
              ¿Quién ha incumplido la norma?
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onReport(p.id);
                    setPicking(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 text-sm font-bold text-white active:scale-95"
                >
                  {p.name}
                  {(infractions[p.id] ?? 0) > 0 && (
                    <span className="ml-1 text-red-300">×{infractions[p.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
