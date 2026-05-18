import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const Avatar = ({ player, size = 'md' }: { player: Player | null; size?: 'sm' | 'md' | 'lg' }) => {
  const s = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
  if (!player) return <div className={`${s} rounded-full bg-white/5 border border-white/10`} />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-400 flex items-center justify-center font-black overflow-hidden flex-shrink-0`}>
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
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={`rounded-2xl border p-3 cursor-pointer transition-all select-none ${
      isActive
        ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
        : match.winner
          ? 'border-white/10 bg-white/3 opacity-60'
          : 'border-white/15 bg-white/5 hover:border-white/30'
    }`}
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
  >
    {match.isBye ? (
      <div className="flex items-center gap-2">
        <Avatar player={match.player1} size="sm" />
        <div>
          <p className="text-white font-bold text-xs">{match.player1?.name}</p>
          <p className="text-amber-400 text-[10px] font-bold">BYE — pasa directo</p>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 ${match.winner?.id === match.player1?.id ? 'opacity-100' : match.winner ? 'opacity-30' : ''}`}>
            <Avatar player={match.player1} size="sm" />
            <p className="text-white font-bold text-xs truncate">{match.player1?.name ?? '?'}</p>
            {match.winner?.id === match.player1?.id && <span className="text-amber-400 text-xs ml-auto">👑</span>}
          </div>
          <div className="text-white/20 text-[10px] font-black text-center">VS</div>
          <div className={`flex items-center gap-1.5 ${match.winner?.id === match.player2?.id ? 'opacity-100' : match.winner ? 'opacity-30' : ''}`}>
            <Avatar player={match.player2} size="sm" />
            <p className="text-white font-bold text-xs truncate">{match.player2?.name ?? '?'}</p>
            {match.winner?.id === match.player2?.id && <span className="text-amber-400 text-xs ml-auto">👑</span>}
          </div>
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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 gap-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⚔️</span>
        <div className="text-center">
          <p className="text-amber-400 font-black text-sm uppercase tracking-widest">
            {ROUND_NAMES[match.round] ?? 'Final'}
          </p>
          <p className="text-white/30 text-xs uppercase tracking-widest">Torneo Megamix</p>
        </div>
        <span className="text-2xl">⚔️</span>
      </div>

      {/* Players */}
      <div className="flex items-center gap-4 w-full max-w-xs justify-between">
        <div className="flex flex-col items-center gap-2">
          <Avatar player={match.player1} size="lg" />
          <p className="text-white font-black text-sm text-center">{match.player1?.name}</p>
        </div>
        <div className="text-white/20 font-black text-xl">VS</div>
        <div className="flex flex-col items-center gap-2">
          <Avatar player={match.player2} size="lg" />
          <p className="text-white font-black text-sm text-center">{match.player2?.name}</p>
        </div>
      </div>

      {/* Reto */}
      <div className="bg-white/5 border border-white/15 rounded-2xl px-5 py-4 max-w-sm w-full text-center">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">El reto</p>
        <p className="text-white font-bold text-sm leading-snug">{match.reto}</p>
      </div>

      {/* Voting */}
      <div className="w-full max-w-sm">
        <p className="text-white/40 text-xs text-center mb-3 uppercase tracking-widest font-bold">
          {voted ? '¡Votado! Procesando...' : '¿Quién lo hizo mejor?'}
        </p>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={voted}
            onClick={() => match.player1 && handleVote(match.player1)}
            className="flex-1 py-5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-black text-sm flex flex-col items-center gap-1 disabled:opacity-40"
          >
            <span className="text-2xl">👑</span>
            {match.player1?.name}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={voted}
            onClick={() => match.player2 && handleVote(match.player2)}
            className="flex-1 py-5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-black text-sm flex flex-col items-center gap-1 disabled:opacity-40"
          >
            <span className="text-2xl">👑</span>
            {match.player2?.name}
          </motion.button>
        </div>
      </div>

      {/* Voters chips */}
      {voters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
          {voters.map(v => (
            <span key={v.id} className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold">
              {v.name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ChampionScreen = ({ winner, onClose }: { winner: Player; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center gap-6 p-8"
  >
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      className="text-7xl"
    >🏆</motion.div>
    <div className="text-center">
      <p className="text-amber-400 font-black text-xs uppercase tracking-[0.4em] mb-2">Campeón del Torneo</p>
      <p className="text-white font-black text-4xl uppercase tracking-tight">{winner.name}</p>
    </div>
    <Avatar player={winner} size="lg" />
    <p className="text-white/40 text-sm text-center">Reparte 5 tragos a quien quiera 👑</p>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClose}
      className="mt-4 px-8 py-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm uppercase tracking-widest"
    >
      Continuar partida →
    </motion.button>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function MegamixTournament({ players, onWinner, onClose, addScore }: Props) {
  const [rounds, setRounds] = useState<Match[][]>(() => buildBracket(players));
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [showDuel, setShowDuel] = useState(false);
  const [champion, setChampion] = useState<Player | null>(null);
  const [viewRound, setViewRound] = useState(0);

  // Find first non-bye pending match on mount
  useEffect(() => {
    const firstActive = rounds[0]?.findIndex(m => !m.winner && !m.isBye) ?? -1;
    if (firstActive >= 0) {
      setCurrentMatchIdx(firstActive);
      setShowDuel(true);
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
          setChampion(nextPlayers[0]);
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
  }, [addScore, onWinner]);

  const handleVote = useCallback((winner: Player) => {
    const match = rounds[currentRoundIdx][currentMatchIdx];
    const loser = winner.id === match.player1?.id ? match.player2! : match.player1!;

    advanceWinner(winner, loser, currentRoundIdx, currentMatchIdx);
    setShowDuel(false);

    // Find next pending match
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
        className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-sm flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-amber-400 font-black text-base uppercase tracking-widest">⚔️ Torneo Megamix</p>
            <p className="text-white/30 text-xs">{players.length} jugadores · Eliminatoria directa</p>
          </div>
          <button onClick={onClose} className="text-white/30 text-xs uppercase tracking-widest font-bold hover:text-white/60 transition-colors">
            Salir ✕
          </button>
        </div>

        {/* Round tabs */}
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto no-scrollbar">
          {rounds.map((r, ri) => (
            <button
              key={ri}
              onClick={() => setViewRound(ri)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                viewRound === ri
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {ROUND_NAMES[ri] ?? `R${ri + 1}`}
            </button>
          ))}
        </div>

        {/* Bracket */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex flex-col gap-2">
            {(rounds[viewRound] ?? []).map((match, mi) => (
              <BracketSlot
                key={match.id}
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
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!showDuel && activeMatch && !activeMatch.winner && (
          <div className="px-5 pb-6">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDuel(true)}
              className="w-full py-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm uppercase tracking-widest"
            >
              Iniciar combate: {activeMatch.player1?.name} vs {activeMatch.player2?.name} →
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Duel overlay */}
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
