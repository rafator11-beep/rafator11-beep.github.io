import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeCardText } from '@/components/game/CardDisplay';

interface VotingOverlayProps {
  currentText: string | null | undefined;
  players: any[];
  scores: Record<string, number>;
  votingSelections: string[];
  onSelectionsChange: (ids: string[]) => void;
  canLaunchKahoot: boolean;
  onLaunchKahoot: () => void;
  /** Votos definitivos: el padre reparte XP y pasa de carta. */
  onConfirm: (ids: string[]) => void;
  onSkip: () => void;
}

// Overlay inmersivo para cartas de votación ("¿Quién...?", "¿Qué dos jugadores...?")
export function VotingOverlay({
  currentText,
  players,
  scores,
  votingSelections,
  onSelectionsChange,
  canLaunchKahoot,
  onLaunchKahoot,
  onConfirm,
  onSkip,
}: VotingOverlayProps) {
  const isVoting =
    !!currentText &&
    ((currentText.toLowerCase().includes('¿quién') &&
      !currentText.toLowerCase().includes('yo nunca')) ||
      currentText.toLowerCase().includes('¿qué dos jugadores') ||
      currentText.toLowerCase().includes('¿qué tres jugadores') ||
      currentText.toLowerCase().includes('votación:') ||
      currentText.toLowerCase().includes('todos a la vez') ||
      currentText.toLowerCase().includes('señalad al'));
  let maxVotes = 1;
  if (currentText?.toLowerCase().includes('dos jugadores')) maxVotes = 2;
  if (currentText?.toLowerCase().includes('tres jugadores')) maxVotes = 3;

  return (
    <AnimatePresence>
      {isVoting && (
        <motion.div
          key="voting-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex flex-col"
          style={{
            background:
              'linear-gradient(180deg, rgba(88,28,135,0.97) 0%, rgba(15,10,30,0.99) 100%)',
          }}
        >
          {/* Orbes de fondo */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full blur-[100px]"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-0 right-0 h-64 w-64 rounded-full blur-[80px]"
              style={{
                background: 'radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Header */}
          <div className="pt-safe relative z-10 flex flex-col items-center px-5 pb-4 pt-6 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-4xl">🗳️</span>
              <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
                {maxVotes > 1 ? `Elige a ${maxVotes}` : '¿Quién es?'}
              </h2>
              <p className="mx-auto mt-1 max-w-xs px-4 text-sm leading-snug text-white/70">
                {sanitizeCardText(currentText || '')}
              </p>
            </motion.div>
            {canLaunchKahoot && (
              <button
                onClick={onLaunchKahoot}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg transition-all hover:bg-yellow-300"
              >
                ⚡ Lanzar modo Kahoot
              </button>
            )}
          </div>

          {/* Player grid */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
            <div className={`grid gap-3 ${players.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {players.map((p, i) => {
                const isSelected = votingSelections.includes(p.id);
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                      if (maxVotes === 1) {
                        onConfirm([p.id]);
                      } else {
                        if (votingSelections.includes(p.id)) {
                          onSelectionsChange(votingSelections.filter((id) => id !== p.id));
                        } else if (votingSelections.length < maxVotes) {
                          onSelectionsChange([...votingSelections, p.id]);
                        }
                      }
                    }}
                    className="relative flex flex-col items-center gap-2 rounded-[1.5rem] p-4 transition-all"
                    style={{
                      background: isSelected ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${isSelected ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.10)'}`,
                      boxShadow: isSelected ? '0 0 24px rgba(139,92,246,0.4)' : 'none',
                    }}
                  >
                    {/* Avatar */}
                    <motion.div
                      animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                      className="relative"
                    >
                      <div
                        className="h-16 w-16 overflow-hidden rounded-full border-2"
                        style={{ borderColor: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.2)' }}
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="h-full w-full object-cover" />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-xl font-black text-white"
                            style={{
                              background: isSelected
                                ? 'rgba(139,92,246,0.5)'
                                : 'rgba(255,255,255,0.1)',
                            }}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500"
                        >
                          <span className="text-xs font-black text-white">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                    <span className="w-full truncate text-center text-xs font-black uppercase tracking-wider text-white">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-bold text-white/40">
                      {scores[p.id] || 0} XP
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="pb-safe border-white/8 relative z-10 space-y-2 border-t px-4 pb-6 pt-3">
            {maxVotes > 1 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={votingSelections.length < maxVotes}
                onClick={() => onConfirm(votingSelections)}
                className="w-full rounded-2xl py-4 text-base font-black uppercase tracking-widest text-white transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                  touchAction: 'manipulation',
                }}
              >
                Confirmar ({votingSelections.length}/{maxVotes})
              </motion.button>
            )}
            <button
              onClick={onSkip}
              className="w-full rounded-2xl border border-white/10 py-2.5 text-xs font-bold uppercase tracking-widest text-white/40"
              style={{ touchAction: 'manipulation' }}
            >
              Saltar ⏭
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
