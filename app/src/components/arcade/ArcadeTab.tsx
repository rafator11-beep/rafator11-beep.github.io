import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Diamond, Target, Gamepad2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRanking } from '@/hooks/useRanking';
import { useGameContext } from '@/contexts/GameContext';
import { addGemsToPlayer, loadLocalRankings, saveLocalRankings } from '@/utils/localRanking';
import { DailySpin } from './DailySpin';
import { SlotMachine } from './SlotMachine';
import { MemoryMatch } from './MemoryMatch';
import { GemCatcher } from './GemCatcher';
import { SimonSays } from './SimonSays';
import { ArcadeOnlineHub } from './ArcadeOnlineHub';
import { AnimatedCount } from '@/components/ui/AnimatedCount';
const NOISE_DATA_URI = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

type ArcadeGame = 'menu' | 'spin' | 'slots' | 'memory' | 'catcher' | 'simon' | 'online';

export function ArcadeTab() {
    const [activeGame, setActiveGame] = useState<ArcadeGame>('menu');
    const { rankings, fetchRankings } = useRanking();
    const { localPlayerId } = useGameContext();

    const handleReturnToMenu = () => {
        setActiveGame('menu');
    };

    const localRank = rankings.find((r: any) => r.id === localPlayerId);
    const currentCoins = localRank?.coins || 0;
    const currentGems = localRank?.gems || 0;

    const handleAddCoins = (amount: number) => {
        if (!localPlayerId) return;
        const all = loadLocalRankings();
        const idx = all.findIndex((r: any) => r.id === localPlayerId);
        if (idx >= 0) {
            all[idx].coins = (all[idx].coins || 0) + amount;
            saveLocalRankings(all);
            fetchRankings();
        }
    };

    const handleAddGems = (amount: number) => {
        if (!localPlayerId) return;
        addGemsToPlayer(localPlayerId, amount);
        fetchRankings();
    };

    if (activeGame !== 'menu') {
        return (
            <div className="min-h-screen bg-background bg-grid-pattern pt-4 px-4 pb-24 relative overflow-hidden">
                <Button variant="outline" className="mb-4 relative z-10" onClick={handleReturnToMenu}>
                    Volver al Arcade
                </Button>
                {activeGame === 'spin' && <DailySpin onAddGems={handleAddGems} onAddCoins={handleAddCoins} />}
                {activeGame === 'slots' && <SlotMachine currentCoins={currentCoins} onAddGems={handleAddGems} onSpendCoins={(amt) => handleAddCoins(-amt)} />}
                {activeGame === 'memory' && <MemoryMatch onAddGems={handleAddGems} />}
                {activeGame === 'catcher' && <GemCatcher onAddGems={handleAddGems} />}
                {activeGame === 'simon' && <SimonSays onAddGems={handleAddGems} />}
                {activeGame === 'online' && <ArcadeOnlineHub onReturn={handleReturnToMenu} />}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background bg-grid-pattern pb-24 pt-8 px-4 relative overflow-hidden">
            {/* Background Magic */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(var(--neon-purple))] opacity-10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--neon-blue))] opacity-10 rounded-full blur-[100px]" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 relative z-10"
                >
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                        <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2">🕹️</span>
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] font-arcade uppercase">
                            ARCADE
                        </h1>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/80 font-arcade">
                        BEEP Gaming Zone • Gana Gemas
                    </p>
                </motion.div>

                {/* Currency Display */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center gap-6 mb-12"
                >
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 flex flex-col items-center gap-1 border-2 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <AnimatedCount value={currentCoins} className="text-2xl font-black text-white font-arcade" />
                        <span className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest font-arcade">Monedas</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 flex flex-col items-center gap-1 border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        <Diamond className="w-5 h-5 text-cyan-400" />
                        <AnimatedCount value={currentGems} className="text-2xl font-black text-white font-arcade" />
                        <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest font-arcade">Gemas</span>
                    </div>
                </motion.div>

                {/* 1v1 Online Feature Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div
                        onClick={() => setActiveGame('online')}
                        className="relative group cursor-pointer overflow-hidden rounded-[40px] p-10 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 shadow-[0_20px_50px_rgba(168,85,247,0.3)] border-4 border-white/10 flex flex-col items-center text-center transition-all hover:scale-[1.02]"
                    >
                        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: `url('${NOISE_DATA_URI}')` }}></div>
                        
                        <Target className="w-20 h-20 text-white mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-md tracking-tighter font-arcade uppercase">
                            ONLINE DUELS
                        </h2>
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] font-arcade mb-8">Multiplayer en tiempo real</p>

                        <Button size="lg" className="rounded-2xl h-14 px-10 bg-white text-black hover:bg-white/90 font-arcade font-black text-lg shadow-xl hover:translate-y-[-2px] active:translate-y-[2px] transition-all">
                            ENTRAR AL LOBBY
                        </Button>
                    </div>
                </motion.div>

                {/* Minigames Grid */}
                <h3 className="text-[10px] font-black text-white/40 mb-6 px-2 tracking-[0.4em] uppercase font-arcade">Minijuegos en Solitario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GameCard
                        title="Ruleta Diaria"
                        desc="Gira y gana premios cada 24h"
                        emoji="🎰"
                        color="from-pink-500 to-rose-600"
                        onClick={() => setActiveGame('spin')}
                    />
                    <GameCard
                        title="Tragaperras"
                        desc="Apuesta monedas y busca ganar diamantes"
                        emoji="🍒"
                        color="from-yellow-500 to-orange-600"
                        onClick={() => setActiveGame('slots')}
                    />
                    <GameCard
                        title="Memoria Extrema"
                        desc="Encuentra las parejas en un reto brutal 8x8"
                        emoji="🧠"
                        color="from-indigo-500 to-purple-600"
                        onClick={() => setActiveGame('memory')}
                    />
                    <GameCard
                        title="Caza-Gemas"
                        desc="Frenético desafío contrarreloj"
                        emoji="💎"
                        color="from-[hsl(var(--neon-blue))] to-cyan-600"
                        onClick={() => setActiveGame('catcher')}
                    />
                    <GameCard
                        title="Simón Dice"
                        desc="Repite secuencias interminables"
                        emoji="🚦"
                        color="from-emerald-500 to-teal-600"
                        onClick={() => setActiveGame('simon')}
                    />
                </div>
            </div>
        </div>
    );
}

function GameCard({ title, desc, emoji, color, onClick }: { title: string, desc: string, emoji: string, color: string, onClick: () => void }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative group cursor-pointer overflow-hidden rounded-[32px] p-6 bg-gradient-to-br ${color} border-b-8 border-black/20`}
        >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl drop-shadow-lg">{emoji}</span>
                    <div className="bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
                        <span className="text-[8px] font-black text-white uppercase font-arcade tracking-widest">MINI</span>
                    </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 font-arcade uppercase tracking-tighter drop-shadow-md">{title}</h3>
                <p className="text-white/70 text-[10px] uppercase font-bold tracking-wider leading-tight mb-6 h-8 line-clamp-2">{desc}</p>

                <div className="flex items-center gap-2 text-black text-[10px] font-black bg-white w-fit px-4 py-2 rounded-xl shadow-lg font-arcade uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-colors">
                    <Play className="w-3 h-3 fill-current" /> Jugar
                </div>
            </div>
        </motion.div>
    );
}
