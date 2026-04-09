import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const shown = sessionStorage.getItem('beep_splash_shown');
    if (shown) { onComplete(); setVisible(false); return; }

    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('beep_splash_shown', 'true');
      setTimeout(onComplete, 500);
    }, 2400);

    return () => clearTimeout(t);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#07060f' }}
      >
        {/* Orbes de fondo */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(318 100% 60% / 0.18) 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[20%] top-[25%] h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(28 100% 58% / 0.12) 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.div
            className="absolute right-[15%] bottom-[25%] h-48 w-48 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(210 100% 62% / 0.12) 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>

        {/* Scanlines sutiles */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
          }}
        />

        {/* Logo BEEP */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            className="flex"
            initial={{ scale: 0.6, filter: 'blur(20px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {'BEEP'.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-[5.5rem] font-black leading-none tracking-tighter text-white md:text-[8rem]"
                style={{
                  textShadow: '0 0 40px hsl(318 100% 60% / 0.6), 0 0 80px hsl(318 100% 60% / 0.3)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 flex flex-col items-center gap-3"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">
              El juego de la fiesta
            </p>

            {/* Barra de carga */}
            <div className="relative h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(318 100% 60%), hsl(28 100% 58%))' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.6 }}
              />
            </div>

            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30"
            >
              Cargando...
            </motion.span>
          </motion.div>
        </div>

        {/* Versión */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 text-[9px] font-mono text-white/20 uppercase tracking-widest"
        >
          v3.0 · MEGAMIX ULTRA
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
