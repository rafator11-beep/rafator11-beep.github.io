import { useState } from 'react';
import { motion } from 'framer-motion';
import { GAME_MODES, GameMode, TAB_MAPPING, PlayMode } from '@/types/game';
import { ArrowRight, Globe, Smartphone, Trophy, Users, Zap } from 'lucide-react';

interface JuegoTabProps {
  onSelectMode: (mode: GameMode, selectedPlayMode: PlayMode) => void;
}

export function JuegoTab({ onSelectMode }: JuegoTabProps) {
  const [playMode, setPlayMode] = useState<PlayMode>('local');
  const juegoModes = GAME_MODES.filter((m) => TAB_MAPPING.juego.includes(m.id));

  return (
    <div className="app-shell pt-4">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-6 overflow-hidden rounded-[28px] border border-[hsl(var(--neon-cyan)/0.2)] p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(0,180,255,0.10) 0%, rgba(25,15,50,0.95) 40%, rgba(12,8,25,0.98) 100%)',
          boxShadow: '0 24px 64px -24px rgba(0,180,255,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[hsl(var(--neon-cyan)/0.12)] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-[hsl(var(--neon-purple)/0.10)] blur-[60px]" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <span className="section-badge" style={{ borderColor: 'hsl(var(--neon-cyan)/0.4)', background: 'hsl(var(--neon-cyan)/0.1)', color: 'hsl(var(--neon-cyan))' }}>
                <Trophy className="mr-1.5 h-3 w-3" />
                Modo Competitivo
              </span>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                Juega en serio.<br />
                <span style={{
                  background: 'linear-gradient(135deg, #fff 0%, hsl(var(--neon-cyan)) 50%, hsl(var(--neon-purple)) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Gana con estilo.
                </span>
              </h1>
            </div>

            {/* Toggle local / online */}
            <div className="flex self-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
              {(['local', 'online'] as PlayMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPlayMode(m)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    playMode === m
                      ? 'bg-white/12 text-white shadow-sm ring-1 ring-white/15'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {m === 'local' ? <Smartphone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  {m === 'local' ? 'Local' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {/* Info del modo seleccionado */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
              {playMode === 'local' ? <Smartphone className="h-4 w-4 text-white/60" /> : <Globe className="h-4 w-4 text-[hsl(var(--neon-cyan))]" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {playMode === 'local' ? 'Mismo dispositivo' : 'Sala online con código'}
              </p>
              <p className="text-xs text-white/40">
                {playMode === 'local' ? 'Pasad el móvil en cada turno.' : 'Cada jugador entra desde su propio móvil.'}
              </p>
            </div>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
              playMode === 'online'
                ? 'bg-[hsl(var(--neon-cyan)/0.15)] text-[hsl(var(--neon-cyan))] border border-[hsl(var(--neon-cyan)/0.3)]'
                : 'bg-white/8 text-white/40'
            }`}>
              {playMode === 'local' ? 'Sin red' : 'Multijugador'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── GRID DE MODOS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {juegoModes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
            onClick={() => onSelectMode(mode.id, playMode)}
            whileTap={{ scale: 0.97 }}
            className="mode-card group text-left p-5"
          >
            <div className={`mode-card-glow bg-gradient-to-br ${mode.color}`} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="relative z-10 flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="mode-icon-wrap">{mode.icon}</div>
                <div className="flex flex-col items-end gap-1.5">
                  {mode.badge && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                      {mode.badge}
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                    playMode === 'online'
                      ? 'bg-[hsl(var(--neon-cyan)/0.12)] text-[hsl(var(--neon-cyan))] border-[hsl(var(--neon-cyan)/0.25)]'
                      : 'bg-white/6 text-white/40 border-white/10'
                  }`}>
                    {playMode === 'local' ? 'Local' : 'Online'}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-black text-white leading-tight">{mode.name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{mode.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {mode.teamBased && (
                  <span className="flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/50">
                    <Users className="h-3 w-3" /> Equipos
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/50">
                  <Zap className="h-3 w-3" /> Competitivo
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  {playMode === 'local' ? 'Jugar local' : 'Crear sala'}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white transition-all group-hover:bg-[hsl(var(--neon-cyan)/0.25)] group-hover:text-[hsl(var(--neon-cyan))]">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
