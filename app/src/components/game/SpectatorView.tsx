import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Eye, Smartphone, X, RefreshCw, UserCircle2, Copy, Users, Sparkles, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KahootVoteSession } from '@/components/game/KahootVoteSession';
import { createPortal } from 'react-dom';
import { copyToClipboard } from '@/utils/clipboard';
import { CountdownRing } from './CountdownRing';
import { extractTimeLimitSeconds } from '@/utils/timeLimit';

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
export type PrivateForPlayer =
  | {
      kind: 'impostor';
      isImpostor: boolean;
      category: string;
      word: string;   // palabra real (no-impostores) o palabra/pista falsa (impostor)
      hint?: string;
    }
  | {
      kind: 'award';
      emoji: string;
      title: string;
      subtitle: string;
      stat?: string;
      accent: string;
    }
  | {
      kind: 'judge';
      topic: string;
      aFavorHints: string[];
      enContraHints: string[];
    }
  | {
      kind: 'mimica';
      word: string;
      category?: string;
    };

interface CardState {
  text: string;
  playerName: string;
  players?: string[];
  kahootConfig?: {
    question: string;
    options: string[];
    correctAnswer?: string;
    mode?: 'standard' | 'fastest_finger' | 'speed_race';
  };
  privateFor?: Record<string, PrivateForPlayer>;
  debateInfo?: { topic: string; teamA: string[]; teamB: string[]; aFavorHints: string[]; enContraHints: string[]; judgeName?: string };
  cardIndex: number;
  timestamp: number;
}

// ── HOST MODE: muestra el QR y emite cartas ────────────────────────────────
export function SpectatorQRPanel({ roomId, currentCard, currentPlayer, players, kahootConfig, privateFor, debateInfo, onDebateVerdict }: {
  roomId: string;
  currentCard: string;
  currentPlayer: string;
  players: string[];
  kahootConfig?: any;
  privateFor?: Record<string, PrivateForPlayer>;
  debateInfo?: { topic: string; teamA: string[]; teamB: string[]; aFavorHints: string[]; enContraHints: string[]; judgeName?: string };
  onDebateVerdict?: (winner: 'A' | 'B', judgeName: string) => void;
}) {
  const spectatorUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&spectator=true`;

  // Siempre con el último estado a mano (sin esperar a un efecto) para poder
  // responder al instante cuando alguien se conecta a mitad de partida.
  const latestPayloadRef = useRef<CardState>({
    text: currentCard, playerName: currentPlayer, players, kahootConfig, privateFor, debateInfo,
    cardIndex: Date.now(), timestamp: Date.now(),
  });
  latestPayloadRef.current = {
    text: currentCard, playerName: currentPlayer, players, kahootConfig, privateFor, debateInfo,
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
      .on('broadcast', { event: 'debate_verdict' }, (payload) => {
        const { winner, judgeName } = (payload.payload as { winner?: 'A' | 'B'; judgeName?: string }) || {};
        if (winner && judgeName) onDebateVerdictRef.current?.(winner, judgeName);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [roomId]);

  // Ref para no re-crear el canal cada vez que cambia la función (que suele
  // ser una nueva closure en cada render del anfitrión).
  const onDebateVerdictRef = useRef(onDebateVerdict);
  onDebateVerdictRef.current = onDebateVerdict;

  // Reenvía el estado cada vez que cambia algo relevante (carta, jugadores, voto activo).
  // Si llega un privateFor NUEVO (objeto distinto al de la última vez — nueva
  // ronda de Impostor, o el premio final), se genera un cardIndex fresco para
  // que el móvil sepa que es un aviso privado NUEVO y lo vuelva a mostrar aunque
  // ya hubiera cerrado uno antes (si no, cardIndex se queda siempre igual y
  // "cardState.cardIndex !== dismissedPrivateAt" nunca se vuelve a cumplir).
  const prevPrivateForRef = useRef<typeof privateFor>(undefined);
  useEffect(() => {
    if (!roomId) return;
    if (privateFor && privateFor !== prevPrivateForRef.current) {
      latestPayloadRef.current = { ...latestPayloadRef.current, cardIndex: Date.now() };
    }
    prevPrivateForRef.current = privateFor;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'card_update',
      payload: latestPayloadRef.current,
    });
  }, [roomId, currentCard, currentPlayer, players, kahootConfig, privateFor, debateInfo]);

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

// ── SALA DE ESPERA: panel QR para PlayerSetup, ANTES de empezar la partida ─
// Mismo patrón visual que SpectatorQRPanel, pero sin carta/kahoot todavía:
// muestra quién se ha conectado desde su móvil y las propuestas de tema que
// manden, para que el anfitrión elija una con un toque.
export function WaitingRoomQRPanel({ roomId, players, onUseTheme }: {
  roomId: string;
  players: string[];
  onUseTheme: (theme: string) => void;
}) {
  const spectatorUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&spectator=true`;

  const [joinedNames, setJoinedNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ name: string; theme: string }[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const playersRef = useRef<string[]>(players);
  playersRef.current = players;

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`spectator:${roomId}`)
      .on('broadcast', { event: 'spectator_ready' }, () => {
        channel.send({ type: 'broadcast', event: 'waiting_room', payload: { players: playersRef.current } });
      })
      .on('broadcast', { event: 'spectator_identified' }, (payload) => {
        const name = (payload.payload as { name?: string })?.name;
        if (!name) return;
        setJoinedNames(prev => prev.includes(name) ? prev : [...prev, name]);
      })
      .on('broadcast', { event: 'theme_suggested' }, (payload) => {
        const { name, theme } = (payload.payload as { name?: string; theme?: string }) || {};
        if (!theme) return;
        setSuggestions(prev => [...prev.filter(s => s.name !== name), { name: name || '???', theme }]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [roomId]);

  // Reenvía la lista de jugadores añadidos cada vez que cambia, para que quien
  // ya está en la sala de espera vea crecer la lista sin tener que recargar.
  useEffect(() => {
    if (!roomId) return;
    channelRef.current?.send({ type: 'broadcast', event: 'waiting_room', payload: { players } });
  }, [roomId, players]);

  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className="relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Sala de espera (QR)"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">QR sala de espera</span>
        {joinedNames.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
            <Users className="h-2.5 w-2.5" />
            {joinedNames.length}
          </span>
        )}
        {suggestions.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
            <Sparkles className="h-2.5 w-2.5" />
            {suggestions.length}
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
                className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                      Sala de espera
                    </p>
                    <h2 className="text-base font-bold text-white">Que se unan antes de empezar</h2>
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
                  Escanea con la cámara para entrar en la sala de espera y proponer un tema
                </p>

                <button
                  onClick={() => copyToClipboard(spectatorUrl, 'Enlace copiado')}
                  className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 active:scale-[0.98]"
                >
                  <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground font-mono">{spectatorUrl}</p>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>

                {/* Quién ya está dentro con su móvil */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Conectados desde el móvil ({joinedNames.length})
                  </p>
                  {joinedNames.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">Nadie se ha identificado todavía — en cuanto escaneen, aparecerá aquí.</p>
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

                {/* Propuestas de tema que han mandado desde los móviles */}
                <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
                    <Sparkles className="h-3 w-3" />
                    Temas propuestos ({suggestions.length})
                  </p>
                  {suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">Nadie ha propuesto un tema todavía.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((s, i) => (
                        <div key={`${s.name}-${i}`} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-2.5 py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">{s.theme}</p>
                            <p className="text-[10px] text-muted-foreground">propuesto por {s.name}</p>
                          </div>
                          <button
                            onClick={() => onUseTheme(s.theme)}
                            className="shrink-0 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-[10px] font-bold uppercase text-cyan-300 hover:bg-cyan-500/30 active:scale-95"
                          >
                            Usar
                          </button>
                        </div>
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

  // Estado de la SALA DE ESPERA (antes de que empiece la partida): lo manda
  // WaitingRoomQRPanel desde PlayerSetup. En cuanto llega el primer card_update
  // de verdad, cardState deja de ser null y esto ya no se usa más.
  const [waitingState, setWaitingState] = useState<{ players: string[] } | null>(null);

  const [myPlayerName, setMyPlayerName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beep_spectator_name') || null;
    }
    return null;
  });

  // Nombre libre mientras el anfitrión todavía no ha añadido a nadie (sala de
  // espera sin roster todavía) — no hay una lista de la que elegir.
  const [freeNameInput, setFreeNameInput] = useState('');

  // Propuesta de tema para la fiesta, enviada desde la sala de espera.
  const [themeInput, setThemeInput] = useState('');
  const [themeSent, setThemeSent] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleSelectPlayer = (p: string) => {
    if (!p.trim()) return;
    setMyPlayerName(p);
    localStorage.setItem('beep_spectator_name', p);
    // Avisa al anfitrión para que lo vea en su lista de "conectados desde el móvil".
    channelRef.current?.send({ type: 'broadcast', event: 'spectator_identified', payload: { name: p } });
  };

  const handleSendThemeSuggestion = () => {
    const theme = themeInput.trim();
    if (!theme || !myPlayerName) return;
    channelRef.current?.send({ type: 'broadcast', event: 'theme_suggested', payload: { name: myPlayerName, theme } });
    setThemeSent(true);
    setTimeout(() => setThemeSent(false), 2500);
    setThemeInput('');
  };

  // Veredicto del juez de un debate: una vez mandado, se deshabilitan los
  // botones hasta que llegue un debate nuevo (cardIndex distinto) — ver reset
  // más abajo, donde se escucha el cambio de cardState.cardIndex.
  const [judgeVerdictSent, setJudgeVerdictSent] = useState(false);
  const sendDebateVerdict = (winner: 'A' | 'B') => {
    if (!myPlayerName || judgeVerdictSent) return;
    channelRef.current?.send({ type: 'broadcast', event: 'debate_verdict', payload: { winner, judgeName: myPlayerName } });
    setJudgeVerdictSent(true);
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
        const next = payload.payload as CardState;
        setCardState(prev => {
          if (!prev || prev.cardIndex !== next.cardIndex) setJudgeVerdictSent(false);
          return next;
        });
        setLastUpdate(new Date());
        setConnected(true);
      })
      .on('broadcast', { event: 'waiting_room' }, (payload) => {
        // Todavía no ha empezado la partida (estamos en PlayerSetup), pero el
        // anfitrión está ahí y nos manda quién se ha añadido hasta ahora.
        gotData = true;
        if (retryInterval) { clearInterval(retryInterval); retryInterval = null; }
        if (waitingInterval) { clearInterval(waitingInterval); waitingInterval = null; }
        setWaitingState(payload.payload as { players: string[] });
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
    const roster = cardState?.players || waitingState?.players || [];
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
        ) : connected ? (
          // Todavía no hay ni un jugador añadido por el anfitrión — déjale
          // escribir su propio nombre para entrar ya a la sala de espera.
          <div className="w-full max-w-md rounded-[24px] border border-fuchsia-500/30 bg-fuchsia-500/10 p-5 backdrop-blur-md">
            <p className="mb-3 text-center text-sm font-semibold text-fuchsia-200">
              El anfitrión todavía no ha añadido a nadie. Escribe tu nombre para entrar en la sala de espera:
            </p>
            <div className="flex gap-2">
              <input
                value={freeNameInput}
                onChange={(e) => setFreeNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelectPlayer(freeNameInput); }}
                placeholder="Tu nombre..."
                className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-500/50"
              />
              <button
                onClick={() => handleSelectPlayer(freeNameInput)}
                disabled={!freeNameInput.trim()}
                className="rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 px-4 py-2 text-sm font-bold text-fuchsia-200 hover:bg-fuchsia-500/30 disabled:opacity-40"
              >
                Entrar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Conectando a la sala...</p>
            {waitingSeconds >= 8 && (
              <p className="text-xs text-amber-300/80 leading-5">
                Está tardando más de lo normal. Comprueba que en el móvil que creó la
                partida sigue abierta la app en la pantalla de añadir jugadores — en
                cuanto lo esté, esto se actualiza solo.
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

  // ── Sala de espera: ya elegiste nombre, pero la partida todavía no ha
  // empezado (no ha llegado ningún card_update real todavía). Deja proponer
  // un tema para la fiesta mientras se espera. En cuanto el anfitrión empiece
  // la partida, cardState dejará de ser null y esta pantalla desaparece sola.
  if (!cardState) {
    const roster = waitingState?.players || [];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a14] p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.2)]">
            <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sala {roomId}</p>
            <h1 className="text-lg font-bold text-white">Sala de espera</h1>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between w-full max-w-md rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
          <span className="text-xs font-semibold text-emerald-300">Jugando como: {myPlayerName}</span>
          <button
            onClick={() => { setMyPlayerName(null); localStorage.removeItem('beep_spectator_name'); }}
            className="text-[10px] uppercase tracking-wider text-emerald-400/60 hover:text-emerald-300 transition"
          >
            Cambiar
          </button>
        </div>

        <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/5 p-5 mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Users className="h-3 w-3" />
            Ya en la sala ({roster.length})
          </p>
          {roster.length === 0 ? (
            <p className="text-xs text-muted-foreground/70">Esperando a que el anfitrión añada jugadores...</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {roster.map(name => (
                <span key={name} className="flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                  <UserCircle2 className="h-3 w-3" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="w-full max-w-md rounded-[24px] border border-cyan-500/30 bg-cyan-500/10 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-bold text-white">Propón un tema para la fiesta</h2>
          </div>
          <p className="mb-3 text-xs text-cyan-200/70">
            Ej: "Boda de Rafa", "Cumpleaños", "Cotilleos de oficina"... el anfitrión verá tu propuesta y podrá usarla.
          </p>
          <div className="flex gap-2">
            <input
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendThemeSuggestion(); }}
              placeholder="Escribe tu propuesta..."
              className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleSendThemeSuggestion}
              disabled={!themeInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          {themeSent && (
            <p className="mt-2 text-xs font-semibold text-cyan-300">¡Enviado! El anfitrión ya lo puede ver 🎉</p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {connected ? 'Esperando a que empiece la partida...' : 'Conectando a la sala...'}
        </p>

        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10"
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
    // ── Premio final de la partida: pantalla pensada para hacer captura y
    // enseñársela a los amigos — es el momento con más probabilidad de que
    // alguien la comparta fuera del grupo (lo que de verdad hace crecer el juego).
    if (myPrivateMessage.kind === 'award') {
      const award = myPrivateMessage;
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
          style={{ background: `radial-gradient(circle at 50% 20%, ${award.accent}22, #0a0a14 65%)` }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.35em] text-white/40">Tu premio de la noche</p>
          <p className="mb-5 text-7xl">{award.emoji}</p>
          <h1 className="mb-2 text-2xl font-black uppercase tracking-wide" style={{ color: award.accent }}>{award.title}</h1>
          <p className="mb-6 text-sm text-white/60 max-w-xs">{award.subtitle}</p>
          {award.stat && (
            <div className="mb-2 rounded-full px-5 py-2 text-lg font-black" style={{ background: `${award.accent}25`, color: award.accent }}>
              {award.stat}
            </div>
          )}
          <p className="mt-6 text-[11px] font-mono uppercase tracking-widest text-white/20">BEEP · haz captura y presume 😏</p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'BEEP', text: `${award.emoji} ${award.title} — ${award.subtitle}${award.stat ? ` (${award.stat})` : ''} 🎉` }).catch(() => {});
                }
              }}
              className="rounded-2xl border px-6 py-2.5 text-sm font-semibold text-white hover:opacity-80"
              style={{ borderColor: `${award.accent}50`, background: `${award.accent}20` }}
            >
              Compartir
            </button>
            <button
              onClick={() => setDismissedPrivateAt(cardState.cardIndex)}
              className="rounded-2xl bg-white/10 border border-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    // ── Juez del debate: pantalla privada propia. El juez puede decidir el
    // ganador en cualquier momento (no hace falta esperar al final del
    // cronómetro — así no se queda bloqueado si el debate se alarga o se
    // corta antes), y su veredicto se manda solo al anfitrión.
    if (myPrivateMessage.kind === 'judge') {
      const judge = myPrivateMessage;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-950 to-[#0a0a14]">
          <p className="mb-3 text-5xl">⚖️</p>
          <h1 className="mb-2 text-2xl font-black uppercase tracking-wide text-amber-400">Eres el juez de este debate</h1>
          <p className="mb-5 text-sm text-white/60 max-w-xs">{judge.topic}</p>
          <div className="w-full max-w-sm grid grid-cols-1 gap-3 mb-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-left">
              <p className="font-black uppercase text-emerald-400 text-sm mb-1">A favor</p>
              <ul className="text-[11px] text-emerald-200/80 list-disc pl-4 space-y-0.5">
                {judge.aFavorHints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-left">
              <p className="font-black uppercase text-red-400 text-sm mb-1">En contra</p>
              <ul className="text-[11px] text-red-200/80 list-disc pl-4 space-y-0.5">
                {judge.enContraHints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          </div>
          {judgeVerdictSent ? (
            <p className="text-sm font-bold text-amber-300">✅ Veredicto enviado — esperando al anfitrión</p>
          ) : (
            <div className="w-full max-w-sm grid grid-cols-1 gap-3">
              <button
                onClick={() => sendDebateVerdict('A')}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-base font-black uppercase text-white shadow-lg active:scale-95 transition"
              >
                A FAVOR gana
              </button>
              <button
                onClick={() => sendDebateVerdict('B')}
                className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-base font-black uppercase text-white shadow-lg active:scale-95 transition"
              >
                EN CONTRA gana
              </button>
            </div>
          )}
          <p className="mt-6 text-xs text-white/30">Solo tú ves esta pantalla 🤫</p>
        </div>
      );
    }

    // ── Mímica: solo quien actúa debe ver la palabra. El resto solo ve en la
    // pantalla compartida la categoría/framing genérico (ver PartyGame.tsx).
    if (myPrivateMessage.kind === 'mimica') {
      const mimica = myPrivateMessage;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-fuchsia-950 to-[#0a0a14]">
          <p className="mb-3 text-5xl">🎭</p>
          <h1 className="mb-2 text-xl font-black uppercase tracking-wide text-fuchsia-300">Tienes que representar esto</h1>
          {mimica.category && (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">{mimica.category}</p>
          )}
          <div className="w-full max-w-sm rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-5 mb-6">
            <p className="text-2xl font-black text-white">{mimica.word}</p>
          </div>
          <p className="text-sm text-white/60 max-w-xs">Sin hablar. El grupo adivina. Si no adivinan en 30s, bebes 2.</p>
          <button
            onClick={() => setDismissedPrivateAt(cardState.cardIndex)}
            className="mt-6 rounded-2xl bg-white/10 border border-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            Entendido
          </button>
          <p className="mt-6 text-xs text-white/30">Solo tú ves esta pantalla 🤫</p>
        </div>
      );
    }

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

      {/* Debate en curso: tema + equipos + pistas + el mismo reloj que ve el anfitrión.
          No se muestra en el móvil del juez, que tiene su propia pantalla privada. */}
      {cardState?.debateInfo && !cardState?.kahootConfig && myPrivateMessage?.kind !== 'judge' && (
        <div className="mb-4 w-full max-w-md rounded-[24px] border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-center">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">🗣️ Debate por equipos</p>
          <p className="mb-3 text-sm font-bold text-white">{cardState.debateInfo.topic}</p>
          <div className="mb-3 flex justify-center">
            <CountdownRing seconds={30} resetKey={cardState.debateInfo.topic} size={64} />
          </div>
          <div className="flex items-start justify-center gap-4 text-xs min-w-0">
            <div className="min-w-0 flex-1">
              <p className="font-black uppercase text-emerald-400 text-sm">A FAVOR</p>
              <p className="text-white/80 mb-1 break-words">{cardState.debateInfo.teamA.join(', ')}</p>
              <ul className="text-left text-[10px] text-emerald-200/70 list-disc pl-4 space-y-0.5">
                {cardState.debateInfo.aFavorHints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black uppercase text-red-400 text-sm">EN CONTRA</p>
              <p className="text-white/80 mb-1 break-words">{cardState.debateInfo.teamB.join(', ')}</p>
              <ul className="text-left text-[10px] text-red-200/70 list-disc pl-4 space-y-0.5">
                {cardState.debateInfo.enContraHints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          </div>
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
              {/* Reloj: igual que en la pantalla del anfitrión, para que también
                  se vea desde el móvil cuántos segundos quedan */}
              {(() => {
                const t = extractTimeLimitSeconds(cardState.text);
                return t ? (
                  <div className="mb-3 flex justify-center">
                    <CountdownRing seconds={t} resetKey={cardState.timestamp} size={56} />
                  </div>
                ) : null;
              })()}
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
            mode={cardState.kahootConfig.mode}
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
