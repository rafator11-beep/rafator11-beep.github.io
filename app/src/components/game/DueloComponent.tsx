import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, ArrowLeft, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';

interface DueloComponentProps {
  dueloText: string;
  player1: Player;
  player2: Player;
  onWinner: (winner: Player) => void;
  onSkip: () => void;
}

export function DueloComponent({ dueloText, player1, player2, onWinner, onSkip }: DueloComponentProps) {
  const [phase, setPhase] = useState<'duel' | 'result'>('duel');
  const [winner, setWinner] = useState<Player | null>(null);

  // TTS Removed
  useEffect(() => {
    if (!dueloText) return;
    window.speechSynthesis.cancel();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [dueloText]);

  const handleDeclareWinner = (winningPlayer: Player) => {
    setWinner(winningPlayer);
    setPhase('result');

    setTimeout(() => {
      onWinner(winningPlayer);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-sm mx-auto h-auto max-h-[85vh] min-h-[400px] flex flex-col relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-b from-orange-600 to-red-900"
    >
      <div className="absolute inset-0 bg-[url('/modern_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="relative z-10 flex flex-col h-full p-4 md:p-6 pb-6 overflow-y-auto slim-scroll">
        
        {/* Header / Falso Logo */}
        <div className="flex flex-col items-center transform transition-all duration-300 group-hover:scale-105 shrink-0 mb-4 pt-2">
            <span className="text-6xl mb-[-5px] drop-shadow-2xl z-10">⚔️</span>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-center leading-[0.85] w-full flex items-center justify-center">
                ¡DUELO!
            </h1>
        </div>

        {/* Duel Phase */}
        {phase === 'duel' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Players Face Off */}
            <div className="flex items-center justify-center gap-6 my-4 shrink-0">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-2 shadow-lg overflow-hidden border-2 border-white/50">
                  {player1?.avatar_url ? (
                    <img src={player1.avatar_url} alt={player1.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{player1?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <p className="font-extrabold text-white drop-shadow-md text-sm uppercase tracking-widest">{player1?.name || 'J1'}</p>
              </div>

              <span className="text-3xl animate-pulse drop-shadow-lg">VS</span>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-2 shadow-lg overflow-hidden border-2 border-white/50">
                  {player2?.avatar_url ? (
                    <img src={player2.avatar_url} alt={player2.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{player2?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <p className="font-extrabold text-white drop-shadow-md text-sm uppercase tracking-widest">{player2?.name || 'J2'}</p>
              </div>
            </div>

            {/* Central Box - Borderless dark pill */}
            <div className="w-full p-6 py-6 rounded-[2rem] flex flex-col items-center text-center shadow-2xl relative bg-black/40 backdrop-blur-md shrink-0 mb-4">
              <p className="text-xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">{dueloText}</p>
            </div>

            {/* Winner Selection */}
            <div className="mt-auto flex flex-col w-full shrink-0 gap-3">
              <p className="text-center text-xs font-bold text-white/70 uppercase tracking-widest mb-1">
                ¿Quién gana?
              </p>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <Button
                  onClick={() => handleDeclareWinner(player1)}
                  className="py-6 rounded-2xl bg-white text-blue-700 hover:bg-slate-100 font-extrabold shadow-lg"
                >
                  <Trophy className="w-5 h-5 mr-1" />
                  {player1?.name}
                </Button>
                <Button
                  onClick={() => handleDeclareWinner(player2)}
                  className="py-6 rounded-2xl bg-white text-red-700 hover:bg-slate-100 font-extrabold shadow-lg"
                >
                  <Trophy className="w-5 h-5 mr-1" />
                  {player2?.name}
                </Button>
              </div>

              {/* Skip */}
              <Button variant="ghost" onClick={onSkip} className="w-full rounded-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs">
                Saltar duelo
              </Button>
            </div>
          </motion.div>
        )}

        {/* Result Phase */}
        {phase === 'result' && winner && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">🏆</div>
            <h3 className="text-3xl font-black italic mb-2 text-white drop-shadow-lg text-balance">¡{winner.name} gana!</h3>
            <p className="text-xl text-yellow-300 font-extrabold">+50 puntos</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
