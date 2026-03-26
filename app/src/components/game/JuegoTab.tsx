import { useState } from 'react';
import { motion } from 'framer-motion';
import { GAME_MODES, GameMode, TAB_MAPPING, PlayMode } from '@/types/game';
import { ArrowRight, Globe, Smartphone, Trophy, Wifi, Users, Sword } from 'lucide-react';

interface JuegoTabProps {
  onSelectMode: (mode: GameMode, selectedPlayMode: PlayMode) => void;
}

const playModeInfo = {
  local: {
    title: 'Mismo dispositivo',
    description: 'Ideal para pasar el móvil en rondas rápidas.',
    icon: Smartphone,
    chip: 'Sin código',
  },
  online: {
    title: 'Sala online',
    description: 'Cada persona entra desde su móvil con código.',
    icon: Globe,
    chip: 'Con sala',
  },
} satisfies Record<PlayMode, { title: string; description: string; icon: any; chip: string }>;

export function JuegoTab({ onSelectMode }: JuegoTabProps) {
  const [playMode, setPlayMode] = useState<PlayMode>('local');
  const juegoModes = GAME_MODES.filter((m) => TAB_MAPPING.juego.includes(m.id));
  const activeInfo = playModeInfo[playMode];
  const ActiveIcon = activeInfo.icon;

  return (
    <div className="app-shell pt-4">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]"
      >
        <div className="surface-panel relative overflow-hidden p-5 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_40%)]" />
          <div className="relative space-y-5">
            <div className="space-y-3">
              <span className="section-badge">
                <Trophy className="mr-2 h-3.5 w-3.5" />
                Competitivo
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Juega con un estilo <span className="premium-title">más premium</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Panel de selección más limpio, cambio rápido entre local y online, y tarjetas más estructuradas para cada modo.
                </p>
              </div>
            </div>

            <div className="surface-soft inline-flex w-full max-w-[420px] rounded-[24px] p-1.5">
              <button
                onClick={() => setPlayMode('local')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  playMode === 'local'
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                En el mismo móvil
              </button>
              <button
                onClick={() => setPlayMode('online')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  playMode === 'online'
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Globe className="h-4 w-4" />
                Online
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="premium-panel-soft rounded-[22px] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Formato activo</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-2.5 text-white">
                    <ActiveIcon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{activeInfo.title}</p>
                    <p className="text-xs text-muted-foreground">{activeInfo.chip}</p>
                  </div>
                </div>
              </div>
              <div className="premium-panel-soft rounded-[22px] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Lectura</p>
                <p className="mt-3 text-sm font-bold text-white">Paneles más claros</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Mejor separación entre acción, información y entrada a la partida.</p>
              </div>
              <div className="premium-panel-soft rounded-[22px] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Ideal para</p>
                <p className="mt-3 text-sm font-bold text-white">Duelo y estrategia</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Poker, parchís y juegos de conocimiento con mejor presencia visual.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-soft rounded-[28px] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-white">
              <Sword className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Selección directa</p>
              <p className="text-xs text-muted-foreground">Todo el bloque competitivo ahora se entiende de un vistazo.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="premium-stat">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-[hsl(var(--accent))]" />
                <p className="text-sm font-bold text-white">{activeInfo.title}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{activeInfo.description}</p>
            </div>
            <div className="premium-stat">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[hsl(var(--accent))]" />
                <p className="text-sm font-bold text-white">Flujo más claro</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Primero eliges formato, luego el juego. Menos dudas y menos toques.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {juegoModes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectMode(mode.id, playMode)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
            className="card-hover group surface-panel relative overflow-hidden p-5 text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-[0.12]`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)] opacity-90" />
            <div className="relative flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-3xl shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)]">
                    {mode.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{mode.name}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {playMode === 'local' ? 'Partida local' : 'Partida online'}
                    </p>
                  </div>
                </div>
                {mode.badge && (
                  <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    {mode.badge}
                  </span>
                )}
              </div>

              <p className="min-h-[68px] text-sm leading-6 text-muted-foreground">{mode.description}</p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">{activeInfo.chip}</span>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Premium UI</span>
                {mode.teamBased && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Equipos</span>}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Acceso</p>
                  <p className="mt-1 text-sm font-semibold text-white">Abrir tablero</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                  Abrir <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
