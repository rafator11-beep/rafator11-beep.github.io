import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/game';
import { QuestionVote } from './QuestionVote';

interface QuestionCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  timeLimit?: number;
  playerName: string;
}

export function QuestionCard({ question, onAnswer, timeLimit = 30, playerName }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (timeLimit <= 0 || showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, showResult]);

  const handleTimeUp = () => {
    if (!showResult) {
      setShowResult(true);
      setIsCorrect(false);
      setTimeout(() => onAnswer(false), 2000);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer && question.type !== 'social') return;
    
    const correct = question.type === 'social' 
      ? true // Social questions are always "correct" as they're for discussion
      : selectedAnswer === question.correct_answer;
    
    setIsCorrect(correct);
    setShowResult(true);
    setTimeout(() => onAnswer(correct), 2000);
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-green-500';
    if (timeLeft > 10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderOptions = () => {
    if (question.type === 'test' && question.options) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(question.options as string[]).map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = question.correct_answer === option;

            let bgClass = 'bg-white hover:bg-slate-100 text-slate-900 border-none shadow-md';
            let textColor = 'text-slate-900';
            let letterColor = 'text-slate-400';

            if (showResult) {
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
                key={option}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                onClick={() => handleSelectAnswer(option)}
                disabled={showResult}
                className={`p-4 rounded-xl text-center transition-all ${bgClass} ${textColor}`}
              >
                {!showResult && !isSelected && <span className={`font-black ${letterColor} mr-2`}>{letter}.</span>}
                <span className="font-semibold text-[1.1rem] tracking-tight">{option}</span>
              </motion.button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'true_false') {
      return (
        <div className="flex gap-4 justify-center">
          {['Verdadero', 'Falso'].map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = question.correct_answer === option;

            let bgClass = 'bg-white hover:bg-slate-100 text-slate-900 border-none shadow-md';
            let textColor = 'text-slate-900';

            if (showResult) {
              if (isCorrectAnswer) {
                bgClass = 'bg-green-500 border-none text-white font-bold';
                textColor = 'text-white';
              }
              else if (isSelected && !isCorrectAnswer) {
                bgClass = 'bg-red-500 border-none text-white font-bold';
                textColor = 'text-white';
              }
            } else if (isSelected) {
              bgClass = 'bg-slate-200 border-none text-slate-900 shadow-inner';
            }

            return (
              <motion.button
                key={option}
                whileHover={!showResult ? { scale: 1.05 } : {}}
                whileTap={!showResult ? { scale: 0.95 } : {}}
                onClick={() => handleSelectAnswer(option)}
                disabled={showResult}
                className={`px-8 py-4 rounded-xl font-semibold text-[1.1rem] transition-all ${bgClass} ${textColor}`}
              >
                {option === 'Verdadero' ? '✓' : '✗'} {option}
              </motion.button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'social') {
      return (
        <div className="text-center py-4">
          <p className="text-white/60 mb-4">
            Esta es una pregunta de debate. Discutidla entre todos y cuando estéis listos, continúa.
          </p>
          <Button onClick={handleSubmit} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border border-white/10 backdrop-blur-sm">
            Hemos debatido, continuar
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-sm mx-auto h-[75vh] min-h-[500px] flex flex-col relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-b from-indigo-600 to-slate-900"
    >
      <div className="absolute inset-0 bg-[url('/modern_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="relative z-10 flex flex-col h-full p-4 md:p-6 overflow-y-auto slim-scroll pb-6">
        {/* Header / Falso Logo */}
        <div className="flex flex-col items-center pt-2 pb-2 shrink-0">
            <span className="text-6xl mb-1 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">🧠</span>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-center leading-none">
                PREGUNTA
            </h1>
        </div>

        {/* Player Name Pill */}
        <div className="flex justify-center shrink-0 z-20 mt-1 mb-[-12px]">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 font-extrabold px-6 py-1.5 rounded-full uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-yellow-300">
                {playerName}
            </span>
        </div>

        {/* Central Question Box */}
        <div className="w-full p-6 pt-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl relative bg-black/40 backdrop-blur-md shrink-0 mb-4 mt-8">
            <div className="absolute top-3 left-4 right-4 flex justify-between text-xs font-bold opacity-60">
                <span className="text-white uppercase tracking-wider">{question.category}</span>
                <span className="text-yellow-400">{'⭐'.repeat(question.difficulty)}</span>
            </div>
            
            {timeLimit > 0 && !showResult && (
              <div className={`flex items-center gap-2 font-mono text-xl font-bold mt-2 mb-2 ${getTimerColor()}`}>
                  <Timer className="h-5 w-5" />
                  {timeLeft}s
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                {question.question}
            </h2>
        </div>

        {/* Options */}
        <div className="flex-1 content-end shrink-0 mb-4">
            {renderOptions()}
        </div>

        {/* Submit button for non-social questions */}
        {question.type !== 'social' && !showResult && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: selectedAnswer ? 1 : 0.5 }}
            className="mt-2 shrink-0"
            >
            <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="w-full py-6 text-2xl bg-white text-indigo-900 font-extrabold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all text-center tracking-wide disabled:opacity-50 disabled:hover:scale-100 disabled:bg-white/50"
            >
                Confirmar
            </Button>
            </motion.div>
        )}

        {/* Result feedback */}
        <AnimatePresence>
            {showResult && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-2 p-4 rounded-2xl text-center shrink-0 shadow-lg ${
                isCorrect ? 'bg-green-900/60 border border-green-500/50' : 'bg-red-900/60 border border-red-500/50'
                } backdrop-blur-md`}
            >
                {isCorrect ? (
                <div className="flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-bold text-lg text-white">¡Correcto!</span>
                </div>
                ) : (
                <div className="flex flex-col items-center gap-1 text-red-400">
                    <div className="flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    <span className="font-bold text-lg text-white">Incorrecto</span>
                    </div>
                    {question.correct_answer && (
                    <p className="text-xs text-white/80">
                        Era: <strong>{question.correct_answer}</strong>
                    </p>
                    )}
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
