import React from 'react';
import { motion } from 'framer-motion';

// ─── Tipos ──────────────────────────────────────────────────────────────────
// Forma mínima y serializable: así sirve tanto para el estado local de
// MegamixTournament como para el snapshot que viaja por el canal realtime
// (broadcastState) hacia el resto de móviles.

export interface BracketPlayer {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface BracketMatch {
  id: string;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  winner: BracketPlayer | null;
  isBye: boolean;
  round: number;
}

export const DEFAULT_ROUND_NAMES = ['Cuartos', 'Semifinales', 'Final', 'Campeón'];

interface BracketAvatarProps {
  player: BracketPlayer | null;
  size?: 'xs' | 'sm' | 'md';
}

export const BracketAvatar = ({ player, size = 'sm' }: BracketAvatarProps) => {
  const s = size === 'md' ? 'w-10 h-10 text-base' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-5 h-5 text-[9px]';
  if (!player) {
    return <div className={`${s} rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 font-bold flex-shrink-0`}>?</div>;
  }
  return (
    <div className={`${s} rounded-[10px] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 border border-amber-400 flex items-center justify-center font-black overflow-hidden flex-shrink-0 text-white`}>
      {player.avatar_url
        ? <img src={player.avatar_url} className="w-full h-full object-cover" />
        : <span>{player.name?.[0]?.toUpperCase() ?? '?'}</span>}
    </div>
  );
};

interface BracketSlotProps {
  match: BracketMatch;
  isActive: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const BracketSlotView = ({ match, isActive, onClick, compact }: BracketSlotProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`rounded-xl border select-none w-full max-w-[220px] relative overflow-hidden backdrop-blur-md ${compact ? 'p-2' : 'p-3'} ${
      onClick ? 'cursor-pointer' : ''
    } ${
      isActive
        ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
        : match.winner
          ? 'border-white/5 bg-slate-900/40 opacity-70'
          : 'border-white/10 bg-slate-900/60'
    }`}
  >
    {isActive && (
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 animate-pulse" />
    )}

    {match.isBye ? (
      <div className="flex items-center gap-2">
        <BracketAvatar player={match.player1} />
        <div className="min-w-0">
          <p className="text-white font-black text-[11px] truncate">{match.player1?.name}</p>
          <p className="text-emerald-400 text-[8px] font-black uppercase tracking-wider">Pasa por BYE ⏩</p>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-1.5">
        <div className={`flex items-center gap-2 ${match.winner?.id === match.player1?.id ? 'text-amber-300 font-black' : match.winner ? 'opacity-40 text-white/50' : 'text-white/80'}`}>
          <BracketAvatar player={match.player1} />
          <p className="text-[11px] font-black truncate flex-1">{match.player1?.name ?? 'En espera'}</p>
          {match.winner?.id === match.player1?.id && <span className="text-amber-400 text-[11px]">👑</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[1px] bg-white/5 flex-1" />
          <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">VS</span>
          <div className="h-[1px] bg-white/5 flex-1" />
        </div>
        <div className={`flex items-center gap-2 ${match.winner?.id === match.player2?.id ? 'text-amber-300 font-black' : match.winner ? 'opacity-40 text-white/50' : 'text-white/80'}`}>
          <BracketAvatar player={match.player2} />
          <p className="text-[11px] font-black truncate flex-1">{match.player2?.name ?? 'En espera'}</p>
          {match.winner?.id === match.player2?.id && <span className="text-amber-400 text-[11px]">👑</span>}
        </div>
      </div>
    )}
  </motion.div>
);

export interface TournamentBracketProps {
  rounds: BracketMatch[][];
  currentRoundIdx: number;
  currentMatchIdx: number;
  roundNames?: string[];
  onMatchClick?: (roundIdx: number, matchIdx: number) => void;
  compact?: boolean;
  champion?: BracketPlayer | null;
}

/**
 * Vista de bracket (cuadro de eliminatorias) — puramente visual y sin
 * dependencias pesadas (CSS/flex + framer-motion, que ya es dependencia del
 * proyecto). Pensada para reusarse tanto dentro de MegamixTournament (modo
 * interactivo, con onMatchClick) como en un panel de solo-lectura que ven
 * todos los móviles conectados a partir del snapshot sincronizado por
 * realtime (gameState.tournamentBracket).
 */
export function TournamentBracket({
  rounds, currentRoundIdx, currentMatchIdx, roundNames = DEFAULT_ROUND_NAMES, onMatchClick, compact, champion,
}: TournamentBracketProps) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-row items-center gap-6 select-none no-scrollbar">
      {rounds.map((roundMatches, ri) => (
        <div key={ri} className="flex flex-col justify-around h-full min-h-[320px] gap-4 min-w-[180px] relative">
          <div className="text-center absolute -top-2 left-0 right-0">
            <span className="text-[9px] bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded-full text-white/50 font-black uppercase tracking-widest">
              {roundNames[ri] || `Ronda ${ri + 1}`}
            </span>
          </div>
          <div className="flex flex-col justify-around h-full gap-3 pt-6">
            {roundMatches.map((match, mi) => (
              <BracketSlotView
                key={match.id}
                match={match}
                compact={compact}
                isActive={currentRoundIdx === ri && currentMatchIdx === mi && !match.winner}
                onClick={onMatchClick ? () => onMatchClick(ri, mi) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
      {champion && (
        <div className="flex flex-col items-center justify-center gap-2 min-w-[140px]">
          <span className="text-[9px] bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
            Campeón
          </span>
          <BracketAvatar player={champion} size="md" />
          <p className="text-amber-300 font-black text-xs truncate max-w-[120px]">{champion.name}</p>
        </div>
      )}
    </div>
  );
}
