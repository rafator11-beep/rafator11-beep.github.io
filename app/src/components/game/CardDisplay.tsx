import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Volume2, VolumeX } from 'lucide-react';
import { generateAIChallenge } from '@/lib/aiService';
import { toast } from 'sonner';

// ── TTS ───────────────────────────────────────────────────────────────────────
function useTTS(text: string, autoSpeak: boolean) {
    const [speaking, setSpeaking] = useState(false);
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = () => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        utter.rate = 0.92;
        utter.pitch = 1.05;
        // Prefer a Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es') && !v.name.includes('Google') ? false : v.lang.startsWith('es'));
        if (esVoice) utter.voice = esVoice;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        utterRef.current = utter;
        window.speechSynthesis.speak(utter);
    };

    const cancel = () => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    };

    // Auto-speak when text changes (only if enabled)
    useEffect(() => {
        if (!autoSpeak) return;
        const timer = setTimeout(speak, 400);
        return () => { clearTimeout(timer); window.speechSynthesis?.cancel(); };
    }, [text, autoSpeak]);

    // Cancel on unmount
    useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

    return { speaking, speak, cancel };
}

interface CardDisplayProps {
    content: string;
    type?: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
    onClick: () => void;
    gameMode: string;
    players?: any[];
    currentPlayer?: any;
    round?: number;
    onAIUpdate?: (newContent: string, newType: any) => void;
}

// ── SANITIZE ──────────────────────────────────────────────────────────────────

export function sanitizeCardText(text: string): string {
    if (!text) return '';
    let clean = text.trim();
    clean = clean.replace(/^["'""''«»]+/, '');
    clean = clean.replace(/^es\s*[:\-,]?\s+/i, '');
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
    clean = clean.replace(/^(reto\s*:?\s*)+/i, '');
    clean = clean.replace(/^(norma\s*:?\s*)+/i, '');
    clean = clean.replace(/\s{2,}/g, ' ').trim();
    clean = clean.replace(/["'""''«»]+$/, '');
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
    pillStyle: string;
}

const CARD_THEMES: Record<string, CardTheme> = {
    yoNunca: {
        bg: 'from-emerald-900/40 via-teal-900/30 to-slate-950/80',
        textBoxBg: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
        textColor: 'text-white',
        accentColor: '#10b981',
        modeName: 'YO NUNCA HE...',
        modeEmoji: '🙈',
        emojiCircle: 'bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]',
        extra: 'drinkBar',
        pillStyle: 'bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-lg',
    },
    drink: {
        bg: 'from-amber-900/50 via-orange-950/40 to-slate-950/90',
        textBoxBg: 'bg-black/40 backdrop-blur-xl border border-white/5',
        textColor: 'text-white',
        accentColor: '#f59e0b',
        modeName: '¡BEBE!',
        modeEmoji: '🍺',
        emojiCircle: 'bg-white/5',
        extra: 'drinkCounter',
        pillStyle: 'bg-amber-500/80 text-black font-bold shadow-lg',
    },
    reto: {
        bg: 'from-blue-900/40 via-indigo-950/30 to-slate-950/80',
        textBoxBg: 'bg-white/5 backdrop-blur-xl border border-white/10',
        textColor: 'text-white',
        accentColor: '#3b82f6',
        modeName: 'RETO',
        modeEmoji: '🎯',
        emojiCircle: 'bg-white/5',
        extra: 'stars',
        pillStyle: 'bg-blue-600/80 text-white shadow-lg',
    },
    picante: {
        bg: 'from-rose-900/40 via-pink-950/30 to-slate-950/80',
        textBoxBg: 'bg-white/5 backdrop-blur-xl border border-white/10',
        textColor: 'text-white',
        accentColor: '#f43f5e',
        modeName: 'PICANTE 🔞',
        modeEmoji: '🌶️',
        emojiCircle: 'bg-white/5',
        extra: 'thermometer',
        pillStyle: 'bg-rose-500/80 text-white shadow-lg',
    },
    masProbable: {
        bg: 'from-violet-500 via-purple-600 to-purple-800',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#8b5cf6',
        modeName: '¿QUIÉN ES MÁS PROBABLE?',
        modeEmoji: '🗳️',
        emojiCircle: 'bg-white/20',
        extra: 'voteBar',
        pillStyle: 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]',
    },
    pacovers: {
        bg: 'from-orange-500 via-red-600 to-red-800',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#ef4444',
        modeName: 'RECUERDOS',
        modeEmoji: '🎉',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
        pillStyle: 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    },
    enLaCama: {
        bg: 'from-purple-600 via-purple-700 to-indigo-900',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#7c3aed',
        modeName: 'EN LA CAMA Y...',
        modeEmoji: '🛌',
        emojiCircle: 'bg-white/20',
        extra: 'hearts',
        pillStyle: 'bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]',
    },
    categorias: {
        bg: 'from-cyan-500 via-blue-500 to-blue-700',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#06b6d4',
        modeName: 'CATEGORÍAS',
        modeEmoji: '🔤',
        emojiCircle: 'bg-white/20',
        extra: 'timer',
        pillStyle: 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    },
    mimica: {
        bg: 'from-fuchsia-500 via-pink-600 to-pink-800',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#d946ef',
        modeName: '🎭 MÍMICA',
        modeEmoji: '🎭',
        emojiCircle: 'bg-white/20',
        extra: 'clock',
        pillStyle: 'bg-fuchsia-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]',
    },
    bocaCerrada: {
        bg: 'from-orange-500 via-red-500 to-red-700',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#f97316',
        modeName: '🤐 BOCA CERRADA',
        modeEmoji: '🤐',
        emojiCircle: 'bg-white/20',
        extra: 'lock',
        pillStyle: 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]',
    },
    norma: {
        bg: 'from-orange-400 via-amber-500 to-amber-700',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#f97316',
        modeName: '📜 NUEVA NORMA',
        modeEmoji: '📜',
        emojiCircle: 'bg-white/20',
        extra: 'timer',
        pillStyle: 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    },
    trivia: {
        bg: 'from-sky-500 via-blue-600 to-blue-800',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#0ea5e9',
        modeName: '🧠 TRIVIA',
        modeEmoji: '🧠',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
        pillStyle: 'bg-sky-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)]',
    },
    legendary: {
        bg: 'from-yellow-400 via-amber-500 to-orange-600',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#fbbf24',
        modeName: '👑 LEGENDARIA',
        modeEmoji: '👑',
        emojiCircle: 'bg-black/20',
        extra: 'crown',
        pillStyle: 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)]',
    },
    chaos: {
        bg: 'from-pink-500 via-purple-600 to-purple-800',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#ec4899',
        modeName: '💥 MODO CAOS',
        modeEmoji: '💥',
        emojiCircle: 'bg-white/20',
        extra: 'explosion',
        pillStyle: 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]',
    },
    virus: {
        bg: 'from-green-600 via-emerald-700 to-emerald-900',
        textBoxBg: 'bg-black/80 backdrop-blur-sm',
        textColor: 'text-white',
        accentColor: '#22c55e',
        modeName: '🦠 VIRUS',
        modeEmoji: '🦠',
        emojiCircle: 'bg-green-500/20',
        extra: 'clock',
        pillStyle: 'bg-green-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.5)]',
    },
    megamix: {
        bg: 'from-indigo-600 via-purple-700 to-purple-900',
        textBoxBg: 'bg-white/95 backdrop-blur-sm',
        textColor: 'text-gray-900',
        accentColor: '#6366f1',
        modeName: 'BEEP MEGAMIX',
        modeEmoji: '🎲',
        emojiCircle: 'bg-white/20',
        extra: 'stars',
        pillStyle: 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    },
};

function getCardTheme(content: string, type: string, gameMode: string): CardTheme {
    const c = (content || '').toLowerCase();

    if (type === 'legendary') return CARD_THEMES.legendary;
    if (type === 'chaos') return CARD_THEMES.chaos;
    if (type === 'virus') return CARD_THEMES.virus;

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

    const isDrinkCard = (c.startsWith('🍺') || c.startsWith('🍻') || c.startsWith('🥃')) && c.length < 100;
    if (isDrinkCard) return CARD_THEMES.drink;

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
        default:
            return null;
    }
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const CardDisplay = React.memo(({ content, type = 'common', onClick, gameMode, players, currentPlayer, round = 1, onAIUpdate }: CardDisplayProps) => {
    const theme = getCardTheme(content, type, gameMode);
    const cleanText = sanitizeCardText(content);
    const [isGenerating, setIsGenerating] = useState(false);
    const { speaking, speak, cancel } = useTTS(cleanText, false);

    // Jugador mencionado en el texto (para cartas de duelo/reto específico)
    const mentionedPlayer = players?.find(p =>
        p.name && cleanText.toLowerCase().includes(p.name.toLowerCase())
    ) || null;

    // Mostrar pill: si hay jugador mencionado en texto → ese; si no → el jugador actual
    const displayPlayer = mentionedPlayer || currentPlayer || null;

    const handleMagicAI = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            // Determinar intensidad basada en la ronda o aleatoria para más dinamismo
            const intensities: ('soft' | 'medium' | 'hard')[] = ['soft', 'medium', 'hard'];
            const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];

            const result = await generateAIChallenge(players || [], gameMode, randomIntensity);
            onAIUpdate?.(result.content, result.type);
            toast.success(`Reto ${result.type} generado (${randomIntensity})`, {
                icon: "✨",
                style: { backgroundColor: '#1e1b4b', color: '#fff', border: '1px solid #4338ca' }
            });
        } catch (error) {
            toast.error("Bridge Error: Local Inference fallida");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto relative" style={{ minHeight: '72vh' }}>

            {/* AI GLOW EFFECT */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full animate-pulse" />
                        <div className="absolute inset-0 bg-primary/30 blur-[80px] rounded-full animate-ping" />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={content}
                    initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: -90, opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                    className={`w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-b ${theme.bg} flex flex-col relative cursor-pointer border border-white/5`}
                    style={{ minHeight: '72vh' }}
                    onClick={onClick}
                >
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }} />

                    {/* Top shine */}
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[2.5rem]" />

                    {/* TTS BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={e => { e.stopPropagation(); speaking ? cancel() : speak(); }}
                        className="absolute top-6 left-6 z-50 p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/20 transition-all text-white"
                    >
                        {speaking
                            ? <VolumeX className="w-5 h-5 text-red-400" />
                            : <Volume2 className="w-5 h-5" />}
                    </motion.button>

                    {/* AI MAGIC BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleMagicAI}
                        disabled={isGenerating}
                        className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/20 transition-all text-white group"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                            <Sparkles className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
                        )}
                    </motion.button>

                    {/* CABECERA: emoji + nombre del modo */}
                    <div className="flex flex-col items-center pt-10 pb-4 px-6">
                        <div className={`rounded-full p-5 mb-3 ${theme.emojiCircle} backdrop-blur-xl`}>
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

                        {/* Pill del jugador — siempre visible si hay jugador activo */}
                        {displayPlayer && (
                            <motion.div
                                key={`player-${displayPlayer.id || displayPlayer.name}`}
                                initial={{ scale: 0, opacity: 0, y: -8 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ delay: 0.18, type: 'spring', stiffness: 300 }}
                                className={`mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest shadow-lg ${theme.pillStyle}`}
                            >
                                {displayPlayer.avatar_url ? (
                                    <img src={displayPlayer.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover border border-white/30" />
                                ) : (
                                    <span className="text-xs opacity-70">👤</span>
                                )}
                                <span>{displayPlayer.name}</span>
                            </motion.div>
                        )}

                        {/* Caja principal del texto */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`w-full rounded-[2rem] p-6 shadow-2xl ${theme.textBoxBg} relative overflow-hidden`}
                        >
                            {/* Subtle inner top highlight */}
                            <div className="absolute top-0 inset-x-0 h-px bg-white/20" />

                            {/* Badge de rareza si no es common */}
                            {type !== 'common' && (
                                <div className="flex justify-center mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-0.5 rounded-full
                                        ${type === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                                            type === 'chaos' ? 'bg-pink-500/20 text-pink-500' :
                                                type === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                                                    'bg-green-500/20 text-green-500'}`}>
                                        {type === 'legendary' ? '👑 LEGENDARIA' :
                                            type === 'chaos' ? '💥 CAOS' :
                                                type === 'rare' ? '⭐ RARA' : '🦠 VIRUS'}
                                    </span>
                                </div>
                            )}

                            <p className={`text-lg md:text-xl font-semibold text-center leading-relaxed no-scrollbar overflow-y-auto ${theme.textColor}`}
                                style={{ maxHeight: '28vh' }}>
                                {processDrinkingMultiplier(cleanText, round)}
                            </p>
                        </motion.div>

                        {/* Extra decorativo */}
                        <div className="flex justify-center mt-1">
                            {renderCardExtra(theme.extra, theme, content)}
                        </div>
                    </div>

                    {/* FOOTER */}
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
        prevProps.players?.length === nextProps.players?.length &&
        prevProps.currentPlayer?.id === nextProps.currentPlayer?.id
    );
});
