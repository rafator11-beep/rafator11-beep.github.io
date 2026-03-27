import { motion } from 'framer-motion';

interface CaptainPassScreenProps {
  captainName?: string;
  targetPlayerName?: string;
  onComplete: () => void;
  isCaptainTurn?: boolean;
  challengePreview?: string;
}

export function CaptainPassScreen({
  captainName = 'Capitán',
  targetPlayerName = 'Siguiente Jugador',
  onComplete,
  isCaptainTurn = false,
  challengePreview
}: CaptainPassScreenProps) {

  const pixelBtn = (color: string = '#ffffff') => ({
    boxShadow: `
      4px 0 0 0 ${color},
      -4px 0 0 0 ${color},
      0 4px 0 0 ${color},
      0 -4px 0 0 ${color},
      0 8px 0 0 rgba(0,0,0,0.6)
    `
  });

  if (isCaptainTurn) {
    return (
      <div className="fixed inset-0 bg-black z-[150] flex flex-col items-center justify-between p-8 select-none">
        {/* Hint superior */}
        <p className="text-[9px] text-white/30 uppercase tracking-[0.45em] pt-4 text-center">
          TURNO DEL CAPITÁN
        </p>

        {/* Centro */}
        <div className="flex flex-col items-center gap-5 text-center">
          <motion.div
            animate={{ scale: [1, 1.18, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="text-8xl"
          >👑</motion.div>
          <p className="text-white font-black text-3xl uppercase tracking-tight leading-tight">
            ¡TU TURNO,<br />{captainName.toUpperCase()}!
          </p>
          {challengePreview && (
            <div className="bg-white/10 rounded-2xl p-4 max-w-xs text-white/70 text-sm font-medium leading-relaxed">
              {challengePreview}
            </div>
          )}
        </div>

        {/* Botón arcade */}
        <motion.button
          whileTap={{ y: 4, boxShadow: 'none' }}
          onClick={onComplete}
          className="w-full max-w-xs font-mono font-black text-black uppercase tracking-widest text-lg py-5 bg-white rounded-none"
          style={pixelBtn('#fbbf24')}
        >
          ► ¡A JUGAR!
        </motion.button>
      </div>
    );
  }

  // Pantalla de pase de móvil
  return (
    <div className="fixed inset-0 bg-black z-[150] flex flex-col items-center justify-between p-8 select-none">
      {/* Aviso superior */}
      <p className="text-[9px] text-white/30 uppercase tracking-[0.45em] pt-4 text-center">
        EL CAPITÁN NO DEBE VER ESTO
      </p>

      {/* Centro */}
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Flecha animada */}
        <motion.div
          animate={{ x: [0, 16, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl text-amber-400"
          style={{ filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.7))' }}
        >→</motion.div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-white/50 uppercase tracking-[0.3em] font-bold">
            PASA EL MÓVIL A
          </p>
          <motion.p
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="text-5xl md:text-6xl font-black text-white uppercase leading-tight"
          >
            {targetPlayerName}
          </motion.p>
          <p className="text-xs text-white/30 mt-1 font-medium">
            sin que nadie vea la pantalla
          </p>
        </div>
      </div>

      {/* Botón arcade */}
      <motion.button
        whileTap={{ y: 4, boxShadow: 'none' }}
        onClick={onComplete}
        className="w-full max-w-xs font-mono font-black text-black uppercase tracking-widest text-sm py-5 bg-white rounded-none"
        style={pixelBtn('#ffffff')}
      >
        ✅ YA LO TENGO — VER CONTENIDO
      </motion.button>
    </div>
  );
}
