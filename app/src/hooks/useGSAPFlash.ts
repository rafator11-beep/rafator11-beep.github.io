import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Mounts a fullscreen flash overlay on the body that fires via GSAP
 * whenever `trigger` changes. Returns a `fire()` function for manual use.
 */
export function useGSAPFlash(color = '#ffffff') {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: ${color}; pointer-events: none;
      opacity: 0; will-change: opacity;
    `;
    document.body.appendChild(el);
    overlayRef.current = el;
    return () => { el.remove(); };
  }, [color]);

  const fire = (opts?: { color?: string; duration?: number }) => {
    const el = overlayRef.current;
    if (!el) return;
    if (opts?.color) el.style.background = opts.color;
    gsap.killTweensOf(el);
    gsap.fromTo(el,
      { opacity: 0.55 },
      { opacity: 0, duration: opts?.duration ?? 0.45, ease: 'power2.out' }
    );
  };

  return { fire };
}
