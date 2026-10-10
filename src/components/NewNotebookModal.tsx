import React, { useState } from 'react';
import { X, BookPlus, Sparkles, FolderPlus, Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import { Notebook } from '../types';

interface NewNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (notebook: Notebook) => void;
}

const TEMPLATE_SUGGESTIONS = [
  { title: 'Operating Systems & Concurrency', category: 'Computer Science', desc: 'Process scheduling, virtual memory, threads, synchronization' },
  { title: 'Deep Learning & Neural Nets', category: 'Computer Science', desc: 'Backprop, attention mechanisms, transformers, loss functions' },
  { title: 'Cellular Biology & Genetics', category: 'Medicine & Health', desc: 'Gene expression, cellular respiration, DNA replication' },
  { title: 'Corporate Finance & Valuation', category: 'Business & Economics', desc: 'DCF models, risk analysis, capital budgeting, WACC' },
];

export const NewNotebookModal: React.FC<NewNotebookModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { notebook } = await api.createNotebook({
        title: title.trim(),
        description: description.trim(),
        category: category.trim()
      });
      onCreated(notebook);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create notebook');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (sug: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setTitle(sug.title);
    setCategory(sug.category);
    setDescription(sug.desc);
  };

  const categories = [
    'Computer Science',
    'Medicine & Health',
    'Law & Ethics',
    'Engineering',
    'Business & Economics',
    'Humanities',
    'Natural Sciences',
    'General Study'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between relative z-10 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Create New Notebook
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ground your research in multimodal sources & artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 relative z-10">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 rounded-2xl animate-shake">
              {error}
            </div>
          )}

          {/* Quick Suggestions */}
          {!title && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick starter ideas:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_SUGGESTIONS.slice(0, 3).map((sug) => (
                  <button
                    key={sug.title}
                    type="button"
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-emerald-50 dark:bg-neutral-800 dark:hover:bg-emerald-950/40 text-neutral-600 hover:text-emerald-700 dark:text-neutral-300 dark:hover:text-emerald-300 border border-neutral-200/60 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left truncate max-w-[220px]"
                  >
                    + {sug.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notebook Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Notebook Name <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Operating Systems & Concurrency"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Subject / Field
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.424l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Description / Study Purpose <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Exam preparation notes covering CPU scheduling, paging algorithms, and virtual memory."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Notebook</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
