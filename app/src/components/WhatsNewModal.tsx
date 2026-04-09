import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Users, Dices, Shield, Flame } from 'lucide-react';

const CURRENT_VERSION = '3.0';
const STORAGE_KEY = 'beep_version_seen';

const updates = [
  {
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    color: 'from-yellow-950/60 to-slate-950/60 border-yellow-500/30',
    label: 'NUEVO',
    title: '14 modos de juego',
    desc: 'MegaBoard 3D, Parchís Huesca, Poker Online, Yo Nunca Equipos y más. La mayor actualización de contenido hasta ahora.',
  },
  {
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    color: 'from-purple-950/60 to-slate-950/60 border-purple-500/30',
    label: 'ARCADE',
    title: 'Arcade completo',
    desc: 'Coin Flip, Quick Draw, Simon PvP, Minesweeper, Slot Machine, Memory Match y más minijuegos para jugar entre rondas.',
  },
  {
    icon: <Dices className="w-5 h-5 text-green-400" />,
    color: 'from-green-950/60 to-slate-950/60 border-green-500/30',
    label: 'MEGAMIX',
    title: 'Virus, normas y caos',
    desc: 'Sistema de virus con identidad, normas activas por rondas, poderes del capitán y eventos especiales rebalanceados.',
  },
  {
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    color: 'from-blue-950/60 to-slate-950/60 border-blue-500/30',
    label: 'ONLINE',
    title: 'Multijugador mejorado',
    desc: 'Salas online más estables, sincronización en tiempo real y videollamada integrada para el modo Poker.',
  },
  {
    icon: <Flame className="w-5 h-5 text-red-400" />,
    color: 'from-red-950/60 to-slate-950/60 border-red-500/30',
    label: 'UI',
    title: 'Diseño premium renovado',
    desc: 'Tabs Fiesta y Competitivo rediseñadas, podio con Big Data al final de partida y Hall of Fame con temporadas.',
  },
  {
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    color: 'from-cyan-950/60 to-slate-950/60 border-cyan-500/30',
    label: 'CONTENIDO',
    title: '+19.000 pruebas',
    desc: 'Más de 19.000 cartas, retos, normas, preguntas de cultura y fútbol. El mazo más grande hasta la fecha.',
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
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">Actualización {CURRENT_VERSION}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">¿Qué hay de nuevo?</h2>
              <p className="text-white/40 text-xs mt-0.5">Lo que llega con esta versión de BEEP</p>
            </div>

            {/* Updates list */}
            <div className="flex flex-col gap-2 px-4 py-3 max-h-[60vh] overflow-y-auto">
              {updates.map((u, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
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
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-base uppercase tracking-widest transition-all shadow-lg shadow-violet-900/40"
              >
                Entendido — a jugar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
