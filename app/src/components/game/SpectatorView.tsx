import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Eye, Smartphone, X, RefreshCw, UserCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KahootVoteSession } from '@/components/game/KahootVoteSession';
import { createPortal } from 'react-dom';

interface SpectatorViewProps {
  roomId: string;
  onClose?: () => void;
  isHost?: boolean;
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
  cardIndex: number;
  timestamp: number;
}

// ── HOST MODE: muestra el QR y emite cartas ────────────────────────────────
export function SpectatorQRPanel({ roomId, currentCard, currentPlayer, players, kahootConfig }: {
  roomId: string;
  currentCard: string;
  currentPlayer: string;
  players: string[];
  kahootConfig?: any;
}) {
  const spectatorUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&spectator=true`;

  // Broadcast card to spectators whenever it changes
  useEffect(() => {
    if (!roomId || !currentCard) return;
    const channel = supabase.channel(`spectator:${roomId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'card_update',
          payload: {
            text: currentCard,
            playerName: currentPlayer,
            players: players,
            kahootConfig: kahootConfig,
            cardIndex: Date.now(),
            timestamp: Date.now(),
          },
        });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [roomId, currentCard, currentPlayer, players, kahootConfig]);

  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Ver en móvil (QR)"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">QR</span>
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

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <p className="truncate text-xs text-muted-foreground font-mono">{spectatorUrl}</p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Las cartas se sincronizan en tiempo real
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
  const [myPlayerName, setMyPlayerName] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`spectator:${roomId}`)
      .on('broadcast', { event: 'card_update' }, (payload) => {
        setCardState(payload.payload as CardState);
        setLastUpdate(new Date());
        setConnected(true);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

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

      {/* Identificación de jugador */}
      {!myPlayerName && cardState?.players && cardState.players.length > 0 && (
        <div className="mb-6 w-full max-w-md rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="mb-3 text-center text-sm font-semibold text-white/80">¿Quién eres?</p>
          <div className="grid grid-cols-2 gap-2">
            {cardState.players.map(p => (
              <button
                key={p}
                onClick={() => setMyPlayerName(p)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
              >
                <UserCircle2 className="h-4 w-4 opacity-70" />
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {myPlayerName && (
        <div className="mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
          Jugando como: {myPlayerName}
        </div>
      )}

      {/* Card display */}
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

      {/* KAHOOT MODAL para el espectador */}
      <AnimatePresence>
        {cardState?.kahootConfig && (
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
