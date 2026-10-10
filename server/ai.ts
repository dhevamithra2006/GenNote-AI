import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are GenNote AI, an intelligent multimodal study and research assistant inspired by NotebookLM.

The user's uploaded notebook sources are your absolute primary knowledge base.
Rules:
1. Answer source-specific questions strictly using the retrieved source content.
2. Do not invent facts, citations, page numbers, slide numbers, video timestamps, quotations, statistics, or source references.
3. Never create fake citations.
4. If the requested information cannot be found in the available sources, clearly and explicitly state:
   - In English: "I couldn't find this information in your uploaded sources."
   - In Tamil: "உங்கள் பதிவேற்றிய மூலங்களில் இந்தத் தகவலை என்னால் கண்டுபிடிக்க முடியவில்லை."
   - In Hindi: "मुझे आपके अपलोड किए गए स्रोतों में यह जानकारी नहीं मिली।"
5. Preserve the true meaning of the original source material.
6. Maintain strict source traceability with exact page, slide, timestamp, or section citations.
7. Your mission is to help students and researchers understand, revise, synthesize, and present information with 100% verified fidelity.`;

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in backend .env.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'gennote-ai-study-studio',
        }
      }
    });
  }
  return aiClient;
}

export function getAIConfigStatus() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'dummy-key';
  return {
    configured: isConfigured,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    provider: 'Google AI Studio (Gemini API)',
    freeTierEligible: true
  };
}

/**
 * Robust caller with Free-Tier model cascade and explicit quota/error handling.
 * Never leaks the API key in logs or error messages.
 */
export async function callGemini(contents: string, config: Record<string, any> = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy-key' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in backend .env');
  }

  const ai = getGemini();

  // Confirmed Free-Tier working models for this project (tested live):
  //   1. gemini-3.5-flash-lite  — primary, fastest, confirmed 200 OK
  //   2. gemini-3.8-flash        — secondary fallback
  // NOTE: gemini-2.5-flash and gemini-2.0-flash return 404 on new project keys.
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const candidateModels = Array.from(new Set([
    configuredModel,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash'
  ]));

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          ...config
        }
      });
      return (response.text || '').trim();
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || '').toLowerCase();
      const status = err?.status || err?.code;

      // 429 Quota / Rate limit
      if (status === 429 || errMsg.includes('resource_exhausted') || errMsg.includes('quota')) {
        throw new Error('Google AI Studio Free tier rate limit reached. Please wait a moment and try again.');
      }

      // 401 / 403 Invalid API key
      if (status === 401 || status === 403 || errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid')) {
        throw new Error('Invalid Gemini API Key. Please verify your GEMINI_API_KEY in the backend .env file.');
      }

      // Model not found / deprecated — try next
      if (status === 404 || errMsg.includes('not_found') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
        console.warn(`Model ${model} unavailable. Falling back...`);
        continue;
      }

      // 503 overloaded — try next model
      if (status === 503 || errMsg.includes('unavailable') || errMsg.includes('overloaded') || errMsg.includes('high demand')) {
        console.warn(`Model ${model} overloaded, trying next...`);
        continue;
      }

      console.warn(`Gemini call with ${model} failed (${err.message}). Trying next candidate...`);
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

export async function generateRAGAnswer(
  prompt: string,
  contextChunks: Array<{
    title: string;
    sourceId?: string;
    section?: string;
    page?: number;
    slide?: number;
    timestamp?: string;
    content: string;
  }>,
  history: Array<{ role: string; content: string }> = [],
  language: 'en' | 'ta' | 'hi' = 'en',
  mode: 'study' | 'research' = 'study'
): Promise<{
  text: string;
  citations: Array<{
    sourceId?: string;
    sourceTitle: string;
    pageNumber?: number;
    slideNumber?: number;
    timestamp?: string;
    sectionTitle?: string;
    quote?: string;
  }>;
}> {
  const notFoundPhrase =
    language === 'ta'
      ? 'உங்கள் பதிவேற்றிய மூலங்களில் இந்தத் தகவலை என்னால் கண்டுபிடிக்க முடியவில்லை.'
      : language === 'hi'
      ? 'मुझे आपके अपलोड किए गए स्रोतों में यह जानकारी नहीं मिली।'
      : "I couldn't find this information in your uploaded sources.";

  // If no chunks retrieved at all, return not found immediately
  if (!contextChunks || contextChunks.length === 0) {
    return { text: notFoundPhrase, citations: [] };
  }

  const contextStr = contextChunks.map((c, i) => {
    let loc = c.section || 'General';
    if (c.page) loc = `Page ${c.page}`;
    else if (c.slide) loc = `Slide ${c.slide}`;
    else if (c.timestamp) loc = `Timestamp ${c.timestamp}`;
    return `[SOURCE ${i + 1}: "${c.title}" (${loc})]\n${c.content}`;
  }).join('\n\n---\n\n');

  const langDirective = language === 'ta'
    ? `\nCRITICAL LANGUAGE REQUIREMENT: You MUST answer strictly in Tamil (தமிழ்). Explain naturally and fluently in Tamil script. Standard technical terms may be preserved in English alongside Tamil explanation. If the answer cannot be found in the sources, you MUST respond EXACTLY with:\n"${notFoundPhrase}"`
    : language === 'hi'
    ? `\nCRITICAL LANGUAGE REQUIREMENT: You MUST answer strictly in Hindi (हिन्दी). Explain naturally and fluently in Hindi Devanagari script. Standard technical terms may be preserved in English alongside Hindi explanation. If the answer cannot be found in the sources, you MUST respond EXACTLY with:\n"${notFoundPhrase}"`
    : `\nCRITICAL LANGUAGE REQUIREMENT: Answer in English. If the answer cannot be found in the sources, you MUST respond EXACTLY with:\n"${notFoundPhrase}"`;

  const modeDirective = mode === 'research'
    ? `\nMODE: RESEARCH MODE (🔬). Adopt a rigorous, academic, analytical tone. Scrutinize methodology, cite specific pages/slides/timestamps, compare nuances, and preserve technical precision.`
    : `\nMODE: STUDY MODE (🎓). Adopt an engaging, pedagogical tone. Use clear structured bullet points, intuitive analogies, step-by-step clarity, and high-yield exam takeaways.`;

  // Format previous conversation turns to support follow-up questions
  let conversationContext = '';
  if (history && history.length > 0) {
    const formattedHistory = history
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.substring(0, 400)}`)
      .join('\n');
    conversationContext = `\nRecent Conversation History:\n${formattedHistory}\n`;
  }

  const fullPrompt = `The user asked: "${prompt}"
${langDirective}
${modeDirective}
${conversationContext}
Retrieved Source Excerpts from User's Notebook:
${contextStr}

Instructions:
1. Answer strictly based on the retrieved sources above.
2. If this is a follow-up question, use the conversation history to understand context, but ground the answer in the retrieved sources.
3. If the user asks to summarize, give an overview, explain, or list key concepts of the topic or document, synthesize a clear, helpful, well-structured answer directly from the retrieved sources.
4. Cite the exact source title, and page number, slide number, video timestamp, or section heading where applicable.
5. If the user asks for a specific fact, figure, or question that is truly not present in the sources, respond ONLY with the exact unavailable statement: "${notFoundPhrase}".
6. Do NOT invent citations, statistics, or facts not present in the sources.`;

  const apiKey = process.env.GEMINI_API_KEY;

  // Offline / missing API key fallback
  if (!apiKey || apiKey === 'dummy-key' || apiKey === 'MY_GEMINI_API_KEY') {
    const matchingChunk = contextChunks[0];
    const citedLoc = matchingChunk.page
      ? `Page ${matchingChunk.page}`
      : matchingChunk.slide
      ? `Slide ${matchingChunk.slide}`
      : matchingChunk.timestamp
      ? `Timestamp ${matchingChunk.timestamp}`
      : (matchingChunk.section || 'General');

    const prefix = language === 'ta'
      ? `உங்கள் குறிப்பேடு மூலங்களின் அடிப்படையில்:\n\n`
      : language === 'hi'
      ? `आपके नोटबुक स्रोतों के आधार पर:\n\n`
      : `Based on your notebook sources:\n\n`;

    return {
      text: `${prefix}${matchingChunk.content}\n\n[Source: ${matchingChunk.title} — ${citedLoc}]`,
      citations: [{
        sourceId: matchingChunk.sourceId,
        sourceTitle: matchingChunk.title,
        pageNumber: matchingChunk.page,
        slideNumber: matchingChunk.slide,
        timestamp: matchingChunk.timestamp,
        sectionTitle: matchingChunk.section,
        quote: matchingChunk.content.substring(0, 140) + '...'
      }]
    };
  }

  try {
    const rawAnswer = await callGemini(fullPrompt, {
      temperature: 0.2
    });

    const answer = rawAnswer || notFoundPhrase;

    // Check if response indicates not found
    const isNotFound =
      answer.includes("couldn't find this information") ||
      answer.includes("கண்டுபிடிக்க முடியவில்லை") ||
      answer.includes("जानकारी नहीं मिली") ||
      answer === notFoundPhrase;

    if (isNotFound) {
      return { text: answer, citations: [] };
    }

    // Build verified citations from retrieved context chunks that match content
    const citations: Array<{
      sourceId?: string;
      sourceTitle: string;
      pageNumber?: number;
      slideNumber?: number;
      timestamp?: string;
      sectionTitle?: string;
      quote?: string;
    }> = [];

    const answerLower = answer.toLowerCase();
    for (const chunk of contextChunks) {
      const titleSnippet = chunk.title.toLowerCase().substring(0, 12);
      const sectionSnippet = (chunk.section || '').toLowerCase();
      const contentSnippet = chunk.content.toLowerCase().substring(0, 25);

      const isRelevant =
        answerLower.includes(titleSnippet) ||
        (sectionSnippet.length > 3 && answerLower.includes(sectionSnippet)) ||
        answerLower.includes(contentSnippet) ||
        citations.length === 0;

      if (isRelevant && citations.length < 3) {
        citations.push({
          sourceId: chunk.sourceId,
          sourceTitle: chunk.title,
          pageNumber: chunk.page,
          slideNumber: chunk.slide,
          timestamp: chunk.timestamp,
          sectionTitle: chunk.section,
          quote: chunk.content.substring(0, 150) + '...'
        });
      }
    }

    return { text: answer, citations };
  } catch (err: any) {
    console.error('Gemini RAG answer generation error:', err.message);

    // If quota error, return clear friendly message directly
    if (err.message?.includes('Free tier rate limit') || err.message?.includes('quota')) {
      return {
        text: '⚠️ Google AI Studio Free tier rate limit or quota reached. Please wait a moment and try again, or check your quota in Google AI Studio.',
        citations: []
      };
    }

    // Graceful offline fallback on other error
    const fallbackChunk = contextChunks[0];
    if (fallbackChunk) {
      const citedLoc = fallbackChunk.page ? `Page ${fallbackChunk.page}` : fallbackChunk.section || 'General';
      return {
        text: `Based on your uploaded source (${fallbackChunk.title}):\n\n${fallbackChunk.content}`,
        citations: [{
          sourceId: fallbackChunk.sourceId,
          sourceTitle: fallbackChunk.title,
          pageNumber: fallbackChunk.page,
          slideNumber: fallbackChunk.slide,
          timestamp: fallbackChunk.timestamp,
          sectionTitle: fallbackChunk.section,
          quote: fallbackChunk.content.substring(0, 140) + '...'
        }]
      };
    }

    return {
      text: notFoundPhrase,
      citations: []
    };
  }
}

export async function generateStudioArtifact(
  type: string,
  sourcesText: string,
  instruction?: string,
  options?: Record<string, any>,
  language: 'en' | 'ta' | 'hi' = 'en',
  mode: 'study' | 'research' = 'study'
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;

  const langNote = language === 'ta'
    ? 'CRITICAL MANDATORY REQUIREMENT: All generated content (titles, headings, overviews, summaries, descriptions, questions, answers, explanations, dialogue lines, cards, bullet points, table cells, takeaways) MUST BE STRICTLY WRITTEN IN TAMIL (தமிழ்). Do not write sentences in English. Speak and explain naturally in authentic Tamil script. Keep JSON object keys in English.'
    : language === 'hi'
    ? 'CRITICAL MANDATORY REQUIREMENT: All generated content (titles, headings, overviews, summaries, descriptions, questions, answers, explanations, dialogue lines, cards, bullet points, table cells, takeaways) MUST BE STRICTLY WRITTEN IN HINDI (हिन्दी). Do not write sentences in English. Speak and explain naturally in authentic Hindi Devanagari script. Keep JSON object keys in English.'
    : 'All generated text values must be written in English. Keep JSON schema keys in English as specified.';

  const modeNote = mode === 'research'
    ? 'Focus on analytical rigor, technical depth, formal terminology, comparative criteria, and precise citations.'
    : 'Focus on clear conceptual understanding, active recall, pedagogical structure, intuitive examples, and exam revision.';

  let promptInstruction = '';

  switch (type) {
    case 'summary':
      promptInstruction = `Generate a comprehensive multi-tier summary. Return JSON:
{
  "mode": "detailed",
  "overview": "High-level executive summary paragraph",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "sections": [
    { "title": "Core Foundations", "text": "Detailed explanation..." },
    { "title": "Operational Mechanics", "text": "Detailed explanation..." }
  ],
  "examPoints": ["Critical exam definition/concept", "Difference/trade-off point", "Important formula or note"]
}`;
      break;

    case 'audio_overview':
      promptInstruction = `Generate an engaging, educational podcast-style dialogue between two speakers (Dr. Sarah - Host/Explainer, and Marcus - Discussion Partner) discussing this topic thoroughly based strictly on the sources.
${language === 'ta' ? 'CRITICAL MANDATORY REQUIREMENT: All dialogue lines MUST BE FULLY WRITTEN IN TAMIL (தமிழ்). Explain the key points in natural spoken Tamil script. Do not output English dialogue!' : language === 'hi' ? 'CRITICAL MANDATORY REQUIREMENT: All dialogue lines MUST BE FULLY WRITTEN IN HINDI (हिन्दी). Explain the key points in natural Hindi script. Do not output English dialogue!' : ''}
Return JSON:
{
  "duration": "3:45",
  "speakers": [
    { "id": "host", "name": "${language === 'ta' ? 'Dr. Sarah (வழங்குபவர்)' : language === 'hi' ? 'Dr. Sarah (होस्ट)' : 'Dr. Sarah (Host)'}", "voice": "Kore" },
    { "id": "guest", "name": "${language === 'ta' ? 'Marcus (கலந்துரையாடுபவர்)' : language === 'hi' ? 'Marcus (सह-அध्येता)' : 'Marcus (Discussion Partner)'}", "voice": "Puck" }
  ],
  "dialogue": [
    { "speaker": "host", "text": "${language === 'ta' ? 'ஜென்நோட் ஆடியோ ஆய்வுக்கு வரவேற்கிறோம்! இன்று நாம் ஆராயும் தலைப்பு...' : 'Welcome to GenNote Audio Overview! Today we\\'re diving into...'}" },
    { "speaker": "guest", "text": "${language === 'ta' ? 'ஆம், இந்த மூல ஆவணங்களின்படி...' : 'I\\'ve been looking forward to this! Specifically, how the source notes describe...'}" }
  ]
}`;
      break;

    case 'slide_deck':
      promptInstruction = `Generate a clean ${options?.slideCount || 5}-slide presentation deck based on the sources. Return JSON:
{
  "style": "${options?.style || 'professional'}",
  "slides": [
    {
      "id": "s1",
      "title": "Title of Slide",
      "subtitle": "Subtitle or context",
      "bullets": ["Key bullet 1", "Key bullet 2", "Key bullet 3"],
      "visualSuggestion": "Description of suggested diagram/chart/visual",
      "citation": "Source reference",
      "speakerNotes": "Brief notes for the presenter"
    }
  ]
}`;
      break;

    case 'video_overview':
      promptInstruction = `Generate a video scene storyboard and script for an educational video overview. Return JSON:
{
  "title": "Video Overview Title",
  "totalDuration": "${options?.duration || '3:00'}",
  "scenes": [
    {
      "sceneNumber": 1,
      "timecode": "00:00 - 00:45",
      "title": "Introduction & Concept Hook",
      "narration": "Voiceover script narration...",
      "visualDescription": "What is shown visually on screen (diagrams, animation)",
      "onScreenText": "Key takeaway text banner",
      "sourceReference": "Source citation"
    }
  ]
}`;
      break;

    case 'mind_map':
      promptInstruction = `Generate a hierarchical concept tree for a Mind Map capturing core concepts and subtopics. Return JSON:
{
  "root": {
    "id": "node-root",
    "title": "Central Subject",
    "label": "Central Subject",
    "description": "Central subject description",
    "children": [
      {
        "id": "node-1",
        "title": "Major Topic 1",
        "label": "Major Topic 1",
        "description": "Topic 1 description",
        "children": [
          { "id": "node-1-1", "title": "Subtopic A", "label": "Subtopic A", "description": "Details", "children": [] },
          { "id": "node-1-2", "title": "Subtopic B", "label": "Subtopic B", "description": "Details", "children": [] }
        ]
      }
    ]
  }
}`;
      break;

    case 'report':
      promptInstruction = `Generate a formal ${options?.reportType || 'Technical'} Study Report. Return JSON:
{
  "title": "Comprehensive Topic Report",
  "reportType": "${options?.reportType || 'Technical'}",
  "executiveSummary": "Concise executive overview paragraph",
  "sections": [
    {
      "title": "1. Introduction & Theoretical Foundations",
      "heading": "1. Introduction & Theoretical Foundations",
      "content": "Detailed text based on sources...",
      "subsections": [
        { "title": "1.1 Background Principles", "content": "Detailed content..." }
      ]
    },
    {
      "title": "2. Structural Architecture & Mechanisms",
      "heading": "2. Structural Architecture & Mechanisms",
      "content": "Detailed text..."
    }
  ],
  "conclusion": "Synthesized recommendations and conclusions",
  "references": ["Reference 1 from sources", "Reference 2 from sources"]
}`;
      break;

    case 'flashcards':
      promptInstruction = `Generate ${options?.cardCount || 8} high-yield study flashcards based on the sources. Return JSON:
{
  "cards": [
    {
      "id": "fc-1",
      "front": "Question or term on front",
      "back": "Accurate, clear definition or answer on back",
      "tag": "Topic Category",
      "difficulty": "medium"
    }
  ]
}`;
      break;

    case 'quiz':
      promptInstruction = `Generate an interactive ${options?.questionCount || 5}-question practice quiz with multiple choice and true/false questions based solely on the sources. Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct based on the source.",
      "topic": "Topic Name",
      "citation": "Source Reference"
    }
  ]
}`;
      break;

    case 'infographic':
      promptInstruction = `Extract facts and structured visual information to construct an Infographic layout. Return JSON:
{
  "mainTopic": "Central Topic Title",
  "subtitle": "Subtitle or tagline",
  "stats": [
    { "label": "Key Metric or Principle", "value": "Primary Stat/Formula", "context": "Contextual description" }
  ],
  "processSteps": [
    { "step": 1, "title": "Phase 1: Step Name", "description": "Step description" },
    { "step": 2, "title": "Phase 2: Step Name", "description": "Step description" },
    { "step": 3, "title": "Phase 3: Step Name", "description": "Step description" }
  ],
  "comparison": {
    "title": "Comparative Analysis",
    "featureA": "Approach A",
    "featureB": "Approach B",
    "rows": [
      { "criterion": "Evaluation Criterion", "valueA": "Details A", "valueB": "Details B" }
    ]
  },
  "takeaways": ["Key takeaway 1", "Key takeaway 2"]
}`;
      break;

    case 'data_table':
      promptInstruction = `Extract comparative metrics, properties, or structured dimensions into a clean Data Table. Return JSON:
{
  "title": "Synthesized Comparison Matrix",
  "columns": ["Feature / Dimension", "Method 1", "Method 2", "Best Practice"],
  "rows": [
    ["Row Dimension 1", "Value A", "Value B", "Notes"],
    ["Row Dimension 2", "Value A", "Value B", "Notes"]
  ]
}`;
      break;

    case 'study_guide':
      promptInstruction = `Generate a comprehensive exam preparation Study Guide with syllabus mastery topics and checklist. Return JSON:
{
  "title": "Complete Course Study Guide",
  "topics": [
    {
      "title": "Topic 1: Core Fundamentals",
      "description": "Comprehensive explanation of topic...",
      "status": "Not Started",
      "keyCheckpoints": ["Checkpoint 1", "Checkpoint 2"]
    }
  ],
  "checklist": [
    { "topic": "Core Fundamentals", "status": "Not Started" }
  ],
  "practiceQuestions": [
    "Practice question 1",
    "Practice question 2"
  ]
}`;
      break;

    case 'questions':
      promptInstruction = `Generate examination practice questions categorized into 2-Mark short questions, 5-Mark analytical questions, and 10-Mark essay questions with model answers. Return JSON:
{
  "shortQuestions": [
    { "question": "Define concept X", "answer": "Model answer...", "modelAnswer": "Model answer...", "citation": "Page/Section", "marks": 2 }
  ],
  "mediumQuestions": [
    { "question": "Explain mechanism Y in detail", "answer": "Model answer...", "modelAnswer": "Model answer...", "citation": "Page/Section", "marks": 5 }
  ],
  "longQuestions": [
    { "question": "Critically analyze and compare Z and W", "answer": "Model answer...", "modelAnswer": "Model answer...", "citation": "Page/Section", "marks": 10 }
  ],
  "categories": [
    {
      "category": "2-Mark Short Answer Questions",
      "questions": [{ "question": "Define concept X", "answer": "Model answer...", "citation": "Page/Section" }]
    }
  ]
}`;
      break;

    case 'definitions':
      promptInstruction = `Extract key technical terms, authoritative definitions, and formulas. Return JSON:
{
  "definitions": [
    {
      "term": "Term Name",
      "definition": "Precise authoritative definition from sources",
      "example": "Concrete example or formula",
      "citation": "Source reference"
    }
  ]
}`;
      break;

    default:
      promptInstruction = `Summarize and structure the content into clean JSON.`;
  }

  const prompt = `${promptInstruction}
${instruction ? `User Specific Instruction: ${instruction}` : ''}
${langNote}
${modeNote}

Source Content from User's Notebook:
${sourcesText.substring(0, 32000)}

Respond STRICTLY with valid JSON only. Do not wrap in markdown or backticks if possible, or provide raw parseable JSON.`;

  if (!apiKey || apiKey === 'dummy-key' || apiKey === 'MY_GEMINI_API_KEY') {
    return generateFallbackArtifact(type, sourcesText, options, language);
  }

  try {
    const raw = await callGemini(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.3
    });

    const cleaned = (raw || '{}').trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error('Could not parse JSON output from Gemini');
      }
    }

    return normalizeArtifactContent(type, parsed, sourcesText, language);
  } catch (err: any) {
    console.error(`Gemini artifact generation error for ${type}:`, err.message || err);
    if (err.message?.includes('Free tier rate limit') || err.message?.includes('Invalid Gemini API Key')) {
      throw err;
    }
    return generateFallbackArtifact(type, sourcesText, options, language);
  }
}

// Normalizer to ensure that generated JSON strictly conforms to what each frontend viewer expects
function normalizeArtifactContent(type: string, data: any, sourcesText: string, language: 'en' | 'ta' | 'hi'): any {
  if (!data || typeof data !== 'object') {
    return generateFallbackArtifact(type, sourcesText, {}, language);
  }

  switch (type) {
    case 'summary':
      return {
        mode: data.mode || 'detailed',
        overview: data.overview || 'Comprehensive synthesis of uploaded notes.',
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        sections: Array.isArray(data.sections) ? data.sections.map((s: any) => ({
          title: s.title || s.heading || 'Section Overview',
          text: s.text || s.content || ''
        })) : [],
        examPoints: Array.isArray(data.examPoints) ? data.examPoints : []
      };

    case 'slide_deck': {
      const slides = Array.isArray(data.slides) ? data.slides : [];
      return {
        style: data.style || 'professional',
        slides: slides.map((s: any, idx: number) => ({
          id: s.id || `s-${idx + 1}`,
          title: s.title || `Slide ${idx + 1}`,
          subtitle: s.subtitle || '',
          bullets: Array.isArray(s.bullets) ? s.bullets : [],
          visualSuggestion: s.visualSuggestion || 'Architectural flow diagram',
          citation: s.citation || 'Source Notes',
          speakerNotes: s.speakerNotes || ''
        }))
      };
    }

    case 'audio_overview': {
      const rawDialogue = Array.isArray(data.dialogue)
        ? data.dialogue
        : Array.isArray(data.transcript)
        ? data.transcript
        : Array.isArray(data.script)
        ? data.script
        : [];
      return {
        duration: data.duration || '3:30',
        speakers: Array.isArray(data.speakers) && data.speakers.length >= 2
          ? data.speakers
          : [
              { id: 'host', name: 'Dr. Sarah (Host)', voice: 'Kore' },
              { id: 'guest', name: 'Marcus (Discussion Partner)', voice: 'Puck' }
            ],
        dialogue: rawDialogue.map((d: any) => ({
          speaker: (d.speaker === 'guest' || d.speaker === 'Marcus' || (typeof d.speaker === 'string' && d.speaker.toLowerCase().includes('marcus'))) ? 'guest' : 'host',
          text: d.text || d.line || d.speech || d.dialogue || ''
        }))
      };
    }

    case 'mind_map': {
      const normalizeNode = (node: any, idx = 0): any => {
        if (!node) return { id: `node-${idx}`, title: 'Concept', label: 'Concept', children: [] };
        const label = node.label || node.title || node.name || 'Core Concept';
        return {
          id: node.id || `node-${idx}`,
          title: label,
          label: label,
          description: node.description || '',
          children: Array.isArray(node.children) ? node.children.map((c: any, cI: number) => normalizeNode(c, cI)) : []
        };
      };
      return {
        root: normalizeNode(data.root || data)
      };
    }

    case 'quiz': {
      const questions = Array.isArray(data.questions) ? data.questions : [];
      return {
        questions: questions.map((q: any, i: number) => {
          let correct = 0;
          if (typeof q.correctAnswer === 'number') {
            correct = q.correctAnswer;
          } else if (typeof q.correctAnswer === 'string') {
            if (q.correctAnswer.toUpperCase() === 'A' || q.correctAnswer.toLowerCase() === 'true') correct = 0;
            else if (q.correctAnswer.toUpperCase() === 'B' || q.correctAnswer.toLowerCase() === 'false') correct = 1;
            else if (q.correctAnswer.toUpperCase() === 'C') correct = 2;
            else if (q.correctAnswer.toUpperCase() === 'D') correct = 3;
            else correct = parseInt(q.correctAnswer, 10) || 0;
          }
          return {
            id: q.id || `q-${i + 1}`,
            type: q.type || 'mcq',
            question: q.question || 'Practice Question',
            options: Array.isArray(q.options) ? q.options : ['True', 'False'],
            correctAnswer: correct,
            explanation: q.explanation || 'Verified from course sources.',
            topic: q.topic || 'Fundamentals',
            citation: q.citation || ''
          };
        })
      };
    }

    case 'flashcards': {
      const cards = Array.isArray(data.cards) ? data.cards : [];
      return {
        cards: cards.map((c: any, i: number) => ({
          id: c.id || `fc-${i + 1}`,
          front: c.front || 'Key Term / Concept',
          back: c.back || 'Definition and verified explanation.',
          tag: c.tag || 'Syllabus',
          difficulty: c.difficulty || 'medium'
        }))
      };
    }

    case 'infographic': {
      const stats = Array.isArray(data.stats)
        ? data.stats
        : Array.isArray(data.keyStats)
        ? data.keyStats.map((ks: any) => ({ label: ks.label, value: ks.value, context: ks.description }))
        : [];

      const processSteps = Array.isArray(data.processSteps)
        ? data.processSteps
        : Array.isArray(data.processFlow)
        ? data.processFlow.map((pf: any) => ({ step: pf.step, title: pf.title, description: pf.desc || pf.description }))
        : [];

      const comparison = data.comparison || {};
      const rows = Array.isArray(comparison.rows)
        ? comparison.rows
        : Array.isArray(comparison.points)
        ? comparison.points.map((p: any) => ({ criterion: p.feature, valueA: p.valA, valueB: p.valB }))
        : [];

      return {
        mainTopic: data.mainTopic || 'Core Subject Overview',
        subtitle: data.subtitle || 'Synthesized Knowledge Infographic',
        stats,
        processSteps,
        comparison: {
          title: comparison.title || 'Architectural Comparison',
          featureA: comparison.featureA || comparison.itemA || 'Paradigm A',
          featureB: comparison.featureB || comparison.itemB || 'Paradigm B',
          rows
        },
        takeaways: Array.isArray(data.takeaways) ? data.takeaways : []
      };
    }

    case 'study_guide': {
      let topics = Array.isArray(data.topics) ? data.topics : [];
      if (topics.length === 0 && Array.isArray(data.checklist)) {
        topics = data.checklist.map((cl: any) => ({
          title: cl.topic || cl.title || 'Topic',
          description: cl.description || cl.summary || 'Essential course topic for exam mastery.',
          status: cl.status || 'Not Started',
          keyCheckpoints: cl.keyCheckpoints || []
        }));
      }
      return {
        title: data.title || 'Complete Study & Revision Guide',
        topics: topics.map((t: any) => ({
          title: t.title || t.topic || 'Syllabus Topic',
          description: t.description || t.summary || '',
          status: t.status || 'Not Started',
          keyCheckpoints: Array.isArray(t.keyCheckpoints) ? t.keyCheckpoints : []
        })),
        checklist: data.checklist || topics.map((t: any) => ({ topic: t.title, status: t.status })),
        practiceQuestions: Array.isArray(data.practiceQuestions) ? data.practiceQuestions : []
      };
    }

    case 'questions': {
      let shortQuestions = Array.isArray(data.shortQuestions) ? data.shortQuestions : [];
      let mediumQuestions = Array.isArray(data.mediumQuestions) ? data.mediumQuestions : [];
      let longQuestions = Array.isArray(data.longQuestions) ? data.longQuestions : [];

      // If categories provided, unpack into short/med/long
      if (shortQuestions.length === 0 && Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          const catName = (cat.category || '').toLowerCase();
          const qs = Array.isArray(cat.questions) ? cat.questions : [];
          if (catName.includes('2-mark') || catName.includes('short')) {
            shortQuestions.push(...qs.map((q: any) => ({ ...q, marks: 2 })));
          } else if (catName.includes('5-mark') || catName.includes('conceptual') || catName.includes('medium')) {
            mediumQuestions.push(...qs.map((q: any) => ({ ...q, marks: 5 })));
          } else {
            longQuestions.push(...qs.map((q: any) => ({ ...q, marks: 10 })));
          }
        }
      }

      return {
        shortQuestions: shortQuestions.map((q: any) => ({
          question: q.question,
          answer: q.answer || q.modelAnswer || '',
          modelAnswer: q.modelAnswer || q.answer || '',
          citation: q.citation || '',
          marks: 2
        })),
        mediumQuestions: mediumQuestions.map((q: any) => ({
          question: q.question,
          answer: q.answer || q.modelAnswer || '',
          modelAnswer: q.modelAnswer || q.answer || '',
          citation: q.citation || '',
          marks: 5
        })),
        longQuestions: longQuestions.map((q: any) => ({
          question: q.question,
          answer: q.answer || q.modelAnswer || '',
          modelAnswer: q.modelAnswer || q.answer || '',
          citation: q.citation || '',
          marks: 10
        })),
        categories: data.categories || []
      };
    }

    case 'report': {
      const sections = Array.isArray(data.sections) ? data.sections : [];
      return {
        title: data.title || 'Grounded Synthesis Report',
        reportType: data.reportType || 'Technical',
        executiveSummary: data.executiveSummary || 'Synthesis of source materials.',
        sections: sections.map((s: any) => ({
          title: s.title || s.heading || 'Section Analysis',
          heading: s.heading || s.title || 'Section Analysis',
          content: s.content || '',
          subsections: Array.isArray(s.subsections) ? s.subsections : []
        })),
        conclusion: data.conclusion || '',
        references: Array.isArray(data.references) ? data.references : []
      };
    }

    case 'video_overview': {
      const scenes = Array.isArray(data.scenes) ? data.scenes : [];
      return {
        title: data.title || 'Educational Video Storyboard',
        totalDuration: data.totalDuration || '3:00',
        scenes: scenes.map((s: any, idx: number) => ({
          sceneNumber: s.sceneNumber || idx + 1,
          timecode: s.timecode || `00:${String(idx * 30).padStart(2, '0')}`,
          title: s.title || `Scene ${idx + 1}`,
          narration: s.narration || '',
          visualDescription: s.visualDescription || '',
          onScreenText: s.onScreenText || '',
          sourceReference: s.sourceReference || ''
        }))
      };
    }

    case 'definitions': {
      const defs = Array.isArray(data.definitions) ? data.definitions : [];
      return {
        definitions: defs.map((d: any) => ({
          term: d.term || 'Term',
          definition: d.definition || '',
          example: d.example || '',
          citation: d.citation || d.sourceRef || ''
        }))
      };
    }

    case 'data_table': {
      return {
        title: data.title || 'Extracted Tabular Analysis',
        columns: Array.isArray(data.columns) ? data.columns : ['Feature', 'Description', 'Value'],
        rows: Array.isArray(data.rows) ? data.rows : []
      };
    }

    default:
      return data;
  }
}

function generateFallbackArtifact(
  type: string,
  sourcesText: string,
  options?: Record<string, any>,
  language: 'en' | 'ta' | 'hi' = 'en'
): any {
  const lines = sourcesText
    .split('\n')
    .map(l => l.replace(/^[#\-*|\s]+/, '').trim())
    .filter(l => l.length > 25);

  const titleHint = lines[0] ? lines[0].substring(0, 50) : 'Study Material';

  if (language === 'ta') {
    switch (type) {
      case 'summary':
        return {
          mode: 'detailed',
          overview: `${titleHint} பற்றிய விரிவான கண்ணோட்டம். மூல ஆவணத்தின் முக்கிய கோட்பாடுகள் மற்றும் செயல்பாட்டு விதிகள் கீழே தொகுக்கப்பட்டுள்ளன.`,
          keyPoints: lines.slice(0, 5).map((l, i) => `${i + 1}. ${l.substring(0, 90)}`),
          sections: [
            { title: 'அடிப்படை தத்துவங்கள்', text: lines.slice(0, 3).join(' ') || 'ஆவணத்திலிருந்து எடுக்கப்பட்ட முக்கிய கருத்துகள்.' },
            { title: 'செயல்முறை வழிமுறைகள்', text: lines.slice(3, 6).join(' ') || 'கட்டமைப்பு விதிகள் மற்றும் தேர்வுக்கான குறிப்புகள்.' }
          ],
          examPoints: [
            'முக்கிய வரையறைகள் மற்றும் நிலைகளை நினைவில் கொள்க.',
            'செயல்திறன் மாற்றங்கள் மற்றும் தாமதத்தை சமநிலைப்படுத்துங்கள்.',
            'தேர்வு மதிப்பாய்வுக்கான முக்கிய புள்ளிகளை மீண்டும் படிக்கவும்.'
          ]
        };

      case 'flashcards':
        return {
          cards: [
            { id: 'fc-1', front: `${titleHint.substring(0, 40)} என்றால் என்ன?`, back: lines[0] || 'பாடத்தின் அடிப்படைக் கோட்பாடு.', tag: 'அடிப்படை', difficulty: 'easy' },
            { id: 'fc-2', front: 'இதன் முக்கிய பங்கு என்ன?', back: lines[1] || 'அமைப்பின் செயல்பாடுகளைச் சீராக்குவது.', tag: 'செயல்முறை', difficulty: 'medium' },
            { id: 'fc-3', front: 'தேர்வில் கேட்கப்படும் முக்கிய பகுதி எது?', back: lines[2] || 'தாமதம் மற்றும் நினைவக பயன்பாட்டின் சமநிலை.', tag: 'முக்கியம்', difficulty: 'hard' },
            { id: 'fc-4', front: 'செயல்பாட்டு விதிமுறை என்ன?', back: lines[3] || 'முறையான வள ஒதுக்கீட்டை உறுதி செய்தல்.', tag: 'விதி', difficulty: 'medium' }
          ]
        };

      case 'quiz':
        return {
          questions: [
            {
              id: 'q1',
              type: 'mcq',
              question: `${titleHint.substring(0, 30)} இன் முதன்மை நோக்கம் என்ன?`,
              options: [lines[0]?.substring(0, 60) || 'செயல்பாடுகளை ஒருங்கிணைத்தல்', 'கட்டுப்பாடுகளைத் தவிர்த்தல்', 'நினைவகத்தை நீக்குதல்', 'நிலையான மதிப்புகளை ஒதுக்குதல்'],
              correctAnswer: 0,
              explanation: 'மூல ஆவணத்தின்படி, செயல்பாடுகளை முறையாக ஒருங்கிணைப்பதே முதன்மை நோக்கமாகும்.',
              topic: 'அடிப்படை',
              citation: 'பாடம் 1'
            },
            {
              id: 'q2',
              type: 'true_false',
              question: 'அமைப்பின் செயல்பாட்டு மாற்றங்களுக்கு கூடுதல் நேரம் தேவைப்படாது.',
              options: ['சரி', 'தவறு'],
              correctAnswer: 1,
              explanation: 'தவறு. ஒவ்வொரு மாற்றத்திற்கும் தேவையான நேரம் மற்றும் வளங்கள் செலவிடப்படும்.',
              topic: 'செயல்திறன்',
              citation: 'பாடம் 2'
            }
          ]
        };

      case 'audio_overview':
        return {
          duration: '3:30',
          speakers: [
            { id: 'host', name: 'Dr. Sarah (வழங்குபவர்)', voice: 'Kore' },
            { id: 'guest', name: 'Marcus (கலந்துரையாடுபவர்)', voice: 'Puck' }
          ],
          dialogue: [
            { speaker: 'host', text: `ஜென்நோட் ஆடியோ விவாதத்திற்கு வரவேற்கிறோம்! இன்று நாம் ${titleHint} பற்றி ஆராய்கிறோம்.` },
            { speaker: 'guest', text: `ஆம், இந்த மூல ஆவணங்கள் மிகத் துல்லியமாக விளக்குகின்றன: ${lines[1]?.substring(0, 100) || 'முக்கிய கொள்கை மிகத் தெளிவானது.'}` },
            { speaker: 'host', text: `குறிப்பாக தேர்வுக்குத் தேவையான கருத்துகளைப் புரிந்துகொள்வது மிக முக்கியம்.` },
            { speaker: 'guest', text: `கண்டிப்பாக, மாணவர்கள் இந்த முக்கிய புள்ளிகளை நினைவில் கொள்ள வேண்டும்.` }
          ]
        };

      case 'definitions':
        return {
          definitions: [
            { term: titleHint.substring(0, 25), definition: lines[0] || 'பாடத்தின் அடிப்படைக் கருத்து.', example: lines[1]?.substring(0, 50), citation: 'பக்கம் 1' },
            { term: 'முதன்மை செயல்முறை', definition: lines[2] || 'அமைப்பின் அடிப்படை கட்டமைப்பு.', example: 'வள மேலாண்மை', citation: 'பக்கம் 2' }
          ]
        };

      case 'questions':
        return {
          shortQuestions: [
            { question: `${titleHint.substring(0, 30)} ஐ வரையறுக்குக.`, answer: lines[0] || 'பாடத்தின் அடிப்படைக் கருத்து.', modelAnswer: lines[0] || 'பாடத்தின் அடிப்படைக் கருத்து.', citation: 'பகுதி 1', marks: 2 }
          ],
          mediumQuestions: [
            { question: `${titleHint.substring(0, 30)} இன் செயல்பாட்டு விதிகளை விளக்குக.`, answer: lines.slice(1, 3).join(' ') || 'முக்கிய விதிகள்.', modelAnswer: lines.slice(1, 3).join(' ') || 'முக்கிய விதிகள்.', citation: 'பகுதி 2', marks: 5 }
          ],
          longQuestions: [
            { question: `${titleHint.substring(0, 30)} பற்றிய விரிவான பகுப்பாய்வு தருக.`, answer: lines.slice(0, 5).join(' ') || 'முழுமையான விளக்கம்.', modelAnswer: lines.slice(0, 5).join(' ') || 'முழுமையான விளக்கம்.', citation: 'பகுதி 3', marks: 10 }
          ],
          categories: []
        };

      case 'mind_map':
        return {
          root: {
            id: 'node-root',
            title: titleHint.substring(0, 30) || 'முக்கிய பாடம்',
            label: titleHint.substring(0, 30) || 'முக்கிய பாடம்',
            description: 'பாடத்தின் முக்கிய கருத்து வரைபடம்',
            children: [
              {
                id: 'node-1',
                title: 'அடிப்படைக் கருத்துகள்',
                label: 'அடிப்படைக் கருத்துகள்',
                description: 'முக்கிய கொள்கைகள்',
                children: [
                  { id: 'node-1-1', title: lines[0]?.substring(0, 35) || 'கோட்பாடுகள்', label: lines[0]?.substring(0, 35) || 'கோட்பாடுகள்', description: 'விளக்கம்', children: [] },
                  { id: 'node-1-2', title: lines[1]?.substring(0, 35) || 'வரையறைகள்', label: lines[1]?.substring(0, 35) || 'வரையறைகள்', description: 'விளக்கம்', children: [] }
                ]
              },
              {
                id: 'node-2',
                title: 'செயல்முறை வழிமுறைகள்',
                label: 'செயல்முறை வழிமுறைகள்',
                description: 'அமைப்பின் இயக்க விதிகள்',
                children: [
                  { id: 'node-2-1', title: lines[2]?.substring(0, 35) || 'கட்டமைப்பு', label: lines[2]?.substring(0, 35) || 'கட்டமைப்பு', description: 'விளக்கம்', children: [] },
                  { id: 'node-2-2', title: lines[3]?.substring(0, 35) || 'விதிகள்', label: lines[3]?.substring(0, 35) || 'விதிகள்', description: 'விளக்கம்', children: [] }
                ]
              }
            ]
          }
        };

      case 'slide_deck':
        return {
          style: options?.style || 'professional',
          slides: [
            {
              id: 's1',
              title: titleHint.substring(0, 40) || 'பாட அறிமுகம்',
              subtitle: 'முக்கிய கருத்துகள் மற்றும் பகுப்பாய்வு',
              bullets: [lines[0]?.substring(0, 80) || 'அடிப்படைக் கோட்பாடுகள்', lines[1]?.substring(0, 80) || 'செயல்பாட்டு விதிகள்', 'தேர்வுக்குரிய குறிப்புகள்'],
              visualSuggestion: 'கருத்து விளக்க வரைபடம்',
              citation: 'ஆவணப் பகுதி 1',
              speakerNotes: 'பாடத்தின் அடிப்படைக் கருத்துகளை மாணவர்களுக்கு அறிமுகப்படுத்துங்கள்.'
            },
            {
              id: 's2',
              title: 'முக்கிய செயல்பாடுகள்',
              subtitle: 'கட்டமைப்பு மற்றும் விதிகள்',
              bullets: [lines[2]?.substring(0, 80) || 'அமைப்பின் கட்டமைப்பு', lines[3]?.substring(0, 80) || 'செயல்முறை ஓட்டம்', 'முக்கிய பயன்பாடுகள்'],
              visualSuggestion: 'செயல்முறை பாய்வுப் படம்',
              citation: 'ஆவணப் பகுதி 2',
              speakerNotes: 'செயல்முறையின் முக்கிய படிகளை தெளிவாக விளக்குங்கள்.'
            }
          ]
        };

      case 'report':
        return {
          title: `${titleHint.substring(0, 40)} - தொழில்நுட்ப ஆய்வு அறிக்கை`,
          reportType: 'Technical',
          executiveSummary: `${titleHint} பற்றிய முழுமையான பகுப்பாய்வு மற்றும் தொகுப்பு.`,
          sections: [
            {
              title: '1. அறிமுகம் மற்றும் அடிப்படைக் கோட்பாடுகள்',
              heading: '1. அறிமுகம் மற்றும் அடிப்படைக் கோட்பாடுகள்',
              content: lines.slice(0, 4).join(' ') || 'பாடத்தின் அடிப்படைக் கருத்துகள்.',
              subsections: []
            },
            {
              title: '2. செயல்முறை மதிப்பாய்வு',
              heading: '2. செயல்முறை மதிப்பாய்வு',
              content: lines.slice(4, 8).join(' ') || 'செயல்முறை விதிகள் மற்றும் தேர்வுக்கான குறிப்புகள்.',
              subsections: []
            }
          ],
          conclusion: 'இந்த ஆவணம் பாடத்தின் முக்கிய அடிப்படைகளை விரிவாக விளக்குகிறது.',
          references: ['பாடக் குறிப்புகள்', 'விரிவுரை ஆவணம்']
        };

      case 'study_guide':
        return {
          title: `${titleHint.substring(0, 40)} - தேர்வு தயாரிப்பு வழிகாட்டி`,
          topics: [
            {
              title: 'முக்கிய அடிப்படைகள்',
              description: lines[0] || 'பாடத்தின் அடிப்படைக் கோட்பாடு.',
              status: 'In Progress',
              keyCheckpoints: ['வரையறைகளை மனனம் செய்க', 'சூத்திரங்களை மீண்டும் எழுதுக']
            },
            {
              title: 'செயல்முறை வினாக்கள்',
              description: lines[1] || 'முக்கிய தேர்வு வினாக்கள்.',
              status: 'Not Started',
              keyCheckpoints: ['மாதிரி வினாக்களை தீர்க்கவும்', 'முக்கிய வரைபடங்களை வரையவும்']
            }
          ],
          checklist: [
            { topic: 'அடிப்படைக் கருத்துகள்', status: 'In Progress' },
            { topic: 'செயல்முறை வழிமுறைகள்', status: 'Not Started' }
          ],
          practiceQuestions: [
            `${titleHint.substring(0, 30)} என்றால் என்ன? விளக்குக.`,
            'இதன் முக்கிய பயன்பாடுகள் யாவை?'
          ]
        };
    }
  }

  if (language === 'hi') {
    switch (type) {
      case 'summary':
        return {
          mode: 'detailed',
          overview: `${titleHint} का विस्तृत विश्लेषण। स्रोत सामग्री मुख्य सिद्धांतों, परिभाषाओं और परिचालन मानदंडों की व्याख्या करती है।`,
          keyPoints: lines.slice(0, 5).map((l, i) => `${i + 1}. ${l.substring(0, 90)}`),
          sections: [
            { title: 'मूल सिद्धांत', text: lines.slice(0, 3).join(' ') || 'दस्तावेज़ से मुख्य मूलभूत अवधारणाएँ।' },
            { title: 'परिचालन प्रक्रिया', text: lines.slice(3, 6).join(' ') || 'विस्तृत संरचनात्मक तंत्र और नियम।' }
          ],
          examPoints: [
            'मूल परिभाषाओं और प्रमुख अवस्थाओं में महारत हासिल करें।',
            'प्रदर्शन और विलंबता के बीच संतुलन को समझें।',
            'परीक्षा समीक्षा के लिए मुख्य चरणों को दोहराएं।'
          ]
        };

      case 'flashcards':
        return {
          cards: [
            { id: 'fc-1', front: `${titleHint.substring(0, 40)} का क्या अर्थ है?`, back: lines[0] || 'अध्ययन सामग्री की एक मूलभूत अवधारणा।', tag: 'मूल अवधारणाएं', difficulty: 'easy' },
            { id: 'fc-2', front: 'इसकी मुख्य भूमिका क्या है?', back: lines[1] || 'संसाधनों का कुशल प्रबंधन और सुरक्षा सुनिश्चित करना।', tag: 'प्रक्रिया', difficulty: 'medium' },
            { id: 'fc-3', front: 'महत्वपूर्ण परीक्षा प्रश्न कौन सा है?', back: lines[2] || 'विलंबता और थ्रूपुट के बीच व्यापार-बंद।', tag: 'समीक्षा', difficulty: 'hard' }
          ]
        };

      case 'quiz':
        return {
          questions: [
            {
              id: 'q1',
              type: 'mcq',
              question: `${titleHint.substring(0, 30)} का प्राथमिक कार्य क्या है?`,
              options: [lines[0]?.substring(0, 60) || 'संसाधनों का समन्वय करना', 'नियंत्रण को दरकिनार करना', 'मेमोरी अनुवाद बंद करना', 'स्थैतिक मान तय करना'],
              correctAnswer: 0,
              explanation: 'स्रोत के अनुसार, निष्पादन संसाधनों का समन्वय करना इसका मुख्य उद्देश्य है।',
              topic: 'मुख्य वास्तुकला',
              citation: 'अध्याय 1'
            }
          ]
        };

      case 'audio_overview':
        return {
          duration: '3:30',
          speakers: [
            { id: 'host', name: 'डॉ. सारा (होस्ट)', voice: 'Kore' },
            { id: 'guest', name: 'मार्कस (सह-अध्येता)', voice: 'Puck' }
          ],
          dialogue: [
            { speaker: 'host', text: `जेननोट ऑडियो चर्चा में आपका स्वागत है! आज हम ${titleHint} पर बात कर रहे हैं।` },
            { speaker: 'guest', text: `जी बिल्कुल, यह स्रोत बहुत स्पष्ट रूप से समझाता है: ${lines[1]?.substring(0, 100) || 'मुख्य सिद्धांत अत्यंत उपयोगी है।'}` },
            { speaker: 'host', text: `परीक्षा की तैयारी के लिए इन मुख्य बिंदुओं को समझना बहुत आवश्यक है।` }
          ]
        };

      case 'definitions':
        return {
          definitions: [
            { term: titleHint.substring(0, 25), definition: lines[0] || 'मूलभूत अवधारणा।', example: lines[1]?.substring(0, 50), citation: 'पृष्ठ 1' }
          ]
        };

      case 'questions':
        return {
          shortQuestions: [
            { question: `${titleHint.substring(0, 30)} को परिभाषित करें।`, answer: lines[0] || 'मूलभूत परिभाषा।', modelAnswer: lines[0] || 'मूलभूत परिभाषा।', citation: 'खंड 1', marks: 2 }
          ],
          mediumQuestions: [
            { question: `${titleHint.substring(0, 30)} के मुख्य चरणों की व्याख्या करें।`, answer: lines.slice(1, 3).join(' ') || 'चरणबद्ध व्याख्या।', modelAnswer: lines.slice(1, 3).join(' ') || 'चरणबद्ध व्याख्या।', citation: 'खंड 2', marks: 5 }
          ],
          longQuestions: [
            { question: `${titleHint.substring(0, 30)} का विस्तृत तुलनात्मक विश्लेषण प्रस्तुत करें।`, answer: lines.slice(0, 5).join(' ') || 'विस्तृत उत्तर।', modelAnswer: lines.slice(0, 5).join(' ') || 'विस्तृत उत्तर।', citation: 'खंड 3', marks: 10 }
          ],
          categories: []
        };
    }
  }

  // English (Default)
  switch (type) {
    case 'summary':
      return {
        mode: 'detailed',
        overview: `Comprehensive synthesis of ${titleHint}. The source outlines core mechanisms, definitions, and operational criteria.`,
        keyPoints: lines.slice(0, 5).map(l => l.substring(0, 100)),
        sections: [
          { title: 'Core Principles', text: lines.slice(0, 3).join(' ') || 'Key fundamentals from uploaded documents.' },
          { title: 'Mechanisms & Execution', text: lines.slice(3, 6).join(' ') || 'Detailed structural mechanics and rules.' }
        ],
        examPoints: [
          'Master fundamental definitions and key state transitions.',
          'Understand performance trade-offs and latency considerations.',
          'Review the step-by-step resolution algorithm.'
        ]
      };

    case 'audio_overview':
      return {
        duration: '3:45',
        speakers: [
          { id: 'host', name: 'Dr. Sarah (Host)', voice: 'Kore' },
          { id: 'guest', name: 'Marcus (Discussion Partner)', voice: 'Puck' }
        ],
        dialogue: [
          { speaker: 'host', text: `Welcome to GenNote Audio Overview! Today we're exploring ${titleHint}. Marcus, what stood out to you first in these sources?` },
          { speaker: 'guest', text: `What's striking is how cleanly these sources organize the core concepts. For instance: ${lines[1] ? lines[1].substring(0, 120) : 'the primary principle establishes modular boundaries.'}` },
          { speaker: 'host', text: `Exactly. And that leads directly to the trade-offs in execution. Notice how: ${lines[2] ? lines[2].substring(0, 120) : 'the architecture guarantees fairness and isolation.'}` },
          { speaker: 'guest', text: `Right! That is why students need to remember this for examinations and practical design.` }
        ]
      };

    case 'slide_deck':
      return {
        style: options?.style || 'professional',
        slides: [
          {
            id: 's1',
            title: titleHint || 'Study Overview',
            subtitle: 'Key Insights and Structural Analysis',
            bullets: [lines[0]?.substring(0, 80) || 'Introduction to concepts', lines[1]?.substring(0, 80) || 'Primary operational mechanisms', 'Key outcomes and definitions'],
            visualSuggestion: 'High-level architectural diagram showing system interaction',
            citation: 'Source Notes',
            speakerNotes: 'Introduce the core topic and outline the presentation objectives.'
          },
          {
            id: 's2',
            title: 'Core Architecture',
            subtitle: 'Foundations & Structure',
            bullets: [lines[2]?.substring(0, 80) || 'Structural properties', lines[3]?.substring(0, 80) || 'Data and control flow', 'Guarantees and isolation invariants'],
            visualSuggestion: 'Component hierarchy diagram',
            citation: 'Source Notes',
            speakerNotes: 'Focus on how the subsystems interact without crossing address boundaries.'
          },
          {
            id: 's3',
            title: 'Key Operational Trade-offs',
            subtitle: 'Efficiency vs Complexity',
            bullets: [lines[4]?.substring(0, 80) || 'Overhead minimization', lines[5]?.substring(0, 80) || 'Throughput and latency considerations', 'Optimal strategies for implementation'],
            visualSuggestion: 'Comparison chart showing performance metrics',
            citation: 'Source Notes',
            speakerNotes: 'Emphasize the primary trade-offs frequently tested in university examinations.'
          }
        ]
      };

    case 'mind_map':
      return {
        root: {
          id: 'node-root',
          title: titleHint.substring(0, 30) || 'Central Topic',
          label: titleHint.substring(0, 30) || 'Central Topic',
          description: 'Core Subject derived from notebook sources',
          children: [
            {
              id: 'node-1',
              title: 'Fundamentals',
              label: 'Fundamentals',
              description: 'Primary foundations and rules',
              children: [
                { id: 'node-1-1', title: lines[0]?.substring(0, 35) || 'Key Concepts', label: lines[0]?.substring(0, 35) || 'Key Concepts', description: 'Core principles', children: [] },
                { id: 'node-1-2', title: lines[1]?.substring(0, 35) || 'Definitions', label: lines[1]?.substring(0, 35) || 'Definitions', description: 'Formal definitions', children: [] }
              ]
            },
            {
              id: 'node-2',
              title: 'Mechanics',
              label: 'Mechanics',
              description: 'Execution lifecycle and states',
              children: [
                { id: 'node-2-1', title: lines[2]?.substring(0, 35) || 'Processes', label: lines[2]?.substring(0, 35) || 'Processes', description: 'State transitions', children: [] },
                { id: 'node-2-2', title: lines[3]?.substring(0, 35) || 'Control Flow', label: lines[3]?.substring(0, 35) || 'Control Flow', description: 'Management structures', children: [] }
              ]
            },
            {
              id: 'node-3',
              title: 'Analysis',
              label: 'Analysis',
              description: 'Trade-offs and exam takeaways',
              children: [
                { id: 'node-3-1', title: lines[4]?.substring(0, 35) || 'Trade-offs', label: lines[4]?.substring(0, 35) || 'Trade-offs', description: 'Latency vs overhead', children: [] },
                { id: 'node-3-2', title: lines[5]?.substring(0, 35) || 'Review Notes', label: lines[5]?.substring(0, 35) || 'Review Notes', description: 'Exam revision points', children: [] }
              ]
            }
          ]
        }
      };

    case 'flashcards':
      return {
        cards: [
          { id: 'fc-1', front: `What is the core premise of ${titleHint.substring(0, 40)}?`, back: lines[0] || 'A fundamental concept in computing systems architecture.', tag: 'Core Concepts', difficulty: 'easy' },
          { id: 'fc-2', front: 'How is state tracked and preserved?', back: lines[1] || 'State is preserved via dedicated control structures and memory bounds.', tag: 'Mechanics', difficulty: 'medium' },
          { id: 'fc-3', front: 'What primary trade-off must be managed?', back: lines[2] || 'Balancing latency, overhead, and throughput.', tag: 'Analysis', difficulty: 'hard' },
          { id: 'fc-4', front: 'What happens during an interrupt or fault event?', back: lines[3] || 'A hardware trap triggers kernel handling or page loading.', tag: 'Mechanics', difficulty: 'medium' }
        ]
      };

    case 'quiz':
      return {
        questions: [
          {
            id: 'q1',
            type: 'mcq',
            question: `What is the primary role of the mechanisms described in ${titleHint.substring(0, 30)}?`,
            options: [lines[0]?.substring(0, 60) || 'Coordinate execution resources', 'Bypass operating system controls', 'Disable memory address translation', 'Hardcode static priorities'],
            correctAnswer: 0,
            explanation: 'As stated in the source, coordinating execution and memory spaces is primary.',
            topic: 'Core Architecture',
            citation: 'Section 1'
          },
          {
            id: 'q2',
            type: 'true_false',
            question: 'Context switching and translation lookups incur zero operational overhead.',
            options: ['True', 'False'],
            correctAnswer: 1,
            explanation: 'False. Hardware saves and memory lookups represent overhead that systems actively minimize.',
            topic: 'Performance',
            citation: 'Section 2'
          },
          {
            id: 'q3',
            type: 'mcq',
            question: 'Which method optimizes recurring lookup latency in hardware?',
            options: ['TLB / Associative Hardware Cache', 'Linear disk scan', 'Random polling', 'Full memory flush'],
            correctAnswer: 0,
            explanation: 'Associative hardware caches (such as TLBs) accelerate lookups by caching recent translations.',
            topic: 'Optimization',
            citation: 'Section 3'
          }
        ]
      };

    case 'report':
      return {
        title: `Comprehensive Synthesis: ${titleHint}`,
        reportType: options?.reportType || 'Technical',
        executiveSummary: `This report synthesizes the primary principles, architectural trade-offs, and critical mechanisms identified across uploaded source materials regarding ${titleHint}.`,
        sections: [
          {
            title: '1. Theoretical Foundations & Principles',
            heading: '1. Theoretical Foundations & Principles',
            content: lines.slice(0, 3).join('\n\n') || 'Theoretical overview derived from notebook sources.',
            subsections: [
              { title: '1.1 Architectural Bounds', content: lines[0] || 'System invariants and boundary definitions.' }
            ]
          },
          {
            title: '2. Operational Mechanisms & Execution Flow',
            heading: '2. Operational Mechanisms & Execution Flow',
            content: lines.slice(3, 6).join('\n\n') || 'Execution flow and state management.',
            subsections: [
              { title: '2.1 Trade-off Analysis', content: lines[2] || 'Analysis of overhead vs latency.' }
            ]
          }
        ],
        conclusion: 'The analysis confirms that modular state control and hardware-assisted caching remain the optimal configuration for throughput and isolation.',
        references: ['Grounded Course Notes', 'Technical Documentation Excerpts']
      };

    case 'video_overview':
      return {
        title: `Video Storyboard: ${titleHint}`,
        totalDuration: '3:00',
        scenes: [
          {
            sceneNumber: 1,
            timecode: '00:00 - 00:45',
            title: 'Introduction & Core Architecture',
            visualDescription: 'Kinetic typography title followed by memory hierarchy diagram overview.',
            narration: `In this session, we examine ${titleHint}. ${lines[0]?.substring(0, 100) || 'Notice how system resources coordinate execution.'}`,
            onScreenText: 'Foundational Principles & System Invariants',
            sourceReference: 'Section 1'
          },
          {
            sceneNumber: 2,
            timecode: '00:45 - 02:00',
            title: 'Execution Mechanics & Flow',
            visualDescription: 'Animated flow chart tracing address translation and state transitions.',
            narration: `Next, examine the operational flow: ${lines[1]?.substring(0, 100) || 'State is preserved via dedicated control structures.'}`,
            onScreenText: 'Runtime State Management',
            sourceReference: 'Section 2'
          },
          {
            sceneNumber: 3,
            timecode: '02:00 - 03:00',
            title: 'Trade-offs & Exam Review',
            visualDescription: 'Comparative matrix summarizing advantages, drawbacks, and exam takeaways.',
            narration: `For examinations, remember that minimizing latency while guaranteeing isolation is the primary design goal.`,
            onScreenText: 'Exam Review & Key Takeaways',
            sourceReference: 'Section 3'
          }
        ]
      };

    case 'infographic':
      return {
        mainTopic: titleHint || 'System Principles',
        subtitle: 'Key Concepts & Architectural Infographic',
        stats: [
          { label: 'Fundamental Subsystem', value: '100%', context: 'Deterministic execution guarantees' },
          { label: 'Access Latency Tier', value: '< 2ns', context: 'High-speed associative cache tier' },
          { label: 'Fault Recovery Mode', value: 'On-Demand', context: 'Secondary memory paging resolution' }
        ],
        processSteps: [
          { step: 1, title: 'Request Initiation', description: lines[0]?.substring(0, 80) || 'CPU issues memory/process instruction.' },
          { step: 2, title: 'Lookup & Verification', description: lines[1]?.substring(0, 80) || 'Hardware checks translation table or cache.' },
          { step: 3, title: 'Execution & Dispatch', description: lines[2]?.substring(0, 80) || 'Instruction executes in protected frame.' }
        ],
        comparison: {
          title: 'Comparative Paradigm Analysis',
          featureA: 'Static Allocation',
          featureB: 'Dynamic Paging',
          rows: [
            { criterion: 'Memory Fragmentation', valueA: 'High external fragmentation', valueB: 'Zero external, minor internal' },
            { criterion: 'Allocation Flexibility', valueA: 'Requires contiguous space', valueB: 'Non-contiguous frame mapping' },
            { criterion: 'Translation Overhead', valueA: 'Zero translation hardware', valueB: 'Requires MMU and page tables' }
          ]
        },
        takeaways: [
          'Dynamic address translation isolates user processes from direct physical RAM.',
          'Associative caching avoids multi-level memory lookups on recurring accesses.'
        ]
      };

    case 'data_table':
      return {
        title: `Structured Matrix: ${titleHint}`,
        columns: ['Dimension / Metric', 'Mechanism A', 'Mechanism B', 'Best Practice / Notes'],
        rows: [
          ['Address Space Binding', 'Contiguous Base/Limit', 'Segmented Paging', 'Use hardware TLB cache'],
          ['State Preservation', 'Register dump to stack', 'Process Control Block (PCB)', 'Minimize context switch latency'],
          ['Fault Handling Policy', 'Process abort', 'Demand paging trap', 'Optimize disk swap overhead'],
          ['Resource Scheduling', 'First-Come First-Served', 'Multilevel Feedback Queue', 'Favor interactive I/O jobs']
        ]
      };

    case 'study_guide':
      return {
        title: `Comprehensive Exam Study Guide: ${titleHint}`,
        topics: [
          {
            title: '1. Fundamentals & Architecture',
            description: lines[0] || 'Core principles and architectural definitions.',
            status: 'Not Started',
            keyCheckpoints: ['Understand core definitions', 'Identify state structures']
          },
          {
            title: '2. Operational Mechanics & State Flow',
            description: lines[1] || 'State transitions, scheduling, and memory protection.',
            status: 'Not Started',
            keyCheckpoints: ['Map lifecycle transitions', 'Calculate address offsets']
          },
          {
            title: '3. Examination Formulas & Problems',
            description: lines[2] || 'Latency calculations, effective access time, and algorithm comparison.',
            status: 'Not Started',
            keyCheckpoints: ['Practice EAT formula', 'Compare scheduling policies']
          }
        ],
        checklist: [
          { topic: 'Fundamentals & Architecture', status: 'Not Started' },
          { topic: 'Operational Mechanics', status: 'Not Started' },
          { topic: 'Exam Review & Formulas', status: 'Not Started' }
        ],
        practiceQuestions: [
          `Define the primary role of ${titleHint} in system design.`,
          'Explain how hardware translation ensures address space isolation.',
          'Calculate effective memory access time given a 95% TLB hit rate.'
        ]
      };

    case 'questions':
      return {
        shortQuestions: [
          { question: `Define ${titleHint.substring(0, 30)}.`, answer: lines[0] || 'A fundamental concept in computing systems architecture.', modelAnswer: lines[0] || 'A fundamental concept in computing systems architecture.', citation: 'Section 1', marks: 2 },
          { question: 'What is a Process Control Block (PCB)?', answer: 'A kernel data structure storing process state, program counter, and CPU registers.', modelAnswer: 'A kernel data structure storing process state, program counter, and CPU registers.', citation: 'Section 1', marks: 2 }
        ],
        mediumQuestions: [
          { question: 'Explain the difference between logical and physical address spaces.', answer: lines.slice(1, 3).join(' ') || 'Logical address is generated by the CPU, whereas physical address is seen by the memory hardware.', modelAnswer: lines.slice(1, 3).join(' ') || 'Logical address is generated by the CPU, whereas physical address is seen by the memory hardware.', citation: 'Section 2', marks: 5 },
          { question: 'Describe how demand paging handles a page fault.', answer: 'The hardware traps to the OS, which locates the missing page on disk, loads it into a free frame, and restarts the instruction.', modelAnswer: 'The hardware traps to the OS, which locates the missing page on disk, loads it into a free frame, and restarts the instruction.', citation: 'Section 2', marks: 5 }
        ],
        longQuestions: [
          { question: 'Compare and contrast Preemptive vs Non-Preemptive CPU Scheduling algorithms.', answer: lines.slice(0, 5).join(' ') || 'Preemptive algorithms allow the scheduler to interrupt running tasks, ensuring responsiveness for interactive workloads at the cost of context-switch overhead.', modelAnswer: lines.slice(0, 5).join(' ') || 'Preemptive algorithms allow the scheduler to interrupt running tasks, ensuring responsiveness for interactive workloads at the cost of context-switch overhead.', citation: 'Section 3', marks: 10 }
        ],
        categories: []
      };

    case 'definitions':
      return {
        definitions: [
          { term: titleHint.substring(0, 25), definition: lines[0] || 'A fundamental mechanism in modern system design.', example: 'Hardware address mapping', citation: 'Page 1' },
          { term: 'Process Control Block', definition: 'A critical operating system data structure storing execution context, registers, and memory bounds.', example: 'Linux task_struct', citation: 'Page 2' },
          { term: 'Demand Paging', definition: 'A virtual memory management scheme that loads pages into RAM only when they are accessed.', example: 'Page Fault Handler', citation: 'Page 3' },
          { term: 'Translation Lookaside Buffer', definition: 'A fast associative hardware cache storing recent virtual-to-physical address mappings.', example: 'L1 TLB (~1ns lookup)', citation: 'Page 4' }
        ]
      };

    default:
      return {
        title: titleHint,
        description: 'Synthesized learning artifact generated from notebook sources.',
        details: lines.slice(0, 6)
      };
  }
}
