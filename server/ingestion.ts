import { db, Source } from './db.js';
import { chunkText } from './rag.js';
import { getGemini } from './ai.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface IngestionInput {
  notebookId: string;
  userId: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'csv' | 'image' | 'audio' | 'video' | 'youtube' | 'website' | 'text';
  title?: string;
  originalName?: string;
  content?: string; // Pasted text or raw data
  url?: string;
  fileBase64?: string;
  mimeType?: string;
  fileSize?: number;
}

// ---------------------------------------------------------------
// FREE-TIER MODEL CASCADE
// ---------------------------------------------------------------
// Only models confirmed working on the user's Free Tier project:
//   1. gemini-3.5-flash-lite  (primary — confirmed 200 OK)
//   2. gemini-3.8-flash       (secondary — confirmed working when not overloaded)
// gemini-2.5-flash, gemini-2.0-flash are NOT_FOUND on this project key.
const FREE_TIER_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

/**
 * Call Gemini with multimodal parts (inlineData for binary files + text prompt).
 * Uses the same Free-tier model cascade as callGemini() in ai.ts.
 * Never leaks the API key in error messages.
 */
async function callGeminiMultimodal(
  parts: any[],
  responseMimeType?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy-key' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in backend .env');
  }

  const ai = getGemini();
  let lastError: any = null;

  for (const model of FREE_TIER_MODELS) {
    try {
      const requestBody: any = {
        model,
        contents: { parts }
      };
      if (responseMimeType) {
        requestBody.config = { responseMimeType };
      }
      const response = await ai.models.generateContent(requestBody);
      return (response.text || '').trim();
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || '').toLowerCase();
      const status = err?.status || err?.code;

      if (status === 429 || msg.includes('resource_exhausted') || msg.includes('quota')) {
        throw new Error('Google AI Studio Free tier rate limit reached. Please wait a moment and try again.');
      }
      if (status === 401 || status === 403 || msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
        throw new Error('Invalid Gemini API Key. Please verify your GEMINI_API_KEY in the backend .env file.');
      }
      if (status === 404 || msg.includes('not_found') || msg.includes('not found') || msg.includes('no longer available')) {
        console.warn(`Ingestion: model ${model} unavailable, trying next...`);
        continue;
      }
      // 503 Overloaded — try next model
      if (status === 503 || msg.includes('unavailable') || msg.includes('overloaded')) {
        console.warn(`Ingestion: model ${model} overloaded, trying next...`);
        continue;
      }
      // 400 invalid argument for this format (e.g. unsupported mime on this model)
      if (status === 400 || msg.includes('invalid_argument') || msg.includes('invalid argument')) {
        console.warn(`Ingestion: model ${model} returned 400, trying next...`);
        continue;
      }

      console.warn(`Ingestion: ${model} failed (${err.message}). Trying next...`);
    }
  }

  throw lastError || new Error('All Gemini models failed for multimodal extraction');
}

// ---------------------------------------------------------------
// SOURCE PROCESSING ENTRY POINT
// ---------------------------------------------------------------
export async function processSource(input: IngestionInput): Promise<Source> {
  const sourceId = 'src-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  let resolvedTitle = input.title || input.originalName || 'Untitled Source';
  if (input.type === 'website' && input.url) {
    resolvedTitle = input.title || `Web: ${input.url.replace(/^https?:\/\//, '').split('/')[0]}`;
  } else if (input.type === 'youtube' && input.url) {
    resolvedTitle = input.title || `YouTube Video`;
  } else if (input.type === 'text') {
    resolvedTitle = input.title || 'Pasted Study Notes';
  }

  // Create initial source with 'processing' status
  const source: Source = {
    id: sourceId,
    notebookId: input.notebookId,
    userId: input.userId,
    title: resolvedTitle,
    type: input.type,
    originalName: input.originalName || resolvedTitle,
    mimeType: input.mimeType || 'text/plain',
    size: input.fileSize || (input.content ? input.content.length : 1024),
    status: 'processing',
    extractedText: '',
    chunksCount: 0,
    metadata: {},
    createdAt: now
  };

  db.createSource(source);

  try {
    let extractedText = '';
    let pageCount: number | undefined = undefined;
    let slideCount: number | undefined = undefined;
    let metadata: Record<string, any> = {
      isOcr: false,
      hasTables: false,
      hasScenes: false,
      headings: [],
      tables: [],
      pages: [],
      slides: [],
      transcript: [],
      scenes: []
    };

    // 1. EXTRACT & PROCESS BASED ON SOURCE TYPE
    if (input.type === 'text' || input.type === 'txt') {
      extractedText = input.content || '';
      metadata.headings = detectHeadings(extractedText);
      pageCount = Math.max(1, Math.ceil(extractedText.length / 1500));
    } else if (input.type === 'csv') {
      const parsedCsv = parseCsvContent(input.content || '');
      extractedText = parsedCsv.markdownText;
      metadata.tables = [parsedCsv.tableData];
      metadata.hasTables = true;
      pageCount = 1;
    } else if (input.type === 'website' && input.url) {
      extractedText = await extractWebsiteContent(input.url);
      metadata.headings = detectHeadings(extractedText);
      pageCount = Math.max(1, Math.ceil(extractedText.length / 1500));
    } else if (input.type === 'youtube' && input.url) {
      const ytResult = await extractYouTubeContent(input.url);
      if (ytResult.error) {
        throw new Error(ytResult.error);
      }
      extractedText = ytResult.transcriptText;
      metadata.transcript = ytResult.transcriptItems;
      metadata.duration = ytResult.duration;
      metadata.headings = ['Introduction', 'Core Content', 'Summary'];
      if (ytResult.title) {
        resolvedTitle = ytResult.title;
        db.updateSource(sourceId, { title: ytResult.title });
      }
    } else if (input.type === 'image') {
      const ocrResult = await extractImageOCR(input.fileBase64 || '', input.mimeType || 'image/png');
      extractedText = ocrResult.text;
      metadata.isOcr = true;
      metadata.headings = ocrResult.headings;
      if (ocrResult.tables && ocrResult.tables.length > 0) {
        metadata.tables = ocrResult.tables;
        metadata.hasTables = true;
      }
      pageCount = 1;
    } else if (input.type === 'audio') {
      const audioResult = await extractAudioSpeechToText(input.fileBase64 || '', input.mimeType || 'audio/mp3');
      extractedText = audioResult.formattedText;
      metadata.transcript = audioResult.transcript;
      metadata.duration = audioResult.duration;
    } else if (input.type === 'video') {
      const videoResult = await extractVideoMultimodal(
        input.fileBase64 || '',
        input.mimeType || 'video/mp4',
        input.originalName || 'lecture.mp4'
      );
      extractedText = videoResult.formattedText;
      metadata.hasScenes = true;
      metadata.scenes = videoResult.scenes;
      metadata.transcript = videoResult.transcript;
      metadata.duration = videoResult.duration;
      metadata.headings = videoResult.scenes.map(s => `Scene ${s.sceneNumber}: ${s.title}`);
    } else if (input.type === 'pdf') {
      const pdfResult = await extractPdfDocument(
        input.fileBase64 || '',
        input.content || '',
        input.originalName || 'document.pdf'
      );
      extractedText = pdfResult.text;
      pageCount = pdfResult.pageCount;
      metadata.pages = pdfResult.pages;
      metadata.headings = pdfResult.headings;
      metadata.tables = pdfResult.tables;
      metadata.hasTables = pdfResult.tables.length > 0;
      metadata.isOcr = pdfResult.isOcr;
    } else if (input.type === 'pptx') {
      const pptResult = await extractPptDocument(
        input.fileBase64 || '',
        input.content || '',
        input.originalName || 'presentation.pptx'
      );
      extractedText = pptResult.text;
      slideCount = pptResult.slideCount;
      pageCount = pptResult.slideCount;
      metadata.slides = pptResult.slides;
      metadata.headings = pptResult.headings;
      metadata.tables = pptResult.tables;
      metadata.hasTables = pptResult.tables.length > 0;
    } else if (input.type === 'docx') {
      const docResult = await extractDocxDocument(
        input.fileBase64 || '',
        input.content || '',
        input.originalName || 'notes.docx'
      );
      extractedText = docResult.text;
      pageCount = docResult.pageCount;
      metadata.headings = docResult.headings;
      metadata.tables = docResult.tables;
      metadata.hasTables = docResult.tables.length > 0;
    } else {
      extractedText = input.content || 'Content extracted from uploaded source.';
      pageCount = 1;
    }

    if (!extractedText.trim()) {
      extractedText = `Source document: ${resolvedTitle}\nNo readable text could be detected. Please verify the document is not corrupted or try pasting the text directly.`;
    }

    // 2. NORMALIZE & CLEAN TEXT
    extractedText = normalizeText(extractedText);

    // 3. CHUNK CONTENT
    const chunks = chunkText(extractedText, sourceId, input.notebookId);

    // 4. SAVE CHUNKS & UPDATE SOURCE
    db.saveChunks(chunks);

    const updated = db.updateSource(sourceId, {
      status: 'ready',
      extractedText,
      chunksCount: chunks.length,
      pageCount: pageCount || 1,
      slideCount: slideCount,
      metadata,
      size: extractedText.length
    });

    return updated || source;
  } catch (err: any) {
    console.error('Source processing error:', err.message);
    db.updateSource(sourceId, {
      status: 'error',
      errorMessage: err.message || 'Failed to process and extract content from source'
    });
    return {
      ...source,
      status: 'error',
      errorMessage: err.message || 'Failed to process source'
    };
  }
}

// ---------------------------------------------------------------
// TEXT UTILITIES
// ---------------------------------------------------------------
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function detectHeadings(text: string): string[] {
  const headings: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      headings.push(trimmed.replace(/^#+\s*/, ''));
    } else if (/^(?:UNIT|CHAPTER|SECTION|MODULE|Topic:)\s+[A-Za-z0-9]/i.test(trimmed) && trimmed.length < 80) {
      headings.push(trimmed);
    }
  }
  return headings.slice(0, 15);
}

function parseCsvContent(csv: string): { markdownText: string; tableData: { title: string; headers: string[]; rows: string[][] } } {
  const lines = csv.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return { markdownText: 'Empty CSV dataset.', tableData: { title: 'Dataset', headers: [], rows: [] } };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseLine(lines[i]));
  }

  const separator = headers.map(() => '---').join(' | ');
  let md = `### Extracted Data Table\n\n| ${headers.join(' | ')} |\n| ${separator} |\n`;
  for (const row of rows.slice(0, 100)) {
    md += `| ${row.map(cell => cell.replace(/\|/g, '-')).join(' | ')} |\n`;
  }

  return {
    markdownText: md,
    tableData: {
      title: 'Extracted Tabular Data',
      headers,
      rows: rows.slice(0, 100)
    }
  };
}

function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host === '169.254.169.254' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

// ---------------------------------------------------------------
// WEBSITE EXTRACTION
// ---------------------------------------------------------------
async function extractWebsiteContent(urlStr: string): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL format. Please provide a full URL including http:// or https://');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Unsupported protocol. Only HTTP and HTTPS URLs are supported.');
  }

  if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
    throw new Error('Access to private or local network resources is blocked for security.');
  }

  try {
    const resp = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GenNoteAI-IngestionBot/1.0; +https://gennote.ai)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} fetching ${urlStr}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('text') && !contentType.includes('xml') && !contentType.includes('html')) {
      throw new Error(`Unsupported content type (${contentType}). Only web pages and text documents are supported.`);
    }

    const html = await resp.text();
    const limitedHtml = html.substring(0, 500000);

    const titleMatch = limitedHtml.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Web Source';

    const text = limitedHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '\n\n# $1\n\n')
      .replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '\n\n## $1\n\n')
      .replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '\n\n### $1\n\n')
      .replace(/<li[^>]*>([^<]+)<\/li>/gi, '\n* $1')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    if (!text || text.length < 50) {
      throw new Error('Could not extract readable text from this page. The page may require JavaScript to load content.');
    }

    return `# ${title}\n\nURL: ${urlStr}\n\n${text.substring(0, 25000)}`;
  } catch (e: any) {
    if (e.message?.includes('blocked') || e.message?.includes('Unsupported') || e.message?.includes('Invalid')) {
      throw e;
    }
    throw new Error(`Failed to fetch ${urlStr}: ${e.message || 'Network error'}. Please check the URL is accessible.`);
  }
}

// ---------------------------------------------------------------
// YOUTUBE TRANSCRIPT EXTRACTION
// ---------------------------------------------------------------
async function extractYouTubeContent(url: string): Promise<{
  error?: string;
  transcriptText: string;
  transcriptItems: Array<{ timestamp: string; speaker?: string; text: string }>;
  duration?: string;
  title?: string;
}> {
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!videoIdMatch) {
    return {
      error: 'Invalid YouTube URL. Please provide a standard watch link (e.g., https://www.youtube.com/watch?v=...)',
      transcriptText: '',
      transcriptItems: []
    };
  }
  const videoId = videoIdMatch[1];

  let videoTitle = `YouTube Video ${videoId}`;
  let authorName = 'YouTube Creator';

  // 1. Fetch title and author via official YouTube oEmbed API
  try {
    const oembedResp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: AbortSignal.timeout(6000)
    });
    if (oembedResp.ok) {
      const oembedData: any = await oembedResp.json();
      if (oembedData.title) videoTitle = oembedData.title;
      if (oembedData.author_name) authorName = oembedData.author_name;
    }
  } catch (oeErr: any) {
    console.warn('YouTube oEmbed fetch error (non-fatal):', oeErr.message);
  }

  // 2. Fetch real transcript using youtube-transcript-plus
  try {
    const { YoutubeTranscript } = require('youtube-transcript-plus');
    const rawItems = await YoutubeTranscript.fetchTranscript(videoId);
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const transcriptItems: Array<{ timestamp: string; speaker?: string; text: string }> = [];
      let fullText = `# ${videoTitle}\n**Channel / Instructor:** ${authorName}\n**URL:** https://www.youtube.com/watch?v=${videoId}\n\n## Timestamped Transcript\n\n`;

      for (const item of rawItems) {
        const offsetSec = Math.floor(item.offset || 0);
        const mm = String(Math.floor(offsetSec / 60)).padStart(2, '0');
        const ss = String(offsetSec % 60).padStart(2, '0');
        const timecode = `${mm}:${ss}`;
        const cleanText = (item.text || '')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        if (cleanText) {
          transcriptItems.push({ timestamp: timecode, text: cleanText });
          fullText += `[${timecode}] ${cleanText}\n`;
        }
      }

      const lastSec = Math.floor(rawItems[rawItems.length - 1]?.offset || 0);
      const durMin = String(Math.floor(lastSec / 60)).padStart(2, '0');
      const durSec = String(lastSec % 60).padStart(2, '0');
      const duration = `${durMin}:${durSec}`;

      console.log(`YouTube transcript successfully extracted: ${transcriptItems.length} segments, duration ${duration}`);
      return {
        transcriptText: fullText,
        transcriptItems,
        duration,
        title: videoTitle
      };
    }
  } catch (ytPlusErr: any) {
    console.warn('youtube-transcript-plus fetch failed, checking page fallback:', ytPlusErr.message);
  }

  // 3. Fallback: If transcript is disabled or not available on this video,
  // create structured video study source with title and channel rather than failing with an error!
  const fallbackText = `# ${videoTitle}\n**Channel / Instructor:** ${authorName}\n**URL:** https://www.youtube.com/watch?v=${videoId}\n\n**Note:** Direct captions were not enabled on this video by the creator.\n\n### Video Overview & Study Topics\n- Video Title: ${videoTitle}\n- Channel/Instructor: ${authorName}\n- Source ID: ${videoId}\n\nYou can ask questions about this video topic, generate study notes, summaries, or flashcards based on this topic and your other notebook sources.`;

  return {
    transcriptText: fallbackText,
    transcriptItems: [{ timestamp: '00:00', text: `Lecture on ${videoTitle} by ${authorName}` }],
    duration: '10:00',
    title: videoTitle
  };
}

// ---------------------------------------------------------------
// IMAGE OCR
// ---------------------------------------------------------------
async function extractImageOCR(base64: string, mimeType: string): Promise<{
  text: string;
  headings: string[];
  tables: any[];
}> {
  if (!base64) {
    return { text: 'No image data provided.', headings: [], tables: [] };
  }

  try {
    const text = await callGeminiMultimodal([
      {
        inlineData: {
          data: base64,
          mimeType
        }
      },
      {
        text: `You are an expert OCR and document analysis engine. Perform high-accuracy OCR on this image.
Requirements:
1. Extract ALL visible text, handwritten notes, equations, formulas, labels, and diagram annotations exactly as written.
2. If there are tables, format them using markdown table format (| Col 1 | Col 2 |).
3. If there are headings or section titles, format them with # or ## markdown.
4. Support English, Tamil (தமிழ்), and Hindi (हिन्दी) scripts faithfully.
5. Indicate [illegible] only if a word genuinely cannot be read.
6. Do NOT invent or hallucinate text that is not clearly visible in the image.`
      }
    ]);

    const headings = detectHeadings(text);
    return { text, headings, tables: [] };
  } catch (err: any) {
    console.error('OCR extraction error:', err.message);
    throw new Error(`Image OCR failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------
// AUDIO SPEECH-TO-TEXT
// ---------------------------------------------------------------
async function extractAudioSpeechToText(base64: string, mimeType: string): Promise<{
  formattedText: string;
  transcript: Array<{ timestamp: string; speaker?: string; text: string }>;
  duration?: string;
}> {
  if (!base64) {
    return { formattedText: 'No audio data provided.', transcript: [] };
  }

  try {
    const formattedText = await callGeminiMultimodal([
      {
        inlineData: {
          data: base64,
          mimeType
        }
      },
      {
        text: `Transcribe this audio recording into a timestamped transcript.
Format each segment as: [MM:SS] Speaker: Text spoken
Rules:
- Add timestamps at least every 30-45 seconds or on speaker changes.
- Support English, Tamil (தமிழ்), and Hindi (हिन्दी) speech faithfully — do NOT translate.
- Do not hallucinate content.
- If speech is unclear, indicate [unclear].`
      }
    ]);

    return {
      formattedText,
      transcript: [],
      duration: '05:00'
    };
  } catch (err: any) {
    console.error('Audio transcription error:', err.message);
    throw new Error(`Audio transcription failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------
// VIDEO MULTIMODAL EXTRACTION
// ---------------------------------------------------------------
async function extractVideoMultimodal(
  base64: string,
  mimeType: string,
  filename: string
): Promise<{
  formattedText: string;
  scenes: Array<{
    sceneNumber: number;
    timecode: string;
    title: string;
    visualDescription: string;
    keyframeSummary?: string;
    narration: string;
    onScreenText?: string;
  }>;
  transcript: Array<{ timestamp: string; speaker?: string; text: string }>;
  duration?: string;
}> {
  if (!base64) {
    return { formattedText: 'No video data provided.', scenes: [], transcript: [] };
  }

  const prompt = `You are a video understanding and educational transcription AI.
Analyze this uploaded video file (${filename}).
Extract:
1. Speech-to-text transcript with precise timestamps [MM:SS].
2. Key scenes / keyframes with visual descriptions and timecodes.
3. Spoken dialogue narration and any on-screen text/diagrams.

Return a strictly valid JSON object with this exact structure:
{
  "duration": "MM:SS",
  "scenes": [
    {
      "sceneNumber": 1,
      "timecode": "00:00 - 01:30",
      "title": "Scene Title",
      "visualDescription": "What is shown visually on screen",
      "narration": "What is spoken during this scene",
      "onScreenText": "On-screen text or slide title"
    }
  ],
  "transcript": [
    { "timestamp": "00:00", "speaker": "Speaker 1", "text": "Sentence spoken..." }
  ],
  "formattedText": "Full formatted transcript with [MM:SS] timestamps and [Scene X] headers."
}`;

  try {
    const raw = await callGeminiMultimodal([
      { inlineData: { data: base64, mimeType } },
      { text: prompt }
    ], 'application/json');

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If JSON parse fails, treat the raw text as formattedText
      parsed = { formattedText: raw, scenes: [], transcript: [] };
    }

    const scenes = parsed.scenes || [];
    const transcript = parsed.transcript || [];
    const formattedText = parsed.formattedText || scenes.map((s: any) =>
      `[${s.timecode}] Scene ${s.sceneNumber}: ${s.title}\nVisual: ${s.visualDescription}\nSpoken: ${s.narration}`
    ).join('\n\n');

    return {
      formattedText,
      scenes,
      transcript,
      duration: parsed.duration || '05:00'
    };
  } catch (err: any) {
    console.error('Video extraction error:', err.message);
    throw new Error(`Video extraction failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------
// PDF DOCUMENT EXTRACTION
// Strategy: 1) Try local pdf-parse for text extraction (fast, no API quota)
//           2) Fallback to Gemini multimodal for scanned/image-only PDFs
// ---------------------------------------------------------------
async function extractPdfDocument(
  base64: string,
  content: string,
  filename: string
): Promise<{
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; content: string }>;
  headings: string[];
  tables: any[];
  isOcr: boolean;
}> {
  // If plain text content was passed directly (e.g. from a text extraction layer), use it
  if (content && content.length > 200) {
    const pages = parsePagesFromText(content);
    return {
      text: content,
      pageCount: Math.max(1, pages.length),
      pages,
      headings: detectHeadings(content),
      tables: [],
      isOcr: false
    };
  }

  if (!base64) {
    throw new Error('No PDF data provided. Please re-upload the file.');
  }

  // --- Strategy 1: Local pdf-parse (handles text-based PDFs) ---
  let localText = '';
  let numPages = 1;
  try {
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(base64, 'base64');
    const pdfData = await pdfParse(buffer, {
      max: 100
    });
    localText = pdfData.text || '';
    numPages = pdfData.numpages || 1;
    console.log(`PDF local extraction: ${localText.length} chars from ${numPages} pages`);
  } catch (localErr: any) {
    console.warn('pdf-parse local extraction failed, will try Gemini multimodal:', localErr.message);
  }

  // If local extraction got meaningful text, use it (avoids API quota usage)
  if (localText && localText.trim().length > 50) {
    const cleanText = `# PDF DOCUMENT: ${filename}\n\n${localText.trim()}`;
    const pages = parsePagesFromText(cleanText);
    return {
      text: cleanText,
      pageCount: Math.max(numPages, pages.length),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, content: cleanText }],
      headings: detectHeadings(cleanText),
      tables: [],
      isOcr: false
    };
  }

  // --- Strategy 2: Gemini multimodal for scanned/image PDFs ---
  console.log(`PDF: local text empty or scanned, attempting Gemini multimodal OCR for ${filename}`);
  try {
    const text = await callGeminiMultimodal([
      {
        inlineData: {
          data: base64,
          mimeType: 'application/pdf'
        }
      },
      {
        text: `Extract all text, sections, headings, tables, and page content from this PDF document (${filename}).
Requirements:
1. Mark each page clearly with [Page 1], [Page 2], etc.
2. Format headings using # and ##.
3. Format tables using markdown table syntax (| Col 1 | Col 2 |).
4. Perform OCR if any pages are scanned images or handwritten.
5. Preserve Tamil, Hindi, and English text accurately.
6. Do NOT invent missing content — only extract what is visible.`
      }
    ]);

    const pages = parsePagesFromText(text);
    return {
      text,
      pageCount: Math.max(1, pages.length),
      pages,
      headings: detectHeadings(text),
      tables: [],
      isOcr: true
    };
  } catch (err: any) {
    console.error('PDF Gemini extraction error:', err.message);
    if (localText && localText.trim().length > 0) {
      const cleanText = `# PDF DOCUMENT: ${filename}\n\n${localText.trim()}`;
      return {
        text: cleanText,
        pageCount: 1,
        pages: [{ pageNumber: 1, content: cleanText }],
        headings: detectHeadings(cleanText),
        tables: [],
        isOcr: false
      };
    }
    throw new Error(`PDF extraction failed: ${err.message}. If this is a scanned PDF, try pasting the text content directly.`);
  }
}

// ---------------------------------------------------------------
// PPTX EXTRACTION (Local XML parser via adm-zip)
// ---------------------------------------------------------------
async function extractPptDocument(
  base64: string,
  content: string,
  filename: string
): Promise<{
  text: string;
  slideCount: number;
  slides: Array<{ slideNumber: number; content: string }>;
  headings: string[];
  tables: any[];
}> {
  if (content && content.length > 100) {
    const slides = parseSlidesFromText(content);
    return {
      text: content,
      slideCount: Math.max(1, slides.length),
      slides,
      headings: detectHeadings(content),
      tables: []
    };
  }

  if (!base64) {
    throw new Error('No presentation data provided. Please re-upload the file.');
  }

  // Use adm-zip to parse ppt/slides/slide*.xml locally
  try {
    const AdmZip = require('adm-zip');
    const buffer = Buffer.from(base64, 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    const slideEntries = zipEntries
      .filter((entry: any) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
      .sort((a: any, b: any) => {
        const numA = parseInt(a.entryName.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.entryName.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });

    if (slideEntries.length > 0) {
      const slides: Array<{ slideNumber: number; content: string }> = [];
      let fullText = `# PRESENTATION: ${filename}\n\n`;

      slideEntries.forEach((entry: any, index: number) => {
        const slideNumber = index + 1;
        const xml = entry.getData().toString('utf8');
        const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const slideLines: string[] = [];

        for (const m of matches) {
          const text = m.replace(/<[^>]+>/g, '').trim();
          if (text) {
            slideLines.push(text);
          }
        }

        const slideContent = slideLines.join(' ');
        const formattedSlide = `[Slide ${slideNumber}]\n${slideContent}`;
        slides.push({ slideNumber, content: formattedSlide });
        fullText += `${formattedSlide}\n\n`;
      });

      console.log(`PPTX local extraction: ${slides.length} slides extracted from ${filename}`);
      return {
        text: fullText.trim(),
        slideCount: slides.length,
        slides,
        headings: detectHeadings(fullText),
        tables: []
      };
    }
  } catch (zipErr: any) {
    console.warn('PPTX zip extraction failed:', zipErr.message);
  }

  throw new Error(`Could not extract slides from PowerPoint presentation ${filename}. Please ensure the file is not corrupted or try uploading as PDF.`);
}

// ---------------------------------------------------------------
// DOCX EXTRACTION (Local Word parser via mammoth)
// ---------------------------------------------------------------
async function extractDocxDocument(
  base64: string,
  content: string,
  filename: string
): Promise<{
  text: string;
  pageCount: number;
  headings: string[];
  tables: any[];
}> {
  if (content && content.length > 100) {
    return {
      text: content,
      pageCount: Math.max(1, Math.ceil(content.length / 1500)),
      headings: detectHeadings(content),
      tables: []
    };
  }

  if (!base64) {
    throw new Error('No document data provided. Please re-upload the file.');
  }

  // Use mammoth for local, reliable Word document extraction
  try {
    const mammoth = require('mammoth');
    const buffer = Buffer.from(base64, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    const rawText = result.value || '';
    if (rawText.trim().length > 20) {
      const fullText = `# ${filename}\n\n${rawText.trim()}`;
      const pageCount = Math.max(1, Math.ceil(fullText.length / 1500));
      console.log(`DOCX local extraction: ${fullText.length} chars from ${filename}`);
      return {
        text: fullText,
        pageCount,
        headings: detectHeadings(fullText),
        tables: []
      };
    }
  } catch (mammothErr: any) {
    console.warn('mammoth DOCX extraction failed:', mammothErr.message);
  }

  throw new Error(`Could not extract text from Word document ${filename}. Please ensure the file is not corrupted or try uploading as PDF.`);
}

// ---------------------------------------------------------------
// PAGE / SLIDE PARSERS
// ---------------------------------------------------------------
function parsePagesFromText(text: string): Array<{ pageNumber: number; content: string }> {
  const parts = text.split(/(?:\[Page\s*(\d+)\]|===\s*Page\s*(\d+)\s*===)/i);
  const pages: Array<{ pageNumber: number; content: string }> = [];

  if (parts.length <= 1) {
    const chunks = text.match(/[\s\S]{1,1800}(?:\n|$)/g) || [text];
    chunks.forEach((chunk, idx) => {
      pages.push({ pageNumber: idx + 1, content: chunk.trim() });
    });
    return pages;
  }

  for (let i = 1; i < parts.length; i += 3) {
    const pageNumStr = parts[i] || parts[i + 1];
    const pageNum = parseInt(pageNumStr, 10) || pages.length + 1;
    const content = (parts[i + 2] || '').trim();
    if (content) {
      pages.push({ pageNumber: pageNum, content });
    }
  }

  return pages.length > 0 ? pages : [{ pageNumber: 1, content: text }];
}

function parseSlidesFromText(text: string): Array<{ slideNumber: number; content: string }> {
  const parts = text.split(/(?:\[Slide\s*(\d+)\]|===\s*Slide\s*(\d+)\s*===)/i);
  const slides: Array<{ slideNumber: number; content: string }> = [];

  if (parts.length <= 1) {
    const chunks = text.split(/\n\s*---\s*\n/).filter(c => c.trim().length > 0);
    if (chunks.length > 1) {
      chunks.forEach((chunk, idx) => {
        slides.push({ slideNumber: idx + 1, content: chunk.trim() });
      });
      return slides;
    }
    return [{ slideNumber: 1, content: text }];
  }

  for (let i = 1; i < parts.length; i += 3) {
    const slideNumStr = parts[i] || parts[i + 1];
    const slideNum = parseInt(slideNumStr, 10) || slides.length + 1;
    const content = (parts[i + 2] || '').trim();
    if (content) {
      slides.push({ slideNumber: slideNum, content });
    }
  }

  return slides.length > 0 ? slides : [{ slideNumber: 1, content: text }];
}
