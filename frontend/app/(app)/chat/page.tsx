"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi } from "@/lib/api";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; level: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch user info and create/get session
    const init = async () => {
      try {
        const userData = await authApi.me();
        setUser(userData);

        // Get or create a chat session
        const sessionsData = await chatApi.getSessions();
        if (sessionsData.sessions.length > 0) {
          const latestSession = sessionsData.sessions[0];
          setSessionId(latestSession.id);
          const messagesData = await chatApi.getMessages(latestSession.id);
          setMessages(messagesData.messages);
        } else {
          const newSession = await chatApi.createSession("New Chat");
          setSessionId(newSession.id);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
        router.push("/login");
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatApi.sendMessage(userMessage, sessionId);

      // Add assistant message
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold">
            Dance<span className="text-purple-400">GPT</span>
          </h1>
          <p className="text-sm text-slate-400">
            {user.email} • {user.level}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700"
        >
          Logout
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-12">
            <p className="text-lg">Start a conversation about Bharatanatyam!</p>
            <p className="text-sm mt-2">Ask me anything about your study materials.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-2xl px-4 py-3 rounded-lg bg-slate-800 text-slate-100">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
