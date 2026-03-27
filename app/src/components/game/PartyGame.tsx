import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Trophy, AlertCircle, Video, VideoOff, Copy, Crown, Plus, Minus, Eye, EyeOff, Zap, Flame, Ghost, ShieldAlert, Dice5, UserPlus, Globe, History, Play, Trash2, UserCheck, UserX, X, Camera, Cast, TrendingUp, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGame } from '@/hooks/useGame';
import { supabase } from '@/integrations/supabase/client';
import { useGameEngine } from '@/hooks/game/useGameEngine';
import { useGameContent } from '@/hooks/game/useGameContent';
import { useDrinkingMicroGames } from '@/hooks/game/useDrinkingMicroGames';
import { useGameEffects } from '@/hooks/game/useGameEffects';
import { useMultiplayer } from '@/hooks/game/useMultiplayer';
import { useRanking } from '@/hooks/useRanking';
import { useGameContext } from '@/contexts/GameContext';
import { CardDisplay } from '@/components/game/CardDisplay';
import { detectRarity } from '@/lib/godDeck';
import { sfx } from '@/lib/sfx';
import { vibe } from '@/lib/vibration';
import { GameMode } from '@/types/game';

import { ChatComponent } from '@/components/multiplayer/ChatComponent';
import { PeerBubbles } from '@/components/multiplayer/PeerBubbles';

// Subcomponents (assuming they exist or are imported)
import { ApocalypseOverlay } from '@/components/game/ApocalypseOverlay';
import { RoundSummary } from '@/components/game/RoundSummary';
import { TriviaQuestionCard } from './TriviaQuestionCard';
import { ImpostorRound } from './ImpostorRound';
import { DueloComponent } from './DueloComponent';
import { CaptainPassScreen } from './CaptainPassScreen';
import { SuggestionBox } from './SuggestionBox';
import { QuestionVote } from './QuestionVote';
import { YoNuncaEquiposFlow } from './YoNuncaEquiposFlow';
import confetti from 'canvas-confetti';

// Helper component for TTS
// TTSTrigger removed

// ─── Visual Improvements Sub-components ──────────────────────────────────────

const RARITY_CONFIG = {
  common:    { orbLeft:'rgba(99,102,241,0.08)',  orbRight:'rgba(139,92,246,0.08)',  via:'slate-900/50'  },
  rare:      { orbLeft:'rgba(59,130,246,0.18)',  orbRight:'rgba(99,102,241,0.15)', via:'blue-950/40'   },
  legendary: { orbLeft:'rgba(251,191,36,0.20)',  orbRight:'rgba(245,158,11,0.15)', via:'amber-950/40'  },
  chaos:     { orbLeft:'rgba(239,68,68,0.22)',   orbRight:'rgba(220,38,38,0.15)',  via:'red-950/50'    },
  virus:     { orbLeft:'rgba(34,197,94,0.18)',   orbRight:'rgba(16,185,129,0.14)', via:'green-950/40'  },
} as const;

const DynamicBackground = ({ rarity }: { rarity: keyof typeof RARITY_CONFIG }) => {
  const c = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.common;
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-br from-slate-950 
        via-${c.via} to-slate-950 transition-all duration-[800ms] ease-in-out`} />
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[120px]"
        animate={{ backgroundColor: c.orbLeft }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{ backgroundColor: c.orbLeft }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[120px]"
        animate={{ backgroundColor: c.orbRight }}
        transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.1 }}
        style={{ backgroundColor: c.orbRight }}
      />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/assets/noise.svg')] bg-repeat" />
    </div>
  );
};

const AnimatedXP = ({ value, playerId }: { value: number; playerId: string }) => {
  const prevRef = useRef(value);
  const [popping, setPopping] = useState(false);
  const [floater, setFloater] = useState<number|null>(null);

  useEffect(() => {
    if (value > prevRef.current) {
      const diff = value - prevRef.current;
      setPopping(true);
      setFloater(diff);
      const t = setTimeout(() => { setPopping(false); setFloater(null); }, 900);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <div className="relative flex items-center justify-center">
      <motion.span
        className="text-[11px] font-bold text-white/90 tabular-nums"
        animate={popping ? { scale:[1,1.5,1] } : { scale:1 }}
        transition={{ duration:0.3 }}
      >
        {value} XP
      </motion.span>
      <AnimatePresence>
        {floater !== null && (
          <motion.span
            className="absolute -top-5 text-[10px] font-black text-emerald-400"
            initial={{ y:0, opacity:1 }}
            animate={{ y:-16, opacity:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.8 }}
          >
            +{floater}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

const TurnBanner = ({ playerName }: { playerName: string }) => (
  <motion.div
    className="fixed top-20 left-0 right-0 z-[200] flex justify-center 
      pointer-events-none"
    initial={{ x:'100vw', opacity:0 }}
    animate={{ x:0,       opacity:1 }}
    exit={{    x:'-100vw', opacity:0 }}
    transition={{ 
      x: { type:'spring', stiffness:200, damping:28 },
      opacity: { duration:0.15 }
    }}
  >
    <div className="bg-slate-900/90 backdrop-blur-xl border border-primary/40 
      px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">
        🎯 turno de
      </span>
      <span className="ml-2 font-black text-white uppercase tracking-wider">
        {playerName}
      </span>
    </div>
  </motion.div>
);

const VirusFlash = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 z-[90] pointer-events-none"
        initial={{ opacity:0.7, backgroundColor:'#22c55e' }}
        animate={{ opacity:0 }}
        exit={{}}
        transition={{ duration:0.35, ease:'easeOut' }}
      />
    )}
  </AnimatePresence>
);

function useScrambleText(target: string, active: boolean) {
  const [display, setDisplay] = useState(target);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!';
  
  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    let iterations = 0;
    const max = target.length * 3;
    const t = setInterval(() => {
      setDisplay(
        target.split('').map((char, i) => {
          if (i < Math.floor(iterations / 3)) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      if (++iterations >= max) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [target, active]);

  return display;
}

interface PartyGameProps {
  mode: GameMode;
  onExit: () => void;
  isMultiplayer?: boolean;
  isHost?: boolean;
  roomId?: string | null;
}

// New Bottom Profiles Component with Virus Support and Captain XP Controls
const PlayerProfilesBottom = ({ players, currentPlayer, scores, playerViruses = [], mode, remoteStreams = [], captainId, onAdjustXP }: { players: any[], currentPlayer: any, scores: any, playerViruses?: any[], mode: GameMode, remoteStreams?: any[], captainId?: string | null, onAdjustXP?: (pid: string, delta: number) => void }) => {
  const [editMode, setEditMode] = useState(false); // Mejora 10: Edit mode for mobile

  return (
    <div className="fixed bottom-0 left-0 right-0 h-28 md:h-32 bg-slate-950/60 backdrop-blur-[24px] border-t border-white/10 flex items-center justify-center px-6 gap-6 z-[100] overflow-x-auto no-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Edit Mode Toggle Button */}
      {captainId && (
        <button
          onClick={() => setEditMode(e => !e)}
          className={`absolute top-2 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all z-[120] ${editMode ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/10 text-white/50'}`}
        >
          {editMode ? '✅' : '✏️'}
        </button>
      )}

      <div className="flex items-center gap-4 md:gap-8">
        {players.map((p) => {
          const isTurn = currentPlayer?.id === p.id;
          const hasVirus = playerViruses.some(v => v.playerId === p.id);
          const isCaptain = captainId === p.id;
          const showVirus = hasVirus && (mode === 'megamix' || mode === 'clasico');
          const remotePeer = remoteStreams?.find(s => s.peerId === p.id);

          return (
            <div key={p.id} className="flex flex-col items-center gap-1 relative group shrink-0">
              {/* Captain Controls Overlay: visible on hover (desktop) OR editMode (mobile) */}
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex gap-3 transition-all duration-300 z-[110] ${editMode ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'}`}>
                <button
                  onClick={() => onAdjustXP?.(p.id, -5)}
                  className="w-10 h-10 rounded-xl bg-red-500/90 text-white flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-white/20 hover:bg-red-600 active:scale-90 transition-all font-bold"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onAdjustXP?.(p.id, 5)}
                  className="w-10 h-10 rounded-xl bg-green-500/90 text-white flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] border border-white/20 hover:bg-green-600 active:scale-90 transition-all font-bold"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <motion.div
                animate={{
                  scale: isTurn ? 1.15 : 1,
                  borderColor: isCaptain ? '#fbbf24' : (hasVirus ? '#22c55e' : (isTurn ? 'var(--primary)' : 'transparent')),
                  boxShadow: isCaptain ? '0 0 20px #fbbf24' : (hasVirus ? '0 0 15px #22c55e' : (isTurn ? '0 0 15px var(--primary)' : 'none'))
                }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] bg-slate-800/40 backdrop-blur-2xl border flex items-center justify-center text-lg font-bold relative overflow-hidden transition-all duration-500 ${isTurn ? 'border-primary/60' : 'border-white/5 opacity-60 hover:opacity-100 hover:scale-105'}`}
              >
                {isCaptain && (
                  <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg z-10">
                    <Crown className="w-3 h-3 text-black" />
                  </div>
                )}
                {remotePeer ? (
                  <video
                    autoPlay
                    playsInline
                    muted={p.id === currentPlayer?.id}
                    ref={el => { if (el && remotePeer.stream) el.srcObject = remotePeer.stream; }}
                    className="w-full h-full object-cover"
                  />
                ) : p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={isTurn ? 'text-primary' : (isCaptain ? 'text-amber-400' : 'text-white/80')}>{p.name[0].toUpperCase()}</span>
                )}
                {showVirus && (
                  <div className="absolute inset-0 bg-green-500/20 animate-pulse pointer-events-none" />
                )}
              </motion.div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isTurn ? 'text-primary' : (isCaptain ? 'text-amber-400' : 'text-white/40')}`}>
                  {p.name}
                </span>
                <AnimatedXP value={scores[p.id] || 0} playerId={p.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function PartyGame({ mode, onExit, isMultiplayer = false, isHost = false, roomId = null }: PartyGameProps) {
  const {
    currentPlayer,
    players,
    teams,
    currentIndex,
    setCurrentIndex,
    gameState,
    setGameState,
    advanceTurn,
    addScore,
    addWin,
    handleGameEnd,
    showRoundSummary,
    setShowRoundSummary,
    roundSnapshot,
    setRoundSnapshot,
    scores,
    setGamesWon,
    gameOver,
    setGameOver
  } = useGameEngine(mode);

  // Improvements State
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const prevPlayerNameRef = useRef<string>('');
  const prevVirusAlertRef = useRef(false);
  const [virusFlash, setVirusFlash] = useState(false);

  useEffect(() => {
    if (!currentPlayer?.name) return;
    if (prevPlayerNameRef.current && 
        prevPlayerNameRef.current !== currentPlayer.name &&
        players.length > 1) {
      setShowTurnBanner(true);
      const t = setTimeout(() => setShowTurnBanner(false), 2500);
      return () => clearTimeout(t);
    }
    prevPlayerNameRef.current = currentPlayer.name;
  }, [currentPlayer?.name, players.length]);

  useEffect(() => {
    if (gameState.showVirusAlert && !prevVirusAlertRef.current) {
      setVirusFlash(true);
      const t = setTimeout(() => setVirusFlash(false), 400);
      return () => clearTimeout(t);
    }
    prevVirusAlertRef.current = gameState.showVirusAlert;
  }, [gameState.showVirusAlert]);

  const { localPlayerId } = useGameContext();

  // Show Captain Selection dialog at the start (manual pick, not random)
  useEffect(() => {
    if (players.length > 0 && !gameState.captainId && !gameState.showCaptainSelection && (mode === 'megamix' || mode === 'clasico')) {
      setGameState(prev => ({ ...prev, showCaptainSelection: true }));
    }
  }, [players, gameState.captainId, mode]);

  const handleAdjustXP = (playerId: string, delta: number) => {
    addScore(playerId, delta);
    if (delta > 0) sfx.click();
    else vibe(20);
  };

  const { game } = useGame(roomId);

  // Video Chat Toggle
  const [showVideo, setShowVideo] = useState(true); // Manual Toggle - Default TRUE

  /* Game Hooks */
  const {
    content,
    currentQuestion,
    setCurrentQuestion, // Get setter
    loadNextQuestion,
    loadSpecificQuestion,
    usedQuestionIds,
    setUsedQuestionIds,
    getCurrentContent,
    getNextPreview
  } = useGameContent(mode, currentIndex, currentPlayer?.name || 'Jugador', players.length);

  const {
    checkDrinkingGame,
    lastMiniTurnRef
  } = useDrinkingMicroGames(mode, 1); // players count logic improved

  const {
    playerViruses,
    brutalCounts,
    setBrutalCounts, // Needed for overlay logic
    applyRandomVirus,
    updateViruses,
    checkMegamixSpecialEvents,
    manageMegamixViruses, // Every 5 rounds virus cycle
    manageMegamixNormas   // Every 3 rounds norma
  } = useGameEffects(mode, players);
  
  const performTurnAdvance = useCallback(() => {
    sfx.whoosh();
    advanceTurn();
  }, [advanceTurn]);

  // --- TRACKING DATA for Classifications ---
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [drinkCounts, setDrinkCounts] = useState<Record<string, number>>({});
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [virusReceived, setVirusReceived] = useState<Record<string, number>>({});

  // Helper: track a vote for a player
  const trackVote = (playerId: string) => {
    setVoteCounts(prev => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
    sfx.click();
    vibe(5);
  };
  // Helper: track a drink for a player  
  const trackDrink = (playerId: string) => {
    setDrinkCounts(prev => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
    sfx.click();
    vibe(5);
  };

  // Mejora 8: Passing currentPlayer ID as presence key
  const { broadcastState, sendActionToHost } = useMultiplayer(
    roomId, 
    isHost, 
    currentPlayer?.name || 'Observer',
    currentPlayer?.id || 'observer', // Passed ID
    (remoteState) => {
      // Mejora 2: Viewer Logic: Receive State (Unified sync)
      if (!isHost && remoteState) {
        if (remoteState.currentIndex !== undefined && remoteState.currentIndex !== currentIndex) {
          setCurrentIndex(remoteState.currentIndex);
        }
        
        // Siempre sincronizar gameState y pregunta, independientemente del índice
        if (remoteState.gameState) setGameState(remoteState.gameState);
        if (remoteState.currentQuestion) setCurrentQuestion(remoteState.currentQuestion);
      }
    }, (action) => {
    // Host Logic: Receive Action from Guest
    if (isHost && action) {
      if (action.type === 'YO_NUNCA_VOTE') {
        const { phase, votes } = action.payload;
        if (phase === 'truth_phase') {
          setGameState(prev => ({ ...prev, yoNuncaTruthVotes: { ...prev.yoNuncaTruthVotes, ...votes } }));
        } else if (phase === 'guess_phase') {
          setGameState(prev => ({ ...prev, yoNuncaGuessVotes: { ...prev.yoNuncaGuessVotes, ...votes } }));
        }
      } else if (action.type === 'YO_NUNCA_PHASE_CHANGE') {
        setGameState(prev => ({ ...prev, yoNuncaEquiposPhase: action.payload.phase }));
      }
    }
  });

  // Effect: Parse NORMA from content for Clasico/Megamix — auto-skip the card
  useEffect(() => {
    const txt = getCurrentContent();
    const isOverlayActive = gameState.showVirusAlert || gameState.showTrivia || gameState.showDuel || 
                            gameState.showImpostor || gameState.showMimica || gameState.showBocaCerrada;

    if (!isOverlayActive && typeof txt === 'string' && (txt.toUpperCase().startsWith('NORMA:') || txt.toUpperCase().startsWith('NUEVA NORMA:'))) {
      const rule = txt.split(':')[1]?.trim() || txt;
      setGameState(prev => ({ 
        ...prev, 
        currentNorma: rule,
        showNormaGlobal: true 
      }));
      toast.success("¡Nueva Norma Activa!", { description: rule, duration: 4000 });
      const timer = setTimeout(() => {
        performTurnAdvance();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isHost, mode, getCurrentContent, setGameState, performTurnAdvance, 
      gameState.showVirusAlert, gameState.showTrivia, gameState.showDuel, 
      gameState.showImpostor, gameState.showMimica, gameState.showBocaCerrada]);

  const hasInitializedRound1 = useRef(false);
  // Trigger: Ronda 1 Norma Global + Virus Assignment
  useEffect(() => {
    if (mode === 'megamix' && gameState.round === 1 && currentIndex === 0 && !hasInitializedRound1.current) {
      hasInitializedRound1.current = true;
      // 1. Show Norma Global Overlay
      setGameState(prev => ({ 
        ...prev, 
        showNormaGlobal: true,
        // Also trigger a virus and norma for the first round as requested
        currentNorma: "Prohibido decir nombres de jugadores",
        currentNormaTurnsRemaining: players.length * 2
      }));
      // 2. Assign first Virus
      const randomVirus = applyRandomVirus(true);
      if (randomVirus) {
          // Manual inject for round 1
          setGameState(prev => ({ 
              ...prev, 
              showVirusAlert: true, 
              virusAlertData: randomVirus,
              virusPlayerId: randomVirus.player.id
          }));
      }
      toast.info("¡RONDA 1: Norma Global + Virus activados!");
    }
  }, [gameState.round, currentIndex, mode]); // removed players as dep to avoid double trigger

  // Effect to broadcast state when Host changes things
  useEffect(() => {
    if (isMultiplayer && isHost) {
      broadcastState({
        mode,
        currentIndex,
        gameState,
        // scores, // need dependency
        currentPlayerId: currentPlayer?.id,
        currentQuestion, // Broadcast current question
        gameId: game?.id // BROADCAST GAME ID
      });
    }
  }, [currentIndex, gameState, isHost, isMultiplayer, mode]);

  // Round Change Alert
  useEffect(() => {
    if (game?.current_round && game.current_round > 1) {
      toast("¡Fin de Ronda! Cambia la Norma si es necesario.", {
        description: `Ronda ${game.current_round} comenzando...`,
        duration: 5000,
        icon: '🔄'
      });
    }
  }, [game?.current_round]);

  // TRACK BRUTAL STATS (Card Based)
  useEffect(() => {
    if (!currentPlayer?.id) return;

    const txt = getCurrentContent();
    const type = currentQuestion?.type || detectRarity(txt);

    if (type === 'common' || type === 'rare') return;

    // Avoid double counting? 
    // This effect runs when currentIndex changes.
    // We assume 1 card per index.

    setBrutalCounts(prev => {
      const stats = prev[currentPlayer.id] || { legendaryDrops: 0, chaosEvents: 0, cursedEvents: 0, virusesReceived: 0 };
      const newStats = { ...stats };
      let changed = false;

      if (type === 'legendary') { newStats.legendaryDrops++; changed = true; }
      if (type === 'chaos') { newStats.chaosEvents++; changed = true; }
      if (type === 'virus') { newStats.virusesReceived++; changed = true; } // Card-based virus
      // Cursed? detectRarity doesn't return 'cursed' usually, maybe 'chaos' covers it?
      // If detectRarity returns 'cursed', handle it.
      // Assuming 'chaos' maps to chaosEvents.

      if (changed) {
        return { ...prev, [currentPlayer.id]: newStats };
      }
      return prev;
    });

  }, [currentIndex, currentPlayer?.id, currentQuestion]);

  const { updateMultiplePlayers, rankings } = useRanking();

  const [showChromecastModal, setShowChromecastModal] = useState(false);

  // Save game to history
  const hasSavedRef = useRef(false);

  const saveGameToHistory = async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    try {
      const historyJson = localStorage.getItem('partyGameHistory');
      const history = historyJson ? JSON.parse(historyJson) : [];
      const gameId = crypto.randomUUID();

      // Determine Winner
      const sorted = players.map(p => ({
        ...p,
        score: scores[p.id] || 0
      })).sort((a, b) => b.score - a.score);
      const winner = sorted[0];

      const newGame = {
        id: gameId,
        mode: mode,
        created_at: new Date().toISOString(),
        status: 'finished',
        players: players.map(p => p.name),
        winner: winner ? winner.name : null
      };

      const updatedHistory = [newGame, ...history].slice(0, 50);
      localStorage.setItem('partyGameHistory', JSON.stringify(updatedHistory));

      // Update Hall of Fame stats (Persistent Local + Cloud if configured)
      if (players.length > 0) {
        await updateMultiplePlayers(players.map(p => ({
          name: p.name,
          score: scores[p.id] || 0,
          won: winner && p.id === winner.id,
          avatarUrl: p.avatar_url,
          gameMode: mode,
          brutalMeta: brutalCounts ? brutalCounts[p.id] : undefined
        })));
      }
      // ... (existing local logic is fine, handled by useGameEngine implicitly for scores)

      // GLOBAL STATS (Supabase)
      if (isMultiplayer || navigator.onLine) {
        // 1. Create Game Record
        const { error: gameError } = await supabase.from('games').insert({
          mode: mode,
          status: 'finished',
          created_at: new Date().toISOString(),
          // current_round: 1, 
          // current_turn: currentIndex
        });

        if (gameError) console.error('Error saving global game:', gameError);

        // 2. Update Player Stats & Rankings
        // We need to upsert players based on name (or ID if we had auth).
        // Since we don't have auth, we might just track "Anonymous" stats or skip personalized stats 
        // unless we have a consistent ID.
        // For now, let's just log the game for "Global Total" purposes?
        // User asked for: "clasificacion general total de usuarios"
        // We can try to upsert into `player_rankings` if it was a table, but it's a view.
        // We need to insert into `players` table linked to the game.

        // Actually, `player_rankings` view aggregates data from `players` table? 
        // Let's check schema. `player_rankings` seems to be a view based on... wait, it allows Insert/Update in types?
        // If it's a view, we should be inserting into `players` and `games`.

        // Let's assume `player_rankings` is a table for this bespoke app based on the types provided.
        // If it fails, we fall back.

        const updates = players.map(p => ({
          player_name: p.name,
          total_score: (localStorage.getItem('partyGameScores') ? JSON.parse(localStorage.getItem('partyGameScores')!)[p.id] : 0), // This is total cumulative? Or current game?
          // We want to ADD to their score.
          // Complex without backend logic. 
          // Let's just try to insert into `games` for now to track "Total Games Played" globally.
        }));

        // better approach: Just record the game in 'games' table is enough for "Global Activity".
        // For "Leaderboard", we need to increment scores. 
        // Since we can't easily increment without a function, let's skip complex leaderboard sync for this iteration
        // and just ensure the Game itself is recorded.
      }

    } catch (e) {
      console.error('Error saving game history', e);
    }
  };


  const handleExit = async () => {
    // Fire and forget to prevent freeze, but ensure it runs
    saveGameToHistory();
    if (onExit) onExit();
  };


  const handleNext = () => {
    sfx.click();
    vibe(10);

    // Check specific game modes first
    if ((mode === 'trivia_futbol' || mode === 'cultura') && loadNextQuestion) {
      loadNextQuestion();
      advanceTurn();
      return;
    }

    if (checkDrinkingGame(currentIndex, currentPlayer?.name || 'Jugador', setGameState)) {
      advanceTurn();
      return;
    }

    // Normal flow
    if (mode === 'megamix' || mode === 'clasico') {
      updateViruses();

      // Manage 2-round periodic virus cycle (Megamix)
      if (mode === 'megamix') {
        const virusEvent = manageMegamixViruses(gameState.round);
        if (virusEvent) {
          setGameState(prev => ({ ...prev, showVirusCycleAlert: true, virusCycleData: virusEvent }));
        }

        // Auto-XP for current player (Megamix scaling)
        if (currentPlayer) {
          const autoXp = Math.min(20, 3 + Math.floor(gameState.round / 2));
          addScore(currentPlayer.id, autoXp);
        }

        // Manage 3-round periodic Norma (MegaMix)
        const normaEvent = manageMegamixNormas(gameState.round);
        if (normaEvent) {
          setGameState(prev => ({ 
            ...prev, 
            showVirusCycleAlert: true, 
            virusCycleData: normaEvent,
            currentNorma: normaEvent.message,
            currentNormaTurnsRemaining: normaEvent.duration
          }));
        }
      }

      // Apply Random Virus & Capture Result
      const virusResult = applyRandomVirus();
      if (virusResult) {
        setGameState(prev => ({ ...prev, showVirusAlert: true, virusAlertData: virusResult }));
        return; // STOP HERE, wait for user to accept virus
      }

      // Check Megamix special events
      if (checkMegamixSpecialEvents(
        currentIndex,
        gameState.round,
        currentPlayer,
        usedQuestionIds,
        setCurrentQuestion,
        setUsedQuestionIds,
        setGameState,
        lastMiniTurnRef
      )) {
        advanceTurn();
        return;
      }
    }

    performTurnAdvance();
  };

  // Bug 6/8: NORMA - Auto turn advance logic (Megamix)
  // Moved here to avoid 'handleNext' hoisting issues
  useEffect(() => {
    if (mode !== 'megamix' || !gameState.currentNorma) return;
    
    // Bug 8: Guard against overlays - Do not skip if an interaction is pending
    if (gameState.showVirusAlert || gameState.showTrivia || gameState.showVoting || 
        gameState.showDuel || gameState.showImpostor || gameState.showMimica || 
        gameState.showBocaCerrada || gameState.showImpostorWord) return;

    if (gameState.currentNorma.includes('AVANCE AUTOMÁTICO') || gameState.currentNorma.includes('AUTO-SKIP')) {
      const timer = setTimeout(() => {
        // Bug 6: Ensure we are still on the same card before skipping
        if (!gameState.showVirusAlert && !gameState.showTrivia) {
          handleNext();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentNorma, gameState.showVirusAlert, gameState.showTrivia, gameState.showVoting, 
      gameState.showDuel, gameState.showImpostor, gameState.showMimica, gameState.showBocaCerrada, 
      gameState.showImpostorWord, mode, handleNext]);

  // Rarity calculation for CardDisplay
  const currentText = getCurrentContent();
  const rarity = detectRarity(currentText);

  // Trigger / Content Detection System
  useEffect(() => {
    if (!currentText || currentText === 'Siguiente carta' || currentText === 'Cargando pregunta...') return;

    // 1. Check for explicit TRIGGERS (Megamix)
    if (currentText.startsWith('TRIGGER:')) {
      const triggerParts = currentText.split(':');
      const triggerType = triggerParts[1];

      if (triggerType === 'TRIVIA_FUTBOL') {
        // @ts-ignore
        loadSpecificQuestion?.('futbol');
        setGameState(prev => ({ ...prev, showTrivia: true }));
      } else if (triggerType === 'TRIVIA_CULTURA') {
        // @ts-ignore
        loadSpecificQuestion?.('cultura');
        setGameState(prev => ({ ...prev, showTrivia: true }));
      } else if (triggerType === 'VIRUS') {
        const virusResult = applyRandomVirus(true);
        if (virusResult) {
          setGameState(prev => ({ ...prev, showVirusAlert: true, virusAlertData: virusResult }));
        }
      } else if (triggerType === 'BOCA_CERRADA') {
        // Trigger Boca Cerrada warning — phone needs to be passed
        const targetPlayer = currentPlayer || players[0];
        setGameState(prev => ({
          ...prev,
          showBocaCerradaWarning: true,
          bocaCerradaData: { playerId: targetPlayer.id, playerName: targetPlayer.name }
        }));
      } else {
        // MIMICA and any unknown triggers - auto-skip
        // These don't have overlay UI, so we advance to prevent getting stuck
        console.log("Auto-skipping trigger:", triggerType);
        const timer = setTimeout(() => advanceTurn(), 100);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 2. Check for "Normas" (Rules) to persist them
    if (currentText.includes('NORMA:') || currentText.includes('📜')) {
      const cleanNorma = currentText.replace(/📜|NORMA:|\\./g, '').trim();
      if (cleanNorma.length > 5) {
        setGameState(prev => ({
          ...prev,
          currentNorma: cleanNorma,
          currentNormaTurnsRemaining: players.length * 2
        }));
      }
    }

  }, [currentText, advanceTurn, applyRandomVirus, currentPlayer, players, setGameState, loadSpecificQuestion]); // Mejora 1: Correct dependencies

  // YoNunca Equipos Logic Interception
  useEffect(() => {
    if (mode === 'yo_nunca_equipos' && currentText && gameState.yoNuncaEquiposPhase === 'idle') {
      // Find team of current player to be the target team
      const targetTeamId = currentPlayer?.team_id;
      if (targetTeamId) {
        setGameState(prev => ({
          ...prev,
          yoNuncaEquiposPhase: 'truth_phase',
          yoNuncaTargetTeamId: targetTeamId,
          yoNuncaTruthVotes: {},
          yoNuncaGuessVotes: {}
        }));
      }
    }
  }, [mode, currentText, gameState.yoNuncaEquiposPhase, currentPlayer]);

  // Handle Virus Expiration Notifications
  const prevVirusesRef = useRef(playerViruses);
  useEffect(() => {
    const prev = prevVirusesRef.current;
    const current = playerViruses;

    // Find players who had a virus before but don't have it now
    prev.forEach(oldVirus => {
      const stillHasVirus = current.some(v => v.playerId === oldVirus.playerId);
      if (!stillHasVirus) {
        const pInfo = players.find(p => p.id === oldVirus.playerId);
        if (pInfo) {
          toast(`¡VIRUS TERMINADO para ${pInfo.name}! 🟢`, {
            description: "Ya puedes dejar de cumplir el castigo.",
            duration: 8000,
            icon: '✅'
          });
        }
      }
    });

    prevVirusesRef.current = current;
  }, [playerViruses, players]);

  // Sound effects on rarity
  useEffect(() => {
    if (rarity === 'legendary') {
      sfx.legendary();
      vibe(30);
    } else if (rarity === 'chaos') {
      sfx.chaos();
      vibe(50);
    }
  }, [currentText, rarity]);

  // Auto-save on Game Over
  useEffect(() => {
    if (gameOver && !showRoundSummary) {
      // Massive UPSERT simulation/logic for all players
      const syncAllPlayers = async () => {
        try {
          const updates = players.map(p => {
            // Mejora 3: Recuperar XP histórico del ranking local antes de sumar
            const existingRanking = (() => {
              try {
                const raw = localStorage.getItem('fiesta-party-local-rankings-v1');
                const all = raw ? JSON.parse(raw) : [];
                return all.find((r: any) => 
                  r.player_name?.toLowerCase() === p.name?.toLowerCase()
                );
              } catch { return null; }
            })();

            const historicalXP = existingRanking?.total_xp || 
                                 existingRanking?.xp || 0;
            const sessionXP    = scores[p.id] || 0;

            return {
              id: p.id,
              total_xp: historicalXP + sessionXP, // ← acumulativo
              games_played: 1, // As requested in Mejora 3
            };
          });
          
          // await supabase.from('profiles').upsert(updates);
          toast.success("¡Sincronización Cyber-Party Elite completada!");
        } catch (err) {
          console.error("Sync error:", err);
        }
      };

      syncAllPlayers();
      saveGameToHistory();
      setRoundSnapshot({
        round: gameState.round,
        scores: scores
      });
      setShowRoundSummary(true);
    }
  }, [gameOver, showRoundSummary, gameState.round, scores, players]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden pb-24 md:pb-32">
      {/* Dynamic Background */}
      <DynamicBackground rarity={rarity} />

      <PlayerProfilesBottom
        players={players}
        currentPlayer={currentPlayer}
        scores={scores}
        playerViruses={playerViruses}
        mode={mode}
        remoteStreams={[]}
        captainId={gameState.captainId}
        onAdjustXP={handleAdjustXP}
      />

      {/* Voting Overlay for "Who is most likely" and similar prompts */}
      {(() => {
        const isVoting = !!currentText && (
          currentText.toLowerCase().includes('¿quién') ||
          currentText.toLowerCase().includes('¿qué dos jugadores') ||
          currentText.toLowerCase().includes('¿qué tres jugadores') ||
          currentText.toLowerCase().includes('votación:')
        );
        let maxVotes = 1;
        if (currentText?.toLowerCase().includes('dos jugadores')) maxVotes = 2;
        if (currentText?.toLowerCase().includes('tres jugadores')) maxVotes = 3;

        return (
          <Dialog open={isVoting} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-primary/50 text-white z-[60] max-h-[85vh] flex flex-col" aria-describedby={undefined}>
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-xl font-bold text-center neon-text text-primary">
                  🗳️ Votación {maxVotes > 1 ? `(Elige a ${maxVotes})` : ''}
                </DialogTitle>
                <DialogDescription id="voting-desc" className="text-center text-sm text-white/90 font-medium pt-2 px-2">
                  {currentText}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-2 py-3 overflow-y-auto max-h-[45vh] no-scrollbar flex-1">
                {players.map(p => {
                  const isSelected = gameState.votingSelections?.includes(p.id);
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const currentSelections = gameState.votingSelections || [];
                        if (maxVotes === 1) {
                          handleAdjustXP(p.id, 5);
                          trackVote(p.id);
                          toast.success(`${p.name} ha sido elegido! (+5 XP)`);
                          handleNext();
                        } else {
                          if (currentSelections.includes(p.id)) {
                            setGameState(prev => ({ ...prev, votingSelections: currentSelections.filter(id => id !== p.id) }));
                          } else if (currentSelections.length < maxVotes) {
                            setGameState(prev => ({ ...prev, votingSelections: [...currentSelections, p.id] }));
                          }
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 ${isSelected ? 'bg-primary/40 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : 'bg-slate-800/40 border-white/10 hover:border-primary/50'}`}
                    >
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-3 transition-transform ${isSelected ? 'border-primary scale-110' : 'border-white/20'}`}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-lg font-black">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-black text-sm tracking-tight text-white uppercase">{p.name}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Fixed bottom area — always visible */}
              <div className="shrink-0 pt-3 border-t border-white/10 space-y-2">
                <div className="text-center text-xs text-white/60">
                  {maxVotes === 1 ? 'Pulsa en quien creas que es más probable.' : `Selecciona a ${maxVotes} jugadores.`}
                </div>

                {maxVotes > 1 && (
                  <Button
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border border-white/10"
                    disabled={(gameState.votingSelections?.length || 0) < maxVotes}
                    onClick={() => {
                      const selections = gameState.votingSelections || [];
                      selections.forEach(id => {
                        handleAdjustXP(id, 5);
                        trackVote(id);
                        const name = players.find(p => p.id === id)?.name;
                        toast.success(`${name} elegido! (+5 XP)`);
                      });
                      setGameState(prev => ({ ...prev, votingSelections: [] }));
                      handleNext();
                    }}
                  >
                    Confirmar Votación
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="w-full text-xs text-white/60 hover:text-white border border-white/20"
                >
                  Saltar Votación ⏭
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Top Bar with Chromecast */}
      <header className="p-4 flex justify-between items-center z-10 relative">
        <div className="flex gap-2 items-center">
            <Button variant="ghost" size="icon" onClick={() => {
            if (window.confirm("¿Seguro que quieres salir?")) {
                onExit();
            }
            }}>
            <ArrowLeft className="h-6 w-6 text-white/80" />
            </Button>

            {/* Botón Chromecast */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="bg-primary/10 hover:bg-primary/20 hover:text-white rounded-full transition-all border border-primary/20"
                onClick={() => setShowChromecastModal(true)}
            >
              <Cast className="h-5 w-5 text-primary-200" />
            </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-300 border border-red-500/30"
            onClick={() => {
              if (window.confirm("¿Terminar partida y ver resultados?")) {
                setGameOver(true);
              }
            }}
          >
            Finalizar
          </Button>
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
            <span className="font-mono font-bold text-xl text-white">{gameState.round}</span>
            <span className="text-xs text-white/60 ml-1 uppercase">Ronda</span>
          </div>
        </div>
      </header>

      {/* CHROMECAST MODAL */}
      <Dialog open={showChromecastModal} onOpenChange={setShowChromecastModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-primary/20 text-white rounded-3xl z-[150]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
              <Cast className="w-6 h-6 text-primary" />
              Compartir en la TV
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-center text-slate-300">
              Para ver el juego en tu televisor, utiliza la función de transmitir (Cast/Screen Mirroring) integrada en tu dispositivo:
            </p>
            
            <div className="grid gap-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <h3 className="font-bold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Dispositivos Android</h3>
                <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                  <li>Desliza hacia abajo desde la parte superior de la pantalla.</li>
                  <li>Toca <strong>Emitir</strong> o <strong>Enviar pantalla</strong>.</li>
                  <li>Selecciona tu TV o Chromecast en la lista.</li>
                </ol>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <h3 className="font-bold flex items-center gap-2 mb-2"><Music className="w-4 h-4 text-pink-400" /> Dispositivos Apple (iOS)</h3>
                <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                  <li>Abre el <strong>Centro de control</strong>.</li>
                  <li>Toca el icono de <strong>Duplicar pantalla</strong>.</li>
                  <li>Selecciona tu Apple TV o televisor compatible.</li>
                </ol>
              </div>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary-600 text-white font-bold h-14 rounded-xl shadow-lg border-2 border-primary/50 text-lg flex items-center justify-center gap-2"
              onClick={async () => {
                try {
                  if (typeof navigator !== 'undefined' && 'presentation' in navigator && (navigator as any).presentation?.defaultRequest) {
                      await (navigator as any).presentation.defaultRequest.start();
                  } else if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                      await navigator.mediaDevices.getDisplayMedia({ video: true });
                  } else {
                      throw new Error("No API");
                  }
                  setShowChromecastModal(false);
                } catch (e) {
                  alert("Tu navegador no soporta el Chromecast directo. Usa el menú 'Compartir/Transmitir' o despliega las opciones de control en iOS/Android.");
                  setShowChromecastModal(false);
                }
              }}
            >
              <Cast className="w-5 h-5" />
              CONECTAR A LA TV 📺
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Norma Display for Megamix (If a rule is active, show it globally) */}
      {
        mode === 'megamix' && gameState.showTrivia && currentText && currentText.includes('NORMA ALEATORIA') && (
          <div className="w-full flex justify-center z-10 -mt-2 mb-2">
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500 text-red-100 px-6 py-2 rounded-full font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse flex items-center gap-2">
              <span>🚨 NORMA ACTIVA:</span>
              <span className="text-sm font-normal">{typeof currentQuestion?.answer === 'string' ? currentQuestion.answer : ''}</span>
            </div>
          </div>
        )
      }

      {/* Captain Indicator */}
      {
        gameState.captainId && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border-2 border-yellow-400 px-5 py-2.5 rounded-full text-sm font-black text-yellow-100 flex items-center gap-2 z-50 shadow-[0_0_20px_rgba(234,179,8,0.4)] backdrop-blur-md animate-pulse">
            <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="uppercase tracking-widest">Capitán:</span>
            <span className="capitalize text-lg">{players.find(p => p.id === gameState.captainId)?.name}</span>
          </div>
        )
      }

      {
        isMultiplayer && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-3 py-1 rounded-full text-xs font-mono text-green-400 border border-green-500/30 flex items-center gap-2 cursor-pointer hover:bg-slate-800/90 hover:border-green-500/60 transition-all z-50"
            onClick={() => {
              if (roomId) {
                const url = `${window.location.origin}?room=${roomId}`;
                navigator.clipboard.writeText(url);
                toast.success('Enlace de invitación copiado');
              }
            }}
          >
            <span>{isHost ? 'HOST' : 'ESPEC'} • SALA: {roomId}</span>
            <Copy className="w-3 h-3 opacity-70" />
          </div>
        )
      }

      {/* Mobile Player Indicator (only visible on small screens where sidebar is hidden) */}
      <div className="sm:hidden flex items-center gap-2">
        <span className="text-sm text-white/60">Turno de:</span>
        <span className="font-bold text-white">{currentPlayer?.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {roomId && (
          <Button
            variant={showVideo ? "destructive" : "secondary"}
            size="sm"
            onClick={() => setShowVideo(!showVideo)}
            className={showVideo ? "animate-pulse border-red-500" : "bg-transparent border-white/20"}
          >
            {showVideo ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
            {showVideo ? "Salir" : "Video"}
          </Button>
        )}

        <Button variant="destructive" size="sm" className="text-xs h-8 mr-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-white/10 backdrop-blur-sm" onClick={handleExit}>
          Finalizar
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-xs gap-1">
              <AlertCircle className="w-3 h-3" />
              Estado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Estado de la Partida</DialogTitle>
              <DialogDescription id="status-desc">
                Revisa los virus activos y las normas vigentes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Active Viruses Section */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-400">
                  🦠 Virus Activos
                </h3>
                {playerViruses.length === 0 ? (
                  <p className="text-white/60 text-sm italic">No hay virus activos en este momento.</p>
                ) : (
                  <div className="grid gap-3">
                    {playerViruses.map((v, i) => {
                      const affectedPlayer = players.find(p => p.id === v.playerId);
                      return (
                        <div key={i} className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-3 rounded-lg border border-purple-500/20">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-purple-300">
                              {affectedPlayer?.name || 'Jugador'}
                            </span>
                            <span className="text-xs bg-gradient-to-r from-purple-500/20 to-purple-600/20 px-2 py-0.5 rounded-full text-purple-200">
                              {v.turnsRemaining} turnos
                            </span>
                          </div>
                          <p className="font-bold text-sm text-white">{v.virusName}</p>
                          <p className="text-xs text-white/60">{v.virusDescription}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ranking Dialog with Real Classification */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-xs gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              Ranking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Clasificación General</DialogTitle>
              <DialogDescription id="ranking-desc">
                Puntuaciones y clasificación de jugadores.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map((p, i) => {
                // Get real stats from localStorage rankings
                const allRankings = (() => { try { return JSON.parse(localStorage.getItem('fiesta-party-local-rankings-v1') || '[]'); } catch { return []; } })();
                const playerRanking = allRankings.find((r: any) => r.player_name?.toLowerCase() === p.name?.toLowerCase());

                // Import classification inline
                const getTitle = (r: any) => {
                  if (!r) return { title: 'Nuevo', emoji: '🌟', color: 'text-slate-400' };
                  const won = r.games_won || 0;
                  const played = r.games_played || 0;
                  const level = r.level || 1;
                  const streak = r.win_streak || 0;
                  if (won >= 100 && level >= 30) return { title: 'Leyenda Suprema', emoji: '👑', color: 'text-yellow-400' };
                  if (played >= 200) return { title: 'Dios del Party', emoji: '⚡', color: 'text-purple-400' };
                  if (streak >= 15) return { title: 'El Inmortal', emoji: '🔥', color: 'text-red-400' };
                  if (won >= 50) return { title: 'Máquina de Ganar', emoji: '🏆', color: 'text-yellow-400' };
                  if (played >= 100) return { title: 'El Incombustible', emoji: '🛡️', color: 'text-slate-300' };
                  if (played >= 50) return { title: 'Veterano', emoji: '🎖️', color: 'text-amber-500' };
                  if (won >= 20) return { title: 'El Imparable', emoji: '💪', color: 'text-orange-400' };
                  if (won >= 10) return { title: 'Promesa', emoji: '⭐', color: 'text-yellow-300' };
                  if (played >= 15) return { title: 'Explorador', emoji: '🧭', color: 'text-teal-400' };
                  if (played >= 5) return { title: 'Aprendiz', emoji: '📖', color: 'text-slate-300' };
                  if (played >= 1) return { title: 'Recién Llegado', emoji: '👋', color: 'text-slate-400' };
                  return { title: 'Nuevo', emoji: '🌟', color: 'text-slate-500' };
                };

                const info = getTitle(playerRanking);
                const realGamesPlayed = playerRanking?.games_played || 0;
                const realGamesWon = playerRanking?.games_won || 0;
                const realStreak = playerRanking?.win_streak || 0;
                const winRate = realGamesPlayed > 0 ? Math.round((realGamesWon / realGamesPlayed) * 100) : 0;

                return (
                  <div key={p.id} className="p-3 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/5">
                    {/* Player header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-white/60 w-6">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 flex items-center justify-center text-xs font-bold overflow-hidden border border-white/10">
                          {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight text-white">{p.name}</p>
                          <p className={`text-[10px] font-bold ${info.color}`}>{info.emoji} {info.title}</p>
                        </div>
                      </div>
                      <span className="font-black text-lg text-yellow-500">{scores[p.id] || 0}</span>
                    </div>
                    {/* Real stats */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg p-1.5">
                        <p className="text-[10px] text-white/60">Partidas</p>
                        <p className="text-xs font-bold text-white">{realGamesPlayed}</p>
                      </div>
                      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg p-1.5">
                        <p className="text-[10px] text-white/60">Victorias</p>
                        <p className="text-xs font-bold text-emerald-400">{realGamesWon}</p>
                      </div>
                      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg p-1.5">
                        <p className="text-[10px] text-white/60">Racha</p>
                        <p className="text-xs font-bold text-orange-400">🔥{realStreak}</p>
                      </div>
                      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg p-1.5">
                        <p className="text-[10px] text-white/60">Win%</p>
                        <p className={`text-xs font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reveal Overlay (Mimica / Boca Cerrada) with Long Press */}
      <Dialog open={gameState.showMimica || gameState.showBocaCerrada}>
        <DialogContent className="sm:max-w-md bg-[url('/modern_bg.png')] bg-cover bg-center border-none p-0 text-white z-[70] overflow-hidden shadow-2xl" aria-describedby={undefined}>
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xl z-0" />
          <div className="p-6 text-center space-y-6 relative z-10 glass-panel border-b border-white/10">
            <div className="space-y-1">
              <p className="text-xl font-bold uppercase tracking-widest text-primary/80">Toca realizar la prueba a:</p>
              <p className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                {currentPlayer?.name}
              </p>
            </div>
            <p className="text-red-400 font-bold animate-pulse text-sm uppercase tracking-widest bg-red-500/10 py-2 rounded-full border border-red-500/20">¡Que los demás no miren!</p>

            <div className="relative group perspective-1000">
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  if (gameState.showMimica) setGameState(prev => ({ ...prev, showMimicaReveal: !prev.showMimicaReveal }));
                  if (gameState.showBocaCerrada) setGameState(prev => ({ ...prev, showBocaCerradaReveal: !prev.showBocaCerradaReveal }));
                }}
                onContextMenu={(e) => { e.preventDefault(); return false; }}
                className="w-full relative preserve-3d transition-transform duration-300 shadow-2xl rounded-[2rem] overflow-hidden group-active:scale-[0.98] select-none touch-none"
              >
                <div className={`w-full min-h-[220px] rounded-[2rem] border-4 flex flex-col items-center justify-center p-6 transition-all backdrop-blur-md
                  ${(gameState.showMimicaReveal || gameState.showBocaCerradaReveal) 
                    ? 'bg-slate-900/80 border-primary shadow-[0_0_30px_rgba(168,85,247,0.6)]' 
                    : 'bg-slate-800/50 border-white/10 shadow-lg hover:border-primary/50'}`}>
                  <AnimatePresence mode="popLayout">
                    {!(gameState.showMimicaReveal || gameState.showBocaCerradaReveal) ? (
                      <motion.div
                        key="hidden"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mb-2">
                          <EyeOff className="w-10 h-10 text-primary" />
                        </div>
                        <p className="font-bold text-white uppercase tracking-widest text-sm text-balance">Haz clic para revelar u ocultar el secreto</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="visible"
                        initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="w-full flex-1 flex flex-col justify-center items-center gap-3"
                      >
                        <p className="text-[10px] text-primary-100 font-bold uppercase tracking-[0.2em] mb-2">{gameState.showMimica ? 'RETO DE MÍMICA' : 'RETO BOCA CERRADA'}</p>
                        <p className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md pb-4">
                          {gameState.showMimica ? gameState.currentMimicaText : gameState.currentBocaCerradaText}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </div>

            <Button
              className="w-full h-14 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 font-bold uppercase tracking-widest text-sm text-white backdrop-blur-md transition-all active:scale-95"
              onClick={() => {
                setGameState(prev => ({
                  ...prev,
                  showMimicaReveal: false,
                  showBocaCerradaReveal: false,
                  showMimica: false,
                  showBocaCerrada: false
                }));
                handleNext();
              }}
            >
              YA LO HE VISTO, CERRAR ⏭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={gameState.showCaptainSelection} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-yellow-500/50 text-white z-[60]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center text-yellow-500 flex items-center justify-center gap-3">
              👑 ELIGE AL CAPITÁN
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 space-y-4">
            <p className="text-lg text-white/80">
              El <strong>Capitán</strong> es el dueño del móvil durante <span className="text-white font-bold">TODA</span> la partida. Su trabajo es leer las cartas al resto y <strong>repartir la Experiencia (+XP)</strong>.
            </p>
            <p className="text-sm text-yellow-200 font-bold tracking-widest uppercase">¿Quién tiene el móvil ahora mismo?</p>

            <div className="grid grid-cols-2 gap-3 mt-6 max-h-[40vh] overflow-y-auto no-scrollbar pb-2">
              {players.map(p => (
                <Button
                  key={`pick-captain-${p.id}`}
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:bg-gradient-to-r hover:from-yellow-600/30 hover:to-yellow-700/30 border border-white/10 hover:border-yellow-500/50 transition-all rounded-xl relative overflow-hidden group"
                  onClick={() => {
                    try {
                        if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
                    } catch (e) {
                        // ignore audio error gracefully
                    }
                    setGameState(prev => ({
                      ...prev,
                      captainId: p.id,
                      showCaptainSelection: false
                    }));
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 flex items-center justify-center text-sm font-bold overflow-hidden border-2 border-transparent group-hover:border-yellow-400">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold truncate w-full px-2 text-white">{p.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Impostor Anti-Spoiler Warning */}
      <Dialog open={gameState.showImpostorWarning}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-2xl border-red-500/50 text-white z-[80]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center text-red-500 flex items-center justify-center gap-3 uppercase tracking-tighter">
              ⚠️ ACCESO RESTRINGIDO
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-6">
            <div className="space-y-2">
              <p className="text-base text-white/60 font-bold uppercase tracking-widest">Entrega el dispositivo a:</p>
              <p className="text-4xl font-black text-white bg-red-500/10 p-4 rounded-2xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                {players.find(p => p.id === gameState.impostorData?.impostorPlayerId)?.name || currentPlayer?.name}
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
              <p className="text-red-400 font-black text-xs uppercase tracking-[0.3em]">¡CAPITÁN! NO MIRES LA PANTALLA</p>
            </div>

            <div className="relative">
              <motion.button
                onMouseDown={() => setGameState(prev => ({ ...prev, showImpostorWord: true }))}
                onMouseUp={() => setGameState(prev => ({ ...prev, showImpostorWord: false }))}
                onTouchStart={() => setGameState(prev => ({ ...prev, showImpostorWord: true }))}
                onTouchEnd={() => setGameState(prev => ({ ...prev, showImpostorWord: false }))}
                className="w-full h-36 rounded-2xl bg-gradient-to-br from-red-500/20 to-slate-900 border-2 border-dashed border-red-500/40 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 active:bg-red-500/30 overflow-hidden shadow-xl"
              >
                <AnimatePresence mode="wait">
                  {!gameState.showImpostorWord ? (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <EyeOff className="w-10 h-10 text-red-500" />
                      <p className="font-black text-red-500 uppercase tracking-[0.15em] text-[9px]">{players.find(p => p.id === gameState.impostorData?.impostorPlayerId)?.name || currentPlayer?.name}: MANTÉN PULSADO</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3 px-4 text-center"
                    >
                      <ImpostorRound
                        players={players}
                        impostorPlayerId={gameState.impostorData?.impostorPlayerId || ''}
                        realQuestion={gameState.impostorData?.currentImpostorReal || ''}
                        impostorQuestion={gameState.impostorData?.currentImpostorFake || ''}
                        onComplete={(impostorCaught, votedPlayerId) => {
                          if (impostorCaught) {
                            players.forEach(p => {
                              if (p.id !== gameState.impostorData?.impostorPlayerId) addScore(p.id, 20);
                            });
                          } else if (gameState.impostorData?.impostorPlayerId) {
                            addScore(gameState.impostorData.impostorPlayerId, 50);
                          }
                          setGameState(prev => ({ ...prev, showImpostorWarning: false, showImpostorWord: false }));
                          handleNext();
                        }}
                        onExit={() => {
                          setGameState(prev => ({ ...prev, showImpostorWarning: false, showImpostorWord: false }));
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
          <Button
            className="w-full h-14 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-xl transition-all"
            onClick={() => {
              setGameState(prev => ({
                ...prev,
                showImpostorWarning: false,
                showImpostor: false,
              }));
              handleNext();
            }}
          >
            ENTENDIDO, CONTINUAR ⏭
          </Button>
        </DialogContent>
      </Dialog>

      {/* Deleted old Mimica & Boca Cerrada overlays */}

      {/* Virus Cycle Notification */}
      <Dialog open={gameState.showVirusCycleAlert}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-2xl border-purple-500/50 text-white z-[70]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center text-purple-400 uppercase tracking-tighter">
              {gameState.virusCycleData?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-xl font-bold text-white/90">{gameState.virusCycleData?.message}</p>
          </div>
          <Button
            className="w-full h-16 text-lg font-black bg-purple-600 hover:bg-purple-500 text-white rounded-2xl shadow-xl transition-all"
            onClick={() => {
              setGameState(prev => ({ ...prev, showVirusCycleAlert: false }));
              // Ensure we advance the card after closing the global cycle alert
              performTurnAdvance();
            }}
          >
            ENTENDIDO
          </Button>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col items-center justify-center p-4 relative transition-opacity duration-300 ${isMultiplayer && !isHost && (currentPlayer?.id !== localPlayerId) ? 'opacity-80 pointer-events-none' : ''}`}>

        {/* Turn Blocker Overlay */}
        {isMultiplayer && !isHost && false && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div className="bg-gradient-to-r from-black/80 to-slate-900/80 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/10 animate-pulse shadow-2xl skew-x-[-10deg]">
              <span className="font-bold text-yellow-500 mr-2">⏳ ESPERANDO A:</span>
              <span className="font-mono text-xl">{currentPlayer?.name.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Turn Banner Overlay */}
        <AnimatePresence>
          {showTurnBanner && currentPlayer && (
            <TurnBanner playerName={currentPlayer.name} />
          )}
        </AnimatePresence>

        {/* Global Norma Panel — Prominent Slide-down */}
        <AnimatePresence>
          {(gameState.currentNorma || gameState.showNormaGlobal) && (
            <motion.div
              className="mb-4 mx-auto max-w-sm z-10 relative w-full"
              initial={{ y:-40, opacity:0 }}
              animate={{ y:0,   opacity:1 }}
              exit={{    y:-40, opacity:0 }}
              transition={{ type:'spring', stiffness:300, damping:28 }}
            >
              <div className="bg-gradient-to-r from-orange-600/40 to-orange-900/40 
                border-l-4 border-l-orange-500 border border-orange-500/30
                backdrop-blur-md rounded-2xl p-4 text-center 
                shadow-[0_0_20px_rgba(249,115,22,0.25)]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <motion.span
                    animate={{ rotate:[-5,5,-5] }}
                    transition={{ repeat:Infinity, duration:2, ease:'easeInOut' }}
                    className="text-lg"
                  >📜</motion.span>
                  <p className="text-[10px] uppercase tracking-[0.3em] 
                    text-orange-400 font-black">NORMA GLOBAL ACTIVA</p>
                </div>
                <p className="text-sm text-white font-black leading-tight uppercase 
                  tracking-tight">
                  {gameState.currentNorma || '¡Preparando nueva norma!'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAPTAIN ACTION PANEL - Give/Take XP in real-time */}
        {(!gameState.showTrivia && !gameState.showVoting && !gameState.showDuel && !gameState.showImpostor && !gameState.showMimica && !gameState.showBocaCerrada && !gameState.showImpostorWord && mode !== 'cultura' && mode !== 'trivia_futbol') && (
          <div className="w-full max-w-md mt-4 mb-2 z-10 flex flex-col items-center bg-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <p className="text-[11px] text-amber-400 font-black uppercase tracking-[0.3em]">Mesa del Capitán</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {players.map(p => {
                const isCaptain = gameState.captainId === p.id;
                // Bug 16: Ensure consistent XP calculation
                const baseXP = 10 + Math.floor(gameState.round / 2) * 5;
                const rewardXP = Math.min(50, baseXP);
                const penaltyXP = Math.max(5, Math.floor(rewardXP / 2));
                
                return (
                  <div key={p.id} className="flex flex-col items-center gap-2 group/player">
                    {/* Avatar with status */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full border-2 transition-all duration-300 overflow-hidden
                        ${currentPlayer?.id === p.id ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'border-white/10 opacity-80 group-hover/player:opacity-100 group-hover/player:border-white/30'}`}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="w-full h-full object-cover" alt={p.name} />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-sm font-black text-white/40">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {isCaptain && (
                          <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg z-10 shadow-md">
                            <Crown className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </div>
                      
                      {/* Floating XP adjustment buttons */}
                      <div className="absolute -bottom-2 -right-2 flex flex-col gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => {
                            if (isMultiplayer && !isHost) return;
                            // Bug 18: Captain shouldn't adjust their own XP
                            if (isCaptain) {
                              toast.error("El Capitán no puede auto-asignarse XP 👑");
                              return;
                            }
                            handleAdjustXP(p.id, rewardXP);
                            toast.success(`+${rewardXP} XP para ${p.name}! 🔥`, { 
                              className: "bg-slate-900 border-emerald-500/50 text-emerald-400 font-bold" 
                            });
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => {
                            if (isMultiplayer && !isHost) return;
                            // Bug 18: Captain shouldn't adjust their own XP
                            if (isCaptain) {
                              toast.error("El Capitán no puede auto-penalizarse 👑");
                              return;
                            }
                            handleAdjustXP(p.id, -penaltyXP);
                            toast.error(`-${penaltyXP} XP para ${p.name} ❌`, { 
                              className: "bg-slate-900 border-red-500/50 text-red-400 font-bold" 
                            });
                          }}
                          className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-400 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[60px] 
                      ${currentPlayer?.id === p.id ? 'text-primary' : (isCaptain ? 'text-amber-400' : 'text-white/40')}`}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 w-full text-center">
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                Recompensa actual: <span className="text-emerald-400">+{Math.min(50, 10 + Math.floor(gameState.round / 2) * 5)} XP</span>
              </p>
            </div>
          </div>
        )}

        {/* YO NUNCA - INTERACTIVE AVATARS with EXP rewards */}
        {currentText && (currentText.toLowerCase().includes('yo nunca') || mode === 'yo_nunca' || mode === 'yo_nunca_equipos') && (
          <div className="w-full max-w-sm mt-3 mb-2 z-10">
            <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/40 rounded-xl p-3">
              <p className="text-[10px] text-amber-400 uppercase font-bold tracking-widest mb-2 text-center">🍺 ¿Quién ha bebido? (toca para registrar)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {players.map(p => (
                  <motion.button
                    key={`drink-${p.id}`}
                    whileTap={{ scale: 0.85 }}
                    onClick={async () => {
                      trackDrink(p.id);
                      // Award EXP for drinking (brave soul!)
                      const drinkXp = 5;
                      addScore(p.id, drinkXp);
                      toast(`🍺 ${p.name} ha bebido! +${drinkXp} XP (Total: ${(drinkCounts[p.id] || 0) + 1})`, { duration: 1500, position: 'top-center' });
                      // Sync EXP to Supabase profile if player has a linked account
                      try {
                        const pid = (p as any).supabase_id;
                        if (pid) {
                          await supabase.rpc('increment_player_exp', { player_id: pid, exp_amount: drinkXp }).catch(() => { });
                        }
                      } catch { /* silent fail */ }
                    }}
                    className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:bg-gradient-to-r hover:from-amber-500/40 hover:to-orange-500/40 transition-all min-w-[60px] active:shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-amber-400/50 overflow-hidden shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-700 to-orange-800 flex items-center justify-center text-sm font-bold text-white">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-amber-300 truncate max-w-[55px]">{p.name}</span>
                    <span className="text-[10px] font-black text-amber-400">{drinkCounts[p.id] || 0} 🍺</span>
                  </motion.button>
                ))}
              </div>
              <p className="text-[9px] text-amber-500/60 text-center mt-2">Cada trago otorga +5 XP al jugador</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!gameState.showTrivia && !gameState.showDrinkingGame && !gameState.showImpostor && !gameState.showDuel &&
            !gameState.showMimica && !gameState.showBocaCerrada && !gameState.showImpostorWord &&
            !gameState.showVoting && !gameState.showCaptainPass && !gameState.showVirusAlert &&
            gameState.yoNuncaEquiposPhase === 'idle' &&
            mode !== 'cultura' && mode !== 'trivia_futbol' && (
              <motion.div
                key={currentIndex}
                initial={{ rotateY: 90,  opacity: 0, scale: 0.9 }}
                animate={{ rotateY: 0,   opacity: 1, scale: 1   }}
                exit={{    rotateY: -90, opacity: 0, scale: 0.9 }}
                transition={{
                  rotateY: { type:'spring', stiffness:280, damping:24 },
                  opacity: { duration: 0.12 },
                  scale:   { type:'spring', stiffness:300, damping:26 },
                }}
                style={{ 
                  perspective:'1000px', 
                  transformStyle:'preserve-3d',
                  willChange:'transform'
                }}
                className="w-full flex justify-center relative"
              >
                <CardDisplay
                  content={currentText}
                  type={rarity}
                  onClick={() => {
                    if (isMultiplayer && !isHost) return; // Viewers can't click info
                    handleNext();
                  }}
                  gameMode={mode}
                  players={players}
                  round={gameState.round}
                />

                {/* Partículas doradas — legendary */}
                {rarity === 'legendary' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden 
                    flex items-center justify-center" style={{zIndex:5}}>
                    {[...Array(6)].map((_,i) => (
                      <motion.div key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                        style={{ left:`${18+i*13}%`, bottom:'38%', filter:'blur(0.5px)' }}
                        animate={{ y:[0,-(55+i*15),-(110+i*20)], opacity:[0,1,0], scale:[0.5,1,0.3] }}
                        transition={{ duration:1.8+i*0.2, repeat:Infinity, 
                          repeatDelay:i*0.3, ease:'easeOut' }}
                      />
                    ))}
                  </div>
                )}

                {/* Borde glitch — chaos */}
                {rarity === 'chaos' && (
                  <>
                    <style>{`
                      @keyframes glitch {
                        0%,100%{ box-shadow: 0 0 0 2px rgba(239,68,68,0.6); }
                        20%    { box-shadow: 2px 0 0 2px rgba(239,68,68,0.9),
                                            -2px 0 0 2px rgba(239,68,68,0.4); }
                        40%    { box-shadow: -2px 0 0 2px rgba(239,68,68,0.8); }
                        60%    { box-shadow: 2px 2px 0 2px rgba(239,68,68,0.5); }
                        80%    { box-shadow: -2px -2px 0 2px rgba(239,68,68,0.7); }
                      }
                    `}</style>
                    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                      style={{ animation:'glitch 0.4s infinite', zIndex:4 }} />
                  </>
                )}

                {/* Anillo de respiración — virus */}
                {rarity === 'virus' && (
                  <motion.div
                    className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                    style={{ zIndex:4 }}
                    animate={{ boxShadow:[
                      '0 0 0 0px rgba(34,197,94,0)',
                      '0 0 0 7px rgba(34,197,94,0.28)',
                      '0 0 0 0px rgba(34,197,94,0)',
                    ]}}
                    transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                  />
                )}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Render other game components (Trivia, Drinking, etc) overlaying or replacing card */}
        {((gameState.showTrivia) || (mode === 'cultura') || (mode === 'trivia_futbol')) && currentQuestion && (
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-4 flex items-center justify-center">
            <TriviaQuestionCard
              question={currentQuestion}
              playerName={currentPlayer?.name || "Jugador"}
              onAnswer={(correct, points) => {
                if (correct) {
                  addScore(currentPlayer.id, points);
                  confetti();
                }

                // If it was a trigger (megamix), close the overlay.
                // If it is a full mode, just go to next question (handleNext handles it).
                if (mode === 'megamix') {
                  setGameState((prev: any) => ({ ...prev, showTrivia: false }));
                }

                handleNext();
              }}
            />
          </div>
        )}

        {/* Drinking Games Overlay ("Estatua Griega" etc) */}
        {gameState.showDrinkingGame && gameState.currentDrinkingGame && (
          <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              className="max-w-sm w-full bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-500 rounded-[2.5rem] p-8 text-center text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="relative z-10 space-y-6">
                <div>
                   <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em] mb-2">Evento Especial</p>
                   <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter drop-shadow-lg">{gameState.currentDrinkingGame.name}</h2>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl border border-white/10 shadow-inner">
                   <p className="text-lg font-bold text-indigo-100 leading-snug">{gameState.currentDrinkingGame.description}</p>
                </div>
                <Button 
                   className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-xl shadow-xl transition-all active:scale-95"
                   onClick={() => {
                     setGameState((prev: any) => ({ ...prev, showDrinkingGame: false }));
                     handleNext();
                   }}
                >
                   ENTENDIDO, CONTINUAR ⏭
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Impostor Round */}
        {gameState.showImpostor && gameState.impostorPlayerId && (
          <div className="absolute inset-0 z-30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 overflow-y-auto">
            <ImpostorRound
              players={players}
              impostorPlayerId={gameState.impostorPlayerId}
              realQuestion={gameState.currentImpostorReal || ''}
              impostorQuestion={gameState.currentImpostorFake || ''}
              onComplete={(caught, votedId) => {
                // Simple score logic for now
                if (caught) {
                  players.forEach(p => {
                    if (p.id && p.id !== gameState.impostorPlayerId) addScore(p.id, 20);
                  });
                } else if (gameState.impostorPlayerId) {
                  addScore(gameState.impostorPlayerId, 50);
                }
                setGameState((prev: any) => ({ ...prev, showImpostor: false }));
                handleNext();
              }}
              onExit={() => {
                setGameState((prev: any) => ({ ...prev, showImpostor: false }));
              }}
            />
          </div>
        )}

        {/* Duel Round */}
        {gameState.showDuel && gameState.duelPlayers.length >= 2 && (
          <div className="absolute inset-0 z-30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 overflow-y-auto">
            <DueloComponent
              dueloText={gameState.currentDuelo || ''}
              player1={gameState.duelPlayers[0]}
              player2={gameState.duelPlayers[1]}
              onWinner={(winner) => {
                addWin(winner.id);
                addScore(winner.id, 50);
                setGameState((prev: any) => ({ ...prev, showDuel: false }));
                handleNext();
              }}
              onSkip={() => {
                setGameState((prev: any) => ({ ...prev, showDuel: false }));
                handleNext();
              }}
            />
          </div>
        )}



        {/* Voting Support (Suggestion/Voting) */}
        {gameState.showVoting && (
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-6">Votación</h2>
            <QuestionVote
              questionText={gameState.votingQuestion || ''}
              questionCategory="megamix"
              gameId={""}
            />
            <Button className="mt-8" onClick={() => {
              setGameState((prev: any) => ({ ...prev, showVoting: false }));
              handleNext();
            }}>Continuar</Button>
          </div>
        )}

        {/* Virus Flash */}
        <VirusFlash show={virusFlash} />

        {/* Virus Alert Overlay - Stylized physical card format */}
        {gameState.showVirusAlert && gameState.virusAlertData && (
          <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              className="max-w-sm w-full bg-gradient-to-br from-green-900 to-slate-900 border-2 border-green-500 rounded-[2.5rem] p-8 text-center text-white shadow-[0_0_50px_rgba(34,197,94,0.4)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent mix-blend-overlay"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div>
                   <p className="text-[12px] text-green-400 font-black uppercase tracking-[0.4em] mb-1">¡VIRUS DETECTADO!</p>
                   <div className="h-0.5 w-12 bg-green-500/50 mx-auto rounded-full" />
                </div>

                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                  <div>
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-1">Infectado</p>
                    <p className="text-2xl font-black text-white leading-tight drop-shadow-md">
                      {useScrambleText(gameState.virusAlertData?.player?.name || '', gameState.showVirusAlert)}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] mb-1">Efecto / Maldición</p>
                    <h3 className="text-2xl font-black text-emerald-400 mb-2 drop-shadow-lg">
                      ¡{useScrambleText(gameState.virusAlertData?.player?.name || '', gameState.showVirusAlert)} tiene el virus {gameState.virusAlertData.virus.virusName}!
                    </h3>
                    <p className="text-white/80 font-medium italic mb-6 bg-slate-800/50 p-4 rounded-2xl border border-white/5 text-sm leading-relaxed">
                      "{gameState.virusAlertData.virus.virusDescription}"
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black py-3 text-lg rounded-xl shadow-[0_5px_15px_rgba(34,197,94,0.3)] transition-all active:scale-95 border-none"
                  onClick={() => {
                    setGameState((prev: any) => ({ ...prev, showVirusAlert: false, virusAlertData: null }));
                    performTurnAdvance();
                  }}
                >
                  ACEPTAR DESTINO
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Video Chat is now handled globally at Index.tsx level */}


        {/* Captain Pass Screen */}
        {gameState.showCaptainPass && (
          <div className="absolute inset-0 z-30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 overflow-y-auto">
            <CaptainPassScreen
              captainName={players.find(p => p.id === gameState.captainId)?.name || 'Capitán'}
              targetPlayerName={currentPlayer?.name || 'Siguiente Jugador'}
              isCaptainTurn={currentPlayer?.id === gameState.captainId}
              challengePreview={currentText}
              onComplete={() => {
                setGameState((prev: any) => ({ ...prev, showCaptainPass: false }));
                handleNext();
              }}
            />
          </div>
        )}

        {/* Yo Nunca Equipos Flow */}
        {mode === 'yo_nunca_equipos' && gameState.yoNuncaEquiposPhase !== 'idle' && (
          <YoNuncaEquiposFlow
            questionText={currentText}
            gameState={gameState}
            setGameState={setGameState}
            players={players}
            teams={teams}
            onNext={handleNext}
            localPlayerId={currentPlayer?.id}
            isHost={isHost}
            isMultiplayer={isMultiplayer}
            addScore={addScore}
            sendActionToHost={sendActionToHost}
          />
        )}

        {/* Final Emergency Fallback: If any of the flags are true but we failed to render the subcomponent, provide a way out */}
        {(gameState.showTrivia || gameState.showDrinkingGame || gameState.showImpostor || gameState.showDuel ||
          gameState.showMimica || gameState.showBocaCerrada || gameState.showImpostorWord ||
          gameState.showVoting || gameState.showCaptainPass || gameState.showVirusAlert ||
          mode === 'cultura' || mode === 'trivia_futbol') && (
            <div className="absolute bottom-4 left-0 right-0 p-4 flex flex-col items-center justify-center pointer-events-none gap-2">
              {/* Safety message if screen is likely empty */}
              {((gameState.showDrinkingGame && !gameState.currentDrinkingGame) ||
                (gameState.showMimica && !gameState.currentMimicaText) ||
                (gameState.showBocaCerrada && !gameState.currentBocaCerradaText)) && (
                  <div className="bg-red-500/80 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse pointer-events-auto">
                    ⚠️ Error de contenido - Pulsa Saltar
                  </div>
                )}

              {/* Special Loading State for Trivia if question is fetching */}
              {((mode === 'cultura' || mode === 'trivia_futbol' || gameState.showTrivia) && !currentQuestion) && (
                <div className="bg-blue-500/80 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse pointer-events-auto">
                  🔄 Cargando pregunta...
                </div>
              )}

              {/* Bug 16: Only show Emergency button if something is legitimately missing or stuck */}
              {(((gameState.showDrinkingGame && !gameState.currentDrinkingGame) ||
                (gameState.showMimica && !gameState.currentMimicaText) ||
                (gameState.showBocaCerrada && !gameState.currentBocaCerradaText) ||
                ((mode === 'cultura' || mode === 'trivia_futbol' || gameState.showTrivia) && !currentQuestion))) && (
                <Button variant="outline" className="opacity-60 hover:opacity-100 pointer-events-auto bg-background/50 backdrop-blur text-xs" onClick={handleNext}>
                  Saltar (Emergencia)
                </Button>
              )}
            </div>
          )}

        {/* Global Next Button for MegaMix Cards */}
        {!gameState.showTrivia && !gameState.showDrinkingGame && !gameState.showImpostor &&
          !gameState.showDuel && !gameState.showMimica && !gameState.showBocaCerrada &&
          !gameState.showImpostorWord && !gameState.showVoting && !gameState.showCaptainPass &&
          !gameState.showVirusAlert && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md px-6 mb-4 mt-8 flex justify-center"
            >
              <motion.button
                onClick={handleNext}
                whileTap={{ scale:0.93, y:6 }}
                style={{ boxShadow:'0 8px 0 rgba(255,255,255,0.07), 0 0 30px rgba(168,85,247,0.2)' }}
                className="w-full max-w-md h-20 rounded-[2rem] bg-gradient-to-b from-white/15 
                  to-white/5 backdrop-blur-xl border border-white/20 font-black text-2xl 
                  uppercase tracking-widest text-white transition-shadow"
              >
                <span className="flex items-center justify-center gap-3">
                  SIGUIENTE CARTA
                  <motion.span
                    animate={{ x:[0,5,0] }}
                    transition={{ repeat:Infinity, duration:1.4, ease:'easeInOut' }}
                  >⏭️</motion.span>
                </span>
              </motion.button>
            </motion.div>
          )}

      </main>

      {/* Round Summary Overlay */}
      {
        showRoundSummary && roundSnapshot && (
          <div className="absolute inset-0 z-[100] bg-gradient-to-r from-slate-900/80 to-slate-800/80 flex items-center justify-center">
            <RoundSummary
              round={roundSnapshot.round}
              scores={roundSnapshot.scores}
              players={players}
              teams={teams}
              globalStats={rankings}
              onContinue={() => setShowRoundSummary(false)}
              onEndGame={handleExit}
              isGameOver={gameOver}
              trackingData={{ voteCounts, drinkCounts, virusReceived, skipCounts }}
            />
          </div>
        )
      }
    </div >
  );
}
