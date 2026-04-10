import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Volume2, VolumeX, CheckCircle2, XCircle } from 'lucide-react';
import { generateAIChallenge } from '@/lib/aiService';
import { toast } from 'sonner';

// ── TTS ───────────────────────────────────────────────────────────────────────
function useTTS(text: string) {
    const [speaking, setSpeaking] = useState(false);

    const speak = useCallback(() => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        utter.rate = 0.92;
        utter.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es'));
        if (esVoice) utter.voice = esVoice;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
    }, [text]);

    const cancel = useCallback(() => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    }, []);

    useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

    return { speaking, speak, cancel };
}

export interface CardDisplayProps {
    content: string;
    type?: 'common' | 'rare' | 'legendary' | 'chaos' | 'virus';
    onClick: () => void;
    onSuccess?: () => void;   // jugador hizo el reto → reparte
    onFail?: () => void;      // jugador no lo hizo → bebe
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
    clean = clean.replace(/^🙈\s*(?:Yo\s*nunca[.…]*\s*)?/i, '');
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
    if (clean.length > 0) clean = clean.charAt(0).toUpperCase() + clean.slice(1);
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
                return <span key={i} className="text-red-400 font-extrabold block mt-2 text-lg animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">{part}</span>;
            }
            return part;
        });
    }

    const regex = /(🍺.*?)(\d+)(\s*tragos?.*)/i;
    const segments = text.split(/(\n🍺.*|\n🍻.*|\n🥃.*|\n🥂.*)/i);
    return segments.filter((s): s is string => Boolean(s)).map((segment, i) => {
        if (segment.match(/(\n🍺|\n🍻|\n🥃|\n🥂)/)) {
            let modified = segment;
            const match = modified.match(regex);
            if (match) {
                const newNum = Math.min(parseInt(match[2], 10) + extraDrinks, 5);
                modified = `${match[1]}${newNum}${match[3]} 🔥`;
            } else if (modified.toLowerCase().includes('bebe 1 trago')) {
                modified = modified.replace(/bebe 1 trago/i, `bebe ${1 + extraDrinks} tragos 🔥`);
            }
            return <span key={i} className="text-red-500 font-black block mt-2 text-lg drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-bounce">{modified.trim()}</span>;
        }
        return <span key={i}>{segment}</span>;
    });
}

// ── CARD TYPE DETECTION ───────────────────────────────────────────────────────
type CardKind = 'yo_nunca' | 'reto' | 'votacion' | 'grupal' | 'picante' | 'norma' | 'duelo' | 'espana' | 'categorias' | 'generic';

function detectCardKind(content: string): CardKind {
    const c = content.toLowerCase();
    if (c.includes('yo nunca') || c.startsWith('🙈')) return 'yo_nunca';
    if (c.startsWith('🙌') || c.includes('todos a la vez')) return 'grupal';
    if (c.includes('quién es más probable') || c.includes('más probable') || c.startsWith('🗳️') || c.includes('votad')) return 'votacion';
    if (c.startsWith('⚔️') || c.includes('duelo')) return 'duelo';
    if (c.startsWith('🇪🇸') || c.includes('españa:')) return 'espana';
    if (c.startsWith('🔤') || c.includes('categorías')) return 'categorias';
    if (c.startsWith('🌶️') || c.includes('picante') || c.includes('beso') || c.includes('lamer')) return 'picante';
    if (c.includes('norma:') || c.startsWith('📜')) return 'norma';
    if (c.startsWith('🎯') || c.includes('reto:') || c.includes('{player}')) return 'reto';
    return 'generic';
}

// ── CARD THEMES ───────────────────────────────────────────────────────────────
const KIND_CONFIG: Record<CardKind, {
    bg: string; accent: string; emoji: string; label: string;
    textDark: boolean; showDrinkButtons: boolean;
}> = {
    yo_nunca:   { bg: 'from-emerald-900 via-teal-950 to-slate-950',   accent: '#10b981', emoji: '🙈', label: 'YO NUNCA HE...', textDark: false, showDrinkButtons: true },
    reto:       { bg: 'from-blue-900 via-indigo-950 to-slate-950',    accent: '#3b82f6', emoji: '🎯', label: 'RETO',           textDark: false, showDrinkButtons: true },
    votacion:   { bg: 'from-violet-800 via-purple-900 to-slate-950',  accent: '#8b5cf6', emoji: '🗳️', label: '¿QUIÉN ES?',    textDark: false, showDrinkButtons: false },
    grupal:     { bg: 'from-pink-800 via-rose-900 to-slate-950',      accent: '#f43f5e', emoji: '🙌', label: 'TODOS A LA VEZ', textDark: false, showDrinkButtons: false },
    picante:    { bg: 'from-rose-900 via-pink-950 to-slate-950',      accent: '#f43f5e', emoji: '🌶️', label: 'PICANTE 🔞',    textDark: false, showDrinkButtons: true },
    norma:      { bg: 'from-amber-800 via-orange-900 to-slate-950',   accent: '#f59e0b', emoji: '📜', label: 'NUEVA NORMA',   textDark: false, showDrinkButtons: false },
    duelo:      { bg: 'from-red-900 via-rose-950 to-slate-950',       accent: '#ef4444', emoji: '⚔️', label: 'DUELO',         textDark: false, showDrinkButtons: false },
    espana:     { bg: 'from-red-800 via-yellow-900 to-slate-950',     accent: '#ef4444', emoji: '🇪🇸', label: 'ESPAÑA',       textDark: false, showDrinkButtons: true },
    categorias: { bg: 'from-cyan-800 via-blue-900 to-slate-950',      accent: '#06b6d4', emoji: '🔤', label: 'CATEGORÍAS',    textDark: false, showDrinkButtons: false },
    generic:    { bg: 'from-indigo-900 via-purple-950 to-slate-950',  accent: '#6366f1', emoji: '🎲', label: 'MEGAMIX',       textDark: false, showDrinkButtons: false },
};

const RARITY_OVERRIDE: Record<string, Partial<typeof KIND_CONFIG['generic']>> = {
    legendary: { bg: 'from-yellow-700 via-amber-800 to-slate-950', accent: '#fbbf24', emoji: '👑', label: '👑 LEGENDARIA' },
    chaos:     { bg: 'from-pink-700 via-purple-800 to-slate-950',  accent: '#ec4899', emoji: '💥', label: '💥 MODO CAOS' },
    virus:     { bg: 'from-green-800 via-emerald-900 to-slate-950', accent: '#22c55e', emoji: '🦠', label: '🦠 VIRUS' },
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const CardDisplay = React.memo(({
    content, type = 'common', onClick, onSuccess, onFail,
    gameMode, players, currentPlayer, round = 1, onAIUpdate
}: CardDisplayProps) => {
    const cleanText = sanitizeCardText(content);
    const kind = detectCardKind(content);
    const baseConfig = KIND_CONFIG[kind];
    const rarityOverride = type !== 'common' ? RARITY_OVERRIDE[type] : {};
    const cfg = { ...baseConfig, ...rarityOverride };

    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [canClickVirus, setCanClickVirus] = useState(false);
    const [resultState, setResultState] = useState<'none' | 'success' | 'fail'>('none');
    const { speaking, speak, cancel } = useTTS(cleanText);

    useEffect(() => {
        setIsRevealed(false);
        setResultState('none');
        setCanClickVirus(false);
        if (type === 'virus') {
            const t = setTimeout(() => setCanClickVirus(true), 600);
            return () => clearTimeout(t);
        }
    }, [content, type]);

    const mentionedPlayer = players?.find(p => p.name && cleanText.toLowerCase().includes(p.name.toLowerCase())) || null;
    const displayPlayer = mentionedPlayer || currentPlayer || null;

    const handleSuccess = (e: React.MouseEvent) => {
        e.stopPropagation();
        setResultState('success');
        setTimeout(() => { onSuccess?.() || onClick(); }, 600);
    };

    const handleFail = (e: React.MouseEvent) => {
        e.stopPropagation();
        setResultState('fail');
        setTimeout(() => { onFail?.() || onClick(); }, 600);
    };

    const handleMagicAI = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const intensities: ('soft' | 'medium' | 'hard')[] = ['soft', 'medium', 'hard'];
            const result = await generateAIChallenge(players || [], gameMode, intensities[Math.floor(Math.random() * 3)]);
            onAIUpdate?.(result.content, result.type);
            toast.success('Reto IA generado ✨', { style: { background: '#1e1b4b', color: '#fff' } });
        } catch {
            toast.error('Error generando reto');
        } finally {
            setIsGenerating(false);
        }
    };

    // Detectar si hay castigo de bebida en el texto
    const hasDrinkPenalty = /bebe|trago|fondo|doble/i.test(cleanText);
    const hasRewardOnSuccess = /reparte|elige.*beba|ganador/i.test(cleanText);

    return (
        <div className="w-full max-w-sm mx-auto relative select-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={content}
                    initial={{ y: 60, scale: 0.92, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: -40, scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className={`w-full rounded-[2rem] overflow-hidden shadow-2xl bg-gradient-to-b ${cfg.bg} flex flex-col relative border-2`}
                    style={{
                        borderColor: resultState === 'success' ? '#22c55e'
                            : resultState === 'fail' ? '#ef4444'
                            : `${cfg.accent}40`,
                        boxShadow: resultState === 'success' ? '0 0 40px rgba(34,197,94,0.4)'
                            : resultState === 'fail' ? '0 0 40px rgba(239,68,68,0.4)'
                            : `0 20px 60px -20px ${cfg.accent}50`,
                    }}
                >
                    {/* Particles for legendary/chaos */}
                    {(type === 'legendary' || type === 'chaos') && (
                        <>
                            <div className="card-particle card-particle-1" />
                            <div className="card-particle card-particle-2" />
                            <div className="card-particle card-particle-3" />
                            <div className="card-particle card-particle-4" />
                            <div className="card-particle card-particle-5" />
                        </>
                    )}

                    {/* Top shine */}
                    <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />

                    {/* ── HEADER ── */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        {/* TTS */}
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={e => { e.stopPropagation(); speaking ? cancel() : speak(); }}
                            className="p-2.5 rounded-2xl bg-white/10 border border-white/15 text-white"
                        >
                            {speaking ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                        </motion.button>

                        {/* Mode label + emoji */}
                        <div className="flex flex-col items-center gap-1">
                            <motion.span
                                key={`emoji-${content}`}
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.05 }}
                                className="text-4xl leading-none"
                                style={{ filter: `drop-shadow(0 0 10px ${cfg.accent}80)` }}
                            >
                                {cfg.emoji}
                            </motion.span>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                                {cfg.label}
                            </span>
                        </div>

                        {/* AI */}
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={handleMagicAI}
                            disabled={isGenerating}
                            className="p-2.5 rounded-2xl bg-white/10 border border-white/15 text-white"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </motion.button>
                    </div>

                    {/* ── PLAYER PILL ── */}
                    {displayPlayer && (
                        <motion.div
                            key={`player-${displayPlayer.id || displayPlayer.name}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 350 }}
                            className="mx-4 mb-3 flex items-center gap-2 px-3 py-1.5 rounded-full self-center w-fit"
                            style={{ background: `${cfg.accent}25`, border: `1px solid ${cfg.accent}50` }}
                        >
                            {displayPlayer.avatar_url ? (
                                <img src={displayPlayer.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                    style={{ background: cfg.accent }}>
                                    {displayPlayer.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs font-black uppercase tracking-wider text-white">{displayPlayer.name}</span>
                        </motion.div>
                    )}

                    {/* ── MAIN TEXT BOX ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="mx-4 mb-4 rounded-[1.5rem] p-5 relative overflow-hidden"
                        style={{
                            background: 'rgba(0,0,0,0.45)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="absolute top-0 inset-x-0 h-px bg-white/15" />

                        {/* Rarity badge */}
                        {type !== 'common' && (
                            <div className="flex justify-center mb-3">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-0.5 rounded-full"
                                    style={{ background: `${cfg.accent}25`, color: cfg.accent, border: `1px solid ${cfg.accent}40` }}>
                                    {type === 'legendary' ? '👑 LEGENDARIA' : type === 'chaos' ? '💥 CAOS' : type === 'rare' ? '⭐ RARA' : '🦠 VIRUS'}
                                </span>
                            </div>
                        )}

                        {/* Text */}
                        <p className={`text-base md:text-lg font-semibold text-center leading-relaxed text-white ${isRevealed === false && kind === 'generic' ? '' : ''}`}
                            style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                            {processDrinkingMultiplier(cleanText, round)}
                        </p>

                        {/* Virus accept button */}
                        {type === 'virus' && (
                            <motion.button
                                animate={{ opacity: canClickVirus ? 1 : 0.4, scale: canClickVirus ? 1 : 0.95 }}
                                onClick={e => { e.stopPropagation(); if (canClickVirus) onClick(); }}
                                className="mt-4 w-full py-3 rounded-2xl font-black text-black text-sm uppercase tracking-widest transition-all"
                                style={{ background: canClickVirus ? '#22c55e' : '#4b5563', touchAction: 'manipulation' }}
                            >
                                {canClickVirus ? 'ACEPTAR VIRUS 🦠' : 'CARGANDO...'}
                            </motion.button>
                        )}
                    </motion.div>

                    {/* ── DRINK BUTTONS (reto/yo_nunca/picante) ── */}
                    {cfg.showDrinkButtons && type !== 'virus' && resultState === 'none' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="mx-4 mb-4 grid grid-cols-2 gap-3"
                        >
                            {/* SUCCESS — lo hice / lo hizo */}
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={handleSuccess}
                                className="flex flex-col items-center gap-1.5 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-wider text-white transition-all"
                                style={{
                                    background: 'rgba(34,197,94,0.15)',
                                    border: '2px solid rgba(34,197,94,0.4)',
                                    touchAction: 'manipulation',
                                }}
                            >
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span className="text-[11px] text-green-300">
                                    {kind === 'yo_nunca' ? 'Lo he hecho' : 'Lo hizo'}
                                </span>
                                {hasRewardOnSuccess && (
                                    <span className="text-[9px] text-green-400/70 font-bold">👑 Reparte</span>
                                )}
                            </motion.button>

                            {/* FAIL — no lo hice / bebe */}
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={handleFail}
                                className="flex flex-col items-center gap-1.5 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-wider text-white transition-all"
                                style={{
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '2px solid rgba(239,68,68,0.4)',
                                    touchAction: 'manipulation',
                                }}
                            >
                                <XCircle className="w-6 h-6 text-red-400" />
                                <span className="text-[11px] text-red-300">
                                    {kind === 'yo_nunca' ? 'No lo he hecho' : 'No lo hizo'}
                                </span>
                                {hasDrinkPenalty && (
                                    <span className="text-[9px] text-red-400/70 font-bold">🍺 Bebe</span>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── RESULT FLASH ── */}
                    <AnimatePresence>
                        {resultState !== 'none' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="mx-4 mb-4 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-lg uppercase tracking-widest"
                                style={{
                                    background: resultState === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                                    border: `2px solid ${resultState === 'success' ? '#22c55e' : '#ef4444'}`,
                                }}
                            >
                                {resultState === 'success' ? (
                                    <><CheckCircle2 className="w-6 h-6 text-green-400" /><span className="text-green-300">¡Reparte tragos! 👑</span></>
                                ) : (
                                    <><XCircle className="w-6 h-6 text-red-400" /><span className="text-red-300">¡A beber! 🍺</span></>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── FOOTER SPACER ── */}
                    <div className="h-3" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}, (prev, next) =>
    prev.content === next.content &&
    prev.type === next.type &&
    prev.round === next.round &&
    prev.gameMode === next.gameMode &&
    prev.players?.length === next.players?.length &&
    prev.currentPlayer?.id === next.currentPlayer?.id
);
