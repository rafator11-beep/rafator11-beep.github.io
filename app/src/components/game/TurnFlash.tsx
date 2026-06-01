import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnFlashProps {
  playerName: string;
  avatarUrl?: string;
  playerIndex: number;
  visible: boolean;
  onDismiss: () => void;
}

const PLAYER_GRADIENTS = [
  'from-cyan-600 to-blue-800',
  'from-violet-600 to-purple-800',
  'from-rose-600 to-pink-800',
  'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800',
  'from-indigo-600 to-blue-900',
  'from-red-600 to-rose-900',
  'from-green-600 to-emerald-900',
];

const PLAYER_GLOWS = [
  'rgba(6,182,212,0.4)',
  'rgba(139,92,246,0.4)',
  'rgba(244,63,94,0.4)',
  'rgba(16,185,129,0.4)',
  'rgba(251,146,60,0.4)',
  'rgba(99,102,241,0.4)',
  'rgba(239,68,68,0.4)',
  'rgba(34,197,94,0.4)',
];

export function TurnFlash({ playerName, avatarUrl, playerIndex, visible, onDismiss }: TurnFlashProps) {
  const idx = playerIndex % PLAYER_GRADIENTS.length;
  const gradient = PLAYER_GRADIENTS[idx];
  const glow = PLAYER_GLOWS[idx];
  const initials = playerName.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 1400);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={onDismiss}
        >
          {/* Glow pulse */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.4, 1.2], opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.2, times: [0, 0.4, 1] }}
            className="absolute rounded-full w-72 h-72"
            style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
          />

          <motion.div
            initial={{ scale: 0.5, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="flex flex-col items-center gap-5 relative z-10"
          >
            {/* Avatar */}
            <motion.div
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 0.5, repeat: 1 }}
              className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradient} border-4 border-white/30 overflow-hidden flex items-center justify-center shadow-2xl`}
              style={{ boxShadow: `0 0 50px ${glow}` }}
            >
              {avatarUrl
                ? <img src={avatarUrl} className="w-full h-full object-cover" />
                : <span className="text-4xl font-black text-white">{initials}</span>
              }
            </motion.div>

            {/* Label */}
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/60 text-xs font-black uppercase tracking-[0.4em] mb-1"
              >
                turno de
              </motion.p>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="text-white text-4xl font-black uppercase tracking-tight leading-none"
                style={{ textShadow: `0 0 30px ${glow}` }}
              >
                {playerName}
              </motion.p>
            </div>

            {/* Tap hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.6 }}
              className="text-white/40 text-[10px] uppercase tracking-widest"
            >
              toca para continuar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
