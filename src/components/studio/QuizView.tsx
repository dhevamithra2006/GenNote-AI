import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Check
} from 'lucide-react';

interface QuizViewProps {
  content: any;
}

export const QuizView: React.FC<QuizViewProps> = ({ content }) => {
  const questions = content?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    setShowResults(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === q.correctAnswer) correctCount++;
    });

    const percent = Math.round((correctCount / (questions.length || 1)) * 100);
    if (percent >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setCurrentIndex(0);
  };

  let correctTotal = 0;
  questions.forEach((q: any, i: number) => {
    if (selectedAnswers[i] === q.correctAnswer) correctTotal++;
  });
  const scorePercent = Math.round((correctTotal / (questions.length || 1)) * 100);
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Quiz Header Bar */}
      <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white block">
                Exam Simulator & Knowledge Check
              </span>
              <span className="text-[11px] text-neutral-500">
                Grounded questions extracted from your sources
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono font-semibold text-neutral-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {submitted && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                Score: {correctTotal}/{questions.length} ({scorePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Quiz Progress Bar */}
        <div className="w-full bg-neutral-200/60 dark:bg-neutral-700/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Results Card if finished */}
      {showResults && (
        <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-xl text-center space-y-4 animate-scale-in relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white">
              Quiz Completed!
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              You scored <span className="font-bold text-emerald-600 dark:text-emerald-400">{correctTotal} out of {questions.length}</span> ({scorePercent}%)
            </p>
          </div>

          {/* Performance Badge */}
          <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {scorePercent >= 80 ? 'Mastery Level: Excellent!' : scorePercent >= 60 ? 'Mastery Level: Good Progress' : 'Review Recommended'}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
            <button
              onClick={() => setShowResults(false)}
              className="px-4.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Review Question Details
            </button>
          </div>
        </div>
      )}

      {/* Active Question Box */}
      {currentQ && (
        <div className="p-6 sm:p-7 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              {currentQ.topic && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500 font-sans">
                  {currentQ.topic}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {(currentQ.options || []).map((opt: string, optI: number) => {
              const isSelected = selectedAnswers[currentIndex] === optI;
              const isCorrect = currentQ.correctAnswer === optI;

              let style = 'border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-400/80 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 bg-neutral-50/20 dark:bg-neutral-800/20';
              if (isSelected && !submitted) {
                style = 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs';
              } else if (submitted) {
                if (isCorrect) {
                  style = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-xs';
                } else if (isSelected && !isCorrect) {
                  style = 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 shadow-xs';
                }
              }

              return (
                <div
                  key={optI}
                  onClick={() => handleSelectOption(optI)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected && !submitted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {String.fromCharCode(65 + optI)}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{opt}</span>
                  </div>

                  {submitted && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {submitted && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation reveal if submitted or answered */}
          {submitted && (
            <div className="p-4.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 text-xs space-y-2 animate-fade-in">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Grounded Explanation:
              </span>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {currentQ.explanation}
              </p>
              {currentQ.citation && (
                <p className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  Source Grounding: {currentQ.citation}
                </p>
              )}
            </div>
          )}

          {/* Question navigation footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Next Question</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              !submitted && (
                <button
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
