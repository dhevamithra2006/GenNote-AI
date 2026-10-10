import { Notebook, Source, ChatMessage, Artifact, SearchResult, User } from '../types';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gennote_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async register(name: string, email: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    return handleResponse(res);
  },

  async demoLogin(): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Notebooks
  async getNotebooks(): Promise<{ notebooks: Notebook[] }> {
    const res = await fetch('/api/notebooks', {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getNotebook(id: string): Promise<{ notebook: Notebook }> {
    const res = await fetch(`/api/notebooks/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createNotebook(data: { title: string; description?: string; category?: string }): Promise<{ notebook: Notebook }> {
    const res = await fetch('/api/notebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateNotebook(id: string, data: { title?: string; description?: string; category?: string }): Promise<{ notebook: Notebook }> {
    const res = await fetch(`/api/notebooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteNotebook(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notebooks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async duplicateNotebook(id: string): Promise<{ notebook: Notebook }> {
    const res = await fetch(`/api/notebooks/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Sources
  async getSources(notebookId: string): Promise<{ sources: Source[] }> {
    const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSource(id: string): Promise<{ source: Source; chunks: any[] }> {
    const res = await fetch(`/api/sources/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async processSource(notebookId: string, payload: any): Promise<{ source: Source }> {
    const res = await fetch(`/api/notebooks/${notebookId}/sources/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateSource(id: string, title: string): Promise<{ source: Source }> {
    const res = await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ title })
    });
    return handleResponse(res);
  },

  async deleteSource(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/sources/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Chat
  async getChat(notebookId: string): Promise<{ messages: ChatMessage[] }> {
    const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async sendMessage(
    notebookId: string,
    message: string,
    selectedSourceIds?: string[],
    language: string = 'en',
    mode: string = 'study'
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ message, selectedSourceIds, language, mode })
    });
    return handleResponse(res);
  },

  async clearChat(notebookId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // AI Studio Artifacts
  async getArtifacts(notebookId: string): Promise<{ artifacts: Artifact[] }> {
    const res = await fetch(`/api/notebooks/${notebookId}/artifacts`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getArtifact(id: string): Promise<{ artifact: Artifact }> {
    const res = await fetch(`/api/artifacts/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async generateArtifact(
    notebookId: string,
    data: {
      type: string;
      title?: string;
      instruction?: string;
      options?: any;
      sourceIds?: string[];
      language?: string;
      mode?: string;
    }
  ): Promise<{ artifact: Artifact }> {
    const res = await fetch(`/api/notebooks/${notebookId}/artifacts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateArtifact(id: string, data: { title?: string; content?: any }): Promise<{ artifact: Artifact }> {
    const res = await fetch(`/api/artifacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteArtifact(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/artifacts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async duplicateArtifact(id: string): Promise<{ artifact: Artifact }> {
    const res = await fetch(`/api/artifacts/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Search
  async search(notebookId: string, query: string): Promise<{ results: SearchResult[] }> {
    const res = await fetch(`/api/notebooks/${notebookId}/search?q=${encodeURIComponent(query)}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};
