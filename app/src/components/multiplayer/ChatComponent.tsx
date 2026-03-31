import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
    status?: 'sending' | 'sent' | 'error';
}

export function ChatComponent({ roomId, playerName }: { roomId: string, playerName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    // Identity state
    const [localNickname, setLocalNickname] = useState(() => localStorage.getItem('chat_nickname') || playerName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('chat_nickname')) {
            setLocalNickname(playerName);
        }
    }, [playerName]);

    const saveName = () => {
        if (tempName.trim()) {
            const finalName = tempName.trim();
            setLocalNickname(finalName);
            localStorage.setItem('chat_nickname', finalName);
            setIsEditingName(false);
        }
    };

    // Stable Channel Subscription
    useEffect(() => {
        if (!roomId || !isSupabaseConfigured) return;

        const channel = supabase.channel(`chat:${roomId}`);

        channel
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                setMessages(prev => {
                    // Avoid duplicates from self-broadcast if any
                    if (prev.some(m => m.id === payload.id)) return prev;
                    return [...prev, { ...payload, status: 'sent' }];
                });
                setHasUnread(prev => {
                    // Update only if chat is closed or scrolled up
                    return !isOpen;
                });
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]); // ONLY depend on roomId

    // Update hasUnread when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [isOpen]);

    // Scroll more reliably
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        const msgId = crypto.randomUUID();
        const msg: ChatMessage = {
            id: msgId,
            sender: roomId === 'global_lobby' ? localNickname : playerName,
            text: newMessage.trim(),
            timestamp: Date.now(),
            status: 'sending'
        };

        // Optimistic update
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        setIsSending(true);

        try {
            if (isSupabaseConfigured && channelRef.current) {
                const result = await channelRef.current.send({
                    type: 'broadcast',
                    event: 'chat_message',
                    payload: msg
                });

                if (result === 'ok') {
                    setMessages(prev => 
                        prev.map(m => m.id === msgId ? { ...m, status: 'sent' } : m)
                    );
                } else {
                    throw new Error("Failed to send");
                }
            } else {
                throw new Error("Supabase not configured");
            }
        } catch (error) {
            console.error("[Chat] Error sending message:", error);
            setMessages(prev => 
                prev.map(m => m.id === msgId ? { ...m, status: 'error' } : m)
            );
            toast.error("Error al enviar mensaje. Reintentando...");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.div
                className="fixed bottom-48 right-6 z-40"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <Button
                    size="icon"
                    className={`rounded-full h-14 w-14 shadow-2xl border-2 transition-all relative ${hasUnread ? 'bg-red-500 hover:bg-red-600 animate-bounce border-white' : 'bg-primary border-primary/20 hover:bg-primary/90'}`}
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                    <AnimatePresence>
                        {hasUnread && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
                            >
                                !
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-64 right-6 w-80 h-96 bg-slate-950/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className={`p-4 border-b border-white/10 flex justify-between items-center ${roomId === 'global_lobby' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                            {roomId === 'global_lobby' && isEditingName ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                    <Input
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="h-8 text-xs bg-black/50 border-white/20 rounded-xl"
                                        placeholder="Tu nombre..."
                                        autoFocus
                                        maxLength={12}
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-green-500/20" onClick={saveName}>
                                        <Send className="w-3 h-3 text-green-400" />
                                    </Button>
                                </div>
                            ) : (
                                <h3 className="font-bold flex items-center gap-2 text-sm" onClick={() => roomId === 'global_lobby' && setIsEditingName(true)}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${roomId === 'global_lobby' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                    {roomId === 'global_lobby' ? 'Chat Global' : `Sala ${roomId}`}
                                    {roomId === 'global_lobby' && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full ml-auto cursor-pointer border border-white/10 hover:bg-white/10 text-white/60">✏️ {localNickname}</span>}
                                </h3>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4 text-white/40" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30">
                                    <MessageCircle className="w-12 h-12" />
                                    <p className="text-xs font-bold uppercase tracking-widest">¡Di hola!</p>
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isMe = msg.sender === (roomId === 'global_lobby' ? localNickname : playerName);
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {!isMe && <span className="text-[10px] font-black uppercase tracking-wider text-white/40">{msg.sender}</span>}
                                            {isMe && msg.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                            {isMe && msg.status === 'sending' && <Loader2 className="w-3 h-3 text-white/20 animate-spin" />}
                                        </div>
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm max-w-[90%] break-words shadow-lg transition-opacity ${isMe
                                                ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-tr-none'
                                                : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                                                } ${msg.status === 'sending' ? 'opacity-70' : ''} ${msg.status === 'error' ? 'border-red-500/50' : ''}`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 flex gap-2 bg-white/5">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Escribe algo..."
                                disabled={isSending}
                                className="h-11 bg-black/40 border-white/10 rounded-2xl focus:border-primary/50 transition-all"
                            />
                            <Button 
                                size="icon" 
                                className={`h-11 w-11 shrink-0 rounded-2xl shadow-lg transition-all ${isSending ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                                onClick={sendMessage}
                                disabled={isSending || !newMessage.trim()}
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
