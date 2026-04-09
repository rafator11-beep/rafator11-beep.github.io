import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Flame } from 'lucide-react';
import { GAME_MODES, GameMode, TAB_MAPPING } from '@/types/game';

interface FiestaTabProps {
  onSelectMode: (mode: GameMode) => void;
}

export function FiestaTab({ onSelectMode }: FiestaTabProps) {
  const fiestaModes = GAME_MODES.filter((m) => TAB_MAPPING.fiesta.includes(m.id));

  return (
    <div className="app-shell pt-4">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fiesta-hero mb-6 p-6 md:p-8"
      >
        {/* Orbe decorativo */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[hsl(var(--primary)/0.15)] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[hsl(var(--neon-orange)/0.12)] blur-[60px]" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="section-badge">
                <Flame className="mr-1.5 h-3 w-3" />
                Modo Fiesta
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                <span className="live-dot" />
                En vivo
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              La fiesta<br />
              <span className="premium-title">empieza aquí</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/50 md:text-base">
              +19.000 cartas, retos, normas y caos. Elige modo y pasa el móvil.
            </p>
          </div>

          {/* Stats rápidos */}
          <div className="flex gap-3 md:flex-col">
            {[
              { icon: '🎲', label: 'Modos', value: `${fiestaModes.length}` },
              { icon: '🃏', label: 'Cartas', value: '19K+' },
              { icon: '👥', label: 'Jugadores', value: '2–20' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
                <span className="text-xl">{icon}</span>
                <span className="mt-1 text-lg font-black text-white">{value}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── GRID DE MODOS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fiestaModes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
            onClick={() => onSelectMode(mode.id)}
            whileTap={{ scale: 0.97 }}
            className="mode-card group text-left p-5"
          >
            {/* Glow de color del modo */}
            <div
              className={`mode-card-glow bg-gradient-to-br ${mode.color}`}
            />

            {/* Brillo superior */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex h-full flex-col gap-4">

              {/* Header: icono + badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="mode-icon-wrap">
                  {mode.icon}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {mode.badge && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                      {mode.badge}
                    </span>
                  )}
                  {mode.adultOnly && (
                    <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-300 border border-red-500/30">
                      +18
                    </span>
                  )}
                </div>
              </div>

              {/* Nombre y descripción */}
              <div className="flex-1">
                <h2 className="text-lg font-black text-white leading-tight">{mode.name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{mode.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {mode.teamBased && (
                  <span className="flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/50">
                    <Users className="h-3 w-3" /> Equipos
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-white/50">
                  <Zap className="h-3 w-3" /> Offline
                </span>
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between border-t border-white/6 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  Toca para jugar
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white transition-all group-hover:bg-[hsl(var(--primary)/0.3)] group-hover:text-[hsl(var(--primary))]">
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
