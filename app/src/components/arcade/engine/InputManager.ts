export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean; // Salto o Disparo
}

export class InputManager {
  public currentState: InputState = { up: false, down: false, left: false, right: false, action: false };
  private inputBuffer: InputState[] = [];
  private BUFFER_SIZE = 6; // ~100ms a 60fps (6 frames)

  // Coyote Time tracker (milisegundos)
  public lastGroundedTime: number = 0;
  private COYOTE_TIME_MS = 150; 

  constructor() {
    this.setupKeyboard();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.currentState.up = isDown;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.currentState.down = isDown;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.currentState.left = isDown;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.currentState.right = isDown;
    if (e.code === 'Space' || e.code === 'Enter') this.currentState.action = isDown;
  }

  // Update loop for input buffering
  public updateBuffer() {
    this.inputBuffer.push({ ...this.currentState });
    if (this.inputBuffer.length > this.BUFFER_SIZE) {
      this.inputBuffer.shift();
    }
  }

  // Comprobar si hubo una acción (salto) recientemente para evitar sensación rígida
  public hasBufferedAction(): boolean {
    return this.inputBuffer.some(state => state.action === true);
  }

  public clearBuffer() {
    this.currentState.action = false;
    this.inputBuffer = this.inputBuffer.map(state => ({ ...state, action: false }));
  }

  // Determinar si coyote time está activo
  public canCoyoteJump(): boolean {
    return (performance.now() - this.lastGroundedTime) <= this.COYOTE_TIME_MS;
  }

  // Virtual Joystick setters for touch UI overlay
  public setJoystickVector(vector: { x: number, y: number }, deadzone: number = 0.2) {
    // x, y expected in range [-1, 1]
    this.currentState.up = vector.y < -deadzone;
    this.currentState.down = vector.y > deadzone;
    this.currentState.left = vector.x < -deadzone;
    this.currentState.right = vector.x > deadzone;
  }

  public setTouchAction(isDown: boolean) {
    this.currentState.action = isDown;
  }
}

export const globalInput = new InputManager();
