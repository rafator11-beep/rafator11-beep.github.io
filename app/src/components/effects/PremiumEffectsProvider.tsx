import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEngine } from '@/hooks/useSoundEngine';
import { hapticFeedback } from '@/utils/haptics';

interface PremiumEffectsContextType {
  triggerConfetti: () => void;
  triggerSuccess: () => void;
  triggerError: () => void;
  triggerCombo: (streak: number) => void;
  playSfx: (type: 'click' | 'swoosh' | 'win') => void;
}

const PremiumEffectsContext = createContext<PremiumEffectsContextType | undefined>(undefined);

export const PremiumEffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { playClick, playSwoosh, playWin, initContext } = useSoundEngine();
  const [engineReady, setEngineReady] = useState(false);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#3b82f6', '#ec4899']
    });
  }, []);

  const triggerSuccess = useCallback(() => {
    triggerConfetti();
    playWin();
    hapticFeedback.success();
  }, [triggerConfetti, playWin]);

  const triggerError = useCallback(() => {
    hapticFeedback.error();
  }, []);

  const triggerCombo = useCallback((streak: number) => {
    const colors = streak >= 5
      ? ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899']
      : streak >= 3
        ? ['#22d3ee', '#3b82f6', '#8b5cf6']
        : ['#a78bfa', '#6366f1'];
    confetti({
      particleCount: 40 + streak * 15,
      spread: 50 + streak * 10,
      origin: { y: 0.7 },
      colors,
      scalar: 0.8,
    });
    if (streak >= 3) playWin();
    hapticFeedback.success();
  }, [playWin]);

  const playSfx = useCallback((type: 'click' | 'swoosh' | 'win') => {
    switch (type) {
      case 'click': playClick(); break;
      case 'swoosh': playSwoosh(); break;
      case 'win': playWin(); break;
    }
  }, [playClick, playSwoosh, playWin]);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlock = () => {
      initContext();
      setEngineReady(true);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [initContext]);

  return (
    <PremiumEffectsContext.Provider value={{ triggerConfetti, triggerSuccess, triggerError, triggerCombo, playSfx }}>
      {children}
      
      {/* GLOBAL ULTRA OVERLAY */}
      <div className="beep-ultra-overlay" />
      <div className="beep-ultra-scanlines" />
      
      {/* BEEP ENGINE HUD (Subtle) */}
      <AnimatePresence>
        {engineReady && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.4, x: 0 }}
            className="fixed bottom-4 left-4 z-[10001] pointer-events-none flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-white tracking-widest uppercase">
              APEX ENGINE v2.0 // BEEP
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </PremiumEffectsContext.Provider>
  );
};

export const usePremiumEffects = () => {
  const context = useContext(PremiumEffectsContext);
  if (!context) throw new Error('usePremiumEffects must be used within a PremiumEffectsProvider');
  return context;
};
