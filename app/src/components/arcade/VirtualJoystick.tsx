import React, { useRef, useState, useEffect } from 'react';
import { globalInput } from './engine/InputManager';

export function VirtualJoystick() {
  const [active, setActive] = useState(false);
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  const MAX_RADIUS = 50;
  const joysticID = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Solo activamos un joystick
    if (joysticID.current !== null) return;
    
    // Ignoramos la mitad derecha (eso sería botón de salto/acción)
    const touch = Array.from(e.changedTouches).find(t => t.clientX < window.innerWidth / 2);
    if (!touch) return;

    joysticID.current = touch.identifier;
    setActive(true);
    setBasePos({ x: touch.clientX, y: touch.clientY });
    setStickPos({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (joysticID.current === null) return;
    const touch = Array.from(e.changedTouches).find(t => t.identifier === joysticID.current);
    if (!touch) return;

    const dx = touch.clientX - basePos.x;
    const dy = touch.clientY - basePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Limit radius
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, MAX_RADIUS);
    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });
    
    // Normalize to [-1, 1] for input manager
    globalInput.setJoystickVector({ x: stickX / MAX_RADIUS, y: stickY / MAX_RADIUS });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (joysticID.current === null) return;
    const touch = Array.from(e.changedTouches).find(t => t.identifier === joysticID.current);
    if (touch) {
      joysticID.current = null;
      setActive(false);
      globalInput.setJoystickVector({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    const p = document.getElementById('joystick-zone');
    if(p) {
        // Mantenemos scroll off en zona arcade
        p.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
  }, []);

  return (
    <div 
      id="joystick-zone"
      className="absolute top-0 left-0 w-1/2 h-full z-50 touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {active && (
        <div 
          className="absolute rounded-full border-2 border-cyan-400 bg-cyan-900/30 flex items-center justify-center pointer-events-none"
          style={{ 
            width: MAX_RADIUS * 2, 
            height: MAX_RADIUS * 2, 
            left: basePos.x - MAX_RADIUS, 
            top: basePos.y - MAX_RADIUS,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="w-8 h-8 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`
            }}
          />
        </div>
      )}

      {/* Action Button Area (Ignora el joystick per se, manda directo al globalInput) */}
      <div 
        className="absolute top-0 right-[-100%] w-full h-full z-50 touch-none flex items-end justify-end p-8"
        onTouchStart={() => globalInput.setTouchAction(true)}
        onTouchEnd={() => globalInput.setTouchAction(false)}
      >
        <div className="w-16 h-16 rounded-full border-2 border-pink-500 bg-pink-900/40 flex items-center justify-center backdrop-blur-md active:scale-90 active:bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-transform">
          <span className="text-white/80 font-bold font-arcade tracking-wider">A</span>
        </div>
      </div>
    </div>
  );
}
