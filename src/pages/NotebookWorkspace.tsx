import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  Download,
  BookOpen,
  CheckSquare,
  Square,
  Headphones,
  Presentation,
  Video,
  Network,
  HelpCircle,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Layers,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sliders,
  Filter,
  Check,
  Globe,
  Youtube,
  FileUp,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  Notebook,
  Source,
  ChatMessage,
  Artifact,
  ArtifactType,
  Citation
} from '../types';
import { api } from '../services/api';
import { useLanguageMode } from '../context/LanguageModeContext';
import { AddSourceModal } from '../components/AddSourceModal';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { ExportCenterModal } from '../components/ExportCenterModal';
import { SummaryView } from '../components/studio/SummaryView';
import { AudioOverviewView } from '../components/studio/AudioOverviewView';
import { SlideDeckView } from '../components/studio/SlideDeckView';
import { VideoOverviewView } from '../components/studio/VideoOverviewView';
import { MindMapView } from '../components/studio/MindMapView';
import { ReportView } from '../components/studio/ReportView';
import { FlashcardsView } from '../components/studio/FlashcardsView';
import { QuizView } from '../components/studio/QuizView';
import { InfographicView } from '../components/studio/InfographicView';
import { DataTableView } from '../components/studio/DataTableView';
import { StudyGuideView } from '../components/studio/StudyGuideView';
import { ImportantQuestionsView } from '../components/studio/ImportantQuestionsView';
import { DefinitionsView } from '../components/studio/DefinitionsView';

interface NotebookWorkspaceProps {
  notebookId: string;
  onNavigateDashboard: () => void;
  onOpenSearch: () => void;
}

export const NotebookWorkspace: React.FC<NotebookWorkspaceProps> = ({
  notebookId,
  onNavigateDashboard,
  onOpenSearch
}) => {
  const { language, mode, t } = useLanguageMode();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  // Studio Generator states
  const [activeStudioType, setActiveStudioType] = useState<ArtifactType>('summary');
  const [generationInstruction, setGenerationInstruction] = useState('');
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);
  const [isStudioMaximized, setIsStudioMaximized] = useState(false);

  // Modals
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [viewerSource, setViewerSource] = useState<Source | null>(null);
  const [viewerChunkIndex, setViewerChunkIndex] = useState<number | undefined>(undefined);
  const [viewerHighlight, setViewerHighlight] = useState<string | undefined>(undefined);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false);

  // Workspace Layout Views for smaller screens
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'studio'>('chat');

  useEffect(() => {
    loadWorkspace();
  }, [notebookId]);

  const loadWorkspace = async () => {
    try {
      const [nbRes, srcRes, chatRes, artRes] = await Promise.all([
        api.getNotebook(notebookId),
        api.getSources(notebookId),
        api.getChat(notebookId),
        api.getArtifacts(notebookId)
      ]);

      setNotebook(nbRes.notebook);
      setSources(srcRes.sources || []);
      // Default: select all sources for RAG grounding
      setSelectedSourceIds(srcRes.sources.map(s => s.id));
      setChatMessages(chatRes.messages || []);
      setArtifacts(artRes.artifacts || []);
      if (artRes.artifacts.length > 0) {
        setSelectedArtifactId(artRes.artifacts[0].id);
      }
    } catch (err) {
      console.error('Workspace load error:', err);
    }
  };

  // Source selection toggle
  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAllSources = () => {
    if (selectedSourceIds.length === sources.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(sources.map(s => s.id));
    }
  };

  const handleDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this source from knowledge base?')) return;
    try {
      await api.deleteSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      setSelectedSourceIds(prev => prev.filter(sId => sId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openSourceDetails = (source: Source, chunkIdx?: number, highlight?: string) => {
    setViewerSource(source);
    setViewerChunkIndex(chunkIdx);
    setViewerHighlight(highlight);
    setIsViewerOpen(true);
  };

  // Open a citation by finding the best matching chunk in the source
  const openCitationDeepLink = async (cite: any) => {
    const targetSrc = sources.find(
      s => s.id === cite.sourceId || s.title === cite.sourceTitle || s.title.includes(cite.sourceTitle)
    );
    if (!targetSrc) return;

    try {
      const res = await api.getSource(targetSrc.id);
      const chunks: any[] = res.chunks || [];

      // Priority: match by pageNumber, slideNumber, timestamp, sectionTitle, then quote substring
      let bestChunkIdx: number | undefined;
      for (const chunk of chunks) {
        if (cite.pageNumber !== undefined && chunk.pageNumber === cite.pageNumber) {
          bestChunkIdx = chunk.chunkIndex; break;
        }
        if (cite.slideNumber !== undefined && chunk.slideNumber === cite.slideNumber) {
          bestChunkIdx = chunk.chunkIndex; break;
        }
        if (cite.timestamp && chunk.timestamp === cite.timestamp) {
          bestChunkIdx = chunk.chunkIndex; break;
        }
        if (cite.sectionTitle && chunk.sectionTitle &&
            chunk.sectionTitle.toLowerCase().includes(cite.sectionTitle.toLowerCase())) {
          bestChunkIdx = chunk.chunkIndex;
        }
      }
      if (bestChunkIdx === undefined && cite.quote) {
        for (const chunk of chunks) {
          if (chunk.content.toLowerCase().includes(cite.quote.toLowerCase().slice(0, 40))) {
            bestChunkIdx = chunk.chunkIndex; break;
          }
        }
      }

      openSourceDetails(targetSrc, bestChunkIdx, cite.quote);
    } catch {
      openSourceDetails(targetSrc, undefined, cite.quote);
    }
  };

  // Format a citation reference label
  const formatCiteLabel = (cite: any): string => {
    const parts: string[] = [cite.sourceTitle];
    if (cite.pageNumber !== undefined) parts.push(`p.${cite.pageNumber}`);
    else if (cite.slideNumber !== undefined) parts.push(`Slide ${cite.slideNumber}`);
    else if (cite.timestamp) parts.push(cite.timestamp);
    else if (cite.sectionTitle) parts.push(`§${cite.sectionTitle}`);
    return parts.join(' — ');
  };

  // Persist artifact content changes back to server
  const handleUpdateArtifact = async (artifactId: string, newContent: any) => {
    try {
      const res = await api.updateArtifact(artifactId, { content: newContent });
      setArtifacts(prev => prev.map(a => a.id === artifactId ? res.artifact : a));
    } catch (err) {
      console.error('Artifact update failed:', err);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSendingChat) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setIsSendingChat(true);

    try {
      const res = await api.sendMessage(notebookId, userText, selectedSourceIds, language, mode);
      setChatMessages(prev => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Generate Studio Artifact
  const handleGenerateArtifact = async (typeToGenerate?: ArtifactType) => {
    const type = typeToGenerate || activeStudioType;
    setIsGeneratingArtifact(true);

    try {
      const res = await api.generateArtifact(notebookId, {
        type,
        instruction: generationInstruction.trim() || undefined,
        sourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
        language,
        mode
      });

      setArtifacts(prev => [res.artifact, ...prev]);
      setSelectedArtifactId(res.artifact.id);
      setActiveStudioType(res.artifact.type);
      // Stay on current view after generation (no forced tab/maximized reset)

      setGenerationInstruction('');
    } catch (err: any) {
      alert(err.message || 'Failed to generate artifact. Ensure you have sources uploaded.');
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  const handleDeleteArtifact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this artifact?')) return;
    try {
      await api.deleteArtifact(id);
      const remaining = artifacts.filter(a => a.id !== id);
      setArtifacts(remaining);
      if (selectedArtifactId === id) {
        const nextMatch = remaining.find(a => a.type === activeStudioType) || remaining[0];
        setSelectedArtifactId(nextMatch?.id || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeArtifact =
    artifacts.find(a => a.id === selectedArtifactId) ||
    artifacts.find(a => a.type === activeStudioType) ||
    artifacts[0];

  const studioTypesList: Array<{ type: ArtifactType; labelKey: string; defaultLabel: string; icon: any }> = [
    { type: 'summary', labelKey: 'summary', defaultLabel: 'Summary', icon: FileText },
    { type: 'audio_overview', labelKey: 'audioOverview', defaultLabel: 'Audio Overview', icon: Headphones },
    { type: 'slide_deck', labelKey: 'slideDeck', defaultLabel: 'Slide Deck', icon: Presentation },
    { type: 'video_overview', labelKey: 'videoOverview', defaultLabel: 'Video Storyboard', icon: Video },
    { type: 'mind_map', labelKey: 'mindMap', defaultLabel: 'Mind Map', icon: Network },
    { type: 'report', labelKey: 'report', defaultLabel: 'Technical Report', icon: BookOpen },
    { type: 'flashcards', labelKey: 'flashcards', defaultLabel: 'Flashcards', icon: Copy },
    { type: 'quiz', labelKey: 'quiz', defaultLabel: 'Practice Quiz', icon: HelpCircle },
    { type: 'infographic', labelKey: 'infographic', defaultLabel: 'Infographic', icon: BarChart3 },
    { type: 'data_table', labelKey: 'dataTable', defaultLabel: 'Data Table', icon: FileSpreadsheet },
    { type: 'study_guide', labelKey: 'studyGuide', defaultLabel: 'Study Guide', icon: CheckSquare },
    { type: 'questions', labelKey: 'importantQuestions', defaultLabel: 'Exam Questions', icon: MessageSquare },
    { type: 'definitions', labelKey: 'definitions', defaultLabel: 'Definitions', icon: Sparkles }
  ];

  const getSuggestedPrompts = () => {
    if (language === 'ta') {
      return [
        'மூலங்களிலிருந்து முக்கிய கருத்துக்களை எளிமையாக விளக்குங்கள்',
        'பாடத்தின் முக்கியமான 5 குறிப்புகளைத் தொகுத்துத் தருக',
        'முக்கிய சூத்திரங்கள் மற்றும் வரையறைகளை பட்டியலிடுங்கள்',
        'தேர்வுக்குத் தேவையான முக்கிய வினாக்களை உருவாக்குங்கள்'
      ];
    }
    if (language === 'hi') {
      return [
        'स्रोतों से मुख्य अवधारणा को सरल शब्दों में समझाएं',
        'अध्ययन सामग्री से 5 मुख्य बिंदुओं का सारांश दें',
        'महत्वपूर्ण सूत्रों और परिभाषाओं की सूची बनाएं',
        'परीक्षा की तैयारी के लिए महत्वपूर्ण प्रश्न बताएं'
      ];
    }
    return [
      'Explain the core concept in simple terms',
      'What are the key trade-offs mentioned in the sources?',
      'Synthesize a 5-bullet summary of the main formulas',
      'Compare the primary architectures discussed'
    ];
  };

  const suggestedPrompts = getSuggestedPrompts();

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#f7f8fa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden">
      {/* Mobile view switcher tab strip */}
      <div className="md:hidden flex border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-2 py-1.5 gap-1">
        {(['sources', 'chat', 'studio'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              mobileTab === tab
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab === 'sources' ? `${t('sources')} (${sources.length})` :
             tab === 'studio'  ? `${t('studio')} (${artifacts.length})` :
             t('chat')}
          </button>
        ))}
      </div>

      {/* Main 3-Column Cockpit */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* COLUMN 1: SOURCES PANEL (Left) */}
        {/* ========================================================================= */}
        <div className={`w-full md:w-72 lg:w-80 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 flex flex-col shrink-0 ${isStudioMaximized ? 'hidden' : (mobileTab !== 'sources' ? 'hidden md:flex' : 'flex')}`}>
          {/* Sources Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">
                {t('sources')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {sources.length}
              </span>
            </div>

            <button
              onClick={() => setIsAddSourceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addSource')}</span>
            </button>
          </div>

          {/* Select all bar */}
          {sources.length > 0 && (
            <div className="px-4 py-2 bg-neutral-50/70 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
              <button
                onClick={selectAllSources}
                className="flex items-center gap-1.5 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                {selectedSourceIds.length === sources.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{selectedSourceIds.length === sources.length ? t('clearSelection') : t('selectAll')}</span>
              </button>
              <span className="font-mono text-emerald-600 font-medium">{selectedSourceIds.length} active</span>
            </div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sources.length === 0 ? (
              <div className="py-12 text-center px-4 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">
                  {t('uploadPrompt')}
                </p>
                <button
                  onClick={() => setIsAddSourceOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {t('addSource')}
                </button>
              </div>
            ) : (
              sources.map((src) => {
                const isSelected = selectedSourceIds.includes(src.id);
                return (
                  <div
                    key={src.id}
                    onClick={() => openSourceDetails(src)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-2.5 group ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-700/50 shadow-sm'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 opacity-50 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSourceSelection(src.id);
                        }}
                        className="mt-0.5 shrink-0 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400 hover:text-emerald-500" />
                        )}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {src.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                          <span className="uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wide">{src.type}</span>
                          <span className="text-neutral-300 dark:text-neutral-600">·</span>
                          <span>{src.chunksCount || 0} chunks</span>
                          {src.pageCount  && <><span className="text-neutral-300 dark:text-neutral-600">·</span><span>{src.pageCount}p</span></>}
                          {src.slideCount && <><span className="text-neutral-300 dark:text-neutral-600">·</span><span className="text-indigo-500 dark:text-indigo-400">{src.slideCount} slides</span></>}
                        </div>
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {src.metadata?.isOcr && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              OCR
                            </span>
                          )}
                          {src.metadata?.hasTables && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                              Tables
                            </span>
                          )}
                          {src.metadata?.hasScenes && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              Scenes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSource(src.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all shrink-0"
                      title="Remove source"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: CHAT & GROUNDED QA (Center) */}
        {/* ========================================================================= */}
        <div className={`flex-1 border-r border-neutral-200 dark:border-neutral-800 bg-[#fafaf9] dark:bg-neutral-950 flex flex-col ${isStudioMaximized ? 'hidden' : (mobileTab !== 'chat' ? 'hidden md:flex' : 'flex')}`}>
          {/* Chat Header Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900/60">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                {t('chat')}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                mode === 'study'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              }`}>
                {mode === 'study' ? t('studyMode') : t('researchMode')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-[11px] text-neutral-500">
                {t('sources')}: <strong className="text-emerald-600">{selectedSourceIds.length}</strong>
              </span>
              {chatMessages.length > 0 && (
                <button
                  onClick={async () => {
                    await api.clearChat(notebookId);
                    setChatMessages([]);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
                  title={t('clearChat')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto space-y-5 py-12 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10 animate-float">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {t('askPlaceholder')}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {t('zeroHallucinationNotice')}
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="w-full space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block mb-2">
                    {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட வினாக்கள்' : language === 'hi' ? 'सुझाए गए अध्ययन प्रश्न' : 'Suggested Study Prompts'}
                  </span>
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(prompt)}
                      className={`animate-fade-in-up stagger-${idx + 1} w-full text-left p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-200 cursor-pointer`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col animate-fade-in-up ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-emerald-600/15'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                        <div className="chat-markdown text-xs sm:text-sm">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line text-xs sm:text-sm">{msg.content}</p>
                      )}

                    {/* Citations Pill Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                          {t('citationsTitle')}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => openCitationDeepLink(cite)}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-mono font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition-colors cursor-pointer flex items-center gap-1"
                              title={cite.quote ? `"${cite.quote.slice(0, 80)}…"` : undefined}
                            >
                              <span>[{formatCiteLabel(cite)}]</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 mt-1.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}

            {isSendingChat && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-fit shadow-sm animate-fade-in">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-neutral-500">{t('thinking')}</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            <input
              type="text"
              placeholder={t('askPlaceholder')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isSendingChat}
              className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-600 rounded-xl focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={isSendingChat || !inputMessage.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-200 cursor-pointer shrink-0"
              title={t('send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: AI STUDIO & ARTIFACTS PANEL (Right) */}
        {/* ========================================================================= */}
        <div className={`${isStudioMaximized ? 'w-full flex-1' : 'w-full md:w-96 lg:w-[460px]'} bg-white dark:bg-neutral-900/80 flex flex-col shrink-0 ${mobileTab !== 'studio' && !isStudioMaximized ? 'hidden md:flex' : 'flex'} transition-all duration-300`}>
          {/* AI Studio Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">
                {t('studio')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportCenterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors duration-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('exportCenter')}</span>
              </button>

              <button
                onClick={() => setIsStudioMaximized(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isStudioMaximized
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
                title={isStudioMaximized ? 'Restore 3-column view' : 'Maximize studio canvas'}
              >
                {isStudioMaximized ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Restore</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Maximize</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 13 Artifact Types Scroller Bar */}
          <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/40 flex gap-1.5 overflow-x-auto">
            {studioTypesList.map((item) => {
              const Icon = item.icon;
              const isActive = activeStudioType === item.type;
              const label = t(item.labelKey) || item.defaultLabel;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    setActiveStudioType(item.type);
                    const matching = artifacts.find(a => a.type === item.type);
                    if (matching) {
                      setSelectedArtifactId(matching.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Generator Input Trigger Box */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>{t('generate')} <strong>{t(studioTypesList.find(s => s.type === activeStudioType)?.labelKey || '') || activeStudioType.replace(/_/g, ' ')}</strong></span>
              <span className="font-mono text-emerald-600">{selectedSourceIds.length} active</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`${t('generate')} ${t(studioTypesList.find(s => s.type === activeStudioType)?.labelKey || '')}...`}
                value={generationInstruction}
                onChange={(e) => setGenerationInstruction(e.target.value)}
                disabled={isGeneratingArtifact}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleGenerateArtifact()}
                disabled={isGeneratingArtifact || sources.length === 0}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                {isGeneratingArtifact ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingArtifact ? t('generating') : t('generate')}</span>
              </button>
            </div>
          </div>

          {/* Generated Artifacts Switcher (if multiple exist) */}
          {artifacts.length > 1 && (
            <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 flex gap-2 overflow-x-auto">
              {artifacts.map(art => (
                <button
                  key={art.id}
                  onClick={() => {
                    setSelectedArtifactId(art.id);
                    setActiveStudioType(art.type);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                    activeArtifact?.id === art.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <span>{art.title}</span>
                  <span
                    onClick={(e) => handleDeleteArtifact(art.id, e)}
                    className="p-0.5 hover:text-red-500 rounded"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Artifact Display Stage */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {isGeneratingArtifact ? (
              <div className="py-24 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Synthesizing {activeStudioType.replace(/_/g, ' ')}…
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Extracting relevant passage chunks and formatting grounded learning outputs.
                  </p>
                </div>
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : !activeArtifact ? (
              <div className="py-24 text-center space-y-4 px-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center text-neutral-400 animate-float">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Ready to Synthesize Knowledge
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    Choose an artifact format above and click <strong className="text-neutral-700 dark:text-neutral-300">Generate</strong> to transform your course sources.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Artifact Title and metadata */}
                <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                      {activeArtifact.title}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                      {activeArtifact.type.replace(/_/g, ' ').toUpperCase()} · {new Date(activeArtifact.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteArtifact(activeArtifact.id, e)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all shrink-0"
                    title="Delete artifact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Render the specialized viewer corresponding to the artifact type */}
                {activeArtifact.type === 'summary' && (
                  <SummaryView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'audio_overview' && (
                  <AudioOverviewView content={activeArtifact.content} onRegenerate={() => handleGenerateArtifact('audio_overview')} />
                )}
                {activeArtifact.type === 'slide_deck' && (
                  <SlideDeckView
                    content={activeArtifact.content}
                    onUpdate={(newContent) => handleUpdateArtifact(activeArtifact.id, newContent)}
                  />
                )}
                {activeArtifact.type === 'video_overview' && (
                  <VideoOverviewView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'mind_map' && (
                  <MindMapView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'report' && (
                  <ReportView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'flashcards' && (
                  <FlashcardsView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'quiz' && (
                  <QuizView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'infographic' && (
                  <InfographicView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'data_table' && (
                  <DataTableView
                    content={activeArtifact.content}
                    onUpdate={(newContent) => handleUpdateArtifact(activeArtifact.id, newContent)}
                  />
                )}
                {activeArtifact.type === 'study_guide' && (
                  <StudyGuideView
                    content={activeArtifact.content}
                    onUpdate={(newContent) => handleUpdateArtifact(activeArtifact.id, newContent)}
                  />
                )}
                {activeArtifact.type === 'questions' && (
                  <ImportantQuestionsView content={activeArtifact.content} />
                )}
                {activeArtifact.type === 'definitions' && (
                  <DefinitionsView content={activeArtifact.content} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AddSourceModal
        notebookId={notebookId}
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onSourceAdded={(newSrc) => {
          setSources(prev => [newSrc, ...prev]);
          setSelectedSourceIds(prev => [newSrc.id, ...prev]);
        }}
      />

      <SourceViewerModal
        source={viewerSource}
        initialChunkIndex={viewerChunkIndex}
        highlightText={viewerHighlight}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />

      <ExportCenterModal
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        artifacts={artifacts}
        sources={sources}
      />
    </div>
  );
};
