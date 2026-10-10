import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ZoomIn,
  ZoomOut,
  FileText,
  Copy,
  Check,
  Sparkles,
  Layers,
  Table,
  Eye,
  Video,
  Clock,
  Presentation
} from 'lucide-react';
import { Source, SourceChunk } from '../types';
import { api } from '../services/api';
import { useLanguageMode } from '../context/LanguageModeContext';

interface SourceViewerModalProps {
  source: Source | null;
  initialChunkIndex?: number;
  highlightText?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  source,
  initialChunkIndex,
  highlightText,
  isOpen,
  onClose
}) => {
  const { t } = useLanguageMode();
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeView, setActiveView] = useState<'chunks' | 'full' | 'scenes'>('chunks');
  const [copied, setCopied] = useState(false);

  const chunkRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (source && isOpen) {
      setLoading(true);
      setSearchTerm('');
      setActiveView('chunks');
      api.getSource(source.id)
        .then(res => {
          setChunks(res.chunks || []);
        })
        .catch(err => console.error('Failed to load chunks:', err))
        .finally(() => setLoading(false));
    }
  }, [source, isOpen]);

  // Auto-scroll to the target chunk after chunks are loaded
  useEffect(() => {
    if (initialChunkIndex !== undefined && chunks.length > 0) {
      const el = chunkRefs.current[initialChunkIndex];
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
    }
  }, [chunks, initialChunkIndex]);

  if (!isOpen || !source) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(source.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredChunks = chunks.filter(c =>
    !searchTerm ||
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sectionTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasScenes = !!(source.metadata?.scenes && source.metadata.scenes.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {source.title}
              </h2>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="font-mono uppercase font-semibold">{source.type}</span>
                <span>•</span>
                <span>{chunks.length} Chunks</span>
                {source.pageCount && (
                  <span className="px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 font-mono text-[10px]">
                    {source.pageCount} {t('pageCountLabel')}
                  </span>
                )}
                {source.slideCount && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                    {source.slideCount} {t('slideCountLabel')}
                  </span>
                )}
                {source.metadata?.isOcr && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium text-[10px]">
                    {t('ocrDetected')}
                  </span>
                )}
                {source.metadata?.hasTables && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium text-[10px]">
                    {t('tablesDetected')}
                  </span>
                )}
                {hasScenes && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium text-[10px]">
                    {t('videoScenes')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveView('chunks')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeView === 'chunks'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Chunk Segments
              </button>
              <button
                onClick={() => setActiveView('full')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeView === 'full'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Full Document
              </button>
              {hasScenes && (
                <button
                  onClick={() => setActiveView('scenes')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeView === 'scenes'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  Scenes & Audio
                </button>
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Copy extracted text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Zoom */}
        <div className="px-6 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search inside source document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-emerald-500 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-neutral-500">
            <button
              onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] min-w-[3rem] text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/40 dark:bg-neutral-950/40">
          <div
            className="max-w-3xl mx-auto transition-all duration-150"
            style={{ fontSize: `${zoomLevel}%` }}
          >
            {highlightText && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Cited Passage: </span>
                  <span>"{highlightText}"</span>
                </div>
              </div>
            )}

            {activeView === 'chunks' && (
              <div className="space-y-4">
                {filteredChunks.length === 0 ? (
                  <p className="text-center text-xs text-neutral-500 py-12">
                    No matching passages found.
                  </p>
                ) : (
                  filteredChunks.map((chunk, idx) => {
                    const isTarget = initialChunkIndex === chunk.chunkIndex;

                    // Inline text highlighter for the cited quote
                    const renderContent = () => {
                      if (!highlightText || !chunk.content.toLowerCase().includes(highlightText.toLowerCase().slice(0, 30))) {
                        return <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">{chunk.content}</p>;
                      }
                      const needle = highlightText.slice(0, 60);
                      const idx2 = chunk.content.toLowerCase().indexOf(needle.toLowerCase());
                      if (idx2 === -1) return <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">{chunk.content}</p>;
                      return (
                        <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                          {chunk.content.slice(0, idx2)}
                          <mark className="bg-amber-200 dark:bg-amber-700 text-neutral-900 dark:text-white rounded px-0.5">
                            {chunk.content.slice(idx2, idx2 + needle.length)}
                          </mark>
                          {chunk.content.slice(idx2 + needle.length)}
                        </p>
                      );
                    };

                    return (
                      <div
                        key={chunk.id}
                        ref={el => { chunkRefs.current[chunk.chunkIndex] = el; }}
                        className={`p-4 rounded-xl border transition-all ${
                          isTarget
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-400/30'
                            : 'bg-white dark:bg-neutral-800/80 border-neutral-200/80 dark:border-neutral-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-700 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {chunk.sectionTitle || `Section ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span>Chunk #{chunk.chunkIndex + 1}</span>
                            {chunk.pageNumber && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-[10px]">
                                Page {chunk.pageNumber}
                              </span>
                            )}
                            {chunk.slideNumber && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded text-[10px] flex items-center gap-1">
                                <Presentation className="w-3 h-3" />
                                Slide {chunk.slideNumber}
                              </span>
                            )}
                            {chunk.timestamp && (
                              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {chunk.timestamp}
                              </span>
                            )}
                          </div>
                        </div>
                        {renderContent()}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeView === 'full' && (
              <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <pre className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans font-normal">
                  {source.extractedText}
                </pre>
              </div>
            )}

            {activeView === 'scenes' && hasScenes && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs text-purple-900 dark:text-purple-200">
                  <span className="font-semibold">Automated Scene Segmentation & Transcription: </span>
                  Video keyframes, visual actions, and narration extracted from video stream.
                </div>
                {source.metadata?.scenes?.map((scene: any, sIdx: number) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        {scene.sceneTitle || `Scene ${sIdx + 1}`}
                      </h4>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300">
                        {scene.timestamp || `00:${String(sIdx * 30).padStart(2, '0')}`}
                      </span>
                    </div>
                    {scene.visualDescription && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 italic">
                        Visual: {scene.visualDescription}
                      </p>
                    )}
                    {scene.narration && (
                      <p className="text-xs text-neutral-800 dark:text-neutral-200">
                        Narration: "{scene.narration}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
