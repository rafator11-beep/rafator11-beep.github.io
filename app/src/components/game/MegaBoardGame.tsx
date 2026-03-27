import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RewardPopup } from './RewardPopup';
import { loadLocalRankings } from '@/utils/localRanking';
import { shuffleArray, getRandomWithoutRepeat, resetSessionTracker } from '@/utils/shuffleUtils';
import {
  clasico,
  yoNunca,
  quienEsMasProbable,
  normasRonda,
} from '@/data/gameContent';
import { duelos } from '@/data/duelosContent';
import { mimicaChallenges } from '@/data/mimicaContent';
import { cultureQuestionsNew2025 } from '@/data/cultureQuestionsNew2025';
import { useRanking } from '@/hooks/useRanking';

// ─── Tile Types & Content ─────────────────────────────────────────────────────
type TileType = 'start' | 'challenge' | 'trivia' | 'duel' | 'drink' | 'bonus' | 'trap' | 'mimica' | 'random' | 'norma' | 'finish' | 'oca' | 'puente' | 'posada' | 'pozo' | 'laberinto' | 'carcel' | 'calavera' | 'skip' | 'reset';

interface BoardTile {
  id: number;
  type: TileType;
  label: string;
  emoji: string;
  color: string;
  text?: string;
  effect?: {
    type: 'advance' | 'score' | 'shield' | 'steal' | 'back' | 'skip' | 'reset' | 'roll_again' | 'swap_top' | 'move_all_others' | 'swap_left';
    value?: number;
  };
}

const TILE_CONFIG: Record<TileType, { emoji: string; color: string; label: string }> = {
  start:     { emoji: '🏠', color: 'from-green-400 to-emerald-500', label: 'Salida' },
  challenge: { emoji: '🎯', color: 'from-blue-400 to-indigo-500', label: 'Reto' },
  trivia:    { emoji: '🧠', color: 'from-pink-400 to-rose-500', label: 'Trivia' },
  duel:      { emoji: '⚔️', color: 'from-red-400 to-orange-500', label: 'Duelo' },
  drink:     { emoji: '🍺', color: 'from-amber-400 to-yellow-500', label: 'Tragos' },
  bonus:     { emoji: '⭐', color: 'from-yellow-300 to-amber-400', label: 'Bonus' },
  trap:      { emoji: '💀', color: 'from-gray-600 to-gray-800', label: 'Trampa' },
  mimica:    { emoji: '🎭', color: 'from-purple-400 to-violet-500', label: 'Mímica' },
  random:    { emoji: '🎲', color: 'from-cyan-400 to-teal-500', label: 'Azar' },
  norma:     { emoji: '📜', color: 'from-orange-400 to-red-500', label: 'Norma' },
  finish:    { emoji: '🏆', color: 'from-yellow-400 to-amber-600', label: 'Meta' },
  oca:       { emoji: '🦢', color: 'from-white to-gray-200', label: 'Oca' },
  puente:    { emoji: '🌉', color: 'from-stone-400 to-stone-600', label: 'Puente' },
  posada:    { emoji: '🏨', color: 'from-amber-700 to-amber-900', label: 'Posada' },
  pozo:      { emoji: '🕳️', color: 'from-blue-800 to-indigo-900', label: 'Pozo' },
  laberinto: { emoji: '🧭', color: 'from-green-700 to-green-900', label: 'Laberinto' },
  carcel:    { emoji: '⛓️', color: 'from-slate-700 to-slate-900', label: 'Cárcel' },
  calavera:  { emoji: '☠️', color: 'from-black to-gray-900', label: 'Muerte' },
  skip:      { emoji: '⏭️', color: 'from-red-700 to-red-900', label: 'Salto' },
  reset:     { emoji: '🔄', color: 'from-blue-700 to-blue-900', label: 'Reinicio' },
};

const ocaTilesList = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59, 63, 68, 72, 77, 81, 86, 90, 95];

const MAX_MEGABOARD_PLAYERS = 20;
const MAX_TILE_AVATARS = 4;

// Generate 100-tile board with varied tile distribution
function generateBoard(): BoardTile[] {
  const tileSequence: TileType[] = [
    'drink', 'challenge', 'drink', 'drink', 'trivia',
    'drink', 'duel', 'drink', 'bonus', 'drink',
    'drink', 'mimica', 'drink', 'drink', 'random',
    'drink', 'norma', 'drink', 'trap', 'drink',
  ];

  const tiles: BoardTile[] = [{ id: 0, type: 'start', ...TILE_CONFIG.start }];

  for (let i = 1; i < 99; i++) {
    const type = tileSequence[i % tileSequence.length];
    const cfg = TILE_CONFIG[type];
    const tile: BoardTile = { id: i, type, label: cfg.label, emoji: cfg.emoji, color: cfg.color };

    // Assign specific effects for bonus/trap/random
    if (type === 'bonus') {
      const bonus = BONUS_EVENTS[Math.floor(Math.random() * BONUS_EVENTS.length)];
      tile.text = bonus.label;
      tile.effect = { type: bonus.type as any, value: bonus.value };
    } else if (type === 'trap') {
      const trap = TRAP_EVENTS[Math.floor(Math.random() * TRAP_EVENTS.length)];
      tile.text = trap.label;
      tile.effect = { type: trap.type as any, value: trap.value };
    } else if (type === 'random') {
      const random = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      tile.text = random.label;
      tile.effect = { type: random.type as any, value: random.value };
    }

    tiles.push(tile);
  }

  // Inject Classic Oca Tiles
  ocaTilesList.forEach(i => {
    if (i < 99) tiles[i] = { id: i, type: 'oca', ...TILE_CONFIG.oca, effect: { type: 'roll_again' } };
  });
  tiles[6] = { id: 6, type: 'puente', ...TILE_CONFIG.puente, effect: { type: 'advance', value: 6 } };
  tiles[12] = { id: 12, type: 'puente', ...TILE_CONFIG.puente, effect: { type: 'back', value: 6 } };
  tiles[19] = { id: 19, type: 'posada', ...TILE_CONFIG.posada, effect: { type: 'skip' } };
  tiles[31] = { id: 31, type: 'pozo', ...TILE_CONFIG.pozo, effect: { type: 'skip' } };
  tiles[42] = { id: 42, type: 'laberinto', ...TILE_CONFIG.laberinto, effect: { type: 'back', value: 12 } };
  tiles[56] = { id: 56, type: 'carcel', ...TILE_CONFIG.carcel, effect: { type: 'skip' } };
  tiles[58] = { id: 58, type: 'calavera', ...TILE_CONFIG.calavera, effect: { type: 'reset' } };

  tiles.push({ id: 99, type: 'finish', ...TILE_CONFIG.finish });
  return tiles;
}

// ─── Drink/Party Content for tiles ────────────────────────────────────────────
const DRINK_EVENTS = [
  "🍻 Todos beben 2 tragos.",
  "🍺 El jugador actual bebe 2 tragos y reparte 2 más.",
  "🥂 Brindis general: nadie se libra, todos 1 trago.",
  "🍹 Elige a dos personas para que beban 2 tragos cada una.",
  "🍺 El de tu izquierda y tú bebéis 2 tragos.",
  "🥃 Si no haces un mini discurso, bebes 3 tragos.",
  "🍻 Ronda rápida: todos 2 tragos seguidos.",
  "🍺 Reparte 4 tragos como quieras.",
  "🥂 El último en levantar el vaso bebe 3 tragos.",
  "🍹 Tu eliges: bebes 3 o repartes 5.",
  "🍺 El más alto, el más bajo y tú bebéis 2 tragos.",
  "🍻 Cascada: empieza el jugador actual y todos le siguen.",
  "🥃 Fondo corto o 4 tragos. Tú decides.",
  "🍺 Si te ríes antes de acabar la ronda, bebes 2 más. Empieza bebiendo 2.",
  "👑 El jugador actual reparte 6 tragos entre el grupo.",
  "🍻 Todos los que lleven móvil cerca beben 2 tragos.",
  "🥂 Choque de vasos y 2 tragos cada uno.",
  "🍺 Elige a alguien para un duelo: quien pierda bebe 4 tragos.",
  "🍹 Ronda de castigo: todos 1 trago y tú 2 extra.",
  "🥃 El grupo decide si bebes 2 o 4 tragos.",
];

const BONUS_EVENTS = [
  { label: "⭐ ¡Avanza 3 casillas extra!", type: 'move', value: 3 },
  { label: "⭐ ¡Tira otra vez!", type: 'roll_again' },
  { label: "⭐ Eres inmune al próximo trap. ¡Escudo activado!", type: 'shield' },
  { label: "⭐ ¡Doble XP en esta ronda! (+20 puntos extra)", type: 'xp', value: 20 },
  { label: "⭐ Elige a un jugador y retrocédelo 2 casillas.", type: 'move_other', value: -2 },
  { label: "⭐ ¡Comodín! Puedes saltarte la próxima casilla negativa.", type: 'shield' },
  { label: "⭐ ¡Roba 5 puntos de XP a otro jugador!", type: 'steal', value: 5 },
];

const TRAP_EVENTS = [
  { label: "💀 ¡Retrocede 3 casillas!", type: 'move', value: -3 },
  { label: "💀 Pierdes tu próximo turno.", type: 'skip' },
  { label: "💀 Bebe 3 tragos y retrocede 1 casilla.", type: 'move', value: -1 },
  { label: "💀 Todos te señalan y bebes 2 tragos.", type: 'info' },
  { label: "💀 ¡Vuelves a la casilla 0!", type: 'reset' },
  { label: "💀 Haz 10 sentadillas o bebe 5 tragos.", type: 'info' },
  { label: "💀 El grupo te pone un mote.", type: 'info' },
];

const RANDOM_EVENTS = [
  { label: "🎲 ¡Cambio de posiciones! Los dos jugadores más adelantados intercambian lugar.", type: 'swap_top' },
  { label: "🎲 Todos tiran un dado imaginario. El más alto avanza 2 extra.", type: 'info' },
  { label: "🎲 ¡Tormenta! Todos retroceden 1 casilla excepto tú.", type: 'move_all_others', value: -1 },
  { label: "🎲 Reto relámpago: di 5 países en 10 segundos o pierdes tu turno.", type: 'info' },
  { label: "🎲 ¡Intercambio! Cambia posición con el jugador de tu izquierda.", type: 'swap_left' },
  { label: "🎲 Lotería: ganas 15 XP.", type: 'xp', value: 15 },
];

// ─── Player Interface ─────────────────────────────────────────────────────────
interface MBPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  position: number;
  score: number;
  skipNextTurn: boolean;
  shielded: boolean;
}

// ─── Event Card Sub-component ───────────────────────────────────────────────
const EVENT_ICONS: Record<string, string> = {
  challenge: '🎯',
  trivia: '🧠',
  duel: '⚔️',
  drink: '🍺',
  mimica: '🎭',
  info: 'ℹ️',
  roll_again: '🎲'
};

const EVENT_LABELS: Record<string, string> = {
  challenge: 'Reto Especial',
  trivia: 'Pregunta de Cultura',
  duel: 'Duelo de Honor',
  drink: 'Momento de Brindis',
  mimica: 'Mímica y Gestos',
  info: 'Evento Especial',
  roll_again: 'Tirada Extra'
};

interface EventCardProps {
  type: string;
  text: string;
  currentPlayerName: string;
  players: MBPlayer[];
  triviaQuestion: any;
  triviaAnswered: boolean;
  onTriviaAnswer: (ans: string) => void;
  onChallengeResult: (passed: boolean) => void;
  onDuelResult: (won: boolean) => void;
  onDismiss: () => void;
}

const EventCard = ({ type, text, currentPlayerName, players, triviaQuestion, triviaAnswered, onTriviaAnswer, onChallengeResult, onDuelResult, onDismiss }: EventCardProps) => {
  const [timeLeft, setTimeLeft] = useState(type === 'challenge' ? 60 : (type === 'trivia' ? 20 : 0));
  const [mimicaRevealed, setMimicaRevealed] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [type, timeLeft]);

  const renderContent = () => {
    switch (type) {
      case 'challenge':
        return (
          <div className="space-y-6">
            <p className="text-xl font-bold text-center text-white leading-relaxed">{text}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-violet-300">
                <span>Tiempo Restante</span>
                <span>{timeLeft}s</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-violet-400"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onChallengeResult(true)} className="h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-lg">✅ LOGRADO</Button>
              <Button onClick={() => onChallengeResult(false)} variant="destructive" className="h-14 rounded-2xl font-black text-lg shadow-lg">❌ FALLADO</Button>
            </div>
          </div>
        );
      case 'trivia':
        return (
          <div className="space-y-5">
            <p className="text-lg font-bold text-center text-white leading-tight">{triviaQuestion?.question}</p>
            <div className="grid grid-cols-1 gap-2.5">
              {triviaQuestion?.options.map((opt: string, i: number) => {
                const isCorrect = opt === triviaQuestion.correct_answer;
                const isAnswered = triviaAnswered;
                let btnStyle = "bg-white/5 border-white/10 text-white hover:bg-white/10";
                if (isAnswered) {
                  if (isCorrect) btnStyle = "bg-green-500/30 border-green-500/50 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                  else btnStyle = "bg-red-500/20 border-red-500/30 text-red-300 opacity-50";
                }
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    disabled={isAnswered}
                    onClick={() => onTriviaAnswer(opt)}
                    className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border ${btnStyle}`}
                  >
                    <span className="mr-3 opacity-40 font-black">{['A','B','C','D'][i]}</span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
            {timeLeft > 0 && !triviaAnswered && (
               <div className="flex justify-center">
                 <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                   Tiempo: {timeLeft}s
                 </div>
               </div>
            )}
            {triviaAnswered && (
              <Button onClick={onDismiss} className="w-full h-12 rounded-xl bg-white text-black font-black mt-2">SIGUIENTE TURNO</Button>
            )}
          </div>
        );
      case 'drink':
        return (
          <div className="space-y-6 relative overflow-hidden py-4">
            <style>{`
              @keyframes bubble-rise {
                0%   { transform: translateY(0) scale(1);   opacity: 0.7; }
                100% { transform: translateY(-120px) scale(0.3); opacity: 0; }
              }
            `}</style>
            {[...Array(8)].map((_,i) => (
              <div key={i} className="absolute bottom-10 rounded-full bg-blue-300/40"
                style={{
                  width: 8 + i*2, height: 8 + i*2,
                  left: `${10 + i*12}%`,
                  animation: `bubble-rise ${1.5+i*0.4}s ease-out infinite`,
                  animationDelay: `${i*0.3}s`
                }}
              />
            ))}
            <p className="text-xl font-bold text-center text-white relative z-10">{text}</p>
            <Button onClick={onDismiss} className="w-full h-15 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] relative z-10">
              🍻 ¡SALUD!
            </Button>
          </div>
        );
      case 'duel':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-2xl font-black text-white">
                    {currentPlayerName[0]}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{currentPlayerName}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">⚔️</span>
                <span className="text-[10px] font-black text-white/40 mt-1 tracking-tighter">VS</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 p-0.5 border border-white/20">
                  <div className="w-full h-full rounded-[14px] bg-slate-800 flex items-center justify-center text-2xl font-black text-white/40">
                    ?
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Rival</span>
              </div>
            </div>
            <p className="text-center text-sm font-bold text-white/80 px-4 italic opacity-80 leading-snug">"{text}"</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onDuelResult(true)} className="h-14 rounded-2xl bg-pink-600 hover:bg-pink-700 font-black text-xs text-white">GANÓ {currentPlayerName.slice(0,8)}</Button>
              <Button onClick={() => onDuelResult(false)} className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 font-black text-xs text-white">GANÓ RIVAL</Button>
            </div>
          </div>
        );
      case 'mimica':
        return (
          <div className="space-y-6">
            <motion.button
              onClick={() => setMimicaRevealed(r => !r)}
              className="w-full min-h-[140px] rounded-3xl border-2 border-dashed border-orange-400/30 bg-orange-500/5 flex items-center justify-center p-6 text-center group"
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {!mimicaRevealed ? (
                  <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <p className="text-4xl">👁️</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-400/60">Toca para revelar palabra</p>
                  </motion.div>
                ) : (
                  <motion.div key="shown" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <p className="text-3xl font-black text-white">{text}</p>
                    <p className="text-[10px] font-bold text-white/40 italic leading-snug">Representa esto sin hablar. Si adivinan, ¡premio! Si no, ¡castigo!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onChallengeResult(true)} className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black">✨ LOGRADO</Button>
              <Button onClick={() => onChallengeResult(false)} variant="ghost" className="h-14 rounded-2xl border border-white/10 text-white/50 font-bold">FALLADO</Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <p className="text-xl font-bold text-center text-white">{text}</p>
            <Button onClick={onDismiss} className="w-full h-15 rounded-2xl bg-white text-black font-black text-lg">CONTINUAR</Button>
          </div>
        );
    }
  };

  return (
    <div className={`w-full overflow-hidden flex flex-col p-6 rounded-[2.5rem] border border-white/15 bg-gradient-to-b ${
      type === 'challenge' ? 'from-indigo-900/90 to-slate-950/95' :
      type === 'trivia' ? 'from-emerald-900/90 to-slate-950/95' :
      type === 'drink' ? 'from-blue-900/90 to-slate-950/95' :
      type === 'duel' ? 'from-pink-900/90 to-slate-950/95' :
      type === 'mimica' ? 'from-orange-900/90 to-slate-950/95' :
      'from-slate-800/90 to-slate-950/95'
    } backdrop-blur-2xl shadow-2xl`}>
      <div className="text-center mb-6">
        <motion.span 
          animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl block filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-2"
        >
          {EVENT_ICONS[type] || '✨'}
        </motion.span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">{EVENT_LABELS[type] || 'Evento'}</h4>
        <p className="text-xs text-white/70 mt-1 font-bold">Turno de <span className="text-white text-sm font-black underline decoration-amber-400/50 underline-offset-4">{currentPlayerName}</span></p>
      </div>
      
      {renderContent()}
    </div>
  );
};

interface MegaBoardGameProps {
  onExit: () => void;
  localPlayerName: string;
  localPlayerAvatar?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MegaBoardGame({ onExit, localPlayerName, localPlayerAvatar }: MegaBoardGameProps) {
  const [board] = useState<BoardTile[]>(() => generateBoard());
  const [players, setPlayers] = useState<MBPlayer[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'event' | 'finished'>('setup');
  const [eventText, setEventText] = useState('');
  const [eventEmoji, setEventEmoji] = useState('');
  const [eventType, setEventType] = useState<'info' | 'challenge' | 'duel' | 'trivia' | 'roll_again' | 'mimica'>('info');
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ coins: 0, xp: 0, oldLevel: 1, newLevel: 1, streak: 0 });
  const [setupNames, setSetupNames] = useState<string[]>([localPlayerName, '']);
  const [triviaQuestion, setTriviaQuestion] = useState<any>(null);
  const [triviaAnswered, setTriviaAnswered] = useState(false);
  const [activeNorma, setActiveNorma] = useState<string | null>(null);
  const { updateMultiplePlayers } = useRanking();

  // 3D Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tilesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const playerMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const playerTargetsRef = useRef<Record<string, THREE.Vector3>>({});
  const activePlayerLightRef = useRef<THREE.PointLight | null>(null);
  const activeEdgeRef = useRef<THREE.LineSegments | null>(null);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const isVisibleRef = useRef(true);
  const [use3D, setUse3D] = useState(true);

  const orbitRef = useRef({
    isPointing: false,
    lastX: 0, lastY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 14
  });

  const currentPlayer = players[currentPlayerIdx];
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.position !== b.position) return b.position - a.position;
    return b.score - a.score;
  });

  const getVisibleTiles = useCallback(() => board, [board]);

  // Helper to get 3D position for a tile index (serpentine layout)
  const getTilePosition = useCallback((idx: number) => {
    const row = Math.floor(idx / 10);
    const col = row % 2 === 0 ? idx % 10 : 9 - (idx % 10);
    return new THREE.Vector3(col - 4.5, 0, row - 4.5);
  }, []);

  // 3D Canvas Lifecycle
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !use3D) return;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'low-power',
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // 3. Board Mesh (Instanced)
    const TILE_COLORS_3D: Record<string, THREE.Color> = {
      normal:    new THREE.Color('#1e293b'),
      challenge: new THREE.Color('#7c3aed'),
      trivia:    new THREE.Color('#059669'),
      duel:      new THREE.Color('#db2777'),
      drink:     new THREE.Color('#0284c7'),
      bonus:     new THREE.Color('#d97706'),
      trap:      new THREE.Color('#dc2626'),
      special:   new THREE.Color('#ea580c'),
    };

    const tileGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9);
    const tileMat = new THREE.MeshLambertMaterial();
    const tilesMesh = new THREE.InstancedMesh(tileGeo, tileMat, 100);
    const dummy = new THREE.Object3D();

    board.forEach((tile, idx) => {
      const pos = getTilePosition(idx);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      tilesMesh.setMatrixAt(idx, dummy.matrix);
      
      const typeKey = tile.type as string;
      const color = TILE_COLORS_3D[typeKey] || TILE_COLORS_3D.normal;
      tilesMesh.setColorAt(idx, color);
    });
    tilesMesh.instanceMatrix.needsUpdate = true;
    if (tilesMesh.instanceColor) tilesMesh.instanceColor.needsUpdate = true;
    scene.add(tilesMesh);
    tilesMeshRef.current = tilesMesh;

    // 4. Player Meshes
    const PLAYER_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    players.forEach((p, i) => {
      const geo = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 8);
      const mat = new THREE.MeshLambertMaterial({ color: PLAYER_COLORS[i % PLAYER_COLORS.length] });
      const mesh = new THREE.Mesh(geo, mat);
      const pos = getTilePosition(p.position);
      mesh.position.set(pos.x, 0.3, pos.z);
      scene.add(mesh);
      playerMeshesRef.current[p.id] = mesh;
      playerTargetsRef.current[p.id] = new THREE.Vector3(pos.x, 0.3, pos.z);

      if (i === currentPlayerIdx) {
        const light = new THREE.PointLight(0xffffff, 0.8, 2);
        light.position.set(0, 0.8, 0);
        mesh.add(light);
        activePlayerLightRef.current = light;
      }
    });

    // 5. Animation Loop
    let animId: number;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const targetFPS = isMobile ? 30 : 60;
    const interval = 1000 / targetFPS;
    let lastTime = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;
      if (time - lastTime < interval) return;
      lastTime = time;

      // Update Player Positions (LERP)
      Object.entries(playerTargetsRef.current).forEach(([id, target]) => {
        const mesh = playerMeshesRef.current[id];
        if (!mesh) return;
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, target.x, 0.12);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, target.z, 0.12);
        
        const distSq = Math.pow(mesh.position.x - target.x, 2) + Math.pow(mesh.position.z - target.z, 2);
        mesh.position.y = 0.3 + Math.sin(Math.sqrt(distSq) * Math.PI) * 1.2;
      });

      // Update Camera (Orbit)
      const { theta, phi, radius } = orbitRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(cameraTargetRef.current);

      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      scene.traverse(obj => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else (mat as any).dispose();
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
      tilesMeshRef.current = null;
      playerMeshesRef.current = {};
    };
  }, [use3D, board.length]);

  // Sync player target positions when players state changes
  useEffect(() => {
    players.forEach(p => {
      const pos = getTilePosition(p.position);
      playerTargetsRef.current[p.id] = pos;
    });

    if (sceneRef.current && tilesMeshRef.current) {
       // Update Active Edge
       if (activeEdgeRef.current) {
         sceneRef.current.remove(activeEdgeRef.current);
         activeEdgeRef.current.geometry.dispose();
       }
       const pos = getTilePosition(players[currentPlayerIdx]?.position || 0);
       const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.92, 0.12, 0.92));
       const edgeMat = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
       const edge = new THREE.LineSegments(edgeGeo, edgeMat);
       edge.position.set(pos.x, 0, pos.z);
       sceneRef.current.add(edge);
       activeEdgeRef.current = edge;

       // Update Active Player Light
       const activePId = players[currentPlayerIdx]?.id;
       Object.entries(playerMeshesRef.current).forEach(([pid, mesh]) => {
         if (pid === activePId) {
            if (!activePlayerLightRef.current) {
                const light = new THREE.PointLight(0xffffff, 0.8, 2);
                light.position.set(0, 0.8, 0);
                mesh.add(light);
                activePlayerLightRef.current = light;
            } else if (activePlayerLightRef.current.parent !== mesh) {
                activePlayerLightRef.current.parent?.remove(activePlayerLightRef.current);
                mesh.add(activePlayerLightRef.current);
            }
         }
       });
    }
  }, [players, currentPlayerIdx, getTilePosition]);

  // Pause when not visible
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const observer = new IntersectionObserver(([entry]) => { isVisibleRef.current = entry.isIntersecting; }, { threshold: 0.1 });
    observer.observe(mount);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    orbitRef.current.isPointing = true;
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!orbitRef.current.isPointing) return;
    orbitRef.current.theta -= (e.clientX - orbitRef.current.lastX) * 0.008;
    orbitRef.current.phi -= (e.clientY - orbitRef.current.lastY) * 0.008;
    orbitRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, orbitRef.current.phi));
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
  };
  const handlePointerUp = () => { orbitRef.current.isPointing = false; };

  const lastPinchDistRef = useRef(0);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastPinchDistRef.current > 0) {
        orbitRef.current.radius -= (dist - lastPinchDistRef.current) * 0.05;
        orbitRef.current.radius = Math.max(8, Math.min(25, orbitRef.current.radius));
      }
      lastPinchDistRef.current = dist;
    }
  };

  const startGame = () => {
    const activePlayers = setupNames
      .filter(n => n.trim().length > 0)
      .map((name, i) => ({
        id: `p${i}`,
        name: name.trim(),
        avatarUrl: i === 0 ? localPlayerAvatar : undefined,
        position: 0,
        score: 0,
        skipNextTurn: false,
        shielded: false,
      }));
    if (activePlayers.length < 2) {
      toast.error('Necesitas al menos 2 jugadores.');
      return;
    }
    setPlayers(shuffleArray(activePlayers));
    setGamePhase('playing');
  };

  const rollDice = () => {
    if (rolling || gamePhase !== 'playing') return;
    if (currentPlayer.skipNextTurn) {
      toast.info(`${currentPlayer.name} pierde turno.`);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, skipNextTurn: false } : p));
      nextTurn();
      return;
    }
    setRolling(true);
    setDiceValue(null);
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDiceValue(value);
      setRolling(false);
      movePlayer(value);
    }, 800);
  };

  const movePlayer = (steps: number) => {
    const newPos = Math.min(currentPlayer.position + steps, 99);
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIdx ? { ...p, position: newPos } : p
    ));

    // Check finish
    if (newPos >= 99) {
      handleWin();
      return;
    }

    // Trigger tile event
    const tile = board[newPos];
    setTimeout(() => triggerTileEvent(tile, newPos), 400);
  };

  const triggerTileEvent = (tile: BoardTile, pos: number) => {
    switch (tile.type) {
      case 'challenge': {
        const challenge = getRandomWithoutRepeat('megaboard_challenge', clasico);
        const text = challenge.replace(/{player}/g, currentPlayer.name);
        setEventEmoji('🎯');
        setEventText(text);
        setEventType('challenge');
        setGamePhase('event');
        break;
      }
      case 'drink': {
        const drink = getRandomWithoutRepeat('megaboard_drink', DRINK_EVENTS);
        setEventEmoji('🍺');
        setEventText(drink);
        setEventType('info');
        setGamePhase('event');
        break;
      }
      case 'trivia': {
        const q = getRandomWithoutRepeat('megaboard_trivia', cultureQuestionsNew2025);
        setTriviaQuestion(q);
        setTriviaAnswered(false);
        setEventEmoji('🧠');
        setEventText(`TRIVIA: ${q.question}`);
        setEventType('trivia');
        setGamePhase('event');
        break;
      }
      case 'duel': {
        const duel = getRandomWithoutRepeat('megaboard_duel', duelos);
        setEventEmoji('⚔️');
        setEventText(`${duel.name}: ${duel.description}`);
        setEventType('duel');
        setGamePhase('event');
        break;
      }
      case 'bonus': {
        setEventEmoji('⭐');
        setEventText(tile.text || '¡BONUS!');
        applyBonus(tile);
        // Don't show modal for simple bonuses
        nextTurn();
        break;
      }
      case 'trap': {
        if (currentPlayer.shielded) {
          setEventEmoji('🛡️');
          setEventText('¡Tu escudo te protegió! La trampa no tiene efecto.');
          setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, shielded: false } : p));
          nextTurn();
        } else {
          setEventEmoji('💀');
          setEventText(tile.text || '¡TRAMPA!');
          applyTrap(tile);
          // Don't show modal for simple traps
          nextTurn();
        }
        break;
      }
      case 'mimica': {
        const mimica = getRandomWithoutRepeat('megaboard_mimica', mimicaChallenges);
        setEventEmoji('🎭');
        setEventText(mimica.text); // Just the text, card will handle formatting
        setEventType('mimica');
        setGamePhase('event');
        break;
      }
      case 'random': {
        setEventEmoji('🎲');
        setEventText(tile.text || '¡AZAR!');
        applyRandomTile(tile);
        nextTurn();
        break;
      }
      case 'norma': {
        const norma = normasRonda[Math.floor(Math.random() * normasRonda.length)];
        const cleanNorma = norma.replace(/^NORMA:\s*/, '');
        setActiveNorma(cleanNorma);
        setEventEmoji('📜');
        setEventText(`¡NUEVA NORMA para todos!\n\n${cleanNorma}`);
        setGamePhase('event');
        break;
      }
      case 'oca': {
        setEventEmoji('🦢');
        setEventText('¡De Oca a Oca y tiro porque me toca!\nAvanzas a la siguiente Oca y VUELVES A TIRAR.');
        const nextOca = ocaTilesList.find(o => o > pos);
        if (nextOca) {
          setTimeout(() => {
            setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: nextOca } : p));
          }, 1500);
        }
        setEventType('roll_again');
        setGamePhase('event');
        break;
      }
      case 'puente': {
        setEventEmoji('🌉');
        setEventText('¡De puente a puente y tiro porque me lleva la corriente!\nTe mueves al otro puente y VUELVES A TIRAR.');
        if (pos === 6) {
          setTimeout(() => setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: 12 } : p)), 1500);
        } else if (pos === 12) {
          setTimeout(() => setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: 6 } : p)), 1500);
        }
        setEventType('roll_again');
        setGamePhase('event');
        break;
      }
      case 'posada': {
        setEventEmoji('🏨');
        setEventText('¡Has caído en la Posada!\nPierdes 1 turno descansando.');
        applyTrap(tile);
        setGamePhase('event');
        break;
      }
      case 'pozo': {
        setEventEmoji('🕳️');
        setEventText('¡Has caído en el pozo!\nMientras esperas el rescate, bebe 2 tragos y pierdes 1 turno.');
        applyTrap(tile);
        setGamePhase('event');
        break;
      }
      case 'laberinto': {
        setEventEmoji('🧭');
        setEventText('¡Te has perdido en el laberinto!\nRetrocedes a la casilla 30.');
        setTimeout(() => setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: 30 } : p)), 1500);
        setGamePhase('event');
        break;
      }
      case 'carcel': {
        setEventEmoji('⛓️');
        setEventText('¡Vas directo a la Cárcel!\nPierdes 1 turno y bebes 3 tragos.');
        applyTrap(tile);
        setGamePhase('event');
        break;
      }
      case 'calavera': {
        setEventEmoji('☠️');
        setEventText('¡LA CALAVERA!\nHas muerto. Vuelves a la casilla 1.');
        applyTrap(tile);
        setGamePhase('event');
        break;
      }
      default:
        nextTurn();
    }
  };

  const applyBonus = (tile: BoardTile) => {
    if (!tile.effect) return;
    switch (tile.effect.type) {
      case 'advance':
        movePlayer(tile.effect.value || 3);
        break;
      case 'roll_again':
        setEventType('roll_again');
        toast.success("¡Vuelves a tirar!");
        break;
      case 'score':
        setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + (tile.effect?.value || 20) } : p));
        break;
      case 'shield':
        setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, shielded: true } : p));
        break;
      case 'steal': {
        const others = players.filter((_, i) => i !== currentPlayerIdx);
        if (others.length > 0) {
          const victim = others[Math.floor(Math.random() * others.length)];
          const val = tile.effect.value || 5;
          setPlayers(prev => prev.map(p => {
            if (p.id === victim.id) return { ...p, score: Math.max(0, p.score - val) };
            if (p.id === currentPlayer.id) return { ...p, score: p.score + val };
            return p;
          }));
        }
        break;
      }
    }
  };

  const applyTrap = (tile: BoardTile) => {
    if (!tile.effect) return;
    switch (tile.effect.type) {
      case 'back':
      case 'advance': // handled with negative value
        movePlayer(tile.effect.value || -3);
        break;
      case 'skip':
        setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, skipNextTurn: true } : p));
        break;
      case 'reset':
        setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: 0 } : p));
        break;
    }
  };

  const applyRandomTile = (tile: BoardTile) => {
    if (!tile.effect) return;
    switch (tile.effect.type) {
      case 'swap_top': {
        const sorted = [...players].sort((a,b) => b.position - a.position);
        if (sorted.length >= 2) {
            const p1 = sorted[0];
            const p2 = sorted[1];
            setPlayers(prev => prev.map(p => {
                if (p.id === p1.id) return { ...p, position: p2.position };
                if (p.id === p2.id) return { ...p, position: p1.position };
                return p;
            }));
        }
        break;
      }
      case 'move_all_others': {
        setPlayers(prev => prev.map((p, i) => i !== currentPlayerIdx ? { ...p, position: Math.max(0, p.position + (tile.effect?.value || -1)) } : p));
        break;
      }
      case 'swap_left': {
        const prevIdx = (currentPlayerIdx - 1 + players.length) % players.length;
        const other = players[prevIdx];
        const myPos = currentPlayer.position;
        setPlayers(prev => prev.map(p => {
            if (p.id === currentPlayer.id) return { ...p, position: other.position };
            if (p.id === other.id) return { ...p, position: myPos };
            return p;
        }));
        break;
      }
      case 'score': {
        setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + (tile.effect?.value || 15) } : p));
        break;
      }
    }
  };

  const handleTriviaAnswer = (answer: string) => {
    if (triviaAnswered) return;
    setTriviaAnswered(true);
    const correct = answer === triviaQuestion?.correct_answer;
    if (correct) {
      toast.success('¡Correcto! +15 XP');
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + 15 } : p));
    } else {
      toast.error(`Incorrecto. Retrocedes 1 casilla.`);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: Math.max(0, p.position - 1) } : p));
    }
  };

  const handleChallengeResult = (passed: boolean) => {
    if (!passed) {
      const penalty = currentPlayer.position >= 70 ? 3 : currentPlayer.position >= 40 ? 2 : 1;
      toast.error(`❌ Has fallado. Retrocedes ${penalty} casilla${penalty > 1 ? 's' : ''}.`);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: Math.max(0, p.position - penalty) } : p));
    } else {
      toast.success('✨ ¡Reto superado! +10 XP');
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + 10 } : p));
    }
    dismissEvent();
  };

  const handleDuelResult = (won: boolean) => {
    if (won) {
      toast.success('👑 ¡Has ganado el duelo! +15 XP');
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + 15 } : p));
    } else {
      const penalty = currentPlayer.position >= 70 ? 3 : currentPlayer.position >= 40 ? 2 : 1;
      toast.error(`💀 Has perdido. Retrocedes ${penalty} casilla${penalty > 1 ? 's' : ''}.`);
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, position: Math.max(0, p.position - penalty) } : p));
    }
    dismissEvent();
  };

  const dismissEvent = () => {
    setTriviaQuestion(null);
    setTriviaAnswered(false);
    setGamePhase('playing');
    if (eventType !== 'roll_again') {
        nextTurn();
    } else {
        setEventType('info'); // Reset to default
    }
  };

  const nextTurn = () => {
    setDiceValue(null);
    setCurrentPlayerIdx(prev => (prev + 1) % players.length);
  };

  const handleWin = async () => {
    setGamePhase('finished');
    
    // Sync to Hall of Fame (Local + Global)
    await updateMultiplePlayers(players.map(p => ({
        name: p.name,
        score: p.id === currentPlayer?.id ? p.score + 50 : p.score,
        won: p.id === currentPlayer?.id,
        avatarUrl: p.avatarUrl,
        gameMode: 'megaboard' as any
    })));

    const rankings = loadLocalRankings();
    const result = rankings.find(r => r.player_name.toLowerCase() === currentPlayer.name.toLowerCase());
    
    setRewardData({
      coins: 30, xp: currentPlayer.score + 50,
      oldLevel: result?.level || 1, newLevel: result?.level || 1,
      streak: result?.win_streak || 0
    });
    setShowReward(true);
  };

  const getDiceIcon = (v: number) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    return icons[v - 1] || Dice1;
  };

  // ─── Visible Board Rendering (3D Isometric Path) ─────────────────────────────
  const VISIBLE_RANGE = 100; // Show full board

  // ─── SETUP SCREEN ────────────────────────────────────────────────────────────
  if (gamePhase === 'setup') {
    return (
      <div className="fixed inset-0 z-50 premium-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-panel rounded-[30px] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏰</div>
            <h2 className="text-3xl font-black premium-title">MegaBoard</h2>
            <p className="text-sm text-white/50 mt-1">100 casillas · más tragos · retos · trivia · hasta 20 jugadores</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-white/60">
            <span className="font-bold uppercase tracking-[0.18em]">Jugadores</span>
            <span className="font-black text-white">{setupNames.filter(name => name.trim().length > 0).length} / {MAX_MEGABOARD_PLAYERS}</span>
          </div>

          <div className="space-y-3 mb-4">
            {setupNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 ${i === 0 ? 'bg-gradient-to-br from-amber-500 to-rose-500' : 'bg-white/10'}`}>
                  {i === 0 ? '👑' : `${i + 1}`}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    const newNames = [...setupNames];
                    newNames[i] = e.target.value;
                    setSetupNames(newNames);
                  }}
                  placeholder={i === 0 ? localPlayerName : `Jugador ${i + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
                  readOnly={i === 0}
                />
                {i > 1 && (
                  <button
                    onClick={() => setSetupNames(prev => prev.filter((_, idx) => idx !== i))}
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {setupNames.length < MAX_MEGABOARD_PLAYERS && (
            <Button
              variant="ghost"
              onClick={() => setSetupNames(prev => [...prev, ''])}
              className="w-full mb-4 border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40"
            >
              + Añadir jugador
            </Button>
          )}

          <Button onClick={startGame} className="w-full h-14 rounded-xl font-black text-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/50">
            🎲 ¡EMPEZAR PARTIDA!
          </Button>
          <Button variant="ghost" onClick={onExit} className="w-full mt-3 text-white/40 hover:text-white/60">
            ← Volver
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN GAME SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 premium-screen text-white flex flex-col overflow-hidden">
      {/* Event UI Modal */}
      <AnimatePresence>
        {gamePhase === 'event' && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative w-full max-w-md"
              initial={{ y: '100%', scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: '150%', scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              <EventCard
                type={eventType}
                text={eventText}
                currentPlayerName={currentPlayer?.name || 'Jugador'}
                players={players}
                triviaQuestion={triviaQuestion}
                triviaAnswered={triviaAnswered}
                onTriviaAnswer={handleTriviaAnswer}
                onChallengeResult={handleChallengeResult}
                onDuelResult={handleDuelResult}
                onDismiss={dismissEvent}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-3 md:p-5 shrink-0"><div className="premium-panel rounded-[28px] px-4 py-4 md:px-5 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-black premium-title">🏰 MegaBoard</h2>
          {activeNorma && (
            <div className="hidden md:flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1 text-xs text-orange-300 max-w-[200px] truncate">
              📜 {activeNorma}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUse3D(d => !d)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${use3D ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/50 border-white/10'}`}
          >
            {use3D ? '2D MODE' : '3D MODE'}
          </button>
          <Button variant="destructive" size="sm" onClick={onExit} className="rounded-xl font-bold">
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </div></div>

      {/* Active Norma Mobile */}
      {activeNorma && (
        <div className="md:hidden px-4 pb-2"> <div className="premium-panel-soft rounded-2xl px-4 py-3 border border-orange-500/20">
          <p className="text-xs text-orange-300 truncate">📜 {activeNorma}</p>
        </div></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden px-3 pb-3 md:px-5 md:pb-5 gap-4">
        {/* Board Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="premium-stat">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Turno</p>
              <p className="text-lg md:text-xl font-black truncate">{currentPlayer?.name || '...'}</p>
            </div>
            <div className="premium-stat">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Líder</p>
              <p className="text-lg md:text-xl font-black truncate">{sortedPlayers[0]?.name || '...'}</p>
            </div>
            <div className="premium-stat">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Meta</p>
              <p className="text-lg md:text-xl font-black">Casilla 99</p>
            </div>
            <div className="premium-stat">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Jugadores</p>
              <p className="text-lg md:text-xl font-black">{players.length}</p>
            </div>
          </div>

          <div className="flex-1 premium-panel rounded-[30px] p-2 relative overflow-hidden group">
            {use3D ? (
              <div 
                ref={mountRef} 
                className="w-full h-full rounded-[24px] overflow-hidden bg-slate-950/50 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchMove={handleTouchMove}
              />
            ) : (
                /* Original Board Grid (Simplified for performance when 3D is active) */
                <div className="relative w-full h-full rounded-[24px] border border-white/8 bg-white/[0.03] p-3 md:p-4 overflow-auto custom-scrollbar">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 md:gap-3">
                    {getVisibleTiles().map((tile) => {
                      const playersOnTile = players.filter(p => p.position === tile.id);
                      const isCurrentTile = currentPlayer && currentPlayer.position === tile.id;
                      return (
                        <div
                          key={tile.id}
                          className={`relative w-full aspect-square rounded-2xl border flex flex-col items-center justify-center text-center backdrop-blur-[2px] transition-all
                            ${isCurrentTile ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}
                            bg-gradient-to-br ${tile.color} border-white/20 shadow-lg`}
                        >
                          <span className="absolute top-1 left-1.5 text-[8px] font-bold text-white/60">{tile.id}</span>
                          <span className="text-xl md:text-2xl">{tile.emoji}</span>
                          <span className="px-1 text-[8px] md:text-[9px] font-black text-white/90 leading-tight uppercase tracking-tighter">{tile.label}</span>
                          {playersOnTile.length > 0 && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center bg-black/40 rounded-full px-1 py-0.5 border border-white/10">
                              {playersOnTile.map(p => (
                                <div key={p.id} className="w-3 h-3 rounded-full bg-amber-400 border border-white/20" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
            )}
            
            {/* 3D Guide overlay */}
            {use3D && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none"
              >
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/60">
                   1 dedo para rotar · 2 para zoom
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar — Leaderboard + Controls */}
        <div className="w-full md:w-80 premium-panel rounded-[30px] p-4 flex flex-col gap-3 shrink-0">
          {/* Leaderboard */}
          <div className="premium-panel-soft rounded-[24px] p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Clasificación
            </h3>
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1 custom-scrollbar">
              {sortedPlayers.map((p, i) => (
                <motion.div 
                  key={p.id} 
                  layout
                  className={`flex items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 ${
                    p.id === currentPlayer?.id 
                      ? 'bg-amber-500/15 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[10px] font-black w-5 text-center ${i < 3 ? 'text-amber-400' : 'text-white/40'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{p.name[0]}</div>
                      )}
                    </div>
                    {p.id === currentPlayer?.id && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute -inset-1 rounded-full border border-amber-500/50 animate-pulse"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black tracking-tight truncate">{p.name}</div>
                    <div className="text-[9px] font-bold text-white/30 truncate">
                      CASILLA {p.position} <span className="mx-1">·</span> {p.score} XP
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.shielded && <span className="text-[10px] filter drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]">🛡️</span>}
                    {p.skipNextTurn && <span className="text-[10px] filter drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]">⏭️</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Dice & Controls */}
          <div className="premium-panel-soft rounded-[24px] p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Turno de</p>
            <p className="text-lg font-black text-amber-400 mb-3">{currentPlayer?.name || '...'}</p>

            {/* Dice Display */}
            <div className="flex justify-center mb-4">
              <motion.div
                animate={rolling ? { 
                  rotateX: [0, 360, 720, 1080], 
                  rotateY: [0, 180, 540, 900],
                  scale: [1, 1.2, 0.9, 1.1, 1],
                  y: [0, -20, 10, -5, 0]
                } : { 
                  scale: [1, 1.05, 1],
                  transition: { repeat: Infinity, duration: 2 }
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-24 h-24 rounded-[28px] bg-white text-slate-900 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.2)] border-4 border-white/50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-black/5 pointer-events-none" />
                <span className="text-5xl font-black relative z-10">
                  {rolling ? '🎲' : diceValue || '?'}
                </span>
                {!rolling && diceValue && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-1"
                  >
                    Pasos
                  </motion.span>
                )}
              </motion.div>
            </div>

            <Button
              onClick={rollDice}
              disabled={rolling || gamePhase !== 'playing'}
              className="w-full h-14 rounded-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-white shadow-[0_0_18px_rgba(245,158,11,0.28)] border border-white/10 disabled:opacity-30"
            >
              {rolling ? 'Tirando...' : '🎲 TIRAR DADO'}
            </Button>
          </div>
        </div>
      </div>



      {/* GAME OVER OVERLAY */}
      <AnimatePresence>
        {gamePhase === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[70] premium-screen backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
              <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-8xl mb-6">
                🏆
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-2">¡{currentPlayer?.name} GANA!</h2>
              <p className="text-xl text-white/70 mb-6">Ha llegado a la meta con {currentPlayer?.score} XP</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={onExit} className="h-14 px-8 rounded-xl font-bold bg-white/20 hover:bg-white/30 text-white border border-white/20">
                  Volver al Menú
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RewardPopup
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        result="win"
        coinsEarned={rewardData.coins}
        xpEarned={rewardData.xp}
        oldLevel={rewardData.oldLevel}
        newLevel={rewardData.newLevel}
        streak={rewardData.streak}
      />
    </div>
  );
}
