/**
 * PartyDirector — motor de "salseo" 100 % local (sin IA, sin backend).
 *
 * Sustituye lo que antes hacía Gemini: coger un reto y darle contexto usando
 * los nombres reales, las estadísticas de la partida y lo que acaba de pasar,
 * para que las rondas tengan relación entre sí y cada partida se sienta
 * distinta. Todo es determinista y funciona offline.
 *
 * Los nombres de export `gemini*` se mantienen por compatibilidad con los
 * imports existentes (ver src/services/geminiClient.ts).
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- firmas heredadas de la antigua capa de IA */
import { impostorRounds } from '@/data/impostorContent';

// ─── Utilidades ────────────────────────────────────────────────────────────
const rnd = () => Math.random();
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function chance(p: number): boolean {
  return rnd() < p;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPartyTheme(): string {
  if (typeof localStorage === 'undefined') return '';
  return (localStorage.getItem('fiesta_party_theme') || '').trim();
}

// ─── EL GRAN ENGRANAJE ─────────────────────────────────────────────────────
// El Director lee TODO el estado de la sesión (norma activa, liga de duelos,
// tema...) y lo teje en cada carta para que la partida de Megamix se sienta
// como una tela de araña donde todo está conectado.

function readActiveNorma(): string {
  if (typeof localStorage === 'undefined') return '';
  const n = (localStorage.getItem('beep_active_norma') || '').trim();
  return n.replace(/^(📜\s*)?NORMA:\s*/i, '').trim();
}

function readDuelKing(): { name: string; wins: number } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = JSON.parse(localStorage.getItem('beep_bracket_wins') || '{}');
    const names = JSON.parse(localStorage.getItem('beep_bracket_win_names') || '{}');
    let best: { name: string; wins: number } | null = null;
    for (const id of Object.keys(raw)) {
      const wins = Number(raw[id]) || 0;
      const name = names[id] || '';
      if (wins > 0 && name && (!best || wins > best.wins)) best = { name, wins };
    }
    return best;
  } catch {
    return null;
  }
}

/** Frases-remate opcionales que enganchan la carta con el resto de la partida. */
function weaveExtras(activeName: string, playerNames: string[]): string[] {
  const out: string[] = [];
  const norma = readActiveNorma();
  if (norma && chance(0.28)) {
    out.push(pick([
      `(y sin saltarse la norma: ${norma.toLowerCase()})`,
      `— ojo, que sigue la norma: ${norma.toLowerCase()}`,
      `(la norma sigue en pie: ${norma.toLowerCase()})`,
    ]));
  }
  const king = readDuelKing();
  if (king && king.name !== activeName && chance(0.22)) {
    out.push(pick([
      `Y que ${king.name}, con ${king.wins} ${king.wins === 1 ? 'llave' : 'llaves'} de duelos, no se relaje.`,
      `${king.name} manda en la liga de duelos, a ver si dura.`,
    ]));
  }
  const theme = getPartyTheme();
  if (theme && chance(0.25) && !out.some(x => x.toLowerCase().includes(theme.toLowerCase()))) {
    out.push(`Rollo "${theme}" 😏`);
  }
  return out.slice(0, 2); // máx 2 remates para no hacer un tocho
}

// Compat: antes decían si había clave de IA. Ahora el motor es local y siempre
// está disponible.
export function isGeminiConfigured(): boolean {
  return true;
}
export function getGeminiApiKey(): string {
  return '';
}

// ─── Lectura de estadísticas ──────────────────────────────────────────────
export interface DirectorStat {
  name: string;
  tragos: number;
  fallados: number;
  completados: number;
  yoNunca: number;
  votos: number;
  duelosPerdidos: number;
  duelosGanados: number;
  torneosGanados: number;
  torneosPerdidos: number;
}

/** Acepta el `Record<string, PlayerStats>` de useGameMemory o algo parecido. */
export function toDirectorStats(raw: Record<string, any> | undefined | null): DirectorStat[] {
  if (!raw) return [];
  return Object.values(raw).map((s: any) => ({
    name: s.playerName ?? s.name ?? '¿?',
    tragos: s.tragos ?? 0,
    fallados: s.retos_fallados ?? 0,
    completados: s.retos_completados ?? 0,
    yoNunca: s.yo_nunca_count ?? 0,
    votos: s.votos_recibidos ?? 0,
    duelosPerdidos: s.duelos_perdidos ?? 0,
    duelosGanados: s.duelos_ganados ?? 0,
    torneosGanados: s.torneos_ganados ?? 0,
    torneosPerdidos: s.torneos_perdidos ?? 0,
  }));
}

/** Reconstruye estadísticas aproximadas desde el string resumen que arma
 *  useGameMemory ("Nombre: 3 tragos bebidos, 2 retos fallados | Otro: ..."). */
export function parseStatsSummary(summary: string): DirectorStat[] {
  if (!summary) return [];
  return summary.split('|').map(chunk => {
    const [rawName, ...rest] = chunk.split(':');
    const body = rest.join(':');
    const num = (re: RegExp) => {
      const m = body.match(re);
      return m ? parseInt(m[1], 10) : 0;
    };
    return {
      name: (rawName || '').trim() || '¿?',
      tragos: num(/(\d+)\s*tragos/),
      fallados: num(/(\d+)\s*retos fallados/),
      completados: num(/(\d+)\s*retos completados/),
      yoNunca: num(/en\s*(\d+)\s*Yo Nunca/),
      votos: num(/votado\s*(\d+)/),
      duelosPerdidos: num(/(\d+)\s*duelos perdidos/),
      duelosGanados: num(/(\d+)\s*duelos ganados/),
      torneosGanados: num(/(\d+)\s*torneos ganados/),
      torneosPerdidos: num(/(\d+)\s*torneos perdidos/),
    };
  });
}

// ─── Personajes de la noche (de dónde salen los piques) ───────────────────
interface Cast {
  drunk?: DirectorStat;   // más tragos
  sober?: DirectorStat;   // menos tragos
  loser?: DirectorStat;   // más retos fallados
  champ?: DirectorStat;   // más victorias
}
function readCast(stats: DirectorStat[]): Cast {
  if (stats.length === 0) return {};
  const withTragos = stats.filter(s => s.tragos > 0);
  const sorted = [...stats].sort((a, b) => b.tragos - a.tragos);
  return {
    drunk: withTragos.length ? sorted[0] : undefined,
    sober: withTragos.length ? sorted[sorted.length - 1] : undefined,
    loser: [...stats].sort((a, b) => b.fallados - a.fallados).find(s => s.fallados > 0),
    champ: [...stats].sort(
      (a, b) => (b.duelosGanados + b.torneosGanados + b.completados) - (a.duelosGanados + a.torneosGanados + a.completados)
    ).find(s => s.duelosGanados + s.torneosGanados + s.completados > 0),
  };
}

/** Frase de contexto que engancha la ronda con lo ocurrido. '' si no hay nada jugoso. */
function pique(cast: Cast, active: string, others: string[]): string {
  const opts: string[] = [];
  if (cast.drunk && cast.drunk.tragos >= 3 && cast.drunk.name !== active)
    opts.push(`🍻 ${cast.drunk.name} ya lleva ${cast.drunk.tragos} tragos, esto le va a pasar factura. `);
  if (cast.drunk && cast.drunk.name === active && cast.drunk.tragos >= 3)
    opts.push(`🍻 ${active}, con ${cast.drunk.tragos} tragos encima esto va a ser oro. `);
  if (cast.loser && cast.loser.fallados >= 2)
    opts.push(`😬 ${cast.loser.name} lleva ${cast.loser.fallados} retos fallados, a ver si rompe la racha. `);
  if (cast.sober && cast.sober.tragos === 0)
    opts.push(`👀 ${cast.sober.name} no ha bebido NADA todavía. Sospechoso. `);
  if (cast.champ && cast.champ.name !== active)
    opts.push(`👑 ${cast.champ.name} va sobrado esta noche, tocaría bajarle los humos. `);
  if (others.length >= 1)
    opts.push(`🔥 ${active} y ${pick(others)}, esto es entre vosotros. `);
  if (opts.length === 0) return '';
  return pick(opts);
}

// ─── Relleno de huecos de una carta ──────────────────────────────────────
function fillSlots(text: string, active: string, players: string[], theme: string): string {
  const others = players.filter(p => p !== active);
  const other1 = others.length ? pick(others) : active;
  const other2 = others.filter(p => p !== other1);
  const rival = other2.length ? pick(other2) : other1;
  return text
    .replace(/\{player2\}|\{rival\}|\{jugador2\}/gi, rival)
    .replace(/\{player\}|\{jugador\}|\{nombre\}|\{name\}/gi, active)
    .replace(/\{someone\}|\{alguien\}|\{otro\}/gi, other1)
    .replace(/\{theme\}|\{tema\}/gi, theme || 'la fiesta');
}

// ═══════════════════════════════════════════════════════════════════════════
//  API pública (nombres gemini* por compatibilidad)
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Enriquecer un reto con contexto real ──────────────────────────────
export async function geminiEnrichChallenge(
  challengeText: string,
  playerStats: string,
  playerNames: string[],
  activePlayerName: string,
  callback?: string,
): Promise<string> {
  const theme = getPartyTheme();
  const cast = readCast(parseStatsSummary(playerStats));
  const others = (playerNames || []).filter(n => n !== activePlayerName);

  let out = fillSlots(challengeText, activePlayerName, playerNames || [], theme);

  // Callback literal a algo que se respondió antes (~65 % si lo hay).
  if (callback && chance(0.65)) {
    out = `${callback} ${out}`;
  } else if (chance(0.55)) {
    // Si no, prefijo de salseo por estadísticas/rivalidades.
    const p = pique(cast, activePlayerName, others);
    if (p) out = p + out;
  }
  // El gran engranaje: engancha la carta con norma activa, liga de duelos y tema.
  const extras = weaveExtras(activePlayerName, playerNames || []);
  if (extras.length) out += ' ' + extras.join(' ');
  return out;
}

// ── 2. Sintetizar una carta nueva desde el estado de la partida ──────────
const SYNTH_TEMPLATES: ((a: string, b: string, c: string) => string)[] = [
  (a, b) => `⚔️ DUELO: ${a} vs ${b}. Pulso de miradas, el primero que parpadee o se ría bebe 2.`,
  (a, b) => `🎤 ${a}, imita a ${b} hasta que ${b} adivine qué está haciendo. Si no lo pilla en 20s, beben los dos.`,
  (a) => `🗳️ VOTACIÓN: a la de 3, señalad quién creéis que acabará peor esta noche. El más votado bebe 2.`,
  (a, b) => `🤝 ${a} y ${b}: brindis obligatorio y un secreto cada uno. Quien se corte, bebe.`,
  (a) => `🔗 CADENA (empieza ${a}, seguid a la izquierda): decid marcas de bebida sin repetir. Quien falle o tarde 3s, bebe.`,
  (a, b) => `📢 ${a}, dile a ${b} algo que admires de él/ella. Si suena forzado, bebéis los dos.`,
  (a) => `🎯 ${a} elige: bebes 2 o repartes 3 tragos entre la mesa.`,
  (a, b) => `🃏 ${a} y ${b} se juegan quién bebe: piedra-papel-tijera al mejor de 3.`,
  (a) => `👑 ${a} es Rey/Reina por una ronda: da una orden absurda pero cumplible. Quien no la haga, bebe.`,
  (a) => `📸 ${a} recrea la última foto de su galería (sin enseñarla). La mesa vota si cuela; si no, bebe.`,
  (a, b) => `🎭 ${a} y ${b}: conversación de 20s SIN usar la letra "e". Quien resbale, bebe.`,
  (a) => `⏱️ ${a} tiene 10s para nombrar 5 personas de la mesa por orden de quién aguanta más bebiendo. Fallo = 2 tragos.`,
];
export async function geminiGenerateCard(
  _events: any[],
  playerNames: string[],
): Promise<string | null> {
  const names = (playerNames || []).filter(Boolean);
  if (names.length < 2) return null;
  const [a, b, c] = shuffle(names);

  // El gran engranaje: a veces la carta inventada nace de la norma o de la
  // liga de duelos, para que todo esté conectado.
  const king = readDuelKing();
  const norma = readActiveNorma();
  if (king && king.name !== a && chance(0.3)) {
    return pick([
      `🏆 REVANCHA: ${a} reta a ${king.name} (líder de duelos con ${king.wins}). Piedra-papel-tijera al mejor de 3. El que pierda bebe 3.`,
      `👑 ${king.name} lleva ${king.wins} ${king.wins === 1 ? 'llave' : 'llaves'} ganadas. ${a}, tu misión: hacerle fallar el próximo reto o bebes tú.`,
    ]);
  }
  if (norma && chance(0.25)) {
    return `📜 CONTROL DE NORMA: durante esta ronda ${a} vigila que nadie se salte "${norma.toLowerCase()}". Cada pillado, un trago. Si ${a} no pilla a nadie, bebe ${a}.`;
  }
  return pick(SYNTH_TEMPLATES)(a, b ?? a, c ?? a);
}

// ── 3. Anuncio teatral de un duelo de torneo ────────────────────────────
export async function geminiGenerateTorneoAnnouncement(
  player1: string,
  player2: string,
  _retoText: string,
  _memory: string[] = [],
): Promise<string | null> {
  const openers = [
    `🥊 ¡SEÑORAS Y SEÑORES! En esta esquina, ${player1}. En la otra, ${player2}. Que gane el menos sobrio.`,
    `🔔 ${player1} contra ${player2}. Años de piques resumidos en un solo duelo. El perdedor bebe y calla.`,
    `🎙️ Lo que faltaba: ${player1} vs ${player2}. La mesa entera huele sangre. ¡A por ello!`,
    `⚡ ${player1} y ${player2} al centro. El honor está en juego (y 3 tragos para el que caiga).`,
    `🏟️ Silencio en la barra: ${player1} desafía a ${player2}. Esto no lo arregla ni el camarero.`,
  ];
  return pick(openers);
}

// ── 4. Comentario de fin de ronda ──────────────────────────────────────
export async function geminiGenerateRoundAnalysis(
  _players: string[],
  round: number,
  summary: string[],
  playerStatsDigest: string[] = [],
): Promise<string | null> {
  const bits = (summary || []).slice(0, 3);
  const lead = pick([
    `📣 Ronda ${round} para el recuerdo:`,
    `🍻 Resumen de la ronda ${round}:`,
    `📊 Lo que dio de sí la ronda ${round}:`,
  ]);
  const body = bits.length ? bits.join('. ') + '.' : 'poca cosa, la mesa se está durmiendo.';
  const tail = playerStatsDigest.length
    ? ` ${pick(['Y ojo con', 'Mención especial para', 'El foco esta noche:'])} ${playerStatsDigest[0]}.`
    : '';
  return `${lead} ${body}${tail}`;
}

// ── 5. Crónica final del podio ─────────────────────────────────────────
function partyTitle(s: DirectorStat): string {
  if (s.tragos >= 8) return `"Hígado de Titanio" (${s.tragos} tragos)`;
  if (s.fallados >= 4) return `"El Cobardica Mayor" (${s.fallados} retos esquivados)`;
  if (s.torneosGanados >= 2) return `"Máquina de Torneos" (${s.torneosGanados}🏆)`;
  if (s.duelosGanados >= 3) return `"Pistolero de Duelos" (${s.duelosGanados} ganados)`;
  if (s.votos >= 4) return `"El Señalado" (${s.votos} votos encima)`;
  if (s.tragos === 0) return `"El Conductor Designado" (0 tragos, sospechoso)`;
  if (s.completados >= 4) return `"Cumplidor Profesional"`;
  return pick([`"Estuvo ahí"`, `"Perfil bajo, resaca alta"`, `"El comodín"`]);
}
export async function geminiGeneratePartyChronicle(
  players: { name: string; score: number }[],
  trackingData: any,
): Promise<string | null> {
  const theme = getPartyTheme();
  const ranked = [...(players || [])].sort((a, b) => b.score - a.score);
  const drinks: Record<string, number> = trackingData?.drinkCounts || {};
  const lines: string[] = [];
  lines.push(theme ? `🎬 Crónica de la noche "${theme}":` : `🎬 Crónica de la noche:`);
  if (ranked[0]) lines.push(`🏆 ${ranked[0].name} se lleva la corona con ${ranked[0].score} XP. Que lo disfrute mientras dure.`);
  ranked.slice(0, 6).forEach(p => {
    const st: DirectorStat = {
      name: p.name, tragos: drinks[p.name] ?? 0, fallados: 0, completados: 0, yoNunca: 0,
      votos: 0, duelosPerdidos: 0, duelosGanados: 0, torneosGanados: 0, torneosPerdidos: 0,
    };
    lines.push(`• ${p.name}: ${partyTitle(st)}.`);
  });
  // El gran engranaje: la crónica cierra el círculo con la liga de duelos y la norma.
  const king = readDuelKing();
  if (king) lines.push(`⚔️ Rey de los duelos: ${king.name}, con ${king.wins} ${king.wins === 1 ? 'llave' : 'llaves'} en el bolsillo.`);
  const norma = readActiveNorma();
  if (norma) lines.push(`📜 Y hasta el final aguantó la norma: ${norma.toLowerCase()}.`);
  lines.push(pick([
    `Nos vemos en la próxima, con más sed y menos vergüenza. 🍻`,
    `La resaca de mañana os la habéis ganado a pulso. 💀`,
    `Fin de la partida. Bebed agua, campeones. 💧`,
  ]));
  return lines.join('\n');
}

// ── 6. El Juez de la Barra ────────────────────────────────────────────
export async function geminiResolveDispute(
  players: string[],
  disputeText: string,
): Promise<string | null> {
  const culpable = players && players.length ? pick(players) : 'el que ha montado el pollo';
  const tragos = 1 + Math.floor(rnd() * 3);
  const verdicts = [
    `⚖️ Visto lo visto ("${disputeText.slice(0, 80)}"), el Juez de la Barra dictamina: ${culpable} bebe ${tragos}. Caso cerrado. 🔨`,
    `⚖️ Sentencia firme: aquí el único culpable es ${culpable}. ${tragos} tragos y a otra cosa.`,
    `⚖️ El tribunal ha deliberado 2 segundos: ${culpable} paga con ${tragos} tragos. Sin apelación.`,
    `⚖️ Ni víctimas ni héroes: ${culpable} bebe ${tragos} por hacer perder el tiempo a la sala.`,
  ];
  return pick(verdicts);
}

// ── 7. Castigo personalizado ─────────────────────────────────────────
const PUNISHMENTS = [
  'llama a un contacto al azar y cántale el estribillo de tu canción favorita',
  'deja que la persona de tu derecha escriba un mensaje en tu WhatsApp (a quien quiera)',
  'habla solo con acento andaluz hasta tu próximo turno',
  'haz 10 sentadillas contando en voz alta en inglés',
  'imita a alguien de la mesa hasta que adivinen quién es',
  'ponte algo de otra persona de la mesa durante dos rondas',
  'cuéntanos tu momento más vergonzoso de borrachera, sin adornos',
  'baila 15 segundos sin música mientras la mesa te puntúa del 1 al 10',
  'deja que la mesa mire tu última búsqueda en Google',
  'habla en tercera persona sobre ti mismo hasta tu siguiente turno',
];
export async function geminiGenerateCustomPunishment(
  playerName: string,
  _statsSummary: string,
): Promise<string | null> {
  return `🎲 ${playerName || 'Tú'}, en vez de beber: ${pick(PUNISHMENTS)}.`;
}

// ── 8. Ronda del Impostor (del banco local) ──────────────────────────
export async function geminiGenerateImpostorRound(): Promise<
  { category: string; word: string; fakeWord: string; hint: string } | null
> {
  if (!impostorRounds || impostorRounds.length === 0) return null;
  const r = pick(impostorRounds);
  return {
    category: r.category,
    word: r.normalQuestion,
    fakeWord: r.impostorQuestion,
    hint: r.hint,
  };
}

// ── 9. Entrenador de fiesta (roast por estadísticas) ─────────────────
export async function geminiGenerateProfileCoach(
  playerName: string,
  stats: {
    level: number; xp: number; gamesPlayed: number; gamesWon: number;
    megamixWins: number; clasicoWins: number; picanteWins: number;
    pokerChips: number; parchisWins: number;
  },
): Promise<string | null> {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  let mote: string;
  if (stats.megamixWins >= 5) mote = `${playerName} "Rey del Megamix"`;
  else if (stats.pokerChips >= 500) mote = `${playerName} "El Farolero"`;
  else if (stats.gamesPlayed >= 20 && winRate < 25) mote = `${playerName} "El Fiel Perdedor"`;
  else if (winRate >= 60) mote = `${playerName} "Máquina Tryhard"`;
  else mote = `${playerName} "Promesa Eterna"`;

  const diag = [
    `🏅 Nivel ${stats.level} · ${stats.xp} XP · ${stats.gamesPlayed} partidas (${winRate}% ganadas).`,
    winRate >= 50
      ? `Ganas más de lo que pierdes. La mesa ya te tiene fichado, cuidado.`
      : `El ratio de victorias pide a gritos entrenar más y hablar menos.`,
    stats.megamixWins > stats.clasicoWins
      ? `Brillas en Megamix y te escondes en el Clásico.`
      : `Te va el Clásico; el Megamix te supera un poco, reconócelo.`,
    stats.pokerChips > 0 ? `En el póker ${stats.pokerChips >= 200 ? 'das miedo' : 'vas justito'}.` : `El póker aún te da respeto.`,
  ];
  const consejo = pick([
    'Consejo científico: bebe agua entre rondas y tu ratio subirá solo.',
    'Consejo científico: deja de ir de farol en el primer turno, se te ve el plumero.',
    'Consejo científico: elige rival, no elijas a todos a la vez.',
    'Consejo científico: la mímica se entrena en casa, no en la fiesta.',
  ]);
  return `${mote}\n\n${diag.join(' ')}\n\n💡 ${consejo}`;
}

// ── 10. Quiz de chismes a partir de las confesiones del lobby ────────
export async function geminiGenerateSecretsTrivia(
  secrets: { playerName: string; secret: string }[],
): Promise<any[] | null> {
  if (!secrets || secrets.length === 0) return null;
  const names = Array.from(new Set(secrets.map(s => s.playerName)));
  const out = shuffle(secrets).slice(0, 8).map(({ playerName, secret }) => {
    const distractors = shuffle(names.filter(n => n !== playerName)).slice(0, 3);
    const options = shuffle([playerName, ...distractors]);
    while (options.length < 4) options.push(pick(names));
    return {
      question: `Alguien confesó: "${secret}". ¿Quién de estos sospechosos fue?`,
      options,
      correctIndex: options.indexOf(playerName),
      hint: 'Míralo a los ojos. El que se ríe primero, canta.',
      difficulty: 3,
      category: 'Quiz de Chismes 🤫',
    };
  });
  return out;
}
