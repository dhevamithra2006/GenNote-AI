import React, { useState } from 'react';
import { BookOpen, Search, Copy, Check, Sparkles } from 'lucide-react';

interface DefinitionsViewProps {
  content: any;
}

export const DefinitionsView: React.FC<DefinitionsViewProps> = ({ content }) => {
  const definitions = content?.definitions || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filtered = definitions.filter((d: any) =>
    (d.term || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.definition || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (term: string, def: string, idx: number) => {
    navigator.clipboard.writeText(`${term}: ${def}`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search glossary terms or formulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <span className="text-xs font-mono text-neutral-400">
          {filtered.length} terms cataloged
        </span>
      </div>

      {/* Definitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item: any, i: number) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm flex flex-col justify-between space-y-2.5 hover:border-emerald-500/50 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  {item.term}
                </h4>
                <button
                  onClick={() => handleCopy(item.term, item.definition, i)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
                  title="Copy definition"
                >
                  {copiedIndex === i ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {item.definition}
              </p>

              {item.example && (
                <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                  Example: {item.example}
                </div>
              )}
            </div>

            {item.citation && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 text-[10px] font-mono text-neutral-400 truncate">
                Grounding: {item.citation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
