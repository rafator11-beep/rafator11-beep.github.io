import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/game';

export type GameEventType =
  | 'yo_nunca_yes'
  | 'voted'
  | 'reto_fail'
  | 'reto_done'
  | 'verdad_drink'
  | 'verdad_told'
  | 'duelo_win'
  | 'duelo_lose';

export interface GameEvent {
  id: string;
  type: GameEventType;
  playerName: string;
  playerId: string;
  cardText: string;
  round: number;
}

const SUPABASE_URL = 'https://atswsltnjjsokouvfbut.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3dzbHRuampzb2tvdXZmYnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc4OTIsImV4cCI6MjA4NTk4Mzg5Mn0.nHTssvN_MarKXhO0geAsOikj9qUX0CdixQQ-e4r8nDw';

async function callGenerateCard(events: GameEvent[], playerNames: string[]): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ events, players: playerNames }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.card as string) || null;
  } catch {
    return null;
  }
}

export function useGameMemory(players: Player[]) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [aiQueue, setAiQueue] = useState<string[]>([]);
  const isGeneratingRef = useRef(false);
  const eventCountRef = useRef(0);

  const addEvent = useCallback((
    type: GameEventType,
    player: Player,
    cardText: string,
    round: number
  ) => {
    eventCountRef.current += 1;
    const newEvent: GameEvent = {
      id: Math.random().toString(36).slice(2),
      type,
      playerName: player.name,
      playerId: player.id,
      cardText,
      round,
    };

    setEvents(prev => {
      const updated = [...prev, newEvent].slice(-30);

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
  }, [players]);

  // Adds multiple events at once (e.g. several players said yes to yo nunca)
  const addEvents = useCallback((
    type: GameEventType,
    playerIds: string[],
    cardText: string,
    round: number
  ) => {
    const playersInvolved = players.filter(p => playerIds.includes(p.id));
    playersInvolved.forEach(p => addEvent(type, p, cardText, round));
  }, [players, addEvent]);

  const hasAiCard = aiQueue.length > 0;
  const peekAiCard = aiQueue[0] ?? null;

  const consumeAiCard = useCallback(() => {
    setAiQueue(prev => prev.slice(1));
  }, []);

  return { events, addEvent, addEvents, hasAiCard, peekAiCard, consumeAiCard };
}
