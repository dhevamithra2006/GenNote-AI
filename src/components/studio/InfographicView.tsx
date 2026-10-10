import React from 'react';
import { BarChart3, TrendingUp, Layers, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface InfographicViewProps {
  content: any;
}

export const InfographicView: React.FC<InfographicViewProps> = ({ content }) => {
  const stats = content?.stats || [];
  const processSteps = content?.processSteps || [];
  const comparison = content?.comparison || {
    featureA: 'Type A',
    featureB: 'Type B',
    rows: []
  };

  return (
    <div className="space-y-6">
      {/* Visual Stat Cards Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          Key Quantitative & Architectural Metrics
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((st: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm flex flex-col justify-between"
            >
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {st.value}
              </div>
              <div className="mt-1">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  {st.label}
                </span>
                {st.context && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {st.context}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sequential Process Flow */}
      {processSteps.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Execution Lifecycle & Process Pipeline
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative">
            {processSteps.map((step: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 relative flex flex-col"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs mb-2">
                  {i + 1}
                </div>
                <h5 className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                  {step.title}
                </h5>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Matrix */}
      {comparison.rows && comparison.rows.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Comparative Architectural Matrix
          </h4>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  <th className="p-3 font-bold">Evaluation Criterion</th>
                  <th className="p-3 font-bold text-emerald-700 dark:text-emerald-400">
                    {comparison.featureA || 'Architecture A'}
                  </th>
                  <th className="p-3 font-bold text-blue-700 dark:text-blue-400">
                    {comparison.featureB || 'Architecture B'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {comparison.rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-750">
                    <td className="p-3 font-semibold text-neutral-900 dark:text-white">
                      {row.attribute}
                    </td>
                    <td className="p-3 text-neutral-700 dark:text-neutral-300">
                      {row.valA}
                    </td>
                    <td className="p-3 text-neutral-700 dark:text-neutral-300">
                      {row.valB}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
