
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Phone, Users2, Percent, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CultureQuestion } from '@/data/cultureQuestions';
import { FootballQuestion } from '@/data/footballQuestionsNew';
import { getFamousHint } from '@/data/famousCalls';
import { QuestionVote } from './QuestionVote';
import confetti from 'canvas-confetti';
import { cleanGameText } from '@/utils/sanitize';

interface TriviaQuestionCardProps {
  question: CultureQuestion | FootballQuestion;
  onAnswer: (isCorrect: boolean, points: number) => void;
  playerName: string;
  playerId?: string;
  questionNumber?: number;
  timeLimit?: number;
  showComodines?: boolean;
  canUseLifeline?: (comodin: '50:50' | 'publico' | 'llamada') => boolean;
  onUseLifeline?: (comodin: '50:50' | 'publico' | 'llamada') => void;
  getCooldownRemaining?: (comodin: '50:50' | 'publico' | 'llamada') => number;
}

type Comodin = '50:50' | 'publico' | 'llamada';

export function TriviaQuestionCard({
  question,
  onAnswer,
  playerName,
  playerId,
  questionNumber = 0,
  timeLimit = 30,
  showComodines = true,
  canUseLifeline,
  onUseLifeline,
  getCooldownRemaining,
}: TriviaQuestionCardProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [usedComodinesThisQuestion, setUsedComodinesThisQuestion] = useState<Comodin[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [publicVotes, setPublicVotes] = useState<number[] | null>(null);
  const [famousHint, setFamousHint] = useState<{ name: string; avatar: string; hint: string } | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const options = question?.options || [];
  const correctIndex = typeof question?.correctIndex === 'number' 
    ? Math.max(0, Math.min(question.correctIndex, options.length - 1)) 
    : 0;

  // CRITICAL GUARD: Prevent .map of undefined crashes
  // Auto-skip after 3 seconds to avoid permanent loading screen
  useEffect(() => {
    if (!question || !options || !Array.isArray(options) || options.length === 0) {
      const autoSkipTimer = setTimeout(() => {
        onAnswer(false, 0);
      }, 3000);
      return () => clearTimeout(autoSkipTimer);
    }
  }, [question, options]);

  if (!question || !options || !Array.isArray(options) || options.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-auto h-[75vh] min-h-[500px] flex flex-col items-center justify-center relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-[url('/modern_bg.png')] bg-cover bg-center border border-white/10"
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
        <div className="relative z-10 flex flex-col items-center p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white/20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cargando pregunta...</h2>
            <p className="text-sm text-white/40 mb-3">Saltando automáticamente en 3s...</p>
            <Button onClick={() => onAnswer(false, 0)} variant="ghost" size="sm" className="text-white bg-white/10 hover:bg-white/20 rounded-full px-6">
            Saltar ahora
            </Button>
        </div>
      </motion.div>
    );
  }

  // Reset state when the question changes
  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelectedAnswer(null);
    setShowResult(false);
    setUsedComodinesThisQuestion([]);
    setEliminatedOptions([]);
    setPublicVotes(null);
    setFamousHint(null);
    setIsPaused(false);

    // Bug 15: TTS Safely check existence of window.speechSynthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [question?.question, timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (showResult || isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, isPaused, timeLeft]);

  const hasHandledResult = useRef(false);

  useEffect(() => {
    hasHandledResult.current = false;
  }, [question?.question]);

  const handleTimeUp = () => {
    if (!showResult && !hasHandledResult.current) {
      hasHandledResult.current = true;
      setShowResult(true);
      setTimeout(() => onAnswer(false, 0), 2000);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult || eliminatedOptions.includes(index) || hasHandledResult.current) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || hasHandledResult.current) return;
    hasHandledResult.current = true;

    const isCorrect = selectedAnswer === correctIndex;
    const points = isCorrect ? getDifficultyPoints() : 0;

    if (isCorrect) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    setShowResult(true);
    setTimeout(() => onAnswer(isCorrect, points), 2000);
  };

  const getDifficultyPoints = () => {
    const diff = typeof question.difficulty === 'number' ? question.difficulty : 1;
    // Better scoring: base 10 + bonus per difficulty
    return 10 + (diff - 1) * 8;
  };

  // Check if player can use a specific lifeline (cooldown system)
  const checkCanUseLifeline = (comodin: Comodin): boolean => {
    if (usedComodinesThisQuestion.includes(comodin)) return false;
    if (canUseLifeline) return canUseLifeline(comodin);
    return true;
  };

  const getLifelineCooldown = (comodin: Comodin): number => {
    if (getCooldownRemaining) return getCooldownRemaining(comodin);
    return 0;
  };

  // Comodín 50:50
  const use5050 = () => {
    if (!checkCanUseLifeline('50:50')) return;

    setUsedComodinesThisQuestion(prev => [...prev, '50:50']);
    onUseLifeline?.('50:50');

    // Eliminate 2 wrong answers
    const wrongIndices = options
      .map((_, i) => i)
      .filter(i => i !== correctIndex);

    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    setEliminatedOptions([shuffled[0], shuffled[1]]);
  };

  // Comodín Público - More competitive/confusing voting
  const usePublico = () => {
    if (!checkCanUseLifeline('publico')) return;

    setUsedComodinesThisQuestion(prev => [...prev, 'publico']);
    onUseLifeline?.('publico');
    setIsPaused(true);

    // Generate competitive public votes (3 options should be close!)
    const baseVotes = options.map((_, i) => {
      if (i === correctIndex) {
        // Correct answer gets 25-40% (not too obvious)
        return 25 + Math.floor(Math.random() * 15);
      }
      return 0;
    });

    // Distribute remaining votes to make it competitive
    const correctVotes = baseVotes[correctIndex];
    let remaining = 100 - correctVotes;

    // Pick 2 wrong answers to give competitive percentages
    const wrongIndices = options.map((_, i) => i).filter(i => i !== correctIndex);
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);

    // First competitor gets 20-35%
    const competitor1Votes = 20 + Math.floor(Math.random() * 15);
    baseVotes[shuffled[0]] = Math.min(competitor1Votes, remaining);
    remaining -= baseVotes[shuffled[0]];

    // Second competitor gets 15-25%
    const competitor2Votes = 15 + Math.floor(Math.random() * 10);
    baseVotes[shuffled[1]] = Math.min(competitor2Votes, remaining);
    remaining -= baseVotes[shuffled[1]];

    // Last option gets the rest
    if (shuffled[2] !== undefined) {
      baseVotes[shuffled[2]] = remaining;
    } else {
      // Distribute remaining to first two competitors
      baseVotes[shuffled[0]] += Math.floor(remaining / 2);
      baseVotes[shuffled[1]] += remaining - Math.floor(remaining / 2);
    }

    // Shuffle the order of close votes to make it less predictable
    // Sometimes make a wrong answer have the highest vote
    if (Math.random() < 0.3) {
      const temp = baseVotes[correctIndex];
      const swapWith = shuffled[0];
      baseVotes[correctIndex] = baseVotes[swapWith] - Math.floor(Math.random() * 5);
      baseVotes[swapWith] = temp + Math.floor(Math.random() * 5);
    }

    // Normalize to 100%
    const total = baseVotes.reduce((a, b) => a + b, 0);
    const normalized = baseVotes.map(v => Math.round((v / total) * 100));

    // Adjust to exactly 100
    const diff = 100 - normalized.reduce((a, b) => a + b, 0);
    normalized[correctIndex] += diff;

    setPublicVotes(normalized);

    setTimeout(() => setIsPaused(false), 3000);
  };

  // Comodín Llamada a famoso - Now more cryptic
  const useLlamada = () => {
    if (!checkCanUseLifeline('llamada')) return;

    setUsedComodinesThisQuestion(prev => [...prev, 'llamada']);
    onUseLifeline?.('llamada');
    setIsPaused(true);

    const correctAnswer = options[correctIndex];
    const { famous, hint } = getFamousHint(correctAnswer, options);

    setFamousHint({
      name: famous.name,
      avatar: famous.avatar,
      hint: hint
    });

    setTimeout(() => setIsPaused(false), 5000);
  };

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-500';
    if (timeLeft > 5) return 'text-yellow-500';
    return 'text-red-500 animate-pulse';
  };

  const renderLifelineButton = (comodin: Comodin, icon: React.ReactNode, label: string, onClick: () => void) => {
    const canUse = checkCanUseLifeline(comodin);
    const cooldown = getLifelineCooldown(comodin);
    const usedThisQ = usedComodinesThisQuestion.includes(comodin);

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={!canUse || usedThisQ}
        className={`relative ${(!canUse || usedThisQ) ? 'opacity-40' : 'hover:bg-primary/20'} bg-white/10 hover:bg-white/20 border-white/20 text-white`}
      >
        {icon}
        {label}
        {cooldown > 0 && !usedThisQ && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <Lock className="w-3 h-3" />
          </span>
        )}
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full max-w-sm mx-auto h-[75vh] min-h-[500px] flex flex-col relative rounded-[2.5rem] overflow-hidden shadow-2xl ${question.category === 'Futbol' ? 'bg-gradient-to-b from-emerald-500 to-green-800' : 'bg-gradient-to-b from-violet-700 to-purple-950'}`}
    >
      <div className="absolute inset-0 bg-[url('/modern_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="relative z-10 flex flex-col h-full p-4 md:p-6 overflow-y-auto slim-scroll pb-6">
        {/* Header / Falso Logo */}
        <div className="flex flex-col items-center pt-2 pb-2 shrink-0">
            <span className="text-6xl mb-1 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {question.category === 'Futbol' ? '⚽' : '💣'}
            </span>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-center leading-none">
                {question.category === 'Futbol' ? 'TRIVIA FÚTBOL' : 'BOMBA CULTURAL'}
            </h1>
        </div>

        {/* Player Name Pill */}
        <div className="flex justify-center shrink-0 z-20 mt-1 mb-[-12px]">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 font-extrabold px-6 py-1.5 rounded-full uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-yellow-300">
                {playerName}
            </span>
        </div>

        {/* Central Question Box - Borderless dark pill */}
        <div className="w-full p-6 pt-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl relative bg-black/40 backdrop-blur-md shrink-0 mb-4 mt-8">
            <div className="absolute top-3 left-4 right-4 flex justify-between text-xs font-bold opacity-60">
                <span className="text-white uppercase tracking-wider">{question.category}</span>
                <span className="text-yellow-400">{'⭐'.repeat(typeof question.difficulty === 'number' ? question.difficulty : 1)}</span>
            </div>
            
            <div className={`flex items-center gap-2 font-mono text-xl font-bold mt-2 mb-2 ${getTimerColor()}`}>
                <Timer className="h-5 w-5" />
                {timeLeft}s
            </div>

            <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                {cleanGameText(question.question)}
            </h2>
        </div>

      {/* Comodines - Now with cooldown indicators */}
      {showComodines && !showResult && (
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {renderLifelineButton('50:50', <Percent className="w-4 h-4 mr-1" />, '50:50', use5050)}
          {renderLifelineButton('publico', <Users2 className="w-4 h-4 mr-1" />, 'Público', usePublico)}
          {renderLifelineButton('llamada', <Phone className="w-4 h-4 mr-1" />, 'Llamada', useLlamada)}

          {/* Cooldown info */}
          {getCooldownRemaining && (
            <div className="w-full text-center text-xs text-white/40 mt-1">
              {(['50:50', 'publico', 'llamada'] as Comodin[]).map(c => {
                const remaining = getCooldownRemaining(c);
                if (remaining > 0) {
                  return <span key={c} className="mx-2">🔒 {c}: {remaining} preg.</span>;
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Public votes display - Now shows closer percentages */}
      {publicVotes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-white/10 backdrop-blur-sm"
        >
          <p className="text-sm font-medium mb-2 text-center text-white">📊 El público ha votado (¡muy reñido!):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold text-white">{String.fromCharCode(65 + i)}:</span>
                <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${publicVotes[i] >= 30 ? 'bg-blue-500' :
                      publicVotes[i] >= 20 ? 'bg-blue-400' : 'bg-blue-300'
                      }`}
                    style={{ width: `${publicVotes[i]}%` }}
                  />
                </div>
                <span className="font-semibold text-white">{publicVotes[i]}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Famous call display */}
      {famousHint && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{famousHint.avatar}</span>
            <div>
              <p className="font-bold text-sm text-white">{famousHint.name}</p>
              <p className="text-xs text-white/60">Llamada especial</p>
            </div>
          </div>
          <p className="text-sm italic text-white">{famousHint.hint}</p>
        </motion.div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 gap-2 mb-4 flex-1 content-end shrink-0">
        {options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isEliminated = eliminatedOptions.includes(index);
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === correctIndex;

          let bgClass = 'bg-white hover:bg-slate-100 text-slate-900 border-none shadow-md';
          let textColor = 'text-slate-900';
          let letterColor = 'text-slate-400';

          if (isEliminated) {
            bgClass = 'bg-white/10 opacity-30 cursor-not-allowed border-none text-white';
            textColor = 'text-white';
          } else if (showResult) {
            if (isCorrectAnswer) {
              bgClass = 'bg-green-500 border-none shadow-lg text-white font-bold';
              textColor = 'text-white';
              letterColor = 'text-green-200';
            }
            else if (isSelected && !isCorrectAnswer) {
              bgClass = 'bg-red-500 border-none shadow-lg text-white font-bold';
              textColor = 'text-white';
              letterColor = 'text-red-200';
            }
          } else if (isSelected) {
            bgClass = 'bg-slate-200 border-none text-slate-900 shadow-inner';
          }

          return (
            <motion.button
              key={index}
              whileHover={!showResult && !isEliminated ? { scale: 1.02 } : {}}
              whileTap={!showResult && !isEliminated ? { scale: 0.98 } : {}}
              onClick={() => handleSelectAnswer(index)}
              disabled={showResult || isEliminated}
              className={`p-4 rounded-xl text-center transition-all ${bgClass} ${textColor}`}
            >
              {!showResult && !isSelected && <span className={`font-black ${letterColor} mr-2`}>{letter}.</span>}
              <span className="font-semibold text-[1.1rem] tracking-tight">{cleanGameText(option)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Submit button */}
      {!showResult && (
        <div className="mt-2 shrink-0">
            <Button
            size="lg"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={`w-full py-6 text-2xl bg-white ${question.category === 'Futbol' ? 'text-emerald-800' : 'text-purple-900'} font-extrabold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all text-center tracking-wide disabled:opacity-50 disabled:hover:scale-100 disabled:bg-white/50`}
            >
            Confirmar
            </Button>
        </div>
      )}

      {/* Result feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2 p-4 rounded-2xl text-center shrink-0 shadow-lg ${selectedAnswer === correctIndex ? 'bg-green-900/60 border border-green-500/50' : 'bg-red-900/60 border border-red-500/50'} backdrop-blur-md`}
          >
            {selectedAnswer === correctIndex ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-bold text-lg text-white">¡Correcto! +{getDifficultyPoints()} pts</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-red-400">
                <div className="flex items-center gap-2">
                  <XCircle className="h-6 w-6" />
                  <span className="font-bold text-lg text-white">
                    {timeLeft === 0 ? '¡Tiempo!' : 'Incorrecto'}
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  Era: <strong>{options[correctIndex]}</strong>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question voting */}
      {showResult && (
        <div className="mt-4 shrink-0">
            <QuestionVote
            questionText={question.question}
            questionCategory={question.category}
            voterName={playerName}
            />
        </div>
      )}
      </div>
    </motion.div>
  );
}
