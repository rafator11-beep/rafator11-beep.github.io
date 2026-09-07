import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Camera, Sparkles, ArrowRight, Mail, Lock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImageToDataUrl } from '@/utils/imageCompression';

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=John',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Leo',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Sofia',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=ProX',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LucyQ',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool99',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=DarkKnight',
];

export function AuthOverlay() {
    const { user, signIn, signUp, isLoading, isAuthOverlayOpen, setAuthOverlayOpen } = useAuth();
    const alreadyHasName = !!localStorage.getItem('fiesta_player_name');
    // Si ya jugó como invitado y abre esto a mano ("iniciar sesión"), va directo al paso de cuenta.
    const [step, setStep] = useState<'profile' | 'auth'>(alreadyHasName ? 'auth' : 'profile');
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('fiesta_player_name') || '');
    const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0]);
    const [customAvatar, setCustomAvatar] = useState<string | null>(null);

    // Cuenta (paso 2, opcional)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Se muestra solo si el overlay está abierto y no hay sesión iniciada.
    // (En revisitas el overlay arranca cerrado; solo se abre en la 1ª visita
    //  o cuando el usuario pulsa "iniciar sesión" desde Ajustes / lobby.)
    if (isLoading || user || !isAuthOverlayOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImageToDataUrl(file, 500, 0.70);
            setCustomAvatar(compressed);
            setAvatarUrl(compressed);
        } catch (err) {
            console.error('Error compressing image:', err);
            toast.error('No se pudo cargar la foto');
        }
    };

    const saveProfile = () => {
        const name = playerName.trim() || 'Jugador';
        localStorage.setItem('fiesta_player_name', name);
        localStorage.setItem('fiesta_player_avatar', customAvatar || avatarUrl);
        return name;
    };

    // "¡A jugar!" → entra directo, sin cuenta
    const handlePlayNow = () => {
        if (!playerName.trim()) {
            toast.error('Ponte un nombre y a jugar');
            return;
        }
        const name = saveProfile();
        toast.success(`¡Vamos, ${name}!`);
        setAuthOverlayOpen(false);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (authMode === 'login') {
                await signIn(email, password);
                toast.success('¡Dentro! Sesión iniciada');
            } else {
                saveProfile();
                await signUp(email, password, playerName.trim() || 'Jugador', customAvatar || avatarUrl);
                toast.success('¡Cuenta creada! Tu progreso se guarda solo');
            }
            setAuthOverlayOpen(false);
        } catch (err: any) {
            const m = (err?.message || '').toLowerCase();
            if (m.includes('already') || m.includes('registered')) {
                toast.error('Ese email ya tiene cuenta. Prueba a entrar.');
                setAuthMode('login');
            } else if (m.includes('invalid') || m.includes('credentials')) {
                toast.error('Email o contraseña mal');
            } else if (m.includes('supabase') || m.includes('conexión') || m.includes('agotado')) {
                toast.error('Sin conexión. Puedes jugar sin cuenta.');
            } else {
                toast.error(err.message || 'Algo ha fallado, prueba otra vez');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkipAuth = () => {
        saveProfile();
        setAuthOverlayOpen(false);
    };

    const effectiveAvatar = customAvatar || avatarUrl;

    return (
        <AnimatePresence mode="wait">
            {step === 'profile' && (
                <motion.div
                    key="profile-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="fixed inset-0 z-[210] bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div className="absolute top-20 left-10 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden my-8"
                    >
                        <div className="text-center mb-6 relative z-10">
                            <motion.div
                                initial={{ rotate: -10, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring' }}
                                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30"
                            >
                                <Sparkles className="text-white" size={32} />
                            </motion.div>
                            <h2 className="text-3xl font-black text-white">¡Hola!</h2>
                            <p className="text-slate-400 mt-2 text-sm">Ponte un nombre, elige monigote y a jugar. Nada de rollos.</p>
                        </div>

                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="h-24 w-24 ring-4 ring-purple-500/40 shadow-xl transition-transform group-hover:scale-105">
                                    {effectiveAvatar ? (
                                        <AvatarImage src={effectiveAvatar} className="object-cover" />
                                    ) : (
                                        <AvatarFallback className="bg-slate-800"><Camera className="h-9 w-9 text-slate-500" /></AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full whitespace-nowrap font-bold shadow-lg">
                                    📷 Tu foto
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>

                            <div className="grid grid-cols-5 gap-2 w-full">
                                {AVATAR_OPTIONS.map((url) => (
                                    <div
                                        key={url}
                                        onClick={() => { setAvatarUrl(url); setCustomAvatar(null); }}
                                        className={`w-full aspect-square rounded-xl cursor-pointer overflow-hidden border-2 transition-all ${avatarUrl === url && !customAvatar
                                            ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/40 z-10'
                                            : 'border-slate-700/50 opacity-60 hover:opacity-100 hover:border-slate-500'}`}
                                    >
                                        <img src={url} alt="" className="w-full h-full object-cover bg-slate-800" />
                                    </div>
                                ))}
                            </div>

                            <div className="w-full space-y-2 mt-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">¿Cómo te llamamos?</label>
                                <Input
                                    autoFocus
                                    placeholder="Tu nombre o tu mote"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="bg-slate-800/60 border-slate-600 text-white text-lg h-14 placeholder:text-slate-500 rounded-xl"
                                    maxLength={20}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePlayNow()}
                                />
                            </div>

                            <Button
                                onClick={handlePlayNow}
                                disabled={!playerName.trim()}
                                className="w-full h-14 mt-1 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-lg border-none shadow-xl shadow-purple-600/30 transition-all active:scale-95"
                            >
                                ¡A jugar! <ArrowRight className="ml-2" />
                            </Button>

                            <button
                                type="button"
                                onClick={() => { if (playerName.trim()) { saveProfile(); } setStep('auth'); }}
                                className="text-sm text-slate-400 hover:text-white transition-colors font-medium pt-1"
                            >
                                Prefiero crear cuenta y guardar mi progreso →
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {step === 'auth' && (
                <motion.div
                    key="auth-step"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[210] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div className="absolute top-10 right-10 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden my-8"
                    >
                        <div className="text-center mb-6 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                                <Sparkles className="text-white" size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                {authMode === 'register' ? 'Crea tu cuenta' : 'Entra a tu cuenta'}
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                {authMode === 'register'
                                    ? 'Así no pierdes tus monedas ni tu ranking, y puedes jugar online. Tardas 20 segundos.'
                                    : 'Con tu email y contraseña de siempre.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="space-y-3 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Tu email
                                </label>
                                <Input
                                    required type="email"
                                    className="bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 rounded-xl h-12"
                                    placeholder="tucorreo@ejemplo.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <Lock className="h-3 w-3" /> Contraseña <span className="text-slate-600 normal-case tracking-normal">(mín. 6)</span>
                                </label>
                                <Input
                                    required type="password"
                                    className="bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 rounded-xl h-12"
                                    placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>

                            <Button
                                disabled={loading} type="submit"
                                className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg border-none"
                            >
                                {loading ? 'Un momento...' : (authMode === 'login'
                                    ? <><LogIn className="mr-2" /> Entrar</>
                                    : <><UserPlus className="mr-2" /> Crear cuenta</>)}
                            </Button>
                        </form>

                        <div className="mt-4 text-center relative z-10">
                            <button
                                type="button"
                                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                {authMode === 'login' ? '¿Nuevo? Crea tu cuenta' : '¿Ya tienes cuenta? Entra'}
                            </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 relative z-10">
                            <Button
                                variant="outline"
                                className="border-slate-700 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl h-11"
                                onClick={() => setStep('profile')}
                            >
                                ← Volver
                            </Button>
                            <Button
                                className="rounded-xl h-11 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10"
                                onClick={handleSkipAuth}
                            >
                                Jugar sin cuenta
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
