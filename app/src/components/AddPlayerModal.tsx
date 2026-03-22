import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, X } from 'lucide-react';
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