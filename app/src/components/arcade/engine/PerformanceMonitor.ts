export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private startTime = performance.now();
  private isCalibrating = true;
  private calibrationDurationMs = 5000; // Evaluar primeros 5 segundos

  // Flags reactivos para el Engine Core
  public useParticles = true;
  public useShadows = true;
  public enableCulling = false;

  public update(now: number) {
    this.frameCount++;
    
    if (this.isCalibrating && (now - this.startTime) >= this.calibrationDurationMs) {
      // 5 segundos terminados, evaluar promedio de FPS
      const averageFPS = this.frameCount / (this.calibrationDurationMs / 1000);
      
      console.log(`[BEEP Engine] Auto-Graphic Scaler Calibrado: ${averageFPS.toFixed(1)} FPS Promedio.`);

      if (averageFPS < 45) {
        // Modo Rendimiento "Potato" activado
        this.useParticles = false;
        this.useShadows = false;
        this.enableCulling = true; // Forzar que no renderice cosas off-screen agresivamente
        console.warn(`[BEEP Engine] Baja de FPS detectada. Rescaling visuales a Bajo Rendimiento.`);
        
        // Disable heavy CSS filters en body temporalmente si existe el overlay
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.style.filter = 'none';
      }

      this.isCalibrating = false; // Detenemos monitorización computacional para ahorrar ciclos
    }
  }

  // Prevenir Memory Leaks asegurando Culling
  public applyAggressiveCulling(items: {x: number, y: number, active: boolean}[], screenW: number, screenH: number) {
    if (!this.enableCulling) return;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.active && (item.x < -100 || item.x > screenW + 100 || item.y < -100 || item.y > screenH + 100)) {
            item.active = false; // Pool Cleanup inmediato O(N)
        }
    }
  }
}

export const globalPerformance = new PerformanceMonitor();
