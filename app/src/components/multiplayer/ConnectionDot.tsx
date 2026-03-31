import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

export function ConnectionDot() {
  const [status, setStatus] = useState<'online' | 'offline' | 'error' | 'syncing'>('offline');
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('offline');
      return;
    }

    const checkConnection = async () => {
      setStatus('syncing');
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) setStatus('error');
        else setStatus('online');
      } catch {
        setStatus('error');
      }
    };

    checkConnection();

    // Heartbeat every 60s
    const interval = setInterval(checkConnection, 60000);

    const channel = supabase.channel('system_status')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('online');
        if (status === 'CLOSED') setStatus('offline');
        if (status === 'CHANNEL_ERROR') setStatus('error');
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const config = {
    online: { color: 'bg-emerald-500', icon: <Wifi className="w-3 h-3" />, label: 'Conectado' },
    offline: { color: 'bg-slate-500', icon: <WifiOff className="w-3 h-3" />, label: 'Sin Conexión' },
    syncing: { color: 'bg-blue-500', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Sincronizando' },
    error: { color: 'bg-rose-500', icon: <AlertCircle className="w-3 h-3" />, label: 'Error' },
  };

  return (
    <div 
      className="relative flex items-center gap-2 cursor-help group"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onClick={() => {
        // Manual trigger for sync
        if (isSupabaseConfigured) {
           const checkConnection = async () => {
            setStatus('syncing');
            try {
              await supabase.from('profiles').select('id').limit(1);
              setStatus('online');
            } catch { setStatus('error'); }
          };
          checkConnection();
        }
      }}
    >
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${config[status].color} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors duration-500`} />
        {status === 'online' && (
          <motion.div
            animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={`absolute inset-0 rounded-full ${config[status].color}`}
          />
        )}
      </div>

      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            className="absolute left-6 bg-slate-900 shadow-2xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 z-[60] whitespace-nowrap"
          >
            <div className={`p-1 rounded-md ${config[status].color.replace('bg-', 'bg-opacity-20 text-')}`}>
              {config[status].icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              {config[status].label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
