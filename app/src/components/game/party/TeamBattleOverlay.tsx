import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/types/game';
import { makeTeams, pickTeamChallenge, type Team } from '@/utils/megamixTeams';

interface Props {
  open: boolean;
  players: Player[];
  onDone: () => void;
}

// Guerra de equipos: la app hace los equipos y propone la prueba; se marca el
// equipo ganador y se dice quién bebe y quién reparte.
export function TeamBattleOverlay({ open, players, onDone }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [challenge, setChallenge] = useState('');
  const [winner, setWinner] = useState<Team | null>(null);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';

  // Equipos y prueba nuevos cada vez que se abre (en un efecto, no en el render).
  useEffect(() => {
    if (!open) return;
    setTeams(makeTeams(players.map((p) => p.id)));
    setChallenge(pickTeamChallenge());
    setWinner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[166] flex flex-col items-center overflow-y-auto bg-slate-950/95 p-4 pt-8 text-center backdrop-blur-md"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">⚔️ Guerra de equipos</p>

          {winner ? (
            <div className="mt-6 w-full max-w-md">
              <p className="text-3xl font-black text-white">🏆 Ganan {winner.name}</p>
              <p className="mt-2 text-sm font-bold text-emerald-300">Reparten 1 cada uno</p>
              <div className="mt-5 space-y-2">
                {teams
                  .filter((t) => t !== winner)
                  .map((t) => (
                    <div key={t.name} className={`rounded-2xl border px-3 py-2 ${t.tone}`}>
                      <p className="text-sm font-black">{t.name} bebe 2 cada uno</p>
                      <p className="text-xs opacity-80">{t.playerIds.map(name).join(', ')}</p>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                onClick={onDone}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3.5 text-sm font-black uppercase tracking-widest text-white active:scale-95"
              >
                Volver a las cartas
              </button>
            </div>
          ) : (
            <div className="mt-4 w-full max-w-md">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-base font-bold leading-snug text-white">{challenge}</p>
              </div>

              <div className={`mt-4 grid gap-2 ${teams.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {teams.map((t) => (
                  <div key={t.name} className={`rounded-2xl border p-3 text-left ${t.tone}`}>
                    <p className="text-sm font-black">{t.name}</p>
                    <p className="mt-1 text-xs leading-snug text-white/80">{t.playerIds.map(name).join(', ')}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs font-semibold text-white/50">¿Qué equipo ha ganado?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {teams.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setWinner(t)}
                    className={`rounded-2xl border-2 px-3 py-3.5 text-sm font-black active:scale-95 ${t.tone}`}
                  >
                    🏆 {t.name}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTeams(makeTeams(players.map((p) => p.id)))}
                  className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white/70 active:scale-95"
                >
                  🔀 Otros equipos
                </button>
                <button
                  type="button"
                  onClick={() => setChallenge((c) => pickTeamChallenge(c))}
                  className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white/70 active:scale-95"
                >
                  🎲 Otra prueba
                </button>
              </div>
              <button
                type="button"
                onClick={onDone}
                className="mt-2 w-full py-2 text-xs font-bold uppercase tracking-widest text-white/40"
              >
                Saltar
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
