import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '@/lib/sfx';
import { vibe } from '@/lib/vibration';
import { bombTickInterval, randomBombDuration } from '@/utils/megamixBomb';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Pantalla completa mientras el móvil pasa de mano en mano. Durante el tic-tac
// no hay botones: así nadie la cierra sin querer al pasarse el móvil.
export function BombOverlay({ open, onClose }: Props) {
  const [phase, setPhase] = useState<'ticking' | 'boom'>('ticking');
  const [round, setRound] = useState(0);
  const durationRef = useRef(0);

  // Cada vez que se abre (o se pide otra ronda) se elige un tiempo nuevo.
  useEffect(() => {
    if (!open) return;
    durationRef.current = randomBombDuration();
    setPhase('ticking');
  }, [open, round]);

  useEffect(() => {
    if (!open || phase !== 'ticking') return;
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= durationRef.current) {
        sfx.boom();
        vibe([500, 100, 500]);
        setPhase('boom');
        return;
      }
      sfx.tick();
      vibe(25);
      timer = setTimeout(tick, bombTickInterval(elapsed / durationRef.current));
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [open, phase, round]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[170] flex flex-col items-center justify-center p-6 text-center ${
            phase === 'boom' ? 'bg-red-700' : 'bg-slate-950'
          }`}
        >
          {phase === 'ticking' ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-[9rem] leading-none"
              >
                💣
              </motion.div>
              <p className="mt-6 text-2xl font-black uppercase text-white">¡Pasad el móvil!</p>
              <p className="mt-2 text-sm font-semibold text-white/60">
                Uno cada uno y a la derecha. Va a explotar… nadie sabe cuándo.
              </p>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.3 }}
                animate={{ scale: [0.3, 1.4, 1] }}
                className="text-[9rem] leading-none"
              >
                💥
              </motion.div>
              <p className="mt-4 text-5xl font-black text-white">¡BUM!</p>
              <p className="mt-3 text-lg font-bold text-white/90">
                Quien tenga el móvil en la mano, bebe 3.
              </p>
              <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setRound((r) => r + 1)}
                  className="rounded-2xl border-2 border-white/40 bg-white/10 py-3.5 text-sm font-black uppercase tracking-widest text-white active:scale-95"
                >
                  💣 Otra ronda
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl bg-white py-3.5 text-sm font-black uppercase tracking-widest text-red-700 active:scale-95"
                >
                  Seguir jugando
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
