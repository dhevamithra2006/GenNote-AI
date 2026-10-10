import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles, BookOpen } from 'lucide-react';

interface SummaryViewProps {
  content: any;
  onUpdate?: (newContent: any) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'exam'>('detailed');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = `${content.overview || ''}\n\nKey Points:\n`;
    (content.keyPoints || []).forEach((kp: string) => { text += `• ${kp}\n`; });
    if (content.sections) {
      content.sections.forEach((s: any) => { text += `\n${s.title}\n${s.text}\n`; });
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Quick (5-10 Points)
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'detailed'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Detailed Architecture
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Exam High-Yield
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Tab: Quick Summary */}
      {activeTab === 'quick' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
              Executive Takeaway
            </h4>
            <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
              {content.overview || 'Overview of the primary study materials.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2.5">
              Key Insights
            </h4>
            <div className="space-y-2">
              {(content.keyPoints || []).map((kp: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 rounded-xl text-xs text-neutral-800 dark:text-neutral-200"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{kp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Detailed Summary */}
      {activeTab === 'detailed' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 bg-white dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 rounded-xl">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2">
              Comprehensive Topic Overview
            </h4>
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {content.overview}
            </p>
          </div>

          <div className="space-y-3">
            {(content.sections || []).map((sec: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 rounded-xl space-y-2"
              >
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {sec.title}
                </h4>
                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {sec.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Exam High-Yield */}
      {activeTab === 'exam' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200">
            High-yield definitions, trade-offs, and critical review points compiled for final exam revision.
          </div>
          {(content.examPoints || content.keyPoints || []).map((pt: string, i: number) => (
            <div
              key={i}
              className="p-3 bg-white dark:bg-neutral-800/60 border-l-4 border-amber-500 rounded-r-xl border-y border-r border-neutral-200/70 dark:border-neutral-700/60 text-xs text-neutral-800 dark:text-neutral-200"
            >
              {pt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
