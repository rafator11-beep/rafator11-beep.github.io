import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, ChevronLeft, X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  avatar_url?: string;
}

type CaptainCmd = 'drink' | 'virus' | 'norma' | 'all' | 'double' | null;

interface CaptainDecisionPanelProps {
  captainName: string;
  players: Player[];
  drinkCounts: Record<string, number>;
  onDrink: (playerId: string, playerName: string) => void;
  onVirus: (playerId: string, playerName: string) => void;
  onNormaCancel: (playerId: string, playerName: string) => void;
  onAllDrink: () => void;
  onDouble: (playerId: string, playerName: string) => void;
  onClose: () => void;
}

const COMMANDS: { id: CaptainCmd; emoji: string; label: string; sublabel: string; color: string; needsPlayer: boolean }[] = [
  { id: 'drink',  emoji: '🍺', label: 'Hacer beber',  sublabel: 'Elige quién bebe',     color: 'from-amber-600 to-orange-700',   needsPlayer: true },
  { id: 'virus',  emoji: '🦠', label: 'Virus',        sublabel: 'Asigna el virus',       color: 'from-emerald-600 to-green-800',  needsPlayer: true },
  { id: 'norma',  emoji: '📜', label: 'Anular norma', sublabel: 'Si cumple el castigo',  color: 'from-violet-600 to-purple-800',  needsPlayer: true },
  { id: 'double', emoji: '⚡', label: 'Doble o nada', sublabel: 'Doble tragos o pasa',   color: 'from-blue-600 to-indigo-800',    needsPlayer: true },
  { id: 'all',    emoji: '🥂', label: 'Todos beben',  sublabel: 'Orden para el grupo',   color: 'from-rose-600 to-pink-800',      needsPlayer: false },
];

export function CaptainDecisionPanel({
  captainName,
  players,
  drinkCounts,
  onDrink,
  onVirus,
  onNormaCancel,
  onAllDrink,
  onDouble,
  onClose,
}: CaptainDecisionPanelProps) {
  const [activeCmd, setActiveCmd] = useState<CaptainCmd>(null);

  const activeConfig = COMMANDS.find(c => c.id === activeCmd);

  const handleCommandTap = (cmd: typeof COMMANDS[number]) => {
    if (!cmd.needsPlayer) {
      onAllDrink();
      return;
    }
    setActiveCmd(cmd.id);
  };

  const handlePlayerTap = (player: Player) => {
    if (!activeCmd) return;
    if (activeCmd === 'drink')  onDrink(player.id, player.name);
    if (activeCmd === 'virus')  onVirus(player.id, player.name);
    if (activeCmd === 'norma')  onNormaCancel(player.id, player.name);
    if (activeCmd === 'double') onDouble(player.id, player.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-[#050505] rounded-t-[2.5rem] pb-10 overflow-hidden"
        style={{ boxShadow: '0 -20px 80px rgba(251,191,36,0.15)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          {/* ── SCREEN 1: Command selection ── */}
          {!activeCmd && (
            <motion.div
              key="commands"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-5 pt-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-400/70 font-black uppercase tracking-widest">Poder del Capitán</p>
                    <p className="text-base font-black text-white leading-none">{captainName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Commands grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {COMMANDS.filter(c => c.id !== 'all').map((cmd, i) => (
                  <motion.button
                    key={cmd.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCommandTap(cmd)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl bg-gradient-to-br ${cmd.color} shadow-lg border border-white/10 active:brightness-90`}
                  >
                    <span className="text-3xl">{cmd.emoji}</span>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{cmd.label}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">{cmd.sublabel}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* All-drink full-width */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCommandTap(COMMANDS.find(c => c.id === 'all')!)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-700 border border-white/10 shadow-lg"
              >
                <span className="text-2xl">🥂</span>
                <div className="text-left">
                  <p className="text-sm font-black text-white uppercase tracking-tight">Todos beben</p>
                  <p className="text-[10px] text-white/60">Orden para todo el grupo</p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* ── SCREEN 2: Player selection ── */}
          {activeCmd && (
            <motion.div
              key="players"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-5 pt-2"
            >
              {/* Back + title */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setActiveCmd(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeConfig?.emoji}</span>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-black">{activeConfig?.sublabel}</p>
                    <p className="text-base font-black text-white leading-none">{activeConfig?.label}</p>
                  </div>
                </div>
              </div>

              {/* Player grid */}
              <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
                {players.map((player, i) => (
                  <motion.button
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePlayerTap(player)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all active:brightness-90"
                  >
                    {/* Avatar */}
                    <div className="relative w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {player.avatar_url
                        ? <img src={player.avatar_url} className="w-full h-full object-cover" />
                        : <span className="text-xl font-black text-white/80">{player.name.substring(0, 2).toUpperCase()}</span>
                      }
                      {/* Drink badge */}
                      {(drinkCounts[player.id] || 0) > 0 && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border border-black">
                          {drinkCounts[player.id]}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white truncate w-full text-center leading-tight">{player.name}</p>
                    <p className="text-[9px] text-white/40">🍺 {drinkCounts[player.id] || 0}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
