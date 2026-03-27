import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Home, RotateCcw, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface PodiumPlayer {
  id: string;
  name: string;
  score: number;
  avatar_url?: string;
}

interface PodiumScreenProps {
  players: PodiumPlayer[];
  onRestart: () => void;
  onHome: () => void;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 2000;
    let incrementTime = (totalDuration / end) > 10 ? (totalDuration / end) : 10;

    let timer = setInterval(() => {
      start += Math.ceil(end / 100);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="font-arcade">{displayValue}</span>;
};

export const PodiumScreen = ({ players, onRestart, onHome }: PodiumScreenProps) => {
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 3);
  const winner = sortedPlayers[0];

  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-[#050505] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-5xl font-black text-white font-arcade tracking-tighter mb-2">
          FIN DE LA PARTIDA
        </h1>
        <p className="text-primary font-arcade text-xs uppercase tracking-[0.4em]">Resultados Finales</p>
      </motion.div>

      {/* Podium */}
      <div className="relative w-full max-w-lg h-64 mt-20 flex items-end justify-center gap-2 md:gap-4 mb-16">
        {/* Second Place */}
        {sortedPlayers[1] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '70%', opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="mb-4 relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 overflow-hidden shadow-xl">
                 {sortedPlayers[1].avatar_url ? (
                   <img src={sortedPlayers[1].avatar_url} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400">
                     {sortedPlayers[1].name[0].toUpperCase()}
                   </div>
                 )}
              </div>
              <div className="absolute -top-3 -right-2 bg-slate-400 text-black w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center">2</div>
            </div>
            <div className="w-full bg-slate-800/80 border-t-4 border-slate-400 p-4 text-center rounded-t-xl shadow-2xl backdrop-blur-md h-full">
              <p className="text-white font-black text-xs uppercase truncate mb-1">{sortedPlayers[1].name}</p>
              <p className="text-slate-400 font-arcade text-lg"><AnimatedCounter value={sortedPlayers[1].score} /> XP</p>
            </div>
          </motion.div>
        )}

        {/* First Place */}
        {sortedPlayers[0] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '90%', opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex-1 flex flex-col items-center relative z-20"
          >
            <div className="mb-6 relative">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2"
              >
                <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
              </motion.div>
              <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                 {sortedPlayers[0].avatar_url ? (
                   <img src={sortedPlayers[0].avatar_url} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-3xl font-black text-yellow-400">
                     {sortedPlayers[0].name[0].toUpperCase()}
                   </div>
                 )}
              </div>
              <div className="absolute -top-3 -right-2 bg-yellow-400 text-black w-8 h-8 rounded-xl font-black text-base flex items-center justify-center shadow-lg">1</div>
            </div>
            <div className="w-full bg-gradient-to-b from-yellow-500/20 to-slate-800/80 border-t-8 border-yellow-400 p-4 text-center rounded-t-2xl shadow-[0_-15px_50px_rgba(250,204,21,0.2)] backdrop-blur-md h-full border-x-4 border-yellow-400/20">
              <p className="text-white font-black text-base uppercase truncate mb-1">{sortedPlayers[0].name}</p>
              <p className="text-yellow-400 font-arcade text-2xl font-bold"><AnimatedCounter value={sortedPlayers[0].score} /> XP</p>
            </div>
          </motion.div>
        )}

        {/* Third Place */}
        {sortedPlayers[2] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '55%', opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="mb-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-700 overflow-hidden shadow-xl">
                 {sortedPlayers[2].avatar_url ? (
                   <img src={sortedPlayers[2].avatar_url} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-lg font-black text-amber-700">
                     {sortedPlayers[2].name[0].toUpperCase()}
                   </div>
                 )}
              </div>
              <div className="absolute -top-3 -right-2 bg-amber-700 text-white w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center">3</div>
            </div>
            <div className="w-full bg-slate-800/80 border-t-4 border-amber-700 p-4 text-center rounded-t-xl shadow-2xl backdrop-blur-md h-full">
              <p className="text-white font-black text-xs uppercase truncate mb-1">{sortedPlayers[2].name}</p>
              <p className="text-amber-700 font-arcade text-base"><AnimatedCounter value={sortedPlayers[2].score} /> XP</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex flex-col w-full max-w-sm gap-4 relative z-10"
      >
        <Button
          onClick={onRestart}
          className="h-16 bg-white text-black hover:bg-white/90 font-arcade font-black text-lg rounded-2xl shadow-xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all"
        >
          <RotateCcw className="w-5 h-5 mr-3" />
          NUEVA PARTIDA
        </Button>
        <Button
          variant="outline"
          onClick={onHome}
          className="h-14 border-2 border-white/10 bg-white/5 text-white font-arcade font-bold text-sm rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all"
        >
          <Home className="w-4 h-4 mr-2" />
          VOLVER AL INICIO
        </Button>
      </motion.div>
    </div>
  );
};
