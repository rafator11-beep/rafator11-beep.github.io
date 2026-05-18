import { useState, useCallback } from 'react';
import { Player } from '@/types/game';
import { GameEvent } from './useGameMemory';

export interface TorneoMatch {
  player1: Player;
  player2: Player;
  retoText: string;
  announcement: string | null;
}

export interface TorneoScore {
  playerId: string;
  wins: number;
  losses: number;
}

const SUPABASE_URL = 'https://atswsltnjjsokouvfbut.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3dzbHRuampzb2tvdXZmYnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc4OTIsImV4cCI6MjA4NTk4Mzg5Mn0.nHTssvN_MarKXhO0geAsOikj9qUX0CdixQQ-e4r8nDw';

async function fetchTorneoAnnouncement(p1: string, p2: string, reto: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ mode: 'torneo', player1: p1, player2: p2, retoText: reto }),
    });
    const data = await res.json();
    return data.announcement || null;
  } catch { return null; }
}

interface PlayerStats {
  nombre: string;
  tragos_bebidos: number;
  retos_completados: number;
  retos_fallados: number;
  veces_votado: number;
  torneos_ganados: number;
  torneos_perdidos: number;
  veces_prefirio_beber: number;
}

async function fetchRoundAnalysis(playerStats: PlayerStats[], round: number): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ mode: 'analysis', playerStats, round }),
    });
    const data = await res.json();
    return data.comment || null;
  } catch { return null; }
}

export function useTorneoManager(players: Player[]) {
  const [scores, setScores] = useState<Record<string, TorneoScore>>(() =>
    Object.fromEntries(players.map(p => [p.id, { playerId: p.id, wins: 0, losses: 0 }]))
  );
  const [currentMatch, setCurrentMatch] = useState<TorneoMatch | null>(null);
  const [roundComment, setRoundComment] = useState<string | null>(null);
  const [roundCommentVisible, setRoundCommentVisible] = useState(false);

  // Pick 2 players for a torneo match — prefer those with most reto activity
  const buildMatch = useCallback(async (
    events: GameEvent[],
    retoPool: string[]
  ): Promise<TorneoMatch | null> => {
    if (players.length < 2 || retoPool.length === 0) return null;

    // Count reto activity per player
    const activity: Record<string, number> = {};
    events.forEach(e => {
      if (e.type === 'reto_done' || e.type === 'reto_fail') {
        activity[e.playerId] = (activity[e.playerId] || 0) + 1;
      }
    });

    // Sort players by activity, pick top 2 (shuffle if tied)
    const sorted = [...players].sort((a, b) => (activity[b.id] || 0) - (activity[a.id] || 0));
    // If no activity yet, pick 2 random
    const p1 = sorted[0];
    const p2 = sorted[1] ?? sorted[0];

    const reto = retoPool[Math.floor(Math.random() * retoPool.length)];

    // Fetch AI announcement in background
    const announcement = await fetchTorneoAnnouncement(p1.name, p2.name, reto);

    return { player1: p1, player2: p2, retoText: reto, announcement };
  }, [players]);

  const recordWin = useCallback((winnerId: string, loserId: string) => {
    setScores(prev => ({
      ...prev,
      [winnerId]: { ...prev[winnerId], wins: (prev[winnerId]?.wins || 0) + 1 },
      [loserId]: { ...prev[loserId], losses: (prev[loserId]?.losses || 0) + 1 },
    }));
    setCurrentMatch(null);
  }, []);

  const triggerRoundAnalysis = useCallback(async (round: number, roundEvents: GameEvent[]) => {
    if (roundEvents.length === 0) return;

    // Build structured per-player stats JSON
    const statsMap: Record<string, PlayerStats> = {};
    for (const p of players) {
      statsMap[p.name] = {
        nombre: p.name,
        tragos_bebidos: 0,
        retos_completados: 0,
        retos_fallados: 0,
        veces_votado: 0,
        torneos_ganados: 0,
        torneos_perdidos: 0,
        veces_prefirio_beber: 0,
      };
    }
    for (const e of roundEvents) {
      const s = statsMap[e.playerName];
      if (!s) continue;
      switch (e.type) {
        case 'yo_nunca_yes':    s.tragos_bebidos++; break;
        case 'reto_done':       s.retos_completados++; break;
        case 'reto_fail':       s.retos_fallados++; s.tragos_bebidos += 3; break;
        case 'voted':           s.veces_votado++; break;
        case 'torneo_win':      s.torneos_ganados++; break;
        case 'verdad_drink':    s.veces_prefirio_beber++; s.tragos_bebidos++; break;
        case 'duelo_lose':      s.torneos_perdidos++; break;
      }
    }

    const playerStats = Object.values(statsMap).filter(s =>
      s.tragos_bebidos + s.retos_completados + s.retos_fallados +
      s.veces_votado + s.torneos_ganados + s.torneos_perdidos + s.veces_prefirio_beber > 0
    );
    if (playerStats.length === 0) return;

    const comment = await fetchRoundAnalysis(playerStats, round);
    if (comment) {
      setRoundComment(comment);
      setRoundCommentVisible(true);
      setTimeout(() => setRoundCommentVisible(false), 5000);
    }
  }, [players]);

  const getStandings = useCallback(() => {
    return [...players]
      .map(p => ({ ...p, ...scores[p.id] }))
      .sort((a, b) => (b.wins || 0) - (a.wins || 0));
  }, [players, scores]);

  return {
    scores,
    currentMatch,
    setCurrentMatch,
    buildMatch,
    recordWin,
    triggerRoundAnalysis,
    roundComment,
    roundCommentVisible,
    setRoundCommentVisible,
    getStandings,
  };
}
