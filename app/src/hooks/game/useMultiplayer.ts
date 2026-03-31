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

    useEffect(() => {
        if (!roomId || !playerName) return;

        setConnectionStatus('JOINING');

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: playerId || playerName, 
                },
            },
        });

        channel
            .on('broadcast', { event: 'game_state' }, ({ payload }) => {
                if (!isHost) {
                    onGameStateUpdate(payload);
                }
            })
            .on('broadcast', { event: 'guest_action' }, ({ payload }) => {
                if (isHost && onGuestAction) {
                    onGuestAction(payload);
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.keys(state).map(key => ({
                    presence_key: key,
                    id: key,
                    ...state[key][0] 
                }));
                setPlayers(users);
            })
            .subscribe(async (status) => {
                setConnectionStatus(status as any);
                if (status === 'SUBSCRIBED') {
                    await channel.track({ 
                        online_at: new Date().toISOString(), 
                        isHost,
                        playerName,
                        playerId
                    });
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`[useMultiplayer] Channel error in room: ${roomId}`);
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
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
