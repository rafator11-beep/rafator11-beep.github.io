import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Plus, Minus } from 'lucide-react';
import { GameMode } from '@/types/game';
import { AnimatedXP } from './PartyVisuals';

// New Bottom Profiles Component with Virus Support and Captain XP Controls
export const PlayerProfilesBottom = ({
  players,
  currentPlayer,
  scores,
  playerViruses = [],
  mode,
  remoteStreams = [],
  captainId,
  onAdjustXP,
  drinkCounts = {},
}: {
  players: any[];
  currentPlayer: any;
  scores: any;
  playerViruses?: any[];
  mode: GameMode;
  remoteStreams?: any[];
  captainId?: string | null;
  onAdjustXP?: (pid: string, delta: number) => void;
  drinkCounts?: Record<string, number>;
}) => {
  const [editMode, setEditMode] = useState(false); // Mejora 10: Edit mode for mobile

  return (
    <div className="no-scrollbar fixed bottom-0 left-0 right-0 z-[100] flex h-28 items-center justify-center gap-6 overflow-x-auto border-t border-white/10 bg-slate-950/60 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-[24px] md:h-32">
      {/* Edit Mode Toggle Button */}
      {captainId && (
        <button
          onClick={() => setEditMode((e) => !e)}
          className={`absolute right-3 top-2 z-[120] flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${editMode ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/10 text-white/50'}`}
        >
          {editMode ? '✅' : '✏️'}
        </button>
      )}

      <div className="flex items-center gap-4 md:gap-8">
        {players.map((p) => {
          const isTurn = currentPlayer?.id === p.id;
          const hasVirus = playerViruses.some((v) => v.playerId === p.id);
          const isCaptain = captainId === p.id;
          const showVirus = hasVirus && (mode === 'megamix' || mode === 'clasico');
          const remotePeer = remoteStreams?.find((s) => s.peerId === p.id);

          return (
            <div key={p.id} className="group relative flex shrink-0 flex-col items-center gap-1">
              {/* Captain Controls Overlay: visible on hover (desktop) OR editMode (mobile) */}
              <div
                className={`absolute -top-12 left-1/2 z-[110] flex -translate-x-1/2 gap-3 transition-all duration-300 ${editMode ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}
              >
                <button
                  onClick={() => onAdjustXP?.(p.id, -5)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-red-500/90 font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:bg-red-600 active:scale-90"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onAdjustXP?.(p.id, 5)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-green-500/90 font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all hover:bg-green-600 active:scale-90"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <motion.div
                animate={{
                  scale: isTurn ? 1.15 : 1,
                  borderColor: isCaptain
                    ? '#fbbf24'
                    : hasVirus
                      ? '#22c55e'
                      : isTurn
                        ? 'var(--primary)'
                        : 'transparent',
                  boxShadow: isCaptain
                    ? '0 0 20px #fbbf24'
                    : hasVirus
                      ? '0 0 15px #22c55e'
                      : isTurn
                        ? '0 0 15px var(--primary)'
                        : 'none',
                }}
                className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] border bg-slate-800/40 text-lg font-bold backdrop-blur-2xl transition-all duration-500 md:h-16 md:w-16 ${isTurn ? 'border-primary/60' : 'border-white/5 opacity-60 hover:scale-105 hover:opacity-100'}`}
              >
                {isCaptain && (
                  <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-amber-500 p-1">
                    <Crown className="h-3 w-3 text-black" />
                  </div>
                )}
                {remotePeer ? (
                  <video
                    autoPlay
                    playsInline
                    muted={p.id === currentPlayer?.id}
                    ref={(el) => {
                      if (el && remotePeer.stream) el.srcObject = remotePeer.stream;
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span
                    className={
                      isTurn ? 'text-primary' : isCaptain ? 'text-amber-400' : 'text-white/80'
                    }
                  >
                    {p.name[0].toUpperCase()}
                  </span>
                )}
                {showVirus && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center bg-green-500/20"
                  >
                    <div className="h-full w-full rounded-[22px] border-2 border-green-500/50" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-t-2 border-green-400/80 opacity-40"
                    />
                  </motion.div>
                )}
              </motion.div>
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${isTurn ? 'text-primary' : isCaptain ? 'text-amber-400' : 'text-white/40'}`}
                >
                  {p.name}
                </span>
                <AnimatedXP value={scores[p.id] || 0} playerId={p.id} />
                {(drinkCounts[p.id] || 0) > 0 && (
                  <span className="mt-0.5 text-[9px] font-black text-amber-400/80">
                    🍺{drinkCounts[p.id]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
