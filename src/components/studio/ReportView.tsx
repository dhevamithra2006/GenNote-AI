import React, { useState } from 'react';
import { FileText, Bookmark, BookOpen, Quote, Download, Printer } from 'lucide-react';

interface ReportViewProps {
  content: any;
}

export const ReportView: React.FC<ReportViewProps> = ({ content }) => {
  const sections = content?.sections || [];
  const references = content?.references || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 rounded-2xl shadow-sm text-neutral-900 dark:text-neutral-100 font-serif">
      {/* Report Cover Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8 space-y-3 font-sans">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="uppercase tracking-widest font-semibold text-emerald-600 dark:text-emerald-400">
            Synthesis Technical Report
          </span>
          <span>GenNote AI Academic Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-neutral-900 dark:text-white">
          {content?.title || 'Comprehensive Topic Report'}
        </h1>
        <div className="flex items-center gap-4 text-xs text-neutral-500 font-sans">
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span>•</span>
          <span>Scope: Grounded Synthesis</span>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 font-sans">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
          Table of Contents
        </h3>
        <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
          <li>1. Executive Summary</li>
          {sections.map((sec: any, i: number) => (
            <li key={i}>
              {i + 2}. {sec.title}
            </li>
          ))}
          <li>{sections.length + 2}. Synthesized Recommendations & Conclusions</li>
          <li>{sections.length + 3}. Grounded Source References</li>
        </ul>
      </div>

      {/* Executive Summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-sans text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
          1. Executive Summary
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
          {content?.executiveSummary || 'This report synthesizes primary principles, architectural trade-offs, and critical mechanisms identified across uploaded source materials.'}
        </p>
      </section>

      {/* Detailed Body Sections */}
      {sections.map((sec: any, i: number) => (
        <section key={i} className="space-y-3">
          <h2 className="text-lg font-bold font-sans text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            {i + 2}. {sec.title}
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
            {sec.content}
          </p>
          {sec.subsections && sec.subsections.map((sub: any, subI: number) => (
            <div key={subI} className="pl-4 border-l-2 border-emerald-500/40 space-y-1.5 my-3">
              <h4 className="text-sm font-semibold font-sans text-neutral-800 dark:text-neutral-200">
                {sub.title}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {sub.content}
              </p>
            </div>
          ))}
        </section>
      ))}

      {/* Conclusion */}
      {content?.conclusion && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold font-sans text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            {sections.length + 2}. Synthesized Recommendations & Conclusions
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
            {content.conclusion}
          </p>
        </section>
      )}

      {/* Grounded References */}
      {references.length > 0 && (
        <section className="space-y-3 font-sans pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Source Grounding & Verified References
          </h3>
          <div className="space-y-2">
            {references.map((ref: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-mono text-emerald-600">[{i + 1}]</span>
                <span>{ref}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
