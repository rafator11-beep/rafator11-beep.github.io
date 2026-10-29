import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  // speed_race: ronda de trivia en carrera — todos responden, la ronda sigue
  // activa el tiempo completo y se reparten puntos por velocidad de acierto.
  mode?: 'standard' | 'fastest_finger' | 'speed_race';
  onRaceComplete?: (ranking: RaceRankEntry[]) => void;
  // En modo local (un solo dispositivo, isHost forzado a true para dar
  // autoridad sobre el cronómetro/revelado) el anfitrión también es el
  // único jugador posible, así que debe poder votar igualmente.
  allowHostVote?: boolean;
}

export interface RaceRankEntry {
  voter: string;
  correct: boolean;
  reactionTime: number;
  points: number;
}

interface VotePayload {
  voter: string;
  target: string;
  timestamp: number;
  reactionTime?: number;
}

const VOTE_DURATION = 20; // segundos
const RACE_DURATION = 15; // segundos — trivia en carrera
// Puntos decrecientes por orden de acierto (velocidad). Quien acierta más tarde
// que el último hueco de la escala sigue llevándose el mínimo (1 punto).
const RACE_POINTS_SCALE = [10, 8, 6, 5, 4, 3, 2, 1];

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
  onRaceComplete,
  mode = 'standard',
  allowHostVote = false,
}: KahootVoteSessionProps) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  // 'ready': pantalla de lectura antes de arrancar el reloj — el anfitrión
  // pulsa Play cuando el grupo ya ha leído la pregunta/opciones. fastest_finger
  // conserva su propio countdown corto de "¡Atentos!" (3-2-1), no necesita ready.
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'voting' | 'results'>(mode === 'fastest_finger' ? 'countdown' : 'ready');
  const [timeLeft, setTimeLeft] = useState(mode === 'fastest_finger' ? 3 : mode === 'speed_race' ? RACE_DURATION : VOTE_DURATION);
  const [totalVoters, setTotalVoters] = useState(0);
  const [fastestWinner, setFastestWinner] = useState<{ name: string, time: number } | null>(null);
  // speed_race: cada acierto registrado (voter + tiempo de reacción), para el ranking final
  const [raceEntries, setRaceEntries] = useState<{ voter: string; correct: boolean; reactionTime: number }[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Initialize votes map
  useEffect(() => {
    const initial: Record<string, number> = {};
    options.forEach(opt => { initial[opt] = 0; });
    setVotes(initial);
  }, [options]);

  // Supabase channel setup
  useEffect(() => {
    if (!roomId) return;

    let unmounted = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = () => {
      if (unmounted) return;

      channel = supabase.channel(`kahoot:${roomId}`)
        .on('broadcast', { event: 'vote_cast' }, (payload) => {
          const { target, voter, reactionTime } = payload.payload as VotePayload;

          if (mode === 'fastest_finger') {
            if (target === correctAnswer) {
              setFastestWinner({ name: voter, time: reactionTime || 0 });
              setPhase('results');
              if (timerRef.current) clearInterval(timerRef.current);
              if (isHost && onResult) onResult(voter, { [target]: 1 });
            }
          } else if (mode === 'speed_race') {
            // La ronda sigue abierta todo el tiempo: solo registramos el acierto/fallo
            // y el tiempo de reacción de cada jugador, sin cortar en el primero.
            setRaceEntries(prev => (
              prev.some(e => e.voter === voter) ? prev : [...prev, { voter, correct: target === correctAnswer, reactionTime: reactionTime || 0 }]
            ));
            setTotalVoters(prev => prev + 1);
          } else {
            setVotes(prev => ({
              ...prev,
              [target]: (prev[target] || 0) + 1,
            }));
            setTotalVoters(prev => prev + 1);
          }
        })
        .on('broadcast', { event: 'show_results' }, () => {
          setPhase('results');
          if (timerRef.current) clearInterval(timerRef.current);
        })
        .on('broadcast', { event: 'start_voting' }, () => {
          if (!isHost) {
            setPhase('voting');
            setTimeLeft(mode === 'speed_race' ? RACE_DURATION : VOTE_DURATION);
            startTimeRef.current = Date.now();
          }
        })
        .subscribe((status) => {
          if (unmounted) return;
          if (status === 'SUBSCRIBED') {
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Reconexión básica: móvil bloqueado o red perdida un instante
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            const attempt = retryCountRef.current + 1;
            retryCountRef.current = attempt;
            const delay = Math.min(1000 * attempt, 8000);
            retryTimeoutRef.current = setTimeout(() => {
              if (unmounted) return;
              if (channel) supabase.removeChannel(channel);
              setup();
            }, delay);
          }
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      unmounted = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (channel) supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId, mode, correctAnswer, isHost, onResult]);

  // Arranca la votación: el anfitrión pulsa Play en la pantalla 'ready' una vez
  // el grupo ha leído la pregunta, y se sincroniza a todos los móviles conectados.
  const startVoting = useCallback(() => {
    if (!isHost) return;
    setPhase('voting');
    setTimeLeft(mode === 'speed_race' ? RACE_DURATION : VOTE_DURATION);
    startTimeRef.current = Date.now();
    channelRef.current?.send({ type: 'broadcast', event: 'start_voting', payload: {} });
  }, [isHost, mode]);

  // Cronómetro: el countdown corto de fastest_finger ("¡Atentos! 3-2-1") sigue
  // siendo exclusivo del anfitrión (autoridad sobre cuándo arranca la ronda).
  // El reloj de 'voting' corre en TODOS los dispositivos de forma independiente
  // (cada uno sincronizado por el mismo start_voting), para que no se quede
  // clavado en los móviles de los espectadores — solo el anfitrión dispara el
  // revelado automático al llegar a 0, para no duplicar el broadcast.
  useEffect(() => {
    if (phase === 'countdown' && isHost) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setPhase('voting');
            setTimeLeft(mode === 'fastest_finger' ? 30 : VOTE_DURATION);
            startTimeRef.current = Date.now();
            channelRef.current?.send({ type: 'broadcast', event: 'start_voting', payload: {} });
            return mode === 'fastest_finger' ? 30 : VOTE_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'voting') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            if (isHost) revealResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHost, phase, mode]);

  const canVote = !isHost || allowHostVote;

  const castVote = useCallback(async (target: string) => {
    if (myVote || phase !== 'voting' || !channelRef.current || !canVote) return;
    setMyVote(target);

    // En fastest_finger y speed_race medimos el tiempo de reacción desde el inicio
    // sincronizado de la ronda, para poder ordenar/premiar por velocidad.
    const reactionTime = (mode === 'fastest_finger' || mode === 'speed_race') ? (Date.now() - startTimeRef.current) / 1000 : 0;
    const voterName = localStorage.getItem('beep_spectator_name') || 'Jugador Anónimo';

    await channelRef.current.send({
      type: 'broadcast',
      event: 'vote_cast',
      payload: { voter: voterName, target, timestamp: Date.now(), reactionTime } as VotePayload,
    });
  }, [myVote, phase, mode, canVote]);

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

  // speed_race: ranking final por velocidad de acierto. Solo quien acertó se lleva
  // puntos, de forma decreciente según el orden de su tiempo de reacción.
  const raceRanking: RaceRankEntry[] = useMemo(() => {
    return raceEntries
      .filter(e => e.correct)
      .sort((a, b) => a.reactionTime - b.reactionTime)
      .map((e, i) => ({ ...e, points: RACE_POINTS_SCALE[i] ?? 1 }));
  }, [raceEntries]);

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
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === 'fastest_finger' || mode === 'speed_race' ? 'bg-red-500/20' : 'bg-yellow-400/15'}`}>
            <Zap className={`h-5 w-5 ${mode === 'fastest_finger' || mode === 'speed_race' ? 'text-red-400' : 'text-yellow-300'}`} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {mode === 'fastest_finger' ? 'El Más Rápido' : mode === 'speed_race' ? 'Trivia en Carrera' : 'Modo Kahoot'}
            </p>
            <p className="text-sm font-bold text-white">{mode === 'fastest_finger' ? 'Bomba Cultural' : mode === 'speed_race' ? 'Puntos por velocidad' : '¿Quién es más probable?'}</p>
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

      <AnimatePresence mode="wait">
        {phase === 'ready' ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center flex-1 w-full gap-6"
          >
            <div className="w-full max-w-2xl rounded-[24px] border border-yellow-400/20 bg-yellow-400/8 p-5">
              <p className="text-center text-base font-semibold leading-relaxed text-white sm:text-lg">
                {question}
              </p>
            </div>
            <div className="w-full max-w-2xl grid grid-cols-2 gap-3 sm:grid-cols-2 opacity-60 pointer-events-none">
              {options.map((option, idx) => {
                const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                return (
                  <div key={option} className={`rounded-[20px] border-2 p-4 ${color.bg} ${color.border} ${color.text}`}>
                    <p className="text-center text-sm font-bold leading-tight break-words max-w-full">{option}</p>
                  </div>
                );
              })}
            </div>
            {isHost ? (
              <button
                onClick={startVoting}
                className="rounded-2xl bg-emerald-400 px-10 py-4 text-lg font-black text-black hover:bg-emerald-300 transition shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                ▶ Empezar ({mode === 'speed_race' ? RACE_DURATION : VOTE_DURATION}s)
              </button>
            ) : (
              <p className="text-sm text-muted-foreground animate-pulse">Esperando a que el anfitrión empiece...</p>
            )}
          </motion.div>
        ) : phase === 'countdown' ? (
          <motion.div
            key="countdown"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 w-full"
          >
            <p className="text-2xl font-bold text-red-400 mb-4 tracking-widest uppercase">¡ATENTOS!</p>
            <p className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              {timeLeft}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center"
          >
            {/* Question */}
            <div className={`mb-6 w-full max-w-2xl rounded-[24px] border ${mode === 'fastest_finger' ? 'border-red-500/30 bg-red-500/10' : 'border-yellow-400/20 bg-yellow-400/8'} p-5`}>
              <p className="text-center text-base font-semibold leading-relaxed text-white sm:text-lg">
                {question}
              </p>
            </div>

            {/* Vote stats */}
            {mode !== 'fastest_finger' && (
              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{totalVoters} voto{totalVoters !== 1 ? 's' : ''}</span>
                </div>
                {phase === 'voting' && !myVote && canVote && (
                  <span className="text-yellow-300 font-semibold animate-pulse">¡Vota ahora!</span>
                )}
                {myVote && phase === 'voting' && (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Votado: {myVote}
                  </span>
                )}
              </div>
            )}

            {mode === 'fastest_finger' && phase === 'results' && fastestWinner && (
              <div className="mb-6 w-full max-w-2xl rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <p className="text-xl font-bold text-white uppercase">{fastestWinner.name}</p>
                </div>
                <p className="text-emerald-300 text-sm">¡Correcto en {fastestWinner.time.toFixed(2)} segundos!</p>
              </div>
            )}
            
            {mode === 'fastest_finger' && phase === 'results' && !fastestWinner && (
              <div className="mb-6 w-full max-w-2xl rounded-2xl bg-red-500/20 border border-red-500/40 p-4 text-center">
                <p className="text-lg font-bold text-white uppercase">¡Nadie acertó a tiempo!</p>
              </div>
            )}

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
              whileHover={phase === 'voting' && !myVote && canVote ? { scale: 1.02 } : {}}
              whileTap={phase === 'voting' && !myVote && canVote ? { scale: 0.97 } : {}}
              onClick={() => phase === 'voting' && canVote && castVote(option)}
              disabled={phase === 'voting' && (!!myVote || !canVote)}
              className={`relative overflow-hidden rounded-[20px] border-2 p-4 transition-all
                ${color.bg} ${color.border} ${color.text}
                ${phase === 'voting' && !myVote && canVote ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
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
      {isHost && phase === 'voting' && mode !== 'fastest_finger' && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={revealResults}
            className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition"
          >
            Revelar resultados
          </button>
        </div>
      )}

      {/* Results panel — speed_race ranking */}
      <AnimatePresence>
        {phase === 'results' && mode === 'speed_race' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-2xl rounded-[24px] border border-emerald-400/30 bg-emerald-400/10 p-5"
          >
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-emerald-300/80 mb-3">
              🏁 Ranking por velocidad
            </p>
            {raceRanking.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">Nadie acertó a tiempo 😅</p>
            ) : (
              <div className="flex flex-col gap-2">
                {raceRanking.map((entry, i) => (
                  <div
                    key={entry.voter}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${i === 0 ? 'bg-yellow-400/20 border border-yellow-400/40' : 'bg-white/5 border border-white/10'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white/60 w-5 text-center">{i + 1}.</span>
                      {i === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                      <span className="text-sm font-bold text-white">{entry.voter}</span>
                      <span className="text-[10px] text-muted-foreground">({entry.reactionTime.toFixed(2)}s)</span>
                    </div>
                    <span className="text-sm font-black text-emerald-300">+{entry.points} pts</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { onRaceComplete?.(raceRanking); onClose(); }}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-6 py-2.5 text-sm font-bold text-black hover:bg-emerald-300 transition"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results panel */}
      <AnimatePresence>
        {phase === 'results' && mode !== 'fastest_finger' && mode !== 'speed_race' && (correctAnswer || winner) && (
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

      {/* Button to continue for fastest finger host */}
      {isHost && phase === 'results' && mode === 'fastest_finger' && (
        <div className="mt-6">
          <button
              onClick={() => { onResult?.(fastestWinner?.name || '', { [correctAnswer || '']: 1 }); onClose(); }}
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-bold text-black hover:bg-emerald-300 transition"
            >
              Continuar
            </button>
        </div>
      )}
      </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
