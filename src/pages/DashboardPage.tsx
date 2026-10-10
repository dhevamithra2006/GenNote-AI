import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  FileText,
  Sparkles,
  ArrowUpRight,
  FolderOpen,
  BookOpen,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Notebook } from '../types';
import { api } from '../services/api';
import { useLanguageMode } from '../context/LanguageModeContext';
import { NewNotebookModal } from '../components/NewNotebookModal';

interface DashboardPageProps {
  onSelectNotebook: (id: string) => void;
}

// Animated skeleton card
const SkeletonCard = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
      <div className="h-5 w-5 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
    </div>
    <div className="space-y-2 mb-5">
      <div className="h-4 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded" />
      <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800/60 rounded" />
      <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
    </div>
    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
      <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
      <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
    </div>
  </div>
);

// Colour map for category pills
const CATEGORY_COLOURS: Record<string, string> = {
  'CS':          'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
  'Math':        'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/40',
  'Science':     'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-800/40',
  'History':     'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
  'Engineering': 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40',
  'General':     'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
};
const categoryColour = (cat: string) =>
  CATEGORY_COLOURS[cat] ?? CATEGORY_COLOURS['General'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectNotebook }) => {
  const { t } = useLanguageMode();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const res = await api.getNotebooks();
      setNotebooks(res.notebooks || []);
    } catch (err) {
      console.error('Failed to load notebooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotebooks(); }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this notebook and all associated sources?')) return;
    try {
      await api.deleteNotebook(id);
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.duplicateNotebook(id);
      setNotebooks(prev => [res.notebook, ...prev]);
    } catch (err) { console.error(err); }
  };

  const categories = ['All', ...Array.from(new Set(notebooks.map(n => n.category || 'General')))];

  const filteredNotebooks = notebooks.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSources   = notebooks.reduce((s, n) => s + (n.sourcesCount  || 0), 0);
  const totalArtifacts = notebooks.reduce((s, n) => s + (n.artifactsCount || 0), 0);

  return (
    <div className="min-h-[90vh] bg-[#fafaf9] dark:bg-neutral-950">

      {/* ── Gradient header strip ─────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10" />
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in-up">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {t('notebooks')}
                </h1>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('workspaceTitle')} — <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('zeroHallucinationNotice')}</span>
              </p>
            </div>

            {/* Quick stats */}
            {!loading && notebooks.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 animate-fade-in stagger-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-bold text-neutral-900 dark:text-white">{notebooks.length}</span> notebooks
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-bold text-neutral-900 dark:text-white">{totalSources}</span> sources
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span className="font-bold text-neutral-900 dark:text-white">{totalArtifacts}</span> artifacts
                </div>
              </div>
            )}

            {/* New Notebook CTA */}
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 cursor-pointer w-fit glow-emerald shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newNotebook')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-7 pb-4 animate-fade-in-up stagger-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80 group">
            <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow shadow-sm"
            />
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent shadow-sm'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Notebook Grid ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="py-24 text-center space-y-5 max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 flex items-center justify-center animate-float">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                {searchTerm ? 'No notebooks found' : 'No notebooks yet'}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {searchTerm
                  ? `No results for "${searchTerm}". Try a different search.`
                  : t('uploadPrompt')}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t('newNotebook')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotebooks.map((nb, idx) => (
              <div
                key={nb.id}
                onClick={() => onSelectNotebook(nb.id)}
                className={`animate-fade-in-up stagger-${(idx % 6) + 1} card-lift group relative bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:border-emerald-400/70 dark:hover:border-emerald-700/60 cursor-pointer flex flex-col justify-between min-h-[200px]`}
              >
                {/* Top row: category + menu */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryColour(nb.category || 'General')}`}>
                    {nb.category || 'General'}
                  </span>

                  {/* Actions Menu */}
                  <div className="relative" ref={activeMenuId === nb.id ? menuRef : undefined} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === nb.id ? null : nb.id)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === nb.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 z-30 text-xs animate-scale-in">
                        <button
                          onClick={(e) => { setActiveMenuId(null); handleDuplicate(nb.id, e); }}
                          className="w-full px-3.5 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-neutral-400" /> Duplicate
                        </button>
                        <button
                          onClick={(e) => { setActiveMenuId(null); handleDelete(nb.id, e); }}
                          className="w-full px-3.5 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & desc */}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {nb.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {nb.description || 'No description provided.'}
                  </p>
                </div>

                {/* Footer stats */}
                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      {nb.sourcesCount || 0} Sources
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      {nb.artifactsCount || 0} Artifacts
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <NewNotebookModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={(newNb) => {
          setNotebooks(prev => [newNb, ...prev]);
          onSelectNotebook(newNb.id);
        }}
      />
    </div>
  );
};
