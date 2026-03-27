import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function ConnectionDot() {
  const [status, setStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('offline');
      return;
    }

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) setStatus('error');
        else setStatus('online');
      } catch {
        setStatus('error');
      }
    };

    checkConnection();

    // Subscribe to presence or channel to maintain status
    const channel = supabase.channel('system_status')
      .on('system', { event: '*' }, (payload) => {
        console.log('System event:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('online');
        if (status === 'CLOSED') setStatus('offline');
        if (status === 'CHANNEL_ERROR') setStatus('error');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const config = {
    online: { color: 'bg-emerald-500', icon: <Wifi className="w-3 h-3" />, label: 'Online' },
    offline: { color: 'bg-slate-500', icon: <WifiOff className="w-3 h-3" />, label: 'Offline' },
    error: { color: 'bg-rose-500', icon: <AlertCircle className="w-3 h-3" />, label: 'Error' },
  };

  return (
    <div 
      className="relative flex items-center gap-2 cursor-help"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
    >
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${config[status].color} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} />
        {status === 'online' && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute inset-0 rounded-full ${config[status].color}`}
          />
        )}
      </div>

      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2 z-50 whitespace-nowrap"
          >
            <span className={config[status].color.replace('bg-', 'text-')}>
              {config[status].icon}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white font-arcade">
              {config[status].label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
