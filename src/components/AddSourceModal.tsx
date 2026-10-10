import React, { useState, useRef } from 'react';
import {
  Upload,
  Globe,
  Youtube,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Loader2,
  FileCode,
  Sparkles,
  FileAudio,
  Film,
  FileSpreadsheet,
  Image,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Source } from '../types';

interface AddSourceModalProps {
  notebookId: string;
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: (source: Source) => void;
}

type TabType = 'file' | 'website' | 'youtube' | 'text';

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  notebookId,
  isOpen,
  onClose,
  onSourceAdded
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const stepSequence = [
    'Uploading source...',
    'Reading document structure...',
    'Extracting multimodal content...',
    'Segmenting text into semantic chunks...',
    'Generating vector embeddings...',
    'Indexing for grounded citations...',
    'Finalizing source...'
  ];

  const simulateProgressSteps = async () => {
    for (let i = 0; i < stepSequence.length; i++) {
      setCurrentStepIndex(i);
      setProcessingStep(stepSequence[i]);
      await new Promise(r => setTimeout(r, 420));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    setCurrentStepIndex(0);

    try {
      const progressPromise = simulateProgressSteps();

      if (activeTab === 'file') {
        if (!selectedFile) throw new Error('Please select a file to upload');

        const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
        let type: any = 'txt';
        if (ext === 'pdf') type = 'pdf';
        else if (ext === 'docx' || ext === 'doc') type = 'docx';
        else if (ext === 'pptx' || ext === 'ppt') type = 'pptx';
        else if (ext === 'csv') type = 'csv';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) type = 'image';
        else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video';

        let content: string | undefined;
        let fileBase64: string | undefined;

        if (type === 'txt' || type === 'csv') {
          content = await selectedFile.text();
        } else {
          fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const b64 = res.split(',')[1] || res;
              resolve(b64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        }

        const { source } = await api.processSource(notebookId, {
          type,
          originalName: selectedFile.name,
          title: selectedFile.name,
          content,
          fileBase64,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size
        });

        await progressPromise;
        onSourceAdded(source);
        onClose();
      } else if (activeTab === 'website') {
        if (!websiteUrl.trim()) throw new Error('Please enter a website URL');

        const { source } = await api.processSource(notebookId, {
          type: 'website',
          url: websiteUrl.trim(),
          title: websiteUrl.trim()
        });

        await progressPromise;
        onSourceAdded(source);
        onClose();
      } else if (activeTab === 'youtube') {
        if (!youtubeUrl.trim()) throw new Error('Please enter a YouTube video URL');

        const { source } = await api.processSource(notebookId, {
          type: 'youtube',
          url: youtubeUrl.trim(),
          title: `YouTube: ${youtubeUrl.substring(0, 35)}...`
        });

        await progressPromise;
        onSourceAdded(source);
        onClose();
      } else if (activeTab === 'text') {
        if (!pastedContent.trim()) throw new Error('Please paste your study notes or text content');

        const { source } = await api.processSource(notebookId, {
          type: 'text',
          title: pastedTitle.trim() || 'Pasted Notes',
          content: pastedContent.trim()
        });

        await progressPromise;
        onSourceAdded(source);
        onClose();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'We could not process this source. Please check the input and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFormatBadge = (name: string, icon: React.ReactNode) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
      {icon}
      {name}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between relative z-10 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Add Knowledge Sources
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  Multimodal RAG
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ground answers, flashcards, slides & podcasts in your materials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Type Navigation */}
        <div className="flex p-1.5 mx-6 mt-4 bg-neutral-100/80 dark:bg-neutral-800/60 rounded-2xl relative z-10">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setError(null); }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Files</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('website'); setError(null); }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'website'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Website</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('youtube'); setError(null); }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-500" />
            <span>YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(null); }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 relative z-10">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-neutral-300 dark:border-neutral-700/80 hover:border-emerald-500/70 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.csv,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
                  className="hidden"
                />
                
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all ${
                  selectedFile
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>

                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {selectedFile ? selectedFile.name : 'Click to browse or drop your document here'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Drag and drop any academic or professional material
                </p>

                {/* Formats pill row */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
                  {getFormatBadge('PDF', <FileText className="w-2.5 h-2.5 text-rose-500" />)}
                  {getFormatBadge('Word / PPTX', <FileCode className="w-2.5 h-2.5 text-blue-500" />)}
                  {getFormatBadge('CSV / Data', <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-500" />)}
                  {getFormatBadge('Audio (MP3/WAV)', <FileAudio className="w-2.5 h-2.5 text-purple-500" />)}
                  {getFormatBadge('Video / Image', <Film className="w-2.5 h-2.5 text-amber-500" />)}
                </div>

                {selectedFile && (
                  <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs rounded-full font-medium">
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <span className="text-emerald-400">•</span>
                    <span>Ready for ingestion</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Website */}
          {activeTab === 'website' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Web Article / Research URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://en.wikipedia.org/wiki/Operating_system"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50">
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Try an example topic:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'OS Paging (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Paging' },
                    { label: 'Transformer Neural Nets', url: 'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)' }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setWebsiteUrl(item.url)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: YouTube */}
          {activeTab === 'youtube' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  YouTube Lecture or Video URL
                </label>
                <div className="relative">
                  <Youtube className="w-4 h-4 text-rose-500 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <Youtube className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <p className="text-[11px] leading-relaxed">
                  GenNote AI automatically parses transcripts, timestamps, and key discussion chapters for accurate multimodal grounding.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Paste Text */}
          {activeTab === 'text' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Source Title / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 3 Handwritten Lecture Notes"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Pasted Notes & Text Content
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {pastedContent.length} chars
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Paste lecture notes, syllabi, study guides, code explanations, or reference quotes..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-neutral-900 dark:text-white placeholder-neutral-400 resize-none font-mono text-[11px]"
                  required
                />
              </div>
            </div>
          )}

          {/* Ingestion Steps Live Progress Indicator */}
          {isProcessing && (
            <div className="mt-5 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {processingStep || 'Processing source...'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  Step {currentStepIndex + 1} of {stepSequence.length}
                </span>
              </div>
              <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / stepSequence.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4.5 py-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (activeTab === 'file' && !selectedFile)}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Source...</span>
                </>
              ) : (
                <>
                  <span>Add to Notebook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
