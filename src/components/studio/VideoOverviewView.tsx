import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Film
} from 'lucide-react';

interface VideoOverviewViewProps {
  content: any;
}

export const VideoOverviewView: React.FC<VideoOverviewViewProps> = ({ content }) => {
  const scenes = content?.scenes || [];
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveSceneIndex((prev) => (prev + 1) % (scenes.length || 1));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, scenes.length]);

  const activeScene = scenes[activeSceneIndex] || scenes[0] || {
    sceneNumber: 1,
    timecode: '00:00 - 00:30',
    title: 'Introduction',
    visualDescription: 'Kinetic typography title',
    narration: 'Welcome to this visual walkthrough.'
  };

  return (
    <div className="space-y-6">
      {/* Video Simulated Stage */}
      <div className="relative aspect-[16/9] w-full bg-neutral-950 text-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-hidden border border-neutral-800">
        {/* Animated preview background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-neutral-900/60 to-transparent pointer-events-none" />

        {/* Scene Indicator */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold">
              SCENE {activeScene.sceneNumber || activeSceneIndex + 1}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {activeScene.timecode}
            </span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Storyboard' : 'Simulate Video'}</span>
          </button>
        </div>

        {/* Dynamic Center Simulation */}
        <div className="relative z-10 my-auto text-center px-4 max-w-xl mx-auto space-y-3">
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/20">
            {activeScene.title}
          </span>
          <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
            {activeScene.onScreenText || activeScene.title}
          </h3>
          <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-xs text-neutral-300 italic">
            "{activeScene.narration}"
          </div>
        </div>

        {/* Visual Cue Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] truncate max-w-[320px]">
              Visual: {activeScene.visualDescription}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Total Target: {content.totalDuration || '3:00'}
          </span>
        </div>
      </div>

      {/* Storyboard Scene Breakdown Cards */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
          <Film className="w-3.5 h-3.5" />
          Full Video Storyboard & Script Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenes.map((scene: any, i: number) => {
            const isSelected = i === activeSceneIndex;
            return (
              <div
                key={i}
                onClick={() => {
                  setActiveSceneIndex(i);
                  setIsPlaying(false);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white dark:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-700/80 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Scene #{scene.sceneNumber || i + 1}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                    {scene.timecode}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-neutral-900 dark:text-white mb-1.5">
                  {scene.title}
                </h5>

                <div className="mb-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Visual Cue: </span>
                  {scene.visualDescription}
                </div>

                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                  "{scene.narration}"
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
