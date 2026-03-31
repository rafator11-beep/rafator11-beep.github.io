import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Eye, EyeOff } from 'lucide-react';
import { useGameContext } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';

interface PeerBubblesProps {
    roomId: string;
    playerId: string;
    onClose: () => void;
    onStreamsChange?: (streams: PeerData[]) => void;
    onLocalStream?: (stream: MediaStream) => void;
}

interface PeerData {
    peerId: string;
    stream: MediaStream;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

// Hook for window dimensions to calculate radial layout
function useWindowSize() {
    const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSize([window.innerWidth, window.innerHeight]);
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);
    return size;
}

export function PeerBubbles({ roomId, playerId, onClose, onStreamsChange, onLocalStream }: PeerBubblesProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<PeerData[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isSpectatorMode, setIsSpectatorMode] = useState(false); // Hide local bubble but keep sending stream
    const [error, setError] = useState<string | null>(null);
    const [windowWidth, windowHeight] = useWindowSize();

    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const channelRef = useRef<any>(null);
    const isReadySent = useRef<boolean>(false);

    // 1. Initialize Local Stream
    useEffect(() => {
        let stream: MediaStream | null = null;

        const initMedia = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, frameRate: 15 },
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true;
                }
                if (onLocalStream) onLocalStream(stream);
            } catch (err) {
                console.error("Error accessing media:", err);
                setError("No se pudo acceder a la cámara/micrófono");
            }
        };

        initMedia();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 2. Initialize Signaling (Supabase DB)
    useEffect(() => {
        if (!localStream) return;

        const sendSignal = async (to: string, type: string, payload: any) => {
            try {
                await supabase.from('webrtc_signals').insert({
                    room_id: roomId,
                    sender_id: playerId,
                    receiver_id: to,
                    type: type,
                    payload: payload
                });
            } catch (err) {
                console.error("Failed to send DB signal", err);
            }
        };

        const createPeer = (targetPeerId: string, initiator: boolean) => {
            if (peersRef.current[targetPeerId]) {
                return peersRef.current[targetPeerId];
            }

            const peer = new RTCPeerConnection(ICE_SERVERS);

            // Add local stream tracks to the peer connection
            localStream.getTracks().forEach(track => {
                peer.addTrack(track, localStream);
            });

            // Handle ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal(targetPeerId, 'candidate', event.candidate);
                }
            };

            // Handle incoming streams
            peer.ontrack = (event) => {
                if (event.track) event.track.enabled = true;
                if (event.streams && event.streams[0]) {
                    setRemoteStreams(prev => {
                        // Prevent duplicates
                        if (prev.find(p => p.peerId === targetPeerId)) return prev;
                        const next = [...prev, { peerId: targetPeerId, stream: event.streams[0] }];
                        if (onStreamsChange) onStreamsChange(next);
                        return next;
                    });
                }
            };

            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'closed') {
                    removePeer(targetPeerId);
                }
            };

            // If we are the initiator, create and send an offer
            if (initiator) {
                peer.createOffer()
                    .then(offer => peer.setLocalDescription(offer))
                    .then(() => {
                        sendSignal(targetPeerId, 'offer', peer.localDescription);
                    })
                    .catch(e => console.error("Error creating offer:", e));
            }

            peersRef.current[targetPeerId] = peer;
            return peer;
        };

        const removePeer = (targetPeerId: string) => {
            if (peersRef.current[targetPeerId]) {
                try {
                    peersRef.current[targetPeerId].close();
                } catch (e) {
                    console.error("Error closing peer:", e);
                }
                delete peersRef.current[targetPeerId];
            }
            setRemoteStreams(prev => {
                const next = prev.filter(p => p.peerId !== targetPeerId);
                if (onStreamsChange) onStreamsChange(next);
                return next;
            });
        };

        const channel = supabase.channel(`webrtc-db-${roomId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'webrtc_signals', filter: `room_id=eq.${roomId}` },
                async (payload) => {
                    const row = payload.new as any;

                    if (row.receiver_id !== playerId && row.receiver_id !== '*') return;
                    if (row.sender_id === playerId) return;

                    const from = row.sender_id;
                    const type = row.type;
                    const signalPayload = row.payload;

                    if (type === 'ready') {
                        createPeer(from, true);
                        return;
                    }

                    if (type === 'leave') {
                        removePeer(from);
                        return;
                    }

                    let peer = peersRef.current[from];
                    if (!peer) {
                        peer = createPeer(from, false);
                    }

                    try {
                        if (type === 'offer') {
                            await peer.setRemoteDescription(new RTCSessionDescription(signalPayload));
                            const answer = await peer.createAnswer();
                            await peer.setLocalDescription(answer);
                            sendSignal(from, 'answer', peer.localDescription);
                        } else if (type === 'answer') {
                            await peer.setRemoteDescription(new RTCSessionDescription(signalPayload));
                        } else if (type === 'candidate') {
                            if (peer.remoteDescription) {
                                await peer.addIceCandidate(new RTCIceCandidate(signalPayload));
                            }
                        }
                    } catch (e) {
                        console.error(`Error handling DB signal ${type} from ${from}:`, e);
                    }
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && !isReadySent.current) {
                    isReadySent.current = true;
                    await sendSignal('*', 'ready', {});
                }
            });

        channelRef.current = channel;

        return () => {
            // Mejora 13: Cleanup signals to avoid "trash" in next session
            supabase.from('webrtc_signals').delete().eq('room_id', roomId).eq('sender_id', playerId).then();
            sendSignal('*', 'leave', {});
            supabase.removeChannel(channel);
            Object.values(peersRef.current).forEach(peer => {
                try {
                    peer.close();
                } catch (e) { }
            });
            peersRef.current = {};
            setRemoteStreams([]);
            isReadySent.current = false;
        };
    }, [localStream, roomId, playerId]);

    const toggleMute = () => {
        if (localStream) {
            const newMutedState = !isMuted;
            localStream.getAudioTracks().forEach(track => track.enabled = !newMutedState);
            setIsMuted(newMutedState);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const newVideoState = !isVideoEnabled;
            localStream.getVideoTracks().forEach(track => track.enabled = newVideoState);
            setIsVideoEnabled(newVideoState);
        }
    };

    const toggleSpectatorMode = () => {
        setIsSpectatorMode(!isSpectatorMode);
    };

    // Calculate radial layout coordinates
    const getRadialLayout = (index: number, total: number) => {
        const cx = windowWidth / 2;
        const cy = windowHeight / 2;
        const bubbleSize = 96; // 6rem (w-24 h-24)
        const radiusBase = Math.min(cx, cy);

        // Dynamic rings based on total users
        let ring = 0;
        let peersInRing = total;
        let ringRadius = radiusBase * 0.4;
        let positionInRing = index;

        // 2-4: 1 ring
        // 5-10: 2 rings
        // 11+: 3 rings
        if (total > 4 && total <= 10) {
            if (index < 4) {
                ring = 0; peersInRing = 4; ringRadius = radiusBase * 0.3;
            } else {
                ring = 1; peersInRing = total - 4; ringRadius = radiusBase * 0.6;
                positionInRing = index - 4;
            }
        } else if (total > 10) {
            if (index < 4) {
                ring = 0; peersInRing = 4; ringRadius = radiusBase * 0.25;
            } else if (index < 10) {
                ring = 1; peersInRing = 6; ringRadius = radiusBase * 0.5;
                positionInRing = index - 4;
            } else {
                ring = 2; peersInRing = total - 10; ringRadius = radiusBase * 0.75;
                positionInRing = index - 10;
            }
        }

        const angle = (positionInRing / peersInRing) * Math.PI * 2 - Math.PI / 2;
        return {
            x: cx + Math.cos(angle) * ringRadius - (bubbleSize / 2),
            y: cy + Math.sin(angle) * ringRadius - (bubbleSize / 2),
        };
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[50]">
            {/* Close Button Overlay */}
            <div className="absolute top-6 right-6 pointer-events-auto">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full shadow-lg border border-white/20 bg-red-600/80 backdrop-blur"
                >
                    <VideoOff className="w-4 h-4 mr-1" />
                    Ocultar Globos
                </Button>
            </div>

            {/* Local User Bubble - Hidden per user request ("ver solo a los demas") */}
            <div className="hidden">
                <video ref={localVideoRef} autoPlay muted playsInline />
            </div>

            {/* Spectator Mode floating toggle (if active) */}
            {isSpectatorMode && (
                <div className="fixed bottom-6 right-4 z-[60] pointer-events-auto">
                    <button
                        onClick={toggleSpectatorMode}
                        className="bg-primary/80 backdrop-blur text-primary-foreground p-3 rounded-full shadow-lg border border-primary/20 hover:bg-primary transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Eye size={16} /> Mostrar mi cámara
                    </button>
                    {/* Hidden video element for stream keepalive */}
                    <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
                </div>
            )}

            {/* Remote Bubbles in Radial Layout */}
            <AnimatePresence>
                {remoteStreams.map((peer, index) => {
                    const { x, y } = getRadialLayout(index, remoteStreams.length);
                    return (
                        <RemoteBubble key={peer.peerId} peer={peer} x={x} y={y} />
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

const RemoteBubble = ({ peer, x, y }: { peer: PeerData, x: number, y: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { players } = useGameContext();
    const playerName = players.find(p => p.id === peer.peerId)?.name || `Amigo ${peer.peerId.slice(0, 4)}`;

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, x: window.innerWidth / 2, y: window.innerHeight / 2 }}
            animate={{ scale: 1, opacity: 1, x, y }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="absolute z-[50] pointer-events-auto group"
        >
            <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)] bg-zinc-800 transition-transform group-hover:scale-105 group-hover:z-50 cursor-pointer overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
            </div>
            {/* Name Below Video */}
            <div className="text-center mt-2 w-full max-w-[96px] absolute -bottom-8">
                <span className="text-xs font-semibold text-white bg-black/60 px-2 py-0.5 rounded-md drop-shadow-md block truncate">
                    {playerName}
                </span>
            </div>
        </motion.div>
    );
};
