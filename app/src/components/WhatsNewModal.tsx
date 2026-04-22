import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Flame, Timer, Layers, Smartphone } from 'lucide-react';

const CURRENT_VERSION = '4.0';
const STORAGE_KEY = 'beep_version_seen';

const updates = [
  {
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    color: 'from-cyan-950/60 to-slate-950/60 border-cyan-500/30',
    label: 'NUEVO MODO',
    title: 'Speed Round ⚡',
    desc: '120 preguntas relámpago con temporizador de 10s, combos y 6 categorías. ¿Cuántas aciertas?',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-violet-400" />,
    color: 'from-violet-950/60 to-slate-950/60 border-violet-500/30',
    label: 'VISUAL',
    title: 'Motor APEX Engine',
    desc: 'Rediseño visual completo: nuevo sistema glassmorphism, animaciones mejoradas y fuente Outfit para títulos.',
  },
  {
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    color: 'from-orange-950/60 to-slate-950/60 border-orange-500/30',
    label: 'CONTENIDO',
    title: '+200 retos y preguntas',
    desc: 'Contenido fresco: retos con TikTok, ChatGPT, Spotify. Yo nunca modernos, votaciones actuales y más.',
  },
  {
    icon: <Timer className="w-5 h-5 text-green-400" />,
    color: 'from-green-950/60 to-slate-950/60 border-green-500/30',
    label: 'MEJORA',
    title: 'Sistema de combos',
    desc: 'Aciertos seguidos = multiplicador de puntos. Racha de fuego visual cuando llevas 3+.',
  },
  {
    icon: <Smartphone className="w-5 h-5 text-pink-400" />,
    color: 'from-pink-950/60 to-slate-950/60 border-pink-500/30',
    label: 'UX',
    title: 'Splash Screen v2',
    desc: 'Nuevo arranque cinematográfico con partículas, barra tricolor y branding APEX ENGINE.',
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
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-cyan-950/60 to-slate-900">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">BEEP v{CURRENT_VERSION} · APEX</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight font-title">¿Qué hay de nuevo?</h2>
              <p className="text-white/40 text-xs mt-0.5">Actualización APEX ENGINE — todo mejorado</p>
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white font-black text-base uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/40"
              >
                ¡A jugar! ⚡
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
