import { Peer, DataConnection } from 'peerjs';

export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  timeStamp: number;
};

export type GameInput = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
  sequenceNumber: number; // Para Client-Side Prediction
};

// Mensajes P2P
export type NetworkMessage = 
  | { type: 'STATE_SYNC', state: PlayerState, id: string }
  | { type: 'INPUT', input: GameInput, id: string }
  | { type: 'EVENT', eventType: string, data: any }
  | { type: 'PING', time: number }
  | { type: 'PONG', time: number };

export class NetworkManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  public isHost: boolean = false;
  public myId: string = '';
  public peerId: string = '';
  public latency: number = 0;

  private onStateReceiveCallback: ((state: PlayerState, id: string) => void) | null = null;
  private onInputReceiveCallback: ((input: GameInput, id: string) => void) | null = null;
  private onEventReceiveCallback: ((eventType: string, data: any) => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;

  constructor() {
    // Boilerplate for singleton or instanced Network
  }

  public initAsHost(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({ debug: 2 }); // Usa PeerJS Cloud
      this.isHost = true;

      this.peer.on('open', (id) => {
        this.myId = id;
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.connection = conn;
        this.peerId = conn.peer;
        this.setupConnectionLogic(conn);
      });

      this.peer.on('error', (err) => reject(err));
    });
  }

  public joinRoom(hostId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({ debug: 2 });
      this.isHost = false;

      this.peer.on('open', (id) => {
        this.myId = id;
        this.peerId = hostId;
        this.connection = this.peer!.connect(hostId, { reliable: false }); // UDP style for fast inputs
        
        this.connection.on('open', () => {
          this.setupConnectionLogic(this.connection!);
          resolve(id);
        });

        this.connection.on('error', (err) => reject(err));
      });
      this.peer.on('error', (err) => reject(err));
    });
  }

  private setupConnectionLogic(conn: DataConnection) {
    conn.on('data', (data: unknown) => {
      const msg = data as NetworkMessage;
      if (msg.type === 'PING') {
        this.send({ type: 'PONG', time: msg.time });
      } else if (msg.type === 'PONG') {
        this.latency = (Date.now() - msg.time) / 2;
      } else if (msg.type === 'STATE_SYNC' && this.onStateReceiveCallback) {
        this.onStateReceiveCallback(msg.state, msg.id);
      } else if (msg.type === 'INPUT' && this.onInputReceiveCallback) {
        this.onInputReceiveCallback(msg.input, msg.id);
      } else if (msg.type === 'EVENT' && this.onEventReceiveCallback) {
        this.onEventReceiveCallback(msg.eventType, msg.data);
      }
    });

    if (this.onConnectedCallback) this.onConnectedCallback();
    
    // Ping loop
    setInterval(() => {
      if (this.connection?.open) this.send({ type: 'PING', time: Date.now() });
    }, 1000);
  }

  public send(msg: NetworkMessage) {
    if (this.connection && this.connection.open) {
      this.connection.send(msg);
    }
  }

  // Setters para callbacks de red
  public onStateSync(cb: (state: PlayerState, id: string) => void) { this.onStateReceiveCallback = cb; }
  public onInputSync(cb: (input: GameInput, id: string) => void) { this.onInputReceiveCallback = cb; }
  public onGameEvent(cb: (eventType: string, data: any) => void) { this.onEventReceiveCallback = cb; }
  public onConnected(cb: () => void) { this.onConnectedCallback = cb; }

  public disconnect() {
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
  }
}

export const globalNetwork = new NetworkManager();
