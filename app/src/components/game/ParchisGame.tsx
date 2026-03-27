import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LogOut, Loader2, Trophy, ArrowRight, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { RewardPopup } from './RewardPopup';
import { loadLocalRankings, upsertLocalRanking, saveLocalRankings } from '@/utils/localRanking';
import { toast } from 'sonner';
import { ParchisBoard } from './ParchisBoard';
import { getRandomTeamId, getTeamLogoUrl } from '@/lib/footballTeams';
import { ParchisPiece, PlayerColor, PieceState, COLOR_ORDER, createInitialPieces, calculateNextPosition, isSafe } from '@/lib/parchisLogic';
import tapete from '@/assets/tapete.jpg';

export interface ParchisPlayer {
    id: string;
    name: string;
    avatarUrl?: string;
    color: PlayerColor;
    isBot: boolean;
    isReady: boolean;
    score: number;
}

export interface ParchisGameState {
    players: Record<PlayerColor, ParchisPlayer | null>;
    pieces: ParchisPiece[];
    currentTurn: PlayerColor;
    dice: number[];
    status: 'waiting' | 'playing' | 'finished';
    winner: PlayerColor | null;
    lastAction?: string;
}

const COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];

interface ParchisGameProps {
    roomId?: string;
    isHost?: boolean;
    onExit: () => void;
    localPlayerName: string;
    localPlayerAvatar?: string;
}

export function ParchisGame({ roomId, isHost, onExit, localPlayerName, localPlayerAvatar }: ParchisGameProps) {
    const [gameState, setGameState] = useState<ParchisGameState>({
        players: { red: null, blue: null, yellow: null, green: null },
        pieces: [],
        currentTurn: 'red',
        dice: [],
        status: 'waiting',
        winner: null
    });

    const [myColor, setMyColor] = useState<PlayerColor | null>(null);
    const [rolling, setRolling] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [rewardData, setRewardData] = useState({ coins: 0, xp: 0, oldLevel: 1, newLevel: 1, streak: 0 });
    const [rerollCost, setRerollCost] = useState(1);

    const [teamLogos] = useState<Record<PlayerColor, string>>(() => ({
        red: getTeamLogoUrl(getRandomTeamId()),
        blue: getTeamLogoUrl(getRandomTeamId()),
        yellow: getTeamLogoUrl(getRandomTeamId()),
        green: getTeamLogoUrl(getRandomTeamId())
    }));

    const [equippedTokens, setEquippedTokens] = useState<Record<PlayerColor, string>>({} as Record<PlayerColor, string>);

    useEffect(() => {
        // Setup local player initially as red
        setMyColor('red');
        setGameState(prev => ({
            ...prev,
            players: {
                ...prev.players,
                red: { id: 'local', name: localPlayerName, color: 'red', isBot: false, isReady: true, score: 0 }
            },
            pieces: createInitialPieces()
        }));

        // Load equipped tokens
        const rankings = loadLocalRankings();
        const me = rankings.find(r => r.player_name.toLowerCase() === localPlayerName.toLowerCase());
        if (me?.equipped_items?.ficha) {
            setEquippedTokens(prev => ({ ...prev, red: me.equipped_items.ficha }));
        }

    }, [localPlayerName]);

    // Bot AI and Auto-pass logic
    useEffect(() => {
        if (gameState.status !== 'playing' || gameState.winner || rolling) return;

        const currentPlayer = gameState.players[gameState.currentTurn];
        const isBot = currentPlayer?.isBot;

        if (isBot) {
            // Bot needs to roll
            if (gameState.dice.length === 0) {
                const rollTimer = setTimeout(() => {
                    setRolling(true);
                    setTimeout(() => {
                        setRolling(false);
                        const d1 = Math.floor(Math.random() * 6) + 1;
                        const d2 = Math.floor(Math.random() * 6) + 1;
                        setGameState(prev => ({ ...prev, dice: [d1, d2] }));
                    }, 1000);
                }, 1000);
                return () => clearTimeout(rollTimer);
            } 
            
            // Bot needs to move
            if (gameState.dice.length > 0) {
                const moveTimer = setTimeout(() => {
                    const myTotalPieces = gameState.pieces.filter(p => p.color === gameState.currentTurn);
                    const steps = gameState.dice[0];
                    let moved = false;

                    // Try to find a valid move
                    for (const piece of myTotalPieces) {
                        const nextPos = calculateNextPosition(piece, steps);
                        if (nextPos) {
                            handlePieceClick(piece); // reuse the existing logic
                            moved = true;
                            break;
                        }
                    }

                    // If no piece could move, consume die and eventually pass turn
                    if (!moved) {
                        setGameState(prev => {
                            const newDice = prev.dice.slice(1);
                            if (newDice.length === 0) {
                                setTimeout(nextTurn, 500);
                            }
                            return { ...prev, dice: newDice };
                        });
                    }
                }, 1500); // Slightly slower for better readability
                return () => clearTimeout(moveTimer);
            }
        } else {
            // Human player: Auto pass if no valid moves
            if (gameState.dice.length > 0) {
                const steps = gameState.dice[0];
                const myPieces = gameState.pieces.filter(p => p.color === gameState.currentTurn);
                const hasValidMove = myPieces.some(p => calculateNextPosition(p, steps) !== null);
                if (!hasValidMove) {
                    const passTimer = setTimeout(() => {
                        toast.info("No tienes movimientos válidos. Paso de turno automático.");
                        setGameState(prev => {
                            const newDice = prev.dice.slice(1);
                            if (newDice.length === 0) setTimeout(nextTurn, 500);
                            return { ...prev, dice: newDice };
                        });
                    }, 1500);
                    return () => clearTimeout(passTimer);
                }
            }
        }
    }, [gameState.currentTurn, gameState.status, gameState.dice.length, rolling, gameState.winner]);

    const handleGameEnd = async (winnerColor: PlayerColor) => {
        setGameState(prev => ({ ...prev, status: 'finished', winner: winnerColor }));

        const isWin = winnerColor === myColor;

        // Update economics
        const rankings = upsertLocalRanking({
            playerName: localPlayerName,
            scoreToAdd: 0,
            won: isWin,
            gameMode: 'parchis' as any
        });
        const result = rankings.find(r => r.player_name.toLowerCase() === localPlayerName.toLowerCase());

        if (result) {
            setRewardData({
                coins: isWin ? 25 : 3,
                xp: isWin ? 50 : 15,
                oldLevel: result.level || 1, // Assume no level down
                newLevel: result.level || 1,
                streak: result.win_streak || 0
            });
            setShowReward(true);
        }
    };

    const checkWinCondition = (pieces: ParchisPiece[], color: PlayerColor) => {
        const colorPieces = pieces.filter(p => p.color === color);
        if (colorPieces.every(p => p.state === 'goal')) {
            handleGameEnd(color);
            return true;
        }
        return false;
    };

    const handleStartGame = () => {
        // Fill empty slots with bots
        const newPlayers = { ...gameState.players };
        let botCount = 1;
        COLOR_ORDER.forEach(c => {
            if (!newPlayers[c]) {
                newPlayers[c] = { id: `bot-${botCount}`, name: `Bot ${botCount}`, color: c, isBot: true, isReady: true, score: 0 };
                botCount++;
            }
        });

        setGameState(prev => ({ ...prev, status: 'playing', players: newPlayers }));
    };

    const nextTurn = () => {
        setRerollCost(1);
        setGameState(prev => {
            const currentIndex = COLOR_ORDER.indexOf(prev.currentTurn);
            const nextColor = COLOR_ORDER[(currentIndex + 1) % 4];
            return { ...prev, currentTurn: nextColor, dice: [] };
        });
    };

    const handlePieceClick = (piece: ParchisPiece) => {
        if (gameState.dice.length === 0) return;

        const steps = gameState.dice[0];
        const newPos = calculateNextPosition(piece, steps);

        if (newPos) {
            setGameState(prev => {
                const newPieces = prev.pieces.map(p => p.id === piece.id ? { ...p, state: newPos.state, position: newPos.position } : p);

                // Handle eating logic
                if (newPos.state === 'board' && !isSafe(newPos.position)) {
                    const eatenIdx = newPieces.findIndex(p => p.state === 'board' && p.position === newPos.position && p.id !== piece.id && p.color !== piece.color);
                    if (eatenIdx >= 0) {
                        newPieces[eatenIdx].state = 'home';
                        newPieces[eatenIdx].position = 0;
                        toast.success(`¡Te has comido una ficha!`);
                        // Standard Parchis: gives +20 to any piece, but we'll deal with rewards later.
                    }
                }

                const remainingDice = prev.dice.slice(1);

                // Check win condition synchronously before setting state
                if (checkWinCondition(newPieces, piece.color)) {
                    return { ...prev, pieces: newPieces, dice: [] };
                }

                return { ...prev, pieces: newPieces, dice: remainingDice };
            });

            // Turn transition logic
            // Handle turn advance synchronously or via scheduled timeout
            const currentPlayer = gameState.players[gameState.currentTurn];
            const isBot = currentPlayer?.isBot;

            // If no dice left, check for turn advance
            if (gameState.dice.length === 1 && !gameState.winner) {
                // If it's a human, we auto-advance if no more dice.
                // If it's a bot, the Bot AI loop will handle the check and nextTurn call itself.
                if (!isBot) {
                    setTimeout(nextTurn, 800);
                }
            }
        } else {
            toast.error("Movimiento inválido");
        }
    };

    const handleReroll = () => {
        const rankings = loadLocalRankings();
        const idx = rankings.findIndex(r => r.player_name.toLowerCase() === localPlayerName.toLowerCase());

        if (idx >= 0) {
            const currentGems = rankings[idx].gems || 0;
            if (currentGems < rerollCost) {
                toast.error(`Necesitas ${rerollCost} gemas para volver a tirar (tienes ${currentGems} 💎)`);
                return;
            }

            rankings[idx].gems -= rerollCost;
            saveLocalRankings(rankings);

            toast.success(`Pagaste ${rerollCost} 💎 por relanzar dados`);
            setRerollCost(prev => prev * 2);

            setRolling(true);
            setGameState(prev => ({ ...prev, dice: [] }));

            setTimeout(() => {
                setRolling(false);
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                setGameState(prev => ({ ...prev, dice: [d1, d2] }));
            }, 500);
        }
    };

    const getDiceIcon = (value: number) => {
        switch (value) {
            case 1: return Dice1;
            case 2: return Dice2;
            case 3: return Dice3;
            case 4: return Dice4;
            case 5: return Dice5;
            case 6: return Dice6;
            default: return Dice1;
        }
    };

    return (
        <div className="min-h-screen premium-screen text-white flex flex-col overflow-hidden">
            <div className="p-3 md:p-5">
                <div className="premium-panel rounded-[28px] px-4 py-4 md:px-6 md:py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="premium-chip text-cyan-200">Juego de tablero</span>
                                <span className="premium-chip text-white/80">Parchís premium</span>
                                {roomId && <span className="premium-chip text-amber-200">Sala {roomId}</span>}
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black premium-title">Parchís Deluxe</h2>
                                <p className="text-sm md:text-base text-white/60 mt-1">Interfaz más limpia, mejor lectura de turno y tablero optimizado para móvil.</p>
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onExit}
                            className="rounded-2xl shadow-lg shadow-red-500/20 font-bold h-11 px-5 self-start lg:self-auto"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Salir
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div className="premium-stat">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-bold mb-2">Estado</p>
                            <p className="text-lg font-black">{gameState.status === 'waiting' ? 'Sala de espera' : gameState.status === 'finished' ? 'Partida terminada' : 'Partida en curso'}</p>
                        </div>
                        <div className="premium-stat">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-bold mb-2">Turno</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded-full ${gameState.currentTurn === 'red' ? 'bg-red-500' : gameState.currentTurn === 'blue' ? 'bg-blue-500' : gameState.currentTurn === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                                <p className="text-lg font-black capitalize">{gameState.currentTurn}</p>
                            </div>
                        </div>
                        <div className="premium-stat">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-bold mb-2">Tu color</p>
                            <p className="text-lg font-black capitalize">{myColor || 'Asignando...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-3 pb-3 md:px-5 md:pb-5 min-h-0">
                {gameState.status === 'waiting' ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="premium-panel rounded-[30px] p-5 md:p-8 max-w-4xl w-full">
                            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
                                <div>
                                    <p className="section-badge mb-4">Lobby estructurado</p>
                                    <h3 className="text-3xl font-black premium-title mb-2">Prepara la partida</h3>
                                    <p className="text-white/60 mb-6">Los huecos, colores y estado de cada plaza aparecen más claros para que la sala se entienda de un vistazo.</p>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {COLORS.map(color => {
                                            const player = gameState.players[color];
                                            return (
                                                <div key={color} className={`rounded-3xl border p-4 ${color === 'red' ? 'border-red-500/30 bg-red-500/10' : color === 'blue' ? 'border-blue-500/30 bg-blue-500/10' : color === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full shrink-0 ${color === 'red' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : color === 'blue' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]' : color === 'yellow' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]'}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs uppercase tracking-[0.18em] text-white/45 font-bold mb-1">{color}</p>
                                                            {player ? (
                                                                <>
                                                                    <p className="font-bold truncate">{player.name} {player.isBot && <span className="text-white/50">(Bot)</span>}</p>
                                                                    <p className="text-xs text-white/50 mt-1">{myColor === color ? 'Tu plaza' : 'Listo para jugar'}</p>
                                                                </>
                                                            ) : (
                                                                <p className="text-white/45 italic">Esperando jugador...</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="premium-panel-soft rounded-[28px] p-5">
                                    <p className="section-badge mb-4">Panel de inicio</p>
                                    <h4 className="text-xl font-black mb-2">Todo listo</h4>
                                    <p className="text-sm text-white/60 mb-6">Cuando todos estén preparados, arranca la partida desde aquí.</p>

                                    {(!roomId || isHost) && (
                                        <Button
                                            onClick={handleStartGame}
                                            className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-red-600 via-fuchsia-600 to-blue-600 hover:from-red-500 hover:via-fuchsia-500 hover:to-blue-500 text-white shadow-[0_0_24px_rgba(168,85,247,0.28)] border border-white/15"
                                        >
                                            ¡Comenzar partida! <ArrowRight className="ml-2" />
                                        </Button>
                                    )}

                                    {roomId && !isHost && (
                                        <div className="flex items-center justify-center gap-2 text-white/70 bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Esperando al host...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 h-full">
                        <div className="premium-panel rounded-[30px] p-3 md:p-5 relative overflow-hidden min-h-[420px] flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.045] pointer-events-none">
                                <img src={tapete} alt="Centro" className="w-[500px] h-auto grayscale mix-blend-overlay" />
                            </div>
                            <div className="relative z-10 w-full max-w-4xl">
                                <ParchisBoard
                                    pieces={gameState.pieces}
                                    currentTurn={gameState.currentTurn}
                                    myColor={myColor}
                                    onPieceClick={handlePieceClick}
                                    teamLogos={teamLogos}
                                    equippedTokens={equippedTokens}
                                />
                            </div>
                        </div>

                        <div className="premium-panel rounded-[30px] p-4 md:p-5 flex flex-col gap-4">
                            <div className="premium-panel-soft rounded-[24px] p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Turno actual</p>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-4 h-4 rounded-full ${gameState.currentTurn === 'red' ? 'bg-red-500' : gameState.currentTurn === 'blue' ? 'bg-blue-500' : gameState.currentTurn === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                                    <span className="font-black text-2xl capitalize">{gameState.currentTurn}</span>
                                </div>
                                <p className="text-sm text-white/60">{gameState.currentTurn === myColor ? 'Es tu momento para tirar o mover ficha.' : 'Espera a que termine el turno actual.'}</p>
                            </div>

                            <div className="premium-panel-soft rounded-[24px] p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold">Dados</p>
                                    {gameState.dice.length > 0 && <p className="text-xs text-white/45">Listos para mover</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className={`h-20 rounded-[22px] border border-white/10 bg-white text-slate-900 flex items-center justify-center text-3xl font-black shadow-inner ${rolling ? 'animate-bounce' : ''}`}>
                                        {gameState.dice.length > 0 ? gameState.dice[0] : '?'}
                                    </div>
                                    <div className={`h-20 rounded-[22px] border border-white/10 bg-white text-slate-900 flex items-center justify-center text-3xl font-black shadow-inner ${rolling ? 'animate-bounce delay-75' : ''}`}>
                                        {gameState.dice.length > 1 ? gameState.dice[1] : (gameState.dice.length === 1 ? '✓' : '?')}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    {gameState.dice.length === 2 && gameState.currentTurn === myColor && (
                                        <Button
                                            onClick={handleReroll}
                                            disabled={rolling}
                                            className="h-11 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_16px_rgba(16,185,129,0.22)] border border-emerald-400/30 text-sm"
                                        >
                                            💎 Relanzar por {rerollCost}
                                        </Button>
                                    )}
                                    <Button
                                        disabled={gameState.currentTurn !== myColor || rolling || gameState.dice.length > 0}
                                        onClick={() => {
                                            setRolling(true);
                                            setTimeout(() => {
                                                setRolling(false);
                                                const d1 = Math.floor(Math.random() * 6) + 1;
                                                const d2 = Math.floor(Math.random() * 6) + 1;
                                                setGameState(prev => ({
                                                    ...prev,
                                                    dice: [d1, d2]
                                                }));
                                            }, 500);
                                        }}
                                        className={`h-14 rounded-2xl font-black text-base border ${gameState.currentTurn === myColor && gameState.dice.length === 0
                                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-[0_0_18px_rgba(99,102,241,0.28)] border-white/15 text-white'
                                            : 'bg-white/10 text-white/30 border-white/5 cursor-not-allowed'
                                            }`}
                                    >
                                        {rolling ? 'Tirando...' : 'Tirar dados'}
                                    </Button>
                                </div>
                            </div>

                            <div className="premium-panel-soft rounded-[24px] p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-3">Jugadores</p>
                                <div className="space-y-2">
                                    {COLORS.map(color => {
                                        const player = gameState.players[color];
                                        return (
                                            <div key={color} className={`flex items-center justify-between rounded-2xl px-3 py-3 border ${gameState.currentTurn === color ? 'border-fuchsia-400/30 bg-fuchsia-500/10' : 'border-white/8 bg-white/5'}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 ${color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : color === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold truncate">{player?.name || 'Hueco libre'}</p>
                                                        <p className="text-xs text-white/45 capitalize">{color}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-white/45">{player ? 'Activo' : 'Vacío'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <RewardPopup
                isOpen={showReward}
                onClose={() => {
                    setShowReward(false);
                    onExit();
                }}
                result={gameState.winner === myColor ? 'win' : 'lose'}
                coinsEarned={rewardData.coins}
                xpEarned={rewardData.xp}
                oldLevel={rewardData.oldLevel}
                newLevel={rewardData.newLevel}
                streak={rewardData.streak}
            />
        </div>
    );
}
