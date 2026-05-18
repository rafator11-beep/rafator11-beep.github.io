import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Crown, Users, Check, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KahootVoteSessionProps {
  roomId: string;
  question: string;
  options: string[];            // opciones a votar (pueden ser jugadores o respuestas)
  correctAnswer?: string;       // respuesta correcta (opcional, para trivia)
  isHost: boolean;
  onClose: () => void;
  onResult?: (winner: string, votes: Record<string, number>) => void;
}

interface VotePayload {
  voter: string;
  target: string;
  timestamp: number;
}

const VOTE_DURATION = 20; // segundos

// Paleta de colores para los botones de voto (tipo Kahoot)
const PLAYER_COLORS = [
  { bg: 'bg-[#e53935]', border: 'border-[#ef5350]', text: 'text-white' },
  { bg: 'bg-[#1e88e5]', border: 'border-[#42a5f5]', text: 'text-white' },
  { bg: 'bg-[#43a047]', border: 'border-[#66bb6a]', text: 'text-white' },
  { bg: 'bg-[#fb8c00]', border: 'border-[#ffa726]', text: 'text-white' },
  { bg: 'bg-[#8e24aa]', border: 'border-[#ab47bc]', text: 'text-white' },
  { bg: 'bg-[#00acc1]', border: 'border-[#26c6da]', text: 'text-white' },
  { bg: 'bg-[#f4511e]', border: 'border-[#ff7043]', text: 'text-white' },
  { bg: 'bg-[#6d4c41]', border: 'border-[#8d6e63]', text: 'text-white' },
];

export function KahootVoteSession({
  roomId,
  question,
  options,
  correctAnswer,
  isHost,
  onClose,
  onResult,
}: KahootVoteSessionProps) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [phase, setPhase] = useState<'voting' | 'results'>('voting');
  const [timeLeft, setTimeLeft] = useState(VOTE_DURATION);
  const [totalVoters, setTotalVoters] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize votes map
  useEffect(() => {
    const initial: Record<string, number> = {};
    options.forEach(opt => { initial[opt] = 0; });
    setVotes(initial);
  }, [options]);

  // Supabase channel setup
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`kahoot:${roomId}`)
      .on('broadcast', { event: 'vote_cast' }, (payload) => {
        const { target } = payload.payload as VotePayload;
        setVotes(prev => ({
          ...prev,
          [target]: (prev[target] || 0) + 1,
        }));
        setTotalVoters(prev => prev + 1);
      })
      .on('broadcast', { event: 'show_results' }, () => {
        setPhase('results');
        if (timerRef.current) clearInterval(timerRef.current);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  // Countdown timer (host only)
  useEffect(() => {
    if (!isHost || phase !== 'voting') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          revealResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHost, phase]);

  const castVote = useCallback(async (target: string) => {
    if (myVote || !channelRef.current) return;
    setMyVote(target);

    await channelRef.current.send({
      type: 'broadcast',
      event: 'vote_cast',
      payload: { voter: 'player', target, timestamp: Date.now() } as VotePayload,
    });
  }, [myVote]);

  const revealResults = useCallback(async () => {
    setPhase('results');
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: 'broadcast',
      event: 'show_results',
      payload: {},
    });
  }, []);

  // Determine winner
  const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[990] flex flex-col items-center justify-start bg-[#0a0a14]/95 p-4 pt-6 backdrop-blur-md overflow-y-auto"
    >
      {/* Header */}
      <div className="mb-4 flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/15">
            <Zap className="h-5 w-5 text-yellow-300" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Modo Kahoot
            </p>
            <p className="text-sm font-bold text-white">¿Quién es más probable?</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phase === 'voting' && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
              timeLeft <= 5 ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-white/10 text-white'
            }`}>
              <Timer className="h-3.5 w-3.5" />
              {timeLeft}s
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6 w-full max-w-2xl rounded-[24px] border border-yellow-400/20 bg-yellow-400/8 p-5">
        <p className="text-center text-base font-semibold leading-relaxed text-white sm:text-lg">
          {question}
        </p>
      </div>

      {/* Vote stats */}
      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>{totalVoters} voto{totalVoters !== 1 ? 's' : ''}</span>
        </div>
        {phase === 'voting' && !myVote && !isHost && (
          <span className="text-yellow-300 font-semibold animate-pulse">¡Vota ahora!</span>
        )}
        {myVote && phase === 'voting' && (
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Votado: {myVote}
          </span>
        )}
      </div>

      {/* Options buttons / Results */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-3 sm:grid-cols-2">
        {options.map((option, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const optionVotes = votes[option] || 0;
          const percentage = totalVoters > 0 ? Math.round((optionVotes / totalVoters) * 100) : 0;
          const isWinner = phase === 'results' && (correctAnswer ? option === correctAnswer : option === winner);

          return (
            <motion.button
              key={option}
              layout
              whileHover={phase === 'voting' && !myVote && !isHost ? { scale: 1.02 } : {}}
              whileTap={phase === 'voting' && !myVote && !isHost ? { scale: 0.97 } : {}}
              onClick={() => phase === 'voting' && !isHost && castVote(option)}
              disabled={phase === 'voting' && (!!myVote || isHost)}
              className={`relative overflow-hidden rounded-[20px] border-2 p-4 transition-all
                ${color.bg} ${color.border} ${color.text}
                ${phase === 'voting' && !myVote && !isHost ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                ${myVote === option ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a14]' : ''}
                ${isWinner ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#0a0a14] scale-105' : ''}
                ${phase === 'results' && correctAnswer && option !== correctAnswer ? 'opacity-40' : ''}
              `}
            >
              {/* Background bar (results) */}
              {phase === 'results' && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 rounded-[18px] ${correctAnswer && option === correctAnswer ? 'bg-emerald-400/40' : 'bg-white/20'}`}
                />
              )}

              <div className="relative flex flex-col items-center gap-2">
                <span className="text-2xl">
                  {isWinner ? (correctAnswer ? '✅' : '👑') : phase === 'results' ? (correctAnswer ? '❌' : '🎯') : '🎮'}
                </span>
                <p className="text-center text-sm font-bold leading-tight break-words max-w-full">
                  {option}
                </p>

                {/* Vote count (always show in results, show live count in voting) */}
                {(phase === 'results' || (phase === 'voting' && isHost)) && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black">{optionVotes}</span>
                    {phase === 'results' && (
                      <span className="text-xs opacity-80">({percentage}%)</span>
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Host controls */}
      {isHost && phase === 'voting' && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={revealResults}
            className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition"
          >
            Revelar resultados
          </button>
        </div>
      )}

      {/* Results panel */}
      <AnimatePresence>
        {phase === 'results' && (correctAnswer || winner) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-2xl rounded-[24px] border border-yellow-400/30 bg-yellow-400/10 p-5 text-center"
          >
            <p className="text-2xl mb-1">{correctAnswer ? '✅' : '👑'}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-300/70">
              {correctAnswer ? 'Respuesta Correcta' : 'Más votado'}
            </p>
            <p className="mt-1 text-2xl font-black text-white">{correctAnswer || winner}</p>
            
            {correctAnswer && winner && winner !== correctAnswer && (
              <p className="mt-2 text-sm text-muted-foreground">
                La mayoría se equivocó votando: {winner} ({votes[winner]} votos)
              </p>
            )}
            {!correctAnswer && winner && (
              <p className="mt-2 text-sm text-muted-foreground">
                {votes[winner]} voto{votes[winner] !== 1 ? 's' : ''} — ¡{winner}, eso es lo que opina el grupo! 🍻
              </p>
            )}

            <button
              onClick={() => { onResult?.(correctAnswer || winner || '', votes); onClose(); }}
              className="mt-4 rounded-2xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectator waiting message */}
      {!isHost && phase === 'voting' && myVote && (
        <p className="mt-6 text-sm text-muted-foreground">
          Esperando a que el anfitrión revele los resultados...
        </p>
      )}
    </motion.div>
  );
}
