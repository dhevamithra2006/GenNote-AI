import { db, SourceChunk } from './db.js';
import { getGemini } from './ai.js';

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate simple term frequency vector for instant keyword + semantic retrieval
function textToTFVector(text: string, vocabulary: string[]): number[] {
  const words = text.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
  const freqMap: Record<string, number> = {};
  words.forEach(w => { freqMap[w] = (freqMap[w] || 0) + 1; });
  return vocabulary.map(word => freqMap[word] || 0);
}

// Split text into coherent chunks with title, page, slide, timestamp, section
export function chunkText(
  fullText: string,
  sourceId: string,
  notebookId: string,
  maxChunkWords = 220
): SourceChunk[] {
  // Split on double newlines or explicit slide/page/timestamp markers
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: SourceChunk[] = [];
  let currentWords: string[] = [];
  let currentSection = 'General Overview';
  let currentPage: number | undefined = 1;
  let currentSlide: number | undefined = undefined;
  let currentTimestamp: string | undefined = undefined;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    // Detect page markers: [Page 1], Page 1, === Page 1 ===
    const pageMatch = para.match(/\[Page\s*(\d+)\]/i) || para.match(/^Page\s*(\d+)/i) || para.match(/===\s*Page\s*(\d+)\s*===/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
    }

    // Detect slide markers: [Slide 1], Slide 1, === Slide 1 ===
    const slideMatch = para.match(/\[Slide\s*(\d+)\]/i) || para.match(/^Slide\s*(\d+)/i) || para.match(/===\s*Slide\s*(\d+)\s*===/i);
    if (slideMatch) {
      currentSlide = parseInt(slideMatch[1], 10);
      if (!currentPage) currentPage = currentSlide;
    }

    // Detect timestamps: [00:15 - 00:45], [01:23], Timestamp: 02:45
    const timeMatch = para.match(/\[(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)\]/) || para.match(/Timestamp:\s*(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      currentTimestamp = timeMatch[1];
    }

    // Detect markdown headings or uppercase title sections
    const headerMatch = para.match(/^(?:#{1,4}\s+|UNIT\s+\d+|CHAPTER\s+\d+|SECTION\s+\d+|MODULE\s+\d+|Topic:\s*)([^\n]+)/i);
    if (headerMatch) {
      currentSection = headerMatch[1].replace(/^[#\s]+/, '').trim().substring(0, 70);
    }

    const words = para.split(/\s+/);
    if (currentWords.length + words.length > maxChunkWords && currentWords.length > 0) {
      chunks.push({
        id: `chunk-${sourceId}-${chunkIndex}`,
        sourceId,
        notebookId,
        chunkIndex,
        sectionTitle: currentSection,
        pageNumber: currentPage,
        slideNumber: currentSlide,
        timestamp: currentTimestamp,
        content: currentWords.join(' ')
      });
      chunkIndex++;
      // Keep small overlap of 25 words
      currentWords = currentWords.slice(-25);
    }
    currentWords.push(...words);
  }

  if (currentWords.length > 0) {
    chunks.push({
      id: `chunk-${sourceId}-${chunkIndex}`,
      sourceId,
      notebookId,
      chunkIndex,
      sectionTitle: currentSection,
      pageNumber: currentPage,
      slideNumber: currentSlide,
      timestamp: currentTimestamp,
      content: currentWords.join(' ')
    });
  }

  return chunks;
}

// Multilingual word extractor (supports English, Tamil, Hindi, numbers)
function extractWords(text: string): string[] {
  // Matches Latin, Devanagari (Hindi \u0900-\u097F), Tamil (\u0B80-\u0BFF), and numbers
  const matches = text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
  return matches;
}

// Embed query and retrieve most relevant chunks
export async function retrieveRelevantChunks(
  notebookId: string,
  query: string,
  selectedSourceIds?: string[],
  topK = 5
): Promise<Array<{
  title: string;
  sourceId: string;
  section?: string;
  page?: number;
  slide?: number;
  timestamp?: string;
  content: string;
  score: number;
}>> {
  const chunks = db.getChunks(notebookId, selectedSourceIds);
  if (chunks.length === 0) return [];

  const queryTerms = extractWords(query);
  const scoredChunks: Array<{
    title: string;
    sourceId: string;
    section?: string;
    page?: number;
    slide?: number;
    timestamp?: string;
    content: string;
    score: number;
  }> = [];

  for (const chunk of chunks) {
    const source = db.getSource(chunk.sourceId);
    const sourceTitle = source ? source.title : 'Notebook Document';
    const chunkLower = (chunk.content + ' ' + (chunk.sectionTitle || '') + ' ' + sourceTitle).toLowerCase();

    // Multilingual keyword overlap & section weighting
    let keywordScore = 0;
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) {
        // Boost terms in source titles, section titles or timestamps
        if ((chunk.sectionTitle || '').toLowerCase().includes(term) || sourceTitle.toLowerCase().includes(term)) {
          keywordScore += 4;
        } else {
          keywordScore += 1.5;
        }
      }
    }

    // Normalized score
    const score = keywordScore / (queryTerms.length || 1);
    scoredChunks.push({
      title: sourceTitle,
      sourceId: chunk.sourceId,
      section: chunk.sectionTitle,
      page: chunk.pageNumber,
      slide: chunk.slideNumber,
      timestamp: chunk.timestamp,
      content: chunk.content,
      score
    });
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Return highest matching chunks
  const relevantOnly = scoredChunks.filter(c => c.score > 0);
  if (relevantOnly.length > 0) {
    return relevantOnly.slice(0, topK);
  }

  // Fallback for general queries ("summarize", "what is this document about?", cross-lingual queries):
  // Return the first topK chunks from the sources so Gemini has the source text to ground its response
  return scoredChunks.slice(0, topK);
}
