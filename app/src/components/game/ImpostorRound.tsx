import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX, Vote, Clock, ThumbsUp, ThumbsDown, ArrowLeft, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';

interface ImpostorRoundProps {
  players: Player[];
  impostorPlayerId: string;
  realQuestion: string;
  impostorQuestion: string;
  onComplete: (impostorCaught: boolean, votedPlayerId?: string) => void;
  onExit: () => void;
}

export function ImpostorRound({ 
  players, 
  impostorPlayerId, 
  realQuestion, 
  impostorQuestion, 
  onComplete, 
  onExit 
}: ImpostorRoundProps) {
  const [phase, setPhase] = useState<'reveal' | 'discussion' | 'voting' | 'result'>('reveal');
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [discussionTime, setDiscussionTime] = useState(30);
  const [mostVotedId, setMostVotedId] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState<string | null>(null);

  const discussionTimeRef = useRef(discussionTime);
  discussionTimeRef.current = discussionTime;

  // Discussion timer
  useEffect(() => {
    if (phase !== 'discussion') return;
    
    const timer = setInterval(() => {
      setDiscussionTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('voting');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleReveal = (playerId: string) => {
    setRevealedPlayers(prev => new Set([...prev, playerId]));
    // Removed automatic timeout to 'discussion' here. Now requires explicit 'Comenzar' user click.
  };

  const handleVote = (voterId: string, suspectId: string) => {
    const newVotes = { ...votes, [voterId]: suspectId };
    setVotes(newVotes);
    
    // Check if all votes are in
    if (Object.keys(newVotes).length >= players.length) {
      setTimeout(() => calculateResult(newVotes), 500);
    }
  };

  const calculateResult = (finalVotes: Record<string, string>) => {
    // Count votes
    const voteCounts: Record<string, number> = {};
    Object.values(finalVotes).forEach(suspectId => {
      voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
    });
    
    // Find most voted (Bug 11: Handle ties)
    let maxVotes = 0;
    let candidates: string[] = [];
    
    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [id];
      } else if (count === maxVotes) {
        candidates.push(id);
      }
    });
    
    // If there's a tie or no votes, no one is the "most voted" result
    const voted = candidates.length === 1 ? candidates[0] : '';
    setMostVotedId(voted);
    setPhase('result');
    
    // Delay before completing
    setTimeout(() => {
      onComplete(voted === impostorPlayerId, voted);
    }, 4000);
  };

  const getPlayerQuestion = (playerId: string) => {
    return playerId === impostorPlayerId ? impostorQuestion : realQuestion;
  };

  const getImpostor = () => players.find(p => p.id === impostorPlayerId);
  
  const wasImpostorCaught = () => mostVotedId === impostorPlayerId;

  const allRevealed = revealedPlayers.size >= players.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-sm mx-auto h-[75vh] min-h-[500px] flex flex-col relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-b from-indigo-700 to-purple-950"
    >
      <div className="absolute inset-0 bg-[url('/modern_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="relative z-10 flex flex-col h-full p-4 md:p-6 pb-6 overflow-y-auto slim-scroll select-none">
        
        {/* Navigation & Header / Falso Logo */}
        <div className="flex justify-between items-start w-full absolute top-2 left-2 z-20">
          <Button variant="ghost" size="icon" onClick={onExit} className="hover:bg-white/10">
            <ArrowLeft className="w-6 h-6 text-white/80" />
          </Button>
        </div>

        <div className="flex flex-col items-center transform transition-all duration-300 mt-2 shrink-0 mb-4">
            <span className="text-7xl mb-[-5px] drop-shadow-2xl z-10">🕵️</span>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-center leading-[0.85] w-full flex items-center justify-center mt-2">
                RETO ESPECIAL
            </h1>
        </div>

        {/* Reveal Phase */}
        {phase === 'reveal' && (
          <div className="flex-[1_0_auto] flex flex-col pb-4 h-full"> 
            <div className="text-center space-y-1 mb-4 shrink-0">
              <p className="text-white/60 mb-6 text-sm italic font-medium">Toca tu nombre para revelar/ocultar tu rol confidencial.</p>
              <p className="text-red-400 font-black uppercase tracking-widest text-[11px] animate-pulse drop-shadow-md">¡No muestres tu pantalla!</p>
            </div>
            
            <div className="grid gap-3 overflow-y-auto slim-scroll pb-2 shrink-0">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  {revealedPlayers.has(player.id) && isRevealing !== player.id ? (
                    <div className="p-4 bg-green-500/20 rounded-xl border-none text-center flex items-center justify-center gap-2 shadow-inner">
                      <ThumbsUp className="w-5 h-5 text-green-400" />
                      <span className="text-white font-extrabold text-sm uppercase tracking-wide">{player.name} listo</span>
                    </div>
                  ) : (
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRevealing(isRevealing === player.id ? null : player.id);
                        if (isRevealing !== player.id) {
                          handleReveal(player.id);
                        }
                      }}
                      onContextMenu={(e) => { e.preventDefault(); return false; }}
                      className={`w-full p-4 rounded-xl border-none transition-all flex flex-col items-center justify-center relative overflow-hidden select-none touch-none ${isRevealing === player.id ? 'bg-white scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,1)] text-slate-900' : 'bg-black/30 backdrop-blur-sm text-white shadow-md'}`}
                    >
                      <AnimatePresence mode="wait">
                        {isRevealing === player.id ? (
                          <motion.div
                            key="secret"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-2"
                          >
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Palabra / Acción:</p>
                            <div className="relative group/secret">
                              <p className={`text-2xl font-black transition-all duration-300 ${!isRevealing ? 'blur-[20px] select-none opacity-0' : 'text-slate-900'}`}>
                                {getPlayerQuestion(player.id)}
                              </p>
                              {/* Central reveal button (if needed, but already inside the motion button) */}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              <EyeOff className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-extrabold uppercase tracking-wide">{player.name}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Siguiente Auto-Anchored logic */}
            {allRevealed && (
              <div className="mt-auto pt-4 w-full flex flex-col items-center shrink-0">
                  <button 
                      className="w-full max-w-[280px] bg-white text-purple-900 font-extrabold text-xl py-4 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-center tracking-widest uppercase"
                      onClick={() => setPhase('discussion')}
                  >
                      Comenzar
                  </button>
              </div>
            )}
          </div>
        )}

        {/* Discussion Phase */}
        {phase === 'discussion' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div className="p-6 bg-black/40 rounded-[2rem] border-none backdrop-blur-md shadow-2xl text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-2xl font-black mb-2 text-white">¡DISCUSIÓN!</h2>
              <p className="text-white/80 mb-4 text-sm font-semibold">
                Cada uno debe decir su respuesta o hacer su acción de forma abstracta para que los demás sepan quién es de los vuestros. ¡Cuidado, hay un infiltrado que no sabe de qué va el tema e imitará y dirá cosas acordes a lo que decís!
              </p>
              
              <div className={`text-5xl font-mono font-black mb-4 drop-shadow-lg ${discussionTime <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                {discussionTime}s
              </div>
              
              <p className="text-xs text-white/50 italic font-bold">
                💡 Pista: Intentad aseguraros y haceros las preguntas que queráis para pillar al farsante.
              </p>
            </div>

            <div className="mt-auto pt-6 w-full flex flex-col items-center shrink-0 mb-4">
              <button 
                onClick={() => setPhase('voting')} 
                className="w-full max-w-[280px] bg-white text-purple-900 font-extrabold text-lg py-4 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-center tracking-widest uppercase"
              >
                Fin. Votar
              </button>
            </div>
          </motion.div>
        )}

        {/* Voting Phase */}
        {phase === 'voting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col h-full"
          >
            <h2 className="text-xl font-bold text-center mb-4 text-white drop-shadow-sm flex justify-center items-center">
              <Vote className="w-6 h-6 inline mr-2" />
              ¿Quién es el infiltrado?
            </h2>
            
            <div className="flex-1 overflow-y-auto slim-scroll space-y-4 pb-2">
              {players.map((voter) => (
                <div key={voter.id} className="space-y-2">
                  <p className="text-sm font-bold text-white uppercase tracking-widest ml-1">{voter.name} vota a:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {players.filter(p => p.id !== voter.id).map((suspect) => (
                      <Button
                        key={suspect.id}
                        variant={votes[voter.id] === suspect.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVote(voter.id, suspect.id)}
                        disabled={!!votes[voter.id]}
                        className={`rounded-xl py-6 font-bold text-sm shadow-md transition-all ${votes[voter.id] === suspect.id ? 'bg-purple-600 text-white border-transparent' : 'bg-white text-slate-800 hover:bg-slate-100 border-none'}`}
                      >
                        {suspect.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(votes).length >= players.length && (
              <div className="mt-auto pt-4 w-full flex flex-col items-center shrink-0 mb-2">
                <button 
                  onClick={() => calculateResult(votes)} 
                  className="w-full max-w-[280px] bg-yellow-400 text-yellow-900 font-extrabold text-xl py-4 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-center tracking-widest uppercase"
                >
                  Ver resultado
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Result Phase */}
        {phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center pb-8"
          >
            <div className={`p-8 w-full rounded-[2rem] text-white ${wasImpostorCaught() ? 'bg-green-600/90 shadow-[0_0_40px_rgba(34,197,94,0.4)]' : 'bg-red-600/90 shadow-[0_0_40px_rgba(239,68,68,0.4)]'} border-none backdrop-blur-xl mb-6`}>
              <div className="text-7xl mb-4 drop-shadow-md">
                {wasImpostorCaught() ? '🎉' : '😈'}
              </div>
              
              <h2 className="text-2xl font-black italic mb-2 tracking-tight">
                {wasImpostorCaught() ? '¡IMPOSTOR ATRAPADO!' : '¡SE ESCAPÓ!'}
              </h2>
              
              <p className="text-lg mb-6 font-semibold">
                El inflitrado era: <strong>{getImpostor()?.name}</strong>
              </p>
              
              <div className="text-sm text-white/90 space-y-2 bg-black/20 p-4 rounded-xl flex flex-col items-start text-left mx-auto">
                <p><strong>Grupo:</strong> {realQuestion}</p>
                <p><strong>Falso:</strong> {impostorQuestion}</p>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              {wasImpostorCaught() ? (
                <div className="flex items-center gap-2 text-green-300 font-black text-xl">
                  <ThumbsUp className="w-6 h-6" />
                  <span>GRUPO: +20 PTOS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <ThumbsDown className="w-5 h-5" />
                  <span className="text-white">{getImpostor()?.name} gana +50 puntos</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
