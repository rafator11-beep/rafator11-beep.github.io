import { useState, useRef, MutableRefObject, useCallback } from 'react';
import { GameMode, PlayerVirus, Player } from '@/types/game';
import { virusEffects, normasRonda } from '@/data/gameContent';
import { impostorRounds } from '@/data/impostorContent';
import { duelos } from '@/data/duelosContent';
import { footballQuestions } from '@/data/footballQuestionsNew';
import { cultureQuestions } from '@/data/cultureQuestions';
import { getRandomMimica } from '@/data/mimicaContent';

export const useGameEffects = (mode: GameMode, players: Player[]) => {
    const [playerViruses, setPlayerViruses] = useState<PlayerVirus[]>([]);
    const [virusReceivedByPlayer, setVirusReceivedByPlayer] = useState<Record<string, number>>({});
    const [brutalCounts, setBrutalCounts] = useState<Record<string, { legendaryDrops: number; chaosEvents: number; cursedEvents: number; virusesReceived: number }>>({});

    const getPlayerVirus = (playerId: string) => {
        return playerViruses.find(v => v.playerId === playerId);
    };

    // State for tracking periodic events
    const lastVirusRoundRef = useRef<number>(-1);
    const lastNormaRoundRef = useRef<number>(-1);
    const lastImpostorIndexRef = useRef<number>(0);

    const applyRandomVirus = useCallback((force: boolean = false, specificPlayerId?: string) => {
        // If not forced, apply random chance
        if (!force && ((mode !== 'megamix' && mode !== 'clasico') || Math.random() > 0.20)) return null;

        const targetPlayer = specificPlayerId
            ? players.find(p => p.id === specificPlayerId)
            : players[Math.floor(Math.random() * players.length)];

        if (!targetPlayer) return null;

        const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];

        setVirusReceivedByPlayer(prev => ({
            ...prev,
            [targetPlayer.id]: (prev[targetPlayer.id] || 0) + 1,
        }));

        setBrutalCounts(prev => ({
            ...prev,
            [targetPlayer.id]: {
                ...prev[targetPlayer.id],
                virusesReceived: (prev[targetPlayer.id]?.virusesReceived || 0) + 1,
                legendaryDrops: prev[targetPlayer.id]?.legendaryDrops || 0,
                chaosEvents: prev[targetPlayer.id]?.chaosEvents || 0,
                cursedEvents: prev[targetPlayer.id]?.cursedEvents || 0
            }
        }));

        setPlayerViruses(prev => {
            // Remove existing virus for this player to avoid clutter/conflicts, or stack? 
            // Replacing is cleaner for UI bubbles.
            const filtered = prev.filter(p => p.playerId !== targetPlayer.id);
            return [
                ...filtered,
                {
                    playerId: targetPlayer.id,
                    virusName: randomVirus.name,
                    virusDescription: randomVirus.description,
                    turnsRemaining: randomVirus.duration
                },
            ];
        });
        const fullVirus = {
            playerId: targetPlayer.id,
            virusName: randomVirus.name,
            virusDescription: randomVirus.description,
            turnsRemaining: randomVirus.duration
        };
        return { player: targetPlayer, virus: fullVirus };
    }, [mode, players]);

    const updateViruses = () => {
        setPlayerViruses(prev =>
            prev
                .map(v => ({ ...v, turnsRemaining: v.turnsRemaining - 1 }))
                .filter(v => v.turnsRemaining > 0)
        );
    };

    // Manage Periodic Viruses (Every 7 Rounds -> Infection or Rest)
    const manageMegamixViruses = (currentRound: number) => {
        if (mode !== 'megamix') return null;

        // Start Virus on Round 1
        if (currentRound === 1 && lastVirusRoundRef.current === -1) {
            lastVirusRoundRef.current = 1;
            const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];
            const targetPlayer = players[Math.floor(Math.random() * players.length)];
            const newVirus: PlayerVirus = {
                playerId: targetPlayer.id,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                turnsRemaining: 7,
            };
            setPlayerViruses([newVirus]);
            return { type: 'INFECTION', title: '¡VIRUS DETECTADO!', message: `El virus inicial ha infectado a ${targetPlayer.name}.` };
        }

        // Check if round is multiple of 5 (As requested: Virus change every 5 rounds)
        if (currentRound > 1 && currentRound % 5 === 0 && currentRound !== lastVirusRoundRef.current) {
            lastVirusRoundRef.current = currentRound;

            // Logic: Rotate Virus to next player
            setPlayerViruses([]);

            const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];
            const nextIndex = Math.floor(currentRound / 5) % players.length;
            const targetPlayer = players[nextIndex];

            const newVirus: PlayerVirus = {
                playerId: targetPlayer.id,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                turnsRemaining: 7, // Lasts until next cycle
            };

            setPlayerViruses([newVirus]);
            return { type: 'INFECTION', title: '¡EL VIRUS HA MUTADO!', message: `El virus se ha propagado a ${targetPlayer.name}. ¡Suerte!` };
        }

        return null;
    };

    // Manage Periodic Normas (Every 5 Rounds)
    const manageMegamixNormas = (currentRound: number) => {
        if (mode !== 'megamix') return null;

        // Initial Norma Round 1
        if (currentRound === 1 && lastNormaRoundRef.current === -1) {
            lastNormaRoundRef.current = 1;
            const randomNorma = normasRonda[Math.floor(Math.random() * normasRonda.length)];
            return {
                type: 'NORMA',
                title: '¡NORMA INICIAL!',
                message: randomNorma,
                duration: players.length * 2
            };
        }

        // Manage Periodic Normas (Every 3 Rounds)
        if (currentRound > 1 && currentRound % 3 === 0 && currentRound !== lastNormaRoundRef.current) {
            lastNormaRoundRef.current = currentRound;
            const randomNorma = normasRonda[Math.floor(Math.random() * normasRonda.length)];
            return {
                type: 'NORMA',
                title: '¡NUEVA NORMA!',
                message: randomNorma,
                duration: players.length * 2 // Lasts 2 full rounds
            };
        }
        return null;
    };

    // Megamix Special Events (Impostor, Duelo, forced Trivia, Random Norma)
    const checkMegamixSpecialEvents = (
        currentIndex: number,
        currentRound: number, // Added usage
        currentPlayer: Player,
        usedQuestionIds: Set<string>,
        setCurrentQuestion: (q: any) => void,
        setUsedQuestionIds: (ids: Set<string>) => void,
        setGameState: (updater: (prev: any) => any) => void,
        lastMiniTurnRef: MutableRefObject<Record<string, number>>
    ) => {
        if (mode !== 'megamix') return false;

        // Force Impostor every 15 cards
        if (currentIndex - lastImpostorIndexRef.current >= 15 && players.length >= 3) {
            lastImpostorIndexRef.current = currentIndex;
            const randomImpostor = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
            const impostorPlayer = players[Math.floor(Math.random() * players.length)];
            setGameState((prev: any) => ({
                ...prev,
                showImpostorWarning: true,
                impostorData: {
                    currentImpostorReal: randomImpostor.normalQuestion || randomImpostor.category || '',
                    currentImpostorFake: randomImpostor.impostorQuestion || randomImpostor.hint || '',
                    impostorPlayerId: impostorPlayer.id,
                }
            }));
            return true;
        }

        const roll = Math.random();

        // Random Norma removed - now strict every 3 rounds via manageMegamixNormas


        // Special Megamix events every 6 rounds, triggered exactly when the first player of that round starts
        const isSpecialRoundTurn = currentRound > 0 && currentRound % 6 === 0 && (currentIndex % players.length === 0);

        if (players.length >= 3 && isSpecialRoundTurn && mode === 'megamix') {
            const specialCycle = Math.floor(currentRound / 6) % 3; // 3 types now: Impostor, Mimica, Impostor

            if (specialCycle === 0 || specialCycle === 2) {
                // Impostor
                if (impostorRounds.length === 0) return false;
                lastImpostorIndexRef.current = currentIndex; // Reset manual counter when cycle hits
                const randomImpostor = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
                const impostorPlayer = players[Math.floor(Math.random() * players.length)];
                setGameState((prev: any) => ({
                    ...prev,
                    showImpostorWarning: true, // Use warning screen for privacy
                    impostorData: {
                        currentImpostorReal: randomImpostor.normalQuestion || randomImpostor.category || '',
                        currentImpostorFake: randomImpostor.impostorQuestion || randomImpostor.hint || '',
                        impostorPlayerId: impostorPlayer.id,
                    }
                }));
            } else {
                // Mimica
                const randomMimica = getRandomMimica();
                setGameState(prev => ({
                    ...prev,
                    showMimica: true,
                    showMimicaReveal: true,
                    currentMimicaText: randomMimica.text
                }));
            }

            lastMiniTurnRef.current['impostor_round'] = currentIndex;
            return true;
        }

        // Duelo
        if (players.length >= 2 && roll >= 0.10 && roll < 0.22) {
            const randomDuelo = duelos[Math.floor(Math.random() * duelos.length)];
            const opponents = players.filter(p => p.id !== currentPlayer.id);
            const opponent = opponents[Math.floor(Math.random() * opponents.length)];
            setGameState((prev: any) => ({
                ...prev,
                showDuel: true,
                currentDuelo: `${randomDuelo.name}: ${randomDuelo.description}`,
                duelPlayers: [currentPlayer, opponent],
            }));
            return true;
        }

        // Forced Trivia
        const playerTurnCount = Math.floor(currentIndex / Math.max(players.length, 1));
        const forceTrivia = playerTurnCount > 0 && playerTurnCount % 6 === 0;

        if (forceTrivia || (roll >= 0.88)) {
            const isFootball = Math.random() > 0.5;
            const shuffled = [...(isFootball ? footballQuestions : cultureQuestions)].sort(() => Math.random() - 0.5);
            const availableQuestions = shuffled.filter(q => !usedQuestionIds.has(q.question));

            if (availableQuestions.length > 0) {
                const randomQ = availableQuestions[0];
                setCurrentQuestion(randomQ);
                setUsedQuestionIds(new Set([...usedQuestionIds, randomQ.question]));
                setGameState((prev: any) => ({ ...prev, showTrivia: true }));
                return true;
            }
        }

        return false;
    };

    return {
        playerViruses,
        setPlayerViruses,
        virusReceivedByPlayer,
        brutalCounts,
        setBrutalCounts,
        applyRandomVirus,
        updateViruses,
        checkMegamixSpecialEvents,
        manageMegamixViruses,
        manageMegamixNormas,
        getPlayerVirus
    };
};
