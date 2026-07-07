const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE_URL}. Start Postgres (docker compose up -d), then run: cd api && npm run dev`
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(error.error || "An error occurred");
  }

  return response.json();
}

// Auth API
export const authApi = {
  signup: (email: string, password: string, level: string) =>
    fetchApi("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, level }),
    }),

  login: (email: string, password: string) =>
    fetchApi<{ id: string; email: string; level: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    fetchApi("/auth/logout", {
      method: "POST",
    }),

  me: () =>
    fetchApi<{ id: string; email: string; level: string }>("/auth/me"),
};

// Chat API
export const chatApi = {
  getSessions: () =>
    fetchApi<{ sessions: Array<{ id: string; title: string; created_at: string }> }>(
      "/chat/sessions"
    ),

  createSession: (title?: string) =>
    fetchApi<{ id: string; title: string; created_at: string }>(
      "/chat/sessions",
      {
        method: "POST",
        body: JSON.stringify({ title }),
      }
    ),

  getMessages: (sessionId: string) =>
    fetchApi<{
      messages: Array<{
        id: string;
        role: string;
        content: string;
        created_at: string;
      }>;
    }>(`/chat/sessions/${sessionId}/messages`),

  sendMessage: (content: string, sessionId: string) =>
    fetchApi<{ answer: string }>("/chat/message", {
      method: "POST",
      body: JSON.stringify({ content, session_id: sessionId }),
    }),
};

export interface NoteRow {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export const notesApi = {
  list: () => fetchApi<{ notes: NoteRow[] }>("/notes"),
  get: (id: string) => fetchApi<NoteRow>(`/notes/${id}`),
  create: (content: string, title?: string | null) =>
    fetchApi<NoteRow>("/notes", {
      method: "POST",
      body: JSON.stringify({ title: title ?? null, content }),
    }),
  update: (id: string, content: string, title?: string | null) =>
    fetchApi<NoteRow>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title: title ?? null, content }),
    }),
  delete: (id: string) => fetchApi<{ ok: boolean }>(`/notes/${id}`, { method: "DELETE" }),
};

export interface FlashcardDeckRow {
  id: string;
  title: string;
  level: string;
  topic: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateRow {
  id: string;
  title: string;
  level: string;
  topic: string | null;
  created_at: string;
}

export interface DeckCardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  mastery_level: number;
  created_at: string;
}

export const flashcardsApi = {
  listDecks: () => fetchApi<{ decks: FlashcardDeckRow[] }>("/flashcards/decks"),
  getDeckCards: (deckId: string) =>
    fetchApi<{ deck: FlashcardDeckRow; cards: DeckCardRow[] }>(
      `/flashcards/decks/${deckId}/cards`
    ),
  generate: (topic: string, options?: { title?: string; level?: string }) =>
    fetchApi<{
      deck: { id: string; title: string; level: string; topic: string };
      cards: DeckCardRow[];
      warning: string | null;
    }>("/flashcards/generate", {
      method: "POST",
      body: JSON.stringify({
        topic,
        title: options?.title,
        level: options?.level,
      }),
    }),
  updateMastery: (cardId: string, mastery_level: number) =>
    fetchApi<DeckCardRow>(`/flashcards/cards/${cardId}/mastery`, {
      method: "PATCH",
      body: JSON.stringify({ mastery_level }),
    }),
  listTemplates: (level?: string) =>
    fetchApi<{ templates: TemplateRow[] }>("/flashcards/templates", {
      params: level ? { level } : undefined,
    }),
  loadTemplate: (templateId: string) =>
    fetchApi<{
      deck: { id: string; title: string; level: string; topic: string };
      cards: DeckCardRow[];
    }>(`/flashcards/load-template/${templateId}`, {
      method: "POST",
    }),
  createCustom: (title: string, cards: Array<{ front: string; back: string }>) =>
    fetchApi<{
      deck: { id: string; title: string; level: string };
      cards: DeckCardRow[];
    }>("/flashcards/custom", {
      method: "POST",
      body: JSON.stringify({ title, cards }),
    }),
};
