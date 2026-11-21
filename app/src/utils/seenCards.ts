import { readStorageJSON, writeStorageJSON } from '@/utils/storage';

// Memoria entre partidas de las cartas que han SALIDO de verdad en los modos
// estructurados (megamix/clásico). Se guarda un hash corto por carta, no el
// texto, para que miles de entradas quepan en pocos KB de localStorage.
const SEEN_KEY = 'beep_seen_cards';
const SEEN_CAP = 1500;

// La coletilla de trago se elige al azar al generar el mazo ("🍻 ¡Bebe 2
// tragos!"), así que la misma carta sale con finales distintos en cada
// partida. La clave ignora ese final para reconocerla igual.
const DRINK_TAIL = / (?:🍺|🍻|🥃|🥂|👉)(?: .*)?$/u;

export function cardKey(card: string): string {
  const base = card.replace(DRINK_TAIL, '').trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < base.length; i++) h = Math.imul(h ^ base.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

type SeenStore = Record<string, string[]>;

export function loadSeenCards(mode: string): (card: string) => boolean {
  const keys = new Set(readStorageJSON<SeenStore>(SEEN_KEY, {})[mode] ?? []);
  return (card) => keys.has(cardKey(card));
}

export function markCardSeen(mode: string, card: string): void {
  if (!card || card.startsWith('TRIGGER:')) return;
  const store = readStorageJSON<SeenStore>(SEEN_KEY, {});
  const key = cardKey(card);
  const prev = (store[mode] ?? []).filter((k) => k !== key);
  store[mode] = [key, ...prev].slice(0, SEEN_CAP);
  writeStorageJSON(SEEN_KEY, store);
}
