import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, X, ArrowRight, Flame, Timer, Star, RotateCcw } from 'lucide-react';
import { speedRoundQuestions, SPEED_CATEGORIES, type SpeedQuestion } from '@/data/speedRoundContent';
import { hapticFeedback } from '@/utils/haptics';

interface SpeedRoundGameProps {
  onExit: () => void;
  players?: any[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type GamePhase = 'menu' | 'playing' | 'result' | 'summary';

export function SpeedRoundGame({ onExit, players }: SpeedRoundGameProps) {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SpeedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const TOTAL_QUESTIONS = 15;
  const TIME_PER_QUESTION = 10;

  const startGame = useCallback((category: string | null) => {
    setSelectedCategory(category);
    const pool = category
      ? speedRoundQuestions.filter(q => q.category === category)
      : speedRoundQuestions;
    const shuffled = shuffleArray(pool).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(TIME_PER_QUESTION);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTotalAnswered(0);
    setCorrectCount(0);
    setPhase('playing');
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || selectedAnswer !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1); // timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentIndex, selectedAnswer]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentIndex];
    const correct = index === q?.correct;
    setSelectedAnswer(index);
    setIsCorrect(correct);
    setTotalAnswered(prev => prev + 1);

    if (correct) {
      const comboMultiplier = Math.min(combo + 1, 5);
      const timeBonus = Math.floor(timeLeft * 2);
      const points = 100 * comboMultiplier + timeBonus;
      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo > bestCombo) setBestCombo(newCombo);
        return newCombo;
      });
      setCorrectCount(prev => prev + 1);
      hapticFeedback.success();
    } else {
      setCombo(0);
      hapticFeedback.error();
    }

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setPhase('summary');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setTimeLeft(TIME_PER_QUESTION);
      }
    }, 1200);
  }, [selectedAnswer, questions, currentIndex, combo, bestCombo, timeLeft]);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;
  const timerPercent = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerColor = timeLeft <= 3 ? '#ef4444' : timeLeft <= 6 ? '#f59e0b' : '#22c55e';

  // ── MENU ──
  if (phase === 'menu') {
    return (
      <div className="min-h-screen premium-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
              <Zap className="w-4 h-4" /> Speed Round
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
              Ronda<br />
              <span style={{
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Relámpago</span>
            </h1>
            <p className="text-white/40 text-sm">15 preguntas · 10 segundos cada una · combos = puntos</p>
          </motion.div>

          <div className="space-y-3 mb-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startGame(null)}
              className="w-full p-4 rounded-[24px] text-left flex items-center gap-4 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.08))',
                border: '1px solid rgba(34,211,238,0.25)',
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl shrink-0">🌀</div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-white">Mezcla Total</p>
                <p className="text-xs text-white/40">Todas las categorías mezcladas</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400 shrink-0" />
            </motion.button>

            {SPEED_CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (i + 1) * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startGame(cat.id)}
                className="w-full p-4 rounded-[24px] text-left flex items-center gap-4 transition-all hover:bg-white/[0.06]"
                style={{
                  background: `linear-gradient(135deg, ${cat.color}18, transparent)`,
                  border: `1px solid ${cat.color}30`,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shrink-0"
                  style={{ background: `${cat.color}20` }}>
                  {cat.label.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-white">{cat.label.split(' ').slice(1).join(' ')}</p>
                  <p className="text-xs text-white/40">{speedRoundQuestions.filter(q => q.category === cat.id).length} preguntas</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 shrink-0" />
              </motion.button>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onExit}
            className="w-full py-3 text-center text-sm font-bold text-white/30 hover:text-white/60 transition-colors"
          >
            ← Volver al menú
          </motion.button>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  if (phase === 'playing' && currentQ) {
    return (
      <div className="min-h-screen premium-screen flex flex-col px-4 py-6">
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={onExit} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {combo >= 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-black text-orange-300">x{Math.min(combo, 5)}</span>
                </motion.div>
              )}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-black text-white">{score}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/5 mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Timer circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <motion.circle
                  cx="40" cy="40" r="35" fill="none"
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={220}
                  animate={{ strokeDashoffset: 220 - (220 * timerPercent / 100) }}
                  transition={{ duration: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{timeLeft}</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                  {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{
                    background: (SPEED_CATEGORIES.find(c => c.id === currentQ.category)?.color || '#60a5fa') + '20',
                    color: SPEED_CATEGORIES.find(c => c.id === currentQ.category)?.color || '#60a5fa',
                  }}>
                  {SPEED_CATEGORIES.find(c => c.id === currentQ.category)?.label.split(' ').slice(1).join(' ')}
                </span>
              </div>

              <div className="rounded-[24px] p-5 mb-6" style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}>
                <p className="text-xl font-black text-white leading-snug text-center">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrectOption = i === currentQ.correct;
                  const showResult = selectedAnswer !== null;

                  let bg = 'rgba(255,255,255,0.04)';
                  let border = 'rgba(255,255,255,0.10)';
                  if (showResult && isCorrectOption) {
                    bg = 'rgba(34,197,94,0.20)';
                    border = '#22c55e';
                  } else if (showResult && isSelected && !isCorrectOption) {
                    bg = 'rgba(239,68,68,0.20)';
                    border = '#ef4444';
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={!showResult ? { scale: 0.96 } : {}}
                      animate={showResult && isSelected && !isCorrectOption ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      onClick={() => !showResult && handleAnswer(i)}
                      disabled={showResult}
                      className="w-full p-4 rounded-[20px] text-left font-bold text-white transition-all flex items-center gap-3"
                      style={{ background: bg, border: `2px solid ${border}` }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shrink-0"
                        style={{
                          background: showResult && isCorrectOption ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)',
                          color: showResult && isCorrectOption ? '#22c55e' : 'rgba(255,255,255,0.5)',
                        }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── SUMMARY ──
  if (phase === 'summary') {
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const grade = accuracy >= 90 ? { label: 'LEYENDA', emoji: '👑', color: '#fbbf24' }
      : accuracy >= 70 ? { label: 'PRO', emoji: '🔥', color: '#f97316' }
      : accuracy >= 50 ? { label: 'BIEN', emoji: '✅', color: '#22c55e' }
      : { label: 'NOVATO', emoji: '💀', color: '#ef4444' };

    return (
      <div className="min-h-screen premium-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="rounded-[32px] p-6 text-center" style={{
            background: 'linear-gradient(160deg, rgba(25,15,45,0.95), rgba(12,8,25,0.92))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px -28px rgba(0,0,0,0.95)',
          }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="text-6xl mb-4"
            >
              {grade.emoji}
            </motion.div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-black uppercase tracking-[0.2em]"
              style={{ background: `${grade.color}20`, color: grade.color, border: `1px solid ${grade.color}40` }}>
              {grade.label}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl font-black text-white mb-1"
            >
              {score}
            </motion.p>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">puntos totales</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-[20px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-black text-white">{correctCount}/{totalAnswered}</p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mt-1">Aciertos</p>
              </div>
              <div className="rounded-[20px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-black text-white">{accuracy}%</p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mt-1">Precisión</p>
              </div>
              <div className="rounded-[20px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />{bestCombo}
                </p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mt-1">Mejor combo</p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => startGame(selectedCategory)}
                className="flex-1 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                  boxShadow: '0 8px 32px -8px rgba(34,211,238,0.5)',
                }}
              >
                <RotateCcw className="w-4 h-4" /> Otra vez
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onExit}
                className="px-6 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
              >
                Salir
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

export default SpeedRoundGame;
