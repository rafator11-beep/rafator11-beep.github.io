import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const shown = sessionStorage.getItem('beep_splash_shown');
    if (shown) { onComplete(); setVisible(false); return; }

    // Simulate load progress
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('beep_splash_shown', 'true');
      setTimeout(onComplete, 500);
    }, 2800);

    return () => { clearTimeout(t); clearInterval(progressInterval); };
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
        {/* Orbes de fondo mejorados */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(318 100% 60% / 0.20) 0%, transparent 60%)' }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(28 100% 58% / 0.14) 0%, transparent 60%)' }}
            animate={{ scale: [1, 1.25, 1], x: [0, 30, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.div
            className="absolute right-[10%] bottom-[20%] h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(185 100% 55% / 0.12) 0%, transparent 60%)' }}
            animate={{ scale: [1, 1.3, 1], y: [0, -25, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute left-[60%] top-[15%] h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(270 90% 65% / 0.10) 0%, transparent 60%)' }}
            animate={{ scale: [1, 1.4, 1], x: [0, -15, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                background: ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'][i % 6],
                opacity: 0.4,
              }}
              animate={{
                y: [0, -20 - Math.random() * 30, 0],
                x: [0, (Math.random() - 0.5) * 20, 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Scanlines sutiles */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
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
                className="text-[5.5rem] font-black leading-none tracking-tighter text-white md:text-[8rem] font-title"
                style={{
                  textShadow: '0 0 40px hsl(318 100% 60% / 0.6), 0 0 80px hsl(318 100% 60% / 0.3), 0 0 120px hsl(185 100% 55% / 0.15)',
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline with typing effect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 flex flex-col items-center gap-4"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">
              El motor de la fiesta
            </p>

            {/* Progress bar tricolor */}
            <div className="relative h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(318 100% 60%), hsl(185 100% 55%), hsl(28 100% 58%))',
                  backgroundSize: '200% 100%',
                }}
                initial={{ width: '0%' }}
                animate={{
                  width: `${Math.min(loadProgress, 100)}%`,
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  width: { duration: 0.3, ease: 'easeOut' },
                  backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
                }}
              />
            </div>

            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30"
            >
              Inicializando...
            </motion.span>
          </motion.div>
        </div>

        {/* Version badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1"
        >
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
            v4.0 · APEX ENGINE
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-pulse" />
            <span className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-widest">
              Systems online
            </span>
          </div>
        </motion.div>

        {/* Radial pulse on load complete */}
        {loadProgress >= 100 && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsl(318 100% 60% / 0.3), transparent 60%)',
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
