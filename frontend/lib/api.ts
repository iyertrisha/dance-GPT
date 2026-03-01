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

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

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
