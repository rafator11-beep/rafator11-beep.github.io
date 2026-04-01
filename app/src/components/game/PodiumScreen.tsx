import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, RotateCcw, Crown, ChevronRight, BarChart2, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// ── SHARE IMAGE ───────────────────────────────────────────────────────────────
async function shareAwardsImage(
  awards: { emoji: string; title: string; subtitle: string; playerId: string; accent: string; stat?: string }[],
  players: { id: string; name: string; score: number }[]
) {
  const W = 800, H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#080810'); bg.addColorStop(1, '#0e0e1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Header
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('POST-GAME · BIG DATA', W / 2, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('BEEP', W / 2, 115);

  // Winner
  const winner = [...players].sort((a, b) => b.score - a.score)[0];
  if (winner) {
    ctx.fillStyle = 'rgba(250,204,21,0.12)';
    ctx.beginPath(); ctx.roundRect(60, 135, W - 120, 70, 16); ctx.fill();
    ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GANADOR', W / 2, 163);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`🏆  ${winner.name}  ·  ${winner.score} XP`, W / 2, 193);
  }

  // Awards
  const sliced = awards.slice(0, 10);
  const cardH = 82, gap = 10, startY = 230;
  for (let i = 0; i < sliced.length; i++) {
    const a = sliced[i];
    const y = startY + i * (cardH + gap);
    const px = players.find(p => p.id === a.playerId);

    // Card bg
    ctx.fillStyle = `${a.accent}18`;
    ctx.beginPath(); ctx.roundRect(40, y, W - 80, cardH, 14); ctx.fill();

    // Accent left bar
    ctx.fillStyle = a.accent;
    ctx.beginPath(); ctx.roundRect(40, y, 5, cardH, [4, 0, 0, 4]); ctx.fill();

    // Emoji
    ctx.font = '34px serif';
    ctx.textAlign = 'left';
    ctx.fillText(a.emoji, 62, y + cardH / 2 + 13);

    // Title
    ctx.fillStyle = a.accent; ctx.font = 'bold 11px monospace';
    ctx.fillText(a.title, 108, y + 28);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText(px?.name || '???', 108, y + 52);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px sans-serif';
    ctx.fillText(a.subtitle, 108, y + 70);

    // Stat pill
    if (a.stat) {
      ctx.fillStyle = `${a.accent}30`;
      const tw = ctx.measureText(a.stat).width;
      ctx.beginPath(); ctx.roundRect(W - 80 - tw, y + 26, tw + 20, 26, 13); ctx.fill();
      ctx.fillStyle = a.accent; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'right';
      ctx.fillText(a.stat, W - 50, y + 44); ctx.textAlign = 'left';
    }
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '13px monospace'; ctx.textAlign = 'center';
  ctx.fillText('beep.app · ¿Y tú, qué nunca has hecho?', W / 2, H - 30);

  return new Promise<void>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(); return; }
      const file = new File([blob], 'beep-bigdata.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'BEEP – Big Data', text: '¡Mira los premios de nuestra partida!' }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'beep-bigdata.png';
        a.click(); URL.revokeObjectURL(url);
      }
      resolve();
    }, 'image/png');
  });
}

interface PodiumPlayer {
  id: string;
  name: string;
  score: number;
  avatar_url?: string;
}

interface TrackingData {
  voteCounts?: Record<string, number>;
  drinkCounts?: Record<string, number>;
  virusReceived?: Record<string, number>;
  skipCounts?: Record<string, number>;
}

interface PodiumScreenProps {
  players: PodiumPlayer[];
  onRestart: () => void;
  onHome: () => void;
  trackingData?: TrackingData;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (!end) return;
    const inc = Math.max(1, Math.ceil(end / 60));
    const timer = setInterval(() => {
      start = Math.min(start + inc, end);
      setDisplayValue(start);
      if (start >= end) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
};

export const PodiumScreen = ({ players, onRestart, onHome, trackingData }: PodiumScreenProps) => {
  const [phase, setPhase] = useState<'podium' | 'bigdata'>('podium');

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const podiumOrder = [sortedPlayers[1], sortedPlayers[0], sortedPlayers[2]].filter(Boolean);

  useEffect(() => {
    const duration = 4000;
    const end = Date.now() + duration;
    const run = () => {
      if (Date.now() > end) return;
      confetti({ particleCount: 40, spread: 360, ticks: 50, startVelocity: 25, origin: { x: Math.random(), y: Math.random() * 0.5 } });
      requestAnimationFrame(run);
    };
    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
  }, []);

  // ── Big Data awards ──────────────────────────────────────────────────────────
  const awards = useMemo(() => {
    if (players.length < 2) return [];
    const vc = trackingData?.voteCounts || {};
    const dc = trackingData?.drinkCounts || {};
    const vr = trackingData?.virusReceived || {};
    const sc = trackingData?.skipCounts || {};
    const ids = players.map(p => p.id);

    const maxBy = (d: Record<string, number>) => {
      let best = ''; let max = -1;
      for (const [id, v] of Object.entries(d)) { if (v > max) { max = v; best = id; } }
      return best || ids[0];
    };
    const minBy = (d: Record<string, number>) => {
      let best = ids[0]; let min = Infinity;
      for (const id of ids) { const v = d[id] ?? Infinity; if (v < min) { min = v; best = id; } }
      return best;
    };

    const list: { emoji: string; title: string; subtitle: string; playerId: string; accent: string; stat?: string }[] = [];

    // Score-based
    list.push({ emoji: '🔥', title: 'EL FIESTERO', subtitle: 'Mayor puntuación', playerId: sortedPlayers[0].id, accent: '#f97316', stat: `${sortedPlayers[0].score} XP` });
    if (sortedPlayers.length > 1) list.push({ emoji: '😇', title: 'EL SANTITO', subtitle: 'Siempre tan inocente...', playerId: sortedPlayers[sortedPlayers.length - 1].id, accent: '#38bdf8', stat: `${sortedPlayers[sortedPlayers.length - 1].score} XP` });

    // Drink counts
    if (Object.keys(dc).length > 0) {
      const maxDrink = maxBy(dc);
      const minDrink = minBy(dc);
      list.push({ emoji: '🍺', title: 'EL BORRACHÍN', subtitle: 'Bebió más que nadie', playerId: maxDrink, accent: '#f59e0b', stat: `${dc[maxDrink] || 0} tragos` });
      if (minDrink !== maxDrink) list.push({ emoji: '💧', title: 'EL ABSTEMIO', subtitle: 'Se salvó esta vez', playerId: minDrink, accent: '#06b6d4', stat: `${dc[minDrink] || 0} tragos` });
    }

    // Virus
    if (Object.keys(vr).length > 0) {
      const maxVirus = maxBy(vr);
      list.push({ emoji: '🦠', title: 'EL INFECTADO', subtitle: 'Recibió más virus', playerId: maxVirus, accent: '#22c55e', stat: `${vr[maxVirus] || 0} virus` });
    }

    // Voting
    if (Object.keys(vc).length > 0) {
      const mostVoted = maxBy(vc);
      list.push({ emoji: '🎯', title: 'EL SEÑALADO', subtitle: 'Todos apuntaron a ti', playerId: mostVoted, accent: '#ef4444', stat: `${vc[mostVoted] || 0} votos` });
    }

    // Skips
    if (Object.keys(sc).length > 0) {
      const mostSkip = maxBy(sc);
      list.push({ emoji: '💨', title: 'EL ESQUIVO', subtitle: 'Pasó más veces', playerId: mostSkip, accent: '#a78bfa', stat: `${sc[mostSkip] || 0} skips` });
    }

    // Random fun titles — assigned deterministically (not random each render)
    const funPool: { emoji: string; title: string; subtitle: string; accent: string }[] = [
      { emoji: '👑', title: 'REY DEL DRAMA', subtitle: 'Actor/actriz de la noche', accent: '#c084fc' },
      { emoji: '🎭', title: 'EL IMPOSTOR NATO', subtitle: 'Maestro del engaño', accent: '#818cf8' },
      { emoji: '💣', title: 'EL KAMIKAZE', subtitle: 'Sin miedo al ridículo', accent: '#fb923c' },
      { emoji: '🤝', title: 'EL DIPLOMÁTICO', subtitle: 'Siempre tan correcto', accent: '#34d399' },
      { emoji: '😈', title: 'EL DIABLILLO', subtitle: 'Traviesura nivel pro', accent: '#f87171' },
      { emoji: '🤡', title: 'EL PAYASO', subtitle: 'El grupo se lo debe', accent: '#fbbf24' },
      { emoji: '🔮', title: 'EL ADIVINO', subtitle: 'Siempre lo sabía', accent: '#a78bfa' },
      { emoji: '🎤', title: 'EL SHOWMAN', subtitle: 'Todo un espectáculo', accent: '#f472b6' },
      { emoji: '📚', title: 'EL EMPOLLÓN', subtitle: 'Demasiado listo', accent: '#2dd4bf' },
      { emoji: '🚀', title: 'SPEED RUNNER', subtitle: 'El más rápido del oeste', accent: '#60a5fa' },
      { emoji: '🧊', title: 'DE HIELO', subtitle: 'Imperturbable', accent: '#94a3b8' },
      { emoji: '🧙', title: 'EL MAGO', subtitle: 'Capaz de cualquier cosa', accent: '#c084fc' },
      { emoji: '🌟', title: 'ESTRELLA', subtitle: 'Brilla con luz propia', accent: '#fcd34d' },
      { emoji: '💤', title: 'EL DORMILÓN', subtitle: 'Siempre al límite', accent: '#6366f1' },
      { emoji: '🍷', title: 'SOMMELIER', subtitle: 'Siempre con clase', accent: '#f43f5e' },
    ];

    // Assign remaining fun titles to players deterministically
    const shuffledPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));
    let funIdx = 0;
    for (const p of shuffledPlayers) {
      if (funIdx >= funPool.length) break;
      list.push({ ...funPool[funIdx], playerId: p.id, stat: undefined });
      funIdx++;
    }

    return list.slice(0, Math.min(list.length, players.length + 8));
  }, [players, trackingData, sortedPlayers]);

  const podiumHeights = ['60%', '90%', '45%'];
  const podiumBorders = ['border-slate-400', 'border-yellow-400', 'border-amber-700'];
  const podiumTextColors = ['text-slate-400', 'text-yellow-400', 'text-amber-700'];
  const podiumLabels = ['2', '1', '3'];
  const podiumDelays = [0.5, 0.2, 0.8];

  return (
    <div className="fixed inset-0 z-[300] overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'podium' ? (
          <motion.div
            key="podium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-between p-6 overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12)_0%,transparent_60%)]" />
            </div>

            {/* Header */}
            <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-center relative z-10 pt-4">
              <p className="text-primary/70 font-mono text-xs uppercase tracking-[0.4em] mb-1">Resultados Finales</p>
              <h1 className="text-4xl font-black text-white tracking-tight">FIN DE PARTIDA</h1>
            </motion.div>

            {/* Podium */}
            <div className="relative w-full max-w-md flex items-end justify-center gap-3 h-64 z-10">
              {podiumOrder.map((player, i) => {
                if (!player) return null;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: podiumHeights[i], opacity: 1 }}
                    transition={{ delay: podiumDelays[i], duration: 0.7, ease: 'backOut' }}
                    className="flex-1 flex flex-col items-center relative"
                    style={{ height: podiumHeights[i] }}
                  >
                    {/* Avatar above bar */}
                    <div className="absolute -top-20 flex flex-col items-center gap-1">
                      {i === 1 && (
                        <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                          <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                        </motion.div>
                      )}
                      <div className={`rounded-full overflow-hidden border-4 ${podiumBorders[i]} shadow-xl ${i === 1 ? 'w-20 h-20 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'w-14 h-14'}`}>
                        {player.avatar_url ? (
                          <img src={player.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center font-black ${podiumTextColors[i]} bg-slate-800 ${i === 1 ? 'text-2xl' : 'text-base'}`}>
                            {player.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className={`font-black text-[10px] uppercase tracking-wider truncate max-w-[72px] ${i === 1 ? 'text-white text-xs' : 'text-white/70'}`}>{player.name}</span>
                    </div>

                    {/* Bar */}
                    <div className={`w-full h-full rounded-t-2xl border-t-4 ${i === 1 ? 'border-x-4' : ''} ${podiumBorders[i]} bg-gradient-to-b from-white/5 to-white/0 flex flex-col items-center justify-start pt-3 backdrop-blur-sm`}>
                      <span className={`font-black text-lg ${podiumTextColors[i]}`}>{podiumLabels[i]}</span>
                      <span className={`font-mono text-xs ${podiumTextColors[i]} mt-1`}>
                        <AnimatedCounter value={player.score} /> XP
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Actions */}
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }} className="w-full max-w-sm flex flex-col gap-3 relative z-10 pb-4">
              <button
                onClick={() => setPhase('bigdata')}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-sm tracking-wider shadow-[0_4px_24px_rgba(139,92,246,0.4)] active:scale-95 transition-transform"
              >
                <BarChart2 className="w-5 h-5" />
                VER ESTADÍSTICAS
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onRestart}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-white text-black font-black text-xs tracking-wider shadow-lg border-b-4 border-slate-300 active:border-b-0 active:translate-y-0.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> NUEVA
                </button>
                <button
                  onClick={onHome}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs tracking-wider active:scale-95 transition-transform"
                >
                  <Home className="w-4 h-4" /> INICIO
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="bigdata"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#080810] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-safe pt-6 pb-4 border-b border-white/5">
              <button onClick={() => setPhase('podium')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Post-Game</p>
                <h2 className="text-white font-black text-lg leading-none">BIG DATA</h2>
              </div>
              <BarChart2 className="ml-auto w-5 h-5 text-violet-400" />
            </div>

            {/* Awards scroll */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
              {awards.map((award, i) => {
                const p = players.find(pl => pl.id === award.playerId);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden px-4 py-3"
                    style={{ borderColor: `${award.accent}30`, background: `linear-gradient(135deg, ${award.accent}12 0%, transparent 70%)` }}
                  >
                    {/* Accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: award.accent }} />

                    {/* Emoji badge */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${award.accent}20` }}>
                      {award.emoji}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[10px] uppercase tracking-widest" style={{ color: award.accent }}>{award.title}</p>
                      <p className="text-white font-bold text-sm truncate">{p?.name || '???'}</p>
                      <p className="text-white/40 text-[10px]">{award.subtitle}</p>
                    </div>

                    {/* Stat pill */}
                    {award.stat && (
                      <div className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black" style={{ background: `${award.accent}25`, color: award.accent }}>
                        {award.stat}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {awards.length === 0 && (
                <div className="text-center text-white/30 text-sm mt-12">No hay suficientes datos aún</div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="px-4 pb-safe pb-6 pt-3 border-t border-white/5 flex gap-3">
              <button
                onClick={onRestart}
                className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-white text-black font-black text-sm tracking-wider shadow-lg border-b-4 border-slate-300 active:border-b-0 active:translate-y-0.5 transition-all"
              >
                <RotateCcw className="w-5 h-5" /> NUEVA PARTIDA
              </button>
              <button
                onClick={() => shareAwardsImage(awards, players)}
                className="h-14 px-4 flex items-center justify-center rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300 active:scale-95 transition-transform"
                title="Compartir"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={onHome}
                className="h-14 px-4 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-transform"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
