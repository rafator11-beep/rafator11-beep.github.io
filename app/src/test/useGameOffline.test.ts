import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Supabase "configurado" pero caído: toda llamada falla como sin DNS.
const { fromSpy } = vi.hoisted(() => ({ fromSpy: vi.fn(() => {
  const fail = () => Promise.reject(new TypeError('Failed to fetch'));
  const chain: Record<string, unknown> = {};
  for (const m of ['insert', 'select', 'eq', 'order', 'delete', 'update', 'maybeSingle']) {
    chain[m] = () => chain;
  }
  chain.single = fail;
  chain.then = (res: unknown, rej: (e: unknown) => unknown) => fail().then(res as never, rej);
  return chain;
}) }));

vi.mock('@/integrations/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: fromSpy,
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  },
}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { info: vi.fn(), error: vi.fn(), success: vi.fn() }) }));

import { useGame, isLocalGame } from '@/hooks/useGame';

describe('useGame con Supabase caído', () => {
  beforeEach(() => {
    localStorage.clear();
    fromSpy.mockClear();
  });

  it('la partida cae a local y se pueden añadir jugadores y equipos sin servidor', async () => {
    const { result } = renderHook(() => useGame(null));
    let gameId = '';
    await act(async () => {
      gameId = (await result.current.createGame('megamix')).id;
    });
    expect(isLocalGame(gameId)).toBe(true);

    const callsAfterCreate = fromSpy.mock.calls.length;
    await act(async () => {
      await result.current.addPlayer('Ana');
    });
    await act(async () => {
      await result.current.addPlayer('Luis');
    });
    await act(async () => {
      await result.current.createTeam('Rojos', '#f00');
    });

    expect(result.current.players.map((p) => p.name)).toEqual(['Ana', 'Luis']);
    expect(result.current.teams.map((t) => t.name)).toEqual(['Rojos']);
    // Nada de eso ha intentado ir a Supabase.
    expect(fromSpy.mock.calls.length).toBe(callsAfterCreate);
  });

  it('otro componente con el mismo id también sabe que es local', async () => {
    const first = renderHook(() => useGame(null));
    let gameId = '';
    await act(async () => {
      gameId = (await first.result.current.createGame('megamix')).id;
    });
    fromSpy.mockClear();
    const second = renderHook(() => useGame(gameId));
    await act(async () => {});
    expect(fromSpy).not.toHaveBeenCalled();
    expect(second.result.current.loading).toBe(false);
  });
});
