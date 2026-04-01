export class DebuggerSystem {
  public logs: { type: string, message: any, time: number }[] = [];

  constructor() {
    // Overriding native console as requested by prompt "Configurar un entorno en la consola global window.BEEP_LOGS que capture todos los Warning Types"
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.warn = (...args) => {
      this.pushLog('WARN', args);
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.pushLog('ERROR', args);
      originalConsoleError.apply(console, args);
    };

    // Global reference
    (window as any).BEEP_LOGS = this.logs;
    (window as any).DUMP_BEEP_ERRORS = () => {
       return JSON.stringify(this.logs, null, 2);
    };
  }

  private pushLog(type: string, message: any[]) {
    this.logs.push({
      type,
      message: message.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' '),
      time: Date.now()
    });

    if (this.logs.length > 100) {
      this.logs.shift(); // Keep only last 100 to prevent memory leak
    }
  }
}

export const engineDebugger = new DebuggerSystem();
