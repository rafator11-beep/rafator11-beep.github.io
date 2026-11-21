import { useState, useCallback } from 'react';
import { GameMode, PlayerVirus, Player } from '@/types/game';
import { virusEffects } from '@/data/gameContent';

export const useGameEffects = (mode: GameMode, players: Player[]) => {
    const [playerViruses, setPlayerViruses] = useState<PlayerVirus[]>([]);
    const [virusReceivedByPlayer, setVirusReceivedByPlayer] = useState<Record<string, number>>({});
    const [brutalCounts, setBrutalCounts] = useState<Record<string, { legendaryDrops: number; chaosEvents: number; cursedEvents: number; virusesReceived: number }>>({});

    const getPlayerVirus = (playerId: string) => {
        return playerViruses.find(v => v.playerId === playerId);
    };


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


    return {
        playerViruses,
        setPlayerViruses,
        virusReceivedByPlayer,
        brutalCounts,
        setBrutalCounts,
        applyRandomVirus,
        updateViruses,
        getPlayerVirus
    };
};
