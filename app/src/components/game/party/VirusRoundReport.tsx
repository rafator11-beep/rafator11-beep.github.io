import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/types/game';
import { cureOutcome, roundsLabel, type VirusRoundReport as Report } from '@/utils/megamixViruses';

interface Props {
  report: Report | null;
  players: Player[];
  onClose: () => void;
}

// Parte de virus al acabar cada ronda: quién sigue infectado y quién se cura.
export function VirusRoundReport({ report, players, onClose }: Props) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';

  return (
    <AnimatePresence>
      {report && (
        <motion.div
          key={report.round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[158] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl border border-green-500/40 bg-slate-950 p-5 text-center shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
              🦠 Parte de virus · fin de la ronda {report.round}
            </p>

            {report.remaining.length > 0 && (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-xs font-bold uppercase text-white/40">Siguen infectados</p>
                {report.remaining.map((v) => (
                  <div key={v.playerId} className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2">
                    <p className="text-sm font-bold text-white">
                      {name(v.playerId)} <span className="text-green-300">· {v.virusName}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      Le {v.turnsRemaining === 1 ? 'queda' : 'quedan'} {roundsLabel(v.turnsRemaining)}
                      {(v.caught ?? 0) > 0 && ` · pillado ${v.caught} ${v.caught === 1 ? 'vez' : 'veces'}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {report.cured.length > 0 && (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-xs font-bold uppercase text-white/40">Se curan</p>
                {report.cured.map((v) => {
                  const out = cureOutcome(v);
                  return (
                    <div key={v.playerId} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-sm font-bold text-white">
                        ✅ {name(v.playerId)} se cura de {v.virusName}
                      </p>
                      <p className={`text-xs font-bold ${out.kind === 'bebe' ? 'text-red-300' : 'text-emerald-300'}`}>
                        {out.kind === 'bebe'
                          ? `Le pillasteis ${v.caught} ${v.caught === 1 ? 'vez' : 'veces'}: bebe ${out.drinks}`
                          : `¡Sin fallos! Reparte ${out.drinks}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-green-500 py-3.5 text-sm font-black uppercase tracking-widest text-black active:scale-95"
            >
              Seguimos
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
