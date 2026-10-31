import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff } from 'lucide-react';

// ─── Visual Improvements Sub-components ──────────────────────────────────────

const RARITY_CONFIG = {
  common: {
    orbLeft: 'rgba(99,102,241,0.08)',
    orbRight: 'rgba(139,92,246,0.08)',
    via: 'slate-900/50',
  },
  rare: { orbLeft: 'rgba(59,130,246,0.18)', orbRight: 'rgba(99,102,241,0.15)', via: 'blue-950/40' },
  legendary: {
    orbLeft: 'rgba(251,191,36,0.20)',
    orbRight: 'rgba(245,158,11,0.15)',
    via: 'amber-950/40',
  },
  chaos: { orbLeft: 'rgba(239,68,68,0.22)', orbRight: 'rgba(220,38,38,0.15)', via: 'red-950/50' },
  virus: {
    orbLeft: 'rgba(34,197,94,0.18)',
    orbRight: 'rgba(16,185,129,0.14)',
    via: 'green-950/40',
  },
} as const;

export const DynamicBackground = ({ rarity }: { rarity: keyof typeof RARITY_CONFIG }) => {
  const c = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.common;
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-slate-950 via-${c.via} duration-[800ms] to-slate-950 transition-all ease-in-out`}
      />
      <motion.div
        className="absolute left-[-10%] top-[-10%] h-[45%] w-[45%] rounded-full blur-[120px]"
        animate={{ backgroundColor: c.orbLeft }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{ backgroundColor: c.orbLeft }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] h-[45%] w-[45%] rounded-full blur-[120px]"
        animate={{ backgroundColor: c.orbRight }}
        transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.1 }}
        style={{ backgroundColor: c.orbRight }}
      />
      <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] absolute inset-0 bg-repeat opacity-[0.03]" />
    </div>
  );
};

export const AnimatedXP = ({ value, playerId }: { value: number; playerId: string }) => {
  const prevRef = useRef(value);
  const [popping, setPopping] = useState(false);
  const [floater, setFloater] = useState<number | null>(null);

  useEffect(() => {
    if (value > prevRef.current) {
      const diff = value - prevRef.current;
      setPopping(true);
      setFloater(diff);
      const t = setTimeout(() => {
        setPopping(false);
        setFloater(null);
      }, 1200);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <div className="relative flex items-center justify-center">
      <motion.span
        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-black tabular-nums text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        animate={
          popping
            ? {
                scale: [1, 1.4, 1],
                color: ['#fff', '#10b981', '#fff'],
                rotate: [0, -10, 10, 0],
              }
            : { scale: 1 }
        }
        transition={{ duration: 0.5, type: 'spring', stiffness: 400 }}
      >
        {value}{' '}
        <span className="ml-0.5 text-[8px] font-bold uppercase tracking-widest opacity-60">XP</span>
      </motion.span>
      <AnimatePresence>
        {floater !== null && (
          <motion.span
            key={`${playerId}-${value}-${floater}`}
            className="pointer-events-none absolute -top-10 z-50 text-[14px] font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,1)]"
            initial={{ y: 20, opacity: 0, scale: 0.2, rotate: Math.random() * 20 - 10 }}
            animate={{ y: -40, opacity: 1, scale: 1.5, rotate: Math.random() * 40 - 20 }}
            exit={{ y: -60, opacity: 0, scale: 2 }}
            transition={{ duration: 1, type: 'spring', stiffness: 200, damping: 12 }}
          >
            +{floater}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export const VirusFlash = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="pointer-events-none fixed inset-0 z-[160]"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{
          opacity: [0, 0.8, 0],
          scale: [1.1, 1, 1],
          backgroundColor: ['#22c55e', '#166534', '#22c55e'],
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay invert"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export const BocaCerradaOverlay = ({
  text,
  playerName,
  onDone,
}: {
  text: string;
  playerName: string;
  onDone: () => void;
}) => {
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center">
      <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 15px rgba(168,85,247,0.8))' }}>
        🤐
      </div>
      <div>
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.4em] text-purple-400">
          BOCA CERRADA
        </p>
        <p className="text-xl font-black text-white">{playerName}</p>
        <p className="mt-0.5 text-xs text-white/40">debes decirlo con los labios cerrados</p>
      </div>

      <motion.button
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        className="relative flex min-h-[130px] w-full touch-none select-none flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-purple-500/50 transition-transform active:scale-[0.98]"
        style={{ background: holding ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.4)' }}
      >
        <AnimatePresence mode="wait">
          {!holding ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <EyeOff className="h-8 w-8 text-purple-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                Mantén pulsado para ver
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="shown"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 text-center"
            >
              <p className="text-xl font-black leading-snug text-white">{text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/20 active:scale-95"
        >
          Ya lo he dicho 🤐
        </button>
      ) : (
        <button
          onClick={onDone}
          className="w-full rounded-2xl bg-purple-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-purple-500 active:scale-95"
        >
          El grupo lo adivina → Siguiente ▶
        </button>
      )}
    </div>
  );
};
