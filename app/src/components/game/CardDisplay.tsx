import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardDisplayProps {
    content: string;
    type?: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
    onClick: () => void;
    gameMode: string;
    players?: any[];
    round?: number;
}

// ── SANITIZE ──────────────────────────────────────────────────────────────────

export function sanitizeCardText(text: string): string {
    if (!text) return '';
    let clean = text.trim();
    // Quitar comillas de apertura
    clean = clean.replace(/^["'""''«»]+/, '');
    // Eliminar "es" como artefacto del dataset al inicio
    clean = clean.replace(/^es\s*[:\-,]?\s+/i, '');
    // Prefijos de modo emoji que ya están representados visualmente
    clean = clean.replace(/^🎭\s*M[IÍ]MICA\s*:\s*/i, '');
    clean = clean.replace(/^🤐\s*BOCA\s*CERRADA\s*:\s*/i, '');
    clean = clean.replace(/^📜\s*NORMA\s*:\s*/i, '');
    clean = clean.replace(/^NORMA\s*:\s*/i, '');
    clean = clean.replace(/^NUEVA\s*NORMA\s*:\s*/i, '');
    clean = clean.replace(/^🙈\s*(Yo\s*nunca[.…]?\s*)?/i, '');
    clean = clean.replace(/^🎯\s*/i, '');
    clean = clean.replace(/^🌶️\s*/i, '');
    clean = clean.replace(/^🗳️\s*/i, '');
    clean = clean.replace(/^🇪🇸\s*/i, '');
    clean = clean.replace(/^🛌\s*/i, '');
    clean = clean.replace(/^🔤\s*/i, '');
    clean = clean.replace(/^🍺\s*/i, '');
    clean = clean.replace(/^🍻\s*/i, '');
    clean = clean.replace(/^🥃\s*/i, '');
    // Prefijos textuales redundantes
    clean = clean.replace(/^(reto\s*:?\s*)+/i, '');
    clean = clean.replace(/^(norma\s*:?\s*)+/i, '');
    // Normalizar espacios
    clean = clean.replace(/\s{2,}/g, ' ').trim();
    // Eliminar comillas de cierre
    clean = clean.replace(/["'""''«»]+$/, '');
    // Capitalizar
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean;
}

// ── DRINK MULTIPLIER ─────────────────────────────────────────────────────────

export function processDrinkingMultiplier(text: string, round: number = 1): React.ReactNode {
    let extraDrinks = 0;
    if (round >= 6 && round <= 12) extraDrinks = 1;
    if (round >= 13) extraDrinks = 2;

    if (extraDrinks === 0) {
        const parts = text.split(/(🍺.*?tragos?|🍻.*?doble|🥃.*?fondo|🥂.*?grupal!)/i);
        return parts.filter(Boolean).map((part, i) => {
            if (part && part.match(/(🍺|🍻|🥃|🥂)/)) {
                return <span key={i} className="text-red-400 font-extrabold block mt-3 text-xl sm:text-2xl animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]">{part}</span>;
            }
            return part;
        });
    }

    const regex = /(🍺.*?)(\d+)(\s*tragos?.*)/i;
    const segments = text.split(/(\n🍺.*|\n🍻.*|\n🥃.*|\n🥂.*)/i);

    return segments
        .filter((segment): segment is string => Boolean(segment))
        .map((segment, i) => {
            if (segment.match(/(\n🍺|\n🍻|\n🥃|\n🥂)/)) {
                let modified = segment;
                const match = modified.match(regex);

                if (match) {
                    const originalNum = parseInt(match[2], 10);
                    const newNum = Math.min(originalNum + extraDrinks, 5);
                    modified = `${match[1]}${newNum}${match[3]} 🔥`;
                } else if (modified.toLowerCase().includes('bebe 1 trago')) {
                    modified = modified.replace(/bebe 1 trago/i, `bebe ${1 + extraDrinks} tragos 🔥`);
                } else if (modified.toLowerCase().includes('doble')) {
                    modified = modified + ' ¡TRIPLE! 🔥🔥';
                }

                return <span key={i} className="text-red-500 font-black block mt-3 text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">{modified.trim()}</span>;
            }
            return <span key={i}>{segment}</span>;
        });
}

// ── CARD THEMES ──────────────────────────────────────────────────────────────

interface CardTheme {
    bg: string;
    textBoxBg: string;
    textColor: string;
    accentColor: string;
    modeName: string;
    modeEmoji: string;
    emojiCircle: string;
    extra: string;
}

const CARD_THEMES: Record<string, CardTheme> = {
    yoNunca: {
        bg: 'from-emerald-500 to-teal-700',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#10b981',
        modeName: 'YO NUNCA HE...',
        modeEmoji: '🙈',
        emojiCircle: 'bg-white/20',
        extra: 'drinkBar',
    },
    drink: {
        bg: 'from-amber-400 to-orange-600',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#f59e0b',
        modeName: '¡BEBE!',
        modeEmoji: '🍺',
        emojiCircle: 'bg-white/20',
        extra: 'drinkCounter',
    },
    reto: {
        bg: 'from-blue-500 to-indigo-700',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#3b82f6',
        modeName: 'RETO',
        modeEmoji: '🎯',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
    },
    picante: {
        bg: 'from-rose-500 to-pink-700',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#f43f5e',
        modeName: 'PICANTE 🔞',
        modeEmoji: '🌶️',
        emojiCircle: 'bg-white/20',
        extra: 'thermometer',
    },
    masProbable: {
        bg: 'from-violet-500 to-purple-700',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#8b5cf6',
        modeName: '¿QUIÉN ES MÁS PROBABLE?',
        modeEmoji: '🗳️',
        emojiCircle: 'bg-white/20',
        extra: 'voteBar',
    },
    pacovers: {
        bg: 'from-red-600 to-yellow-500',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#dc2626',
        modeName: 'ESPAÑA 🇪🇸',
        modeEmoji: '🇪🇸',
        emojiCircle: 'bg-white/20',
        extra: 'flag',
    },
    enLaCama: {
        bg: 'from-purple-600 to-indigo-800',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#7c3aed',
        modeName: 'EN LA CAMA Y...',
        modeEmoji: '🛌',
        emojiCircle: 'bg-white/20',
        extra: 'hearts',
    },
    categorias: {
        bg: 'from-cyan-500 to-blue-600',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#06b6d4',
        modeName: 'CATEGORÍAS',
        modeEmoji: '🔤',
        emojiCircle: 'bg-white/20',
        extra: 'timer',
    },
    mimica: {
        bg: 'from-fuchsia-500 to-pink-600',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#d946ef',
        modeName: '🎭 MÍMICA',
        modeEmoji: '🎭',
        emojiCircle: 'bg-white/20',
        extra: 'clock',
    },
    bocaCerrada: {
        bg: 'from-orange-500 to-red-600',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#f97316',
        modeName: '🤐 BOCA CERRADA',
        modeEmoji: '🤐',
        emojiCircle: 'bg-white/20',
        extra: 'lock',
    },
    norma: {
        bg: 'from-orange-400 to-amber-600',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#f97316',
        modeName: '📜 NUEVA NORMA',
        modeEmoji: '📜',
        emojiCircle: 'bg-white/20',
        extra: 'timer',
    },
    trivia: {
        bg: 'from-sky-500 to-blue-700',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#0ea5e9',
        modeName: '🧠 TRIVIA',
        modeEmoji: '🧠',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
    },
    legendary: {
        bg: 'from-yellow-400 to-amber-600',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#fbbf24',
        modeName: '👑 LEGENDARIA',
        modeEmoji: '👑',
        emojiCircle: 'bg-black/20',
        extra: 'crown',
    },
    chaos: {
        bg: 'from-pink-500 to-purple-700',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#ec4899',
        modeName: '💥 MODO CAOS',
        modeEmoji: '💥',
        emojiCircle: 'bg-white/20',
        extra: 'explosion',
    },
    virus: {
        bg: 'from-green-600 to-emerald-900',
        textBoxBg: 'bg-black/80',
        textColor: 'text-white',
        accentColor: '#22c55e',
        modeName: '🦠 VIRUS',
        modeEmoji: '🦠',
        emojiCircle: 'bg-green-500/20',
        extra: 'clock',
    },
    megamix: {
        bg: 'from-indigo-600 to-purple-800',
        textBoxBg: 'bg-white',
        textColor: 'text-gray-900',
        accentColor: '#6366f1',
        modeName: 'BEEP MEGAMIX',
        modeEmoji: '🎲',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
    },
};

function getCardTheme(content: string, type: string, gameMode: string): CardTheme {
    const c = (content || '').toLowerCase();

    // Rareza primero
    if (type === 'legendary') return CARD_THEMES.legendary;
    if (type === 'chaos') return CARD_THEMES.chaos;
    if (type === 'virus') return CARD_THEMES.virus;

    // Detección por prefijo de emoji/texto
    if (c.startsWith('🎭') || c.includes('mímica:')) return CARD_THEMES.mimica;
    if (c.startsWith('🤐') || c.includes('boca cerrada:')) return CARD_THEMES.bocaCerrada;
    if (c.includes('norma:') || c.startsWith('📜')) return CARD_THEMES.norma;
    if (c.startsWith('🙈') || c.includes('yo nunca')) return CARD_THEMES.yoNunca;
    if (c.startsWith('🎯') || c.includes('reto:')) return CARD_THEMES.reto;
    if (c.startsWith('🌶️') || c.includes('beso') || c.includes('lamer') || c.includes('desnud')) return CARD_THEMES.picante;
    if (c.startsWith('🗳️') || c.includes('más probable') || c.includes('quién es') || c.includes('votación')) return CARD_THEMES.masProbable;
    if (c.startsWith('🇪🇸') || c.includes('españa:') || c.includes('años 90') || c.includes('infancia')) return CARD_THEMES.pacovers;
    if (c.startsWith('🛌') || c.includes('en la cama')) return CARD_THEMES.enLaCama;
    if (c.startsWith('🔤')) return CARD_THEMES.categorias;
    if (c.includes('trivia') || type === 'rare') return CARD_THEMES.trivia;

    // Detección por contenido de tragos/bebe (cartas de bebida cortas sin contexto de "yo nunca")
    const isDrinkCard = (c.startsWith('🍺') || c.startsWith('🍻') || c.startsWith('🥃')) && c.length < 100;
    if (isDrinkCard) return CARD_THEMES.drink;

    // Fallback por modo de juego
    const modeMap: Record<string, CardTheme> = {
        yo_nunca: CARD_THEMES.yoNunca,
        yo_nunca_equipos: CARD_THEMES.yoNunca,
        picante: CARD_THEMES.picante,
        espana: CARD_THEMES.pacovers,
        pacovers: CARD_THEMES.pacovers,
        clasico: CARD_THEMES.reto,
        votacion: CARD_THEMES.masProbable,
    };
    return modeMap[gameMode] || CARD_THEMES.megamix;
}

// ── CARD EXTRAS ──────────────────────────────────────────────────────────────

function renderCardExtra(extra: string, theme: CardTheme, content: string): React.ReactNode {
    switch (extra) {
        case 'drinkBar': {
            const drinks = parseInt(content.match(/(\d+)\s*trago/i)?.[1] ?? '1', 10);
            const pct = Math.min(drinks * 33, 100);
            return (
                <div className="w-full bg-white/20 rounded-full h-2 mt-3 overflow-hidden">
                    <motion.div
                        className="h-2 rounded-full"
                        style={{ background: theme.accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    />
                </div>
            );
        }
        case 'drinkCounter': {
            const count = parseInt(content.match(/(\d+)\s*trago/i)?.[1] ?? '1', 10);
            return (
                <div className="flex gap-1 mt-2 justify-center">
                    {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * i }} className="text-xl">🍺</motion.span>
                    ))}
                </div>
            );
        }
        case 'stars': {
            const stars = content.length < 60 ? 1 : content.length < 130 ? 2 : 3;
            return (
                <div className="flex gap-0.5 mt-2 justify-center">
                    {Array.from({ length: stars }).map((_, i) => (
                        <motion.span key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1 * i, type: 'spring', stiffness: 300 }} className="text-xl">⭐</motion.span>
                    ))}
                </div>
            );
        }
        case 'voteBar':
            return (
                <motion.p
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-sm font-black mt-3 uppercase tracking-widest"
                    style={{ color: theme.accentColor }}
                >🗳️ VOTAD AHORA</motion.p>
            );
        case 'timer':
            return (
                <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-white/20 mt-3 inline-block uppercase tracking-wider">
                    ⏱️ 30 SEGUNDOS
                </span>
            );
        case 'clock':
            return (
                <motion.p
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    className="text-sm font-black mt-3 text-white uppercase tracking-widest"
                >🕐 ¡ACTÚA YA!</motion.p>
            );
        case 'hearts':
            return (
                <div className="flex gap-2 mt-3 justify-center">
                    {['❤️', '💜', '🧡'].map((h, i) => (
                        <motion.span key={i} animate={{ y: [0, -8, 0] }} transition={{ duration: 1.3, delay: i * 0.25, repeat: Infinity }} className="text-xl">{h}</motion.span>
                    ))}
                </div>
            );
        case 'thermometer': {
            const hot = content.toLowerCase().includes('muy') || content.length > 160 ? 3 : content.length > 90 ? 2 : 1;
            return <div className="text-xl mt-2">{'🌶️'.repeat(hot)}</div>;
        }
        case 'lock':
            return <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-white/20 mt-3 inline-block uppercase tracking-wider">🔒 BOCA CERRADA</span>;
        case 'crown':
            return (
                <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-3xl mt-2 inline-block">👑</motion.span>
            );
        case 'explosion':
            return (
                <div className="flex gap-1 mt-2 justify-center">
                    {['💥', '✨', '💥'].map((e, i) => (
                        <motion.span key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} className="text-xl">{e}</motion.span>
                    ))}
                </div>
            );
        case 'flag':
            return (
                <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl mt-2 inline-block origin-bottom-left">🇪🇸</motion.div>
            );
        default:
            return null;
    }
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const CardDisplay = React.memo(({ content, type = 'common', onClick, gameMode, players, round = 1 }: CardDisplayProps) => {
    const theme = getCardTheme(content, type, gameMode);
    const cleanText = sanitizeCardText(content);

    // Detectar jugador mencionado en el texto (para pill de nombre)
    const targetPlayer = players?.find(p =>
        p.name && cleanText.toLowerCase().includes(p.name.toLowerCase())
    ) || null;

    return (
        <div className="w-full max-w-sm mx-auto" style={{ minHeight: '72vh' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={content}
                    initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: -90, opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                    className={`w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-b ${theme.bg} flex flex-col`}
                    style={{ minHeight: '72vh' }}
                >
                    {/* CABECERA: emoji + nombre del modo */}
                    <div className="flex flex-col items-center pt-10 pb-4 px-6">
                        {/* Círculo del emoji */}
                        <div className={`rounded-full p-5 mb-3 ${theme.emojiCircle}`}>
                            <motion.div
                                key={`emoji-${content}`}
                                initial={{ scale: 0, rotate: -25, y: -15 }}
                                animate={{ scale: 1, rotate: 0, y: 0 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 12, delay: 0.05 }}
                                className="text-7xl md:text-8xl leading-none select-none"
                                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}
                            >
                                {theme.modeEmoji}
                            </motion.div>
                        </div>

                        {/* Nombre del modo */}
                        <motion.h2
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                            className="text-lg md:text-xl font-arcade font-black uppercase tracking-wider text-white text-center drop-shadow-md leading-tight"
                        >
                            {theme.modeName}
                        </motion.h2>
                    </div>

                    {/* CUERPO: pill de jugador + caja de texto */}
                    <div className="flex-1 flex flex-col items-center justify-center px-5 pb-2">
                        {/* Pill del jugador si lo hay */}
                        {targetPlayer && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.18, type: 'spring', stiffness: 300 }}
                                className="mb-3 px-5 py-1.5 rounded-full font-black text-sm uppercase tracking-widest shadow-lg"
                                style={{ background: theme.accentColor, color: '#fff' }}
                            >
                                {targetPlayer.name}
                            </motion.div>
                        )}

                        {/* Caja principal del texto */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`w-full rounded-2xl p-5 shadow-xl ${theme.textBoxBg}`}
                        >
                            {/* Badge de rareza si no es common */}
                            {type !== 'common' && (
                                <div className="flex justify-center mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-0.5 rounded-full
                                        ${type === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                                            type === 'chaos' ? 'bg-pink-500/20 text-pink-400' :
                                                type === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-green-500/20 text-green-400'}`}>
                                        {type === 'legendary' ? '👑 LEGENDARIA' :
                                            type === 'chaos' ? '💥 CAOS' :
                                                type === 'rare' ? '⭐ RARA' : '🦠 VIRUS'}
                                    </span>
                                </div>
                            )}

                            <p className={`text-lg md:text-xl font-semibold text-center leading-snug no-scrollbar overflow-y-auto ${theme.textColor}`}
                                style={{ maxHeight: '28vh' }}>
                                {processDrinkingMultiplier(cleanText, round)}
                            </p>
                        </motion.div>

                        {/* Extra decorativo */}
                        <div className="flex justify-center mt-1">
                            {renderCardExtra(theme.extra, theme, content)}
                        </div>
                    </div>

                    {/* FOOTER: spacer */}
                    <div className="h-6" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.content === nextProps.content &&
        prevProps.type === nextProps.type &&
        prevProps.round === nextProps.round &&
        prevProps.gameMode === nextProps.gameMode &&
        prevProps.players?.length === nextProps.players?.length
    );
});
