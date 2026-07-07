"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { authApi, flashcardsApi, type FlashcardDeckRow, type TemplateRow } from "@/lib/api";

export default function FlashcardsPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<FlashcardDeckRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [preferredLevel, setPreferredLevel] = useState<string>("");
  const [activeLevel, setActiveLevel] = useState<"Junior" | "Senior">("Junior");
  const [topic, setTopic] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCards, setCustomCards] = useState<Array<{ front: string; back: string }>>([
    { front: "", back: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [savingCustom, setSavingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [decksData, juniorTemplates, seniorTemplates] = await Promise.all([
      flashcardsApi.listDecks(),
      flashcardsApi.listTemplates("Junior"),
      flashcardsApi.listTemplates("Senior"),
    ]);
    setDecks(decksData.decks);
    setTemplates([...juniorTemplates.templates, ...seniorTemplates.templates]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        setPreferredLevel(me.level);
        if (me.level === "Junior" || me.level === "Senior") {
          setActiveLevel(me.level);
        }
        await refresh();
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const syllabusDecks = useMemo(() => {
    return templates.filter((t) => t.level === activeLevel);
  }, [templates, activeLevel]);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    const t = topic.trim();
    if (!t) {
      setError("Enter a topic to generate flashcards.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await flashcardsApi.generate(t, {
        title: deckTitle.trim() || undefined,
      });
      setTopic("");
      setDeckTitle("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const onLoadTemplate = async (templateId: string) => {
    setLoadingTemplate(templateId);
    setError(null);
    try {
      const result = await flashcardsApi.loadTemplate(templateId);
      await refresh();
      router.push(`/flashcards/decks/${result.deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoadingTemplate(null);
    }
  };

  const onSaveCustom = async (e: FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim();
    if (!title) {
      setError("Deck title is required.");
      return;
    }
    const validCards = customCards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      setError("Add at least one card with both front and back filled.");
      return;
    }
    setSavingCustom(true);
    setError(null);
    try {
      await flashcardsApi.createCustom(title, validCards);
      setCustomTitle("");
      setCustomCards([{ front: "", back: "" }]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deck");
    } finally {
      setSavingCustom(false);
    }
  };

  const addCustomCard = () => {
    setCustomCards([...customCards, { front: "", back: "" }]);
  };

  const updateCustomCard = (index: number, field: "front" | "back", value: string) => {
    const updated = [...customCards];
    updated[index][field] = value;
    setCustomCards(updated);
  };

  const removeCustomCard = (index: number) => {
    if (customCards.length > 1) {
      setCustomCards(customCards.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-white">
        <div className="size-12 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold text-white">Flashcards</h1>
        <p className="text-sm text-slate-400">
          Study with pre-made syllabus decks, generate AI flashcards from topics, or create your
          own cards.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-auto w-full max-w-5xl rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {/* ── Syllabus Flashcards section ── */}
      <section className="mx-auto w-full max-w-5xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-200">Syllabus Flashcards</h2>
          {preferredLevel && (
            <span className="text-xs text-slate-500">Your level: {preferredLevel}</span>
          )}
        </div>

        {/* Level tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 p-1 w-fit">
          {(["Junior", "Senior"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveLevel(lvl)}
              className={`rounded-md px-5 py-2 text-sm font-medium transition-all ${
                activeLevel === lvl
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Template grid — square cards */}
        {syllabusDecks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No syllabus flashcard decks available for {activeLevel} yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {syllabusDecks.map((t) => {
              const isLoading = loadingTemplate === t.id;
              const shortTitle = t.title.replace(/^(Junior|Senior):\s*/i, "");
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onLoadTemplate(t.id)}
                  disabled={isLoading}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 text-center transition-all hover:border-purple-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-purple-900/20 disabled:opacity-50"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 transition-colors group-hover:bg-purple-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
                  </div>
                  <span className="text-sm font-medium leading-tight text-white line-clamp-2">
                    {shortTitle}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {isLoading ? "Loading..." : "Study"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── AI Generate from Topic ── */}
      <section className="mx-auto w-full max-w-5xl space-y-4">
        <h2 className="text-lg font-medium text-slate-200">AI Generate from Topic</h2>
        <form
          onSubmit={onGenerate}
          className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4"
        >
          <label className="block text-sm text-slate-300">
            Topic
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Alarippu, hasta mudras"
              disabled={generating}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Deck title (optional)
            <input
              type="text"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="Defaults to 'Flashcards: ...' from topic"
              disabled={generating}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
            />
          </label>
          <button
            type="submit"
            disabled={generating || !topic.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate flashcards"}
          </button>
        </form>
      </section>

      {/* ── Create Manually ── */}
      <section className="mx-auto w-full max-w-5xl space-y-4">
        <h2 className="text-lg font-medium text-slate-200">Create Manually</h2>
        <form
          onSubmit={onSaveCustom}
          className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4"
        >
          <label className="block text-sm text-slate-300">
            Deck title
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="My Custom Deck"
              disabled={savingCustom}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
            />
          </label>
          <div className="space-y-3">
            {customCards.map((card, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={card.front}
                  onChange={(e) => updateCustomCard(idx, "front", e.target.value)}
                  placeholder="Front (question)"
                  disabled={savingCustom}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
                />
                <input
                  type="text"
                  value={card.back}
                  onChange={(e) => updateCustomCard(idx, "back", e.target.value)}
                  placeholder="Back (answer)"
                  disabled={savingCustom}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
                />
                {customCards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCustomCard(idx)}
                    disabled={savingCustom}
                    className="rounded-lg border border-slate-600 px-3 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustomCard}
              disabled={savingCustom}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
            >
              + Add card
            </button>
            <button
              type="submit"
              disabled={savingCustom || !customTitle.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {savingCustom ? "Saving..." : "Save deck"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Your Study Sets ── */}
      <section className="mx-auto w-full max-w-5xl">
        <h2 className="mb-4 text-lg font-medium text-slate-200">Your Study Sets</h2>
        {decks.length === 0 ? (
          <p className="text-sm text-slate-500">No decks yet. Create one above.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/flashcards/decks/${d.id}`}
                  className="block h-full rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 transition-colors hover:border-purple-500/40 hover:bg-slate-800"
                >
                  <h3 className="font-medium text-white line-clamp-2">{d.title}</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    {d.level}
                    {d.topic ? ` · ${d.topic}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
