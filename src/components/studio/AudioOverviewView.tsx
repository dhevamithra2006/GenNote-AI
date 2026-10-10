import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Download,
  Sparkles,
  Users,
  MessageSquare,
  AlertCircle,
  Radio,
  Headphones
} from 'lucide-react';

interface AudioOverviewViewProps {
  content: any;
  onRegenerate?: () => void;
}

export const AudioOverviewView: React.FC<AudioOverviewViewProps> = ({
  content,
  onRegenerate
}) => {
  // Language selector: 'en' for English, 'ta' for Tamil
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta'>('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [hasSpeech, setHasSpeech] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'dual' | 'female' | 'male'>('dual');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const dialogue = content?.dialogue || [];
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if dialogue is in Tamil
  const isTamilDialogue = dialogue.some((d: any) => /[\u0B80-\u0BFF]/.test(d?.text || ''));

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setHasSpeech(true);

      const updateVoices = () => {
        if (window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    } else {
      setHasSpeech(false);
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakLine = (index: number) => {
    if (!synthRef.current || index >= dialogue.length) {
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();
    const line = dialogue[index];
    const isLineTamil = /[\u0B80-\u0BFF]/.test(line.text || '');
    const utterance = new SpeechSynthesisUtterance(line.text);
    utteranceRef.current = utterance;

    // Set proper language tag so Tamil Unicode is pronounced properly
    utterance.lang = selectedLanguage === 'ta' ? 'ta-IN' : 'en-US';

    // Determine whether this speaker turn should sound Female or Male
    const isFemale = voiceGender === 'female' || (voiceGender === 'dual' && line.speaker !== 'guest');

    const voices = availableVoices.length > 0 ? availableVoices : synthRef.current.getVoices();
    if (selectedLanguage === 'ta') {
      const tamilVoices = voices.filter(v => v.lang.startsWith('ta') || v.lang.includes('ta-') || v.name.toLowerCase().includes('tamil'));
      if (tamilVoices.length > 0) {
        const matched = tamilVoices.find(v => {
          const n = v.name.toLowerCase();
          return isFemale ? (n.includes('female') || n.includes('google')) : (n.includes('male') || n.includes('valluvar'));
        }) || tamilVoices[0];
        utterance.voice = matched;
      }
      utterance.pitch = isFemale ? 1.25 : 0.82;
      utterance.rate = playbackSpeed;
    } else {
      const langVoices = voices.filter(v => v.lang.startsWith('en'));
      if (langVoices.length > 0) {
        const matched = langVoices.find(v => {
          const n = v.name.toLowerCase();
          return isFemale
            ? (n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('kore'))
            : (n.includes('male') || n.includes('david') || n.includes('alex') || n.includes('puck'));
        }) || langVoices[0];
        utterance.voice = matched;
      }
      utterance.pitch = isFemale ? 1.2 : 0.84;
      utterance.rate = playbackSpeed;
    }

    utterance.onend = () => {
      if (index + 1 < dialogue.length) {
        setCurrentLineIndex(index + 1);
        setProgressPercent(((index + 1) / dialogue.length) * 100);
        speakLine(index + 1);
      } else {
        setIsPlaying(false);
        setProgressPercent(100);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
    setCurrentLineIndex(index);
    setProgressPercent((index / dialogue.length) * 100);
  };

  const togglePlay = () => {
    if (!synthRef.current || !hasSpeech) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
        speakLine(currentLineIndex >= dialogue.length ? 0 : currentLineIndex);
      }
    }
  };

  const restartAudio = () => {
    if (synthRef.current) synthRef.current.cancel();
    setCurrentLineIndex(0);
    setProgressPercent(0);
    if (isPlaying) {
      speakLine(0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying) {
      speakLine(currentLineIndex);
    }
  };

  const handleDownloadTranscript = () => {
    let script = `GENNOTE AUDIO OVERVIEW DEEP DIVE TRANSCRIPT\nDuration: ${content.duration || 'N/A'}\n\n`;
    dialogue.forEach((d: any) => {
      script += `[${d.speaker === 'host' ? 'Dr. Sarah (Host)' : 'Marcus (Discussion Partner)'}]:\n${d.text}\n\n`;
    });
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GenNote_Audio_Overview_Transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Speech Synthesis Unavailable Banner */}
      {!hasSpeech && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Audio playback unavailable in this browser</span>
            <span className="text-amber-800 dark:text-amber-300">
              Your browser does not support the Web Speech API. You can read the full dialogue script below or download it as a text file.
            </span>
          </div>
        </div>
      )}

      {/* Player Controller Box */}
      <div className="relative p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-900 text-white shadow-2xl border border-neutral-800/80 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar info */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              NotebookLM Deep Dive Audio
            </span>
            {isTamilDialogue && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                தமிழ் (ta-IN)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Waveform graphic when playing */}
            {isPlaying && (
              <div className="flex items-center gap-0.5 h-4 px-2">
                <span className="w-1 bg-emerald-400 rounded-full h-3 animate-pulse" />
                <span className="w-1 bg-emerald-400 rounded-full h-4 animate-pulse [animation-delay:150ms]" />
                <span className="w-1 bg-emerald-400 rounded-full h-2 animate-pulse [animation-delay:300ms]" />
                <span className="w-1 bg-emerald-400 rounded-full h-4 animate-pulse [animation-delay:450ms]" />
                <span className="w-1 bg-emerald-400 rounded-full h-3 animate-pulse [animation-delay:200ms]" />
              </div>
            )}
            <span className="text-xs font-mono text-neutral-400">
              Est. {content.duration || '3:45'}
            </span>
          </div>
        </div>

        {/* Currently Speaking Card */}
        <div className="relative z-10 mb-6 p-5 rounded-2xl bg-white/5 border border-white/10 min-h-[100px] flex items-center backdrop-blur-sm">
          {dialogue[currentLineIndex] ? (
            <div className="w-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  dialogue[currentLineIndex].speaker === 'host'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  {dialogue[currentLineIndex].speaker === 'host' ? 'Dr. Sarah (Host)' : 'Marcus (Co-Host)'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Turn {currentLineIndex + 1} of {dialogue.length}
                </span>
              </div>
              <p className="text-sm sm:text-base font-medium text-neutral-100 leading-relaxed italic">
                "{dialogue[currentLineIndex].text}"
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Click play to start the interactive multimodal audio synthesis.</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mb-6">
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden cursor-pointer">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-neutral-400 mt-2">
            <span>Progress: {Math.round(progressPercent)}%</span>
            <span>{currentLineIndex + 1} / {dialogue.length} lines</span>
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={restartAudio}
              className="p-2.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Restart podcast"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!hasSpeech}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-40 hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (currentLineIndex + 1 < dialogue.length) {
                  const next = currentLineIndex + 1;
                  setCurrentLineIndex(next);
                  speakLine(next);
                }
              }}
              className="p-2.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Skip to next speaker turn"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Voice Version (Dual, Female, Male) */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl text-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setVoiceGender('dual');
                if (isPlaying) speakLine(currentLineIndex);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                voiceGender === 'dual'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Dual voices: Co-Host & Guest"
            >
              👥 Dual
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceGender('female');
                if (isPlaying) speakLine(currentLineIndex);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                voiceGender === 'female'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Female voice (பெண் குரல்)"
            >
              👩 Female
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceGender('male');
                if (isPlaying) speakLine(currentLineIndex);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                voiceGender === 'male'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Male voice (ஆண் குரல்)"
            >
              👨 Male
            </button>
          </div>

          {/* Speed selectors */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl text-xs backdrop-blur-sm">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
                  playbackSpeed === speed
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Download Transcript Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTranscript}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Transcript</span>
            </button>
          </div>
        </div>
      </div>

      {/* Complete Dialogue Script Display */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          Interactive Dialogue Transcript ({dialogue.length} turns)
        </h4>

        <div className="space-y-2.5">
          {dialogue.map((turn: any, i: number) => {
            const isActive = i === currentLineIndex;
            return (
              <div
                key={i}
                onClick={() => {
                  setCurrentLineIndex(i);
                  speakLine(i);
                  setIsPlaying(true);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    turn.speaker === 'host'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  }`}>
                    {turn.speaker === 'host' ? 'Dr. Sarah (Host)' : 'Marcus (Co-Host)'}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Turn #{i + 1}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {turn.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
