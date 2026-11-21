import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getTurnInfo } from '@/utils/megamixTurn';
import { TurnBanner } from '@/components/game/party/TurnBanner';

describe('getTurnInfo', () => {
  const base = { currentPlayerName: 'Ana', captainName: 'Luis', cardNumber: 7 };

  it('la individual es del jugador de turno', () => {
    expect(getTurnInfo({ ...base, rawCard: '🎯 RETO: {player}, baila' })).toEqual({
      kind: 'individual',
      name: 'Ana',
      cardNumber: 7,
    });
  });

  it('la individual lo es aunque solo lleve {player} (sin sustituir)', () => {
    expect(getTurnInfo({ ...base, rawCard: '{player} imita a un famoso' })?.kind).toBe('individual');
  });

  it('la grupal la abre siempre el capitán', () => {
    expect(getTurnInfo({ ...base, rawCard: '🙈 Yo nunca he mentido' })).toMatchObject({
      kind: 'grupal',
      name: 'Luis',
    });
  });

  it('sin capitán elegido, la abre el de turno', () => {
    expect(
      getTurnInfo({ ...base, captainName: undefined, rawCard: '🙈 Yo nunca he mentido' })?.name
    ).toBe('Ana');
  });

  it('los eventos no llevan aviso', () => {
    expect(getTurnInfo({ ...base, rawCard: 'TRIGGER:IMPOSTOR' })).toBeNull();
  });
});

describe('TurnBanner', () => {
  afterEach(() => vi.useRealTimers());

  it('si el de turno no tiene el móvil conectado, a los segundos se lo lee el capitán', () => {
    vi.useFakeTimers();
    render(
      <TurnBanner
        turn={{ kind: 'individual', name: 'Ana', cardNumber: 1 }}
        connected={false}
        captainName="Luis"
      />
    );
    expect(screen.queryByText(/Luis, léesela/)).toBeNull();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText(/Luis, léesela en voz alta/)).toBeTruthy();
  });

  it('si está conectado le dice que mire el móvil', () => {
    render(
      <TurnBanner turn={{ kind: 'individual', name: 'Ana', cardNumber: 1 }} connected captainName="Luis" />
    );
    expect(screen.getByText(/mira tu móvil/)).toBeTruthy();
  });

  it('en la grupal muestra quién abre', () => {
    render(<TurnBanner turn={{ kind: 'grupal', name: 'Luis', cardNumber: 2 }} connected={false} captainName="Luis" />);
    expect(screen.getByText('Luis')).toBeTruthy();
    expect(screen.getByText(/capitán/)).toBeTruthy();
  });
});
