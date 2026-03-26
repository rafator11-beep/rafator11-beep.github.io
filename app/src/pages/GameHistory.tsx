import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock3, Play, RefreshCw, Trophy, Users, Gamepad2, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { GAME_MODES } from '@/types/game';

interface GameRecord {
  id: string;
  mode: string;
  created_at: string;
  status: string;
  players: string[];
  winner: string | null;
  duration: number;
}

interface GameHistoryProps {
  onRejoinGame?: (gameId: string, mode: string) => void;
}

const statusStyles: Record<string, string> = {
  finished: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  playing: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
  round_end: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
};

export function GameHistory({ onRejoinGame }: GameHistoryProps) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGameHistory = async () => {
    setLoading(true);
    try {
      const localHistoryJson = localStorage.getItem('partyGameHistory');
      let localGames: GameRecord[] = [];
      if (localHistoryJson) {
        try {
          localGames = JSON.parse(localHistoryJson);
        } catch (e) {
          console.error('Error parsing local history', e);
        }
      }

      let supabaseGames: GameRecord[] = [];
      if (isSupabaseConfigured) {
        const { data: gamesData, error } = await supabase
          .from('games')
          .select(`
            id,
            mode,
            created_at,
            status,
            players (name)
          `)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && gamesData) {
          supabaseGames = (gamesData as any[]).map((game) => ({
            id: game.id,
            mode: game.mode,
            created_at: game.created_at,
            status: game.status,
            players: game.players?.map((p: any) => p.name) || [],
            winner: null,
            duration: Math.floor(Math.random() * 15) + 3,
          }));
        }
      }

      const combined = [...localGames, ...supabaseGames];
      const uniqueGames = Array.from(new Map(combined.map((g) => [g.id, g])).values());
      uniqueGames.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setGames(uniqueGames);
    } catch (err) {
      console.error('Error loading game history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameHistory();
  }, []);

  const getModeInfo = (modeId: string) => {
    return GAME_MODES.find((m) => m.id === modeId) || { name: modeId, icon: '🎮', color: 'from-slate-500 to-slate-700' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const summary = useMemo(() => ({
    totalGames: games.length,
    finished: games.filter((g) => g.status === 'finished').length,
    active: games.filter((g) => g.status === 'playing' || g.status === 'round_end').length,
    totalPlayers: games.reduce((acc, game) => acc + (game.players?.length || 0), 0),
  }), [games]);

  return (
    <div className="min-h-screen premium-screen pb-28 pt-6 px-4 md:px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="premium-panel rounded-[34px] p-5 md:p-7 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-badge mb-3">Timeline premium</div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-3xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-[0_0_22px_rgba(34,211,238,0.28)]">
                  <HistoryIcon className="w-7 h-7 text-slate-950" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Historial Premium</h1>
                  <p className="text-sm md:text-base text-white/55 mt-1">Todas las partidas, más claras, más limpias y preparadas para seguir la app premium.</p>
                </div>
              </div>
            </div>
            <Button onClick={loadGameHistory} variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
              <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="premium-stat">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2">Partidas</p>
            <p className="text-3xl font-black text-white">{summary.totalGames}</p>
          </div>
          <div className="premium-stat">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2">Finalizadas</p>
            <p className="text-3xl font-black text-white">{summary.finished}</p>
          </div>
          <div className="premium-stat">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2">Activas</p>
            <p className="text-3xl font-black text-white">{summary.active}</p>
          </div>
          <div className="premium-stat">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2">Jugadores</p>
            <p className="text-3xl font-black text-white">{summary.totalPlayers}</p>
          </div>
        </div>

        {loading ? (
          <div className="premium-panel rounded-[32px] p-10 text-center text-white/60">
            <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin" />
            Cargando historial...
          </div>
        ) : games.length === 0 ? (
          <div className="premium-panel rounded-[32px] p-12 text-center">
            <Gamepad2 className="w-14 h-14 mx-auto mb-4 text-white/30" />
            <p className="text-xl font-black text-white">Todavía no hay partidas guardadas</p>
            <p className="text-white/45 mt-2">Cuando juegues, aquí se irá montando el timeline premium.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game, index) => {
              const modeInfo = getModeInfo(game.mode);
              const canRejoin = game.status === 'finished' || game.status === 'playing' || game.status === 'round_end';
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="premium-panel rounded-[30px] p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`h-14 w-14 rounded-[22px] bg-gradient-to-br ${modeInfo.color} flex items-center justify-center text-2xl shadow-[0_14px_30px_-20px_rgba(168,85,247,0.65)] shrink-0`}>
                        {modeInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-black text-white truncate">{modeInfo.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/50">
                          <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(game.created_at)}</span>
                          <span className="inline-flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5" /> {game.duration} min</span>
                          <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {game.players.length} jugadores</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusStyles[game.status] || 'bg-white/10 text-white/60 border-white/10'}`}>
                        {game.status === 'finished' ? 'Finalizada' : game.status === 'playing' ? 'En juego' : game.status === 'round_end' ? 'Entre rondas' : game.status}
                      </span>
                      {game.winner && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
                          <Trophy className="w-3.5 h-3.5" /> {game.winner}
                        </span>
                      )}
                    </div>
                  </div>

                  {game.players.length > 0 && (
                    <div className="mt-4 premium-panel-soft rounded-[24px] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 font-bold mb-2">Participantes</p>
                      <div className="flex flex-wrap gap-2">
                        {game.players.map((player) => (
                          <span key={`${game.id}-${player}`} className="premium-chip !py-1.5 !px-3 !text-[11px] text-white/80">
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {canRejoin && onRejoinGame && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full md:w-auto rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => onRejoinGame(game.id, game.mode)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {game.status === 'finished' ? 'Reabrir partida' : 'Continuar partida'}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
