import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Eye, Smartphone, X, RefreshCw, UserCircle2, Copy, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KahootVoteSession } from '@/components/game/KahootVoteSession';
import { createPortal } from 'react-dom';
import { copyToClipboard } from '@/utils/clipboard';

interface SpectatorViewProps {
  roomId: string;
  onClose?: () => void;
  isHost?: boolean;
}

// Mensaje secreto, distinto por jugador, que viaja dentro del mismo broadcast
// de siempre pero que cada móvil filtra para quedarse SOLO con el suyo — el
// resto del payload (texto de la carta, jugadores...) lo sigue viendo todo el
// mundo igual que hasta ahora. Pensado primero para Impostor (rol + palabra),
// pero el "kind" es genérico para poder reutilizarlo en otras mecánicas.
export interface PrivateForPlayer {
  kind: 'impostor';
  isImpostor: boolean;
  category: string;
  word: string;   // palabra real (no-impostores) o palabra/pista falsa (impostor)
  hint?: string;
}

interface CardState {
  text: string;
  playerName: string;
  players?: string[];
  kahootConfig?: {
    question: string;
    options: string[];
    correctAnswer?: string;
  };
  privateFor?: Record<string, PrivateForPlayer>;
  cardIndex: number;
  timestamp: number;
}

// ── HOST MODE: muestra el QR y emite cartas ────────────────────────────────
export function SpectatorQRPanel({ roomId, currentCard, currentPlayer, players, kahootConfig, privateFor }: {
  roomId: string;
  currentCard: string;
  currentPlayer: string;
  players: string[];
  kahootConfig?: any;
  privateFor?: Record<string, PrivateForPlayer>;
}) {
  const spectatorUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&spectator=true`;

  // Siempre con el último estado a mano (sin esperar a un efecto) para poder
  // responder al instante cuando alguien se conecta a mitad de partida.
  const latestPayloadRef = useRef<CardState>({
    text: currentCard, playerName: currentPlayer, players, kahootConfig, privateFor,
    cardIndex: Date.now(), timestamp: Date.now(),
  });
  latestPayloadRef.current = {
    text: currentCard, playerName: currentPlayer, players, kahootConfig, privateFor,
    cardIndex: latestPayloadRef.current.cardIndex, timestamp: Date.now(),
  };

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Quién se ha identificado desde su móvil (ver SpectatorView → handleSelectPlayer,
  // que manda "spectator_identified" al elegir nombre). Así el anfitrión sabe, de
  // un vistazo, quién está ya conectado con su móvil antes/durante la partida.
  const [joinedNames, setJoinedNames] = useState<string[]>([]);

  // Canal persistente de la sala (se crea una sola vez por roomId, no en cada
  // cambio de carta): responde "spectator_ready" con el estado actual, para
  // que quien escanea el QR a mitad de partida no se quede esperando a que
  // cambie algo — recibe la foto actual al momento de conectarse.
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`spectator:${roomId}`)
      .on('broadcast', { event: 'spectator_ready' }, () => {
        channel.send({ type: 'broadcast', event: 'card_update', payload: latestPayloadRef.current });
      })
      .on('broadcast', { event: 'spectator_identified' }, (payload) => {
        const name = (payload.payload as { name?: string })?.name;
        if (!name) return;
        setJoinedNames(prev => prev.includes(name) ? prev : [...prev, name]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [roomId]);

  // Reenvía el estado cada vez que cambia algo relevante (carta, jugadores, voto activo).
  useEffect(() => {
    if (!roomId) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'card_update',
      payload: latestPayloadRef.current,
    });
  }, [roomId, currentCard, currentPlayer, players, kahootConfig, privateFor]);

  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className="relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Ver en móvil (QR)"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">QR</span>
        {joinedNames.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
            <Users className="h-2.5 w-2.5" />
            {joinedNames.length}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl"
              >
                <button
                  onClick={() => setShowQR(false)}
                  className="absolute right-4 top-4 rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--accent)/0.15)]">
                    <Smartphone className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Modo Espectador
                    </p>
                    <h2 className="text-base font-bold text-white">Ver en tu móvil</h2>
                  </div>
                </div>

                <div className="flex justify-center rounded-2xl bg-white p-4">
                  <QRCodeSVG
                    value={spectatorUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#0f0f1a"
                    level="M"
                  />
                </div>

                <p className="mt-4 text-center text-sm leading-6 text-muted-foreground">
                  Escanea con la cámara del móvil para ver las cartas en tiempo real
                </p>

                <button
                  onClick={() => copyToClipboard(spectatorUrl, 'Enlace copiado')}
                  className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 active:scale-[0.98]"
                >
                  <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground font-mono">{spectatorUrl}</p>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Las cartas se sincronizan en tiempo real
                </div>

                {/* Quién ya está dentro con su móvil */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Conectados desde el móvil ({joinedNames.length})
                  </p>
                  {joinedNames.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">Nadie se ha identificado todavía — en cuanto escaneen y elijan su nombre, aparecerá aquí.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {joinedNames.map(name => (
                        <span key={name} className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <UserCircle2 className="h-3 w-3" />
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ── SPECTATOR MODE: pantalla de solo lectura para móvil ───────────────────
export function SpectatorView({ roomId, onClose }: SpectatorViewProps) {
  const [cardState, setCardState] = useState<CardState | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [myPlayerName, setMyPlayerName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beep_spectator_name') || null;
    }
    return null;
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleSelectPlayer = (p: string) => {
    setMyPlayerName(p);
    localStorage.setItem('beep_spectator_name', p);
    // Avisa al anfitrión para que lo vea en su lista de "conectados desde el móvil".
    channelRef.current?.send({ type: 'broadcast', event: 'spectator_identified', payload: { name: p } });
  };

  // Cuánto llevamos esperando respuesta del anfitrión (para el mensaje de ayuda).
  const [waitingSeconds, setWaitingSeconds] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    let gotData = false;
    let retryInterval: ReturnType<typeof setInterval> | null = null;
    let waitingInterval: ReturnType<typeof setInterval> | null = null;

    const channel = supabase.channel(`spectator:${roomId}`)
      .on('broadcast', { event: 'card_update' }, (payload) => {
        gotData = true;
        if (retryInterval) { clearInterval(retryInterval); retryInterval = null; }
        if (waitingInterval) { clearInterval(waitingInterval); waitingInterval = null; }
        setCardState(payload.payload as CardState);
        setLastUpdate(new Date());
        setConnected(true);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;

          const announce = () => {
            // Pide el estado actual — si ya hay partida en marcha, no hace falta
            // esperar a que cambie algo para enterarse.
            channel.send({ type: 'broadcast', event: 'spectator_ready', payload: {} });
            // Si ya te habías identificado en una sesión anterior (localStorage),
            // vuelve a avisar al anfitrión ahora que estás conectado de nuevo.
            if (myPlayerName) {
              channel.send({ type: 'broadcast', event: 'spectator_identified', payload: { name: myPlayerName } });
            }
          };

          announce();
          // Un solo aviso puede perderse si el anfitrión todavía no estaba
          // escuchando en ese instante exacto (p. ej. acabas de entrar a la
          // partida y el panel QR tarda un momento en montarse). Reintenta
          // cada 3s hasta recibir datos, para no quedarse pillado para siempre.
          retryInterval = setInterval(() => { if (!gotData) announce(); }, 3000);
          waitingInterval = setInterval(() => { if (!gotData) setWaitingSeconds(s => s + 1); }, 1000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (retryInterval) clearInterval(retryInterval);
      if (waitingInterval) clearInterval(waitingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Mensaje secreto para ESTE jugador (p. ej. su rol de Impostor), si lo hay.
  const myPrivateMessage = myPlayerName ? cardState?.privateFor?.[myPlayerName] : undefined;
  const [dismissedPrivateAt, setDismissedPrivateAt] = useState<number>(0);

  // ¿Hay una prueba activa que necesita que esta persona responda (voto/trivia/rol secreto)?
  const needsParticipant = !!cardState?.kahootConfig || !!myPrivateMessage;

  // ── Paso obligatorio de entrada: elegir quién eres ANTES de ver nada más.
  // Así desde el primer segundo lees la partida como esa persona y puedes
  // participar en cuanto te toque, no solo cuando salta un voto concreto.
  if (!myPlayerName) {
    const roster = cardState?.players || [];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a14] p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)]">
            <UserCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sala {roomId}</p>
            <h1 className="text-lg font-bold text-white">¿Quién eres?</h1>
          </div>
        </div>

        {roster.length > 0 ? (
          <div className="w-full max-w-md rounded-[24px] border border-fuchsia-500/30 bg-fuchsia-500/10 p-5 backdrop-blur-md">
            <p className="mb-3 text-center text-sm font-semibold text-fuchsia-200">
              Elige tu nombre de la lista de la partida para seguirla y poder participar cuando te toque
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roster.map(p => (
                <button
                  key={p}
                  onClick={() => handleSelectPlayer(p)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
                >
                  <UserCircle2 className="h-4 w-4 opacity-70" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {connected ? 'Esperando la lista de jugadores...' : 'Conectando a la sala...'}
            </p>
            {waitingSeconds >= 8 && (
              <p className="text-xs text-amber-300/80 leading-5">
                Está tardando más de lo normal. Comprueba que en el móvil que creó la
                partida la partida ya está en marcha (no solo en la pantalla de
                configurar jugadores) — en cuanto lo esté, esto se actualiza solo.
              </p>
            )}
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10"
          >
            Salir
          </button>
        )}
      </div>
    );
  }

  // ── Rol secreto (Impostor): pantalla propia, a pantalla completa, SOLO
  // visible en el móvil de esa persona. Nadie más recibe esto — el resto de
  // móviles ven la carta normal de siempre. Se vuelve a mostrar en cada
  // ronda de impostor nueva (cardIndex distinto) aunque ya se haya cerrado.
  if (myPrivateMessage && cardState && cardState.cardIndex !== dismissedPrivateAt) {
    const isImpostor = myPrivateMessage.isImpostor;
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center p-6 text-center ${isImpostor ? 'bg-gradient-to-b from-red-950 to-[#0a0a14]' : 'bg-gradient-to-b from-emerald-950 to-[#0a0a14]'}`}>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-white/40">{myPrivateMessage.category}</p>
        {isImpostor ? (
          <>
            <p className="mb-4 text-5xl">🎭</p>
            <h1 className="mb-3 text-2xl font-black uppercase tracking-wide text-red-400">Eres el impostor</h1>
            <p className="mb-6 text-sm text-white/60 max-w-xs">
              No sabes la palabra real. Disimula con esta pista sin que se note que no la conoces:
            </p>
            <div className="w-full max-w-xs rounded-[24px] border border-red-500/30 bg-red-500/10 p-5">
              <p className="text-xl font-bold text-white">{myPrivateMessage.word}</p>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-5xl">🕵️</p>
            <h1 className="mb-3 text-2xl font-black uppercase tracking-wide text-emerald-400">No eres el impostor</h1>
            <p className="mb-6 text-sm text-white/60 max-w-xs">
              Esta es la palabra real. Descríbela sin decirla y sin que el impostor la adivine:
            </p>
            <div className="w-full max-w-xs rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-xl font-bold text-white">{myPrivateMessage.word}</p>
              {myPrivateMessage.hint && (
                <p className="mt-2 text-xs text-emerald-300/70">{myPrivateMessage.hint}</p>
              )}
            </div>
          </>
        )}
        <p className="mt-6 text-xs text-white/30">No le enseñes esto a nadie 🤫</p>
        <button
          onClick={() => setDismissedPrivateAt(cardState.cardIndex)}
          className="mt-8 rounded-2xl bg-white/10 border border-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
        >
          Ya lo sé, continuar
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a14] p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)]">
          <Eye className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sala {roomId}
          </p>
          <h1 className="text-lg font-bold text-white">Vista espectador</h1>
        </div>
        <div className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          connected
            ? 'bg-emerald-400/10 text-emerald-300'
            : 'bg-yellow-400/10 text-yellow-300'
        }`}>
          <div className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          {connected ? 'En vivo' : 'Conectando...'}
        </div>
      </div>

      {/* Modo actual: narrador (solo mirando) vs participante (hay que responder) */}
      {connected && (
        <div className={`mb-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
          needsParticipant
            ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30'
            : 'bg-white/5 text-white/40 border border-white/10'
        }`}>
          {needsParticipant ? '🎮 Participante — te toca responder' : '🎙️ Narrador — solo estás viendo la partida'}
        </div>
      )}

      {myPlayerName && (
        <div className="mb-4 flex items-center justify-between w-full max-w-md rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
          <span className="text-xs font-semibold text-emerald-300">
            Jugando como: {myPlayerName}
          </span>
          <button
            onClick={() => {
              setMyPlayerName(null);
              localStorage.removeItem('beep_spectator_name');
            }}
            className="text-[10px] uppercase tracking-wider text-emerald-400/60 hover:text-emerald-300 transition"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Card display — vista de narrador normal (no se oculta ni en modo participante,
          así siempre se ve qué está pasando en la partida) */}
      <AnimatePresence mode="wait">
        {cardState ? (
          <motion.div
            key={cardState.timestamp}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Player badge */}
            {cardState.playerName && (
              <div className="mb-3 flex justify-center">
                <div className="rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.1)] px-4 py-1.5 text-sm font-bold text-[hsl(var(--accent))]">
                  👤 {cardState.playerName}
                </div>
              </div>
            )}

            {/* Card */}
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 shadow-2xl">
              <p className="text-center text-lg font-semibold leading-relaxed text-white">
                {cardState.text}
              </p>
            </div>

            {/* Timestamp */}
            {lastUpdate && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {connected
                ? 'Esperando la primera carta...'
                : 'Conectando a la sala...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KAHOOT MODAL para el espectador — no se muestra hasta que sepamos
          quién eres, para que el voto quede atribuido a un jugador real */}
      <AnimatePresence>
        {cardState?.kahootConfig && myPlayerName && (
          <KahootVoteSession
            roomId={roomId}
            question={cardState.kahootConfig.question}
            options={cardState.kahootConfig.options}
            correctAnswer={cardState.kahootConfig.correctAnswer}
            isHost={false}
            onClose={() => {}}
          />
        )}
      </AnimatePresence>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10"
        >
          Salir
        </button>
      )}
    </div>
  );
}
