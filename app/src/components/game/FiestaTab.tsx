import { motion } from 'framer-motion';
import { ArrowRight, Flame, ShieldCheck, Sparkles, TimerReset, Users } from 'lucide-react';
import { GAME_MODES, GameMode, TAB_MAPPING } from '@/types/game';

interface FiestaTabProps {
  onSelectMode: (mode: GameMode) => void;
}

const highlightChips: Array<{ icon: any; label: string }> = [
  { icon: TimerReset, label: 'Rondas rápidas' },
  { icon: Users, label: 'Grupo grande' },
  { icon: ShieldCheck, label: 'Lectura clara' },
];

export function FiestaTab({ onSelectMode }: FiestaTabProps) {
  const fiestaModes = GAME_MODES.filter((m) => TAB_MAPPING.fiesta.includes(m.id));
  const featuredModes = fiestaModes.slice(0, 3);

  return (
    <div className="app-shell pt-4">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]"
      >
        <div className="surface-panel relative overflow-hidden p-5 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_40%)] opacity-90" />
          <div className="relative space-y-5">
            <div className="space-y-3">
              <span className="section-badge">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Fiesta y risas
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Modos para <span className="premium-title">romper el hielo</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Tarjetas más limpias, mejor jerarquía visual y acceso rápido a los modos más sociales desde tu dispositivo.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {highlightChips.map(({ icon: Icon, label }) => (
                <span key={label} className="premium-chip text-white/80 border-white/5 bg-white/5">
                  <Icon className="h-3.5 w-3.5 text-white/50" />
                  {label}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featuredModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onSelectMode(mode.id)}
                  className="premium-panel-soft rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.10]"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      {mode.icon}
                    </div>
                    {mode.badge && (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                        {mode.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">{mode.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-soft rounded-[28px] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-white">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Empieza en segundos</p>
              <p className="text-xs text-muted-foreground">Selecciona un modo y luego decide si juegas local o con sala.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="premium-stat">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Ideal para</p>
              <p className="mt-2 text-lg font-black text-white">Cumples, previas y cenas</p>
              <p className="mt-1 text-sm text-muted-foreground">Todo se entiende de un vistazo y con menos ruido visual.</p>
            </div>
            <div className="premium-stat">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Experiencia</p>
              <p className="mt-2 text-lg font-black text-white">Más clara en móvil</p>
              <p className="mt-1 text-sm text-muted-foreground">Botones grandes, tarjetas respiradas y mejor lectura al pasar el teléfono.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fiestaModes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectMode(mode.id)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
            className="card-hover group surface-panel relative overflow-hidden p-5 text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-[0.14]`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%)] opacity-90" />
            <div className="relative flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-3xl shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05)]">
                    {mode.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{mode.name}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">Modo fiesta</p>
                  </div>
                </div>
                {mode.badge && (
                  <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    {mode.badge}
                  </span>
                )}
              </div>

              <p className="min-h-[68px] text-sm leading-6 text-muted-foreground">{mode.description}</p>

              <div className="mt-auto flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Móvil</span>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Premium UI</span>
                {mode.adultOnly && <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">+18</span>}
                {mode.teamBased && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Equipos</span>}
              </div>

              <div className="flex items-center justify-between border-t border-white/8 pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Entrada</p>
                  <p className="mt-1 text-sm font-semibold text-white">Toca y elige formato</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                  Jugar <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
