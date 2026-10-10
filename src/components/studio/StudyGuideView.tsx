import React, { useState } from 'react';
import { BookOpen, CheckCircle, Clock, Circle, Sparkles, Award } from 'lucide-react';

interface StudyGuideViewProps {
  content: any;
  onUpdate?: (newContent: any) => void;
}

export const StudyGuideView: React.FC<StudyGuideViewProps> = ({ content, onUpdate }) => {
  const [topics, setTopics] = useState<any[]>(content?.topics || []);

  const cycleStatus = (index: number) => {
    const statuses = ['Not Started', 'In Progress', 'Mastered'];
    const current = topics[index]?.status || 'Not Started';
    const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    const updated = [...topics];
    updated[index] = { ...updated[index], status: nextStatus };
    setTopics(updated);
    if (onUpdate) {
      onUpdate({ ...content, topics: updated });
    }
  };

  const masteredCount = topics.filter(t => t.status === 'Mastered').length;
  const inProgressCount = topics.filter(t => t.status === 'In Progress').length;
  const progressPercent = Math.round((masteredCount / (topics.length || 1)) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Overview & Progress Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Syllabus & Exam Mastery Tracker
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Click status badges to cycle your preparation status for each syllabus topic.
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
            <span className="text-[11px] text-neutral-400 block">Mastery Complete</span>
          </div>
        </div>

        <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs pt-1 text-neutral-500">
          <span>{masteredCount} Mastered</span>
          <span>•</span>
          <span>{inProgressCount} Learning</span>
          <span>•</span>
          <span>{topics.length - masteredCount - inProgressCount} Not Started</span>
        </div>
      </div>

      {/* Checklist topics */}
      <div className="space-y-3">
        {topics.map((t: any, i: number) => {
          const status = t.status || 'Not Started';

          let badgeColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300';
          let icon = <Circle className="w-3.5 h-3.5" />;
          if (status === 'In Progress') {
            badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
            icon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
          } else if (status === 'Mastered') {
            badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
          }

          return (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  {t.title}
                </h4>

                <button
                  onClick={() => cycleStatus(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${badgeColor}`}
                >
                  {icon}
                  <span>{status}</span>
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {t.description || t.summary}
              </p>

              {t.keyCheckpoints && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Core Learning Objectives:
                  </span>
                  <ul className="space-y-1">
                    {t.keyCheckpoints.map((cp: string, cpI: number) => (
                      <li key={cpI} className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                        <span className="text-emerald-500">•</span>
                        <span>{cp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
