import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const text = "BEEP";

  useEffect(() => {
    // Check if splash has been shown in this session
    const shown = sessionStorage.getItem('beep_splash_shown');
    if (shown) {
      onComplete();
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('beep_splash_shown', 'true');
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        <div className="relative flex flex-col items-center">
          <div className="flex">
            {text.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.2 + (i * 0.1), 
                  duration: 0.4,
                  ease: [0.215, 0.61, 0.355, 1]
                }}
                className="text-8xl md:text-9xl font-black text-white font-mono tracking-tighter"
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 0.5, letterSpacing: '0.8em' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-4 text-[10px] font-black text-white uppercase tracking-[0.8em] font-mono"
          >
            PARTY GAME
          </motion.p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );
}
