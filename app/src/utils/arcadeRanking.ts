export interface ArcadeMatchRecord {
  id: string; // uuid local 
  opponentName: string;
  opponentScore: number;
  myScore: number;
  result: 'win' | 'loss' | 'draw';
  timestamp: number;
}

export interface ArcadeLeaderboardEntry {
  username: string;
  highScore: number;
  matchesPlayed: number;
  wins: number;
}

const DB_NAME = 'BeepArcadeDB';
const STORE_NAME = 'ArcadeStats';

// Ofuscar puntuaciones para desalentar manipulación básica de devtools
// Obfuscador sencillo: btoa( score + "salt" )
const SECRET_SALT = 'b33p_4rc4d3_m4g1c';

function encodeScore(score: number): string {
  return btoa(`${score}_${SECRET_SALT}`);
}

function decodeScore(encoded: string): number {
  try {
    const dec = atob(encoded);
    const parts = dec.split('_');
    if (parts[1] === SECRET_SALT) {
      return parseInt(parts[0], 10);
    }
  } catch (e) {
    //
  }
  return 0; // fallback if tampered
}

export class ArcadeStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'username' });
        }
      };
      req.onsuccess = (e: any) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveLeaderboardSync(entries: ArcadeLeaderboardEntry[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      entries.forEach(e => {
        // En un caso real, guardaríamos el score "ofuscado" internamente y lo desencriptamos solo al leer.
        // Aquí lo dejamos en claro para la estructura JSON ligera pedida, 
        // pero validamos en el setter de score in-game
        store.put(e);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getLeaderboard(): Promise<ArcadeLeaderboardEntry[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}

export const arcadeStorage = new ArcadeStorage();

// Herramientas de cifrado in-memory expuestas para el Engine
export const ArcadeCrypto = {
    enc: encodeScore,
    dec: decodeScore
};
