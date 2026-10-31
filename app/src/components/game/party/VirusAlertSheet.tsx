import { motion, AnimatePresence } from 'framer-motion';

interface VirusAlertSheetProps {
  show: boolean;
  data: any;
  onAcknowledge: () => void;
}

// Sheet compacto desde abajo, con fondo que tapa el resto
export function VirusAlertSheet({ show, data, onAcknowledge }: VirusAlertSheetProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="virus-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-slate-950/88 fixed inset-0 z-[245] backdrop-blur-md"
        />
      )}
      {show && (
        <motion.div
          key="virus-banner"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-[250] flex justify-center px-4 pb-6 pt-2"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="from-green-950/98 to-slate-950/98 mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-[2rem] border-2 border-green-400/50 bg-gradient-to-b p-5 shadow-[0_-8px_40px_rgba(34,197,94,0.25)]">
            {/* Handle */}
            <div className="mb-1 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex w-full items-center gap-4">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="flex-shrink-0 text-4xl"
                style={{ filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.8))' }}
              >
                🦠
              </motion.span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400">
                  VIRUS DETECTADO
                </p>
                <p className="text-xl font-black leading-tight text-white">{data.player?.name}</p>
                <p className="text-[10px] text-white/40">ha sido infectado</p>
              </div>
            </div>

            <div className="flex w-full items-start gap-3 rounded-2xl border border-green-500/20 bg-black/40 px-4 py-3">
              <div className="flex-1 text-left">
                <p className="text-base font-black leading-tight text-green-300">
                  {data.virus?.virusName || data.virus?.name}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/60">
                  {data.virus?.virusDescription || data.virus?.description}
                </p>
              </div>
              <span className="flex-shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase text-green-400/70">
                {data.virus?.turnsRemaining}T
              </span>
            </div>

            <button
              onClick={onAcknowledge}
              className="w-full rounded-2xl bg-green-500 py-4 text-base font-black uppercase tracking-widest text-black shadow-lg transition-all hover:bg-green-400 active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              ENTENDIDO, APLICAR VIRUS ✓
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
