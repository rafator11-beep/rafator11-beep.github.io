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
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        <div className="relative flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, filter: "blur(10px)" }}
            animate={{ scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex"
          >
            {text.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.2 + (i * 0.1), 
                  duration: 0.6,
                  ease: [0.215, 0.61, 0.355, 1]
                }}
                className="text-9xl md:text-[12rem] font-black text-white font-mono tracking-tighter"
                style={{ 
                  textShadow: '0 0 30px hsla(var(--primary) / 0.5)',
                  filter: 'drop-shadow(0 0 10px hsla(var(--primary) / 0.3))'
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex flex-col items-center"
          >
            <p className="text-[10px] font-black text-primary uppercase tracking-[1em] font-mono mb-4">
              MEGAMIX ULTRA
            </p>
            
            <div className="w-48 h-[2px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
              />
            </div>
            
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-2 text-[8px] font-mono text-white/40 uppercase tracking-widest"
            >
              Cargando Sistemas BEEP...
            </motion.span>
          </motion.div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      </motion.div>
    </AnimatePresence>
  );
}
