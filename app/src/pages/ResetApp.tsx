import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldAlert, SkipBack, Database, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetApp() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReset = async () => {
    setIsDeleting(true);
    try {
      // 1. Sign out (wipes Supabase local session)
      await signOut();
      
      // 2. Clear all local storage manually
      localStorage.clear();
      sessionStorage.clear();

      // 3. Optional: Instruct the user they can use Supabase Studio if they need to wipe cloud data.
      toast.success('¡Limpieza local exitosa! Datos temporales y perfiles del navegador borrados.');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (e: any) {
      toast.error('Error durante el reseteo: ' + e.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="surface-panel p-8 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-white">Modo Ingeniero: Reset</h1>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          Esto eliminará todos los datos de tu dispositivo actual: cachés, sesión persistente, perfiles de invitado y estado temporal de partidas. Volverás a "empezar de todo todo" a nivel de aplicación.
        </p>

        <div className="text-xs text-orange-400 bg-orange-500/10 p-4 rounded-xl text-left flex items-start gap-3">
          <Database className="w-5 h-5 shrink-0" />
          <p>Para la Base de Datos Remota (Supabase), lo recomendado es entrar a Supabase Dashboard y ejecutar un <code className="font-mono bg-black/40 px-1 rounded">TRUNCATE</code> en tus tablas principales (`player_rankings`, `profiles`, `games`).</p>
        </div>

        <div className="pt-6 border-t border-white/5 grid gap-3">
          <Button 
            variant="destructive" 
            onClick={handleReset} 
            disabled={isDeleting}
            className="w-full font-bold h-12"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Borrando...' : 'Borrar Toda Caché Local'}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12"
          >
            <SkipBack className="w-4 h-4 mr-2" />
            Volver al Juego
          </Button>
        </div>
      </div>
    </div>
  );
}
