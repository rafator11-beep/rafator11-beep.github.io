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

async function fetchRoundAnalysis(players: string[], round: number, summary: string[]): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ mode: 'analysis', players, round, roundSummary: summary }),
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
    const summary = roundEvents.map(e => {
      switch (e.type) {
        case 'yo_nunca_yes': return `${e.playerName} bebió en yo nunca`;
        case 'reto_done': return `${e.playerName} completó su reto`;
        case 'reto_fail': return `${e.playerName} no completó su reto`;
        case 'voted': return `${e.playerName} fue el más votado`;
        case 'torneo_win': return `${e.playerName} ganó el torneo`;
        default: return null;
      }
    }).filter(Boolean) as string[];

    if (summary.length === 0) return;
    const comment = await fetchRoundAnalysis(players.map(p => p.name), round, summary);
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
