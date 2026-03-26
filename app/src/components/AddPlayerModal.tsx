import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, X, Search, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImageToDataUrl } from '@/utils/imageCompression';

interface AddPlayerModalProps {
    onAddPlayer: (name: string, avatarUrl?: string | null) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ onAddPlayer, isOpen, onClose }) => {
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
            <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Nuevo Operador
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 mb-2 flex bg-white/5 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-1.5 text-sm font-bold flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Plus className="h-4 w-4" /> Nuevo
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('community')}
                        className={`flex-1 py-1.5 text-sm font-bold flex justify-center items-center gap-2 rounded-lg transition-all ${activeTab === 'community' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users className="h-4 w-4" /> Comunidad
                    </button>
                </div>

                {activeTab === 'new' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        {/* Avatar Selection */}
                        <div className="flex justify-center">
                            <div
                                className="relative cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar className="h-24 w-24 ring-4 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
                                    {avatarUrl ? (
                                        <AvatarImage src={avatarUrl} className="object-cover" />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900">
                                            <Camera className="h-8 w-8 text-white/40" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="h-6 w-6 text-white" />
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
                                placeholder="Nombre del operador"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-primary/50"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={!playerName.trim() || isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Añadiendo...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 justify-center">
                                    <Plus className="h-5 w-5" />
                                    <span>Añadir Operador</span>
                                </div>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4 py-4 min-h-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                            <Input
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-primary/50"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-3 animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                            )}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.length === 0 && searchQuery.trim() && !isSearching ? (
                                <p className="text-center text-white/40 text-sm py-8">No se encontraron perfiles</p>
                            ) : searchResults.length === 0 && !searchQuery.trim() ? (
                                <div className="text-center text-white/40 text-sm py-8 flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 text-white/20" />
                                    <p>Busca un operador de la comunidad</p>
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
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left group"
                                    >
                                        <Avatar className="h-10 w-10 border border-white/10 group-hover:scale-105 transition-transform">
                                            {result.avatar_url ? (
                                                <AvatarImage src={result.avatar_url} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-slate-800 text-xs">
                                                    {result.player_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm truncate text-white group-hover:text-primary transition-colors">{result.player_name}</p>
                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{result.total_score || 0} PTS</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 p-1.5 rounded-full text-primary">
                                            <Plus className="h-3 w-3" />
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
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Background glow effects */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-pink-500/20 rounded-full blur-3xl"></div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddPlayerModal;