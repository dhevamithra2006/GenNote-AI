import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Sparkles,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';

interface SlideDeckViewProps {
  content: any;
  onUpdate?: (newContent: any) => void;
}

export const SlideDeckView: React.FC<SlideDeckViewProps> = ({ content, onUpdate }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>(content?.slides || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBullets, setEditBullets] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length, isEditing]);

  const enterFullscreen = () => {
    if (slideRef.current) {
      slideRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  const currentSlide = slides[currentSlideIndex] || slides[0] || {
    title: 'Presentation',
    bullets: []
  };

  const startEdit = () => {
    setEditTitle(currentSlide.title || '');
    setEditSubtitle(currentSlide.subtitle || '');
    setEditBullets((currentSlide.bullets || []).join('\n'));
    setIsEditing(true);
  };

  const saveEdit = () => {
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...currentSlide,
      title: editTitle,
      subtitle: editSubtitle,
      bullets: editBullets.split('\n').filter(Boolean)
    };
    setSlides(updated);
    setIsEditing(false);
    if (onUpdate) onUpdate({ ...content, slides: updated });
  };

  const addSlide = () => {
    const newSlide = {
      id: `s-${Date.now()}`,
      title: 'New Slide Title',
      subtitle: 'Key Concept',
      bullets: ['Main takeaway 1', 'Important detail 2', 'Supporting evidence 3'],
      visualSuggestion: 'Illustration or chart diagram',
      citation: 'Source Notes'
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setCurrentSlideIndex(updated.length - 1);
    if (onUpdate) onUpdate({ ...content, slides: updated });
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    if (onUpdate) onUpdate({ ...content, slides: updated });
  };

  return (
    <div className={
      `space-y-5 animate-fade-in ${isMaximized ? 'fixed inset-0 z-50 bg-neutral-900/95 p-4' : ''}`
    }>
      {/* Keyboard navigation header hint */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Navigate with</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">→</kbd>
        </div>
        <span className="font-mono text-[11px]">
          Slide {currentSlideIndex + 1} of {slides.length}
        </span>
      </div>

      {/* Slide Presentation Canvas */}
      <div
        ref={slideRef}
        className="relative aspect-[16/9] w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden border border-neutral-800"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Slide Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-3">
            <span className="tracking-widest uppercase font-semibold">GENNOTE KNOWLEDGE PRESENTATION</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
              SLIDE {currentSlideIndex + 1} / {slides.length}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="Slide Title"
              />
              <input
                type="text"
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="w-full text-xs text-neutral-300 bg-white/10 border border-white/20 rounded-xl px-4 py-1.5 focus:outline-none focus:border-emerald-500"
                placeholder="Slide Subtitle"
              />
            </div>
          ) : (
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Slide Body Bullets */}
        <div className="relative z-10 my-auto py-3">
          {isEditing ? (
            <textarea
              rows={4}
              value={editBullets}
              onChange={(e) => setEditBullets(e.target.value)}
              className="w-full text-xs bg-white/10 border border-white/20 rounded-xl p-4 text-white font-sans focus:outline-none focus:border-emerald-500"
              placeholder="Bullet points (one per line)"
            />
          ) : (
            <ul className="space-y-3">
              {(currentSlide.bullets || []).map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3.5 text-sm sm:text-base text-neutral-100">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 mt-2 shrink-0 shadow-sm shadow-emerald-400/50" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slide Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md">
              Visual: {currentSlide.visualSuggestion || 'System Architecture diagram'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {currentSlide.citation && (
              <span className="text-[10px] font-mono text-neutral-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                {currentSlide.citation}
              </span>
            )}
            <button
              onClick={enterFullscreen}
              className="p-1.5 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title="Fullscreen presentation"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMaximized(prev => !prev)}
              className="p-1.5 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer ml-2"
              title={isMaximized ? "Restore panel size" : "Maximize panel"}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium px-2 text-neutral-600 dark:text-neutral-400">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={saveEdit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </button>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Slide
              </button>
              {currentSlide.speakerNotes && (
                <button
                  onClick={() => setShowNotes(n => !n)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl transition-colors cursor-pointer ${
                    showNotes
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {showNotes ? 'Hide Notes' : 'Speaker Notes'}
                </button>
              )}
            </>
          )}

          <button
            onClick={addSlide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Slide
          </button>

          {slides.length > 1 && (
            <button
              onClick={() => deleteSlide(currentSlideIndex)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
              title="Delete current slide"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Speaker Notes Panel */}
      {showNotes && currentSlide.speakerNotes && (
        <div className="p-4.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 animate-fade-in">
          <span className="font-bold uppercase tracking-wider text-[10px] block text-emerald-700 dark:text-emerald-400">Speaker Notes</span>
          <p className="leading-relaxed">{currentSlide.speakerNotes}</p>
        </div>
      )}

      {/* Slide Thumbnails strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentSlideIndex(i);
              setIsEditing(false);
            }}
            className={`shrink-0 w-32 h-20 p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
              currentSlideIndex === i
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              #{i + 1}
            </div>
            <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {s.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
