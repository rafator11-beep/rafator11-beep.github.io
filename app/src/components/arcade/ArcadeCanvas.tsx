import React, { useEffect, useRef, useState } from 'react';
import { globalInput } from './engine/InputManager';
import { globalVFX } from './engine/VFXManager';
import { globalNetwork, PlayerState } from './engine/NetworkManager';
import { PhysicsEngine, AABB } from './engine/PhysicsEngine';
import { ArcadeMatchmaking } from './ArcadeMatchmaking';
import { VirtualJoystick } from './VirtualJoystick';

// Constantes Físicas
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const SPEED = 5;

export function ArcadeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inLobby, setInLobby] = useState(true);
  
  // Estado local independiente de React para evitar re-renders cada Frame
  const engineState = useRef({
    localPlayer: { x: 50, y: 300, vx: 0, vy: 0, width: 30, height: 30, health: 100 },
    remotePlayer: { x: 400, y: 300, vx: 0, vy: 0, width: 30, height: 30, health: 100 },
    platforms: [
      { x: 0, y: 400, width: 800, height: 50 },
      { x: 200, y: 250, width: 200, height: 20 }
    ],
    lastFrameTime: performance.now(),
  });

  // Bucle de inicialización del Engine P2P
  const handleConnected = (isHost: boolean) => {
    setInLobby(false);

    if (isHost) {
      engineState.current.localPlayer.x = 100;
      engineState.current.remotePlayer.x = 600;
    } else {
      engineState.current.localPlayer.x = 600;
      engineState.current.remotePlayer.x = 100;
    }

    // Configizar recepción de red
    globalNetwork.onStateSync((state: PlayerState) => {
      // Interpolación básica (SNAP en este caso para simplificar The Boilerplate)
      // Idealmente haríamos Vector2.Lerp()
      engineState.current.remotePlayer.x = state.x;
      engineState.current.remotePlayer.y = state.y;
      engineState.current.remotePlayer.vx = state.vx;
      engineState.current.remotePlayer.vy = state.vy;
    });

    globalNetwork.onGameEvent((eventType, data) => {
      if (eventType === 'DAMAGE') {
        globalVFX.triggerCameraShake(10);
        globalVFX.spawnExplosion(data.x, data.y, '#FF0055', 15);
        globalVFX.hitVibrate();
      }
    });

    // Iniciar render loop
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time: number) => {
    const deltaTime = (time - engineState.current.lastFrameTime) / 1000;
    engineState.current.lastFrameTime = time;

    updatePhysics();
    renderGraphics();

    // Sincronizar estado local (Simulamos un "tick rate" de 20hz para no saturar PeerJS)
    if (Math.random() < 0.3) {
      globalNetwork.send({
        type: 'STATE_SYNC',
        id: globalNetwork.myId,
        state: {
          x: engineState.current.localPlayer.x,
          y: engineState.current.localPlayer.y,
          vx: engineState.current.localPlayer.vx,
          vy: engineState.current.localPlayer.vy,
          health: engineState.current.localPlayer.health,
          timeStamp: Date.now()
        }
      });
    }

    if (!inLobby) requestAnimationFrame(gameLoop);
  };

  const updatePhysics = () => {
    const p = engineState.current.localPlayer;
    globalInput.updateBuffer();

    // Movimiento Horizontal
    p.vx = (globalInput.currentState.right ? SPEED : 0) - (globalInput.currentState.left ? SPEED : 0);
    p.x += p.vx;

    // Colisiones Horizontales (Suelo/Paredes simplificado a AABB)
    let grounded = false;
    for (const plat of engineState.current.platforms) {
      PhysicsEngine.resolveDynamicCollision(p, plat);
    }

    // Movimiento Vertical & Gravedad
    p.vy += GRAVITY;
    p.y += p.vy;

    for (const plat of engineState.current.platforms) {
      if (PhysicsEngine.isIntersecting(p, plat)) {
        // Simple Floor check
        if (p.vy > 0 && p.y + p.height / 2 < plat.y + plat.height) {
          p.y = plat.y - p.height;
          p.vy = 0;
          grounded = true;
          globalInput.lastGroundedTime = performance.now();
        }
      }
    }

    // Coyote Time & Input Buffering Jump
    if (globalInput.hasBufferedAction() && (grounded || globalInput.canCoyoteJump())) {
      p.vy = JUMP_FORCE;
      globalInput.clearBuffer();
      globalInput.lastGroundedTime = 0;
      globalVFX.spawnExplosion(p.x + p.width/2, p.y + p.height, '#00FFFF', 5);
    }

    // Remote Player Prediction (Extrapolar trayectoria básica)
    const rp = engineState.current.remotePlayer;
    rp.x += rp.vx;
    rp.y += rp.vy;
    rp.vy += GRAVITY;
    for (const plat of engineState.current.platforms) {
       PhysicsEngine.resolveDynamicCollision(rp, plat);
    }

    globalVFX.update();
  };

  const renderGraphics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo Neón
    ctx.fillStyle = '#050A1F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera Shake Matrix
    ctx.save();
    ctx.translate(globalVFX.cameraOffset.x, globalVFX.cameraOffset.y);

    // Dibujar Plataformas (Cyberpunk Theme)
    ctx.fillStyle = '#0F2C41';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    for (const plat of engineState.current.platforms) {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    }

    // Dibujar Remote Player (Rojo)
    const rp = engineState.current.remotePlayer;
    ctx.fillStyle = '#FF0055';
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 15;
    ctx.fillRect(rp.x, rp.y, rp.width, rp.height);

    // Dibujar Local Player (Cyan)
    const lp = engineState.current.localPlayer;
    ctx.fillStyle = '#00FFFF';
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 15;
    ctx.fillRect(lp.x, lp.y, lp.width, lp.height);
    ctx.shadowBlur = 0; // Reset

    // Particles Render
    globalVFX.render(ctx);

    ctx.restore();
  };

  useEffect(() => {
    // Dimensionamos el canvas
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth > 800 ? 800 : window.innerWidth;
      canvasRef.current.height = window.innerHeight > 600 ? 600 : window.innerHeight;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center font-arcade select-none">
      {inLobby ? (
        <ArcadeMatchmaking onConnected={handleConnected} />
      ) : (
        <>
          <canvas 
            ref={canvasRef} 
            className="border-2 border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] block max-w-full max-h-full"
          />
          <VirtualJoystick />
        </>
      )}
    </div>
  );
}
