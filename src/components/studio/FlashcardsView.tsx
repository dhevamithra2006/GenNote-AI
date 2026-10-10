import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Award,
  BookOpen
} from 'lucide-react';

interface FlashcardsViewProps {
  content: any;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ content }) => {
  const initialCards = content?.cards || [];
  const [cards, setCards] = useState<any[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});
  const [reviewIds, setReviewIds] = useState<Record<string, boolean>>({});

  const currentCard = cards[currentIndex] || cards[0] || {
    front: 'No flashcards generated yet.',
    back: 'Please generate or check your sources.',
    tag: 'General'
  };

  const currentId = currentCard.id || `card-${currentIndex}`;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length, currentIndex]);

  const toggleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const markMastered = () => {
    setMasteredIds(prev => ({ ...prev, [currentId]: true }));
    setReviewIds(prev => {
      const copy = { ...prev };
      delete copy[currentId];
      return copy;
    });
    handleNext();
  };

  const markReview = () => {
    setReviewIds(prev => ({ ...prev, [currentId]: true }));
    setMasteredIds(prev => {
      const copy = { ...prev };
      delete copy[currentId];
      return copy;
    });
    handleNext();
  };

  const masteredCount = Object.keys(masteredIds).length;
  const reviewCount = Object.keys(reviewIds).length;
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
      {/* Top statistics & controls */}
      <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-neutral-600 dark:text-neutral-400">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {masteredCount} Mastered
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {reviewCount} Review
            </span>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer shadow-2xs hover:scale-102"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Shuffle</span>
          </button>
        </div>

        {/* Deck Progress Bar */}
        <div className="w-full bg-neutral-200/60 dark:bg-neutral-700/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={toggleFlip}
        className="relative h-80 w-full cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={`w-full h-full duration-500 transform-style-3d relative rounded-3xl border transition-all shadow-xl hover:shadow-2xl ${
            isFlipped
              ? 'bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-900 text-white border-emerald-500/60 ring-4 ring-emerald-500/10'
              : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-200/80 dark:border-neutral-700/80 group-hover:border-emerald-500/50 group-hover:ring-4 group-hover:ring-emerald-500/10'
          }`}
        >
          {/* Card Meta Tag Header */}
          <div className="absolute top-5 left-6 right-6 flex items-center justify-between text-xs">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isFlipped
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
              }`}
            >
              {currentCard.tag || 'Core Concept'}
            </span>

            <span className="text-[11px] opacity-70 flex items-center gap-1.5 font-medium">
              <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              {isFlipped ? 'Answer • Click to flip back' : 'Question • Click to reveal'}
            </span>
          </div>

          {/* Card Content (Front / Back) */}
          <div className="h-full flex items-center justify-center p-8 sm:p-12 text-center">
            {isFlipped ? (
              <div className="space-y-4 animate-fade-in max-w-md">
                <p className="text-base sm:text-lg font-medium leading-relaxed text-emerald-50">
                  {currentCard.back}
                </p>
                {currentCard.explanation && (
                  <p className="text-xs text-emerald-200/80 italic pt-3 border-t border-white/10 leading-normal">
                    {currentCard.explanation}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <h3 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight">
                  {currentCard.front}
                </h3>
              </div>
            )}
          </div>

          {/* Difficulty indicator footer */}
          <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[11px] opacity-60">
            <span className="font-medium">Difficulty: {currentCard.difficulty || 'Medium'}</span>
            {masteredIds[currentId] && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Mastered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation and Rating Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title="Previous card (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={markReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Needs Review</span>
          </button>

          <button
            onClick={markMastered}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-xs font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mastered!</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title="Next card (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-3 pt-1">
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-200 dark:border-neutral-700">Space</kbd> Flip card</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-200 dark:border-neutral-700">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-200 dark:border-neutral-700">→</kbd> Navigate</span>
      </div>
    </div>
  );
};
