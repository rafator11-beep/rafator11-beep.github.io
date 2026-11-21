import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/types/game';
import { normaVerdict, type NormaResult } from '@/utils/megamixNormas';

interface Props {
  result: NormaResult | null | undefined;
  players: Player[];
  captainName?: string;
  onClose: () => void;
}

// Veredicto al acabar una norma: quién ha caído más bebe, los limpios reparten.
export function NormaVerdict({ result, players, captainName, onClose }: Props) {
  const verdict = result ? normaVerdict(result.infractions, players.map((p) => p.id)) : null;
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';

  return (
    <AnimatePresence>
      {result && verdict && (
        <motion.div
          key={result.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-slate-950 p-5 text-center shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
              📜 Fin de la norma
            </p>
            <p className="mt-2 text-sm font-semibold text-white/70">{result.text}</p>

            {verdict.nobody ? (
              <p className="mt-5 text-xl font-black text-white">
                Nadie ha caído… ¿seguro? 🤨
                <span className="mt-2 block text-base font-bold text-amber-300">
                  {captainName ?? 'El capitán'} bebe {verdict.drinks} por mal vigilante.
                </span>
              </p>
            ) : (
              <>
                <p className="mt-5 text-2xl font-black text-white">
                  {verdict.worstIds.map(name).join(' y ')}
                </p>
                <p className="mt-1 text-base font-bold text-red-300">
                  {verdict.worstCount} {verdict.worstCount === 1 ? 'vez' : 'veces'} pillado
                  {verdict.worstIds.length > 1 ? 's' : ''} · bebe{verdict.worstIds.length > 1 ? 'n' : ''}{' '}
                  {verdict.drinks}
                </p>
                {verdict.cleanIds.length > 0 && (
                  <p className="mt-4 text-sm text-emerald-300">
                    Limpios: {verdict.cleanIds.map(name).join(', ')} · reparten 1 cada uno
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-sm font-black uppercase tracking-widest text-black active:scale-95"
            >
              Seguimos
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
