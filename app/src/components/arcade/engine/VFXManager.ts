interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export class VFXManager {
  private particles: Particle[] = [];
  private POOL_SIZE = 500;
  
  // Camera Shake
  public cameraOffset = { x: 0, y: 0 };
  private shakeIntensity = 0;
  private shakeDecay = 0.9;
  
  // Audio
  private audioCtx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};

  constructor() {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#FFFFFF', size: 1, active: false
      });
    }

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext no soportado");
    }
  }

  public preloadAudio(name: string, url: string) {
    if (!this.audioCtx) return;
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(data => this.audioCtx!.decodeAudioData(data))
      .then(buffer => {
        this.buffers[name] = buffer;
      });
  }

  // Pitch randomizer para evitar fatiga auditiva
  public playSound(name: string, volume: number = 1.0) {
    if (!this.audioCtx || !this.buffers[name]) return;
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.buffers[name];
    
    // Pitch shift 0.8 to 1.2
    source.playbackRate.value = 0.8 + Math.random() * 0.4;
    
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    source.start();
  }

  // Haptic Feedback API
  public hitVibrate() {
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }

  public triggerShockwaveVibrate() {
    if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
  }

  public triggerCameraShake(intensity: number = 15) {
    this.shakeIntensity = intensity;
  }

  public spawnExplosion(x: number, y: number, color: string, count: number = 20) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.maxLife = Math.random() * 30 + 15;
        p.life = p.maxLife;
        p.color = color;
        p.size = Math.random() * 4 + 2;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update() {
    // Camera shake physics
    if (this.shakeIntensity > 0.1) {
      this.cameraOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.cameraOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.cameraOffset.x = 0;
      this.cameraOffset.y = 0;
    }

    // Particle physics in Object Pool
    for (const p of this.particles) {
      if (p.active) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life--;
        if (p.life <= 0) p.active = false;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.active) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  }
}

export const globalVFX = new VFXManager();
