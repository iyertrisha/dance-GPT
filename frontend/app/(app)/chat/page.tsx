"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  title: string;
  created_at: string;
}

function LoadingBubble() {
  return (
    <div
      className="flex min-h-[3rem] max-w-2xl items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3"
      aria-busy="true"
      aria-label="Assistant is composing a reply"
    >
      <span className="sr-only">Preparing answer…</span>
      <span
        className="size-2 animate-bounce rounded-full bg-accent/80"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="size-2 animate-bounce rounded-full bg-accent/80"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="size-2 animate-bounce rounded-full bg-accent/80"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; level: string } | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollMessagesToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const updateStickToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 96;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authApi.me();
        setUser({ email: userData.email, level: userData.level });

        let list = (await chatApi.getSessions()).sessions;
        if (list.length === 0) {
          const created = await chatApi.createSession("New Chat");
          list = [created];
        }
        setSessions(list);
        const active = list[0];
        setSessionId(active.id);
        const messagesData = await chatApi.getMessages(active.id);
        setMessages(messagesData.messages);
      } catch (err) {
        console.error("Failed to initialize:", err);
        router.push("/login");
      } finally {
        setSessionsLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateStickToBottom, { passive: true });
    return () => el.removeEventListener("scroll", updateStickToBottom);
  }, [sessionId]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    scrollMessagesToBottom(loading ? "auto" : "smooth");
  }, [messages, loading]);

  const selectSession = async (id: string) => {
    if (!id || id === sessionId) return;
    setSendError(null);
    stickToBottomRef.current = true;
    setSessionId(id);
    try {
      const messagesData = await chatApi.getMessages(id);
      setMessages(messagesData.messages);
    } catch (err) {
      console.error(err);
      setSendError(err instanceof Error ? err.message : "Could not load messages.");
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleNewChat = async () => {
    setSendError(null);
    try {
      const s = await chatApi.createSession("New Chat");
      setSessions((prev) => [s, ...prev]);
      setSessionId(s.id);
      setMessages([]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not start a new chat.");
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setSendError(null);
    setLoading(true);
    stickToBottomRef.current = true;

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    requestAnimationFrame(() => scrollMessagesToBottom("auto"));

    try {
      const response = await chatApi.sendMessage(userMessage, sessionId);

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Could not reach the server. Check your connection and try again.";
      setSendError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setInput(userMessage);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  if (!user || sessionsLoading || !sessionId) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 text-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner label="Loading chat" />
        <p className="text-muted-foreground">Loading your session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/25 md:flex"
        aria-label="Conversations"
      >
        <div className="border-b border-border p-3">
          <Button type="button" variant="primary" size="sm" className="w-full" onClick={handleNewChat}>
            New chat
          </Button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {sessions.map((s) => {
            const active = s.id === sessionId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => void selectSession(s.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
                  active
                    ? "bg-accent-muted text-white ring-1 ring-accent/35"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="block truncate font-medium">{s.title}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/20 px-3 py-2 md:hidden">
          <label htmlFor="session-picker" className="sr-only">
            Active conversation
          </label>
          <select
            id="session-picker"
            value={sessionId}
            onChange={(e) => void selectSession(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={handleNewChat}>
            New
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <div className="mt-10 text-center text-muted-foreground sm:mt-16">
                <p className="text-lg font-medium text-foreground">
                  Ask about Bharatanatyam Gandharva exams
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed">
                  Answers use your indexed study materials (syllabus, theory, and related text). Your
                  exam level filters what the tutor retrieves.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[min(100%,42rem)] flex-col gap-1 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {msg.role === "user" ? "You" : "Tutor"}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-lg ${
                        msg.role === "user"
                          ? "rounded-br-md bg-accent text-accent-foreground"
                          : "rounded-bl-md border border-border bg-card text-foreground"
                      }`}
                    >
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-[15px] leading-relaxed",
                          msg.role === "assistant" && "text-slate-200"
                        )}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading ? (
              <div className="flex justify-start">
                <div className="flex max-w-[min(100%,42rem)] flex-col items-start gap-1">
                  <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tutor
                  </span>
                  <LoadingBubble />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <form className="mx-auto max-w-3xl" onSubmit={handleSubmit}>
            {sendError ? <Alert className="mb-3">{sendError}</Alert> : null}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question from your materials…"
                disabled={loading}
                autoComplete="off"
                className="mt-0 flex-1 rounded-xl py-3"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl px-5"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
