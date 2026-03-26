import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GuestProgressBannerProps {
    player_id: string;
}

const GuestProgressBanner: React.FC<GuestProgressBannerProps> = ({ player_id }) => {
    const [claimCode, setClaimCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateClaimCode = (): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const saveProgress = async () => {
        setLoading(true);
        setError(null);
        try {
            const generatedCode = generateClaimCode();
            setClaimCode(generatedCode);

            const { error: updateError } = await supabase
                .from('players')
                .update({ claim_code: generatedCode })
                .eq('id', player_id);

            if (updateError) {
                throw updateError;
            }
        } catch (err: any) {
            console.error('Error al guardar el progreso del invitado:', err);
            setError('Error al guardar el progreso. Inténtalo de nuevo.');
            setClaimCode(null); // Resetear el código si hay error
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (claimCode) {
            navigator.clipboard.writeText(claimCode).then(() => {
                alert('Código copiado al portapapeles!');
            }).catch(err => {
                console.error('Error al copiar:', err);
                alert('No se pudo copiar el código.');
            });
        }
    };

    if (claimCode) {
        return (
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-lg shadow-lg animate-fade-in-up md:p-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">¡Tu progreso ha sido guardado!</h2>
                <p className="text-lg md:text-xl text-gray-300 mb-6 text-center">Usa este PIN para reclamarlo:</p>
                <div className="relative p-6 bg-gray-800 rounded-xl mb-8 border-2 border-indigo-500 shadow-neon-blue">
                    <p className="text-5xl md:text-7xl font-mono tracking-wider text-green-400 animate-pulse-light leading-none">
                        {claimCode}
                    </p>
                    <div className="absolute inset-0 border-4 border-transparent rounded-xl pointer-events-none animate-glow-border"></div>
                </div>
                <button
                    onClick={copyToClipboard}
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-lg md:text-xl transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Copiar PIN
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-white rounded-lg shadow-lg md:p-8 border border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-indigo-400">
                ¡No pierdas tus estadísticas!
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 text-center">
                Guarda tu progreso para mantener tus logros y monedas.
            </p>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <button
                onClick={saveProgress}
                disabled={loading}
                className="w-full md:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xl md:text-2xl transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 flex items-center justify-center"
            >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    'Guardar mi progreso'
                )}
            </button>
        </div>
    );
};

export default GuestProgressBanner;
