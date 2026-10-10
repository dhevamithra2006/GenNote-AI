import { Router, Request, Response } from 'express';
import { db, User, Notebook, Artifact, ArtifactType } from './db.js';
import { processSource } from './ingestion.js';
import { retrieveRelevantChunks } from './rag.js';
import { generateRAGAnswer, generateStudioArtifact, getAIConfigStatus } from './ai.js';

export const apiRouter = Router();

// AI Configuration Health Check (Requirement 9: reports whether key is configured without revealing value)
apiRouter.get('/ai/health', (req: Request, res: Response) => {
  res.json(getAIConfigStatus());
});

// Middleware to extract user from session/header
function getUserId(req: Request): string {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Default to demo user for frictionless immediate testing
  return 'demo-user-1';
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  let existing = db.getUserByEmail(email);
  if (existing) {
    return res.json({ user: existing, token: existing.id });
  }

  const user: User = {
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    email,
    name,
    createdAt: new Date().toISOString()
  };

  db.createUser(user);
  res.json({ user, token: user.id });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    // Auto-create user if not found for seamless trial
    user = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    db.createUser(user);
  }

  res.json({ user, token: user.id });
});

apiRouter.post('/auth/demo', (req: Request, res: Response) => {
  const user = db.getUserById('demo-user-1') || {
    id: 'demo-user-1',
    email: 'alex@gennote.ai',
    name: 'Alex Rivera',
    createdAt: new Date().toISOString()
  };
  res.json({ user, token: user.id });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.getUserById(userId) || db.getUserById('demo-user-1');
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({ user });
});

// -------------------------------------------------------------
// NOTEBOOKS ROUTES
// -------------------------------------------------------------
apiRouter.get('/notebooks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notebooks = db.getNotebooks(userId);
  const enriched = notebooks.map(n => {
    const stats = db.getNotebookStats(n.id);
    return { ...n, ...stats };
  });
  res.json({ notebooks: enriched });
});

apiRouter.post('/notebooks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, description, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Notebook title is required' });
  }

  const notebook: Notebook = {
    id: 'nb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId,
    title: title.trim(),
    description: (description || '').trim(),
    category: (category || 'General').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createNotebook(notebook);
  res.status(201).json({ notebook: { ...notebook, sourcesCount: 0, artifactsCount: 0 } });
});

apiRouter.get('/notebooks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notebook = db.getNotebook(req.params.id, userId);
  if (!notebook) {
    return res.status(404).json({ error: 'Notebook not found' });
  }
  const stats = db.getNotebookStats(notebook.id);
  res.json({ notebook: { ...notebook, ...stats } });
});

apiRouter.put('/notebooks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, description, category } = req.body;
  const updated = db.updateNotebook(req.params.id, userId, {
    ...(title ? { title: title.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
    ...(category !== undefined ? { category: category.trim() } : {})
  });
  if (!updated) {
    return res.status(404).json({ error: 'Notebook not found' });
  }
  const stats = db.getNotebookStats(updated.id);
  res.json({ notebook: { ...updated, ...stats } });
});

apiRouter.delete('/notebooks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const success = db.deleteNotebook(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: 'Notebook not found' });
  }
  res.json({ success: true });
});

apiRouter.post('/notebooks/:id/duplicate', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sourceNb = db.getNotebook(req.params.id, userId);
  if (!sourceNb) {
    return res.status(404).json({ error: 'Notebook not found' });
  }

  const newNb: Notebook = {
    id: 'nb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId,
    title: `${sourceNb.title} (Copy)`,
    description: sourceNb.description,
    category: sourceNb.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createNotebook(newNb);

  // Copy sources
  const sources = db.getSources(sourceNb.id);
  for (const src of sources) {
    const newSrcId = 'src-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newSrc = {
      ...src,
      id: newSrcId,
      notebookId: newNb.id,
      createdAt: new Date().toISOString()
    };
    db.createSource(newSrc);
    const chunks = db.getChunks(sourceNb.id, [src.id]);
    db.saveChunks(chunks.map(c => ({
      ...c,
      id: 'chunk-' + newSrcId + '-' + c.chunkIndex,
      sourceId: newSrcId,
      notebookId: newNb.id
    })));
  }

  const stats = db.getNotebookStats(newNb.id);
  res.json({ notebook: { ...newNb, ...stats } });
});

// -------------------------------------------------------------
// SOURCES ROUTES
// -------------------------------------------------------------
apiRouter.get('/notebooks/:id/sources', (req: Request, res: Response) => {
  const sources = db.getSources(req.params.id);
  res.json({ sources });
});

apiRouter.post('/notebooks/:id/sources/process', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notebookId = req.params.id;
  const { type, title, originalName, content, url, fileBase64, mimeType, fileSize } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Source type is required' });
  }

  try {
    const source = await processSource({
      notebookId,
      userId,
      type,
      title,
      originalName,
      content,
      url,
      fileBase64,
      mimeType,
      fileSize
    });

    db.updateNotebook(notebookId, userId, {});
    res.status(201).json({ source });
  } catch (err: any) {
    console.error('Source processing error:', err);
    res.status(500).json({ error: err.message || 'Error processing source' });
  }
});

apiRouter.get('/sources/:id', (req: Request, res: Response) => {
  const source = db.getSource(req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  const chunks = db.getChunks(source.notebookId, [source.id]);
  res.json({ source, chunks });
});

apiRouter.put('/sources/:id', (req: Request, res: Response) => {
  const { title } = req.body;
  const updated = db.updateSource(req.params.id, { ...(title ? { title: title.trim() } : {}) });
  if (!updated) {
    return res.status(404).json({ error: 'Source not found' });
  }
  res.json({ source: updated });
});

apiRouter.delete('/sources/:id', (req: Request, res: Response) => {
  const source = db.getSource(req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  db.deleteSource(req.params.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// CHAT & RAG GROUNDING ROUTES
// -------------------------------------------------------------
apiRouter.get('/notebooks/:id/chat', (req: Request, res: Response) => {
  const notebookId = req.params.id;
  const messages = db.getMessages(notebookId);
  res.json({ messages });
});

apiRouter.post('/notebooks/:id/chat', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notebookId = req.params.id;
  const { message, selectedSourceIds, language = 'en', mode = 'study' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const conv = db.getConversation(notebookId, userId);

  // 1. Store User Message
  const userMsg = db.addMessage({
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    conversationId: conv.id,
    notebookId,
    role: 'user',
    content: message.trim(),
    createdAt: new Date().toISOString()
  });

  try {
    // 2. Retrieve Relevant Grounding Chunks (Multilingual lexical matching)
    const relevantChunks = await retrieveRelevantChunks(notebookId, message.trim(), selectedSourceIds, 5);

    // 3. Generate Grounded Answer with Citations, Language, Mode & History
    const recentMessages = db.getMessages(notebookId);
    const history = recentMessages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    const { text, citations } = await generateRAGAnswer(
      message.trim(),
      relevantChunks,
      history,
      language as 'en' | 'ta' | 'hi',
      mode as 'study' | 'research'
    );

    // 4. Store Assistant Message
    const assistantMsg = db.addMessage({
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substring(2, 6),
      conversationId: conv.id,
      notebookId,
      role: 'assistant',
      content: text,
      citations,
      createdAt: new Date().toISOString()
    });

    res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate response: ' + err.message });
  }
});

apiRouter.delete('/notebooks/:id/chat', (req: Request, res: Response) => {
  db.clearMessages(req.params.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// AI STUDIO ARTIFACTS ROUTES
// -------------------------------------------------------------
apiRouter.get('/notebooks/:id/artifacts', (req: Request, res: Response) => {
  const artifacts = db.getArtifacts(req.params.id);
  res.json({ artifacts });
});

apiRouter.get('/artifacts/:id', (req: Request, res: Response) => {
  const artifact = db.getArtifact(req.params.id);
  if (!artifact) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  res.json({ artifact });
});

apiRouter.post('/notebooks/:id/artifacts/generate', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notebookId = req.params.id;
  const { type, title, instruction, options = {}, sourceIds, language = 'en', mode = 'study' } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Artifact type is required' });
  }

  try {
    // Gather sources text
    const sources = db.getSources(notebookId);
    const targetSources = sourceIds && sourceIds.length > 0
      ? sources.filter(s => sourceIds.includes(s.id))
      : sources;

    // Check if there is video metadata (scenes, transcript)
    const videoSource = targetSources.find(s => s.type === 'video' || s.metadata?.hasScenes);
    if (videoSource && videoSource.metadata?.scenes && !options.detectedScenes) {
      options.detectedScenes = videoSource.metadata.scenes;
      options.detectedTranscript = videoSource.metadata.transcript;
    }

    const sourcesText = targetSources
      .map(s => {
        let header = `[SOURCE: ${s.title} (${s.type.toUpperCase()})]`;
        if (s.pageCount) header += ` [${s.pageCount} Pages]`;
        if (s.slideCount) header += ` [${s.slideCount} Slides]`;
        if (s.metadata?.duration) header += ` [Duration: ${s.metadata.duration}]`;
        return `${header}\n${s.extractedText}`;
      })
      .join('\n\n---\n\n');

    if (!sourcesText.trim()) {
      return res.status(400).json({ error: 'Please upload at least one source before generating studio artifacts.' });
    }

    const generatedContent = await generateStudioArtifact(
      type,
      sourcesText,
      instruction,
      options,
      language as 'en' | 'ta' | 'hi',
      mode as 'study' | 'research'
    );

    const artifact: Artifact = {
      id: 'art-' + type + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      notebookId,
      userId,
      type: type as ArtifactType,
      title: title || `${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${new Date().toLocaleDateString()})`,
      content: generatedContent,
      settings: { ...options, language, mode },
      sourceIds: targetSources.map(s => s.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createArtifact(artifact);
    db.updateNotebook(notebookId, userId, {});

    res.status(201).json({ artifact });
  } catch (err: any) {
    console.error(`Error generating ${type}:`, err);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

apiRouter.put('/artifacts/:id', (req: Request, res: Response) => {
  const { title, content } = req.body;
  const updated = db.updateArtifact(req.params.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(content ? { content } : {})
  });
  if (!updated) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  res.json({ artifact: updated });
});

apiRouter.delete('/artifacts/:id', (req: Request, res: Response) => {
  const success = db.deleteArtifact(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  res.json({ success: true });
});

apiRouter.post('/artifacts/:id/duplicate', (req: Request, res: Response) => {
  const sourceArt = db.getArtifact(req.params.id);
  if (!sourceArt) {
    return res.status(404).json({ error: 'Artifact not found' });
  }

  const newArt: Artifact = {
    ...sourceArt,
    id: 'art-' + sourceArt.type + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    title: `${sourceArt.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createArtifact(newArt);
  res.json({ artifact: newArt });
});

// -------------------------------------------------------------
// NOTEBOOK-WIDE SEARCH
// -------------------------------------------------------------
apiRouter.get('/notebooks/:id/search', (req: Request, res: Response) => {
  const notebookId = req.params.id;
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  if (!query) {
    return res.json({ results: [] });
  }

  const results: Array<{ type: string; title: string; excerpt: string; id: string; targetTab?: string }> = [];

  // 1. Search Sources & Chunks
  const sources = db.getSources(notebookId);
  for (const src of sources) {
    if (src.title.toLowerCase().includes(query)) {
      results.push({
        type: 'Source',
        title: src.title,
        excerpt: src.extractedText.substring(0, 160) + '...',
        id: src.id,
        targetTab: 'sources'
      });
    }
  }

  const chunks = db.getChunks(notebookId);
  for (const ch of chunks) {
    if (ch.content.toLowerCase().includes(query)) {
      const src = db.getSource(ch.sourceId);
      results.push({
        type: 'Source Passage',
        title: `${src?.title || 'Document'} — Page ${ch.pageNumber || 1}`,
        excerpt: ch.content.substring(0, 180) + '...',
        id: ch.sourceId,
        targetTab: 'sources'
      });
      if (results.length > 8) break;
    }
  }

  // 2. Search Chat
  const messages = db.getMessages(notebookId);
  for (const msg of messages) {
    if (msg.content.toLowerCase().includes(query)) {
      results.push({
        type: msg.role === 'user' ? 'Question' : 'AI Answer',
        title: msg.role === 'user' ? 'Chat Query' : 'Chat Answer',
        excerpt: msg.content.substring(0, 160) + '...',
        id: msg.id,
        targetTab: 'chat'
      });
      if (results.length > 12) break;
    }
  }

  // 3. Search Artifacts
  const artifacts = db.getArtifacts(notebookId);
  for (const art of artifacts) {
    const rawContent = JSON.stringify(art.content).toLowerCase();
    if (art.title.toLowerCase().includes(query) || rawContent.includes(query)) {
      results.push({
        type: art.type.replace(/_/g, ' ').toUpperCase(),
        title: art.title,
        excerpt: `Generated learning artifact (${art.type}) matching query.`,
        id: art.id,
        targetTab: 'studio'
      });
    }
  }

  res.json({ results });
});
