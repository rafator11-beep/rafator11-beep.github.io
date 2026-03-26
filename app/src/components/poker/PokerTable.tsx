import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';
import { Users, Coins, Crown } from 'lucide-react';
import { useDailyVideo } from '@/components/multiplayer/DailyVideoProvider';
import tapete from '@/assets/tapete.jpg';
import reverso from '@/assets/reverso.jpg';

// Helper component to render a video track
function VideoTrack({ track, muted = false, className = '' }: { track: MediaStreamTrack; muted?: boolean; className?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const el = videoRef.current;
        if (!el || !track) return;
        const stream = new MediaStream([track]);
        el.srcObject = stream;
        return () => { el.srcObject = null; };
    }, [track]);
    return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
}

interface PokerTableProps {
    players: Player[];
    gameState: any;
    localPlayerId?: string;
    myCards?: string[];
    remoteStreams?: any[];
    localStream?: MediaStream | null;
    equippedCards?: Record<string, string>; // Player ID -> Card Image URL
}

export function PokerTable({ players, gameState, localPlayerId, myCards = [], remoteStreams = [], localStream, equippedCards }: PokerTableProps) {
    const { participants: dailyParticipants } = useDailyVideo();
    const pot = gameState?.pot || 0;
    const communityCards = gameState?.community_cards || [];
    const currentTurn = gameState?.current_turn;
    const isMobile = window.innerWidth <= 768;
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const handleImageError = (playerId: string) => {
        setImageErrors(prev => ({ ...prev, [playerId]: true }));
    };

    const suitSymbols: Record<string, { symbol: string, color: string }> = {
        'H': { symbol: '♥', color: 'text-red-500' },
        'D': { symbol: '♦', color: 'text-red-500' },
        'S': { symbol: '♠', color: 'text-slate-900' },
        'C': { symbol: '♣', color: 'text-slate-900' }
    };

    return (
        <div className="relative w-full aspect-[4/5] md:aspect-[16/10] xl:aspect-video max-w-6xl mx-auto my-2 md:my-4">
            <div className="absolute left-[8%] top-[14%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
            <div className="absolute right-[10%] bottom-[16%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
            {/* Table Border and Felt */}
            <div className="absolute inset-x-1 inset-y-6 md:inset-x-6 md:inset-y-8 rounded-[120px] md:rounded-[220px] border-[10px] md:border-[18px] border-[#5f3b18] bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.24),transparent_42%),linear-gradient(180deg,#115e3b_0%,#0f5135_35%,#0a3825_100%)] shadow-[inset_0_0_90px_rgba(0,0,0,0.65),0_24px_46px_rgba(0,0,0,0.52)] overflow-hidden">
                {/* Inner ring */}
                <div className="absolute inset-2 md:inset-4 rounded-[100px] md:rounded-[198px] border border-emerald-200/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
                {/* Logo watermark */}
                <div
                    className="absolute inset-6 rounded-[50%] opacity-[0.06] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url('${tapete}')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            </div>

            {/* Center: Pot + Community Cards */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                {/* Pot Display */}
                <AnimatePresence>
                    {pot > 0 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 bg-black/70 backdrop-blur-xl px-5 py-2.5 rounded-full border border-yellow-300/20 shadow-[0_0_26px_rgba(234,179,8,0.16)] mb-4"
                        >
                            <Coins className="text-yellow-400 w-5 h-5 animate-pulse" />
                            <span className="font-black text-2xl md:text-3xl text-yellow-400 tabular-nums">{pot}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Waiting state */}
                {gameState?.status === 'waiting' && (
                    <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-white/25 uppercase tracking-[0.45em] text-sm md:text-base font-black"
                    >
                        ESPERANDO
                    </motion.div>
                )}

                {/* Community Cards */}
                <div className="flex gap-2 md:gap-3 min-h-[74px] md:min-h-[108px] items-center rounded-full bg-black/20 px-4 py-2 border border-white/5">
                    {communityCards.map((cardString: string, i: number) => {
                        const rank = cardString.slice(0, -1);
                        const suit = cardString.slice(-1);
                        const { symbol, color } = suitSymbols[suit] || { symbol: '?', color: 'text-black' };

                        return (
                            <motion.div
                                key={`${cardString}-${i}`}
                                initial={{ opacity: 0, scale: 0.3, rotateY: 180 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                                className="w-14 h-20 md:w-[72px] md:h-[100px] bg-white rounded-[16px] flex flex-col items-center justify-between py-1.5 md:py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.34)] border border-slate-200"
                            >
                                <span className={`text-lg md:text-2xl font-black ${color}`}>{rank}</span>
                                <span className={`text-2xl md:text-3xl ${color}`}>{symbol}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Players around the elliptical table */}
            <div className="absolute inset-0 overflow-visible">
                {(() => {
                    const localIdx = players.findIndex(p => p.id === localPlayerId);
                    const shiftedPlayers = localIdx === -1
                        ? players
                        : [...players.slice(localIdx), ...players.slice(0, localIdx)];

                    return shiftedPlayers.map((p, i) => {
                        const angle = (i / Math.max(shiftedPlayers.length, 1)) * Math.PI * 2 + Math.PI / 2;
                        const rx = isMobile ? 36 : 42;
                        const ry = isMobile ? 42 : 36;
                        const x = 50 + Math.cos(angle) * rx;
                        const y = 50 + Math.sin(angle) * ry;

                        const isLocal = p.id === localPlayerId;
                        const isTurn = p.id === currentTurn;
                        const isFolded = gameState?.folded_players?.includes(p.id);
                        const hasCards = gameState?.status !== 'waiting' && gameState?.status !== 'finished';

                        return (
                            <motion.div
                                key={p.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: isFolded ? 0.4 : 1 }}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-1.5 md:p-2.5 rounded-[24px] transition-all premium-panel-soft ${isLocal ? 'z-30' : 'z-10'
                                    } ${isTurn ? 'scale-90 md:scale-110' : 'scale-75 md:scale-100'}`}
                                style={{ left: `${x}%`, top: `${y}%` }}
                            >
                                {/* Turn indicator ring */}
                                {isTurn && (
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute -inset-1.5 rounded-[26px] bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 blur-md -z-10"
                                    />
                                )}

                                {/* Avatar — Daily.co video > old WebRTC > initials */}
                                <div className={`w-14 h-14 md:w-[76px] md:h-[76px] rounded-full overflow-hidden border-[3px] ${isTurn ? 'border-yellow-400 shadow-[0_0_24px_rgba(234,179,8,0.34)]' : 'border-white/20'} bg-zinc-800 shadow-2xl`}>
                                    {(() => {
                                        // 1. Try Daily.co video
                                        const dailyP = dailyParticipants.find(dp =>
                                            dp.userName.toLowerCase() === p.name.toLowerCase() ||
                                            (isLocal && dp.isLocal)
                                        );
                                        if (dailyP?.videoTrack) {
                                            return <VideoTrack track={dailyP.videoTrack} muted={isLocal} className="w-full h-full object-cover" />;
                                        }
                                        // 2. Try old WebRTC (fallback)
                                        if (isLocal && localStream) {
                                            return <video autoPlay muted playsInline ref={el => { if (el) el.srcObject = localStream; }} className="w-full h-full object-cover" />;
                                        }
                                        if (!isLocal) {
                                            const peer = remoteStreams.find(s => s.peerId === p.id);
                                            if (peer) return <video autoPlay playsInline muted={false} ref={el => { if (el) el.srcObject = peer.stream; }} className="w-full h-full object-cover" />;
                                        }
                                        // 3. Avatar image or initials
                                        if (p.avatar_url && !imageErrors[p.id]) {
                                            return <img src={p.avatar_url} alt={p.name} onError={() => handleImageError(p.id)} className="w-full h-full object-cover" />;
                                        }
                                        return (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                                                <span className="text-2xl">{p.name.slice(0, 1).toUpperCase()}</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Name */}
                                <span className={`text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full truncate max-w-[80px] md:max-w-[100px] mt-1 ${isTurn ? 'bg-yellow-400 text-black' : 'bg-black/80 text-white border border-white/10'
                                    }`}>
                                    {p.name}
                                </span>

                                {/* Chips */}
                                <span className="text-[10px] md:text-xs text-yellow-300 font-mono mt-1 flex items-center gap-1 bg-black/70 px-2.5 py-1 rounded-full border border-yellow-300/15">
                                    <Coins size={10} className="fill-current" /> {p.score || 0}
                                </span>

                                {/* Cards — only show for remote players here */}
                                {hasCards && !isFolded && !isLocal && (
                                    <div className="flex justify-center -space-x-3 md:-space-x-2 z-50 mt-1.5">
                                        <>
                                            <div
                                                className="w-8 h-12 md:w-11 md:h-16 rounded-[10px] border border-white/20 shadow-lg transform -rotate-10 bg-cover bg-center bg-[#003366]"
                                                style={{ backgroundImage: `url('${equippedCards?.[p.id] || reverso}')` }}
                                            />
                                            <div
                                                className="w-8 h-12 md:w-11 md:h-16 rounded-[10px] border border-white/20 shadow-lg transform rotate-10 bg-cover bg-center bg-[#003366]"
                                                style={{ backgroundImage: `url('${equippedCards?.[p.id] || reverso}')` }}
                                            />
                                        </>
                                    </div>
                                )}

                                {/* Folded label */}
                                {isFolded && hasCards && (
                                    <span className="text-[9px] uppercase text-red-400 font-bold mt-1 bg-red-900/30 px-2 py-0.5 rounded-full">Fold</span>
                                )}
                            </motion.div>
                        );
                    });
                })()}
            </div>

            {/* LOCAL PLAYER CARDS — Fixed bottom bar, always visible */}
            {myCards.length === 2 && gameState?.status !== 'waiting' && gameState?.status !== 'finished' && !gameState?.folded_players?.includes(localPlayerId) && (
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-4 py-3 z-50"
                >
                    <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl px-5 md:px-6 py-3 rounded-[24px] border border-white/10 shadow-[0_-8px_36px_rgba(0,0,0,0.45)]">
                        <span className="text-xs text-white/60 font-bold uppercase tracking-wider">Tus cartas</span>
                        <div className="flex gap-2">
                            {myCards.map((c, idx) => {
                                const r = c.slice(0, -1);
                                const s = c.slice(-1);
                                const { symbol, color } = suitSymbols[s] || { symbol: '?', color: 'text-black' };
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ y: 20, opacity: 0, rotate: 0 }}
                                        animate={{ y: 0, opacity: 1, rotate: idx === 0 ? -6 : 6 }}
                                        transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
                                        className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-[16px] border-2 border-slate-200 flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.34)]"
                                    >
                                        <span className={`text-lg md:text-xl font-black leading-none ${color}`}>{r}</span>
                                        <span className={`text-2xl md:text-3xl leading-none mt-0.5 ${color}`}>{symbol}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
