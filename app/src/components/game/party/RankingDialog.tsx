import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RankingDialogProps {
  players: any[];
  scores: Record<string, number>;
}

export function RankingDialog({ players, scores }: RankingDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-white/20 bg-transparent text-xs"
        >
          <Trophy className="h-3 w-3 text-yellow-500" />
          Ranking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
        <DialogHeader>
          <DialogTitle>Clasificación General</DialogTitle>
          <DialogDescription>
            Puntuaciones actuales y estadísticas históricas de los jugadores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {[...players]
            .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
            .map((p, i) => {
              // Get real stats from localStorage rankings
              const allRankings = (() => {
                try {
                  return JSON.parse(localStorage.getItem('fiesta-party-local-rankings-v1') || '[]');
                } catch {
                  return [];
                }
              })();
              const playerRanking = allRankings.find(
                (r: any) => r.player_name?.toLowerCase() === p.name?.toLowerCase()
              );

              // Import classification inline
              const getTitle = (r: any) => {
                if (!r) return { title: 'Nuevo', emoji: '🌟', color: 'text-slate-400' };
                const won = r.games_won || 0;
                const played = r.games_played || 0;
                const level = r.level || 1;
                const streak = r.win_streak || 0;
                if (won >= 100 && level >= 30)
                  return { title: 'Leyenda Suprema', emoji: '👑', color: 'text-yellow-400' };
                if (played >= 200)
                  return { title: 'Dios del Party', emoji: '⚡', color: 'text-purple-400' };
                if (streak >= 15)
                  return { title: 'El Inmortal', emoji: '🔥', color: 'text-red-400' };
                if (won >= 50)
                  return { title: 'Máquina de Ganar', emoji: '🏆', color: 'text-yellow-400' };
                if (played >= 100)
                  return { title: 'El Incombustible', emoji: '🛡️', color: 'text-slate-300' };
                if (played >= 50)
                  return { title: 'Veterano', emoji: '🎖️', color: 'text-amber-500' };
                if (won >= 20)
                  return { title: 'El Imparable', emoji: '💪', color: 'text-orange-400' };
                if (won >= 10) return { title: 'Promesa', emoji: '⭐', color: 'text-yellow-300' };
                if (played >= 15)
                  return { title: 'Explorador', emoji: '🧭', color: 'text-teal-400' };
                if (played >= 5) return { title: 'Aprendiz', emoji: '📖', color: 'text-slate-300' };
                if (played >= 1)
                  return { title: 'Recién Llegado', emoji: '👋', color: 'text-slate-400' };
                return { title: 'Nuevo', emoji: '🌟', color: 'text-slate-500' };
              };

              const info = getTitle(playerRanking);
              const realGamesPlayed = playerRanking?.games_played || 0;
              const realGamesWon = playerRanking?.games_won || 0;
              const realStreak = playerRanking?.win_streak || 0;
              const winRate =
                realGamesPlayed > 0 ? Math.round((realGamesWon / realGamesPlayed) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/5 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-3"
                >
                  {/* Player header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-lg font-black text-white/60">{i + 1}</span>
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-xs font-bold">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="h-full w-full object-cover" />
                        ) : (
                          p.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight text-white">{p.name}</p>
                        <p className={`text-[10px] font-bold ${info.color}`}>
                          {info.emoji} {info.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-yellow-500">{scores[p.id] || 0}</span>
                  </div>
                  {/* Real stats */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-1.5">
                      <p className="text-[10px] text-white/60">Partidas</p>
                      <p className="text-xs font-bold text-white">{realGamesPlayed}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-1.5">
                      <p className="text-[10px] text-white/60">Victorias</p>
                      <p className="text-xs font-bold text-emerald-400">{realGamesWon}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-1.5">
                      <p className="text-[10px] text-white/60">Racha</p>
                      <p className="text-xs font-bold text-orange-400">🔥{realStreak}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-1.5">
                      <p className="text-[10px] text-white/60">Win%</p>
                      <p
                        className={`text-xs font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {winRate}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
