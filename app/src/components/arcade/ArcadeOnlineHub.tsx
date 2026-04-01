import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Zap, Wifi, QrCode, Copy, Check, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGameContext } from '@/contexts/GameContext';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { globalNetwork } from './engine/NetworkManager';
import { ArcadeQuickDraw } from './ArcadeQuickDraw';
import { ArcadeTapRace } from './ArcadeTapRace';
import { ArcadeRPS } from './ArcadeRPS';
import { ArcadeTicTacToe } from './ArcadeTicTacToe';
import { ArcadeMathMatch } from './ArcadeMathMatch';
import { ArcadeHighLow } from './ArcadeHighLow';
import { ArcadeCoinFlip } from './ArcadeCoinFlip';
import { ArcadeRussianRoulette } from './ArcadeRussianRoulette';
import { ArcadeSimonPvP } from './ArcadeSimonPvP';
import { ArcadeMinesweeper } from './ArcadeMinesweeper';
import { ArcadeCanvas } from './ArcadeCanvas';

interface ArcadeOnlineHubProps {
  onReturn: () => void;
}

const ONLINE_GAMES = [
  { id: 'engine_p2p', name: 'Plataformas P2P (Alpha)', icon: '🕹️', desc: 'Engine Experimental: PeerJS + Virtual Joystick + VFX.' },
  { id: 'quick_draw', name: 'Reflejos (Quick Draw)', icon: '⚡', desc: 'El primero en tocar cuando salga el verde, gana.' },
  { id: 'tap_race', name: 'Carrera de Clics', icon: '🏃', desc: 'Machaca botones durante 10 segundos.' },
  { id: 'rps', name: 'Piedra, Papel, Tijera', icon: '✂️', desc: 'Duelo mental 1v1 clásico.' },
  { id: 'tictactoe_speed', name: '3 en Raya (Turbo)', icon: '❌', desc: '3 segundos por turno máximo.' },
  { id: 'math_match', name: 'Duelo Matemático', icon: '🧮', desc: 'Resuelve 5 operaciones antes que tu rival.' },
  { id: 'high_low', name: 'Mayor o Menor', icon: '🃏', desc: 'Adivina la siguiente carta para ganar.' },
  { id: 'coin_flip', name: 'Cara o Cruz', icon: '💰', desc: 'Aguanta la racha más larga sin fallar.' },
  { id: 'russian_roulette', name: 'Ruleta Rusa', icon: '🔫', desc: 'Turnos tensos, 1 bala, 6 recámaras.' },
  { id: 'simon_pvp', name: 'Simón Competitivo', icon: '🚦', desc: 'Falla la secuencia y pierdes al instante.' },
  { id: 'minesweeper', name: 'Campo de Minas', icon: '💣', desc: 'Turnos alternos. Si tocas una bomba, mueres.' },
] as const;

const BOT_TIMEOUT_MS = 15000;

function getPersistentArcadePlayerId(localPlayerId?: string | null) {
  if (localPlayerId) return localPlayerId;
  const saved = localStorage.getItem('arcade_guest_id');
  if (saved) return saved;
  const generated = crypto.randomUUID();
  localStorage.setItem('arcade_guest_id', generated);
  return generated;
}

export function ArcadeOnlineHub({ onReturn }: ArcadeOnlineHubProps) {
  const { localPlayerId, players } = useGameContext();
  const localPlayer = players.find((p) => p.id === localPlayerId) || players[0];
  const stablePresenceId = useMemo(() => getPersistentArcadePlayerId(localPlayerId), [localPlayerId]);

  const [view, setView] = useState<'lobby' | 'finding_match' | 'playing'>('lobby');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [matchRoomId, setMatchRoomId] = useState<string | null>(null);
  const [searchSince, setSearchSince] = useState<number | null>(null);
  const matchedRef = useRef(false);

  // P2P room state
  const [p2pPanel, setP2pPanel] = useState<'closed' | 'host' | 'join'>('closed');
  const [p2pHostId, setP2pHostId] = useState<string | null>(null);
  const [p2pJoinCode, setP2pJoinCode] = useState('');
  const [p2pStatus, setP2pStatus] = useState<'idle' | 'waiting' | 'connecting' | 'connected'>('idle');
  const [p2pCopied, setP2pCopied] = useState(false);

  const startP2PHost = async () => {
    setP2pStatus('waiting');
    try {
      const id = await globalNetwork.initAsHost();
      setP2pHostId(id);
      globalNetwork.onConnected(() => {
        setP2pStatus('connected');
        toast.success('¡Rival conectado via P2P!');
        setTimeout(() => {
          setP2pPanel('closed');
          setSelectedGame('engine_p2p');
          setMatchRoomId(`p2p_host_${id}`);
          setView('playing');
        }, 800);
      });
    } catch {
      setP2pStatus('idle');
      toast.error('Error al crear sala P2P');
    }
  };

  const startP2PJoin = async () => {
    if (!p2pJoinCode.trim()) return;
    setP2pStatus('connecting');
    try {
      await globalNetwork.joinRoom(p2pJoinCode.trim());
      setP2pStatus('connected');
      toast.success('¡Conectado al host!');
      setTimeout(() => {
        setP2pPanel('closed');
        setSelectedGame('engine_p2p');
        setMatchRoomId(`p2p_guest_${p2pJoinCode}`);
        setView('playing');
      }, 600);
    } catch {
      setP2pStatus('idle');
      toast.error('No se pudo conectar. Revisa el código');
    }
  };

  const copyP2PCode = () => {
    if (!p2pHostId) return;
    navigator.clipboard.writeText(p2pHostId);
    setP2pCopied(true);
    setTimeout(() => setP2pCopied(false), 2000);
  };

  useEffect(() => {
    if (view !== 'finding_match' || !selectedGame) return;

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let channel: any = null;

    const startBotMatch = (reason?: string) => {
      if (cancelled || matchedRef.current) return;
      matchedRef.current = true;
      setMatchRoomId(`bot_${selectedGame}_${stablePresenceId}`);
      setView('playing');
      toast.info(reason || 'No apareció nadie. Entras contra un bot.');
    };

    const connectMatchmaking = async () => {
      const myName = localPlayer?.name || 'Invitado';
      setSearchSince(Date.now());
      matchedRef.current = false;

      fallbackTimer = setTimeout(() => {
        startBotMatch('Han pasado 15 segundos. Te meto un bot para que no se quede muerto.');
      }, BOT_TIMEOUT_MS);

      if (!isSupabaseConfigured) {
        startBotMatch('No hay conexión online configurada. Te meto un bot directamente.');
        return;
      }

      channel = supabase.channel(`matchmaking:${selectedGame}`, {
        config: {
          presence: { key: stablePresenceId },
        },
      });

      const sealMatch = (opponentId: string, opponentName?: string) => {
        if (cancelled || matchedRef.current) return;
        matchedRef.current = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        const roomId = `arcade_${selectedGame}_${[stablePresenceId, opponentId].sort().join('_')}`;
        setMatchRoomId(roomId);
        setView('playing');
        toast.success(`¡Rival encontrado${opponentName ? `: ${opponentName}` : ''}!`);
      };

      channel
        .on('presence', { event: 'sync' }, () => {
          if (matchedRef.current) return;
          const state = channel.presenceState() as Record<string, Array<{ name?: string; joined_at?: string }>>;
          const candidates = Object.entries(state)
            .filter(([id]) => id !== stablePresenceId)
            .map(([id, meta]) => ({
              id,
              name: meta?.[0]?.name,
              joinedAt: meta?.[0]?.joined_at ? new Date(meta[0].joined_at).getTime() : Number.MAX_SAFE_INTEGER,
            }))
            .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));

          if (candidates[0]) {
            sealMatch(candidates[0].id, candidates[0].name);
          }
        })
        .subscribe(async (status: string) => {
          if (cancelled) return;

          if (status === 'SUBSCRIBED') {
            await channel.track({
              id: stablePresenceId,
              name: myName,
              joined_at: new Date().toISOString(),
            });
            return;
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            startBotMatch('No he podido abrir el online. Te lanzo bot para que puedas jugar igual.');
          }
        });
    };

    connectMatchmaking();

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [view, selectedGame, stablePresenceId, localPlayer?.name]);

  const resetToLobby = () => {
    setView('lobby');
    setSelectedGame(null);
    setMatchRoomId(null);
    setSearchSince(null);
    matchedRef.current = false;
  };

  const handleFindMatch = (gameId: string) => {
    setSelectedGame(gameId);
    setMatchRoomId(null);
    setView('finding_match');
  };

  if (view === 'playing' && selectedGame && matchRoomId) {
    const playerIdToUse = stablePresenceId;

    if (selectedGame === 'engine_p2p') return <ArcadeCanvas />;
    if (selectedGame === 'quick_draw') return <ArcadeQuickDraw roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'tap_race') return <ArcadeTapRace roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'rps') return <ArcadeRPS roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'tictactoe_speed') return <ArcadeTicTacToe roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'math_match') return <ArcadeMathMatch roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'high_low') return <ArcadeHighLow roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'coin_flip') return <ArcadeCoinFlip roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'russian_roulette') return <ArcadeRussianRoulette roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'simon_pvp') return <ArcadeSimonPvP roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
    if (selectedGame === 'minesweeper') return <ArcadeMinesweeper roomId={matchRoomId} playerId={playerIdToUse} onClose={resetToLobby} />;
  }

  if (view === 'finding_match') {
    const secondsWaiting = searchSince ? Math.max(0, Math.floor((Date.now() - searchSince) / 1000)) : 0;
    const secondsLeft = Math.max(0, Math.ceil((BOT_TIMEOUT_MS - secondsWaiting * 1000) / 1000));

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 h-24 w-24 animate-spin rounded-full border-4 border-[hsl(var(--neon-blue))] border-t-transparent" />
        <h2 className="mb-2 text-2xl font-black text-white">Buscando rival…</h2>
        <p className="text-muted-foreground">Juego: {ONLINE_GAMES.find((g) => g.id === selectedGame)?.name}</p>
        <p className="mt-2 text-sm text-white/60">Si nadie entra en 15 segundos, te meto un bot automáticamente.</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Bot en {secondsLeft}s</p>
        <Button variant="outline" className="mt-8 border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={resetToLobby}>
          Cancelar búsqueda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-2">
      <div className="mx-auto mt-4 max-w-4xl px-2">
        <div className="mb-8 flex items-center justify-between rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 rotate-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="leading-none text-2xl font-black text-white">Lobby 1v1</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-purple-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {localPlayer?.name || 'Jugador'} conectado
              </p>
              <p className="mt-1 text-xs text-white/45">Emparejamiento automático · bot a los 15s si no entra nadie</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={onReturn}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* P2P Direct Room */}
        <div className="mb-6 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-violet-400" />
              <span className="font-black text-white text-sm uppercase tracking-wider">Sala P2P Directa</span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold uppercase">WebRTC</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setP2pPanel(p => p === 'host' ? 'closed' : 'host'); setP2pStatus('idle'); setP2pHostId(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${p2pPanel === 'host' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <Users className="w-3.5 h-3.5 inline mr-1" />Crear
              </button>
              <button onClick={() => { setP2pPanel(p => p === 'join' ? 'closed' : 'join'); setP2pStatus('idle'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${p2pPanel === 'join' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <QrCode className="w-3.5 h-3.5 inline mr-1" />Unirse
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {p2pPanel === 'host' && (
              <motion.div key="host" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2">
                {p2pStatus === 'idle' && (
                  <button onClick={startP2PHost}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(139,92,246,0.4)] active:scale-95 transition-transform">
                    Generar código de sala
                  </button>
                )}
                {(p2pStatus === 'waiting' || p2pStatus === 'connected') && p2pHostId && (
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      <QRCodeSVG value={p2pHostId} size={140} bgColor="#ffffff" fgColor="#0a0a0a" />
                    </div>
                    <div className="w-full">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest text-center mb-1">Código de sala</p>
                      <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                        <code className="flex-1 text-violet-300 text-xs font-mono truncate">{p2pHostId}</code>
                        <button onClick={copyP2PCode} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
                          {p2pCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {p2pStatus === 'waiting' && (
                      <p className="text-xs text-white/40 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Esperando que alguien escanee el QR…
                      </p>
                    )}
                    {p2pStatus === 'connected' && (
                      <p className="text-sm font-black text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        ¡Conectado! Arrancando…
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {p2pPanel === 'join' && (
              <motion.div key="join" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 flex flex-col gap-3">
                <input
                  value={p2pJoinCode}
                  onChange={e => setP2pJoinCode(e.target.value)}
                  placeholder="Pega el código del host aquí…"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 outline-none focus:border-indigo-500/60"
                />
                <button
                  onClick={startP2PJoin}
                  disabled={p2pStatus === 'connecting' || !p2pJoinCode.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-wider disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {p2pStatus === 'connecting' ? '⏳ Conectando…' : p2pStatus === 'connected' ? '✅ Conectado' : 'Conectar al host'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ONLINE_GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-[20px] border border-white/5 bg-slate-900/80 p-1 backdrop-blur-md transition-colors hover:border-[hsl(var(--neon-pink))]/50"
            >
              <div className="flex h-full items-center gap-4 rounded-[16px] bg-black/40 p-4 transition-transform group-hover:bg-black/20">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-4xl shadow-inner transition-transform group-hover:scale-110">
                  {game.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white transition-colors group-hover:text-[hsl(var(--neon-pink))]">{game.name}</h3>
                  <p className="mt-0.5 text-sm leading-tight text-muted-foreground">{game.desc}</p>
                </div>

                <Button
                  onClick={() => handleFindMatch(game.id)}
                  size="icon"
                  className="h-12 w-12 rounded-full border-none bg-gradient-to-r from-[hsl(var(--neon-blue))] to-[hsl(var(--neon-purple))] text-white shadow-[0_0_15px_hsla(var(--neon-blue),0.4)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_hsla(var(--neon-blue),0.6)]"
                >
                  <Zap className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
