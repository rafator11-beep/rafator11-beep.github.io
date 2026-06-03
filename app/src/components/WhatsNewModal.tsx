import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Flame, Brain, Trophy, Star, Layers, Shuffle } from 'lucide-react';

const CURRENT_VERSION = '5.0';
const STORAGE_KEY = 'beep_version_seen';

const updates = [
  {
    icon: <Brain className="w-5 h-5 text-violet-400" />,
    color: 'from-violet-950/60 to-slate-950/60 border-violet-500/30',
    label: 'INTELIGENCIA ARTIFICIAL',
    title: 'IA Gemini activa 🤖',
    desc: 'Cartas personalizadas con vuestros nombres, piques del historial de partida y referencias a tendencias 2025: Bizarrap, Bad Bunny, memes TikTok, series virales...',
  },
  {
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
    color: 'from-cyan-950/60 to-slate-950/60 border-cyan-500/30',
    label: 'CAPITÁN',
    title: 'Panel Capitán rediseñado 👑',
    desc: 'Nuevo panel deslizante con 5 comandos (Hacer beber, Virus, Anular norma, Doble o nada, Todos beben) y selector de jugador con contadores de tragos en tiempo real.',
  },
  {
    icon: <Shuffle className="w-5 h-5 text-emerald-400" />,
    color: 'from-emerald-950/60 to-slate-950/60 border-emerald-500/30',
    label: 'MEGAMIX',
    title: 'Megamix más activo ⚡',
    desc: 'Nuevo patrón [GRUPAL + INDIVIDUAL] por turno. Torneos cada 15 cartas. Yo Nunca siempre grupal — todos votan a la vez. Más dinamismo en cada ronda.',
  },
  {
    icon: <Trophy className="w-5 h-5 text-amber-400" />,
    color: 'from-amber-950/60 to-slate-950/60 border-amber-500/30',
    label: 'PUNTUACIÓN',
    title: 'XP realista y estadísticas 🏆',
    desc: 'Sistema de XP reequilibrado: reto=30, duelo ganado=45, torneo ganado=80, impostor se escapa=60. Contadores de tragos visibles en los avatares durante la partida.',
  },
  {
    icon: <Flame className="w-5 h-5 text-rose-400" />,
    color: 'from-rose-950/60 to-slate-950/60 border-rose-500/30',
    label: 'CONTENIDO',
    title: '+1.300 cartas nuevas 🃏',
    desc: 'Más de 1.300 cartas nuevas en todos los modos: Yo Nunca por etapa vital (infancia, instituto, uni, curro, fiesta), Picante, Votación, Retos, Salseo, En la Cama y más.',
  },
  {
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    color: 'from-yellow-950/60 to-slate-950/60 border-yellow-500/30',
    label: 'VISUAL',
    title: 'Animaciones mejoradas ✨',
    desc: 'Flip 3D en las cartas al pasar. Flash de turno con avatar del jugador y glow de color. Badges de bebidas 🍺 en tiempo real sobre los avatares.',
  },
  {
    icon: <Star className="w-5 h-5 text-pink-400" />,
    color: 'from-pink-950/60 to-slate-950/60 border-pink-500/30',
    label: 'IMPOSTOR',
    title: 'Impostor con IA 🕵️',
    desc: 'La ronda del Impostor ahora puede ser generada por la IA con categorías y palabras únicas. El impostor que se escapa gana 60 XP.',
  },
];

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CURRENT_VERSION) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="whats-new"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9000] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-violet-950/60 to-slate-900">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">BEEP v{CURRENT_VERSION} · IA EDITION</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">¿Qué hay de nuevo?</h2>
              <p className="text-white/40 text-xs mt-0.5">Actualización mayor — IA, 1.300+ cartas y más</p>
            </div>

            {/* Updates list */}
            <div className="flex flex-col gap-2 px-4 py-3 max-h-[60vh] overflow-y-auto">
              {updates.map((u, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.07 * i }}
                  className={`flex gap-3 items-start bg-gradient-to-r ${u.color} border rounded-2xl p-3`}
                >
                  <div className="mt-0.5 shrink-0">{u.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{u.label}</span>
                    </div>
                    <p className="font-black text-white text-sm leading-tight">{u.title}</p>
                    <p className="text-white/55 text-xs leading-snug mt-0.5">{u.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-4 pb-5 pt-2">
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 active:scale-[0.98] text-white font-black text-base uppercase tracking-widest transition-all shadow-lg shadow-violet-900/40"
              >
                ¡A jugar! 🤖🎉
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
