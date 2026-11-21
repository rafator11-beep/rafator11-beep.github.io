import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '@/lib/sfx';
import { vibe } from '@/lib/vibration';
import { bombTickInterval, pickTwoTopics, randomBombDuration } from '@/utils/megamixBomb';

interface Props {
  open: boolean;
  /** Tema de la carta que la ha activado. */
  topic?: string;
  onClose: () => void;
}

// Pantalla completa mientras el móvil pasa de mano en mano. Durante el tic-tac
// no hay botones: así nadie la cierra sin querer al pasarse el móvil.
// "Otra ronda" ofrece dos temas a elegir (uno de cultura básica y otro de fiesta).
export function BombOverlay({ open, topic: cardTopic, onClose }: Props) {
  const [phase, setPhase] = useState<'ticking' | 'boom' | 'choose'>('ticking');
  const [round, setRound] = useState(0);
  const [topic, setTopic] = useState(cardTopic);
  const [options, setOptions] = useState<[string, string]>(() => pickTwoTopics());
  const durationRef = useRef(0);

  // Al abrirse desde una carta, el tema es el de la carta.
  useEffect(() => {
    if (open) setTopic(cardTopic);
  }, [open, cardTopic]);

  // Cada vez que se abre (o empieza otra ronda) se elige un tiempo nuevo.
  useEffect(() => {
    if (!open) return;
    durationRef.current = randomBombDuration();
    setPhase('ticking');
  }, [open, round]);

  useEffect(() => {
    if (!open || phase !== 'ticking') return;
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= durationRef.current) {
        sfx.boom();
        vibe([500, 100, 500]);
        setPhase('boom');
        return;
      }
      sfx.tick();
      vibe(25);
      timer = setTimeout(tick, bombTickInterval(elapsed / durationRef.current));
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [open, phase, round]);

  const startWith = (next: string) => {
    setTopic(next);
    setRound((r) => r + 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[170] flex flex-col items-center justify-center p-6 text-center ${
            phase === 'boom' ? 'bg-red-700' : 'bg-slate-950'
          }`}
        >
          {phase === 'ticking' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-[8rem] leading-none"
              >
                💣
              </motion.div>
              {topic && (
                <div className="mt-6 w-full max-w-sm rounded-2xl border border-orange-400/40 bg-orange-500/10 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Tema</p>
                  <p className="mt-1 text-xl font-black leading-tight text-white">{topic}</p>
                </div>
              )}
              <p className="mt-5 text-2xl font-black uppercase text-white">¡Pasad el móvil!</p>
              <p className="mt-2 text-sm font-semibold text-white/60">
                Uno cada uno y a la derecha. Va a explotar… nadie sabe cuándo.
              </p>
            </>
          )}

          {phase === 'boom' && (
            <>
              <motion.div
                initial={{ scale: 0.3 }}
                animate={{ scale: [0.3, 1.4, 1] }}
                className="text-[9rem] leading-none"
              >
                💥
              </motion.div>
              <p className="mt-4 text-5xl font-black text-white">¡BUM!</p>
              <p className="mt-3 text-lg font-bold text-white/90">
                Quien tenga el móvil en la mano, bebe 3.
              </p>
              <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOptions(pickTwoTopics([topic]));
                    setPhase('choose');
                  }}
                  className="rounded-2xl border-2 border-white/40 bg-white/10 py-3.5 text-sm font-black uppercase tracking-widest text-white active:scale-95"
                >
                  💣 Otra ronda
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl bg-white py-3.5 text-sm font-black uppercase tracking-widest text-red-700 active:scale-95"
                >
                  Seguir jugando
                </button>
              </div>
            </>
          )}

          {phase === 'choose' && (
            <div className="w-full max-w-sm">
              <p className="text-5xl">💣</p>
              <p className="mt-3 text-xl font-black uppercase text-white">¿De qué va la siguiente?</p>
              <p className="mt-1 text-sm text-white/50">Elegid tema entre todos</p>
              <div className="mt-6 flex flex-col gap-3">
                {options.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => startWith(t)}
                    className={`rounded-2xl border-2 px-4 py-4 text-left active:scale-95 ${
                      i === 0
                        ? 'border-sky-400/50 bg-sky-500/15'
                        : 'border-orange-400/50 bg-orange-500/15'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-black uppercase tracking-[0.25em] ${
                        i === 0 ? 'text-sky-300' : 'text-orange-300'
                      }`}
                    >
                      {i === 0 ? '🧠 ¿Sabes más que un niño de primaria?' : '🎉 De fiesta'}
                    </span>
                    <span className="mt-1 block text-lg font-black leading-tight text-white">{t}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions(pickTwoTopics([topic, ...options]))}
                className="mt-4 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white/70 active:scale-95"
              >
                🎲 Otros dos
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2 text-xs font-bold uppercase tracking-widest text-white/40"
              >
                Seguir jugando
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
