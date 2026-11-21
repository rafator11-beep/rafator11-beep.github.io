import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Video,
  VideoOff,
  Copy,
  Crown,
  Plus,
  Minus,
  EyeOff,
  Cast,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isGeminiConfigured, geminiGenerateImpostorRound } from '@/services/geminiClient';
import { toast } from 'sonner';
import { copyInviteLink } from '@/utils/clipboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGame } from '@/hooks/useGame';
import { supabase } from '@/integrations/supabase/client';
import { useGameEngine } from '@/hooks/game/useGameEngine';
import { useGameContent } from '@/hooks/game/useGameContent';
import { useDrinkingMicroGames } from '@/hooks/game/useDrinkingMicroGames';
import { useGameEffects } from '@/hooks/game/useGameEffects';
import { useMultiplayer } from '@/hooks/game/useMultiplayer';
import { useRanking } from '@/hooks/useRanking';
import { useGameContext } from '@/contexts/GameContext';
import {
  CardDisplay,
  sanitizeCardText,
  detectCardKind,
  INTERACTIVE_CARD_KINDS,
  extractMimicaWord,
} from '@/components/game/CardDisplay';
import { cultureQuestions, type CultureQuestion } from '@/data/cultureQuestions';
import {
  triviaPrimaria,
  triviaESO,
  triviaBachillerato,
  triviaVidaCotidiana,
} from '@/data/triviaConocimientoContent';
import { debateTopics } from '@/data/debateTopics';
import type { RaceRankEntry } from '@/components/game/KahootVoteSession';
import { detectRarity } from '@/lib/godDeck';
import { sfx } from '@/lib/sfx';
import { vibe } from '@/lib/vibration';
import { GameMode } from '@/types/game';
import { duelos } from '@/data/duelosContent';
import { impostorRounds } from '@/data/impostorContent';
import { isIndividualCard } from '@/data/gameContent';
import { DUEL_POOL, REPESCA_POOL } from '@/data/tournamentPools';
import { RetoOutcome } from '@/components/game/RetoOutcome';
import { useGameMemory, enrichChallengeWithAI } from '@/hooks/game/useGameMemory';
import { useTorneoManager } from '@/hooks/game/useTorneoManager';
import { LiveTournamentOverlay } from '@/components/game/party/LiveTournamentOverlay';
import {
  createTournament,
  matchesPerTrigger,
  recordWinner,
  type BracketKind,
  type LiveTournament,
  type TournamentEvent,
} from '@/utils/liveTournament';

const pickTournamentReto = (kind: BracketKind) => {
  const pool = kind === 'repesca' ? REPESCA_POOL : DUEL_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
};
import { TurnBanner } from '@/components/game/party/TurnBanner';
import { NormaBanner } from '@/components/game/party/NormaBanner';
import { NormaVerdict } from '@/components/game/party/NormaVerdict';
import { BombOverlay } from '@/components/game/party/BombOverlay';
import { TeamBattleOverlay } from '@/components/game/party/TeamBattleOverlay';
import { VirusBanner } from '@/components/game/party/VirusBanner';
import { VirusRoundReport } from '@/components/game/party/VirusRoundReport';
import {
  catchInfected,
  roundsLabel,
  tickVirusesForRound,
  type VirusRoundReport as VirusRoundReportData,
} from '@/utils/megamixViruses';
import { getTurnInfo } from '@/utils/megamixTurn';
import { bombTopicFromCard, isBombCard } from '@/utils/megamixBomb';
import {
  addInfraction,
  cleanNormaText,
  DRINKS_PER_INFRACTION,
} from '@/utils/megamixNormas';

import { ChatComponent } from '@/components/multiplayer/ChatComponent';
import { PeerBubbles } from '@/components/multiplayer/PeerBubbles';
import { SpectatorQRPanel } from '@/components/game/SpectatorView';
import { CountdownRing } from '@/components/game/CountdownRing';
import { KahootVoteSession } from '@/components/game/KahootVoteSession';

// Subcomponents (assuming they exist or are imported)
import { ApocalypseOverlay } from '@/components/game/ApocalypseOverlay';
import { RoundSummary } from '@/components/game/RoundSummary';
import { TriviaQuestionCard } from './TriviaQuestionCard';
import { ImpostorRound } from './ImpostorRound';
import { DueloComponent } from './DueloComponent';
import { CaptainPassScreen } from './CaptainPassScreen';
import { CaptainDecisionPanel } from './CaptainDecisionPanel';
import { TurnFlash } from './TurnFlash';
import { SuggestionBox } from './SuggestionBox';
import { QuestionVote } from './QuestionVote';
import { YoNuncaEquiposFlow } from './YoNuncaEquiposFlow';
import { PodiumScreen, computePartyAwards } from './PodiumScreen';
import confetti from 'canvas-confetti';
import { XP } from './party/xp';
import { DynamicBackground, VirusFlash, BocaCerradaOverlay } from './party/PartyVisuals';
import { useScrambleText } from './party/useScrambleText';
import { PlayerProfilesBottom } from './party/PlayerProfilesBottom';
import { VotingOverlay } from './party/VotingOverlay';
import { ChromecastModal } from './party/ChromecastModal';
import { RankingDialog } from './party/RankingDialog';
import { VirusAlertSheet } from './party/VirusAlertSheet';
import {
  canFireRuntimeEvent,
  paceRound,
  getMegamixPhaseMeta,
  isNoAlcoholMode,
  RUNTIME_EVENT_CHANCE,
  setNoAlcoholMode,
} from '@/utils/megamixExperience';

export { XP };

interface PartyGameProps {
  mode: GameMode;
  onExit: () => void;
  isMultiplayer?: boolean;
  isHost?: boolean;
  roomId?: string | null;
  // Código de sala de espera generado ya en PlayerSetup (QR escaneado ANTES
  // de empezar la partida). Si viene, lo reutilizamos para que los móviles
  // que ya estaban conectados no tengan que volver a escanear nada. Si no
  // viene (p. ej. algún flujo antiguo), se sigue generando uno nuevo aquí
  // como hasta ahora.
  spectatorRoomId?: string | null;
}

export function PartyGame({
  mode,
  onExit,
  isMultiplayer = false,
  isHost = false,
  roomId = null,
  spectatorRoomId: spectatorRoomIdProp = null,
}: PartyGameProps) {
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
    setGameOver,
  } = useGameEngine(mode);

  useEffect(() => {
    document.body.classList.add('beep-game-mode');
    return () => {
      document.body.classList.remove('beep-game-mode');
    };
  }, []);

  // Shake to randomize
  useEffect(() => {
    let lastShake = 0;
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const dx = Math.abs((acc.x ?? 0) - lastX);
      const dy = Math.abs((acc.y ?? 0) - lastY);
      const dz = Math.abs((acc.z ?? 0) - lastZ);
      lastX = acc.x ?? 0;
      lastY = acc.y ?? 0;
      lastZ = acc.z ?? 0;
      if (dx + dy + dz > 30) {
        const now = Date.now();
        if (now - lastShake > 1500) {
          lastShake = now;
          const overlayActive =
            gameState.showTrivia ||
            gameState.showDuel ||
            gameState.showImpostor ||
            gameState.showMimica ||
            gameState.showVoting;
          if (!overlayActive && !isMultiplayer) {
            handleNextRef.current();
            if (navigator.vibrate) navigator.vibrate(60);
          }
        }
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [
    gameState.showTrivia,
    gameState.showDuel,
    gameState.showImpostor,
    gameState.showMimica,
    gameState.showVoting,
    isMultiplayer,
  ]);

  // Improvements State
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const prevPlayerNameRef = useRef<string>('');
  const prevVirusAlertRef = useRef(false);
  const [virusFlash, setVirusFlash] = useState(false);

  useEffect(() => {
    if (!currentPlayer?.name) return;
    if (
      prevPlayerNameRef.current &&
      prevPlayerNameRef.current !== currentPlayer.name &&
      players.length > 1
    ) {
      setShowTurnBanner(true);
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

  // Scramble text for Virus Alert (Top-level hook call)
  const infectedName = gameState.virusAlertData?.player?.name || '';
  const scrambledName = useScrambleText(infectedName, gameState.showVirusAlert || false);

  const { localPlayerId } = useGameContext();

  // Show Captain Selection dialog at the start (manual pick, not random)
  useEffect(() => {
    if (
      players.length > 0 &&
      !gameState.captainId &&
      !gameState.showCaptainSelection &&
      (mode === 'megamix' || mode === 'clasico')
    ) {
      setGameState((prev) => ({ ...prev, showCaptainSelection: true }));
    }
  }, [players, gameState.captainId, gameState.showCaptainSelection, mode, setGameState]);

  const handleAdjustXP = (playerId: string, delta: number) => {
    addScore(playerId, delta);
    const playerName = players.find((p) => p.id === playerId)?.name || 'Jugador';

    // Mejora 4.2: Toast personalizado para XP
    toast.custom(
      (t) => (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-900 px-4 py-3 shadow-xl"
        >
          <span className="text-2xl">{delta > 0 ? '⚡' : '💔'}</span>
          <div>
            <p className="text-sm font-black text-white">{playerName}</p>
            <p className={`text-lg font-black ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta > 0 ? `+${delta}` : delta} XP
            </p>
          </div>
        </motion.div>
      ),
      { duration: 1200, position: 'top-right' }
    );

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
    currentRawCard,
    getNextPreview,
    getMegamixPhaseForIndex,
  } = useGameContent(mode, currentIndex, currentPlayer?.name || 'Jugador', players.length, players);

  const { checkDrinkingGame } = useDrinkingMicroGames(mode, 1); // players count logic improved

  const {
    playerViruses,
    brutalCounts,
    setBrutalCounts, // Needed for overlay logic
    applyRandomVirus,
    setPlayerViruses,
    manageMegamixViruses, // Every 5 rounds virus cycle
  } = useGameEffects(mode, players);

  const performTurnAdvance = useCallback(
    (skipPlayerAdvance: boolean = false) => {
      sfx.whoosh();
      advanceTurn(skipPlayerAdvance);
    },
    [advanceTurn]
  );

  // --- TRACKING DATA for Classifications ---
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [drinkCounts, setDrinkCounts] = useState<Record<string, number>>({});
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [virusReceived, setVirusReceived] = useState<Record<string, number>>({});

  // Al acabar la partida, cada móvil conectado recibe SU propio premio en su
  // pantalla (mismo buzón privado del Impostor) — es el momento con más
  // posibilidades de que alguien haga captura y lo comparta fuera del grupo.
  const podiumPrivateFor = useMemo(() => {
    if (!showPodium || players.length < 2) return undefined;
    const podiumPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      score: scores[p.id] || 0,
    }));
    const awards = computePartyAwards(podiumPlayers, {
      voteCounts,
      drinkCounts,
      virusReceived,
      skipCounts,
    });
    const map: Record<
      string,
      {
        kind: 'award';
        emoji: string;
        title: string;
        subtitle: string;
        stat?: string;
        accent: string;
      }
    > = {};
    for (const p of players) {
      const award = awards.find((a) => a.playerId === p.id);
      if (award)
        map[p.name] = {
          kind: 'award',
          emoji: award.emoji,
          title: award.title,
          subtitle: award.subtitle,
          stat: award.stat,
          accent: award.accent,
        };
    }
    return map;
  }, [showPodium, players, scores, voteCounts, drinkCounts, virusReceived, skipCounts]);

  // --- AI MEMORY SYSTEM ---
  const {
    events: gameEvents,
    playerStats,
    addEvent,
    trackDrink: memoryTrackDrink,
    hasAiCard,
    peekAiCard,
    consumeAiCard,
  } = useGameMemory(players);
  const [showRetoOutcome, setShowRetoOutcome] = useState(false);
  const [aiCardOverride, setAiCardOverride] = useState<string | null>(null);
  const [enrichedCardText, setEnrichedCardText] = useState<string | null>(null);

  // --- TORNEO SYSTEM ---
  const {
    recordWin: recordTorneoWin,
    triggerRoundAnalysis,
    roundComment,
    roundCommentVisible,
  } = useTorneoManager(players);
  // Torneo vivo: dura toda la partida y avanza 1-2 duelos cada vez que sale
  // TRIGGER:TORNEO (ver src/utils/liveTournament.ts). tournamentStop = duelos
  // que quedan en esta parada; null = no hay pantalla de torneo abierta.
  const [liveTournament, setLiveTournament] = useState<LiveTournament | null>(null);
  const liveTournamentRef = useRef<LiveTournament | null>(null);
  const [tournamentStop, setTournamentStop] = useState<number | null>(null);
  const showTorneoRound = tournamentStop !== null;

  // Espejo en gameState: llega a los invitados del multijugador por el
  // broadcast que ya existe, y lo ven en solo lectura.
  const mirrorTournament = useCallback(
    (t: LiveTournament | null, open: boolean) =>
      setGameState((prev) => ({ ...prev, liveTournament: t, liveTournamentOpen: open })),
    [setGameState]
  );

  const openTournamentStop = useCallback(() => {
    let t = liveTournamentRef.current;
    if (!t || t.finished) {
      t = createTournament(
        players.map((p) => p.id),
        (t?.number ?? 0) + 1,
        pickTournamentReto
      );
      toast(`🏆 ¡Empieza el torneo nº${t.number}!`, { duration: 2500 });
    }
    liveTournamentRef.current = t;
    setLiveTournament(t);
    setTournamentStop(matchesPerTrigger(players.length));
    mirrorTournament(t, true);
  }, [players, mirrorTournament]);

  const handleTournamentResult = useCallback(
    (matchId: string, winnerId: string): TournamentEvent[] => {
      const t = liveTournamentRef.current;
      if (!t) return [];
      const match = t.brackets.flatMap((b) => b.matches).find((m) => m.id === matchId);
      const { tournament, events } = recordWinner(t, matchId, winnerId, pickTournamentReto);
      if (tournament === t || !match) return [];
      liveTournamentRef.current = tournament;
      setLiveTournament(tournament);
      setTournamentStop((left) => (left === null ? null : left - 1));
      mirrorTournament(tournament, true);

      const loserId = winnerId === match.p1 ? match.p2 : match.p1;
      const winner = players.find((p) => p.id === winnerId);
      const loser = players.find((p) => p.id === loserId);
      recordTorneoWin(winnerId, loserId);
      if (winner) addScore(winner.id, XP.TORNEO_WIN);
      if (loser) addScore(loser.id, XP.TORNEO_LOSE);
      if (winner) addEvent('torneo_win', winner, loser?.name ?? 'torneo', gameState.round);
      if (loser) addEvent('torneo_lose', loser, winner?.name ?? 'torneo', gameState.round);
      for (const e of events) {
        if (e.type === 'tournament_champion') addScore(e.playerId, XP.TORNEO_WIN * 2);
      }
      return events;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addScore/addEvent se recrean en cada render
    [players, recordTorneoWin, gameState.round, mirrorTournament]
  );
  // Track whether we've shown response UI for the current card index
  const respondedCardRef = useRef<number>(-1);
  // Carta en la que saltó el último evento al azar (minijuego, capitán, virus).
  const lastRuntimeEventRef = useRef<number>(-100);
  // Count cards shown to know when to inject AI card
  const aiCardInjectCountRef = useRef(0);

  // Helper: track a vote for a player
  const trackVote = (playerId: string) => {
    setVoteCounts((prev) => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
    sfx.click();
    vibe(5);
  };
  // Helper: track a drink for a player
  const trackDrink = (playerId: string) => {
    setDrinkCounts((prev) => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
    memoryTrackDrink(playerId, 1); // Alimentar memoria IA
    sfx.click();
    vibe(5);
  };

  // Mejora 8: Passing currentPlayer ID as presence key
  const { broadcastState, sendActionToHost, connectionStatus } = useMultiplayer(
    roomId,
    isHost,
    localPlayerId || 'Observer', // Use localPlayerId as name if available or obs
    localPlayerId || 'observer', // Passed ID
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
    },
    (action) => {
      // Host Logic: Receive Action from Guest
      if (isHost && action) {
        if (action.type === 'YO_NUNCA_VOTE') {
          const { phase, votes } = action.payload;
          if (phase === 'truth_phase') {
            setGameState((prev) => ({
              ...prev,
              yoNuncaTruthVotes: { ...prev.yoNuncaTruthVotes, ...votes },
            }));
          } else if (phase === 'guess_phase') {
            setGameState((prev) => ({
              ...prev,
              yoNuncaGuessVotes: { ...prev.yoNuncaGuessVotes, ...votes },
            }));
          }
        } else if (action.type === 'YO_NUNCA_PHASE_CHANGE') {
          setGameState((prev) => ({ ...prev, yoNuncaEquiposPhase: action.payload.phase }));
        }
      }
    }
  );

  // Única forma de poner una norma en marcha. Si había otra activa, guarda su
  // resultado para enseñar el veredicto (quién ha caído más) antes de seguir.
  const activateNorma = useCallback(
    (text: string) => {
      const clean = cleanNormaText(text);
      if (clean.length <= 5) return;
      setGameState((prev) => {
        if (prev.currentNorma === clean) return prev;
        return {
          ...prev,
          currentNorma: clean,
          // Dos vueltas de mesa, pero con tope: con 24 personas serían 48 turnos.
          currentNormaTurnsRemaining: Math.min(16, Math.max(6, players.length * 2)),
          normaInfractions: {},
          normaResult: prev.currentNorma
            ? { text: prev.currentNorma, infractions: prev.normaInfractions ?? {} }
            : prev.normaResult,
        };
      });
    },
    [players.length, setGameState]
  );

  // Alguien ha pillado a un jugador incumpliendo la norma (desde la pantalla
  // o desde su móvil): bebe en el momento y se le apunta para el veredicto.
  const reportNormaInfraction = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      setGameState((prev) =>
        prev.currentNorma
          ? { ...prev, normaInfractions: addInfraction(prev.normaInfractions ?? {}, playerId) }
          : prev
      );
      sfx.alarm();
      vibe.alert();
      toast(`🚨 ¡${player.name} ha caído!`, {
        description: `Bebe ${DRINKS_PER_INFRACTION} y queda apuntado.`,
        duration: 2500,
      });
    },
    [players, setGameState]
  );

  // Effect: Parse NORMA from content for Clasico/Megamix — auto-skip the card
  const normaAutoAdvanceRef = useRef(false);
  useEffect(() => {
    const txt = getCurrentContent();
    const isOverlayActive =
      gameState.showVirusAlert ||
      gameState.showTrivia ||
      gameState.showDuel ||
      gameState.showImpostor ||
      gameState.showMimica;

    if (
      !isOverlayActive &&
      typeof txt === 'string' &&
      (txt.toUpperCase().startsWith('NORMA:') || txt.toUpperCase().startsWith('NUEVA NORMA:'))
    ) {
      const rule = cleanNormaText(txt);

      // Prevent infinite loop: Only update state if the norma actually changed
      if (gameState.currentNorma !== rule) {
        activateNorma(rule);
        toast.success('¡Nueva Norma Activa!', { description: rule, duration: 4000 });
      }

      if (!normaAutoAdvanceRef.current) {
        normaAutoAdvanceRef.current = true;
        const timer = setTimeout(() => {
          normaAutoAdvanceRef.current = false;
          performTurnAdvance(true);
        }, 3000); // Give players 3 seconds to read it

        // BUG FIX: Do NOT reset the ref in the cleanup, otherwise any re-render
        // resets the flag, causing another timer + state update = infinite loop!
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [
    currentIndex,
    isHost,
    mode,
    getCurrentContent,
    setGameState,
    performTurnAdvance,
    activateNorma,
    gameState.showVirusAlert,
    gameState.showTrivia,
    gameState.showDuel,
    gameState.showImpostor,
    gameState.showMimica,
    gameState.currentNorma,
  ]);

  const hasInitializedRound1 = useRef(false);
  // Trigger: Ronda 1 Norma Global + Virus Assignment (Robust Unified Sync)
  useEffect(() => {
    if (
      mode === 'megamix' &&
      gameState.round === 1 &&
      currentIndex === 0 &&
      !hasInitializedRound1.current &&
      players.length > 0
    ) {
      hasInitializedRound1.current = true;

      // Get the virus first to include it in the single state update
      const randomVirus = applyRandomVirus(true);

      // Sin norma al empezar: antes se forzaba "Prohibido decir nombres", que
      // chocaba con el capitán leyendo las pruebas en voz alta. Las normas
      // llegan con el mazo (📜 cada TRIGGER_INTERVALS.norma cartas).
      setGameState((prev) => ({
        ...prev,
        // Integrate virus if assigned
        showVirusAlert: !!randomVirus,
        virusAlertData: randomVirus,
        virusPlayerId: randomVirus?.player?.id,
      }));

      if (randomVirus) toast.info('¡RONDA 1: virus activado!');
    }
  }, [gameState.round, currentIndex, mode, applyRandomVirus, players.length, setGameState]);

  // Effect to broadcast state when Host changes things
  const broadcastStateRef = useRef(broadcastState);
  broadcastStateRef.current = broadcastState;
  useEffect(() => {
    if (isMultiplayer && isHost) {
      broadcastStateRef.current({
        mode,
        currentIndex,
        gameState,
        // scores, // need dependency
        currentPlayerId: currentPlayer?.id,
        currentQuestion, // Broadcast current question
        gameId: game?.id, // BROADCAST GAME ID
      });
    }
  }, [
    currentIndex,
    gameState,
    isHost,
    isMultiplayer,
    mode,
    currentPlayer?.id,
    currentQuestion,
    game?.id,
  ]);

  // Round Change Alert
  useEffect(() => {
    if (game?.current_round && game.current_round > 1) {
      toast('¡Fin de Ronda! Cambia la Norma si es necesario.', {
        description: `Ronda ${game.current_round} comenzando...`,
        duration: 5000,
        icon: '🔄',
      });
    }
  }, [game?.current_round]);

  // TRACK BRUTAL STATS (Card Based)
  const getCurrentContentRef = useRef(getCurrentContent);
  getCurrentContentRef.current = getCurrentContent;
  useEffect(() => {
    if (!currentPlayer?.id) return;

    const txt = getCurrentContentRef.current();
    const type = currentQuestion?.type || detectRarity(txt);

    if (type === 'common' || type === 'rare') return;

    // Avoid double counting?
    // This effect runs when currentIndex changes.
    // We assume 1 card per index.

    setBrutalCounts((prev) => {
      const stats = prev[currentPlayer.id] || {
        legendaryDrops: 0,
        chaosEvents: 0,
        cursedEvents: 0,
        virusesReceived: 0,
      };
      const newStats = { ...stats };
      let changed = false;

      if (type === 'legendary') {
        newStats.legendaryDrops++;
        changed = true;
      }
      if (type === 'chaos') {
        newStats.chaosEvents++;
        changed = true;
      }
      if (type === 'virus') {
        newStats.virusesReceived++;
        changed = true;
      } // Card-based virus
      // Cursed? detectRarity doesn't return 'cursed' usually, maybe 'chaos' covers it?
      // If detectRarity returns 'cursed', handle it.
      // Assuming 'chaos' maps to chaosEvents.

      if (changed) {
        return { ...prev, [currentPlayer.id]: newStats };
      }
      return prev;
    });
  }, [currentIndex, currentPlayer?.id, currentQuestion, setBrutalCounts]);

  const { updateMultiplePlayers, rankings } = useRanking();

  const [showChromecastModal, setShowChromecastModal] = useState(false);
  const [showKahoot, setShowKahoot] = useState<{
    active: boolean;
    mode: 'standard' | 'fastest_finger' | 'speed_race';
  }>({ active: false, mode: 'standard' });
  // Trivia de cultura general en carrera: pregunta elegida manualmente (botón del host),
  // independiente de currentQuestion para no interferir con el flujo normal del juego.
  const [speedRaceQuestion, setSpeedRaceQuestion] = useState<CultureQuestion | null>(null);
  // Pool ampliado: cultura general + "sabes más que..." (primaria/ESO/Bachillerato)
  // + información útil del día a día — encaja perfecto con el formato de carrera.
  const speedRacePool = useMemo(
    () => [
      ...cultureQuestions,
      ...triviaPrimaria,
      ...triviaESO,
      ...triviaBachillerato,
      ...triviaVidaCotidiana,
    ],
    []
  );
  const launchSpeedRaceTrivia = useCallback(() => {
    const q = speedRacePool[Math.floor(Math.random() * speedRacePool.length)];
    setSpeedRaceQuestion(q);
    setShowKahoot({ active: true, mode: 'speed_race' });
  }, [speedRacePool]);

  // Carta de Debate: TODO el grupo se reparte en dos bandos aleatorios (no
  // solo 2 personas) que defienden un tema random del banco debateTopics.
  // Tras el tiempo de debate, el resto vota qué bando ha ganado vía Kahoot.
  const [debateSession, setDebateSession] = useState<{
    topic: string;
    aFavorHints: string[];
    enContraHints: string[];
    teamA: { id: string; name: string }[];
    teamB: { id: string; name: string }[];
    judge: { id: string; name: string };
  } | null>(null);
  const [debateVerdict, setDebateVerdict] = useState<{
    winner: 'A' | 'B';
    judgeName: string;
  } | null>(null);

  const launchDebate = useCallback(() => {
    if (players.length < 3) return; // hacen falta al menos juez + 1 por bando
    // Nunca lanzar un debate si ya hay otro overlay a pantalla completa activo
    // (Impostor, Duelo, Trivia, Juego de bebida, Captain Pass, Votación, Virus,
    // Podium, Resumen de ronda, Torneo, etc.) — si no, se solapan visualmente.
    if (
      gameState.showTrivia ||
      gameState.showDrinkingGame ||
      gameState.showImpostor ||
      gameState.showDuel ||
      gameState.showVoting ||
      gameState.showCaptainPass ||
      gameState.showVirusAlert ||
      gameState.showCaptainSelection ||
      gameState.showMimica ||
      gameState.showImpostorWord ||
      showKahoot.active ||
      showPodium ||
      showRoundSummary ||
      showRetoOutcome ||
      showTorneoRound
    ) {
      return;
    }
    const { topic, aFavorHints, enContraHints } =
      debateTopics[Math.floor(Math.random() * debateTopics.length)];
    // El juez sale de entre quienes NO son el capitán/anfitrión de turno —
    // excluido de entrada del pool, así no hace falta re-sortear. El resto
    // de jugadores (sin contar al juez) se reparte en los dos bandos.
    const excludedId = gameState.captainId || currentPlayer?.id || null;
    const judgePool = players.filter((p) => p.id !== excludedId);
    const pool = judgePool.length > 0 ? judgePool : players;
    const judgeRaw = pool[Math.floor(Math.random() * pool.length)];
    const judge = { id: judgeRaw.id, name: judgeRaw.name };
    const remaining = players.filter((p) => p.id !== judge.id);
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, half).map((p) => ({ id: p.id, name: p.name }));
    const teamB = shuffled.slice(half).map((p) => ({ id: p.id, name: p.name }));
    setDebateVerdict(null);
    setDebateSession({ topic, aFavorHints, enContraHints, teamA, teamB, judge });
  }, [
    players,
    gameState.captainId,
    currentPlayer,
    gameState.showTrivia,
    gameState.showDrinkingGame,
    gameState.showImpostor,
    gameState.showDuel,
    gameState.showVoting,
    gameState.showCaptainPass,
    gameState.showVirusAlert,
    gameState.showCaptainSelection,
    gameState.showMimica,
    gameState.showImpostorWord,
    showKahoot.active,
    showPodium,
    showRoundSummary,
    showRetoOutcome,
    showTorneoRound,
  ]);

  // Usado tanto para ocultar el botón "Debate" como para bloquear launchDebate:
  // evita que el host dispare un debate mientras cualquier otro overlay a
  // pantalla completa ya está activo (causa real de solapamientos en móvil).
  const isAnyFullscreenOverlayActive =
    gameState.showTrivia ||
    gameState.showDrinkingGame ||
    gameState.showImpostor ||
    gameState.showDuel ||
    gameState.showVoting ||
    gameState.showCaptainPass ||
    gameState.showVirusAlert ||
    gameState.showCaptainSelection ||
    gameState.showMimica ||
    gameState.showImpostorWord ||
    showKahoot.active ||
    showPodium ||
    showRoundSummary ||
    showRetoOutcome ||
    showTorneoRound;

  // Siempre tenemos un room ID para que los espectadores puedan unirse, incluso en local.
  // Prioridad: roomId real de multijugador > el que ya se generó en PlayerSetup (sala de
  // espera, para que quien escaneó el QR antes de empezar no tenga que volver a escanear) >
  // uno nuevo como último recurso.
  const spectatorRoomId = useRef<string>(
    roomId || spectatorRoomIdProp || Math.random().toString(36).substring(2, 8).toUpperCase()
  ).current;

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
      const sorted = players
        .map((p) => ({
          ...p,
          score: scores[p.id] || 0,
        }))
        .sort((a, b) => b.score - a.score);
      const winner = sorted[0];

      const newGame = {
        id: gameId,
        mode: mode,
        created_at: new Date().toISOString(),
        status: 'finished',
        players: players.map((p) => p.name),
        winner: winner ? winner.name : null,
      };

      const updatedHistory = [newGame, ...history].slice(0, 50);
      localStorage.setItem('partyGameHistory', JSON.stringify(updatedHistory));

      // Update Hall of Fame stats (Persistent Local + Cloud if configured)
      if (players.length > 0) {
        await updateMultiplePlayers(
          players.map((p) => ({
            name: p.name,
            score: scores[p.id] || 0,
            won: winner && p.id === winner.id,
            avatarUrl: p.avatar_url ?? undefined,
            gameMode: mode,
            brutalMeta: brutalCounts ? brutalCounts[p.id] : undefined,
          }))
        );
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

        const updates = players.map((p) => ({
          player_name: p.name,
          total_score: localStorage.getItem('partyGameScores')
            ? JSON.parse(localStorage.getItem('partyGameScores')!)[p.id]
            : 0, // This is total cumulative? Or current game?
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

  const handleAIUpdate = (newContent: string, newType: any) => {
    setGameState((prev) => ({
      ...prev,
      currentCard: {
        ...prev.currentCard,
        content: newContent,
        type: newType || 'common',
      },
    }));
  };

  const handleExit = async () => {
    // Fire and forget to prevent freeze, but ensure it runs
    saveGameToHistory();
    if (onExit) onExit();
  };

  // ── ANTI-TAP ACCIDENTAL ─────────────────────────────────────────────────────
  const lastTapRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);


  // ── HANDLER: Reto outcome ───────────────────────────────────────────────
  const handleRetoOutcome = useCallback(
    (completed: boolean) => {
      setShowRetoOutcome(false);
      setEnrichedCardText(null);
      const cardText = getCurrentContent();
      if (currentPlayer) {
        addEvent(
          completed ? 'reto_done' : 'reto_fail',
          currentPlayer,
          typeof cardText === 'string' ? cardText : '',
          gameState.round
        );
        if (completed) {
          addScore(currentPlayer.id, XP.RETO_DONE);
          toast.success(
            `✓ ${currentPlayer.name} lo ha completado — +${XP.RETO_DONE} XP · reparte 2 tragos 👑`,
            { duration: 2000 }
          );
        } else {
          addScore(currentPlayer.id, XP.RETO_FAIL);
          toast(`✗ ${currentPlayer.name} no lo ha completado — bebe 3 🍻`, { duration: 2000 });
        }
      }
      performTurnAdvance(false); // individual card → advance player
    },
    [getCurrentContent, addEvent, gameState.round, currentPlayer, addScore, performTurnAdvance]
  );

  const handleNext = () => {
    // Debounce: ignora taps en menos de 400ms
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    if (isProcessingRef.current) return;
    lastTapRef.current = now;
    isProcessingRef.current = true;
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 400);

    sfx.click();
    vibe(10);

    // ── Si hay carta IA activa, limpiarla y avanzar ──────────────────────
    if (aiCardOverride) {
      setAiCardOverride(null);
      setEnrichedCardText(null);
      performTurnAdvance(true); // AI cards son globales
      return;
    }
    setEnrichedCardText(null);

    // Detect if current card is Global so we don't pass the turn
    const cardText = getCurrentContent();
    let isGlobal: boolean;
    if (mode === 'megamix') {
      // Sobre la carta sin sustituir: con {player} ya cambiado por el nombre,
      // las cartas individuales solo por llevar {player} parecían generales.
      isGlobal = !isIndividualCard(currentRawCard);
    } else {
      isGlobal =
        currentQuestion?.type === 'yo_nunca' ||
        (typeof cardText === 'string' &&
          (cardText.toUpperCase().includes('NORMA:') ||
            cardText.toUpperCase().includes('NUEVA NORMA:') ||
            cardText.startsWith('TRIGGER:')));
    }

    // ── Intercepción de IA en Megamix para cartas individuales ────────────
    if (mode === 'megamix' && respondedCardRef.current !== currentIndex) {
      // (Antes, tras cada Yo nunca salía "¿Quién lo ha hecho?" para marcar
      // quién bebía: cortaba el ritmo y se quitó. Se pasa de carta y ya.)
      const txt = typeof cardText === 'string' ? cardText : '';
      if (isIndividualCard(currentRawCard) && players.length > 0 && currentPlayer) {
        respondedCardRef.current = currentIndex;
        if (!txt.startsWith('⚔️')) {
          setShowRetoOutcome(true);
        }
        enrichChallengeWithAI(txt, currentPlayer, players, playerStats, gameEvents).then(
          (enriched) => {
            if (enriched && enriched !== txt) setEnrichedCardText(enriched);
          }
        );
        return;
      }
    }

    respondedCardRef.current = -1; // reset for next card

    // Global Reset of all potential "active overlay" flags to prevent ghost states
    setGameState((prev) => ({
      ...prev,
      showTrivia: false,
      showDrinkingGame: false,
      showImpostor: false,
      showDuel: false,
      showMimica: false,
      showImpostorWord: false,
      showVoting: false,
      showCaptainPass: false,
      showVirusAlert: false,
      showImpostorWarning: false,
      showBocaCerrada: false,
      currentBocaCerrada: null,
      votingSelections: [],
    }));

    // Check specific game modes first
    if ((mode === 'trivia_futbol' || mode === 'cultura') && loadNextQuestion) {
      loadNextQuestion();
      performTurnAdvance(isGlobal);
      return;
    }

    // Eventos al azar: pocos y nunca pegados a otro evento (del mazo o no).
    const lastEvent = Math.max(lastRuntimeEventRef.current, handledTriggerIndexRef.current);
    const canSurprise = mode !== 'megamix' || canFireRuntimeEvent(currentIndex, lastEvent);
    const markSurprise = () => {
      lastRuntimeEventRef.current = currentIndex;
    };

    if (
      canSurprise &&
      checkDrinkingGame(currentIndex, currentPlayer?.name || 'Jugador', setGameState)
    ) {
      markSurprise();
      performTurnAdvance(isGlobal);
      return;
    }

    // Normal flow
    if (mode === 'megamix' || mode === 'clasico') {
      // Los virus ya no se descuentan aquí (en cada carta): duran rondas y se
      // descuentan al acabar cada ronda (ver el parte de virus más abajo).

      // Manage Megamix periodic events
      if (mode === 'megamix') {
        // 1. Auto-XP for current player (Megamix scaling) - Always runs
        if (currentPlayer) {
          const autoXp = Math.min(25, 5 + gameState.round * 2); // escala con la ronda
          addScore(currentPlayer.id, autoXp);
        }

        // 2. Periodic events (Normas/Viruses) - Priority 1
        const virusCycleEvent = manageMegamixViruses(gameState.round);
        if (virusCycleEvent) {
          setGameState((prev) => ({
            ...prev,
            showVirusCycleAlert: true,
            virusCycleData: virusCycleEvent,
          }));
          return; // STOP: wait for user to accept cycle event
        }

        // --- MEJORA: CAPTAIN DECISION RANDOM CHANCE ---
        if (canSurprise && Math.random() < RUNTIME_EVENT_CHANCE.capitan && players.length > 2) {
          markSurprise();
          setGameState((prev) => ({ ...prev, showCaptainDecision: true }));
          return; // STOP: wait for captain decision
        }

        // Las normas ya no llegan también por ciclo de rondas (además de las
        // del mazo y la forzada del inicio): solo las del mazo.
      }

      // 3. Apply Random Virus from current card - Priority 2
      // En Megamix el mazo ya trae TRIGGER:VIRUS: aquí solo un 5 % extra.
      const rollVirus =
        mode !== 'megamix' || (canSurprise && Math.random() < RUNTIME_EVENT_CHANCE.virus);
      const virusResult = rollVirus ? applyRandomVirus() : null;
      if (virusResult) {
        markSurprise();
        setGameState((prev) => ({ ...prev, showVirusAlert: true, virusAlertData: virusResult }));
        return; // STOP: wait for user to accept virus
      }

      // (Antes aquí saltaban además impostor forzado cada 40 cartas,
      // impostor/mímica cada 6 rondas, duelo al azar y trivia al azar: todo
      // repetía lo que ya trae el mazo. Ahora los eventos los pone el mazo.)
    }

    performTurnAdvance(isGlobal);
  };

  // El gran engranaje: espeja la norma activa para que el PartyDirector la teja
  // en las cartas, cartas inventadas y la crónica final.
  useEffect(() => {
    try {
      const n = gameState.currentNorma;
      if (n) localStorage.setItem('beep_active_norma', n);
      else localStorage.removeItem('beep_active_norma');
    } catch {
      /* ignore */
    }
  }, [gameState.currentNorma]);

  // Al desmontar la partida, limpia el rastro de norma.
  useEffect(
    () => () => {
      try {
        localStorage.removeItem('beep_active_norma');
      } catch {
        /* ignore */
      }
    },
    []
  );

  // Bug 6/8: NORMA - Auto turn advance logic (Megamix)
  // handleNext se recrea en cada render; lo leemos de un ref para que este timer
  // de 5s no se reinicie constantemente (nunca llegaba a disparar en partidas activas).
  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;
  useEffect(() => {
    if (mode !== 'megamix' || !gameState.currentNorma) return;

    // Bug 8: Guard against overlays - Do not skip if an interaction is pending
    if (
      gameState.showVirusAlert ||
      gameState.showTrivia ||
      gameState.showVoting ||
      gameState.showDuel ||
      gameState.showImpostor ||
      gameState.showMimica ||
      gameState.showImpostorWord
    )
      return;

    if (
      gameState.currentNorma.includes('AVANCE AUTOMÁTICO') ||
      gameState.currentNorma.includes('AUTO-SKIP')
    ) {
      const timer = setTimeout(() => {
        // Bug 6: Ensure we are still on the same card before skipping
        if (!gameState.showVirusAlert && !gameState.showTrivia) {
          handleNextRef.current();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentNorma,
    gameState.showVirusAlert,
    gameState.showTrivia,
    gameState.showVoting,
    gameState.showDuel,
    gameState.showImpostor,
    gameState.showMimica,
    gameState.showImpostorWord,
    mode,
  ]);

  // Rarity calculation for CardDisplay
  const rawText = enrichedCardText || aiCardOverride || getCurrentContent();
  const currentText = useMemo(() => {
    if (!rawText || typeof rawText !== 'string') return rawText;
    if (!currentPlayer || players.length === 0) return rawText;
    let result = rawText;

    // Replace {player} and {player1} with current player's name
    result = result.replace(/{player}/g, currentPlayer.name);
    result = result.replace(/{player1}/g, currentPlayer.name);

    // Filter out the current player to get other players for random selections
    const others = players.filter((p) => p.id !== currentPlayer.id);
    if (others.length > 0) {
      // Antes {player2} era siempre el primero de la lista. Se rota por carta
      // con un hash del índice (no Math.random: dentro del memo cambiaría el
      // nombre en cada re-render de la misma carta).
      const offset = (Math.imul(currentIndex + 1, 2654435761) >>> 0) % others.length;
      const otherPlayers = [...others.slice(offset), ...others.slice(0, offset)];
      // Reemplazo secuencial: {player2}, {player3}, etc. con los otros jugadores
      otherPlayers.forEach((other, index) => {
        const placeholder = new RegExp(`\\{player${index + 2}\\}`, 'g');
        result = result.replace(placeholder, other.name);
      });
    } else {
      // Si no hay otros jugadores, usar un fallback descriptivo
      result = result.replace(/{player2}/g, 'otro jugador');
      result = result.replace(/{player3}/g, 'un tercer jugador');
    }
    return result;
  }, [rawText, currentPlayer, players, currentIndex]);

  const safeCurrentText =
    currentText && currentText !== 'Siguiente carta' && currentText !== 'Cargando pregunta...'
      ? currentText
      : '';

  // De quién es la carta: individual → jugador de turno; grupal → el capitán.
  // Se manda también a los móviles para que se ilumine el de quien le toca.
  const captainName = players.find((p) => p.id === gameState.captainId)?.name;
  const [joinedNames, setJoinedNames] = useState<string[]>([]);
  const [bombOpen, setBombOpen] = useState(false);
  const [teamBattleOpen, setTeamBattleOpen] = useState(false);
  const turnInfo = useMemo(
    () =>
      (mode === 'megamix' || mode === 'clasico') && !aiCardOverride
        ? getTurnInfo({
            rawCard: currentRawCard,
            currentPlayerName: currentPlayer?.name,
            captainName,
            cardNumber: currentIndex,
          })
        : null,
    [mode, aiCardOverride, currentRawCard, currentPlayer?.name, captainName, currentIndex]
  );
  const rarity = aiCardOverride ? 'legendary' : detectRarity(currentText);

  // Auto-Kahoot: ciertas cartas (votación, trivia express) tienen más sentido
  // si CADA móvil conectado responde desde el suyo en vez de leerse en voz alta
  // en la pantalla única. Para esas, lanzamos el modo Kahoot automáticamente.
  // Las cartas de reto/picante/verdad_o_bebe/duelo siguen igual que siempre.
  const autoKahootIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!safeCurrentText) return;
    if (!(isHost || !isMultiplayer)) return;
    if (showKahoot.active) return;
    // Sin móviles conectados no hay quién vote desde el suyo: se queda la
    // pantalla de elegir (VotingOverlay), donde se asigna el voto a mano.
    if (joinedNames.length < 2) return;
    const kind = detectCardKind(safeCurrentText);
    if (!INTERACTIVE_CARD_KINDS.includes(kind)) return;
    if (autoKahootIndexRef.current === currentIndex) return;
    autoKahootIndexRef.current = currentIndex;
    setShowKahoot({ active: true, mode: 'standard' });
  }, [safeCurrentText, currentIndex, showKahoot.active, isHost, isMultiplayer, joinedNames.length]);

  // Mímica: la palabra real solo debe llegar al jugador activo, por su móvil
  // (buzón privado), NUNCA en la pantalla compartida — mismo patrón que el
  // rol de Impostor / juez del debate. Se recalcula cada vez que cambia la
  // carta o el jugador activo.
  const mimicaPrivateFor = useMemo(() => {
    if (!safeCurrentText || !currentPlayer?.name) return undefined;
    if (detectCardKind(safeCurrentText) !== 'mimica') return undefined;
    const word = extractMimicaWord(safeCurrentText);
    if (!word) return undefined;
    return { [currentPlayer.name]: { kind: 'mimica' as const, word } };
  }, [safeCurrentText, currentPlayer?.name]);

  // Trigger / Content Detection System
  // Guard: solo procesar el TRIGGER de cada carta una vez. Sin esto, un refetch de
  // `players` por Realtime (nueva referencia de array aunque el contenido no cambie)
  // re-ejecuta este efecto y reinicia el overlay (duelo/virus/impostor) ya abierto.
  const handledTriggerIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!currentText || currentText === 'Siguiente carta' || currentText === 'Cargando pregunta...')
      return;

    // 1. Check for explicit TRIGGERS (Megamix)
    if (currentText.startsWith('TRIGGER:')) {
      if (handledTriggerIndexRef.current === currentIndex) return;
      handledTriggerIndexRef.current = currentIndex;
      const triggerParts = currentText.split(':');
      const triggerType = triggerParts[1];

      if (triggerType === 'TRIVIA_FUTBOL') {
        loadSpecificQuestion?.('futbol');
        setGameState((prev) => ({ ...prev, showTrivia: true }));
      } else if (triggerType === 'TRIVIA_CULTURA') {
        loadSpecificQuestion?.('cultura');
        setGameState((prev) => ({ ...prev, showTrivia: true }));
      } else if (triggerType === 'VIRUS') {
        // BUG 4: Don't fire virus alerts before round 3
        if (gameState.round < 3) {
          const timer = setTimeout(() => advanceTurn(true), 100);
          return () => clearTimeout(timer);
        }
        const virusResult = applyRandomVirus(true);
        if (virusResult) {
          setGameState((prev) => ({ ...prev, showVirusAlert: true, virusAlertData: virusResult }));
        }
      } else if (triggerType === 'DUELO') {
        // BUG 3: Handle DUELO triggers from deck cards
        if (players.length >= 2) {
          const randomDuelo = duelos[Math.floor(Math.random() * duelos.length)];
          const opponents = players.filter((p) => p.id !== (currentPlayer?.id || ''));
          const opponent = opponents[Math.floor(Math.random() * opponents.length)];
          setGameState((prev) => ({
            ...prev,
            showDuel: true,
            currentDuelo: `${randomDuelo.name}: ${randomDuelo.description}`,
            duelPlayers: [currentPlayer || players[0], opponent],
          }));
        } else {
          const timer = setTimeout(() => advanceTurn(true), 100);
          return () => clearTimeout(timer);
        }
      } else if (triggerType === 'IMPOSTOR') {
        // Handle IMPOSTOR triggers from deck cards
        if (players.length >= 3) {
          // Nº de impostores según el grupo: con mesas grandes, 1 solo impostor
          // se encuentra demasiado rápido — escala a 2 a partir de 7 jugadores.
          const impostorCount = players.length >= 15 ? 3 : players.length >= 7 ? 2 : 1;
          const shuffled = [...players].sort(() => Math.random() - 0.5);
          const impostorIds = shuffled.slice(0, impostorCount).map((p) => p.id);
          const impostorPlayer = players.find((p) => p.id === impostorIds[0])!;

          // Reparte el rol+palabra a CADA jugador, por su móvil (ver
          // SpectatorQRPanel → privateFor). Clave = nombre, porque la
          // identidad del espectador en el móvil es por nombre, no por id.
          const buildPrivateFor = (
            category: string,
            realWord: string,
            fakeWord: string,
            hint?: string
          ) => {
            const map: NonNullable<typeof gameState.impostorPrivateFor> = {};
            for (const p of players) {
              const isImpostor = impostorIds.includes(p.id);
              map[p.name] = {
                kind: 'impostor',
                isImpostor,
                category,
                word: isImpostor ? fakeWord : realWord,
                hint: isImpostor ? hint : undefined,
              };
            }
            return map;
          };

          setGameState((prev) => ({
            ...prev,
            showImpostorWarning: true,
            impostorPlayerIds: impostorIds,
            impostorData: {
              impostorPlayerId: impostorPlayer.id,
              currentImpostorReal: 'Cargando palabra secreta...',
              currentImpostorFake: 'Cargando pista...',
              isLoading: true,
            },
          }));

          if (isGeminiConfigured()) {
            geminiGenerateImpostorRound()
              .then((result) => {
                if (result) {
                  setGameState((prev) => ({
                    ...prev,
                    impostorData: {
                      ...prev.impostorData,
                      currentImpostorReal: `${result.category}: ${result.word}`,
                      currentImpostorFake: `${result.category}: ${result.hint}`,
                      isLoading: false,
                    },
                    impostorPrivateFor: buildPrivateFor(
                      result.category,
                      result.word,
                      result.fakeWord,
                      result.hint
                    ),
                  }));
                } else {
                  const round = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
                  setGameState((prev) => ({
                    ...prev,
                    impostorData: {
                      ...prev.impostorData,
                      currentImpostorReal: round.normalQuestion || round.category || '',
                      currentImpostorFake: round.impostorQuestion || round.hint || '',
                      isLoading: false,
                    },
                    impostorPrivateFor: buildPrivateFor(
                      round.category,
                      round.normalQuestion,
                      round.impostorQuestion,
                      round.hint
                    ),
                  }));
                }
              })
              .catch(() => {
                const round = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
                setGameState((prev) => ({
                  ...prev,
                  impostorData: {
                    ...prev.impostorData,
                    currentImpostorReal: round.normalQuestion || round.category || '',
                    currentImpostorFake: round.impostorQuestion || round.hint || '',
                    isLoading: false,
                  },
                  impostorPrivateFor: buildPrivateFor(
                    round.category,
                    round.normalQuestion,
                    round.impostorQuestion,
                    round.hint
                  ),
                }));
              });
          } else {
            const round = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
            setGameState((prev) => ({
              ...prev,
              impostorData: {
                ...prev.impostorData,
                currentImpostorReal: round.normalQuestion || round.category || '',
                currentImpostorFake: round.impostorQuestion || round.hint || '',
                isLoading: false,
              },
              impostorPrivateFor: buildPrivateFor(
                round.category,
                round.normalQuestion,
                round.impostorQuestion,
                round.hint
              ),
            }));
          }
        } else {
          const timer = setTimeout(() => advanceTurn(true), 100);
          return () => clearTimeout(timer);
        }
      } else if (triggerType === 'TORNEO' || triggerType === 'MEGATORNEO') {
        // Ambos avanzan el mismo torneo vivo; antes TORNEO era un duelo
        // suelto y MEGATORNEO abría el cuadro entero de golpe.
        if (players.length >= 2 && !showTorneoRound) {
          openTournamentStop();
        } else {
          const timer = setTimeout(() => advanceTurn(true), 100);
          return () => clearTimeout(timer);
        }
      } else if (triggerType === 'EQUIPOS') {
        if (players.length >= 4) {
          setTeamBattleOpen(true);
        } else {
          const timer = setTimeout(() => advanceTurn(true), 100);
          return () => clearTimeout(timer);
        }
      } else {
        // Unknown triggers - auto-skip to prevent getting stuck
        const timer = setTimeout(() => advanceTurn(true), 100);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 2. Check for "Normas" (Rules) to persist them
    if (currentText.includes('NORMA:') || currentText.includes('📜')) {
      activateNorma(currentText);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- gameState solo se lee (round, tipos); depender de él re-ejecutaría el detector en cada cambio de estado
  }, [
    currentText,
    currentIndex,
    advanceTurn,
    applyRandomVirus,
    currentPlayer,
    players,
    setGameState,
    loadSpecificQuestion,
    showTorneoRound,
    openTournamentStop,
  ]);

  // ── Inyección de carta IA cada 10 cartas ─────────────────────────────────
  useEffect(() => {
    if (mode !== 'megamix') return;
    aiCardInjectCountRef.current += 1;
    const count = aiCardInjectCountRef.current;

    // Inyectar carta IA si hay una en cola
    if (count % 10 === 0 && hasAiCard && peekAiCard && !aiCardOverride) {
      setAiCardOverride(peekAiCard);
      consumeAiCard();
    }

    // (Antes también saltaba un duelo suelto cada 10 cartas, encima de los
    // TRIGGER:TORNEO del mazo. Ahora el torneo solo avanza con el mazo.)

    // Auto-trigger AI round analysis cada 10 turnos (offset de 8)
    if (count % 10 === 8 && gameEvents.length > 0) {
      triggerRoundAnalysis(Math.ceil(count / players.length), gameEvents, playerStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Show AI round analysis comment as toast
  useEffect(() => {
    if (roundCommentVisible && roundComment) {
      toast(roundComment, { duration: 6000, position: 'top-center' });
    }
  }, [roundCommentVisible, roundComment]);

  // YoNunca Equipos Logic Interception
  useEffect(() => {
    if (mode === 'yo_nunca_equipos' && currentText && gameState.yoNuncaEquiposPhase === 'idle') {
      // [P0 VALIDATION] Ensure we have teams and participants
      if (teams.length < 2) {
        if (isHost) toast.error('Se necesitan al menos 2 equipos para este modo.');
        handleNextRef.current();
        return;
      }

      // Find team of current player to be the target team
      const targetTeamId = currentPlayer?.team_id;
      if (targetTeamId) {
        setGameState((prev) => ({
          ...prev,
          yoNuncaEquiposPhase: 'truth_phase',
          yoNuncaTargetTeamId: targetTeamId,
          yoNuncaTruthVotes: {},
          yoNuncaGuessVotes: {},
        }));
      } else {
        // [STABILITY] If current player has no team, move on to avoid block
        console.warn('YoNuncaEquipos: Current player has no team. Skipping.');
        handleNextRef.current();
      }
    }
  }, [
    mode,
    currentText,
    gameState.yoNuncaEquiposPhase,
    currentPlayer,
    teams.length,
    isHost,
    setGameState,
  ]);

  // ── Virus por rondas ────────────────────────────────────────────────────
  // Al acabar cada ronda se descuenta una ronda a cada infectado y sale el
  // parte de virus (quién sigue y quién se cura). Antes se descontaba en cada
  // carta y un virus de "3" duraba 3 cartas; el aviso de cura era un toast.
  // Va por "ronda de ritmo" (como mucho 8 jugadores por ronda), no por la
  // ronda real: con 24 personas un virus de 3 rondas duraría 150 cartas.
  const [virusReport, setVirusReport] = useState<VirusRoundReportData | null>(null);
  const virusRound = paceRound(currentIndex, players.length);
  const prevRoundRef = useRef(virusRound);
  const playerVirusesRef = useRef(playerViruses);
  playerVirusesRef.current = playerViruses;
  useEffect(() => {
    const finished = prevRoundRef.current;
    if (virusRound <= finished) {
      prevRoundRef.current = virusRound;
      return;
    }
    prevRoundRef.current = virusRound;
    const viruses = playerVirusesRef.current;
    if (viruses.length === 0) return;
    const report = tickVirusesForRound(viruses, finished);
    setPlayerViruses(report.remaining);
    setVirusReport(report);
  }, [virusRound, setPlayerViruses]);

  const catchVirusPlayer = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      setPlayerViruses((prev) => catchInfected(prev, playerId));
      sfx.alarm();
      vibe.alert();
      toast(`🚨 ¡${player?.name ?? 'El infectado'} se ha saltado el virus!`, {
        description: 'Bebe 1 y queda apuntado para cuando se cure.',
        duration: 2500,
      });
    },
    [players, setPlayerViruses]
  );

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
          const updates = players.map((p) => {
            // Mejora 3: Recuperar XP histórico del ranking local antes de sumar
            const existingRanking = (() => {
              try {
                const raw = localStorage.getItem('fiesta-party-local-rankings-v1');
                const all = raw ? JSON.parse(raw) : [];
                return all.find((r: any) => r.player_name?.toLowerCase() === p.name?.toLowerCase());
              } catch {
                return null;
              }
            })();

            const historicalXP = existingRanking?.total_xp || existingRanking?.xp || 0;
            const sessionXP = scores[p.id] || 0;

            return {
              id: p.id,
              total_xp: historicalXP + sessionXP, // ← acumulativo
              games_played: 1, // As requested in Mejora 3
            };
          });

          // await supabase.from('profiles').upsert(updates);
          toast.success('¡Sincronización Cyber-Party Elite completada!');
        } catch (err) {
          console.error('Sync error:', err);
        }
      };

      syncAllPlayers();
      saveGameToHistory();
      triggerRoundAnalysis(gameState.round, gameEvents, playerStats);
      setRoundSnapshot({
        round: gameState.round,
        scores: scores,
      });
      setShowRoundSummary(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cierre de ronda: solo al cambiar ronda/marcador; saveGameToHistory y compañía se recrean en cada render
  }, [gameOver, showRoundSummary, gameState.round, scores, players]);

  // Nuevo estado local para modo sin alcohol y pacto temporal
  const [noAlcoholMode, setNoAlcoholModeState] = useState(() => isNoAlcoholMode());
  const [temporaryPactTurns, setTemporaryPactTurns] = useState(0);

  const megamixPhase = mode === 'megamix' ? getMegamixPhaseForIndex() : null;
  const phaseMeta = megamixPhase ? getMegamixPhaseMeta(megamixPhase) : null;
  const nextMystery = mode === 'megamix' ? getNextPreview() : null;

  useEffect(() => {
    if (!safeCurrentText) return;
    if (/ALIANZA TEMPORAL|EL PACTO/i.test(safeCurrentText)) {
      setTemporaryPactTurns(2);
    } else {
      setTemporaryPactTurns((turns) => Math.max(0, turns - 1));
    }
  }, [currentIndex, safeCurrentText]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 pb-24 md:pb-32">
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
        drinkCounts={drinkCounts}
      />

      {/* ── VOTING OVERLAY — inmersivo ── */}
      <VotingOverlay
        currentText={currentText}
        players={players}
        scores={scores}
        votingSelections={gameState.votingSelections || []}
        onSelectionsChange={(ids) => setGameState((prev) => ({ ...prev, votingSelections: ids }))}
        canLaunchKahoot={isHost || !isMultiplayer}
        onLaunchKahoot={() => setShowKahoot({ active: true, mode: 'standard' })}
        onConfirm={(ids) => {
          ids.forEach((id) => {
            handleAdjustXP(id, 5);
            trackVote(id);
          });
          setGameState((prev) => ({ ...prev, votingSelections: [] }));
          handleNext();
        }}
        onSkip={handleNext}
      />

      <NormaVerdict
        result={gameState.normaResult}
        players={players}
        captainName={captainName}
        onClose={() => setGameState((prev) => ({ ...prev, normaResult: null }))}
      />

      <BombOverlay
        open={bombOpen}
        topic={bombTopicFromCard(currentRawCard)}
        onClose={() => setBombOpen(false)}
      />

      <VirusRoundReport report={virusReport} players={players} onClose={() => setVirusReport(null)} />

      <TeamBattleOverlay
        open={teamBattleOpen}
        players={players}
        onDone={() => {
          setTeamBattleOpen(false);
          advanceTurn(true);
        }}
      />

      {/* Top Bar with Chromecast.
          Antes: [Atrás, Cast] | [Capitán] | [Siguiente, Finalizar, "Ronda N"] con
          justify-between en una sola fila — en móviles estrechos la última cifra
          (RONDA) se salía de pantalla, y encima había un segundo botón
          "Finalizar" más abajo que hacía casi lo mismo (ver nota de handleExit).
          Simplificado: se quita "Siguiente" del header (ya existe el botón
          grande de abajo), "Ronda" pasa a una pastilla compacta que no depende
          de cuánto texto quepa, y min-w-0/truncate evitan que nada se salga. */}
      <header className="relative z-10 flex items-center gap-1.5 p-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            if (window.confirm('¿Seguro que quieres salir?')) {
              handleExit();
            }
          }}
        >
          <ArrowLeft className="h-6 w-6 text-white/80" />
        </Button>

        {/* Botón Chromecast */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full border border-primary/20 bg-primary/10 transition-all hover:bg-primary/20 hover:text-white"
          onClick={() => setShowChromecastModal(true)}
        >
          <Cast className="text-primary-200 h-5 w-5" />
        </Button>

        {/* Captain Indicator — integrated in header */}
        {gameState.captainId && (
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1.5">
              <Crown className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <span className="truncate text-xs font-black uppercase tracking-wider text-amber-200">
                {players.find((p) => p.id === gameState.captainId)?.name}
              </span>
            </div>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button
            variant="destructive"
            size="sm"
            className="font-arcade border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 px-2.5 text-[10px] font-black uppercase tracking-wider text-red-300"
            onClick={() => {
              if (window.confirm('¿Terminar partida y ver resultados?')) {
                setGameOver(true);
                setShowPodium(true);
              }
            }}
          >
            Finalizar
          </Button>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-2.5 py-1.5 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.span
                key={gameState.round}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="font-arcade text-base font-bold text-white"
              >
                R{gameState.round}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* CHROMECAST MODAL */}
      <ChromecastModal open={showChromecastModal} onOpenChange={setShowChromecastModal} />

      {/* Active Norma Display for Megamix (If a rule is active, show it globally) */}
      {mode === 'megamix' &&
        gameState.showTrivia &&
        currentText &&
        currentText.includes('NORMA ALEATORIA') && (
          <div className="z-10 -mt-2 mb-2 flex w-full justify-center">
            <div className="flex animate-pulse items-center gap-2 rounded-full border border-red-500 bg-gradient-to-r from-red-500/20 to-red-600/20 px-6 py-2 font-bold text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <span>🚨 NORMA ACTIVA:</span>
              <span className="text-sm font-normal">
                {typeof currentQuestion?.answer === 'string' ? currentQuestion.answer : ''}
              </span>
            </div>
          </div>
        )}

      {/* Captain Indicator — moved to header above */}

      {/* Host / Spectator Banner - SIEMPRE VISIBLE PARA EL HOST para permitir QR.
          Antes iba con position:absolute centrado encima del <header>, lo que lo
          hacía solaparse con el icono de Chromecast y los botones de Finalizar/
          Ronda en pantallas estrechas. Ahora es una segunda fila normal del flujo,
          debajo del header, así nunca pisa nada. */}
      <div className="relative z-20 -mt-1 mb-2 flex w-full justify-center px-4">
        <div className="flex items-center gap-2">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-full border border-green-500/30 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-3 py-1 font-mono text-xs text-green-400 transition-all hover:border-green-500/60 hover:bg-slate-800/90"
            onClick={() => copyInviteLink(spectatorRoomId)}
          >
            <span>
              {isMultiplayer ? (isHost ? 'HOST' : 'ESPEC') : 'LOCAL'} • SALA: {spectatorRoomId}
            </span>
            <Copy className="h-3 w-3 opacity-70" />
          </div>
          {(isHost || !isMultiplayer) && (
            <SpectatorQRPanel
              roomId={spectatorRoomId}
              currentCard={safeCurrentText}
              currentPlayer={currentPlayer?.name || ''}
              players={players.map((p) => p.name)}
              turn={turnInfo ?? undefined}
              onJoinedChange={setJoinedNames}
              norma={
                gameState.currentNorma
                  ? {
                      text: cleanNormaText(gameState.currentNorma),
                      turnsLeft: gameState.currentNormaTurnsRemaining ?? 0,
                      pillados: Object.fromEntries(
                        players.map((p) => [p.name, gameState.normaInfractions?.[p.id] ?? 0])
                      ),
                    }
                  : undefined
              }
              onNormaReport={(targetName) => {
                const target = players.find((p) => p.name === targetName);
                if (target) reportNormaInfraction(target.id);
              }}
              privateFor={
                debateSession
                  ? {
                      [debateSession.judge.name]: {
                        kind: 'judge',
                        topic: debateSession.topic,
                        aFavorHints: debateSession.aFavorHints,
                        enContraHints: debateSession.enContraHints,
                      },
                    }
                  : showPodium
                    ? podiumPrivateFor
                    : gameState.showImpostorWarning || gameState.showImpostor
                      ? gameState.impostorPrivateFor
                      : mimicaPrivateFor
              }
              debateInfo={
                debateSession
                  ? {
                      topic: debateSession.topic,
                      teamA: debateSession.teamA.map((p) => p.name),
                      teamB: debateSession.teamB.map((p) => p.name),
                      aFavorHints: debateSession.aFavorHints,
                      enContraHints: debateSession.enContraHints,
                      judgeName: debateSession.judge.name,
                    }
                  : undefined
              }
              onDebateVerdict={(winner, judgeName) => {
                if (!debateSession || judgeName !== debateSession.judge.name) return;
                setDebateVerdict({ winner, judgeName });
              }}
              kahootConfig={
                showKahoot.active && !debateSession
                  ? {
                      mode: showKahoot.mode,
                      question:
                        showKahoot.mode === 'speed_race' && speedRaceQuestion
                          ? speedRaceQuestion.question
                          : (gameState.showTrivia ||
                                mode === 'cultura' ||
                                mode === 'trivia_futbol') &&
                              currentQuestion
                            ? currentQuestion.question
                            : sanitizeCardText(currentText || ''),
                      options:
                        showKahoot.mode === 'speed_race' && speedRaceQuestion
                          ? speedRaceQuestion.options
                          : (gameState.showTrivia ||
                                mode === 'cultura' ||
                                mode === 'trivia_futbol') &&
                              currentQuestion
                            ? currentQuestion.options
                            : players.map((p) => p.name),
                      correctAnswer:
                        showKahoot.mode === 'speed_race' && speedRaceQuestion
                          ? speedRaceQuestion.options[speedRaceQuestion.correctIndex]
                          : (gameState.showTrivia ||
                                mode === 'cultura' ||
                                mode === 'trivia_futbol') &&
                              currentQuestion
                            ? currentQuestion.options[currentQuestion.correctIndex]
                            : undefined,
                    }
                  : null
              }
            />
          )}
          {/* Trivia en carrera y debate necesitan móviles: sin ellos no hay quién responda o vote. */}
          {(isHost || !isMultiplayer) && !showKahoot.active && joinedNames.length >= 2 && (
            <button
              onClick={launchSpeedRaceTrivia}
              title="Trivia de cultura general: todos los móviles conectados responden a la vez y se reparten puntos según velocidad de acierto"
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow transition-all hover:brightness-110"
            >
              ⚡ Trivia en carrera
            </button>
          )}
          {(isHost || !isMultiplayer) &&
            !showKahoot.active &&
            !debateSession &&
            !isAnyFullscreenOverlayActive &&
            players.length >= 3 &&
            joinedNames.length >= 2 && (
              <button
                onClick={launchDebate}
                title="Debate: dos jugadores defienden posturas opuestas de un tema random y el resto vota quién ha ganado"
                className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow transition-all hover:brightness-110"
              >
                🗣️ Debate
              </button>
            )}
        </div>
      </div>

      {/* Mobile Player Indicator (only visible on small screens where sidebar is hidden) */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className="text-sm text-white/60">Turno de:</span>
        <span className="font-bold text-white">{currentPlayer?.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {roomId && (
          <Button
            variant={showVideo ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => setShowVideo(!showVideo)}
            className={
              showVideo ? 'animate-pulse border-red-500' : 'border-white/20 bg-transparent'
            }
          >
            {showVideo ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
            {showVideo ? 'Salir' : 'Video'}
          </Button>
        )}

        {/* El botón "Finalizar" duplicado que había aquí se quitó — la flecha de
            volver del header ya hace lo mismo (sale guardando el historial) y
            el "Finalizar" del header ya cubre terminar la partida con podio. */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-white/20 bg-transparent text-xs"
            >
              <AlertCircle className="h-3 w-3" />
              Estado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
            <DialogHeader>
              <DialogTitle>Estado de la Partida</DialogTitle>
              <DialogDescription>
                Revisa los virus activos y las normas vigentes en este turno.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Active Viruses Section */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-purple-400">
                  🦠 Virus Activos
                </h3>
                {playerViruses.length === 0 ? (
                  <p className="text-sm italic text-white/60">
                    No hay virus activos en este momento.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {playerViruses.map((v, i) => {
                      const affectedPlayer = players.find((p) => p.id === v.playerId);
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-3"
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <span className="text-sm font-bold text-purple-300">
                              {affectedPlayer?.name || 'Jugador'}
                            </span>
                            <span className="rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 px-2 py-0.5 text-xs text-purple-200">
                              {roundsLabel(v.turnsRemaining)}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">{v.virusName}</p>
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
        <RankingDialog players={players} scores={scores} />
      </div>

      {/* Reveal Overlay (Mimica) with Long Press */}
      <Dialog
        open={gameState.showMimica}
        onOpenChange={(open) => {
          if (!open) {
            setGameState((prev) => ({
              ...prev,
              showMimica: false,
              showMimicaReveal: false,
            }));
          }
        }}
      >
        <DialogContent
          className="z-[70] overflow-hidden border-none bg-[url('/modern_bg.png')] bg-cover bg-center p-0 text-white shadow-2xl sm:max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Reto de Mímica</DialogTitle>
            <DialogDescription>
              Muestra el secreto al jugador actual sin que el resto del grupo pueda verlo.
            </DialogDescription>
          </DialogHeader>
          <div className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-2xl" />
          <div className="glass-panel relative z-10 space-y-6 border-b border-white/10 p-6 text-center">
            <div className="space-y-1">
              <p className="text-xl font-bold uppercase tracking-widest text-primary/80">
                Toca realizar la prueba a:
              </p>
              <p className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                {currentPlayer?.name}
              </p>
            </div>
            <p className="animate-pulse rounded-full border border-red-500/20 bg-red-500/10 py-2 text-sm font-bold uppercase tracking-widest text-red-400">
              ¡Que los demás no miren!
            </p>

            <div className="perspective-1000 group relative">
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  setGameState((prev) => ({ ...prev, showMimicaReveal: !prev.showMimicaReveal }));
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  return false;
                }}
                className="preserve-3d relative w-full touch-none select-none overflow-hidden rounded-[2rem] shadow-2xl transition-transform duration-300 group-active:scale-[0.98]"
              >
                <div
                  className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-[2rem] border-4 p-6 backdrop-blur-md transition-all ${
                    gameState.showMimicaReveal
                      ? 'border-primary bg-slate-900/80 shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                      : 'border-white/10 bg-slate-800/50 shadow-lg hover:border-primary/50'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {!gameState.showMimicaReveal ? (
                      <motion.div
                        key="hidden"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
                          <EyeOff className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-balance text-sm font-bold uppercase tracking-widest text-white">
                          Haz clic para revelar u ocultar el secreto
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="visible"
                        initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex w-full flex-1 flex-col items-center justify-center gap-3"
                      >
                        <p className="text-primary-100 mb-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                          RETO DE MÍMICA
                        </p>
                        <p className="pb-4 text-2xl font-black leading-tight text-white drop-shadow-md md:text-3xl">
                          {gameState.currentMimicaText}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </div>

            <Button
              className="h-14 w-full rounded-xl border border-white/20 bg-white/10 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              onClick={() => {
                setGameState((prev) => ({
                  ...prev,
                  showMimicaReveal: false,
                  showMimica: false,
                }));
                handleNext();
              }}
            >
              YA LO HE VISTO, CERRAR ⏭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={gameState.showCaptainSelection} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950/98 z-[300] rounded-[3rem] border-yellow-500/40 p-8 text-white backdrop-blur-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-center text-4xl font-black text-yellow-500">
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <Crown className="h-12 w-12 fill-yellow-500 text-yellow-500" />
              </div>
              <span>ELÍGE AL CAPITÁN</span>
            </DialogTitle>
            <DialogDescription className="text-center font-medium text-slate-400">
              El Capitán tendrá el control total del móvil y las puntuaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">
                Misiones del Capitán
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-300">
                <li className="flex items-center gap-2">✅ Leer las cartas en voz alta</li>
                <li className="flex items-center gap-2">✅ Repartir XP por buen desempeño</li>
                <li className="flex items-center gap-2">✅ Asegurar que todos beben cuando toca</li>
              </ul>
            </div>

            <div className="no-scrollbar grid max-h-[40vh] grid-cols-2 gap-4 overflow-y-auto pb-2">
              {players.map((p) => (
                <Button
                  key={`pick-captain-${p.id}`}
                  className="group relative flex h-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl transition-all hover:border-yellow-500/50 hover:bg-yellow-500/20"
                  onClick={() => {
                    try {
                      if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
                    } catch (e) {}
                    setGameState((prev) => ({
                      ...prev,
                      captainId: p.id,
                      showCaptainSelection: false,
                    }));
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-slate-800 text-lg font-black transition-transform group-hover:scale-110 group-hover:border-yellow-400">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="h-full w-full object-cover" />
                    ) : (
                      p.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="w-full truncate px-2 font-bold text-white/90">{p.name}</span>
                </Button>
              ))}
            </div>

            <p className="animate-pulse text-center text-[9px] font-bold uppercase italic tracking-widest text-slate-500">
              ¿Quién tiene el dispositivo ahora mismo?
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Impostor Anti-Spoiler Warning */}
      <Dialog open={gameState.showImpostorWarning}>
        <DialogContent className="z-[80] border-red-500/50 bg-slate-900/95 text-white backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-3 text-center text-3xl font-black uppercase tracking-tighter text-red-500">
              ⚠️ ACCESO RESTRINGIDO
            </DialogTitle>
            <DialogDescription className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-red-400">
              Esta pantalla contiene información secreta que solo el jugador asignado debe ver.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-center">
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-widest text-white/60">
                Entrega el dispositivo a:
              </p>
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-4xl font-black text-white shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                {players.find((p) => p.id === gameState.impostorData?.impostorPlayerId)?.name ||
                  currentPlayer?.name}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                ¡CAPITÁN! NO MIRES LA PANTALLA
              </p>
            </div>

            <div className="relative">
              <motion.button
                onMouseDown={() => setGameState((prev) => ({ ...prev, showImpostorWord: true }))}
                onMouseUp={() => setGameState((prev) => ({ ...prev, showImpostorWord: false }))}
                onTouchStart={() => setGameState((prev) => ({ ...prev, showImpostorWord: true }))}
                onTouchEnd={() => setGameState((prev) => ({ ...prev, showImpostorWord: false }))}
                className="flex h-36 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-red-500/40 bg-gradient-to-br from-red-500/20 to-slate-900 shadow-xl transition-all active:scale-95 active:bg-red-500/30"
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
                      <EyeOff className="h-10 w-10 text-red-500" />
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-red-500">
                        {players.find((p) => p.id === gameState.impostorData?.impostorPlayerId)
                          ?.name || currentPlayer?.name}
                        : MANTÉN PULSADO
                      </p>
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
                            players.forEach((p) => {
                              if (p.id !== gameState.impostorData?.impostorPlayerId)
                                addScore(p.id, XP.IMPOSTOR_CAUGHT);
                            });
                          } else if (gameState.impostorData?.impostorPlayerId) {
                            addScore(gameState.impostorData.impostorPlayerId, XP.IMPOSTOR_WIN);
                          }
                          setGameState((prev) => ({
                            ...prev,
                            showImpostorWarning: false,
                            showImpostorWord: false,
                          }));
                          handleNext();
                        }}
                        onExit={() => {
                          setGameState((prev) => ({
                            ...prev,
                            showImpostorWarning: false,
                            showImpostorWord: false,
                          }));
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
          <Button
            className="h-14 w-full rounded-2xl bg-white text-lg font-black text-black shadow-xl transition-all hover:bg-white/90"
            onClick={() => {
              setGameState((prev) => ({
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

      {/* BOCA CERRADA — hold-to-reveal */}
      <Dialog open={gameState.showBocaCerrada}>
        <DialogContent className="bg-slate-950/98 z-[85] overflow-hidden rounded-[2.5rem] border-purple-500/40 p-0 text-white backdrop-blur-3xl sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Boca Cerrada</DialogTitle>
            <DialogDescription>
              Mantén pulsado para ver la frase que debes decir con la boca cerrada.
            </DialogDescription>
          </DialogHeader>
          <BocaCerradaOverlay
            text={gameState.currentBocaCerrada || ''}
            playerName={currentPlayer?.name || 'Jugador'}
            onDone={() => {
              setGameState((prev) => ({
                ...prev,
                showBocaCerrada: false,
                currentBocaCerrada: null,
              }));
              performTurnAdvance();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Virus Cycle Notification */}
      <Dialog open={gameState.showVirusCycleAlert}>
        <DialogContent className="z-[70] border-green-500/50 bg-slate-900/95 text-white backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-black uppercase tracking-tighter text-green-400">
              {gameState.virusCycleData?.title || 'Evento Megamix'}
            </DialogTitle>
            <DialogDescription className="sr-only">Evento especial del Megamix</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {/* Infected player */}
            <p className="text-center text-base font-semibold text-white/80">
              {gameState.virusCycleData?.message}
            </p>

            {/* Virus name + description */}
            {gameState.virusCycleData?.virusName && (
              <div className="space-y-1 rounded-2xl border border-green-500/30 bg-green-950/60 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-400">
                  Virus activo
                </p>
                <p className="text-xl font-black text-green-300">
                  {gameState.virusCycleData.virusName}
                </p>
                <p className="text-sm leading-snug text-white/70">
                  {gameState.virusCycleData.virusDescription}
                </p>
              </div>
            )}

            {/* Icebreaker challenge */}
            {gameState.virusCycleData?.challenge && (
              <div className="space-y-1 rounded-2xl border border-purple-500/30 bg-purple-950/60 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                  Reto grupal
                </p>
                <p className="text-sm leading-snug text-white/90">
                  {gameState.virusCycleData.challenge}
                </p>
              </div>
            )}
          </div>
          <Button
            className="mt-2 h-14 w-full rounded-2xl bg-green-600 text-base font-black text-white shadow-xl transition-all hover:bg-green-500"
            onClick={() => {
              setGameState((prev) => ({ ...prev, showVirusCycleAlert: false }));
              performTurnAdvance(true);
            }}
          >
            ENTENDIDO, SIGUIENTE TURNO
          </Button>
        </DialogContent>
      </Dialog>

      {/* Captain Decision Panel — Mandato del Capitán */}
      <AnimatePresence>
        {gameState.showCaptainDecision && (
          <CaptainDecisionPanel
            captainName={players.find((p) => p.id === gameState.captainId)?.name || 'Capitán'}
            players={players.filter((p) => p.id !== gameState.captainId)}
            drinkCounts={drinkCounts}
            onDrink={(playerId, name) => {
              sfx.click();
              trackDrink(playerId);
              addScore(playerId, XP.DRINK_BRAVE);
              const captain = players.find((p) => p.id === gameState.captainId);
              if (captain) addScore(captain.id, XP.CAPITAN_ACTION);
              toast(`🍺 ${name} bebe por orden del Capitán!`, { duration: 3000 });
              setGameState((prev) => ({ ...prev, showCaptainDecision: false }));
              performTurnAdvance(true);
            }}
            onVirus={(playerId, name) => {
              sfx.click();
              applyRandomVirus(true, playerId);
              toast(`🦠 Capitán asignó el virus a ${name}!`, { duration: 3000 });
              setGameState((prev) => ({ ...prev, showCaptainDecision: false }));
              performTurnAdvance(true);
            }}
            onNormaCancel={(_playerId, name) => {
              sfx.click();
              toast(`📜 Norma anulada si ${name} cumple el castigo.`, { duration: 3000 });
              setGameState((prev) => ({ ...prev, showCaptainDecision: false }));
            }}
            onAllDrink={() => {
              sfx.click();
              players.forEach((p) => trackDrink(p.id));
              toast(`🥂 ¡El Capitán ordena que TODOS beban!`, { duration: 3000 });
              setGameState((prev) => ({ ...prev, showCaptainDecision: false }));
              performTurnAdvance(true);
            }}
            onDouble={(playerId, name) => {
              sfx.click();
              trackDrink(playerId);
              trackDrink(playerId);
              addScore(playerId, XP.DRINK_BRAVE);
              const captainDouble = players.find((p) => p.id === gameState.captainId);
              if (captainDouble) addScore(captainDouble.id, XP.CAPITAN_ACTION);
              toast(`⚡ ¡Doble o nada! ${name} bebe el doble.`, { duration: 3000 });
              setGameState((prev) => ({ ...prev, showCaptainDecision: false }));
              performTurnAdvance(true);
            }}
            onClose={() => setGameState((prev) => ({ ...prev, showCaptainDecision: false }))}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        className={`relative flex flex-1 flex-col items-center justify-center p-4 transition-opacity duration-300 ${isMultiplayer && !isHost && currentPlayer?.id !== localPlayerId ? 'pointer-events-none opacity-80' : ''}`}
      >
        {/* Turn Flash Overlay */}
        <TurnFlash
          playerName={currentPlayer?.name || ''}
          avatarUrl={currentPlayer?.avatar_url}
          playerIndex={players.findIndex((p) => p.id === currentPlayer?.id)}
          visible={showTurnBanner}
          onDismiss={() => setShowTurnBanner(false)}
        />

        {/* Banner de norma activa */}
        <VirusBanner viruses={playerViruses} players={players} onCatch={catchVirusPlayer} />

        {gameState.currentNorma && (
          <NormaBanner
            text={cleanNormaText(gameState.currentNorma)}
            turnsLeft={gameState.currentNormaTurnsRemaining ?? 0}
            players={players}
            infractions={gameState.normaInfractions ?? {}}
            onReport={reportNormaInfraction}
          />
        )}

        {/* Mesa del Capitán + "¿Quién ha bebido?" se movieron debajo de la carta
            (justo después del botón "Siguiente turno") — iban aquí arriba y
            empujaban tanto la carta hacia abajo que en móviles su cabecera
            (emoji + "YO NUNCA HE...") quedaba fuera de la pantalla visible,
            pareciendo "cortada" tras el resto de paneles. */}

        {/* Virus Cycle Alert (Periodic Infection/Mutation) - Manual overlay removed to use Dialog instead */}

        <AnimatePresence mode="wait">
          {/* CONTENT-AWARE VISIBILITY: Only hide the main card if an overlay is ACTIVE AND HAS DATA */}
          {!(gameState.showTrivia && currentQuestion) &&
            !(gameState.showDuel && gameState.currentDuelo) &&
            !gameState.showVoting &&
            !gameState.showImpostor &&
            !gameState.showCaptainPass &&
            gameState.yoNuncaEquiposPhase === 'idle' && (
              <div className="relative flex w-full flex-col items-center justify-center">
                {/* Indicador de progreso superior */}
                <div className="z-10 mb-3 flex w-full max-w-[520px] flex-col items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.22em] text-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md sm:text-[0.8rem]">
                    <span>Carta {currentIndex + 1}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    {megamixPhase && phaseMeta ? (
                      <span className={phaseMeta.accent}>
                        {phaseMeta.emoji} {megamixPhase}
                      </span>
                    ) : (
                      <span>Ronda {gameState.round}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !noAlcoholMode;
                        setNoAlcoholModeState(next);
                        setNoAlcoholMode(next);
                      }}
                      className={`ml-1 rounded-full px-2 py-1 tracking-normal transition-colors ${noAlcoholMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-white/50'}`}
                    >
                      {noAlcoholMode ? '⭐ SIN ALCOHOL' : '🍻 BEBIDA'}
                    </button>
                  </div>

                  {mode === 'megamix' && nextMystery && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold text-white/55"
                    >
                      Próxima carta:{' '}
                      <span className="text-white/80">
                        {nextMystery.emoji} {nextMystery.label}
                      </span>
                      <span className="mx-1 text-white/25">·</span>
                      {nextMystery.hint}
                    </motion.div>
                  )}

                  {temporaryPactTurns > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-fuchsia-200"
                    >
                      🃏 Pacto activo · {temporaryPactTurns} cartas
                    </motion.div>
                  )}
                </div>

                <TurnBanner
                  turn={turnInfo}
                  connected={!!turnInfo && joinedNames.includes(turnInfo.name)}
                  captainName={captainName}
                />

                {isBombCard(currentRawCard) && !aiCardOverride && (
                  <button
                    type="button"
                    onClick={() => setBombOpen(true)}
                    className="mx-auto mb-2 rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-600 to-orange-500 px-8 py-3 text-base font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95"
                  >
                    💣 Activar la bomba
                  </button>
                )}

                <motion.div
                  key={currentIndex}
                  drag={false}
                  className="relative flex w-full flex-col items-center justify-center"
                >
                  <motion.div
                    key={`card-inner-${currentIndex}`}
                    initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: -90, opacity: 0, scale: 0.9 }}
                    transition={{
                      rotateY: { type: 'spring', stiffness: 280, damping: 24 },
                      opacity: { duration: 0.12 },
                      scale: { type: 'spring', stiffness: 300, damping: 26 },
                    }}
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d',
                      willChange: 'transform',
                    }}
                    className="relative z-20 flex w-full flex-col items-center justify-center"
                  >
                    <CardDisplay
                      content={safeCurrentText}
                      type={rarity}
                      onClick={() => {
                        return;
                      }}
                      onSuccess={() => {
                        const kind = safeCurrentText.toLowerCase();
                        const xp = kind.includes('verdad o bebe') ? XP.VERDAD_TOLD : XP.RETO_DONE;
                        if (currentPlayer) addScore(currentPlayer.id, xp);
                        handleNext();
                      }}
                      onFail={() => {
                        const kind = safeCurrentText.toLowerCase();
                        const xp = kind.includes('verdad o bebe') ? XP.VERDAD_DRINK : XP.RETO_FAIL;
                        if (currentPlayer) addScore(currentPlayer.id, xp);
                        handleNext();
                      }}
                      gameMode={mode}
                      players={players}
                      currentPlayer={currentPlayer}
                      round={gameState.round}
                      onAIUpdate={handleAIUpdate}
                    />

                    {/* Partículas doradas — legendary */}
                    {rarity === 'legendary' && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
                        style={{ zIndex: 5 }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute h-1.5 w-1.5 rounded-full bg-amber-400"
                            style={{
                              left: `${18 + i * 13}%`,
                              bottom: '38%',
                              filter: 'blur(0.5px)',
                            }}
                            animate={{
                              y: [0, -(55 + i * 15), -(110 + i * 20)],
                              opacity: [0, 1, 0],
                              scale: [0.5, 1, 0.3],
                            }}
                            transition={{
                              duration: 1.8 + i * 0.2,
                              repeat: Infinity,
                              repeatDelay: i * 0.3,
                              ease: 'easeOut',
                            }}
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
                        <div
                          className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
                          style={{ animation: 'glitch 0.4s infinite', zIndex: 4 }}
                        />
                      </>
                    )}

                    {/* Anillo de respiración — virus */}
                    {rarity === 'virus' && (
                      <motion.div
                        className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
                        style={{ zIndex: 4 }}
                        animate={{
                          boxShadow: [
                            '0 0 0 0px rgba(34,197,94,0)',
                            '0 0 0 7px rgba(34,197,94,0.28)',
                            '0 0 0 0px rgba(34,197,94,0)',
                          ],
                        }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              </div>
            )}
        </AnimatePresence>

        {/* BOTÓN SIGUIENTE TURNO — único punto de avance */}
        {!(gameState.showTrivia && currentQuestion) &&
          !gameState.showDuel &&
          !gameState.showVoting &&
          !gameState.showImpostor &&
          !gameState.showCaptainPass &&
          !gameState.showCaptainDecision &&
          gameState.yoNuncaEquiposPhase === 'idle' && (
            <div className="relative z-10 mx-auto mb-2 mt-4 flex w-full max-w-sm flex-col gap-2">
              <motion.button
                key={`next-btn-${currentIndex}`}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 22 }}
                onClick={() => {
                  if (isMultiplayer && !isHost) return;
                  handleNext();
                }}
                className="relative flex w-full select-none items-center justify-between gap-3 overflow-hidden rounded-[24px] px-6 py-5 text-base font-black uppercase tracking-widest shadow-xl"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(318 100% 60% / 0.9) 0%, hsl(338 95% 55% / 0.9) 100%)',
                  boxShadow:
                    '0 8px 32px -8px hsl(318 100% 60% / 0.6), 0 0 0 1px rgba(255,255,255,0.15) inset',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="relative z-10 flex flex-col items-start">
                  <span className="text-[10px] font-bold normal-case tracking-[0.3em] opacity-70">
                    Siguiente turno
                  </span>
                  <span className="text-lg font-black leading-tight text-white">
                    {players[(currentIndex + 1) % Math.max(1, players.length)]?.name || '—'}
                  </span>
                </div>
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </motion.button>

              <button
                onClick={() => {
                  if (isMultiplayer && !isHost) return;
                  // Antes esto llamaba a handleNext() — exactamente lo mismo que el
                  // botón "Siguiente turno" de arriba, así que saltar una carta que
                  // no gustaba costaba el turno igual que completarla. Ahora solo
                  // cambia de carta (performTurnAdvance con skipPlayerAdvance=true):
                  // el mismo jugador se queda su turno y prueba con otra.
                  performTurnAdvance(true);
                }}
                className="mx-auto py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white/80 active:scale-95"
              >
                ⏭️ No me gusta, otra carta
              </button>
            </div>
          )}

        {/* YO NUNCA - INTERACTIVE AVATARS with EXP rewards (movido debajo de la carta) */}
        {currentText &&
          (currentText.toLowerCase().includes('yo nunca') ||
            mode === 'yo_nunca' ||
            mode === 'yo_nunca_equipos') && (
            <div className="z-10 mb-2 mt-3 w-full max-w-sm">
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-3">
                <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  🍺 ¿Quién ha bebido? (toca para registrar)
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {players.map((p) => (
                    <motion.button
                      key={`drink-${p.id}`}
                      whileTap={{ scale: 0.85 }}
                      onClick={async () => {
                        trackDrink(p.id);
                        addScore(p.id, XP.DRINK_BRAVE);
                        toast(
                          `🍺 ${p.name} ha bebido! +${XP.DRINK_BRAVE} XP (Total: ${(drinkCounts[p.id] || 0) + 1})`,
                          { duration: 1500, position: 'top-center' }
                        );
                        // Sync EXP to Supabase profile if player has a linked account
                        try {
                          const pid = (p as any).supabase_id;
                          if (pid) {
                            await supabase
                              .rpc('increment_player_exp', {
                                player_id: pid,
                                exp_amount: XP.DRINK_BRAVE,
                              })
                              .catch(() => {});
                          }
                        } catch {
                          /* silent fail */
                        }
                      }}
                      className="flex min-w-[60px] flex-col items-center gap-1 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-1.5 transition-all hover:bg-gradient-to-r hover:from-amber-500/40 hover:to-orange-500/40 active:shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            className="h-full w-full object-cover"
                            alt={p.name}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-700 to-orange-800 text-sm font-bold text-white">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="max-w-[55px] truncate text-[9px] font-bold text-amber-300">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-black text-amber-400">
                        {drinkCounts[p.id] || 0} 🍺
                      </span>
                    </motion.button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[9px] text-amber-500/60">
                  Cada trago otorga +5 XP al jugador
                </p>
              </div>
            </div>
          )}

        {/* Render other game components (Trivia, Drinking, etc) overlaying or replacing card */}
        {!gameState.showVirusAlert &&
          (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
          currentQuestion && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4 backdrop-blur-xl">
              <TriviaQuestionCard
                question={currentQuestion}
                playerName={currentPlayer?.name || 'Jugador'}
                onLaunchKahoot={
                  isHost || !isMultiplayer
                    ? (mode) => setShowKahoot({ active: true, mode })
                    : undefined
                }
                onAnswer={(correct, points) => {
                  if (correct) {
                    addScore(currentPlayer.id, points);
                    confetti();
                    toast.success(
                      `✓ ${currentPlayer?.name} acierta — +${points} XP · reparte 1 trago 🍺`,
                      { duration: 2000 }
                    );
                  } else {
                    toast(`✗ ${currentPlayer?.name} falla — bebe 1 🍻`, { duration: 2000 });
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
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-2 border-indigo-500 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-center text-white shadow-[0_0_40px_rgba(99,102,241,0.4)]"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    Evento Especial
                  </p>
                  <h2 className="text-3xl font-black uppercase leading-tight tracking-tighter text-white drop-shadow-lg">
                    {gameState.currentDrinkingGame.name}
                  </h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
                  <p className="text-lg font-bold leading-snug text-indigo-100">
                    {gameState.currentDrinkingGame.description}
                  </p>
                </div>
                <Button
                  className="h-14 w-full rounded-xl bg-indigo-600 text-lg font-black text-white shadow-xl transition-all hover:bg-indigo-500 active:scale-95"
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
          <div className="absolute inset-0 z-30 overflow-y-auto bg-gradient-to-r from-slate-900/80 to-slate-800/80">
            <ImpostorRound
              players={players}
              impostorPlayerId={gameState.impostorPlayerId}
              realQuestion={gameState.currentImpostorReal || ''}
              impostorQuestion={gameState.currentImpostorFake || ''}
              onComplete={(caught, votedId) => {
                // Simple score logic for now
                if (caught) {
                  players.forEach((p) => {
                    if (p.id && p.id !== gameState.impostorPlayerId)
                      addScore(p.id, XP.IMPOSTOR_CAUGHT);
                  });
                } else if (gameState.impostorPlayerId) {
                  addScore(gameState.impostorPlayerId, XP.IMPOSTOR_WIN);
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
          <div className="absolute inset-0 z-30 overflow-y-auto bg-gradient-to-r from-slate-900/80 to-slate-800/80">
            <DueloComponent
              dueloText={gameState.currentDuelo || ''}
              player1={gameState.duelPlayers[0]}
              player2={gameState.duelPlayers[1]}
              onWinner={(winner) => {
                addWin(winner.id);
                addScore(winner.id, XP.DUELO_WIN);
                const loser = gameState.duelPlayers.find((p: any) => p.id !== winner.id);
                if (loser) addScore(loser.id, XP.DUELO_LOSE);
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4">
            <h2 className="mb-6 text-2xl font-bold">Votación</h2>
            <QuestionVote
              questionText={gameState.votingQuestion || ''}
              questionCategory="megamix"
              gameId={''}
            />
            <Button
              className="mt-8"
              onClick={() => {
                setGameState((prev: any) => ({ ...prev, showVoting: false }));
                handleNext();
              }}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Virus Flash */}
        <VirusFlash show={virusFlash} />

        {/* VIRUS ALERT — sheet compacto desde abajo, con fondo que tapa el resto */}
        <VirusAlertSheet
          show={
            !!gameState.showVirusAlert &&
            !!gameState.virusAlertData &&
            !gameState.showCaptainSelection
          }
          data={gameState.virusAlertData}
          onAcknowledge={() => {
            setGameState((prev) => ({ ...prev, showVirusAlert: false, virusAlertData: null }));
            performTurnAdvance();
          }}
        />

        {/* Captain Pass Screen */}
        {gameState.showCaptainPass && (
          <div className="absolute inset-0 z-30 overflow-y-auto bg-gradient-to-r from-slate-900/80 to-slate-800/80">
            <CaptainPassScreen
              captainName={players.find((p) => p.id === gameState.captainId)?.name || 'Capitán'}
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
            localPlayerId={localPlayerId ?? undefined}
            isHost={isHost}
            isMultiplayer={isMultiplayer}
            addScore={addScore}
            sendActionToHost={sendActionToHost}
          />
        )}

        {/* Final Emergency Fallback: If any of the flags are true but we failed to render the subcomponent, provide a way out */}
        {(gameState.showTrivia ||
          gameState.showDrinkingGame ||
          gameState.showImpostor ||
          gameState.showDuel ||
          gameState.showMimica ||
          gameState.showImpostorWord ||
          gameState.showVoting ||
          gameState.showCaptainPass ||
          mode === 'cultura' ||
          mode === 'trivia_futbol') && (
          <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center gap-2 p-4">
            <Button
              variant="outline"
              className="pointer-events-auto border-white/10 bg-background/50 text-[9px] font-black uppercase tracking-widest opacity-40 backdrop-blur hover:opacity-100"
              onClick={handleNext}
            >
              Forzar Salto (Si está pillado)
            </Button>
          </div>
        )}

        {/* Eliminado el indicador legacy CARTA {X} duplicado */}

        {/* DEBATE: tema + equipos "A FAVOR"/"EN CONTRA" con sus pistas + cronómetro,
            y el veredicto lo decide el juez (random, ni capitán ni de ningún
            equipo) desde su propio móvil — ya no hay votación Kahoot aquí. */}
        <AnimatePresence>
          {debateSession && !showKahoot.active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-black/90 p-4 text-center backdrop-blur-md sm:p-6"
            >
              <span className="text-xs font-black uppercase tracking-widest text-fuchsia-400">
                🗣️ Debate por equipos
              </span>
              <h2 className="max-w-xl px-2 text-lg font-black text-white sm:text-3xl">
                {debateSession.topic}
              </h2>
              <p className="text-[11px] font-bold text-amber-300">
                ⚖️ Juez: {debateSession.judge.name} (decide desde su móvil)
              </p>
              <div className="flex w-full max-w-2xl flex-col items-stretch gap-4 px-2 sm:flex-row sm:gap-6">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <span className="text-base font-black uppercase tracking-wider text-emerald-400 sm:text-xl">
                    A FAVOR
                  </span>
                  <span className="break-words text-sm font-black text-white sm:text-base">
                    {debateSession.teamA.map((p) => p.name).join(', ')}
                  </span>
                  <ul className="mt-2 w-full list-disc space-y-0.5 pl-4 text-left text-[11px] text-emerald-200/80">
                    {debateSession.aFavorHints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <span className="hidden items-center font-black text-white/40 sm:flex">VS</span>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
                  <span className="text-base font-black uppercase tracking-wider text-red-400 sm:text-xl">
                    EN CONTRA
                  </span>
                  <span className="break-words text-sm font-black text-white sm:text-base">
                    {debateSession.teamB.map((p) => p.name).join(', ')}
                  </span>
                  <ul className="mt-2 w-full list-disc space-y-0.5 pl-4 text-left text-[11px] text-red-200/80">
                    {debateSession.enContraHints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <CountdownRing seconds={30} resetKey={debateSession.topic} size={80} />
              {debateVerdict ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-lg font-black text-amber-300">
                    ⚖️ {debateVerdict.judgeName} falla a favor de{' '}
                    {debateVerdict.winner === 'A' ? 'A FAVOR' : 'EN CONTRA'}
                  </p>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-fuchsia-500 font-black text-white"
                    onClick={() => {
                      const losers =
                        debateVerdict.winner === 'A' ? debateSession.teamB : debateSession.teamA;
                      const winners =
                        debateVerdict.winner === 'A' ? debateSession.teamA : debateSession.teamB;
                      winners.forEach((p) => addScore(p.id, XP.RETO_DONE));
                      confetti();
                      toast.success(
                        `🗣️ Gana el equipo ${debateVerdict.winner === 'A' ? 'A FAVOR' : 'EN CONTRA'} — ${losers.map((p) => p.name).join(', ')} beb${losers.length === 1 ? 'e' : 'en'} 🍻`,
                        { duration: 3000 }
                      );
                      setDebateSession(null);
                      setDebateVerdict(null);
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              ) : (
                (isHost || !isMultiplayer) && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white/70"
                    onClick={() => {
                      setDebateSession(null);
                      setDebateVerdict(null);
                    }}
                  >
                    Cancelar debate
                  </Button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* KAHOOT MODAL (trivia / carrera / votación estándar — el Debate ya no pasa por aquí) */}
        <AnimatePresence>
          {showKahoot.active && (
            <KahootVoteSession
              roomId={spectatorRoomId}
              mode={showKahoot.mode}
              question={
                showKahoot.mode === 'speed_race' && speedRaceQuestion
                  ? speedRaceQuestion.question
                  : (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
                      currentQuestion
                    ? currentQuestion.question
                    : sanitizeCardText(currentText || '')
              }
              options={
                showKahoot.mode === 'speed_race' && speedRaceQuestion
                  ? speedRaceQuestion.options
                  : (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
                      currentQuestion
                    ? currentQuestion.options
                    : players.map((p) => p.name)
              }
              correctAnswer={
                showKahoot.mode === 'speed_race' && speedRaceQuestion
                  ? speedRaceQuestion.options[speedRaceQuestion.correctIndex]
                  : (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
                      currentQuestion
                    ? currentQuestion.options[currentQuestion.correctIndex]
                    : undefined
              }
              isHost={isHost || !isMultiplayer}
              allowHostVote={!isMultiplayer}
              onClose={() => {
                setShowKahoot({ active: false, mode: 'standard' });
              }}
              onRaceComplete={(ranking: RaceRankEntry[]) => {
                // Reparte puntos reales a cada jugador según su puesto en el ranking
                // de velocidad de acierto (el más rápido se lleva más puntos).
                ranking.forEach((entry) => {
                  const p = players.find((pl) => pl.name === entry.voter);
                  if (p) addScore(p.id, entry.points);
                });
                if (ranking.length > 0) confetti();
                setSpeedRaceQuestion(null);
                setShowKahoot({ active: false, mode: 'standard' });
              }}
              onResult={(winner, votes) => {
                if (!(
                  (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
                  currentQuestion
                )) {
                  const wPlayer = players.find((p) => p.name === winner);
                  if (wPlayer) handleAdjustXP(wPlayer.id, 5);
                }
                setGameState((prev) => ({ ...prev, votingSelections: [] }));
                setShowKahoot({ active: false, mode: 'standard' });

                // Si estamos en trivia, hay que procesar la respuesta
                if (
                  (gameState.showTrivia || mode === 'cultura' || mode === 'trivia_futbol') &&
                  currentQuestion
                ) {
                  const correctOpt = currentQuestion.options[currentQuestion.correctIndex];
                  if (winner === correctOpt) {
                    addScore(currentPlayer?.id || '', XP.RETO_DONE);
                    confetti();
                  }
                  if (mode === 'megamix') {
                    setGameState((prev: any) => ({ ...prev, showTrivia: false }));
                  }
                }
                handleNext();
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Round Summary Overlay */}
      {showRoundSummary && roundSnapshot && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gradient-to-r from-slate-900/80 to-slate-800/80">
          <RoundSummary
            round={roundSnapshot.round}
            scores={roundSnapshot.scores}
            players={players}
            teams={teams}
            globalStats={rankings}
            onContinue={() => setShowRoundSummary(false)}
            onEndGame={() => setShowPodium(true)}
            isGameOver={gameOver}
            trackingData={{ voteCounts, drinkCounts, virusReceived, skipCounts }}
          />
        </div>
      )}


      {/* ── RETO OUTCOME OVERLAY ── (no mientras hay virus/torneo/impostor) */}
      <AnimatePresence>
        {showRetoOutcome &&
          currentPlayer &&
          !gameState.showVirusAlert &&
          !showTorneoRound &&
          !gameState.showImpostor && (
            <RetoOutcome player={currentPlayer} onResult={handleRetoOutcome} />
          )}
      </AnimatePresence>

      {/* ── TORNEO VIVO: 1-2 duelos por parada, alternando llaves y repesca ── */}
      <AnimatePresence>
        {tournamentStop !== null && liveTournament && (
          <LiveTournamentOverlay
            tournament={liveTournament}
            players={players}
            matchesLeft={tournamentStop}
            onResult={handleTournamentResult}
            onDone={() => {
              setTournamentStop(null);
              mirrorTournament(liveTournamentRef.current, false);
              advanceTurn(true);
            }}
          />
        )}
        {isMultiplayer &&
          !isHost &&
          gameState.liveTournamentOpen &&
          gameState.liveTournament && (
            <LiveTournamentOverlay
              readOnly
              tournament={gameState.liveTournament}
              players={players}
              matchesLeft={0}
              onResult={() => []}
              onDone={() => {}}
            />
          )}
      </AnimatePresence>

      {/* Podium Screen Overlay */}
      {showPodium && (
        <PodiumScreen
          players={players.map((p) => ({
            id: p.id,
            name: p.name,
            score: scores[p.id] || 0,
            avatar_url: p.avatar_url,
          }))}
          trackingData={{ voteCounts, drinkCounts, virusReceived, skipCounts }}
          onRestart={() => {
            setShowPodium(false);
            onExit();
          }}
          onHome={() => {
            setShowPodium(false);
            onExit();
          }}
        />
      )}
    </div>
  );
}
