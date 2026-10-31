import { useState, useEffect } from 'react';

export function useScrambleText(target: string, active: boolean) {
  const [display, setDisplay] = useState(target);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!';

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      return;
    }
    let iterations = 0;
    const max = target.length * 3;
    const t = setInterval(() => {
      setDisplay(
        target
          .split('')
          .map((char, i) => {
            if (i < Math.floor(iterations / 3)) return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (++iterations >= max) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [target, active]);

  return display;
}
