import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Flame, Brain, Trophy, Star } from 'lucide-react';

const CURRENT_VERSION = '5.2';
const STORAGE_KEY = 'beep_version_seen';

const updates = [
  {
    icon: <Flame className="w-5 h-5 text-rose-400" />,
    color: 'from-rose-950/60 to-slate-950/60 border-rose-500/30',
    label: 'CONTENIDO',
    title: '¡Casi 30.000 cartas! 🃏',
    desc: 'Muchísimas cartas nuevas de Yo Nunca, retos, picante, votaciones... y del día a día de tener 30 años. En Megamix casi no se repite ni jugando cientos de partidas.',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    color: 'from-cyan-950/60 to-slate-950/60 border-cyan-500/30',
    label: 'TIPOS NUEVOS',
    title: 'Cartas que no había 🎭',
    desc: '¿Qué prefieres?, Paranoia (le susurras una pregunta al de al lado), Manos Arriba, El Ranking, Escena improvisada, Dos Verdades y una Mentira, 10 Segundos y El Móvil Manda.',
  },
  {
    icon: <Brain className="w-5 h-5 text-violet-400" />,
    color: 'from-violet-950/60 to-slate-950/60 border-violet-500/30',
    label: 'MOTOR',
    title: 'Todo conectado ⚙️',
    desc: 'Las cartas se acuerdan de lo que respondisteis y lo sacan luego, montan piques entre vosotros, meten la norma activa y hasta la liga de duelos. Sin internet.',
  },
  {
    icon: <Trophy className="w-5 h-5 text-amber-400" />,
    color: 'from-amber-950/60 to-slate-950/60 border-amber-500/30',
    label: 'MEGAMIX',
    title: 'Bracket que no para 🏆',
    desc: 'El torneo de duelos ahora encadena llaves: gana uno, empieza otra, y hay una clasificación de campeones. Menos "reparte tragos a quien quieras", más reacción al momento.',
  },
  {
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    color: 'from-yellow-950/60 to-slate-950/60 border-yellow-500/30',
    label: 'ENTRAR',
    title: 'Empezar es más fácil 🚀',
    desc: 'Te pones un nombre, eliges monigote y a jugar. La cuenta es opcional (guarda tus monedas y tu ranking). Todo en cristiano, sin palabros raros.',
  },
  {
    icon: <Star className="w-5 h-5 text-pink-400" />,
    color: 'from-pink-950/60 to-slate-950/60 border-pink-500/30',
    label: 'RESUMEN',
    title: 'Clasificación al final 📊',
    desc: 'El podio muestra a todos con sus XP, sus tragos 🍺 y sus llaves de duelo 🏆, más los títulos de la noche ("EL BORRACHÍN", "REY DE LOS DUELOS"...).',
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
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">BEEP v{CURRENT_VERSION} · POST-VERANO 2026</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">¿Qué hay de nuevo?</h2>
              <p className="text-white/40 text-xs mt-0.5">Motor de salseo local, miles de cartas nuevas, bracket continuo</p>
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
                ¡A jugar! 🎉
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
