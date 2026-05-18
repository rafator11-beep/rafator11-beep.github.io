import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';
import { TorneoMatch } from '@/hooks/game/useTorneoManager';

interface Props {
  match: TorneoMatch;
  torneoScores: Record<string, { wins: number; losses: number }>;
  onWinner: (winnerId: string, loserId: string) => void;
}

export function TorneoRound({ match, torneoScores, onWinner }: Props) {
  const [phase, setPhase] = useState<'announce' | 'reto' | 'vote'>('announce');
  const [countdown, setCountdown] = useState(3);

  // After announcement, auto-advance to reto after 3s
  useEffect(() => {
    if (phase !== 'announce') return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setPhase('reto'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const { player1, player2, retoText, announcement } = match;

  const PlayerCard = ({ player, side }: { player: Player; side: 'left' | 'right' }) => {
    const score = torneoScores[player.id];
    return (
      <div className={`flex flex-col items-center gap-2 ${side === 'left' ? 'items-end' : 'items-start'}`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-400 flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg shadow-amber-500/30">
          {player.avatar_url
            ? <img src={player.avatar_url} className="w-full h-full object-cover" />
            : player.name[0]?.toUpperCase()
          }
        </div>
        <p className="text-white font-black text-sm">{player.name}</p>
        <div className="flex gap-1 text-xs">
          <span className="bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-bold">{score?.wins || 0}W</span>
          <span className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-bold">{score?.losses || 0}L</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 mb-6"
      >
        <span className="text-3xl">⚔️</span>
        <div className="text-center">
          <p className="text-amber-400 font-black text-xl uppercase tracking-widest">TORNEO</p>
          <p className="text-white/40 text-xs uppercase tracking-widest">Reto head-to-head</p>
        </div>
        <span className="text-3xl">⚔️</span>
      </motion.div>

      {/* Players */}
      <div className="flex items-center gap-4 mb-6 w-full max-w-xs justify-between">
        <PlayerCard player={player1} side="left" />
        <div className="flex flex-col items-center">
          <span className="text-white/30 font-black text-lg">VS</span>
        </div>
        <PlayerCard player={player2} side="right" />
      </div>

      <AnimatePresence mode="wait">
        {/* FASE: ANUNCIO */}
        {phase === 'announce' && (
          <motion.div
            key="announce"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-sm"
          >
            {announcement && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
                <p className="text-amber-200 font-semibold text-sm leading-relaxed">{announcement}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-black text-black text-lg">{countdown}</div>
              <p className="text-white/40 text-xs">Preparando el reto...</p>
            </div>
          </motion.div>
        )}

        {/* FASE: RETO */}
        {phase === 'reto' && (
          <motion.div
            key="reto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center max-w-sm w-full"
          >
            <div className="bg-white/5 border border-white/15 rounded-2xl px-5 py-5">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">El reto es</p>
              <p className="text-white font-bold text-base leading-snug">
                {retoText
                  .replace(/^🎯\s*/,'')
                  .replace(/\{player\}/gi, `${player1.name} y ${player2.name}`)
                  .replace(/bebe \d[^.]*[.!]?/gi,'')
                  .replace(/reparte \d[^.]*[.!]?/gi,'')
                  .trim()}
              </p>
            </div>

            <p className="text-white/50 text-sm">Los dos lo hacen — el grupo decide quién ganó</p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('vote')}
              className="w-full py-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm uppercase tracking-widest"
            >
              ¡Listos! Votar →
            </motion.button>
          </motion.div>
        )}

        {/* FASE: VOTO */}
        {phase === 'vote' && (
          <motion.div
            key="vote"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center w-full max-w-xs"
          >
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold">¿Quién lo hizo mejor?</p>
            <p className="text-white/30 text-xs">El grupo vota. Ganador reparte 3 👑 · Perdedor bebe 3 🍻</p>

            <div className="flex gap-3 w-full">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onWinner(player1.id, player2.id)}
                className="flex-1 py-5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-black text-base flex flex-col items-center gap-1"
              >
                <span className="text-2xl">👑</span>
                {player1.name}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onWinner(player2.id, player1.id)}
                className="flex-1 py-5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-black text-base flex flex-col items-center gap-1"
              >
                <span className="text-2xl">👑</span>
                {player2.name}
              </motion.button>
            </div>

            <button
              onClick={() => onWinner(player1.id, player2.id)}
              className="text-white/20 text-xs underline"
            >
              Empate — ambos reparten 1
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
