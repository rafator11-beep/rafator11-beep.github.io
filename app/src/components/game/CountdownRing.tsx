import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Cronómetro visual para retos con tiempo ("en N segundos"). Se reinicia
 * cada vez que cambia `resetKey` (normalmente el texto/índice de la carta),
 * para que cada carta nueva empiece su propia cuenta atrás desde cero.
 * Se usa tanto en la pantalla del anfitrión (CardDisplay) como en el móvil
 * del espectador (SpectatorView) — mismo componente, mismo aspecto.
 */
export function CountdownRing({ seconds, resetKey, size = 56 }: { seconds: number; resetKey: string | number; size?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setRemaining(seconds);
    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
     
  }, [resetKey, seconds]);

  const pct = seconds > 0 ? remaining / seconds : 0;
  const urgent = remaining <= 3 && remaining > 0;
  const r = size / 2 - 4;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={4} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={urgent ? '#ef4444' : '#f59e0b'}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      <span className={`absolute font-black tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-amber-300'}`} style={{ fontSize: size * 0.32 }}>
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}
