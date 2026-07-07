"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const tabs = [
  { href: "/chat", label: "Tutor", match: (p: string) => p.startsWith("/chat") },
  { href: "/notes", label: "My Notes", match: (p: string) => p.startsWith("/notes") },
  {
    href: "/flashcards",
    label: "Flashcards",
    match: (p: string) => p.startsWith("/flashcards"),
  },
  {
    href: "https://drive.google.com/drive/folders/1CVV0buNe4DZHQJKTYr2L_2XlWP7jtioq",
    label: "Notes Archive",
    match: () => false,
    external: true,
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; level: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) router.push("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = async () => {
    try {
      await authApi.logout();
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner label="Loading your workspace" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-foreground">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-6">
          <Link
            href="/chat"
            className="shrink-0 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-accent"
          >
            Dance<span className="text-accent">GPT</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Study suite">
            {tabs.map((t) => {
              const active = t.match(pathname);
              if ("external" in t && t.external) {
                return (
                  <a
                    key={t.href}
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {t.label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                );
              }
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    active
                      ? "bg-accent-muted text-white ring-1 ring-accent/40"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <p className="hidden max-w-[14rem] truncate text-xs text-muted-foreground md:block lg:max-w-xs">
            {user.email} · {user.level}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
