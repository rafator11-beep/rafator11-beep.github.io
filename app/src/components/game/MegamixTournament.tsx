import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Calendar, Users, Layers, List, Play, X, Star } from 'lucide-react';
import { Player } from '@/types/game';
import { torneoRetos } from '@/data/gameContent';
import { duelosV5 } from '@/data/updatePostVerano2026';
import { duelosV5b } from '@/data/updatePostVerano2026_v2';
import { moreTorneoRetos } from '@/data/extraContentIndex';
import { TournamentBracket, BracketMatch } from '@/components/game/TournamentBracket';

// Pool ampliado de retos de duelo, sin repeticiones dentro de la sesión.
const DUEL_POOL: string[] = Array.from(new Set([...torneoRetos, ...duelosV5, ...duelosV5b, ...moreTorneoRetos]))
  .map(s => s.trim())
  .filter(Boolean);

// Pool de la REPESCA: para que de verdad se sienta "otro torneo de otra
// cosa" (como pediste), nada de pulsos ni duelos físicos — aquí es memoria,
// rapidez mental y suerte. Los eliminados del bracket principal compiten en
// esto por una segunda oportunidad.
const REPESCA_POOL: string[] = [
  "🧠 REPESCA — MEMORIA: {player} y {player2}, la mesa dice 6 objetos. Repetidlos en orden por turnos. El que se equivoque antes, pierde.",
  "🧠 REPESCA — CADENA DE PAÍSES: {player} empieza, {player2} sigue con la última letra. El que se quede en blanco 3s, pierde.",
  "🧠 REPESCA — NÚMEROS: {player} y {player2} cuentan alternando del 1 al 30, pero si toca múltiplo de 3 hay que decir 'bip'. El que falle, pierde.",
  "⚡ REPESCA — RAPIDEZ: a la de 3, {player} y {player2} dicen un color. Si coincide, se repite; el primero que dude, pierde.",
  "⚡ REPESCA — ALFABETO: {player} y {player2} dicen nombres de famosos empezando por la letra que diga la mesa, por turnos. El que se atasque, pierde.",
  "🎯 REPESCA — PUNTERÍA: {player} y {player2} intentan encestar algo (un papel, un tapón) en un vaso desde la misma distancia. Mejor de 3 tiros.",
  "🤐 REPESCA — AGUANTA LA RISA: la mesa intenta hacer reír a {player} y {player2} a la vez durante 15s. El primero que se ría, pierde.",
  "🧠 REPESCA — TRIVIAL EXPRÉS: la mesa hace una pregunta de cultura general. El primero de {player} o {player2} en contestar bien, gana.",
  "👁️ REPESCA — ESTATUA: {player} y {player2} se quedan congelados. El primero que se mueva o se ría, pierde.",
  "🗣️ REPESCA — TRABALENGUAS: {player} y {player2} repiten el mismo trabalenguas 3 veces seguidas lo más rápido posible. Gana quien lo borde.",
  "🧠 REPESCA — CATEGORÍA RÁPIDA: la mesa dice una categoría (animales, comida...). {player} y {player2} se turnan diciendo uno cada uno sin repetir hasta que alguien falle.",
  "✋ REPESCA — PALMADA: {player} y {player2} ponen las manos juntas; uno intenta dar una palmada en la mano del otro antes de que la retire. Mejor de 3.",
  "🎲 REPESCA — PIEDRA PAPEL TIJERA: mejor de 5 entre {player} y {player2}. Sin trampas.",
  "🧠 REPESCA — ORDEN CRONOLÓGICO: la mesa dice 4 años al azar; {player} y {player2} compiten por decir el orden correcto primero.",
  "⚡ REPESCA — ECO: {player} dice una frase corta, {player2} tiene que repetirla exacta al momento. Si falla una palabra, pierde; si acierta, cambian los papeles.",
];

const SEEN_KEY = 'beep_duel_retos_seen';
function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function saveSeen(set: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-400))); } catch { /* ignore */ }
}

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
  // Fired on every bracket change (nuevo ganador, nueva ronda, nueva llave,
  // campeón...) para que el host pueda espejarlo en gameState y así llegue
  // por el canal realtime ya existente a todos los móviles conectados.
  onStateChange?: (snapshot: {
    active: boolean;
    stage: 'main' | 'repesca';
    bracketNumber: number;
    rounds: BracketMatch[][];
    currentRoundIdx: number;
    currentMatchIdx: number;
    champion: Player | null;
  }) => void;
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

function pickReto(p1: Player, p2: Player, pool: string[], seenKey: string): string {
  const seen = loadSeen2(seenKey);
  let fresh = pool.filter(r => !seen.has(r));
  if (fresh.length === 0) { seen.clear(); fresh = pool; }
  const r = fresh[Math.floor(Math.random() * fresh.length)] || pool[0] || 'DUELO: {player} vs {player2}. Pulso de miradas, el que parpadee bebe 2.';
  seen.add(r);
  saveSeen2(seenKey, seen);
  return r
    .replace(/\{player2\}|\{jugador2\}|\{rival\}/gi, p2.name)
    .replace(/\{player\}|\{jugador\}|\{nombre\}/gi, p1.name)
    .replace(/vs \{player2\}:/gi, `vs ${p2.name}:`);
}
function loadSeen2(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function saveSeen2(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set].slice(-400))); } catch { /* ignore */ }
}

function buildRound(players: (Player | null)[], roundIdx: number, pool: string[], seenKey: string): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < players.length; i += 2) {
    const p1 = players[i] ?? null;
    const p2 = players[i + 1] ?? null;
    const isBye = !p2;
    matches.push({
      id: `r${roundIdx}-m${i / 2}-${Math.random().toString(36).slice(2, 6)}`,
      player1: p1,
      player2: p2,
      winner: isBye ? p1 : null,
      reto: p1 && p2 ? pickReto(p1, p2, pool, seenKey) : '',
      round: roundIdx,
      isBye,
    });
  }
  return matches;
}

function buildBracket(players: Player[], pool: string[] = DUEL_POOL, seenKey: string = SEEN_KEY): Match[][] {
  const shuffled = shuffle(players);
  // Pad to next power of 2 (mínimo 2 para evitar log2(1)=0)
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(shuffled.length, 2))));
  const padded: (Player | null)[] = [...shuffled, ...Array(size - shuffled.length).fill(null)];

  // OJO: solo se construye la PRIMERA ronda aquí. Las siguientes rondas las
  // añade advanceWinner() dinámicamente según se van conociendo los
  // ganadores reales — si se pre-construían todas las rondas de golpe (como
  // antes), las rondas 2+ nacían con player1/player2 null y la comprobación
  // `!p2` las marcaba isBye=true con winner=null. Eso bloqueaba el torneo
  // para siempre en cualquier bracket de más de 2 jugadores: advanceWinner
  // nunca encontraba hueco para escribir el ganador real (la ronda "ya
  // existía") y la búsqueda del siguiente duelo descartaba esa ronda por
  // tener isBye=true, así que no pasaba nada al tocar nada = app pillada.
  return [buildRound(padded, 0, pool, seenKey)];
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

const ChampionScreen = ({
  winner, onNewBracket, onFinish, standings, bracketNumber,
  stage, eliminatedCount, onStartRepesca, onBackToMain,
}: {
  winner: Player;
  onNewBracket: () => void;
  onFinish: () => void;
  standings: { name: string; wins: number }[];
  bracketNumber: number;
  stage: 'main' | 'repesca';
  eliminatedCount: number;
  onStartRepesca: () => void;
  onBackToMain: () => void;
}) => {
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
          {stage === 'repesca' ? '🥈 Campeón de la Repesca 🥈' : `🏆 Campeón de la llave ${bracketNumber} 🏆`}
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
        <p className="text-white font-bold text-sm">
          {stage === 'repesca'
            ? `${winner.name} se gana una revancha: elige a alguien del bracket principal y que beba 2 👑`
            : `${winner.name} reparte 5 tragos a quien quiera 👑`}
        </p>
      </motion.div>

      {/* Liga de duelos — clasificación continua entre llaves */}
      {standings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/70 border border-white/10 rounded-2xl px-5 py-4 w-full max-w-xs z-10"
        >
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.25em] mb-2 text-center">Liga de duelos</p>
          <div className="flex flex-col gap-1.5">
            {standings.slice(0, 6).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-white/80 font-bold truncate">
                  {['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} {s.name}
                </span>
                <span className="text-amber-400 font-black">{s.wins} {s.wins === 1 ? 'llave' : 'llaves'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex flex-col gap-3 w-full max-w-xs z-10">
        {stage === 'main' && eliminatedCount >= 2 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartRepesca}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 border-2 border-cyan-400 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            🥈 Repesca de eliminados ({eliminatedCount})
          </motion.button>
        )}
        {stage === 'repesca' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBackToMain}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 border-2 border-cyan-400 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            🏆 Volver al torneo principal
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNewBracket}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-amber-400 text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          🔁 Nueva llave (barajar cruces)
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onFinish}
          className="px-10 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white/70 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
        >
          Terminar y seguir la partida →
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const REPESCA_SEEN_KEY = 'beep_repesca_retos_seen';

export function MegamixTournament({ players, onWinner, onClose, addScore, onStateChange }: Props) {
  // Quiénes compiten en el bracket que se ve AHORA mismo: el principal
  // (todos) o la repesca (solo los eliminados del principal).
  const [stage, setStage] = useState<'main' | 'repesca'>('main');
  const [activePlayers, setActivePlayers] = useState<Player[]>(players);
  const [eliminated, setEliminated] = useState<Player[]>([]);
  const pool = stage === 'repesca' ? REPESCA_POOL : DUEL_POOL;
  const seenKey = stage === 'repesca' ? REPESCA_SEEN_KEY : SEEN_KEY;

  const [rounds, setRounds] = useState<Match[][]>(() => buildBracket(players));
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [showDuel, setShowDuel] = useState(false);
  const [champion, setChampion] = useState<Player | null>(null);
  const [bracketNumber, setBracketNumber] = useState(1);
  const [bracketWins, setBracketWins] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('beep_bracket_wins') || '{}'); } catch { return {}; }
  });
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

  // Espeja el estado del bracket hacia el padre (PartyGame) cada vez que
  // cambia algo relevante, para que el host pueda meterlo en gameState y
  // llegue por realtime a todos los móviles (vista de bracket en vivo).
  useEffect(() => {
    onStateChange?.({
      active: true,
      stage,
      bracketNumber,
      rounds,
      currentRoundIdx,
      currentMatchIdx,
      champion,
    });
  }, [rounds, currentRoundIdx, currentMatchIdx, champion, stage, bracketNumber, onStateChange]);

  // Al desmontar (torneo cerrado), avisa de que ya no hay bracket activo.
  useEffect(() => {
    return () => {
      onStateChange?.({
        active: false,
        stage,
        bracketNumber,
        rounds,
        currentRoundIdx,
        currentMatchIdx,
        champion: null,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          const label = stage === 'repesca' ? `${winner.name} (Repesca)` : winner.name;
          recordTournament(label, runnerUp?.name || 'Subcampeón', activePlayers.length);
          if (stage === 'main') {
            setBracketWins(prev => {
              const upd = { ...prev, [winner.id]: (prev[winner.id] || 0) + 1 };
              try {
                localStorage.setItem('beep_bracket_wins', JSON.stringify(upd));
                // Mapa id→nombre para que el PartyDirector pueda citar al rey de duelos.
                const names = JSON.parse(localStorage.getItem('beep_bracket_win_names') || '{}');
                players.forEach(p => { names[p.id] = p.name; });
                localStorage.setItem('beep_bracket_win_names', JSON.stringify(names));
              } catch { /* ignore */ }
              return upd;
            });
          }
          return next;
        }
        if (rIdx + 1 >= next.length) {
          const newRound = buildRound(nextPlayers, rIdx + 1, pool, seenKey);
          next.push(newRound);
        }
      }

      // Busca la siguiente pelea pendiente ya sobre el estado FINAL (next),
      // en vez de leerlo en una segunda actualización separada: evita que el
      // torneo se quede pillado si el orden de aplicación de los updaters
      // cambia entre versiones de React.
      const allMatches = next.flatMap((r, ri) => r.map((m, mi) => ({ m, ri, mi })));
      const nextMatch = allMatches.find(({ m, ri, mi }) =>
        !m.winner && !m.isBye && (ri > rIdx || (ri === rIdx && mi > mIdx))
      );
      if (nextMatch) {
        setTimeout(() => {
          setCurrentRoundIdx(nextMatch.ri);
          setCurrentMatchIdx(nextMatch.mi);
          setViewRound(nextMatch.ri);
          setShowDuel(true);
        }, 800);
      }

      return next;
    });

    // Quien pierde un duelo real (no un BYE) del bracket PRINCIPAL pasa a la
    // bolsa de la repesca, para que nadie se quede mirando sin jugar.
    if (stage === 'main') {
      setEliminated(prev => prev.some(p => p.id === loser.id) ? prev : [...prev, loser]);
    }

    addScore(winner.id, stage === 'repesca' ? 15 : 30);
    addScore(loser.id, 5);
    onWinner(winner, loser);
  }, [addScore, onWinner, players, activePlayers.length, recordTournament, stage, pool, seenKey]);

  const handleVote = useCallback((winner: Player) => {
    const match = rounds[currentRoundIdx][currentMatchIdx];
    const loser = winner.id === match.player1?.id ? match.player2! : match.player1!;

    advanceWinner(winner, loser, currentRoundIdx, currentMatchIdx);
    setShowDuel(false);
  }, [rounds, currentRoundIdx, currentMatchIdx, advanceWinner]);

  // Arranca un bracket nuevo para el grupo de jugadores indicado (por
  // defecto, repite el bracket principal con los mismos de siempre).
  const startBracket = useCallback((group: Player[], nextStage: 'main' | 'repesca') => {
    const nextPool = nextStage === 'repesca' ? REPESCA_POOL : DUEL_POOL;
    const nextSeenKey = nextStage === 'repesca' ? REPESCA_SEEN_KEY : SEEN_KEY;
    const fresh = buildBracket(group, nextPool, nextSeenKey);
    setStage(nextStage);
    setActivePlayers(group);
    setRounds(fresh);
    setCurrentRoundIdx(0);
    setCurrentMatchIdx(0);
    setViewRound(0);
    setViewTab('bracket');
    setChampion(null);
    setShowDuel(false);
    if (nextStage === 'main') {
      setEliminated([]);
      setBracketNumber(n => n + 1);
    }
    setTimeout(() => {
      const firstActive = fresh[0]?.findIndex(m => !m.winner && !m.isBye) ?? -1;
      if (firstActive >= 0) {
        setCurrentMatchIdx(firstActive);
        setShowDuel(true);
      }
    }, 400);
  }, []);

  const handleNewBracket = useCallback(() => {
    // Nueva llave: si hay suficientes eliminados esperando, prioriza
    // mandarlos a la Repesca; si no, repite el bracket principal con todos.
    startBracket(players, 'main');
  }, [players, startBracket]);

  const handleStartRepesca = useCallback(() => {
    if (eliminated.length < 2) return;
    startBracket(eliminated, 'repesca');
  }, [eliminated, startBracket]);

  const handleBackToMain = useCallback(() => {
    startBracket(players, 'main');
  }, [players, startBracket]);

  const activeMatch = rounds[currentRoundIdx]?.[currentMatchIdx];
  const voters = activePlayers.filter(p => p.id !== activeMatch?.player1?.id && p.id !== activeMatch?.player2?.id);

  if (champion) {
    const standings = Object.entries(bracketWins)
      .map(([id, wins]) => ({ name: players.find(p => p.id === id)?.name ?? '¿?', wins: wins as number }))
      .filter(s => s.wins > 0)
      .sort((a, b) => b.wins - a.wins);
    return (
      <ChampionScreen
        winner={champion}
        standings={standings}
        bracketNumber={bracketNumber}
        stage={stage}
        eliminatedCount={eliminated.length}
        onNewBracket={handleNewBracket}
        onStartRepesca={handleStartRepesca}
        onBackToMain={handleBackToMain}
        onFinish={onClose}
      />
    );
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
              <p className="text-amber-400 font-black text-sm uppercase tracking-[0.2em] shadow-sm">
                {stage === 'repesca' ? 'Repesca — segunda oportunidad' : 'Torneo Megamix'}
              </p>
            </div>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
              {stage === 'repesca'
                ? `${activePlayers.length} eliminados compiten · El ganador vuelve con honor`
                : `Llave ${bracketNumber} · ${activePlayers.length} Jugadores · Eliminatoria Directa`}
              {stage === 'main' && eliminated.length > 0 && ` · 🥈 ${eliminated.length} esperando repesca`}
            </p>
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
          <div className="flex-1 p-6">
            <TournamentBracket
              rounds={rounds}
              currentRoundIdx={currentRoundIdx}
              currentMatchIdx={currentMatchIdx}
              roundNames={ROUND_NAMES}
              onMatchClick={(ri, mi) => {
                const match = rounds[ri]?.[mi];
                if (match && !match.winner && !match.isBye && match.player1 && match.player2) {
                  setCurrentRoundIdx(ri);
                  setCurrentMatchIdx(mi);
                  setShowDuel(true);
                }
              }}
            />
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
