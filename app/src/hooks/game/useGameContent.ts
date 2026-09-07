import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameMode } from '@/types/game';
import {
    normasRonda,
    clasico,
    yoNunca,
    picante,
    nostalgia,
    quienEsMasProbable,
    pacovers,
    getMegamixContent,
    getStructuredMegamix,
    enLaCamaY,
    categoriasLetras,
    categoriasReto,
} from '@/data/gameContent';
import {
    clasicoExtra,
    yoNuncaExtra,
    picanteExtra,
    masProbableExtra,
    pacoversExtra,
    enLaCamaYExtra,
    categoriasLetrasExtra,
    categoriasRetoExtra,
} from '@/data/gameContentExtra';
import {
    quienEsMasProbableExtra2,
    yoNuncaExtra2,
    categoriasRetoExtra2,
    picanteExtra2,
    clasicoExtra2,
    pacoversExtra2,
    enLaCamaYExtra2,
    categoriasLetrasExtra2,
} from '@/data/gameContentExtra2';
import {
    clasicoExtra3, yoNuncaExtra3, picanteExtra3, masProbableExtra3,
    pacoversExtra3, espanaExtra3, enLaCamaYExtra3,
    categoriasLetrasExtra3, categoriasRetoExtra3,
} from '@/data/gameContentExtra3';
import { customPartyRetos as importedCustomRetos } from '@/data/customPartyRetos';
import { footballQuestions } from '@/data/footballQuestionsNew';
import { cultureQuestions } from '@/data/cultureQuestions';
import { cultureQuestionsNew2025 } from '@/data/cultureQuestionsNew2025';
import { buildGodDeck } from '@/lib/godDeck';
import { rememberQuizIds } from '@/lib/recentContent';
import { sanitizeCardText } from '../../components/game/CardDisplay';
import {
    megamixRetosV4, yoNuncaV4, picanteV4, votacionV4,
    normasV4, duelosV4, cadenasV4,
} from '@/data/gameContentExtra13';
import {
    yoNuncaV5, retosV5, picanteV5, votacionV5, clasicoV5,
    enLaCamaV5, espanaV5, normasV5, duelosV5,
} from '@/data/updatePostVerano2026';
import {
    yoNuncaV5b, retosV5b, picanteV5b, votacionV5b, clasicoV5b,
    enLaCamaV5b, espanaV5b, normasV5b, duelosV5b,
} from '@/data/updatePostVerano2026_v2';
import {
    moreYoNunca, morePicante, moreVotacion, moreClasico, moreEspana,
    moreEnLaCama, moreNormas, moreMimica, moreSalseo, moreTorneoRetos,
} from '@/data/extraContentIndex';

// Clean Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Barajado determinista por semilla (para re-barajar el mazo en cada "vuelta"
// sin repetir el mismo orden exacto cuando se agota el contenido).
function seededShuffle<T>(array: T[], seed: number): T[] {
    let s = seed >>> 0;
    const rand = () => {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function normalizeDeckEntries(items: any[]): string[] {
    return items
        .map(item => typeof item === 'string' ? item : String(item ?? ''))
        .map(item => item.replace(/\s+/g, ' ').trim())
        .filter(item => item.length > 0 && item !== 'undefined' && item !== 'null');
}

function applyVoteWeights(items: string[], category: string): string[] {
    try {
        const raw = localStorage.getItem('fiesta-party-votes');
        if (!raw) return items;
        const data = JSON.parse(raw);
        const scores: Record<string, number> = data?.[category] || {};
        const out: string[] = [];
        for (const t of items) {
            const s = scores[t] || 0;
            if (s <= -3) continue;
            out.push(t);
            if (s >= 3) out.push(t);
        }
        return out.length ? out : items;
    } catch {
        return items;
    }
}

// ─── Rotación entre partidas ───────────────────────────────────────────────
// Recuerda las cartas mostradas en sesiones recientes y las manda al fondo del
// mazo la próxima vez, para que cada partida (sobre todo Megamix) se sienta
// nueva sin quitar nada del pool. Todo protegido: si localStorage falla, se
// devuelve el mazo intacto.
const RECENT_KEY = 'beep_recent_cards';
const RECENT_CAP = 400;

function rotateByRecent(deck: string[], mode: string, sessionSize: number): string[] {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const seen: string[] = raw ? (JSON.parse(raw)?.[mode] || []) : [];
        if (seen.length === 0) return deck;
        const seenSet = new Set(seen);
        const fresh = deck.filter(c => !seenSet.has(c));
        const stale = deck.filter(c => seenSet.has(c));
        // Si casi todo está "visto", no penalices: baraja normal.
        if (fresh.length < Math.max(sessionSize, deck.length * 0.15)) return deck;
        return [...shuffleArray(fresh), ...shuffleArray(stale)];
    } catch {
        return deck;
    }
}

function rememberSession(deck: string[], mode: string, sessionSize: number): void {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const store = raw ? JSON.parse(raw) : {};
        const prev: string[] = Array.isArray(store?.[mode]) ? store[mode] : [];
        const justShown = deck.slice(0, Math.max(12, sessionSize));
        const merged = [...justShown, ...prev].slice(0, RECENT_CAP);
        store[mode] = merged;
        localStorage.setItem(RECENT_KEY, JSON.stringify(store));
    } catch {
        /* sin persistencia, no pasa nada */
    }
}

export const useGameContent = (mode: GameMode, currentIndex: number, currentPlayerName: string, playersCount: number = 4) => {
    const [content, setContent] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
    const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
    const [questionNumber, setQuestionNumber] = useState(0);
    // Key that forces re-shuffle on each new game (changes on mount)
    const [reshuffleKey] = useState(() => Date.now());

    useEffect(() => {
        let modeContent: any[] = [];

        switch (mode) {
            case 'megamix':
                modeContent = [
                    ...getStructuredMegamix(500, playersCount),
                    // Actualización post-verano 2026 (oleadas 1 y 2) + contenido reconectado
                    ...retosV5, ...retosV5b,
                    ...duelosV5, ...duelosV5b,
                    ...moreTorneoRetos,
                    ...[...yoNuncaV5, ...yoNuncaV5b].map(q => `🙈 ${q}`),
                    ...moreYoNunca.map(q => `🙈 ${q}`),
                    ...[...picanteV5, ...picanteV5b].map(q => `🌶️ ${q}`),
                    ...morePicante.map(q => `🌶️ ${q}`),
                    ...[...votacionV5, ...votacionV5b].map(q => `🗳️ ${q}`),
                    ...moreVotacion.map(q => `🗳️ ${q}`),
                    ...clasicoV5, ...clasicoV5b,
                    ...moreClasico,
                    ...[...enLaCamaV5, ...enLaCamaV5b].map(q => `🛌 ${q}`),
                    ...moreEnLaCama.map(q => `🛌 ${q}`),
                    ...[...espanaV5, ...espanaV5b].map(q => `🇪🇸 ${q}`),
                    ...moreEspana.map(q => `🇪🇸 ${q}`),
                    ...moreMimica.map(q => `🎭 ${q}`),
                    ...[...normasV5, ...normasV5b].map(q => `NORMA: ${q.replace(/^NORMA:\s*/i, '')}`),
                    ...moreNormas.map(q => `NORMA: ${q.replace(/^NORMA:\s*/i, '')}`),
                    ...moreSalseo,
                ];
                break;
            case 'clasico':
                modeContent = shuffleArray([
                    ...clasico,
                    ...clasicoExtra,
                    ...clasicoExtra2,
                    ...clasicoExtra3,
                    ...yoNunca.map(q => `🙈 ${q}`),
                    ...yoNuncaExtra.map(q => `🙈 ${q}`),
                    ...yoNuncaExtra2.map(q => `🙈 ${q}`),
                    ...yoNuncaExtra3.map(q => `🙈 ${q}`),
                    ...picante.map(q => `🌶️ ${q}`),
                    ...picanteExtra.map(q => `🌶️ ${q}`),
                    ...picanteExtra2.map(q => `🌶️ ${q}`),
                    ...picanteExtra3.map(q => `🌶️ ${q}`),
                    ...pacovers.map(q => `🇪🇸 ${q}`),
                    ...pacoversExtra.map(q => `🇪🇸 ${q}`),
                    ...pacoversExtra2.map(q => `🇪🇸 ${q}`),
                    ...pacoversExtra3.map(q => `🇪🇸 ${q}`),
                    ...quienEsMasProbable.map(q => `🗳️ ${q}`),
                    ...masProbableExtra.map(q => `🗳️ ${q}`),
                    ...quienEsMasProbableExtra2.map(q => `🗳️ ${q}`),
                    ...masProbableExtra3.map(q => `🗳️ ${q}`),
                    ...enLaCamaY.map(q => `🛌 ${q}`),
                    ...enLaCamaYExtra.map(q => `🛌 ${q}`),
                    ...enLaCamaYExtra2.map(q => `🛌 ${q}`),
                    ...enLaCamaYExtra3.map(q => `🛌 ${q}`),
                    ...categoriasLetras.map(q => `🔤 ${q}`),
                    ...categoriasLetrasExtra.map(q => `🔤 ${q}`),
                    ...categoriasLetrasExtra2.map(q => `🔤 ${q}`),
                    ...categoriasLetrasExtra3.map(q => `🔤 ${q}`),
                    ...categoriasReto.map(q => `🎯 ${q}`),
                    ...categoriasRetoExtra.map(q => `🎯 ${q}`),
                    ...categoriasRetoExtra2.map(q => `🎯 ${q}`),
                    ...categoriasRetoExtra3.map(q => `🎯 ${q}`),
                    ...espanaExtra3.map(q => `🇪🇸 ${q}`),
                    ...normasRonda.map(q => `NORMA: ${q}`),
                    ...importedCustomRetos,
                    ...megamixRetosV4,
                    ...yoNuncaV4.map(q => `🙈 ${q}`),
                    ...picanteV4.map(q => `🌶️ ${q}`),
                    ...votacionV4.map(q => `🗳️ ${q}`),
                    ...normasV4.map(q => `NORMA: ${q.replace(/^📜\s*NORMA:\s*/i, '')}`),
                    ...duelosV4,
                    ...cadenasV4,
                    ...clasicoV5, ...clasicoV5b,
                    ...moreClasico,
                    ...retosV5, ...retosV5b,
                    ...[...normasV5, ...normasV5b].map(q => `NORMA: ${q.replace(/^NORMA:\s*/i, '')}`),
                    ...moreNormas.map(q => `NORMA: ${q.replace(/^NORMA:\s*/i, '')}`),
                    ...[...enLaCamaV5, ...enLaCamaV5b].map(q => `🛌 ${q}`),
                    ...moreEnLaCama.map(q => `🛌 ${q}`),
                ]);
                break;
            case 'yo_nunca':
            case 'yo_nunca_equipos':
                modeContent = shuffleArray([...yoNunca, ...yoNuncaExtra, ...yoNuncaExtra2, ...yoNuncaExtra3, ...yoNuncaV4, ...yoNuncaV5, ...yoNuncaV5b, ...moreYoNunca]);
                break;
            case 'picante':
                modeContent = shuffleArray([...picante, ...picanteExtra, ...picanteExtra2, ...picanteExtra3, ...picanteV4, ...picanteV5, ...picanteV5b, ...morePicante]);
                break;
            case 'espana':
                modeContent = shuffleArray([...nostalgia, ...pacoversExtra, ...pacoversExtra2, ...espanaExtra3, ...espanaV5, ...espanaV5b, ...moreEspana]);
                break;
            case 'votacion':
                modeContent = shuffleArray([...quienEsMasProbable, ...masProbableExtra, ...quienEsMasProbableExtra2, ...masProbableExtra3, ...votacionV4, ...votacionV5, ...votacionV5b, ...moreVotacion]);
                break;
            case 'pacovers':
                modeContent = shuffleArray([...pacovers, ...pacoversExtra, ...pacoversExtra2, ...pacoversExtra3, ...espanaV5, ...espanaV5b, ...moreEspana]);
                break;
            default:
                modeContent = getMegamixContent(200);
        }

        const cleanedContent = normalizeDeckEntries(modeContent as any[]);
        const weighted = normalizeDeckEntries(applyVoteWeights(cleanedContent, mode));
        // Baraja + manda al fondo lo visto en partidas recientes (frescura entre sesiones)
        const sessionSize = Math.max(18, playersCount * 12);
        const rotated = rotateByRecent(shuffleArray(weighted), mode, sessionSize);
        setContent(rotated);
        rememberSession(rotated, mode, sessionSize);

        // Reset used questions for fresh game
        setUsedQuestionIds(new Set());
        setQuestionNumber(0);

        // Pre-load first trivia question synchronously to avoid 'Cargando pregunta' flash
        if (mode === 'trivia_futbol' || mode === 'cultura') {
            const isFootball = mode === 'trivia_futbol';
            const sourceQuestions = (isFootball ? footballQuestions : [...cultureQuestions, ...cultureQuestionsNew2025]) as any[];
            if (sourceQuestions && sourceQuestions.length > 0) {
                const shuffled = shuffleArray(sourceQuestions);
                setCurrentQuestion(shuffled[0]);
                setUsedQuestionIds(new Set([shuffled[0].question]));
                setQuestionNumber(1);
            }
        }
    }, [mode, reshuffleKey, playersCount]);

    const loadNextQuestion = useCallback(() => {
        setQuestionNumber(prev => prev + 1);

        const isFootball = mode === 'trivia_futbol';
        const sourceQuestions = (isFootball ? footballQuestions : [...cultureQuestions, ...cultureQuestionsNew2025]) as any[];

        // Safety check
        if (!sourceQuestions || sourceQuestions.length === 0) {
            return;
        }

        const shuffledQuestions = shuffleArray(sourceQuestions);
        const availableQuestions = shuffledQuestions.filter(q => !usedQuestionIds.has(q.question));

        if (availableQuestions.length > 0) {
            const randomQ = availableQuestions[0];
            setCurrentQuestion(randomQ);
            setUsedQuestionIds(prev => new Set([...prev, randomQ.question]));
        } else {
            setUsedQuestionIds(new Set());
            const randomQ = shuffledQuestions[0];
            setCurrentQuestion(randomQ);
        }
    }, [mode, usedQuestionIds]);

    const loadSpecificQuestion = useCallback((category: 'futbol' | 'cultura') => {
        const isFootball = category === 'futbol';
        const sourceQuestions = (isFootball ? footballQuestions : [...cultureQuestions, ...cultureQuestionsNew2025]) as any[];

        // Safety check
        if (!sourceQuestions || sourceQuestions.length === 0) {
            console.error("No questions found for category:", category);
            // Set a fallback question so the game doesn't hang
            setCurrentQuestion({
                question: `Error: No hay preguntas de ${category} disponibles.`,
                options: ["Continuar"],
                correctIndex: 0,
                category: "Error",
                difficulty: 1
            });
            return;
        }

        const seenKey = `beep_trivia_seen_${category}`;
        let persistedSeen = new Set<string>();
        try { persistedSeen = new Set(JSON.parse(localStorage.getItem(seenKey) || '[]')); } catch { /* ignore */ }

        const shuffledQuestions = shuffleArray(sourceQuestions);
        // No visto ni en esta partida ni en partidas recientes.
        let availableQuestions = shuffledQuestions.filter(q => !usedQuestionIds.has(q.question) && !persistedSeen.has(q.question));
        if (availableQuestions.length === 0) {
            availableQuestions = shuffledQuestions.filter(q => !usedQuestionIds.has(q.question));
        }

        if (availableQuestions.length > 0) {
            const randomQ = availableQuestions[0];
            setCurrentQuestion(randomQ);
            setUsedQuestionIds(prev => new Set([...prev, randomQ.question]));
            rememberQuizIds([randomQ.question], seenKey);
        } else {
            setUsedQuestionIds(new Set());
            const randomQ = shuffledQuestions[0];
            setCurrentQuestion(randomQ);
            rememberQuizIds([randomQ.question], seenKey);
        }
    }, [usedQuestionIds]);

    const currentText = useMemo(() => {
        if (mode === 'trivia_futbol' || mode === 'cultura') {
            return currentQuestion?.question || 'Cargando pregunta...';
        }
        if (content.length === 0) return 'Siguiente carta';
        // Al agotar el mazo se re-baraja con otra semilla en cada vuelta, para
        // no repetir el mismo orden exacto (evita repeticiones en pantalla).
        const lap = Math.floor(currentIndex / content.length);
        const deck = lap === 0 ? content : seededShuffle(content, lap * 2654435761);
        const pos = currentIndex % content.length;
        const validContent =
            deck.slice(pos).find(item => typeof item === 'string' && item.trim().length > 0)
            || deck.find(item => typeof item === 'string' && item.trim().length > 0);
        return validContent?.replace(/{player}/g, currentPlayerName) || 'Siguiente carta';
    }, [content, currentIndex, currentPlayerName, mode, currentQuestion]);

    const getCurrentContent = useCallback(() => currentText, [currentText]);

    const getNextPreview = () => {
        if (!content || content.length === 0) return "Cargando...";
        const next = currentIndex + 1;
        const lap = Math.floor(next / content.length);
        const deck = lap === 0 ? content : seededShuffle(content, lap * 2654435761);
        const nextBase = deck[next % content.length];
        return sanitizeCardText(nextBase).replace(/\{.*?\}/g, '___');
    };

    return {
        content,
        currentQuestion,
        setCurrentQuestion,
        usedQuestionIds,
        setUsedQuestionIds,
        loadNextQuestion,
        loadSpecificQuestion: loadSpecificQuestion as (category: 'futbol' | 'cultura') => void,
        getCurrentContent,
        getNextPreview,
        questionNumber
    };
};
