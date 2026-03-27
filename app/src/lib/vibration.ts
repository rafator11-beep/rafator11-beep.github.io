
export function vibe(pattern: number | number[] = 40) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // @ts-ignore
      navigator.vibrate(pattern);
    }
  } catch {}
}

vibe.success = () => vibe([10, 50, 10, 50, 30]);
vibe.fail = () => vibe([100, 50, 100]);
vibe.alert = () => vibe([50, 50, 50, 50, 50]);
