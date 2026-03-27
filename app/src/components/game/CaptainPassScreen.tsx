import { motion } from 'framer-motion';
import { Crown, ArrowRight, Smartphone } from 'lucide-react';

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
      <div className="fixed inset-0 bg-[#050505] z-[150] flex flex-col items-center justify-between p-8 select-none overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)] opacity-50" />
        </div>

        {/* Hint superior */}
        <p className="text-[10px] text-yellow-500/40 font-arcade uppercase tracking-[0.45em] pt-8 text-center relative z-10">
          CONTROL DEL CAPITÁN
        </p>

        {/* Centro */}
        <div className="flex flex-col items-center gap-8 text-center relative z-10 w-full">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="p-6 bg-yellow-500/10 rounded-[2.5rem] border-2 border-yellow-500/20 shadow-[0_0_40px_rgba(251,191,36,0.1)]"
          >
            <motion.div
              animate={{ y: [0, -10, 0], filter: ['drop-shadow(0 0 10px rgba(251,191,36,0.4))', 'drop-shadow(0 0 20px rgba(251,191,36,0.8))', 'drop-shadow(0 0 10px rgba(251,191,36,0.4))'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Crown className="w-24 h-24 text-yellow-500 fill-yellow-500" />
            </motion.div>
          </motion.div>

          <div className="space-y-4 w-full">
            <h2 className="text-white font-arcade font-black text-4xl uppercase tracking-tighter leading-none">
              ¡ES TU TURNO,<br />
              <span className="text-yellow-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{captainName.toUpperCase()}</span>!
            </h2>
            
            {challengePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/80 border border-white/5 backdrop-blur-md rounded-2xl p-5 max-w-sm mx-auto text-white/50 text-sm font-medium leading-relaxed shadow-xl"
              >
                <p className="text-[9px] font-arcade text-zinc-500 uppercase tracking-widest mb-2">Próximo Desafío:</p>
                {challengePreview}
              </motion.div>
            )}
          </div>
        </div>

        {/* Botón arcade */}
        <div className="w-full max-w-xs mb-10 relative z-10">
          <motion.button
            whileTap={{ y: 4, boxShadow: 'none' }}
            onClick={onComplete}
            className="w-full font-arcade font-black text-black uppercase tracking-[0.2em] text-xl py-6 bg-white rounded-none active:scale-[0.98] transition-all"
            style={pixelBtn('#fbbf24')}
          >
            ► ¡A JUGAR!
          </motion.button>
          <p className="text-center text-white/20 text-[9px] mt-4 font-arcade uppercase tracking-[0.35em]">
            [ TOCA PARA CONTINUAR ]
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de pase de móvil
  return (
    <div className="fixed inset-0 bg-[#050505] z-[150] flex flex-col items-center justify-between p-8 select-none overflow-hidden">
      {/* Searchlines / Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      {/* Aviso superior */}
      <div className="pt-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full mb-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <p className="text-[10px] text-red-500 font-arcade font-black uppercase tracking-[0.3em]">
            ACCESO RESTRINGIDO
          </p>
        </div>
        <p className="text-[9px] text-white/30 uppercase tracking-[0.45em] font-arcade">
          EL CAPITÁN NO DEBE VER ESTO
        </p>
      </div>

      {/* Centro */}
      <div className="flex flex-col items-center gap-10 text-center relative z-10 w-full">
        {/* Device Pass Animation */}
        <div className="relative flex items-center justify-center h-32 w-full">
          <motion.div
            animate={{ x: [-40, 40, -40], rotate: [-10, 10, -10] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-white/20"
          >
            <Smartphone className="w-24 h-24 stroke-[1px]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ x: [-20, 20, -20], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute text-white"
          >
            <ArrowRight className="w-16 h-16" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-[11px] text-white/40 uppercase tracking-[0.4em] font-arcade font-black">
            PASA EL DISPOSITIVO A
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
            <motion.p
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl md:text-7xl font-arcade font-black text-white uppercase leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] relative z-10"
            >
              {targetPlayerName.toUpperCase()}
            </motion.p>
          </motion.div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4" />
          <p className="text-[10px] text-white/20 font-arcade uppercase tracking-widest">
            Mantén el secreto a salvo del grupo
          </p>
        </div>
      </div>

      {/* Botón arcade */}
      <div className="w-full max-w-sm mb-10 relative z-10">
        <motion.button
          whileTap={{ y: 4, boxShadow: 'none' }}
          onClick={onComplete}
          className="w-full font-arcade font-black text-black uppercase tracking-[0.2em] text-base py-6 bg-white rounded-none active:scale-[0.98] transition-all"
          style={pixelBtn('#ffffff')}
        >
          ► LO TENGO, VER CONTENIDO
        </motion.button>
        <p className="text-center text-white/10 text-[9px] mt-4 font-arcade uppercase tracking-[0.4em]">
           [ SÓLO PULSA SI ERES EL DESTINATARIO ]
        </p>
      </div>
    </div>
  );
}
