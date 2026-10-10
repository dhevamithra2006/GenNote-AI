import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, MessageSquare, Sparkles, ChevronRight, CornerDownLeft, Command } from 'lucide-react';
import { api } from '../services/api';
import { SearchResult } from '../types';

interface SearchModalProps {
  notebookId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  notebookId,
  isOpen,
  onClose,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.search(notebookId, query.trim())
        .then(res => setResults(res.results || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [query, notebookId]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    if (type.includes('Source')) return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    if (type.includes('Question') || type.includes('Answer') || type.includes('Chat')) {
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
  };

  const QUICK_SEARCHES = ['Memory Management', 'Paging', 'CPU Scheduling', 'Deadlock', 'Virtual Memory'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[72vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-3 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <Search className="w-4 h-4 text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, passages, chat, questions, or definitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')} 
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span>Searching grounded knowledge base...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1.5">
              {results.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelectResult(res);
                    onClose();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent hover:border-neutral-200/60 dark:hover:border-neutral-700/60 transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 mt-0.5 shrink-0 group-hover:scale-105 transition-transform">
                    {getIcon(res.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50">
                        {res.type}
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {res.title}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {res.excerpt}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No results found for <span className="font-semibold text-neutral-600 dark:text-neutral-300">"{query}"</span>.
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                Quick search suggestions:
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
                {QUICK_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-neutral-200/60 dark:border-neutral-700/60 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 shadow-2xs">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 shadow-2xs">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span>GenNote Instant Search</span>
        </div>
      </div>
    </div>
  );
};
