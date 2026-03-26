import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { RarityBadge } from '@/components/game/RarityBadge';

interface CardDisplayProps {
    content: string;
    type?: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
    onClick: () => void;
    gameMode: string;
    players?: any[];
    round?: number; // Added to calculate drink multipliers
}

export function sanitizeCardText(text: string): string {
    if (!text) return '';
    let clean = text.trim();
    // Remove variations of "es", "norma", "norma", etc from the beginning
    clean = clean.replace(/^(es\s*:?\s*)+/i, '');
    clean = clean.replace(/^(es\s)+/i, '');
    clean = clean.replace(/^(norma\s*,?\s*:?\s*)+/i, '');
    clean = clean.replace(/^(es\s*norma\s*,?\s*:?\s*)+/i, '');
    clean = clean.replace(/^(nueva norma\s*:?\s*)+/i, '');
    
    // Remove standalone 'es' or 'ES' at the very beginning
    clean = clean.replace(/^es\s+/i, '');

    clean = clean.replace(/\s{2,}/g, ' ').trim();
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean;
}

// Function to multiply drinks based on round number
export function processDrinkingMultiplier(text: string, round: number = 1): React.ReactNode {
    // Determine multiplier based on round
    // Rounds 1-5: 1x, Rounds 6-12: +1 trago (min 2), Rounds 13+: +2 tragos
    let extraDrinks = 0;
    if (round >= 6 && round <= 12) extraDrinks = 1;
    if (round >= 13) extraDrinks = 2;

    if (extraDrinks === 0) {
        // Just format the drinking text to stand out
        const parts = text.split(/(🍺.*?tragos?|🍻.*?doble|🥃.*?fondo|🥂.*?grupal!)/i);
        return parts.map((part, i) => {
            if (part && part.match(/(🍺|🍻|🥃|🥂)/)) {
                return <span key={i} className="text-red-400 font-extrabold block mt-3 text-xl sm:text-2xl animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]">{part}</span>;
            }
            return part;
        });
    }

    // Multiply the numbers dynamically
    const regex = /(🍺.*?)(\d+)(\s*tragos?.*)/i;

    // We split by lines starting with emojis (which usually denote the penalty)
    const segments = text.split(/(\n🍺.*|\n🍻.*|\n🥃.*|\n🥂.*)/i);

    return segments.map((segment, i) => {
        if (!segment) return null;
        if (segment.match(/(\n🍺|\n🍻|\n🥃|\n🥂)/)) {
            // It's a penalty line. Let's try to increase the number.
            let modified = segment;
            const match = modified.match(regex);

            if (match) {
                const originalNum = parseInt(match[2], 10);
                // "Fondo" or huge penalties don't get multiplied linearly, just capped at 5
                const newNum = Math.min(originalNum + extraDrinks, 5);
                modified = `${match[1]}${newNum}${match[3]} 🔥`;
            } else if (modified.toLowerCase().includes('bebe 1 trago')) {
                modified = modified.replace(/bebe 1 trago/i, `bebe ${1 + extraDrinks} tragos 🔥`);
            } else if (modified.toLowerCase().includes('doble')) {
                modified = modified + ' ¡TRIPLE! 🔥🔥'; // Escalate double
            }

            return <span key={i} className="text-red-500 font-black block mt-3 text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">{modified.trim()}</span>;
        }
        return <span key={i}>{segment}</span>;
    });
}

export function CardDisplay({ content, type = 'common', onClick, gameMode, players, round = 1 }: CardDisplayProps) {
    const getIntelligentEmoji = (text: string, type: string) => {
        const t = text.toLowerCase();
        if (t.includes('beso') || t.includes('liar') || t.includes('pico') || t.includes('labio')) return '💋';
        if (t.includes('beb') || t.includes('trago')) return '🍻';
        if (t.includes('ropa') || t.includes('desnud')) return '👕';
        if (t.includes('canción') || t.includes('canta')) return '🎵';
        if (t.includes('baile') || t.includes('baila')) return '💃';
        if (t.includes('ex') || t.includes('pareja') || t.includes('novi')) return '💔';
        if (t.includes('crush') || t.includes('amor')) return '😍';
        if (t.includes('móvil') || t.includes('whatsapp') || t.includes('instagram')) return '📱';
        if (t.includes('dinero') || t.includes('pagar') || t.includes('comprar')) return '💸';
        if (t.includes('cama') || t.includes('dormir')) return '🛌';
        if (t.includes('comida') || t.includes('comer') || t.includes('pizza') || t.includes('hambre')) return '🍕';
        if (t.includes('foto') || t.includes('selfie') || t.includes('cámara')) return '📸';
        if (t.includes('coche') || t.includes('conduc') || t.includes('volante')) return '🚗';
        if (t.includes('animal') || t.includes('perro') || t.includes('gato')) return '🐶';
        if (t.includes('fiesta') || t.includes('club') || t.includes('discoteca')) return '🎊';
        if (type === 'yo_nunca' || type === 'yo_nunca_equipos') return '🙈';
        if (type === 'reto' || type === 'accion') return '🎯';
        if (type === 'bomba' || type === 'ruleta' || type === 'trivia_futbol') return '💣';
        if (type === 'pregunta') return '🧠';
        return '🔥';
    };

    // Dynamic Color Palette Mapping
    const getModeStyles = () => {
        const isNorma = content.toUpperCase().includes('NORMA:') || content.toUpperCase().startsWith('NORMA');
        const intelligentEmoji = getIntelligentEmoji(content, type);

        if (isNorma) {
            return {
                title: 'NUEVA NORMA',
                bgClass: 'bg-gradient-to-b from-orange-400 to-red-600',
                textColor: 'text-orange-700',
                icon: '📜'
            };
        }

        switch (gameMode) {
            case 'megamix':
                return {
                    title: 'BEEP MEGAMIX',
                    bgClass: 'bg-gradient-to-b from-indigo-600 to-purple-900',
                    textColor: 'text-purple-800',
                    icon: intelligentEmoji
                };
            case 'clasico':
                return {
                    title: 'OLIMPIADAS',
                    bgClass: 'bg-gradient-to-b from-blue-400 to-cyan-600',
                    textColor: 'text-blue-700',
                    icon: intelligentEmoji
                };
            case 'yo_nunca':
            case 'yo_nunca_equipos':
                return {
                    title: 'YO NUNCA HE...',
                    bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-900',
                    textColor: 'text-teal-800',
                    icon: intelligentEmoji
                };
            case 'picante':
                return {
                    title: 'LA VERDAD O...',
                    bgClass: 'bg-gradient-to-b from-fuchsia-500 to-pink-700',
                    textColor: 'text-pink-700',
                    icon: intelligentEmoji
                };
            case 'espana':
                return {
                    title: 'FIESTA ESPAÑA',
                    bgClass: 'bg-gradient-to-b from-red-500 to-orange-600',
                    textColor: 'text-red-700',
                    icon: intelligentEmoji
                };
            case 'pacovers':
            case 'veteranos':
                return {
                    title: 'CHIMBOLEO',
                    bgClass: 'bg-gradient-to-b from-amber-400 to-orange-600',
                    textColor: 'text-amber-700',
                    icon: intelligentEmoji
                };
            case 'impostor':
            case 'mimica':
            case 'boca_cerrada':
                return {
                    title: 'RETO ESPECIAL',
                    bgClass: 'bg-gradient-to-b from-violet-600 to-purple-900',
                    textColor: 'text-violet-800',
                    icon: intelligentEmoji
                };
            case 'bomba':
            case 'ruleta':
            case 'trivia_futbol':
                return {
                    title: 'BOMBA',
                    bgClass: 'bg-gradient-to-b from-red-600 to-rose-900',
                    textColor: 'text-red-800',
                    icon: '💣'
                };
            default:
                return {
                    title: 'PREGUNTA',
                    bgClass: 'bg-gradient-to-b from-slate-700 to-slate-900',
                    textColor: 'text-slate-800',
                    icon: intelligentEmoji
                };
        }
    };

    const styles = getModeStyles();

    // Dynamic Content Animation Engine
    const getAnimationProps = () => {
        const lower = content.toLowerCase();
        if (lower.includes('trago') || lower.includes('beber') || lower.includes('fondo') || lower.includes('cerveza') || lower.includes('chupito')) {
            // Wobble effect for drinking
            return {
                animate: { rotate: [0, -2, 2, -1, 1, 0] },
                transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 }
            };
        }
        if (lower.includes('beso') || lower.includes('ropa') || lower.includes('sexy') || lower.includes('caliente')) {
            // Floating seductive pulse
            return {
                animate: { y: [0, -5, 0], scale: [1, 1.02, 1] },
                transition: { duration: 2, repeat: Infinity }
            };
        }
        if (lower.includes('bomba') || lower.includes('castigo') || lower.includes('muerte') || lower.includes('elimina')) {
            // Violent shake
            return {
                animate: { x: [0, -3, 3, -3, 3, 0] },
                transition: { duration: 0.3, repeat: Infinity, repeatDelay: 2 }
            };
        }
        if (lower.includes('rápido') || lower.includes('tiempo') || lower.includes('segundos')) {
            // Heartbeat
            return {
                animate: { scale: [1, 1.05, 1, 1.05, 1] },
                transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }
            };
        }
        return {}; // Default no extra animation for the box itself, just standard UI
    };

    const fx = getAnimationProps();

    useEffect(() => {
        if (!content) return;
        window.speechSynthesis.cancel();
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [content]);

    // Match if there's a specific player name in the text 
    // to put them in the Golden Pill
    const getTargetPlayer = () => {
        if (!players) return null;
        const lowerContent = content.toLowerCase();
        return players.find(p => lowerContent.includes(p.name.toLowerCase()));
    };

    const targetPlayer = getTargetPlayer();
    const isNormaCard = content.toUpperCase().includes('NORMA:') || content.toUpperCase().startsWith('NORMA');

    return (
        <div className="w-full max-w-sm mx-auto h-[75vh] min-h-[500px] flex flex-col justify-between perspective-1000">
            <AnimatePresence mode="wait">
                <motion.div
                    key={content}
                    layout
                    initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className={`w-full h-full relative rounded-[2.5rem] overflow-hidden shadow-2xl ${styles.bgClass}`}
                >
                    {/* Dark Texture Overlay (replaces the pure dark background to keep vibrant color but add texture) */}
                    <div className="absolute inset-0 bg-[url('/modern_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />

                    <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 pt-10 pb-6">
                        
                        <div className="flex flex-col items-center transform transition-all duration-300 group-hover:scale-105 shrink-0 mt-4">
                            <span className="text-8xl md:text-9xl mb-2 drop-shadow-2xl z-10 block text-center filter contrast-125">{styles.icon}</span>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-center leading-[0.85] w-full flex flex-wrap items-center justify-center">
                                {styles.title}
                            </h1>
                        </div>

                        {/* CENTRAL TEXT BOX - Now a borderless dark pill */}
                        <motion.div 
                            className="w-full flex flex-col items-center justify-center relative mt-8 mb-4 max-h-[50%]"
                            {...fx} // Dynamic text-based animation applied here
                        >
                            {targetPlayer && !isNormaCard && (
                                <div className="absolute -top-4 z-20 bg-amber-400 text-amber-900 font-black px-6 py-1.5 rounded-full uppercase tracking-widest text-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                                    {targetPlayer.name}
                                </div>
                            )}

                            <div className="w-full p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl relative bg-black/40 backdrop-blur-md overflow-hidden">
                                {type !== 'common' && (
                                    <div className="absolute top-2 left-0 w-full flex justify-center opacity-50">
                                        <RarityBadge rarity={type} />
                                    </div>
                                )}
                                
                                <div className="mt-2 text-lg md:text-xl font-semibold tracking-tight text-white w-full drop-shadow-sm leading-[1.3] overflow-y-auto no-scrollbar max-h-full">
                                    {isNormaCard ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-yellow-400 text-lg md:text-xl font-black tracking-widest uppercase">¡Novedad!</span>
                                            <span className="leading-snug">{sanitizeCardText(content)}</span>
                                        </div>
                                    ) : (
                                        processDrinkingMultiplier(sanitizeCardText(content), round)
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* BOTTOM PILL BUTTON */}
                        <div className="mt-auto w-full flex flex-col items-center shrink-0">
                            <button 
                                className={`w-full max-w-[280px] bg-white ${styles.textColor} font-bold text-2xl py-4 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-center tracking-wide`}
                                onClick={onClick}
                            >
                                Siguiente
                            </button>
                            
                            {/* App-like user icon placeholder styling */}
                            <div className="mt-4 opacity-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 text-white shadow-inner">
                                <User className="w-5 h-5" />
                            </div>
                        </div>

                    </div>
                    
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
