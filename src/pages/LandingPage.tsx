import React from 'react';
import {
  BookOpen,
  Sparkles,
  Headphones,
  Presentation,
  Video,
  Network,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Brain,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const CAPABILITIES = [
  {
    icon: Headphones,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    title: 'Audio Overview & Podcasts',
    desc: 'Generates two-host deep-dive audio discussions with real-time speech playback and transcripts.'
  },
  {
    icon: Presentation,
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    title: 'Interactive Slide Decks',
    desc: 'Transforms long-form notes into presentation decks complete with slide notes and visual prompts.'
  },
  {
    icon: Video,
    color: 'from-cyan-500 to-sky-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    title: 'Video Storyboards',
    desc: 'Creates scene-by-scene educational video scripts, timecoded breakdowns, and visual prompts.'
  },
  {
    icon: Network,
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-green-50 dark:bg-green-950/40',
    title: 'Interactive Mind Maps',
    desc: 'Visual hierarchical concept graphs with collapsible branches, zoom, and deep node exploration.'
  },
  {
    icon: HelpCircle,
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    title: 'Practice Quizzes & Flashcards',
    desc: 'Spaced repetition 3D flipcards and exam simulators with citations and topic mastery analytics.'
  },
  {
    icon: ShieldCheck,
    color: 'from-emerald-600 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    title: 'Zero Hallucination RAG',
    desc: 'Every response and artifact is directly grounded in your uploaded documents with verifiable citations.'
  }
];

const STATS = [
  { value: '13', label: 'AI Artifact Types' },
  { value: '5+', label: 'Source Formats' },
  { value: '3', label: 'Languages' },
  { value: '100%', label: 'Source Grounded' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col overflow-x-hidden">

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-28 max-w-5xl mx-auto w-full text-center">

        {/* Decorative glowing blobs */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/8 blur-3xl" />
        <div className="pointer-events-none absolute top-10 left-0 w-64 h-64 rounded-full bg-teal-400/8 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-0 w-64 h-64 rounded-full bg-cyan-400/8 blur-3xl" />

        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Multimodal AI Notebook &amp; Grounded Study Assistant</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up stagger-1 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Turn your notes, PDFs,&nbsp;&amp;&nbsp;lectures into{' '}
          <span className="text-shimmer">living knowledge.</span>
        </h1>

        {/* Subtext */}
        <p className="animate-fade-in-up stagger-2 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-10">
          GenNote AI ingests documents, textbooks, web links, audio, and YouTube videos to synthesize
          verified answers, interactive slide decks, audio overviews, mind maps, and practice quizzes.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up stagger-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={onStart}
            className="group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer glow-emerald"
          >
            <span>Open Study Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            Sign In with Email
          </button>
        </div>

        {/* Feature Pills */}
        <div className="animate-fade-in-up stagger-4 flex flex-wrap justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          {['PDF, DOCX, PPTX & YouTube Ingestion', '13 AI Studio Artifact Types', 'Source Grounding & Page Citations'].map((pill) => (
            <span
              key={pill}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-sm hover:border-emerald-400 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <div key={i} className={`animate-fade-in-up stagger-${i + 1}`}>
              <p className="text-3xl font-extrabold text-shimmer">{s.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities Bento Grid ───────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
            <Brain className="w-3.5 h-3.5" /> AI Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Everything for academic mastery
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl mx-auto">
            Engineered to overcome hallucination through rigorous RAG semantic grounding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={i}
                className={`animate-fade-in-up stagger-${(i % 6) + 1} card-lift group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-emerald-400/60 dark:hover:border-emerald-600/40 flex flex-col gap-4`}
              >
                <div className={`w-11 h-11 rounded-xl ${cap.bg} flex items-center justify-center ring-1 ring-black/5 dark:ring-white/5`}>
                  <div className={`bg-gradient-to-br ${cap.color} p-0.5 rounded-lg`}>
                    <div className="bg-white dark:bg-neutral-900 rounded-md p-1.5">
                      <Icon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1.5">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-24 max-w-4xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-10 text-center shadow-xl shadow-emerald-900/20">
          {/* Decorative blobs inside banner */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

          <Sparkles className="w-8 h-8 text-white/80 mx-auto mb-4 animate-float" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to transform how you learn?
          </h2>
          <p className="text-sm text-emerald-100 mb-8 max-w-md mx-auto">
            Upload your first source and generate your first AI artifact in under 60 seconds.
          </p>
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-emerald-700 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:bg-emerald-50 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <span>Start for Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 px-6 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-neutral-900 dark:text-white">GenNote AI</span>
            <span className="text-neutral-400">— Multimodal Study Operating System</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onStart} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Workspace
            </button>
            <button onClick={onLogin} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Sign In
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">©&nbsp;2026 GenNote AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
