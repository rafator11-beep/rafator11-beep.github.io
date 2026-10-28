// Antes cada beep() creaba un AudioContext nuevo (new AudioCtx()) y lo cerraba
// al terminar. Si varios sonidos se disparaban seguidos (p. ej. al abrir el
// Kahoot/"quién es más probable"), se creaban y destruían varios contextos de
// audio en ráfaga — crear un AudioContext es caro (sobre todo en móvil/iOS),
// así que eso congelaba un poco la interfaz, y arrancar/parar el oscilador de
// golpe sin rampa de volumen producía un "clic" audible en cada beep. Ahora se
// reutiliza un único AudioContext para toda la sesión y cada nota tiene una
// rampa de entrada/salida suave para no sonar entrecortada.

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (sharedCtx && sharedCtx.state !== 'closed') {
      if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => { });
      return sharedCtx;
    }
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return null;
    sharedCtx = new AudioCtx();
    return sharedCtx;
  } catch {
    return null;
  }
}

function beep(freq = 440, ms = 90, vol = 0.08) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;

    const now = ctx.currentTime;
    const durationSec = ms / 1000;
    const rampSec = Math.min(0.015, durationSec / 4); // rampa corta, evita el "clic"
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + rampSec);
    g.gain.linearRampToValueAtTime(0, now + durationSec);

    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + durationSec + 0.02);
  } catch { }
}

async function playFile(path: string, fallbackFreq: number) {
  try {
    const a = new Audio(path);
    a.volume = 0.35;
    // Only play if file loads successfully
    await new Promise<void>((resolve, reject) => {
      a.oncanplaythrough = () => resolve();
      a.onerror = () => reject(new Error('Audio not found'));
      a.load();
    });
    await a.play();
  } catch {
    // Silent fallback - use beep only if audio context is available
    try { beep(fallbackFreq); } catch { /* completely silent */ }
  }
}

export const sfx = {
  click: () => { try { beep(520); } catch { } },
  legendary: () => { try { beep(780, 400, 0.1); } catch { } },
  cursed: () => { try { beep(180, 600, 0.15); } catch { } },
  chaos: () => { try { beep(100, 800, 0.2); } catch { } },
  whoosh: () => { try { beep(880, 150, 0.05); beep(440, 300, 0.03); } catch { } },
  success: () => {
    try {
      beep(523, 100);
      setTimeout(() => beep(659, 100), 100);
      setTimeout(() => beep(783, 200), 200);
    } catch { }
  },
  arcade: () => {
    try {
      [440, 554, 659, 880].forEach((f, i) => setTimeout(() => beep(f, 80), i * 80));
    } catch { }
  }
};
