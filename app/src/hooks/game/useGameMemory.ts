import { useState, useCallback, useRef, useMemo } from 'react';
import { Player } from '@/types/game';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

// ─── Event Types ────────────────────────────────────────────────────────────
export type GameEventType =
  | 'yo_nunca_yes'
  | 'voted'
  | 'reto_fail'
  | 'reto_done'
  | 'verdad_drink'
  | 'verdad_told'
  | 'duelo_win'
  | 'duelo_lose'
  | 'torneo_win'
  | 'torneo_lose'
  | 'drink';

export interface GameEvent {
  id: string;
  type: GameEventType;
  playerName: string;
  playerId: string;
  cardText: string;
  round: number;
  timestamp: number;
}

// ─── Player Stats (Memoria acumulada por jugador) ───────────────────────────
export interface PlayerStats {
  playerId: string;
  playerName: string;
  tragos: number;
  retos_completados: number;
  retos_fallados: number;
  retos_ids: string[];        // cardText de cada reto (para evitar repetir salseo)
  yo_nunca_count: number;
  votos_recibidos: number;
  duelos_ganados: number;
  duelos_perdidos: number;
  torneos_ganados: number;
  torneos_perdidos: number;
}

// ─── Edge Function Caller ───────────────────────────────────────────────────
async function callGenerateCard(
  events: GameEvent[],
  playerNames: string[],
  mode: string = 'card'
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: { events, players: playerNames, mode },
    });
    if (error) return null;
    return (data?.card as string) || null;
  } catch {
    return null;
  }
}

// ─── Enrich Challenge with AI (Salseo Middleware) ───────────────────────────
export async function enrichChallengeWithAI(
  challengeText: string,
  involvedPlayers: Player[],
  allStats: Record<string, PlayerStats>
): Promise<string> {
  if (!isSupabaseConfigured) return challengeText;

  // Build concise stats summary for the prompt
  const statsSummary = involvedPlayers.map(p => {
    const s = allStats[p.id];
    if (!s) return `${p.name}: sin datos aún`;
    const parts: string[] = [];
    if (s.tragos > 0) parts.push(`${s.tragos} tragos bebidos`);
    if (s.retos_fallados > 0) parts.push(`${s.retos_fallados} retos fallados`);
    if (s.retos_completados > 0) parts.push(`${s.retos_completados} retos completados`);
    if (s.yo_nunca_count > 0) parts.push(`dijo "sí" en ${s.yo_nunca_count} Yo Nuncas`);
    if (s.votos_recibidos > 0) parts.push(`votado ${s.votos_recibidos} veces`);
    if (s.duelos_perdidos > 0) parts.push(`${s.duelos_perdidos} duelos perdidos`);
    if (s.torneos_ganados > 0) parts.push(`${s.torneos_ganados} torneos ganados`);
    return `${p.name}: ${parts.length > 0 ? parts.join(', ') : 'recién empezando'}`;
  }).join(' | ');

  try {
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: {
        mode: 'enrich',
        originalChallenge: challengeText,
        playerStats: statsSummary,
        playerNames: involvedPlayers.map(p => p.name),
      },
    });
    if (error || !data?.enriched) return challengeText;
    return data.enriched as string;
  } catch {
    return challengeText; // Fallo silencioso — devuelve el texto original
  }
}

// ─── Hook Principal ─────────────────────────────────────────────────────────
export function useGameMemory(players: Player[]) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [aiQueue, setAiQueue] = useState<string[]>([]);
  const isGeneratingRef = useRef(false);
  const eventCountRef = useRef(0);

  // ── Player Stats acumulados (Tarea 1) ───────────────────────────────────
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>(() =>
    Object.fromEntries(players.map(p => [p.id, {
      playerId: p.id,
      playerName: p.name,
      tragos: 0,
      retos_completados: 0,
      retos_fallados: 0,
      retos_ids: [],
      yo_nunca_count: 0,
      votos_recibidos: 0,
      duelos_ganados: 0,
      duelos_perdidos: 0,
      torneos_ganados: 0,
      torneos_perdidos: 0,
    }]))
  );

  // ── Actualizar stats según tipo de evento ────────────────────────────────
  const updateStats = useCallback((type: GameEventType, playerId: string, cardText: string) => {
    setPlayerStats(prev => {
      const s = prev[playerId];
      if (!s) return prev;
      const updated = { ...s };

      switch (type) {
        case 'reto_done':
          updated.retos_completados += 1;
          updated.retos_ids = [...updated.retos_ids, cardText].slice(-50);
          break;
        case 'reto_fail':
          updated.retos_fallados += 1;
          updated.tragos += 3; // penalización estándar
          updated.retos_ids = [...updated.retos_ids, cardText].slice(-50);
          break;
        case 'yo_nunca_yes':
          updated.yo_nunca_count += 1;
          updated.tragos += 1;
          break;
        case 'voted':
          updated.votos_recibidos += 1;
          break;
        case 'duelo_win':
          updated.duelos_ganados += 1;
          break;
        case 'duelo_lose':
          updated.duelos_perdidos += 1;
          updated.tragos += 2;
          break;
        case 'torneo_win':
          updated.torneos_ganados += 1;
          break;
        case 'torneo_lose':
          updated.torneos_perdidos += 1;
          updated.tragos += 3;
          break;
        case 'verdad_drink':
        case 'drink':
          updated.tragos += 1;
          break;
        default:
          break;
      }

      return { ...prev, [playerId]: updated };
    });
  }, []);

  // ── Añadir un evento + actualizar stats ──────────────────────────────────
  const addEvent = useCallback((
    type: GameEventType,
    player: Player,
    cardText: string,
    round: number
  ) => {
    eventCountRef.current += 1;

    // 1. Actualizar stats del jugador
    updateStats(type, player.id, cardText);

    // 2. Crear evento
    const newEvent: GameEvent = {
      id: Math.random().toString(36).slice(2),
      type,
      playerName: player.name,
      playerId: player.id,
      cardText,
      round,
      timestamp: Date.now(),
    };

    setEvents(prev => {
      const updated = [...prev, newEvent].slice(-50); // Guardamos más historial para la IA

      // Generate AI card every 5 meaningful events
      if (eventCountRef.current >= 3 && eventCountRef.current % 5 === 0 && !isGeneratingRef.current) {
        isGeneratingRef.current = true;
        const names = players.map(p => p.name);
        callGenerateCard(updated, names).then(card => {
          if (card) setAiQueue(q => [...q, card]);
          isGeneratingRef.current = false;
        });
      }

      return updated;
    });
  }, [players, updateStats]);

  // ── Batch events (e.g. multiple yo nunca) ────────────────────────────────
  const addEvents = useCallback((
    type: GameEventType,
    playerIds: string[],
    cardText: string,
    round: number
  ) => {
    const playersInvolved = players.filter(p => playerIds.includes(p.id));
    playersInvolved.forEach(p => addEvent(type, p, cardText, round));
  }, [players, addEvent]);

  // ── Track drinks explicitly ──────────────────────────────────────────────
  const trackDrink = useCallback((playerId: string, amount: number = 1) => {
    setPlayerStats(prev => {
      const s = prev[playerId];
      if (!s) return prev;
      return { ...prev, [playerId]: { ...s, tragos: s.tragos + amount } };
    });
  }, []);

  // ── AI card queue ────────────────────────────────────────────────────────
  const hasAiCard = aiQueue.length > 0;
  const peekAiCard = aiQueue[0] ?? null;

  const consumeAiCard = useCallback(() => {
    setAiQueue(prev => prev.slice(1));
  }, []);

  // ── Serialized memory for AI calls ──────────────────────────────────────
  const getMemorySummary = useCallback((): string[] => {
    return events.map(e => {
      switch (e.type) {
        case 'yo_nunca_yes': return `${e.playerName} bebió en yo nunca ("${e.cardText.slice(0, 40)}")`;
        case 'reto_done': return `${e.playerName} completó un reto`;
        case 'reto_fail': return `${e.playerName} FALLÓ un reto y bebió 3`;
        case 'voted': return `${e.playerName} fue el más votado`;
        case 'torneo_win': return `${e.playerName} ganó un torneo`;
        case 'torneo_lose': return `${e.playerName} perdió un torneo`;
        case 'duelo_win': return `${e.playerName} ganó un duelo`;
        case 'duelo_lose': return `${e.playerName} perdió un duelo`;
        case 'drink': return `${e.playerName} bebió`;
        default: return null;
      }
    }).filter(Boolean) as string[];
  }, [events]);

  return {
    events,
    playerStats,
    addEvent,
    addEvents,
    trackDrink,
    hasAiCard,
    peekAiCard,
    consumeAiCard,
    getMemorySummary,
    enrichChallengeWithAI,
  };
}
