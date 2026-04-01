import { useState, useRef, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { safeLower, asString } from '@/utils/safeText';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Plus, X, Users, Play, ArrowLeft, UserPlus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGameContext } from '@/contexts/GameContext';
import { GAME_MODES, TEAM_COLORS } from '@/types/game';
import { useSavedPlayers } from '@/hooks/useSavedPlayers';
import { useRanking } from '@/hooks/useRanking';
import { ChatComponent } from '@/components/multiplayer/ChatComponent';
import { supabase } from '@/integrations/supabase/client';
import AddPlayerModal from '@/components/AddPlayerModal';

// Wrapper to avoid prop drilling issues or valid types
const ChatEmbed = ({ roomId, playerName }: { roomId: string, playerName: string }) => (
  <ChatComponent roomId={roomId} playerName={playerName} />
);

interface PlayerSetupProps {
  onStart: () => void;
  onBack: () => void;
  isTeamMode?: boolean;
  isMultiplayer?: boolean;
  roomId?: string | null;
}

export function PlayerSetup({ onStart, onBack, isTeamMode: forceTeamMode, isMultiplayer, roomId }: PlayerSetupProps) {
  const isMobile = useIsMobile();
  const { game, players, teams, addPlayer, removePlayer, createTeam, assignPlayerToTeam, startGame } = useGameContext();
  const { savedPlayers, savePlayer } = useSavedPlayers();
  const { rankings } = useRanking();
  const [newTeamName, setNewTeamName] = useState('');
  const [showTeamCreator, setShowTeamCreator] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const modeInfo = GAME_MODES.find(m => m.id === game?.mode);
  const isTeamMode = forceTeamMode !== undefined ? forceTeamMode : (modeInfo?.teamBased || false);
  const minPlayers = isTeamMode ? 4 : 2;
  const is1vs1 = !isTeamMode && (game?.mode === 'futbol' || game?.mode === 'cultura' || game?.mode === 'trivia_futbol' || game?.mode === 'tictactoe');
  const maxPlayers = is1vs1 ? 2 : 20;

  const handleAddPlayer = async (name: string, avatarUrl?: string | null) => {
    if (players.length >= maxPlayers) {
      toast.error(`Máximo ${maxPlayers} jugadores en este modo`);
      return;
    }

    setIsLoading(true);
    try {
      await addPlayer(name, avatarUrl || undefined);
      if (!name.toLowerCase().includes('bot')) {
        savePlayer(name, avatarUrl);
      }
    } catch (err) {
      console.error('Error adding player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-add logged/saved player for ALL modes
  useEffect(() => {
    if (players.length === 0 && !isLoading) {
      const localName = localStorage.getItem('fiesta_player_name');
      const localAvatar = localStorage.getItem('fiesta_player_avatar');

      const candidate = localName
        ? { name: localName, avatar_url: localAvatar || '' }
        : (savedPlayers.length > 0 ? savedPlayers[0] : null);

      if (candidate) {
        const doAdd = async () => {
          setIsLoading(true);
          try {
            await addPlayer(candidate.name, candidate.avatar_url);
            toast.success(`${candidate.name} añadido automáticamente`);
          } catch (e) {
            console.error("Auto-add failed", e);
          } finally {
            setIsLoading(false);
          }
        };
        doAdd();
      }
    }
  }, [players.length, savedPlayers]);

  // BRIDGE: Listen for room_participants
  useEffect(() => {
    if (!isMultiplayer || !roomId) return;


    const syncExistingParticipants = async () => {
      const { data: participants } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId);

      if (participants) {
        for (const p of participants) {
          if (!players.some(gp => gp.name.toLowerCase() === p.name.toLowerCase())) {
            addPlayer(p.name, p.avatar_url).catch(console.error);
          }
        }
      }
    };
    syncExistingParticipants();

    const channel = supabase
      .channel(`sync-participants-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      }, payload => {
        const newPart = payload.new;
        if (!players.some(gp => gp.name.toLowerCase() === newPart.name.toLowerCase())) {
          addPlayer(newPart.name, newPart.avatar_url).catch(console.error);
          toast.info(`${newPart.name} se ha unido a la sala`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMultiplayer, roomId, players, addPlayer]);

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await removePlayer(playerId);
      toast.success('Jugador eliminado');
    } catch (err) {
      console.error('Error removing player:', err);
      toast.error('No se pudo eliminar al jugador');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setIsLoading(true);
    try {
      await createTeam(newTeamName.trim(), TEAM_COLORS[selectedColorIndex]);
      setNewTeamName('');
      setShowTeamCreator(false);
      setSelectedColorIndex((selectedColorIndex + 1) % TEAM_COLORS.length);
    } catch (err) {
      console.error('Error creating team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const handleStartGame = async () => {
    // Mejora 9: Validación mínimo de jugadores antes de empezar
    if (players.length < 2) {
      toast.error('Necesitas al menos 2 jugadores para empezar');
      return;
    }

    setIsLoading(true);
    try {
      await startGame();
      onStart();
    } catch (err) {
      console.error('Error starting game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const canStart = players.length >= minPlayers &&
    (!isTeamMode || (teams.length >= 2 && players.every(p => p.team_id)));

  // --- Lobby "zona baile" (solo modos NO equipo) ---
  const lobbyRef = useRef<HTMLDivElement | null>(null);
  const ballElsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const ballsRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

  const lobbyPlayers = useMemo(() => {
    return players.map(p => {
      const playerRanking = rankings.find(r => safeLower(r.name) === safeLower(p.name));
      const effectiveAvatar = playerRanking?.equipped_items?.avatar || p.avatar_url || null;
      return {
        id: p.id,
        name: p.name,
        avatar_url: effectiveAvatar,
      };
    });
  }, [players, rankings]);

  useEffect(() => {
    if (isTeamMode) return;
    const el = lobbyRef.current;
    if (!el) return;

    const size = 52; // avatar "bola"
    const seedBall = (id: string) => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      ballsRef.current[id] = {
        x: Math.random() * Math.max(1, w - size),
        y: Math.random() * Math.max(1, h - size),
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
      };
    };

    // Ensure balls exist for all players
    const nextIds = new Set(lobbyPlayers.map(p => p.id));
    for (const p of lobbyPlayers) {
      if (!ballsRef.current[p.id]) seedBall(p.id);
    }
    // Remove balls for players no longer present
    for (const id of Object.keys(ballsRef.current)) {
      if (!nextIds.has(id)) delete ballsRef.current[id];
    }

    let raf = 0;
    const tick = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      for (const id of Object.keys(ballsRef.current)) {
        const b = ballsRef.current[id];
        if (!b) continue;

        b.x += b.vx;
        b.y += b.vy;

        // bounce
        if (b.x <= 0 || b.x >= w - size) b.vx *= -1;
        if (b.y <= 0 || b.y >= h - size) b.vy *= -1;

        // clamp (avoid getting stuck outside)
        b.x = Math.min(Math.max(0, b.x), Math.max(0, w - size));
        b.y = Math.min(Math.max(0, b.y), Math.max(0, h - size));

        const node = ballElsRef.current[id];
        if (node) node.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isTeamMode, lobbyPlayers]);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern p-3 md:p-8 relative overflow-hidden pb-32">
      {/* Neon background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(var(--neon-purple))] opacity-10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--neon-blue))] opacity-10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:neon-box h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 neon-text text-[hsl(var(--primary))] truncate">
              {modeInfo?.icon} {modeInfo?.name}
            </h1>
            <div className="flex flex-col items-start">
              <p className="text-xs md:text-sm text-muted-foreground truncate w-full text-left">Configura los jugadores</p>
              {isMultiplayer && roomId && (
                <div
                  className="mt-1 flex items-center gap-2 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    const url = `${window.location.origin}?room=${roomId}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Enlace de invitación copiado');
                  }}
                >
                  <span className="text-[10px] md:text-xs font-mono font-bold text-primary text-left">SALA: {roomId}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Players Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg neon-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
                Operadores ({players.length})
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-2 h-7"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Comunidad
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white max-w-md w-[95vw] rounded-3xl p-4 md:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter text-left">🌐 Red de Operadores</DialogTitle>
                    <DialogDescription className="text-white/60 text-left">Selecciona perfiles reales de la comunidad para invitarlos.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 max-h-[50vh] overflow-y-auto pr-1">
                    {rankings.slice(0, 10).map(r => {
                      const isAdded = players.some(p => p.name === r.name);
                      return (
                        <button
                          key={r.name}
                          onClick={() => {
                            if (!isAdded) {
                              handleAddPlayer(r.name, r.avatar_url);
                              toast.success(`Invitado: ${r.name}`);
                            }
                          }}
                          disabled={isAdded}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left group ${isAdded
                            ? 'bg-primary/20 border-primary/50 opacity-50 cursor-not-allowed'
                            : 'bg-white/5 border-white/5 hover:border-primary/50'
                            }`}
                        >
                          <Avatar className="h-10 w-10 border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                            <AvatarImage src={r.avatar_url || undefined} />
                            <AvatarFallback className="bg-slate-800 text-[10px]">{r.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate">{r.name}</p>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{r.xp || 0} XP</p>
                          </div>
                          {isAdded && <span className="text-[10px] font-bold text-primary flex-shrink-0">✅</span>}
                        </button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {players.map((player) => {
                  const playerRanking = rankings.find(r => safeLower(r.name) === safeLower(player.name));
                  const effectiveAvatar = playerRanking?.equipped_items?.avatar || player.avatar_url;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="group relative flex flex-col items-center gap-2 p-3 rounded-[24px] bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer shadow-xl overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 md:h-16 md:w-16 ring-2 ring-white/5 group-hover:ring-primary/20 transition-all duration-500 shadow-2xl">
                          {effectiveAvatar ? (
                            <AvatarImage src={effectiveAvatar} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-sm md:text-xl">
                              {player.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(player.id);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 active:scale-90 z-20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <span className="text-[10px] font-black uppercase tracking-wider truncate block text-white/90">
                          {player.name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Mobile direct add button in grid */}
                <motion.button
                  key="add-player-btn"
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-[24px] bg-white/5 border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/10 transition-all group min-h-[90px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary">
                    Añadir
                  </span>
                </motion.button>
              </AnimatePresence>
            </div>

            {players.length === 0 && (
              <div className="text-center py-8">
                <div className="text-white/60 mb-1 text-sm">No hay operadores</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Añade al menos {minPlayers}</div>
              </div>
            )}
          </motion.div>

          {/* Teams Section (for team-based modes) */}
          {isTeamMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl p-4 md:p-6 shadow-lg border"
            >
              <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2 text-left">
                👥 Equipos
              </h2>

              {showTeamCreator ? (
                <div className="mb-4 p-4 bg-muted/50 rounded-xl">
                  <Input
                    placeholder="Nombre del equipo"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="mb-3 h-10"
                  />
                  <div className="flex flex-wrap gap-2 mb-3 justify-center">
                    {TEAM_COLORS.map((color, idx) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`w-7 h-7 rounded-full transition-transform ${selectedColorIndex === idx ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateTeam} disabled={!newTeamName.trim() || isLoading} className="flex-1 h-10">
                      Crear
                    </Button>
                    <Button variant="outline" onClick={() => setShowTeamCreator(false)} className="h-10">
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mb-4 h-10 border-dashed"
                  onClick={() => setShowTeamCreator(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Equipo
                </Button>
              )}

              {/* Jugadores sin equipo */}
              {players.filter(p => !p.team_id).length > 0 && teams.length > 0 && (
                <div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Sin equipo — toca para asignar
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 pb-4">
                    {players.filter(p => !p.team_id).map(p => (
                      <div key={p.id} className="relative z-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-sm font-black uppercase shadow-sm transition-colors active:scale-95"
                        >
                          {p.avatar_url ? (
                            <img src={p.avatar_url} className="w-5 h-5 rounded-full object-cover" alt={p.name} />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white">{p.name.substring(0, 2)}</span>
                          )}
                          <span className="text-white">{p.name}</span>
                        </button>

                        {/* Dropdown de equipos */}
                        <AnimatePresence>
                          {openDropdownId === p.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute top-full left-0 mt-2 z-[100] flex flex-col gap-1.5 bg-slate-800 border-2 border-primary/40 rounded-xl p-2 shadow-2xl min-w-[140px]"
                            >
                              {teams.map(t => (
                                <button
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    assignPlayerToTeam(p.id, t.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left text-xs font-black text-white hover:text-white"
                                >
                                  <span className="w-3 h-3 rounded-full shadow-md flex-shrink-0" style={{ backgroundColor: t.color }} />
                                  {t.name}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {teams.map((team) => {
                  const teamPlayers = players.filter(p => p.team_id === team.id);
                  return (
                    <div
                      key={team.id}
                      className="p-3 md:p-4 rounded-xl border-2"
                      style={{ borderColor: team.color }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-bold text-sm md:text-base">{team.name}</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground ml-auto uppercase font-black">
                          {teamPlayers.length} OP
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teamPlayers.map(p => (
                          <button
                            key={p.id}
                            onClick={() => assignPlayerToTeam(p.id, null)}
                            title="Quitar del equipo"
                            className="flex items-center gap-1 text-[10px] bg-muted hover:bg-red-500/20 hover:text-red-400 px-2 py-1 rounded-full font-bold uppercase transition-colors group"
                          >
                            {p.name}
                            <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                        {teamPlayers.length === 0 && (
                          <span className="text-[10px] text-muted-foreground/50 italic">Sin jugadores</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {teams.length < 2 && (
                <p className="text-center text-muted-foreground py-4 text-xs font-bold uppercase tracking-widest opacity-60">
                  Mínimo 2 equipos requeridos
                </p>
              )}
            </motion.div>
          )}

          {/* Start Game Section */}
          {!isTeamMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl p-4 shadow-lg border"
            >
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{modeInfo?.icon}</div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold leading-tight">Lobby Virtual</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {players.length} listos
                    </p>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-tighter">
                  {modeInfo?.name}
                </div>
              </div>

              {/* Zona baile */}
              <div
                ref={lobbyRef}
                className="relative w-full h-[200px] md:h-[320px] rounded-2xl overflow-hidden border bg-black/80"
              >
                {/* glow */}
                <div className="absolute inset-0 opacity-60 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.25), transparent 35%), radial-gradient(circle at 80% 60%, rgba(236,72,153,0.20), transparent 45%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.14), transparent 45%)'
                  }}
                />

                {/* Avatares rebotando */}
                {lobbyPlayers.map((p) => (
                  <div
                    key={p.id}
                    ref={(node) => {
                      ballElsRef.current[p.id] = node;
                    }}
                    className="absolute top-0 left-0 w-[42px] h-[42px] md:w-[52px] md:h-[52px] rounded-full overflow-hidden border-2 shadow-[0_0_12px_rgba(168,85,247,0.45)]"
                    style={{ borderColor: 'rgba(168,85,247,0.9)' }}
                    title={p.name}
                  >
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                        <span className="font-black text-white text-xs md:text-sm">
                          {p.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón central épico */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={!canStart || isLoading}
                    className="px-5 py-2.5 md:px-6 md:py-3 rounded-full font-black text-white text-sm md:text-base border border-white/10 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter"
                    style={{
                      animation: 'pulse-neon 1.9s ease-in-out infinite',
                    }}
                  >
                    🚀 ¡Despegar!
                  </button>
                </div>

                <style>{`
                  @keyframes pulse-neon {
                    0% { transform: translateZ(0) scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.55); }
                    70% { transform: translateZ(0) scale(1.04); box-shadow: 0 0 0 18px rgba(168, 85, 247, 0); }
                    100% { transform: translateZ(0) scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
                  }
                `}</style>
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Start Button for mobile (sticky-like behavior) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:relative md:bg-transparent bg-background/80 backdrop-blur-md md:backdrop-blur-none border-t border-white/10 md:border-none z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={handleStartGame}
              disabled={!canStart || isLoading}
              className="w-full md:w-auto text-base md:text-lg px-8 py-5 md:py-6 h-auto font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              <Play className="h-5 w-5 mr-2" />
              {isLoading ? 'Iniciando...' : 'Empezar Misión'}
            </Button>

            {!canStart && (
              <p className="text-[10px] md:text-sm text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                {players.length < minPlayers
                  ? `Faltan ${minPlayers - players.length} operadores`
                  : isTeamMode && teams.length < 2
                    ? 'Crea 2 equipos'
                    : isTeamMode && players.some(p => !p.team_id)
                      ? 'Asigna equipos'
                      : ''}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Action Button (Elevated z-index to stay above overlays) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-48 left-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] flex items-center justify-center hover:shadow-xl transition-shadow z-[999] cursor-pointer pointer-events-auto"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="h-8 w-8" />
      </motion.button>

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPlayer={handleAddPlayer}
      />
    </div>
  );
}
