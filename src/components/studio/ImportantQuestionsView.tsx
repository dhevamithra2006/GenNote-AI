import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, Filter } from 'lucide-react';

interface ImportantQuestionsViewProps {
  content: any;
}

export const ImportantQuestionsView: React.FC<ImportantQuestionsViewProps> = ({ content }) => {
  const shortQ = content?.shortQuestions || [];
  const mediumQ = content?.mediumQuestions || [];
  const longQ = content?.longQuestions || [];

  const [activeFilter, setActiveFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allQuestions = [
    ...shortQ.map((q: any, i: number) => ({ ...q, type: '2-Mark Short Question', marks: 2, id: `short-${i}` })),
    ...mediumQ.map((q: any, i: number) => ({ ...q, type: '5-Mark Analytical Question', marks: 5, id: `med-${i}` })),
    ...longQ.map((q: any, i: number) => ({ ...q, type: '10-Mark Comprehensive Question', marks: 10, id: `long-${i}` }))
  ];

  const filtered = allQuestions.filter(q => {
    if (activeFilter === 'short') return q.marks === 2;
    if (activeFilter === 'medium') return q.marks === 5;
    if (activeFilter === 'long') return q.marks === 10;
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            All Questions ({allQuestions.length})
          </button>
          <button
            onClick={() => setActiveFilter('short')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'short'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            2-Mark ({shortQ.length})
          </button>
          <button
            onClick={() => setActiveFilter('medium')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'medium'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            5-Mark ({mediumQ.length})
          </button>
          <button
            onClick={() => setActiveFilter('long')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'long'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            10-Mark ({longQ.length})
          </button>
        </div>

        <button
          onClick={() => {
            const allExpanded: Record<string, boolean> = {};
            filtered.forEach(q => { allExpanded[q.id] = true; });
            setExpandedAnswers(allExpanded);
          }}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
        >
          Expand All Model Answers
        </button>
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {filtered.map((item, i) => {
          const isExpanded = !!expandedAnswers[item.id];

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    item.marks === 2
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : item.marks === 5
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  {item.type}
                </span>

                <span className="text-xs font-mono text-neutral-400">
                  Weight: {item.marks} Points
                </span>
              </div>

              <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                {item.question}
              </h4>

              {/* Model Answer Toggle */}
              <div>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <span>{isExpanded ? 'Hide Model Answer' : 'Reveal Grounded Model Answer'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl space-y-2 animate-in fade-in">
                    <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                      {item.modelAnswer || item.answer}
                    </p>
                    {item.citation && (
                      <p className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-emerald-200/30">
                        Source Reference: {item.citation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
