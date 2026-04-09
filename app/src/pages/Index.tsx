import { useState, useEffect, Suspense, lazy } from 'react';
import { useGSAPFlash } from '@/hooks/useGSAPFlash';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Smartphone, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { FiestaTab } from '@/components/game/FiestaTab';
import { JuegoTab } from '@/components/game/JuegoTab';
import { TeamModeSelector } from '@/components/game/TeamModeSelector';
import { SplashScreen } from '@/components/SplashScreen';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import { GameMode, GAME_MODES, TabId, PlayMode } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionDot } from '@/components/multiplayer/ConnectionDot';
import { FeedbackDialog } from '@/components/game/FeedbackDialog';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthOverlay } from '@/components/auth/AuthOverlay';
import { GlobalPresence } from '@/components/auth/GlobalPresence';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatComponent } from '@/components/multiplayer/ChatComponent';
import { DailyVideoProvider } from '@/components/multiplayer/DailyVideoProvider';

const GamePlay = lazy(() => import('@/components/game/GamePlay').then(m => ({ default: m.GamePlay })));
const LobbyScreen = lazy(() => import('@/components/multiplayer/LobbyScreen').then(m => ({ default: m.LobbyScreen })));
const PlayerSetup = lazy(() => import('@/components/game/PlayerSetup').then(m => ({ default: m.PlayerSetup })));
const GuestSetup = lazy(() => import('@/components/game/GuestSetup').then(m => ({ default: m.GuestSetup })));

type AppTab = 'inicio' | 'perfiles' | 'jugar' | 'historial' | 'ajustes' | 'arcade' | 'hall';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Lazy load heavy/non-critical pages to avoid circular dependencies and reduce bundle size
const Profiles = lazy(() => import('@/pages/Profiles'));
const GameHistory = lazy(() => import('@/pages/GameHistory').then(module => ({ default: module.GameHistory })));
const AppSettings = lazy(() => import('@/pages/AppSettings').then(module => ({ default: module.AppSettings })));
const ArcadeTab = lazy(() => import('@/components/arcade/ArcadeTab').then(module => ({ default: module.ArcadeTab })));
const HallOfFame = lazy(() => import('@/pages/HallOfFame').then(module => ({ default: module.HallOfFame })));

export type GameScreen = 'mode-select' | 'team-mode-select' | 'player-setup' | 'playing' | 'lobby' | 'guest-setup';

// Modes that support team play
const TEAM_CAPABLE_MODES: GameMode[] = ['cultura', 'trivia_futbol', 'futbol', 'yo_nunca'];

function GameAppInner() {
  const [screen, setScreen] = useState<GameScreen>('mode-select');
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [mainTab, setMainTab] = useState<TabId>('fiesta');
  const { fire: flashScreen } = useGSAPFlash('rgba(139,92,246,0.35)');
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Multiplayer State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [pendingTeamMembers, setPendingTeamMembers] = useState<any[]>([]);

  // We need auth context for economy checks
  const { profile } = useAuth();

  const [pendingPlayer, setPendingPlayer] = useState<{ name: string, avatar: string } | null>(null);

  // New state for Mode Options (Local vs Online)
  const [selectedModeForOptions, setSelectedModeForOptions] = useState<GameMode | null>(null);
  const [pendingHostMode, setPendingHostMode] = useState<GameMode | null>(null);
  const [pendingBetMode, setPendingBetMode] = useState<{ mode: GameMode, isOnline: boolean } | null>(null);

  // Game Context
  const { createGame, setGameId, players, localPlayerId, gameId, addPlayer, game, createTeam, assignPlayerToTeam, setLocalPlayerId } = useGameContext();


  // Auto-detect Join URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('lobby');
    }
  }, []);

  // Konami Code Easter Egg
  useEffect(() => {
    let keys: string[] = [];
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    const handler = (e: KeyboardEvent) => {
      keys.push(e.key);
      keys = keys.slice(-10);
      if (keys.join('') === konami.join('')) {
        toast.info("🎮 ¡Arcade Mode ACTIVATED!", {
          description: "Has desbloqueado un potenciador visual secreto.",
          duration: 5000,
        });
        document.body.classList.add('beep-glow-active');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sync localPlayerId with authenticated user
  useEffect(() => {
    if (profile?.id && setLocalPlayerId && localPlayerId !== profile.id) {
      console.log("Syncing localPlayerId with authenticated profile:", profile.id);
      setLocalPlayerId(profile.id);
    }
  }, [profile?.id, setLocalPlayerId, localPlayerId]);

  // Auto-Join when Game Starts (if pending data exists)
  useEffect(() => {
    const checkPendingJoin = async () => {
      if (gameId && !isHost && !localPlayerId) {
        const pendingName = sessionStorage.getItem('pending_player_name');
        const pendingAvatar = sessionStorage.getItem('pending_player_avatar');
        const setupCompleted = sessionStorage.getItem('guest_setup_completed');
        const pendingTeamMembers = sessionStorage.getItem('pending_team_members');
        const pendingGameMode = sessionStorage.getItem('pending_game_mode');

        if (pendingName && setupCompleted) {
          try {
            console.log("Auto-joining pending player:", pendingName);
            const captain = await addPlayer(pendingName, pendingAvatar || undefined);
            if (captain && setLocalPlayerId) {
              setLocalPlayerId(captain.id);
            }

            // Handle team creation for yo_nunca_equipos
            if (pendingGameMode === 'yo_nunca_equipos' && captain) {
              const teamColor = '#10b981';
              const team = await createTeam(`Equipo de ${pendingName}`, teamColor);
              await assignPlayerToTeam(captain.id, team.id);

              if (pendingTeamMembers) {
                try {
                  const members = JSON.parse(pendingTeamMembers);
                  for (const member of members) {
                    const mdp = await addPlayer(member.name);
                    if (mdp) await assignPlayerToTeam(mdp.id, team.id);
                  }
                } catch (e) {
                  console.error("Error adding team members:", e);
                }
              }
              toast.success('¡Equipo creado y unido con éxito!');
            } else {
              toast.success('¡Te has unido automáticamente a la partida!');
            }

            sessionStorage.removeItem('guest_setup_completed');
            sessionStorage.removeItem('pending_player_name');
            sessionStorage.removeItem('pending_player_avatar');
            sessionStorage.removeItem('pending_team_members');
            sessionStorage.removeItem('pending_game_mode');
          } catch (e) {
            console.error("Auto-join error:", e);
          }
        }
      }
    };
    checkPendingJoin();
  }, [gameId, isHost, localPlayerId, addPlayer, createTeam, assignPlayerToTeam, setLocalPlayerId]);

  const handleModeClick = (mode: GameMode) => {
    flashScreen();
    if (mode === 'poker' || mode === 'parchis') {
      setPendingBetMode({ mode, isOnline: true });
      return;
    }
    setSelectedModeForOptions(mode);
  };

  const handleJuegoTabSelect = (mode: GameMode, playMode: PlayMode) => {
    if (mode === 'poker' || mode === 'parchis') {
      setPendingBetMode({ mode, isOnline: playMode === 'online' });
      return;
    }
    if (playMode === 'online') {
      setPendingHostMode(mode);
      setScreen('lobby');
    } else {
      handleSelectMode(mode);
    }
  };

  const confirmModeSelection = async (isOnline: boolean) => {
    if (!selectedModeForOptions) return;

    try {
      if (isOnline) {
        // ONLINE: Set pending mode and go to Lobby.
        // LobbyScreen will see "initialMode" and auto-trigger "Create Room".
        setPendingHostMode(selectedModeForOptions);
        setScreen('lobby');
      } else {
        // LOCAL: Create game immediately
        await handleSelectMode(selectedModeForOptions);
      }
    } catch (error) {
      console.error("Error confirming mode selection:", error);
      toast.error("Hubo un error al iniciar el modo. Inténtalo de nuevo.");
    } finally {
      setSelectedModeForOptions(null);
    }
  };

  const handleSelectMode = async (mode: GameMode) => {
    if (TEAM_CAPABLE_MODES.includes(mode)) {
      setPendingMode(mode);
      setScreen('team-mode-select');
      return;
    }

    try {
      const newGame = await createGame(mode);
      setGameId(newGame.id);
      setIsTeamMode(mode === 'yo_nunca_equipos');
      setScreen('player-setup');
    } catch (err) {
      console.error('Error creating game:', err);
      toast.error("Error al crear la partida. Inténtalo de nuevo.");
    }
  };

  const handleEnterLobby = () => {
    setScreen('lobby');
  };

  const handleTeamModeSelect = async (teamPlay: boolean) => {
    if (!pendingMode) return;
    try {
      const newGame = await createGame(pendingMode);
      setGameId(newGame.id);
      setIsTeamMode(teamPlay);
      setScreen('player-setup');
    } catch (err) {
      console.error('Error creating game:', err);
      toast.error("Error al crear la partida. Inténtalo de nuevo.");
    }
  };

  const handleStartGame = async () => {
    if (isHost && roomId) {
      try {
        await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
      } catch (err) {
        console.error('Failed to update room status:', err);
      }
    }
    setScreen('playing');
  };

  const handleBack = () => {
    if (screen === 'team-mode-select') {
      setScreen('mode-select');
      setPendingMode(null);
    } else if (screen === 'lobby') {
      setScreen('mode-select');
      setSelectedModeForOptions(null);
      setPendingHostMode(null);
    } else {
      setScreen('mode-select');
      setGameId(null);
    }
  };

  const handleExit = async () => {
    if (isHost && roomId) {
      try {
        await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
      } catch (e) {
        console.error(e);
      }
    }
    setScreen('mode-select');
    setActiveTab('inicio');
    setGameId(null);
    setRoomId(null);
    setIsHost(false);
    setIsTeamMode(false);
    setSelectedModeForOptions(null);
    setPendingPlayer(null);
  };

  const handleRejoinGame = async (gameId: string, mode: string) => {
    try {
      const { data: gameData } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();

      if (gameData?.status === 'finished') {
        await supabase
          .from('games')
          .update({ status: 'playing' })
          .eq('id', gameId);
      }

      setGameId(gameId);
      setIsTeamMode(false);
      setActiveTab('inicio');
      setScreen('playing');
    } catch (err) {
      console.error('Error rejoining game:', err);
    }
  };

  const handleTabChange = (tab: AppTab) => {
    if (tab === 'jugar') {
      setActiveTab('inicio');
      setScreen('mode-select');
    } else {
      setActiveTab(tab);
      if (screen !== 'mode-select') {
        setScreen('mode-select');
        setGameId(null);
      }
    }
  };

  // MULTIPLAYER LISTENER FOR GUESTS
  useEffect(() => {
    if (!roomId || isHost) return;

    // Helper: check if guest already completed setup
    const hasCompletedSetup = () => !!pendingPlayer || !!sessionStorage.getItem('guest_setup_completed');

    // Hard Sync: Fetch current room state immediately upon joining
    const syncCurrentState = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('game_mode, status, current_game_id')
        .eq('id', roomId)
        .single();

      if (roomData) {
        if (roomData.current_game_id) setGameId(roomData.current_game_id);

        // If game is already playing, jump in if we have profile
        if (roomData.status === 'playing' && localPlayerId) {
          setScreen('playing');
        } else if (roomData.status === 'setup' && !localPlayerId && screen !== 'guest-setup' && !hasCompletedSetup()) {
          // Only redirect to guest-setup if guest hasn't completed it yet
          setScreen('guest-setup');
        }
      }
    };
    syncCurrentState();

    const channel = supabase.channel(`room:${roomId}`);
    channel
      .on('broadcast', { event: 'game_state' }, async ({ payload }) => {
        if (payload.mode && payload.gameId) {
          console.log("Host broadcasted state:", payload);
          try {
            setGameId(payload.gameId);

            if (payload.status === 'setup' || !localPlayerId) {
              // Only redirect to guest-setup if guest hasn't completed it yet
              if (!localPlayerId && screen !== 'guest-setup' && !hasCompletedSetup()) {
                setScreen('guest-setup');
              }
              // Don't return early if guest has completed setup - let auto-join handle it
              if (!hasCompletedSetup()) return;
            }

            if (payload.status === 'playing' || payload.event === 'poker_state' || screen === 'lobby') {
              setScreen('playing');
            }
          } catch (e) {
            console.error("Error joining game:", e);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, screen, setGameId, isHost, localPlayerId, pendingPlayer]);

  // MULTIPLAYER BROADCAST FOR HOST (Keep Alive for late joiners)
  useEffect(() => {
    // Run as long as the host has a room and gameId, even during 'playing'
    if (isHost && roomId && gameId) {
      const channel = supabase.channel(`room:${roomId}`);
      let interval: NodeJS.Timeout;

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast state every 2 seconds for late joiners
          const broadcastSetup = () => {
            channel.send({
              type: 'broadcast',
              event: 'game_state',
              payload: {
                mode: game?.mode || pendingHostMode,
                gameId: gameId,
                status: screen === 'player-setup' ? 'setup' : 'playing'
              }
            });
          };

          broadcastSetup(); // initial
          interval = setInterval(broadcastSetup, 2000);
        }
      });

      return () => {
        if (interval) clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [isHost, roomId, screen, gameId, game?.mode, pendingHostMode]);


  const getScreenContent = () => {
    switch (screen) {
      case 'playing':
        return (
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-arcade animate-pulse"><Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" /> INICIANDO PARTIDA...</div>}>
            <GamePlay onExit={handleExit} isTeamMode={isTeamMode} roomId={roomId} isHost={isHost} />
          </Suspense>
        );

      case 'lobby':
        return (
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /> Entrando al Lobby...</div>}>
            <LobbyScreen
              initialMode={pendingHostMode || undefined}
              initialWaiting={!!roomId && !isHost}
              roomId={roomId}
              currentPlayer={pendingPlayer || undefined}
              onJoin={async (code, host, mode) => {
                setRoomId(code);
                setIsHost(host);
                setPendingHostMode(null);
                // Store roomId in sessionStorage so GuestSetup can detect game mode
                sessionStorage.setItem('current_room_id', code);

                if (host && mode) {
                  try {
                    const validMode = GAME_MODES.find(m => m.id === mode)?.id;
                    if (validMode) {
                      const hostId = localPlayerId || crypto.randomUUID();

                      // 1. Create robust Room in DB
                      await supabase.from('rooms').upsert({
                        id: code,
                        host_id: hostId,
                        game_mode: validMode,
                        status: 'setup'
                      });

                      // 2. Insert host into participants
                      const hPlayer = players.find(p => p.id === localPlayerId);
                      if (hPlayer || localPlayerId) {
                        await supabase.from('room_participants').upsert({
                          room_id: code,
                          player_id: hPlayer?.id || hostId,
                          name: hPlayer?.name || 'Host',
                          avatar_url: hPlayer?.avatar_url || '',
                          is_host: true
                        }).catch(console.error);
                      }

                      const newGame = await createGame(validMode);
                      setGameId(newGame.id);
                      setIsTeamMode(validMode === 'yo_nunca_equipos');

                      // Save current_game_id to rooms table so guests can fetch it
                      await supabase.from('rooms').update({ current_game_id: newGame.id }).eq('id', code);

                      setScreen('player-setup');
                    }
                  } catch (e) {
                    console.error("Error creating game as host:", e);
                  }
                } else {
                  if (!pendingPlayer) {
                    setScreen('guest-setup');
                  } else {
                    // We already have their info, let's insert them and wait in lobby
                    const guestId = localPlayerId || crypto.randomUUID();
                    await supabase.from('room_participants').upsert({
                      room_id: code,
                      player_id: guestId,
                      name: pendingPlayer.name,
                      avatar_url: pendingPlayer.avatar || '',
                      is_host: false
                    }).catch(console.error);
                    setScreen('lobby');
                  }
                }
              }}
              onBack={handleBack}
            />
          </Suspense>
        );

      case 'team-mode-select':
        if (pendingMode) {
          const modeInfo = GAME_MODES.find(m => m.id === pendingMode);
          return (
            <TeamModeSelector
              modeName={modeInfo?.name || ''}
              modeIcon={modeInfo?.icon || '🎮'}
              onSelect={handleTeamModeSelect}
            />
          );
        }
        return null;

      case 'player-setup':
        return (
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /> Configurando jugadores...</div>}>
            <PlayerSetup onStart={handleStartGame} onBack={handleBack} isTeamMode={isTeamMode} isMultiplayer={!!roomId} roomId={roomId} />
          </Suspense>
        );

      case 'guest-setup':
        return (
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /> Modo Invitado...</div>}>
            <GuestSetup
              onJoin={async (name, avatar) => {
                setPendingPlayer({ name, avatar });

                // If we already have a room selected, insert the guest into the DB now
                if (roomId && !isHost) {
                  const guestId = localPlayerId || crypto.randomUUID();
                  await supabase.from('room_participants').upsert({
                    room_id: roomId,
                    player_id: guestId,
                    name: name,
                    avatar_url: avatar || '',
                    is_host: false
                  }).catch(console.error);
                }

                setScreen('lobby');
              }}
              onBack={handleExit}
            />
          </Suspense>
        );

      default:
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${screen}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'inicio' && (
                <>
                  <div className="app-shell pb-4">
                    <div className="surface-panel p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex items-center gap-4">
                          <h1 className="text-xl font-black text-white md:text-2xl font-arcade uppercase tracking-tighter">Elige modo</h1>
                          <ConnectionDot />
                          <FeedbackDialog />
                        </div>

                        {roomId ? (
                          <div className="flex w-full flex-col gap-2 rounded-[20px] border border-[hsl(var(--primary)/0.25)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),transparent)] p-3 md:w-auto md:min-w-[250px]">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Sala activa</p>
                                <p className="mt-1 text-2xl font-black tracking-[0.2em] text-white md:text-3xl">{roomId}</p>
                              </div>
                              <Button
                                variant="outline"
                                className="shrink-0 text-red-300 hover:text-red-200"
                                onClick={() => {
                                  setRoomId(null);
                                  setIsHost(false);
                                }}
                              >
                                Cerrar
                              </Button>
                            </div>
                            <Button
                              variant="secondary"
                              className="w-full"
                              onClick={() => setScreen('lobby')}
                            >
                              Abrir lobby
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            className="w-full md:w-auto"
                            onClick={() => setScreen('lobby')}
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Crear o unirte a sala
                          </Button>
                        )}
                      </div>

                      <div className="mt-4 inline-flex w-full max-w-[380px] rounded-[20px] border border-white/10 bg-white/[0.04] p-1">
                        <button
                          onClick={() => setMainTab('fiesta')}
                          className={`flex-1 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition ${mainTab === 'fiesta'
                            ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                            : 'text-muted-foreground hover:text-white'}`}
                        >
                          Fiesta
                        </button>
                        <button
                          onClick={() => setMainTab('juego')}
                          className={`flex-1 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition ${mainTab === 'juego'
                            ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                            : 'text-muted-foreground hover:text-white'}`}
                        >
                          Competitivo
                        </button>
                      </div>
                    </div>
                  </div>

                  {mainTab === 'fiesta' ? (
                    <FiestaTab onSelectMode={handleModeClick} />
                  ) : (
                    <JuegoTab onSelectMode={handleJuegoTabSelect} />
                  )}
                </>
              )}
              {activeTab === 'perfiles' && (
                <Suspense fallback={<div className="p-8 text-center">Cargando perfiles...</div>}>
                  <Profiles />
                </Suspense>
              )}
              {activeTab === 'historial' && (
                <Suspense fallback={<div className="p-8 text-center text-white font-arcade">Cargando historial...</div>}>
                  <GameHistory onRejoinGame={handleRejoinGame} />
                </Suspense>
              )}
              {activeTab === 'hall' && (
                <Suspense fallback={<div className="p-8 text-center">Cargando salón de la fama...</div>}>
                  <HallOfFame />
                </Suspense>
              )}
              {activeTab === 'ajustes' && (
                <Suspense fallback={<div className="p-8 text-center text-white font-arcade">Cargando ajustes...</div>}>
                  <AppSettings />
                </Suspense>
              )}
              {activeTab === 'arcade' && (
                <Suspense fallback={<div className="p-8 text-center">Cargando Arcade...</div>}>
                  <ArcadeTab />
                </Suspense>
              )}

            </motion.div>
          </AnimatePresence>
        );
    }
  };

  const { isAuthOverlayOpen } = useAuth();

  return (
    <>
      <SplashScreen onComplete={() => setShowSplash(false)} />
      <WhatsNewModal />
      {isAuthOverlayOpen && <WelcomeScreen />}
      <AuthOverlay />
      <GlobalPresence />
      {getScreenContent()}

      {/* ROOM/BET OPTIONS DIALOG (Poker, Parchis) */}
      <Dialog open={!!pendingBetMode} onOpenChange={(o) => !o && setPendingBetMode(null)}>
        <DialogContent className="sm:max-w-xl border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Coins className="text-yellow-400" />
              <span>Elige Sala de Apuestas</span>
            </DialogTitle>
            <DialogDescription>Entra en una sala adaptada a tus fondos. El ganador se lleva la bolsa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {[0, 50, 100, 500].map(amount => (
              <Button
                key={amount}
                variant="outline"
                className="group h-auto min-h-[120px] flex-col items-center justify-center gap-2 rounded-[24px] border-white/10 bg-white/[0.03] p-4 text-center hover:border-yellow-500/40 hover:bg-white/[0.06] transition-all"
                onClick={() => {
                  if (amount > 0 && (profile?.coins || 0) < amount) {
                    toast.error(`Necesitas al menos ${amount} monedas para entrar aquí.`);
                    return;
                  }
                  sessionStorage.setItem('current_bet_amount', amount.toString());
                  const mode = pendingBetMode!.mode;
                  const isOnline = pendingBetMode!.isOnline;
                  setPendingBetMode(null);
                  if (isOnline) {
                    setPendingHostMode(mode);
                    setScreen('lobby');
                  } else {
                    handleSelectMode(mode);
                  }
                }}
              >
                <div className="flex items-center gap-2 text-xl font-black text-white">
                  {amount === 0 ? 'Mesa de Recreo' : `Sala ${amount}M`}
                </div>
                <div className="text-sm font-medium text-yellow-500 flex items-center gap-1">
                  {amount === 0 ? 'Juega Gratis' : <><Coins className="w-4 h-4" /> Coste entrada: {amount}</>}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODE OPTIONS DIALOG (Local vs Online) */}
      <Dialog open={!!selectedModeForOptions} onOpenChange={(o) => !o && setSelectedModeForOptions(null)}>
        <DialogContent className="sm:max-w-xl border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {selectedModeForOptions && GAME_MODES.find(m => m.id === selectedModeForOptions)?.icon}
              <span>{selectedModeForOptions && GAME_MODES.find(m => m.id === selectedModeForOptions)?.name}</span>
            </DialogTitle>
            <DialogDescription id="mode-options-desc">Elige cómo vais a jugar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="group h-auto min-h-[160px] flex-col items-start gap-3 rounded-[24px] border-white/10 bg-white/[0.03] p-4 text-left hover:border-primary/40 hover:bg-white/[0.06] transition-all"
              onClick={() => confirmModeSelection(false)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white group-hover:scale-105 transition-transform">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Mismo dispositivo</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Pasando el móvil.</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group h-auto min-h-[160px] flex-col items-start gap-3 rounded-[24px] border-white/10 bg-white/[0.03] p-4 text-left hover:border-[hsl(var(--accent)/0.4)] hover:bg-white/[0.06] transition-all"
              onClick={() => confirmModeSelection(true)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Con sala online</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Cada persona entra desde su móvil con código.</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Only show BottomNav on main screens (mode-select) */}
      {screen === 'mode-select' && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}


      {/* Global Chat Bubble - Always visible */}
      <ChatComponent
        roomId={roomId || 'global_lobby'}
        playerName={
          // Try to find name in established players
          players.find(p => p.id === localPlayerId)?.name
          // Fallback for Host/Guest
          || (roomId ? (isHost ? 'Anfitrión' : 'Invitado') : `Usuario ${localPlayerId?.slice(0, 4) || 'Guest'}`)
        }
      />
    </>
  );
}

const Index = () => {
  return (
    <GameProvider>
      <DailyVideoProvider>
        <GameAppInner />
      </DailyVideoProvider>
    </GameProvider>
  );
};

export default Index;
