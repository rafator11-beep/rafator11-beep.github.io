import { useEffect, useRef } from 'react';

/**
 * Tracks whether the browser tab/document is currently visible.
 * Useful to pause expensive requestAnimationFrame loops, polling intervals,
 * etc. when the user has switched tabs or minimized the app (battery saving).
 *
 * Returns a ref (not state) so consumers checking it inside a rAF loop don't
 * need to re-subscribe or cause re-renders on every visibility flip.
 */
export function useIsTabVisible() {
  const isVisibleRef = useRef(typeof document === 'undefined' ? true : !document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisibleRef;
}
