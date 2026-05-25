import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Calendar, Users, Layers, List, Play, X, Star } from 'lucide-react';
import { Player } from '@/types/game';
import { torneoRetos } from '@/data/gameContent';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Match {
  id: string;
  player1: Player | null; // null = BYE slot
  player2: Player | null;
  winner: Player | null;
  reto: string;
  round: number; // 0=QF, 1=SF, 2=Final
  isBye: boolean;
}

interface Props {
  players: Player[];
  onWinner: (winner: Player, loser: Player) => void;
  onClose: () => void;
  addScore: (playerId: string, delta: number) => void;
}

interface TournamentRecord {
  id: string;
  date: string;
  champion: string;
  runnerUp: string;
  participantsCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickReto(p1: Player, p2: Player): string {
  const r = torneoRetos[Math.floor(Math.random() * torneoRetos.length)];
  return r
    .replace(/\{player\}/g, p1.name)
    .replace(/\{player2\}/g, p2.name)
    .replace(/vs \{player2\}:/g, `vs ${p2.name}:`);
}

function buildRound(players: (Player | null)[], roundIdx: number): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < players.length; i += 2) {
    const p1 = players[i] ?? null;
    const p2 = players[i + 1] ?? null;
    const isBye = !p2;
    matches.push({
      id: `r${roundIdx}-m${i / 2}`,
      player1: p1,
      player2: p2,
      winner: isBye ? p1 : null,
      reto: p1 && p2 ? pickReto(p1, p2) : '',
      round: roundIdx,
      isBye,
    });
  }
  return matches;
}

function buildBracket(players: Player[]): Match[][] {
  const shuffled = shuffle(players);
  // Pad to next power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  const padded: (Player | null)[] = [...shuffled, ...Array(size - shuffled.length).fill(null)];

  const rounds: Match[][] = [];
  let current: (Player | null)[] = padded;
  let roundIdx = 0;
  while (current.length > 1) {
    const matches = buildRound(current, roundIdx);
    rounds.push(matches);
    current = matches.map(m => m.winner); // BYEs auto-advance
    roundIdx++;
  }
  return rounds;
}

const ROUND_NAMES = ['Cuartos', 'Semifinales', 'Final', 'Campeón'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ player, size = 'md' }: { player: Player | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const s = size === 'xl' ? 'w-24 h-24 text-4xl' : size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-xs';
  if (!player) return <div className={`${s} rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 font-bold`}>?</div>;
  return (
    <div className={`${s} rounded-[20px] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 border-2 border-amber-400 flex items-center justify-center font-black overflow-hidden flex-shrink-0 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)]`}>
      {player.avatar_url
        ? <img src={player.avatar_url} className="w-full h-full object-cover" />
        : <span>{player.name[0]?.toUpperCase()}</span>
      }
    </div>
  );
};

const BracketSlot = ({
  match, isActive, onClick,
}: {
  match: Match; isActive: boolean; onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl border p-3.5 cursor-pointer transition-all select-none w-full max-w-[240px] relative overflow-hidden backdrop-blur-md ${
      isActive
        ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.3)] scale-[1.02]'
        : match.winner
          ? 'border-white/5 bg-slate-900/40 opacity-70 hover:opacity-100'
          : 'border-white/10 bg-slate-900/60 hover:border-white/20 hover:scale-[1.01]'
    }`}
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
  >
    {isActive && (
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 animate-pulse" />
    )}
    
    {match.isBye ? (
      <div className="flex items-center gap-2">
        <Avatar player={match.player1} size="sm" />
        <div className="min-w-0">
          <p className="text-white font-black text-xs truncate">{match.player1?.name}</p>
          <p className="text-emerald-400 text-[9px] font-black uppercase tracking-wider">Pasa por BYE ⏩</p>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2 relative">
        {/* Player 1 */}
        <div className={`flex items-center gap-2.5 ${match.winner?.id === match.player1?.id ? 'text-amber-300 font-black' : match.winner ? 'opacity-40 text-white/50' : 'text-white/80'}`}>
          <Avatar player={match.player1} size="sm" />
          <p className="text-xs font-black truncate flex-1">{match.player1?.name ?? 'En espera'}</p>
          {match.winner?.id === match.player1?.id && <span className="text-amber-400 text-xs">👑</span>}
        </div>
        
        {/* Connector or VS separator line */}
        <div className="flex items-center gap-1.5 my-0.5">
          <div className="h-[1px] bg-white/5 flex-1" />
          <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">VS</span>
          <div className="h-[1px] bg-white/5 flex-1" />
        </div>

        {/* Player 2 */}
        <div className={`flex items-center gap-2.5 ${match.winner?.id === match.player2?.id ? 'text-amber-300 font-black' : match.winner ? 'opacity-40 text-white/50' : 'text-white/80'}`}>
          <Avatar player={match.player2} size="sm" />
          <p className="text-xs font-black truncate flex-1">{match.player2?.name ?? 'En espera'}</p>
          {match.winner?.id === match.player2?.id && <span className="text-amber-400 text-xs">👑</span>}
        </div>
      </div>
    )}
  </motion.div>
);

const DuelScreen = ({
  match, voters, onVote,
}: {
  match: Match; voters: Player[]; onVote: (winner: Player) => void;
}) => {
  const [voted, setVoted] = useState(false);

  const handleVote = (winner: Player) => {
    if (voted) return;
    setVoted(true);
    setTimeout(() => onVote(winner), 600);
  };

  return (
    <motion.div
      key={match.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-slate-950/96 backdrop-blur-lg flex flex-col items-center justify-center p-6 gap-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl animate-bounce">⚔️</span>
        <div className="text-center">
          <p className="text-amber-400 font-black text-sm uppercase tracking-[0.25em]">
            {ROUND_NAMES[match.round] ?? 'Final'}
          </p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-black">Torneo Head-to-Head</p>
        </div>
        <span className="text-3xl animate-bounce">⚔️</span>
      </div>

      {/* Players Duel Panel */}
      <div className="flex items-center gap-6 w-full max-w-sm justify-center relative my-4">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-center gap-3 flex-1 max-w-[120px]"
        >
          <Avatar player={match.player1} size="lg" />
          <p className="text-white font-black text-sm text-center truncate w-full shadow-sm">{match.player1?.name}</p>
        </motion.div>

        <div className="text-amber-400 font-black text-2xl z-10 select-none bg-slate-900 border border-white/10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-black/40">VS</div>

        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-center gap-3 flex-1 max-w-[120px]"
        >
          <Avatar player={match.player2} size="lg" />
          <p className="text-white font-black text-sm text-center truncate w-full shadow-sm">{match.player2?.name}</p>
        </motion.div>
      </div>

      {/* Reto Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/80 border-2 border-white/10 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
          EL RETO DE DUELO
        </div>
        <p className="text-white font-black text-base leading-snug mt-1 pt-2">{match.reto}</p>
      </motion.div>

      {/* Voting Area */}
      <div className="w-full max-w-sm flex flex-col items-center">
        <p className="text-white/40 text-xs text-center mb-4 uppercase tracking-widest font-black">
          {voted ? '⚖️ ¡VOTO REGISTRADO! Avanzando...' : '¿Quién ha ganado el duelo?'}
        </p>
        <div className="flex gap-4 w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={voted}
            onClick={() => match.player1 && handleVote(match.player1)}
            className="flex-1 py-4.5 rounded-2xl bg-gradient-to-b from-blue-600/20 to-blue-500/10 border-2 border-blue-500/30 text-blue-300 font-black text-sm flex flex-col items-center gap-1 shadow-lg hover:border-blue-400/50 disabled:opacity-40 transition-all active:scale-95"
          >
            <span className="text-2xl filter drop-shadow-[0_2px_5px_rgba(59,130,246,0.5)]">👑</span>
            {match.player1?.name}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={voted}
            onClick={() => match.player2 && handleVote(match.player2)}
            className="flex-1 py-4.5 rounded-2xl bg-gradient-to-b from-rose-600/20 to-rose-500/10 border-2 border-rose-500/30 text-rose-300 font-black text-sm flex flex-col items-center gap-1 shadow-lg hover:border-rose-400/50 disabled:opacity-40 transition-all active:scale-95"
          >
            <span className="text-2xl filter drop-shadow-[0_2px_5px_rgba(244,63,94,0.5)]">👑</span>
            {match.player2?.name}
          </motion.button>
        </div>
      </div>

      {/* Spectators/Voters */}
      {voters.length > 0 && (
        <div className="flex flex-col items-center gap-2 max-w-xs">
          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">JURADO (votan todos)</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {voters.map(v => (
              <span key={v.id} className="text-[10px] bg-slate-900 border border-white/10 text-white/50 px-2.5 py-1 rounded-full font-bold">
                👁️ {v.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ChampionScreen = ({ winner, onClose }: { winner: Player; onClose: () => void }) => {
  // Sparkle stars array for visual excellence animation
  const sparkles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    delay: Math.random() * 1.5,
    scale: Math.random() * 0.8 + 0.4
  })), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden"
    >
      {/* Animated Glowing Background Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] -top-12 -left-12 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[80px] -bottom-12 -right-12 pointer-events-none" />

      {/* Floating Sparkles */}
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          className="absolute text-amber-300"
          style={{ top: `${s.y}%`, left: `${s.x}%` }}
          animate={{
            scale: [0, s.scale, 0],
            opacity: [0, 0.8, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut"
          }}
        >
          <Star className="w-5 h-5 fill-current" />
        </motion.div>
      ))}

      {/* Winner Visual Card */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="relative"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <Trophy className="w-20 h-20 text-amber-400 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] fill-current" />
        </div>
        <div className="pt-8">
          <Avatar player={winner} size="xl" />
        </div>
      </motion.div>

      <div className="text-center z-10">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-amber-400 font-black text-xs uppercase tracking-[0.4em] mb-2"
        >
          🏆 Campeón del Torneo 🏆
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white font-black text-4xl uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
        >
          {winner.name}
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center max-w-xs shadow-xl"
      >
        <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">🎁 Recompensa Real</p>
        <p className="text-white font-bold text-sm">Reparte 5 tragos a quien tú quieras en este grupo 👑</p>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="mt-6 px-10 py-4.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-amber-400 text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all z-10"
      >
        Continuar partida →
      </motion.button>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function MegamixTournament({ players, onWinner, onClose, addScore }: Props) {
  const [rounds, setRounds] = useState<Match[][]>(() => buildBracket(players));
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [showDuel, setShowDuel] = useState(false);
  const [champion, setChampion] = useState<Player | null>(null);
  const [viewRound, setViewRound] = useState(0);
  const [viewTab, setViewTab] = useState<'bracket' | 'list' | 'history'>('bracket');
  
  // Historical memory loaded from localStorage
  const [tournamentHistory, setTournamentHistory] = useState<TournamentRecord[]>(() => {
    try {
      const hist = localStorage.getItem('fiesta_megamix_tournament_history');
      return hist ? JSON.parse(hist) : [];
    } catch {
      return [];
    }
  });

  // Find first pending non-bye match on mount and trigger immediately
  useEffect(() => {
    const firstActive = rounds[0]?.findIndex(m => !m.winner && !m.isBye) ?? -1;
    if (firstActive >= 0) {
      setCurrentMatchIdx(firstActive);
      setShowDuel(true);
    }
  }, []);

  // Save champion record to memory (localStorage)
  const recordTournament = useCallback((winnerName: string, runnerUpName: string, count: number) => {
    try {
      const newRecord: TournamentRecord = {
        id: String(Date.now()),
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
        champion: winnerName,
        runnerUp: runnerUpName || 'Subcampeón',
        participantsCount: count
      };

      setTournamentHistory(prev => {
        const next = [newRecord, ...prev];
        localStorage.setItem('fiesta_megamix_tournament_history', JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.error("Failed to save tournament memory:", e);
    }
  }, []);

  const advanceWinner = useCallback((winner: Player, loser: Player, rIdx: number, mIdx: number) => {
    setRounds(prev => {
      const next = prev.map(r => r.map(m => ({ ...m })));
      next[rIdx][mIdx].winner = winner;

      // Build next round if this round is now complete
      const roundDone = next[rIdx].every(m => m.winner);
      if (roundDone) {
        const nextPlayers = next[rIdx].map(m => m.winner!);
        if (nextPlayers.length === 1) {
          const finalMatch = next[rIdx][mIdx];
          const runnerUp = finalMatch.player1?.id === winner.id ? finalMatch.player2 : finalMatch.player1;
          
          setChampion(winner);
          recordTournament(winner.name, runnerUp?.name || 'Subcampeón', players.length);
          return next;
        }
        if (rIdx + 1 >= next.length) {
          const newRound = buildRound(nextPlayers, rIdx + 1);
          return [...next, newRound];
        }
      }
      return next;
    });

    addScore(winner.id, 30);
    addScore(loser.id, 5);
    onWinner(winner, loser);
  }, [addScore, onWinner, players.length, recordTournament]);

  const handleVote = useCallback((winner: Player) => {
    const match = rounds[currentRoundIdx][currentMatchIdx];
    const loser = winner.id === match.player1?.id ? match.player2! : match.player1!;

    advanceWinner(winner, loser, currentRoundIdx, currentMatchIdx);
    setShowDuel(false);

    // Find next pending match in current or future rounds
    setRounds(prev => {
      const allMatches = prev.flatMap((r, ri) => r.map((m, mi) => ({ m, ri, mi })));
      const next = allMatches.find(({ m, ri, mi }) =>
        !m.winner && !m.isBye && (ri > currentRoundIdx || (ri === currentRoundIdx && mi > currentMatchIdx))
      );
      if (next) {
        setTimeout(() => {
          setCurrentRoundIdx(next.ri);
          setCurrentMatchIdx(next.mi);
          setViewRound(next.ri);
          setShowDuel(true);
        }, 800);
      }
      return prev;
    });
  }, [rounds, currentRoundIdx, currentMatchIdx, advanceWinner]);

  const activeMatch = rounds[currentRoundIdx]?.[currentMatchIdx];
  const voters = players.filter(p => p.id !== activeMatch?.player1?.id && p.id !== activeMatch?.player2?.id);

  if (champion) {
    return <ChampionScreen winner={champion} onClose={onClose} />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-md flex flex-col text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 bg-slate-900/20">
          <div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse fill-current" />
              <p className="text-amber-400 font-black text-sm uppercase tracking-[0.2em] shadow-sm">Torneo Megamix</p>
            </div>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{players.length} Jugadores · Eliminatoria Directa</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Navigation Tabs (Tree / Flat List / History) */}
        <div className="flex border-b border-white/5 bg-slate-950/50 p-2 gap-1.5">
          <button
            onClick={() => setViewTab('bracket')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              viewTab === 'bracket'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Vista Árbol
          </button>
          <button
            onClick={() => setViewTab('list')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              viewTab === 'list'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <List className="w-4 h-4" />
            Vista Lista
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              viewTab === 'history'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 animate-bounce" />
            Historial
          </button>
        </div>

        {/* ── Tab Content 1: Visual Bracket Tree ── */}
        {viewTab === 'bracket' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-row items-center p-6 gap-8 select-none no-scrollbar">
            {rounds.map((roundMatches, ri) => (
              <div key={ri} className="flex flex-col justify-around h-full min-h-[420px] gap-6 min-w-[240px] relative">
                <div className="text-center absolute -top-2 left-0 right-0">
                  <span className="text-[10px] bg-slate-900 border border-white/10 px-3 py-1 rounded-full text-white/50 font-black uppercase tracking-widest shadow-sm">
                    {ROUND_NAMES[ri] || `Ronda ${ri + 1}`}
                  </span>
                </div>
                <div className="flex flex-col justify-around h-full gap-4 pt-6">
                  {roundMatches.map((match, mi) => (
                    <BracketSlot
                      key={match.id}
                      match={match}
                      isActive={currentRoundIdx === ri && currentMatchIdx === mi && !match.winner}
                      onClick={() => {
                        if (!match.winner && !match.isBye && match.player1 && match.player2) {
                          setCurrentRoundIdx(ri);
                          setCurrentMatchIdx(mi);
                          setShowDuel(true);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab Content 2: Flat List ── */}
        {viewTab === 'list' && (
          <div className="flex-1 flex flex-col">
            {/* Round select tabs */}
            <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar bg-slate-950/20 border-b border-white/5">
              {rounds.map((r, ri) => (
                <button
                  key={ri}
                  onClick={() => setViewRound(ri)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    viewRound === ri
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  {ROUND_NAMES[ri] ?? `R${ri + 1}`}
                </button>
              ))}
            </div>

            {/* List of matches for selected round */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {(rounds[viewRound] ?? []).map((match, mi) => (
                  <div key={match.id} className="flex justify-center">
                    <BracketSlot
                      match={match}
                      isActive={currentRoundIdx === viewRound && currentMatchIdx === mi && !match.winner}
                      onClick={() => {
                        if (!match.winner && !match.isBye && match.player1 && match.player2) {
                          setCurrentRoundIdx(viewRound);
                          setCurrentMatchIdx(mi);
                          setShowDuel(true);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content 3: Hall of Champions (Memory) ── */}
        {viewTab === 'history' && (
          <div className="flex-1 overflow-y-auto px-5 py-5 max-w-md mx-auto w-full">
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto fill-current" />
                <p className="text-white font-black text-lg mt-1">Sala de Campeones</p>
                <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Memoria de Torneos del Grupo</p>
              </div>

              {tournamentHistory.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center text-white/40 flex flex-col items-center gap-3"
                >
                  <Award className="w-8 h-8 text-white/20" />
                  <div>
                    <p className="font-bold text-sm text-white/80">No hay torneos completados</p>
                    <p className="text-xs text-white/30 mt-1 max-w-[220px]">¡Llega a la final en el Megamix y conságrate en este historial para siempre!</p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {tournamentHistory.map((rec, idx) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-black text-[9px] uppercase">CAMPEÓN</span>
                          <span className="text-[10px] text-white/30 font-bold">{rec.date}</span>
                        </div>
                        <p className="text-white font-black text-base truncate flex items-center gap-1.5">
                          👑 {rec.champion}
                        </p>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-wider mt-1">
                          🥈 Subcampeón: {rec.runnerUp}
                        </p>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 text-right">
                        <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-500" />
                          {rec.participantsCount}p
                        </span>
                        <span className="text-[9px] text-white/20 font-black tracking-widest uppercase mt-1">Eliminatoria</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom CTA Area */}
        {viewTab !== 'history' && !showDuel && activeMatch && !activeMatch.winner && (
          <div className="px-5 pb-6 pt-3 border-t border-white/5 bg-slate-950/50">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowDuel(true)}
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-amber-400 text-black font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Siguiente combate: {activeMatch.player1?.name} vs {activeMatch.player2?.name} →
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Duel Screen Overlay */}
      <AnimatePresence>
        {showDuel && activeMatch && !activeMatch.isBye && activeMatch.player1 && activeMatch.player2 && (
          <DuelScreen
            match={activeMatch}
            voters={voters}
            onVote={handleVote}
          />
        )}
      </AnimatePresence>
    </>
  );
}
