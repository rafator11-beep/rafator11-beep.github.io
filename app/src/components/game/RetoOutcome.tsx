import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types/game';

interface Props {
  player: Player;
  onResult: (completed: boolean) => void;
}

export function RetoOutcome({ player, onResult }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full max-w-xs flex flex-col items-center gap-6"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black overflow-hidden">
            {player.avatar_url
              ? <img src={player.avatar_url} className="w-full h-full object-cover" />
              : player.name[0]?.toUpperCase()
            }
          </div>
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mt-1">¿Lo ha completado?</p>
          <p className="text-white font-black text-lg">{player.name}</p>
        </div>

        <div className="flex gap-4 w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onResult(false)}
            className="flex-1 flex flex-col items-center gap-1 py-5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 active:bg-red-500/25 transition-all"
          >
            <span className="text-3xl">✗</span>
            <span className="font-black text-sm">No lo hizo</span>
            <span className="text-xs opacity-60">Bebe 3 🍻</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onResult(true)}
            className="flex-1 flex flex-col items-center gap-1 py-5 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 active:bg-green-500/25 transition-all"
          >
            <span className="text-3xl">✓</span>
            <span className="font-black text-sm">¡Lo hizo!</span>
            <span className="text-xs opacity-60">Reparte 2 👑</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
