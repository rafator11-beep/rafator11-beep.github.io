import { useState, useMemo, useEffect, useCallback } from 'react';
import { Player, Team, GameMode } from '@/types/game';
import { useGameContext } from '@/contexts/GameContext';

export interface GameState {
  phase: 'setup' | 'playing' | 'voting' | 'results' | 'minigame' | 'game_over';
  round: number;
  currentCardIndex: number;
  players: Player[];
  deck: any[];
  currentCard: any | null;
  showNormaReveal: boolean;
  showVirusReveal: boolean;
  currentNorma: string | null;
  currentNormaTurnsRemaining?: number;
  showDuel: boolean;
  showVoting: boolean;
  showImpostor: boolean;
  showTrivia: boolean;
  showDrinkingGame: boolean;
  showMimica: boolean;
  showMimicaReveal: boolean;
  showImpostorWord: boolean;
  showCaptainPass: boolean;
  showVirusAlert: boolean;
  showVirusCycleAlert?: boolean; // Added
  showImpostorWarning?: boolean;
  showCaptainSelection?: boolean; // Added
  showCaptainDecision?: boolean; // Added
  showNormaGlobal?: boolean; // Norma global overlay
  virusPlayerId: string | null;

  // Data for specific screens
  currentDrinkingGame: any | null;
  currentMimicaText: string | null;
  currentImpostorWord: string | null;
  votingQuestion: string | null;
  duelPlayers: Player[];
  currentDuelo: string | null;
  currentImpostorReal: string | null;
  currentImpostorFake: string | null;
  impostorPlayerId: string | null;
  impostorData?: {
    currentImpostorReal: string | null;
    currentImpostorFake: string | null;
    impostorPlayerId: string | null;
  };
  captainId: string | null;
  virusAlertData: { player: Player; virus: any } | null;
  virusCycleData?: { type: string; title: string; message: string }; // Added

  // Yo Nunca Equipos State
  yoNuncaEquiposPhase?: 'idle' | 'truth_phase' | 'guess_phase' | 'result_phase';
  yoNuncaTargetTeamId?: string | null;
  yoNuncaTruthVotes?: Record<string, boolean>;
  yoNuncaGuessVotes?: Record<string, boolean>;

  // Voting State
  votingSelections?: string[]; // Array of player IDs selected in voting mode
}

export const useGameEngine = (mode: GameMode) => {
  const { players, teams } = useGameContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gamesWon, setGamesWon] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSnapshot, setRoundSnapshot] = useState<{ round: number; scores: Record<string, number> } | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    round: 1,
    currentCardIndex: 0,
    players: players,
    deck: [],
    currentCard: null,
    showNormaReveal: false,
    showVirusReveal: false,
    currentNorma: null,
    currentNormaTurnsRemaining: 0,
    showDuel: false,
    showVoting: false,
    showImpostor: false,
    showTrivia: false,
    showDrinkingGame: false,
    showMimica: false,
    showMimicaReveal: false,
    showImpostorWord: false,
    showCaptainPass: false,
    showVirusAlert: false,
    showVirusCycleAlert: false,
    showImpostorWarning: false,
    showCaptainDecision: false,
    showCaptainSelection: mode === 'megamix' || mode === 'clasico',
    showNormaGlobal: false,
    virusPlayerId: null,
    currentDrinkingGame: null,
    currentMimicaText: null,
    currentImpostorWord: null,
    votingQuestion: null,
    duelPlayers: [],
    currentDuelo: null,
    currentImpostorReal: null,
    currentImpostorFake: null,
    impostorPlayerId: null,
    impostorData: {
      currentImpostorReal: null,
      currentImpostorFake: null,
      impostorPlayerId: null,
    },
    captainId: null,
    virusAlertData: null,
    virusCycleData: undefined,
    yoNuncaEquiposPhase: 'idle',
    yoNuncaTargetTeamId: null,
    yoNuncaTruthVotes: {},
    yoNuncaGuessVotes: {},
    votingSelections: [],
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem('partyGameScores');
    const savedGames = localStorage.getItem('partyGameWins');
    if (savedScores) setScores(JSON.parse(savedScores));
    if (savedGames) setGamesWon(JSON.parse(savedGames));
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    localStorage.setItem('partyGameScores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem('partyGameWins', JSON.stringify(gamesWon));
  }, [gamesWon]);

  // Derived state
  const currentPlayer = players[currentPlayerIndex];

  const playersWithScore = useMemo(() => {
    return players.map(p => ({ ...p, score: scores[p.id] || 0 }));
  }, [players, scores]);

  const teamsWithScore: Team[] = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    const sums = new Map<string, number>();
    for (const p of playersWithScore) {
      if (!p.team_id) continue;
      sums.set(p.team_id, (sums.get(p.team_id) || 0) + (p.score || 0));
    }
    return teams.map(t => ({ ...t, score: sums.get(t.id) || 0 }));
  }, [teams, playersWithScore]);

  const hasTeams = useMemo(() => {
    return (teamsWithScore?.length || 0) > 0 && playersWithScore.some(p => !!p.team_id);
  }, [teamsWithScore, playersWithScore]);

  const advanceTurn = useCallback((skipPlayerAdvance: boolean = false) => {
    setCurrentIndex(prev => prev + 1);

    setGameState(prev => {
      // 1. Check if we completed a full circle of players
      // We use current round to check for game over
      // Bugfix: Solo finaliza la ronda si realmente vamos a avanzar de jugador
      const isEndOfRound = !skipPlayerAdvance && (currentPlayerIndex + 1) % players.length === 0;
      let nextState = { ...prev };

      if (isEndOfRound) {
        const nextRound = prev.round + 1;

        // Check Game Over Condition with fresh value
        if (nextRound > 20) {
          setGameOver(true);
        }

        // Norma cambia cada 3 rondas completas
        let showNormaGlobal = prev.showNormaGlobal;
        if (nextRound % 3 === 0) {
          showNormaGlobal = true;
        }

        // Virus cambia cada 5 rondas completas
        let nextVirusId = prev.virusPlayerId;
        if (nextRound % 5 === 0 && players.length > 0) {
          const currentIndex = players.findIndex(p => p.id === prev.virusPlayerId);
          const nextIndex = (currentIndex + 1) % players.length;
          nextVirusId = players[nextIndex].id;
        }

        nextState = {
          ...nextState,
          round: nextRound,
          showNormaGlobal,
          virusPlayerId: nextVirusId
        };
      }

      // 2. Handle Norma Turn Expiration (solo se descuenta si avanza el turno real)
      if (!skipPlayerAdvance && nextState.currentNorma && nextState.currentNormaTurnsRemaining && nextState.currentNormaTurnsRemaining > 0) {
        const nextTurns = nextState.currentNormaTurnsRemaining - 1;
        if (nextTurns === 0) {
          nextState = { ...nextState, currentNorma: null, currentNormaTurnsRemaining: 0 };
        } else {
          nextState = { ...nextState, currentNormaTurnsRemaining: nextTurns };
        }
      }

      return nextState;
    });

    if (!skipPlayerAdvance) {
      setCurrentPlayerIndex(prev => (prev + 1) % players.length);
    }
  }, [players.length, currentPlayerIndex]);

  const addScore = (playerId: string, points: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + points)
    }));
  };

  const handleGameEnd = async () => {
    // 1. Calculate Session Stats for Titles
    // This would typically involve data from useGameEffects and trackings in PartyGame
    // For this implementation, we'll mark the game as over and let PartyGame handle the sync
    setGameOver(true);
    setRoundSnapshot({
      round: gameState.round,
      scores: { ...scores }
    });
  };

  const addWin = (playerId: string) => {
    setGamesWon(prev => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1
    }));
  };

  return {
    players,
    teams,
    currentPlayer,
    currentIndex,
    setCurrentIndex,
    currentPlayerIndex,
    setCurrentPlayerIndex,
    scores,
    setScores,
    gamesWon,
    setGamesWon,
    gameOver,
    setGameOver,
    gameState,
    setGameState,
    playersWithScore,
    teamsWithScore,
    hasTeams,
    advanceTurn,
    addScore,
    addWin,
    handleGameEnd,
    showRoundSummary,
    setShowRoundSummary,
    roundSnapshot,
    setRoundSnapshot
  };
};
