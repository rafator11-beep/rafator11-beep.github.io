import { useState, useCallback } from 'react';
import { Player } from '@/types/game';
import { GameEvent, PlayerStats, enrichChallengeWithAI } from './useGameMemory';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { 
  geminiGenerateTorneoAnnouncement, 
  geminiGenerateRoundAnalysis, 
  isGeminiConfigured 
} from '@/services/geminiClient';

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

// ─── Edge Function / Gemini wrappers ─────────────────────────────────────────

async function fetchTorneoAnnouncement(
  p1: string,
  p2: string,
  reto: string,
  memorySummary: string[]
): Promise<string | null> {
  // 1. Intentar con Gemini Directo primero
  if (isGeminiConfigured()) {
    try {
      const announcement = await geminiGenerateTorneoAnnouncement(p1, p2, reto, memorySummary);
      if (announcement) return announcement;
    } catch (e) {
      console.warn("Gemini direct torneo announcement failed, trying fallback:", e);
    }
  }

  // 2. Fallback a Supabase
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: {
        mode: 'torneo',
        player1: p1,
        player2: p2,
        retoText: reto,
        memory: memorySummary.slice(-20), // últimos 20 eventos para contexto
      },
    });
    if (error) return null;
    return data?.announcement || null;
  } catch { return null; }
}

async function fetchRoundAnalysis(
  players: string[],
  round: number,
  summary: string[],
  playerStats: Record<string, PlayerStats>
): Promise<string | null> {
  // Build stats digest for the AI
  const statsDigest = Object.values(playerStats).map(s => {
    const parts: string[] = [];
    if (s.tragos > 0) parts.push(`${s.tragos}🍻`);
    if (s.retos_fallados > 0) parts.push(`${s.retos_fallados} fallos`);
    if (s.retos_completados > 0) parts.push(`${s.retos_completados} éxitos`);
    if (s.torneos_ganados > 0) parts.push(`${s.torneos_ganados}🏆`);
    return parts.length > 0 ? `${s.playerName}: ${parts.join(', ')}` : null;
  }).filter(Boolean) as string[];

  // 1. Intentar con Gemini Directo primero
  if (isGeminiConfigured()) {
    try {
      const comment = await geminiGenerateRoundAnalysis(players, round, summary, statsDigest);
      if (comment) return comment;
    } catch (e) {
      console.warn("Gemini direct round analysis failed, trying fallback:", e);
    }
  }

  // 2. Fallback a Supabase
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: {
        mode: 'analysis',
        players,
        round,
        roundSummary: summary,
        playerStatsDigest: statsDigest,
      },
    });
    if (error) return null;
    return data?.comment || null;
  } catch { return null; }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTorneoManager(players: Player[]) {
  const [scores, setScores] = useState<Record<string, TorneoScore>>(() =>
    Object.fromEntries(players.map(p => [p.id, { playerId: p.id, wins: 0, losses: 0 }]))
  );
  const [currentMatch, setCurrentMatch] = useState<TorneoMatch | null>(null);
  const [roundComment, setRoundComment] = useState<string | null>(null);
  const [roundCommentVisible, setRoundCommentVisible] = useState(false);

  // ── Build Match ─────────────────────────────────────────────────────────
  // Solo usa retos que sean explícitamente 1v1 (Tarea 3: filtro isDuel)
  const buildMatch = useCallback(async (
    events: GameEvent[],
    retoPool: string[],
    memorySummary: string[] = []
  ): Promise<TorneoMatch | null> => {
    if (players.length < 2 || retoPool.length === 0) return null;

    // Filtro Tarea 3: solo retos head-to-head (contienen "{player2}" o "vs")
    const duelRetos = retoPool.filter(r =>
      r.includes('{player2}') || r.toLowerCase().includes(' vs ')
    );
    const pool = duelRetos.length > 0 ? duelRetos : retoPool;

    // Pick 2 players — prefer those with most activity or least torneo wins
    const activity: Record<string, number> = {};
    events.forEach(e => {
      if (e.type === 'reto_done' || e.type === 'reto_fail' || e.type === 'torneo_win' || e.type === 'torneo_lose') {
        activity[e.playerId] = (activity[e.playerId] || 0) + 1;
      }
    });

    // Shuffle to add randomness, then sort by activity
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const sorted = shuffled.sort((a, b) => (activity[b.id] || 0) - (activity[a.id] || 0));
    const p1 = sorted[0];
    const p2 = sorted.find(p => p.id !== p1.id) || sorted[1];
    if (!p1 || !p2 || p1.id === p2.id) return null;

    const reto = pool[Math.floor(Math.random() * pool.length)];

    // Fetch AI announcement with memory context
    const announcement = await fetchTorneoAnnouncement(
      p1.name, p2.name, reto, memorySummary
    );

    return { player1: p1, player2: p2, retoText: reto, announcement };
  }, [players]);

  // ── Record Win ──────────────────────────────────────────────────────────
  const recordWin = useCallback((winnerId: string, loserId: string) => {
    setScores(prev => ({
      ...prev,
      [winnerId]: { ...prev[winnerId], wins: (prev[winnerId]?.wins || 0) + 1 },
      [loserId]: { ...prev[loserId], losses: (prev[loserId]?.losses || 0) + 1 },
    }));
    setCurrentMatch(null);
  }, []);

  // ── Round Analysis (with memory + stats) ────────────────────────────────
  const triggerRoundAnalysis = useCallback(async (
    round: number,
    roundEvents: GameEvent[],
    allStats: Record<string, PlayerStats>
  ) => {
    if (roundEvents.length === 0) return;
    const summary = roundEvents.map(e => {
      switch (e.type) {
        case 'yo_nunca_yes': return `${e.playerName} bebió en yo nunca`;
        case 'reto_done': return `${e.playerName} completó su reto`;
        case 'reto_fail': return `${e.playerName} no completó su reto`;
        case 'voted': return `${e.playerName} fue el más votado`;
        case 'torneo_win': return `${e.playerName} ganó el torneo`;
        case 'torneo_lose': return `${e.playerName} perdió el torneo`;
        case 'duelo_win': return `${e.playerName} ganó un duelo`;
        case 'duelo_lose': return `${e.playerName} perdió un duelo`;
        case 'drink': return `${e.playerName} bebió`;
        default: return null;
      }
    }).filter(Boolean) as string[];

    if (summary.length === 0) return;
    const comment = await fetchRoundAnalysis(
      players.map(p => p.name), round, summary, allStats
    );
    if (comment) {
      setRoundComment(comment);
      setRoundCommentVisible(true);
      setTimeout(() => setRoundCommentVisible(false), 6000);
    }
  }, [players]);

  // ── Standings ───────────────────────────────────────────────────────────
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
