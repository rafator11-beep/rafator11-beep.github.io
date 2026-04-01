import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { globalNetwork } from './engine/NetworkManager';
import { motion } from 'framer-motion';
import { Smartphone, MonitorPlay, Loader2 } from 'lucide-react';

interface MatchmakingProps {
  onConnected: (isHost: boolean) => void;
}

export function ArcadeMatchmaking({ onConnected }: MatchmakingProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'HOSTING' | 'JOINING' | 'CONNECTED'>('IDLE');
  
  const isMobile = window.innerWidth <= 768; // Estimación simple de si somos el host o quien une
  const urlParams = new URLSearchParams(window.location.search);
  const joinParam = urlParams.get('join_arcade');

  useEffect(() => {
    // Si la URL trae un parámetro, intentamos unirnos
    if (joinParam) {
      handleJoin(joinParam);
    } else if (!isMobile) {
      // Escritorio crea la sala por defecto para que el móvil se una
      handleHost();
    } else {
      // Móvil sin parámetro (Escaneó usando cámara nativa pero la URL estaba mal configurada?
      // O solo abrió la sección Arcade. Le pedimos escanear el QR o escribir PIN)
      setStatus('IDLE');
    }

    globalNetwork.onConnected(() => {
      setStatus('CONNECTED');
      setTimeout(() => onConnected(globalNetwork.isHost), 500); 
    });

    return () => {
      // Al salir de matchmaking si no conectamos (lo limpia el componente superior en unmount general)
    };
  }, [joinParam]);

  const handleHost = async () => {
    setStatus('HOSTING');
    try {
      const id = await globalNetwork.initAsHost();
      setRoomId(id);
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
    }
  };

  const handleJoin = async (targetId: string) => {
    setStatus('JOINING');
    try {
      await globalNetwork.joinRoom(targetId);
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
    }
  };

  const currentUrl = window.location.origin + window.location.pathname + `?join_arcade=${roomId}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-black/50 rounded-[32px] p-8 border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] relative overflow-hidden">
      
      {/* Background Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <h2 className="text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-8 z-10 text-center">
        ARCADE LINK P2P
      </h2>

      {status === 'HOSTING' && roomId && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="flex flex-col items-center z-10"
        >
          <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4">
            <QRCodeSVG value={currentUrl} size={180} level={"H"} />
          </div>
          <p className="text-cyan-300 font-bold tracking-widest uppercase flex items-center gap-2 text-sm mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Esperando Operador Móvil...
          </p>
          <div className="text-[10px] text-slate-500 mt-2 font-mono bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
            ID: {roomId}
          </div>
        </motion.div>
      )}

      {status === 'JOINING' && (
        <motion.div className="flex flex-col items-center z-10 space-y-4">
          <Smartphone className="w-16 h-16 text-cyan-400 animate-pulse" />
          <p className="text-cyan-400 font-bold uppercase tracking-widest text-lg flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Sincronizando Host...
          </p>
        </motion.div>
      )}

      {status === 'CONNECTED' && (
        <motion.div className="flex flex-col items-center z-10 text-green-400">
          <MonitorPlay className="w-16 h-16 mb-4" />
          <p className="font-arcade text-2xl uppercase tracking-widest">Enlace Establecido</p>
        </motion.div>
      )}

    </div>
  );
}
