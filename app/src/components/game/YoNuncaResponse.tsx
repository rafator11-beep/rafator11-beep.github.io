import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';

interface Props {
  players: Player[];
  cardText: string;
  onConfirm: (didItIds: string[]) => void;
}

export function YoNuncaResponse({ players, cardText, onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Strip emoji prefix, "Yo nunca...", and trailing drink suffix
  const cleanText = cardText
    .replace(/^🙈\s*/, '')
    .replace(/^Yo nunca\.\.\.?\s*/i, '')
    .replace(/\s*[🍺🍻🥃].*$/s, '')
    .trim();

  const count = selected.size;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm flex flex-col items-center gap-5"
      >
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">¿Quién lo ha hecho?</p>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
          <p className="text-white font-bold text-base leading-snug">
            🙈 Yo nunca... {cleanText}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {players.map(p => {
            const on = selected.has(p.id);
            return (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-150 ${
                  on
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-105'
                    : 'bg-white/10 text-white/60 border border-white/15'
                }`}
              >
                {on && <span className="text-base">🍺</span>}
                {p.avatar_url
                  ? <img src={p.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                  : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">{p.name[0]?.toUpperCase()}</span>
                }
                {p.name}
              </motion.button>
            );
          })}
        </div>

        {count > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-400 font-bold text-sm"
          >
            {count === 1 ? `${[...selected].map(id => players.find(p => p.id === id)?.name).join(', ')} bebe 2 🍻` : `${count} personas beben 2 🍻`}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onConfirm(Array.from(selected))}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 bg-white/10 border border-white/20 text-white hover:bg-white/15"
        >
          {count === 0 ? 'Nadie lo ha hecho →' : `Confirmado · Siguiente →`}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
