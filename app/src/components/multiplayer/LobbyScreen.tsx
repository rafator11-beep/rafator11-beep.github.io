import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Plus, Share2, Copy, Users, ArrowLeft, Sparkles, Wifi, Crown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LobbyScreenProps {
  onJoin: (roomId: string, isHost: boolean, mode?: string) => void;
  onBack: () => void;
  initialMode?: string;
  initialWaiting?: boolean;
  currentPlayer?: { name: string; avatar: string };
  roomId?: string | null;
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="premium-panel-soft rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function LobbyScreen({ onJoin, onBack, initialMode, initialWaiting = false, currentPlayer, roomId }: LobbyScreenProps) {
  const [roomCode, setRoomCode] = useState(roomId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWaiting, setIsWaiting] = useState(initialWaiting);
  const [onlinePlayers, setOnlinePlayers] = useState<{ name: string; avatar: string; id: string }[]>([]);
  const [joinTimeout, setJoinTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    if (initialMode && !isWaiting) {
      window.history.replaceState({}, '', window.location.pathname);
      createRoom();
      return;
    }

    if (roomParam && roomParam.length === 4 && !isWaiting && !loading) {
      setRoomCode(roomParam.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);

      if (!currentPlayer) {
        onJoin(roomParam.toUpperCase(), false);
      } else {
        handleJoinSubmit(roomParam.toUpperCase());
      }
    }
  }, [initialMode, currentPlayer, isWaiting, loading]);

  useEffect(() => {
    if (!isWaiting || !roomCode) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: {
          key: currentPlayer?.name || 'guest',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presenceList: any[] = [];
        Object.values(state).forEach((presences: any) => {
          presenceList.push(...presences);
        });
        setOnlinePlayers(
          presenceList.map((p) => ({
            name: p.name,
            avatar: p.avatar,
            id: p.id || Math.random().toString(),
          })),
        );
      })
      .on('broadcast', { event: 'game_start' }, () => {
        console.log('Game started broadcast received in Lobby');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (joinTimeout) {
            clearTimeout(joinTimeout);
            setJoinTimeout(null);
          }
          if (currentPlayer) {
            await channel.track({
              id: Math.random().toString(36).substring(2, 9),
              name: currentPlayer.name,
              avatar: currentPlayer.avatar,
              online_at: new Date().toISOString(),
            });
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          toast.error('Error conectando a la sala. Reintentando...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (joinTimeout) clearTimeout(joinTimeout);
    };
  }, [isWaiting, roomCode, currentPlayer]);

  const createRoom = async () => {
    setLoading(true);
    setError('');
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    onJoin(code, true, initialMode);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleJoinSubmit = async (codeOverride?: string) => {
    const codeToJoin = codeOverride || roomCode;
    if (codeToJoin.length < 4) {
      setError('Código inválido');
      return;
    }
    setLoading(true);
    setError('');

    const timeout = setTimeout(() => {
      if (onlinePlayers.length === 0) {
        setError('No se pudo conectar a la sala o está vacía.');
        setIsWaiting(false);
        setLoading(false);
      }
    }, 10000);
    setJoinTimeout(timeout);

    onJoin(codeToJoin.toUpperCase(), false);
    setIsWaiting(true);
  };

  const connectedCount = Math.max(onlinePlayers.length, currentPlayer ? 1 : 0);

  return (
    <div className="premium-screen min-h-screen px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel w-full max-w-5xl overflow-hidden rounded-[34px] p-4 sm:p-5 md:p-7"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-2xl px-3 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-chip text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                lobby premium
              </span>
              <span className="premium-chip text-white/80">
                <Wifi className="h-3.5 w-3.5 text-emerald-300" />
                multijugador
              </span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="premium-panel-soft rounded-[30px] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent))]">Sala online</p>
                    <h1 className="premium-title mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-[2.8rem]">
                      Crea, comparte y entra en segundos.
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                      Un lobby más limpio, con mejor lectura móvil, acciones claras y espacio para que el código y los jugadores se vean bien desde cualquier pantalla.
                    </p>
                  </div>

                  {currentPlayer ? (
                    <div className="premium-panel-soft min-w-[210px] rounded-[26px] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tu perfil</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/10">
                          <AvatarImage src={currentPlayer.avatar} />
                          <AvatarFallback>{currentPlayer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{currentPlayer.name}</p>
                          <p className="text-xs text-muted-foreground">Listo para jugar</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <StatPill icon={Users} label="Jugadores" value={isWaiting ? `${connectedCount} conectados` : '2 a 20 personas'} />
                  <StatPill icon={ShieldCheck} label="Acceso" value="Código corto y enlace" />
                  <StatPill icon={Crown} label="Anfitrión" value="Controla el inicio" />
                </div>
              </div>

              {isWaiting ? (
                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="premium-panel-soft rounded-[28px] p-5 sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Código de sala</p>
                    <div className="mt-4 rounded-[26px] border border-white/10 bg-black/20 px-4 py-5 text-center">
                      <p className="text-[42px] font-black tracking-[0.28em] text-white sm:text-[56px]">{roomCode}</p>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      Comparte el código o copia el enlace directo para que el resto entre sin fricción.
                    </p>
                    <div className="mt-5 flex flex-col gap-3">
                      <Button onClick={copyInviteLink} className="h-12 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.95)] hover:opacity-95">
                        <Share2 className="h-4 w-4" />
                        Copiar enlace de invitación
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsWaiting(false);
                          setLoading(false);
                        }}
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      >
                        Salir de la sala
                      </Button>
                    </div>
                  </div>

                  <div className="premium-panel-soft rounded-[28px] p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Jugadores conectados</p>
                        <h2 className="mt-1 text-xl font-bold text-white">Sala en espera</h2>
                      </div>
                      <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {connectedCount} online
                      </div>
                    </div>

                    {onlinePlayers.length === 0 && currentPlayer ? (
                      <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                        <Avatar className="mx-auto h-16 w-16 border border-white/10">
                          <AvatarImage src={currentPlayer.avatar} />
                          <AvatarFallback>{currentPlayer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="mt-4 text-base font-semibold text-white">{currentPlayer.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Esperando a que entren más jugadores...</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {onlinePlayers.map((p, i) => (
                          <motion.div
                            key={p.id || i}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-[24px] border border-white/8 bg-white/[0.04] p-3.5"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border border-white/10">
                                <AvatarImage src={p.avatar} />
                                <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                                <p className="text-xs text-muted-foreground">Conectado y listo</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 rounded-[22px] border border-[hsl(var(--accent)/0.18)] bg-[hsl(var(--accent)/0.08)] px-4 py-3 text-sm font-medium text-[hsl(var(--accent))]">
                      Esperando al anfitrión para iniciar la partida.
                    </div>
                    {error ? <p className="mt-3 text-sm font-medium text-red-400">{error}</p> : null}
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="premium-panel-soft rounded-[28px] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))]">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Crear sala</p>
                        <h2 className="text-xl font-bold text-white">Abre una partida nueva</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Tú marcas el ritmo, compartes el código y controlas cuándo empieza la sesión.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Modo</p>
                        <p className="mt-2 text-sm font-semibold text-white">{initialMode ? 'Juego preseleccionado' : 'Selección libre'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acceso</p>
                        <p className="mt-2 text-sm font-semibold text-white">Código corto y enlace</p>
                      </div>
                    </div>
                    <Button
                      className="mt-5 h-13 w-full rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.95)] hover:opacity-95"
                      onClick={createRoom}
                      disabled={loading}
                    >
                      <Plus className="h-5 w-5" />
                      {initialMode ? 'Crear sala para este juego' : 'Crear sala ahora'}
                    </Button>
                  </div>

                  <div className="premium-panel-soft rounded-[28px] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15">
                        <LogIn className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Entrar</p>
                        <h2 className="text-xl font-bold text-white">Accede con tu código</h2>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Introduce las 4 letras de la sala. El diseño está optimizado para que el código se lea perfecto en móvil.
                    </p>

                    <div className="mt-5 rounded-[26px] border border-white/10 bg-black/20 p-3">
                      <div className="relative">
                        <Input
                          placeholder="ABCD"
                          className="h-16 border-white/10 bg-white/[0.04] pr-12 text-center font-mono text-3xl font-black uppercase tracking-[0.32em] text-white placeholder:text-white/25"
                          maxLength={4}
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                        <button
                          type="button"
                          onClick={copyInviteLink}
                          title="Copiar enlace"
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Consejo</p>
                        <p className="mt-2 text-sm font-semibold text-white">Usa mayúsculas para leerlo mejor.</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tiempo</p>
                        <p className="mt-2 text-sm font-semibold text-white">Entrada rápida en segundos.</p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="mt-5 h-13 w-full rounded-2xl border border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                      onClick={() => handleJoinSubmit()}
                      disabled={loading || roomCode.length < 4}
                    >
                      <LogIn className="h-4 w-4" />
                      Entrar en la sala
                    </Button>
                    {error ? <p className="mt-3 text-sm font-medium text-red-400">{error}</p> : null}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="premium-panel-soft rounded-[30px] p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Cómo funciona</p>
                <div className="mt-4 space-y-3">
                  {[
                    ['1', 'Crea o introduce tu sala', 'Todo empieza con un código corto y claro.'],
                    ['2', 'Comparte el acceso', 'Invita por enlace o por código de 4 letras.'],
                    ['3', 'Entra y espera al host', 'La sala se actualiza con los jugadores conectados.'],
                  ].map(([step, title, text]) => (
                    <div key={step} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">{step}</div>
                        <div>
                          <p className="text-sm font-semibold text-white">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-panel-soft rounded-[30px] p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Ventajas del nuevo lobby</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {[
                    'Código enorme y legible',
                    'Acciones principales destacadas',
                    'Panel de jugadores más limpio',
                    'Lectura clara en móvil',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
