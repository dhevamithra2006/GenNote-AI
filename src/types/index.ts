export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  sourcesCount?: number;
  artifactsCount?: number;
}

export type SourceType =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'txt'
  | 'csv'
  | 'image'
  | 'audio'
  | 'video'
  | 'youtube'
  | 'website'
  | 'text';

export interface Source {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  type: SourceType;
  originalName: string;
  mimeType?: string;
  size?: number;
  pageCount?: number;
  slideCount?: number;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  extractedText: string;
  chunksCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  notebookId: string;
  chunkIndex: number;
  sectionTitle: string;
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  content: string;
}

export interface Citation {
  sourceId?: string;
  sourceTitle: string;
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  sectionTitle?: string;
  quote?: string;
}

export type Language = 'en' | 'ta' | 'hi';
export type AppMode = 'study' | 'research';

export interface ChatMessage {
  id: string;
  conversationId: string;
  notebookId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export type ArtifactType =
  | 'summary'
  | 'audio_overview'
  | 'slide_deck'
  | 'video_overview'
  | 'mind_map'
  | 'report'
  | 'flashcards'
  | 'quiz'
  | 'infographic'
  | 'data_table'
  | 'study_guide'
  | 'questions'
  | 'definitions';

export interface Artifact {
  id: string;
  notebookId: string;
  userId: string;
  type: ArtifactType;
  title: string;
  content: any;
  settings?: Record<string, any>;
  sourceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  type: string;
  title: string;
  excerpt: string;
  id: string;
  targetTab?: 'sources' | 'chat' | 'studio';
}
