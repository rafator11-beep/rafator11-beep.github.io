import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface PokerControlsProps {
    onAction: (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => void;
    isActive: boolean;
    currentBetToMatch?: number;
    myChips?: number;
    pot?: number;
}

export function PokerControls({ onAction, isActive, currentBetToMatch = 0, myChips = 1000, pot = 0 }: PokerControlsProps) {
    const minRaise = currentBetToMatch > 0 ? currentBetToMatch * 2 : 20;
    const [raiseAmount, setRaiseAmount] = useState(minRaise);

    useEffect(() => {
        if (isActive) {
            setRaiseAmount(Math.min(minRaise, myChips));
        }
    }, [isActive, minRaise, myChips]);

    if (!isActive) {
        return (
            <div className="premium-panel-soft rounded-[24px] px-4 py-5 text-center w-full max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45 mb-2">Mesa en juego</p>
                <p className="text-sm md:text-base text-white/70">Esperando a otros jugadores...</p>
            </div>
        );
    }

    const maxBet = myChips;
    const halfPot = Math.floor(pot / 2);

    const handleQuickBet = (type: 'min' | 'half' | 'allin') => {
        if (type === 'min') setRaiseAmount(Math.min(minRaise, myChips));
        if (type === 'half') setRaiseAmount(Math.min(halfPot > minRaise ? halfPot : minRaise, myChips));
        if (type === 'allin') setRaiseAmount(myChips);
    };

    const handleActionOut = (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => {
        if (action === 'fold') toast('Te has retirado', { icon: '🏳️' });
        if (action === 'check') toast('Pasas turno', { icon: '✊' });
        if (action === 'call') toast(`Igualas la apuesta (${currentBetToMatch})`, { icon: '🪙' });
        if (action === 'raise') toast(amount === myChips ? '¡ÓRDAGO! (ALL IN)' : `Subes a ${amount}`, { icon: amount === myChips ? '🔥' : '📈' });

        onAction(action, amount);
    };

    return (
        <div className="w-full max-w-3xl premium-panel rounded-[28px] p-4 md:p-5">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 items-stretch">
                <div className="premium-panel-soft rounded-[24px] p-4 md:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-bold mb-1">Subida</p>
                            <p className="text-xl md:text-2xl font-black text-white">Control de apuesta</p>
                        </div>
                        <div className="premium-chip text-amber-200">
                            <Coins size={14} className="opacity-80" /> {raiseAmount}
                        </div>
                    </div>

                    <Slider
                        defaultValue={[raiseAmount]}
                        value={[raiseAmount]}
                        min={Math.min(minRaise, myChips)}
                        max={myChips}
                        step={10}
                        onValueChange={(val) => setRaiseAmount(val[0])}
                        className="py-3"
                    />

                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleQuickBet('min')} className="h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/10">MIN</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleQuickBet('half')} className="h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/10">1/2 BOTE</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleQuickBet('allin')} className="h-11 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-400/20 text-xs font-black">ALL IN</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                    <Button
                        variant="destructive"
                        className="h-14 rounded-[22px] font-black text-sm md:text-base shadow-lg border border-red-300/10"
                        onClick={() => handleActionOut('fold')}
                    >
                        Retirarse
                    </Button>

                    <Button
                        variant="secondary"
                        className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-[22px] font-black text-sm md:text-base shadow-lg border border-white/10"
                        onClick={() => handleActionOut(currentBetToMatch > 0 ? 'call' : 'check', currentBetToMatch)}
                    >
                        {currentBetToMatch > 0 ? `Igualar ${currentBetToMatch}` : 'Pasar'}
                    </Button>

                    {myChips > 0 && (
                        <Button
                            variant="default"
                            className="h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-[22px] font-black text-sm md:text-base shadow-[0_0_18px_rgba(16,185,129,0.22)] border border-white/10"
                            onClick={() => handleActionOut('raise', raiseAmount)}
                        >
                            {raiseAmount === myChips ? 'All in' : `Subir a ${raiseAmount}`}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
