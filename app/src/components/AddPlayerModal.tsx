import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, X, Search, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImageToDataUrl } from '@/utils/imageCompression';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddPlayerModalProps {
    onAddPlayer: (name: string, avatarUrl?: string | null) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ onAddPlayer, isOpen, onClose }) => {
    const isMobile = useIsMobile();
    const [playerName, setPlayerName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<
        "new" | "community"
    >("new");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (activeTab !== 'community') return;
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('player_rankings')
                    .select('player_name, avatar_url, total_score')
                    .ilike('player_name', `%${searchQuery}%`)
                    .order('total_score', { ascending: false })
                    .limit(10);

                if (data && !error) {
                    setSearchResults(data);
                }
            } catch (err) {
                console.error('Error fetching community profiles:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setActiveTab('new');
        }
    }, [isOpen]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Instant preview while compressing
        const quickUrl = URL.createObjectURL(file);
        setAvatarUrl(quickUrl);

        // Compress off the main flow
        setTimeout(async () => {
            try {
                const compressed = await compressImageToDataUrl(file, 800, 0.90);
                setAvatarUrl(compressed);
            } catch (err) {
                console.error('Error compressing image:', err);
            } finally {
                URL.revokeObjectURL(quickUrl);
            }
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await onAddPlayer(playerName.trim(), avatarUrl);
            setPlayerName('');
            setAvatarUrl(null);
            onClose();
        } catch (err) {
            console.error('Error adding player:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-md w-[95vw] rounded-3xl overflow-hidden p-4 md:p-6">
                <DialogHeader className="p-0 mb-4">
                    <DialogTitle className="text-xl md:text-2xl font-black text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent uppercase tracking-tighter">
                        Nuevo Operador
                    </DialogTitle>
                    <DialogDescription className="text-center text-white/40 text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1">
                        Crea o busca un perfil
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4 flex bg-white/5 p-1 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 rounded-xl transition-all ${activeTab === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Plus className="h-3.5 w-3.5" /> Nuevo
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('community')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 rounded-xl transition-all ${activeTab === 'community' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users className="h-3.5 w-3.5" /> Comunidad
                    </button>
                </div>

                {activeTab === 'new' ? (
                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        {/* Avatar Selection */}
                        <div className="flex justify-center">
                            <div
                                className="relative cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-4 ring-white/10 group-hover:ring-primary/50 transition-all duration-500 shadow-2xl">
                                    {avatarUrl ? (
                                        <AvatarImage src={avatarUrl} className="object-cover" />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5">
                                            <Camera className="h-6 w-6 md:h-8 md:w-8 text-white/40" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <Input
                                placeholder="NOMBRE DEL OPERADOR"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 h-12 text-center font-black tracking-widest rounded-xl uppercase"
                                autoFocus
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={!playerName.trim() || isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-6 rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest shadow-xl shadow-purple-500/20"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>PROCESANDO...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 justify-center">
                                    <Plus className="h-5 w-5" />
                                    <span>RECLUTAR</span>
                                </div>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4 py-2 min-h-[300px]">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/20" />
                            <Input
                                placeholder="BUSCAR OPERADOR..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 h-12 rounded-xl font-bold tracking-tight uppercase"
                            />
                            {isSearching && (
                                <div className="absolute right-4 top-4 animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                            )}
                        </div>

                        <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                            {searchResults.length === 0 && searchQuery.trim() && !isSearching ? (
                                <p className="text-center text-white/40 text-xs py-8 font-bold uppercase tracking-widest">Sin resultados</p>
                            ) : searchResults.length === 0 && !searchQuery.trim() ? (
                                <div className="text-center text-white/20 text-xs py-12 flex flex-col items-center gap-3">
                                    <Users className="h-10 w-10 opacity-10" />
                                    <p className="font-bold uppercase tracking-widest">Escribe para buscar</p>
                                </div>
                            ) : (
                                searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={async () => {
                                            if (isLoading) return;
                                            setIsLoading(true);
                                            try {
                                                await onAddPlayer(result.player_name, result.avatar_url);
                                                setSearchQuery('');
                                                onClose();
                                            } catch (err) {
                                                console.error(err);
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left group active:scale-[0.98]"
                                    >
                                        <Avatar className="h-10 w-10 border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                            {result.avatar_url ? (
                                                <AvatarImage src={result.avatar_url} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-slate-800 text-[10px] font-black">
                                                    {result.player_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-xs truncate text-white uppercase tracking-tight group-hover:text-primary transition-colors">{result.player_name}</p>
                                            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{result.total_score || 0} PTS</p>
                                        </div>
                                        <div className="bg-primary/10 p-1.5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Plus className="h-3.5 w-3.5" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors h-8 w-8 flex items-center justify-center bg-white/5 rounded-full"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Background glow effects */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-pink-500/10 rounded-full blur-3xl"></div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddPlayerModal;
