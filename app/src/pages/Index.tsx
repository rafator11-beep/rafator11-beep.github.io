import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Gamepad2, Globe, LayoutGrid, ShieldCheck, Sparkles, Smartphone, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { FiestaTab } from '@/components/game/FiestaTab';
import { JuegoTab } from '@/components/game/JuegoTab';
import { TeamModeSelector } from '@/components/game/TeamModeSelector';
import { PlayerSetup } from '@/components/game/PlayerSetup';
import { GuestSetup } from '@/components/game/GuestSetup';
import { GamePlay } from '@/components/game/GamePlay';
import { useAuth } from '@/contexts/AuthContext';
import { AuthOverlay } from '@/components/auth/AuthOverlay';
import { GlobalPresence } from '@/components/auth/GlobalPresence';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { BottomNav } from '@/components/layout/BottomNav';
type AppTab = 'inicio' | 'perfiles' | 'jugar' | 'historial' | 'ajustes' | 'arcade' | 'hall';
import { VideoChatComponent } from '@/components/multiplayer/VideoChatComponent';
import { GameHistory } from '@/pages/GameHistory';
import { AppSettings } from '@/pages/AppSettings';
import { ArcadeTab } from '@/components/arcade/ArcadeTab';
import { LobbyScreen } from '@/components/multiplayer/LobbyScreen';
import { ChatComponent } from '@/components/multiplayer/ChatComponent';
import { GameMode, GAME_MODES, TabId, PlayMode } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { DailyVideoProvider, useDailyVideo, createDailyRoom } from '@/components/multiplayer/DailyVideoProvider';
import { FloatingVideoBubbles } from '@/components/multiplayer/FloatingVideoBubbles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Lazy load heavy/non-critical pages to avoid circular dependencies and reduce bundle size
const Profiles = lazy(() => import('@/pages/Profiles'));
// HallOfFame is likely a named export "export function HallOfFame...". 
// We handle this by returning the named export as "default" for lazy().
const HallOfFame = lazy(() => import('@/pages/HallOfFame').then(module => ({ default: module.HallOfFame })));

export type GameScreen = 'mode-select' | 'team-mode-select' | 'player-setup' | 'playing' | 'lobby' | 'guest-setup';

// Modes that support team play
const TEAM_CAPABLE_MODES: GameMode[] = ['cultura', 'trivia_futbol', 'futbol'];

function GameAppInner() {
  const [screen, setScreen] = useState<GameScreen>('mode-select');
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [mainTab, setMainTab] = useState<TabId>('fiesta');
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);

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

  // Game Context
  const { createGame, setGameId, players, localPlayerId, gameId, addPlayer, game, createTeam, assignPlayerToTeam, setLocalPlayerId } = useGameContext();
  const { joinRoom, leaveRoom, isJoined } = useDailyVideo();

  // Auto-join Daily.co video when online (roomId exists)
  useEffect(() => {
    if (!roomId) return;
    const playerName = pendingPlayer?.name || players.find(p => p.id === localPlayerId)?.name || 'Jugador';

    const joinVideo = async () => {
      if (isJoined) {
        console.log('[Daily] Already joined, skipping');
        return;
      }
      try {
        const dailyRoomName = `game-${roomId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`;
        console.log('[Daily] Creating room:', dailyRoomName, 'for player:', playerName);
        const room = await createDailyRoom(dailyRoomName);
        console.log('[Daily] Room response:', room);
        if (room?.url) {
          console.log('[Daily] Joining room URL:', room.url);
          await joinRoom(room.url, playerName);
          console.log('[Daily] Joined successfully!');
        } else {
          console.error('[Daily] No room URL returned');
        }
      } catch (err) {
        console.error('[Daily] Error joining video:', err);
      }
    };
    joinVideo();
  }, [roomId, isJoined, pendingPlayer, players, localPlayerId, joinRoom]);

  // Auto-detect Join URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('lobby');
    }
  }, []);

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
    setSelectedModeForOptions(mode);
  };

  const handleJuegoTabSelect = (mode: GameMode, playMode: PlayMode) => {
    if (playMode === 'online') {
      setPendingHostMode(mode);
      setScreen('lobby');
    } else {
      handleSelectMode(mode);
    }
  };

  const confirmModeSelection = async (isOnline: boolean) => {
    if (!selectedModeForOptions) return;

    // Entry Cost Checks
    if (selectedModeForOptions === 'poker' && (profile?.coins || 0) < 50) {
      toast.error("Necesitas al menos 50 monedas para jugar al Poker.");
      setSelectedModeForOptions(null);
      return;
    }
    if (selectedModeForOptions === 'parchis' && (profile?.coins || 0) < 20) {
      toast.error("Necesitas al menos 20 monedas para jugar al Parchís.");
      setSelectedModeForOptions(null);
      return;
    }

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
    // Quick entry cost check for local play (though poker/parchis are usually online, just in case)
    if (mode === 'poker' && (profile?.coins || 0) < 50) {
      toast.error("Necesitas al menos 50 monedas para jugar al Poker.");
      return;
    }
    if (mode === 'parchis' && (profile?.coins || 0) < 20) {
      toast.error("Necesitas al menos 20 monedas para jugar al Parchís.");
      return;
    }

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
        return <GamePlay onExit={handleExit} isTeamMode={isTeamMode} roomId={roomId} isHost={isHost} />;

      case 'lobby':
        return (
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
                    const hostId = localPlayerId || Math.random().toString(36).substring(2, 9);

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
                  const guestId = localPlayerId || Math.random().toString(36).substring(2, 9);
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
        return <PlayerSetup onStart={handleStartGame} onBack={handleBack} isTeamMode={isTeamMode} isMultiplayer={!!roomId} roomId={roomId} />;

      case 'guest-setup':
        return (
          <GuestSetup
            onJoin={async (name, avatar) => {
              setPendingPlayer({ name, avatar });

              // If we already have a room selected, insert the guest into the DB now
              if (roomId && !isHost) {
                const guestId = localPlayerId || Math.random().toString(36).substring(2, 9);
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
                    <div className="surface-panel relative overflow-hidden p-5 md:p-6">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.14),transparent_24%),linear-gradient(180deg,transparent,rgba(255,255,255,0.01))]" />

                      <div className="relative grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
                        <div className="space-y-5">
                          <div className="space-y-3">
                            <span className="section-badge">
                              <Sparkles className="mr-2 h-3.5 w-3.5" />
                              Selecciona tu experiencia
                            </span>
                            <div>
                              <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                                Una app más <span className="premium-title">clara, premium y móvil</span>
                              </h1>
                              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                                Inicio más ordenado, navegación más limpia y acceso directo a los modos con mejor jerarquía visual.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2.5">
                            <span className="premium-chip text-white/90">
                              <LayoutGrid className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                              {GAME_MODES.length} modos
                            </span>
                            <span className="premium-chip text-white/90">
                              <Smartphone className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                              Mejor móvil
                            </span>
                            <span className="premium-chip text-white/90">
                              <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                              UI más clara
                            </span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <button
                              onClick={() => {
                                setMainTab('fiesta');
                                setActiveTab('inicio');
                              }}
                              className="premium-panel-soft rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/15"
                            >
                              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">🎉</div>
                              <p className="text-sm font-bold text-white">Modos fiesta</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">Retos sociales y partidas rápidas para grupo.</p>
                            </button>

                            <button
                              onClick={() => {
                                setMainTab('juego');
                                setActiveTab('inicio');
                              }}
                              className="premium-panel-soft rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/15"
                            >
                              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">🏆</div>
                              <p className="text-sm font-bold text-white">Competitivo</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">Poker, parchís y juegos de duelo mejor presentados.</p>
                            </button>

                            <button
                              onClick={() => setScreen('lobby')}
                              className="premium-panel-soft rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/15"
                            >
                              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">🌐</div>
                              <p className="text-sm font-bold text-white">Entrar a sala</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">Acceso directo para crear o unirte con código.</p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="surface-soft rounded-[26px] p-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl bg-[hsl(var(--primary)/0.16)] p-3 text-[hsl(var(--accent))]">
                                <Gamepad2 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">Acceso rápido</p>
                                <p className="text-xs text-muted-foreground">Explora modos, crea sala o entra a competir con menos pasos.</p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                              <div className="premium-stat">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-[hsl(var(--accent))]" />
                                  <p className="text-sm font-bold text-white">Local u online</p>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">Ahora el flujo separa mejor el tipo de partida y el modo de juego.</p>
                              </div>
                              <div className="premium-stat">
                                <div className="flex items-center gap-2">
                                  <Users2 className="h-4 w-4 text-[hsl(var(--accent))]" />
                                  <p className="text-sm font-bold text-white">Listo para grupo</p>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">Botones grandes, paneles más limpios y lectura más cómoda al pasar el móvil.</p>
                              </div>
                            </div>
                          </div>

                          {roomId ? (
                            <div className="rounded-[26px] border border-[hsl(var(--primary)/0.25)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),transparent)] p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent))]">Sala activa</p>
                              <p className="mt-2 text-4xl font-black tracking-[0.24em] text-white">{roomId}</p>
                              <p className="mt-2 text-sm text-muted-foreground">Comparte el código y luego elige el juego que quieras iniciar.</p>
                              <Button
                                variant="outline"
                                className="mt-4 w-full text-red-300 hover:text-red-200"
                                onClick={() => {
                                  setRoomId(null);
                                  setIsHost(false);
                                }}
                              >
                                Cancelar sala
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setScreen('lobby')}
                              className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent))]">Nuevo acceso</p>
                              <p className="mt-2 text-lg font-black text-white">Crear o unirte a una sala</p>
                              <p className="mt-2 text-sm text-muted-foreground">Ideal para entrar directamente al modo online sin pasar por más pantallas.</p>
                              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                                Abrir lobby <ArrowRight className="h-4 w-4" />
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative mt-5 inline-flex w-full max-w-[440px] rounded-[24px] border border-white/10 bg-white/[0.04] p-1.5">
                        <button
                          onClick={() => setMainTab('fiesta')}
                          className={`flex-1 rounded-[18px] px-5 py-3 text-sm font-semibold transition ${mainTab === 'fiesta'
                            ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.95)]'
                            : 'text-muted-foreground hover:text-white'}`}
                        >
                          Fiesta
                        </button>
                        <button
                          onClick={() => setMainTab('juego')}
                          className={`flex-1 rounded-[18px] px-5 py-3 text-sm font-semibold transition ${mainTab === 'juego'
                            ? 'bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--primary)))] text-[hsl(var(--accent-foreground))] shadow-[0_14px_30px_-18px_hsl(var(--accent)/0.95)]'
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
              {activeTab === 'historial' && <GameHistory onRejoinGame={handleRejoinGame} />}
              {activeTab === 'hall' && (
                <Suspense fallback={<div className="p-8 text-center">Cargando salón de la fama...</div>}>
                  <HallOfFame />
                </Suspense>
              )}
              {activeTab === 'ajustes' && <AppSettings />}
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
      {isAuthOverlayOpen && <WelcomeScreen />}
      <AuthOverlay />
      <GlobalPresence />
      {getScreenContent()}

      {/* MODE OPTIONS DIALOG (Local vs Online) */}
      <Dialog open={!!selectedModeForOptions} onOpenChange={(o) => !o && setSelectedModeForOptions(null)}>
        <DialogContent className="sm:max-w-xl border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {selectedModeForOptions && GAME_MODES.find(m => m.id === selectedModeForOptions)?.icon}
              <span>{selectedModeForOptions && GAME_MODES.find(m => m.id === selectedModeForOptions)?.name}</span>
            </DialogTitle>
            <DialogDescription id="mode-options-desc">Elige el formato que mejor encaja con tu grupo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="group h-auto min-h-[220px] flex-col items-start gap-4 rounded-[28px] border-white/10 bg-white/[0.03] p-5 text-left hover:border-primary/40 hover:bg-white/[0.06] transition-all"
              onClick={() => confirmModeSelection(false)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white group-hover:scale-105 transition-transform">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Mismo dispositivo</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Ideal para jugar pasando el móvil. Menos pasos, arranque rápido y pantalla optimizada para grupos presenciales.</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Rápido</span>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Sin código</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group h-auto min-h-[220px] flex-col items-start gap-4 rounded-[28px] border-white/10 bg-white/[0.03] p-5 text-left hover:border-[hsl(var(--accent)/0.4)] hover:bg-white/[0.06] transition-all"
              onClick={() => confirmModeSelection(true)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Con sala online</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Cada persona entra desde su móvil con código. Mejor para Poker, Parchís y partidas con videollamada o grupo remoto.</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Código</span>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">Multimóvil</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Only show BottomNav on main screens (mode-select) */}
      {screen === 'mode-select' && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Global Video Chat - Persists across screens */}
      {roomId && localPlayerId && (
        <VideoChatComponent
          roomId={roomId}
          playerId={localPlayerId}
        />
      )}

      {/* Global Chat Bubble - Always visible */}
      <ChatComponent
        roomId={roomId || 'global_lobby'}
        playerName={
          // Try to find name in established players
          players.find(p => p.id === localPlayerId)?.name
          // Fallback for Host/Guest
          || (roomId ? (isHost ? 'Anfitrión' : 'Invitado') : `Usuario ${localPlayerId?.slice(0, 4) || Math.floor(Math.random() * 9000) + 1000}`)
        }
      />
      {/* Floating Video Bubbles (online only) */}
      {roomId && <FloatingVideoBubbles />}
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
