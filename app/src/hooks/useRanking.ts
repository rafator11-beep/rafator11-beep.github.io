import { useState, useEffect, useCallback } from 'react';
import { safeLower } from '@/utils/safeText';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { loadLocalRankings, upsertLocalRanking, PlayerRanking } from '@/utils/localRanking';
import { TAB_MAPPING, TabId, GameMode } from '@/types/game';
import { useAuth } from '@/contexts/AuthContext';
import { recordPremiumMatch } from '@/lib/premiumProgression';

export interface PlayerStats {
  user_id: string;
  name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  fiesta_games_played: number;
  fiesta_games_won: number;
  juego_games_played: number;
  juego_games_won: number;
  poker_chips_won: number;
  poker_games_played: number;
  megamix_games_played: number;
  megamix_games_won: number;
  clasico_games_played: number;
  clasico_games_won: number;
  picante_games_played: number;
  picante_games_won: number;
  parchis_games_played: number;
  parchis_games_won: number;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  poker_xp: number;
  poker_level: number;
  parchis_xp: number;
  parchis_level: number;
  unlocked_items: string[];
  equipped_items?: { avatar?: string; ficha?: string; carta?: string };
  updated_at: string;
}

export type BrutalMeta = {
  legendaryDrops?: number;
  chaosEvents?: number;
  cursedEvents?: number;
  virusesReceived?: number;
};

function localToPlayerStats(lr: PlayerRanking): PlayerStats {
  return {
    user_id: lr.id,
    name: lr.player_name,
    avatar_url: lr.avatar_url,
    games_played: lr.games_played,
    games_won: lr.games_won,
    fiesta_games_played: lr.games_played,
    fiesta_games_won: lr.games_won,
    juego_games_played: (lr.football_games || 0) + (lr.culture_games || 0),
    juego_games_won: (lr.football_wins || 0) + (lr.culture_wins || 0),
    poker_chips_won: lr.poker_score || 0,
    poker_games_played: lr.poker_games || 0,
    megamix_games_played: lr.megamix_games || 0,
    megamix_games_won: lr.megamix_wins || 0,
    clasico_games_played: lr.clasico_games || 0,
    clasico_games_won: lr.clasico_wins || 0,
    picante_games_played: lr.picante_games || 0,
    picante_games_won: lr.picante_wins || 0,
    parchis_games_played: lr.parchis_games || 0,
    parchis_games_won: lr.parchis_wins || 0,
    coins: lr.coins || 0,
    gems: lr.gems || 0,
    level: lr.level || 1,
    xp: lr.xp || 0,
    poker_xp: lr.poker_xp || 0,
    poker_level: lr.poker_level || 1,
    parchis_xp: lr.parchis_xp || 0,
    parchis_level: lr.parchis_level || 1,
    unlocked_items: lr.unlocked_items || [],
    equipped_items: lr.equipped_items || {},
    updated_at: lr.updated_at,
  };
}

function resolveCloudIdentity(
  playerName: string,
  currentUsername?: string | null,
  currentUserId?: string | null,
) {
  const normalizedPlayer = safeLower(playerName);
  const normalizedCurrent = safeLower(currentUsername || localStorage.getItem('fiesta_player_name') || '');
  const isRegisteredCurrentUser = !!currentUserId && !!normalizedCurrent && normalizedPlayer === normalizedCurrent;

  return {
    shouldSyncToCloud: isRegisteredCurrentUser,
    actorUserId: isRegisteredCurrentUser ? currentUserId : null,
    canonicalName: isRegisteredCurrentUser ? (currentUsername || playerName) : playerName,
  };
}

export function useRanking() {
  const { user, profile } = useAuth();
  const [rankings, setRankings] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);

      const localData = loadLocalRankings();
      const localStats = localData.map(localToPlayerStats);

      if (!isSupabaseConfigured) {
        setRankings(localStats);
        setError(null);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('user_stats')
          .select('*')
          .limit(150);

        if (fetchError) throw fetchError;

        const cloudStats = ((data as any[]) || []).map((row) => ({
          user_id: row.user_id || row.id || row.profile_id || row.player_name || crypto.randomUUID(),
          name: row.player_name || row.username || 'Jugador',
          avatar_url: row.avatar_url || null,
          games_played: row.games_played || 0,
          games_won: row.total_wins || row.games_won || 0,
          fiesta_games_played: row.fiesta_games_played || row.games_played || 0,
          fiesta_games_won: row.fiesta_games_won || row.total_wins || row.games_won || 0,
          juego_games_played: row.juego_games_played || 0,
          juego_games_won: row.juego_games_won || 0,
          poker_chips_won: row.poker_score || row.poker_chips_won || 0,
          poker_games_played: row.poker_games_played || row.poker_games || 0,
          megamix_games_played: row.megamix_games_played || row.megamix_games || 0,
          megamix_games_won: row.megamix_games_won || row.megamix_wins || 0,
          clasico_games_played: row.clasico_games_played || row.clasico_games || 0,
          clasico_games_won: row.clasico_games_won || row.clasico_wins || 0,
          picante_games_played: row.picante_games_played || row.picante_games || 0,
          picante_games_won: row.picante_games_won || row.picante_wins || 0,
          parchis_games_played: row.parchis_games_played || row.parchis_games || 0,
          parchis_games_won: row.parchis_games_won || row.parchis_wins || 0,
          coins: row.coins || 0,
          gems: row.gems || 0,
          level: row.level || 1,
          xp: row.total_xp || row.xp || row.total_score || 0,
          poker_xp: row.poker_xp || 0,
          poker_level: row.poker_level || 1,
          parchis_xp: row.parchis_xp || 0,
          parchis_level: row.parchis_level || 1,
          unlocked_items: row.unlocked_items || [],
          equipped_items: row.equipped_items || {},
          updated_at: row.updated_at || new Date().toISOString(),
        })) as PlayerStats[];

        const merged = [...cloudStats];
        for (const ls of localStats) {
          const idx = merged.findIndex((cs) => safeLower(cs.name) === safeLower(ls.name));
          if (idx === -1) {
            merged.push(ls);
            continue;
          }

          const cloud = merged[idx];
          merged[idx] = {
            ...cloud,
            games_played: Math.max(cloud.games_played, ls.games_played),
            games_won: Math.max(cloud.games_won, ls.games_won),
            xp: Math.max(cloud.xp, ls.xp),
            coins: Math.max(cloud.coins, ls.coins),
            gems: Math.max(cloud.gems, ls.gems),
            poker_xp: Math.max(cloud.poker_xp, ls.poker_xp),
            parchis_xp: Math.max(cloud.parchis_xp, ls.parchis_xp),
            level: Math.max(cloud.level, ls.level),
          };
        }

        merged.sort((a, b) => (b.games_won * 1000 + b.xp) - (a.games_won * 1000 + a.xp));
        setRankings(merged);
        setError(null);
      } catch (err) {
        console.warn('Supabase fetch failed, using local rankings:', err);
        setRankings(localStats);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('user_stats_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, () => fetchRankings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchRankings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRankings]);

  const updatePlayerScore = async (
    playerName: string,
    scoreToAdd: number,
    won: boolean = false,
    avatarUrl?: string,
    city?: string,
    gameMode: string = 'megamix',
    brutalMeta?: BrutalMeta,
    gameId?: string
  ) => {
    try {
      const localRows = upsertLocalRanking({
        playerName,
        scoreToAdd,
        won,
        avatarUrl,
        city,
        gameMode,
        brutalMeta,
      });

      const updatedLocal = localRows.find((row) => safeLower(row.player_name) === safeLower(playerName));
      const premiumSync = updatedLocal
        ? recordPremiumMatch({
            stats: {
              id: updatedLocal.id,
              player_name: updatedLocal.player_name,
              avatar_url: updatedLocal.avatar_url,
              games_played: updatedLocal.games_played,
              games_won: updatedLocal.games_won,
              total_score: updatedLocal.total_score,
              xp: updatedLocal.xp,
              level: updatedLocal.level,
              poker_wins: updatedLocal.poker_wins,
              poker_games: updatedLocal.poker_games,
              megamix_wins: updatedLocal.megamix_wins,
              megamix_games: updatedLocal.megamix_games,
              clasico_wins: updatedLocal.clasico_wins,
              clasico_games: updatedLocal.clasico_games,
              picante_wins: updatedLocal.picante_wins,
              picante_games: updatedLocal.picante_games,
              parchis_wins: updatedLocal.parchis_wins,
              parchis_games: updatedLocal.parchis_games,
              football_wins: updatedLocal.football_wins,
              football_games: updatedLocal.football_games,
              culture_wins: updatedLocal.culture_wins,
              culture_games: updatedLocal.culture_games,
              win_streak: updatedLocal.win_streak,
              updated_at: updatedLocal.updated_at,
            },
            won,
            scoreToAdd,
            gameMode,
          })
        : null;

      if (isSupabaseConfigured) {
        const actGameId = gameId || `local-${Date.now()}-${Math.random()}`;
        const tabId: TabId = TAB_MAPPING.fiesta.includes(gameMode as GameMode) ? 'fiesta' : 'juego';
        const identity = resolveCloudIdentity(playerName, profile?.username, user?.id || null);

        if (identity.shouldSyncToCloud) {
          try {
            const { error: insertError } = await supabase.rpc('register_guest_event', {
              p_game_id: actGameId,
              p_event_type: 'game_finish',
              p_actor_user_id: identity.actorUserId,
              p_tab_id: tabId,
              p_mode_id: gameMode,
              p_play_mode: 'local',
              p_score: scoreToAdd,
              p_is_winner: !!won,
              p_player_name: identity.canonicalName,
              p_avatar_url: avatarUrl || profile?.avatar_url || null,
            });

            if (insertError) {
              console.warn('RPC register_guest_event error (local save was successful):', insertError.message);
            }
          } catch (rpcErr) {
            console.warn('Supabase RPC failed (local save was successful):', rpcErr);
          }

          if (premiumSync?.cloudPayload && user?.id) {
            try {
              await supabase
                .from('profiles')
                .update({ badges: premiumSync.cloudPayload, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            } catch (premiumErr) {
              console.warn('Premium Hall sync skipped:', premiumErr);
            }
          }
        }
      }

      await fetchRankings();
    } catch (err) {
      console.error('Error updating player score:', err);
    }
  };

  const updatePlayerCity = async (_playerName: string, _city: string) => {
    // Reserved for future cloud sync.
  };

  const updateMultiplePlayers = async (
    players: Array<{ name: string; score: number; won: boolean; avatarUrl?: string; city?: string; gameMode?: string; brutalMeta?: BrutalMeta; gameId?: string }>
  ) => {
    try {
      for (const player of players) {
        await updatePlayerScore(player.name, player.score, player.won, player.avatarUrl, player.city, player.gameMode, player.brutalMeta, player.gameId);
      }
    } catch (err) {
      console.error('Error updating multiple players:', err);
    }
  };

  const getPlayerRank = (playerName: string): number => {
    const index = rankings.findIndex(r => safeLower(r.name) === safeLower(playerName));
    return index === -1 ? -1 : index + 1;
  };

  const getTopPlayers = (count: number = 10): PlayerStats[] => {
    return rankings.slice(0, count);
  };

  return {
    rankings,
    loading,
    error,
    fetchRankings,
    updatePlayerScore,
    updatePlayerCity,
    updateMultiplePlayers,
    getPlayerRank,
    getTopPlayers,
  };
}
