import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useMultiplayer(
    roomId: string | null, 
    isHost: boolean, 
    playerName: string, 
    playerId: string, 
    onGameStateUpdate: (state: any) => void, 
    onGuestAction?: (action: any) => void
) {
    const [players, setPlayers] = useState<any[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING'>('JOINING');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const unmountedRef = useRef(false);
    // Los handlers del canal leen siempre la versión más reciente del callback
    // (si no, se quedan con la del render en que se creó la suscripción).
    const onGameStateUpdateRef = useRef(onGameStateUpdate);
    onGameStateUpdateRef.current = onGameStateUpdate;
    const onGuestActionRef = useRef(onGuestAction);
    onGuestActionRef.current = onGuestAction;

    useEffect(() => {
        if (!roomId || !playerName) return;

        unmountedRef.current = false;
        retryCountRef.current = 0;

        let channel: RealtimeChannel | null = null;

        const setup = () => {
            if (unmountedRef.current) return;

            setConnectionStatus('JOINING');

            const ch = supabase.channel(`room:${roomId}`, {
                config: {
                    presence: {
                        key: playerId || playerName,
                    },
                },
            });

            channel = ch;
            ch
                .on('broadcast', { event: 'game_state' }, ({ payload }) => {
                    if (!isHost) {
                        onGameStateUpdateRef.current(payload);
                    }
                })
                .on('broadcast', { event: 'guest_action' }, ({ payload }) => {
                    if (isHost && onGuestActionRef.current) {
                        onGuestActionRef.current(payload);
                    }
                })
                .on('presence', { event: 'sync' }, () => {
                    const state = channel!.presenceState();
                    const users = Object.keys(state).map(key => ({
                        presence_key: key,
                        id: key,
                        ...state[key][0]
                    }));
                    setPlayers(users);
                })
                .subscribe(async (status) => {
                    if (unmountedRef.current) return;
                    setConnectionStatus(status as any);
                    if (status === 'SUBSCRIBED') {
                        retryCountRef.current = 0;
                        await channel!.track({
                            online_at: new Date().toISOString(),
                            isHost,
                            playerName,
                            playerId
                        });
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        console.error(`[useMultiplayer] Channel ${status} in room: ${roomId}. Reintentando...`);
                        // Reconexión básica con backoff (móvil bloqueado / pérdida de red momentánea)
                        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                        const attempt = retryCountRef.current + 1;
                        retryCountRef.current = attempt;
                        const delay = Math.min(1000 * attempt, 8000);
                        retryTimeoutRef.current = setTimeout(() => {
                            if (unmountedRef.current) return;
                            if (channel) supabase.removeChannel(channel);
                            setup();
                        }, delay);
                    }
                });

            channelRef.current = channel;
        };

        setup();

        return () => {
            unmountedRef.current = true;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            if (channel) supabase.removeChannel(channel);
        };
    }, [roomId, playerName, playerId, isHost]);

    const lastBroadcastRef = useRef<number>(0);
    const broadcastState = (newState: any) => {
        if (!isHost || !channelRef.current || connectionStatus !== 'SUBSCRIBED') return;

        const now = Date.now();
        // Throttle to 200ms
        if (now - lastBroadcastRef.current < 200) return;
        
        lastBroadcastRef.current = now;
        channelRef.current.send({
            type: 'broadcast',
            event: 'game_state',
            payload: newState,
        }).catch(err => console.error("[useMultiplayer] Broadcast error:", err));
    };

    const sendActionToHost = (action: any) => {
        if (!isHost && channelRef.current && connectionStatus === 'SUBSCRIBED') {
            channelRef.current.send({
                type: 'broadcast',
                event: 'guest_action',
                payload: action,
            }).catch(err => console.error("[useMultiplayer] Send action error:", err));
        }
    };

    return { players, broadcastState, sendActionToHost, connectionStatus };
}
